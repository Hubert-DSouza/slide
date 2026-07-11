export const TILE_EMPTY = 0;
export const TILE_WALL = 1;
export const TILE_FRAGILE = 2;
export const TILE_TELEPORT_A = 3;
export const TILE_TELEPORT_B = 4;

export const COLORS = {
    BG: '#fdfaf7',
    TEXT: '#2d3436',
    ACCENT: '#d63031',
    PATH: '#2d3436',
    PLAYER_FILL: '#ffffff',
    BLOCKS: ['#e17055', '#819d7d', '#4b6584', '#fab1a0']
};

export const THEMES = {
    LIGHT: {
        id: 'light',
        colors: {
            bg: '#f7f5f2',
            text: '#1a1a1a',
            accent: '#d63031',
            path: 'rgba(0, 0, 0, 0.75)',
            blocks: ['#888', '#777', '#999', '#666', '#aaa']
        }
    },
    DARK: {
        id: 'dark',
        colors: {
            bg: '#111111',
            text: '#ffffff',
            accent: '#d63031',
            path: 'rgba(255, 255, 255, 0.7)',
            blocks: ['#333', '#3a3a3a', '#444', '#2a2a2a', '#4a4a4a']
        }
    }
};

export function getMonochromePalette(seed, themeId = 'dark') {
    let h = Math.imul(seed, 2654435761) >>> 0;
    h ^= h >>> 16;
    const hue = h % 360;

    if (typeof themeId === 'boolean') {
        themeId = themeId ? 'dark' : 'light';
    }

    if (themeId === 'dark') {
        const sat = 30 + (h % 20);
        return {
            bg: '#111111',
            gridLine: 'rgba(255, 255, 255, 0.06)',
            obstacles: [
                `hsl(${hue}, ${sat}%, 30%)`,
                `hsl(${hue}, ${sat}%, 36%)`,
                `hsl(${hue}, ${sat}%, 42%)`,
                `hsl(${hue}, ${sat}%, 48%)`,
                `hsl(${hue}, ${sat}%, 24%)`
            ],
            path: 'rgba(255, 255, 255, 0.7)',
            player: '#ffffff',
            playerInner: '#b8c4cc',
            goalRing: 'rgba(255, 255, 255, 0.8)',
            goalCenter: 'rgba(255, 255, 255, 0.15)'
        };
    } else {
        const sat = 35 + (h % 20);
        return {
            bg: '#f7f5f2',
            gridLine: 'rgba(0, 0, 0, 0.12)',
            obstacles: [
                `hsl(${hue}, ${sat}%, 56%)`,
                `hsl(${hue}, ${sat}%, 49%)`,
                `hsl(${hue}, ${sat}%, 63%)`,
                `hsl(${hue}, ${sat}%, 43%)`,
                `hsl(${hue}, ${sat}%, 69%)`
            ],
            path: 'rgba(0, 0, 0, 0.75)',
            player: '#555555',
            playerInner: '#ffffff',
            goalRing: 'rgba(0, 0, 0, 0.7)',
            goalCenter: 'rgba(0, 0, 0, 0.08)'
        };
    }
}

export const SETTINGS = {
    DEFAULT_SIZE: 9,
    MOVE_SPEED: 0.4,
    STIFFNESS: 0.2,
    DAMPING: 0.45,
    EPSILON: 0.01,
    TOUCH_THRESHOLD: 20,
    ANIMATION_DELAY: 150
};
