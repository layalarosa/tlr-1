class ExploreScene extends Phaser.Scene {
    constructor() { super({ key: 'ExploreScene' }); }

    init(data) {
        this.saveSys = new SaveSystem();
        this.dg = new DungeonGenerator();

        if (data.saveData) {
            var sd = data.saveData;
            this.party = sd.party;
            this.gold = sd.gold;
            this.inventory = sd.inventory;
            this.currentFloor = sd.dungeon.floor;
            this.px = sd.dungeon.playerX;
            this.py = sd.dungeon.playerY;
            this.pdir = sd.dungeon.playerDir || 0;
            this.maps = sd.dungeon.maps;
            this.playTime = sd.playTime || 0;
        } else {
            this.party = data.party;
            this.gold = 50;
            this.inventory = [{ itemId: 'POTION', quantity: 5 }, { itemId: 'ANTIDOTE', quantity: 2 }];
            this.currentFloor = 1;
            this.pdir = 0;
            this.maps = {};
            this.playTime = 0;
        }

        if (!this.maps[this.currentFloor]) {
            this.maps[this.currentFloor] = this.dg.generate(this.currentFloor);
            this.px = this.maps[this.currentFloor].playerStart.x;
            this.py = this.maps[this.currentFloor].playerStart.y;
        }

        this.encounterRate = 0.1;
        this.moving = false;
        this.menuOpen = false;
        this.visualMode = 'modern';
        this._autoSaveTimer = null;
    }

    create() {
        this.gfx = this.add.graphics();
        this.texts = {};
        this.compassTxt = this.add.text(GAME_W / 2, 278, '', { fontSize: '14px', fontFamily: '"Share Tech Mono", monospace', color: '#aaaaff' }).setOrigin(0.5).setDepth(10);
        this.msgTxt = this.add.text(GAME_W / 2, 10, '', { fontSize: '16px', fontFamily: '"VT323", monospace', color: '#ffffff', backgroundColor: '#000000cc', padding: { x: 6, y: 3 } }).setOrigin(0.5, 0).setDepth(100);
        this.hudGfx = this.add.graphics().setDepth(20);
        this.hudTxts = [];
        this._wallImg = null;
        this._tempImages = [];
        this.ui = new UITheme(this);
        this.audio = new AudioManager(this);
        this.fx = new ScreenEffects(this);
        this.audio.playBgm('bgm_explore');
        this._reveal();
        this._draw();
        this._updateHUD();
        this._setupKeys();
        this._autoSave();
        this.cameras.main.fadeIn(500, 0, 0, 0);
    }

    _setupKeys() {
        var self = this;
        var k = this.input.keyboard;
        k.on('keydown-W', function() { if (!self.menuOpen) self._move(0); });
        k.on('keydown-UP', function() { if (!self.menuOpen) self._move(0); });
        k.on('keydown-S', function() { if (!self.menuOpen) self._move(2); });
        k.on('keydown-DOWN', function() { if (!self.menuOpen) self._move(2); });
        k.on('keydown-A', function() { if (!self.menuOpen) self._turn(-1); });
        k.on('keydown-LEFT', function() { if (!self.menuOpen) self._turn(-1); });
        k.on('keydown-D', function() { if (!self.menuOpen) self._turn(1); });
        k.on('keydown-RIGHT', function() { if (!self.menuOpen) self._turn(1); });
        k.on('keydown-Q', function() { if (!self.menuOpen) self._strafe(-1); });
        k.on('keydown-E', function() { if (!self.menuOpen) self._strafe(1); });
        k.on('keydown-SPACE', function() { if (!self.menuOpen) self._interact(); });
        k.on('keydown-ENTER', function() { if (!self.menuOpen) self._interact(); });
        k.on('keydown-I', function() { if (self.menuOpen) return; self.menuOpen = true; self.scene.launch('InventoryScene', { party: self.party, inventory: self.inventory, gold: self.gold, onclose: function() { self.menuOpen = false; self.scene.stop('InventoryScene'); self.scene.resume(); } }); self.scene.pause(); });
        k.on('keydown-F5', function() { self._quickSave(); });
        k.on('keydown-V', function() {
            self.visualMode = self.visualMode === 'modern' ? 'retro' : 'modern';
            self._draw();
            self._showMsg('Visual: ' + self.visualMode);
        });
    }

    _getDir() {
        return [{ dx: 0, dy: -1 }, { dx: 1, dy: 0 }, { dx: 0, dy: 1 }, { dx: -1, dy: 0 }][this.pdir];
    }

    _canGo(x, y) {
        var map = this.maps[this.currentFloor];
        if (y < 0 || y >= map.height || x < 0 || x >= map.width) return false;
        var t = map.map[y][x];
        return t.type === 'floor' || t.type === 'door' || t.type === 'stairs' || t.type === 'shop';
    }

    _move(relDir) {
        if (this.moving) return;
        var dirs = [{ dx: 0, dy: -1 }, { dx: 1, dy: 0 }, { dx: 0, dy: 1 }, { dx: -1, dy: 0 }];
        var targetDir = (this.pdir + relDir) % 4;
        var nx = this.px + dirs[targetDir].dx;
        var ny = this.py + dirs[targetDir].dy;
        if (this._canGo(nx, ny)) {
            this.moving = true;
            this.px = nx;
            this.py = ny;
            this._afterMove();
        } else {
            this._msg('No puedes ir ahi');
        }
    }

    _turn(d) {
        this.pdir = (this.pdir + d + 4) % 4;
        this._reveal();
        this._draw();
    }

    _strafe(d) {
        if (this.moving) return;
        var sd = [{ dx: 0, dy: -1 }, { dx: 1, dy: 0 }, { dx: 0, dy: 1 }, { dx: -1, dy: 0 }][(this.pdir + d + 4) % 4];
        var nx = this.px + sd.dx, ny = this.py + sd.dy;
        if (this._canGo(nx, ny)) {
            this.moving = true;
            this.px = nx;
            this.py = ny;
            this._afterMove();
        }
    }

    _afterMove() {
        this._reveal();
        var tileAction = this._checkTile();
        this._draw();
        this._updateHUD();
        this.playTime++;
        this.moving = false;
        this._playSound('sfx_step');
        if (tileAction) return;
        if (Math.random() < this.encounterRate) this._encounter();
    }

    _checkTile() {
        var map = this.maps[this.currentFloor];
        var t = map.map[this.py][this.px];
        if (t.trap && !t.trapDone) {
            t.trapDone = true;
            this._trap(t.trapType);
        }
        if (t.type === 'stairs') { this._goDown(); return true; }
        if (t.type === 'shop') { this._enterShop(); return true; }
        return false;
    }

    _trap(type) {
        var self = this;
        var msg = getTrapMessage(type);
        if (type === 'poison') { this.party.forEach(function(c) { if (c.isAlive() && c.statusEffects.indexOf('poison') === -1) c.statusEffects.push('poison'); }); }
        else if (type === 'fire') { this.party.forEach(function(c) { if (c.isAlive()) c.hp = Math.max(1, c.hp - 8); }); }
        else if (type === 'pit') { var s = self.maps[self.currentFloor].playerStart; self.px = s.x; self.py = s.y; }
        else if (type === 'alarm') { self.encounterRate = Math.min(0.5, self.encounterRate + 0.1); }
        this._msg(msg);
        this._updateHUD();
    }

    _goDown() {
        if (this.currentFloor >= 15) { this._msg('La cima! Jefe final pronto'); return; }
        this.currentFloor++;
        if (!this.maps[this.currentFloor]) {
            this.maps[this.currentFloor] = this.dg.generate(this.currentFloor);
        }
        var s = this.maps[this.currentFloor].playerStart;
        this.px = s.x; this.py = s.y;
        this._reveal(); this._draw();
        this._msg('Piso ' + this.currentFloor + ': ' + this.maps[this.currentFloor].name);
        var desc = getFloorDescription(this.currentFloor);
        if (desc) { var self = this; setTimeout(function() { self._msg(desc); }, 3000); }
    }

    _enterShop() {
        var self = this;
        this.menuOpen = true;
        this.scene.launch('ShopScene', {
            party: this.party, inventory: this.inventory, gold: this.gold, floor: this.currentFloor,
            onclose: function(data) { self.gold = data.gold; self.inventory = data.inventory; self.menuOpen = false; self.scene.stop('ShopScene'); self.scene.resume(); self._updateHUD(); }
        });
        this.scene.pause();
    }

    _interact() {
        var map = this.maps[this.currentFloor];
        var fd = this._getDir();
        var fx = this.px + fd.dx, fy = this.py + fd.dy;
        if (fy < 0 || fy >= map.height || fx < 0 || fx >= map.width) return;
        var t = map.map[fy][fx];

        if (t.type === 'door') {
            if (t.locked) {
                var hasKey = this.inventory.some(function(i) { return i.itemId === 'FLOOR_KEY' && i.quantity > 0; });
                if (hasKey) {
                    var key = this.inventory.find(function(i) { return i.itemId === 'FLOOR_KEY'; });
                    key.quantity--;
                    if (key.quantity <= 0) this.inventory = this.inventory.filter(function(i) { return i !== key; });
                    t.locked = false; t.type = 'floor'; this._msg('Puerta abierta con llave');
                    this._playSound('sfx_door');
                } else { this._msg('Cerrada con llave'); }
            } else { t.type = 'floor'; this._msg('Puerta abierta'); this._playSound('sfx_door'); }
            this._draw();
        }
        if (t.chest && !t.chestOpen) {
            t.chestOpen = true;
            var loot = t.chestLoot;
            this.gold += loot.gold;
            var self = this;
            var lootNames = [];
            loot.items.forEach(function(item) {
                if (item && item.affixed) {
                    self.inventory.push({ itemId: item.itemData.id, quantity: 1, customItem: item.itemData });
                    lootNames.push(item.itemData.name);
                } else if (typeof item === 'string') {
                    self._addInv(item);
                    lootNames.push(ITEMS[item].name);
                }
            });
            var msg = getChestMessage() + ' +' + loot.gold + ' oro';
            if (lootNames.length) msg += ' + ' + lootNames.join(', ');
            this._msg(msg);
            this._playSound('sfx_chest');
            this._updateHUD();
        }
    }

    _addInv(itemId, qty, customItem) {
        qty = qty || 1;
        if (customItem) {
            this.inventory.push({ itemId: customItem.id, quantity: qty, customItem: customItem });
            return;
        }
        var ex = this.inventory.find(function(i) { return i.itemId === itemId; });
        if (ex && ITEMS[itemId] && ITEMS[itemId].stackable) ex.quantity += qty;
        else this.inventory.push({ itemId: itemId, quantity: qty });
    }

    _reveal() {
        var map = this.maps[this.currentFloor];
        this.dg.revealAround(map.map, this.px, this.py, 2);
    }

    _draw() {
        this.gfx.clear();
        this._tempImages.forEach(function(img) { img.destroy(); });
        this._tempImages = [];
        var map = this.maps[this.currentFloor];

        if (this.visualMode === 'retro') this._drawRetro(map);
        else this._drawModern(map);
    }

    _drawModern(map) {
        var g = this.gfx;
        var VW = 640, VH = 290;
        g.fillStyle(0x000000);
        g.fillRect(0, 0, VW, VH);

        var dirs = [{ dx: 0, dy: -1 }, { dx: 1, dy: 0 }, { dx: 0, dy: 1 }, { dx: -1, dy: 0 }];
        var range = 5;

        var fwX = this.px + dirs[this.pdir].dx;
        var fwY = this.py + dirs[this.pdir].dy;

        if (this._isWall(map, fwX, fwY)) {
            if (this.textures.exists('tex_wall')) {
                if (!this._wallImg) {
                    this._wallImg = this.add.image(VW / 2, VH / 2, 'tex_wall').setDisplaySize(VW, VH).setDepth(1);
                }
                this._wallImg.setVisible(true).setAlpha(1);
            } else {
                g.fillStyle(0x303066);
                g.fillRect(0, 0, VW, VH);
            }
            g.fillStyle(0x000000, 0.3);
            g.fillRect(0, VH * 0.6, VW, VH * 0.4);
        } else {
            if (this._wallImg) this._wallImg.setVisible(false);

            g.fillStyle(0x0d0d1a);
            g.fillRect(0, 0, VW, VH * 0.48);
            g.fillStyle(0x1a1008);
            g.fillRect(0, VH * 0.48, VW, VH * 0.52);

            for (var depth = range; depth >= 0; depth--) {
                var t = 1 / (1 + depth * 0.65);
                var vw = VW * t;
                var vh = VH * t;
                var ox = (VW - vw) / 2;
                var oy = (VH - vh) / 2;
                var a = Math.max(0.12, 1 - depth * 0.17);

                var fdx = this.px + dirs[this.pdir].dx * depth;
                var fdy = this.py + dirs[this.pdir].dy * depth;

                for (var side = -1; side <= 1; side++) {
                    var perpDir = (this.pdir + (side === 0 ? 0 : (side < 0 ? 3 : 1))) % 4;
                    var cx = fdx + dirs[perpDir].dx;
                    var cy = fdy + dirs[perpDir].dy;
                    if (cx < 0 || cx >= map.width || cy < 0 || cy >= map.height) continue;
                    var tile = map.map[cy][cx];

                    if (tile.type === 'wall') {
                        if (this.textures.exists('tex_wall')) {
                            var img;
                            if (side === -1) {
                                img = this.add.image(ox + vw * 0.125, oy + vh / 2, 'tex_wall').setDisplaySize(vw * 0.25, vh).setAlpha(a * 0.7).setDepth(2);
                            } else if (side === 1) {
                                img = this.add.image(ox + vw * 0.875, oy + vh / 2, 'tex_wall').setDisplaySize(vw * 0.25, vh).setAlpha(a * 0.7).setDepth(2);
                            } else {
                                img = this.add.image(ox + vw / 2, oy + vh / 2, 'tex_wall').setDisplaySize(vw, vh).setAlpha(a).setDepth(2);
                            }
                            this._tempImages.push(img);
                        } else {
                            var shade = depth <= 1 ? 0x303066 : depth <= 2 ? 0x252550 : 0x1a1a33;
                            g.fillStyle(shade, a);
                            if (side === -1) g.fillRect(ox, oy, vw * 0.25, vh);
                            else if (side === 1) g.fillRect(ox + vw * 0.75, oy, vw * 0.25, vh);
                            else g.fillRect(ox, oy, vw, vh);
                        }
                    } else if (tile.type === 'door' && side === 0 && depth <= 3) {
                        var doorKey = tile.locked ? 'tex_locked' : 'tex_door';
                        if (this.textures.exists(doorKey)) {
                            var dw = vw * 0.45;
                            var dh = vh * 0.75;
                            var dx = ox + (vw - dw) / 2;
                            var dy = oy + (vh - dh) / 2;
                            var doorImg = this.add.image(dx + dw / 2, dy + dh / 2, doorKey).setDisplaySize(dw, dh).setAlpha(a).setDepth(3);
                            this._tempImages.push(doorImg);
                        } else {
                            g.fillStyle(tile.locked ? 0x8B4513 : 0x553311, a);
                            g.fillRect(ox + vw * 0.28, oy + vh * 0.12, vw * 0.44, vh * 0.76);
                            g.lineStyle(2, 0x886633, a);
                            g.strokeRect(ox + vw * 0.28, oy + vh * 0.12, vw * 0.44, vh * 0.76);
                            g.fillStyle(0xccaa44, a);
                            g.fillCircle(ox + vw * 0.65, oy + vh * 0.5, 4);
                        }
                    } else if (tile.type === 'shop' && side === 0 && depth <= 3) {
                        if (this.textures.exists('tex_door')) {
                            var sw2 = vw * 0.45;
                            var sh2 = vh * 0.75;
                            var sdx = ox + (vw - sw2) / 2;
                            var sdy = oy + (vh - sh2) / 2;
                            var shopImg = this.add.image(sdx + sw2 / 2, sdy + sh2 / 2, 'tex_door').setDisplaySize(sw2, sh2).setAlpha(a).setTint(0x44ff44).setDepth(3);
                            this._tempImages.push(shopImg);
                        }
                        this._txtAt(ox + vw * 0.5, oy + vh * 0.25, 'TIENDA', { size: Math.max(8, Math.floor(14 * t)) + 'px', color: '#44ff44', origin: 0.5 });
                    } else if (tile.type === 'stairs' && side === 0 && depth <= 2) {
                        g.fillStyle(0x4444aa, a * 0.9);
                        for (var step = 0; step < 5; step++) {
                            var stw = vw * (0.15 + step * 0.06);
                            var sth = vh * 0.12;
                            g.fillRect(ox + (vw - stw) / 2, oy + vh * 0.25 + step * sth, stw, sth);
                            g.lineStyle(1, 0x6666cc, a * 0.5);
                            g.strokeRect(ox + (vw - stw) / 2, oy + vh * 0.25 + step * sth, stw, sth);
                        }
                    } else if ((tile.type === 'floor' || tile.chest) && side === 0 && depth > 0) {
                        var fogA = a * 0.3 * (depth / range);
                        g.fillStyle(0x0a0a18, fogA);
                        g.fillRect(ox, oy, vw, vh);
                        if (tile.chest && !tile.chestOpen && this.textures.exists('tex_chest')) {
                            var cw = vw * 0.35;
                            var ch = vh * 0.35;
                            var chestImg = this.add.image(ox + vw / 2, oy + vh * 0.75, 'tex_chest').setDisplaySize(cw, ch).setAlpha(a).setDepth(4);
                            this._tempImages.push(chestImg);
                        }
                    }
                }
            }

            g.lineStyle(2, 0x2a2a55, 0.6);
            g.strokeRect(3, 3, VW - 6, VH - 6);

            var fogGrad = g;
            fogGrad.fillStyle(0x000000, 0.15);
            fogGrad.fillRect(0, 0, VW, VH * 0.1);
            fogGrad.fillRect(0, VH * 0.9, VW, VH * 0.1);
        }

        g.fillStyle(0x000000);
        g.fillRect(0, VH, VW, 5);

        var dirNames = ['N', 'E', 'S', 'O'];
        this.compassTxt.setText('[' + dirNames[this.pdir] + '] (' + this.px + ',' + this.py + ') Piso ' + this.currentFloor);
    }

    _isWall(map, x, y) {
        if (y < 0 || y >= map.height || x < 0 || x >= map.width) return true;
        return map.map[y][x].type === 'wall';
    }

    _drawRetro(map) {
        var g = this.gfx;
        g.fillStyle(0x000000);
        g.fillRect(0, 0, 640, 290);

        var cx = 320, cy = 140;
        var size = 40;
        var dirs = [{ dx: 0, dy: -1 }, { dx: 1, dy: 0 }, { dx: 0, dy: 1 }, { dx: -1, dy: 0 }];

        for (var depth = 4; depth >= 0; depth--) {
            var s = size / (1 + depth);
            var fwX = this.px + dirs[this.pdir].dx * depth;
            var fwY = this.py + dirs[this.pdir].dy * depth;

            for (var side = -1; side <= 1; side++) {
                var perpDir = (this.pdir + (side === 0 ? 0 : (side < 0 ? 3 : 1))) % 4;
                var tx = fwX + dirs[perpDir].dx;
                var ty = fwY + dirs[perpDir].dy;
                if (tx < 0 || tx >= map.width || ty < 0 || ty >= map.height) continue;
                var tile = map.map[ty][tx];
                if (tile.type === 'wall' || tile.type === 'door' || tile.type === 'shop') {
                    var tileColor = tile.type === 'door' ? 0x886622 : tile.type === 'shop' ? 0x22aa22 : 0x00ff00;
                    g.lineStyle(2, tileColor, Math.max(0.2, 1 - depth * 0.2));
                    if (side === -1) { g.strokeRect(cx - s * 2, cy - s, s, s * 2); }
                    else if (side === 1) { g.strokeRect(cx + s, cy - s, s, s * 2); }
                    else { g.strokeRect(cx - s, cy - s, s * 2, s * 2); }
                }
            }
        }

        g.lineStyle(1, 0x00ff00, 0.3);
        g.strokeRect(20, 10, 600, 260);

        var dirNames = ['N', 'E', 'S', 'O'];
        this.compassTxt.setText('[' + dirNames[this.pdir] + '] (' + this.px + ',' + this.py + ') Piso ' + this.currentFloor);
    }

    _txtAt(x, y, str, style) {
        style = style || {};
        var t = this.add.text(x, y, str, { fontSize: style.size || '12px', fontFamily: '"VT323", monospace', color: style.color || '#fff' });
        if (style.origin) t.setOrigin(style.origin);
        this._tempImages.push(t);
        return t;
    }

    _drawMinimap() {
        var g = this.hudGfx;
        var map = this.maps[this.currentFloor];
        var ts = 4;
        var sx = GAME_W - map.width * ts - 8;
        var sy = 8;
        g.fillStyle(0x000000, 0.7);
        g.fillRect(sx - 2, sy - 2, map.width * ts + 4, map.height * ts + 4);
        for (var y = 0; y < map.height; y++) {
            for (var x = 0; x < map.width; x++) {
                var t = map.map[y][x];
                if (!t.explored) continue;
                var c = 0x222222;
                if (t.type === 'floor') c = 0x444444;
                else if (t.type === 'wall') c = 0x222233;
                else if (t.type === 'door') c = 0x886622;
                else if (t.type === 'stairs') c = 0x4488ff;
                else if (t.type === 'shop') c = 0x22aa22;
                g.fillStyle(c);
                g.fillRect(sx + x * ts, sy + y * ts, ts, ts);
            }
        }
        g.fillStyle(0x44ff44);
        g.fillRect(sx + this.px * ts, sy + this.py * ts, ts, ts);
    }

    _updateHUD() {
        var self = this;
        this.hudGfx.clear();
        this.hudTxts.forEach(function(t) { t.destroy(); });
        this.hudTxts = [];
        if (this._hudImages) this._hudImages.forEach(function(img) { img.destroy(); });
        this._hudImages = [];
        var g = this.hudGfx;
        var y0 = 300;

        this.ui.panel(g, 0, y0, 640, 180, {
            borderColor: 0x3333aa,
            bgColor: 0x060610,
            cornerRadius: 0,
            borderWidth: 1
        });

        this.party.forEach(function(c, i) {
            var x = 10, y = y0 + 8 + i * 42;
            var borderCol = c.isAlive() ? 0x333366 : 0x222222;
            self.ui.panel(g, x, y, 310, 38, {
                borderColor: borderCol,
                bgColor: c.isAlive() ? 0x0c0c18 : 0x080808,
                cornerRadius: 4,
                borderWidth: 1
            });

            var nc = c.isAlive() ? '#ccccff' : '#444444';
            self._hudTxt(x + 6, y + 4, c.name, '12px', nc);

            var hpPct = c.maxHp > 0 ? c.hp / c.maxHp : 0;
            self.ui.hpBar(g, x + 6, y + 20, 95, 8, hpPct);

            if (c.maxMp > 0) {
                var mpPct = c.maxMp > 0 ? c.mp / c.maxMp : 0;
                self.ui.mpBar(g, x + 110, y + 20, 90, 8, mpPct);
            }

            self._hudTxt(x + 210, y + 4, 'Lv.' + c.level, '10px', '#ffaa44');
            self._hudTxt(x + 210, y + 20, c.classData.name, '9px', '#666688');

            if (self.textures.exists('ui_heart') && c.isAlive()) {
                var heartImg = self.add.image(x + 195, y + 8, 'ui_heart').setScale(0.7).setDepth(25);
                self._hudImages.push(heartImg);
            }
        });

        self.ui.panel(g, 330, y0 + 8, 300, 100, {
            borderColor: 0x333355,
            bgColor: 0x08080f,
            cornerRadius: 6
        });

        this._hudTxt(340, y0 + 15, 'Piso: ' + this.currentFloor, '13px', '#aaaaff');
        this._hudTxt(340, y0 + 35, 'Oro: ' + this.gold, '12px', '#ffff44');
        if (this.textures.exists('ui_coin')) {
            var coinImg = this.add.image(430, y0 + 40, 'ui_coin').setScale(0.8).setDepth(25);
            this._hudImages.push(coinImg);
        }

        self.ui.separator(g, 340, y0 + 58, 280, { color: 0x333355, alpha: 0.3 });

        this._hudTxt(340, y0 + 65, 'I=Inventario  F5=Guardar', '10px', '#555566');
        this._hudTxt(340, y0 + 82, 'WASD=Mover  SPACE=Interactuar', '10px', '#555566');
        this._drawMinimap();
    }

    _hudTxt(x, y, str, size, color) {
        var t = this.add.text(x, y, str, { fontSize: size, fontFamily: '"Share Tech Mono", monospace', color: color }).setDepth(25);
        this.hudTxts.push(t);
    }

    _msg(str) {
        this.msgTxt.setText(str).setAlpha(1);
        this.tweens.add({ targets: this.msgTxt, alpha: 0, delay: 2500, duration: 500 });
    }

    _playSound(key) {
        this.audio.playSfx(key);
    }

    _encounter() {
        var flavor = getEncounterFlavor();
        this._msg(flavor);
        this.fx.shake(0.005, 150);
        var pool = ENEMY_FLOORS[this.currentFloor] || ENEMY_FLOORS[1];
        var n = 1 + Math.floor(Math.random() * 3);
        var enemies = [];
        for (var i = 0; i < n; i++) {
            var tid = pool[Math.floor(Math.random() * pool.length)];
            enemies.push(new Enemy(tid, this.currentFloor));
        }
        var self = this;
        setTimeout(function() {
            self.cameras.main.fadeOut(400, 0, 0, 0);
            self.cameras.main.once('camerafadeoutcomplete', function() {
                self.scene.launch('CombatScene', {
                    party: self.party, enemies: enemies, gold: self.gold, inventory: self.inventory,
                    onVictory: function(data) { self.gold = data.gold; self.inventory = data.inventory; if (data.fled) self.encounterRate = Math.max(0.02, self.encounterRate * 0.3); self._updateHUD(); self.scene.resume(); },
                    onDefeat: function() {
                        self.cameras.main.fadeOut(500, 0, 0, 0);
                        self.cameras.main.once('camerafadeoutcomplete', function() {
                            self.scene.start('GameOverScene');
                        });
                    }
                });
                self.scene.pause();
            });
        }, 1200);
    }

    _quickSave() {
        this.saveSys.save({
            party: this.party, inventory: this.inventory, gold: this.gold,
            floor: this.currentFloor, playerX: this.px, playerY: this.py, playerDir: this.pdir,
            maps: this.maps, playTime: this.playTime, settings: {}
        });
        this._msg('Partida guardada! (F5)');
    }

    _autoSave() {
        var self = this;
        if (this._autoSaveTimer) this._autoSaveTimer.destroy();
        this._autoSaveTimer = this.time.addEvent({ delay: 60000, loop: true, callback: function() {
            self.saveSys.save({
                party: self.party, inventory: self.inventory, gold: self.gold,
                floor: self.currentFloor, playerX: self.px, playerY: self.py, playerDir: self.pdir,
                maps: self.maps, playTime: self.playTime, settings: {}
            });
        }});
    }

    shutdown() {
        if (this._autoSaveTimer) { this._autoSaveTimer.destroy(); this._autoSaveTimer = null; }
    }
}
