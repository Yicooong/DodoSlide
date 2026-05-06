/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { Provider, ProviderManagerState } from './types';
import { DEFAULT_PROVIDER_META, DEFAULT_PROVIDER_SETTINGS_CONFIG, DEFAULT_PROVIDER_MANAGER_STATE } from './types';

/**
 * ProviderStorage - persists and retrieves ProviderManagerState from localStorage,
 * handles migration from legacy format.
 */
export class ProviderStorage {
  static STORAGE_KEY = 'provider_manager_state';
  static LEGACY_KEY = 'api_settings';

  /**
   * Load provider state from localStorage.
   * Checks for new format first, then attempts legacy migration, then returns default.
   */
  load(): ProviderManagerState {
    // Try new format first
    try {
      const raw = localStorage.getItem(ProviderStorage.STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as ProviderManagerState;
        if (this.validateStateShape(parsed)) {
          return parsed;
        }
        console.warn('ProviderStorage: stored state has invalid shape, falling back');
      }
    } catch (e) {
      console.warn('ProviderStorage: failed to parse stored state:', e);
    }

    // Try legacy migration
    const migrated = this.migrateFromLegacy();
    if (migrated) {
      return migrated;
    }

    // Default empty state
    return { ...DEFAULT_PROVIDER_MANAGER_STATE };
  }

  /**
   * Save provider state to localStorage.
   */
  save(state: ProviderManagerState): void {
    try {
      localStorage.setItem(ProviderStorage.STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn('ProviderStorage: failed to save state:', e);
    }
  }

  /**
   * Migrate from legacy `api_settings` localStorage format.
   * Creates a single "custom" provider from the legacy fields.
   * Does NOT delete the legacy key for safety.
   */
  migrateFromLegacy(): ProviderManagerState | null {
    try {
      const raw = localStorage.getItem(ProviderStorage.LEGACY_KEY);
      if (!raw) return null;

      const legacy = JSON.parse(raw) as {
        customEndpoint?: string;
        customApiKey?: string;
        customModel?: string;
        provider?: string;
      };

      // Only migrate if there's meaningful data
      if (!legacy.customEndpoint && !legacy.customApiKey && !legacy.customModel) {
        return null;
      }

      const now = Date.now();
      const migratedProvider: Provider = {
        id: 'migrated-custom',
        name: '自定义 API',
        settingsConfig: {
          ...DEFAULT_PROVIDER_SETTINGS_CONFIG,
          endpoint: legacy.customEndpoint || '',
          apiKey: legacy.customApiKey || '',
          model: legacy.customModel || '',
        },
        category: 'custom',
        createdAt: now,
        sortIndex: 0,
        meta: { ...DEFAULT_PROVIDER_META },
      };

      const state: ProviderManagerState = {
        providers: { 'migrated-custom': migratedProvider },
        providerOrder: ['migrated-custom'],
        currentProviderId: 'migrated-custom',
      };

      // Save the migrated state
      this.save(state);
      console.info('ProviderStorage: migrated legacy api_settings to new format');
      return state;
    } catch (e) {
      console.warn('ProviderStorage: failed to migrate legacy format:', e);
      return null;
    }
  }

  /**
   * Clear provider state from localStorage.
   */
  clear(): void {
    localStorage.removeItem(ProviderStorage.STORAGE_KEY);
  }

  /**
   * Validate basic shape of a parsed state object.
   */
  private validateStateShape(obj: unknown): obj is ProviderManagerState {
    if (!obj || typeof obj !== 'object') return false;
    const state = obj as Record<string, unknown>;
    return (
      typeof state.providers === 'object' &&
      state.providers !== null &&
      Array.isArray(state.providerOrder) &&
      typeof state.currentProviderId === 'string'
    );
  }
}

/** Singleton instance */
export const providerStorage = new ProviderStorage();
