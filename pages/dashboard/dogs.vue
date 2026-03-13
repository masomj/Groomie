<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const { data, refresh } = useFetch('/api/dogs')
const dogs = computed(() => data.value?.dogs || [])

const showForm = ref(false)
const editing = ref<any>(null)
const saving = ref(false)
const serverError = ref('')
const deleting = ref<string | null>(null)

const fieldLabels: Record<string, string> = {
  name: 'Name',
  age: 'Age',
  breed: 'Breed',
  sex: 'Sex',
  neutered: 'Neutered',
  vaccinated: 'Vaccinated',
  dogFriendly: 'Dog Friendly',
  peopleFriendly: 'People Friendly',
}

const form = reactive({
  name: '',
  age: null as number | null,
  breed: '',
  sex: '' as string,
  neutered: null as boolean | 'UNKNOWN' | null,
  vaccinated: null as boolean | 'UNKNOWN' | null,
  medicalHistory: '',
  dogFriendly: '',
  peopleFriendly: '',
  emergencyVetName: '',
  emergencyVetAddr: '',
  notes: '',
})

const errors = reactive<Record<string, string>>({})
const hasErrors = computed(() => Object.keys(errors).length > 0)

function focusField(event: Event, field: string) {
  event.preventDefault()
  const el = document.getElementById(`field-${field}`) as HTMLElement | null
  if (!el) return
  el.scrollIntoView({ behavior: 'smooth', block: 'center' })
  el.focus()
}

function validateField(field: string) {
  if (field === 'name') {
    if (!form.name.trim()) errors.name = 'Name is required.'
    else delete errors.name
    return
  }

  if (field === 'age') {
    if (form.age === null || form.age === undefined || String(form.age) === '') {
      errors.age = 'Age is required.'
    } else if (Number(form.age) < 0) {
      errors.age = 'Age cannot be negative.'
    } else if (Number(form.age) > 30) {
      errors.age = 'Age cannot exceed 30 years.'
    } else {
      delete errors.age
    }
    return
  }

  if (field === 'breed') {
    if (!form.breed.trim()) errors.breed = 'Breed is required.'
    else delete errors.breed
    return
  }

  if (field === 'sex') {
    if (!form.sex) errors.sex = 'Sex is required.'
    else delete errors.sex
    return
  }

  if (field === 'neutered') {
    if (form.neutered === null) errors.neutered = 'Please select whether your dog is neutered.'
    else delete errors.neutered
    return
  }

  if (field === 'vaccinated') {
    if (form.vaccinated === null) errors.vaccinated = 'Please select whether your dog is vaccinated.'
    else delete errors.vaccinated
    return
  }

  if (field === 'dogFriendly') {
    if (!form.dogFriendly) errors.dogFriendly = 'Please select a dog friendly option.'
    else delete errors.dogFriendly
    return
  }

  if (field === 'peopleFriendly') {
    if (!form.peopleFriendly) errors.peopleFriendly = 'Please select a people friendly option.'
    else delete errors.peopleFriendly
  }
}

function clearErrors() {
  for (const key of Object.keys(errors)) delete errors[key]
  serverError.value = ''
}

function resetForm() {
  form.name = ''
  form.age = null
  form.breed = ''
  form.sex = ''
  form.neutered = null
  form.vaccinated = null
  form.medicalHistory = ''
  form.dogFriendly = ''
  form.peopleFriendly = ''
  form.emergencyVetName = ''
  form.emergencyVetAddr = ''
  form.notes = ''
}

function openAdd() {
  resetForm()
  clearErrors()
  editing.value = null
  showForm.value = true
}

function openEdit(dog: any) {
  editing.value = dog
  form.name = dog.name
  form.age = dog.age
  form.breed = dog.breed || ''
  form.sex = dog.sex || ''
  form.neutered = dog.neutered === null ? 'UNKNOWN' : dog.neutered
  form.vaccinated = dog.vaccinated === null ? 'UNKNOWN' : dog.vaccinated
  form.medicalHistory = dog.medicalHistory || ''
  form.dogFriendly = dog.dogFriendly || 'UNSURE'
  form.peopleFriendly = dog.peopleFriendly || 'UNSURE'
  form.emergencyVetName = dog.emergencyVetName || ''
  form.emergencyVetAddr = dog.emergencyVetAddr || ''
  form.notes = dog.notes || ''
  clearErrors()
  showForm.value = true
}

function validate(): boolean {
  for (const key of Object.keys(errors)) delete errors[key]

  validateField('name')
  validateField('age')
  validateField('breed')
  validateField('sex')
  validateField('neutered')
  validateField('vaccinated')
  validateField('dogFriendly')
  validateField('peopleFriendly')

  if (hasErrors.value) {
    nextTick(() => {
      const el = document.getElementById('error-summary')
      el?.focus()
    })
  }

  return !hasErrors.value
}

async function handleSubmit() {
  serverError.value = ''
  if (!validate()) return

  saving.value = true
  try {
    const payload: any = {
      name: form.name,
      breed: form.breed,
      sex: form.sex,
      neutered: form.neutered === 'UNKNOWN' ? null : form.neutered,
      vaccinated: form.vaccinated === 'UNKNOWN' ? null : form.vaccinated,
      medicalHistory: form.medicalHistory || null,
      dogFriendly: form.dogFriendly,
      peopleFriendly: form.peopleFriendly,
      emergencyVetName: form.emergencyVetName || null,
      emergencyVetAddr: form.emergencyVetAddr || null,
      notes: form.notes || null,
      age: Number(form.age),
    }

    if (editing.value) {
      await $fetch(`/api/dogs/${editing.value.id}`, { method: 'PATCH', body: payload })
    } else {
      await $fetch('/api/dogs', { method: 'POST', body: payload })
    }
    showForm.value = false
    await refresh()
  } catch (e: any) {
    serverError.value = e?.data?.statusMessage || 'Failed to save dog profile.'
    nextTick(() => {
      document.getElementById('server-error')?.focus()
    })
  } finally {
    saving.value = false
  }
}

async function deleteDog(id: string) {
  if (!confirm('Are you sure you want to remove this dog profile?')) return
  deleting.value = id
  try {
    await $fetch(`/api/dogs/${id}`, { method: 'DELETE' })
    await refresh()
  } catch (e: any) {
    alert(e?.data?.statusMessage || 'Failed to delete dog profile.')
  } finally {
    deleting.value = null
  }
}
</script>

<template>
  <div class="max-w-4xl mx-auto px-4 py-10">
    <Head>
      <title>My Dogs - Pampered Pooch Porthcawl</title>
    </Head>

    <!-- Page Header -->
    <div class="mb-8">
      <NuxtLink
        to="/dashboard"
        class="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-brand-blue-dark transition-colors mb-4"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clip-rule="evenodd" />
        </svg>
        Back to Dashboard
      </NuxtLink>
      <div class="flex justify-between items-center">
        <div>
          <h1 class="section-heading">My Dogs</h1>
          <p class="text-gray-500 mt-1">Manage your dog profiles and their details.</p>
        </div>
        <button
          v-if="!showForm"
          class="btn-primary btn-sm"
          @click="openAdd"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
          </svg>
          Add Dog
        </button>
      </div>
    </div>

    <!-- Add/Edit Form -->
    <div v-if="showForm" class="card p-6 md:p-8 mb-8">
      <h2 class="text-xl font-bold text-gray-900 mb-6">{{ editing ? 'Edit Dog Profile' : 'Add a New Dog' }}</h2>

      <!-- Server error -->
      <div v-if="serverError" id="server-error" tabindex="-1" class="alert-error mb-6" role="alert">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
        </svg>
        <span>{{ serverError }}</span>
      </div>

      <!-- Validation error summary with skip links -->
      <div v-if="hasErrors" id="error-summary" tabindex="-1" class="rounded-lg border border-red-300 bg-red-50 p-4 mb-6" role="alert" aria-labelledby="error-summary-heading" aria-live="assertive">
        <h3 id="error-summary-heading" class="text-sm font-semibold text-red-800 mb-2">
          There {{ Object.keys(errors).length === 1 ? 'is 1 problem' : `are ${Object.keys(errors).length} problems` }} with your submission
        </h3>
        <ul class="list-disc pl-5 space-y-1">
          <li v-for="(msg, field) in errors" :key="field" class="text-sm text-red-700">
            <a :href="`#field-${field}`" @click="focusField($event, String(field))" class="underline hover:text-red-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 rounded">
              {{ fieldLabels[field] }}: {{ msg }}
            </a>
          </li>
        </ul>
      </div>

      <form @submit.prevent="handleSubmit" class="space-y-5" novalidate>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
          <!-- Name -->
          <div>
            <label for="field-name" class="block text-sm font-medium mb-1.5" :class="errors.name ? 'text-red-700' : 'text-gray-700'">Name <span class="text-red-500" aria-hidden="true">*</span></label>
            <input
              id="field-name"
              v-model="form.name"
              type="text"
              placeholder="e.g. Buddy"
              aria-required="true"
              :aria-invalid="!!errors.name"
              :aria-describedby="errors.name ? 'error-name' : undefined"
              :class="['input-field', errors.name ? 'border-red-500 bg-red-50 focus:border-red-500 focus:ring-red-500' : '']"
            />
            <p v-if="errors.name" id="error-name" class="mt-1 text-sm text-red-600" role="alert">{{ errors.name }}</p>
          </div>

          <!-- Age -->
          <div>
            <label for="field-age" class="block text-sm font-medium mb-1.5" :class="errors.age ? 'text-red-700' : 'text-gray-700'">Age (years) <span class="text-red-500" aria-hidden="true">*</span></label>
            <input
              id="field-age"
              v-model="form.age"
              type="number"
              min="0"
              max="30"
              step="1"
              placeholder="e.g. 3"
              aria-required="true"
              :aria-invalid="!!errors.age"
              :aria-describedby="errors.age ? 'error-age' : undefined"
              :class="['input-field', errors.age ? 'border-red-500 bg-red-50 focus:border-red-500 focus:ring-red-500' : '']"
            />
            <p v-if="errors.age" id="error-age" class="mt-1 text-sm text-red-600" role="alert">{{ errors.age }}</p>
          </div>

          <!-- Breed -->
          <div>
            <label for="field-breed" class="block text-sm font-medium mb-1.5" :class="errors.breed ? 'text-red-700' : 'text-gray-700'">Breed <span class="text-red-500" aria-hidden="true">*</span></label>
            <input
              id="field-breed"
              v-model="form.breed"
              type="text"
              placeholder="e.g. Labrador Retriever"
              aria-required="true"
              :aria-invalid="!!errors.breed"
              :aria-describedby="errors.breed ? 'error-breed' : undefined"
              :class="['input-field', errors.breed ? 'border-red-500 bg-red-50 focus:border-red-500 focus:ring-red-500' : '']"
            />
            <p v-if="errors.breed" id="error-breed" class="mt-1 text-sm text-red-600" role="alert">{{ errors.breed }}</p>
          </div>

          <!-- Sex -->
          <div>
            <label for="field-sex" class="block text-sm font-medium mb-1.5" :class="errors.sex ? 'text-red-700' : 'text-gray-700'">Sex <span class="text-red-500" aria-hidden="true">*</span></label>
            <select
              id="field-sex"
              v-model="form.sex"
              aria-required="true"
              :aria-invalid="!!errors.sex"
              :aria-describedby="errors.sex ? 'error-sex' : undefined"
              :class="['input-field', errors.sex ? 'border-red-500 bg-red-50 focus:border-red-500 focus:ring-red-500' : '']"
            >
              <option value="" disabled>-- Select --</option>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
            </select>
            <p v-if="errors.sex" id="error-sex" class="mt-1 text-sm text-red-600" role="alert">{{ errors.sex }}</p>
          </div>

          <!-- Neutered -->
          <div>
            <label for="field-neutered" class="block text-sm font-medium mb-1.5" :class="errors.neutered ? 'text-red-700' : 'text-gray-700'">Neutered? <span class="text-red-500" aria-hidden="true">*</span></label>
            <select
              id="field-neutered"
              v-model="form.neutered"
              aria-required="true"
              :aria-invalid="!!errors.neutered"
              :aria-describedby="errors.neutered ? 'error-neutered' : undefined"
              :class="['input-field', errors.neutered ? 'border-red-500 bg-red-50 focus:border-red-500 focus:ring-red-500' : '']"
            >
              <option :value="null" disabled>-- Select --</option>
              <option :value="true">Yes</option>
              <option :value="false">No</option>
              <option value="UNKNOWN">Unknown</option>
            </select>
            <p v-if="errors.neutered" id="error-neutered" class="mt-1 text-sm text-red-600" role="alert">{{ errors.neutered }}</p>
          </div>

          <!-- Vaccinated -->
          <div>
            <label for="field-vaccinated" class="block text-sm font-medium mb-1.5" :class="errors.vaccinated ? 'text-red-700' : 'text-gray-700'">Vaccinated? <span class="text-red-500" aria-hidden="true">*</span></label>
            <select
              id="field-vaccinated"
              v-model="form.vaccinated"
              aria-required="true"
              :aria-invalid="!!errors.vaccinated"
              :aria-describedby="errors.vaccinated ? 'error-vaccinated' : undefined"
              :class="['input-field', errors.vaccinated ? 'border-red-500 bg-red-50 focus:border-red-500 focus:ring-red-500' : '']"
            >
              <option :value="null" disabled>-- Select --</option>
              <option :value="true">Yes</option>
              <option :value="false">No</option>
              <option value="UNKNOWN">Unknown</option>
            </select>
            <p v-if="errors.vaccinated" id="error-vaccinated" class="mt-1 text-sm text-red-600" role="alert">{{ errors.vaccinated }}</p>
          </div>

          <!-- Dog Friendly -->
          <div>
            <label for="field-dogFriendly" class="block text-sm font-medium mb-1.5" :class="errors.dogFriendly ? 'text-red-700' : 'text-gray-700'">Dog Friendly? <span class="text-red-500" aria-hidden="true">*</span></label>
            <select
              id="field-dogFriendly"
              v-model="form.dogFriendly"
              aria-required="true"
              :aria-invalid="!!errors.dogFriendly"
              :aria-describedby="errors.dogFriendly ? 'error-dogFriendly' : undefined"
              :class="['input-field', errors.dogFriendly ? 'border-red-500 bg-red-50 focus:border-red-500 focus:ring-red-500' : '']"
            >
              <option value="" disabled>-- Select --</option>
              <option value="YES">Yes</option>
              <option value="NO">No</option>
              <option value="UNSURE">Unknown</option>
            </select>
            <p v-if="errors.dogFriendly" id="error-dogFriendly" class="mt-1 text-sm text-red-600" role="alert">{{ errors.dogFriendly }}</p>
          </div>

          <!-- People Friendly -->
          <div>
            <label for="field-peopleFriendly" class="block text-sm font-medium mb-1.5" :class="errors.peopleFriendly ? 'text-red-700' : 'text-gray-700'">People Friendly? <span class="text-red-500" aria-hidden="true">*</span></label>
            <select
              id="field-peopleFriendly"
              v-model="form.peopleFriendly"
              aria-required="true"
              :aria-invalid="!!errors.peopleFriendly"
              :aria-describedby="errors.peopleFriendly ? 'error-peopleFriendly' : undefined"
              :class="['input-field', errors.peopleFriendly ? 'border-red-500 bg-red-50 focus:border-red-500 focus:ring-red-500' : '']"
            >
              <option value="" disabled>-- Select --</option>
              <option value="YES">Yes</option>
              <option value="NO">No</option>
              <option value="UNSURE">Unknown</option>
            </select>
            <p v-if="errors.peopleFriendly" id="error-peopleFriendly" class="mt-1 text-sm text-red-600" role="alert">{{ errors.peopleFriendly }}</p>
          </div>

          <!-- Medical History (optional) -->
          <div class="md:col-span-2">
            <label for="field-medicalHistory" class="block text-sm font-medium text-gray-700 mb-1.5">Medical History</label>
            <textarea id="field-medicalHistory" v-model="form.medicalHistory" rows="2" placeholder="Any known conditions, allergies, or medications..." class="input-field"></textarea>
          </div>

          <!-- Emergency Vet Name (optional) -->
          <div>
            <label for="field-emergencyVetName" class="block text-sm font-medium text-gray-700 mb-1.5">Emergency Vet Practice Name</label>
            <input id="field-emergencyVetName" v-model="form.emergencyVetName" type="text" placeholder="e.g. Porthcawl Veterinary Clinic" class="input-field" />
          </div>

          <!-- Emergency Vet Address (optional) -->
          <div>
            <label for="field-emergencyVetAddr" class="block text-sm font-medium text-gray-700 mb-1.5">Emergency Vet Practice Address</label>
            <input id="field-emergencyVetAddr" v-model="form.emergencyVetAddr" type="text" placeholder="e.g. 12 High Street, Porthcawl" class="input-field" />
          </div>

          <!-- Notes (optional) -->
          <div class="md:col-span-2">
            <label for="field-notes" class="block text-sm font-medium text-gray-700 mb-1.5">Additional Notes</label>
            <textarea id="field-notes" v-model="form.notes" rows="2" placeholder="Anything else we should know about your dog..." class="input-field"></textarea>
          </div>
        </div>

        <p class="text-xs text-gray-400"><span class="text-red-500" aria-hidden="true">*</span> Required field</p>

        <div class="flex items-center gap-3 pt-2">
          <button
            type="submit"
            :disabled="saving"
            class="btn-primary"
          >
            <svg v-if="saving" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
            </svg>
            {{ saving ? 'Saving...' : (editing ? 'Update Dog' : 'Add Dog') }}
          </button>
          <button type="button" class="btn-secondary btn-sm" @click="showForm = false">
            Cancel
          </button>
        </div>
      </form>
    </div>

    <!-- Empty State -->
    <div v-if="dogs.length === 0 && !showForm" class="card p-12 text-center">
      <div class="flex justify-center mb-5">
        <div class="bg-brand-blue/10 rounded-full p-4">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-brand-blue" viewBox="0 0 512 512" fill="currentColor">
            <path d="M226.5 92.9c14.3 42.9-.3 86.2-32.6 96.8s-70.1-15.6-84.4-58.5c-14.3-42.9.3-86.2 32.6-96.8s70.1 15.6 84.4 58.5zM100.4 198.6c18.9 32.4 14.3 70.1-10.2 84.1s-59.7-.9-78.5-33.3S-2.7 179.3 21.8 165.3s59.7.9 78.5 33.3zm327.2 0c18.9-32.4 54.2-45.7 78.5-33.3s24.7 51.7 5.9 84.1-54.2 45.7-78.5 33.3-24.7-51.7-5.9-84.1zM285.5 92.9c14.3-42.9 51.7-70.9 84.4-58.5 32.6 10.6 46.9 53.9 32.6 96.8-14.3 42.9-51.7 70.9-84.4 58.5-32.6-10.6-46.9-53.9-32.6-96.8zM256 256c-53 0-96 43-96 96v55.4c0 16.4 12.1 30.6 28.4 32.4 47.2 5.3 95.9 5.3 143.2 0C347.9 437.9 360 423.8 360 407.4V352c0-53-43-96-96-96z"/>
          </svg>
        </div>
      </div>
      <h3 class="text-lg font-semibold text-gray-900 mb-2">No dogs yet</h3>
      <p class="text-gray-500 mb-6 max-w-sm mx-auto">Add your first dog to get started with booking grooming sessions.</p>
      <button
        class="btn-primary"
        @click="openAdd"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
        </svg>
        Add Your First Dog
      </button>
    </div>

    <!-- Dog List -->
    <div v-else-if="!showForm" class="space-y-4">
      <div v-for="dog in dogs" :key="dog.id" class="card p-5 md:p-6">
        <div class="flex items-start gap-4">
          <!-- Avatar Circle -->
          <div class="flex-shrink-0 h-12 w-12 rounded-full bg-brand-blue/10 text-brand-blue-dark flex items-center justify-center text-lg font-bold">
            {{ dog.name?.charAt(0)?.toUpperCase() }}
          </div>

          <!-- Dog Info -->
          <div class="flex-1 min-w-0">
            <h3 class="font-bold text-lg text-gray-900">{{ dog.name }}</h3>
            <div class="text-sm text-gray-600 space-y-1 mt-1">
              <p v-if="dog.breed || dog.age">
                <span v-if="dog.breed">{{ dog.breed }}</span>
                <span v-if="dog.breed && dog.age"> &middot; </span>
                <span v-if="dog.age">{{ dog.age }} yrs old</span>
              </p>
              <p v-if="dog.sex">{{ dog.sex === 'MALE' ? 'Male' : 'Female' }}
                <span v-if="dog.neutered !== null"> &middot; {{ dog.neutered ? 'Neutered' : 'Not neutered' }}</span>
              </p>
            </div>

            <!-- Badges -->
            <div class="flex flex-wrap gap-2 mt-3">
              <span v-if="dog.vaccinated === true" class="badge bg-green-100 text-green-700">Vaccinated</span>
              <span v-if="dog.vaccinated === false" class="badge bg-yellow-100 text-yellow-700">Not vaccinated</span>
              <span v-if="dog.dogFriendly === 'YES'" class="badge bg-blue-100 text-blue-700">Dog friendly</span>
              <span v-if="dog.dogFriendly === 'NO'" class="badge bg-red-100 text-red-700">Not dog friendly</span>
              <span v-if="dog.peopleFriendly === 'YES'" class="badge bg-blue-100 text-blue-700">People friendly</span>
              <span v-if="dog.peopleFriendly === 'NO'" class="badge bg-red-100 text-red-700">Not people friendly</span>
            </div>

            <!-- Extra details -->
            <div v-if="dog.medicalHistory || dog.emergencyVetName" class="mt-3 text-sm text-gray-500 space-y-1">
              <p v-if="dog.medicalHistory">
                <span class="font-medium text-gray-600">Medical:</span> {{ dog.medicalHistory }}
              </p>
              <p v-if="dog.emergencyVetName">
                <span class="font-medium text-gray-600">Emergency vet:</span> {{ dog.emergencyVetName }}
              </p>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex-shrink-0 flex gap-2">
            <button class="btn-secondary btn-sm" @click="openEdit(dog)">Edit</button>
            <button
              class="btn-danger btn-sm"
              :disabled="deleting === dog.id"
              @click="deleteDog(dog.id)"
            >
              {{ deleting === dog.id ? 'Deleting...' : 'Delete' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
