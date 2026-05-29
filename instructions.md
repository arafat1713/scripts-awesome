# Browser Console Automation Framework Instructions

A modular JavaScript framework for automating website interactions directly from the browser console.

## Getting Started

Paste the contents of `automation-framework.js` into your browser's developer console. The framework will automatically initialize and expose its APIs to the global scope.

## Core APIs

### 1. Register Elements
Register elements with robust multi-strategy selectors.
```javascript
registerElement('searchBar', {
    primarySelector: '//*[@data-testid="search-input"]',
    fallbacks: ['//input[@name="q"]', '/html/body/div[1]/input'],
    description: 'Main search input'
});
```

### 2. Robust Element Picker
Use the interactive picker to automatically generate primary and fallback selectors.
```javascript
// Start interactive element picker
startPicker();
```
*Click on an element to capture it. The framework will try to find stable attributes (data-testid, id, etc.) and generate fallback XPaths.*

### 3. Self-Healing Resolution
The framework automatically heals broken selectors. If the primary selector fails, it tries fallbacks and even a heuristic search based on the description. If a fallback succeeds, it updates the primary selector for future use.

### 4. Basic Actions
```javascript
await click('searchBar');
await type('searchBar', 'Hello World');
await wait(2000);
await scroll('searchBar');
docs(); // Show help
```

### 5. Import & Export
```javascript
const json = exportSelectorConfigs();
importSelectorConfigs(json, { overwrite: true });
```

## Advanced Features
- **Self-Healing:** Automatically updates primary selectors if they break but a fallback works.
- **Heuristic Recovery:** Attempts to find elements by visible text or ARIA labels if all selectors fail.
- **Robustness:** Prioritizes stable attributes like `data-testid` and `aria-label`.
