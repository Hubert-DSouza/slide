/**
 * Block Slide — Sound Engine
 * Uses HTMLAudioElement for simple, reliable audio playback.
 *
 * Files expected in /public/audio/:
 *   swoosh.mp3  — player swipe / slide
 *   ripple.mp3  — player lands on tile / reaches goal
 *   click.mp3   — button press
 */
export class SoundEngine {
    constructor() {
        this.muted = false;

        // Pre-create Audio elements for each sound
        this._sounds = {
            swoosh: new Audio('/audio/swoosh.mp3'),
            ripple: new Audio('/audio/ripple.mp3'),
            click:  new Audio('/audio/click.mp3'),
        };

        // Set default volumes
        this._sounds.swoosh.volume = 0.7;
        this._sounds.ripple.volume = 0.6;
        this._sounds.click.volume  = 0.45;
    }

    setMuted(val) {
        this.muted = val;
    }

    /**
     * Plays a sound, restarting from the beginning if it's already playing.
     */
    _play(key, volumeOverride = null) {
        if (this.muted) return;
        const snd = this._sounds[key];
        if (!snd) return;
        if (volumeOverride !== null) snd.volume = volumeOverride;
        snd.currentTime = 0;
        snd.play().catch(() => {}); // Silently ignore autoplay blocks
    }

    /** Player swipes / slides */
    playSlide() {
        // Vary pitch ±30% randomly — clearly audible on a short sound
        this._sounds.swoosh.playbackRate = 0.7 + Math.random() * 0.6;
        this._play('swoosh');
    }

    /** Player lands on a tile */
    playLand() {
        this._play('ripple');
    }

    /** Player reaches the goal */
    playWin() {
        this._play('ripple', 1.0);
    }

    /** Undo move */
    playUndo() {
        this._play('swoosh', 0.4);
    }

    /** Button click */
    playClick() {
        this._play('click');
    }
}
