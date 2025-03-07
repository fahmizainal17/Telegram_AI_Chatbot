/**
 * Telegram AI Chatbot
 *
 * This script creates a Telegram chatbot powered by Google's Gemini AI (gemini-2.0-flash).
 * It listens for user messages, handles basic commands (/start, /help, /reset),
 * and manages multi-turn conversations by maintaining a history of interactions.
 *
 * Workflow:
 * 1. Initializes the Telegram bot and Gemini AI client.
 * 2. Defines command handlers to provide a friendly interaction experience.
 * 3. Stores conversation history temporarily in memory to maintain context.
 * 4. Responds naturally by generating an AI response from Gemini.
 * 5. Catches and handles errors gracefully.
 *
 * Environment Variables:
 * - TELEGRAM_BOT_TOKEN: Your Telegram Bot API token.
 * - GEMINI_API_KEY: Your Gemini AI API key.
 */
const http = require('http');
const port = process.env.PORT || 7860;

http.createServer((req, res) => {
  res.writeHead(200, {'Content-Type': 'text/plain'});
  res.end('Bot is running.\n');
}).listen(port, () => {
  console.log(`HTTP server is listening on port ${port}`);
});

const TelegramBot = require('node-telegram-bot-api');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// To store conversation history in memory:
const conversations = {};

async function generateAIResponse(userMessage, userId) {
  try {
    // Initialize conversation if it doesn't exist yet
    if (!conversations[userId]) conversations[userId] = [];

    // Use the Gemini model
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // Include a friendly prompt style, without fancy formatting
    const friendlyPrompt = 
      "Please reply in a casual, friendly, and conversational style without using markdown, bold formatting, or bullet points. " +
      "Make your reply sound natural and human-like.\n\n" + 
      userMessage;

    let responseText;

    // If we have conversation history, continue the chat
    if (conversations[userId].length > 0) {
      const chat = model.startChat({ history: conversations[userId] });
      const result = await chat.sendMessage(friendlyPrompt);
      responseText = result.response.text();
    } else {
      // Otherwise, just do a single-shot generation
      const result = await model.generateContent(friendlyPrompt);
      responseText = result.response.text();
    }

    // Push user message and AI response to memory
    conversations[userId].push({ role: 'user', parts: [{ text: userMessage }] });
    conversations[userId].push({ role: 'model', parts: [{ text: responseText }] });

    // Limit conversation history to the last 20 entries
    if (conversations[userId].length > 20) {
      conversations[userId] = conversations[userId].slice(-20);
    }

    return responseText;
  } catch (error) {
    console.error('Error generating AI response:', error);
    return "Sorry, I couldn't process that. Can you try asking again?";
  }
}

// Start command
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(
    msg.chat.id,
    "Hey there! I'm your friendly AI assistant. Feel free to ask me anything!"
  );
});

// Help command
bot.onText(/\/help/, (msg) => {
  bot.sendMessage(
    msg.chat.id,
    "Just send me any message, and we'll chat!\n" +
    "You can also use these commands:\n" +
    "/start - Let's begin chatting\n" +
    "/help - Need a hand?\n" +
    "/reset - Clear our previous chats"
  );
});

// Reset command
bot.onText(/\/reset/, (msg) => {
  const userId = msg.from.id.toString();
  delete conversations[userId];
  bot.sendMessage(msg.chat.id, "Alright, I've cleared our chat history. Let's chat anew!");
});

// Handle normal messages
bot.on('message', async (msg) => {
  // Ignore commands
  if (msg.text && msg.text.startsWith('/')) return;

  const chatId = msg.chat.id;
  const userId = msg.from.id.toString();
  const userMessage = msg.text;

  // Show typing action, but don’t send a "thinking" message
  bot.sendChatAction(chatId, 'typing');

  try {
    const aiResponse = await generateAIResponse(userMessage, userId);
    bot.sendMessage(chatId, aiResponse);
  } catch (error) {
    console.error('Oops, encountered an issue:', error);
    bot.sendMessage(chatId, "Oops, something went wrong. Mind trying again?");
  }
});

// Polling errors
bot.on('polling_error', (error) => console.error('Polling error:', error));

console.log('Telegram AI Chatbot is now happily chatting!');
