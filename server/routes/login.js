const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const { OAuth2Client } = require("google-auth-library");
const client = new OAuth2Client(process.env.CLIENT_ID);

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

//Configuraciones de Google:

async function verify(token) {
  const ticket = await client.verifyIdToken({
    idToken: token,
    audience: process.env.CLIENT_ID, // Specify the CLIENT_ID of the app that accesses the backend
    // Or, if multiple clients access the backend:
    //[CLIENT_ID_1, CLIENT_ID_2, CLIENT_ID_3]
  });
  const payload = ticket.getPayload();
  // console.log(payload.name);
  // console.log(payload.email);
  // console.log(payload.picture);

  return {
    nombre: payload.name,
    email: payload.email,
    img: payload.picture,
    google: true,
  };
}

app.post("/google", async (req, res) => {
  let token = req.body.idtoken;

  let googleUser = await verify(token).catch((e) => {
    return res.status(403).json({
      ok: false,
      err: e,
    });
  });

  //validaciones de usuario:

  Usuario.findOne({ email: googleUser.email }, (err, usuarioBD) => {
    if (err) {
      return res.status(500).json({
        ok: false,
        err,
      });
    }

    //Si existe el usuario en BD:
    if (usuarioBD) {
      //Si el usuario existe en BBDD
      if (usuarioBD.google === false) {
        //Si no se ha autenticado por google
        return res.status(400).json({
          ok: false,
          err: {
            message: "Debe de usar su autenticación normal",
          },
        });
      } else {
        //que sea autentica mediante google, renuevo el token
        let token = jwt.sign(
          {
            usuario: usuarioBD,
          },
          process.env.SEED,
          { expiresIn: process.env.CADUCIDAD_TOKEN } //expire in 30 days
        );

        return res.json({
          ok: true,
          usuario: usuarioBD,
          token,
        });
      }
    } else {
      //si el usuario no existe en BBDD: será un nuevo usuario.
      let usuario = new Usuario();

      usuario.nombre = googleUser.nombre;
      usuario.email = googleUser.email;
      usuario.img = googleUser.img;
      usuario.google = true;
      usuario.password = ":)"; //esto solo para pasar la validación de BD.esta required.

      usuario.save((err, usuarioBD) => {
        if (err) {
          return res.status(500).json({
            ok: false,
            err,
          });
        }

        let token = jwt.sign(
          {
            usuario: usuarioBD,
          },
          process.env.SEED,
          { expiresIn: process.env.CADUCIDAD_TOKEN } //expire in 30 days
        );

        return res.json({
          ok: true,
          usuario: usuarioBD,
          token,
        });
      });
    }
  });
});

module.exports = app;
