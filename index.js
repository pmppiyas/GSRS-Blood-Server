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

// CORS Middleware (must come first)
const corsOptions = {
  origin: [
    "http://localhost:5173",
    "http://localhost:5000",
    "https://gsrsserver-pmppiyas-pmppiyas-projects.vercel.app",
    "https://gsrsserver-iqs476wwf-pmppiyas-projects.vercel.app",
  ],
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"], // Explicitly allow headers
};

app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json());

// Create MongoDB client
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// Root route
app.get("/", (req, res) => {
  res.send("GSRS server is running!");
});

async function run() {
  try {
    // Connect to MongoDB
    await client.connect();
    console.log("Successfully connected to MongoDB!");

    // Database and collections
    const database = client.db("Gsrsserver");
    const userCollection = database.collection("Users");

    // Create User
    app.post("/user", async (req, res) => {
      console.log("Creating user:", req.body);
      const { name, photoURL, number, role, email, bloodGroup, address } =
        req.body;

      try {
        // Check if user already exists
        // const existingUser = await userCollection.findOne({ email });

        // if (existingUser) {
        //   return res
        //     .status(200)
        //     .send({ message: "User already exists", existingUser });
        // }

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
        const searchQuery = req.query.q ? req.query.q : "";
        const query = {
          $or: [
            { name: { $regex: searchQuery, $options: "i" } },
            { email: { $regex: searchQuery, $options: "i" } },
          ],
        };

        const users = await userCollection.find(query).toArray();
        if (users.length === 0) {
          res.status(404).send({ message: "No users found" });
          return;
        }

        res.status(200).send(users);
      } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).send({ message: error.message });
      }
    });

    // Get User by Email
    app.get("/user/:email", async (req, res) => {
      try {
        const email = req.params.email;
        const user = await userCollection.findOne({ email });

        if (!user) {
          return res.status(404).send({ message: "User not found" });
        }

        res.status(200).send(user);
      } catch (error) {
        console.error("Error fetching user:", error);
        res.status(500).send({ message: error.message });
      }
    });
  } catch (error) {
    console.error("Database connection error:", error);
  }
}

run().catch(console.dir);

app.listen(port, () => {
  console.log("GSRS Server is running on port", port);
});
