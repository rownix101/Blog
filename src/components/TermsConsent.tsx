import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useEffect, useState } from 'react'

interface TermsConsentProps {
  lang: string
}

export function TermsConsent({ lang }: TermsConsentProps) {
  const [open, setOpen] = useState(false)
  const isEn = lang === 'en'

  useEffect(() => {
    const accepted = localStorage.getItem('terms_accepted')
    // Don't show modal on privacy or terms pages
    const isPolicyPage =
      window.location.pathname.includes('/privacy') ||
      window.location.pathname.includes('/terms')

    if (!accepted && !isPolicyPage) {
      setOpen(true)
    }
  }, [])

  const handleAccept = () => {
    localStorage.setItem('terms_accepted', 'true')
    setOpen(false)
  }

  const handleDecline = () => {
    if (window.history.length > 1) {
      window.history.back()
    } else {
      window.close() // Try to close tab if no history, though browsers often block this
    }
  }

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      {/* 
         Prevent interaction outside: custom close handling. 
         We don't provide onOpenChange to close it normally to effectively make it modal without dismiss.
         Actually onOpenChange is required by Typescript usually but we can pass empty function or just handle it if user tries to close via ESC (which we want to prevent or treat as decline?) 
         The Dialog primitive from Radix usually allows ESC. We can prevent it by:
         onEscapeKeyDown={(e) => e.preventDefault()}
         onPointerDownOutside={(e) => e.preventDefault()}
         But wait, I need to check if my Dialog component exposes these.
         Looking at the file src/components/ui/dialog.tsx, DialogContent spreads props to DialogPrimitive.Content.
         So I can pass onEscapeKeyDown and onPointerDownOutside to DialogContent.
      */}
      <DialogContent
        className="sm:max-w-md"
        onEscapeKeyDown={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>
            {isEn ? 'Terms of Service & Privacy Policy' : '服务条款与隐私政策'}
          </DialogTitle>
          <DialogDescription>
            {isEn
              ? 'Please read and accept our Terms of Service and Privacy Policy to continue using this website.'
              : '请阅读并接受我们的服务条款和隐私政策以继续使用本网站。'}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-4">
          <p className="text-muted-foreground text-sm">
            {isEn ? (
              <>
                By clicking "Accept", you agree to our{' '}
                <a href="/en/terms" className="text-primary underline">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="/en/privacy" className="text-primary underline">
                  Privacy Policy
                </a>
                .
              </>
            ) : (
              <>
                点击“接受”即表示您同意我们的
                <a href="/zh-cn/terms" className="text-primary underline">
                  服务条款
                </a>
                和
                <a href="/zh-cn/privacy" className="text-primary underline">
                  隐私政策
                </a>
                。
              </>
            )}
          </p>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleDecline}>
            {isEn ? 'Decline' : '拒绝'}
          </Button>
          <Button onClick={handleAccept}>{isEn ? 'Accept' : '接受'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
