document.addEventListener("DOMContentLoaded", () => {
    const modalElement = document.getElementById("infoModal");
    const infoModal = new bootstrap.Modal(modalElement);
    const form = document.getElementById("infoForm");
    const btn = document.getElementById("iUnderstand");
    const checkbox = document.getElementById("dontShowAgain");
    const checkboxLabel = document.getElementById("dontShowAgainLabel")

    btn.addEventListener("click", () => {
        console.log("clicked");
        if (checkbox.checked) {
            form.submit();
        } else {
            for (let i = 0; i < 6; i++) {
                checkboxLabel.classList.add("blink-anim")
            }
        }
    });
});
