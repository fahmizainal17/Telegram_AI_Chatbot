/**
 * Telegram AI Chatbot with Express.js Interface
 *
 * This script creates a Telegram chatbot powered by Google's Gemini AI (gemini-2.0-flash).
 * It provides both a web interface via Express.js and a chatbot interface via Telegram.
 * 
 * Features:
 * - Professional landing page for visitors accessing the deployment URL
 * - Multi-turn conversational capabilities using Gemini AI
 * - Persistent conversation history maintained in memory
 * - Command handling for user interaction (/start, /help, /reset)
 * - Error handling and graceful fallbacks
 *
 * Workflow:
 * 1. Sets up an Express.js web server to serve the landing page
 * 2. Initializes the Telegram bot and Gemini AI client
 * 3. Defines command handlers to provide a friendly interaction experience
 * 4. Stores conversation history temporarily in memory to maintain context
 * 5. Responds naturally by generating an AI response from Gemini
 * 6. Catches and handles errors gracefully
 *
 * Environment Variables:
 * - TELEGRAM_BOT_TOKEN: Your Telegram Bot API token
 * - GEMINI_API_KEY: Your Gemini AI API key
 * - PORT: (Optional) Port for the Express server, defaults to 7860
 */

// Import required modules
const express = require('express');
const path = require('path');
const TelegramBot = require('node-telegram-bot-api');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

// Initialize Express app
const app = express();
const port = process.env.PORT || 7860;

/**
 * Express middleware and route setup
 * Serves static files and defines routes for the web interface
 */

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Create 'public' directory if it doesn't exist
const fs = require('fs');
const publicDir = path.join(__dirname, 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir);
}

// Create public/images directory if it doesn't exist
const imagesDir = path.join(publicDir, 'images');
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir);
}

// Note: You'll need to manually copy your image files:
// - '/images/standup_profile_pic.jpg'
// - '/images/tele_robo_chatbot.png'
// to the public/images directory

// Create a simple HTML for the landing page
const landingPageHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Telegram AI Chatbot</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f5f5f5;
            margin: 0;
            padding: 0;
            min-height: 100vh;
            color: #333;
        }
        .container {
            background-color: white;
            border-radius: 10px;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
            padding: 30px;
            max-width: 800px;
            width: 90%;
            margin: 50px auto;
        }
        .header-container {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 30px;
        }
        .logo-title {
            display: flex;
            align-items: center;
        }
        .telegram-logo {
            width: 100px;
            height: auto;
            margin-right: 20px;
        }
        .profile-pic {
            width: 100px;
            height: 100px;
            border-radius: 10px;
            object-fit: cover;
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        }
        h1 {
            color: #0088cc;
            margin: 0;
            font-size: 28px;
        }
        .status {
            color: #4CAF50;
            font-weight: bold;
            margin: 20px 0;
            padding: 10px;
            background-color: #e8f5e9;
            border-radius: 5px;
            text-align: center;
        }
        .description {
            line-height: 1.6;
            margin-bottom: 25px;
        }
        .features {
            margin: 30px 0;
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
        }
        .feature-card {
            background-color: #f9f9f9;
            border-radius: 8px;
            padding: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }
        .feature-card h3 {
            color: #0088cc;
            margin-top: 0;
        }
        .feature-card p {
            margin-bottom: 0;
        }
        .usage {
            background-color: #f0f7ff;
            padding: 20px;
            border-radius: 8px;
            margin: 30px 0;
        }
        .usage h2 {
            color: #0088cc;
            margin-top: 0;
        }
        .usage ol {
            padding-left: 20px;
        }
        .usage li {
            margin-bottom: 10px;
        }
        .cta {
            text-align: center;
            margin: 30px 0;
        }
        .cta-button {
            background-color: #0088cc;
            color: white;
            padding: 12px 25px;
            border: none;
            border-radius: 5px;
            font-size: 16px;
            cursor: pointer;
            text-decoration: none;
            display: inline-block;
        }
        .cta-button:hover {
            background-color: #006699;
        }
        .footer {
            text-align: center;
            margin-top: 40px;
            color: #777;
            font-size: 14px;
        }
        @media (max-width: 600px) {
            .features {
                grid-template-columns: 1fr;
            }
            .header-container {
                flex-direction: column;
                text-align: center;
            }
            .logo-title {
                flex-direction: column;
                margin-bottom: 20px;
            }
            .telegram-logo {
                margin-right: 0;
                margin-bottom: 15px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header-container">
            <div class="logo-title">
                <img src="/images/tele_robo_chatbot.png" alt="Telegram Bot Logo" class="telegram-logo">
                <h1>Telegram AI Chatbot</h1>
            </div>
            <img src="/images/standup_profile_pic.jpg" alt="Bot Profile" class="profile-pic">
        </div>
        
        <div class="status">Service Active and Running</div>
        
        <div class="description">
            <p>This is an advanced AI chatbot powered by Google's Gemini 2.0 Flash model. The bot provides natural, conversational responses to your messages through the Telegram platform.</p>
        </div>
        
        <div class="features">
            <div class="feature-card">
                <h3>Conversational AI</h3>
                <p>Engage in natural conversations with advanced AI that remembers context and responds in a friendly, human-like manner.</p>
            </div>
            <div class="feature-card">
                <h3>Multi-turn Conversations</h3>
                <p>The bot maintains conversation history to provide coherent responses across multiple messages.</p>
            </div>
            <div class="feature-card">
                <h3>Command System</h3>
                <p>Use commands like /start, /help, and /reset to control your interaction with the bot.</p>
            </div>
        </div>
        
        <div class="usage">
            <h2>How to Use</h2>
            <ol>
                <li>Open Telegram and search for your bot's username</li>
                <li>Start a conversation with the bot by sending the /start command</li>
                <li>Ask questions or chat naturally with the AI</li>
                <li>Use /reset to clear conversation history and start fresh</li>
            </ol>
        </div>
        
        <div class="cta">
            <a href="https://t.me/FZ_ChatBot" class="cta-button" target="_blank">Chat with FZ_ChatBot</a>
        </div>
        
        <div class="footer">
            <p>© ${new Date().getFullYear()} AI Telegram Chatbot • Powered by Gemini AI</p>
        </div>
    </div>
</body>
</html>
`;

// Write the landing page HTML to the public directory
fs.writeFileSync(path.join(publicDir, 'index.html'), landingPageHTML);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).send('Bot is running.\n');
});

// Fallback route
app.get('*', (req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

// Start the Express server
app.listen(port, () => {
  console.log(`Web server running at http://localhost:${port}`);
});

/**
 * Telegram Bot and Gemini AI Integration
 */

// Initialize Telegram bot with your token
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });

// Initialize Gemini AI client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Conversation memory storage (in-memory object)
const conversations = {};

/**
 * generateAIResponse - Generates AI responses using Gemini
 * 
 * This function handles conversation tracking and AI response generation.
 * It manages conversation history and interacts with the Gemini API.
 * 
 * @param {string} userMessage - The message sent by the user
 * @param {string} userId - Unique identifier for the user
 * @returns {Promise<string>} - The AI-generated response text
 */
async function generateAIResponse(userMessage, userId) {
  try {
    // Initialize conversation if it doesn't exist yet
    if (!conversations[userId]) conversations[userId] = [];

    // Use the Gemini model (gemini-2.0-flash for fast responses)
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

/**
 * Telegram Bot Command Handlers
 */

// Start command - Initiates conversation with the bot
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(
    msg.chat.id,
    "Hey there! I'm your friendly AI assistant. Feel free to ask me anything!"
  );
});

// Help command - Provides information about bot usage
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

// Reset command - Clears conversation history
bot.onText(/\/reset/, (msg) => {
  const userId = msg.from.id.toString();
  delete conversations[userId];
  bot.sendMessage(msg.chat.id, "Alright, I've cleared our chat history. Let's chat anew!");
});

/**
 * Message handler - Processes regular chat messages
 * 
 * This event listener handles all non-command messages from users.
 * It shows a typing indicator, processes the message through the AI,
 * and returns the response.
 */
bot.on('message', async (msg) => {
  // Ignore commands
  if (msg.text && msg.text.startsWith('/')) return;

  const chatId = msg.chat.id;
  const userId = msg.from.id.toString();
  const userMessage = msg.text;

  // Show typing action while processing
  bot.sendChatAction(chatId, 'typing');

  try {
    const aiResponse = await generateAIResponse(userMessage, userId);
    bot.sendMessage(chatId, aiResponse);
  } catch (error) {
    console.error('Oops, encountered an issue:', error);
    bot.sendMessage(chatId, "Oops, something went wrong. Mind trying again?");
  }
});

// Handle polling errors
bot.on('polling_error', (error) => console.error('Polling error:', error));

console.log('Telegram AI Chatbot is now running with web interface!');