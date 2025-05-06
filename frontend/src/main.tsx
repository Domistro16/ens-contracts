import { Buffer } from 'buffer'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import ReactDOM from 'react-dom/client'
import { WagmiProvider } from 'wagmi'
import { BrowserRouter } from 'react-router-dom'
import '@rainbow-me/rainbowkit/styles.css';
import {
  getDefaultConfig,
} from '@rainbow-me/rainbowkit';

import App from './App.tsx'

import './index.css'
import { RainbowKitProvider } from '@rainbow-me/rainbowkit'
import { bscTestnet } from 'viem/chains'

globalThis.Buffer = Buffer

const config = getDefaultConfig({
  appName: 'My RainbowKit App',
  projectId: 'YOUR_PROJECT_ID',
  chains: [bscTestnet],
  ssr: true, // If your dApp uses server side rendering (SSR)
});


const queryClient = new QueryClient()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <WagmiProvider config={config as any}>
      <QueryClientProvider client={queryClient}>
      <RainbowKitProvider >
        <BrowserRouter>
        <App />
        </BrowserRouter>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </React.StrictMode>,
)
