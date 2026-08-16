import * as React from 'react'
import { cva } from 'class-variance-authority'
import type { VariantProps } from 'class-variance-authority'
import { cn } from '../../lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-[3px] border px-1.5 py-0.5 text-[10px] font-mono font-medium tracking-tight select-none transition-colors',
  {
    variants: {
      variant: {
        default:
          'border-[var(--border)] bg-[var(--surface-muted)] text-[var(--foreground)]',
        secondary:
          'border-[var(--border)] bg-transparent text-[var(--muted-foreground)]',
        outline: 'border-[var(--border)] text-[var(--muted-foreground)]',

        critical:
          'border-[color-mix(in_srgb,var(--danger)_35%,transparent)] bg-[var(--danger-soft)] text-[var(--danger-text)]',
        high: 'border-[color-mix(in_srgb,var(--warning)_40%,transparent)] bg-[var(--warning-soft)] text-[var(--warning-text)]',
        medium:
          'border-[color-mix(in_srgb,var(--medium)_35%,transparent)] bg-[var(--medium-soft)] text-[var(--medium-text)]',
        low: 'border-[var(--border)] bg-transparent text-[var(--muted-foreground)]',

        open: 'border-[var(--border-strong)] bg-[var(--surface)] text-[var(--foreground)]',
        investigating:
          'border-[color-mix(in_srgb,var(--warning)_35%,transparent)] bg-[var(--warning-soft)] text-[var(--warning-text)]',
        resolved:
          'border-[color-mix(in_srgb,var(--success)_35%,transparent)] bg-[var(--success-soft)] text-[var(--success-text)]',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

export interface BadgeProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean
}

function Badge({ className, variant, dot, children, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props}>
      {dot && (
        <span
          className={cn(
            'h-1.5 w-1.5 rounded-full shrink-0',
            variant === 'critical' && 'bg-[var(--danger)]',
            variant === 'high' && 'bg-[var(--warning)]',
            variant === 'medium' && 'bg-[var(--medium)]',
            variant === 'low' && 'bg-[var(--border-strong)]',
            variant === 'open' && 'bg-[var(--danger)]',
            variant === 'investigating' && 'bg-[var(--warning)]',
            variant === 'resolved' && 'bg-[var(--success)]',
            !variant || variant === 'default'
              ? 'bg-[var(--muted-foreground)]'
              : '',
          )}
        />
      )}
      {children}
    </div>
  )
}

export { Badge, badgeVariants }
