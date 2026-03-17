import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Three.js + R3F ecosystem
          if (id.includes('three') || id.includes('@react-three')) {
            return 'three-vendor';
          }
          // Wallet / web3 ecosystem
          if (id.includes('@reown') || id.includes('@walletconnect') ||
              id.includes('wagmi') || id.includes('viem') ||
              id.includes('@coinbase/wallet') || id.includes('porto') ||
              id.includes('@metamask') || id.includes('metamask-sdk')) {
            return 'wallet-vendor';
          }
        },
      },
    },
  },
})
