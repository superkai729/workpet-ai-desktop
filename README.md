# 工位小宠 MVP

把用户自己的宠物变成 Windows / macOS 桌面上的 AI 像素桌宠，让它陪用户工作，并作为截图、翻译、问答等轻量工具入口。

## 当前版本

v0.4 是 Electron 原型，重点验证桌宠悬浮体验、截图 MVP 和 OpenAI 工作助手能力：

- 新用户欢迎、上传、生成结果、完成状态流程
- 透明无边框桌宠悬浮窗
- 拖拽移动与位置记忆
- 左键摸摸，右键打开桌宠菜单
- 系统托盘图标跟随当前宠物主题变化
- 全屏框选截图，松开鼠标后自动复制到剪贴板
- OpenAI 真实问答、文本翻译、截图 OCR、截图翻译

## 运行

```bash
npm install
npm run dev
```

## OpenAI 配置

复制 `.env.example` 为 `.env`，并填入本机 OpenAI Key：

```text
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-5-mini
```

`.env` 已加入 `.gitignore`，不要提交真实 Key。

## 项目结构

```text
src/main      Electron 主进程
src/renderer  界面、桌宠窗口、截图窗口、工具窗口
docs/design   设计文档与参考图
```

## 下一步

1. 优化 OCR / 翻译的流式输出与错误提示。
2. 接入真实宠物图片上传与像素风生成。
3. 将 CSS 像素宠物替换为生成的 sprite sheet，并用真实 sprite 生成托盘图标。
4. 增加设置页：模型、开机启动、安静模式、透明度。
