<script setup lang="ts">
const form = reactive({
  name: '',
  email: '',
  phone: '',
  message: '',
})

const submitting = ref(false)
const submitted = ref(false)
const error = ref('')

async function handleSubmit() {
  error.value = ''
  submitting.value = true
  try {
    await $fetch('/api/leads', {
      method: 'POST',
      body: form,
    })
    submitted.value = true
  } catch (e: any) {
    error.value = e?.data?.statusMessage || 'Something went wrong. Please try again.'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="max-w-4xl mx-auto">
    <Head>
      <title>Contact Us - Pampered Pooch Porthcawl</title>
    </Head>

    <div class="text-center mb-10">
      <h1 class="section-heading mb-3">Contact Us</h1>
      <p class="section-subheading">Questions, quotes, or booking help — send a message and we’ll get back to you.</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div>
        <div v-if="submitted" class="card p-8 text-center animate-fade-in" role="status">
          <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 class="text-lg font-semibold text-gray-900 mb-2">Message Sent!</h2>
          <p class="text-gray-500 text-sm">
            Thank you for getting in touch. We'll get back to you as soon as possible.
          </p>
        </div>

        <form v-else class="card p-8 space-y-5" @submit.prevent="handleSubmit">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5" for="name">Name *</label>
            <input
              id="name"
              v-model="form.name"
              type="text"
              required
              placeholder="Jane Smith"
              class="input-field"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5" for="email">Email *</label>
            <input
              id="email"
              v-model="form.email"
              type="email"
              required
              placeholder="jane@example.com"
              class="input-field"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5" for="phone">Phone</label>
            <input
              id="phone"
              v-model="form.phone"
              type="tel"
              placeholder="07700 900000"
              class="input-field"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5" for="message">Message</label>
            <textarea
              id="message"
              v-model="form.message"
              rows="5"
              placeholder="How can we help?"
              class="input-field"
            ></textarea>
          </div>

          <div v-if="error" class="alert-error" role="alert">
            <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            {{ error }}
          </div>

          <button
            type="submit"
            :disabled="submitting"
            class="btn-primary w-full disabled:opacity-50"
          >
            {{ submitting ? 'Sending...' : 'Send Message' }}
          </button>
        </form>
      </div>

      <div class="space-y-6">
        <div class="card p-8">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">Find Us</h2>
          <p class="text-sm text-gray-500 mb-6">
            We're based in Porthcawl, South Wales. Get in touch and we'll arrange
            everything for your furry friend.
          </p>
          <div class="space-y-4">
            <div class="flex items-center gap-3 text-sm text-gray-600">
              <div class="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-brand-blue shrink-0">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
              </div>
              Porthcawl, South Wales
            </div>
            <div class="flex items-center gap-3 text-sm">
              <div class="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-brand-blue shrink-0">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                </svg>
              </div>
              <a href="mailto:hello@pamperedpoochporthcawl.co.uk" class="text-brand-blue-dark hover:underline">
                hello@pamperedpoochporthcawl.co.uk
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
