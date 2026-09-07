class ScreenEffects {
    constructor(scene) {
        this.scene = scene;
    }

    shake(intensity, duration) {
        this.scene.cameras.main.shake(duration || 100, intensity || 0.01);
    }

    flash(color, duration) {
        this.scene.cameras.main.flash(duration || 200, color || 255, 0, 0, false);
    }

    hitFlash() {
        this.scene.cameras.main.flash(150, 255, 100, 100, false);
    }

    critShake() {
        this.scene.cameras.main.shake(200, 0.02);
    }

    magicFlash(color) {
        var r = 100, g = 100, b = 255;
        if (color === 'fire') { r = 255; g = 100; b = 0; }
        else if (color === 'ice') { r = 100; g = 200; b = 255; }
        else if (color === 'lightning') { r = 255; g = 255; b = 100; }
        else if (color === 'holy') { r = 255; g = 255; b = 200; }
        else if (color === 'dark') { r = 100; g = 0; b = 150; }
        this.scene.cameras.main.flash(250, r, g, b, false);
    }

    victoryFlash() {
        this.scene.cameras.main.flash(400, 255, 255, 200, false);
    }

    damageVignette() {
        var cam = this.scene.cameras.main;
        cam.flash(300, 180, 0, 0, false);
    }

    healEffect() {
        this.scene.cameras.main.flash(300, 100, 255, 100, false);
    }

    fadeOut(duration, callback) {
        this.scene.cameras.main.fadeOut(duration || 500, 0, 0, 0);
        if (callback) {
            this.scene.cameras.main.once('camerafadeoutcomplete', callback);
        }
    }

    fadeIn(duration) {
        this.scene.cameras.main.fadeIn(duration || 500, 0, 0, 0);
    }
}
