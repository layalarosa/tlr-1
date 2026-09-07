class AudioManager {
    constructor(scene) {
        this.scene = scene;
        this.musicVolume = 0.4;
        this.sfxVolume = 0.5;
        this.currentBgm = null;
        this._bgmKey = null;
    }

    playSfx(key) {
        try {
            this.scene.sound.play(key, { volume: this.sfxVolume });
        } catch (e) {}
    }

    playBgm(key) {
        if (this._bgmKey === key) return;
        this.stopBgm();
        try {
            this.currentBgm = this.scene.sound.add(key, { volume: this.musicVolume, loop: true });
            this.currentBgm.play();
            this._bgmKey = key;
        } catch (e) {}
    }

    stopBgm() {
        if (this.currentBgm) {
            this.currentBgm.stop();
            this.currentBgm.destroy();
            this.currentBgm = null;
            this._bgmKey = null;
        }
    }

    fadeBgm(key, duration) {
        if (this._bgmKey === key) return;
        var self = this;
        if (this.currentBgm) {
            this.scene.tweens.add({
                targets: this.currentBgm,
                volume: 0,
                duration: duration || 1000,
                onComplete: function() {
                    self.stopBgm();
                    self.playBgm(key);
                    if (self.currentBgm) {
                        self.currentBgm.setVolume(0);
                        self.scene.tweens.add({
                            targets: self.currentBgm,
                            volume: self.musicVolume,
                            duration: duration || 1000
                        });
                    }
                }
            });
        } else {
            this.playBgm(key);
        }
    }

    static generateAll(scene) {
        var ctx = null;
        try {
            var Ac = window.AudioContext || window.webkitAudioContext;
            ctx = new Ac();
        } catch (e) { return; }

        var sfxDefs = [
            { key: 'sfx_hit', gen: function(sr) { return AudioManager._wave(ctx, sr, 0.08, 200, 'square', 0.3, false); } },
            { key: 'sfx_magic', gen: function(sr) { return AudioManager._sweep(ctx, sr, 0.15, 400, 800, 'sine', 0.25); } },
            { key: 'sfx_heal', gen: function(sr) { return AudioManager._sweep(ctx, sr, 0.25, 600, 1000, 'sine', 0.2); } },
            { key: 'sfx_step', gen: function(sr) { return AudioManager._noise(ctx, sr, 0.03, 0.08); } },
            { key: 'sfx_chest', gen: function(sr) { return AudioManager._chord(ctx, sr, 0.15, [523, 659, 784], 0.2); } },
            { key: 'sfx_door', gen: function(sr) { return AudioManager._wave(ctx, sr, 0.12, 120, 'sawtooth', 0.15, false); } },
            { key: 'sfx_victory', gen: function(sr) { return AudioManager._melody(ctx, sr, 0.6, [523, 659, 784, 1047], 0.15); } },
            { key: 'sfx_menu', gen: function(sr) { return AudioManager._wave(ctx, sr, 0.04, 400, 'square', 0.1, false); } },
            { key: 'sfx_hurt', gen: function(sr) { return AudioManager._sweep(ctx, sr, 0.1, 300, 100, 'sawtooth', 0.25); } },
            { key: 'sfx_levelup', gen: function(sr) { return AudioManager._melody(ctx, sr, 0.5, [440, 554, 659, 880], 0.18); } },
            { key: 'sfx_crit', gen: function(sr) { return AudioManager._sweep(ctx, sr, 0.12, 150, 500, 'square', 0.35); } },
            { key: 'sfx_miss', gen: function(sr) { return AudioManager._wave(ctx, sr, 0.06, 100, 'sine', 0.1, true); } },
            { key: 'sfx_poison', gen: function(sr) { return AudioManager._sweep(ctx, sr, 0.2, 200, 150, 'sawtooth', 0.15); } },
            { key: 'sfx_revive', gen: function(sr) { return AudioManager._sweep(ctx, sr, 0.3, 200, 800, 'sine', 0.2); } },
            { key: 'sfx_escape', gen: function(sr) { return AudioManager._sweep(ctx, sr, 0.15, 400, 200, 'square', 0.15); } }
        ];

        sfxDefs.forEach(function(def) {
            if (scene.cache.audio.exists(def.key)) return;
            var sr = ctx.sampleRate;
            var buffer = def.gen(sr);
            var wavBuf = AudioManager._audioBufferToWav(buffer, ctx);
            scene.cache.audio.add(def.key, { data: wavBuf, context: ctx });
            scene.sound.decodeAudio(def.key, wavBuf);
        });

        var bgmDefs = [
            { key: 'bgm_menu', gen: function(sr) { return AudioManager._ambient(ctx, sr, 8, [110, 138, 165], 0.08, 0.12); } },
            { key: 'bgm_explore', gen: function(sr) { return AudioManager._ambient(ctx, sr, 12, [98, 130, 165, 196], 0.06, 0.1); } },
            { key: 'bgm_combat', gen: function(sr) { return AudioManager._ambient(ctx, sr, 8, [130, 165, 196, 262], 0.08, 0.15); } },
            { key: 'bgm_boss', gen: function(sr) { return AudioManager._ambient(ctx, sr, 10, [98, 123, 147, 196, 247], 0.1, 0.18); } }
        ];

        bgmDefs.forEach(function(def) {
            if (scene.cache.audio.exists(def.key)) return;
            var sr = ctx.sampleRate;
            var buffer = def.gen(sr);
            var wavBuf = AudioManager._audioBufferToWav(buffer, ctx);
            scene.cache.audio.add(def.key, { data: wavBuf, context: ctx });
            scene.sound.decodeAudio(def.key, wavBuf);
        });
    }

    static _wave(ctx, sr, dur, freq, type, vol, fade) {
        var len = Math.floor(sr * dur);
        var buf = ctx.createBuffer(1, len, sr);
        var data = buf.getChannelData(0);
        for (var i = 0; i < len; i++) {
            var t = i / sr;
            var env = fade ? (1 - i / len) : Math.min(1, (len - i) / (sr * 0.01));
            var sample = 0;
            if (type === 'square') sample = Math.sin(2 * Math.PI * freq * t) > 0 ? 1 : -1;
            else if (type === 'sawtooth') sample = 2 * ((freq * t) % 1) - 1;
            else sample = Math.sin(2 * Math.PI * freq * t);
            data[i] = sample * env * vol * 0.4;
        }
        return buf;
    }

    static _sweep(ctx, sr, dur, fStart, fEnd, type, vol) {
        var len = Math.floor(sr * dur);
        var buf = ctx.createBuffer(1, len, sr);
        var data = buf.getChannelData(0);
        for (var i = 0; i < len; i++) {
            var t = i / sr;
            var f = fStart + (fEnd - fStart) * (t / dur);
            var env = 1 - (i / len);
            var sample = 0;
            if (type === 'square') sample = Math.sin(2 * Math.PI * f * t) > 0 ? 1 : -1;
            else if (type === 'sawtooth') sample = 2 * ((f * t) % 1) - 1;
            else sample = Math.sin(2 * Math.PI * f * t);
            data[i] = sample * env * vol * 0.4;
        }
        return buf;
    }

    static _noise(ctx, sr, dur, vol) {
        var len = Math.floor(sr * dur);
        var buf = ctx.createBuffer(1, len, sr);
        var data = buf.getChannelData(0);
        for (var i = 0; i < len; i++) {
            var env = 1 - (i / len);
            data[i] = (Math.random() * 2 - 1) * env * vol * 0.3;
        }
        return buf;
    }

    static _chord(ctx, sr, dur, freqs, vol) {
        var len = Math.floor(sr * dur);
        var buf = ctx.createBuffer(1, len, sr);
        var data = buf.getChannelData(0);
        for (var i = 0; i < len; i++) {
            var t = i / sr;
            var env = 1 - (i / len);
            var sample = 0;
            freqs.forEach(function(f) { sample += Math.sin(2 * Math.PI * f * t); });
            data[i] = (sample / freqs.length) * env * vol * 0.3;
        }
        return buf;
    }

    static _melody(ctx, sr, dur, freqs, vol) {
        var noteLen = dur / freqs.length;
        var len = Math.floor(sr * dur);
        var buf = ctx.createBuffer(1, len, sr);
        var data = buf.getChannelData(0);
        for (var i = 0; i < len; i++) {
            var t = i / sr;
            var noteIdx = Math.min(Math.floor(t / noteLen), freqs.length - 1);
            var freq = freqs[noteIdx];
            var noteT = t - noteIdx * noteLen;
            var env = Math.max(0, 1 - noteT / noteLen);
            data[i] = Math.sin(2 * Math.PI * freq * t) * env * vol * 0.3;
        }
        return buf;
    }

    static _ambient(ctx, sr, dur, freqs, vol, spread) {
        var len = Math.floor(sr * dur);
        var buf = ctx.createBuffer(1, len, sr);
        var data = buf.getChannelData(0);
        for (var i = 0; i < len; i++) {
            var t = i / sr;
            var sample = 0;
            freqs.forEach(function(f, idx) {
                var mod = 1 + Math.sin(t * 0.5 + idx) * spread;
                sample += Math.sin(2 * Math.PI * f * mod * t) * 0.3;
            });
            var env = 0.5 + 0.5 * Math.sin(t * Math.PI * 2 / dur);
            data[i] = (sample / freqs.length) * env * vol * 0.2;
        }
        return buf;
    }

    static _audioBufferToWav(buffer, audioCtx) {
        var numChannels = 1;
        var sr = audioCtx.sampleRate;
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
