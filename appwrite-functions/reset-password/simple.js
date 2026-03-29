// Simplified Password Reset Function using your existing API key
import { Client, Users } from 'https://deno.land/x/appwrite@6.0.0/mod.ts';

export default async ({ req, res, log, error }) => {
  try {
    const { email, newPassword } = JSON.parse(req.body);

    if (!email || !newPassword) {
      return res.json({ 
        error: 'Missing email or newPassword' 
      }, 400);
    }

    // Use your existing API key from environment
    const client = new Client()
      .setEndpoint(Deno.env.get('EXPO_PUBLIC_APPWRITE_ENDPOINT'))
      .setProject(Deno.env.get('EXPO_PUBLIC_APPWRITE_PROJECT_ID'))
      .setKey(Deno.env.get('EXPO_PUBLIC_APPWRITE_API_KEY'));

    const users = new Users(client);

    log(`Looking for user: ${email}`);

    // Find user by email
    const userList = await users.list();
    const targetUser = userList.users.find(user => user.email === email);

    if (!targetUser) {
      return res.json({ error: 'User not found' }, 404);
    }

    log(`Found user: ${targetUser.$id}`);

    // Update password
    await users.updatePassword(targetUser.$id, newPassword);

    log(`Password updated for user: ${targetUser.$id}`);

    return res.json({ 
      success: true, 
      message: 'Password updated successfully'
    });

  } catch (err) {
    error('Error:', err);
    return res.json({ 
      error: err.message 
    }, 500);
  }
};
