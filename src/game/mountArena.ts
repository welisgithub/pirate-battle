// src/game/mountArena.ts
import { Application } from 'pixi.js';
import { loadArenaAssets } from './assets';
import { arenaConfig } from './config';
import { ArenaWorld } from './createArenaScene';
import { InputManager } from './input/InputManager';
import { GameSimulation, type GameSnapshot } from './simulation/GameSimulation';

export interface ArenaController {
  togglePause: () => void;
  setPaused: (paused: boolean) => void;
  restart: () => void;
}

interface ArenaCallbacks {
  onReady: () => void;
  onError: () => void;
  onSnapshot?: (snapshot: GameSnapshot) => void;
  onRegisterController?: (controller: ArenaController) => void;
}

export function mountArena(host: HTMLDivElement, callbacks: ArenaCallbacks): () => void {
  const app = new Application();
  const input = new InputManager();
  const simulation = new GameSimulation();

  let disposed = false;
  let initialized = false;
  let resizeObserver: ResizeObserver | undefined;
  let removeResizeListener: (() => void) | undefined;
  let snapshotAccumulator = 0;

  function triggerAutoPause() {
    if (!simulation.getGameOver() && !simulation.getPaused()) {
      simulation.setPaused(true);
      input.reset();
      callbacks.onSnapshot?.(simulation.getSnapshot());
    }
  }

  function releaseResources() {
    input.stop();
    window.removeEventListener('blur', triggerAutoPause);
    document.removeEventListener('visibilitychange', onVisibilityChange);
    window.removeEventListener('keydown', onWindowKeyDown);
    resizeObserver?.disconnect();
    removeResizeListener?.();

    if (initialized) {
      initialized = false;
      app.destroy({ removeView: true }, { children: true, texture: false, textureSource: false });
    }
  }

  function onVisibilityChange() {
    if (document.hidden) triggerAutoPause();
  }

  function onWindowKeyDown(e: KeyboardEvent) {
    if (e.code === 'Escape' || e.code === 'KeyP') {
      if (!simulation.getGameOver()) {
        const next = !simulation.getPaused();
        simulation.setPaused(next);
        input.reset();
        callbacks.onSnapshot?.(simulation.getSnapshot());
      }
    }
  }

  async function initialize() {
    await app.init({
      width: arenaConfig.width,
      height: arenaConfig.height,
      resolution: Math.min(window.devicePixelRatio || 1, 2),
      autoDensity: true,
      antialias: true,
      background: 0x208da7,
      preference: 'webgl',
      autoStart: false,
      sharedTicker: false,
    });
    initialized = true;

    if (disposed) {
      releaseResources();
      return;
    }

    const assets = await loadArenaAssets();
    if (disposed) return;

    const world = new ArenaWorld(assets);
    app.stage.addChild(world);
    app.canvas.setAttribute('role', 'img');
    app.canvas.setAttribute('aria-label', 'Ocean arena with pirate combat');
    host.appendChild(app.canvas);

    input.start();

    // Eventos de auto-pausa
    window.addEventListener('blur', triggerAutoPause);
    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('keydown', onWindowKeyDown);

    // Expõe os controles para a interface React
    callbacks.onRegisterController?.({
      togglePause: () => {
        if (!simulation.getGameOver()) {
          const next = !simulation.getPaused();
          simulation.setPaused(next);
          input.reset();
          callbacks.onSnapshot?.(simulation.getSnapshot());
        }
      },
      setPaused: (paused: boolean) => {
        simulation.setPaused(paused);
        input.reset();
        callbacks.onSnapshot?.(simulation.getSnapshot());
      },
      restart: () => {
        simulation.reset();
        input.reset();
        callbacks.onSnapshot?.(simulation.getSnapshot());
      },
    });

    // Envia o primeiro snapshot
    callbacks.onSnapshot?.(simulation.getSnapshot());

    // Loop a 60 FPS
    app.ticker.add((ticker) => {
      if (disposed) return;

      simulation.update(ticker.deltaMS, input.getState());
      const player = simulation.getPlayer();
      const enemies = simulation.getEnemies();
      const projectiles = simulation.getProjectiles();

      world.ship.position.set(player.x, player.y);
      world.ship.rotation = player.rotation;
      world.ship.visible = player.health > 0;

      world.shadow.position.set(player.x + 7, player.y + 9);
      world.shadow.rotation = player.rotation;
      world.shadow.visible = player.health > 0;

      world.renderEnemies(enemies);
      world.renderProjectiles(projectiles);
      world.renderHealthBars(player, enemies);

      // Throttling: Envia snapshot ao React a cada 100ms (10 vezes por seg)
      snapshotAccumulator += ticker.deltaMS;
      if (snapshotAccumulator >= 100) {
        snapshotAccumulator = 0;
        callbacks.onSnapshot?.(simulation.getSnapshot());
      }
    });

    app.start();

    function resize() {
      if (disposed || !initialized) return;

      const { width, height } = host.getBoundingClientRect();
      if (width <= 0 || height <= 0) return;

      app.renderer.resize(width, height, Math.min(window.devicePixelRatio || 1, 2));
      const scale = Math.min(width / arenaConfig.width, height / arenaConfig.height);
      world.scale.set(scale);
      world.position.set(
        (width - arenaConfig.width * scale) / 2,
        (height - arenaConfig.height * scale) / 2,
      );
    }

    resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(host);
    window.addEventListener('resize', resize);
    removeResizeListener = () => window.removeEventListener('resize', resize);
    resize();
    callbacks.onReady();
  }

  void initialize().catch(() => {
    releaseResources();
    if (!disposed) callbacks.onError();
  });

  return () => {
    disposed = true;
    releaseResources();
  };
}