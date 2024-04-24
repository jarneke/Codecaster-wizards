import { Collection, MongoClient } from "mongodb";
import * as i from "./interfaces"
import * as f from "./functions"
import Magic = require("mtgsdk-ts");
import dotenv from "dotenv"

dotenv.config();

const uri: any = process.env.MONGO_URI || "mongodb://localhost:27017"
export const client = new MongoClient(uri);

async function exit() {
    try {
        await client.close();
        console.log("Disconnected from database");
    } catch (error) {
        console.error(error);
    }
    process.exit(0);
}

export const decksCollection: Collection<i.Deck> = client.db("Codecaster").collection<i.Deck>("Decks");
function getRandomNumber(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1) + min);
}
function generateMockDecks(allCards: Magic.Card[]): i.Deck[] {
    const mockDecks: i.Deck[] = [];

    // Generate 9 mock decks
    for (let i = 1; i <= 9; i++) {
        const deckName = `Deck ${i}`;
        const deckImageUrl = `/assets/images/decks/Deck${i + 1}.jpg`;
        const cardsCount = getRandomNumber(5, 60);
        const cards: Magic.Card[] = [];

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
async function seed() {
    const allCards: Magic.Card[] = [];
    let loadedCardCount = 0;
    const desiredCardCount = 100; // Change this to the desired number of cards to load before generating mock decks

    const emitter = Magic.Cards.all({ page: 1, pageSize: desiredCardCount })
        .on("data", (card) => {
            if (card.imageUrl !== undefined) {
                allCards.push(card);
                loadedCardCount++;

                // Check if desired number of cards have been loaded
                if (loadedCardCount >= desiredCardCount) {
                    const mockDecks: i.Deck[] = generateMockDecks(allCards);
                    populateDatabase(mockDecks);
                    console.log("seeded");

                    emitter.cancel();
                }
            }
        })
        .on("error", (e) => console.log("ERROR: " + e));

    async function populateDatabase(mockDecks: i.Deck[]) {
        // decksCollection.deleteMany({});
        if (await decksCollection.countDocuments() === 0) {
            await decksCollection.insertMany(mockDecks);
            console.log("Mock decks inserted into database");
        }
    }
}


export async function connect() {
    try {
        await client.connect();
        console.log("Connected to database");
        await seed();
        process.on("SIGINT", exit);
    } catch (error) {
        console.error(error);
    }
}