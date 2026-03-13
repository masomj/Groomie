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
  <div class="max-w-4xl mx-auto mt-10">
    <Head>
      <title>Contact Us - Pampered Pooch Porthcawl</title>
    </Head>

    <h1 class="text-3xl font-bold mb-6">Contact Us</h1>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-10">
      <div>
        <div v-if="submitted" class="bg-green-50 border border-green-200 rounded-lg p-6">
          <h2 class="text-lg font-semibold text-green-800 mb-2">Message Sent!</h2>
          <p class="text-green-700 text-sm">
            Thank you for getting in touch. We'll get back to you as soon as possible.
          </p>
        </div>

        <form v-else @submit.prevent="handleSubmit" class="space-y-4">
          <div>
            <label class="block text-sm font-medium mb-1" for="name">Name *</label>
            <input
              id="name"
              v-model="form.name"
              type="text"
              required
              placeholder="Jane Smith"
              class="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
            />
          </div>

          <div>
            <label class="block text-sm font-medium mb-1" for="email">Email *</label>
            <input
              id="email"
              v-model="form.email"
              type="email"
              required
              placeholder="jane@example.com"
              class="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
            />
          </div>

          <div>
            <label class="block text-sm font-medium mb-1" for="phone">Phone</label>
            <input
              id="phone"
              v-model="form.phone"
              type="tel"
              placeholder="07700 900000"
              class="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
            />
          </div>

          <div>
            <label class="block text-sm font-medium mb-1" for="message">Message</label>
            <textarea
              id="message"
              v-model="form.message"
              rows="5"
              placeholder="How can we help?"
              class="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
            ></textarea>
          </div>

          <p v-if="error" class="text-red-600 text-sm">{{ error }}</p>

          <button
            type="submit"
            :disabled="submitting"
            class="bg-brand-blue-dark text-white px-6 py-2 rounded hover:bg-brand-blue transition-colors disabled:opacity-50"
          >
            {{ submitting ? 'Sending...' : 'Send Message' }}
          </button>
        </form>
      </div>

      <div>
        <div class="bg-gray-50 border rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-3">Find Us</h2>
          <p class="text-sm text-gray-600 mb-4">
            We're based in Porthcawl, South Wales. Get in touch and we'll arrange
            everything for your furry friend.
          </p>
          <div class="space-y-2 text-sm text-gray-600">
            <p>Porthcawl, South Wales</p>
            <p>
              <a href="mailto:hello@pamperedpoochporthcawl.co.uk" class="text-brand-blue-dark hover:underline">
                hello@pamperedpoochporthcawl.co.uk
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
