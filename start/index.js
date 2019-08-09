const Telegraf = require("telegraf");
const Firestore = require("@google-cloud/firestore");
const admin = require("firebase-admin");

const PROJECT_ID = process.env.PROJECT_ID;
const COLLECTION_NAME = "default";
const DOCUMENT_NAME = "ids";

// setup Cloud Firestore
const firestore = new Firestore({
    projectId: PROJECT_ID
});

// initialization of the bot
const bot = new Telegraf(process.env.TELEGRAM_API_TOKEN);

const REPLY = "Welcome. You'll receive updates from HackerNews soon! 👍";
bot.start(async (ctx) => {
    ctx.reply(REPLY);
    const chat = await ctx.getChat();

    // store the user id inside the values array of the ids document
    firestore
        .collection(COLLECTION_NAME)
        .doc(DOCUMENT_NAME)
        .update({
            values: admin.firestore.FieldValue.arrayUnion({
                id: chat.id,
                username: chat.username
            })
        });
});

bot.launch();

// entrypoint of the function
exports.start = (req, res) => {
    bot.handleUpdate(req.body, res);
    res.status(200).send();
};