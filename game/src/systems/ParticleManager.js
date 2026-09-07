class ParticleManager {
    constructor(scene) {
        this.scene = scene;
        this._particleTextures = {};
        this._generateParticleTextures();
    }

    _generateParticleTextures() {
        var configs = {
            'particle_white': { color: '#ffffff', size: 4 },
            'particle_red': { color: '#ff4444', size: 4 },
            'particle_orange': { color: '#ff8c00', size: 5 },
            'particle_blue': { color: '#4488ff', size: 4 },
            'particle_ice': { color: '#aaddff', size: 3 },
            'particle_green': { color: '#44ff44', size: 4 },
            'particle_purple': { color: '#aa44ff', size: 4 },
            'particle_yellow': { color: '#ffff44', size: 3 },
            'particle_dark': { color: '#440044', size: 5 },
            'particle_gold': { color: '#ffd700', size: 3 }
        };

        var self = this;
        Object.keys(configs).forEach(function(key) {
            if (self.scene.textures.exists(key)) return;
            var c = configs[key];
            var canvas = document.createElement('canvas');
            canvas.width = c.size;
            canvas.height = c.size;
            var ctx = canvas.getContext('2d');
            ctx.fillStyle = c.color;
            ctx.fillRect(0, 0, c.size, c.size);
            self.scene.textures.addCanvas(key, canvas);
            self._particleTextures[key] = true;
        });
    }

    hitPhysical(x, y) {
        this._emit('particle_white', x, y, {
            speed: { min: 60, max: 150 },
            angle: { min: 0, max: 360 },
            lifespan: 300,
            quantity: 8,
            scale: { start: 1.5, end: 0 },
            alpha: { start: 1, end: 0 },
            gravityY: 100
        });
    }

    hitFire(x, y) {
        this._emit('particle_orange', x, y, {
            speed: { min: 40, max: 100 },
            angle: { min: 250, max: 290 },
            lifespan: 500,
            quantity: 12,
            scale: { start: 1.2, end: 0 },
            alpha: { start: 1, end: 0 },
            gravityY: -50
        });
        this._emit('particle_red', x, y, {
            speed: { min: 20, max: 60 },
            angle: { min: 260, max: 280 },
            lifespan: 400,
            quantity: 6,
            scale: { start: 0.8, end: 0 },
            alpha: { start: 0.8, end: 0 }
        });
    }

    hitIce(x, y) {
        this._emit('particle_ice', x, y, {
            speed: { min: 30, max: 80 },
            angle: { min: 0, max: 360 },
            lifespan: 600,
            quantity: 10,
            scale: { start: 1, end: 0.3 },
            alpha: { start: 0.9, end: 0 },
            rotate: { min: 0, max: 360 }
        });
        this._emit('particle_blue', x, y, {
            speed: { min: 10, max: 40 },
            angle: { min: 240, max: 300 },
            lifespan: 500,
            quantity: 5,
            scale: { start: 0.6, end: 0 },
            alpha: { start: 0.7, end: 0 }
        });
    }

    hitLightning(x, y) {
        this._emit('particle_yellow', x, y, {
            speed: { min: 80, max: 200 },
            angle: { min: 0, max: 360 },
            lifespan: 200,
            quantity: 15,
            scale: { start: 1, end: 0 },
            alpha: { start: 1, end: 0 }
        });
    }

    hitHoly(x, y) {
        this._emit('particle_gold', x, y, {
            speed: { min: 20, max: 60 },
            angle: { min: 250, max: 290 },
            lifespan: 700,
            quantity: 10,
            scale: { start: 0.8, end: 0 },
            alpha: { start: 1, end: 0 },
            gravityY: -30
        });
    }

    hitDark(x, y) {
        this._emit('particle_purple', x, y, {
            speed: { min: 30, max: 80 },
            angle: { min: 0, max: 360 },
            lifespan: 600,
            quantity: 12,
            scale: { start: 1.2, end: 0 },
            alpha: { start: 0.8, end: 0 }
        });
        this._emit('particle_dark', x, y, {
            speed: { min: 10, max: 40 },
            angle: { min: 0, max: 360 },
            lifespan: 800,
            quantity: 8,
            scale: { start: 0.5, end: 1.5 },
            alpha: { start: 0.5, end: 0 }
        });
    }

    heal(x, y) {
        this._emit('particle_green', x, y, {
            speed: { min: 20, max: 50 },
            angle: { min: 250, max: 290 },
            lifespan: 800,
            quantity: 8,
            scale: { start: 0.8, end: 0 },
            alpha: { start: 0.9, end: 0 },
            gravityY: -20
        });
    }

    death(x, y, color) {
        var particleKey = 'particle_white';
        if (color === 'fire') particleKey = 'particle_orange';
        else if (color === 'ice') particleKey = 'particle_ice';
        else if (color === 'dark') particleKey = 'particle_purple';
        else if (color === 'holy') particleKey = 'particle_gold';

        this._emit(particleKey, x, y, {
            speed: { min: 50, max: 150 },
            angle: { min: 0, max: 360 },
            lifespan: 800,
            quantity: 20,
            scale: { start: 1.5, end: 0 },
            alpha: { start: 1, end: 0 },
            gravityY: 50
        });
    }

    floatingDamage(x, y, amount, isMagic, isCrit) {
        var color = isMagic ? '#88aaff' : '#ffffff';
        if (isCrit) color = '#ffff44';
        if (amount === 0) color = '#888888';

        var txt = this.scene.add.text(x, y - 20, amount > 0 ? '-' + amount : 'MISS', {
            fontSize: isCrit ? '18px' : '14px',
            fontFamily: 'monospace',
            color: color,
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5).setDepth(100);

        this.scene.tweens.add({
            targets: txt,
            y: y - 60,
            alpha: 0,
            duration: 1000,
            ease: 'Power2',
            onComplete: function() { txt.destroy(); }
        });
    }

    floatingHeal(x, y, amount) {
        var txt = this.scene.add.text(x, y - 20, '+' + amount, {
            fontSize: '14px',
            fontFamily: 'monospace',
            color: '#44ff44',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5).setDepth(100);

        this.scene.tweens.add({
            targets: txt,
            y: y - 60,
            alpha: 0,
            duration: 1000,
            ease: 'Power2',
            onComplete: function() { txt.destroy(); }
        });
    }

    _emit(textureKey, x, y, config) {
        if (!this.scene.textures.exists(textureKey)) return;
        var particles = this.scene.add.particles(x, y, textureKey, {
            speed: config.speed || { min: 50, max: 100 },
            angle: config.angle || { min: 0, max: 360 },
            lifespan: config.lifespan || 500,
            quantity: config.quantity || 5,
            scale: config.scale || { start: 1, end: 0 },
            alpha: config.alpha || { start: 1, end: 0 },
            gravityY: config.gravityY || 0,
            rotate: config.rotate || 0,
            emitting: false
        });
        particles.setDepth(90);
        particles.explode(config.quantity || 5);
        this.scene.time.delayedCall((config.lifespan || 500) + 100, function() {
            particles.destroy();
        });
    }
}
