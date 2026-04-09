import cassetteCollectionData from '../config/cassettes.json'
import { siteConfig } from '../config/siteConfig'
import OrbLink from '@/components/OrbLink'

const EDITORIAL_FONT = '"Iowan Old Style", "Palatino Linotype", "Book Antiqua", Palatino, serif'

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
  const [githubColor, soundcloudColor, linkedinColor] = siteConfig.buttons.colors

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
    <div className="tape-page" style={{ background: siteConfig.theme.backgroundColor, color: siteConfig.theme.fontColor }}>
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
          <OrbLink href="https://github.com/Zatfer17" color={githubColor ?? '#6b7280'} label="GitHub" />
          <OrbLink href="https://soundcloud.com/matteo-ferrini" color={soundcloudColor ?? '#fb923c'} label="SoundCloud" />
          <OrbLink href="https://www.linkedin.com/in/matteo-ferrini/" color={linkedinColor ?? '#60a5fa'} label="LinkedIn" />
        </div>
      </header>

      <main className="px-4 py-4 md:px-8 md:py-6 md:min-h-[calc(100dvh-128px)] md:flex md:flex-col">
        <div
          className="rounded-2xl p-5 md:p-8 flex flex-col md:flex-row md:items-center md:gap-10 mx-auto w-full flex-1"
          style={{ background: siteConfig.cassetteCollection.compartmentBg }}
        >
          <div className="flex justify-center mb-6 md:mb-0 md:flex-1 md:flex md:items-center md:justify-center">
            <img
              src={tape.cover}
              alt={tape.title}
              className="h-auto w-[45vw] max-w-[160px] md:w-[300px] md:max-w-[600px]"
            />
          </div>

          <div className="md:flex-1 md:min-w-0">
            <h2
              className="mb-4 font-black"
              style={{
                color: siteConfig.theme.fontColor,
                fontSize: `clamp(32px, 8vw, ${siteConfig.content.titleSize}px)`,
                lineHeight: 1.02,
                letterSpacing: '-0.02em',
                fontFamily: EDITORIAL_FONT,
              }}
            >
              {tape.title.toUpperCase()}
            </h2>
            <p
              style={{
                color: siteConfig.theme.fontColor,
                fontSize: `clamp(16px, 4vw, ${siteConfig.content.bodySize}px)`,
                lineHeight: 1.4,
                fontFamily: EDITORIAL_FONT,
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
          </div>
        </div>
      </main>
    </div>
  )
}

export default TapePage
