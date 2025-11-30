export enum PetState {
  IDLE = 'IDLE',
  WALKING = 'WALKING',
  DRAGGING = 'DRAGGING',
  HAPPY = 'HAPPY',
  INTRO = 'INTRO',
  OUTRO = 'OUTRO',
  SLEEP = 'SLEEP',
  WAKEUP = 'WAKEUP'
}

export interface Position {
  x: number;
  y: number;
}

export interface SpriteConfig {
  rows: number;
  cols: number;
  src: string;
  width: number; // Display width in pixels
  height: number; // Display height in pixels
  animationSpeed: number; // ms per frame
}

export interface SoundConfig {
  interact: string;
  intro?: string;
  outro?: string;
  // Có thể thêm các sound khác sau
}