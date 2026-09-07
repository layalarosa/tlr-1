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
        this.interactives = [];
        this.decorations = [];
        this.nameText = null;
        this._drawRace();
        this._setupInput();
        if (window.setTouchContext) window.setTouchContext('menu');
    }

    _clear() {
        this.g.clear();
        this.txts.forEach(function(t) { t.destroy(); });
        this.txts = [];
        this.interactives.forEach(function(zone) { zone.destroy(); });
        this.interactives = [];
        this.decorations.forEach(function(image) { image.destroy(); });
        this.decorations = [];
    }

    _zone(x, y, width, height, handler) {
        var zone = this.add.zone(x, y, width, height).setInteractive({ useHandCursor: true });
        zone.on('pointerdown', handler);
        this.interactives.push(zone);
        return zone;
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
        var keyNames = ['ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN'];
        keyNames.forEach(function(keyName, index) {
            self.input.keyboard.on('keydown-' + keyName, function() { self._selectByNumber(index); });
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

    _selectByNumber(index) {
        if (this.state === 'race') {
            var races = Object.keys(RACES);
            if (races[index]) {
                this.selRace = races[index];
                this._drawClass();
            }
            return;
        }
        if (this.state === 'class') {
            var classes = Object.keys(CLASSES).filter(function(key) {
                return AlignmentSystem.canUseClass(key, RACES[this.selRace].alignment);
            }, this);
            if (classes[index]) {
                this.selClass = classes[index];
                this._drawName();
            }
        }
    }

    _drawRace() {
        this.state = 'race';
        this._clear();
        var w = GAME_W, self = this;
        this._txt(w / 2, 20, 'Crear Personaje (' + (this.party.length + 1) + '/' + this.maxParty + ')', { size: '20px', origin: 0.5 });
        this._txt(w / 2, 48, 'Selecciona tu Raza:', { size: '16px', color: '#d49a52', origin: 0.5 });

        var races = Object.keys(RACES);
        races.forEach(function(key, i) {
            var race = RACES[key];
            var y = 75 + i * 90;
            self.g.fillStyle(0x1a0d12);
            self.g.fillRoundedRect(40, y, w - 80, 80, 2);
            self.g.lineStyle(1, 0x63313a);
            self.g.strokeRoundedRect(40, y, w - 80, 80, 2);
            self._txt(60, y + 8, race.name, { size: '18px', color: '#d49a52' });
            self._txt(60, y + 30, race.description, { size: '11px', color: '#888899', wrap: w - 140 });
            self._txt(60, y + 58, 'STR:' + race.baseStats.str + ' AGI:' + race.baseStats.agi + ' VIT:' + race.baseStats.vit + ' INT:' + race.baseStats.int + ' WIS:' + race.baseStats.wis + ' LUK:' + race.baseStats.luk, { size: '10px', color: '#555566' });

            self._zone(w / 2, y + 40, w - 80, 80, function() { self.selRace = key; self._drawClass(); });
        });
    }

    _drawClass() {
        this.state = 'class';
        this._clear();
        var w = GAME_W, self = this;
        this._txt(w / 2, 20, 'Raza: ' + RACES[this.selRace].name, { size: '18px', color: '#ffaa44', origin: 0.5 });
        this._txt(w / 2, 44, 'Selecciona tu Clase:', { size: '14px', color: '#d49a52', origin: 0.5 });

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
            self.g.fillStyle(canUse ? 0x1a0d12 : 0x111118);
            self.g.fillRoundedRect(40, y, w - 80, 46, 2);
            self._txt(80, y + 4, cls.name + (cls.role === 'front' ? ' [Front]' : ' [Back]'), { size: '13px', color: canUse ? '#ead6c1' : '#444444' });
            self._txt(80, y + 22, cls.description.substring(0, 55), { size: '10px', color: canUse ? '#a87870' : '#333333' });

            if (canUse && classPortraits[key] && self.textures.exists(classPortraits[key])) {
                self.decorations.push(self.add.image(58, y + 23, classPortraits[key]).setDepth(5));
            }

            if (canUse) {
                self._zone(w / 2, y + 23, w - 80, 46, function() { self.selClass = key; self._drawName(); });
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
            this.g.fillStyle(0x1a0d12);
            this.g.fillRoundedRect(w / 2 - 50, 15, 100, 100, 2);
            this.g.lineStyle(2, 0x8e3040);
            this.g.strokeRoundedRect(w / 2 - 50, 15, 100, 100, 2);
            this.decorations.push(this.add.image(w / 2, 65, classPortraits[this.selClass]).setDepth(5));
        }

        this._txt(w / 2, 130, RACES[this.selRace].name + ' ' + CLASSES[this.selClass].name, { size: '20px', color: '#ffaa44', origin: 0.5 });
        this._txt(w / 2, 155, 'Escribe o pulsa R para nombre aleatorio:', { size: '14px', color: '#d49a52', origin: 0.5 });
        this.nameText = this._txt(w / 2, 200, this.tempName + '_', { size: '32px', color: '#ffffff', origin: 0.5 });
        this._txt(w / 2, 250, 'ENTER = confirmar | ESC = volver', { size: '12px', color: '#666666', origin: 0.5 });

        var stats = this._calcPreview();
        this._txt(w / 2, 310, 'Stats preview:', { size: '14px', color: '#888888', origin: 0.5 });
        this._txt(w / 2, 335, 'STR:' + stats.str + ' AGI:' + stats.agi + ' VIT:' + stats.vit + ' INT:' + stats.int + ' WIS:' + stats.wis + ' LUK:' + stats.luk, { size: '12px', color: '#c18b7c', origin: 0.5 });
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
            self.g.fillStyle(0x1a0d12);
            self.g.fillRoundedRect(40, y, w - 80, 60, 2);
            self.g.lineStyle(1, 0x63313a);
            self.g.strokeRoundedRect(40, y, w - 80, 60, 2);
            self._txt(60, y + 6, c.name + ' - ' + c.race.name + ' ' + c.classData.name, { size: '14px', color: '#d49a52' });
            self._txt(60, y + 26, 'HP:' + c.maxHp + ' MP:' + c.maxMp + ' ATK:' + c.getAtk() + ' DEF:' + c.getDef() + ' SPD:' + c.getSpeed(), { size: '11px', color: '#888899' });
            self._txt(60, y + 42, 'Alineacion: ' + c.alignment.name + ' | Fila: ' + (c.row === 'front' ? 'Delantera' : 'Trasera'), { size: '10px', color: '#666677' });
        });

        self.g.fillStyle(0x3a1d1b);
        self.g.fillRoundedRect(w / 2 - 120, 360, 240, 45, 2);
        self.g.lineStyle(2, 0xd49a52);
        self.g.strokeRoundedRect(w / 2 - 120, 360, 240, 45, 2);
        this._txt(w / 2, 382, 'Comenzar Aventura!', { size: '18px', color: '#ffe0b5', origin: 0.5 });

        this._zone(w / 2, 382, 240, 45, function() {
            self.cameras.main.fadeOut(500, 0, 0, 0);
            self.cameras.main.once('camerafadeoutcomplete', function() {
                self._startPrologue();
            });
        });

        this._txt(w / 2, 430, 'Tecla ENTER', { size: '11px', color: '#555555', origin: 0.5 });
        this.input.keyboard.once('keydown-ENTER', function() {
            self.cameras.main.fadeOut(500, 0, 0, 0);
            self.cameras.main.once('camerafadeoutcomplete', function() {
                self._startPrologue();
            });
        });
    }

    _startPrologue() {
        var self = this;
        var storyState = createStoryState();
        this.scene.start('NarrativeScene', {
            party: this.party,
            inventory: [],
            gold: 50,
            currentFloor: 1,
            storyState: storyState,
            dialogues: [
                { name: 'La cronista', portrait: 'portrait_placeholder', text: 'La torre de Tharion ha vuelto a abrir sus puertas. Los exploradores que entraron antes que vosotros no regresaron.' },
                { name: 'La cronista', portrait: 'portrait_placeholder', text: 'Descended juntos. Encontrad sus huellas y decidid que precio estais dispuestos a pagar por llegar a la cima.' },
                { name: 'La cronista', portrait: 'portrait_placeholder', text: 'Vuestro primer objetivo es encontrar una pista en los Sotanos Olvidados.' }
            ],
            onComplete: function(data) {
                self.scene.start('ExploreScene', {
                    party: data.party,
                    storyState: data.storyState || storyState
                });
            }
        });
    }
}
