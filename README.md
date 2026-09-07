# The Last Riders

Dungeon crawler RPG retro para navegador, con exploracion en primera persona, combate por turnos y una mazmorra de 15 pisos generada proceduralmente.

El proyecto combina una landing page estatica con un juego desarrollado en JavaScript usando Phaser 3. La vista de exploracion incorpora una capa 3D realizada con Three.js, mientras que la interfaz, los menus y el combate se dibujan con Phaser.

## Caracteristicas

- 15 pisos divididos en cinco regiones:
  - Pisos 1-3: Los Sotanos Olvidados
  - Pisos 4-7: Las Criptas Profundas
  - Pisos 8-11: El Laberinto Elemental
  - Pisos 12-14: La Torre del Archimago
  - Piso 15: La Cima del Archimago
- Mazmorras procedurales con habitaciones, pasillos, puertas, trampas, cofres, tiendas y escaleras.
- Grupo de cuatro personajes con razas, clases y alineamientos.
- Combate por turnos con ataques, magia, defensa, objetos, habilidades y huida.
- Enemigos con variantes de dificultad y progresion por piso.
- Objetos equipables, consumibles, oro, tiendas y loot con prefijos.
- Narrativa por hitos y elecciones durante la exploracion.
- Guardado automatico y guardado manual mediante `F5`.
- Exportacion e importacion de partidas en formato JSON.
- Controles tactiles para dispositivos moviles en orientacion horizontal.
- Audio y efectos generados programaticamente.
- Beta 0.2: cada piso garantiza una ruta jugable hasta su objetivo y sus escaleras; la cima activa el combate final y la victoria devuelve al menu.

## Requisitos

- Node.js 18 o superior recomendado.
- npm.
- Un navegador moderno con soporte para ES modules, Web Audio, `localStorage` y WebGL.

No es necesario instalar Phaser ni Three.js por separado para ejecutar el juego: el repositorio incluye `game/vendor/phaser.min.js` y `game/vendor/three.min.js`. La pagina del juego tambien carga Three.js desde jsDelivr mediante un modulo ES.

## Instalacion

Desde la raiz del repositorio:

```bash
npm install
```

## Ejecutar en local

Inicia un servidor HTTP local desde la raiz:

```bash
npm start
```

Tambien existe el alias:

```bash
npm run dev
```

Despues abre [http://localhost:3000](http://localhost:3000).

La landing esta disponible en `/` y el juego en `/game/`. Tambien puedes abrir directamente [http://localhost:3000/game/](http://localhost:3000/game/).

En Windows se puede usar `start-server.bat`, aunque ese archivo contiene una ruta absoluta local. Para compartir el proyecto con otra persona o moverlo a otra carpeta, es preferible usar `npm start`.

## Compilacion y despliegue

El proyecto es una aplicacion estatica y no tiene paso de compilacion:

```bash
npm run build
```

El comando anterior solo informa que no hace falta generar artefactos adicionales.

La configuracion de Netlify esta en `netlify.toml`:

- Comando de build: `echo 'Static site - no build step required'`
- Directorio publicado: `.`

Por tanto, el despliegue debe servir la raiz del repositorio para conservar tanto la landing como la ruta `/game/`.

## Como jugar

### Exploracion

| Accion | Teclado | Movil |
| --- | --- | --- |
| Avanzar | `W` o flecha arriba | Boton arriba |
| Retroceder | `S` o flecha abajo | Boton abajo |
| Girar a la izquierda | `A` o flecha izquierda | Boton izquierda |
| Girar a la derecha | `D` o flecha derecha | Boton derecha |
| Interactuar | `Espacio` | `OK` |
| Abrir inventario | `I` | `I` |
| Guardar | `F5` | `F5` |
| Cambiar panel | `TAB` | `TAB` |

Usa `OK` o `Espacio` frente a puertas, cofres, tiendas y escaleras. Las puertas cerradas requieren una llave. Las trampas pueden causar veneno, fuego, caidas o alarmas.

### Combate

| Accion | Tecla |
| --- | --- |
| Atacar | `1` |
| Magia | `2` |
| Defender | `3` |
| Objeto | `4` |
| Huir | `5` |
| Habilidades | `6` |
| Confirmar | `ENTER` |
| Volver | `ESC` |

En las acciones que lo requieren, selecciona primero la accion, despues el hechizo u objeto y finalmente el objetivo.

En movil, gira el dispositivo a horizontal. El juego muestra controles tactiles y un boton de ayuda con la guia de controles.

## Estructura del proyecto

```text
/
|- index.html                 Landing page
|- css/landing.css            Estilos de la landing
|- game/
|  |- index.html              Entrada del juego y controles tactiles
|  |- src/main.js             Configuracion e inicio de Phaser
|  |- src/data/               Razas, clases, enemigos, objetos y narrativa
|  |- src/entities/           Entidades Character y Enemy
|  |- src/scenes/             Flujo de menus, creacion, exploracion y combate
|  |- src/systems/            Generacion, combate, guardado, audio y render 3D
|  |- src/ui/                 HUD, menus y tema visual
|  |- assets/                 Sprites, fuentes, audio y atribuciones
|  |- vendor/                 Builds locales de Phaser y Three.js
|  |- ART_DIRECTION.md        Direccion visual y reglas de implementacion
|- netlify.toml               Configuracion de despliegue estatico
|- package.json               Scripts y dependencias npm
|- start-server.bat           Atajo de servidor para Windows
```

### Flujo de escenas

El juego registra estas escenas en `game/src/main.js`:

1. `BootScene`: carga recursos y prepara la partida.
2. `MenuScene`: nueva partida, continuar y opciones disponibles.
3. `CreatePartyScene`: creacion del grupo.
4. `ExploreScene`: desplazamiento, interacciones, pisos y encuentros.
5. `CombatScene`: combate por turnos.
6. `ShopScene`: compra de objetos.
7. `InventoryScene`: gestion del grupo, inventario y equipo.
8. `NarrativeScene`: escenas narrativas.
9. `ChoiceScene`: elecciones narrativas, definida junto a `NarrativeScene.js`.
10. `GameOverScene`: derrota o victoria.

## Sistemas principales

- `DungeonGenerator.js`: crea mapas por piso con configuraciones de tamano, trampas, cofres, tiendas y escaleras.
- `CombatSystem.js`: calcula turnos, dano, criticos, efectos y acciones de enemigos.
- `SaveSystem.js`: serializa la partida en `localStorage` con la clave `the_last_riders_save`.
- `AlignmentSystem.js`: valida las combinaciones de alineamiento, raza y clase.
- `ThreeDungeonView.js`: renderiza la perspectiva 3D de la mazmorra.
- `AssetGenerator.js`: genera sprites y recursos visuales en codigo.
- `AudioManager.js`: crea musica y efectos con Web Audio.
- `ScreenEffects.js` y `ParticleManager.js`: efectos de pantalla y particulas.
- `HUD.js`, `MenuUI.js` y `UITheme.js`: interfaz comun del juego.

## Guardado

Las partidas se guardan localmente en el navegador y no se envian a ningun servidor.

El guardado incluye:

- Grupo y estado de cada personaje.
- Inventario, equipo y objetos con prefijos.
- Oro.
- Piso, posicion, orientacion y mapas generados.
- Progreso narrativo.
- Tiempo de juego y configuracion.

Desde el juego se puede exportar una partida como archivo JSON e importar ese archivo en otro navegador. Borrar los datos del sitio elimina el guardado local.

## Direccion visual

La guia visual completa esta en [`game/ART_DIRECTION.md`](game/ART_DIRECTION.md). En resumen, el juego usa una estetica de grabado de mazmorra: piedra oscura, tinta, marfil, cobre envejecido y rojo reservado para dano o estados criticos. Las nuevas escenas deben reutilizar `UITheme` y respetar las capas de profundidad de la vista de exploracion.

## Assets y licencias

Las atribuciones completas estan en [`game/assets/ATTRIBUTION.txt`](game/assets/ATTRIBUTION.txt).

- Tiles de mazmorra: "First Person Dungeon Crawl - More Tilesets", de OptimusGnu, basado en "Heroine Dusk" de Clint Bellanger. Licencia CC-BY-SA 3.0.
- Sprites de enemigos: "10 Fantasy RPG enemies", de CharlesGabriel. Licencias CC-BY 3.0, CC-BY-SA 3.0 y GPL 2.0/GPL 3.0 segun el recurso.
- Sprites de objetos, personajes e interfaz: generados programaticamente por el proyecto.

## Desarrollo

El codigo se carga directamente mediante etiquetas `<script>` desde `game/index.html`; no hay bundler ni transpilation. Al anadir una nueva escena o sistema:

1. Coloca el archivo en la carpeta correspondiente.
2. Incluyelo en `game/index.html` antes de cualquier archivo que dependa de el.
3. Registra la escena en `game/src/main.js` si debe participar en el flujo de Phaser.
4. Reutiliza los datos y sistemas existentes en lugar de duplicar reglas de juego.
5. Prueba la experiencia en escritorio y en un dispositivo tactil en horizontal.

No hay una suite automatizada de tests configurada actualmente. La comprobacion principal es ejecutar el servidor local y recorrer la landing, el inicio de partida, la exploracion, el combate, el inventario y el guardado.

## Licencia

Este README documenta el proyecto. Las licencias y atribuciones de los recursos de terceros deben consultarse en `game/assets/ATTRIBUTION.txt`; no se debe redistribuir un asset de terceros sin respetar su licencia correspondiente.