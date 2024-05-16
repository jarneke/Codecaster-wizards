import express from "express";
import ejs from "ejs";
import {
  Tip,
  Deck,
  Card,
  User,
  Feedback,
  PageData,
  Filter,
  filterTypes,
  filterRarities,
} from "./interfaces";
import Magic = require("mtgsdk-ts");
import {
  getDecksOfUser,
  handlePageClickEvent,
  getCardsForPage,
  getTotalPages,
  getAvgManaCost,
  getCardWAmauntForPage,
  getRandomNumber,
  shuffleCards,
  getChance,
  filterAndSortCards,
} from "./functions";
import {
  tipsCollection,
  login,
  usersCollection,
  feedbacksCollection,
  decksCollection,
  cardsCollection,
  connect,
} from "./db";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import session from "./session";
import { secureMiddleware } from "./secureMiddleware";
import bcrypt from "bcrypt";
/**
 * A function to get and set all tips
 */
async function getTips() {
  allTips = await tipsCollection.find({}).toArray();
}
// initialize express app
const app = express();

const saltRounds = parseInt(process.env.SALTROUNDS!) || 10;

// initialize alltips array
let allTips: Tip[] = [];

let allDecks: Deck[] = [];

// variable to store last selected deck on drawtest page
let lastSelectedDeck: Deck;
// variable to store selected deck
let selectedDeck: Deck | null = null;
// variable to store unpulled cards of drawtest page
let unpulledCards: Card[] = [];
// variable to store pulled cards of drawtest page
let pulledCards: Card[] = [];

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
    let user: User | undefined = await login(loginEmail, loginPassword);
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
  if (registerConfirmPassword !== registerPassword) {
    return res.render("registerpagina", {
      alert: true,
      alertMsg: "wachtwoorden komen niet overeen",
    });
  }
  // TODO: Schrijf check of e-mail nog niet bestaat, anders, geef alert
  const newUser: User = {
    firstName: registerFName,
    lastName: registerName,
    userName: registerUsername,
    email: registerEmail,
    description: "",
    password: await bcrypt.hash(registerPassword, saltRounds),
    role: "USER",
  };
  await usersCollection.insertOne(newUser);
  res.redirect("/login");
});

app.post("/logout", async (req, res) => {
  req.session.destroy(() => {
    res.redirect("/login");
  });
});

app.post("/dontShowPopup", async (req, res) => {
  // set a cookie that lasts a week
  res.cookie("dontShowInfo", "true", {
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
  });
  // redirect to home page after setting cookie
  res.redirect("/home");
});

app.post("/feedback", (req, res) => {
  // params from route
  const feedbackType = req.body.feedbackType;
  const feedback = req.body.feedback;
  const redirectPage = req.body.toRedirectTo;

  // make a feedback object
  const feedBackItem: Feedback = {
    feedbackType: feedbackType,
    feedback: feedback,
  };

  // insert it in database
  // no need to await, can run in background
  feedbacksCollection.insertOne(feedBackItem);
  // redirect to specified page
  res.redirect(`/${redirectPage}`);
});

app.get("/home", secureMiddleware, async (req, res) => {
  // get all the decks of a user
  const allDecks: Deck[] = await getDecksOfUser(res);
  // store all the deckNames
  const deckNames: string[] = allDecks.map((e) => e.deckName);
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
  let pageData: PageData = handlePageClickEvent(req.query);

  // -- set filterparams for cards to load
  const filterParam: Filter = {
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
  let cardsToLoadAndTotalPages = await getCardsForPage(
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
    // -- modal
    dontShowModal: req.cookies.dontShowInfo === "true" ? true : false,
    // -- filter system
    cardLookup: cardLookup,
    type: filterType,
    types: filterTypes,
    rarity: filterRarity,
    rarities: filterRarities,
    whiteManaChecked: whiteManaChecked == undefined ? "true" : whiteManaChecked,
    blueManaChecked: blueManaChecked == undefined ? "true" : blueManaChecked,
    blackManaChecked: blackManaChecked == undefined ? "true" : blackManaChecked,
    greenManaChecked: greenManaChecked == undefined ? "true" : greenManaChecked,
    redManaChecked: redManaChecked == undefined ? "true" : redManaChecked,
    colorlessManaChecked:
      colorlessManaChecked == undefined ? "true" : colorlessManaChecked,
    sort: sort,
    sortDirection: sortDirection,
    pageLink: "home",
    // -- pagination
    page: pageData.page,
    totalPages: cardsToLoadAndTotalPages.totalPages,
    filterUrl: pageData.filterUrl,
    deck: "",
    // -- cards
    cards: cardsToLoadAndTotalPages.cards,
    // cardModal
    allDeckName: deckNames,
  });
});

app.get("/decks", secureMiddleware, async (req, res) => {
  let decksForPage: Deck[] = await getDecksOfUser(res);
  // params from route
  // Pagination
  let pageSize: number = 9;
  let pageData: PageData = handlePageClickEvent(req.query);

  let totalPages = getTotalPages(decksForPage.length, pageSize);

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
    // -- pagination
    page: pageData.page,
    totalPages: totalPages,
    filterUrl: pageData.filterUrl,
    // -- cards
    decks: decksForPage,
  });
});

app.get("/noDeck", secureMiddleware, (req, res) => {
  res.render("noDeck", {
    // HEADER
    user: res.locals.user,
    // -- The names of the js files you want to load on the page.
    jsFiles: [],
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

  const selectedDeck: Deck | null = await decksCollection.findOne({
    deckName: req.params.deckName,
  });
  if (selectedDeck == null) {
    res.redirect("/404");
  }

  let amountMap = new Map<Card, number>();
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
  let pageData: PageData = handlePageClickEvent(req.query);
  let totalPages: number = getTotalPages(selectedDeck!.cards.length, pageSize);

  let amountLandcards: number | undefined = undefined;

  let avgManaCost: number | undefined = undefined;

  if (selectedDeck!.cards !== undefined) {
    avgManaCost = getAvgManaCost(selectedDeck!.cards);
    amountLandcards = selectedDeck!.cards.filter((card) =>
      card.types.includes("Land")
    ).length;
    amountMap = getCardWAmauntForPage(amountMap, pageData.page, pageSize);
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
    tip: allTips[getRandomNumber(0, allTips.length - 1)],
    amountLandcards: amountLandcards,
    avgManaCost: avgManaCost,
  });
});

app.post("/changeDeckName", async (req, res) => {
  const name = req.body.deckNameInput;
  const oldName = req.body.oldDeckName;

  const oldDeck = await decksCollection.findOne({ deckName: oldName });

  decksCollection.updateOne(
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
  // TODO: Redo this entire logic part
  // Find What Deck is selected
  console.log(selectedDeckQuery);

  selectedDeck = await decksCollection.findOne({
    deckName: `${selectedDeckQuery}`,
  });
  if (!selectedDeck) {
  }
  // if deck is not found,
  if (!selectedDeck) {
    if (!lastSelectedDeck) {
      selectedDeck = await decksCollection.findOne({});
      if (!selectedDeck) {
        return res.redirect("/noDecks");
      }
    } else {
      selectedDeck = lastSelectedDeck;
    }
  }
  if (!lastSelectedDeck) {
    lastSelectedDeck = selectedDeck;
  }
  let cardLookupInDeckCard: Card | undefined = undefined;
  let cardLookupInDeckCardChance: number | undefined = undefined;
  if (lastSelectedDeck) console.log(lastSelectedDeck.deckName);
  console.log(selectedDeck.deckName);

  // if deck is diffrent from last load
  if (lastSelectedDeck.deckName !== selectedDeck.deckName) {
    // set unpulledCards to cards of new deck
    unpulledCards = [...selectedDeck.cards];
    // Shuffle cards
    unpulledCards = [...shuffleCards(unpulledCards)];
    // clear pulledCards
    pulledCards = [];
  } else {
    if (unpulledCards.length === 0 && !whatToDo) {
      unpulledCards = [...shuffleCards(selectedDeck.cards)];
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
      unpulledCards = [...shuffleCards(unpulledCards)];
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
        cardLookupInDeckCardChance = getChance(
          unpulledCards,
          cardLookupInDeckCard
        ).chance;
      }
    }
  }
  // --filter logic
  let filterAndSortedCards: Card[] = pulledCards;

  if (pulledCards !== undefined) {
    filterAndSortedCards = [
      ...filterAndSortCards(
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

  let amountMap = new Map<Card, number>();

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
  let cardToShow: Card = pulledCards[0];
  // initialize nextCard
  let nextCard: Card | undefined = undefined;
  // if there is still a card in unpulled cards
  if (unpulledCards !== undefined) {
    // set nextCard to the last index of unpulledCards
    nextCard = unpulledCards[unpulledCards.length - 1];
  }

  // calculate the chanceData of the cardToSHow
  let chanceData = getChance(selectedDeck.cards, cardToShow);

  // save selectedDeck to be used next load of page
  lastSelectedDeck = selectedDeck;

  // Pagination
  let pageSize: number = 6;
  let pageData: PageData = handlePageClickEvent(req.query);
  let totalPages = getTotalPages(Array.from(amountMap.keys()).length, pageSize);

  amountMap = getCardWAmauntForPage(amountMap, pageData.page, pageSize);

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
    types: filterTypes,
    rarity: filterRarity,
    rarities: filterRarities,
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
    allDecks: await getDecksOfUser(res),
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

  const newUserDetails: User = {
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

  await usersCollection.updateOne(
    { _id: res.locals.user?._id },
    { $set: newUserDetails }
  );

  let user: User | undefined = await login(
    newUserDetails.email,
    req.body.passwordFormLabel
  );
  delete user!.password;
  req.session.user = user;
  res.redirect("/profile");
});

app.post("/delete", secureMiddleware, async (req, res) => {
  await usersCollection.deleteOne({ _id: res.locals.user?._id });
  res.redirect("/");
});

app.get("/editDeck/:deckName", secureMiddleware, async (req, res) => {
  const selectedDeck: Deck | null = await decksCollection.findOne({
    deckName: req.params.deckName,
  });
  if (!selectedDeck) {
    return res.redirect("/404");
  }

  let amountMap = new Map<Card, number>();
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
  let pageSize: number = 3;
  let pageData: PageData = handlePageClickEvent(req.query);
  let sorted: [Card, number][] = Array.from(amountMap).sort((a, b) => {
    return a[0].name.localeCompare(b[0].name);
  });
  let sortedAmountMap = new Map();

  sorted.forEach(([card, number]) => {
    sortedAmountMap.set(card, number);
  });
  let totalPages = getTotalPages(sortedAmountMap.size, pageSize);

  sortedAmountMap = getCardWAmauntForPage(
    sortedAmountMap,
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
    cards: sortedAmountMap,
    selectedDeck: selectedDeck,
  });
});

app.post("/removeCardFromDeck/:deckName/:cardName", async (req, res) => {
  const selectedDeck: Deck | null = await decksCollection.findOne({
    deckName: req.params.deckName,
  });
  if (!selectedDeck) {
    return res.redirect("/404");
  }

  let newCards = selectedDeck.cards;
  let removed = false;
  newCards = newCards.filter((card) => {
    if (card.name === req.params.cardName && !removed) {
      removed = true;
      return false;
    }
    return true;
  });

  await decksCollection.updateOne(
    {
      deckName: req.params.deckName,
    },
    {
      $set: { cards: newCards },
    }
  );
  res.redirect(`/editDeck/${req.params.deckName}`);
});

app.post("/addCardTooDeck/:deckName/:cardName", async (req, res) => {
  const selectedDeck: Deck | null = await decksCollection.findOne({
    deckName: req.params.deckName,
  });
  if (!selectedDeck) {
    return res.redirect("/404");
  }

  let cardTooAdd: Card | null = await cardsCollection.findOne({
    name: req.params.cardName,
  });
  if (!cardTooAdd) {
    return res.redirect("/404");
  }
  if (selectedDeck.cards.length < 60) {
    if (!cardTooAdd!.types.find((e) => e == "Land")) {
      if (
        selectedDeck.cards.filter((e) => e.name == cardTooAdd!.name).length < 4
      ) {
        await decksCollection.updateOne(
          { deckName: req.params.deckName },
          { $push: { cards: cardTooAdd! } }
        );
      } else {
        console.log("4 or more cards");
      }
    } else {
      console.log("Is land card");
      await decksCollection.updateOne(
        { deckName: req.params.deckName },
        { $push: { cards: cardTooAdd! } }
      );
    }
  } else {
    console.log("Deck full");

    // handle alert
  }

  res.redirect(`/editDeck/${req.params.deckName}`);
});

app.get("/makeDeck", secureMiddleware, (req, res) => {
  const deck: Deck = {
    userId: res.locals.user._id,
    deckName: req.body.deckName ? req.body.deckName : "",
    cards: [],
    deckImageUrl: req.body.hiddenImgUrl
      ? req.body.hiddenImgUrl
      : "/assets/images/decks/Deck1.jpg",
    favorited: false,
  };
  res.render("makeDeck", {
    // HEADER
    user: res.locals.user,
    // -- The names of the js files you want to load on the page.
    jsFiles: [],
    // -- The title of the page
    title: "makeDeck",
    // -- The Tab in the nav bar you want to have the orange color
    // -- (0 = home, 1 = decks nakijken, 2 = deck simuleren, all other values lead to no change in color)
    tabToColor: 1,
    // The page it should redirect to after feedback form is submitted
    toRedirectTo: "makeDeck",
    // makeDeck form
    deckName: deck.deckName,
    deckImage: deck.deckImageUrl,
  });
});

app.post("/editMakeDeck", secureMiddleware, (req, res) => {
  // Make a temp deck item
  const deck: Deck = {
    userId: res.locals.user._id,
    deckName: req.body.deckName ? req.body.deckName : "",
    cards: [],
    deckImageUrl: req.body.hiddenImgUrl
      ? req.body.hiddenImgUrl
      : "/assets/images/decks/Deck1.jpg",
    favorited: false,
  };
  // and render the makeDeck page
  res.render("makeDeck", {
    // HEADER
    user: res.locals.user,
    // -- The names of the js files you want to load on the page.
    jsFiles: ["changeDeckImage"],
    // -- The title of the page
    title: "makeDeck",
    // -- The Tab in the nav bar you want to have the orange color
    // -- (0 = home, 1 = decks nakijken, 2 = deck simuleren, all other values lead to no change in color)
    tabToColor: 1,
    // The page it should redirect to after feedback form is submitted
    toRedirectTo: "makeDeck",
    // makeDeck form
    deckName: deck.deckName,
    deckImage: deck.deckImageUrl
  });
});

app.post("/deleteDeck", secureMiddleware, async (req, res) => {
  let deckName = req.body.deckName;
  console.log(deckName);
  
  await decksCollection.deleteOne({ deckName : deckName });

  res.redirect("/decks");
});

// TODO: add app.post("/makeDeck", secureMiddleware, (req, res)=>{})

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

//catch all paths that dont already exist.
app.all("*", (req, res) => {
  // and redirect to 404 not found.
  res.redirect("/404")
})

app.listen(app.get("port"), async () => {
  console.clear();
  console.log("[ - SERVER - ]=> connecting to database");
  await connect();
  console.log("[ - SERVER - ]=> getting tips");
  await getTips();
  console.log("[ - SERVER - ]=> ! DONE !");
  console.log(
    "[ - SERVER - ]=> Listening at http://localhost:" + app.get("port")
  );
});
