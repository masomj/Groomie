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
  <div class="max-w-4xl mx-auto mt-8">
    <Head>
      <title>My Dogs - Pampered Pooch Porthcawl</title>
    </Head>

    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold">My Dogs</h1>
      <div class="flex gap-3">
        <NuxtLink to="/dashboard" class="text-sm text-gray-500 hover:underline">Back to Dashboard</NuxtLink>
        <button
          v-if="!showForm"
          class="bg-brand-blue-dark text-white px-4 py-2 rounded text-sm hover:bg-brand-blue transition-colors"
          @click="openAdd"
        >
          Add Dog
        </button>
      </div>
    </div>

    <!-- Add/Edit Form -->
    <div v-if="showForm" class="border rounded-lg p-6 mb-8 bg-white">
      <h2 class="text-lg font-semibold mb-4">{{ editing ? 'Edit Dog' : 'Add Dog' }}</h2>
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium mb-1">Name *</label>
            <input v-model="form.name" type="text" required class="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue" />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Age (years)</label>
            <input v-model="form.age" type="number" min="0" step="1" class="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue" />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Breed</label>
            <input v-model="form.breed" type="text" class="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue" />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Sex</label>
            <select v-model="form.sex" class="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue">
              <option value="">-- Select --</option>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Neutered?</label>
            <select v-model="form.neutered" class="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue">
              <option :value="null">Unknown</option>
              <option :value="true">Yes</option>
              <option :value="false">No</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Vaccinated?</label>
            <select v-model="form.vaccinated" class="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue">
              <option :value="null">Unknown</option>
              <option :value="true">Yes</option>
              <option :value="false">No</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Dog Friendly?</label>
            <select v-model="form.dogFriendly" class="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue">
              <option value="UNSURE">Unsure</option>
              <option value="YES">Yes</option>
              <option value="NO">No</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">People Friendly?</label>
            <select v-model="form.peopleFriendly" class="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue">
              <option value="UNSURE">Unsure</option>
              <option value="YES">Yes</option>
              <option value="NO">No</option>
            </select>
          </div>
          <div class="md:col-span-2">
            <label class="block text-sm font-medium mb-1">Medical History</label>
            <textarea v-model="form.medicalHistory" rows="2" class="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"></textarea>
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Emergency Vet Practice Name</label>
            <input v-model="form.emergencyVetName" type="text" class="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue" />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Emergency Vet Practice Address</label>
            <input v-model="form.emergencyVetAddr" type="text" class="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue" />
          </div>
          <div class="md:col-span-2">
            <label class="block text-sm font-medium mb-1">Additional Notes</label>
            <textarea v-model="form.notes" rows="2" class="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"></textarea>
          </div>
        </div>

        <p v-if="error" class="text-red-600 text-sm">{{ error }}</p>

        <div class="flex gap-3">
          <button
            type="submit"
            :disabled="saving"
            class="bg-brand-blue-dark text-white px-6 py-2 rounded text-sm hover:bg-brand-blue transition-colors disabled:opacity-50"
          >
            {{ saving ? 'Saving...' : (editing ? 'Update Dog' : 'Add Dog') }}
          </button>
          <button type="button" class="text-sm text-gray-500 hover:underline" @click="showForm = false">
            Cancel
          </button>
        </div>
      </form>
    </div>

    <!-- Dog List -->
    <div v-if="dogs.length === 0 && !showForm" class="border rounded-lg p-8 text-center">
      <p class="text-gray-500 mb-4">You haven't added any dogs yet.</p>
      <button
        class="bg-brand-blue-dark text-white px-6 py-2 rounded text-sm hover:bg-brand-blue transition-colors"
        @click="openAdd"
      >
        Add Your First Dog
      </button>
    </div>

    <div v-else-if="!showForm" class="space-y-4">
      <div v-for="dog in dogs" :key="dog.id" class="border rounded-lg p-5 bg-white">
        <div class="flex justify-between items-start">
          <div>
            <h3 class="font-semibold text-lg">{{ dog.name }}</h3>
            <div class="text-sm text-gray-600 space-y-1 mt-1">
              <p v-if="dog.breed || dog.age">
                <span v-if="dog.breed">{{ dog.breed }}</span>
                <span v-if="dog.breed && dog.age"> &middot; </span>
                <span v-if="dog.age">{{ dog.age }} yrs old</span>
              </p>
              <p v-if="dog.sex">{{ dog.sex === 'MALE' ? 'Male' : 'Female' }}
                <span v-if="dog.neutered !== null"> &middot; {{ dog.neutered ? 'Neutered' : 'Not neutered' }}</span>
              </p>
              <p v-if="dog.vaccinated !== null">
                {{ dog.vaccinated ? 'Vaccinated' : 'Not vaccinated' }}
              </p>
              <p v-if="dog.dogFriendly && dog.dogFriendly !== 'UNSURE'">
                Dog friendly: {{ dog.dogFriendly === 'YES' ? 'Yes' : 'No' }}
              </p>
              <p v-if="dog.peopleFriendly && dog.peopleFriendly !== 'UNSURE'">
                People friendly: {{ dog.peopleFriendly === 'YES' ? 'Yes' : 'No' }}
              </p>
              <p v-if="dog.medicalHistory" class="text-gray-500">Medical: {{ dog.medicalHistory }}</p>
              <p v-if="dog.emergencyVetName" class="text-gray-500">Emergency vet: {{ dog.emergencyVetName }}</p>
            </div>
          </div>
          <div class="flex gap-2">
            <button class="text-sm text-blue-600 hover:underline" @click="openEdit(dog)">Edit</button>
            <button
              class="text-sm text-red-600 hover:underline"
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
