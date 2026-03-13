const WEAPONS = {
    PISTOL: { name: 'Pistol', damage: 10, fireRate: 300, speedMod: 1.0, texture: 'gun' },
    MAGNUM: { name: 'Magnum', damage: 35, fireRate: 600, speedMod: 1.0, texture: 'silencer' },
    MACHINE: { name: 'Machinegun', damage: 6, fireRate: 100, speedMod: 0.7, texture: 'machine' }
};

export default class GameScene extends Phaser.Scene {
    constructor() { super('GameScene'); }

    init(data) {
        this.isCoop = data.isCoop;
        this.registry.set('isCoop', this.isCoop);
        
        // --- VARIABILE CORE ---
        this.score = 0; 
        this.wave = 1;
        this.isPaused = false; 
        
        // --- VARIABILE EXTRA ---
        this.bossTimer = 30; 
        this.baseSpawnRate = 4000; 
        this.isShowdown = false; 
    }

    preload() {
        // Totul e incarcat deja in StartScene, deci asta ramane gol
    }

    // =====================================================================
    // 1) CORE REQUIREMENTS 
    // =====================================================================
    
    create() {
        this.sound.stopAll();
        this.bgMusic = this.sound.add('music_game', { loop: true, volume: 0.3 });
        this.bgMusic.play();

        this.add.tileSprite(-50, -50, this.scale.width + 100, this.scale.height + 100, 'bg').setOrigin(0, 0).setTint(0x777777);
        
        this.speed = 250; 
        this.p1Spawn = { x: 200, y: this.scale.height / 2 };
        this.p2Spawn = { x: this.scale.width - 200, y: this.scale.height / 2 };

        this.player1 = this.physics.add.sprite(this.p1Spawn.x, this.p1Spawn.y, 'player1_gun').setScale(0.5);
        this.initPlayer(this.player1, 1);
        this.bulletsP1 = this.physics.add.group();
        this.keysP1 = this.input.keyboard.addKeys('W,A,S,D');
        this.shootKeyP1 = this.input.keyboard.addKey('F');

        if (this.isCoop) {
            this.player2 = this.physics.add.sprite(this.p2Spawn.x, this.p2Spawn.y, 'player2_gun').setScale(0.5); 
            this.player2.setTint(0xaaaaff); 
            this.initPlayer(this.player2, 2);
            this.bulletsP2 = this.physics.add.group();
            this.keysP2 = this.input.keyboard.createCursorKeys();
            this.shootKeyP2 = this.input.keyboard.addKey('SPACE');

            this.physics.add.collider(this.player1, this.player2);
            this.physics.add.overlap(this.player1, this.bulletsP2, this.hitPlayerWithBullet, null, this);
            this.physics.add.overlap(this.player2, this.bulletsP1, this.hitPlayerWithBullet, null, this);
        }

        this.aiZombies = this.physics.add.group(); 
        
        this.physics.add.overlap(this.aiZombies, this.bulletsP1, this.hitAIZombie, null, this);
        this.physics.add.overlap(this.player1, this.aiZombies, this.zombieHitPlayer, null, this);
        if (this.isCoop) {
            this.physics.add.overlap(this.aiZombies, this.bulletsP2, this.hitAIZombie, null, this);
            this.physics.add.overlap(this.player2, this.aiZombies, this.zombieHitPlayer, null, this);
        }

        this.input.keyboard.on('keydown-P', this.togglePause, this);

        this.initExtraFeatures(); 
    }

    update(time) {
        if (this.isPaused) return; 

        this.handlePlayerMovement(this.player1, this.keysP1, 'W', 'S', 'A', 'D', this.shootKeyP1, this.bulletsP1, time);
        if (this.isCoop) this.handlePlayerMovement(this.player2, this.keysP2, 'up', 'down', 'left', 'right', this.shootKeyP2, this.bulletsP2, time);

        this.aiZombies.getChildren().forEach(zombie => {
            let target = this.getClosestLivingPlayer(zombie);
            if (target) {
                let dist = Phaser.Math.Distance.Between(zombie.x, zombie.y, target.x, target.y);
                if (dist > 20) {
                    let zSpeed = zombie.baseSpeed + (this.wave * 5); 
                    this.physics.moveToObject(zombie, target, zSpeed); 
                } else {
                    zombie.body.setVelocity(0, 0); 
                }
                zombie.setRotation(Phaser.Math.Angle.Between(zombie.x, zombie.y, target.x, target.y));
            } else {
                zombie.body.setVelocity(0, 0); 
            }
        });

        this.updateExtraUI(time);
    }

    initPlayer(player, id) {
        player.body.setCollideWorldBounds(true);
        player.hp = 100;
        player.maxHp = 100; 
        player.isZombie = false;
        player.id = id;
        player.lastMeleeHit = 0;
        player.lastDir = { x: id===1?1:-1, y: 0 };  
        player.lastFired = 0;
        player.currentWeapon = WEAPONS.PISTOL; 
        player.hasSpeedBoost = false; 
        
        player.lastBite = 0;
        player.biteCooldown = 3000; 
    }

    handlePlayerMovement(player, keys, up, down, left, right, shootKey, bulletGroup, time) {
        if (!player.active) return;

        let vx = 0; let vy = 0;
        if (keys[left].isDown) vx = -1;
        else if (keys[right].isDown) vx = 1;
        if (keys[up].isDown) vy = -1;
        else if (keys[down].isDown) vy = 1;

        let currentSpeed = this.speed;
        if (player.isZombie) {
            currentSpeed = this.speed * 1.1; 
        } else {
            currentSpeed = this.speed * player.currentWeapon.speedMod;
            if (player.hasSpeedBoost) currentSpeed *= 1.5; 
        }

        player.body.setVelocity(vx * currentSpeed, vy * currentSpeed);

        if (vx !== 0 || vy !== 0) {
            player.lastDir = { x: vx, y: vy };
            player.setRotation(Phaser.Math.Angle.Between(0, 0, vx, vy));
        }

        if (shootKey.isDown) {
            if (player.isZombie) {
                if (time > player.lastBite + player.biteCooldown) {
                    this.executeZombieBite(player, time);
                }
            } else {
                if (time > player.lastFired) {
                    this.shootBullet(player, bulletGroup);
                    player.lastFired = time + player.currentWeapon.fireRate; 
                }
            }
        }
    }

    shootBullet(player, bulletGroup) {
        let bullet = this.physics.add.sprite(player.x, player.y, 'bullet').setScale(0.8); 
        bulletGroup.add(bullet);
        bullet.damage = player.currentWeapon.damage; 
        let bulletSpeed = 900;
        bullet.body.setVelocity(player.lastDir.x * bulletSpeed, player.lastDir.y * bulletSpeed);
        bullet.setRotation(player.rotation);
        
        let shootVol = 0.5; 
        if (player.currentWeapon.texture === 'silencer') shootVol = 1.0; 
        if (player.currentWeapon.texture === 'machine') shootVol = 0.3;  
        this.sound.play('shoot_' + player.currentWeapon.texture, { volume: shootVol });
        
        this.time.delayedCall(2000, () => { bullet.destroy(); });
    }

    executeZombieBite(attacker, time) {
        attacker.lastBite = time; 
        this.tweens.add({ targets: attacker, scaleX: 0.8, scaleY: 0.8, yoyo: true, duration: 100 });

        this.sound.play('bite', { volume: 0.8 });

        let target = attacker.id === 1 ? this.player2 : this.player1;
        if (target && !target.isZombie && target.active) {
            let dist = Phaser.Math.Distance.Between(attacker.x, attacker.y, target.x, target.y);
            if (dist < 45) {
                this.takeDamage(target, 40); 
                this.showPopup(target.x, target.y - 50, 'ZOMBIE BITE!', '#ff00ff');
                this.cameras.main.shake(100, 0.01); 
            }
        }
    }

    getClosestLivingPlayer(zombie) {
        let p1Dist = (!this.player1.isZombie) ? Phaser.Math.Distance.Between(zombie.x, zombie.y, this.player1.x, this.player1.y) : Infinity;
        if (!this.isCoop) return (!this.player1.isZombie) ? this.player1 : null;
        let p2Dist = (!this.player2.isZombie) ? Phaser.Math.Distance.Between(zombie.x, zombie.y, this.player2.x, this.player2.y) : Infinity;
        if (p1Dist === Infinity && p2Dist === Infinity) return null;
        return p1Dist < p2Dist ? this.player1 : this.player2;
    }

    takeDamage(player, amount) {
        player.hp -= amount;
        player.setTint(0xff0000); 
        this.time.delayedCall(150, () => { 
            if (player.hasSpeedBoost && !player.isZombie) player.setTint(0x00ffff);
            else if (player.isZombie) player.setTint(0x00ff00);
            else if (player.id === 2) player.setTint(0xaaaaff);
            else player.clearTint(); 
        });

        this.showPopup(player.x, player.y - 30, '-' + amount + ' HP', '#ff0000');

        if (player.hp <= 0 && !player.isZombie) {
            this.turnIntoZombie(player);
        } else if (player.hp <= 0 && player.isZombie) {
            player.destroy(); 
            this.checkGameOver();
        } else {
            if (!player.isZombie) {
                let hurtSound = player.id === 1 ? 'p1_hurt' : 'p2_hurt';
                this.sound.play(hurtSound, { volume: 0.7 });
            }
        }
    }

    hitPlayerWithBullet(player, bullet) {
        if (!player.isZombie) return;
        let dmg = bullet.damage; 
        bullet.destroy(); 
        this.takeDamage(player, dmg);
    }

    zombieHitPlayer(player, zombie) {
        let timeNow = this.time.now;
        if (!player.isZombie && timeNow > zombie.lastMeleeHit) {
            let dmg = 10;
            if (zombie.isBoss) dmg = 30;
            else if (zombie.zombieType === 2) dmg = 20; 
            this.takeDamage(player, dmg);
            zombie.lastMeleeHit = timeNow + 1000; 
        }
    }

    checkGameOver() {
        if (!this.isCoop && (this.player1.isZombie || !this.player1.active)) {
            this.scene.start('GameOverScene', { message: 'YOU ARE DEAD! Score: ' + this.score, score: this.score });
            return;
        }

        if (this.isCoop && this.isShowdown) {
            let p1Dead = !this.player1.active;
            let p2Dead = !this.player2.active;
            
            if (p1Dead || p2Dead) {
                this.scene.start('GameOverScene', { message: 'HUMAN WINS! Score: ' + this.score, score: this.score });
            } else if (this.player1.isZombie && this.player2.isZombie) {
                this.scene.start('GameOverScene', { message: 'ZOMBIE WINS! Score: ' + this.score, score: this.score });
            }
        }
    }

    // =====================================================================
    // 2) EXTRA FEATURES (Map Gen, UI, Loot, Showdown)
    // =====================================================================

    initExtraFeatures() {
        this.hpGraphics = this.add.graphics(); 
        this.obstacles = this.physics.add.staticGroup();
        this.generateNaturalMap(); 

        let cx = this.scale.width / 2;
        this.scoreText = this.add.text(cx, 30, 'SCORE: 0', { fontSize: '24px', fill: '#ffff00', stroke: '#000', strokeThickness: 4 }).setOrigin(0.5);
        this.waveText = this.add.text(cx, 65, 'WAVE: 1', { fontSize: '24px', fill: '#ff8800', stroke: '#000', strokeThickness: 4 }).setOrigin(0.5);
        this.bossText = this.add.text(cx, 95, 'BOSS IN: 30s', { fontSize: '20px', fill: '#ff0000', stroke: '#000', strokeThickness: 4 }).setOrigin(0.5);
        this.uiNameP1 = this.add.text(120, 25, 'PLAYER 1', { fontSize: '16px', fill: '#ffffff', stroke: '#000', strokeThickness: 3 }).setOrigin(0.5);
        if (this.isCoop) this.uiNameP2 = this.add.text(this.scale.width - 120, 25, 'PLAYER 2', { fontSize: '16px', fill: '#ffffff', stroke: '#000', strokeThickness: 3 }).setOrigin(0.5);
        this.pauseText = this.add.text(cx, this.scale.height / 2, 'PAUSED', { fontSize: '64px', fill: '#ffffff', stroke: '#000', strokeThickness: 6 }).setOrigin(0.5).setVisible(false).setDepth(100); 

        this.physics.add.collider(this.player1, this.obstacles);
        if (this.isCoop) this.physics.add.collider(this.player2, this.obstacles);
        
        this.physics.add.collider(this.aiZombies, this.obstacles);
        
        this.physics.add.collider(this.bulletsP1, this.obstacles, (b) => b.destroy());
        if (this.isCoop) this.physics.add.collider(this.bulletsP2, this.obstacles, (b) => b.destroy());

        this.lootItems = this.physics.add.group(); 
        this.weaponDrops = this.physics.add.group(); 
        this.energyDrinks = this.physics.add.group(); 

        this.physics.add.overlap(this.player1, this.lootItems, this.collectLoot, null, this);
        this.physics.add.overlap(this.player1, this.energyDrinks, this.collectEnergy, null, this);
        this.physics.add.overlap(this.player1, this.weaponDrops, this.collectWeapon, null, this);
        if (this.isCoop) {
            this.physics.add.overlap(this.player2, this.lootItems, this.collectLoot, null, this);
            this.physics.add.overlap(this.player2, this.energyDrinks, this.collectEnergy, null, this);
            this.physics.add.overlap(this.player2, this.weaponDrops, this.collectWeapon, null, this);
        }

        this.spawnTimer = this.time.addEvent({ delay: this.baseSpawnRate, callback: this.spawnZombie, callbackScope: this, loop: true });
        this.time.addEvent({ delay: 1000, callback: this.updateTimers, callbackScope: this, loop: true });
        
        this.time.addEvent({
            delay: 3500,
            callback: () => {
                if(this.aiZombies.countActive() > 0 && !this.isPaused) {
                    this.sound.play('zombie_idle', { volume: 0.15 });
                }
            },
            callbackScope: this,
            loop: true
        });
    }

    updateExtraUI(time) {
        this.hpGraphics.clear(); 
        if (this.player1.active) {
            this.drawHealthBar(20, 40, 200, 25, this.player1.hp, this.player1.maxHp, this.player1.isZombie ? 0x00ff00 : 0xff0000);
            if (this.player1.isZombie) this.drawCooldownBar(20, 70, 200, 8, time, this.player1);
        }
        if (this.isCoop && this.player2.active) {
            this.drawHealthBar(this.scale.width - 220, 40, 200, 25, this.player2.hp, this.player2.maxHp, this.player2.isZombie ? 0x00ff00 : 0x0088ff);
            if (this.player2.isZombie) this.drawCooldownBar(this.scale.width - 220, 70, 200, 8, time, this.player2);
        }
        this.aiZombies.getChildren().forEach(zombie => {
            let yOffset = zombie.isBoss ? 60 : 30; 
            let width = zombie.isBoss ? 100 : 40;
            this.drawHealthBar(zombie.x - width/2, zombie.y - yOffset, width, 6, zombie.hp, zombie.maxHp, 0xff0000);
        });
    }

    togglePause() {
        if (this.isShowdown) return; 
        this.isPaused = !this.isPaused;
        if (this.isPaused) {
            this.physics.pause(); 
            if (this.bgMusic) this.bgMusic.pause(); 
            this.pauseText.setVisible(true);
        } else {
            this.physics.resume();
            if (this.bgMusic) this.bgMusic.resume();
            this.pauseText.setVisible(false);
        }
    }

    showPopup(x, y, text, color) {
        let popup = this.add.text(x, y, text, { fontSize: '18px', fill: color, fontStyle: 'bold', stroke: '#000', strokeThickness: 4 }).setOrigin(0.5);
        this.tweens.add({ targets: popup, y: y - 50, alpha: 0, duration: 2500, ease: 'Power2', onComplete: () => popup.destroy() });
    }

    drawHealthBar(x, y, w, h, hp, maxHp, color) {
        if (hp <= 0) return;
        let p = Math.max(0, hp / maxHp);
        this.hpGraphics.fillStyle(0xffffff, 1).fillRect(x - 2, y - 2, w + 4, h + 4);
        this.hpGraphics.fillStyle(0x000000, 1).fillRect(x, y, w, h);
        this.hpGraphics.fillStyle(color, 1).fillRect(x, y, w * p, h);
    }

    drawCooldownBar(x, y, w, h, time, player) {
        let p = Math.min((time - player.lastBite) / player.biteCooldown, 1);
        this.hpGraphics.fillStyle(0x000000, 1).fillRect(x - 2, y - 2, w + 4, h + 4);
        this.hpGraphics.fillStyle(p >= 1 ? 0xffff00 : 0x555555, 1).fillRect(x, y, w * p, h);
    }

    generateNaturalMap() {
        let safeDist = 150; 
        for (let i = 0; i < 15; i++) {
            let x, y, isSafe;
            do {
                x = Phaser.Math.Between(150, this.scale.width - 150);
                y = Phaser.Math.Between(150, this.scale.height - 150);
                let d1 = Phaser.Math.Distance.Between(x, y, this.p1Spawn.x, this.p1Spawn.y);
                let d2 = this.isCoop ? Phaser.Math.Distance.Between(x, y, this.p2Spawn.x, this.p2Spawn.y) : 9999;
                isSafe = (d1 > safeDist && d2 > safeDist);
            } while (!isSafe);
            
            let cluster = Phaser.Math.Between(2, 4), off = 45; 
            let b = [];
            b.push(this.obstacles.create(x, y, 'box'));
            if (cluster > 1) b.push(this.obstacles.create(x + off, y, 'box'));
            if (cluster > 2) b.push(this.obstacles.create(x, y + off, 'box'));
            if (cluster > 3) b.push(this.obstacles.create(x + off/2, y + off, 'box'));

            b.forEach(box => {
                box.setScale(0.8).setRotation(Phaser.Math.FloatBetween(-0.1, 0.1)).refreshBody();
                box.body.setSize(box.width * 0.6, box.height * 0.6); 
            });
        }
    }

    updateTimers() {
        if (this.isPaused || this.isShowdown) return; 
        this.bossTimer--;
        this.bossText.setText('BOSS IN: ' + this.bossTimer + 's');
        if (this.bossTimer <= 0) {
            this.spawnBoss();
            this.wave++; 
            this.waveText.setText('WAVE: ' + this.wave);
            this.bossTimer = 45; 
            this.spawnTimer.delay = Math.max(1000, this.baseSpawnRate - (this.wave * 300)); 
        }
    }

    spawnZombie() {
        if (this.isPaused || this.isShowdown) return; 
        let x = Phaser.Math.Between(0, 1) === 0 ? -50 : this.scale.width + 50;
        let y = Phaser.Math.Between(0, this.scale.height);
        let isZ2 = Phaser.Math.Between(1, 100) <= 30; 
        let z = this.physics.add.sprite(x, y, isZ2 ? 'zombie2' : 'zombie1').setScale(0.5);
        this.aiZombies.add(z);
        z.lastMeleeHit = 0; z.isBoss = false; z.zombieType = isZ2 ? 2 : 1; 

        if (isZ2) { z.baseSpeed = 70; z.hp = z.maxHp = 50 + (this.wave * 15); } 
        else { z.baseSpeed = 100; z.hp = z.maxHp = 20 + (this.wave * 10); }

        this.sound.play('zombie_spawn', { volume: 0.3 });
    }

    spawnBoss() {
        let boss = this.physics.add.sprite(this.scale.width/2, Phaser.Math.Between(0, 1) === 0 ? -100 : this.scale.height + 100, 'zombie1').setScale(1.5); 
        boss.setTint(0xff0000); 
        this.aiZombies.add(boss);
        boss.lastMeleeHit = 0; boss.baseSpeed = 80; boss.isBoss = true;
        boss.hp = boss.maxHp = 200 * this.wave;
        this.cameras.main.flash(500, 255, 0, 0); 
        this.showPopup(this.scale.width / 2, this.scale.height / 2, 'BOSS WAVE STARTED!', '#ff0000');
        
        this.sound.play('boss_spawn', { volume: 0.8 });
    }

    dropWeaponFromBoss(x, y) {
        let w = this.physics.add.sprite(x, y, 'weapon_drop').setScale(0.8);
        w.weaponData = Phaser.Math.Between(0, 1) === 0 ? WEAPONS.MAGNUM : WEAPONS.MACHINE; 
        this.weaponDrops.add(w);
    }

    dropLoot(x, y) {
        let rand = Phaser.Math.Between(1, 100);
        if (rand <= 15) { 
            this.lootItems.add(this.physics.add.sprite(x, y, 'medkit').setScale(0.5));
        } else if (rand > 15 && rand <= 25) { 
            this.energyDrinks.add(this.physics.add.sprite(x, y, 'energy').setScale(0.5));
        }
    }

    collectWeapon(player, drop) {
        if (player.isZombie) return; 
        player.currentWeapon = drop.weaponData;
        player.setTexture((player.id === 1 ? 'player1_' : 'player2_') + player.currentWeapon.texture);
        if (player.id === 2) player.setTint(0xaaaaff);
        drop.destroy(); 
        
        player.setTint(0xffff00);
        this.time.delayedCall(200, () => { if (player.id === 2) player.setTint(0xaaaaff); else player.clearTint(); });
        this.showPopup(player.x, player.y - 30, 'GOT ' + player.currentWeapon.name.toUpperCase() + '!', '#ffff00');
        
        this.sound.play('reload', { volume: 0.7 });
    }

    collectLoot(player, item) {
        if (player.isZombie) return; 
        
        item.destroy(); 
        player.hp = Math.min(player.hp + 30, player.maxHp); 
        player.setTint(0x00ff00);
        this.time.delayedCall(150, () => { if (player.id === 2) player.setTint(0xaaaaff); else player.clearTint(); });
        this.showPopup(player.x, player.y - 30, '+30 HP', '#00ff00');
        this.sound.play('pickup', { volume: 0.5 });
    }

    collectEnergy(player, item) {
        if (player.isZombie) return; 
        
        item.destroy();
        player.hasSpeedBoost = true;
        player.setTint(0x00ffff);
        this.showPopup(player.x, player.y - 30, 'SPEED BOOST!', '#00ffff');
        this.sound.play('pickup', { volume: 0.5 });
        
        this.time.delayedCall(4000, () => { 
            player.hasSpeedBoost = false;
            if (player.id === 2) player.setTint(0xaaaaff); 
            else player.clearTint(); 
        });
    }

    hitAIZombie(zombie, bullet) {
        let dmg = bullet.damage; 
        bullet.destroy();
        zombie.hp -= dmg; 
        zombie.setTint(0xffffff);
        this.time.delayedCall(100, () => { 
            if (zombie.active) zombie.clearTint(); 
            if (zombie.isBoss) zombie.setTint(0xff0000); 
        });

        if (zombie.hp <= 0) {
            this.dropLoot(zombie.x, zombie.y); 
            if (zombie.isBoss) {
                this.dropWeaponFromBoss(zombie.x, zombie.y); 
                this.score += 100;
            } else {
                this.score += zombie.zombieType === 2 ? 20 : 10; 
            }
            this.scoreText.setText('SCORE: ' + this.score);
            
            this.sound.play('zombie_death', { volume: 0.4 });
            zombie.destroy();
        }
    }

    startShowdown(zombiePlayer) {
        this.isShowdown = true;

        this.aiZombies.clear(true, true);
        this.lootItems.clear(true, true);
        this.weaponDrops.clear(true, true);
        this.energyDrinks.clear(true, true);
        this.spawnTimer.remove(); 

        this.waveText.setText('FINAL SHOWDOWN');
        this.waveText.setColor('#ff00ff');
        this.bossText.setText('FIGHT!!!');
        this.bossText.setColor('#ffffff');

        this.cameras.main.flash(800, 255, 0, 255); 
        
        let cx = this.scale.width / 2, cy = this.scale.height / 2;
        let p = this.add.text(cx, cy, 'PVP SHOWDOWN!', { fontSize: '80px', fill: '#ff00ff', stroke: '#000', strokeThickness: 8 }).setOrigin(0.5);
        this.tweens.add({ targets: p, scaleX: 1.5, scaleY: 1.5, alpha: 0, duration: 2000, onComplete: () => p.destroy() });

        this.bgMusic.stop();
        this.sound.play('showdown_start', { volume: 1.0 });
        this.showdownMusic = this.sound.add('music_showdown', { loop: true, volume: 0.4 });
        this.showdownMusic.play();

        this.showdownHealTimer = this.time.addEvent({
            delay: 4000, 
            callback: () => {
                let rx = Phaser.Math.Between(250, this.scale.width - 250);
                let ry = Phaser.Math.Between(250, this.scale.height - 250);
                
                if (Phaser.Math.Between(0, 1) === 0) {
                    this.lootItems.add(this.physics.add.sprite(rx, ry, 'medkit').setScale(0.5));
                } else {
                    this.energyDrinks.add(this.physics.add.sprite(rx, ry, 'energy').setScale(0.5));
                }
            },
            callbackScope: this,
            loop: true
        });
    }

    turnIntoZombie(player) {
        player.isZombie = true;
        player.maxHp = 300; 
        player.hp = player.maxHp; 
        player.setTexture(player.id === 1 ? 'player1_z' : 'player2_z'); 
        player.setTint(0x00ff00); 
        player.setScale(0.65); 
        this.cameras.main.shake(300, 0.02);
        
        if (player.id === 1) this.uiNameP1.setText('P1 (ZOMBIFIED)');
        if (player.id === 2) this.uiNameP2.setText('P2 (ZOMBIFIED)');

        let deathSound = player.id === 1 ? 'p1_death' : 'p2_death';
        this.sound.play(deathSound, { volume: 0.9 });

        if (this.isCoop && !this.isShowdown) this.startShowdown(player);
        else this.checkGameOver();
    }
}