const InputBot = {
    defaultTypeDelay: 35,

    keyMap: {
        'Enter':        { code: 'Enter',        keyCode: 13  },
        'Tab':          { code: 'Tab',           keyCode: 9   },
        'Escape':       { code: 'Escape',        keyCode: 27  },
        'Backspace':    { code: 'Backspace',     keyCode: 8   },
        'Delete':       { code: 'Delete',        keyCode: 46  },
        'Space':        { code: 'Space',         keyCode: 32  },
        ' ':            { code: 'Space',         keyCode: 32  },
        'ArrowUp':      { code: 'ArrowUp',       keyCode: 38  },
        'ArrowDown':    { code: 'ArrowDown',     keyCode: 40  },
        'ArrowLeft':    { code: 'ArrowLeft',     keyCode: 37  },
        'ArrowRight':   { code: 'ArrowRight',    keyCode: 39  },
        'F1':           { code: 'F1',            keyCode: 112 },
        'F2':           { code: 'F2',            keyCode: 113 },
        'F3':           { code: 'F3',            keyCode: 114 },
        'F4':           { code: 'F4',            keyCode: 115 },
        'F5':           { code: 'F5',            keyCode: 116 },
        'F6':           { code: 'F6',            keyCode: 117 },
        'F7':           { code: 'F7',            keyCode: 118 },
        'F8':           { code: 'F8',            keyCode: 119 },
        'F9':           { code: 'F9',            keyCode: 120 },
        'F10':          { code: 'F10',           keyCode: 121 },
        'F11':          { code: 'F11',           keyCode: 122 },
        'F12':          { code: 'F12',           keyCode: 123 },
        'Control':      { code: 'ControlLeft',   keyCode: 17  },
        'Shift':        { code: 'ShiftLeft',     keyCode: 16  },
        'Alt':          { code: 'AltLeft',       keyCode: 18  },
        'Meta':         { code: 'MetaLeft',      keyCode: 91  },
    },

    // ==================== HELPERS ====================
    _buildKeyInit(key, modifiers = {}) {
        const mapped = this.keyMap[key];
        return {
            bubbles:    true,
            cancelable: true,
            key:        key === 'Space' ? ' ' : key,
            code:       mapped?.code    ?? ('Key' + key.toUpperCase()),
            keyCode:    mapped?.keyCode ?? key.charCodeAt(0),
            which:      mapped?.keyCode ?? key.charCodeAt(0),
            ctrlKey:    modifiers.ctrlKey    ?? false,
            shiftKey:   modifiers.shiftKey   ?? false,
            altKey:     modifiers.altKey     ?? false,
            metaKey:    modifiers.metaKey    ?? false,
        };
    },

    dispatchMouse(type, x, y, options = {}) {
        const el = document.elementFromPoint(x, y);
        if (!el) {
            console.warn(`No element at (${x}, ${y})`);
            return null;
        }
        const event = new MouseEvent(type, {
            bubbles:    true,
            cancelable: true,
            view:       window,
            clientX:    x,
            clientY:    y,
            screenX:    x + window.screenX - window.scrollX,
            screenY:    y + window.screenY - window.scrollY,
            button:     options.button   ?? 0,
            buttons:    options.buttons  ?? 1,
            ctrlKey:    options.ctrlKey  ?? false,
            shiftKey:   options.shiftKey ?? false,
            altKey:     options.altKey   ?? false,
            metaKey:    options.metaKey  ?? false,
        });
        el.dispatchEvent(event);
        return el;
    },

    // ==================== MOUSE ACTIONS ====================
    moveTo(x, y) {
        this.dispatchMouse('mousemove', x, y);
        console.log(`🟦 Moved to (${x}, ${y})`);
        return this;
    },

    click(x, y, options = {}) {
        const el = this.dispatchMouse('mousedown', x, y, options);
        this.dispatchMouse('mouseup', x, y, options);
        if (el) el.click();
        console.log(`✅ Clicked at (${x}, ${y})`);
        return this;
    },

    // ==================== KEYBOARD ACTIONS ====================
    pressKey(key, modifiers = {}) {
        const init = this._buildKeyInit(key, modifiers);
        const el   = document.activeElement ?? document.body;

        el.dispatchEvent(new KeyboardEvent('keydown',  init));
        el.dispatchEvent(new KeyboardEvent('keypress', init));
        el.dispatchEvent(new KeyboardEvent('keyup',    init));

        if (key === 'Enter' && (el.tagName === 'BUTTON' || el.tagName === 'A')) {
            el.click();
        }

        console.log(`⌨️ Key pressed: [${key}]`);
        return this;
    },

    pressEnter() {
        return this.pressKey('Enter');
    },

    shortcut(...keys) {
        const modifiers = {};
        const mainKey   = keys[keys.length - 1];
        keys.slice(0, -1).forEach(k => {
            if (k === 'Control' || k === 'Ctrl') modifiers.ctrlKey  = true;
            if (k === 'Shift')                   modifiers.shiftKey = true;
            if (k === 'Alt')                     modifiers.altKey   = true;
            if (k === 'Meta' || k === 'Command') modifiers.metaKey  = true;
        });
        this.pressKey(mainKey, modifiers);
        console.log(`⚡ Shortcut: ${keys.join(' + ')}`);
        return this;
    },

    selectAll() { return this.shortcut('Control', 'a'); },
    copy()      { return this.shortcut('Control', 'c'); },
    cut()       { return this.shortcut('Control', 'x'); },
    paste()     { return this.shortcut('Control', 'v'); },
    undo()      { return this.shortcut('Control', 'z'); },
    redo()      { return this.shortcut('Control', 'y'); },
    find()      { return this.shortcut('Control', 'f'); },
    save()      { return this.shortcut('Control', 's'); },

    // ==================== TYPING ====================
    type(text, delay = null) {
        const d  = delay ?? this.defaultTypeDelay;
        const el = document.activeElement;
        if (!el) { console.warn('No focused element!'); return this; }

        (async () => {
            for (const char of text) {
                const init = this._buildKeyInit(char);
                el.dispatchEvent(new KeyboardEvent('keydown',  init));
                el.dispatchEvent(new KeyboardEvent('keypress', init));

                if (el.value !== undefined) {
                    const s = el.selectionStart ?? el.value.length;
                    const e = el.selectionEnd   ?? el.value.length;
                    el.value = el.value.slice(0, s) + char + el.value.slice(e);
                    el.setSelectionRange(s + 1, s + 1);
                    el.dispatchEvent(new Event('input',  { bubbles: true }));
                    el.dispatchEvent(new Event('change', { bubbles: true }));
                } else if (el.isContentEditable) {
                    document.execCommand('insertText', false, char);
                }

                el.dispatchEvent(new KeyboardEvent('keyup', init));
                await new Promise(r => setTimeout(r, d));
            }
            console.log(`⌨️ Typed: "${text}"`);
        })();
        return this;
    },

    typeAt(x, y, text, delay = null) {
        this.click(x, y);
        setTimeout(() => this.type(text, delay), 150);
        return this;
    },

    clearAndType(text, delay = null) {
        const el = document.activeElement;
        if (!el) return this;
        if (el.value !== undefined) {
            el.value = '';
            el.dispatchEvent(new Event('input', { bubbles: true }));
        } else if (el.isContentEditable) {
            document.execCommand('selectAll', false, null);
            document.execCommand('delete',    false, null);
        }
        this.type(text, delay);
        console.log(`🧹 Cleared & typed: "${text}"`);
        return this;
    },

    setValue(el, value) {
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
            window.HTMLInputElement.prototype, 'value'
        )?.set;
        if (nativeInputValueSetter) {
            nativeInputValueSetter.call(el, value);
        } else {
            el.value = value;
        }
        el.dispatchEvent(new Event('input',  { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
        console.log(`📝 Set value: "${value}"`);
        return this;
    },

    // ==================== ELEMENT INSPECTOR ====================

    /**
     * Get the element at (x, y) and full details about it
     * Returns the element so you can chain further calls
     */
    getElementAt(x, y) {
        const el = document.elementFromPoint(x, y);
        if (!el) {
            console.warn(`❌ No element found at (${x}, ${y})`);
            return null;
        }
        console.groupCollapsed(`📍 Element at (${x}, ${y})`);
        console.log('🔷 Element      :', el);
        console.log('🏷️  Tag          :', el.tagName.toLowerCase());
        console.log('🆔 ID           :', el.id           || '(none)');
        console.log('🎨 Classes      :', el.className    || '(none)');
        console.log('📄 Text Content :', el.textContent?.trim().slice(0, 120) || '(none)');
        console.log('📐 Bounding Box :', el.getBoundingClientRect());
        console.groupEnd();
        return el;
    },

    /**
     * Get parent element of element at (x, y)
     * levels = how many levels up to climb (default 1)
     */
    getParentAt(x, y, levels = 1) {
        let el = document.elementFromPoint(x, y);
        if (!el) {
            console.warn(`❌ No element found at (${x}, ${y})`);
            return null;
        }
        let current = el;
        for (let i = 0; i < levels; i++) {
            if (current.parentElement) {
                current = current.parentElement;
            } else {
                console.warn(`⚠️ Reached top of DOM at level ${i}. No more parents.`);
                break;
            }
        }
        console.groupCollapsed(`👆 Parent (${levels} level${levels > 1 ? 's' : ''} up) of element at (${x}, ${y})`);
        console.log('🔷 Parent Element :', current);
        console.log('🏷️  Tag            :', current.tagName.toLowerCase());
        console.log('🆔 ID             :', current.id        || '(none)');
        console.log('🎨 Classes        :', current.className || '(none)');
        console.log('👶 Child Count    :', current.children.length);
        console.groupEnd();
        return current;
    },

    /**
     * Get all direct children of an element
     * Optionally filter by CSS selector
     */
    getChildren(el, selector = null) {
        if (!el) {
            console.warn('❌ getChildren: no element provided');
            return [];
        }
        const children = selector
            ? [...el.querySelectorAll(`:scope > ${selector}`)]
            : [...el.children];

        console.groupCollapsed(`👶 Children of <${el.tagName.toLowerCase()}>${selector ? ` matching "${selector}"` : ''} — ${children.length} found`);
        children.forEach((child, i) => {
            console.log(
                `  [${i}] <${child.tagName.toLowerCase()}>`
                + (child.id        ? ` #${child.id}`         : '')
                + (child.className ? ` .${child.className.trim().replace(/\s+/g, '.')}` : '')
                + ` → "${child.textContent?.trim().slice(0, 60) || ''}"`
            );
        });
        console.groupEnd();
        return children;
    },

    /**
     * Target a specific child inside a parent element
     * parentEl  — the parent DOM element
     * selector  — CSS selector string to find child  e.g. 'button', '.title', '#link'
     * index     — if multiple matches, pick index (default 0 = first)
     */
    getChild(parentEl, selector, index = 0) {
        if (!parentEl) {
            console.warn('❌ getChild: no parent element provided');
            return null;
        }
        const matches = [...parentEl.querySelectorAll(selector)];
        if (!matches.length) {
            console.warn(`❌ getChild: no child matching "${selector}" inside`, parentEl);
            return null;
        }
        const child = matches[index] ?? matches[0];
        console.groupCollapsed(`🎯 Child "${selector}" [${index}] inside <${parentEl.tagName.toLowerCase()}>`);
        console.log('🔷 Child Element :', child);
        console.log('🏷️  Tag           :', child.tagName.toLowerCase());
        console.log('🆔 ID            :', child.id        || '(none)');
        console.log('🎨 Classes       :', child.className || '(none)');
        console.log('📄 Text          :', child.textContent?.trim().slice(0, 120));
        console.groupEnd();
        return child;
    },

    /**
     * Get the raw innerHTML of an element
     * prettify = true formats the HTML for readability
     */
    getInnerHTML(el, prettify = true) {
        if (!el) {
            console.warn('❌ getInnerHTML: no element provided');
            return null;
        }
        let html = el.innerHTML;

        if (prettify) {
            // Basic indent formatting
            let indent = 0;
            html = html
                .replace(/></g, '>\n<')
                .split('\n')
                .map(line => {
                    line = line.trim();
                    if (!line) return '';
                    if (/^<\//.test(line)) indent = Math.max(0, indent - 1);
                    const out = '  '.repeat(indent) + line;
                    if (/^<[^/!][^>]*[^/]>$/.test(line) && !/<.*</.test(line)) indent++;
                    return out;
                })
                .filter(Boolean)
                .join('\n');
        }

        console.groupCollapsed(`📄 innerHTML of <${el.tagName.toLowerCase()}>${el.id ? '#' + el.id : ''}`);
        console.log(html);
        console.groupEnd();
        return html;
    },

    /**
     * Extract visible content (text, images, videos) from an element
     * as they appear in the browser — no raw HTML tags
     * Returns a structured object with { text, images, videos, links }
     */
    getVisibleContent(el) {
        if (!el) {
            console.warn('❌ getVisibleContent: no element provided');
            return null;
        }

        // ── Text ────────────────────────────────────────────────────────────
        // Use TreeWalker to grab only visible text nodes
        const textNodes = [];
        const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, {
            acceptNode(node) {
                const parent = node.parentElement;
                if (!parent) return NodeFilter.FILTER_REJECT;
                const style  = window.getComputedStyle(parent);
                if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
                    return NodeFilter.FILTER_REJECT;
                }
                const text = node.textContent.trim();
                return text ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
            }
        });
        while (walker.nextNode()) {
            textNodes.push(walker.currentNode.textContent.trim());
        }
        const fullText = textNodes.join(' ').replace(/\s+/g, ' ').trim();

        // ── Images ──────────────────────────────────────────────────────────
        const images = [...el.querySelectorAll('img')].map(img => ({
            src:    img.currentSrc || img.src,
            alt:    img.alt    || '(no alt)',
            width:  img.naturalWidth  || img.width,
            height: img.naturalHeight || img.height,
            element: img,
        }));

        // ── Videos ──────────────────────────────────────────────────────────
        const videos = [...el.querySelectorAll('video')].map(vid => ({
            src:      vid.currentSrc || vid.src || [...vid.querySelectorAll('source')].map(s => s.src).join(', '),
            poster:   vid.poster   || '(none)',
            duration: vid.duration ? `${Math.round(vid.duration)}s` : 'unknown',
            width:    vid.videoWidth  || vid.offsetWidth,
            height:   vid.videoHeight || vid.offsetHeight,
            element:  vid,
        }));

        // ── Links ────────────────────────────────────────────────────────────
        const links = [...el.querySelectorAll('a')].map(a => ({
            text: a.textContent.trim(),
            href: a.href,
            element: a,
        }));

        // ── Output ───────────────────────────────────────────────────────────
        const result = { text: fullText, images, videos, links };

        console.groupCollapsed(`👁️  Visible Content of <${el.tagName.toLowerCase()}>${el.id ? '#' + el.id : ''}`);

        console.log('%c📝 TEXT', 'color:cyan;font-weight:bold');
        console.log(fullText || '(no text)');

        if (images.length) {
            console.log('%c🖼️  IMAGES', 'color:cyan;font-weight:bold');
            images.forEach((img, i) =>
                console.log(`  [${i}] ${img.src}  (${img.width}×${img.height})  alt="${img.alt}"`)
            );
        } else {
            console.log('%c🖼️  IMAGES : (none)', 'color:#666');
        }

        if (videos.length) {
            console.log('%c🎬 VIDEOS', 'color:cyan;font-weight:bold');
            videos.forEach((vid, i) =>
                console.log(`  [${i}] ${vid.src}  (${vid.width}×${vid.height})  duration: ${vid.duration}`)
            );
        } else {
            console.log('%c🎬 VIDEOS : (none)', 'color:#666');
        }

        if (links.length) {
            console.log('%c🔗 LINKS', 'color:cyan;font-weight:bold');
            links.forEach((lnk, i) =>
                console.log(`  [${i}] "${lnk.text}"  → ${lnk.href}`)
            );
        } else {
            console.log('%c🔗 LINKS : (none)', 'color:#666');
        }

        console.groupEnd();
        return result;
    },

    /**
     * Copy visible plain-text of an element to clipboard
     */
    async copyVisibleText(el) {
        if (!el) { console.warn('❌ copyVisibleText: no element'); return this; }
        const content = this.getVisibleContent(el);
        try {
            await navigator.clipboard.writeText(content.text);
            console.log(`📋 Copied to clipboard: "${content.text.slice(0, 80)}..."`);
        } catch (e) {
            // Fallback for restricted environments
            const ta = document.createElement('textarea');
            ta.value = content.text;
            ta.style.cssText = 'position:fixed;opacity:0';
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            ta.remove();
            console.log(`📋 Copied (fallback): "${content.text.slice(0, 80)}..."`);
        }
        return this;
    },

    // ==================== VISUAL HELPERS ====================
    showCoords() {
        const old = document.getElementById('inputBotCoords');
        if (old) old.remove();
        const div = document.createElement('div');
        div.id = 'inputBotCoords';
        div.style.cssText = `
            position:fixed;top:10px;left:10px;z-index:2147483647;
            background:#000;color:#0f0;padding:12px 16px;
            border:2px solid #0f0;font-family:'Courier New',monospace;
            font-size:13px;border-radius:6px;pointer-events:none;
            box-shadow:0 0 15px rgba(0,255,0,.5);
        `;
        div.innerHTML = 'X: 0, Y: 0<br>Hover element: —';
        document.body.appendChild(div);

        const update = e => {
            const el  = document.elementFromPoint(e.clientX, e.clientY);
            const tag = el ? `&lt;${el.tagName.toLowerCase()}&gt; ${el.id ? '#' + el.id : ''}` : '—';
            div.innerHTML = `X: ${e.clientX} &nbsp; Y: ${e.clientY}<br>Element: ${tag}`;
        };
        document.addEventListener('mousemove', update);
        this._coordsHandler = update;
        console.log('%c🟢 Coordinate Tracker ON — InputBot.hideCoords() to stop', 'color:lime;font-size:14px');
        return this;
    },

    hideCoords() {
        document.getElementById('inputBotCoords')?.remove();
        if (this._coordsHandler) document.removeEventListener('mousemove', this._coordsHandler);
        console.log('%c🔴 Coordinate Tracker OFF', 'color:orange');
        return this;
    },

    // ==================== ASYNC UTILITIES ====================
    sleep(ms) {
        return new Promise(r => setTimeout(r, ms));
    },

    async waitFor(selectorOrFn, timeout = 5000, interval = 200) {
        const start = Date.now();
        return new Promise((resolve, reject) => {
            const check = () => {
                const result = typeof selectorOrFn === 'function'
                    ? selectorOrFn()
                    : document.querySelector(selectorOrFn);
                if (result) return resolve(result);
                if (Date.now() - start > timeout) return reject(new Error(`waitFor: timeout — ${selectorOrFn}`));
                setTimeout(check, interval);
            };
            check();
        });
    },
};

// ==================== STARTUP REFERENCE ====================
console.log('%c🚀 InputBot — Full Reference', 'color:cyan;font-size:20px;font-weight:bold');
console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color:#444');

// ── MOUSE ─────────────────────────────────────────────────────────────────────
console.log('%c🖱️  MOUSE', 'color:orange;font-size:15px;font-weight:bold');
console.table([
    { Method: 'InputBot.click(x, y)',   Description: 'Left click at coordinates', Example: 'InputBot.click(300, 400)'  },
    { Method: 'InputBot.moveTo(x, y)',  Description: 'Move cursor to position',   Example: 'InputBot.moveTo(150, 250)' },
]);

// ── KEYBOARD ──────────────────────────────────────────────────────────────────
console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color:#444');
console.log('%c⌨️  KEYBOARD', 'color:orange;font-size:15px;font-weight:bold');
console.table([
    { Method: 'InputBot.pressEnter()',              Description: 'Press Enter key',                       Example: 'InputBot.pressEnter()'                     },
    { Method: 'InputBot.pressKey(key, modifiers?)', Description: 'Press ANY key with optional modifiers', Example: 'InputBot.pressKey("a", { ctrlKey: true })' },
    { Method: 'InputBot.shortcut(...keys)',          Description: 'Fire any keyboard shortcut',            Example: 'InputBot.shortcut("Control","Shift","i")'  },
]);

// ── BUILT-IN SHORTCUTS ────────────────────────────────────────────────────────
console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color:#444');
console.log('%c⚡ BUILT-IN SHORTCUTS', 'color:orange;font-size:15px;font-weight:bold');
console.table([
    { Method: 'InputBot.selectAll()', Shortcut: 'Ctrl + A', Example: 'InputBot.selectAll()' },
    { Method: 'InputBot.copy()',      Shortcut: 'Ctrl + C', Example: 'InputBot.copy()'      },
    { Method: 'InputBot.cut()',       Shortcut: 'Ctrl + X', Example: 'InputBot.cut()'       },
    { Method: 'InputBot.paste()',     Shortcut: 'Ctrl + V', Example: 'InputBot.paste()'     },
    { Method: 'InputBot.undo()',      Shortcut: 'Ctrl + Z', Example: 'InputBot.undo()'      },
    { Method: 'InputBot.redo()',      Shortcut: 'Ctrl + Y', Example: 'InputBot.redo()'      },
    { Method: 'InputBot.find()',      Shortcut: 'Ctrl + F', Example: 'InputBot.find()'      },
    { Method: 'InputBot.save()',      Shortcut: 'Ctrl + S', Example: 'InputBot.save()'      },
]);

// ── TYPING & INPUT ────────────────────────────────────────────────────────────
console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color:#444');
console.log('%c📝 TYPING & INPUT', 'color:orange;font-size:15px;font-weight:bold');
console.table([
    { Method: 'InputBot.type(text, delay?)',  Description: 'Type into focused element (char by char)', Example: 'InputBot.type("Hello World")'                            },
    { Method: 'InputBot.typeAt(x, y, text)', Description: 'Click position then type',                 Example: 'InputBot.typeAt(300, 400, "Hello")'                      },
    { Method: 'InputBot.clearAndType(text)', Description: 'Clear field first then type',              Example: 'InputBot.clearAndType("New Text")'                       },
    { Method: 'InputBot.setValue(el, value)',Description: 'Instantly set value (fires all events)',   Example: 'InputBot.setValue(document.querySelector("#inp"),"Hi")'  },
]);

// ── ELEMENT INSPECTOR ─────────────────────────────────────────────────────────
console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color:#444');
console.log('%c🔍 ELEMENT INSPECTOR', 'color:orange;font-size:15px;font-weight:bold');
console.table([
    { Method: 'InputBot.getElementAt(x, y)',            Description: 'Get element at (x,y) with full details',          Example: 'InputBot.getElementAt(300, 400)'                             },
    { Method: 'InputBot.getParentAt(x, y, levels?)',    Description: 'Get parent element N levels up from (x,y)',        Example: 'InputBot.getParentAt(300, 400, 2)'                           },
    { Method: 'InputBot.getChildren(el, selector?)',    Description: 'Get all direct children, optionally filtered',     Example: 'InputBot.getChildren(el, "span")'                            },
    { Method: 'InputBot.getChild(parentEl, sel, idx?)', Description: 'Target a specific child by CSS selector + index',  Example: 'InputBot.getChild(parent, ".btn", 0)'                        },
    { Method: 'InputBot.getInnerHTML(el, prettify?)',   Description: 'Get formatted innerHTML of an element',            Example: 'InputBot.getInnerHTML(el)'                                   },
    { Method: 'InputBot.getVisibleContent(el)',         Description: 'Extract visible text, images, videos, links',      Example: 'InputBot.getVisibleContent(el)'                              },
    { Method: 'InputBot.copyVisibleText(el)',           Description: 'Copy visible plain-text of element to clipboard',  Example: 'await InputBot.copyVisibleText(el)'                          },
]);

// ── VISUAL & UTILITIES ────────────────────────────────────────────────────────
console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color:#444');
console.log('%c🛠️  VISUAL & UTILITIES', 'color:orange;font-size:15px;font-weight:bold');
console.table([
    { Method: 'InputBot.showCoords()',               Description: 'Live XY + element tracker overlay',   Example: 'InputBot.showCoords()'                       },
    { Method: 'InputBot.hideCoords()',               Description: 'Hide the tracker',                    Example: 'InputBot.hideCoords()'                       },
    { Method: 'InputBot.sleep(ms)',                  Description: 'Promise-based delay (use with await)', Example: 'await InputBot.sleep(1000)'                  },
    { Method: 'InputBot.waitFor(selector, timeout)', Description: 'Wait until element appears in DOM',   Example: 'await InputBot.waitFor("#submit-btn", 5000)' },
]);

// ── QUICK EXAMPLES ────────────────────────────────────────────────────────────
console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color:#444');
console.log('%c💡 QUICK EXAMPLES', 'color:yellow;font-size:15px;font-weight:bold');

console.log('%c// 1. Click at coordinates', 'color:#888');
console.log('InputBot.click(300, 400)');

console.log('%c// 2. Move cursor to position', 'color:#888');
console.log('InputBot.moveTo(150, 250)');

console.log('%c// 3. Press Enter', 'color:#888');
console.log('InputBot.pressEnter()');

console.log('%c// 4. Press any key with modifier (Ctrl+A manually)', 'color:#888');
console.log('InputBot.pressKey("a", { ctrlKey: true })');

console.log('%c// 5. Fire a custom shortcut (Ctrl+Shift+I)', 'color:#888');
console.log('InputBot.shortcut("Control", "Shift", "i")');

console.log('%c// 6. Built-in shortcuts', 'color:#888');
console.log('InputBot.selectAll()  // Ctrl+A');
console.log('InputBot.copy()       // Ctrl+C');
console.log('InputBot.cut()        // Ctrl+X');
console.log('InputBot.paste()      // Ctrl+V');
console.log('InputBot.undo()       // Ctrl+Z');
console.log('InputBot.redo()       // Ctrl+Y');
console.log('InputBot.find()       // Ctrl+F');
console.log('InputBot.save()       // Ctrl+S');

console.log('%c// 7. Type into focused element', 'color:#888');
console.log('InputBot.type("Hello World")');

console.log('%c// 8. Click then type at position', 'color:#888');
console.log('InputBot.typeAt(300, 400, "Hello World")');

console.log('%c// 9. Clear existing text then type', 'color:#888');