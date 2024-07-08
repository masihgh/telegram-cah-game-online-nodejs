const { Composer, Markup } = require('telegraf');
const GameRoom = require('../models/GameRoom');
const joinGame = require('../actions/joinGame');
const leaveGame = require('../actions/leaveGame');
const User = require('../models/User');

class GameComposer extends Composer {
    constructor() {
        super();

        this.command('creategame', this.createGame);
        this.command('join', this.showJoinButton);
        this.command('leave', this.showLeaveButton);
        this.command('players', this.showPlayersList);
        this.command('deletegame', this.DeleteGame);
        this.action(/join_game_(.+)/, this.joinGame);
        this.action(/leave_game_(.+)/, this.leaveGame);
    }

    async createGame(ctx) {
        if (ctx.chat.type !== 'group' && ctx.chat.type !== 'supergroup') {
            ctx.reply('This command can only be used in group chats.');
            return;
        }

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

    showJoinButton(ctx) {
        if (ctx.chat.type !== 'group' && ctx.chat.type !== 'supergroup') {
            ctx.reply('This command can only be used in group chats.');
            return;
        }

        ctx.reply('Press the button to join the game room', Markup.inlineKeyboard([
            Markup.button.callback('Join Game', `join_game_${ctx.chat.id}`)
        ]));
    }

    showLeaveButton(ctx) {
        if (ctx.chat.type !== 'group' && ctx.chat.type !== 'supergroup') {
            ctx.reply('This command can only be used in group chats.');
            return;
        }
        ctx.reply('Press the button to leave the game room', Markup.inlineKeyboard([
            Markup.button.callback('Leave Game', `leave_game_${ctx.chat.id}`)
        ]));
    }

    async joinGame(ctx) {
        if (ctx.chat.type !== 'group' && ctx.chat.type !== 'supergroup') {
            ctx.reply('This command can only be used in group chats.');
            return;
        }
        
        const userId = ctx.from.id;
        const groupId = ctx.match[1];

        const user = await User.findOne({ userId });
        if (!user) {
            ctx.answerCbQuery('You must be registered to join a game room.');
            return;
        }

        const room = await GameRoom.findOne({ groupId });
        if (!room) {
            ctx.answerCbQuery('No game room exists in this group.');
            return;
        }

        if (room.players.includes(user._id)) {
            ctx.answerCbQuery('You are already in the game room.');
            return;
        }

        room.players.push(user._id);
        await room.save();

        ctx.answerCbQuery('You have joined the game room!');
    }

    async leaveGame(ctx) {
        if (ctx.chat.type !== 'group' && ctx.chat.type !== 'supergroup') {
            ctx.reply('This command can only be used in group chats.');
            return;
        }

        const userId = ctx.from.id;
        const groupId = ctx.match[1];

        const user = await User.findOne({ userId });
        if (!user) {
            ctx.answerCbQuery('You must be registered to leave a game room.');
            return;
        }

        const room = await GameRoom.findOne({ groupId });
        if (!room) {
            ctx.answerCbQuery('No game room exists in this group.');
            return;
        }

        const playerIndex = room.players.indexOf(user._id);
        if (playerIndex === -1) {
            ctx.answerCbQuery('You are not in the game room.');
            return;
        }

        room.players.splice(playerIndex, 1);
        await room.save();

        ctx.answerCbQuery('You have left the game room.');
    }

    async showPlayersList(ctx) {
        const groupId = ctx.chat.id;
        const userId = ctx.from.id;

        const room = await GameRoom.findOne({ groupId }).populate('players');
        if (!room) {
            ctx.reply('No game room exists in this group.');
            return;
        }

        const user = await User.findOne({ userId });
        if (!user) {
            ctx.reply('You must be registered to view the players list.');
            return;
        }

        if (room.createdBy.toString() !== user._id.toString()) {
            ctx.reply('Only the creator of the game room can view the players list.');
            return;
        }
        

        const buttons = room.players.map(player => Markup.button.url((player.firstName || '') + (player.lastName ? ' ' + player.lastName : ''), `tg://user?id=${player.userId}`));
        ctx.reply('Players in the game room:', {
            reply_markup: {
                inline_keyboard: buttons.map(button => [button])
            }
        });
    }

    async DeleteGame (ctx){
        if (ctx.chat.type !== 'group' && ctx.chat.type !== 'supergroup') {
            ctx.reply('This command can only be used in group chats.');
            return;
        }

        const groupId = ctx.chat.id;
        const userId = ctx.from.id;
      
        // Check if the user is authorized to delete the game
        const room = await GameRoom.findOne({ groupId }).populate('players');
        if (!room) {
          ctx.reply('No game room exists in this group.');
          return;
        }
      
        const user = await User.findOne({ userId });
        if (!user) {
          ctx.reply('You must be registered to delete the game.');
          return;
        }
      
        if (room.createdBy.toString() !== user._id.toString()) {
          ctx.reply('Only the creator of the game room can delete the game.');
          return;
        }
      
        // Perform actions to delete the game room
        await GameRoom.findOneAndDelete({ groupId });
      
        ctx.reply('The game has been deleted.');
    }
      
}

module.exports = GameComposer;
