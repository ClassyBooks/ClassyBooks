//-------------------------------------------------------------------------------------IMPORTS-------//
require('dotenv').config()
const express = require("express");
const fs = require("fs");
const PORT = process.env.PORT || 8080;
const app = express();
var crypto = require("crypto");
const { Sequelize } = require("sequelize-cockroachdb");
const { faker } = require('@faker-js/faker/locale/nl_BE');
const { v4: uuidv4 } = require('uuid');
app.use(express.json());
const multer = require(`multer`);
const path = require('path');


const leesniveaus = ['AVI-START', 'AVI-M3', 'AVI-E3', 'AVI-M4', 'AVI-E4', 'AVI-M5', 'AVI-E5', 'AVI-M6', 'AVI-E6', 'AVI-M7', 'AVI-E7', 'AVI-PLUS']
const classes = ["1A", "1B", "2A", "2B", "3A", "3B", "4A", "4B", "5A", "5B", "6A", "6B"]
//-----------------------------------------------------------------------------------REQUESTS-------//
app.use(express.static(__dirname + "/../client/build/"));

//-------------------------------------------------------------------------------API-REQUESTS-------//
app.post('/api/teacherLendForStudent', async (req, res) => { // body = {userid, pupilid, materialid, sessionid}
  if (checkRequest(req)) {
    const session = await getSession(req["body"]["sessionid"])
    if (session !== null) {
      const user = await request(`SELECT * FROM USERS WHERE USERID='${req["body"]["userid"]}'`)
      if (hasData(user)) {
        const sessionPriv = parseInt(session["privilege"])
        if (sessionPriv >= 1) {
          const pupil = await request(`SELECT * FROM USERS WHERE USERID='${req["body"]["pupilid"]}'`)
          if (hasData(pupil)) {
            const lend = await lendMaterial(req["body"]["pupilid"], req['body']["materialid"])
            if (lend[0]) {
              res.setHeader('Content-Type', 'text/plain')
              res.status(200).send(lend[1])
            } else { res.setHeader('Content-Type', 'text/plain'); res.status(400).send("Invalid request") }
          } else res.status(400).send('Invalid pupil')
        } else res.status(500).send()
      } else res.status(400).send('Invalid teacher')
    } else res.status(400).send("Invalid teacher")
  } else res.status(400).send('Invalid request')
})
app.get('/api/dbRework', async (req, res) => {
  if (checkRequest(req)) {
    const resp = reworkDb()
    res.status(200).send("Rework finished: " + resp)
  }
})
app.get("/api/getClasses", async (req, res) => {
  if (checkRequest(req)) {
    let classes = await classList()
    let resp = []
    for (let e of classes[0]) {
      resp.push(e.class)
    }
    res.status(200).send(resp)
  } else {
    res.status(400).send("Invalid request")
  }
})

app.get("/api/getPupilsReadinglvls", async (req, res) => {
  if (checkRequest(req)) {
    let readinglvls = await readingLvlListPupils()

    let resp = []
    for (let e of readinglvls) {
      resp.push(e.readinglevel)
    }
    res.status(200).send(resp)
  } else {
    res.status(400).send("Invalid request")
  }
})

app.get("/api/getMaterialssReadinglvls", async (req, res) => {
  if (checkRequest(req)) {
    let readinglvls = await readingLvlListMaterials()
    //res.status(200).send(await readinglvls)
    let resp = []
    if (readinglvls.length == 0) {
      for (let e of readinglvls) {
        resp.push(e.readinglevel)
      }
      res.status(200).send(resp)
    } else {
      res.status(400).send("Invalid request")
    }
  } else {
    res.status(400).send("Invalid request")
  }
})

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, "./server/uploads");
  },
  filename(req, file, cb) {
    const imgid = "img-" + uuidv4();
    const extension = file.originalname.split(".").pop().toLowerCase();
    cb(null, `${imgid}.${extension}`);
  }
});

function fileFilter(req, file, cb) {
  const allowed = ["png", "jpg", "jpeg", "gif", "bmp", "tif"];
  const ext = file.originalname.split(".").pop().toLowerCase();

  if (!allowed.includes(ext)) {
    return cb(new Error("Only image files are allowed"), false);
  }

  cb(null, true);
}

const upload = multer({
  storage,
  fileFilter
});


app.post("/api/uploadimg", upload.single('uploaded_file'), (req, res) => {
  try {
    console.log(req.file)
    if (!req.file) {
      res.status(400).send("No file uploaded");
    }
    else if (req.file["filename"] == "badfile") {
      fs.unlink("./uploads/badfile", (err) => { console.log(err) })
      res.status(400).send("Invalid file, use an image format")
    } else {
      res.status(200).send("/api/getimg/" + req.file.filename);
    }
  } catch (error) {
    res.status(500).send("Internal server error");
  }
});

app.get("/api/getimg/:imgid", (req, res) => {
  if (checkRequest(req)) {
    res.status(200).sendFile(__dirname + "/uploads/" + req.params.imgid)
    // if (fs.existsSync("./uploads/" + req.params.imgid)) {
    //     res.status(200).sendFile(__dirname + "/uploads/" + req.params.imgid)
    // } else { res.status(404).send("File not found: "+__dirname + "/uploads/" + req.params.imgid)
    //   console.log(fs.existsSync("./uploads/" + req.params.imgid))
    //  }
  }
  else { res.status(400).send("Invalid request") }
})

app.post('/api/getBibInfo', async (req, res) => {

  try {
    const apiUrl = 'https://bibliotheek.be/catalogus?q=isbn%3A%22' + req['body']['isbn'] + '%22';
    const response = await fetch(apiUrl);
    const data = await response.text();
    res.set('Content-Type', 'text/html'); // Ensure proper content-type if HTML
    res.send(data);
  } catch (error) {
    res.status(500).send({ error: 'Error fetching data' });
  }
});
app.get('/api/getTitelbank/:isbn', async (req, res) => {

  try {
    const apiUrl = 'http://classybooks.woutvdb.uk/api/getIsbn.php?isbn=' + req['params']['isbn'];
    console.log(apiUrl)
    const response = await fetch(apiUrl);
    const data = await response.json()
    console.log(data)
    res.send(data);
  } catch (error) {
    res.status(500).send({ error: 'Error fetching data: ' + error });
  }
});
app.post("/api/loginTeacher", (req, res) => {
  (async () => {
    try {
      if (checkRequest(req)) {
        // Try login
        user = await login(req["body"]["name"], req["body"]["surname"], req["body"]["sha256"], req["body"]["md5"])
        sessionid = user[0]
        userid = user[1]
        privilege = user[2]
        if (sessionid == "Invalid credentials") { res.status(400).send(sessionid) } //Invalid credentials
        else { res.status(200).send({ "sessionid": sessionid, "userid": userid, "privilege": privilege }) } //Successfully logged in
      }
      else { res.status(400).send("Invalid credentials") } // Invalid credentials
    }
    catch (err) {
      res.status(500).send("Server error: " + err) // Server error
    }
  })();
})
app.post("/api/loginPupil", (req, res) => {
  (async () => {
    try {
      if (checkRequest(req)) {
        // Get user from server based on class and number
        let userReq = await request(`SELECT FIRSTNAME, LASTNAME FROM USERS WHERE CLASS='${req["body"]["clss"]}' AND CLASSNUM=${req["body"]["number"]};`)
        // Try login
        if (hasData(userReq)) {
          user = await login(userReq[0][0]["firstname"], userReq[0][0]["lastname"], req["body"]["sha256"], req["body"]["md5"])
          sessionid = user[0]
          userid = user[1]
          privilege = user[2]
          if (sessionid == "Invalid credentials") { res.status(400).send(sessionid) } // Invalid credentials
          else { res.status(200).send({ "sessionid": sessionid, "userid": userid, "privilege": privilege }) }
        }
        else {
          res.status(400).send("Invalid credentials") // Invalid credentials

        }
      }
      else { res.status(400).send("Invalid credentials") } // Invalid credentials
    }
    catch (err) {
      res.status(500).send("Server error: " + err) // Server error
    }
  })();
})
app.post("/api/getUser", (req, res) => {
  (async () => {
    if (checkRequest(req)) {
      // Get admin's session and requested user's details
      session = await getSession(req["body"]["sessionid"])
      if (session != null) {
        user = await request(`SELECT * FROM USERS WHERE USERID='${req["body"]["userid"]}'`)
        // If requested user is real
        if (hasData(user)) {
          sessionPrivilege = parseInt(session["privilege"])
          if (sessionPrivilege >= 1) { res.status(200).send(stripInfo(user[0], ["md5", "sha256", "sessionid", "sessionidexpire"])) } // If admin has privilege, send user details
          else { res.status(200).send(stripInfo(user[0], ["privilege", "sha256", "md5", "sessionid", "sessionidexpire", "history"])) } //If admin is not privileged, send user other user details
        }
        else res.status(400).send("Invalid user") // Requested user is not real
      }
      else res.status(400).send("Invalid user") // Requested user is not real
    }
    else res.status(400).send("Invalid request") // Request is invalid
  })();
})
app.post("/api/createUser", (req, res) => {
  (async () => {
    try {
      if (checkRequest(req)) {
        session = await getSession(req["body"]["sessionid"]) // Get admin session
        if (session['privilege'] == 2) {
          // Create admin (lvl 1)
          if (parseInt(req["body"]["privilege"]) >= 1) {
            await addTeacherWithHash(req["body"]["name"], req["body"]["surname"], req["body"]["privilege"], req["body"]["sha256"], req["body"]["md5"], [])
            res.setHeader('content-type', 'text/plain'); res.status(200).send("Successfully added user")
          }
          // Create pupil
          else {
            await addPupilWithHash(req["body"]["name"], req["body"]["surname"], req["body"]["classNum"], req["body"]["cls"], 0, req["body"]["sha256"], req["body"]["md5"], [], [], req["body"]["readinglevel"])
            res.setHeader('content-type', 'text/plain'); res.status(200).send("Successfully added user")
          }

        }
        else { res.status(400).send("Invalid session") } // Admin is not privileged to create user
      }
      else { res.status(400).send("Invalid request") } // Request is invalid
    }
    catch (err) {
      res.status(500).send("Server error: " + err) // Internal error
    }
  })();
})
app.post("/api/getMaterial", (req, res) => {
  (async () => {
    try {
      if (checkRequest(req)) {
        // Get user session
        session = await getSession(req["body"]["sessionid"])

        // Get material details
        material = await request(`SELECT * FROM MATERIALS WHERE MATERIALID='${req["body"]["materialid"]}'`)

        // If material is real
        if (hasData(material)) {
          if (parseInt(session['privilege']) >= 1) { res.status(200).send(material[0]) } // If user is privileged, send material details
          else { res.status(200).send(stripInfo(material[0], ["lendoutto", "returndate", "lendcount", "startdate"])) } // If user isn't privileged, strip info
        }
        else res.status(400).send("Invalid material") // Invalid material
      }
    }
    catch (err) {
      res.status(500).send("Server error: " + err) // Internal error
    }
  })();
})
app.post("/api/createMaterial", (req, res) => {
  (async () => {
    try {
      if (checkRequest(req)) {
        // Get user session
        session = await getSession(req["body"]["sessionid"])
        // If user is privileged (lvl 2), create material
        if (session['privilege'] == '2') {
          await addMaterial(req["body"]["title"], req["body"]["place"], JSON.stringify(req["body"]["description"]), req["body"]["available"], req["body"]["isbn"])
          res.setHeader('Content-Type', 'text/plain'); res.status(200).send("Successfully added material")
        }
        else { res.status(400).send("Invalid session") } // User is not privileged
      }
      else { res.status(400).send("Invalid request") } // Invalid request
    }
    catch (err) {
      res.status(500).send("Server error: " + err) // Internal error
    }
  })();
})
app.post("/api/lendMaterial", (req, res) => {
  (async () => {
    try {
      if (checkRequest(req)) {
        // Call lend function
        let lend = await lendMaterial(req["body"]["userid"], req["body"]["materialid"])

        // If lend is valid, give returndate
        if (lend[0]) {
          res.setHeader('Content-Type', 'text/plain')
          res.status(200).send(lend[1])
        }
        else { res.setHeader('Content-Type', 'text/plain'); res.status(400).send("Invalid request") } // Lend is invalid
      }
      else { res.setHeader('Content-Type', 'text/plain'); res.status(400).send("Invalid request") } // Request is invalid
    }
    catch (err) {
      res.status(500).send("Server error: " + err) // Internal error
    }
  })();
})
app.post("/api/returnMaterial", (req, res) => {
  (async () => {
    try {
      if (checkRequest(req)) {
        let ret = await returnMaterial(req["body"]["materialid"], req["body"]["score"], req["body"]["fullyread"])

        // Is return valid
        if (ret) {
          // Successful return
          res.setHeader('Content-Type', 'text/plain')
          res.status(200).send("Successfully returned material")
        }
        else { res.setHeader('Content-Type', 'text/plain'); res.status(400).send("Invalid request") } // Invalid return
      }
      else { res.setHeader('Content-Type', 'text/plain'); res.status(400).send("Invalid request") } // Invalid request
    }
    catch (err) {
      res.status(500).send("Server error: " + err) // Internal error
    }
  })();
})
app.post("/api/allMaterials", (req, res) => {
  (async () => {
    try {
      // Send all materials (not all details)
      materials = await request("SELECT MATERIALID, TITLE, PLACE, DESCR, AVGSCORE, AVAILABLE, LENDCOUNT, RETURNDATE, ISBN FROM MATERIALS")
      res.setHeader("Content-Type", "application/json")
      res.status(200).send(materials[0])
    }
    catch (err) {
      res.status(500).send("Server error: " + err) // Internal error
    }
  })();
})
app.post("/api/allUsers", (req, res) => {
  (async () => {
    try {
      if (checkRequest(req)) {
        sess = await getSession(req["body"]["sessionId"])
        if (sess != null) {
          // If admin is privileged
          if (parseInt(sess["privilege"]) >= 1) {
            users = await request("SELECT USERID, FIRSTNAME, LASTNAME, MATERIALS, CLASS, CLASSNUM, PRIVILEGE, READINGLEVEL, HISTORY FROM USERS")
            res.setHeader("Content-Type", "application/json")
            res.status(200).send(users[0])
          } else { res.status(400).send("Invalid request") } // Admin is not privileged
        } else {
          res.status(400).send("Invalid request")
        }
      }
      else { res.status(400).send("Invalid request") } // Invalid request
    }
    catch (err) {
      res.status(500).send("Server error: " + err) // Internal error
    }
  })();
})
app.post("/api/removeUser", (req, res) => {
  (async () => {
    try {
      if (checkRequest(req)) {
        sess = await getSession(req["body"]["sessionId"])
        // If admin is privileged (lvl 2)
        if (parseInt(sess["privilege"]) == 2) {
          await request(`DELETE FROM USERS WHERE USERID='${req["body"]["userId"]}'`)
          res.status(200).send("Successfully removed user")
          //Successful removal
        }
        else {
          res.status(403).send("Invalid request") // Unprivileged
        }
      }
      else { res.status(400).send("Invalid request") } // Invalid request
    }
    catch (err) {
      res.status(500).send("Server error: " + err) // Internal error
    }
  })();
})
app.post("/api/removeMaterial", (req, res) => {
  (async () => {
    try {
      if (checkRequest(req)) {
        sess = await getSession(req["body"]["sessionId"])
        // If admin is privileged (lvl 2)
        if (parseInt(sess["privilege"]) == 2) {
          await request(`DELETE FROM MATERIALS WHERE MATERIALID='${req["body"]["materialid"]}'`)
          res.status(200).send("Successfully removed material")
          //Successful removal
        }
        else {
          res.status(403).send("Invalid request") // Unprivileged
        }
      }
      else { res.status(400).send("Invalid request") } // Invalid request
    }
    catch (err) {
      res.status(500).send("Server error: " + err) // Internal error
    }
  })();
})
app.post("/api/changePassword", (req, res) => {
  (async () => {
    try {
      if (checkRequest(req)) {
        sess = await getSession(req["body"]["sessionId"])

        // If user is lvl 0 or 1, change own password
        if (parseInt(sess["privilege"]) <= 1) {
          // If current password is correct, change it to new
          if ((toString(sess["sha256"]) == toString(req["body"]["sha256"])) && (toString(sess["md5"]) == toString(req["body"]["md5"]))) {
            await request(`UPDATE USERS SET SHA256='${req["body"]["newSha256"]}' WHERE USERID='${sess["userid"]}';`)
            await request(`UPDATE USERS SET MD5='${req["body"]["newMd5"]}' WHERE USERID='${sess["userid"]}';`)
            res.status(200).send("Changed password")
          }
          else { res.status(400).send("Invalid credentials") } // Invalid credentials
        }
        // If user is lvl 2, change other user's password
        else if (parseInt(sess["privilege"]) == 2) {
          await request(`UPDATE USERS SET SHA256='${req["body"]["newSha256"]}' WHERE USERID='${req["body"]["userid"]}';`)
          await request(`UPDATE USERS SET MD5='${req["body"]["newMd5"]}' WHERE USERID='${req["body"]["userid"]}';`)
          res.status(200).send("Changed password")
        }
      }
      else { res.status(400).send("Invalid request") } // Invalid request
    }
    catch (err) {
      res.status(400).send("Invalid request") // Internal error
    }
  })();
})
app.post("/api/logout", (req, res) => {
  (async () => {
    try {
      if (checkRequest(res)) {
        if (logout(req["body"]["sessionId"])) {
          res.status(200).send("Succesfully logged out")
        }
        else { res.status(400).send("Invalid request") }
      }
      else { res.status(400).send("Invalid request") }
    }
    catch (err) {
      res.status(500).send("Server error: " + err) // Internal error
    }
  })();

})
app.post("/api/changeUser", (req, res) => {
  (async () => {
    try {
      if (checkRequest(req)) {
        sess = await getSession(req["body"]["sessionid"])
        let i = 0
        if (sess != null) {
          while (i < req["body"]["keys"].length) {
            succ = await changeUser(req["body"]["keys"][i], req["body"]["values"][i], req["body"]["userid"], sess["privilege"])
            i += 1
          }
        }
        if (succ) { res.status(200).send("Statement executed correctly") }
        else { res.status(400).send("Invalid request") }

      }
      else { res.status(400).send("Invalid request") }
    } catch (err) {
      res.status(500).send("Server error: " + err)
    }
  })();
})

app.post("/api/changeMaterial", (req, res) => {
  (async () => {
    try {
      if (checkRequest(req)) {
        sess = await getSession(req["body"]["sessionid"])
        let i = 0
        if (sess != null) {

          while (i < req["body"]["keys"].length) {
            succ = await changeMaterial(req["body"]["keys"][i], req["body"]["values"][i], req["body"]["materialid"], sess["privilege"])
            i += 1

          }
        }
        if (succ) { res.status(200).send("Statement executed correctly") }
        else { res.status(400).send("Invalid request" + succ) }

      }
      else { res.status(400).send("Invalid request") }
    } catch (err) {
      res.status(500).send("Server error: " + err)
    }
  })();
})

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../client/build/index.html"));
});

app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});
//------------------------------------------------------------------------------------SQL-----------//
//Initialise SQL-Client
settings = { "url": process.env.DBURL };
if (settings["url"] == null || settings["url"] == "") {
  settingsFile = fs.readFileSync("./server/settings.json")
  settings = JSON.parse(settingsFile);
}

const sequelize = new Sequelize(settings["url"]);
async function request(request) {
  try {
    const now = new Date
    process.stdout.write(`${now.getDate()}-${now.getMonth() + 1}-${now.getFullYear()} ` +
      `${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}:${now.getMilliseconds()} | `)
    const [results, metadata] = await sequelize.query(request);
    return [results, metadata];
  } catch (err) {
    return err;
  }
}

//-------------------------------------------------------------------------------------FUNCTIONS----//
function generateHashes(name, surname, password) {
  // Sha256 = sha256(name+surname+password)
  var sha256 = crypto
    .createHash("sha256")
    .update(name + surname + password)
    .digest("hex");

  // Md5 = md5(name+surname+password+sha256)
  var md5 = crypto
    .createHash("md5")
    .update(name + surname + password + sha256.toString())
    .digest("hex");
  return [sha256.toString(), md5.toString()];
}
function checkString(value) {
  //Returns false when string is not good
  var sql_meta = new RegExp('(%27)|(\')|(--)|(%23)|(#)', 'i');
  if (sql_meta.test(value)) {
    return false;
  }

  var sql_meta2 = new RegExp('((%3D)|(=))[^\n]*((%27)|(\')|(--)|(%3B)|(;))', 'i');
  if (sql_meta2.test(value)) {
    return false;
  }

  var sql_typical = new RegExp('w*((%27)|(\'))((%6F)|o|(%4F))((%72)|r|(%52))', 'i');
  if (sql_typical.test(value)) {
    return false;
  }

  var sql_union = new RegExp('((%27)|(\'))union', 'i');
  if (sql_union.test(value)) {
    return false;
  }
  return true
}
function checkRequest(req) {
  // Returns true if request is good
  let stringGood = true
  Object.keys(req["body"]).forEach((key) => {
    stringGood = checkString(req["body"][key]) && stringGood // If either current check or previous check failed, stringGood turns false
  })
  return stringGood
}
function stripInfo(dbres, keys) {
  // Remove selected keys from a database call
  d = dbres[0]
  for (let i = 0; i < keys.length; i++) {
    d[keys[i]] = null
  }
  return d
}
Date.prototype.addHours = function (h) {
  this.setTime(this.getTime() + (h * 60 * 60 * 1000));
  return this;
}
function hasData(dbres) {
  // Checks whether a database response has data
  try {
    return dbres[1]["rowCount"] > 0
  }
  catch {
    return false
  }
}
function requestSucceeded(res) {
  try {
    return parseInt(res[1]["rowCount"]) > 0
  }
  catch {
    return false
  }
}
function dateInPast(firstDate, secondDate) {
  return firstDate.setHours(0, 0, 0, 0) <= secondDate.setHours(0, 0, 0, 0)
}
function checkSessionValidity(user) {
  if (user[0][0]["sessionid"] != null) {
    return getSession(user[0][0]["sessionid"]) != null
  }
  else return false

}
function parseISOString(s) {
  var b = s.split(/\D+/);
  return new Date(Date.UTC(b[0], --b[1], b[2], b[3], b[4], b[5], b[6]));
}
//----------------------------------------------------------------------------DATABASE-FUNCTIONS-FOR-TESTING----//

async function addTeacherWithPass(name, surname, password, privilege, materials) {
  let hashes = generateHashes(name, surname, password);
  await addTeacherWithHash(name, surname, privilege, hashes[0], hashes[1], materials)
}
async function addPupilWithPass(name, surname, password, clsNum, clss, privilege, materials, history, readinglevel) {
  let hashes = generateHashes(clss, clsNum, password);
  await addPupilWithHash(name, surname, clsNum, clss, privilege, hashes[0], hashes[1], materials, history, readinglevel)
}
//----------------------------------------------------------------------------DATABASE-FUNCTIONS----//
async function reworkDb() {
  let materials = await request("SELECT * FROM MATERIALS")
  let state = true
  console.log(materials[0])
  for (let m of materials[0]) {
    const resp = await request('UPDATE materials SET author="' + m[descr][author] + '", readinglevel="' + m[descr][readinglevel] + '",cover="' + m[descr]['cover'] + '",pages=' + m[descr][pages] + ' WHERE materialid=' + m[materialid] + ';')
    if (requestSucceeded(resp)) {
      console.log("Updated " + m[materialid])
    } else {
      console.log("Failed to update " + m[materialid])
      state = false
    }
  }
  return state
}

async function classList() {
  let classes = await request('SELECT DISTINCT CLASS FROM USERS WHERE CLASS IS NOT NULL ORDER BY CLASS;')
  if (hasData(classes)) {
    return requestSucceeded(classes)
  } else return false
}

async function readingLvlListPupils() {
  let readingLvls = await request('SELECT DISTINCT READINGLEVEL FROM USERS WHERE READINGLEVEL IS NOT NULL ORDER BY READINGLEVEL;')
  console
  if (hasData(readingLvls)) {
    return requestSucceeded(readingLvls)
  } else return false
}

async function readingLvlListMaterials() {
  let readingLvls = await request('SELECT DISTINCT READINGLEVEL FROM MATERIALS WHERE READINGLEVEL IS NOT NULL ORDER BY READINGLEVEL;') // will not work, db rework needed
  if (hasData(readingLvls)) {
    return requestSucceeded(readingLvls)
  } else return false
}

async function changeUser(key, value, userid, privilege) {
  if (["readinglevel", "firstname", "lastname", "class", "classnum"].includes(key.toLowerCase())) {
    userPriv = await getUserPriv(userid)
    if ((userPriv == 0 && privilege >= 1) || (userPriv != 0 && privilege == 2)) {
      let resp = await request(`UPDATE USERS SET ${key}='${value}' WHERE userid='${userid}'`)
      return requestSucceeded(resp)
    }
    else return false
  }
  else return false
}

async function changeMaterial(key, value, materialid) {
  console.log(["title", "place", "descr", "available", `isbn`].includes(key.toLowerCase()))
  if (["title", "place", "descr", "available", `isbn`].includes(key.toLowerCase())) {
    let resp
    if (key === "descr") {
      resp = await request(`UPDATE MATERIALS SET ${key}='${JSON.stringify(value)}' WHERE MATERIALID='${materialid}'`)
    } else {
      resp = await request(`UPDATE MATERIALS SET ${key}='${value}' WHERE MATERIALID='${materialid}'`)
    }

    return requestSucceeded(resp)

  }
  else return false
}

async function getUserPriv(id) {
  let d = await request(`SELECT privilege FROM USERS WHERE userid='${id}'`)
  if (hasData(d)) {
    return d[0][0]['privilege']
  }
  else return false
}

async function addPupilWithHash(name, surname, clsNum, clss, privilege, sha256, md5, materials, history, readinglevel) {
  await request(`INSERT INTO USERS (firstname, lastname, class, classnum, privilege, sha256, md5, materials, history, readinglevel) VALUES ('${name}', '${surname}', '${clss}', '${clsNum}', '${privilege}', '${sha256}', '${md5}', '${JSON.stringify(materials)}', '${JSON.stringify(history)}', '${readinglevel}');`);

}
async function addTeacherWithHash(name, surname, privilege, sha256, md5, materials) {
  await request(`INSERT INTO USERS (firstname, lastname, privilege, sha256, md5, materials) VALUES ('${name}', '${surname}', '${privilege}', '${sha256}', '${md5}', '${JSON.stringify(materials)}');`);

}
async function addMaterial(title, place, description, available, ISBN) {

  let availableBit = 0;
  if (available) {
    availableBit = 1;
  }
  await request(`INSERT INTO MATERIALS (title, place, descr, available, lendcount, avgscore, isbn) VALUES ('${title}', '${place}', '${description}', '${availableBit}', '0', '0.0', '${ISBN}');`);
}
async function login(name, surname, sha256, md5) {
  // Get trying user from database
  let d = await request(`SELECT * FROM USERS WHERE FIRSTNAME='${name}' AND LASTNAME='${surname}'`)
  let i = 0
  let sessionId = ""
  if (hasData(d)) {
    while (i < d[0].length) {
      let dbsha256 = d[0][i]["sha256"]
      let dbmd5 = d[0][i]["md5"]
      if (dbsha256 == sha256 && dbmd5 == md5) {
        //Correct credentials
        userid = d[0][i]["userid"]
        sessionId = uuidv4().toString() // Create sessionid
        time = new Date().addHours(5) // Create expiration time

        // Push to server
        await request(`UPDATE USERS SET SESSIONID='${sessionId}', SESSIONIDEXPIRE='${time.toISOString()}' WHERE FIRSTNAME='${name}' AND LASTNAME='${surname}'`)

        // Get session privilege
        sess = await getSession(sessionId)
        if (sess != null) {
          privilege = sess["privilege"]
        }
        else {
          sessionId = ""
        }
      }
      i += 1
    }
  }
  // Login invalid
  if (sessionId == "") {
    sessionId = "Invalid credentials"
    userid = ""
    privilege = 0
  }
  return [sessionId, userid, privilege]

}
async function getSession(sessionId) {

  // get user from db
  user = await request(`SELECT * FROM USERS WHERE SESSIONID='${sessionId}'`)
  // does user exist
  if (hasData(user)) {
    // Check expiration
    expiry = new Date(user[0][0]["sessionidexpire"])
    if (new Date().getTime() < expiry.getTime()) {
      return user[0][0]
    }
    else return null
  }
  else return null

}
async function lendMaterial(userid, materialid) {
  returndate = new Date().addHours(120).toISOString()
  now = new Date().toISOString()
  material = await request(`SELECT * FROM MATERIALS WHERE MATERIALID='${materialid}'`)
  user = await request(`SELECT * FROM USERS WHERE USERID='${userid}'`)

  // Check if user and material are valid and available
  if (hasData(material) && material[0][0]["available"] == '1' && hasData(user) && checkSessionValidity(user)) {
    // Add material to user
    userMaterials = user[0][0]["materials"]
    userMaterials.push(materialid)

    // Push to db
    await request(`UPDATE MATERIALS SET LENDOUTTO='${userid}', RETURNDATE='${returndate}', AVAILABLE='0', STARTDATE='${now}' WHERE MATERIALID='${materialid}'`)
    await request(`UPDATE USERS SET MATERIALS='${JSON.stringify(userMaterials)}' WHERE USERID='${userid}'`)

    // Return validity and returndate
    return [true, returndate]
  }
  else { return false } // User not valid or material not available

}
async function returnMaterial(materialid, score, fullyread) {
  now = new Date()
  material = await request(`SELECT * FROM MATERIALS WHERE MATERIALID='${materialid}'`)

  // Check whether material is valid
  if (hasData(material)) {
    user = await request(`SELECT * FROM USERS WHERE USERID='${material[0][0]['lendoutto']}'`)
    // Check whether user is valid
    if (hasData(user) && checkSessionValidity(user)) {
      // Write material update to server with score
      await request(`UPDATE MATERIALS SET LENDOUTTO=NULL, RETURNDATE=NULL, STARTDATE=NULL, AVAILABLE='1', AVGSCORE='${(((parseFloat(material[0][0]["avgscore"]) * parseFloat(material[0][0]["lendcount"])) + score) / (parseFloat(material[0][0]["lendcount"]) + 1))}', LENDCOUNT='${material[0][0]["lendcount"] + 1}' WHERE MATERIALID='${materialid}';`)
      // Remove material from user
      userMaterials = user[0][0]["materials"]
      userMaterials.splice(userMaterials.indexOf(materialid), 1)

      // Check whether material is late
      returnDate = new Date(material[0][0]["returndate"])
      isontime = true
      if (dateInPast(returnDate, now)) { user[0][0]["howmuchlate"] += 1; isontime = false; }

      // Create dict for user history
      userDict = { "material": materialid, "score": score, "fullyread": fullyread, "startdate": material[0][0]['startdate'], "enddate": now.toISOString(), "ontime": isontime }
      userHistory = user[0][0]["history"]
      userHistory.push(userDict)

      // Push to db
      await request(`UPDATE USERS SET MATERIALS='${JSON.stringify(userMaterials)}', HOWMUCHLATE='${user[0][0]["howmuchlate"]}', HISTORY='${JSON.stringify(userHistory)}' WHERE USERID='${material[0][0]['lendoutto']}'`)

      return true
    }
    else return false // User is invalid
  }
  else return false // Material is invalid
}
async function checkSessionExpireSweep() {
  let d = await request("SELECT SESSIONIDEXPIRE, SESSIONID FROM USERS")
  d[0].forEach(async element => {
    if (element["sessionid"] != null) {
      let time = element["sessionidexpire"]
      let now = new Date()
      if (Date.now() > time) {
        await request(`UPDATE USERS SET SESSIONID=NULL, SESSIONIDEXPIRE=NULL WHERE SESSIONID='${element['sessionid']}'`)
      }
    }
  });

}
async function logout(sessionid) {
  let resp = await request(`UPDATE USERS SET SESSIONID=null, SESSIONIDEXPIRE=null WHERE SESSIONID='${sessionid}'`)
  return requestSucceeded(resp)
}
//--------------------------------------------------------------------------------------------------//

(async () => {
  console.log("Starting")
  await sequelize.authenticate()
  // i = 0
  // while (i < 20) {
  //   let leesniveau = leesniveaus[Math.floor(Math.random() * leesniveaus.length)]
  //   let clss = classes[Math.floor(Math.random() * classes.length)]
  //   await addTeacherWithPass(faker.name.firstName(), faker.name.lastName(), "password", 1, [])
  //   await addPupilWithPass(faker.name.firstName(), faker.name.lastName(), "password", Math.floor(Math.random() * 25) + 1, clss, 0, [], [], leesniveau)
  //   await addMaterial(faker.word.adjective() + " " + faker.word.noun(), leesniveau, JSON.stringify({ "author": faker.name.fullName(), "pages": Math.floor(Math.random() * 200) + 10, "cover": faker.image.abstract(1080, 1620), "readinglevel": leesniveau }), true)
  //   i++
  // }
  setTimeout(() => checkSessionExpireSweep, 60000)
})();