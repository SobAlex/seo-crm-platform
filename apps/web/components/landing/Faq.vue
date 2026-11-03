<script setup lang="ts">
// «Частые вопросы»: аккордеон, открыт не больше одного ответа.
const FAQ = [
  { q: 'Нужно ли привязывать карту для триала?', a: 'Нет. 14 дней открываются по рабочей почте, без карты и счёта. За три дня до конца напишем, хотите ли вы продолжить.' },
  { q: 'Как перенести проекты из других систем?', a: 'Клиентов, проекты и задачи можно загрузить таблицей. На тарифе «Про» в первую неделю перенос делает наша команда: карта, открытые задачи и доступы к Метрике.' },
  { q: 'Видят ли клиенты внутреннюю переписку?', a: 'Строго скрыто. В портал и в PDF попадает только текст с отметкой «В отчёт». Часы, ставки, внутренние комментарии и фамилии подрядчиков клиенту не показываются.' }
]

const open = ref<number | null>(null)
</script>

<template>
  <section id="faq" class="px-4 sm:px-6 py-8 pb-20 scroll-mt-20">
    <div class="max-w-3xl mx-auto">
      <h2 class="text-3xl sm:text-4xl font-semibold tracking-tight mb-6">Частые вопросы</h2>
      <div class="bg-white rounded-3xl shadow-card divide-y divide-zinc-100">
        <div v-for="(item, i) in FAQ" :key="item.q">
          <button type="button" :aria-expanded="open === i" class="w-full flex items-center justify-between gap-4 px-5 py-4 text-left text-sm font-medium" @click="open = open === i ? null : i">
            {{ item.q }}
            <svg class="w-4 h-4 text-zinc-400 shrink-0 transition" :class="open === i && 'rotate-180'" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg>
          </button>
          <div v-show="open === i" class="px-5 pb-4 text-sm text-zinc-500 leading-relaxed">{{ item.a }}</div>
        </div>
      </div>
    </div>
  </section>
</template>
