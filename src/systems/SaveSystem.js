class SaveSystem {
    constructor() {
        this.SAVE_KEY = 'las_fauces_save';
        this.SETTINGS_KEY = 'las_fauces_settings';
    }

    hasSave() {
        return localStorage.getItem(this.SAVE_KEY) !== null;
    }

    save(gameState) {
        const data = {
            version: '1.0',
            timestamp: Date.now(),
            party: gameState.party.map(c => c.toSaveData()),
            inventory: gameState.inventory,
            gold: gameState.gold,
            dungeon: {
                floor: gameState.floor,
                playerX: gameState.playerX,
                playerY: gameState.playerY,
                playerDir: gameState.playerDir,
                maps: gameState.maps
            },
            playTime: gameState.playTime,
            settings: gameState.settings
        };
        localStorage.setItem(this.SAVE_KEY, JSON.stringify(data));
        return true;
    }

    load() {
        const raw = localStorage.getItem(this.SAVE_KEY);
        if (!raw) return null;
        try {
            const data = JSON.parse(raw);
            data.party = data.party.map(d => Character.fromSaveData(d));
            return data;
        } catch (e) {
            console.error('Error loading save:', e);
            return null;
        }
    }

    deleteSave() {
        localStorage.removeItem(this.SAVE_KEY);
    }

    exportSave() {
        const raw = localStorage.getItem(this.SAVE_KEY);
        if (!raw) return null;
        const blob = new Blob([raw], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `las_fauces_save_${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        return true;
    }

    importSave(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    localStorage.setItem(this.SAVE_KEY, JSON.stringify(data));
                    resolve(true);
                } catch (err) {
                    reject(err);
                }
            };
            reader.readAsText(file);
        });
    }

    saveSettings(settings) {
        localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(settings));
    }

    loadSettings() {
        const raw = localStorage.getItem(this.SETTINGS_KEY);
        if (!raw) return { visualMode: 'retro', musicVolume: 0.5, sfxVolume: 0.7 };
        return JSON.parse(raw);
    }
}
