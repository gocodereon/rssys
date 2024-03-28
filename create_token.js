const { createClient } = require("redis");
const crypto = require("crypto");
const JWT = require("jsonwebtoken");

function hashUsername(userId) {
  const hash = crypto.createHash("sha256");
  hash.update(userId);
  return hash.digest("hex");
}

async function insertToken(req, res) {
  const { username } = req.body;
  if (!username) {
    return res.status(400).json({ message: "Username is required." });
  }

  try {
    const client = createClient();
    await client.connect();

    const hashedUsername = hashUsername(username);

    const token = await JWT.sign(
      {
        expiresIn: "7d",
      },
      "SECRET_KEY"
    );

    const key = hashedUsername;
    client.set(key, token, { EX: 604800 });

    client.quit();

    return res.status(200).json({ message: "Token inserted successfully!", token });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error." });
  }
}

module.exports = {
  insertToken,
};
