import { ConnectButton } from '@rainbow-me/rainbowkit'
import '@rainbow-me/rainbowkit/styles.css'
import { useENSName } from '../hooks/getPrimaryName'
import { Avatar } from './useAvatar'
import { WalletModal } from './walletModal'
import { useState } from 'react'
export const CustomConnect = () => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openChainModal,
        openConnectModal,
        authenticationStatus,
        mounted,
      }) => {
        // Note: If your app doesn't use authentication, you
        // can remove all 'authenticationStatus' checks
        const ready = mounted && authenticationStatus !== 'loading'
        const { name } = useENSName({
          owner: account?.address as `0x${string}`,
        })
        const connected =
          ready &&
          account &&
          chain &&
          (!authenticationStatus || authenticationStatus === 'authenticated')
        return (
          <div
            {...(!ready && {
              'aria-hidden': true,
              style: {
                opacity: 0,
                pointerEvents: 'none',
                userSelect: 'none',
              },
            })}
          >
            {(() => {
              if (!connected) {
                return (
                  <button
                    className="bg-blue-800 p-3 py-[8px] font-bold rounded-full hover:scale-105 duration-200 cursor-pointer"
                    onClick={openConnectModal}
                    type="button"
                  >
                    Connect Wallet
                  </button>
                )
              }
              if (chain.unsupported) {
                return (
                  <button onClick={openChainModal} type="button">
                    Wrong network
                  </button>
                )
              }
              return (
                <div
                  className=" font-bold cursor-pointer hover:scale-105 duration-200"
                  style={{ display: 'flex', gap: 12 }}
                >
                  <button
                    className="md:bg-neutral-800 md:p-3 md:py-[8px] rounded-full cursor-pointer flex gap-2 items-center hover:scale-105 duration-200"
                    onClick={() => {
                      setIsOpen(true)
                    }}
                    type="button"
                  >
                    <Avatar name={name as string} className='w-8 h-8'/>
                    {name ? (
                      <div className="hidden md:flex">{name as string}</div>
                    ) : (
                      <div className="hidden md:flex">
                        {account.displayName}
                      </div>
                    )}
                  </button>

                  <WalletModal
                    isOpen={isOpen}
                    onRequestClose={() => setIsOpen(false)}
                    address={account.displayName}
                    name={name as string}
                    balance={account.displayBalance as string}
                  />
                </div>
              )
            })()}
          </div>
        )
      }}
    </ConnectButton.Custom>
  )
}
