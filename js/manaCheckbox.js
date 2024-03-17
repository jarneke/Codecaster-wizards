let allCheckboxes = document.getElementsByClassName("mana-checkbox")
for (const checkbox of allCheckboxes) {
    checkbox.addEventListener("click", (e) => {
        e.preventDefault();
        if (checkbox.getAttribute("data-cbs-checked") === "false") {
            checkbox.classList.replace("cbg-danger", "cbg-success");
            checkbox.setAttribute("data-cbs-checked", "true");
        } else {
            checkbox.classList.replace("cbg-success", "cbg-danger");
            checkbox.setAttribute("data-cbs-checked", "false");
        }
    })
}