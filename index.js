const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config()
const port = process.env.PORT || 5000;


//middleware
app.use(cors());
app.use(express.json());


const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb://${process.env.DB_USER}:${process.env.DB_PASS}@ac-56gcpdx-shard-00-00.mgbkpcq.mongodb.net:27017,ac-56gcpdx-shard-00-01.mgbkpcq.mongodb.net:27017,ac-56gcpdx-shard-00-02.mgbkpcq.mongodb.net:27017/?ssl=true&replicaSet=atlas-neronq-shard-0&authSource=admin&retryWrites=true&w=majority`;

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

    const allClassCollection = client.db("summerCampDb").collection("allclass");
    const popularClassCollection = client.db("summerCampDb").collection("popularclass");
    const allInstractorCollection = client.db("summerCampDb").collection("allInstractor");
    const popularInstractorCollection = client.db("summerCampDb").collection("popularInstractor");
    


    app.get('/allclass',async(req,res) =>{
        const result = await allClassCollection.find().toArray();
        res.send(result);
    });

    app.get('/popularclass',async(req,res) =>{
        const result = await popularClassCollection.find().toArray();
        res.send(result);
    });
    app.get('/allInstractor',async(req,res) =>{
        const result = await allInstractorCollection.find().toArray();
        res.send(result);
    });
    app.get('/popularInstractor',async(req,res) =>{
        const result = await popularInstractorCollection.find().toArray();
        res.send(result);
    })
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    //await client.close();
  }
}
run().catch(console.dir);
 

app.get('/',(req,res) =>{
    res.send('summer camp is running')
})

app.listen(port,() =>{
    console.log(`summer camp is running on port ${port}`);
})