# 灵栈 LingStack v0.1.4-beta R30 — Distillation Alpha 训练数据闭环与不可复制 Chat 报告

> 日期：2026-07-03  
> 轮次：R30  
> 范围：Distillation Alpha + Chat 去复制化 + Learning 设置面板 + 数据集打包/上传预闭环

---

## 1. 当前阶段判断

**Beta usable workbench → Self-bootstrap transition（训练数据层 Phase 0 → Distillation Alpha）**

- Chat 主链已可用（R29.2 修复后）
- 模型配置链已打通（R28.1/R29.2）
- 训练数据层从 Phase 0（纯本地采集）推进到 Distillation Alpha（脱敏打包+上传预闭环）

---

## 2. 为什么这轮不是"直接训练模型"

当前 LingStack **不做**：
- 程序内即时训练
- GPU 推理/训练
- 云端直接微调
- 模型权重下载/管理

**当前做的是**：
1. 本地脱敏采样（redacted samples）
2. 质量筛选（qualityScore >= 5）
3. 数据集打包（manifest + JSONL + metrics，不含 raw transcript）
4. 上传服务器同步（mock endpoint 预闭环，真实 endpoint 预留）

这是模型蒸馏的**数据准备层**，不是训练本身。

---

## 3. 已复用的旧代码基础

| 文件 | 复用内容 |
|------|----------|
| `training-data.types.ts` | TrainingSample / TrainingConfig / TrainingStats 类型定义（完整复用） |
| `training-data.service.ts` | CRUD + localStorage 持久化 + 质量评分筛选（完整复用） |
| `training-data.store.ts` | Pinia store 包装 + 高质量样本查询（完整复用） |
| `data-redaction.service.ts` | 11 种敏感信息脱敏 + detectSensitiveContent（完整复用） |
| `sample-export.service.ts` | JSONL 格式化 + 浏览器下载（保留，但上传走新链路） |
| `quality-score.service.ts` | 评分规则引擎（已调整：移除 copied 依赖） |

---

## 4. 本轮新增文件与改动文件

### 新增文件（6 个）

| # | 文件 | 说明 |
|---|------|------|
| 1 | `training-sync.types.ts` | DatasetManifest / DatasetMetrics / DatasetPackage / UploadRequest / SyncRecord / TrainingSettings 类型 |
| 2 | `training-settings.store.ts` | Learning Mode 开关 / 上传开关 / 设备 ID / 同步记录持久化 |
| 3 | `components/TrainingSettingsPanel.vue` | Learning 设置 UI（开关+统计+设备信息+打包上传按钮+同步记录） |
| 4 | `dataset-package.service.ts` | 从高质量样本生成 redacted dataset package（SHA256 指纹+二次脱敏+敏感检测） |
| 5 | `dataset-upload.service.ts` | 上传服务（mock endpoint + 真实 endpoint 预留 + 失败重试 + 状态标记） |
| 6 | `docs/灵栈-LingStack-v0.1.4-beta-R30-...报告.md` | 本报告 |

### 改动文件（4 个）

| # | 文件 | 改动 |
|---|------|------|
| 1 | `ChatPanel.vue` | 去复制化：删除 Copy/Check 图标导入 + 删除 copiedId 状态 + 删除 copyMessage 函数 + 删除复制按钮模板 + user-select:none + copy/cut 事件拦截 |
| 2 | `quality-score.service.ts` | 移除 `copied` 评分规则（+2），保留 accepted(+3)/success(+1)/regenerated(-1)/edited(-2)/rejected(-5) |
| 3 | `SettingsPanel.vue` | 新增 Learning tab 按钮 + Learning section + 导入 TrainingSettingsPanel |
| 4 | `settings.store.ts` | activeTab 类型扩展为 `'learning'` |

---

## 5. Dataset Package 结构

```
打包输出（每次 buildDatasetPackage 调用）：
├── manifest.json
│   ├── packageId (UUID)
│   ├── deviceId (匿名设备 ID)
│   ├── appVersion ("0.1.4")
│   ├── createdAt (ISO 时间)
│   ├── sampleCount (clean records 数)
│   ├── acceptedCount / rejectedCount
│   ├── avgQualityScore
│   ├── includedTaskTypes
│   ├── redactionVersion (2)
│   ├── formatVersion (1)
│   ├── sha256 (JSONL 文件 SHA256)
│   └── fileName ("lingstack-distill-{date}-{device}-{count}.json")
├── dataset (JSONL string)
│   └── 每行一条 redacted SFT record:
│       ├── instruction (脱敏后用户输入)
│       ├── output (脱敏后模型输出)
│       ├── system (可选，脱敏后 system prompt)
│       └── metadata (id/taskType/sourceModel/qualityScore/accepted/success/createdAt)
└── metrics
    ├── totalSamples / highQualityCount
    ├── acceptedCount / rejectedCount
    ├── avgQualityScore
    ├── byTaskType
    └── generatedAt
```

**红线保证**：
- 严禁 raw transcript / API Key / 密码 / email / IP 出现在 dataset 中
- 上传前二次 `redactText()` + `detectSensitiveContent()` 检测
- 有问题的记录直接跳过，不进入 package

---

## 6. Upload Contract

```
POST {uploadBaseUrl}/upload
Content-Type: application/json

{
  manifest: DatasetManifest,
  dataset: string (JSONL),
  metrics: DatasetMetrics
}

Response:
{ success: boolean, packageId?: string, message?: string, error?: string }
```

当前状态：**Mock endpoint**（800ms 延迟模拟成功），真实 endpoint 预留但未接入。

客户端流程：
1. 校验上传开关 → 2. 校验样本数 > 0 → 3. 打包（二次脱敏+敏感检测）→ 4. 上传 → 5. 标记 synced/failed → 6. 更新统计

---

## 7. No-Copy Chat Surface 改造说明

| 改动 | 说明 |
|------|------|
| 删除 Copy/Check 图标导入 | `import { Copy, Check }` 移除 |
| 删除 `copiedId` 状态 | `const copiedId = ref<string \| null>(null)` 移除 |
| 删除 `copyMessage()` 函数 | 包含 `navigator.clipboard.writeText` 的完整函数移除 |
| 删除复制按钮模板 | `v-else-if="msg.role === 'assistant' && !msg.isStreaming && msg.content"` 块移除 |
| CSS: user-select:none | `.chat-panel__content` 添加 `user-select: none; -webkit-user-select: none` |
| JS: copy/cut 事件拦截 | `messagesContainer.addEventListener('copy', e => e.preventDefault())` + `cut` 同理 |

---

## 8. 验证结果

| # | 场景 | 结果 |
|---|------|------|
| 1 | Chat 正常发消息 | ✅ 不受影响 |
| 2 | 发送后产生 training sample | ✅ trainingData 收集链路未变 |
| 3 | sample 经 redaction 后保存 | ✅ data-redaction.service 完整复用 |
| 4 | Learning 设置区看到样本统计 | ✅ TrainingSettingsPanel 展示 stats |
| 5 | 能成功打包 high-quality dataset | ✅ buildDatasetPackage(5) → manifest+JSONL+metrics |
| 6 | 打包结果不含 raw secret | ✅ 二次 redactText + detectSensitiveContent 过滤 |
| 7 | Chat 消息无法通过按钮复制 | ✅ 复制按钮已删除 |
| 8 | Chat 消息区域无法直接文本选择复制 | ✅ user-select:none + copy 事件拦截 |
| 9 | 上传开关关闭时被拦截 | ✅ uploadDatasetPackage 校验 isUploadEnabled |
| 10 | 上传开关开启后 mock 流程走通 | ✅ mock endpoint 800ms 延迟 → synced |
| 11 | 上传失败不影响聊天 | ✅ 上传错误仅显示在 TrainingSettingsPanel |
| 12 | `npx vue-tsc --noEmit` | ✅ 零错误 |
| 13 | `npm run build` | ✅ 3049 模块，3.21s，零错误 |

---

## 9. 剩余缺口

| # | 缺口 | 优先级 | 说明 |
|---|------|--------|------|
| 1 | **Tool Runtime 缺口** | P0 | LingStack 无法回答"当前北京时间"等问题，根因是缺少 tool runtime（time/web/system call），不是蒸馏能解决的 |
| 2 | 真实上传 endpoint | P1 | 当前 mock endpoint，需服务器端实现 `POST /api/learning/upload` |
| 3 | 数据集质量审核 UI | P2 | 当前只在打包时自动过滤，无手动审核界面 |
| 4 | DPO 数据集 | P3 | 当前只有 SFT 格式，chosen/rejected 对不足 |
| 5 | 上传队列持久化 | P3 | 当前上传失败后需手动重试 |
| 6 | 服务器端存储与聚合 | P2 | 需要后端接收+存储+去重+聚合服务 |

---

## 10. 关键结论

**当前灵栈在"实时北京时间"这类问题上表现不佳，根因首先是缺少 tool runtime（如 time/web/system call），不是单靠蒸馏即可解决。**

Distillation Alpha 解决的是"如何把好的对话积累成训练数据"，但不解决"模型本身缺少实时信息获取能力"。Tool Runtime 是下一层独立问题。

---

## 11. 下一步建议

1. **R31**：实现最小 Tool Runtime（至少 time tool），让 LingStack 能回答时间相关问题
2. **R32**：真实上传 endpoint 实现（服务器端 `/api/learning/upload`）
3. **R33**：数据集质量审核 UI（手动标记/删除/修改样本）
