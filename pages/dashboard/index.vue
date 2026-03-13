<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const { user } = useAuth()

const { data: dogsData, refresh: refreshDogs } = useFetch('/api/dogs')
const { data: apptData, refresh: refreshAppts } = useFetch('/api/appointments')

const dogs = computed(() => dogsData.value?.dogs || [])
const appointments = computed(() => apptData.value?.appointments || [])

const upcoming = computed(() =>
  appointments.value
    .filter((a: any) => new Date(a.dateTime) >= new Date() && !['CANCELLED', 'NO_SHOW'].includes(a.status))
    .sort((a: any, b: any) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime())
)

const past = computed(() =>
  appointments.value
    .filter((a: any) => new Date(a.dateTime) < new Date() || ['CANCELLED', 'NO_SHOW'].includes(a.status))
    .sort((a: any, b: any) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime())
)

function formatDate(dt: string) {
  return new Date(dt).toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function formatPrice(pence: number) {
  return `£${(pence / 100).toFixed(2)}`
}

function statusBadgeClass(status: string) {
  const map: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    CONFIRMED: 'bg-blue-100 text-blue-800',
    IN_PROGRESS: 'bg-purple-100 text-purple-800',
    COMPLETED: 'bg-green-100 text-green-800',
    CANCELLED: 'bg-red-100 text-red-800',
    NO_SHOW: 'bg-gray-100 text-gray-800',
  }
  return map[status] || 'bg-gray-100 text-gray-800'
}

function paymentBadgeClass(status: string) {
  const map: Record<string, string> = {
    PENDING: 'bg-orange-100 text-orange-800',
    PAID: 'bg-green-100 text-green-800',
    FAILED: 'bg-red-100 text-red-800',
    REFUNDED: 'bg-gray-100 text-gray-600',
  }
  return map[status] || 'bg-gray-100 text-gray-800'
}

// Cancel appointment
const cancelling = ref<string | null>(null)
async function cancelAppointment(id: string) {
  if (!confirm('Are you sure you want to cancel this appointment?')) return
  cancelling.value = id
  try {
    await $fetch(`/api/appointments/${id}`, {
      method: 'PATCH',
      body: { action: 'cancel' },
    })
    await refreshAppts()
  } catch (e: any) {
    alert(e?.data?.statusMessage || 'Failed to cancel appointment.')
  } finally {
    cancelling.value = null
  }
}

// Reschedule
const rescheduling = ref<string | null>(null)
const rescheduleDate = ref('')
const rescheduleTime = ref('')
const rescheduleError = ref('')

function startReschedule(id: string) {
  rescheduling.value = id
  rescheduleDate.value = ''
  rescheduleTime.value = ''
  rescheduleError.value = ''
}

async function confirmReschedule(id: string) {
  if (!rescheduleDate.value || !rescheduleTime.value) {
    rescheduleError.value = 'Please select a date and time.'
    return
  }
  rescheduleError.value = ''
  try {
    await $fetch(`/api/appointments/${id}`, {
      method: 'PATCH',
      body: {
        action: 'reschedule',
        dateTime: `${rescheduleDate.value}T${rescheduleTime.value}:00.000Z`,
      },
    })
    rescheduling.value = null
    await refreshAppts()
  } catch (e: any) {
    rescheduleError.value = e?.data?.statusMessage || 'Failed to reschedule.'
  }
}

function canModify(appt: any) {
  if (!['PENDING', 'CONFIRMED'].includes(appt.status)) return false
  const hoursUntil = (new Date(appt.dateTime).getTime() - Date.now()) / (1000 * 60 * 60)
  return hoursUntil >= 24
}

function canPay(appt: any) {
  if (['CANCELLED', 'NO_SHOW'].includes(appt.status)) return false
  if (!appt.payment) return true
  return appt.payment.status === 'PENDING' || appt.payment.status === 'FAILED'
}

function getInvoiceNumber(appt: any): string | null {
  return appt.invoiceItems?.[0]?.invoice?.number || null
}

// Pay
const paying = ref<string | null>(null)
async function payForAppointment(appointmentId: string) {
  paying.value = appointmentId
  try {
    const result = await $fetch<{ url: string }>('/api/payments/checkout', {
      method: 'POST',
      body: { appointmentId },
    })
    if (result.url) {
      window.location.href = result.url
    }
  } catch (e: any) {
    alert(e?.data?.statusMessage || 'Failed to start payment.')
    paying.value = null
  }
}
</script>

<template>
  <div class="max-w-4xl mx-auto mt-8">
    <Head>
      <title>Dashboard - Pampered Pooch Porthcawl</title>
    </Head>

    <div class="flex justify-between items-center mb-8">
      <h1 class="text-2xl font-bold">Dashboard</h1>
      <div class="flex gap-3">
        <NuxtLink
          to="/dashboard/book"
          class="bg-brand-blue-dark text-white px-4 py-2 rounded text-sm hover:bg-brand-blue transition-colors"
        >
          Book Appointment
        </NuxtLink>
      </div>
    </div>

    <div class="bg-white border rounded-lg p-6 mb-8">
      <p class="text-lg">
        Welcome back, <strong>{{ user?.firstName }}</strong>!
      </p>
    </div>

    <!-- Dogs Section -->
    <div class="mb-8">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-semibold">My Dogs</h2>
        <NuxtLink
          to="/dashboard/dogs"
          class="text-sm text-brand-blue-dark hover:underline"
        >
          Manage Dogs
        </NuxtLink>
      </div>

      <div v-if="dogs.length === 0" class="border rounded-lg p-5">
        <p class="text-sm text-gray-500">
          No dogs registered yet.
          <NuxtLink to="/dashboard/dogs" class="text-brand-blue-dark hover:underline">Add your first dog</NuxtLink>
          to get started with booking.
        </p>
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div v-for="dog in dogs" :key="dog.id" class="border rounded-lg p-4">
          <div class="font-medium">{{ dog.name }}</div>
          <div class="text-sm text-gray-500">
            <span v-if="dog.breed">{{ dog.breed }}</span>
            <span v-if="dog.breed && dog.age"> · </span>
            <span v-if="dog.age">{{ dog.age }} yrs</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Upcoming Appointments -->
    <div class="mb-8">
      <h2 class="text-xl font-semibold mb-4">Upcoming Appointments</h2>

      <div v-if="upcoming.length === 0" class="border rounded-lg p-5">
        <p class="text-sm text-gray-500">
          No upcoming appointments.
          <NuxtLink v-if="dogs.length > 0" to="/dashboard/book" class="text-brand-blue-dark hover:underline">
            Book one now
          </NuxtLink>
        </p>
      </div>

      <div v-else class="space-y-4">
        <div v-for="appt in upcoming" :key="appt.id" class="border rounded-lg p-4">
          <div class="flex justify-between items-start">
            <div>
              <div class="font-medium">{{ appt.service.name }}</div>
              <div class="text-sm text-gray-600">{{ appt.dog.name }} · {{ formatDate(appt.dateTime) }}</div>
              <div class="text-sm text-gray-500">{{ appt.durationMin }} min<span v-if="appt.priceCharged"> · {{ formatPrice(appt.priceCharged) }}</span></div>
            </div>
            <div class="flex flex-col items-end gap-1">
              <span :class="statusBadgeClass(appt.status)" class="text-xs px-2 py-1 rounded-full font-medium">
                {{ appt.status }}
              </span>
              <span v-if="appt.payment" :class="paymentBadgeClass(appt.payment.status)" class="text-xs px-2 py-1 rounded-full font-medium">
                {{ appt.payment.status === 'PAID' ? 'Paid' : appt.payment.status }}
              </span>
            </div>
          </div>

          <!-- Payment + Invoice row -->
          <div class="mt-2 flex items-center gap-3 flex-wrap">
            <button
              v-if="canPay(appt)"
              class="text-xs bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 transition-colors"
              :disabled="paying === appt.id"
              @click="payForAppointment(appt.id)"
            >
              {{ paying === appt.id ? 'Redirecting...' : 'Pay Now' }}
            </button>
            <a
              v-if="getInvoiceNumber(appt)"
              :href="`/api/invoices/${getInvoiceNumber(appt)}`"
              class="text-xs text-brand-blue-dark hover:underline"
            >
              Invoice {{ getInvoiceNumber(appt) }}
            </a>
          </div>

          <div v-if="canModify(appt)" class="mt-3 flex gap-2">
            <button
              v-if="rescheduling !== appt.id"
              class="text-xs text-blue-600 hover:underline"
              @click="startReschedule(appt.id)"
            >
              Reschedule
            </button>
            <button
              class="text-xs text-red-600 hover:underline"
              :disabled="cancelling === appt.id"
              @click="cancelAppointment(appt.id)"
            >
              {{ cancelling === appt.id ? 'Cancelling...' : 'Cancel' }}
            </button>
          </div>

          <!-- Reschedule form -->
          <div v-if="rescheduling === appt.id" class="mt-3 border-t pt-3">
            <div class="flex gap-2 items-end">
              <div>
                <label class="block text-xs text-gray-500 mb-1">New Date</label>
                <input
                  v-model="rescheduleDate"
                  type="date"
                  class="border rounded px-2 py-1 text-sm"
                  :min="new Date().toISOString().split('T')[0]"
                />
              </div>
              <div>
                <label class="block text-xs text-gray-500 mb-1">New Time</label>
                <input
                  v-model="rescheduleTime"
                  type="time"
                  class="border rounded px-2 py-1 text-sm"
                />
              </div>
              <button
                class="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                @click="confirmReschedule(appt.id)"
              >
                Confirm
              </button>
              <button
                class="text-sm text-gray-500 hover:underline"
                @click="rescheduling = null"
              >
                Cancel
              </button>
            </div>
            <p v-if="rescheduleError" class="text-red-600 text-xs mt-1">{{ rescheduleError }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Past Appointments -->
    <div>
      <h2 class="text-xl font-semibold mb-4">Past Appointments</h2>

      <div v-if="past.length === 0" class="border rounded-lg p-5">
        <p class="text-sm text-gray-500">No past appointments.</p>
      </div>

      <div v-else class="space-y-3">
        <div v-for="appt in past" :key="appt.id" class="border rounded-lg p-4 opacity-75">
          <div class="flex justify-between items-start">
            <div>
              <div class="font-medium">{{ appt.service.name }}</div>
              <div class="text-sm text-gray-600">{{ appt.dog.name }} · {{ formatDate(appt.dateTime) }}</div>
            </div>
            <div class="flex flex-col items-end gap-1">
              <span :class="statusBadgeClass(appt.status)" class="text-xs px-2 py-1 rounded-full font-medium">
                {{ appt.status }}
              </span>
              <span v-if="appt.payment" :class="paymentBadgeClass(appt.payment.status)" class="text-xs px-2 py-1 rounded-full font-medium">
                {{ appt.payment.status === 'PAID' ? 'Paid' : appt.payment.status }}
              </span>
            </div>
          </div>
          <div v-if="getInvoiceNumber(appt)" class="mt-2">
            <a
              :href="`/api/invoices/${getInvoiceNumber(appt)}`"
              class="text-xs text-brand-blue-dark hover:underline"
            >
              Invoice {{ getInvoiceNumber(appt) }}
            </a>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
