export default class GameOverScene extends Phaser.Scene {
    constructor() {
        super('GameOverScene');
    }

    init(data) {
        this.winnerMessage = data.message || 'GAME OVER';
    }

    preload() {
        this.load.audio('ui_click', 'assets/audio/ui_click.mp3'); 
    }

    create() {
        this.sound.stopAll();

        let w = this.scale.width;
        let h = this.scale.height;

        this.add.rectangle(0, 0, w, h, 0x111111, 0.85).setOrigin(0, 0);

        this.add.text(w / 2, h / 2 - 100, 'GAME OVER', { 
            fontSize: '72px', fill: '#ff0000', fontStyle: 'bold', stroke: '#000000', strokeThickness: 8 
        }).setOrigin(0.5);

        this.add.text(w / 2, h / 2, this.winnerMessage, { 
            fontSize: '32px', fill: '#ffff00', fontStyle: 'bold', stroke: '#000', strokeThickness: 4 
        }).setOrigin(0.5);

        this.add.text(w / 2, h / 2 + 100, '> Press [ R ] to RESTART <', { fontSize: '24px', fill: '#00ff00' }).setOrigin(0.5);
        this.add.text(w / 2, h / 2 + 150, '> Press [ M ] to go to MENIU <', { fontSize: '24px', fill: '#aaaaaa' }).setOrigin(0.5);

        this.input.keyboard.once('keydown-R', () => {
            this.sound.play('ui_click');
            this.scene.start('GameScene', { isCoop: this.registry.get('isCoop') || false }); 
        });

        this.input.keyboard.once('keydown-M', () => {
            this.sound.play('ui_click');
            this.scene.start('StartScene');
        });
    }
}