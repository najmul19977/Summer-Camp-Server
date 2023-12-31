const express = require('express');
const app = express();
const jwt = require('jsonwebtoken');
const cors = require('cors');
require('dotenv').config()
const port = process.env.PORT || 5000;


//middleware
app.use(cors());
app.use(express.json());

const verifyJWT = (req, res, next) => {
  const authorization = req?.headers?.authorization;
  if (!authorization) {
    return res.status(401).send({ error: true, message: 'unauthorized access' });
  }
  const token = authorization.split(' ')[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ error: true, message: 'unauthorized access' })
    }
    req.decoded = decoded;
    next();
  })
}


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
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
    const cartCollection = client.db("summerCampDb").collection("carts");
    const usersCollection = client.db("summerCampDb").collection("users");

    app.post('/jwt', (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1d' })
      res.send({ token })
    });

    const verifyAdmin = async (req, res, next) => {
      const email = req.decoded.email;
      const query = { email: email }
      const user = await usersCollection.findOne(query);
      if (user?.role !== 'admin') {
        return res.status(403).send({ error: true, message: 'forbidden message' });
      }
      next();
    }
    // user relatet api
    app.get('/users', async (req, res) => {
      const result = await usersCollection.find().toArray();
      res.send(result);
    });


    app.post('/users', async (req, res) => {
      const user = req.body;

      const query = { email: user?.email }
      const existingUser = await usersCollection.findOne(query);

      if (existingUser) {
        return res.send({ message: 'user already exists' })
      }
      const result = await usersCollection.insertOne(user);
      res.send(result);
    });

    app.get('/users/admin/:email',  async (req, res) => {
      const email = req.params.email;

      if (req.decoded.email !== email) {
        res.send({ admin: false })
      }

      const query = { email: email }
      const user = await usersCollection.findOne(query);
      const result = { admin: user?.role === 'admin' }
      res.send(result);
    })

    app.patch('/users/admin/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          role: 'admin'
        },
      };
      const result = await usersCollection.updateOne(filter, updateDoc);
      res.send(result);
    })


    //get data
    app.get('/allclass', async (req, res) => {
      const result = await allClassCollection.find().toArray();
      res.send(result);
    });
    // add new class 
    app.post('/allclass',  verifyAdmin, async (req, res) => {
      const newItem = req.body;
      const result = await allClassCollection.insertOne(newItem);
      res.send(result);
    });
    app.delete('/allclass/:id',  verifyAdmin, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await allClassCollection.deleteOne(query);
      res.send(result);
    })

    app.get('/popularclass', async (req, res) => {
      const result = await popularClassCollection.find().toArray();
      res.send(result);
    });
    app.get('/allInstractor', async (req, res) => {
      const result = await allInstractorCollection.find().toArray();
      res.send(result);
    });
    app.get('/popularInstractor', async (req, res) => {
      const result = await popularInstractorCollection.find().toArray();
      res.send(result);
    });

    //admin collcetion data
    app.get('/admin-status', verifyAdmin, async (req, res) => {
      const users = await usersCollection.estimatedDocumentCount();
      const allclass = await allClassCollection.estimatedDocumentCount();
      const popularclass = await popularClassCollection.estimatedDocumentCount();
      const addcart = await cartCollection.estimatedDocumentCount();
      const allinstractur = await allInstractorCollection.estimatedDocumentCount();
      const populerinstractur = await popularInstractorCollection.estimatedDocumentCount();

      res.send({
        users,
        allclass,
        popularclass,
        addcart,
        allinstractur,
        populerinstractur



      });

    })

    // cart collection apis
    app.get('/carts', async (req, res) => {
      const email = req.query.email;
      if (!email) {
        res.send([]);
      }

      const decodedEmail = req.decoded.email;
      if (email !== decodedEmail) {
        return res.status(403).send({ error: true, message: 'porviden access' })
      }
      const query = { email: email };
      const result = await cartCollection.find(query).toArray();
      res.send(result);
    });
    app.post('/carts', async (req, res) => {
      const item = req.body;
      console.log(item);
      const result = await cartCollection.insertOne(item);
      res.send(result);
    });
    app.delete('/carts/:id', async (req, res) => {
      const id = req.params.id
      const query = { _id: new ObjectId(id) };
      const result = await cartCollection.deleteOne(query);
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


app.get('/', (req, res) => {
  res.send('summer camp is running')
})

app.listen(port, () => {
  console.log(`summer camp is running on port ${port}`);
})