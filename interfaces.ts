import Magic = require("mtgsdk-ts");
import * as f from "./functions";
import { ObjectId } from "mongodb";

// interface for user
export interface User {
  firstName: string;
  lastName: string;
  userName: string;
  email: string;
  description: string;
  password?: string;
  role: "ADMIN" | "USER";
  _id?: ObjectId;
}
// interface for pageData
export interface PageData {
  page: number;
  filterUrl: string;
}
// enum for feedbackType
export enum feedbackType {
  bug,
  suggestion,
  compliment,
  general,
}
// interface for feedback
export interface Feedback {
  feedbackType: feedbackType;
  feedback: string;
}
// interd-face for shertend cards
export interface Card {
  [key: string]: any;
  id: string;
  name: string;
  manaCost: string;
  cmc: number;
  colorIdentity: string[];
  types: string[];
  multiverseid: number;
  imageUrl: string;
}
// interface for decks
export interface Deck {
  _id?: ObjectId;
  userId: ObjectId;
  deckName: string;
  cards: Card[];
  deckImageUrl: string;
  favorited: boolean;
}
// interface for tips
export interface Tip {
  _id?: ObjectId;
  tip: string;
}
// interface for Mongodb filter
export interface Filter {
  cardLookup?: any;
  filterType?: any;
  filterRarity?: any;
  whiteManaChecked?: any;
  blueManaChecked?: any;
  blackManaChecked?: any;
  greenManaChecked?: any;
  redManaChecked?: any;
  colorlessManaChecked?: any;
  sort?: any;
  sortDirection?: any;
}
// all types
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
  "instant",
];
// all rarities
export const filterRarities: string[] = [
  "Common",
  "Uncommon",
  "Rare",
  "Mythic",
  "Special",
];
