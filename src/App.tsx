import { RecipeList } from './components/RecipeList'
import { RecipeTimeline } from './components/RecipeTimeline'
import { InteractiveEngine } from './components/InteractiveEngine'

function App() {
  return (
    <div className="flex min-h-screen flex-col lg:h-screen lg:flex-row lg:overflow-hidden">
      <InteractiveEngine />
      <div className="max-h-[40vh] shrink-0 overflow-hidden border-b border-ink-200/80 lg:max-h-none lg:h-full lg:border-b-0">
        <RecipeList />
      </div>
      <main className="flex min-h-0 min-w-0 flex-1 flex-col">
        <RecipeTimeline />
      </main>
    </div>
  )
}

export default App
