import { removeBackground as nativeRemoveBackground, isNativeBackgroundRemovalSupported } from '@six33/react-native-bg-removal'
import { supabase } from '@/lib/supabase'

export async function removeBackground(uri: string, base64: string): Promise<string | null> {
  try {
    if (await isNativeBackgroundRemovalSupported()) {
      return await nativeRemoveBackground(uri)
    }
  } catch {
    // fall through to API fallback
  }

  try {
    const { data, error } = await supabase.functions.invoke('remove-background', {
      body: { imageBase64: base64 },
    })
    if (error || !data?.result) return null
    return data.result as string
  } catch {
    return null
  }
}
