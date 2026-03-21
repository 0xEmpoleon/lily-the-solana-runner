import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { mainnet, type AppKitNetwork } from '@reown/appkit/networks';
import { createAppKit } from '@reown/appkit/react';
import { MASCOT_ASSETS } from './assets';

// Get your projectId from https://cloud.reown.com
// Falls back to a placeholder so AppKit always initialises (wallet won't work without a real ID).
export const projectId: string =
  (import.meta.env.VITE_REOWN_PROJECT_ID as string | undefined) || '00000000000000000000000000000000';

if (!import.meta.env.VITE_REOWN_PROJECT_ID) {
  console.warn('[Reown] VITE_REOWN_PROJECT_ID is not set. Wallet connection will not work.');
}

const origin = typeof window !== 'undefined' ? window.location.origin : 'https://lily-the-solana-runner.vercel.app';
const metadata = {
  name: 'Lily the Solana Runner',
  description: 'An epic 3D Solana-themed endless runner',
  url: origin,
  icons: [`${origin}${MASCOT_ASSETS.RUNNING}`],
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
    '--w3m-accent': '#06b6d4',
    '--w3m-border-radius-master': '12px',
  },
});
