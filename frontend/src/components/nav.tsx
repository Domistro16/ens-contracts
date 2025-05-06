import { ConnectButton } from "@rainbow-me/rainbowkit";

export default function Nav(){
    return(
        <header className="w-full flex justify-between items-center px-10">
          <div className="text-xl font-bold text-blue-500">ens</div>
          <div className="flex items-center space-x-6">
            <span className="text-gray-300">My Names</span>
           <ConnectButton />
          </div>
    </header>
    )
}