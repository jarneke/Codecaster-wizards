document.addEventListener("DOMContentLoaded", () => {
    const modalElement = document.getElementById("infoModal");
    const infoModal = new bootstrap.Modal(modalElement);
    const form = document.getElementById("infoForm");
    const btn = document.getElementById("iUnderstand");
    const checkbox = document.getElementById("dontShowAgain");

    btn.addEventListener("click", () => {
        console.log("clicked");
        if (checkbox.checked) {
            form.submit();
        }
    });
});
