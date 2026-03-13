<template>
  <div>
    <Head>
      <title>Pricing - Pampered Pooch Porthcawl</title>
    </Head>

    <h1 class="text-3xl font-bold text-gray-800 mb-4 text-center">Pricing</h1>
    <p class="text-center text-gray-500 mb-8 max-w-xl mx-auto">
      Prices vary depending on breed, size, and coat condition. Please get in touch for an accurate quote.
    </p>

    <div class="max-w-3xl mx-auto">
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="border-b-2 border-gray-200">
              <th class="py-3 px-4 text-gray-700 font-semibold">Service</th>
              <th class="py-3 px-4 text-gray-700 font-semibold">Includes</th>
              <th class="py-3 px-4 text-gray-700 font-semibold text-right">Price Guide</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, i) in pricing" :key="item.service" :class="i % 2 === 0 ? 'bg-gray-50' : ''">
              <td class="py-3 px-4 font-medium text-gray-800">{{ item.service }}</td>
              <td class="py-3 px-4 text-gray-600">{{ item.includes }}</td>
              <td class="py-3 px-4 text-right text-gray-800 font-medium">{{ item.price }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <p class="text-sm text-gray-500 mt-4 text-center">
        Prices are a guide only. An exact quote will be provided after assessing your dog's breed, size and coat condition.
      </p>
    </div>

    <div class="text-center mt-10">
      <NuxtLink
        to="/contact"
        class="inline-block bg-brand-blue-dark text-white px-6 py-3 rounded hover:bg-brand-blue transition-colors font-medium"
      >
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
  },
  {
    service: 'Full Groom | Clip',
    includes: 'Wash, blow dry, full body clip, nails clipped, ears cleaned',
    price: 'From £35',
  },
  {
    service: 'De-Shed',
    includes: 'Wash, blow dry, de-shed, nails clipped, ears cleaned',
    price: 'From £30',
  },
  {
    service: 'Puppy Groom (per session)',
    includes: 'Progressive 3-session introduction to grooming',
    price: 'From £15',
  },
]
</script>
