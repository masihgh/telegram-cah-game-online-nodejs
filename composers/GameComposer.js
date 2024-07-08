const { Composer, Markup } = require('telegraf');
const GameRoom = require('../models/GameRoom');
const User = require('../models/User');

class GameComposer extends Composer {
    constructor() {
        super();

        // Bind methods to the class instance
        this.isGroupChat = this.isGroupChat.bind(this);
        this.isRegisteredUser = this.isRegisteredUser.bind(this);
        this.createGame = this.createGame.bind(this);
        this.showJoinButton = this.showJoinButton.bind(this);
        this.showLeaveButton = this.showLeaveButton.bind(this);
        this.joinGame = this.joinGame.bind(this);
        this.leaveGame = this.leaveGame.bind(this);
        this.showPlayersList = this.showPlayersList.bind(this);
        this.deleteGame = this.deleteGame.bind(this);

        this.command('creategame', this.createGame);
        this.command('join', this.showJoinButton);
        this.command('leave', this.showLeaveButton);
        this.command('players', this.showPlayersList);
        this.command('deletegame', this.deleteGame);
        this.action(/join_game_(.+)/, this.joinGame);
        this.action(/leave_game_(.+)/, this.leaveGame);
    }

    async isGroupChat(ctx) {
        if (ctx.chat.type !== 'group' && ctx.chat.type !== 'supergroup') {
            await ctx.reply('This command can only be used in group chats.');
            return false;
        }
        return true;
    }

    async isRegisteredUser(ctx) {
        const userId = ctx.from.id;
        const user = await User.findOne({ userId });
        if (!user) {
            await ctx.reply('You must be registered to use this command.');
            return false;
        }
        return user;
    }

    async createGame(ctx) {
        if (!(await this.isGroupChat(ctx))) return;

        const groupId = ctx.chat.id;
        const user = await this.isRegisteredUser(ctx);
        if (!user) return;

        const existingRoom = await GameRoom.findOne({ groupId });
        if (existingRoom) {
            await ctx.reply('A game room already exists in this group.');
            return;
        }

        const newRoom = new GameRoom({
            groupId,
            createdBy: user._id,
            players: [user._id],
        });

        await newRoom.save();
        await ctx.reply('Game room created! Players can join using /join');
    }

    async showJoinButton(ctx) {
        if (!(await this.isGroupChat(ctx))) return;

        await ctx.reply('Press the button to join the game room', Markup.inlineKeyboard([
            Markup.button.callback('Join Game', `join_game_${ctx.chat.id}`)
        ]));
    }

    async showLeaveButton(ctx) {
        if (!(await this.isGroupChat(ctx))) return;

        await ctx.reply('Press the button to leave the game room', Markup.inlineKeyboard([
            Markup.button.callback('Leave Game', `leave_game_${ctx.chat.id}`)
        ]));
    }

    async joinGame(ctx) {
        if (!(await this.isGroupChat(ctx))) return;

        const userId = ctx.from.id;
        const groupId = ctx.match[1];

        const user = await this.isRegisteredUser(ctx);
        if (!user) return;

        const room = await GameRoom.findOne({ groupId });
        if (!room) {
            await ctx.answerCbQuery('No game room exists in this group.');
            return;
        }

        if (room.players.includes(user._id)) {
            await ctx.answerCbQuery('You are already in the game room.');
            return;
        }

        room.players.push(user._id);
        await room.save();

        await ctx.answerCbQuery('You have joined the game room!');
    }

    async leaveGame(ctx) {
        if (!(await this.isGroupChat(ctx))) return;

        const userId = ctx.from.id;
        const groupId = ctx.match[1];

        const user = await this.isRegisteredUser(ctx);
        if (!user) return;

        const room = await GameRoom.findOne({ groupId });
        if (!room) {
            await ctx.answerCbQuery('No game room exists in this group.');
            return;
        }

        const playerIndex = room.players.indexOf(user._id);
        if (playerIndex === -1) {
            await ctx.answerCbQuery('You are not in the game room.');
            return;
        }

        room.players.splice(playerIndex, 1);
        await room.save();

        await ctx.answerCbQuery('You have left the game room.');
    }

    async showPlayersList(ctx) {
        if (!(await this.isGroupChat(ctx))) return;

        const groupId = ctx.chat.id;
        const userId = ctx.from.id;

        const room = await GameRoom.findOne({ groupId }).populate('players');
        if (!room) {
            await ctx.reply('No game room exists in this group.');
            return;
        }

        const user = await User.findOne({ userId });
        if (!user) {
            await ctx.reply('You must be registered to view the players list.');
            return;
        }

        if (room.createdBy.toString() !== user._id.toString()) {
            await ctx.reply('Only the creator of the game room can view the players list.');
            return;
        }

        const buttons = room.players.map(player => Markup.button.url(
            (player.firstName || '') + (player.lastName ? ' ' + player.lastName : ''), 
            `tg://user?id=${player.userId}`
        ));
        await ctx.reply('Players in the game room:', {
            reply_markup: {
                inline_keyboard: buttons.map(button => [button])
            }
        });
    }

    async deleteGame(ctx) {
        if (!(await this.isGroupChat(ctx))) return;

        const groupId = ctx.chat.id;
        const userId = ctx.from.id;

        const room = await GameRoom.findOne({ groupId }).populate('players');
        if (!room) {
            await ctx.reply('No game room exists in this group.');
            return;
        }

        const user = await User.findOne({ userId });
        if (!user) {
            await ctx.reply('You must be registered to delete the game.');
            return;
        }

        if (room.createdBy.toString() !== user._id.toString()) {
            await ctx.reply('Only the creator of the game room can delete the game.');
            return;
        }

        await GameRoom.findOneAndDelete({ groupId });

        await ctx.reply('The game has been deleted.');
    }
}

module.exports = GameComposer;
