import Magic = require("mtgsdk-ts");
import * as i from "./interfaces";
import { Filter, Sort, Condition } from "mongodb";
import * as db from "./db"

/**
 * A function to get the cards to load on a page specified by diffrent filter and sort params
 * @param filterParam The parameters to filter and sort on
 * @param page Page you wqnt to load
 * @param pageSize Pagesize of the page you want to load
 * @returns array of cards
 */
export async function getCardsForPage(filterParam: i.Filter, page: number, pageSize: number): Promise<{ cards: i.Card[], totalPages: number }> {

    let query: Filter<i.Card> = {};

    // Text search or Id match
    if (filterParam.cardLookup && filterParam.cardLookup != "") {
        const numberLookup = parseInt(filterParam.cardLookup, 10);
        const isNumber = !isNaN(numberLookup)
        query.$or = [
            { name: { $regex: new RegExp(filterParam.cardLookup, "i") } },
            { id: { $regex: new RegExp(filterParam.cardLookup, "i") } },
        ];
        if (isNumber) {
            query.$or.push({ multiverseid: numberLookup })
        }
    }
    // Type filter
    if (filterParam.filterType && filterParam.filterType != "") {
        query.types = { $in: [filterParam.filterType] }
    }
    // Rarity filter
    if (filterParam.filterRarity && filterParam.filterRarity != "") {
        query.rarity = { $regex: filterParam.filterRarity }
    }
    // Color filter

    let includeManaConditions: string[] = [];
    let excludeManaConditions: string[] = ['W', 'U', 'B', 'G', 'R', '\\d+', 'X']; // Start with all possibilities for exclusion

    if (filterParam.whiteManaChecked === 'false') includeManaConditions.push('W');
    else excludeManaConditions.splice(excludeManaConditions.indexOf('W'), 1);

    if (filterParam.blueManaChecked === 'false') includeManaConditions.push('U');
    else excludeManaConditions.splice(excludeManaConditions.indexOf('U'), 1);

    if (filterParam.blackManaChecked === 'false') includeManaConditions.push('B');
    else excludeManaConditions.splice(excludeManaConditions.indexOf('B'), 1);

    if (filterParam.greenManaChecked === 'false') includeManaConditions.push('G');
    else excludeManaConditions.splice(excludeManaConditions.indexOf('G'), 1);

    if (filterParam.redManaChecked === 'false') includeManaConditions.push('R');
    else excludeManaConditions.splice(excludeManaConditions.indexOf('R'), 1);

    if (filterParam.colorlessManaChecked === 'false') includeManaConditions.push('\\d+', 'X');
    else {
        excludeManaConditions.splice(excludeManaConditions.indexOf('\\d+'), 1);
        excludeManaConditions.splice(excludeManaConditions.indexOf('X'), 1);
    }

    if (includeManaConditions.length > 0) {
        query.manaCost = {
            $regex: new RegExp(`^(${includeManaConditions.map(c => `\\{${c}\\}`).join('|')})+$`, 'i')
        };
    }

    if (excludeManaConditions.length > 0) {
        query.manaCost = {
            $not: new RegExp(`\\{(${excludeManaConditions.join('|')})\\}`, 'i')
        };
    }

    // sorting
    let sortOptions: Sort = {}
    if (filterParam.sort && filterParam.sortDirection && filterParam.sort != "" && filterParam.sortDirection != "") {
        sortOptions[filterParam.sort] = filterParam.sortDirection === "down" ? 1 : -1;
    }

    const skipDocuments: number = (page - 1) * pageSize
    const cards: i.Card[] = await db.cardsCollection.find(query).sort(sortOptions).skip(skipDocuments).limit(pageSize).toArray()
    const totalPages = getTotalPages(await db.cardsCollection.countDocuments(query), pageSize)
    return {
        cards: cards,
        totalPages: totalPages
    }
}
export function getCardsForPageFromArray(arr: i.Card[], page: number, pagesize: number): i.Card[] {
    const startIndex = (page - 1) * pagesize;
    const endIndex = startIndex + pagesize;
    return arr.slice(startIndex, endIndex);

}
export function getCardWAmauntForPage(allItems: Map<i.Card, number>, page: number, pageSize: number): Map<i.Card, number> {
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const slicedItems = new Map<i.Card, number>();

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
export function getTotalPages(allItemsLength: number, pageSize: number): number {
    return Math.ceil(allItemsLength / pageSize);
}
/**
 * A function that handles switching page and adding the filter elements to the url so filtering and sorting doesnt go away after page sap
 * @param reqQuery The req.query of the route
 * @returns PageData, the page and filterUrl to load
 */
export function handlePageClickEvent(reqQuery: any): i.PageData {
    let page: number = parseInt(reqQuery.page) || 1
    //initialize filterUrl
    let filterUrl: string = "";
    // for every param in req.query, 
    // check if key is not page or action and value exists
    // if true => add to filterUrl
    // if false => skip
    for (const [key, value] of Object.entries(reqQuery)) {
        if (key != "page" && value && key != "action") {
            filterUrl += `${key}=${value}&`;
        }
    }
    // Remove trailing '&' if present
    filterUrl = filterUrl.replace(/&$/, '');

    // return data in pageData Obj
    return {
        page: page,
        filterUrl: filterUrl
    };
}
/**
 * A function to filter cards by a specified mana color
 * @param arrToFilter The array to filter
 * @param manaReqQuery the req.query.<mana>ManaColor
 * @param colorCode The color code corresponding to the mana color (W, U, B, G, R, C)
 * @returns filtered array
 */
function filterManaType(arrToFilter: i.Card[], manaReqQuery: any, colorCode: string): i.Card[] {
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
function filterColorlessManaType(arrToFilter: i.Card[], manaReqQuery: any): i.Card[] {
    if (manaReqQuery != undefined && manaReqQuery != "") {
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
export function filterAndSortCards(allCards: i.Card[], cardLookup: any, filterType: any, filterRarity: any, whiteManaChecked: any, blueManaChecked: any, blackManaChecked: any, greenManaChecked: any, redManaChecked: any, colorlessManaChecked: any, sort: any, sortDirection: any): i.Card[] {
    let filteredCards: i.Card[] = [...allCards];
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
    let sortedCards: i.Card[] = [...filteredCards]
    if (sort != undefined && sort != "" && sortDirection != undefined && sortDirection != "") {
        if (`${sortDirection}` === "down") {
            sortedCards = [...sortedCards.sort((a: i.Card, b: i.Card) => sortBy(a, b, `${sort}`))]
        } else {
            sortedCards = [...sortedCards.sort((a: i.Card, b: i.Card) => sortBy(a, b, `${sort}`) * -1)]
        }
    }

    return sortedCards
}
/**
 * A function to randomly shuffle an array of cards
 * @param cards array of cards that need to be shuffled
 * @returns shuffeled array of cards
 */
export function shuffleCards(cards: i.Card[]): i.Card[] {
    // iterate thru the array starting from the back going to front
    for (let i = cards.length - 1; i > 0; i--) {
        // generate a random index j between the range 0 and i
        const j: number = getRandomNumber(0, i);
        // swap card at index i with card at index j
        const temp: i.Card = cards[i]; // store card in temp variable so we dont lose it
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
export function getChance(cards: i.Card[], card: i.Card): { chance: number, amount: number } {
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
/**
 * 
 * @param cardsArray 
 * @returns 
 */
export function getTotalManaCost(cardsArray: i.Card[]) {
    let totalManaCost: number = 0;

    cardsArray.forEach(card => {
        totalManaCost += card.cmc;
    });

    return totalManaCost;
}
/**
 * 
 * @param cardsArray 
 * @returns 
 */
export function getAvgManaCost(cardsArray: i.Card[]) {
    // initialize counter
    let counter: number = 0;
    // initialiize totalManaCost
    let totalManaCost: number = 0;
    // count all cards excluding land cards
    for (const card of cardsArray) {
        if (!card.types.find(e=> e == "Land")) {
            counter ++;
            totalManaCost += card.cmc;
        }
    }

    return Math.round((totalManaCost / counter) * 100) / 100;
}
/**
 * 
 * @param allCards 
 * @returns 
 */
export function generateMockDecks(allCards: i.Card[]): i.Deck[] {
    const mockDecks: i.Deck[] = [];

    // Generate 9 mock decks
    for (let i = 1; i <= 9; i++) {
        const deckName = `Deck ${i}`;
        const deckImageUrl = `/assets/images/decks/Deck${i}.jpg`;
        const cardsCount = getRandomNumber(60, 60);
        const cards: i.Card[] = [];

        // Add random cards to the deck
        for (let j = 0; j < cardsCount; j++) {
            const randomIndex = getRandomNumber(0, allCards.length - 1);
            cards.push(allCards[randomIndex]);
        }

        // Create the deck object
        const deck: i.Deck = {
            deckName,
            cards,
            deckImageUrl
        };

        // Push the deck to the array of mock decks
        mockDecks.push(deck);
    }

    return mockDecks;
}
export function updateLoadingBar(progress: number): string {
    const barLength = 100;
    const filledLength = Math.round(progress * barLength);
    const emptyLength = barLength - filledLength;
    return "[" + "=".repeat(filledLength) + " ".repeat(emptyLength) + "]";

}

export function deleteCard() {

}