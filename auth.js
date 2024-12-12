import jsonwebtoken from 'jsonwebtoken';

const secretKey = "gommit";

const auth = (req, res, next) => {
  let token = req.headers.authorization || '';

  if (!token) {
    return next(new Error('No autorizado: No se proporcionó un token'));
  }

  // Extrae el token después de 'Bearer'
  token = token.split(' ')[1];

  // Verifica el token y asigna userId si es válido
  jsonwebtoken.verify(token, secretKey, (error, decoded) => {
    if (error) {
      return next(new Error('No autorizado: Token inválido o expirado'));
    }

    // Asigna el userId al objeto req para su uso en los resolvers
    req.userId = decoded.userId; 
    next(); // Continua si el token es válido
  });
};

// Manejo de errores de autenticación
const autError = (err, req, res, next) => {
  res.status(401).json({ error: err.message });
};

export { auth, autError };
