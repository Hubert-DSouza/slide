# Slide

A browser-playable puzzle game built for the Parsewave Game Jam.

## What the Game Is
**NEON SLIDE** is a minimalist cyber-aesthetic 2D puzzle game built around momentum-based sliding mechanics. The player controls a node on a grid, sliding continuously in a chosen direction until hitting an obstacle or wall. The objective is to navigate the grid to reach the exit portal in the fewest moves possible, encouraging forward planning and spatial routing.

## How to Play
- **Controls**: Use Arrow Keys, WASD, or Swipe Gestures (on mobile) to move.
- **Mechanics**: You slide continuously and cannot change direction or stop until you collide with a wall or the grid boundary.
- **Goal**: Reach the exit portal in each level.
- **Undo**: Click the Undo button or press 'Z' to undo moves.
- **Restart**: Click Restart or press 'R' to reset the level.

## What Was Built
- Core sliding physics and instant collision snapping.
- Complete 15-chapter campaign spanning 300 procedurally generated levels with varied difficulty, density, and trap weights.
- Advanced BFS solver that calculates the optimal solution and par score for every level to verify solvability.
- Mobile-responsive UI layout with swipe detection.
- Sound effects integration (swoosh, click, success ripple).


## AI Tools and Platforms Used
- **GPT**: Used for initial prompt engineering, design documentation, and structural layouts.
- **Gemini**: Used for prototyping core level generation, path-solving algorithms, and styling concepts.
- **Antigravity (Google DeepMind)**: Used for code execution, file management, repository structuring, and final building/refining.
- **Google Stitch**: Used for UI design, layout wireframing, and color system orchestration.
- **Vercel**: Platform hosting the live browser-playable game.
- **GitHub**: Used for codebase version control, commit logging, and hosting the public repository.


## Prior Work and Disclosures
- **Core Heuristic / Level Generation Concept**: The infinite level generation mechanic and basic layout concept were experimented with prior to the jam. This repository represents a fresh implementation and expansion built from the ground up during the jam.

## External Libraries and Assets
- **Audio Assets**: Custom UI/interaction sound effects (click, swoosh, ripple) stored under `public/audio/`.


## Running / Playing the Game
Simply open `index.html` (or the main HTML file) in any modern web browser.
