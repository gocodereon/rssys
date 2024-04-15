const express = require("express");
const fetch = require("node-fetch");
const authMiddleware = require("./middleware/checkJWT");
const s3servermod = require("./S3/s3_api.js");
const router = express.Router();

const HASURA_URL = "http://localhost:8080/v1/graphql";
const HASURA_ADMIN_SECRET = "Bb429(a7vkl#";

router.use(authMiddleware);     
                                                
router.post("/update", async (req, res) => {
  const { id, result } = req.body;

  try {
    const s3url = await s3servermod.getFileUrl();
    console.log("Retrieved s3url(update):", s3url); // Add this line for debugging
    const response = await fetch(HASURA_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",                                
        "x-hasura-admin-secret": HASURA_ADMIN_SECRET,
      },
      body: JSON.stringify({
        query: `
          mutation ($id: uuid!, $result: String!) {
            update_result(
              where: { id: { _eq: $id } },
              _set: { result: $result }
            ) {
              affected_rows
            }
          }
        `,
        variables: { id: id, result: result },
      }),
    });

    const data = await response.json();
    // Unlink the s3url from the "files" table
    const responseUnlinkS3Url = await fetch(HASURA_URL, {
      method: "POST",
      headers: {
          "Content-Type": "application/json",
          "x-hasura-admin-secret": HASURA_ADMIN_SECRET,
      },
      body: JSON.stringify({
          query: `
              mutation UnlinkS3Url($id: uuid!) {
                  update_files(
                      where: { result_id: { _eq: $id } },
                      _set: { s3url: null }
                  ) {
                      affected_rows
                  }
              }
          `,
          variables: { id: id},
      }),
    });

    const responseInsertNewFile = await fetch(HASURA_URL, {
      method: "POST",
      headers: {
          "Content-Type": "application/json",
          "x-hasura-admin-secret": HASURA_ADMIN_SECRET,
      },
      body: JSON.stringify({
          query: `
              mutation InsertNewFile($s3url: String!, $resultId: uuid!) {
                  insert_files(objects: { s3url: $s3url, result_id: $resultId }) {
                      affected_rows
                      returning {
                          id
                      }
                  }
              }
          `,
          variables: { s3url: s3url, resultId: id },
      }),
  });

    res.json(data)
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/createresult", async (req, res) => {
  const { result } = req.body;

  try {
    const s3url = await s3servermod.getFileUrl();
    console.log("Retrieved s3url:", s3url); // Add this line for debugging
    const response = await fetch(HASURA_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-hasura-admin-secret": HASURA_ADMIN_SECRET,
      },
      body: JSON.stringify({
        query: `
          mutation {
            insert_result(objects: {result: "${result}"}) {
              affected_rows
              returning {
                id
              }
            }
          }
        `,
      }),
    });

    const dataResult = await response.json();
    const resultId = dataResult.data.insert_result.returning[0].id;
   
    // Send the GraphQL mutation to create a new record in the "files" table
    const responseFiles = await fetch(HASURA_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-hasura-admin-secret": HASURA_ADMIN_SECRET,
      },
      body: JSON.stringify({
        query: `
          mutation {
            insert_files(objects: { s3url: "${s3url}", result_id: "${resultId}" }) {
              affected_rows
              returning {
                id
              }
            }
          }
        `,
      }),
    });

    const data = await responseFiles.json();
    res.json(data);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/datarecord", async (req, res) => {
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

module.exports = router;
