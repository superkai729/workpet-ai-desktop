const params = new URLSearchParams(window.location.search);
const tool = params.get("tool") || "chat";

const title = document.querySelector("#toolTitle");
const chatTool = document.querySelector("#chatTool");
const translateTool = document.querySelector("#translateTool");
const screenshotTool = document.querySelector("#screenshotTool");
const screenshotImage = document.querySelector("#screenshotImage");
const screenshotStatus = document.querySelector("#screenshotStatus");
const copyShot = document.querySelector("#copyShot");
const recaptureShot = document.querySelector("#recaptureShot");

let currentScreenshotDataUrl = "";

function showOnly(activeTool) {
  chatTool.classList.toggle("hidden", activeTool !== "chat");
  translateTool.classList.toggle("hidden", activeTool !== "translate");
  screenshotTool.classList.toggle("hidden", activeTool !== "screenshot");
}

async function captureScreenshot() {
  screenshotStatus.textContent = "\u6b63\u5728\u8bfb\u53d6\u6846\u9009\u7ed3\u679c...";
  copyShot.disabled = true;
  screenshotImage.removeAttribute("src");

  try {
    const result = await window.workpet.getLatestScreenshot();
    if (!result?.dataUrl) {
      screenshotStatus.textContent = "\u8fd8\u6ca1\u6709\u622a\u56fe\u7ed3\u679c, \u8bf7\u91cd\u65b0\u6846\u9009\u3002";
      return;
    }

    currentScreenshotDataUrl = result.dataUrl;
    screenshotImage.src = result.dataUrl;
    screenshotStatus.textContent = `\u5df2\u81ea\u52a8\u590d\u5236\u5230\u526a\u8d34\u677f, ${result.width} x ${result.height}`;
    copyShot.disabled = false;
  } catch (error) {
    screenshotStatus.textContent = `\u622a\u56fe\u5931\u8d25: ${error.message}`;
  }
}

showOnly("chat");

if (tool === "translate") {
  title.textContent = "\u8ba9\u5c0f\u5ba0\u5e2e\u4f60\u7ffb\u8bd1";
  showOnly("translate");
}

if (tool === "screenshot") {
  title.textContent = "\u622a\u56fe";
  showOnly("screenshot");
  captureScreenshot();
}

document.querySelector("#chatSend").addEventListener("click", () => {
  const value = document.querySelector("#chatInput").value.trim();
  document.querySelector("#chatAnswer").textContent = value
    ? `\u6211\u5148\u7ed9\u4f60\u4e00\u4e2a MVP \u5360\u4f4d\u56de\u7b54: \u8fd9\u6bb5\u5185\u5bb9\u7684\u91cd\u70b9\u662f\u300c${value.slice(0, 24)}\u300d\u3002\u540e\u7eed\u4f1a\u63a5\u5165\u771f\u5b9e AI\u3002`
    : "\u5148\u8f93\u5165\u4e00\u4e2a\u95ee\u9898, \u6211\u518d\u5e2e\u4f60\u770b\u3002";
});

document.querySelector("#translateSend").addEventListener("click", () => {
  const value = document.querySelector("#translateInput").value.trim();
  document.querySelector("#translateAnswer").textContent = value
    ? `Translation placeholder: ${value}`
    : "\u8bf7\u8f93\u5165\u8981\u7ffb\u8bd1\u7684\u5185\u5bb9\u3002";
});

recaptureShot.addEventListener("click", () => {
  window.workpet.openTool("screenshot");
});

copyShot.addEventListener("click", async () => {
  if (!currentScreenshotDataUrl) return;

  await window.workpet.copyScreenshot(currentScreenshotDataUrl);
  screenshotStatus.textContent = "\u5df2\u590d\u5236\u5230\u526a\u8d34\u677f";
});
