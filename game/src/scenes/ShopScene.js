class ShopScene extends Phaser.Scene {
    constructor() { super({ key: 'ShopScene' }); }

    init(data) {
        this.party = data.party;
        this.inventory = data.inventory;
        this.gold = data.gold;
        this.floor = data.floor;
        this.onclose = data.onclose;
    }

    create() {
        this.cameras.main.fadeIn(300, 0, 0, 0);
        this.g = this.add.graphics();
        this.group = this.add.group();
        this.ui = new UITheme(this);
        this.state = 'buy';
        this.selIdx = 0;
        this.shopGreeting = getShopDialogue('greeting');
        this._draw();
        this._input();
        if (window.setTouchContext) window.setTouchContext('shop');
    }

    _clear() { this.group.clear(true, true); }

    _txt(x, y, str, style) {
        style = style || {};
        var t = this.add.text(x, y, str, {
            fontSize: style.size || '12px', fontFamily: '"VT323", monospace', color: style.color || '#ffffff',
            wordWrap: style.wrap ? { width: style.wrap } : undefined
        });
        if (style.origin) t.setOrigin(style.origin);
        this.group.add(t);
        return t;
    }

    _draw() {
        this.g.clear();
        this._clear();

        this.g.fillStyle(0x050a05);
        this.g.fillRect(0, 0, 640, 480);

        this.ui.panel(this.g, 10, 10, 620, 460, {
            borderColor: 0x22aa22,
            bgColor: 0x060c06,
            glowColor: 0x115511
        });

        this.ui.titleBar(this.g, 30, 20, 580, 'TIENDA DEL PISO ' + this.floor, null, {
            bgColor: 0x0a220a,
            textColor: '#44ff44',
            fontSize: '18px'
        });

        this._txt(GAME_W / 2, 58, this.shopGreeting, { size: '12px', color: '#88cc88', origin: 0.5, wrap: 560 });
        this._txt(GAME_W / 2, 78, 'Oro: ' + this.gold, { size: '14px', color: '#ffff44', origin: 0.5 });

        var tabs = [
            { label: 'COMPRAR', state: 'buy', x: 30 },
            { label: 'VENDER', state: 'sell', x: 140 },
            { label: 'IR', state: 'leave', x: 230 }
        ];
        var self = this;
        tabs.forEach(function(tab) {
            var active = self.state === tab.state;
            self.ui.button(self.g, tab.x, 95, 95, 22, { active: active, bgColor: 0x0a1a0a, borderColor: 0x228822 });
            self._txt(tab.x + 47, 98, tab.label, { size: '12px', color: active ? '#44ff44' : '#668866', origin: 0.5 });
        });

        if (this.state === 'buy') this._drawBuy();
        else if (this.state === 'sell') this._drawSell();
        else this._drawLeave();

        this._txt(GAME_W / 2, 455, 'TAB=cambiar  |  Tecla num  |  ENTER=ok  |  ESC=salir', { size: '10px', color: '#446644', origin: 0.5 });
    }

    _getShopItems() {
        var pool = ['POTION', 'HI_POTION', 'ETHER', 'ANTIDOTE', 'REVIVE', 'TORCH', 'FLOOR_KEY'];
        if (this.floor >= 2) pool.push('IRON_SWORD', 'LEATHER_ARMOR', 'BUCKLER');
        if (this.floor >= 4) pool.push('STEEL_SWORD', 'CHAIN_MAIL', 'SHIELD');
        if (this.floor >= 7) pool.push('MACE', 'BOW');
        if (this.floor >= 10) pool.push('PLATE_ARMOR', 'AXE');
        return pool.filter(function(id) { return ITEMS[id]; });
    }

    _drawBuy() {
        var items = this._getShopItems();
        var self = this;
        this._txt(30, 120, '> COMPRAR:', { size: '14px', color: '#44ff44' });
        items.forEach(function(id, i) {
            var item = ITEMS[id];
            var canBuy = self.gold >= item.price;
            self._txt(50, 145 + i * 22, '[' + (i + 1) + '] ' + item.name + ' - ' + item.price + ' oro' + (item.atk ? ' [ATK+' + item.atk + ']' : item.def ? ' [DEF+' + item.def + ']' : item.value ? ' [+' + item.value + ']' : ''), { size: '11px', color: canBuy ? '#cccccc' : '#555555' });
        });
        this._txt(GAME_W / 2, 440, 'Tecla num=seleccionar  |  ENTER=comprar  |  TAB=cambiar', { size: '10px', color: '#555555', origin: 0.5 });
    }

    _drawSell() {
        var self = this;
        this._txt(30, 120, '> VENDER:', { size: '14px', color: '#ffaa44' });
        var sellable = this.inventory.filter(function(inv) {
            var item = inv.customItem || ITEMS[inv.itemId];
            return item && item.price > 0;
        });
        sellable.forEach(function(inv, i) {
            var item = inv.customItem || ITEMS[inv.itemId];
            self._txt(50, 145 + i * 22, '[' + (i + 1) + '] ' + item.name + ' x' + inv.quantity + ' -> ' + Math.floor(item.price / 2) + ' oro', { size: '11px', color: '#cccccc' });
        });
        if (sellable.length === 0) this._txt(50, 145, 'Nada para vender', { size: '11px', color: '#555555' });
        this._txt(GAME_W / 2, 440, 'Tecla num=seleccionar  |  TAB=cambiar  |  ESC=salir', { size: '10px', color: '#555555', origin: 0.5 });
    }

    _drawLeave() {
        var leaveMsg = getShopDialogue('leave');
        this._txt(30, 120, '> IR:', { size: '14px', color: '#ff4444' });
        this._txt(30, 150, leaveMsg, { size: '12px', color: '#aaaaff', wrap: 580 });
        this._txt(30, 200, 'ENTER para salir', { size: '12px', color: '#44ff44' });
    }

    _input() {
        var self = this;
        this.input.keyboard.on('keydown-TAB', function(e) {
            e.preventDefault();
            if (self.state === 'buy') self.state = 'sell';
            else if (self.state === 'sell') self.state = 'leave';
            else self.state = 'buy';
            self._draw();
        });
        this.input.keyboard.on('keydown-ESC', function() {
            self.cameras.main.fadeOut(300, 0, 0, 0);
            self.cameras.main.once('camerafadeoutcomplete', function() {
                self.onclose({ gold: self.gold, inventory: self.inventory });
            });
        });
        this.input.keyboard.on('keydown-ENTER', function() {
            if (self.state === 'leave') {
                self.cameras.main.fadeOut(300, 0, 0, 0);
                self.cameras.main.once('camerafadeoutcomplete', function() {
                    self.onclose({ gold: self.gold, inventory: self.inventory });
                });
                return;
            }
            if (self.state === 'buy') {
                var items = self._getShopItems();
                if (self.selIdx < items.length) {
                    var id = items[self.selIdx];
                    var item = ITEMS[id];
                    if (self.gold >= item.price) {
                        self.gold -= item.price;
                        self._addInv(id);
                        self.shopGreeting = getShopDialogue('buy');
                        self._draw();
                    }
                }
            } else if (self.state === 'sell') {
                var sellable = self.inventory.filter(function(inv) {
                    var item = inv.customItem || ITEMS[inv.itemId];
                    return item && item.price > 0;
                });
                if (self.selIdx < sellable.length) {
                    var inv = sellable[self.selIdx];
                    var item = inv.customItem || ITEMS[inv.itemId];
                    var sellPrice = Math.floor(item.price / 2);
                    self.gold += sellPrice;
                    inv.quantity--;
                    if (inv.quantity <= 0) {
                        self.inventory = self.inventory.filter(function(i) { return i !== inv; });
                    }
                    self.shopGreeting = getShopDialogue('sell');
                    self._draw();
                }
            }
        });
        var keyNames = ['ONE','TWO','THREE','FOUR','FIVE','SIX','SEVEN','EIGHT','NINE'];
        for (var n = 1; n <= 9; n++) {
            (function(num, keyName) {
                self.input.keyboard.on('keydown-' + keyName, function() {
                    self.selIdx = num - 1;
                    self._draw();
                });
            })(n, keyNames[n - 1]);
        }
    }

    _addInv(itemId) {
        var ex = this.inventory.find(function(i) { return i.itemId === itemId; });
        if (ex && ITEMS[itemId] && ITEMS[itemId].stackable) ex.quantity++;
        else this.inventory.push({ itemId: itemId, quantity: 1 });
    }
}
