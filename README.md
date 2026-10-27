# Taquetrón

Juego de taquería en pixel art: tienes 30 segundos detrás del puesto para armar los tacos que pide cada ticket y
arrastrarlos al cliente. Cada 10 segundos todo va 20% más rápido; si se te enojan 5 clientes, llega la policía y te
clausura el puesto.

Hecho en el Claude for Games Build Day, Ciudad de México, 26 de octubre de 2026.

- Jugar: https://game.nostris.tech
- Un solo archivo: `index.html` (Canvas 2D y Web Audio, sin librerías ni assets). Ábrelo en cualquier navegador.
- Mouse, touch o teclado. Tres niveles: fácil (carne y piña), medio (+ cebolla y cilantro), difícil (+ salsas).

## Archivos

| Archivo | Qué es |
|---|---|
| `index.html` | El juego completo |
| `serve.cjs` | Servidor estático local (puerto 3092) con el top 10 (`/api/top`, `/api/score`) |
| `publish.sh` | Copia `index.html` a `dist/`, que es lo que se sirve |
| `tests/check.cjs` | Pruebas sin pantalla con Playwright contra el servidor local (`npm i playwright`) |
| `.claude/skills/` | Skills de diseño de juegos usadas (con sus licencias MIT y Apache-2.0) |
