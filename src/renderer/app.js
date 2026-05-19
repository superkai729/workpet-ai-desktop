const panels = [...document.querySelectorAll("[data-step]")];
const fileInput = document.querySelector("#petPhoto");
const photoPreview = document.querySelector("#photoPreview");
const petOptions = document.querySelector("#petOptions");
const generationHint = document.querySelector("#generationHint");

let generatedVariants = [
  {
    id: "orange",
    name: "橘白小宠",
    primary: "#F4A261",
    secondary: "#FFF3DF",
    outline: "#C77946"
  },
  {
    id: "cream",
    name: "奶油小宠",
    primary: "#F2D8A7",
    secondary: "#FFF9F0",
    outline: "#B98B52"
  },
  {
    id: "mint",
    name: "薄荷领结",
    primary: "#8ECDB7",
    secondary: "#FFF9F0",
    outline: "#4D9A86"
  },
  {
    id: "blue",
    name: "蓝色工牌",
    primary: "#8AB6D6",
    secondary: "#FFF9F0",
    outline: "#4C82A8"
  }
];

function getSelectedPetOptions() {
  const selectedPet = document.querySelector(".pet-card.selected");
  const selectedVariant =
    generatedVariants.find((variant) => variant.id === selectedPet?.dataset.pet) || generatedVariants[0];
  const petName = document.querySelector("#petName")?.value || "年糕";

  return {
    petName,
    petTheme: selectedVariant.id,
    petPalette: {
      primary: selectedVariant.primary,
      secondary: selectedVariant.secondary,
      outline: selectedVariant.outline
    }
  };
}

function showStep(step) {
  panels.forEach((panel) => {
    panel.classList.toggle("hidden", panel.dataset.step !== step);
  });

  if (step === "generating") {
    generatePetVariants();
  }
}

function hexToRgb(hex) {
  const value = hex.replace("#", "");
  return {
    r: parseInt(value.slice(0, 2), 16),
    g: parseInt(value.slice(2, 4), 16),
    b: parseInt(value.slice(4, 6), 16)
  };
}

function rgbToHex({ r, g, b }) {
  return `#${[r, g, b]
    .map((value) => Math.max(0, Math.min(255, Math.round(value))).toString(16).padStart(2, "0"))
    .join("")}`;
}

function mix(color, target, amount) {
  const base = typeof color === "string" ? hexToRgb(color) : color;
  const goal = typeof target === "string" ? hexToRgb(target) : target;
  return rgbToHex({
    r: base.r + (goal.r - base.r) * amount,
    g: base.g + (goal.g - base.g) * amount,
    b: base.b + (goal.b - base.b) * amount
  });
}

function colorDistance(a, b) {
  return Math.abs(a.r - b.r) + Math.abs(a.g - b.g) + Math.abs(a.b - b.b);
}

function quantizeColor({ r, g, b }) {
  const step = 32;
  return {
    r: Math.round(r / step) * step,
    g: Math.round(g / step) * step,
    b: Math.round(b / step) * step
  };
}

function createImageFromFile(file) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = URL.createObjectURL(file);
  });
}

async function extractPalette(file) {
  const image = await createImageFromFile(file);
  const canvas = document.createElement("canvas");
  const size = 72;
  canvas.width = size;
  canvas.height = size;

  const context = canvas.getContext("2d", { willReadFrequently: true });
  context.drawImage(image, 0, 0, size, size);

  const { data } = context.getImageData(0, 0, size, size);
  const buckets = new Map();

  for (let index = 0; index < data.length; index += 16) {
    const alpha = data[index + 3];
    if (alpha < 180) continue;

    const color = quantizeColor({
      r: data[index],
      g: data[index + 1],
      b: data[index + 2]
    });
    const brightness = color.r * 0.299 + color.g * 0.587 + color.b * 0.114;
    if (brightness < 35 || brightness > 245) continue;

    const key = `${color.r},${color.g},${color.b}`;
    buckets.set(key, (buckets.get(key) || 0) + 1);
  }

  const ranked = [...buckets.entries()]
    .map(([key, count]) => {
      const [r, g, b] = key.split(",").map(Number);
      return { color: { r, g, b }, count };
    })
    .sort((a, b) => b.count - a.count);

  const primary = ranked[0]?.color || hexToRgb("#F4A261");
  const secondary =
    ranked.find((item) => colorDistance(item.color, primary) > 95)?.color || hexToRgb(mix(primary, "#FFFFFF", 0.68));

  return {
    primary: rgbToHex(primary),
    secondary: mix(rgbToHex(secondary), "#FFFFFF", 0.48),
    outline: mix(rgbToHex(primary), "#2F3136", 0.32)
  };
}

function buildVariants(palette) {
  return [
    {
      id: "photo-classic",
      name: "照片主色",
      primary: palette.primary,
      secondary: palette.secondary,
      outline: palette.outline
    },
    {
      id: "photo-soft",
      name: "柔和奶油",
      primary: mix(palette.primary, "#F2D8A7", 0.36),
      secondary: mix(palette.secondary, "#FFF9F0", 0.42),
      outline: mix(palette.outline, "#B98B52", 0.28)
    },
    {
      id: "photo-mint",
      name: "清爽工位",
      primary: mix(palette.primary, "#8ECDB7", 0.34),
      secondary: mix(palette.secondary, "#FFF9F0", 0.5),
      outline: mix(palette.outline, "#4D9A86", 0.32)
    },
    {
      id: "photo-badge",
      name: "蓝色工牌",
      primary: mix(palette.primary, "#8AB6D6", 0.4),
      secondary: mix(palette.secondary, "#FFFFFF", 0.42),
      outline: mix(palette.outline, "#4C82A8", 0.35)
    }
  ];
}

function renderVariantCard(variant, selected = false) {
  const card = document.createElement("button");
  card.type = "button";
  card.className = `pet-card${selected ? " selected" : ""}`;
  card.dataset.pet = variant.id;
  card.style.setProperty("--orange", variant.primary);
  card.style.setProperty("--pet-secondary", variant.secondary);
  card.style.setProperty("--pet-outline", variant.outline);
  card.innerHTML = `
    <span class="pet-card-preview pixel-pet idle" aria-hidden="true">
      <span class="ear left"></span>
      <span class="ear right"></span>
      <span class="face"></span>
      <span class="body"></span>
      <span class="tail"></span>
    </span>
    <span class="pet-card-name">${variant.name}</span>
  `;
  card.addEventListener("click", () => {
    document.querySelectorAll(".pet-card").forEach((item) => item.classList.remove("selected"));
    card.classList.add("selected");
    applyPaletteToDocument(variant);
  });
  return card;
}

function applyPaletteToDocument(variant) {
  document.body.style.setProperty("--orange", variant.primary);
  document.body.style.setProperty("--pet-secondary", variant.secondary);
  document.body.style.setProperty("--pet-outline", variant.outline);
}

function renderPetOptions() {
  petOptions.replaceChildren(...generatedVariants.map((variant, index) => renderVariantCard(variant, index === 0)));
  applyPaletteToDocument(generatedVariants[0]);
}

async function generatePetVariants() {
  const file = fileInput.files?.[0];
  generationHint.textContent = file
    ? "正在提取毛色、轮廓和可爱特征..."
    : "没有选择照片，正在生成默认像素小宠...";

  try {
    if (file) {
      const palette = await extractPalette(file);
      generatedVariants = buildVariants(palette);
    }
  } catch {
    generationHint.textContent = "照片解析失败，已为你准备默认像素小宠。";
  }

  renderPetOptions();
  window.setTimeout(() => showStep("result"), 600);
}

document.addEventListener("click", (event) => {
  const trigger = event.target.closest("[data-next]");
  if (!trigger) return;
  showStep(trigger.dataset.next);
});

document.querySelector("#tryDefault").addEventListener("click", async () => {
  await window.workpet.showPet({ petName: "年糕", petTheme: "orange", petPalette: null });
  showStep("complete");
});

document.querySelector("#launchPet").addEventListener("click", async () => {
  await window.workpet.showPet(getSelectedPetOptions());
  showStep("complete");
});

document.querySelector("#showPetAgain").addEventListener("click", async () => {
  await window.workpet.showPet(getSelectedPetOptions());
});

fileInput.addEventListener("change", () => {
  const file = fileInput.files?.[0];
  if (!file) return;

  const imageUrl = URL.createObjectURL(file);
  photoPreview.style.backgroundImage = `url("${imageUrl}")`;
  photoPreview.classList.remove("hidden");
});

renderPetOptions();
