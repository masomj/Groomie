<template>
  <Transition
    enter-active-class="transition-all duration-300 ease-out"
    enter-from-class="opacity-0 translate-y-8"
    enter-to-class="opacity-100 translate-y-0"
    leave-active-class="transition-all duration-200 ease-in"
    leave-from-class="opacity-100 translate-y-0"
    leave-to-class="opacity-0 translate-y-8"
  >
    <div
      v-if="bannerVisible"
      role="dialog"
      aria-label="Cookie consent"
      aria-describedby="cookie-banner-text"
      class="fixed bottom-0 inset-x-0 z-50 bg-gray-900 border-t border-gray-700 shadow-lg"
    >
      <div class="container mx-auto px-4 py-4">
        <div class="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <p id="cookie-banner-text" class="text-sm text-gray-200 leading-relaxed flex-1">
            We use analytics cookies to understand site usage and improve the experience.
            <NuxtLink to="/cookie-preferences" class="text-brand-blue hover:underline">
              Manage cookie preferences
            </NuxtLink>
          </p>
          <div class="flex gap-3 shrink-0">
            <button
              class="px-4 py-2 text-sm font-semibold text-gray-200 border border-gray-500 rounded-md hover:bg-gray-800 transition-colors"
              @click="declineCookies"
            >
              Decline
            </button>
            <button
              class="px-4 py-2 text-sm font-semibold text-white bg-brand-blue rounded-md hover:bg-brand-blue-dark transition-colors"
              @click="acceptCookies"
            >
              Accept
            </button>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
const { bannerVisible, acceptCookies, declineCookies } = useCookieConsent()
</script>
