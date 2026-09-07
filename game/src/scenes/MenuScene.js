class MenuScene extends Phaser.Scene {
    constructor() { super({ key: 'MenuScene' }); }

    create() {
        this.cameras.main.fadeIn(800, 0, 0, 0);
        var w = GAME_W, h = GAME_H;
        var saveSystem = new SaveSystem();
        var g = this.add.graphics();
        var texts = [];
        var ui = new UITheme(this);
        var audio = new AudioManager(this);
        audio.playBgm('bgm_menu');

        function clearAll() {
            g.clear();
            texts.forEach(function(t) { t.destroy(); });
            texts = [];
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
            txt(w / 2, 128, 'Los Ultimos Jinetes', { size: '14px', color: '#774444', origin: 0.5, font: 'Share Tech Mono' });

            ui.separator(g, w / 2 - 140, 178, 280, { color: 0x662222, alpha: 0.5 });

            var buttons = [
                { label: 'Nueva Partida', key: '1', y: 220 },
                { label: 'Continuar', key: '2', y: 275 },
                { label: 'Cargar Archivo', key: '3', y: 330 },
                { label: 'Donar vía PayPal', key: '4', y: 385, paypal: true }
            ];
            var self = this;
            buttons.forEach(function(b) {
                ui.button(g, w / 2 - 130, b.y - 22, 260, 44, {
                    bgColor: 0x120a1a,
                    borderColor: 0x443366
                });
                txt(w / 2, b.y, b.key + ' - ' + b.label, { size: '22px', color: '#9988cc', origin: 0.5, font: 'VT323' });
            });

            ui.separator(g, w / 2 - 140, 378, 280, { color: 0x662222, alpha: 0.4 });

            txt(w / 2, 408, 'Usa las teclas 1, 2, 3 o 4', { size: '13px', color: '#553344', origin: 0.5, font: 'Share Tech Mono' });
            txt(w / 2, 442, 'WASD = Mover  |  SPACE = Interactuar', { size: '12px', color: '#442233', origin: 0.5, font: 'Share Tech Mono' });

            ui.panel(g, 15, h - 65, 180, 50, { borderColor: 0x333344, bgColor: 0x080810 });
            txt(25, h - 50, 'v1.0 - AA Quality', { size: '10px', color: '#444455', font: 'Share Tech Mono' });
        }

        drawMenu.call(this);

        var self = this;
        this.input.keyboard.on('keydown-ONE', function() {
            self.cameras.main.fadeOut(500, 0, 0, 0);
            self.cameras.main.once('camerafadeoutcomplete', function() {
                self.scene.start('CreatePartyScene');
            });
        });
        this.input.keyboard.on('keydown-TWO', function() {
            var save = saveSystem.load();
            if (save) {
                self.cameras.main.fadeOut(500, 0, 0, 0);
                self.cameras.main.once('camerafadeoutcomplete', function() {
                    self.scene.start('ExploreScene', { saveData: save });
                });
            } else {
                clearAll();
                g.fillStyle(0x050508);
                g.fillRect(0, 0, w, h);
                ui.panel(g, w / 2 - 160, h / 2 - 45, 320, 90, { borderColor: 0x663333 });
                txt(w / 2, h / 2 - 15, 'No hay partida guardada', { size: '18px', color: '#cc4444', origin: 0.5, font: 'VT323' });
                txt(w / 2, h / 2 + 15, 'Presiona 1 para nueva partida', { size: '14px', color: '#774444', origin: 0.5, font: 'Share Tech Mono' });
                self.time.delayedCall(2000, function() { drawMenu.call(self); });
            }
        });
        this.input.keyboard.on('keydown-THREE', function() {
            var input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json';
            input.onchange = function(e) {
                var file = e.target.files[0];
                if (!file) return;
                var reader = new FileReader();
                reader.onload = function(ev) {
                    try {
                        var data = JSON.parse(ev.target.result);
                        localStorage.setItem('the_last_riders_save', JSON.stringify(data));
                        var loaded = saveSystem.load();
                        if (loaded) {
                            self.cameras.main.fadeOut(500, 0, 0, 0);
                            self.cameras.main.once('camerafadeoutcomplete', function() {
                                self.scene.start('ExploreScene', { saveData: loaded });
                            });
                        }
                    } catch(err) { alert('Archivo invalido'); }
                };
                reader.readAsText(file);
            };
            input.click();
        });
        this.input.keyboard.on('keydown-FOUR', function() {
            window.open('https://www.paypal.com/donate', '_blank');
        });
    }
}
