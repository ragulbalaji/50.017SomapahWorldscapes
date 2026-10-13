# 50.017 Somapah Worldscapes

Try the live demo @ http://ragulbalaji.com/worldscapes/

## Game Controls

- Click anywhere to start
- The URL hash carries the world seed (e.g. `#seed=1234`), so you can share worlds by link
- Press `ESC` to pause the game
- **Movement:** `W` `A` `S` `D` or `↑` `←` `↓` `→`
- **Jump:** `Spacebar`
- Press `C` to toggle CREATIVE mode (flying versus walking)


## Instructions

Requires Node.js 20.19+ or 22.12+. Install the dependencies:

```bash
npm install
```

Run the dev server at http://localhost:5173/:

```bash
npm run dev
```

Build the static site into `dist/`, then deploy by uploading `dist/` (relative URLs, so any sub-path works):

```bash
npm run build
npm run preview # serves dist/ at http://localhost:4173/
```

Run the tests:

```bash
npm test
```
