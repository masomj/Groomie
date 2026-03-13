<script setup lang="ts">
definePageMeta({ middleware: 'admin' })

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

const { data: slotsData, refresh: refreshSlots } = useFetch('/api/admin/availability')
const { data: blockoutsData, refresh: refreshBlockouts } = useFetch('/api/admin/blockouts')
const { data: servicesData } = useFetch('/api/services')
const { data: customersData } = useFetch('/api/admin/customers')

const slots = computed(() => slotsData.value?.slots || [])
const blockouts = computed(() => blockoutsData.value?.blockouts || [])
const services = computed(() => servicesData.value?.services || [])
const customers = computed(() => customersData.value?.customers || [])

const slotsByDay = computed(() => {
  const grouped: any[][] = [[], [], [], [], [], [], []]
  for (const slot of slots.value) grouped[slot.dayOfWeek]?.push(slot)
  return grouped
})

const availabilityForm = reactive({
  dayOfWeek: 1,
  startTime: '09:00',
  endTime: '17:00',
  active: true,
})

const blockoutForm = reactive({
  startsAt: '',
  endsAt: '',
  reason: '',
})

const bookingMode = ref<'existing' | 'guest'>('existing')
const bookingForm = reactive({
  existingUserId: '',
  existingDogId: '',
  serviceId: '',
  date: '',
  time: '',
  notes: '',
  guestFirstName: '',
  guestLastName: '',
  guestEmail: '',
  guestPhone: '',
  guestDogName: '',
  guestDogBreed: '',
  guestDogAge: null as number | null,
})

const error = ref('')
const success = ref('')
const savingAvailability = ref(false)
const savingBlockout = ref(false)
const savingManual = ref(false)
const updatingSlotId = ref<string | null>(null)
const deletingSlotId = ref<string | null>(null)
const deletingBlockoutId = ref<string | null>(null)

const selectedCustomer = computed(() => customers.value.find((c: any) => c.id === bookingForm.existingUserId) || null)
const selectedCustomerDogs = computed(() => selectedCustomer.value?.dogs || [])

watch(() => bookingForm.existingUserId, () => {
  bookingForm.existingDogId = ''
})

function clearMessages() {
  error.value = ''
  success.value = ''
}

function toIsoLocal(datetimeLocal: string) {
  const dt = new Date(datetimeLocal)
  return dt.toISOString()
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString('en-GB', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function daySlots(dayIndex: number) {
  return slotsByDay.value[dayIndex] || []
}

async function addAvailabilitySlot() {
  clearMessages()
  savingAvailability.value = true
  try {
    await $fetch('/api/admin/availability', {
      method: 'POST',
      body: { ...availabilityForm },
    })
    await refreshSlots()
    success.value = 'Availability slot created.'
  } catch (e: any) {
    error.value = e?.data?.statusMessage || 'Failed to create availability slot.'
  } finally {
    savingAvailability.value = false
  }
}

async function toggleSlotActive(slot: any) {
  clearMessages()
  updatingSlotId.value = slot.id
  try {
    await $fetch(`/api/admin/availability/${slot.id}`, {
      method: 'PATCH',
      body: { active: !slot.active },
    })
    await refreshSlots()
  } catch (e: any) {
    error.value = e?.data?.statusMessage || 'Failed to update availability slot.'
  } finally {
    updatingSlotId.value = null
  }
}

async function deleteSlot(id: string) {
  clearMessages()
  deletingSlotId.value = id
  try {
    await $fetch(`/api/admin/availability/${id}`, { method: 'DELETE' })
    await refreshSlots()
  } catch (e: any) {
    error.value = e?.data?.statusMessage || 'Failed to delete availability slot.'
  } finally {
    deletingSlotId.value = null
  }
}

async function addBlockout() {
  clearMessages()
  if (!blockoutForm.startsAt || !blockoutForm.endsAt) {
    error.value = 'Blockout start and end are required.'
    return
  }

  savingBlockout.value = true
  try {
    await $fetch('/api/admin/blockouts', {
      method: 'POST',
      body: {
        startsAt: toIsoLocal(blockoutForm.startsAt),
        endsAt: toIsoLocal(blockoutForm.endsAt),
        reason: blockoutForm.reason,
      },
    })
    blockoutForm.startsAt = ''
    blockoutForm.endsAt = ''
    blockoutForm.reason = ''
    await refreshBlockouts()
    success.value = 'Blocked section created.'
  } catch (e: any) {
    error.value = e?.data?.statusMessage || 'Failed to create blockout.'
  } finally {
    savingBlockout.value = false
  }
}

async function deleteBlockout(id: string) {
  clearMessages()
  deletingBlockoutId.value = id
  try {
    await $fetch(`/api/admin/blockouts/${id}`, { method: 'DELETE' })
    await refreshBlockouts()
  } catch (e: any) {
    error.value = e?.data?.statusMessage || 'Failed to delete blockout.'
  } finally {
    deletingBlockoutId.value = null
  }
}

async function createManualBooking() {
  clearMessages()

  if (!bookingForm.serviceId || !bookingForm.date || !bookingForm.time) {
    error.value = 'Service, date, and time are required.'
    return
  }

  if (bookingMode.value === 'existing') {
    if (!bookingForm.existingUserId || !bookingForm.existingDogId) {
      error.value = 'Select an existing customer and dog.'
      return
    }
  } else {
    if (!bookingForm.guestFirstName.trim() || !bookingForm.guestLastName.trim() || !bookingForm.guestDogName.trim()) {
      error.value = 'Guest first name, last name, and dog name are required.'
      return
    }
  }

  savingManual.value = true
  try {
    await $fetch('/api/admin/appointments/manual', {
      method: 'POST',
      body: {
        serviceId: bookingForm.serviceId,
        date: bookingForm.date,
        time: bookingForm.time,
        notes: bookingForm.notes,
        existingUserId: bookingMode.value === 'existing' ? bookingForm.existingUserId : undefined,
        existingDogId: bookingMode.value === 'existing' ? bookingForm.existingDogId : undefined,
        guest: bookingMode.value === 'guest' ? {
          firstName: bookingForm.guestFirstName,
          lastName: bookingForm.guestLastName,
          email: bookingForm.guestEmail,
          phone: bookingForm.guestPhone,
          dogName: bookingForm.guestDogName,
          dogBreed: bookingForm.guestDogBreed,
          dogAge: bookingForm.guestDogAge,
        } : undefined,
      },
    })

    bookingForm.notes = ''
    bookingForm.date = ''
    bookingForm.time = ''
    bookingForm.serviceId = ''
    bookingForm.existingUserId = ''
    bookingForm.existingDogId = ''
    bookingForm.guestFirstName = ''
    bookingForm.guestLastName = ''
    bookingForm.guestEmail = ''
    bookingForm.guestPhone = ''
    bookingForm.guestDogName = ''
    bookingForm.guestDogBreed = ''
    bookingForm.guestDogAge = null

    success.value = 'Manual booking created successfully.'
  } catch (e: any) {
    error.value = e?.data?.statusMessage || 'Failed to create manual booking.'
  } finally {
    savingManual.value = false
  }
}
</script>

<template>
  <div class="max-w-7xl mx-auto mt-8 px-4 sm:px-6 lg:px-8">
    <Head>
      <title>Schedule - Admin - Pampered Pooch Porthcawl</title>
    </Head>

    <div class="mb-6">
      <NuxtLink to="/admin" class="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-brand-blue-dark transition-colors mb-4">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back to Appointments
      </NuxtLink>
      <h1 class="text-2xl font-bold text-gray-900">Scheduling</h1>
      <p class="text-sm text-gray-500 mt-1">Manage weekly timeslots, block out periods, and create manual bookings.</p>
      <div class="flex flex-wrap gap-2 mt-4">
        <NuxtLink to="/admin/customers" class="btn-secondary btn-sm">Customers</NuxtLink>
        <NuxtLink to="/admin/reports" class="btn-secondary btn-sm">Reports</NuxtLink>
        <NuxtLink to="/admin/consent" class="btn-secondary btn-sm">Consent</NuxtLink>
      </div>
    </div>

    <div v-if="error" class="alert-error mb-4" role="alert">{{ error }}</div>
    <div v-if="success" class="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{{ success }}</div>

    <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
      <section class="card p-5 xl:col-span-2">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">Weekly Availability</h2>

        <div class="grid grid-cols-1 sm:grid-cols-5 gap-3 mb-5">
          <select v-model.number="availabilityForm.dayOfWeek" class="input-field sm:col-span-1">
            <option v-for="(day, index) in dayNames" :key="day" :value="index">{{ day }}</option>
          </select>
          <input v-model="availabilityForm.startTime" type="time" class="input-field" />
          <input v-model="availabilityForm.endTime" type="time" class="input-field" />
          <label class="flex items-center gap-2 text-sm text-gray-700">
            <input v-model="availabilityForm.active" type="checkbox" class="h-4 w-4" />
            Active
          </label>
          <button class="btn-primary btn-sm" :disabled="savingAvailability" @click="addAvailabilitySlot">
            {{ savingAvailability ? 'Saving...' : 'Add Slot' }}
          </button>
        </div>

        <div class="space-y-4">
          <div v-for="(day, dayIndex) in dayNames" :key="day" class="rounded-lg border border-gray-200 p-4">
            <h3 class="font-medium text-gray-900 mb-2">{{ day }}</h3>
            <div v-if="daySlots(dayIndex).length > 0" class="space-y-2">
              <div v-for="slot in daySlots(dayIndex)" :key="slot.id" class="flex flex-wrap items-center justify-between gap-2 rounded-md border border-gray-100 px-3 py-2">
                <span class="text-sm text-gray-700">{{ slot.startTime }} - {{ slot.endTime }}</span>
                <div class="flex items-center gap-2">
                  <span class="badge" :class="slot.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'">
                    {{ slot.active ? 'Active' : 'Inactive' }}
                  </span>
                  <button class="btn-secondary btn-sm" :disabled="updatingSlotId === slot.id" @click="toggleSlotActive(slot)">
                    {{ updatingSlotId === slot.id ? 'Updating...' : (slot.active ? 'Disable' : 'Enable') }}
                  </button>
                  <button class="btn-danger btn-sm" :disabled="deletingSlotId === slot.id" @click="deleteSlot(slot.id)">
                    {{ deletingSlotId === slot.id ? 'Deleting...' : 'Delete' }}
                  </button>
                </div>
              </div>
            </div>
            <p v-else class="text-sm text-gray-400">No slots configured.</p>
          </div>
        </div>
      </section>

      <section class="card p-5">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">Block Out Time</h2>
        <div class="space-y-3 mb-5">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Start</label>
            <input v-model="blockoutForm.startsAt" type="datetime-local" class="input-field" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">End</label>
            <input v-model="blockoutForm.endsAt" type="datetime-local" class="input-field" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Reason (optional)</label>
            <input v-model="blockoutForm.reason" type="text" class="input-field" placeholder="e.g. Lunch break" />
          </div>
          <button class="btn-primary btn-sm w-full" :disabled="savingBlockout" @click="addBlockout">
            {{ savingBlockout ? 'Saving...' : 'Create Blockout' }}
          </button>
        </div>

        <div class="space-y-2 max-h-[360px] overflow-auto">
          <div v-for="blockout in blockouts" :key="blockout.id" class="rounded-md border border-gray-200 p-3">
            <div class="text-sm font-medium text-gray-800">{{ formatDateTime(blockout.startsAt) }} - {{ formatDateTime(blockout.endsAt) }}</div>
            <div class="text-xs text-gray-500 mt-1">{{ blockout.reason || 'No reason provided' }}</div>
            <button class="btn-danger btn-sm mt-2" :disabled="deletingBlockoutId === blockout.id" @click="deleteBlockout(blockout.id)">
              {{ deletingBlockoutId === blockout.id ? 'Removing...' : 'Remove' }}
            </button>
          </div>
          <p v-if="blockouts.length === 0" class="text-sm text-gray-400">No upcoming blockouts.</p>
        </div>
      </section>
    </div>

    <section class="card p-5 mt-6">
      <h2 class="text-lg font-semibold text-gray-900 mb-4">Manual Booking</h2>

      <div class="flex gap-4 mb-4 text-sm">
        <label class="flex items-center gap-2">
          <input v-model="bookingMode" type="radio" value="existing" />
          Existing customer
        </label>
        <label class="flex items-center gap-2">
          <input v-model="bookingMode" type="radio" value="guest" />
          Non-registered customer
        </label>
      </div>

      <div v-if="bookingMode === 'existing'" class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Customer</label>
          <select v-model="bookingForm.existingUserId" class="input-field">
            <option value="" disabled>Select customer</option>
            <option v-for="c in customers" :key="c.id" :value="c.id">{{ c.firstName }} {{ c.lastName }} ({{ c.email }})</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Dog</label>
          <select v-model="bookingForm.existingDogId" class="input-field">
            <option value="" disabled>Select dog</option>
            <option v-for="d in selectedCustomerDogs" :key="d.id" :value="d.id">{{ d.name }}</option>
          </select>
        </div>
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">First name</label>
          <input v-model="bookingForm.guestFirstName" type="text" class="input-field" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Last name</label>
          <input v-model="bookingForm.guestLastName" type="text" class="input-field" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Email (optional)</label>
          <input v-model="bookingForm.guestEmail" type="email" class="input-field" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Phone (optional)</label>
          <input v-model="bookingForm.guestPhone" type="text" class="input-field" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Dog name</label>
          <input v-model="bookingForm.guestDogName" type="text" class="input-field" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Dog breed (optional)</label>
          <input v-model="bookingForm.guestDogBreed" type="text" class="input-field" />
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div class="md:col-span-2">
          <label class="block text-sm font-medium text-gray-700 mb-1">Service</label>
          <select v-model="bookingForm.serviceId" class="input-field">
            <option value="" disabled>Select service</option>
            <option v-for="s in services" :key="s.id" :value="s.id">{{ s.name }}</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Date</label>
          <input v-model="bookingForm.date" type="date" class="input-field" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Time</label>
          <input v-model="bookingForm.time" type="time" class="input-field" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
          <input v-model="bookingForm.notes" type="text" class="input-field" />
        </div>
      </div>

      <div class="mt-4">
        <button class="btn-primary" :disabled="savingManual" @click="createManualBooking">
          {{ savingManual ? 'Booking...' : 'Create Booking' }}
        </button>
      </div>
    </section>
  </div>
</template>
