export type Transform = {
  scale: number
  x: number
  y: number
}

export const DEFAULT_TRANSFORM: Transform = { scale: 1, x: 0, y: 0 }

export type Background =
  | { kind: 'color'; color: string }
  | { kind: 'image'; image: HTMLImageElement }

export function loadImage(source: string | Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url =
      typeof source === 'string' ? source : URL.createObjectURL(source)
    const img = new Image()
    img.decoding = 'async'
    img.onload = () => resolve(img)
    img.onerror = () => {
      if (typeof source !== 'string') URL.revokeObjectURL(url)
      reject(new Error('Could not load image'))
    }
    img.src = url
  })
}

function drawCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  dx: number,
  dy: number,
  dw: number,
  dh: number,
) {
  const ir = img.naturalWidth / img.naturalHeight
  const fr = dw / dh
  let sx = 0
  let sy = 0
  let sw = img.naturalWidth
  let sh = img.naturalHeight

  if (ir > fr) {
    sw = img.naturalHeight * fr
    sx = (img.naturalWidth - sw) / 2
  } else {
    sh = img.naturalWidth / fr
    sy = (img.naturalHeight - sh) / 2
  }

  ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh)
}

export function drawBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  background: Background,
) {
  if (background.kind === 'image') {
    drawCover(ctx, background.image, 0, 0, width, height)
    return
  }
  ctx.fillStyle = background.color
  ctx.fillRect(0, 0, width, height)
}

export function subjectLayout(
  frameW: number,
  frameH: number,
  imageW: number,
  imageH: number,
  transform: Transform,
) {
  const coverScale = Math.max(frameW / imageW, frameH / imageH)
  const scale = coverScale * transform.scale
  const drawnW = imageW * scale
  const drawnH = imageH * scale
  return {
    x: (frameW - drawnW) / 2 + transform.x * frameW,
    y: (frameH - drawnH) / 2 + transform.y * frameH,
    drawnW,
    drawnH,
  }
}

export function drawSubject(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  subject: HTMLImageElement,
  transform: Transform,
) {
  const { x, y, drawnW, drawnH } = subjectLayout(
    width,
    height,
    subject.naturalWidth,
    subject.naturalHeight,
    transform,
  )
  ctx.drawImage(subject, x, y, drawnW, drawnH)
}

export function drawPassport(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  background: Background,
  subject: HTMLImageElement,
  transform: Transform,
) {
  ctx.save()
  ctx.beginPath()
  ctx.rect(0, 0, width, height)
  ctx.clip()
  drawBackground(ctx, width, height, background)
  drawSubject(ctx, width, height, subject, transform)
  ctx.restore()
}

export function drawGuides(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
) {
  ctx.save()
  ctx.strokeStyle = 'rgba(255,255,255,0.28)'
  ctx.lineWidth = 1
  ctx.setLineDash([4, 4])

  const eyeY = height * 0.42
  ctx.beginPath()
  ctx.moveTo(width * 0.12, eyeY)
  ctx.lineTo(width * 0.88, eyeY)
  ctx.stroke()

  ctx.beginPath()
  ctx.ellipse(width / 2, height * 0.4, width * 0.3, height * 0.32, 0, 0, Math.PI * 2)
  ctx.stroke()
  ctx.restore()
}

export function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality?: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob)
        else reject(new Error('Could not encode image'))
      },
      type,
      quality,
    )
  })
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function slug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}
