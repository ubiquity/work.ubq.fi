const toolbar = document.getElementById("toolbar");
export async function readyToolbar() {
  if (!toolbar) throw new Error("toolbar not found");
  toolbar.classList.add("ready");
}
export { toolbar };
