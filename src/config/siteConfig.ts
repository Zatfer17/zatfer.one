export const siteConfig = {
  theme: {
    backgroundColor: '#000000',
    fontColor: '#ffffff',
  },

  typography: {
    headerSize: 48,
    footerSize: 16,
    resetLabelSize: 12,
  },

  content: {
    componentWidthRatio: 0.8,
    componentMaxWidth: 1000,
    componentMinWidth: 640,
    titleMinHeight: 180,
    bodyMinHeight: 430,
    titleSize: 80,
    bodySize: 24,
    linkIconSize: 36,
  },

  layout: {
    gashaponOffsetX: 160,
    gashaponOffsetY: 80,
    footerReservedHeight: 64,
  },

  balls: {
    size: {
      min: 56,
      max: 80,
    },
    speed: {
      spawnMin: 38,
      spawnMax: 86,
      floatMin: 28,
      floatMax: 94,
      driftX: 0.03,
      driftY: 0.03,
    },
    colors: [
      [255, 91, 158],
      [74, 144, 255],
      [37, 214, 174],
      [255, 109, 65],
      [176, 120, 255],
      [255, 206, 74],
    ],
  },

  colors: {
    resetWidget: {
      trackBackground: 'rgba(255,255,255,0.12)',
      trackBorder: 'rgba(255,255,255,0.35)',
      knob: '#ffffff',
      label: 'rgba(255,255,255,0.8)',
    },
    topButtons: {
      github: '#6b7280',
      soundcloud: '#fb923c',
      linkedIn: '#60a5fa',
    },
  },
} as const
