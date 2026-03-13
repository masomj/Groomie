export function getGaScriptSrc(measurementId: string): string {
  return `https://www.googletagmanager.com/gtag/js?id=${measurementId}`
}

export function isAnalyticsCookieName(name: string): boolean {
  return name.startsWith('_ga') || name.startsWith('_gid')
}
