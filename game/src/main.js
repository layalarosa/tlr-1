var GAME_W = 640;
var GAME_H = 480;

var config = {
    type: Phaser.AUTO,
    width: GAME_W,
    height: GAME_H,
    parent: 'game-container',
    backgroundColor: '#000000',
    pixelArt: true,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    scene: [BootScene, MenuScene, CreatePartyScene, ExploreScene, CombatScene, ShopScene, InventoryScene, NarrativeScene, ChoiceScene, GameOverScene]
};

var game = new Phaser.Game(config);
