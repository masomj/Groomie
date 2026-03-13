<script setup lang="ts">
definePageMeta({ middleware: 'admin' })

const APPOINTMENT_STATUSES = ['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW']

const customers = ref<any[]>([])
const customersLoading = ref(false)
const customersError = ref('')
const customerSearch = ref('')
const customerStatus = ref<'all' | 'active' | 'inactive'>('all')

const selectedCustomerId = ref('')
const selectedCustomer = ref<any | null>(null)
const customerDetailLoading = ref(false)
const customerDetailError = ref('')
const customerSaveLoading = ref(false)
const customerActionLoading = ref(false)

const customerForm = reactive({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
})

const dogFormVisible = ref(false)
const dogSaveLoading = ref(false)
const dogError = ref('')
const dogSuccess = ref('')
const editingDogId = ref('')
const dogForm = reactive({
  name: '',
  breed: '',
  age: '',
  notes: '',
  specialRequirements: '',
})

const appointments = ref<any[]>([])
const appointmentsLoading = ref(false)
const appointmentsError = ref('')
const appointmentFilters = reactive({
  from: '',
  to: '',
  status: '',
  customerId: '',
  dogId: '',
  search: '',
})

const selectedAppointmentId = ref('')
const appointmentSaveLoading = ref(false)
const appointmentSaveError = ref('')
const appointmentSaveSuccess = ref('')
const appointmentForm = reactive({
  status: 'PENDING',
  priceCharged: '',
  notes: '',
})

const selectedAppointment = computed(() => appointments.value.find(a => a.id === selectedAppointmentId.value) || null)

const filteredDogOptions = computed(() => {
  if (!appointmentFilters.customerId) {
    return customers.value.flatMap(c => c.dogs || [])
  }
  const match = customers.value.find(c => c.id === appointmentFilters.customerId)
  return match?.dogs || []
})

function ringClass() {
  return 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue-dark focus-visible:ring-offset-2'
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

function syncCustomerForm() {
  if (!selectedCustomer.value) return
  customerForm.firstName = selectedCustomer.value.firstName || ''
  customerForm.lastName = selectedCustomer.value.lastName || ''
  customerForm.email = selectedCustomer.value.email || ''
  customerForm.phone = selectedCustomer.value.phone || ''
}

function syncAppointmentForm() {
  if (!selectedAppointment.value) return
  appointmentForm.status = selectedAppointment.value.status
  appointmentForm.priceCharged = selectedAppointment.value.priceCharged === null ? '' : String(selectedAppointment.value.priceCharged ?? '')
  appointmentForm.notes = selectedAppointment.value.notes || ''
}

async function loadCustomers() {
  customersError.value = ''
  customersLoading.value = true
  try {
    const res = await $fetch<{ customers: any[] }>('/api/admin/customers', {
      query: {
        search: customerSearch.value || undefined,
        status: customerStatus.value,
      },
    })
    customers.value = res.customers || []

    if (!customers.value.some(c => c.id === selectedCustomerId.value)) {
      selectedCustomerId.value = customers.value[0]?.id || ''
    }
  } catch (e: any) {
    customersError.value = e?.data?.statusMessage || 'Failed to load customers.'
  } finally {
    customersLoading.value = false
  }
}

async function loadSelectedCustomer() {
  customerDetailError.value = ''
  selectedCustomer.value = null
  dogFormVisible.value = false

  if (!selectedCustomerId.value) return

  customerDetailLoading.value = true
  try {
    const res = await $fetch<{ user: any }>(`/api/admin/users/${selectedCustomerId.value}`)
    selectedCustomer.value = res.user
    syncCustomerForm()
  } catch (e: any) {
    customerDetailError.value = e?.data?.statusMessage || 'Failed to load customer details.'
  } finally {
    customerDetailLoading.value = false
  }
}

async function saveCustomer() {
  if (!selectedCustomer.value) return
  customerDetailError.value = ''
  customerSaveLoading.value = true
  try {
    const res = await $fetch<{ user: any }>(`/api/admin/users/${selectedCustomer.value.id}`, {
      method: 'PATCH',
      body: {
        firstName: customerForm.firstName,
        lastName: customerForm.lastName,
        email: customerForm.email,
        phone: customerForm.phone || null,
      },
    })
    selectedCustomer.value = { ...selectedCustomer.value, ...res.user }
    await loadCustomers()
  } catch (e: any) {
    customerDetailError.value = e?.data?.statusMessage || 'Failed to save customer.'
  } finally {
    customerSaveLoading.value = false
  }
}

async function toggleCustomerStatus() {
  if (!selectedCustomer.value) return

  customerDetailError.value = ''
  customerActionLoading.value = true
  const nextSuspended = !selectedCustomer.value.suspended
  const reason = nextSuspended
    ? window.prompt('Optional deactivation reason:', '') || undefined
    : undefined

  try {
    const res = await $fetch<{ user: any }>(`/api/admin/users/${selectedCustomer.value.id}/suspend`, {
      method: 'POST',
      body: {
        suspended: nextSuspended,
        reason,
        invalidateSessions: true,
      },
    })
    selectedCustomer.value = { ...selectedCustomer.value, ...res.user }
    await loadCustomers()
  } catch (e: any) {
    customerDetailError.value = e?.data?.statusMessage || 'Failed to update customer status.'
  } finally {
    customerActionLoading.value = false
  }
}

function resetDogForm() {
  dogForm.name = ''
  dogForm.breed = ''
  dogForm.age = ''
  dogForm.notes = ''
  dogForm.specialRequirements = ''
  editingDogId.value = ''
}

function startAddDog() {
  dogError.value = ''
  dogSuccess.value = ''
  resetDogForm()
  dogFormVisible.value = true
}

function startEditDog(dog: any) {
  dogError.value = ''
  dogSuccess.value = ''
  dogForm.name = dog.name || ''
  dogForm.breed = dog.breed || ''
  dogForm.age = dog.age === null || dog.age === undefined ? '' : String(dog.age)
  dogForm.notes = dog.notes || ''
  dogForm.specialRequirements = dog.medicalHistory || ''
  editingDogId.value = dog.id
  dogFormVisible.value = true
}

async function saveDog() {
  if (!selectedCustomer.value) return
  dogError.value = ''
  dogSuccess.value = ''

  if (!dogForm.name.trim()) {
    dogError.value = 'Dog name is required.'
    return
  }

  const parsedAge = dogForm.age.trim() === '' ? null : Number.parseInt(dogForm.age, 10)
  if (parsedAge !== null && (!Number.isInteger(parsedAge) || parsedAge < 0 || parsedAge > 40)) {
    dogError.value = 'Age must be a whole number between 0 and 40.'
    return
  }

  dogSaveLoading.value = true
  try {
    if (editingDogId.value) {
      await $fetch(`/api/admin/dogs/${editingDogId.value}`, {
        method: 'PATCH',
        body: {
          name: dogForm.name,
          breed: dogForm.breed || null,
          age: parsedAge,
          notes: dogForm.notes || null,
          medicalHistory: dogForm.specialRequirements || null,
        },
      })
      dogSuccess.value = 'Dog profile updated.'
    } else {
      await $fetch('/api/admin/dogs', {
        method: 'POST',
        body: {
          ownerId: selectedCustomer.value.id,
          name: dogForm.name,
          breed: dogForm.breed || null,
          age: parsedAge,
          notes: dogForm.notes || null,
          specialRequirements: dogForm.specialRequirements || null,
        },
      })
      dogSuccess.value = 'Dog profile added.'
    }

    await loadSelectedCustomer()
    await loadCustomers()
    resetDogForm()
    dogFormVisible.value = false
  } catch (e: any) {
    dogError.value = e?.data?.statusMessage || 'Failed to save dog profile.'
  } finally {
    dogSaveLoading.value = false
  }
}

async function loadAppointments() {
  appointmentsError.value = ''
  appointmentsLoading.value = true
  try {
    const from = appointmentFilters.from ? `${appointmentFilters.from}T00:00:00.000Z` : undefined
    const to = appointmentFilters.to ? `${appointmentFilters.to}T23:59:59.999Z` : undefined

    const res = await $fetch<{ appointments: any[] }>('/api/admin/appointments', {
      query: {
        status: appointmentFilters.status || undefined,
        customerId: appointmentFilters.customerId || undefined,
        dogId: appointmentFilters.dogId || undefined,
        search: appointmentFilters.search || undefined,
        from,
        to,
      },
    })
    appointments.value = res.appointments || []
    if (!appointments.value.some(a => a.id === selectedAppointmentId.value)) {
      selectedAppointmentId.value = appointments.value[0]?.id || ''
    }
    syncAppointmentForm()
  } catch (e: any) {
    appointmentsError.value = e?.data?.statusMessage || 'Failed to load appointments.'
  } finally {
    appointmentsLoading.value = false
  }
}

function selectAppointment(appointmentId: string) {
  selectedAppointmentId.value = appointmentId
  appointmentSaveError.value = ''
  appointmentSaveSuccess.value = ''
  syncAppointmentForm()
}

async function saveAppointment() {
  if (!selectedAppointment.value) return

  appointmentSaveError.value = ''
  appointmentSaveSuccess.value = ''

  const parsedPrice = appointmentForm.priceCharged.trim() === '' ? null : Number.parseInt(appointmentForm.priceCharged, 10)
  if (parsedPrice !== null && (!Number.isInteger(parsedPrice) || parsedPrice < 0)) {
    appointmentSaveError.value = 'Price must be a non-negative whole number in pence.'
    return
  }

  appointmentSaveLoading.value = true
  try {
    await $fetch(`/api/admin/appointments/${selectedAppointment.value.id}`, {
      method: 'PATCH',
      body: {
        status: appointmentForm.status,
        priceCharged: parsedPrice,
        notes: appointmentForm.notes || null,
      },
    })
    appointmentSaveSuccess.value = 'Appointment updated.'
    await loadAppointments()
    if (selectedAppointmentId.value) {
      selectAppointment(selectedAppointmentId.value)
    }
  } catch (e: any) {
    appointmentSaveError.value = e?.data?.statusMessage || 'Failed to update appointment.'
  } finally {
    appointmentSaveLoading.value = false
  }
}

watch(selectedCustomerId, async (value) => {
  await loadSelectedCustomer()
  if (!appointmentFilters.customerId || !value) {
    appointmentFilters.customerId = value
    appointmentFilters.dogId = ''
  }
  await loadAppointments()
}, { immediate: false })

onMounted(async () => {
  await loadCustomers()
  if (selectedCustomerId.value) {
    await loadSelectedCustomer()
  }
  if (!appointmentFilters.customerId && selectedCustomerId.value) {
    appointmentFilters.customerId = selectedCustomerId.value
  }
  await loadAppointments()
})
</script>

<template>
  <div class="max-w-7xl mx-auto mt-8 px-4 sm:px-6 lg:px-8 pb-10">
    <Head>
      <title>Customer Management - Admin - Pampered Pooch Porthcawl</title>
    </Head>

    <header class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900">Admin Customer Management</h1>
      <p class="text-sm text-gray-500 mt-1">Manage customers, dogs, and appointment admin actions from one place.</p>
      <nav aria-label="Admin sections" class="flex flex-wrap gap-2 mt-4">
        <NuxtLink to="/admin" class="btn-secondary btn-sm" :class="ringClass()">Appointments</NuxtLink>
        <NuxtLink to="/admin/customers" class="btn-primary btn-sm" :class="ringClass()">Customers</NuxtLink>
        <NuxtLink to="/admin/schedule" class="btn-secondary btn-sm" :class="ringClass()">Schedule</NuxtLink>
        <NuxtLink to="/admin/reports" class="btn-secondary btn-sm" :class="ringClass()">Reports</NuxtLink>
        <NuxtLink to="/admin/consent" class="btn-secondary btn-sm" :class="ringClass()">Consent</NuxtLink>
      </nav>
    </header>

    <section class="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8" aria-labelledby="customer-management-heading">
      <h2 id="customer-management-heading" class="sr-only">Customer management</h2>

      <aside class="card p-5 xl:col-span-1">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Customers</h3>

        <form class="grid grid-cols-1 gap-3 mb-4" @submit.prevent="loadCustomers">
          <div>
            <label for="customer-search" class="block text-sm font-medium text-gray-700 mb-1.5">Search customers</label>
            <input
              id="customer-search"
              v-model="customerSearch"
              type="text"
              class="input-field"
              :class="ringClass()"
              placeholder="Name, email, phone, or dog name"
            />
          </div>
          <div>
            <label for="customer-status" class="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
            <select
              id="customer-status"
              v-model="customerStatus"
              class="input-field"
              :class="ringClass()"
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <button type="submit" class="btn-primary btn-sm justify-center" :class="ringClass()" :disabled="customersLoading">
            {{ customersLoading ? 'Loading...' : 'Apply Filters' }}
          </button>
        </form>

        <p v-if="customersError" class="alert-error mb-3" role="alert">{{ customersError }}</p>

        <div class="max-h-[520px] overflow-auto space-y-2 pr-1">
          <button
            v-for="customer in customers"
            :key="customer.id"
            type="button"
            class="w-full text-left rounded-lg border px-3 py-3 transition-colors"
            :class="[
              selectedCustomerId === customer.id ? 'border-brand-blue-dark bg-blue-50' : 'border-gray-200 hover:bg-gray-50',
              ringClass(),
            ]"
            @click="selectedCustomerId = customer.id"
          >
            <div class="flex items-start justify-between gap-2">
              <div>
                <p class="font-medium text-gray-900">{{ customer.firstName }} {{ customer.lastName }}</p>
                <p class="text-xs text-gray-500 mt-0.5">{{ customer.email }}</p>
              </div>
              <span
                class="badge"
                :class="customer.suspended ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'"
              >
                {{ customer.suspended ? 'Inactive' : 'Active' }}
              </span>
            </div>
            <p class="text-xs text-gray-500 mt-2">{{ customer._count.dogs }} dog(s) · {{ customer._count.appointments }} appointment(s)</p>
          </button>

          <p v-if="!customersLoading && customers.length === 0" class="text-sm text-gray-500">No customers match the current filters.</p>
        </div>
      </aside>

      <section class="card p-5 xl:col-span-2" aria-labelledby="selected-customer-heading">
        <h3 id="selected-customer-heading" class="text-lg font-semibold text-gray-900 mb-4">Customer detail</h3>

        <p v-if="customerDetailError" class="alert-error mb-3" role="alert">{{ customerDetailError }}</p>
        <p v-if="customerDetailLoading" class="text-sm text-gray-500">Loading customer detail...</p>
        <p v-else-if="!selectedCustomer" class="text-sm text-gray-500">Select a customer to view details.</p>

        <template v-else>
          <form class="grid grid-cols-1 md:grid-cols-2 gap-4" @submit.prevent="saveCustomer">
            <div>
              <label for="customer-first-name" class="block text-sm font-medium text-gray-700 mb-1.5">First name</label>
              <input id="customer-first-name" v-model="customerForm.firstName" type="text" class="input-field" :class="ringClass()" />
            </div>
            <div>
              <label for="customer-last-name" class="block text-sm font-medium text-gray-700 mb-1.5">Last name</label>
              <input id="customer-last-name" v-model="customerForm.lastName" type="text" class="input-field" :class="ringClass()" />
            </div>
            <div>
              <label for="customer-email" class="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <input id="customer-email" v-model="customerForm.email" type="email" class="input-field" :class="ringClass()" />
            </div>
            <div>
              <label for="customer-phone" class="block text-sm font-medium text-gray-700 mb-1.5">Phone</label>
              <input id="customer-phone" v-model="customerForm.phone" type="tel" class="input-field" :class="ringClass()" />
            </div>
            <div class="md:col-span-2 flex flex-wrap items-center gap-2">
              <button type="submit" class="btn-primary btn-sm" :class="ringClass()" :disabled="customerSaveLoading">
                {{ customerSaveLoading ? 'Saving...' : 'Save Customer' }}
              </button>
              <button
                type="button"
                class="btn-sm rounded-lg px-3 py-1.5 font-medium border"
                :class="[
                  selectedCustomer.suspended
                    ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                    : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100',
                  ringClass(),
                ]"
                :disabled="customerActionLoading"
                @click="toggleCustomerStatus"
              >
                {{ customerActionLoading ? 'Updating...' : (selectedCustomer.suspended ? 'Reactivate' : 'Deactivate') }}
              </button>
              <span class="badge" :class="selectedCustomer.suspended ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'">
                {{ selectedCustomer.suspended ? 'Inactive' : 'Active' }}
              </span>
            </div>
          </form>

          <div class="border-t border-gray-200 mt-6 pt-6">
            <div class="flex flex-wrap items-center justify-between gap-2 mb-4">
              <h4 class="text-base font-semibold text-gray-900">Dogs</h4>
              <button type="button" class="btn-primary btn-sm" :class="ringClass()" @click="startAddDog">Add Dog</button>
            </div>

            <p v-if="dogError" class="alert-error mb-3" role="alert">{{ dogError }}</p>
            <p v-if="dogSuccess" class="mb-3 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">{{ dogSuccess }}</p>

            <div class="space-y-3 mb-4">
              <article v-for="dog in selectedCustomer.dogs" :key="dog.id" class="rounded-lg border border-gray-200 p-3">
                <div class="flex items-start justify-between gap-3">
                  <div>
                    <h5 class="font-medium text-gray-900">{{ dog.name }}</h5>
                    <p class="text-xs text-gray-500 mt-0.5">
                      <span v-if="dog.breed">{{ dog.breed }}</span>
                      <span v-if="dog.breed && dog.age !== null && dog.age !== undefined"> · </span>
                      <span v-if="dog.age !== null && dog.age !== undefined">{{ dog.age }} year(s)</span>
                    </p>
                    <p v-if="dog.medicalHistory" class="text-xs text-gray-600 mt-1"><strong>Special requirements:</strong> {{ dog.medicalHistory }}</p>
                    <p v-if="dog.notes" class="text-xs text-gray-600 mt-1"><strong>Notes:</strong> {{ dog.notes }}</p>
                  </div>
                  <button type="button" class="btn-secondary btn-sm" :class="ringClass()" @click="startEditDog(dog)">
                    Edit
                  </button>
                </div>
              </article>
              <p v-if="selectedCustomer.dogs.length === 0" class="text-sm text-gray-500">No dogs registered for this customer.</p>
            </div>

            <form v-if="dogFormVisible" class="rounded-lg border border-gray-200 p-4 bg-gray-50" @submit.prevent="saveDog">
              <h5 class="font-medium text-gray-900 mb-3">{{ editingDogId ? 'Edit Dog Profile' : 'Add Dog Profile' }}</h5>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label for="dog-name" class="block text-sm font-medium text-gray-700 mb-1.5">Dog name</label>
                  <input id="dog-name" v-model="dogForm.name" type="text" class="input-field" :class="ringClass()" />
                </div>
                <div>
                  <label for="dog-breed" class="block text-sm font-medium text-gray-700 mb-1.5">Breed</label>
                  <input id="dog-breed" v-model="dogForm.breed" type="text" class="input-field" :class="ringClass()" />
                </div>
                <div>
                  <label for="dog-age" class="block text-sm font-medium text-gray-700 mb-1.5">Age</label>
                  <input id="dog-age" v-model="dogForm.age" type="number" min="0" max="40" class="input-field" :class="ringClass()" />
                </div>
                <div>
                  <label for="dog-notes" class="block text-sm font-medium text-gray-700 mb-1.5">Notes</label>
                  <input id="dog-notes" v-model="dogForm.notes" type="text" class="input-field" :class="ringClass()" />
                </div>
                <div class="md:col-span-2">
                  <label for="dog-special" class="block text-sm font-medium text-gray-700 mb-1.5">Special requirements</label>
                  <textarea id="dog-special" v-model="dogForm.specialRequirements" rows="3" class="input-field" :class="ringClass()"></textarea>
                </div>
              </div>
              <div class="mt-4 flex items-center gap-2">
                <button type="submit" class="btn-primary btn-sm" :class="ringClass()" :disabled="dogSaveLoading">
                  {{ dogSaveLoading ? 'Saving...' : (editingDogId ? 'Update Dog' : 'Create Dog') }}
                </button>
                <button
                  type="button"
                  class="btn-secondary btn-sm"
                  :class="ringClass()"
                  @click="dogFormVisible = false"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </template>
      </section>
    </section>

    <section class="card p-5" aria-labelledby="appointment-management-heading">
      <h2 id="appointment-management-heading" class="text-lg font-semibold text-gray-900 mb-4">Appointment management</h2>

      <form class="grid grid-cols-1 md:grid-cols-6 gap-3 mb-4" @submit.prevent="loadAppointments">
        <div>
          <label for="appt-from" class="block text-sm font-medium text-gray-700 mb-1.5">From</label>
          <input id="appt-from" v-model="appointmentFilters.from" type="date" class="input-field" :class="ringClass()" />
        </div>
        <div>
          <label for="appt-to" class="block text-sm font-medium text-gray-700 mb-1.5">To</label>
          <input id="appt-to" v-model="appointmentFilters.to" type="date" class="input-field" :class="ringClass()" />
        </div>
        <div>
          <label for="appt-status" class="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
          <select id="appt-status" v-model="appointmentFilters.status" class="input-field" :class="ringClass()">
            <option value="">All</option>
            <option v-for="status in APPOINTMENT_STATUSES" :key="status" :value="status">{{ status }}</option>
          </select>
        </div>
        <div>
          <label for="appt-customer" class="block text-sm font-medium text-gray-700 mb-1.5">Customer</label>
          <select
            id="appt-customer"
            v-model="appointmentFilters.customerId"
            class="input-field"
            :class="ringClass()"
            @change="appointmentFilters.dogId = ''"
          >
            <option value="">All</option>
            <option v-for="customer in customers" :key="customer.id" :value="customer.id">
              {{ customer.firstName }} {{ customer.lastName }}
            </option>
          </select>
        </div>
        <div>
          <label for="appt-dog" class="block text-sm font-medium text-gray-700 mb-1.5">Dog</label>
          <select id="appt-dog" v-model="appointmentFilters.dogId" class="input-field" :class="ringClass()">
            <option value="">All</option>
            <option v-for="dog in filteredDogOptions" :key="dog.id" :value="dog.id">{{ dog.name }}</option>
          </select>
        </div>
        <div>
          <label for="appt-search" class="block text-sm font-medium text-gray-700 mb-1.5">Search</label>
          <input id="appt-search" v-model="appointmentFilters.search" type="text" class="input-field" :class="ringClass()" placeholder="Customer, dog, service, note" />
        </div>
        <div class="md:col-span-6 flex gap-2">
          <button type="submit" class="btn-primary btn-sm" :class="ringClass()" :disabled="appointmentsLoading">
            {{ appointmentsLoading ? 'Loading...' : 'Apply Appointment Filters' }}
          </button>
        </div>
      </form>

      <p v-if="appointmentsError" class="alert-error mb-3" role="alert">{{ appointmentsError }}</p>

      <div class="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div class="xl:col-span-2">
          <div class="overflow-x-auto border border-gray-200 rounded-lg">
            <table class="w-full text-sm">
              <thead>
                <tr class="bg-gray-50 border-b border-gray-200">
                  <th class="text-left px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                  <th class="text-left px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer</th>
                  <th class="text-left px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Dog</th>
                  <th class="text-left px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                <tr
                  v-for="appointment in appointments"
                  :key="appointment.id"
                  tabindex="0"
                  class="cursor-pointer hover:bg-gray-50"
                  :class="[
                    selectedAppointmentId === appointment.id ? 'bg-blue-50' : '',
                    ringClass(),
                  ]"
                  @click="selectAppointment(appointment.id)"
                  @keydown.enter.prevent="selectAppointment(appointment.id)"
                >
                  <td class="px-3 py-3 text-gray-700 whitespace-nowrap">{{ formatDateTime(appointment.dateTime) }}</td>
                  <td class="px-3 py-3 text-gray-700">{{ appointment.user.firstName }} {{ appointment.user.lastName }}</td>
                  <td class="px-3 py-3 text-gray-700">{{ appointment.dog.name }}</td>
                  <td class="px-3 py-3">
                    <span class="badge" :class="appointment.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : appointment.status === 'CANCELLED' || appointment.status === 'NO_SHOW' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'">
                      {{ appointment.status }}
                    </span>
                  </td>
                </tr>
                <tr v-if="!appointmentsLoading && appointments.length === 0">
                  <td colspan="4" class="px-3 py-4 text-sm text-gray-500">No appointments match these filters.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <aside class="rounded-lg border border-gray-200 p-4 bg-gray-50">
          <h3 class="font-semibold text-gray-900 mb-3">Appointment detail</h3>
          <p v-if="appointmentSaveError" class="alert-error mb-3" role="alert">{{ appointmentSaveError }}</p>
          <p v-if="appointmentSaveSuccess" class="mb-3 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">{{ appointmentSaveSuccess }}</p>
          <p v-if="!selectedAppointment" class="text-sm text-gray-500">Select an appointment to view and edit details.</p>

          <form v-else class="space-y-3" @submit.prevent="saveAppointment">
            <p class="text-sm text-gray-700">
              <strong>{{ selectedAppointment.service.name }}</strong><br>
              {{ selectedAppointment.user.firstName }} {{ selectedAppointment.user.lastName }} · {{ selectedAppointment.dog.name }}<br>
              {{ formatDateTime(selectedAppointment.dateTime) }}
            </p>

            <div>
              <label for="selected-appt-status" class="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
              <select id="selected-appt-status" v-model="appointmentForm.status" class="input-field" :class="ringClass()">
                <option v-for="status in APPOINTMENT_STATUSES" :key="status" :value="status">{{ status }}</option>
              </select>
            </div>

            <div>
              <label for="selected-appt-price" class="block text-sm font-medium text-gray-700 mb-1.5">Price charged (pence)</label>
              <input id="selected-appt-price" v-model="appointmentForm.priceCharged" type="number" min="0" class="input-field" :class="ringClass()" />
            </div>

            <div>
              <label for="selected-appt-notes" class="block text-sm font-medium text-gray-700 mb-1.5">Admin notes</label>
              <textarea id="selected-appt-notes" v-model="appointmentForm.notes" rows="4" class="input-field" :class="ringClass()"></textarea>
            </div>

            <button type="submit" class="btn-primary btn-sm" :class="ringClass()" :disabled="appointmentSaveLoading">
              {{ appointmentSaveLoading ? 'Saving...' : 'Save Appointment' }}
            </button>
          </form>
        </aside>
      </div>
    </section>
  </div>
</template>
