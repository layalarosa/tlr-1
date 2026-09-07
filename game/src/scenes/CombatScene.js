class CombatScene extends Phaser.Scene {
    constructor() { super({ key: 'CombatScene' }); }

    init(data) {
        this.party = data.party;
        this.enemies = data.enemies;
        this.gold = data.gold;
        this.inventory = data.inventory;
        this.onVictory = data.onVictory;
        this.onDefeat = data.onDefeat;
        this.cs = new CombatSystem(this.party, this.enemies);
        this.cs.calculateTurnOrder();
        this.selAction = null;
        this.selSpell = null;
        this.selTarget = null;
        this.selItemIdx = null;
        this.phase = 'action';
        this.animating = false;
        this._targetMode = null;
    }

    create() {
        this.g = this.add.graphics();
        this.group = this.add.group();
        this.logTxt = this.add.text(GAME_W / 2, 290, '', { fontSize: '13px', fontFamily: '"Share Tech Mono", monospace', color: '#aaaaff', wordWrap: { width: 620 }, align: 'center' }).setOrigin(0.5).setDepth(50);
        this._enemySprites = {};
        this.pm = new ParticleManager(this);
        this.ui = new UITheme(this);
        this.audio = new AudioManager(this);
        this.fx = new ScreenEffects(this);
        this.audio.playBgm('bgm_combat');
        this._createAnimations();
        this._drawAll();
        this._input();
        this.cameras.main.fadeIn(400, 0, 0, 0);
    }

    _createAnimations() {
        var enemyKeys = ['slime', 'skeleton', 'goblin', 'bandit', 'zombie', 'rat', 'spider', 'wolf', 'ghost', 'dragon_whelp'];
        var self = this;
        enemyKeys.forEach(function(key) {
            var texKey = 'enemies_' + key;
            if (!self.textures.exists(texKey)) return;
            var tex = self.textures.get(texKey);
            var frameCount = tex.frameTotal;
            if (frameCount >= 3) {
                if (!self.anims.exists(key + '_idle')) {
                    self.anims.create({ key: key + '_idle', frames: self.anims.generateFrameNumbers(texKey, { start: 0, end: 2 }), frameRate: 4, repeat: -1 });
                }
                if (!self.anims.exists(key + '_hurt')) {
                    self.anims.create({ key: key + '_hurt', frames: [{ key: texKey, frame: 0 }], frameRate: 1, repeat: 0 });
                }
            } else if (frameCount >= 1) {
                if (!self.anims.exists(key + '_idle')) {
                    self.anims.create({ key: key + '_idle', frames: [{ key: texKey, frame: 0 }], frameRate: 1, repeat: -1 });
                }
                if (!self.anims.exists(key + '_hurt')) {
                    self.anims.create({ key: key + '_hurt', frames: [{ key: texKey, frame: 0 }], frameRate: 1, repeat: 0 });
                }
            }
        });
    }

    _input() {
        var self = this;
        this.input.keyboard.on('keydown-ONE', function() { self._act('attack'); });
        this.input.keyboard.on('keydown-TWO', function() { self._act('magic'); });
        this.input.keyboard.on('keydown-THREE', function() { self._act('defend'); });
        this.input.keyboard.on('keydown-FOUR', function() { self._act('item'); });
        this.input.keyboard.on('keydown-FIVE', function() { self._act('flee'); });
        this.input.keyboard.on('keydown-SIX', function() { self._act('skill'); });
        this.input.keyboard.on('keydown-ENTER', function() { self._confirm(); });
        this.input.keyboard.on('keydown-ESC', function() { self._cancel(); });
        var keyNames = ['ONE','TWO','THREE','FOUR','FIVE','SIX','SEVEN','EIGHT','NINE'];
        for (var n = 1; n <= 9; n++) {
            (function(num, keyName) {
                self.input.keyboard.on('keydown-' + keyName, function() {
                    self._onNumberKey(num);
                });
            })(n, keyNames[n - 1]);
        }
    }

    _onNumberKey(num) {
        if (this.animating) return;

        if (this._targetMode === 'enemy') {
            var alive = this.enemies.filter(function(e) { return e.isAlive(); });
            if (num <= alive.length) {
                this.selTarget = alive[num - 1];
                this._targetMode = null;
                this._confirm();
            }
            return;
        }

        if (this._targetMode === 'ally') {
            var aliveAllies = this.party.filter(function(c) { return c.isAlive(); });
            if (num <= aliveAllies.length) {
                this.selTarget = aliveAllies[num - 1];
                this._targetMode = null;
                this._confirm();
            }
            return;
        }

        if (this.selAction === 'magic') {
            this._selectSpell(num - 1);
            return;
        }

        if (this.selAction === 'skill') {
            this._selectSkill(num - 1);
            return;
        }

        if (this.selAction === 'item') {
            this._selectItem(num - 1);
            return;
        }
    }

    _clear() { this.group.clear(true, true); }

    _txt(x, y, str, style) {
        style = style || {};
        var t = this.add.text(x, y, str, {
            fontSize: style.size || '12px', fontFamily: '"VT323", monospace', color: style.color || '#ffffff',
            wordWrap: style.wrap ? { width: style.wrap } : undefined
        });
        if (style.origin) t.setOrigin(style.origin);
        this.group.add(t);
        return t;
    }

    _drawAll() {
        this.g.clear();
        this._clear();
        this._drawBG();
        this._drawEnemies();
        this._drawParty();
        this._drawMenu();
    }

    _drawBG() {
        this.g.fillStyle(0x060610);
        this.g.fillRect(0, 0, 640, 480);
        this.g.fillStyle(0x08080f);
        this.g.fillRect(0, 0, 640, 285);

        if (this.textures.exists('tex_wall')) {
            if (!this._bgWall) {
                this._bgWall = this.add.image(320, 142, 'tex_wall').setDisplaySize(640, 285).setAlpha(0.2).setDepth(0);
            }
        }

        this.ui.panel(this.g, 8, 4, 624, 278, {
            borderColor: 0x3333aa,
            bgColor: 0x000000,
            bgAlpha: 0,
            borderWidth: 1,
            cornerRadius: 4
        });

        this.g.fillStyle(0x1a1a28, 0.3);
        this.g.fillRect(0, 265, 640, 20);
        this.g.fillStyle(0x0a0a10);
        this.g.fillRect(0, 285, 640, 2);
    }

    _drawEnemies() {
        var self = this;
        var alive = this.enemies.filter(function(e) { return e.isAlive(); });
        if (alive.length === 0) return;
        var sp = Math.min(140, 580 / alive.length);
        var sx = 320 - ((alive.length - 1) * sp) / 2;

        alive.forEach(function(e, i) {
            var x = sx + i * sp, y = 110;
            var texKey = 'enemies_' + e.sprite;

            self.g.fillStyle(0x111118, 0.5);
            self.g.fillEllipse(x, y + 55, 60, 12);

            if (self.textures.exists(texKey)) {
                var sprite = self.add.sprite(x, y, texKey).setScale(2.5).setDepth(5);
                var animKey = e.sprite + '_idle';
                if (self.anims.exists(animKey)) {
                    sprite.play(animKey);
                }
                self._enemySprites[e.sprite + '_' + i] = sprite;
                self.group.add(sprite);
            } else {
                self.g.fillStyle(0x332222);
                self.g.fillRoundedRect(x - 28, y - 40, 56, 80, 6);
                self.g.lineStyle(2, 0x663333);
                self.g.strokeRoundedRect(x - 28, y - 40, 56, 80, 6);
                self.g.fillStyle(0xff6644);
                self.g.fillCircle(x - 8, y - 15, 4);
                self.g.fillCircle(x + 8, y - 15, 4);
            }

            var hpPct = e.hp / e.maxHp;
            self.ui.hpBar(self.g, x - 24, y + 40, 48, 8, hpPct);

            self._txt(x, y + 56, e.name, { size: '10px', origin: 0.5, color: '#dddddd' });
            self._txt(x, y + 68, e.hp + '/' + e.maxHp, { size: '9px', color: '#888888', origin: 0.5 });

            if (e.statusEffects && e.statusEffects.length > 0) {
                self._txt(x, y + 78, e.statusEffects.join(', '), { size: '8px', color: '#aa44aa', origin: 0.5 });
            }

            if (e.boss) {
                self._txt(x, y - 50, 'BOSS', { size: '11px', color: '#ff4444', origin: 0.5 });
            }
        });
    }

    _drawParty() {
        var self = this;
        var frontRow = this.party.filter(function(c) { return c.row === 'front'; });
        var backRow = this.party.filter(function(c) { return c.row === 'back'; });

        var rowLabel = this._txt(10, 290, 'FRENTE', { size: '9px', color: '#666688' });
        this.group.add(rowLabel);

        this.party.forEach(function(c, i) {
            var x = 10, y = 300 + i * 42;
            var borderCol = c.isAlive() ? (c.row === 'front' ? 0x33aa33 : 0x3333aa) : 0x333333;
            self.ui.panel(self.g, x, y, 310, 38, {
                borderColor: borderCol,
                bgColor: c.isAlive() ? 0x0e0e1a : 0x080808,
                cornerRadius: 4,
                borderWidth: 1
            });

            var nc = c.isAlive() ? '#ccccff' : '#444444';
            var rowTag = c.row === 'front' ? ' [F]' : ' [B]';
            self._txt(x + 6, y + 4, c.name + rowTag, { size: '11px', color: nc });

            var hpPct = c.maxHp > 0 ? c.hp / c.maxHp : 0;
            self.ui.hpBar(self.g, x + 6, y + 20, 95, 8, hpPct);

            if (c.maxMp > 0) {
                var mpPct = c.maxMp > 0 ? c.mp / c.maxMp : 0;
                self.ui.mpBar(self.g, x + 110, y + 20, 90, 8, mpPct);
            }

            self._txt(x + 210, y + 4, 'Lv.' + c.level, { size: '10px', color: '#ffaa44' });

            var status = [];
            if (c.defending) status.push('DEF');
            if (c.blessed) status.push('BLESS');
            if (c.statusEffects && c.statusEffects.indexOf('poison') !== -1) status.push('VENENO');
            if (status.length > 0) {
                self._txt(x + 210, y + 20, status.join(' '), { size: '9px', color: '#ff88ff' });
            }
        });
    }

    _drawMenu() {
        var cur = this.cs.getCurrentCombatant();
        if (!cur || cur.type !== 'party') {
            this._txt(GAME_W / 2, 460, 'Esperando...', { size: '12px', color: '#555566', origin: 0.5 });
            return;
        }
        var c = cur.entity;

        this.ui.panel(this.g, 328, 293, 306, 178, {
            borderColor: 0x3333aa,
            bgColor: 0x080812
        });

        this.ui.titleBar(this.g, 335, 298, 292, c.name + ':', null, {
            height: 24,
            bgColor: 0x1a1a33,
            textColor: '#ffffff',
            fontSize: '14px'
        });

        this._txt(340, 330, '1-Atacar  2-Magia  3-Defender', { size: '11px', color: '#9999cc' });
        this._txt(340, 348, '4-Item    5-Huir   6-Skills', { size: '11px', color: '#9999cc' });

        if (c.defending) {
            this.ui.button(this.g, 335, 365, 292, 20, { active: true, bgColor: 0x1a3322, borderColor: 0x33aa33 });
            this._txt(340, 368, 'Defendiendo (DEF+50%)', { size: '10px', color: '#44ff44' });
        }

        if (this.selAction) {
            this.ui.button(this.g, 335, 390, 292, 22, { active: true });
            this._txt(340, 393, '>' + this.selAction.toUpperCase(), { size: '12px', color: '#44ff44' });

            var hint = '';
            if (this.selAction === 'attack') hint = 'Selecciona enemigo (tecla num)';
            else if (this.selAction === 'magic') hint = 'Selecciona hechizo (tecla num)';
            else if (this.selAction === 'skill') hint = 'Selecciona skill (tecla num)';
            else if (this.selAction === 'item') hint = 'Selecciona item (tecla num)';
            else if (this.selAction === 'defend') hint = 'ENTER=confirmar';
            else if (this.selAction === 'flee') hint = 'ENTER=intentar huir';
            else hint = 'ENTER=ok ESC=back';

            this._txt(340, 418, hint, { size: '10px', color: '#555566' });
        }
    }

    _act(action) {
        if (this.animating) return;
        var cur = this.cs.getCurrentCombatant();
        if (!cur || cur.type !== 'party') return;
        this.selAction = action;
        this.selSpell = null;
        this.selTarget = null;
        this.selItemIdx = null;
        this._targetMode = null;

        if (action === 'magic') this._showSpells();
        else if (action === 'skill') this._showSkills();
        else if (action === 'item') this._showItems();
        else if (action === 'attack') this._showEnemyTargets();
        else this._drawAll();
    }

    _showSkills() {
        var cur = this.cs.getCurrentCombatant();
        if (!cur) return;
        var c = cur.entity;
        var self = this;

        var combatSkills = ['powerStrike', 'warCry', 'backstab', 'assassinate', 'poisonBlade', 'archery', 'disarmTrap', 'pickLock', 'healAlly', 'vanish', 'track'];
        var skills = c.skills.filter(function(s) { return combatSkills.indexOf(s) !== -1; });

        this.g.fillStyle(0x0a0a15);
        this.g.fillRect(330, 295, 310, 175);
        this.g.lineStyle(1, 0x3333aa);
        this.g.strokeRect(330, 295, 310, 175);
        this._txt(340, 300, '> Skills de ' + c.name + ':', { size: '12px', color: '#ffcc44' });

        if (skills.length === 0) {
            this._txt(350, 320, 'Sin habilidades de combate', { size: '11px', color: '#555555' });
        }
        skills.forEach(function(s, i) {
            var cost = c._getSpellCost(s);
            var can = c.mp >= cost;
            self._txt(350, 320 + i * 20, '[' + (i + 1) + '] ' + s + (cost > 0 ? '  (' + cost + 'MP)' : '') + (can ? '' : ' X'), { size: '11px', color: can ? '#ffcc44' : '#555555' });
        });
        this._txt(340, 455, 'Tecla num=seleccionar  |  ESC=back', { size: '10px', color: '#555566' });

        this._selSkillList = skills;
    }

    _showSpells() {
        var cur = this.cs.getCurrentCombatant();
        if (!cur) return;
        var c = cur.entity;
        var self = this;
        this.g.fillStyle(0x0a0a15);
        this.g.fillRect(330, 295, 310, 175);
        this.g.lineStyle(1, 0x3333aa);
        this.g.strokeRect(330, 295, 310, 175);
        this._txt(340, 300, '> Hechizos de ' + c.name + ':', { size: '12px', color: '#aaaaff' });

        var spells = c.skills.filter(function(s) { return ['fireball', 'iceSpike', 'lightning', 'heal', 'bless', 'curePoison', 'holySmite', 'layOnHands', 'entangle'].indexOf(s) !== -1; });
        if (spells.length === 0) {
            this._txt(350, 320, 'Sin hechizos conocidos', { size: '11px', color: '#555555' });
        }
        spells.forEach(function(s, i) {
            var cost = c._getSpellCost(s);
            var can = c.mp >= cost;
            var spellNames = { fireball: 'Bola de Fuego', iceSpike: 'Hielo', lightning: 'Rayo', heal: 'Curar', bless: 'Bendecir', curePoison: 'Curar Veneno', holySmite: 'Golpe Sagrado', layOnHands: 'Imponer Manos', entangle: 'Enredadera' };
            self._txt(350, 320 + i * 20, '[' + (i + 1) + '] ' + (spellNames[s] || s) + '  (' + cost + 'MP)' + (can ? '' : ' X'), { size: '11px', color: can ? '#aaaaff' : '#555555' });
        });
        this._txt(340, 455, 'Tecla num=seleccionar  |  ESC=back', { size: '10px', color: '#555566' });
    }

    _selectSpell(idx) {
        if (this.selAction !== 'magic') return;
        var cur = this.cs.getCurrentCombatant();
        if (!cur) return;
        var c = cur.entity;
        var spells = c.skills.filter(function(s) { return ['fireball', 'iceSpike', 'lightning', 'heal', 'bless', 'curePoison', 'holySmite', 'layOnHands', 'entangle'].indexOf(s) !== -1; });
        if (idx < spells.length && c.mp >= c._getSpellCost(spells[idx])) {
            this.selSpell = spells[idx];
            this.selAction = 'castSpell';

            var offensiveSpells = ['fireball', 'iceSpike', 'lightning', 'holySmite', 'entangle'];
            var healingSpells = ['heal', 'layOnHands', 'bless', 'curePoison'];

            if (offensiveSpells.indexOf(this.selSpell) !== -1) {
                this._showEnemyTargets();
            } else if (healingSpells.indexOf(this.selSpell) !== -1) {
                this._showAllyTargets();
            } else {
                this._confirm();
            }
        }
    }

    _showAllyTargets() {
        var self = this;
        this.g.fillStyle(0x0a0a15);
        this.g.fillRect(330, 295, 310, 175);
        this.g.lineStyle(1, 0x3333aa);
        this.g.strokeRect(330, 295, 310, 175);
        this._txt(340, 300, '> Selecciona aliado:', { size: '12px', color: '#44aaff' });

        var alive = this.party.filter(function(c) { return c.isAlive(); });
        alive.forEach(function(c, i) {
            var hpPct = c.maxHp > 0 ? c.hp / c.maxHp : 0;
            var color = hpPct > 0.5 ? '#44ff44' : hpPct > 0.25 ? '#ffff44' : '#ff4444';
            self._txt(350, 320 + i * 22, '[' + (i + 1) + '] ' + c.name + '  HP:' + c.hp + '/' + c.maxHp, { size: '11px', color: color });
        });
        this._txt(340, 455, 'Tecla num=seleccionar  |  ESC=back', { size: '10px', color: '#555566' });
        this._targetMode = 'ally';
    }

    _showItems() {
        var self = this;
        this.g.fillStyle(0x0a0a15);
        this.g.fillRect(330, 295, 310, 175);
        this.g.lineStyle(1, 0x3333aa);
        this.g.strokeRect(330, 295, 310, 175);
        this._txt(340, 300, '> Items:', { size: '12px', color: '#44ff44' });

        var usable = this.inventory.filter(function(inv) { return ITEMS[inv.itemId] && ITEMS[inv.itemId].type === 'consumable'; });
        usable.forEach(function(inv, i) {
            var item = ITEMS[inv.itemId];
            var selected = self.selItemIdx === i ? ' >' : '  ';
            self._txt(350, 320 + i * 20, '[' + (i + 1) + '] ' + item.name + ' x' + inv.quantity + selected, { size: '11px', color: self.selItemIdx === i ? '#44ff44' : '#aaaaff' });
        });
        if (usable.length === 0) this._txt(350, 320, 'Sin items consumibles', { size: '11px', color: '#555555' });
        this._txt(340, 455, 'Tecla num=seleccionar  |  ENTER=usar  |  ESC=back', { size: '10px', color: '#555566' });
    }

    _selectItem(idx) {
        if (this.selAction !== 'item') return;
        var usable = this.inventory.filter(function(inv) { return ITEMS[inv.itemId] && ITEMS[inv.itemId].type === 'consumable'; });
        if (idx < usable.length) {
            this.selItemIdx = idx;
            var item = ITEMS[usable[idx].itemId];
            if (item.effect === 'heal' || item.effect === 'revive' || item.effect === 'mp' || item.effect === 'curePoison') {
                this._showAllyTargets();
            } else {
                this._showItems();
            }
        }
    }

    _selectSkill(idx) {
        if (this.selAction !== 'skill' || !this._selSkillList) return;
        if (idx < this._selSkillList.length) {
            this.selSpell = this._selSkillList[idx];
            this.selAction = 'useSkill';
            var selfSkills = ['warCry', 'poisonBlade', 'vanish'];
            var allySkills = ['healAlly'];
            if (selfSkills.indexOf(this.selSpell) !== -1) {
                this._confirm();
            } else if (allySkills.indexOf(this.selSpell) !== -1) {
                this._showAllyTargets();
            } else {
                this._showEnemyTargets();
            }
        }
    }

    _showEnemyTargets() {
        var self = this;
        this.g.fillStyle(0x0a0a15);
        this.g.fillRect(330, 295, 310, 175);
        this.g.lineStyle(1, 0x3333aa);
        this.g.strokeRect(330, 295, 310, 175);
        this._txt(340, 300, '> Selecciona enemigo:', { size: '12px', color: '#ffaa44' });

        var alive = this.enemies.filter(function(e) { return e.isAlive(); });
        alive.forEach(function(e, i) {
            var hpPct = e.hp / e.maxHp;
            var color = hpPct > 0.5 ? '#44ff44' : hpPct > 0.25 ? '#ffff44' : '#ff4444';
            self._txt(350, 320 + i * 22, '[' + (i + 1) + '] ' + e.name + '  HP:' + e.hp + '/' + e.maxHp, { size: '11px', color: color });
        });
        this._txt(340, 455, 'Tecla num=' + (this.selAction === 'attack' ? 'atacar' : 'seleccionar') + '  |  ESC=back', { size: '10px', color: '#555566' });
        this._targetMode = 'enemy';
    }

    _confirm() {
        if (this.animating) return;
        if (this.cs.isBattleOver()) return;
        var cur = this.cs.getCurrentCombatant();
        if (!cur || cur.type !== 'party') return;
        var self = this;

        if (this.selAction === 'attack') {
            var target = this.selTarget || this.enemies.find(function(e) { return e.isAlive(); });
            if (target) {
                var r = this.cs.executeAction(cur, 'attack', target);
                this._showLog(r.message);
                this._playSound(r.critical ? 'sfx_crit' : 'sfx_hit');
                this.animating = true;
                var pos = this._getEnemyPos(target.sprite);
                if (pos) {
                    this.pm.hitPhysical(pos.x, pos.y);
                    this.pm.floatingDamage(pos.x, pos.y, r.damage, false, r.critical);
                }
                if (r.critical) {
                    this.fx.critShake();
                } else {
                    this.fx.shake(0.005, 80);
                }
                this._hurtEnemy(target.sprite, function() {
                    self.time.delayedCall(300, function() { self.animating = false; self._afterTurn(); });
                });
            }
        } else if (this.selAction === 'defend') {
            this.cs.executeAction(cur, 'defend', null);
            this._showLog(cur.entity.name + ' se defiende. DEF +50%');
            this.animating = true;
            this.time.delayedCall(400, function() { self.animating = false; self._afterTurn(); });
        } else if (this.selAction === 'flee') {
            var r = this.cs.executeAction(cur, 'flee', null);
            this._showLog(r.message);
            if (r.fled) {
                this.time.delayedCall(800, function() { self.scene.stop(); self.onVictory({ gold: self.gold, inventory: self.inventory, fled: true }); });
            } else {
                this.animating = true;
                this.time.delayedCall(600, function() { self.animating = false; self._afterTurn(); });
            }
        } else if (this.selAction === 'castSpell' && this.selSpell) {
            if (this.selTarget) {
                this.cs.setSpellTarget(this.selTarget);
            }
            var r2 = this.cs.executeAction(cur, 'magic', this.selSpell);
            this._showLog(r2.message);
            this._playSound('sfx_magic');
            this.animating = true;

            if (r2.healAmount && r2.healTarget) {
                var healIdx = this.party.indexOf(r2.healTarget);
                if (healIdx !== -1) {
                    this.pm.heal(165, 310 + healIdx * 42);
                    this.pm.floatingHeal(165, 310 + healIdx * 42, r2.healAmount);
                }
                self.time.delayedCall(500, function() { self.animating = false; self._afterTurn(); });
            } else {
                var spellTarget = this.selTarget;
                if (spellTarget && spellTarget.sprite) {
                    var spellPos = this._getEnemyPos(spellTarget.sprite);
                    if (spellPos) {
                        var elem = this._getSpellElement(this.selSpell);
                        if (elem === 'fire') this.pm.hitFire(spellPos.x, spellPos.y);
                        else if (elem === 'ice') this.pm.hitIce(spellPos.x, spellPos.y);
                        else if (elem === 'lightning') this.pm.hitLightning(spellPos.x, spellPos.y);
                        else if (elem === 'holy') this.pm.hitHoly(spellPos.x, spellPos.y);
                        else if (elem === 'dark') this.pm.hitDark(spellPos.x, spellPos.y);
                        else this.pm.hitPhysical(spellPos.x, spellPos.y);
                        this.pm.floatingDamage(spellPos.x, spellPos.y, r2.damage, true, false);
                    }
                    this._hurtEnemy(spellTarget.sprite, function() {
                        self.time.delayedCall(300, function() { self.animating = false; self._afterTurn(); });
                    });
                } else {
                    self.time.delayedCall(500, function() { self.animating = false; self._afterTurn(); });
                }
            }
        } else if (this.selAction === 'useSkill' && this.selSpell) {
            if (this.selTarget) {
                this.cs.setSpellTarget(this.selTarget);
            }
            var r3 = this.cs.executeAction(cur, 'skill', this.selSpell);
            this._showLog(r3.message);
            this._playSound(r3.critical ? 'sfx_crit' : 'sfx_magic');
            this.animating = true;
            var skillTarget = this.selTarget;
            if (skillTarget && skillTarget.sprite) {
                var skillPos = this._getEnemyPos(skillTarget.sprite);
                if (skillPos) {
                    this.pm.hitPhysical(skillPos.x, skillPos.y);
                    this.pm.floatingDamage(skillPos.x, skillPos.y, r3.damage, false, r3.critical || false);
                }
                if (r3.critical) this.fx.critShake();
                else this.fx.shake(0.005, 80);
                this._hurtEnemy(skillTarget.sprite, function() {
                    self.time.delayedCall(300, function() { self.animating = false; self._afterTurn(); });
                });
            } else {
                self.time.delayedCall(500, function() { self.animating = false; self._afterTurn(); });
            }
        } else if (this.selAction === 'item') {
            if (this.selItemIdx === null) return;
            var usable = this.inventory.filter(function(inv) { return ITEMS[inv.itemId] && ITEMS[inv.itemId].type === 'consumable'; });
            if (this.selItemIdx >= usable.length) return;
            var inv = usable[this.selItemIdx];
            var item = ITEMS[inv.itemId];
            var targetChar = this.selTarget || cur.entity;
            if (item.effect === 'heal') {
                if (targetChar.hp < targetChar.maxHp) {
                    targetChar.heal(item.value);
                    this._showLog(cur.entity.name + ' usa ' + item.name + ' en ' + targetChar.name + '. +' + item.value + ' HP');
                    var healIdx = this.party.indexOf(targetChar);
                    if (healIdx !== -1) this.pm.heal(165, 310 + healIdx * 42);
                    this.pm.floatingHeal(165, 310 + healIdx * 42, item.value);
                } else {
                    this._showLog(targetChar.name + ' ya tiene el HP full!');
                    return;
                }
            } else if (item.effect === 'revive') {
                if (!targetChar.isAlive()) {
                    targetChar.alive = true;
                    targetChar.hp = Math.floor(targetChar.maxHp * 0.5);
                    this._showLog(cur.entity.name + ' usa ' + item.name + ' en ' + targetChar.name + '. Resucitado!');
                } else {
                    this._showLog(targetChar.name + ' ya esta vivo!');
                    return;
                }
            } else if (item.effect === 'mp') {
                if (targetChar.mp < targetChar.maxMp) {
                    targetChar.restoreMp(item.value);
                    this._showLog(cur.entity.name + ' usa ' + item.name + ' en ' + targetChar.name + '. +' + item.value + ' MP');
                } else {
                    this._showLog(targetChar.name + ' ya tiene el MP full!');
                    return;
                }
            } else if (item.effect === 'curePoison') {
                if (targetChar.statusEffects && targetChar.statusEffects.indexOf('poison') !== -1) {
                    targetChar.statusEffects = targetChar.statusEffects.filter(function(e) { return e !== 'poison'; });
                    this._showLog(cur.entity.name + ' usa ' + item.name + ' en ' + targetChar.name + '. Veneno curado!');
                } else {
                    this._showLog(targetChar.name + ' no esta envenenado!');
                    return;
                }
            }
            inv.quantity--;
            if (inv.quantity <= 0) {
                this.inventory = this.inventory.filter(function(i) { return i !== inv; });
            }
            this._playSound('sfx_hit');
            this.animating = true;
            this.time.delayedCall(600, function() { self.animating = false; self._afterTurn(); });
        }
    }

    _cancel() {
        this.selAction = null;
        this.selSpell = null;
        this.selTarget = null;
        this.selItemIdx = null;
        this._targetMode = null;
        this._drawAll();
    }

    _showLog(msg) {
        this.logTxt.setText(msg);
    }

    _playSound(key) {
        this.audio.playSfx(key);
    }

    _getEnemyPos(spriteKey) {
        var children = this.group.getChildren();
        for (var i = 0; i < children.length; i++) {
            var c = children[i];
            if (c.type === 'Sprite' && c.texture.key === 'enemies_' + spriteKey) {
                return { x: c.x, y: c.y };
            }
        }
        return null;
    }

    _getSpellElement(spellId) {
        var elements = {
            'fireball': 'fire', 'fire_breath': 'fire',
            'iceSpike': 'ice', 'ice_shard': 'ice',
            'lightning': 'lightning',
            'holySmite': 'holy',
            'dark_bolt': 'dark', 'drain_life': 'dark'
        };
        return elements[spellId] || null;
    }

    _hurtEnemy(enemySpriteKey, callback) {
        var self = this;
        var sprites = this.group.getChildren().filter(function(s) {
            return s.type === 'Sprite' && s.texture.key === 'enemies_' + enemySpriteKey;
        });
        if (sprites.length === 0) { if (callback) callback(); return; }
        var sprite = sprites[0];
        sprite.setTint(0xff4444);
        this.tweens.add({
            targets: sprite,
            x: sprite.x + 12,
            duration: 50,
            yoyo: true,
            ease: 'Linear',
            onComplete: function() {
                self.time.delayedCall(100, function() {
                    sprite.clearTint();
                    if (callback) callback();
                });
            }
        });
    }

    _shakeParty() {
        var partyTxts = this.group.getChildren().filter(function(t) {
            return t.type === 'Text';
        });
        if (partyTxts.length === 0) return;
        var self = this;
        this.tweens.add({
            targets: partyTxts,
            x: '+=4',
            duration: 30,
            yoyo: true,
            repeat: 2,
            ease: 'Linear'
        });
    }

    _afterTurn() {
        this.cs.nextTurn();
        this.cs.applyPoisonDamage();
        if (this.cs.isBattleOver()) { this._endBattle(); return; }

        this._removeDead();
        var next = this.cs.getCurrentCombatant();
        var self = this;

        if (next && next.type === 'enemy') {
            this._drawAll();
            this.time.delayedCall(500, function() {
                var r = self.cs.enemyAction(next.entity);
                self._showLog(r.message);
                self._playSound('sfx_hurt');
                self._shakeParty();
                if (r.damage > 0) {
                    self.fx.damageVignette();
                    self.fx.shake(0.003, 60);
                }
                if (r.targetObj && r.damage > 0) {
                    var tIdx = self.party.indexOf(r.targetObj);
                    if (tIdx !== -1) {
                        self.pm.floatingDamage(165, 310 + tIdx * 42, r.damage, false, false);
                    }
                }
                self._drawAll();
                self.time.delayedCall(600, function() { self._afterTurn(); });
            });
        } else if (next && next.type === 'party') {
            this.selAction = null;
            this.selSpell = null;
            this.selTarget = null;
            this.selItemIdx = null;
            this._targetMode = null;
            this._drawAll();
        } else {
            this._drawAll();
        }
    }

    _removeDead() {
        var self = this;
        this.enemies.forEach(function(e) {
            if (!e.isAlive() && !e._deathEffectPlayed) {
                e._deathEffectPlayed = true;
                var pos = self._getEnemyPos(e.sprite);
                if (pos) {
                    self.pm.death(pos.x, pos.y, null);
                }
            }
        });
        this.cs._removeDeadFromTurnOrder();
    }

    _endBattle() {
        var self = this;
        var allDead = this.party.every(function(c) { return !c.isAlive(); });
        if (allDead) {
            this.audio.stopBgm();
            this.cameras.main.fadeOut(500, 0, 0, 0);
            this.cameras.main.once('camerafadeoutcomplete', function() {
                self.scene.stop();
                self.onDefeat();
            });
            return;
        }

        var v = this.cs.getVictory();
        this.gold += v.gold;
        this.party.forEach(function(c) {
            if (c.isAlive()) {
                var lvlUps = c.gainExp(v.exp);
                if (lvlUps && lvlUps.length > 0) {
                    self._showLog(c.name + ' sube al nivel ' + lvlUps[lvlUps.length - 1] + '!');
                }
            }
        });
        this._playSound('sfx_victory');
        this.audio.stopBgm();
        this.fx.victoryFlash();

        this.g.clear();
        this._clear();
        this.g.fillStyle(0x000000, 0.93);
        this.g.fillRect(60, 60, 520, 360);
        this.g.lineStyle(2, 0x44ff44);
        this.g.strokeRect(60, 60, 520, 360);

        this._txt(GAME_W / 2, 90, 'VICTORIA!', { size: '24px', color: '#44ff44', origin: 0.5, font: 'Press Start 2P' });
        this._txt(GAME_W / 2, 130, 'EXP: +' + v.exp + '  |  Oro: +' + v.gold, { size: '16px', color: '#ffffff', origin: 0.5 });

        var victoryQuote = getVictoryQuote();
        this._txt(GAME_W / 2, 160, '"' + victoryQuote + '"', { size: '11px', color: '#888899', origin: 0.5, wrap: 480 });

        this.party.forEach(function(c, i) {
            if (!c.isAlive()) return;
            self._txt(GAME_W / 2, 190 + i * 22, c.name + '  Lv.' + c.level + '  EXP:' + c.exp + '/' + c.expToNext, { size: '12px', color: '#aaaaff', origin: 0.5 });
        });

        this._txt(GAME_W / 2, 380, 'ENTER para continuar', { size: '14px', color: '#888888', origin: 0.5 });
        this.input.keyboard.once('keydown-ENTER', function() {
            self.cameras.main.fadeOut(500, 0, 0, 0);
            self.cameras.main.once('camerafadeoutcomplete', function() {
                self.scene.stop();
                self.onVictory({ gold: self.gold, inventory: self.inventory });
            });
        });
    }
}
