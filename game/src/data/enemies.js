const ENEMIES = {
    // Floor 1-3: Los Sótanos Olvidados
    RAT: { name: 'Rata Gigante', hp: 8, atk: 3, def: 1, magDef: 0, exp: 5, gold: 2, level: 1, sprite: 'rat', skills: ['poison_bite'] },
    GOBLIN: { name: 'Trasgo', hp: 12, atk: 5, def: 2, magDef: 1, exp: 8, gold: 5, level: 1, sprite: 'goblin', skills: ['war_cry'] },
    SKELETON: { name: 'Esqueleto', hp: 15, atk: 6, def: 3, magDef: 1, exp: 12, gold: 8, level: 2, sprite: 'skeleton', skills: ['crushing_blow'] },
    SLIME: { name: 'Baba', hp: 10, atk: 4, def: 5, magDef: 2, exp: 7, gold: 3, level: 1, sprite: 'slime', skills: ['poison_bite'] },
    SPIDER: { name: 'Araña Gigante', hp: 14, atk: 7, def: 2, magDef: 1, exp: 10, gold: 6, level: 2, sprite: 'spider', skills: ['poison_bite'] },

    // Floor 4-7: Las Criptas Profundas
    ZOMBIE: { name: 'Zombi', hp: 22, atk: 9, def: 4, magDef: 2, exp: 18, gold: 12, level: 3, sprite: 'zombie', skills: ['poison_bite'] },
    GHOST: { name: 'Espectro', hp: 18, atk: 11, def: 8, magDef: 12, exp: 22, gold: 15, level: 4, sprite: 'ghost', skills: ['dark_bolt', 'drain_life'] },
    WOLF: { name: 'Lobo Nocturno', hp: 20, atk: 12, def: 5, magDef: 2, exp: 20, gold: 10, level: 3, sprite: 'wolf', skills: ['poison_bite'] },
    BANDIT: { name: 'Bandido', hp: 25, atk: 13, def: 7, magDef: 4, exp: 25, gold: 20, level: 4, sprite: 'bandit', skills: ['war_cry', 'crushing_blow'] },
    LICH: { name: 'Liche', hp: 30, atk: 15, def: 10, magDef: 18, exp: 35, gold: 25, level: 5, sprite: 'lich', skills: ['dark_bolt', 'drain_life', 'ice_shard'] },

    // Floor 8-11: El Laberinto Elemental
    FIRE_ELEMENTAL: { name: 'Elemental de Fuego', hp: 35, atk: 18, def: 8, magDef: 15, exp: 40, gold: 30, level: 6, sprite: 'fire_elemental', skills: ['fire_breath'] },
    ICE_ELEMENTAL: { name: 'Elemental de Hielo', hp: 35, atk: 16, def: 12, magDef: 15, exp: 40, gold: 30, level: 6, sprite: 'ice_elemental', skills: ['ice_shard'] },
    MINOTAUR: { name: 'Minotauro', hp: 45, atk: 20, def: 14, magDef: 6, exp: 50, gold: 40, level: 7, sprite: 'minotaur', skills: ['crushing_blow', 'war_cry'] },
    MIMIC: { name: 'Mimico', hp: 30, atk: 22, def: 15, magDef: 8, exp: 45, gold: 50, level: 7, sprite: 'mimic', skills: ['poison_bite', 'crushing_blow'] },

    // Floor 12-15: La Torre del Archimago
    DRAGON_WHELP: { name: 'Cachorro de Dragón', hp: 55, atk: 25, def: 18, magDef: 14, exp: 65, gold: 50, level: 8, sprite: 'dragon_whelp', skills: ['fire_breath', 'war_cry'] },
    DEATH_KNIGHT: { name: 'Caballero de la Muerte', hp: 60, atk: 28, def: 20, magDef: 12, exp: 75, gold: 60, level: 9, sprite: 'death_knight', skills: ['dark_bolt', 'crushing_blow', 'drain_life'] },
    ARCHMAGE: { name: 'Archimago Oscuro', hp: 50, atk: 30, def: 15, magDef: 25, exp: 80, gold: 70, level: 10, sprite: 'archmage', skills: ['dark_bolt', 'ice_shard', 'fire_breath', 'drain_life'] },
    THARION: { name: 'Archimago Tharion II', hp: 150, atk: 35, def: 25, magDef: 30, exp: 500, gold: 1000, level: 15, sprite: 'tharion', boss: true, skills: ['dark_bolt', 'fire_breath', 'ice_shard', 'drain_life'] }
};

const ENEMY_FLOORS = {
    1: ['RAT', 'GOBLIN', 'SLIME'],
    2: ['RAT', 'GOBLIN', 'SKELETON', 'SPIDER'],
    3: ['SKELETON', 'SPIDER', 'GOBLIN'],
    4: ['ZOMBIE', 'WOLF', 'BANDIT'],
    5: ['ZOMBIE', 'GHOST', 'WOLF'],
    6: ['GHOST', 'BANDIT', 'LICH'],
    7: ['LICH', 'GHOST', 'BANDIT'],
    8: ['FIRE_ELEMENTAL', 'ICE_ELEMENTAL', 'MINOTAUR'],
    9: ['FIRE_ELEMENTAL', 'ICE_ELEMENTAL', 'MINOTAUR'],
    10: ['MINOTAUR', 'MIMIC', 'FIRE_ELEMENTAL'],
    11: ['MINOTAUR', 'MIMIC', 'ICE_ELEMENTAL'],
    12: ['DRAGON_WHELP', 'DEATH_KNIGHT', 'ARCHMAGE'],
    13: ['DRAGON_WHELP', 'DEATH_KNIGHT', 'ARCHMAGE'],
    14: ['DEATH_KNIGHT', 'ARCHMAGE', 'DRAGON_WHELP'],
    15: ['THARION']
};
