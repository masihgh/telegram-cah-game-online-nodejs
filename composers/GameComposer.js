const { Composer, Markup } = require('telegraf');
const GameRoom = require('../models/GameRoom');
const joinGame = require('../actions/joinGame');
const leaveGame = require('../actions/leaveGame');
const User = require('../models/User');

class GameComposer extends Composer {
    constructor() {
        super();

        this.command('creategame', this.createGame);
        this.command('join', this.joinGame);
        this.command('leave', this.leaveGame);
        this.command('players', this.showPlayersList);

        this.action('join_game', joinGame);
        this.action('leave_game', leaveGame);
    }

    async createGame(ctx) {
        const groupId = ctx.chat.id;
        const userId = ctx.from.id;

        const user = await User.findOne({ userId });
        if (!user) {
            ctx.reply('You must be registered to create a game room.');
            return;
        }

        const existingRoom = await GameRoom.findOne({ groupId });
        if (existingRoom) {
            ctx.reply('A game room already exists in this group.');
            return;
        }

        const newRoom = new GameRoom({
            groupId,
            createdBy: user._id,
            players: [user._id],
        });

        await newRoom.save();
        ctx.reply('Game room created! Players can join using /join');

    }

    joinGame(ctx) {
        ctx.reply('Press the button to join the game room', Markup.inlineKeyboard([
            Markup.button.callback('Join Game', 'join_game'),
        ]));
    }

    leaveGame(ctx) {
        ctx.reply('Press the button to leave the game room', Markup.inlineKeyboard([
            Markup.button.callback('Leave Game', 'leave_game'),
        ]));
    }


    async showPlayersList(ctx) {
        const groupId = ctx.chat.id;
        const userId = ctx.from.id;
      
        

      
        // Find the game room for this group
        const room = await GameRoom.findOne({ groupId }).populate('players', 'username');
      
        if (!room) {
          ctx.reply('No game room exists in this group.');
          return;
        }
      
        const user = await User.findOne({ userId });
        if (!user) {
            ctx.reply('You must be registered to create a game room.');
            return;
        }


        // Check if the user is an admin
        if (room.createdBy.toString() !== user._id.toString()) {
            ctx.reply('Only the creator of the game room can view the players list.');
            return;
          }
        

        // Extract usernames from players
        const playerUsernames = room.players.map(player => player.username);
      
        // Send the list of players
        ctx.reply(`Players in the game room:\n${playerUsernames.join('\n')}`);
      }
}

module.exports = GameComposer;
