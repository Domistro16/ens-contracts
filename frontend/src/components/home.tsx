export default function Home() {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center px-4 py-8">
        {/* Header */}
        <header className="w-full max-w-6xl flex justify-between items-center mb-20">
          <div className="text-xl font-bold text-blue-500">ens</div>
          <div className="flex items-center space-x-6">
            <span className="text-gray-300">My Names</span>
            <div className="rounded-full bg-gradient-to-r from-purple-400 to-blue-400 px-4 py-2 text-sm font-medium text-black">
              0x2A0...6E7
            </div>
          </div>
        </header>
  
        {/* Hero Section */}
        <main className="text-center">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-[#FFF700] to-orange-400 text-transparent bg-clip-text">
            Your creator username
          </h1>
          <p className="mt-4 text-gray-400 text-lg max-w-xl mx-auto">
            Your identity across web3, one name for all your crypto addresses,
            and your decentralised website.
          </p>
  
          {/* Search Bar */}
          <div className="mt-10 relative">
            <input
              type="text"
              placeholder="Search for a name"
              className="w-80 md:w-96 px-6 py-4 rounded-xl bg-gray-900 text-white border border-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
  
            {/* Search Results Popup */}
            <div className="absolute left-1/2 transform -translate-x-1/2 mt-2 w-80 md:w-96 bg-gray-800 border border-gray-700 rounded-xl shadow-lg text-left z-10">
              <ul className="divide-y divide-gray-700">
                <li className="px-6 py-3 hover:bg-gray-700 cursor-pointer">desmond.eth</li>
                <li className="px-6 py-3 hover:bg-gray-700 cursor-pointer">admin.eth</li>
                <li className="px-6 py-3 hover:bg-gray-700 cursor-pointer">user123.eth</li>
              </ul>
            </div>
          </div>
        </main>
      </div>
    );
  }
  