const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// MongoDB Connection URI
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.fk8o9.mongodb.net/?appName=Cluster0`;

// CORS configuration
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://gsrsbloodbank.netlify.app",
      "https://gsrsbloodbank.vercel.app",
    ], // Allowed origins
    methods: ["GET", "POST", "PUT", "DELETE"], // Allowed HTTP methods
    allowedHeaders: ["Content-Type", "Authorization"], // Allowed headers
  })
);

app.use(cookieParser());
app.use(express.json());

// MongoDB connection caching for serverless environment
let cachedClient = null;
let cachedDb = null;

async function connectToDatabase() {
  if (cachedDb && cachedClient) {
    return { db: cachedDb, client: cachedClient };
  }

  const client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    },
  });

  await client.connect();
  const db = client.db("Gsrsserver");

  cachedClient = client;
  cachedDb = db;

  return { db, client };
}

// Root route
app.get("/", (req, res) => {
  res.send("GSRS server is running!");
});

// Create User
app.post("/user", async (req, res) => {
  console.log("Creating user:", req.body);
  const { name, photoURL, number, role, email, bloodGroup, address } = req.body;

  try {
    const { db } = await connectToDatabase();
    const userCollection = db.collection("Users");

    // Check if user already exists
    const existingUser = await userCollection.findOne({ email });

    if (existingUser) {
      return res
        .status(200)
        .send({ message: "User already exists", existingUser });
    }

    // Create new user
    const newUser = {
      name,
      email,
      photoURL,
      number,
      role,
      bloodGroup,
      address,
      createdAt: new Date(),
    };

    const result = await userCollection.insertOne(newUser);

    res.status(201).send({
      success: true,
      result,
    });
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).send({ message: error.message });
  }
});

// Get All Users
app.get("/users", async (req, res) => {
  try {
    const { db } = await connectToDatabase();
    const userCollection = db.collection("Users");

    const users = await userCollection.find().toArray();

    if (users.length === 0) {
      return res.status(404).send({ message: "No users found" });
    }

    res.status(200).send(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).send({ message: error.message });
  }
});

// For local development
if (process.env.NODE_ENV !== "production") {
  app.listen(port, () => {
    console.log("GSRS Server is running on port", port);
  });
}

// Export for Vercel
module.exports = app;
