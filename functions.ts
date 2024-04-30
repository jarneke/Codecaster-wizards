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

export function getCardWAmauntForPage(allItems: Map<Magic.Card, number>, page: number, pageSize: number): Map<Magic.Card, number> {
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const slicedItems = new Map<Magic.Card, number>();

    let index = 0;
    // Iterate over allItems and add items within the startIndex and endIndex range to slicedItems
    for (const [card, quantity] of allItems) {
        if (index >= startIndex && index < endIndex) {
            slicedItems.set(card, quantity);
        }
        index++;
        // If we've reached the endIndex, exit the loop
        if (index === endIndex) break;
    }

    return slicedItems;
}

/**
 * Function to get The total amount of pages
 * @param allItems The array of all the items
 * @param pageSize The amount of items per page
 * @returns The amount of pages you can have with a certain page size
 */
function getTotalPages(allItems: any, pageSize: number): number {
    return Math.ceil(allItems.length / pageSize);
}
/**
 * Function to handle the pagination logic
 * @param reqQuery req.query of the route
 * @param pageQueryParam req.query.page
 * @param pageSize The size of the pages 
 * @param allItems The list of all items to calculate the total pages
 * @returns obj with obj.page being the page number, obj.totalPages being the total amount of pages you can have and obj.filterUrl being the url that needs to be added to the pagination element so that when we change pages, our filter and sort will remain
 */
export function handlePageClickEvent(reqQuery: any, pageQueryParam: string, pageSize: number, allItems: any): i.PageData {
    let page: number = parseInt(pageQueryParam) || 1
    // get totalPages
    let totalPages: number = getTotalPages(allItems, pageSize)
    //initialize filterUrl
    let filterUrl: string = "";

    // for every param in req.query, 
    // check if key is not page or action and value exists
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
 * @returns string[] of all types
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
function filterManaType(arrToFilter: Magic.Card[], manaReqQuery: any, colorCode: string): Magic.Card[] {
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
function filterColorlessManaType(arrToFilter: Magic.Card[], manaReqQuery: any): Magic.Card[] {
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
/**
 * A function to be used in a sort function to sort cards by a specified sort parameter
 * @param a Card 1
 * @param b card 2
 * @param sortParam A string to specify on what parameters to sort the 2 cards 
 * @returns 0 if a.sortParam == b.sortParam, -1 if a.sortParam < b.sortParam and 1 if a.sortParam > b.sortParam
 */
export function sortBy(a: i.Card, b: i.Card, sortParam: string): number {
    if (typeof a[`${sortParam}`] === "string" && typeof b[`${sortParam}`] === "string") {
        return a[`${sortParam}`].localeCompare(b[`${sortParam}`])
    } else if (typeof a[`${sortParam}`] === "number" && typeof b[`${sortParam}`] === "number") {
        return b[`${sortParam}`] - a[`${sortParam}`]
    } else {
        // if other type to sort by, log it in console
        // if need be to filter on another type of sortParam, add them before this else block
        console.log(typeof a[`${sortParam}`]);
        return 0;
    }
}
/**
 * Function to get the decks u need to load the page
 * @param allItems The array of all the deck items
 * @param page The page you want to load
 * @param pageSize The amount of items you want on the page
 * @returns an array with length of pageSize
 */
export function getDecksForPage(allItems: i.Deck[], page: number, pageSize: number): i.Deck[] {
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return allItems.slice(startIndex, endIndex);
}
/**
 * A function to filter and sort an array of cards based on the filter and sort parameter
 * @param allCards The array of cards you want to filter and sort
 * @param cardLookup The string wich is used to filter cards by name, id or multiverseid
 * @param filterType The string wich is used to filter cards by type
 * @param filterRarity The string wich is used to filter cards by rarity
 * @param whiteManaChecked The bool (pertrayed as string) to filter cards with white mana
 * @param blueManaChecked The bool (pertrayed as string) to filter cards with blue mana
 * @param blackManaChecked The bool (pertrayed as string) to filter cards with black mana
 * @param greenManaChecked The bool (pertrayed as string) to filter cards with green mana
 * @param redManaChecked The bool (pertrayed as string) to filter cards with red mana
 * @param colorlessManaChecked The bool (pertrayed as string) to filter cards with colorless mana
 * @param sort The string of how to sort the array of cards
 * @param sortDirection The string ("up" or "down") to know in what direction to sort
 * @returns The sorted and filtered array
 */
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
/**
 * A function to randomly shuffle an array of cards
 * @param cards array of cards that need to be shuffled
 * @returns shuffeled array of cards
 */
export function shuffleCards(cards: Magic.Card[]): Magic.Card[] {
    // iterate thru the array starting from the back going to front
    for (let i = cards.length - 1; i > 0; i--) {
        // generate a random index j between the range 0 and i
        const j: number = getRandomNumber(0, i);
        // swap card at index i with card at index j
        const temp: Magic.Card = cards[i]; // store card in temp variable so we dont lose it
        cards[i] = cards[j]; // set i to j
        cards[j] = temp // set j to i (stored in temp)
    }
    return cards;
}
/**
 * A function to generate a randum number between min and max
 * @param min The lowest allowed value
 * @param max teh highest allowed value
 * @returns random number between min and max
 */
export function getRandomNumber(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
/**
 * A function to calculate the chance of pulling a cartain card from the array aswell as calculating how many times this card apears in the array
 * @param cards Array of cards 
 * @param card Card you want to calculate the chance of
 * @returns obj with obj.chance being the (in %) chance you have to pull card from card array and obj.amount being how many instances of this card is in the array
 */
export function getChance(cards: Magic.Card[], card: Magic.Card): { chance: number, amount: number } {
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

export function getTotalManaCost(cardsArray : i.Card[]){
    let totalManaCost: number = 0;

    cardsArray.forEach(card => {
        totalManaCost += card.cmc;
    });

    return totalManaCost;
}

export function getAvgManaCost(cardsArray : i.Card[]){
    let totalManaCost = getTotalManaCost(cardsArray);

    return Math.round((totalManaCost/ cardsArray.length) * 100 ) / 100;
}
