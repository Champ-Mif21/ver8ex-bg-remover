export type ColorPreset = {
  id: string
  label: string
  color: string
}

export const COLOR_PRESETS: ColorPreset[] = [
  { id: 'white', label: 'White', color: '#ffffff' },
  { id: 'offwhite', label: 'Off-white', color: '#f3f1ec' },
  { id: 'sky', label: 'Light blue', color: '#8eb8dc' },
  { id: 'passport', label: 'Passport blue', color: '#3d7ec9' },
  { id: 'studio', label: 'Studio blue', color: '#2a5f9e' },
  { id: 'navy', label: 'Navy', color: '#16324f' },
]

export const DEFAULT_BG_COLOR = COLOR_PRESETS[3].color
