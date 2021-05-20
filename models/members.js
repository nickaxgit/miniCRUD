const mongoose = require("mongoose");

//A 'schema' is (generlly) a description of the structure, requirements, default, and constraints on a data set - it's "metadata" - Data about the data
const schema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  telephone: { type: String, required: true }  
});

module.exports = mongoose.model("Member", schema);  //export the schema as mongoose "model" called "Member" (we will end up with a member collection in the databse)