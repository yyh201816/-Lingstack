# 灵栈 LingStack v0.1.8 — CodexWorkbench 空白主界面热修复与发布报告

**日期**：2026-07-04  
**版本**：`0.1.8`  
**处理方式**：由 Codex 直接接手修复、构建、签名、发布、同步更新源

---

## 1. 本轮问题结论

用户截图中的“功能都在但界面一片空白”，根因不是主链没接回，而是：

- `src/layouts/codex-shell/parts/StatusBar.vue`
- `src/layouts/codex-shell/CodexWorkbench.vue`

里的状态栏高度约束错误，导致：

- `StatusBar` 实际高度被撑成整屏高度
- `codex-workbench__body` 被 Flex 挤压为 `0px`
- 左栏 / 中栏 / 右栏虽然都已渲染进 DOM，但视觉上几乎全部消失

这是一个**壳层布局级 P0 问题**。

---

## 2. 直接修复内容

### 2.1 布局热修复

修复文件：

- `G:\LingStack-nexT\src\layouts\codex-shell\parts\StatusBar.vue`
- `G:\LingStack-nexT\src\layouts\codex-shell\CodexWorkbench.vue`

修复点：

- 将 `StatusBar` 的 `height: 100%` 改为固定 `28px`
- 增加 `min-height: 28px`
- 增加 `flex-shrink: 0`
- 对 `codex-workbench__statusbar` 再做一层固定高度兜底

修复结果：

- `codex-workbench__body` 高度从 `0px` 恢复为 `800px`
- 左栏 / 中栏 / 右栏重新可见
- 空白主界面问题被直接解除

---

### 2.2 顶部状态栏补正

修复文件：

- `G:\LingStack-nexT\src\layouts\codex-shell\parts\TopStatusBar.vue`

修复点：

- 重写该组件
- 接入 `model-configs.store`
- `Model` 字段改为真实读取当前激活模型
- 清除损坏/脏字符实现

---

### 2.3 标题栏与版本统一

修复文件：

- `G:\LingStack-nexT\src\layouts\codex-shell\parts\TitleBar.vue`
- `G:\LingStack-nexT\src\shared\constants\app.ts`
- `G:\LingStack-nexT\src\stores\app.store.ts`
- `G:\LingStack-nexT\src\features\beta\store\beta-feedback.store.ts`
- `G:\LingStack-nexT\src\services\ipc\tauri.service.ts`
- `G:\LingStack-nexT\src\features\settings\components\SettingsPanel.vue`
- `G:\LingStack-nexT\src-tauri\src\commands\app.rs`

修复点：

- 产品名统一为：`灵栈 LingStack`
- 版本统一为：`0.1.8`
- Rust `get_app_info` 改为读取 `env!("CARGO_PKG_VERSION")`
- 浏览器 fallback / UI 文案 / 设置页版本显示全部同步

---

### 2.4 可见 unicode 文案清理

修复文件：

- `G:\LingStack-nexT\src\layouts\codex-shell\parts\ProjectSwitcher.vue`
- `G:\LingStack-nexT\src\layouts\codex-shell\parts\ThreadSearchBox.vue`
- `G:\LingStack-nexT\src\layouts\codex-shell\parts\LeftSidebar.vue`

修复点：

- `\uD83D\uDCC1` → `📁`
- `\uD83D\uDD0D` → `🔍`
- `\u2318G` → `Ctrl+G`
- `\u00B7` → `·`
- `\u25C6` → `◆`

修复结果：

- 首屏不再出现字面量转义串
- 左栏文案恢复正常可读

---

## 3. 构建与验证

### 3.1 前端构建

- `npm run build`：通过
- `vue-tsc --noEmit`：通过

### 3.2 运行态验证

通过本地浏览器自动化验证：

- 修复前：`codex-workbench__body` 高度 = `0px`
- 修复后：`codex-workbench__body` 高度 = `800px`
- 左栏宽度 = `280px`
- 中栏宽度 = `740px`
- 右栏宽度 = `420px`
- 底部状态栏高度 = `28px`

验证截图：

- `G:\LingStack-nexT\playwright-home-fixed-2.png`

### 3.3 Tauri 打包

签名环境变量补齐后，已成功生成：

- `G:\LingStack-nexT\src-tauri\target\release\bundle\nsis\灵栈 LingStack_0.1.8_x64-setup.exe`
- `G:\LingStack-nexT\src-tauri\target\release\bundle\nsis\灵栈 LingStack_0.1.8_x64-setup.exe.sig`

安装包体积：

- `6,881,438 bytes`

---

## 4. 服务器发布结果

已上传到：

- `https://ai.tadanpay.cn/updates/releases/v0.1.8/灵栈%20LingStack_0.1.8_x64-setup.exe`

已更新更新源：

- `https://ai.tadanpay.cn/updates/latest.json`
- `https://ai.tadanpay.cn/updates/beta/latest.json`
- `https://ai.tadanpay.cn/updates/releases/latest.json`
- `https://ai.tadanpay.cn/updates/alpha/latest.json`
- `https://ai.tadanpay.cn/updates/rc/latest.json`
- `https://ai.tadanpay.cn/updates/stable-internal/latest.json`
- `https://ai.tadanpay.cn/updates/nightly/latest.json`

线上校验结果：

- `latest.json`：`200`
- `beta/latest.json`：`200`
- `v0.1.8` 安装包下载地址：`200`

---

## 5. 本轮最终结论

LingStack `0.1.8` 已完成：

- CodexWorkbench 空白主界面根因修复
- 首屏三栏重新恢复显示
- 版本号统一
- 可见 unicode 文案清理
- Tauri 签名打包
- 更新源同步到服务器

当前可以进入下一步：

1. 用户本机安装 `0.1.8`
2. 人工验证“打开项目 / 新建线程 / Settings / Review / Terminal / 更新检测”
3. 再决定下一轮是继续收口交互，还是补真实工作链路
