import { Assets, type Texture } from 'pixi.js';
import waterUrl from '../../assets/png/default/tiles/tile_73.png';
import shipUrl from '../../assets/png/default/ships/ship_14.png';
import palmUrl from '../../assets/png/default/tiles/tile_71.png';
import topLeftUrl from '../../assets/png/default/tiles/tile_6.png';
import topUrl from '../../assets/png/default/tiles/tile_7.png';
import topRightUrl from '../../assets/png/default/tiles/tile_9.png';
import leftUrl from '../../assets/png/default/tiles/tile_22.png';
import centerUrl from '../../assets/png/default/tiles/tile_23.png';
import rightUrl from '../../assets/png/default/tiles/tile_25.png';
import bottomLeftUrl from '../../assets/png/default/tiles/tile_54.png';
import bottomUrl from '../../assets/png/default/tiles/tile_55.png';
import bottomRightUrl from '../../assets/png/default/tiles/tile_57.png';

export interface ArenaAssets {
  water: Texture;
  ship: Texture;
  palm: Texture;
  islandTiles: Texture[];
}

const islandUrls = [
  topLeftUrl, topUrl, topRightUrl,
  leftUrl, centerUrl, rightUrl,
  bottomLeftUrl, bottomUrl, bottomRightUrl,
];

export async function loadArenaAssets(): Promise<ArenaAssets> {
  // Pixi caches textures by URL. Re-entering the arena reuses this fixed set.
  const [water, ship, palm, islandTiles] = await Promise.all([
    Assets.load<Texture>(waterUrl),
    Assets.load<Texture>(shipUrl),
    Assets.load<Texture>(palmUrl),
    Promise.all(islandUrls.map((url) => Assets.load<Texture>(url))),
  ]);

  return { water, ship, palm, islandTiles };
}
