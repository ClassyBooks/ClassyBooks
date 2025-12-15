import cookieParser from "cookie-parser";
import express from "express";
import { getUserByName } from "./db";
import bcrypt from "bcrypt";
const app = express();



const api = express.Router();

api.use(express.json())
    .use(cookieParser)


api.post("/teacherLogin", (req, res) => {
    const { firstName, lastName, password } = req.body

    const user = getUserByName(firstName, lastName)

    if (user == null) {
        res.status(401).send("Invalid credentials")
        return
    }
    const valid = bcrypt.compareSync(password, user.passwordHash)
    if (!valid) {
        res.status(401).send("Invalid credentials")
        return
    }
    const sessionid = login(user.id)

    res.cookie("userid", user.id, { httpOnly: true, secure: true })
        .cookie("sessionid", sessionid, { httpOnly: true, secure: true })
        .status(200)
        .send("login succesfull")

})

app.use(express.static(__dirname + "/../client/build/"))
    .use("/api", api)
