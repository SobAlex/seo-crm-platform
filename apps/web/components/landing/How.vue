<script setup lang="ts">
// «Как это работает»: четыре боли агентства и чем кабинет их закрывает.
const PAINS = [
  { n: '01', title: 'Хаос в чатах', text: 'Переписка по задаче живёт в Telegram, а в отчёт попадает обрезок. Единый чат задачи делит обсуждение: внутренний комментарий остаётся в команде, заметка с отметкой «В отчёт» уходит клиенту.' },
  { n: '02', title: 'Спорные приёмки работ', text: '«Мы это уже сдавали» без следа в задаче. Воркфлоу фиксирует возврат: статус «На доработке», причина и комментарий остаются в ленте, исполнитель видит, что поправить.' },
  { n: '03', title: 'Рутина с отчётами в конце месяца', text: 'Сборка презентации из таблиц занимает день. Черновик отчёта собирается из принятых работ и графиков план/факт. Менеджер правит текст и отправляет клиенту за пару минут.' },
  { n: '04', title: 'Увольнения и отпуска', text: 'Проекты и приёмка не должны зависать на отсутствующем. Отпуск передаёт проекты замещающему в один клик и возвращает их после даты выхода.' }
]
</script>

<template>
  <section id="how" class="px-4 sm:px-6 py-16 scroll-mt-20">
    <div class="max-w-6xl mx-auto">
      <div class="max-w-2xl mb-8">
        <h2 class="text-3xl sm:text-4xl font-semibold tracking-tight">Как это работает</h2>
        <p class="mt-3 text-zinc-500">Четыре привычные боли агентства и то, чем кабинет их закрывает.</p>
      </div>
      <div class="grid sm:grid-cols-2 gap-3 lg:gap-4">
        <article v-for="p in PAINS" :key="p.n" class="bg-white rounded-3xl shadow-card p-5 sm:p-6">
          <div class="text-xs font-medium text-zinc-400">{{ p.n }}</div>
          <h3 class="mt-2 text-lg font-semibold tracking-tight">{{ p.title }}</h3>
          <p class="mt-2 text-sm text-zinc-500 leading-relaxed">{{ p.text }}</p>
        </article>
      </div>
    </div>
  </section>
</template>
