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
  <div class="max-w-5xl mx-auto mt-8 px-4 sm:px-6">
    <Head>
      <title>Consent Templates - Admin - Pampered Pooch Porthcawl</title>
    </Head>

    <!-- Header -->
    <div class="mb-8">
      <NuxtLink
        to="/admin"
        class="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-brand-blue-dark transition-colors mb-4"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back to Appointments
      </NuxtLink>
      <div class="flex justify-between items-center">
        <h1 class="text-2xl font-bold text-gray-900">Consent Templates</h1>
        <button
          class="btn-primary btn-sm"
          @click="openCreate"
        >
          <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          New Template
        </button>
      </div>
    </div>

    <!-- Form -->
    <div v-if="showForm" class="card p-6 md:p-8 mb-8">
      <h2 class="text-xl font-bold text-gray-900 mb-6">{{ editing ? 'Edit Template' : 'New Template' }}</h2>

      <div v-if="error" class="alert-error mb-6" role="alert">
        <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
        {{ error }}
      </div>

      <div class="space-y-5">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1.5">Title</label>
          <input
            v-model="form.title"
            type="text"
            placeholder="e.g. Terms & Conditions"
            class="input-field"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1.5">Body (terms text)</label>
          <textarea
            v-model="form.body"
            rows="8"
            placeholder="Enter the full terms and conditions text..."
            class="input-field"
          ></textarea>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1.5">Structured Questions (JSON, optional)</label>
          <textarea
            v-model="form.questions"
            rows="4"
            placeholder='e.g. [{"question": "Is your dog up to date on vaccinations?", "type": "yes_no"}]'
            class="input-field font-mono"
          ></textarea>
        </div>
      </div>

      <div class="flex items-center gap-3 mt-6">
        <button
          :disabled="saving"
          class="btn-primary disabled:opacity-50"
          @click="saveTemplate"
        >
          {{ saving ? 'Saving...' : (editing ? 'Update' : 'Create') }}
        </button>
        <button class="btn-secondary btn-sm" @click="cancelForm">Cancel</button>
      </div>
    </div>

    <!-- Empty state -->
    <div v-if="templates.length === 0 && !showForm" class="card p-12 text-center">
      <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
      <p class="text-gray-500 font-medium mb-1">No consent templates yet</p>
      <p class="text-gray-400 text-sm mb-6">Create your first template to require consent during booking.</p>
      <button
        class="btn-primary"
        @click="openCreate"
      >
        Create First Template
      </button>
    </div>

    <!-- Templates table -->
    <div v-else-if="templates.length > 0" class="card overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-gray-50/80 border-b border-gray-200">
              <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Title</th>
              <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Version</th>
              <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
              <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Records</th>
              <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Created</th>
              <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-for="t in templates" :key="t.id" class="hover:bg-gray-50/50 transition-colors duration-150">
              <td class="px-4 py-4 font-medium text-gray-900">{{ t.title }}</td>
              <td class="px-4 py-4 text-gray-500">v{{ t.version }}</td>
              <td class="px-4 py-4">
                <span
                  :class="t.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'"
                  class="badge"
                >
                  {{ t.active ? 'Active' : 'Inactive' }}
                </span>
              </td>
              <td class="px-4 py-4 text-gray-500">{{ t._count.records }}</td>
              <td class="px-4 py-4 text-gray-500">
                {{ new Date(t.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) }}
              </td>
              <td class="px-4 py-4">
                <div class="flex gap-2">
                  <button
                    v-if="!t.active"
                    :disabled="activating === t.id"
                    class="btn-sm inline-flex items-center text-xs bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 rounded-lg px-3 py-1.5 font-medium transition-colors disabled:opacity-50"
                    @click="activateTemplate(t.id)"
                  >
                    {{ activating === t.id ? 'Activating...' : 'Activate' }}
                  </button>
                  <button
                    v-if="t._count.records === 0"
                    class="btn-secondary btn-sm text-xs"
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
  </div>
</template>
