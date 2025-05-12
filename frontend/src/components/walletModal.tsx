import ReactModal from 'react-modal'
import { XIcon, DuplicateIcon, LogoutIcon } from '@heroicons/react/outline'
import { useNavigate } from 'react-router-dom'
import { Avatar } from './useAvatar'
import { useAccount } from 'wagmi'
import { useDisconnect } from 'wagmi'

ReactModal.setAppElement('#root') // accessibility

interface WalletModalProps {
  isOpen: boolean
  onRequestClose: () => void
  address: string
  name: string
  balance: string
}
export function WalletModal({
  isOpen,
  onRequestClose,
  address,
  name,
  balance,
}: WalletModalProps) {
  const short = (addr: string) => addr.slice(0, 4) + '…' + addr.slice(-4)
  const navigate = useNavigate()
  const { address: fullAddress } = useAccount()
  const { disconnect } = useDisconnect()

  return (
    <ReactModal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      overlayClassName="
    fixed inset-0
    bg-black/50
    flex items-center justify-center
    z-50
  "
      className={`
    relative
    w-full max-w-115
    bg-white rounded-2xl p-6 mx-4
    outline-none shadow-xl
    transform transition-transform duration-300 ease-out
   ${isOpen ? 'translate-y-0' : 'translate-y-[100vh]'}
  `}
    >
      {/* Close */}
      <button
        onClick={onRequestClose}
        className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 cursor-pointer"
      >
        <XIcon className="h-6 w-6" />
      </button>

      {/* Avatar */}
      <div className="flex justify-center">
        <Avatar name={name == '' ? `${fullAddress || ''}` : name as string} className='w-15 h-15' />
      </div>

      {/* Address */}
      {name == '' ? (
        <h3 className="mt-4 text-center text-xl font-bold text-gray-900">
          {short(address)}
        </h3>
      ) : (
        <h3 className="mt-4 text-center text-xl font-bold text-gray-900">
          {name}
        </h3>
      )}

      {/* Balance */}
      <p className="mt-1 text-center text-sm font-semibold text-gray-500">
        {balance}
      </p>

      {/* Buttons */}
      <div className="mt-6 flex justify-center gap-4 mx-auto">
        <button
          onClick={() => navigator.clipboard.writeText(fullAddress as string)}
          className="flex w-full flex-col items-center justify-center rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 cursor-pointer hover:scale-105 duration-200"
        >
          <DuplicateIcon className="h-5 w-5 text-gray-500" />
          <div>Copy Address</div>
        </button>
        {name != '' ? (
          <button
            onClick={() =>
              navigate(`/resolve/${name.replace(/\.creator$/, '')}`)
            }
            className="flex w-full flex-col items-center justify-center rounded-lg bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200 cursor-pointer hover:scale-105 duration-200"
          >
            <DuplicateIcon className=" h-5 w-5 text-gray-500" />
            <div>View Profile</div>
          </button>
        ) : (
          ''
        )}
        <button
          onClick={() => {
            disconnect()
          }}
          className="flex w-full flex-col items-center justify-center rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 cursor-pointer hover:scale-105 duration-200"
        >
          <LogoutIcon className=" h-5 w-5 text-gray-500" />
          <div>Disconnect</div>
        </button>
      </div>
    </ReactModal>
  )
}
