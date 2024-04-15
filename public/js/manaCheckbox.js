document.addEventListener("DOMContentLoaded", () => {
    let allCheckboxes = document.getElementsByClassName("mana-checkbox")
    for (const checkbox of allCheckboxes) {
        // update on page load
        update(checkbox);
        // update on click
        checkbox.addEventListener("click", (e) => {
            e.preventDefault();
            update(checkbox);
        })
    }
    function updateHiddenField(checkboxId, isChecked) {
        console.log(checkboxId + "Checked");
        let hiddenField = document.getElementById(checkboxId + "Checked");
        hiddenField.value = isChecked ? "true" : "false";
    }
    function update(checkbox) {
        let isChecked = checkbox.getAttribute("data-cbs-checked") === "true";
        checkbox.setAttribute("data-cbs-checked", isChecked ? "false" : "true");
        isChecked ? checkbox.classList.replace("cbg-danger", "cbg-success") : checkbox.classList.replace("cbg-success", "cbg-danger");
        updateHiddenField(checkbox.id, isChecked);
    }
})