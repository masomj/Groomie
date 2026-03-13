<template>
  <div>
    <Head>
      <title>Pampered Pooch Porthcawl - Professional Dog Grooming</title>
    </Head>

    <!-- Hero / About intro -->
    <section class="text-center mb-12">
      <h1 class="text-3xl font-bold text-gray-800 mb-4">Welcome to Pampered Pooch Porthcawl</h1>
      <p class="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
        At Pampered Pooch, I am fully qualified and have spent most of my professional life around animals.
        Having worked in vets, other groomers and achieved a Level 5 Diploma in Veterinary Nursing,
        your pup is in good hands here with me.
      </p>
      <p class="text-gray-600 mt-4 max-w-2xl mx-auto">
        I usually work with your dog on a one-to-one basis, unless you request otherwise.
        This allows your dog to feel comfortable and relaxed in a calm environment.
      </p>
      <div class="mt-6 flex flex-col sm:flex-row gap-4 justify-center">
        <NuxtLink
          to="/contact"
          class="inline-block bg-brand-blue-dark text-white px-6 py-3 rounded hover:bg-brand-blue transition-colors font-medium"
        >
          Book a Groom
        </NuxtLink>
        <NuxtLink
          to="/services"
          class="inline-block border border-brand-blue-dark text-brand-blue-dark px-6 py-3 rounded hover:bg-brand-blue-dark hover:text-white transition-colors font-medium"
        >
          View Services
        </NuxtLink>
      </div>
    </section>

    <!-- Services overview -->
    <section>
      <h2 class="text-2xl font-bold text-center text-gray-800 mb-8">Our Services</h2>

      <div class="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        <ServiceCard
          v-for="service in services"
          :key="service.title"
          :title="service.title"
          :description="service.description"
        />
      </div>

      <div class="text-center mt-8">
        <NuxtLink
          to="/pricing"
          class="text-brand-blue hover:text-brand-blue-dark transition-colors font-medium underline"
        >
          View full pricing &rarr;
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
  },
  {
    title: 'Full Groom | Clip',
    description: 'Your dog will have a wash, blow dry, full body clip to your specification, nails clipped and ears cleaned.',
  },
  {
    title: 'De-Shed',
    description: 'Removes dead undercoat to reduce shedding, leaving the coat healthy and shiny. Includes wash, blow dry, de-shed, nails clipped and ears cleaned.',
  },
  {
    title: 'Puppy Grooms',
    description: 'A gentle 3-session introduction to grooming. We slowly expose your puppy to grooming tools in a calm, one-to-one environment.',
  },
]
</script>
