import express from "express";
import ejs from "ejs";
import * as i from "./interfaces";
import Magic = require("mtgsdk-ts");
import * as f from "./functions";
import * as db from "./db";
import bodyParser from "body-parser"


export let allCards: Magic.Card[] = [];

async function getTempDecks() {
  allDecks = await db.decksCollection.find({}).toArray();
}

const app = express();

let allDecks: i.Deck[] = [];
getTempDecks();

let allCardTypes: string[] = [];
let allCardRarities: string[] = [];

app.set("port", 3000);
app.set("view engine", "ejs");

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }))

app.get("/", (req, res) => {
  res.render("landingspage");
});

app.post("/feedback", (req, res) => {
  const feedbackType = req.body.feedbackType;
  const feedback = req.body.feedback;

  const feedBackItem: i.Feedback = {
    feedbackType: feedbackType,
    feedback: feedback,
  }
})

app.get("/home", async (req, res) => {
  // params from route
  // -- filter and sort
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
  // -- pagination
  let pageQueryParam = req.query.page;
  // filter logic
  let filteredAndSortedCards: Magic.Card[] = f.filterAndSortCards(allCards, cardLookup, filterType, filterRarity, whiteManaChecked, blueManaChecked, blackManaChecked, greenManaChecked, redManaChecked, colorlessManaChecked, sort, sortDirection)
  // Pagination
  let pageSize: number = 12;
  let pageData: i.PageData = f.handlePageClickEvent(req.query, `${pageQueryParam}`, pageSize, filteredAndSortedCards);

  let cardsToLoad = f.getCardsForPage(filteredAndSortedCards, pageData.page, pageSize)
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
    types: allCardTypes,
    rarity: filterRarity,
    rarities: allCardRarities,
    whiteManaChecked: whiteManaChecked == undefined ? "true" : whiteManaChecked,
    blueManaChecked: blueManaChecked == undefined ? "true" : blueManaChecked,
    blackManaChecked: blackManaChecked == undefined ? "true" : blackManaChecked,
    greenManaChecked: greenManaChecked == undefined ? "true" : greenManaChecked,
    redManaChecked: redManaChecked == undefined ? "true" : redManaChecked,
    colorlessManaChecked: colorlessManaChecked == undefined ? "true" : colorlessManaChecked,
    sort: sort,
    sortDirection: sortDirection,
    deck: "",
    pageLink: "home",
    // -- pagination
    page: pageData.page,
    totalPages: pageData.totalPages,
    filterUrl: pageData.filterUrl,
    // -- cards
    cards: cardsToLoad
  })
})
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
app.get("/deckdetails", (req, res) => {
  // params from route
  let cardLookup = req.query.cardLookup;
  let sort = req.query.sort;
  let sortDirection = req.query.sortDirection;
  let pageQueryParam = req.query.page;

  // Pagination
  let pageSize: number = 6;
  let pageData: i.PageData = f.handlePageClickEvent(req.query, `${pageQueryParam}`, pageSize, allCards);

  let cardsToLoad = f.getCardsForPage(allCards, pageData.page, pageSize)
  let modalCardsToLoad = f.getCardsForPage(allCards, pageData.page, pageSize / 2)

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

let lastSelectedDeck: i.Deck;
let selectedDeck: i.Deck | undefined = undefined;
let unpulledCards: Magic.Card[] | undefined = [];
let pulledCards: Magic.Card[];

app.get("/drawtest", async (req, res) => {
  // Query params
  // -- filter and sort
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
  let deck = req.query.decks;
  let cardLookupInDeck = req.query.cardLookupInDeck;
  // -- pagination
  let pageQueryParam = req.query.page;
  // -- other
  let whatToDo = req.query.action;
  let selectedDeckQuery = req.query.decks;
  // Logic
  // Find What Deck is selected
  selectedDeck = allDecks.find(e => e.deckName == selectedDeckQuery)

  // if deck is not found,
  // set to deck nr. 1
  // else set to lastDeck
  if (selectedDeck === undefined) {
    if (lastSelectedDeck == undefined) {
      selectedDeck = allDecks[0]
    } else {
      selectedDeck = lastSelectedDeck;
    }
  }

  let cardLookupInDeckCard: Magic.Card | undefined = undefined
  let cardLookupInDeckCardChance: number | undefined = undefined
  // if deck is diffrent from last load
  if (lastSelectedDeck !== selectedDeck) {
    // set unpulledCards to cards of new deck
    unpulledCards = [...selectedDeck.cards];
    // Shuffle cards
    unpulledCards = [...f.shuffleCards(unpulledCards)]
    // clear pulledCards
    pulledCards = [];
  } else {
    // if clicked to pull a card
    if (whatToDo == "pull") {
      if (pulledCards !== undefined && unpulledCards !== undefined) {
        // get the last card from the unpulled cards
        let card = unpulledCards.pop()
        if (card !== undefined) {
          // if it exists add it as the first card in pulledCards
          pulledCards.unshift(card);
        }
      }
      // if clicked to reset
    } else if (whatToDo == "reset") {
      // reset the unpulledcards to the cards of the selected deck
      unpulledCards = [...selectedDeck.cards]
      // shuffle the cards
      unpulledCards = [...f.shuffleCards(unpulledCards)]
      // empty the pulled cards
      pulledCards = [];
    }
    // if cardLookupInDeck is not defined
    if (cardLookupInDeck != undefined && selectedDeck != undefined) {
      console.log("step 1");

      // find the card they are looking for
      cardLookupInDeckCard = selectedDeck.cards.find(e => e.name.toLowerCase().includes(`${cardLookupInDeck}`.toLowerCase()))
      console.log("step 2" + cardLookupInDeckCard?.name);

      // if card is found and there are cards in unpulledCards
      if (cardLookupInDeckCard != undefined && unpulledCards != undefined) {
        console.log("cardLookupInDeckCard:", cardLookupInDeckCard);

        // calculate the chance u have to pull that card from the unpulledCards
        cardLookupInDeckCardChance = f.getChance(unpulledCards, cardLookupInDeckCard).chance
        console.log("step 3" + cardLookupInDeckCardChance);
      }
    }

  }
  // --filter logic
  let filterAndSortedCards: Magic.Card[] = pulledCards;
  if (pulledCards !== undefined) {
    filterAndSortedCards = [...f.filterAndSortCards(pulledCards, cardLookup, filterType, filterRarity, whiteManaChecked, blueManaChecked, blackManaChecked, greenManaChecked, redManaChecked, colorlessManaChecked, sort, sortDirection)]
  }

  // get the cardToShow (always the first card in pulledCards)
  let cardToShow: Magic.Card = pulledCards[0];
  // initialize nextCard
  let nextCard: Magic.Card | undefined = undefined
  // if there is still a card in unpulled cards
  if (unpulledCards !== undefined) {
    // set nextCard to the last index of unpulledCards
    nextCard = unpulledCards[unpulledCards.length - 1]
  }

  // calculate the chanceData of the cardToSHow
  let chanceData = f.getChance(selectedDeck.cards, cardToShow)
  // save selectedDeck to be used next load of page
  lastSelectedDeck = selectedDeck;

  // Pagination
  let pageSize: number = 6;
  let pageData: i.PageData = f.handlePageClickEvent(req.query, `${pageQueryParam}`, pageSize, filterAndSortedCards);

  let cardsToShow = f.getCardsForPage(filterAndSortedCards, pageData.page, pageSize)


  res.render("drawtest", {
    // HEADER
    user: i.tempUser,
    // -- The names of the js files you want to load on the page.
    jsFiles: ["submitOnChange", "cardsModal", "manaCheckbox", "tooltips", "drawCard"],
    // -- The title of the page
    title: "Deck simuleren",
    // -- The Tab in the nav bar you want to have the orange color
    // -- (0 = home, 1 = decks nakijken, 2 = deck simuleren, all other values lead to no change in color)
    tabToColor: 2,
    // MAIN
    // -- filter system
    cardLookup: cardLookup,
    type: filterType,
    types: allCardTypes,
    rarity: filterRarity,
    rarities: allCardRarities,
    whiteManaChecked: whiteManaChecked == undefined ? "true" : whiteManaChecked,
    blueManaChecked: blueManaChecked == undefined ? "true" : blueManaChecked,
    blackManaChecked: blackManaChecked == undefined ? "true" : blackManaChecked,
    greenManaChecked: greenManaChecked == undefined ? "true" : greenManaChecked,
    redManaChecked: redManaChecked == undefined ? "true" : redManaChecked,
    colorlessManaChecked: colorlessManaChecked == undefined ? "true" : colorlessManaChecked,
    sort: sort,
    sortDirection: sortDirection,
    deck: deck,
    pageLink: "drawtest",
    // -- pagination
    page: pageData.page,
    totalPages: pageData.totalPages,
    filterUrl: pageData.filterUrl,
    // -- cardlookupInDeck
    cardLookupInDeck: cardLookupInDeck,
    cardLookupInDeckCard: cardLookupInDeckCard,
    cardLookupInDeckCardChance: cardLookupInDeckCardChance,
    // -- other
    allDecks: allDecks,
    selectedDeck: selectedDeck,
    unpulledCards: unpulledCards,
    pulledCards: pulledCards,
    cardsToShow: cardsToShow,
    card: cardToShow,
    nextCard: nextCard,
    percentile: chanceData.chance,
    amount: chanceData.amount,
  });
});
app.get("/profile", (req, res) => {
  res.render("profile");
});

app.get("/editDeck", (req, res) => {
  // params from route
  let cardLookup = req.query.cardLookup;
  let sort = req.query.sort;
  let sortDirection = req.query.sortDirection;
  let pageQueryParam = req.query.page;

  // Pagination
  let pageSize: number = 6;
  let pageData: i.PageData = f.handlePageClickEvent(req.query, `${pageQueryParam}`, pageSize, allCards);

  let cardsToLoad = f.getCardsForPage(allCards, pageData.page, pageSize)
  let modalCardsToLoad = f.getCardsForPage(allCards, pageData.page, pageSize / 2)

  res.render("editDeck", {
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
        allCardTypes = f.getAllCardTypes(allCards);
        allCardRarities = f.getAllRarities(allCards);
        allCards[0].rarity
      }
    })
    // If all cards are loaded display message
    .on("end", () => console.log("[ - SERVER - ] All cards gotten"))
    // If error while loading, display error
    .on("error", (e) => console.log("ERROR: " + e));

  await db.connect()
});
