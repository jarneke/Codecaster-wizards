document.addEventListener("DOMContentLoaded", () => {
    const myModal = new bootstrap.Modal(document.getElementById('infoModal'));
    myModal.show();
});
let infoBtn = document.getElementById("infoBtn")
infoBtn.addEventListener("click", () => {
    const myModal = new bootstrap.Modal(document.getElementById('infoModal'));
    myModal.show();
})