import { useEffect, useMemo, useRef, useState } from 'react'
import gashaponImage from './assets/gashapon.png'
import elementsData from './data/elements.json'
import { Card, CardContent } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { siteConfig } from './config/siteConfig'
import {
  layoutNextLine,
  prepareWithSegments,
  type LayoutCursor,
} from '@chenglou/pretext'

interface Element {
  id: number
  title: string
  description: string
  url: string
}

interface Ball {
  id: number
  element: Element
  x: number
  y: number
  vx: number
  vy: number
  r: number
  color: string
  paused: boolean
}

interface OpenedCapsule {
  element: Element
  color: string
  radius: number
}

interface PositionedLine {
  text: string
  x: number
  y: number
}

type Interval = {
  left: number
  right: number
}

type ObstacleRect = {
  left: number
  top: number
  right: number
  bottom: number
}

const FOOTER_HEIGHT = siteConfig.layout.footerReservedHeight
const EDITORIAL_FONT_FAMILY = '"Iowan Old Style", "Palatino Linotype", "Book Antiqua", Palatino, serif'
const TEXT_LAYOUT_SAFETY_BUFFER = 20
const ORB_COLORS = siteConfig.balls.colors

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min)
}

function carveTextLineSlots(base: Interval, blocked: Interval[]): Interval[] {
  let slots = [base]
  for (let i = 0; i < blocked.length; i++) {
    const blockedInterval = blocked[i]!
    const next: Interval[] = []
    for (let j = 0; j < slots.length; j++) {
      const slot = slots[j]!
      if (blockedInterval.right <= slot.left || blockedInterval.left >= slot.right) {
        next.push(slot)
        continue
      }
      if (blockedInterval.left > slot.left) {
        next.push({ left: slot.left, right: blockedInterval.left })
      }
      if (blockedInterval.right < slot.right) {
        next.push({ left: blockedInterval.right, right: slot.right })
      }
    }
    slots = next
  }

  return slots.filter(slot => slot.right - slot.left >= 48)
}

function circleIntervalForBand(
  cx: number,
  cy: number,
  r: number,
  bandTop: number,
  bandBottom: number,
): Interval | null {
  if (bandTop >= cy + r || bandBottom <= cy - r) return null
  const minDy = cy >= bandTop && cy <= bandBottom
    ? 0
    : cy < bandTop
      ? bandTop - cy
      : cy - bandBottom
  if (minDy >= r) return null
  const maxDx = Math.sqrt(r * r - minDy * minDy)
  return { left: cx - maxDx - 8, right: cx + maxDx + 8 }
}

function resolveBallRectCollision(ball: Ball, rect: ObstacleRect): void {
  const nearestX = clamp(ball.x, rect.left, rect.right)
  const nearestY = clamp(ball.y, rect.top, rect.bottom)
  const dx = ball.x - nearestX
  const dy = ball.y - nearestY
  const distSq = dx * dx + dy * dy
  if (distSq >= ball.r * ball.r) return

  const dist = Math.sqrt(Math.max(distSq, 0.0001))
  const nx = dx / dist
  const ny = dy / dist

  ball.x = nearestX + nx * (ball.r + 1)
  ball.y = nearestY + ny * (ball.r + 1)

  const dot = ball.vx * nx + ball.vy * ny
  if (dot < 0) {
    ball.vx -= 2 * dot * nx
    ball.vy -= 2 * dot * ny
    ball.vx *= 0.92
    ball.vy *= 0.92
  }
}

function rectsOverlap(a: ObstacleRect, b: ObstacleRect): boolean {
  return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top
}

function App() {
  const [isStretching, setIsStretching] = useState(false)
  const [availableElements, setAvailableElements] = useState<Element[]>([])
  const [currentElement, setCurrentElement] = useState<Element | null>(null)
  const [floatingBall, setFloatingBall] = useState<Ball | null>(null)
  const [openedCapsules, setOpenedCapsules] = useState<Record<number, OpenedCapsule>>({})
  const [titleRect, setTitleRect] = useState<DOMRect | null>(null)
  const [descriptionRect, setDescriptionRect] = useState<DOMRect | null>(null)
  const [viewportWidth, setViewportWidth] = useState(() => window.innerWidth)
  const pageRef = useRef<HTMLDivElement>(null)
  const gashaponRef = useRef<HTMLImageElement>(null)
  const headerTitleRef = useRef<HTMLHeadingElement>(null)
  const githubButtonRef = useRef<HTMLAnchorElement>(null)
  const soundcloudButtonRef = useRef<HTMLAnchorElement>(null)
  const linkedInButtonRef = useRef<HTMLAnchorElement>(null)
  const footerDotsRef = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLDivElement>(null)
  const descriptionRef = useRef<HTMLDivElement>(null)
  const floatingBallRef = useRef<Ball | null>(null)

  const isMobileLayout = viewportWidth < 768
  const titleFontSize = isMobileLayout
    ? clamp(Math.round(viewportWidth * 0.11), 34, 52)
    : siteConfig.content.titleSize
  const bodyFontSize = isMobileLayout
    ? clamp(Math.round(viewportWidth * 0.05), 17, 22)
    : siteConfig.content.bodySize
  const titleLineHeight = Math.round(titleFontSize * 1.05)
  const descriptionLineHeight = Math.round(bodyFontSize * 1.5)
  const titleFont = `700 ${titleFontSize}px ${EDITORIAL_FONT_FAMILY}`
  const descriptionFont = `400 ${bodyFontSize}px ${EDITORIAL_FONT_FAMILY}`
  const headerFontSize = isMobileLayout
    ? clamp(Math.round(viewportWidth * 0.11), 34, 42)
    : siteConfig.typography.headerSize
  const footerFontSize = isMobileLayout ? 14 : siteConfig.typography.footerSize
  const gashaponWidth = isMobileLayout
    ? clamp(Math.round(viewportWidth * 0.62), 200, 270)
    : siteConfig.layout.gashaponWidth
  const gashaponMaxWidth = isMobileLayout
    ? clamp(Math.round(viewportWidth * 0.74), 250, 340)
    : siteConfig.layout.gashaponMaxWidth
  const gashaponOffsetX = isMobileLayout ? 0 : siteConfig.layout.gashaponOffsetX
  const gashaponOffsetY = isMobileLayout ? 0 : siteConfig.layout.gashaponOffsetY
  const ballSpawnMargin = isMobileLayout ? 48 : 96
  const ballSizeMin = isMobileLayout
    ? Math.round(siteConfig.balls.size.min * 0.45)
    : siteConfig.balls.size.min
  const ballSizeMax = isMobileLayout
    ? Math.round(siteConfig.balls.size.max * 0.45)
    : siteConfig.balls.size.max
  const ballSpawnSpeedMin = isMobileLayout
    ? siteConfig.balls.speed.spawnMin * 0.65
    : siteConfig.balls.speed.spawnMin
  const ballSpawnSpeedMax = isMobileLayout
    ? siteConfig.balls.speed.spawnMax * 0.65
    : siteConfig.balls.speed.spawnMax
  const ballFloatSpeedMin = isMobileLayout
    ? siteConfig.balls.speed.floatMin * 0.65
    : siteConfig.balls.speed.floatMin
  const ballFloatSpeedMax = isMobileLayout
    ? siteConfig.balls.speed.floatMax * 0.65
    : siteConfig.balls.speed.floatMax
  const socialButtonColors = siteConfig.buttons.colors
  const githubButtonColor = socialButtonColors[0] ?? '#6b7280'
  const soundcloudButtonColor = socialButtonColors[1] ?? '#fb923c'
  const linkedInButtonColor = socialButtonColors[2] ?? '#60a5fa'

  const getSafeSpawnPosition = (radius: number) => {
    if (!pageRef.current) return null
    const pageRect = pageRef.current.getBoundingClientRect()
    const safeMargin = ballSpawnMargin
    const minX = safeMargin + radius
    const maxX = Math.max(minX + 1, pageRect.width - safeMargin - radius)
    const minY = safeMargin + radius
    const maxY = Math.max(minY + 1, pageRect.height - FOOTER_HEIGHT - safeMargin - radius)

    const gashaponRect = gashaponRef.current?.getBoundingClientRect()
    const blocked = gashaponRect
      ? {
          left: gashaponRect.left - pageRect.left - 16,
          top: gashaponRect.top - pageRect.top - 16,
          right: gashaponRect.right - pageRect.left + 16,
          bottom: gashaponRect.bottom - pageRect.top + 16,
        }
      : null

    for (let i = 0; i < 80; i++) {
      const candidateX = randomBetween(minX, maxX)
      const candidateY = randomBetween(minY, maxY)
      if (!blocked) return { x: candidateX, y: candidateY }
      const ballRect: ObstacleRect = {
        left: candidateX - radius,
        top: candidateY - radius,
        right: candidateX + radius,
        bottom: candidateY + radius,
      }
      if (!rectsOverlap(ballRect, blocked)) {
        return { x: candidateX, y: candidateY }
      }
    }

    if (blocked) {
      const belowBlockedY = blocked.bottom + radius + 24
      if (belowBlockedY <= maxY) {
        return {
          x: randomBetween(minX, maxX),
          y: belowBlockedY,
        }
      }

      const aboveBlockedY = blocked.top - radius - 24
      if (aboveBlockedY >= minY) {
        return {
          x: randomBetween(minX, maxX),
          y: aboveBlockedY,
        }
      }
    }

    return {
      x: randomBetween(minX, maxX),
      y: clamp(pageRect.height * 0.78, minY, maxY),
    }
  }

  useEffect(() => {
    const onResize = () => setViewportWidth(window.innerWidth)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    floatingBallRef.current = floatingBall
  }, [floatingBall])

  const preparedTitle = useMemo(() => {
    if (!currentElement?.title) return null
    return prepareWithSegments(currentElement.title.toUpperCase(), titleFont)
  }, [currentElement?.title, titleFont])

  const expandedDescription = useMemo(() => {
    if (!currentElement?.description) return ''
    return currentElement.description.trim()
  }, [currentElement?.description])

  const preparedDescription = useMemo(() => {
    if (!expandedDescription) return null
    return prepareWithSegments(expandedDescription, descriptionFont)
  }, [descriptionFont, expandedDescription])

  const handleFloatingBallClick = () => {
    const current = floatingBallRef.current
    if (!current) return

    setCurrentElement(current.element)
    if (current.element.url) {
      window.open(current.element.url, '_blank', 'noopener,noreferrer')
    }

    setFloatingBall(prev => {
      if (!prev) return prev
      return {
        ...prev,
        paused: true,
      }
    })
  }

  const titleLines = useMemo(() => {
    if (!preparedTitle || !titleRect || !pageRef.current) return [] as PositionedLine[]

    const pageRect = pageRef.current.getBoundingClientRect()
    const regionX = titleRect.left - pageRect.left
    const regionY = titleRect.top - pageRect.top
    const regionW = titleRect.width
    const maxLines = isMobileLayout ? 999 : Math.floor(titleRect.height / titleLineHeight)

    const lines: PositionedLine[] = []
    let cursor: LayoutCursor = { segmentIndex: 0, graphemeIndex: 0 }
    let lineTop = 0

    while (lines.length < maxLines) {
      const bandTop = regionY + lineTop
      const bandBottom = bandTop + titleLineHeight
      const blocked: Interval[] = []

      const activeBalls = floatingBall ? [floatingBall] : []
      for (let i = 0; i < activeBalls.length; i++) {
        const ball = activeBalls[i]!
        const interval = circleIntervalForBand(ball.x, ball.y, ball.r, bandTop, bandBottom)
        if (interval === null) continue
        blocked.push({
          left: interval.left - regionX,
          right: interval.right - regionX,
        })
      }

      const slots = carveTextLineSlots({ left: 0, right: regionW }, blocked)
      if (slots.length === 0) {
        lineTop += titleLineHeight
        continue
      }

      const bestSlot = slots.reduce((best, slot) => {
        const bestWidth = best.right - best.left
        const slotWidth = slot.right - slot.left
        return slotWidth > bestWidth ? slot : best
      })

      const availableWidth = Math.max(24, bestSlot.right - bestSlot.left - TEXT_LAYOUT_SAFETY_BUFFER)
      const line = layoutNextLine(preparedTitle, cursor, availableWidth)
      if (line === null) break
      lines.push({ text: line.text, x: bestSlot.left, y: lineTop })
      cursor = line.end
      lineTop += titleLineHeight
    }

    return lines
  }, [floatingBall, isMobileLayout, preparedTitle, titleLineHeight, titleRect])

  const descriptionLines = useMemo(() => {
    if (!preparedDescription || !descriptionRect || !pageRef.current) return [] as PositionedLine[]

    const pageRect = pageRef.current.getBoundingClientRect()
    const regionX = descriptionRect.left - pageRect.left
    const regionY = descriptionRect.top - pageRect.top
    const regionW = descriptionRect.width
    const maxLines = isMobileLayout ? 999 : Math.floor(descriptionRect.height / descriptionLineHeight)

    const lines: PositionedLine[] = []
    let cursor: LayoutCursor = { segmentIndex: 0, graphemeIndex: 0 }
    let lineTop = 0

    while (lines.length < maxLines) {
      const bandTop = regionY + lineTop
      const bandBottom = bandTop + descriptionLineHeight
      const blocked: Interval[] = []

      const activeBalls = floatingBall ? [floatingBall] : []
      for (let i = 0; i < activeBalls.length; i++) {
        const ball = activeBalls[i]!
        const interval = circleIntervalForBand(ball.x, ball.y, ball.r, bandTop, bandBottom)
        if (interval === null) continue
        blocked.push({
          left: interval.left - regionX,
          right: interval.right - regionX,
        })
      }

      const slots = carveTextLineSlots({ left: 0, right: regionW }, blocked)
      if (slots.length === 0) {
        lineTop += descriptionLineHeight
        continue
      }

      const bestSlot = slots.reduce((best, slot) => {
        const bestWidth = best.right - best.left
        const slotWidth = slot.right - slot.left
        return slotWidth > bestWidth ? slot : best
      })

      const availableWidth = Math.max(24, bestSlot.right - bestSlot.left - TEXT_LAYOUT_SAFETY_BUFFER)
      const line = layoutNextLine(preparedDescription, cursor, availableWidth)
      if (line === null) break
      lines.push({ text: line.text, x: bestSlot.left, y: lineTop })
      cursor = line.end
      lineTop += descriptionLineHeight
    }

    return lines
  }, [descriptionLineHeight, floatingBall, isMobileLayout, preparedDescription, descriptionRect])

  const mobileTitleHeight = isMobileLayout
    ? Math.max(Math.max(112, titleLineHeight * 2 + 12), titleLines.length * titleLineHeight + 16)
    : siteConfig.content.titleMinHeight
  const mobileDescriptionHeight = isMobileLayout
    ? Math.max(Math.max(210, descriptionLineHeight * 6), descriptionLines.length * descriptionLineHeight + 20)
    : siteConfig.content.bodyMinHeight

  useEffect(() => {
    setAvailableElements([...elementsData])
  }, [])

  useEffect(() => {
    const updateRect = () => {
      setTitleRect(titleRef.current ? titleRef.current.getBoundingClientRect() : null)
      setDescriptionRect(descriptionRef.current ? descriptionRef.current.getBoundingClientRect() : null)
    }

    updateRect()
    window.addEventListener('resize', updateRect)
    window.addEventListener('scroll', updateRect)
    const observer = new ResizeObserver(updateRect)
    if (titleRef.current) observer.observe(titleRef.current)
    if (descriptionRef.current) observer.observe(descriptionRef.current)

    return () => {
      window.removeEventListener('resize', updateRect)
      window.removeEventListener('scroll', updateRect)
      observer.disconnect()
    }
  }, [currentElement])

  useEffect(() => {
    let animationFrameId = 0
    let lastFrame = performance.now()

    const tick = (now: number) => {
      const pageRect = pageRef.current?.getBoundingClientRect()
      if (!pageRect) {
        animationFrameId = requestAnimationFrame(tick)
        return
      }

      const dt = Math.min((now - lastFrame) / 1000, 0.05)
      lastFrame = now
      const obstacleElements = [
        gashaponRef.current,
        headerTitleRef.current,
        githubButtonRef.current,
        soundcloudButtonRef.current,
        linkedInButtonRef.current,
        footerDotsRef.current,
      ]
      const obstacles: ObstacleRect[] = []
      for (let i = 0; i < obstacleElements.length; i++) {
        const element = obstacleElements[i]
        if (!element) continue
        const rect = element.getBoundingClientRect()
        obstacles.push({
          left: rect.left - pageRect.left,
          top: rect.top - pageRect.top,
          right: rect.right - pageRect.left,
          bottom: rect.bottom - pageRect.top,
        })
      }

      const current = floatingBallRef.current
      if (current === null) {
        animationFrameId = requestAnimationFrame(tick)
        return
      }

      const b = { ...current }

      if (b.paused) {
        animationFrameId = requestAnimationFrame(tick)
        return
      }

      b.x += b.vx * dt
      b.y += b.vy * dt

      const speed = Math.hypot(b.vx, b.vy)
      if (speed > 0.001) {
        if (speed < ballFloatSpeedMin) {
          const scale = ballFloatSpeedMin / speed
          b.vx *= scale
          b.vy *= scale
        } else if (speed > ballFloatSpeedMax) {
          const scale = ballFloatSpeedMax / speed
          b.vx *= scale
          b.vy *= scale
        }
      }

      b.vx += Math.sin(now * 0.0007 + b.id) * siteConfig.balls.speed.driftX
      b.vy += Math.cos(now * 0.0009 + b.id) * siteConfig.balls.speed.driftY

      if (b.x - b.r <= 0) {
        b.x = b.r
        b.vx = Math.abs(b.vx)
      }
      if (b.x + b.r >= pageRect.width) {
        b.x = pageRect.width - b.r
        b.vx = -Math.abs(b.vx)
      }
      if (b.y - b.r <= 0) {
        b.y = b.r
        b.vy = Math.abs(b.vy)
      }
      if (b.y + b.r >= pageRect.height - FOOTER_HEIGHT) {
        b.y = pageRect.height - FOOTER_HEIGHT - b.r
        b.vy = -Math.abs(b.vy) * 0.92
      }

      for (let i = 0; i < obstacles.length; i++) {
        resolveBallRectCollision(b, obstacles[i]!)
      }

      floatingBallRef.current = b
      setFloatingBall(b)
      animationFrameId = requestAnimationFrame(tick)
    }

    animationFrameId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(animationFrameId)
  }, [])

  const handleClick = () => {
    if (availableElements.length === 0) return

    setIsStretching(true)
    setTimeout(() => setIsStretching(false), 200)

    const isFirstDraw = Object.keys(openedCapsules).length === 0
    const firstCapsuleIndex = availableElements.findIndex(element => element.id === 1)
    const randomIndex = Math.floor(Math.random() * availableElements.length)
    const selectedIndex = isFirstDraw && firstCapsuleIndex >= 0 ? firstCapsuleIndex : randomIndex
    const drawnElement = availableElements[selectedIndex]

    // Remove the drawn element from available elements
    setAvailableElements(prev => prev.filter((_, index) => index !== selectedIndex))

    // Display in middle column
    setCurrentElement(drawnElement)

    const r = randomBetween(ballSizeMin, ballSizeMax)
    const spawn = getSafeSpawnPosition(r)
    if (!spawn) return
    const color = ORB_COLORS[Math.floor(Math.random() * ORB_COLORS.length)]!
    const angle = Math.random() * Math.PI * 2
    const speed = randomBetween(ballSpawnSpeedMin, ballSpawnSpeedMax)

    setOpenedCapsules(prev => ({
      ...prev,
      [drawnElement.id]: {
        element: drawnElement,
        color,
        radius: r,
      },
    }))

    setFloatingBall({
      id: Date.now() + Math.random(),
      element: drawnElement,
      x: spawn.x,
      y: spawn.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      r,
      color,
      paused: false,
    })
  }

  const activateCapsule = (capsule: OpenedCapsule) => {
    setCurrentElement(capsule.element)
    const r = capsule.radius
    const spawn = getSafeSpawnPosition(r)
    if (!spawn) return
    const angle = Math.random() * Math.PI * 2
    const speed = randomBetween(ballSpawnSpeedMin, ballSpawnSpeedMax)

    setFloatingBall({
      id: Date.now() + Math.random(),
      element: capsule.element,
      x: spawn.x,
      y: spawn.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      r,
      color: capsule.color,
      paused: false,
    })
  }

  return (
    <TooltipProvider>
      <div
        ref={pageRef}
        className={`relative ${isMobileLayout ? 'overflow-visible' : 'overflow-hidden'}`}
        style={{
          height: isMobileLayout ? 'auto' : '100dvh',
          minHeight: '100dvh',
          background: siteConfig.theme.backgroundColor,
          color: siteConfig.theme.fontColor,
        }}
      >
        {floatingBall && (
          <button
            key={floatingBall.id}
            type="button"
            aria-label={`Open link for ${floatingBall.element.title}`}
            onClick={handleFloatingBallClick}
            className="absolute rounded-full z-20 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/70"
            style={{
              left: `${floatingBall.x - floatingBall.r}px`,
              top: `${floatingBall.y - floatingBall.r}px`,
              width: `${floatingBall.r * 2}px`,
              height: `${floatingBall.r * 2}px`,
              background: `linear-gradient(145deg, rgba(255,255,255,0.3), rgba(255,255,255,0) 32%), radial-gradient(circle at 70% 75%, rgba(0,0,0,0.4), rgba(0,0,0,0) 48%), ${floatingBall.color}`,
              boxShadow: floatingBall.paused
                ? 'inset -14px -16px 24px rgba(0,0,0,0.35), inset 10px 10px 14px rgba(255,255,255,0.18), 0 6px 12px rgba(0,0,0,0.32)'
                : 'inset -14px -16px 24px rgba(0,0,0,0.28), inset 10px 10px 14px rgba(255,255,255,0.18), 0 10px 24px rgba(0,0,0,0.46)',
              opacity: floatingBall.paused ? 0.78 : 1,
            }}
          />
        )}

        <header className="relative z-10 px-4 md:px-8 py-4 md:py-6 flex justify-between items-center">
          <div className="flex items-center gap-2 md:gap-4">
            <h1
              ref={headerTitleRef}
              className="font-bold"
              style={{
                fontSize: `${headerFontSize}px`,
                color: siteConfig.theme.fontColor,
              }}
            >
              zatfer
            </h1>
          </div>

          <div className="flex items-center gap-3 md:gap-4">
            {/* GitHub - Black dot */}
            <Tooltip>
              <TooltipTrigger asChild>
                <a
                  ref={githubButtonRef}
                  href="https://github.com/Zatfer17"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-6 h-6 rounded-full hover:opacity-85 transition-opacity"
                  style={{
                    background: `linear-gradient(145deg, rgba(255,255,255,0.26), rgba(255,255,255,0) 34%), radial-gradient(circle at 70% 75%, rgba(0,0,0,0.34), rgba(0,0,0,0) 50%), ${githubButtonColor}`,
                    boxShadow: 'inset -6px -6px 10px rgba(0,0,0,0.24), inset 4px 4px 7px rgba(255,255,255,0.14), 0 3px 8px rgba(0,0,0,0.24)',
                  }}
                />
              </TooltipTrigger>
              <TooltipContent>GitHub</TooltipContent>
            </Tooltip>
            {/* SoundCloud - Orange dot */}
            <Tooltip>
              <TooltipTrigger asChild>
                <a
                  ref={soundcloudButtonRef}
                  href="https://soundcloud.com/matteo-ferrini"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-6 h-6 rounded-full hover:opacity-85 transition-opacity"
                  style={{
                    background: `linear-gradient(145deg, rgba(255,255,255,0.26), rgba(255,255,255,0) 34%), radial-gradient(circle at 70% 75%, rgba(0,0,0,0.34), rgba(0,0,0,0) 50%), ${soundcloudButtonColor}`,
                    boxShadow: 'inset -6px -6px 10px rgba(0,0,0,0.24), inset 4px 4px 7px rgba(255,255,255,0.14), 0 3px 8px rgba(0,0,0,0.24)',
                  }}
                />
              </TooltipTrigger>
              <TooltipContent>SoundCloud</TooltipContent>
            </Tooltip>
            {/* LinkedIn - Blue dot */}
            <Tooltip>
              <TooltipTrigger asChild>
                <a
                  ref={linkedInButtonRef}
                  href="https://www.linkedin.com/in/matteo-ferrini/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-6 h-6 rounded-full hover:opacity-85 transition-opacity"
                  style={{
                    background: `linear-gradient(145deg, rgba(255,255,255,0.26), rgba(255,255,255,0) 34%), radial-gradient(circle at 70% 75%, rgba(0,0,0,0.34), rgba(0,0,0,0) 50%), ${linkedInButtonColor}`,
                    boxShadow: 'inset -6px -6px 10px rgba(0,0,0,0.24), inset 4px 4px 7px rgba(255,255,255,0.14), 0 3px 8px rgba(0,0,0,0.24)',
                  }}
                />
              </TooltipTrigger>
              <TooltipContent>LinkedIn</TooltipContent>
            </Tooltip>
          </div>
        </header>
        <main className="relative z-10 flex min-h-[calc(100dvh-128px)] flex-col gap-6 px-4 pt-4 pb-10 md:h-[calc(100dvh-128px)] md:flex-row md:items-start md:gap-10 md:px-8 md:pt-16 md:pb-16 overflow-visible md:overflow-hidden">
          {/* Column 1 - Gashapon */}
          <div className="order-1 flex flex-1 items-end justify-center md:justify-start md:pb-6">
            <img 
              ref={gashaponRef}
              src={gashaponImage} 
              alt="Gashapon machine" 
              className={`h-auto cursor-pointer transition-transform duration-200 ${
                isStretching ? 'scale-y-110' : 'scale-y-100'
              } ${availableElements.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
              style={{
                width: `${gashaponWidth}px`,
                maxWidth: `min(100%, ${gashaponMaxWidth}px)`,
                marginLeft: `${gashaponOffsetX}px`,
                transform: `translateY(${gashaponOffsetY}px)`,
              }}
              onClick={handleClick}
            />
          </div>

          {/* Column 2 - Current Element Display */}
          <div className="order-2 flex min-w-0 flex-1 justify-center px-0 md:px-2">
            {currentElement && (
              <Card
                className="animate-fade-in w-full min-w-0 rounded-none border-0 bg-transparent shadow-none"
                style={{
                  width: '100%',
                  maxWidth: `${siteConfig.content.componentMaxWidth}px`,
                  minWidth: '0',
                }}
              >
                <CardContent className="p-4 md:p-6">
                  {/* Row 1 - Title, Link Icon and Image */}
                  <div className="mb-3">
                    <div className="relative">
                      <div
                        ref={titleRef}
                        className="relative w-full overflow-hidden"
                        style={{ minHeight: `${mobileTitleHeight}px` }}
                      >
                        {titleLines.map((line, index) => (
                          <span
                            key={`title-${line.y}-${index}`}
                            className="absolute font-black"
                            style={{
                              color: siteConfig.theme.fontColor,
                              left: `${line.x}px`,
                              top: `${line.y}px`,
                              lineHeight: `${titleLineHeight}px`,
                              whiteSpace: 'pre',
                              fontFamily: EDITORIAL_FONT_FAMILY,
                              fontSize: `${titleFontSize}px`,
                              letterSpacing: '-0.02em',
                            }}
                          >
                            {line.text}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  {/* Row 2 - Description */}
                  <div className="mt-2 pt-3">
                    <div
                      ref={descriptionRef}
                      className="relative overflow-hidden rounded-lg"
                      style={{ minHeight: `${mobileDescriptionHeight}px` }}
                    >
                      {descriptionLines.map((line, index) => (
                        <span
                          key={`${line.y}-${index}`}
                          className="absolute"
                          style={{
                            color: siteConfig.theme.fontColor,
                            left: `${line.x}px`,
                            top: `${line.y}px`,
                            lineHeight: `${descriptionLineHeight}px`,
                            whiteSpace: 'pre',
                            fontFamily: EDITORIAL_FONT_FAMILY,
                            fontSize: `${bodyFontSize}px`,
                          }}
                        >
                          {line.text}
                        </span>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </main>

        <div className="relative z-10 mx-4 pb-4 flex items-center justify-between gap-2 md:fixed md:bottom-3 md:left-8 md:right-8 md:mx-0 md:pb-0 md:gap-3">
          <p
            className="tracking-wide"
            style={{
              color: siteConfig.theme.fontColor,
              fontSize: `${footerFontSize}px`,
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
            }}
          >
            {isMobileLayout
              ? <><span className="font-bold">{Object.keys(openedCapsules).length}</span>/{elementsData.length}</>
              : <>collected capsules <span className="font-bold">{Object.keys(openedCapsules).length}</span>/{elementsData.length}</>}
          </p>

          <div ref={footerDotsRef} className="flex max-w-[68vw] items-center gap-1 overflow-x-auto md:max-w-none md:gap-2 md:overflow-visible">
            {Array.from({ length: elementsData.length }).map((_, index) => {
              const capsuleId = index + 1
              const capsule = openedCapsules[capsuleId]

              if (!capsule) {
                return <span key={`empty-${capsuleId}`} className="inline-block h-4 w-4 md:h-6 md:w-6" />
              }

              return (
                <Tooltip key={`capsule-${capsuleId}`}>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      aria-label={`Open capsule ${capsuleId}`}
                      onClick={() => activateCapsule(capsule)}
                      className="h-4 w-4 rounded-full transition-opacity hover:opacity-80 md:h-6 md:w-6"
                      style={{
                        background: `linear-gradient(145deg, rgba(255,255,255,0.26), rgba(255,255,255,0) 34%), radial-gradient(circle at 70% 75%, rgba(0,0,0,0.34), rgba(0,0,0,0) 50%), ${capsule.color}`,
                        boxShadow: 'inset -6px -6px 10px rgba(0,0,0,0.24), inset 4px 4px 7px rgba(255,255,255,0.14)',
                      }}
                    />
                  </TooltipTrigger>
                  <TooltipContent>{capsule.element.title}</TooltipContent>
                </Tooltip>
              )
            })}
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}

export default App
