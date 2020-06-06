const isHeroku = process.env.ISHEROKU === '1';
const {token = process.env.TOKEN, proxy = {}} = isHeroku ? {} : require('./config.js')

const TelegramBot = require('node-telegram-bot-api');

// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(
    token,
    {
        polling: true,
        request: {
            ...proxy,
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
    bot.sendMessage(chatId, `Hello ${firstName}! Received your message. It's "${msg.text}"`);
});

// bot.on("polling_error", console.log);
