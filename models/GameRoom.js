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
  rounds: {
    type: Number,
    required: true,
    default: 10,
  },
  cardPack: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'ongoing', 'finished'],
    default: 'pending',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const GameRoom = mongoose.model('GameRoom', GameRoomSchema);

module.exports = GameRoom;
