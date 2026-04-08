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
    gashaponOffsetY: 0,
    gashaponWidth: 300,
    gashaponMaxWidth: 600,
    footerReservedHeight: 64,
  },

  balls: {
    size: {
      min: 60,
      max: 120,
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
      '#6b7280',
      '#ef4444',
      '#f97316',
      '#f59e0b',
      '#eab308',
      '#84cc16',
      '#22c55e',
      '#10b981',
      '#14b8a6',
      '#06b6d4',
      '#0ea5e9',
      '#3b82f6',
      '#6366f1',
      '#8b5cf6',
      '#a855f7',
      '#ec4899',
    ],
  },

  colors: {
    resetWidget: {
      trackBackground: '#6b7280',
      trackBorder: '#6b7280',
      knob: '#ffffff',
      label: '#f3f4f6',
    },
    topButtons: {
      github: '#6b7280',
      soundcloud: '#fb923c',
      linkedIn: '#60a5fa',
    },
  },
} as const
