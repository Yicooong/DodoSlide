/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { Provider, ValidationResult } from './types';

/**
 * ProviderValidator - validates provider configurations before persistence.
 */
export class ProviderValidator {
  /**
   * Validate required fields of a provider.
   */
  validateRequiredFields(provider: Partial<Provider>): ValidationResult {
    const errors: string[] = [];

    if (!provider.id || typeof provider.id !== 'string' || provider.id.trim() === '') {
      errors.push('提供商 ID 不能为空');
    }

    if (!provider.name || typeof provider.name !== 'string' || provider.name.trim() === '') {
      errors.push('提供商名称不能为空');
    }

    if (!provider.settingsConfig?.endpoint || provider.settingsConfig.endpoint.trim() === '') {
      errors.push('API 端点不能为空');
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Validate that a URL is a valid HTTP/HTTPS URL.
   */
  validateEndpoint(url: string): ValidationResult {
    const errors: string[] = [];

    if (!url || url.trim() === '') {
      errors.push('API 端点不能为空');
      return { valid: false, errors };
    }

    try {
      const parsed = new URL(url);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        errors.push('API 端点必须以 http:// 或 https:// 开头');
      }
    } catch {
      errors.push('API 端点 URL 格式无效');
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Full provider validation combining all checks.
   */
  validateProvider(provider: Partial<Provider>): ValidationResult {
    const errors: string[] = [];

    // Required fields
    const requiredResult = this.validateRequiredFields(provider);
    errors.push(...requiredResult.errors);

    // Endpoint URL format (only if endpoint is present)
    if (provider.settingsConfig?.endpoint && provider.settingsConfig.endpoint.trim() !== '') {
      const endpointResult = this.validateEndpoint(provider.settingsConfig.endpoint);
      errors.push(...endpointResult.errors);
    }

    // API key warning (not blocking, but included as informational)
    if (!provider.settingsConfig?.apiKey || provider.settingsConfig.apiKey.trim() === '') {
      errors.push('API Key 未设置，生成时将无法调用 API');
    }

    return { valid: errors.length === 0, errors };
  }
}

/** Singleton instance */
export const providerValidator = new ProviderValidator();
