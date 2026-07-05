<script setup lang="ts">
import { MessageSquare } from 'lucide-vue-next'

const emit = defineEmits<{ submit: [] }>()
</script>

<template>
  <div class="beta-empty">
    <div class="beta-empty__icon">
      <MessageSquare :size="24" />
    </div>
    <h4 class="beta-empty__title">No feedback yet</h4>
    <p class="beta-empty__desc">
      Help us improve LingStack by submitting your first piece of feedback.
    </p>
    <button class="beta-empty__cta" @click="emit('submit')">
      Submit First Feedback
    </button>
  </div>
</template>

<style scoped>
.beta-empty {
  display: flex; flex-direction: column; align-items: center;
  padding: 32px 20px; text-align: center;
}
.beta-empty__icon {
  width: 48px; height: 48px; border-radius: 12px;
  background: rgba(90, 147, 255, 0.08); color: #5a93ff;
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 12px;
}
.beta-empty__title {
  font-size: 14px; font-weight: 600; color: var(--ls-text-primary, #e8ecf1);
  margin: 0 0 4px;
}
.beta-empty__desc {
  font-size: 12px; color: var(--ls-text-muted, #8a92a4);
  margin: 0 0 16px; line-height: 1.5; max-width: 280px;
}
.beta-empty__cta {
  padding: 7px 18px; border-radius: 8px;
  background: var(--ls-accent, #5a93ff); color: #fff;
  font-size: 12px; font-weight: 500; border: none; cursor: pointer;
  transition: background .12s;
}
.beta-empty__cta:hover { background: var(--ls-accent-hover, #4a83ef); }
</style>
