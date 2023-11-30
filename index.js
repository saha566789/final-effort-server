const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 5000;



// middleware
app.use(cors());
app.use(express.json());



const uri = `mongodb+srv://${process.env.USER_DB}:${process.env.USER_PASSWORD}@cluster0.lkenfit.mongodb.net/?retryWrites=true&w=majority`;

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
    const categoryCollection = client.db("inventoryDB").collection("category");
    const serverCollection = client.db("inventoryDB").collection("server");
    const menuCollection = client.db("inventoryDB").collection("menu");
    const userCollection = client.db("inventoryDB").collection("user");
    const usersCollection = client.db("inventoryDB").collection("users");
    const dollerCollection = client.db("inventoryDB").collection("doller");
    const checkCollection = client.db("inventoryDB").collection("check");
    const salesCollection = client.db("inventoryDB").collection("sales");

    app.get('/category',async(req,res)=>{
      const cursor = categoryCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    })
    // check
    app.get('/doller',async(req,res)=>{
      const cursor = dollerCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    })
    app.get('/doller/:id',async(req,res)=>{
       const id = req.params.id;
    const query = { _id: new ObjectId(id) }
    // console.log(query)
    const result = await dollerCollection.findOne(query);
    res.send(result);
    })
     app.get('/server',async(req,res)=>{
      let query = {};
      if (req?.query?.email) {
        query = { email: req?.query?.email }
      }
      const result = await serverCollection.find(query).toArray();
      res.send(result)
      // const cursor = serverCollection.find();
      // const result = await cursor.toArray();
      // res.send(result);
     })
  
    app.post('/server',async(req,res)=>{
      const newProduct = req.body;
       // Check if the user already has a shop
       const existingShop = await serverCollection.findOne({ email: newProduct.email });
       if (existingShop) {
         return res.status(400).json({ message: 'User already has a shop' });
       }
      newProduct.limit = 3
       const result = await serverCollection.insertOne(newProduct);
      res.send(result);
     
  
    })

    app.put('/server/:id/increment', async (req, res) => {
      const { limit } = req.query;
      console.log('limit', limit);
      const offerLimit = parseInt(limit)
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await serverCollection.updateOne(
        query,
        { $inc: { limit: offerLimit } },
        { new: true }
      );
      res.json(result);
    });





  //  manager user
    
    app.get('/user/manager/:email',  async (req, res) => {
      const email = req.params.email;  
    //  console.log(email)
      const query = { email: email };
      const user = await userCollection.findOne(query);
      let manager = false;
      if (user) {
        manager = user?.role === 'manager';
      }
      res.send({ manager });
    })

 
    
 app.patch('/user/manager/:email',async(req,res)=>{
  const managerInfo =req.body;
  const email =req.params.email;
  const query= {email:email} 
  const options = {upsert: true}
  const updateDoc ={
    $set:{
     name:managerInfo.name,
     shopLogo:managerInfo.image,
     shopId:managerInfo.shopId,
     role:managerInfo.role
    }
    
  }
  const result = await userCollection.updateOne(query,updateDoc,options)
  res.send(result)
 })
      
   
 
  //  menu
  // app.get('/menu', async (req, res) => {
  //   const result = await menuCollection.find().toArray();
  //   res.send(result);
  // });

  app.post('/menu', async (req, res) => {
    const menuItem = req.body;
    // console.log(menuItem)
    const shop = await serverCollection.findOne({shopName: menuItem.sHopName})
    menuItem.shopId = shop?._id
    const result = await menuCollection.insertOne(menuItem);
    res.send(result);
  });
  app.get('/menu', async (req, res) => {
    // const id = req.params.id;
    // const query = { _id: new ObjectId(id) }
    // const result = await menuCollection.findOne(query);
    // res.send(result);
    let query = {};
      if (req?.query?.email) {
        query = { email: req?.query?.email }
      }
      const result = await menuCollection.find(query).toArray();
      res.send(result)
  })
  app.patch('/menu/:id', async (req, res) => {
    const item = req.body;
    const id = req.params.id;
    const filter = { _id: new ObjectId(id) }
    const updatedDoc = {
      $set: {
        name: item.name,
        
        quantity:item.quantity,
        location: item.location,
        margin: item.margin,
        price: item.price,
        discount: item.discount,
        description: item.description,
        image: item.image
      }
    }

    const result = await menuCollection.updateOne(filter, updatedDoc)
    res.send(result);
  })
  app.delete('/menu/:id',  async (req, res) => {
    const id = req.params.id;
    const query = { _id: new ObjectId(id) }
    const result = await menuCollection.deleteOne(query);
    res.send(result);
  })

   
     // users related api
    

   

    app.post('/users', async (req, res) => {
      const user = req.body;
     console.log(user)
      const query = { email: user.email }
      const existingUser = await usersCollection.findOne(query);
      if (existingUser) {
        return res.send({ message: 'user already exists', insertedId: null })
      }
      const result = await usersCollection.insertOne(user);
      res.send(result);
    });

    app.get('/users', async (req, res) => {
      const result = await usersCollection.find().toArray();
      res.send(result);
    });
    app.get('/users/admin/:email',  async (req, res) => {
      const email = req.params.email;

      // if (email !== req.decoded.email) {
      //   return res.status(403).send({ message: 'forbidden access' })
      // }

      const query = { email: email };
      const user = await usersCollection.findOne(query);
      let admin = false;
      if (user) {
        admin = user?.role === 'admin';
      }
      res.send({ admin });
    })

    
    app.patch('/users/admin/:id',  async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updatedDoc = {
        $set: {
          role: 'admin'
        }
      }
      const result = await usersCollection.updateOne(filter, updatedDoc);
      res.send(result);
    })

    app.delete('/users/:id',  async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await usersCollection.deleteOne(query);
      res.send(result);
    })

      // payment intent
      app.post('/create-payment-intent', async (req, res) => {
        const { price } = req.body;
        const amount = parseInt(price * 100);
        console.log(amount, 'amount inside the intent')
  
        const paymentIntent = await stripe.paymentIntents.create({
          amount: amount,
          currency: 'usd',
          payment_method_types: ['card']
        });
  
        res.send({
          clientSecret: paymentIntent.client_secret
        })
      });
  
  
// check api
app.post('/check', async (req, res) => {
  const cartProduct = req.body;
  // console.log(menuItem)
 
  const result = await checkCollection.insertOne(cartProduct);
  res.send(result);
});
app.get('/check',async (req, res)=>{

  const email = req.query.email;
  const query = {email: email}
  const result = await checkCollection.find(query).toArray()
  res.send(result)
})
app.put('/check/:id/increment', async (req, res) => {
  
  const id = req.params.id;
  const query = { _id: new ObjectId(id) };
  const result = await menuCollection.updateOne(
    query,
    { $inc: { saleCount: 1 } },
    { new: true }
  );
  res.json(result);
});
app.put('/check/:id/decrement', async (req, res) => {
  
  const id = req.params.id;
  const query = { _id: new ObjectId(id) };
  const result = await menuCollection.updateOne(
    query,
    { $inc: { quantity: -1 } },
    { new: true }
  );
  res.json(result);
});
app.delete('/check/:id',  async (req, res) => {
  const id = req.params.id;
  const query = { _id: new ObjectId(id) }
  const result = await checkCollection.deleteOne(query);
  res.send(result);
})

//sales collection
app.post('/sales', async (req, res) => {
  const allProduct = req.body;
  // console.log(menuItem)
 
  const result = await salesCollection.insertOne(allProduct);
  res.send(result);
});
app.get('/sales',async (req, res)=>{

  const email = req.query.email;
  const query = {email: email}
  const result = await salesCollection.find(query).toArray()
  res.send(result)
})
// pagination

app.get('/sales', async (req, res) => {
  const page = parseInt(req.query.page);
  const size = parseInt(req.query.size);

  console.log('pagination query', page, size);
  const result = await salesCollection.find()
  .skip(page * size)
  .limit(size)
  .toArray();
  res.send(result);
})



app.get('/salesCount', async (req, res) => {
  const count = await salesCollection.estimatedDocumentCount();
  res.send({ count });
})
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('final is sitting')
  })
  
  app.listen(port, () => {
    console.log(`final effort is sitting on port ${port}`);
  })
  