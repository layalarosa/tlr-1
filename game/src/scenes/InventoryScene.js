class InventoryScene extends Phaser.Scene {
    constructor() { super({ key: 'InventoryScene' }); }

    init(data) {
        this.party = data.party;
        this.inventory = data.inventory;
        this.gold = data.gold;
        this.onclose = data.onclose;
    }

    create() {
        this.cameras.main.fadeIn(300, 0, 0, 0);
        this.g = this.add.graphics();
        this.group = this.add.group();
        this.ui = new UITheme(this);
        this.tab = 'items';
        this.selIdx = 0;
        this.selMember = 0;
        this.selEquipIdx = 0;
        this._draw();
        this._input();
        if (window.setTouchContext) window.setTouchContext('inventory');
    }

    _clear() { this.group.clear(true, true); }

    _txt(x, y, str, style) {
        style = style || {};
        var t = this.add.text(x, y, str, {
            fontSize: style.size || '12px', fontFamily: '"VT323", monospace',
            color: style.color || '#ffffff',
            wordWrap: style.wrap ? { width: style.wrap } : undefined
        });
        if (style.origin) t.setOrigin(style.origin);
        this.group.add(t);
        return t;
    }

    _draw() {
        this.g.clear();
        this._clear();

        this.g.fillStyle(0x050508);
        this.g.fillRect(0, 0, 640, 480);

        this.ui.panel(this.g, 10, 10, 620, 460, {
            borderColor: 0x4444aa,
            bgColor: 0x06060e,
            glowColor: 0x222266
        });

        this.ui.titleBar(this.g, 30, 20, 580, 'INVENTARIO', null, {
            bgColor: 0x141430,
            textColor: '#ffffff',
            fontSize: '18px'
        });

        if (this.textures.exists('ui_coin')) {
            this.add.image(GAME_W / 2 - 50, 55, 'ui_coin').setScale(0.8);
        }
        this._txt(GAME_W / 2 - 30, 48, this.gold + ' G', { size: '14px', color: '#ffff44' });

        var tabs = [
            { label: 'ITEMS', state: 'items', x: 30 },
            { label: 'EQUIPO', state: 'equip', x: 120 },
            { label: 'ESTADO', state: 'status', x: 220 },
            { label: 'SALIR', state: 'exit', x: 320 }
        ];
        var self = this;
        tabs.forEach(function(tab) {
            var active = self.tab === tab.state;
            self.ui.button(self.g, tab.x, 72, 85, 22, { active: active, bgColor: 0x0a0a18, borderColor: 0x333388 });
            self._txt(tab.x + 42, 75, tab.label, { size: '11px', color: active ? '#d49a52' : '#6e4b4f', origin: 0.5 });
        });

        if (this.tab === 'items') this._drawItems();
        else if (this.tab === 'equip') this._drawEquip();
        else if (this.tab === 'status') this._drawStatus();
        else this._drawExit();

        this._txt(GAME_W / 2, 455, 'TAB=cambiar  |  1-9=select  |  ENTER=ok  |  ESC=salir', { size: '10px', color: '#444466', origin: 0.5 });
    }

    _drawItems() {
        var self = this;
        this._txt(30, 95, '> ITEMS:', { size: '13px', color: '#d49a52' });

        var itemIcons = {
            POTION: 'item_potion', HI_POTION: 'item_hi_potion', ETHER: 'item_ether',
            ANTIDOTE: 'item_antidote', REVIVE: 'item_revive', TORCH: 'item_torch',
            WOODEN_SWORD: 'item_sword', IRON_SWORD: 'item_sword', STEEL_SWORD: 'item_sword',
            FIRE_SWORD: 'item_sword', SOLAR_SWORD: 'item_sword',
            DAGGER: 'item_sword', SHORT_SWORD: 'item_sword', POISON_DAGGER: 'item_sword',
            MACE: 'item_mace', STAFF: 'item_sword', BOW: 'item_sword', AXE: 'item_axe',
            SHIELD: 'item_shield', BUCKLER: 'item_shield',
            CLOTH_ARMOR: 'item_armor', LEATHER_ARMOR: 'item_armor',
            CHAIN_MAIL: 'item_armor', PLATE_ARMOR: 'item_armor'
        };

        var consumables = this.inventory.filter(function(inv) {
            return ITEMS[inv.itemId] && ITEMS[inv.itemId].type === 'consumable';
        });

        consumables.forEach(function(inv, i) {
            var item = ITEMS[inv.itemId];
            var y = 120 + i * 28;
            var selected = i === self.selIdx;

            if (selected) {
                self.ui.panel(self.g, 40, y - 2, 560, 26, {
                    borderColor: 0x44ff44,
                    bgColor: 0x0a1a0a,
                    cornerRadius: 4
                });
            }

            if (itemIcons[inv.itemId] && self.textures.exists(itemIcons[inv.itemId])) {
                self.add.image(58, y + 11, itemIcons[inv.itemId]).setScale(1.2);
            }

            var desc = item.description || ('+' + item.value + ' ' + (item.effect === 'heal' ? 'HP' : item.effect === 'mp' ? 'MP' : item.effect === 'revive' ? 'Revive' : item.effect === 'curePoison' ? 'Cura veneno' : ''));
            self._txt(75, y + 3, '[' + (i + 1) + '] ' + item.name, { size: '12px', color: selected ? '#44ff44' : '#cccccc' });
            self._txt(300, y + 3, 'x' + inv.quantity, { size: '11px', color: '#ffff44' });
            self._txt(350, y + 3, desc, { size: '10px', color: selected ? '#88cc88' : '#666677' });
        });

        if (consumables.length === 0) {
            this._txt(50, 120, 'Sin items consumibles', { size: '11px', color: '#555555' });
        }
    }

    _drawEquip() {
        var self = this;
        this._txt(30, 95, 'EQUIPO:', { size: '13px', color: '#d49a52' });

        var classPortraits = {
            warrior: 'portrait_warrior', mage: 'portrait_mage',
            thief: 'portrait_thief', cleric: 'portrait_cleric'
        };

        this.party.forEach(function(c, i) {
            var y = 110 + i * 76;
            var selected = i === self.selMember;

            self.ui.panel(self.g, 40, y, 560, 70, {
                borderColor: selected ? 0x8e3040 : 0x3b2028,
                bgColor: selected ? 0x0c0c18 : 0x08080f,
                cornerRadius: 6
            });

            var classKey = c.classData.id.toLowerCase();
            if (classPortraits[classKey] && self.textures.exists(classPortraits[classKey])) {
                self.add.image(68, y + 28, classPortraits[classKey]).setScale(1.3);
            }

            self._txt(95, y + 6, c.name, { size: '13px', color: '#ffaa44' });
            self._txt(95, y + 22, c.race.name + ' ' + c.classData.name + ' Lv.' + c.level, { size: '10px', color: '#888899' });

            var wpnItem = c.equipment.weapon ? (self._findCustomItem(c.equipment.weapon) || ITEMS[c.equipment.weapon]) : null;
            var armItem = c.equipment.body ? (self._findCustomItem(c.equipment.body) || ITEMS[c.equipment.body]) : null;
            var shdItem = c.equipment.offhand ? (self._findCustomItem(c.equipment.offhand) || ITEMS[c.equipment.offhand]) : null;

            self._txt(95, y + 38, '⚔ ' + (wpnItem ? wpnItem.name : 'Manos'), { size: '10px', color: wpnItem ? '#cccccc' : '#555555' });
            self._txt(95, y + 52, '🛡 ' + (armItem ? armItem.name : 'Nada'), { size: '10px', color: armItem ? '#cccccc' : '#555555' });
            self._txt(250, y + 38, '🔰 ' + (shdItem ? shdItem.name : 'Nada'), { size: '10px', color: shdItem ? '#cccccc' : '#555555' });

            self._txt(400, y + 6, 'ATK', { size: '9px', color: '#ff6644' });
            self._txt(430, y + 6, '' + c.getAtk(), { size: '11px', color: '#ffaa88' });
            self._txt(470, y + 6, 'DEF', { size: '9px', color: '#4488ff' });
            self._txt(500, y + 6, '' + c.getDef(), { size: '11px', color: '#88aaff' });
            self._txt(400, y + 22, 'SPD', { size: '9px', color: '#44ff44' });
            self._txt(430, y + 22, '' + c.getSpeed(), { size: '11px', color: '#88ff88' });
            self._txt(470, y + 22, 'MAG', { size: '9px', color: '#aa44ff' });
            self._txt(500, y + 22, '' + c.getMagAtk(), { size: '11px', color: '#cc88ff' });

            var hpPct = c.maxHp > 0 ? c.hp / c.maxHp : 0;
            var mpPct = c.maxMp > 0 ? c.mp / c.maxMp : 0;
            self.ui.hpBar(self.g, 400, y + 42, 100, 8, hpPct);
            self.ui.mpBar(self.g, 400, y + 56, 100, 8, mpPct);
        });

        var equipment = this._getEquipmentItems();
        this._txt(30, 425, 'EQUIPAR (miembro ' + (this.selMember + 1) + '):', { size: '11px', color: '#d49a52' });
        if (equipment.length === 0) {
            this._txt(205, 425, 'No hay armas ni armaduras', { size: '10px', color: '#555566' });
        } else {
            var selected = equipment[this.selEquipIdx];
            this._txt(205, 425, '[' + (this.selEquipIdx + 1) + '] ' + selected.item.name + '  ENTER=usar', { size: '10px', color: '#44ff44' });
        }
    }

    _findCustomItem(itemId) {
        var inv = this.inventory.find(function(i) { return i.itemId === itemId && i.customItem; });
        return inv ? inv.customItem : null;
    }

    _getEquipmentItems() {
        return this.inventory.map(function(inv) {
            var item = inv.customItem || ITEMS[inv.itemId];
            return item && (item.type === 'weapon' || item.type === 'armor') ? { inv: inv, item: item } : null;
        }).filter(Boolean);
    }

    _drawStatus() {
        var self = this;
        this._txt(30, 95, 'ESTADO DEL GRUPO:', { size: '13px', color: '#d49a52' });

        this.party.forEach(function(c, i) {
            var y = 115 + i * 85;
            var selected = i === self.selMember;

            self.ui.panel(self.g, 40, y, 560, 80, {
                borderColor: selected ? 0x4444aa : 0x222244,
                bgColor: selected ? 0x0c0c18 : 0x08080f,
                cornerRadius: 6
            });

            self._txt(55, y + 6, c.name, { size: '13px', color: '#ffaa44' });
            self._txt(55, y + 22, c.race.name + ' ' + c.classData.name + ' Lv.' + c.level, { size: '10px', color: '#888899' });
            self._txt(55, y + 36, 'EXP: ' + c.exp + '/' + c.expToNext, { size: '10px', color: '#666688' });
            self._txt(55, y + 50, 'Alineación: ' + c.alignment.name, { size: '10px', color: '#666688' });

            var hpPct = c.maxHp > 0 ? c.hp / c.maxHp : 0;
            var mpPct = c.maxMp > 0 ? c.mp / c.maxMp : 0;
            self.ui.hpBar(self.g, 300, y + 10, 150, 10, hpPct);
            self.ui.mpBar(self.g, 300, y + 28, 150, 10, mpPct);

            self._txt(460, y + 8, 'HP', { size: '9px', color: '#ff6644' });
            self._txt(480, y + 8, c.hp + '/' + c.maxHp, { size: '10px', color: '#ffaa88' });
            self._txt(460, y + 26, 'MP', { size: '9px', color: '#4488ff' });
            self._txt(480, y + 26, c.mp + '/' + c.maxMp, { size: '10px', color: '#88aaff' });

            self._txt(300, y + 46, 'ATK:' + c.getAtk() + ' DEF:' + c.getDef() + ' SPD:' + c.getSpeed() + ' MAG:' + c.getMagAtk(), { size: '10px', color: '#666688' });

            if (c.statusEffects && c.statusEffects.length > 0) {
                self._txt(300, y + 62, '⚠ ' + c.statusEffects.join(', '), { size: '10px', color: '#ff4444' });
            }
        });
    }

    _drawExit() {
        this._txt(30, 95, '> SALIR:', { size: '13px', color: '#ff4444' });
        this.ui.panel(this.g, 40, 120, 560, 60, {
            borderColor: 0x442222,
            bgColor: 0x0a0606,
            cornerRadius: 6
        });
        this._txt(60, 135, 'Cerrar inventario y volver a explorar.', { size: '13px', color: '#c18b7c' });
        this._txt(60, 155, 'ENTER o ESC para salir', { size: '12px', color: '#44ff44' });
    }

    _input() {
        var self = this;
        this.input.keyboard.on('keydown-TAB', function(e) {
            e.preventDefault();
            if (self.tab === 'items') self.tab = 'equip';
            else if (self.tab === 'equip') self.tab = 'status';
            else if (self.tab === 'status') self.tab = 'exit';
            else self.tab = 'items';
            self.selIdx = 0;
            self.selMember = 0;
            self._draw();
        });
        this.input.keyboard.on('keydown-ESC', function() {
            self.cameras.main.fadeOut(300, 0, 0, 0);
            self.cameras.main.once('camerafadeoutcomplete', function() {
                self.onclose();
            });
        });
        this.input.keyboard.on('keydown-ENTER', function() {
            if (self.tab === 'exit') {
                self.cameras.main.fadeOut(300, 0, 0, 0);
                self.cameras.main.once('camerafadeoutcomplete', function() {
                    self.onclose();
                });
            } else if (self.tab === 'items') {
                self._useItem();
            } else if (self.tab === 'equip') {
                self._equipSelected();
            }
        });
        this.input.keyboard.on('keydown-W', function() {
            if (self.tab === 'items') {
                self.selIdx = Math.max(0, self.selIdx - 1);
                self._draw();
            } else {
                self.selMember = Math.max(0, self.selMember - 1);
                self._draw();
            }
        });
        this.input.keyboard.on('keydown-S', function() {
            if (self.tab === 'items') {
                var consumables = self.inventory.filter(function(inv) { return ITEMS[inv.itemId] && ITEMS[inv.itemId].type === 'consumable'; });
                self.selIdx = Math.min(consumables.length - 1, self.selIdx + 1);
                self._draw();
            } else {
                self.selMember = Math.min(self.party.length - 1, self.selMember + 1);
                self._draw();
            }
        });
        var keyNames = ['ONE','TWO','THREE','FOUR','FIVE','SIX','SEVEN','EIGHT','NINE'];
        for (var n = 1; n <= 9; n++) {
            (function(num, keyName) {
                self.input.keyboard.on('keydown-' + keyName, function() {
                    if (self.tab === 'equip') self.selEquipIdx = num - 1;
                    else self.selIdx = num - 1;
                    self._draw();
                });
            })(n, keyNames[n - 1]);
        }
    }

    _useItem() {
        var self = this;
        var consumables = this.inventory.filter(function(inv) { return ITEMS[inv.itemId] && ITEMS[inv.itemId].type === 'consumable'; });
        if (this.selIdx >= consumables.length) return;
        var inv = consumables[this.selIdx];
        var item = ITEMS[inv.itemId];

        if (item.effect === 'heal') {
            var wounded = this.party.filter(function(c) { return c.isAlive() && c.hp < c.maxHp; });
            if (wounded.length) {
                var target = wounded.reduce(function(a, b) { return a.hp < b.hp ? a : b; });
                target.heal(item.value);
                inv.quantity--;
                if (inv.quantity <= 0) this.inventory = this.inventory.filter(function(i) { return i !== inv; });
                this._draw();
            }
        } else if (item.effect === 'revive') {
            var dead = this.party.filter(function(c) { return !c.isAlive(); });
            if (dead.length) {
                dead[0].alive = true;
                dead[0].hp = Math.floor(dead[0].maxHp * 0.5);
                inv.quantity--;
                if (inv.quantity <= 0) this.inventory = this.inventory.filter(function(i) { return i !== inv; });
                this._draw();
            }
        } else if (item.effect === 'mp') {
            var lowMp = this.party.filter(function(c) { return c.isAlive() && c.mp < c.maxMp; });
            if (lowMp.length) {
                var t = lowMp.reduce(function(a, b) { return a.mp < b.mp ? a : b; });
                t.restoreMp(item.value);
                inv.quantity--;
                if (inv.quantity <= 0) this.inventory = this.inventory.filter(function(i) { return i !== inv; });
                this._draw();
            }
        } else if (item.effect === 'curePoison') {
            var poisoned = this.party.filter(function(c) { return c.isAlive() && c.statusEffects && c.statusEffects.indexOf('poison') !== -1; });
            if (poisoned.length) {
                poisoned[0].statusEffects = poisoned[0].statusEffects.filter(function(e) { return e !== 'poison'; });
                inv.quantity--;
                if (inv.quantity <= 0) this.inventory = this.inventory.filter(function(i) { return i !== inv; });
                this._draw();
            }
        }
    }

    _cycleMember() {
        this.selMember = (this.selMember + 1) % this.party.length;
        this._draw();
    }

    _equipSelected() {
        var equipment = this._getEquipmentItems();
        var selected = equipment[this.selEquipIdx];
        var character = this.party[this.selMember];
        if (!selected || !character) return;
        var item = selected.item;
        if (item.classes && item.classes.indexOf(character.classData.id) === -1) {
            this._txt(320, 445, 'Clase incompatible', { size: '10px', color: '#ff4444' });
            return;
        }
        if (!AlignmentSystem.canEquipItem(character, item.id)) {
            this._txt(320, 445, 'Alineacion incompatible', { size: '10px', color: '#ff4444' });
            return;
        }
        var slot = item.slot;
        var previous = character.equipment[slot];
        character.equipment[slot] = item.id;
        selected.inv.quantity--;
        if (selected.inv.quantity <= 0) this.inventory = this.inventory.filter(function(inv) { return inv !== selected.inv; });
        if (previous) this.inventory.push({ itemId: previous, quantity: 1, customItem: getCustomItem(previous) || undefined });
        this.selEquipIdx = 0;
        this._draw();
    }
}
