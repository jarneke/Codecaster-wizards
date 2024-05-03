import { Db, Collection, MongoClient } from "mongodb";
import * as i from "./interfaces"
import * as f from "./functions"
import Magic = require("mtgsdk-ts");
import dotenv from "dotenv"

dotenv.config();

// all devTips
const mtgTips: i.Tip[] = [
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

// get uri from enviroment variables
const uri: any = process.env.MONGO_URI || "mongodb://localhost:27017"
// initialize Mongoclient
export const client = new MongoClient(uri);
// initialize database
const db: Db = client.db("Codecaster");
// exit function
async function exit() {
    try {
        // try to close connection
        await client.close();
        console.log("[ - SERVER - ]=> Disconnected from database");
    } catch (error) {
        // if errors, log it
        console.error(error);
    }
    process.exit(0);
}
/**
 * A function to connect to the database
 */
export async function connect() {
    // try to connect
    try {
        await client.connect();
        console.log("[ - SERVER - ]=> Connected to database");
        await seed();
        // if application is exited, close connection
        process.on("SIGINT", exit); // For manually stopping the server
        process.on("SIGUSR2", exit); // For nodemon restarting on save
    }
    // else log error 
    catch (error) {
        console.error(error);
    }
}
/**
 * A function to seed the database if needed
 */
async function seed() {
    // initialize allCards
    let allCards: Magic.Card[] = [];
    // rough estimate of total cards to make loadingbar
    const allCardsCount: number = 26023;
    // if there are no cards in database pull them from API, else pull them from database
    if (!await cardsCollection.findOne({})) {
        console.log("[ - SERVER - ]=> Fetching all cards from API");
        // initialize emitter to get cards
        Magic.Cards.all({})
            // on card recieved
            .on("data", async (card) => {
                // check if the card has a imageUrl
                if (card.imageUrl !== undefined) {
                    // display loading screen
                    console.clear();
                    // generate loadingbar and display it
                    console.log(f.updateLoadingBar(allCards.length / allCardsCount));
                    console.log();
                    const isInArray: boolean = !allCards.some((e) => e.name == card.name)
                    // log if card is already in allCard or not and show the amount of cards
                    console.log("Adding card..\t" + isInArray + `\t=>\tCount: ${allCards.length}`);
                    // if card doesnt have a duplicate in allCards array
                    if (isInArray) {
                        // push card to allCards array
                        allCards.push(card);
                    }
                }
            })
            .on("end", async () => {
                await cardsCollection.insertMany(allCards)
                // generate mockDecks
                const mockDecks: i.Deck[] = f.generateMockDecks(allCards);
                // populate the database if need be with mockDecks
                await populateDatabase(mockDecks);
                // populate the database if need be with tips
                await populateTips(mtgTips);
                // log that the db is seeded
                console.log("[ - SERVER - ]=> Done seeding the database");
            })
            // if error occurs with loading cards, log it
            .on("error", (e) => console.error("ERROR: " + e));
    } else {
        console.log("[ - SERVER - ]=> Fetching all cards from database");
        allCards = await cardsCollection.find({}).toArray();
    }
}
/**
 * a function to insert mock decks into database if needed
 * @param mockDecks array of mockDecks
 */
async function populateDatabase(mockDecks: i.Deck[]) {
    // uncomment line beneath if you want to refresh decks in database
    // decksCollection.deleteMany({});

    // if decksCollection is empty insert and log that its added
    if (await decksCollection.countDocuments() === 0) {
        await decksCollection.insertMany(mockDecks);
        console.log("[ - SERVER - ]=> Mock decks inserted into database");
    }
}

/**
 * A function to populate the database with tips if need be
 */
export async function populateTips(allTips: i.Tip[]) {
    // uncomment line beneath if you want to refresh tips in database
    //await tipsCollection.deleteMany({});

    // if decksCollection is empty insert and log that its added
    if (await tipsCollection.countDocuments() === 0) {
        await tipsCollection.insertMany(allTips);
    }
}

// initialize decksCollection and export it to be used outside of db setup
export const decksCollection: Collection<i.Deck> = db.collection<i.Deck>("Decks");
// initialize feedbacksCollection and export it to be used outside of db setup
export const feedbacksCollection: Collection<i.Feedback> = db.collection<i.Feedback>("Feedbacks");
// initialize tipsCollection and export it to be used outside of db setup
export const tipsCollection: Collection<i.Tip> = db.collection<i.Tip>("Tips");
// initialize cardsCollection and export it to be used outside of db setup
export const cardsCollection: Collection<Magic.Card> = db.collection<Magic.Card>("Cards");
