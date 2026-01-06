import * as React from 'react'
import { Slot as SlotPrimitive } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded text-sm font-medium transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground hover:bg-primary/90 hover:rotate-[0.5deg] active:rotate-0',
        destructive:
          'bg-destructive text-white hover:bg-destructive/90 hover:rotate-[0.5deg] active:rotate-0 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60',
        outline:
          'border bg-background hover:bg-muted hover:text-foreground hover:-rotate-[0.5deg] active:rotate-0 dark:bg-input/30 dark:border-input dark:hover:bg-input/50',
        muted:
          'bg-muted text-foreground hover:bg-muted/80 hover:rotate-[0.5deg] active:rotate-0',
        ghost:
          'hover:bg-muted hover:text-foreground hover:-rotate-[0.5deg] active:rotate-0 dark:hover:bg-muted/50',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-9 px-4 py-2 has-[>svg]:px-3',
        sm: 'h-8 rounded gap-1.5 px-3 has-[>svg]:px-2.5',
        lg: 'h-10 rounded px-6 has-[>svg]:px-4',
        icon: 'size-9 rounded',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? SlotPrimitive : 'button'

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
