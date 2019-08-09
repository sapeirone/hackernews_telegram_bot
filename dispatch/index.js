const Telegraf = require('telegraf');

const axios = require('axios');
const Firestore = require('@google-cloud/firestore');

const PROJECT_ID = process.env.PROJECT_ID;
const COLLECTION_NAME = "default";
const DOCUMENT_NAME = "ids";

// setup Cloud Firestore
const firestore = new Firestore({
    projectId: PROJECT_ID
});

// initialization of the bot
const bot = new Telegraf(process.env.TELEGRAM_API_TOKEN);

async function getTopTen() {
    // get top 500 stories from HackerNews
    const url = 'https://hacker-news.firebaseio.com/v0/topstories.json?print=pretty'
    const response = await axios.get(url);
    const values = response.data.slice(0, 10);

    // for each news among the top 10
    // fetch title and url
    const ITEM_URL = "https://hacker-news.firebaseio.com/v0/item/";
    const ls = values.map(async (id) => {
        const url = `${ITEM_URL}${id}.json`
        const response = await axios.get(url);
        return {
            title: response.data.title,
            url: response.data.url
        };
    });

    return await Promise.all(ls);
}

// function entrypoint
exports.dispatch = async (pubSubEvent, context) => {
    const posts = await getTopTen();

    // message composition
    let message = "";
    posts.forEach((p) => {
        message += `${p.title} - ${p.url}\n\n`;
    });

    // get the document containing the user list
    const doc = await firestore
        .collection(COLLECTION_NAME)
        .doc(DOCUMENT_NAME)
        .get();

    if (doc.exists) { // check that the doc exists
        doc.data().values.forEach((entry) => {
            // for each user send the notification message
            bot.telegram.sendMessage(entry.id, message);
        });
    }
};