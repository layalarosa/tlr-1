class BootScene extends Phaser.Scene {
    constructor() { super({ key: 'BootScene' }); }

    preload() {
        this.load.image('tex_wall', 'assets/sprites/wall.png');
        this.load.image('tex_floor', 'assets/sprites/floor.png');
        this.load.image('tex_ceiling', 'assets/sprites/ceiling.png');
        this.load.image('tex_door', 'assets/sprites/door.png');
        this.load.image('tex_locked', 'assets/sprites/locked.png');
        this.load.image('tex_chest', 'assets/sprites/chest.png');
        this.load.image('tex_pillar', 'assets/sprites/pillar.png');
        this.load.atlas('tex_enemies', 'assets/sprites/enemies.png', 'assets/sprites/enemies.json');
    }

    create() {
        this._generateEnemyFrames();
        AudioManager.generateAll(this);

        var ag = new AssetGenerator(this);
        ag.generateFallbackTiles();

        var self = this;
        document.fonts.ready.then(function() {
            self.scene.start('MenuScene');
        });
    }

    _generateEnemyFrames() {
        if (!this.textures.exists('tex_enemies')) return;
        var atlas = this.textures.get('tex_enemies');
        var src = atlas.getSourceImage();

        var enemyTypes = {
            'slime': ['slime_1', 'slime_2', 'slime_3'],
            'skeleton': ['snake_1', 'snake_2', 'snake_3'],
            'goblin': ['goblin_1', 'goblin_2', 'goblin_3'],
            'bandit': ['cocatrice_1', 'cocatrice_2', 'cocatrice_3'],
            'zombie': ['lizard_1', 'lizard_2', 'lizard_3'],
            'rat': ['rat_1', 'rat_2', 'rat_3'],
            'spider': ['scorpion_1', 'scorpion_2', 'scorpion_3'],
            'wolf': ['wolf_1', 'wolf_2', 'wolf_3'],
            'ghost': ['ghost_1', 'ghost_2', 'ghost_3'],
            'dragon_whelp': ['dragon_1', 'dragon_2', 'dragon_3']
        };

        var self = this;
        Object.keys(enemyTypes).forEach(function(gameKey) {
            var frameNames = enemyTypes[gameKey];
            var frames = [];
            var maxW = 0, maxH = 0;

            for (var i = 0; i < frameNames.length; i++) {
                var f = atlas.get(frameNames[i]);
                if (f && f.cut) {
                    frames.push(f.cut);
                    if (f.cut.width > maxW) maxW = f.cut.width;
                    if (f.cut.height > maxH) maxH = f.cut.height;
                }
            }

            if (frames.length === 0) return;

            var canvas = document.createElement('canvas');
            canvas.width = maxW * frames.length;
            canvas.height = maxH;
            var ctx = canvas.getContext('2d');

            for (var j = 0; j < frames.length; j++) {
                var rect = frames[j];
                ctx.drawImage(src, rect.x, rect.y, rect.width, rect.height, j * maxW, 0, rect.width, rect.height);
            }

            self.textures.addSpriteSheet('enemies_' + gameKey, canvas, { frameWidth: maxW, frameHeight: maxH });
        });
    }

    _generateAudio() {
        var ctx = null;
        try {
            var Ac = window.AudioContext || window.webkitAudioContext;
            ctx = new Ac();
        } catch (e) { return; }

        this._genTone(ctx, 'sfx_hit', 0.08, 200, 'square', 0.3);
        this._genTone(ctx, 'sfx_magic', 0.15, 600, 'sine', 0.2, true);
        this._genTone(ctx, 'sfx_heal', 0.2, 800, 'sine', 0.15, true);
        this._genTone(ctx, 'sfx_step', 0.03, 100, 'square', 0.1);
        this._genTone(ctx, 'sfx_chest', 0.12, 500, 'square', 0.2, true);
        this._genTone(ctx, 'sfx_door', 0.1, 150, 'sawtooth', 0.15);
        this._genTone(ctx, 'sfx_victory', 0.4, 440, 'square', 0.2, true);
        this._genTone(ctx, 'sfx_menu', 0.04, 300, 'square', 0.1);
        this._genTone(ctx, 'sfx_hurt', 0.1, 100, 'sawtooth', 0.25);
        this._genTone(ctx, 'sfx_levelup', 0.3, 660, 'square', 0.15, true);
    }

    _genTone(ctx, key, duration, freq, type, vol, sweep) {
        var sr = ctx.sampleRate;
        var len = Math.floor(sr * duration);
        var buf = ctx.createBuffer(1, len, sr);
        var data = buf.getChannelData(0);

        for (var i = 0; i < len; i++) {
            var t = i / sr;
            var f = sweep ? freq + (t / duration) * 400 : freq;
            var env = 1 - (i / len);
            var sample = 0;

            if (type === 'square') {
                sample = Math.sin(2 * Math.PI * f * t) > 0 ? 1 : -1;
            } else if (type === 'sawtooth') {
                sample = 2 * ((f * t) % 1) - 1;
            } else {
                sample = Math.sin(2 * Math.PI * f * t);
            }

            data[i] = sample * env * vol * 0.5;
        }

        var wavBuf = this._audioBufferToWav(buf);
        this.cache.audio.add(key, { data: wavBuf, context: ctx });
        this.sound.decodeAudio(key, wavBuf);
    }

    _audioBufferToWav(buffer) {
        var numChannels = buffer.numberOfChannels;
        var sr = buffer.sampleRate;
        var bits = 16;
        var data = buffer.getChannelData(0);
        var byteRate = sr * numChannels * bits / 8;
        var blockAlign = numChannels * bits / 8;
        var dataSize = data.length * numChannels * bits / 8;
        var headerSize = 44;
        var ab = new ArrayBuffer(headerSize + dataSize);
        var view = new DataView(ab);

        function writeStr(offset, str) {
            for (var i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
        }
        writeStr(0, 'RIFF');
        view.setUint32(4, 36 + dataSize, true);
        writeStr(8, 'WAVE');
        writeStr(12, 'fmt ');
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true);
        view.setUint16(22, numChannels, true);
        view.setUint32(24, sr, true);
        view.setUint32(28, byteRate, true);
        view.setUint16(32, blockAlign, true);
        view.setUint16(34, bits, true);
        writeStr(36, 'data');
        view.setUint32(40, dataSize, true);

        var offset = 44;
        for (var i = 0; i < data.length; i++) {
            var s = Math.max(-1, Math.min(1, data[i]));
            view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
            offset += 2;
        }
        return ab;
    }
}
