const JWT = require("jsonwebtoken");

const excludedRoutes = ["/login", "/create", "/"];

const authMiddleware = async (req, res, next) => {
  const token = req.header("x-auth-token");

  if (excludedRoutes.includes(req.path)) {
    return next();
  }

  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  } else {
    try {
      let tokenexp = await JWT.verify(token, "SECRET_KEY");
      const tokenIat = new Date(tokenexp.iat * 1000);
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      if (tokenIat < sevenDaysAgo) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      req.tokenexp = tokenexp.iat;
      next();
    } catch {
      return res.status(401).json({ message: "Unauthorized" });
    }
  }
};

module.exports = authMiddleware;
