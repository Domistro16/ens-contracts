import { useReadContract } from 'wagmi'
import { constants } from '../constant'

interface UseENSNameProps {
  owner: `0x${string}`
}

const nodeAbi = [
  {
    inputs: [
      {
        internalType: 'address',
        name: 'addr',
        type: 'address',
      },
    ],
    name: 'node',
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
]
const nameAbi = [
  {
    inputs: [
      {
        internalType: 'bytes32',
        name: 'node',
        type: 'bytes32',
      },
    ],
    name: 'name',
    outputs: [
      {
        internalType: 'string',
        name: '',
        type: 'string',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
]

export function useENSName({ owner }: UseENSNameProps) {
  // 1️⃣ Fetch owner address, explicitly on our client
  // 2️⃣ ReverseRegistrar.node()
  const {
    data: node,
    isPending: nodeLoading,
    error: nodeError,
  } = useReadContract({
    address: constants.ReverseRegistrar,
    abi: nodeAbi as any,
    functionName: 'node',
    args: owner ? [owner] : undefined,
  })

  // 3️⃣ PublicResolver.name()
  const {
    data: resolvedName,
    isPending: nameLoading,
    error: nameError,
  } = useReadContract({
    address: constants.PublicResolver,
    abi: nameAbi as any,
    functionName: 'name',
    args: node ? [node] : undefined,
  })

  return {
    address: owner,
    name: resolvedName,
    loading: nodeLoading || nameLoading,
    error: nodeError || nameError,
  }
}
