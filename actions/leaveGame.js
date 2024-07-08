const User = require('../models/User');
const GameRoom = require('../models/GameRoom');

const leaveGame = async (ctx) => {
  const userId = ctx.from.id;
  const groupId = ctx.chat.id;

  // Find the game room for this group
  const room = await GameRoom.findOne({ groupId });
  if (!room) {
    ctx.reply('No game room exists in this group.');
    return;
  }

  // Find the user
  const user = await User.findOne({ userId });
  if (!user) {
    ctx.reply('You must be registered to leave a game room.');
    return;
  }

  // Check if the user is in the game room
  if (!room.players.includes(user._id)) {
    ctx.reply('You are not in the game room.');
    return;
  }

  // Remove the user from the game room
  room.players.pull(user._id);  // Ensure you are using the ObjectId
  await room.save();

  // Update the user's gameRoomId
  user.gameRoomId = null;
  await user.save();

  ctx.reply('You have left the game room.');
};

module.exports = leaveGame;
