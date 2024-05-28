import express from "express";
import { secureMiddleware } from "../secureMiddleware";
import { ObjectId } from "mongodb";
import { feedbacksCollection } from "../db";
import { Feedback } from "../interfaces";
export default function feedbackRouter() {
    const router = express.Router();
    router.use(secureMiddleware)
    // restricted access to anyone except admin role
    router.use((req, res, next) => {
        // if non admin goes to this route redirect to /home
        if (res.locals.user.role !== "ADMIN") {
            return res.redirect("/home")
        }
        next();
    })
    router.get("/", async (req, res) => {
        res.render("feedback", {
            // HEADER
            user: res.locals.user,
            // -- The names of the js files you want to load on the page.
            jsFiles: [],
            // -- The title of the page
            title: "feedback",
            // -- The Tab in the nav bar you want to have the orange color
            // -- (0 = home, 1 = decks nakijken, 2 = deck simuleren, all other values lead to no change in color)
            tabToColor: 3,
            // The page it should redirect to after feedback form is submitted
            toRedirectTo: "feedback",
            allFeedback: await feedbacksCollection.find().toArray(),
        })
    })
    router.post("/", async (req, res) => {
        // params from route
        const feedbackType = req.body.feedbackType;
        const feedback = req.body.feedback;
        const redirectPage = req.body.toRedirectTo;

        // make a feedback object
        const feedBackItem: Feedback = {
            user: res.locals.user,
            feedbackType: feedbackType,
            feedback: feedback,
            date: new Date()
        };

        // insert it in database
        await feedbacksCollection.insertOne(feedBackItem);
        // redirect to specified page
        res.redirect(`/${redirectPage}`);
    });
    router.post("/delete/:feedbackId", async (req, res) => {
        const feedbackId: ObjectId = new ObjectId(req.params.feedbackId);
        await feedbacksCollection.deleteOne({ _id: feedbackId })
        res.redirect("/feedback")
    })
    return router;
}