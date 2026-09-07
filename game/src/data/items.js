const ITEMS = {
    // Weapons
    WOODEN_SWORD: { id: 'WOODEN_SWORD', name: 'Espada de Madera', type: 'weapon', slot: 'weapon', atk: 2, price: 10, classes: ['WARRIOR', 'PALADIN'] },
    IRON_SWORD: { id: 'IRON_SWORD', name: 'Espada de Hierro', type: 'weapon', slot: 'weapon', atk: 5, price: 50, classes: ['WARRIOR', 'PALADIN'] },
    STEEL_SWORD: { id: 'STEEL_SWORD', name: 'Espada de Acero', type: 'weapon', slot: 'weapon', atk: 10, price: 150, classes: ['WARRIOR', 'PALADIN'] },
    FIRE_SWORD: { id: 'FIRE_SWORD', name: 'Espada Ígnea', type: 'weapon', slot: 'weapon', atk: 15, price: 400, classes: ['WARRIOR', 'PALADIN'], alignment: 'LAWFUL_EVIL' },
    SOLAR_SWORD: { id: 'SOLAR_SWORD', name: 'Espada Solar de Elion', type: 'weapon', slot: 'weapon', atk: 30, price: 9999, classes: ['PALADIN'], alignment: 'LAWFUL_GOOD', special: 'holyDamage' },

    DAGGER: { id: 'DAGGER', name: 'Daga', type: 'weapon', slot: 'weapon', atk: 3, price: 15, classes: ['ROGUE', 'ASSASSIN', 'MAGE'] },
    SHORT_SWORD: { id: 'SHORT_SWORD', name: 'Espada Corta', type: 'weapon', slot: 'weapon', atk: 4, price: 30, classes: ['ROGUE', 'ASSASSIN', 'RANGER'] },
    POISON_DAGGER: { id: 'POISON_DAGGER', name: 'Daga Envenenada', type: 'weapon', slot: 'weapon', atk: 6, price: 100, classes: ['ROGUE', 'ASSASSIN'], special: 'poison' },

    MACE: { id: 'MACE', name: 'Maza', type: 'weapon', slot: 'weapon', atk: 6, price: 60, classes: ['WARRIOR', 'CLERIC', 'PALADIN'] },
    STAFF: { id: 'STAFF', name: 'Bastón', type: 'weapon', slot: 'weapon', atk: 2, mp: 5, price: 40, classes: ['MAGE', 'CLERIC', 'RANGER'] },
    BOW: { id: 'BOW', name: 'Arco', type: 'weapon', slot: 'weapon', atk: 7, price: 80, classes: ['RANGER'] },
    AXE: { id: 'AXE', name: 'Hacha', type: 'weapon', slot: 'weapon', atk: 8, price: 90, classes: ['WARRIOR'] },

    // Armor
    CLOTH_ARMOR: { id: 'CLOTH_ARMOR', name: 'Túnica de Tela', type: 'armor', slot: 'body', def: 1, price: 10, classes: ['MAGE', 'CLERIC'] },
    LEATHER_ARMOR: { id: 'LEATHER_ARMOR', name: 'Armadura de Cuero', type: 'armor', slot: 'body', def: 3, price: 40, classes: ['ROGUE', 'ASSASSIN', 'RANGER'] },
    CHAIN_MAIL: { id: 'CHAIN_MAIL', name: 'Cota de Malla', type: 'armor', slot: 'body', def: 6, price: 120, classes: ['WARRIOR', 'PALADIN', 'CLERIC'] },
    PLATE_ARMOR: { id: 'PLATE_ARMOR', name: 'Armadura de Placas', type: 'armor', slot: 'body', def: 10, price: 300, classes: ['WARRIOR', 'PALADIN'] },

    SHIELD: { id: 'SHIELD', name: 'Escudo', type: 'armor', slot: 'offhand', def: 2, price: 30, classes: ['WARRIOR', 'PALADIN', 'CLERIC'] },
    BUCKLER: { id: 'BUCKLER', name: 'Rodela', type: 'armor', slot: 'offhand', def: 1, price: 15, classes: ['ROGUE', 'RANGER'] },

    // Consumables
    POTION: { id: 'POTION', name: 'Poción de Vida', type: 'consumable', effect: 'heal', value: 20, price: 15, stackable: true },
    HI_POTION: { id: 'HI_POTION', name: 'Poción Superior', type: 'consumable', effect: 'heal', value: 50, price: 50, stackable: true },
    ETHER: { id: 'ETHER', name: 'Éter', type: 'consumable', effect: 'mp', value: 15, price: 25, stackable: true },
    ANTIDOTE: { id: 'ANTIDOTE', name: 'Antídoto', type: 'consumable', effect: 'curePoison', value: 0, price: 10, stackable: true },
    REVIVE: { id: 'REVIVE', name: 'Phoenix Down', type: 'consumable', effect: 'revive', value: 1, price: 100, stackable: true },

    // Key Items
    FLOOR_KEY: { id: 'FLOOR_KEY', name: 'Llave de Piso', type: 'key', price: 0 },
    TORCH: { id: 'TORCH', name: 'Antorcha', type: 'key', effect: 'revealMap', price: 20, stackable: true }
};

const STARTING_INVENTORY = [
    { itemId: 'POTION', quantity: 5 },
    { itemId: 'ANTIDOTE', quantity: 2 }
];
