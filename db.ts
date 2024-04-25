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
export const usersCollection: Collection<i.User> = client.db("Codecaster").collection<i.User>("Users");

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
    const allUsers: i.User[] = [
        {
            firstName: "John",
            lastName: "Doe",
            userName: "John_Doe",
            email: "John.Doe@mail.com",
            description: "John Doe is a dynamic individual with a diverse skill set and a passion for excellence. With a background in [industry/field], he brings a unique blend of [skills/traits] to every project he undertakes. Whether he's [activity/task], [activity/task], or [activity/task], John approaches each endeavor with dedication and creativity. His ability to [skill/quality] and [skill/quality] make him a valuable asset to any team. Outside of work, John enjoys [hobbies/interests], [hobbies/interests], and [hobbies/interests]. With a commitment to continuous growth and a drive to succeed, John is poised to make a significant impact in [industry/field].",
            password: "Passw0rd123"
          },
          {
            firstName: "Jane",
            lastName: "Smith",
            userName: "Smiley_Jane",
            email: "Jane.Smith@mail.com",
            description: "Jane Smith is a highly motivated individual with a strong work ethic and a passion for [industry/field]. With a background in [industry/field], she brings extensive experience and a proven track record of success to every project she undertakes. Whether she's [activity/task], [activity/task], or [activity/task], Jane consistently delivers high-quality results with precision and efficiency. Her exceptional [skills/traits] and [skills/traits] make her a valuable asset to any team. Outside of work, Jane enjoys [hobbies/interests], [hobbies/interests], and [hobbies/interests]. With a dedication to continuous improvement and a focus on achieving her goals, Jane is well-positioned to excel in [industry/field].",
            password: "Jane1234"
          },
          {
            firstName: "Michael",
            lastName: "Johnson",
            userName: "Mighty_Mike",
            email: "Michael.Johnson@mail.com",
            description: "Michael Johnson is a results-oriented professional with a proven track record of success in [industry/field]. With a background in [industry/field], he brings a wealth of knowledge and expertise to every project he undertakes. Whether he's [activity/task], [activity/task], or [activity/task], Michael consistently exceeds expectations and delivers exceptional results. His strong [skills/traits] and [skills/traits] enable him to thrive in fast-paced environments and tackle challenges with confidence. Outside of work, Michael enjoys [hobbies/interests], [hobbies/interests], and [hobbies/interests]. With a commitment to excellence and a drive to succeed, Michael is well-equipped to make a significant impact in [industry/field].",
            password: "Michael!23"
          }
    ];
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
        if (await usersCollection.countDocuments() === 0) {
            await usersCollection.insertMany(allUsers);
            console.log("Mock users inserted into database");
        }
        
        // decksCollection.deleteMany({})
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


const mtgTips : i.Tips[] = [
    {tip: "Pay attention to your mana curve - make sure you have a good distribution of low-cost, mid-cost, and high-cost spells."},
    {tip: "Don't forget your land drops - playing a land each turn is crucial for hitting your mana requirements."},
    {tip: "Know the stack - understand how the stack works and the implications of playing spells and abilities at different times."},
    {tip: "Read the cards carefully - sometimes the wording can make a big difference in how a card functions."},
    {tip: "Keep track of life totals - both yours and your opponent's. It's easy to forget, but it can be crucial for planning your strategy."},
    {tip: "Plan your turns ahead - think about your plays during your opponent's turn to maximize efficiency."},
    {tip: "Don't overextend - be cautious about committing too many resources to the board at once, as it can leave you vulnerable to board wipes."},
    {tip: "Know when to attack and when to hold back - sometimes it's better to wait for a better opportunity to attack rather than rushing in."},
    {tip: "Sideboard effectively - have a plan for dealing with common matchups and adjust your deck accordingly between games."},
    {tip: "Practice, practice, practice - the more you play, the better you'll become at understanding the game's intricacies and improving your skills."},
    {tip: "Don't get discouraged by losses - learning from your mistakes is an important part of becoming a better player."},
    {tip: "Have fun! - Magic is a game, so make sure to enjoy yourself and appreciate the experience, win or lose."}
];

export async function populateTips(){
    try {
        client.connect();

        // Collectie leegmaken
        const emptyTips = await client.db("Codecaster").collection("Tips").deleteMany({});

        // Array van tips toevoegen aan dbm
        await client.db("Codecaster").collection("Tips").insertMany(mtgTips);


    } catch (e) {
        console.error(e);
    } finally {
        client.close();
    }
}