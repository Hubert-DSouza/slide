import { TILE_EMPTY, TILE_WALL, COLORS } from './constants.js';
import { Solver } from './solver.js';

export class LevelGenerator {
    constructor() {
        this.seed = Date.now();
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

    generate(size, seed = Date.now()) {
        this.seed = seed;
        const random = this.mulberry32(this.seed);
        
        const grid = Array(size).fill().map(() => Array(size).fill(TILE_EMPTY));
        const colorGrid = Array(size).fill().map(() => 
            Array(size).fill('').map(() => COLORS.BLOCKS[Math.floor(random() * COLORS.BLOCKS.length)])
        );

        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                if (random() < 0.22) grid[y][x] = TILE_WALL;
            }
        }

        const start = { x: 0, y: Math.floor(random() * size) };
        const end = { x: size - 1, y: Math.floor(random() * size) };
        
        grid[start.y][start.x] = TILE_EMPTY; 
        grid[end.y][end.x] = TILE_EMPTY;

        const solution = Solver.solve(size, grid, start, end);
        
        // If no solution or too easy, regenerate with a new seed
        if (!solution || solution.length < 5) {
            return this.generate(size, seed + 1);
        }

        return { 
            size, 
            grid, 
            start, 
            end, 
            par: solution.length, 
            colorGrid, 
            solution,
            seed: this.seed
        };
    }
}
