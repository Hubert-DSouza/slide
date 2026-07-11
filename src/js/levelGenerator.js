import { TILE_EMPTY, TILE_WALL, COLORS } from './constants.js';
import { Solver } from './solver.js';

const TUTORIAL_LEVELS = {
    1: {
        size: { cols: 3, rows: 3 },
        grid: [
            [0, 0, 0],
            [0, 0, 0],
            [0, 0, 0]
        ],
        start: { x: 0, y: 1 },
        end: { x: 2, y: 1 },
        par: 1,
        solution: [{ dx: 1, dy: 0 }],
        score: 15,
        solutionCrossings: 0
    },
    2: {
        size: { cols: 3, rows: 3 },
        grid: [
            [0, 0, 0],
            [0, 0, 0],
            [0, 0, 1]
        ],
        start: { x: 0, y: 0 },
        end: { x: 2, y: 1 },
        par: 2,
        solution: [{ dx: 1, dy: 0 }, { dx: 0, dy: 1 }],
        score: 18,
        solutionCrossings: 0
    },
    3: {
        size: { cols: 3, rows: 3 },
        grid: [
            [0, 0, 0],
            [0, 1, 0],
            [0, 0, 1]
        ],
        start: { x: 0, y: 1 },
        end: { x: 2, y: 1 },
        par: 3,
        solution: [{ dx: 0, dy: -1 }, { dx: 1, dy: 0 }, { dx: 0, dy: 1 }],
        score: 20,
        solutionCrossings: 0
    },
    4: {
        size: { cols: 3, rows: 3 },
        grid: [
            [0, 0, 0],
            [1, 0, 0],
            [0, 0, 0]
        ],
        start: { x: 0, y: 0 },
        end: { x: 0, y: 2 },
        par: 3,
        solution: [{ dx: 1, dy: 0 }, { dx: 0, dy: 1 }, { dx: -1, dy: 0 }],
        score: 22,
        solutionCrossings: 0
    },
    5: {
        size: { cols: 4, rows: 4 },
        grid: [
            [0, 0, 1, 0],
            [0, 0, 0, 0],
            [0, 1, 0, 0],
            [0, 0, 0, 1]
        ],
        start: { x: 0, y: 0 },
        end: { x: 2, y: 2 },
        par: 5,
        solution: [
            { dx: 1, dy: 0 },
            { dx: 0, dy: 1 },
            { dx: 1, dy: 0 },
            { dx: 0, dy: 1 },
            { dx: -1, dy: 0 }
        ],
        score: 25,
        solutionCrossings: 0
    }
};

export class LevelGenerator {
    constructor() {
        this.seed = Date.now();
    }

    // Hash function to disperse sequential seeds
    hash(seed) {
        let h = Math.imul(seed ^ 0x5bd1e995, 0x1b873593);
        h ^= h >>> 15;
        h = Math.imul(h, 0xc2b2ae35);
        h ^= h >>> 13;
        h = Math.imul(h, 0x85ebca6b);
        h ^= h >>> 16;
        return h >>> 0;
    }

    // LCG PRNG for seedable randomness
    mulberry32(a) {
        return function() {
          var t = a += 0x6D2B79F5;
          t = Math.imul(t ^ t >>> 15, t | 1);
          t ^= t + Math.imul(t ^ t >>> 7, t | 61);
          return ((t ^ t >>> 14) >>> 0) / 4294967296;
        }
    }

    generate(config, blockColors = COLORS.BLOCKS, baseSeed = Date.now()) {
        // Handle tutorial levels (1 to 5)
        if (baseSeed >= 1 && baseSeed <= 5) {
            const tutorial = TUTORIAL_LEVELS[baseSeed];
            if (tutorial) {
                const random = this.mulberry32(this.hash(baseSeed));
                const cols = tutorial.size.cols;
                const rows = tutorial.size.rows;
                const colorGrid = Array(rows).fill().map(() => 
                    Array(cols).fill('').map(() => blockColors[Math.floor(random() * blockColors.length)])
                );
                return {
                    ...tutorial,
                    grid: tutorial.grid.map(row => [...row]),
                    colorGrid,
                    seed: baseSeed
                };
            }
        }

        // Handle old signature fallback if needed during transition
        if (typeof config === 'number') {
            config = { size: config, targetScore: 50 };
        }

        const size = config.size || 6;
        const targetScore = config.targetScore || 50;
        const minPath = config.minPath || 5;
        const maxPath = config.maxPath || 20;
        const focus = config.focus || {};
        const density = focus.density || 0.22;
        
        // Tolerance for matching the target score
        const tolerance = 8;
        let bestLevel = null;
        let bestDiff = Infinity;
        
        let attempts = 0;

        // Try up to 200 times to find a level matching the criteria
        while (attempts < 200) {
            // Ensure search spaces for consecutive baseSeeds (like Journey levels) NEVER overlap
            // by jumping by 10,000 for each attempt.
            const trySeed = baseSeed + (attempts * 10000);
            this.seed = trySeed;
            const random = this.mulberry32(this.hash(this.seed));
            
            const grid = Array(size).fill().map(() => Array(size).fill(TILE_EMPTY));
            const colorGrid = Array(size).fill().map(() => 
                Array(size).fill('').map(() => blockColors[Math.floor(random() * blockColors.length)])
            );

            // Generation biases
            if (focus.edgeWalls) {
                // Focus walls on the edges
                for (let y = 0; y < size; y++) {
                    for (let x = 0; x < size; x++) {
                        const isEdge = x === 0 || x === size - 1 || y === 0 || y === size - 1;
                        const d = isEdge ? density * 1.5 : density * 0.5;
                        if (random() < d) grid[y][x] = TILE_WALL;
                    }
                }
            } else if (focus.symmetry) {
                // Symmetrical board
                for (let y = 0; y < size; y++) {
                    for (let x = 0; x < Math.ceil(size / 2); x++) {
                        if (random() < density) {
                            grid[y][x] = TILE_WALL;
                            grid[y][size - 1 - x] = TILE_WALL; // Mirror horizontally
                        }
                    }
                }
            } else {
                // Standard distribution
                for (let y = 0; y < size; y++) {
                    for (let x = 0; x < size; x++) {
                        if (random() < density) grid[y][x] = TILE_WALL;
                    }
                }
            }

            const start = { x: 0, y: Math.floor(random() * size) };
            const end = { x: size - 1, y: Math.floor(random() * size) };
            
            grid[start.y][start.x] = TILE_EMPTY; 
            grid[end.y][end.x] = TILE_EMPTY;

            const analysis = Solver.analyze(size, grid, start, end);
            
            if (analysis.solution && analysis.solution.length >= minPath && analysis.solution.length <= maxPath) {
                const scoreData = this.evaluateLevel(analysis, size, focus);
                const diff = Math.abs(scoreData.normalized - targetScore);
                
                // Track the best level found so far
                const levelData = {
                    size, grid, start, end, 
                    par: analysis.solution.length, 
                    colorGrid, solution: analysis.solution,
                    score: scoreData.normalized, seed: this.seed
                };

                if (diff < bestDiff) {
                    bestDiff = diff;
                    bestLevel = levelData;
                }

                // If it's within tolerance, accept it immediately
                if (diff <= tolerance) {
                    return levelData;
                }
            }

            attempts++;
        }

        // Fallback: return the best we found, or try again with a looser constraint if totally failed
        if (bestLevel) {
            return bestLevel;
        }
        
        // Absolute fallback (should be rare)
        return this.generate(config, blockColors, baseSeed + 1000000);
    }

    evaluateLevel(analysis, size, focus) {
        const { solution, reachableStates, totalMovesExplored, initialMoves, solutionIntersections } = analysis;
        
        const len = solution.length;
        const stateRatio = reachableStates / (size * size);
        const decisionDensity = totalMovesExplored / reachableStates;
        const uniqueDirs = new Set(solution.map(d => `${d.dx},${d.dy}`)).size;

        // Apply focus multipliers to scoring
        const branchWeight = focus.branchWeight || 1.0;
        const deceptionWeight = focus.deceptionWeight || 1.0;
        const stateCompressionWeight = focus.stateCompressionWeight || 1.0;

        let raw = (len * 4) + 
                  (initialMoves * 12 * branchWeight) + 
                  (decisionDensity * 8 * branchWeight) + 
                  (stateRatio * 40 * stateCompressionWeight) + 
                  (uniqueDirs * 4 * deceptionWeight) +
                  ((solutionIntersections || 0) * 15 * branchWeight);
        
        const baseline = 35 + (size / 2); 
        let normalized = ((raw - baseline) / (size * 6)) * 100;
        
        return {
            raw,
            normalized: Math.max(0, Math.min(100, Math.round(normalized)))
        };
    }
}
