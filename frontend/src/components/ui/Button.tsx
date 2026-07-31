'use client'
import { ButtonHTMLAttributes, forwardRef } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-1.5 font-semibold rounded-xl transition-all active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 whitespace-nowrap',
  {
    variants: {
      variant: {
        primary:   'bg-gradient-brand text-white shadow-soft hover:brightness-110 hover:shadow-glow-blue',
        secondary: 'bg-bg-card2 text-text-primary border border-white/[0.08] hover:bg-bg-hover',
        ghost:     'text-text-secondary hover:text-text-primary hover:bg-white/[0.06]',
        danger:    'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20',
        success:   'bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20',
      },
      size: {
        sm: 'text-xs px-3 py-1.5',
        md: 'text-sm px-4 py-2',
        lg: 'text-sm px-5 py-2.5',
        icon: 'p-2',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  }
)

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  loading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, disabled, children, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 size={14} className="animate-spin" />}
      {children}
    </button>
  )
)
Button.displayName = 'Button'
