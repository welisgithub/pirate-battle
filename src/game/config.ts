interface ArenaConfig {
  readonly width: number;
  readonly height: number;
  readonly tileSize: number;
  readonly island: { readonly x: number; readonly y: number; readonly columns: number };
  readonly player: { readonly x: number; readonly y: number; readonly rotation: number };
}

// Positions use logical world pixels. Resizing only changes the display scale.
export const arenaConfig: ArenaConfig = {
  width: 1024,
  height: 576,
  tileSize: 64,
  island: { x: 576, y: 128, columns: 3 },
  player: { x: 320, y: 350, rotation: Math.PI / 5 },
};
