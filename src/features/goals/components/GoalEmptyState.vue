<script setup lang="ts">
import { ref } from 'vue'
import { useGoalStore } from '../store/goal.store'
import { recordGoalEvent } from '../services/goal-progress.service'

const props = defineProps<{
  threadId: string
}>()

const goalStore = useGoalStore()

const isCreating = ref(false)
const title = ref('')
const objective = ref('')

function showForm() {
  isCreating.value = true
  title.value = ''
  objective.value = ''
}

function cancelForm() {
  isCreating.value = false
}

function submitForm() {
  const t = title.value.trim()
  const o = objective.value.trim()
  if (!t || !o) return

  const goal = goalStore.createGoal(props.threadId, t, o)
  recordGoalEvent(goal.id, 'created')
  isCreating.value = false
}
</script>

<template>
  <div class="goal-empty">
    <template v-if="!isCreating">
      <span class="goal-empty__icon">&#x1F3AF;</span>
      <p class="goal-empty__title">No active goal</p>
      <p class="goal-empty__desc">Set a goal to track progress on this thread.</p>
      <button class="goal-empty__btn" @click="showForm">Create Goal</button>
    </template>

    <template v-else>
      <form class="goal-empty__form" @submit.prevent="submitForm">
        <label class="goal-empty__field">
          <span class="goal-empty__label">Title</span>
          <input
            v-model="title"
            class="goal-empty__input"
            placeholder="Goal title"
            autofocus
          />
        </label>
        <label class="goal-empty__field">
          <span class="goal-empty__label">Objective</span>
          <textarea
            v-model="objective"
            class="goal-empty__textarea"
            placeholder="Describe the objective..."
            rows="3"
          ></textarea>
        </label>
        <div class="goal-empty__form-actions">
          <button type="button" class="goal-empty__btn goal-empty__btn--ghost" @click="cancelForm">Cancel</button>
          <button
            type="submit"
            class="goal-empty__btn goal-empty__btn--primary"
            :disabled="!title.trim() || !objective.trim()"
          >Create</button>
        </div>
      </form>
    </template>
  </div>
</template>

<style scoped>
.goal-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px 20px;
  text-align: center;
  font-family: var(--ls-font-sans, 'Inter', sans-serif);
}
.goal-empty__icon {
  font-size: 28px;
  margin-bottom: 12px;
  opacity: 0.4;
}
.goal-empty__title {
  font-size: 13px;
  font-weight: 600;
  color: var(--ls-text-primary, #111827);
  margin: 0 0 6px;
}
.goal-empty__desc {
  font-size: 11px;
  color: var(--ls-text-muted, #64748b);
  margin: 0 0 16px;
  max-width: 240px;
  line-height: 1.5;
}
.goal-empty__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 30px;
  padding: 0 14px;
  font-size: 11px;
  font-weight: 550;
  font-family: var(--ls-font-sans, 'Inter', sans-serif);
  border: 1px solid var(--ls-border, rgba(99, 115, 129, 0.16));
  border-radius: var(--ls-radius-sm, 10px);
  background: var(--ls-bg-panel, #f3f5f9);
  color: var(--ls-text-primary, #111827);
  cursor: pointer;
  transition: background-color var(--ls-duration-fast, 140ms),
              border-color var(--ls-duration-fast, 140ms);
}
.goal-empty__btn:hover:not(:disabled) {
  background: var(--ls-bg-panel-hover, #eef2f8);
}
.goal-empty__btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
.goal-empty__btn--primary {
  background: var(--ls-accent, #4f6ef7);
  color: var(--ls-text-on-accent, #ffffff);
  border-color: var(--ls-accent, #4f6ef7);
}
.goal-empty__btn--primary:hover:not(:disabled) {
  background: var(--ls-accent-hover, #4563eb);
  border-color: var(--ls-accent-hover, #4563eb);
}
.goal-empty__btn--ghost {
  background: transparent;
  border-color: transparent;
  color: var(--ls-text-muted, #64748b);
}
.goal-empty__btn--ghost:hover:not(:disabled) {
  background: var(--ls-bg-panel, #f3f5f9);
  color: var(--ls-text-primary, #111827);
}
.goal-empty__form {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  max-width: 280px;
  text-align: left;
}
.goal-empty__field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.goal-empty__label {
  font-size: 10px;
  font-weight: 600;
  color: var(--ls-text-muted, #64748b);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
.goal-empty__input,
.goal-empty__textarea {
  font-size: 12px;
  font-family: var(--ls-font-sans, 'Inter', sans-serif);
  color: var(--ls-text-primary, #111827);
  background: var(--ls-bg-surface, #ffffff);
  border: 1px solid var(--ls-border, rgba(99, 115, 129, 0.16));
  border-radius: var(--ls-radius-sm, 10px);
  padding: 6px 10px;
  outline: none;
  transition: border-color var(--ls-duration-fast, 140ms);
  resize: vertical;
}
.goal-empty__input:focus,
.goal-empty__textarea:focus {
  border-color: var(--ls-accent, #4f6ef7);
  box-shadow: 0 0 0 3px rgba(79, 110, 247, 0.14);
}
.goal-empty__input::placeholder,
.goal-empty__textarea::placeholder {
  color: var(--ls-text-muted, #64748b);
  opacity: 0.6;
}
.goal-empty__form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 4px;
}
</style>
