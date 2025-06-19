import { Route, Routes } from 'react-router-dom'
import Home from './components/home'
import Register from './components/register'
import Resolve from './components/resolve'
import Names from './components/names'
import { useWeb3Auth } from '@web3auth/modal/react'

function App() {
  const { status } = useWeb3Auth()
  /*   const authFrameRef = useRef<HTMLIFrameElement>(null)
  const { web3Auth, isConnected, isInitializing, provider, status, initError } =
    useWeb3Auth()
  const [askedSync, setAskedSync] = useState(false)
  const [gotSession, setGotSession] = useState(false)
  console.log(status)
  useEffect(() => {
    // Listen for messages from auth iframe
    window.addEventListener('message', async (event) => {
      console.log('🔔 message arrived from origin:', event.origin)
      if (event.origin !== 'http://localhost:5174') return
      console.log('🔔 session-data from sync frame:', event.data)
      try {
        const message = JSON.parse(event.data)

        if (
          message.type === 'SESSION_DATA' &&
          message.payload['wagmi.recentConnectorId']
        ) {
          console.log(message.payload)
          if (message.payload) console.log(message.payload)
          Object.entries(message.payload).forEach(([key, val]) => {
            // Only sync strings; skip undefined/null
            if (typeof val === 'string') {
              localStorage.setItem(key, val)
            }
          })

          console.log(localStorage)
          // Now we have the session data, we can initialize Web3Auth to restore the session
          setGotSession(true)
          const timer = setTimeout(async () => {
             await initWeb3AuthWithSession() 
          }, 3000)

          return () => clearTimeout(timer)
        }
      } catch (e) {
        console.error('Invalid message from auth iframe', e)
        console.error('Invalid message from auth iframe', initError)
      }
    })

    // When the iframe loads, request session data (in case user already logged in elsewhere)
    const iframe = authFrameRef.current
    if (iframe) {
      iframe.onload = () => {
        if (iframe.contentWindow) {
          iframe.contentWindow.postMessage(
            JSON.stringify({ type: 'GET_SESSION' }),
            'http://localhost:5174',
          )
          setAskedSync(true)
        }
      }
    }
  }, [authFrameRef, localStorage, initError])

  useEffect(() => {
    if (!askedSync && status == 'not_ready') return

    const timer = setTimeout(() => {
      if (status == 'ready' || status !== 'connecting') {
        if (!gotSession && !isInitializing && !isConnected) {
          console.log('wow — still no session after 500 ms')
          // window.location.href = 'http://localhost:5174'
        }
      }
    }, 2000) // adjust as needed

    return () => clearTimeout(timer)
  }, [askedSync, gotSession, isInitializing, isConnected, status])

 */
  return (
    <>
      {/*  <iframe
        ref={authFrameRef}
        src="http://localhost:5174/sync"
        style={{ display: 'none' }}
        title="auth-sync"
      /> */}

      {/* Now your UI can go here */}
      {status == 'connecting' || status == 'not_ready' ? (
        <div className="flex items-center justify-center min-h-screen">
          <div className="w-15 h-15 border-2 border-yellow-300 border-t-yellow-500 rounded-full animate-spin" />
        </div>
      ) : (
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/register/:label" element={<Register />} />
          <Route path="/resolve/:label" element={<Resolve />} />
          <Route path="/mynames" element={<Names />} />
        </Routes>
      )}
    </>
  )
}

export default App
