export class UI {
    constructor() {
        this.elements = {
            moveCount: document.getElementById('move-count'),
            parCount: document.getElementById('par-count'),
            levelId: document.getElementById('level-id'),
            winMessage: document.getElementById('win-message'),
            difficultyOverlay: document.getElementById('difficulty-overlay'),
            canvasContainer: document.querySelector('main')
        };
    }

    updateStats(moves, par) {
        this.elements.moveCount.innerText = moves;
        this.elements.parCount.innerText = par;
    }

    updateLevelId(seed) {
        this.elements.levelId.innerText = "#" + seed.toString(16).slice(-4).toUpperCase();
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
