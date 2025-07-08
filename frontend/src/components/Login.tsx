import { FaDiscord, FaFacebookF, FaGoogle, FaXTwitter } from 'react-icons/fa6'
import { useWeb3AuthConnect } from '@web3auth/modal/react'
import { WALLET_CONNECTORS, AUTH_CONNECTION } from '@web3auth/modal'
import { useEffect, useRef, useState } from 'react'

export default function SignIn() {
  const { connectTo, isConnected, error, connect } = useWeb3AuthConnect()
  const [email, setEmail] = useState('')
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    // Check if the user is already connected
    if (isConnected) {
      const iframe = iframeRef.current
      if (iframe) {
        iframe.onload = () => {
          iframe.contentWindow?.postMessage(
            JSON.stringify({ type: 'SET_SESSION', object: localStorage }),
            'https://auth.level3labs.fun',
          )
        }
      }
    }
  }, [isConnected])
  const loginWithGoogle = () => {
    connectTo(WALLET_CONNECTORS.AUTH, {
      authConnection: AUTH_CONNECTION.GOOGLE,
    })
  }
  const loginWithEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    await connectTo(WALLET_CONNECTORS.AUTH, {
      authConnection: AUTH_CONNECTION.EMAIL_PASSWORDLESS, // :contentReference[oaicite:7]{index=7}
      authConnectionId: 'level3-test-demo',
      extraLoginOptions: { login_hint: email.trim() }, // :contentReference[oaicite:8]{index=8}
    })
  }
  const loginWithTwitter = () => {
    connectTo(WALLET_CONNECTORS.AUTH, {
      authConnection: AUTH_CONNECTION.TWITTER,
    })
  }
  const loginWithDiscord = () => {
    connectTo(WALLET_CONNECTORS.AUTH, {
      authConnection: AUTH_CONNECTION.DISCORD,
    })
  }
  const loginWithFacebook = () => {}

  const socialButtons = [
    {
      icon: FaXTwitter,
      action: loginWithTwitter,
      label: 'Twitter',
    },
    { icon: FaDiscord, action: loginWithDiscord, label: 'Discord' },
    { icon: FaGoogle, action: loginWithGoogle, label: 'Google' },
    {
      icon: FaFacebookF,
      action: loginWithFacebook,
      label: 'Facebook',
    },
  ]

  console.log(error)
  console.log(localStorage)
  return (
    <div>
      <iframe
        ref={iframeRef}
        src="https://auth.level3labs.fun/"
        style={{ display: 'none' }}
        title="session-sync"
      />
      <div
        className={`bg-black/70 fixed inset-0 ${
          isConnected ? 'hidden' : ''
        } flex items-center  justify-center font-sans z-50`}
      >
        {/* Modal container */}
        <div className="w-11/12 max-w-6xl h-4/5 bg-stone-900 rounded-2xl shadow-lg overflow-hidden flex mx-auto">
          {/* Left Column */}
          <div className="w-1/2 border-r border-white/10 p-10 flex flex-col">
            <h1 className="text-white text-4xl mb-6">Sign in</h1>
            <label htmlFor="email" className="text-light mb-2">
              Email *
            </label>
            <form onSubmit={loginWithEmail}>
              <input
                type="email"
                id="email"
                onChange={(e) => setEmail(e.target.value)}
                placeholder="mariagarcia@gmail.com"
                className="w-full p-3 bg-input border border-input rounded-lg text-white mb-6 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <button
                type="submit"
                className="w-full p-4 border border-input rounded-full text-white mb-6 hover:bg-white/10 transition cursor-pointer"
              >
                Continue with my email
              </button>
            </form>

            <div className="text-light mb-6 flex items-center space-x-2">
              <div className="border-[0.5px] border-white/50 flex-1"></div>{' '}
              <p>Or sign in with one of the following methods</p>
            </div>

            <div className="flex space-x-4 mb-6">
              {socialButtons.map(({ icon: Icon, action, label }) => (
                <button
                  key={label as any}
                  className="p-3 bg-stone-700 text-2xl rounded-lg text-white hover:bg-white/10 transition border-white border-1 hover:cursor-pointer"
                  onClick={action}
                >
                  <Icon />
                </button>
              ))}
            </div>

            <div className="mt-auto text-light text-sm space-y-2">
              <p>
                When you log in for the first time, a wallet will be created
                along with your Level3 account, both associated with your login
                method.
              </p>
            </div>
          </div>

          {/* Right Column */}
          <div className="w-1/2 p-10 flex flex-col items-center justify-center text-center text-white">
            {/*    <img src="logo.png" alt="Fitchin Logo" className="w-20 mb-4" /> */}
            <h1 className="text-3xl font-bold mb-2">Welcome to LEVEL3</h1>
            <span className="inline-block bg-white/10 rounded-full px-4 py-1 text-sm mb-4">
              Suggested
            </span>
            <h2 className="text-xl font-semibold mb-2">Connect your wallet</h2>
            <p className="text-light mb-6">
              If you already have your own wallet, you can connect it to log in.
            </p>
            <button
              className="bg-blue-800 p-3 py-[8px] font-bold rounded-full hover:scale-105 duration-200 cursor-pointer"
              onClick={connect}
              type="button"
            >
              Connect Wallet
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
