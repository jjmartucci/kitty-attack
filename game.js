const TILE_SIZE = 48;
const GRID_WIDTH = 10;
const GRID_HEIGHT = 12;
const UI_HEIGHT = 40;
const GAME_WIDTH = GRID_WIDTH * TILE_SIZE;
const GAME_HEIGHT = GRID_HEIGHT * TILE_SIZE + UI_HEIGHT;
const ROUND_DURATION = 60;
const MOVE_DURATION = 150;

class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    preload() {
        this.load.audio('soundtrack', 'assets/Pixel Paws Parade.mp3');
    }

    create() {
        this.score = 0;
        this.timeLeft = ROUND_DURATION;
        this.gameOver = false;
        this.mice = [];
        this.dogs = [];
        this.birds = [];
        this.birdsSpawned = 0;

        this.drawGrid();
        this.createCat();
        this.setupControls();
        this.setupUI();
        this.setupTimers();

        // Start the soundtrack
        this.music = this.sound.add('soundtrack', { loop: true, volume: 0.5 });
        this.music.play();
    }

    gridToPixelX(gridX) {
        return gridX * TILE_SIZE + TILE_SIZE / 2;
    }

    gridToPixelY(gridY) {
        return gridY * TILE_SIZE + TILE_SIZE / 2 + UI_HEIGHT;
    }

    animateSprite(sprite, duration, onUpdate, onComplete) {
        const targetX = this.gridToPixelX(sprite.gridX);
        const targetY = this.gridToPixelY(sprite.gridY);

        if (sprite.tween) {
            sprite.tween.stop();
        }

        sprite.tween = this.tweens.add({
            targets: sprite,
            visualX: targetX,
            visualY: targetY,
            duration: duration,
            ease: 'Power2',
            onUpdate: onUpdate,
            onComplete: onComplete
        });
    }

    drawGrid() {
        const graphics = this.add.graphics();
        // UI background bar
        graphics.fillStyle(0x333333);
        graphics.fillRect(0, 0, GAME_WIDTH, UI_HEIGHT);
        // Grid tiles
        for (let x = 0; x < GRID_WIDTH; x++) {
            for (let y = 0; y < GRID_HEIGHT; y++) {
                const color = (x + y) % 2 === 0 ? 0xC49A9A : 0xB08585;
                graphics.fillStyle(color);
                graphics.fillRect(x * TILE_SIZE, y * TILE_SIZE + UI_HEIGHT, TILE_SIZE, TILE_SIZE);
            }
        }
    }

    createCat() {
        const startX = Phaser.Math.Between(2, GRID_WIDTH - 3);
        const startY = Phaser.Math.Between(2, GRID_HEIGHT - 3);

        // Rainbow trail graphics (drawn behind cat)
        this.rainbowTrail = this.add.graphics();
        this.trailHistory = [];
        this.rainbowColors = [0xFF0000, 0xFF7F00, 0xFFFF00, 0x00FF00, 0x0000FF, 0x8B00FF];

        this.cat = this.add.graphics();
        this.cat.gridX = startX;
        this.cat.gridY = startY;
        this.cat.visualX = this.gridToPixelX(startX);
        this.cat.visualY = this.gridToPixelY(startY);
        this.drawCat();
    }

    drawCat() {
        this.cat.clear();
        const x = this.cat.visualX;
        const y = this.cat.visualY;

        // Cat body
        this.cat.fillStyle(0xFFA500);
        this.cat.fillCircle(x, y, TILE_SIZE / 2.5);

        // Ears
        this.cat.fillTriangle(
            x - 15, y - 12,
            x - 8, y - 22,
            x - 2, y - 12
        );
        this.cat.fillTriangle(
            x + 15, y - 12,
            x + 8, y - 22,
            x + 2, y - 12
        );

        // Eyes
        this.cat.fillStyle(0x000000);
        this.cat.fillCircle(x - 6, y - 3, 3);
        this.cat.fillCircle(x + 6, y - 3, 3);

        // Nose
        this.cat.fillStyle(0xFF69B4);
        this.cat.fillTriangle(x, y + 2, x - 4, y + 7, x + 4, y + 7);

        // Whiskers
        this.cat.lineStyle(1, 0x000000);
        this.cat.lineBetween(x - 8, y + 5, x - 18, y + 3);
        this.cat.lineBetween(x - 8, y + 7, x - 18, y + 8);
        this.cat.lineBetween(x + 8, y + 5, x + 18, y + 3);
        this.cat.lineBetween(x + 8, y + 7, x + 18, y + 8);
    }

    createMouse(fromSide) {
        const mouse = this.add.graphics();
        mouse.fromSide = fromSide;

        if (fromSide) {
            mouse.gridX = -1;
            mouse.gridY = Phaser.Math.Between(0, GRID_HEIGHT - 1);
            mouse.dirX = 1;
            mouse.dirY = 0;
        } else {
            mouse.gridX = Phaser.Math.Between(0, GRID_WIDTH - 1);
            mouse.gridY = -1;
            mouse.dirX = 0;
            mouse.dirY = 1;
        }

        mouse.visualX = this.gridToPixelX(mouse.gridX);
        mouse.visualY = this.gridToPixelY(mouse.gridY);
        this.drawMouse(mouse);
        this.mice.push(mouse);
    }

    drawMouse(mouse) {
        mouse.clear();
        const x = mouse.visualX;
        const y = mouse.visualY;

        // Mouse body
        mouse.fillStyle(0x808080);
        mouse.fillEllipse(x, y, TILE_SIZE / 2, TILE_SIZE / 3);

        // Ears
        mouse.fillStyle(0xFFC0CB);
        mouse.fillCircle(x - 8, y - 8, 5);
        mouse.fillCircle(x + 8, y - 8, 5);

        // Eyes
        mouse.fillStyle(0x000000);
        mouse.fillCircle(x - 4, y - 2, 2);
        mouse.fillCircle(x + 4, y - 2, 2);

        // Nose
        mouse.fillStyle(0xFF69B4);
        mouse.fillCircle(x, y + 3, 2);

        // Tail
        mouse.lineStyle(2, 0x808080);
        mouse.lineBetween(x + 12, y, x + 22, y - 5);
    }

    createDog() {
        const dog = this.add.graphics();
        const side = Phaser.Math.Between(0, 3);

        switch (side) {
            case 0: // Left
                dog.gridX = -1;
                dog.gridY = Phaser.Math.Between(0, GRID_HEIGHT - 1);
                dog.mainDir = { x: 1, y: 0 };
                dog.zigDir = Phaser.Math.Between(0, 1) ? 1 : -1;
                break;
            case 1: // Right
                dog.gridX = GRID_WIDTH;
                dog.gridY = Phaser.Math.Between(0, GRID_HEIGHT - 1);
                dog.mainDir = { x: -1, y: 0 };
                dog.zigDir = Phaser.Math.Between(0, 1) ? 1 : -1;
                break;
            case 2: // Top
                dog.gridX = Phaser.Math.Between(0, GRID_WIDTH - 1);
                dog.gridY = -1;
                dog.mainDir = { x: 0, y: 1 };
                dog.zigDir = Phaser.Math.Between(0, 1) ? 1 : -1;
                break;
            case 3: // Bottom
                dog.gridX = Phaser.Math.Between(0, GRID_WIDTH - 1);
                dog.gridY = GRID_HEIGHT;
                dog.mainDir = { x: 0, y: -1 };
                dog.zigDir = Phaser.Math.Between(0, 1) ? 1 : -1;
                break;
        }

        dog.moveCount = 0;
        dog.visualX = this.gridToPixelX(dog.gridX);
        dog.visualY = this.gridToPixelY(dog.gridY);
        this.drawDog(dog);
        this.dogs.push(dog);
    }

    drawDog(dog) {
        dog.clear();
        const x = dog.visualX;
        const y = dog.visualY;

        // Floppy ears (behind head)
        dog.fillStyle(0x8B4513);
        dog.fillEllipse(x - 16, y + 2, 10, 16);
        dog.fillEllipse(x + 16, y + 2, 10, 16);

        // Head
        dog.fillStyle(0xD2691E);
        dog.fillCircle(x, y - 2, TILE_SIZE / 2.5);

        // Snout/muzzle
        dog.fillStyle(0xDEB887);
        dog.fillEllipse(x, y + 8, 14, 10);

        // Snout top (fur color)
        dog.fillStyle(0xD2691E);
        dog.fillEllipse(x, y + 4, 10, 6);

        // Eyes (whites)
        dog.fillStyle(0xFFFFFF);
        dog.fillCircle(x - 7, y - 5, 5);
        dog.fillCircle(x + 7, y - 5, 5);

        // Pupils
        dog.fillStyle(0x000000);
        dog.fillCircle(x - 6, y - 4, 3);
        dog.fillCircle(x + 8, y - 4, 3);

        // Eyebrows (angry look)
        dog.lineStyle(2, 0x5D3A1A);
        dog.lineBetween(x - 12, y - 12, x - 4, y - 10);
        dog.lineBetween(x + 12, y - 12, x + 4, y - 10);

        // Nose
        dog.fillStyle(0x1a1a1a);
        dog.fillRoundedRect(x - 5, y + 6, 10, 8, 3);

        // Nostrils
        dog.fillStyle(0x000000);
        dog.fillCircle(x - 2, y + 10, 1.5);
        dog.fillCircle(x + 2, y + 10, 1.5);

        // Mouth
        dog.lineStyle(2, 0x000000);
        dog.lineBetween(x, y + 14, x, y + 17);
        dog.lineBetween(x - 6, y + 17, x, y + 17);
        dog.lineBetween(x + 6, y + 17, x, y + 17);

        // Tongue
        dog.fillStyle(0xFF6B8A);
        dog.fillEllipse(x, y + 20, 5, 4);
    }

    createBird() {
        if (this.birdsSpawned >= 2) return;
        this.birdsSpawned++;

        const bird = this.add.graphics();

        // Birds travel across screen like mice (left-to-right or top-to-bottom)
        // but move in a circular loop pattern while doing so
        const fromSide = Phaser.Math.Between(0, 1) === 0;

        if (fromSide) {
            // Horizontal travel (left to right)
            bird.gridX = -1;
            bird.gridY = Phaser.Math.Between(3, GRID_HEIGHT - 4);
            // Circular pattern while moving right: right, down, right, up
            bird.directions = [
                { x: 1, y: 0 },   // right
                { x: 0, y: 1 },   // down
                { x: 1, y: 0 },   // right
                { x: 0, y: -1 }   // up
            ];
            bird.exitCheck = () => bird.gridX > GRID_WIDTH;
        } else {
            // Vertical travel (top to bottom)
            bird.gridX = Phaser.Math.Between(3, GRID_WIDTH - 4);
            bird.gridY = -1;
            // Circular pattern while moving down: down, right, down, left
            bird.directions = [
                { x: 0, y: 1 },   // down
                { x: 1, y: 0 },   // right
                { x: 0, y: 1 },   // down
                { x: -1, y: 0 }   // left
            ];
            bird.exitCheck = () => bird.gridY > GRID_HEIGHT;
        }

        bird.moveIndex = 0;

        bird.visualX = this.gridToPixelX(bird.gridX);
        bird.visualY = this.gridToPixelY(bird.gridY);
        this.drawBird(bird);
        this.birds.push(bird);
    }

    drawBird(bird) {
        bird.clear();
        const x = bird.visualX;
        const y = bird.visualY;

        // Bird body
        bird.fillStyle(0x4169E1);
        bird.fillEllipse(x, y, TILE_SIZE / 2.2, TILE_SIZE / 3);

        // Wing
        bird.fillStyle(0x1E90FF);
        bird.fillEllipse(x - 2, y - 5, TILE_SIZE / 3, TILE_SIZE / 5);

        // Head
        bird.fillStyle(0x4169E1);
        bird.fillCircle(x + 10, y - 2, 8);

        // Beak
        bird.fillStyle(0xFFA500);
        bird.fillTriangle(x + 18, y - 2, x + 14, y - 5, x + 14, y + 1);

        // Eye
        bird.fillStyle(0x000000);
        bird.fillCircle(x + 12, y - 4, 2);

        // Tail feathers
        bird.fillStyle(0x1E90FF);
        bird.fillTriangle(x - 14, y - 4, x - 22, y - 8, x - 18, y);
        bird.fillTriangle(x - 14, y, x - 22, y + 4, x - 18, y - 2);
    }

    setupControls() {
        // Keyboard controls
        this.cursors = this.input.keyboard.createCursorKeys();
        this.input.keyboard.on('keydown', (event) => {
            if (this.gameOver) return;

            switch (event.code) {
                case 'ArrowUp':
                    this.moveCat(0, -1);
                    break;
                case 'ArrowDown':
                    this.moveCat(0, 1);
                    break;
                case 'ArrowLeft':
                    this.moveCat(-1, 0);
                    break;
                case 'ArrowRight':
                    this.moveCat(1, 0);
                    break;
            }
        });

        // Touch controls
        const btnUp = document.getElementById('btn-up');
        const btnDown = document.getElementById('btn-down');
        const btnLeft = document.getElementById('btn-left');
        const btnRight = document.getElementById('btn-right');

        btnUp.addEventListener('click', () => !this.gameOver && this.moveCat(0, -1));
        btnDown.addEventListener('click', () => !this.gameOver && this.moveCat(0, 1));
        btnLeft.addEventListener('click', () => !this.gameOver && this.moveCat(-1, 0));
        btnRight.addEventListener('click', () => !this.gameOver && this.moveCat(1, 0));
    }

    moveCat(dx, dy) {
        const newX = this.cat.gridX + dx;
        const newY = this.cat.gridY + dy;

        if (newX >= 0 && newX < GRID_WIDTH && newY >= 0 && newY < GRID_HEIGHT) {
            // Add current position to trail history before moving
            const oldPos = { x: this.cat.gridX, y: this.cat.gridY };

            // Only add if not already in trail (avoid overlaps)
            const isDuplicate = this.trailHistory.some(pos => pos.x === oldPos.x && pos.y === oldPos.y);
            if (!isDuplicate) {
                this.trailHistory.unshift(oldPos);
                // Keep only last 4 positions
                if (this.trailHistory.length > 4) {
                    this.trailHistory.pop();
                }
            }

            this.cat.gridX = newX;
            this.cat.gridY = newY;

            // Remove any trail positions that overlap with new cat position
            this.trailHistory = this.trailHistory.filter(pos => !(pos.x === newX && pos.y === newY));
            this.animateSprite(this.cat, MOVE_DURATION, () => this.drawCat());
            this.drawRainbowTrail();
            this.checkMouseCollisions();
            this.checkBirdCollisions();
            this.checkDogCollisions();
        }
    }

    drawRainbowTrail() {
        this.rainbowTrail.clear();

        const stripeHeight = TILE_SIZE / 6;

        this.trailHistory.forEach((pos, index) => {
            const x = pos.x * TILE_SIZE;
            const y = pos.y * TILE_SIZE + UI_HEIGHT;

            // Draw rainbow stripes (6 colors)
            for (let i = 0; i < 6; i++) {
                // Fade alpha based on trail position (older = more transparent)
                const alpha = 1 - (index * 0.2);
                this.rainbowTrail.fillStyle(this.rainbowColors[i], alpha);
                this.rainbowTrail.fillRect(x, y + (i * stripeHeight), TILE_SIZE, stripeHeight);
            }
        });
    }

    setupUI() {
        this.scoreText = this.add.text(10, UI_HEIGHT / 2, 'Score: 0', {
            fontSize: '18px',
            fill: '#fff'
        }).setOrigin(0, 0.5);

        this.timeText = this.add.text(GAME_WIDTH - 10, UI_HEIGHT / 2, `Time: ${this.timeLeft}`, {
            fontSize: '18px',
            fill: '#fff'
        }).setOrigin(1, 0.5);

        this.highScoreText = this.add.text(GAME_WIDTH / 2, UI_HEIGHT / 2, `High: ${this.getHighScore()}`, {
            fontSize: '18px',
            fill: '#ffff00'
        }).setOrigin(0.5, 0.5);
    }

    setupTimers() {
        // Game timer
        this.time.addEvent({
            delay: 1000,
            callback: () => {
                if (this.gameOver) return;
                this.timeLeft--;
                this.timeText.setText(`Time: ${this.timeLeft}`);
                if (this.timeLeft <= 0) {
                    this.endRound(true);
                }
            },
            loop: true
        });

        // Mouse spawner
        this.time.addEvent({
            delay: 1500,
            callback: () => {
                if (!this.gameOver) {
                    this.createMouse(Phaser.Math.Between(0, 1) === 0);
                }
            },
            loop: true
        });

        // Dog spawner
        this.time.addEvent({
            delay: 4000,
            callback: () => {
                if (!this.gameOver) {
                    this.createDog();
                }
            },
            loop: true
        });

        // Movement timer for mice
        this.time.addEvent({
            delay: 400,
            callback: () => this.moveMice(),
            loop: true
        });

        // Movement timer for dogs
        this.time.addEvent({
            delay: 500,
            callback: () => this.moveDogs(),
            loop: true
        });

        // Bird spawner - spawn 2 birds at random times during the game
        const birdSpawnTime1 = Phaser.Math.Between(5000, 25000);
        const birdSpawnTime2 = Phaser.Math.Between(30000, 50000);

        this.time.addEvent({
            delay: birdSpawnTime1,
            callback: () => {
                if (!this.gameOver) this.createBird();
            }
        });

        this.time.addEvent({
            delay: birdSpawnTime2,
            callback: () => {
                if (!this.gameOver) this.createBird();
            }
        });

        // Movement timer for birds (twice as fast as mice: 200ms vs 400ms)
        this.time.addEvent({
            delay: 200,
            callback: () => this.moveBirds(),
            loop: true
        });
    }

    moveMice() {
        if (this.gameOver) return;

        for (let i = this.mice.length - 1; i >= 0; i--) {
            const mouse = this.mice[i];
            mouse.gridX += mouse.dirX;
            mouse.gridY += mouse.dirY;

            // Remove if off screen
            if (mouse.gridX > GRID_WIDTH || mouse.gridY > GRID_HEIGHT) {
                if (mouse.tween) mouse.tween.stop();
                mouse.destroy();
                this.mice.splice(i, 1);
            } else {
                this.animateSprite(mouse, 350, () => this.drawMouse(mouse));
            }
        }

        this.checkMouseCollisions();
    }

    moveDogs() {
        if (this.gameOver) return;

        for (let i = this.dogs.length - 1; i >= 0; i--) {
            const dog = this.dogs[i];

            // Zig-zag movement: one in main direction, then one to the side
            if (dog.moveCount % 2 === 0) {
                dog.gridX += dog.mainDir.x;
                dog.gridY += dog.mainDir.y;
            } else {
                // Move perpendicular (zig-zag)
                if (dog.mainDir.x !== 0) {
                    dog.gridY += dog.zigDir;
                    // Bounce off edges
                    if (dog.gridY < 0 || dog.gridY >= GRID_HEIGHT) {
                        dog.zigDir *= -1;
                        dog.gridY = Phaser.Math.Clamp(dog.gridY, 0, GRID_HEIGHT - 1);
                    }
                } else {
                    dog.gridX += dog.zigDir;
                    // Bounce off edges
                    if (dog.gridX < 0 || dog.gridX >= GRID_WIDTH) {
                        dog.zigDir *= -1;
                        dog.gridX = Phaser.Math.Clamp(dog.gridX, 0, GRID_WIDTH - 1);
                    }
                }
            }
            dog.moveCount++;

            // Remove if off screen in main direction
            const offScreen = (dog.mainDir.x > 0 && dog.gridX > GRID_WIDTH) ||
                              (dog.mainDir.x < 0 && dog.gridX < -1) ||
                              (dog.mainDir.y > 0 && dog.gridY > GRID_HEIGHT) ||
                              (dog.mainDir.y < 0 && dog.gridY < -1);

            if (offScreen) {
                if (dog.tween) dog.tween.stop();
                dog.destroy();
                this.dogs.splice(i, 1);
            } else {
                this.animateSprite(dog, 450, () => this.drawDog(dog));
            }
        }

        this.checkDogCollisions();
    }

    moveBirds() {
        if (this.gameOver) return;

        for (let i = this.birds.length - 1; i >= 0; i--) {
            const bird = this.birds[i];

            // Move in circular pattern while traveling across screen
            const dir = bird.directions[bird.moveIndex];
            bird.gridX += dir.x;
            bird.gridY += dir.y;

            // Cycle through the 4-step circular pattern
            bird.moveIndex = (bird.moveIndex + 1) % 4;

            // Remove if exited the screen
            if (bird.exitCheck()) {
                if (bird.tween) bird.tween.stop();
                bird.destroy();
                this.birds.splice(i, 1);
            } else {
                this.animateSprite(bird, 180, () => this.drawBird(bird));
            }
        }

        this.checkBirdCollisions();
    }

    checkMouseCollisions() {
        for (let i = this.mice.length - 1; i >= 0; i--) {
            const mouse = this.mice[i];
            if (mouse.gridX === this.cat.gridX && mouse.gridY === this.cat.gridY) {
                this.score += 10;
                this.scoreText.setText(`Score: ${this.score}`);
                if (mouse.tween) mouse.tween.stop();
                mouse.destroy();
                this.mice.splice(i, 1);
            }
        }
    }

    checkDogCollisions() {
        for (const dog of this.dogs) {
            if (dog.gridX === this.cat.gridX && dog.gridY === this.cat.gridY) {
                this.endRound(false);
                return;
            }
        }
    }

    checkBirdCollisions() {
        for (let i = this.birds.length - 1; i >= 0; i--) {
            const bird = this.birds[i];
            if (bird.gridX === this.cat.gridX && bird.gridY === this.cat.gridY) {
                this.score += 30;
                this.scoreText.setText(`Score: ${this.score}`);
                if (bird.tween) bird.tween.stop();
                bird.destroy();
                this.birds.splice(i, 1);
            }
        }
    }

    endRound(completed) {
        this.gameOver = true;
        this.saveHighScore(this.score);
        this.tweens.killAll();
        if (this.music) this.music.stop();

        const message = completed ? 'Time Up!' : 'Caught by Dog!';

        const gridCenterY = UI_HEIGHT + (GRID_HEIGHT * TILE_SIZE) / 2;

        const overlay = this.add.rectangle(
            GAME_WIDTH / 2, GAME_HEIGHT / 2,
            GAME_WIDTH, GAME_HEIGHT,
            0x000000, 0.7
        );

        this.add.text(GAME_WIDTH / 2, gridCenterY - 60, message, {
            fontSize: '32px',
            fill: '#fff'
        }).setOrigin(0.5);

        this.add.text(GAME_WIDTH / 2, gridCenterY, `Final Score: ${this.score}`, {
            fontSize: '28px',
            fill: '#fff'
        }).setOrigin(0.5);

        this.add.text(GAME_WIDTH / 2, gridCenterY + 40, `High Score: ${this.getHighScore()}`, {
            fontSize: '24px',
            fill: '#ffff00'
        }).setOrigin(0.5);

        const restartBtn = this.add.text(GAME_WIDTH / 2, gridCenterY + 100, 'Play Again', {
            fontSize: '24px',
            fill: '#000',
            backgroundColor: '#4CAF50',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        restartBtn.on('pointerdown', () => {
            this.scene.restart();
        });
    }

    getHighScore() {
        return parseInt(localStorage.getItem('kittyAttackHighScore') || '0');
    }

    saveHighScore(score) {
        const currentHigh = this.getHighScore();
        if (score > currentHigh) {
            localStorage.setItem('kittyAttackHighScore', score.toString());
        }
    }
}

class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    create() {
        this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x87CEEB);

        this.add.text(GAME_WIDTH / 2, 100, '🐱 Kitty Attack 🐱', {
            fontSize: '36px',
            fill: '#FF6B6B'
        }).setOrigin(0.5);

        this.add.text(GAME_WIDTH / 2, 170, 'Catch mice for points!', {
            fontSize: '18px',
            fill: '#333'
        }).setOrigin(0.5);

        this.add.text(GAME_WIDTH / 2, 195, 'Catch rare birds for 3x points!', {
            fontSize: '18px',
            fill: '#4169E1'
        }).setOrigin(0.5);

        this.add.text(GAME_WIDTH / 2, 220, 'Avoid the dogs!', {
            fontSize: '18px',
            fill: '#333'
        }).setOrigin(0.5);

        this.add.text(GAME_WIDTH / 2, 280, 'Controls:', {
            fontSize: '20px',
            fill: '#333'
        }).setOrigin(0.5);

        this.add.text(GAME_WIDTH / 2, 310, 'Arrow keys or touch buttons', {
            fontSize: '16px',
            fill: '#666'
        }).setOrigin(0.5);

        const highScore = localStorage.getItem('kittyAttackHighScore') || '0';
        this.add.text(GAME_WIDTH / 2, 380, `High Score: ${highScore}`, {
            fontSize: '22px',
            fill: '#FFD700'
        }).setOrigin(0.5);

        const startBtn = this.add.text(GAME_WIDTH / 2, 480, 'Start Game', {
            fontSize: '28px',
            fill: '#fff',
            backgroundColor: '#4CAF50',
            padding: { x: 30, y: 15 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        startBtn.on('pointerdown', () => {
            this.scene.start('GameScene');
        });

        startBtn.on('pointerover', () => {
            startBtn.setStyle({ backgroundColor: '#45a049' });
        });

        startBtn.on('pointerout', () => {
            startBtn.setStyle({ backgroundColor: '#4CAF50' });
        });
    }
}

const config = {
    type: Phaser.AUTO,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    parent: 'game',
    backgroundColor: '#87CEEB',
    scene: [MenuScene, GameScene]
};

const game = new Phaser.Game(config);
