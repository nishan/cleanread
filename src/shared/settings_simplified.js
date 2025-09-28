// Default settings
export const DEFAULT_TYPOGRAPHY = {
  font: "opendyslexic",
  fontSize: 18,
  lineHeight: 1.7,
  letterSpacing: 0.02,
  wordSpacing: 2,
  paragraphSpacing: 16,
  leftAlign: true,
  disableJustify: true,
  maxColumnWidth: 780
};

export const DEFAULT_THEME = {
  theme: "cream",
  textColor: "#1a1a1a",
  backgroundColor: "#fff8e6",
  overlayTint: "rgba(255, 240, 200, 0.2)",
  linkEmphasis: true,
  contrastBoost: 0
};

export const DEFAULT_PROFILE = {
  id: "default",
  name: "Default",
  typography: DEFAULT_TYPOGRAPHY,
  theme: DEFAULT_THEME
};

export const PRESETS = {
  high_readability: {
    name: "High Readability",
    typography: {
      ...DEFAULT_TYPOGRAPHY,
      fontSize: 20,
      lineHeight: 1.8,
      letterSpacing: 0.03,
      wordSpacing: 3
    },
    theme: {
      ...DEFAULT_THEME,
      contrastBoost: 0.1
    }
  },
  calm_reading: {
    name: "Calm Reading",
    typography: {
      ...DEFAULT_TYPOGRAPHY,
      fontSize: 16,
      lineHeight: 1.6,
      letterSpacing: 0.01
    },
    theme: {
      ...DEFAULT_THEME,
      overlayTint: "rgba(240, 248, 255, 0.3)"
    }
  },
  high_contrast: {
    name: "High Contrast",
    typography: {
      ...DEFAULT_TYPOGRAPHY,
      fontSize: 19
    },
    theme: {
      theme: "high_contrast",
      textColor: "#000000",
      backgroundColor: "#ffffff",
      contrastBoost: 0.3
    }
  },
  minimal: {
    name: "Minimal",
    typography: {
      ...DEFAULT_TYPOGRAPHY,
      fontSize: 16,
      lineHeight: 1.5,
      letterSpacing: 0,
      wordSpacing: 0
    },
    theme: {
      theme: "custom",
      textColor: "#333333",
      backgroundColor: "#ffffff",
      overlayTint: "transparent"
    }
  }
};
