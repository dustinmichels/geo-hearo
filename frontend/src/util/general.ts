export function isMobile(): boolean {
  const userAgent: string =
    navigator.userAgent || navigator.vendor || (window as any).opera

  // Check for common mobile devices
  return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
    userAgent
  )
}

export function isDesktop(): boolean {
  return !isMobile()
}
