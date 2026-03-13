<script setup lang="ts">
definePageMeta({ middleware: 'admin' })

const { data, refresh } = useFetch('/api/admin/appointments')
const appointments = computed(() => data.value?.appointments || [])

const statusFilter = ref('')
const filtered = computed(() => {
  if (!statusFilter.value) return appointments.value
  return appointments.value.filter((a: any) => a.status === statusFilter.value)
})

const updating = ref<string | null>(null)
const consentDetail = ref<string | null>(null)

function formatDate(dt: string) {
  return new Date(dt).toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
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

const statuses = ['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW']

async function updateStatus(id: string, newStatus: string) {
  updating.value = id
  try {
    await $fetch(`/api/admin/appointments/${id}`, {
      method: 'PATCH',
      body: { status: newStatus },
    })
    await refresh()
  } catch (e: any) {
    alert(e?.data?.statusMessage || 'Failed to update status.')
  } finally {
    updating.value = null
  }
}

async function updatePrice(id: string, currentPrice: number | null) {
  const current = currentPrice ?? 0
  const input = window.prompt('Enter new booking price in pence (e.g. 4500 for GBP45.00):', String(current))
  if (input === null) return

  const nextPrice = Number.parseInt(input, 10)
  if (!Number.isInteger(nextPrice) || nextPrice < 0) {
    alert('Price must be a non-negative whole number in pence.')
    return
  }

  updating.value = id
  try {
    await $fetch(`/api/admin/appointments/${id}`, {
      method: 'PATCH',
      body: { priceCharged: nextPrice },
    })
    await refresh()
  } catch (e: any) {
    alert(e?.data?.statusMessage || 'Failed to update booking price.')
  } finally {
    updating.value = null
  }
}

function getInvoiceNumber(appt: any): string | null {
  return appt.invoiceItems?.[0]?.invoice?.number || null
}
</script>

<template>
  <div class="max-w-7xl mx-auto mt-8 px-4 sm:px-6 lg:px-8">
    <Head>
      <title>Admin - Pampered Pooch Porthcawl</title>
    </Head>

    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
      <h1 class="text-2xl font-bold text-gray-900">Admin - Appointments</h1>
      <div class="flex gap-2">
        <NuxtLink
          to="/admin/schedule"
          class="btn-primary btn-sm gap-1.5"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Schedule
        </NuxtLink>
        <NuxtLink
          to="/admin/customers"
          class="btn-primary btn-sm gap-1.5"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5V4H2v16h5m10 0v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6m10 0H7" />
          </svg>
          Customers
        </NuxtLink>
        <NuxtLink
          to="/admin/reports"
          class="btn-primary btn-sm gap-1.5"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Reports
        </NuxtLink>
        <NuxtLink
          to="/admin/consent"
          class="btn-primary btn-sm gap-1.5"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Consent Templates
        </NuxtLink>
      </div>
    </div>

    <!-- Filter -->
    <div class="mb-4 flex flex-wrap gap-3 items-center">
      <label class="text-sm font-medium text-gray-700">Filter by status:</label>
      <select
        v-model="statusFilter"
        class="input-field w-auto"
      >
        <option value="">All</option>
        <option v-for="s in statuses" :key="s" :value="s">{{ s }}</option>
      </select>
      <span class="badge bg-gray-100 text-gray-600">{{ filtered.length }} appointment{{ filtered.length !== 1 ? 's' : '' }}</span>
    </div>

    <!-- Empty state -->
    <div v-if="filtered.length === 0" class="card p-12 text-center">
      <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
      <p class="text-gray-500 font-medium">No appointments found.</p>
      <p class="text-gray-400 text-sm mt-1">Try adjusting your filter or check back later.</p>
    </div>

    <!-- Table -->
    <div v-else class="card overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-gray-50/80 border-b border-gray-200">
              <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date &amp; Time</th>
              <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer</th>
              <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Dog</th>
              <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Service</th>
              <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Price</th>
              <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
              <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Payment</th>
              <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Invoice</th>
              <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Consent</th>
              <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Update</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-for="appt in filtered" :key="appt.id" class="hover:bg-gray-50/50 transition-colors duration-150">
              <td class="px-4 py-4 text-gray-700 whitespace-nowrap">{{ formatDate(appt.dateTime) }}</td>
              <td class="px-4 py-4 text-gray-700 font-medium">{{ appt.user.firstName }} {{ appt.user.lastName }}</td>
              <td class="px-4 py-4 text-gray-700">{{ appt.dog.name }}</td>
              <td class="px-4 py-4 text-gray-700">{{ appt.service.name }}</td>
              <td class="px-4 py-4 text-gray-700 whitespace-nowrap">
                <div>GBP {{ ((appt.priceCharged ?? 0) / 100).toFixed(2) }}</div>
                <button
                  class="text-xs text-brand-blue-dark hover:underline font-medium mt-1"
                  :disabled="updating === appt.id"
                  @click="updatePrice(appt.id, appt.priceCharged)"
                >
                  Edit
                </button>
              </td>
              <td class="px-4 py-4">
                <span :class="statusBadgeClass(appt.status)" class="badge">
                  {{ appt.status }}
                </span>
              </td>
              <td class="px-4 py-4">
                <span
                  v-if="appt.payment"
                  :class="paymentBadgeClass(appt.payment.status)"
                  class="badge"
                >
                  {{ appt.payment.status }}
                </span>
                <span v-else class="text-xs text-gray-400">--</span>
              </td>
              <td class="px-4 py-4">
                <a
                  v-if="getInvoiceNumber(appt)"
                  :href="`/api/invoices/${getInvoiceNumber(appt)}`"
                  class="text-xs text-brand-blue-dark hover:underline font-medium"
                >
                  {{ getInvoiceNumber(appt) }}
                </a>
                <span v-else class="text-xs text-gray-400">--</span>
              </td>
              <td class="px-4 py-4">
                <template v-if="appt.consentRecords?.length > 0">
                  <span class="badge bg-green-100 text-green-800">Yes</span>
                  <button
                    class="text-xs text-brand-blue-dark hover:underline ml-1.5 font-medium"
                    @click="consentDetail = consentDetail === appt.id ? null : appt.id"
                  >
                    {{ consentDetail === appt.id ? 'hide' : 'details' }}
                  </button>
                  <div v-if="consentDetail === appt.id" class="mt-3 text-xs text-gray-600 bg-gray-50 rounded-lg border border-gray-200 p-3 space-y-1.5">
                    <div class="flex items-center gap-1.5">
                      <svg class="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span><span class="font-medium text-gray-700">Template:</span> {{ appt.consentRecords[0].template.title }} v{{ appt.consentRecords[0].template.version }}</span>
                    </div>
                    <div class="flex items-center gap-1.5">
                      <svg class="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span><span class="font-medium text-gray-700">Accepted:</span> {{ new Date(appt.consentRecords[0].capturedAt).toLocaleString('en-GB') }}</span>
                    </div>
                    <div v-if="appt.consentRecords[0].payload?.signedName" class="flex items-center gap-1.5">
                      <svg class="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                      <span><span class="font-medium text-gray-700">Signed:</span> {{ appt.consentRecords[0].payload.signedName }}</span>
                    </div>
                  </div>
                </template>
                <span v-else class="badge bg-gray-100 text-gray-500">No</span>
              </td>
              <td class="px-4 py-4">
                <select
                  :value="appt.status"
                  :disabled="updating === appt.id"
                  class="input-field w-auto py-1.5 text-xs"
                  @change="updateStatus(appt.id, ($event.target as HTMLSelectElement).value)"
                >
                  <option v-for="s in statuses" :key="s" :value="s">{{ s }}</option>
                </select>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
