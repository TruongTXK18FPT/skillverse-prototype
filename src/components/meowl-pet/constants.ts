import { SpriteConfig, SoundConfig } from './types';

// Import assets using Vite's asset handling
import idleSprite from '../../assets/meowl-pet/spritesheet/idle.png';
import walkingSprite from '../../assets/meowl-pet/spritesheet/walk-side.png';
import interactSprite from '../../assets/meowl-pet/spritesheet/interact.png';
import introSprite from '../../assets/meowl-pet/spritesheet/intro.png';
import outroSprite from '../../assets/meowl-pet/spritesheet/outro.png';
import sleepSprite from '../../assets/meowl-pet/spritesheet/sleep.png';
import wakeupSprite from '../../assets/meowl-pet/spritesheet/wakeup.png';
import dragSprite from '../../assets/meowl-pet/spritesheet/drag.png';
import interactSound from '../../assets/meowl-pet/sound/hao-xiang-ni.mp3';
import huhSound from '../../assets/meowl-pet/sound/huh-sound.mp3';
import getSnappedSound from '../../assets/meowl-pet/sound/get-snapped.mp3';

// Sprite sheets configurations - 4x4 frames each
export const SPRITE_SHEETS = {
  idle: idleSprite,
  walking: walkingSprite,
  interact: interactSprite,
  intro: introSprite,
  outro: outroSprite,
  sleep: sleepSprite,
  wakeup: wakeupSprite,
  drag: dragSprite,
} as const;

// Sound configurations
export const SOUNDS: SoundConfig = {
  interact: interactSound,
  intro: huhSound,
  outro: getSnappedSound,
};

export const PET_CONFIG: SpriteConfig = {
  rows: 4,
  cols: 4,
  src: SPRITE_SHEETS.idle, // Default sprite
  width: 100,  // Display size in pixels
  height: 100,
  animationSpeed: 100, // ms per frame - Faster for smoother animations
};

// Movement settings
export const MOVEMENT_SPEED = 0.02; // Lower speed for lazy follow
export const STOP_DISTANCE = 70; 
export const INTERACTION_DURATION = 3000;
export const SLEEP_TIMEOUT = 15000; // 15 seconds

// Animation settings
export const WALK_BOB_AMPLITUDE = 4; // pixels for walking bob effect
export const WALK_BOB_SPEED = 100; // speed of bob animation