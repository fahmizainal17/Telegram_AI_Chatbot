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
 * 4. Responds naturally by sending a random "thinking" message before generating AI responses.
 * 5. Catches and handles errors gracefully.
 *
 * Environment Variables:
 * - TELEGRAM_BOT_TOKEN: Your Telegram Bot API token.
 * - GEMINI_API_KEY: Your Gemini AI API key.
 */

const TelegramBot = require('node-telegram-bot-api');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const conversations = {};

async function generateAIResponse(userMessage, userId) {
  try {
    if (!conversations[userId]) conversations[userId] = [];

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    let responseText;

    if (conversations[userId].length > 0) {
      const chat = model.startChat({
        history: conversations[userId]
      });

      const result = await chat.sendMessage(userMessage);
      responseText = result.response.text();
    } else {
      const result = await model.generateContent(userMessage);
      responseText = result.response.text();
    }

    conversations[userId].push({ role: 'user', parts: [{ text: userMessage }] });
    conversations[userId].push({ role: 'model', parts: [{ text: responseText }] });

    if (conversations[userId].length > 20) {
      conversations[userId] = conversations[userId].slice(-20);
    }

    return responseText;
}

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, "Hey there! I'm your friendly AI assistant 😊. Feel free to ask me anything!");
});

bot.onText(/\/help/, (msg) => {
  bot.sendMessage(msg.chat.id, "Just send me any message, and we'll chat! You can also use these commands:\n/start - Let's begin chatting\n/help - Need a hand?\n/reset - Clear our previous chats");
});

bot.onText(/\/reset/, (msg) => {
  const userId = msg.from.id.toString();
  delete conversations[userId];
  bot.sendMessage(msg.chat.id, "Alright, I've cleared our chat history. Let's chat anew!");
});

bot.on('message', async (msg) => {
  if (msg.text && msg.text.startsWith('/')) return;

  const chatId = msg.chat.id;
  const userId = msg.from.id.toString();
  const userMessage = msg.text;

  bot.sendChatAction(chatId, 'typing');

  try {
    const thinkingMessages = [
      "Hmm, let me think about that...",
      "Just a moment, please!",
      "Hang tight, thinking about that...",
      "One moment, let me see what I can find...",
      "Great question, give me a sec!"
    ];

    const thinkingMsg = thinkingMessages[Math.floor(Math.random() * thinkingMessages.length)];
    await bot.sendMessage(chatId, thinkingMsg);

    const aiResponse = await generateAIResponse(userMessage, userId);
    bot.sendMessage(chatId, aiResponse);
  } catch (error) {
    console.error('Oops, encountered an issue:', error);
    bot.sendMessage(chatId, "Oops, something went wrong. Mind trying again?");
  }
});

bot.on('polling_error', (error) => console.error('Polling error:', error));

console.log('Telegram AI Chatbot is now happily chatting!');
