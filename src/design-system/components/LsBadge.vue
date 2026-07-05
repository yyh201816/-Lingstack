<script setup lang="ts">
type BadgeColor = "primary" | "success" | "warning" | "danger" | "info" | "neutral"
interface Props {
  color?: BadgeColor
  variant?: "light" | "solid"
  size?: "sm" | "md"
}
withDefaults(defineProps<Props>(), { color: "primary", variant: "light", size: "sm" })
</script>

<template>
  <span :class="['ls-badge', `ls-badge--${color}`, `ls-badge--${variant}`, `ls-badge--${size}`]">
    <slot />
  </span>
</template>

<style scoped>
.ls-badge {
  display: inline-flex; align-items: center; gap: 4px;
  border-radius: var(--ls-radius-pill); font-weight: var(--ls-font-weight-medium);
  font-family: var(--ls-font-sans); white-space: nowrap;
}
.ls-badge--sm { padding: 2px 10px; font-size: 11px; }
.ls-badge--md { padding: 3px 12px; font-size: 12px; }

.ls-badge--primary.ls-badge--light { background: var(--ls-brand-50); color: var(--ls-brand-500); }
.ls-badge--success.ls-badge--light { background: var(--ls-success-50); color: var(--ls-success-600); }
.ls-badge--warning.ls-badge--light { background: var(--ls-warning-50); color: var(--ls-warning-600); }
.ls-badge--danger.ls-badge--light { background: var(--ls-danger-50); color: var(--ls-danger-600); }
.ls-badge--info.ls-badge--light { background: var(--ls-info-50); color: var(--ls-info-500); }
.ls-badge--neutral.ls-badge--light { background: var(--ls-bg-muted); color: var(--ls-text-muted); }

.ls-badge--primary.ls-badge--solid { background: var(--ls-brand-500); color: #fff; }
.ls-badge--success.ls-badge--solid { background: var(--ls-success-500); color: #fff; }
.ls-badge--warning.ls-badge--solid { background: var(--ls-warning-500); color: #fff; }
.ls-badge--danger.ls-badge--solid { background: var(--ls-danger-500); color: #fff; }
</style>
