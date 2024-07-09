const { Composer, Markup, Scenes, session } = require('telegraf');
const GameRoom = require('../models/GameRoom');
const User = require('../models/User');
const CardPacks = require('../helpers/CardPack');

// Wizard Steps
const { WizardScene } = Scenes;
const cardPacks = new CardPacks();

const gameCreationWizard = new WizardScene(
    'game-creation-wizard',
    async (ctx) => {
        // Step 1: Choose Card Pack
        await ctx.reply('Please choose a card pack:', Markup.inlineKeyboard(
            cardPacks.cardPacks.map((pack, index) => [
                Markup.button.callback(`${pack.name} | ◼️: ${pack?.data?.black?.length} ▫️: ${pack?.data?.white?.length}`, `card_pack_${index + 1}`)
            ])
        ));
        return ctx.wizard.next();
    },
    async (ctx) => {
        // Step 2: Choose Rounds
        ctx.wizard.state.cardPack = ctx.callbackQuery.data;
        ctx.reply('Please enter the number of rounds (1-10):');
        return ctx.wizard.next();
    },
    async (ctx) => {
        // Step 3: Create Game
        const rounds = parseInt(ctx.message.text);
        if (isNaN(rounds) || rounds < 1 || rounds > 10) {
            ctx.reply('Invalid number of rounds. Please enter a number between 1 and 10:');
            return;
        }
        
        const groupId = ctx.chat.id;
        const userId = ctx.from.id;
        
        const user = await User.findOne({ userId });
        if (!user) {
            ctx.reply('You must be registered to create a game room.');
            return ctx.scene.leave();
        }
        
        const existingRoom = await GameRoom.findOne({ groupId });
        if (existingRoom) {
            ctx.reply('A game room already exists in this group.');
            return ctx.scene.leave();
        }
        
        const newRoom = new GameRoom({
            groupId,
            createdBy: user._id,
            players: [user._id],
            cardPack: ctx.wizard.state.cardPack,
            rounds: rounds,
        });

        await newRoom.save();
        ctx.reply('Game room created! Players can join using /join');
        return ctx.scene.leave();
    }
);

class GameComposer extends Composer {
    constructor() {
        super();

        // Bind methods to the class instance
        this.isGroupChat = this.isGroupChat.bind(this);
        this.isRegisteredUser = this.isRegisteredUser.bind(this);
        this.createGameWizard = this.createGameWizard.bind(this);
        this.showJoinButton = this.showJoinButton.bind(this);
        this.showLeaveButton = this.showLeaveButton.bind(this);
        this.joinGame = this.joinGame.bind(this);
        this.leaveGame = this.leaveGame.bind(this);
        this.showPlayersList = this.showPlayersList.bind(this);
        this.deleteGame = this.deleteGame.bind(this);

        // Create Scene Manager and add Wizard
        this.stage = new Scenes.Stage([gameCreationWizard]);

        this.command('creategame', this.createGameWizard);
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

    async createGameWizard(ctx) {
        if (!(await this.isGroupChat(ctx))) return;

        const user = await this.isRegisteredUser(ctx);
        if (!user) return;

        ctx.scene.enter('game-creation-wizard');
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
