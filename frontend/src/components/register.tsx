import { useEffect, useState, useRef, useMemo } from 'react'
import Nav from './nav'
import DatePicker from 'react-datepicker'
import { Check } from 'lucide-react'
import { intervalToDuration, startOfDay } from 'date-fns'
import Controller from '../../../deployments/testnet/ETHRegistrarController.json'
import { useAccount } from 'wagmi'
import { useWriteContract, useReadContract } from 'wagmi'
import {
  bytesToHex,
  encodeFunctionData,
  namehash,
  encodeAbiParameters,
  keccak256,
  toBytes,
} from 'viem'
import { useParams, useNavigate } from 'react-router'
import Countdown from 'react-countdown'
import Modal from 'react-modal'
import { buildTextRecords } from '../hooks/setText'
import { useEstimateENSFees } from '../hooks/gasEstimation'
import { MobileNav } from './mobilenav'

const PriceAbi = [
  {
    inputs: [],
    name: 'latestRoundData',
    outputs: [
      {
        internalType: 'uint80',
        name: 'roundId',
        type: 'uint80',
      },
      {
        internalType: 'int256',
        name: 'answer',
        type: 'int256',
      },
      {
        internalType: 'uint256',
        name: 'startedAt',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'updatedAt',
        type: 'uint256',
      },
      {
        internalType: 'uint80',
        name: 'answeredInRound',
        type: 'uint80',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
]

const addrResolver = [
  {
    inputs: [
      {
        internalType: 'bytes32',
        name: 'node',
        type: 'bytes32',
      },
      {
        internalType: 'address',
        name: 'a',
        type: 'address',
      },
    ],
    name: 'setAddr',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
]

const Register = () => {
  const navigate = useNavigate()
  const { label } = useParams<string>()
  const [years, setYears] = useState(1)
  const [currency, setCurrency] = useState<'BNB' | 'USD'>('BNB')
  const [bnb, setBnb] = useState(true)
  const now = useMemo(() => new Date(), [])
  const [isPrimary, setIsPrimary] = useState(false)
  const { address } = useAccount()
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [next, setNext] = useState(0)
  const [isOpen, setIsOpen] = useState(true)
  const { data: commithash, writeContractAsync } = useWriteContract()

  const {
    data: registerhash,
    error: registerError,
    isPending: registerPending,
    writeContractAsync: registerContract,
  } = useWriteContract()
  const [owner, setOwner] = useState(
    address || ('0x0000000000000000000000000000000000000000' as `0x${string}`),
  )

  const nextYear = useMemo(() => {
    const d = new Date(now)
    d.setFullYear(d.getFullYear() + 1)
    return d
  }, [now])
  const minDate = useMemo(() => {
    const d = new Date(now)
    d.setDate(d.getDate() + 28)
    return d
  }, [now])

  const [input, setInput] = useState(true)
  const [date, setDate] = useState(true)
  const [picker, setPicker] = useState(false)
  const [dateText, setDateText] = useState<Date | null>(nextYear)
  const [seconds, setSeconds] = useState(0)
  const [description, setDescription] = useState('')
  const [email, setEmail] = useState('')
  const [twitter, setTwitter] = useState('')
  const [website, setWebsite] = useState('')
  const [github, setGithub] = useState('')
  const [discord, setDiscord] = useState('')
  const [phone, setPhone] = useState('')
  const [avatar, setAvatar] = useState('')
  const [wait, setWait] = useState(60)
  const [done, setDone] = useState(false)

  const { data: latest, isPending: loading } = useReadContract({
    address: '0x98e9FdF05313A49D95A44ff3563EA3ba05Ce551E', // Replace with actual contract address
    abi: Controller.abi as any, // Replace with actual ABI
    functionName: 'rentPrice',
    args: [label as string, seconds],
  })
  const { data: priceData } = useReadContract({
    address: '0x2514895c72f50D8bd4B4F9b1110F0D6bD2c97526', // Replace with actual contract address
    abi: PriceAbi as any, // Replace with actual ABI
    functionName: 'latestRoundData',
  })
  const { fees, loading: estimateLoading } = useEstimateENSFees({
    name: `${label}`,
    owner: address as `0x${string}`,
    duration: seconds, // seconds
  })

  const [estimateBnb, setEstimateBnb] = useState('')
  const [estimateUsd, setEstimateUsd] = useState('')
  useEffect(() => {
    console.log(fees?.fee.totalEth)
    const bnb = Number(fees?.fee.totalEth).toFixed(4)
    setEstimateBnb(bnb as string)

    const [, answer, , ,] = (priceData as any) || [0, 0, 0, 0, 0]
    const usd = (Number(fees?.fee.totalEth) * Number(answer)) / 1e8
    setEstimateUsd(usd.toFixed(2))
  }, [fees, priceData])

  const price = useMemo(() => {
    const { base } = (latest as any) || { base: 0 }
    const [, answer, , ,] = (priceData as any) || [0, 0, 0, 0, 0]
    const bnbPrice = Number(answer) / 1e8 // Chainlink ETH/USD has 8 decimals
    const costInEth = Number(base) / 1e18 // your base is in wei
    const usdCost = costInEth * bnbPrice
    return { bnb: costInEth.toFixed(4), usd: usdCost.toFixed(2) }
  }, [latest, priceData, seconds])

  const inputRef = useRef<HTMLInputElement>(null)

  // close on outside click
  const containerRef = useRef<HTMLDivElement>(null)

  const duration = useMemo(() => {
    if (!dateText) {
      return { years: 0, months: 0, days: 0 }
    }
    // normalize both to midnight
    const start = startOfDay(now)
    const end = startOfDay(dateText)

    const d = intervalToDuration({ start, end })
    return { years: d.years || 0, months: d.months || 0, days: d.days || 0 }
  }, [nextYear, dateText])
  useEffect(() => {
    if (label != undefined && label.includes('.')) {
      navigate('/')
    }
  }, [])
  // close when clicking outside
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (
        picker &&
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setPicker(false)
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [picker])

  useEffect(() => {
    if (dateText && !date) {
      const d = new Date(dateText)
      setSeconds((startOfDay(d).getTime() - startOfDay(now).getTime()) / 1000)
    }
  }, [dateText, date])

  useEffect(() => {
    if (date) {
      setSeconds(31536000 * years)
    }
  }, [date, years])

  const increment = () => {
    setYears((prev) => prev + 1)
  }

  const [disable, setDisable] = useState(true)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      // Guard: must have both elements
      if (!input && inputRef.current) {
        const clickedNode = event.target as Node
        // If click is outside *both* the input and the box, close
        if (!inputRef.current.contains(clickedNode)) {
          setInput(true)
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [input])
  useEffect(() => {
    document.title = `Register – ${label}.creator`
  }, [label])

  useEffect(() => {
    if (years == 1) {
      setDisable(true)
    }
    if (years > 1) {
      setDisable(false)
    }
  }, [years])

  const decrease = () => {
    setYears((prev) => prev - 1)
  }

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (Number(event.target.value) < 1) {
      setYears(1)
    } else if (Number(event.target.value) >= 1) {
      setYears(Number(event.target.value))
    }
  }
  let durationString =
    (duration.years > 0
      ? ` ${duration.years} year${duration.years > 1 ? 's' : ''}`
      : '') +
    (duration.months > 0
      ? `${duration.years > 0 ? ',' : ''} ${duration.months} month${
          duration.months > 1 ? 's' : ''
        }`
      : '') +
    (duration.days > 0
      ? `${duration.months > 0 || duration.years > 0 ? ',' : ''} ${
          duration.days
        } day${duration.days > 1 ? 's' : ''}`
      : '')
  const [secret, setSecret] = useState<`0x${string}`>('0x')
  const [commitData, setCommitData] = useState<`0x${string}`[]>([])
  const [newRecords, setNewRecords] = useState<
    { key: string; value: string }[]
  >([])

  const commit = async () => {
    const secretBytes = crypto.getRandomValues(new Uint8Array(32))
    const secretGenerated = bytesToHex(secretBytes) as `0x${string}`
    setSecret(secretGenerated)

    const textRecords = [
      { key: 'description', value: description },
      { key: 'avatar', value: avatar },
      { key: 'com.twitter', value: twitter },
      { key: 'com.github', value: github },
      { key: 'com.discord', value: discord },
      { key: 'email', value: email },
      { key: 'url', value: website },
      { key: 'phone', value: phone },
    ]

    const complete = [...textRecords, ...newRecords]

    const validTextRecords = complete.filter(
      (r) => r.key.trim() !== '' && r.value.trim() !== '',
    )

    console.log(validTextRecords)

    const builtData = buildTextRecords(
      validTextRecords,
      namehash(`${label as string}.creator`),
    )
    const addrEncoded = encodeFunctionData({
      abi: addrResolver,
      functionName: 'setAddr',
      args: [namehash(`${label}.creator`), owner],
    })
    const fullData = [...builtData, addrEncoded]
    setCommitData(fullData)
    const resolver = '0xF90F11ddD972e661170836e9E3970BBE398988D8'
    try {
      const labelHash = keccak256(toBytes(label || ''))
      const encoded = encodeAbiParameters(
        [
          { type: 'bytes32' }, // label
          { type: 'address' }, // owner
          { type: 'uint256' }, // duration
          { type: 'bytes32' }, // secret
          { type: 'address' }, // resolver
          { type: 'bytes[]' }, // data
          { type: 'bool' }, // reverseRecord
          { type: 'uint16' }, // fuses
        ],
        [
          labelHash,
          owner,
          BigInt(seconds),
          secretGenerated,
          resolver,
          fullData,
          isPrimary,
          0,
        ],
      )
      const commitment = keccak256(encoded)
      setMessage('Committing Registration')
      await writeContractAsync({
        address: '0x98e9FdF05313A49D95A44ff3563EA3ba05Ce551E',
        account: address,
        abi: Controller.abi,
        functionName: 'commit',
        args: [commitment],
      })
      setWait(60)
      setIsOpen(false)
    } catch (error) {
      console.error('Error during Commit', error)
      setMessage('Commit Failed')
      setIsLoading(false)
    }
  }

  const register = async () => {
    setIsLoading(true)
    const resolver = '0xF90F11ddD972e661170836e9E3970BBE398988D8'
    try {
      const { base, premium } = latest as { base: bigint; premium: bigint }
      await registerContract({
        address: '0x98e9FdF05313A49D95A44ff3563EA3ba05Ce551E',
        account: address,
        abi: Controller.abi,
        functionName: 'register',
        args: [
          label,
          owner,
          BigInt(seconds),
          secret,
          resolver,
          commitData,
          isPrimary,
          0,
        ],
        value: base + premium,
      })

      setMessage('Registration Successful')
      setIsOpen(false)
    } catch (error) {
      setMessage('Registration Failed')
      console.error('Error during Registration', error)
      setIsLoading(false)
    }
  }

  const { data: available } = useReadContract({
    address: '0x98e9FdF05313A49D95A44ff3563EA3ba05Ce551E',
    abi: Controller.abi as any,
    functionName: 'available',
    args: [label as string],
  })

  useEffect(() => {
    if (available === false) {
      navigate('/')
      console.log(available)
    } else if (available === true) {
      setNext(0)
    }
  }, [available, navigate])

  console.log(isPrimary)
  return (
    <div>
      <Nav />
      <div className="flex flex-col mx-auto px-2 md:px-30 lg:px-60 md:mt-5">
        <div className="">
          <h2 className="font-bold text-2xl text-white">{label}.creator</h2>
          {next == 0 ? (
            <div className="rounded-xl bg-neutral-800 px-5 md:px-10 py-5 mt-5 border-[0.5px] border-gray-400">
              <h1 className="text-lg font-semibold text-white">
                {' '}
                Register {label}.creator{' '}
              </h1>
              {date ? (
                <div className="rounded-full py-4 px-4  border-[0.5px] border-gray-400 mt-5 flex items-center relative">
                  <button
                    className="flex items-center justify-center text-3xl w-10 h-10 p-2  rounded-full border-[0.5px] cursor-pointer border-gray-400 bg-[#FFF700] disabled:bg-neutral-500 disabled:cursor-not-allowed text-neutral-900 "
                    disabled={disable}
                    onClick={decrease}
                  >
                    -
                  </button>
                  {input ? (
                    <div
                      className="text-3xl md:text-3xl text-[#FFF700] font-semibold grow-1 text-center hover:bg-[#807F00]  transition-all duration-300 rounded-full cursor-pointer mx-5"
                      onClick={() => {
                        setInput(false)
                      }}
                    >
                      <p className="opacity-90">
                        {years} Year{years > 1 ? 's' : ''}
                      </p>
                    </div>
                  ) : (
                    <input
                      ref={inputRef}
                      type="number"
                      min={1}
                      className="text-3xl md:text-4xl w-30 md:w-full text-[#FFF700] font-semibold grow-1 text-center hover:bg-[#807F00]  transition-all duration-300 rounded-full cursor-pointer mx-5"
                      value={years}
                      onChange={handleChange}
                    />
                  )}
                  <button
                    className="flex items-center justify-center text-3xl w-10 h-10 p-2 rounded-full bg-[#FFF700] border-[0.5px] border-gray-400 cursor-pointer text-neutral-900"
                    onClick={increment}
                  >
                    +
                  </button>
                </div>
              ) : (
                <div
                  ref={containerRef}
                  className="rounded-full p-4 border-[0.5px] border-gray-400 mt-5 flex items-center hover:bg-[#807F00] cursor-pointer transition-all ease-in-out duration-300 relative"
                  onClick={() => {
                    setPicker(true)
                  }}
                >
                  <DatePicker
                    selected={dateText}
                    onChange={(d) => setDateText(d)}
                    open={picker}
                    onClickOutside={() => setPicker(false)}
                    minDate={minDate}
                    dateFormat="MMMM d, yyyy"
                    customInput={<div style={{ display: 'none' }} />}
                    popperPlacement="bottom-start"
                    className="z-50 mt-50"
                    // ◀️ Custom wrapper for the calendar popper
                    calendarContainer={({ className, children }) => (
                      <div
                        className={`${className} absolute top-full left-0 mt-7 z-50`}
                        style={{ width: 'auto' }}
                      >
                        {children}
                      </div>
                    )}
                  />
                  <div className="flex grow-1 text-3xl text-[#FFF700] font-semibold relative items-center ">
                    {dateText?.toLocaleString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </div>

                  <button className="flex items-center justify-center text-3xl w-10 h-10 p-2  rounded-full bg-[#FFF700] border-[0.5px] border-gray-400 cursor-pointer text-neutral-900">
                    +
                  </button>
                </div>
              )}
              {date ? (
                <p className="text-center mt-5 text-sm flex justify-center font-semibold">
                  {years} year{years > 1 ? 's' : ''} registration.{' '}
                  <span
                    className="text-[#FFF700] text-center ml-2 cursor-pointer"
                    onClick={() => {
                      setDate(!date)
                    }}
                  >
                    Pick by date
                  </span>
                </p>
              ) : (
                <p className="text-center mt-5 text-sm flex justify-center font-semibold">
                  {duration.years > 0
                    ? ` ${duration.years} year${duration.years > 1 ? 's' : ''}`
                    : ''}
                  {duration.months > 0
                    ? `${duration.years > 0 ? ',' : ''} ${
                        duration.months
                      } months`
                    : ''}
                  {duration.days > 0
                    ? `${duration.months > 0 ? ',' : ''} ${duration.days} days`
                    : ''}{' '}
                  registration.{' '}
                  <span
                    className="text-[#FFF700] text-center ml-2 cursor-pointer"
                    onClick={() => {
                      setDate(!date)
                    }}
                  >
                    Pick by Years
                  </span>
                </p>
              )}
              <div>
                <div className="inline-flex bg-neutral-900 rounded-full p-1 mt-5">
                  {(['BNB', 'USD'] as const).map((curr) => {
                    const isActive = curr === currency
                    return (
                      <button
                        key={curr}
                        onClick={() => {
                          setCurrency(curr)
                          setBnb(!bnb)
                        }}
                        className={`
                            px-4 py-2 text-sm font-medium rounded-full transition cursor-pointer 
                            ${
                              isActive
                                ? 'bg-[#FFF700] text-neutral-800' // active
                                : 'text-gray-400 hover:text-white'
                            } // inactive
                            `}
                      >
                        {curr}
                      </button>
                    )
                  })}
                </div>
                <div className="rounded-xl bg-neutral-900 px-5 py-5 mt-5">
                  {bnb ? (
                    <div className="space-y-1">
                      <div className="flex">
                        {date ? (
                          <div className="text-sm flex font-semibold text-gray-400 grow-1">
                            {years} year{years > 1 ? 's' : ''} registration
                          </div>
                        ) : (
                          <div className="text-sm flex font-semibold text-gray-400 grow-1">
                            {duration.years > 0
                              ? ` ${duration.years} year${
                                  duration.years > 1 ? 's' : ''
                                }`
                              : ''}
                            {duration.months > 0
                              ? `${duration.years > 0 ? ',' : ''} ${
                                  duration.months
                                } months`
                              : ''}
                            {duration.days > 0
                              ? `${duration.months > 0 ? ',' : ''} ${
                                  duration.days
                                } days`
                              : ''}{' '}
                            registration.
                          </div>
                        )}

                        {loading ? (
                          <div className="animate-pulse">
                            <div className="animate-pulse w-20 h-6 rounded-full bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800" />
                          </div>
                        ) : (
                          <div className="text-gray-400">{price.bnb} BNB</div>
                        )}
                      </div>
                      <div className="flex">
                        <div className="text-sm flex font-semibold text-gray-400 grow-1">
                          Estimated Gas Fee
                        </div>

                        {estimateLoading || estimateBnb == 'NaN' ? (
                          <div className="animate-pulse">
                            <div className="animate-pulse w-20 h-6 rounded-full bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800" />
                          </div>
                        ) : (
                          <div className="text-gray-400">{estimateBnb} BNB</div>
                        )}
                      </div>
                      <div className="flex">
                        <div className="text-sm flex font-semibold text-white grow-1">
                          Estimated Total
                        </div>

                        {loading || estimateLoading || estimateBnb == 'NaN' ? (
                          <div className="animate-pulse">
                            <div className="animate-pulse w-20 h-6 rounded-full bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800" />
                          </div>
                        ) : (
                          <div className="text-white">
                            {(Number(estimateBnb) + Number(price.bnb)).toFixed(
                              4,
                            )}{' '}
                            BNB
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <div className="flex">
                        {date ? (
                          <div className="text-sm flex font-semibold text-gray-400 grow-1">
                            {years} year{years > 1 ? 's' : ''} registration
                          </div>
                        ) : (
                          <div className="text-sm flex font-semibold text-gray-400 grow-1">
                            {duration.years > 0
                              ? ` ${duration.years} year${
                                  duration.years > 1 ? 's' : ''
                                }`
                              : ''}
                            {duration.months > 0
                              ? `${duration.years > 0 ? ',' : ''} ${
                                  duration.months
                                } months`
                              : ''}
                            {duration.days > 0
                              ? `${duration.months > 0 ? ',' : ''} ${
                                  duration.days
                                } days`
                              : ''}{' '}
                            registration.
                          </div>
                        )}

                        {loading ? (
                          <div className="animate-pulse">
                            <div className="animate-pulse w-20 h-6 rounded-full bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800" />
                          </div>
                        ) : (
                          <div className="text-gray-400">${price.usd}</div>
                        )}
                      </div>
                      <div className="flex">
                        <div className="text-sm flex font-semibold text-gray-400 grow-1">
                          Estimated Gas Fee
                        </div>

                        {estimateLoading || estimateUsd == 'NaN' ? (
                          <div className="animate-pulse">
                            <div className="animate-pulse w-20 h-6 rounded-full bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800" />
                          </div>
                        ) : (
                          <div className="text-gray-400">${estimateUsd}</div>
                        )}
                      </div>
                      <div className="flex">
                        <div className="text-sm flex font-semibold text-white grow-1">
                          Estimated Total
                        </div>

                        {loading || estimateLoading || estimateUsd == 'NaN' ? (
                          <div className="animate-pulse">
                            <div className="animate-pulse w-20 h-6 rounded-full bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800" />
                          </div>
                        ) : (
                          <div className="text-white">
                            $
                            {(Number(estimateUsd) + Number(price.usd)).toFixed(
                              2,
                            )}{' '}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex mt-5">
                  <div>
                    <h1 className="text-xl font-semibold">
                      Set as Primary Name
                    </h1>
                    <p className="text-gray-400 text-sm max-w-60 md:max-w-100 mt-5">
                      This links your address to this name, allowing dApps to
                      display it as your profile when connected to them. You can
                      only have one primary name per address.
                    </p>
                  </div>
                  <div className="flex grow-1"></div>
                  <button
                    onClick={() => setIsPrimary(!isPrimary)}
                    className={`flex items-center justify-center w-14 h-14
                     rounded-full transition-colors duration-300 border-8 border-gray-200 ${
                       isPrimary ? 'bg-black' : 'bg-gray-300'
                     }`}
                  >
                    <Check
                      className={`w-5 h-5 text-white transition-opacity duration-200  ${
                        isPrimary ? 'opacity-100' : 'opacity-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-center">
                <button
                  className="px-5 py-3 bg-[#FFF700] text-neutral-900 font-semibold mt-5 rounded-xl cursor-pointer hover:bg-[#B3AE00] transition-all duration-300 flex items-center"
                  onClick={() => {
                    setNext(1)
                  }}
                  disabled={isLoading}
                >
                  Next
                </button>
              </div>
              {isLoading && <RegistrationModal message={message} />}
            </div>
          ) : next == 1 ? (
            <SetupModal
              owner={owner}
              setOwner={setOwner}
              setDescription={setDescription}
              setEmail={setEmail}
              setTwitter={setTwitter}
              setWebsite={setWebsite}
              setGithub={setGithub}
              setDiscord={setDiscord}
              setPhone={setPhone}
              setAvatar={setAvatar}
              setNext={setNext}
              textRecords={newRecords}
              setTextRecords={setNewRecords}
            />
          ) : next == 2 ? (
            <div className="rounded-xl bg-neutral-800 px-5 md:px-10 py-5 mt-5 border-[0.5px] border-gray-400">
              <h1 className="text-center text-2xl font-semibold">
                Before we Start
              </h1>
              <p className="text-center font-semibold mt-7 text-sm">
                Registering your name takes three steps
              </p>
              <div className="w-full flex space-x-5 justify-center mt-5">
                <div className="rounded-lg p-3 border-1 border-gray-300 w-25 md:w-48 h-38 flex-col flex items-center text-sm lg:text-md">
                  <div className="p-2 flex items-center w-10 h-10 bg-[#FFF700] rounded-full justify-center text-neutral-900 font-bold">
                    1
                  </div>
                  <p className="text-center text-[10px] lg:text-sm font-semibold mt-5">
                    Complete a transaction to begin the timer
                  </p>
                </div>
                <div className="rounded-lg p-3 border-1 border-gray-300 w-25 md:w-48 h-38 flex-col flex items-center text-sm lg:text-md">
                  <div className="p-2 flex items-center w-10 h-10 bg-[#FFF700] rounded-full justify-center text-neutral-900 font-bold">
                    2
                  </div>
                  <p className="text-center text-[10px] lg:text-sm font-semibold mt-5">
                    Wait 60 seconds for the timer to complete
                  </p>
                </div>
                <div className="rounded-lg p-3 border-1 border-gray-300 w-25 md:w-48 h-38 flex-col flex items-center text-sm lg:text-md">
                  <div className="p-2 flex items-center w-10 h-10 bg-[#FFF700] rounded-full justify-center text-neutral-900 font-bold">
                    3
                  </div>
                  <p className="text-center text-[10px] lg:text-sm font-semibold mt-5">
                    Complete a second transaction to secure your name
                  </p>
                </div>
              </div>
              <div className="mt-10">
                <div className="inline-flex bg-neutral-900 rounded-full p-1">
                  {(['BNB', 'USD'] as const).map((curr) => {
                    const isActive = curr === currency
                    return (
                      <button
                        key={curr}
                        onClick={() => {
                          setCurrency(curr)
                          setBnb(!bnb)
                        }}
                        className={`
                            px-4 py-2 text-sm font-medium rounded-full transition cursor-pointer 
                            ${
                              isActive
                                ? 'bg-[#FFF700] text-neutral-800' // active
                                : 'text-gray-400 hover:text-white'
                            } // inactive
                            `}
                      >
                        {curr}
                      </button>
                    )
                  })}
                </div>
                <div className="rounded-xl bg-neutral-900 px-5 py-5 mt-5">
                  {bnb ? (
                    <div className="space-y-1">
                      <div className="flex">
                        {date ? (
                          <div className="text-sm flex font-semibold text-gray-400 grow-1">
                            {years} year{years > 1 ? 's' : ''} registration
                          </div>
                        ) : (
                          <div className="text-sm flex font-semibold text-gray-400 grow-1">
                            {duration.years > 0
                              ? ` ${duration.years} year${
                                  duration.years > 1 ? 's' : ''
                                }`
                              : ''}
                            {duration.months > 0
                              ? `${duration.years > 0 ? ',' : ''} ${
                                  duration.months
                                } months`
                              : ''}
                            {duration.days > 0
                              ? `${duration.months > 0 ? ',' : ''} ${
                                  duration.days
                                } days`
                              : ''}{' '}
                            registration.
                          </div>
                        )}

                        {loading ? (
                          <div className="animate-pulse">
                            <div className="animate-pulse w-20 h-6 rounded-full bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800" />
                          </div>
                        ) : (
                          <div className="text-gray-400">{price.bnb} BNB</div>
                        )}
                      </div>
                      <div className="flex">
                        <div className="text-sm flex font-semibold text-gray-400 grow-1">
                          Estimated Gas Fee
                        </div>

                        {estimateLoading || estimateBnb == 'NaN' ? (
                          <div className="animate-pulse">
                            <div className="animate-pulse w-20 h-6 rounded-full bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800" />
                          </div>
                        ) : (
                          <div className="text-gray-400">{estimateBnb} BNB</div>
                        )}
                      </div>
                      <div className="flex">
                        <div className="text-sm flex font-semibold text-white grow-1">
                          Estimated Total
                        </div>

                        {loading || estimateLoading || estimateBnb == 'NaN' ? (
                          <div className="animate-pulse">
                            <div className="animate-pulse w-20 h-6 rounded-full bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800" />
                          </div>
                        ) : (
                          <div className="text-white">
                            {(Number(estimateBnb) + Number(price.bnb)).toFixed(
                              4,
                            )}{' '}
                            BNB
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className='space-y-1'>
                      <div className="flex">
                        {date ? (
                          <div className="text-sm flex font-semibold text-gray-400 grow-1">
                            {years} year{years > 1 ? 's' : ''} registration
                          </div>
                        ) : (
                          <div className="text-sm flex font-semibold text-gray-400 grow-1">
                            {duration.years > 0
                              ? ` ${duration.years} year${
                                  duration.years > 1 ? 's' : ''
                                }`
                              : ''}
                            {duration.months > 0
                              ? `${duration.years > 0 ? ',' : ''} ${
                                  duration.months
                                } months`
                              : ''}
                            {duration.days > 0
                              ? `${duration.months > 0 ? ',' : ''} ${
                                  duration.days
                                } days`
                              : ''}{' '}
                            registration.
                          </div>
                        )}

                        {loading ? (
                          <div className="animate-pulse">
                            <div className="animate-pulse w-20 h-6 rounded-full bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800" />
                          </div>
                        ) : (
                          <div className="text-gray-400">${price.usd}</div>
                        )}
                      </div>
                      <div className="flex">
                        <div className="text-sm flex font-semibold text-gray-400 grow-1">
                          Estimated Gas Fee
                        </div>

                        {estimateLoading || estimateUsd == 'NaN' ? (
                          <div className="animate-pulse">
                            <div className="animate-pulse w-20 h-6 rounded-full bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800" />
                          </div>
                        ) : (
                          <div className="text-gray-400">${estimateUsd}</div>
                        )}
                      </div>
                      <div className="flex">
                        <div className="text-sm flex font-semibold text-white grow-1">
                          Estimated Total
                        </div>

                        {loading || estimateLoading || estimateUsd == 'NaN' ? (
                          <div className="animate-pulse">
                            <div className="animate-pulse w-20 h-6 rounded-full bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800" />
                          </div>
                        ) : (
                          <div className="text-white">
                            $
                            {(Number(estimateUsd) + Number(price.usd)).toFixed(
                              2,
                            )}{' '}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex space-x-5 mt-10 justify-center">
                <button
                  className="p-3 px-10 md:px-15 bg-gray-300 text-black rounded-lg font-semibold cursor-pointer"
                  onClick={() => {
                    setNext((prev) => prev - 1)
                  }}
                >
                  Back
                </button>
                <button
                  className="p-3 px-10 md:px-15 bg-[#FFF700]  rounded-lg text-black font-semibold cursor-pointer"
                  onClick={() => {
                    setNext((prev) => prev + 1)
                    commit()
                  }}
                >
                  Begin
                </button>
              </div>
            </div>
          ) : next == 3 ? (
            <div className="bg-white dark:bg-neutral-900 p-8 rounded-2xl shadow-2xl  mx-auto mt-5 flex flex-col items-center gap-6 border-1 border-gray-300">
              <h2 className="text-2xl font-bold text-center text-neutral-800 dark:text-white">
                Almost there
              </h2>

              <div className="relative">
                <div className="w-32 h-32 rounded-full border-8 border-blue-300 flex justify-center items-center text-4xl font-bold text-blue-600">
                  {commithash && (
                    <Countdown
                      date={Date.now() + wait * 1000}
                      renderer={({ seconds, completed }) => {
                        if (completed) {
                          setDone(true)
                          return <span>0</span>
                        }
                        return <span>{seconds}</span>
                      }}
                    />
                  )}
                </div>
              </div>

              <p className="text-center text-sm text-gray-500 px-4">
                This wait prevents others from{' '}
                <a href="#" className="underline text-blue-500">
                  front running
                </a>{' '}
                your transaction.
                <br />
                You’ll complete the second transaction when the timer ends.
              </p>

              <div className="flex gap-4 w-full mt-4">
                <button
                  onClick={() => {
                    setNext((prev) => prev - 1)
                  }}
                  className="flex-1 bg-red-100 text-red-600 py-2 rounded-lg font-semibold hover:bg-red-200 transition"
                >
                  Back
                </button>
                {done == false ? (
                  <button
                    disabled
                    className="flex-1 bg-gray-300 text-gray-500 py-2 rounded-lg font-semibold cursor-not-allowed"
                  >
                    Wait ⏳
                  </button>
                ) : (
                  <button
                    className="flex-1 bg-[#FFF700] text-gray-500 py-2 rounded-lg font-semibold cursor-pointer"
                    onClick={() => {
                      setNext((prev) => prev + 1)
                      setIsOpen(true)
                      register()
                    }}
                  >
                    Complete Registration
                  </button>
                )}
              </div>
              <ConfirmDetailsModal
                isOpen={isOpen}
                onRequestClose={() => setNext((prev) => prev - 1)}
                name={`${label}.creator` || ''}
                action="Start timer"
                info="Start timer to register name"
              />
            </div>
          ) : next == 4 ? (
            <div className="bg-white dark:bg-neutral-900 p-8 rounded-2xl shadow-2xl  mx-auto mt-5 flex flex-col items-center gap-6 border-1 border-gray-300">
              <RegisterDetailsModal
                isOpen={isOpen}
                onRequestClose={() => setNext((prev) => prev - 1)}
                name={`${label}.creator` || ''}
                action="Register name"
                duration={durationString}
              />
              {registerPending ? (
                <h2 className="text-3xl font-bold text-center text-neutral-800 dark:text-white">
                  Waiting for transaction to complete...`
                </h2>
              ) : !registerhash ? (
                <h2 className="text-3xl font-bold text-center text-neutral-800 dark:text-white">
                  Complete your registration
                </h2>
              ) : registerError ? (
                <h2 className="text-3xl font-bold text-center text-neutral-800 dark:text-white">
                  There was an error while registering your name. Please{' '}
                  <span
                    className="cursor-pointer text-blue"
                    onClick={() => setIsOpen(true)}
                  >
                    try again
                  </span>
                </h2>
              ) : registerhash ? (
                <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
                  <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
                    <h1 className="text-2xl font-bold mb-2">
                      Congratulations!
                    </h1>
                    <p className="text-gray-600 mb-6">
                      You are now the owner of{' '}
                      <span className="text-blue-500 font-semibold">
                        {label}.eth
                      </span>
                    </p>

                    <div className="bg-gradient-to-r from-indigo-400 to-blue-400 rounded-2xl p-10 mb-6 flex flex-col items-center">
                      {/* Replace with your actual logo */}
                      <div className="bg-white rounded-full p-3 mb-4">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-8 w-8 text-indigo-500"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 4v16m8-8H4"
                          />
                        </svg>
                      </div>
                      <p className="text-white font-semibold text-lg">
                        {`${label}.creator`}
                      </p>
                    </div>

                    <div className="bg-gray-100 rounded-xl p-4 mb-6 text-sm text-left space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-500">{durationString}</span>
                        <span className="font-medium">
                          {price.bnb} BNB{' '}
                          <span className="text-gray-400">{`($${price.usd})`}</span>
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Name expires</span>
                        <div className="flex flex-col items-end">
                          <span className="font-medium">
                            {dateText?.toLocaleDateString('en-US', {
                              month: 'long',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </span>
                          <button className="text-blue-500 text-xs hover:underline mt-1">
                            Set reminder
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <button className="bg-white border border-blue-500 text-blue-500 font-semibold py-2 px-4 rounded-lg hover:bg-blue-50">
                        Register another
                      </button>
                      <button className="bg-blue-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-600">
                        View name
                      </button>
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
      <MobileNav />
    </div>
  )
}

type Props = {
  message: string
}
const RegistrationModal = ({ message }: Props) => {
  return (
    <div className="fixed inset-0 h-full w-full bg-black/50 flex justify-center items-center z-50">
      <div className="rounded-xl bg-white w-140 h-100 flex flex-col justify-center items-center">
        <div className="w-12 h-12 border-4 border-t-transparent border-black rounded-full animate-spin mb-4"></div>
        <div className="text-black">{message}</div>
      </div>
    </div>
  )
}
type SetupProps = {
  owner: `0x${string}`
  setOwner: React.Dispatch<React.SetStateAction<`0x${string}`>>
  setDescription: React.Dispatch<React.SetStateAction<string>>
  setEmail: React.Dispatch<React.SetStateAction<string>>
  setTwitter: React.Dispatch<React.SetStateAction<string>>
  setWebsite: React.Dispatch<React.SetStateAction<string>>
  setGithub: React.Dispatch<React.SetStateAction<string>>
  setDiscord: React.Dispatch<React.SetStateAction<string>>
  setPhone: React.Dispatch<React.SetStateAction<string>>
  setAvatar: React.Dispatch<React.SetStateAction<string>>
  setNext: React.Dispatch<React.SetStateAction<number>>
  textRecords: { key: string; value: string }[]
  setTextRecords: React.Dispatch<
    React.SetStateAction<{ key: string; value: string }[]>
  >
}
const SetupModal = ({
  owner,
  setOwner,
  setDescription,
  setDiscord,
  setEmail,
  setGithub,
  setPhone,
  setTwitter,
  setWebsite,
  setNext,
  textRecords,
  setTextRecords,
}: SetupProps) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    setOwner(e.target.value as `0x${string}`)
  }
  const [more, setMore] = useState(false)

  return (
    <div className="rounded-xl bg-neutral-800 px-10 py-5 mt-5 border-[0.5px] border-gray-400">
      <h1 className="text-3xl font-semibold text-[#FFF700] text-center">
        Setup your Profile
      </h1>
      <div className="flex justify-center mt-5">
        <div className="rounded-full w-30 h-30 bg-gray-600"></div>
      </div>
      <div className="mt-5 space-y-3 text-sm">
        <p className="font-semibold">bnb address</p>
        <input
          value={owner}
          onChange={handleChange}
          placeholder="0x"
          className="w-full mb-5 p-3 bg-neutral-700 rounded-lg focus:outline-none"
        />
      </div>
      <div className="flex justify-center flex-col items-center">
        <button
          className="flex p-3 bg-[#FFF700] rounded-lg text-neutral-900 text-sm font-semibold cursor-pointer hover:bg-[#B3AE00] transition-all duration-300"
          onClick={() => {
            setMore(true)
          }}
        >
          {' '}
          + Add more to profile
        </button>
        {more && (
          <div className="mt-10">
            <textarea
              onChange={(e) => {
                e.preventDefault()
                setDescription(e.target.value as string)
              }}
              className="w-full mb-10 p-3 bg-neutral-700 rounded-lg focus:outline-none"
              placeholder="Describe yourself in a few words"
            />
            <input
              onChange={(e) => {
                e.preventDefault()
                setEmail(e.target.value as string)
              }}
              className="w-full mb-10 p-3 bg-neutral-700 rounded-lg focus:outline-none"
              placeholder="Type your email address"
            />
            <input
              type="tel"
              onChange={(e) => {
                e.preventDefault()
                setPhone(e.target.value as string)
              }}
              className="w-full mb-10 p-3 bg-neutral-700 rounded-lg focus:outline-none"
              placeholder="Type your telephone number"
            />
            <input
              onChange={(e) => {
                e.preventDefault()
                setTwitter(e.target.value as string)
              }}
              className="w-full mb-10 p-3 bg-neutral-700 rounded-lg focus:outline-none"
              placeholder="What is your Twitter handle?"
            />
            <input
              onChange={(e) => {
                e.preventDefault()
                setGithub(e.target.value as string)
              }}
              className="w-full mb-10 p-3 bg-neutral-700 rounded-lg focus:outline-none"
              placeholder="Your Github username goes here"
            />
            <input
              onChange={(e) => {
                e.preventDefault()
                setDiscord(e.target.value as string)
              }}
              className="w-full mb-10 p-3 bg-neutral-700 rounded-lg focus:outline-none"
              placeholder="Your Discord username goes here too"
            />
            <input
              onChange={(e) => {
                e.preventDefault()
                setWebsite(e.target.value as string)
              }}
              className="w-full mb-10 p-3 bg-neutral-700 rounded-lg focus:outline-none"
              placeholder="Your website URL"
            />
            {textRecords.map((record, index) => (
              <div key={index} className="flex space-x-2 mb-3">
                <input
                  type="text"
                  placeholder="Key (Format: com.youtube and not youtube.com)"
                  className="w-1/2 p-3 bg-neutral-700 rounded-lg text-sm focus:outline-none"
                  value={record.key}
                  onChange={(e) => {
                    const updated = [...textRecords]
                    updated[index].key = e.target.value
                    setTextRecords(updated)
                  }}
                />
                <input
                  type="text"
                  placeholder="Value"
                  className="w-1/2 p-3 bg-neutral-700 rounded-lg focus:outline-none"
                  value={record.value}
                  onChange={(e) => {
                    const updated = [...textRecords]
                    updated[index].value = e.target.value
                    setTextRecords(updated)
                  }}
                />
                <button
                  className="text-red-500 hover:text-red-700 text-sm font-semibold"
                  onClick={() => {
                    const updated = [...textRecords]
                    updated.splice(index, 1)
                    setTextRecords(updated)
                  }}
                >
                  ✕
                </button>
              </div>
            ))}

            <button
              className="px-4 py-2 bg-[#FFF700] text-black rounded-lg font-semibold hover:bg-[#B3AE00] mt-4"
              onClick={() =>
                setTextRecords([...textRecords, { key: '', value: '' }])
              }
            >
              + Add Record
            </button>
          </div>
        )}

        <div className="flex space-x-5 w-full mt-10">
          <button
            className="p-3 bg-gray-300 text-black w-full rounded-lg font-semibold cursor-pointer"
            onClick={() => {
              setNext((prev) => prev - 1)
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
    </div>
  )
}

interface ConfirmDetailsModalProps {
  isOpen: boolean
  onRequestClose: () => void
  name: string
  action: string
  info: string
}

Modal.setAppElement('#root') // IMPORTANT for accessibility

function ConfirmDetailsModal({
  isOpen,
  onRequestClose,
  name,
  action,
  info,
}: ConfirmDetailsModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      closeTimeoutMS={300} // animation duration (matches CSS)
      className="modal-content"
      overlayClassName="modal-overlay"
    >
      {/* Modal content */}
      <div className="p-8 rounded-2xl bg-white dark:bg-neutral-900 shadow-xl relative w-[300px] md:w-[400px] mx-auto flex flex-col gap-6">
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
            <div className="flex items-center gap-2 font-bold text-black dark:text-white text-sm md:text-md">
              {name}
              <div className="w-4 h-4 rounded-full bg-gradient-to-r from-pink-400 to-pink-600" />
            </div>
          </div>

          <div className="flex justify-between items-center border border-gray-200 dark:border-gray-700 rounded-lg p-3">
            <div className="text-gray-500 text-sm">Action</div>
            <div className="font-bold text-black dark:text-white text-sm md:text-md">
              {action}
            </div>
          </div>

          <div className="flex justify-between items-center border border-gray-200 dark:border-gray-700 rounded-lg p-3">
            <div className="text-gray-500 text-sm">Info</div>
            <div className="font-bold text-black dark:text-white text-sm md:text-md text-right">
              {info}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  )
}
interface RegisterDetailsModalProps {
  isOpen: boolean
  onRequestClose: () => void
  name: string
  action: string
  duration: string
}

Modal.setAppElement('#root') // IMPORTANT for accessibility

function RegisterDetailsModal({
  isOpen,
  onRequestClose,
  name,
  action,
  duration,
}: RegisterDetailsModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      closeTimeoutMS={300} // animation duration (matches CSS)
      className="modal-content"
      overlayClassName="modal-overlay"
    >
      {/* Modal content */}
      <div className="p-8 rounded-2xl bg-white dark:bg-neutral-900 shadow-xl relative w-[300px] md:w-[400px] mx-auto flex flex-col gap-6">
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
            <div className="flex items-center gap-2 font-bold text-black dark:text-white text-sm md:text-md">
              {name}
              <div className="w-4 h-4 rounded-full bg-gradient-to-r from-pink-400 to-pink-600" />
            </div>
          </div>

          <div className="flex justify-between items-center border border-gray-200 dark:border-gray-700 rounded-lg p-3">
            <div className="text-gray-500 text-sm">Action</div>
            <div className="font-bold text-black dark:text-white text-sm md:text-md">
              {action}
            </div>
          </div>

          <div className="flex justify-between items-center border border-gray-200 dark:border-gray-700 rounded-lg p-3">
            <div className="text-gray-500 text-sm">Duration</div>
            <div className="font-bold text-black dark:text-white text-sm md:text-md text-right">
              {duration}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  )
}

export default Register
