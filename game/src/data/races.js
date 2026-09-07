const RACES = {
    HUMAN: {
        id: 'HUMAN',
        name: 'Humano',
        description: 'Adaptables y versátiles. No destacan en nada extremo.',
        alignment: 'TRUE_NEUTRAL',
        baseStats: { str: 10, agi: 10, vit: 10, int: 10, wis: 10, luk: 10 },
        bonuses: { str: 1, agi: 1, vit: 1, int: 1, wis: 1, luk: 1 },
        hpMod: 1.0,
        mpMod: 1.0,
        expMod: 1.0
    },
    DWARF: {
        id: 'DWARF',
        name: 'Enano',
        description: 'Resistentes y tenaces, con gran afinidad por armas pesadas y defensa.',
        alignment: 'LAWFUL_GOOD',
        baseStats: { str: 12, agi: 7, vit: 13, int: 8, wis: 9, luk: 8 },
        bonuses: { str: 2, agi: -1, vit: 3, int: -1, wis: 0, luk: 0 },
        hpMod: 1.2,
        mpMod: 0.8,
        expMod: 1.1
    },
    ELF: {
        id: 'ELF',
        name: 'Elfo',
        description: 'Seres místicos vinculados a la magia y la destreza.',
        alignment: 'LAWFUL_GOOD',
        baseStats: { str: 7, agi: 10, vit: 7, int: 13, wis: 12, luk: 9 },
        bonuses: { str: -2, agi: 0, vit: -2, int: 3, wis: 2, luk: 0 },
        hpMod: 0.8,
        mpMod: 1.3,
        expMod: 1.0
    },
    HALFLING: {
        id: 'HALFLING',
        name: 'Mediano',
        description: 'Escurridizos y suertudos, ideales para esquivar trampas y ataques.',
        alignment: 'CHAOTIC_NEUTRAL',
        baseStats: { str: 7, agi: 13, vit: 8, int: 9, wis: 8, luk: 13 },
        bonuses: { str: -2, agi: 3, vit: -1, int: 0, wis: -1, luk: 3 },
        hpMod: 0.9,
        mpMod: 0.9,
        expMod: 0.9
    }
};

const ALIGNMENTS = {
    LAWFUL_GOOD: { name: 'Leal Bueno', moral: 'good', ethical: 'lawful' },
    NEUTRAL_GOOD: { name: 'Neutral Bueno', moral: 'good', ethical: 'neutral' },
    CHAOTIC_GOOD: { name: 'Caótico Bueno', moral: 'good', ethical: 'chaotic' },
    LAWFUL_NEUTRAL: { name: 'Leal Neutral', moral: 'neutral', ethical: 'lawful' },
    TRUE_NEUTRAL: { name: 'Neutral', moral: 'neutral', ethical: 'neutral' },
    CHAOTIC_NEUTRAL: { name: 'Caótico Neutral', moral: 'neutral', ethical: 'chaotic' },
    LAWFUL_EVIL: { name: 'Leal Malvado', moral: 'evil', ethical: 'lawful' },
    NEUTRAL_EVIL: { name: 'Neutral Malvado', moral: 'evil', ethical: 'neutral' },
    CHAOTIC_EVIL: { name: 'Caótico Malvado', moral: 'evil', ethical: 'chaotic' }
};
