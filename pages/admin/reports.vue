<script setup lang="ts">
definePageMeta({ middleware: 'admin' })

const today = new Date()
const thirtyDaysAgo = new Date(today)
thirtyDaysAgo.setDate(today.getDate() - 30)

const fromDate = ref(formatInputDate(thirtyDaysAgo))
const toDate = ref(formatInputDate(today))
const groupBy = ref<'day' | 'week' | 'month'>('day')

const loading = ref(false)
const error = ref('')

const summary = ref<any>(null)
const timeseries = ref<any[]>([])

async function loadReports() {
  error.value = ''
  loading.value = true
  try {
    const [summaryRes, tsRes] = await Promise.all([
      $fetch<any>('/api/admin/reports/summary', {
        query: { from: fromDate.value, to: toDate.value },
      }),
      $fetch<any>('/api/admin/reports/revenue-timeseries', {
        query: { from: fromDate.value, to: toDate.value, groupBy: groupBy.value },
      }),
    ])
    summary.value = summaryRes
    timeseries.value = tsRes.series
  } catch (e: any) {
    error.value = e?.data?.statusMessage || 'Failed to load reports.'
  } finally {
    loading.value = false
  }
}

// Load on mount
onMounted(() => loadReports())

function formatInputDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function penceToPounds(pence: number): string {
  return (pence / 100).toFixed(2)
}

function exportUrl(type: 'appointments' | 'revenue'): string {
  return `/api/admin/exports/${type}.csv?from=${fromDate.value}&to=${toDate.value}`
}
</script>

<template>
  <div class="max-w-7xl mx-auto mt-8">
    <Head>
      <title>Reports - Admin - Pampered Pooch Porthcawl</title>
    </Head>

    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
      <h1 class="text-2xl font-bold">Reports &amp; Analytics</h1>
      <div class="flex gap-2 text-sm">
        <NuxtLink to="/admin" class="text-brand-blue-dark hover:underline">Appointments</NuxtLink>
        <NuxtLink to="/admin/consent" class="text-brand-blue-dark hover:underline">Consent</NuxtLink>
      </div>
    </div>

    <!-- Date range controls -->
    <div class="bg-white border rounded-lg p-4 mb-6">
      <div class="flex flex-wrap gap-4 items-end">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">From</label>
          <input
            v-model="fromDate"
            type="date"
            class="border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">To</label>
          <input
            v-model="toDate"
            type="date"
            class="border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Group by</label>
          <select
            v-model="groupBy"
            class="border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
          >
            <option value="day">Day</option>
            <option value="week">Week</option>
            <option value="month">Month</option>
          </select>
        </div>
        <button
          class="bg-brand-blue text-white px-4 py-2 rounded text-sm hover:bg-brand-blue-dark disabled:opacity-50"
          :disabled="loading"
          @click="loadReports"
        >
          {{ loading ? 'Loading...' : 'Update' }}
        </button>
        <div class="flex gap-2 ml-auto">
          <a
            :href="exportUrl('appointments')"
            class="border border-gray-300 text-gray-700 px-3 py-2 rounded text-sm hover:bg-gray-50"
          >
            Export Appointments CSV
          </a>
          <a
            :href="exportUrl('revenue')"
            class="border border-gray-300 text-gray-700 px-3 py-2 rounded text-sm hover:bg-gray-50"
          >
            Export Revenue CSV
          </a>
        </div>
      </div>
    </div>

    <div v-if="error" class="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 mb-6">
      {{ error }}
    </div>

    <!-- KPI cards -->
    <div v-if="summary" class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <div class="bg-white border rounded-lg p-4">
        <div class="text-sm text-gray-500">Total Appointments</div>
        <div class="text-2xl font-bold">{{ summary.totalAppointments }}</div>
      </div>
      <div class="bg-white border rounded-lg p-4">
        <div class="text-sm text-gray-500">Completed</div>
        <div class="text-2xl font-bold text-green-700">{{ summary.completedCount }}</div>
      </div>
      <div class="bg-white border rounded-lg p-4">
        <div class="text-sm text-gray-500">Cancelled / No-show</div>
        <div class="text-2xl font-bold text-red-600">{{ summary.cancelledCount }} / {{ summary.noShowCount }}</div>
      </div>
      <div class="bg-white border rounded-lg p-4">
        <div class="text-sm text-gray-500">Gross Revenue</div>
        <div class="text-2xl font-bold">&pound;{{ penceToPounds(summary.grossRevenuePence) }}</div>
      </div>
      <div class="bg-white border rounded-lg p-4">
        <div class="text-sm text-gray-500">Pending Revenue</div>
        <div class="text-2xl font-bold text-orange-600">&pound;{{ penceToPounds(summary.pendingRevenuePence) }}</div>
      </div>
      <div class="bg-white border rounded-lg p-4">
        <div class="text-sm text-gray-500">Refunded</div>
        <div class="text-2xl font-bold text-gray-500">&pound;{{ penceToPounds(summary.refundedAmountPence) }}</div>
      </div>
      <div class="bg-white border rounded-lg p-4">
        <div class="text-sm text-gray-500">Avg Booking Value</div>
        <div class="text-2xl font-bold">&pound;{{ penceToPounds(summary.averageBookingValuePence) }}</div>
      </div>
      <div class="bg-white border rounded-lg p-4">
        <div class="text-sm text-gray-500">Payment Breakdown</div>
        <div class="text-xs mt-1 space-y-0.5">
          <div><span class="inline-block w-16 font-medium">Paid:</span> {{ summary.paymentStatusCounts.PAID }}</div>
          <div><span class="inline-block w-16 font-medium">Pending:</span> {{ summary.paymentStatusCounts.PENDING }}</div>
          <div><span class="inline-block w-16 font-medium">Failed:</span> {{ summary.paymentStatusCounts.FAILED }}</div>
          <div><span class="inline-block w-16 font-medium">Refunded:</span> {{ summary.paymentStatusCounts.REFUNDED }}</div>
        </div>
      </div>
    </div>

    <!-- Timeseries table -->
    <div v-if="timeseries.length > 0" class="bg-white border rounded-lg overflow-hidden">
      <h2 class="text-lg font-semibold px-4 py-3 border-b bg-gray-50">Revenue Timeseries</h2>
      <div class="overflow-x-auto">
        <table class="w-full text-sm border-collapse">
          <thead>
            <tr class="border-b bg-gray-50">
              <th class="text-left px-4 py-3 font-medium">Period</th>
              <th class="text-right px-4 py-3 font-medium">Appointments</th>
              <th class="text-right px-4 py-3 font-medium">Completed</th>
              <th class="text-right px-4 py-3 font-medium">Paid</th>
              <th class="text-right px-4 py-3 font-medium">Revenue</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in timeseries" :key="row.period" class="border-b hover:bg-gray-50">
              <td class="px-4 py-3 font-mono">{{ row.period }}</td>
              <td class="px-4 py-3 text-right">{{ row.appointmentCount }}</td>
              <td class="px-4 py-3 text-right">{{ row.completedCount }}</td>
              <td class="px-4 py-3 text-right">{{ row.paidCount }}</td>
              <td class="px-4 py-3 text-right font-medium">&pound;{{ penceToPounds(row.grossRevenuePence) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-else-if="summary && !loading" class="border rounded-lg p-8 text-center">
      <p class="text-gray-500">No appointment data for this date range.</p>
    </div>
  </div>
</template>
