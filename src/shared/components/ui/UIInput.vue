<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  modelValue: string
  placeholder?: string
  label?: string
  error?: string
  disabled?: boolean
  type?: 'text' | 'password' | 'search'
}>(), {
  type: 'text',
  disabled: false,
})

const emit = defineEmits<{ 'update:modelValue': [v: string] }>()

const cls = computed(() => ['ui-input__field', props.error ? 'ui-input__field--error' : ''])
</script>

<template>
  <div class="ui-input">
    <label v-if="label" class="ui-input__label">{{ label }}</label>
    <div class="ui-input__wrapper">
      <input
        :type="type"
        :class="cls"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      />
    </div>
    <span v-if="error" class="ui-input__error">{{ error }}</span>
  </div>
</template>

<style scoped>
.ui-input { display: flex; flex-direction: column; gap: 4px; }
.ui-input__label { font-size: var(--ls-text-xs); font-weight: var(--ls-font-weight-medium); color: var(--ls-text-secondary); }
.ui-input__wrapper { position: relative; }
.ui-input__field {
  width: 100%; height: 32px; padding: 0 var(--ls-space-3);
  font-family: var(--ls-font-sans); font-size: var(--ls-text-sm);
  background: var(--ls-bg-surface); color: var(--ls-text-primary);
  border: 1px solid var(--ls-border-default);
  border-radius: var(--ls-radius-sm); outline: none;
  transition: border-color var(--ls-duration-fast) var(--ls-ease-standard),
              box-shadow var(--ls-duration-fast) var(--ls-ease-standard);
}
.ui-input__field::placeholder { color: var(--ls-text-subtle); }
.ui-input__field:focus { border-color: var(--ls-accent); box-shadow: var(--ls-shadow-input-focus); }
.ui-input__field:disabled { opacity: 0.5; background: var(--ls-bg-muted); }
.ui-input__field--error { border-color: var(--ls-danger); }
.ui-input__field--error:focus { box-shadow: 0 0 0 4px var(--ls-danger-soft); }
.ui-input__error { font-size: 10px; color: var(--ls-danger); }
</style>
