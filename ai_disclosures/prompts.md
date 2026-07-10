# AI Prompts History

This document logs the exact prompts used during the prototyping, restructuring, and mechanics refinement phases of the game.

---

## Phase 1: Prototyping & Codebase Restructuring

**Prompt 1 (Initial restucture confirmation)**:
> yas o it

**Prompt 2 (Deployment planning)**:
> will this run on vercel? where should the index.html be

**Prompt 3 (Continuation)**:
> continue

**Prompt 4 (Restructuring status check)**:
> what is happening?

**Prompt 5 (Restructuring execution)**:
> yes finish

**Prompt 6 (Manual restructuring steps)**:
> can you tell me what files to move and delete and what to restructure il do it manually

---

## Phase 2: Build Environment & Dependencies

**Prompt 7 (Rollup module resolution fix)**:
> can you fix this

**Prompt 8 (Windows Script Execution Policy Block)**:
> npm : File C:\Program Files\nodejs\npm.ps1 cannot be loaded because running scripts is disabled on this system. For more information, see about_Execution_Policies at https:/go.microsoft.com/fwlink/?LinkID=135170. At line:1 char:1 + npm run build + ~~~ + CategoryInfo : SecurityError: (:) [], PSSecurityException + FullyQualifiedErrorId : UnauthorizedAccess how to fix this

---

## Phase 3: Grid Rendering & Input Snappiness

**Prompt 9 (Initial bugs & input delays)**:
> okay i think we are up and running first can we fix all the obvious bugs make the board render properly make the path render properly also remove input delay like after i make a swipe i have to wait until i can make the next swipe. obviously not before i complete the full movement. but instantly after that sort of.

**Prompt 10 (Input adjustments)**:
> ok good make the input snappier the board is running fine

**Prompt 11 (Removing input delays)**:
> make the input snapper remove any delays i dont want to wait before giving next input

---

## Phase 4: Physics, Easing & Input Queuing

**Prompt 12 (Disabling standard input queuing)**:
> good but remove input queing

**Prompt 13 (Grid size swap fixes)**:
> the board rendering is broken
> small and large are either too small or going off the grid

**Prompt 14 (Requesting Ease-In-Out movement)**:
> can you make it so that the movement is sort of it accelerates and slows down. like a binomial distribution graph.

**Prompt 15 (Tweaking movement feeling - spring physics)**:
> no it doesnt look good. it should look fluid. almost springy. like whOOOOsh tyoe

**Prompt 16 (Damping oscillations)**:
> okay were getting there reduce the bounce at the end keep it verrrrrrry lesss

**Prompt 17 (Adding smart input queuing window)**:
> can you add input queing but not for the entire path maybe like queue the input if its done in the last 90% of the path

**Prompt 18 (Correcting queue threshold)**:
> no youree right make it last 10 percent i meant

---

## Phase 5: UI & Theme System Initialization

**Prompt 19 (Landing screen & settings menu design)**:
> Okay hear me out
> i want to experiemnt with themes
> well first make a landing or like homepage
> with a play button the name of the game "Slide" and like settings and wtv
