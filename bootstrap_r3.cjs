const fs = require('fs');
const B = 'g:/LingStack-nexT/src';

function w(rel, content) {
  const p = B + '/' + rel;
  const dir = p.substring(0, p.lastIndexOf('/'));
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(p, content, 'utf-8');
  console.log('✓ ' + rel);
}

// ============================================================
// R3.1: shared/ui 设计系统组件
// ============================================================

// ---- UIButton.vue ----
w('shared/components/ui/UIButton.vue',
`<script setup lang="ts">
import { computed } from 'vue'
import { Loader2 } from 'lucide-vue-next'

const props = withDefaults(defineProps<{
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  loading?: boolean
  block?: boolean
}>(), {
  variant: 'secondary',
  size: 'md',
  disabled: false,
  loading: false,
  block: false,
})

const emit = defineEmits<{ click: [e: MouseEvent] }>()

const cls = computed(() => [
  'ui-btn',
  'ui-btn--' + props.variant,
  'ui-btn--' + props.size,
  props.block ? 'ui-btn--block' : '',
])
</script>

<template>
  <button :class="cls" :disabled="disabled || loading" @click="emit('click', $event)">
    <Loader2 v-if="loading" :size="14" class="ui-btn__spinner" />
    <slot />
  </button>
</template>

<style scoped>
.ui-btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 6px;
  font-family: var(--ls-font-sans); font-weight: var(--ls-font-weight-medium);
  border: 1px solid transparent; border-radius: var(--ls-radius-sm);
  cursor: pointer; white-space: nowrap; user-select: none;
  transition: background-color var(--ls-duration-fast) var(--ls-ease-standard),
              color var(--ls-duration-fast) var(--ls-ease-standard),
              border-color var(--ls-duration-fast) var(--ls-ease-standard),
              box-shadow var(--ls-duration-fast) var(--ls-ease-standard);
}
.ui-btn:disabled { opacity: 0.45; cursor: not-allowed; }
.ui-btn__spinner { animation: ui-spin 0.8s linear infinite; }
@keyframes ui-spin { to { transform: rotate(360deg); } }

/* sizes */
.ui-btn--sm { height: 28px; padding: 0 10px; font-size: 11px; border-radius: var(--ls-radius-xs); }
.ui-btn--md { height: 32px; padding: 0 14px; font-size: var(--ls-text-xs); }
.ui-btn--lg { height: 38px; padding: 0 18px; font-size: var(--ls-text-sm); }

/* primary */
.ui-btn--primary { background: var(--ls-accent); color: var(--ls-text-on-accent); border-color: var(--ls-accent); }
.ui-btn--primary:hover:not(:disabled) { background: var(--ls-accent-hover); border-color: var(--ls-accent-hover); }
.ui-btn--primary:active:not(:disabled) { background: var(--ls-accent-active); border-color: var(--ls-accent-active); }

/* secondary */
.ui-btn--secondary { background: var(--ls-bg-surface); color: var(--ls-text-secondary); border-color: var(--ls-border-default); }
.ui-btn--secondary:hover:not(:disabled) { background: var(--ls-bg-panel-hover); color: var(--ls-text-primary); border-color: var(--ls-border-strong); }
.ui-btn--secondary:active:not(:disabled) { background: var(--ls-bg-panel); }

/* ghost */
.ui-btn--ghost { background: transparent; color: var(--ls-text-muted); }
.ui-btn--ghost:hover:not(:disabled) { background: var(--ls-bg-panel-hover); color: var(--ls-text-primary); }
.ui-btn--ghost:active:not(:disabled) { background: var(--ls-bg-panel); }

/* danger */
.ui-btn--danger { background: var(--ls-danger-soft); color: var(--ls-danger); border-color: transparent; }
.ui-btn--danger:hover:not(:disabled) { background: var(--ls-danger); color: white; }
.ui-btn--danger:active:not(:disabled) { background: #dc2626; }

.ui-btn--block { width: 100%; }
</style>
`);

// ---- UIIconButton.vue ----
w('shared/components/ui/UIIconButton.vue',
`<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md'
  disabled?: boolean
  tooltip?: string
  active?: boolean
}>(), {
  variant: 'ghost',
  size: 'md',
  disabled: false,
  active: false,
})

const emit = defineEmits<{ click: [e: MouseEvent] }>()

const cls = computed(() => [
  'ui-icon-btn',
  'ui-icon-btn--' + props.variant,
  'ui-icon-btn--' + props.size,
  props.active ? 'ui-icon-btn--active' : '',
])
</script>

<template>
  <button :class="cls" :disabled="disabled" :title="tooltip" @click="emit('click', $event)">
    <slot />
  </button>
</template>

<style scoped>
.ui-icon-btn {
  display: inline-flex; align-items: center; justify-content: center;
  border: 1px solid transparent; border-radius: var(--ls-radius-sm);
  cursor: pointer; flex-shrink: 0;
  transition: background-color var(--ls-duration-fast) var(--ls-ease-standard),
              color var(--ls-duration-fast) var(--ls-ease-standard),
              border-color var(--ls-duration-fast) var(--ls-ease-standard);
}
.ui-icon-btn:disabled { opacity: 0.35; cursor: not-allowed; }

.ui-icon-btn--sm { width: 28px; height: 28px; }
.ui-icon-btn--md { width: 32px; height: 32px; }

.ui-icon-btn--ghost { color: var(--ls-text-muted); }
.ui-icon-btn--ghost:hover:not(:disabled) { background: var(--ls-bg-panel-hover); color: var(--ls-text-primary); }
.ui-icon-btn--ghost:active:not(:disabled) { background: var(--ls-bg-panel); }

.ui-icon-btn--secondary { color: var(--ls-text-secondary); border-color: var(--ls-border-default); background: var(--ls-bg-surface); }
.ui-icon-btn--secondary:hover:not(:disabled) { background: var(--ls-bg-panel-hover); border-color: var(--ls-border-strong); }
.ui-icon-btn--secondary:active:not(:disabled) { background: var(--ls-bg-panel); }

.ui-icon-btn--primary { background: var(--ls-accent); color: var(--ls-text-on-accent); }
.ui-icon-btn--primary:hover:not(:disabled) { background: var(--ls-accent-hover); }
.ui-icon-btn--primary:active:not(:disabled) { background: var(--ls-accent-active); }

.ui-icon-btn--danger { color: var(--ls-danger); }
.ui-icon-btn--danger:hover:not(:disabled) { background: var(--ls-danger-soft); }
.ui-icon-btn--active { color: var(--ls-accent); background: var(--ls-accent-soft); }
</style>
`);

// ---- UICard.vue ----
w('shared/components/ui/UICard.vue',
`<script setup lang="ts">
defineProps<{
  title?: string
  subtitle?: string
  borderless?: boolean
}>()
</script>

<template>
  <div :class="['ui-card', { 'ui-card--borderless': borderless }]">
    <div v-if="title || $slots.header" class="ui-card__header">
      <div>
        <h3 v-if="title" class="ui-card__title">{{ title }}</h3>
        <p v-if="subtitle" class="ui-card__subtitle">{{ subtitle }}</p>
      </div>
      <div v-if="$slots.header" class="ui-card__header-actions">
        <slot name="header" />
      </div>
    </div>
    <div class="ui-card__body">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.ui-card {
  background: var(--ls-bg-surface);
  border: 1px solid var(--ls-border-soft);
  border-radius: var(--ls-radius-lg);
  overflow: hidden;
}
.ui-card--borderless { border: none; background: transparent; }

.ui-card__header {
  display: flex; align-items: center; justify-content: space-between;
  padding: var(--ls-space-4); padding-bottom: 0;
}
.ui-card__title { font-size: var(--ls-text-sm); font-weight: var(--ls-font-weight-semibold); color: var(--ls-text-primary); }
.ui-card__subtitle { font-size: var(--ls-text-xs); color: var(--ls-text-muted); margin-top: 2px; }
.ui-card__header-actions { display: flex; align-items: center; gap: var(--ls-space-2); }
.ui-card__body { padding: var(--ls-space-4); }
</style>
`);

// ---- UITag.vue ----
w('shared/components/ui/UITag.vue',
`<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'accent'
  size?: 'sm' | 'md'
  removable?: boolean
}>(), {
  variant: 'default',
  size: 'sm',
  removable: false,
})

const emit = defineEmits<{ remove: [] }>()

const cls = computed(() => ['ui-tag', 'ui-tag--' + props.variant, 'ui-tag--' + props.size])
</script>

<template>
  <span :class="cls">
    <slot />
    <button v-if="removable" class="ui-tag__remove" @click.stop="emit('remove')">&times;</button>
  </span>
</template>

<style scoped>
.ui-tag {
  display: inline-flex; align-items: center; gap: 4px;
  font-family: var(--ls-font-sans); font-weight: var(--ls-font-weight-medium);
  border-radius: var(--ls-radius-xs); white-space: nowrap;
}
.ui-tag--sm { height: 20px; padding: 0 6px; font-size: 10px; }
.ui-tag--md { height: 24px; padding: 0 8px; font-size: 11px; }

.ui-tag--default { background: var(--ls-bg-muted); color: var(--ls-text-muted); }
.ui-tag--accent  { background: var(--ls-accent-soft); color: var(--ls-accent); }
.ui-tag--success { background: var(--ls-success-soft); color: var(--ls-success); }
.ui-tag--warning { background: var(--ls-warning-soft); color: var(--ls-warning); }
.ui-tag--danger  { background: var(--ls-danger-soft); color: var(--ls-danger); }
.ui-tag--info    { background: var(--ls-info-soft); color: var(--ls-info); }

.ui-tag__remove { display: inline-flex; align-items: center; justify-content: center; width: 12px; height: 12px; border-radius: 50%; font-size: 10px; line-height: 1; opacity: 0.5; transition: opacity 0.12s; }
.ui-tag__remove:hover { opacity: 1; }
</style>
`);

// ---- UIInput.vue ----
w('shared/components/ui/UIInput.vue',
`<script setup lang="ts">
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
`);

console.log('\\nR3.1 shared/ui components done.');
