import classNames from 'classnames'
import { forwardRef, useImperativeHandle } from 'react'
import { useTimer } from 'react-timer-hook'

import { TimerProgress } from './timer-progress'

export type TimerProps = {
  variant?: TimerVariant
  size?: TimerSize
  className?: string
  expiryTimestamp: Date
  autoStart?: boolean
  showTitle?: boolean
  showDays?: boolean
  showHours?: boolean
  onExpire?: () => void
}

const sizeClasses: Record<TimerSize, string> = {
  xs: 'timer-xs',
  sm: 'timer-sm',
  md: 'timer-md',
  lg: 'timer-lg',
}

const calculateTotalSeconds = (
  days: number,
  hours: number,
  minutes: number,
  seconds: number,
): number => {
  return days * 24 * 60 * 60 + hours * 60 * 60 + minutes * 60 + seconds
}

export const Timer = forwardRef<TimerRef, TimerProps>(
  (
    {
      autoStart,
      onExpire,
      expiryTimestamp,
      size = 'md',
      showDays,
      showHours = true,
      variant = 'primary',
      showTitle = true,
      className,
    },
    ref,
  ) => {
    const { days, hours, minutes, seconds, start, pause, resume, restart } =
      useTimer({
        autoStart,
        onExpire,
        expiryTimestamp,
      })

    const classes = classNames(
      'timer',
      className,
      { [sizeClasses[size]]: size },
      { [`timer-${variant}`]: variant },
    )

    useImperativeHandle(ref, () => ({
      start,
      pause,
      resume,
      restart,
    }))

    const maxDaysValue = calculateTotalSeconds(30, 0, 0, 0)
    const maxHoursValue = calculateTotalSeconds(0, 24, 0, 0)
    const maxMinutesValue = calculateTotalSeconds(0, 0, 60, 0)
    const maxSecondsValue = calculateTotalSeconds(0, 0, 0, 60)

    const daysValue = calculateTotalSeconds(days, 0, 0, 0)
    const hoursValue = calculateTotalSeconds(0, hours, 0, 0)
    const minutesValue = calculateTotalSeconds(0, 0, minutes, 0)
    const secondsValue = calculateTotalSeconds(0, 0, 0, seconds)

    const renderTimerProgress = (
      unit: number,
      maxValue: number,
      value: number,
      datePart: string,
    ) => {
      return (
        <TimerProgress
          key={datePart}
          datePart={datePart}
          maxValue={maxValue}
          value={value}
          size={size}
          variant={variant}
          showTitle={showTitle}
        >
          {unit}
        </TimerProgress>
      )
    }

    const timerProgressValues = [
      {
        show: seconds !== null,
        unit: seconds,
        datePart: 'seconds',
        maxValue: maxSecondsValue,
        value: secondsValue,
      },
      {
        show: minutes !== null,
        unit: minutes,
        datePart: 'minutes',
        maxValue: maxMinutesValue,
        value: minutesValue,
      },
      {
        show: showHours && hours !== null,
        unit: hours,
        datePart: 'hours',
        maxValue: maxHoursValue,
        value: hoursValue,
      },
      {
        show: showDays && days !== null,
        unit: days,
        datePart: 'days',
        maxValue: maxDaysValue,
        value: daysValue,
      },
    ]

    return (
      <div className={classes} lang="en">
        {timerProgressValues.map(
          ({ unit, maxValue, value, datePart, show }, index) =>
            show ? renderTimerProgress(unit, maxValue, value, datePart) : null,
        )}
      </div>
    )
  },
)

Timer.displayName = 'Timer'
