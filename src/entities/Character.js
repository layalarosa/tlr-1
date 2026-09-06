class Character {
    constructor(name, raceId, classId, alignmentId) {
        this.name = name;
        this.race = RACES[raceId];
        this.classData = CLASSES[classId];
        this.alignment = ALIGNMENTS[alignmentId];

        this.level = 1;
        this.exp = 0;
        this.expToNext = this._calcExpToNext();

        this.stats = this._calcBaseStats();
        this.maxHp = this._calcMaxHp();
        this.hp = this.maxHp;
        this.maxMp = this._calcMaxMp();
        this.mp = this.maxMp;

        this.equipment = { weapon: null, body: null, offhand: null };
        this.skills = [...this.classData.skills];
        this.statusEffects = [];
        this.alive = true;
        this.row = this.classData.role === 'front' ? 'front' : 'back';
    }

    _calcBaseStats() {
        const race = this.race;
        const cls = this.classData;
        return {
            str: race.baseStats.str + cls.baseStats.str + race.bonuses.str,
            agi: race.baseStats.agi + cls.baseStats.agi + race.bonuses.agi,
            vit: race.baseStats.vit + cls.baseStats.vit + race.bonuses.vit,
            int: race.baseStats.int + cls.baseStats.int + race.bonuses.int,
            wis: race.baseStats.wis + cls.baseStats.wis + race.bonuses.wis,
            luk: race.baseStats.luk + cls.baseStats.luk + race.bonuses.luk
        };
    }

    _calcMaxHp() {
        return Math.floor((10 + this.classData.hpPerLevel + this.stats.vit) * this.race.hpMod);
    }

    _calcMaxMp() {
        return Math.floor((this.classData.mpPerLevel + Math.floor(this.stats.int / 2) + Math.floor(this.stats.wis / 3)) * this.race.mpMod);
    }

    _calcExpToNext() {
        return Math.floor(20 * this.level * this.race.expMod);
    }

    getAtk() {
        let atk = this.stats.str + this.level;
        if (this.equipment.weapon) {
            atk += ITEMS[this.equipment.weapon].atk || 0;
        }
        return atk;
    }

    getDef() {
        let def = Math.floor(this.stats.vit / 2) + Math.floor(this.level / 2);
        if (this.equipment.body) def += ITEMS[this.equipment.body].def || 0;
        if (this.equipment.offhand) def += ITEMS[this.equipment.offhand].def || 0;
        return def;
    }

    getSpeed() {
        return this.stats.agi + Math.floor(this.stats.luk / 4);
    }

    getMagAtk() {
        return this.stats.int + this.stats.wis + Math.floor(this.level / 2);
    }

    gainExp(amount) {
        this.exp += amount;
        const leveledUp = [];
        while (this.exp >= this.expToNext && this.level < 30) {
            this.levelUp();
            leveledUp.push(this.level);
        }
        return leveledUp;
    }

    levelUp() {
        this.level++;
        this.stats.str += Math.floor(Math.random() * 3) + 1;
        this.stats.agi += Math.floor(Math.random() * 2) + 1;
        this.stats.vit += Math.floor(Math.random() * 3) + 1;
        this.stats.int += Math.floor(Math.random() * 2) + 1;
        this.stats.wis += Math.floor(Math.random() * 2) + 1;
        this.stats.luk += Math.floor(Math.random() * 2);

        const oldMaxHp = this.maxHp;
        const oldMaxMp = this.maxMp;
        this.maxHp = this._calcMaxHp();
        this.maxMp = this._calcMaxMp();
        this.hp += (this.maxHp - oldMaxHp);
        this.mp += (this.maxMp - oldMaxMp);
        this.expToNext = this._calcExpToNext();
    }

    heal(amount) {
        this.hp = Math.min(this.hp + amount, this.maxHp);
    }

    restoreMp(amount) {
        this.mp = Math.min(this.mp + amount, this.maxMp);
    }

    takeDamage(amount) {
        const actualDmg = Math.max(1, amount - this.getDef());
        this.hp -= actualDmg;
        if (this.hp <= 0) {
            this.hp = 0;
            this.alive = false;
        }
        return actualDmg;
    }

    isAlive() {
        return this.alive && this.hp > 0;
    }

    canCastSpell(spellId) {
        const spellCost = this._getSpellCost(spellId);
        return this.mp >= spellCost;
    }

    _getSpellCost(spellId) {
        const costs = {
            fireball: 8, iceSpike: 6, lightning: 12,
            heal: 5, bless: 4, curePoison: 3,
            holySmite: 7, layOnHands: 10,
            entangle: 5
        };
        return costs[spellId] || 5;
    }

    toSaveData() {
        return {
            name: this.name,
            raceId: this.race.id,
            classId: this.classData.id,
            alignmentId: Object.keys(ALIGNMENTS).find(k => ALIGNMENTS[k].name === this.alignment.name),
            level: this.level,
            exp: this.exp,
            stats: { ...this.stats },
            hp: this.hp,
            mp: this.mp,
            equipment: { ...this.equipment },
            alive: this.alive,
            row: this.row
        };
    }

    static fromSaveData(data) {
        const char = new Character(data.name, data.raceId, data.classId, data.alignmentId);
        char.level = data.level;
        char.exp = data.exp;
        char.stats = { ...data.stats };
        char.maxHp = char._calcMaxHp();
        char.maxMp = char._calcMaxMp();
        char.hp = data.hp;
        char.mp = data.mp;
        char.equipment = { ...data.equipment };
        char.alive = data.alive;
        char.row = data.row;
        char.expToNext = char._calcExpToNext();
        return char;
    }
}
