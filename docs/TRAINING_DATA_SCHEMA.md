# Training Data Schema — LingStack vNext

> 结构化记录用户在灵栈中的 AI 使用过程，为 SFT / DPO / 蒸馏自有模型准备。

---

## 核心样本类型

### TrainingSample

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | `string` | UUID v4 |
| `taskType` | `TaskType` | 任务类型（10 种） |
| `sourceModel` | `string` | 来源模型名（如 `gpt-4o-mini`） |
| `userInput` | `string` | 用户原始输入（已脱敏） |
| `systemPrompt` | `string` | 系统提示词 |
| `contextSnapshot` | `ContextSnapshot` | 工作台上下文快照 |
| `modelOutput` | `string` | 模型原始输出（已脱敏） |
| `finalOutput` | `string` | 最终呈现给用户的输出 |
| `userFeedback` | `string` | 用户反馈文本 |
| `accepted` | `boolean` | 用户采纳了回答 |
| `rejected` | `boolean` | 用户否决了回答 |
| `regenerated` | `boolean` | 用户请求重新生成 |
| `editedByUser` | `string` | 用户手动编辑的内容 |
| `success` | `boolean` | 任务是否成功 |
| `qualityScore` | `number` | 质量评分 |
| `copied` | `boolean` | 用户复制了输出 |
| `codeTask?` | `CodeTaskInfo` | 代码任务扩展信息 |
| `imageTask?` | `ImageTaskInfo` | 图片生成任务扩展信息 |
| `createdAt` | `string` | ISO 创建时间 |
| `updatedAt` | `string` | ISO 更新时间 |

---

## 任务类型 (TaskType)

| 类型 | 说明 | 典型场景 |
|------|------|----------|
| `chat` | 对话 | ChatPanel 问答 |
| `code_modify` | 代码修改 | 编辑器内 AI 修改代码 |
| `code_review` | 代码审查 | AI 审查代码 |
| `shell_debug` | 终端调试 | 终端内 AI 辅助 |
| `image_prompt` | 图片提示词 | AI 优化图片 prompt |
| `image_generate` | 图片生成 | 图片生成任务 |
| `skill_execution` | 技能执行 | Skill 调用与结果 |
| `agent_task` | Agent 任务 | Agent 自主任务 |
| `context_build` | 上下文构建 | 工作区上下文组装 |
| `model_routing` | 模型路由 | 模型选择与切换 |

---

## 扩展信息

### CodeTaskInfo（代码任务）

| 字段 | 类型 | 说明 |
|------|------|------|
| `relatedFiles` | `string[]` | 相关文件列表 |
| `diffText` | `string` | diff 文本 |
| `applied` | `boolean` | 是否应用 |
| `buildPassed` | `boolean` | 构建是否通过 |
| `rollback` | `boolean` | 是否回滚 |

### ImageTaskInfo（图片任务）

| 字段 | 类型 | 说明 |
|------|------|------|
| `originalPrompt` | `string` | 原始 prompt |
| `optimizedPrompt` | `string` | 优化后 prompt |
| `imageModel` | `string` | 图片模型 |
| `selectedImageIndex` | `number` | 选中图片索引 |
| `revisionRequest` | `string` | 修改请求 |

### ContextSnapshot（上下文快照）

| 字段 | 类型 | 说明 |
|------|------|------|
| `projectPath` | `string` | 项目路径 |
| `activeFilePath` | `string` | 当前文件路径 |
| `activeFileName` | `string` | 文件名 |
| `fileContentTruncated` | `string` | 截断后的文件内容（<=2000 字符） |
| `selectedText` | `string` | 选中文本 |
| `openTabs` | `number` | 打开的 Tab 数量 |

---

## 质量评分规则

| 事件 | 分值 | 说明 |
|------|------|------|
| 用户采纳 | +3 | accepted = true |
| 用户复制 | +2 | copied = true |
| 任务成功 | +1 | success = true |
| 重新生成 | -1 | regenerated = true |
| 用户大幅修改 | -2 | editedByUser 超过 50 字符 |
| 用户否决 | -5 | rejected = true |
| 代码已应用 | +3 | codeTask.applied = true |
| 构建通过 | +5 | codeTask.buildPassed = true |
| 用户回滚 | -3 | codeTask.rollback = true |

高质量样本阈值：qualityScore >= 5

---

## 脱敏规则

| 类型 | 替换 | 示例 |
|------|------|------|
| API Key (sk-) | `<API_KEY>` | sk-abc123... -> `<API_KEY>` |
| API Key (参数) | `<REDACTED_API_KEY>` | apiKey=xxx -> `<REDACTED_API_KEY>` |
| 密码 | `password=<REDACTED>` | password=123456 -> `<REDACTED>` |
| 私钥 (PEM) | `<PRIVATE_KEY>` | -----BEGIN PRIVATE KEY-----... -> `<PRIVATE_KEY>` |
| JWT Token | `<JWT_TOKEN>` | eyJ... -> `<JWT_TOKEN>` |
| 手机号 | `1**********` | 13812345678 -> 1********** |
| 邮箱 | `<EMAIL>` | user@example.com -> `<EMAIL>` |
| 公网 IPv4 | `<SERVER_IP>` | 203.0.113.1 -> `<SERVER_IP>` |
| AWS Key | `<AWS_ACCESS_KEY>` | AKIA... -> `<AWS_ACCESS_KEY>` |
| 数据库连接串 | `<DB_CONNECTION>` | postgres://user:pass@host/db -> `<DB_CONNECTION>` |

---

## 导出格式

### SFT（指令调优）

```json
{
  "instruction": "用户的原始问题",
  "input": "",
  "output": "被采纳的回答",
  "system": "系统提示词",
  "metadata": { "id": "...", "taskType": "chat", "sourceModel": "gpt-4o-mini", "qualityScore": 8, "createdAt": "..." }
}
```

### DPO（偏好对齐）

```json
{
  "prompt": "用户的原始问题",
  "chosen": "被采纳的回答",
  "rejected": "被否决的回答",
  "metadata": { "id": "...", "taskType": "chat", "sourceModel": "gpt-4o-mini" }
}
```

### JSONL 导出命令

```typescript
import { useTrainingDataStore } from '@/features/training-data/training-data.store'

const td = useTrainingDataStore()
td.loadFromStorage()
td.exportHQ('sft') // 下载 SFT 格式高质量样本
td.exportHQ('dpo') // 下载 DPO 格式高质量样本
```
