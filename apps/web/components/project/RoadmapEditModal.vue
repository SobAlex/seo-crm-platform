<script setup lang="ts">
// Окно «Редактировать дорожную карту» (#roadmap-edit-modal в project.html).
const open = defineModel<boolean>({ required: true })

const form = ref({ name: 'Дорожная карта · Интернет-магазин', description: 'Карта для интернет-магазинов и маркетплейсов.' })
</script>

<template>
  <UiSheet
    v-model="open"
    title="Редактировать дорожную карту"
    submit="Сохранить"
    submit-toast="Дорожная карта сохранена"
  >
    <UiField label="Проект"><UInput model-value="Интернет-магазин «Холод»" disabled /></UiField>
    <UiField label="Название карты"><UInput v-model="form.name" required /></UiField>
    <UiField label="Описание"><UTextarea v-model="form.description" :rows="2" resize /></UiField>
    <div class="rounded-xl border border-black/5 p-3 bg-zinc-50">
      <p class="text-xs text-zinc-500">Направления и работы редактируются прямо в карточке проекта.</p>
    </div>
  </UiSheet>
</template>
