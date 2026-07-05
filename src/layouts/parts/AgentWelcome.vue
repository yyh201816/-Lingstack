<script setup lang="ts">
/**
 * AgentWelcome — 品牌欢迎页 + 任务起点
 *
 * DOM 结构：
 *   section.ls-agent-welcome
 *   └─ .ls-agent-welcome__inner
 *        ├─ .ls-agent-welcome__brand → 品牌标识 + kicker
 *        ├─ .ls-agent-welcome__hero → 主标题 + 副标题
 *        ├─ .ls-agent-welcome__intro → 引导标题 + 文本
 *        ├─ .ls-agent-welcome__actions → 四张卡片 (article × 4)
 *        └─ .ls-agent-welcome__footnote → 底部补充说明
 */
import { useNavigationStore } from '@/features/navigation/store/navigation.store'
import { FolderOpen, Key, Globe, Zap } from 'lucide-vue-next'
import logoIcon from '@/assets/logo-32x32.png'

const props = defineProps<{ onOpenProject: () => void }>()
const nav = useNavigationStore()

const cards = [
  {
    id: 'open-project',
    icon: FolderOpen,
    title: '打开本地项目',
    text: '加载代码、文档或资料目录，建立当前工作区上下文',
    actionLabel: '选择文件夹',
    action: () => props.onOpenProject(),
  },
  {
    id: 'config-model',
    icon: Key,
    title: '配置模型连接',
    text: '添加 API Key、模型名称与服务地址，开始真实 AI 对话',
    actionLabel: '前往设置',
    action: () => nav.setView('settings'),
  },
  {
    id: 'connect-services',
    icon: Globe,
    title: '连接服务能力',
    text: '接入本地命令、工具链或服务端能力，扩展 Agent 可执行范围',
    actionLabel: '查看服务',
    action: () => nav.setView('servers'),
  },
  {
    id: 'create-skill',
    icon: Zap,
    title: '创建技能模块',
    text: '沉淀常用流程、提示模板与自动化能力，形成可复用工作流',
    actionLabel: '开始创建',
    action: () => nav.setView('skills'),
  },
]
</script>

<template>
  <section class="ls-agent-welcome">
    <div class="ls-agent-welcome__inner">
      <!-- 1. 品牌标识区 -->
      <div class="ls-agent-welcome__brand">
        <div class="ls-agent-welcome__brand-mark">
          <img class="ls-agent-welcome__brand-logo" :src="logoIcon" alt="灵栈" width="28" height="28" />
        </div>
        <p class="ls-agent-welcome__brand-kicker">LINGSTACK AGENT</p>
      </div>

      <!-- 2. 主标题区 -->
      <div class="ls-agent-welcome__hero">
        <h1 class="ls-agent-welcome__title">灵栈 AI 工作台</h1>
        <p class="ls-agent-welcome__subtitle">
          围绕本地项目、任务执行与多模型协作而设计的桌面工作台
        </p>
      </div>

      <!-- 3. 引导区 -->
      <div class="ls-agent-welcome__intro">
        <h2 class="ls-agent-welcome__intro-title">从一个清晰的起点开始</h2>
        <p class="ls-agent-welcome__intro-text">
          你可以先打开本地项目、接入模型能力，或直接进入下一步任务流
        </p>
      </div>

      <!-- 4. 四张快捷卡片 -->
      <div class="ls-agent-welcome__actions">
        <article
          v-for="card in cards" :key="card.id"
          class="ls-agent-welcome__card"
        >
          <div class="ls-agent-welcome__card-icon">
            <component :is="card.icon" :size="20" />
          </div>
          <div class="ls-agent-welcome__card-body">
            <h3 class="ls-agent-welcome__card-title">{{ card.title }}</h3>
            <p class="ls-agent-welcome__card-text">{{ card.text }}</p>
          </div>
          <button class="ls-agent-welcome__card-action" @click="card.action">
            {{ card.actionLabel }}
          </button>
        </article>
      </div>

      <!-- 5. 底部补充说明 -->
      <div class="ls-agent-welcome__footnote">
        <p class="ls-agent-welcome__footnote-text">
          LingStack 更适合持续处理项目、文件、命令与 AI 协作任务，而不是一次性聊天
        </p>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* ====== 1. root ====== */
.ls-agent-welcome {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; flex: 1;
  min-height: 0; overflow-y: auto;
}
.ls-agent-welcome__inner {
  display: flex; flex-direction: column; align-items: center;
  padding: 72px 24px 40px; gap: 0;
  max-width: 760px; width: 100%;
}

/* ====== 2. major blocks ====== */
.ls-agent-welcome__brand {
  display: flex; flex-direction: column; align-items: center; gap: 12px;
  margin-bottom: 4px;
}
.ls-agent-welcome__hero {
  text-align: center;
}
.ls-agent-welcome__intro {
  text-align: center; margin-top: 28px;
}
.ls-agent-welcome__actions {
  display: grid; grid-template-columns: repeat(2, 1fr);
  gap: 14px; width: 100%; margin-top: 28px;
}
.ls-agent-welcome__footnote {
  margin-top: var(--ls-space-6); text-align: center;
}

/* ====== 3. children ====== */

/* brand */
.ls-agent-welcome__brand-mark {
  width: 56px; height: 56px;
  border-radius: 18px;
  border: 1px solid var(--ls-border-soft);
  background: linear-gradient(180deg, var(--ls-bg-elevated), var(--ls-bg-surface-2));
  box-shadow: 0 10px 30px rgba(79,110,247,0.08);
  display: flex; align-items: center; justify-content: center;
}
.ls-agent-welcome__brand-logo {
  width: 28px; height: 28px;
  display: block;
  image-rendering: auto;
  opacity: 0.85;
}
.ls-agent-welcome__brand-kicker {
  font-size: var(--ls-font-micro);
  font-weight: var(--ls-weight-title);
  letter-spacing: 0.08em;
  color: var(--ls-accent);
  text-transform: uppercase;
  margin: 0;
}

/* hero */
.ls-agent-welcome__title {
  font-size: var(--ls-font-display);
  font-weight: var(--ls-weight-display);
  color: var(--ls-text-strong);
  line-height: var(--ls-leading-display);
  margin: 0 0 10px;
}
.ls-agent-welcome__subtitle {
  font-size: 15px;
  font-weight: var(--ls-weight-body);
  color: var(--ls-text-body);
  line-height: 1.7;
  max-width: 620px; margin: 0 auto;
}

/* intro */
.ls-agent-welcome__intro-title {
  font-size: var(--ls-font-h2);
  font-weight: var(--ls-weight-title);
  color: var(--ls-text-main);
  margin: 0 0 8px;
}
.ls-agent-welcome__intro-text {
  font-size: var(--ls-font-body-sm);
  font-weight: var(--ls-weight-body);
  color: var(--ls-text-weak);
  line-height: var(--ls-leading-body);
  margin: 0;
}

/* card */
.ls-agent-welcome__card {
  display: flex; align-items: center; gap: 14px;
  padding: 16px;
  border-radius: var(--ls-radius-lg);
  border: 1px solid var(--ls-border-default);
  background: var(--ls-bg-elevated);
  box-shadow: var(--ls-shadow-xs);
  cursor: pointer;
  transition: all var(--ls-duration-base) ease;
}
.ls-agent-welcome__card-icon {
  width: 40px; height: 40px; border-radius: 10px;
  background: var(--ls-accent-soft); color: var(--ls-accent);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  transition: background var(--ls-duration-slow);
}
.ls-agent-welcome__card-body {
  flex: 1; min-width: 0;
}
.ls-agent-welcome__card-title {
  font-size: 15px; font-weight: var(--ls-weight-title);
  color: var(--ls-text-main); margin: 0 0 4px; line-height: 1.2;
}
.ls-agent-welcome__card-text {
  font-size: var(--ls-font-body-sm);
  font-weight: var(--ls-weight-body);
  color: var(--ls-text-body);
  line-height: var(--ls-leading-body); margin: 0;
}
.ls-agent-welcome__card-action {
  height: 32px; padding: 0 10px;
  border-radius: var(--ls-radius-pill);
  border: 1px solid var(--ls-border-default);
  background: var(--ls-bg-surface);
  font-size: var(--ls-font-body-sm);
  font-weight: var(--ls-weight-subtitle);
  color: var(--ls-accent);
  white-space: nowrap; flex-shrink: 0;
  cursor: pointer;
  display: flex; align-items: center;
  transition: all var(--ls-duration-fast) ease;
}

/* footnote */
.ls-agent-welcome__footnote-text {
  font-size: var(--ls-font-caption);
  color: var(--ls-text-weak);
  line-height: var(--ls-leading-body);
  margin: 0;
}

/* ====== 4. states ====== */
.ls-agent-welcome__card:hover {
  transform: translateY(-2px);
  border-color: var(--ls-border-accent);
  box-shadow: 0 12px 30px rgba(79,110,247,0.08);
  background: var(--ls-bg-elevated);
}
.ls-agent-welcome__card:active {
  transform: translateY(0) scale(0.995);
  box-shadow: var(--ls-shadow-sm);
}
.ls-agent-welcome__card:focus-within,
.ls-agent-welcome__card:focus-visible {
  outline: none;
  border-color: var(--ls-border-accent-strong);
  box-shadow: var(--ls-focus-ring);
}
.ls-agent-welcome__card:hover .ls-agent-welcome__card-icon {
  background: var(--ls-accent-soft);
}
.ls-agent-welcome__card:hover .ls-agent-welcome__card-action {
  border-color: var(--ls-border-accent);
  background: var(--ls-bg-elevated);
}
.ls-agent-welcome__card:active .ls-agent-welcome__card-action {
  transform: scale(0.98);
}
</style>
