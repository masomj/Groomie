<script setup lang="ts">
definePageMeta({ layout: 'default' })

const { login } = useAuth()

const form = reactive({
  email: '',
  password: '',
})
const error = ref('')
const submitting = ref(false)

async function onSubmit() {
  error.value = ''
  submitting.value = true
  try {
    const user = await login(form.email, form.password)
    await navigateTo(user.role === 'ADMIN' ? '/admin' : '/dashboard')
  } catch (e: any) {
    error.value = e?.data?.statusMessage || 'Login failed. Please try again.'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="max-w-md mx-auto mt-12">
    <h1 class="text-2xl font-bold mb-6 text-center">Log In</h1>

    <form class="space-y-4" @submit.prevent="onSubmit">
      <div v-if="error" class="bg-red-50 border border-red-300 text-red-700 px-4 py-2 rounded text-sm">
        {{ error }}
      </div>

      <div>
        <label for="email" class="block text-sm font-medium mb-1">Email</label>
        <input
          id="email"
          v-model="form.email"
          type="email"
          required
          autocomplete="email"
          class="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-blue"
        />
      </div>

      <div>
        <label for="password" class="block text-sm font-medium mb-1">Password</label>
        <input
          id="password"
          v-model="form.password"
          type="password"
          required
          autocomplete="current-password"
          class="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-blue"
        />
      </div>

      <button
        type="submit"
        :disabled="submitting"
        class="w-full bg-brand-blue text-white py-2 rounded hover:bg-brand-blue-dark disabled:opacity-50"
      >
        {{ submitting ? 'Logging in...' : 'Log In' }}
      </button>
    </form>

    <p class="mt-4 text-center text-sm text-gray-600">
      Don't have an account?
      <NuxtLink to="/register" class="text-brand-blue hover:underline">Register</NuxtLink>
    </p>
  </div>
</template>
