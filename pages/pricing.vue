<template>
  <div>
    <Head>
      <title>Pricing - Pampered Pooch Porthcawl</title>
    </Head>

    <div class="text-center mb-10">
      <h1 class="section-heading mb-3">Pricing</h1>
      <p class="section-subheading">
        Transparent guide prices. Final pricing depends on breed, size, coat condition, and the time needed.
      </p>
    </div>

    <div class="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-6">
      <div
        v-for="item in pricing"
        :key="item.service"
        class="card p-6 relative overflow-hidden"
        :class="{ 'ring-2 ring-brand-blue': item.popular }"
      >
        <div v-if="item.popular" class="absolute top-0 right-0 bg-brand-blue text-white text-xs font-semibold px-3 py-1 rounded-bl-lg">
          Most Popular
        </div>
        <div class="mb-4">
          <h2 class="text-lg font-semibold text-gray-900">{{ item.service }}</h2>
          <p class="text-sm text-gray-500 mt-1">{{ item.includes }}</p>
        </div>
        <div class="border-t border-gray-100 pt-4">
          <p class="text-2xl font-bold text-gray-900">{{ item.price }}</p>
          <p class="text-xs text-gray-400 mt-1">Guide price</p>
        </div>
      </div>
    </div>

    <p class="text-sm text-gray-400 mt-8 text-center max-w-xl mx-auto">
      Prices are a guide only. An exact quote will be provided after assessing your dog's breed, size and coat condition.
    </p>

    <div class="text-center mt-10">
      <NuxtLink to="/contact" class="btn-primary">
        Get a Quote
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
const pricing = [
  {
    service: 'Wash',
    includes: 'Wash, blow dry, nails clipped, ears cleaned',
    price: 'From £20',
    popular: false,
  },
  {
    service: 'Full Groom | Clip',
    includes: 'Wash, blow dry, full body clip, nails clipped, ears cleaned',
    price: 'From £35',
    popular: true,
  },
  {
    service: 'De-Shed',
    includes: 'Wash, blow dry, de-shed, nails clipped, ears cleaned',
    price: 'From £30',
    popular: false,
  },
  {
    service: 'Puppy Groom (per session)',
    includes: 'Progressive 3-session introduction to grooming',
    price: 'From £15',
    popular: false,
  },
]
</script>
