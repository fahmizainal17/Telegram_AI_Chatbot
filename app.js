/**
 * Telegram AI Chatbot Cloudflare Worker
 * 
 * This worker serves a simple landing page and processes Telegram webhook requests.
 * It integrates with Google's Gemini AI to provide AI-powered responses to users.
 * 
 * Features:
 * - Simple landing page for visitors to your worker URL
 * - Webhook integration with Telegram Bot API
 * - Command processing (/start, /help, /reset)
 * - AI responses using Google's Gemini API
 * 
 * Setup:
 * 1. Deploy this worker to Cloudflare
 * 2. Set environment variables for TELEGRAM_BOT_TOKEN and GEMINI_API_KEY
 * 3. Register the webhook with Telegram by visiting:
 *    https://api.telegram.org/bot{YOUR_TOKEN}/setWebhook?url=https://your-worker-url.workers.dev/webhook
 * 
 * Environment Variables:
 * - TELEGRAM_BOT_TOKEN: Your Telegram Bot API token from BotFather
 * - GEMINI_API_KEY: Your Google Gemini API key
 */

// Main worker export - handles all HTTP requests
export default {
  /**
   * Main request handler for the Cloudflare Worker
   * 
   * Routes requests to either the landing page or webhook handler
   * based on the URL path and request method.
   * 
   * @param {Request} request - The incoming HTTP request
   * @param {Object} env - Environment variables and bindings
   * @param {Object} ctx - Execution context
   * @returns {Response} - HTTP response
   */
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // If this is a webhook request from Telegram
    if (url.pathname === '/webhook' && request.method === 'POST') {
      return handleTelegramWebhook(request, env);
    }
    
    // For all other requests, show the landing page
    return new Response(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Telegram AI Chatbot</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            background-color: #f5f5f5;
            margin: 0;
            padding: 20px;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
          }
          .container {
            background-color: white;
            border-radius: 10px;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
            padding: 30px;
            max-width: 600px;
            width: 90%;
            text-align: center;
          }
          h1 {
            color: #0088cc;
          }
          .status {
            color: #4CAF50;
            font-weight: bold;
            margin: 20px 0;
          }
          .button {
            background-color: #0088cc;
            color: white;
            padding: 12px 20px;
            border: none;
            border-radius: 5px;
            font-size: 16px;
            cursor: pointer;
            text-decoration: none;
            display: inline-block;
            margin-top: 20px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Telegram AI Chatbot</h1>
          <div class="status">Service Active and Running</div>
          <p>This is an AI-powered chatbot using Google's Gemini AI model.</p>
          <a href="https://t.me/FZ_ChatBot" class="button">Chat with FZ_ChatBot</a>
        </div>
      </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html' }
    });
  }
};

/**
 * Handle Telegram webhook requests
 * 
 * Processes incoming messages from Telegram, handles commands,
 * and generates AI responses using the Gemini API.
 * 
 * @param {Request} request - The incoming webhook request from Telegram
 * @param {Object} env - Environment variables including API tokens
 * @returns {Response} - Response to the webhook request
 */
async function handleTelegramWebhook(request, env) {
  try {
    // Get the Telegram token from environment variables
    const telegramToken = env.TELEGRAM_BOT_TOKEN;
    const geminiApiKey = env.GEMINI_API_KEY;
    
    if (!telegramToken || !geminiApiKey) {
      return new Response('Missing API tokens', { status: 500 });
    }
    
    // Parse the incoming webhook data
    const update = await request.json();
    
    // Only process messages with text
    if (!update.message || !update.message.text) {
      return new Response('OK');
    }
    
    const chatId = update.message.chat.id;
    const messageText = update.message.text;
    
    // Get or create conversation context for this user
    const userId = update.message.from.id.toString();
    
    // Process commands
    if (messageText.startsWith('/')) {
      let responseText = '';
      
      if (messageText === '/start') {
        responseText = "Hey there! I'm your friendly AI assistant. Feel free to ask me anything!";
      } else if (messageText === '/help') {
        responseText = "Just send me any message, and we'll chat!\nYou can also use these commands:\n/start - Let's begin chatting\n/help - Need a hand?\n/reset - Clear our previous chats";
      } else if (messageText === '/reset') {
        // Reset conversation would go here if we had KV storage
        responseText = "Alright, I've cleared our chat history. Let's chat anew!";
      } else {
        responseText = "I don't recognize that command. Try /help for a list of commands.";
      }
      
      // Send the response back to the user
      await sendTelegramMessage(telegramToken, chatId, responseText);
      return new Response('OK');
    }
    
    // Generate an AI response
    try {
      // Call the Gemini API
      const result = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: "Please reply in a casual, friendly, and conversational style without using markdown, bold formatting, or bullet points. Make your reply sound natural and human-like.\n\n" + messageText
            }]
          }]
        })
      });
      
      const data = await result.json();
      let responseText = "Sorry, I couldn't process that. Can you try asking again?";
      
      if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        responseText = data.candidates[0].content.parts[0].text;
      }
      
      // Send the AI response back to the user
      await sendTelegramMessage(telegramToken, chatId, responseText);
    } catch (error) {
      console.error('Error generating AI response:', error);
      await sendTelegramMessage(telegramToken, chatId, "Sorry, I encountered an error. Please try again later.");
    }
    
    return new Response('OK');
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response('Error processing webhook', { status: 500 });
  }
}

/**
 * Send a message to a Telegram user
 * 
 * Makes an API call to the Telegram Bot API to send a text message.
 * 
 * @param {string} token - The Telegram Bot API token
 * @param {string|number} chatId - The chat ID to send the message to
 * @param {string} text - The message text to send
 * @returns {Promise<Object>} - The Telegram API response
 */
async function sendTelegramMessage(token, chatId, text) {
  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      chat_id: chatId,
      text: text
    })
  });
  
  return response.json();
}