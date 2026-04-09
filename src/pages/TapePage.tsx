import cassetteCollectionData from '../config/cassettes.json'
import { siteConfig } from '../config/siteConfig'
import { Card, CardContent } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface CassetteItem {
  id: number
  title: string
  description: string
  cover: string
  url: string
}

interface TapePageProps {
  tapeId: number
}

function buildSoundCloudEmbedUrl(url: string): string {
  return `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&color=%23ff5500&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true&visual=false`
}

function TapePage({ tapeId }: TapePageProps) {
  const cassetteCollection = cassetteCollectionData as CassetteItem[]
  const tape = cassetteCollection.find(item => item.id === tapeId)
  const socialButtonColors = siteConfig.buttons.colors
  const githubButtonColor = socialButtonColors[0] ?? '#6b7280'
  const soundcloudButtonColor = socialButtonColors[1] ?? '#fb923c'
  const linkedInButtonColor = socialButtonColors[2] ?? '#60a5fa'

  if (!tape) {
    return (
      <div className="tape-page" style={{ background: siteConfig.cassetteCollection.compartmentBg }}>
        <header className="relative z-20 px-4 md:px-8 py-4 md:py-6 flex justify-between items-center">
          <h1 className="font-bold" style={{ fontSize: `${siteConfig.typography.headerSize}px`, color: siteConfig.theme.fontColor }}>
            zatfer
          </h1>
          <a href="/" className="text-white/90 underline">Back</a>
        </header>
        <main className="px-4 md:px-8 pb-8">
          <h2 className="text-white text-2xl font-semibold">Tape not found</h2>
        </main>
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className="tape-page" style={{ background: siteConfig.cassetteCollection.compartmentBg, color: siteConfig.theme.fontColor }}>
        <header className="relative z-20 px-4 md:px-8 py-4 md:py-6 flex justify-between items-center">
          <div className="flex items-center gap-1 md:gap-2">
            <a href="/" className="no-underline" aria-label="Back to home page">
              <h1 className="font-bold" style={{ fontSize: `${siteConfig.typography.headerSize}px`, color: siteConfig.theme.fontColor }}>
                zatfer
              </h1>
            </a>
            <img
              src={tape.cover}
              alt="Tape cover"
              className="header-cassette-image"
              style={{
                width: `${siteConfig.cassetteCollection.headerButtonWidth}px`,
                height: `${siteConfig.cassetteCollection.headerButtonHeight}px`,
                marginTop: '3px',
              }}
            />
          </div>

          <div className="flex items-center gap-3 md:gap-4">
            <Tooltip>
              <TooltipTrigger asChild>
                <a
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
            <Tooltip>
              <TooltipTrigger asChild>
                <a
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
            <Tooltip>
              <TooltipTrigger asChild>
                <a
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

        <main className="relative z-10 flex min-h-[calc(100dvh-128px)] flex-col gap-6 px-4 pt-4 pb-8 md:flex-row md:items-start md:gap-10 md:px-8 md:pt-10 md:pb-10">
          <div className="order-1 flex flex-1 items-end justify-center md:justify-center md:pb-6">
            <img
              src={tape.cover}
              alt={tape.title}
              className="h-auto"
              style={{
                width: `${siteConfig.layout.gashaponWidth}px`,
                maxWidth: `min(100%, ${siteConfig.layout.gashaponMaxWidth}px)`,
                objectFit: 'contain',
              }}
            />
          </div>

          <div className="order-2 flex min-w-0 flex-1 justify-center px-0 md:px-2">
            <Card
              className="w-full min-w-0 rounded-none border-0 bg-transparent shadow-none"
              style={{
                width: '100%',
                maxWidth: `${siteConfig.content.componentMaxWidth}px`,
                minWidth: '0',
              }}
            >
              <CardContent className="p-4 md:p-6">
                <h2
                  className="mb-4 font-black"
                  style={{
                    color: siteConfig.theme.fontColor,
                    fontSize: `${siteConfig.content.titleSize}px`,
                    lineHeight: 1.02,
                    letterSpacing: '-0.02em',
                    fontFamily: '"Iowan Old Style", "Palatino Linotype", "Book Antiqua", Palatino, serif',
                  }}
                >
                  {tape.title.toUpperCase()}
                </h2>
                <p
                  style={{
                    color: siteConfig.theme.fontColor,
                    fontSize: `${siteConfig.content.bodySize}px`,
                    lineHeight: 1.4,
                    fontFamily: '"Iowan Old Style", "Palatino Linotype", "Book Antiqua", Palatino, serif',
                  }}
                >
                  {tape.description}
                </p>

                <div className="mt-6 w-full rounded-lg overflow-hidden bg-black/20">
                  <iframe
                    title={`SoundCloud embed for ${tape.title}`}
                    width="100%"
                    height="166"
                    scrolling="no"
                    frameBorder="no"
                    allow="autoplay"
                    src={buildSoundCloudEmbedUrl(tape.url)}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </TooltipProvider>
  )
}

export default TapePage
