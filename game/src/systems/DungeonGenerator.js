class DungeonGenerator {
    constructor() {
        this.floorConfigs = {
            1: { name: 'Los Sotanos Olvidados', width: 8, height: 8, traps: 2, chests: 2, stairs: 1, shop: 0 },
            2: { name: 'Los Sotanos Olvidados', width: 9, height: 9, traps: 3, chests: 2, stairs: 1, shop: 0 },
            3: { name: 'Los Sotanos Olvidados', width: 10, height: 10, traps: 3, chests: 3, stairs: 1, shop: 1 },
            4: { name: 'Las Criptas Profundas', width: 10, height: 10, traps: 4, chests: 3, stairs: 1, shop: 0 },
            5: { name: 'Las Criptas Profundas', width: 11, height: 11, traps: 4, chests: 3, stairs: 1, shop: 0 },
            6: { name: 'Las Criptas Profundas', width: 11, height: 11, traps: 5, chests: 4, stairs: 1, shop: 1 },
            7: { name: 'Las Criptas Profundas', width: 12, height: 12, traps: 5, chests: 4, stairs: 1, shop: 0 },
            8: { name: 'El Laberinto Elemental', width: 12, height: 12, traps: 6, chests: 4, stairs: 1, shop: 0 },
            9: { name: 'El Laberinto Elemental', width: 13, height: 13, traps: 6, chests: 5, stairs: 1, shop: 0 },
            10: { name: 'El Laberinto Elemental', width: 13, height: 13, traps: 7, chests: 5, stairs: 1, shop: 1 },
            11: { name: 'El Laberinto Elemental', width: 14, height: 14, traps: 7, chests: 5, stairs: 1, shop: 0 },
            12: { name: 'La Torre del Archimago', width: 14, height: 14, traps: 8, chests: 5, stairs: 1, shop: 0 },
            13: { name: 'La Torre del Archimago', width: 15, height: 15, traps: 8, chests: 6, stairs: 1, shop: 1 },
            14: { name: 'La Torre del Archimago', width: 15, height: 15, traps: 9, chests: 6, stairs: 1, shop: 0 },
            15: { name: 'La Cima del Archimago', width: 8, height: 8, traps: 0, chests: 1, stairs: 0, shop: 0 }
        };
    }

    generate(floor) {
        var config = this.floorConfigs[floor] || this.floorConfigs[1];
        var map = this._emptyMap(config.width, config.height);
        var rooms = this._genRooms(map, config);
        this._connect(map, rooms);
        this._doors(map, rooms);
        this._traps(map, config.traps);
        this._chests(map, config.chests, floor);
        if (config.shop > 0) this._shop(map, rooms);

        var start = this._center(rooms[0]);
        var stairsPos = null;
        if (config.stairs > 0 && floor < 15) {
            var last = rooms[rooms.length - 1];
            stairsPos = this._center(last);
            map[stairsPos.y][stairsPos.x] = { type: 'stairs', explored: false, visible: false };
        }

        return { floor: floor, name: config.name, width: config.width, height: config.height, map: map, playerStart: start, stairsPos: stairsPos };
    }

    _emptyMap(w, h) {
        var m = [];
        for (var y = 0; y < h; y++) { m[y] = []; for (var x = 0; x < w; x++) m[y][x] = { type: 'wall', explored: false, visible: false }; }
        return m;
    }

    _genRooms(map, config) {
        var rooms = [];
        var max = 4 + Math.floor(Math.random() * 3);
        var minS = 3, maxS = Math.min(6, Math.floor(Math.min(config.width, config.height) / 3));
        for (var i = 0; i < max * 15 && rooms.length < max; i++) {
            var rw = minS + Math.floor(Math.random() * (maxS - minS));
            var rh = minS + Math.floor(Math.random() * (maxS - minS));
            var rx = 1 + Math.floor(Math.random() * (config.width - rw - 2));
            var ry = 1 + Math.floor(Math.random() * (config.height - rh - 2));
            var room = { x: rx, y: ry, w: rw, h: rh };
            if (!this._overlap(room, rooms)) {
                this._carve(map, room);
                rooms.push(room);
            }
        }
        return rooms;
    }

    _overlap(r, rooms) {
        for (var i = 0; i < rooms.length; i++) {
            var o = rooms[i];
            if (r.x < o.x + o.w + 1 && r.x + r.w + 1 > o.x && r.y < o.y + o.h + 1 && r.y + r.h + 1 > o.y) return true;
        }
        return false;
    }

    _carve(map, room) {
        for (var y = room.y; y < room.y + room.h; y++)
            for (var x = room.x; x < room.x + room.w; x++)
                map[y][x] = { type: 'floor', explored: false, visible: false };
    }

    _connect(map, rooms) {
        for (var i = 0; i < rooms.length - 1; i++) {
            var a = this._center(rooms[i]), b = this._center(rooms[i + 1]);
            var x = a.x, y = a.y;
            while (x !== b.x) {
                if (map[y] && map[y][x] && map[y][x].type === 'wall') map[y][x] = { type: 'floor', explored: false, visible: false };
                x += x < b.x ? 1 : -1;
            }
            while (y !== b.y) {
                if (map[y] && map[y][x] && map[y][x].type === 'wall') map[y][x] = { type: 'floor', explored: false, visible: false };
                y += y < b.y ? 1 : -1;
            }
        }
    }

    _doors(map, rooms) {
        for (var i = 0; i < rooms.length; i++) {
            var room = rooms[i];
            var edges = [];
            for (var x = room.x; x < room.x + room.w; x++) {
                if (room.y > 0 && map[room.y - 1][x].type === 'floor') edges.push({ x: x, y: room.y });
                if (room.y + room.h < map.length && map[room.y + room.h][x].type === 'floor') edges.push({ x: x, y: room.y + room.h - 1 });
            }
            for (var y = room.y; y < room.y + room.h; y++) {
                if (room.x > 0 && map[y][room.x - 1].type === 'floor') edges.push({ x: room.x, y: y });
                if (room.x + room.w < map[0].length && map[y][room.x + room.w].type === 'floor') edges.push({ x: room.x + room.w - 1, y: y });
            }
            if (edges.length > 0 && Math.random() < 0.4) {
                var e = edges[Math.floor(Math.random() * edges.length)];
                map[e.y][e.x] = { type: 'door', locked: Math.random() < 0.3, explored: false, visible: false };
            }
        }
    }

    _traps(map, count) {
        var placed = 0, att = 0;
        while (placed < count && att < 200) {
            var y = Math.floor(Math.random() * map.length);
            var x = Math.floor(Math.random() * map[0].length);
            if (map[y][x].type === 'floor' && !map[y][x].trap) {
                map[y][x].trap = true;
                map[y][x].trapType = ['poison', 'fire', 'pit', 'alarm'][Math.floor(Math.random() * 4)];
                placed++;
            }
            att++;
        }
    }

    _chests(map, count, floor) {
        var placed = 0, att = 0;
        while (placed < count && att < 200) {
            var y = Math.floor(Math.random() * map.length);
            var x = Math.floor(Math.random() * map[0].length);
            if (map[y][x].type === 'floor' && !map[y][x].chest && !map[y][x].trap) {
                map[y][x].chest = true;
                map[y][x].chestOpen = false;
                map[y][x].chestLoot = this._loot(floor);
                placed++;
            }
            att++;
        }
    }

    _shop(map, rooms) {
        var mid = rooms[Math.floor(rooms.length / 2)];
        var c = this._center(mid);
        map[c.y][c.x] = { type: 'shop', explored: false, visible: false };
    }

    _loot(floor) {
        var gold = 10 + Math.floor(Math.random() * 20 * floor);
        var items = [];
        if (Math.random() < 0.6) {
            var keys = Object.keys(ITEMS).filter(function(k) { return ITEMS[k].price > 0 && ITEMS[k].price < 200 * floor; });
            if (keys.length) {
                var baseId = keys[Math.floor(Math.random() * keys.length)];
                var baseItem = ITEMS[baseId];
                var affixes = rollAffixes(baseItem);
                if (affixes) {
                    var affixedName = buildAffixedName(baseItem.name, affixes);
                    var affixedItem = {};
                    for (var k in baseItem) affixedItem[k] = baseItem[k];
                    affixedItem.id = baseId + '_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
                    affixedItem.name = affixedName;
                    affixedItem.isAffixed = true;
                    affixedItem.affixData = affixes;
                    if (affixedItem.atk) affixedItem.atk += affixes.totalAtk;
                    if (affixedItem.def) affixedItem.def += affixes.totalDef;
                    if (affixedItem.mp) affixedItem.mp += affixes.totalMp;
                    if (affixes.totalMp && !affixedItem.mp) affixedItem.mp = affixes.totalMp;
                    if (affixes.specials.length > 0) affixedItem.special = affixes.specials[0];
                    if (affixedItem.price) affixedItem.price = Math.floor(affixedItem.price * (1 + affixes.totalAtk * 0.15 + affixes.totalDef * 0.1));
                    registerCustomItem(affixedItem);
                    items.push({ affixed: true, itemData: affixedItem });
                } else {
                    items.push(baseId);
                }
            }
        }
        return { gold: gold, items: items };
    }

    _center(room) { return { x: Math.floor(room.x + room.w / 2), y: Math.floor(room.y + room.h / 2) }; }

    revealAround(map, px, py, radius) {
        radius = radius || 2;
        for (var dy = -radius; dy <= radius; dy++) {
            for (var dx = -radius; dx <= radius; dx++) {
                var ny = py + dy, nx = px + dx;
                if (ny >= 0 && ny < map.length && nx >= 0 && nx < map[0].length) {
                    map[ny][nx].explored = true;
                    map[ny][nx].visible = Math.abs(dx) <= 1 && Math.abs(dy) <= 1;
                }
            }
        }
    }
}
