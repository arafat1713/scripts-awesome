class BrowserAutomation {
    constructor() {
        this.elements = {};
        this.tasks = {};
        this.config = {
            defaultWaitTime: 1000,
            retryCount: 3,
            retryInterval: 500
        };
    }

    /**
     * Registers an element with its name, XPaths, and metadata.
     * @param {string} name - The unique name for the element.
     * @param {object} config - Configuration including xpaths, description, and supportedActions.
     */
    registerElement(name, config) {
        if (!name || typeof name !== 'string') throw new Error('Invalid element name');
        if (!config || !Array.isArray(config.xpaths)) throw new Error('Invalid element config: xpaths must be an array');

        this.elements[name] = {
            name: name,
            xpaths: config.xpaths,
            description: config.description || '',
            supportedActions: config.supportedActions || []
        };
        console.log(`Element "${name}" registered.`);
    }

    /**
     * Internal helper to evaluate a single XPath.
     * @private
     */
    _evaluateXPath(xpath) {
        try {
            const result = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
            return result.singleNodeValue;
        } catch (e) {
            console.warn(`Error evaluating XPath: ${xpath}`, e);
            return null;
        }
    }

    /**
     * Generates a unique XPath for a given element.
     * @private
     */
    _generateXPath(el) {
        if (el.id !== '') return `//*[@id="${el.id}"]`;
        if (el === document.body) return '/html/body';

        let ix = 0;
        const siblings = el.parentNode.childNodes;
        for (let i = 0; i < siblings.length; i++) {
            const sibling = siblings[i];
            if (sibling === el) {
                return this._generateXPath(el.parentNode) + '/' + el.tagName.toLowerCase() + '[' + (ix + 1) + ']';
            }
            if (sibling.nodeType === 1 && sibling.tagName === el.tagName) {
                ix++;
            }
        }
    }

    /**
     * Starts an interactive element picker.
     */
    startPicker() {
        console.log('Element picker started. Click an element to capture it. Press Escape to cancel.');

        const overlay = document.createElement('div');
        Object.assign(overlay.style, {
            position: 'fixed',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            zIndex: '999999',
            cursor: 'crosshair',
            backgroundColor: 'rgba(0, 150, 255, 0.1)',
            border: '2px solid #007bff'
        });

        const highlight = document.createElement('div');
        Object.assign(highlight.style, {
            position: 'fixed',
            pointerEvents: 'none',
            zIndex: '1000000',
            backgroundColor: 'rgba(0, 150, 255, 0.3)',
            border: '1px solid #007bff',
            transition: 'all 0.1s ease'
        });

        document.body.appendChild(overlay);
        document.body.appendChild(highlight);

        const onMouseMove = (e) => {
            overlay.style.pointerEvents = 'none';
            const el = document.elementFromPoint(e.clientX, e.clientY);
            overlay.style.pointerEvents = 'auto';

            if (el && el !== overlay && el !== highlight) {
                const rect = el.getBoundingClientRect();
                Object.assign(highlight.style, {
                    top: `${rect.top}px`,
                    left: `${rect.left}px`,
                    width: `${rect.width}px`,
                    height: `${rect.height}px`,
                    display: 'block'
                });
            } else {
                highlight.style.display = 'none';
            }
        };

        const onClick = (e) => {
            e.preventDefault();
            e.stopPropagation();

            overlay.style.pointerEvents = 'none';
            const el = document.elementFromPoint(e.clientX, e.clientY);
            overlay.style.pointerEvents = 'auto';

            if (el && el !== overlay && el !== highlight) {
                const xpath = this._generateXPath(el);
                const name = prompt(`Captured XPath: ${xpath}\nEnter a unique name for this element:`);
                if (name) {
                    const description = prompt('Enter a description for this element:', '');
                    this.registerElement(name, {
                        xpaths: [xpath],
                        description: description
                    });
                    this.save();
                }
            }
            cleanup();
        };

        const onKeydown = (e) => {
            if (e.key === 'Escape') cleanup();
        };

        const cleanup = () => {
            document.removeEventListener('mousemove', onMouseMove);
            overlay.removeEventListener('click', onClick);
            document.removeEventListener('keydown', onKeydown);
            document.body.removeChild(overlay);
            document.body.removeChild(highlight);
            console.log('Element picker stopped.');
        };

        document.addEventListener('mousemove', onMouseMove);
        overlay.addEventListener('click', onClick);
        document.addEventListener('keydown', onKeydown);
    }

    /**
     * Internal helper to resolve an element with retry logic.
     * @private
     */
    async _resolveWithRetry(elementConfig) {
        const findElement = () => {
            for (const xpath of elementConfig.xpaths) {
                const el = this._evaluateXPath(xpath);
                if (el) return el;
            }
            return null;
        };

        let element = findElement();
        let retries = this.config.retryCount;

        while (!element && retries > 0) {
            console.log(`Element "${elementConfig.name || 'unnamed'}" not found, retrying... (${retries} left)`);
            await this.wait(this.config.retryInterval);
            element = findElement();
            retries--;
        }

        if (!element) {
            throw new Error(`Failed to resolve element: ${elementConfig.name || 'unnamed'} using provided XPaths.`);
        }

        return element;
    }

    /**
     * Resolves an element from its name or config using XPaths.
     * @param {string|object} target - Element name or config.
     * @returns {Promise<HTMLElement>}
     */
    async resolveElement(target) {
        let elementConfig;
        if (typeof target === 'string') {
            elementConfig = this.elements[target];
            if (!elementConfig) throw new Error(`Element "${target}" not found in registry.`);
        } else if (target && Array.isArray(target.xpaths)) {
            elementConfig = target;
        } else {
            throw new Error('Invalid resolve target: must be element name or config with xpaths');
        }

        return await this._resolveWithRetry(elementConfig);
    }

    async click(target) {
        const el = await this.resolveElement(target);
        el.click();
        console.log(`Clicked on element: ${typeof target === 'string' ? target : 'config'}`);
    }

    async type(target, text) {
        const el = await this.resolveElement(target);
        el.value = text;
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
        console.log(`Typed "${text}" into element: ${typeof target === 'string' ? target : 'config'}`);
    }

    async wait(ms) {
        const waitTime = ms || this.config.defaultWaitTime;
        console.log(`Waiting for ${waitTime}ms...`);
        return new Promise(resolve => setTimeout(resolve, waitTime));
    }

    async scroll(target, options = { behavior: 'smooth', block: 'center' }) {
        if (!target) {
            window.scrollBy(0, window.innerHeight / 2);
            console.log('Scrolled down by half window height');
            return;
        }
        const el = await this.resolveElement(target);
        el.scrollIntoView(options);
        console.log(`Scrolled to element: ${typeof target === 'string' ? target : 'config'}`);
    }

    /**
     * Saves elements and tasks to localStorage.
     */
    save() {
        const data = {
            elements: this.elements,
            tasks: this.tasks
        };
        localStorage.setItem('browserAutomationData', JSON.stringify(data));
        console.log('Data saved to localStorage.');
    }

    /**
     * Loads elements and tasks from localStorage.
     */
    load() {
        const data = localStorage.getItem('browserAutomationData');
        if (data) {
            const parsed = JSON.parse(data);
            this.elements = parsed.elements || {};
            this.tasks = parsed.tasks || {};
            console.log('Data loaded from localStorage.');
        } else {
            console.log('No saved data found in localStorage.');
        }
    }

    /**
     * Exports the current element registry as a JSON string.
     */
    exportRegistry() {
        const json = JSON.stringify(this.elements, null, 2);
        console.log('Registry exported.');
        return json;
    }

    /**
     * Imports elements from a JSON string.
     * @param {string} json - JSON string of elements.
     * @param {object} options - { overwrite: boolean }
     */
    importRegistry(json, options = { overwrite: false }) {
        try {
            const importedElements = JSON.parse(json);
            if (typeof importedElements !== 'object' || importedElements === null) {
                throw new Error('Invalid JSON format: expected an object');
            }

            for (const [name, config] of Object.entries(importedElements)) {
                if (!config.xpaths || !Array.isArray(config.xpaths)) {
                    console.warn(`Skipping invalid element: ${name}`);
                    continue;
                }

                if (this.elements[name] && !options.overwrite) {
                    console.log(`Element "${name}" already exists. Skipping (overwrite=false).`);
                    continue;
                }

                this.elements[name] = config;
                console.log(`Element "${name}" ${this.elements[name] ? 'updated' : 'imported'}.`);
            }

            this.save();
            console.log('Registry import completed.');
        } catch (e) {
            console.error('Failed to import registry:', e.message);
            throw e;
        }
    }

    /**
     * Executes a sequence of steps.
     * @param {Array} steps - Array of step objects {action, target, value, options, continueOnFail}
     * @param {object} options - Global task options like continueOnFail
     */
    async runTask(steps, options = { continueOnFail: false }) {
        console.log('Starting task execution...');
        for (let i = 0; i < steps.length; i++) {
            const step = steps[i];
            console.log(`Executing step ${i + 1}/${steps.length}: ${step.action} on ${step.target || 'N/A'}`);

            try {
                switch (step.action) {
                    case 'click':
                        await this.click(step.target);
                        break;
                    case 'type':
                        await this.type(step.target, step.value);
                        break;
                    case 'wait':
                        await this.wait(step.value);
                        break;
                    case 'scroll':
                        await this.scroll(step.target, step.options);
                        break;
                    default:
                        if (typeof this[step.action] === 'function') {
                            await this[step.action](step.target, step.value || step.options);
                        } else {
                            throw new Error(`Unknown action: ${step.action}`);
                        }
                }
            } catch (error) {
                console.error(`Error in step ${i + 1}: ${error.message}`);
                const shouldContinue = step.continueOnFail !== undefined ? step.continueOnFail : options.continueOnFail;
                if (!shouldContinue) {
                    console.error('Task aborted due to error.');
                    throw error;
                }
                console.log('Continuing to next step despite error.');
            }
        }
        console.log('Task execution completed.');
    }

    /**
     * Registers a task (sequence of steps) by name.
     */
    registerTask(name, steps) {
        this.tasks[name] = steps;
        console.log(`Task "${name}" registered.`);
    }

    /**
     * Runs a registered task by name.
     */
    async runRegisteredTask(name, options) {
        const steps = this.tasks[name];
        if (!steps) throw new Error(`Task "${name}" not found.`);
        return this.runTask(steps, options);
    }

    /**
     * Displays the list of available functions and their usage.
     */
    docs() {
        const help = {
            'registerElement(name, config)': 'Registers an element with XPaths. Config: { xpaths: [], description: "" }',
            'click(target)': 'Clicks on a registered element name or ad-hoc config.',
            'type(target, text)': 'Types text into an element and dispatches events.',
            'wait(ms)': 'Waits for the specified duration in milliseconds.',
            'scroll(target, options)': 'Scrolls to an element or scrolls down if target is null.',
            'save()': 'Saves all elements and tasks to localStorage.',
            'load()': 'Loads elements and tasks from localStorage.',
            'exportRegistry()': 'Returns a JSON string of all registered elements.',
            'importRegistry(json, options)': 'Imports elements from JSON. Options: { overwrite: false }',
            'startPicker()': 'Starts interactive mode to click and register elements.',
            'runTask(steps, options)': 'Executes a sequence of action steps.',
            'docs()': 'Shows this help message.'
        };

        console.table(help);
    }
}

// Expose to global scope
if (typeof window !== 'undefined') {
    const automation = new BrowserAutomation();
    window.automation = automation;

    // Also expose core methods directly for convenience as requested
    window.registerElement = automation.registerElement.bind(automation);
    window.click = automation.click.bind(automation);
    window.type = automation.type.bind(automation);
    window.runTask = automation.runTask.bind(automation);
    window.save = automation.save.bind(automation);
    window.load = automation.load.bind(automation);
    window.scroll = automation.scroll.bind(automation);
    window.wait = automation.wait.bind(automation);
    window.startPicker = automation.startPicker.bind(automation);
    window.exportRegistry = automation.exportRegistry.bind(automation);
    window.importRegistry = automation.importRegistry.bind(automation);
    window.docs = automation.docs.bind(automation);

    console.log('Automation framework initialized. Access it via window.automation or direct APIs (registerElement, click, type, startPicker, exportRegistry, importRegistry, docs, etc.)');
}

if (typeof module !== 'undefined') {
    module.exports = BrowserAutomation;
}
