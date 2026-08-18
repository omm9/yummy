import { useEffect, useState } from 'react'
import { RecipeList } from './components/RecipeList'
import { RecipeTimeline } from './components/RecipeTimeline'
import { InteractiveEngine } from './components/InteractiveEngine'
import { ModeToggle } from './components/ModeToggle'
import { PhonePreview } from './components/phone/PhonePreview'

function App() {
  const [path, setPath] = useState(() => window.location.pathname)

  useEffect(() => {
    const sync = () => setPath(window.location.pathname)
    window.addEventListener('popstate', sync)
    return () => window.removeEventListener('popstate', sync)
  }, [])

  const phonePreview = import.meta.env.DEV && path === '/phone'

  return (
    <>
      <InteractiveEngine />
      {phonePreview ? (
        <PhonePreview />
      ) : (
        <div className="flex min-h-screen flex-col lg:h-screen lg:flex-row lg:overflow-hidden">
          {import.meta.env.DEV ? <ModeToggle phone={false} /> : null}
          <div className="max-h-[40vh] shrink-0 overflow-hidden border-b border-ink-200/80 lg:max-h-none lg:h-full lg:border-b-0">
            <RecipeList />
          </div>
          <main className="flex min-h-0 min-w-0 flex-1 flex-col">
            <RecipeTimeline />
          </main>
        </div>
      )}
    </>
  )
}

export default App
