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
     * Registers an element with its name, primary selector, fallbacks, and metadata.
     * @param {string} name - The unique name for the element.
     * @param {object} config - { primarySelector, fallbacks: [], xpaths: [], description, ... }
     */
    registerElement(name, config) {
        if (!name || typeof name !== 'string') throw new Error('Invalid element name');

        this.elements[name] = {
            name: name,
            primarySelector: config.primarySelector || (config.xpaths ? config.xpaths[0] : null),
            fallbacks: config.fallbacks || (config.xpaths ? config.xpaths.slice(1) : []),
            description: config.description || '',
            supportedActions: config.supportedActions || []
        };
        console.log(`Element "${name}" registered with robust selectors.`);
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
     * Generates robust selectors for a given element.
     * @private
     */
    _generateRobustSelectors(el) {
        const selectors = {
            primary: null,
            fallbacks: []
        };

        // 1. Prefer stable attributes
        const stableAttrs = ['data-testid', 'aria-label', 'name', 'placeholder', 'id'];
        for (const attr of stableAttrs) {
            const val = el.getAttribute(attr);
            if (val) {
                const xpath = `//*[@${attr}="${val}"]`;
                if (!selectors.primary) selectors.primary = xpath;
                else selectors.fallbacks.push(xpath);
            }
        }

        // 2. Text-based XPath
        const text = (el.innerText || '').trim();
        if (text && text.length < 100) {
            selectors.fallbacks.push(`//*[text()="${text}"]`);
            selectors.fallbacks.push(`//*[contains(text(), "${text}")]`);
        }

        // 3. Structural XPath
        const getStructuralXPath = (element) => {
            if (element.id !== '') return `//*[@id="${element.id}"]`;
            if (element === document.body) return '/html/body';
            let ix = 0;
            const siblings = element.parentNode.childNodes;
            for (let i = 0; i < siblings.length; i++) {
                const sibling = siblings[i];
                if (sibling === element) {
                    return getStructuralXPath(element.parentNode) + '/' + element.tagName.toLowerCase() + '[' + (ix + 1) + ']';
                }
                if (sibling.nodeType === 1 && sibling.tagName === element.tagName) {
                    ix++;
                }
            }
        };
        const structural = getStructuralXPath(el);
        if (!selectors.primary) selectors.primary = structural;
        else selectors.fallbacks.push(structural);

        // Remove duplicates
        selectors.fallbacks = [...new Set(selectors.fallbacks)].filter(f => f !== selectors.primary);

        return selectors;
    }

    /**
     * Starts an interactive robust element picker.
     */
    startPicker() {
        console.log('Robust Element picker started. Click an element to capture it. Press Escape to cancel.');

        const overlay = document.createElement('div');
        Object.assign(overlay.style, {
            position: 'fixed', top: '0', left: '0', width: '100%', height: '100%',
            zIndex: '999999', cursor: 'crosshair', backgroundColor: 'rgba(0, 150, 255, 0.1)',
            border: '2px solid #007bff'
        });

        const highlight = document.createElement('div');
        Object.assign(highlight.style, {
            position: 'fixed', pointerEvents: 'none', zIndex: '1000000',
            backgroundColor: 'rgba(0, 150, 255, 0.3)', border: '1px solid #007bff',
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
                    top: `${rect.top}px`, left: `${rect.left}px`, width: `${rect.width}px`, height: `${rect.height}px`, display: 'block'
                });
            } else {
                highlight.style.display = 'none';
            }
        };

        const onClick = (e) => {
            e.preventDefault(); e.stopPropagation();
            overlay.style.pointerEvents = 'none';
            const el = document.elementFromPoint(e.clientX, e.clientY);
            overlay.style.pointerEvents = 'auto';

            if (el && el !== overlay && el !== highlight) {
                const selectors = this._generateRobustSelectors(el);
                const name = prompt(`Captured Selectors.\nPrimary: ${selectors.primary}\nFallbacks: ${selectors.fallbacks.length}\n\nEnter a unique name:`);
                if (name) {
                    const description = prompt('Enter description:', '');
                    this.registerElement(name, {
                        primarySelector: selectors.primary,
                        fallbacks: selectors.fallbacks,
                        description: description
                    });
                    this.save();
                }
            }
            cleanup();
        };

        const onKeydown = (e) => { if (e.key === 'Escape') cleanup(); };

        const cleanup = () => {
            document.removeEventListener('mousemove', onMouseMove);
            overlay.removeEventListener('click', onClick);
            document.removeEventListener('keydown', onKeydown);
            document.body.removeChild(overlay);
            document.body.removeChild(highlight);
            console.log('Robust Element picker stopped.');
        };

        document.addEventListener('mousemove', onMouseMove);
        overlay.addEventListener('click', onClick);
        document.addEventListener('keydown', onKeydown);
    }

    /**
     * Robust element finding with self-healing.
     */
    async find(target) {
        let elementConfig;
        let name = 'unnamed';

        if (typeof target === 'string') {
            name = target;
            elementConfig = this.elements[target];
            if (!elementConfig) throw new Error(`Element "${target}" not found in registry.`);
        } else {
            elementConfig = target;
            name = elementConfig.name || 'unnamed';
        }

        const selectors = [
            elementConfig.primarySelector,
            ...(elementConfig.fallbacks || []),
            ...(elementConfig.xpaths || [])
        ].filter(Boolean);

        let element = null;
        let usedSelector = null;

        const attemptAllSelectors = () => {
            for (const selector of selectors) {
                console.log(`Trying selector for "${name}": ${selector}`);
                const el = this._evaluateXPath(selector);
                if (el) {
                    usedSelector = selector;
                    return el;
                }
            }
            return null;
        };

        // Try primary and fallbacks with retries
        let retries = this.config.retryCount;
        while (!element && retries >= 0) {
            element = attemptAllSelectors();
            if (!element && retries > 0) {
                console.log(`Element "${name}" not found with any selector. Retrying in ${this.config.retryInterval}ms... (${retries} left)`);
                await this.wait(this.config.retryInterval);
            }
            retries--;
        }

        // If failed, try heuristic search (visible text)
        if (!element && elementConfig.description) {
            console.log(`All selectors failed for "${name}". Trying heuristic search by description/text...`);
            const text = elementConfig.description;
            const heuristicXPath = `//*[contains(text(), "${text}") or contains(@aria-label, "${text}") or contains(@placeholder, "${text}")]`;
            element = this._evaluateXPath(heuristicXPath);
            if (element) {
                usedSelector = heuristicXPath;
                console.log(`Heuristic recovery successful for "${name}" using text: ${text}`);
            }
        }

        // Self-healing: Update primary if fallback was used
        if (element && usedSelector !== elementConfig.primarySelector && typeof target === 'string') {
            console.log(`Self-healing triggered for "${name}". Updating primary selector.`);
            this.elements[name].primarySelector = usedSelector;
            this.save();
        }

        if (!element) {
            throw new Error(`Failed to locate element "${name}" after trying all selectors and heuristics.`);
        }

        return element;
    }

    /**
     * Resolves an element (Legacy support for resolveElement)
     */
    async resolveElement(target) {
        return this.find(target);
    }

    async click(target) {
        const el = await this.resolveElement(target);
        el.click();
        console.log(`Clicked on element: ${typeof target === 'string' ? target : 'config'}`);
    }

    async type(target, text) {
        const el = await this.resolveElement(target);
        const targetName = typeof target === 'string' ? target : 'config';

        console.log(`Typing "${text}" into ${targetName}...`);

        el.focus();

        if (el.isContentEditable) {
            el.innerText = text;
        } else {
            // Native value setter to bypass React/Vue's setter overrides
            const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
                window.HTMLInputElement.prototype,
                'value'
            ).set;
            const nativeTextAreaValueSetter = Object.getOwnPropertyDescriptor(
                window.HTMLTextAreaElement.prototype,
                'value'
            ).set;

            const setter = el.tagName === 'TEXTAREA' ? nativeTextAreaValueSetter : nativeInputValueSetter;

            if (setter) {
                setter.call(el, text);
            } else {
                el.value = text;
            }
        }

        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
        el.dispatchEvent(new Event('blur', { bubbles: true }));

        console.log(`Successfully typed into ${targetName}.`);
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
     * Exports the current selector configurations as a JSON string.
     */
    exportSelectorConfigs() {
        const json = JSON.stringify(this.elements, null, 2);
        console.log('Selector configurations exported.');
        return json;
    }

    /**
     * Alias for exportSelectorConfigs (Legacy support for exportRegistry)
     */
    exportRegistry() {
        return this.exportSelectorConfigs();
    }

    /**
     * Imports selector configurations from a JSON string.
     * @param {string} json - JSON string of elements.
     * @param {object} options - { overwrite: boolean }
     */
    importSelectorConfigs(json, options = { overwrite: false }) {
        try {
            const importedElements = JSON.parse(json);
            if (typeof importedElements !== 'object' || importedElements === null) {
                throw new Error('Invalid JSON format: expected an object');
            }

            for (const [name, config] of Object.entries(importedElements)) {
                if (this.elements[name] && !options.overwrite) {
                    console.log(`Element "${name}" already exists. Skipping (overwrite=false).`);
                    continue;
                }

                this.elements[name] = config;
                console.log(`Element "${name}" configuration ${this.elements[name] ? 'updated' : 'imported'}.`);
            }

            this.save();
            console.log('Selector configurations import completed.');
        } catch (e) {
            console.error('Failed to import selector configs:', e.message);
            throw e;
        }
    }

    /**
     * Alias for importSelectorConfigs (Legacy support for importRegistry)
     */
    importRegistry(json, options) {
        return this.importSelectorConfigs(json, options);
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
    window.exportSelectorConfigs = automation.exportSelectorConfigs.bind(automation);
    window.importSelectorConfigs = automation.importSelectorConfigs.bind(automation);
    window.exportRegistry = automation.exportRegistry.bind(automation);
    window.importRegistry = automation.importRegistry.bind(automation);
    window.docs = automation.docs.bind(automation);

    console.log('Automation framework initialized. Access it via window.automation or direct APIs (registerElement, click, type, startPicker, exportSelectorConfigs, importSelectorConfigs, docs, etc.)');
}

if (typeof module !== 'undefined') {
    module.exports = BrowserAutomation;
}
