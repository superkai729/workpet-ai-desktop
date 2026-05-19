const pet = document.querySelector("#pet");
const petButton = document.querySelector("#petButton");
const petMenu = document.querySelector("#petMenu");
const speech = document.querySelector("#speech");

const speechByState = {
  idle: "休息一下？",
  happy: "摸摸很舒服",
  eat: "补充能量中",
  sleep: "我先眯一会儿",
  thinking: "我来帮你看看"
};

let resetTimer;
let dragStart = null;
let isDragging = false;
let suppressNextClick = false;

function setState(state) {
  pet.className = `pixel-pet ${state}`;
  speech.textContent = speechByState[state] || speechByState.idle;
  speech.classList.remove("hidden");

  window.clearTimeout(resetTimer);
  if (!["idle", "sleep"].includes(state)) {
    resetTimer = window.setTimeout(() => setState("idle"), 2200);
  }
}

function openMenu() {
  petMenu.classList.remove("hidden");
}

function closeMenu() {
  petMenu.classList.add("hidden");
}

petButton.addEventListener("contextmenu", (event) => {
  event.preventDefault();
  openMenu();
});

petButton.addEventListener("mousedown", (event) => {
  if (event.button !== 0) return;

  dragStart = {
    x: event.screenX,
    y: event.screenY,
    lastX: event.screenX,
    lastY: event.screenY
  };
  isDragging = false;
});

document.addEventListener("mousemove", async (event) => {
  if (!dragStart) return;

  const totalX = event.screenX - dragStart.x;
  const totalY = event.screenY - dragStart.y;
  const dx = event.screenX - dragStart.lastX;
  const dy = event.screenY - dragStart.lastY;

  if (!isDragging && Math.hypot(totalX, totalY) > 4) {
    isDragging = true;
    closeMenu();
  }

  if (isDragging) {
    dragStart.lastX = event.screenX;
    dragStart.lastY = event.screenY;
    await window.workpet.movePetBy(dx, dy);
  }
});

document.addEventListener("mouseup", () => {
  if (isDragging) {
    suppressNextClick = true;
    window.setTimeout(() => {
      suppressNextClick = false;
    }, 0);
  }

  dragStart = null;
  isDragging = false;
});

petButton.addEventListener("click", () => {
  if (suppressNextClick) return;
  closeMenu();
  setState("happy");
  window.workpet.setPetState("happy");
});

document.addEventListener("click", async (event) => {
  if (event.target.closest("#petButton")) return;

  const action = event.target.dataset.action;
  const tool = event.target.dataset.tool;

  if (!action && !tool) {
    closeMenu();
    return;
  }

  if (action) {
    closeMenu();
    if (action === "hide") {
      await window.workpet.hidePet();
      return;
    }
    setState(action);
    await window.workpet.setPetState(action);
  }

  if (tool) {
    closeMenu();
    setState("thinking");
    await window.workpet.openTool(tool);
  }
});

window.workpet.onPetState((state) => setState(state));
