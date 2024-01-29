export async function readyToolbar() {
  const toolbar = document.getElementById("toolbar");
  if (!toolbar) throw new Error("toolbar not found");
  toolbar.classList.add("ready");
}
