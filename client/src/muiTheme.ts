import { createTheme } from "@mui/material/styles";

// Augment the MUI Theme to include app tokens used by the app
declare module '@mui/material/styles' {
  interface Theme {
    app: {
      tokens: {
        light: Record<string, string>;
        dark: Record<string, string>;
      };
      background: { primary: string; secondary: string; accent: string; gradient: string };
      border: { primary: string; secondary: string };
      text: { primary: string; secondary: string; muted: string; accent: string };
      button: {
        default: { bg: string; border: string; active: string };
        leftPressed: { bg: string; border: string; shadow: string };
        rightPressed: { bg: string; border: string; shadow: string };
      };
      touchpad: {
        default: { gradient: string; border: string };
        active: { border: string; shadow: string };
        grid: string;
        indicator: string;
      };
      cursor: {
        default: { bg: string; border: string };
        left: { bg: string; border: string };
        right: { bg: string; border: string };
      };
      control: { background: string; accent: string };
    };
  }

  // allow configuration using `createTheme`
  interface ThemeOptions {
    app?: Partial<Theme['app']>;
  }
}

// Extend Palette to include app-level tokens for easier access via `theme.palette.app`
declare module '@mui/material/styles' {
  interface Palette {
    app?: {
      grid?: string;
      indicator?: string;
      cursor?: {
        default?: { bg?: string; border?: string };
        left?: { bg?: string; border?: string };
        right?: { bg?: string; border?: string };
      };
      control?: { background?: string; accent?: string };
    };
  }
  interface PaletteOptions {
    app?: {
      grid?: string;
      indicator?: string;
      cursor?: {
        default?: { bg?: string; border?: string };
        left?: { bg?: string; border?: string };
        right?: { bg?: string; border?: string };
      };
      control?: { background?: string; accent?: string };
    };
  }
}

// Extended dark theme based on existing app tokens
export const muiTheme = createTheme({
  palette: {
    mode: "dark",
    background: {
      default: "#0f1720", // slate-900-like
      paper: "#111827", // slate-800-like
    },
    primary: {
      main: "#3b82f6", // blue-500
      light: "#60a5fa",
      dark: "#1e40af",
      contrastText: '#fff',
    },
    secondary: {
      main: "#7c3aed", // purple-500
      contrastText: '#fff',
    },
    success: {
      main: '#22c55e',
    },
    info: {
      main: '#3b82f6',
    },
    text: {
      primary: '#ffffff',
      secondary: 'rgb(148,163,184)',
    },
    divider: 'rgba(148,163,184,0.12)',

    // app-specific palette entries for convenient access in components
    app: {
      grid: '#6b7280',
      indicator: 'rgba(59,130,246,0.08)',
      cursor: {
        default: { bg: 'rgba(59,130,246,0.5)', border: '#60a5fa' },
        left: { bg: '#22c55e', border: '#16a34a' },
        right: { bg: '#7c3aed', border: '#6d28d9' },
      },
      control: { background: 'rgba(17,24,39,0.5)', accent: '#3b82f6' },
    },
  },
  typography: {
    fontFamily: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'].join(',')
  },
  spacing: 8,
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          background: 'linear-gradient(180deg, #0f1720 0%, #111827 100%)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
        },
      },
    },
  },

  // App-specific tokens mapped from client/src/theme.ts
  app: {
    tokens: {
        light: {
        '--font-size': '16px',
        '--background': '#ffffff',
        '--foreground': '#252525',
        '--card': '#ffffff',
        '--card-foreground': '#252525',
        '--popover': '#ffffff',
        '--popover-foreground': '#252525',
        '--primary': '#030213',
        '--primary-foreground': '#ffffff',
        '--secondary': '#f2f2f2',
        '--secondary-foreground': '#030213',
        '--muted': '#ececf0',
        '--muted-foreground': '#717182',
        '--accent': '#e9ebef',
        '--accent-foreground': '#030213',
        '--destructive': '#d4183d',
        '--destructive-foreground': '#ffffff',
        '--border': '#0000001a',
        '--input': 'transparent',
        '--input-background': '#f3f3f5',
        '--switch-background': '#cbced4',
        '--font-weight-medium': '500',
        '--font-weight-normal': '400',
        '--ring': '#b4b4b4',
        '--chart-1': '#f59e0b',
        '--chart-2': '#06b6d4',
        '--chart-3': '#6366f1',
        '--chart-4': '#84cc16',
        '--chart-5': '#bef264',
        '--radius': '.625rem',
        '--sidebar': '#fbfbfb',
        '--sidebar-foreground': '#252525',
        '--sidebar-primary': '#030213',
        '--sidebar-primary-foreground': '#fbfbfb',
        '--sidebar-accent': '#f7f7f7',
        '--sidebar-accent-foreground': '#343434',
        '--sidebar-border': '#ebebeb',
        '--sidebar-ring': '#b4b4b4',
      },
       dark: {
        '--background': '#252525',
        '--foreground': '#fbfbfb',
        '--card': '#252525',
        '--card-foreground': '#fbfbfb',
        '--popover': '#252525',
        '--popover-foreground': '#fbfbfb',
        '--primary': '#fbfbfb',
        '--primary-foreground': '#343434',
        '--secondary': '#2b2b2b',
        '--secondary-foreground': '#fbfbfb',
        '--muted': '#2b2b2b',
        '--muted-foreground': '#b4b4b4',
        '--accent': '#2b2b2b',
        '--accent-foreground': '#fbfbfb',
        '--destructive': '#b91c1c',
        '--destructive-foreground': '#ffacb0',
        '--border': '#2b2b2b',
        '--input': '#2b2b2b',
        '--ring': '#8b8b8b',
        '--font-weight-medium': '500',
        '--font-weight-normal': '400',
        '--chart-1': '#06b6d4',
        '--chart-2': '#60a5fa',
        '--chart-3': '#bef264',
        '--chart-4': '#06b6d4',
        '--chart-5': '#f97316',
        '--sidebar': '#343434',
        '--sidebar-foreground': '#fbfbfb',
        '--sidebar-primary': '#06b6d4',
        '--sidebar-primary-foreground': '#fbfbfb',
        '--sidebar-accent': '#2b2b2b',
        '--sidebar-accent-foreground': '#fbfbfb',
        '--sidebar-border': '#2b2b2b',
        '--sidebar-ring': '#8b8b8b',
      },
    },
    background: {
      primary: '#0f1720',
      secondary: '#111827',
      accent: '#0b1220',
      gradient: 'linear-gradient(180deg,#0f1720 0%,#111827 100%)',
    },
    border: {
      primary: '#374151', // slate-700
      secondary: '#4b5563', // slate-600
    },
    text: {
      primary: '#ffffff',
      secondary: '#94a3b8',
      muted: '#94a3b8',
      accent: '#60a5fa',
    },
    button: {
      default: { bg: '#374151', border: '#4b5563', active: '#4b5563' },
      leftPressed: { bg: '#22c55e', border: '#16a34a', shadow: '0 8px 24px rgba(34,197,94,0.25)' },
      rightPressed: { bg: '#7c3aed', border: '#6d28d9', shadow: '0 8px 24px rgba(124,58,237,0.25)' },
    },
    touchpad: {
      default: { gradient: 'linear-gradient(135deg,#374151 0%,#1f2937 100%)', border: '#4b5563' },
      active: { border: '#3b82f6', shadow: '0 10px 30px rgba(59,130,246,0.25)' },
      grid: '#6b7280',
      indicator: 'rgba(59,130,246,0.08)',
    },
    cursor: {
      default: { bg: 'rgba(59,130,246,0.5)', border: '#60a5fa' },
      left: { bg: '#22c55e', border: '#16a34a' },
      right: { bg: '#7c3aed', border: '#6d28d9' },
    },
    control: {
      background: 'rgba(17,24,39,0.5)',
      accent: '#3b82f6',
    },
  },
});
