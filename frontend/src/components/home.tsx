import { useState, useEffect, useRef } from 'react'
import { useReadContract } from 'wagmi'
import { useNavigate } from 'react-router-dom'
import { CustomConnect } from './connectButton'
import { MobileNav } from './mobilenav'
import { IdentificationIcon, MenuIcon } from '@heroicons/react/outline'
const abi = [
  {
    inputs: [
      {
        internalType: 'string',
        name: 'name',
        type: 'string',
      },
    ],
    name: 'available',
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

export default function Home() {
  const navigate = useNavigate()
  const [available, setAvailable] = useState('')
  const [search, setSearch] = useState('')
  const { data, isPending } = useReadContract({
    address: '0x98e9FdF05313A49D95A44ff3563EA3ba05Ce551E',
    functionName: 'available',
    abi: abi,
    args: [search],
  })

  const [showBox, setShowBox] = useState(false)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const boxRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        showBox &&
        inputRef.current &&
        boxRef.current &&
        !inputRef.current.contains(event.target as Node) &&
        !boxRef.current.contains(event.target as Node)
      ) {
        setShowBox(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showBox])

  useEffect(() => {
    if (search.includes('.')) {
      setAvailable('Invalid')
    } else if (search.length < 3) {
      setAvailable('Too Short')
    } else if (isPending) {
      setAvailable('Loading…')
    } else if (data === true) {
      setAvailable('Available')
    } else if (data === false) {
      setAvailable('Registered')
    } else {
      setAvailable('') // or whatever default you like
    }
  }, [search, isPending, data])
  const handleChange = (e: any) => {
    e.preventDefault()
    setSearch(e.target.value.toLowerCase())
    if (e.target.value.length > 0) {
      setShowBox(true)
    } else {
      setShowBox(false)
    }
  }

  const route = () => {
    if (available == 'Available') {
      navigate(`/register/${search}`)
    } else if (available == 'Registered') {
      navigate(`/resolve/${search}`)
    }
  }
  return (
    <div className="min-h-screen text-white flex flex-col items-center">
      {/* Header */}
      <header className="w-full flex justify-between items-center px-2 md:px-10 mx-auto">
        <div className="text-xl font-bold text-[#FFB000]">CreatorNames</div>
        <div className="flex items-center space-x-6">
          <div
            className="text-gray-400 font-bold hidden md:flex items-center hover:text-white duration-200 cursor-pointer max-w-max gap-1 flex-nowrap"
            onClick={() => navigate(`/mynames`)}
          >
            <IdentificationIcon className="w-7 h-7 flex-shrink-0" />
            <span className="w-full inline-flex max-w-max"> My Names </span>
          </div>
          <MenuIcon className="h-5 w-5 text-gray-400 font-bold" />
          <div className="hidden md:flex">
            {' '}
            <CustomConnect />{' '}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="text-center mt-30">
        <h1 className="text-3xl md:text-5xl font-bold bg-gradient-to-r from-[#FFF700] to-orange-400 text-transparent bg-clip-text">
          Your creator username
        </h1>
        <p className="mt-4 text-gray-400 text-md md:text-lg  max-w-xl mx-auto">
          Your identity across web3, one name for all your crypto addresses, and
          your decentralised website.
        </p>

        {/* Search Bar */}
        <div className="mt-10 relative">
          <input
            ref={inputRef}
            type="text"
            placeholder="Search for a name"
            onChange={handleChange}
            className="w-80 md:w-96 px-6 py-4 text-xl rounded-xl bg-gray-900 font-semibold text-white border border-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          {/* Search Results Popup */}
          <div
            ref={boxRef}
            className={`absolute left-1/2 transform -translate-x-1/2 mt-2 w-80 md:w-96 bg-gray-800 border border-gray-700 rounded-xl shadow-lg text-left z-10 transform origin-top
              transition-transform duration-300 ease-out
              overflow-hidden ${showBox ? 'scale-y-100' : 'scale-y-0'}`}
          >
            <ul className="divide-y divide-gray-700">
              <li
                className="px-6 py-3 hover:bg-gray-700 font-bold rounded-xl cursor-pointer flex justify-between"
                onClick={route}
              >
                <div>{`${search != '' ? search + '.creator' : ''}`}</div>{' '}
                {available != '' ? (
                  <div className="text-[13px] bg-green-800 text-green-300 p-1 rounded-full">
                    {available}
                  </div>
                ) : (
                  ''
                )}
              </li>
            </ul>
          </div>
        </div>
      </main>
      <MobileNav />
    </div>
  )
}
