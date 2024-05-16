document.addEventListener("DOMContentLoaded", () => {
    const allBtns = document.getElementsByClassName("imgButton");
    const deckImage = document.getElementById("deckImage");
    const hiddenElement = document.getElementById("imgUrl")
    for (const btn of allBtns) {
        btn.addEventListener("click", () => {
            const imageSrc = btn.firstElementChild.src
            deckImage.src = imageSrc;
            hiddenElement.value = imageSrc;
        })
    }
})