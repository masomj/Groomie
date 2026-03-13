import { watch } from 'vue'
import { getGaScriptSrc, isAnalyticsCookieName } from '~/utils/ga-consent'

const GA_MEASUREMENT_ID = 'G-3P6Z7MTJLN'
let scriptLoaded = false

function injectGtagScript(): void {
  if (scriptLoaded) return
  scriptLoaded = true

  const script = document.createElement('script')
  script.async = true
  script.src = getGaScriptSrc(GA_MEASUREMENT_ID)
  document.head.appendChild(script)

  ;(window as any).dataLayer = (window as any).dataLayer || []
  ;(window as any).gtag = function (..._args: unknown[]) {
    ;(window as any).dataLayer.push(arguments)
  }
  ;(window as any).gtag('js', new Date())
  ;(window as any).gtag('config', GA_MEASUREMENT_ID, { send_page_view: false })
}

function removeGtagScript(): void {
  document
    .querySelectorAll('script[src*="googletagmanager.com/gtag"]')
    .forEach((el) => el.remove())

  ;(window as any).dataLayer = []
  ;(window as any).gtag = undefined

  document.cookie.split(';').forEach((cookie) => {
    const name = cookie.split('=')[0]?.trim()
    if (name && isAnalyticsCookieName(name)) {
      const hostname = window.location.hostname
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${hostname}`
    }
  })

  scriptLoaded = false
}

function trackPageView(path: string): void {
  const gtag = (window as any).gtag
  if (!scriptLoaded || !gtag) return
  gtag('config', GA_MEASUREMENT_ID, { page_path: path })
}

export default defineNuxtPlugin(() => {
  const router = useRouter()
  const { consentStatus, hasConsented } = useCookieConsent()

  watch(
    consentStatus,
    (status) => {
      if (status === 'accepted') {
        injectGtagScript()
        trackPageView(router.currentRoute.value.fullPath)
      } else if (status === 'declined') {
        removeGtagScript()
      }
    },
    { immediate: true },
  )

  router.afterEach((to) => {
    if (hasConsented.value) {
      trackPageView(to.fullPath)
    }
  })
})
