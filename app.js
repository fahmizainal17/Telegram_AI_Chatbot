const TelegramBot = require('node-telegram-bot-api');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

// Initialize Telegram Bot with token
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Simple in-memory conversation history (for production, use a database)
const conversations = {};

// Function to generate AI response
async function generateAIResponse(userMessage, userId) {
  try {
    // Initialize or retrieve conversation history
    if (!conversations[userId]) {
      conversations[userId] = [];
    }

    // Create a conversation with Gemini
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    let response;

    if (conversations[userId].length > 0) {
      const chat = model.startChat({
        history: conversations[userId],
        generationConfig: {
          maxOutputTokens: 800,
        },
      });
      
      // Generate response using chat session with history
      const result = await chat.sendMessage(userMessage);
      response = result.response;
    } else {
      // For the first message, generate content directly
      const result = await model.generateContent(userMessage);
      response = result.response;
    }
    
    // Add this interaction to history 
    conversations[userId].push({ role: 'user', content: userMessage });
    conversations[userId].push({ role: 'model', content: response });
    
    // Trim conversation history if it gets too long
    if (conversations[userId].length > 10) {
      conversations[userId] = conversations[userId].slice(-10);
    }
    
    return response;
  } catch (error) {
    console.error('Error generating AI response:', error);
    return "Sorry, I couldn't process your request. Please try again later.";
  }
}

// Handle /start command
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(
    chatId,
    "👋 Hello! I'm your Gemini AI assistant. Ask me anything, and I'll do my best to help you!"
  );
});

// Handle /help command
bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(
    chatId,
    "Here's how to use this bot:\n\n" +
    "- Simply send me any message and I'll respond with AI-powered answers\n" +
    "- I can help with information, creative writing, problem-solving, and more\n" +
    "- I maintain conversation context, so you can ask follow-up questions\n\n" +
    "Commands:\n" +
    "/start - Start the bot\n" +
    "/help - Show this help message\n" +
    "/reset - Reset our conversation history"
  );
});

// Handle /reset command to clear conversation history
bot.onText(/\/reset/, (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id.toString();
  
  if (conversations[userId]) {
    delete conversations[userId];
    bot.sendMessage(chatId, "Conversation history has been reset. Let's start fresh!");
  } else {
    bot.sendMessage(chatId, "No conversation history to reset. Let's chat!");
  }
});

// Handle all other messages
bot.on('message', async (msg) => {
  // Skip if it's a command
  if (msg.text && msg.text.startsWith('/')) return;
  
  const chatId = msg.chat.id;
  const userId = msg.from.id.toString();
  const userMessage = msg.text;
  
  // Send typing action to show the bot is processing
  bot.sendChatAction(chatId, 'typing');
  
  try {
    // Get response from Gemini
    const aiResponse = await generateAIResponse(userMessage, userId);
    
    // Send the response
    bot.sendMessage(chatId, aiResponse);
  } catch (error) {
    console.error('Error processing message:', error);
    bot.sendMessage(chatId, "Sorry, I encountered an error. Please try again later.");
  }
});

// Handle errors
bot.on('polling_error', (error) => {
  console.error('Polling error:', error);
});

console.log('Telegram Gemini AI bot is running!');
