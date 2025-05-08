import { useReadContract } from 'wagmi'

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
    address: '0x078E09a9584c3Ec7DF706db42685D4eedf456FC9',
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
    address: '0xF90F11ddD972e661170836e9E3970BBE398988D8',
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
