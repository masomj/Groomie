<template>
  <div class="card-hover p-6 flex flex-col items-start gap-3">
    <div class="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-brand-blue">
      <slot name="icon">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
      </slot>
    </div>
    <h3 class="text-lg font-semibold text-gray-900">{{ title }}</h3>
    <p class="text-gray-500 text-sm leading-relaxed">{{ description }}</p>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string
  description: string
}>()
</script>
