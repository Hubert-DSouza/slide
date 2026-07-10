import { SETTINGS, TILE_WALL } from './constants.js';
import { LevelGenerator } from './levelGenerator.js';

export class Game {
    constructor(renderer, ui) {
        this.renderer = renderer;
        this.ui = ui;
        this.generator = new LevelGenerator();
        
        this.player = { x: 0, y: 0, vx: 0, vy: 0 };
        this.moves = 0;
        this.history = [];
        this.pathPoints = [];
        this.state = 'MENU';
        this.size = SETTINGS.DEFAULT_SIZE;
        this.isSolving = false;
        this.debug = false;
        this.level = null;
    }

    init(size) {
        this.size = size;
        this.ui.hideDifficultyOverlay();
        this.nextLevel();
    }

    setDebug(value) {
        this.debug = value;
        this.renderer.setDebug(value);
    }

    nextLevel(seed = Date.now()) {
        this.level = this.generator.generate(this.size, seed);
        this.ui.updateLevelId(this.level.seed);
        this.restart();
    }

    restart() {
        if (!this.level) return;
        this.isSolving = false;
        this.player.x = this.level.start.x; 
        this.player.y = this.level.start.y;
        this.player.vx = this.player.x; 
        this.player.vy = this.player.y;
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
            while (
                Math.abs(this.player.x - this.player.vx) > SETTINGS.EPSILON || 
                Math.abs(this.player.y - this.player.vy) > SETTINGS.EPSILON
            ) {
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
            this.pathPoints.pop();
            this.moves--;
            this.updateUI();
        }
    }

    move(dx, dy) {
        if (this.state !== 'PLAYING') return;
        if (
            Math.abs(this.player.x - this.player.vx) > SETTINGS.EPSILON || 
            Math.abs(this.player.y - this.player.vy) > SETTINGS.EPSILON
        ) return;

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
            this.player.x = cx; 
            this.player.y = cy;
            this.moves++;
            this.updateUI();
        }
    }

    updateUI() {
        this.ui.updateStats(this.moves, this.level.par);
    }

    update() {
        if (!this.level || this.state === 'MENU') return;
        const dx = this.player.x - this.player.vx;
        const dy = this.player.y - this.player.vy;
        
        if (Math.abs(dx) > SETTINGS.EPSILON || Math.abs(dy) > SETTINGS.EPSILON) {
            this.player.vx += dx * SETTINGS.MOVE_SPEED;
            this.player.vy += dy * SETTINGS.MOVE_SPEED;
        } else {
            const wasMoving = (this.player.vx !== this.player.x || this.player.vy !== this.player.y);
            this.player.vx = this.player.x;
            this.player.vy = this.player.y;
            
            if (wasMoving) {
                this.pathPoints.push({ x: this.player.x, y: this.player.y });
                if (this.player.x === this.level.end.x && this.player.y === this.level.end.y) {
                    this.state = 'WIN';
                    this.isSolving = false;
                    this.ui.showWinMessage();
                }
            }
        }
    }

    draw() {
        this.renderer.draw(this.level, this.player, this.pathPoints);
    }
}
