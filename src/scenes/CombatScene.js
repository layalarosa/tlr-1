class CombatScene extends Phaser.Scene {
    constructor() {
        super({ key: 'CombatScene' });
    }

    init(data) {
        this.party = data.party;
        this.enemies = data.enemies;
        this.gold = data.gold;
        this.inventory = data.inventory;
        this.onVictory = data.onVictory;
        this.onDefeat = data.onDefeat;

        this.combatSystem = new CombatSystem(this.party, this.enemies);
        this.combatSystem.calculateTurnOrder();

        this.selectedAction = null;
        this.selectedSpell = null;
    }

    create() {
        this.textGroup = this.add.group();
        this.graphics = this.add.graphics();
        this._drawAll();
        this._setupInput();
        this._nextTurn();
    }

    _setupInput() {
        const self = this;
        this.input.keyboard.on('keydown-ONE', function() { self._selectAction('attack'); });
        this.input.keyboard.on('keydown-TWO', function() { self._selectAction('magic'); });
        this.input.keyboard.on('keydown-THREE', function() { self._selectAction('defend'); });
        this.input.keyboard.on('keydown-FOUR', function() { self._selectAction('item'); });
        this.input.keyboard.on('keydown-FIVE', function() { self._selectAction('flee'); });
        this.input.keyboard.on('keydown-ENTER', function() { self._confirmAction(); });
        this.input.keyboard.on('keydown-ESC', function() { self._cancelAction(); });

        for (let n = 1; n <= 9; n++) {
            (function(num) {
                self.input.keyboard.on('keydown-' + num, function() { self._selectSpellByIndex(num - 1); });
            })(n);
        }
    }

    _clearText() {
        this.textGroup.clear(true, true);
    }

    _addText(x, y, str, style) {
        style = style || {};
        const t = this.add.text(x, y, str, {
            fontSize: style.fontSize || '12px',
            fontFamily: 'monospace',
            color: style.color || '#ffffff'
        });
        if (style.origin) t.setOrigin(style.origin);
        this.textGroup.add(t);
        return t;
    }

    _drawAll() {
        this.graphics.clear();
        this._clearText();
        this._drawBattlefield();
        this._drawEnemies();
        this._drawPartyStatus();
        this._drawMenu();
    }

    _drawBattlefield() {
        const g = this.graphics;
        g.fillStyle(0x111122);
        g.fillRect(0, 0, 640, 480);
        g.fillStyle(0x0a0a15);
        g.fillRect(0, 0, 640, 260);
        g.lineStyle(2, 0x4444aa);
        g.strokeRect(20, 10, 600, 240);
        g.fillStyle(0x333333);
        g.fillRect(0, 260, 640, 2);
    }

    _drawEnemies() {
        const g = this.graphics;
        g.fillStyle(0x0a0a15);
        g.fillRect(0, 0, 640, 260);
        g.lineStyle(2, 0x4444aa);
        g.strokeRect(20, 10, 600, 240);

        const alive = this.enemies.filter(function(e) { return e.isAlive(); });
        if (alive.length === 0) return;

        const spacing = Math.min(120, 580 / alive.length);
        const startX = 320 - ((alive.length - 1) * spacing) / 2;

        const self = this;
        alive.forEach(function(enemy, i) {
            const x = startX + i * spacing;
            const y = 130;

            g.fillStyle(0x666666);
            g.fillRect(x - 25, y - 35, 50, 70);
            g.lineStyle(2, 0xffffff);
            g.strokeRect(x - 25, y - 35, 50, 70);

            g.fillStyle(0xff4444);
            g.fillRect(x - 18, y - 25, 36, 6);

            const hpPct = enemy.hp / enemy.maxHp;
            g.fillStyle(hpPct > 0.5 ? 0x44ff44 : hpPct > 0.25 ? 0xffff44 : 0xff4444);
            g.fillRect(x - 18, y + 15, 36 * hpPct, 5);

            self._addText(x, y + 50, enemy.name, { fontSize: '10px', origin: 0.5 });
            self._addText(x, y + 65, enemy.hp + '/' + enemy.maxHp, { fontSize: '10px', color: '#888888', origin: 0.5 });
        });
    }

    _drawPartyStatus() {
        const g = this.graphics;
        g.fillStyle(0x111122);
        g.fillRect(0, 262, 380, 218);

        const self = this;
        this.party.forEach(function(char, i) {
            const x = 10;
            const y = 270 + i * 50;
            const bg = char.isAlive() ? 0x222244 : 0x111111;

            g.fillStyle(bg);
            g.fillRoundedRect(x, y, 360, 45, 4);

            const nameColor = char.isAlive() ? '#ffffff' : '#666666';
            self._addText(x + 8, y + 5, char.name, { fontSize: '13px', color: nameColor });

            self._addText(x + 8, y + 25, 'HP:' + char.hp + '/' + char.maxHp, {
                fontSize: '11px',
                color: char.hp / char.maxHp > 0.5 ? '#44ff44' : char.hp / char.maxHp > 0.25 ? '#ffff44' : '#ff4444'
            });

            if (char.maxMp > 0) {
                self._addText(x + 130, y + 25, 'MP:' + char.mp + '/' + char.maxMp, { fontSize: '11px', color: '#4488ff' });
            }

            self._addText(x + 260, y + 15, 'Lv.' + char.level, { fontSize: '11px', color: '#ffaa44' });

            if (i === 0 && char.isAlive()) {
                g.lineStyle(2, 0x44ff44);
                g.strokeRoundedRect(x - 2, y - 2, 364, 49, 6);
            }
        });
    }

    _drawMenu() {
        const g = this.graphics;
        g.fillStyle(0x0a0a15);
        g.fillRect(390, 262, 250, 218);

        const current = this.combatSystem.getCurrentCombatant();
        if (!current || current.type !== 'party') {
            this._addText(515, 360, 'Procesando...', { fontSize: '14px', color: '#888888', origin: 0.5 });
            return;
        }

        const char = current.entity;
        this._addText(400, 270, char.name + ' - Accion:', { fontSize: '13px' });

        const actions = ['1-Atacar', '2-Magia', '3-Defender', '4-Item', '5-Huir'];
        const self = this;
        actions.forEach(function(action, i) {
            self._addText(410, 295 + i * 22, action, { fontSize: '12px', color: '#aaaaff' });
        });

        if (this.selectedAction) {
            this._addText(400, 410, 'Sel: ' + this.selectedAction, { fontSize: '12px', color: '#44ff44' });
            this._addText(400, 435, 'ENTER confirmar | ESC cancelar', { fontSize: '10px', color: '#888888' });
        }
    }

    _selectAction(action) {
        this.selectedAction = action;
        this.selectedSpell = null;
        this._drawAll();

        if (action === 'magic') {
            this._drawSpellMenu();
        } else if (action === 'item') {
            this._drawItemMenu();
        }
    }

    _drawSpellMenu() {
        const current = this.combatSystem.getCurrentCombatant();
        if (!current || current.type !== 'party') return;
        const char = current.entity;

        const g = this.graphics;
        g.fillStyle(0x0a0a15);
        g.fillRect(390, 262, 250, 218);

        this._addText(400, 270, char.name + ' - Hechizos:', { fontSize: '13px' });

        const self = this;
        const spells = char.skills.filter(function(s) {
            return ['fireball', 'iceSpike', 'lightning', 'heal', 'bless', 'curePoison', 'holySmite', 'layOnHands', 'entangle'].indexOf(s) !== -1;
        });

        spells.forEach(function(spell, i) {
            const cost = char._getSpellCost(spell);
            const canCast = char.mp >= cost;
            self._addText(410, 295 + i * 20, (i + 1) + '-' + spell + ' (' + cost + ' MP)', {
                fontSize: '11px',
                color: canCast ? '#aaaaff' : '#666666'
            });
        });

        this._addText(400, 435, 'Tecla numero = lanzar | ESC volver', { fontSize: '10px', color: '#888888' });
    }

    _selectSpellByIndex(index) {
        if (this.selectedAction !== 'magic') return;
        const current = this.combatSystem.getCurrentCombatant();
        if (!current || current.type !== 'party') return;
        const char = current.entity;

        const spells = char.skills.filter(function(s) {
            return ['fireball', 'iceSpike', 'lightning', 'heal', 'bless', 'curePoison', 'holySmite', 'layOnHands', 'entangle'].indexOf(s) !== -1;
        });

        if (index < spells.length) {
            const spell = spells[index];
            const cost = char._getSpellCost(spell);
            if (char.mp >= cost) {
                this.selectedSpell = spell;
                this.selectedAction = 'castSpell';
                this._confirmAction();
            }
        }
    }

    _drawItemMenu() {
        const g = this.graphics;
        g.fillStyle(0x0a0a15);
        g.fillRect(390, 262, 250, 218);

        this._addText(400, 270, 'Items:', { fontSize: '13px' });

        const self = this;
        const usable = this.inventory.filter(function(inv) {
            const item = ITEMS[inv.itemId];
            return item && item.type === 'consumable';
        });

        usable.forEach(function(inv, i) {
            const item = ITEMS[inv.itemId];
            self._addText(410, 295 + i * 18, (i + 1) + '-' + item.name + ' x' + inv.quantity, { fontSize: '11px', color: '#aaaaff' });
        });

        if (usable.length === 0) {
            this._addText(410, 295, 'No hay items', { fontSize: '11px', color: '#666666' });
        }
    }

    _cancelAction() {
        this.selectedAction = null;
        this.selectedSpell = null;
        this._drawAll();
    }

    _confirmAction() {
        if (!this.selectedAction) return;
        const current = this.combatSystem.getCurrentCombatant();
        if (!current) return;

        if (current.type === 'party') {
            const self = this;

            if (this.selectedAction === 'attack') {
                const aliveEnemies = this.enemies.filter(function(e) { return e.isAlive(); });
                if (aliveEnemies.length > 0) {
                    this.combatSystem.executeAction(current, 'attack', aliveEnemies[0]);
                    this.selectedAction = null;
                    this.selectedSpell = null;
                    this._afterAction();
                }
            } else if (this.selectedAction === 'defend') {
                this.combatSystem.executeAction(current, 'defend', null);
                this.selectedAction = null;
                this.selectedSpell = null;
                this._afterAction();
            } else if (this.selectedAction === 'flee') {
                const result = this.combatSystem.executeAction(current, 'flee', null);
                if (result.fled) {
                    this.scene.stop();
                    this.onVictory({ gold: this.gold, inventory: this.inventory });
                } else {
                    this.selectedAction = null;
                    this.selectedSpell = null;
                    this._afterAction();
                }
            } else if (this.selectedAction === 'castSpell' && this.selectedSpell) {
                this.combatSystem.executeAction(current, 'magic', this.selectedSpell);
                this.selectedAction = null;
                this.selectedSpell = null;
                this._afterAction();
            } else if (this.selectedAction === 'item') {
                const usable = this.inventory.find(function(inv) {
                    const item = ITEMS[inv.itemId];
                    return item && item.type === 'consumable';
                });
                if (usable) {
                    this.combatSystem.executeAction(current, 'item', { itemId: usable.itemId, heal: current.entity });
                    usable.quantity--;
                    if (usable.quantity <= 0) {
                        this.inventory = this.inventory.filter(function(i) { return i !== usable; });
                    }
                    this.selectedAction = null;
                    this.selectedSpell = null;
                    this._afterAction();
                }
            }
        }
    }

    _afterAction() {
        this.combatSystem.nextTurn();

        if (this.combatSystem.isBattleOver()) {
            this._endBattle();
            return;
        }

        const self = this;
        const next = this.combatSystem.getCurrentCombatant();

        if (next && next.type === 'enemy') {
            this._drawAll();
            this.time.delayedCall(600, function() {
                self.combatSystem.enemyAction(next.entity);
                self.combatSystem.nextTurn();
                self._afterAction();
            });
        } else {
            this._drawAll();
        }
    }

    _endBattle() {
        const allDead = this.party.every(function(c) { return !c.isAlive(); });
        if (allDead) {
            this.scene.stop();
            this.onDefeat();
            return;
        }

        const victory = this.combatSystem.getVictory();
        this.gold += victory.gold;

        const self = this;
        this.party.forEach(function(c) {
            if (c.isAlive()) c.gainExp(victory.exp);
        });

        this.inventory.push({ itemId: 'POTION', quantity: 1 });

        this.graphics.clear();
        this._clearText();

        this.graphics.fillStyle(0x000000, 0.92);
        this.graphics.fillRect(80, 80, 480, 320);
        this.graphics.lineStyle(2, 0x44ff44);
        this.graphics.strokeRect(80, 80, 480, 320);

        this._addText(320, 110, 'Victoria!', { fontSize: '28px', color: '#44ff44', origin: 0.5 });
        this._addText(320, 160, 'EXP ganada: ' + victory.exp, { fontSize: '16px', origin: 0.5 });
        this._addText(320, 190, 'Oro ganado: ' + victory.gold, { fontSize: '16px', color: '#ffff44', origin: 0.5 });

        this.party.forEach(function(c, i) {
            if (c.isAlive()) {
                self._addText(320, 230 + i * 22, c.name + ': EXP ' + c.exp + '/' + c.expToNext + ' Lv.' + c.level, {
                    fontSize: '12px', color: '#aaaaff', origin: 0.5
                });
            }
        });

        this._addText(320, 370, 'ENTER para continuar', { fontSize: '14px', color: '#888888', origin: 0.5 });

        this.input.keyboard.once('keydown-ENTER', function() {
            self.scene.stop();
            self.onVictory({ gold: self.gold, inventory: self.inventory });
        });
    }
}
