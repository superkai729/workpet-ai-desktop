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
const ocrShot = document.querySelector("#ocrShot");
const translateShot = document.querySelector("#translateShot");
const copyOcr = document.querySelector("#copyOcr");
const copyTranslation = document.querySelector("#copyTranslation");
const ocrResult = document.querySelector("#ocrResult");
const translationResult = document.querySelector("#translationResult");

let currentScreenshotDataUrl = "";
let currentOcrText = "";
let currentTranslationText = "";

function showOnly(activeTool) {
  chatTool.classList.toggle("hidden", activeTool !== "chat");
  translateTool.classList.toggle("hidden", activeTool !== "translate");
  screenshotTool.classList.toggle("hidden", activeTool !== "screenshot");
}

async function loadScreenshotResult() {
  screenshotStatus.textContent = "\u6b63\u5728\u8bfb\u53d6\u6846\u9009\u7ed3\u679c...";
  copyShot.disabled = true;
  ocrShot.disabled = true;
  translateShot.disabled = true;
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
    ocrShot.disabled = false;
    translateShot.disabled = false;
  } catch (error) {
    screenshotStatus.textContent = `\u622a\u56fe\u5931\u8d25: ${error.message}`;
  }
}

async function sendChat() {
  const value = document.querySelector("#chatInput").value.trim();
  const answer = document.querySelector("#chatAnswer");
  if (!value) {
    answer.textContent = "\u5148\u8f93\u5165\u4e00\u4e2a\u95ee\u9898, \u6211\u518d\u5e2e\u4f60\u770b\u3002";
    return;
  }

  answer.textContent = "\u5c0f\u5ba0\u601d\u8003\u4e2d...";
  try {
    answer.textContent = await window.workpet.askAI(value);
  } catch (error) {
    answer.textContent = `OpenAI \u8bf7\u6c42\u5931\u8d25: ${error.message}`;
  }
}

async function translateInputText() {
  const value = document.querySelector("#translateInput").value.trim();
  const answer = document.querySelector("#translateAnswer");
  if (!value) {
    answer.textContent = "\u8bf7\u8f93\u5165\u8981\u7ffb\u8bd1\u7684\u5185\u5bb9\u3002";
    return;
  }

  answer.textContent = "\u6b63\u5728\u7ffb\u8bd1...";
  try {
    answer.textContent = await window.workpet.translateText(value);
  } catch (error) {
    answer.textContent = `OpenAI \u7ffb\u8bd1\u5931\u8d25: ${error.message}`;
  }
}

async function recognizeScreenshotText() {
  if (!currentScreenshotDataUrl) return;
  ocrShot.disabled = true;
  ocrResult.textContent = "\u6b63\u5728\u8bc6\u522b\u6587\u5b57...";
  try {
    currentOcrText = await window.workpet.ocrImage(currentScreenshotDataUrl);
    ocrResult.textContent = currentOcrText;
    copyOcr.disabled = !currentOcrText;
  } catch (error) {
    ocrResult.textContent = `OCR \u5931\u8d25: ${error.message}`;
  } finally {
    ocrShot.disabled = false;
  }
}

async function translateScreenshotText() {
  if (!currentScreenshotDataUrl) return;
  translateShot.disabled = true;
  translationResult.textContent = "\u6b63\u5728\u8bc6\u522b\u5e76\u7ffb\u8bd1...";
  try {
    currentTranslationText = await window.workpet.translateImage(currentScreenshotDataUrl);
    translationResult.textContent = currentTranslationText;
    copyTranslation.disabled = !currentTranslationText;
  } catch (error) {
    translationResult.textContent = `\u622a\u56fe\u7ffb\u8bd1\u5931\u8d25: ${error.message}`;
  } finally {
    translateShot.disabled = false;
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
  loadScreenshotResult();
}

document.querySelector("#chatSend").addEventListener("click", sendChat);
document.querySelector("#translateSend").addEventListener("click", translateInputText);
recaptureShot.addEventListener("click", () => window.workpet.openTool("screenshot"));
copyShot.addEventListener("click", async () => {
  if (!currentScreenshotDataUrl) return;
  await window.workpet.copyScreenshot(currentScreenshotDataUrl);
  screenshotStatus.textContent = "\u5df2\u590d\u5236\u5230\u526a\u8d34\u677f";
});
ocrShot.addEventListener("click", recognizeScreenshotText);
translateShot.addEventListener("click", translateScreenshotText);
copyOcr.addEventListener("click", async () => {
  if (currentOcrText) await navigator.clipboard.writeText(currentOcrText);
});
copyTranslation.addEventListener("click", async () => {
  if (currentTranslationText) await navigator.clipboard.writeText(currentTranslationText);
});
