import { SETTINGS } from './constants.js';

export class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.debug = false;
        this.currentTheme = 'minimal';
    }

    setTheme(themeId) {
        this.currentTheme = themeId;
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

    draw(level, player, pathPoints, theme) {
        if (!level || !theme) return;
        const { ctx, canvas, tileSize } = this;
        const colors = theme.colors;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Blocks
        level.grid.forEach((row, y) => {
            row.forEach((cell, x) => {
                if (cell === 1) {
                    this.drawBlock(x, y, level.colorGrid[y][x], theme);
                }
            });
        });

        // Markers
        this.drawDot(level.start, colors.text, 0.2);
        this.drawDot(level.end, colors.accent, 0.3);

        // Continuous Path
        ctx.beginPath();
        ctx.strokeStyle = colors.path || colors.text; 
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
        
        if (this.currentTheme === 'ethereal') {
            ctx.shadowBlur = 10;
            ctx.shadowColor = 'rgba(255, 215, 0, 0.5)';
        }

        ctx.fillStyle = colors.text;
        ctx.beginPath();
        ctx.arc(curX, curY, tileSize * 0.3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#ffffff'; 
        ctx.beginPath();
        ctx.arc(curX, curY, tileSize * 0.22, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowBlur = 0;

        if (this.debug) {
            this.drawDebugInfo(level);
        }
    }

    drawBlock(x, y, color, theme) {
        const { ctx, tileSize } = this;
        const px = x * tileSize;
        const py = y * tileSize;

        ctx.fillStyle = color;
        ctx.fillRect(px, py, tileSize, tileSize);

        if (this.currentTheme === 'ethereal') {
            // Draw geometric patterns with subtle dark overlay
            ctx.fillStyle = 'rgba(0, 0, 0, 0.2)'; 
            ctx.beginPath();
            
            const seed = (x * 7 + y * 13) % 6;
            
            if (seed === 0) {
                ctx.arc(px + tileSize/2, py + tileSize, tileSize/2, Math.PI, 0);
            } else if (seed === 1) {
                ctx.moveTo(px + tileSize/2, py + tileSize * 0.2);
                ctx.lineTo(px + tileSize * 0.8, py + tileSize/2);
                ctx.lineTo(px + tileSize/2, py + tileSize * 0.8);
                ctx.lineTo(px + tileSize * 0.2, py + tileSize/2);
            } else if (seed === 2) {
                ctx.moveTo(px, py);
                ctx.arc(px, py, tileSize * 0.8, 0, Math.PI/2);
            } else if (seed === 3) {
                ctx.moveTo(px + tileSize * 0.2, py + tileSize * 0.8);
                ctx.lineTo(px + tileSize * 0.8, py + tileSize * 0.8);
                ctx.lineTo(px + tileSize/2, py + tileSize * 0.2);
            } else if (seed === 4) {
                ctx.arc(px + tileSize/2, py + tileSize/2, tileSize/4, 0, Math.PI * 2);
            } else {
                ctx.rect(px + tileSize * 0.35, py + tileSize * 0.1, tileSize * 0.3, tileSize * 0.8);
            }
            ctx.fill();
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
