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
  <div class="max-w-3xl mx-auto px-4 py-10">
    <Head>
      <title>Book Appointment - Pampered Pooch Porthcawl</title>
    </Head>

    <!-- Header -->
    <div class="flex justify-between items-center mb-8">
      <h1 class="text-2xl font-bold text-gray-900">Book an Appointment</h1>
      <NuxtLink
        to="/dashboard"
        class="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-brand-blue-dark transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clip-rule="evenodd" />
        </svg>
        Back to Dashboard
      </NuxtLink>
    </div>

    <!-- Success State -->
    <div v-if="success" class="card p-8 text-center">
      <div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-green-600" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
        </svg>
      </div>
      <h2 class="text-xl font-bold text-green-800 mb-2">Appointment Booked!</h2>
      <p class="text-green-700 text-sm mb-6">
        Your appointment has been submitted and is pending confirmation.
      </p>
      <NuxtLink to="/dashboard" class="btn-primary btn-sm">
        Return to Dashboard
      </NuxtLink>
    </div>

    <!-- No Dogs Warning -->
    <div v-else-if="dogs.length === 0" class="card p-10 text-center">
      <div class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7 text-amber-600" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
        </svg>
      </div>
      <p class="text-gray-600 mb-6">You need to add a dog before booking an appointment.</p>
      <NuxtLink to="/dashboard/dogs" class="btn-primary btn-sm">
        Add a Dog
      </NuxtLink>
    </div>

    <template v-else>
      <!-- Progress Bar -->
      <div class="flex gap-1.5 mb-8">
        <div
          v-for="s in totalSteps"
          :key="s"
          class="flex-1 h-2 rounded-full transition-colors duration-300"
          :class="s <= step ? 'bg-brand-blue-dark' : 'bg-gray-200'"
        />
      </div>

      <!-- Step 1: Select Service -->
      <div v-if="step === 1">
        <h2 class="text-lg font-semibold text-gray-900 mb-1">1. Choose a Service</h2>
        <p class="text-sm text-gray-500 mb-5">Select the grooming service you'd like to book.</p>
        <div v-if="services.length > 0" class="space-y-3">
          <button
            v-for="svc in services"
            :key="svc.id"
            class="card-hover w-full p-5 text-left"
            :class="booking.serviceId === svc.id ? 'ring-2 ring-brand-blue-dark border-brand-blue-dark' : ''"
            @click="selectService(svc.id)"
          >
            <div class="flex items-start gap-4">
              <!-- Radio check icon -->
              <div
                class="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors"
                :class="booking.serviceId === svc.id
                  ? 'border-brand-blue-dark bg-brand-blue-dark'
                  : 'border-gray-300'"
              >
                <svg
                  v-if="booking.serviceId === svc.id"
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-3 w-3 text-white"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                </svg>
              </div>
              <div class="flex-1 min-w-0">
                <div class="font-medium text-gray-900">{{ svc.name }}</div>
                <div v-if="svc.description" class="text-sm text-gray-500 mt-1">{{ svc.description }}</div>
              </div>
              <div class="text-right shrink-0">
                <div class="font-semibold text-brand-blue-dark">
                  {{ formatPrice(svc.priceFrom) }}<span v-if="svc.priceTo"> - {{ formatPrice(svc.priceTo) }}</span>
                </div>
                <div class="text-xs text-gray-400 mt-0.5">{{ svc.durationMin }} min</div>
              </div>
            </div>
          </button>
        </div>
        <div v-else class="card p-6 text-center">
          <p class="text-sm text-gray-600">No active services are available right now. Please try again shortly or contact support.</p>
        </div>
      </div>

      <!-- Step 2: Select Dog -->
      <div v-if="step === 2">
        <h2 class="text-lg font-semibold text-gray-900 mb-1">2. Select Your Dog</h2>
        <p class="text-sm text-gray-500 mb-5">Which pup is getting pampered today?</p>
        <div class="space-y-3">
          <button
            v-for="dog in dogs"
            :key="dog.id"
            class="card-hover w-full p-5 text-left"
            :class="booking.dogId === dog.id ? 'ring-2 ring-brand-blue-dark border-brand-blue-dark' : ''"
            @click="selectDog(dog.id)"
          >
            <div class="flex items-center gap-4">
              <!-- Avatar circle with first letter -->
              <div
                class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold uppercase"
                :class="booking.dogId === dog.id
                  ? 'bg-brand-blue-dark text-white'
                  : 'bg-gray-100 text-gray-500'"
              >
                {{ dog.name?.charAt(0) || '?' }}
              </div>
              <div class="flex-1 min-w-0">
                <div class="font-medium text-gray-900">{{ dog.name }}</div>
                <div class="text-sm text-gray-500">
                  <span v-if="dog.breed">{{ dog.breed }}</span>
                  <span v-if="dog.breed && dog.age"> &middot; </span>
                  <span v-if="dog.age">{{ dog.age }} yrs</span>
                </div>
              </div>
              <!-- Selected check -->
              <div
                v-if="booking.dogId === dog.id"
                class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-blue-dark"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 text-white" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                </svg>
              </div>
            </div>
          </button>
        </div>
        <button class="btn-secondary btn-sm mt-6" @click="goBack">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clip-rule="evenodd" />
          </svg>
          Back
        </button>
      </div>

      <!-- Step 3: Date & Time -->
      <div v-if="step === 3">
        <h2 class="text-lg font-semibold text-gray-900 mb-1">3. Pick a Date &amp; Time</h2>
        <p class="text-sm text-gray-500 mb-5">Choose a convenient date and available time slot.</p>

        <div class="card p-6 mb-6">
          <label class="block text-sm font-medium text-gray-700 mb-2">Date</label>
          <input
            v-model="booking.date"
            type="date"
            :min="tomorrow()"
            class="input-field max-w-xs"
          />
        </div>

        <div v-if="loadingSlots" class="card p-6 text-center">
          <div class="flex items-center justify-center gap-2 text-sm text-gray-500">
            <svg class="h-4 w-4 animate-spin text-brand-blue-dark" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Loading available times...
          </div>
        </div>

        <div v-else-if="booking.date && slots.length === 0" class="card p-6 text-center">
          <p class="text-sm text-gray-500">No availability on this date. Please choose another day.</p>
        </div>

        <div v-else-if="slots.length > 0" class="card p-6">
          <label class="block text-sm font-medium text-gray-700 mb-3">Available Times</label>
          <div class="grid grid-cols-3 sm:grid-cols-4 gap-2">
            <button
              v-for="slot in slots"
              :key="slot.time"
              :disabled="!slot.available"
              class="rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 border"
              :class="slot.available
                ? (booking.time === slot.time
                  ? 'bg-brand-blue-dark text-white border-brand-blue-dark shadow-soft'
                  : 'bg-white border-gray-200 text-gray-700 hover:border-brand-blue-dark hover:text-brand-blue-dark hover:shadow-soft')
                : 'bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed line-through'"
              @click="slot.available && selectSlot(slot.time)"
            >
              {{ slot.time }}
            </button>
          </div>
        </div>

        <button class="btn-secondary btn-sm mt-6" @click="goBack">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clip-rule="evenodd" />
          </svg>
          Back
        </button>
      </div>

      <!-- Step 4: Consent (only if active template exists) -->
      <div v-if="step === 4 && consentTemplate">
        <h2 class="text-lg font-semibold text-gray-900 mb-1">4. Terms &amp; Conditions</h2>
        <p class="text-sm text-gray-500 mb-5">Please review and accept the terms below.</p>

        <div class="card p-6 mb-6">
          <div class="bg-gray-50 rounded-lg p-5 mb-5 max-h-64 overflow-y-auto border border-gray-100">
            <h3 class="font-medium text-gray-900 mb-2">
              {{ consentTemplate.title }}
              <span class="text-xs text-gray-400 font-normal">(v{{ consentTemplate.version }})</span>
            </h3>
            <p class="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{{ consentTemplate.body }}</p>
          </div>

          <div class="space-y-4">
            <label class="flex items-start gap-3 cursor-pointer">
              <input
                v-model="consent.accepted"
                type="checkbox"
                class="mt-0.5 h-4 w-4 rounded border-gray-300 text-brand-blue-dark focus:ring-brand-blue"
              />
              <span class="text-sm text-gray-700">I have read and accept the above terms and conditions</span>
            </label>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Signature (type your full name)</label>
              <input
                v-model="consent.signedName"
                type="text"
                placeholder="e.g. John Smith"
                class="input-field"
              />
            </div>
          </div>
        </div>

        <!-- Error -->
        <div v-if="error" class="alert-error mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
          </svg>
          {{ error }}
        </div>

        <div class="flex items-center gap-3">
          <button class="btn-primary btn-sm" @click="proceedToConfirm">
            Continue
          </button>
          <button class="btn-secondary btn-sm" @click="goBack">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clip-rule="evenodd" />
            </svg>
            Back
          </button>
        </div>
      </div>

      <!-- Step 5 (or 4 if no consent): Confirm -->
      <div v-if="step === confirmStepNum">
        <h2 class="text-lg font-semibold text-gray-900 mb-1">{{ confirmStepNum }}. Confirm Your Booking</h2>
        <p class="text-sm text-gray-500 mb-5">Review the details below and confirm.</p>

        <div class="card p-6 mb-6">
          <div class="divide-y divide-gray-100">
            <div class="flex justify-between items-center py-3 first:pt-0">
              <span class="text-sm text-gray-500">Service</span>
              <span class="text-sm font-medium text-gray-900">{{ selectedService?.name }}</span>
            </div>
            <div class="flex justify-between items-center py-3">
              <span class="text-sm text-gray-500">Dog</span>
              <span class="text-sm font-medium text-gray-900">{{ selectedDog?.name }}</span>
            </div>
            <div class="flex justify-between items-center py-3">
              <span class="text-sm text-gray-500">Date</span>
              <span class="text-sm font-medium text-gray-900">{{ new Date(booking.date + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) }}</span>
            </div>
            <div class="flex justify-between items-center py-3">
              <span class="text-sm text-gray-500">Time</span>
              <span class="text-sm font-medium text-gray-900">{{ booking.time }}</span>
            </div>
            <div class="flex justify-between items-center py-3">
              <span class="text-sm text-gray-500">Duration</span>
              <span class="text-sm font-medium text-gray-900">{{ selectedService?.durationMin }} min</span>
            </div>
            <div class="flex justify-between items-center py-3">
              <span class="text-sm text-gray-500">Price from</span>
              <span class="text-sm font-semibold text-brand-blue-dark">{{ selectedService ? formatPrice(selectedService.priceFrom) : '' }}</span>
            </div>
            <div v-if="consentTemplate" class="flex justify-between items-center py-3 last:pb-0">
              <span class="text-sm text-gray-500">Consent</span>
              <span class="inline-flex items-center gap-1 text-sm font-medium text-green-700">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
                Accepted
              </span>
            </div>
          </div>
        </div>

        <div class="card p-6 mb-6">
          <label class="block text-sm font-medium text-gray-700 mb-2">Notes (optional)</label>
          <textarea
            v-model="booking.notes"
            rows="2"
            placeholder="Anything we should know?"
            class="input-field"
          />
        </div>

        <!-- Error -->
        <div v-if="error" class="alert-error mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
          </svg>
          {{ error }}
        </div>

        <div class="flex items-center gap-3">
          <button
            :disabled="submitting"
            class="btn-primary btn-sm disabled:opacity-50 disabled:cursor-not-allowed"
            @click="confirmBooking"
          >
            {{ submitting ? 'Booking...' : 'Confirm Booking' }}
          </button>
          <button class="btn-secondary btn-sm" @click="goBack">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clip-rule="evenodd" />
            </svg>
            Back
          </button>
        </div>
      </div>
    </template>
  </div>
</template>
