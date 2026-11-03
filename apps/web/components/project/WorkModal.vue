<script setup lang="ts">
// Окно «Запланировать работу» (#work-modal в project.html).
const open = defineModel<boolean>({ required: true })

const form = ref({ title: 'Аудит технический', month: 'Июнь 2025', due: '2025-06-14', executor: 'Алексей Петров', estimate: '8' })
const monthOptions = ['Июнь 2025', 'Июль 2025', 'Август 2025']
const executorOptions = ['Алексей Петров', 'Иван Сидоров', 'Иван Дронов', 'Мария Ким (подрядчик)']
</script>

<template>
  <UiSheet
    v-model="open"
    title="Запланировать работу"
    subtitle="Создаст задачу в плане месяца"
    submit="Создать задачу"
    submit-toast="Задача создана в плане месяца"
  >
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <UiField label="Название задачи" class="md:col-span-2"><UInput v-model="form.title" required /></UiField>
      <UiField label="Месяц"><USelect v-model="form.month" :options="monthOptions" /></UiField>
      <UiField label="Срок"><UInput v-model="form.due" type="date" /></UiField>
      <UiField label="Исполнитель"><USelect v-model="form.executor" :options="executorOptions" /></UiField>
      <UiField label="Оценка, ч"><UInput v-model="form.estimate" type="number" step="0.25" min="0" class="tabular-nums" /></UiField>
    </div>
  </UiSheet>
</template>
