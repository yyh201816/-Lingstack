<script setup lang="ts">
defineProps<{
  modelValue: string
  stagedCount: number
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()
</script>

<template>
  <div class="commit-draft">
    <div class="commit-draft__header">
      <span class="commit-draft__label">Commit Message</span>
      <span v-if="stagedCount > 0" class="commit-draft__staged-hint">{{ stagedCount }} file(s) staged</span>
    </div>
    <textarea
      class="commit-draft__input"
      :value="modelValue"
      placeholder="Describe your changes..."
      rows="3"
      @input="emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
    ></textarea>
  </div>
</template>

<style scoped>
.commit-draft {
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  padding: 8px;
  flex-shrink: 0;
}
.commit-draft__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 5px;
}
.commit-draft__label {
  font-size: 10px;
  color: var(--ls-text-hint, #5d667a);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 500;
}
.commit-draft__staged-hint {
  font-size: 9px;
  color: rgba(84, 216, 140, 0.7);
}
.commit-draft__input {
  width: 100%;
  box-sizing: border-box;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.2);
  color: var(--ls-text-primary, #e9edf6);
  font-size: 12px;
  padding: 6px 10px;
  resize: vertical;
  outline: none;
  font-family: inherit;
  line-height: 1.4;
}
.commit-draft__input:focus { border-color: var(--ls-accent, #5a93ff); }
.commit-draft__input::placeholder { color: var(--ls-text-hint, #5d667a); font-size: 11px; }
</style>
