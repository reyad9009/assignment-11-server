const express = require('express');
const cors = require('cors');
const app = express();
require('dotenv').config()

const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.jx9i0.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();
        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");

        // all food related apis
        const foodCollection = client.db('restaurant').collection('foods');

        // post data
        app.post('/food', async (req, res) => {
            const newFood = req.body;
            const result = await foodCollection.insertOne(newFood);
            res.send(result);
        })
        // get all data
        app.get('/foods', async (req, res) => {
            const cursor = foodCollection.find();
            const result = await cursor.toArray();
            res.send(result);
        });
        app.get('/foods/details/:id', async(req, res) => {
            const id = req.params.id;
            const query = {_id: new ObjectId(id)}
            const result = await foodCollection.findOne(query);
            res.send(result);
        })
        app.get('/foods/details/purchase/:id', async(req, res) => {
            const id = req.params.id;
            const query = {_id: new ObjectId(id)}
            const result = await foodCollection.findOne(query);
            res.send(result);
        })





    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('food is falling from the sky')
})

app.listen(port, () => {
    console.log(`food is waiting at: ${port}`)
})