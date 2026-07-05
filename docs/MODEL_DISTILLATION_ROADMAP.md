# Model Distillation Roadmap — LingStack vNext

> 从本地 AI 工作台到自有蒸馏模型的演进路线图。
> 当前 Phase 0：结构化记录数据，不训练模型。

---

## Phase 0：Training Data Layer（当前）

**状态：已完成**

- 结构化记录用户在灵栈中的每次 AI 交互
- 任务类型覆盖：chat / code_modify / code_review / shell_debug / image_prompt / image_generate / skill_execution / agent_task / context_build / model_routing
- 质量评分：规则引擎（采纳 +3 / 复制 +2 / 否决 -5 / 构建通过 +5 / 回滚 -3）
- 数据脱敏：10 类敏感信息自动替换
- 导出：SFT JSONL / DPO JSONL / raw JSONL
- 存储：localStorage（全部本地）

**代码位置：** `src/features/training-data/`

| 文件 | 职责 |
|------|------|
| `training-data.types.ts` | 所有类型定义 |
| `training-data.service.ts` | CRUD + 持久化 |
| `training-data.store.ts` | Pinia Store |
| `data-redaction.service.ts` | 脱敏引擎 |
| `quality-score.service.ts` | 规则评分 |
| `sample-export.service.ts` | JSONL 导出 |

---

## Phase 1：数据积累与质量提升（预计 R18-R20）

**目标：积累 1000+ 高质量样本**

### 1.1 接入更多任务类型
- [ ] 编辑器内 AI 代码修改 → `code_modify` 样本
- [ ] Terminal 调试交互 → `shell_debug` 样本
- [ ] 图片生成 → `image_generate` 样本
- [ ] Skill 执行 → `skill_execution` 样本
- [ ] Agent 任务 → `agent_task` 样本

### 1.2 数据质量增强
- [ ] 用户反馈 UI（赞/踩/修改建议）
- [ ] 手动标注界面（为高质量样本打标）
- [ ] 自动质量审计（去重、语言检测、格式校验）
- [ ] 样本版本管理（regenerate 链追踪）

### 1.3 数据规模
- 目标：1000+ 高质量样本（qualityScore >= 5）
- 其中：chat 60% / code 25% / agent 10% / 其他 5%

---

## Phase 2：本地微调实验（预计 R21-R24）

**目标：在本地用 LLama-Factory / Unsloth 微调小模型**

### 2.1 基础设施
- [ ] 选择基座模型（Qwen2.5-7B / DeepSeek-Coder-7B / Phi-4-mini）
- [ ] 搭建本地微调环境（LLama-Factory / Unsloth）
- [ ] GPU 需求评估（最小 24GB VRAM）

### 2.2 SFT（指令调优）
- [ ] 导出 500+ chat 样本为 SFT JSONL
- [ ] LoRA 微调（r=16, alpha=32, 3 epochs）
- [ ] 评估指标：Win Rate vs 原始模型

### 2.3 DPO（偏好对齐）
- [ ] 收集 chosen/rejected 对（采纳 vs 否决的回答）
- [ ] DPO 微调增强对齐能力

### 2.4 验证闭环
- [ ] 在灵栈内 A/B 测试（原始模型 vs 微调模型）
- [ ] 用户无明显感知降级再切换

---

## Phase 3：自有模型上线（预计 R25+）

**目标：灵栈默认使用自有蒸馏模型**

### 3.1 模型服务
- [ ] Ollama / llama.cpp 本地推理
- [ ] 量化版本（Q4_K_M / Q8_0）
- [ ] 流式输出兼容现有 ChatPanel

### 3.2 持续改进
- [ ] 在线学习（用户反馈实时调整权重）
- [ ] 定期 re-distill（每 1000 新样本重训一次）
- [ ] 多模型路由（简单问题用自有模型，复杂问题路由到云端）

### 3.3 分发
- [ ] 模型打包进安装包（GGUF 格式）
- [ ] 增量模型更新
- [ ] 用户授权同步（opt-in 数据贡献）

---

## 依赖与风险

### 技术依赖
- Python 3.10+（数据清洗、格式校验）
- LLama-Factory / Unsloth（微调）
- Ollama（本地推理）
- GPU（24GB+ VRAM，Phase 2 必须）

### 风险
| 风险 | 缓解 |
|------|------|
| 数据量不足 | Phase 1 先积累，质量优先于数量 |
| 微调效果差 | 从 LoRA 小实验开始，逐步迭代 |
| GPU 资源不足 | 先用云端 Colab / RunPod 验证，再本地化 |
| 数据隐私 | 全流程本地，不上传云端 |

---

## 当前状态

**Phase 0 完成。Phase 1 待启动。**

不做：
- 当前不训练模型
- 当前不上传数据到云端
- 当前不需要 GPU

后续：
- R18+：接入更多任务类型到 Training Data Layer
- R21+：本地微调实验
- R25+：自有模型上线
