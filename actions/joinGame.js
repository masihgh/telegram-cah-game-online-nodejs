const User = require('../models/User');
const GameRoom = require('../models/GameRoom');

const joinGame = async (ctx) => {
  const userId = ctx.from.id;
  const groupId = ctx.chat.id;

  // Find the game room for this group
  const room = await GameRoom.findOne({ groupId });
  if (!room) {
    ctx.answerCbQuery('No game room exists in this group. Create one using /creategame');
    return;
  }

  // Find the user
  const user = await User.findOne({ userId });
  if (!user) {
    ctx.answerCbQuery('You must be registered to join a game room.');
    return;
  }

  // Check if the user is already in the game room
  if (room.players.includes(user._id)) {
    ctx.answerCbQuery('You are already in the game room.');
    return;
  }

  // Add the user to the game room
  room.players.push(user._id);  // Ensure you are using the ObjectId
  await room.save();

  // Update the user's gameRoomId
  user.gameRoomId = room._id;
  await user.save();

  ctx.answerCbQuery('You have joined the game room!');
};

module.exports = joinGame;
