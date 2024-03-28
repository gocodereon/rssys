const { createClient } = require('redis');
const crypto = require('crypto');

function hashUsername(userId) {
  const hash = crypto.createHash('sha256');
  hash.update(userId);
  return hash.digest('hex');
}

async function deleteToken(req, res) {
  const { username } = req.body;
  if (!username) {
    return res.status(400).json({ message: 'Username is required.' });
  }

  try {
    const client = createClient();
    await client.connect();
    
    const hashedUsername = hashUsername(username);

    // Check if the token exists
    const tokenExists = await client.exists(hashedUsername);
    if (!tokenExists) {
      client.quit();
      return res.status(404).json({ message: 'Token not found.' });
    }

    // Delete the token
    await client.del(hashedUsername);
    client.quit();

    return res.status(200).json({ message: 'Token deleted successfully!' });

  } catch (error) {
    return res.status(500).json({ message: 'Internal server error.' });
  }
}

module.exports = {
  deleteToken,
};
