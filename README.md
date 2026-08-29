# ELJ 3D Campus Website

Beginner-friendly static website prototype for the ELJCMASHS interactive 3D campus exhibition.

## Folder structure

```text
elj-3d-campus/
├── index.html
├── style.css
├── script.js
└── models/
    └── elj-campus.glb   <-- PUT YOUR 3D MODEL HERE
```

## How to test it

Because browsers can block some local module/file requests, use a small local web server instead of double-clicking `index.html`.

Easy option if you have VS Code:
1. Install the "Live Server" extension.
2. Open this folder in VS Code.
3. Right-click `index.html`.
4. Choose "Open with Live Server".

Or use any simple local HTTP server.

## How to add your 3D model

1. Export/convert your school model to `.glb`.
2. Rename it exactly:
   `elj-campus.glb`
3. Put it inside:
   `models/`
4. Refresh the website.

## Important

The location buttons currently open information panels. They do NOT yet detect clicks directly on individual 3D buildings.

The next development step is to give individual model parts identifiable names (for example `Library`, `Theater`, `Media_Laboratory`) and use a Three.js raycaster so users can click the actual building in the 3D scene.

## GitHub Pages

This is a static HTML/CSS/JavaScript website, so it can be hosted through GitHub Pages. The repository should contain `index.html` at the publishing source's top level.
