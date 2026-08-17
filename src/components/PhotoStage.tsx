import { useEffect, useRef } from 'react'
import {
  drawGuides,
  drawPassport,
  type Background,
  type Transform,
} from '../lib/compose'
import { sizePixels, type PassportSize } from '../lib/passport'

type PhotoStageProps = {
  size: PassportSize
  background: Background
  originalUrl: string | null
  subject: HTMLImageElement | null
  transform: Transform
  showGuides: boolean
  busy: boolean
  progressLabel: string
  progressPct: number
  onTransformChange: (next: Transform) => void
}

function fitBox(availW: number, availH: number, aspect: number) {
  const width = Math.max(1, Math.floor(Math.min(availW, availH * aspect)))
  const height = Math.max(1, Math.floor(width / aspect))
  return { width, height }
}

export function PhotoStage({
  size,
  background,
  originalUrl,
  subject,
  transform,
  showGuides,
  busy,
  progressLabel,
  progressPct,
  onTransformChange,
}: PhotoStageProps) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const transformRef = useRef(transform)
  const dragRef = useRef<{ x: number; y: number } | null>(null)

  transformRef.current = transform

  useEffect(() => {
    const wrap = wrapRef.current
    const canvas = canvasRef.current
    if (!wrap || !canvas) return

    const draw = () => {
      const pixels = sizePixels(size)
      const aspect = pixels.width / pixels.height
      const inset = 8
      const { width: cssW, height: cssH } = fitBox(
        Math.max(80, wrap.clientWidth - inset),
        Math.max(80, wrap.clientHeight - inset),
        aspect,
      )

      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.round(cssW * dpr)
      canvas.height = Math.round(cssH * dpr)
      canvas.style.width = `${cssW}px`
      canvas.style.height = `${cssH}px`

      const ctx = canvas.getContext('2d')
      if (!ctx) return
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'

      if (subject) {
        drawPassport(ctx, cssW, cssH, background, subject, transform)
        if (showGuides) drawGuides(ctx, cssW, cssH)
      } else {
        ctx.fillStyle = background.kind === 'color' ? background.color : '#111'
        ctx.fillRect(0, 0, cssW, cssH)
      }
    }

    draw()
    const observer = new ResizeObserver(draw)
    observer.observe(wrap)
    window.addEventListener('resize', draw)
    window.visualViewport?.addEventListener('resize', draw)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', draw)
      window.visualViewport?.removeEventListener('resize', draw)
    }
  }, [size, background, subject, transform, showGuides])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const onWheel = (event: WheelEvent) => {
      event.preventDefault()
      const current = transformRef.current
      const factor = event.deltaY > 0 ? 0.95 : 1.05
      onTransformChange({
        ...current,
        scale: Math.min(4, Math.max(0.25, current.scale * factor)),
      })
    }

    canvas.addEventListener('wheel', onWheel, { passive: false })
    return () => canvas.removeEventListener('wheel', onWheel)
  }, [onTransformChange])

  return (
    <div className="stage">
      <div className="stage-viewport" ref={wrapRef}>
        <div className="stage-photo">
          <div className="stage-photo-inner">
            {originalUrl && !subject ? (
              <img src={originalUrl} alt="Original upload" className="stage-original" />
            ) : null}
            <canvas
              ref={canvasRef}
              className={`stage-canvas ${originalUrl && !subject ? 'is-hidden' : ''}`}
              onPointerDown={(event) => {
                event.currentTarget.setPointerCapture(event.pointerId)
                dragRef.current = { x: event.clientX, y: event.clientY }
              }}
              onPointerMove={(event) => {
                if (!dragRef.current) return
                const rect = event.currentTarget.getBoundingClientRect()
                const dx = (event.clientX - dragRef.current.x) / rect.width
                const dy = (event.clientY - dragRef.current.y) / rect.height
                dragRef.current = { x: event.clientX, y: event.clientY }
                const current = transformRef.current
                onTransformChange({
                  ...current,
                  x: current.x + dx,
                  y: current.y + dy,
                })
              }}
              onPointerUp={() => {
                dragRef.current = null
              }}
              onPointerCancel={() => {
                dragRef.current = null
              }}
            />
            {busy ? (
              <div className="stage-busy">
                <div className="stage-scan" />
                <p>{progressLabel}</p>
                <div className="progress">
                  <span style={{ width: `${Math.round(progressPct * 100)}%` }} />
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
      <p className="stage-caption">
        The dashed frame is the downloaded photo · {size.label} · drag to move · scroll to zoom
      </p>
    </div>
  )
}
