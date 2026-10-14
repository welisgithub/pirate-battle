# Architecture — initial foundation

This document describes the implemented static preview. Planned gameplay and API
features are explicitly distinguished from existing behavior.

## Responsibilities

| Module | Responsibility |
| --- | --- |
| `src/main.tsx` | React root, Strict Mode and one page-lifetime QueryClient |
| `src/app/App.tsx` | Select the menu or arena screen |
| `src/screens/` | Semantic React markup, navigation and focus |
| `src/game/ArenaCanvas.tsx` | Own the host element and loading/error/retry state |
| `src/game/mountArena.ts` | Initialize PixiJS, resize, render and clean up |
| `src/game/assets.ts` | Load and reuse supplied textures |
| `src/game/createArenaScene.ts` | Construct water, island, decoration and ship sprites |
| `src/game/config.ts` | Typed logical dimensions and initial positions |
| `tests/e2e/` | Browser-level navigation, lifecycle and loading checks |

There is no routing library or global gameplay store. Two screens only need one
local React state value. The QueryClientProvider is ready for the later ranking
and history stage, but no HTTP requests or network mocks exist yet.
The arena screen is loaded on demand so the initial menu does not load PixiJS.

## React and PixiJS lifecycle

React owns screen lifetime; PixiJS owns everything inside the arena canvas.
`ArenaCanvas` starts an arena from an effect and returns its cleanup function.
Each effect owns a distinct PixiJS Application.

Initialization is asynchronous. A `disposed` flag prevents a completed async
operation from attaching a canvas or notifying React after its owner has exited.
If unmounted before `app.init()` resolves, destruction is deferred until the
renderer exists. If unmounted during asset loading, the initialized application
is destroyed immediately and late asset completion is ignored.

Cleanup disconnects the ResizeObserver, removes the resize listener, destroys
scene children and the renderer, removes the canvas, and destroys the private
ticker through Application.destroy. It is safe to call cleanup after a loading
failure. The same path handles Strict Mode's setup/cleanup/setup sequence.

There are no gameplay input listeners, simulation timers or active animation
ticker in this stage. `autoStart: false` prevents an unnecessary frame loop.
The scene renders once on readiness and again on resize.

## Texture ownership

Vite imports image URLs from the existing asset directory; no copies are needed
in `public/`. Assets are emitted as files so request failures remain testable.

PixiJS Assets caches a fixed set of textures by URL across arena visits. Scene
destruction removes sprites without destroying shared textures or their sources.
Keeping this bounded cache is intentional; unloading it on every screen exit
would conflict with pending loads and force repeated downloads. Rendering
resources owned by each Application are still destroyed on exit.

The UI uses normal HTML buttons with the supplied artwork as CSS backgrounds.
The game canvas has an accessible image label. A DOM status and an accessible
error/retry action describe initialization outside the canvas.

## Coordinates and resizing

The world uses 1024 × 576 logical pixels. A 16:9 host fits the available viewport,
including short landscape screens. The renderer uses the host's physical layout
size and a device-pixel ratio capped at 2. A uniform world scale preserves
positions and proportions; resize never changes world configuration.

A future pointer-input adapter must convert screen coordinates through this
world transform. Current input is limited to HTML navigation buttons.

## Test strategy

Playwright exercises the real application and PixiJS renderer in desktop and
mobile Chromium emulation. Development tests include React Strict Mode effects;
`E2E_PREVIEW=1` runs the same checks against the production build.

Lifecycle tests verify a single active canvas, no canvas after exit, five
enter/exit cycles, no unexpected browser errors, and restoration of the window's
listener count using Chromium's debugging protocol. Another test delays a real
asset request and leaves before it completes. A separate test aborts an asset
request and verifies recovery after retry. These checks target the async cleanup
risks rather than mirroring scene-construction code.

## Next implementation stage

Add an input adapter and a time-based simulation, keeping continuous positions,
rotations, health, cooldowns and entities outside React. Introduce the simulation
clock before movement, then collisions and combat. Publish only HUD snapshots and
session events to React. The static renderer is not yet a simulation engine.

Movement, collisions, combat, balance, persistence, ranking/history contracts,
query cache policy, pending submissions, MSW scenarios, visual baselines and
profiling remain unimplemented. Their final design will be documented when the
corresponding behavior exists; installed dependencies are not treated as feature
completion.
