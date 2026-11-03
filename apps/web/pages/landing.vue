<script setup lang="ts">
// landing.html → сайт продукта без каркаса кабинета: шапка, оффер, боли, тур по экранам, тарифы, FAQ, подвал.
definePageMeta({ layout: 'auth' })
useHead({
  title: 'SEO Control — операционная система для SEO-агентств',
  meta: [{ name: 'description', content: 'Дорожные карты, приёмка задач, отчёты клиенту и загрузка команды в одном кабинете.' }]
})

const signupOpen = ref(false)
const signupPlan = ref<string>()
const demoOpen = ref(false)

function openSignup(plan?: string) {
  demoOpen.value = false
  signupPlan.value = plan
  signupOpen.value = true
}
function openDemo() {
  signupOpen.value = false
  demoOpen.value = true
}
</script>

<template>
  <div>
    <LandingHeader @signup="openSignup()" />
    <main>
      <LandingHero @signup="openSignup()" @demo="openDemo" />
      <LandingHow />
      <LandingTour />
      <LandingPricing @signup="openSignup" />
      <LandingFaq />
    </main>
    <LandingFooter @demo="openDemo" />

    <LandingSignupModal v-model="signupOpen" :plan="signupPlan" />
    <LandingDemoModal v-model="demoOpen" />
  </div>
</template>
