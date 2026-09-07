class CombatSystem {
    constructor(party, enemies) {
        this.party = party;
        this.enemies = enemies;
        this.turnOrder = [];
        this.currentTurn = 0;
        this.log = [];
    }

    calculateTurnOrder() {
        var combatants = [];

        this.party.forEach(function(char, idx) {
            if (char.isAlive()) {
                combatants.push({ type: 'party', index: idx, speed: char.getSpeed(), entity: char });
            }
        });

        this.enemies.forEach(function(enemy, idx) {
            if (enemy.isAlive()) {
                combatants.push({ type: 'enemy', index: idx, speed: enemy.speed || (5 + Math.floor(Math.random() * 5)), entity: enemy });
            }
        });

        combatants.sort(function(a, b) { return b.speed - a.speed; });
        this.turnOrder = combatants;
        this.currentTurn = 0;
    }

    getCurrentCombatant() {
        if (this.currentTurn >= this.turnOrder.length) return null;
        var startTurn = this.currentTurn;
        while (this.currentTurn < this.turnOrder.length) {
            var c = this.turnOrder[this.currentTurn];
            if (c.entity.isAlive()) return c;
            this.currentTurn++;
        }
        return null;
    }

    nextTurn() {
        this.currentTurn++;
        if (this.currentTurn >= this.turnOrder.length) {
            this._resetBuffs();
            this.calculateTurnOrder();
        }
    }

    _resetBuffs() {
        this.party.forEach(function(c) {
            c.defending = false;
            c.blessed = false;
            c.buffed = false;
            c.poisonBlade = false;
            c.vanished = false;
        });
        this.enemies.forEach(function(e) {
            e.defending = false;
            e.entangled = false;
            if (e._originalAtk !== undefined) e.atk = e._originalAtk;
        });
    }

    _removeDeadFromTurnOrder() {
        this.turnOrder = this.turnOrder.filter(function(c) { return c.entity.isAlive(); });
    }

    executeAction(combatant, action, target) {
        var result = { type: action, attacker: combatant.entity.name, damage: 0, message: '' };

        switch (action) {
            case 'attack': {
                var atk = combatant.entity.getAtk();
                if (combatant.entity.blessed) atk = Math.floor(atk * 1.3);
                if (combatant.entity.buffed) atk = Math.floor(atk * 1.3);
                if (combatant.entity.vanished) { atk = Math.floor(atk * 1.8); combatant.entity.vanished = false; }
                var isCrit = Math.random() < 0.1;
                var baseDmg = atk + Math.floor(Math.random() * 5);
                if (target.defending) baseDmg = Math.floor(baseDmg * 0.5);
                if (target.entangled) baseDmg = Math.floor(baseDmg * 1.3);
                var dmg = target.takeDamage(isCrit ? Math.floor(baseDmg * 1.5) : baseDmg);
                if (combatant.entity.poisonBlade && target.statusEffects && target.statusEffects.indexOf('poison') === -1) {
                    target.statusEffects.push('poison');
                    combatant.entity.poisonBlade = false;
                }
                result.damage = dmg;
                result.critical = isCrit;
                result.message = combatant.entity.name + ' ataca a ' + target.name + ' por ' + dmg + ' dano' + (isCrit ? ' (CRITICO!)' : '') + (target.defending ? ' (defendido)' : '');
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
                if (combatant.entity.blessed) magAtk = Math.floor(magAtk * 1.2);
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
                } else if (item && item.effect === 'mana') {
                    target.restoreMp(item.value);
                    result.message = combatant.entity.name + ' usa ' + item.name + '. +' + item.value + ' MP';
                }
                break;
            }
            case 'flee': {
                var fleeChance = 0.3 + combatant.entity.stats.agi * 0.02;
                result.fled = Math.random() < fleeChance;
                result.message = result.fled ? 'Huyes del combate!' : 'No pudiste huir!';
                break;
            }
            case 'skill': {
                var skillId = target;
                var cost = combatant.entity._getSpellCost(skillId);
                if (cost > 0 && !combatant.entity.canCastSpell(skillId)) {
                    result.message = combatant.entity.name + ' no tiene suficiente MP!';
                    return result;
                }
                if (cost > 0) combatant.entity.mp -= cost;
                result = this._useSkill(combatant.entity, skillId);
                break;
            }
        }

        this.log.push(result.message);
        return result;
    }

    enemyAction(enemy) {
        var aliveParty = this.party.filter(function(c) { return c.isAlive(); });
        if (aliveParty.length === 0) return { message: 'No hay objetivos.' };
        if (enemy.entangled) {
            enemy.entangled = false;
            var msg = enemy.name + ' esta enredado y no puede actuar!';
            this.log.push(msg);
            return { message: msg, damage: 0 };
        }

        var action = enemy.chooseAction ? enemy.chooseAction() : 'attack';

        switch (action) {
            case 'poison_bite': {
                var target = aliveParty[Math.floor(Math.random() * aliveParty.length)];
                var atk = enemy.atk + Math.floor(Math.random() * 3);
                var isCrit = Math.random() < 0.05;
                var dmg = target.takeDamage(isCrit ? Math.floor(atk * 1.5) : atk);
                if (Math.random() < 0.4 && target.statusEffects.indexOf('poison') === -1) {
                    target.statusEffects.push('poison');
                    var msg = enemy.name + ' muerde a ' + target.name + ' por ' + dmg + ' dano' + (isCrit ? ' (CRITICO!)' : '') + ' y envenena!';
                } else {
                    var msg = enemy.name + ' muerde a ' + target.name + ' por ' + dmg + ' dano' + (isCrit ? ' (CRITICO!)' : '');
                }
                this.log.push(msg);
                return { message: msg, damage: dmg, target: target.name, targetObj: target };
            }
            case 'fire_breath': {
                var targets = aliveParty.slice(0, 2);
                var totalDmg = 0;
                var self = this;
                targets.forEach(function(t) {
                    var fireAtk = Math.floor(enemy.atk * 0.8);
                    var d = t.takeDamage(fireAtk, true);
                    totalDmg += d;
                });
                var msg = enemy.name + ' escupe fuego! ' + totalDmg + ' dano total';
                this.log.push(msg);
                return { message: msg, damage: totalDmg, targetObj: targets[0] };
            }
            case 'ice_shard': {
                var target = aliveParty[Math.floor(Math.random() * aliveParty.length)];
                var iceAtk = Math.floor(enemy.atk * 0.9);
                var d = target.takeDamage(iceAtk, true);
                if (Math.random() < 0.3) {
                    target.statusEffects.push('slow');
                    var msg = enemy.name + ' lanza hielo a ' + target.name + ' por ' + d + ' dano. Ralentizado!';
                } else {
                    var msg = enemy.name + ' lanza hielo a ' + target.name + ' por ' + d + ' dano';
                }
                this.log.push(msg);
                return { message: msg, damage: d, target: target.name, targetObj: target };
            }
            case 'dark_bolt': {
                var target = aliveParty[Math.floor(Math.random() * aliveParty.length)];
                var darkAtk = Math.floor(enemy.atk * 1.2);
                var d = target.takeDamage(darkAtk, true);
                var msg = enemy.name + ' lanza oscuridad a ' + target.name + ' por ' + d + ' dano';
                this.log.push(msg);
                return { message: msg, damage: d, target: target.name, targetObj: target };
            }
            case 'crushing_blow': {
                var target = aliveParty[Math.floor(Math.random() * aliveParty.length)];
                var crushAtk = Math.floor(enemy.atk * 1.4);
                var d = target.takeDamage(crushAtk);
                var msg = enemy.name + ' golpea con fuerza a ' + target.name + ' por ' + d + ' dano!';
                this.log.push(msg);
                return { message: msg, damage: d, target: target.name, targetObj: target };
            }
            case 'summon_minion': {
                var msg = enemy.name + ' invoca un esqueleto!';
                this.log.push(msg);
                return { message: msg, damage: 0 };
            }
            case 'drain_life': {
                var target = aliveParty[Math.floor(Math.random() * aliveParty.length)];
                var drainAtk = Math.floor(enemy.atk * 0.7);
                var d = target.takeDamage(drainAtk, true);
                enemy.hp = Math.min(enemy.hp + Math.floor(d / 2), enemy.maxHp);
                var msg = enemy.name + ' drena vida de ' + target.name + ' por ' + d + ' dano. Recupera ' + Math.floor(d / 2) + ' HP';
                this.log.push(msg);
                return { message: msg, damage: d, target: target.name, targetObj: target };
            }
            case 'war_cry': {
                var msg = enemy.name + ' grita con furia! Ataque aumentado';
                enemy.atk = Math.floor(enemy.atk * 1.2);
                this.log.push(msg);
                return { message: msg, damage: 0 };
            }
            default: {
                var target = aliveParty[Math.floor(Math.random() * aliveParty.length)];
                var atk = enemy.atk + Math.floor(Math.random() * 3);
                var isCrit = Math.random() < 0.05;
                var dmg = target.takeDamage(isCrit ? Math.floor(atk * 1.5) : atk);
                var msg = enemy.name + ' ataca a ' + target.name + ' por ' + dmg + ' dano' + (isCrit ? ' (CRITICO!)' : '');
                this.log.push(msg);
                return { message: msg, damage: dmg, target: target.name, targetObj: target };
            }
        }
    }

    applyPoisonDamage() {
        var self = this;
        this.party.forEach(function(c) {
            if (c.isAlive() && c.statusEffects.indexOf('poison') !== -1) {
                var poisonDmg = Math.max(1, Math.floor(c.maxHp * 0.05));
                c.hp -= poisonDmg;
                if (c.hp <= 0) { c.hp = 0; c.alive = false; }
                self.log.push(c.name + ' sufre ' + poisonDmg + ' dano de veneno');
            }
        });
    }

    _castSpell(caster, spellId, magAtk) {
        var result = { type: 'magic', attacker: caster.name, message: '' };

        switch (spellId) {
            case 'fireball':
            case 'iceSpike':
            case 'lightning':
            case 'holySmite':
            case 'entangle': {
                var target = null;
                if (this._lastSpellTarget) {
                    target = this._lastSpellTarget;
                    this._lastSpellTarget = null;
                } else {
                    var aliveEnemies = this.enemies.filter(function(e) { return e.isAlive(); });
                    if (aliveEnemies.length === 0) return result;
                    target = aliveEnemies[Math.floor(Math.random() * aliveEnemies.length)];
                }
                var spellDmg = magAtk + Math.floor(Math.random() * 8);
                if (spellId === 'holySmite') spellDmg = Math.floor(spellDmg * 1.3);
                var dmg = target.takeDamage(spellDmg, true);
                result.damage = dmg;
                var spellName = { fireball: 'Bola de Fuego', iceSpike: 'Punzada de Hielo', lightning: 'Rayo', holySmite: 'Golpe Sagrado', entangle: 'Enredadera' };
                result.message = caster.name + ' lanza ' + (spellName[spellId] || spellId) + ' a ' + target.name + ' por ' + dmg + ' dano';
                break;
            }
            case 'heal': {
                var target2 = null;
                if (this._lastSpellTarget && this._lastSpellTarget.isAlive() && this._lastSpellTarget.hp < this._lastSpellTarget.maxHp) {
                    target2 = this._lastSpellTarget;
                } else {
                    var allies = this.party.filter(function(c) { return c.isAlive() && c.hp < c.maxHp; });
                    if (allies.length === 0) { result.message = caster.name + ' no tiene aliados heridos'; this._lastSpellTarget = null; break; }
                    target2 = allies.reduce(function(a, b) { return (a.hp / a.maxHp < b.hp / b.maxHp ? a : b); });
                }
                var healAmt = magAtk + Math.floor(Math.random() * 10);
                target2.heal(healAmt);
                result.healAmount = healAmt;
                result.healTarget = target2;
                result.message = caster.name + ' cura a ' + target2.name + ' por ' + healAmt + ' HP';
                this._lastSpellTarget = null;
                break;
            }
            case 'bless': {
                var ally = null;
                if (this._lastSpellTarget && this._lastSpellTarget.isAlive()) {
                    ally = this._lastSpellTarget;
                } else {
                    var alive = this.party.filter(function(c) { return c.isAlive(); });
                    if (alive.length > 0) ally = alive[0];
                }
                if (ally) {
                    ally.blessed = true;
                    result.message = caster.name + ' bendice a ' + ally.name + '. Ataque y magia +30%';
                }
                this._lastSpellTarget = null;
                break;
            }
            case 'curePoison': {
                var target = null;
                if (this._lastSpellTarget && this._lastSpellTarget.isAlive() && this._lastSpellTarget.statusEffects && this._lastSpellTarget.statusEffects.indexOf('poison') !== -1) {
                    target = this._lastSpellTarget;
                } else {
                    var poisoned = this.party.filter(function(c) { return c.isAlive() && c.statusEffects && c.statusEffects.indexOf('poison') !== -1; });
                    if (poisoned.length > 0) target = poisoned[0];
                }
                if (target) {
                    target.statusEffects = target.statusEffects.filter(function(e) { return e !== 'poison'; });
                    result.message = caster.name + ' cura el veneno de ' + target.name;
                } else {
                    result.message = caster.name + ' no tiene aliados envenenados';
                }
                this._lastSpellTarget = null;
                break;
            }
            case 'layOnHands': {
                var target3 = null;
                if (this._lastSpellTarget && this._lastSpellTarget.isAlive()) {
                    target3 = this._lastSpellTarget;
                } else {
                    var wounded = this.party.filter(function(c) { return c.isAlive() && c.hp < c.maxHp; });
                    if (wounded.length > 0) {
                        target3 = wounded.reduce(function(a, b) { return (a.hp < b.hp ? a : b); });
                    }
                }
                if (target3) {
                    var healAmt2 = magAtk * 2;
                    target3.heal(healAmt2);
                    result.message = caster.name + ' impone manos a ' + target3.name + '. +' + healAmt2 + ' HP';
                }
                this._lastSpellTarget = null;
                break;
            }
        }
        return result;
    }

    setSpellTarget(target) {
        this._lastSpellTarget = target;
    }

    _useSkill(caster, skillId) {
        var result = { type: 'skill', attacker: caster.name, message: '' };

        switch (skillId) {
            case 'powerStrike': {
                var target = null;
                if (this._lastSpellTarget) { target = this._lastSpellTarget; this._lastSpellTarget = null; }
                else { var ae = this.enemies.filter(function(e) { return e.isAlive(); }); if (ae.length) target = ae[0]; }
                if (!target) return result;
                var dmg = target.takeDamage(Math.floor(caster.getAtk() * 1.8));
                result.damage = dmg;
                result.message = caster.name + ' usa Golpe Poderoso! ' + dmg + ' dano';
                break;
            }
            case 'warCry': {
                caster.buffed = true;
                result.message = caster.name + ' grita! Ataque +30% este turno';
                break;
            }
            case 'backstab': {
                var target = null;
                if (this._lastSpellTarget) { target = this._lastSpellTarget; this._lastSpellTarget = null; }
                else { var ae = this.enemies.filter(function(e) { return e.isAlive(); }); if (ae.length) target = ae[0]; }
                if (!target) return result;
                var isCrit = Math.random() < 0.4;
                var dmg = target.takeDamage(Math.floor(caster.getAtk() * (isCrit ? 2.5 : 1.5)));
                result.damage = dmg;
                result.message = caster.name + ' apunalda a ' + target.name + '! ' + dmg + ' dano' + (isCrit ? ' (GOLPE CRITICO!)' : '');
                break;
            }
            case 'assassinate': {
                var target = null;
                if (this._lastSpellTarget) { target = this._lastSpellTarget; this._lastSpellTarget = null; }
                else { var ae = this.enemies.filter(function(e) { return e.isAlive(); }); if (ae.length) target = ae[0]; }
                if (!target) return result;
                var isCrit = Math.random() < 0.3;
                var mult = isCrit ? 3.0 : 1.0;
                var dmg = target.takeDamage(Math.floor(caster.getAtk() * mult));
                result.damage = dmg;
                result.message = caster.name + ' intenta assassinar! ' + dmg + ' dano' + (isCrit ? ' (EJECUCION!)' : ' (fallos)');
                break;
            }
            case 'poisonBlade': {
                caster.poisonBlade = true;
                result.message = caster.name + ' envenena su arma. Proximo ataque envenena';
                break;
            }
            case 'archery': {
                var target = null;
                if (this._lastSpellTarget) { target = this._lastSpellTarget; this._lastSpellTarget = null; }
                else { var ae = this.enemies.filter(function(e) { return e.isAlive(); }); if (ae.length) target = ae[0]; }
                if (!target) return result;
                var dmg = target.takeDamage(caster.getAtk() + Math.floor(Math.random() * 10));
                result.damage = dmg;
                result.message = caster.name + ' dispara a ' + target.name + ' por ' + dmg + ' dano';
                break;
            }
            case 'disarmTrap': {
                var target = null;
                if (this._lastSpellTarget) { target = this._lastSpellTarget; this._lastSpellTarget = null; }
                else { var ae = this.enemies.filter(function(e) { return e.isAlive(); }); if (ae.length) target = ae[0]; }
                if (!target) return result;
                var disarmChance = 0.3 + caster.stats.luk * 0.02 + caster.stats.agi * 0.01;
                var dmg = target.takeDamage(Math.floor(caster.getAtk() * 0.7));
                if (Math.random() < disarmChance && target.defending) {
                    target.defending = false;
                    result.message = caster.name + ' desarma a ' + target.name + '! DEF eliminado. ' + dmg + ' dano';
                } else {
                    result.message = caster.name + ' ataca a ' + target.name + ' por ' + dmg + ' dano';
                }
                result.damage = dmg;
                break;
            }
            case 'pickLock': {
                var target = null;
                if (this._lastSpellTarget) { target = this._lastSpellTarget; this._lastSpellTarget = null; }
                else { var ae = this.enemies.filter(function(e) { return e.isAlive(); }); if (ae.length) target = ae[0]; }
                if (!target) return result;
                var stealChance = 0.2 + caster.stats.luk * 0.03;
                var dmg = target.takeDamage(Math.floor(caster.getAtk() * 1.0));
                result.damage = dmg;
                if (Math.random() < stealChance) {
                    var goldStolen = Math.floor(Math.random() * 15) + 5;
                    this._bonusGold = (this._bonusGold || 0) + goldStolen;
                    result.message = caster.name + ' roba a ' + target.name + '! +' + goldStolen + ' oro. ' + dmg + ' dano';
                } else {
                    result.message = caster.name + ' ataca a ' + target.name + ' por ' + dmg + ' dano';
                }
                break;
            }
            case 'healAlly': {
                var target2 = null;
                if (this._lastSpellTarget && this._lastSpellTarget.isAlive()) { target2 = this._lastSpellTarget; }
                else { var allies = this.party.filter(function(c) { return c.isAlive() && c.hp < c.maxHp; }); if (allies.length) target2 = allies.reduce(function(a, b) { return (a.hp / a.maxHp < b.hp / b.maxHp ? a : b); }); }
                this._lastSpellTarget = null;
                if (!target2) { result.message = caster.name + ' no necesita curar aliados'; break; }
                var healAmt = Math.floor(caster.getMagAtk() * 1.2) + Math.floor(Math.random() * 8);
                target2.heal(healAmt);
                result.message = caster.name + ' cura a ' + target2.name + ' por ' + healAmt + ' HP';
                break;
            }
            case 'vanish': {
                caster.vanished = true;
                result.message = caster.name + ' se oculta! Proximo ataque con bonus de dano';
                break;
            }
            case 'track': {
                var target = null;
                if (this._lastSpellTarget) { target = this._lastSpellTarget; this._lastSpellTarget = null; }
                else { var ae = this.enemies.filter(function(e) { return e.isAlive(); }); if (ae.length) target = ae[0]; }
                if (!target) return result;
                var dmg = target.takeDamage(Math.floor(caster.getAtk() * 0.5));
                result.damage = dmg;
                result.message = caster.name + ' rastrea a ' + target.name + '! (' + target.hp + '/' + target.maxHp + ' HP) ' + dmg + ' dano';
                break;
            }
            case 'entangle': {
                var target = null;
                if (this._lastSpellTarget) { target = this._lastSpellTarget; this._lastSpellTarget = null; }
                else { var ae = this.enemies.filter(function(e) { return e.isAlive(); }); if (ae.length) target = ae[0]; }
                if (!target) return result;
                var dmg = target.takeDamage(Math.floor(caster.getMagAtk() * 0.8));
                target.entangled = true;
                result.damage = dmg;
                result.message = caster.name + ' enreda a ' + target.name + '! No podra atacar. ' + dmg + ' dano';
                break;
            }
            default: {
                result.message = caster.name + ' usa ' + skillId;
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
        var allGold = this.enemies.reduce(function(sum, e) { return sum + e.gold; }, 0) + (this._bonusGold || 0);
        return { exp: allExp, gold: allGold };
    }
}
