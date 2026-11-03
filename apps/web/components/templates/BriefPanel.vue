<script setup lang="ts">
// Вкладка «Бриф»: шаблон вопросов агентства, копируется в бриф нового клиента.
import { initialBrief, newId } from '~/types/templates'

const { can } = useRole()
const notify = useNotify()
const questions = ref(initialBrief())
const list = ref<HTMLElement | null>(null)

function addQuestion() {
  questions.value.push({
    id: newId('q'),
    text: '',
    placeholder: 'Текст вопроса',
    optionsLabel: 'Вариант ответа',
    options: [{ id: newId('o'), value: '', placeholder: 'Вариант, если нужен выбор' }]
  })
  nextTick(() => list.value?.lastElementChild?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }))
}
</script>

<template>
  <div>
    <div class="mb-4 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
      <div class="min-w-0">
        <h2 class="text-sm font-semibold tracking-tight text-ink">Шаблон брифа агентства</h2>
        <p class="text-sm text-zinc-500 mt-1 max-w-2xl">Универсальный список вопросов. При создании нового клиента вопросы копируются в его персональный бриф. Редактирование здесь не меняет уже отправленные брифы клиентов.</p>
      </div>
      <AccessGate :allowed="can('brief.manage')">
        <UButton size="xs" class="rounded-full px-4 shrink-0" :disabled="!can('brief.manage')" @click="notify('Шаблон брифа сохранён')">Сохранить шаблон</UButton>
      </AccessGate>
    </div>
    <div ref="list" class="flex flex-col gap-4">
      <section v-for="(q, n) in questions" :key="q.id" class="bg-white rounded-2xl shadow-card p-4 lg:p-6">
        <h3 class="text-sm font-semibold tracking-tight mb-5">Вопрос {{ n + 1 }}</h3>
        <label class="block text-xs font-medium text-zinc-500 mb-2" :for="q.id">Формулировка</label>
        <UInput :id="q.id" v-model="q.text" size="md" :placeholder="q.placeholder" />
        <template v-if="q.options.length">
          <p class="text-xs text-zinc-500 mt-3 mb-2">{{ q.optionsLabel }}</p>
          <div class="space-y-2">
            <UInput v-for="o in q.options" :key="o.id" v-model="o.value" size="md" :placeholder="o.placeholder" :aria-label="q.optionsLabel" />
          </div>
        </template>
        <p v-else class="text-xs text-zinc-500 mt-3">{{ q.optionsLabel }}</p>
      </section>
    </div>
    <button type="button" class="w-full mt-4 px-4 py-3 rounded-2xl border border-dashed border-zinc-300 text-sm text-zinc-500 hover:text-zinc-900 hover:border-zinc-400 transition" @click="addQuestion">+ Добавить вопрос</button>
  </div>
</template>
