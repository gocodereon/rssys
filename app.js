const express = require("express");
const bodyParser = require("body-parser");
const fetch = require("node-fetch");
const crypto = require("crypto");
const routes = require("./route");
const dataRoutes = require("./dataRoutes");
// const authMiddleware = require("./middleware/checkJWT");

const app = express();
const PORT = process.env.PORT || 4000;
const HASURA_URL = "http://localhost:8080/v1/graphql";
const HASURA_ADMIN_SECRET = "Bb429(a7vkl#";
const SECRET_KEY = "Bb429(a7vkl#".padEnd(32, "0");

function encrypt(text, key) {
  const cipher = crypto.createCipheriv("aes-256-cbc", key, Buffer.alloc(16));
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return encrypted;
}

app.use(express.static("public"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use("/", routes);
app.use("/", dataRoutes);

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

app.post("/create", async (req, res) => {
  const { username, password, role } = req.body;

  try {
    const encryptedPassword = encrypt(
      password,
      Buffer.from(SECRET_KEY, "utf8")
    );
    console.log("Encrypted Password:", encryptedPassword);

    const response = await fetch(HASURA_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-hasura-admin-secret": HASURA_ADMIN_SECRET,
      },
      body: JSON.stringify({
        query: `
          mutation {
            insert_login(objects: {username: "${username}", password: "${encryptedPassword}", role: "${role}"}) {
              affected_rows
              returning {
                id
              }
            }
          }
        `,
      }),
    });

    const data = await response.json();
    console.log("Response from Hasura:", data);
    res.json(data);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const encryptedPassword = encrypt(
      password,
      Buffer.from(SECRET_KEY, "utf8")
    );

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
              id
              password
            }
          }
        `,
      }),
    });

    const data = await response.json();

    if (data.data && data.data.login.length > 0) {
      const storedPassword = data.data.login[0].password;

      if (storedPassword === encryptedPassword) {
        res.json({ success: true, message: "Login successful!" });
        console.log("Login successful!");
      } else {
        res.json({ success: false, message: "Invalid username or password." });
        console.log("Invalid username or password.");
      }
    } else {
      res.json({ success: false, message: "Invalid username or password." });
      console.log("Invalid username or password.");
    }
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Fetch data route

app.get("/data", authMiddleware,async (req, res) => {
  const filterDate = req.query.date;

  let query = `
    query {
      result(order_by: { created_at: desc }, limit: 20) {
        id
        result
        created_at
        updated_at
      }
    }
  `;

  if (filterDate) {
    query = `
      query {
        result(where: { created_at: { _eq: "${filterDate}" } }, order_by: { created_at: desc }, limit: 20) {
          id
          result
          created_at
          updated_at
        }
      }
    `;
  }

  try {
    const response = await fetch(HASURA_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-hasura-admin-secret": HASURA_ADMIN_SECRET,
      },
      body: JSON.stringify({
        query: query,
      }),
    });

    const data = await response.json();
    res.json(data.data.result);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Update data route
app.post("/update", authMiddleware ,async (req, res) => {
  const { id, result, date } = req.body;

  console.log("Update request received:", { id, result, date });

  try {
    const response = await fetch(HASURA_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-hasura-admin-secret": HASURA_ADMIN_SECRET,
      },
      body: JSON.stringify({
        query: `
          mutation ($id: Int!, $result: numeric!, $date: date!) {
            update_result(
              where: { id: { _eq: $id } },
              _set: { result: $result, updated_at: $date }
            ) {
              affected_rows
            }
          }
        `,
        variables: { id: parseInt(id), result: parseInt(result), date: date },
      }),
    });

    const data = await response.json();

    res.json(data);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Create data route
app.post("/create", authMiddleware ,async (req, res) => {
  const { result, date } = req.body;
  app.use(authMiddleware);

  try {
    const response = await fetch(HASURA_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-hasura-admin-secret": HASURA_ADMIN_SECRET,
      },
      body: JSON.stringify({
        query: `
          mutation {
            insert_result(objects: {result: "${result}", created_at: "${date}", updated_at: "${new Date().toISOString()}"}) {
              affected_rows
              returning {
                id
              }
            }
          }
        `,
      }),
    });

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
