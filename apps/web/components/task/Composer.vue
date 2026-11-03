<script setup lang="ts">
// Редактор комментария задачи (task.html): форматирование, ссылка, вложения (файл, ⌘V, перетаскивание),
// поле «Время», тумблер «Включить в отчёт клиенту» и отправка (⌘↵).
import { esc, stamp, type CommentDraft, type TaskFile } from '~/types/task'

const props = defineProps<{ canWrite: boolean; canReport: boolean; canTrack: boolean }>()
const emit = defineEmits<{ send: [draft: CommentDraft]; draftHours: [hours: number] }>()

const notify = useNotify()

const REPORT_TIP = 'Включить комментарий в отчёт может сотрудник компании. Подрядчик пишет текст — его включит менеджер проекта.'

const editor = ref<HTMLElement | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)
const linkRowEl = ref<HTMLElement | null>(null)
const empty = ref(true)
const pending = ref<TaskFile[]>([])
const report = ref(false)
const hours = ref('')
const dragging = ref(false)
const linkOpen = ref(false)
const linkUrl = ref('')

const isEmpty = () => !editor.value || (!editor.value.textContent?.trim() && !editor.value.querySelector('img'))
const syncEmpty = () => { empty.value = isEmpty() }

/* Разрешённая разметка: жирный, курсив, списки, ссылки, переносы строк */
const TAGS: Record<string, string> = { B: 'b', STRONG: 'b', I: 'i', EM: 'i', UL: 'ul', OL: 'ol', LI: 'li', A: 'a', BR: 'br', P: 'p', DIV: 'p' }
function clean(node: Node): string {
  let out = ''
  node.childNodes.forEach(n => {
    if (n.nodeType === 3) { out += esc(n.textContent); return }
    if (n.nodeType !== 1) return
    const el = n as HTMLElement
    const tag = TAGS[el.tagName]
    const inner = clean(el)
    if (!tag) { out += inner; return }
    if (tag === 'br') { out += '<br>'; return }
    if (tag === 'a') {
      const href = el.getAttribute('href') || ''
      out += /^(https?:|mailto:)/i.test(href) ? `<a href="${esc(href)}" target="_blank" rel="noopener">${inner}</a>` : inner
      return
    }
    if (tag === 'p' && /<(ul|ol|p)>/.test(inner)) { out += inner; return }
    if (tag === 'p' && !inner.replace(/<br>/g, '').trim()) return
    out += `<${tag}>${inner}</${tag}>`
  })
  return out
}

/* ---------- Панель форматирования ---------- */
type Stateful = 'bold' | 'italic' | 'insertUnorderedList' | 'insertOrderedList'
const STATEFUL: Stateful[] = ['bold', 'italic', 'insertUnorderedList', 'insertOrderedList']
const active = reactive<Record<Stateful, boolean>>({ bold: false, italic: false, insertUnorderedList: false, insertOrderedList: false })
const toolCls = (cmd: Stateful) => active[cmd] ? 'bg-zinc-900 text-white' : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'

function paintToolbar() {
  const inside = !!editor.value && editor.value.contains(document.getSelection()?.anchorNode ?? null)
  STATEFUL.forEach(cmd => {
    let on = false
    try { on = inside && document.queryCommandState(cmd) } catch { /* ignore */ }
    active[cmd] = on
  })
}

let savedRange: Range | null = null
function restoreRange() {
  editor.value?.focus()
  if (!savedRange) return
  const sel = document.getSelection()
  sel?.removeAllRanges()
  sel?.addRange(savedRange)
}
function closeLink() { linkOpen.value = false; linkUrl.value = '' }
function applyLink() {
  let url = linkUrl.value.trim()
  if (!url) return closeLink()
  if (!/^(https?:|mailto:)/i.test(url)) url = 'https://' + url
  restoreRange()
  const sel = document.getSelection()
  if (!sel || sel.isCollapsed) document.execCommand('insertHTML', false, `<a href="${esc(url)}">${esc(url.replace(/^https?:\/\//, ''))}</a>&nbsp;`)
  else document.execCommand('createLink', false, url)
  closeLink()
  syncEmpty()
}
function cancelLink() { closeLink(); restoreRange() }
function onLinkKey(e: KeyboardEvent) {
  if (e.key === 'Enter') { e.preventDefault(); applyLink() }
  if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); cancelLink() }
}

function cmd(name: Stateful | 'link' | 'attach') {
  if (name === 'attach') return fileInput.value?.click()
  if (name === 'link') {
    const sel = document.getSelection()
    savedRange = sel && sel.rangeCount && editor.value?.contains(sel.anchorNode) ? sel.getRangeAt(0).cloneRange() : null
    linkOpen.value = true
    nextTick(() => linkRowEl.value?.querySelector('input')?.focus())
    return
  }
  editor.value?.focus()
  document.execCommand(name, false)
  syncEmpty()
  paintToolbar()
}

/* ---------- Вложения: файл, вставка скриншота, перетаскивание ---------- */
function readImage(file: File): Promise<string | undefined> {
  return new Promise(resolve => {
    const r = new FileReader()
    r.onload = () => {
      const img = new Image()
      img.onload = () => {
        const k = Math.min(1, 1400 / img.width)
        const c = document.createElement('canvas')
        c.width = Math.round(img.width * k)
        c.height = Math.round(img.height * k)
        const ctx = c.getContext('2d')!
        ctx.fillStyle = '#fff'
        ctx.fillRect(0, 0, c.width, c.height)
        ctx.drawImage(img, 0, 0, c.width, c.height)
        resolve(c.toDataURL('image/jpeg', 0.82))
      }
      img.onerror = () => resolve(r.result as string)
      img.src = r.result as string
    }
    r.onerror = () => resolve(undefined)
    r.readAsDataURL(file)
  })
}
let seq = 0
async function addFiles(files: File[], pasted = false) {
  for (const f of files) {
    if (f.size > 20 * 1048576) { notify(`Файл слишком большой: «${f.name}» больше 20 МБ`, 'error'); continue }
    const item: TaskFile = { id: 'p' + (++seq), name: f.name, size: f.size }
    if (pasted) item.name = 'Скриншот ' + stamp(new Date()).replace(', ', ' ') + '.png'
    if (/^image\//.test(f.type)) item.url = await readImage(f)
    pending.value.push(item)
  }
  if (pasted) notify('Скриншот прикреплён к комментарию', 'success')
}
function removePending(id?: string) {
  pending.value = pending.value.filter(f => f.id !== id)
}
function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  addFiles(Array.from(input.files || []))
  input.value = ''
}
function onPaste(e: ClipboardEvent) {
  const items = Array.from(e.clipboardData?.items || [])
  const images = items.filter(i => i.kind === 'file' && /^image\//.test(i.type)).map(i => i.getAsFile()).filter((f): f is File => !!f)
  e.preventDefault()
  if (images.length) { addFiles(images, true); return }
  const text = e.clipboardData?.getData('text/plain')
  if (text) document.execCommand('insertText', false, text)
  syncEmpty()
}
function onDragOver(e: DragEvent) {
  if (e.dataTransfer && Array.from(e.dataTransfer.types).includes('Files')) {
    e.preventDefault()
    dragging.value = true
  }
}
function onDragLeave(e: DragEvent) {
  if (!(e.currentTarget as HTMLElement).contains(e.relatedTarget as Node | null)) dragging.value = false
}
function onDrop(e: DragEvent) {
  if (!e.dataTransfer || !e.dataTransfer.files.length) return
  e.preventDefault()
  dragging.value = false
  addFiles(Array.from(e.dataTransfer.files))
}

/* ---------- Время: предпросмотр в виджете учёта ---------- */
const parseHours = () => {
  const raw = hours.value.trim().replace(/^\+/, '').replace(',', '.')
  return { raw, value: raw ? Number(raw) : 0 }
}
watch(hours, () => {
  const { value } = parseHours()
  emit('draftHours', value > 0 && value <= 24 ? value : 0)
})

/* ---------- Отправка ---------- */
function send() {
  if (!props.canWrite) return notify('Недоступно для вашей роли', 'error')
  const html = editor.value ? clean(editor.value).replace(/^(<br>)+|(<br>)+$/g, '') : ''
  const { raw, value } = parseHours()
  if (raw && !(value > 0 && value <= 24)) return notify('Укажите время от 0,1 до 24 ч', 'error')
  const hasText = !!html.replace(/<[^>]+>/g, '').trim()
  if (!hasText && !pending.value.length && !value) {
    editor.value?.focus()
    return notify('Напишите комментарий, прикрепите файл или укажите время', 'error')
  }
  emit('send', {
    html: hasText ? html : '',
    files: pending.value.map(f => ({ id: f.id, name: f.name, size: f.size, url: f.url })),
    hours: value,
    report: report.value && props.canReport
  })
  if (editor.value) editor.value.innerHTML = ''
  syncEmpty()
  pending.value = []
  report.value = false
  hours.value = ''
}
function onEditorKey(e: KeyboardEvent) {
  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); send() }
}
function flipReport() {
  if (props.canReport) report.value = !report.value
}

onMounted(() => {
  syncEmpty()
  document.addEventListener('selectionchange', paintToolbar)
})
onBeforeUnmount(() => document.removeEventListener('selectionchange', paintToolbar))
</script>

<template>
  <div class="shrink-0 sticky bottom-0 z-10 border-t border-zinc-100 bg-zinc-50/95 backdrop-blur p-3 lg:p-4">
    <div
      class="rounded-2xl border border-zinc-200 bg-white transition focus-within:ring-4 focus-within:ring-accent/15 focus-within:border-accent/40"
      :class="[report && '!border-emerald-300 bg-emerald-50/30', dragging && 'ring-4 ring-accent/15']"
      @dragover="onDragOver"
      @dragleave="onDragLeave"
      @drop="onDrop"
    >
      <div class="flex items-center gap-0.5 px-1.5 py-1 border-b border-zinc-100" role="toolbar" aria-label="Форматирование" @mousedown.prevent>
        <button type="button" title="Жирный (⌘B)" aria-label="Жирный" :aria-pressed="active.bold" class="w-8 h-8 rounded-lg text-sm font-bold transition" :class="toolCls('bold')" @click="cmd('bold')">B</button>
        <button type="button" title="Курсив (⌘I)" aria-label="Курсив" :aria-pressed="active.italic" class="w-8 h-8 rounded-lg text-sm italic font-serif transition" :class="toolCls('italic')" @click="cmd('italic')">I</button>
        <span class="w-px h-5 bg-zinc-200 mx-1" aria-hidden="true" />
        <button type="button" title="Маркированный список" aria-label="Маркированный список" :aria-pressed="active.insertUnorderedList" class="w-8 h-8 rounded-lg transition flex items-center justify-center" :class="toolCls('insertUnorderedList')" @click="cmd('insertUnorderedList')">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-width="2" d="M9 6h11M9 12h11M9 18h11" /><circle cx="4.5" cy="6" r="1.2" fill="currentColor" /><circle cx="4.5" cy="12" r="1.2" fill="currentColor" /><circle cx="4.5" cy="18" r="1.2" fill="currentColor" /></svg>
        </button>
        <button type="button" title="Нумерованный список" aria-label="Нумерованный список" :aria-pressed="active.insertOrderedList" class="w-8 h-8 rounded-lg text-[11px] font-semibold transition" :class="toolCls('insertOrderedList')" @click="cmd('insertOrderedList')">1.</button>
        <button type="button" title="Ссылка" aria-label="Ссылка" class="w-8 h-8 rounded-lg text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 transition flex items-center justify-center" @click="cmd('link')">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14a4 4 0 005.66 0l3-3a4 4 0 00-5.66-5.66l-1 1M14 10a4 4 0 00-5.66 0l-3 3a4 4 0 005.66 5.66l1-1" /></svg>
        </button>
        <span class="w-px h-5 bg-zinc-200 mx-1" aria-hidden="true" />
        <button type="button" title="Прикрепить файл" aria-label="Прикрепить файл" class="w-8 h-8 rounded-lg text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 transition flex items-center justify-center" @click="cmd('attach')">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
        </button>
        <input ref="fileInput" type="file" multiple class="hidden" @change="onFileChange">
        <span class="ml-auto pr-2 text-[11px] text-zinc-400 hidden sm:inline">⌘V — вставить скриншот</span>
      </div>
      <div v-show="linkOpen" ref="linkRowEl" class="flex items-center gap-2 px-3 py-2 border-b border-zinc-100 bg-zinc-50/60">
        <UInput v-model="linkUrl" type="url" size="xs" placeholder="https://…" aria-label="Адрес ссылки" class="flex-1 min-w-0" @keydown="onLinkKey" />
        <UButton color="black" size="2xs" class="rounded-full" @click="applyLink">Вставить</UButton>
        <UButton color="white" variant="ghost" size="2xs" class="rounded-full text-zinc-500" @click="cancelLink">Отмена</UButton>
      </div>
      <div
        ref="editor"
        contenteditable="true"
        role="textbox"
        aria-multiline="true"
        aria-label="Текст комментария"
        :data-empty="empty ? 'true' : 'false'"
        data-placeholder="Написать комментарий… Скриншот можно вставить через ⌘V / Ctrl+V"
        class="px-3.5 py-2.5 min-h-[76px] max-h-48 overflow-y-auto outline-none text-sm text-zinc-800 leading-relaxed break-words data-[empty=true]:before:content-[attr(data-placeholder)] data-[empty=true]:before:text-zinc-400 data-[empty=true]:before:pointer-events-none [&_b]:font-semibold [&_strong]:font-semibold [&_i]:italic [&_em]:italic [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_a]:text-accent [&_a]:underline"
        @input="syncEmpty"
        @paste="onPaste"
        @keydown="onEditorKey"
      />
      <div v-if="pending.length" class="flex flex-wrap gap-2 px-3 pb-3">
        <template v-for="f in pending" :key="f.id">
          <span v-if="f.url" class="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 p-1.5 pr-2">
            <span class="relative shrink-0">
              <img :src="f.url" :alt="f.name" class="h-12 w-12 rounded-lg object-cover ring-1 ring-black/10">
              <button type="button" aria-label="Убрать скриншот" class="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-zinc-900 text-white text-xs leading-none flex items-center justify-center shadow-pop ring-2 ring-white hover:bg-red-600 transition" @click="removePending(f.id)">×</button>
            </span>
            <span class="text-[11px] text-zinc-600 font-medium">Скриншот прикреплен</span>
          </span>
          <TaskFileChip v-else :file="f" removable @remove="removePending(f.id)" />
        </template>
      </div>
    </div>

    <div class="mt-3 flex flex-col sm:flex-row sm:items-center gap-3">
      <label class="inline-flex items-center gap-1.5 shrink-0 text-sm text-zinc-600" title="Списать время вместе с комментарием">
        Время:
        <AccessGate :allowed="canTrack">
          <UInput
            v-model="hours"
            type="text"
            inputmode="decimal"
            size="xs"
            placeholder="+2,5"
            aria-label="Списать часов"
            :disabled="!canTrack"
            class="w-16"
            input-class="px-2.5 text-center tabular-nums"
          />
        </AccessGate>
        <span class="text-zinc-500">ч</span>
      </label>
      <span class="hidden sm:block w-px h-5 bg-zinc-200" aria-hidden="true" />
      <div class="relative inline-flex items-center gap-2.5 select-none" :class="canReport ? 'cursor-pointer' : 'cursor-not-allowed'">
        <AccessGate :allowed="canReport" :tip="REPORT_TIP">
          <UToggle v-model="report" :disabled="!canReport" :data-deny-tip="canReport ? undefined : REPORT_TIP" aria-label="Включить в отчёт клиенту" />
        </AccessGate>
        <span class="text-sm" :class="canReport ? 'text-zinc-700' : 'text-zinc-400'" :title="canReport ? undefined : REPORT_TIP" @click="flipReport">Включить в отчёт клиенту</span>
      </div>
      <div class="sm:ml-auto flex items-center gap-3">
        <span class="hidden sm:inline text-[11px] text-zinc-400">⌘↵ — отправить</span>
        <AccessGate :allowed="canWrite">
          <UButton :disabled="!canWrite" class="flex-1 sm:flex-none justify-center" @click="send">Отправить</UButton>
        </AccessGate>
      </div>
    </div>
    <p v-if="report" class="mt-2 text-xs text-emerald-700">Текст со списками, жирным, ссылками и изображениями попадёт в отчёт «Холод · Июнь 2025» в том же виде.</p>
  </div>
</template>
