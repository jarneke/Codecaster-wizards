if (process.env.NODE_ENV !== "production") {
  require("dotenv").config;
}
import express from "express";
import ejs from "ejs";
import * as i from "./interfaces";
import Magic = require("mtgsdk-ts");
import * as f from "./functions";
import { Rarity } from "mtgsdk-ts/out/IMagic";
import * as db from "./db";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import session from "./session";
import { secureMiddleware } from "./secureMiddleware";
import bcrypt from "bcrypt";
/**
 * A function to get and set all tips
 */
async function getTips() {
  allTips = await db.tipsCollection.find({}).toArray();
}
// initialize express app
const app = express();

let allCards: Magic.Card[] = [];
const saltRounds = parseInt(process.env.SALTROUNDS!) || 10;

// initialize alltips array
let allTips: i.Tip[] = [];

let allDecks: i.Deck[] = [];

let newUser: i.User[] = [];

let allCardTypes: string[] = [];
let allCardRarities: string[] = [];

// variable to store last selected deck on drawtest page
let lastSelectedDeck: i.Deck;
// variable to store selected deck
let selectedDeck: i.Deck | null = null;
// variable to store unpulled cards of drawtest page
let unpulledCards: i.Card[] = [];
// variable to store pulled cards of drawtest page
let pulledCards: i.Card[] = [];

// set the port to use on the port specified in .env, or default to 3000
app.set("port", process.env.PORT ?? 3000);
// set the viewengine to ejs
app.set("view engine", "ejs");

// tell app that static files ae in public map
app.use(express.static("public"));
// tell app to use bodyParser
app.use(bodyParser.urlencoded({ extended: true }));
// tell app to use cookieParser
app.use(cookieParser());
app.use(session);

// landingspage
app.get("/", (req, res) => {
  res.render("landingspage");
});

app.get("/login", (req, res) => {
  return res.render("loginspage", {
    alert: false,
    alertMsg: "",
  });
});

app.post("/login", async (req, res) => {
  const { loginEmail, loginPassword } = req.body;

  try {
    let user: i.User | undefined = await db.login(loginEmail, loginPassword);
    delete user!.password;

    req.session.user = user;
    res.redirect("/home");
  } catch (e: any) {
    return res.render("loginspage", {
      alert: true,
      alertMsg: "E-mail of wachtwoord is onjuist!",
    });
  }
});

app.get("/register", (req, res) => {
  res.render("registerpage");
});

app.post("/register", async (req, res) => {
  const {
    registerFName,
    registerName,
    registerUsername,
    registerEmail,
    registerPassword,
    registerConfirmPassword,
  } = req.body;
  //if (registerConfirmPassword !== registerPassword) {
  //res.render("registerpagina", {
  // alert: true,
  //  alertMsg
  // })
  //}
  const newUser: i.User = {
    firstName: registerFName,
    lastName: registerName,
    userName: registerUsername,
    email: registerEmail,
    description: "",
    password: await bcrypt.hash(registerPassword, saltRounds),
    role: "USER",
  };

  await db.usersCollection.insertOne(newUser);

  res.redirect("/login");
});

app.post("/logout", async (req, res) => {
  req.session.destroy(() => {
    res.redirect("/login");
  });
});

// post route to handle cookie of showPopup
app.post("/dontShowPopup", async (req, res) => {
  console.log(req.query);

  const show: boolean | undefined = req.cookies.showPopup
    ? undefined
    : req.cookies.showPopup === "true"
    ? true
    : false;
  !show ? res.cookie("showPopup", true) : console.log(show);
  res.redirect("/home");
});

app.post("/feedback", (req, res) => {
  // params from route
  const feedbackType = req.body.feedbackType;
  const feedback = req.body.feedback;
  const redirectPage = req.body.toRedirectTo;

  // make a feedback object
  const feedBackItem: i.Feedback = {
    feedbackType: feedbackType,
    feedback: feedback,
  };

  // insert it in database
  // no need to await, can run in bakground
  db.feedbacksCollection.insertOne(feedBackItem);
  // redirect to specified page
  res.redirect(`/${redirectPage}`);
});

app.get("/home", secureMiddleware, async (req, res) => {
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

  // Pagination
  // -- Set pageSize
  let pageSize: number = 12;
  // -- Get page and filterUrl
  let pageData: i.PageData = f.handlePageClickEvent(req.query);

  // -- set filterparams for cards to load
  const filterParam: i.Filter = {
    cardLookup: cardLookup,
    filterType: filterType,
    filterRarity: filterRarity,
    whiteManaChecked: whiteManaChecked,
    blueManaChecked: blueManaChecked,
    blackManaChecked: blackManaChecked,
    greenManaChecked: greenManaChecked,
    redManaChecked: redManaChecked,
    colorlessManaChecked: colorlessManaChecked,
    sort: sort,
    sortDirection: sortDirection,
  };
  // get cardsToLoad and totalpages
  let cardsToLoadAndTotalPages = await f.getCardsForPage(
    filterParam,
    pageData.page,
    pageSize
  );
  // Render
  res.render("home", {
    // HEADER
    user: res.locals.user,
    // -- The names of the js files you want to load on the page.
    jsFiles: ["infoPopUp", "manaCheckbox", "tooltips", "cardsModal"],
    // -- The title of the page
    title: "Home page",
    // -- The Tab in the nav bar you want to have the orange color
    // -- (0 = home, 1 = decks nakijken, 2 = deck simuleren, all other values lead to no change in color)
    tabToColor: 0,
    // The page it should redirect to after feedback form is submitted
    toRedirectTo: "home",
    // MAIN
    // -- filter system
    cardLookup: cardLookup,
    type: filterType,
    types: i.filterTypes,
    rarity: filterRarity,
    rarities: i.filterRarities,
    whiteManaChecked: whiteManaChecked == undefined ? "true" : whiteManaChecked,
    blueManaChecked: blueManaChecked == undefined ? "true" : blueManaChecked,
    blackManaChecked: blackManaChecked == undefined ? "true" : blackManaChecked,
    greenManaChecked: greenManaChecked == undefined ? "true" : greenManaChecked,
    redManaChecked: redManaChecked == undefined ? "true" : redManaChecked,
    colorlessManaChecked:
      colorlessManaChecked == undefined ? "true" : colorlessManaChecked,
    sort: sort,
    sortDirection: sortDirection,
    deck: "",
    pageLink: "home",
    // -- pagination
    page: pageData.page,
    totalPages: cardsToLoadAndTotalPages.totalPages,
    filterUrl: pageData.filterUrl,
    // -- cards
    cards: cardsToLoadAndTotalPages.cards,
  });
});

app.get("/decks", secureMiddleware, async (req, res) => {
  let decksForPage: i.Deck[] = await db.decksCollection.find({}).toArray();
  // params from route

  // Pagination
  let pageSize: number = 9;
  let pageData: i.PageData = f.handlePageClickEvent(req.query);

  let totalPages = f.getTotalPages(decksForPage.length, pageSize);

  res.render("decks", {
    // HEADER
    user: res.locals.user,
    // -- The names of the js files you want to load on the page.
    jsFiles: [],
    // -- The title of the page
    title: "Deck page",
    // -- The Tab in the nav bar you want to have the orange color
    // -- (0 = home, 1 = decks nakijken, 2 = deck simuleren, all other values lead to no change in color)
    tabToColor: 1,
    // The page it should redirect to after feedback form is submitted
    toRedirectTo: `decks`,
    // MAIN
    // MAIN
    // -- pagination
    page: pageData.page,
    totalPages: totalPages,
    filterUrl: pageData.filterUrl,
    // -- cards
    decks: decksForPage,
  });
});
app.get("/noDeck", (req, res) => {
  res.render("noDeck", {
    // HEADER
    user: res.locals.user,
    // -- The names of the js files you want to load on the page.
    jsFiles: ["infoPopUp", "manaCheckbox", "tooltips", "cardsModal"],
    // -- The title of the page
    title: "! geen decks !",
    // -- The Tab in the nav bar you want to have the orange color
    // -- (0 = home, 1 = decks nakijken, 2 = deck simuleren, all other values lead to no change in color)
    tabToColor: 3,
    // The page it should redirect to after feedback form is submitted
    toRedirectTo: "noDecks",
  });
});
app.get("/decks/:deckName", secureMiddleware, async (req, res) => {
  // params from route
  let cardLookup = req.query.cardLookup;
  let sort = req.query.sort;
  let sortDirection = req.query.sortDirection;

  const selectedDeck: i.Deck | null = await db.decksCollection.findOne({
    deckName: req.params.deckName,
  });
  if (selectedDeck == null) {
    res.redirect("/404");
  }

  let amountMap = new Map<i.Card, number>();
  for (const card of selectedDeck!.cards) {
    const existingCard = Array.from(amountMap.keys()).find(
      (c) => c.name === card.name
    );
    if (existingCard) {
      amountMap.set(existingCard, amountMap.get(existingCard)! + 1);
    } else {
      amountMap.set(card, 1);
    }
  }
  // Pagination
  let pageSize: number = 6;
  let pageData: i.PageData = f.handlePageClickEvent(req.query);
  let totalPages: number = f.getTotalPages(
    selectedDeck!.cards.length,
    pageSize
  );

  let amountLandcards: number | undefined = undefined;

  let avgManaCost: number | undefined = undefined;

  if (selectedDeck!.cards !== undefined) {
    avgManaCost = f.getAvgManaCost(selectedDeck!.cards);
    amountLandcards = selectedDeck!.cards.filter((card) =>
      card.types.includes("Land")
    ).length;
    amountMap = f.getCardWAmauntForPage(amountMap, pageData.page, pageSize);
  } else {
    console.log("[ - SERVER - ]=> selected deck cards = undefined");
  }

  for (const [card, amount] of amountMap) {
    console.log(`${card.name}: ${amount}`);
  }

  res.render("deckdetails", {
    // HEADER
    user: res.locals.user,
    // -- The names of the js files you want to load on the page.
    jsFiles: [],
    // -- The title of the page
    title: selectedDeck?.deckName,
    // -- The Tab in the nav bar you want to have the orange color
    // -- (0 = home, 1 = decks nakijken, 2 = deck simuleren, all other values lead to no change in color)
    tabToColor: 1,
    // The page it should redirect to after feedback form is submitted
    toRedirectTo: `deck/${selectedDeck!.deckName}`,
    // MAIN
    // -- filter system
    cardLookup: cardLookup,
    sort: sort,
    sortDirection: sortDirection,
    // -- pagination
    page: pageData.page,
    totalPages: totalPages,
    filterUrl: pageData.filterUrl,
    // -- cards
    cards: amountMap,
    selectedDeck: selectedDeck,
    tip: allTips[f.getRandomNumber(0, allTips.length - 1)],
    amountLandcards: amountLandcards,
    avgManaCost: avgManaCost,
  });
});
app.post("/changeDeckName", async (req, res) => {
  const name = req.body.deckNameInput;
  const oldName = req.body.oldDeckName;

  const oldDeck = await db.decksCollection.findOne({ deckName: oldName });

  db.decksCollection.updateOne(
    { _id: oldDeck?._id },
    { $set: { deckName: name } }
  );

  res.redirect(`/editDeck/${name}`);
});
app.get("/drawtest", secureMiddleware, async (req, res) => {
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
  let cardLookupInDeckInput = req.query.cardLookupInDeckInput;

  // -- other
  let whatToDo = req.query.action;
  let selectedDeckQuery = req.query.decks;
  // Logic
  // Find What Deck is selected
  selectedDeck = await db.decksCollection.findOne({
    deckName: `${selectedDeckQuery}`,
  });
  // if deck is not found,
  // set to deck nr. 1
  // else set to lastDeck
  if (!selectedDeck) {
    if (!lastSelectedDeck) {
      selectedDeck = await db.decksCollection.findOne({});
      if (!selectedDeck) {
        // TODO: make noDecks page
        return res.redirect("/noDecks");
      }
    } else {
      selectedDeck = lastSelectedDeck;
    }
  }
  if (!lastSelectedDeck) {
    lastSelectedDeck = selectedDeck;
  }
  let cardLookupInDeckCard: i.Card | undefined = undefined;
  let cardLookupInDeckCardChance: number | undefined = undefined;
  if (lastSelectedDeck) console.log(lastSelectedDeck.deckName);
  console.log(selectedDeck.deckName);

  // if deck is diffrent from last load
  if (lastSelectedDeck.deckName !== selectedDeck.deckName) {
    // set unpulledCards to cards of new deck
    unpulledCards = [...selectedDeck.cards];
    // Shuffle cards
    unpulledCards = [...f.shuffleCards(unpulledCards)];
    // clear pulledCards
    pulledCards = [];
  } else {
    if (unpulledCards.length === 0 && !whatToDo) {
      unpulledCards = [...f.shuffleCards(selectedDeck.cards)];
    }
    // if clicked to pull a card
    if (whatToDo == "pull") {
      if (pulledCards !== undefined && unpulledCards !== undefined) {
        // get the last card from the unpulled cards
        let card = unpulledCards.pop();
        if (card !== undefined) {
          // if it exists add it as the first card in pulledCards
          pulledCards.unshift(card);
        }
      }
      // if clicked to reset
    } else if (whatToDo == "reset") {
      // reset the unpulledcards to the cards of the selected deck
      unpulledCards = [...selectedDeck.cards];
      // shuffle the cards
      unpulledCards = [...f.shuffleCards(unpulledCards)];
      // empty the pulled cards
      pulledCards = [];
    }
    // if cardLookupInDeck is not defined
    if (cardLookupInDeck != undefined && selectedDeck != undefined) {
      // find the card they are looking for
      cardLookupInDeckCard = selectedDeck.cards.find((e) =>
        e.name.toLowerCase().includes(`${cardLookupInDeck}`.toLowerCase())
      );
      // if card is found and there are cards in unpulledCards
      if (cardLookupInDeckCard != undefined && unpulledCards != undefined) {
        // calculate the chance u have to pull that card from the unpulledCards
        cardLookupInDeckCardChance = f.getChance(
          unpulledCards,
          cardLookupInDeckCard
        ).chance;
      }
    }
  }
  // --filter logic
  let filterAndSortedCards: i.Card[] = pulledCards;

  if (pulledCards !== undefined) {
    filterAndSortedCards = [
      ...f.filterAndSortCards(
        pulledCards,
        cardLookup,
        filterType,
        filterRarity,
        whiteManaChecked,
        blueManaChecked,
        blackManaChecked,
        greenManaChecked,
        redManaChecked,
        colorlessManaChecked,
        sort,
        sortDirection
      ),
    ];
  }

  let amountMap = new Map<i.Card, number>();

  for (const card of filterAndSortedCards) {
    const existingCard = Array.from(amountMap.keys()).find(
      (c) => c.name === card.name
    );
    if (existingCard) {
      amountMap.set(existingCard, amountMap.get(existingCard)! + 1);
    } else {
      amountMap.set(card, 1);
    }
  }
  // get the cardToShow (always the first card in pulledCards)
  let cardToShow: i.Card = pulledCards[0];
  // initialize nextCard
  let nextCard: i.Card | undefined = undefined;
  // if there is still a card in unpulled cards
  if (unpulledCards !== undefined) {
    // set nextCard to the last index of unpulledCards
    nextCard = unpulledCards[unpulledCards.length - 1];
  }

  // calculate the chanceData of the cardToSHow
  let chanceData = f.getChance(selectedDeck.cards, cardToShow);

  // save selectedDeck to be used next load of page
  lastSelectedDeck = selectedDeck;

  // Pagination
  let pageSize: number = 6;
  let pageData: i.PageData = f.handlePageClickEvent(req.query);
  let totalPages = f.getTotalPages(
    Array.from(amountMap.keys()).length,
    pageSize
  );

  amountMap = f.getCardWAmauntForPage(amountMap, pageData.page, pageSize);

  res.render("drawtest", {
    // HEADER
    user: res.locals.user,
    // -- The names of the js files you want to load on the page.
    jsFiles: [
      "submitOnChange",
      "cardsModal",
      "manaCheckbox",
      "tooltips",
      "drawCard",
    ],
    // -- The title of the page
    title: "Deck simuleren",
    // -- The Tab in the nav bar you want to have the orange color
    // -- (0 = home, 1 = decks nakijken, 2 = deck simuleren, all other values lead to no change in color)
    tabToColor: 2,
    // The page it should redirect to after feedback form is submitted
    toRedirectTo: "drawtest",
    // MAIN
    // -- filter system
    cardLookup: cardLookup,
    type: filterType,
    types: i.filterTypes,
    rarity: filterRarity,
    rarities: i.filterRarities,
    whiteManaChecked: whiteManaChecked == undefined ? "true" : whiteManaChecked,
    blueManaChecked: blueManaChecked == undefined ? "true" : blueManaChecked,
    blackManaChecked: blackManaChecked == undefined ? "true" : blackManaChecked,
    greenManaChecked: greenManaChecked == undefined ? "true" : greenManaChecked,
    redManaChecked: redManaChecked == undefined ? "true" : redManaChecked,
    colorlessManaChecked:
      colorlessManaChecked == undefined ? "true" : colorlessManaChecked,
    sort: sort,
    sortDirection: sortDirection,
    deck: deck,
    pageLink: "drawtest",
    // -- pagination
    page: pageData.page,
    totalPages: totalPages,
    filterUrl: pageData.filterUrl,
    // -- cardlookupInDeck
    cardLookupInDeck: cardLookupInDeck,
    cardLookupInDeckInput: cardLookupInDeckInput,
    cardLookupInDeckCard: cardLookupInDeckCard,
    cardLookupInDeckCardChance: cardLookupInDeckCardChance,
    // -- other
    allDecks: await db.decksCollection.find().toArray(),
    selectedDeck: selectedDeck,
    unpulledCards: unpulledCards,
    pulledCards: pulledCards,
    cardsToShow: amountMap,
    card: cardToShow,
    nextCard: nextCard,
    percentile: chanceData.chance,
    amount: chanceData.amount,
  });
});
app.get("/profile", secureMiddleware, async (req, res) => {
  res.render("profile", {
    // HEADER
    user: res.locals.user,
    // -- The names of the js files you want to load on the page.
    jsFiles: ["editProfile"],
    // -- The title of the page
    title: "Profile Page",
    toRedirectTo: "profile",
    // -- The Tab in the nav bar you want to have the orange color
    // -- (0 = home, 1 = decks nakijken, 2 = deck simuleren, all other values lead to no change in color)
    tabToColor: 3,
    favoriteDecks: allDecks,
  });
});

app.post("/profile", secureMiddleware, async (req, res) => {
  console.log(req.body);
  const { firstName, lastName, email, passwordFormLabel, description } =
    req.body;
  const userName: string = `${
    firstName === "" ? res.locals.user?.firstName : firstName
  }_${lastName === "" ? res.locals.user?.lastName : lastName}`;

  const newUserDetails: i.User = {
    firstName:
      firstName === "" && res.locals.user
        ? res.locals.user.firstName
        : firstName,
    lastName:
      lastName === "" && res.locals.user ? res.locals.user?.lastName : lastName,
    userName:
      userName === "" && res.locals.user ? res.locals.user?.userName : userName,
    email: email === "" && res.locals.user ? res.locals.user?.email : email,
    description:
      description === "" && res.locals.user
        ? res.locals.user.description
        : description,
    password:
      passwordFormLabel === "" && res.locals.user
        ? res.locals.user.password
        : await bcrypt.hash(passwordFormLabel, saltRounds),
    role: "USER",
  };

  await db.usersCollection.updateOne(
    { _id: res.locals.user?._id },
    { $set: newUserDetails }
  );
  res.redirect("/profile");
});

app.post("/delete", async (req, res) => {
  await db.usersCollection.deleteOne({ _id: res.locals.user?._id });
  res.redirect("/");
});

app.get("/editDeck/:deckName", async (req, res) => {
  const selectedDeck: i.Deck | null = await db.decksCollection.findOne({
    deckName: req.params.deckName,
  });
  if (!selectedDeck) {
    return res.redirect("/404");
  }
  // Pagination
  let pageSize: number = 3;
  let pageData: i.PageData = f.handlePageClickEvent(req.query);
  let totalPages = f.getTotalPages(selectedDeck.cards.length, pageSize);
  let cardsToLoad = undefined;

  cardsToLoad = f.getCardsForPageFromArray(
    selectedDeck.cards,
    pageData.page,
    pageSize
  );

  res.render("editDeck", {
    // HEADER
    user: res.locals.user,
    // -- The names of the js files you want to load on the page.
    jsFiles: [],
    // -- The title of the page
    title: "Edit page",
    // -- The Tab in the nav bar you want to have the orange color
    // -- (0 = home, 1 = decks nakijken, 2 = deck simuleren, all other values lead to no change in color)
    tabToColor: 1,
    // The page it should redirect to after feedback form is submitted
    toRedirectTo: `editDeck/${selectedDeck!.deckName}`,
    // MAIN
    // -- pagination
    page: pageData?.page,
    totalPages: totalPages,
    filterUrl: pageData?.filterUrl,
    // -- cards
    cards: cardsToLoad,
    selectedDeck: selectedDeck,
  });
});

app.get("/404", secureMiddleware, (req, res) => {
  res.render("404", {
    // HEADER
    user: res.locals.user,
    // -- The names of the js files you want to load on the page.
    jsFiles: [],
    // -- The title of the page
    title: "! 404 - niet gevonden !",
    // -- The Tab in the nav bar you want to have the orange color
    // -- (0 = home, 1 = decks nakijken, 2 = deck simuleren, all other values lead to no change in color)
    tabToColor: 3,
    // The page it should redirect to after feedback form is submitted
    toRedirectTo: "404",
  });
});
app.listen(app.get("port"), async () => {
  console.clear();
  console.log("[ - SERVER - ]=> connecting to database");
  await db.connect();
  console.log("[ - SERVER - ]=> getting tips");
  await getTips();
  console.log("[ - SERVER - ]=> ! DONE !");
  console.log(
    "[ - SERVER - ]=> Listening at http://localhost:" + app.get("port")
  );
});
