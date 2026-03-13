<template>
  <div>
    <Head>
      <title>Contact Us - Pampered Pooch Porthcawl</title>
    </Head>

    <h1 class="text-3xl font-bold text-gray-800 mb-8 text-center">Contact Us</h1>

    <div class="max-w-2xl mx-auto">
      <p class="text-gray-600 text-center mb-8">
        Ready to book a groom or have a question? Get in touch and I'll get back to you as soon as possible.
      </p>

      <!-- Placeholder contact form - wired up in a later phase -->
      <form class="space-y-5" @submit.prevent="handleSubmit">
        <div>
          <label for="name" class="block text-sm font-medium text-gray-700 mb-1">Your Name</label>
          <input
            id="name"
            type="text"
            class="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent"
            placeholder="Jane Smith"
          />
        </div>

        <div>
          <label for="email" class="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
          <input
            id="email"
            type="email"
            class="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent"
            placeholder="jane@example.com"
          />
        </div>

        <div>
          <label for="phone" class="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
          <input
            id="phone"
            type="tel"
            class="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent"
            placeholder="07700 900000"
          />
        </div>

        <div>
          <label for="message" class="block text-sm font-medium text-gray-700 mb-1">Message</label>
          <textarea
            id="message"
            rows="4"
            class="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent"
            placeholder="Tell us about your dog and what service you're interested in..."
          />
        </div>

        <button
          type="submit"
          class="w-full bg-brand-blue-dark text-white py-3 rounded hover:bg-brand-blue transition-colors font-medium"
        >
          Send Message
        </button>

        <p v-if="submitted" class="text-center text-green-600 font-medium">
          Thanks! This form is a placeholder &mdash; full booking &amp; contact flow coming soon.
        </p>
      </form>

      <div class="mt-10 bg-gray-50 rounded-lg p-6 text-center">
        <h2 class="text-xl font-semibold text-gray-800 mb-2">Location</h2>
        <p class="text-gray-600">Porthcawl, South Wales</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const submitted = ref(false)

function handleSubmit() {
  submitted.value = true
}
</script>
