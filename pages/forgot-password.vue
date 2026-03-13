<script setup lang="ts">
definePageMeta({ layout: 'default' })

const form = reactive({ email: '' })
const submitting = ref(false)
const success = ref('')
const error = ref('')

async function onSubmit() {
  submitting.value = true
  success.value = ''
  error.value = ''
  try {
    const res = await $fetch<{ message: string }>('/api/auth/forgot-password', {
      method: 'POST',
      body: { email: form.email },
    })
    success.value = res.message
  } catch (e: any) {
    error.value = e?.data?.statusMessage || 'Unable to process request right now.'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="max-w-md mx-auto mt-8">
    <div class="card overflow-hidden">
      <div class="h-2 bg-gradient-to-r from-brand-blue-dark to-brand-blue"></div>
      <div class="p-8">
        <div class="text-center mb-8">
          <h1 class="text-2xl font-bold text-gray-900">Reset your password</h1>
          <p class="text-sm text-gray-500 mt-1">Enter your email and we’ll send a magic reset link.</p>
        </div>

        <form class="space-y-5" @submit.prevent="onSubmit">
          <div v-if="error" class="alert-error" role="alert">{{ error }}</div>
          <div v-if="success" class="p-3 rounded-md bg-green-50 text-green-700 text-sm" role="status">{{ success }}</div>

          <div>
            <label for="email" class="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
            <input id="email" v-model="form.email" type="email" required autocomplete="email" class="input-field" />
          </div>

          <button type="submit" :disabled="submitting" class="btn-primary w-full disabled:opacity-50">
            {{ submitting ? 'Sending link...' : 'Send reset link' }}
          </button>
        </form>

        <p class="mt-6 text-center text-sm text-gray-500">
          Remembered your password?
          <NuxtLink to="/login" class="text-brand-blue font-medium hover:underline">Log in</NuxtLink>
        </p>
      </div>
    </div>
  </div>
</template>
