const BrowserAutomation = require('./automation-framework');

// Mocking Browser Environment
global.window = {
    scrollBy: (x, y) => console.log(`Mock window.scrollBy(${x}, ${y})`),
    innerHeight: 1000
};
global.document = {
    evaluate: (xpath, context, resolver, type, result) => {
        console.log(`Mock document.evaluate: ${xpath}`);
        if (xpath === '//button[@id="success"]' || xpath === '//*[contains(text(), "Submit button") or contains(@aria-label, "Submit button") or contains(@placeholder, "Submit button")]') {
            return { singleNodeValue: {
                click: () => console.log('Mock Element Clicked'),
                scrollIntoView: (opts) => console.log('Mock Element scrolledIntoView', opts),
                dispatchEvent: (ev) => console.log('Mock Element dispatched event', ev.type),
                getAttribute: (attr) => null
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

    console.log('All tests passed!');
}

runTests().catch(err => {
    console.error('Test failed!', err);
    process.exit(1);
});
