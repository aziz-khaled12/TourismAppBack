const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET;

const authenticateUser = (req, res, next) => {
  const token = req.headers.authorization.split(' ')[1];

  if (!token) {
    console.log("token does not exist");
    return res
      .status(401)
      .json({ error: "Authentication required - No token provided" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      console.error("Error authenticating user:", error);
      return res.status(401).json({ error: "Authentication failed" });
    } else {
      console.error("Error authenticating user:", error);
      return res.status(500).json({ error: "Authentication failed" }); // More generic error
    }
  }
};

module.exports = authenticateUser;
