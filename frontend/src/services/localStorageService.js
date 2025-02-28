/**
 * Local storage service for offline functionality
 * Provides methods to store and retrieve data from IndexedDB
 */

// IndexedDB database name and version
const DB_NAME = 'pos_offline_db';
const DB_VERSION = 1;

// Store names
const STORES = {
  PRODUCTS: 'products',
  CART: 'cart',
  TRANSACTIONS: 'transactions',
  SYNC_STATUS: 'syncStatus'
};

/**
 * Initialize the IndexedDB database
 * @returns {Promise<IDBDatabase>} - The database instance
 */
export const initDatabase = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error('IndexedDB error:', event.target.error);
      reject(event.target.error);
    };

    request.onsuccess = (event) => {
      resolve(event.target.result);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // Create object stores if they don't exist
      if (!db.objectStoreNames.contains(STORES.PRODUCTS)) {
        db.createObjectStore(STORES.PRODUCTS, { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains(STORES.CART)) {
        db.createObjectStore(STORES.CART, { keyPath: 'product_id' });
      }

      if (!db.objectStoreNames.contains(STORES.TRANSACTIONS)) {
        const transactionStore = db.createObjectStore(STORES.TRANSACTIONS, { 
          keyPath: 'id', 
          autoIncrement: true 
        });
        transactionStore.createIndex('status', 'status', { unique: false });
        transactionStore.createIndex('timestamp', 'timestamp', { unique: false });
      }

      if (!db.objectStoreNames.contains(STORES.SYNC_STATUS)) {
        db.createObjectStore(STORES.SYNC_STATUS, { keyPath: 'id' });
      }
    };
  });
};

/**
 * Save products to local storage
 * @param {Array} products - Array of product objects
 * @returns {Promise<void>}
 */
export const saveLocalProducts = async (products) => {
  try {
    const db = await initDatabase();
    const transaction = db.transaction([STORES.PRODUCTS], 'readwrite');
    const store = transaction.objectStore(STORES.PRODUCTS);

    // Clear existing products
    await clearObjectStore(db, STORES.PRODUCTS);

    // Add new products
    products.forEach(product => {
      store.add(product);
    });

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = (event) => reject(event.target.error);
    });
  } catch (error) {
    console.error('Error saving products to IndexedDB:', error);
    throw error;
  }
};

/**
 * Get products from local storage
 * @returns {Promise<Array>} - Array of product objects
 */
export const getLocalProducts = async () => {
  try {
    const db = await initDatabase();
    const transaction = db.transaction([STORES.PRODUCTS], 'readonly');
    const store = transaction.objectStore(STORES.PRODUCTS);
    const request = store.getAll();

    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = (event) => reject(event.target.error);
    });
  } catch (error) {
    console.error('Error getting products from IndexedDB:', error);
    return [];
  }
};

/**
 * Save cart to local storage
 * @param {Array} cartItems - Array of cart item objects
 * @returns {Promise<void>}
 */
export const saveLocalCart = async (cartItems) => {
  try {
    const db = await initDatabase();
    const transaction = db.transaction([STORES.CART], 'readwrite');
    const store = transaction.objectStore(STORES.CART);

    // Clear existing cart
    await clearObjectStore(db, STORES.CART);

    // Add new cart items
    cartItems.forEach(item => {
      store.add(item);
    });

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = (event) => reject(event.target.error);
    });
  } catch (error) {
    console.error('Error saving cart to IndexedDB:', error);
    throw error;
  }
};

/**
 * Get cart from local storage
 * @returns {Promise<Array>} - Array of cart item objects
 */
export const getLocalCart = async () => {
  try {
    const db = await initDatabase();
    const transaction = db.transaction([STORES.CART], 'readonly');
    const store = transaction.objectStore(STORES.CART);
    const request = store.getAll();

    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = (event) => reject(event.target.error);
    });
  } catch (error) {
    console.error('Error getting cart from IndexedDB:', error);
    return [];
  }
};

/**
 * Save a transaction for later synchronization
 * @param {Object} transaction - Transaction object
 * @returns {Promise<number>} - ID of the saved transaction
 */
export const saveLocalTransaction = async (transaction) => {
  try {
    const db = await initDatabase();
    const tx = db.transaction([STORES.TRANSACTIONS], 'readwrite');
    const store = tx.objectStore(STORES.TRANSACTIONS);

    // Add timestamp and status
    const transactionToSave = {
      ...transaction,
      timestamp: new Date().toISOString(),
      status: 'pending'
    };

    const request = store.add(transactionToSave);

    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = (event) => reject(event.target.error);
    });
  } catch (error) {
    console.error('Error saving transaction to IndexedDB:', error);
    throw error;
  }
};

/**
 * Get pending transactions
 * @returns {Promise<Array>} - Array of pending transaction objects
 */
export const getPendingTransactions = async () => {
  try {
    const db = await initDatabase();
    const transaction = db.transaction([STORES.TRANSACTIONS], 'readonly');
    const store = transaction.objectStore(STORES.TRANSACTIONS);
    const index = store.index('status');
    const request = index.getAll('pending');

    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = (event) => reject(event.target.error);
    });
  } catch (error) {
    console.error('Error getting pending transactions from IndexedDB:', error);
    return [];
  }
};

/**
 * Update transaction status
 * @param {number} id - Transaction ID
 * @param {string} status - New status ('synced' or 'failed')
 * @returns {Promise<void>}
 */
export const updateTransactionStatus = async (id, status) => {
  try {
    const db = await initDatabase();
    const transaction = db.transaction([STORES.TRANSACTIONS], 'readwrite');
    const store = transaction.objectStore(STORES.TRANSACTIONS);
    
    // Get the transaction first
    const getRequest = store.get(id);
    
    return new Promise((resolve, reject) => {
      getRequest.onsuccess = () => {
        const data = getRequest.result;
        if (data) {
          data.status = status;
          const updateRequest = store.put(data);
          updateRequest.onsuccess = () => resolve();
          updateRequest.onerror = (event) => reject(event.target.error);
        } else {
          reject(new Error(`Transaction with ID ${id} not found`));
        }
      };
      getRequest.onerror = (event) => reject(event.target.error);
    });
  } catch (error) {
    console.error('Error updating transaction status in IndexedDB:', error);
    throw error;
  }
};

/**
 * Clear an object store
 * @param {IDBDatabase} db - Database instance
 * @param {string} storeName - Name of the object store to clear
 * @returns {Promise<void>}
 */
const clearObjectStore = (db, storeName) => {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.clear();

    request.onsuccess = () => resolve();
    request.onerror = (event) => reject(event.target.error);
  });
};

/**
 * Check if the application is online
 * @returns {boolean} - True if online, false if offline
 */
export const isOnline = () => {
  return navigator.onLine;
};

/**
 * Save last sync timestamp
 * @param {string} timestamp - ISO string timestamp
 * @returns {Promise<void>}
 */
export const saveLastSyncTime = async (timestamp) => {
  try {
    const db = await initDatabase();
    const transaction = db.transaction([STORES.SYNC_STATUS], 'readwrite');
    const store = transaction.objectStore(STORES.SYNC_STATUS);
    
    store.put({ id: 'lastSync', timestamp });

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = (event) => reject(event.target.error);
    });
  } catch (error) {
    console.error('Error saving last sync time to IndexedDB:', error);
    throw error;
  }
};

/**
 * Get last sync timestamp
 * @returns {Promise<string|null>} - ISO string timestamp or null if never synced
 */
export const getLastSyncTime = async () => {
  try {
    const db = await initDatabase();
    const transaction = db.transaction([STORES.SYNC_STATUS], 'readonly');
    const store = transaction.objectStore(STORES.SYNC_STATUS);
    const request = store.get('lastSync');

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        if (request.result) {
          resolve(request.result.timestamp);
        } else {
          resolve(null);
        }
      };
      request.onerror = (event) => reject(event.target.error);
    });
  } catch (error) {
    console.error('Error getting last sync time from IndexedDB:', error);
    return null;
  }
};
