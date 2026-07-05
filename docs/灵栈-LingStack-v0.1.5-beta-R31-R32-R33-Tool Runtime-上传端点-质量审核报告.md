# 灵栈 LingStack v0.1.5-beta R31-33 — Tool Runtime + 真实上传端点 + 质量审核 UI 报告

> 日期：2026-07-03  
> 轮次：R31、R32、R33  
> 范围：最小 Tool Runtime（time tool）+ 服务器端上传 endpoint + 数据集质量审核 UI

---

## 1. R31 — 最小 Tool Runtime（time tool + system_info tool）

### 问题根因
AI 模型无法回答"北京时间"、"现在几点"等实时信息，因为模型训练数据有截止日期，且 API 调用未携带时间上下文。

### 解决方案
采用**关键词触发 + 预执行**模式（非 function calling），工具在用户消息发出前自动检测并执行，结果注入上下文。

### 实现文件

| 文件 | 作用 |
|------|------|
| `src/features/tools/tool-runtime.types.ts` | 类型定义：ToolDefinition、ToolResult、ToolParam |
| `src/features/tools/builtin-tools.ts` | 内置工具注册：time_tool、system_info_tool、关键词触发映射、prompt 注入文本 |
| `src/services/chat/chat.service.ts` | 集成点：buildSystemPrompt() 注入工具描述、sendChatMessage() 预执行工具 |

### 工具清单

1. **current_time** — 获取当前北京时间（Asia/Shanghai）
   - 触发关键词：北京时间、现在几点、当前时间、今天日期、what time 等
   - 输出：本地时间、时区、ISO 8601、Unix 时间戳、星期

2. **system_info** — 获取系统环境信息
   - 触发关键词：系统信息、操作系统、设备信息等
   - 输出：操作系统、语言、在线状态、内存、屏幕/视口分辨率

### 工作流程
```
用户发送消息 → detectToolTriggers() 扫描关键词
  → 匹配成功 → 执行工具 → 结果注入 requestMessages（system role）
  → 模型接收包含工具结果的上下文 → 生成回答
```

### 触发映射
- `北京时间`、`现在几点`、`当前时间`、`今天日期`、`现在日期` → time_tool
- `系统信息`、`操作系统`、`屏幕分辨率`、`设备信息` → system_info_tool

---

## 2. R32 — 服务器端上传 endpoint 实现

### 变更

| 变更 | 说明 |
|------|------|
| `server/learning_api.py` | Python FastAPI 端点：POST `/api/learning/upload` + GET `/api/learning/health` |
| `dataset-upload.service.ts` | `USE_MOCK` 从 `true` 切换为 `false` |
| Nginx 配置 | 添加 `location /api/learning/` 反向代理到 `127.0.0.1:5010` |

### 服务器端实现

- **框架**：Python FastAPI + Uvicorn
- **端口**：5010（仅监听 localhost，通过 nginx 代理对外）
- **端点**：
  - `GET /api/learning/health` → `{"status":"ok","timestamp":"..."}`
  - `POST /api/learning/upload` → 接收 DatasetPackage，校验 SHA256 + 样本数，存储到 `/data/lingstack/datasets/`
- **校验**：SHA256 指纹匹配、样本数匹配，不匹配返回 400
- **存储结构**：`/data/lingstack/datasets/{deviceId前16位}/{日期}/{packageId}.jsonl` + `.meta.json`
- **部署位置**：`https://ai.tadanpay.cn/api/learning/`

### 部署验证

```
$ curl https://ai.tadanpay.cn/api/learning/health
{"status":"ok","timestamp":"2026-07-03T15:33:07.462848+00:00"}
```

---

## 3. R33 — 数据集质量审核 UI

### 新增功能

在 `TrainingSettingsPanel.vue` 中新增「质量审核」可折叠面板：

- **过滤器**：全部 / 高质量(>=5) / 低质量(<5) / 已采纳 / 已否决
- **搜索**：按用户输入、模型输出、任务类型关键词搜索
- **样本卡片**：
  - 摘要行：任务类型标签、用户输入截断预览、质量分数（颜色编码）、采纳/否决状态图标
  - 展开详情：模型名称、时间、完整用户输入、脱敏模型输出、采纳/否决操作按钮
- **颜色编码**：>=7 绿、>=5 浅绿、>=3 橙、>=0 深橙、<0 红
- **操作**：采纳/否决按钮，已操作后禁用

### 实现细节

- 展开/收起单样本切换（同一时间只展开一个）
- 高分样本和已审核样本视觉差异化
- 列表最大高度 360px 可滚动
- 与 Learning 开关联动（关闭 Learning 时隐藏审核面板）

---

## 4. 版本变更

| 文件 | 旧版本 | 新版本 |
|------|--------|--------|
| `package.json` | 0.1.4 | 0.1.5 |
| `src-tauri/Cargo.toml` | 0.1.4 | 0.1.5 |
| `src-tauri/tauri.conf.json` | 0.1.4 | 0.1.5 |

- 安装包：`灵栈 LingStack_0.1.5_x64-setup.exe` (6.94 MB)
- 部署地址：`https://ai.tadanpay.cn/updates/v0.1.5/`

---

## 5. 构建验证

- `npm run build` — 通过，无 TypeScript 错误
- `npm run tauri build` — 通过，生成 Windows NSIS 安装包

---

## 6. 后续方向

- R34：Tool Runtime 扩展（文件读写工具、Shell 执行工具）
- R35：数据集质量自动评分规则优化
- R36：训练数据远程管理面板（Web 端查看/导出已上传数据）
