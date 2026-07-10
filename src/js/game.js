import { SETTINGS, TILE_WALL, THEMES, COLORS } from './constants.js';
import { LevelGenerator } from './levelGenerator.js';
import { SoundEngine } from './sound.js';

export class Game {
    constructor(renderer, ui) {
        this.renderer = renderer;
        this.ui = ui;
        this.generator = new LevelGenerator();
        this.sound = new SoundEngine();
        
        this.player = { x: 0, y: 0, vx: 0, vy: 0 };
        this.moves = 0;
        this.history = [];
        this.pathPoints = [];
        this.state = 'MENU';
        this.size = SETTINGS.DEFAULT_SIZE;
        this.theme = THEMES.MINIMAL;
        this.isSolving = false;
        this.debug = false;
        this.level = null;
        
        this.mode = 'INFINITE';
    }

    init(size) {
        this.size = size;
        this.renderer.resize(this.ui.getCanvasContainer(), this.size);
        this.ui.hideDifficultyOverlay();
        if (this.state === 'PLAYING') {
            this.nextLevel();
        }
    }

    setTheme(themeId) {
        const themeKey = themeId.toUpperCase();
        if (THEMES[themeKey]) {
            this.theme = THEMES[themeKey];
            this.renderer.setTheme(themeId);
            document.body.className = `theme-${themeId}`;
            this.ui.hideDifficultyOverlay();
            if (this.level) {
                this.nextLevel(this.level.seed);
            }
        }
    }

    startInfinite(difficulty) {
        this.mode = 'INFINITE';
        this.infiniteDifficulty = difficulty; // 'easy', 'medium', 'hard'
        if (difficulty === 'easy') this.size = 6;
        if (difficulty === 'medium') this.size = 9;
        if (difficulty === 'hard') this.size = 12;
        
        this.ui.showScreen('screen-game');
        this.nextLevel();
    }

    setDebug(value) {
        this.debug = value;
        this.renderer.setDebug(value);
    }

    nextLevel(forcedSeed = null) {
        let seed = forcedSeed || Date.now();
        let targetScore = 50;
        if (this.size === 6) targetScore = 30;
        if (this.size === 9) targetScore = 60;
        if (this.size === 12) targetScore = 90;

        const config = { size: this.size, targetScore };
        this.renderer.resize(this.ui.getCanvasContainer(), this.size);
        
        this.ui.updateLevelId(seed);
        
        this.level = this.generator.generate(config, this.theme.colors.blocks, seed);
        this.ui.updateScore(this.level.score);
        
        this.state = 'PLAYING';
        this.restart();
    }

    restart() {
        if (!this.level) return;
        this.isSolving = false;
        
        this.player.x = this.level.start.x; 
        this.player.y = this.level.start.y;
        this.player.vx = this.player.x; 
        this.player.vy = this.player.y;
        this.player.velX = 0;
        this.player.velY = 0;
        this.player.moveStartX = this.player.x;
        this.player.moveStartY = this.player.y;
        this.nextMove = null;
        
        this.moves = 0;
        this.history = [];
        this.pathPoints = [{ x: this.player.x, y: this.player.y }];
        this.state = 'PLAYING';
        this.ui.hideWinMessage();
        this.updateUI();
    }

    async showSolution() {
        if (this.state !== 'PLAYING' || this.isSolving) return;
        this.restart();
        this.isSolving = true;
        
        for (const dir of this.level.solution) {
            if (!this.isSolving) break;
            this.move(dir.dx, dir.dy);
            while (this.isMoving()) {
                await new Promise(r => setTimeout(r, 16));
            }
            await new Promise(r => setTimeout(r, SETTINGS.ANIMATION_DELAY));
        }
        this.isSolving = false;
    }

    undo() {
        if (this.history.length > 0 && this.state === 'PLAYING' && !this.isSolving) {
            const last = this.history.pop();
            this.player.x = last.x; 
            this.player.y = last.y;
            this.player.vx = last.x; 
            this.player.vy = last.y;
            this.player.velX = 0;
            this.player.velY = 0;
            this.player.moveStartX = last.x;
            this.player.moveStartY = last.y;
            this.nextMove = null;
            this.pathPoints.pop();
            this.moves--;
            this.updateUI();
        }
    }

    move(dx, dy) {
        if (this.state !== 'PLAYING') return;
        
        if (this.isMoving()) {
            const totalDist = Math.hypot(this.player.x - this.player.moveStartX, this.player.y - this.player.moveStartY);
            const currentDist = Math.hypot(this.player.vx - this.player.moveStartX, this.player.vy - this.player.moveStartY);
            
            if (totalDist > 0 && (currentDist / totalDist) > 0.9) {
                this.nextMove = { dx, dy };
            }
            return;
        }

        let cx = this.player.x, cy = this.player.y;
        while (true) {
            const nx = cx + dx, ny = cy + dy;
            if (
                nx < 0 || nx >= this.level.size || 
                ny < 0 || ny >= this.level.size || 
                this.level.grid[ny][nx] === TILE_WALL
            ) break;
            cx = nx; 
            cy = ny;
        }

        if (cx !== this.player.x || cy !== this.player.y) {
            this.history.push({ x: this.player.x, y: this.player.y });
            this.player.moveStartX = this.player.x;
            this.player.moveStartY = this.player.y;
            this.player.x = cx; 
            this.player.y = cy;
            this.moves++;
            this.sound.playSlide();
            this.updateUI();
        }
    }

    isMoving() {
        const dx = this.player.x - this.player.vx;
        const dy = this.player.y - this.player.vy;
        return Math.hypot(dx, dy) > SETTINGS.EPSILON || Math.hypot(this.player.velX, this.player.velY) > SETTINGS.EPSILON;
    }

    updateUI() {
        this.ui.updateStats(this.moves, this.level.par);
    }

    update() {
        if (!this.level || this.state === 'MENU') return;
        
        const wasMoving = this.isMoving();

        const ax = (this.player.x - this.player.vx) * SETTINGS.STIFFNESS;
        const ay = (this.player.y - this.player.vy) * SETTINGS.STIFFNESS;
        
        this.player.velX += ax;
        this.player.velY += ay;
        this.player.velX *= SETTINGS.DAMPING;
        this.player.velY *= SETTINGS.DAMPING;
        
        this.player.vx += this.player.velX;
        this.player.vy += this.player.velY;

        if (wasMoving && !this.isMoving()) {
            this.player.vx = this.player.x;
            this.player.vy = this.player.y;
            this.player.velX = 0;
            this.player.velY = 0;
            
            this.pathPoints.push({ x: this.player.x, y: this.player.y });
            if (this.player.x === this.level.end.x && this.player.y === this.level.end.y) {
                this.state = 'WIN';
                this.isSolving = false;
                this.sound.playWin();
                this.ui.showWinMessage();
            }

            if (this.nextMove) {
                const { dx, dy } = this.nextMove;
                this.nextMove = null;
                this.move(dx, dy);
            }
        }
    }

    draw() {
        this.renderer.draw(this.level, this.player, this.pathPoints, this.theme);
    }
}
