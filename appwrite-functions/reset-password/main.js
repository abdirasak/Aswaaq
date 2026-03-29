// Password Reset Function (Node 18 runtime)
// Updates a user's password using node-appwrite SDK and an API key

import { Client, Users } from 'node-appwrite';

export default async ({ req, res, log, error }) => {
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const { email, newPassword } = body;

    if (!email || !newPassword) {
      return res.json({ error: 'Missing email or newPassword' }, 400);
    }

    const endpoint = process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT || process.env.APPWRITE_ENDPOINT;
    const projectId = process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID || process.env.APPWRITE_PROJECT_ID;
    const apiKey = process.env.EXPO_PUBLIC_APPWRITE_API_KEY || process.env.APPWRITE_API_KEY;

    if (!endpoint || !projectId || !apiKey) {
      return res.json({ error: 'Missing Appwrite environment variables' }, 500);
    }

    const client = new Client()
      .setEndpoint(endpoint)
      .setProject(projectId)
      .setKey(apiKey); // Admin API key

    const users = new Users(client);

    log(`Searching for user with email: ${email}`);

    // Find user by email (basic scan; for large projects consider server-side search)
    try {
      const userList = await users.list();
      let targetUser = null;

      for (const user of userList.users) {
        if (user.email === email) {
          targetUser = user;
          break;
        }
      }

      if (!targetUser) {
        log(`User not found with email: ${email}`);
        return res.json({ error: 'User not found' }, 404);
      }

      log(`Found user: ${targetUser.$id} with email: ${email}`);

      // Update user password using admin privileges
      // Note: This uses the Users API with admin key
      await users.updatePassword(
        targetUser.$id,
        newPassword
      );

      log(`Password updated successfully for user: ${targetUser.$id}`);

      return res.json({ 
        success: true, 
        message: 'Password updated successfully',
        userId: targetUser.$id
      });

    } catch (updateError) {
      error('Failed to update password:', updateError);
      
      // Unable to update password
      return res.json({ error: 'Failed to update password' }, 500);
    }

  } catch (err) {
    const message = err?.message || String(err);
    error(message);
    return res.json({ error: message }, 500);
  }
};
