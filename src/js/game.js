import { SETTINGS, TILE_WALL, TILE_FRAGILE, TILE_TELEPORT_A, TILE_TELEPORT_B, THEMES, COLORS, getMonochromePalette } from './constants.js';
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
        this.isUndoing = false;
        this.undoTrailPoint = null;
        this.debug = false;
        this.level = null;
        
        // Win animations
        this.dockTimer = 0;
        this.dockDuration = 30; // ~500ms
        this.rippleTimer = 0;
        this.rippleDuration = 50; // ~830ms
        
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
        this.isUndoing = false;
        this.undoTrailPoint = null;
        this.dockTimer = 0;
        this.rippleTimer = 0;
        
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
        
        // Modifier state
        this.activeGrid = this.level.grid.map(row => [...row]);
        this.brokenFragile = new Set();
        this.pathCells = new Set([`${this.level.start.x},${this.level.start.y}`]);
        this.crossingsLeft = this.level.solutionCrossings || 0;

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
        if (this.history.length > 0 && this.state === 'PLAYING' && !this.isSolving && !this.isUndoing && !this.isMoving()) {
            const last = this.history.pop();
            this.player.x = last.x; 
            this.player.y = last.y;
            this.player.moveStartX = last.x;
            this.player.moveStartY = last.y;
            this.nextMove = null;
            this.moves--;

            this.isUndoing = true;
            this.undoTrailPoint = { x: this.player.vx, y: this.player.vy };

            this.sound.playUndo();
            this.updateUI();
        }
    }

    move(dx, dy) {
        if (this.state !== 'PLAYING' || this.isUndoing) return;

        // Hide HUD on any interaction/move (if helper exists)
        if (this.ui.hideGameHUD) this.ui.hideGameHUD();

        if (this.isMoving()) {
            const totalDist = Math.hypot(this.player.x - this.player.moveStartX, this.player.y - this.player.moveStartY);
            const currentDist = Math.hypot(this.player.vx - this.player.moveStartX, this.player.vy - this.player.moveStartY);

            if (totalDist > 0 && (currentDist / totalDist) > 0.9) {
                this.nextMove = { dx, dy };
            }
            return;
        }

        const grid = this.activeGrid || this.level.grid;
        const cols = this.level.size.cols || this.level.size;
        const rows = this.level.size.rows || this.level.size;

        // Check if we are sliding in the opposite direction of the last move (retraction)
        if (this.history.length > 0 && !this.isSolving) {
            const last = this.history[this.history.length - 1];
            const lastMoveDx = this.player.x - last.x;
            const lastMoveDy = this.player.y - last.y;
            const isOppositeDirection = (lastMoveDx !== 0 && dx * lastMoveDx < 0) ||
                (lastMoveDy !== 0 && dy * lastMoveDy < 0);

            if (isOppositeDirection) {
                // Calculate destination from current player position
                let testCx = this.player.x, testCy = this.player.y;
                let testTeleported = false;
                while (true) {
                    const nx = testCx + dx, ny = testCy + dy;
                    if (nx < 0 || nx >= cols || ny < 0 || ny >= rows) break;
                    const cell = grid[ny][nx];
                    if (cell === TILE_WALL) break;
                    testCx = nx;
                    testCy = ny;
                    if (!testTeleported && (cell === TILE_TELEPORT_A || cell === TILE_TELEPORT_B)) {
                        const targetType = cell === TILE_TELEPORT_A ? TILE_TELEPORT_B : TILE_TELEPORT_A;
                        let dest = null;
                        outer: for (let ty = 0; ty < rows; ty++) {
                            for (let tx = 0; tx < cols; tx++) {
                                if (grid[ty][tx] === targetType) { dest = { x: tx, y: ty }; break outer; }
                            }
                        }
                        if (dest) {
                            testCx = dest.x;
                            testCy = dest.y;
                            testTeleported = true;
                        }
                    }
                }

                if (testCx === last.x && testCy === last.y) {
                    this.undo();
                    return;
                } else if (testCx !== this.player.x || testCy !== this.player.y) {
                    // Sliding further in opposite direction: pop/erase last move first
                    this.history.pop();
                    this.pathPoints.pop();

                    // Apply modifier snapshot immediately to restore the board state to what it was at last.x, last.y
                    const snap = last.modifierSnapshot;
                    if (snap) {
                        this.activeGrid = snap.activeGrid.map(r => [...r]);
                        this.brokenFragile = new Set(snap.brokenFragile);
                        this.pathCells = new Set(snap.pathCells);
                        this.crossingsLeft = snap.crossingsLeft;
                    }

                    // Perform the move logically starting from last.x, last.y but visually starting from player.vx, player.vy
                    const restoredGrid = this.activeGrid || this.level.grid;
                    let nextCx = last.x, nextCy = last.y;
                    let nextTeleported = false;
                    const nextCellsTraversed = [];

                    while (true) {
                        const nx = nextCx + dx, ny = nextCy + dy;
                        if (nx < 0 || nx >= cols || ny < 0 || ny >= rows) break;
                        const cell = restoredGrid[ny][nx];
                        if (cell === TILE_WALL) break;
                        nextCx = nx;
                        nextCy = ny;
                        nextCellsTraversed.push({ x: nextCx, y: nextCy });

                        if (!nextTeleported && (cell === TILE_TELEPORT_A || cell === TILE_TELEPORT_B)) {
                            const targetType = cell === TILE_TELEPORT_A ? TILE_TELEPORT_B : TILE_TELEPORT_A;
                            let dest = null;
                            outer: for (let ty = 0; ty < rows; ty++) {
                                for (let tx = 0; tx < cols; tx++) {
                                    if (restoredGrid[ty][tx] === targetType) { dest = { x: tx, y: ty }; break outer; }
                                }
                            }
                            if (dest) {
                                nextCx = dest.x;
                                nextCy = dest.y;
                                nextCellsTraversed.push({ x: nextCx, y: nextCy });
                                nextTeleported = true;
                            }
                        }
                    }

                    // Save the snapshot *before* applying the new move's changes
                    const newModifierSnapshot = {
                        activeGrid: restoredGrid.map(r => [...r]),
                        brokenFragile: new Set(this.brokenFragile),
                        pathCells: new Set(this.pathCells),
                        crossingsLeft: this.crossingsLeft
                    };
                    this.history.push({ x: last.x, y: last.y, modifierSnapshot: newModifierSnapshot });

                    // Apply the new move's changes
                    for (const cell of nextCellsTraversed) {
                        this.pathCells.add(`${cell.x},${cell.y}`);
                        if (restoredGrid[cell.y][cell.x] === TILE_FRAGILE) {
                            this.activeGrid[cell.y][cell.x] = TILE_WALL;
                            this.brokenFragile.add(`${cell.x},${cell.y}`);
                        }
                    }

                    this.player.moveStartX = last.x;
                    this.player.moveStartY = last.y;
                    this.player.x = nextCx;
                    this.player.y = nextCy;

                    this.sound.playSlide();
                    this.updateUI();
                    return;
                }
            }
        }

        let cx = this.player.x, cy = this.player.y;
        let teleported = false;
        const cellsTraversed = [];

        while (true) {
            const nx = cx + dx, ny = cy + dy;
            if (nx < 0 || nx >= cols || ny < 0 || ny >= rows) break;

            const cell = grid[ny][nx];
            if (cell === TILE_WALL) break;

            cx = nx;
            cy = ny;
            cellsTraversed.push({ x: cx, y: cy });

            // Handle teleport nodes
            if (!teleported && (cell === TILE_TELEPORT_A || cell === TILE_TELEPORT_B)) {
                const targetType = cell === TILE_TELEPORT_A ? TILE_TELEPORT_B : TILE_TELEPORT_A;
                let dest = null;
                outer: for (let ty = 0; ty < rows; ty++) {
                    for (let tx = 0; tx < cols; tx++) {
                        if (grid[ty][tx] === targetType) { dest = { x: tx, y: ty }; break outer; }
                    }
                }
                if (dest) {
                    cx = dest.x;
                    cy = dest.y;
                    cellsTraversed.push({ x: cx, y: cy });
                    teleported = true;
                }
            }
        }

        if (cx === this.player.x && cy === this.player.y) return;

        // Save modifier state snapshot for undo
        const modifierSnapshot = {
            activeGrid: (this.activeGrid || this.level.grid).map(r => [...r]),
            brokenFragile: new Set(this.brokenFragile),
            pathCells: new Set(this.pathCells),
            crossingsLeft: this.crossingsLeft
        };

        this.history.push({ x: this.player.x, y: this.player.y, modifierSnapshot });

        // Record traversed cells to path cells
        for (const cell of cellsTraversed) {
            const key = `${cell.x},${cell.y}`;
            this.pathCells.add(key);
        }

        // Break fragile tiles
        for (const cell of cellsTraversed) {
            if (grid[cell.y][cell.x] === TILE_FRAGILE) {
                this.activeGrid[cell.y][cell.x] = TILE_WALL;
                this.brokenFragile.add(`${cell.x},${cell.y}`);
            }
        }

        this.player.moveStartX = this.player.x;
        this.player.moveStartY = this.player.y;
        this.player.x = cx;
        this.player.y = cy;
        this.moves++;

        this.sound.playSlide();
        this.updateUI();
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

        // Handle custom win animation states
        if (this.state === 'DOCKING') {
            this.dockTimer++;
            if (this.dockTimer >= this.dockDuration) {
                this.state = 'RIPPLE';
                this.dockTimer = this.dockDuration;
            }
            return;
        }
        if (this.state === 'RIPPLE') {
            this.rippleTimer++;
            if (this.rippleTimer >= this.rippleDuration) {
                this.state = 'WIN';
                this.rippleTimer = this.rippleDuration;

                if (this.mode === 'TUTORIAL') {
                    const compLvl = this.playingJourneyLevel;
                    if (compLvl === 5) {
                        localStorage.setItem('blockslide_tutorial_completed', 'true');
                        this.startInfinite(this.infiniteDifficulty);
                        return;
                    }
                    this.playingJourneyLevel++;
                }
                this.ui.showWinMessage();
            }
            return;
        }
        if (this.state === 'WIN') return;
        
        const wasMoving = this.isMoving();

        const ax = (this.player.x - this.player.vx) * SETTINGS.STIFFNESS;
        const ay = (this.player.y - this.player.vy) * SETTINGS.STIFFNESS;
        
        this.player.velX += ax;
        this.player.velY += ay;
        this.player.velX *= SETTINGS.DAMPING;
        this.player.velY *= SETTINGS.DAMPING;
        
        this.player.vx += this.player.velX;
        this.player.vy += this.player.velY;

        // Keep undoTrailPoint in sync with animated position during retraction
        if (this.isUndoing) {
            this.undoTrailPoint = { x: this.player.vx, y: this.player.vy };
        }

        if (wasMoving && !this.isMoving()) {
            this.player.vx = this.player.x;
            this.player.vy = this.player.y;
            this.player.velX = 0;
            this.player.velY = 0;
            
            if (this.isUndoing) {
                this.isUndoing = false;
                this.undoTrailPoint = null;
                this.pathPoints.pop();
                return;
            }
            
            this.pathPoints.push({ x: this.player.x, y: this.player.y });
            if (this.player.x === this.level.end.x && this.player.y === this.level.end.y) {
                this.state = 'DOCKING';
                this.isSolving = false;
                this.dockTimer = 0;
                this.rippleTimer = 0;
                this.sound.playWin();
                if (navigator.vibrate) {
                    navigator.vibrate([45, 30, 45]);
                }
                return;
            }

            if (this.nextMove) {
                const { dx, dy } = this.nextMove;
                this.nextMove = null;
                this.move(dx, dy);
            }
        }
    }

    draw() {
        const displayPathPoints = this.isUndoing
            ? this.pathPoints.slice(0, -1)
            : this.pathPoints;
        const displayPlayer = this.isUndoing
            ? { ...this.player, vx: this.undoTrailPoint.x, vy: this.undoTrailPoint.y }
            : this.player;

        this.renderer.draw(this.level, displayPlayer, displayPathPoints, this.theme, {
            brokenFragile: this.brokenFragile || new Set(),
            activeGrid: this.activeGrid || (this.level ? this.level.grid : null),
            state: this.state,
            dockProgress: this.state === 'DOCKING' ? (this.dockTimer / this.dockDuration) : (this.state === 'RIPPLE' || this.state === 'WIN' ? 1 : 0),
            rippleProgress: this.state === 'RIPPLE' ? (this.rippleTimer / this.rippleDuration) : (this.state === 'WIN' ? 1 : 0)
        });
    }
}
