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
  image: string
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
const BASE_FONT_SIZE = siteConfig.content.bodySize
const TITLE_FONT_SIZE = siteConfig.content.titleSize
const TITLE_LINE_HEIGHT = Math.round(TITLE_FONT_SIZE * 1.05)
const DESCRIPTION_LINE_HEIGHT = Math.round(BASE_FONT_SIZE * 1.5)
const TITLE_FONT = `700 ${TITLE_FONT_SIZE}px ${EDITORIAL_FONT_FAMILY}`
const DESCRIPTION_FONT = `400 ${BASE_FONT_SIZE}px ${EDITORIAL_FONT_FAMILY}`
const MIN_FLOAT_SPEED = siteConfig.balls.speed.floatMin
const MAX_FLOAT_SPEED = siteConfig.balls.speed.floatMax
const GASHAPON_OFFSET_X = siteConfig.layout.gashaponOffsetX
const GASHAPON_OFFSET_Y = siteConfig.layout.gashaponOffsetY
const GASHAPON_WIDTH = siteConfig.layout.gashaponWidth
const GASHAPON_MAX_WIDTH = siteConfig.layout.gashaponMaxWidth
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

function App() {
  const [isStretching, setIsStretching] = useState(false)
  const [availableElements, setAvailableElements] = useState<Element[]>([])
  const [currentElement, setCurrentElement] = useState<Element | null>(null)
  const [leverPosition, setLeverPosition] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [floatingBall, setFloatingBall] = useState<Ball | null>(null)
  const [openedCapsules, setOpenedCapsules] = useState<Record<number, OpenedCapsule>>({})
  const [titleRect, setTitleRect] = useState<DOMRect | null>(null)
  const [descriptionRect, setDescriptionRect] = useState<DOMRect | null>(null)
  const leverRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
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

  useEffect(() => {
    floatingBallRef.current = floatingBall
  }, [floatingBall])

  const preparedTitle = useMemo(() => {
    if (!currentElement?.title) return null
    return prepareWithSegments(currentElement.title.toUpperCase(), TITLE_FONT)
  }, [currentElement?.title])

  const expandedDescription = useMemo(() => {
    if (!currentElement?.description) return ''
    const base = currentElement.description.trim()
    if (base.length >= 420) return base
    return `${base} ${base}`
  }, [currentElement?.description])

  const preparedDescription = useMemo(() => {
    if (!expandedDescription) return null
    return prepareWithSegments(expandedDescription, DESCRIPTION_FONT)
  }, [expandedDescription])

  const toggleFloatingPause = () => {
    setFloatingBall(prev => {
      if (!prev) return prev
      setCurrentElement(prev.element)
      const nextPaused = !prev.paused
      return {
        ...prev,
        paused: nextPaused,
      }
    })
  }

  const titleLines = useMemo(() => {
    if (!preparedTitle || !titleRect || !pageRef.current) return [] as PositionedLine[]

    const pageRect = pageRef.current.getBoundingClientRect()
    const regionX = titleRect.left - pageRect.left
    const regionY = titleRect.top - pageRect.top
    const regionW = titleRect.width
    const maxLines = Math.floor(titleRect.height / TITLE_LINE_HEIGHT)

    const lines: PositionedLine[] = []
    let cursor: LayoutCursor = { segmentIndex: 0, graphemeIndex: 0 }
    let lineTop = 0

    while (lines.length < maxLines) {
      const bandTop = regionY + lineTop
      const bandBottom = bandTop + TITLE_LINE_HEIGHT
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
        lineTop += TITLE_LINE_HEIGHT
        continue
      }

      const bestSlot = slots.reduce((best, slot) => {
        const bestWidth = best.right - best.left
        const slotWidth = slot.right - slot.left
        return slotWidth > bestWidth ? slot : best
      })

      const line = layoutNextLine(preparedTitle, cursor, bestSlot.right - bestSlot.left)
      if (line === null) break
      lines.push({ text: line.text, x: bestSlot.left, y: lineTop })
      cursor = line.end
      lineTop += TITLE_LINE_HEIGHT
    }

    return lines
  }, [floatingBall, preparedTitle, titleRect])

  const descriptionLines = useMemo(() => {
    if (!preparedDescription || !descriptionRect || !pageRef.current) return [] as PositionedLine[]

    const pageRect = pageRef.current.getBoundingClientRect()
    const regionX = descriptionRect.left - pageRect.left
    const regionY = descriptionRect.top - pageRect.top
    const regionW = descriptionRect.width
    const maxLines = Math.floor(descriptionRect.height / DESCRIPTION_LINE_HEIGHT)

    const lines: PositionedLine[] = []
    let cursor: LayoutCursor = { segmentIndex: 0, graphemeIndex: 0 }
    let lineTop = 0

    while (lines.length < maxLines) {
      const bandTop = regionY + lineTop
      const bandBottom = bandTop + DESCRIPTION_LINE_HEIGHT
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
        lineTop += DESCRIPTION_LINE_HEIGHT
        continue
      }

      const bestSlot = slots.reduce((best, slot) => {
        const bestWidth = best.right - best.left
        const slotWidth = slot.right - slot.left
        return slotWidth > bestWidth ? slot : best
      })

      const line = layoutNextLine(preparedDescription, cursor, bestSlot.right - bestSlot.left)
      if (line === null) break
      lines.push({ text: line.text, x: bestSlot.left, y: lineTop })
      cursor = line.end
      lineTop += DESCRIPTION_LINE_HEIGHT
    }

    return lines
  }, [floatingBall, preparedDescription, descriptionRect])

  useEffect(() => {
    setAvailableElements([...elementsData])
  }, [])

  useEffect(() => {
    const updateRect = () => {
      if (titleRef.current) {
        setTitleRect(titleRef.current.getBoundingClientRect())
      }
      if (!descriptionRef.current) return
      setDescriptionRect(descriptionRef.current.getBoundingClientRect())
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
        trackRef.current,
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
        if (speed < MIN_FLOAT_SPEED) {
          const scale = MIN_FLOAT_SPEED / speed
          b.vx *= scale
          b.vy *= scale
        } else if (speed > MAX_FLOAT_SPEED) {
          const scale = MAX_FLOAT_SPEED / speed
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

    // Pick a random element from available elements
    const randomIndex = Math.floor(Math.random() * availableElements.length)
    const drawnElement = availableElements[randomIndex]

    // Remove the drawn element from available elements
    setAvailableElements(prev => prev.filter((_, index) => index !== randomIndex))

    // Display in middle column
    setCurrentElement(drawnElement)

    if (!pageRef.current) return
    const pageRect = pageRef.current.getBoundingClientRect()
    const safeMargin = 96
    const spawnX = randomBetween(safeMargin, Math.max(safeMargin + 1, pageRect.width - safeMargin))
    const spawnY = randomBetween(safeMargin, Math.max(safeMargin + 1, pageRect.height - FOOTER_HEIGHT - safeMargin))
    const r = randomBetween(siteConfig.balls.size.min, siteConfig.balls.size.max)
    const color = ORB_COLORS[Math.floor(Math.random() * ORB_COLORS.length)]!
    const angle = Math.random() * Math.PI * 2
    const speed = randomBetween(siteConfig.balls.speed.spawnMin, siteConfig.balls.speed.spawnMax)

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
      x: spawnX,
      y: spawnY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      r,
      color,
      paused: false,
    })
  }

  const activateCapsule = (capsule: OpenedCapsule) => {
    setCurrentElement(capsule.element)
    if (!pageRef.current) return

    const pageRect = pageRef.current.getBoundingClientRect()
    const safeMargin = 96
    const spawnX = randomBetween(safeMargin, Math.max(safeMargin + 1, pageRect.width - safeMargin))
    const spawnY = randomBetween(safeMargin, Math.max(safeMargin + 1, pageRect.height - FOOTER_HEIGHT - safeMargin))
    const r = capsule.radius
    const angle = Math.random() * Math.PI * 2
    const speed = randomBetween(siteConfig.balls.speed.spawnMin, siteConfig.balls.speed.spawnMax)

    setFloatingBall({
      id: Date.now() + Math.random(),
      element: capsule.element,
      x: spawnX,
      y: spawnY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      r,
      color: capsule.color,
      paused: false,
    })
  }

  const handleReset = () => {
    setAvailableElements([...elementsData])
    setCurrentElement(null)
    setFloatingBall(null)
    setOpenedCapsules({})
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    e.preventDefault()
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !trackRef.current) return
    
    const track = trackRef.current.getBoundingClientRect()
    const newPosition = ((track.right - e.clientX) / track.width) * 100
    setLeverPosition(Math.max(0, Math.min(100, newPosition)))
  }

  const handleMouseUp = () => {
    if (isDragging) {
      if (leverPosition > 80) {
        handleReset()
      }
      setLeverPosition(0)
      setIsDragging(false)
    }
  }

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
      return () => {
        window.removeEventListener('mousemove', handleMouseMove)
        window.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, leverPosition])

  return (
    <TooltipProvider>
      <div
        ref={pageRef}
        className="h-screen relative overflow-hidden"
        style={{
          background: siteConfig.theme.backgroundColor,
          color: siteConfig.theme.fontColor,
        }}
      >
        {floatingBall && (
          <button
            key={floatingBall.id}
            type="button"
            aria-label={`Open ${floatingBall.element.title}`}
            onClick={toggleFloatingPause}
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
                fontSize: `${siteConfig.typography.headerSize}px`,
                color: siteConfig.theme.fontColor,
              }}
            >
              zatfer
            </h1>
          </div>

          <div className="flex items-center gap-4 md:gap-5">
            {/* Reset Lever */}
            <div 
              ref={trackRef}
              className="relative w-20 md:w-24 h-6 rounded-full cursor-pointer select-none"
              style={{
                background: siteConfig.colors.resetWidget.trackBackground,
                border: `1px solid ${siteConfig.colors.resetWidget.trackBorder}`,
              }}
            >
              <div 
                ref={leverRef}
                className={`absolute w-4 h-4 md:w-4 md:h-4 rounded-full cursor-grab active:cursor-grabbing ${
                  isDragging ? '' : 'transition-all duration-200'
                }`}
                style={{
                  background: siteConfig.colors.resetWidget.knob,
                  right: `${4 + (leverPosition / 100) * 64}px`,
                  top: '50%',
                  transform: 'translateY(-50%)',
                }}
                onMouseDown={handleMouseDown}
              />
              {leverPosition > 80 && (
                <span
                  className="absolute inset-0 flex items-center justify-center font-bold"
                  style={{
                    color: siteConfig.colors.resetWidget.label,
                    fontSize: `${siteConfig.typography.resetLabelSize}px`,
                  }}
                >
                  Reset
                </span>
              )}
            </div>

            <div className="flex gap-3 md:gap-4 items-center">
            {/* GitHub - Black dot */}
            <Tooltip>
              <TooltipTrigger asChild>
                <a
                  ref={githubButtonRef}
                  href="https://github.com/Zatfer17"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-6 h-6 rounded-full hover:opacity-70 transition-opacity"
                  style={{ background: siteConfig.colors.topButtons.github }}
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
                  className="w-6 h-6 rounded-full hover:opacity-70 transition-opacity"
                  style={{ background: siteConfig.colors.topButtons.soundcloud }}
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
                  className="w-6 h-6 rounded-full hover:opacity-70 transition-opacity"
                  style={{ background: siteConfig.colors.topButtons.linkedIn }}
                />
              </TooltipTrigger>
              <TooltipContent>LinkedIn</TooltipContent>
            </Tooltip>
            </div>
          </div>
        </header>
        <main className="relative z-10 flex h-[calc(100vh-128px)] flex-col md:flex-row md:items-start gap-8 md:gap-10 pt-8 md:pt-16 px-4 md:px-8 pb-16 overflow-hidden">
          {/* Column 1 - Gashapon */}
          <div className="flex-1 flex justify-start items-end order-1 md:pb-6">
            <img 
              ref={gashaponRef}
              src={gashaponImage} 
              alt="Gashapon machine" 
              className={`h-auto cursor-pointer transition-transform duration-200 ${
                isStretching ? 'scale-y-110' : 'scale-y-100'
              } ${availableElements.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
              style={{
                width: `${GASHAPON_WIDTH}px`,
                maxWidth: `min(100%, ${GASHAPON_MAX_WIDTH}px)`,
                marginLeft: `${GASHAPON_OFFSET_X}px`,
                transform: `translateY(${GASHAPON_OFFSET_Y}px)`,
              }}
              onClick={handleClick}
            />
          </div>

          {/* Column 2 - Current Element Display */}
          <div className="flex-1 flex justify-center px-0 md:px-2 order-2">
            {currentElement && (
              <Card
                className="animate-fade-in w-full border-0 bg-transparent shadow-none rounded-none"
                style={{
                  width: `min(${Math.round(siteConfig.content.componentWidthRatio * 100)}vw, ${siteConfig.content.componentMaxWidth}px)`,
                  maxWidth: `${siteConfig.content.componentMaxWidth}px`,
                  minWidth: `min(100%, ${siteConfig.content.componentMinWidth}px)`,
                }}
              >
                <CardContent className="p-4 md:p-6">
                  {/* Row 1 - Title, Link Icon and Image */}
                  <div className="mb-3">
                    <div className="relative">
                      <div
                        ref={titleRef}
                        className="relative overflow-hidden"
                        style={{ minHeight: `${siteConfig.content.titleMinHeight}px` }}
                      >
                        {titleLines.map((line, index) => (
                          <span
                            key={`title-${line.y}-${index}`}
                            className="absolute font-black"
                            style={{
                              color: siteConfig.theme.fontColor,
                              left: `${line.x}px`,
                              top: `${line.y}px`,
                              lineHeight: `${TITLE_LINE_HEIGHT}px`,
                              whiteSpace: 'pre',
                              fontFamily: EDITORIAL_FONT_FAMILY,
                              fontSize: `${TITLE_FONT_SIZE}px`,
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
                      style={{ minHeight: `${siteConfig.content.bodyMinHeight}px` }}
                    >
                      {descriptionLines.map((line, index) => (
                        <span
                          key={`${line.y}-${index}`}
                          className="absolute"
                          style={{
                            color: siteConfig.theme.fontColor,
                            left: `${line.x}px`,
                            top: `${line.y}px`,
                            lineHeight: `${DESCRIPTION_LINE_HEIGHT}px`,
                            whiteSpace: 'pre',
                            fontFamily: EDITORIAL_FONT_FAMILY,
                            fontSize: `${BASE_FONT_SIZE}px`,
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

        <div className="fixed bottom-3 left-4 right-4 md:left-8 md:right-8 z-10 flex items-center justify-between gap-3">
          <p
            className="tracking-wide"
            style={{
              color: siteConfig.theme.fontColor,
              fontSize: `${siteConfig.typography.footerSize}px`,
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
            }}
          >
            collected capsules <span className="font-bold">{Object.keys(openedCapsules).length}</span>/16
          </p>

          <div ref={footerDotsRef} className="flex items-center gap-2">
            {Array.from({ length: elementsData.length }).map((_, index) => {
              const capsuleId = index + 1
              const capsule = openedCapsules[capsuleId]

              if (!capsule) {
                return <span key={`empty-${capsuleId}`} className="w-6 h-6 inline-block" />
              }

              return (
                <button
                  key={`capsule-${capsuleId}`}
                  type="button"
                  aria-label={`Open capsule ${capsuleId}`}
                  onClick={() => activateCapsule(capsule)}
                  className="w-6 h-6 rounded-full hover:opacity-80 transition-opacity"
                  style={{
                    background: capsule.color,
                    boxShadow: 'inset -6px -6px 10px rgba(0,0,0,0.24), inset 4px 4px 7px rgba(255,255,255,0.14)',
                  }}
                />
              )
            })}
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}

export default App
