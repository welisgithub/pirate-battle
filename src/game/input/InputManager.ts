// src/game/input/InputManager.ts

export interface InputState {
  forward: boolean;
  rotateLeft: boolean;
  rotateRight: boolean;
  fireFront: boolean;
  fireLeft: boolean;
  fireRight: boolean;
}

export class InputManager {
  private state: InputState = {
    forward: false,
    rotateLeft: false,
    rotateRight: false,
    fireFront: false,
    fireLeft: false,
    fireRight: false,
  };

  private active = false;
  private onKeyDownBound = this.handleKeyDown.bind(this);
  private onKeyUpBound = this.handleKeyUp.bind(this);

  public start(): void {
    if (this.active) return;
    this.active = true;
    window.addEventListener('keydown', this.onKeyDownBound);
    window.addEventListener('keyup', this.onKeyUpBound);
  }

  public stop(): void {
    this.active = false;
    window.removeEventListener('keydown', this.onKeyDownBound);
    window.removeEventListener('keyup', this.onKeyUpBound);
    this.reset();
  }

  public getState(): Readonly<InputState> {
    return this.state;
  }

  public reset(): void {
    this.state = {
      forward: false,
      rotateLeft: false,
      rotateRight: false,
      fireFront: false,
      fireLeft: false,
      fireRight: false,
    };
  }

  private handleKeyDown(e: KeyboardEvent): void {
    if (!this.active) return;
    // Evita scroll da página com espaço e setas
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
      e.preventDefault();
    }
    this.updateKey(e.code, true);
  }

  private handleKeyUp(e: KeyboardEvent): void {
    if (!this.active) return;
    this.updateKey(e.code, false);
  }

  private updateKey(code: string, isPressed: boolean): void {
    switch (code) {
      case 'KeyW':
      case 'ArrowUp':
        this.state.forward = isPressed;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        this.state.rotateLeft = isPressed;
        break;
      case 'KeyD':
      case 'ArrowRight':
        this.state.rotateRight = isPressed;
        break;
      case 'Space':
        this.state.fireFront = isPressed;
        break;
      case 'KeyQ':
        this.state.fireLeft = isPressed;
        break;
      case 'KeyE':
        this.state.fireRight = isPressed;
        break;
    }
  }
}