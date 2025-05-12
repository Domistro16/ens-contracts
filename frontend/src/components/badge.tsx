import { namehash } from 'viem'
import { useReadContract } from 'wagmi'

const isWrappeda = [
  {
    inputs: [
      {
        internalType: 'bytes32',
        name: 'node',
        type: 'bytes32',
      },
    ],
    name: 'isWrapped',
    outputs: [
      {
        internalType: 'bool',
        name: '',
        type: 'bool',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
]

function isWrapped(name: string) {
  const node = namehash(name)
  const { data: wrapped } = useReadContract({
    abi: isWrappeda,
    functionName: 'isWrapped',
    address: '0x501CB529399486684f94c6f59F1b1617202DDE18',
    args: [node],
  })
  return wrapped

}

export function WrappedBadge({ name, tag }: { name: string, tag: string }) {
  
  const wrapped = isWrapped(name) // ✅ hook at top level
  const color = wrapped && tag == "Manager" ? 'bg-neutral-700' : wrapped && tag == "Owner" ? 'bg-blue-800' : !wrapped && tag == "Owner" || "Manager" ? 'bg-blue-800'  : 'bg-neutral-700'
  return (
    <span className={`px-2 py-1 ${color} text-gray-300 text-xs rounded-full text-center`}>
      {tag}
    </span>
  )
}
