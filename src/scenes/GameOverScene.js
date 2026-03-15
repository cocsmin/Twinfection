export default class GameOverScene extends Phaser.Scene {
    constructor() {
        super('GameOverScene');
    }

    init(data) {
        this.winnerMessage = data.message || 'GAME OVER';
        this.finalScore = data.score || 0; 
    }

    preload() {
        this.load.audio('ui_click', 'assets/audio/ui_click.mp3'); 
    }

    create() {
        this.DREAMLO_PRIVATE_KEY = "VLDLMu4jDEOiqsZk63ir7gzQsR7JhCnUeLDVvQLJ8HPA"; 

        this.sound.stopAll();
        this.menuMusic = this.sound.add('music_menu', { loop: true, volume: 0.4 });
        this.menuMusic.play();

        let w = this.scale.width;
        let h = this.scale.height;

        this.add.rectangle(0, 0, w, h, 0x111111, 0.85).setOrigin(0, 0);

        this.add.text(w / 2, h / 2 - 150, 'GAME OVER', { 
            fontSize: '72px', fill: '#ff0000', fontStyle: 'bold', stroke: '#000000', strokeThickness: 8 
        }).setOrigin(0.5);

        this.add.text(w / 2, h / 2 - 50, this.winnerMessage, { 
            fontSize: '32px', fill: '#ffff00', fontStyle: 'bold', stroke: '#000', strokeThickness: 4 
        }).setOrigin(0.5);

        this.add.text(w / 2, h / 2 + 100, '> Press [ R ] to RESTART <', { fontSize: '24px', fill: '#00ff00' }).setOrigin(0.5);
        this.add.text(w / 2, h / 2 + 150, '> Press [ M ] for MENU <', { fontSize: '24px', fill: '#aaaaaa' }).setOrigin(0.5);

        // --- SISTEM DE SALVARE SCOR ---
        if (this.finalScore > 0) {

            this.time.delayedCall(500, () => {
                let playerName = window.prompt("Your score is " + this.finalScore + "!\nEnter your name for the leaderboard (no spaces):", "Player");
                
                if (playerName && playerName.trim() !== "") {
                    // Curatam numele de spatii ca sa nu crape URL-ul
                    playerName = playerName.replace(/\s+/g, '-'); 
                    this.submitScore(playerName, this.finalScore);
                }
            });
        }

        this.input.keyboard.once('keydown-R', () => {
            this.sound.play('ui_click');
            this.scene.start('GameScene', { isCoop: this.registry.get('isCoop') || false }); 
        });

        this.input.keyboard.once('keydown-M', () => {
            this.sound.play('ui_click');
            this.scene.start('StartScene');
        });
    }

    submitScore(name, score) {
        let dreamloUrl = `http://dreamlo.com/lb/${this.DREAMLO_PRIVATE_KEY}/add/${name}/${score}?t=${new Date().getTime()}`;
        let url = `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(dreamloUrl)}`;
        
        fetch(url, { cache: 'no-store' })
            .then(response => console.log("Score saved successfully via CodeTabs!"))
            .catch(error => console.error("Score save error:", error));
    }
}