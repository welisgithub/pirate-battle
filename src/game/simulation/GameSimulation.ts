// src/game/simulation/GameSimulation.ts
import type { InputState } from '../input/InputManager';
import { arenaConfig } from '../config';

export type EnemyType = 'chaser' | 'shooter';
export type EndReason = 'time_out' | 'player_dead';

export interface PlayerEntity {
  x: number;
  y: number;
  rotation: number;
  radius: number;
  speed: number;
  turnSpeed: number;
  health: number;
  maxHealth: number;
}

export interface EnemyEntity {
  id: number;
  type: EnemyType;
  x: number;
  y: number;
  rotation: number;
  radius: number;
  speed: number;
  turnSpeed: number;
  health: number;
  maxHealth: number;
  shootCooldown: number;
}

export interface ProjectileEntity {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  damage: number;
  lifetime: number;
  fromPlayer: boolean;
}

export interface GameSnapshot {
  score: number;
  timeRemaining: number;
  timePlayed: number;
  playerHealth: number;
  playerMaxHealth: number;
  isPaused: boolean;
  isGameOver: boolean;
  endReason: EndReason | null;
}

export class GameSimulation {
  private player: PlayerEntity;
  private enemies: EnemyEntity[] = [];
  private projectiles: ProjectileEntity[] = [];

  private nextEnemyId = 1;
  private nextProjectileId = 1;
  private score = 0;

  // Tempo e spawn configuráveis pelas opções
  private sessionDuration: number;
  private spawnInterval: number;
  private timeRemaining: number;
  private timePlayed = 0;
  private isPaused = false;
  private isGameOver = false;
  private endReason: EndReason | null = null;

  // Cooldowns de disparo do jogador
  private frontCooldown = 0;
  private leftCooldown = 0;
  private rightCooldown = 0;
  private spawnTimer: number;

  private readonly FRONT_COOLDOWN_TIME = 0.35;
  private readonly SIDE_COOLDOWN_TIME = 0.75;
  private readonly PROJECTILE_SPEED = 380;
  private readonly PROJECTILE_LIFETIME = 1.3;

  private readonly island = {
    minX: arenaConfig.island.x,
    maxX: arenaConfig.island.x + arenaConfig.island.columns * arenaConfig.tileSize,
    minY: arenaConfig.island.y,
    maxY: arenaConfig.island.y + 3 * arenaConfig.tileSize,
  };

  // Único construtor da classe
  constructor(sessionDuration = 90, spawnInterval = 3.2) {
    this.sessionDuration = sessionDuration;
    this.spawnInterval = spawnInterval;
    this.timeRemaining = sessionDuration;
    this.spawnTimer = 1.0;
    this.player = this.createInitialPlayer();
  }

  private createInitialPlayer(): PlayerEntity {
    return {
      x: arenaConfig.player.x,
      y: arenaConfig.player.y,
      rotation: arenaConfig.player.rotation,
      radius: 22,
      speed: 180,
      turnSpeed: 2.8,
      health: 100,
      maxHealth: 100,
    };
  }

  public reset(): void {
    this.player = this.createInitialPlayer();
    this.enemies = [];
    this.projectiles = [];
    this.score = 0;
    this.timeRemaining = this.sessionDuration;
    this.timePlayed = 0;
    this.isPaused = false;
    this.isGameOver = false;
    this.endReason = null;
    this.frontCooldown = 0;
    this.leftCooldown = 0;
    this.rightCooldown = 0;
    this.spawnTimer = 1.0;
  }

  public setPaused(paused: boolean): void {
    if (this.isGameOver) return;
    this.isPaused = paused;
  }

  public getPaused(): boolean {
    return this.isPaused;
  }

  public getGameOver(): boolean {
    return this.isGameOver;
  }

  public getPlayer(): Readonly<PlayerEntity> {
    return this.player;
  }

  public getEnemies(): ReadonlyArray<EnemyEntity> {
    return this.enemies;
  }

  public getProjectiles(): ReadonlyArray<ProjectileEntity> {
    return this.projectiles;
  }

  public getSnapshot(): GameSnapshot {
    return {
      score: this.score,
      timeRemaining: Math.ceil(this.timeRemaining),
      timePlayed: Math.floor(this.timePlayed),
      playerHealth: Math.max(0, this.player.health),
      playerMaxHealth: this.player.maxHealth,
      isPaused: this.isPaused,
      isGameOver: this.isGameOver,
      endReason: this.endReason,
    };
  }

  public update(deltaMs: number, input: Readonly<InputState>): void {
    if (this.isPaused || this.isGameOver) return;

    const dt = deltaMs / 1000;

    // Atualiza cronômetro da partida
    this.timeRemaining -= dt;
    this.timePlayed += dt;

    if (this.timeRemaining <= 0) {
      this.timeRemaining = 0;
      this.isGameOver = true;
      this.endReason = 'time_out';
      return;
    }

    // Cooldowns
    if (this.frontCooldown > 0) this.frontCooldown -= dt;
    if (this.leftCooldown > 0) this.leftCooldown -= dt;
    if (this.rightCooldown > 0) this.rightCooldown -= dt;

    // Movimentação do jogador
    if (this.player.health > 0) {
      if (input.rotateLeft) this.player.rotation -= this.player.turnSpeed * dt;
      if (input.rotateRight) this.player.rotation += this.player.turnSpeed * dt;

      if (input.forward) {
        const vx = Math.sin(this.player.rotation) * this.player.speed;
        const vy = -Math.cos(this.player.rotation) * this.player.speed;

        const nextX = this.player.x + vx * dt;
        const nextY = this.player.y + vy * dt;

        if (!this.collidesWithIsland(nextX, this.player.y, this.player.radius)) {
          this.player.x = nextX;
        }
        if (!this.collidesWithIsland(this.player.x, nextY, this.player.radius)) {
          this.player.y = nextY;
        }
      }

      this.clampToArena(this.player);

      // Disparos
      if (input.fireFront && this.frontCooldown <= 0) {
        this.shootFront();
        this.frontCooldown = this.FRONT_COOLDOWN_TIME;
      }
      if (input.fireLeft && this.leftCooldown <= 0) {
        this.shootSide(-1);
        this.leftCooldown = this.SIDE_COOLDOWN_TIME;
      }
      if (input.fireRight && this.rightCooldown <= 0) {
        this.shootSide(1);
        this.rightCooldown = this.SIDE_COOLDOWN_TIME;
      }
    } else {
      this.isGameOver = true;
      this.endReason = 'player_dead';
      return;
    }

    this.updateSpawns(dt);
    this.updateEnemies(dt);
    this.updateProjectiles(dt);
  }

  private updateSpawns(dt: number): void {
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0 && this.enemies.length < 8) {
      this.spawnEnemy();
      this.spawnTimer = this.spawnInterval;
    }
  }

  private spawnEnemy(): void {
    const spawnPoints = [
      { x: 90, y: 90 },
      { x: 934, y: 90 },
      { x: 90, y: 486 },
      { x: 934, y: 486 },
    ];

    let bestPoint = spawnPoints[0]!;
    let maxDist = 0;

    for (const pt of spawnPoints) {
      const dist = Math.hypot(this.player.x - pt.x, this.player.y - pt.y);
      if (dist > maxDist) {
        maxDist = dist;
        bestPoint = pt;
      }
    }

    const type: EnemyType = Math.random() < 0.5 ? 'chaser' : 'shooter';

    this.enemies.push({
      id: this.nextEnemyId++,
      type,
      x: bestPoint.x,
      y: bestPoint.y,
      rotation: 0,
      radius: 20,
      speed: type === 'chaser' ? 140 : 95,
      turnSpeed: type === 'chaser' ? 2.5 : 1.8,
      health: type === 'chaser' ? 2 : 3,
      maxHealth: type === 'chaser' ? 2 : 3,
      shootCooldown: 1.5,
    });
  }

  private updateEnemies(dt: number): void {
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i]!;

      const toPlayerX = this.player.x - enemy.x;
      const toPlayerY = this.player.y - enemy.y;
      const distToPlayer = Math.hypot(toPlayerX, toPlayerY);

      const targetAngle = Math.atan2(toPlayerX, -toPlayerY);

      let diff = targetAngle - enemy.rotation;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;
      enemy.rotation += Math.max(-enemy.turnSpeed * dt, Math.min(enemy.turnSpeed * dt, diff));

      if (enemy.type === 'chaser') {
        const vx = Math.sin(enemy.rotation) * enemy.speed;
        const vy = -Math.cos(enemy.rotation) * enemy.speed;

        const nextX = enemy.x + vx * dt;
        const nextY = enemy.y + vy * dt;

        if (!this.collidesWithIsland(nextX, enemy.y, enemy.radius)) enemy.x = nextX;
        if (!this.collidesWithIsland(enemy.x, nextY, enemy.radius)) enemy.y = nextY;

        if (this.player.health > 0 && distToPlayer < this.player.radius + enemy.radius) {
          this.player.health = Math.max(0, this.player.health - 25);
          this.enemies.splice(i, 1);
          continue;
        }
      } else {
        if (distToPlayer > 270) {
          const vx = Math.sin(enemy.rotation) * enemy.speed;
          const vy = -Math.cos(enemy.rotation) * enemy.speed;

          const nextX = enemy.x + vx * dt;
          const nextY = enemy.y + vy * dt;

          if (!this.collidesWithIsland(nextX, enemy.y, enemy.radius)) enemy.x = nextX;
          if (!this.collidesWithIsland(enemy.x, nextY, enemy.radius)) enemy.y = nextY;
        }

        enemy.shootCooldown -= dt;
        if (this.player.health > 0 && distToPlayer <= 320 && enemy.shootCooldown <= 0) {
          this.shootEnemyProjectile(enemy);
          enemy.shootCooldown = 2.0;
        }
      }

      this.clampToArena(enemy);
    }
  }

  private shootEnemyProjectile(enemy: EnemyEntity): void {
    const forwardX = Math.sin(enemy.rotation);
    const forwardY = -Math.cos(enemy.rotation);

    this.projectiles.push({
      id: this.nextProjectileId++,
      x: enemy.x + forwardX * 24,
      y: enemy.y + forwardY * 24,
      vx: forwardX * 320,
      vy: forwardY * 320,
      radius: 4,
      damage: 15,
      lifetime: 1.4,
      fromPlayer: false,
    });
  }

  private shootFront(): void {
    const forwardX = Math.sin(this.player.rotation);
    const forwardY = -Math.cos(this.player.rotation);

    this.projectiles.push({
      id: this.nextProjectileId++,
      x: this.player.x + forwardX * 26,
      y: this.player.y + forwardY * 26,
      vx: forwardX * this.PROJECTILE_SPEED,
      vy: forwardY * this.PROJECTILE_SPEED,
      radius: 4,
      damage: 1,
      lifetime: this.PROJECTILE_LIFETIME,
      fromPlayer: true,
    });
  }

  private shootSide(direction: -1 | 1): void {
    const forwardX = Math.sin(this.player.rotation);
    const forwardY = -Math.cos(this.player.rotation);
    const normalX = direction * Math.cos(this.player.rotation);
    const normalY = direction * Math.sin(this.player.rotation);

    const offsets = [-14, 0, 14];

    for (const offset of offsets) {
      this.projectiles.push({
        id: this.nextProjectileId++,
        x: this.player.x + normalX * 18 + forwardX * offset,
        y: this.player.y + normalY * 18 + forwardY * offset,
        vx: normalX * this.PROJECTILE_SPEED,
        vy: normalY * this.PROJECTILE_SPEED,
        radius: 4,
        damage: 1,
        lifetime: this.PROJECTILE_LIFETIME,
        fromPlayer: true,
      });
    }
  }

  private updateProjectiles(dt: number): void {
    for (let pIdx = this.projectiles.length - 1; pIdx >= 0; pIdx--) {
      const p = this.projectiles[pIdx]!;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.lifetime -= dt;

      if (
        p.lifetime <= 0 ||
        p.x < 0 || p.x > arenaConfig.width ||
        p.y < 0 || p.y > arenaConfig.height ||
        this.collidesWithIsland(p.x, p.y, p.radius)
      ) {
        this.projectiles.splice(pIdx, 1);
        continue;
      }

      if (p.fromPlayer) {
        let hit = false;
        for (let eIdx = this.enemies.length - 1; eIdx >= 0; eIdx--) {
          const enemy = this.enemies[eIdx]!;
          if (Math.hypot(p.x - enemy.x, p.y - enemy.y) < p.radius + enemy.radius) {
            enemy.health -= p.damage;
            hit = true;

            if (enemy.health <= 0) {
              this.enemies.splice(eIdx, 1);
              this.score += 1;
            }
            break;
          }
        }
        if (hit) {
          this.projectiles.splice(pIdx, 1);
          continue;
        }
      } else {
        if (this.player.health > 0) {
          if (Math.hypot(p.x - this.player.x, p.y - this.player.y) < p.radius + this.player.radius) {
            this.player.health = Math.max(0, this.player.health - p.damage);
            this.projectiles.splice(pIdx, 1);
            continue;
          }
        }
      }
    }
  }

  private collidesWithIsland(x: number, y: number, radius: number): boolean {
    const closestX = Math.max(this.island.minX, Math.min(x, this.island.maxX));
    const closestY = Math.max(this.island.minY, Math.min(y, this.island.maxY));

    const distX = x - closestX;
    const distY = y - closestY;

    return distX * distX + distY * distY < radius * radius;
  }

  private clampToArena(entity: { x: number; y: number; radius: number }): void {
    const r = entity.radius;
    entity.x = Math.max(r, Math.min(entity.x, arenaConfig.width - r));
    entity.y = Math.max(r, Math.min(entity.y, arenaConfig.height - r));
  }
}