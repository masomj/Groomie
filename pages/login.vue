<script setup lang="ts">
definePageMeta({ layout: 'default' })

const { login } = useAuth()

const form = reactive({
  email: '',
  password: '',
})
const error = ref('')
const submitting = ref(false)
const showPassword = ref(false)

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
            <div class="relative">
              <input
                id="password"
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                required
                autocomplete="current-password"
                class="input-field pr-10"
              />
              <button
                type="button"
                class="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                @click="showPassword = !showPassword"
              >
                <svg v-if="!showPassword" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
                <span class="sr-only">{{ showPassword ? 'Hide password' : 'Show password' }}</span>
              </button>
            </div>
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
