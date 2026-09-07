var RACE_NAMES = {
    HUMAN: {
        male: ['Aldric', 'Bran', 'Cedric', 'Darius', 'Edric', 'Falk', 'Gareth', 'Hector', 'Ivor', 'Julian', 'Kael', 'Leoric', 'Magnus', 'Norvin', 'Oscar', 'Percival', 'Quentin', 'Roland', 'Silas', 'Theron', 'Ulric', 'Viktor', 'Wesley', 'Xander', 'Yorick', 'Zephyr'],
        female: ['Adria', 'Brenna', 'Celia', 'Diana', 'Elara', 'Fiona', 'Gwen', 'Helena', 'Iris', 'Juna', 'Kira', 'Lyra', 'Mira', 'Nora', 'Opheila', 'Petra', 'Quinn', 'Rhea', 'Sera', 'Thalia', 'Ursa', 'Vera', 'Wren', 'Xena', 'Ysolde', 'Zara']
    },
    DWARF: {
        male: ['Brokk', 'Durrin', 'Eitri', 'Fargrim', 'Gimrak', 'Hrothgar', 'Igjar', 'Jorund', 'Kazrin', 'Lodvar', 'Magni', 'Nyrdd', 'Oddvar', 'Radvig', 'Snorri', 'Thrain', 'Ulfar', 'Voldi', 'Ymir', 'Bjorn', 'Draupnir', 'Grolnok', 'Kragg', 'Mordin', 'Thorkell', 'Vargr'],
        female: ['Asta', 'Bodil', 'Dagna', 'Eira', 'Freydis', 'Gerd', 'Hild', 'Iduna', 'Jarna', 'Kira', 'Liv', 'Marta', 'Nanna', 'Ordla', 'Runa', 'Sigrun', 'Thora', 'Urd', 'Valla', 'Yrsa', 'Brynhild', 'Dalla', 'Gullveig', 'Halla', 'Svanhild', 'Thordis']
    },
    ELF: {
        male: ['Aelindor', 'Briandor', 'Calaelen', 'Daerion', 'Elanor', 'Faelwen', 'Galadhon', 'Helorin', 'Ithilmar', 'Joraneth', 'Kaelthas', 'Laethion', 'Maeglor', 'Nimrodel', 'Orophin', 'Phariel', 'Queladrin', 'Rielthor', 'Sylvandis', 'Thalion', 'Uthoriel', 'Vandoril', 'Wistari', 'Xalathrim', 'Yavanna', 'Zephyriel'],
        female: ['Aelindra', 'Brielora', 'Caladwen', 'Daenethil', 'Elaria', 'Faelindra', 'Galadrieth', 'Helindra', 'Ithilien', 'Joraneth', 'Kaelthari', 'Laerindra', 'Maeglineth', 'Nimue', 'Oloriel', 'Pharindra', 'Quelariel', 'Rielwen', 'Sylvana', 'Thalindra', 'Uthiel', 'Vanyiel', 'Windara', 'Xalathriel', 'Yavindra', 'Zephyriel']
    },
    HALFLING: {
        male: ['Bilbo', 'Corydon', 'Drogo', 'Everard', 'Falco', 'Gimblet', 'Hamfast', 'Iago', 'Jory', 'Kedder', 'Largo', 'Merric', 'Nibs', 'Olo', 'Peregrin', 'Quickbeam', 'Robin', 'Samwise', 'Tobold', 'Uffo', 'Vigo', 'Wilcome', 'Bungo', 'Cotman', 'Drogo', 'Flollo'],
        female: ['Adalgisa', 'Berilla', 'Cora', 'Diamond', 'Eglantine', 'Flora', 'Gilda', 'Holly', 'Ivy', 'Jessa', 'Kira', 'Lila', 'Marigold', 'Nora', 'Opal', 'Pansy', 'Rosie', 'Sybil', 'Tansy', 'Umber', 'Violet', 'Willow', 'Beryl', 'Dora', 'Marlua', 'Primula']
    }
};

function getRandomName(raceId) {
    var names = RACE_NAMES[raceId];
    if (!names) return 'Héroe';
    var pool = names.male.concat(names.female);
    return pool[Math.floor(Math.random() * pool.length)];
}

function getUniquePartyNames(raceId, count) {
    var names = RACE_NAMES[raceId];
    if (!names) return [];
    var pool = names.male.concat(names.female);
    var used = {};
    var result = [];
    var attempts = 0;
    while (result.length < count && attempts < 100) {
        var name = pool[Math.floor(Math.random() * pool.length)];
        if (!used[name]) {
            used[name] = true;
            result.push(name);
        }
        attempts++;
    }
    while (result.length < count) {
        result.push('Héroe ' + (result.length + 1));
    }
    return result;
}
