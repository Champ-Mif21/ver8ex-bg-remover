import { removeBackground } from '@imgly/background-removal'

export type ProgressInfo = {
  key: string
  current: number
  total: number
}

export async function cutoutBackground(
  image: Blob,
  onProgress?: (info: ProgressInfo) => void,
): Promise<Blob> {
  return removeBackground(image, {
    debug: false,
    model: 'isnet_fp16',
    output: {
      format: 'image/png',
      quality: 1,
    },
    progress: (key, current, total) => {
      onProgress?.({ key, current, total })
    },
  })
}

export function progressLabel(key: string): string {
  const k = key.toLowerCase()
  if (k.includes('wasm') || k.includes('ort')) return 'Loading image engine'
  if (k.includes('isnet') || k.includes('onnx') || k.includes('model')) {
    return 'Downloading AI model'
  }
  if (k.includes('infer') || k.includes('compute')) return 'Removing background'
  return 'Working'
}
