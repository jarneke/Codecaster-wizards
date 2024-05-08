import { Db, Collection, MongoClient } from "mongodb";
import * as i from "./interfaces";
import * as f from "./functions";
import Magic = require("mtgsdk-ts");
import dotenv from "dotenv";
import bcrypt from "bcrypt";

dotenv.config();

const saltRounds: number = 2;

// all devTips
const mtgTips: i.Tip[] = [
  {
    tip: "Let op je mana curve - zorg voor een goede verdeling van goedkope, mid-range en dure spreuken.",
  },
  {
    tip: "Vergeet je landdrops niet - het spelen van een land per beurt is cruciaal om aan je manavereisten te voldoen.",
  },
  {
    tip: "Ken de stack - begrijp hoe de stack werkt en de implicaties van het spelen van spreuken en vaardigheden op verschillende momenten.",
  },
  {
    tip: "Lees de kaarten zorgvuldig door - soms kan de bewoording een groot verschil maken in hoe een kaart functioneert.",
  },
  {
    tip: "Houd de levens totalen bij - zowel die van jou als van je tegenstander. Het is gemakkelijk te vergeten, maar het kan cruciaal zijn voor het plannen van je strategie.",
  },
  {
    tip: "Plan je beurten vooruit - denk na over je plays tijdens de beurt van je tegenstander om de efficiëntie te maximaliseren.",
  },
  {
    tip: "Breid niet te ver uit - wees voorzichtig met het inzetten van te veel middelen op het bord in één keer, want dit kan je kwetsbaar maken voor board wipes.",
  },
  {
    tip: "Weet wanneer je moet aanvallen en wanneer je je moet terugtrekken - soms is het beter om te wachten op een betere gelegenheid om aan te vallen dan je te haasten.",
  },
  {
    tip: "Sideboard effectief - heb een plan om met veelvoorkomende matchups om te gaan en pas je deck dienovereenkomstig aan tussen games.",
  },
  {
    tip: "Oefening, oefening, oefening - hoe meer je speelt, hoe beter je de complexiteit van het spel leert begrijpen en je vaardigheden verbetert.",
  },
  {
    tip: "Raak niet ontmoedigd door nederlagen - leren van je fouten is een belangrijk onderdeel om een betere speler te worden.",
  },
  {
    tip: "Veel plezier! - Magic is een spel, dus zorg ervoor dat je je amuseert en de ervaring waardeert, winnen of verliezen.",
  },
];

const allUsers: i.User[] = [
  {
    firstName: "John",
    lastName: "Doe",
    userName: "John_Doe",
    email: "John.Doe@mail.com",
    description:
      "John Doe is a dynamic individual with a diverse skill set and a passion for excellence. With a background in [industry/field], he brings a unique blend of [skills/traits] to every project he undertakes. Whether he's [activity/task], [activity/task], or [activity/task], John approaches each endeavor with dedication and creativity. His ability to [skill/quality] and [skill/quality] make him a valuable asset to any team. Outside of work, John enjoys [hobbies/interests], [hobbies/interests], and [hobbies/interests]. With a commitment to continuous growth and a drive to succeed, John is poised to make a significant impact in [industry/field].",
    password: "Passw0rd123",
    role: "ADMIN",
  },
  {
    firstName: "Jane",
    lastName: "Smith",
    userName: "Smiley_Jane",
    email: "Jane.Smith@mail.com",
    description:
      "Jane Smith is a highly motivated individual with a strong work ethic and a passion for [industry/field]. With a background in [industry/field], she brings extensive experience and a proven track record of success to every project she undertakes. Whether she's [activity/task], [activity/task], or [activity/task], Jane consistently delivers high-quality results with precision and efficiency. Her exceptional [skills/traits] and [skills/traits] make her a valuable asset to any team. Outside of work, Jane enjoys [hobbies/interests], [hobbies/interests], and [hobbies/interests]. With a dedication to continuous improvement and a focus on achieving her goals, Jane is well-positioned to excel in [industry/field].",
    password: "Jane1234",
    role: "USER",
  },
  {
    firstName: "Michael",
    lastName: "Johnson",
    userName: "Mighty_Mike",
    email: "Michael.Johnson@mail.com",
    description:
      "Michael Johnson is a results-oriented professional with a proven track record of success in [industry/field]. With a background in [industry/field], he brings a wealth of knowledge and expertise to every project he undertakes. Whether he's [activity/task], [activity/task], or [activity/task], Michael consistently exceeds expectations and delivers exceptional results. His strong [skills/traits] and [skills/traits] enable him to thrive in fast-paced environments and tackle challenges with confidence. Outside of work, Michael enjoys [hobbies/interests], [hobbies/interests], and [hobbies/interests]. With a commitment to excellence and a drive to succeed, Michael is well-equipped to make a significant impact in [industry/field].",
    password: "Michael!23",
    role: "USER",
  },
];

// initialize allCards
let allCards: i.Card[] = [];
// get uri from enviroment variables
const uri: any = process.env.MONGO_URI || "mongodb://localhost:27017";
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
    await createInitialUser();
    await seed();
    // if application is exited, close connection
    process.on("SIGINT", exit); // For manually stopping the server
    process.on("SIGUSR2", exit); // For nodemon restarting on save
  } catch (error) {
    // else log error
    console.error(error);
  }
}
/**
 * A function to seed the database if needed
 */
async function seed(reseed?: boolean) {
  if (reseed) {
    await cardsCollection.deleteMany({});
  }
  // if there are no cards in database pull them from API, else pull them from database
  if (!await cardsCollection.findOne({})) {
    console.log("[ - SERVER - ]=> Fetching all cards from API");
    // initialize emitter to get cards
    Magic.Cards.all({})
      // on card recieved
      .on("data", async (card) => {
        // check if the card has a imageUrl
        if (card.imageUrl !== undefined) {

          const isNotInArray: boolean = !allCards.some((e) => e.name == card.name)
          console.clear();
          // log if card is already in allCard or not and show the amount of cards
          console.log("Adding card..\t" + isNotInArray + `\t=>\tCount: ${allCards.length}`);
          // if card doesnt have a duplicate in allCards array
          if (isNotInArray) {
            const temp: i.Card = {
              id: card.id,
              name: card.name,
              manaCost: card.manaCost,
              cmc: card.cmc,
              colorIdentity: card.colorIdentity,
              multiverseid: card.multiverseid,
              types: card.types,
              imageUrl: card.imageUrl,
              rarity: card.rarity
            }
            // push card to allCards array
            allCards.push(temp);
          }
        }
      })
      .on("end", async () => {
        await cardsCollection.insertMany(allCards)
        console.log("All cards added to database");

      })
      // if error occurs with loading cards, log it
      .on("error", (e) => console.error("[ - ERROR - ]=> " + e));
  }

  // populate the database if need be with mockDecks
  await populateDecks();
  // populate the database if need be with tips
  await populateTips(mtgTips);
  // log that the db is seeded
  console.log("[ - SERVER - ]=> Done seeding the database");
}

/**
 * a function to insert mock decks into database if needed
 * @param mockDecks array of mockDecks
 */
async function populateDecks() {
  // uncomment line beneath if you want to refresh decks in database
  // decksCollection.deleteMany({});

  // if decksCollection is empty insert and log that its added
  if ((await decksCollection.countDocuments()) === 0) {
    if (allCards.length === 0) {
      allCards = await cardsCollection.find({}).toArray();
    }
    const mockDecks: i.Deck[] = f.generateMockDecks(allCards);
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
  if ((await tipsCollection.countDocuments()) === 0) {
    await tipsCollection.insertMany(allTips);
  }
}

async function createInitialUser() {
  await usersCollection.deleteMany({});
  if ((await usersCollection.countDocuments()) > 0) {
    return;
  }
  let email: string | undefined = process.env.ADMIN_EMAIL;
  let password: string | undefined = process.env.ADMIN_PASSWORD;
  if (email === undefined || password === undefined) {
    throw new Error(
      "ADMIN_EMAIL and ADMIN_PASSWORD must be set in environment"
    );
  }
  await usersCollection.insertOne({
    firstName: "admin",
    lastName: "admin",
    userName: "admin",
    email: email,
    description: "admin account",
    role: "ADMIN",
    password: await bcrypt.hash(password, saltRounds),
  });
}

export async function login(email: string, password: string) {
  if (email === "" || password === "") {
    console.log(email + password);

    //throw new Error("Email and password required");
  }
  let user: i.User | null = await usersCollection.findOne<i.User>({
    email: email,
  });
  if (user) {
    if (await bcrypt.compare(password, user.password!)) {
      return user;
    } else {
      console.log("passwors incorrect");

      //throw new Error("Password incorrect");
    }
  } else {
    console.log("User not found");

    //throw new Error("User not found");
  }
}
// initialize usersCollection and export it to be used outside of db setup
export const usersCollection: Collection<i.User> =
  db.collection<i.User>("Users");

// initialize decksCollection and export it to be used outside of db setup
export const decksCollection: Collection<i.Deck> =
  db.collection<i.Deck>("Decks");
// initialize feedbacksCollection and export it to be used outside of db setup
export const feedbacksCollection: Collection<i.Feedback> =
  db.collection<i.Feedback>("Feedbacks");
// initialize tipsCollection and export it to be used outside of db setup
export const tipsCollection: Collection<i.Tip> = db.collection<i.Tip>("Tips");
// initialize cardsCollection and export it to be used outside of db setup
export const cardsCollection: Collection<i.Card> = db.collection<i.Card>("Cards");
