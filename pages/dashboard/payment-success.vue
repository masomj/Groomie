<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const route = useRoute()
const sessionId = route.query.session_id as string

const loading = ref(true)
const paymentDetails = ref<any>(null)
const error = ref('')

onMounted(async () => {
  if (!sessionId) {
    error.value = 'No session ID provided.'
    loading.value = false
    return
  }

  try {
    const data = await $fetch('/api/payments/status', {
      params: { session_id: sessionId },
    })
    paymentDetails.value = data
  } catch (e: any) {
    error.value = e?.data?.statusMessage || 'Could not retrieve payment details.'
  } finally {
    loading.value = false
  }
})

function formatPrice(pence: number) {
  return `£${(pence / 100).toFixed(2)}`
}
</script>

<template>
  <div class="max-w-2xl mx-auto mt-12 px-4">
    <Head>
      <title>Payment Confirmation - Pampered Pooch Porthcawl</title>
    </Head>

    <!-- Loading state -->
    <div v-if="loading" class="card p-12 text-center">
      <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
        <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <p class="text-gray-500 font-medium animate-pulse">Verifying payment...</p>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="card p-8 text-center">
      <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg class="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h1 class="text-xl font-bold text-red-700 mb-3">Payment Error</h1>
      <div class="alert-error justify-center mb-6">
        <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        {{ error }}
      </div>
      <NuxtLink to="/dashboard" class="btn-primary">
        Return to Dashboard
      </NuxtLink>
    </div>

    <!-- Success state -->
    <div v-else class="card p-8">
      <div class="text-center mb-8">
        <div class="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5 ring-4 ring-green-50">
          <svg class="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 class="text-2xl font-bold text-green-700">Payment Successful</h1>
        <p class="text-gray-500 mt-2">Thank you for your payment!</p>
      </div>

      <div v-if="paymentDetails" class="bg-gray-50 rounded-lg border border-gray-100 divide-y divide-gray-200">
        <div class="flex justify-between items-center px-5 py-4">
          <span class="text-sm text-gray-500">Service</span>
          <span class="text-sm font-medium text-gray-900">{{ paymentDetails.serviceName }}</span>
        </div>
        <div class="flex justify-between items-center px-5 py-4">
          <span class="text-sm text-gray-500">Dog</span>
          <span class="text-sm font-medium text-gray-900">{{ paymentDetails.dogName }}</span>
        </div>
        <div class="flex justify-between items-center px-5 py-4">
          <span class="text-sm text-gray-500">Amount Paid</span>
          <span class="text-sm font-semibold text-gray-900">{{ formatPrice(paymentDetails.amountPence) }}</span>
        </div>
        <div v-if="paymentDetails.invoiceNumber" class="flex justify-between items-center px-5 py-4">
          <span class="text-sm text-gray-500">Invoice</span>
          <a
            :href="`/api/invoices/${paymentDetails.invoiceNumber}`"
            class="text-sm text-brand-blue-dark hover:underline font-medium inline-flex items-center gap-1.5"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {{ paymentDetails.invoiceNumber }}
          </a>
        </div>
        <div class="flex justify-between items-center px-5 py-4">
          <span class="text-sm text-gray-500">Status</span>
          <span class="badge bg-green-100 text-green-800">
            {{ paymentDetails.paymentStatus }}
          </span>
        </div>
      </div>

      <div class="mt-8 text-center">
        <NuxtLink to="/dashboard" class="btn-primary">
          Return to Dashboard
        </NuxtLink>
      </div>
    </div>
  </div>
</template>
