import { cn } from '@/lib/utils'

interface CardProps {
  children?: React.ReactNode
  className?: string
  hover?: boolean
}

export default function Card({ children, className, hover }: CardProps) {
  return (
    <div
      className={cn(
        'bg-[#12121f] border border-[#1e1e35] rounded-xl p-5',
        hover && 'hover:border-[#6c63ff33] transition-colors cursor-pointer',
        className
      )}
    >
      {children}
    </div>
  )
}
