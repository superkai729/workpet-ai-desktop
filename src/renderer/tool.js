const params = new URLSearchParams(window.location.search);
const tool = params.get("tool") || "chat";

const title = document.querySelector("#toolTitle");
const chatTool = document.querySelector("#chatTool");
const translateTool = document.querySelector("#translateTool");

if (tool === "translate") {
  title.textContent = "让小宠帮你翻译";
  chatTool.classList.add("hidden");
  translateTool.classList.remove("hidden");
}

document.querySelector("#chatSend").addEventListener("click", () => {
  const value = document.querySelector("#chatInput").value.trim();
  document.querySelector("#chatAnswer").textContent = value
    ? `我先给你一个 MVP 占位回答：这段内容的重点是「${value.slice(0, 24)}」。后续会接入真实 AI。`
    : "先输入一个问题，我再帮你看。";
});

document.querySelector("#translateSend").addEventListener("click", () => {
  const value = document.querySelector("#translateInput").value.trim();
  document.querySelector("#translateAnswer").textContent = value
    ? `Translation placeholder: ${value}`
    : "请输入要翻译的内容。";
});
