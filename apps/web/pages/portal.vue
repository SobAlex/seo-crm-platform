<script setup lang="ts">
// portal.html → Сетка 2 (Split): кабинет клиента — спринт, согласование результатов, отчёты, бриф и доступы;
// справа менеджер и разделы портала. Сотрудники видят тот же экран как превью: действия клиента недоступны.
import ApprovalCard from '~/components/portal/ApprovalCard.vue'

definePageMeta({ roles: ['owner', 'seo_head', 'mgr_head', 'pm', 'employee', 'client'] })
useHead({ title: 'Мой проект — SEO Control' })

const { can } = useRole()
const notify = useNotify()

const preview = computed(() => !can('portal.view') && can('portal.preview'))
const canRespond = computed(() => can('portal.request.respond'))
const TIP_PREVIEW = 'Превью портала: решение принимает клиент'

/* Только статус WAITING_CLIENT и клиентские поля: без часов, ставок, внутренних комментариев и исполнителей */
const approvals = ref([
  { id: 't31', dir: 'content' as const, title: 'Тексты для 12 категорий каталога', about: 'Описания категорий «Холодильники», «Морозильники», «Витрины» и ещё 9. После согласования опубликуем на сайте.', since: '14.06', due: '20.06', file: 'Тексты категорий.docx' },
  { id: 't32', dir: 'onpage' as const, title: 'Новые заголовки и описания для раздела «Холодильники»', about: '48 страниц: title и description под собранную семантику. Покажем в выдаче после переобхода.', since: '16.06', due: '21.06', file: 'Мета-теги — Холодильники.xlsx' },
  { id: 't33', dir: 'offpage' as const, title: 'Площадки для размещения статей в июне', about: '6 отраслевых изданий о бытовой технике. Бюджет согласован в договоре, нужен только выбор тематик.', since: '17.06', due: '24.06', file: 'Площадки — июнь.xlsx' }
])
const removeApproval = (id: string) => { approvals.value = approvals.value.filter(a => a.id !== id) }

/* Ежемесячные отчёты — компактный реестр (1 строка = 1 отчёт) */
const REPORTS = [
  { m: 'Май 2025', key: '2025-05', sent: '03.06' },
  { m: 'Апрель 2025', key: '2025-04', sent: '02.05' },
  { m: 'Март 2025', key: '2025-03', sent: '03.04' }
]

const ACCESSES = [
  { name: 'Яндекс Метрика', label: 'Выдан', badge: 'bg-emerald-50 text-emerald-700', dot: 'bg-emerald-500' },
  { name: 'Google Search Console', label: 'Нужен до 20.06', badge: 'bg-amber-50 text-amber-700', dot: 'bg-amber-500' },
  { name: 'Админка сайта', label: 'Выдан', badge: 'bg-emerald-50 text-emerald-700', dot: 'bg-emerald-500' }
]

/* Табы правой колонки → панели слева */
type Tab = 'approve' | 'reports' | 'brief'
const tab = ref<Tab>('approve')
const TABS: { id: Tab; label: string }[] = [
  { id: 'approve', label: 'Согласование результатов' },
  { id: 'reports', label: 'Отчёты проекта' },
  { id: 'brief', label: 'Бриф и доступы' }
]
</script>

<template>
  <PageSplit aside-class="xl:sticky xl:top-20">
    <template #title>
      <h1 class="text-base font-semibold tracking-tight text-ink leading-none truncate max-w-[140px] sm:max-w-none">Мой проект</h1>
      <UBadge v-if="preview" color="violet" class="shrink-0" title="Так портал видит клиент">Превью клиента</UBadge>
    </template>

    <template #top>
      <div>
        <p class="text-sm text-zinc-500 mb-1">Ромашка Digital · SEO-продвижение</p>
        <h2 class="text-2xl lg:text-3xl font-semibold tracking-tight text-ink">Интернет-магазин «Холод»</h2>
        <p class="text-sm text-zinc-500 mt-1">holod-shop.ru · Июнь 2025</p>
      </div>
    </template>

    <div class="rounded-2xl bg-zinc-50 border border-zinc-200/80 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div class="min-w-0">
        <div class="text-sm font-medium text-zinc-900">Текущий спринт: Июнь 2025 · Выполнено 85% плановых работ · Отчёт будет готов 30 июня</div>
      </div>
      <a href="https://t.me/nmorozov_seo" target="_blank" rel="noopener noreferrer" class="h-8 px-3 rounded-full bg-white border border-zinc-200 text-xs font-medium text-zinc-800 hover:bg-zinc-100 transition inline-flex items-center gap-1.5 shrink-0">
        <svg class="w-3.5 h-3.5 text-sky-500" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M9.04 15.47l-.37 5.2c.53 0 .76-.23 1.04-.5l2.5-2.4 5.18 3.8c.95.53 1.63.25 1.89-.88l3.42-16.06h.01c.3-1.41-.51-1.96-1.44-1.62L1.84 9.3C.47 9.83.49 10.6 1.6 10.94l5.45 1.7L19.14 5.4c.62-.41 1.19-.18.72.23" /></svg>
        Написать менеджеру в Telegram
      </a>
    </div>

    <div v-show="tab === 'approve'" class="space-y-4">
      <div class="flex items-center justify-between gap-3">
        <h3 class="text-sm font-semibold tracking-tight">Согласование результатов</h3>
        <span class="text-xs text-zinc-500">Ожидают решения: <span class="tabular-nums font-medium text-zinc-700">{{ approvals.length }}</span></span>
      </div>
      <div class="flex flex-col gap-3">
        <ApprovalCard
          v-for="a in approvals"
          :key="a.id"
          :item="a"
          :allowed="canRespond"
          :tip="preview ? TIP_PREVIEW : DENY_TIP"
          @settled="removeApproval"
        />
      </div>
      <div v-if="!approvals.length" class="bg-white rounded-2xl shadow-card px-4 py-10 text-center">
        <div class="w-10 h-10 mx-auto rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg></div>
        <div class="text-sm font-medium">Всё согласовано</div>
        <div class="text-xs text-zinc-500 mt-1">Новые задачи на согласование появятся здесь</div>
      </div>
    </div>

    <div v-show="tab === 'reports'" class="space-y-4">
      <div class="flex items-center justify-between gap-3">
        <h3 class="text-sm font-semibold tracking-tight">Отчёты проекта</h3>
        <span class="text-xs text-zinc-500">Присылаем до 5 числа следующего месяца</span>
      </div>
      <div class="bg-white rounded-2xl shadow-card overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="border-b border-zinc-100 text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
                <th class="px-4 lg:px-6 py-3">Период</th>
                <th class="px-4 py-3">Статус</th>
                <th class="px-4 py-3">Согласован</th>
                <th class="px-4 lg:px-6 py-3 text-right">Действия</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-zinc-100 text-sm">
              <tr class="hover:bg-zinc-50/50 transition">
                <td class="px-4 lg:px-6 py-3 font-medium text-zinc-900">Июнь 2025</td>
                <td class="px-4 py-3">
                  <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-100 text-zinc-600"><span class="w-1.5 h-1.5 rounded-full bg-zinc-400" />В работе</span>
                </td>
                <td class="px-4 py-3 text-xs text-zinc-500">Готовим — пришлём до 05.07</td>
                <td class="px-4 lg:px-6 py-3 text-right text-xs text-zinc-400">—</td>
              </tr>
              <tr v-for="r in REPORTS" :key="r.key" class="hover:bg-zinc-50/50 transition">
                <td class="px-4 lg:px-6 py-3 font-medium text-zinc-900">{{ r.m }}</td>
                <td class="px-4 py-3">
                  <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700"><span class="w-1.5 h-1.5 rounded-full bg-emerald-500" />Принят клиентом</span>
                </td>
                <td class="px-4 py-3 text-xs text-zinc-600 tabular-nums">{{ r.sent }}</td>
                <td class="px-4 lg:px-6 py-3 text-right">
                  <div class="inline-flex items-center justify-end gap-2">
                    <UButton :to="`/reports/${r.key}?view=client`" color="gray" variant="ghost" size="2xs" class="rounded-full px-3 bg-zinc-100 text-xs font-medium text-zinc-700 hover:bg-zinc-200">Веб-версия</UButton>
                    <UButton :to="`/reports/${r.key}?view=client&print=1`" color="white" size="2xs" class="rounded-full px-3 border-zinc-200 text-xs font-medium text-zinc-700 shadow-none gap-1.5">
                      <svg class="w-3.5 h-3.5 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg><span>PDF</span>
                    </UButton>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div v-show="tab === 'brief'" class="space-y-4">
      <div>
        <h3 class="text-sm font-semibold tracking-tight">Бриф и доступы</h3>
        <p class="text-xs text-zinc-500 mt-1">Сводка ответов клиента и статус доступов для команды</p>
      </div>
      <section class="bg-white rounded-2xl shadow-card p-5 sm:p-6 space-y-3">
        <div class="flex items-center justify-between gap-3">
          <h4 class="text-sm font-semibold tracking-tight">Ответы на бриф</h4>
          <NuxtLink to="/brief?client=holod" class="text-xs font-medium text-accent hover:underline">Открыть полностью</NuxtLink>
        </div>
        <div class="space-y-3 text-sm">
          <div>
            <div class="text-xs font-medium text-zinc-500 mb-1">Главная цель на 3 месяца</div>
            <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 text-sm font-medium">Рост органического трафика</div>
          </div>
          <div>
            <div class="text-xs font-medium text-zinc-500 mb-1">Сезонность и ассортимент</div>
            <p class="text-zinc-700 leading-relaxed">Пик продаж — май–июль. Упор на промышленные чиллеры и морозильные лари к сезону.</p>
          </div>
        </div>
      </section>
      <section class="bg-white rounded-2xl shadow-card p-5 sm:p-6 space-y-3">
        <h4 class="text-sm font-semibold tracking-tight">Доступы</h4>
        <ul class="space-y-2.5 text-sm">
          <li v-for="a in ACCESSES" :key="a.name" class="flex items-center justify-between gap-3">
            <span class="font-medium text-zinc-900">{{ a.name }}</span>
            <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium" :class="a.badge"><span class="w-1.5 h-1.5 rounded-full" :class="a.dot" />{{ a.label }}</span>
          </li>
        </ul>
        <div class="pt-2 flex flex-wrap gap-2">
          <AccessGate :allowed="canRespond" :tip="preview ? TIP_PREVIEW : DENY_TIP">
            <UButton :disabled="!canRespond" @click="notify('Спасибо! Менеджер получил уведомление')">Доступ в GSC выдан</UButton>
          </AccessGate>
          <UButton to="/brief-form" color="white" class="rounded-full border-zinc-200 text-zinc-700 shadow-none">Дополнить бриф</UButton>
        </div>
      </section>
    </div>

    <template #aside>
      <div class="space-y-6">
        <div class="flex items-center gap-3 bg-white rounded-2xl shadow-card px-4 py-3">
          <span class="w-9 h-9 rounded-full bg-zinc-900 text-white text-[11px] font-semibold flex items-center justify-center shrink-0">НМ</span>
          <div class="min-w-0">
            <div class="text-sm font-medium">Никита Морозов</div>
            <div class="text-xs text-zinc-500">Ваш менеджер · n.morozov@romashka.ru</div>
          </div>
        </div>
        <nav class="bg-white rounded-2xl shadow-card p-2 space-y-1" aria-label="Разделы портала">
          <button
            v-for="t in TABS"
            :key="t.id"
            type="button"
            :aria-pressed="tab === t.id"
            class="w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-medium transition"
            :class="tab === t.id ? 'bg-black/5 text-zinc-900' : 'text-zinc-600 hover:bg-black/5 hover:text-zinc-900'"
            @click="tab = t.id"
          >{{ t.label }}</button>
        </nav>
      </div>
    </template>
  </PageSplit>
</template>
