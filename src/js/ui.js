export class UI {
    constructor() {
        this.elements = {
            moveCount: document.getElementById('move-count'),
            parCount: document.getElementById('par-count'),
            levelId: document.getElementById('level-id'),
            winMessage: document.getElementById('win-message'),
            difficultyOverlay: document.getElementById('difficulty-overlay'),
            canvasContainer: document.querySelector('main'),
            screens: {
                home: document.getElementById('screen-home'),
                game: document.getElementById('screen-game')
            }
        };
    }

    showScreen(screenId) {
        Object.values(this.elements.screens).forEach(s => s.classList.add('hidden'));
        const target = this.elements.screens[screenId.replace('screen-', '')];
        if (target) {
            target.classList.remove('hidden');
            if (screenId === 'screen-home') {
                this.generateHomeDecor();
            }
        }
    }

    generateHomeDecor() {
        const container = document.getElementById('home-decor-container');
        if (!container) return;
        container.innerHTML = '';

        const cellSize = 80;
        const width = window.innerWidth;
        const height = window.innerHeight;
        const cols = Math.ceil(width / cellSize);
        const rows = Math.ceil(height / cellSize);

        // Grid slots in safe areas (top rows 0-1, bottom rows 7+)
        const slots = [];
        for (let c = 0; c < cols; c++) {
            for (let r = 0; r < 2; r++) {
                slots.push({ c, r });
            }
            for (let r = 7; r < rows; r++) {
                slots.push({ c, r });
            }
        }

        // Shuffle slots
        const shuffled = slots.sort(() => 0.5 - Math.random());
        const numBlocks = Math.min(shuffled.length, Math.floor(Math.random() * 4) + 4);

        for (let i = 0; i < numBlocks; i++) {
            const slot = shuffled[i];
            const block = document.createElement('div');
            block.className = 'home-decor-block';

            // Random size: 1x1, 1x2, or 2x1 cell size
            const sizeRand = Math.random();
            let w = 1;
            let h = 1;
            if (sizeRand < 0.3 && slot.c < cols - 1) {
                w = 2;
            } else if (sizeRand < 0.6 && slot.r < rows - 1) {
                h = 2;
            }

            block.style.left = `${slot.c * cellSize}px`;
            block.style.top = `${slot.r * cellSize}px`;
            block.style.width = `${w * cellSize}px`;
            block.style.height = `${h * cellSize}px`;

            // Random opacity between 0.008 and 0.035 for subtle visual differences
            const opacity = (Math.random() * 0.027 + 0.008).toFixed(3);
            block.style.backgroundColor = 'var(--text)';
            block.style.opacity = opacity;

            container.appendChild(block);
        }
    }

    updateStats(moves, par) {
        this.elements.moveCount.innerText = moves;
        this.elements.parCount.innerText = par;
    }

    updateLevelId(seed) {
        if (this.elements.levelId) {
            this.elements.levelId.innerText = `SEED: ${seed}`;
        }
    }

    updateScore(score) {
        const scoreEl = document.getElementById('level-score');
        if (scoreEl) {
            scoreEl.innerText = `SCORE: ${score}/100`;
        }
    }

    showWinMessage() {
        this.elements.winMessage.classList.remove('hidden');
    }

    hideWinMessage() {
        this.elements.winMessage.classList.add('hidden');
    }

    showDifficultyOverlay() {
        this.elements.difficultyOverlay.classList.remove('hidden');
    }

    hideDifficultyOverlay() {
        this.elements.difficultyOverlay.classList.add('hidden');
    }

    getCanvasContainer() {
        return this.elements.canvasContainer;
    }

    updateSettingsUI(size, themeId) {
        if (size) {
            const easyBtns = [document.getElementById('grid-btn-small'), document.getElementById('home-diff-easy')];
            const mediumBtns = [document.getElementById('grid-btn-medium'), document.getElementById('home-diff-medium')];
            const hardBtns = [document.getElementById('grid-btn-large'), document.getElementById('home-diff-hard')];
            
            easyBtns.forEach(b => { if (b) b.classList.toggle('active', size === 6); });
            mediumBtns.forEach(b => { if (b) b.classList.toggle('active', size === 9); });
            hardBtns.forEach(b => { if (b) b.classList.toggle('active', size === 12); });
        }
        if (themeId) {
            const btnLight = document.getElementById('theme-btn-light');
            const btnDark = document.getElementById('theme-btn-dark');
            if (btnLight && btnDark) {
                btnLight.classList.toggle('active', themeId === 'light');
                btnDark.classList.toggle('active', themeId === 'dark');
            }
        }
    }

    showTutorialInstruction(levelNum) {
        const el = document.getElementById('tutorial-instruction');
        if (!el) return;

        const instructions = {
            1: "Slide to the goal.",
            2: "You'll stop when you hit a wall.",
            3: "Try finding a way around.",
            4: "You're getting the hang of it.",
            5: "Not so hard, right?"
        };

        if (instructions[levelNum]) {
            el.innerText = instructions[levelNum];
            el.classList.remove('hidden');
        } else {
            el.innerText = "";
            el.classList.add('hidden');
        }
    }

    updateLevelTitle(title) {
        const el = document.getElementById('level-title');
        if (el) {
            el.innerText = title;
            if (title) {
                el.classList.remove('hidden');
            } else {
                el.classList.add('hidden');
            }
        }
    }
}
