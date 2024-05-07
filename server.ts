import express from "express";
import ejs from "ejs";
import * as i from "./interfaces";
import Magic = require("mtgsdk-ts");
import * as f from "./functions";
import * as db from "./db";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";

/*async function getAllCards(allCards: i.Card[]) {
    try {
        console.log("[ - SERVER - ]=> Getting all cards");
        const spinner = ['|', '/', '-', '\\'];
        let spinnerIndex = 0;

        const loadingbarLength: number = 25;
        const collectionLength: number = await db.cardsCollection.countDocuments()

        let totalTimeSpent = 0;
        let loadedElements = 0;



        function updateSpinner() {
            totalTimeSpent = (Date.now() - start) / 1000

            const remaining = collectionLength - allCards.length;
            const avgPerElem = totalTimeSpent / allCards.length;
            const estimatedTime = avgPerElem * remaining
            const percentile: number = (allCards.length / collectionLength)
            const filledBarlen = Math.round(percentile * loadingbarLength)
            const emptyBarlen = loadingbarLength - filledBarlen;
            process.stdout.clearLine(1)
            process.stdout.write(`\r[ - SERVER - ]=> Loading ${spinner[spinnerIndex]}\t [${'='.repeat(filledBarlen)}${' '.repeat(emptyBarlen)}]\tEst. ${(estimatedTime).toFixed(2)} seconds left `);
            spinnerIndex = (spinnerIndex + 1) % spinner.length;
        }
        const batchSize = 100;
        const cursor = db.cardsCollection.find({}).batchSize(batchSize);
        const start = Date.now();
        const spinnerInterval = setInterval(updateSpinner, 100);
        while (await cursor.hasNext()) {
            const batch = await cursor.next()
            allCards.push(batch!)
        }
        const end = Date.now();
        clearInterval(spinnerInterval);
        process.stdout.write('\r');
        console.log("[ - SERVER - ]=> Done getting cards");
        console.log(`[ - SERVER - ]=> size: ${Math.round(JSON.stringify(allCards).length / 1024 / 1024)} MB`);
        console.log(`[ - SERVER - ]=> Took ${((end - start) / 1000).toFixed(2)} seconds to load`);
    } catch (error) {
        console.error(error);
    }
}*/

async function getTempDecks() {
    allDecks = await db.decksCollection.find({}).toArray();
}

async function getTips() {
    allTips = await db.tipsCollection.find({}).toArray();
}

const app = express();

let allCardsLength: number = 0;

let allTips: i.Tip[] = [];

let allDecks: i.Deck[] = [];

app.set("port", process.env.PORT ?? 3000);
app.set("view engine", "ejs");

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

app.get("/", (req, res) => {
    res.render("landingspage");
});

app.post("/dontShowPopup", async (req, res) => {
    res.redirect("/home")
})

app.post("/feedback", (req, res) => {
    const feedbackType = req.body.feedbackType;
    const feedback = req.body.feedback;
    const redirectPage = req.body.toRedirectTo

    const feedBackItem: i.Feedback = {
        feedbackType: feedbackType,
        feedback: feedback,
    }

    db.feedbacksCollection.insertOne(feedBackItem)
    res.redirect(`/${redirectPage}`)
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


    // Pagination
    let pageSize: number = 12;
    let pageData: i.PageData = f.handlePageClickEvent(req.query, `${pageQueryParam}`, pageSize, allCardsLength);

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
        sortDirection: sortDirection
    }
    let cardsToLoad = await f.getCardsForPage(filterParam, pageData.page, pageSize);
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
        totalPages: pageData.totalPages,
        filterUrl: pageData.filterUrl,
        // -- cards
        cards: cardsToLoad,
    });
});

app.get("/decks", async (req, res) => {
    allDecks = [];
    await getTempDecks();
    // params from route
    let pageQueryParam = req.query.page;

    // Pagination
    let pageSize: number = 9;
    let pageData: i.PageData = f.handlePageClickEvent(
        req.query,
        `${pageQueryParam}`,
        pageSize,
        allDecks.length
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
        // The page it should redirect to after feedback form is submitted
        toRedirectTo: `decks`,
        // MAIN
        // MAIN
        // -- pagination
        page: pageData.page,
        totalPages: pageData.totalPages,
        filterUrl: pageData.filterUrl,
        // -- cards
        decks: decksForPage,
    });
});

app.get("/decks/:deckName", async (req, res) => {

    allDecks = [];
    await getTempDecks();

    // params from route
    let cardLookup = req.query.cardLookup;
    let sort = req.query.sort;
    let sortDirection = req.query.sortDirection;
    let pageQueryParam = req.query.page;

    let selectedDeck: i.Deck | undefined = allDecks.find((deck) => {
        return deck.deckName === req.params.deckName;
    });
    let amountMap = new Map<i.Card, number>();


    for (const card of selectedDeck!.cards) {
        const existingCard = Array.from(amountMap.keys()).find(c => c.name === card.name);
        if (existingCard) {
            amountMap.set(existingCard, amountMap.get(existingCard)! + 1);
        } else {
            amountMap.set(card, 1);
        }
    }
    // Pagination
    let pageSize: number = 6;
    let pageData: i.PageData = f.handlePageClickEvent(
        req.query,
        `${pageQueryParam}`,
        pageSize,
        Array.from(amountMap.keys()).length
    );

    let cardsToLoad: i.Card[] | undefined = undefined;

    let amountLandcards: number | undefined = undefined;

    let avgManaCost: number | undefined = undefined;

    if (selectedDeck?.cards !== undefined) {
        avgManaCost = f.getAvgManaCost(selectedDeck?.cards)
        amountLandcards = selectedDeck.cards.filter((card) =>
            card.types.includes("Land")
        ).length;

        amountMap = f.getCardWAmauntForPage(
            amountMap,
            pageData.page,
            pageSize
        );
    } else {
        console.log("[ - SERVER - ]=> selected deck cards = undefined");
    }



    for (const [card, amount] of amountMap) {
        console.log(`${card.name}: ${amount}`);
    }


    res.render("deckdetails", {
        // HEADER
        user: i.tempUser,
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
        totalPages: pageData.totalPages,
        filterUrl: pageData.filterUrl,
        // -- cards
        cards: amountMap,
        selectedDeck: selectedDeck,
        tip: allTips[f.getRandomNumber(0, allTips.length - 1)],
        amountLandcards: amountLandcards,
        avgManaCost: avgManaCost
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

let lastSelectedDeck: i.Deck;
let selectedDeck: i.Deck | undefined = undefined;
let unpulledCards: i.Card[] | undefined = [];
let pulledCards: i.Card[];

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
    let cardLookupInDeckInput = req.query.cardLookupInDeckInput;
    // -- pagination
    let pageQueryParam = req.query.page;
    // -- other
    let whatToDo = req.query.action;
    let selectedDeckQuery = req.query.decks;
    // Logic
    // Find What Deck is selected
    selectedDeck = allDecks.find((e) => e.deckName == selectedDeckQuery);

    // if deck is not found,
    // set to deck nr. 1
    // else set to lastDeck
    if (selectedDeck === undefined) {
        if (lastSelectedDeck == undefined) {
            selectedDeck = allDecks[0];
        } else {
            selectedDeck = lastSelectedDeck;
        }
    }

    let cardLookupInDeckCard: i.Card | undefined = undefined;
    let cardLookupInDeckCardChance: number | undefined = undefined;
    // if deck is diffrent from last load
    if (lastSelectedDeck !== selectedDeck) {
        // set unpulledCards to cards of new deck
        unpulledCards = [...selectedDeck.cards];
        // Shuffle cards
        unpulledCards = [...f.shuffleCards(unpulledCards)];
        // clear pulledCards
        pulledCards = [];
    } else {
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
            cardLookupInDeckCard = selectedDeck.cards.find(e => e.name.toLowerCase().includes(`${cardLookupInDeck}`.toLowerCase()))
            // if card is found and there are cards in unpulledCards
            if (cardLookupInDeckCard != undefined && unpulledCards != undefined) {
                // calculate the chance u have to pull that card from the unpulledCards
                cardLookupInDeckCardChance = f.getChance(unpulledCards, cardLookupInDeckCard).chance
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
        const existingCard = Array.from(amountMap.keys()).find(c => c.name === card.name);
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
    let pageData: i.PageData = f.handlePageClickEvent(
        req.query,
        `${pageQueryParam}`,
        pageSize,
        Array.from(amountMap.keys()).length
    );

    amountMap = f.getCardWAmauntForPage(
        amountMap,
        pageData.page,
        pageSize
    );

    res.render("drawtest", {
        // HEADER
        user: i.tempUser,
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
        totalPages: pageData.totalPages,
        filterUrl: pageData.filterUrl,
        // -- cardlookupInDeck
        cardLookupInDeck: cardLookupInDeck,
        cardLookupInDeckInput: cardLookupInDeckInput,
        cardLookupInDeckCard: cardLookupInDeckCard,
        cardLookupInDeckCardChance: cardLookupInDeckCardChance,
        // -- other
        allDecks: allDecks,
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

app.get("/profile", (req, res) => {
    res.render("profile");
});

app.get("/editDeck/:deckName", async (req, res) => {
    allDecks = [];
    await getTempDecks();
    let selectedDeck: i.Deck | undefined = allDecks.find((deck) => {
        return deck.deckName === req.params.deckName;
    });

    // params from route
    let pageQueryParam = req.query.page;

    // Pagination
    let pageSize: number = 6;
    let pageData: i.PageData | undefined = undefined;
    if (selectedDeck !== undefined) {
        pageData = f.handlePageClickEvent(
            req.query,
            `${pageQueryParam}`,
            pageSize,
            selectedDeck?.cards.length
        );
    }

    let cardsToLoad = undefined;

    if (selectedDeck?.cards !== undefined && pageData !== undefined) {
        cardsToLoad = f.getCardsForPage(
            selectedDeck?.cards,
            pageData.page,
            pageSize / 2
        );
    } else {
        console.log("[ - SERVER - ]=> selected deck cards = undefined");
    }

    res.render("editDeck", {
        // HEADER
        user: i.tempUser,
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
        totalPages: pageData?.totalPages,
        filterUrl: pageData?.filterUrl,
        // -- cards
        cards: cardsToLoad,
        selectedDeck: selectedDeck,
    });
});

app.listen(app.get("port"), async () => {
    console.clear();
    console.log("[ - SERVER - ]=> connecting to database");

    await db.connect()

    console.log("[ - SERVER - ]=> Counting total cards");
    allCardsLength = await db.cardsCollection.countDocuments();
    // console.log("[ - SERVER - ]=> getting temp decks");
    // await getTempDecks();
    console.log("[ - SERVER - ]=> getting tips");
    await getTips();
    console.log("[ - SERVER - ]=> ! DONE !");
    console.log(
        "[ - SERVER - ]=> Listening at http://localhost:" + app.get("port")
    );
});
