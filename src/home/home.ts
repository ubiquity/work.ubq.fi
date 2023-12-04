import { authentication } from "./authentication";

authentication();
filterButtons();
function filterButtons() {
  const filters = document.getElementById("filters");
  if (!filters) throw new Error("filters not found");
  const buttons = filters.querySelectorAll("input");

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      console.trace(button);
      sortIssuesBy(button.value);
    });
  });
}
