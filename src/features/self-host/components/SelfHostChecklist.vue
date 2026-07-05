<script setup lang="ts">
import { ref } from 'vue'
import { CheckCircle, Circle, AlertCircle, XCircle, ChevronDown, ChevronRight, MessageSquare } from 'lucide-vue-next'
import { useSelfHostStore } from '../store/self-host.store'
import { generateSelfHostTaskPrompt } from '../services/self-host-readiness.service'
import type { SelfHostCapabilityItem } from '../types/self-host.types'

const store = useSelfHostStore()
const expandedId = ref<string | null>(null)
const emit = defineEmits<{ 'inject-task': [prompt: string] }>()

function toggleExpand(id: string) {
  expandedId.value = expandedId.value === id ? null : id
}

function statusIcon(status: SelfHostCapabilityItem['status']) {
  switch (status) {
    case 'ready': return CheckCircle
    case 'partial': return AlertCircle
    case 'blocked': return XCircle
    default: return Circle
  }
}

function statusColor(status: SelfHostCapabilityItem['status']) {
  switch (status) {
    case 'ready': return '#54d88c'
    case 'partial': return '#ffd93d'
    case 'blocked': return '#ff6b6b'
    default: return '#5d667a'
  }
}

function handleInjectTask(item: SelfHostCapabilityItem) {
  const prompt = generateSelfHostTaskPrompt(item)
  // Try to emit to parent, or dispatch as event
  emit('inject-task', prompt)
  // Also try CustomEvent for cross-component communication
  window.dispatchEvent(new CustomEvent('skill-prompt', { detail: prompt }))
}
</script>

<template>
  <div class="checklist">
    <div class="checklist__header">
      <h4>Capabilities Checklist</h4>
    </div>

    <div v-if="store.capabilities.length === 0" class="checklist__empty">
      Run analysis to see capabilities.
    </div>

    <div v-else class="checklist__list">
      <div
        v-for="item in store.capabilities"
        :key="item.id"
        :class="['checklist__item', { expanded: expandedId === item.id }]"
      >
        <button class="checklist__item-header" @click="toggleExpand(item.id)">
          <component
            :is="statusIcon(item.status)"
            :size="14"
            :color="statusColor(item.status)"
          />
          <span class="checklist__item-name">{{ item.name }}</span>
          <span :class="['checklist__item-badge', `checklist__item-badge--${item.status}`]">
            {{ item.status }}
          </span>
          <ChevronDown v-if="expandedId === item.id" :size="12" class="checklist__chevron" />
          <ChevronRight v-else :size="12" class="checklist__chevron" />
        </button>

        <div v-if="expandedId === item.id" class="checklist__item-detail">
          <p class="checklist__item-desc">{{ item.description }}</p>
          <p v-if="item.evidence" class="checklist__item-evidence">
            <strong>Evidence:</strong> {{ item.evidence }}
          </p>
          <button
            v-if="item.status !== 'ready'"
            class="checklist__item-action"
            @click="handleInjectTask(item)"
          >
            <MessageSquare :size="12" />
            Generate task for thread
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.checklist__header h4 {
  font-size: 12px; font-weight: 600; color: var(--ls-text-secondary, #c3c9d4);
  margin: 0 0 10px; text-transform: uppercase; letter-spacing: 0.04em;
}
.checklist__empty {
  font-size: 12px; color: var(--ls-text-hint, #5d667a); padding: 12px 0;
}
.checklist__list { display: flex; flex-direction: column; gap: 2px; }
.checklist__item {
  border-radius: 6px; transition: background .12s;
}
.checklist__item:hover { background: rgba(255, 255, 255, 0.02); }
.checklist__item.expanded { background: rgba(255, 255, 255, 0.03); }
.checklist__item-header {
  display: flex; align-items: center; gap: 8px; width: 100%;
  padding: 7px 10px; border: none; background: transparent;
  color: var(--ls-text-secondary, #c3c9d4); cursor: pointer;
  font-size: 12px; text-align: left;
}
.checklist__item-name { flex: 1; }
.checklist__item-badge {
  font-size: 9px; padding: 1px 5px; border-radius: 4px;
  font-weight: 500; text-transform: uppercase; letter-spacing: 0.03em;
}
.checklist__item-badge--ready { background: rgba(84, 216, 140, 0.1); color: #54d88c; }
.checklist__item-badge--partial { background: rgba(255, 217, 61, 0.1); color: #ffd93d; }
.checklist__item-badge--todo { background: rgba(255, 255, 255, 0.04); color: #5d667a; }
.checklist__item-badge--blocked { background: rgba(255, 107, 107, 0.1); color: #ff6b6b; }
.checklist__chevron { color: var(--ls-text-hint, #5d667a); flex-shrink: 0; }
.checklist__item-detail {
  padding: 6px 32px 10px;
}
.checklist__item-desc {
  font-size: 12px; color: var(--ls-text-muted, #8a92a4); margin: 0 0 6px; line-height: 1.5;
}
.checklist__item-evidence {
  font-size: 11px; color: var(--ls-text-hint, #5d667a); margin: 0 0 8px; line-height: 1.4;
}
.checklist__item-action {
  display: flex; align-items: center; gap: 5px;
  padding: 4px 10px; border-radius: 5px; font-size: 11px;
  background: rgba(90, 147, 255, 0.08); color: var(--ls-accent, #5a93ff);
  border: 1px solid rgba(90, 147, 255, 0.15); cursor: pointer;
  transition: all .12s;
}
.checklist__item-action:hover { background: rgba(90, 147, 255, 0.15); }
</style>
