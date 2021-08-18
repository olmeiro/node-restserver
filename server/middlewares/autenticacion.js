const jwt = require("jsonwebtoken");

//================
//Verificar token
//================

let verificaToken = (req, res, next) => {
  //leemos headers
  let token = req.get("token"); //o Authorization

  //verificacion token con jwt
  jwt.verify(token, process.env.SEED, (err, decoded) => {
    if (err) {
      return res.status(401).json({
        ok: false,
        err: {
          message: "Token no válido.",
        },
      });
    }
    //decode = payload
    req.usuario = decoded.usuario;
    next();
  });
};

//================
//Verifica adminRole
//================
let verificaAdmin_Role = (req, res, next) => {
  let usuario = req.usuario;

  if (usuario.role === "ADMIN_ROLE") {
    next();
  } else {
    return res.json({
      ok: false,
      err: {
        message: "El usuario no es administrador.",
      },
    });
  }
};

module.exports = { verificaToken, verificaAdmin_Role };
