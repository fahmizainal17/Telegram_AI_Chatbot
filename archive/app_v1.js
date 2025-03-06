const TelegramBot = require('node-telegram-bot-api');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

// Initialize Telegram Bot with token
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });

// Initialize Gemini AI with your API key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Store conversation history (temporary, for demo)
const conversations = {};

// Generate AI response using Gemini 2.0 Flash
async function generateAIResponse(userMessage, userId) {
  try {
    // Ensure conversation history exists
    if (!conversations[userId]) {
      conversations[userId] = [];
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    let responseText;

    if (conversations[userId].length > 0) {
      const chat = model.startChat({
        history: conversations[userId],
        generationConfig: { maxOutputTokens: 800 },
      });

      const result = await chat.sendMessage(userMessage);
      responseText = result.response.text();
    } else {
      const result = await model.generateContent(userMessage);
      responseText = result.response.text();
    }

    // Update conversation history
    conversations[userId].push({ role: 'user', parts: [{ text: userMessage }] });
    conversations[userId].push({ role: 'model', parts: [{ text: responseText }] });

    // Limit conversation history to recent interactions
    if (conversations[userId].length > 20) {
      conversations[userId] = conversations[userId].slice(-20);
    }

    return responseText;
  } catch (error) {
    console.error('Error generating AI response:', error);
    return "Sorry, I couldn't process your request. Please try again later.";
  }
}

// Handle /start command
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, "👋 Hello! I'm your Gemini AI assistant. Ask me anything, and I'll do my best to help you!");
});

// Handle /help command
bot.onText(/\/help/, (msg) => {
  bot.sendMessage(msg.chat.id, "Send any message to chat. Commands:\n/start - Start\n/help - Help\n/reset - Reset conversation history");
});

// Handle /reset command
bot.onText(/\/reset/, (msg) => {
  const userId = msg.from.id.toString();
  delete conversations[userId];
  bot.sendMessage(msg.chat.id, "Conversation reset. Let's start fresh!");
});

// Handle regular messages
bot.on('message', async (msg) => {
  if (msg.text && msg.text.startsWith('/')) return;

  const chatId = msg.chat.id;
  const userId = msg.from.id.toString();
  const userMessage = msg.text;

  bot.sendChatAction(chatId, 'typing');

  try {
    const aiResponse = await generateAIResponse(userMessage, userId);
    bot.sendMessage(chatId, aiResponse);
  } catch (error) {
    console.error('Message handling error:', error);
    bot.sendMessage(chatId, "Sorry, an error occurred. Please try again.");
  }
});

// Handle polling errors
bot.on('polling_error', (error) => console.error('Polling error:', error));

console.log('Telegram Gemini 2.0 Flash AI bot is running!');
