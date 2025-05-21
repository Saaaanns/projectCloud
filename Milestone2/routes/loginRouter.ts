import express from "express";
import { login } from "../database";
import { secureMiddleware } from "../secureMiddleware";

export function loginRouter() {
    const router = express.Router();

    router.get("/login", async (req, res) => {
        res.render("login");
    });

    router.post("/login", async (req, res) => {
        const email: string = req.body.email;
        const password: string = req.body.password;
        try {
            let user = await login(email, password);
            delete user.password;
            req.session.user = user;
            req.session.message = { type: "success", message: "Login successful" };
            res.redirect("/");
        } catch (e: any) {
            req.session.message = { type: "error", message: e.message };
            res.redirect("/login");
        }
    });

    router.post("/logout", secureMiddleware, async (req, res) => {
        req.session.destroy(() => {
            res.redirect("/login");
        });
    });

    return router;
}
