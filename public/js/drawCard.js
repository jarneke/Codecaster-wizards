// wait for DOM to be loaded
document.addEventListener("DOMContentLoaded", () => {
    // Get all needed dom elements
    const form = document.getElementById("actionForm");
    const actionField = document.getElementById("actionField")
    const deck = document.getElementById("hiddenSelectedDeck")
    const selectedDeck = document.getElementById("decks")
    const allBtnPullCard = document.getElementsByClassName("btnPullCard");
    const allBtnResetCards = document.getElementsByClassName("btnResetCards");
    const pulledCardsBtn = document.getElementById("pulledCardsBtn");
    const cardLookupInDeckInput = document.getElementById("cardLookupInDeckInput");
    const targetElement = document.getElementById('pulledCards');
    const dropdown = document.getElementById("cardLookupInDeckDropdown");
    const dropdownItems = document.getElementById("cardNames");
    const allChildren = dropdownItems.children;
    const cardLookupInDeckForm = document.getElementById("cardLookupInDeckForm");
    const hiddenField = document.getElementById("cardLookupInDeck")
    // initialize array for all card names
    const allCardNames = []
    // loop over allChildren array
    for (let i = 0; i < allChildren.length; i++) {
        const cardBtn = allChildren[i];
        // get cardName from attribute of the child element
        const cardName = cardBtn.getAttribute("data-cardName");
        // add it to cardNames
        allCardNames.push(cardName)
    }
    // for each childelement of the dropdown add a clicklistener to submit the form with correct hidden value
    for (let i = 0; i < allChildren.length; i++) {
        const cardBtn = allChildren[i];
        const cardName = cardBtn.getAttribute("data-cardName");
        cardBtn.addEventListener("click", () => {
            // set hidden field value
            hiddenField.value = cardName;
            // submit form
            cardLookupInDeckForm.submit();
        });
    }
    // if cardLookupInDeckForm is submitted
    cardLookupInDeckForm.addEventListener("submit", (e) => {
        // prevent default behaviour
        e.preventDefault()
        // if hiddenField is empty
        if (hiddenField.value === "") {
            // filter out all that dont match input
            let matchingCards = allCardNames.filter(cardName => cardName.toLowerCase().includes(cardLookupInDeckInput.value.toLowerCase()));
            // filter out all duplicate cardNames
            let uniqueNames = new Set(matchingCards.map(cardName => cardName.toLowerCase()));

            // if length === 0, no cards found
            if (matchingCards.length === 0) {
                hiddenField.value = "no-card-found"
                // if only one unique cardName is found set to first name
            } else if (uniqueNames.size === 1) {
                hiddenField.value = matchingCards[0]
                // else multiple cards found
            } else {
                hiddenField.value = "multiple-cards-found"
            }
            // submit form
            cardLookupInDeckForm.submit()
        } else {
            // submit form
            cardLookupInDeckForm.submit()
        }
    })
    // for all buttons to pull a card, add clicklistener
    for (const btnPullCard of allBtnPullCard) {
        btnPullCard.addEventListener('click', (e) => {
            e.preventDefault();

            // find element and execute animation
            const nextCard = document.getElementById("flip-card")
            nextCard.classList.toggle("flipped")

            // set values for form submit
            deck.value = selectedDeck.value;
            actionField.value = "pull";
            //wait for animation
            setTimeout(() => {
                // submit form to execute pull
                form.submit();
            }, 900);
        });
    }
    // for all buttons to reset pulled cards, add clicklistener
    for (const btnResetCards of allBtnResetCards) {
        btnResetCards.addEventListener('click', (e) => {
            e.preventDefault();

            // set form values
            deck.value = selectedDeck.value;
            actionField.value = "reset";
            // submit form to backend
            form.submit();
        });

    }
    pulledCardsBtn.addEventListener("click", () => {
        // on click scroll to pulledcards
        targetElement.scrollIntoView();
    })

    let cardLookupInDeckInputValue = "";
    // on focus display all cards that can be found in remaining unpulled cards
    cardLookupInDeckInput.addEventListener("focusin", (e) => {
        e.preventDefault();

        for (let i = 0; i < allChildren.length; i++) {
            const cardBtn = allChildren[i];
            const cardName = cardBtn.getAttribute("data-cardName");
            // only display the ones where a match is found in the input box
            if (cardName.toLowerCase().includes(cardLookupInDeckInput.value.toLowerCase())) {
                cardBtn.classList.remove("d-none")
            }
        }
    })
    // when clicked anywhere that is not the lookup box, set all childelements to display none
    document.addEventListener('mousedown', (e) => {
        // check if click is inside dropdown
        const isClickInsideInput = dropdown.contains(e.target);
        // if not
        if (!isClickInsideInput) {
            // set all childelements to display none
            for (let i = 0; i < allChildren.length; i++) {
                const cardBtn = allChildren[i];
                cardBtn.classList.add("d-none")
            }
        }
    });
    // on input of field, 
    cardLookupInDeckInput.addEventListener("input", (e) => {
        // update lookup value field
        cardLookupInDeckInputValue += e.data
        // for evry child element
        for (let i = 0; i < allChildren.length; i++) {
            const cardBtn = allChildren[i];
            // get the card name
            const cardName = cardBtn.getAttribute("data-cardName");
            // if not found, display in console
            if (!cardName) {
                // Handle the case where cardName is null
                console.log("null :/");
                continue;
            }
            // if inputValue = "" make element disapear
            if (cardLookupInDeckInput.value == "") {
                cardBtn.classList.add("d-none");
                cardBtn.classList.remove("d-block");
                // if lookup matches cardname, display
            } else if (cardName.toLowerCase().includes(cardLookupInDeckInput.value.toLowerCase())) {
                cardBtn.classList.add("d-block");
                cardBtn.classList.remove("d-none");
                // else disapear
            } else {
                cardBtn.classList.add("d-none");
                cardBtn.classList.remove("d-block");
            }
        }
    })


    // on page load get the X and Y values
    updateCSSVariables();
    // and evrytime the page gets resized, get the X and Y values.
    window.addEventListener('resize', updateCSSVariables);
});
/**
* Function to update the css variables used for the animation
*/
function updateCSSVariables() {
    // document.getElementById() makes it not work for some reason, so i used queryselectors.

    // get the element to animate
    const animationElement = document.querySelector('.flip-card');
    // get element to animate to
    const targetElement = document.querySelector('.pulledPile');
    // get boundingbox of the animate element
    const animationRect = animationElement.getBoundingClientRect();

    // Wait for the image to load
    const img = targetElement.querySelector('img');
    if (img.complete) {
        calculateDimensions();
    } else {
        img.onload = calculateDimensions;
    }

    /**
     * A function to calculate the x and y values that the element has to animate
     */
    function calculateDimensions() {

        const targetRect = targetElement.getBoundingClientRect();

        // Calculate the difference in size between the two elements
        // since they are around the same size, these should be close to 0
        const sizeDiffX = (targetRect.width - animationRect.width) / 2;
        const sizeDiffY = (targetRect.height - animationRect.height) / 2;

        // Calculate the translation values based on the center of the target element

        // little more explenation:
        // targetRect.left = how much space from the edge of the screen to the edge of the element
        // we want to move to the center of the target, so we take the width / 2

        // we add those together to get the amount we have from the left of the screen to the center line of the element

        // we then do the same from the animationRect and subtract this from the targetRect value
        // this gives us the amount we have to move on the X axis
        // the - sizeDiffX, is to adjust a bit if the elements arent the same size, but this is so minor that you may aswell leave it out
        const translateXValue = targetRect.left + (targetRect.width / 2) - (animationRect.left + (animationRect.width / 2)) - sizeDiffX;
        // we do simular with the Y axis, but use amount from top and height of the element
        const translateYValue = targetRect.top + (targetRect.height / 2) - (animationRect.top + (animationRect.height / 2)) - sizeDiffY;

        // set the root values so the animation gets the values.
        document.documentElement.style.setProperty('--translate-x', translateXValue + 'px');
        document.documentElement.style.setProperty('--translate-y', translateYValue + 'px');
    }
}
