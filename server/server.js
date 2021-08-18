require("./config/config");

const express = require("express");
const mongoose = require("mongoose");

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json()); // To parse the incoming requests with JSON payloads

app.use(require("./routes/usuario"));

mongoose.connect(
  // "mongodb://localhost:27017/cafe",
  process.env.URLDB,
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
    useCreateIndex: true,
  },

  (err) => {
    if (err) throw err;

    console.log("Base datos online");
  }
);

app.listen(process.env.PORT, () => {
  console.log("escuchando puerto ", process.env.PORT);
});
