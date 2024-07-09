const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class CardPacks {
    constructor(folderPath = path.join(__dirname, '..', 'assets', 'cardPacks')) {
        this.folderPath = folderPath;
        this.cardPacks = this.loadCardPacks();
    }

    loadCardPacks() {
        const cardPacks = [];
        try {
            if (!fs.existsSync(this.folderPath)) {
                console.error(`Error: Directory ${this.folderPath} does not exist.`);
                return cardPacks;
            }

            const files = fs.readdirSync(this.folderPath);
            files.forEach(file => {
                if (file.endsWith('-pack.json')) {
                    const filePath = path.join(this.folderPath, file);
                    const pack = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                    cardPacks.push({
                        name: pack.name,
                        data: pack
                    });
                }
            });
        } catch (error) {
            console.error(`Error loading card packs from ${this.folderPath}:`, error);
        }
        return cardPacks;
    }

    getPackByName(packName) {
        return this.cardPacks.find(pack => pack.name === packName) || null;
    }

    getRandomWhiteCard(packName) {
        const pack = this.getPackByName(packName);
        if (!pack) return null;
        const randomIndex = crypto.randomInt(0, pack.data.white.length);
        return pack.data.white[randomIndex];
    }

    selectRandomBlackCards(packName, count) {
        const pack = this.getPackByName(packName);
        if (!pack) return [];
        
        const selectedCards = new Set();
        while (selectedCards.size < count && selectedCards.size < pack.data.black.length) {
            const randomIndex = crypto.randomInt(0, pack.data.black.length);
            selectedCards.add(pack.data.black[randomIndex]);
        }
        
        return Array.from(selectedCards);
    }
}

module.exports = CardPacks;
