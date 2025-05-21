import express, { Express, Request, Response, NextFunction } from "express";
import dotenv from "dotenv";
import path from "path";
import { Driver, Team, User, FlashMessage } from "./types";
import { Collection, MongoClient } from "mongodb";
import bcrypt from "bcrypt";
import session from "express-session";
import mongoDbSession from "connect-mongodb-session";

dotenv.config();

const CONNECTION_STRING: string | undefined = process.env.MONGODB_URI;

if (!CONNECTION_STRING) {
  throw new Error("MONGODB_URI is not defined in environment variables");
}

const client = new MongoClient(CONNECTION_STRING);

const app: Express = express();

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

app.set("port", process.env.PORT ?? 3000);

let driverCollection: Collection<Driver>;
let teamCollection: Collection<Team>;
let userCollection: Collection<User>;

const MongoDBStore = mongoDbSession(session);
const store = new MongoDBStore({
  uri: CONNECTION_STRING,
  collection: "sessions",
  databaseName: "wec",
});

app.use(session({
  secret: process.env.SESSION_SECRET || "my-secret",
  resave: true,
  saveUninitialized: true,
  store,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 7
  }
}));

app.use((req: Request & { session: any }, res: Response, next: NextFunction) => {
  if (req.session.message) {
    res.locals.message = req.session.message;
    delete req.session.message;
  } else {
    res.locals.message = undefined;
  }
  next();
});

app.use((req: Request & { session: any }, res: Response, next: NextFunction) => {
  res.locals.user = req.session.user;
  next();
});

function secureMiddleware(req: Request & { session: any }, res: Response, next: NextFunction) {
  if (req.session.user) {
    next();
  } else {
    req.session.message = { type: "error", message: "Je moet eerst inloggen!" };
    res.redirect("/login");
  }
}

async function createInitialUser() {
  if (!userCollection) return;
  const count = await userCollection.countDocuments();
  if (count === 0) {
    const email = process.env.ADMIN_EMAIL || "admin@admin.com";
    const password = process.env.ADMIN_PASSWORD || "admin";
    const hashed = await bcrypt.hash(password, 10);
    await userCollection.insertOne({ email, password: hashed, role: "ADMIN" });
    console.log("Admin user created:", email);
  }
}

async function main() {
  try {
    await client.connect();
    console.log("Connected to database");

    const db = client.db("wec");
    driverCollection = db.collection("drivers");
    teamCollection = db.collection("teams");
    userCollection = db.collection("users");

    await createInitialUser();

    const driverCount = await driverCollection.countDocuments();
    const teamCount = await teamCollection.countDocuments();

    if (driverCount === 0 || teamCount === 0) {
      await fetchAndInsertData();
    } else {
      console.log("Data already present in MongoDB");
    }

  } catch (error) {
    console.error(error);
  }
}
main();

async function fetchAndInsertData() {
  try {
    const driversResponse = await fetch("https://raw.githubusercontent.com/Saaaanns/Milestone1/refs/heads/main/Drivers.json");
    const driverData = await driversResponse.json();
    const rawDrivers = driverData.drivers;

    const teamsResponse = await fetch("https://raw.githubusercontent.com/Saaaanns/Milestone1/refs/heads/main/Teams.json");
    const teamData = await teamsResponse.json();
    const teams = teamData.teams;

    const teamMap = new Map(teams.map((team: Team) => [team.id, team]));

    const drivers = rawDrivers.map((driver: Driver) => ({
      ...driver,
      team: teamMap.get(driver.team_id),
    }));

    await driverCollection.deleteMany({});
    await driverCollection.insertMany(drivers);
    console.log("Drivers inserted");

    await teamCollection.deleteMany({});
    await teamCollection.insertMany(teams);
    console.log("Teams inserted");

  } catch (error) {
    console.error("Failed to fetch data or insert data!", error);
  }
}

app.get("/login", (req: Request, res: Response) => {
  res.render("login");
});

app.post("/login", async (req: Request & { session: any }, res: Response) => {
  const email = req.body.email;
  const password = req.body.password;

  try {
    const user = await userCollection.findOne({ email });
    if (!user) throw new Error("Gebruiker niet gevonden");

    const match = await bcrypt.compare(password, user.password || "");
    if (!match) throw new Error("Verkeerd wachtwoord");

    req.session.user = {
      _id: user._id,
      email: user.email,
      role: user.role,
    };

    req.session.message = { type: "success", message: "Succesvol ingelogd" };
    res.redirect("/");

  } catch (error: any) {
    req.session.message = { type: "error", message: error.message || "Login mislukt" };
    res.redirect("/login");
  }
});

app.post("/logout", secureMiddleware, (req: Request & { session: any }, res: Response) => {
  req.session.destroy(() => {
    res.redirect("/login");
  });
});

app.get("/", secureMiddleware, async (req: Request, res: Response) => {
  const drivers = await driverCollection.find().toArray();
  res.render("index", {
    title: "Home - WEC Data Viewer",
    drivers,
  });
});

app.get("/drivers", secureMiddleware, async (req: Request, res: Response) => {
  const searchQuery = req.query.search?.toString().toLowerCase() || "";

  const allowedSortFields: (keyof Driver)[] = ['name', 'birthdate', 'category', 'active'];
  const rawSortField = req.query.sortField;
  const sortField: keyof Driver = (typeof rawSortField === 'string' && allowedSortFields.includes(rawSortField as keyof Driver))
      ? (rawSortField as keyof Driver)
      : 'name';

  const sortDirection = req.query.sortDirection === 'desc' ? -1 : 1;

  const filter = searchQuery
      ? { name: { $regex: searchQuery, $options: 'i' } }
      : {};

  const allDrivers = await driverCollection
      .find(filter)
      .sort({ [sortField]: sortDirection })
      .toArray();

  res.render("drivers", {
    drivers: allDrivers,
    searchQuery,
    sortField,
    sortDirection: sortDirection === 1 ? 'asc' : 'desc'
  });
});


app.get("/drivers/:id", secureMiddleware, async (req: Request, res: Response) => {
  const driver = await driverCollection.findOne({ id: parseInt(req.params.id) });
  if (!driver) return res.status(404).send("Driver niet gevonden!");

  const team = await teamCollection.findOne({ id: driver.team_id });

  res.render("driver", { driver, team });
});

app.get("/drivers/:id/update", secureMiddleware, async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const driver = await driverCollection.findOne({ id });
  const teams = await teamCollection.find().toArray();

  if (!driver) return res.status(404).send("Driver niet gevonden!");

  res.render("update", { driver, teams });
});

app.post("/drivers/:id/update", secureMiddleware, async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);

  const updatedDriver = {
    name: req.body.name,
    birthdate: req.body.birthdate,
    category: req.body.category,
    team_id: parseInt(req.body.team_id),
    active: req.body.active === "true",
  };

  await driverCollection.updateOne({ id }, { $set: updatedDriver });

  res.redirect("/drivers");
});

app.get("/teams", secureMiddleware, async (req: Request, res: Response) => {
  const teams = await teamCollection.find().toArray();
  res.render("teams", { teams });
});

app.listen(app.get("port"), () => {
  console.log("Server started on http://localhost:" + app.get("port"));
});
