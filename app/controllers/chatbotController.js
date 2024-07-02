const { ChatMistralAI } = require("@langchain/mistralai");
const { AIMessage, HumanMessage } = require("@langchain/core/messages");
const { InMemoryChatMessageHistory } = require("@langchain/core/chat_history");
const { ChatPromptTemplate } = require("@langchain/core/prompts");
const { RunnableWithMessageHistory } = require("@langchain/core/runnables");
const dotenv = require('dotenv');
dotenv.config();

const apiKey = process.env.MISTRAL_API_KEY;

if (!apiKey) {
  throw new Error('Erreur : MISTRAL_API_KEY n\'est pas définie');
}

const model = new ChatMistralAI({
  model: "mistral-large-latest",
  temperature: 0,
  apiKey: apiKey,
  max_tokens: 150,
  request_timeout: 60000, // 60 seconds
});

const messageHistories = {};
const MAX_HISTORY_LENGTH = 8;

const prompt = ChatPromptTemplate.fromMessages([
  ["system", "You are a helpful assistant who remembers all details the user shares with you. You speak only French."],
  ["placeholder", "{chat_history}"],
  ["human", "{input}"],
]);

const chain = prompt.pipe(model);

const getMessageHistory = async (sessionId) => {
  if (!messageHistories[sessionId]) {
    messageHistories[sessionId] = new InMemoryChatMessageHistory();
  }

  const history = messageHistories[sessionId];
  const messages = history.getMessages();
  if (messages.length > MAX_HISTORY_LENGTH) {
    history.clearMessages(); // Clear old messages
    messages.slice(-MAX_HISTORY_LENGTH).forEach(msg => history.addMessage(msg));
  }

  console.log(`Message history for session ${sessionId}:`, history.getMessages());
  return history;
};

const withMessageHistory = new RunnableWithMessageHistory({
  runnable: chain,
  getMessageHistory: getMessageHistory,
  inputMessagesKey: "input",
  historyMessagesKey: "chat_history",
});

const getResponseFromChatbot = async (req, res) => {
  try {
    const sessionId = req.body.sessionId;
    const userMessage = req.body.message;

    console.log(`Received message: "${userMessage}" for session: ${sessionId}`);

    const history = await getMessageHistory(sessionId);
    history.addMessage(new HumanMessage({ content: userMessage }));

    const followupResponse = await withMessageHistory.invoke(
      {
        input: new HumanMessage({ content: userMessage }),
      },
      {
        configurable: { sessionId: sessionId },
      }
    );

    const responseContent = followupResponse.content;
    console.log(`Generated response for session ${sessionId}:`, responseContent);

    history.addMessage(new AIMessage({ content: responseContent }));
    console.log(`Updated message history for session ${sessionId}:`, history.getMessages());

    res.status(200).json({
      success: true,
      response: responseContent,
    });
  } catch (error) {
    console.error('Error:', error);

    if (error.message.includes('timeout')) {
      res.status(500).json({
        success: false,
        message: 'La requête a dépassé le délai d\'attente. Veuillez réessayer.',
      });
    } else {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
};

module.exports = {
  getResponseFromChatbot,
};
