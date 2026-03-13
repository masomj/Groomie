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
  <div class="max-w-7xl mx-auto mt-8 px-4 sm:px-6 lg:px-8">
    <Head>
      <title>Reports - Admin - Pampered Pooch Porthcawl</title>
    </Head>

    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
      <h1 class="text-2xl font-bold text-gray-900">Reports &amp; Analytics</h1>
      <div class="flex gap-2">
        <NuxtLink to="/admin/schedule" class="btn-primary btn-sm gap-1.5">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Schedule
        </NuxtLink>
        <NuxtLink to="/admin/customers" class="btn-primary btn-sm gap-1.5">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5V4H2v16h5m10 0v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6m10 0H7" />
          </svg>
          Customers
        </NuxtLink>
        <NuxtLink to="/admin" class="btn-primary btn-sm gap-1.5">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Appointments
        </NuxtLink>
        <NuxtLink to="/admin/consent" class="btn-primary btn-sm gap-1.5">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Consent
        </NuxtLink>
      </div>
    </div>

    <!-- Date range controls -->
    <div class="card p-5 mb-6">
      <div class="flex flex-wrap gap-4 items-end">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1.5">From</label>
          <input v-model="fromDate" type="date" class="input-field w-auto" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1.5">To</label>
          <input v-model="toDate" type="date" class="input-field w-auto" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1.5">Group by</label>
          <select v-model="groupBy" class="input-field w-auto">
            <option value="day">Day</option>
            <option value="week">Week</option>
            <option value="month">Month</option>
          </select>
        </div>
        <button
          class="btn-primary btn-sm disabled:opacity-50"
          :disabled="loading"
          @click="loadReports"
        >
          {{ loading ? 'Loading...' : 'Update' }}
        </button>
        <div class="flex gap-2 ml-auto">
          <a :href="exportUrl('appointments')" class="btn-secondary btn-sm">
            Export Appointments CSV
          </a>
          <a :href="exportUrl('revenue')" class="btn-secondary btn-sm">
            Export Revenue CSV
          </a>
        </div>
      </div>
    </div>

    <div v-if="error" class="alert-error mb-6" role="alert">
      <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>
      {{ error }}
    </div>

    <!-- KPI cards -->
    <div v-if="summary" class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <div class="card p-5">
        <div class="text-sm text-gray-500">Total Appointments</div>
        <div class="text-2xl font-bold text-gray-900 mt-1">{{ summary.totalAppointments }}</div>
      </div>
      <div class="card p-5">
        <div class="text-sm text-gray-500">Completed</div>
        <div class="text-2xl font-bold text-green-700 mt-1">{{ summary.completedCount }}</div>
      </div>
      <div class="card p-5">
        <div class="text-sm text-gray-500">Cancelled / No-show</div>
        <div class="text-2xl font-bold text-red-600 mt-1">{{ summary.cancelledCount }} / {{ summary.noShowCount }}</div>
      </div>
      <div class="card p-5">
        <div class="text-sm text-gray-500">Gross Revenue</div>
        <div class="text-2xl font-bold text-gray-900 mt-1">&pound;{{ penceToPounds(summary.grossRevenuePence) }}</div>
      </div>
      <div class="card p-5">
        <div class="text-sm text-gray-500">Pending Revenue</div>
        <div class="text-2xl font-bold text-orange-600 mt-1">&pound;{{ penceToPounds(summary.pendingRevenuePence) }}</div>
      </div>
      <div class="card p-5">
        <div class="text-sm text-gray-500">Refunded</div>
        <div class="text-2xl font-bold text-gray-500 mt-1">&pound;{{ penceToPounds(summary.refundedAmountPence) }}</div>
      </div>
      <div class="card p-5">
        <div class="text-sm text-gray-500">Avg Booking Value</div>
        <div class="text-2xl font-bold text-gray-900 mt-1">&pound;{{ penceToPounds(summary.averageBookingValuePence) }}</div>
      </div>
      <div class="card p-5">
        <div class="text-sm text-gray-500">Payment Breakdown</div>
        <div class="text-xs mt-2 space-y-1">
          <div class="flex items-center gap-2"><span class="badge bg-green-100 text-green-800">Paid</span> {{ summary.paymentStatusCounts.PAID }}</div>
          <div class="flex items-center gap-2"><span class="badge bg-orange-100 text-orange-800">Pending</span> {{ summary.paymentStatusCounts.PENDING }}</div>
          <div class="flex items-center gap-2"><span class="badge bg-red-100 text-red-800">Failed</span> {{ summary.paymentStatusCounts.FAILED }}</div>
          <div class="flex items-center gap-2"><span class="badge bg-gray-100 text-gray-600">Refunded</span> {{ summary.paymentStatusCounts.REFUNDED }}</div>
        </div>
      </div>
    </div>

    <!-- Timeseries table -->
    <div v-if="timeseries.length > 0" class="card overflow-hidden">
      <h2 class="text-lg font-semibold px-5 py-4 border-b border-gray-200 bg-gray-50/80 text-gray-900">Revenue Timeseries</h2>
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-gray-50/80 border-b border-gray-200">
              <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Period</th>
              <th class="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Appointments</th>
              <th class="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Completed</th>
              <th class="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Paid</th>
              <th class="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Revenue</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-for="row in timeseries" :key="row.period" class="hover:bg-gray-50/50 transition-colors duration-150">
              <td class="px-4 py-4 font-mono text-gray-700">{{ row.period }}</td>
              <td class="px-4 py-4 text-right text-gray-700">{{ row.appointmentCount }}</td>
              <td class="px-4 py-4 text-right text-gray-700">{{ row.completedCount }}</td>
              <td class="px-4 py-4 text-right text-gray-700">{{ row.paidCount }}</td>
              <td class="px-4 py-4 text-right font-medium text-gray-900">&pound;{{ penceToPounds(row.grossRevenuePence) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-else-if="summary && !loading" class="card p-12 text-center">
      <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
      <p class="text-gray-500 font-medium">No appointment data for this date range.</p>
      <p class="text-gray-400 text-sm mt-1">Try adjusting the date range above.</p>
    </div>
  </div>
</template>
