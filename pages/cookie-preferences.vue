<script setup lang="ts">
const { consentStatus, acceptCookies, declineCookies, resetConsent } = useCookieConsent()

const statusLabel = computed(() => {
  if (consentStatus.value === 'accepted') return 'Accepted'
  if (consentStatus.value === 'declined') return 'Declined'
  return 'Not decided'
})
</script>

<template>
  <div>
    <Head>
      <title>Cookie Preferences - Pampered Pooch Porthcawl</title>
    </Head>

    <div class="text-center mb-10">
      <h1 class="section-heading mb-3">Cookie Preferences</h1>
      <p class="section-subheading">Choose whether analytics cookies are enabled on this site.</p>
    </div>

    <div class="max-w-3xl mx-auto">
      <div class="card p-8 space-y-6 text-gray-600">
        <section>
          <h2 class="text-lg font-semibold text-gray-900 mb-2">Cookies in use</h2>
          <p>
            This site uses optional Google Analytics 4 cookies for usage analytics.
            No analytics cookies are set until you accept.
          </p>
        </section>

        <section>
          <h2 class="text-lg font-semibold text-gray-900 mb-2">Your current choice</h2>
          <p>
            Status:
            <strong class="text-gray-900">{{ statusLabel }}</strong>
          </p>
          <div class="flex flex-wrap gap-3 mt-4">
            <button
              v-if="consentStatus !== 'accepted'"
              class="btn-primary"
              @click="acceptCookies"
            >
              Accept analytics cookies
            </button>
            <button
              v-if="consentStatus !== 'declined'"
              class="btn-secondary"
              @click="declineCookies"
            >
              Decline analytics cookies
            </button>
            <button
              v-if="consentStatus !== 'undecided'"
              class="btn-secondary"
              @click="resetConsent"
            >
              Reset choice
            </button>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>
