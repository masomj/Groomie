<script setup lang="ts">
definePageMeta({ middleware: 'admin' })

const { data, refresh } = useFetch('/api/admin/consent-templates')
const templates = computed(() => data.value?.templates || [])

const showForm = ref(false)
const editing = ref<any>(null)
const form = reactive({ title: '', body: '', questions: '' })
const saving = ref(false)
const error = ref('')
const activating = ref<string | null>(null)

function openCreate() {
  editing.value = null
  form.title = ''
  form.body = ''
  form.questions = ''
  error.value = ''
  showForm.value = true
}

function openEdit(t: any) {
  editing.value = t
  form.title = t.title
  form.body = t.body
  form.questions = t.questions ? JSON.stringify(t.questions, null, 2) : ''
  error.value = ''
  showForm.value = true
}

function cancelForm() {
  showForm.value = false
  editing.value = null
  error.value = ''
}

async function saveTemplate() {
  error.value = ''
  if (!form.title.trim()) { error.value = 'Title is required.'; return }
  if (!form.body.trim()) { error.value = 'Body is required.'; return }

  let questions = undefined
  if (form.questions.trim()) {
    try {
      questions = JSON.parse(form.questions)
    } catch {
      error.value = 'Questions must be valid JSON.'
      return
    }
  }

  saving.value = true
  try {
    if (editing.value) {
      await $fetch(`/api/admin/consent-templates/${editing.value.id}`, {
        method: 'PATCH',
        body: { title: form.title, body: form.body, questions },
      })
    } else {
      await $fetch('/api/admin/consent-templates', {
        method: 'POST',
        body: { title: form.title, body: form.body, questions },
      })
    }
    showForm.value = false
    editing.value = null
    await refresh()
  } catch (e: any) {
    error.value = e?.data?.statusMessage || 'Failed to save template.'
  } finally {
    saving.value = false
  }
}

async function activateTemplate(id: string) {
  activating.value = id
  try {
    await $fetch(`/api/admin/consent-templates/${id}/activate`, { method: 'POST' })
    await refresh()
  } catch (e: any) {
    alert(e?.data?.statusMessage || 'Failed to activate template.')
  } finally {
    activating.value = null
  }
}
</script>

<template>
  <div class="max-w-5xl mx-auto mt-8">
    <Head>
      <title>Consent Templates - Admin - Pampered Pooch Porthcawl</title>
    </Head>

    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold">Consent Templates</h1>
      <div class="flex gap-3">
        <NuxtLink to="/admin" class="text-sm text-gray-500 hover:underline">Back to Appointments</NuxtLink>
        <button
          class="bg-brand-blue-dark text-white px-4 py-2 rounded text-sm hover:bg-brand-blue transition-colors"
          @click="openCreate"
        >
          New Template
        </button>
      </div>
    </div>

    <!-- Form -->
    <div v-if="showForm" class="border rounded-lg p-5 mb-6 bg-white">
      <h2 class="text-lg font-semibold mb-4">{{ editing ? 'Edit Template' : 'New Template' }}</h2>

      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium mb-1">Title</label>
          <input
            v-model="form.title"
            type="text"
            placeholder="e.g. Terms & Conditions"
            class="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
          />
        </div>

        <div>
          <label class="block text-sm font-medium mb-1">Body (terms text)</label>
          <textarea
            v-model="form.body"
            rows="8"
            placeholder="Enter the full terms and conditions text..."
            class="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
          ></textarea>
        </div>

        <div>
          <label class="block text-sm font-medium mb-1">Structured Questions (JSON, optional)</label>
          <textarea
            v-model="form.questions"
            rows="4"
            placeholder='e.g. [{"question": "Is your dog up to date on vaccinations?", "type": "yes_no"}]'
            class="w-full border rounded px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-blue"
          ></textarea>
        </div>
      </div>

      <p v-if="error" class="text-red-600 text-sm mt-3">{{ error }}</p>

      <div class="flex gap-3 mt-4">
        <button
          :disabled="saving"
          class="bg-brand-blue-dark text-white px-6 py-2 rounded text-sm hover:bg-brand-blue transition-colors disabled:opacity-50"
          @click="saveTemplate"
        >
          {{ saving ? 'Saving...' : (editing ? 'Update' : 'Create') }}
        </button>
        <button class="text-sm text-gray-500 hover:underline" @click="cancelForm">Cancel</button>
      </div>
    </div>

    <!-- Templates list -->
    <div v-if="templates.length === 0 && !showForm" class="border rounded-lg p-8 text-center">
      <p class="text-gray-500 mb-4">No consent templates yet.</p>
      <button
        class="bg-brand-blue-dark text-white px-6 py-2 rounded text-sm hover:bg-brand-blue transition-colors"
        @click="openCreate"
      >
        Create First Template
      </button>
    </div>

    <div v-else-if="templates.length > 0" class="overflow-x-auto">
      <table class="w-full text-sm border-collapse">
        <thead>
          <tr class="border-b bg-gray-50">
            <th class="text-left px-4 py-3 font-medium">Title</th>
            <th class="text-left px-4 py-3 font-medium">Version</th>
            <th class="text-left px-4 py-3 font-medium">Status</th>
            <th class="text-left px-4 py-3 font-medium">Records</th>
            <th class="text-left px-4 py-3 font-medium">Created</th>
            <th class="text-left px-4 py-3 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="t in templates" :key="t.id" class="border-b hover:bg-gray-50">
            <td class="px-4 py-3">{{ t.title }}</td>
            <td class="px-4 py-3">v{{ t.version }}</td>
            <td class="px-4 py-3">
              <span
                :class="t.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'"
                class="text-xs px-2 py-1 rounded-full font-medium"
              >
                {{ t.active ? 'Active' : 'Inactive' }}
              </span>
            </td>
            <td class="px-4 py-3 text-gray-500">{{ t._count.records }}</td>
            <td class="px-4 py-3 text-gray-500">
              {{ new Date(t.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) }}
            </td>
            <td class="px-4 py-3">
              <div class="flex gap-2">
                <button
                  v-if="!t.active"
                  :disabled="activating === t.id"
                  class="text-xs text-green-700 hover:underline disabled:opacity-50"
                  @click="activateTemplate(t.id)"
                >
                  {{ activating === t.id ? 'Activating...' : 'Activate' }}
                </button>
                <button
                  v-if="t._count.records === 0"
                  class="text-xs text-brand-blue-dark hover:underline"
                  @click="openEdit(t)"
                >
                  Edit
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
