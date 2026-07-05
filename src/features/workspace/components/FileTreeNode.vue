<script setup lang="ts">
/**
 * FileTreeNode — 递归文件树节点
 * Vue 3 支持在 template 中使用自身名字实现递归渲染
 */
import { computed } from 'vue'
import type { PropType } from 'vue'
import type { FileNode } from '../composables/useFileTree'
import { getFileIcon } from '../composables/useFileTree'
import { ChevronRight } from 'lucide-vue-next'

const props = defineProps({
  nodePath: { type: String, required: true },
  nodes: { type: Object as PropType<Record<string, FileNode>>, required: true },
  onToggle: { type: Function as PropType<(p: string) => void>, required: true },
  onFileClick: { type: Function as PropType<(p: string) => void>, required: true },
  depth: { type: Number, default: 0 },
})

const node = computed<FileNode | null>(() => props.nodes[props.nodePath] ?? null)
const ext = computed(() => node.value ? (node.value.name.split('.').pop() || '') : '')
const icon = computed(() => {
  if (!node.value) return ''
  if (!node.value.isDirectory) return getFileIcon(ext.value)
  return node.value.expanded ? '📂' : '📁'
})

function handleClick() {
  if (!node.value) return
  if (node.value.isDirectory) {
    props.onToggle(props.nodePath)
  } else {
    props.onFileClick(props.nodePath)
  }
}
</script>

<template>
  <div v-if="node">
    <div
      class="ft-node"
      :style="{ paddingLeft: (depth * 16 + 8) + 'px' }"
      @click="handleClick"
    >
      <span
        v-if="node.isDirectory"
        :class="['ft-node__chevron', { 'ft-node__chevron--open': node.expanded }]"
      >
        <ChevronRight :size="12" />
      </span>
      <span v-else class="ft-node__chevron ft-node__chevron--empty" />
      <span class="ft-node__icon">{{ icon }}</span>
      <span class="ft-node__name">{{ node.name }}</span>
    </div>

    <template v-if="node.isDirectory && node.expanded && node.children.length > 0">
      <FileTreeNode
        v-for="childPath in node.children"
        :key="childPath"
        :nodePath="childPath"
        :nodes="nodes"
        :onToggle="onToggle"
        :onFileClick="onFileClick"
        :depth="depth + 1"
      />
    </template>
  </div>
</template>

<style>
/* unscoped — 递归组件需要全局样式 */
.ft-node {
  display: flex; align-items: center; gap: 4px;
  height: 28px; padding-right: var(--ls-space-2);
  font-size: var(--ls-text-xs); color: var(--ls-text-secondary);
  cursor: pointer; white-space: nowrap;
  transition: background-color var(--ls-duration-fast);
}
.ft-node:hover { background: var(--ls-bg-panel-hover); }
.ft-node__chevron { width: 14px; display: flex; align-items: center; justify-content: center; color: var(--ls-text-subtle); flex-shrink: 0; transition: transform 0.12s; }
.ft-node__chevron--open { transform: rotate(90deg); }
.ft-node__chevron--empty { visibility: hidden; }
.ft-node__icon { font-size: 13px; flex-shrink: 0; }
.ft-node__name { overflow: hidden; text-overflow: ellipsis; }
</style>
