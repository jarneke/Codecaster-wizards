document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("actionForm");
    const actionField = document.getElementById("actionField")
    const deck = document.getElementById("hiddenSelectedDeck")
    const selectedDeck = document.getElementById("decks")
    const allBtnPullCard = document.getElementsByClassName("btnPullCard");
    const allBtnResetCards = document.getElementsByClassName("btnResetCards");
    const pulledCardsBtn = document.getElementById("pulledCardsBtn");
    const cardLookupInDeckInput = document.getElementById("cardLookupInDeckInput")
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
            }, 900);
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
    pulledCardsBtn.addEventListener("click", () => {
        const targetElement = document.getElementById('pulledCards');
        // Scroll to the target element without modifying URL
        targetElement.scrollIntoView();
    })
    let cardLookupInDeckInputValue = "";
    cardLookupInDeckInput.addEventListener("focusin", (e) => {
        e.preventDefault();

        const dropdown = document.getElementById("cardLookupInDeckDropdown")
        const allChildren = dropdown.children;

        for (let i = 1; i < allChildren.length; i++) {
            const cardBtn = allChildren[i];
            cardBtn.classList.remove("d-none")
        }
    })
    cardLookupInDeckInput.addEventListener("focusout", (e) => {
        e.preventDefault();

        const dropdown = document.getElementById("cardLookupInDeckDropdown")
        const allChildren = dropdown.children;

        for (let i = 1; i < allChildren.length; i++) {
            const cardBtn = allChildren[i];
            cardBtn.classList.add("d-none")
        }
    })
    cardLookupInDeckInput.addEventListener("input", (e) => {
        cardLookupInDeckInputValue += e.data
        const form = document.getElementById("cardLookupInDeckForm")
        const hiddenField = document.getElementById("cardLookupInDeck")
        const dropdown = document.getElementById("cardLookupInDeckDropdown")

        const allChildren = dropdown.children;
        // show and hide cards on input
        // handle click on subelements
        for (let i = 1; i < allChildren.length; i++) {
            const cardBtn = allChildren[i];
            const cardName = cardBtn.getAttribute("data-cardName");
            if (!cardName) {
                // Handle the case where cardName is null
                console.log("null :/");
                continue;
            }
            console.log(cardLookupInDeckInput.value);
            if (cardLookupInDeckInput.value == "") {
                cardBtn.classList.add("d-none");
                cardBtn.classList.remove("d-block");
            } else if (cardName.toLowerCase().includes(cardLookupInDeckInput.value.toLowerCase())) {
                cardBtn.classList.add("d-block");
                cardBtn.classList.remove("d-none");
            } else {
                cardBtn.classList.add("d-none");
                cardBtn.classList.remove("d-block");
            }
            cardBtn.addEventListener("click", () => {
                hiddenField.value = cardName;
                form.submit();
            });
        }


    })
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