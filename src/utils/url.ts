// Helper to check if a URL is from an allowed domain
export function isAllowedDomain(url: string, allowedDomains: string[]): boolean {
  try {
    const urlObj = new URL(url)
    return allowedDomains.some((domain) => urlObj.hostname === domain || urlObj.hostname.endsWith(`.${domain}`))
  } catch {
    return false
  }
}

// Helper to convert username to Vibatar.ai URL
export function usernameToVibatarUrl(username: string): string {
  // Check if username contains a type (format: username/type)
  const [name, type] = username.split('/')
  if (type) {
    return `https://vibatar.ai/${name}/${type}.glb`
  }
  return `https://vibatar.ai/${username}.glb`
}

export function isUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return parsed.protocol !== ''
  } catch {
    return false
  }
}
