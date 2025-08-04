import { CustomConnect } from './connectButton'
import { useAccount } from 'wagmi'
import { IdentificationIcon, SearchIcon } from '@heroicons/react/outline' // or any icon you like
import { useNavigate } from 'react-router-dom'
import LogInButton from './loginButton'
import { useEffect, useState } from 'react'
import { useWeb3AuthConnect } from '@web3auth/modal/react'
export const MobileNav = () => {
  const { isConnected } = useAccount()
  const navigate = useNavigate()
  const [loggedIn, setLoggedIn] = useState(!isConnected)
  const [showOnRoot, setShowOnRoot] = useState(false)
  const { connect } = useWeb3AuthConnect()

  useEffect(() => {
    if (location.pathname !== '/') {
      setLoggedIn(!isConnected)
    }
  }, [])

  useEffect(() => {
    if (loggedIn && (location.pathname !== '/' || showOnRoot)) {
      connect()
    }
  })

  return (
    <div>
      <div
        className="md:hidden
        fixed bottom-5 left-1/2 transform -translate-x-1/2
        inline-flex items-center space-x-4
        bg-neutral-800/75 backdrop-blur-sm
        px-4 py-2 rounded-full
        shadow-lg
        max-w-max
        whitespace-nowrap
        justify-center
        border-4
        border-neutral-700
      "
      >
        {/* Menu toggle */}
        <button className="p-1 rounded-full hover:bg-neutral-700">
          <SearchIcon
            className="w-9 h-9 text-gray-300"
            onClick={() => navigate(`/`)}
          />
        </button>

        {/* Optional label when connected */}
        {isConnected && (
          <IdentificationIcon
            className="w-9 h-9 text-gray-300"
            onClick={() => navigate(`/mynames`)}
          />
        )}

        {/* Your custom connect button */}

        {isConnected ? (
          <CustomConnect />
        ) : (
          <LogInButton connect={connect} setShowOnRoot={setShowOnRoot} />
        )}
      </div>
    </div>
  )
}
