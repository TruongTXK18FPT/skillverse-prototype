import { SpriteConfig, SoundConfig } from './types';

// Import assets using Vite's asset handling
import idleSprite from '../../assets/meowl-pet/spritesheet/idle.png';
import walkingSprite from '../../assets/meowl-pet/spritesheet/walk-side.png';
import interactSprite from '../../assets/meowl-pet/spritesheet/interact.png';
import interactSound from '../../assets/meowl-pet/sound/hao-xiang-ni.mp3';

// Sprite sheets configurations - 4x4 frames each
export const SPRITE_SHEETS = {
  idle: idleSprite,
  walking: walkingSprite,
  interact: interactSprite,
} as const;

// Sound configurations
export const SOUNDS: SoundConfig = {
  interact: interactSound,
};

export const PET_CONFIG: SpriteConfig = {
  rows: 4,
  cols: 4,
  src: SPRITE_SHEETS.idle, // Default sprite
  width: 100,  // Display size in pixels
  height: 100,
  animationSpeed: 200, // ms per frame
};

// Movement settings
export const MOVEMENT_SPEED = 0.025; // Lower speed for lazy follow
export const STOP_DISTANCE = 70; 
export const INTERACTION_DURATION = 2500;

// Animation settings
export const WALK_BOB_AMPLITUDE = 4; // pixels for walking bob effect
export const WALK_BOB_SPEED = 100; // speed of bob animation