import { forwardRef } from 'react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

const ORB_BACKGROUND = (color: string) =>
  `linear-gradient(145deg, rgba(255,255,255,0.26), rgba(255,255,255,0) 34%), radial-gradient(circle at 70% 75%, rgba(0,0,0,0.34), rgba(0,0,0,0) 50%), ${color}`

const ORB_SHADOW = 'inset -6px -6px 10px rgba(0,0,0,0.24), inset 4px 4px 7px rgba(255,255,255,0.14), 0 3px 8px rgba(0,0,0,0.24)'

interface OrbLinkProps {
  href: string
  color: string
  label: string
}

const OrbLink = forwardRef<HTMLAnchorElement, OrbLinkProps>(({ href, color, label }, ref) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <a
        ref={ref}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={label}
        className="w-6 h-6 rounded-full hover:opacity-85 transition-opacity"
        style={{ background: ORB_BACKGROUND(color), boxShadow: ORB_SHADOW }}
      />
    </TooltipTrigger>
    <TooltipContent>{label}</TooltipContent>
  </Tooltip>
))

OrbLink.displayName = 'OrbLink'

export default OrbLink
