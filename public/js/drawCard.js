document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("actionForm");
    const actionField = document.getElementById("actionField")
    const deck = document.getElementById("hiddenSelectedDeck")
    const selectedDeck = document.getElementById("decks")
    const allBtnPullCard = document.getElementsByClassName("btnPullCard");
    const allBtnResetCards = document.getElementsByClassName("btnResetCards");
    for (const btnPullCard of allBtnPullCard) {
        btnPullCard.addEventListener('click', (e) => {
            e.preventDefault();

            deck.value = selectedDeck.value;
            actionField.value = "pull";
            form.submit();
        });
    }
    for (const btnResetCards of allBtnResetCards) {
        btnResetCards.addEventListener('click', (e) => {
            e.preventDefault();

            deck.value = selectedDeck.value;
            actionField.value = "reset";
            form.submit();
        });

    }
});