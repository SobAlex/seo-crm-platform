<script setup lang="ts">
// Единственный экземпляр деструктивного подтверждения (useConfirm). Монтируется в layouts/default.vue.
const { state, settle } = useConfirm()
const notify = useNotify()

const open = computed({
  get: () => state.value.open,
  set: v => { if (!v) settle(false) }
})

function ok() {
  const toast = state.value.toast
  settle(true)
  if (toast !== false) notify(toast || 'Удалено')
}
</script>

<template>
  <UiSheet v-model="open" title="Подтвердите действие" size="sm" :submit="state.ok || 'Подтвердить'" danger manual :submit-toast="false" @submit="ok">
    <div>
      <p class="text-sm font-medium text-zinc-900">{{ state.title }}</p>
      <p class="text-sm text-zinc-600 mt-1.5">{{ state.text || CONFIRM_DEFAULT_TEXT }}</p>
    </div>
  </UiSheet>
</template>
