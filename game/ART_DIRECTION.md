# The Last Riders: Direccion de arte de beta

## Identidad

La mazmorra es el protagonista. La referencia es el dungeon crawler clasico de *The Dark Spire*: una cripta de piedra vista desde primera persona, con composicion de grabado, alto contraste y una atmosfera casi monocromatica. La interpretacion es propia y no replica arte, personajes ni recursos del juego de referencia.

## Reglas visuales

- Material base: tinta negra, piedra gris oliva, ladrillo irregular y suelo de basalto.
- Iluminacion: el punto de fuga recibe una luz minima; los bordes se pierden en negro, como una ilustracion grabada.
- Color funcional: marfil y cobre envejecido para ruta, escaleras, oro y objetos interactuables; rojo oscuro solo para dano, enemigos y estados criticos.
- Contraste: el jugador, puertas, cofres y escaleras deben separarse del fondo a cualquier distancia.
- Profundidad: cada tramo lejano reduce saturacion y opacidad; el primer plano conserva textura y borde.
- UI: paneles negros, marcos rectos, lineas finas y acentos de marfil/cobre. No usar azul, purpura ni brillos neon.
- Tipografia: `VT323` para narrativa y lectura rapida; `Share Tech Mono` para datos; `Press Start 2P` solo donde la marca lo necesite.
- Movimiento: transiciones cortas, fundidos y vibracion reservados para entrar, combatir o recibir dano.

## Contrato de implementacion

- Toda nueva escena debe reutilizar `UITheme` para paneles, botones, separadores y barras.
- Toda nueva vista de mazmorra debe conservar las capas: cielo/sombra, horizonte, suelo, geometria lateral, punto de fuga y viñeta.
- Los colores deben elegirse por funcion, no por componente. Si un elemento no es peligro, no debe heredar el rojo.
- Las texturas se tiñen con tonos piedra o tierra. El brillo se reserva para informacion jugable.
- La exploracion debe seguir siendo la pantalla con mayor detalle visual y mayor contraste de materiales.
