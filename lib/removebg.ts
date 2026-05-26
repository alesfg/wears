const API_KEY = process.env.EXPO_PUBLIC_REMOVEBG_API_KEY ?? "";

export async function removeBackground(imageBase64: string): Promise<string | null> {
  if (!API_KEY) return null;
  try {
    const res = await fetch("https://api.remove.bg/v1.0/removebg", {
      method: "POST",
      headers: {
        "X-Api-Key": API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ image_file_b64: imageBase64, size: "auto" }),
    });

    if (!res.ok) return null;

    // Response is binary PNG — convert to base64 data URI
    const buffer = await res.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return `data:image/png;base64,${btoa(binary)}`;
  } catch {
    return null;
  }
}
