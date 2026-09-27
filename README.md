# Custom Bookcase Designer

An interactive browser-based tool for designing a configurable bookcase and previewing the result in 3D.

![Custom Bookcase Design App](https://github.com/user-attachments/assets/40779c53-54e2-4e75-8841-d9deedadf432)

## Features

- Adjust width, height, depth, shelf count, vertical divisions, and material thickness
- Switch between material colour presets
- Add, remove, and toggle solid or glass-fronted compartments
- Rotate, pan, zoom, and reposition the bookcase in the 3D viewer
- Reset the design to its defaults
- Download the configuration as JSON
- Export the generated model as an OBJ file

## Technology

React, TypeScript, Vite, React Three Fiber, Drei, Three.js, Material UI, Radix UI primitives, and Tailwind CSS.

## Run locally

```bash
git clone https://github.com/elenichas/Custombookcasedesignapp.git
cd Custombookcasedesignapp
npm install
npm run dev
```

Use `npm run build` to create a production build.

## Prototype note

The configurator produces a conceptual model. Dimensions and exports should be validated before they are used for manufacture or construction.