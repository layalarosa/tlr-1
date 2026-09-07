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
            this.storyState = sd.storyState || createStoryState();
        } else {
            this.party = data.party;
            this.gold = 50;
            this.inventory = [{ itemId: 'POTION', quantity: 5 }, { itemId: 'ANTIDOTE', quantity: 2 }];
            this.currentFloor = 1;
            this.pdir = 0;
            this.maps = {};
            this.playTime = 0;
            this.storyState = data.storyState || createStoryState();
        }

        updateStoryForFloor(this.storyState, this.currentFloor);

        if (!this.maps[this.currentFloor]) {
            this.maps[this.currentFloor] = this.dg.generate(this.currentFloor);
            this.px = this.maps[this.currentFloor].playerStart.x;
            this.py = this.maps[this.currentFloor].playerStart.y;
        }
        this._ensureStoryTarget();

        this.encounterRate = 0.1;
        this.moving = false;
        this.menuOpen = false;
        this.visualMode = 'modern';
        this.encounterPending = false;
        this._autoSaveTimer = null;
    }

    create() {
        this.gfx = this.add.graphics();
        this.texts = {};
        this.compassTxt = this.add.text(GAME_W / 2, 278, '', { fontSize: '14px', fontFamily: '"Share Tech Mono", monospace', color: '#d5c9a5' }).setOrigin(0.5).setDepth(10);
        this.msgTxt = this.add.text(GAME_W / 2, 10, '', { fontSize: '16px', fontFamily: '"VT323", monospace', color: '#eee6cf', backgroundColor: '#080808ee', padding: { x: 6, y: 3 } }).setOrigin(0.5, 0).setDepth(100);
        this.hudGfx = this.add.graphics().setDepth(20);
        this.hudTxts = [];
        this._wallImg = null;
        this._tempImages = [];
        this.threeDungeon = null;
        this.ui = new UITheme(this);
        this.threeDungeon = new ThreeDungeonView(this);
        this.audio = new AudioManager(this);
        this.fx = new ScreenEffects(this);
        this.audio.playBgm('bgm_explore');
        this._reveal();
        this._draw();
        this._updateHUD();
        this._setupKeys();
        var self = this;
        this._onSaveKeyDown = function(event) {
            if (event.key === 'F5') {
                event.preventDefault();
                self._quickSave();
            }
        };
        document.addEventListener('keydown', this._onSaveKeyDown);
        this._setupSwipe();
        this._autoSave();
        if (window.setTouchContext) window.setTouchContext('explore');
        var self = this;
        this.events.on('resume', function() {
            if (self.threeDungeon) self.threeDungeon.setVisible(true);
            if (window.setTouchContext) window.setTouchContext('explore');
        });
        this.events.once('shutdown', function() {
            if (self.threeDungeon) self.threeDungeon.destroy();
            document.removeEventListener('keydown', self._onSaveKeyDown);
        });
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
        k.on('keydown-I', function() { if (self.menuOpen) return; self.menuOpen = true; if (self.threeDungeon) self.threeDungeon.setVisible(false); if (window.setTouchContext) window.setTouchContext('inventory'); self.scene.launch('InventoryScene', { party: self.party, inventory: self.inventory, gold: self.gold, onclose: function() { self.menuOpen = false; if (window.setTouchContext) window.setTouchContext('explore'); self.scene.stop('InventoryScene'); self.scene.resume(); } }); self.scene.pause(); });
        k.on('keydown-V', function() { self._showMsg('La mazmorra sigue el estilo de grabado'); });
    }

    _setupSwipe() {
        var self = this;
        var startX = 0, startY = 0, tracking = false;
        var canvas = this.game.canvas;
        canvas.addEventListener('touchstart', function(e) {
            if (e.touches.length === 1) {
                startX = e.touches[0].clientX;
                startY = e.touches[0].clientY;
                tracking = true;
            }
        }, { passive: true });
        canvas.addEventListener('touchmove', function(e) {
            e.preventDefault();
        }, { passive: false });
        canvas.addEventListener('touchend', function(e) {
            if (!tracking) return;
            tracking = false;
            var dx = e.changedTouches[0].clientX - startX;
            var dy = e.changedTouches[0].clientY - startY;
            var absDx = Math.abs(dx);
            var absDy = Math.abs(dy);
            var minSwipe = 30;
            if (absDx < minSwipe && absDy < minSwipe) return;
            if (self.menuOpen) return;
            if (absDx > absDy) {
                if (dx > 0) self._turn(1);
                else self._turn(-1);
            } else {
                if (dy < 0) self._move(0);
                else self._move(2);
            }
        }, { passive: true });
    }

    _getDir() {
        return [{ dx: 0, dy: -1 }, { dx: 1, dy: 0 }, { dx: 0, dy: 1 }, { dx: -1, dy: 0 }][this.pdir];
    }

    _canGo(x, y) {
        var map = this.maps[this.currentFloor];
        if (y < 0 || y >= map.height || x < 0 || x >= map.width) return false;
        var t = map.map[y][x];
        return t.type === 'floor' || (t.type === 'door' && !t.locked) || t.type === 'stairs' || t.type === 'shop';
    }

    _move(relDir) {
        if (this.moving || (this.threeDungeon && this.threeDungeon.isAnimating())) return;
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
        if (this.moving || (this.threeDungeon && this.threeDungeon.isAnimating())) return;
        this.pdir = (this.pdir + d + 4) % 4;
        this._reveal();
        this._draw();
    }

    _strafe(d) {
        if (this.moving || (this.threeDungeon && this.threeDungeon.isAnimating())) return;
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
        if (t.type === 'stairs') {
            this._msg('Has encontrado la escalera. SPACE/ENTER para bajar al siguiente piso.');
            return true;
        }
        if (t.type === 'shop') { this._enterShop(); return true; }
        return false;
    }

    _ensureStoryTarget() {
        var map = this.maps[this.currentFloor];
        if (this.currentFloor !== 1 || this.storyState.flags.foundExplorerClue || map.storyTarget) return;
        for (var y = 0; y < map.height; y++) {
            for (var x = 0; x < map.width; x++) {
                if (map.map[y][x].storyClue || map.map[y][x].chest) {
                    map.map[y][x].storyClue = true;
                    map.storyTarget = { x: x, y: y };
                    return;
                }
            }
        }
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
        this.menuOpen = true;
        if (this.threeDungeon) this.threeDungeon.setVisible(false);
        this.currentFloor++;
        if (!this.maps[this.currentFloor]) {
            this.maps[this.currentFloor] = this.dg.generate(this.currentFloor);
        }
        var s = this.maps[this.currentFloor].playerStart;
        this.px = s.x; this.py = s.y;
        this._reveal(); this._draw();
        this._msg('Piso ' + this.currentFloor + ': ' + this.maps[this.currentFloor].name);
        if (this.currentFloor === 15) {
            var self = this;
            this.time.delayedCall(900, function() { self._encounter(true); });
            return;
        }
        var milestone = getStoryMilestone(this.currentFloor);
        if (milestone && !this.storyState.seenMilestones[this.currentFloor]) {
            var chapterData = updateStoryForFloor(this.storyState, this.currentFloor);
            this._showStoryMilestone(this.currentFloor, milestone, chapterData);
            return;
        } else {
            var desc = getFloorDescription(this.currentFloor);
            if (desc) { var self = this; setTimeout(function() { self._msg(desc); }, 3000); }
        }
        this.menuOpen = false;
        if (this.threeDungeon) this.threeDungeon.setVisible(true);
    }

    _showStoryMilestone(floor, dialogues, chapterData) {
        var self = this;
        this.menuOpen = true;
        if (this.threeDungeon) this.threeDungeon.setVisible(false);
        this.storyState.seenMilestones[floor] = true;
        this.scene.launch('NarrativeScene', {
            party: this.party,
            inventory: this.inventory,
            gold: this.gold,
            currentFloor: this.currentFloor,
            storyState: this.storyState,
            dialogues: dialogues,
            onComplete: function(data) {
                self.storyState = data.storyState || self.storyState;
                self.menuOpen = false;
                self._updateHUD();
                self.scene.resume();
                if (window.setTouchContext) window.setTouchContext('explore');
            }
        });
        this.scene.pause();
        this._msg('Capitulo ' + this.storyState.chapter + ': ' + chapterData.name);
    }

    _enterShop() {
        var self = this;
        this.menuOpen = true;
        if (this.threeDungeon) this.threeDungeon.setVisible(false);
        this.scene.launch('ShopScene', {
            party: this.party, inventory: this.inventory, gold: this.gold, floor: this.currentFloor,
            onclose: function(data) { self.gold = data.gold; self.inventory = data.inventory; self.menuOpen = false; self.scene.stop('ShopScene'); self.scene.resume(); self._updateHUD(); }
        });
        this.scene.pause();
    }

    _interact() {
        var map = this.maps[this.currentFloor];
        var currentTile = map.map[this.py][this.px];
        if (currentTile.type === 'stairs') {
            this._goDown();
            return;
        }
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
            if (t.storyClue && !this.storyState.flags.foundExplorerClue) {
                this.storyState.flags.foundExplorerClue = true;
                this.storyState.objective = 'Pista encontrada. Sigue la ruta hasta la escalera.';
                msg = '¡Has encontrado la nota del explorador! ' + msg;
            }
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

        if (this.threeDungeon && this.threeDungeon.isReady()) {
            this.gfx.clear();
            this.threeDungeon.render(map, this.px, this.py, this.pdir);
        } else {
            this._drawDungeonMap(map);
        }
    }

    _drawDungeonMap(map) {
        var g = this.gfx;
        var viewW = 640, viewH = 290;
        var marginX = 22, marginY = 12;
        var tileSize = Math.min((viewW - marginX * 2) / map.width, (viewH - marginY * 2) / map.height);
        var mapW = tileSize * map.width;
        var mapH = tileSize * map.height;
        var startX = (viewW - mapW) / 2;
        var startY = (viewH - mapH) / 2;
        var route = this._getRoutePath(map);
        var routeTiles = {};

        if (this._wallImg) this._wallImg.setVisible(false);
        g.fillStyle(0x070706);
        g.fillRect(0, 0, viewW, viewH);
        g.lineStyle(2, 0x9b8d6c, 0.85);
        g.strokeRect(startX - 8, startY - 8, mapW + 16, mapH + 16);
        g.lineStyle(1, 0x403c31, 0.8);
        g.strokeRect(startX - 4, startY - 4, mapW + 8, mapH + 8);

        route.forEach(function(step) {
            routeTiles[step.x + ',' + step.y] = true;
        });

        for (var y = 0; y < map.height; y++) {
            for (var x = 0; x < map.width; x++) {
                var tile = map.map[y][x];
                var px = startX + x * tileSize;
                var py = startY + y * tileSize;
                var visible = tile.visible;
                var discovered = tile.explored;

                if (!discovered) {
                    g.fillStyle(0x0b0b0a);
                    g.fillRect(px, py, tileSize + 1, tileSize + 1);
                    continue;
                }

                if (tile.type === 'wall') {
                    g.fillStyle(visible ? 0x4b493f : 0x272721);
                    g.fillRect(px, py, tileSize + 1, tileSize + 1);
                    g.lineStyle(1, visible ? 0x9b9278 : 0x4c493d, 0.8);
                    g.strokeRect(px + 1, py + 1, tileSize - 2, tileSize - 2);
                    if (tileSize > 11) {
                        g.lineStyle(1, visible ? 0x756d59 : 0x39372e, 0.55);
                        g.lineBetween(px + 3, py + tileSize * 0.35, px + tileSize - 3, py + tileSize * 0.35);
                        g.lineBetween(px + 3, py + tileSize * 0.7, px + tileSize - 3, py + tileSize * 0.7);
                    }
                    continue;
                }

                g.fillStyle(visible ? 0x625d4d : 0x38362e);
                g.fillRect(px, py, tileSize + 1, tileSize + 1);
                g.lineStyle(1, visible ? 0xaaa080 : 0x595444, 0.45);
                g.strokeRect(px + 1, py + 1, tileSize - 2, tileSize - 2);

                if (routeTiles[x + ',' + y] && visible && tile.type === 'floor') {
                    g.fillStyle(0xb7a56e, 0.24);
                    g.fillCircle(px + tileSize / 2, py + tileSize / 2, Math.max(2, tileSize * 0.12));
                }

                if (tile.type === 'door') {
                    g.fillStyle(tile.locked ? 0x7f3028 : 0xa58d5c, 0.95);
                    g.fillRect(px + tileSize * 0.18, py + tileSize * 0.18, tileSize * 0.64, tileSize * 0.64);
                    g.lineStyle(1, 0x171612, 0.9);
                    g.strokeRect(px + tileSize * 0.18, py + tileSize * 0.18, tileSize * 0.64, tileSize * 0.64);
                } else if (tile.type === 'stairs') {
                    g.fillStyle(0xd0b878, 1);
                    for (var step = 1; step <= 3; step++) {
                        g.fillRect(px + tileSize * 0.2, py + tileSize * (0.16 + step * 0.18), tileSize * (0.38 + step * 0.12), Math.max(1, tileSize * 0.08));
                    }
                } else if (tile.type === 'shop') {
                    g.fillStyle(0xb5a06a, 1);
                    g.fillCircle(px + tileSize / 2, py + tileSize / 2, Math.max(3, tileSize * 0.22));
                    g.lineStyle(1, 0x1b1914, 1);
                    g.strokeCircle(px + tileSize / 2, py + tileSize / 2, Math.max(3, tileSize * 0.22));
                }

                if (tile.chest && !tile.chestOpen) {
                    g.fillStyle(0xa43a2d, visible ? 1 : 0.6);
                    g.fillRect(px + tileSize * 0.22, py + tileSize * 0.32, tileSize * 0.56, tileSize * 0.38);
                    g.lineStyle(1, 0xe0bd76, 0.8);
                    g.strokeRect(px + tileSize * 0.22, py + tileSize * 0.32, tileSize * 0.56, tileSize * 0.38);
                }
            }
        }

        var playerX = startX + this.px * tileSize + tileSize / 2;
        var playerY = startY + this.py * tileSize + tileSize / 2;
        var facing = [{ dx: 0, dy: -1 }, { dx: 1, dy: 0 }, { dx: 0, dy: 1 }, { dx: -1, dy: 0 }][this.pdir];
        g.fillStyle(0xe1c982, 0.22);
        g.fillCircle(playerX, playerY, tileSize * 0.48);
        g.fillStyle(0xe1c982, 1);
        g.fillPoints([
            { x: playerX + facing.dx * tileSize * 0.42, y: playerY + facing.dy * tileSize * 0.42 },
            { x: playerX - facing.dy * tileSize * 0.28 - facing.dx * tileSize * 0.18, y: playerY + facing.dx * tileSize * 0.28 - facing.dy * tileSize * 0.18 },
            { x: playerX + facing.dy * tileSize * 0.28 - facing.dx * tileSize * 0.18, y: playerY - facing.dx * tileSize * 0.28 - facing.dy * tileSize * 0.18 }
        ], true);
        g.lineStyle(1, 0x211c15, 1);
        g.strokeCircle(playerX, playerY, tileSize * 0.47);

        g.fillStyle(0x000000, 0.2);
        g.fillRect(0, 0, viewW, 5);
        g.fillRect(0, viewH - 5, viewW, 5);
        var dirNames = ['N', 'E', 'S', 'O'];
        this.compassTxt.setText('[' + dirNames[this.pdir] + ']  ' + map.name + '  |  Piso ' + this.currentFloor);
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
                this._wallImg.setVisible(true).setTint(0xa39b88).setAlpha(1);
            } else {
                g.fillStyle(0x4a473f);
                g.fillRect(0, 0, VW, VH);
            }
            g.fillStyle(0x050505, 0.52);
            g.fillRect(0, VH * 0.6, VW, VH * 0.4);
        } else {
            if (this._wallImg) this._wallImg.setVisible(false);

            g.fillStyle(0x0c0c0b);
            g.fillRect(0, 0, VW, VH * 0.48);
            g.fillStyle(0x28251f);
            g.fillRect(0, VH * 0.48, VW, VH * 0.52);
            this._drawCorridorShell(g, VW, VH);

            g.fillStyle(0x9c754b, 0.06);
            g.fillCircle(VW / 2, VH * 0.47, 150);
            g.fillStyle(0xc4a66d, 0.04);
            g.fillCircle(VW / 2, VH * 0.47, 82);

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
                            img.setTint(0xa39b88);
                            this._tempImages.push(img);
                        } else {
                            var shade = depth <= 1 ? 0x625d50 : depth <= 2 ? 0x46433b : 0x282824;
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
                            g.fillStyle(tile.locked ? 0x762b24 : 0x615844, a);
                            g.fillRect(ox + vw * 0.28, oy + vh * 0.12, vw * 0.44, vh * 0.76);
                            g.lineStyle(2, 0xc0aa78, a);
                            g.strokeRect(ox + vw * 0.28, oy + vh * 0.12, vw * 0.44, vh * 0.76);
                            g.fillStyle(tile.locked ? 0xa53429 : 0xc0aa78, a);
                            g.fillCircle(ox + vw * 0.65, oy + vh * 0.5, 4);
                        }
                    } else if (tile.type === 'shop' && side === 0 && depth <= 3) {
                        if (this.textures.exists('tex_door')) {
                            var sw2 = vw * 0.45;
                            var sh2 = vh * 0.75;
                            var sdx = ox + (vw - sw2) / 2;
                            var sdy = oy + (vh - sh2) / 2;
                            var shopImg = this.add.image(sdx + sw2 / 2, sdy + sh2 / 2, 'tex_door').setDisplaySize(sw2, sh2).setAlpha(a).setTint(0x9c8e6d).setDepth(3);
                            this._tempImages.push(shopImg);
                        }
                            this._txtAt(ox + vw * 0.5, oy + vh * 0.25, 'TIENDA', { size: Math.max(8, Math.floor(14 * t)) + 'px', color: '#d5c9a5', origin: 0.5 });
                    } else if (tile.type === 'stairs' && side === 0 && depth <= 2) {
                        g.fillStyle(0x8e7654, a * 0.9);
                        for (var step = 0; step < 5; step++) {
                            var stw = vw * (0.15 + step * 0.06);
                            var sth = vh * 0.12;
                            g.fillRect(ox + (vw - stw) / 2, oy + vh * 0.25 + step * sth, stw, sth);
                            g.lineStyle(1, 0xd0ba83, a * 0.5);
                            g.strokeRect(ox + (vw - stw) / 2, oy + vh * 0.25 + step * sth, stw, sth);
                        }
                    } else if ((tile.type === 'floor' || tile.chest) && side === 0 && depth > 0) {
                        var fogA = a * 0.3 * (depth / range);
                        g.fillStyle(0x080407, fogA);
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

            g.lineStyle(2, 0xb5a786, 0.62);
            g.strokeRect(3, 3, VW - 6, VH - 6);

            g.fillStyle(0x000000, 0.32);
            g.fillRect(0, 0, VW, VH * 0.12);
            g.fillRect(0, VH * 0.88, VW, VH * 0.12);
            g.fillStyle(0x000000, 0.18);
            g.fillRect(0, 0, VW * 0.08, VH);
            g.fillRect(VW * 0.92, 0, VW * 0.08, VH);
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

    _drawCorridorShell(g, width, height) {
        var horizon = height * 0.48;
        var center = width / 2;
        var floorTop = horizon + 2;

        g.fillStyle(0x292721, 0.98);
        g.fillPoints([
            { x: 0, y: horizon }, { x: width, y: horizon },
            { x: width, y: height }, { x: 0, y: height }
        ], true);

        g.fillStyle(0x3b3932, 0.98);
        g.fillPoints([
            { x: 0, y: 0 }, { x: center - 30, y: horizon },
            { x: center - 112, y: height }, { x: 0, y: height }
        ], true);
        g.fillPoints([
            { x: width, y: 0 }, { x: center + 30, y: horizon },
            { x: center + 112, y: height }, { x: width, y: height }
        ], true);

        g.lineStyle(2, 0x0b0b0a, 0.9);
        g.lineBetween(center - 30, horizon, center - 112, height);
        g.lineBetween(center + 30, horizon, center + 112, height);

        for (var row = 1; row <= 4; row++) {
            var y = floorTop + Math.pow(row / 4, 1.7) * (height - floorTop);
            var half = 24 + (row / 4) * (width * 0.43);
            g.lineStyle(1, 0xb3a27b, 0.25);
            g.lineBetween(center - half, y, center + half, y);
        }

        for (var column = -3; column <= 3; column++) {
            var bottomX = center + column * 82;
            g.lineStyle(1, 0xa49778, 0.2);
            g.lineBetween(center, floorTop, bottomX, height);
        }

        for (var wallRow = 1; wallRow <= 5; wallRow++) {
            var wallY = horizon * (wallRow / 6);
            var wallInset = wallRow * 8;
            g.lineStyle(1, 0xa49778, 0.16);
            g.lineBetween(wallInset, wallY, center - 30 - wallRow * 3, horizon - wallRow * 2);
            g.lineBetween(width - wallInset, wallY, center + 30 + wallRow * 3, horizon - wallRow * 2);
        }
    }

    _getRoutePath(map) {
        var target = this._getRouteTarget(map);
        if (!target) return [];
        var dirs = [{ dx: 0, dy: -1 }, { dx: 1, dy: 0 }, { dx: 0, dy: 1 }, { dx: -1, dy: 0 }];
        var queue = [{ x: this.px, y: this.py, firstDir: null, path: [] }];
        var visited = {};
        visited[this.px + ',' + this.py] = true;

        while (queue.length > 0) {
            var current = queue.shift();
            if (current.x === target.x && current.y === target.y) return current.path;

            for (var i = 0; i < dirs.length; i++) {
                var nx = current.x + dirs[i].dx;
                var ny = current.y + dirs[i].dy;
                if (nx < 0 || nx >= map.width || ny < 0 || ny >= map.height) continue;
                if (map.map[ny][nx].type === 'wall') continue;
                var key = nx + ',' + ny;
                if (visited[key]) continue;
                visited[key] = true;
                var firstDir = current.firstDir === null ? i : current.firstDir;
                var nextPath = current.path.slice();
                nextPath.push({ x: nx, y: ny, firstDir: firstDir });
                queue.push({ x: nx, y: ny, firstDir: firstDir, path: nextPath });
            }
        }
        return [];
    }

    _getRouteTarget(map) {
        if (this.currentFloor === 1 && !this.storyState.flags.foundExplorerClue && map.storyTarget) return map.storyTarget;
        return map.stairsPos;
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
                    var tileColor = tile.type === 'door' ? 0x9a5a35 : tile.type === 'shop' ? 0xb47a35 : 0x8b3e45;
                    g.lineStyle(2, tileColor, Math.max(0.2, 1 - depth * 0.2));
                    if (side === -1) { g.strokeRect(cx - s * 2, cy - s, s, s * 2); }
                    else if (side === 1) { g.strokeRect(cx + s, cy - s, s, s * 2); }
                    else { g.strokeRect(cx - s, cy - s, s * 2, s * 2); }
                }
            }
        }

        g.lineStyle(1, 0x8b3e45, 0.45);
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
                if (t.type === 'floor') c = 0x51403b;
                else if (t.type === 'wall') c = 0x33252a;
                else if (t.type === 'door') c = 0x7a3f32;
                else if (t.type === 'stairs') c = 0xd08a3c;
                else if (t.type === 'shop') c = 0x8a5a28;
                g.fillStyle(c);
                g.fillRect(sx + x * ts, sy + y * ts, ts, ts);
            }
        }
        var route = this._getRoutePath(map);
        route.forEach(function(step) {
            var tile = map.map[step.y][step.x];
            if (tile.explored) {
                g.fillStyle(0xd49a52, 0.8);
                g.fillRect(sx + step.x * ts + 1, sy + step.y * ts + 1, 2, 2);
            }
        });
        g.fillStyle(0xd49a52);
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
            borderColor: 0x63313a,
            bgColor: 0x10070b,
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

            var nc = c.isAlive() ? '#ead6c1' : '#444444';
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

        self.ui.panel(g, 330, y0 + 8, 300, 164, {
            borderColor: 0x333355,
            bgColor: 0x08080f,
            cornerRadius: 6
        });

        this._hudTxt(340, y0 + 15, 'Piso: ' + this.currentFloor, '13px', '#d49a52');
        this._hudTxt(340, y0 + 35, 'Oro: ' + this.gold, '12px', '#ffff44');
        if (this.textures.exists('ui_coin')) {
            var coinImg = this.add.image(430, y0 + 40, 'ui_coin').setScale(0.8).setDepth(25);
            this._hudImages.push(coinImg);
        }

        self.ui.separator(g, 340, y0 + 58, 280, { color: 0x333355, alpha: 0.3 });

        var chapterData = NARRATIVE.storyChapters[this.storyState.chapter];
        this._hudTxt(340, y0 + 65, chapterData ? chapterData.name : 'Aventura', '10px', chapterData ? chapterData.accent : '#d49a52');
        this._hudTxt(340, y0 + 80, this.storyState.objective, '9px', '#888899', 270);
        this._hudTxt(340, y0 + 110, this._getRouteHint(this.maps[this.currentFloor]), '9px', '#c5ae78', 270);
        this._hudTxt(340, y0 + 125, 'W/S = AVANZA  |  A/D = GIRA', '9px', '#777463', 270);

        this._hudTxt(340, y0 + 140, 'I=Inventario  F5=Guardar', '10px', '#555566');
        this._hudTxt(340, y0 + 157, 'Q/E = LATERAL  |  SPACE = INTERACTUA', '10px', '#555566');
        this._drawMinimap();
    }

    _getRouteHint(map) {
        var target = this._getRouteTarget(map);
        var label = this.currentFloor === 1 && !this.storyState.flags.foundExplorerClue ? 'Pista' : 'Salida';
        if (!target) return 'Destino: cima de la torre';
        if (this.px === target.x && this.py === target.y) {
            return label.toUpperCase() + ': aqui - SPACE para interactuar';
        }
        var route = this._getRoutePath(map);
        if (!route.length) return label + ': ruta no descubierta';
        var relative = (route[0].firstDir - this.pdir + 4) % 4;
        var directions = ['AVANZA', 'GIRA DERECHA', 'RETROCEDE', 'GIRA IZQUIERDA'];
        return label + ': ' + directions[relative] + ' (' + route.length + ' pasos)';
    }

    _hudTxt(x, y, str, size, color, wrapWidth) {
        var style = { fontSize: size, fontFamily: '"Share Tech Mono", monospace', color: color };
        if (wrapWidth) style.wordWrap = { width: wrapWidth };
        var t = this.add.text(x, y, str, style).setDepth(25);
        this.hudTxts.push(t);
    }

    _msg(str) {
        this.msgTxt.setText(str).setAlpha(1);
        this.tweens.add({ targets: this.msgTxt, alpha: 0, delay: 2500, duration: 500 });
    }

    _playSound(key) {
        this.audio.playSfx(key);
    }

    _encounter(isBoss) {
        if (this.encounterPending) return;
        this.encounterPending = true;
        this.menuOpen = true;
        var flavor = isBoss ? 'El Archimago Tharion II bloquea tu camino!' : getEncounterFlavor();
        if (this.threeDungeon) this.threeDungeon.setVisible(false);
        this._msg(flavor);
        this.fx.shake(0.005, 150);
        var pool = isBoss ? ['THARION'] : (ENEMY_FLOORS[this.currentFloor] || ENEMY_FLOORS[1]);
        var n = isBoss ? 1 : 1 + Math.floor(Math.random() * 3);
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
                    onVictory: function(data) {
                        self.encounterPending = false;
                        self.menuOpen = false;
                        self.gold = data.gold;
                        self.inventory = data.inventory;
                        if (data.boss) {
                            self.scene.start('GameOverScene', { victory: true });
                            return;
                        }
                        if (data.fled) self.encounterRate = Math.max(0.02, self.encounterRate * 0.3);
                        self._updateHUD();
                        self.scene.resume();
                        self.cameras.main.resetFX();
                        self.cameras.main.fadeIn(350, 0, 0, 0);
                        if (window.setTouchContext) window.setTouchContext('explore');
                    },
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
        if (this._onSaveKeyDown) {
            document.removeEventListener('keydown', this._onSaveKeyDown);
            this._onSaveKeyDown = null;
        }
    }
}
