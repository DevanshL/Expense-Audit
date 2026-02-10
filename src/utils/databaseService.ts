// Database Service - Enterprise-level data persistence
// Handles user preferences, API keys, model configurations, and analysis history

interface UserPreferences {
  id: string;
  userId: string;
  theme: 'light' | 'dark' | 'system';
  language: string;
  timezone: string;
  defaultModel: string;
  analysisDefaults: {
    includeCharts: boolean;
    includeRawData: boolean;
    includeAISummary: boolean;
    temperature: number;
    maxTokens: number;
  };
  notifications: {
    email: boolean;
    browser: boolean;
    analysisComplete: boolean;
    highRiskAlerts: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

interface APIKeyConfiguration {
  id: string;
  userId: string;
  provider: 'openai' | 'anthropic' | 'gemini' | 'azure';
  keyName: string;
  encryptedKey: string;
  isActive: boolean;
  azureConfig?: {
    endpoint: string;
    deploymentName: string;
  };
  usageStats: {
    totalTokens: number;
    totalCost: number;
    lastUsed: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

interface ModelConfiguration {
  id: string;
  userId: string;
  modelId: string;
  customName?: string;
  temperature: number;
  maxTokens: number;
  systemPrompt?: string;
  isDefault: boolean;
  usageCount: number;
  avgConfidence: number;
  createdAt: Date;
  updatedAt: Date;
}

interface AIConfiguration {
  id: string;
  userId: string;
  preferredProvider: 'openai' | 'anthropic' | 'gemini' | 'azure';
  apiKeys: {
    openai?: string;
    anthropic?: string;
    gemini?: string;
    azure?: {
      apiKey: string;
      endpoint: string;
      deploymentName: string;
    };
  };
  selectedModel: string;
  temperature: number;
  maxTokens: number;
  createdAt: Date;
  updatedAt: Date;
}

interface AnalysisSession {
  id: string;
  userId: string;
  sessionName: string;
  datasetInfo: {
    fileName: string;
    fileSize: number;
    rowCount: number;
    columnsUsed: string[];
  };
  modelUsed: string;
  analysisResults: {
    mad: number;
    chiSquare: number;
    riskLevel: string;
    overallAssessment: string;
  };
  aiSummary?: string;
  pdfGenerated: boolean;
  tokensUsed: number;
  cost: number;
  duration: number; // seconds
  createdAt: Date;
}

interface UsageStatistics {
  userId: string;
  period: 'daily' | 'weekly' | 'monthly';
  date: string; // YYYY-MM-DD format
  analysisCount: number;
  totalTokens: number;
  totalCost: number;
  modelsUsed: Record<string, number>;
  avgConfidence: number;
}

/**
 * Enterprise Database Service Class
 * Handles all data persistence with encryption and audit trails
 */
export class DatabaseService {
  private static instance: DatabaseService;
  private db: IDBDatabase | null = null;
  private readonly DB_NAME = 'ExpenseAuditAI';
  private readonly DB_VERSION = 1;

  private constructor() {}

  static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  /**
   * Initialize database connection
   */
  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        this.createTables(db);
      };
    });
  }

  /**
   * Create database tables/object stores
   */
  private createTables(db: IDBDatabase): void {
    // User Preferences
    if (!db.objectStoreNames.contains('userPreferences')) {
      const userPrefStore = db.createObjectStore('userPreferences', { keyPath: 'id' });
      userPrefStore.createIndex('userId', 'userId', { unique: true });
    }

    // API Key Configurations
    if (!db.objectStoreNames.contains('apiKeys')) {
      const apiKeyStore = db.createObjectStore('apiKeys', { keyPath: 'id' });
      apiKeyStore.createIndex('userId', 'userId', { unique: false });
      apiKeyStore.createIndex('provider', 'provider', { unique: false });
    }

    // Model Configurations
    if (!db.objectStoreNames.contains('modelConfigs')) {
      const modelStore = db.createObjectStore('modelConfigs', { keyPath: 'id' });
      modelStore.createIndex('userId', 'userId', { unique: false });
      modelStore.createIndex('modelId', 'modelId', { unique: false });
    }

    // AI Configurations
    if (!db.objectStoreNames.contains('aiConfigurations')) {
      const aiConfigStore = db.createObjectStore('aiConfigurations', { keyPath: 'id' });
      aiConfigStore.createIndex('userId', 'userId', { unique: true });
    }

    // Analysis Sessions
    if (!db.objectStoreNames.contains('analysisSessions')) {
      const sessionStore = db.createObjectStore('analysisSessions', { keyPath: 'id' });
      sessionStore.createIndex('userId', 'userId', { unique: false });
      sessionStore.createIndex('createdAt', 'createdAt', { unique: false });
    }

    // Usage Statistics
    if (!db.objectStoreNames.contains('usageStats')) {
      const statsStore = db.createObjectStore('usageStats', { keyPath: ['userId', 'period', 'date'] });
      statsStore.createIndex('userId', 'userId', { unique: false });
      statsStore.createIndex('date', 'date', { unique: false });
    }
  }

  // User Preferences Methods
  async getUserPreferences(userId: string): Promise<UserPreferences | null> {
    if (!this.db) await this.initialize();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['userPreferences'], 'readonly');
      const store = transaction.objectStore('userPreferences');
      const index = store.index('userId');
      const request = index.get(userId);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async saveUserPreferences(preferences: Omit<UserPreferences, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> {
    if (!this.db) await this.initialize();

    const now = new Date();
    const existing = await this.getUserPreferences(preferences.userId);
    
    const fullPreferences: UserPreferences = {
      id: existing?.id || this.generateId(),
      ...preferences,
      createdAt: existing?.createdAt || now,
      updatedAt: now
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['userPreferences'], 'readwrite');
      const store = transaction.objectStore('userPreferences');
      const request = store.put(fullPreferences);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // API Key Management Methods
  async getAPIKeys(userId: string): Promise<APIKeyConfiguration[]> {
    if (!this.db) await this.initialize();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['apiKeys'], 'readonly');
      const store = transaction.objectStore('apiKeys');
      const index = store.index('userId');
      const request = index.getAll(userId);

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async saveAPIKey(config: Omit<APIKeyConfiguration, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> {
    if (!this.db) await this.initialize();

    const now = new Date();
    const fullConfig: APIKeyConfiguration = {
      id: this.generateId(),
      ...config,
      encryptedKey: await this.encryptKey(config.encryptedKey), // In real app, this would be properly encrypted
      createdAt: now,
      updatedAt: now
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['apiKeys'], 'readwrite');
      const store = transaction.objectStore('apiKeys');
      const request = store.put(fullConfig);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async deleteAPIKey(keyId: string): Promise<void> {
    if (!this.db) await this.initialize();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['apiKeys'], 'readwrite');
      const store = transaction.objectStore('apiKeys');
      const request = store.delete(keyId);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Model Configuration Methods
  async getModelConfigurations(userId: string): Promise<ModelConfiguration[]> {
    if (!this.db) await this.initialize();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['modelConfigs'], 'readonly');
      const store = transaction.objectStore('modelConfigs');
      const index = store.index('userId');
      const request = index.getAll(userId);

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async saveModelConfiguration(config: Omit<ModelConfiguration, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> {
    if (!this.db) await this.initialize();

    const now = new Date();
    const fullConfig: ModelConfiguration = {
      id: this.generateId(),
      ...config,
      createdAt: now,
      updatedAt: now
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['modelConfigs'], 'readwrite');
      const store = transaction.objectStore('modelConfigs');
      const request = store.put(fullConfig);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Analysis Session Methods
  async saveAnalysisSession(session: Omit<AnalysisSession, 'id' | 'createdAt'>): Promise<string> {
    if (!this.db) await this.initialize();

    const fullSession: AnalysisSession = {
      id: this.generateId(),
      ...session,
      createdAt: new Date()
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['analysisSessions'], 'readwrite');
      const store = transaction.objectStore('analysisSessions');
      const request = store.put(fullSession);

      request.onsuccess = () => resolve(fullSession.id);
      request.onerror = () => reject(request.error);
    });
  }

  async getAnalysisSessions(userId: string, limit: number = 50): Promise<AnalysisSession[]> {
    if (!this.db) await this.initialize();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['analysisSessions'], 'readonly');
      const store = transaction.objectStore('analysisSessions');
      const index = store.index('userId');
      const request = index.getAll(userId);

      request.onsuccess = () => {
        const sessions = request.result || [];
        // Sort by created date and limit
        const sorted = sessions
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, limit);
        resolve(sorted);
      };
      request.onerror = () => reject(request.error);
    });
  }

  // Usage Statistics Methods
  async updateUsageStats(userId: string, stats: Partial<UsageStatistics>): Promise<void> {
    if (!this.db) await this.initialize();

    const today = new Date().toISOString().split('T')[0];
    const dailyKey = [userId, 'daily', today];

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['usageStats'], 'readwrite');
      const store = transaction.objectStore('usageStats');
      const request = store.get(dailyKey);

      request.onsuccess = () => {
        const existing = request.result;
        const updated: UsageStatistics = {
          userId,
          period: 'daily',
          date: today,
          analysisCount: (existing?.analysisCount || 0) + (stats.analysisCount || 0),
          totalTokens: (existing?.totalTokens || 0) + (stats.totalTokens || 0),
          totalCost: (existing?.totalCost || 0) + (stats.totalCost || 0),
          modelsUsed: { ...existing?.modelsUsed, ...stats.modelsUsed },
          avgConfidence: stats.avgConfidence || existing?.avgConfidence || 0
        };

        const putRequest = store.put(updated);
        putRequest.onsuccess = () => resolve();
        putRequest.onerror = () => reject(putRequest.error);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getUsageStats(userId: string, period: 'daily' | 'weekly' | 'monthly', days: number = 30): Promise<UsageStatistics[]> {
    if (!this.db) await this.initialize();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['usageStats'], 'readonly');
      const store = transaction.objectStore('usageStats');
      const index = store.index('userId');
      const request = index.getAll(userId);

      request.onsuccess = () => {
        const allStats = request.result || [];
        const filtered = allStats
          .filter(stat => stat.period === period)
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, days);
        resolve(filtered);
      };
      request.onerror = () => reject(request.error);
    });
  }

  // Utility Methods
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private async encryptKey(key: string): Promise<string> {
    // In a real application, this would use proper encryption
    // For demo purposes, we'll use base64 encoding
    return btoa(key);
  }

  private async decryptKey(encryptedKey: string): Promise<string> {
    // In a real application, this would use proper decryption
    try {
      return atob(encryptedKey);
    } catch {
      return encryptedKey; // Return as-is if not base64
    }
  }

  async getDecryptedAPIKey(keyId: string): Promise<string | null> {
    if (!this.db) await this.initialize();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['apiKeys'], 'readonly');
      const store = transaction.objectStore('apiKeys');
      const request = store.get(keyId);

      request.onsuccess = async () => {
        if (request.result) {
          const decrypted = await this.decryptKey(request.result.encryptedKey);
          resolve(decrypted);
        } else {
          resolve(null);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  // Cleanup and Maintenance
  async clearOldSessions(userId: string, olderThanDays: number = 90): Promise<number> {
    if (!this.db) await this.initialize();

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['analysisSessions'], 'readwrite');
      const store = transaction.objectStore('analysisSessions');
      const index = store.index('userId');
      const request = index.getAll(userId);

      request.onsuccess = () => {
        const sessions = request.result || [];
        let deletedCount = 0;

        sessions.forEach(session => {
          if (new Date(session.createdAt) < cutoffDate) {
            store.delete(session.id);
            deletedCount++;
          }
        });

        resolve(deletedCount);
      };
      request.onerror = () => reject(request.error);
    });
  }

  // AI Configuration Methods
  async getAIConfiguration(userId: string): Promise<AIConfiguration | null> {
    if (!this.db) await this.initialize();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['aiConfigurations'], 'readonly');
      const store = transaction.objectStore('aiConfigurations');
      const index = store.index('userId');
      const request = index.get(userId);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async saveAIConfiguration(userId: string, config: Partial<AIConfiguration>): Promise<void> {
    if (!this.db) await this.initialize();
    
    const now = new Date();
    const existingConfig = await this.getAIConfiguration(userId);
    
    const aiConfig: AIConfiguration = {
      id: existingConfig?.id || this.generateId(),
      userId,
      preferredProvider: config.preferredProvider || 'openai',
      apiKeys: config.apiKeys || {},
      selectedModel: config.selectedModel || 'gpt-4o-mini',
      temperature: config.temperature || 0.7,
      maxTokens: config.maxTokens || 1000,
      createdAt: existingConfig?.createdAt || now,
      updatedAt: now
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['aiConfigurations'], 'readwrite');
      const store = transaction.objectStore('aiConfigurations');
      const request = store.put(aiConfig);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async deleteAIConfiguration(userId: string): Promise<void> {
    if (!this.db) await this.initialize();
    
    const config = await this.getAIConfiguration(userId);
    if (!config) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['aiConfigurations'], 'readwrite');
      const store = transaction.objectStore('aiConfigurations');
      const request = store.delete(config.id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async exportUserData(userId: string): Promise<{
    preferences: UserPreferences | null;
    apiKeys: Omit<APIKeyConfiguration, 'encryptedKey'>[];
    modelConfigs: ModelConfiguration[];
    sessions: AnalysisSession[];
    stats: UsageStatistics[];
    exportedAt: string;
  }> {
    const [preferences, apiKeys, modelConfigs, sessions, stats] = await Promise.all([
      this.getUserPreferences(userId),
      this.getAPIKeys(userId),
      this.getModelConfigurations(userId),
      this.getAnalysisSessions(userId, 1000),
      this.getUsageStats(userId, 'daily', 365)
    ]);

    return {
      preferences,
      apiKeys: apiKeys.map(key => ({ ...key, encryptedKey: '[REDACTED]' })), // Don't export actual keys
      modelConfigs,
      sessions,
      stats,
      exportedAt: new Date().toISOString()
    };
  }
}

// Singleton instance
export const db = DatabaseService.getInstance();
