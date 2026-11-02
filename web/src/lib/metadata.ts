export type BadgeMetadata = {
  name?: string
  description?: string
  image?: string
}

/** Turns a token URI (on-chain data URI, ipfs:// or https://) into its JSON metadata. */
export async function loadMetadata(uri: string): Promise<BadgeMetadata> {
  const base64Prefix = 'data:application/json;base64,'
  const plainPrefix = 'data:application/json,'
  if (uri.startsWith(base64Prefix)) return JSON.parse(decodeBase64(uri.slice(base64Prefix.length)))
  if (uri.startsWith(plainPrefix)) return JSON.parse(decodeURIComponent(uri.slice(plainPrefix.length)))

  const res = await fetch(resolveUri(uri))
  if (!res.ok) throw new Error(`Metadata request failed (${res.status})`)
  return res.json()
}

/** Makes ipfs:// links loadable in the browser. */
export function resolveUri(uri: string): string {
  return uri.startsWith('ipfs://') ? `https://ipfs.io/ipfs/${uri.slice('ipfs://'.length)}` : uri
}

function decodeBase64(value: string): string {
  const bytes = Uint8Array.from(atob(value), (char) => char.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}
