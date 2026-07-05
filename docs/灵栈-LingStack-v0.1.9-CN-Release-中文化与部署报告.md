# 灵栈 LingStack v0.1.9 — 全面中文化与功能修复发布报告
**日期**：2026-07-04
**版本**：v0.1.9
**处理方式**：Codex 直接开发、签名构建、服务器部署

---

## 1. 本版本内容

### 1.1 全面界面中文化（24 个组件）

**核心外壳**
- LeftSidebar — 新建线程、自修复、工具、技能、浏览器、桌面控制、反馈、设置
- TitleBar — 本地、空闲
- StatusBar — 线程数、反馈待处理
- ProjectSwitcher — 无项目、打开文件夹
- TopStatusBar — 项目/线程/模型/智能体/运行时/目标/自动 全中文化

**线程组件**
- ThreadList — 暂无线程、右键菜单（重命名/置顶/归档/删除）、时间格式化
- ThreadHeader — 状态标签（空闲/运行中/失败/完成/暂停）+ 模式标签
- ThreadComposer — 问答/智能体/发送中/草稿已保存/输入提示
- CenterThreadPane — 欢迎页/空消息提示

**功能面板**
- SkillsPane — 技能库/项目/工作流/编码/集成/注入
- MCPPane — 集成/MCP/已连接/未连接/授权中
- BrowserPane — 浏览器/前往/当前会话/快速访问
- ComputerUsePane — 桌面控制/可用性/权限/请求权限

**子组件**
- ReviewTabs / ReviewDiffPane / ReviewFileList — 审查/终端/差异详情/变更文件
- TerminalPane / TerminalEmptyState — 运行/停止
- GitPane / GitEmptyState / GitBranchBar — 全部暂存/全部还原
- BetaFeedbackDialog — 提交内测反馈
- ThreadSearchBox — 搜索线程
- AddModelModal — 取消/保存

### 1.2 功能修复（3 项）

1. **Skills 注入接通** — injectSkill 从仅 console.log 改为真实注入技能名+描述到 Composer 输入框
2. **线程搜索接通** — ThreadSearchBox 搜索词真实过滤 ThreadList，支持"无搜索结果"空状态
3. **TopStatusBar 变量修复** — 修复上轮 hotfix 过度替换导致的 instanceStore/onlineCount 变量名损坏

---

## 2. 构建与签名

- vue-tsc --noEmit: 0 errors
- vite build: 3164 modules, 3.30s
- Tauri release: Rust 编译 47.72s
- 签名: minisign 签名通过 (.sig 428 bytes)

## 3. 安装包

- 文件: 灵栈 LingStack_0.1.9_x64-setup.exe
- 大小: 6,880,007 bytes (6.88 MB)
- 签名: 灵栈 LingStack_0.1.9_x64-setup.exe.sig

## 4. 服务器部署

上传到: 103.8.69.194:45543 /home/www/lingstack/updates/releases/v0.1.9/

更新了 7 个 channel 的 latest.json:
- https://ai.tadanpay.cn/updates/latest.json
- https://ai.tadanpay.cn/updates/beta/latest.json
- https://ai.tadanpay.cn/updates/alpha/latest.json
- https://ai.tadanpay.cn/updates/rc/latest.json
- https://ai.tadanpay.cn/updates/stable-internal/latest.json
- https://ai.tadanpay.cn/updates/nightly/latest.json
- https://ai.tadanpay.cn/updates/releases/latest.json

## 5. 端点验证

| 端点 | 状态 | 大小 |
|------|------|------|
| 7 个 channel latest.json | 200 OK | 722 bytes |
| v0.1.9 EXE 直链 | 200 OK | 6,880,007 bytes |

## 6. 下一步建议

1. 用户本地安装 0.1.9 验证中文化效果
2. 确认在线更新检测弹出更新提示
3. 验证 Skills 注入功能（点击技能 → Composer 出现技能上下文）
4. 验证线程搜索过滤功能
