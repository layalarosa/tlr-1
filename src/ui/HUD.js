class HUD {
    constructor(scene) {
        this.scene = scene;
        this.graphics = scene.add.graphics();
        this.texts = [];
        this.visible = true;
    }

    draw(party, floor, gold, playTime) {
        if (!this.visible) return;
        this.clear();

        const w = this.scene.cameras.main.width;
        const h = this.scene.cameras.main.height;

        this.graphics.fillStyle(0x000000, 0.85);
        this.graphics.fillRect(0, h - 100, w, 100);
        this.graphics.lineStyle(2, 0x4444aa);
        this.graphics.strokeRect(0, h - 100, w, 100);

        const self = this;
        party.forEach(function(char, i) {
            const x = 10;
            const y = h - 95 + i * 23;
            const nameColor = char.isAlive() ? '#ffffff' : '#666666';

            self._text(char.name, x, y, nameColor, '12px');

            const hpPct = char.hp / char.maxHp;
            const hpColor = hpPct > 0.5 ? '#44ff44' : hpPct > 0.25 ? '#ffff44' : '#ff4444';
            self._text('HP:' + char.hp + '/' + char.maxHp, x + 90, y, hpColor, '11px');

            if (char.maxMp > 0) {
                self._text('MP:' + char.mp + '/' + char.maxMp, x + 200, y, '#4488ff', '11px');
            }

            self._text('Lv.' + char.level, x + 310, y, '#ffaa44', '11px');
        });

        this._text('Piso ' + floor, w - 80, h - 95, '#aaaaff', '13px');
        this._text('Oro: ' + gold, w - 80, h - 78, '#ffff44', '11px');
        this._text(playTime, w - 80, h - 62, '#aaaaaa', '11px');
    }

    _text(str, x, y, color, size) {
        const t = this.scene.add.text(x, y, str, {
            fontSize: size || '12px',
            fontFamily: 'monospace',
            color: color || '#ffffff'
        }).setDepth(50);
        this.texts.push(t);
        return t;
    }

    clear() {
        this.graphics.clear();
        const self = this;
        this.texts.forEach(function(t) { t.destroy(); });
        this.texts = [];
    }

    toggle() {
        this.visible = !this.visible;
        if (!this.visible) this.clear();
    }
}
