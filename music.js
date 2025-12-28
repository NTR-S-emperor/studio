// music.js - Background music manager

window.MusicPlayer = {
    tracks: [],
    recentlyPlayed: [],
    audio: null,
    currentTrack: null,
    volume: 0.2,
    isInitialized: false,
    isPlaying: false,
    audioUnlocked: false,

    /**
     * Initialize the music player
     */
    async init() {
        if (this.isInitialized) return;

        // Create audio element IMMEDIATELY so we can unlock it on first interaction
        this.audio = new Audio();
        this.audio.volume = this.volume;

        // When a track ends, play the next one
        this.audio.addEventListener('ended', () => {
            this.playNext();
        });

        // Load volume from Settings
        this.loadVolumeFromSettings();

        // Listen for user interactions IMMEDIATELY
        this.setupUserInteractionListener();

        // Load the music list
        try {
            const response = await fetch('music.php');
            this.tracks = await response.json();
        } catch (error) {
            return;
        }

        if (this.tracks.length === 0) {
            return;
        }

        this.isInitialized = true;
        // Music playback is now started manually after story selection
    },

    /**
     * Set up user interaction listener
     * (required because browsers block autoplay)
     */
    setupUserInteractionListener() {
        const unlockAudio = () => {
            if (this.audioUnlocked) return;

            this.audioUnlocked = true;

            // Only unlock audio context, don't start playback
            // Playback is started manually after story selection
            if (this.audio) {
                // Unlock audio with silent play/pause
                this.audio.src = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=';
                const playPromise = this.audio.play();
                if (playPromise !== undefined) {
                    playPromise.then(() => {
                        this.audio.pause();
                        this.audio.currentTime = 0;
                        this.audio.src = '';
                    }).catch(() => {});
                }
            }

            document.removeEventListener('click', unlockAudio);
            document.removeEventListener('touchend', unlockAudio);
            document.removeEventListener('keydown', unlockAudio);
        };

        // Use touchend and click - touchstart is NOT a valid user gesture on mobile
        document.addEventListener('click', unlockAudio);
        document.addEventListener('touchend', unlockAudio);
        document.addEventListener('keydown', unlockAudio);
    },

    /**
     * Load volume from saved settings
     */
    loadVolumeFromSettings() {
        const saved = localStorage.getItem('studioSettings');
        if (saved) {
            try {
                const settings = JSON.parse(saved);
                if (typeof settings.musicVolume === 'number') {
                    this.setVolume(settings.musicVolume / 100);
                }
            } catch (e) {}
        }
    },

    /**
     * Select a random track (avoiding the last 3)
     */
    getRandomTrack() {
        if (this.tracks.length === 0) return null;

        const minInterval = Math.min(3, this.tracks.length - 1);

        const availableTracks = this.tracks.filter(track => {
            return !this.recentlyPlayed.slice(-minInterval).includes(track);
        });

        const pool = availableTracks.length > 0 ? availableTracks :
            this.tracks.filter(t => t !== this.currentTrack);

        if (pool.length === 0) {
            return this.tracks[0];
        }

        const randomIndex = Math.floor(Math.random() * pool.length);
        return pool[randomIndex];
    },

    /**
     * Play a track
     */
    playTrack(track) {
        if (!this.audio || !track) return;

        this.currentTrack = track;
        this.audio.src = track;
        this.audio.play().then(() => {
            this.isPlaying = true;
        }).catch(() => {});

        this.recentlyPlayed.push(track);
        if (this.recentlyPlayed.length > 3) {
            this.recentlyPlayed.shift();
        }
    },

    /**
     * Start playback
     */
    play() {
        if (!this.isInitialized) return;

        const track = this.getRandomTrack();
        if (track) {
            this.playTrack(track);
        }
    },

    /**
     * Play next track
     */
    playNext() {
        const track = this.getRandomTrack();
        if (track) {
            this.playTrack(track);
        }
    },

    /**
     * Pause
     */
    pause() {
        if (this.audio) {
            this.audio.pause();
            this.isPlaying = false;
        }
    },

    /**
     * Resume playback
     */
    resume() {
        if (this.audio && this.currentTrack) {
            this.audio.play().then(() => {
                this.isPlaying = true;
            }).catch(() => {});
        }
    },

    /**
     * Set volume (0 to 1)
     */
    setVolume(value) {
        this.volume = Math.max(0, Math.min(1, value));
        if (this.audio) {
            this.audio.volume = this.volume;
        }
    },

    /**
     * Set volume from percentage (0 to 100)
     */
    setVolumePercent(percent) {
        this.setVolume(percent / 100);
    }
};

// Initialize player on load
document.addEventListener('DOMContentLoaded', () => {
    MusicPlayer.init();
});
