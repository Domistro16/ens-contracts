import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React, { useEffect, useRef, useState } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.tsx'
import './index.css'
import { getDefaultConfig, RainbowKitProvider } from '@rainbow-me/rainbowkit'
import { type Web3AuthContextConfig } from '@web3auth/modal/react'
import { web3AuthOptions } from './web3auth.ts'
import Fallback from './Fallback.tsx'
import { bscTestnet } from 'wagmi/chains'
import type { ApolloClient } from '@apollo/client'

// Initialize Apollo Client

const ApolloProvider = React.lazy(() =>
  import('@apollo/client').then((mod) => ({
    default: mod.ApolloProvider,
  })),
)

const Web3AuthProvider = React.lazy(() =>
  import('@web3auth/modal/react').then((mod) => ({
    default: mod.Web3AuthProvider,
  })),
)

const WagmiProvider = React.lazy(() =>
  import('@web3auth/modal/react/wagmi').then((mod) => ({
    default: mod.WagmiProvider,
  })),
)

async function createApolloClient() {
  const { ApolloClient, HttpLink, InMemoryCache } = await import(
    '@apollo/client'
  )

  return new ApolloClient({
    link: new HttpLink({
      uri: 'https://api.studio.thegraph.com/query/112443/creator-subgraph/v0.0.1',
    }),
    cache: new InMemoryCache(),
  })
}
function BootStrap() {
  const queryClient = new QueryClient()
  const web3authContextConfig: Web3AuthContextConfig = {
    web3AuthOptions: web3AuthOptions as any,
  }
  const config = getDefaultConfig({
    appName: 'Level3Labs',
    projectId: 'YOUR_PROJECT_ID',
    chains: [bscTestnet],
  })
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    function onMessage(e: MessageEvent) {
      console.log(e.data)
      if (e.origin !== 'https://auth.level3labs.fun') return
      const msg = JSON.parse(e.data)
      if (msg.type === 'SESSION_DATA') {
        Object.entries(msg.payload).forEach(([k, v]) => {
          if (typeof v === 'string') localStorage.setItem(k, v)
        })
      }
    }
    window.addEventListener('message', onMessage)

    const iframe = iframeRef.current
    if (iframe) {
      iframe.onload = () => {
        console.log(iframe)
        iframe.contentWindow?.postMessage(
          JSON.stringify({ type: 'GET_SESSION' }),
          'https://auth.level3labs.fun',
        )
      }
    }

    return () => window.removeEventListener('message', onMessage)
  }, [])

  const [client, setClient] = useState<ApolloClient<any> | null>(null)

  useEffect(() => {
    createApolloClient().then(setClient)
  }, [])

  return (
    <>
      <iframe
        ref={iframeRef}
        src="https://auth.level3labs.fun"
        style={{ display: 'none' }}
        title="session-sync"
      />
      <React.Suspense fallback={<Fallback />}>
        <Web3AuthProvider config={web3authContextConfig}>
          <QueryClientProvider client={queryClient}>
            <WagmiProvider config={config}>
              <RainbowKitProvider>
                <BrowserRouter>
                  {client && (
                    <ApolloProvider client={client}>
                      <App />
                    </ApolloProvider>
                  )}
                </BrowserRouter>
              </RainbowKitProvider>
            </WagmiProvider>
          </QueryClientProvider>
        </Web3AuthProvider>
      </React.Suspense>
    </>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BootStrap />
  </React.StrictMode>,
)
