import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { mainnet, type AppKitNetwork } from '@reown/appkit/networks';
import { createAppKit } from '@reown/appkit/react';
import { MASCOT_ASSETS } from './assets';

// Get your projectId from https://cloud.reown.com
export const projectId = import.meta.env.VITE_REOWN_PROJECT_ID as string;

if (!projectId) {
  console.warn('[Reown] VITE_REOWN_PROJECT_ID is not set. Wallet connection will not work.');
}

const metadata = {
  name: 'Mars Subway Runner',
  description: 'An epic 3D Mars-themed endless runner',
  url: typeof window !== 'undefined' ? window.location.origin : 'https://mars-subway-runner.vercel.app',
  icons: [MASCOT_ASSETS.RUNNING],
};

export const networks: [AppKitNetwork, ...AppKitNetwork[]] = [mainnet];

export const wagmiAdapter = new WagmiAdapter({
  networks,
  projectId,
});

createAppKit({
  adapters: [wagmiAdapter],
  networks,
  projectId,
  metadata,
  features: {
    analytics: false,
    email: false,
    socials: false,
  },
  themeMode: 'dark',
  themeVariables: {
    '--w3m-accent': '#06b6d4',       // cyan-500 to match game palette
    '--w3m-border-radius-master': '12px',
  },
});
