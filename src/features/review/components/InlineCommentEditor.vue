<script setup lang="ts">
import { ref } from 'vue'

const emit = defineEmits<{
  (e: 'submit', content: string): void
  (e: 'cancel'): void
}>()

const text = ref('')
const submitting = ref(false)

function handleSubmit() {
  const content = text.value.trim()
  if (!content) return
  submitting.value = true
  emit('submit', content)
  text.value = ''
  submitting.value = false
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && e.ctrlKey) {
    e.preventDefault()
    handleSubmit()
  }
  if (e.key === 'Escape') {
    emit('cancel')
  }
}
</script>

<template>
  <div class="comment-editor">
    <textarea
      v-model="text"
      class="comment-editor__input"
      placeholder="Add review comment... (Ctrl+Enter to submit, Esc to cancel)"
      rows="2"
      @keydown="handleKeydown"
    ></textarea>
    <div class="comment-editor__actions">
      <button
        class="comment-editor__btn comment-editor__btn--submit"
        :disabled="!text.trim() || submitting"
        @click="handleSubmit"
      >Submit</button>
      <button class="comment-editor__btn comment-editor__btn--cancel" @click="emit('cancel')">Cancel</button>
    </div>
  </div>
</template>

<style scoped>
.comment-editor {
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  padding: 8px 10px;
  flex-shrink: 0;
}
.comment-editor__input {
  width: 100%;
  box-sizing: border-box;
  border: 1px solid rgba(255, 212, 99, 0.2);
  border-radius: 8px;
  background: rgba(255, 212, 99, 0.03);
  color: var(--ls-text-primary, #e9edf6);
  font-size: 12px;
  padding: 6px 10px;
  resize: none;
  outline: none;
  font-family: inherit;
  line-height: 1.4;
}
.comment-editor__input:focus { border-color: rgba(255, 212, 99, 0.4); }
.comment-editor__input::placeholder { color: var(--ls-text-hint, #5d667a); font-size: 11px; }
.comment-editor__actions {
  display: flex;
  gap: 6px;
  justify-content: flex-end;
  margin-top: 6px;
}
.comment-editor__btn {
  padding: 3px 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  background: transparent;
  font-size: 11px;
  cursor: pointer;
  transition: all 120ms ease;
}
.comment-editor__btn--submit {
  background: rgba(255, 212, 99, 0.1);
  border-color: rgba(255, 212, 99, 0.2);
  color: #ffd463;
}
.comment-editor__btn--submit:hover:not(:disabled) { background: rgba(255, 212, 99, 0.18); }
.comment-editor__btn--submit:disabled { opacity: 0.4; cursor: not-allowed; }
.comment-editor__btn--cancel { color: var(--ls-text-hint, #5d667a); }
.comment-editor__btn--cancel:hover { background: rgba(255, 255, 255, 0.04); }
</style>
