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
  <div class="max-w-md mx-auto mt-8">
    <div class="card overflow-hidden">
      <div class="h-2 bg-gradient-to-r from-brand-blue-dark to-brand-blue"></div>
      <div class="p-8">
        <div class="text-center mb-8">
          <h1 class="text-2xl font-bold text-gray-900">Welcome Back</h1>
          <p class="text-sm text-gray-500 mt-1">Log in to your account</p>
        </div>

        <form class="space-y-5" @submit.prevent="onSubmit">
          <div v-if="error" class="alert-error" role="alert">
            <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            {{ error }}
          </div>

          <div>
            <label for="email" class="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
            <input
              id="email"
              v-model="form.email"
              type="email"
              required
              autocomplete="email"
              class="input-field"
            />
          </div>

          <div>
            <label for="password" class="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
            <input
              id="password"
              v-model="form.password"
              type="password"
              required
              autocomplete="current-password"
              class="input-field"
            />
          </div>

          <button
            type="submit"
            :disabled="submitting"
            class="btn-primary w-full disabled:opacity-50"
          >
            {{ submitting ? 'Logging in...' : 'Log In' }}
          </button>
        </form>

        <p class="mt-6 text-center text-sm text-gray-500">
          Don't have an account?
          <NuxtLink to="/register" class="text-brand-blue font-medium hover:underline">Register</NuxtLink>
        </p>
      </div>
    </div>
  </div>
</template>
