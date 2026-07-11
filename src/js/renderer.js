import { SETTINGS, TILE_WALL, TILE_FRAGILE, TILE_TELEPORT_A, TILE_TELEPORT_B } from './constants.js';

export class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.debug = false;
        this.palette = null; // Set per-level by game.js
    }

    setPalette(palette) {
        this.palette = palette;
    }

    setTheme(themeId) {
        // kept for compatibility
    }

    setDebug(value) {
        this.debug = value;
    }

    resize(container, size) {
        const cols = size.cols || size;
        const rows = size.rows || size;
        const style = window.getComputedStyle(container);
        const paddingX = parseFloat(style.paddingLeft || 0) + parseFloat(style.paddingRight || 0);
        const paddingY = parseFloat(style.paddingTop || 0) + parseFloat(style.paddingBottom || 0);
        const maxW = Math.max(10, (container.clientWidth - paddingX) * 0.95);
        const maxH = Math.max(10, (container.clientHeight - paddingY) * 0.95);
        this.tileSize = Math.max(10, Math.min(maxW / cols, maxH / rows));

        const logicalW = cols * this.tileSize;
        const logicalH = rows * this.tileSize;
        const dpr = window.devicePixelRatio || 1;

        this.canvas.width = Math.round(logicalW * dpr);
        this.canvas.height = Math.round(logicalH * dpr);
        this.canvas.style.width = `${logicalW}px`;
        this.canvas.style.height = `${logicalH}px`;

        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.ctx.scale(dpr, dpr);

        return this.tileSize;
    }

    draw(level, player, pathPoints, theme, modifierState = {}) {
        if (!level) return;
        const { ctx, canvas, tileSize } = this;
        const pal = this.palette;
        const activeGrid = modifierState.activeGrid || level.grid;
        const brokenFragile = modifierState.brokenFragile || new Set();
        const cols = level.size.cols || level.size;
        const rows = level.size.rows || level.size;
        const isHighGraphics = window.game ? (window.game.graphics === 1) : true;

        ctx.clearRect(0, 0, cols * tileSize, rows * tileSize);

        // Background
        ctx.fillStyle = pal ? pal.bg : (theme.colors.bg || '#111');
        ctx.fillRect(0, 0, cols * tileSize, rows * tileSize);

        // Grid lines
        const isLightMode = pal ? (pal.bg === '#f7f5f2') : (theme.id === 'minimal' || theme.id === 'ethereal');
        const gridColor = pal ? pal.gridLine : (isLightMode ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.06)');
        ctx.strokeStyle = gridColor;
        ctx.lineWidth = 1;

        // Draw interior vertical lines
        for (let x = 1; x < cols; x++) {
            ctx.beginPath();
            ctx.moveTo(x * tileSize, 0);
            ctx.lineTo(x * tileSize, rows * tileSize);
            ctx.stroke();
        }
        // Draw interior horizontal lines
        for (let y = 1; y < rows; y++) {
            ctx.beginPath();
            ctx.moveTo(0, y * tileSize);
            ctx.lineTo(cols * tileSize, y * tileSize);
            ctx.stroke();
        }

        // Draw crisp outer border
        ctx.beginPath();
        ctx.rect(0.5, 0.5, cols * tileSize - 1, rows * tileSize - 1);
        ctx.stroke();

        // Blocks (walls, fragile tiles, teleport nodes)
        level.grid.forEach((row, y) => {
            row.forEach((cell, x) => {
                const activeCellType = activeGrid[y][x];
                if (activeCellType === TILE_WALL && cell === TILE_WALL) {
                    this.drawBlock(x, y, level.colorGrid[y][x], level.end, modifierState);
                } else if (cell === TILE_FRAGILE) {
                    if (brokenFragile.has(`${x},${y}`)) {
                        this.drawBrokenTile(x, y, level.colorGrid[y][x]);
                    } else {
                        this.drawFragileTile(x, y, level.colorGrid[y][x]);
                    }
                } else if (cell === TILE_TELEPORT_A) {
                    this.drawTeleport(x, y, 'A');
                } else if (cell === TILE_TELEPORT_B) {
                    this.drawTeleport(x, y, 'B');
                }
            });
        });

        // Subtle starting node (drawn underneath the path)
        this.drawStartNode(level.start);

        // Goal — docking ring (drawn BEFORE path and player so it's underneath)
        this.drawDockGoal(level.end, theme);

        // Path (pencil/charcoal line drawn onto the board, fading towards the start, curved at turns)
        if (pathPoints.length > 0) {
            ctx.save();
            const pathColor = pal ? pal.path : (theme.colors.path || '#fff');
            const isLightMode = pal ? (pal.bg === '#f7f5f2') : (theme.id === 'minimal' || theme.id === 'ethereal');

            // Map pathPoints and player to screen/canvas coordinates, filtering out consecutive duplicates
            const rawPts = [...pathPoints, { x: player.vx, y: player.vy }];
            const pts = [];
            for (const p of rawPts) {
                const px = (p.x + 0.5) * tileSize;
                const py = (p.y + 0.5) * tileSize;
                if (pts.length === 0 || Math.hypot(pts[pts.length - 1].x - px, pts[pts.length - 1].y - py) > 0.001) {
                    pts.push({ x: px, y: py });
                }
            }
            if (pts.length >= 2) {
                ctx.beginPath();
                ctx.moveTo(pts[0].x, pts[0].y);

                const offsetDist = tileSize * 0.16; // Small, tight curve radius (just slightly rounded)

                for (let i = 1; i < pts.length - 1; i++) {
                    const pPrev = pts[i - 1];
                    const pCurr = pts[i];
                    const pNext = pts[i + 1];

                    // Vector Curr to Prev
                    const d1x = pPrev.x - pCurr.x;
                    const d1y = pPrev.y - pCurr.y;
                    const len1 = Math.hypot(d1x, d1y);
                    const u1x = d1x / len1;
                    const u1y = d1y / len1;

                    // Vector Curr to Next
                    const d2x = pNext.x - pCurr.x;
                    const d2y = pNext.y - pCurr.y;
                    const len2 = Math.hypot(d2x, d2y);
                    const u2x = d2x / len2;
                    const u2y = d2y / len2;

                    // Keep the curve tight and prevent overlaps on short segments
                    const offset = Math.min(offsetDist, len1 * 0.4, len2 * 0.4);

                    const startX = pCurr.x + u1x * offset;
                    const startY = pCurr.y + u1y * offset;
                    const endX = pCurr.x + u2x * offset;
                    const endY = pCurr.y + u2y * offset;

                    ctx.lineTo(startX, startY);
                    ctx.quadraticCurveTo(pCurr.x, pCurr.y, endX, endY);
                }

                ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);

                // Setup a linear gradient along the path to fade it towards the start
                let endX = pts[pts.length - 1].x;
                let endY = pts[pts.length - 1].y;
                // Prevent 0-length gradient if the path loops back to the start node
                if (Math.hypot(endX - pts[0].x, endY - pts[0].y) < 1) {
                    endX += 1;
                }
                const pathOpacityMult = (modifierState.pathOpacityMultiplier !== undefined) ? modifierState.pathOpacityMultiplier : 1.0;
                const baseColorOpacity = (isLightMode ? 0.32 : 0.45) * pathOpacityMult;
                const colorStr = isLightMode ? '0, 0, 0' : '255, 255, 255';

                const grad = ctx.createLinearGradient(pts[0].x, pts[0].y, endX, endY);
                grad.addColorStop(0, `rgba(${colorStr}, ${baseColorOpacity * 0.25})`);
                grad.addColorStop(1, `rgba(${colorStr}, ${baseColorOpacity})`);

                ctx.strokeStyle = grad;
                ctx.lineWidth = tileSize * 0.038;
                ctx.lineJoin = 'round';
                ctx.lineCap = 'round';

                // Extremely soft pencil drop-shadow to ground it physically on the paper
                if (isHighGraphics) {
                    ctx.shadowColor = isLightMode ? `rgba(0, 0, 0, ${0.05 * pathOpacityMult})` : `rgba(0, 0, 0, ${0.15 * pathOpacityMult})`;
                    ctx.shadowBlur = tileSize * 0.015;
                    ctx.shadowOffsetX = 0;
                    ctx.shadowOffsetY = tileSize * 0.01;
                }

                ctx.stroke();
            }
            ctx.restore();
        }


        // Player
        this.drawPlayer(player, modifierState, theme);

        // Challenge fail black propagation overlay
        if (modifierState.challengeFailProgress > 0) {
            this._failGrid = activeGrid;
            this.drawChallengeFailRipple(modifierState.challengeFailProgress, cols, rows, modifierState.failPlayer || player);
        }


        if (this.debug) {
            this.drawDebugInfo(level);
        }
    }

    drawChallengeFailRipple(progress, cols, rows, player) {
        const { ctx, tileSize } = this;
        const pal = this.palette;

        // Ease out so it starts fast then slows
        const eased = 1 - Math.pow(1 - progress, 2);

        // Ripple expands from player centre outward in tile units
        const maxRadius = Math.hypot(cols, rows) * 1.1;
        const rippleRadius = eased * maxRadius;
        const edgeSoftness = 1.0; // tiles of soft transition

        const isLightMode = pal ? (pal.bg === '#f7f5f2') : false;
        // Grey wash: neutral mid-grey that desaturates wall tiles
        const greyColor = isLightMode ? '130, 130, 130' : '100, 100, 100';
        const playerGreyColor = isLightMode ? '110, 110, 110' : '80, 80, 80';

        // Player screen centre (in tile units)
        const px = player.vx + 0.5;
        const py = player.vy + 0.5;

        // Get the active grid passed through modifierState
        const grid = this._failGrid;

        ctx.save();

        if (grid) {
            for (let y = 0; y < rows; y++) {
                for (let x = 0; x < cols; x++) {
                    // Only paint wall/obstacle tiles
                    if (grid[y][x] !== TILE_WALL) continue;

                    const dist = Math.hypot(x + 0.5 - px, y + 0.5 - py);
                    if (dist > rippleRadius + edgeSoftness) continue;

                    const alpha = Math.min(1, Math.max(0, (rippleRadius - dist) / edgeSoftness));
                    ctx.fillStyle = `rgba(${greyColor}, ${alpha})`;
                    ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
                }
            }
        }

        // Player dot goes black
        if (progress > 0) {
            const cx = player.vx * tileSize + tileSize * 0.5;
            const cy = player.vy * tileSize + tileSize * 0.5;
            ctx.fillStyle = `rgba(${playerGreyColor}, ${Math.min(1, progress * 4)})`;
            ctx.beginPath();
            ctx.arc(cx, cy, tileSize * 0.22, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }


    drawBlock(x, y, color, end, modifierState = {}) {
        const { ctx, tileSize } = this;
        const px = x * tileSize;
        const py = y * tileSize;

        ctx.save();
        ctx.fillStyle = color;

        let scale = 1.0;
        if (modifierState.rippleProgress > 0 && modifierState.rippleProgress < 1 && end) {
            const blockCx = (x + 0.5) * tileSize;
            const blockCy = (y + 0.5) * tileSize;
            const endCx = (end.x + 0.5) * tileSize;
            const endCy = (end.y + 0.5) * tileSize;
            const dist = Math.hypot(blockCx - endCx, blockCy - endCy);
            const dpr = window.devicePixelRatio || 1;
            const maxRadius = Math.max(this.canvas.width / dpr, this.canvas.height / dpr) * 1.2;
            const rippleRadius = modifierState.rippleProgress * maxRadius;
            const rippleThickness = tileSize * 1.5;

            if (Math.abs(dist - rippleRadius) < rippleThickness) {
                const factor = 1 - (Math.abs(dist - rippleRadius) / rippleThickness);
                // Single clean wave pulse: grow to 1.12 scale and contract back smoothly
                scale = 1.0 + 0.12 * Math.sin(factor * Math.PI / 2);
            }
        }

        const w = (tileSize - 2) * scale;
        const h = (tileSize - 2) * scale;
        const drawX = (px + tileSize * 0.5) - w * 0.5;
        const drawY = (py + tileSize * 0.5) - h * 0.5;

        ctx.fillRect(drawX, drawY, w, h);
        ctx.restore();
    }

    drawDockGoal(end, theme) {
        const { ctx, tileSize } = this;
        const cx = (end.x + 0.5) * tileSize;
        const cy = (end.y + 0.5) * tileSize;
        const pal = this.palette;
        const isLightMode = pal ? (pal.bg === '#f7f5f2') : (theme && (theme.id === 'minimal' || theme.id === 'ethereal'));
        const isHighGraphics = window.game ? (window.game.graphics === 1) : true;

        const ringColor = pal ? pal.goalRing : (theme ? theme.colors.accent : 'rgba(255,255,255,0.8)');
        const centerColor = pal ? pal.goalCenter : (isLightMode ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.15)');

        ctx.save();

        // Outer ring (thin full circle)
        const r = tileSize * 0.38;
        ctx.strokeStyle = ringColor;
        ctx.lineWidth = tileSize * 0.025;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();

        // Inner filled circle (subtle)
        ctx.fillStyle = centerColor;
        ctx.beginPath();
        ctx.arc(cx, cy, tileSize * 0.18, 0, Math.PI * 2);
        ctx.fill();

        // Center dot
        ctx.fillStyle = ringColor;
        ctx.beginPath();
        ctx.arc(cx, cy, tileSize * 0.05, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    drawPlayer(player, modifierState = {}, theme) {
        const { ctx, tileSize } = this;
        const cx = (player.vx + 0.5) * tileSize;
        const cy = (player.vy + 0.5) * tileSize;
        const pal = this.palette;
        const isLightMode = pal ? (pal.bg === '#f7f5f2') : (theme && (theme.id === 'minimal' || theme.id === 'ethereal'));

        const playerColor = pal ? pal.player : (isLightMode ? (theme ? theme.colors.text : '#2d3436') : '#ffffff');
        const isHighGraphics = window.game ? (window.game.graphics === 1) : true;

        ctx.save();
        // Physical, grounded drop shadow to look like a premium board game token
        if (isHighGraphics) {
            ctx.shadowColor = isLightMode ? 'rgba(0, 0, 0, 0.16)' : 'rgba(0, 0, 0, 0.38)';
            ctx.shadowBlur = tileSize * 0.08;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = tileSize * 0.04;
        }

        let radiusScale = 0.22;
        if (modifierState.dockProgress > 0) {
            const progress = modifierState.dockProgress;
            radiusScale = 0.22 + 0.08 * Math.sin(progress * Math.PI / 2);
        }

        const isCompletedState = ['DOCKING', 'RIPPLE', 'WIN'].includes(modifierState.state);
        const progress = modifierState.dockProgress || 0;
        const blendProgress = isCompletedState ? (modifierState.state === 'DOCKING' ? progress : 1.0) : 0.0;

        if (isCompletedState && pal && pal.obstacles && pal.obstacles[0]) {
            const envColor = pal.obstacles[0];

            // Draw base player fading out
            if (blendProgress < 1.0) {
                ctx.save();
                ctx.globalAlpha = 1.0 - blendProgress;
                ctx.fillStyle = playerColor;
                ctx.beginPath();
                ctx.arc(cx, cy, tileSize * radiusScale, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }

            // Draw accepted player fading in
            ctx.save();
            ctx.globalAlpha = blendProgress;
            ctx.fillStyle = envColor;
            ctx.beginPath();
            ctx.arc(cx, cy, tileSize * radiusScale, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        } else {
            // Solid, smaller circle
            ctx.fillStyle = playerColor;
            ctx.beginPath();
            ctx.arc(cx, cy, tileSize * radiusScale, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
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
        ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
        ctx.font = `${tileSize * 0.2}px monospace`;

        level.grid.forEach((row, y) => {
            row.forEach((cell, x) => {
                ctx.fillText(`${x},${y}`, x * tileSize + 2, y * tileSize + tileSize * 0.2);
            });
        });
    }

    drawFragileTile(x, y, color) {
        const { ctx, tileSize } = this;
        const px = x * tileSize;
        const py = y * tileSize;

        // Slightly translucent
        ctx.globalAlpha = 0.65;
        ctx.fillStyle = color;
        ctx.fillRect(px, py, tileSize, tileSize);
        ctx.globalAlpha = 1;

        // Crack lines
        ctx.strokeStyle = 'rgba(255,255,255,0.2)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(px + tileSize * 0.5, py + tileSize * 0.15);
        ctx.lineTo(px + tileSize * 0.42, py + tileSize * 0.45);
        ctx.lineTo(px + tileSize * 0.58, py + tileSize * 0.6);
        ctx.lineTo(px + tileSize * 0.5, py + tileSize * 0.88);
        ctx.moveTo(px + tileSize * 0.42, py + tileSize * 0.45);
        ctx.lineTo(px + tileSize * 0.22, py + tileSize * 0.55);
        ctx.moveTo(px + tileSize * 0.58, py + tileSize * 0.6);
        ctx.lineTo(px + tileSize * 0.75, py + tileSize * 0.52);
        ctx.stroke();

        // Dashed border
        ctx.strokeStyle = 'rgba(255,255,255,0.25)';
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        ctx.strokeRect(px + 1, py + 1, tileSize - 2, tileSize - 2);
        ctx.setLineDash([]);
    }

    drawBrokenTile(x, y, color) {
        const { ctx, tileSize } = this;
        const px = x * tileSize;
        const py = y * tileSize;

        ctx.globalAlpha = 0.15;
        ctx.fillStyle = color;
        ctx.fillRect(px, py, tileSize, tileSize);
        ctx.globalAlpha = 1;

        // Rubble dots
        ctx.fillStyle = 'rgba(255,255,255,0.1)';
        const dots = [[0.2, 0.25], [0.55, 0.2], [0.75, 0.65], [0.3, 0.7], [0.6, 0.45]];
        for (const [rx, ry] of dots) {
            ctx.beginPath();
            ctx.arc(px + rx * tileSize, py + ry * tileSize, tileSize * 0.05, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    drawTeleport(x, y, label) {
        const { ctx, tileSize } = this;
        const cx = (x + 0.5) * tileSize;
        const cy = (y + 0.5) * tileSize;
        const r = tileSize * 0.35;

        const colorA = label === 'A' ? '#7c3aed' : '#0ea5e9';
        const colorB = label === 'A' ? '#a78bfa' : '#38bdf8';

        const now = performance.now() / 1000;
        const phase = label === 'A' ? 0 : Math.PI;



        const isHighGraphics = window.game ? (window.game.graphics === 1) : true;

        ctx.save();
        if (isHighGraphics) {
            ctx.shadowColor = colorA;
            ctx.shadowBlur = tileSize * 0.08;
        }

        // Outer ring
        ctx.strokeStyle = colorA;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        // Animated inner arcs
        ctx.lineWidth = 2;
        ctx.strokeStyle = colorB;
        for (let i = 0; i < 3; i++) {
            const start = now * 2.5 + phase + (i * Math.PI * 2) / 3;
            ctx.beginPath();
            ctx.arc(cx, cy, r * 0.6, start, start + 1.1);
            ctx.stroke();
        }

        // Inner dot
        ctx.fillStyle = colorA;
        ctx.beginPath();
        ctx.arc(cx, cy, tileSize * 0.1, 0, Math.PI * 2);
        ctx.fill();

        // Label
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${tileSize * 0.2}px 'Plus Jakarta Sans', sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, cx, cy);
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
    }

    drawStartNode(start) {
        const { ctx, tileSize } = this;
        const cx = (start.x + 0.5) * tileSize;
        const cy = (start.y + 0.5) * tileSize;
        const pal = this.palette;
        const isLightMode = pal ? (pal.bg === '#f7f5f2') : false;

        ctx.save();
        const nodeColor = pal ? pal.path : 'rgba(255,255,255,0.4)';

        // 1. Fill the start node (slightly smaller than player so it is hidden: 0.20 radius)
        ctx.fillStyle = nodeColor;
        ctx.globalAlpha = isLightMode ? 0.07 : 0.12;
        ctx.beginPath();
        ctx.arc(cx, cy, tileSize * 0.20, 0, Math.PI * 2);
        ctx.fill();

        // 2. Dash stroke border
        ctx.strokeStyle = nodeColor;
        ctx.globalAlpha = isLightMode ? 0.15 : 0.25;
        ctx.lineWidth = tileSize * 0.02;
        ctx.setLineDash([tileSize * 0.03, tileSize * 0.03]);
        ctx.beginPath();
        ctx.arc(cx, cy, tileSize * 0.20, 0, Math.PI * 2);
        ctx.stroke();

        ctx.restore();
    }
}
