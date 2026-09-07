class CreatePartyScene extends Phaser.Scene {
    constructor() { super({ key: 'CreatePartyScene' }); }

    create() {
        this.cameras.main.fadeIn(500, 0, 0, 0);
        this.party = [];
        this.maxParty = 4;
        this.state = 'race';
        this.selRace = null;
        this.selClass = null;
        this.tempName = '';
        this.g = this.add.graphics();
        this.txts = [];
        this.nameText = null;
        this._drawRace();
        this._setupInput();
    }

    _clear() {
        this.g.clear();
        this.txts.forEach(function(t) { t.destroy(); });
        this.txts = [];
    }

    _txt(x, y, str, style) {
        style = style || {};
        var t = this.add.text(x, y, str, {
            fontSize: style.size || '14px', fontFamily: '"VT323", monospace',
            color: style.color || '#ffffff',
            wordWrap: style.wrap ? { width: style.wrap } : undefined
        });
        if (style.origin) t.setOrigin(style.origin);
        this.txts.push(t);
        return t;
    }

    _setupInput() {
        var self = this;
        this.input.keyboard.on('keydown-ENTER', function() {
            if (self.state === 'name' && self.tempName.length > 0) self._confirmName();
        });
        this.input.keyboard.on('keydown-BACKSPACE', function() {
            if (self.state === 'name') {
                self.tempName = self.tempName.slice(0, -1);
                if (self.nameText) self.nameText.setText(self.tempName + '_');
            }
        });
        this.input.keyboard.on('keydown-R', function() {
            if (self.state === 'name') self._randomName();
        });
        this.input.keyboard.on('keydown-ESC', function() {
            if (self.state === 'class') self._drawRace();
            else if (self.state === 'name') self._drawClass();
        });
        this._onDocKeyDown = function(e) {
            if (self.state === 'name' && e.key.length === 1 && /[a-zA-Z0-9 ]/.test(e.key) && self.tempName.length < 14) {
                self.tempName += e.key;
                if (self.nameText) self.nameText.setText(self.tempName + '_');
            }
        };
        document.addEventListener('keydown', this._onDocKeyDown);
    }

    _drawRace() {
        this.state = 'race';
        this._clear();
        var w = GAME_W, self = this;
        this._txt(w / 2, 20, 'Crear Personaje (' + (this.party.length + 1) + '/' + this.maxParty + ')', { size: '20px', origin: 0.5 });
        this._txt(w / 2, 48, 'Selecciona tu Raza:', { size: '16px', color: '#aaaaff', origin: 0.5 });

        var races = Object.keys(RACES);
        races.forEach(function(key, i) {
            var race = RACES[key];
            var y = 75 + i * 90;
            self.g.fillStyle(0x1a1a33);
            self.g.fillRoundedRect(40, y, w - 80, 80, 8);
            self.g.lineStyle(1, 0x3333aa);
            self.g.strokeRoundedRect(40, y, w - 80, 80, 8);
            self._txt(60, y + 8, race.name, { size: '18px', color: '#ffaa44' });
            self._txt(60, y + 30, race.description, { size: '11px', color: '#888899', wrap: w - 140 });
            self._txt(60, y + 58, 'STR:' + race.baseStats.str + ' AGI:' + race.baseStats.agi + ' VIT:' + race.baseStats.vit + ' INT:' + race.baseStats.int + ' WIS:' + race.baseStats.wis + ' LUK:' + race.baseStats.luk, { size: '10px', color: '#555566' });

            var zone = self.add.zone(w / 2, y + 40, w - 80, 80).setInteractive();
            zone.on('pointerdown', function() { self.selRace = key; self._drawClass(); });
        });
    }

    _drawClass() {
        this.state = 'class';
        this._clear();
        var w = GAME_W, self = this;
        this._txt(w / 2, 20, 'Raza: ' + RACES[this.selRace].name, { size: '18px', color: '#ffaa44', origin: 0.5 });
        this._txt(w / 2, 44, 'Selecciona tu Clase:', { size: '14px', color: '#aaaaff', origin: 0.5 });

        var classPortraits = {
            warrior: 'portrait_warrior',
            mage: 'portrait_mage',
            thief: 'portrait_thief',
            cleric: 'portrait_cleric'
        };

        var classes = Object.keys(CLASSES);
        classes.forEach(function(key, i) {
            var cls = CLASSES[key];
            var y = 65 + i * 52;
            var canUse = AlignmentSystem.canUseClass(key, RACES[self.selRace].alignment);
            self.g.fillStyle(canUse ? 0x1a1a33 : 0x111118);
            self.g.fillRoundedRect(40, y, w - 80, 46, 6);
            self._txt(80, y + 4, cls.name + (cls.role === 'front' ? ' [Front]' : ' [Back]'), { size: '13px', color: canUse ? '#ccccff' : '#444444' });
            self._txt(80, y + 22, cls.description.substring(0, 55), { size: '10px', color: canUse ? '#777799' : '#333333' });

            if (canUse && classPortraits[key] && self.textures.exists(classPortraits[key])) {
                self.add.image(58, y + 23, classPortraits[key]).setDepth(5);
            }

            if (canUse) {
                var zone = self.add.zone(w / 2, y + 23, w - 80, 46).setInteractive();
                zone.on('pointerdown', function() { self.selClass = key; self._drawName(); });
            }
        });
        this._txt(w / 2, 465, 'ESC = volver', { size: '11px', color: '#555555', origin: 0.5 });
    }

    _drawName() {
        this.state = 'name';
        this.tempName = getRandomName(this.selRace);
        this._clear();
        var w = GAME_W, self = this;

        var classPortraits = {
            warrior: 'portrait_warrior',
            mage: 'portrait_mage',
            thief: 'portrait_thief',
            cleric: 'portrait_cleric'
        };

        if (classPortraits[this.selClass] && this.textures.exists(classPortraits[this.selClass])) {
            this.g.fillStyle(0x1a1a33);
            this.g.fillRoundedRect(w / 2 - 50, 15, 100, 100, 8);
            this.g.lineStyle(2, 0x6644aa);
            this.g.strokeRoundedRect(w / 2 - 50, 15, 100, 100, 8);
            this.add.image(w / 2, 65, classPortraits[this.selClass]).setDepth(5);
        }

        this._txt(w / 2, 130, RACES[this.selRace].name + ' ' + CLASSES[this.selClass].name, { size: '20px', color: '#ffaa44', origin: 0.5 });
        this._txt(w / 2, 155, 'Escribe o pulsa R para nombre aleatorio:', { size: '14px', color: '#aaaaff', origin: 0.5 });
        this.nameText = this._txt(w / 2, 200, this.tempName + '_', { size: '32px', color: '#ffffff', origin: 0.5 });
        this._txt(w / 2, 250, 'ENTER = confirmar | ESC = volver', { size: '12px', color: '#666666', origin: 0.5 });

        var stats = this._calcPreview();
        this._txt(w / 2, 310, 'Stats preview:', { size: '14px', color: '#888888', origin: 0.5 });
        this._txt(w / 2, 335, 'STR:' + stats.str + ' AGI:' + stats.agi + ' VIT:' + stats.vit + ' INT:' + stats.int + ' WIS:' + stats.wis + ' LUK:' + stats.luk, { size: '12px', color: '#aaaaff', origin: 0.5 });
    }

    _randomName() {
        this.tempName = getRandomName(this.selRace);
        if (this.nameText) this.nameText.setText(this.tempName + '_');
    }

    _calcPreview() {
        var r = RACES[this.selRace], c = CLASSES[this.selClass];
        return {
            str: r.baseStats.str + c.baseStats.str + r.bonuses.str,
            agi: r.baseStats.agi + c.baseStats.agi + r.bonuses.agi,
            vit: r.baseStats.vit + c.baseStats.vit + r.bonuses.vit,
            int: r.baseStats.int + c.baseStats.int + r.bonuses.int,
            wis: r.baseStats.wis + c.baseStats.wis + r.bonuses.wis,
            luk: r.baseStats.luk + c.baseStats.luk + r.bonuses.luk
        };
    }

    _confirmName() {
        var char = new Character(this.tempName, this.selRace, this.selClass, RACES[this.selRace].alignment);
        this.party.push(char);
        if (this.party.length >= this.maxParty) this._drawSummary();
        else this._drawRace();
    }

    shutdown() {
        if (this._onDocKeyDown) {
            document.removeEventListener('keydown', this._onDocKeyDown);
        }
    }

    _drawSummary() {
        this.state = 'summary';
        this._clear();
        var w = GAME_W, self = this;
        this._txt(w / 2, 25, 'Tu Grupo', { size: '24px', origin: 0.5, color: '#ffffff' });

        this.party.forEach(function(c, i) {
            var y = 60 + i * 70;
            self.g.fillStyle(0x1a1a33);
            self.g.fillRoundedRect(40, y, w - 80, 60, 6);
            self.g.lineStyle(1, 0x3333aa);
            self.g.strokeRoundedRect(40, y, w - 80, 60, 6);
            self._txt(60, y + 6, c.name + ' - ' + c.race.name + ' ' + c.classData.name, { size: '14px', color: '#ffaa44' });
            self._txt(60, y + 26, 'HP:' + c.maxHp + ' MP:' + c.maxMp + ' ATK:' + c.getAtk() + ' DEF:' + c.getDef() + ' SPD:' + c.getSpeed(), { size: '11px', color: '#888899' });
            self._txt(60, y + 42, 'Alineacion: ' + c.alignment.name + ' | Fila: ' + (c.row === 'front' ? 'Delantera' : 'Trasera'), { size: '10px', color: '#666677' });
        });

        self.g.fillStyle(0x224422);
        self.g.fillRoundedRect(w / 2 - 120, 360, 240, 45, 8);
        self.g.lineStyle(2, 0x44ff44);
        self.g.strokeRoundedRect(w / 2 - 120, 360, 240, 45, 8);
        this._txt(w / 2, 382, 'Comenzar Aventura!', { size: '18px', color: '#44ff44', origin: 0.5 });

        var zone = this.add.zone(w / 2, 382, 240, 45).setInteractive();
        zone.on('pointerdown', function() {
            self.cameras.main.fadeOut(500, 0, 0, 0);
            self.cameras.main.once('camerafadeoutcomplete', function() {
                self.scene.start('ExploreScene', { party: self.party });
            });
        });

        this._txt(w / 2, 430, 'Tecla ENTER', { size: '11px', color: '#555555', origin: 0.5 });
        this.input.keyboard.once('keydown-ENTER', function() {
            self.cameras.main.fadeOut(500, 0, 0, 0);
            self.cameras.main.once('camerafadeoutcomplete', function() {
                self.scene.start('ExploreScene', { party: self.party });
            });
        });
    }
}
