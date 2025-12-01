import { supabase } from '../config/supabase';
import {
  InventoryItemDB,
  InventoryItem,
  CreateInventoryItemInput,
  UpdateInventoryItemInput,
  ApiResponse,
  PaginatedResponse,
  dbToFrontend,
  frontendToDB,
} from '../config/types';

/**
 * Get all inventory items for a user
 */
export async function getAllItems(
  userId: string,
  page: number = 1,
  pageSize: number = 50
): Promise<PaginatedResponse<InventoryItem>> {
  try {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    // Get total count
    const { count, error: countError } = await supabase
      .from('inventory_items')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (countError) throw countError;

    // Get paginated data
    const { data, error } = await supabase
      .from('inventory_items')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .range(from, to);

    if (error) throw error;

    const items = (data as InventoryItemDB[]).map(dbToFrontend);

    return {
      success: true,
      data: items,
      pagination: {
        page,
        pageSize,
        totalItems: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize),
      },
    };
  } catch (error: any) {
    return {
      success: false,
      data: [],
      pagination: { page, pageSize, totalItems: 0, totalPages: 0 },
      error: error.message || 'Failed to fetch inventory items',
    };
  }
}

/**
 * Get a single inventory item by ID
 */
export async function getItemById(
  userId: string,
  itemId: string
): Promise<ApiResponse<InventoryItem>> {
  try {
    const { data, error } = await supabase
      .from('inventory_items')
      .select('*')
      .eq('id', itemId)
      .eq('user_id', userId)
      .single();

    if (error) throw error;
    if (!data) throw new Error('Item not found');

    return {
      success: true,
      data: dbToFrontend(data as InventoryItemDB),
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to fetch inventory item',
    };
  }
}

/**
 * Create a new inventory item
 */
export async function createItem(
  userId: string,
  input: CreateInventoryItemInput
): Promise<ApiResponse<InventoryItem>> {
  try {
    const dbItem = frontendToDB(input, userId);

    const { data, error } = await supabase
      .from('inventory_items')
      .insert(dbItem)
      .select()
      .single();

    if (error) throw error;

    return {
      success: true,
      data: dbToFrontend(data as InventoryItemDB),
      message: 'Inventory item created successfully',
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to create inventory item',
    };
  }
}

/**
 * Update an existing inventory item
 */
export async function updateItem(
  userId: string,
  itemId: string,
  input: UpdateInventoryItemInput
): Promise<ApiResponse<InventoryItem>> {
  try {
    // Convert camelCase to snake_case for DB
    const dbUpdate: any = {};
    if (input.name !== undefined) dbUpdate.name = input.name;
    if (input.category !== undefined) dbUpdate.category = input.category;
    if (input.quantity !== undefined) dbUpdate.quantity = input.quantity;
    if (input.unit !== undefined) dbUpdate.unit = input.unit;
    if (input.minStock !== undefined) dbUpdate.min_stock = input.minStock;
    if (input.price !== undefined) dbUpdate.price = input.price;
    if (input.supplier !== undefined) dbUpdate.supplier = input.supplier || null;

    const { data, error } = await supabase
      .from('inventory_items')
      .update(dbUpdate)
      .eq('id', itemId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new Error('Item not found or unauthorized');

    return {
      success: true,
      data: dbToFrontend(data as InventoryItemDB),
      message: 'Inventory item updated successfully',
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to update inventory item',
    };
  }
}

/**
 * Delete an inventory item
 */
export async function deleteItem(
  userId: string,
  itemId: string
): Promise<ApiResponse<null>> {
  try {
    const { error } = await supabase
      .from('inventory_items')
      .delete()
      .eq('id', itemId)
      .eq('user_id', userId);

    if (error) throw error;

    return {
      success: true,
      message: 'Inventory item deleted successfully',
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to delete inventory item',
    };
  }
}

/**
 * Get items by category
 */
export async function getItemsByCategory(
  userId: string,
  category: string
): Promise<ApiResponse<InventoryItem[]>> {
  try {
    const { data, error } = await supabase
      .from('inventory_items')
      .select('*')
      .eq('user_id', userId)
      .eq('category', category)
      .order('name', { ascending: true });

    if (error) throw error;

    return {
      success: true,
      data: (data as InventoryItemDB[]).map(dbToFrontend),
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to fetch items by category',
    };
  }
}

/**
 * Get low stock items (quantity <= minStock)
 */
export async function getLowStockItems(
  userId: string
): Promise<ApiResponse<InventoryItem[]>> {
  try {
    const { data, error } = await supabase
      .from('inventory_items')
      .select('*')
      .eq('user_id', userId)
      .filter('quantity', 'lte', supabase.rpc('min_stock'))
      .order('quantity', { ascending: true });

    if (error) {
      // Fallback: fetch all and filter in memory
      const { data: allData, error: allError } = await supabase
        .from('inventory_items')
        .select('*')
        .eq('user_id', userId);

      if (allError) throw allError;

      const lowStockItems = (allData as InventoryItemDB[])
        .filter(item => item.quantity <= item.min_stock)
        .sort((a, b) => a.quantity - b.quantity);

      return {
        success: true,
        data: lowStockItems.map(dbToFrontend),
      };
    }

    return {
      success: true,
      data: (data as InventoryItemDB[]).map(dbToFrontend),
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to fetch low stock items',
    };
  }
}

/**
 * Search items by name
 */
export async function searchItems(
  userId: string,
  searchTerm: string
): Promise<ApiResponse<InventoryItem[]>> {
  try {
    const { data, error } = await supabase
      .from('inventory_items')
      .select('*')
      .eq('user_id', userId)
      .ilike('name', `%${searchTerm}%`)
      .order('name', { ascending: true });

    if (error) throw error;

    return {
      success: true,
      data: (data as InventoryItemDB[]).map(dbToFrontend),
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to search items',
    };
  }
}
