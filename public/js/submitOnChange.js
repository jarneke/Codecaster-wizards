document.addEventListener("DOMContentLoaded", () => {
    const deckSelect = document.getElementById("decks")
    const form = deckSelect.closest("form")
    deckSelect.addEventListener("change", (e) => {
        form.submit();
    })
})