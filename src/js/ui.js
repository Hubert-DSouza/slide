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
        if (target) target.classList.remove('hidden');
    }

    updateStats(moves, par) {
        this.elements.moveCount.innerText = moves;
        this.elements.parCount.innerText = par;
    }

    updateLevelId(seed) {
        this.elements.levelId.innerText = `SEED: ${seed}`;
    }

    updateScore(score) {
        document.getElementById('level-score').innerText = `SCORE: ${score}/100`;
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
}
