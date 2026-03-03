export default class StartScene extends Phaser.Scene {
    constructor() { super('StartScene'); }

    preload() {
        let cx = this.scale.width / 2;
        let cy = this.scale.height / 2;
        
        let loadingText = this.add.text(cx, cy, 'LOADING ASSETS...', { fontSize: '32px', fill: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5);

        this.load.image('bg', 'assets/bg.png');
        this.load.image('bullet', 'assets/bullet.png');
        this.load.image('player1_gun', 'assets/player1_gun.png'); 
        this.load.image('player1_machine', 'assets/player1_machine.png'); 
        this.load.image('player1_silencer', 'assets/player1_silencer.png'); 
        this.load.image('player2_gun', 'assets/player2_gun.png'); 
        this.load.image('player2_machine', 'assets/player2_machine.png'); 
        this.load.image('player2_silencer', 'assets/player2_silencer.png'); 
        this.load.image('player1_z', 'assets/player1_z.png');
        this.load.image('player2_z', 'assets/player2_z.png');
        this.load.image('zombie1', 'assets/zombie1.png'); 
        this.load.image('zombie2', 'assets/zombie2.png'); 
        this.load.image('box', 'assets/box.png'); 
        this.load.image('medkit', 'assets/medkit.png'); 
        this.load.image('energy', 'assets/energy.png'); 
        this.load.image('weapon_drop', 'assets/weapon_drop.png'); 

        this.load.audio('music_menu', 'assets/audio/music_menu.mp3');
        this.load.audio('music_game', 'assets/audio/music_game.mp3');
        this.load.audio('music_showdown', 'assets/audio/music_showdown.mp3');
        this.load.audio('shoot_gun', 'assets/audio/shoot_gun.mp3');
        this.load.audio('shoot_silencer', 'assets/audio/shoot_silencer.mp3');
        this.load.audio('shoot_machine', 'assets/audio/shoot_machine.mp3');
        this.load.audio('reload', 'assets/audio/reload.mp3');
        this.load.audio('pickup', 'assets/audio/pickup.mp3');
        this.load.audio('ui_click', 'assets/audio/ui_click.mp3'); 
        this.load.audio('p1_hurt', 'assets/audio/p1_hurt.mp3');
        this.load.audio('p1_death', 'assets/audio/p1_death.mp3');
        this.load.audio('p2_hurt', 'assets/audio/p2_hurt.mp3');
        this.load.audio('p2_death', 'assets/audio/p2_death.mp3');
        this.load.audio('zombie_spawn', 'assets/audio/zombie_spawn.mp3');
        this.load.audio('zombie_idle', 'assets/audio/zombie_idle.mp3');
        this.load.audio('zombie_death', 'assets/audio/zombie_death.mp3');
        this.load.audio('boss_spawn', 'assets/audio/boss_spawn.mp3');
        this.load.audio('bite', 'assets/audio/bite.mp3');
        this.load.audio('showdown_start', 'assets/audio/showdown_start.mp3');

        // Cand s-au terminat de descarcat toate:
        this.load.on('complete', () => {
            loadingText.destroy();
            this.createStartScreen(cx, cy);
        });
    }

    createStartScreen(cx, cy) {
        this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x222222).setOrigin(0,0);
        
        this.startBtnText = this.add.text(cx, cy, '[ CLICK TO START ]', { 
            fontSize: '36px', fill: '#ffff00', fontStyle: 'bold' 
        }).setOrigin(0.5);

        this.input.once('pointerdown', () => {
            this.startBtnText.destroy(); 
            this.startMenuMusic();       
            this.drawMainMenu(cx);         
        });
    }

    startMenuMusic() {
        this.sound.stopAll();
        this.menuMusic = this.sound.add('music_menu', { loop: true, volume: 0.4 });
        this.menuMusic.play();
    }

    drawMainMenu(cx) {
        this.add.text(cx, 150, 'TWINFECTION', { fontSize: '72px', fill: '#087b08', fontStyle: 'bold', stroke: '#000000', strokeThickness: 8 }).setOrigin(0.5);
        this.add.text(cx, 300, '> Press 1 for SINGLEPLAYER <', { fontSize: '28px', fill: '#ffffff' }).setOrigin(0.5);
        this.add.text(cx, 380, '> Press 2 for CO-OP (Local) <', { fontSize: '28px', fill: '#ffffff' }).setOrigin(0.5);

        let tutorialY = 550;
        this.add.text(this.scale.width / 4, tutorialY, 'PLAYER 1 (Red)\nMovement: W, A, S, D\nAttack: F', { fontSize: '20px', fill: '#ff5555', align: 'center', stroke: '#000', strokeThickness: 3 }).setOrigin(0.5);
        this.add.text(3 * this.scale.width / 4, tutorialY, 'PLAYER 2 (Blue)\nMovement: Arrows\nAttack: SPACE', { fontSize: '20px', fill: '#5555ff', align: 'center', stroke: '#000', strokeThickness: 3 }).setOrigin(0.5);

        this.input.keyboard.once('keydown-ONE', () => {
            this.sound.play('ui_click');
            this.scene.start('GameScene', { isCoop: false });
        });

        this.input.keyboard.once('keydown-TWO', () => {
            this.sound.play('ui_click');
            this.scene.start('GameScene', { isCoop: true });
        });
    }
}