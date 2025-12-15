import { Sequelize, UUIDV4 } from "sequelize";
import fs from "fs";
import { v4 } from "uuid";


const settingsFile = fs.readFileSync("./server/settings.json", "utf-8");
const settings = { "url": process.env.DBURL || JSON.parse(settingsFile)["url"] };;


if (settings["url"] == null || settings["url"] == "") {
    throw new Error("No database URL provided!");
}

const sequelize = new Sequelize(settings["url"]);
async function request(
    query
) {
    const now = new Date();
    process.stdout.write(
        `${now.getDate()}-${now.getMonth() + 1}-${now.getFullYear()} ` +
        `${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}:${now.getMilliseconds()} | `
    );

    try {
        const [results, metadata] = await sequelize.query(query);
        return { results, metadata };
    } catch (err) {
        throw err;
    }
}

function generateSessionToken() {
  return crypto.randomBytes(32).toString("hex");
}

export async function getUserByName(firstName, lastName) {
    try {
        const resp = await request(`SELECT * FROM users WHERE firstName='${firstName}' AND lastName='${lastName}';`);
        return resp.results[0];
    }
    catch (err) {
        console.error("Database query error:", err);
        return null;
    }
}

export async function login(userid) {
    const sessionid = generateSessionToken();
    const expiresAt = new Date(Date.now() + 5 * 60 * 60 * 1000);

    try {
        await request(`UPDATE users SET sessionid = $1, sessionidexpire = $2 WHERE userid = $3`,
            [sessionid, expiresAt, userid]
        );

        return sessionid;
    } catch (err) {
        console.error("Database query error:", err);
        return null;
    }
}
