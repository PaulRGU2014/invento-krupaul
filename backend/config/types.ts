// Database models matching Supabase schema
export interface InventoryItemDB {
  id: string;
  user_id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  min_stock: number;
  price: number;
  supplier: string | null;
  created_at: string;
  updated_at: string;
}

// Frontend model (matches desktop-fe and mobile-fe types)
export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  minStock: number;
  price: number;
  supplier: string;
  lastUpdated: string;
}

// Input type for creating new inventory items
export interface CreateInventoryItemInput {
  name: string;
  category: string;
  quantity: number;
  unit: string;
  minStock: number;
  price: number;
  supplier?: string;
}

// Input type for updating inventory items
export interface UpdateInventoryItemInput {
  name?: string;
  category?: string;
  quantity?: number;
  unit?: string;
  minStock?: number;
  price?: number;
  supplier?: string;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
  error?: string;
}

// Helper function to convert DB model to frontend model
export function dbToFrontend(item: InventoryItemDB): InventoryItem {
  return {
    id: item.id,
    name: item.name,
    category: item.category,
    quantity: item.quantity,
    unit: item.unit,
    minStock: item.min_stock,
    price: item.price,
    supplier: item.supplier || '',
    lastUpdated: item.updated_at,
  };
}

// Helper function to convert frontend input to DB model
export function frontendToDB(
  input: CreateInventoryItemInput,
  userId: string
): Partial<InventoryItemDB> {
  return {
    user_id: userId,
    name: input.name,
    category: input.category,
    quantity: input.quantity,
    unit: input.unit,
    min_stock: input.minStock,
    price: input.price,
    supplier: input.supplier || null,
  };
}
