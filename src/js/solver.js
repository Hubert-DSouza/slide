import { TILE_WALL } from './constants.js';

export class Solver {
    static analyze(size, grid, start, end) {
        const queue = [{ x: start.x, y: start.y, path: [] }];
        const visited = new Map();
        visited.set(`${start.x},${start.y}`, 0);
        
        let totalMovesExplored = 0;
        let solution = null;
        const allPaths = [];

        const dirs = [
            { dx: 1, dy: 0 },
            { dx: -1, dy: 0 },
            { dx: 0, dy: 1 },
            { dx: 0, dy: -1 }
        ];

        let initialMoves = 0;
        for (const d of dirs) {
            let cx = start.x, cy = start.y;
            const nx = cx + d.dx, ny = cy + d.dy;
            if (nx >= 0 && nx < size && ny >= 0 && ny < size && grid[ny][nx] !== TILE_WALL) {
                initialMoves++;
            }
        }

        while (queue.length > 0) {
            const { x, y, path } = queue.shift();
            
            if (x === end.x && y === end.y) {
                if (!solution) solution = path;
                allPaths.push(path);
                continue; // Continue to explore other states for better metrics
            }

            for (const d of dirs) {
                let cx = x, cy = y;
                while (true) {
                    const nx = cx + d.dx, ny = cy + d.dy;
                    if (nx < 0 || nx >= size || ny < 0 || ny >= size || grid[ny][nx] === TILE_WALL) break;
                    cx = nx;
                    cy = ny;
                }

                if (cx === x && cy === y) continue; // No movement
                totalMovesExplored++;

                const key = `${cx},${cy}`;
                if (!visited.has(key) || visited.get(key) > path.length + 1) {
                    visited.set(key, path.length + 1);
                    queue.push({ x: cx, y: cy, path: [...path, d] });
                }
            }
        }

        return {
            solution,
            allPaths,
            reachableStates: visited.size,
            totalMovesExplored,
            initialMoves
        };
    }
}
