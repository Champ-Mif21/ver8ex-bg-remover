export type PassportSize = {
  id: string
  label: string
  region: string
  widthMm: number
  heightMm: number
}

export const PASSPORT_SIZES: PassportSize[] = [
  {
    id: 'us-2x2',
    label: '2 × 2 in',
    region: 'US / Pakistan / India',
    widthMm: 50.8,
    heightMm: 50.8,
  },
  {
    id: 'icao-35x45',
    label: '35 × 45 mm',
    region: 'ICAO / UK / EU / Schengen',
    widthMm: 35,
    heightMm: 45,
  },
  {
    id: 'canada-50x70',
    label: '50 × 70 mm',
    region: 'Canada passport',
    widthMm: 50,
    heightMm: 70,
  },
  {
    id: 'china-33x48',
    label: '33 × 48 mm',
    region: 'China visa',
    widthMm: 33,
    heightMm: 48,
  },
  {
    id: 'custom',
    label: 'Custom',
    region: 'Set your own size',
    widthMm: 35,
    heightMm: 45,
  },
]

export const DEFAULT_SIZE_ID = 'us-2x2'
export const EXPORT_DPI = 300

export type PagePreset = {
  id: string
  label: string
  widthMm: number
  heightMm: number
}

export const PAGE_PRESETS: PagePreset[] = [
  { id: '4x6', label: '4 × 6 in sheet', widthMm: 101.6, heightMm: 152.4 },
  { id: 'a4', label: 'A4 sheet', widthMm: 210, heightMm: 297 },
]

export function mmToPx(mm: number, dpi = EXPORT_DPI): number {
  return Math.max(1, Math.round((mm / 25.4) * dpi))
}

export function sizePixels(size: PassportSize, dpi = EXPORT_DPI) {
  return {
    width: mmToPx(size.widthMm, dpi),
    height: mmToPx(size.heightMm, dpi),
  }
}

export type GridCell = { x: number; y: number }

export function layoutGrid(
  pageW: number,
  pageH: number,
  photoW: number,
  photoH: number,
  gap: number,
  margin: number,
): { width: number; height: number; cells: GridCell[] } {
  const cols = Math.max(
    1,
    Math.floor((pageW - 2 * margin + gap) / (photoW + gap)),
  )
  const rows = Math.max(
    1,
    Math.floor((pageH - 2 * margin + gap) / (photoH + gap)),
  )
  const gridW = cols * photoW + (cols - 1) * gap
  const gridH = rows * photoH + (rows - 1) * gap
  const originX = (pageW - gridW) / 2
  const originY = (pageH - gridH) / 2
  const cells: GridCell[] = []
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      cells.push({
        x: originX + c * (photoW + gap),
        y: originY + r * (photoH + gap),
      })
    }
  }
  return { width: pageW, height: pageH, cells }
}

export function bestPrintLayout(
  page: PagePreset,
  photo: PassportSize,
  dpi = EXPORT_DPI,
) {
  const photoW = mmToPx(photo.widthMm, dpi)
  const photoH = mmToPx(photo.heightMm, dpi)
  const gap = mmToPx(4, dpi)
  const margin = mmToPx(8, dpi)
  const portrait = layoutGrid(
    mmToPx(page.widthMm, dpi),
    mmToPx(page.heightMm, dpi),
    photoW,
    photoH,
    gap,
    margin,
  )
  const landscape = layoutGrid(
    mmToPx(page.heightMm, dpi),
    mmToPx(page.widthMm, dpi),
    photoW,
    photoH,
    gap,
    margin,
  )
  return landscape.cells.length > portrait.cells.length ? landscape : portrait
}
