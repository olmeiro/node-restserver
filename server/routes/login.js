const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const Usuario = require("../models/usuario");

const app = express();

app.post("/login", (req, res) => {
  let body = req.body;

  Usuario.findOne({ email: body.email }, (err, usuarioDB) => {
    if (err) {
      return res.status(500).json({
        ok: false,
        err,
      });
    }

    //verifico sino viene email:
    if (!usuarioDB) {
      return res.status(400).json({
        ok: false,
        err: {
          message: "(Usuario) o contraseña incorrectos.",
        },
      });
    }

    //evaluo contraseña:
    if (!bcrypt.compareSync(body.password, usuarioDB.password)) {
      //estamos comparanado pw de usuario con pw de bd
      return res.status(400).json({
        ok: false,
        err: {
          message: "Usuario o (contraseña) incorrectos.",
        },
      });
    }

    let token = jwt.sign(
      {
        usuario: usuarioDB,
      },
      process.env.SEED,
      { expiresIn: process.env.CADUCIDAD_TOKEN } //expire in 30 days
    );

    res.json({
      ok: true,
      usuario: usuarioDB,
      token,
    });
  });
});

module.exports = app;
