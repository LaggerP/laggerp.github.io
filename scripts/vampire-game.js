// ================================
// Vampire Survivors Game
// Juego estilo roguelike
// ================================

(function() {
    'use strict';

    // ================================
    // Game Constants
    // ================================
    const CANVAS_WIDTH = 30;
    const CANVAS_HEIGHT = 15;
    const PLAYER_SPEED = 0.008;  // Smooth movement (per ms)
    const ENEMY_SPEED = 0.002;   // Slower enemies
    const PROJECTILE_SPEED = 0.03; // Fast projectiles (doubled)
    const ATTACK_COOLDOWN = 350; // ms between attacks
    const PLAYER_MAX_HP = 100;
    const ENEMY_DAMAGE = 10;
    const WAVE_DURATION = 20000; // ms
    const BASE_SPAWN_RATE = 2000; // ms
    const MIN_SPAWN_RATE = 500; // ms

    // Emoji Characters (cross-platform compatible)
    const CHAR_EMPTY = '';
    const CHAR_PLAYER = '🧛';
    const CHAR_ENEMY = '🧟';
    const CHAR_PROJECTILE = '🔥';
    const CHAR_XP = '💎';

    // ================================
    // Game State
    // ================================
    let game = null;
    let vampireWindowManager = null;

    // ================================
    // Entity Classes
    // ================================

    class Entity {
        constructor(x, y, char) {
            this.x = x;
            this.y = y;
            this.char = char;
            this.active = true;
        }

        update(dt) {}

        getGridPos() {
            return {
                x: Math.floor(this.x),
                y: Math.floor(this.y)
            };
        }
    }

    class Player extends Entity {
        constructor(x, y) {
            super(x, y, CHAR_PLAYER);
            this.hp = PLAYER_MAX_HP;
            this.lastAttack = 0;
            this.lastDirection = { x: 1, y: 0 }; // Default: right
            this.invincible = false;
            this.invincibleTimer = 0;
        }

        handleInput(keys, dt) {
            let dx = 0;
            let dy = 0;

            if (keys['KeyW'] || keys['ArrowUp']) dy -= 1;
            if (keys['KeyS'] || keys['ArrowDown']) dy += 1;
            if (keys['KeyA'] || keys['ArrowLeft']) dx -= 1;
            if (keys['KeyD'] || keys['ArrowRight']) dx += 1;

            // Normalize diagonal movement
            if (dx !== 0 && dy !== 0) {
                const len = Math.sqrt(dx * dx + dy * dy);
                dx /= len;
                dy /= len;
            }

            // Update position
            this.x += dx * PLAYER_SPEED * dt;
            this.y += dy * PLAYER_SPEED * dt;

            // Clamp to bounds
            this.x = Math.max(0, Math.min(CANVAS_WIDTH - 1, this.x));
            this.y = Math.max(0, Math.min(CANVAS_HEIGHT - 1, this.y));

            // Update last direction for projectiles
            if (dx !== 0 || dy !== 0) {
                this.lastDirection = { x: dx, y: dy };
            }
        }

        update(dt) {
            // Handle invincibility frames
            if (this.invincible) {
                this.invincibleTimer -= dt;
                if (this.invincibleTimer <= 0) {
                    this.invincible = false;
                }
            }
        }

        takeDamage(amount) {
            if (this.invincible) return false;

            this.hp -= amount;
            this.invincible = true;
            this.invincibleTimer = 500; // 500ms invincibility

            return true;
        }

        canAttack(now) {
            return now - this.lastAttack >= ATTACK_COOLDOWN;
        }

        attack(now) {
            this.lastAttack = now;
            // Spawn projectile slightly ahead of player so it's immediately visible
            return new Projectile(
                this.x + this.lastDirection.x * 0.5,
                this.y + this.lastDirection.y * 0.5,
                this.lastDirection.x,
                this.lastDirection.y
            );
        }

        attackToward(now, direction) {
            this.lastAttack = now;
            return new Projectile(
                this.x,
                this.y,
                direction.x,
                direction.y
            );
        }
    }

    class Enemy extends Entity {
        constructor(x, y) {
            super(x, y, CHAR_ENEMY);
            this.hp = 1;
        }

        update(dt, player) {
            // Move towards player
            const dx = player.x - this.x;
            const dy = player.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist > 0.5) {
                this.x += (dx / dist) * ENEMY_SPEED * dt;
                this.y += (dy / dist) * ENEMY_SPEED * dt;
            }

            // Clamp to bounds
            this.x = Math.max(0, Math.min(CANVAS_WIDTH - 1, this.x));
            this.y = Math.max(0, Math.min(CANVAS_HEIGHT - 1, this.y));
        }

        takeDamage() {
            this.hp--;
            if (this.hp <= 0) {
                this.active = false;
                return true; // Enemy died
            }
            return false;
        }
    }

    class Projectile extends Entity {
        constructor(x, y, vx, vy) {
            super(x, y, CHAR_PROJECTILE);
            // Normalize velocity
            const len = Math.sqrt(vx * vx + vy * vy);
            this.vx = len > 0 ? (vx / len) * PROJECTILE_SPEED : PROJECTILE_SPEED;
            this.vy = len > 0 ? (vy / len) * PROJECTILE_SPEED : 0;
            this.lifetime = 3000; // ms - longer lifetime for better visibility
        }

        update(dt) {
            this.x += this.vx * dt;
            this.y += this.vy * dt;
            this.lifetime -= dt;

            // Deactivate if out of bounds or expired
            if (this.x < 0 || this.x >= CANVAS_WIDTH ||
                this.y < 0 || this.y >= CANVAS_HEIGHT ||
                this.lifetime <= 0) {
                this.active = false;
            }
        }
    }

    class XPGem extends Entity {
        constructor(x, y) {
            super(x, y, CHAR_XP);
            this.value = 10;
        }
    }

    // ================================
    // Main Game Class
    // ================================

    class VampireGame {
        constructor(canvasEl, hudElements) {
            this.canvas = canvasEl;
            this.hud = hudElements;

            // Game state
            this.state = 'idle'; // idle, playing, paused, gameover
            this.player = null;
            this.enemies = [];
            this.projectiles = [];
            this.xpGems = [];

            // Stats
            this.wave = 1;
            this.score = 0;
            this.waveTimer = 0;
            this.spawnTimer = 0;
            this.enemiesSpawnedThisWave = 0;

            // Input
            this.keys = {};

            // Timing
            this.lastTimestamp = 0;
            this.animationId = null;

            // Bind methods
            this.gameLoop = this.gameLoop.bind(this);
            this.handleKeyDown = this.handleKeyDown.bind(this);
            this.handleKeyUp = this.handleKeyUp.bind(this);
        }

        init() {
            // Create player at center
            this.player = new Player(
                Math.floor(CANVAS_WIDTH / 2),
                Math.floor(CANVAS_HEIGHT / 2)
            );

            // Reset state
            this.enemies = [];
            this.projectiles = [];
            this.xpGems = [];
            this.wave = 1;
            this.score = 0;
            this.waveTimer = 0;
            this.spawnTimer = 0;
            this.enemiesSpawnedThisWave = 0;
            this.keys = {};

            // Initialize grid for selective rendering
            this.initGrid();

            // Initial render
            this.render();
            this.updateHUD();
        }

        initGrid() {
            // Create grid structure once (instead of rebuilding every frame)
            this.gridCells = [];
            this.prevGrid = [];

            let html = '<div class="game-grid">';
            for (let y = 0; y < CANVAS_HEIGHT; y++) {
                html += '<div class="game-row">';
                for (let x = 0; x < CANVAS_WIDTH; x++) {
                    html += `<span class="game-cell game-empty" data-x="${x}" data-y="${y}"></span>`;
                }
                html += '</div>';
            }
            html += '</div>';

            this.canvas.innerHTML = html;

            // Store references to all cells
            for (let y = 0; y < CANVAS_HEIGHT; y++) {
                this.gridCells[y] = [];
                this.prevGrid[y] = [];
                for (let x = 0; x < CANVAS_WIDTH; x++) {
                    this.gridCells[y][x] = this.canvas.querySelector(`[data-x="${x}"][data-y="${y}"]`);
                    this.prevGrid[y][x] = { char: CHAR_EMPTY, class: 'game-empty' };
                }
            }
        }

        start() {
            if (this.state === 'playing') return;

            this.state = 'playing';
            this.lastTimestamp = performance.now();

            // Pause starfield to improve performance
            if (window.Starfield) window.Starfield.stop();

            // Add input listeners
            document.addEventListener('keydown', this.handleKeyDown);
            document.addEventListener('keyup', this.handleKeyUp);

            // Start game loop
            this.animationId = requestAnimationFrame(this.gameLoop);
        }

        pause() {
            if (this.state !== 'playing') return;

            this.state = 'paused';
            if (this.animationId) {
                cancelAnimationFrame(this.animationId);
                this.animationId = null;
            }

            // Resume starfield when game is paused
            if (window.Starfield) window.Starfield.start();
        }

        resume() {
            if (this.state !== 'paused') return;

            this.state = 'playing';
            this.lastTimestamp = performance.now();

            // Pause starfield again when resuming game
            if (window.Starfield) window.Starfield.stop();

            this.animationId = requestAnimationFrame(this.gameLoop);
        }

        gameOver() {
            this.state = 'gameover';

            if (this.animationId) {
                cancelAnimationFrame(this.animationId);
                this.animationId = null;
            }

            // Resume starfield on game over
            if (window.Starfield) window.Starfield.start();

            // Keep keydown listener for R to restart, remove keyup
            document.removeEventListener('keyup', this.handleKeyUp);

            // Show game over screen
            this.showGameOver();
        }

        reset() {
            // Remove old listener before starting (to avoid duplicates)
            document.removeEventListener('keydown', this.handleKeyDown);
            this.hideGameOver();
            this.init();
            this.start();
        }

        destroy() {
            this.state = 'idle';

            if (this.animationId) {
                cancelAnimationFrame(this.animationId);
                this.animationId = null;
            }

            // Resume starfield when game is destroyed
            if (window.Starfield) window.Starfield.start();

            document.removeEventListener('keydown', this.handleKeyDown);
            document.removeEventListener('keyup', this.handleKeyUp);
        }

        // ================================
        // Game Loop
        // ================================

        gameLoop(timestamp) {
            if (this.state !== 'playing') return;

            const dt = timestamp - this.lastTimestamp;
            this.lastTimestamp = timestamp;

            // 1. Handle input
            this.player.handleInput(this.keys, dt);

            // 2. Auto-attack (fires in player's last movement direction)
            const now = performance.now();
            if (this.player.canAttack(now)) {
                const projectile = this.player.attack(now);
                this.projectiles.push(projectile);
            }

            // 3. Update entities
            this.player.update(dt);

            this.enemies.forEach(enemy => {
                enemy.update(dt, this.player);
            });

            this.projectiles.forEach(proj => {
                proj.update(dt);
            });

            // 4. Check collisions
            this.checkCollisions();

            // 5. Wave management
            this.updateWave(dt);

            // 6. Clean up inactive entities (only if there are inactive ones)
            if (this.enemies.some(e => !e.active)) {
                this.enemies = this.enemies.filter(e => e.active);
            }
            if (this.projectiles.some(p => !p.active)) {
                this.projectiles = this.projectiles.filter(p => p.active);
            }
            if (this.xpGems.some(x => !x.active)) {
                this.xpGems = this.xpGems.filter(x => x.active);
            }

            // 7. Check game over
            if (this.player.hp <= 0) {
                this.gameOver();
                return;
            }

            // 8. Render
            this.render();
            this.updateHUD();

            // 9. Continue loop
            this.animationId = requestAnimationFrame(this.gameLoop);
        }

        // ================================
        // Collision Detection
        // ================================

        checkCollisions() {
            // Early return if no entities to check
            const activeEnemies = this.enemies.filter(e => e.active);
            const activeProjectiles = this.projectiles.filter(p => p.active);
            const activeGems = this.xpGems.filter(g => g.active);

            // Cache player position
            const px = this.player.x;
            const py = this.player.y;

            // Player vs Enemies
            for (const enemy of activeEnemies) {
                const dx = Math.abs(px - enemy.x);
                const dy = Math.abs(py - enemy.y);

                if (dx < 0.8 && dy < 0.8) {
                    if (this.player.takeDamage(ENEMY_DAMAGE)) {
                        // Knockback enemy slightly
                        const angle = Math.atan2(enemy.y - py, enemy.x - px);
                        enemy.x += Math.cos(angle) * 2;
                        enemy.y += Math.sin(angle) * 2;
                    }
                }
            }

            // Projectiles vs Enemies (skip if either array is empty)
            if (activeProjectiles.length > 0 && activeEnemies.length > 0) {
                for (const proj of activeProjectiles) {
                    if (!proj.active) continue;

                    for (const enemy of activeEnemies) {
                        if (!enemy.active) continue;

                        const dx = Math.abs(proj.x - enemy.x);
                        const dy = Math.abs(proj.y - enemy.y);

                        if (dx < 0.8 && dy < 0.8) {
                            proj.active = false;
                            if (enemy.takeDamage()) {
                                this.score += 10;
                                this.xpGems.push(new XPGem(enemy.x, enemy.y));
                            }
                            break; // Projectile hit, no need to check more enemies
                        }
                    }
                }
            }

            // Player vs XP Gems
            for (const gem of activeGems) {
                const dx = Math.abs(px - gem.x);
                const dy = Math.abs(py - gem.y);

                if (dx < 1.5 && dy < 1.5) {
                    gem.active = false;
                    this.score += gem.value;
                }
            }
        }

        // ================================
        // Wave System
        // ================================

        updateWave(dt) {
            this.waveTimer += dt;
            this.spawnTimer += dt;

            // Check for new wave
            if (this.waveTimer >= WAVE_DURATION) {
                this.wave++;
                this.waveTimer = 0;
                this.enemiesSpawnedThisWave = 0;
            }

            // Spawn enemies
            const spawnRate = Math.max(MIN_SPAWN_RATE, BASE_SPAWN_RATE - (this.wave - 1) * 150);
            const maxEnemies = 3 + (this.wave - 1) * 2;

            if (this.spawnTimer >= spawnRate && this.enemies.length < maxEnemies * 2) {
                this.spawnEnemy();
                this.spawnTimer = 0;
            }
        }

        spawnEnemy() {
            // Spawn at random edge
            const side = Math.floor(Math.random() * 4);
            let x, y;

            switch (side) {
                case 0: // Top
                    x = Math.random() * CANVAS_WIDTH;
                    y = 0;
                    break;
                case 1: // Right
                    x = CANVAS_WIDTH - 1;
                    y = Math.random() * CANVAS_HEIGHT;
                    break;
                case 2: // Bottom
                    x = Math.random() * CANVAS_WIDTH;
                    y = CANVAS_HEIGHT - 1;
                    break;
                case 3: // Left
                    x = 0;
                    y = Math.random() * CANVAS_HEIGHT;
                    break;
            }

            this.enemies.push(new Enemy(x, y));
            this.enemiesSpawnedThisWave++;
        }

        // ================================
        // Rendering
        // ================================

        render() {
            // Create current frame grid state
            const grid = [];
            for (let y = 0; y < CANVAS_HEIGHT; y++) {
                grid[y] = [];
                for (let x = 0; x < CANVAS_WIDTH; x++) {
                    grid[y][x] = { char: CHAR_EMPTY, class: 'game-empty' };
                }
            }

            // Draw XP gems
            this.xpGems.forEach(gem => {
                const pos = gem.getGridPos();
                if (pos.x >= 0 && pos.x < CANVAS_WIDTH && pos.y >= 0 && pos.y < CANVAS_HEIGHT) {
                    grid[pos.y][pos.x] = { char: gem.char, class: 'game-xp' };
                }
            });

            // Draw projectiles
            this.projectiles.forEach(proj => {
                const pos = proj.getGridPos();
                if (pos.x >= 0 && pos.x < CANVAS_WIDTH && pos.y >= 0 && pos.y < CANVAS_HEIGHT) {
                    grid[pos.y][pos.x] = { char: proj.char, class: 'game-projectile' };
                }
            });

            // Draw enemies
            this.enemies.forEach(enemy => {
                const pos = enemy.getGridPos();
                if (pos.x >= 0 && pos.x < CANVAS_WIDTH && pos.y >= 0 && pos.y < CANVAS_HEIGHT) {
                    grid[pos.y][pos.x] = { char: enemy.char, class: 'game-enemy' };
                }
            });

            // Draw player (on top)
            const playerPos = this.player.getGridPos();
            if (playerPos.x >= 0 && playerPos.x < CANVAS_WIDTH &&
                playerPos.y >= 0 && playerPos.y < CANVAS_HEIGHT) {
                // Blink when invincible
                const showPlayer = !this.player.invincible || Math.floor(performance.now() / 100) % 2 === 0;
                if (showPlayer) {
                    grid[playerPos.y][playerPos.x] = { char: this.player.char, class: 'game-player' };
                }
            }

            // Selective DOM update - only change cells that differ from previous frame
            for (let y = 0; y < CANVAS_HEIGHT; y++) {
                for (let x = 0; x < CANVAS_WIDTH; x++) {
                    const current = grid[y][x];
                    const prev = this.prevGrid[y][x];

                    // Only update if cell changed
                    if (current.char !== prev.char || current.class !== prev.class) {
                        const cell = this.gridCells[y][x];
                        cell.textContent = current.char;
                        cell.className = `game-cell ${current.class}`;

                        // Update previous state
                        this.prevGrid[y][x] = { char: current.char, class: current.class };
                    }
                }
            }
        }

        updateHUD() {
            if (this.hud.wave) this.hud.wave.textContent = this.wave;
            if (this.hud.score) this.hud.score.textContent = this.score;
            if (this.hud.hp) {
                const hpBlocks = Math.ceil((this.player.hp / PLAYER_MAX_HP) * 10);
                this.hud.hp.textContent = '\u2588'.repeat(hpBlocks) + '\u2591'.repeat(10 - hpBlocks);
            }
        }

        showGameOver() {
            const overlay = document.querySelector('.game-over-overlay');
            const statsEl = overlay?.querySelector('.stats');

            if (statsEl) {
                statsEl.textContent = `Wave: ${this.wave}\nScore: ${this.score}`;
            }

            if (overlay) {
                overlay.classList.add('active');
            }
        }

        hideGameOver() {
            const overlay = document.querySelector('.game-over-overlay');
            if (overlay) {
                overlay.classList.remove('active');
            }
        }

        showPauseMenu() {
            this.pause();
            const overlay = document.getElementById('game-pause-overlay');
            if (overlay) {
                overlay.classList.add('active');
            }
        }

        hidePauseMenu() {
            const overlay = document.getElementById('game-pause-overlay');
            if (overlay) {
                overlay.classList.remove('active');
            }
            this.resume();
        }

        // ================================
        // Input Handling
        // ================================

        handleKeyDown(e) {
            // Don't capture input if typing in an input field
            if (e.target.tagName === 'INPUT') return;

            this.keys[e.code] = true;

            // Retry on R when game over
            if (e.code === 'KeyR' && this.state === 'gameover') {
                this.reset();
            }

            // ESC to toggle pause menu
            if (e.code === 'Escape' && (this.state === 'playing' || this.state === 'paused')) {
                e.preventDefault();
                if (this.state === 'playing') {
                    this.showPauseMenu();
                } else if (this.state === 'paused') {
                    this.hidePauseMenu();
                }
            }
        }

        handleKeyUp(e) {
            this.keys[e.code] = false;
        }
    }

    // ================================
    // Window Manager Integration
    // ================================

    function initVampireWindow() {
        const vampireWindow = document.getElementById('vampire-window');
        if (!vampireWindow) return;

        const titlebar = vampireWindow.querySelector('.vampire-titlebar');
        const lights = vampireWindow.querySelectorAll('.vampire-titlebar .light');
        const canvas = document.getElementById('game-canvas');
        const startOverlay = vampireWindow.querySelector('.game-start-overlay');
        const startButton = vampireWindow.querySelector('.game-start-button');

        // Initialize game
        game = new VampireGame(canvas, {
            wave: document.getElementById('game-wave'),
            score: document.getElementById('game-score'),
            hp: document.getElementById('game-hp')
        });
        game.init();

        // Initialize Window Manager
        vampireWindowManager = new WindowManager({
            element: vampireWindow,
            titlebar: titlebar,
            windowId: 'vampire',
            preventDragOn: ['.traffic-lights', '.game-canvas'],
            trafficLights: {
                close: lights[0],
                minimize: lights[1],
                maximize: lights[2]
            },
            onClose: () => {
                vampireWindow.classList.remove('active');
                // Destroy game completely and reset to initial state
                if (game) {
                    game.destroy();
                    game.init();
                    // Show start overlay again
                    if (startOverlay) {
                        startOverlay.classList.remove('hidden');
                    }
                }
                // Update menubar
                if (typeof MenubarManager !== 'undefined') {
                    const profileWindow = document.querySelector('.iterm-window');
                    const profileVisible = profileWindow &&
                        !profileWindow.classList.contains('minimized') &&
                        profileWindow.classList.contains('visible');
                    MenubarManager.setActiveApp(profileVisible ? 'Profile' : 'Pablo Lagger');
                }
            },
            onMinimize: () => {
                if (game && game.state === 'playing') {
                    game.pause();
                }
            },
            onRestore: () => {
                if (game && game.state === 'paused') {
                    game.resume();
                }
            }
        });

        // Start button handler
        if (startButton) {
            startButton.addEventListener('click', () => {
                startOverlay.classList.add('hidden');
                game.start();
            });
        }

        // Pause menu buttons
        const pauseContinue = document.getElementById('pause-continue');
        const pauseRestart = document.getElementById('pause-restart');

        if (pauseContinue) {
            pauseContinue.addEventListener('click', () => {
                game.hidePauseMenu();
            });
        }

        if (pauseRestart) {
            pauseRestart.addEventListener('click', () => {
                const pauseOverlay = document.getElementById('game-pause-overlay');
                if (pauseOverlay) {
                    pauseOverlay.classList.remove('active');
                }
                game.destroy();
                game.init();
                game.start();
            });
        }
    }

    // ================================
    // Public API
    // ================================

    function openVampireGame() {
        const vampireWindow = document.getElementById('vampire-window');
        if (!vampireWindow) return;

        if (vampireWindowManager && vampireWindowManager.isMinimized()) {
            vampireWindowManager.restore();
        } else {
            document.dispatchEvent(new CustomEvent('window:restore', {
                detail: { windowId: 'vampire' }
            }));
        }

        vampireWindow.classList.add('active');

        // Focus the game
        if (game && game.state === 'paused') {
            game.resume();
        }
    }

    function closeVampireGame() {
        if (vampireWindowManager) {
            vampireWindowManager.close();
        }
    }

    // Expose to global scope
    window.openVampireGame = openVampireGame;
    window.closeVampireGame = closeVampireGame;
    window.vampireWindowManager = null;

    // ================================
    // Initialize
    // ================================

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initVampireWindow);
    } else {
        initVampireWindow();
    }

    // Update global reference after init
    window.vampireWindowManager = vampireWindowManager;
})();
