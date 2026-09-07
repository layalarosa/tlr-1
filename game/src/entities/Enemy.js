var ENEMY_VARIANTS = [
    { prefix: '', atkMod: 0, defMod: 0, hpMod: 0, weight: 50 },
    { prefix: 'Débil ', atkMod: -2, defMod: -1, hpMod: -3, weight: 15 },
    { prefix: 'Herido ', atkMod: -1, defMod: 0, hpMod: -2, weight: 10 },
    { prefix: 'Fuerte ', atkMod: 2, defMod: 1, hpMod: 5, weight: 12 },
    { prefix: 'Veterano ', atkMod: 3, defMod: 2, hpMod: 8, weight: 6 },
    { prefix: 'Élite ', atkMod: 5, defMod: 3, hpMod: 12, weight: 4 },
    { prefix: 'Aberrante ', atkMod: 4, defMod: -1, hpMod: 15, weight: 3 }
];

class Enemy {
    constructor(templateId, floorLevel) {
        const template = ENEMIES[templateId];
        this.templateId = templateId;
        this.boss = template.boss || false;

        var variant = this._rollVariant();
        this.variantPrefix = variant.prefix;
        this.name = variant.prefix + template.name;

        const levelMod = 1 + (floorLevel - 1) * 0.1;
        this.maxHp = Math.floor((template.hp + variant.hpMod) * levelMod);
        this.hp = this.maxHp;
        this.atk = Math.floor((template.atk + variant.atkMod) * levelMod);
        this.def = Math.floor((template.def + variant.defMod) * levelMod);
        this.magDef = Math.floor((template.magDef || Math.floor(template.def * 0.6)) * levelMod);
        this.exp = Math.floor(template.exp * levelMod * (variant.prefix ? 1.1 : 1));
        this.gold = Math.floor(template.gold * levelMod * (variant.prefix ? 1.15 : 1));
        this.sprite = template.sprite;
        this.speed = 5 + Math.floor(Math.random() * 5);
        this.skills = template.skills || [];
        this.statusEffects = [];
        this.alive = true;
        this.defending = false;
        this._turnCount = 0;
        this._originalAtk = this.atk;
    }

    _rollVariant() {
        var total = 0;
        for (var i = 0; i < ENEMY_VARIANTS.length; i++) total += ENEMY_VARIANTS[i].weight;
        var r = Math.random() * total;
        var acc = 0;
        for (var i = 0; i < ENEMY_VARIANTS.length; i++) {
            acc += ENEMY_VARIANTS[i].weight;
            if (r < acc) return ENEMY_VARIANTS[i];
        }
        return ENEMY_VARIANTS[0];
    }

    takeDamage(amount, isMagic) {
        var reduction = isMagic ? this.magDef : this.def;
        if (this.defending) reduction = Math.floor(reduction * 1.5);
        const actualDmg = Math.max(1, amount - reduction);
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

    chooseTarget(party) {
        const aliveTargets = party.filter(function(c) { return c.isAlive(); });
        if (aliveTargets.length === 0) return null;
        return aliveTargets[Math.floor(Math.random() * aliveTargets.length)];
    }

    chooseAction() {
        this._turnCount++;
        if (this.skills.length === 0) return 'attack';

        var hpPct = this.hp / this.maxHp;
        var rng = Math.random();

        if (this.boss) {
            if (hpPct < 0.3 && rng < 0.4) return 'drain_life';
            if (rng < 0.3) return this.skills[Math.floor(Math.random() * this.skills.length)];
            if (rng < 0.5) return 'dark_bolt';
            return 'attack';
        }

        if (this._turnCount <= 2 && rng < 0.3 && this.skills.indexOf('war_cry') !== -1) return 'war_cry';

        if (hpPct < 0.5 && rng < 0.3) {
            var healSkill = this.skills.filter(function(s) { return s === 'drain_life'; });
            if (healSkill.length > 0) return 'drain_life';
        }

        var skillChance = 0.35;
        if (rng < skillChance && this.skills.length > 0) {
            return this.skills[Math.floor(Math.random() * this.skills.length)];
        }

        return 'attack';
    }
}
