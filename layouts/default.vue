<template>
  <div class="flex flex-col min-h-screen">
    <!-- Navbar -->
    <header>
      <nav class="bg-white border-b border-gray-200 shadow-sm">
        <div class="container mx-auto px-4 flex items-center justify-between h-14">
          <NuxtLink to="/" class="text-lg font-semibold text-gray-800 hover:text-brand-blue transition-colors">
            Pampered Pooch Porthcawl
          </NuxtLink>

          <!-- Mobile toggle -->
          <button
            class="md:hidden p-2 rounded text-gray-600 hover:bg-gray-100"
            aria-label="Toggle navigation"
            @click="mobileOpen = !mobileOpen"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path v-if="!mobileOpen" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
              <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <!-- Desktop nav -->
          <ul class="hidden md:flex items-center gap-6">
            <li v-for="link in navLinks" :key="link.to">
              <NuxtLink
                :to="link.to"
                class="text-gray-700 hover:text-brand-blue transition-colors"
                active-class="text-brand-blue font-medium"
              >
                {{ link.label }}
              </NuxtLink>
            </li>
          </ul>
        </div>

        <!-- Mobile nav -->
        <div v-if="mobileOpen" class="md:hidden border-t border-gray-200 bg-white">
          <ul class="flex flex-col py-2">
            <li v-for="link in navLinks" :key="link.to">
              <NuxtLink
                :to="link.to"
                class="block px-4 py-2 text-gray-700 hover:bg-gray-50 hover:text-brand-blue"
                active-class="text-brand-blue font-medium"
                @click="mobileOpen = false"
              >
                {{ link.label }}
              </NuxtLink>
            </li>
          </ul>
        </div>
      </nav>
    </header>

    <!-- Main content -->
    <main class="flex-1 container mx-auto px-4 py-8">
      <slot />
    </main>

    <!-- Footer -->
    <footer class="border-t border-gray-200 bg-white">
      <div class="container mx-auto px-4 py-4 text-sm text-gray-500 flex flex-col sm:flex-row justify-between items-center gap-2">
        <span>&copy; {{ new Date().getFullYear() }} Pampered Pooch Porthcawl</span>
        <NuxtLink to="/privacy" class="hover:text-brand-blue transition-colors">Privacy Policy</NuxtLink>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
const mobileOpen = ref(false)

const navLinks = [
  { to: '/', label: 'Home' },
  { to: '/services', label: 'Our Services' },
  { to: '/pricing', label: 'Pricing' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact Us' },
]
</script>
