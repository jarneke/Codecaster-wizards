document.addEventListener("DOMContentLoaded", () => {
    // custom checkboxes
    let allCheckboxes = document.getElementsByClassName("mana-checkbox")
    for (const checkbox of allCheckboxes) {
        // on click do logic
        checkbox.addEventListener("click", (e) => {
            e.preventDefault();
            update(checkbox);
        })
    }
    // sort direction
    let sortDirectionButton = document.getElementById("sortDirectionButton")
    sortDirectionButton.addEventListener("click", (e) => {
        e.preventDefault();
        let hiddenField = document.getElementById("sortDirection");
        let isUp = sortDirectionButton.getAttribute("data-cbs-direction") === "up";

        sortDirectionButton.setAttribute("data-cbs-direction", isUp ? "down" : "up");
        hiddenField.value = isUp ? "down" : "up";
        sortDirectionButton.innerHTML = isUp ? '<i class="bi bi-sort-down"><i>' : '<i class="bi bi-sort-up"><i></i>'
    })

    function updateHiddenField(checkboxId, isChecked) {
        let hiddenField = document.getElementById(checkboxId + "Checked");
        hiddenField.value = isChecked ? "false" : "true";
    }
    function update(checkbox) {
        let checkedState = checkbox.getAttribute("data-cbs-checked");
        let isChecked = checkedState === "true";
        checkbox.setAttribute("data-cbs-checked", isChecked ? "false" : "true");
        isChecked ? checkbox.classList.replace("cbg-success", "cbg-danger") : checkbox.classList.replace("cbg-danger", "cbg-success");
        updateHiddenField(checkbox.id, isChecked);
    }
})