<script setup lang="ts">
// Карточка «Ждёт вашего решения» портала (card() в portal.html): утвердить результат или отправить замечания.
interface Approval {
  id: string
  dir: 'content' | 'onpage' | 'offpage'
  title: string
  about: string
  since: string
  due: string
  file: string
}

const props = defineProps<{ item: Approval; allowed: boolean; tip?: string }>()
const emit = defineEmits<{ settled: [id: string] }>()

const notify = useNotify()

const DIR = {
  content: ['Контент', 'bg-pink-50 text-pink-700'],
  onpage: ['Внутренняя оптимизация', 'bg-teal-50 text-teal-700'],
  offpage: ['Внешняя оптимизация', 'bg-orange-50 text-orange-700']
} as const

const state = ref<'pending' | 'ok' | 'warn'>('pending')
const remarkOpen = ref(false)
const remark = ref('')
const fading = ref(false)
const remarkField = ref<{ textarea?: HTMLTextAreaElement } | null>(null)

const focusRemark = () => nextTick(() => remarkField.value?.textarea?.focus())

function approve() {
  if (state.value !== 'pending' || !props.allowed) return
  state.value = 'ok'
  remarkOpen.value = false
  notify('Задача утверждена · спасибо!', 'success')
  setTimeout(() => {
    fading.value = true
    setTimeout(() => emit('settled', props.item.id), 250)
  }, 2200)
}

function openRemarks() {
  if (!props.allowed) return
  remarkOpen.value = true
  focusRemark()
}

function sendRemarks() {
  if (state.value !== 'pending') return
  if (!remark.value.trim()) return focusRemark()
  state.value = 'warn'
  remarkOpen.value = false
  notify('Замечания отправлены менеджеру', 'warning')
  setTimeout(() => {
    fading.value = true
    setTimeout(() => emit('settled', props.item.id), 220)
  }, 1600)
}
</script>

<template>
  <article
    class="bg-white rounded-2xl shadow-card p-4 lg:p-5 transition-opacity duration-200"
    :class="[state === 'warn' && 'opacity-70', fading && '!opacity-0']"
  >
    <div class="flex flex-wrap items-center gap-2 mb-2">
      <span class="inline-flex px-2 py-0.5 rounded-md text-[11px] font-medium" :class="DIR[item.dir][1]">{{ DIR[item.dir][0] }}</span>
      <span v-if="state === 'pending'" class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-violet-50 text-violet-700"><span class="w-1.5 h-1.5 rounded-full bg-violet-500" />Ждёт вашего решения</span>
      <span v-else-if="state === 'ok'" class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700"><span class="w-1.5 h-1.5 rounded-full bg-emerald-500" />Утверждено</span>
      <span v-else class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700"><span class="w-1.5 h-1.5 rounded-full bg-amber-500" />Замечания отправлены</span>
      <span class="ml-auto text-xs text-zinc-500 tabular-nums">с {{ item.since }} · ответить до {{ item.due }}</span>
    </div>
    <h4 class="text-sm font-medium">{{ item.title }}</h4>
    <p class="text-sm text-zinc-600 mt-1">{{ item.about }}</p>
    <div class="mt-4 flex flex-col sm:flex-row sm:items-center gap-3">
      <button type="button" class="inline-flex items-center gap-1.5 text-xs text-zinc-600 hover:text-zinc-900 transition min-w-0" @click="notify(`Файл «${item.file}» скачивается`)">
        <svg class="w-4 h-4 shrink-0 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg><span class="truncate">{{ item.file }}</span>
      </button>
      <div class="flex flex-wrap gap-2 sm:ml-auto">
        <template v-if="state === 'pending'">
          <AccessGate :allowed="allowed" :tip="tip">
            <UButton :disabled="!allowed" :data-deny-tip="allowed ? undefined : tip" @click="approve">Утвердить результат</UButton>
          </AccessGate>
          <AccessGate :allowed="allowed" :tip="tip">
            <UButton color="white" :disabled="!allowed" class="rounded-full border-zinc-200 text-zinc-700 shadow-none" @click="openRemarks">Есть замечания</UButton>
          </AccessGate>
        </template>
        <span v-else-if="state === 'ok'" class="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">Согласовано вами только что</span>
        <span v-else class="text-xs text-zinc-500">Замечания отправлены 18.06 — менеджер ответит в течение дня</span>
      </div>
    </div>
    <div v-if="remarkOpen" class="mt-3 flex flex-col gap-2">
      <UTextarea
        ref="remarkField"
        v-model="remark"
        :rows="3"
        placeholder="Что поправить — менеджер увидит это в задаче"
        textarea-class="bg-white border-zinc-200 text-sm resize-y"
      />
      <div class="flex justify-end">
        <UButton color="black" size="xs" class="rounded-full" @click="sendRemarks">Отправить замечания</UButton>
      </div>
    </div>
  </article>
</template>
