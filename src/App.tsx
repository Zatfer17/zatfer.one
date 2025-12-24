import { useState, useEffect, useRef } from 'react'
import gashaponImage from './assets/gashapon.png'
import elementsData from './data/elements.json'

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
    <div className="min-h-screen bg-white">
      <header className="p-6 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-foreground">zatfer</h1>
          {/* Reset Lever */}
          <div 
            ref={trackRef}
            className="relative w-24 h-8 bg-gray-200 rounded-full cursor-pointer select-none"
          >
            <div 
              ref={leverRef}
              className={`absolute top-1 w-6 h-6 bg-black rounded-full cursor-grab active:cursor-grabbing ${
                isDragging ? '' : 'transition-all duration-200'
              }`}
              style={{ right: `${4 + (leverPosition / 100) * 64}px` }}
              onMouseDown={handleMouseDown}
            />
            {leverPosition > 80 && (
              <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-gray-600">
                Reset
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-4 items-center">
          {/* GitHub - Black dot */}
          <a
            href="https://github.com/zatfer"
            target="_blank"
            rel="noopener noreferrer"
            className="w-6 h-6 bg-black rounded-full hover:opacity-70 transition-opacity"
            title="GitHub"
          />
          {/* SoundCloud - Orange dot */}
          <a
            href="https://soundcloud.com/zatfer"
            target="_blank"
            rel="noopener noreferrer"
            className="w-6 h-6 bg-orange-500 rounded-full hover:opacity-70 transition-opacity"
            title="SoundCloud"
          />
          {/* LinkedIn - Blue dot */}
          <a
            href="https://linkedin.com/in/zatfer"
            target="_blank"
            rel="noopener noreferrer"
            className="w-6 h-6 bg-blue-600 rounded-full hover:opacity-70 transition-opacity"
            title="LinkedIn"
          />
        </div>
      </header>
      <main className="flex flex-col md:flex-row gap-8 pt-24">
        {/* Column 1 - Gashapon */}
        <div className="flex-1 flex items-center justify-center">
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
        <div className="flex-1 flex items-center justify-center">
          {currentElement && (
            <div className="p-6 animate-fade-in max-w-md w-full">
              {/* Row 1 - Title, Link Icon and Image */}
              <div className="flex items-end gap-4 mb-4">
                {currentElement.image && (
                  <img 
                    src={currentElement.image} 
                    alt={currentElement.title}
                    className="w-48 h-48 object-cover rounded-lg flex-shrink-0"
                  />
                )}
                <div className="flex-1 flex items-end">
                  <div className="flex items-end gap-2">
                    <h2 className="text-5xl font-black text-justify flex-1">{currentElement.title}</h2>
                    <a 
                      href={currentElement.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-gray-600 hover:text-black transition-colors flex-shrink-0 mb-1"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                      </svg>
                    </a>
                  </div>
                </div>
              </div>
              {/* Row 2 - Description */}
              <p className="text-gray-600 text-justify">{currentElement.description}</p>
            </div>
          )}
        </div>

        {/* Column 3 - Grid of cells */}
        <div className="flex-1 flex items-center justify-center">
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
  )
}

export default App
