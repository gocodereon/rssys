const JWT = require("jsonwebtoken");

const authMiddleware = async (req, res, next) => {
  const token = req.header("x-auth-token");

  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  } else {
    try {
      let user = await JWT.verify(token, "SECRET_KEY");
      console.log(user.email);
      req.user = user.email;
      next();
    } catch {
      return res.status(401).json({ message: "Unauthorized" });
    }
  }
};

module.exports = authMiddleware;
