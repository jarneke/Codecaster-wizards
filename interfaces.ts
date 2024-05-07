import Magic = require("mtgsdk-ts");
import * as f from "./functions"
import { ObjectId } from "mongodb";

// interface for user
export interface User {
    firstName: string,
    lastName: string
    userName: string,
    email: string,
    description: string,
    Password: string,
}
// used for testing while log in and user registration is not done yet
export const tempUser: User = {
    firstName: "John",
    lastName: "Doe",
    userName: "John_Doe",
    email: "John.Doe@example.com",
    description: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Consectetur aliquid excepturi ducimus provident temporibus vero error sed distinctio, ab ut.",
    Password: "Password123"
}
// interface for pageData
export interface PageData {
    page: number,
    totalPages: number,
    filterUrl: string
}
// enum for feedbackType
export enum feedbackType {
    bug,
    suggestion,
    compliment,
    general
}
// interface for feedback
export interface Feedback {
    feedbackType: feedbackType,
    feedback: string,
}
// extention of Magic.Card interface, to allow dinamic calling of object params
export interface Card {
    [key: string]: any,
    id: string,
    name: string,
    manaCost: string,
    cmc: number,
    colorIdentity: string[]
    types: string[],
    multiverseid: number,
    imageUrl: string;
}
// interface for decks
export interface Deck {
    deckName: string,
    cards: Card[],
    deckImageUrl: string
}
// interface for tips
export interface Tip {
    _id?: ObjectId,
    tip: string
}
export interface Filter {
    cardLookup?: any,
    filterType?: any,
    filterRarity?: any,
    whiteManaChecked?: any,
    blueManaChecked?: any,
    blackManaChecked?: any,
    greenManaChecked?: any,
    redManaChecked?: any,
    colorlessManaChecked?: any,
    sort?: any,
    sortDirection?: any
}
export const filterTypes: string[] = [
    "Creature",
    "Sorcery",
    "Enchantment",
    "Instant",
    "Artifact",
    "Land",
    "Tribal",
    "Planeswalker",
    "Vanguard",
    "Summon",
    "Wolf",
    "Elemental",
    "Conspiracy",
    "Plane",
    "Phenomenon",
    "Battle",
    "Scheme",
    "Stickers",
    "Eaturecray",
    "instant"
];
export const filterRarities: string[] = [
    "Common",
    "Uncommon",
    "Rare",
    "Mythic",
    "Special"
]