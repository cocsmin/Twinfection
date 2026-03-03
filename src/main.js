import StartScene from './scenes/StartScene.js'; 
import GameScene from './scenes/GameScene.js';
import GameOverScene from './scenes/GameOverScene.js';

const config = {
    type: Phaser.AUTO,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: 1280,
        height: 720
    },
    backgroundColor: '#777777',
    physics: {
        default: 'arcade',
        arcade: {
            debug: false 
        }
    },
    scene: [StartScene, GameScene, GameOverScene] 
};

const game = new Phaser.Game(config);