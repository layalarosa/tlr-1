class UITheme {
    constructor(scene) {
        this.scene = scene;
    }

    panel(g, x, y, w, h, options) {
        options = options || {};
        var borderColor = options.borderColor || 0x3333aa;
        var bgColor = options.bgColor || 0x0a0a18;
        var borderAlpha = options.borderAlpha || 0.8;
        var bgAlpha = options.bgAlpha || 0.92;
        var cornerRadius = options.cornerRadius || 8;
        var borderWidth = options.borderWidth || 2;
        var glowColor = options.glowColor || null;

        g.fillStyle(bgColor, bgAlpha);
        g.fillRoundedRect(x, y, w, h, cornerRadius);

        if (glowColor) {
            g.lineStyle(borderWidth + 2, glowColor, 0.3);
            g.strokeRoundedRect(x - 1, y - 1, w + 2, h + 2, cornerRadius + 1);
        }

        g.lineStyle(borderWidth, borderColor, borderAlpha);
        g.strokeRoundedRect(x, y, w, h, cornerRadius);

        this._drawCorners(g, x, y, w, h, borderColor, cornerRadius);
    }

    _drawCorners(g, x, y, w, h, color, r) {
        g.fillStyle(color, 0.6);
        g.fillCircle(x + r, y + r, 2);
        g.fillCircle(x + w - r, y + r, 2);
        g.fillCircle(x + r, y + h - r, 2);
        g.fillCircle(x + w - r, y + h - r, 2);
    }

    titleBar(g, x, y, w, text, txtObj, options) {
        options = options || {};
        var h = options.height || 32;
        var bgColor = options.bgColor || 0x1a1a33;
        var textColor = options.textColor || '#ffaa44';
        var fontSize = options.fontSize || '16px';

        g.fillStyle(bgColor, 0.95);
        g.fillRoundedRect(x, y, w, h, 6);
        g.lineStyle(1, 0x4444aa, 0.6);
        g.strokeRoundedRect(x, y, w, h, 6);

        g.fillStyle(0x3333aa, 0.3);
        g.fillRect(x + 10, y + h - 2, w - 20, 1);

        if (txtObj) {
            txtObj.setText(text);
            txtObj.setPosition(x + w / 2, y + h / 2);
            txtObj.setStyle({ fontSize: fontSize, fontFamily: '"Press Start 2P", monospace', color: textColor });
            txtObj.setOrigin(0.5);
        }
    }

    button(g, x, y, w, h, options) {
        options = options || {};
        var bgColor = options.bgColor || 0x121225;
        var borderColor = options.borderColor || 0x333366;
        var active = options.active || false;
        var hover = options.hover || false;

        var fill = active ? 0x222255 : hover ? 0x1a1a35 : bgColor;
        var border = active ? 0x5555cc : borderColor;

        g.fillStyle(fill, 0.95);
        g.fillRoundedRect(x, y, w, h, 6);
        g.lineStyle(1, border, 0.7);
        g.strokeRoundedRect(x, y, w, h, 6);

        if (active) {
            g.fillStyle(0x4444ff, 0.15);
            g.fillRoundedRect(x + 2, y + 2, w - 4, h - 4, 5);
        }
    }

    hpBar(g, x, y, w, h, pct, options) {
        options = options || {};
        var bgColor = options.bgColor || 0x222228;
        var borderColor = options.borderColor || 0x333344;

        g.fillStyle(bgColor, 0.9);
        g.fillRoundedRect(x, y, w, h, 3);
        g.lineStyle(1, borderColor, 0.5);
        g.strokeRoundedRect(x, y, w, h, 3);

        var barColor = pct > 0.5 ? 0x44ff44 : pct > 0.25 ? 0xffff44 : 0xff4444;
        if (options.color) barColor = options.color;

        if (pct > 0) {
            g.fillStyle(barColor, 0.9);
            g.fillRoundedRect(x + 1, y + 1, Math.max(1, (w - 2) * pct), h - 2, 2);
        }

        if (options.glow && pct > 0) {
            g.fillStyle(barColor, 0.2);
            g.fillRoundedRect(x, y - 1, w, h + 2, 4);
        }
    }

    mpBar(g, x, y, w, h, pct, options) {
        options = options || {};
        options.color = 0x4488ff;
        options.glow = true;
        this.hpBar(g, x, y, w, h, pct, options);
    }

    separator(g, x, y, w, options) {
        options = options || {};
        var color = options.color || 0x3333aa;
        var alpha = options.alpha || 0.4;

        g.lineStyle(1, color, alpha);
        g.lineBetween(x, y, x + w, y);

        g.fillStyle(color, alpha * 0.5);
        g.fillCircle(x + w / 2, y, 2);
    }

    statLabel(g, x, y, label, value, options) {
        options = options || {};
        var labelColor = options.labelColor || '#666688';
        var valueColor = options.valueColor || '#aaaaff';
        var fontSize = options.fontSize || '10px';

        if (g._txtFunc) {
            g._txtFunc(x, y, label + ':', { size: fontSize, color: labelColor });
            g._txtFunc(x + 50, y, '' + value, { size: fontSize, color: valueColor });
        }
    }

    tooltip(g, x, y, text, txtFunc) {
        var padding = 8;
        var lines = text.split('\n');
        var maxW = 0;
        var self = this;

        lines.forEach(function(line) {
            if (line.length * 7 > maxW) maxW = line.length * 7;
        });
        maxW += padding * 2;
        var h = lines.length * 16 + padding * 2;

        g.fillStyle(0x0a0a18, 0.95);
        g.fillRoundedRect(x, y, maxW, h, 4);
        g.lineStyle(1, 0x4444aa, 0.7);
        g.strokeRoundedRect(x, y, maxW, h, 4);

        lines.forEach(function(line, i) {
            if (txtFunc) {
                txtFunc(x + padding, y + padding + i * 16, line, { size: '10px', color: '#ccccff' });
            }
        });
    }

    drawFrame(g, x, y, w, h) {
        g.lineStyle(2, 0x3333aa, 0.6);
        g.strokeRect(x, y, w, h);

        g.lineStyle(1, 0x222266, 0.3);
        g.strokeRect(x + 3, y + 3, w - 6, h - 6);

        g.fillStyle(0x3333aa, 0.15);
        g.fillRect(x, y, w, 2);
        g.fillRect(x, y, 2, h);
    }

    innerShadow(g, x, y, w, h, options) {
        options = options || {};
        var color = options.color || 0x000000;
        var alpha = options.alpha || 0.3;

        g.fillStyle(color, alpha);
        g.fillRect(x, y, w, 3);
        g.fillRect(x, y, 3, h);
        g.fillRect(x + w - 3, y, 3, h);
        g.fillRect(x, y + h - 3, w, 3);
    }
}
