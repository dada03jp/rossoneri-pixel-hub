'use client';

import React from 'react';

// Pixel configurations for different player appearances
export interface PixelConfig {
  skinTone: 'light' | 'medium' | 'dark';
  hairStyle: 'short' | 'medium' | 'bald' | 'afro';
  hairColor: 'black' | 'brown' | 'blonde';
}

interface PixelPlayerProps {
  config: PixelConfig;
  number: number;
  size?: number;
  showNumber?: boolean;
  className?: string;
}

// Color palettes
const SKIN_COLORS = {
  light: '#FFD5B8',
  medium: '#D4A574',
  dark: '#8B5A2B',
};

const HAIR_COLORS = {
  black: '#1A1A1A',
  brown: '#5C4033',
  blonde: '#DAA520',
};

// 16x16 pixel grid patterns
// 0 = transparent, 1 = skin, 2 = hair, 3 = red jersey, 4 = black jersey, 5 = white (shorts/socks)
const BASE_PLAYER = [
  [0, 0, 0, 0, 0, 2, 2, 2, 2, 2, 2, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 2, 2, 2, 2, 2, 2, 2, 2, 0, 0, 0, 0],
  [0, 0, 0, 0, 2, 1, 1, 1, 1, 1, 1, 2, 0, 0, 0, 0],
  [0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0],
  [0, 0, 0, 0, 1, 6, 1, 1, 1, 6, 1, 1, 0, 0, 0, 0], // 6 = eyes
  [0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 1, 1, 7, 1, 1, 1, 0, 0, 0, 0, 0], // 7 = mouth
  [0, 0, 0, 0, 3, 4, 3, 4, 3, 4, 3, 4, 0, 0, 0, 0],
  [0, 0, 0, 3, 4, 3, 4, 3, 4, 3, 4, 3, 4, 0, 0, 0],
  [0, 0, 1, 3, 4, 3, 4, 3, 4, 3, 4, 3, 4, 1, 0, 0],
  [0, 0, 1, 3, 4, 3, 4, 3, 4, 3, 4, 3, 4, 1, 0, 0],
  [0, 0, 0, 3, 4, 3, 4, 3, 4, 3, 4, 3, 4, 0, 0, 0],
  [0, 0, 0, 0, 5, 5, 5, 5, 5, 5, 5, 5, 0, 0, 0, 0],
  [0, 0, 0, 0, 5, 5, 5, 0, 0, 5, 5, 5, 0, 0, 0, 0],
  [0, 0, 0, 0, 1, 1, 1, 0, 0, 1, 1, 1, 0, 0, 0, 0],
  [0, 0, 0, 0, 4, 4, 4, 0, 0, 4, 4, 4, 0, 0, 0, 0],
];

// Hair style overlays (modifications to rows 0-2)
const HAIR_STYLES: Record<string, number[][]> = {
  short: [
    [0, 0, 0, 0, 0, 2, 2, 2, 2, 2, 2, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 2, 2, 2, 2, 2, 2, 2, 2, 0, 0, 0, 0],
    [0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0],
  ],
  medium: [
    [0, 0, 0, 0, 2, 2, 2, 2, 2, 2, 2, 2, 0, 0, 0, 0],
    [0, 0, 0, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 0, 0, 0],
    [0, 0, 0, 2, 2, 0, 0, 0, 0, 0, 0, 2, 2, 0, 0, 0],
  ],
  bald: [
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0],
  ],
  afro: [
    [0, 0, 0, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 0, 0, 0],
    [0, 0, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 0, 0],
    [0, 0, 2, 2, 2, 0, 0, 0, 0, 0, 0, 2, 2, 2, 0, 0],
  ],
};

export function PixelPlayer({ 
  config, 
  number, 
  size = 64, 
  showNumber = true,
  className = '' 
}: PixelPlayerProps) {
  const pixelSize = size / 16;
  const skinColor = SKIN_COLORS[config.skinTone];
  const hairColor = HAIR_COLORS[config.hairColor];
  
  // Create the pixel grid with hair style applied
  const grid = BASE_PLAYER.map((row, rowIndex) => {
    if (rowIndex < 3) {
      const hairRow = HAIR_STYLES[config.hairStyle][rowIndex];
      return hairRow || row;
    }
    return row;
  });

  const getPixelColor = (value: number): string => {
    switch (value) {
      case 0: return 'transparent';
      case 1: return skinColor;
      case 2: return hairColor;
      case 3: return '#E30613'; // Milan Red
      case 4: return '#000000'; // Black
      case 5: return '#FFFFFF'; // White
      case 6: return '#1A1A1A'; // Eyes
      case 7: return '#CC0000'; // Mouth
      default: return 'transparent';
    }
  };

  return (
    <div 
      className={`relative inline-block ${className}`}
      style={{ width: size, height: size }}
    >
      <svg 
        width={size} 
        height={size} 
        viewBox="0 0 16 16"
        style={{ imageRendering: 'pixelated' }}
      >
        {grid.map((row, y) =>
          row.map((pixel, x) => {
            const color = getPixelColor(pixel);
            if (color === 'transparent') return null;
            return (
              <rect
                key={`${x}-${y}`}
                x={x}
                y={y}
                width={1}
                height={1}
                fill={color}
              />
            );
          })
        )}
      </svg>
      
      {/* Jersey Number Badge */}
      {showNumber && (
        <div 
          className="absolute -bottom-1 -right-1 bg-milan-red text-white text-xs font-bold rounded px-1 min-w-[18px] text-center"
          style={{ 
            fontSize: Math.max(8, size / 6),
            lineHeight: 1.2,
            boxShadow: '0 1px 2px rgba(0,0,0,0.3)'
          }}
        >
          {number}
        </div>
      )}
    </div>
  );
}

// Preset player configurations for quick use
export const PLAYER_PRESETS: Record<string, PixelConfig> = {
  maignan: { skinTone: 'dark', hairStyle: 'short', hairColor: 'black' },
  theo: { skinTone: 'medium', hairStyle: 'medium', hairColor: 'brown' },
  tomori: { skinTone: 'dark', hairStyle: 'short', hairColor: 'black' },
  calabria: { skinTone: 'light', hairStyle: 'short', hairColor: 'brown' },
  bennacer: { skinTone: 'medium', hairStyle: 'short', hairColor: 'black' },
  tonali: { skinTone: 'light', hairStyle: 'medium', hairColor: 'brown' },
  leao: { skinTone: 'dark', hairStyle: 'afro', hairColor: 'black' },
  pulisic: { skinTone: 'light', hairStyle: 'short', hairColor: 'brown' },
  giroud: { skinTone: 'light', hairStyle: 'bald', hairColor: 'brown' },
};

export default PixelPlayer;
