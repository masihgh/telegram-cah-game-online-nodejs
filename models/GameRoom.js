const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const GameRoomSchema = new Schema({
  groupId: {
    type: Number,
    required: true,
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    required: true,
  },
  players: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const GameRoom = mongoose.model('GameRoom', GameRoomSchema);

module.exports = GameRoom;
