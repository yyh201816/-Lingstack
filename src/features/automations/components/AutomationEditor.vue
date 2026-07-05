<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAutomationStore } from '../store/automation.store'

const props = defineProps<{
  automationId?: string
}>()

const emit = defineEmits<{
  save: []
  cancel: []
}>()

const store = useAutomationStore()

const name = ref('')
const prompt = ref('')
const schedule = ref('')
const threadMode = ref<'local' | 'worktree' | 'cloud'>('local')

onMounted(() => {
  if (props.automationId) {
    const existing = store.automations.find((a) => a.id === props.automationId)
    if (existing) {
      name.value = existing.name
      prompt.value = existing.prompt
      schedule.value = existing.schedule
      threadMode.value = existing.threadMode
    }
  }
})

function handleSave() {
  if (!name.value.trim() || !prompt.value.trim()) return

  if (props.automationId) {
    store.updateAutomation(props.automationId, {
      name: name.value.trim(),
      prompt: prompt.value.trim(),
      schedule: schedule.value.trim(),
      threadMode: threadMode.value,
    })
  } else {
    store.addAutomation({
      name: name.value.trim(),
      prompt: prompt.value.trim(),
      schedule: schedule.value.trim(),
      enabled: true,
      threadMode: threadMode.value,
    })
  }
  emit('save')
}
</script>

<template>
  <div class="auto-editor">
    <div class="auto-editor__header">
      <span class="auto-editor__title">{{ props.automationId ? 'Edit Automation' : 'New Automation' }}</span>
    </div>

    <div class="auto-editor__body">
      <label class="auto-editor__field">
        <span class="auto-editor__label">Name</span>
        <input
          v-model="name"
          class="auto-editor__input"
          type="text"
          placeholder="e.g. Daily Code Review"
        />
      </label>

      <label class="auto-editor__field">
        <span class="auto-editor__label">Prompt</span>
        <textarea
          v-model="prompt"
          class="auto-editor__textarea"
          rows="5"
          placeholder="Describe what this automation should do..."
        />
      </label>

      <label class="auto-editor__field">
        <span class="auto-editor__label">Schedule</span>
        <input
          v-model="schedule"
          class="auto-editor__input"
          type="text"
          placeholder="e.g. 0 9 * * * (cron) or every-day"
        />
      </label>

      <label class="auto-editor__field">
        <span class="auto-editor__label">Thread Mode</span>
        <select v-model="threadMode" class="auto-editor__select">
          <option value="local">Local</option>
          <option value="worktree">Worktree</option>
          <option value="cloud">Cloud</option>
        </select>
      </label>
    </div>

    <div class="auto-editor__actions">
      <button class="auto-editor__btn auto-editor__btn--cancel" @click="emit('cancel')">Cancel</button>
      <button
        class="auto-editor__btn auto-editor__btn--save"
        :disabled="!name.trim() || !prompt.trim()"
        @click="handleSave"
      >Save</button>
    </div>
  </div>
</template>

<style scoped>
.auto-editor {
  display: flex;
  flex-direction: column;
  gap: 0;
  height: 100%;
}
.auto-editor__header {
  padding: 12px 16px;
  border-bottom: 1px solid var(--ls-border, rgba(255,255,255,0.06));
}
.auto-editor__title {
  font-size: 13px;
  font-weight: 600;
  color: var(--ls-text-primary, #c3c9d4);
}
.auto-editor__body {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.auto-editor__field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.auto-editor__label {
  font-size: 11px;
  font-weight: 500;
  color: var(--ls-text-muted, #5d667a);
  text-transform: uppercase;
  letter-spacing: 0.4px;
}
.auto-editor__input,
.auto-editor__textarea,
.auto-editor__select {
  padding: 6px 10px;
  border: 1px solid var(--ls-border, rgba(255,255,255,0.06));
  border-radius: var(--ls-radius-sm, 4px);
  background: var(--ls-bg-panel, #1e1f23);
  color: var(--ls-text-primary, #c3c9d4);
  font-size: 12px;
  font-family: inherit;
  outline: none;
  transition: border-color var(--ls-duration-fast, 0.15s);
}
.auto-editor__input:focus,
.auto-editor__textarea:focus,
.auto-editor__select:focus {
  border-color: var(--ls-accent, #5b8af5);
}
.auto-editor__textarea {
  resize: vertical;
  min-height: 80px;
}
.auto-editor__select {
  cursor: pointer;
}
.auto-editor__actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 12px 16px;
  border-top: 1px solid var(--ls-border, rgba(255,255,255,0.06));
}
.auto-editor__btn {
  padding: 6px 16px;
  border: none;
  border-radius: var(--ls-radius-sm, 4px);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: opacity var(--ls-duration-fast, 0.15s);
}
.auto-editor__btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.auto-editor__btn--cancel {
  background: transparent;
  color: var(--ls-text-muted, #5d667a);
  border: 1px solid var(--ls-border, rgba(255,255,255,0.06));
}
.auto-editor__btn--cancel:hover { opacity: 0.8; }
.auto-editor__btn--save {
  background: var(--ls-accent, #5b8af5);
  color: #fff;
}
.auto-editor__btn--save:hover:not(:disabled) { opacity: 0.85; }
</style>
