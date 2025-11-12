const express = require('express')
const cors = require('cors')
const app = express()
const port = 3000
const { MongoClient, ServerApiVersion } = require('mongodb');

app.use(cors())
app.use(express.json())

app.get('/', (req, res) => {
  res.send('Server is running')
})


const uri = "mongodb+srv://homenest-user:MLruA28AS82UtPHf@cluster0.urdzboc.mongodb.net/?appName=Cluster0";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    await client.connect();

    const db = client.db('homenest')
    const propertyCollection = db.collection('properties')

    app.get('/properties', async(req, res) => {
      const result = await propertyCollection.find().toArray()
      res.send(result)
    })


    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);



app.listen(port, () => {
  console.log(`Server is running on port ${port}`)
})
