<template>
  <div>
    <Head>
      <title>Privacy Policy - Pampered Pooch Porthcawl</title>
    </Head>

    <div class="text-center mb-10">
      <h1 class="section-heading mb-3">Privacy Policy</h1>
      <p class="section-subheading">A plain-English summary of what data this website stores and why.</p>
    </div>

    <div class="max-w-3xl mx-auto">
      <div class="card p-8 text-gray-600 leading-relaxed space-y-6">
        <section>
          <h2 class="text-lg font-semibold text-gray-900 mb-2">What we collect</h2>
          <ul class="list-disc pl-5 space-y-1">
            <li>Account details you provide (name, email, password hash, optional phone).</li>
            <li>Dog profiles you create (for example name, breed, age, notes).</li>
            <li>Booking and appointment details.</li>
            <li>Contact form submissions.</li>
            <li>Payment status and references from Stripe for paid bookings.</li>
          </ul>
        </section>

        <section>
          <h2 class="text-lg font-semibold text-gray-900 mb-2">How we use this data</h2>
          <ul class="list-disc pl-5 space-y-1">
            <li>To provide accounts, bookings, and customer/admin dashboards.</li>
            <li>To manage appointments and dog care information.</li>
            <li>To process and reconcile payments.</li>
            <li>To send service emails such as payment confirmations and password reset links.</li>
          </ul>
        </section>

        <section>
          <h2 class="text-lg font-semibold text-gray-900 mb-2">Authentication and sessions</h2>
          <p>
            This site uses a secure, HTTP-only session cookie to keep users signed in.
            Password reset links are single-use and expire automatically.
          </p>
        </section>

        <section>
          <h2 class="text-lg font-semibold text-gray-900 mb-2">Payments</h2>
          <p>
            Payments are handled through Stripe. We store payment metadata required for booking and invoice records,
            but we do not store full card details on this site.
          </p>
        </section>

        <section>
          <h2 class="text-lg font-semibold text-gray-900 mb-2">Cookies</h2>
          <p>
            You can manage analytics cookie consent at any time on the
            <NuxtLink to="/cookie-preferences" class="text-brand-blue font-medium hover:underline">cookie preferences page</NuxtLink>.
          </p>
        </section>

        <section>
          <h2 class="text-lg font-semibold text-gray-900 mb-2">Need help?</h2>
          <p>
            If you have any questions about data handling, please
            <NuxtLink to="/contact" class="text-brand-blue font-medium hover:underline">contact us</NuxtLink>.
          </p>
        </section>
      </div>
    </div>
  </div>
</template>
