import { COLORS, SETTINGS } from './constants.js';

export class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.debug = false;
    }

    setDebug(value) {
        this.debug = value;
    }

    resize(container, size) {
        const side = Math.min(container.clientWidth * 0.9, container.clientHeight * 0.9);
        this.tileSize = side / size;
        this.canvas.width = side;
        this.canvas.height = side;
        return this.tileSize;
    }

    draw(level, player, pathPoints) {
        if (!level) return;
        const { ctx, canvas, tileSize } = this;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Blocks
        level.grid.forEach((row, y) => {
            row.forEach((cell, x) => {
                if (cell === 1) {
                    ctx.fillStyle = level.colorGrid[y][x];
                    ctx.fillRect(x * tileSize, y * tileSize, tileSize + 0.5, tileSize + 0.5);
                }
            });
        });

        // Markers
        this.drawDot(level.start, COLORS.TEXT, 0.25);
        this.drawDot(level.end, COLORS.ACCENT, 0.25);

        // Continuous Path
        ctx.beginPath();
        ctx.strokeStyle = COLORS.PATH; 
        ctx.lineWidth = tileSize * 0.15;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        
        if (pathPoints.length > 0) {
            ctx.moveTo((pathPoints[0].x + 0.5) * tileSize, (pathPoints[0].y + 0.5) * tileSize);
            for (let i = 1; i < pathPoints.length; i++) {
                ctx.lineTo((pathPoints[i].x + 0.5) * tileSize, (pathPoints[i].y + 0.5) * tileSize);
            }
            ctx.lineTo((player.vx + 0.5) * tileSize, (player.vy + 0.5) * tileSize);
        }
        ctx.stroke();

        // Player
        const curX = (player.vx + 0.5) * tileSize;
        const curY = (player.vy + 0.5) * tileSize;
        
        ctx.fillStyle = COLORS.TEXT;
        ctx.beginPath();
        ctx.arc(curX, curY, tileSize * 0.3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = COLORS.PLAYER_FILL;
        ctx.beginPath();
        ctx.arc(curX, curY, tileSize * 0.22, 0, Math.PI * 2);
        ctx.fill();

        if (this.debug) {
            this.drawDebugInfo(level);
        }
    }

    drawDot(p, color, radiusScale) {
        const { ctx, tileSize } = this;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc((p.x + 0.5) * tileSize, (p.y + 0.5) * tileSize, tileSize * radiusScale, 0, Math.PI * 2);
        ctx.fill();
    }

    drawDebugInfo(level) {
        const { ctx, tileSize } = this;
        ctx.fillStyle = 'rgba(255, 0, 0, 0.2)';
        ctx.font = `${tileSize * 0.2}px monospace`;
        
        level.grid.forEach((row, y) => {
            row.forEach((cell, x) => {
                ctx.fillText(`${x},${y}`, x * tileSize + 2, y * tileSize + tileSize * 0.2);
            });
        });

        // Show direct path from solution if available
        if (level.solution) {
            // This is just a visualization of the directions
        }
    }
}
