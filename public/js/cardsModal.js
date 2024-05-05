document.addEventListener("DOMContentLoaded", () => {
    const cardModal = document.getElementById('cardModal')
    if (cardModal) {
        cardModal.addEventListener('show.bs.modal', e => {
            const clicked = e.relatedTarget
            // DATA TO LOAD
            const name = clicked.getAttribute('data-bs-name');
            const manaCost = clicked.getAttribute('data-bs-manaCost');
            const cmc = clicked.getAttribute("data-bs-cmc")
            const colorIdentity = clicked.getAttribute("data-bs-colorId")
            const rarity = clicked.getAttribute("data-bs-rarity");
            const imageUrl = clicked.getAttribute("data-bs-imageUrl")
            // ELEMENTS TO FILL
            const modalHeaderTitle = document.getElementById("cardModalLabel");
            const modalCardBackArticle = document.getElementById("cardModalBorderElement")
            const cardModalImage = document.getElementById("cardModalImage");
            const cardModalCardName = document.getElementById("cardModalCardname");
            const cardModalManaCost = document.getElementById("cardModalManaCost");
            const cardModalCmc = document.getElementById("cardModalCmc");
            const cardModalColorId = document.getElementById("cardModalColorId");
            // FILL IN DATA
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
        })
    }
})

function convertManaCostToImages(manaCost) {
    let response = "";
    let i = 0;
    while (i < manaCost.length) {
        if (manaCost[i] == '{') {
            let endIndex = manaCost.indexOf('}', i);
            if (endIndex !== -1) {
                let symbol = manaCost.substring(i + 1, endIndex);
                response += `<img style="width: 1.5rem" src="/assets/images/mana_symbols/${symbol}.svg" alt="${symbol}">`;
                i = endIndex + 1;
            } else {
                response += `<img style="width: 1.5rem" src="/assets/images/mana_symbols/${manaCost[i]}.svg" alt="${manaCost[i]}">`;
                i++;
            }
        } else if (manaCost[i] == '}') {
            response += `<img style="width: 1.5rem" src="/assets/images/mana_symbols/${manaCost[i]}.svg" alt="${manaCost[i]}">`;
            i++;
        } else {
            response += `<img style="width: 1.5rem" src="/assets/images/mana_symbols/${manaCost[i]}.svg" alt="${manaCost[i]}">`;
            i++;
        }
    }
    return response;
}
function convertCmcToImage(cmc) {
    return `<img style="width: 1.5rem" src="/assets/images/mana_symbols/${cmc}.svg" alt="${cmc}">`
}
function convertColorIdToImages(manaList) {
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

function doesImageExist(imageUrl) {
    const http = new XMLHttpRequest();
    http.open('HEAD', imageUrl, false);
    http.send();
    return http.status !== 404;
}
function tryAll(arr) {
    if (arr.length === 0) {
        return [[]];
    }
    const result = [];
    for (let i = 0; i < arr.length; i++) {
        const rest = [...arr.slice(0, i), ...arr.slice(i + 1)];
        const rests = tryAll(rest);
        for (const rest of rests) {
            result.push([arr[i], ...rest]);
        }
    }
    return result;
}
