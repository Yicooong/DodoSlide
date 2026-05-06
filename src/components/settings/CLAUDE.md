# Settings Components

This directory contains UI components for the provider management settings interface. These components are used by `SettingsModal.tsx` (located in the parent `components/` directory) to render the "API 配置" tab.

## Architecture

```
SettingsModal (parent)
  └─ API 配置 tab
       ├─ ProviderList          (list view: display/switch/add/delete providers)
       │    └─ ProviderListItem  (single provider row)
       └─ ProviderDetailEditor  (form view: add or edit a provider)
            ├─ ApiKeyInput          (password input with show/hide toggle)
            ├─ ModelSelectInput     (text input with dropdown + model chips)
            └─ CustomEndpointEditor (collapsible custom endpoint manager)
```

The settings modal toggles between two views:
- **List view**: `ProviderList` is shown, displaying all configured providers
- **Form view**: `ProviderDetailEditor` is shown when adding or editing a provider

## Component Reference

### ProviderList

**File**: `ProviderList.tsx`

Displays all providers in insertion order with a "添加提供商" button. Shows an empty state with a prompt to add the first provider when no providers exist.

**Props**:
- `providers: Provider[]` — ordered array of providers
- `currentProviderId: string` — ID of the currently active provider
- `onSwitch(id: string)` — switch current provider
- `onDelete(id: string)` — delete a provider (confirmation handled by parent)
- `onAdd()` — enter add-provider mode
- `onEdit(id: string)` — enter edit-provider mode

### ProviderListItem

**File**: `ProviderListItem.tsx`

A single row in the provider list. Shows: current-provider indicator dot, server icon, provider name, category label, model name, "当前" badge (if current), and hover-revealed edit/delete action buttons.

**Props**:
- `provider: Provider` — the provider data
- `isCurrent: boolean` — whether this is the current provider
- `onSwitch(id: string)` — click handler to switch to this provider
- `onDelete(id: string)` — click handler to delete this provider
- `onEdit(id: string)` — click handler to edit this provider

**Behavior**:
- Clicking the row calls `onSwitch`
- Edit/delete buttons use `e.stopPropagation()` to prevent triggering switch
- Action buttons are hidden by default, revealed on hover via `group-hover:opacity-100`

### ProviderDetailEditor

**File**: `ProviderDetailEditor.tsx`

Form for adding or editing a provider. Works in two modes:
- **Add mode**: `provider` prop is `undefined`, calls `onSave` on submit
- **Edit mode**: `provider` prop is provided, calls `onUpdate` on submit

**Props**:
- `provider?: Provider` — undefined for add mode, provided for edit mode
- `onSave(provider: Omit<Provider, 'id' | 'createdAt' | 'sortIndex'>)` — save new provider
- `onUpdate?(id: string, updates: Partial<Provider>)` — update existing provider
- `onCancel()` — cancel editing
- `onTestConnection(providerId: string): Promise<ConnectionTestResult>` — test connection
- `onListModels(endpoint: string, apiKey: string): Promise<ModelListResult>` — list models

**Form fields** (top to bottom):
1. Provider name (text input)
2. API endpoint URL (text input, auto-normalized on blur via `normalizeEndpointUrl`)
3. API Key (`ApiKeyInput` component)
4. Model selection (`ModelSelectInput` component)
5. Connection status indicator (shown after test)
6. Temperature & Max Tokens (side-by-side number inputs)
7. Custom endpoints (`CustomEndpointEditor` component)
8. Notes (optional textarea)

**Validation**: On save, checks name, endpoint, and apiKey are non-empty. Shows inline error messages if validation fails.

**State sync**: Uses `useEffect` to reset form state when the `provider` prop changes (for edit mode).

### ApiKeyInput

**File**: `ApiKeyInput.tsx`

Password input with show/hide toggle and masked key display below.

**Props**:
- `value: string` — current API key value
- `onChange(value: string)` — change handler
- `placeholder?: string` — placeholder text (default: "输入 API Key")

**Behavior**:
- Input type toggles between `password` and `text` via Eye/EyeOff icon button
- Below the input, shows a masked representation: first 4 chars + `••••••••` + last 4 chars
- A green check icon appears when a key is set

### ModelSelectInput

**File**: `ModelSelectInput.tsx`

Combobox-style model selector: a text input that allows free-form model name entry, with an optional dropdown of available models fetched from the API, plus model chip buttons for quick selection.

**Props**:
- `value: string` — current model name
- `onChange(value: string)` — change handler
- `availableModels: string[]` — list of models from connection test
- `onRefresh()` — trigger connection test / model list refresh
- `isTesting: boolean` — whether a connection test is in progress

**Behavior**:
- Text input allows typing any model name directly
- When `availableModels` is non-empty, a ChevronDown button appears; clicking it or focusing the input opens a filtered dropdown
- Dropdown filters models by the current input text (case-insensitive substring match)
- Clicking a dropdown item or a model chip sets the model and closes the dropdown
- Clicking outside the dropdown closes it (via `mousedown` event listener)
- The "Test Connection" button (Wifi icon) calls `onRefresh` to populate `availableModels`
- When no models are available, shows a hint to test connection or type a model name manually

### CustomEndpointEditor

**File**: `CustomEndpointEditor.tsx`

Collapsible section for managing custom endpoints within a provider's `ProviderMeta.customEndpoints`. Starts collapsed to avoid cluttering the main form.

**Props**:
- `endpoints: Record<string, CustomEndpoint>` — current custom endpoints map
- `onChange(endpoints: Record<string, CustomEndpoint>)` — update handler

**Behavior**:
- Header shows "自定义端点" with a count badge and ChevronDown/Up toggle
- When expanded, lists existing endpoints as cards with name, URL, and description
- Each card has hover-revealed edit (Pencil) and delete (Trash2) buttons
- "添加端点" button reveals an inline form with name, URL, and description fields
- URL is auto-normalized on blur via `normalizeEndpointUrl`
- Endpoint keys are derived from the name: `name.trim().toLowerCase().replace(/\s+/g, '-')`
- When editing, if the key changes (name changed), the old key is removed and the new key is used

## Styling

All components use CSS custom properties for theming, consistent with the rest of the application:

| Variable | Usage |
|---|---|
| `--bg-input` | Input field backgrounds |
| `--bg-card` | Card/panel backgrounds |
| `--bg-modal` | Modal/dropdown backgrounds |
| `--bg-button` | Secondary button backgrounds |
| `--bg-accent-bg` | Accent highlight backgrounds |
| `--text-primary` | Primary text color |
| `--text-secondary` | Secondary text color |
| `--text-muted` | Muted/hint text color |
| `--text-inverse` | Inverse text (on accent backgrounds) |
| `--border-default` | Default border color |
| `--border-active` | Active/highlighted border color |
| `--border-subtle` | Subtle border color |
| `--accent` | Accent color (buttons, highlights, indicators) |

Icons are from `lucide-react`. Layout uses Tailwind CSS utility classes.

## Data Flow

```
SettingsModal
  │
  ├─ useProviderManager() ──→ ProviderManager ──→ ProviderStorage ──→ localStorage
  │
  ├─ List view:
  │    ProviderList
  │      └─ ProviderListItem ──→ onSwitch/onDelete/onEdit
  │
  └─ Form view:
       ProviderDetailEditor
         ├─ form state (useState)
         ├─ ApiKeyInput ──→ updates settingsConfig.apiKey
         ├─ ModelSelectInput ──→ updates settingsConfig.model
         │    └─ onRefresh ──→ OpenAiCompatibleStrategy.listModels()
         └─ CustomEndpointEditor ──→ updates meta.customEndpoints
```

All mutations flow through `useProviderManager`, which delegates to `ProviderManager` and persists via `ProviderStorage.save()`.

## Key Design Decisions

1. **List/Form toggle, not side-by-side**: The settings modal shows either the provider list or the detail editor, not both simultaneously. This keeps the UI simple within the 700px-wide modal.

2. **Delete confirmation in parent**: `ProviderList` calls `onDelete` directly; the parent `SettingsModal` handles `window.confirm()` before calling `providerManager.deleteProvider()`.

3. **Combobox for model selection**: `ModelSelectInput` uses a text input + dropdown instead of a `<select>`, allowing users to type custom model names not in the API's model list.

4. **Collapsible custom endpoints**: `CustomEndpointEditor` starts collapsed since most users won't need custom endpoints. The count badge in the header indicates how many are configured.

5. **URL normalization on blur**: Endpoint URLs are normalized (stripping `/chat/completions` suffixes and trailing slashes) when the input loses focus, not on every keystroke, to avoid disrupting the user while typing.
