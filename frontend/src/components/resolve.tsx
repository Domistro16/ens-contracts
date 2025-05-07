import { useEffect, useState, useMemo } from 'react'
import Nav from './nav'
import { useParams } from 'react-router-dom'
import { keccak256, namehash } from 'viem'
import { useReadContract } from 'wagmi'
import { useTextRecords } from '../hooks/getTextRecords'
import { useENSName } from '../hooks/getPrimaryName'
import { useENSRegistrationTime } from '../hooks/getRegistration'

const ensOwner = [
  {
    inputs: [
      {
        internalType: 'bytes32',
        name: 'node',
        type: 'bytes32',
      },
    ],
    name: 'owner',
    outputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
]
const ownerOf = [
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'tokenId',
        type: 'uint256',
      },
    ],
    name: 'ownerOf',
    outputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
]
const expiresAbi = [
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'id',
        type: 'uint256',
      },
    ],
    name: 'nameExpires',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
]
const getData = [
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'id',
        type: 'uint256',
      },
    ],
    name: 'getData',
    outputs: [
      {
        internalType: 'address',
        name: 'owner',
        type: 'address',
      },
      {
        internalType: 'uint32',
        name: 'fuses',
        type: 'uint32',
      },
      {
        internalType: 'uint64',
        name: 'expiry',
        type: 'uint64',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
]
const isWrapped = [
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
const addr = [
  {
    inputs: [
      {
        internalType: 'bytes32',
        name: 'node',
        type: 'bytes32',
      },
    ],
    name: 'addr',
    outputs: [
      {
        internalType: 'address payable',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
]

function shortenAddress(address: string): string {
  return `${address.slice(0, 4)}...${address.slice(-5).toUpperCase()}`
}

const Resolve = () => {
  const { label } = useParams<string>()
  const [expiry, setExpiry] = useState('')
  const [expiryTime, setExpiryTime] = useState('')
  const [tab, setTab] = useState('profile')
  const accountKeys = [
    'com.twitter',
    'com.reddit',
    'com.github',
    'com.discord',
    'email',
    'com.youtube',
    'org.telegram',
    'com.snapchat',
    'com.tiktok',
  ]
  const otherKeys = ['phone', 'url', 'avatar']
  const textKeys = [
    'com.twitter',
    'com.reddit',
    'com.github',
    'com.discord',
    'email',
    'phone',
    'url',
    'avatar',
    'description',
    'com.youtube',
    'org.telegram',
    'com.snapchat',
    'com.tiktok',
  ]
  const date  = useENSRegistrationTime(label as string)
  console.log(date)

  const { records: others } = useTextRecords({
    resolverAddress: '0xF90F11ddD972e661170836e9E3970BBE398988D8',
    name: `${label}.creator`,
    keys: otherKeys,
  })
  const { records: accounts } = useTextRecords({
    resolverAddress: '0xF90F11ddD972e661170836e9E3970BBE398988D8',
    name: `${label}.creator`,
    keys: accountKeys,
  })
  const { records: texts, isLoading: textsLoading } = useTextRecords({
    resolverAddress: '0xF90F11ddD972e661170836e9E3970BBE398988D8',
    name: `${label}.creator`,
    keys: textKeys,
  })
  const node = namehash(`${label}.creator`)
  const id = keccak256(label as any)
  const {
    data: address,
    isPending,
    error: addressError,
  } = useReadContract({
    abi: addr,
    functionName: 'addr',
    address: '0xF90F11ddD972e661170836e9E3970BBE398988D8',
    args: [node],
  })
  const {
    data: wrapped,
    isPending: wrappedLoading,
    error: wrappedError,
  } = useReadContract({
    abi: isWrapped,
    functionName: 'isWrapped',
    address: '0x501CB529399486684f94c6f59F1b1617202DDE18',
    args: [node],
  })
  console.log(wrapped)
  const {
    data,
    isPending: wLoading,
    error: wError,
  } = useReadContract({
    abi: getData,
    functionName: 'getData',
    address: '0x501CB529399486684f94c6f59F1b1617202DDE18',
    args: [node],
  })
  const {
    data: expires,
    isPending: expiresLoading,
    error: eError,
  } = useReadContract({
    abi: expiresAbi,
    functionName: 'nameExpires',
    address: '0xb4c95f28f762e7b42dcd6e108bb8c7fcf90cb413',
    args: [id],
  })
  const {
    data: manager,
    isPending: managerLoading,
    error: mError,
  } = useReadContract({
    abi: ownerOf,
    functionName: 'ownerOf',
    address: '0xb4c95f28f762e7b42dcd6e108bb8c7fcf90cb413',
    args: [id],
  })

  const {
    data: owner,
    isPending: ownerLoading,
    error: oError,
  } = useReadContract({
    abi: ensOwner,
    functionName: 'owner',
    address: '0xC33387F371067b1Bdc48E694bf30EDB8deF7d4A0',
    args: [node],
  })

  useEffect(() => {
    console.log(expires)
    if (expires) {
      const tsSeconds = Number(expires)
      const date = new Date(tsSeconds * 1000)
      setExpiry(
        date.toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        }),
      )
      setExpiryTime(
        date.toLocaleDateString('en-US', {
          hour: 'numeric',
          minute: 'numeric',
          second: 'numeric',
        }),
      )
    }
  }, [expires])

  const wrappedOwner = useMemo(() => {
    const wrappedData = data as [string, string, bigint] | undefined
    if (wrappedData) {
      const [owner] = wrappedData || []
      return owner as string
    }
    return undefined // optional for clarity
  }, [data])

  const { name: wrappedOwnerName } = useENSName({
    owner: wrappedOwner as `0x${string}`,
  })

  const woname = useMemo(() => {
    if (wrappedOwnerName != undefined) {
      return wrappedOwnerName as string
    } else {
      return wrappedOwner as string
    }
  }, [wrappedOwnerName, wrappedOwner])
  const { name: ownerName } = useENSName({
    owner: owner as `0x${string}`,
  })
  const oname = useMemo(() => {
    if (ownerName != undefined ) {
      return ownerName as string
    } else {
      return owner as string
    }
  }, [ownerName, owner])
  const { name: managerName } = useENSName({
    owner: manager as `0x${string}`,
  })
  const manname = useMemo(() => {
    if (managerName != undefined ) {
      return managerName as string
    } else {
      return manager as string
    }
  }, [managerName, manager])

  return (
    <div>
      <Nav />
      <div className="flex flex-col mx-auto p-5 md:px-30 lg:px-60 mt-5">
        <div className="">
          <h2 className="font-bold text-2xl text-white">
            {label as string}.creator
          </h2>

          {/* Tabs */}
          <div className="flex space-x-6 text-gray-400 text-xl mt-4 pb-2">
            <button
              className={`${
                tab == 'profile' ? 'text-blue-500' : ''
              } font-semibold`}
              onClick={() => setTab('profile')}
            >
              Profile
            </button>
            <button
              className={`${
                tab == 'records' ? 'text-blue-500' : ''
              } font-semibold`}
              onClick={() => setTab('records')}
            >
              Records
            </button>
            <button
              className={`${
                tab == 'ownership' ? 'text-blue-500' : ''
              } font-semibold`}
              onClick={() => setTab('ownership')}
            >
              Ownership
            </button>
            <button
              className={`${
                tab == 'subnames' ? 'text-blue-500' : ''
              } font-semibold`}
              onClick={() => setTab('more')}
            >
              Subnames
            </button>
            <button
              className={`${
                tab == 'more' ? 'text-blue-500' : ''
              } font-semibold`}
              onClick={() => setTab('more')}
            >
              More
            </button>
          </div>

          {/* Profile Card */}
          {tab == 'profile' ? (
            <div>
              <div className="rounded-xl bg-neutral-800 px-10 py-5 mt-5 border-[0.5px] border-gray-400 relative flex items-center">
                <div className="w-24 h-24 bg-white rounded-full border-4 border-black mr-2" />
                <div className="ml-5 flex items-center w-[80%]">
                  <div className="text-2xl font-bold grow-1">
                    {label}.creator
                    {texts
                      .filter((k) => k.key == 'description')
                      .map((item) => (
                        <div className="text-sm font-normal mt-2 max-w-90 break-all">
                          {item.value}
                        </div>
                      ))}
                  </div>
                  <button className="bg-blue-800 px-4 py-2 rounded-lg mt-2 text-sm">
                    ▶️ Extend
                  </button>
                </div>
              </div>

              {/* Metadata Card */}
              <div className="bg-neutral-800 rounded-b-xl p-6 mt-6 space-y-3">
                {accounts.length > 0 ? (
                  <div>
                    <div className="font-semibold text-gray-300 ml-1">
                      Accounts
                    </div>
                    <div className="flex flex-wrap gap-2 ">
                      {accounts.map((item, index) => (
                        <div
                          key={item.key}
                          className="bg-gray-900 inline-block px-3 py-1 mt-2 text-sm rounded-full"
                        >
                          <span className="text-gray-400 mr-1 ">
                            {item.key}
                          </span>{' '}
                          {item.value}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  ''
                )}
                {others.length > 0 ? (
                  <div>
                    <div className="font-semibold text-gray-300 ml-1">
                      Other Records
                    </div>
                    <div className="flex flex-wrap gap-2 ">
                      {others.map((item, index) => (
                        <div
                          key={item.key}
                          className="bg-gray-900 inline-block px-3 py-1 mt-2 text-sm rounded-full"
                        >
                          <span className="text-gray-400 mr-1 ">
                            {item.key}
                          </span>{' '}
                          {item.value}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  ''
                )}

                <div>
                  <div className="font-semibold text-gray-300 ml-1">
                    Addresses:
                  </div>
                  <div className="bg-gray-900 inline-block px-3 py-1 mt-2 rounded-full">
                    <span className="text-gray-400 mr-1 ">bsc</span>{' '}
                    {!isPending ? shortenAddress(address as string) : ''}
                  </div>
                </div>
                <div className="text-sm text-blue-500 cursor-pointer font-bold ml-1">
                  Ownership → View
                </div>
                {wrapped == true ? (
                  <div className="flex flex-wrap gap-2 text-sm mt-2">
                    <div className="bg-gray-900 px-3 py-1 rounded-full">
                      <span className="text-gray-400 mr-1">owner </span>{' '}
                      {!wLoading ? shortenAddress(`${wrappedOwner}`) : ''}
                    </div>
                    <div className="bg-gray-900 px-3 py-1 rounded-full">
                      <span className="text-gray-400 mr-1">expiry </span>{' '}
                      {expiry}
                    </div>
                    <div className="bg-gray-900 px-3 py-1 rounded-full">
                      <span className="text-gray-400 mr-1">parent</span> creator
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2 text-sm mt-2">
                    <div className="bg-gray-900 px-3 py-1 rounded-full">
                      <span className="text-gray-400 mr-1">manager </span>{' '}
                      {!managerLoading ? shortenAddress(manager as string) : ''}
                    </div>
                    <div className="bg-gray-900 px-3 py-1 rounded-full">
                      <span className="text-gray-400 mr-1">owner </span>{' '}
                      {!ownerLoading ? shortenAddress(owner as string) : ''}
                    </div>
                    <div className="bg-gray-900 px-3 py-1 rounded-full">
                      <span className="text-gray-400 mr-1">expiry </span>{' '}
                      {expiry}
                    </div>
                    <div className="bg-gray-900 px-3 py-1 rounded-full">
                      <span className="text-gray-400 mr-1">parent</span> creator
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : tab == 'records' ? (
            <div className="rounded-xl bg-neutral-800 p-3 mt-5 border-[0.5px] border-gray-400 ">
              {texts.length > 0 ? (
                <div>
                  <div className="font-semibold text-gray-300 ml-2 text-sm">
                    Text{' '}
                    <span className="font-normal text-sm ml-3">
                      {' '}
                      {texts.length} Records{' '}
                    </span>
                  </div>
                  <div className="flex flex-col gap-2">
                    {texts.map((item, index) => (
                      <div
                        key={item.key}
                        className="bg-gray-900 px-3 py-1 mt-2 text-sm rounded-full flex"
                      >
                        <div className="text-gray-400 mr-1 w-30">
                          {item.key}
                        </div>{' '}
                        <div> {item.value} </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="font-semibold text-gray-300 ml-2 text-sm">
                  No Text Records
                </div>
              )}

              {address != '' ? (
                <div className="mt-5">
                  <div className="font-semibold text-gray-300 ml-2 text-sm">
                    Address{' '}
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="bg-gray-900 px-3 py-1 mt-2 text-sm rounded-full flex">
                      <div className="text-gray-400 mr-1 w-30">bsc</div>
                      <div>{address as string}</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="font-semibold text-gray-300 ml-2 text-sm">
                  No Text Records
                </div>
              )}
            </div>
          ) : tab == 'ownership' ? (
            <div className="rounded-xl bg-neutral-800 mt-5 border-[0.5px] border-neutral-500 p-4 pb-20">
              <div className="px-2 py-4 text-3xl font-bold text-white border-b-1 border-neutral-500">
                Roles
              </div>
              {wrapped == true ? (
                <div>
                  <div className="px-2 py-4 text-xl font-bold text-white border-b-1 border-neutral-500 flex items-center">
                    <div>Owner: </div>
                    <div className="text-sm font-semibold ml-5 flex items-center">
                      {woname as string}
                      {woname.startsWith('0x') ? (
                        ''
                      ) : (
                        <div className="text-[10px] truncate max-w-30 ml-3 text-gray-400 mt-[1.5px]">
                          {`   (${shortenAddress(wrappedOwner as string)})`}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="px-2 py-4 text-xl font-bold text-white border-b-1 border-neutral-500 flex items-center">
                    <div>BSC Record:</div>
                    <div className="text-sm font-semibold ml-5">
                      {address as string}
                    </div>
                  </div>
                </div>
              ) : wrapped == false ? (
                <div>
                  <div className="px-2 py-4 text-3xl font-bold text-white border-b-1 border-neutral-500">
                    <div>Owner: </div>
                    <div className="text-sm font-semibold ml-5">
                      {oname as string}
                      {oname.startsWith('0x') ? (
                        ''
                      ) : (
                        <div className="text-[10px] truncate max-w-30 ml-3 text-gray-400 mt-[1.5px]">
                          {`   (${shortenAddress(owner as string)})`}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="px-2 py-4 text-3xl font-bold text-white border-b-1 border-neutral-500">
                    <div>Manager: </div>
                    <div className="text-sm font-semibold ml-5 flex">
                      {manname as string}
                      {manname.startsWith('0x') ? (
                        ''
                      ) : (
                        <div className="text-[10px] truncate max-w-30 ml-3 text-gray-400 mt-[1.5px]">
                          {`   (${shortenAddress(manager as string)})`}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                ''
              )}
            </div>
          ) : (
            ''
          )}
        </div>
      </div>
    </div>
  )
}

export default Resolve
