class Platformer extends Phaser.Scene {
    constructor() {
        super("platformerScene");
    }

init() {
    this.PLAYER_SPEED = 250;
    this.physics.world.gravity.y = 1500;

    this.JUMP_VELOCITY = -430;
    this.MAX_JUMPS = 2;
    this.jumpCount = 0;

    this.PARTICLE_VELOCITY = 45;
    this.SCALE = 2.0;

    this.score = 0;
    this.winScore = 500;
    this.gameOver = false;

    this.waterIDs = [33, 53, 73];
    this.lastRelive = null;
    this.canDie = true;
}
    create() {
        this.map = this.add.tilemap("platformer-level-1");
        this.tileset = this.map.addTilesetImage("kenny_tilemap_packed", "tilemap_tiles");
        this.groundLayer = this.map.createLayer("Ground-n-Platforms", this.tileset, 0, 0);

        this.groundLayer.setCollisionByProperty({
            collides: true
        });

        this.littleCoins = this.map.createFromObjects("Objects", {
            name: "littlecoin",
            key: "tilemap_sheet",
            frame: 151
        });
        this.physics.world.enable(this.littleCoins, Phaser.Physics.Arcade.STATIC_BODY);
        this.littleCoinGroup = this.add.group(this.littleCoins);

        this.coins = this.map.createFromObjects("Objects", {
            name: "coin",
            key: "tilemap_sheet",
            frame: 151
        });

        this.coins.forEach(coin => {
            coin.setScale(1.5);
        });

        this.physics.world.enable(this.coins, Phaser.Physics.Arcade.STATIC_BODY);
        this.coinGroup = this.add.group(this.coins);

        this.relives = this.map.createFromObjects("Objects", {
            name: "relive",
            key: "tilemap_sheet",
            frame: 111
        });
        this.physics.world.enable(this.relives, Phaser.Physics.Arcade.STATIC_BODY);
        this.reliveGroup = this.add.group(this.relives);

        this.ends = this.map.createFromObjects("Objects", {
            name: "end",
            key: "tilemap_sheet",
            frame: 112
        });
        this.physics.world.enable(this.ends, Phaser.Physics.Arcade.STATIC_BODY);
        this.endGroup = this.add.group(this.ends);

        my.sprite.player = this.physics.add.sprite(50, 250, "platformer_characters", "tile_0000.png");
        my.sprite.player.setCollideWorldBounds(true);

        this.currentRespawn = {
            x: my.sprite.player.x,
            y: my.sprite.player.y
        };

        this.physics.add.collider(my.sprite.player, this.groundLayer);

        this.coinParticle = this.add.particles(0, 0, "tilemap_sheet", {
            frame: 151,
            lifespan: 500,
            speed: { min: 50, max: 140 },
            scale: { start: 0.5, end: 0 },
            alpha: { start: 1, end: 0 },
            quantity: 8,
            emitting: false
        });

        my.vfx.walking = this.add.particles(0, 0, "kenny-particles", {
            frame: ["smoke_01.png", "smoke_02.png"],
            random: true,
            scale: { start: 0.025, end: 0.075 },
            lifespan: 260,
            alpha: { start: 0.8, end: 0 },
            frequency: 90,
            quantity: 1,
            emitting: false
        });

        my.vfx.jump = this.add.particles(0, 0, "kenny-particles", {
            frame: ["star_01.png", "star_02.png"],
            random: true,
            lifespan: 450,
            speed: { min: 60, max: 140 },
            scale: { start: 0.04, end: 0 },
            alpha: { start: 1, end: 0 },
            quantity: 8,
            emitting: false
        });

        this.jumpSfx = this.sound.add("jumpSfx", { volume: 0.5 });
        this.coinSfx = this.sound.add("coinSfx", { volume: 0.5 });

this.ui = document.getElementById("description");
this.ui.style.position = "absolute";
this.ui.style.left = "20px";
this.ui.style.top = "20px";
this.ui.style.color = "white";
this.ui.style.fontSize = "24px";
this.ui.style.fontFamily = "Arial";
this.ui.style.zIndex = "9999";
this.ui.style.textShadow = "2px 2px 4px black";
this.ui.innerHTML = "Score: 0 / " + this.winScore;

        my.text.smallMessage = this.add.text(720, 80, "", {
            fontFamily: "Arial",
            fontSize: "22px",
            color: "#ffffff",
            stroke: "#000000",
            strokeThickness: 4,
            align: "center"
        });
        my.text.smallMessage.setOrigin(0.5);
        my.text.smallMessage.setScrollFactor(0);
        my.text.smallMessage.setDepth(1000);

        my.text.message = this.add.text(720, 350, "", {
            fontFamily: "Arial",
            fontSize: "46px",
            color: "#ffff00",
            stroke: "#000000",
            strokeThickness: 6,
            align: "center"
        });
        my.text.message.setOrigin(0.5);
        my.text.message.setScrollFactor(0);
        my.text.message.setDepth(1000);

        this.physics.add.overlap(my.sprite.player, this.littleCoinGroup, (player, coin) => {
            this.collectCoin(coin, 5);
        });

        this.physics.add.overlap(my.sprite.player, this.coinGroup, (player, coin) => {
            this.collectCoin(coin, 10);
        });

        this.physics.add.overlap(my.sprite.player, this.reliveGroup, (player, flag) => {
            this.saveRelive(flag);
        });

        this.physics.add.overlap(my.sprite.player, this.endGroup, () => {
            this.tryEndGame();
        });

        cursors = this.input.keyboard.createCursorKeys();
        this.rKey = this.input.keyboard.addKey("R");

        this.input.keyboard.on("keydown-D", () => {
            this.physics.world.drawDebug = this.physics.world.drawDebug ? false : true;
            this.physics.world.debugGraphic.clear();
        }, this);

        this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
        this.physics.world.setBounds(

    0,

    0,

    this.map.widthInPixels,

    this.map.heightInPixels

);
        this.cameras.main.startFollow(my.sprite.player, true, 0.05, 0.05);
        this.cameras.main.setDeadzone(20, 20);
        this.cameras.main.setZoom(this.SCALE);
    }

    collectCoin(coin, points) {
        if (this.gameOver) return;

        this.coinParticle.emitParticleAt(coin.x, coin.y, 12);
        this.coinSfx.play();

        this.score += points;
this.ui.innerHTML = "Score: " + this.score + " / " + this.winScore;
        coin.destroy();
    }

    saveRelive(flag) {
        if (this.gameOver) return;

        if (this.lastRelive === flag) {
            return;
        }

        this.lastRelive = flag;

        this.currentRespawn = {
            x: flag.x,
            y: flag.y - 20
        };

        this.showSmallMessage("Respawn point saved!", 800);
    }

    tryEndGame() {
        if (this.gameOver) return;

        if (this.score >= this.winScore) {
            this.winGame();
        } else {
            this.showMessage("Not enough score!\nNeed " + this.winScore + " points.", 1500);
        }
    }

    winGame() {
        this.gameOver = true;

        my.sprite.player.setVelocity(0, 0);
        my.sprite.player.setAcceleration(0, 0);
        my.vfx.walking.stop();

        my.text.message.setText("Congratulations!\nYOU WIN!\nPress R to Restart");

        this.physics.pause();
    }

respawnPlayer() {
    if (this.gameOver || !this.canDie) return;

    this.canDie = false;

    my.sprite.player.setPosition(
        this.currentRespawn.x,
        this.currentRespawn.y - 30
    );

    my.sprite.player.setVelocity(0, 0);
    my.sprite.player.setAcceleration(0, 0);

    this.jumpCount = 0;

    this.showSmallMessage("You fell into water!", 800);

    this.time.delayedCall(700, () => {
        this.canDie = true;
    });
}
    showMessage(text, duration) {
        if (this.gameOver) return;

        my.text.message.setText(text);

        this.time.delayedCall(duration, () => {
            if (!this.gameOver) {
                my.text.message.setText("");
            }
        });
    }

    showSmallMessage(text, duration) {
        if (this.gameOver) return;

        my.text.smallMessage.setText(text);

        this.time.delayedCall(duration, () => {
            if (!this.gameOver) {
                my.text.smallMessage.setText("");
            }
        });
    }

checkWaterDeath() {
    let player = my.sprite.player;

    let tile = this.groundLayer.getTileAtWorldXY(
        player.x,
        player.y + player.displayHeight / 2
    );

    let waterIDs = [33, 53, 73, 34, 54, 74];

    if (tile && waterIDs.includes(tile.index)) {
        this.respawnPlayer();
    }

    if (player.y > this.map.heightInPixels + 50) {
        this.respawnPlayer();
    }
}

    update() {
        if (Phaser.Input.Keyboard.JustDown(this.rKey)) {
            this.physics.resume();
            this.scene.restart();
            return;
        }

        if (this.gameOver) {
            return;
        }

        let onGround = my.sprite.player.body.blocked.down;

        if (onGround) {
            this.jumpCount = 0;
        }

if (cursors.left.isDown) {

    my.sprite.player.setVelocityX(-this.PLAYER_SPEED);

    my.sprite.player.resetFlip();
    my.sprite.player.anims.play("walk", true);

    my.vfx.walking.startFollow(
        my.sprite.player,
        my.sprite.player.displayWidth / 2 - 8,
        my.sprite.player.displayHeight / 2 - 4,
        false
    );

    my.vfx.walking.setParticleSpeed(this.PARTICLE_VELOCITY, 0);

    if (onGround) {
        my.vfx.walking.start();
    }

} else if (cursors.right.isDown) {

    my.sprite.player.setVelocityX(this.PLAYER_SPEED);

    my.sprite.player.setFlip(true, false);
    my.sprite.player.anims.play("walk", true);

    my.vfx.walking.startFollow(
        my.sprite.player,
        -my.sprite.player.displayWidth / 2 + 8,
        my.sprite.player.displayHeight / 2 - 4,
        false
    );

    my.vfx.walking.setParticleSpeed(-this.PARTICLE_VELOCITY, 0);

    if (onGround) {
        my.vfx.walking.start();
    }

} else {

    my.sprite.player.setVelocityX(0);

    my.sprite.player.anims.play("idle");

    my.vfx.walking.stop();
}

        if (Phaser.Input.Keyboard.JustDown(cursors.up) && this.jumpCount < this.MAX_JUMPS) {
            my.sprite.player.body.setVelocityY(this.JUMP_VELOCITY);
            this.jumpCount++;

            this.jumpSfx.play();

            my.vfx.jump.emitParticleAt(
                my.sprite.player.x,
                my.sprite.player.y + my.sprite.player.displayHeight / 2,
                10
            );
        }

        if (!onGround) {
            my.sprite.player.anims.play("jump");
        }

        this.checkWaterDeath();
    }
}