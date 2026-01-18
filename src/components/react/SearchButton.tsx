import React, { useState, useEffect, lazy, Suspense } from 'react'
import { Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ErrorBoundary } from './ErrorBoundary'

// Lazy load the heavy SearchDialog component (includes flexsearch ~20KB)
const SearchDialog = lazy(() => import('./SearchDialog'))

interface SearchButtonProps {
  lang?: string
}

const SearchButton: React.FC<SearchButtonProps> = ({ lang = 'zh-cn' }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [hasOpened, setHasOpened] = useState(false)

  // Keyboard shortcut: Cmd/Ctrl + K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input, textarea, or contenteditable
      const target = e.target as HTMLElement
      const isInput =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable

      if ((e.metaKey || e.ctrlKey) && e.key === 'k' && !isInput) {
        e.preventDefault()
        setIsOpen(true)
        setHasOpened(true)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleOpen = () => {
    setIsOpen(true)
    setHasOpened(true)
  }

  return (
    <ErrorBoundary>
      <Button
        variant="outline"
        size="icon"
        onClick={handleOpen}
        className="md:hover:bg-muted size-9 border md:-my-2 md:-me-2 md:size-8 md:border-0 md:bg-transparent"
        title="Search (⌘K)"
        aria-label="Search blog posts"
        aria-expanded={isOpen}
        aria-haspopup="dialog"
      >
        <Search className="h-5 w-5 md:h-4 md:w-4" />
        <span className="sr-only">Search</span>
      </Button>
      {/* Only load SearchDialog after first open to save initial bundle */}
      {hasOpened && (
        <ErrorBoundary>
          <Suspense fallback={null}>
            <SearchDialog open={isOpen} onOpenChange={setIsOpen} lang={lang} />
          </Suspense>
        </ErrorBoundary>
      )}
    </ErrorBoundary>
  )
}

export default SearchButton
