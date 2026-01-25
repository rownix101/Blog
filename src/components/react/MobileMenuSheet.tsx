import { useEffect, useState } from 'react'
import { Check, ExternalLink, Menu, Search, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { cn } from '@/lib/utils'

type MobileMenuItem = {
  href: string
  label: string
  isExternal: boolean
  isInside: boolean
}

type MobileLanguageItem = {
  code: string
  label: string
  href: string
  isActive: boolean
}

interface MobileMenuSheetProps {
  items: MobileMenuItem[]
  languages: MobileLanguageItem[]
  searchLabel: string
  languageLabel: string
}

const MobileMenuSheet = ({
  items,
  languages,
  searchLabel,
  languageLabel,
}: MobileMenuSheetProps) => {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const handleViewTransitionStart = () => {
      setOpen(false)
    }
    document.addEventListener('astro:before-swap', handleViewTransitionStart)
    return () => {
      document.removeEventListener(
        'astro:before-swap',
        handleViewTransitionStart,
      )
    }
  }, [])

  const handleSearch = () => {
    const button = document.querySelector('[data-search-button]')
    if (button instanceof HTMLElement) {
      button.click()
      setOpen(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="md:hidden"
          aria-label="Toggle menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className="h-[100dvh] w-full max-w-none gap-0 overflow-hidden rounded-none p-0 shadow-lg"
      >
        <SheetTitle className="sr-only">Menu</SheetTitle>
        <SheetDescription className="sr-only">Navigation menu</SheetDescription>
        <div className="border-border/60 flex items-center justify-end border-b px-4 py-3 pt-[env(safe-area-inset-top,0px)]">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="focus:ring-ring rounded-md p-2 opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-none"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="min-h-0 flex-1 overflow-y-auto px-2 pt-4 pb-[calc(env(safe-area-inset-bottom,0px)+0.75rem)]">
          <button
            type="button"
            onClick={handleSearch}
            className="border-border/60 bg-background hover:bg-muted flex w-full items-center gap-3 rounded-md border px-3 py-2 text-left text-base font-medium transition-colors"
          >
            <Search className="h-4 w-4" />
            <span>{searchLabel}</span>
          </button>
          <div className="text-muted-foreground mt-4 px-2 text-xs font-semibold tracking-wider uppercase">
            {languageLabel}
          </div>
          <div className="mt-2 flex flex-col gap-1">
            {languages.map((language) => (
              <a
                key={language.code}
                href={language.href}
                className={cn(
                  'flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  language.isActive
                    ? 'bg-accent/60 text-foreground'
                    : 'text-foreground/80 hover:text-foreground hover:bg-accent/30',
                )}
                onClick={() => setOpen(false)}
              >
                <span>{language.label}</span>
                {language.isActive && <Check className="h-4 w-4" />}
              </a>
            ))}
          </div>
          <div className="border-border/60 my-4 border-t" aria-hidden="true" />
          {items.map((item) => (
            <a
              key={item.href}
              href={item.href}
              target={item.isExternal ? '_blank' : '_self'}
              rel={item.isExternal ? 'noopener noreferrer' : undefined}
              className={cn(
                'flex w-full items-center gap-2 rounded-md px-3 py-2 text-base font-medium capitalize transition-colors',
                item.isInside
                  ? 'text-primary hover:text-primary/80'
                  : 'text-foreground/80 hover:text-foreground',
              )}
              onClick={() => setOpen(false)}
            >
              <span>{item.label}</span>
              {item.isExternal && (
                <ExternalLink
                  className={cn(
                    'size-3.5 flex-shrink-0 opacity-70',
                    item.isInside && 'text-primary opacity-80',
                  )}
                  aria-hidden="true"
                />
              )}
            </a>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  )
}

export default MobileMenuSheet
