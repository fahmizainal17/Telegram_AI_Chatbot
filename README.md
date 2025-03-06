# **🤖 Telegram Gemini Chatbot**

## **1. Screenshots**

### **1.1 The Chatbot Interface**  
![The Chatbot](images/tele_robo_chatbot.png)  
This is the bot’s icon/mascot.

---

## **2. Overview**
This project is an AI-powered **Telegram chatbot** that leverages **Google’s Gemini AI** to provide natural, conversational responses. It handles multi-turn conversations and basic commands such as **/start**, **/help**, and **/reset**.

- **Live Bot:** [FZ_ChatBot on Telegram](https://t.me/FZ_ChatBot)

**Key Highlights**:
- Real-time conversation using Telegram’s polling.
- Maintains chat history in memory for context.
- Minimal HTTP server to confirm the bot is running locally on `localhost:7860`.

---

## **3. Table of Contents**
1. [Key Features](#4-key-features)  
2. [Technology Stack](#5-technology-stack)  
3. [Project Structure](#6-project-structure)  
4. [Installing & Running](#7-installing--running)  
5. [Processing Flow](#8-processing-flow)  
6. [Sample Chat](#9-sample-chat)  
7. [License](#10-license)  

---

## **4. Key Features**

- **Casual Conversational Style**  
  - The bot uses a “friendly prompt” to ensure replies are natural and human-like.

- **Multi-turn Chat History**  
  - Keeps up to 20 recent messages to maintain context.

- **Basic Commands**  
  - `/start` – Greet the user.  
  - `/help` – Show usage info.  
  - `/reset` – Clear conversation history.

- **Error Handling**  
  - Catches exceptions and returns a friendly message if something goes wrong.

---

## **5. Technology Stack**

- **Node.js 14+**  
  - JavaScript runtime environment.
- **node-telegram-bot-api**  
  - For interacting with the Telegram Bot API.
- **@google/generative-ai**  
  - Access to Google’s Gemini model.
- **dotenv**  
  - Manages environment variables.

---

## **6. Project Structure**

```plaintext
Telegram_AI_Chatbot_Project/
├── app.js               # Main chatbot logic + minimal HTTP server
├── package.json         # Node project metadata and scripts
├── package-lock.json    # (Optional) Auto-generated dependency lock file
├── .env                 # Environment variables (not committed to VCS)
├── images/
│   └── tele_robo_chatbot.png  # Chatbot image
└── README.md            # This file
```

---

## **7. Installing & Running**

### **Step 1: Clone the Repository**
```bash
git clone https://github.com/your-username/Telegram_AI_Chatbot_Project.git
cd Telegram_AI_Chatbot_Project
```

### **Step 2: Install Dependencies**
```bash
npm install
```

### **Step 3: Configure Environment Variables**
Create a file named `.env` in the project root:
```bash
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
GEMINI_API_KEY=your_gemini_api_key
```
> **Note**: Keep this file private. **Do not** commit it to version control.

### **Step 4: Run the Bot**
```bash
npm start
```
You should see:
```
HTTP server is listening on port 7860
Telegram AI Chatbot is now happily chatting!
```

### **Step 5: Test on Telegram**
Open Telegram, find your bot via its username (e.g. `@FZ_ChatBot`), and send a message. The bot should respond promptly!

---

## **8. Processing Flow**

1. **User sends a message** in Telegram.  
2. **Bot receives** the message, forwards it to Gemini for generation.  
3. **Gemini** returns a text response.  
4. **Bot** replies to the user in the same chat.

---

## **9. Sample Chat**

```
User: Hi, how are you?
Bot: Hey there! I'm doing great, thanks for asking. How can I help you today?

User: Tell me a joke.
Bot: Sure! Why did the math book look so sad? Because it had so many problems.
```

---

## **10. License**
This project is for personal and educational use. If you wish to modify or redistribute, please obtain permission from the author.

---

**Enjoy chatting with your Gemini-powered Telegram Bot!**  