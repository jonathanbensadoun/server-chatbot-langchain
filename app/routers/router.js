const express = require('express');
const { getResponseFromChatbot } = require('../controllers/chatbotController');

const router = express.Router();

router.get('/', (req, res) => {
    res.send('Hello, world!');
});

router.post('/chatbot', getResponseFromChatbot);

module.exports = router;