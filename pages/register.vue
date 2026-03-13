<script setup lang="ts">
definePageMeta({ layout: 'default' })

const { register } = useAuth()

const form = reactive({
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  confirmPassword: '',
})
const error = ref('')
const submitting = ref(false)

async function onSubmit() {
  error.value = ''

  if (form.password !== form.confirmPassword) {
    error.value = 'Passwords do not match.'
    return
  }

  submitting.value = true
  try {
    await register({
      email: form.email,
      password: form.password,
      firstName: form.firstName,
      lastName: form.lastName,
    })
    await navigateTo('/dashboard')
  } catch (e: any) {
    error.value = e?.data?.statusMessage || 'Registration failed. Please try again.'
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
          <h1 class="text-2xl font-bold text-gray-900">Create an Account</h1>
          <p class="text-sm text-gray-500 mt-1">Join us to book appointments online</p>
        </div>

        <form class="space-y-5" @submit.prevent="onSubmit">
          <div v-if="error" class="alert-error" role="alert">
            <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            {{ error }}
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label for="firstName" class="block text-sm font-medium text-gray-700 mb-1.5">First Name</label>
              <input
                id="firstName"
                v-model="form.firstName"
                type="text"
                required
                class="input-field"
              />
            </div>
            <div>
              <label for="lastName" class="block text-sm font-medium text-gray-700 mb-1.5">Last Name</label>
              <input
                id="lastName"
                v-model="form.lastName"
                type="text"
                required
                class="input-field"
              />
            </div>
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
              minlength="8"
              autocomplete="new-password"
              class="input-field"
            />
            <p class="text-xs text-gray-400 mt-1.5">Minimum 8 characters</p>
          </div>

          <div>
            <label for="confirmPassword" class="block text-sm font-medium text-gray-700 mb-1.5">Confirm Password</label>
            <input
              id="confirmPassword"
              v-model="form.confirmPassword"
              type="password"
              required
              minlength="8"
              autocomplete="new-password"
              class="input-field"
            />
          </div>

          <button
            type="submit"
            :disabled="submitting"
            class="btn-primary w-full disabled:opacity-50"
          >
            {{ submitting ? 'Creating account...' : 'Register' }}
          </button>
        </form>

        <p class="mt-6 text-center text-sm text-gray-500">
          Already have an account?
          <NuxtLink to="/login" class="text-brand-blue font-medium hover:underline">Log in</NuxtLink>
        </p>
      </div>
    </div>
  </div>
</template>
