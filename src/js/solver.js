import { TILE_WALL } from './constants.js';

export class Solver {
    static solve(size, grid, start, end) {
        const queue = [{ x: start.x, y: start.y, path: [] }];
        const visited = new Set([`${start.x},${start.y}`]);
        const dirs = [
            { dx: 1, dy: 0 },
            { dx: -1, dy: 0 },
            { dx: 0, dy: 1 },
            { dx: 0, dy: -1 }
        ];

        while (queue.length > 0) {
            const { x, y, path } = queue.shift();
            if (x === end.x && y === end.y) return path;

            for (const d of dirs) {
                let cx = x, cy = y;
                while (true) {
                    const nx = cx + d.dx, ny = cy + d.dy;
                    if (
                        nx < 0 || nx >= size || 
                        ny < 0 || ny >= size || 
                        grid[ny][nx] === TILE_WALL
                    ) break;
                    cx = nx;
                    cy = ny;
                }

                const key = `${cx},${cy}`;
                if (!visited.has(key)) {
                    visited.add(key);
                    const newPath = [...path, d];
                    queue.push({ x: cx, y: cy, path: newPath });
                }
            }
        }
        return null;
    }
}
