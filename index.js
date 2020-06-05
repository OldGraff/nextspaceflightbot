import {token} from 'token.js';

const TelegramBot = require('node-telegram-bot-api');

// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(
    token,
    {
        polling: true,
        request: {
            // Proxy settings here
            // proxy: 'http://82.119.170.106:8080',
            proxy: 'http://134.119.179.194:5836',
            strictSSL: false,
        },
    },
);

// Matches "/echo [whatever]"
bot.onText(/\/echo (.+)/, (msg, match) => {
    // 'msg' is the received Message from Telegram
    // 'match' is the result of executing the regexp above on the text content
    // of the message

    const chatId = msg.chat.id;
    const resp = match[1]; // the captured "whatever"

    // send back the matched "whatever" to the chat
    bot.sendMessage(chatId, resp);
});

// Listen for any kind of message. There are different kinds of
// messages.
bot.on('message', (msg) => {
    const chatId = msg.chat.id;

    // send a message to the chat acknowledging receipt of their message
    bot.sendMessage(chatId, `Received your message. ChatId is ${chatId}`);
});

// bot.on("polling_error", console.log);
