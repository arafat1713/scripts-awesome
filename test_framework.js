const BrowserAutomation = require('./automation-framework');

// Mocking Browser Environment
global.window = {
    scrollBy: (x, y) => console.log(`Mock window.scrollBy(${x}, ${y})`),
    innerHeight: 1000
};
global.document = {
    evaluate: (xpath, context, resolver, type, result) => {
        console.log(`Mock document.evaluate: ${xpath}`);
        if (xpath === '//button[@id="success"]') {
            return { singleNodeValue: {
                click: () => console.log('Mock Element Clicked'),
                scrollIntoView: (opts) => console.log('Mock Element scrolledIntoView', opts),
                dispatchEvent: (ev) => console.log('Mock Element dispatched event', ev.type)
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
    automation.config.retryInterval = 10; // Speed up tests

    console.log('--- Test: registerElement ---');
    automation.registerElement('submitBtn', {
        xpaths: ['//button[@id="fail"]', '//button[@id="success"]'],
        description: 'Submit button',
        supportedActions: ['click']
    });

    console.log('--- Test: resolveElement and click ---');
    await automation.click('submitBtn');

    console.log('--- Test: type ---');
    await automation.type('submitBtn', 'test text');

    console.log('--- Test: save and load ---');
    automation.save();
    const automation2 = new BrowserAutomation();
    automation2.load();
    if (automation2.elements['submitBtn']) {
        console.log('Save/Load successful');
    } else {
        throw new Error('Save/Load failed');
    }

    console.log('--- Test: runTask ---');
    const steps = [
        { action: 'wait', value: 50 },
        { action: 'click', target: 'submitBtn' },
        { action: 'scroll', target: 'submitBtn' },
        { action: 'click', target: { xpaths: ['//invalid'] }, continueOnFail: true },
        { action: 'wait', value: 50 }
    ];
    await automation.runTask(steps);

    console.log('All tests passed!');
}

runTests().catch(err => {
    console.error('Test failed!', err);
    process.exit(1);
});
