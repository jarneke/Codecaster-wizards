import Magic = require("mtgsdk-ts");
import * as i from "./interfaces";

/**
 * Function to get the cards u need to load the page
 * @param allItems The array of all the items
 * @param page The page you want to load
 * @param pageSize The amount of items you want on the page
 * @returns an array with length of pageSize
 */
export function getCardsForPage(allItems: Magic.Card[], page: number, pageSize: number): Magic.Card[] {
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return allItems.slice(startIndex, endIndex);
}
/**
 * Function to get The total amount of pages
 * @param allItems The array of all the items
 * @param pageSize The amount of items per page
 * @returns The amount of pages you can have with a certain page size
 */
export function getTotalPages(allItems: any, pageSize: number): number {
    return Math.ceil(allItems.length / pageSize);
}
/**
 * Function to handle the pagination logic
 * @param reqQuery req.query of the route
 * @param pageQueryParam req.query.page
 * @param pageSize The size of the pages 
 * @param allItems The list of all items to calculate the total pages
 * @returns The page number, totalPages and filterUrl
 */
export function handlePageClickEvent(reqQuery: any, pageQueryParam: string, pageSize: number, allItems: any): i.PageData {
    let page: number = parseInt(pageQueryParam) || 1
    // get totalPages
    let totalPages: number = getTotalPages(allItems, pageSize)
    //initialize filterUrl
    let filterUrl: string = "";

    // for every param in req.query, 
    // check if key is not page and value exists
    // if true => add to filterUrl
    // if false => skip
    for (const [key, value] of Object.entries(reqQuery)) {
        if (key !== "page" && value && key !== "action") {
            filterUrl += `${key}=${value}&`;
        }
    }
    // Remove trailing '&' if present
    filterUrl = filterUrl.replace(/&$/, '');

    // return data in pageData Obj
    return {
        page: page,
        totalPages: totalPages,
        filterUrl: filterUrl
    };
}
/**
 * Function that gets all types of the loaded cards
 * @param allCards array of all cards
 * @returns array of all types
 */
export function getAllCardTypes(allCards: Magic.Card[]): string[] {
    let types: string[] = []
    for (const card of allCards) {
        let cardTypes = card.types
        if (cardTypes && Array.isArray(cardTypes)) {
            for (const type of cardTypes) {
                if (!types.includes(type)) {
                    types.push(type);
                }
            }
        }
    }
    return types;
}
/**
 * Function that gets all types of the loaded cards
 * @param allCards array of all cards
 * @returns array of all types
 */
export function getAllRarities(allCards: Magic.Card[]): string[] {
    let types: string[] = []
    for (const card of allCards) {
        let cardTypes = card.rarity
        if (!types.includes(cardTypes)) {
            types.push(cardTypes);
        }
    }
    return types;
}
/**
 * A function to filter cards by a specified mana color
 * @param arrToFilter The array to filter
 * @param manaReqQuery the req.query.<mana>ManaColor
 * @param colorCode The color code corresponding to the mana color (W, U, B, G, R, C)
 * @returns filtered array
 */
export function filterManaType(arrToFilter: Magic.Card[], manaReqQuery: any, colorCode: string): Magic.Card[] {
    if (manaReqQuery != undefined && manaReqQuery != "") {
        if (manaReqQuery == "false") {
            arrToFilter = arrToFilter.filter(e => e.manaCost && !e.manaCost.includes(colorCode))
        }
    }
    return arrToFilter;
}
/**
 * A function to filter cards by colorless mana color
 * @param arrToFilter The array to filter
 * @param manaReqQuery the req.query.<mana>ManaColor
 * @returns filtered array
 */
export function filterColorlessManaType(arrToFilter: Magic.Card[], manaReqQuery: any): Magic.Card[] {
    if (manaReqQuery !== undefined && manaReqQuery !== "") {
        if (manaReqQuery == "false") {
            arrToFilter = arrToFilter.filter(e => {
                const hasNumber = /\d/.test(e.manaCost);
                return !hasNumber;
            })
        }
    }
    return arrToFilter;
}
export function sortBy(a: i.Card, b: i.Card, sortParam: string): number {
    if (typeof a[`${sortParam}`] === "string" && typeof b[`${sortParam}`] === "string") {
        return a[`${sortParam}`].localeCompare(b[`${sortParam}`])
    } else if (typeof a[`${sortParam}`] === "number" && typeof b[`${sortParam}`] === "number") {
        return b[`${sortParam}`] - a[`${sortParam}`]
    } else {
        console.log(typeof a[`${sortParam}`]);
        return 0;
    }
}
export function getDecksForPage(allItems: i.Deck[], page: number, pageSize: number): i.Deck[] {
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return allItems.slice(startIndex, endIndex);
}
export function filterAndSortCards(allCards: Magic.Card[], cardLookup: any, filterType: any, filterRarity: any, whiteManaChecked: any, blueManaChecked: any, blackManaChecked: any, greenManaChecked: any, redManaChecked: any, colorlessManaChecked: any, sort: any, sortDirection: any): Magic.Card[] {
    let filteredCards: Magic.Card[] = [...allCards];
    // check if there was a search param specified
    if (cardLookup != undefined && cardLookup != "") {
        // filter the cards
        filteredCards = filteredCards.filter(e => `${e.name}${e.id}${e.multiverseid}`.toLowerCase().includes(`${cardLookup}`.toLowerCase()))
    }
    // check if type param was specified
    if (filterType != undefined && filterType != "") {
        // filter the cards
        filteredCards = filteredCards.filter(e => e.types.includes(`${filterType}`))
    }
    // check if rarity param was specified
    if (filterRarity != undefined && filterRarity != "") {
        filteredCards = filteredCards.filter(e => e.rarity.includes(`${filterRarity}`))
    }
    // check if checkboxes are checked
    // filter White mana
    filteredCards = filterManaType(filteredCards, whiteManaChecked, "W")
    filteredCards = filterManaType(filteredCards, blueManaChecked, "U")
    filteredCards = filterManaType(filteredCards, blackManaChecked, "B")
    filteredCards = filterManaType(filteredCards, greenManaChecked, "G")
    filteredCards = filterManaType(filteredCards, redManaChecked, "R")
    filteredCards = filterColorlessManaType(filteredCards, colorlessManaChecked)
    // sort logic
    let sortedCards: Magic.Card[] = [...filteredCards]
    if (sort != undefined && sort != "" && sortDirection != undefined && sortDirection != "") {
        if (`${sortDirection}` === "down") {
            sortedCards = [...sortedCards.sort((a: Magic.Card, b: Magic.Card) => sortBy(a, b, `${sort}`))]
        } else {
            sortedCards = [...sortedCards.sort((a: Magic.Card, b: Magic.Card) => sortBy(a, b, `${sort}`) * -1)]
        }
    }

    return sortedCards
}
export function shuffleCards(cards: Magic.Card[]): Magic.Card[] {
    for (let i = cards.length - 1; i > 0; i--) {
        const j: number = Math.floor(Math.random() * (i + 1))
        const temp = cards[i];
        cards[i] = cards[j];
        cards[j] = temp
    }
    return cards;
}
export function getRandomNumber(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
export function getChance(cards: Magic.Card[], card: Magic.Card): { chance: number, amount: number } {
    console.log('Card object:', card); // Add this line for logging
    let count = 0;
    cards.forEach((arrCard, index) => {
        if (arrCard && typeof arrCard === typeof card && arrCard.name === card.name) {
            count++;
        }
    });
    let amountOfCard: number = count;
    return {
        chance: Math.round((amountOfCard / cards.length) * 10000) / 100,
        amount: amountOfCard
    };
}
