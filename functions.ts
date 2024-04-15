import Magic = require("mtgsdk-ts");

export function getCardsForPage(allItems: Magic.Card[], currentPage: number, pageSize: number): Magic.Card[] {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return allItems.slice(startIndex, endIndex);
}
export function getTotalPages(allItems: Magic.Card[], pageSize: number): number {
    return Math.ceil(allItems.length / pageSize);
}
export function handlePageClickEvent(): number {
    return 1;
}