"use strict";
//Courtesy of Adam R - this is a stripped down and commented version of his code

//It has been refactored into an 'MVP' 'CRUD' membership database

const express = require("express");
const path=require("path")

const Member = require("./models/members");  //this module *is* our "Model" - it provides access to the data data, and exposes a number of methods for handling the collection (such as '.find()  , .save() and .remove()) 
const cors = require("cors"); //Cors is needed if we want to host on a different domain than the requests are coming from - it's not needed *yet* but you will run into it in production
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

connect(); //conect to the database and start the application listening for HTTP requests


//We need to declare all out function expressions before we used them - the don't execute until they are called by the handlers at the bottom
const createMember = async (req, res) => {

  const member = new Member({
    name: req.body.name,
    email: req.body.email,
    telephone: req.body.telephone
  });

  try {
    const newMember = await member.save();
    res.status(201).json(newMember);  //return a "HTTP 201 Created success status response code indicates that the request has succeeded and has led to the creation of a resource."
                                        //AND return the newMember object as json (In an array)
  } 
  
  catch (e) {
    res.status(400).json({ message: e.message });  //return a "400 Bad Request response status code indicating that the server cannot or will not process the request due to something that is perceived to be a client error (e.g., malformed request syntax, invalid request message framing, or deceptive request routing)."
  }
  
}

const getMemberById = async (req, res, next) => {
  try {

      //Find the member in the databse and store it (temporarily) on the response object - so the next handler has access to it
      res.member = await Member.findById(req.params.id); 
      
      if (!res.member) {
        res.status(404).json({ message: "Cannot find member." });
        return 
      }
  } 
  catch (e) {
      res.status(500).json({ message: e.message });
      return 
  }

  next(); //calls (invokes) the next handler in the chain 
};


const getMemberByName = async (req, res, next) => {
  
  try {
       
        //Find the member in the databse and store it (temporarily) on the response object - so the next handler has access to it
        res.member = await Member.findOne({name: req.params.name}).exec();  //predicate
        if (!res.member) {
          //if there are no matches ...
          res.status(404).json({ message: "Cannot find member." });
          return 
        }

  } catch (e) {
      res.status(500).json({ message: e.message });
        return 
  }
    
  next()  //Invokes the next handler in the chain
  
};

const updateMember = async (req, res) => {

  if (req.body.name) res.member.name = req.body.name;
  if (req.body.email) res.member.email = req.body.email;
  if (req.body.telephone) res.member.telephone = req.body.telephone;
    
  try {
    const updatedMember = await res.member.save();
    res.json(updatedMember);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

const deleteMember = async (req, res) => {
  try {
    await res.member.remove();
    res.json({ message: "Deleted member." });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
}

// 'helper function' to write the member we have found (and temporarily placed on the response object - out as JSON)
const outputMember = (req,res)=> {
  res.json(res.member)
}




//Now we Create/register the HTTP Handlers - functions that will get called for requests matching the 'routes' specified ...

//Creating a Member (*any* POST will call this)
app.post("/api/", createMember)  //  CreateMemmber is the HTTP 'handler' function which will have access to the REQuest and RESposes objects

//Reading a Member (find by name) - the :name will 'capture' anything present at that point in the URL into request.params.name
app.get("/api/:name", getMemberByName, outputMember);   //here we spefic *two* HTTP handlers .. get memberByName will invoke the next handler in the chain (outputMember) by calling 'next()'

//Update a Member - the "http PATCH verb - tells us this is an update" - //It's the RESTful way - https://restcookbook.com/
app.patch("/api/:id", getMemberById, updateMember)  //again two HTTP handlers - chained with next()

//Deleting a Member
app.delete("/api/:id", getMemberById, deleteMember)


