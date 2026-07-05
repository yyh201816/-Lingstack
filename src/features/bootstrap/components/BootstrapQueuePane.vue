<script setup lang="ts">
import { useBootstrapStore } from '../store/bootstrap.store'
import { useThreadStore } from '@/features/threads/store/thread.store'
import { ClipboardList, ArrowUpDown, Plus } from 'lucide-vue-next'
import { ref, computed } from 'vue'

const store = useBootstrapStore()
const threadStore = useThreadStore()
const showNewForm = ref(false)
const newTitle = ref('')
const newDesc = ref('')
const newPriority = ref<'p0'|'p1'|'p2'>('p1')

const activeTasks = computed(() =>
  store.tasks.filter(t => t.status !== 'done' && t.status !== 'blocked')
)

function addManual() {
  if (!newTitle.value.trim()) return
  store.addTask(newTitle.value.trim(), newDesc.value.trim(), 'workflow', 'manual', newPriority.value)
  newTitle.value = ''; newDesc.value = ''; showNewForm.value = false
}

function startFix(taskId: string) {
  const t = store.tasks.find(x => x.id === taskId)
  if (!t) return
  store.startTask(taskId)
  if (!t.relatedThreadId) {
    const tid = threadStore.createThread && threadStore.createThread(t.title, threadStore.activeThread?.projectId ?? '')
    if (tid) store.attachThread(taskId, typeof tid === 'string' ? tid : (tid as any).id)
  }
}
</script>

<template>
  <div class="bq-pane">
    <div class="bq-pane__header">
      <div class="bq-pane__header-left">
        <ClipboardList :size="15" />
        <h2 class="bq-pane__title">Bootstrap Queue</h2>
      </div>
      <span class="bq-pane__count">{{ store.queueSize }} active</span>
    </div>

    <!-- Quick Add -->
    <button class="bq-pane__add-btn" @click="showNewForm = !showNewForm">
      <Plus :size="13" /> New Task
    </button>
    <div v-if="showNewForm" class="bq-pane__new-form">
      <input v-model="newTitle" class="bq-pane__input" placeholder="Task title..." />
      <input v-model="newDesc" class="bq-pane__input" placeholder="Description (optional)..." />
      <div class="bq-pane__form-row">
        <select v-model="newPriority" class="bq-pane__select">
          <option value="p1">P1</option>
          <option value="p0">P0</option>
          <option value="p2">P2</option>
        </select>
        <button class="bq-pane__form-submit" @click="addManual">Add</button>
      </div>
    </div>

    <!-- P0 Warning -->
    <div v-if="store.p0Items.length > 0" class="bq-pane__p0-warn">
      {{ store.p0Items.length }} P0 task(s) block release
    </div>

    <!-- Task List -->
    <div v-if="activeTasks.length > 0" class="bq-pane__list">
      <div
        v-for="t in activeTasks"
        :key="t.id"
        :class="['bq-pane__card', `bq-pane__card--${t.status}`, `bq-pane__card--pri-${t.priority}`]"
      >
        <div class="bq-pane__card-top">
          <span :class="`bq-pane__dot bq-pane__dot--${t.status}`"></span>
          <div class="bq-pane__card-info">
            <h3 class="bq-pane__card-title">{{ t.title }}</h3>
            <p v-if="t.description" class="bq-pane__card-desc">{{ t.description }}</p>
            <div class="bq-pane__card-meta">
              <span class="bq-pane__card-pri bq-pane__card-pri--{{t.priority}}">{{ t.priority.toUpperCase() }}</span>
              <span class="bq-pane__card-type">{{ t.type }}</span>
              <span class="bq-pane__card-source">{{ t.source }}</span>
              <span v-if="t.relatedThreadId" class="bq-pane__card-thread">Thread {{ t.relatedThreadId.slice(-6) }}</span>
            </div>
          </div>
        </div>
        <div class="bq-pane__card-actions">
          <button
            v-if="t.status === 'todo' || t.status === 'queued'"
            class="bq-pane__card-btn bq-pane__card-btn--start"
            @click="startFix(t.id)"
          >Start Fix</button>
          <button
            v-if="t.status === 'in_progress'"
            class="bq-pane__card-btn bq-pane__card-btn--review"
            @click="store.markReviewing(t.id)"
          >Review</button>
          <button
            v-if="t.status === 'reviewing'"
            class="bq-pane__card-btn bq-pane__card-btn--done"
            @click="store.markDone(t.id)"
          >Done</button>
          <button
            v-if="t.status !== 'blocked' && t.status !== 'done'"
            class="bq-pane__card-btn bq-pane__card-btn--block"
            @click="store.markBlocked(t.id)"
          >Block</button>
        </div>
      </div>
    </div>

    <!-- Empty -->
    <div v-if="activeTasks.length === 0 && !showNewForm" class="bq-pane__empty">
      <ClipboardList :size="28" stroke-width="1.2" class="bq-pane__empty-icon" />
      <p class="bq-pane__empty-title">No active bootstrap tasks</p>
      <p class="bq-pane__empty-desc">Create tasks from beta feedback or manually to start the self-bootstrap loop.</p>
    </div>
  </div>
</template>

<style scoped>
.bq-pane{display:flex;flex-direction:column;height:100%;overflow-y:auto;padding:16px;user-select:none}
.bq-pane__header{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px}
.bq-pane__header-left{display:flex;align-items:center;gap:8px;color:var(--ls-accent,#5a93ff)}
.bq-pane__title{font-size:14px;font-weight:600;color:var(--ls-text-primary,#e9edf6);margin:0}
.bq-pane__count{font-size:10px;padding:2px 8px;border-radius:999px;background:rgba(84,216,140,.12);color:#54d88c;font-weight:500}
.bq-pane__add-btn{display:flex;align-items:center;gap:5px;padding:7px 12px;border-radius:8px;border:1px dashed rgba(255,255,255,.1);background:transparent;color:var(--ls-text-hint,#5d667a);font-size:11px;cursor:pointer;margin-bottom:10px;transition:all .12s}
.bq-pane__add-btn:hover{border-color:rgba(90,147,255,.3);color:var(--ls-accent,#5a93ff)}
.bq-pane__new-form{display:flex;flex-direction:column;gap:6px;margin-bottom:10px;padding:10px;border-radius:8px;border:1px solid rgba(90,147,255,.15);background:rgba(90,147,255,.04)}
.bq-pane__input{height:30px;padding:0 10px;border-radius:6px;border:1px solid rgba(255,255,255,.08);background:var(--ls-bg-elevated,#101624);color:var(--ls-text-primary,#e9edf6);font-size:11px;outline:none}
.bq-pane__form-row{display:flex;gap:6px;align-items:center}
.bq-pane__select{height:28px;padding:0 6px;border-radius:6px;border:1px solid rgba(255,255,255,.08);background:var(--ls-bg-elevated,#101624);color:var(--ls-text-secondary,#c3c9d4);font-size:11px}
.bq-pane__form-submit{padding:5px 14px;border-radius:6px;border:none;background:var(--ls-accent,#5a93ff);color:#fff;font-size:11px;cursor:pointer}
.bq-pane__p0-warn{display:flex;align-items:center;gap:6px;padding:8px 12px;border-radius:6px;background:rgba(255,107,107,.08);color:#ff6b6b;font-size:11px;font-weight:500;margin-bottom:10px}
.bq-pane__list{display:flex;flex-direction:column;gap:6px}
.bq-pane__card{padding:10px 12px;border-radius:8px;border:1px solid rgba(255,255,255,.06);background:var(--ls-bg-elevated,#101624)}
.bq-pane__card--pri-p0{border-left:3px solid #ff6b6b}
.bq-pane__card--pri-p1{border-left:3px solid #5a93ff}
.bq-pane__card-top{display:flex;gap:8px;align-items:flex-start}
.bq-pane__dot{width:7px;height:7px;border-radius:50%;margin-top:5px;flex-shrink:0}
.bq-pane__dot--todo{background:#8e96a6}
.bq-pane__dot--queued{background:#ffd463}
.bq-pane__dot--in_progress{background:#5a93ff;animation:pulse 1.2s ease infinite}
.bq-pane__dot--reviewing{background:#a17aff}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
.bq-pane__card-info{flex:1;min-width:0}
.bq-pane__card-title{font-size:12px;font-weight:600;color:var(--ls-text-primary,#e9edf6);margin:0 0 2px}
.bq-pane__card-desc{font-size:10px;color:var(--ls-text-hint,#5d667a);margin:0 0 6px;line-height:1.4}
.bq-pane__card-meta{display:flex;gap:6px;flex-wrap:wrap}
.bq-pane__card-pri{font-size:9px;padding:1px 5px;border-radius:3px;font-weight:600}
.bq-pane__card-pri--p0{background:rgba(255,107,107,.12);color:#ff6b6b}
.bq-pane__card-pri--p1{background:rgba(90,147,255,.12);color:#5a93ff}
.bq-pane__card-pri--p2{background:rgba(142,150,166,.12);color:#8e96a6}
.bq-pane__card-type,.bq-pane__card-source,.bq-pane__card-thread{font-size:9px;color:var(--ls-text-hint,#5d667a)}
.bq-pane__card-actions{display:flex;gap:4px;margin-top:8px}
.bq-pane__card-btn{padding:3px 10px;border-radius:5px;border:none;font-size:10px;font-weight:500;cursor:pointer;transition:all .12s}
.bq-pane__card-btn--start{background:rgba(90,147,255,.12);color:#5a93ff}
.bq-pane__card-btn--review{background:rgba(161,122,255,.12);color:#a17aff}
.bq-pane__card-btn--done{background:rgba(84,216,140,.12);color:#54d88c}
.bq-pane__card-btn--block{background:transparent;color:#8e96a6;border:1px solid rgba(255,255,255,.06)}
.bq-pane__card-btn:hover{filter:brightness(1.2)}
.bq-pane__empty{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:40px 20px;text-align:center}
.bq-pane__empty-icon{color:var(--ls-text-hint,#5d667a);margin-bottom:12px;opacity:.5}
.bq-pane__empty-title{font-size:13px;font-weight:600;color:var(--ls-text-secondary,#c3c9d4);margin:0 0 6px}
.bq-pane__empty-desc{font-size:11px;color:var(--ls-text-hint,#5d667a);margin:0;max-width:260px;line-height:1.5}
</style>
