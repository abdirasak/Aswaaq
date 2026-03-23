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

// --- AUTH LOGIC ---

export const createUser = async (email: string, password: string, fullName: string) => {
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

export const resetPassword = async (email: string) => {
    try {
        await account.createRecovery(email, 'https://iibiye.app/reset-password');
        return true;
    } catch (error: any) {
        throw new Error(error.message);
    }
}

export const updateProfile = async (userId: string, data: { name?: string; email?: string }) => {
    try {
        return await databases.updateDocument(
            appwriteConfig.databaseId,
            appwriteConfig.profileCollectionId,
            userId,
            data
        );
    } catch (error: any) {
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