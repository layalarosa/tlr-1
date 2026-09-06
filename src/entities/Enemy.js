class Enemy {
    constructor(templateId, floorLevel) {
        const template = ENEMIES[templateId];
        this.templateId = templateId;
        this.name = template.name;
        this.boss = template.boss || false;

        const levelMod = 1 + (floorLevel - 1) * 0.1;
        this.maxHp = Math.floor(template.hp * levelMod);
        this.hp = this.maxHp;
        this.atk = Math.floor(template.atk * levelMod);
        this.def = Math.floor(template.def * levelMod);
        this.exp = Math.floor(template.exp * levelMod);
        this.gold = Math.floor(template.gold * levelMod);
        this.sprite = template.sprite;

        this.statusEffects = [];
        this.alive = true;
    }

    takeDamage(amount) {
        const actualDmg = Math.max(1, amount - this.def);
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
        const aliveTargets = party.filter(c => c.isAlive());
        if (aliveTargets.length === 0) return null;
        return aliveTargets[Math.floor(Math.random() * aliveTargets.length)];
    }
}
