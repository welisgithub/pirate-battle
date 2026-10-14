// src/game/createArenaScene.ts
import { Container, Graphics, Sprite, TilingSprite } from 'pixi.js';
import type { ArenaAssets } from './assets';
import { arenaConfig } from './config';
import type { EnemyEntity, PlayerEntity, ProjectileEntity } from './simulation/GameSimulation';

interface EnemyView {
  ship: Sprite;
  shadow: Sprite;
}

export class ArenaWorld extends Container {
  public ship: Sprite;
  public shadow: Sprite;

  private projectileGraphics: Graphics;
  private uiGraphics: Graphics;
  private enemiesContainer: Container;
  private enemyViews = new Map<number, EnemyView>();
  private shipTexture: ArenaAssets['ship'];

  constructor(assets: ArenaAssets) {
    super();
    this.eventMode = 'none';
    this.shipTexture = assets.ship;

    // 1. Água
    const water = new TilingSprite({
      texture: assets.water,
      width: arenaConfig.width,
      height: arenaConfig.height,
    });
    this.addChild(water);

    // 2. Ilha
    assets.islandTiles.forEach((texture, index) => {
      const tile = new Sprite(texture);
      tile.position.set(
        arenaConfig.island.x + (index % arenaConfig.island.columns) * arenaConfig.tileSize,
        arenaConfig.island.y + Math.floor(index / arenaConfig.island.columns) * arenaConfig.tileSize,
      );
      this.addChild(tile);
    });

    // 3. Palmeira
    const palm = new Sprite(assets.palm);
    palm.anchor.set(0.5);
    palm.position.set(arenaConfig.island.x + 96, arenaConfig.island.y + 96);
    this.addChild(palm);

    // 4. Container para os navios inimigos
    this.enemiesContainer = new Container();
    this.addChild(this.enemiesContainer);

    // 5. Sombra e Navio do jogador
    this.shadow = new Sprite(assets.ship);
    this.shadow.anchor.set(0.5);
    this.shadow.position.set(arenaConfig.player.x + 7, arenaConfig.player.y + 9);
    this.shadow.rotation = arenaConfig.player.rotation;
    this.shadow.tint = 0x123844;
    this.shadow.alpha = 0.3;
    this.addChild(this.shadow);

    this.ship = new Sprite(assets.ship);
    this.ship.anchor.set(0.5);
    this.ship.position.set(arenaConfig.player.x, arenaConfig.player.y);
    this.ship.rotation = arenaConfig.player.rotation;
    this.addChild(this.ship);

    // 6. Projéteis
    this.projectileGraphics = new Graphics();
    this.addChild(this.projectileGraphics);

    // 7. Barras de Vida sobre os navios
    this.uiGraphics = new Graphics();
    this.addChild(this.uiGraphics);
  }

  public renderEnemies(enemies: ReadonlyArray<EnemyEntity>): void {
    const activeIds = new Set<number>();

    for (const enemy of enemies) {
      activeIds.add(enemy.id);
      let view = this.enemyViews.get(enemy.id);

      if (!view) {
        const shadow = new Sprite(this.shipTexture);
        shadow.anchor.set(0.5);
        shadow.tint = 0x123844;
        shadow.alpha = 0.3;
        this.enemiesContainer.addChild(shadow);

        const ship = new Sprite(this.shipTexture);
        ship.anchor.set(0.5);
        // Chaser = Vermelho vivo, Shooter = Laranja
        ship.tint = enemy.type === 'chaser' ? 0xe74c3c : 0xf39c12;
        this.enemiesContainer.addChild(ship);

        view = { ship, shadow };
        this.enemyViews.set(enemy.id, view);
      }

      view.ship.position.set(enemy.x, enemy.y);
      view.ship.rotation = enemy.rotation;

      view.shadow.position.set(enemy.x + 6, enemy.y + 8);
      view.shadow.rotation = enemy.rotation;
    }

    // Remove sprites de inimigos destruídos
    for (const [id, view] of this.enemyViews.entries()) {
      if (!activeIds.has(id)) {
        this.enemiesContainer.removeChild(view.ship);
        this.enemiesContainer.removeChild(view.shadow);
        view.ship.destroy();
        view.shadow.destroy();
        this.enemyViews.delete(id);
      }
    }
  }

  public renderProjectiles(projectiles: ReadonlyArray<ProjectileEntity>): void {
    this.projectileGraphics.clear();

    for (const p of projectiles) {
      // Sombra
      this.projectileGraphics.circle(p.x + 2, p.y + 3, p.radius);
      this.projectileGraphics.fill({ color: 0x0f2c38, alpha: 0.35 });

      // Bala do Jogador (cinza escura) vs Bala Inimiga (vermelho fogo)
      this.projectileGraphics.circle(p.x, p.y, p.radius);
      this.projectileGraphics.fill({ color: p.fromPlayer ? 0x222222 : 0xd35400 });
      this.projectileGraphics.stroke({ width: 1, color: p.fromPlayer ? 0x666666 : 0xf39c12 });
    }
  }

  public renderHealthBars(player: Readonly<PlayerEntity>, enemies: ReadonlyArray<EnemyEntity>): void {
    this.uiGraphics.clear();

    // 1. Barra de vida do Jogador (se vivo)
    if (player.health > 0) {
      this.drawHealthBar(player.x, player.y - 34, 40, 5, player.health / player.maxHealth, 0x2ecc71);
    }

    // 2. Barra de vida dos Inimigos
    for (const enemy of enemies) {
      this.drawHealthBar(enemy.x, enemy.y - 32, 34, 4, enemy.health / enemy.maxHealth, 0xe74c3c);
    }
  }

  private drawHealthBar(x: number, y: number, width: number, height: number, percent: number, color: number): void {
    const halfW = width / 2;

    // Fundo preto
    this.uiGraphics.rect(x - halfW - 1, y - 1, width + 2, height + 2);
    this.uiGraphics.fill({ color: 0x000000, alpha: 0.65 });

    // Barra de vida preenchida
    if (percent > 0) {
      this.uiGraphics.rect(x - halfW, y, width * Math.max(0, Math.min(1, percent)), height);
      this.uiGraphics.fill({ color });
    }
  }
}