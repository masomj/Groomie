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
  <div class="max-w-md mx-auto mt-12">
    <h1 class="text-2xl font-bold mb-6 text-center">Create an Account</h1>

    <form class="space-y-4" @submit.prevent="onSubmit">
      <div v-if="error" class="bg-red-50 border border-red-300 text-red-700 px-4 py-2 rounded text-sm">
        {{ error }}
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div>
          <label for="firstName" class="block text-sm font-medium mb-1">First Name</label>
          <input
            id="firstName"
            v-model="form.firstName"
            type="text"
            required
            class="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-blue"
          />
        </div>
        <div>
          <label for="lastName" class="block text-sm font-medium mb-1">Last Name</label>
          <input
            id="lastName"
            v-model="form.lastName"
            type="text"
            required
            class="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-blue"
          />
        </div>
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
          minlength="8"
          autocomplete="new-password"
          class="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-blue"
        />
        <p class="text-xs text-gray-500 mt-1">Minimum 8 characters</p>
      </div>

      <div>
        <label for="confirmPassword" class="block text-sm font-medium mb-1">Confirm Password</label>
        <input
          id="confirmPassword"
          v-model="form.confirmPassword"
          type="password"
          required
          minlength="8"
          autocomplete="new-password"
          class="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-blue"
        />
      </div>

      <button
        type="submit"
        :disabled="submitting"
        class="w-full bg-brand-blue text-white py-2 rounded hover:bg-brand-blue-dark disabled:opacity-50"
      >
        {{ submitting ? 'Creating account...' : 'Register' }}
      </button>
    </form>

    <p class="mt-4 text-center text-sm text-gray-600">
      Already have an account?
      <NuxtLink to="/login" class="text-brand-blue hover:underline">Log in</NuxtLink>
    </p>
  </div>
</template>
