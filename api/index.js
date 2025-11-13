import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { MongoClient, ServerApiVersion, ObjectId } from "mongodb";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware

app.use(cors());
app.use(express.json());

// MongoDB URI

const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.urdzboc.mongodb.net/?appName=Cluster0`;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

let propertyCollection;

// Main function to connect DB and start server

async function startServer() {
  try {
    await client.connect();
    const db = client.db("homenest");
    propertyCollection = db.collection("properties");
    console.log("✅ MongoDB Connected Successfully!");

    // Routes

    app.get("/", (req, res) => {
      res.send("HomeNest Server is Running...");
    });

    app.get("/properties", async (req, res) => {
      try {
        const { email, sortBy, order, search } = req.query;
        const sortOrder = order === "desc" ? -1 : 1;
        const query = {};

        if (email) query.userEmail = email;
        if (search) query.propertyName = { $regex: search, $options: "i" };

        let cursor = propertyCollection.find(query);

        if (sortBy) cursor = cursor.sort({ [sortBy]: sortOrder });
        else cursor = cursor.sort({ createdAt: -1 });

        const result = await cursor.toArray();
        res.send(result);
      } catch (error) {
        res.status(500).send({ message: "Error fetching properties", error });
      }
    });

    app.get("/properties/recent", async (req, res) => {
      try {
        const recent = await propertyCollection
          .find()
          .sort({ createdAt: -1 })
          .limit(6)
          .toArray();
        res.send(recent);
      } catch (error) {
        res.status(500).send({ message: "Error fetching recent properties", error });
      }
    });

    app.get("/properties/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const result = await propertyCollection.findOne({ _id: new ObjectId(id) });
        res.send(result);
      } catch (error) {
        res.status(500).send({ message: "Error fetching property", error });
      }
    });

    app.post("/properties", async (req, res) => {
      try {
        const data = req.body;
        const newProperty = { ...data, createdAt: new Date() };
        const result = await propertyCollection.insertOne(newProperty);
        res.status(201).send(result);
      } catch (error) {
        res.status(500).send({ message: "Failed to add property", error });
      }
    });

    app.delete("/properties/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const result = await propertyCollection.deleteOne({ _id: new ObjectId(id) });
        res.send(result);
      } catch (error) {
        res.status(500).send({ message: "Failed to delete property", error });
      }
    });

    app.put("/properties/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const updatedData = req.body;
        const result = await propertyCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: updatedData }
        );
        res.send(result);
      } catch (error) {
        res.status(500).send({ message: "Failed to update property", error });
      }
    });

    // Start server only after DB connection
    
    app.listen(port, () => {
      console.log(`🚀 Server is running on port ${port}`);
    });

  } catch (error) {
    console.error("❌ Database Connection Error:", error);
  }
}

startServer();