<script setup lang="ts">


import { computed, ref, onMounted } from 'vue'


import { useNavigationStore } from '@/features/navigation/store/navigation.store'


import { useThemeStore } from '@/stores/theme.store'


import { useSettingsStore, type ProviderType } from '../store/settings.store'


import { useModelConfigsStore } from '../store/model-configs.store'


import { findPresetProvider } from '../data/preset-providers'


import type { ThemeMode } from '@/stores/app.store'


import { isConfigured } from '@/services/chat/chat.service'


import { checkForUpdate, downloadAndInstall, isChecking, updateInfo, progress, lastCheckTime, lastError, currentChannel } from '@/services/updater/updater.service'


import AddModelModal from './AddModelModal.vue'


import TrainingSettingsPanel from '@/features/training-data/components/TrainingSettingsPanel.vue'


import BetaStatusPane from '@/features/beta/components/BetaStatusPane.vue'


import BetaChangelogPane from '@/features/beta/components/BetaChangelogPane.vue'


import SelfHostReadinessPane from '@/features/self-host/components/SelfHostReadinessPane.vue'


import BootstrapQueuePane from '@/features/bootstrap/components/BootstrapQueuePane.vue'


import { useBetaFeedbackStore } from '@/features/beta/store/beta-feedback.store'


import { Sun, Moon, Check, AlertCircle, Globe, Key, Tag, ArrowRight, Zap, Eye, EyeOff, Download, RefreshCw, Loader, ExternalLink, Shield, Plus, Trash2, Settings, Database, Pencil, Plug, Beaker, MessageSquare, Rocket } from 'lucide-vue-next'


import type { UserModelConfig } from '../types/model-config.types'





const theme = useThemeStore()


const store = useSettingsStore()


const nav = useNavigationStore()


const mcStore = useModelConfigsStore()


const betaStore = useBetaFeedbackStore()


const showAddModel = ref(false)


const editTarget = ref<UserModelConfig | null>(null)





function handleOpenEdit(cfg: UserModelConfig) {


  editTarget.value = cfg


  showAddModel.value = true


}





function handleCloseModal() {


  showAddModel.value = false


  editTarget.value = null


}





// 应用版本号
const appVersion = ref('0.2.9')





onMounted(async () => {


  try {


    const app = await import('@tauri-apps/api/app').catch(() => null)


    if (app) {


      const version = await app.getVersion()


      appVersion.value = version


    }


  } catch {


    // 浏览器环境使用 package.json 版本


  }


})





const modes: { value: ThemeMode; label: string; icon: typeof Sun }[] = [


  { value: 'light', label: '浅色', icon: Sun },


  { value: 'dark', label: '深色', icon: Moon },


]





const providerTypes: { value: ProviderType; label: string; desc: string; icon: string }[] = [


  { value: 'openai-compatible', label: 'OpenAI 兼容接口', desc: '支持 OpenAI、DeepSeek、通义千问、智谱等兼容服务', icon: '🌐' },


  { value: 'openrouter', label: 'OpenRouter', desc: '统一网关接入多个模型供应商', icon: '🔀' },


  { value: 'ollama', label: 'Ollama 本地', desc: '本地运行，无需 API Key', icon: '💻' },


]





const hasConfig = computed(() => store.apiKey.trim().length > 0)


const canSave = computed(() => store.endpoint.trim().length > 0 && store.model.trim().length > 0)





function handleSave() {


  store.save()


}





// 更新相关方法


async function handleCheckUpdate() {


  try {


    await checkForUpdate()


  } catch (e) {


    console.error('检查更新失?', e)


  }


}





async function handleDownloadAndInstall() {


  try {


    await downloadAndInstall()


  } catch (e) {


    console.error('下载安装失败:', e)


  }


}





// R28.2: API Key 脱敏显示


function maskApiKey(key: string): string {


  if (!key) return '未配置'


  if (key.length <= 8) return '****'


  return key.slice(0, 4) + '****' + key.slice(-4)


}





// 格式化字节
function formatBytes(bytes: number): string {


  if (bytes === 0) return '0 B'


  const k = 1024


  const sizes = ['B', 'KB', 'MB', 'GB']


  const i = Math.floor(Math.log(bytes) / Math.log(k))


  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]


}


</script>





<template>


  <div class="settings">


    <div class="settings__header">


      <h1 class="settings__title">设置</h1>


      <div class="settings__tabs">


        <button


          :class="['settings__tab', { active: store.activeTab === 'provider' }]"


          @click="store.setActiveTab('provider')"


        >


          <Zap :size="14" /> 模型服务


        </button>


        <button


          :class="['settings__tab', { active: store.activeTab === 'appearance' }]"


          @click="store.setActiveTab('appearance')"


        >


          <Sun :size="14" /> 外观


        </button>


        <button


          :class="['settings__tab', { active: store.activeTab === 'update' }]"


          @click="store.setActiveTab('update')"


        >


          <Download :size="14" /> 更新


        </button>


        <button


          :class="['settings__tab', { active: store.activeTab === 'learning' }]"


          @click="store.setActiveTab('learning')"


        >


          <Database :size="14" /> Learning


        </button>


        <button


          :class="['settings__tab', { active: store.activeTab === 'beta' }]"


          @click="store.setActiveTab('beta')"


        >


          <Beaker :size="14" /> Beta


        </button>


        <button


          :class="['settings__tab', { active: store.activeTab === 'bootstrap' }]"


          @click="store.setActiveTab('bootstrap')"


        >


          <Rocket :size="14" /> Bootstrap


        </button>


      </div>


    </div>





    <div class="settings__body">


      <!-- ====== 模型配置?====== -->


      <section v-if="store.activeTab === 'provider'" class="settings__section">


        <div class="models-header">


          <div>


            <h2 class="settings__section-title">模型配置</h2>


            <p class="settings__section-hint">管理您的 AI 模型。添加服务商模型或自定义 API 端点。API Key 仅保存在本地。</p>


          </div>


          <button class="models-add-btn" @click="showAddModel = true">


            <Plus :size="14" /> 添加模型


          </button>


        </div>





        <!-- 首次引导 -->


        <div v-if="mcStore.configCount === 0" class="guide-banner">


          <div class="guide-banner__header">


            <div class="guide-banner__icon"><Zap :size="16" /></div>


            <div>


              <h3 class="guide-banner__title">添加您的第一?AI 模型</h3>


              <p class="guide-banner__desc">选择服务商快速配置，或使用自定义 API 端点。通常不超?1 分钟。</p>


            </div>


          </div>


          <button class="guide-banner__cta" @click="showAddModel = true">


            <Plus :size="13" /> 添加模型


          </button>


        </div>





        <!-- 模型列表 -->


        <div v-if="mcStore.configCount > 0" class="model-list">


          <div


            v-for="cfg in mcStore.configs"


            :key="cfg.id"


            :class="['model-card', { active: cfg.id === mcStore.activeConfigId }]"


            @click="mcStore.setActiveConfig(cfg.id)"


          >


            <div class="model-card__header">


              <span class="model-card__icon">


                {{ findPresetProvider(cfg.providerId)?.icon || '🔧' }}


              </span>


              <div class="model-card__info">


                <h4 class="model-card__name">{{ cfg.displayName }}</h4>


                <p class="model-card__meta">


                  {{ cfg.providerId === 'custom' ? '自定义' : findPresetProvider(cfg.providerId)?.name || cfg.providerId }}


                  · {{ cfg.modelId }}


                </p>


                <p class="model-card__key">


                  <Key :size="10" /> {{ maskApiKey(cfg.apiKey) }}


                </p>


              </div>


              <div class="model-card__actions">


                <span v-if="cfg.id === mcStore.activeConfigId" class="model-card__active-badge">


                  <Check :size="11" /> 当前使用


                </span>


                <button


                  class="model-card__edit"


                  title="编辑"


                  @click.stop="handleOpenEdit(cfg)"


                >


                  <Pencil :size="13" />


                </button>


                <button


                  class="model-card__delete"


                  title="删除"


                  @click.stop="mcStore.removeConfig(cfg.id)"


                >


                  <Trash2 :size="13" />


                </button>


              </div>


            </div>


            <div class="model-card__details">


              <span v-if="cfg.toolCallBudget > 0" class="model-card__tag">工具调用</span>


              <span v-if="cfg.multimodalEnabled" class="model-card__tag">多模</span>


              <span v-if="cfg.inputContextWindow" class="model-card__tag">{{ Math.round(cfg.inputContextWindow / 1000) }}K 上下</span>


            </div>


          </div>


        </div>





        <!-- ====== 配置完成?CTA ====== -->


        <div v-if="mcStore.configCount > 0" class="settings__cta">


          <div class="settings__cta-icon"><Check :size="14" /></div>


          <div class="settings__cta-body">


            <p class="settings__cta-title">{{ mcStore.activeConfig?.displayName || '模型' }} 已就。</p>


            <p class="settings__cta-desc">前往对话页面，开始与 AI 协作。</p>


          </div>


          <button class="settings__cta-btn" @click="nav.setView('chat')">


            去对?<ArrowRight :size="13" />


          </button>


        </div>


      </section>





      <!-- ====== 添加模型弹窗 ====== -->


      <AddModelModal


        v-if="showAddModel"


        :edit-config="editTarget"


        @close="handleCloseModal"


        @added="handleCloseModal"


        @saved="handleCloseModal"


      />





      <!-- ====== 外观?====== -->


      <section v-if="store.activeTab === 'appearance'" class="settings__section">


        <h2 class="settings__section-title">外观</h2>


        <div class="settings__row">


          <span class="settings__label">主题模式</span>


          <div class="settings__theme-toggle">


            <button


              v-for="m in modes" :key="m.value"


              :class="['settings__theme-btn', { active: theme.mode === m.value }]"


              @click="theme.setMode(m.value)"


            >


              <component :is="m.icon" :size="14" />


              <span>{{ m.label }}</span>


            </button>


          </div>


        </div>


      </section>





      <!-- ====== 更新?====== -->


      <section v-if="store.activeTab === 'update'" class="settings__section">


        <h2 class="settings__section-title">应用更新</h2>


        <p class="settings__section-hint">检查并安装最新版本，获取新功能和问题修复。</p>





        <div class="update-card">


          <!-- 当前版本信息 -->


          <div class="update-card__header">


            <div class="update-card__icon">


              <Shield :size="20" />


            </div>


            <div class="update-card__info">


              <h3 class="update-card__title">灵栈 LingStack</h3>


              <p class="update-card__version">当前版本：v{{ appVersion }}</p>


            </div>


          </div>





          <!-- 更新状?-->


          <div class="update-card__status">


            <!-- 检查中 -->


            <div v-if="isChecking" class="update-status update-status--checking">


              <Loader :size="16" class="spinning" />


              <span>正在检查更?..</span>


            </div>





            <!-- 有新版本 -->


            <div v-else-if="updateInfo?.available" class="update-status update-status--available">


              <Download :size="16" />


              <div class="update-status__content">


                <span class="update-status__label">发现新版：v{{ updateInfo.version }}</span>


                <span v-if="updateInfo.date" class="update-status__date">{{ updateInfo.date }}</span>


                <p v-if="updateInfo.body" class="update-status__body">{{ updateInfo.body }}</p>


              </div>


            </div>





            <!-- 已是最?-->


            <div v-else-if="updateInfo && !updateInfo.available" class="update-status update-status--latest">


              <Check :size="16" />


              <span>已是最新版</span>


            </div>





            <!-- 未检?-->


            <div v-else class="update-status update-status--idle">


              <RefreshCw :size="16" />


              <span>点击下方按钮检查更</span>


            </div>


          </div>





          <!-- 下载进度 -->


          <div v-if="progress.phase === 'downloading' || progress.phase === 'installing'" class="update-card__progress">


            <div class="progress-bar">


              <div class="progress-bar__fill" :style="{ width: progress.percent + '%' }"></div>


            </div>


            <div class="progress-info">


              <span class="progress-info__phase">


                {{ progress.phase === 'downloading' ? '正在下载...' : '正在安装...' }}


              </span>


              <span class="progress-info__percent">{{ progress.percent }}%</span>


            </div>


            <div v-if="progress.total > 0" class="progress-size">


              {{ formatBytes(progress.downloaded) }} / {{ formatBytes(progress.total) }}


            </div>


          </div>





          <!-- 错误信息（含诊断建议） -->


          <div v-if="progress.phase === 'error'" class="update-card__error">


            <AlertCircle :size="14" />


            <div class="update-card__error-body">


              <span class="update-card__error-msg">{{ progress.error }}</span>


              <span v-if="lastError?.kind === 'signature'" class="update-card__error-hint">
                签名校验失败 — 请通知开发者检查服务器 latest.json 中 signature 字段是否为空或不匹配
              </span>


              <span v-else-if="lastError?.kind === 'network'" class="update-card__error-hint">
                无法连接更新服务器 — 请检查网络连接或防火墙设置
              </span>


              <span v-else-if="lastError?.kind === 'server'" class="update-card__error-hint">
                服务器返回异常 — 更新源可能正在维护中
              </span>


            </div>


          </div>





          <!-- 操作按钮 -->


          <div class="update-card__actions">


            <button


              class="update-btn update-btn--check"


              :disabled="isChecking || progress.phase === 'downloading' || progress.phase === 'installing'"


              @click="handleCheckUpdate"


            >


              <RefreshCw :size="14" :class="{ spinning: isChecking }" />


              {{ isChecking ? '检查中...' : '检查更新' }}


            </button>





            <button


              v-if="updateInfo?.available"


              class="update-btn update-btn--install"


              :disabled="progress.phase === 'downloading' || progress.phase === 'installing'"


              @click="handleDownloadAndInstall"


            >


              <Download :size="14" />


              {{ progress.phase === 'downloading' ? '下载中..' : progress.phase === 'installing' ? '安装中..' : '下载并安装' }}


            </button>


          </div>





          <!-- 上次检查时?-->


          <div v-if="lastCheckTime" class="update-card__footer">


            <span class="update-card__last-check">上次检查：{{ lastCheckTime }}</span>


          </div>


        </div>





        <!-- 更新服务状?-->


        <div class="update-card__notice">


          <Globe :size="14" />


          <div>


            <p class="update-card__notice-title">更新服务已就绪</p>


            <p class="update-card__notice-desc">


              更新源：ai.tadanpay.cn（HTTPS）
              <br>当前版本：v{{ appVersion }}
              <br>更新通道：{{ currentChannel }}
              <br>签名密钥保存在本机安全目录，未提交到代码仓库。
            </p>


          </div>


        </div>


      </section>





      <!-- ====== Learning / Distillation ?====== -->


      <section v-if="store.activeTab === 'learning'" class="settings__section">


        <TrainingSettingsPanel />


      </section>





      <!-- ====== Beta / Feedback ?====== -->


      <section v-if="store.activeTab === 'beta'" class="settings__section">


        <h2 class="settings__section-title">Beta & Feedback</h2>


        <p class="settings__section-hint">LingStack beta status, version info, changelog, and self-host readiness.</p>





        <div class="beta-section">


          <BetaStatusPane />


        </div>


        <div class="beta-section">


          <BetaChangelogPane />


        </div>


        <div class="beta-section">


          <SelfHostReadinessPane />


        </div>


      </section>





      <!-- ====== Bootstrap ?====== -->


      <section v-if="store.activeTab === 'bootstrap'" class="settings__section">


        <h2 class="settings__section-title">Bootstrap Queue</h2>


        <p class="settings__section-hint">Self-bootstrap tasks derived from feedback, self-host gaps, or manually created.</p>


        <div class="beta-section">


          <BootstrapQueuePane />


        </div>


      </section>


    </div>


  </div>


</template>





<style scoped>


/* ---- Layout ---- */


.settings { display: flex; flex-direction: column; height: 100%; overflow: hidden; }





/* ---- Header ---- */


.settings__header {


  display: flex; align-items: center; justify-content: space-between;


  padding: 12px 20px;


  border-bottom: 1px solid var(--ls-border-soft);


  background: var(--ls-bg-surface);


}


.settings__title { font-size: 16px; font-weight: 600; color: var(--ls-text-primary); }


.settings__tabs { display: flex; gap: 4px; }


.settings__tab {


  display: flex; align-items: center; gap: 6px;


  padding: 5px 12px; border-radius: 6px;


  font-size: 12px; color: var(--ls-text-muted);


  background: transparent; border: none; cursor: pointer;


  transition: all .12s;


}


.settings__tab:hover { background: var(--ls-bg-panel-hover); color: var(--ls-text-secondary); }


.settings__tab.active { background: var(--ls-accent-soft); color: var(--ls-accent); font-weight: 500; }





/* ---- Body ---- */


.settings__body {


  flex: 1; overflow-y: auto;


  padding: 24px 20px;


  max-width: 680px;


}





/* ---- Guide Banner ---- */


.guide-banner {


  background: var(--ls-bg-elevated);


  border: 1px solid var(--ls-border-soft);


  border-radius: 10px; padding: 18px 20px;


  margin-bottom: 24px;


  animation: fadeSlideIn .3s ease;


}


@keyframes fadeSlideIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }


.guide-banner__header { display: flex; gap: 12px; margin-bottom: 14px; }


.guide-banner__icon {


  width: 32px; height: 32px; border-radius: 8px;


  background: var(--ls-accent-soft); color: var(--ls-accent);


  display: flex; align-items: center; justify-content: center;


  flex-shrink: 0;


}


.guide-banner__title { font-size: 14px; font-weight: 600; color: var(--ls-text-primary); }


.guide-banner__desc { font-size: 12px; color: var(--ls-text-subtle); margin-top: 2px; }


.guide-steps { display: flex; flex-direction: column; gap: 8px; }


.guide-step { display: flex; gap: 10px; align-items: flex-start; }


.guide-step__num {


  width: 20px; height: 20px; border-radius: 5px;


  background: var(--ls-accent-soft); color: var(--ls-accent);


  font-size: 11px; font-weight: 600;


  display: flex; align-items: center; justify-content: center;


  flex-shrink: 0; margin-top: 1px;


}


.guide-step__title { font-size: 12px; font-weight: 500; color: var(--ls-text-secondary); }


.guide-step__desc { font-size: 11px; color: var(--ls-text-subtle); margin-top: 1px; }





/* ---- Section ---- */


.settings__section { margin-bottom: 32px; }


.settings__section-title {


  font-size: 13px; font-weight: 600; color: var(--ls-text-primary);


  margin-bottom: 4px; padding-bottom: 8px;


  border-bottom: 1px solid var(--ls-divider);


}


.settings__section-hint {


  font-size: 11px; color: var(--ls-text-subtle);


  margin-bottom: 20px; line-height: 1.5;


}





/* ---- Theme ---- */


.settings__row { display: flex; align-items: center; justify-content: space-between; padding: 4px 0; }


.settings__label { font-size: 13px; color: var(--ls-text-secondary); }


.settings__theme-toggle { display: flex; gap: 0; border: 1px solid var(--ls-border-default); border-radius: 6px; overflow: hidden; }


.settings__theme-btn {


  display: flex; align-items: center; gap: 6px;


  padding: 6px 14px; font-size: 12px; color: var(--ls-text-muted);


  background: var(--ls-bg-surface); border: none; cursor: pointer;


  transition: all .12s;


}


.settings__theme-btn.active { background: var(--ls-accent-soft); color: var(--ls-accent); font-weight: 500; }


.settings__theme-btn:hover:not(.active) { background: var(--ls-bg-panel-hover); }





/* ---- Provider Type Selector ---- */


.provider-selector {


  display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px;


}


.provider-option {


  display: flex; flex-direction: column; align-items: flex-start; gap: 3px;


  padding: 10px 12px; border-radius: 8px;


  border: 1px solid var(--ls-border-soft);


  background: var(--ls-bg-surface); cursor: pointer;


  text-align: left; transition: all .12s;


}


.provider-option:hover { border-color: var(--ls-border-default); background: var(--ls-bg-panel-hover); }


.provider-option.active { border-color: var(--ls-accent); background: var(--ls-accent-soft); }


.provider-option__icon { font-size: 18px; }


.provider-option__label { font-size: 12px; font-weight: 500; color: var(--ls-text-secondary); }


.provider-option.active .provider-option__label { color: var(--ls-accent); }


.provider-option__desc { font-size: 10px; color: var(--ls-text-subtle); line-height: 1.4; }





/* ---- Form ---- */


.settings__form { display: flex; flex-direction: column; gap: 16px; }


.settings__field { display: flex; flex-direction: column; gap: 4px; }


.settings__field-label {


  display: flex; align-items: center; gap: 6px;


  font-size: 12px; font-weight: 500; color: var(--ls-text-secondary);


}


.settings__field-tag {


  font-size: 10px; padding: 1px 5px; border-radius: 3px;


  background: var(--ls-danger-soft, rgba(224,85,106,.1)); color: var(--ls-danger, #e0556a);


  font-weight: 500;


}


.settings__field-tag--optional {


  background: var(--ls-bg-panel-hover); color: var(--ls-text-muted);


}


.settings__field-hint {


  font-size: 10px; color: var(--ls-text-subtle); line-height: 1.4;


}


.settings__field-hint--inline { margin-left: 10px; align-self: center; }


.settings__input {


  height: 34px; padding: 0 12px;


  background: var(--ls-bg-surface); color: var(--ls-text-primary);


  border: 1px solid var(--ls-border-default); border-radius: 6px;


  font-family: var(--ls-font-mono); font-size: 12px; outline: none;


  transition: border-color .12s, box-shadow .12s;


}


.settings__input::placeholder { color: var(--ls-text-subtle); }


.settings__input:focus { border-color: var(--ls-accent); box-shadow: 0 0 0 3px var(--ls-accent-soft); }


.settings__input--short { width: 120px; flex-shrink: 0; }


.settings__input-row { display: flex; align-items: center; gap: 8px; }


.settings__input-row .settings__input { flex: 1; }


.settings__key-indicator {


  display: flex; align-items: center; gap: 3px;


  font-size: 10px; color: var(--ls-success); white-space: nowrap;


}


.settings__row-flex { display: flex; align-items: center; }





/* ---- Advanced ---- */


.settings__advanced { margin-top: -8px; }


.settings__advanced-summary {


  font-size: 11px; color: var(--ls-text-subtle); cursor: pointer;


  padding: 4px 0; user-select: none;


}


.settings__advanced-summary:hover { color: var(--ls-text-muted); }


.settings__advanced-body {


  display: flex; flex-direction: column; gap: 12px;


  padding-top: 8px; padding-left: 4px;


}





/* ---- Footer ---- */


.settings__form-footer { display: flex; align-items: center; gap: 12px; padding-top: 4px; }


.settings__save-btn {


  padding: 7px 20px; border-radius: 6px;


  background: var(--ls-accent); color: #fff;


  font-size: 12px; font-weight: 500; border: none; cursor: pointer;


  transition: background .12s, opacity .12s;


}


.settings__save-btn:hover:not(:disabled) { background: var(--ls-accent-hover); }


.settings__save-btn:active:not(:disabled) { background: var(--ls-accent-active); }


.settings__save-btn:disabled { opacity: .4; cursor: not-allowed; }


.settings__status { display: flex; align-items: center; gap: 4px; font-size: 11px; }


.settings__status--ok { color: var(--ls-success); }


.settings__status--err { color: var(--ls-danger); }





/* ---- Models Header ---- */


.models-header {


  display: flex; align-items: flex-start; justify-content: space-between;


  margin-bottom: 16px;


}


.models-header .settings__section-title { margin-bottom: 0; padding-bottom: 0; border-bottom: none; }


.models-header .settings__section-hint { margin-bottom: 0; margin-top: 4px; }


.models-add-btn {


  display: flex; align-items: center; gap: 5px;


  padding: 7px 14px; border-radius: 6px;


  background: var(--ls-accent); color: #fff;


  font-size: 12px; font-weight: 500;


  border: none; cursor: pointer; white-space: nowrap;


  transition: background .12s;


  flex-shrink: 0;


}


.models-add-btn:hover { background: var(--ls-accent-hover); }





/* ---- Guide Banner CTA ---- */


.guide-banner__cta {


  display: flex; align-items: center; gap: 5px;


  margin-top: 12px; padding: 8px 18px; border-radius: 7px;


  background: var(--ls-accent); color: #fff;


  font-size: 12px; font-weight: 500;


  border: none; cursor: pointer;


  transition: background .12s;


}


.guide-banner__cta:hover { background: var(--ls-accent-hover); }





/* ---- Model List ---- */


.model-list { display: flex; flex-direction: column; gap: 8px; margin-bottom: 20px; }





.model-card {


  background: var(--ls-bg-elevated);


  border: 1px solid var(--ls-border-soft);


  border-radius: 10px; padding: 14px 16px;


  cursor: pointer; transition: all .12s;


}


.model-card:hover { border-color: var(--ls-border-default); }


.model-card.active { border-color: var(--ls-accent); background: var(--ls-accent-soft); }





.model-card__header { display: flex; align-items: center; gap: 12px; }


.model-card__icon { font-size: 22px; flex-shrink: 0; }


.model-card__info { flex: 1; min-width: 0; }


.model-card__name {


  font-size: 13px; font-weight: 600; color: var(--ls-text-primary);


  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;


}


.model-card__meta {


  font-size: 11px; color: var(--ls-text-muted); margin-top: 2px;


  font-family: var(--ls-font-mono);


  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;


}


.model-card__key {


  display: flex; align-items: center; gap: 3px;


  font-size: 10px; color: var(--ls-text-hint); margin-top: 3px;


  font-family: var(--ls-font-mono);


}


.model-card__actions { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }


.model-card__active-badge {


  display: flex; align-items: center; gap: 3px;


  font-size: 10px; font-weight: 500; color: var(--ls-accent);


  padding: 2px 8px; border-radius: 4px;


  background: var(--ls-accent-soft);


}


.model-card__edit {


  width: 26px; height: 26px; border-radius: 5px;


  display: flex; align-items: center; justify-content: center;


  background: transparent; border: none; color: var(--ls-text-muted); cursor: pointer;


  transition: all .12s;


}


.model-card__edit:hover { background: var(--ls-accent-soft); color: var(--ls-accent); }


.model-card__delete {


  width: 26px; height: 26px; border-radius: 5px;


  display: flex; align-items: center; justify-content: center;


  background: transparent; border: none; color: var(--ls-text-muted); cursor: pointer;


  transition: all .12s;


}


.model-card__delete:hover { background: var(--ls-danger-soft, rgba(224,85,106,.1)); color: var(--ls-danger, #e0556a); }





.model-card__details { display: flex; gap: 6px; margin-top: 10px; padding-top: 10px; border-top: 1px solid var(--ls-divider); }


.model-card__tag {


  font-size: 10px; padding: 2px 7px; border-radius: 4px;


  background: var(--ls-bg-panel-hover); color: var(--ls-text-muted);


}





/* ---- CTA ---- */


.settings__cta {


  display: flex; align-items: center; gap: 12px;


  margin-top: 20px; padding: 14px 16px;


  border: 1px solid var(--ls-success-soft, rgba(46,196,128,.15));


  border-radius: 8px;


  background: var(--ls-success-soft, rgba(46,196,128,.05));


}


.settings__cta-icon {


  width: 28px; height: 28px; border-radius: 7px;


  background: rgba(46,196,128,.12); color: var(--ls-success);


  display: flex; align-items: center; justify-content: center;


  flex-shrink: 0;


}


.settings__cta-body { flex: 1; }


.settings__cta-title { font-size: 12px; font-weight: 500; color: var(--ls-text-primary); }


.settings__cta-desc { font-size: 11px; color: var(--ls-text-subtle); margin-top: 1px; }


.settings__cta-btn {


  display: flex; align-items: center; gap: 5px;


  padding: 6px 14px; border-radius: 6px;


  background: var(--ls-accent-soft); color: var(--ls-accent);


  font-size: 11px; font-weight: 500; border: none; cursor: pointer;


  transition: background .12s; white-space: nowrap;


}


.settings__cta-btn:hover { background: var(--ls-accent); color: #fff; }





/* ---- Update Card ---- */


.update-card {


  background: var(--ls-bg-elevated);


  border: 1px solid var(--ls-border-soft);


  border-radius: 10px;


  padding: 20px;


  margin-bottom: 20px;


}





.update-card__header {


  display: flex;


  gap: 14px;


  align-items: center;


  margin-bottom: 18px;


  padding-bottom: 18px;


  border-bottom: 1px solid var(--ls-divider);


}





.update-card__icon {


  width: 44px;


  height: 44px;


  border-radius: 10px;


  background: var(--ls-accent-soft);


  color: var(--ls-accent);


  display: flex;


  align-items: center;


  justify-content: center;


  flex-shrink: 0;


}





.update-card__info {


  flex: 1;


}





.update-card__title {


  font-size: 15px;


  font-weight: 600;


  color: var(--ls-text-primary);


}





.update-card__version {


  font-size: 12px;


  color: var(--ls-text-muted);


  margin-top: 3px;


  font-family: var(--ls-font-mono);


}





/* Update Status */


.update-card__status {


  margin-bottom: 16px;


}





.update-status {


  display: flex;


  align-items: flex-start;


  gap: 10px;


  padding: 12px 14px;


  border-radius: 8px;


  font-size: 13px;


}





.update-status--checking {


  background: var(--ls-bg-panel-hover);


  color: var(--ls-text-secondary);


}





.update-status--available {


  background: var(--ls-accent-soft);


  color: var(--ls-accent);


  border: 1px solid var(--ls-accent);


}





.update-status__content {


  flex: 1;


}





.update-status__label {


  font-weight: 500;


  display: block;


}





.update-status__date {


  font-size: 11px;


  color: var(--ls-text-muted);


  margin-top: 2px;


  display: block;


}





.update-status__body {


  font-size: 12px;


  color: var(--ls-text-secondary);


  margin-top: 8px;


  line-height: 1.5;


  white-space: pre-line;


}





.update-status--latest {


  background: var(--ls-success-soft, rgba(46,196,128,.08));


  color: var(--ls-success);


}





.update-status--idle {


  background: var(--ls-bg-panel-hover);


  color: var(--ls-text-muted);


}





/* Progress */


.update-card__progress {


  margin-bottom: 16px;


}





.progress-bar {


  height: 6px;


  background: var(--ls-bg-panel-hover);


  border-radius: 3px;


  overflow: hidden;


  margin-bottom: 8px;


}





.progress-bar__fill {


  height: 100%;


  background: var(--ls-accent);


  border-radius: 3px;


  transition: width .3s ease;


}





.progress-info {


  display: flex;


  justify-content: space-between;


  align-items: center;


  font-size: 12px;


  color: var(--ls-text-secondary);


}





.progress-info__percent {


  font-weight: 500;


  font-family: var(--ls-font-mono);


}





.progress-size {


  font-size: 11px;


  color: var(--ls-text-muted);


  margin-top: 4px;


  font-family: var(--ls-font-mono);


}





/* Error */


.update-card__error {


  display: flex;


  align-items: flex-start;


  gap: 8px;


  padding: 10px 14px;


  background: var(--ls-danger-soft, rgba(224,85,106,.08));


  border-radius: 6px;


  color: var(--ls-danger);


  font-size: 12px;


  margin-bottom: 16px;


}





/* Actions */


.update-card__actions {


  display: flex;


  gap: 10px;


  margin-bottom: 14px;


}





.update-btn {


  display: flex;


  align-items: center;


  gap: 6px;


  padding: 8px 16px;


  border-radius: 6px;


  font-size: 12px;


  font-weight: 500;


  border: none;


  cursor: pointer;


  transition: all .12s;


}





.update-btn:disabled {


  opacity: .5;


  cursor: not-allowed;


}





.update-btn--check {


  background: var(--ls-bg-surface);


  color: var(--ls-text-secondary);


  border: 1px solid var(--ls-border-default);


}





.update-btn--check:hover:not(:disabled) {


  background: var(--ls-bg-panel-hover);


  border-color: var(--ls-border-strong);


}





.update-btn--install {


  background: var(--ls-accent);


  color: #fff;


}





.update-btn--install:hover:not(:disabled) {


  background: var(--ls-accent-hover);


}





/* Footer */


.update-card__footer {


  padding-top: 12px;


  border-top: 1px solid var(--ls-divider);


}





.update-card__last-check {


  font-size: 11px;


  color: var(--ls-text-subtle);


}





/* Notice */


.update-card__notice {


  display: flex;


  gap: 10px;


  padding: 14px 16px;


  background: var(--ls-bg-elevated);


  border: 1px solid var(--ls-border-soft);


  border-radius: 8px;


  color: var(--ls-text-muted);


}





.update-card__notice-title {


  font-size: 12px;


  font-weight: 500;


  color: var(--ls-text-secondary);


  margin-bottom: 4px;


}





.update-card__notice-desc {


  font-size: 11px;


  color: var(--ls-text-subtle);


  line-height: 1.5;


}





/* ---- Beta Section ---- */


.beta-section { margin-bottom: 16px; }


.beta-section:last-child { margin-bottom: 0; }





/* Spinning animation */


.spinning {


  animation: spin 1s linear infinite;


}





@keyframes spin {


  from { transform: rotate(0deg); }


  to { transform: rotate(360deg); }


}


</style>


