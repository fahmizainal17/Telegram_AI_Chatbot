// WhatsApp Gemini AI Chatbot (Free Version)
// This project uses the following technologies:
// 1. Node.js for the backend server
// 2. Meta's WhatsApp Business Cloud API (free tier)
// 3. Google's Gemini API (free tier)

// Required packages
// Run: npm install express dotenv axios @google/generative-ai

// File: app.js
const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios');
require('dotenv').config();

// Initialize Express app
const app = express();
app.use(express.json());

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
    
    // Add user message to history
    conversations[userId].push({ role: 'user', parts: [userMessage] });
    
    // Trim conversation history to the last 10 messages to avoid context length issues
    if (conversations[userId].length > 10) {
      conversations[userId] = conversations[userId].slice(-10);
    }
    
    // Create a conversation with Gemini
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const chat = model.startChat({
      history: conversations[userId],
      generationConfig: {
        maxOutputTokens: 800,
      },
    });
    
    // Generate response
    const result = await chat.sendMessage(userMessage);
    const response = result.response.text();
    
    // Add AI response to conversation history
    conversations[userId].push({ role: 'model', parts: [response] });
    
    return response;
  } catch (error) {
    console.error('Error generating AI response:', error);
    return "Sorry, I couldn't process your request. Please try again later.";
  }
}

// Function to send message using WhatsApp Cloud API
async function sendWhatsAppMessage(phoneNumberId, to, message) {
  try {
    await axios({
      method: 'POST',
      url: `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
      headers: {
        'Authorization': `Bearer ${process.env.WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json',
      },
      data: {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: to,
        type: 'text',
        text: {
          body: message
        }
      }
    });
  } catch (error) {
    console.error('Error sending WhatsApp message:', error.response?.data || error.message);
  }
}

// Webhook verification endpoint for WhatsApp
app.get('/webhook', (req, res) => {
  // Parse params from the webhook verification request
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  // Check if a token and mode were sent
  if (mode && token) {
    // Check the mode and token sent are correct
    if (mode === 'subscribe' && token === process.env.VERIFY_TOKEN) {
      // Respond with the challenge token from the request
      console.log('WEBHOOK_VERIFIED');
      res.status(200).send(challenge);
    } else {
      // Respond with '403 Forbidden' if verify tokens do not match
      res.sendStatus(403);
    }
  } else {
    res.sendStatus(400);
  }
});

// Webhook for WhatsApp messages
app.post('/webhook', async (req, res) => {
  try {
    // Return a '200 OK' response to all requests
    res.status(200).send('EVENT_RECEIVED');
    
    const body = req.body;
    
    // Check if this is a WhatsApp message
    if (body.object && 
        body.entry && 
        body.entry[0].changes && 
        body.entry[0].changes[0].value.messages && 
        body.entry[0].changes[0].value.messages[0]) {
      
      const phoneNumberId = body.entry[0].changes[0].value.metadata.phone_number_id;
      const from = body.entry[0].changes[0].value.messages[0].from; // Extract the phone number from which the message originated
      const msgBody = body.entry[0].changes[0].value.messages[0].text.body; // Extract the message text
      
      // Generate AI response
      const aiResponse = await generateAIResponse(msgBody, from);
      
      // Send response back via WhatsApp
      await sendWhatsAppMessage(phoneNumberId, from, aiResponse);
    }
  } catch (error) {
    console.error('Error processing message:', error);
  }
});

// Health check endpoint
app.get('/', (req, res) => {
  res.status(200).send('WhatsApp Gemini AI Bot is running!');
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});