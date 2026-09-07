class MenuUI {
    constructor(scene) {
        this.scene = scene;
        this.container = null;
        this.active = false;
    }

    showMainMenu(onNewGame, onContinue, onSettings) {
        this.active = true;
        const w = this.scene.cameras.main.width;
        const h = this.scene.cameras.main.height;
        const scene = this.scene;

        this.container = scene.add.container(0, 0);

        const bg = scene.add.graphics();
        bg.fillStyle(0x000011, 0.95);
        bg.fillRect(0, 0, w, h);
        this.container.add(bg);

        const title = scene.add.text(w / 2, 80, 'THE LAST RIDERS', {
            fontSize: '28px',
            fontFamily: '"Press Start 2P", monospace',
            color: '#ff4444',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        this.container.add(title);

        const subtitle = scene.add.text(w / 2, 140, 'Dungeon Crawler RPG', {
            fontSize: '20px',
            fontFamily: '"VT323", monospace',
            color: '#888888'
        }).setOrigin(0.5);
        this.container.add(subtitle);

        const self = this;

        var buttons = [
            { text: '1 - Nueva Partida', y: 250, action: onNewGame },
            { text: '2 - Continuar', y: 310, action: onContinue },
            { text: '3 - Opciones', y: 370, action: onSettings }
        ];

        buttons.forEach(function(btn) {
            const bg2 = scene.add.graphics();
            bg2.fillStyle(0x222244, 1);
            bg2.fillRoundedRect(w / 2 - 120, btn.y - 20, 240, 40, 8);
            bg2.lineStyle(2, 0x4444aa);
            bg2.strokeRoundedRect(w / 2 - 120, btn.y - 20, 240, 40, 8);
            self.container.add(bg2);

            const text = scene.add.text(w / 2, btn.y, btn.text, {
                fontSize: '22px',
                fontFamily: '"VT323", monospace',
                color: '#ffffff'
            }).setOrigin(0.5);
            self.container.add(text);

            const hitArea = scene.add.zone(w / 2, btn.y, 240, 40).setInteractive();
            hitArea.on('pointerover', function() { text.setColor('#ffaa44'); });
            hitArea.on('pointerout', function() { text.setColor('#ffffff'); });
            hitArea.on('pointerdown', function() {
                self.hide();
                btn.action();
            });
            self.container.add(hitArea);
        });

        const hint = scene.add.text(w / 2, 440, 'Tecla 1, 2, 3 o click para seleccionar', {
            fontSize: '14px',
            fontFamily: '"Share Tech Mono", monospace',
            color: '#555566'
        }).setOrigin(0.5);
        self.container.add(hint);

        const keys = scene.input.keyboard.addKeys('ONE,TWO,THREE');
        keys.ONE.on('down', function() { self.hide(); onNewGame(); });
        keys.TWO.on('down', function() { self.hide(); onContinue(); });
        keys.THREE.on('down', function() { self.hide(); onSettings(); });
    }

    hide() {
        if (this.container) {
            this.container.destroy();
            this.container = null;
        }
        this.active = false;
    }
}
