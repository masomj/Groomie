<template>
  <div>
    <Head>
      <title>Pampered Pooch Porthcawl - Professional Dog Grooming</title>
    </Head>

    <!-- Hero section -->
    <section class="-mx-4 -mt-10 px-4 pt-20 pb-16 bg-gradient-to-br from-brand-blue-dark via-brand-blue to-blue-400 text-white relative overflow-hidden">
      <!-- Decorative shapes -->
      <div class="absolute inset-0 opacity-10" aria-hidden="true">
        <div class="absolute top-10 left-10 w-64 h-64 bg-white rounded-full blur-3xl"></div>
        <div class="absolute bottom-10 right-10 w-96 h-96 bg-white rounded-full blur-3xl"></div>
      </div>

      <div class="relative max-w-3xl mx-auto text-center animate-fade-in-up">
        <div class="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm text-sm font-medium px-4 py-1.5 rounded-full mb-6">
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 18.5c-1.5 1.5-4 2-5.5.5s-1-4 .5-5.5c1.2-1.2 3.2-2 5-2s3.8.8 5 2c1.5 1.5 2 4 .5 5.5s-4 1-5.5-.5z"/>
            <circle cx="7" cy="8" r="2.2"/>
            <circle cx="17" cy="8" r="2.2"/>
            <circle cx="4.5" cy="13" r="1.8"/>
            <circle cx="19.5" cy="13" r="1.8"/>
          </svg>
          Porthcawl, South Wales
        </div>
        <h1 class="text-4xl md:text-5xl font-extrabold mb-6 leading-tight tracking-tight">
          Welcome to<br>Pampered Pooch Porthcawl
        </h1>
        <p class="text-lg md:text-xl text-blue-100 max-w-2xl mx-auto leading-relaxed mb-8">
          Fully qualified with a Level 5 Diploma in Veterinary Nursing, I provide one-to-one grooming in a calm, relaxed environment. Your pup is in good hands.
        </p>
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <NuxtLink
            to="/contact"
            class="inline-flex items-center justify-center bg-white text-brand-blue-dark px-8 py-3.5 rounded-lg hover:bg-blue-50 transition-all font-semibold shadow-card text-lg"
          >
            Book a Groom
          </NuxtLink>
          <NuxtLink
            to="/services"
            class="inline-flex items-center justify-center border-2 border-white/40 text-white px-8 py-3.5 rounded-lg hover:bg-white/10 transition-all font-semibold text-lg"
          >
            View Services
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- Trust indicators -->
    <section class="-mx-4 px-4 py-12 bg-white border-b border-gray-100">
      <div class="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
        <div class="flex flex-col items-center gap-3">
          <div class="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center text-brand-blue">
            <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
            </svg>
          </div>
          <div>
            <p class="font-semibold text-gray-900">Fully Qualified</p>
            <p class="text-sm text-gray-500">Level 5 Veterinary Nursing Diploma</p>
          </div>
        </div>
        <div class="flex flex-col items-center gap-3">
          <div class="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center text-brand-blue">
            <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
            </svg>
          </div>
          <div>
            <p class="font-semibold text-gray-900">One-to-One Care</p>
            <p class="text-sm text-gray-500">Individual attention for every dog</p>
          </div>
        </div>
        <div class="flex flex-col items-center gap-3">
          <div class="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center text-brand-blue">
            <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
            </svg>
          </div>
          <div>
            <p class="font-semibold text-gray-900">Calm Environment</p>
            <p class="text-sm text-gray-500">Stress-free grooming experience</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Services overview -->
    <section class="page-section">
      <div class="text-center mb-10">
        <h2 class="section-heading mb-3">Our Services</h2>
        <p class="section-subheading">From a simple wash to a full groom, we've got your pup covered.</p>
      </div>

      <div class="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        <ServiceCard
          v-for="service in services"
          :key="service.title"
          :title="service.title"
          :description="service.description"
        >
          <template #icon>
            <!-- eslint-disable-next-line vue/no-v-html -->
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true" v-html="service.icon" />
          </template>
        </ServiceCard>
      </div>

      <div class="text-center mt-10">
        <NuxtLink
          to="/pricing"
          class="inline-flex items-center gap-2 text-brand-blue hover:text-brand-blue-dark transition-colors font-semibold group"
        >
          View full pricing
          <svg class="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
          </svg>
        </NuxtLink>
      </div>
    </section>

    <!-- Bottom CTA -->
    <section class="-mx-4 px-4 py-16 bg-gradient-to-r from-brand-blue-dark to-brand-blue text-white text-center">
      <div class="max-w-2xl mx-auto">
        <h2 class="text-2xl md:text-3xl font-bold mb-4">Ready to Pamper Your Pooch?</h2>
        <p class="text-blue-100 mb-8">Get in touch today to book an appointment or ask any questions.</p>
        <NuxtLink
          to="/contact"
          class="inline-flex items-center justify-center bg-white text-brand-blue-dark px-8 py-3.5 rounded-lg hover:bg-blue-50 transition-all font-semibold shadow-card text-lg"
        >
          Contact Us
        </NuxtLink>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
const services = [
  {
    title: 'Wash',
    description: 'Your dog will have a wash, blow dry, nails clipped and ears cleaned.',
    icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>',
  },
  {
    title: 'Full Groom | Clip',
    description: 'Your dog will have a wash, blow dry, full body clip to your specification, nails clipped and ears cleaned.',
    icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z"/>',
  },
  {
    title: 'De-Shed',
    description: 'Removes dead undercoat to reduce shedding, leaving the coat healthy and shiny. Includes wash, blow dry, de-shed, nails clipped and ears cleaned.',
    icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/>',
  },
  {
    title: 'Puppy Grooms',
    description: 'A gentle 3-session introduction to grooming. We slowly expose your puppy to grooming tools in a calm, one-to-one environment.',
    icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>',
  },
]
</script>
