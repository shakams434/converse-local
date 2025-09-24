import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.e24ddf4173894a6b8cc3ce614c39dec3',
  appName: 'AI LLM Assistant',
  webDir: 'dist',
  bundledWebRuntime: false,
  server: {
    url: 'https://e24ddf41-7389-4a6b-8cc3-ce614c39dec3.lovableproject.com?forceHideBadge=true',
    cleartext: true,
    androidScheme: 'https'
  },
  plugins: {
    CapacitorCookies: {
      enabled: true
    },
    FilePicker: {
      enabled: true
    }
  }
};

export default config;