class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    preload() {
        this._createPlaceholderAssets();
    }

    create() {
        this.scene.start('MenuScene');
    }

    _createPlaceholderAssets() {
        const g = this.make.graphics({ add: false });

        g.fillStyle(0x884422);
        g.fillRect(0, 0, 32, 32);
        g.generateTexture('floor_tile', 32, 32);
        g.clear();

        g.fillStyle(0x333333);
        g.fillRect(0, 0, 32, 32);
        g.generateTexture('wall_tile', 32, 32);
        g.clear();

        g.fillStyle(0x553311);
        g.fillRect(0, 0, 32, 32);
        g.generateTexture('door_tile', 32, 32);
        g.clear();

        g.fillStyle(0x666666);
        g.fillRect(0, 0, 32, 32);
        g.generateTexture('stairs_tile', 32, 32);
        g.clear();

        const enemyColors = [0xff4444, 0x44ff44, 0x4444ff, 0xffff44, 0xff44ff, 0x44ffff, 0xff8844, 0x8844ff];
        enemyColors.forEach((color, i) => {
            g.fillStyle(color);
            g.fillRect(2, 2, 28, 28);
            g.lineStyle(2, 0xffffff);
            g.strokeRect(2, 2, 28, 28);
            g.generateTexture(`enemy_${i}`, 32, 32);
            g.clear();
        });

        g.fillStyle(0x000000, 0);
        g.fillRect(0, 0, 640, 480);
        g.generateTexture('transparent', 640, 480);
    }
}
