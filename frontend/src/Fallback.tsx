import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Home from './components/home'
import Register from './components/register'
import Resolve from './components/resolve'
import Names from './components/names'
import { RainbowKitProvider } from '@rainbow-me/rainbowkit'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { bscTestnet } from 'wagmi/chains'
import { WagmiProvider } from 'wagmi'
import { MobileNav } from './components/mobilenavcopy'
import FallBackNavbar from './components/FallBackNavbar'

function FallBack() {
  const queryClient = new QueryClient()
  const config = getDefaultConfig({
    appName: 'Level3Labs',
    projectId: 'YOUR_PROJECT_ID',
    chains: [bscTestnet],
  })
  return (
    <>
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={config as any}>
          <RainbowKitProvider>
            <BrowserRouter>
              <FallBackNavbar />
              <MobileNav />
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/register/:label" element={<Register />} />
                <Route path="/resolve/:label" element={<Resolve />} />
                <Route path="/mynames" element={<Names />} />
              </Routes>
            </BrowserRouter>
          </RainbowKitProvider>
        </WagmiProvider>
      </QueryClientProvider>
    </>
  )
}

export default FallBack
