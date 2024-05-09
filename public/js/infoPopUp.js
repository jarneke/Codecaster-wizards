// when dom is loaded
document.addEventListener("DOMContentLoaded", () => {
    // show modal if found
    const myModal = new bootstrap.Modal(document.getElementById('infoModal'));
    if (myModal) {
        myModal.show();
    }
})