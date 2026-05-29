# Browser Console Automation Framework Instructions

A modular JavaScript framework for automating website interactions directly from the browser console.

## Getting Started

Paste the contents of `automation-framework.js` into your browser's developer console. The framework will automatically initialize and expose its APIs to the global scope.

## Core APIs

### 1. Register Elements
Register elements using one or more XPaths for robustness.
```javascript
registerElement('searchBar', {
    xpaths: ['//input[@name="q"]', '//input[@type="search"]'],
    description: 'Main search input'
});

registerElement('luckyBtn', {
    xpaths: ['//input[@name="btnI"]'],
    description: 'I\'m Feeling Lucky button'
});
```

### 2. Basic Actions
Perform direct actions on registered elements or using ad-hoc configurations.
```javascript
// Click an element
await click('luckyBtn');

// Type into an element
await type('searchBar', 'Hello World');

// Wait for a specific duration (ms)
await wait(2000);

// Scroll to an element
await scroll('searchBar');

// Start interactive element picker
startPicker();

// Show help documentation
docs();
```

### 3. Import & Export
Export and import your element registry as JSON.
```javascript
// Export current registry as a JSON string
const json = exportRegistry();
console.log(json);

// Import elements from a JSON string
const newElements = `{
  "myNewButton": {
    "xpaths": ["//button[@id='new']"],
    "description": "A button from an external file"
  }
}`;

// Import and merge (don't overwrite existing)
importRegistry(newElements);

// Import and overwrite existing elements if names conflict
importRegistry(newElements, { overwrite: true });
```

### 4. Task Execution
Run a sequence of steps with built-in error handling.
```javascript
const myTask = [
    { action: 'type', target: 'searchBar', value: 'OpenAI' },
    { action: 'wait', value: 500 },
    { action: 'click', target: 'luckyBtn' },
    { action: 'scroll', target: null } // Scroll down
];

// Run the task
await runTask(myTask);

// Run task and continue even if a step fails
await runTask(myTask, { continueOnFail: true });
```

### 5. Persistence
Save and load your configurations to/from `localStorage`.
```javascript
// Save current elements and tasks
save();

// Load previously saved data
load();
```

## Advanced Features
- **Fallback XPaths:** If the first XPath fails, the framework automatically tries the next ones in the list.
- **Retries:** When an element is not found, the framework retries (default 3 times, 500ms interval) before failing.
- **Interactive Picker:** Use `startPicker()` to click elements on the page and automatically generate XPaths and register them.
- **Import/Export:** Seamlessly share and back up your element registry using JSON.
- **In-Console Docs:** Run `docs()` to see a quick reference of all available commands.
- **Event Dispatching:** `type()` automatically dispatches `input` and `change` events for compatibility with modern frameworks.
