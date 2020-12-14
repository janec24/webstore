const express = require("express");
const app = express();
const cors = require('cors');
app.use(cors());

let bodyParser = require('body-parser');
app.use(bodyParser.raw({ type: "*/*"}));

app.get("/sourcecode", (req, res) => {
res.send(require('fs').readFileSync(__filename).toString())
})

app.listenerCount(process.env.PORT || 3000)

// listen for requests :)
const listener = app.listen(process.env.PORT, () => {
  console.log("Your app is listening on port " + listener.address().port);
});

var passwords = new Map();
var tokens = new Map();
var items = [];
var activity = [];
var allChat = [];

//problem 1 - signup
app.post("/signup", (req, res) => {
  let parsed = JSON.parse(req.body);
  
  if (parsed.password === undefined){
    res.send({"success":false,"reason":"password field missing"})
  }
  else if (parsed.username === undefined){
    res.send({"success":false,"reason":"username field missing"})
  }
  else if (passwords.get(parsed.username) != undefined){
    res.send({"success":false,"reason":"Username exists"})
  }
  else if (passwords.get(parsed.username) === undefined){
    
    passwords.set(parsed.username, parsed.password);
    
    activity.push({"customer": parsed.username, 
                   "cartItems": [], 
                   "purchased":[] });
    allChat.push({
    "user": parsed.username,
    "chats": []
  });
    res.send({"success":true});
  }
  
  
});

//problem 2 - login
app.post("/login", (req, res) => {
  let parsed = JSON.parse(req.body);
  
  if (parsed.password === undefined){
    res.send({"success":false,"reason":"password field missing"})
  }
  else if (parsed.username === undefined){
    res.send({"success":false,"reason":"username field missing"})
  }
  else if (passwords.get(parsed.username) === undefined){
    res.send({"success":false,"reason":"User does not exist"})
  }
  else if (passwords.get(parsed.username) != parsed.password){
    res.send({"success":false,"reason":"Invalid password"})
  }
  else if (passwords.get(parsed.username) === parsed.password){  
    //NEED TO GENERATE UNIQUE TOKEN
    let d = new Date();
    let uniqueToken = parsed.username + d.getTime();
    //NEED TO LOGIN USER - can I just use a token?
    tokens.set(uniqueToken, parsed.username);
    res.send({"success":true,"token": uniqueToken});
  }
});

//problem 3 - change-password
app.post("/change-password", (req, res) => {
  let parsed = JSON.parse(req.body);
  let user = tokens.get(req.header('token'));
  let newPassword = parsed.newPassword;
  
  //if token header missing
  if (req.header('token') === undefined){
    
    res.send({"success":false,"reason":"token field missing"});
  }
  else if (user === undefined){
    res.send({"success":false,"reason":"Invalid token"});
  }
  else if (passwords.get(user) != parsed.oldPassword){
    //console.log("User: " + user + ", oldPassword: " + parsed.oldPassword + " , in map: " + passwords.get(user));
    res.send({"success":false,"reason":"Unable to authenticate"});
  }
  //change password
  else{
    
    
    
    passwords.delete(user);
    passwords.set(user, newPassword);
    res.send({"success":true});
  }
  
  
});

//problem 4 - create-listing
app.post("/create-listing", (req, res) => {
  let parsed = JSON.parse(req.body);
  //should be using const instead of let
  const seller = tokens.get(req.header('token'));
  const price = parsed.price;
  const description = parsed.description;
  
  //token header missing
  if (req.header('token') === undefined){
    res.send({"success":false,"reason":"token field missing"});
  }
  //token invalid 
  else if (seller === undefined){
    res.send({"success":false,"reason":"Invalid token"});
  }
  //price missing
  else if (price === undefined){
    res.send({"success":false,"reason":"price field missing"});
  }
  //description missing
  else if (description === undefined){
    res.send({"success":false,"reason":"description field missing"});
  }
  //create array item with new item info and send success response
  else {
    const d = new Date();
    const id = seller + d.getTime();
    items.push({"price": price, 
                "description": description, 
                "itemId": id, 
                "sellerUsername": seller});
    res.send({"success":true,"listingId":id});
  }
  
});

//function to check if itemid is in listings
var inListings;
inListings = (itemId)=>{
  
  for (let i = 0; i<items.length; i++){
    if (items[i].itemId === itemId){
      return true;
    }
  }
  
  return false;
  
}

//problem 5 - listing
app.get("/listing", (req, res) => {
  const itemId = req.query.listingId;
  
  //if item not in listings
  if(!inListings(itemId)){
    res.send({"success":false,"reason":"Invalid listing id"});
  }
  else{
    for (let i = 0; i< items.length; i++){
      if (items[i].itemId === itemId){
        res.send({"success":true,"listing":items[i]});
      }
    }
  }
  
});

//problem 6 - modify-listing
app.post("/modify-listing", (req, res) => {
  const parse = JSON.parse(req.body);
  const user = tokens.get(req.header('token'));
  const item = parse.itemid;
  const newDescription = parse.description;
  const newPrice = parse.price;

  //token header missing
  if (req.header('token') === undefined){
    res.send({"success":false,"reason":"token field missing"});
  }
  //token not valid
  else if (user === undefined){
    res.send({"success":false,"reason":"Invalid token"});
  }
  //itemid field undefined
  else if (item === undefined){
    res.send({"success":false,"reason":"itemid field missing"});
  }
  //update description and price in array
  else{
    for (let i = 0; i< items.length; i++){
      if (items[i].itemId === item){
        if (newDescription != undefined){
          items[i].description = newDescription;
        }
        if (newPrice != undefined){
           items[i].price = newPrice;
        }
        
      }
    }
    res.send({"success":true});
  }
  
});

//problem 7 - add-to-cart
app.post("/add-to-cart", (req, res) => {
  const user = tokens.get(req.header('token'));
  const parse = JSON.parse(req.body);
  const item = parse.itemid;
  
  //token invalid
  if (user === undefined){
    res.send({"success":false,"reason":"Invalid token"});
  }
  //item missing
  else if (item === undefined){
    res.send({"success":false,"reason":"itemid field missing"});
  }
  //item not in listings
  else if (!inListings(item)){
    res.send({"success":false,"reason":"Item not found"});
  }
  //add to cart
  else{
    
    //add to user's activity 
    for (let i = 0; i<activity.length; i++){
      //find right user's activity log 
      if (activity[i].customer === user){
        console.log("ADDING ITEM: " + item + " to cart");
        activity[i].cartItems.push(item);
      }
    }
    
    res.send({"success":true});
  }
  
  
});

//problem 8 - cart
app.get("/cart", (req, res) => {
  const user = tokens.get(req.header('token'));
  
  if (user === undefined){
    res.send({"success":false,"reason":"Invalid token"});
  }
  else {
    //find user in activity array
    for (let i = 0; i<activity.length; i++){
      if (activity[i].customer === user){
        let allCartItems = [];
        
        //for all cartItems 
        for (let j=0; j<activity[i].cartItems.length; j++){
          
          //for all items, check if cartItem
          for (let k=0; k<items.length; k++){
            if(items[k].itemId === activity[i].cartItems[j]){
             
              //if cart item, add to allCartItems
              allCartItems.push(items[k]);
              
            }
          }
        }
        
        res.send({"success": true, "cart": allCartItems});
      }  
    }
    
  }
  
});

let inItems = (user) => {
  let answer = true;
  
  for (let i = 0; i<activity.length; i++){
    //for user
    if (activity[i].customer === user){
      //for each item
      for(let j=0; j<activity[i].cartItems.length; j++){
        let check = false;
        //compare to all items in items
        for (let k=0; k<items.length; k++){
          
          if (items[k].itemId === activity[i].cartItems[j]){
          console.log("User: " + user + "checking if " + activity[i].cartItems[j] + " is " + items[k].itemId);
            check = true;
          }      
        }
        if (!check){
          answer = false;
        }
        
      }
    }
  }
  return answer;
}

let cartEmpty = (user) => {
  for (let i = 0; i<activity.length; i++){
    if (activity[i].customer === user){
      if (activity[i].cartItems.length === 0){
        return true; 
      }
      else{
        return false;
      }
    }
  }
}


//problem 9 - checkout
app.post("/checkout", (req, res) => {
  const user = tokens.get(req.header('token'));
  
  if (user === undefined){
    res.send({"success":false,"reason":"Invalid token"});
  }
  else if (!inItems(user)){
    
    res.send({"success":false,"reason":"Item in cart no longer available"});
  }
  else if (cartEmpty(user)){
    res.send({"success":false,"reason":"Empty cart"});
  }
  else{
    //move items from cart to checkout
    
    //start by removing items from items 
    for (let i=0; i<activity.length; i++ ){
      if (activity[i].customer === user){
        
        for (let k=0; k<activity[i].cartItems.length; k++){
          
          for (let l=0; l<items.length; l++){
            //console.log("item checking: " + items[l].itemId);
            if (items[l].itemId === activity[i].cartItems[k]){
             //console.log("Removing item " + items[l].itemId + " which is equal to " + activity[i].cartItems[k]); 
              var testhold = [];
              testhold = JSON.parse(JSON.stringify(items[l]));
              activity[i].purchased.push(testhold);
              
              items.splice(l,1);
             
            }
          }
        }
        
        //them, move items from cart to purchased
        //let hold = [];
        
        //hold = [...activity[i].cartItems];   
        //console.log("Pushing " + hold + " to purchased");
        //activity[i].purchased.push(hold);
        //console.log(hold);
        
        
        //set cart length to zero to clear it
        activity[i].cartItems.length = 0;
        //add cartItems to purchased
       
        
        console.log(activity[i].purchased);
      }
      
    }
    
    res.send({"success":true});
  }
  
  
});

//problem 10 - purchase-history
app.get("/purchase-history", (req, res) => {
  const user = tokens.get(req.header('token'));
  
  if (user === undefined){
    res.send({"success":false,"reason":"Invalid token"});
  }
  else {
    for(let i=0; i<activity.length; i++){
     if (activity[i].customer === user){
       let purchasedItems = activity[i].purchased;
       
       
       for (let j=0; j<purchasedItems.length; j++){
         
         
         
       }
       
       res.send({"success": true, "purchased": purchasedItems});
     } 
    }
    
    
    
  }
});


//problem 11- chat
app.post("/chat", (req, res) => {
  const user = tokens.get(req.header('token'));
  //const parse = JSON.parse(req.body);
  
  console.log(req.body);
  var destination;
  var contents;
  try {
    var parse = JSON.parse(req.body);
    destination = parse.destination;
    contents = parse.contents;
  }
  catch(err) {
    console.log("nothing in body");
    destination = undefined;
    contents = undefined;
  }
  
  
  //const destination = req.body.destination;
  //const contents = req.body.contents;
  
  
  console.log("destination: " + destination);
  console.log("contents: " + contents);
  
  
  var inAllChat = (user, destination) => {
    let found = false;
    for(let i=0;i<allChat.length; i++){
      if (allChat[i].user === user){
        for(let j=0;j<allChat[i].chats.length; j++){
          if(allChat[i].chats[j].destionation === destination){
            found = true
          }
        }
      }
    }
    return found;
  }
  
  if (user === undefined){
    res.send({"success":false,"reason":"Invalid token"});
  }
  else if (destination === undefined){
    res.send({"success":false,"reason":"destination field missing"});
  }
  else if (contents === undefined){
    res.send({"success":false,"reason":"contents field missing"});
  }
  else if (passwords.get(destination) === undefined){
    res.send({"success":false,"reason":"Destination user does not exist"});
  }else{
    
    if(!inAllChat(user, destination)){
      for(let i=0; i<allChat.length; i++){
      
      if (allChat[i].user === user){
       allChat[i].chats.push({"destination": destination, "messages":[]});
    }
    }
    }
    if(!inAllChat(destination, user)){
      for(let i=0; i<allChat.length; i++){
      
      if (allChat[i].user === destination){
       allChat[i].chats.push({"destination": user, "messages":[]});
    }
    }
    }
      
      
    for(let i=0; i<allChat.length; i++){
      //every user has an allChat object
      if (allChat[i].user === user){
        for(let j=0; j<allChat[i].chats.length; j++){
          if(allChat[i].chats[j].destination === destination){
            allChat[i].chats[j].messages.push({"from": user, "contents": contents});
          }
        }
      }
      
      if(allChat[i].user === destination){
        for(let j=0; j<allChat[i].chats.length; j++){
          if(allChat[i].chats[j].destination === user){
            allChat[i].chats[j].messages.push({"from": user, "contents": contents});
          }
        }
      }
      
      
      
    }
    
   //allChat.push({
     //"user": user, 
     //"chats": {
       //"destination": destination,
       //"messages": contents
     //}
   //})
    
    res.send({"success":true});
  }
  
});

//problem 12 - chat-messages
app.post("/chat-messages", (req, res) => {
  const user = tokens.get(req.header('token'));
  
  var destination;
  try {
    var parse = JSON.parse(req.body);
    destination = parse.destination;
  }
  catch(err) {
    console.log("nothing in body");
    destination = undefined;
  }
  
  if(user === undefined){
    res.send({"success":false,"reason":"Invalid token"});
  }
  else if (destination === undefined){
    res.send({"success":false,"reason":"destination field missing"});
  }
  else if(passwords.get(destination) === undefined){
    res.send({"success":false,"reason":"Destination user not found"});
  }else{
    for (let i=0; i<allChat.length; i++){
      if(allChat[i].user === user){
        for(let j=0; j<allChat[i].chats.length; j++){
          if (allChat[i].chats[j].destination === destination){
            res.send({"success": true, "messages": allChat[i].chats[j].messages});
          }
        }
      }
    }
  }
  
});

//problem 13 - ship
app.post("/ship", (req, res) => {
  
});

//problem 14 - status
app.get("/status", (req, res) => {
  
});

//problem 14 - review-seller
app.post("/review-seller", (req, res) => {
  
});

//problem 15 - reviews
app.get("/reviews", (req, res) =>{
  
});

//problem 16 - selling
app.get("/selling", (req, res) => {
  
});