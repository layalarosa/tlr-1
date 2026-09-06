class CreatePartyScene extends Phaser.Scene {
    constructor() {
        super({ key: 'CreatePartyScene' });
    }

    create() {
        this.party = [];
        this.maxPartySize = 4;
        this.selectedRace = null;
        this.selectedClass = null;
        this.tempName = '';
        this.currentScreen = 'race';

        this.graphics = this.add.graphics();
        this.textGroup = this.add.group();

        this._showRaceSelection();
        this._setupInput();
    }

    _setupInput() {
        const self = this;
        this.input.keyboard.on('keydown-ENTER', function() {
            if (self.currentScreen === 'name') {
                self._confirmName();
            }
        });
        this.input.keyboard.on('keydown-BACKSPACE', function() {
            if (self.currentScreen === 'name') {
                self.tempName = self.tempName.slice(0, -1);
                self._updateNameDisplay();
            }
        });
        this.input.keyboard.on('keydown-ESC', function() {
            if (self.currentScreen !== 'race') {
                self._showRaceSelection();
            }
        });

        this.input.on('keydown', function(event) {
            if (self.currentScreen === 'name') {
                if (event.key.length === 1 && event.key.match(/[a-zA-Z0-9]/) && self.tempName.length < 12) {
                    self.tempName += event.key;
                    self._updateNameDisplay();
                }
            }
        });
    }

    _clearScreen() {
        this.graphics.clear();
        this.textGroup.clear(true, true);
    }

    _addText(x, y, str, style) {
        style = style || {};
        const t = this.add.text(x, y, str, {
            fontSize: style.fontSize || '14px',
            fontFamily: 'monospace',
            color: style.color || '#ffffff',
            wordWrap: style.wordWrap ? { width: style.wordWrap } : undefined
        });
        if (style.origin) t.setOrigin(style.origin);
        if (style.align) t.setStyle({ align: style.align });
        this.textGroup.add(t);
        return t;
    }

    _showRaceSelection() {
        this.currentScreen = 'race';
        this._clearScreen();
        const w = 640;

        this._addText(w / 2, 25, 'Crear Personaje (' + (this.party.length + 1) + '/' + this.maxPartySize + ')', {
            fontSize: '22px', color: '#ffffff', origin: 0.5
        });
        this._addText(w / 2, 55, 'Selecciona tu Raza:', {
            fontSize: '16px', color: '#aaaaff', origin: 0.5
        });

        const self = this;
        const races = Object.entries(RACES);
        races.forEach(function(entry, i) {
            const key = entry[0];
            const race = entry[1];
            const y = 85 + i * 80;

            self.graphics.fillStyle(0x222244, 1);
            self.graphics.fillRoundedRect(w / 2 - 220, y, 440, 70, 8);
            self.graphics.lineStyle(2, 0x4444aa);
            self.graphics.strokeRoundedRect(w / 2 - 220, y, 440, 70, 8);

            self._addText(w / 2 - 200, y + 8, race.name, { fontSize: '18px', color: '#ffffff' });
            self._addText(w / 2 - 200, y + 32, race.description, { fontSize: '11px', color: '#888888', wordWrap: 400 });
            self._addText(w / 2 - 200, y + 50, 'Atributos: STR:' + race.baseStats.str + ' AGI:' + race.baseStats.agi + ' VIT:' + race.baseStats.vit + ' INT:' + race.baseStats.int, {
                fontSize: '10px', color: '#666666'
            });

            const zone = self.add.zone(w / 2, y + 35, 440, 70).setInteractive();
            zone.on('pointerdown', function() {
                self.selectedRace = key;
                self._showClassSelection();
            });
        });
    }

    _showClassSelection() {
        this.currentScreen = 'class';
        this._clearScreen();
        const w = 640;

        this._addText(w / 2, 20, 'Raza: ' + RACES[this.selectedRace].name, {
            fontSize: '18px', color: '#ffaa44', origin: 0.5
        });
        this._addText(w / 2, 48, 'Selecciona tu Clase:', {
            fontSize: '16px', color: '#aaaaff', origin: 0.5
        });

        const self = this;
        const classes = Object.entries(CLASSES);
        classes.forEach(function(entry, i) {
            const key = entry[0];
            const cls = entry[1];
            const y = 75 + i * 50;
            const canUse = AlignmentSystem.canUseClass(key, RACES[self.selectedRace].alignment);

            self.graphics.fillStyle(0x222244, canUse ? 1 : 0.4);
            self.graphics.fillRoundedRect(w / 2 - 220, y, 440, 44, 6);

            const nameColor = canUse ? '#ffffff' : '#666666';
            self._addText(w / 2 - 200, y + 5, cls.name, { fontSize: '14px', color: nameColor });

            const roleText = cls.role === 'front' ? 'Frontal' : 'Trasera';
            self._addText(w / 2 - 200, y + 24, roleText + ' | ' + cls.description.substring(0, 45) + '...', {
                fontSize: '10px', color: '#888888'
            });

            if (canUse) {
                const zone = self.add.zone(w / 2, y + 22, 440, 44).setInteractive();
                zone.on('pointerdown', function() {
                    self.selectedClass = key;
                    self._showNameInput();
                });
            }
        });

        this._addText(w / 2, 470, 'ESC = volver a razas', { fontSize: '11px', color: '#666666', origin: 0.5 });
    }

    _showNameInput() {
        this.currentScreen = 'name';
        this.tempName = '';
        this._clearScreen();
        const w = 640;

        this._addText(w / 2, 80, 'Raza: ' + RACES[this.selectedRace].name + ' | Clase: ' + CLASSES[this.selectedClass].name, {
            fontSize: '16px', color: '#ffaa44', origin: 0.5
        });

        this._addText(w / 2, 130, 'Escribe el nombre de tu personaje:', {
            fontSize: '18px', color: '#aaaaff', origin: 0.5
        });

        this.nameDisplay = this._addText(w / 2, 180, '_', {
            fontSize: '28px', color: '#ffffff', origin: 0.5
        });

        this._addText(w / 2, 230, 'ENTER = confirmar | ESC = volver', {
            fontSize: '13px', color: '#888888', origin: 0.5
        });

        this._drawConfirmButton(false);
    }

    _updateNameDisplay() {
        if (this.nameDisplay) {
            this.nameDisplay.setText(this.tempName + '_');
        }
        this._drawConfirmButton(this.tempName.length > 0);
    }

    _drawConfirmButton(active) {
        const w = 640;
        const color = active ? 0x224422 : 0x222222;
        const textColor = active ? '#44ff44' : '#666666';

        this.graphics.fillStyle(color);
        this.graphics.fillRoundedRect(w / 2 - 100, 280, 200, 40, 8);

        this._addText(w / 2, 300, '[ Confirmar ]', {
            fontSize: '18px', color: textColor, origin: 0.5
        });
    }

    _confirmName() {
        if (this.tempName.length === 0) return;

        const char = new Character(this.tempName, this.selectedRace, this.selectedClass, RACES[this.selectedRace].alignment);
        this.party.push(char);

        if (this.party.length >= this.maxPartySize) {
            this._showPartySummary();
        } else {
            this._showRaceSelection();
        }
    }

    _showPartySummary() {
        this.currentScreen = 'summary';
        this._clearScreen();
        const w = 640;

        this._addText(w / 2, 40, 'Tu Grupo:', {
            fontSize: '26px', color: '#ffffff', origin: 0.5
        });

        const self = this;
        this.party.forEach(function(char, i) {
            const y = 90 + i * 70;

            self.graphics.fillStyle(0x222244);
            self.graphics.fillRoundedRect(w / 2 - 220, y, 440, 60, 8);
            self.graphics.lineStyle(1, 0x4444aa);
            self.graphics.strokeRoundedRect(w / 2 - 220, y, 440, 60, 8);

            self._addText(w / 2, y + 12, char.name + ' - ' + char.race.name + ' ' + char.classData.name, {
                fontSize: '15px', color: '#ffaa44', origin: 0.5
            });
            self._addText(w / 2, y + 35, 'HP:' + char.maxHp + ' MP:' + char.maxMp + ' ATK:' + char.getAtk() + ' DEF:' + char.getDef() + ' SPD:' + char.getSpeed(), {
                fontSize: '11px', color: '#888888', origin: 0.5
            });
        });

        this.graphics.fillStyle(0x224422);
        this.graphics.fillRoundedRect(w / 2 - 130, 380, 260, 50, 10);
        this.graphics.lineStyle(2, 0x44ff44);
        this.graphics.strokeRoundedRect(w / 2 - 130, 380, 260, 50, 10);

        this._addText(w / 2, 405, 'Comenzar Aventura!', {
            fontSize: '20px', color: '#44ff44', origin: 0.5
        });

        const zone = this.add.zone(w / 2, 405, 260, 50).setInteractive();
        const self2 = this;
        zone.on('pointerdown', function() {
            self2.scene.start('ExploreScene', { party: self2.party });
        });
    }
}
