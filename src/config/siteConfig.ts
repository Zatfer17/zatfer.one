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
    titleMinHeight: 240,
    bodyMinHeight: 430,
    titleSize: 80,
    bodySize: 32,
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
      '#ef4444',
    ],
  },

  buttons: {
    colors: [
      '#6b7280',
      '#fb923c',
      '#60a5fa',
    ],
  },

  cassetteCollection: {
    title: 'Cassette compartment',
    compartmentBg: '#333333',
    compartmentMaxWidth: 980,
    compartmentMarginX: 64,
    compartmentOffsetTop: 116,
    columns: 3,
    coverWidth: 150,
    coverHeight: 188,
    fontColor: '#ffffff',
    fontSize: 24,
    headerButtonWidth: 152,
    headerButtonHeight: 78,
  },
} as const
