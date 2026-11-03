<script setup lang="ts">
// Окно «Демо-тур» (#demo-modal прототипа): четыре шага с точками, на последнем — переход в демо-кабинет.
const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()

const STEPS = [
  { title: 'Дорожная карта', text: 'Шаблон типа проекта становится картой. Месяц 1 уже разложен на работы с часами и ролями.' },
  { title: 'Приёмка', text: 'Задача на проверке принимается или возвращается с комментарием. Статус «На доработке» виден исполнителю.' },
  { title: 'Портал клиента', text: 'Клиент смотрит результаты и скачивает отчёт. Внутренняя переписка, часы и ставки ему закрыты.' },
  { title: 'Нагрузка команды', text: 'У каждого сотрудника норма часов. Отпуск передаёт проекты замещающему и возвращает их в дату выхода.' }
]

const open = computed({
  get: () => props.modelValue,
  set: v => emit('update:modelValue', v)
})

const step = ref(0)
const last = computed(() => step.value === STEPS.length - 1)

function next() {
  if (last.value) {
    navigateTo('/')
    return
  }
  step.value += 1
}
</script>

<template>
  <UiSheet v-model="open" title="Демо-тур" :subtitle="`Шаг ${step + 1} из ${STEPS.length}`" size="lg" :submit="false">
    <div class="rounded-2xl bg-canvas p-4 min-h-[9rem]">
      <h3 class="text-base font-semibold tracking-tight">{{ STEPS[step]!.title }}</h3>
      <p class="mt-2 text-sm text-zinc-600 leading-relaxed">{{ STEPS[step]!.text }}</p>
    </div>
    <template #footer>
      <div class="w-full flex items-center justify-between">
        <div class="flex gap-1.5">
          <span v-for="(s, i) in STEPS" :key="s.title" class="w-1.5 h-1.5 rounded-full" :class="i === step ? 'bg-zinc-900' : 'bg-zinc-300'" />
        </div>
        <div class="flex gap-2">
          <UButton color="white" class="rounded-full" @click="step = Math.max(0, step - 1)">Назад</UButton>
          <UButton color="black" class="rounded-full" @click="next">{{ last ? 'В демо-кабинет' : 'Дальше' }}</UButton>
        </div>
      </div>
    </template>
  </UiSheet>
</template>
