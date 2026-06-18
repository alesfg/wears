import { supabase } from '@/lib/supabase'
import { CATEGORIES } from '@/constants/config'
import { locale } from '@/lib/i18n'

type Category = (typeof CATEGORIES)[number]

export interface GarmentAnalysis {
  name: string
  brand: string | null
  category: Category | null
  color: string | null
}

export async function analyzeGarment(
  imageBase64: string,
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp' = 'image/jpeg'
): Promise<GarmentAnalysis | null> {
  try {
    const { data, error } = await supabase.functions.invoke('analyze-garment', {
      body: { imageBase64, mimeType, locale },
    })
    if (error || !data?.result) return null
    return data.result as GarmentAnalysis
  } catch {
    return null
  }
}
