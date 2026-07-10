export const TILE_EMPTY = 0;
export const TILE_WALL = 1;

export const COLORS = {
    BG: '#fdfaf7',
    TEXT: '#2d3436',
    ACCENT: '#d63031',
    PATH: '#2d3436',
    PLAYER_FILL: '#ffffff',
    BLOCKS: ['#e17055', '#819d7d', '#4b6584', '#fab1a0']
};

export const THEMES = {
    MINIMAL: {
        id: 'minimal',
        colors: {
            bg: '#fdfaf7',
            text: '#2d3436',
            accent: '#d63031',
            blocks: ['#e17055', '#819d7d', '#4b6584', '#fab1a0']
        }
    },
    ETHEREAL: {
        id: 'ethereal',
        colors: {
            bg: '#FDFBF7',
            text: '#5D677A',
            accent: '#D4A373',
            path: '#A5A6F6',
            blocks: ['#E2E4F6', '#F6E2E2', '#E2F6E2', '#F6F6E2']
        }
    }
};

export const SETTINGS = {
    DEFAULT_SIZE: 9,
    MOVE_SPEED: 0.4,
    STIFFNESS: 0.2,
    DAMPING: 0.45,
    EPSILON: 0.01,
    TOUCH_THRESHOLD: 20,
    ANIMATION_DELAY: 150
};
