const AWS = require("aws-sdk");

// Function to delete files from an S3 bucket
const deleteFilesS3 = async (bucketName, fileKeys) => {
  try {
    const s3 = new AWS.S3();
    const deleteObjectsParams = {
      Bucket: bucketName,
      Delete: {
        Objects: fileKeys.map(key => ({ Key: key })),
      },
    };
    const result = await s3.deleteObjects(deleteObjectsParams).promise();
    console.log("Delete objects result:", result);
    return result.Deleted.map(deleted => deleted.Key);
  } catch (error) {
    console.error("Error deleting files:", error);
    throw error; // Rethrow the error to be handled by the caller
  }
};

module.exports = { deleteFilesS3 };
