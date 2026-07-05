<script setup lang="ts">
import { computed } from 'vue'
import { FileText, ChevronRight } from 'lucide-vue-next'
import { getChangelog } from '../services/beta-release.service'

const entries = computed(() => getChangelog(5))
</script>

<template>
  <div class="changelog">
    <div class="changelog__header">
      <FileText :size="16" />
      <h3>Changelog</h3>
    </div>

    <div v-if="entries.length === 0" class="changelog__empty">
      No changelog entries available.
    </div>

    <div v-else class="changelog__list">
      <div v-for="entry in entries" :key="entry.version" class="changelog__item">
        <div class="changelog__item-header">
          <span class="changelog__version">v{{ entry.version }}</span>
          <span class="changelog__date">{{ entry.date }}</span>
        </div>
        <p class="changelog__summary">{{ entry.summary }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.changelog {
  padding: 16px;
  border-radius: 10px;
  background: var(--ls-bg-elevated, #101624);
  border: 1px solid rgba(255, 255, 255, 0.06);
}
.changelog__header {
  display: flex; align-items: center; gap: 8px;
  margin-bottom: 14px; padding-bottom: 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  color: var(--ls-text-primary, #e8ecf1);
}
.changelog__header h3 { font-size: 14px; font-weight: 600; }
.changelog__empty {
  font-size: 12px; color: var(--ls-text-hint, #5d667a); text-align: center;
  padding: 20px 0;
}
.changelog__list { display: flex; flex-direction: column; gap: 12px; }
.changelog__item {
  padding: 10px 12px; border-radius: 8px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.04);
}
.changelog__item-header {
  display: flex; align-items: center; gap: 8px; margin-bottom: 6px;
}
.changelog__version {
  font-size: 12px; font-weight: 600; font-family: monospace;
  color: var(--ls-accent, #5a93ff);
}
.changelog__date {
  font-size: 10px; color: var(--ls-text-hint, #5d667a); font-family: monospace;
}
.changelog__summary {
  font-size: 12px; color: var(--ls-text-secondary, #c3c9d4);
  line-height: 1.5; margin: 0;
}
</style>
