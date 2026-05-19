const panels = [...document.querySelectorAll("[data-step]")];
const fileInput = document.querySelector("#petPhoto");
const photoPreview = document.querySelector("#photoPreview");

function getSelectedPetOptions() {
  const selectedPet = document.querySelector(".pet-card.selected");
  const petName = document.querySelector("#petName")?.value || "年糕";

  return {
    petName,
    petTheme: selectedPet?.dataset.pet || "orange"
  };
}

function showStep(step) {
  panels.forEach((panel) => {
    panel.classList.toggle("hidden", panel.dataset.step !== step);
  });

  if (step === "generating") {
    window.setTimeout(() => showStep("result"), 1400);
  }
}

document.addEventListener("click", (event) => {
  const trigger = event.target.closest("[data-next]");
  if (!trigger) return;
  showStep(trigger.dataset.next);
});

document.querySelector("#tryDefault").addEventListener("click", async () => {
  await window.workpet.showPet({ petName: "年糕", petTheme: "orange" });
  showStep("complete");
});

document.querySelector("#launchPet").addEventListener("click", async () => {
  await window.workpet.showPet(getSelectedPetOptions());
  showStep("complete");
});

document.querySelector("#showPetAgain").addEventListener("click", async () => {
  await window.workpet.showPet(getSelectedPetOptions());
});

document.querySelectorAll(".pet-card").forEach((card) => {
  card.addEventListener("click", () => {
    document.querySelectorAll(".pet-card").forEach((item) => item.classList.remove("selected"));
    card.classList.add("selected");
  });
});

fileInput.addEventListener("change", () => {
  const file = fileInput.files?.[0];
  if (!file) return;

  const imageUrl = URL.createObjectURL(file);
  photoPreview.style.backgroundImage = `url("${imageUrl}")`;
  photoPreview.classList.remove("hidden");
});
