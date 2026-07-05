<script setup lang="ts">
interface Props {
  modelValue: string; placeholder?: string; disabled?: boolean;
  type?: string; rows?: number; error?: string
}
withDefaults(defineProps<Props>(), { placeholder: "", disabled: false, type: "text", rows: 3 })
defineEmits<{ "update:modelValue": [value: string] }>()
</script>

<template>
  <div class="ls-input-wrap">
    <textarea
      v-if="type === 'textarea'" :value="modelValue" :placeholder="placeholder"
      :disabled="disabled" :rows="rows"
      :class="['ls-input', 'ls-input--textarea', { 'ls-input--error': error }]"
      @input="$emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
    />
    <input
      v-else :value="modelValue" :placeholder="placeholder" :type="type"
      :disabled="disabled"
      :class="['ls-input', { 'ls-input--error': error }]"
      @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    />
    <span v-if="error" class="ls-input__error">{{ error }}</span>
  </div>
</template>

<style scoped>
.ls-input-wrap { display: flex; flex-direction: column; gap: 4px; }
.ls-input {
  width: 100%; padding: 10px 14px; border: 1px solid var(--ls-border-default);
  border-radius: var(--ls-radius-lg); background: var(--ls-bg-surface);
  font-family: var(--ls-font-sans); font-size: 14px; color: var(--ls-text-primary);
  outline: none; transition: border-color 160ms ease, box-shadow 160ms ease;
  box-sizing: border-box;
}
.ls-input::placeholder { color: var(--ls-text-subtle); }
.ls-input:focus:not(:disabled) {
  border-color: var(--ls-brand-300); box-shadow: var(--ls-shadow-input-focus);
}
.ls-input--textarea { resize: vertical; min-height: 60px; line-height: 1.5; }
.ls-input--error { border-color: var(--ls-danger-300); }
.ls-input:disabled { background: var(--ls-bg-muted); color: var(--ls-text-muted); cursor: not-allowed; }
.ls-input__error { font-size: 12px; color: var(--ls-danger-500); }
</style>
