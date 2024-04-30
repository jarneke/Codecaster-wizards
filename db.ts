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
export const feedbacksCollection: Collection<i.Feedback> = client.db("Codecaster").collection<i.Feedback>("Feedbacks");

export const tipsCollection: Collection<i.Tips> = client.db("Codecaster").collection<i.Tips>("Tips");

function getRandomNumber(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1) + min);
}
function generateMockDecks(allCards: Magic.Card[]): i.Deck[] {
    const mockDecks: i.Deck[] = [];

    // Generate 9 mock decks
    for (let i = 1; i <= 9; i++) {
        const deckName = `Deck ${i}`;
        const deckImageUrl = `/assets/images/decks/Deck${i}.jpg`;
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
                    populateTips();
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


const mtgTips: i.Tips[] = [
    { tip: "Let op je mana curve - zorg voor een goede verdeling van goedkope, mid-range en dure spreuken." },
    { tip: "Vergeet je landdrops niet - het spelen van een land per beurt is cruciaal om aan je manavereisten te voldoen." },
    { tip: "Ken de stack - begrijp hoe de stack werkt en de implicaties van het spelen van spreuken en vaardigheden op verschillende momenten." },
    { tip: "Lees de kaarten zorgvuldig door - soms kan de bewoording een groot verschil maken in hoe een kaart functioneert." },
    { tip: "Houd de levens totalen bij - zowel die van jou als van je tegenstander. Het is gemakkelijk te vergeten, maar het kan cruciaal zijn voor het plannen van je strategie." },
    { tip: "Plan je beurten vooruit - denk na over je plays tijdens de beurt van je tegenstander om de efficiëntie te maximaliseren." },
    { tip: "Breid niet te ver uit - wees voorzichtig met het inzetten van te veel middelen op het bord in één keer, want dit kan je kwetsbaar maken voor board wipes." },
    { tip: "Weet wanneer je moet aanvallen en wanneer je je moet terugtrekken - soms is het beter om te wachten op een betere gelegenheid om aan te vallen dan je te haasten." },
    { tip: "Sideboard effectief - heb een plan om met veelvoorkomende matchups om te gaan en pas je deck dienovereenkomstig aan tussen games." },
    { tip: "Oefening, oefening, oefening - hoe meer je speelt, hoe beter je de complexiteit van het spel leert begrijpen en je vaardigheden verbetert." },
    { tip: "Raak niet ontmoedigd door nederlagen - leren van je fouten is een belangrijk onderdeel om een betere speler te worden." },
    { tip: "Veel plezier! - Magic is een spel, dus zorg ervoor dat je je amuseert en de ervaring waardeert, winnen of verliezen." },
];


export async function populateTips() {
    try {
        client.connect();

        // Collectie leegmaken
        // const emptyTips = await client.db("Codecaster").collection("Tips").deleteMany({});

        // Array van tips toevoegen aan dbm
        await tipsCollection.deleteMany({});
        await tipsCollection.insertMany(mtgTips);

        // Tips uitlezen
        // const tips = await client.db("Codecaster").collection("Tips").find({}).toArray();


    } catch (e) {
        console.error(e);
    }
}