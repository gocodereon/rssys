const JWT = require("jsonwebtoken");
const fetch = require("node-fetch");

const excludedRoutes = ["/login", "/create", "/","aws-delete.html"];

async function checkRole(username) {
  try {
    const response = await fetch(`http://localhost:4000/check_role`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username }),
    });

    const responseData = await response.json();

    if (response.ok) {
      return responseData.data.login[0].role;
    } else {
      console.log(responseData.message);
      return null;
    }
  } catch (error) {
    console.log(error.message);
    return null;
  }
}

const authMiddleware = async (req, res, next) => {
  const token = req.header("x-auth-token");

  if (excludedRoutes.includes(req.path)) {
    return next();
  }

  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  } else {
    try {
      let tokenexp = await JWT.verify(
        token,
        "NZz58bsIo3d3XPZsfN0NOm92z9FMfnKgXwovR9fp6ryDIoGRM8HuHLB6i9sc0ig"
      );
      const tokenIat = new Date(tokenexp.iat * 1000);
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const role = await checkRole(tokenexp.username);

      if (tokenIat < sevenDaysAgo) {
        return res.status(401).json({ message: "Unauthorized" });
      } else if (req.path === "/update" && role !== 3 && role !== 2) {
        return res.status(401).json({ message: "Unauthorized", role: role });
      }

      req.tokenexp = tokenexp.iat;
      next();
    } catch (error) {
      console.log(error.message);
      return res.status(401).json({ message: "Unauthorized" });
    }
  }
};

module.exports = authMiddleware;
