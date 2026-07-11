import { SETTINGS, TILE_WALL, THEMES, COLORS, getMonochromePalette } from './constants.js';
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
        this.theme = THEMES.LIGHT;
        this.isSolving = false;
        this.debug = false;
        this.level = null;
        
        this.mode = 'INFINITE';
        this.infiniteDifficulty = 'medium';
    }

    init(size) {
        this.size = size;
        this.renderer.resize(this.ui.getCanvasContainer(), this.size);
        this.ui.hideDifficultyOverlay();
        if (this.state === 'PLAYING') {
            this.nextLevel();
        }
    }

    setDifficulty(difficulty) {
        this.infiniteDifficulty = difficulty;
        if (difficulty === 'easy') this.size = 6;
        if (difficulty === 'medium') this.size = 9;
        if (difficulty === 'hard') this.size = 12;
        
        this.ui.updateSettingsUI(this.size, null);
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
        this.infiniteDifficulty = difficulty || 'medium';
        const hasCompletedTutorial = localStorage.getItem('blockslide_tutorial_completed') === 'true';
        if (!hasCompletedTutorial) {
            this.startTutorialLevel(1);
            return;
        }

        this.mode = 'INFINITE';
        if (this.infiniteDifficulty === 'easy') this.size = 6;
        if (this.infiniteDifficulty === 'medium') this.size = 9;
        if (this.infiniteDifficulty === 'hard') this.size = 12;
        
        this.ui.showScreen('screen-game');
        this.nextLevel();
    }

    startTutorialLevel(index) {
        this.mode = 'TUTORIAL';
        this.tutorialLevelIndex = index;
        
        this.size = index === 5 ? 4 : 3;
        this.renderer.resize(this.ui.getCanvasContainer(), this.size);
        
        this.ui.showTutorialInstruction(index);
        this.ui.updateLevelTitle(`Tutorial ${index}/5`);
        this.ui.showScreen('screen-game');
        
        const config = { size: this.size, targetScore: 50 };
        const palette = getMonochromePalette(index, this.theme.id);
        this.renderer.setPalette(palette);
        
        this.level = this.generator.generate(config, palette.obstacles, index);
        this.ui.updateScore(this.level.score);
        
        this.state = 'PLAYING';
        this.restart();
    }

    setDebug(value) {
        this.debug = value;
        this.renderer.setDebug(value);
    }

    nextLevel(forcedSeed = null) {
        if (this.mode === 'TUTORIAL') {
            if (this.tutorialLevelIndex < 5) {
                this.startTutorialLevel(this.tutorialLevelIndex + 1);
            } else {
                localStorage.setItem('blockslide_tutorial_completed', 'true');
                this.startInfinite(this.infiniteDifficulty);
            }
            return;
        }

        this.ui.showTutorialInstruction(0);
        
        let seed = forcedSeed || Date.now();
        let targetScore = 50;
        let minPath = 5, maxPath = 20;
        
        if (this.size === 6) {
            targetScore = 30;
            minPath = 5;
            maxPath = 7;
        } else if (this.size === 9) {
            targetScore = 60;
            minPath = 7;
            maxPath = 9;
        } else if (this.size === 12) {
            targetScore = 90;
            minPath = 8;
            maxPath = 12;
        }

        const config = { size: this.size, targetScore, minPath, maxPath };
        this.renderer.resize(this.ui.getCanvasContainer(), this.size);
        
        this.ui.updateLevelTitle('');
        this.ui.updateLevelId(seed);
        
        // Generate and set monochrome palette for level theme
        const palette = getMonochromePalette(seed, this.theme.id);
        this.renderer.setPalette(palette);
        
        this.level = this.generator.generate(config, palette.obstacles, seed);
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
            const cols = this.level.size.cols || this.level.size;
            const rows = this.level.size.rows || this.level.size;
            if (
                nx < 0 || nx >= cols || 
                ny < 0 || ny >= rows || 
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
