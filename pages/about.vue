<template>
  <div>
    <Head>
      <title>About - Pampered Pooch Porthcawl</title>
    </Head>

    <div class="text-center mb-10">
      <h1 class="section-heading mb-3">About</h1>
      <p class="section-subheading">Calm, one-to-one dog grooming with a professional, practical approach.</p>
    </div>

    <div class="max-w-3xl mx-auto">
      <div class="card p-8 mb-10">
        <div class="space-y-5 text-gray-600 leading-relaxed">
          <p>
            At Pampered Pooch Porthcawl, I am fully qualified and have spent most of my professional life
            working around animals. I have experience in veterinary practices and other grooming settings,
            and hold a <strong class="text-gray-900">Level 5 Diploma in Veterinary Nursing</strong>.
          </p>

          <p>
            I usually work with your dog on a <strong class="text-gray-900">one-to-one basis</strong>, unless you request otherwise.
            This allows your dog to feel comfortable and relaxed in a calm environment.
          </p>

          <p>
            Whether your dog needs a simple wash or a full groom, I treat every dog as if they were my own.
            My goal is to make grooming a positive and stress-free experience for your furry friend.
          </p>
        </div>
      </div>

      <!-- Why choose us -->
      <h2 class="text-2xl font-bold text-gray-900 text-center mb-8">Why Choose Pampered Pooch?</h2>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <div v-for="item in reasons" :key="item.title" class="card-hover p-5 text-center">
          <div class="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-brand-blue mx-auto mb-3">
            <!-- eslint-disable-next-line vue/no-v-html -->
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true" v-html="item.icon" />
          </div>
          <h3 class="font-semibold text-gray-900 mb-1">{{ item.title }}</h3>
          <p class="text-sm text-gray-500">{{ item.desc }}</p>
        </div>
      </div>
    </div>

    <div class="text-center mt-12">
      <NuxtLink to="/contact" class="btn-primary">
        Get in Touch
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
const reasons = [
  {
    title: 'Fully Qualified',
    desc: 'Level 5 Diploma in Veterinary Nursing',
    icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>',
  },
  {
    title: 'One-to-One',
    desc: "Individual grooming for your dog's comfort",
    icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>',
  },
  {
    title: 'Calm Environment',
    desc: 'Relaxing, stress-free space for your pup',
    icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>',
  },
  {
    title: 'All Breeds Welcome',
    desc: 'Experienced with all breeds and temperaments',
    icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>',
  },
  {
    title: 'Puppy Programme',
    desc: 'Gentle 3-session introduction for puppies',
    icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>',
  },
]
</script>
