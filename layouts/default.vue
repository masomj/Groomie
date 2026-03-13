<template>
  <div class="flex flex-col min-h-screen">
    <!-- Navbar -->
    <header class="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200/80 shadow-soft">
      <nav aria-label="Main navigation">
        <div class="container mx-auto px-4 flex items-center justify-between h-16">
          <NuxtLink to="/" class="flex items-center gap-2 text-lg font-bold text-gray-900 hover:text-brand-blue transition-colors">
            <!-- Paw icon -->
            <svg class="w-7 h-7 text-brand-blue" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 18.5c-1.5 1.5-4 2-5.5.5s-1-4 .5-5.5c1.2-1.2 3.2-2 5-2s3.8.8 5 2c1.5 1.5 2 4 .5 5.5s-4 1-5.5-.5z"/>
              <circle cx="7" cy="8" r="2.2"/>
              <circle cx="17" cy="8" r="2.2"/>
              <circle cx="4.5" cy="13" r="1.8"/>
              <circle cx="19.5" cy="13" r="1.8"/>
            </svg>
            Pampered Pooch
          </NuxtLink>

          <!-- Mobile toggle -->
          <button
            class="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
            :aria-label="mobileOpen ? 'Close navigation menu' : 'Open navigation menu'"
            :aria-expanded="mobileOpen"
            aria-controls="mobile-nav"
            @click="mobileOpen = !mobileOpen"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path v-if="!mobileOpen" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
              <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <!-- Desktop nav -->
          <ul class="hidden md:flex items-center gap-1">
            <li v-for="link in navLinks" :key="link.to">
              <NuxtLink
                :to="link.to"
                class="px-3 py-2 rounded-lg text-gray-600 hover:text-brand-blue hover:bg-blue-50 transition-all duration-200 text-sm font-medium"
                active-class="text-brand-blue bg-blue-50"
              >
                {{ link.label }}
              </NuxtLink>
            </li>
            <li v-if="!user" class="flex gap-2 ml-3">
              <NuxtLink to="/login" class="text-sm text-gray-600 hover:text-brand-blue px-3 py-2 rounded-lg transition-colors font-medium">
                Log in
              </NuxtLink>
              <NuxtLink to="/register" class="text-sm bg-brand-blue-dark text-white px-4 py-2 rounded-lg hover:bg-brand-blue transition-colors font-medium shadow-soft">
                Register
              </NuxtLink>
            </li>
            <li v-else class="flex gap-2 ml-3 items-center">
              <NuxtLink
                :to="user.role === 'ADMIN' ? '/admin' : '/dashboard'"
                class="text-sm text-brand-blue-dark hover:text-brand-blue font-medium px-3 py-2 rounded-lg hover:bg-blue-50 transition-all"
              >
                {{ user.role === 'ADMIN' ? 'Admin' : 'Dashboard' }}
              </NuxtLink>
              <button
                class="text-sm text-gray-500 hover:text-red-600 px-3 py-2 rounded-lg hover:bg-red-50 transition-all"
                @click="logout"
              >
                Log out
              </button>
            </li>
          </ul>
        </div>

        <!-- Mobile nav -->
        <Transition
          enter-active-class="transition-all duration-300 ease-out"
          enter-from-class="opacity-0 -translate-y-2"
          enter-to-class="opacity-100 translate-y-0"
          leave-active-class="transition-all duration-200 ease-in"
          leave-from-class="opacity-100 translate-y-0"
          leave-to-class="opacity-0 -translate-y-2"
        >
          <div v-if="mobileOpen" id="mobile-nav" class="md:hidden border-t border-gray-200/80 bg-white/95 backdrop-blur-md">
            <ul class="flex flex-col py-3 px-2">
              <li v-for="link in navLinks" :key="link.to">
                <NuxtLink
                  :to="link.to"
                  class="block px-4 py-2.5 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-brand-blue transition-all font-medium"
                  active-class="text-brand-blue bg-blue-50"
                  @click="mobileOpen = false"
                >
                  {{ link.label }}
                </NuxtLink>
              </li>
              <li v-if="!user" class="border-t border-gray-100 mt-2 pt-2 space-y-1">
                <NuxtLink to="/login" class="block px-4 py-2.5 rounded-lg text-brand-blue font-medium hover:bg-blue-50" @click="mobileOpen = false">
                  Log in
                </NuxtLink>
                <NuxtLink to="/register" class="block px-4 py-2.5 rounded-lg text-brand-blue font-medium hover:bg-blue-50" @click="mobileOpen = false">
                  Register
                </NuxtLink>
              </li>
              <li v-else class="border-t border-gray-100 mt-2 pt-2 space-y-1">
                <NuxtLink
                  :to="user.role === 'ADMIN' ? '/admin' : '/dashboard'"
                  class="block px-4 py-2.5 rounded-lg text-brand-blue font-medium hover:bg-blue-50"
                  @click="mobileOpen = false"
                >
                  {{ user.role === 'ADMIN' ? 'Admin' : 'Dashboard' }}
                </NuxtLink>
                <button
                  class="block w-full text-left px-4 py-2.5 rounded-lg text-red-600 font-medium hover:bg-red-50"
                  @click="logout"
                >
                  Log out
                </button>
              </li>
            </ul>
          </div>
        </Transition>
      </nav>
    </header>

    <!-- Main content -->
    <main id="main-content" class="flex-1">
      <div class="container mx-auto px-4 py-10">
        <slot />
      </div>
    </main>

    <!-- Footer -->
    <footer class="bg-gray-900 text-gray-300">
      <div class="container mx-auto px-4 py-12">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <!-- Brand -->
          <div>
            <div class="flex items-center gap-2 mb-3">
              <svg class="w-6 h-6 text-brand-blue" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 18.5c-1.5 1.5-4 2-5.5.5s-1-4 .5-5.5c1.2-1.2 3.2-2 5-2s3.8.8 5 2c1.5 1.5 2 4 .5 5.5s-4 1-5.5-.5z"/>
                <circle cx="7" cy="8" r="2.2"/>
                <circle cx="17" cy="8" r="2.2"/>
                <circle cx="4.5" cy="13" r="1.8"/>
                <circle cx="19.5" cy="13" r="1.8"/>
              </svg>
              <span class="text-white font-bold">Pampered Pooch Porthcawl</span>
            </div>
            <p class="text-sm text-gray-400 leading-relaxed">
              Professional dog grooming in Porthcawl, South Wales. Fully qualified with a Level 5 Diploma in Veterinary Nursing.
            </p>
          </div>

          <!-- Quick links -->
          <div>
            <h3 class="text-white font-semibold mb-3 text-sm uppercase tracking-wider">Quick Links</h3>
            <ul class="space-y-2">
              <li v-for="link in navLinks" :key="link.to">
                <NuxtLink :to="link.to" class="text-sm text-gray-400 hover:text-white transition-colors">
                  {{ link.label }}
                </NuxtLink>
              </li>
            </ul>
          </div>

          <!-- Contact -->
          <div>
            <h3 class="text-white font-semibold mb-3 text-sm uppercase tracking-wider">Get in Touch</h3>
            <ul class="space-y-2 text-sm text-gray-400">
              <li class="flex items-center gap-2">
                <svg class="w-4 h-4 text-gray-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
                Porthcawl, South Wales
              </li>
              <li class="flex items-center gap-2">
                <svg class="w-4 h-4 text-gray-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                </svg>
                <a href="mailto:hello@pamperedpoochporthcawl.co.uk" class="hover:text-white transition-colors">
                  hello@pamperedpoochporthcawl.co.uk
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div class="border-t border-gray-800 mt-10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3">
          <span class="text-sm text-gray-500">&copy; {{ new Date().getFullYear() }} Pampered Pooch Porthcawl. All rights reserved.</span>
          <div class="flex items-center gap-4">
            <NuxtLink to="/privacy" class="text-sm text-gray-500 hover:text-white transition-colors">Privacy Policy</NuxtLink>
            <NuxtLink to="/cookie-preferences" class="text-sm text-gray-500 hover:text-white transition-colors">Cookie Preferences</NuxtLink>
          </div>
        </div>
      </div>
    </footer>

    <CookieBanner />
  </div>
</template>

<script setup lang="ts">
const mobileOpen = ref(false)
const { user, logout } = useAuth()

const navLinks = [
  { to: '/', label: 'Home' },
  { to: '/services', label: 'Our Services' },
  { to: '/pricing', label: 'Pricing' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact Us' },
]
</script>
