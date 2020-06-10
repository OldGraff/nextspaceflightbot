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
const CLASS_NAMES = {
    GRID: 'mdl-grid',
    TITLE_TEXT: 'mdl-card__title-text',
    INFO_TEXT: 'mdl-card__supporting-text',
    LINKS: 'mdl-card__actions',
}

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
 * Parse HTML source and return nodes array
 *
 * @param body {string} string containing HTML source
 * @param className {string} nodes class name to collect
 * @returns {Object[]} nodes array
 */
function parseNodeList(body, className) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(body, "text/html");
    const list = doc.getElementsByClassName(className);

    return list || [];
}

/**
 * Get text from target node
 *
 * @param node {Object} parent node
 * @param className {string} [className=''] target node class name
 * @returns {string} text content
 */
function getNodeText(node, className= '') {
    const childNodes = className === '' ? node : node.getElementsByClassName(className);

    return String(childNodes && childNodes[0] && childNodes[0].textContent);
}

/**
 * Get links from target node
 *
 * @param node {Object} parent node
 * @param className {string} [className=''] target node class name
 * @returns {Object[]} links array
 */
function getNodeLinks(node, className= '') {
    const childNodes = className === '' ? node : node.getElementsByClassName(className);
    const linksNodes = childNodes && childNodes[0] && childNodes[0].getElementsByTagName('a');

    return linksNodes.map(el => String(el.getAttribute('href')));
}

/**
 * Parse HTML source and return schedule array
 *
 * @param body {string} string containing HTML source
 * @param index {number} element number to return
 * @returns {string} schedule text
 */
function parser(body, index = -1) {
    const list = parseNodeList(body, CLASS_NAMES.GRID);
    launchSchedule.length = 0;

    list.filter((value, i) => value.parentNode && i < 5).forEach(node => {
        const titleNode = node.getElementsByTagName('h5');

        if (titleNode && titleNode.length > 0) {
            const linksArr = getNodeLinks(node, CLASS_NAMES.LINKS);
            const imgStyleStr = getNodeText(node.getElementsByTagName('style'));
            const imgSrc = imgStyleStr.slice(imgStyleStr.indexOf('https://storage'), imgStyleStr.indexOf(') '));
            const infoArr = getNodeText(node, CLASS_NAMES.INFO_TEXT).split('\n \n ');
            // console.log(imgSrc, linksArr);
            launchSchedule.push({
                owner: getNodeText(node, CLASS_NAMES.TITLE_TEXT).trim(),
                title: getNodeText(titleNode).replace(/\n /g, ''),
                date: String(infoArr[1]).replace(/\n /g, ''),
                place: String(infoArr[2]).replace(/\n /g, ''),
                launchLink: linksArr[0],
                translationLink: linksArr[1],
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
