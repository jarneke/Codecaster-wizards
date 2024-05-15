document.addEventListener("DOMContentLoaded", ()=>{
    const form = document.getElementById("imageForm")
    const allBtns = document.getElementsByClassName("imgButton");
    const hidden = document.getElementById("hiddenImgUrl")
    const editHidden = document.getElementById("editHiddenImgUrl")
    const deckImage = document.getElementById("deckImage");
    for (const btn of allBtns) {
        btn.addEventListener("click", ()=>{
        const imagesrc = btn.firstElementChild.src
            hidden.value = imagesrc;
            editHidden.value = imagesrc;
            deckImage.src = imagesrc;
            setTimeout(() => {
                
            }, 5000);
            form.submit();
        })
    }
})