export type User = {
    $id: string;
    email: string;
    name: string;
    registration: string;
    status: boolean;
    labels: string[];
    passwordUpdate: string;
    emailVerification: boolean;
    phone: string;
    phoneVerification: boolean;
    prefs: Record<string, any>;
    accessedAt: string;
    role?: string;
};

export type Ad = {
    $id: string;
    $createdAt: string;
    $updatedAt: string;
    title: string;
    description: string;
    country: string;
    city: string;
    price: number;
    images: any[]; // Changed from string[] to any[] to handle both IDs and objects
    seller: any; 
    categoryId?: string;
    categories?: any; 
    featured?: boolean;
    status?: 'active' | 'pending' | 'disapproved' | 'approved' | 'rejected';
};

export type Category = {
    $id: string;
    name: string;
    image?: string;
};
