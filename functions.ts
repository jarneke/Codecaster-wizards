import Magic = require("mtgsdk-ts");
import * as i from "./interfaces";
import bcrypt from "bcrypt";

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
        if (key !== "page" && value) {
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
            const type = cardTypes.join(" ");
            if (!types.includes(type)) {
                types.push(type);
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
    let rarities: string[] = []
    for (const card of allCards) {
        let rarity: string = card.rarity
        if (!rarities.includes(rarity)) {
            rarities.push(rarity);
        }
    }
    return rarities;
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
            arrToFilter = arrToFilter.filter(e => e && e.manaCost && !e.manaCost.includes(colorCode))
        }
    }
    return arrToFilter;
}