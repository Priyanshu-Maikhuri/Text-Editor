const { Schema, model } = require("mongoose");

module.exports = model(
  "Document",
  new Schema({
    _id: String,
    data: Object,
  })
);
