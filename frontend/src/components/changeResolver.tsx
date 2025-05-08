import { useState } from 'react'
import { namehash } from 'viem'
import { useWriteContract } from 'wagmi'
import Modal from 'react-modal'

interface ResolverProps {
  label: string
  wrapped: boolean
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>
  isOpen: boolean
}

Modal.setAppElement('#root')

const setResolverAbi = [
  {
    inputs: [
      {
        internalType: 'bytes32',
        name: 'node',
        type: 'bytes32',
      },
      {
        internalType: 'address',
        name: 'resolver',
        type: 'address',
      },
    ],
    name: 'setResolver',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
]

const ChangeResolver = ({
  label,
  wrapped,
  setIsOpen,
  isOpen,
}: ResolverProps) => {
  const {
    data: setResolverHash,
    error: setResolverError,
    isPending: setResolverPending,
    writeContractAsync: setResolverContract,
  } = useWriteContract()
  function onRequestClose(): void {
    setIsOpen(false)
  }

  const [next, setNext] = useState(0)
  const [resolver, setResolverState] = useState('')

  const setResolver = async () => {
    if (wrapped == true) {
      try {
        await setResolverContract({
          abi: setResolverAbi,
          address: '0x501CB529399486684f94c6f59F1b1617202DDE18',
          functionName: 'setResolver',
          args: [namehash(`${label}.creator`), resolver],
        })
      } catch (error) {
        console.log(error)
        console.log(setResolverError)
      }
    } else {
      try {
        await setResolverContract({
          abi: setResolverAbi,
          address: '0xC33387F371067b1Bdc48E694bf30EDB8deF7d4A0',
          functionName: 'setResolver',
          args: [namehash(`${label}.creator`), resolver],
        })
      } catch (error) {
        console.log(error)
        console.log(setResolverError)
      }
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      closeTimeoutMS={300} // animation duration (matches CSS)
      className="modal-content"
      overlayClassName="modal-overlay"
    >
      {next == 0 ? (
        <div className="rounded-xl bg-neutral-800 px-10 py-5 mt-5 border-[0.5px] border-gray-400 h-110 overflow-auto">
          <h1 className="text-3xl font-semibold text-[#FFF700] text-center">
            Change Resolver for {label}.creator
          </h1>
          <div className="flex justify-center mt-5">
            <div className="rounded-full w-30 h-30 bg-gray-600"></div>
          </div>
          <div className="mt-5 space-y-3 text-sm">
            <p className="text-gray-400 text-sm">
              Type Your new Resolver Address here
            </p>
            <input
              value={resolver}
              onChange={(e) => {
                e.preventDefault()
                setResolverState(e.target.value)
              }}
              placeholder="Resolver" 
              className="w-full mb-5 p-3 bg-neutral-700 rounded-lg focus:outline-none"
            />
          </div>

          <div className="flex space-x-5 w-full mt-5">
            <button
              className="p-3 bg-gray-300 text-black w-full rounded-lg font-semibold cursor-pointer"
              onClick={() => {
                setIsOpen(false)
              }}
            >
              Back
            </button>
            <button
              className="p-3 bg-[#FFF700] w-full rounded-lg text-black font-semibold cursor-pointer"
              onClick={() => {
                setNext((prev) => prev + 1)
              }}
            >
              Next
            </button>
          </div>
        </div>
      ) : (
        <div className="p-8 rounded-2xl bg-white dark:bg-neutral-900 shadow-xl relative w-[400px] mx-auto flex flex-col gap-6">
          <button
            onClick={onRequestClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>

          <h2 className="text-2xl font-bold text-center text-neutral-800 dark:text-white">
            Confirm Details
          </h2>

          <p className="text-center text-gray-500">
            Double check these details before confirming in your wallet.
          </p>

          <div className="flex flex-col gap-3">
            <div className="flex justify-between items-center border border-gray-200 dark:border-gray-700 rounded-lg p-3">
              <div className="text-gray-500 text-sm">Name</div>
              <div className="flex items-center gap-2 font-bold text-black dark:text-white">
                {`${label}.creator`}
                <div className="w-4 h-4 rounded-full bg-gradient-to-r from-pink-400 to-pink-600" />
              </div>
            </div>

            <div className="flex justify-between items-center border border-gray-200 dark:border-gray-700 rounded-lg p-3">
              <div className="text-gray-500 text-sm">Action</div>
              <div className="font-bold text-black dark:text-white">
                Change Resolver
              </div>
            </div>
            {!setResolverPending && setResolverHash && (
              <div className="flex justify-between items-center border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                <div className="text-gray-500 text-sm">hash</div>
                <div className="font-bold text-black dark:text-white flex-wrap break-all text-sm">
                  {setResolverHash}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={setResolver}
            className="bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition cursor-pointer"
          >
            Open Wallet
          </button>
        </div>
      )}
    </Modal>
  )
}
export default ChangeResolver
