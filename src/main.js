const config = {
    type: Phaser.AUTO,
    width: 640,
    height: 480,
    parent: 'game-container',
    backgroundColor: '#000000',
    pixelArt: true,
    dom: {
        createContainer: true
    },
    scene: [BootScene, MenuScene, CreatePartyScene, ExploreScene, CombatScene, GameOverScene]
};

const game = new Phaser.Game(config);
