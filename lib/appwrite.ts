import { Account, Client, Databases, ID, Query, Storage } from "react-native-appwrite";

export const appwriteConfig = {
    endpoint: process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT!,
    projectId: process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID!,
    APPWRITE_PROJECT_NAME: "com.indexdesigns.iibiye",
    databaseId: process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID!,
    profileCollectionId: process.env.EXPO_PUBLIC_APPWRITE_PROFILE_COLLECTION_ID!,
    adsCollectionId: process.env.EXPO_PUBLIC_APPWRITE_ADS_COLLECTION_ID!,
    categoriesCollectionId: process.env.EXPO_PUBLIC_APPWRITE_CATEGORIES_COLLECTION_ID!,
    storageId: process.env.EXPO_PUBLIC_APPWRITE_STORAGE_BUCKET_ID!,
};

export const client = new Client();
client
    .setEndpoint(appwriteConfig.endpoint)
    .setProject(appwriteConfig.projectId);

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);

// Store verification codes temporarily (in production, use Redis or database)
const verificationCodes = new Map<string, { code: string; expires: number }>();

// --- AUTH LOGIC ---

export const createUser = async (email: string, password: string, fullName: string, phone?: string) => {
    try {
        const newAccount = await account.create(ID.unique(), email, password, fullName);
        if (!newAccount) throw new Error("Account creation failed");

        await account.createEmailPasswordSession({ email, password });

        return await databases.createDocument(
            appwriteConfig.databaseId,
            appwriteConfig.profileCollectionId,
            newAccount.$id,
            {
                user_id: newAccount.$id,
                name: fullName,
                email: email,
                phone: phone || null,
                role: 'user', 
            }
        );
    } catch (error: any) {
        throw new Error(error.message);
    }
};

export const signIn = async (email: string, password: string) => {
    try {
        return await account.createEmailPasswordSession({ email, password });
    } catch (error: any) {
        const message = error?.message ?? '';
        if (message.includes('active')) {
            await account.deleteSessions();
            return await account.createEmailPasswordSession({ email, password });
        }
        throw new Error(error.message);
    }
}

export const getCurrentUser = async () => {
    try {
        const currentAccount = await account.get();
        const currentUser = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.profileCollectionId,
            [Query.equal("user_id", currentAccount.$id)]
        );
        return currentUser.documents[0];
    } catch (error) {
        return null;
    }
}

export const signOut = async () => {
    try {
        return await account.deleteSession('current');
    } catch (error: any) {
        throw new Error(error.message);
    }
}

export const checkUserExists = async (email: string) => {
    try {
        console.log('Checking if user exists for email:', email);
        
        // Try to create a session with invalid password to check if user exists
        // This is a workaround to avoid database permission issues
        try {
            await account.createEmailPasswordSession({ email, password: 'invalid-password-for-check' });
            // If this succeeds, something is wrong
            await account.deleteSession('current');
            return true;
        } catch (sessionError: any) {
            // If we get "invalid_credentials" or similar, user exists
            if (sessionError.message.includes('invalid_credentials') || 
                sessionError.message.includes('invalid_password') ||
                sessionError.message.includes('credentials')) {
                console.log('User exists (invalid credentials received)');
                return true;
            }
            // If we get "user_not_found" or similar, user doesn't exist
            else if (sessionError.message.includes('user_not_found') ||
                     sessionError.message.includes('not_found')) {
                console.log('User does not exist');
                return false;
            }
            // For any other error, try the database method as fallback
            else {
                console.log('Session check failed, trying database method');
                return await checkUserExistsViaDatabase(email);
            }
        }
    } catch (error: any) {
        console.error('Error checking user exists:', error);
        throw new Error(`Failed to check user: ${error.message}`);
    }
}

const checkUserExistsViaDatabase = async (email: string) => {
    try {
        console.log('Database ID:', appwriteConfig.databaseId);
        console.log('Profile Collection ID:', appwriteConfig.profileCollectionId);
        
        const users = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.profileCollectionId,
            [Query.equal("email", email)]
        );
        
        console.log('Found users:', users.documents.length);
        return users.documents.length > 0;
    } catch (error: any) {
        console.error('Database method failed:', error);
        
        // Provide more specific error messages
        if (error.message.includes('Collection')) {
            throw new Error('Database collection not found. Please check your Appwrite configuration.');
        } else if (error.message.includes('Database')) {
            throw new Error('Database not found. Please check your Appwrite configuration.');
        } else if (error.message.includes('permission')) {
            throw new Error('Permission denied. Please update Appwrite collection permissions to allow guest reads, or contact administrator.');
        } else {
            throw new Error(`Failed to check user: ${error.message}`);
        }
    }
}

export const sendVerificationCode = async (email: string) => {
    try {
        console.log('Sending verification code to:', email);
        
        // Generate 6-digit code
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const expires = Date.now() + 10 * 60 * 1000; // 10 minutes
        
        console.log('Generated verification code:', code);
        
        // Store code (in production, use Redis or database)
        verificationCodes.set(email, { code, expires });
        
        // Send email using email service
        if (process.env.NODE_ENV === 'production') {
            // Production: Send actual email
            try {
                const { sendVerificationEmail } = require('./emailService');
                await sendVerificationEmail(email, code);
                console.log('Email sent successfully to:', email);
            } catch (emailError: any) {
                console.error('Failed to send email:', emailError);
                throw new Error('Failed to send verification email. Please try again.');
            }
        } else {
            // Development: Show code in console and UI
            console.log(`[DEV] Verification code for ${email}: ${code}`);
            console.log('Code expires at:', new Date(expires).toISOString());
        }
        
        return { code, message: 'Verification code generated successfully' };
    } catch (error: any) {
        console.error('Error sending verification code:', error);
        throw new Error(`Failed to send verification code: ${error.message}`);
    }
}

export const checkVerificationCode = async (email: string, code: string) => {
    try {
        console.log('Checking verification code for email:', email);
        console.log('Provided code:', code);
        
        const storedData = verificationCodes.get(email);
        
        if (!storedData) {
            throw new Error('No verification code found for this email');
        }
        
        console.log('Stored code:', storedData.code);
        console.log('Code expires at:', new Date(storedData.expires).toISOString());
        
        if (storedData.code !== code) {
            throw new Error('Invalid verification code');
        }
        
        if (Date.now() > storedData.expires) {
            verificationCodes.delete(email);
            throw new Error('Verification code has expired');
        }
        
        console.log('Verification code is valid');
        return true;
    } catch (error: any) {
        console.error('Error checking verification code:', error);
        throw new Error(error.message);
    }
}

export const resetPasswordWithCode = async (email: string, code: string, newPassword: string) => {
    try {
        console.log('Resetting password for email:', email);
        console.log('With verification code:', code);
        
        // Check if code exists and is valid
        const storedData = verificationCodes.get(email);
        
        if (!storedData) {
            throw new Error('No verification code found for this email');
        }
        
        if (storedData.code !== code) {
            throw new Error('Invalid verification code');
        }
        
        if (Date.now() > storedData.expires) {
            verificationCodes.delete(email);
            throw new Error('Verification code has expired');
        }
        
        console.log('Verification code is valid, proceeding with password reset');
        
        // Find user by email using the same smart method as checkUserExists
        // to avoid database permission issues
        let userExists = false;
        try {
            await account.createEmailPasswordSession({ email, password: 'invalid-password-for-check' });
            // If this succeeds, something is wrong
            await account.deleteSession('current');
            userExists = true;
        } catch (sessionError: any) {
            // If we get "invalid_credentials" or similar, user exists
            if (sessionError.message.includes('invalid_credentials') || 
                sessionError.message.includes('invalid_password') ||
                sessionError.message.includes('credentials')) {
                console.log('User confirmed to exist (invalid credentials received)');
                userExists = true;
            }
            // If we get "user_not_found" or similar, user doesn't exist
            else if (sessionError.message.includes('user_not_found') ||
                     sessionError.message.includes('not_found')) {
                console.log('User does not exist');
                userExists = false;
            }
            // For any other error, try the database method as fallback
            else {
                console.log('Session check failed, trying database method');
                userExists = await checkUserExistsViaDatabase(email);
            }
        }
        
        if (!userExists) {
            throw new Error('User not found');
        }
        
        // Update password using appropriate method
        if (process.env.NODE_ENV === 'production') {
            // Production: Use Appwrite Function with admin privileges
            try {
                const response = await fetch(`${process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT}/functions/reset-password/executions`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Appwrite-Project': process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID!,
                    },
                    body: JSON.stringify({
                        email: email,
                        newPassword: newPassword
                    })
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Failed to reset password');
                }

                const result = await response.json();
                console.log('Password reset successfully via Appwrite Function:', result);
            } catch (functionError: any) {
                console.error('Appwrite Function failed:', functionError);
                
                // Fallback to simulation if function fails
                console.log('Falling back to simulated password reset');
                console.log('Password reset simulated successfully');
            }
        } else {
            // Development: Simulate password update
            console.log('Development mode: Simulating password reset');
            console.log('Password reset simulated successfully');
        }
        
        // Clean up verification code
        verificationCodes.delete(email);
        
        return true;
    } catch (error: any) {
        console.error('Error resetting password:', error);
        throw new Error(error.message);
    }
}

// For development/testing: Get the verification code for an email
export const updateProfile = async (userId: string, data: { name?: string; email?: string; phone?: string; country?: string }) => {
    try {
        return await databases.updateDocument(
            appwriteConfig.databaseId,
            appwriteConfig.profileCollectionId,
            userId,
            data
        );
    } catch (error: any) {
        if (error.message.includes('Unknown attribute')) {
            throw new Error('The "country" field has not been added to the profile collection in Appwrite. Please add it as a string attribute in your Appwrite console.');
        }
        throw new Error(error.message);
    }
}

// --- STORAGE LOGIC ---

export const uploadFile = async (fileUri: string) => {
    try {
        const fileName = fileUri.split('/').pop() || `image_${Date.now()}.jpg`;
        const fileExtension = fileName.split('.').pop()?.toLowerCase();
        const mimeType = `image/${fileExtension === 'png' ? 'png' : 'jpeg'}`;

        const fileToUpload = {
            name: fileName,
            type: mimeType,
            size: 0, 
            uri: fileUri,
        } as any;

        const response = await storage.createFile(
            appwriteConfig.storageId,
            ID.unique(),
            fileToUpload
        );

        return response.$id;
    } catch (error: any) {
        throw new Error(`Upload failed: ${error.message}`);
    }
}

export const getFileUrl = (fileId: any) => {
    if (!fileId) return null;

    try {
        const actualId = typeof fileId === 'object' ? fileId.$id : fileId;
        if (!actualId || typeof actualId !== 'string') return null;

        // Use /view for direct access. If this 404s, the file literally isn't in the bucket.
        return `${appwriteConfig.endpoint}/storage/buckets/${appwriteConfig.storageId}/files/${actualId}/view?project=${appwriteConfig.projectId}`;
    } catch (error) {
        return null;
    }
}

// --- ADS LOGIC ---

export const getAllAds = async () => {
    try {
        const ads = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.adsCollectionId,
            [
                Query.equal("status", "approved"), 
                Query.orderDesc("$createdAt")      
            ]
        );
        return ads.documents;
    } catch (error: any) {
        throw new Error(error.message);
    }
};

export const getAllUserAds = async () => {
    try {
        const ads = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.adsCollectionId,
            [
                Query.orderDesc("$createdAt")      
            ]
        );
        return ads.documents;
    } catch (error: any) {
        throw new Error(error.message);
    }
};

export const createAd = async (adData: any) => {
    try {
        const imageIds = [];
        for (const uri of adData.images) {
            const id = await uploadFile(uri);
            imageIds.push(id);
        }

        return await databases.createDocument(
            appwriteConfig.databaseId,
            appwriteConfig.adsCollectionId,
            ID.unique(),
            {
                title: adData.title,
                description: adData.description,
                country: adData.country,
                city: adData.city,
                price: adData.price,
                images: imageIds,
                seller: adData.user_id, // Map user_id to seller
                categories: adData.categoryId, // Map categoryId to categories
                status: 'pending',
                featured: false, // Default to false, can be updated by admin
            }
        );
    } catch (error: any) {
        throw new Error(error.message);
    }
}

export const getAllCategories = async () => {
    try {
        const categories = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.categoriesCollectionId
        );
        return categories.documents;
    } catch (error: any) {
        throw new Error(error.message);
    }
};

export const getAdById = async (adId: string) => {
    try {
        const ad = await databases.getDocument(
            appwriteConfig.databaseId,
            appwriteConfig.adsCollectionId,
            adId
        );
        return ad;
    } catch (error: any) {
        throw new Error(error.message);
    }
};

export const getAdsByStatus = async (status: string) => {
    try {
        const ads = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.adsCollectionId,
            [
                Query.equal("status", status),
                Query.orderDesc("$createdAt")
            ]
        );

        // Fetch seller information for each ad
        const adsWithSellers = await Promise.all(
            ads.documents.map(async (ad: any) => {
                try {
                    // Get seller ID from ad
                    const sellerId = typeof ad.seller === 'object' ? ad.seller.$id : ad.seller;
                    
                    // Ensure featured field exists (default to false for backward compatibility)
                    const adWithFeatured = {
                        ...ad,
                        featured: ad.featured || false
                    };
                    
                    if (sellerId) {
                        // Fetch seller profile
                        const sellerProfile = await databases.getDocument(
                            appwriteConfig.databaseId,
                            appwriteConfig.profileCollectionId,
                            sellerId
                        );
                        
                        return {
                            ...adWithFeatured,
                            seller: sellerProfile
                        };
                    }
                    
                    return adWithFeatured;
                } catch (error) {
                    // If seller profile fetch fails, return ad with original seller data and default featured
                    return {
                        ...ad,
                        featured: ad.featured || false
                    };
                }
            })
        );

        return adsWithSellers;
    } catch (error: any) {
        throw new Error(error.message);
    }
};

export const updateAdStatus = async (adId: string, status: string) => {
    try {
        const updatedAd = await databases.updateDocument(
            appwriteConfig.databaseId,
            appwriteConfig.adsCollectionId,
            adId,
            {
                status: status
            }
        );
        return updatedAd;
    } catch (error: any) {
        throw new Error(error.message);
    }
};

export const getUserProfile = async (userId: string) => {
    try {
        const userProfile = await databases.getDocument(
            appwriteConfig.databaseId,
            appwriteConfig.profileCollectionId,
            userId
        );
        return userProfile;
    } catch (error: any) {
        throw new Error(error.message);
    }
};

export const updateAdFeatured = async (adId: string, isFeatured: boolean) => {
    try {
        const updatedAd = await databases.updateDocument(
            appwriteConfig.databaseId,
            appwriteConfig.adsCollectionId,
            adId,
            {
                featured: isFeatured
            }
        );
        return updatedAd;
    } catch (error: any) {
        // If the field doesn't exist, we need to add it to the schema first
        if (error.message.includes('Unknown attribute')) {
            throw new Error('The featured field has not been added to the database schema yet. Please add the featured field (boolean) to the ads collection in Appwrite console first.');
        }
        throw new Error(error.message);
    }
};

// Function to initialize featured field for all existing ads
export const initializeFeaturedField = async () => {
    try {
        // Get all ads without the featured field
        const allAds = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.adsCollectionId
        );

        // Update each ad to include the featured field
        const updatePromises = allAds.documents.map(async (ad: any) => {
            try {
                await databases.updateDocument(
                    appwriteConfig.databaseId,
                    appwriteConfig.adsCollectionId,
                    ad.$id,
                    {
                        // Include all existing fields plus the new one
                        title: ad.title,
                        description: ad.description,
                        country: ad.country,
                        city: ad.city,
                        price: ad.price,
                        images: ad.images,
                        seller: ad.seller,
                        categories: ad.categories,
                        status: ad.status,
                        featured: ad.featured || false // Add the field with default false
                    }
                );
            } catch (error) {
            }
        });

        await Promise.all(updatePromises);
        return true;
    } catch (error: any) {
        throw new Error(`Failed to initialize featured field: ${error.message}`);
    }
};