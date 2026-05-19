const canvas = document.querySelector("#screenCanvas");
const selectionBox = document.querySelector("#selectionBox");
const context = canvas.getContext("2d");

let screenshot = null;
let image = null;
let startPoint = null;
let isDragging = false;

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

function drawScreenshot() {
  if (!image) return;
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
}

function normalizeRect(pointA, pointB) {
  const x = Math.min(pointA.x, pointB.x);
  const y = Math.min(pointA.y, pointB.y);
  const width = Math.abs(pointA.x - pointB.x);
  const height = Math.abs(pointA.y - pointB.y);
  return { x, y, width, height };
}

function updateSelectionBox(rect) {
  selectionBox.classList.remove("hidden");
  selectionBox.style.left = `${rect.x}px`;
  selectionBox.style.top = `${rect.y}px`;
  selectionBox.style.width = `${rect.width}px`;
  selectionBox.style.height = `${rect.height}px`;
}

function cropSelection(rect) {
  const scaleX = screenshot.width / canvas.width;
  const scaleY = screenshot.height / canvas.height;
  const sourceX = Math.round(rect.x * scaleX);
  const sourceY = Math.round(rect.y * scaleY);
  const sourceWidth = Math.round(rect.width * scaleX);
  const sourceHeight = Math.round(rect.height * scaleY);

  const cropCanvas = document.createElement("canvas");
  cropCanvas.width = sourceWidth;
  cropCanvas.height = sourceHeight;
  const cropContext = cropCanvas.getContext("2d");
  cropContext.drawImage(
    image,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    0,
    0,
    sourceWidth,
    sourceHeight
  );

  return {
    dataUrl: cropCanvas.toDataURL("image/png"),
    displayName: screenshot.displayName,
    width: sourceWidth,
    height: sourceHeight
  };
}

async function loadScreenshot() {
  resizeCanvas();
  screenshot = await window.workpet.captureScreenshot();
  image = new Image();
  image.onload = drawScreenshot;
  image.src = screenshot.dataUrl;
}

window.addEventListener("resize", () => {
  resizeCanvas();
  drawScreenshot();
});

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    window.workpet.cancelScreenshotSelection();
  }
});

document.addEventListener("mousedown", (event) => {
  startPoint = { x: event.clientX, y: event.clientY };
  isDragging = true;
  updateSelectionBox({ ...startPoint, width: 0, height: 0 });
});

document.addEventListener("mousemove", (event) => {
  if (!isDragging || !startPoint) return;
  updateSelectionBox(normalizeRect(startPoint, { x: event.clientX, y: event.clientY }));
});

document.addEventListener("mouseup", async (event) => {
  if (!isDragging || !startPoint) return;

  isDragging = false;
  const rect = normalizeRect(startPoint, { x: event.clientX, y: event.clientY });
  startPoint = null;

  if (rect.width < 8 || rect.height < 8) {
    selectionBox.classList.add("hidden");
    return;
  }

  await window.workpet.completeScreenshotSelection(cropSelection(rect));
});

loadScreenshot();
