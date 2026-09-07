var ITEM_PREFIXES = {
    prefixes: [
        { name: 'Embrujada', atkMod: 2, defMod: 0, special: 'darkDamage', weight: 10 },
        { name: 'Ardiente', atkMod: 3, defMod: 0, special: 'fireDamage', weight: 8 },
        { name: 'Gélida', atkMod: 2, defMod: 1, special: 'iceDamage', weight: 8 },
        { name: 'Viciosa', atkMod: 1, defMod: 0, special: 'poison', weight: 10 },
        { name: 'Sagrada', atkMod: 2, defMod: 2, special: 'holyDamage', weight: 5 },
        { name: 'Maldita', atkMod: 4, defMod: -1, special: 'cursed', weight: 4 },
        { name: 'Reluciente', atkMod: 1, defMod: 3, special: null, weight: 12 },
        { name: 'Oscura', atkMod: 3, defMod: 0, special: 'lifeSteal', weight: 6 },
        { name: 'Veloz', atkMod: 1, defMod: 0, special: 'speedBoost', weight: 10 },
        { name: 'Pesada', atkMod: 4, defMod: 1, special: null, weight: 8 },
        { name: 'Liviana', atkMod: 0, defMod: 0, special: 'agiBoost', weight: 10 },
        { name: 'Ancestral', atkMod: 3, defMod: 2, special: null, weight: 3 },
        { name: 'Corrupta', atkMod: 5, defMod: -2, special: 'darkDamage', weight: 3 },
        { name: 'Purificada', atkMod: 2, defMod: 3, special: 'healOnKill', weight: 4 },
        { name: 'Abismal', atkMod: 4, defMod: 0, special: 'fear', weight: 5 }
    ],
    suffixes: [
        { name: 'del Guerrero', atkMod: 3, defMod: 0, weight: 10 },
        { name: 'de la Sombra', atkMod: 2, defMod: 0, special: 'critBoost', weight: 8 },
        { name: 'del Dragón', atkMod: 4, defMod: 1, weight: 5 },
        { name: 'del Erudito', atkMod: 0, defMod: 0, mpMod: 5, weight: 8 },
        { name: 'del Búho', atkMod: 0, defMod: 2, weight: 10 },
        { name: 'de la Tormenta', atkMod: 3, defMod: 0, special: 'lightningDamage', weight: 6 },
        { name: 'del Catacumba', atkMod: 2, defMod: 3, weight: 7 },
        { name: 'del Rey', atkMod: 5, defMod: 3, weight: 2 },
        { name: 'de los Caídos', atkMod: 3, defMod: 0, special: 'lifeSteal', weight: 5 },
        { name: 'del Sol', atkMod: 2, defMod: 2, special: 'holyDamage', weight: 6 },
        { name: 'de la Luna', atkMod: 1, defMod: 1, special: 'iceDamage', weight: 7 },
        { name: 'del Halcón', atkMod: 0, defMod: 0, special: 'agiBoost', weight: 8 },
        { name: 'del Oso', atkMod: 2, defMod: 3, weight: 7 },
        { name: 'del Asesino', atkMod: 4, defMod: -1, special: 'critBoost', weight: 5 },
        { name: 'del Inmortal', atkMod: 1, defMod: 2, special: 'healOnKill', weight: 3 }
    ]
};

var AFFIX_WEIGHTS = {
    noPrefixChance: 0.45,
    noSuffixChance: 0.40,
    doubleAffixChance: 0.08
};

var CUSTOM_ITEMS = {};

function registerCustomItem(item) {
    CUSTOM_ITEMS[item.id] = item;
}

function getCustomItem(itemId) {
    return CUSTOM_ITEMS[itemId] || null;
}

function getItemStats(itemId) {
    var custom = CUSTOM_ITEMS[itemId];
    if (custom) return custom;
    return ITEMS[itemId] || null;
}

function rollAffixes(baseItem) {
    if (baseItem.type !== 'weapon' && baseItem.type !== 'armor') return null;
    if (baseItem.special === 'holyDamage') return null;

    var result = { prefix: null, suffix: null, totalAtk: 0, totalDef: 0, totalMp: 0, specials: [] };

    if (Math.random() < AFFIX_WEIGHTS.noPrefixChance && Math.random() < AFFIX_WEIGHTS.noSuffixChance) {
        return null;
    }

    var canPrefix = Math.random() >= AFFIX_WEIGHTS.noPrefixChance;
    var canSuffix = Math.random() >= AFFIX_WEIGHTS.noSuffixChance;

    if (canPrefix) {
        result.prefix = weightedPick(ITEM_PREFIXES.prefixes);
        result.totalAtk += result.prefix.atkMod;
        result.totalDef += result.prefix.defMod;
        if (result.prefix.special) result.specials.push(result.prefix.special);
    }

    if (canSuffix) {
        result.suffix = weightedPick(ITEM_PREFIXES.suffixes);
        result.totalAtk += result.suffix.atkMod;
        result.totalDef += result.suffix.defMod;
        if (result.suffix.mpMod) result.totalMp += result.suffix.mpMod;
        if (result.suffix.special) result.specials.push(result.suffix.special);
    }

    if (!result.prefix && !result.suffix) return null;

    return result;
}

function buildAffixedName(baseName, affixes) {
    if (!affixes) return baseName;
    var parts = [];
    if (affixes.prefix) parts.push(affixes.prefix.name);
    parts.push(baseName);
    if (affixes.suffix) parts.push(affixes.suffix.name);
    return parts.join(' ');
}

function weightedPick(list) {
    var total = 0;
    for (var i = 0; i < list.length; i++) total += list[i].weight;
    var r = Math.random() * total;
    var acc = 0;
    for (var i = 0; i < list.length; i++) {
        acc += list[i].weight;
        if (r < acc) return list[i];
    }
    return list[list.length - 1];
}
