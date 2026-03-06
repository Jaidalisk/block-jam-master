export type Color = 'red' | 'blue' | 'green' | 'yellow' | 'purple' | 'orange' | 'pink';

export interface Block {
  id: string;
  x: number;
  y: number;
  color: Color;
  status: 'board' | 'dock' | 'bus';
  isFrozen?: boolean;
  isMystery?: boolean;
}

export interface Bus {
  id: string;
  color: Color;
  capacity: number;
  filled: number;
}

export const COLORS: Color[] = ['red', 'blue', 'green', 'yellow', 'purple', 'orange', 'pink'];

export const COLOR_MAP: Record<Color, string> = {
  red: '#ef4444',
  blue: '#3b82f6',
  green: '#22c55e',
  yellow: '#eab308',
  purple: '#a855f7',
  orange: '#f97316',
  pink: '#ec4899',
};

export const DOCK_CAPACITY = 7;
export const BUS_CAPACITY = 3;
