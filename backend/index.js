const port =4000;
const express = require("express")
const app =express();
const mongoose =require("mongoose");
const jwt= require("jsonwebtoken")
const multer =require("multer")
const path = require("path")
const cors =require("cors");
const { type } = require("os");

app.use(express.json());
app.use(cors());

// Database connection with mongodb
mongoose.connect("mongodb+srv://advaittonpe11:Advait123@cluster0.vlzypxr.mongodb.net/e-commerce")

// API creation 
app.get("/",(req,res)=>{
    res.send("Express App is Running")
})

// Image storage engine 

const storage = multer.diskStorage({
  destination: './upload/images',
  filename: (req, file, cb) => {
    const uniqueName = `${file.originalname.split('.')[0]}_${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});
const upload =multer({storage: storage})

//creating upload endpoint for images
app.use('/images',express.static('upload/images'))

app.post("/upload",upload.single('product'),(req,res)=>{
    res.json({
        success:1,
        image_url:`http://localhost:${port}/images/${req.file.filename}`
    })
})

//Schema for creating products

const Product =mongoose.model("Product",{
    id:{
        type:Number,
        required:true,
    },
    name:{
        type:String,
        required:true,
    },
    image:{
        type:String,
        required:true,
    },
    category:{
        type:String,
        required:true,
    },
    new_price:{
        type:Number,
        required:true,
    },
    old_price:{
        type:Number,
        required:true,
    },
    date:{
        type:Date,
        default:Date.now(),
    },
    available:{
        type:Boolean,
        default:true,
    }
})

app.post('/addproduct',async(req,res)=>{
    let products =await Product.find({});
    let id;
    if(products.length>0){
        let last_product_array =products.slice(-1);
        let last_product =last_product_array[0];
        id=last_product.id+1;
    }
    else{
        id=1;
    }
    const product =new Product({
        id:id,
        name:req.body.name,
        image:req.body.image,
        category:req.body.category,
        new_price:req.body.new_price,
        old_price:req.body.old_price,
    });
    console.log(product);
    await product.save();
    console.log("saved");
    res.json({
        success:true,
        name:req.body.name,
    })
} )

//creating api for deleting products

app.post('/removeproduct',async(req,res)=>{
    await Product.findOneAndDelete({id:req.body.id});
    console.log("Removed")
    res.json({
        success:true,
        name:req.body.name,
    })
})

// creating API for getting All products 

app.get('/allproducts',async(req,res)=>{
    let products = await Product.find({})
    console.log("All products Fetched...");
    res.send(products);
})

//scheam creating for user model

const Users =mongoose.model('Users', {

    name:{
        type:String ,
    },
    email:{
        type:String,
        unique:true,
    },
    password:{
        type:String,
    },
    cartdata:{
        type:Object,
    },
    data:{
        type:Date,
        default:Date.now,
    }
})

//creating endpoint for registing user
app.post('/signup',async(req,res)=>{
    let check =await Users.findOne({email:req.body.email})
    if(check){
        return res.status(400).json({success:false ,errors:"existing user found with same email id "})
    }
    let cart ={};
    for (let i = 0; i < 300; i++) {
        cart[i]=0;
        
    }
    const user =new Users({
        name:req.body.username,
        email:req.body.email,
        password:req.body.password,
        cartData:cart,
    })
    await user.save();

    const data = {
        user:{
            id:user.id
        }
    }
    const token =jwt.sign(data,'secret_ecom');
    res.json({success:true ,token})
})
//creating endpoint for user login 

app.post('/login',async(req,res)=>{
    let user =await Users.findOne({email:req.body.email});
    if(user){
        const passCompare =req.body.password === user.password;

        if(passCompare){
            const data ={
                user:{
                    id:user.id
                }
            }
            const token =jwt.sign(data,'secret_ecom');
            res.json({success:true ,token})
        }else{
            res.json({success:false, errors:"wrong password"})
        }
    }else{
        res.json({success:false,errors:"wrong email id"})
    }
})

//creating endpoint for new collection data 

app.get('/newcollections' ,async(req,res)=>{
    let products =await Product.find({});
    let newcollection =products.slice(1).slice(-8);
    console.log("NewCollect fetched")
    res.send(newcollection)
})

//creating middleware to fetch user 

const fetchUser = async(req,res ,next)=>{
    const token = req.header('auth-token');
    if(!token){
        res.status(401).send({errors:"Please authenticate using valid token"})
    }
    else{
        try {
            const data =jwt.verify(token,'secret_ecom');
            req.user =data.user;
            next();
        } catch (error) {
            res.status(401).send({errors:"please authenticate using valid token"})
        }
    }
}


//creating endpoint for cart 

app.post('/addtocart',fetchUser, async(req,res)=>{
    
    let userData = await Users.findOne({_id:req.user.id});
    userData.cartData[req.body.itemId]+=1;

    await Users.findOneAndUpdate({_id:req.user.id} , {cartData:userData.cartData})
    res.send("Added")

})

//creating endpoint to remove product from cart

app.post('/removefromcart',fetchUser ,async(req,res)=>{
   
     let userData = await Users.findOne({_id:req.user.id});
     if( userData.cartData[req.body.itemId ]>0){
         userData.cartData[req.body.itemId]-=1;
     }
   

    await Users.findOneAndUpdate({_id:req.user.id} , {cartData:userData.cartData})
    res.send("Removed")
})


app.listen(port,(error)=>{
    if(!error){
        console.log(`Server Running on PORT ${port}`)
    }else{
        console.log("Error:"+error)
    }
})