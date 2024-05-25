import express from "express"
import { secureMiddleware } from "../secureMiddleware";
import { Deck, PageData, Filter, filterTypes, filterRarities } from "../interfaces"
import { getDecksOfUser, handlePageClickEvent, getCardsForPage } from "../functions"


export default function homeRouter() {
    const router = express.Router();
    router.use((req, res, next) => {
        //res.locals.
        next();
    })
    router.post("/dontShowPopup", async (req, res) => {
        // set a cookie that lasts a week
        res.cookie("dontShowInfo", "true", {
            maxAge: 7 * 24 * 60 * 60 * 1000,
            httpOnly: true,
        });
        // redirect to home page after setting cookie or not
        res.redirect("/home");
    });
    router.get("/", secureMiddleware, async (req, res) => {
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
            jsFiles: ["infoPopUp", "manaCheckbox", "tooltips", "cardsModal", "closeOrSubmit"],
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
    return router;
}