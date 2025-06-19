import { createContext, useContext, useRef, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import type { Location } from 'react-router-dom'

const PreviousLocationContext = createContext<{
  previousLocation: Location | null;
  setPreviousLocation: () => void;
}>({
  previousLocation: null,
  setPreviousLocation: () => {},
})

export function PreviousLocationProvider({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const prevRef = useRef<Location | null>(null)

  // On each change of `location.pathname`, update prevRef
  useEffect(() => {
    prevRef.current = location
  }, [location])

  return (
    <PreviousLocationContext.Provider
      value={{
        previousLocation: prevRef.current,
        setPreviousLocation: () => {
          prevRef.current = location;
        },
      }}
    >
      {children}
    </PreviousLocationContext.Provider>
  )
}

// Custom hook to consume it
export function usePreviousLocation() {
  const ctx = useContext(PreviousLocationContext)
  return ctx.previousLocation
}
