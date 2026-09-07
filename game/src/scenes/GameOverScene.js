class GameOverScene extends Phaser.Scene {
    constructor() { super({ key: 'GameOverScene' }); }

    create() {
        this.cameras.main.fadeIn(800, 0, 0, 0);
        var w = GAME_W, h = GAME_H;
        var g = this.add.graphics();
        var ui = new UITheme(this);

        g.fillStyle(0x080000);
        g.fillRect(0, 0, w, h);

        for (var i = 0; i < 30; i++) {
            g.fillStyle(0x0a0000, 0.3);
            g.fillRect(0, i * 16, w, 1);
        }

        ui.panel(g, w / 2 - 180, h / 3 - 60, 360, 180, {
            borderColor: 0x662222,
            bgColor: 0x0a0000,
            glowColor: 0x441111
        });

        ui.separator(g, w / 2 - 140, h / 3 - 35, 280, { color: 0x662222, alpha: 0.5 });

        this.add.text(w / 2, h / 3 - 15, 'GAME OVER', {
            fontSize: '32px', fontFamily: '"Press Start 2P", monospace', color: '#ff2222',
            stroke: '#660000', strokeThickness: 3
        }).setOrigin(0.5);

        this.add.text(w / 2, h / 3 + 25, 'Tu grupo ha caido...', {
            fontSize: '18px', fontFamily: '"VT323", monospace', color: '#886666'
        }).setOrigin(0.5);

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
