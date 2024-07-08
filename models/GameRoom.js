const mongoose = require('mongoose');

const gameRoomSchema = new mongoose.Schema({
  groupId: { type: Number, required: true }, // Telegram Group ID
  createdBy: { type: Number, required: true }, // ID of the user who created the room
  players: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Array of players (User references)
  createdAt: { type: Date, default: Date.now },
});

const GameRoom = mongoose.model('GameRoom', gameRoomSchema);

module.exports = GameRoom;
