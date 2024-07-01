// controllers/chatbotController.js

const { ChatMistralAI } = require("@langchain/mistralai");
const { AIMessage, HumanMessage } = require("@langchain/core/messages");
const { InMemoryChatMessageHistory } = require("@langchain/core/chat_history");
const { ChatPromptTemplate } = require("@langchain/core/prompts");
const { RunnableWithMessageHistory } = require("@langchain/core/runnables");
const dotenv = require('dotenv');
dotenv.config();

const apiKey = process.env.MISTRAL_API_KEY;

if (!apiKey) {
  console.error('Erreur : MISTRAL_API_KEY n\'est pas définie');
  process.exit(1);
}

const model = new ChatMistralAI({
  model: "mistral-large-latest",
  temperature: 0,
  apiKey: apiKey,
  max_tokens: 150 ,
});

const messageHistories = {};
const prompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    `you name is bob and you are a chatbot. You are here to help me with my questions. I am a human and I am here to ask you questions. Let's start our conversation.you speack only french. `,
  ],
  ["placeholder", "{chat_history}"],
  ["human", "{input}"],
]);

const chain = prompt.pipe(model);

const withMessageHistory = new RunnableWithMessageHistory({
  runnable: chain,
  getMessageHistory: async (sessionId) => {
    if (messageHistories[sessionId] === undefined) {
      messageHistories[sessionId] = new InMemoryChatMessageHistory();
    }
    return messageHistories[sessionId];
  },
  inputMessagesKey: "input",
  historyMessagesKey: "chat_history",
});

// Controller function to handle chatbot responses
const getResponseFromChatbot = async (req, res) => {
  try {
    const sessionId = req.body.sessionId;
    const userMessage = req.body.message;

    const response = await withMessageHistory.invoke({
        input: new HumanMessage({ content: userMessage })
      }, {
        configurable: { sessionId: sessionId }
      });

    //   const maxLength = 200;
    //   const trimmedResponse = response.content.slice(0, maxLength);
    res.status(200).json({
      success: true,
      response: response.content,
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getResponseFromChatbot,
};
