/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { ApiFormat, ApiCallOptions, ProviderSettingsConfig, ModelListResult } from './types';
import { OpenAiCompatibleStrategy } from './openai-strategy';

/**
 * API call strategy interface - abstracts the request/response format for different API providers.
 */
export interface ApiCallStrategy {
  callApi(prompt: string, config: ProviderSettingsConfig): Promise<string>;
  callApiStream(options: ApiCallOptions, config: ProviderSettingsConfig): Promise<string>;
  listModels(config: ProviderSettingsConfig): Promise<ModelListResult>;
}

/**
 * API strategy registry - selects the appropriate strategy based on provider's apiFormat.
 * Pre-registered with the OpenAI-compatible strategy.
 */
export class ApiStrategyRegistry {
  private strategies: Map<ApiFormat, ApiCallStrategy> = new Map();

  constructor() {
    // Pre-register the OpenAI-compatible strategy
    this.registerStrategy('openai_compatible', new OpenAiCompatibleStrategy());
  }

  /**
   * Register a strategy for a given API format.
   */
  registerStrategy(format: ApiFormat, strategy: ApiCallStrategy): void {
    this.strategies.set(format, strategy);
  }

  /**
   * Get the strategy for a given API format.
   * Defaults to openai_compatible if not found.
   */
  getStrategy(format: ApiFormat): ApiCallStrategy {
    return this.strategies.get(format) ?? this.strategies.get('openai_compatible')!;
  }
}

/** Singleton registry instance */
export const apiStrategyRegistry = new ApiStrategyRegistry();
