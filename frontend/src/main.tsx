import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React, { useEffect, useRef, useState } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import '@rainbow-me/rainbowkit/styles.css'
import App from './App.tsx'
import './index.css'
import { RainbowKitProvider } from '@rainbow-me/rainbowkit'
import {
  ApolloClient,
  InMemoryCache,
  ApolloProvider,
  HttpLink,
} from '@apollo/client'
import {
  Web3AuthProvider,
  type Web3AuthContextConfig,
} from '@web3auth/modal/react'
import { WagmiProvider } from '@web3auth/modal/react/wagmi'
import { web3AuthOptions } from '../web3auth.ts'

export const client = new ApolloClient({
  link: new HttpLink({
    uri: 'https://api.studio.thegraph.com/query/110610/creator/v2',
  }),
  cache: new InMemoryCache(),
})

function BootStrap() {
  const queryClient = new QueryClient()
  const web3authContextConfig: Web3AuthContextConfig = {
    web3AuthOptions: web3AuthOptions,
  }
  const [synced, setSynced] = useState(false)
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
        setSynced(true) // <— now we know storage is ready
      }
    }
    window.addEventListener('message', onMessage)

    const iframe = iframeRef.current
    if (iframe) {
      iframe.onload = () => {
        iframe.contentWindow?.postMessage(
          JSON.stringify({ type: 'GET_SESSION' }),
          'https://auth.level3labs.fun',
        )
      }
    }

    return () => window.removeEventListener('message', onMessage)
  }, [])

  if (!synced) {
    return (
      <iframe
        ref={iframeRef}
        src="https://auth.level3labs.fun/"
        style={{ display: 'none' }}
        title="session-sync"
      />
    )
  }
  return (
    <Web3AuthProvider config={web3authContextConfig}>
      <QueryClientProvider client={queryClient}>
        <WagmiProvider>
          <RainbowKitProvider>
            <BrowserRouter>
              <ApolloProvider client={client}>
                <App />
              </ApolloProvider>
            </BrowserRouter>
          </RainbowKitProvider>
        </WagmiProvider>
      </QueryClientProvider>
    </Web3AuthProvider>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BootStrap />
  </React.StrictMode>,
)
