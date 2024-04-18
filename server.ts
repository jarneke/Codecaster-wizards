import express from "express";
import ejs from "ejs";
import * as i from "./interfaces";
import Magic = require("mtgsdk-ts");
import * as f from "./functions";
import { Rarity } from "mtgsdk-ts/out/IMagic";

function generateRandomInteger(): number {
  return Math.floor(Math.random() * 61); // Generates a random number between 0 and 60 (inclusive)
}

let allCards: Magic.Card[] = [];

const tempDecks: i.Deck[] = [];
setTimeout(() => {
    for (let i = 0; i < 9; i++) {
        let tempCards: Magic.Card[] = [];
        let max = generateRandomInteger();
        for (let index = 0; index < max; index++) {
          tempCards.push(allCards[index]);
        }
        tempDecks.push({
          deckName: `Deck ${i + 1}`,
          cards: tempCards,
          deckImageUrl: `/assets/images/decks/Deck${i + 1}.jpg`,
        });
      }
}, 1000);


const app = express();

async function getDecks(){
    
}

let allDecks: i.Deck[] = tempDecks;

app.set("port", 3000);
app.set("view engine", "ejs");

app.use(express.static("public"));

app.get("/", (req, res) => {
  res.render("landingspage");
});

app.get("/home", async (req, res) => {
  // params from route
  let cardLookup = req.query.cardLookup;
  let filterType = req.query.filterType;
  let filterRarity = req.query.filterRarity;
  let whiteManaChecked = req.query.whiteManaChecked;
  let blueManaChecked = req.query.blueManaChecked;
  let blackManaChecked = req.query.blackManaChecked;
  let greenManaChecked = req.query.greenManaChecked;
  let redManaChecked = req.query.redManaChecked;
  let colorlessManaChecked = req.query.colorlessManaChecked;
  let sort = req.query.sort;
  let sortDirection = req.query.sortDirection;
  let pageQueryParam = req.query.page;

  // filter logic
  // -- initialize filtered cards
  let filteredCards: Magic.Card[] = [...allCards];
  // check if there was a search param specified
  if (cardLookup != undefined && cardLookup != "") {
    // filter the cards
    filteredCards = filteredCards.filter((e) =>
      `${e.name}${e.id}`.toLowerCase().includes(`${cardLookup}`.toLowerCase())
    );
  }
  // check if type param was specified
  if (filterType != undefined && filterType != "") {
    // filter the cards
    filteredCards = filteredCards.filter((e) =>
      e.types.includes(`${filterType}`)
    );
  }
  // check if rarity param was specified
  if (filterRarity != undefined && filterRarity != "") {
    filteredCards = filteredCards.filter((e) =>
      e.rarity.includes(`${filterRarity}`)
    );
  }
  // check if checkboxes are checked
  // filter White mana
  filteredCards = f.filterManaType(filteredCards, whiteManaChecked, "W");
  filteredCards = f.filterManaType(filteredCards, blueManaChecked, "U");
  filteredCards = f.filterManaType(filteredCards, blackManaChecked, "B");
  filteredCards = f.filterManaType(filteredCards, greenManaChecked, "G");
  filteredCards = f.filterManaType(filteredCards, redManaChecked, "R");
  filteredCards = f.filterManaType(filteredCards, colorlessManaChecked, "C");
  // sort logic
  let sortedCards: Magic.Card[] = [...filteredCards];
  if (sort != undefined) {
    // TODO: make sort logic
  }
  // Pagination
  let pageSize: number = 12;
  let pageData: i.PageData = f.handlePageClickEvent(
    req.query,
    `${pageQueryParam}`,
    pageSize,
    filteredCards
  );

  let cardsToLoad = f.getCardsForPage(filteredCards, pageData.page, pageSize);
  // all Card Types
  let types: string[] = f.getAllCardTypes(filteredCards);
  let rarities: string[] = f.getAllRarities(filteredCards);
  // Render
  res.render("home", {
    // HEADER
    user: i.tempUser,
    // -- The names of the js files you want to load on the page.
    jsFiles: ["infoPopUp", "manaCheckbox", "tooltips", "cardsModal"],
    // -- The title of the page
    title: "Home page",
    // -- The Tab in the nav bar you want to have the orange color
    // -- (0 = home, 1 = decks nakijken, 2 = deck simuleren, all other values lead to no change in color)
    tabToColor: 0,
    // MAIN
    // -- filter system
    cardLookup: cardLookup,
    type: filterType,
    types: types,
    rarity: filterRarity,
    rarities: rarities,
    whiteManaChecked: whiteManaChecked == undefined ? "true" : whiteManaChecked,
    blueManaChecked: blueManaChecked == undefined ? "true" : blueManaChecked,
    blackManaChecked: blackManaChecked == undefined ? "true" : blackManaChecked,
    greenManaChecked: greenManaChecked == undefined ? "true" : greenManaChecked,
    redManaChecked: redManaChecked == undefined ? "true" : redManaChecked,
    colorlessManaChecked:
      colorlessManaChecked == undefined ? "true" : colorlessManaChecked,
    sort: sort,
    sortDirection: sortDirection,
    // -- pagination
    page: pageData.page,
    totalPages: pageData.totalPages,
    filterUrl: pageData.filterUrl,
    // -- cards
    cards: cardsToLoad,
  });
});


app.get("/decks", (req, res) => {
  // params from route
  let pageQueryParam = req.query.page;

  // Pagination
  let pageSize: number = 9;
  let pageData: i.PageData = f.handlePageClickEvent(
    req.query,
    `${pageQueryParam}`,
    pageSize,
    allDecks
  );

  let decksForPage = f.getDecksForPage(allDecks, pageData.page, pageSize);


  res.render("decks", {
    // HEADER
    user: i.tempUser,
    // -- The names of the js files you want to load on the page.
    jsFiles: [],
    // -- The title of the page
    title: "Deck page",
    // -- The Tab in the nav bar you want to have the orange color
    // -- (0 = home, 1 = decks nakijken, 2 = deck simuleren, all other values lead to no change in color)
    tabToColor: 1,
    // MAIN
    // -- pagination
    page: pageData.page,
    totalPages: pageData.totalPages,
    filterUrl: pageData.filterUrl,
    // -- cards
    decks: decksForPage,
  });
});


app.get("/decks/:deckName", (req, res) => {
  // params from route
  let cardLookup = req.query.cardLookup;
  let sort = req.query.sort;
  let sortDirection = req.query.sortDirection;
  let pageQueryParam = req.query.page;

  let deck: i.Deck | undefined = allDecks.find(e => e.deckName == req.params.deckName)
  if (deck == undefined) {
    console.log("No Deck Found");
    
    deck = allDecks[0]
  }
  // Pagination
  let pageSize: number = 6;
  let pageData: i.PageData = f.handlePageClickEvent(
    req.query,
    `${pageQueryParam}`,
    pageSize,
    deck.cards
  );
  
  let cardsToLoad = f.getCardsForPage(deck.cards, pageData.page, pageSize);
  let modalCardsToLoad = f.getCardsForPage(
    deck.cards,
    pageData.page,
    pageSize / 2
  );

  
  res.render("deckdetails", {
    // HEADER
    user: i.tempUser,
    // -- The names of the js files you want to load on the page.
    jsFiles: ["infoPopUp", "manaCheckbox", "tooltips", "cardsModal"],
    // -- The title of the page
    title: "Home page",
    // -- The Tab in the nav bar you want to have the orange color
    // -- (0 = home, 1 = decks nakijken, 2 = deck simuleren, all other values lead to no change in color)
    tabToColor: 1,
    // MAIN
    // -- filter system
    cardLookup: cardLookup,
    sort: sort,
    sortDirection: sortDirection,
    // -- pagination
    page: pageData.page,
    totalPages: pageData.totalPages,
    filterUrl: pageData.filterUrl,
    // -- cards
    cards: cardsToLoad,
    modalCards: modalCardsToLoad,
  });
});


app.get("/drawtest", (req, res) => {
  res.render("drawtest");
});


app.get("/profile", (req, res) => {
  res.render("profile");
});

app.get("/editDeck", (req, res) => {
  // params from route
  let pageQueryParam = req.query.page;

  // Pagination
  let pageSize: number = 6;
  let pageData: i.PageData = f.handlePageClickEvent(
    req.query,
    `${pageQueryParam}`,
    pageSize,
    allCards
  );

  let cardsToLoad = f.getCardsForPage(allCards, pageData.page, pageSize);
  let modalCardsToLoad = f.getCardsForPage(
    allCards,
    pageData.page,
    pageSize / 2
  );

  res.render("editDeck", {
    // HEADER
    user: i.tempUser,
    // -- The names of the js files you want to load on the page.
    jsFiles: ["deckname"],
    // -- The title of the page
    title: "Edit page",
    // -- The Tab in the nav bar you want to have the orange color
    // -- (0 = home, 1 = decks nakijken, 2 = deck simuleren, all other values lead to no change in color)
    tabToColor: 1,
    // -- pagination
    page: pageData.page,
    totalPages: pageData.totalPages,
    filterUrl: pageData.filterUrl,
    // -- cards
    cards: cardsToLoad,
    modalCards: modalCardsToLoad,
  });
});

app.listen(app.get("port"), async () => {
  console.log(
    "[ - SERVER - ] Listening at http://localhost:" + app.get("port")
  );
  // Get all the cards from the api, there are allot so takes a while before all cards get loaded
  // The SDK thankfully makes it so that we can load them in in batches, so the app will work and will graduatly load in more.
  Magic.Cards.all({ page: 1, pageSize: 100 })
    .on("data", (card) => {
      // filter out cards without images ==> Usually these cards in the api are duplicates so we dont add them, this makes it also so that we dont need to worry about improperly displaying the crads.
      if (card.imageUrl !== undefined) {
        allCards.push(card);
      }
    })
    // If all cards are loaded display message
    .on("end", () => console.log("[ - SERVER - ] All cards gotten"))
    // If error while loading, display error
    .on("error", (e) => console.log("ERROR: " + e));
});
