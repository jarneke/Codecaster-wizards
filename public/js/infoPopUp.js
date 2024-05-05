document.addEventListener("DOMContentLoaded", () => {
    const showModal = localStorage.getItem("showModal");
    const closeInfo = document.getElementById("CloseInfo");
    const dontShowAgain = document.getElementById("dontShowAgain");
    if (showModal === "true" || showModal === null) {
        const myModal = new bootstrap.Modal(document.getElementById('infoModal'));
        myModal.show();
    }
    closeInfo.addEventListener("click", e => {
        e.preventDefault();

        if (dontShowAgain.checked == true) {
            localStorage.setItem("showModal", false)
        } else {
            localStorage.setItem("showModal", true)
        }
    })
})