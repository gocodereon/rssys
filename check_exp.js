const { createClient } = require("redis");
const crypto = require("crypto");
const JWT = require("jsonwebtoken");

function hashUsername(userId) {
  const hash = crypto.createHash("sha256");
  hash.update(userId);
  return hash.digest("hex");
}

async function checkExp(req, res) {
  const { username } = req.body;
  if (!username) {
    return res.status(400).json({ message: "Username is required.", status: "Username Not Found" });
  }

  try {
    const client = createClient();
    await client.connect();

    const hashedUsername = hashUsername(username);

    const token = await client.get(hashedUsername);
    if (!token) {
      client.quit();
      return res.status(404).json({ message: "User not found.", status: "Not Found" });
    }

    const decodedToken = JWT.decode(token);

    const expiration = decodedToken.exp;
    const currentTime = Math.floor(Date.now() / 1000);
    if (expiration < currentTime) {
      await client.del(hashedUsername);

      const newToken = await JWT.sign(
        {
          expiresIn: "7d",
        },
        "SECRET_KEY"
      );

      client.set(hashedUsername, newToken, { EX: 604800 });

      client.quit();

      return res.status(200).json({
        message: "Token expired. Deleted old token and generated a new one.",
        status: "generate",
        token: newToken,
      });
    }

    client.quit();

    return res.status(200).json({ message: "Token not yet expired.", status: "Online" });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error.", status: "Error" });
  }
}

module.exports = {
  checkExp,
};
