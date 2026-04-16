import { cn } from '@/lib/utils'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple'
  className?: string
}

export default function Badge({ children, variant = 'default', className }: BadgeProps) {
  const variants = {
    default: 'bg-[#1e1e35] text-[#8888aa]',
    success: 'bg-[#052e16] text-green-400 border border-green-900',
    warning: 'bg-[#2d1b00] text-amber-400 border border-amber-900',
    danger: 'bg-[#2d0000] text-red-400 border border-red-900',
    info: 'bg-[#0c1a2e] text-blue-400 border border-blue-900',
    purple: 'bg-[#1a1040] text-violet-400 border border-violet-900',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  )
}
