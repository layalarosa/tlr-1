class ExploreScene extends Phaser.Scene {
    constructor() {
        super({ key: 'ExploreScene' });
    }

    init(data) {
        this.saveSystem = new SaveSystem();
        this.dungeonGen = new DungeonGenerator();

        if (data.saveData) {
            this.party = data.saveData.party;
            this.gold = data.saveData.gold;
            this.inventory = data.saveData.inventory;
            this.currentFloor = data.saveData.dungeon.floor;
            this.playerX = data.saveData.dungeon.playerX;
            this.playerY = data.saveData.dungeon.playerY;
            this.playerDir = data.saveData.dungeon.playerDir || 0;
            this.maps = data.saveData.dungeon.maps;
            this.playTime = data.saveData.playTime || 0;
        } else {
            this.party = data.party;
            this.gold = 50;
            this.inventory = STARTING_INVENTORY.map(i => ({ ...i }));
            this.currentFloor = 1;
            this.playerDir = 0;
            this.maps = {};
            this.playTime = 0;
        }

        if (!this.maps[this.currentFloor]) {
            this.maps[this.currentFloor] = this.dungeonGen.generate(this.currentFloor);
            const start = this.maps[this.currentFloor].playerStart;
            this.playerX = start.x;
            this.playerY = start.y;
        }

        this.encounterRate = 0.12;
        this.isMoving = false;
    }

    create() {
        this.dungeonGraphics = this.add.graphics();
        this.compassText = this.add.text(320, 380, '', {
            fontSize: '14px', fontFamily: 'monospace', color: '#aaaaff'
        }).setOrigin(0.5).setDepth(10);
        this.hud = new HUD(this);
        this.messageText = this.add.text(320, 15, '', {
            fontSize: '14px', fontFamily: 'monospace', color: '#ffffff',
            backgroundColor: '#000000', padding: { x: 8, y: 4 }
        }).setOrigin(0.5, 0).setDepth(100);

        this._setupControls();
        this._revealMap();
        this._drawView();
        this._updateHUD();
        this._autoSave();
    }

    _setupControls() {
        this.input.keyboard.on('keydown-UP', () => this._moveForward());
        this.input.keyboard.on('keydown-W', () => this._moveForward());
        this.input.keyboard.on('keydown-DOWN', () => this._moveBackward());
        this.input.keyboard.on('keydown-S', () => this._moveBackward());
        this.input.keyboard.on('keydown-LEFT', () => this._turnLeft());
        this.input.keyboard.on('keydown-A', () => this._turnLeft());
        this.input.keyboard.on('keydown-RIGHT', () => this._turnRight());
        this.input.keyboard.on('keydown-D', () => this._turnRight());
        this.input.keyboard.on('keydown-Q', () => this._strafeLeft());
        this.input.keyboard.on('keydown-E', () => this._strafeRight());
        this.input.keyboard.on('keydown-SPACE', () => this._interact());
        this.input.keyboard.on('keydown-F5', () => this._quickSave());
    }

    _getForwardPos() {
        const dirs = [
            { dx: 0, dy: -1 },
            { dx: 1, dy: 0 },
            { dx: 0, dy: 1 },
            { dx: -1, dy: 0 }
        ];
        const dir = dirs[this.playerDir];
        return { x: this.playerX + dir.dx, y: this.playerY + dir.dy };
    }

    _canMoveTo(x, y) {
        const map = this.maps[this.currentFloor];
        if (y < 0 || y >= map.height || x < 0 || x >= map.width) return false;
        const tile = map.map[y][x];
        return tile.type === 'floor' || tile.type === 'door' || tile.type === 'stairs';
    }

    _moveForward() {
        if (this.isMoving) return;
        const pos = this._getForwardPos();
        if (this._canMoveTo(pos.x, pos.y)) {
            this.isMoving = true;
            this.playerX = pos.x;
            this.playerY = pos.y;
            this._onMove();
        } else {
            this._showMessage('No puedes ir por ahí');
        }
    }

    _moveBackward() {
        if (this.isMoving) return;
        const dirs = [
            { dx: 0, dy: 1 },
            { dx: -1, dy: 0 },
            { dx: 0, dy: -1 },
            { dx: 1, dy: 0 }
        ];
        const dir = dirs[this.playerDir];
        const nx = this.playerX + dir.dx;
        const ny = this.playerY + dir.dy;
        if (this._canMoveTo(nx, ny)) {
            this.isMoving = true;
            this.playerX = nx;
            this.playerY = ny;
            this._onMove();
        }
    }

    _turnLeft() {
        if (this.isMoving) return;
        this.playerDir = (this.playerDir + 3) % 4;
        this._revealMap();
        this._drawView();
    }

    _turnRight() {
        if (this.isMoving) return;
        this.playerDir = (this.playerDir + 1) % 4;
        this._revealMap();
        this._drawView();
    }

    _strafeLeft() {
        if (this.isMoving) return;
        const leftDir = (this.playerDir + 3) % 4;
        const dirs = [{ dx: 0, dy: -1 }, { dx: 1, dy: 0 }, { dx: 0, dy: 1 }, { dx: -1, dy: 0 }];
        const dir = dirs[leftDir];
        const nx = this.playerX + dir.dx;
        const ny = this.playerY + dir.dy;
        if (this._canMoveTo(nx, ny)) {
            this.isMoving = true;
            this.playerX = nx;
            this.playerY = ny;
            this._onMove();
        }
    }

    _strafeRight() {
        if (this.isMoving) return;
        const rightDir = (this.playerDir + 1) % 4;
        const dirs = [{ dx: 0, dy: -1 }, { dx: 1, dy: 0 }, { dx: 0, dy: 1 }, { dx: -1, dy: 0 }];
        const dir = dirs[rightDir];
        const nx = this.playerX + dir.dx;
        const ny = this.playerY + dir.dy;
        if (this._canMoveTo(nx, ny)) {
            this.isMoving = true;
            this.playerX = nx;
            this.playerY = ny;
            this._onMove();
        }
    }

    _onMove() {
        this._revealMap();
        this._checkTileEffects();
        this._drawView();
        this._updateHUD();
        this.playTime += 1;
        this.isMoving = false;

        if (Math.random() < this.encounterRate) {
            this._triggerEncounter();
        }
    }

    _checkTileEffects() {
        const map = this.maps[this.currentFloor];
        const tile = map.map[this.playerY][this.playerX];

        if (tile.trap && !tile.trapTriggered) {
            tile.trapTriggered = true;
            this._handleTrap(tile.trapType, map);
        }

        if (tile.type === 'stairs') {
            this._goDownstairs();
        }
    }

    _handleTrap(type, map) {
        switch (type) {
            case 'poison':
                this.party.forEach(c => { if (c.isAlive()) c.statusEffects.push('poison'); });
                this._showMessage('Trampa de veneno! Todos estan envenenados.');
                break;
            case 'fire':
                this.party.forEach(c => { if (c.isAlive()) c.hp = Math.max(1, c.hp - 5); });
                this._showMessage('Trampa de fuego! Todos reciben dano.');
                break;
            case 'pit':
                this._showMessage('Cayes en un pozo! Vuelves al inicio del piso.');
                const start = map.playerStart;
                this.playerX = start.x;
                this.playerY = start.y;
                break;
            case 'alarm':
                this._showMessage('Alarma! Mas enemigos apareceran.');
                this.encounterRate = Math.min(0.5, this.encounterRate + 0.1);
                break;
        }
    }

    _goDownstairs() {
        if (this.currentFloor >= 15) {
            this._showMessage('Has llegado a la cima!');
            return;
        }
        this.currentFloor++;
        if (!this.maps[this.currentFloor]) {
            this.maps[this.currentFloor] = this.dungeonGen.generate(this.currentFloor);
        }
        const start = this.maps[this.currentFloor].playerStart;
        this.playerX = start.x;
        this.playerY = start.y;
        this._revealMap();
        this._drawView();
        this._showMessage('Piso ' + this.currentFloor + ': ' + this.maps[this.currentFloor].name);
    }

    _interact() {
        const map = this.maps[this.currentFloor];
        const pos = this._getForwardPos();
        if (pos.y >= 0 && pos.y < map.height && pos.x >= 0 && pos.x < map.width) {
            const forwardTile = map.map[pos.y][pos.x];

            if (forwardTile.type === 'door') {
                if (forwardTile.locked) {
                    const hasKey = this.inventory.some(i => i.itemId === 'FLOOR_KEY' && i.quantity > 0);
                    if (hasKey) {
                        forwardTile.locked = false;
                        forwardTile.type = 'floor';
                        this._showMessage('Puerta abierta con llave');
                    } else {
                        this._showMessage('La puerta esta cerrada con llave');
                    }
                } else {
                    forwardTile.type = 'floor';
                    this._showMessage('Puerta abierta');
                }
                this._drawView();
            }

            if (forwardTile.chest && !forwardTile.chestOpened) {
                forwardTile.chestOpened = true;
                const loot = forwardTile.chestLoot;
                this.gold += loot.gold;
                loot.items.forEach(itemId => this._addToInventory(itemId));
                let msg = 'Tesoro! +' + loot.gold + ' oro';
                if (loot.items.length > 0) {
                    msg += ' + ' + loot.items.map(i => ITEMS[i].name).join(', ');
                }
                this._showMessage(msg);
                this._updateHUD();
            }
        }
    }

    _addToInventory(itemId, qty) {
        qty = qty || 1;
        const existing = this.inventory.find(i => i.itemId === itemId);
        if (existing && ITEMS[itemId] && ITEMS[itemId].stackable) {
            existing.quantity += qty;
        } else {
            this.inventory.push({ itemId: itemId, quantity: qty });
        }
    }

    _revealMap() {
        const map = this.maps[this.currentFloor];
        this.dungeonGen.revealAround(map.map, this.playerX, this.playerY, 2);
    }

    _drawView() {
        this.dungeonGraphics.clear();
        const map = this.maps[this.currentFloor];
        const w = 640;
        const h = 400;

        this.dungeonGraphics.fillStyle(0x000000);
        this.dungeonGraphics.fillRect(0, 0, w, h);

        this._draw3DView(map, w, h);
        this._drawMinimap(map, w, h);

        const dirNames = ['Norte', 'Este', 'Sur', 'Oeste'];
        this.compassText.setText('Dir: ' + dirNames[this.playerDir] + ' | Pos: (' + this.playerX + ', ' + this.playerY + ')');
    }

    _draw3DView(map, w, h) {
        const g = this.dungeonGraphics;
        const dirs = [
            { dx: 0, dy: -1 },
            { dx: 1, dy: 0 },
            { dx: 0, dy: 1 },
            { dx: -1, dy: 0 }
        ];

        const viewRange = 4;
        for (let depth = viewRange; depth >= 0; depth--) {
            const scale = 1 / (depth + 1);
            const viewW = w * scale;
            const viewH = h * scale;
            const x = (w - viewW) / 2;
            const y = (h - viewH) / 2;

            for (let side = -1; side <= 1; side++) {
                const checkDir = (this.playerDir + (side === 0 ? 0 : side < 0 ? 3 : 1)) % 4;
                const checkX = this.playerX + dirs[this.playerDir].dx * depth + dirs[checkDir].dx;
                const checkY = this.playerY + dirs[this.playerDir].dy * depth + dirs[checkDir].dy;

                if (checkX < 0 || checkX >= map.width || checkY < 0 || checkY >= map.height) continue;

                const tile = map.map[checkY][checkX];
                const depthAlpha = 1 - (depth / (viewRange + 1));

                if (tile.type === 'wall' || tile.type === 'door') {
                    const wallColor = tile.type === 'door' ? 0x553311 : 0x333355;
                    g.fillStyle(wallColor, depthAlpha);
                    if (side === -1) {
                        g.fillRect(x, y, viewW * 0.2, viewH);
                    } else if (side === 1) {
                        g.fillRect(x + viewW * 0.8, y, viewW * 0.2, viewH);
                    } else {
                        g.fillRect(x, y, viewW, viewH);
                    }
                } else if (tile.type === 'floor' && side === 0 && depth > 0) {
                    g.fillStyle(0x1a1a2e, depthAlpha);
                    g.fillRect(x, y, viewW, viewH);
                }
            }

            g.lineStyle(1, 0x4444aa, 0.3 * (1 - depth / viewRange));
            g.strokeRect(x, y, viewW, viewH);
        }

        g.fillStyle(0x222222);
        g.fillRect(0, h - 30, w, 30);
    }

    _drawMinimap(map, w, h) {
        const g = this.dungeonGraphics;
        const tileSize = 4;
        const startX = w - map.width * tileSize - 10;
        const startY = 10;

        g.fillStyle(0x000000, 0.7);
        g.fillRect(startX - 2, startY - 2, map.width * tileSize + 4, map.height * tileSize + 4);

        for (let y = 0; y < map.height; y++) {
            for (let x = 0; x < map.width; x++) {
                const tile = map.map[y][x];
                if (!tile.explored) continue;

                let color = 0x222222;
                if (tile.type === 'floor') color = 0x555555;
                else if (tile.type === 'wall') color = 0x333333;
                else if (tile.type === 'door') color = 0x886622;
                else if (tile.type === 'stairs') color = 0x44aaff;

                g.fillStyle(color);
                g.fillRect(startX + x * tileSize, startY + y * tileSize, tileSize, tileSize);
            }
        }

        g.fillStyle(0x44ff44);
        g.fillRect(startX + this.playerX * tileSize, startY + this.playerY * tileSize, tileSize, tileSize);
    }

    _updateHUD() {
        this.hud.clear();
        this.hud.draw(this.party, this.currentFloor, this.gold, this._formatTime(this.playTime));
    }

    _formatTime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return String(hours).padStart(2, '0') + ':' + String(mins).padStart(2, '0') + ':' + String(secs).padStart(2, '0');
    }

    _showMessage(msg) {
        this.messageText.setText(msg);
        this.messageText.setAlpha(1);
        this.tweens.add({
            targets: this.messageText,
            alpha: 0,
            delay: 2500,
            duration: 500
        });
    }

    _triggerEncounter() {
        const floorEnemies = ENEMY_FLOORS[this.currentFloor] || ENEMY_FLOORS[1];
        const numEnemies = 1 + Math.floor(Math.random() * 3);
        const enemies = [];

        for (let i = 0; i < numEnemies; i++) {
            const templateId = floorEnemies[Math.floor(Math.random() * floorEnemies.length)];
            enemies.push(new Enemy(templateId, this.currentFloor));
        }

        const self = this;
        this.scene.launch('CombatScene', {
            party: this.party,
            enemies: enemies,
            gold: this.gold,
            inventory: this.inventory,
            onVictory: function(data) {
                self.gold = data.gold;
                self.inventory = data.inventory;
                self._updateHUD();
                self.scene.resume();
            },
            onDefeat: function() {
                self.scene.start('GameOverScene');
            }
        });
        this.scene.pause();
    }

    _quickSave() {
        this.saveSystem.save({
            party: this.party,
            inventory: this.inventory,
            gold: this.gold,
            floor: this.currentFloor,
            playerX: this.playerX,
            playerY: this.playerY,
            playerDir: this.playerDir,
            maps: this.maps,
            playTime: this.playTime
        });
        this._showMessage('Partida guardada!');
    }

    _autoSave() {
        const self = this;
        this.time.addEvent({
            delay: 60000,
            callback: function() {
                self.saveSystem.save({
                    party: self.party,
                    inventory: self.inventory,
                    gold: self.gold,
                    floor: self.currentFloor,
                    playerX: self.playerX,
                    playerY: self.playerY,
                    playerDir: self.playerDir,
                    maps: self.maps,
                    playTime: self.playTime
                });
            },
            loop: true
        });
    }
}
