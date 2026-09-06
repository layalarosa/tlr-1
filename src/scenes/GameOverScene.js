class GameOverScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameOverScene' });
    }

    create() {
        const w = this.cameras.main.width;
        const h = this.cameras.main.height;

        this.add.graphics()
            .fillStyle(0x110000)
            .fillRect(0, 0, w, h);

        this.add.text(w / 2, h / 3, 'GAME OVER', {
            fontSize: '48px', fontFamily: 'monospace', color: '#ff2222', fontStyle: 'bold'
        }).setOrigin(0.5);

        this.add.text(w / 2, h / 3 + 60, 'Tu grupo ha caído en Las Fauces...', {
            fontSize: '16px', fontFamily: 'monospace', color: '#888888'
        }).setOrigin(0.5);

        const menuBtn = this.add.text(w / 2, h / 2 + 40, '[ Menú Principal ]', {
            fontSize: '20px', fontFamily: 'monospace', color: '#ffffff'
        }).setOrigin(0.5).setInteractive();

        menuBtn.on('pointerover', () => menuBtn.setColor('#ffaa44'));
        menuBtn.on('pointerout', () => menuBtn.setColor('#ffffff'));
        menuBtn.on('pointerdown', () => {
            const saveSystem = new SaveSystem();
            saveSystem.deleteSave();
            this.scene.start('MenuScene');
        });
    }
}
