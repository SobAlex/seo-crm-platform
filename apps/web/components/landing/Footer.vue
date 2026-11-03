<script setup lang="ts">
// Подвал сайта: о продукте, якоря, ссылки в демо-кабинет и портал, контакты.
defineEmits<{ demo: [] }>()

const PRODUCT = [
  { href: '#features', label: 'Возможности' },
  { href: '#how', label: 'Как это работает' },
  { href: '#pricing', label: 'Тарифы' },
  { href: '#faq', label: 'FAQ' }
]
</script>

<template>
  <footer class="border-t border-black/5 px-4 sm:px-6 py-12">
    <div class="max-w-6xl mx-auto grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
      <div>
        <div class="flex items-center gap-2.5">
          <span class="w-8 h-8 rounded-xl bg-zinc-900 text-white text-sm font-semibold flex items-center justify-center">S</span>
          <span class="text-sm font-semibold tracking-tight">SEO Control</span>
        </div>
        <p class="mt-3 text-sm text-zinc-500">Кабинет для SEO-агентства: проекты, приёмка, отчёты и нагрузка команды.</p>
      </div>
      <div>
        <div class="text-xs font-medium text-zinc-400 mb-3">Продукт</div>
        <ul class="space-y-2 text-sm">
          <li v-for="item in PRODUCT" :key="item.href"><a :href="item.href" class="text-zinc-600 hover:text-zinc-900">{{ item.label }}</a></li>
        </ul>
      </div>
      <div>
        <div class="text-xs font-medium text-zinc-400 mb-3">Кабинет</div>
        <ul class="space-y-2 text-sm">
          <li><NuxtLink to="/" class="text-zinc-600 hover:text-zinc-900">Демо-кабинет</NuxtLink></li>
          <li><NuxtLink to="/portal" class="text-zinc-600 hover:text-zinc-900">Портал клиента</NuxtLink></li>
          <li><button type="button" class="text-zinc-600 hover:text-zinc-900" @click="$emit('demo')">Интерактивное демо</button></li>
        </ul>
      </div>
      <div>
        <div class="text-xs font-medium text-zinc-400 mb-3">Контакты</div>
        <ul class="space-y-2 text-sm text-zinc-600">
          <li><a href="mailto:hello@seo-control.app" class="hover:text-zinc-900">hello@seo-control.app</a></li>
          <li>+7 495 120-00-26</li>
          <li class="inline-flex items-center gap-1.5"><span class="w-1.5 h-1.5 rounded-full bg-emerald-500" />Все системы работают</li>
        </ul>
      </div>
    </div>
    <div class="max-w-6xl mx-auto mt-10 pt-6 border-t border-black/5 text-xs text-zinc-400">© 2026 SEO Control</div>
  </footer>
</template>
