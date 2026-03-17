import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // React core isolated so every chunk shares one singleton.
          // Previously React landed inside wallet-vendor; three-vendor then
          // cross-imported it mid-init, producing:
          //   "Cannot set properties of undefined (setting 'Activity')"
          if (id.includes('node_modules/react/') ||
              id.includes('node_modules/react-dom/') ||
              id.includes('node_modules/scheduler/')) {
            return 'react-vendor';
          }

          // lit / lit-html are used by @reown/appkit web components.
          // They must be in their own leaf chunk (no outgoing imports to
          // three-vendor or wallet-vendor) so the ESM evaluation order is
          // deterministic and there is no TDZ when three-vendor loads.
          if (id.includes('node_modules/lit/') ||
              id.includes('node_modules/lit-html/') ||
              id.includes('node_modules/@lit/') ||
              id.includes('node_modules/lit-element/') ||
              // Nested lit installs inside @walletconnect/ethereum-provider
              (id.includes('node_modules/@reown/appkit-ui') && !id.includes('node_modules/@react-three'))) {
            return 'lit-vendor';
          }

          // Three.js + R3F ecosystem
          if (id.includes('node_modules/three') || id.includes('node_modules/@react-three')) {
            return 'three-vendor';
          }

          // Wallet / web3 ecosystem
          if (id.includes('node_modules/@reown') || id.includes('node_modules/@walletconnect') ||
              id.includes('node_modules/wagmi') || id.includes('node_modules/viem') ||
              id.includes('node_modules/@coinbase/wallet') || id.includes('node_modules/porto') ||
              id.includes('node_modules/@metamask') || id.includes('node_modules/metamask-sdk')) {
            return 'wallet-vendor';
          }
        },
      },
    },
  },
})
