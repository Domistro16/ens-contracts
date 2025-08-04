import { IProvider } from '@web3auth/modal'
import { useWeb3Auth } from '@web3auth/modal/react'

export default function LogInButton({
  connect,
  setShowOnRoot,
}: {
  connect: () => Promise<IProvider | null>
  setShowOnRoot?: React.Dispatch<React.SetStateAction<boolean>>
}) {
  const { status } = useWeb3Auth()
  if (status === 'connecting' || status === 'not_ready') {
    return (
      <button
        className="bg-blue-800 p-8 py-[8px] font-bold rounded-full hover:scale-105 duration-200 cursor-pointer"
        type="button"
      >
        <div className="w-6 h-6 border-4 border-yellow-300 border-t-yellow-500 rounded-full animate-spin" />
      </button>
    )
  }
  return (
    <button
      className="bg-blue-800 p-8 py-[8px] font-bold rounded-full hover:scale-105 duration-200 cursor-pointer"
      type="button"
      onClick={
        () => {
          connect();
          if (location.pathname !== '/') {
            setShowOnRoot && setShowOnRoot(true)
          }
        } /* connect() */
      } // connect() should be defined in the parent component
    >
      Login
    </button>
  )
}
