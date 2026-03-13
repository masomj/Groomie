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
  <div class="max-w-4xl mx-auto mt-8 px-4 sm:px-6 pb-12">
    <Head>
      <title>Dashboard - Pampered Pooch Porthcawl</title>
    </Head>

    <!-- Header -->
    <div class="flex justify-between items-center mb-8">
      <h1 class="text-2xl font-bold text-gray-900">Dashboard</h1>
      <NuxtLink to="/dashboard/book" class="btn-primary btn-sm">
        Book Appointment
      </NuxtLink>
    </div>

    <!-- Welcome Card -->
    <div class="rounded-xl bg-gradient-to-r from-brand-blue-dark to-brand-blue p-6 mb-8 shadow-card text-white">
      <p class="text-lg">
        Welcome back, <strong class="font-semibold">{{ user?.firstName }}</strong>!
      </p>
    </div>

    <!-- Dogs Section -->
    <div class="mb-10">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-bold text-gray-900">My Dogs</h2>
        <NuxtLink
          to="/dashboard/dogs"
          class="text-sm font-medium text-brand-blue-dark hover:text-brand-blue transition-colors"
        >
          Manage Dogs
        </NuxtLink>
      </div>

      <div v-if="dogs.length === 0" class="card p-8 text-center">
        <svg class="mx-auto h-12 w-12 text-gray-300 mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6.633 10.25c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 0 1 2.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 0 0 .322-1.672V3a.75.75 0 0 1 .75-.75 2.25 2.25 0 0 1 2.25 2.25c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282m0 0h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 0 1-2.649 7.521c-.388.482-.987.729-1.605.729H13.48a4.53 4.53 0 0 1-1.423-.23l-3.114-1.04a4.501 4.501 0 0 0-1.423-.23H5.904m10.598-9.75H14.25M5.904 18.5c.083.205.173.405.27.602.197.4-.078.898-.523.898h-.908c-.889 0-1.713-.518-1.972-1.368a12 12 0 0 1-.521-3.507c0-1.553.295-3.036.831-4.398C3.387 9.953 4.167 9.5 5 9.5h1.053c.472 0 .745.556.5.96a8.958 8.958 0 0 0-1.302 4.665c0 1.194.232 2.333.654 3.375Z" />
        </svg>
        <p class="text-sm text-gray-500">
          No dogs registered yet.
          <NuxtLink to="/dashboard/dogs" class="text-brand-blue-dark font-medium hover:underline">Add your first dog</NuxtLink>
          to get started with booking.
        </p>
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div v-for="dog in dogs" :key="dog.id" class="card-hover p-4 flex items-center gap-4">
          <div class="flex-shrink-0 w-11 h-11 rounded-full bg-brand-blue-dark text-white flex items-center justify-center text-lg font-bold shadow-soft">
            {{ dog.name?.charAt(0)?.toUpperCase() }}
          </div>
          <div>
            <div class="font-semibold text-gray-900">{{ dog.name }}</div>
            <div class="text-sm text-gray-500">
              <span v-if="dog.breed">{{ dog.breed }}</span>
              <span v-if="dog.breed && dog.age"> · </span>
              <span v-if="dog.age">{{ dog.age }} yrs</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Upcoming Appointments -->
    <div class="mb-10">
      <h2 class="text-xl font-bold text-gray-900 mb-4">Upcoming Appointments</h2>

      <div v-if="upcoming.length === 0" class="card p-8 text-center">
        <svg class="mx-auto h-12 w-12 text-gray-300 mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5m-9-6h.008v.008H12v-.008ZM12 15h.008v.008H12V15Zm0 2.25h.008v.008H12v-.008ZM9.75 15h.008v.008H9.75V15Zm0 2.25h.008v.008H9.75v-.008ZM7.5 15h.008v.008H7.5V15Zm0 2.25h.008v.008H7.5v-.008Zm6.75-4.5h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V15Zm0 2.25h.008v.008h-.008v-.008Zm2.25-4.5h.008v.008H16.5v-.008Zm0 2.25h.008v.008H16.5V15Z" />
        </svg>
        <p class="text-sm text-gray-500">
          No upcoming appointments.
          <NuxtLink v-if="dogs.length > 0" to="/dashboard/book" class="text-brand-blue-dark font-medium hover:underline">
            Book one now
          </NuxtLink>
        </p>
      </div>

      <div v-else class="space-y-4">
        <div v-for="appt in upcoming" :key="appt.id" class="card p-5">
          <div class="flex justify-between items-start">
            <div>
              <div class="font-semibold text-gray-900">{{ appt.service.name }}</div>
              <div class="text-sm text-gray-600 mt-0.5">{{ appt.dog.name }} · {{ formatDate(appt.dateTime) }}</div>
              <div class="text-sm text-gray-500 mt-0.5">{{ appt.durationMin }} min<span v-if="appt.priceCharged"> · {{ formatPrice(appt.priceCharged) }}</span></div>
            </div>
            <div class="flex flex-col items-end gap-1.5">
              <span :class="statusBadgeClass(appt.status)" class="badge">
                {{ appt.status }}
              </span>
              <span v-if="appt.payment" :class="paymentBadgeClass(appt.payment.status)" class="badge">
                {{ appt.payment.status === 'PAID' ? 'Paid' : appt.payment.status }}
              </span>
            </div>
          </div>

          <!-- Payment + Invoice row -->
          <div class="mt-3 flex items-center gap-3 flex-wrap">
            <button
              v-if="canPay(appt)"
              class="inline-flex items-center justify-center bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 transition-all duration-200 shadow-soft"
              :disabled="paying === appt.id"
              @click="payForAppointment(appt.id)"
            >
              {{ paying === appt.id ? 'Redirecting...' : 'Pay Now' }}
            </button>
            <a
              v-if="getInvoiceNumber(appt)"
              :href="`/api/invoices/${getInvoiceNumber(appt)}`"
              class="text-sm font-medium text-brand-blue-dark hover:text-brand-blue transition-colors"
            >
              Invoice {{ getInvoiceNumber(appt) }}
            </a>
          </div>

          <div v-if="canModify(appt)" class="mt-3 pt-3 border-t border-gray-100 flex gap-3">
            <button
              v-if="rescheduling !== appt.id"
              class="btn-secondary btn-sm"
              @click="startReschedule(appt.id)"
            >
              Reschedule
            </button>
            <button
              class="btn-danger btn-sm"
              :disabled="cancelling === appt.id"
              @click="cancelAppointment(appt.id)"
            >
              {{ cancelling === appt.id ? 'Cancelling...' : 'Cancel' }}
            </button>
          </div>

          <!-- Reschedule form -->
          <div v-if="rescheduling === appt.id" class="mt-4 card bg-warm-50 p-4">
            <p class="text-sm font-medium text-gray-700 mb-3">Choose a new date and time</p>
            <div class="flex flex-wrap gap-3 items-end">
              <div class="flex-1 min-w-[140px]">
                <label class="block text-xs font-medium text-gray-500 mb-1">New Date</label>
                <input
                  v-model="rescheduleDate"
                  type="date"
                  class="input-field"
                  :min="new Date().toISOString().split('T')[0]"
                />
              </div>
              <div class="flex-1 min-w-[140px]">
                <label class="block text-xs font-medium text-gray-500 mb-1">New Time</label>
                <input
                  v-model="rescheduleTime"
                  type="time"
                  class="input-field"
                />
              </div>
              <div class="flex gap-2">
                <button
                  class="btn-primary btn-sm"
                  @click="confirmReschedule(appt.id)"
                >
                  Confirm
                </button>
                <button
                  class="btn-secondary btn-sm"
                  @click="rescheduling = null"
                >
                  Cancel
                </button>
              </div>
            </div>
            <p v-if="rescheduleError" class="alert-error mt-3">{{ rescheduleError }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Past Appointments -->
    <div>
      <h2 class="text-xl font-bold text-gray-900 mb-4">Past Appointments</h2>

      <div v-if="past.length === 0" class="card p-8 text-center">
        <svg class="mx-auto h-12 w-12 text-gray-300 mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        </svg>
        <p class="text-sm text-gray-500">No past appointments yet.</p>
      </div>

      <div v-else class="space-y-3">
        <div v-for="appt in past" :key="appt.id" class="card p-5 opacity-80">
          <div class="flex justify-between items-start">
            <div>
              <div class="font-semibold text-gray-900">{{ appt.service.name }}</div>
              <div class="text-sm text-gray-600 mt-0.5">{{ appt.dog.name }} · {{ formatDate(appt.dateTime) }}</div>
            </div>
            <div class="flex flex-col items-end gap-1.5">
              <span :class="statusBadgeClass(appt.status)" class="badge">
                {{ appt.status }}
              </span>
              <span v-if="appt.payment" :class="paymentBadgeClass(appt.payment.status)" class="badge">
                {{ appt.payment.status === 'PAID' ? 'Paid' : appt.payment.status }}
              </span>
            </div>
          </div>
          <div v-if="getInvoiceNumber(appt)" class="mt-2">
            <a
              :href="`/api/invoices/${getInvoiceNumber(appt)}`"
              class="text-sm font-medium text-brand-blue-dark hover:text-brand-blue transition-colors"
            >
              Invoice {{ getInvoiceNumber(appt) }}
            </a>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
