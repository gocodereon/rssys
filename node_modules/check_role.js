const fetch = require("node-fetch");

const HASURA_URL = "http://localhost:8080/v1/graphql";
const HASURA_ADMIN_SECRET = "Bb429(a7vkl#";

async function checkRole(req, res) {
  const { username } = req.body;
  if (!username) {
    return res.status(400).json({ message: "Username is required." });
  }

  try {
    const response = await fetch(HASURA_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-hasura-admin-secret": HASURA_ADMIN_SECRET,
      },
      body: JSON.stringify({
        query: `
          query {
            login(where: {username: {_eq: "${username}"}}) {
              role
            }
          }          
        `,
      }),
    });

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("Failed to check user role:", error.message);
    throw new Error("Failed to check user role");
  }
}

module.exports = { checkRole };
