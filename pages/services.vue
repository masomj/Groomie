<template>
  <div>
    <Head>
      <title>Our Services - Pampered Pooch Porthcawl</title>
    </Head>

    <div class="text-center mb-10">
      <h1 class="section-heading mb-3">Our Services</h1>
      <p class="section-subheading">Everything your dog needs to look and feel their best.</p>
    </div>

    <div class="max-w-3xl mx-auto space-y-6">
      <!-- Wash -->
      <div class="card p-6 border-l-4 border-l-brand-blue">
        <div class="flex items-start gap-4">
          <div class="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-brand-blue shrink-0">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
            </svg>
          </div>
          <div>
            <h2 class="text-xl font-semibold text-gray-900 mb-2">Wash</h2>
            <p class="text-gray-500 leading-relaxed">
              Provided in this service, your dog will have a
              <strong class="text-gray-700">wash, blow dry, nails clipped and ears cleaned</strong>.
            </p>
          </div>
        </div>
      </div>

      <!-- Full Groom | Clip -->
      <div class="card p-6 border-l-4 border-l-brand-blue">
        <div class="flex items-start gap-4">
          <div class="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-brand-blue shrink-0">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z"/>
            </svg>
          </div>
          <div>
            <h2 class="text-xl font-semibold text-gray-900 mb-2">Full Groom | Clip</h2>
            <p class="text-gray-500 leading-relaxed">
              Provided in this service, your dog will have a
              <strong class="text-gray-700">wash, blow dry, full body clip to your specification, nails clipped and ears cleaned</strong>.
            </p>
          </div>
        </div>
      </div>

      <!-- De-Shed -->
      <div class="card p-6 border-l-4 border-l-brand-blue">
        <div class="flex items-start gap-4">
          <div class="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-brand-blue shrink-0">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/>
            </svg>
          </div>
          <div>
            <h2 class="text-xl font-semibold text-gray-900 mb-2">De-Shed</h2>
            <p class="text-gray-500 leading-relaxed mb-2">
              A de-shed removes dead undercoat, to help reduce shedding and leaves the coat in a healthy
              and shiny condition. A de-shed will also enable your dog to better regulate their temperature.
            </p>
            <p class="text-gray-500">
              Provided in this service your dog will have a
              <strong class="text-gray-700">wash, blow dry, de-shed, nails clipped and ears cleaned</strong>.
            </p>
          </div>
        </div>
      </div>

      <!-- Puppy Grooms -->
      <div class="card p-6 border-l-4 border-l-accent-gold">
        <div class="flex items-start gap-4">
          <div class="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-accent-gold shrink-0">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
            </svg>
          </div>
          <div>
            <h2 class="text-xl font-semibold text-gray-900 mb-2">Puppy Grooms</h2>
            <p class="text-gray-500 leading-relaxed mb-4">
              All our grooms are one to one, which ensures your furbaby is in the most comfortable
              environment possible. We will slowly expose your puppy to grooming tools, such as the
              hair clippers and dryers over 3 sessions.
            </p>
            <div class="space-y-3">
              <div class="bg-amber-50/50 rounded-lg p-4 border border-amber-100">
                <p class="font-medium text-gray-800 text-sm">Sessions 1 &amp; 2</p>
                <p class="text-gray-500 mt-1 text-sm">
                  Your dog will be exposed to the
                  <strong class="text-gray-700">bathing and drying process. They will have a full brush and comb, ears cleaned and nails clipped</strong>.
                </p>
              </div>
              <div class="bg-amber-50/50 rounded-lg p-4 border border-amber-100">
                <p class="font-medium text-gray-800 text-sm">Session 3</p>
                <p class="text-gray-500 mt-1 text-sm">
                  Your dog will be exposed to
                  <strong class="text-gray-700">hand scissoring of their legs, face and tail</strong>.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="text-center mt-12">
      <NuxtLink to="/contact" class="btn-primary">
        Book a Groom
      </NuxtLink>
    </div>
  </div>
</template>
