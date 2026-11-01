import type { CapacitorConfig } from '@capacitor/cli'

/**
 * Native shell for the gym portal. The console is a server-rendered Next.js app, so the WebView
 * loads the deployed origin instead of a static bundle - set CAPACITOR_SERVER_URL for staging and
 * point it at production for store builds.
 */
const config: CapacitorConfig = {
  appId: 'com.hamowj.gym',
  appName: 'HamOwj',
  webDir: 'public',
  server: {
    url: process.env.CAPACITOR_SERVER_URL ?? 'https://app.hamowj.com',
    cleartext: false,
  },
  android: {
    allowMixedContent: false,
  },
  ios: {
    contentInset: 'always',
  },
}

export default config
