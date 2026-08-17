import { useCallback, useState, type DragEvent, type ChangeEvent } from 'react'

const ACCEPT = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
const MAX_BYTES = 20 * 1024 * 1024

type DropZoneProps = {
  disabled?: boolean
  onFile: (file: File) => void
}

export function DropZone({ disabled, onFile }: DropZoneProps) {
  const [hover, setHover] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const takeFile = useCallback(
    (file: File | undefined) => {
      if (!file) return
      if (!ACCEPT.includes(file.type) && !file.name.match(/\.(jpe?g|png|webp)$/i)) {
        setError('Use a JPG, PNG, or WebP photo.')
        return
      }
      if (file.size > MAX_BYTES) {
        setError('Keep the file under 20 MB.')
        return
      }
      setError(null)
      onFile(file)
    },
    [onFile],
  )

  const onDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault()
    setHover(false)
    if (disabled) return
    takeFile(event.dataTransfer.files[0])
  }

  const onChange = (event: ChangeEvent<HTMLInputElement>) => {
    takeFile(event.target.files?.[0])
    event.target.value = ''
  }

  return (
    <label
      className={`dropzone ${hover ? 'is-hover' : ''} ${disabled ? 'is-disabled' : ''}`}
      onDragOver={(event) => {
        event.preventDefault()
        if (!disabled) setHover(true)
      }}
      onDragLeave={() => setHover(false)}
      onDrop={onDrop}
    >
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        hidden
        disabled={disabled}
        onChange={onChange}
      />
      <span className="dropzone-frame" aria-hidden="true" />
      <span className="dropzone-copy">
        <strong>Drop a portrait</strong>
        <span>or click to choose a photo</span>
      </span>
      {error ? <span className="dropzone-error">{error}</span> : null}
    </label>
  )
}
