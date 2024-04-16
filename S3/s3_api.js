const express = require("express");
const bodyParser = require("body-parser");
const AWS = require("aws-sdk");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const mimeTypes = require("mime-types");
const { listFiles } = require("./listfiles.js");
const { deleteFilesS3 } = require("./delete.js");

function s3servermod(app) {
  // Create an S3 client
  const s3Client = new AWS.S3({
    region: "ap-southeast-1",
    credentials: {
      accessKeyId: "AKIA3FLD3NFAASREUKJO",
      secretAccessKey: "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",
    },
  });

  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(bodyParser.json());

  // Set up Multer middleware to handle file uploads
  const upload = multer({ dest: "uploads/" });
  let fileUrl = "";
 // Function to set the fileUrl value and execute a callback
  const setFileUrl = (url, callback) => {
    fileUrl = url;
    callback(); // Execute the callback after updating fileUrl
  };
  // Route to handle file uploads
  app.post("/upload", upload.single("file"), (req, res) => {
    try {
      const file = req.file;
      const fileName = generateFileName(file.originalname); // Generate filename with datetime
      const filePath = file.path;

      // Set up parameters for uploading the file to S3
      const params = {
        Bucket: "rs-sys-storage",
        Key: fileName,
        Body: fs.createReadStream(filePath),
      };
      // Upload the file to S3
      s3Client.upload(params, async (err, data) => {
        if (err) {
          console.error("Error uploading file to S3:", err);
          res
            .status(500)
            .json({ error: "Internal Server Error", details: err.message });
          } else {
            console.log("(s3api)File uploaded successfully:", data.Location);
            // Call setFileUrl and pass a callback function to handle completion
            setFileUrl(data.Location, () => {
              console.log("(s3api)fileUrl:", fileUrl); // File URL is now updated
              res.json({
                message: "File uploaded successfully",
                fileUrl: data.Location,
              });
            });
          }
        });
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({ error: "Internal Server Error", details: error.message });
    }
  });
  // Function to generate filename with datetime
  const generateFileName = (originalName) => {
    const date = new Date().toISOString().replace(/[-T:\.Z]/g, "");
    const extension = originalName.split(".").slice(0, -1).join(".");
    console.log("Extension:", extension);
    return `${extension}.${date}`;
  };
  // Get the directory name of the current module
  const __dirname = process.cwd();

  app.get("/admin_store_result.html", (req, res) => {
    const htmlPath2 = path.resolve(__dirname, "../public/admin_store_result.html");
    res.sendFile(htmlPath2);
  });

  // Route to fetch file list
  app.get("/fileList", async (req, res) => {
    try {
      const files = await listFiles();
      res.json(files);
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({ error: "Internal Server Error", details: error.message });
    }
  });

  // Route to delete files
  app.post("/deleteFiles", async (req, res) => {
    try {
      const bucketName = "rs-sys-storage";
      const { fileKeys } = req.body;
      console.log("Deleting files:", fileKeys);
      const deletedKeys = await deleteFilesS3(bucketName, fileKeys);
      console.log("Files deleted successfully:", deletedKeys);
      res.json({ message: "Files deleted successfully-S3", deletedKeys });
    } catch (error) {
      console.error("Error deleting files:", error);
      res
        .status(500)
        .json({ error: "Internal Server Error", details: error.message });
    }
  });
  // Route to view a file
  app.get("/viewFile", async (req, res) => {
    try {
      const fileKey = req.query.key; // Extract file key from query parameters
      const s3 = new AWS.S3();
      const params = { Bucket: "rs-sys-storage", Key: fileKey };

      const fileStream = s3.getObject(params).createReadStream();
      mimeTypes.lookup(fileKey, (err, contentType) => {
        if (err) {
          console.error("Error getting MIME type:", err);
          res
            .status(500)
            .json({ error: "Internal Server Error", details: err.message });
        } else {
          res.set("Content-Type", contentType || "application/octet-stream");
          res.set("Content-Disposition", "inline");
          fileStream.pipe(res);
        }
      });
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({ error: "Internal Server Error", details: error.message });
    }
  });

  module.exports.getFileUrl = () => fileUrl;

  return app;
}

module.exports = s3servermod;