// This is the main file for the Cloudflare Workers project.
// It creates a Telegram chatbot powered by Google's Gemini AI (gemini-2.0-flash).
// The bot listens for user messages, handles basic commands (/start, /help, /reset),
// and manages multi-turn conversations by maintaining a history of interactions.
// The conversation history is stored temporarily in memory to maintain context.
// The bot responds naturally by generating an AI response from Gemini and catches and handles errors gracefully.
// The environment variables TELEGRAM_BOT_TOKEN and GEMINI_API_KEY are required.
// The bot uses grammY's webhook callback for Cloudflare Workers.

import { Bot, webhookCallback } from "grammy";
import { GoogleGenerativeAI } from "@google/generative-ai";

// In-memory conversation history
const conversations = {};

// Function to generate an AI response using Gemini
async function generateAIResponse(userMessage, userId, geminiApiKey) {
  try {
    // Initialize conversation if it doesn't exist yet
    if (!conversations[userId]) conversations[userId] = [];
    
    // Initialize the Gemini AI client using your API key
    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    
    // Friendly prompt for a casual, natural reply
    const friendlyPrompt =
      "Please reply in a casual, friendly, and conversational style without using markdown, bold formatting, or bullet points. " +
      "Make your reply sound natural and human-like.\n\n" +
      userMessage;
    
    let responseText;
    
    // Continue conversation if there is history; otherwise, generate a new reply
    if (conversations[userId].length > 0) {
      const chat = model.startChat({ history: conversations[userId] });
      const result = await chat.sendMessage(friendlyPrompt);
      responseText = result.response.text();
    } else {
      const result = await model.generateContent(friendlyPrompt);
      responseText = result.response.text();
    }
    
    // Save the messages in conversation history
    conversations[userId].push({ role: "user", parts: [{ text: userMessage }] });
    conversations[userId].push({ role: "model", parts: [{ text: responseText }] });
    
    // Keep only the last 20 messages
    if (conversations[userId].length > 20) {
      conversations[userId] = conversations[userId].slice(-20);
    }
    
    return responseText;
  } catch (error) {
    console.error("Error generating AI response:", error);
    return "Sorry, I couldn't process that. Can you try asking again?";
  }
}

export default {
  async fetch(request, env, ctx) {
    // Create a new grammY bot instance using the token from environment variables
    const bot = new Bot(env.TELEGRAM_BOT_TOKEN);

    // Command: /start
    bot.command("start", async (ctx) => {
      await ctx.reply("Hey there! I'm your friendly AI assistant. Feel free to ask me anything!");
    });

    // Command: /help
    bot.command("help", async (ctx) => {
      await ctx.reply(
        "Just send me any message, and we'll chat!\n" +
        "Commands:\n" +
        "/start - Let's begin chatting\n" +
        "/help - Need a hand?\n" +
        "/reset - Clear our previous chats"
      );
    });

    // Command: /reset – clears conversation history for the current user
    bot.command("reset", async (ctx) => {
      const userId = ctx.from?.id.toString();
      if (userId) {
        delete conversations[userId];
      }
      await ctx.reply("Alright, I've cleared our chat history. Let's chat anew!");
    });

    // Handle non-command text messages
    bot.on("message:text", async (ctx) => {
      const text = ctx.message.text;
      // Skip if the text starts with a slash (command)
      if (text.startsWith("/")) return;
      const userId = ctx.from?.id.toString();
      if (!userId) return;
      
      // Show typing action
      await ctx.api.sendChatAction(ctx.chat.id, "typing");
      
      // Generate AI response using Gemini and reply
      const aiResponse = await generateAIResponse(text, userId, env.GEMINI_API_KEY);
      await ctx.reply(aiResponse);
    });

    // Use grammY's webhook callback for Cloudflare Workers
    return webhookCallback(bot, "cloudflare-mod")(request);
  }
};