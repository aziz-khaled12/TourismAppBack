const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET;

const authenticateUser = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    console.log("Authorization header does not exist");
    return res
      .status(401)
      .json({ error: "Authentication required - No token provided" });
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    console.log("Token does not exist");
    return res
      .status(401)
      .json({ error: "Authentication required - No token provided" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next(); // Only call next() if token verification succeeds
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      console.error("Error authenticating user:", error);
      return res.status(401).json({ error: "Authentication failed - JWT malformed" });
    } else {
      console.error("Error authenticating user:", error);
      return res.status(500).json({ error: "Authentication failed - Internal server error" });
    }
  }
};


module.exports = authenticateUser;
