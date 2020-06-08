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

const launchSchedule = [];

/**
 * Merge array to message string
 *
 * @param arr {Object[]} array contains launches info objects
 * @returns {string} message
 */
function arrayToMsg(arr) {
    const msg = arr.reduce((str, item) => `${str}*${item.owner} | ${item.title}*\n${item.date}\n${item.place}\n\n`, '');
    // console.log(he.decode(msg));
    return he.decode(msg);
}

/**
 * Parse HTML source and return schedule array
 *
 * @param body {string} string containing HTML source
 * @param index {number} element number to return
 * @returns {string} schedule text
 */
function parser(body, index = -1) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(body, "text/html");
    const list = doc.getElementsByClassName('mdl-grid');
    launchSchedule.length = 0;

    list.filter((value, i) => value.parentNode && i < 5).forEach(node => {
        const titleNode = node.getElementsByTagName('h5');

        if (titleNode && titleNode.length > 0) {
            const ownerNode = node.getElementsByClassName('mdl-card__title-text');
            const infoNode = node.getElementsByClassName('mdl-card__supporting-text');
            const linkNode = node.getElementsByClassName('mdl-card__actions');
            const imgStyleNode = node.getElementsByTagName('style');
            const imgStyleStr = String(imgStyleNode && imgStyleNode[0].textContent);
            const imgSrc = imgStyleStr.slice(imgStyleStr.indexOf('https://storage'), imgStyleStr.indexOf(') '));

            const infoNodeArr = String(infoNode[0] && infoNode[0].textContent).split('\n \n ');
            const date = String(infoNodeArr && infoNodeArr.length > 1 && infoNodeArr[1]);
            const place = String(infoNodeArr && infoNodeArr.length > 2 && infoNodeArr[2]);
            // console.log(imgSrc);
            launchSchedule.push({
                owner: String(ownerNode && ownerNode[0].textContent).trim(),
                title: String(titleNode[0].textContent).replace(/\n /g, ''),
                date: date.replace(/\n /g, ''),
                place: place.replace(/\n /g, ''),
                link: String(linkNode && linkNode[0].getElementsByTagName('a')[0].getAttribute('href')),
                img: imgSrc,
            })
        }
    })
    // console.log(...launchSchedule)
    return arrayToMsg(index > -1 ? [launchSchedule[index]] : launchSchedule);
}

bot.setMyCommands([
    {"command": "/launches", "description": "Show launches list"},
    {"command": "nextlaunch", "description": "Show next launch"},
]);

// fetch('https://nextspaceflight.com/launches/')
//     .then(res => res.text())
//     .then(body => parser(body));

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

bot.onText(/\/nextlaunch/,  (msg, match) => {

    const chatId = msg.chat.id;

    const URL = 'https://nextspaceflight.com/launches/';

    fetch(URL)
        .then(res => res.text())
        .then(body => {
            const caption = parser(body, 0);
            return bot.sendPhoto(chatId, launchSchedule[0].img,{"parse_mode": "Markdown", "caption": caption})
        });
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

process.on('unhandledRejection', (reason, promise) => {
    console.log('Unhandled Rejection at:', promise, 'reason:', reason);
    // Application specific logging, throwing an error, or other logic here
});
