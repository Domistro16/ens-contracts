import { FaDiscord, FaFacebookF, FaGoogle, FaXTwitter } from 'react-icons/fa6'
import { useWeb3AuthConnect } from '@web3auth/modal/react'
import { WALLET_CONNECTORS, AUTH_CONNECTION } from '@web3auth/modal'
import React, { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'

export default function SignIn({
  loggedIn,
  setLoggedIn,
}: {
  loggedIn: boolean
  setLoggedIn: React.Dispatch<React.SetStateAction<boolean>>
}) {
  const { connectTo, isConnected, error, connect } = useWeb3AuthConnect()
  const [email, setEmail] = useState('')
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [available, setAvailable] = useState(false)
  const modalRef = useRef<HTMLDivElement>(null)
  const location = useLocation()

  const handleClickOutside = (event: MouseEvent) => {
    console.log('b')
    if (
      modalRef.current &&
      !modalRef.current.contains(event.target as Node) &&
      location.pathname == '/'
    ) {
      console.log('b')
      setAvailable(true) // Close modal if click is outside modal box
      setLoggedIn(!loggedIn)
    }
  }

  useEffect(() => {
    if (!available || loggedIn) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [available, loggedIn])

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
      setLoggedIn(!loggedIn)
      setAvailable(true)
    }
  }, [isConnected])
  const loginWithGoogle = () => {
    connectTo(WALLET_CONNECTORS.AUTH, {
      authConnection: AUTH_CONNECTION.GOOGLE,
      authConnectionId: 'level3labs',
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
          isConnected || available || !loggedIn ? 'hidden' : ''
        } flex items-center  justify-center z-50`}
      >
        {/* Modal container */}
        <div
          ref={modalRef}
          className="w-11/12 max-w-6xl h-[74%] md:h-[90%] opacity-85 bg-[url('/bg.png')] bg-black rounded-2xl shadow-lg overflow-auto md:overflow-hidden flex flex-col md:flex-row mx-auto pb-20"
        >
          {/* Left Column */}
          <div className="w-full md:w-1/2 border-b md:border-b-0 md:border-r border-white/10 p-6 md:p-10 flex flex-col">
            <h1 className="text-white text-3xl md:text-4xl mb-6">Sign in</h1>

            <label htmlFor="email" className="text-light mb-2">
              Email *
            </label>

            <form onSubmit={loginWithEmail}>
              <input
                type="email"
                id="email"
                onChange={(e) => setEmail(e.target.value)}
                placeholder="mariagarcia@gmail.com"
                className="w-full p-3 bg-transparent border border-input rounded-lg text-white mb-6 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <button
                type="submit"
                className="w-full p-4 border border-input rounded-full text-white mb-6 hover:bg-white/10 transition cursor-pointer"
              >
                Continue with my email
              </button>
            </form>

            <div className="text-light mb-6 flex items-center space-x-2">
              <div className="border-[0.5px] border-white/50 flex-1"></div>
              <p className="text-sm">Or sign in with</p>
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
                along with your Level3 account.
              </p>
            </div>
          </div>

          {/* Right Column */}
          <div className="w-full md:w-1/2 p-6 md:p-10 flex flex-col hidden md:block items-center justify-center text-center text-white mt-20">
            <h1 className="text-2xl md:text-3xl font-bold mb-5">
              Welcome to LEVEL3
            </h1>
            <span className="inline-block bg-white/10 rounded-full px-4 py-1 text-sm mb-4">
              Suggested
            </span>
            <h2 className="text-lg md:text-xl font-semibold mb-2">
              Connect your wallet
            </h2>
            <p className="text-light mb-6 text-sm md:text-base">
              If you already have your own wallet, you can connect it to log in.
            </p>
            <button
              className="bg-blue-800 px-6 py-2 font-bold rounded-full hover:scale-105 duration-200 cursor-pointer"
              onClick={connect}
              type="button"
            >
              Connect Wallet
            </button>
          </div>
          <div className="w-full md:w-1/2 p-6 md:p-10 flex md:hidden flex-col items-center justify-center text-center text-white">
            <button
              className="bg-blue-800 px-6 py-2 font-bold rounded-full hover:scale-105 duration-200 cursor-pointer"
              onClick={connect}
              type="button"
            >
              Connect Wallet
            </button>
            <span className="inline-block bg-white/10 rounded-full px-4 py-1 text-sm mb-4">
              Suggested
            </span>
            <h2 className="text-lg md:text-xl font-semibold mb-2">
              Connect your wallet
            </h2>
            <p className="text-light mb-6 text-sm md:text-base">
              If you already have your own wallet, you can connect it to log in.
            </p>
            <h1 className="text-2xl md:text-3xl font-bold mb-5">
              Welcome to LEVEL3
            </h1>
          </div>
        </div>
      </div>
    </div>
  )
}
