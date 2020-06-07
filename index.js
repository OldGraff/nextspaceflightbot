const fetch = require('node-fetch');
const DOMParser = require('dom-parser');
const he = require('he');
const TelegramBot = require('node-telegram-bot-api');

const isHeroku = process.env.ISHEROKU === '1';
const {token = process.env.TOKEN, proxy = {}} = isHeroku ? {} : require('./config.js')

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

function arrayToMsg(arr) {
    const msg = arr.reduce((str, item) => `${str}*${item.title}*\n${item.date}\n${item.place}\n\n`, '');
    // console.log(he.decode(msg));
    return he.decode(msg);
}

/**
 * Parse HTML source and return schedule array
 *
 * @param body {string} string containing HTML source
 * @returns {string} schedule text
 */
function parser(body) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(body, "text/html");
    const list = doc.getElementsByClassName('launch');
    const launchSchedule = [];

    list.forEach(node => {
        const titleNode = node.getElementsByTagName('h5');
        if (titleNode && titleNode.length > 0) {
            const infoNode = node.getElementsByClassName('mdl-card__supporting-text');
            const infoNodeArr = String(infoNode[0] && infoNode[0].textContent).split('\n \n ');
            const date = String(infoNodeArr && infoNodeArr.length > 1 && infoNodeArr[1]);
            const place = String(infoNodeArr && infoNodeArr.length > 2 && infoNodeArr[2]);

            launchSchedule.push({
                title: String(titleNode[0].textContent).replace(/\n /g, ''),
                date: date.replace(/\n /g, ''),
                place: place.replace(/\n /g, ''),
            })
        }
    })
    // console.log(...launchSchedule)
    return arrayToMsg(launchSchedule);
}

// Matches "/echo [whatever]"
bot.onText(/\/launches/,  (msg, match) => {
    // 'msg' is the received Message from Telegram
    // 'match' is the result of executing the regexp above on the text content
    // of the message

    const chatId = msg.chat.id;
    // const resp = match[1]; // the captured "whatever"

    const URL = 'https://nextspaceflight.com/launches/';

    fetch(URL)
        .then(res => res.text())
        .then(body => bot.sendMessage(chatId, parser(body), {"parse_mode": "Markdown"}));
});

// Listen for any kind of message. There are different kinds of
// messages.
// bot.on('message', (msg) => {
//     const chatId = msg.chat.id;
//     const firstName = msg.chat.first_name;
//     console.log(msg);
//     // send a message to the chat acknowledging receipt of their message
//     bot.sendMessage(chatId, `Hello ${firstName}! Received your message. It's "${msg.text}"`);
// });

// bot.on("polling_error", console.log);
