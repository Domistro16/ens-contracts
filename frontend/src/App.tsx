import { Route, Routes } from 'react-router-dom'
import Home from './components/home'
import Register from './components/register'
import Resolve from './components/resolve'
import Names from './components/names'
import { useWeb3Auth } from '@web3auth/modal/react'
import { useEffect } from 'react'
import Nav from './components/nav'
import { MobileNav } from './components/mobilenav'

function App() {
  const { status } = useWeb3Auth()
  const { isConnected } = useWeb3Auth()

  useEffect(() => {
    console.log('Web3Auth status:', status)
    console.log('isConnected:', isConnected)
  }, [status, isConnected])
  useEffect(() => {
    const AUTH_ORIGIN = 'https://auth.level3labs.fun'

    // Create or reuse iframe
    let iframe = document.getElementById(
      'auth-sync-iframe',
    ) as HTMLIFrameElement
    if (!iframe) {
      iframe = document.createElement('iframe')
      iframe.style.display = 'none'
      iframe.id = 'auth-sync-iframe'
      iframe.src = AUTH_ORIGIN
      document.body.appendChild(iframe)
    }

    // Sync function
    const syncLocalStorage = () => {
      if (iframe.contentWindow) {
        iframe.contentWindow.postMessage(
          JSON.stringify({
            type: 'SET_SESSION',
            object: Object.fromEntries(Object.entries(localStorage)),
          }),
          AUTH_ORIGIN,
        )
      }
    }

    // When iframe loads
    iframe.onload = () => {
      if (isConnected) {
        syncLocalStorage()
      }
    }

    // Re-sync every 10 seconds
    const interval = setInterval(() => {
      if (isConnected) {
        syncLocalStorage()
      }
    }, 10000)

    return () => clearInterval(interval)
  }, [isConnected])

  return (
    <>
      <Nav />
      <MobileNav />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/register/:label" element={<Register />} />
        <Route path="/resolve/:label" element={<Resolve />} />
        <Route path="/mynames" element={<Names />} />
      </Routes>
    </>
  )
}

export default App
