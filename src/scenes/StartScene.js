export default class StartScene extends Phaser.Scene {
    constructor() { super('StartScene'); }

    preload() {
        let cx = this.scale.width / 2;
        let cy = this.scale.height / 2;
        
        this.add.text(cx, cy, 'LOADING ASSETS...', { fontSize: '32px', fill: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5);

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
        this.load.image('player1_gun_bat', 'assets/player1_gun_bat.png'); 
        this.load.image('player1_machine_bat', 'assets/player1_machine_bat.png'); 
        this.load.image('player1_silencer_bat', 'assets/player1_silencer_bat.png'); 
        this.load.image('player2_gun_bat', 'assets/player2_gun_bat.png'); 
        this.load.image('player2_machine_bat', 'assets/player2_machine_bat.png'); 
        this.load.image('player2_silencer_bat', 'assets/player2_silencer_bat.png'); 

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
        this.load.audio('swing', 'assets/audio/swing.mp3');
    }

    create() {
        this.children.removeAll();
        this.sound.stopAll();

        let cx = this.scale.width / 2;
        let cy = this.scale.height / 2;

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
        this.DREAMLO_PUBLIC_KEY = "69b3ff7d8f40bb1b14aad333";

        this.menuUI = this.add.container(0, 0);

        let title = this.add.text(cx, 150, 'TWINFECTION', { fontSize: '72px', fill: '#00ff00', fontStyle: 'bold', stroke: '#000000', strokeThickness: 8 }).setOrigin(0.5);
        let btn1 = this.add.text(cx, 300, '> Press 1 for SINGLEPLAYER <', { fontSize: '28px', fill: '#ffffff' }).setOrigin(0.5);
        let btn2 = this.add.text(cx, 360, '> Press 2 for CO-OP (Local) <', { fontSize: '28px', fill: '#ffffff' }).setOrigin(0.5);
        
        let btnL = this.add.text(cx, 440, '> Press [ L ] to see the LEADERBOARD <', { fontSize: '24px', fill: '#ffff00' }).setOrigin(0.5);

        let tutorialY = 600;
        let tut1 = this.add.text(this.scale.width / 4, tutorialY, 'PLAYER 1 (Red)\nMovement: W, A, S, D\nShoot/Bite: F', { fontSize: '20px', fill: '#ff5555', align: 'center', stroke: '#000', strokeThickness: 3 }).setOrigin(0.5);
        let tut2 = this.add.text(3 * this.scale.width / 4, tutorialY, 'PLAYER 2 (Blue)\nMovement: Arrows\nShoot/Bite: SPACE', { fontSize: '20px', fill: '#5555ff', align: 'center', stroke: '#000', strokeThickness: 3 }).setOrigin(0.5);

        this.menuUI.add([title, btn1, btn2, btnL, tut1, tut2]);

        this.input.keyboard.on('keydown-ONE', () => {
            if(!this.showingLeaderboard) { this.sound.play('ui_click'); this.scene.start('GameScene', { isCoop: false }); }
        });

        this.input.keyboard.on('keydown-TWO', () => {
            if(!this.showingLeaderboard) { this.sound.play('ui_click'); this.scene.start('GameScene', { isCoop: true }); }
        });

        this.showingLeaderboard = false;
        this.leaderboardTexts = []; 
        
        this.input.keyboard.on('keydown-L', () => {
            if (!this.showingLeaderboard) {
                this.sound.play('ui_click');
                this.showLeaderboard(cx);
            }
        });

        this.input.keyboard.on('keydown-ESC', () => {
            if (this.showingLeaderboard) {
                this.sound.play('ui_click');
                this.hideLeaderboard();
            }
        });
    }

    showLeaderboard(cx) {
        this.showingLeaderboard = true;
        this.menuUI.setVisible(false); 

        let titleText = this.add.text(cx, 100, 'TOP 10 SURVIVORS', { fontSize: '48px', fill: '#ffff00', fontStyle: 'bold', stroke: '#000000', strokeThickness: 6 }).setOrigin(0.5);
        let loadingText = this.add.text(cx, 300, 'Loading leaderboard...', { fontSize: '24px', fill: '#aaaaaa' }).setOrigin(0.5);
        let escText = this.add.text(cx, this.scale.height - 50, '> Press [ ESC ] to return to MENU <', { fontSize: '20px', fill: '#ffffff' }).setOrigin(0.5);
        
        this.leaderboardTexts.push(titleText, loadingText, escText);

        let dreamloUrl = `http://dreamlo.com/lb/${this.DREAMLO_PUBLIC_KEY}/pipe?t=${new Date().getTime()}`;
        let url = `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(dreamloUrl)}`;

        fetch(url, { cache: 'no-store' })
            .then(response => {
                if (!response.ok) throw new Error("Network response was not ok");
                return response.text(); 
            })
            .then(text => {
                loadingText.destroy(); 

                if (!text || text.trim() === "" || text.includes("ERROR:")) {
                    this.showEmptyLeaderboardMessage(cx);
                    return;
                }

                let lines = text.trim().split('\n'); 
                let startY = 200;
                let max = Math.min(lines.length, 10);
                
                for (let i = 0; i < max; i++) {
                    let parts = lines[i].split('|'); 
                    let player = parts[0];
                    let score = parts[1];
                    
                    let entryText = this.add.text(cx, startY + (i * 40), `${i + 1}. ${player} ........... ${score} PTS`, { 
                        fontSize: '28px', fill: i === 0 ? '#00ff00' : '#ffffff', fontStyle: 'bold', stroke: '#000000', strokeThickness: 3 
                    }).setOrigin(0.5);
                    
                    this.leaderboardTexts.push(entryText);
                }
            })
            .catch(error => {
                if (loadingText && loadingText.active) {
                    loadingText.setText("Server connection error!");
                }
                console.error("Dreamlo/Proxy Error:", error);
            });
    }

    showEmptyLeaderboardMessage(cx) {
        let msg = this.add.text(cx, 300, 'Be the first one in the leaderboard!', { fontSize: '28px', fill: '#ffffff' }).setOrigin(0.5);
        this.leaderboardTexts.push(msg);
    }

    hideLeaderboard() {
        this.showingLeaderboard = false;
        this.menuUI.setVisible(true); 
        
        this.leaderboardTexts.forEach(textObj => textObj.destroy());
        this.leaderboardTexts = [];
    }
}