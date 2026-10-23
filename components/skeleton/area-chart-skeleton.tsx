'use client'

import { Skeleton } from '@/components/ui/skeleton'

export function AreaChartSkeleton() {
  return (
    <div className="space-y-3">
      <div className="from-card via-muted/30 to-card relative h-48 w-full overflow-hidden rounded-lg bg-gradient-to-br">
        {/* Y-axis labels */}
        <div className="absolute top-2 bottom-8 left-2 flex flex-col justify-between">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton
              key={i}
              className="from-muted-foreground/30 to-muted-foreground/10 h-2 w-6 bg-gradient-to-r"
              style={{ animationDelay: `${i * 0.1}s` }}
            />
          ))}
        </div>

        {/* X-axis labels */}
        <div className="absolute right-0 bottom-1 left-0 flex justify-around">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton
              key={i}
              className="from-muted-foreground/30 to-muted-foreground/10 h-2 w-8 bg-gradient-to-r"
              style={{ animationDelay: `${i * 0.2}s` }}
            />
          ))}
        </div>

        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="from-accent to-primary absolute h-1.5 w-1.5 animate-pulse rounded-full bg-gradient-to-r"
            style={{
              left: `${20 + i * 15}%`,
              top: `${15 + Math.sin(i) * 10}%`,
              animationDelay: `${i * 0.4}s`,
            }}
          />
        ))}
      </div>

      <div className="border-border/30 flex flex-wrap justify-center gap-4 pt-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="group flex cursor-pointer items-center gap-2"
            style={{ animationDelay: `${i * 0.15}s` }}
          >
            <Skeleton className="from-primary to-secondary/60 h-3 w-3 rounded-full bg-gradient-to-br" />
            <Skeleton className="from-foreground/15 via-foreground/8 to-foreground/15 h-3 w-12 bg-gradient-to-r" />
          </div>
        ))}
      </div>
    </div>
  )
}
