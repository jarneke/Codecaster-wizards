import Magic = require("mtgsdk-ts");
import * as f from "./functions"
import { ObjectId } from "mongodb";

export interface User {
    firstName: string,
    lastName: string
    userName: string,
    email: string,
    description: string,
    password: string,
    _id?: ObjectId
}
export interface PageData {
    page: number,
    totalPages: number,
    filterUrl: string
}
export interface Card extends Magic.Card {
    [key: string]: any,
}

export interface Deck {
    deckName: string,
    cards: Magic.Card[],
    deckImageUrl: string
}
export interface DeckCard {
    card: Magic.Card,
    amount: number,
}

export interface Tips {
    _id?: ObjectId,
    tip: string
}