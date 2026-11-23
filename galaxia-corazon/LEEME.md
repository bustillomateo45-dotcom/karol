# Galaxia del corazón

Galaxia 3D hecha con HTML, CSS3, JavaScript y three.js.

## Qué contiene
```
galaxia-corazon/
├── index.html
├── LEEME.md
├── css/style.css
├── js/
│   ├── config.js          <- frases, imágenes, emojis, carta, música, ondas y cantidades (edita aquí)
│   ├── imagenes_data.js   <- las 9 imágenes incrustadas (no se edita)
│   ├── controles.js       <- mover, girar y zoom (mouse, táctil, teclado)
│   ├── galaxia.js         <- escena three.js
│   ├── ui.js              <- carta y botones
│   ├── musica.js          <- música de fondo
│   └── lib/LEEME.txt      <- (opcional) three.js local para usar sin internet
├── img/                   <- las 9 imágenes en PNG
└── audio/                 <- la canción (musica.mp3)
```

## Cómo usarlo
1. Descomprime el ZIP (no lo abras desde dentro del archivo comprimido).
2. La canción ya viene en `audio/musica.mp3`. Para cambiarla, reemplaza ese archivo
   (o cambia el nombre en `js/config.js`, en `musica.archivo`).
3. Abre `index.html`. Las imágenes ya están incrustadas, así que funciona con doble clic.
   Si prefieres un servidor local: Live Server de VS Code o `python -m http.server 8000`.

Necesita internet para cargar three.js y la tipografía (ver `js/lib/LEEME.txt` para usar three.js sin conexión).
Sin la tipografía se usa Georgia y se ve parecido.

## Controles
| Acción | PC | Celular |
|---|---|---|
| Girar | arrastrar con clic izquierdo | un dedo |
| Moverte (pan) | clic derecho o Shift + arrastrar | dos dedos |
| Acercar / alejar | rueda del mouse | pellizco |
| Volar | W A S D / flechas, Q y E | — |
| Reiniciar vista | doble clic o tecla R | botón ⌖ |

## Música
Suena desde que se abre el programa, en bucle y con el volumen del dispositivo.
Si el navegador bloquea el sonido automático aparece "Toca para entrar" y la música empieza con ese toque.
El botón ♪ solo pausa o reanuda.
Mientras la carta está abierta, el volumen baja suave (`musica.volumenCarta` en `js/config.js`) y vuelve a subir al cerrarla.
