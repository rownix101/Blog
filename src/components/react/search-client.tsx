import React, { useEffect, useState } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import SearchDialog from './SearchDialog'

type SearchApi = {
  open: () => void
}

let root: Root | null = null
let container: HTMLElement | null = null
let setOpenRef: ((open: boolean) => void) | null = null
let pendingOpen = false
let activeLang: string | null = null

const SearchDialogHost: React.FC<{ lang: string }> = ({ lang }) => {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    setOpenRef = setOpen
    if (pendingOpen) {
      setOpen(true)
      pendingOpen = false
    }
    return () => {
      setOpenRef = null
    }
  }, [])

  return <SearchDialog open={open} onOpenChange={setOpen} lang={lang} />
}

export function initSearchDialog({ lang }: { lang: string }): SearchApi {
  if (!root) {
    container = document.createElement('div')
    container.setAttribute('data-search-root', '')
    document.body.appendChild(container)
    root = createRoot(container)
  }

  if (activeLang !== lang) {
    root.render(<SearchDialogHost lang={lang} />)
    activeLang = lang
  }

  return {
    open: () => {
      if (setOpenRef) {
        setOpenRef(true)
        return
      }
      pendingOpen = true
    },
  }
}
