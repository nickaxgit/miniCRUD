"use strict";
//Courtesy of Adam R - this is a stripped down and commented version of his code

//It has been refactored into an 'MVP' 'CRUD' membership database

const express = require("express");
const path=require("path")

const Member = require("./models/members");  //this module *is* our "Model" - it provides access to the data data, and exposes a number of methods for handling the collection (such as '.find()  , .save() and .remove()) 
const cors = require("cors"); //Cors is needed if we want to host on a different domain that the requests are coming from - it's not needed *yet* but you will run into it in production
const mongoose = require("mongoose");  //Mongoose provides an extra 'layer' on top of MongoDB  it helps to enforce *some* structure 

const app=express()  

const PORT = process.env.PORT || 3000; 

let db  // a reference to the database

app.use(express.json())  // if you leave the () off here - you get a horrendous series of silent errors that takes you 2 hours to debug (ask me how I know)
app.use(cors())
app.use(express.static(__dirname));  //the static handler will serve our HTML and Image files


const connect = async () => {
  const URL =
    process.env.DATABASE_URL ||
    "mongodb://localhost";
  mongoose.connect(URL, { useNewUrlParser: true, useUnifiedTopology: true });
  db = mongoose.connection;
  db.on("error", (err) => error("Connection error: " + err));
  db.once("open", () => app.listen(PORT, () => console.log(`Server is running on ${PORT}`)));  //we defer the normal "app.listen() - until the database has started up (bad things would happen if we started accepting requests before the database was running)"
};

connect();

/*const getMember = async (req, res, next) => {
    try {
        res.member = await Members.findById(req.params.id); //if we find it we create a 'member' value on the response object - to make it accessible to the next() function
        if (!res.member) return res.status(404).json({ message: "Cannot find member." });
  } catch (e) {
        return res.status(500).json({ message: e.message });
  }
  next(); //calls the 'success' function to return the reuslt
};
*/


const getMemberById = async (req, res,next) => {
  try {
      const member = await Member.findById(req.params.id); //if we find it we create a 'member' value on the response object - to make it accessible to the next() function
      
      if (!member) {
        res.status(404).json({ message: "Cannot find member." });
        return 
      }
  } 
  catch (e) {
      res.status(500).json({ message: e.message });
      return 
  }

  res.member = member //store the member on the response object - so the next handler has access to it
  next(); //calls the next handler in the chain 
};

//This the handler (function expression) specified by the get method on the router 
const getMembersByName = async (req, res) => {
    
  let members
    try {
        //const member = await Member.findById(req.params.id); //if we find it we create a 'member' value on the response object - to make it accessible to the next() function
        
        members = await Member.find({name: req.params.name});  //predicate
        if (!members) {
          //if there are no matches ...
          res.status(404).json({ message: "Cannot find member." });
          return 
        }

  } catch (e) {
      res.status(500).json({ message: e.message });
        return 
  }
  
  res.json(members)  //output the memebers we have found
  
};



//Creating a Member (*any* POST will call this)
app.post("/*", async (req, res) => {

  const member = new Member({
    name: req.body.name,
    email: req.body.email,
    telephone: req.body.telephone
  });

  try {
    const newMember = await member.save();
    res.status(201).json([newMember]);  //return a "HTTP 201 Created success status response code indicates that the request has succeeded and has led to the creation of a resource."
                                        //AND return the newMember object as json (In an array)
  } 
  
  catch (e) {
    res.status(400).json({ message: e.message });  //return a "400 Bad Request response status code indicating that the server cannot or will not process the request due to something that is perceived to be a client error (e.g., malformed request syntax, invalid request message framing, or deceptive request routing)."
  }

  
  
});

//Reading a Member (find by name)
app.get("/:name", getMembersByName);   


//Update a Member - the "http PATCH verb - tells us this is an update"
//It's the RESTful way - https://restcookbook.com/

app.patch("/:id", getMemberById, async (req, res) => {
  if (req.body.name) res.name = req.body.name;
  if (req.body.email) res.email = req.body.email;
  if (req.body.telephone) res.member.telephone = req.body.technologies;
  
  try {
    const updatedMember = await res.member.save();
    res.json(updatedMember);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});


//Deleting a Member
app.delete("/:id", getMemberById, async (member) => {
  try {
    await member.remove();
    res.json({ message: "Deleted member." });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});



/*
const getAllMembers = async (req, res) => {
  try {
    const members = await Member.find(); // calling find with no 'predicate' (conditions to match) - will return all members
    res.json(members);  //Exactly equivilent to (just a short version of) res.write(JSON.Stringify(member))
  } catch (e) {
    res.status(500).json({ messeage: e.message });
  }
}

//Getting All
app.get("/all", getAllMembers );
*/



