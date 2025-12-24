import { useState, useEffect, useRef } from 'react'
import gashaponImage from './assets/gashapon.png'
import elementsData from './data/elements.json'
import { Card, CardContent } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Link } from 'lucide-react'

interface Element {
  id: number
  title: string
  description: string
  url: string
  image: string
}

function App() {
  const [isStretching, setIsStretching] = useState(false)
  const [availableElements, setAvailableElements] = useState<Element[]>([])
  const [currentElement, setCurrentElement] = useState<Element | null>(null)
  const [filledCells, setFilledCells] = useState<Record<number, Element>>({})
  const [leverPosition, setLeverPosition] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const leverRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setAvailableElements([...elementsData])
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

    // Fill the corresponding cell
    setFilledCells(prev => ({ ...prev, [drawnElement.id]: drawnElement }))
  }

  const handleReset = () => {
    setAvailableElements([...elementsData])
    setCurrentElement(null)
    setFilledCells({})
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
      <div className="min-h-screen bg-white">
        <header className="px-8 py-6 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-foreground">zatfer</h1>
            {/* Reset Lever */}
            <div 
              ref={trackRef}
              className="relative w-24 h-8 bg-muted rounded-full cursor-pointer select-none"
            >
              <div 
                ref={leverRef}
                className={`absolute top-1 w-6 h-6 bg-primary rounded-full cursor-grab active:cursor-grabbing ${
                  isDragging ? '' : 'transition-all duration-200'
                }`}
                style={{ right: `${4 + (leverPosition / 100) * 64}px` }}
                onMouseDown={handleMouseDown}
              />
              {leverPosition > 80 && (
                <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-muted-foreground">
                  Reset
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-4 items-center">
            {/* GitHub - Black dot */}
            <Tooltip>
              <TooltipTrigger asChild>
                <a
                  href="https://github.com/zatfer"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-6 h-6 bg-primary rounded-full hover:opacity-70 transition-opacity"
                />
              </TooltipTrigger>
              <TooltipContent>GitHub</TooltipContent>
            </Tooltip>
            {/* SoundCloud - Orange dot */}
            <Tooltip>
              <TooltipTrigger asChild>
                <a
                  href="https://soundcloud.com/zatfer"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-6 h-6 bg-orange-500 rounded-full hover:opacity-70 transition-opacity"
                />
              </TooltipTrigger>
              <TooltipContent>SoundCloud</TooltipContent>
            </Tooltip>
            {/* LinkedIn - Blue dot */}
            <Tooltip>
              <TooltipTrigger asChild>
                <a
                  href="https://linkedin.com/in/zatfer"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-6 h-6 bg-blue-600 rounded-full hover:opacity-70 transition-opacity"
                />
              </TooltipTrigger>
              <TooltipContent>LinkedIn</TooltipContent>
            </Tooltip>
          </div>
        </header>
        <main className="flex flex-col md:flex-row md:items-start gap-8 pt-24 px-8">
          {/* Column 1 - Gashapon */}
          <div className="flex-1 flex justify-center">
            <img 
              src={gashaponImage} 
              alt="Gashapon machine" 
              className={`max-w-md h-auto cursor-pointer transition-transform duration-200 ${
                isStretching ? 'scale-y-110' : 'scale-y-100'
              } ${availableElements.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={handleClick}
            />
          </div>

          {/* Column 2 - Current Element Display */}
          <div className="flex-1 flex justify-center px-4">
            {currentElement && (
              <Card className="animate-fade-in w-[400px] border-0 shadow-none">
                <CardContent className="p-6">
                  {/* Row 1 - Title, Link Icon and Image */}
                  <div className="flex items-start gap-4 mb-4">
                    {currentElement.image && (
                      <img 
                        src={currentElement.image} 
                        alt={currentElement.title}
                        className="w-40 h-40 object-cover rounded-lg flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 flex items-start">
                      <div className="flex items-start gap-2">
                        <h2 className="text-4xl font-black flex-1" style={{ fontFamily: "'EB Garamond', serif" }}>{currentElement.title}</h2>
                        <a 
                          href={currentElement.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0 mt-1"
                        >
                          <Link className="w-6 h-6" />
                        </a>
                      </div>
                    </div>
                  </div>
                  {/* Row 2 - Description */}
                  <p className="text-muted-foreground text-justify text-lg" style={{ fontFamily: 'Inter, sans-serif' }}>{currentElement.description}</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Column 3 - Grid of cells */}
          <div className="flex-1 flex justify-center px-4">
            <div className="grid grid-cols-4 gap-4">
              {Array.from({ length: 16 }).map((_, index) => {
                const cellId = index + 1
                const filledElement = filledCells[cellId]
                return (
                  <div
                    key={cellId}
                    className={`w-16 h-24 rounded-4xl overflow-hidden flex items-center justify-center ${
                      filledElement ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''
                    }`}
                    onClick={() => filledElement && setCurrentElement(filledElement)}
                  >
                    {filledElement && filledElement.image && (
                      <img 
                        src={filledElement.image} 
                        alt={filledElement.title}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </main>
      </div>
    </TooltipProvider>
  )
}

export default App
