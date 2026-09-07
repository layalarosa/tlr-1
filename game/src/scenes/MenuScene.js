class MenuScene extends Phaser.Scene {
    constructor() { super({ key: 'MenuScene' }); }

    create() {
        this.cameras.main.fadeIn(800, 0, 0, 0);
        var w = GAME_W, h = GAME_H;
        var saveSystem = new SaveSystem();
        var g = this.add.graphics();
        var texts = [];
        var hitAreas = [];
        var transitioning = false;
        var ui = new UITheme(this);
        var audio = new AudioManager(this);
        audio.playBgm('bgm_menu');

        function clearAll() {
            g.clear();
            texts.forEach(function(t) { t.destroy(); });
            texts = [];
            hitAreas.forEach(function(area) { area.destroy(); });
            hitAreas = [];
        }

        var txt = function(x, y, str, style) {
            style = style || {};
            var fontName = style.font || 'VT323';
            var t = this.add.text(x, y, str, {
                fontSize: style.size || '16px', fontFamily: fontName + ', monospace',
                color: style.color || '#ffffff',
                stroke: style.stroke || null,
                strokeThickness: style.strokeThickness || 0
            });
            if (style.origin) t.setOrigin(style.origin);
            texts.push(t);
            return t;
        }.bind(this);

        function drawMenu() {
            clearAll();

            g.fillStyle(0x050508);
            g.fillRect(0, 0, w, h);

            for (var i = 0; i < 25; i++) {
                g.fillStyle(0x08080f, 0.4);
                g.fillRect(0, i * 20, w, 1);
            }

            ui.panel(g, w / 2 - 170, 25, 340, 140, {
                borderColor: 0x662222,
                glowColor: 0x441111
            });

            g.fillStyle(0x440808, 0.2);
            g.fillRect(w / 2 - 140, 40, 280, 1);

            txt(w / 2, 52, 'THE LAST', { size: '30px', color: '#dd2222', origin: 0.5, stroke: '#660000', strokeThickness: 4, font: 'Press Start 2P' });
            txt(w / 2, 90, 'RIDERS', { size: '30px', color: '#dd2222', origin: 0.5, stroke: '#660000', strokeThickness: 4, font: 'Press Start 2P' });
            txt(w / 2, 128, 'Los Ultimos Jinetes  |  BETA 0.1', { size: '14px', color: '#b47a55', origin: 0.5, font: 'Share Tech Mono' });

            ui.separator(g, w / 2 - 140, 178, 280, { color: 0x662222, alpha: 0.5 });

            var buttons = [
                { label: 'Nueva Partida', key: '1', y: 215 },
                { label: 'Continuar', key: '2', y: 263 },
                { label: 'Cargar Archivo', key: '3', y: 311 },
                { label: 'Donar vía PayPal', key: '4', y: 359, paypal: true }
            ];
            var self = this;
            buttons.forEach(function(b) {
                ui.button(g, w / 2 - 130, b.y - 22, 260, 44, {
                    bgColor: 0x180b10,
                    borderColor: 0x63313a
                });
                var label = txt(w / 2, b.y, b.key + ' - ' + b.label, { size: '22px', color: '#c18b7c', origin: 0.5, font: 'VT323' });
                var area = self.add.zone(w / 2, b.y, 260, 44).setInteractive({ useHandCursor: true });
                area.on('pointerover', function() { label.setColor('#ffe0b5'); });
                area.on('pointerout', function() { label.setColor('#c18b7c'); });
                area.on('pointerdown', function() { self._menuActions[b.key](); });
                hitAreas.push(area);
            });

            ui.separator(g, w / 2 - 140, 392, 280, { color: 0x662222, alpha: 0.4 });

            txt(w / 2, 414, 'Usa las teclas 1, 2, 3 o 4', { size: '13px', color: '#553344', origin: 0.5, font: 'Share Tech Mono' });
            txt(w / 2, 442, 'W/S = Avanzar  A/D = Girar  Q/E = Lateral  SPACE = Interactuar', { size: '11px', color: '#442233', origin: 0.5, font: 'Share Tech Mono' });

        }

        drawMenu.call(this);

        if (window.setTouchContext) window.setTouchContext('menu');
        var self = this;
        function startScene(sceneKey, data) {
            if (transitioning) return;
            transitioning = true;
            self.cameras.main.fadeOut(500, 0, 0, 0);
            self.cameras.main.once('camerafadeoutcomplete', function() {
                self.scene.start(sceneKey, data);
            });
        }
        function continueGame() {
            if (transitioning) return;
            var save = saveSystem.load();
            if (save) {
                startScene('ExploreScene', { saveData: save });
            } else {
                clearAll();
                g.fillStyle(0x050508);
                g.fillRect(0, 0, w, h);
                ui.panel(g, w / 2 - 160, h / 2 - 45, 320, 90, { borderColor: 0x663333 });
                txt(w / 2, h / 2 - 15, 'No hay partida guardada', { size: '18px', color: '#cc4444', origin: 0.5, font: 'VT323' });
                txt(w / 2, h / 2 + 15, 'Presiona 1 para nueva partida', { size: '14px', color: '#774444', origin: 0.5, font: 'Share Tech Mono' });
                self.time.delayedCall(2000, function() { drawMenu.call(self); });
            }
        }
        function importGame() {
            if (transitioning) return;
            var input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json';
            input.onchange = function(e) {
                var file = e.target.files[0];
                if (!file) return;
                saveSystem.importSave(file).then(function() {
                    var loaded = saveSystem.load();
                    if (!loaded) throw new Error('No se pudo leer la partida importada');
                    startScene('ExploreScene', { saveData: loaded });
                }).catch(function() {
                    clearAll();
                    g.fillStyle(0x050508);
                    g.fillRect(0, 0, w, h);
                    ui.panel(g, w / 2 - 160, h / 2 - 45, 320, 90, { borderColor: 0x663333 });
                    txt(w / 2, h / 2 - 15, 'Archivo de partida invalido', { size: '18px', color: '#cc4444', origin: 0.5, font: 'VT323' });
                    txt(w / 2, h / 2 + 15, 'Elige un archivo .json valido', { size: '14px', color: '#774444', origin: 0.5, font: 'Share Tech Mono' });
                    self.time.delayedCall(2000, function() { drawMenu.call(self); });
                });
            };
            input.click();
        }
        function donate() {
            if (transitioning) return;
            window.open('https://www.paypal.com/donate', '_blank');
        }
        this._menuActions = {
            '1': function() { startScene('CreatePartyScene'); },
            '2': continueGame,
            '3': importGame,
            '4': donate
        };
        this.input.keyboard.on('keydown-ONE', this._menuActions['1']);
        this.input.keyboard.on('keydown-TWO', this._menuActions['2']);
        this.input.keyboard.on('keydown-THREE', this._menuActions['3']);
        this.input.keyboard.on('keydown-FOUR', this._menuActions['4']);
    }
}
