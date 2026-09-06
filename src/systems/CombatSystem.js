class CombatSystem {
    constructor(party, enemies) {
        this.party = party;
        this.enemies = enemies;
        this.turnOrder = [];
        this.currentTurn = 0;
        this.log = [];
    }

    calculateTurnOrder() {
        const combatants = [];
        const self = this;

        this.party.forEach(function(char, idx) {
            if (char.isAlive()) {
                combatants.push({ type: 'party', index: idx, speed: char.getSpeed(), entity: char });
            }
        });

        this.enemies.forEach(function(enemy, idx) {
            if (enemy.isAlive()) {
                combatants.push({ type: 'enemy', index: idx, speed: 5 + Math.floor(Math.random() * 5), entity: enemy });
            }
        });

        combatants.sort(function(a, b) { return b.speed - a.speed; });
        this.turnOrder = combatants;
        this.currentTurn = 0;
    }

    getCurrentCombatant() {
        if (this.currentTurn >= this.turnOrder.length) return null;
        const c = this.turnOrder[this.currentTurn];
        if (!c.entity.isAlive()) {
            this.currentTurn++;
            return this.getCurrentCombatant();
        }
        return c;
    }

    nextTurn() {
        this.currentTurn++;
        if (this.currentTurn >= this.turnOrder.length) {
            this.calculateTurnOrder();
        }
    }

    executeAction(combatant, action, target) {
        var result = { type: action, attacker: combatant.entity.name, damage: 0, message: '' };

        switch (action) {
            case 'attack': {
                var atk = combatant.entity.getAtk();
                var isCrit = Math.random() < 0.1;
                var baseDmg = atk + Math.floor(Math.random() * 5);
                var dmg = target.takeDamage(isCrit ? Math.floor(baseDmg * 1.5) : baseDmg);
                result.damage = dmg;
                result.critical = isCrit;
                result.message = combatant.entity.name + ' ataca a ' + target.name + ' por ' + dmg + ' dano' + (isCrit ? ' (CRITICO!)' : '');
                break;
            }
            case 'magic': {
                var spellId = target;
                var cost = combatant.entity._getSpellCost(spellId);
                if (!combatant.entity.canCastSpell(spellId)) {
                    result.message = combatant.entity.name + ' no tiene suficiente MP!';
                    return result;
                }
                combatant.entity.mp -= cost;
                var magAtk = combatant.entity.getMagAtk();
                result = this._castSpell(combatant.entity, spellId, magAtk);
                break;
            }
            case 'defend': {
                result.message = combatant.entity.name + ' se defiende.';
                combatant.entity.defending = true;
                break;
            }
            case 'item': {
                var item = ITEMS[target.itemId];
                if (item && item.effect === 'heal') {
                    target.heal(item.value);
                    result.message = combatant.entity.name + ' usa ' + item.name + '. +' + item.value + ' HP';
                } else if (item && item.effect === 'revive') {
                    target.alive = true;
                    target.hp = Math.floor(target.maxHp * 0.5);
                    result.message = combatant.entity.name + ' usa ' + item.name + '. Resucitado!';
                }
                break;
            }
            case 'flee': {
                var fleeChance = 0.3 + combatant.entity.stats.agi * 0.02;
                result.fled = Math.random() < fleeChance;
                result.message = result.fled ? 'Huyes del combate!' : 'No pudiste huir!';
                break;
            }
        }

        this.log.push(result.message);
        return result;
    }

    enemyAction(enemy) {
        var aliveParty = this.party.filter(function(c) { return c.isAlive(); });
        if (aliveParty.length === 0) return { message: 'No hay objetivos.' };

        var target = aliveParty[Math.floor(Math.random() * aliveParty.length)];
        var atk = enemy.atk + Math.floor(Math.random() * 3);
        var isCrit = Math.random() < 0.05;
        var dmg = target.takeDamage(isCrit ? Math.floor(atk * 1.5) : atk);

        var msg = enemy.name + ' ataca a ' + target.name + ' por ' + dmg + ' dano' + (isCrit ? ' (CRITICO!)' : '');
        this.log.push(msg);
        return { message: msg, damage: dmg, target: target.name };
    }

    _castSpell(caster, spellId, magAtk) {
        var result = { type: 'magic', attacker: caster.name, message: '' };

        switch (spellId) {
            case 'fireball':
            case 'iceSpike':
            case 'lightning':
            case 'holySmite':
            case 'entangle': {
                var aliveEnemies = this.enemies.filter(function(e) { return e.isAlive(); });
                if (aliveEnemies.length === 0) return result;
                var target = aliveEnemies[Math.floor(Math.random() * aliveEnemies.length)];
                var dmg = target.takeDamage(magAtk + Math.floor(Math.random() * 8));
                result.damage = dmg;
                result.message = caster.name + ' lanza ' + spellId + ' a ' + target.name + ' por ' + dmg + ' dano';
                break;
            }
            case 'heal': {
                var allies = this.party.filter(function(c) { return c.isAlive(); });
                if (allies.length === 0) break;
                var target2 = allies.reduce(function(a, b) { return (a.hp / a.maxHp < b.hp / b.maxHp ? a : b); });
                var healAmt = magAtk + Math.floor(Math.random() * 10);
                target2.heal(healAmt);
                result.message = caster.name + ' cura a ' + target2.name + ' por ' + healAmt + ' HP';
                break;
            }
            case 'bless': {
                var ally = this.party.filter(function(c) { return c.isAlive(); })[0];
                if (ally) {
                    ally.blessed = true;
                    result.message = caster.name + ' bendice a ' + ally.name + '. Ataque aumentado.';
                }
                break;
            }
            case 'curePoison': {
                var poisoned = this.party.filter(function(c) { return c.isAlive() && c.statusEffects && c.statusEffects.indexOf('poison') !== -1; });
                if (poisoned.length > 0) {
                    poisoned[0].statusEffects = poisoned[0].statusEffects.filter(function(e) { return e !== 'poison'; });
                    result.message = caster.name + ' cura el veneno de ' + poisoned[0].name;
                }
                break;
            }
            case 'layOnHands': {
                var wounded = this.party.filter(function(c) { return c.isAlive() && c.hp < c.maxHp; });
                if (wounded.length > 0) {
                    var target3 = wounded.reduce(function(a, b) { return (a.hp < b.hp ? a : b); });
                    var healAmt2 = magAtk * 2;
                    target3.heal(healAmt2);
                    result.message = caster.name + ' impone manos a ' + target3.name + '. +' + healAmt2 + ' HP';
                }
                break;
            }
        }
        return result;
    }

    isBattleOver() {
        var partyAlive = this.party.some(function(c) { return c.isAlive(); });
        var enemiesAlive = this.enemies.some(function(e) { return e.isAlive(); });
        return !partyAlive || !enemiesAlive;
    }

    getVictory() {
        var allExp = this.enemies.reduce(function(sum, e) { return sum + e.exp; }, 0);
        var allGold = this.enemies.reduce(function(sum, e) { return sum + e.gold; }, 0);
        return { exp: allExp, gold: allGold };
    }
}
