import express from "express";
import ejs from "ejs";
import * as i from "./interfaces";
import Magic = require("mtgsdk-ts");
import * as f from "./functions"

const app = express();

const allCards: Magic.Card[] = [];

app.set("port", 3000);
app.set("view engine", "ejs");

app.use(express.static("public"));

app.get("/", (req, res) => {
    res.render("landingspage")
})
app.get("/home", async (req, res) => {
    let cardLookup = `${req.query.cardLookup}`
    let type = req.query.type
    let whiteManaChecked = req.query.whiteManaChecked
    let blueManaChecked = req.query.blueManaChecked
    let blackManaChecked = req.query.blackManaChecked
    let greenManaChecked = req.query.greenManaChecked
    let redManaChecked = req.query.redManaChecked
    let colorlessManaChecked = req.query.colorlessManaChecked
    let sort = req.query.sort
    let pageQueryParam = req.query.page;
    console.log(cardLookup);

    let filteredCards: Magic.Card[] = [...allCards];
    if (cardLookup != "undefined") {
        console.log(allCards[0].name
        );
        console.log(allCards[0].name.toLowerCase().includes(cardLookup.toLowerCase()) ? "yup" : "nope");

        filteredCards = allCards.filter(e => `${e.name}${e.setName}${e.id}`.toLowerCase().includes(cardLookup.toLowerCase()))
    }
    let filterUrl: string = "";
    let page: number = 1;
    if (typeof pageQueryParam === 'string') {
        page = parseInt(pageQueryParam) || 1
    }
    let pageSize: number = 12;
    let totalPages = f.getTotalPages(filteredCards, pageSize);
    //let cardsInPage: Magic.Card[] = await Magic.Cards.where({ rarity: "Mythic" })
    let cardsToLoad = f.getCardsForPage(filteredCards, page, pageSize)
    // console.log(cardsInPage[3]);
    for (const [key, value] of Object.entries(req.query)) {
        if (key !== "page" && value) {
            filterUrl += `${key}=${value}&`;
        }
    }
    // Remove trailing '&' if present
    filterUrl = filterUrl.replace(/&$/, '');
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
        cardLookup: req.query.cardLookup,
        type: req.query.type,
        whiteManaChecked: whiteManaChecked == undefined ? "true" : whiteManaChecked,
        blueManaChecked: blueManaChecked == undefined ? "true" : blueManaChecked,
        blackManaChecked: blackManaChecked == undefined ? "true" : blackManaChecked,
        greenManaChecked: greenManaChecked == undefined ? "true" : greenManaChecked,
        redManaChecked: redManaChecked == undefined ? "true" : redManaChecked,
        colorlessManaChecked: colorlessManaChecked == undefined ? "true" : colorlessManaChecked,
        sort: req.query.sort,
        // -- pagination
        page: page,
        totalPages: totalPages,
        filterUrl: filterUrl,
        // -- cards
        cards: cardsToLoad
    })
})
app.get("/decks", (req, res) => {
    res.render("decks")
})
app.get("/deckdetails", (req, res) => {
    res.render("deckdetails")
})
app.get("/drawtest", (req, res) => {
    res.render("drawtest")
})
app.get("/profile", (req, res) => {
    res.render("profile")
})

app.listen(app.get("port"), async () => {
    console.log("[ - SERVER - ] Listening at http://localhost:" + app.get("port"));

    Magic.Cards.all({ page: 1, pageSize: 100 }).on("data", card => {
        if (card.imageUrl !== undefined) {
            allCards.push(card)
        }
    }).on("end", () => console.log("[ - SERVER - ] All cards gotten")).on("error", e => console.log("ERROR: " + e))
})