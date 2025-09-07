import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.fe8e2e65666644958fa6c0431fd2bc23',
  appName: 'S3 Mobile Gallery',
  webDir: 'dist',
  server: {
    url: 'https://fe8e2e65-6666-4495-8fa6-c0431fd2bc23.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#1a1a2e',
      showSpinner: true,
      spinnerColor: '#8b5cf6'
    }
  }
};

export default config;