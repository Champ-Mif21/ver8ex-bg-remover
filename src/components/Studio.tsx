import { useRef } from 'react'
import { COLOR_PRESETS } from '../lib/backgrounds'
import {
  DEFAULT_TRANSFORM,
  type Background,
  type Transform,
} from '../lib/compose'
import {
  PAGE_PRESETS,
  PASSPORT_SIZES,
  sizePixels,
  type PagePreset,
  type PassportSize,
} from '../lib/passport'
import { DropZone } from './DropZone'
import { PhotoStage } from './PhotoStage'

type StudioProps = {
  originalUrl: string | null
  subject: HTMLImageElement | null
  background: Background
  customColor: string
  size: PassportSize
  transform: Transform
  showGuides: boolean
  busy: boolean
  progressLabel: string
  progressPct: number
  error: string | null
  exporting: boolean
  onFile: (file: File) => void
  onReset: () => void
  onBackgroundColor: (color: string) => void
  onBackgroundImage: (file: File) => void
  onClearBackgroundImage: () => void
  onSizeChange: (size: PassportSize) => void
  onCustomMm: (widthMm: number, heightMm: number) => void
  onTransformChange: (transform: Transform) => void
  onToggleGuides: () => void
  onDownloadPhoto: (format: 'image/jpeg' | 'image/png') => void
  onDownloadCutout: () => void
  onDownloadSheet: (page: PagePreset) => void
}

export function Studio({
  originalUrl,
  subject,
  background,
  customColor,
  size,
  transform,
  showGuides,
  busy,
  progressLabel,
  progressPct,
  error,
  exporting,
  onFile,
  onReset,
  onBackgroundColor,
  onBackgroundImage,
  onClearBackgroundImage,
  onSizeChange,
  onCustomMm,
  onTransformChange,
  onToggleGuides,
  onDownloadPhoto,
  onDownloadCutout,
  onDownloadSheet,
}: StudioProps) {
  const bgInputRef = useRef<HTMLInputElement>(null)
  const pixels = sizePixels(size)
  const ready = Boolean(subject) && !busy

  return (
    <div className="studio">
      <section className="studio-preview">
        {originalUrl || subject ? (
          <PhotoStage
            size={size}
            background={background}
            originalUrl={originalUrl}
            subject={subject}
            transform={transform}
            showGuides={showGuides}
            busy={busy}
            progressLabel={progressLabel}
            progressPct={progressPct}
            onTransformChange={onTransformChange}
          />
        ) : (
          <div className="studio-empty">
            <DropZone onFile={onFile} />
          </div>
        )}
      </section>

      <aside className="studio-panel">
        <div className="panel-block">
          <div className="panel-heading">
            <h2>Photo</h2>
            {originalUrl ? (
              <button type="button" className="text-btn" onClick={onReset}>
                New photo
              </button>
            ) : null}
          </div>
          {originalUrl ? (
            <DropZone disabled={busy} onFile={onFile} />
          ) : (
            <p className="hint">Drop a portrait on the canvas to start.</p>
          )}
          {error ? <p className="error-text">{error}</p> : null}
        </div>

        <div className="panel-block">
          <h2>Background</h2>
          <div className="swatches">
            {COLOR_PRESETS.map((preset) => {
              const active =
                background.kind === 'color' && background.color === preset.color
              return (
                <button
                  key={preset.id}
                  type="button"
                  className={`swatch ${active ? 'is-active' : ''}`}
                  style={{ background: preset.color }}
                  title={preset.label}
                  aria-label={preset.label}
                  onClick={() => onBackgroundColor(preset.color)}
                />
              )
            })}
            <label
              className={`swatch swatch-custom ${
                background.kind === 'color' &&
                !COLOR_PRESETS.some((p) => p.color === customColor)
                  ? 'is-active'
                  : ''
              }`}
              title="Custom color"
            >
              <input
                type="color"
                value={customColor}
                onChange={(event) => onBackgroundColor(event.target.value)}
              />
            </label>
          </div>
          <div className="bg-actions">
            <button
              type="button"
              className="ghost-btn"
              onClick={() => bgInputRef.current?.click()}
            >
              Upload background
            </button>
            {background.kind === 'image' ? (
              <button
                type="button"
                className="text-btn"
                onClick={onClearBackgroundImage}
              >
                Remove image
              </button>
            ) : null}
            <input
              ref={bgInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              hidden
              onChange={(event) => {
                const file = event.target.files?.[0]
                if (file) onBackgroundImage(file)
                event.target.value = ''
              }}
            />
          </div>
        </div>

        <div className="panel-block">
          <h2>Passport size</h2>
          <div className="size-grid">
            {PASSPORT_SIZES.map((option) => (
              <button
                key={option.id}
                type="button"
                className={`size-card ${size.id === option.id ? 'is-active' : ''}`}
                onClick={() => onSizeChange(option)}
              >
                <strong>{option.label}</strong>
                <span>{option.region}</span>
              </button>
            ))}
          </div>
          {size.id === 'custom' ? (
            <div className="custom-size">
              <label>
                Width mm
                <input
                  type="number"
                  min={20}
                  max={120}
                  value={size.widthMm}
                  onChange={(event) =>
                    onCustomMm(Number(event.target.value), size.heightMm)
                  }
                />
              </label>
              <label>
                Height mm
                <input
                  type="number"
                  min={20}
                  max={150}
                  value={size.heightMm}
                  onChange={(event) =>
                    onCustomMm(size.widthMm, Number(event.target.value))
                  }
                />
              </label>
            </div>
          ) : null}
          <p className="hint">
            Export {pixels.width} × {pixels.height} px at 300 DPI
          </p>
        </div>

        <div className="panel-block">
          <div className="panel-heading">
            <h2>Position</h2>
            <button
              type="button"
              className="text-btn"
              onClick={() => onTransformChange(DEFAULT_TRANSFORM)}
            >
              Reset
            </button>
          </div>
          <label className="slider">
            <span>Zoom {transform.scale.toFixed(2)}×</span>
            <input
              type="range"
              min={0.25}
              max={4}
              step={0.01}
              value={transform.scale}
              onChange={(event) =>
                onTransformChange({
                  ...transform,
                  scale: Number(event.target.value),
                })
              }
            />
          </label>
          <label className="check">
            <input
              type="checkbox"
              checked={showGuides}
              onChange={onToggleGuides}
            />
            Head / eye guides (not part of download)
          </label>
        </div>

        <div className="panel-block export-block">
          <h2>Download</h2>
          <div className="export-row">
            <button
              type="button"
              className="primary-btn"
              disabled={!ready || exporting}
              onClick={() => onDownloadPhoto('image/jpeg')}
            >
              Passport JPEG
            </button>
            <button
              type="button"
              className="ghost-btn"
              disabled={!ready || exporting}
              onClick={() => onDownloadPhoto('image/png')}
            >
              PNG
            </button>
          </div>
          <button
            type="button"
            className="ghost-btn wide"
            disabled={!ready || exporting}
            onClick={onDownloadCutout}
          >
            Transparent cutout
          </button>
          <div className="export-row">
            {PAGE_PRESETS.map((page) => (
              <button
                key={page.id}
                type="button"
                className="ghost-btn"
                disabled={!ready || exporting}
                onClick={() => onDownloadSheet(page)}
              >
                {page.label}
              </button>
            ))}
          </div>
        </div>
      </aside>
    </div>
  )
}
