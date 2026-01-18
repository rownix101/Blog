import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { NAV_LINKS } from '@/consts'
import { Menu, ExternalLink } from 'lucide-react'

interface MobileMenuProps {
  lang?: string
}

const MobileMenu = ({ lang = 'zh-cn' }: MobileMenuProps) => {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const handleViewTransitionStart = () => {
      setIsOpen(false)
    }
    document.addEventListener('astro:before-swap', handleViewTransitionStart)
    return () => {
      document.removeEventListener(
        'astro:before-swap',
        handleViewTransitionStart,
      )
    }
  }, [])

  const isExternalLink = (href: string) => {
    return href.startsWith('http')
  }

  const getTranslation = (key: string) => {
    const translations = {
      'zh-cn': {
        'nav.blog': '博客',
        'nav.about': '关于',
        'nav.sponsor': '赞助',
      },
      en: {
        'nav.blog': 'Blog',
        'nav.about': 'About',
        'nav.sponsor': 'Sponsor',
      },
    }
    return translations[lang as keyof typeof translations]?.[key] || key
  }

  const getLocalizedHref = (href: string) => {
    if (isExternalLink(href)) return href
    return `/${lang}${href}`
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={(val) => setIsOpen(val)}>
      <DropdownMenuTrigger asChild onClick={() => setIsOpen((val) => !val)}>
        <Button
          variant="outline"
          size="icon"
          className="md:hidden"
          title="Menu"
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-background">
        {NAV_LINKS.map((item) => {
          const isExternal = isExternalLink(item.href)
          const isInsideLink = item.label.toLowerCase() === 'inside'
          const translatedLabel = getTranslation(
            `nav.${item.label.toLowerCase()}`,
          )
          const localizedHref = getLocalizedHref(item.href)
          return (
            <DropdownMenuItem key={item.href} asChild>
              <a
                href={localizedHref}
                target={isExternal ? '_blank' : '_self'}
                rel={isExternal ? 'noopener noreferrer' : undefined}
                className={`flex w-full items-center gap-2 text-lg font-medium capitalize ${
                  isInsideLink
                    ? 'text-primary hover:text-primary/80'
                    : isExternal
                      ? 'text-primary/90 hover:text-primary'
                      : ''
                }`}
                onClick={() => setIsOpen(false)}
              >
                <span>{translatedLabel}</span>
                {isExternal && (
                  <ExternalLink
                    className={`h-4 w-4 flex-shrink-0 opacity-80 ${isInsideLink ? 'text-primary' : ''}`}
                    aria-hidden="true"
                  />
                )}
              </a>
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default MobileMenu
