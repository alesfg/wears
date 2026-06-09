import { supabase } from '@/lib/supabase'

export async function removeBackground(imageBase64: string): Promise<string | null> {
  try {
    const { data, error } = await supabase.functions.invoke('remove-background', {
      body: { imageBase64 },
    })
    if (error || !data?.result) return null
    return data.result as string
  } catch {
    return null
  }
}
