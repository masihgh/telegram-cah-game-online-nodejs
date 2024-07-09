const { Telegraf, session, Scenes } = require('telegraf');
const mongoose = require('mongoose');
const addUser = require('./middleware/addUser');
const GameComposer = require('./composers/GameComposer');
require('dotenv').config();

const bot = new Telegraf(process.env.BOT_TOKEN, {
  telegram: {
    apiRoot: process.env.WORKER_URL
  }
});

mongoose.connect(process.env.MONGODB_URI, {}).then(() => {
  console.log('Connected to MongoDB');
}).catch((err) => {
  console.error('Error connecting to MongoDB:', err);
});

// Use the middleware
bot.use(addUser);
// Use the GameComposer
// Create an instance of GameComposer
const gameComposer = new GameComposer();

// Use session and stage middlewares
bot.use(session());
bot.use(gameComposer.stage.middleware());
bot.use(gameComposer.middleware());

bot.start((ctx) => ctx.reply('Welcome'))
bot.help((ctx) => ctx.reply('Send me a sticker'))


bot.launch();

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
