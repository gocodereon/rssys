const AWS = require("aws-sdk");

const listFiles = async () => {
  const s3 = new AWS.S3();
  const bucketName = "rs-sys-storage";

  try {
    // List objects in the S3 bucket
    const data = await s3.listObjects({ Bucket: bucketName }).promise();

    // Extract file keys from the response
    const files = data.Contents.map((item) => {
      // Add datetime to the filename
      const fileNameWithDatetime = `${item.Key}-${new Date(item.LastModified).toISOString()}`;
      return {
        key: item.Key,
        filename: fileNameWithDatetime,
        size: item.Size,
        lastModified: item.LastModified,
      };
    });

    return files;
  } catch (error) {
    console.error("Error listing files:", error);
    throw error;
  }
};

module.exports = { listFiles };
