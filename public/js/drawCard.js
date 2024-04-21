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

            const nextCard = document.getElementById("flip-card")
            nextCard.classList.toggle("flipped")

            deck.value = selectedDeck.value;
            actionField.value = "pull";
            //wait for animation
            setTimeout(() => {

                form.submit();
            }, 1900);
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

    function updateCSSVariables() {
        const animationElement = document.querySelector('.flip-card');
        const targetElement = document.querySelector('.pulledPile');
        const animationRect = animationElement.getBoundingClientRect();
        const targetRect = targetElement.getBoundingClientRect();

        // Calculate the difference in size between the two elements
        const sizeDiffX = (targetRect.width - animationRect.width) / 2;
        const sizeDiffY = (targetRect.height - animationRect.height) / 2;

        // Calculate the translation values based on the center of the target element
        const translateXValue = targetRect.left + (targetRect.width / 2) - (animationRect.left + (animationRect.width / 2)) - sizeDiffX;
        const translateYValue = targetRect.top + (targetRect.height / 2) - (animationRect.top + (animationRect.height / 2)) - sizeDiffY;

        document.documentElement.style.setProperty('--translate-x', translateXValue + 'px');
        document.documentElement.style.setProperty('--translate-y', translateYValue + 'px');
    }

    updateCSSVariables();
    window.addEventListener('resize', updateCSSVariables);
});