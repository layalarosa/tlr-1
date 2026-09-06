class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    create() {
        this.saveSystem = new SaveSystem();
        this.menuUI = new MenuUI(this);

        const self = this;
        this.menuUI.showMainMenu(
            function() { self._newGame(); },
            function() { self._continueGame(); },
            function() { self._showSettings(); }
        );
    }

    _newGame() {
        this.scene.start('CreatePartyScene');
    }

    _continueGame() {
        const save = this.saveSystem.load();
        if (save) {
            this.scene.start('ExploreScene', { saveData: save });
        } else {
            this._showMessage('No hay partida guardada');
        }
    }

    _showSettings() {
        this._showMessage('Opciones - Proximamente');
    }

    _showMessage(msg) {
        const w = this.cameras.main.width;
        const h = this.cameras.main.height;
        const text = this.add.text(w / 2, h / 2, msg, {
            fontSize: '20px',
            fontFamily: 'monospace',
            color: '#ffffff',
            backgroundColor: '#222244',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5);

        this.time.delayedCall(2000, function() { text.destroy(); });
    }
}
