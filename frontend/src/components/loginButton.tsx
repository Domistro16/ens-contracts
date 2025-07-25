export default function LogInButton({
  setLoggedIn,
  loggedIn,
  setShowOnRoot,
}: {
  setLoggedIn: React.Dispatch<React.SetStateAction<boolean>> | null
  loggedIn: boolean
  setShowOnRoot?: React.Dispatch<React.SetStateAction<boolean>>
}) {
  return (
    <button
      className="bg-blue-800 p-8 py-[8px] font-bold rounded-full hover:scale-105 duration-200 cursor-pointer"
      type="button"
      onClick={
        () => {
          setLoggedIn && setLoggedIn(!loggedIn)
          if (location.pathname === '/') {
            setShowOnRoot && setShowOnRoot(true)
          }
        } /* connect() */
      } // connect() should be defined in the parent component
    >
      Login
    </button>
  )
}
