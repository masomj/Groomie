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

function getInvoiceNumber(appt: any): string | null {
  return appt.invoiceItems?.[0]?.invoice?.number || null
}
</script>

<template>
  <div class="max-w-7xl mx-auto mt-8">
    <Head>
      <title>Admin - Pampered Pooch Porthcawl</title>
    </Head>

    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold">Admin - Appointments</h1>
      <div class="flex gap-4">
        <NuxtLink to="/admin/reports" class="text-sm text-brand-blue-dark hover:underline">Reports</NuxtLink>
        <NuxtLink to="/admin/consent" class="text-sm text-brand-blue-dark hover:underline">Consent Templates</NuxtLink>
      </div>
    </div>

    <!-- Filter -->
    <div class="mb-4 flex gap-2 items-center">
      <label class="text-sm font-medium">Filter by status:</label>
      <select
        v-model="statusFilter"
        class="border rounded px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
      >
        <option value="">All</option>
        <option v-for="s in statuses" :key="s" :value="s">{{ s }}</option>
      </select>
      <span class="text-sm text-gray-500">{{ filtered.length }} appointment{{ filtered.length !== 1 ? 's' : '' }}</span>
    </div>

    <div v-if="filtered.length === 0" class="border rounded-lg p-8 text-center">
      <p class="text-gray-500">No appointments found.</p>
    </div>

    <div v-else class="overflow-x-auto">
      <table class="w-full text-sm border-collapse">
        <thead>
          <tr class="border-b bg-gray-50">
            <th class="text-left px-4 py-3 font-medium">Date &amp; Time</th>
            <th class="text-left px-4 py-3 font-medium">Customer</th>
            <th class="text-left px-4 py-3 font-medium">Dog</th>
            <th class="text-left px-4 py-3 font-medium">Service</th>
            <th class="text-left px-4 py-3 font-medium">Status</th>
            <th class="text-left px-4 py-3 font-medium">Payment</th>
            <th class="text-left px-4 py-3 font-medium">Invoice</th>
            <th class="text-left px-4 py-3 font-medium">Consent</th>
            <th class="text-left px-4 py-3 font-medium">Update</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="appt in filtered" :key="appt.id" class="border-b hover:bg-gray-50">
            <td class="px-4 py-3">{{ formatDate(appt.dateTime) }}</td>
            <td class="px-4 py-3">{{ appt.user.firstName }} {{ appt.user.lastName }}</td>
            <td class="px-4 py-3">{{ appt.dog.name }}</td>
            <td class="px-4 py-3">{{ appt.service.name }}</td>
            <td class="px-4 py-3">
              <span :class="statusBadgeClass(appt.status)" class="text-xs px-2 py-1 rounded-full font-medium">
                {{ appt.status }}
              </span>
            </td>
            <td class="px-4 py-3">
              <span
                v-if="appt.payment"
                :class="paymentBadgeClass(appt.payment.status)"
                class="text-xs px-2 py-1 rounded-full font-medium"
              >
                {{ appt.payment.status }}
              </span>
              <span v-else class="text-xs text-gray-400">--</span>
            </td>
            <td class="px-4 py-3">
              <a
                v-if="getInvoiceNumber(appt)"
                :href="`/api/invoices/${getInvoiceNumber(appt)}`"
                class="text-xs text-brand-blue-dark hover:underline"
              >
                {{ getInvoiceNumber(appt) }}
              </a>
              <span v-else class="text-xs text-gray-400">--</span>
            </td>
            <td class="px-4 py-3">
              <template v-if="appt.consentRecords?.length > 0">
                <span class="text-xs px-2 py-1 rounded-full font-medium bg-green-100 text-green-800">Yes</span>
                <button
                  class="text-xs text-gray-500 hover:underline ml-1"
                  @click="consentDetail = consentDetail === appt.id ? null : appt.id"
                >
                  {{ consentDetail === appt.id ? 'hide' : 'details' }}
                </button>
                <div v-if="consentDetail === appt.id" class="mt-2 text-xs text-gray-600 bg-gray-50 rounded p-2">
                  <div>Template: {{ appt.consentRecords[0].template.title }} v{{ appt.consentRecords[0].template.version }}</div>
                  <div>Accepted: {{ new Date(appt.consentRecords[0].capturedAt).toLocaleString('en-GB') }}</div>
                  <div v-if="appt.consentRecords[0].payload?.signedName">Signed: {{ appt.consentRecords[0].payload.signedName }}</div>
                </div>
              </template>
              <span v-else class="text-xs px-2 py-1 rounded-full font-medium bg-gray-100 text-gray-500">No</span>
            </td>
            <td class="px-4 py-3">
              <select
                :value="appt.status"
                :disabled="updating === appt.id"
                class="border rounded px-2 py-1 text-xs"
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
</template>
