import { Transak } from '@transak/transak-sdk'
import { useEffect, useState } from 'react'
import { useEthersSigner } from '../hooks/gasEstimation'
import { ethers } from 'ethers'
import { bytesToHex } from 'viem'

const controllerAbi = [
  {
    inputs: [
      {
        internalType: 'bytes32',
        name: 'commitment',
        type: 'bytes32',
      },
    ],
    name: 'commit',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'string',
        name: 'name',
        type: 'string',
      },
      {
        internalType: 'address',
        name: 'owner',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: 'duration',
        type: 'uint256',
      },
      {
        internalType: 'bytes32',
        name: 'secret',
        type: 'bytes32',
      },
      {
        internalType: 'address',
        name: 'resolver',
        type: 'address',
      },
      {
        internalType: 'bytes[]',
        name: 'data',
        type: 'bytes[]',
      },
      {
        internalType: 'bool',
        name: 'reverseRecord',
        type: 'bool',
      },
      {
        internalType: 'uint16',
        name: 'ownerControlledFuses',
        type: 'uint16',
      },
    ],
    name: 'register',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'string',
        name: 'name',
        type: 'string',
      },
      {
        internalType: 'uint256',
        name: 'duration',
        type: 'uint256',
      },
    ],
    name: 'rentPrice',
    outputs: [
      {
        components: [
          {
            internalType: 'uint256',
            name: 'base',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'premium',
            type: 'uint256',
          },
        ],
        internalType: 'struct IPriceOracle.Price',
        name: 'price',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'string',
        name: 'name',
        type: 'string',
      },
      {
        internalType: 'address',
        name: 'owner',
        type: 'address',
      },
      {
        internalType: 'bytes32',
        name: 'secret',
        type: 'bytes32',
      },
    ],
    name: 'makeCommitment',
    outputs: [
      {
        internalType: 'bytes32',
        name: '',
        type: 'bytes32',
      },
    ],
    stateMutability: 'pure',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'bytes32',
        name: 'commitment',
        type: 'bytes32',
      },
    ],
    name: 'commitName',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'string',
        name: 'name',
        type: 'string',
      },
      {
        internalType: 'address',
        name: 'owner',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: 'duration',
        type: 'uint256',
      },
      {
        internalType: 'bytes32',
        name: 'secret',
        type: 'bytes32',
      },
      {
        internalType: 'address',
        name: 'resolver',
        type: 'address',
      },
      {
        internalType: 'bytes[]',
        name: 'data',
        type: 'bytes[]',
      },
      {
        internalType: 'bool',
        name: 'reverseRecord',
        type: 'bool',
      },
      {
        internalType: 'uint16',
        name: 'ownerControlledFuses',
        type: 'uint16',
      },
    ],
    name: 'registerName',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
]

export function openTransak() {}

function TransakWidget({
  label,
  owner,
  duration,
  reverse,
}: {
  label: string
  owner: `0x${string}`
  duration: number
  reverse: boolean
}) {
  const signer = useEthersSigner()
  const [transakInstance, setTransakInstance] = useState<Transak | null>(null)
  const [openWidget, setOpenWidget] = useState(false)

  // Initialize Transak when the component mounts
  useEffect(() => {
    const instance = new Transak({
      apiKey: 'cf21445a-fca8-4856-a132-1e9535133de0', // Your API Key
      environment: Transak.ENVIRONMENTS.STAGING, // STAGING/PRODUCTION
      defaultCryptoCurrency: 'BNB',
      themeColor: '#FFB000',
      widgetHeight: '500px',
      widgetWidth: '500px',
      walletAddress: owner,
      defaultFiatCurrency: 'USD'
    })

    setTransakInstance(instance)

    // Cleanup on component unmount
    return () => {
      if (instance) {
        instance.close()
      }
    }
  }, [])

  // Handle widget opening/closing
  useEffect(() => {
    if (!transakInstance) return

    if (openWidget) {
      transakInstance.init()
    }

    // Setup event listeners
    const closeHandler = () => {
      if (transakInstance) {
        transakInstance.close()
        setOpenWidget(false)
      }
    }

    // This will trigger when the user closed the widget
    Transak.on(Transak.EVENTS.TRANSAK_WIDGET_CLOSE, closeHandler)

    return () => {
      // Clean up event listeners
      Transak.on(Transak.EVENTS.TRANSAK_WIDGET_CLOSE, closeHandler)
    }
  }, [openWidget, transakInstance])

  // Handle successful transaction
  useEffect(() => {
    if (!signer || !transakInstance) return

    const handleSuccessfulOrder = async () => {
      try {
        const controller = new ethers.Contract(
          '0x98e9FdF05313A49D95A44ff3563EA3ba05Ce551E',
          controllerAbi,
          signer,
        )

        // Generate secret
        const secretBytes = crypto.getRandomValues(new Uint8Array(32))
        const secret = bytesToHex(secretBytes) as `0x${string}`

        // Get rent price
        const priceResult = await controller.rentPrice(label, duration)
        const base = priceResult.base
        const premium = priceResult.premium
        const totalValue = base + premium

        // Create commitment
        const commitment = await controller.makeCommitment(label, owner, secret)
        await controller.commitName(commitment)

        console.log('Commitment submitted, waiting for minimum delay...')
        // Wait for the minimum delay (65 seconds)
        await new Promise((res) => setTimeout(res, 65_000))

        console.log('Registering name...')
        // Register with the purchased BNB
        const tx = await controller.registerName(
          label,
          owner,
          duration,
          secret,
          '0xF90F11ddD972e661170836e9E3970BBE398988D8', // Resolver address
          [], // Empty data array
          reverse,
          0, // Owner controlled fuses
          { value: totalValue },
        )

        await tx.wait()
        console.log('Registration complete!')
      } catch (error) {
        console.error('Error in registration process:', error)
      }
    }

    const successHandler = () => {
      handleSuccessfulOrder()
    }

    // Set up event listener for successful transaction
    Transak.on(Transak.EVENTS.TRANSAK_ORDER_SUCCESSFUL, successHandler)

    // Debug helper for all events
    const allEventsHandler = (data: any) => {
      console.log('Transak event:', data)
    }
    Transak.on('*', allEventsHandler)

    return () => {
      // Clean up event listeners
      Transak.on(Transak.EVENTS.TRANSAK_ORDER_SUCCESSFUL, successHandler)
      Transak.on('*', allEventsHandler)
    }
  }, [signer, transakInstance, label, owner, duration, reverse])

  return (
    <button
      className="px-5 py-3 bg-[#FFF700] text-neutral-900 font-semibold mt-5 rounded-xl cursor-pointer hover:bg-[#B3AE00] transition-all duration-300 flex items-center"
      onClick={() => setOpenWidget(true)}
      disabled={openWidget || !transakInstance}
    >
      Pay With Card
    </button>
  )
}

export default TransakWidget
