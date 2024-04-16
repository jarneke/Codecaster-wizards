document.addEventListener("DOMContentLoaded", () => {
    let allCheckboxes = document.getElementsByClassName("mana-checkbox")
    for (const checkbox of allCheckboxes) {
        // on page load, initialize checkboxes


        // on click do logic
        checkbox.addEventListener("click", (e) => {
            e.preventDefault();
            update(checkbox);
        })
    }
    function updateHiddenField(checkboxId, isChecked) {
        console.log(checkboxId + "Checked");
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