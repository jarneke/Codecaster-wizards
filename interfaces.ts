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
export const tempUser: User = {
    firstName: "John",
    lastName: "",
    userName: "",
    email: "",
    description: "",
    Password: ""
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
export interface Card extends Magic.Card {
    [key: string]: any,
}
// interface for decks
export interface Deck {
    deckName: string,
    cards: Magic.Card[],
    deckImageUrl: string
}
// interface for tips
export interface Tip {
    _id?: ObjectId,
    tip: string
}