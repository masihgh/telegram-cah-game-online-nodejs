const { Telegraf } = require('telegraf')
const { message } = require('telegraf/filters')
require('dotenv').config()
const mongoose = require('mongoose');

const bot = new Telegraf(process.env.BOT_TOKEN)

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((err) => {
    console.error('Error connecting to MongoDB:', err);
  });

bot.start((ctx) => ctx.reply('Welcome'))


// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
