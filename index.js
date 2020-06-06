const {token, proxy} = require('./config.js');
const isHeroku = process.env.ISHEROKU === '1';

const TelegramBot = require('node-telegram-bot-api');
console.log(token);
// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(
    token || process.env.TOKEN,
    {
        polling: true,
        request: {
            ...isHeroku ? {} : proxy,
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
    const firstName = msg.chat.first_name;
    console.log(msg);
    // send a message to the chat acknowledging receipt of their message
    bot.sendMessage(chatId, `Received your message. Hello ${firstName}`);
});

// bot.on("polling_error", console.log);
