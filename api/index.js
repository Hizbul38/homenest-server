import express from "express";
import cors from "cors";
import { MongoClient, ServerApiVersion, ObjectId } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB URI
const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.urdzboc.mongodb.net/?appName=Cluster0`;

// MongoDB client setup
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

app.get("/search", (req, res) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ error: "Missing search query" });
  res.json({ result: `You searched for: ${q}` });
});

// Root route
app.get("/", (req, res) => {
  res.send("HomeNest Server is Running...");
});

async function run() {
  try {
    await client.connect();
    const db = client.db("homenest");
    const propertyCollection = db.collection("properties");

    console.log("✅ MongoDB Connected Successfully!");

    // ✅ GET all properties (Supports: Search + Sort + Email Filter)
    app.get("/properties", async (req, res) => {
      try {
        const email = req.query.email;
        const sortBy = req.query.sortBy; // e.g. price, category, location
        const order = req.query.order === "desc" ? -1 : 1;
        const search = req.query.search || ""; // ✅ Search keyword

        let query = {};

        // ✅ Filter by logged-in user email
        if (email) {
          query.userEmail = email;
        }

        // ✅ Search by Property Name (Case-insensitive)
        if (search) {
          query.propertyName = { $regex: search, $options: "i" };
        }

        let cursor = propertyCollection.find(query);

        // ✅ Apply sorting dynamically
        if (sortBy) {
          cursor = cursor.sort({ [sortBy]: order });
        } else {
          cursor = cursor.sort({ createdAt: -1 }); // Default: newest first
        }

        const result = await cursor.toArray();
        res.send(result);
      } catch (error) {
        res.status(500).send({ message: "Failed to fetch properties", error: error.message });
      }
    });

    // ✅ GET 6 recent properties
    app.get("/properties/recent", async (req, res) => {
      try {
        const recent = await propertyCollection
          .find()
          .sort({ createdAt: -1 })
          .limit(6)
          .toArray();
        res.send(recent);
      } catch (error) {
        res.status(500).send({ message: "Failed to fetch recent properties", error: error.message });
      }
    });

    // ✅ GET single property by ID
    app.get("/properties/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await propertyCollection.findOne(query);
        
        if (!result) {
          return res.status(404).send({ message: "Property not found" });
        }
        
        res.send(result);
      } catch (error) {
        res.status(500).send({ message: "Failed to fetch property", error: error.message });
      }
    });

    // ✅ POST (Add Property)
    app.post("/properties", async (req, res) => {
      try {
        const data = req.body;
        const newProperty = {
          ...data,
          createdAt: new Date(),
        };
        const result = await propertyCollection.insertOne(newProperty);
        res.status(201).send(result);
      } catch (error) {
        res.status(500).send({ message: "Failed to add property", error: error.message });
      }
    });

    // ✅ DELETE property
    app.delete("/properties/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await propertyCollection.deleteOne(query);
        
        if (result.deletedCount === 0) {
          return res.status(404).send({ message: "Property not found" });
        }
        
        res.send(result);
      } catch (error) {
        res.status(500).send({ message: "Failed to delete property", error: error.message });
      }
    });

    // ✅ UPDATE property
    app.put("/properties/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const updatedData = req.body;
        const filter = { _id: new ObjectId(id) };
        const updateDoc = { $set: updatedData };
        const result = await propertyCollection.updateOne(filter, updateDoc);
        
        if (result.matchedCount === 0) {
          return res.status(404).send({ message: "Property not found" });
        }
        
        res.send(result);
      } catch (error) {
        res.status(500).send({ message: "Failed to update property", error: error.message });
      }
    });

    console.log("🚀 Pinged your deployment. MongoDB Connected!");
  } catch (error) {
    console.error("❌ Database Connection Error:", error);
  }
}

run().catch(console.dir);

// For local development
if (process.env.NODE_ENV !== "production") {
  app.listen(port, () => {
    console.log(`🚀 Server is running on port ${port}`);
  });
}

// Export for Vercel
export default app;