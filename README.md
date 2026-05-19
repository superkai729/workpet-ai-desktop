# 工位小宠 MVP

把用户自己的宠物变成 Windows / macOS 桌面上的 AI 像素桌宠，让它陪用户工作，并作为截图、翻译、问答等轻量工具入口。

## 当前版本

v0.5 是 Electron 原型，重点验证桌宠悬浮体验、截图 MVP 和 DeepSeek 文本工作助手能力：

- 新用户欢迎、上传、生成结果、完成状态流程
- 透明无边框桌宠悬浮窗
- 拖拽移动与位置记忆
- 左键摸摸，右键打开桌宠菜单
- 系统托盘图标跟随当前宠物主题变化
- 全屏框选截图，松开鼠标后自动复制到剪贴板
- DeepSeek 真实问答和文本翻译

注意：DeepSeek 文本接口当前不支持图片 OCR，所以截图文字识别和截图翻译会先显示明确的暂不支持提示。后续接入本地 OCR 或独立 OCR 服务后，再把识别出的文字交给 DeepSeek 翻译。

## 运行

```bash
npm install
npm run dev
```

## DeepSeek 配置

复制 `.env.example` 为 `.env`，并填入本机 DeepSeek Key：

```text
DEEPSEEK_API_KEY=your_deepseek_api_key_here
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-chat
```

`.env` 已加入 `.gitignore`，不要提交真实 Key。

## 项目结构

```text
src/main      Electron 主进程
src/renderer  界面、桌宠窗口、截图窗口、工具窗口
docs/design   设计文档与参考图
```

## 下一步

1. 接入 OCR 能力，让截图文字识别和截图翻译重新可用。
2. 接入真实宠物图片上传与像素风生成。
3. 将 CSS 像素宠物替换为生成的 sprite sheet，并用真实 sprite 生成托盘图标。
4. 增加设置页：模型、开机启动、安静模式、透明度。
