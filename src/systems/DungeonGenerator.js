class DungeonGenerator {
    constructor() {
        this.floorConfigs = {
            1: { name: 'Los Sótanos Olvidados', width: 8, height: 8, traps: 2, chests: 2, stairs: 1 },
            2: { name: 'Los Sótanos Olvidados', width: 9, height: 9, traps: 3, chests: 2, stairs: 1 },
            3: { name: 'Los Sótanos Olvidados', width: 10, height: 10, traps: 3, chests: 3, stairs: 1 },
            4: { name: 'Las Criptas Profundas', width: 10, height: 10, traps: 4, chests: 3, stairs: 1 },
            5: { name: 'Las Criptas Profundas', width: 11, height: 11, traps: 4, chests: 3, stairs: 1 },
            6: { name: 'Las Criptas Profundas', width: 11, height: 11, traps: 5, chests: 4, stairs: 1 },
            7: { name: 'Las Criptas Profundas', width: 12, height: 12, traps: 5, chests: 4, stairs: 1 },
            8: { name: 'El Laberinto Elemental', width: 12, height: 12, traps: 6, chests: 4, stairs: 1 },
            9: { name: 'El Laberinto Elemental', width: 13, height: 13, traps: 6, chests: 5, stairs: 1 },
            10: { name: 'El Laberinto Elemental', width: 13, height: 13, traps: 7, chests: 5, stairs: 1 },
            11: { name: 'El Laberinto Elemental', width: 14, height: 14, traps: 7, chests: 5, stairs: 1 },
            12: { name: 'La Torre del Archimago', width: 14, height: 14, traps: 8, chests: 5, stairs: 1 },
            13: { name: 'La Torre del Archimago', width: 15, height: 15, traps: 8, chests: 6, stairs: 1 },
            14: { name: 'La Torre del Archimago', width: 15, height: 15, traps: 9, chests: 6, stairs: 1 },
            15: { name: 'La Cima del Archimago', width: 8, height: 8, traps: 0, chests: 1, stairs: 0 }
        };
    }

    generate(floor) {
        const config = this.floorConfigs[floor] || this.floorConfigs[1];
        const map = this._createEmptyMap(config.width, config.height);
        const rooms = this._generateRooms(map, config);
        this._connectRooms(map, rooms);
        this._placeDoors(map, rooms);
        this._placeTraps(map, config.traps);
        this._placeChests(map, config.chests, floor);

        const playerStart = this._getRoomCenter(rooms[0]);
        let stairsPos = null;
        if (config.stairs > 0 && floor < 15) {
            const lastRoom = rooms[rooms.length - 1];
            stairsPos = this._getRoomCenter(lastRoom);
            map[stairsPos.y][stairsPos.x] = { type: 'stairs', direction: 'down' };
        }

        return {
            floor,
            name: config.name,
            width: config.width,
            height: config.height,
            map,
            playerStart,
            stairsPos,
            traps: this._getTrapPositions(map),
            chests: this._getChestPositions(map)
        };
    }

    _createEmptyMap(width, height) {
        const map = [];
        for (let y = 0; y < height; y++) {
            map[y] = [];
            for (let x = 0; x < width; x++) {
                map[y][x] = { type: 'wall', explored: false, visible: false };
            }
        }
        return map;
    }

    _generateRooms(map, config) {
        const rooms = [];
        const maxRooms = 4 + Math.floor(Math.random() * 3);
        const minRoomSize = 3;
        const maxRoomSize = Math.min(6, Math.floor(Math.min(config.width, config.height) / 3));

        for (let i = 0; i < maxRooms * 10 && rooms.length < maxRooms; i++) {
            const w = minRoomSize + Math.floor(Math.random() * (maxRoomSize - minRoomSize));
            const h = minRoomSize + Math.floor(Math.random() * (maxRoomSize - minRoomSize));
            const x = 1 + Math.floor(Math.random() * (config.width - w - 2));
            const y = 1 + Math.floor(Math.random() * (config.height - h - 2));

            const room = { x, y, w, h };
            if (!this._roomOverlaps(room, rooms)) {
                this._carveRoom(map, room);
                rooms.push(room);
            }
        }
        return rooms;
    }

    _roomOverlaps(room, rooms) {
        for (const r of rooms) {
            if (room.x < r.x + r.w + 1 && room.x + room.w + 1 > r.x &&
                room.y < r.y + r.h + 1 && room.y + room.h + 1 > r.y) {
                return true;
            }
        }
        return false;
    }

    _carveRoom(map, room) {
        for (let y = room.y; y < room.y + room.h; y++) {
            for (let x = room.x; x < room.x + room.w; x++) {
                map[y][x] = { type: 'floor', explored: false, visible: false };
            }
        }
    }

    _connectRooms(map, rooms) {
        for (let i = 0; i < rooms.length - 1; i++) {
            const a = this._getRoomCenter(rooms[i]);
            const b = this._getRoomCenter(rooms[i + 1]);
            this._carveCorridor(map, a, b);
        }
    }

    _carveCorridor(map, a, b) {
        let x = a.x;
        let y = a.y;

        while (x !== b.x) {
            if (map[y] && map[y][x]) {
                map[y][x] = { type: 'floor', explored: false, visible: false };
            }
            x += x < b.x ? 1 : -1;
        }
        while (y !== b.y) {
            if (map[y] && map[y][x]) {
                map[y][x] = { type: 'floor', explored: false, visible: false };
            }
            y += y < b.y ? 1 : -1;
        }
    }

    _placeDoors(map, rooms) {
        for (const room of rooms) {
            const edges = [];
            for (let x = room.x; x < room.x + room.w; x++) {
                if (room.y > 0 && map[room.y - 1][x].type === 'floor') edges.push({ x, y: room.y, dir: 'north' });
                if (room.y + room.h < map.length && map[room.y + room.h][x].type === 'floor') edges.push({ x, y: room.y + room.h - 1, dir: 'south' });
            }
            for (let y = room.y; y < room.y + room.h; y++) {
                if (room.x > 0 && map[y][room.x - 1].type === 'floor') edges.push({ x: room.x, y, dir: 'west' });
                if (room.x + room.w < map[0].length && map[y][room.x + room.w].type === 'floor') edges.push({ x: room.x + room.w - 1, y, dir: 'east' });
            }
            if (edges.length > 0 && Math.random() < 0.4) {
                const edge = edges[Math.floor(Math.random() * edges.length)];
                map[edge.y][edge.x].type = 'door';
                map[edge.y][edge.x].locked = Math.random() < 0.3;
            }
        }
    }

    _placeTraps(map, count) {
        let placed = 0;
        let attempts = 0;
        while (placed < count && attempts < 100) {
            const y = Math.floor(Math.random() * map.length);
            const x = Math.floor(Math.random() * map[0].length);
            if (map[y][x].type === 'floor' && !map[y][x].trap) {
                map[y][x].trap = true;
                map[y][x].trapType = ['poison', 'fire', 'pit', 'alarm'][Math.floor(Math.random() * 4)];
                placed++;
            }
            attempts++;
        }
    }

    _placeChests(map, count, floor) {
        let placed = 0;
        let attempts = 0;
        while (placed < count && attempts < 100) {
            const y = Math.floor(Math.random() * map.length);
            const x = Math.floor(Math.random() * map[0].length);
            if (map[y][x].type === 'floor' && !map[y][x].chest && !map[y][x].trap) {
                map[y][x].chest = true;
                map[y][x].chestOpened = false;
                map[y][x].chestLoot = this._generateLoot(floor);
                placed++;
            }
            attempts++;
        }
    }

    _generateLoot(floor) {
        const gold = 10 + Math.floor(Math.random() * 20 * floor);
        const items = [];
        if (Math.random() < 0.6) {
            const itemKeys = Object.keys(ITEMS).filter(k => ITEMS[k].price > 0 && ITEMS[k].price < 200 * floor);
            if (itemKeys.length > 0) {
                items.push(itemKeys[Math.floor(Math.random() * itemKeys.length)]);
            }
        }
        return { gold, items };
    }

    _getRoomCenter(room) {
        return { x: Math.floor(room.x + room.w / 2), y: Math.floor(room.y + room.h / 2) };
    }

    _getTrapPositions(map) {
        const traps = [];
        for (let y = 0; y < map.length; y++) {
            for (let x = 0; x < map[0].length; x++) {
                if (map[y][x].trap) traps.push({ x, y, type: map[y][x].trapType, triggered: false });
            }
        }
        return traps;
    }

    _getChestPositions(map) {
        const chests = [];
        for (let y = 0; y < map.length; y++) {
            for (let x = 0; x < map[0].length; x++) {
                if (map[y][x].chest) chests.push({ x, y, opened: map[y][x].chestOpened });
            }
        }
        return chests;
    }

    revealAround(map, px, py, radius = 2) {
        for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
                const ny = py + dy;
                const nx = px + dx;
                if (ny >= 0 && ny < map.length && nx >= 0 && nx < map[0].length) {
                    map[ny][nx].explored = true;
                    map[ny][nx].visible = Math.abs(dx) <= 1 && Math.abs(dy) <= 1;
                }
            }
        }
    }
}
