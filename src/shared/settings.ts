export type FontChoice = "default" | "opendyslexic" | "lexend" | "sans";
export type ThemeChoice = "cream" | "dark" | "high_contrast" | "custom";

export interface FocusSettings {
  enabled: boolean;
  lineHeightPx: number;    // height of highlight band
  opacity: number;         // 0..1
  color: string;           // rgba(...)
  followMode: "cursor" | "keyboard";
}

export interface TTSSettings {
  enabled: boolean;
  voice?: string;          // chrome.tts voiceName
  rate: number;            // 0.1..10
  pitch: number;           // 0..2
  highlight: boolean;
}

export interface ReadabilitySettings {
  enabled: boolean;        // Reader View
}

export interface TypographySettings {
  font: FontChoice;
  fontSize: number;        // px
  lineHeight: number;      // unitless multiplier
  letterSpacing: number;   // em
  wordSpacing: number;     // px
  paragraphSpacing: number;// px (margin-bottom)
  leftAlign: boolean;
  disableJustify: boolean;
  maxColumnWidth: number;  // px
}

export interface ThemeSettings {
  theme: ThemeChoice;
  textColor?: string;
  backgroundColor?: string;
  overlayTint?: string;    // rgba overlay
  linkEmphasis?: boolean;
  contrastBoost?: number;  // 0..1 -> mix with #000/#fff
}

export interface Profile {
  id: string;
  name: string;
  typography: TypographySettings;
  theme: ThemeSettings;
  focus: FocusSettings;
  tts: TTSSettings;
  readability: ReadabilitySettings;
}

export interface AppState {
  enabled: boolean;
  activeProfileId: string;
  profiles: Record<string, Profile>;
  perSite: Record<string, Partial<AppState>>; // overrides by domain
}

// Default settings
export const DEFAULT_TYPOGRAPHY: TypographySettings = {
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

export const DEFAULT_THEME: ThemeSettings = {
  theme: "cream",
  textColor: "#1a1a1a",
  backgroundColor: "#fff8e6",
  overlayTint: "rgba(255, 240, 200, 0.2)",
  linkEmphasis: true,
  contrastBoost: 0
};

export const DEFAULT_FOCUS: FocusSettings = {
  enabled: false,
  lineHeightPx: 24,
  opacity: 0.3,
  color: "rgba(0, 123, 255, 0.3)",
  followMode: "cursor"
};

export const DEFAULT_TTS: TTSSettings = {
  enabled: true,
  rate: 1.0,
  pitch: 1.0,
  highlight: true
};

export const DEFAULT_READABILITY: ReadabilitySettings = {
  enabled: false
};

export const DEFAULT_PROFILE: Profile = {
  id: "default",
  name: "Default",
  typography: DEFAULT_TYPOGRAPHY,
  theme: DEFAULT_THEME,
  focus: DEFAULT_FOCUS,
  tts: DEFAULT_TTS,
  readability: DEFAULT_READABILITY
};

export const PRESETS: Record<string, Partial<Profile>> = {
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
