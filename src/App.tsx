import { useCallback, useEffect, useMemo, useState } from 'react'
import { Studio } from './components/Studio'
import { DEFAULT_BG_COLOR } from './lib/backgrounds'
import {
  canvasToBlob,
  DEFAULT_TRANSFORM,
  downloadBlob,
  drawPassport,
  loadImage,
  slug,
  type Background,
  type Transform,
} from './lib/compose'
import {
  bestPrintLayout,
  DEFAULT_SIZE_ID,
  mmToPx,
  PASSPORT_SIZES,
  sizePixels,
  type PagePreset,
  type PassportSize,
} from './lib/passport'
import { cutoutBackground, progressLabel } from './lib/removeBg'
import { ThemeToggle } from './components/ThemeToggle'
import { applyTheme, readTheme, type Theme } from './lib/theme'
import './App.css'

function cloneSize(size: PassportSize): PassportSize {
  return { ...size }
}

export default function App() {
  const [originalUrl, setOriginalUrl] = useState<string | null>(null)
  const [cutoutUrl, setCutoutUrl] = useState<string | null>(null)
  const [subject, setSubject] = useState<HTMLImageElement | null>(null)
  const [backgroundImage, setBackgroundImage] = useState<HTMLImageElement | null>(
    null,
  )
  const [customColor, setCustomColor] = useState(DEFAULT_BG_COLOR)
  const [size, setSize] = useState<PassportSize>(
    () => cloneSize(PASSPORT_SIZES.find((s) => s.id === DEFAULT_SIZE_ID)!),
  )
  const [transform, setTransform] = useState<Transform>(DEFAULT_TRANSFORM)
  const [showGuides, setShowGuides] = useState(false)
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState({ label: 'Working', pct: 0 })
  const [error, setError] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)
  const [theme, setTheme] = useState<Theme>(() => readTheme())

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  const background: Background = useMemo(() => {
    if (backgroundImage) return { kind: 'image', image: backgroundImage }
    return { kind: 'color', color: customColor }
  }, [backgroundImage, customColor])

  useEffect(() => {
    return () => {
      if (originalUrl) URL.revokeObjectURL(originalUrl)
    }
  }, [originalUrl])

  useEffect(() => {
    return () => {
      if (cutoutUrl) URL.revokeObjectURL(cutoutUrl)
    }
  }, [cutoutUrl])

  const resetPhoto = useCallback(() => {
    setOriginalUrl((current) => {
      if (current) URL.revokeObjectURL(current)
      return null
    })
    setCutoutUrl((current) => {
      if (current) URL.revokeObjectURL(current)
      return null
    })
    setSubject(null)
    setTransform(DEFAULT_TRANSFORM)
    setError(null)
    setBusy(false)
  }, [])

  const handleFile = useCallback(async (file: File) => {
    setError(null)
    setBusy(true)
    setProgress({ label: 'Reading photo', pct: 0.05 })
    setSubject(null)
    setTransform(DEFAULT_TRANSFORM)

    const nextOriginal = URL.createObjectURL(file)
    setOriginalUrl((current) => {
      if (current) URL.revokeObjectURL(current)
      return nextOriginal
    })

    try {
      const cutout = await cutoutBackground(file, ({ key, current, total }) => {
        setProgress({
          label: progressLabel(key),
          pct: total > 0 ? current / total : 0.2,
        })
      })
      const url = URL.createObjectURL(cutout)
      setCutoutUrl((current) => {
        if (current) URL.revokeObjectURL(current)
        return url
      })
      const image = await loadImage(url)
      setSubject(image)
      setProgress({ label: 'Ready', pct: 1 })
    } catch (err) {
      console.error(err)
      setError(
        'Could not remove the background. Check your connection (the AI model downloads on first use) and try a clearer portrait.',
      )
    } finally {
      setBusy(false)
    }
  }, [])

  useEffect(() => {
    const onPaste = (event: ClipboardEvent) => {
      const file = event.clipboardData?.files[0]
      if (file?.type.startsWith('image/')) {
        event.preventDefault()
        void handleFile(file)
      }
    }
    window.addEventListener('paste', onPaste)
    return () => window.removeEventListener('paste', onPaste)
  }, [handleFile])

  const handleBackgroundImage = useCallback(async (file: File) => {
    try {
      const image = await loadImage(file)
      setBackgroundImage(image)
    } catch {
      setError('Could not load that background image.')
    }
  }, [])

  const renderPhotoCanvas = useCallback(() => {
    if (!subject) return null
    const { width, height } = sizePixels(size)
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    drawPassport(ctx, width, height, background, subject, transform)
    return canvas
  }, [subject, size, background, transform])

  const downloadPhoto = useCallback(
    async (format: 'image/jpeg' | 'image/png') => {
      const canvas = renderPhotoCanvas()
      if (!canvas) return
      setExporting(true)
      try {
        const blob = await canvasToBlob(
          canvas,
          format,
          format === 'image/jpeg' ? 0.94 : undefined,
        )
        const ext = format === 'image/jpeg' ? 'jpg' : 'png'
        downloadBlob(blob, `passport-${slug(size.label)}.${ext}`)
      } finally {
        setExporting(false)
      }
    },
    [renderPhotoCanvas, size.label],
  )

  const downloadCutout = useCallback(() => {
    if (!cutoutUrl) return
    const a = document.createElement('a')
    a.href = cutoutUrl
    a.download = 'cutout.png'
    a.click()
  }, [cutoutUrl])

  const downloadSheet = useCallback(
    async (page: PagePreset) => {
      const photo = renderPhotoCanvas()
      if (!photo) return
      setExporting(true)
      try {
        const layout = bestPrintLayout(page, size)
        const canvas = document.createElement('canvas')
        canvas.width = layout.width
        canvas.height = layout.height
        const ctx = canvas.getContext('2d')
        if (!ctx) return
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, layout.width, layout.height)
        const photoW = mmToPx(size.widthMm)
        const photoH = mmToPx(size.heightMm)
        for (const cell of layout.cells) {
          ctx.drawImage(photo, cell.x, cell.y, photoW, photoH)
        }
        const blob = await canvasToBlob(canvas, 'image/jpeg', 0.92)
        downloadBlob(blob, `passport-sheet-${page.id}.jpg`)
      } finally {
        setExporting(false)
      }
    },
    [renderPhotoCanvas, size],
  )

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <a
            className="brand-logo-link"
            href="https://ver8ex.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            <img
              className="brand-logo"
              src="/ver8ex-logo.png"
              alt="Ver8ex"
            />
          </a>
          <div className="brand-copy">
            <p className="brand-kicker">Studio</p>
            <h1>BG Remover</h1>
          </div>
        </div>
        <div className="topbar-actions">
          <p className="tagline">
            Cut the background, drop in any color or image, export a passport photo.
          </p>
          <ThemeToggle
            theme={theme}
            onToggle={() => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))}
          />
        </div>
      </header>
      <Studio
        originalUrl={originalUrl}
        subject={subject}
        background={background}
        customColor={customColor}
        size={size}
        transform={transform}
        showGuides={showGuides}
        busy={busy}
        progressLabel={progress.label}
        progressPct={progress.pct}
        error={error}
        exporting={exporting}
        onFile={handleFile}
        onReset={resetPhoto}
        onBackgroundColor={(color) => {
          setCustomColor(color)
          setBackgroundImage(null)
        }}
        onBackgroundImage={handleBackgroundImage}
        onClearBackgroundImage={() => setBackgroundImage(null)}
        onSizeChange={(next) => setSize(cloneSize(next))}
        onCustomMm={(widthMm, heightMm) =>
          setSize((current) => ({
            ...current,
            id: 'custom',
            widthMm: Math.min(120, Math.max(20, widthMm || 20)),
            heightMm: Math.min(150, Math.max(20, heightMm || 20)),
          }))
        }
        onTransformChange={setTransform}
        onToggleGuides={() => setShowGuides((value) => !value)}
        onDownloadPhoto={downloadPhoto}
        onDownloadCutout={downloadCutout}
        onDownloadSheet={downloadSheet}
      />
      <footer className="site-footer">
        <p>
          made by{' '}
          <a
            href="https://ver8ex.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            Ver8ex
          </a>
        </p>
      </footer>
    </div>
  )
}
