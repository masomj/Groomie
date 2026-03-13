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
  <div class="max-w-2xl mx-auto mt-12">
    <Head>
      <title>Payment Confirmation - Pampered Pooch Porthcawl</title>
    </Head>

    <div v-if="loading" class="text-center py-12">
      <p class="text-gray-500">Verifying payment...</p>
    </div>

    <div v-else-if="error" class="border rounded-lg p-8 text-center">
      <h1 class="text-xl font-bold text-red-600 mb-2">Payment Error</h1>
      <p class="text-gray-600">{{ error }}</p>
      <NuxtLink to="/dashboard" class="mt-4 inline-block text-brand-blue-dark hover:underline">
        Return to Dashboard
      </NuxtLink>
    </div>

    <div v-else class="border rounded-lg p-8">
      <div class="text-center mb-6">
        <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 class="text-2xl font-bold text-green-700">Payment Successful</h1>
        <p class="text-gray-600 mt-1">Thank you for your payment!</p>
      </div>

      <div v-if="paymentDetails" class="space-y-3 text-sm">
        <div class="flex justify-between py-2 border-b">
          <span class="text-gray-500">Service</span>
          <span class="font-medium">{{ paymentDetails.serviceName }}</span>
        </div>
        <div class="flex justify-between py-2 border-b">
          <span class="text-gray-500">Dog</span>
          <span class="font-medium">{{ paymentDetails.dogName }}</span>
        </div>
        <div class="flex justify-between py-2 border-b">
          <span class="text-gray-500">Amount Paid</span>
          <span class="font-medium">{{ formatPrice(paymentDetails.amountPence) }}</span>
        </div>
        <div v-if="paymentDetails.invoiceNumber" class="flex justify-between py-2 border-b">
          <span class="text-gray-500">Invoice</span>
          <a
            :href="`/api/invoices/${paymentDetails.invoiceNumber}`"
            class="text-brand-blue-dark hover:underline font-medium"
          >
            {{ paymentDetails.invoiceNumber }} (Download)
          </a>
        </div>
        <div class="flex justify-between py-2">
          <span class="text-gray-500">Status</span>
          <span class="text-xs px-2 py-1 rounded-full font-medium bg-green-100 text-green-800">
            {{ paymentDetails.paymentStatus }}
          </span>
        </div>
      </div>

      <div class="mt-8 text-center">
        <NuxtLink
          to="/dashboard"
          class="bg-brand-blue-dark text-white px-6 py-2 rounded hover:bg-brand-blue transition-colors"
        >
          Return to Dashboard
        </NuxtLink>
      </div>
    </div>
  </div>
</template>
