<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const { data, refresh } = useFetch('/api/dogs')
const dogs = computed(() => data.value?.dogs || [])

const showForm = ref(false)
const editing = ref<any>(null)
const saving = ref(false)
const error = ref('')
const deleting = ref<string | null>(null)

const form = reactive({
  name: '',
  age: null as number | null,
  breed: '',
  sex: '' as string,
  neutered: null as boolean | null,
  vaccinated: null as boolean | null,
  medicalHistory: '',
  dogFriendly: 'UNSURE',
  peopleFriendly: 'UNSURE',
  emergencyVetName: '',
  emergencyVetAddr: '',
  notes: '',
})

function resetForm() {
  form.name = ''
  form.age = null
  form.breed = ''
  form.sex = ''
  form.neutered = null
  form.vaccinated = null
  form.medicalHistory = ''
  form.dogFriendly = 'UNSURE'
  form.peopleFriendly = 'UNSURE'
  form.emergencyVetName = ''
  form.emergencyVetAddr = ''
  form.notes = ''
}

function openAdd() {
  resetForm()
  editing.value = null
  showForm.value = true
  error.value = ''
}

function openEdit(dog: any) {
  editing.value = dog
  form.name = dog.name
  form.age = dog.age
  form.breed = dog.breed || ''
  form.sex = dog.sex || ''
  form.neutered = dog.neutered
  form.vaccinated = dog.vaccinated
  form.medicalHistory = dog.medicalHistory || ''
  form.dogFriendly = dog.dogFriendly || 'UNSURE'
  form.peopleFriendly = dog.peopleFriendly || 'UNSURE'
  form.emergencyVetName = dog.emergencyVetName || ''
  form.emergencyVetAddr = dog.emergencyVetAddr || ''
  form.notes = dog.notes || ''
  showForm.value = true
  error.value = ''
}

async function handleSubmit() {
  error.value = ''
  saving.value = true
  try {
    const payload: any = {
      name: form.name,
      breed: form.breed || null,
      sex: form.sex || null,
      neutered: form.neutered,
      vaccinated: form.vaccinated,
      medicalHistory: form.medicalHistory || null,
      dogFriendly: form.dogFriendly,
      peopleFriendly: form.peopleFriendly,
      emergencyVetName: form.emergencyVetName || null,
      emergencyVetAddr: form.emergencyVetAddr || null,
      notes: form.notes || null,
    }
    if (form.age !== null && form.age !== undefined && String(form.age) !== '') {
      payload.age = Number(form.age)
    } else {
      payload.age = null
    }

    if (editing.value) {
      await $fetch(`/api/dogs/${editing.value.id}`, { method: 'PATCH', body: payload })
    } else {
      await $fetch('/api/dogs', { method: 'POST', body: payload })
    }
    showForm.value = false
    await refresh()
  } catch (e: any) {
    error.value = e?.data?.statusMessage || 'Failed to save dog profile.'
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

      <div v-if="error" class="alert-error mb-6">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
        </svg>
        <span>{{ error }}</span>
      </div>

      <form @submit.prevent="handleSubmit" class="space-y-5">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">Name <span class="text-red-500">*</span></label>
            <input v-model="form.name" type="text" required placeholder="e.g. Buddy" class="input-field" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">Age (years)</label>
            <input v-model="form.age" type="number" min="0" step="1" placeholder="e.g. 3" class="input-field" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">Breed</label>
            <input v-model="form.breed" type="text" placeholder="e.g. Labrador Retriever" class="input-field" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">Sex</label>
            <select v-model="form.sex" class="input-field">
              <option value="">-- Select --</option>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">Neutered?</label>
            <select v-model="form.neutered" class="input-field">
              <option :value="null">Unknown</option>
              <option :value="true">Yes</option>
              <option :value="false">No</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">Vaccinated?</label>
            <select v-model="form.vaccinated" class="input-field">
              <option :value="null">Unknown</option>
              <option :value="true">Yes</option>
              <option :value="false">No</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">Dog Friendly?</label>
            <select v-model="form.dogFriendly" class="input-field">
              <option value="UNSURE">Unsure</option>
              <option value="YES">Yes</option>
              <option value="NO">No</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">People Friendly?</label>
            <select v-model="form.peopleFriendly" class="input-field">
              <option value="UNSURE">Unsure</option>
              <option value="YES">Yes</option>
              <option value="NO">No</option>
            </select>
          </div>
          <div class="md:col-span-2">
            <label class="block text-sm font-medium text-gray-700 mb-1.5">Medical History</label>
            <textarea v-model="form.medicalHistory" rows="2" placeholder="Any known conditions, allergies, or medications..." class="input-field"></textarea>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">Emergency Vet Practice Name</label>
            <input v-model="form.emergencyVetName" type="text" placeholder="e.g. Porthcawl Veterinary Clinic" class="input-field" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">Emergency Vet Practice Address</label>
            <input v-model="form.emergencyVetAddr" type="text" placeholder="e.g. 12 High Street, Porthcawl" class="input-field" />
          </div>
          <div class="md:col-span-2">
            <label class="block text-sm font-medium text-gray-700 mb-1.5">Additional Notes</label>
            <textarea v-model="form.notes" rows="2" placeholder="Anything else we should know about your dog..." class="input-field"></textarea>
          </div>
        </div>

        <div class="flex items-center gap-3 pt-2">
          <button
            type="submit"
            :disabled="saving"
            class="btn-primary"
          >
            <svg v-if="saving" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
