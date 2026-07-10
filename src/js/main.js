import { Game } from './game.js';
import { Renderer } from './renderer.js';
import { UI } from './ui.js';
import { Input } from './input.js';

window.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('game-canvas');
    const ui = new UI();
    const renderer = new Renderer(canvas);
    const game = new Game(renderer, ui);
    const input = new Input(game);

    // Initial resize
    game.renderer.resize(ui.getCanvasContainer(), game.size);

    // Global button sound — fires on any button click in the app
    document.addEventListener('click', (e) => {
        if (e.target.closest('button')) {
            game.sound.playClick();
        }
    });

    // Global access for button handlers in HTML (temporary until fully modular)
    window.game = game;
    window.ui = ui;

    window.addEventListener('resize', () => {
        game.renderer.resize(ui.getCanvasContainer(), game.size);
    });

    // Start game loop
    const loop = () => {
        game.update();
        game.draw();
        requestAnimationFrame(loop);
    };
    loop();
});
