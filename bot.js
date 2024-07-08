const { Telegraf } = require('telegraf')
const { message } = require('telegraf/filters')
const mongoose = require('mongoose');
const User = require('./models/User');

require('dotenv').config()


const bot = new Telegraf(process.env.BOT_TOKEN, {
    telegram: { 
        apiRoot: process.env.WORKER_URL,
     }
  });


mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((err) => {
    console.error('Error connecting to MongoDB:', err);
  });


  // Middleware to add user to database
bot.use(async (ctx, next) => {
  const userId = ctx.from.id;

  let user = await User.findOne({ userId });

  if (!user) {
    user = new User({
      userId,
      username: ctx.from.username,
      firstName: ctx.from.first_name,
      lastName: ctx.from.last_name,
    });
    await user.save();
    console.log(`New user added: ${user.username}`);
  }

  await next();
});

bot.start((ctx) => ctx.reply('Welcome'))
bot.help((ctx) => ctx.reply('Send me a sticker'))
bot.on(message('sticker'), (ctx) => ctx.reply('👍'))
bot.hears('hi', (ctx) => ctx.reply('Hey there'))

bot.hears('pol', (ctx) => {
  ctx.replyWithPoll("Your favorite math constant", ["x", "e", "π", "φ", "γ"], {
		is_anonymous: false,
	})
})


bot.on('poll_answer', (ctx) => {
  console.log(ctx);
})


bot.launch()
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
