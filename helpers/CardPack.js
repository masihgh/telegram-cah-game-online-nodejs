const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class CardPack {
    constructor(folderPath = path.join(__dirname, 'assets', 'cardPacks')) {
        this.folderPath = folderPath;
        this.packs = this.loadPacks();
    }

    loadPacks() {
        const packs = {};
        try {
            const files = fs.readdirSync(this.folderPath);
            files.forEach(file => {
                if (file.endsWith('-pack.json')) {
                    const filePath = path.join(this.folderPath, file);
                    const pack = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                    const packName = pack.name;
                    packs[packName] = pack;
                }
            });
        } catch (error) {
            console.error(`Error loading packs from ${this.folderPath}:`, error);
        }
        return packs;
    }

    getPack(packName) {
        return this.packs[packName] || null;
    }

    getNumBlackCards(packName) {
        const pack = this.getPack(packName);
        return pack ? pack.black.length : 0;
    }

    getNumWhiteCards(packName) {
        const pack = this.getPack(packName);
        return pack ? pack.white.length : 0;
    }

    getRandomWhiteCard(packName) {
        const pack = this.getPack(packName);
        if (!pack) return null;
        const randomIndex = crypto.randomInt(0, pack.white.length);
        return pack.white[randomIndex];
    }

    selectRandomBlackCards(packName, count) {
        const pack = this.getPack(packName);
        if (!pack) return [];
        const selectedCards = new Set();
        while (selectedCards.size < count && selectedCards.size < pack.black.length) {
            const randomIndex = crypto.randomInt(0, pack.black.length);
            selectedCards.add(pack.black[randomIndex]);
        }
        return Array.from(selectedCards);
    }
}

module.exports = CardPack;
