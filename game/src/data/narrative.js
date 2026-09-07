var NARRATIVE = {
    storyChapters: {
        1: { name: 'Los Sotanos Olvidados', objective: 'Encuentra la nota del explorador marcada en el mapa.', accent: '#c58b5c' },
        2: { name: 'Las Criptas Profundas', objective: 'Descubre que une a los muertos con la torre de Tharion.', accent: '#9ba8c7' },
        3: { name: 'El Laberinto Elemental', objective: 'Atraviesa el laberinto y recupera el sello elemental.', accent: '#e48b48' },
        4: { name: 'La Torre del Archimago', objective: 'Reune los testimonios necesarios para enfrentar a Tharion.', accent: '#bd83d1' },
        5: { name: 'La Cima', objective: 'Decide el destino de Tharion y de la torre.', accent: '#e3c35b' }
    },

    storyMilestones: {
        1: [
            { name: 'La cronista', portrait: 'portrait_placeholder', text: 'La torre no se ha despertado sola. Cada piso que desciendas ha sido preparado para recibirte.' },
            { name: 'La cronista', portrait: 'portrait_placeholder', text: 'Busca a los exploradores que bajaron antes que vosotros. Sus notas pueden revelar que esta ocurriendo.' }
        ],
        3: [
            { name: 'Voz entre los huesos', portrait: 'portrait_placeholder', text: 'Tharion no fundo esta torre para conquistar el mundo. La construyo para encerrar algo que ya estaba aqui.' },
            { name: 'Voz entre los huesos', portrait: 'portrait_placeholder', text: 'Si quereis llegar a el, tendreis que decidir que verdad estais dispuestos a conservar.' }
        ],
        6: [
            { name: 'El prisionero', portrait: 'portrait_placeholder', text: 'Los muertos recuerdan cada promesa rota. La torre se alimenta de quienes entran sin un motivo propio.' },
            { name: 'El prisionero', portrait: 'portrait_placeholder', text: 'No confundais avanzar con ganar. A veces una puerta abierta es la trampa mas profunda.' }
        ],
        10: [
            { name: 'Resonancia elemental', portrait: 'portrait_placeholder', text: 'Fuego y hielo chocan porque alguien intento imponer una sola voluntad sobre ambos.' },
            { name: 'Resonancia elemental', portrait: 'portrait_placeholder', text: 'El sello que buscais no obedece a la fuerza. Responde a la eleccion que hagais al cruzar este laberinto.' }
        ],
        12: [
            { name: 'Tharion', portrait: 'portrait_placeholder', text: 'Por fin. Habeis llegado lo bastante lejos para escuchar mi version de la historia.' },
            { name: 'Tharion', portrait: 'portrait_placeholder', text: 'Subid hasta la cima. Alli descubrireis si sois los ultimos heroes... o la ultima llave.' }
        ]
    },

    floorDescriptions: {
        1: ['El aire huele a humedad y podredumbre. Goteras caen en silencio.', 'Paredes cubiertas de musgo negro. Algo se arrastra en la oscuridad.', 'El suelo está resbaladizo. Huellas antiguas marcan el camino.'],
        2: ['Grietas en las paredes revelan huesos incrustados en la piedra.', 'Un eco lejano resuena como susurros de almas perdidas.', 'La luz de tu antorcha revela runas grabadas en el suelo.'],
        3: ['Cadenas oxidadas cuelgan del techo. Alguna vez hubo prisioneros aquí.', 'El olor a tierra fresca sugiere excavaciones recientes.', 'Un crujido proviene del techo. La estructura se derrumba poco a poco.'],
        4: ['Sarcófagos abiertos yacían a tu alrededor. Los muertos no descansan.', 'Un frío antinatural se apodera de tus huesos.', 'Pinturas rupestres muestran sacrificios a entidades oscuras.'],
        5: ['Las paredes están cubiertas de cristales que emiten un brillo tenue.', 'El suelo se eleva en ciertas áreas, como si la tierra respirara.', 'Un murmullo constante llena el pasillo. No es el viento.'],
        6: ['Raíces gigantes perforan el techo y el suelo.', 'El aire es denso, irrespirable. Tus pulmones arden con cada inhalación.', 'Restos de un campamento abandonado. La hoguera aún humea.'],
        7: ['La temperatura sube notablemente. El calor es sofocante.', 'Pilares de piedra negra sostienen un techo invisible.', 'Marcas de garras recorren las paredes de lado a lado.'],
        8: ['Ríos de lava fluyen bajo puentes de obsidiana.', 'El calor distorsiona el aire. Las sombras parecen moverse solas.', 'Cristales de fuego flotan en el aire, girando lentamente.'],
        9: ['Plataformas de hielo se extienden sobre un abismo infinito.', 'Escarcha cubre cada superficie. Tu aliento se congela.', 'Estatuas de hielo muestran figuras atrapadas para siempre.'],
        10: ['El suelo es un mosaico de hielo y fuego. Zonas de calor alternan con frío.', 'Vientos helados soplan desde direcciones imposibles.', 'Cristales de ambos elementos chocan entre sí creando chispas.'],
        11: ['Caminos de obsidiana serpentean entre montañas de cristal.', 'El tiempo parece no funcionar aquí. Relojes se mueven en reversa.', 'Arquitectura imposible: escaleras que suben hacia abajo.'],
        12: ['Torres de magia oscura se elevan hasta perderse en la penumbra.', 'Runas de poder flotan en el aire, zumbando con energía.', 'Libros prohibidos revolotean como pájaros, sus páginas susurrando.'],
        13: ['El techo es un vórtex de energía pura. Rayos de poder cruzan el espacio.', 'Cada paso genera ondas de color en el suelo de cristal.', 'Espejos dimensionales muestran realidades alternas.'],
        14: ['La barrera entre mundos se debilita. Sombras se filtran.', 'El suelo tiembla con cada latido de energía del archimago.', 'Las leyes de la física se distorsionan. Los objetos flotan.'],
        15: ['La cúspide. El cielo es un ojo de tormenta que nunca cesa.', 'Tharion te espera. El aire cruje con poder arcano.', 'El suelo se agrieta bajo tu peso. El fin está cerca.']
    },

    shopkeeperDialogues: {
        greeting: [
            'Bienvenido, viajero. Mi tienda tiene todo lo que necesitas... por el precio correcto.',
            'Ah, aventureros. He estado esperando clientes como ustedes.',
            'No preguntes de dónde vengo el merchandise. Solo compra y vete.',
            'Última parada antes de la oscuridad. Haz que cuenten.',
            'Tengo cosas que otros comerciantes no se atreven a vender.',
            'Mi abuelo empezó este negocio. Yo lo mantengo... con sangre y sudor.',
            'Cuidado con lo que compras. Algunos objetos tienen... historias.'
        ],
        buy: [
            'Excelente elección. Eso te salvará la vida... probablemente.',
            'Barato para lo que es, ¿no crees?',
            'No acepto devoluciones. Si mueres, el objeto se queda contigo.',
            '¿Quieres garantía? La garantía es que no mueras.',
            'Ese objeto ha sobrevivido a tres aventureros. Suena prometedor, ¿no?',
            'Te doy un descuento... mentira. Paga lo que pone.'
        ],
        sell: [
            'Voy a ser generoso. Te ofrezco la mitad. No esperes más.',
            '¿Eso? Bueno, puedo darle unos cuantos diamantes de oro.',
            'El mercado está difícil. Pero por ti, hago una excepción.',
            'Interesante... esto podría valer algo. O no.',
            '¿Sabes cuánto cuesta mantener una tienda en una mazmorra? Paga.'
        ],
        leave: [
            '¡Vuelve pronto! Y si mueres, dile a tus amigos que vengan.',
            'Que la suerte te acompañe. La vas a necesitar.',
            'Cuidado allá fuera. He visto cosas que harían llorar a un guerrero.',
            'Recuerda: los muertos no pagan deudas.',
            'Adiós. Espero que vuelvas... con vida.'
        ]
    },

    encounterFlavor: [
        'Algo se mueve en las sombras...',
        'Escuchas pasos acercándose.',
        'Un olor fétido llena el aire.',
        'Los huesos crujen bajo tus pies.',
        'Un grito lejano resuena en la oscuridad.',
        'La temperatura desciende bruscamente.',
        'Algo brilla en la oscuridad... y no es una estrella.',
        'El suelo tiembla bajo tus pies.',
        'Voces susurran en un idioma olvidado.',
        'Una puerta se cierra detrás de ti.',
        'La luz de tu antorcha parpadea.',
        'Un escalofrío recorre tu espalda.',
        'El aire se vuelve denso, irrespirable.',
        'Marcas de garras cubren las paredes.',
        'Algo raspa contra la piedra.',
        'El silencio es total... demasiado total.',
        'Una sombra se mueve al final del pasillo.',
        'El eco de tus pasos suena como si alguien más caminara contigo.',
        'La pared está húmeda. ¿Es agua... o algo más?',
        'Un sonido metálico resuena en la distancia.'
    ],

    chestMessages: [
        '¡Un cofre! ¿Qué contiene?',
        '¡Hallazgo! Un cofre escondido.',
        'Este cofre parece intacto.',
        '¡Suerte! Un cofre entre las sombras.',
        'El cofre está lleno de polvo... pero dentro hay algo.',
        'Un cofre con cerradura oxidada. Se abre con facilidad.',
        '¡Tesoro! Tu esfuerzo ha sido recompensado.',
        'Un cofre magnífico. Los adornos brillan con luz propia.'
    ],

    trapMessages: {
        poison: ['¡Trampa de veneno! El veneno se propaga por el grupo.', '¡Veneno! Tus piernas se entumecen.', 'Una aguja envenenada sale del suelo.'],
        fire: ['¡Fuego! Llamas brotan del suelo.', '¡Trampa de fuego! El calor quela tu piel.', 'Un chorro de lava emerge de la pared.'],
        pit: ['¡Pozo! Caes en la oscuridad.', '¡El suelo cede! Caes al vacío.', 'Un agujero se abre bajo tus pies.'],
        alarm: ['¡Alarma! El eco atrae enemigos.', '¡Sonido estridente! Algo ha despertado.', 'Una campana suena. No es buena señal.']
    },

    enemyDeath: [
        '{enemy} cae derrotado.',
        '{enemy} se desintegra en polvo.',
        '{enemy} exhala su último aliento.',
        '{enemy} se desvanece en la oscuridad.',
        '{enemy} yace sin vida.',
        'El cuerpo de {enemy} se desmorona.',
        '{enemy} es vencido.',
        '{enemy} no se levantará de nuevo.'
    ],

    victoryQuotes: [
        'La victoria es amarga, pero es victoria al fin.',
        'Han sobrevivido... por ahora.',
        'El grupo descansa brevemente entre cadáveres.',
        'La oscuridad retrocede... pero solo un poco.',
        '¿Cuántos más vendrán? El tiempo lo dirá.',
        'Sus armas gotean sangre ajena. El camino continúa.',
        'Han ganado una batalla. La guerra sigue.'
    ],

    floorTransition: [
        'Las escaleras descienden a la oscuridad.',
        'Un nuevo piso te espera. El peligro aumenta.',
        'Bajas las escaleras. El aire se vuelve más denso.',
        'El camino continúa hacia abajo. No hay vuelta atrás.',
        'Una puerta se abre al piso {floor}.'
    ],

    eventMessages: {
        door_locked: ['La puerta está cerrada con llave.', 'Necesitas una llave para abrirla.', 'Cerrada. Alguna vez fue un paso seguro.'],
        door_open: ['La puerta se abre con un crujido.', 'Puerta abierta. El camino está libre.', 'La bisagra gime pero cede.'],
        levelUp: ['¡{name} ha subido de nivel!', '¡{name} se siente más fuerte!', '¡El poder de {name} crece!']
    }
};

function pickRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function getFloorDescription(floor) {
    var descs = NARRATIVE.floorDescriptions[floor];
    if (!descs) return '';
    return pickRandom(descs);
}

function createStoryState() {
    return {
        chapter: 1,
        objective: NARRATIVE.storyChapters[1].objective,
        flags: {},
        choices: [],
        seenMilestones: {}
    };
}

function getStoryChapter(floor) {
    if (floor >= 15) return 5;
    if (floor >= 12) return 4;
    if (floor >= 8) return 3;
    if (floor >= 4) return 2;
    return 1;
}

function updateStoryForFloor(storyState, floor) {
    var chapter = getStoryChapter(floor);
    var chapterData = NARRATIVE.storyChapters[chapter];
    storyState.chapter = chapter;
    if (chapter === 1 && storyState.flags.foundExplorerClue) {
        storyState.objective = 'Pista encontrada. Sigue la ruta hasta la escalera.';
    } else {
        storyState.objective = chapterData.objective;
    }
    return chapterData;
}

function getStoryMilestone(floor) {
    return NARRATIVE.storyMilestones[floor] || null;
}

function getShopDialogue(state) {
    var pool = NARRATIVE.shopkeeperDialogues[state];
    if (!pool) return '';
    return pickRandom(pool);
}

function getEncounterFlavor() {
    return pickRandom(NARRATIVE.encounterFlavor);
}

function getChestMessage() {
    return pickRandom(NARRATIVE.chestMessages);
}

function getTrapMessage(type) {
    var pool = NARRATIVE.trapMessages[type];
    if (!pool) return '¡Trampa!';
    return pickRandom(pool);
}

function getEnemyDeathMsg(enemyName) {
    var template = pickRandom(NARRATIVE.enemyDeath);
    return template.replace('{enemy}', enemyName);
}

function getVictoryQuote() {
    return pickRandom(NARRATIVE.victoryQuotes);
}

function getFloorTransition(floor) {
    var msg = pickRandom(NARRATIVE.floorTransition);
    return msg.replace('{floor}', floor);
}
