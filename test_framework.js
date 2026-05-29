const BrowserAutomation = require('./automation-framework');

// Mocking Browser Environment
global.HTMLInputElement = { prototype: { value: '' } };
global.HTMLTextAreaElement = { prototype: { value: '' } };

global.window = {
    scrollBy: (x, y) => console.log(`Mock window.scrollBy(${x}, ${y})`),
    innerHeight: 1000,
    HTMLInputElement: global.HTMLInputElement,
    HTMLTextAreaElement: global.HTMLTextAreaElement
};

// Mocking property descriptor for type() bypass logic
Object.defineProperty(global.HTMLInputElement.prototype, 'value', {
    set: function(val) { console.log('Mock Native Setter called with:', val); },
    configurable: true
});
Object.defineProperty(global.HTMLTextAreaElement.prototype, 'value', {
    set: function(val) { console.log('Mock Native Setter called with:', val); },
    configurable: true
});
global.document = {
    body: { tagName: 'BODY' },
    evaluate: (xpath, context, resolver, type, result) => {
        console.log(`Mock document.evaluate: ${xpath}`);
        if (xpath === '//button[@id="success"]' || xpath === '//*[contains(text(), "Submit button") or contains(@aria-label, "Submit button") or contains(@placeholder, "Submit button")]') {
            return { singleNodeValue: {
                click: () => console.log('Mock Element Clicked'),
                focus: () => console.log('Mock Element Focused'),
                scrollIntoView: (opts) => console.log('Mock Element scrolledIntoView', opts),
                dispatchEvent: (ev) => console.log('Mock Element dispatched event', ev.type),
                getAttribute: (attr) => null,
                tagName: 'INPUT'
            } };
        }
        return { singleNodeValue: null };
    }
};
global.XPathResult = { FIRST_ORDERED_NODE_TYPE: 9 };
global.Event = class { constructor(type) { this.type = type; } };
global.localStorage = {
    store: {},
    setItem: (key, val) => { global.localStorage.store[key] = val; },
    getItem: (key) => global.localStorage.store[key]
};

async function runTests() {
    const automation = new BrowserAutomation();
    automation.config.retryInterval = 10;

    console.log('--- Test: Robust Registration and Self-Healing ---');
    automation.registerElement('submitBtn', {
        primarySelector: '//button[@id="fail"]',
        fallbacks: ['//button[@id="success"]'],
        description: 'Submit button'
    });

    console.log('Trying to click submitBtn (primary should fail, fallback should succeed)...');
    await automation.click('submitBtn');

    if (automation.elements.submitBtn.primarySelector === '//button[@id="success"]') {
        console.log('Self-healing successful: primarySelector updated.');
    } else {
        throw new Error('Self-healing failed: primarySelector not updated.');
    }

    console.log('--- Test: Heuristic Recovery ---');
    automation.registerElement('brokenBtn', {
        primarySelector: '//invalid',
        fallbacks: ['//also-invalid'],
        description: 'Submit button'
    });
    console.log('Trying heuristic recovery...');
    await automation.click('brokenBtn');

    console.log('--- Test: Export/Import ---');
    const config = automation.exportSelectorConfigs();
    if (!config.includes('submitBtn')) throw new Error('Export failed');
    automation.importSelectorConfigs(config, { overwrite: true });

    console.log('--- Test: type function event dispatching ---');
    await automation.type('submitBtn', 'New Test Text');

    console.log('--- Test: Fingerprint Recovery ---');
    // Register an element with a fingerprint
    const initialFingerprint = {
        tag: 'BUTTON',
        classes: ['btn', 'primary'],
        attributes: { id: 'old-id', type: 'submit' },
        text: 'Save Changes',
        parentTag: 'DIV',
        childCount: 0,
        position: 0
    };
    automation.registerElement('dynamicBtn', {
        primarySelector: '//button[@id="old-id"]',
        fingerprint: initialFingerprint,
        description: 'Save button'
    });

    // Mock DOM change: the button now has a new ID but same text/classes/tag
    const recoveredElement = {
        tagName: 'BUTTON',
        classList: ['btn', 'primary'],
        attributes: [
            { name: 'id', value: 'new-id' },
            { name: 'type', value: 'submit' }
        ],
        innerText: 'Save Changes',
        parentElement: { tagName: 'DIV' },
        children: [],
        getBoundingClientRect: () => ({ top: 10, left: 10, width: 50, height: 20 }),
        click: () => console.log('Recovered Element Clicked'),
        focus: () => {},
        dispatchEvent: (ev) => {},
        getAttribute: function(name) {
            const attr = this.attributes.find(a => a.name === name);
            return attr ? attr.value : null;
        }
    };

    // Update document.getElementsByTagName to return our recovered element
    const originalGetTags = global.document.getElementsByTagName;
    global.document.getElementsByTagName = (tag) => {
        if (tag === 'BUTTON') {
            const list = [recoveredElement];
            list.item = (i) => list[i];
            return list;
        }
        return [];
    };

    console.log('Trying to click dynamicBtn (selectors should fail, fingerprint should succeed)...');
    await automation.click('dynamicBtn');

    if (automation.elements.dynamicBtn.primarySelector.includes('new-id')) {
        console.log('Fingerprint recovery and self-healing successful.');
    } else {
        throw new Error('Fingerprint recovery failed to update primary selector.');
    }

    global.document.getElementsByTagName = originalGetTags;

    console.log('All tests passed!');
}

runTests().catch(err => {
    console.error('Test failed!', err);
    process.exit(1);
});
