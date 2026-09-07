class NarrativeScene extends Phaser.Scene {
    constructor() { super({ key: 'NarrativeScene' }); }

    init(data) {
        this.dialogues = data.dialogues;
        this.portraits = data.portraits || {};
        this.onComplete = data.onComplete;
        this.party = data.party;
        this.inventory = data.inventory;
        this.gold = data.gold;
        this.currentFloor = data.currentFloor;
        this.storyState = data.storyState;
    }

    create() {
        this.cameras.main.fadeIn(300, 0, 0, 0);
        this.g = this.add.graphics();
        this.ui = new UITheme(this);
        this.audio = new AudioManager(this);
        this.idx = 0;
        this.typing = false;
        this.currentText = '';
        this.displayedChars = 0;
        this.timer = null;

        this._drawFrame();
        this._showCurrent();
        this._setupInput();
        if (window.setTouchContext) window.setTouchContext('explore');

        var self = this;
        this.input.on('pointerdown', function() {
            if (self.typing) {
                if (self.timer) self.timer.remove();
                self.typing = false;
                self.displayedChars = self.currentText.length;
                self.dialogueTxt.setText(self.currentText);
                self.continueHint.setVisible(true);
            } else {
                self.idx++;
                self._showCurrent();
            }
        });
    }

    _drawFrame() {
        var g = this.g;
        g.clear();

        g.fillStyle(0x020208);
        g.fillRect(0, 0, GAME_W, GAME_H);

        this.ui.panel(g, 20, 300, 600, 170, {
            borderColor: 0x8e3040,
            bgColor: 0x08080f,
            glowColor: 0x332266,
            cornerRadius: 8
        });

        this.portraitFrame = this.add.graphics().setDepth(58);

        this.nameTag = this.add.text(200, 305, '', {
            fontSize: '14px', fontFamily: '"Share Tech Mono", monospace', color: '#d8b18b',
            backgroundColor: '#1a1a2e', padding: { x: 8, y: 3 }
        }).setDepth(60);

        this.dialogueTxt = this.add.text(200, 335, '', {
            fontSize: '16px', fontFamily: '"VT323", monospace', color: '#cccccc',
            wordWrap: { width: 400 }, lineSpacing: 6
        }).setDepth(60);

        this.continueHint = this.add.text(GAME_W - 60, 455, 'ENTER ▼', {
            fontSize: '11px', fontFamily: '"Share Tech Mono", monospace', color: '#555566'
        }).setOrigin(1).setDepth(60);

        this.portraitImg = this.add.image(100, 220, 'portrait_placeholder').setDepth(59).setVisible(false);
    }

    _showCurrent() {
        if (this.idx >= this.dialogues.length) {
            this._finish();
            return;
        }

        var d = this.dialogues[this.idx];

        this.nameTag.setText(d.name || '');
        this.nameTag.setVisible(!!d.name);

        this.portraitFrame.clear();

        if (d.portrait && this.textures.exists(d.portrait)) {
            this.portraitImg.setTexture(d.portrait).setVisible(true).setPosition(100, 220);
            this.nameTag.setX(200);
            this.dialogueTxt.setX(200).setWordWrapWidth(400);

            this.portraitFrame.lineStyle(2, 0x8e3040);
            this.portraitFrame.strokeRect(55, 155, 90, 90);
            this.portraitFrame.fillStyle(0x111122, 0.6);
            this.portraitFrame.fillRect(55, 155, 90, 90);
        } else {
            this.portraitImg.setVisible(false);
            this.nameTag.setX(50);
            this.dialogueTxt.setX(50).setWordWrapWidth(560);
        }

        this.currentText = d.text || '';
        this.displayedChars = 0;
        this.dialogueTxt.setText('');
        this.typing = true;
        this.continueHint.setVisible(false);

        var self = this;
        this.timer = this.time.addEvent({
            delay: 30,
            repeat: this.currentText.length - 1,
            callback: function() {
                self.displayedChars++;
                self.dialogueTxt.setText(self.currentText.substring(0, self.displayedChars));
                if (self.displayedChars >= self.currentText.length) {
                    self.typing = false;
                    self.continueHint.setVisible(true);
                }
            }
        });
    }

    _setupInput() {
        var self = this;
        this.input.keyboard.on('keydown-ENTER', function() {
            if (self.typing) {
                if (self.timer) self.timer.remove();
                self.typing = false;
                self.displayedChars = self.currentText.length;
                self.dialogueTxt.setText(self.currentText);
                self.continueHint.setVisible(true);
            } else {
                self.idx++;
                self._showCurrent();
            }
        });

        this.input.keyboard.on('keydown-SPACE', function() {
            if (self.typing) {
                if (self.timer) self.timer.remove();
                self.typing = false;
                self.displayedChars = self.currentText.length;
                self.dialogueTxt.setText(self.currentText);
                self.continueHint.setVisible(true);
            } else {
                self.idx++;
                self._showCurrent();
            }
        });
    }

    _finish() {
        this.cameras.main.fadeOut(300, 0, 0, 0);
        var self = this;
        this.cameras.main.once('camerafadeoutcomplete', function() {
            if (self.onComplete) {
                self.onComplete({
                    party: self.party,
                    inventory: self.inventory,
                    gold: self.gold,
                    currentFloor: self.currentFloor,
                    storyState: self.storyState
                });
            }
            self.scene.stop();
        });
    }
}

class ChoiceScene extends Phaser.Scene {
    constructor() { super({ key: 'ChoiceScene' }); }

    init(data) {
        this.title = data.title;
        this.choices = data.choices;
        this.onChoice = data.onChoice;
        this.party = data.party;
        this.inventory = data.inventory;
        this.gold = data.gold;
        this.currentFloor = data.currentFloor;
    }

    create() {
        this.cameras.main.fadeIn(300, 0, 0, 0);
        this.g = this.add.graphics();
        this.ui = new UITheme(this);
        this.selIdx = 0;
        this.txts = [];

        this._draw();
        this._input();
        if (window.setTouchContext) window.setTouchContext('explore');

        var self = this;
        this.choices.forEach(function(c, i) {
            var y = 140 + i * 45;
            var zone = self.add.zone(320, y + 18, 320, 36).setInteractive();
            zone.on('pointerdown', function() {
                self.selIdx = i;
                self._select();
            });
        });
    }

    _draw() {
        this.g.clear();
        this.g.fillStyle(0x020208);
        this.g.fillRect(0, 0, GAME_W, GAME_H);

        this.ui.panel(this.g, 120, 80, 400, 300, {
            borderColor: 0x8e3040,
            bgColor: 0x08080f,
            glowColor: 0x332266,
            cornerRadius: 8
        });

        this.ui.titleBar(this.g, 140, 90, 360, this.title, null, {
            bgColor: 0x141430,
            textColor: '#d8b18b',
            fontSize: '18px'
        });

        var self = this;
        this.choices.forEach(function(c, i) {
            var y = 140 + i * 45;
            var active = self.selIdx === i;
            self.ui.button(self.g, 160, y, 320, 36, {
                active: active,
                bgColor: 0x0c0c18,
                borderColor: active ? 0x8866cc : 0x333355
            });
            self._txt(320, y + 8, c.label, {
                size: '16px',
                color: active ? '#ffffff' : '#888899',
                origin: 0.5
            });
        });

        this._txt(GAME_W / 2, 420, 'W/S o ↑/↓ = mover  |  ENTER = elegir', {
            size: '10px', color: '#444466', origin: 0.5
        });
    }

    _txt(x, y, str, style) {
        style = style || {};
        var t = this.add.text(x, y, str, {
            fontSize: style.size || '14px', fontFamily: '"VT323", monospace',
            color: style.color || '#ffffff'
        });
        if (style.origin) t.setOrigin(style.origin);
        this.txts.push(t);
        return t;
    }

    _input() {
        var self = this;
        var k = this.input.keyboard;
        k.on('keydown-W', function() { self._move(-1); });
        k.on('keydown-UP', function() { self._move(-1); });
        k.on('keydown-S', function() { self._move(1); });
        k.on('keydown-DOWN', function() { self._move(1); });
        k.on('keydown-ENTER', function() { self._select(); });
        k.on('keydown-SPACE', function() { self._select(); });
    }

    _move(dir) {
        this.selIdx = Phaser.Math.Wrap(this.selIdx + dir, 0, this.choices.length);
        this.txts.forEach(function(t) { t.destroy(); });
        this.txts = [];
        this._draw();
    }

    _select() {
        var choice = this.choices[this.selIdx];
        this.cameras.main.fadeOut(300, 0, 0, 0);
        var self = this;
        this.cameras.main.once('camerafadeoutcomplete', function() {
            if (choice.action) {
                choice.action({
                    party: self.party,
                    inventory: self.inventory,
                    gold: self.gold,
                    currentFloor: self.currentFloor
                });
            }
            if (self.onChoice) {
                self.onChoice(choice.value, {
                    party: self.party,
                    inventory: self.inventory,
                    gold: self.gold,
                    currentFloor: self.currentFloor
                });
            }
            self.scene.stop();
        });
    }
}
