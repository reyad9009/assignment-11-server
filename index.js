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
        const foodPurchase = client.db('restaurant').collection('Purchase');

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
        app.get('/foods/details/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await foodCollection.findOne(query);
            res.send(result);
        })
        app.get('/foods/details/purchase/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await foodCollection.findOne(query);
            res.send(result);
        })

        app.post('/foods/purchase', async (req, res) => {
            const newFood = req.body;
            const result = await foodPurchase.insertOne(newFood);
            res.send(result);
        })

        // update equipment by logged-in user only her equipment
        // app.patch('/food/purchase/:id', async (req, res) => {
        //     const id = req.params.id;
        //     const filter = { _id: new ObjectId(id) };
        //     const options = { upsert: true };
        //     const updatedPriceData = req.body;
        //     const equipment = {
        //         $set: {
        //             price: updatedPriceData.price,
        //         },
        //     };
        //     const result = await foodCollection.updateOne(filter, equipment, options);
        //     res.send(result);
        // });

        app.patch("/food/:id", async (req, res) => {
            try {
              const id = req.params.id;
          
              // Validate ID format
              // if (!ObjectId.isValid(id)) {
              //   return res.status(400).send({ error: "Invalid ID format" });
              // }
          
              const filter = { _id: new ObjectId(id) };
              const updatedPriceData = req.body;
          
              // Validate data
              if (!updatedPriceData.quantity || isNaN(updatedPriceData.quantity)) {
                // return res.status(400).send({ error: "Invalid or missing price field" });
              }

              // const exists = await foodCollection.findOne(filter);
              // if (!exists) {
              //   return res.status(404).send({ error: "No document found with the specified ID" });
              // }
          
              const update = { $set: { quantity: updatedPriceData.quantity } };
              const result = await foodCollection.updateOne(filter, update);
          
              res.send(result);
            } 
            catch (error) {
              console.error("Error updating price:", error);
              res.status(500).send({ error: "An internal server error occurred" });
            }
          });
          




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