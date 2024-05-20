// wait for DOM to be loaded
document.addEventListener("DOMContentLoaded", () => {
    // Get cardModal
    const cardModal = document.getElementById('cardModal')
    // if found
    if (cardModal) {
        // if modal gets triggered to show
        cardModal.addEventListener('show.bs.modal', e => {
            // get data
            // - get the card that was clicked
            const clicked = e.relatedTarget
            // - Get card data
            const _id = clicked.getAttribute("data-bs-_id");
            const name = clicked.getAttribute('data-bs-name');
            const manaCost = clicked.getAttribute('data-bs-manaCost');
            const cmc = clicked.getAttribute("data-bs-cmc")
            const colorIdentity = clicked.getAttribute("data-bs-colorId")
            const rarity = clicked.getAttribute("data-bs-rarity");
            const imageUrl = clicked.getAttribute("data-bs-imageUrl")
            // get modal elements
            const modalHeaderTitle = document.getElementById("cardModalLabel");
            const modalCardBackArticle = document.getElementById("cardModalBorderElement")
            const cardModalImage = document.getElementById("cardModalImage");
            const cardModalCardName = document.getElementById("cardModalCardname");
            const cardModalManaCost = document.getElementById("cardModalManaCost");
            const cardModalCmc = document.getElementById("cardModalCmc");
            const cardModalColorId = document.getElementById("cardModalColorId");
            const addToDeckForm = document.getElementById("AddToDeck");
            // Fill madal with data
            modalHeaderTitle.textContent = name;
            // - clear color if they exist
            modalCardBackArticle.classList.remove("cbg-white", "cbg-warning-l", "cbg-yellow", "cbg-danger")
            // - apply color based on rarity
            modalCardBackArticle.classList.add("card", "rounded-4", "p-1", rarity == 'Common' ? 'cbg-white' : rarity == 'Uncommon' ? 'cbg-warning-l' : rarity == 'Rare' ? 'cbg-yellow' : rarity == 'Mythic' ? 'cbg-danger' : 'cbg-success')
            cardModalImage.src = imageUrl
            cardModalCardName.textContent = name;
            cardModalManaCost.innerHTML = convertManaCostToImages(manaCost);
            cardModalCmc.innerHTML = convertCmcToImage(cmc);
            cardModalColorId.innerHTML = convertColorIdToImages(colorIdentity);
            addToDeckForm.addEventListener("submit", (e) => {
                e.preventDefault();

                const selectedDeck = document.getElementById("AddToDeckSubmit").value
                addToDeckForm.action = `/addCardTooDeck/${selectedDeck}/${_id}/1`
                addToDeckForm.submit()
            })
        })
    }
})
/**
 * A function to convert manaCost: string to one or more img elements
 * @param {string} manaCost The manacost string
 * @returns {string} One or more html image elements as a string
 */
function convertManaCostToImages(manaCost) {
    // initialize response string
    let response = "";
    // initialize index
    let i = 0;
    // if manaCost is empty, return 0.svg
    if (manaCost == "") {
        return `<img style="width: 1.5rem" src="/assets/images/mana_symbols/0.svg" alt="0">`;
    }
    // loop over manacost
    while (i < manaCost.length) {
        // if "{" is found
        if (manaCost[i] == '{') {
            // get end "}" of manacost part
            let endIndex = manaCost.indexOf('}', i);
            // if end is found
            if (endIndex !== -1) {
                // get chars inbetween start and end
                let symbol = manaCost.substring(i + 1, endIndex);
                // add img to response, with removing "/"
                response += `<img style="width: 1.5rem" src="/assets/images/mana_symbols/${symbol.split("/").join("")}.svg" alt="${symbol}">`;
                // skip looping to after end
                i = endIndex + 1;
                // if end is not found add manaCost[i].svg to response (Should in theory never happen as the manaCost is always {#}{#}{#} of sorts)
            } else {
                console.log("Ocurrance that should never happened triggered - 1")
                response += `<img style="width: 1.5rem" src="/assets/images/mana_symbols/${manaCost[i]}.svg" alt="${manaCost[i]}">`;
                i++;
            }
            // if next element is not "{" add manaCost[i].svg to response (Should in theory never happen as the manaCost is always {#}{#}{#} of sorts)
        } else if (manaCost[i] == '}') {
            console.log("Ocurrance that should never happened triggered - 2")
            response += `<img style="width: 1.5rem" src="/assets/images/mana_symbols/${manaCost[i]}.svg" alt="${manaCost[i]}">`;
            i++;
            // else add manaCost[i].svg to response (Should in theory never happen as the manaCost is always {#}{#}{#} of sorts)
        } else {
            console.log("Ocurrance that should never happened triggered - 3")
            response += `<img style="width: 1.5rem" src="/assets/images/mana_symbols/${manaCost[i]}.svg" alt="${manaCost[i]}">`;
            i++;
        }
    }
    // return response
    return response;
}
/**
 * A function to convert convertedManaCost: nmber to image
 * @param {number} cmc convertedManaCost
 * @returns {string} html img element as a string with corresponding image
 */
function convertCmcToImage(cmc) {
    return `<img style="width: 1.5rem" src="/assets/images/mana_symbols/${cmc}.svg" alt="${cmc}">`
}
/**
 * A function that converts colorIdentity[] to html img element(s) as a string
 * @param {string[]} manaList list of manaTypes
 * @returns one or more html img elements as a string with correct corresponding colorIdentity
 */
function convertColorIdToImages(manaList) {
    if (manaList === "") return `<img style="width: 1.5rem" src="/assets/images/mana_symbols/C.svg" alt="C">`

    const symbols = manaList.split(',');
    const all = tryAll(symbols);

    let imagePath = '';
    let found = false;
    for (const one of all) {
        const combinedSymbol = one.join('');
        imagePath = `/assets/images/mana_symbols/${combinedSymbol}.svg`;
        if (doesImageExist(imagePath)) {
            found = true;
            break;
        }
    }
    if (!found) {
        imagePath = '';
        for (const symbol of symbols) {
            const individualPath = `/assets/images/mana_symbols/${symbol}.svg`;
            if (doesImageExist(individualPath)) {
                imagePath += `<img style="width: 1.5rem" src="${individualPath}" alt="${symbol}">`;
            }
        }
    } else {
        imagePath = `<img style="width: 1.5rem" src="${imagePath}" alt="${symbols.join(',')}">`;
    }
    return imagePath;
}
/**
 * A funtion to check if a certain image exists on the webserver
 * @param {string} imageUrl the url of the image to check
 * @returns {boolean} if found true else false
 */
function doesImageExist(imageUrl) {
    const http = new XMLHttpRequest();
    http.open('HEAD', imageUrl, false);
    http.send();
    return http.status !== 404;
}
/**
 * A recursive function that checks evry possible way of sorting an array ex. ["a", "b"] => [["a", "b"],["b", "a"]]
 * @param {string[]} arr array to check all possible ways of sorting it
 * @returns {[string[]]}] array with all possible sorted arrays
 */
function tryAll(arr) {
    // If the input array is empty, return an array containing an empty array
    if (arr.length === 0) {
        return [[]];
    }
    // Initialize an empty array to store the permutations
    const result = [];
    // Iterate through each element in the input array
    for (let i = 0; i < arr.length; i++) {
        // Create a new array 'rest' that contains all elements of 'arr' except the one at index 'i'
        const rest = [...arr.slice(0, i), ...arr.slice(i + 1)];
        // Recursively call tryAll to get all permutations of the 'rest' array
        const rests = tryAll(rest);
        // For each permutation returned, prepend the current element 'arr[i]' and add it to the results
        for (const rest of rests) {
            result.push([arr[i], ...rest]);
        }
    }
    // Return the array of all permutations
    return result;
}