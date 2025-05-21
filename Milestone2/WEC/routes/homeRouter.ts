import express from "express";
import { secureMiddleware } from "../secureMiddleware";

export function homeRouter() {
    const router = express.Router();

    router.get("/", secureMiddleware, async (req, res) => {
        res.render("index", { user: req.session.user });
    });

    return router;
}
