import classNames from 'classnames'
import { ReactNode, useEffect, useState } from 'react'

import { padWithZero } from '@/utils/string'

type TimerProgressProps = {
  className?: string
  value: number
  size?: TimerSize
  variant?: TimerVariant
  maxValue: number
  showTitle?: boolean
  datePart: string
  children: ReactNode
}

const progressSizes: Record<TimerSize, number> = {
  xs: 24,
  sm: 34,
  md: 43,
  lg: 54,
}

export const TimerProgress: React.FC<TimerProgressProps> = ({
  value,
  size = 'md',
  variant = 'primary',
  children,
  className,
  maxValue,
  showTitle = true,
  datePart,
}) => {
  const circumference = Math.round(2 * progressSizes[size] * Math.PI)
  const progress = Math.round(
    circumference - (circumference * value) / maxValue,
  )

  const [offset, setOffset] = useState(progress)

  useEffect(() => {
    setOffset(progress)
  }, [progress])

  const classes = classNames('timer-progress', className, {
    [`timer-progress-${variant}`]: variant,
  })

  return (
    <div className={classes} lang="en">
      <span>{children != null ? padWithZero(children.toString(), 2) : ''}</span>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        version="1.1"
        width={`${progressSizes[size] * 2 + 6}px`}
        height={`${progressSizes[size] * 2 + 6}px`}
      >
        <defs>
          <linearGradient id="gradientColor">
            <stop offset="0%" stopColor={'var( --color-gradient-first)'}></stop>
            <stop
              offset="100%"
              stopColor={'var( --color-gradient-second)'}
            ></stop>
          </linearGradient>
        </defs>
        <circle
          className="timer-progress-back-bar"
          cx={progressSizes[size] + 3}
          cy={progressSizes[size] + 3}
          r={progressSizes[size]}
          style={{
            strokeDashoffset: 0,
            strokeDasharray: circumference,
            strokeWidth: progressSizes[size] / 10,
          }}
        />
        <circle
          className="timer-progress-front-bar"
          cx={progressSizes[size] + 3}
          cy={progressSizes[size] + 3}
          r={progressSizes[size]}
          style={{
            strokeDashoffset: offset,
            strokeDasharray: circumference,
            strokeWidth: progressSizes[size] / 10,
          }}
        />
      </svg>
      {showTitle && (
        <label className="timer-progress-date-part">{datePart}</label>
      )}
    </div>
  )
}
