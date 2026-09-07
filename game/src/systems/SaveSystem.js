class SaveSystem {
    constructor() {
        this.SAVE_KEY = 'the_last_riders_save';
        this.SETTINGS_KEY = 'the_last_riders_settings';
    }

    hasSave() {
        return localStorage.getItem(this.SAVE_KEY) !== null;
    }

    save(gameState) {
        const party = Array.isArray(gameState.party) ? gameState.party : [];
        const data = {
            version: '1.1',
            timestamp: Date.now(),
            party: party.map(c => c.toSaveData()),
            inventory: Array.isArray(gameState.inventory) ? gameState.inventory : [],
            customItems: party.reduce(function(items, character) {
                Object.keys(character.equipment || {}).forEach(function(slot) {
                    var itemId = character.equipment[slot];
                    var item = itemId ? getCustomItem(itemId) : null;
                    if (item && !items.some(function(saved) { return saved.id === item.id; })) items.push(item);
                });
                return items;
            }, []),
            gold: Number.isFinite(gameState.gold) ? gameState.gold : 0,
            dungeon: {
                floor: Number.isInteger(gameState.floor) ? gameState.floor : 1,
                playerX: Number.isFinite(gameState.playerX) ? gameState.playerX : 0,
                playerY: Number.isFinite(gameState.playerY) ? gameState.playerY : 0,
                playerDir: Number.isInteger(gameState.playerDir) ? gameState.playerDir : 0,
                maps: gameState.maps || {}
            },
            storyState: gameState.storyState || createStoryState(),
            playTime: Number.isFinite(gameState.playTime) ? gameState.playTime : 0,
            settings: gameState.settings || this.loadSettings()
        };
        localStorage.setItem(this.SAVE_KEY, JSON.stringify(data));
        return true;
    }

    load() {
        const raw = localStorage.getItem(this.SAVE_KEY);
        if (!raw) return null;
        try {
            const data = JSON.parse(raw);
            if (!this.isValidSaveData(data)) return null;
            this._restoreCustomItems(data);
            data.party = data.party.map(d => Character.fromSaveData(d));
            return data;
        } catch (e) {
            console.error('Error loading save:', e);
            return null;
        }
    }

    isValidSaveData(data) {
        if (!data || !Array.isArray(data.party) || data.party.length === 0 || !data.dungeon) return false;
        if (!Number.isInteger(data.dungeon.floor) || data.dungeon.floor < 1 || data.dungeon.floor > 15 || !Number.isFinite(data.dungeon.playerX) || !Number.isFinite(data.dungeon.playerY)) return false;
        if (!data.dungeon.maps || typeof data.dungeon.maps !== 'object' || Array.isArray(data.dungeon.maps)) return false;
        var map = data.dungeon.maps[data.dungeon.floor];
        if (!map || !Number.isInteger(map.width) || !Number.isInteger(map.height) || !Array.isArray(map.map) || map.map.length !== map.height) return false;
        if (data.dungeon.playerX < 0 || data.dungeon.playerX >= map.width || data.dungeon.playerY < 0 || data.dungeon.playerY >= map.height) return false;
        if (!Array.isArray(data.inventory) || !Number.isFinite(data.gold)) return false;
        if (data.storyState !== undefined && (!Number.isInteger(data.storyState.chapter) || typeof data.storyState.objective !== 'string' || !data.storyState.flags || !data.storyState.seenMilestones)) return false;
        for (var i = 0; i < data.party.length; i++) {
            var character = data.party[i];
            if (!character || !character.name || !RACES[character.raceId] || !CLASSES[character.classId] || !ALIGNMENTS[character.alignmentId]) return false;
        }
        return true;
    }

    _restoreCustomItems(data) {
        (data.customItems || []).forEach(function(item) {
            if (item && item.id) registerCustomItem(item);
        });
        data.inventory.forEach(function(entry) {
            if (entry && entry.customItem && entry.customItem.id) registerCustomItem(entry.customItem);
        });
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
        a.download = `the_last_riders_save_${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(function() { URL.revokeObjectURL(url); }, 5000);
        return true;
    }

    importSave(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    if (!this.isValidSaveData(data)) {
                        reject(new Error('Formato de guardado invalido'));
                        return;
                    }
                    this._restoreCustomItems(data);
                    data.party.forEach(function(character) { Character.fromSaveData(character); });
                    localStorage.setItem(this.SAVE_KEY, JSON.stringify(data));
                    resolve(true);
                } catch (err) {
                    reject(err);
                }
            };
            reader.onerror = () => reject(new Error('No se pudo leer el archivo de guardado'));
            reader.readAsText(file);
        });
    }

    saveSettings(settings) {
        localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(settings));
    }

    loadSettings() {
        const raw = localStorage.getItem(this.SETTINGS_KEY);
        if (!raw) return { visualMode: 'retro', musicVolume: 0.5, sfxVolume: 0.7 };
        try {
            return JSON.parse(raw);
        } catch (e) {
            return { visualMode: 'retro', musicVolume: 0.5, sfxVolume: 0.7 };
        }
    }
}
