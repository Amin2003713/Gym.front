import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { useIsMobile } from '@/hooks/use-mobile'

export default function SmartHoverCard({
  trigger,
  content,
}: {
  trigger: React.ReactNode
  content: React.ReactNode
}) {
  const isMobile = useIsMobile()
  if (isMobile) {
    // On mobile → use Popover (click)
    return (
      <Popover>
        <PopoverTrigger asChild>{trigger}</PopoverTrigger>
        <PopoverContent className="w-full max-w-md" align="center">
          {content}
        </PopoverContent>
      </Popover>
    )
  }

  // On desktop → use HoverCard (hover)
  return (
    <HoverCard openDelay={100} closeDelay={100}>
      <HoverCardTrigger asChild>{trigger}</HoverCardTrigger>
      <HoverCardContent className="w-full max-w-md" align="center">
        {content}
      </HoverCardContent>
    </HoverCard>
  )
}
