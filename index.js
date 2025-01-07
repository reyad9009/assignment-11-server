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
    //await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    //console.log("Pinged your deployment. You successfully connected to MongoDB!");

    // all food related apis
    const foodCollection = client.db('restaurant').collection('foods');
    const foodPurchase = client.db('restaurant').collection('Purchase');
    const userFoodPurchase = client.db('restaurant').collection('userPurchase');

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

    // when user click purchase button then store purchase details and also update quantity in db
    app.post("/foods/purchase", async (req, res) => {
      const { foodId, quantity } = req.body;
      try {
        // Check if the food item already exists
        const existingFood = await foodPurchase.findOne({ foodId });
        if (existingFood) {
          // Update only the quantity
          const updateResult = await foodPurchase.updateOne(
            { foodId },
            { $inc: { quantity: parseInt(quantity, 10) } }
          );
          res.status(200).json({
            updatedQuantity: existingFood.quantity + parseInt(quantity, 10),
          });
        }
        else {
          const newFood = req.body;
          const result = await foodPurchase.insertOne(newFood);
          res.send(result);

        }

      } catch (error) {
        //console.error("Error handling food purchase:", error);
        res.status(500).json({ message: "Internal Server Error" });
      }
    });

    app.get('/foods/purchase/:foodId', async (req, res) => {
      const foodId = req.params.foodId;
      const query = { foodId: foodId }
      const result = await foodPurchase.findOne(query);
      res.send(result);
    });

    // when user click purchase button then update quantity
    app.patch("/food/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updatedQuantity = req.body;
      const update = { $set: { quantity: updatedQuantity.quantity } };
      const result = await foodCollection.updateOne(filter, update);
      res.send(result);
    });


    // user system
    // Get equipment data by logged-in user's email
    app.get('/my-foods/:email', async (req, res) => {
      const email = req.params.email;
      const filter = { email: email };
      const result = await foodCollection.find(filter).toArray();
      res.send(result)
    });

    app.get('/my-foods/update/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await foodCollection.findOne(query);
      res.send(result);
    })

    // update foods by logged-in user only her foods
    app.put('/my-foods/update/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updatedFood = req.body;
      const equipment = {
        $set: {
          foodName: updatedFood.foodName,
          image: updatedFood.image,
          category: updatedFood.category,
          quantity: updatedFood.quantity,
          price: updatedFood.price,
          foodOrigin: updatedFood.foodOrigin,
          description: updatedFood.description,
          email: updatedFood.email,
          name: updatedFood.name,
        },
      };
      const result = await foodCollection.updateOne(filter, equipment, options);
      res.send(result);
    });

    //for user purchase
    app.post('/food/Purchase/user', async (req, res) => {
      const newFood = req.body;
      const result = await userFoodPurchase.insertOne(newFood);
      res.send(result);
    })

    // Get orders data by logged-in user's email
    app.get('/my-orders/:email', async (req, res) => {
      const email = req.params.email;
      const filter = { email: email };
      const result = await userFoodPurchase.find(filter).toArray();
      res.send(result)
    });

    //logged user delete her item from mongodb 
    app.delete('/my-orders/delete/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await userFoodPurchase.deleteOne(query);
      res.send(result);
    })

    // for home page
    //get 6 data from mongodb
    // app.get('/home-foods', async (req, res) => {
    //   const cursor = foodPurchase.find().limit(6);
    //   // const cursor = EquipmentCollection.find();
    //   const result = await cursor.toArray();
    //   res.send(result);
    // })

    app.get('/home-foods', async (req, res) => {
      try {
        const result = await userFoodPurchase.aggregate([
          // Group by foodId to calculate the total quantity sold for each food item
          {
            $group: {
              _id: "$foodId", // Group by foodId
              totalQuantity: { $sum: "$quantity" }, // Sum up the quantities
              foodName: { $first: "$foodName" }, // Get the food name
              price: { $first: "$price" }, // Get the price
              image: { $first: "$image" } // Get the image
            }
          },
          // Sort by totalQuantity in descending order
          { $sort: { totalQuantity: -1 } },
          // Limit to top 6 items
          { $limit: 6 }
        ]).toArray();
    
        res.send(result);
      } catch (error) {
        //console.error("Error fetching top-selling foods:", error);
        res.status(500).send({ error: "Failed to fetch data" });
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







// foodName: "Croissant", 
// price: "2.50", 
// quantity: 10
// name: "Tarek Rahman", 
// email: "tarekhossen105@gmail.com", 
// date: "01/05/2025", 
// foodId: "67781b0d46750b4b54bcfe55", 
// image: "https://i.ibb.co.com/b2qsFbM/Croissant.png" 