# Slide

![Home Screen](screenshots/home.png)
![Gameplay](screenshots/gameplay.png)

A browser-playable Zen puzzle game built around momentum-based sliding mechanics and procedurally generated infinite levels.

## How to Play
- **Controls**: Use Arrow Keys, WASD, or Swipe Gestures (on mobile) to move.
- **Mechanics**: You slide continuously and cannot change direction or stop until you collide with a wall or the grid boundary.
- **Goal**: Reach the exit portal in each level.
- **Restart**: Click **Reset** or press **R** to reset the level.

## Game Features
- **Interactive Onboarding**: A 5-level interactive tutorial mode that teaches basic movements and guides players step-by-step.
- **Infinite Modes**: Procedurally generated puzzles categorized into three difficulties:
  - **Easy**: 6x6 grid, target optimal path length of 5-7 moves.
  - **Medium**: 9x9 grid, target optimal path length of 7-9 moves.
  - **Hard**: 12x12 grid, target optimal path length of 8-12 moves.
- **Calming Visuals & Audio**: Gentle, seed-based monochrome palettes, satisfying slide swooshes, and soft victory ripples to create a relaxing, meditative puzzle-solving atmosphere.
- **Dynamic Color Schemes**: Seed-based monochrome obstacle styling and dynamic light/dark theme switches.
- **Responsive Layout & Swipe Controls**: A fully responsive mobile phone layout featuring intuitive touch swipe gestures, optimized panel scaling, and dynamic height calculations to prevent viewport overflow.
- **Smart Retraction**: Predictive opposite-direction sliding checks that pop/erase previous path trails if you slide back.

## Technical Highlights
- **100% Solvable Level Guarantee**: Every generated map is instantly tested by a pathfinding algorithm before you play. This ensures that every level is 100% solvable and calculates the exact minimum number of moves to display as your "Par" target.
- **Procedural Color Themes**: The game uses a custom algorithm that converts each level's unique random seed into a distinct color hue. This creates a cohesive, calming monochrome palette for every single level, making each puzzle look fresh and aesthetically pleasing.

## Built During the Jam
- **Modular Project Architecture**: Reorganized a single-file prototype layout into a clean development structure using modular ES modules (`game.js`, `renderer.js`, `input.js`, etc.) compiled with Vite.
- **Infinite Level Generator**: Created a procedural random-walk generator that outputs infinite maps across Easy, Medium, and Hard difficulties.
- **BFS Path Solver**: Integrated a Breadth-First Search solver that verifies level solvability and calculates the exact shortest path length to establish the level "Par" score.
- **Mobile Responsive Layout**: Engineered an adaptive CSS grid layout and touch swipe gesture controls for a polished gameplay experience on phone viewports.
- **Smart Trail Retraction**: Implemented a predictive slide look-ahead engine that dynamically erases previous path segments if the player slides back.
- **Zen Visual & Audio Polish**: Implemented seed-based monochrome HSL styling, victory goal docking/ripples, success vibration triggers, and responsive sound effects.

## AI Tools and Workflow
- **ChatGPT**: Prompt engineering, layout structure planning, and early design concepts.
- **Google Stitch**: UI mockup styling and aesthetic interface design.
- **Gemini**: Prototyping level generation and path-solving algorithms.
- **Antigravity (Google DeepMind)**: Collaborative execution, debugging layout scaling errors, and coding retraction look-ahead check logic.
- **Vite & Vercel**: Production building and deployment.

## Deployment & Repository
- **Live Browser Game**: [zenslide.vercel.app](https://zenslide.vercel.app/)
- **Public Code Repository**: [github.com/Hubert-DSouza/slide](https://github.com/Hubert-DSouza/slide)

## Prior Work & Disclosures
- **Core Engine Mechanics**: The foundational physics skeleton and grid structure concepts were drafted in experiments prior to the jam.
- **Game Jam Contributions**: All onboarding tutorial systems, procedural difficulty configurations, custom segmented settings menus, responsive layout alignments, and path retraction calculations were implemented as part of this game jam entry.

## External Libraries & Assets
- **Engine**: Built with pure Vanilla JS/HTML/CSS without any heavy external game engines or frameworks.
- **Audio Assets**: Custom UI interaction sound effects (click, swoosh, ripple) stored under `public/audio/`.

