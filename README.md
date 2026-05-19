# 工位小宠 MVP

把用户自己的宠物变成 Windows / macOS 桌面上的 AI 像素桌宠，让它陪用户工作，并作为截图、翻译、问答等轻量工具入口。

## 当前版本

v0.1 是 Electron 原型，重点验证桌宠悬浮体验：

- 新用户欢迎、上传、生成结果流程
- 透明无边框桌宠悬浮窗
- 桌宠点击菜单
- 摸摸、喂食、睡觉、思考状态
- 翻译 / 问答工具窗口占位
- 设置项占位

## 运行

```bash
npm install
npm run dev
```

## 项目结构

```text
src/main      Electron 主进程
src/renderer  界面、桌宠窗口、工具窗口
docs/design   设计文档与参考图
```

## 下一步

1. 接入真实宠物图片上传与像素风生成。
2. 接入系统截图、剪贴板、OCR。
3. 接入翻译与 AI 问答 API。
4. 将 CSS 像素宠物替换为生成的 sprite sheet。
