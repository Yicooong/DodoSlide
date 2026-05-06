/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { Provider, ProviderManagerState, ProviderMeta } from './types';
import { DEFAULT_PROVIDER_META, DEFAULT_PROVIDER_SETTINGS_CONFIG } from './types';

/**
 * ProviderManager - central orchestrator for provider CRUD, switching, and state management.
 * Inspired by the Rust cc-switch ProviderService pattern.
 */
export class ProviderManager {
  private state: ProviderManagerState;

  constructor(initialState: ProviderManagerState) {
    this.state = { ...initialState };
  }

  // === Query Methods ===

  /**
   * Get all providers in display order (sorted by providerOrder).
   */
  getAllProviders(): Provider[] {
    return this.state.providerOrder
      .map(id => this.state.providers[id])
      .filter((p): p is Provider => p !== undefined);
  }

  /**
   * Get a single provider by ID.
   */
  getProvider(id: string): Provider | undefined {
    return this.state.providers[id];
  }

  /**
   * Get the current provider object.
   */
  getCurrentProvider(): Provider | undefined {
    if (!this.state.currentProviderId) return undefined;
    return this.state.providers[this.state.currentProviderId];
  }

  /**
   * Get the current provider ID.
   */
  getCurrentProviderId(): string {
    return this.state.currentProviderId;
  }

  /**
   * Get the number of providers.
   */
  getProviderCount(): number {
    return this.state.providerOrder.length;
  }

  // === Mutation Methods ===

  /**
   * Add a new provider. Auto-generates ID, sets createdAt, assigns sortIndex.
   * If this is the first provider, sets it as current.
   */
  addProvider(provider: Omit<Provider, 'id' | 'createdAt' | 'sortIndex'>): Provider {
    const id = crypto.randomUUID();
    const now = Date.now();
    const sortIndex = this.state.providerOrder.length;

    const newProvider: Provider = {
      ...provider,
      id,
      createdAt: now,
      sortIndex,
    };

    this.state.providers[id] = newProvider;
    this.state.providerOrder.push(id);

    // If this is the first provider, set as current
    if (this.state.providerOrder.length === 1) {
      this.state.currentProviderId = id;
    }

    return newProvider;
  }

  /**
   * Update an existing provider.
   * Meta merge semantics: if updates.meta is provided, it replaces entirely;
   * if absent (undefined), existing meta is preserved.
   */
  updateProvider(id: string, updates: Partial<Provider>): Provider | undefined {
    const existing = this.state.providers[id];
    if (!existing) return undefined;

    // Handle meta merge semantics
    let mergedMeta: ProviderMeta | undefined = existing.meta;
    if (updates.meta !== undefined) {
      // New meta provided - replace entirely
      mergedMeta = updates.meta;
    }
    // If updates.meta is undefined (not provided), keep existing meta

    const updated: Provider = {
      ...existing,
      ...updates,
      id: existing.id, // ID is immutable
      createdAt: existing.createdAt, // createdAt is immutable
      meta: mergedMeta,
    };

    this.state.providers[id] = updated;
    return updated;
  }

  /**
   * Delete a provider. If the deleted provider was current,
   * set current to the first remaining provider or empty string.
   */
  deleteProvider(id: string): boolean {
    if (!this.state.providers[id]) return false;

    delete this.state.providers[id];
    this.state.providerOrder = this.state.providerOrder.filter(pid => pid !== id);

    // Re-index sortIndex values
    this.state.providerOrder.forEach((pid, idx) => {
      const p = this.state.providers[pid];
      if (p) p.sortIndex = idx;
    });

    // Handle current provider reassignment
    if (this.state.currentProviderId === id) {
      this.state.currentProviderId = this.state.providerOrder[0] || '';
    }

    return true;
  }

  /**
   * Switch the current provider. Validates that the target ID exists.
   */
  switchProvider(id: string): boolean {
    if (!this.state.providers[id]) return false;
    this.state.currentProviderId = id;
    return true;
  }

  /**
   * Update sort order of providers.
   */
  updateSortOrder(updates: Array<{ id: string; sortIndex: number }>): void {
    // Apply sortIndex updates
    for (const { id, sortIndex } of updates) {
      const provider = this.state.providers[id];
      if (provider) {
        provider.sortIndex = sortIndex;
      }
    }

    // Re-sort providerOrder by sortIndex
    this.state.providerOrder.sort((a, b) => {
      const pa = this.state.providers[a];
      const pb = this.state.providers[b];
      return (pa?.sortIndex ?? 0) - (pb?.sortIndex ?? 0);
    });
  }

  // === State Access ===

  /**
   * Get the full state snapshot.
   */
  getState(): ProviderManagerState {
    return { ...this.state };
  }

  /**
   * Set the full state (used for loading from storage).
   */
  setState(state: ProviderManagerState): void {
    this.state = { ...state };
  }
}
