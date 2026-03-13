<script setup lang="ts">
definePageMeta({ layout: 'default' })

const route = useRoute()
const token = computed(() => (typeof route.query.token === 'string' ? route.query.token : ''))

const form = reactive({
  password: '',
  confirmPassword: '',
})

const submitting = ref(false)
const error = ref('')
const success = ref('')

async function onSubmit() {
  error.value = ''
  success.value = ''

  if (!token.value) {
    error.value = 'This reset link is invalid.'
    return
  }
  if (form.password.length < 8) {
    error.value = 'Password must be at least 8 characters.'
    return
  }
  if (form.password !== form.confirmPassword) {
    error.value = 'Passwords do not match.'
    return
  }

  submitting.value = true
  try {
    await $fetch('/api/auth/reset-password', {
      method: 'POST',
      body: { token: token.value, password: form.password },
    })
    success.value = 'Password updated. You can now log in.'
    setTimeout(() => navigateTo('/login'), 1000)
  } catch (e: any) {
    error.value = e?.data?.statusMessage || 'Could not reset password.'
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
          <h1 class="text-2xl font-bold text-gray-900">Set a new password</h1>
          <p class="text-sm text-gray-500 mt-1">Choose a strong password for your account.</p>
        </div>

        <form class="space-y-5" @submit.prevent="onSubmit">
          <div v-if="error" class="alert-error" role="alert">{{ error }}</div>
          <div v-if="success" class="p-3 rounded-md bg-green-50 text-green-700 text-sm" role="status">{{ success }}</div>

          <div>
            <label for="password" class="block text-sm font-medium text-gray-700 mb-1.5">New password</label>
            <input id="password" v-model="form.password" type="password" required minlength="8" autocomplete="new-password" class="input-field" />
          </div>

          <div>
            <label for="confirmPassword" class="block text-sm font-medium text-gray-700 mb-1.5">Confirm new password</label>
            <input id="confirmPassword" v-model="form.confirmPassword" type="password" required minlength="8" autocomplete="new-password" class="input-field" />
          </div>

          <button type="submit" :disabled="submitting" class="btn-primary w-full disabled:opacity-50">
            {{ submitting ? 'Updating password...' : 'Update password' }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>
