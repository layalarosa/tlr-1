class GameOverScene extends Phaser.Scene {
    constructor() { super({ key: 'GameOverScene' }); }

    init(data) {
        this.victory = data && data.victory === true;
    }

    create() {
        this.cameras.main.fadeIn(800, 0, 0, 0);
        if (window.setTouchContext) window.setTouchContext('menu');
        var w = GAME_W, h = GAME_H;
        var g = this.add.graphics();
        var ui = new UITheme(this);

        g.fillStyle(this.victory ? 0x0b120d : 0x080306);
        g.fillRect(0, 0, w, h);

        for (var i = 0; i < 30; i++) {
            g.fillStyle(this.victory ? 0x182516 : 0x1b080d, 0.3);
            g.fillRect(0, i * 16, w, 1);
        }

        ui.panel(g, w / 2 - 180, h / 3 - 60, 360, 180, {
            borderColor: this.victory ? 0x668f54 : 0x8e3040,
            bgColor: this.victory ? 0x101b12 : 0x16070b,
            glowColor: this.victory ? 0x31572c : 0x591522
        });

        ui.separator(g, w / 2 - 140, h / 3 - 35, 280, { color: 0x662222, alpha: 0.5 });

        this.add.text(w / 2, h / 3 - 15, this.victory ? 'VICTORIA' : 'GAME OVER', {
            fontSize: '32px', fontFamily: '"Press Start 2P", monospace', color: this.victory ? '#44ff88' : '#ff2222',
            stroke: this.victory ? '#116633' : '#660000', strokeThickness: 3
        }).setOrigin(0.5);

        this.add.text(w / 2, h / 3 + 25, 'Tu grupo ha caido...', {
            fontSize: '18px', fontFamily: '"VT323", monospace', color: this.victory ? '#88ccaa' : '#886666'
        }).setText(this.victory ? 'Tharion II ha sido derrotado.' : 'Tu grupo ha caido...').setOrigin(0.5);

        ui.separator(g, w / 2 - 140, h / 3 + 55, 280, { color: 0x662222, alpha: 0.4 });

        ui.button(g, w / 2 - 110, h / 2 + 30, 220, 44, {
            bgColor: 0x1a0808,
            borderColor: 0x663333
        });

        var menuBtn = this.add.text(w / 2, h / 2 + 52, '[ Menu Principal ]', {
            fontSize: '22px', fontFamily: '"VT323", monospace', color: '#cc8888'
        }).setOrigin(0.5).setInteractive();

        var self = this;
        menuBtn.on('pointerover', function() { menuBtn.setColor('#ffaa44'); });
        menuBtn.on('pointerout', function() { menuBtn.setColor('#cc8888'); });
        menuBtn.on('pointerdown', function() {
            var ss = new SaveSystem();
            ss.deleteSave();
            self.cameras.main.fadeOut(500, 0, 0, 0);
            self.cameras.main.once('camerafadeoutcomplete', function() {
                self.scene.start('MenuScene');
            });
        });
        this.input.keyboard.on('keydown-ENTER', function() {
            var ss = new SaveSystem();
            ss.deleteSave();
            self.cameras.main.fadeOut(500, 0, 0, 0);
            self.cameras.main.once('camerafadeoutcomplete', function() {
                self.scene.start('MenuScene');
            });
        });
    }
}
