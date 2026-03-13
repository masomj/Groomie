<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const step = ref(1) // 1: service, 2: dog, 3: date/time, 4: consent, 5: confirm
const booking = reactive({
  serviceId: '',
  dogId: '',
  date: '',
  time: '',
  notes: '',
})

const consent = reactive({
  accepted: false,
  signedName: '',
})

const submitting = ref(false)
const error = ref('')
const success = ref(false)

// Fetch services, dogs, and active consent template
const { data: servicesData } = useFetch('/api/services')
const { data: dogsData } = useFetch('/api/dogs')
const { data: consentData } = useFetch<{ template: any }>('/api/consent/active')

const services = computed(() => servicesData.value?.services || [])
const dogs = computed(() => dogsData.value?.dogs || [])
const consentTemplate = computed(() => consentData.value?.template || null)
const totalSteps = computed(() => consentTemplate.value ? 5 : 4)

const selectedService = computed(() => services.value.find((s: any) => s.id === booking.serviceId))
const selectedDog = computed(() => dogs.value.find((d: any) => d.id === booking.dogId))

// Availability
const slots = ref<{ time: string; available: boolean }[]>([])
const loadingSlots = ref(false)

watch(() => booking.date, async (date) => {
  if (!date) { slots.value = []; return }
  loadingSlots.value = true
  try {
    const res = await $fetch<{ slots: { time: string; available: boolean }[] }>('/api/availability', {
      params: { date },
    })
    slots.value = res.slots
  } catch {
    slots.value = []
  } finally {
    loadingSlots.value = false
  }
})

function selectService(id: string) {
  booking.serviceId = id
  step.value = 2
}

function selectDog(id: string) {
  booking.dogId = id
  step.value = 3
}

function selectSlot(time: string) {
  booking.time = time
  if (consentTemplate.value) {
    step.value = 4
  } else {
    step.value = 5
  }
}

function goBack() {
  error.value = ''
  if (step.value === 5 && !consentTemplate.value) {
    step.value = 3
  } else if (step.value > 1) {
    step.value--
  }
}

function proceedToConfirm() {
  if (!consent.accepted) {
    error.value = 'You must accept the terms and conditions to continue.'
    return
  }
  if (!consent.signedName.trim()) {
    error.value = 'Please type your full name as a signature.'
    return
  }
  error.value = ''
  step.value = 5
}

function formatPrice(pence: number) {
  return `£${(pence / 100).toFixed(2)}`
}

function tomorrow() {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return d.toISOString().split('T')[0]
}

// Step label helper for dynamic numbering
const confirmStepNum = computed(() => consentTemplate.value ? 5 : 4)

async function confirmBooking() {
  error.value = ''
  submitting.value = true
  try {
    const payload: any = {
      serviceId: booking.serviceId,
      dogId: booking.dogId,
      dateTime: `${booking.date}T${booking.time}:00.000Z`,
      notes: booking.notes || undefined,
    }

    if (consentTemplate.value) {
      payload.consent = {
        templateId: consentTemplate.value.id,
        accepted: consent.accepted,
        signedName: consent.signedName.trim(),
      }
    }

    await $fetch('/api/appointments', {
      method: 'POST',
      body: payload,
    })
    success.value = true
  } catch (e: any) {
    error.value = e?.data?.statusMessage || 'Failed to book appointment.'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="max-w-3xl mx-auto mt-8">
    <Head>
      <title>Book Appointment - Pampered Pooch Porthcawl</title>
    </Head>

    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold">Book an Appointment</h1>
      <NuxtLink to="/dashboard" class="text-sm text-gray-500 hover:underline">Back to Dashboard</NuxtLink>
    </div>

    <!-- Success -->
    <div v-if="success" class="bg-green-50 border border-green-200 rounded-lg p-6">
      <h2 class="text-lg font-semibold text-green-800 mb-2">Appointment Booked!</h2>
      <p class="text-green-700 text-sm mb-4">
        Your appointment has been submitted and is pending confirmation.
      </p>
      <NuxtLink to="/dashboard" class="text-sm text-brand-blue-dark hover:underline">Return to Dashboard</NuxtLink>
    </div>

    <!-- No dogs warning -->
    <div v-else-if="dogs.length === 0" class="border rounded-lg p-6 text-center">
      <p class="text-gray-500 mb-4">You need to add a dog before booking an appointment.</p>
      <NuxtLink
        to="/dashboard/dogs"
        class="bg-brand-blue-dark text-white px-6 py-2 rounded text-sm hover:bg-brand-blue transition-colors"
      >
        Add a Dog
      </NuxtLink>
    </div>

    <template v-else>
      <!-- Progress -->
      <div class="flex gap-2 mb-6">
        <div v-for="s in totalSteps" :key="s" class="flex-1 h-2 rounded-full" :class="s <= step ? 'bg-brand-blue-dark' : 'bg-gray-200'"></div>
      </div>

      <!-- Step 1: Select Service -->
      <div v-if="step === 1">
        <h2 class="text-lg font-semibold mb-4">1. Choose a Service</h2>
        <div class="space-y-3">
          <button
            v-for="svc in services"
            :key="svc.id"
            class="w-full border rounded-lg p-4 text-left hover:border-brand-blue-dark transition-colors"
            :class="{ 'border-brand-blue-dark bg-blue-50': booking.serviceId === svc.id }"
            @click="selectService(svc.id)"
          >
            <div class="flex justify-between items-start">
              <div>
                <div class="font-medium">{{ svc.name }}</div>
                <div v-if="svc.description" class="text-sm text-gray-600 mt-1">{{ svc.description }}</div>
              </div>
              <div class="text-right text-sm">
                <div class="font-medium">
                  {{ formatPrice(svc.priceFrom) }}<span v-if="svc.priceTo"> - {{ formatPrice(svc.priceTo) }}</span>
                </div>
                <div class="text-gray-500">{{ svc.durationMin }} min</div>
              </div>
            </div>
          </button>
        </div>
      </div>

      <!-- Step 2: Select Dog -->
      <div v-if="step === 2">
        <h2 class="text-lg font-semibold mb-4">2. Select Your Dog</h2>
        <div class="space-y-3">
          <button
            v-for="dog in dogs"
            :key="dog.id"
            class="w-full border rounded-lg p-4 text-left hover:border-brand-blue-dark transition-colors"
            :class="{ 'border-brand-blue-dark bg-blue-50': booking.dogId === dog.id }"
            @click="selectDog(dog.id)"
          >
            <div class="font-medium">{{ dog.name }}</div>
            <div class="text-sm text-gray-600">
              <span v-if="dog.breed">{{ dog.breed }}</span>
              <span v-if="dog.breed && dog.age"> &middot; </span>
              <span v-if="dog.age">{{ dog.age }} yrs</span>
            </div>
          </button>
        </div>
        <button class="mt-4 text-sm text-gray-500 hover:underline" @click="goBack">Back</button>
      </div>

      <!-- Step 3: Date & Time -->
      <div v-if="step === 3">
        <h2 class="text-lg font-semibold mb-4">3. Pick a Date &amp; Time</h2>

        <div class="mb-4">
          <label class="block text-sm font-medium mb-1">Date</label>
          <input
            v-model="booking.date"
            type="date"
            :min="tomorrow()"
            class="border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
          />
        </div>

        <div v-if="loadingSlots" class="text-sm text-gray-500">Loading available times...</div>

        <div v-else-if="booking.date && slots.length === 0" class="text-sm text-gray-500">
          No availability on this date. Please choose another day.
        </div>

        <div v-else-if="slots.length > 0" class="grid grid-cols-4 gap-2">
          <button
            v-for="slot in slots"
            :key="slot.time"
            :disabled="!slot.available"
            class="border rounded px-3 py-2 text-sm transition-colors"
            :class="slot.available
              ? (booking.time === slot.time ? 'bg-brand-blue-dark text-white border-brand-blue-dark' : 'hover:border-brand-blue-dark')
              : 'bg-gray-100 text-gray-400 cursor-not-allowed line-through'"
            @click="slot.available && selectSlot(slot.time)"
          >
            {{ slot.time }}
          </button>
        </div>

        <button class="mt-4 text-sm text-gray-500 hover:underline" @click="goBack">Back</button>
      </div>

      <!-- Step 4: Consent (only if active template exists) -->
      <div v-if="step === 4 && consentTemplate">
        <h2 class="text-lg font-semibold mb-4">4. Terms &amp; Conditions</h2>

        <div class="border rounded-lg p-5 mb-4 bg-gray-50 max-h-64 overflow-y-auto">
          <h3 class="font-medium mb-2">{{ consentTemplate.title }} <span class="text-xs text-gray-400">(v{{ consentTemplate.version }})</span></h3>
          <p class="text-sm text-gray-700 whitespace-pre-wrap">{{ consentTemplate.body }}</p>
        </div>

        <div class="space-y-4">
          <label class="flex items-start gap-3 cursor-pointer">
            <input
              v-model="consent.accepted"
              type="checkbox"
              class="mt-0.5 h-4 w-4 rounded border-gray-300 text-brand-blue-dark focus:ring-brand-blue"
            />
            <span class="text-sm">I have read and accept the above terms and conditions</span>
          </label>

          <div>
            <label class="block text-sm font-medium mb-1">Signature (type your full name)</label>
            <input
              v-model="consent.signedName"
              type="text"
              placeholder="e.g. John Smith"
              class="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
            />
          </div>
        </div>

        <p v-if="error" class="text-red-600 text-sm mt-3">{{ error }}</p>

        <div class="flex gap-3 mt-4">
          <button
            class="bg-brand-blue-dark text-white px-6 py-2 rounded text-sm hover:bg-brand-blue transition-colors"
            @click="proceedToConfirm"
          >
            Continue
          </button>
          <button class="text-sm text-gray-500 hover:underline" @click="goBack">Back</button>
        </div>
      </div>

      <!-- Step 5 (or 4 if no consent): Confirm -->
      <div v-if="step === confirmStepNum">
        <h2 class="text-lg font-semibold mb-4">{{ confirmStepNum }}. Confirm Your Booking</h2>

        <div class="border rounded-lg p-5 mb-4 space-y-2">
          <div class="flex justify-between">
            <span class="text-sm text-gray-500">Service</span>
            <span class="text-sm font-medium">{{ selectedService?.name }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-sm text-gray-500">Dog</span>
            <span class="text-sm font-medium">{{ selectedDog?.name }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-sm text-gray-500">Date</span>
            <span class="text-sm font-medium">{{ new Date(booking.date + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-sm text-gray-500">Time</span>
            <span class="text-sm font-medium">{{ booking.time }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-sm text-gray-500">Duration</span>
            <span class="text-sm font-medium">{{ selectedService?.durationMin }} min</span>
          </div>
          <div class="flex justify-between">
            <span class="text-sm text-gray-500">Price from</span>
            <span class="text-sm font-medium">{{ selectedService ? formatPrice(selectedService.priceFrom) : '' }}</span>
          </div>
          <div v-if="consentTemplate" class="flex justify-between">
            <span class="text-sm text-gray-500">Consent</span>
            <span class="text-sm font-medium text-green-700">Accepted</span>
          </div>
        </div>

        <div class="mb-4">
          <label class="block text-sm font-medium mb-1">Notes (optional)</label>
          <textarea
            v-model="booking.notes"
            rows="2"
            placeholder="Anything we should know?"
            class="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
          ></textarea>
        </div>

        <p v-if="error" class="text-red-600 text-sm mb-3">{{ error }}</p>

        <div class="flex gap-3">
          <button
            :disabled="submitting"
            class="bg-brand-blue-dark text-white px-6 py-2 rounded text-sm hover:bg-brand-blue transition-colors disabled:opacity-50"
            @click="confirmBooking"
          >
            {{ submitting ? 'Booking...' : 'Confirm Booking' }}
          </button>
          <button class="text-sm text-gray-500 hover:underline" @click="goBack">Back</button>
        </div>
      </div>
    </template>
  </div>
</template>
