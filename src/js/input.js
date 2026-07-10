import { SETTINGS } from './constants.js';

export class Input {
    constructor(game) {
        this.game = game;
        this.sx = 0;
        this.sy = 0;
        
        this.initKeyboard();
        this.initTouch();
    }

    initKeyboard() {
        window.addEventListener('keydown', (e) => {
            if (this.game.isSolving) return;
            switch(e.key) {
                case 'ArrowUp': this.game.move(0, -1); break;
                case 'ArrowDown': this.game.move(0, 1); break;
                case 'ArrowLeft': this.game.move(-1, 0); break;
                case 'ArrowRight': this.game.move(1, 0); break;
                case 'z': if (e.ctrlKey) this.game.undo(); break;
                case 'r': this.game.restart(); break;
                case 'd': this.game.setDebug(!this.game.debug); break;
            }
        });
    }

    initTouch() {
        window.addEventListener('touchstart', e => { 
            this.sx = e.touches[0].clientX; 
            this.sy = e.touches[0].clientY; 
        }, {passive: false});

        window.addEventListener('touchend', e => {
            if (this.game.isSolving) return;
            const dx = e.changedTouches[0].clientX - this.sx;
            const dy = e.changedTouches[0].clientY - this.sy;
            if (Math.hypot(dx, dy) > SETTINGS.TOUCH_THRESHOLD) {
                if (Math.abs(dx) > Math.abs(dy)) {
                    this.game.move(dx > 0 ? 1 : -1, 0);
                } else {
                    this.game.move(0, dy > 0 ? 1 : -1);
                }
            }
        }, {passive: false});
    }
}
