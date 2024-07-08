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






// Command: /creategame
bot.command('creategame', async (ctx) => {
  const groupId = ctx.chat.id;
  const createdBy = ctx.from.id;

  // Check if a game room already exists for this group
  const existingRoom = await GameRoom.findOne({ groupId });
  if (existingRoom) {
    ctx.reply('A game room already exists in this group.');
    return;
  }

  // Create a new game room
  const newRoom = new GameRoom({
    groupId,
    createdBy,
    players: [createdBy], // Add the creator as the first player
  });

  await newRoom.save();
  ctx.reply('Game room created! Players can join using /join');
});

// Command: /join
bot.command('join', async (ctx) => {
  const userId = ctx.from.id;
  const groupId = ctx.chat.id;

  // Find the game room for this group
  const room = await GameRoom.findOne({ groupId });
  if (!room) {
    ctx.reply('No game room exists in this group. Create one using /creategame');
    return;
  }

  // Check if the user is already in the game room
  const userInRoom = await User.findOne({ userId, gameRoomId: room._id });
  if (userInRoom) {
    ctx.reply('You are already in the game room.');
    return;
  }

  // Add user to the game room
  await User.updateOne({ userId }, { gameRoomId: room._id });
  await GameRoom.updateOne({ _id: room._id }, { $push: { players: userId } });

  ctx.reply('You have joined the game room!');
});

// Command: /leave
bot.command('leave', async (ctx) => {
  const userId = ctx.from.id;
  const groupId = ctx.chat.id;

  // Find the game room for this group
  const room = await GameRoom.findOne({ groupId });
  if (!room) {
    ctx.reply('No game room exists in this group.');
    return;
  }

  // Check if the user is in the game room
  const userInRoom = await User.findOne({ userId, gameRoomId: room._id });
  if (!userInRoom) {
    ctx.reply('You are not in the game room.');
    return;
  }

  // Remove user from the game room
  await User.updateOne({ userId }, { $unset: { gameRoomId: 1 } });
  await GameRoom.updateOne({ _id: room._id }, { $pull: { players: userId } });

  ctx.reply('You have left the game room.');
});






bot.launch()
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
