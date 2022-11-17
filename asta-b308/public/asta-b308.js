
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    const identity = x => x;
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }
    function create_slot(definition, ctx, $$scope, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, $$scope, fn) {
        return definition[1] && fn
            ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
            : $$scope.ctx;
    }
    function get_slot_changes(definition, $$scope, dirty, fn) {
        if (definition[2] && fn) {
            const lets = definition[2](fn(dirty));
            if ($$scope.dirty === undefined) {
                return lets;
            }
            if (typeof lets === 'object') {
                const merged = [];
                const len = Math.max($$scope.dirty.length, lets.length);
                for (let i = 0; i < len; i += 1) {
                    merged[i] = $$scope.dirty[i] | lets[i];
                }
                return merged;
            }
            return $$scope.dirty | lets;
        }
        return $$scope.dirty;
    }
    function update_slot_base(slot, slot_definition, ctx, $$scope, slot_changes, get_slot_context_fn) {
        if (slot_changes) {
            const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
            slot.p(slot_context, slot_changes);
        }
    }
    function get_all_dirty_from_scope($$scope) {
        if ($$scope.ctx.length > 32) {
            const dirty = [];
            const length = $$scope.ctx.length / 32;
            for (let i = 0; i < length; i++) {
                dirty[i] = -1;
            }
            return dirty;
        }
        return -1;
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function svg_element(name) {
        return document.createElementNS('http://www.w3.org/2000/svg', name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function set_style(node, key, value, important) {
        if (value === null) {
            node.style.removeProperty(key);
        }
        else {
            node.style.setProperty(key, value, important ? 'important' : '');
        }
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail, { bubbles = false, cancelable = false } = {}) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, cancelable, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    function onDestroy(fn) {
        get_current_component().$$.on_destroy.push(fn);
    }
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail, { cancelable = false } = {}) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail, { cancelable });
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
                return !event.defaultPrevented;
            }
            return true;
        };
    }
    function setContext(key, context) {
        get_current_component().$$.context.set(key, context);
        return context;
    }
    function getContext(key) {
        return get_current_component().$$.context.get(key);
    }
    // TODO figure out if we still want to support
    // shorthand events, or if we want to implement
    // a real bubbling mechanism
    function bubble(component, event) {
        const callbacks = component.$$.callbacks[event.type];
        if (callbacks) {
            // @ts-ignore
            callbacks.slice().forEach(fn => fn.call(this, event));
        }
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function add_flush_callback(fn) {
        flush_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            while (flushidx < dirty_components.length) {
                const component = dirty_components[flushidx];
                flushidx++;
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
        set_current_component(saved_component);
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
        else if (callback) {
            callback();
        }
    }

    function destroy_block(block, lookup) {
        block.d(1);
        lookup.delete(block.key);
    }
    function update_keyed_each(old_blocks, dirty, get_key, dynamic, ctx, list, lookup, node, destroy, create_each_block, next, get_context) {
        let o = old_blocks.length;
        let n = list.length;
        let i = o;
        const old_indexes = {};
        while (i--)
            old_indexes[old_blocks[i].key] = i;
        const new_blocks = [];
        const new_lookup = new Map();
        const deltas = new Map();
        i = n;
        while (i--) {
            const child_ctx = get_context(ctx, list, i);
            const key = get_key(child_ctx);
            let block = lookup.get(key);
            if (!block) {
                block = create_each_block(key, child_ctx);
                block.c();
            }
            else if (dynamic) {
                block.p(child_ctx, dirty);
            }
            new_lookup.set(key, new_blocks[i] = block);
            if (key in old_indexes)
                deltas.set(key, Math.abs(i - old_indexes[key]));
        }
        const will_move = new Set();
        const did_move = new Set();
        function insert(block) {
            transition_in(block, 1);
            block.m(node, next);
            lookup.set(block.key, block);
            next = block.first;
            n--;
        }
        while (o && n) {
            const new_block = new_blocks[n - 1];
            const old_block = old_blocks[o - 1];
            const new_key = new_block.key;
            const old_key = old_block.key;
            if (new_block === old_block) {
                // do nothing
                next = new_block.first;
                o--;
                n--;
            }
            else if (!new_lookup.has(old_key)) {
                // remove old block
                destroy(old_block, lookup);
                o--;
            }
            else if (!lookup.has(new_key) || will_move.has(new_key)) {
                insert(new_block);
            }
            else if (did_move.has(old_key)) {
                o--;
            }
            else if (deltas.get(new_key) > deltas.get(old_key)) {
                did_move.add(new_key);
                insert(new_block);
            }
            else {
                will_move.add(old_key);
                o--;
            }
        }
        while (o--) {
            const old_block = old_blocks[o];
            if (!new_lookup.has(old_block.key))
                destroy(old_block, lookup);
        }
        while (n)
            insert(new_blocks[n - 1]);
        return new_blocks;
    }
    function validate_each_keys(ctx, list, get_context, get_key) {
        const keys = new Set();
        for (let i = 0; i < list.length; i++) {
            const key = get_key(get_context(ctx, list, i));
            if (keys.has(key)) {
                throw new Error('Cannot have duplicate keys in a keyed each');
            }
            keys.add(key);
        }
    }

    function bind(component, name, callback) {
        const index = component.$$.props[name];
        if (index !== undefined) {
            component.$$.bound[index] = callback;
            callback(component.$$.ctx[index]);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.50.1' }, detail), { bubbles: true }));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* ../shared/StatApp.svelte generated by Svelte v3.50.1 */

    const file$b = "../shared/StatApp.svelte";
    const get_help_slot_changes = dirty => ({});
    const get_help_slot_context = ctx => ({});

    // (20:3) {#if showHelp}
    function create_if_block$9(ctx) {
    	let div;
    	let current;
    	const help_slot_template = /*#slots*/ ctx[3].help;
    	const help_slot = create_slot(help_slot_template, ctx, /*$$scope*/ ctx[2], get_help_slot_context);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (help_slot) help_slot.c();
    			attr_dev(div, "class", "helptext svelte-zlnjf7");
    			add_location(div, file$b, 20, 3, 381);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (help_slot) {
    				help_slot.m(div, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (help_slot) {
    				if (help_slot.p && (!current || dirty & /*$$scope*/ 4)) {
    					update_slot_base(
    						help_slot,
    						help_slot_template,
    						ctx,
    						/*$$scope*/ ctx[2],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[2])
    						: get_slot_changes(help_slot_template, /*$$scope*/ ctx[2], dirty, get_help_slot_changes),
    						get_help_slot_context
    					);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(help_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(help_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (help_slot) help_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$9.name,
    		type: "if",
    		source: "(20:3) {#if showHelp}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$f(ctx) {
    	let main;
    	let div;
    	let t;
    	let current;
    	let mounted;
    	let dispose;
    	const default_slot_template = /*#slots*/ ctx[3].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[2], null);
    	let if_block = /*showHelp*/ ctx[0] && create_if_block$9(ctx);

    	const block = {
    		c: function create() {
    			main = element("main");
    			div = element("div");
    			if (default_slot) default_slot.c();
    			t = space();
    			if (if_block) if_block.c();
    			attr_dev(div, "class", "content svelte-zlnjf7");
    			add_location(div, file$b, 15, 3, 307);
    			attr_dev(main, "class", "graasta-app svelte-zlnjf7");
    			add_location(main, file$b, 13, 0, 276);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, div);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			append_dev(main, t);
    			if (if_block) if_block.m(main, null);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(window, "keypress", /*handleKeyPress*/ ctx[1], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 4)) {
    					update_slot_base(
    						default_slot,
    						default_slot_template,
    						ctx,
    						/*$$scope*/ ctx[2],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[2])
    						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[2], dirty, null),
    						null
    					);
    				}
    			}

    			if (/*showHelp*/ ctx[0]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*showHelp*/ 1) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block$9(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(main, null);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			if (default_slot) default_slot.d(detaching);
    			if (if_block) if_block.d();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$f.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$f($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('StatApp', slots, ['default','help']);
    	let showHelp = false;
    	const toggleHelp = () => $$invalidate(0, showHelp = !showHelp);

    	const handleKeyPress = e => {
    		if (e.key === 'h') toggleHelp();
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<StatApp> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('$$scope' in $$props) $$invalidate(2, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({ showHelp, toggleHelp, handleKeyPress });

    	$$self.$inject_state = $$props => {
    		if ('showHelp' in $$props) $$invalidate(0, showHelp = $$props.showHelp);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [showHelp, handleKeyPress, $$scope, slots];
    }

    class StatApp extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$f, create_fragment$f, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "StatApp",
    			options,
    			id: create_fragment$f.name
    		});
    	}
    }

    /* ../shared/controls/AppControlArea.svelte generated by Svelte v3.50.1 */

    const file$a = "../shared/controls/AppControlArea.svelte";

    // (7:3) {#if errormsg}
    function create_if_block$8(ctx) {
    	let div;
    	let t;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t = text(/*errormsg*/ ctx[0]);
    			attr_dev(div, "class", "app-control-error svelte-8w06qs");
    			add_location(div, file$a, 6, 17, 126);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*errormsg*/ 1) set_data_dev(t, /*errormsg*/ ctx[0]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$8.name,
    		type: "if",
    		source: "(7:3) {#if errormsg}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$e(ctx) {
    	let fieldset;
    	let t;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[2].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[1], null);
    	let if_block = /*errormsg*/ ctx[0] && create_if_block$8(ctx);

    	const block = {
    		c: function create() {
    			fieldset = element("fieldset");
    			if (default_slot) default_slot.c();
    			t = space();
    			if (if_block) if_block.c();
    			attr_dev(fieldset, "class", "app-control-area svelte-8w06qs");
    			add_location(fieldset, file$a, 4, 0, 56);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, fieldset, anchor);

    			if (default_slot) {
    				default_slot.m(fieldset, null);
    			}

    			append_dev(fieldset, t);
    			if (if_block) if_block.m(fieldset, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 2)) {
    					update_slot_base(
    						default_slot,
    						default_slot_template,
    						ctx,
    						/*$$scope*/ ctx[1],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[1])
    						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[1], dirty, null),
    						null
    					);
    				}
    			}

    			if (/*errormsg*/ ctx[0]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$8(ctx);
    					if_block.c();
    					if_block.m(fieldset, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(fieldset);
    			if (default_slot) default_slot.d(detaching);
    			if (if_block) if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$e.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$e($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('AppControlArea', slots, ['default']);
    	let { errormsg = undefined } = $$props;
    	const writable_props = ['errormsg'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<AppControlArea> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('errormsg' in $$props) $$invalidate(0, errormsg = $$props.errormsg);
    		if ('$$scope' in $$props) $$invalidate(1, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({ errormsg });

    	$$self.$inject_state = $$props => {
    		if ('errormsg' in $$props) $$invalidate(0, errormsg = $$props.errormsg);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [errormsg, $$scope, slots];
    }

    class AppControlArea extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$e, create_fragment$e, safe_not_equal, { errormsg: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "AppControlArea",
    			options,
    			id: create_fragment$e.name
    		});
    	}

    	get errormsg() {
    		throw new Error("<AppControlArea>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set errormsg(value) {
    		throw new Error("<AppControlArea>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* ../shared/controls/AppControl.svelte generated by Svelte v3.50.1 */

    const file$9 = "../shared/controls/AppControl.svelte";

    function create_fragment$d(ctx) {
    	let div1;
    	let div0;
    	let t0;
    	let label_1;
    	let t1;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[5].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[4], null);

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			t0 = space();
    			label_1 = element("label");
    			t1 = space();
    			if (default_slot) default_slot.c();
    			attr_dev(div0, "class", "shield svelte-1u3qye");
    			add_location(div0, file$9, 8, 3, 176);
    			attr_dev(label_1, "for", /*id*/ ctx[0]);
    			attr_dev(label_1, "class", "svelte-1u3qye");
    			add_location(label_1, file$9, 9, 3, 206);
    			attr_dev(div1, "class", "app-control svelte-1u3qye");
    			toggle_class(div1, "hidden", /*hidden*/ ctx[3]);
    			toggle_class(div1, "disable", /*disable*/ ctx[2]);
    			add_location(div1, file$9, 7, 0, 120);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div1, t0);
    			append_dev(div1, label_1);
    			label_1.innerHTML = /*label*/ ctx[1];
    			append_dev(div1, t1);

    			if (default_slot) {
    				default_slot.m(div1, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (!current || dirty & /*label*/ 2) label_1.innerHTML = /*label*/ ctx[1];
    			if (!current || dirty & /*id*/ 1) {
    				attr_dev(label_1, "for", /*id*/ ctx[0]);
    			}

    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 16)) {
    					update_slot_base(
    						default_slot,
    						default_slot_template,
    						ctx,
    						/*$$scope*/ ctx[4],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[4])
    						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[4], dirty, null),
    						null
    					);
    				}
    			}

    			if (!current || dirty & /*hidden*/ 8) {
    				toggle_class(div1, "hidden", /*hidden*/ ctx[3]);
    			}

    			if (!current || dirty & /*disable*/ 4) {
    				toggle_class(div1, "disable", /*disable*/ ctx[2]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$d.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$d($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('AppControl', slots, ['default']);
    	let { id } = $$props;
    	let { label } = $$props;
    	let { disable = false } = $$props;
    	let { hidden = false } = $$props;
    	const writable_props = ['id', 'label', 'disable', 'hidden'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<AppControl> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('id' in $$props) $$invalidate(0, id = $$props.id);
    		if ('label' in $$props) $$invalidate(1, label = $$props.label);
    		if ('disable' in $$props) $$invalidate(2, disable = $$props.disable);
    		if ('hidden' in $$props) $$invalidate(3, hidden = $$props.hidden);
    		if ('$$scope' in $$props) $$invalidate(4, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({ id, label, disable, hidden });

    	$$self.$inject_state = $$props => {
    		if ('id' in $$props) $$invalidate(0, id = $$props.id);
    		if ('label' in $$props) $$invalidate(1, label = $$props.label);
    		if ('disable' in $$props) $$invalidate(2, disable = $$props.disable);
    		if ('hidden' in $$props) $$invalidate(3, hidden = $$props.hidden);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [id, label, disable, hidden, $$scope, slots];
    }

    class AppControl extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$d, create_fragment$d, safe_not_equal, { id: 0, label: 1, disable: 2, hidden: 3 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "AppControl",
    			options,
    			id: create_fragment$d.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*id*/ ctx[0] === undefined && !('id' in props)) {
    			console.warn("<AppControl> was created without expected prop 'id'");
    		}

    		if (/*label*/ ctx[1] === undefined && !('label' in props)) {
    			console.warn("<AppControl> was created without expected prop 'label'");
    		}
    	}

    	get id() {
    		throw new Error("<AppControl>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set id(value) {
    		throw new Error("<AppControl>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get label() {
    		throw new Error("<AppControl>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set label(value) {
    		throw new Error("<AppControl>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get disable() {
    		throw new Error("<AppControl>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set disable(value) {
    		throw new Error("<AppControl>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get hidden() {
    		throw new Error("<AppControl>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set hidden(value) {
    		throw new Error("<AppControl>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* ../shared/controls/AppControlButton.svelte generated by Svelte v3.50.1 */
    const file$8 = "../shared/controls/AppControlButton.svelte";

    // (12:0) <AppControl id={id} label={label} {disable} {hidden}>
    function create_default_slot$3(ctx) {
    	let button;
    	let t;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			t = text(/*text*/ ctx[2]);
    			attr_dev(button, "class", "svelte-16fv6fd");
    			add_location(button, file$8, 12, 3, 248);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, t);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler*/ ctx[5], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*text*/ 4) set_data_dev(t, /*text*/ ctx[2]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$3.name,
    		type: "slot",
    		source: "(12:0) <AppControl id={id} label={label} {disable} {hidden}>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$c(ctx) {
    	let appcontrol;
    	let current;

    	appcontrol = new AppControl({
    			props: {
    				id: /*id*/ ctx[0],
    				label: /*label*/ ctx[1],
    				disable: /*disable*/ ctx[3],
    				hidden: /*hidden*/ ctx[4],
    				$$slots: { default: [create_default_slot$3] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(appcontrol.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(appcontrol, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const appcontrol_changes = {};
    			if (dirty & /*id*/ 1) appcontrol_changes.id = /*id*/ ctx[0];
    			if (dirty & /*label*/ 2) appcontrol_changes.label = /*label*/ ctx[1];
    			if (dirty & /*disable*/ 8) appcontrol_changes.disable = /*disable*/ ctx[3];
    			if (dirty & /*hidden*/ 16) appcontrol_changes.hidden = /*hidden*/ ctx[4];

    			if (dirty & /*$$scope, text*/ 68) {
    				appcontrol_changes.$$scope = { dirty, ctx };
    			}

    			appcontrol.$set(appcontrol_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(appcontrol.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(appcontrol.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(appcontrol, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$c.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$c($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('AppControlButton', slots, []);
    	let { id } = $$props;
    	let { label } = $$props;
    	let { text } = $$props;
    	let { disable = false } = $$props;
    	let { hidden = false } = $$props;
    	const writable_props = ['id', 'label', 'text', 'disable', 'hidden'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<AppControlButton> was created with unknown prop '${key}'`);
    	});

    	function click_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	$$self.$$set = $$props => {
    		if ('id' in $$props) $$invalidate(0, id = $$props.id);
    		if ('label' in $$props) $$invalidate(1, label = $$props.label);
    		if ('text' in $$props) $$invalidate(2, text = $$props.text);
    		if ('disable' in $$props) $$invalidate(3, disable = $$props.disable);
    		if ('hidden' in $$props) $$invalidate(4, hidden = $$props.hidden);
    	};

    	$$self.$capture_state = () => ({
    		AppControl,
    		id,
    		label,
    		text,
    		disable,
    		hidden
    	});

    	$$self.$inject_state = $$props => {
    		if ('id' in $$props) $$invalidate(0, id = $$props.id);
    		if ('label' in $$props) $$invalidate(1, label = $$props.label);
    		if ('text' in $$props) $$invalidate(2, text = $$props.text);
    		if ('disable' in $$props) $$invalidate(3, disable = $$props.disable);
    		if ('hidden' in $$props) $$invalidate(4, hidden = $$props.hidden);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [id, label, text, disable, hidden, click_handler];
    }

    class AppControlButton extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$c, create_fragment$c, safe_not_equal, {
    			id: 0,
    			label: 1,
    			text: 2,
    			disable: 3,
    			hidden: 4
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "AppControlButton",
    			options,
    			id: create_fragment$c.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*id*/ ctx[0] === undefined && !('id' in props)) {
    			console.warn("<AppControlButton> was created without expected prop 'id'");
    		}

    		if (/*label*/ ctx[1] === undefined && !('label' in props)) {
    			console.warn("<AppControlButton> was created without expected prop 'label'");
    		}

    		if (/*text*/ ctx[2] === undefined && !('text' in props)) {
    			console.warn("<AppControlButton> was created without expected prop 'text'");
    		}
    	}

    	get id() {
    		throw new Error("<AppControlButton>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set id(value) {
    		throw new Error("<AppControlButton>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get label() {
    		throw new Error("<AppControlButton>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set label(value) {
    		throw new Error("<AppControlButton>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get text() {
    		throw new Error("<AppControlButton>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set text(value) {
    		throw new Error("<AppControlButton>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get disable() {
    		throw new Error("<AppControlButton>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set disable(value) {
    		throw new Error("<AppControlButton>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get hidden() {
    		throw new Error("<AppControlButton>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set hidden(value) {
    		throw new Error("<AppControlButton>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    function fade(node, { delay = 0, duration = 400, easing = identity } = {}) {
        const o = +getComputedStyle(node).opacity;
        return {
            delay,
            duration,
            easing,
            css: t => `opacity: ${t * o}`
        };
    }

    /* ../shared/controls/AppControlSwitch.svelte generated by Svelte v3.50.1 */
    const file$7 = "../shared/controls/AppControlSwitch.svelte";

    function get_each_context$3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[8] = list[i];
    	return child_ctx;
    }

    // (16:6) {#each options as option (option)}
    function create_each_block$3(key_1, ctx) {
    	let div;
    	let t_value = /*option*/ ctx[8] + "";
    	let t;
    	let mounted;
    	let dispose;

    	function click_handler() {
    		return /*click_handler*/ ctx[6](/*option*/ ctx[8]);
    	}

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			div = element("div");
    			t = text(t_value);
    			attr_dev(div, "class", "option svelte-yqpg3s");
    			toggle_class(div, "selected", /*option*/ ctx[8] == /*value*/ ctx[0]);
    			add_location(div, file$7, 16, 6, 392);
    			this.first = div;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t);

    			if (!mounted) {
    				dispose = listen_dev(div, "click", click_handler, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*options*/ 8 && t_value !== (t_value = /*option*/ ctx[8] + "")) set_data_dev(t, t_value);

    			if (dirty & /*options, value*/ 9) {
    				toggle_class(div, "selected", /*option*/ ctx[8] == /*value*/ ctx[0]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$3.name,
    		type: "each",
    		source: "(16:6) {#each options as option (option)}",
    		ctx
    	});

    	return block;
    }

    // (13:0) <AppControl {id} {label} {disable} {hidden} >
    function create_default_slot$2(ctx) {
    	let div;
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let t;
    	let input;
    	let mounted;
    	let dispose;
    	let each_value = /*options*/ ctx[3];
    	validate_each_argument(each_value);
    	const get_key = ctx => /*option*/ ctx[8];
    	validate_each_keys(ctx, each_value, get_each_context$3, get_key);

    	for (let i = 0; i < each_value.length; i += 1) {
    		let child_ctx = get_each_context$3(ctx, each_value, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block$3(key, child_ctx));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t = space();
    			input = element("input");
    			attr_dev(div, "class", "selector svelte-yqpg3s");
    			add_location(div, file$7, 14, 3, 322);
    			attr_dev(input, "name", /*id*/ ctx[1]);
    			attr_dev(input, "class", "svelte-yqpg3s");
    			add_location(input, file$7, 20, 3, 518);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			insert_dev(target, t, anchor);
    			insert_dev(target, input, anchor);
    			set_input_value(input, /*value*/ ctx[0]);

    			if (!mounted) {
    				dispose = listen_dev(input, "input", /*input_input_handler*/ ctx[7]);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*options, value*/ 9) {
    				each_value = /*options*/ ctx[3];
    				validate_each_argument(each_value);
    				validate_each_keys(ctx, each_value, get_each_context$3, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each_1_lookup, div, destroy_block, create_each_block$3, null, get_each_context$3);
    			}

    			if (dirty & /*id*/ 2) {
    				attr_dev(input, "name", /*id*/ ctx[1]);
    			}

    			if (dirty & /*value*/ 1 && input.value !== /*value*/ ctx[0]) {
    				set_input_value(input, /*value*/ ctx[0]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d();
    			}

    			if (detaching) detach_dev(t);
    			if (detaching) detach_dev(input);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$2.name,
    		type: "slot",
    		source: "(13:0) <AppControl {id} {label} {disable} {hidden} >",
    		ctx
    	});

    	return block;
    }

    function create_fragment$b(ctx) {
    	let appcontrol;
    	let current;

    	appcontrol = new AppControl({
    			props: {
    				id: /*id*/ ctx[1],
    				label: /*label*/ ctx[2],
    				disable: /*disable*/ ctx[4],
    				hidden: /*hidden*/ ctx[5],
    				$$slots: { default: [create_default_slot$2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(appcontrol.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(appcontrol, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const appcontrol_changes = {};
    			if (dirty & /*id*/ 2) appcontrol_changes.id = /*id*/ ctx[1];
    			if (dirty & /*label*/ 4) appcontrol_changes.label = /*label*/ ctx[2];
    			if (dirty & /*disable*/ 16) appcontrol_changes.disable = /*disable*/ ctx[4];
    			if (dirty & /*hidden*/ 32) appcontrol_changes.hidden = /*hidden*/ ctx[5];

    			if (dirty & /*$$scope, id, value, options*/ 2059) {
    				appcontrol_changes.$$scope = { dirty, ctx };
    			}

    			appcontrol.$set(appcontrol_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(appcontrol.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(appcontrol.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(appcontrol, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$b.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$b($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('AppControlSwitch', slots, []);
    	let { id } = $$props;
    	let { label } = $$props;
    	let { options } = $$props;
    	let { value = options[0] } = $$props;
    	let { disable = false } = $$props;
    	let { hidden = false } = $$props;
    	const writable_props = ['id', 'label', 'options', 'value', 'disable', 'hidden'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<AppControlSwitch> was created with unknown prop '${key}'`);
    	});

    	const click_handler = option => $$invalidate(0, value = option);

    	function input_input_handler() {
    		value = this.value;
    		$$invalidate(0, value);
    	}

    	$$self.$$set = $$props => {
    		if ('id' in $$props) $$invalidate(1, id = $$props.id);
    		if ('label' in $$props) $$invalidate(2, label = $$props.label);
    		if ('options' in $$props) $$invalidate(3, options = $$props.options);
    		if ('value' in $$props) $$invalidate(0, value = $$props.value);
    		if ('disable' in $$props) $$invalidate(4, disable = $$props.disable);
    		if ('hidden' in $$props) $$invalidate(5, hidden = $$props.hidden);
    	};

    	$$self.$capture_state = () => ({
    		fade,
    		AppControl,
    		id,
    		label,
    		options,
    		value,
    		disable,
    		hidden
    	});

    	$$self.$inject_state = $$props => {
    		if ('id' in $$props) $$invalidate(1, id = $$props.id);
    		if ('label' in $$props) $$invalidate(2, label = $$props.label);
    		if ('options' in $$props) $$invalidate(3, options = $$props.options);
    		if ('value' in $$props) $$invalidate(0, value = $$props.value);
    		if ('disable' in $$props) $$invalidate(4, disable = $$props.disable);
    		if ('hidden' in $$props) $$invalidate(5, hidden = $$props.hidden);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [value, id, label, options, disable, hidden, click_handler, input_input_handler];
    }

    class AppControlSwitch extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$b, create_fragment$b, safe_not_equal, {
    			id: 1,
    			label: 2,
    			options: 3,
    			value: 0,
    			disable: 4,
    			hidden: 5
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "AppControlSwitch",
    			options,
    			id: create_fragment$b.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*id*/ ctx[1] === undefined && !('id' in props)) {
    			console.warn("<AppControlSwitch> was created without expected prop 'id'");
    		}

    		if (/*label*/ ctx[2] === undefined && !('label' in props)) {
    			console.warn("<AppControlSwitch> was created without expected prop 'label'");
    		}

    		if (/*options*/ ctx[3] === undefined && !('options' in props)) {
    			console.warn("<AppControlSwitch> was created without expected prop 'options'");
    		}
    	}

    	get id() {
    		throw new Error("<AppControlSwitch>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set id(value) {
    		throw new Error("<AppControlSwitch>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get label() {
    		throw new Error("<AppControlSwitch>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set label(value) {
    		throw new Error("<AppControlSwitch>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get options() {
    		throw new Error("<AppControlSwitch>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set options(value) {
    		throw new Error("<AppControlSwitch>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get value() {
    		throw new Error("<AppControlSwitch>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set value(value) {
    		throw new Error("<AppControlSwitch>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get disable() {
    		throw new Error("<AppControlSwitch>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set disable(value) {
    		throw new Error("<AppControlSwitch>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get hidden() {
    		throw new Error("<AppControlSwitch>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set hidden(value) {
    		throw new Error("<AppControlSwitch>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const subscriber_queue = [];
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = new Set();
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (const subscriber of subscribers) {
                        subscriber[1]();
                        subscriber_queue.push(subscriber, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.add(subscriber);
            if (subscribers.size === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                subscribers.delete(subscriber);
                if (subscribers.size === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    /**********************************************
     * Functions for statistical tests and models *
     **********************************************/


    /**
     * Finds smallest value in a vector
     * @param {number[]} x - vector with values
     * @returns {number}
     */
    function min(x) {
       let n = x.length;
       let min = Number.POSITIVE_INFINITY;

       while (n--) min = x[n] < min ? x[n] : min;
       return min;
    }


    /**
     * Finds largest value in a vector
     * @param {number[]} x - vector with values
     * @returns {number}
     */
    function max(x) {
       let n = x.length;
       let max = Number.NEGATIVE_INFINITY;

       while (n--) max = x[n] > max ? x[n] : max;
       return max;
    }


    /**
     * Computes sum of all values in a vector
     * @param {number[]} x - vector with values
     * @returns {number}
     */
    function sum(x) {
       let s = 0;
       for (let i = 0; i < x.length; i++) {
          s = s + x[i];
       }

       return s;
    }


    /**
     * Computes product of all value in a vector
     * @param {number[]} x - vector with values
     * @returns {number}
     */
    function prod(x) {
       let p = 1;
       for (let i = 0; i < x.length; i++) {
          p = p * x[i];
       }

       return p;
    }


    /**
     * Computes mean (average) value for a vector
     * @param {number[]} x - vector with values
     * @returns {number}
     */
    function mean(x) {
       return sum(x) / x.length;
    }


    /**
     * Generate a sequence of n numbers between min and max.
     * @param {number} min - first value in the sequence
     * @param {number} max - last value in the sequence
     * @param {number} n - number of values in the sequence
     * @returns {number[]} array with the sequence values
     */
    function seq(min, max, n) {

       if (n < 2) {
          throw new Error("Parameter 'n' should be ≥ 2.");
       }

       if (n === undefined && Number.isInteger(min) && Number.isInteger(max)) {
          if (max === min) return [max];
          n = max - min + 1;
       }

       const step = (max - min + 0.0) / (n - 1 + 0.0);
       let out = [...Array(n)].map((x, i) => min + i * step);

       // if step is smaller than 1 round values to remove small decimals accidentally added by JS
       if (Math.abs(step) < 1) {
          const r = Math.pow(10, Math.round(-Math.log10(step)) + 1);
          out = out.map(v => Math.round((v + Number.EPSILON) * r) / r);
       }

       return(out)
    }


    /**
     * Finds a range of values in a vector (min and max)
     * @param {number[]} x - vector with values
     * @returns {number[]} array with min and max values
     */
    function range(x) {
       return [min(x), max(x)];
    }


    /**
     * Computes a range of values in a vector with a margin
     * @param {number[]} x - vector with values
     * @param {number} margin - margin in parts of one (e.g. 0.1 for 10% or 2 for 200%)
     * @returns{number[]} array with marginal range boundaries
     */
    function mrange(x, margin = 0.05) {
       const mn = min(x);
       const mx = max(x);
       const d = mx - mn;

       return [mn - d * margin, max(x) + d * margin];
    }


    /**
     * Replicates values in x n times
     * @param {any} x - single value or a vector with values
     * @param {number} n - how many times to replicate
     */
    function rep(x, n) {

       if (Array.isArray(n)) {
          if (x.length != n.length) {
             throw new Error("Parameter 'n' should be a single value or a vector of the same length as x.");
          }

          let out = [];
          for (let i = 0; i < n.length; i++) {
             out.push(...rep([x[i]], n[i]));
          }

          return out;
       }

       if (!Array.isArray(x)) x = [x];
       if (n <= 1) return x;

       const nx = x.length;
       x.length = nx * n;
       for (let i = 0; i < n - 1; i ++) {
          for (let j = 0; j < nx; j++) {
             x[nx * (i + 1) + j] = x[j];
          }
       }

       return x;
    }


    /**
     * Create a subset of vectors based on a vector of indices
     * @param {number[]} x - a vector with values
     * @param {number[]} indices - a vector with element indices (first index is 1 not 0!)
     * @param {string} method - what to do with values ("select" or "remove")
     */
    function subset(x, indices, method) {

       if (!Array.isArray(x)) x = [x];
       if (!Array.isArray(indices)) indices = [indices];

       if (indices.length === 0) return [...x];

       if (max(indices) > x.length || min(indices) < 1) {
          throw new Error("Parameter 'indices' must have values between 1 and 'x.length'.");
       }

       const n = indices.length;

       if (!method || method === "select") {
          let out = Array(n);
          for (let i = 0; i < n; i++) {
             out[i] = x[indices[i] - 1];
          }
          return out;
       }

       if (method === "remove") {
          let out = [...x];
          return out.filter((v, i) => !indices.includes(i + 1));
       }

       throw Error("Wrong value for argument 'method'.");
    }


    /**
     * Generate combination of all levels of vectors
     * @param {...} args - a sequence of vectors
     */
    function expandGrid(...args) {

       const nargs = args.length;
       const d = args.map(v => v.length);
       let orep = prod(d);

       let grid = Array(nargs);
       let repFac = 1;

       for (let i = 0; i < nargs; i++) {
          const x = args[i];
          const nx = x.length;
          orep = orep/nx;
          grid[i] = subset(x, rep(rep(seq(1, nx, nx), rep(repFac, nx)), orep));
          repFac = repFac * nx;
       }

       return grid;
    }

    /**********************************************
     * Functions for manipulations with vectors   *
     **********************************************/

    /* Simple functions for arithmetics */
    const add = (a, b) => a + b;
    const times = (a, b) => a * b;


    /**
     * Does element by element multiplication of two vectors, or a vector and a scalar
     * (one of the arguments must be a vector)
     *
     * @param {Array|number} x - a vector or a scalar
     * @param {Array|number} y - a vector or a scalar
     * @returns {Array} - result of the multiplication
     */
    function vmult(x, y) {
       return vop(x, y, times);
    }


    /**
     * Does element by element addition of two vectors, or a vector and a scalar
     * (one of the arguments must be a vector)
     *
     * @param {Array|number} x - a vector or a scalar
     * @param {Array|number} y - a vector or a scalar
     * @returns {Array} - result of the addition
     */
    function vadd(x, y) {
       return vop(x, y, add);
    }


    /**
     * Does element by element arithmetic operation for two vectors, or for a vector and a scalar
     * (one of the arguments must be a vector)
     *
     * @param {Array|number} x - a vector or a scalar
     * @param {Array|number} y - a vector or a scalar
     * @param {function} op - a function which takes two numbers and return a number
     * @returns {Array} - result of the operation
     */
    function vop(x, y, op) {

       // find the longest vector
       const n = x.length | y.length;

       if (n < 1) {
          throw Error("One of the arguments must be a vector.");
       }

       if (!isvector(y)) {
          y = rep(y, n);
       }

       if (!isvector(x)) {
          x = rep(x, n);
       }

       if (x.length !== y.length) {
          throw Error("Dimensions of 'x' and 'y' mismatch.");
       }

       let res = Array(n).fill(0);
       for (let i = 0; i < n; i++) {
          res[i] = op(x[i], y[i]);
       }

       return res;
    }

    /**
     * Checks if argument is a vector (1D Array)
     * @param {any} X - an object/variable
     * @returns {boolean} - result of check
     */
    function isvector(X) {

       if (!isarray(X)) return false;
       if (Array.isArray(X[0])) return false;

       return true;
    }


    /**
     * Computes a dot product of two vectors
     * @param {Array} x - a vector of values (1D Array)
     * @param {Array} y - a vector of values (same length as x)
     * @returns {Number} - result of dot product of the two vectors
     */
    function vdot(x, y) {

       if (!isvector(x)) {
          throw Error("Argument 'x' must be a vector of numbers.");
       }

       if (!isvector(y)) {
          throw Error("Argument 'y' must be a vector of numbers.");
       }

       if (x.length != y.length) {
          throw Error("Vectors 'x' and 'y' must have the same length.");
       }

       let res = 0;
       for (let i = 0; i < x.length; i++) {
          res = res + x[i] * y[i];
       }

       return res;
    }


    /**
     * Does element by element operation of two matrices, a matrix and a scalar or a matrix and a vector
     *
     * if second argument is a vector, function checks its dimension. If it has the same number of elements
     * as number of rows in 'X' it will be applied to every column of 'X'. If it has the same number of
     * elements as number of columns in 'X', it will be applied to every row.
     *
     * @param {Array} X - a matrix
     * @param {Array|number} Y - a matrix, a vector or a scalar
     * @returns {Array} - result of the addition
     */
    function mop(X, Y, op) {

       if (!ismatrix(X)) {
          throw Error("Argument 'X' must be a matrix (2D Array).");
       }

       const nrows = nrow(X);
       const ncols = ncol(X);

       if (!ismatrix(Y)) {
          Y = tomatrix(Y, nrows, ncols);
       }

       if (nrow(X) !== nrow(Y) || ncol(X) !== ncol(Y)) {
          throw Error("Dimensions of 'X' and 'Y' mismatch.");
       }

       let res = zeros(nrows, ncols);
       for (let i = 0; i < nrows; i++) {
          for (let j = 0; j < ncols; j++) {
             res[j][i] = op(X[j][i], Y[j][i]);
          }
       }

       return res;
    }


    /**
     * Does element by element multiplication of two matrices, a matrix and a scalar or a matrix and a vector
     *
     * if second argument is a vector, function checks its dimension. If it has the same number of elements
     * as number of rows in 'X' it will be applied to every column of 'X'. If it has the same number of
     * elements as number of columns in 'X', it will be applied to every row.
     *
     * @param {Array} X - a matrix
     * @param {Array|number} Y - a matrix, a vector or a scalar
     * @returns {Array} - result of the multiplication
     */
    function mmult(X, Y) {
       return mop(X, Y, times);
    }


    /**
     * Computes inner (dot) product of two matrices
     * @param {Array} X - a matrix (array of vectors of the same length)
     * @param {Array} Y - a matrix (array of vectors of the same length)
     * @returns {Array} - result of dot product
     */
    function mdot(X, Y) {

       if (isvector(X)) {
          X = [X];
       }

       if (!ismatrix(X)) {
          throw Error("Argument 'X' must be a vector or a matrix (1D or 2D Array).");
       }

       if (isvector(Y)) {
          Y = [Y];
       }

       if (!ismatrix(Y)) {
          throw Error("Argument 'Y' must be a vector or a matrix (1D or 2D Array).");
       }


       if (ncol(X) != nrow(Y)) {
          throw Error("Dimensions of 'X' and 'Y' mismatch.");
       }

       const n = nrow(X);
       const m = ncol(Y);
       let res = zeros(n, m);

       X = transpose(X);
       for (let i = 0; i < n; i++) {
          for (let j = 0; j < m; j++) {
             res[j][i] = vdot(X[i], Y[j]);
          }
       }

       return res;
    }

    /**
     * Returns a transposed matrix
     * @param {Array} X - a vector or a matrix (1D or 2D Array)
     * @returns {Array} - a transposed
     */
    function transpose(X) {

       if (isvector(X)) {
          X = [X];
       }

       if (!ismatrix(X)) {
          throw Error("Argument 'X' must be a vector or a matrix (1D or 2D Array).");
       }

       return X[0].map((_, colIndex) => X.map(row => row[colIndex]));
    }

    /**
     * Creates an identity matrix of size 'n'
     * @param {number} n - number of rows and columns in the matrix
     */
    function eye(n) {
       let res = zeros(n, n);
       for (let i = 0; i < n; i++) {
          res[i][i] = 1;
       }

       return res;
    }

    /**
     * Returns a matrix (2D Array) filled with zeros
     * @param {Number} n - number of rows
     * @param {Number} m - number of columns
     * @returns {Array} - the generated matrix
     */
    function zeros(n, m) {
       return matrix(n, m, 0);
    }


    /**
     * Creates a matrix (2D Array) filled with constant value
     * @param {Number} n - number of rows
     * @param {Number} m - number of columns
     * @param {Number} a - value
     * @returns {Array} - the generated matrix
     */
    function matrix(n, m, a) {
       return [...Array(m)].map(v => Array(n).fill(a));
    }


    /**
     * Returns number of rows in a matrix
     * @param {Array} X - a vector or a matrix (array of vectors of the same length)
     * @returns {Number} - number of rows
     */
    function nrow(X) {

       if (isvector(X)) {
          // if vector we treat it as column-vector
          return X.length
       }

       if (!ismatrix(X)) {
          throw Error("Argument 'X' must be a vector or a matrix (1D or 2D Array).");
       }

       return X[0].length;
    }


    /**
     * Returns number of columns in a matrix
     * @param {Array} X - a vector or a matrix (1D or 2D Array)
     * @returns {Number} - number of rows
     */
    function ncol(X) {


       if (isvector(X)) {
          // if vector we treat it as column-vector
          return 1
       }

       if (!ismatrix(X)) {
          throw Error("Argument 'X' must be a vector or a matrix (1D or 2D Array).");
       }

       return X.length;
    }

    /**
     * Converts a scalar or a vector into a matrix
     *
     * if 'x' is a scalar it returns a matrix filled with this value, if 'x' is a vector, function
     * checks its dimension. If it has the same number of elements  as 'nrows' it replicates 'x' as
     * columns of the matrix, if it has the same number of elements as 'ncols', it replicates 'x' as
     * rows of the matrix.
     * @param {Array|number} x - a scalar or a vector of values
     * @param {number} nrows - number of rows in final matrix
     * @param {number} ncols - number of columns in the final matrix
     */
    function tomatrix(x, nrows, ncols) {

       if (!isarray(x)) return matrix(nrows, ncols, x);

       if (!isvector(x)) {
          throw Error("Argument 'x' must me a scalar or a vector.");
       }

       // if number of elements in vector is the same as number of rows — replicate the vector column wise
       if (x.length === nrows) return Array(ncols).fill(x);

       // if number of elements in vector is the same as number of columns — replicate the vector row wise
       if (x.length === ncols) return transpose(Array(nrows).fill(x));

       // if number of elements in vector is the same as product of number of rows and columns — reshape the vector into matrix
       if (x.length === nrows * ncols) return Array(ncols).fill(null).map((v, i) => subset(x, vadd(seq(1, nrows), nrows * i )));

       throw Error("Number of elements in 'x' does not match neither 'nrows' nor 'ncols'.")
    }


    /**
     * Checks if argument is a non empty array
     * @param {any} X - an object/variable
     * @returns {boolean} - result of check
     */
    function isarray(X) {
       return Array.isArray(X) && X.length > 0;
    }


    /**
     * Checks if argument is a matrix (2D Array)
     * @param {any} X - an object/variable
     * @returns {boolean} - result of check
     */
    function ismatrix(X) {

       if (!isarray(X)) return false;
       if (!isarray(X[0])) return false;

       // check that all columns/vectors have the same length
       if (!X.every(v => v.length == X[0].length)) return false;

       return true;
    }

    /** Computes a nice spacing value for a given range
        *  @param {Number} localRange - a range (max - min)
        *  @param {boolean} round - round or not the fractions when computing the number
        *  @returns {Number} the computed spacing value
        */
       function niceNum( localRange,  round) {

          const exponent = Math.floor(Math.log10(localRange));
          const fraction = localRange / Math.pow(10, exponent);
          let niceFraction;

          if (round) {
             if (fraction < 1.5)
                niceFraction = 1;
             else if (fraction < 3)
                niceFraction = 2;
             else if (fraction < 7)
                niceFraction = 5;
             else
                niceFraction = 10;
          } else {
             if (fraction <= 1)
                niceFraction = 1;
             else if (fraction <= 2)
                niceFraction = 2;
             else if (fraction <= 5)
                niceFraction = 5;
             else
                niceFraction = 10;
          }

          return niceFraction * Math.pow(10, exponent);
       }

    /* ../shared/plots3d/Axes.svelte generated by Svelte v3.50.1 */
    const file$6 = "../shared/plots3d/Axes.svelte";
    const get_box_slot_changes = dirty => ({});
    const get_box_slot_context = ctx => ({});
    const get_zaxis_slot_changes = dirty => ({});
    const get_zaxis_slot_context = ctx => ({});
    const get_yaxis_slot_changes = dirty => ({});
    const get_yaxis_slot_context = ctx => ({});
    const get_xaxis_slot_changes = dirty => ({});
    const get_xaxis_slot_context = ctx => ({});
    const get_title_slot_changes = dirty => ({});
    const get_title_slot_context = ctx => ({});

    // (371:6) {#if !$isOk}
    function create_if_block$7(ctx) {
    	let p;
    	let t0;
    	let br;
    	let t1;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t0 = text("Axes component was not properly initialized. ");
    			br = element("br");
    			t1 = text("\n         Add plot series (check that coordinates are numeric) or define axes limits manually.");
    			add_location(br, file$6, 372, 54, 12841);
    			attr_dev(p, "class", "message_error");
    			add_location(p, file$6, 371, 6, 12761);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, t0);
    			append_dev(p, br);
    			append_dev(p, t1);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$7.name,
    		type: "if",
    		source: "(371:6) {#if !$isOk}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$a(ctx) {
    	let div1;
    	let div0;
    	let t0;
    	let svg;
    	let g;
    	let t1;
    	let div1_class_value;
    	let current;
    	const title_slot_template = /*#slots*/ ctx[27].title;
    	const title_slot = create_slot(title_slot_template, ctx, /*$$scope*/ ctx[26], get_title_slot_context);
    	const xaxis_slot_template = /*#slots*/ ctx[27].xaxis;
    	const xaxis_slot = create_slot(xaxis_slot_template, ctx, /*$$scope*/ ctx[26], get_xaxis_slot_context);
    	const yaxis_slot_template = /*#slots*/ ctx[27].yaxis;
    	const yaxis_slot = create_slot(yaxis_slot_template, ctx, /*$$scope*/ ctx[26], get_yaxis_slot_context);
    	const zaxis_slot_template = /*#slots*/ ctx[27].zaxis;
    	const zaxis_slot = create_slot(zaxis_slot_template, ctx, /*$$scope*/ ctx[26], get_zaxis_slot_context);
    	const default_slot_template = /*#slots*/ ctx[27].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[26], null);
    	const box_slot_template = /*#slots*/ ctx[27].box;
    	const box_slot = create_slot(box_slot_template, ctx, /*$$scope*/ ctx[26], get_box_slot_context);
    	let if_block = !/*$isOk*/ ctx[0] && create_if_block$7(ctx);

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			if (title_slot) title_slot.c();
    			t0 = space();
    			svg = svg_element("svg");
    			if (xaxis_slot) xaxis_slot.c();
    			if (yaxis_slot) yaxis_slot.c();
    			if (zaxis_slot) zaxis_slot.c();
    			g = svg_element("g");
    			if (default_slot) default_slot.c();
    			if (box_slot) box_slot.c();
    			t1 = space();
    			if (if_block) if_block.c();
    			attr_dev(g, "class", "axes-content");
    			attr_dev(g, "clip-path", "url(#" + /*clipPathID*/ ctx[4] + ")");
    			add_location(g, file$6, 362, 9, 12560);
    			set_style(svg, "background", "beige");
    			attr_dev(svg, "vector-effect", "non-scaling-stroke");
    			attr_dev(svg, "preserveAspectRatio", "none");
    			attr_dev(svg, "class", "axes");
    			add_location(svg, file$6, 355, 6, 12268);
    			attr_dev(div0, "class", "axes-wrapper svelte-8g3gh2");
    			add_location(div0, file$6, 352, 3, 12176);
    			attr_dev(div1, "class", div1_class_value = "plot " + ('plot_' + /*$scale*/ ctx[3]) + " svelte-8g3gh2");
    			toggle_class(div1, "plot_error", !/*$isOk*/ ctx[0]);
    			add_location(div1, file$6, 349, 0, 12044);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);

    			if (title_slot) {
    				title_slot.m(div0, null);
    			}

    			append_dev(div0, t0);
    			append_dev(div0, svg);

    			if (xaxis_slot) {
    				xaxis_slot.m(svg, null);
    			}

    			if (yaxis_slot) {
    				yaxis_slot.m(svg, null);
    			}

    			if (zaxis_slot) {
    				zaxis_slot.m(svg, null);
    			}

    			append_dev(svg, g);

    			if (default_slot) {
    				default_slot.m(g, null);
    			}

    			if (box_slot) {
    				box_slot.m(svg, null);
    			}

    			append_dev(div0, t1);
    			if (if_block) if_block.m(div0, null);
    			/*div0_binding*/ ctx[28](div0);
    			/*div1_binding*/ ctx[29](div1);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (title_slot) {
    				if (title_slot.p && (!current || dirty[0] & /*$$scope*/ 67108864)) {
    					update_slot_base(
    						title_slot,
    						title_slot_template,
    						ctx,
    						/*$$scope*/ ctx[26],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[26])
    						: get_slot_changes(title_slot_template, /*$$scope*/ ctx[26], dirty, get_title_slot_changes),
    						get_title_slot_context
    					);
    				}
    			}

    			if (xaxis_slot) {
    				if (xaxis_slot.p && (!current || dirty[0] & /*$$scope*/ 67108864)) {
    					update_slot_base(
    						xaxis_slot,
    						xaxis_slot_template,
    						ctx,
    						/*$$scope*/ ctx[26],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[26])
    						: get_slot_changes(xaxis_slot_template, /*$$scope*/ ctx[26], dirty, get_xaxis_slot_changes),
    						get_xaxis_slot_context
    					);
    				}
    			}

    			if (yaxis_slot) {
    				if (yaxis_slot.p && (!current || dirty[0] & /*$$scope*/ 67108864)) {
    					update_slot_base(
    						yaxis_slot,
    						yaxis_slot_template,
    						ctx,
    						/*$$scope*/ ctx[26],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[26])
    						: get_slot_changes(yaxis_slot_template, /*$$scope*/ ctx[26], dirty, get_yaxis_slot_changes),
    						get_yaxis_slot_context
    					);
    				}
    			}

    			if (zaxis_slot) {
    				if (zaxis_slot.p && (!current || dirty[0] & /*$$scope*/ 67108864)) {
    					update_slot_base(
    						zaxis_slot,
    						zaxis_slot_template,
    						ctx,
    						/*$$scope*/ ctx[26],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[26])
    						: get_slot_changes(zaxis_slot_template, /*$$scope*/ ctx[26], dirty, get_zaxis_slot_changes),
    						get_zaxis_slot_context
    					);
    				}
    			}

    			if (default_slot) {
    				if (default_slot.p && (!current || dirty[0] & /*$$scope*/ 67108864)) {
    					update_slot_base(
    						default_slot,
    						default_slot_template,
    						ctx,
    						/*$$scope*/ ctx[26],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[26])
    						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[26], dirty, null),
    						null
    					);
    				}
    			}

    			if (box_slot) {
    				if (box_slot.p && (!current || dirty[0] & /*$$scope*/ 67108864)) {
    					update_slot_base(
    						box_slot,
    						box_slot_template,
    						ctx,
    						/*$$scope*/ ctx[26],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[26])
    						: get_slot_changes(box_slot_template, /*$$scope*/ ctx[26], dirty, get_box_slot_changes),
    						get_box_slot_context
    					);
    				}
    			}

    			if (!/*$isOk*/ ctx[0]) {
    				if (if_block) ; else {
    					if_block = create_if_block$7(ctx);
    					if_block.c();
    					if_block.m(div0, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (!current || dirty[0] & /*$scale*/ 8 && div1_class_value !== (div1_class_value = "plot " + ('plot_' + /*$scale*/ ctx[3]) + " svelte-8g3gh2")) {
    				attr_dev(div1, "class", div1_class_value);
    			}

    			if (!current || dirty[0] & /*$scale, $isOk*/ 9) {
    				toggle_class(div1, "plot_error", !/*$isOk*/ ctx[0]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(title_slot, local);
    			transition_in(xaxis_slot, local);
    			transition_in(yaxis_slot, local);
    			transition_in(zaxis_slot, local);
    			transition_in(default_slot, local);
    			transition_in(box_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(title_slot, local);
    			transition_out(xaxis_slot, local);
    			transition_out(yaxis_slot, local);
    			transition_out(zaxis_slot, local);
    			transition_out(default_slot, local);
    			transition_out(box_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			if (title_slot) title_slot.d(detaching);
    			if (xaxis_slot) xaxis_slot.d(detaching);
    			if (yaxis_slot) yaxis_slot.d(detaching);
    			if (zaxis_slot) zaxis_slot.d(detaching);
    			if (default_slot) default_slot.d(detaching);
    			if (box_slot) box_slot.d(detaching);
    			if (if_block) if_block.d();
    			/*div0_binding*/ ctx[28](null);
    			/*div1_binding*/ ctx[29](null);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$a.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function getScale(width, height) {
    	if (height < 300.2 || width < 300.2) return "small";
    	if (height < 600.2 || width < 600.2) return "medium";
    	return "large";
    }

    function instance$a($$self, $$props, $$invalidate) {
    	let P1;
    	let P2;
    	let P;
    	let $zLim;
    	let $xLim;
    	let $yLim;
    	let $height;
    	let $width;
    	let $isOk;
    	let $scale;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Axes', slots, ['title','xaxis','yaxis','zaxis','default','box']);
    	let { limX = [undefined, undefined] } = $$props;
    	let { limY = [undefined, undefined] } = $$props;
    	let { limZ = [undefined, undefined] } = $$props;
    	let { theta = 0 } = $$props;
    	let { phi = 0 } = $$props;
    	let { zoom = 1 } = $$props;

    	/*****************************************/
    	/* Constants                             */
    	/*****************************************/
    	// event dispatcher
    	const dispatch = createEventDispatcher();

    	// number of ticks along each axis
    	const TICK_NUM = { "small": 5, "medium": 8, "large": 12 };

    	// margin between plot series elements and data labels
    	const LABELS_MARGIN = { "small": 5, "medium": 10, "large": 15 };

    	// line styles for different scales and types
    	const LINE_STYLES = {
    		small: ["0", "3,3", "1,1", "3,1"],
    		medium: ["0", "5,5", "2,2", "5,2"],
    		large: ["0", "7,7", "3,3", "7,3"]
    	};

    	// constant to make clip path ID unique
    	const clipPathID = "plottingArea" + Math.round(Math.random() * 10000);

    	/*****************************************/
    	/* Variable parameters for internal use  */
    	/*****************************************/
    	// bindings to plot DOM elements
    	let plotElement;

    	let axesElement;

    	/*****************************************/
    	/* Helper functions                      */
    	/*****************************************/
    	/** Transforms world coordinates to 2D scene pixels by applying the transformation matrix 'tM'
     *  @param {Array} coords - matrix with coordinates [X, Y, Z]
     *  @param {Array} tM - transformation matrix
     *  @returns {Array} matrix with transformed coordinates [x, y]
     */
    	const world2pixels = function (coords, tM) {
    		const coords2D = transpose(mdot(tM, transpose([...coords, rep(1, coords[0].length)])));

    		//      return [coords2D[0].map(x => Math.round(x)), coords2D[1].map(y => Math.round(y))];
    		return [coords2D[0], coords2D[1]];
    	};

    	/** Computes nice tick values for axis
     *  @param {Array} ticks - vector with ticks if alredy available (if not, new will be computed)
     *  @param {Array} lim - vector with axis limits tickets must be computed for
     *  @param {number} maxTickNum - maximum number of ticks to compute
     *  @param {boolean} round - round or not the fractions when computing nice numbers for the ticks
     *  @returns {Array} a vector with computed tick positions
     */
    	const getAxisTicks = function (ticks, lim, maxTickNum, round = true) {
    		// if ticks are already provided do not recompute them
    		if (ticks !== undefined) return ticks;

    		// check if limits are ok
    		if (!Array.isArray(lim) || lim[0] === undefined || lim[1] === undefined) return undefined;

    		// get range as a nice number and compute min, max and steps for the tick sequence
    		const range = niceNum(lim[1] - lim[0], round);

    		const tickSpacing = niceNum(range / (maxTickNum - 1), round);
    		const tickMin = Math.ceil(lim[0] / tickSpacing) * tickSpacing + tickSpacing;
    		const tickMax = Math.floor(lim[1] / tickSpacing) * tickSpacing;

    		// recompute maxTickNum
    		maxTickNum = Math.round((tickMax - tickMin + 1) / tickSpacing) + 1;

    		// create a sequence and return
    		ticks = [...Array(maxTickNum)].map((x, i) => tickMin + i * tickSpacing);

    		// if step is smaller than 1 round values to remove small decimals accidentiall added by JS
    		if (Math.abs(tickSpacing) < 1) {
    			const r = Math.pow(10, 1 + Math.round(-Math.log10(tickSpacing)));
    			ticks = ticks.map(v => Math.round((v + Number.EPSILON) * r) / r);
    		}

    		// make sure the ticks are not aligned with axes limits
    		return ticks.filter(x => x >= lim[0] && x <= lim[1]);
    	};

    	/** Adjusts limits for x-axis (e.g. when new series is added)
     *  @param {Array} newLim - vector with new limits  (two values)
     */
    	const adjustXAxisLimits = function (newLim) {
    		if (!limX.some(v => v === undefined)) return;
    		xLim.update(lim => adjustAxisLimits(lim, newLim));
    	};

    	/** Adjusts limits for y-axis (e.g. when new series is added)
     *  @param {Array} newLim - vector with new limits  (two values)
     */
    	const adjustYAxisLimits = function (newLim) {
    		if (!limY.some(v => v === undefined)) return;
    		yLim.update(lim => adjustAxisLimits(lim, newLim));
    	};

    	/** Adjusts limits for y-axis (e.g. when new series is added)
     *  @param {Array} newLim - vector with new limits  (two values)
     */
    	const adjustZAxisLimits = function (newLim) {
    		if (!limZ.some(v => v === undefined)) return;
    		zLim.update(lim => adjustAxisLimits(lim, newLim));
    	};

    	/** Adjusts x- or y- axis limits (e.g. when new elements are added)
     *  @param {Array} lim - vector with limits for current axis (two values)
     *  @param {Array} newLim - vector with new limits  (two values)
     *  @returns {Array} vector with rescaled values
     *
     *  The new limits are set separately for min and max. Either if current value is undefined or
     *  if new value is outside the current limits (smaller than min or larger than max).
     */
    	const adjustAxisLimits = function (lim, newLim) {
    		const multiSeries = true;

    		let adjustedLim = [
    			lim[0] !== undefined && multiSeries === true && lim[0] < newLim[0]
    			? lim[0]
    			: newLim[0],
    			lim[1] !== undefined && multiSeries === true && lim[1] > newLim[1]
    			? lim[1]
    			: newLim[1]
    		];

    		// special case when both limits are zero
    		if (adjustedLim[0] === 0 && adjustedLim[1] === 0) {
    			adjustedLim = [-0.1, 0.1];
    		}

    		// special case when limits are equal (add ±5%)
    		if (adjustedLim[0] === adjustedLim[1]) {
    			adjustedLim = [adjustedLim[0] * 0.95, adjustedLim[0] * 1.05];
    		}

    		return adjustedLim;
    	};

    	/** Mouse click handler dispatcher
     *  @param {String} eventName - name of event
     *  @param {HTMLElement} el - DOM element which received the event
     */
    	function dispatchClickEvent(eventName, el) {
    		dispatch(eventName, {
    			seriesTitle: el.parentNode.getAttribute('title'),
    			elementID: el.dataset.id
    		});
    	}

    	/*****************************************/
    	/* Storage to share with children        */
    	/*****************************************/
    	const tM = writable(eye(4)); // transformation matrix

    	const scale = writable("medium"); // plot scale (small/medium/large)
    	validate_store(scale, 'scale');
    	component_subscribe($$self, scale, value => $$invalidate(3, $scale = value));
    	const xLim = writable([undefined, undefined]); // x-axis limits in 3D (before projection)
    	validate_store(xLim, 'xLim');
    	component_subscribe($$self, xLim, value => $$invalidate(22, $xLim = value));
    	const yLim = writable([undefined, undefined]); // y-axis limits in 3D (before projection)
    	validate_store(yLim, 'yLim');
    	component_subscribe($$self, yLim, value => $$invalidate(23, $yLim = value));
    	const zLim = writable([undefined, undefined]); // z-axis limits in 3D (before projection)
    	validate_store(zLim, 'zLim');
    	component_subscribe($$self, zLim, value => $$invalidate(21, $zLim = value));
    	const width = writable(100); // current width of axes in pixels
    	validate_store(width, 'width');
    	component_subscribe($$self, width, value => $$invalidate(25, $width = value));
    	const height = writable(100); // current heigh of axes in pixels
    	validate_store(height, 'height');
    	component_subscribe($$self, height, value => $$invalidate(24, $height = value));
    	const isOk = writable(false); // indicator that axes works fine
    	validate_store(isOk, 'isOk');
    	component_subscribe($$self, isOk, value => $$invalidate(0, $isOk = value));

    	/*****************************************/
    	/* Axes context                          */
    	/*****************************************/
    	let context = {
    		// methods
    		adjustXAxisLimits,
    		adjustYAxisLimits,
    		adjustZAxisLimits,
    		getAxisTicks,
    		world2pixels,
    		// state proporties
    		scale,
    		tM,
    		isOk,
    		xLim,
    		yLim,
    		zLim,
    		// constants
    		LINE_STYLES,
    		LABELS_MARGIN,
    		TICK_NUM
    	};

    	setContext('axes', context);

    	/*****************************************/
    	/* Events observers                      */
    	/*****************************************/
    	// observer for the plot area size — to update scale
    	const ro1 = new ResizeObserver(entries => {
    			for (let entry of entries) {
    				const pcr = plotElement.getBoundingClientRect();
    				scale.update(x => getScale(pcr.width, pcr.height));
    			}
    		});

    	// observer for the axes area size - to update size of axes
    	const ro2 = new ResizeObserver(entries => {
    			for (let entry of entries) {
    				const acr = axesElement.getBoundingClientRect();
    				width.update(x => acr.width);
    				height.update(x => acr.height);
    			}
    		});

    	onMount(() => {
    		ro1.observe(plotElement);
    		ro2.observe(plotElement);
    	});

    	onDestroy(() => {
    		ro1.unobserve(plotElement);
    		ro2.unobserve(plotElement);
    	});

    	const writable_props = ['limX', 'limY', 'limZ', 'theta', 'phi', 'zoom'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Axes> was created with unknown prop '${key}'`);
    	});

    	function div0_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			axesElement = $$value;
    			$$invalidate(2, axesElement);
    		});
    	}

    	function div1_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			plotElement = $$value;
    			$$invalidate(1, plotElement);
    		});
    	}

    	$$self.$$set = $$props => {
    		if ('limX' in $$props) $$invalidate(12, limX = $$props.limX);
    		if ('limY' in $$props) $$invalidate(13, limY = $$props.limY);
    		if ('limZ' in $$props) $$invalidate(14, limZ = $$props.limZ);
    		if ('theta' in $$props) $$invalidate(15, theta = $$props.theta);
    		if ('phi' in $$props) $$invalidate(16, phi = $$props.phi);
    		if ('zoom' in $$props) $$invalidate(17, zoom = $$props.zoom);
    		if ('$$scope' in $$props) $$invalidate(26, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		setContext,
    		createEventDispatcher,
    		onMount,
    		onDestroy,
    		writable,
    		mdot,
    		transpose,
    		eye,
    		rep,
    		niceNum,
    		limX,
    		limY,
    		limZ,
    		theta,
    		phi,
    		zoom,
    		dispatch,
    		TICK_NUM,
    		LABELS_MARGIN,
    		LINE_STYLES,
    		clipPathID,
    		plotElement,
    		axesElement,
    		world2pixels,
    		getAxisTicks,
    		getScale,
    		adjustXAxisLimits,
    		adjustYAxisLimits,
    		adjustZAxisLimits,
    		adjustAxisLimits,
    		dispatchClickEvent,
    		tM,
    		scale,
    		xLim,
    		yLim,
    		zLim,
    		width,
    		height,
    		isOk,
    		context,
    		ro1,
    		ro2,
    		P,
    		P1,
    		P2,
    		$zLim,
    		$xLim,
    		$yLim,
    		$height,
    		$width,
    		$isOk,
    		$scale
    	});

    	$$self.$inject_state = $$props => {
    		if ('limX' in $$props) $$invalidate(12, limX = $$props.limX);
    		if ('limY' in $$props) $$invalidate(13, limY = $$props.limY);
    		if ('limZ' in $$props) $$invalidate(14, limZ = $$props.limZ);
    		if ('theta' in $$props) $$invalidate(15, theta = $$props.theta);
    		if ('phi' in $$props) $$invalidate(16, phi = $$props.phi);
    		if ('zoom' in $$props) $$invalidate(17, zoom = $$props.zoom);
    		if ('plotElement' in $$props) $$invalidate(1, plotElement = $$props.plotElement);
    		if ('axesElement' in $$props) $$invalidate(2, axesElement = $$props.axesElement);
    		if ('context' in $$props) context = $$props.context;
    		if ('P' in $$props) $$invalidate(18, P = $$props.P);
    		if ('P1' in $$props) $$invalidate(19, P1 = $$props.P1);
    		if ('P2' in $$props) $$invalidate(20, P2 = $$props.P2);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty[0] & /*theta*/ 32768) {
    			/*****************************************/
    			/* Reactive updates of the parameters    */
    			/*****************************************/
    			// projection matrix (step 1)
    			$$invalidate(19, P1 = [
    				[1, 0, 0, 0],
    				[0, -Math.cos(theta), Math.sin(theta), 0],
    				[0, -Math.sin(theta), -Math.cos(theta), 0],
    				[0, 0, 0, 1]
    			]);
    		}

    		if ($$self.$$.dirty[0] & /*phi*/ 65536) {
    			// projection matrix (step 2)
    			$$invalidate(20, P2 = [
    				[Math.cos(phi), 0, Math.sin(phi), 0],
    				[0, 1, 0, 0],
    				[-Math.sin(phi), 0, Math.cos(phi), 0],
    				[0, 0, 0, 1]
    			]);
    		}

    		if ($$self.$$.dirty[0] & /*zoom, P2, P1*/ 1703936) {
    			// matrix for projection and zooming
    			// we shift [0, 1] cube to center, project, zoom, and then shift back
    			$$invalidate(18, P = mdot([[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [0.5, 0.5, 0.5, 1]], mdot([[zoom, 0, 0, 0], [0, zoom, 0, 0], [0, 0, zoom, 0], [0, 0, 0, 1]], mdot(P2, mdot(P1, [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [-0.5, -0.5, -0.5, 1]])))));
    		}

    		if ($$self.$$.dirty[0] & /*$isOk, $xLim, $yLim, $zLim, $width, $height, P*/ 65273857) {
    			// update transformation matrix if angles of the norm vectors are changed
    			{
    				if ($isOk) {
    					// translate
    					const T1 = [
    						[1, 0, 0, 0],
    						[0, 1, 0, 0],
    						[0, 0, 1, 0],
    						[-$xLim[0], -$yLim[0], -$zLim[0], 1]
    					];

    					// scale the whole cube to [0, 1] limits
    					const S1 = [
    						[1 / ($xLim[1] - $xLim[0]), 0, 0, 0],
    						[0, 1 / ($yLim[1] - $yLim[0]), 0, 0],
    						[0, 0, 1 / ($zLim[1] - $zLim[0]), 0],
    						[0, 0, 0, 1]
    					];

    					// scale to screen coordinates
    					const S2 = [[$width, 0, 0, 0], [0, $height, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]];

    					tM.update(x => mdot(S2, mdot(P, mdot(S1, T1))));
    				} else {
    					tM.update(x => eye(4));
    				}
    			}
    		}

    		if ($$self.$$.dirty[0] & /*limX*/ 4096) {
    			// adjust axis limits
    			// this is reactive in case if limX and limY are interactively changed by parent script
    			if (!limX.some(v => v === undefined)) xLim.update(v => limX);
    		}

    		if ($$self.$$.dirty[0] & /*limY*/ 8192) {
    			if (!limY.some(v => v === undefined)) yLim.update(v => limY);
    		}

    		if ($$self.$$.dirty[0] & /*limZ*/ 16384) {
    			if (!limZ.some(v => v === undefined)) zLim.update(v => limZ);
    		}

    		if ($$self.$$.dirty[0] & /*$yLim, $xLim, $zLim*/ 14680064) {
    			// check if everything is ok regadring the axis limits
    			isOk.update(v => !$yLim.some(v => v === undefined) && !$xLim.some(v => v === undefined) && !$zLim.some(v => v === undefined) && !$yLim.some(v => isNaN(v)) && !$xLim.some(v => isNaN(v)) && !$zLim.some(v => isNaN(v)));
    		}
    	};

    	return [
    		$isOk,
    		plotElement,
    		axesElement,
    		$scale,
    		clipPathID,
    		scale,
    		xLim,
    		yLim,
    		zLim,
    		width,
    		height,
    		isOk,
    		limX,
    		limY,
    		limZ,
    		theta,
    		phi,
    		zoom,
    		P,
    		P1,
    		P2,
    		$zLim,
    		$xLim,
    		$yLim,
    		$height,
    		$width,
    		$$scope,
    		slots,
    		div0_binding,
    		div1_binding
    	];
    }

    class Axes extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(
    			this,
    			options,
    			instance$a,
    			create_fragment$a,
    			safe_not_equal,
    			{
    				limX: 12,
    				limY: 13,
    				limZ: 14,
    				theta: 15,
    				phi: 16,
    				zoom: 17
    			},
    			null,
    			[-1, -1]
    		);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Axes",
    			options,
    			id: create_fragment$a.name
    		});
    	}

    	get limX() {
    		throw new Error("<Axes>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set limX(value) {
    		throw new Error("<Axes>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get limY() {
    		throw new Error("<Axes>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set limY(value) {
    		throw new Error("<Axes>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get limZ() {
    		throw new Error("<Axes>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set limZ(value) {
    		throw new Error("<Axes>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get theta() {
    		throw new Error("<Axes>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set theta(value) {
    		throw new Error("<Axes>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get phi() {
    		throw new Error("<Axes>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set phi(value) {
    		throw new Error("<Axes>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get zoom() {
    		throw new Error("<Axes>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set zoom(value) {
    		throw new Error("<Axes>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const Colors = {
       "AXIS_LINE": "#303030",
       "AXIS_TICK": "#606060",
       "WHITE":     "#fff",
       "BLACK":     "#000",
       "GRAY":      "#909090",
       "MIDDLEGRAY": "#dadada",
       "LIGHTGRAY": "#f0f0f0",
       "DARKGRAY":  "#606060",

       "PRIMARY": "#2266ff",
       "PRIMARY_TEXT": "#333",
    };

    /* ../shared/plots3d/AxisLines.svelte generated by Svelte v3.50.1 */
    const file$5 = "../shared/plots3d/AxisLines.svelte";

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[14] = list[i];
    	child_ctx[16] = i;
    	return child_ctx;
    }

    // (40:0) {#if x1 !== undefined && y1 !== undefined && x2 !== undefined && y2 !== undefined}
    function create_if_block$6(ctx) {
    	let g;
    	let each_value = /*x1*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			g = svg_element("g");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(g, "class", "axis__grid");
    			add_location(g, file$5, 40, 0, 1398);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, g, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(g, null);
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*x1, x2, y1, y2, lineStyleStr*/ 31) {
    				each_value = /*x1*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$2(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$2(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(g, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(g);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$6.name,
    		type: "if",
    		source: "(40:0) {#if x1 !== undefined && y1 !== undefined && x2 !== undefined && y2 !== undefined}",
    		ctx
    	});

    	return block;
    }

    // (42:3) {#each x1 as v, i}
    function create_each_block$2(ctx) {
    	let line;
    	let line_x__value;
    	let line_x__value_1;
    	let line_y__value;
    	let line_y__value_1;

    	const block = {
    		c: function create() {
    			line = svg_element("line");
    			attr_dev(line, "vector-effect", "non-scaling-stroke");
    			attr_dev(line, "x1", line_x__value = /*x1*/ ctx[0][/*i*/ ctx[16]]);
    			attr_dev(line, "x2", line_x__value_1 = /*x2*/ ctx[1][/*i*/ ctx[16]]);
    			attr_dev(line, "y1", line_y__value = /*y1*/ ctx[2][/*i*/ ctx[16]]);
    			attr_dev(line, "y2", line_y__value_1 = /*y2*/ ctx[3][/*i*/ ctx[16]]);
    			attr_dev(line, "style", /*lineStyleStr*/ ctx[4]);
    			add_location(line, file$5, 42, 3, 1446);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, line, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*x1*/ 1 && line_x__value !== (line_x__value = /*x1*/ ctx[0][/*i*/ ctx[16]])) {
    				attr_dev(line, "x1", line_x__value);
    			}

    			if (dirty & /*x2*/ 2 && line_x__value_1 !== (line_x__value_1 = /*x2*/ ctx[1][/*i*/ ctx[16]])) {
    				attr_dev(line, "x2", line_x__value_1);
    			}

    			if (dirty & /*y1*/ 4 && line_y__value !== (line_y__value = /*y1*/ ctx[2][/*i*/ ctx[16]])) {
    				attr_dev(line, "y1", line_y__value);
    			}

    			if (dirty & /*y2*/ 8 && line_y__value_1 !== (line_y__value_1 = /*y2*/ ctx[3][/*i*/ ctx[16]])) {
    				attr_dev(line, "y2", line_y__value_1);
    			}

    			if (dirty & /*lineStyleStr*/ 16) {
    				attr_dev(line, "style", /*lineStyleStr*/ ctx[4]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(line);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$2.name,
    		type: "each",
    		source: "(42:3) {#each x1 as v, i}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$9(ctx) {
    	let if_block_anchor;
    	let if_block = /*x1*/ ctx[0] !== undefined && /*y1*/ ctx[2] !== undefined && /*x2*/ ctx[1] !== undefined && /*y2*/ ctx[3] !== undefined && create_if_block$6(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*x1*/ ctx[0] !== undefined && /*y1*/ ctx[2] !== undefined && /*x2*/ ctx[1] !== undefined && /*y2*/ ctx[3] !== undefined) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$6(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$9.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$9($$self, $$props, $$invalidate) {
    	let $scale;
    	let $tM;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('AxisLines', slots, []);
    	let { lineCoords = [] } = $$props;
    	let { lineColor = Colors.DARKGRAY } = $$props;
    	let { lineType = 1 } = $$props;
    	let { lineWidth = 1 } = $$props;

    	// get axes context and reactive variables needed to compute coordinates
    	const axes = getContext('axes');

    	const scale = axes.scale;
    	validate_store(scale, 'scale');
    	component_subscribe($$self, scale, value => $$invalidate(12, $scale = value));
    	const tM = axes.tM;
    	validate_store(tM, 'tM');
    	component_subscribe($$self, tM, value => $$invalidate(11, $tM = value));
    	let x1, x2, y1, y2, lineStyleStr = undefined;
    	lineStyleStr = `stroke:${lineColor};stroke-width: ${lineWidth}px;stroke-dasharray:${axes.LINE_STYLES[$scale][lineType - 1]}`;
    	const writable_props = ['lineCoords', 'lineColor', 'lineType', 'lineWidth'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<AxisLines> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('lineCoords' in $$props) $$invalidate(7, lineCoords = $$props.lineCoords);
    		if ('lineColor' in $$props) $$invalidate(8, lineColor = $$props.lineColor);
    		if ('lineType' in $$props) $$invalidate(9, lineType = $$props.lineType);
    		if ('lineWidth' in $$props) $$invalidate(10, lineWidth = $$props.lineWidth);
    	};

    	$$self.$capture_state = () => ({
    		getContext,
    		Colors,
    		lineCoords,
    		lineColor,
    		lineType,
    		lineWidth,
    		axes,
    		scale,
    		tM,
    		x1,
    		x2,
    		y1,
    		y2,
    		lineStyleStr,
    		$scale,
    		$tM
    	});

    	$$self.$inject_state = $$props => {
    		if ('lineCoords' in $$props) $$invalidate(7, lineCoords = $$props.lineCoords);
    		if ('lineColor' in $$props) $$invalidate(8, lineColor = $$props.lineColor);
    		if ('lineType' in $$props) $$invalidate(9, lineType = $$props.lineType);
    		if ('lineWidth' in $$props) $$invalidate(10, lineWidth = $$props.lineWidth);
    		if ('x1' in $$props) $$invalidate(0, x1 = $$props.x1);
    		if ('x2' in $$props) $$invalidate(1, x2 = $$props.x2);
    		if ('y1' in $$props) $$invalidate(2, y1 = $$props.y1);
    		if ('y2' in $$props) $$invalidate(3, y2 = $$props.y2);
    		if ('lineStyleStr' in $$props) $$invalidate(4, lineStyleStr = $$props.lineStyleStr);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*lineCoords, $tM*/ 2176) {
    			if (lineCoords.length == 2) {
    				const coords1 = axes.world2pixels(lineCoords[0], $tM);
    				const coords2 = axes.world2pixels(lineCoords[1], $tM);
    				$$invalidate(0, x1 = coords1[0]);
    				$$invalidate(1, x2 = coords2[0]);
    				$$invalidate(2, y1 = coords1[1]);
    				$$invalidate(3, y2 = coords2[1]);
    			}
    		}
    	};

    	return [
    		x1,
    		x2,
    		y1,
    		y2,
    		lineStyleStr,
    		scale,
    		tM,
    		lineCoords,
    		lineColor,
    		lineType,
    		lineWidth,
    		$tM
    	];
    }

    class AxisLines extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$9, create_fragment$9, safe_not_equal, {
    			lineCoords: 7,
    			lineColor: 8,
    			lineType: 9,
    			lineWidth: 10
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "AxisLines",
    			options,
    			id: create_fragment$9.name
    		});
    	}

    	get lineCoords() {
    		throw new Error("<AxisLines>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set lineCoords(value) {
    		throw new Error("<AxisLines>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get lineColor() {
    		throw new Error("<AxisLines>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set lineColor(value) {
    		throw new Error("<AxisLines>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get lineType() {
    		throw new Error("<AxisLines>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set lineType(value) {
    		throw new Error("<AxisLines>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get lineWidth() {
    		throw new Error("<AxisLines>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set lineWidth(value) {
    		throw new Error("<AxisLines>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* ../shared/plots3d/TextLabels.svelte generated by Svelte v3.50.1 */
    const file$4 = "../shared/plots3d/TextLabels.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[23] = list[i];
    	child_ctx[25] = i;
    	return child_ctx;
    }

    // (78:0) {#if x !== undefined && y !== undefined}
    function create_if_block$5(ctx) {
    	let g;
    	let g_class_value;
    	let each_value = /*x*/ ctx[7];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			g = svg_element("g");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(g, "class", g_class_value = "series " + /*style*/ ctx[2]);
    			attr_dev(g, "data-title", /*title*/ ctx[1]);
    			attr_dev(g, "style", /*textStyleStr*/ ctx[3]);
    			add_location(g, file$4, 78, 0, 2716);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, g, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(g, null);
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*x, y, dx, dy, labels*/ 241) {
    				each_value = /*x*/ ctx[7];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(g, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (dirty & /*style*/ 4 && g_class_value !== (g_class_value = "series " + /*style*/ ctx[2])) {
    				attr_dev(g, "class", g_class_value);
    			}

    			if (dirty & /*title*/ 2) {
    				attr_dev(g, "data-title", /*title*/ ctx[1]);
    			}

    			if (dirty & /*textStyleStr*/ 8) {
    				attr_dev(g, "style", /*textStyleStr*/ ctx[3]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(g);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$5.name,
    		type: "if",
    		source: "(78:0) {#if x !== undefined && y !== undefined}",
    		ctx
    	});

    	return block;
    }

    // (80:3) {#each x as v, i}
    function create_each_block$1(ctx) {
    	let text_1;
    	let raw_value = /*labels*/ ctx[0][/*i*/ ctx[25]] + "";
    	let text_1_x_value;
    	let text_1_y_value;

    	const block = {
    		c: function create() {
    			text_1 = svg_element("text");
    			attr_dev(text_1, "vector-effect", "none");
    			attr_dev(text_1, "data-id", /*i*/ ctx[25]);
    			attr_dev(text_1, "x", text_1_x_value = /*x*/ ctx[7][/*i*/ ctx[25]]);
    			attr_dev(text_1, "y", text_1_y_value = /*y*/ ctx[6][/*i*/ ctx[25]]);
    			attr_dev(text_1, "dx", /*dx*/ ctx[5]);
    			attr_dev(text_1, "dy", /*dy*/ ctx[4]);
    			attr_dev(text_1, "class", "svelte-1xvrp9d");
    			add_location(text_1, file$4, 80, 6, 2811);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, text_1, anchor);
    			text_1.innerHTML = raw_value;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*labels*/ 1 && raw_value !== (raw_value = /*labels*/ ctx[0][/*i*/ ctx[25]] + "")) text_1.innerHTML = raw_value;
    			if (dirty & /*x*/ 128 && text_1_x_value !== (text_1_x_value = /*x*/ ctx[7][/*i*/ ctx[25]])) {
    				attr_dev(text_1, "x", text_1_x_value);
    			}

    			if (dirty & /*y*/ 64 && text_1_y_value !== (text_1_y_value = /*y*/ ctx[6][/*i*/ ctx[25]])) {
    				attr_dev(text_1, "y", text_1_y_value);
    			}

    			if (dirty & /*dx*/ 32) {
    				attr_dev(text_1, "dx", /*dx*/ ctx[5]);
    			}

    			if (dirty & /*dy*/ 16) {
    				attr_dev(text_1, "dy", /*dy*/ ctx[4]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(text_1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(80:3) {#each x as v, i}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$8(ctx) {
    	let if_block_anchor;
    	let if_block = /*x*/ ctx[7] !== undefined && /*y*/ ctx[6] !== undefined && create_if_block$5(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*x*/ ctx[7] !== undefined && /*y*/ ctx[6] !== undefined) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$5(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$8($$self, $$props, $$invalidate) {
    	let coords;
    	let x;
    	let y;
    	let dx;
    	let dy;
    	let textStyleStr;
    	let $scale;
    	let $tM;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('TextLabels', slots, []);
    	let { title = "" } = $$props;
    	let { xValues } = $$props;
    	let { yValues } = $$props;
    	let { zValues = undefined } = $$props;
    	let { labels } = $$props;
    	let { pos = 0 } = $$props;
    	let { faceColor = Colors.PRIMARY_TEXT } = $$props;
    	let { borderColor = "transparent" } = $$props;
    	let { borderWidth = 0 } = $$props;
    	let { textSize = 1 } = $$props;
    	let { style = "series_textlabel" } = $$props;

    	// text-anchor values depending on position
    	const textAnchors = ["middle", "middle", "end", "middle", "start"];

    	// get axes context and reactive variables needed to compute coordinates
    	const axes = getContext('axes');

    	const scale = axes.scale;
    	validate_store(scale, 'scale');
    	component_subscribe($$self, scale, value => $$invalidate(19, $scale = value));
    	const tM = axes.tM;
    	validate_store(tM, 'tM');
    	component_subscribe($$self, tM, value => $$invalidate(20, $tM = value));

    	const writable_props = [
    		'title',
    		'xValues',
    		'yValues',
    		'zValues',
    		'labels',
    		'pos',
    		'faceColor',
    		'borderColor',
    		'borderWidth',
    		'textSize',
    		'style'
    	];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<TextLabels> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('title' in $$props) $$invalidate(1, title = $$props.title);
    		if ('xValues' in $$props) $$invalidate(11, xValues = $$props.xValues);
    		if ('yValues' in $$props) $$invalidate(12, yValues = $$props.yValues);
    		if ('zValues' in $$props) $$invalidate(10, zValues = $$props.zValues);
    		if ('labels' in $$props) $$invalidate(0, labels = $$props.labels);
    		if ('pos' in $$props) $$invalidate(13, pos = $$props.pos);
    		if ('faceColor' in $$props) $$invalidate(14, faceColor = $$props.faceColor);
    		if ('borderColor' in $$props) $$invalidate(15, borderColor = $$props.borderColor);
    		if ('borderWidth' in $$props) $$invalidate(16, borderWidth = $$props.borderWidth);
    		if ('textSize' in $$props) $$invalidate(17, textSize = $$props.textSize);
    		if ('style' in $$props) $$invalidate(2, style = $$props.style);
    	};

    	$$self.$capture_state = () => ({
    		rep,
    		getContext,
    		Colors,
    		title,
    		xValues,
    		yValues,
    		zValues,
    		labels,
    		pos,
    		faceColor,
    		borderColor,
    		borderWidth,
    		textSize,
    		style,
    		textAnchors,
    		axes,
    		scale,
    		tM,
    		textStyleStr,
    		dy,
    		dx,
    		coords,
    		y,
    		x,
    		$scale,
    		$tM
    	});

    	$$self.$inject_state = $$props => {
    		if ('title' in $$props) $$invalidate(1, title = $$props.title);
    		if ('xValues' in $$props) $$invalidate(11, xValues = $$props.xValues);
    		if ('yValues' in $$props) $$invalidate(12, yValues = $$props.yValues);
    		if ('zValues' in $$props) $$invalidate(10, zValues = $$props.zValues);
    		if ('labels' in $$props) $$invalidate(0, labels = $$props.labels);
    		if ('pos' in $$props) $$invalidate(13, pos = $$props.pos);
    		if ('faceColor' in $$props) $$invalidate(14, faceColor = $$props.faceColor);
    		if ('borderColor' in $$props) $$invalidate(15, borderColor = $$props.borderColor);
    		if ('borderWidth' in $$props) $$invalidate(16, borderWidth = $$props.borderWidth);
    		if ('textSize' in $$props) $$invalidate(17, textSize = $$props.textSize);
    		if ('style' in $$props) $$invalidate(2, style = $$props.style);
    		if ('textStyleStr' in $$props) $$invalidate(3, textStyleStr = $$props.textStyleStr);
    		if ('dy' in $$props) $$invalidate(4, dy = $$props.dy);
    		if ('dx' in $$props) $$invalidate(5, dx = $$props.dx);
    		if ('coords' in $$props) $$invalidate(18, coords = $$props.coords);
    		if ('y' in $$props) $$invalidate(6, y = $$props.y);
    		if ('x' in $$props) $$invalidate(7, x = $$props.x);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*xValues, yValues, zValues*/ 7168) {
    			// sanity check for input parameters
    			{
    				if (!Array.isArray(xValues) || !Array.isArray(yValues) || xValues.length !== yValues.length) {
    					throw "TextLabels: parameters 'xValues' and 'yValues' must be vectors of the same length.";
    				}

    				if (zValues === undefined) {
    					$$invalidate(10, zValues = rep(0, xValues.length));
    				}
    			}
    		}

    		if ($$self.$$.dirty & /*xValues, labels*/ 2049) {
    			// multiply label values if needed
    			{
    				const n = xValues.length;
    				if (!Array.isArray(labels)) $$invalidate(0, labels = Array(n).fill(labels));

    				// workaround for an issue when xValues and yValues are changed in parent app
    				// but array of labels is still the same as in the
    				if (labels.length != n) $$invalidate(0, labels = rep(labels[0], n));

    				// check that the length of labels vector is correct
    				if (labels.length !== n) {
    					throw "TextLabels: parameter 'labels' must be a single text value or a vector of the same size as 'x' and 'y'.";
    				}
    			}
    		}

    		if ($$self.$$.dirty & /*xValues, yValues, zValues, $tM*/ 1055744) {
    			// reactive variables for coordinates of data points in pixels
    			$$invalidate(18, coords = axes.world2pixels([xValues, yValues, zValues], $tM));
    		}

    		if ($$self.$$.dirty & /*coords*/ 262144) {
    			$$invalidate(7, x = coords[0]);
    		}

    		if ($$self.$$.dirty & /*coords*/ 262144) {
    			$$invalidate(6, y = coords[1]);
    		}

    		if ($$self.$$.dirty & /*pos, $scale*/ 532480) {
    			$$invalidate(5, dx = [0, 0, -1, 0, 1][pos] * axes.LABELS_MARGIN[$scale]);
    		}

    		if ($$self.$$.dirty & /*pos, $scale*/ 532480) {
    			$$invalidate(4, dy = [0, 1, 0, -1, 0][pos] * axes.LABELS_MARGIN[$scale]);
    		}

    		if ($$self.$$.dirty & /*faceColor, borderWidth, borderColor, textSize, pos*/ 253952) {
    			// styles for the elements
    			$$invalidate(3, textStyleStr = `fill:${faceColor};stroke-width:${borderWidth}px;stroke:${borderColor};
      font-size:${textSize}em; text-anchor:${textAnchors[pos]};`);
    		}
    	};

    	return [
    		labels,
    		title,
    		style,
    		textStyleStr,
    		dy,
    		dx,
    		y,
    		x,
    		scale,
    		tM,
    		zValues,
    		xValues,
    		yValues,
    		pos,
    		faceColor,
    		borderColor,
    		borderWidth,
    		textSize,
    		coords,
    		$scale,
    		$tM
    	];
    }

    class TextLabels extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$8, create_fragment$8, safe_not_equal, {
    			title: 1,
    			xValues: 11,
    			yValues: 12,
    			zValues: 10,
    			labels: 0,
    			pos: 13,
    			faceColor: 14,
    			borderColor: 15,
    			borderWidth: 16,
    			textSize: 17,
    			style: 2
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "TextLabels",
    			options,
    			id: create_fragment$8.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*xValues*/ ctx[11] === undefined && !('xValues' in props)) {
    			console.warn("<TextLabels> was created without expected prop 'xValues'");
    		}

    		if (/*yValues*/ ctx[12] === undefined && !('yValues' in props)) {
    			console.warn("<TextLabels> was created without expected prop 'yValues'");
    		}

    		if (/*labels*/ ctx[0] === undefined && !('labels' in props)) {
    			console.warn("<TextLabels> was created without expected prop 'labels'");
    		}
    	}

    	get title() {
    		throw new Error("<TextLabels>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set title(value) {
    		throw new Error("<TextLabels>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get xValues() {
    		throw new Error("<TextLabels>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set xValues(value) {
    		throw new Error("<TextLabels>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get yValues() {
    		throw new Error("<TextLabels>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set yValues(value) {
    		throw new Error("<TextLabels>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get zValues() {
    		throw new Error("<TextLabels>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set zValues(value) {
    		throw new Error("<TextLabels>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get labels() {
    		throw new Error("<TextLabels>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set labels(value) {
    		throw new Error("<TextLabels>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get pos() {
    		throw new Error("<TextLabels>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set pos(value) {
    		throw new Error("<TextLabels>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get faceColor() {
    		throw new Error("<TextLabels>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set faceColor(value) {
    		throw new Error("<TextLabels>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get borderColor() {
    		throw new Error("<TextLabels>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set borderColor(value) {
    		throw new Error("<TextLabels>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get borderWidth() {
    		throw new Error("<TextLabels>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set borderWidth(value) {
    		throw new Error("<TextLabels>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get textSize() {
    		throw new Error("<TextLabels>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set textSize(value) {
    		throw new Error("<TextLabels>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get style() {
    		throw new Error("<TextLabels>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set style(value) {
    		throw new Error("<TextLabels>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* ../shared/plots3d/Axis.svelte generated by Svelte v3.50.1 */
    const file$3 = "../shared/plots3d/Axis.svelte";

    // (29:3) {#if showGrid }
    function create_if_block_2(ctx) {
    	let axislines0;
    	let axislines1;
    	let current;

    	axislines0 = new AxisLines({
    			props: {
    				lineCoords: /*grid1*/ ctx[5],
    				lineColor: /*gridColor*/ ctx[11],
    				lineType: 3
    			},
    			$$inline: true
    		});

    	axislines1 = new AxisLines({
    			props: {
    				lineCoords: /*grid2*/ ctx[6],
    				lineColor: /*gridColor*/ ctx[11],
    				lineType: 3
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(axislines0.$$.fragment);
    			create_component(axislines1.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(axislines0, target, anchor);
    			mount_component(axislines1, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const axislines0_changes = {};
    			if (dirty & /*grid1*/ 32) axislines0_changes.lineCoords = /*grid1*/ ctx[5];
    			if (dirty & /*gridColor*/ 2048) axislines0_changes.lineColor = /*gridColor*/ ctx[11];
    			axislines0.$set(axislines0_changes);
    			const axislines1_changes = {};
    			if (dirty & /*grid2*/ 64) axislines1_changes.lineCoords = /*grid2*/ ctx[6];
    			if (dirty & /*gridColor*/ 2048) axislines1_changes.lineColor = /*gridColor*/ ctx[11];
    			axislines1.$set(axislines1_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(axislines0.$$.fragment, local);
    			transition_in(axislines1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(axislines0.$$.fragment, local);
    			transition_out(axislines1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(axislines0, detaching);
    			destroy_component(axislines1, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(29:3) {#if showGrid }",
    		ctx
    	});

    	return block;
    }

    // (41:3) {#if tickCoords.length === 2 && tickLabels.length === tickCoords[1][0].length}
    function create_if_block_1(ctx) {
    	let textlabels;
    	let current;

    	textlabels = new TextLabels({
    			props: {
    				xValues: /*tickCoords*/ ctx[8][0][0],
    				yValues: /*tickCoords*/ ctx[8][0][1],
    				zValues: /*tickCoords*/ ctx[8][0][2],
    				faceColor: /*textColor*/ ctx[12],
    				labels: /*tickLabels*/ ctx[0],
    				pos: /*pos*/ ctx[3]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(textlabels.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(textlabels, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const textlabels_changes = {};
    			if (dirty & /*tickCoords*/ 256) textlabels_changes.xValues = /*tickCoords*/ ctx[8][0][0];
    			if (dirty & /*tickCoords*/ 256) textlabels_changes.yValues = /*tickCoords*/ ctx[8][0][1];
    			if (dirty & /*tickCoords*/ 256) textlabels_changes.zValues = /*tickCoords*/ ctx[8][0][2];
    			if (dirty & /*textColor*/ 4096) textlabels_changes.faceColor = /*textColor*/ ctx[12];
    			if (dirty & /*tickLabels*/ 1) textlabels_changes.labels = /*tickLabels*/ ctx[0];
    			if (dirty & /*pos*/ 8) textlabels_changes.pos = /*pos*/ ctx[3];
    			textlabels.$set(textlabels_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(textlabels.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(textlabels.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(textlabels, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(41:3) {#if tickCoords.length === 2 && tickLabels.length === tickCoords[1][0].length}",
    		ctx
    	});

    	return block;
    }

    // (50:3) {#if titleCoords.length === 3 && title !== ""}
    function create_if_block$4(ctx) {
    	let textlabels;
    	let current;

    	textlabels = new TextLabels({
    			props: {
    				xValues: /*titleCoords*/ ctx[9][0],
    				yValues: /*titleCoords*/ ctx[9][1],
    				zValues: /*titleCoords*/ ctx[9][2],
    				faceColor: /*textColor*/ ctx[12],
    				labels: /*title*/ ctx[2],
    				pos: /*pos*/ ctx[3]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(textlabels.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(textlabels, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const textlabels_changes = {};
    			if (dirty & /*titleCoords*/ 512) textlabels_changes.xValues = /*titleCoords*/ ctx[9][0];
    			if (dirty & /*titleCoords*/ 512) textlabels_changes.yValues = /*titleCoords*/ ctx[9][1];
    			if (dirty & /*titleCoords*/ 512) textlabels_changes.zValues = /*titleCoords*/ ctx[9][2];
    			if (dirty & /*textColor*/ 4096) textlabels_changes.faceColor = /*textColor*/ ctx[12];
    			if (dirty & /*title*/ 4) textlabels_changes.labels = /*title*/ ctx[2];
    			if (dirty & /*pos*/ 8) textlabels_changes.pos = /*pos*/ ctx[3];
    			textlabels.$set(textlabels_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(textlabels.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(textlabels.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(textlabels, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$4.name,
    		type: "if",
    		source: "(50:3) {#if titleCoords.length === 3 && title !== \\\"\\\"}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$7(ctx) {
    	let g;
    	let if_block0_anchor;
    	let axislines0;
    	let axislines1;
    	let if_block1_anchor;
    	let g_class_value;
    	let current;
    	let if_block0 = /*showGrid*/ ctx[1] && create_if_block_2(ctx);

    	axislines0 = new AxisLines({
    			props: {
    				lineCoords: /*axisLine*/ ctx[7],
    				lineColor: /*lineColor*/ ctx[10],
    				lineType: 1
    			},
    			$$inline: true
    		});

    	axislines1 = new AxisLines({
    			props: {
    				lineCoords: /*tickCoords*/ ctx[8],
    				lineColor: /*lineColor*/ ctx[10],
    				lineType: 1
    			},
    			$$inline: true
    		});

    	let if_block1 = /*tickCoords*/ ctx[8].length === 2 && /*tickLabels*/ ctx[0].length === /*tickCoords*/ ctx[8][1][0].length && create_if_block_1(ctx);
    	let if_block2 = /*titleCoords*/ ctx[9].length === 3 && /*title*/ ctx[2] !== "" && create_if_block$4(ctx);

    	const block = {
    		c: function create() {
    			g = svg_element("g");
    			if (if_block0) if_block0.c();
    			if_block0_anchor = empty();
    			create_component(axislines0.$$.fragment);
    			create_component(axislines1.$$.fragment);
    			if (if_block1) if_block1.c();
    			if_block1_anchor = empty();
    			if (if_block2) if_block2.c();
    			attr_dev(g, "class", g_class_value = "mdaplot__axis " + /*style*/ ctx[4]);
    			add_location(g, file$3, 25, 0, 703);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, g, anchor);
    			if (if_block0) if_block0.m(g, null);
    			append_dev(g, if_block0_anchor);
    			mount_component(axislines0, g, null);
    			mount_component(axislines1, g, null);
    			if (if_block1) if_block1.m(g, null);
    			append_dev(g, if_block1_anchor);
    			if (if_block2) if_block2.m(g, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*showGrid*/ ctx[1]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);

    					if (dirty & /*showGrid*/ 2) {
    						transition_in(if_block0, 1);
    					}
    				} else {
    					if_block0 = create_if_block_2(ctx);
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(g, if_block0_anchor);
    				}
    			} else if (if_block0) {
    				group_outros();

    				transition_out(if_block0, 1, 1, () => {
    					if_block0 = null;
    				});

    				check_outros();
    			}

    			const axislines0_changes = {};
    			if (dirty & /*axisLine*/ 128) axislines0_changes.lineCoords = /*axisLine*/ ctx[7];
    			if (dirty & /*lineColor*/ 1024) axislines0_changes.lineColor = /*lineColor*/ ctx[10];
    			axislines0.$set(axislines0_changes);
    			const axislines1_changes = {};
    			if (dirty & /*tickCoords*/ 256) axislines1_changes.lineCoords = /*tickCoords*/ ctx[8];
    			if (dirty & /*lineColor*/ 1024) axislines1_changes.lineColor = /*lineColor*/ ctx[10];
    			axislines1.$set(axislines1_changes);

    			if (/*tickCoords*/ ctx[8].length === 2 && /*tickLabels*/ ctx[0].length === /*tickCoords*/ ctx[8][1][0].length) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);

    					if (dirty & /*tickCoords, tickLabels*/ 257) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block_1(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(g, if_block1_anchor);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}

    			if (/*titleCoords*/ ctx[9].length === 3 && /*title*/ ctx[2] !== "") {
    				if (if_block2) {
    					if_block2.p(ctx, dirty);

    					if (dirty & /*titleCoords, title*/ 516) {
    						transition_in(if_block2, 1);
    					}
    				} else {
    					if_block2 = create_if_block$4(ctx);
    					if_block2.c();
    					transition_in(if_block2, 1);
    					if_block2.m(g, null);
    				}
    			} else if (if_block2) {
    				group_outros();

    				transition_out(if_block2, 1, 1, () => {
    					if_block2 = null;
    				});

    				check_outros();
    			}

    			if (!current || dirty & /*style*/ 16 && g_class_value !== (g_class_value = "mdaplot__axis " + /*style*/ ctx[4])) {
    				attr_dev(g, "class", g_class_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block0);
    			transition_in(axislines0.$$.fragment, local);
    			transition_in(axislines1.$$.fragment, local);
    			transition_in(if_block1);
    			transition_in(if_block2);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block0);
    			transition_out(axislines0.$$.fragment, local);
    			transition_out(axislines1.$$.fragment, local);
    			transition_out(if_block1);
    			transition_out(if_block2);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(g);
    			if (if_block0) if_block0.d();
    			destroy_component(axislines0);
    			destroy_component(axislines1);
    			if (if_block1) if_block1.d();
    			if (if_block2) if_block2.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Axis', slots, []);
    	let { tickLabels = [] } = $$props;
    	let { showGrid = false } = $$props;
    	let { title = "" } = $$props; // axis title
    	let { pos = 1 } = $$props;
    	let { style = "" } = $$props;
    	let { grid1 = [] } = $$props;
    	let { grid2 = [] } = $$props;
    	let { axisLine = [] } = $$props;
    	let { tickCoords = [] } = $$props;
    	let { titleCoords = [] } = $$props;
    	let { lineColor = Colors.DARKGRAY } = $$props;
    	let { gridColor = Colors.MIDDLEGRAY } = $$props;
    	let { textColor = Colors.DARKGRAY } = $$props;

    	const writable_props = [
    		'tickLabels',
    		'showGrid',
    		'title',
    		'pos',
    		'style',
    		'grid1',
    		'grid2',
    		'axisLine',
    		'tickCoords',
    		'titleCoords',
    		'lineColor',
    		'gridColor',
    		'textColor'
    	];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Axis> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('tickLabels' in $$props) $$invalidate(0, tickLabels = $$props.tickLabels);
    		if ('showGrid' in $$props) $$invalidate(1, showGrid = $$props.showGrid);
    		if ('title' in $$props) $$invalidate(2, title = $$props.title);
    		if ('pos' in $$props) $$invalidate(3, pos = $$props.pos);
    		if ('style' in $$props) $$invalidate(4, style = $$props.style);
    		if ('grid1' in $$props) $$invalidate(5, grid1 = $$props.grid1);
    		if ('grid2' in $$props) $$invalidate(6, grid2 = $$props.grid2);
    		if ('axisLine' in $$props) $$invalidate(7, axisLine = $$props.axisLine);
    		if ('tickCoords' in $$props) $$invalidate(8, tickCoords = $$props.tickCoords);
    		if ('titleCoords' in $$props) $$invalidate(9, titleCoords = $$props.titleCoords);
    		if ('lineColor' in $$props) $$invalidate(10, lineColor = $$props.lineColor);
    		if ('gridColor' in $$props) $$invalidate(11, gridColor = $$props.gridColor);
    		if ('textColor' in $$props) $$invalidate(12, textColor = $$props.textColor);
    	};

    	$$self.$capture_state = () => ({
    		Colors,
    		AxisLines,
    		TextLabels,
    		tickLabels,
    		showGrid,
    		title,
    		pos,
    		style,
    		grid1,
    		grid2,
    		axisLine,
    		tickCoords,
    		titleCoords,
    		lineColor,
    		gridColor,
    		textColor
    	});

    	$$self.$inject_state = $$props => {
    		if ('tickLabels' in $$props) $$invalidate(0, tickLabels = $$props.tickLabels);
    		if ('showGrid' in $$props) $$invalidate(1, showGrid = $$props.showGrid);
    		if ('title' in $$props) $$invalidate(2, title = $$props.title);
    		if ('pos' in $$props) $$invalidate(3, pos = $$props.pos);
    		if ('style' in $$props) $$invalidate(4, style = $$props.style);
    		if ('grid1' in $$props) $$invalidate(5, grid1 = $$props.grid1);
    		if ('grid2' in $$props) $$invalidate(6, grid2 = $$props.grid2);
    		if ('axisLine' in $$props) $$invalidate(7, axisLine = $$props.axisLine);
    		if ('tickCoords' in $$props) $$invalidate(8, tickCoords = $$props.tickCoords);
    		if ('titleCoords' in $$props) $$invalidate(9, titleCoords = $$props.titleCoords);
    		if ('lineColor' in $$props) $$invalidate(10, lineColor = $$props.lineColor);
    		if ('gridColor' in $$props) $$invalidate(11, gridColor = $$props.gridColor);
    		if ('textColor' in $$props) $$invalidate(12, textColor = $$props.textColor);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		tickLabels,
    		showGrid,
    		title,
    		pos,
    		style,
    		grid1,
    		grid2,
    		axisLine,
    		tickCoords,
    		titleCoords,
    		lineColor,
    		gridColor,
    		textColor
    	];
    }

    class Axis extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$7, create_fragment$7, safe_not_equal, {
    			tickLabels: 0,
    			showGrid: 1,
    			title: 2,
    			pos: 3,
    			style: 4,
    			grid1: 5,
    			grid2: 6,
    			axisLine: 7,
    			tickCoords: 8,
    			titleCoords: 9,
    			lineColor: 10,
    			gridColor: 11,
    			textColor: 12
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Axis",
    			options,
    			id: create_fragment$7.name
    		});
    	}

    	get tickLabels() {
    		throw new Error("<Axis>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set tickLabels(value) {
    		throw new Error("<Axis>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get showGrid() {
    		throw new Error("<Axis>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set showGrid(value) {
    		throw new Error("<Axis>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get title() {
    		throw new Error("<Axis>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set title(value) {
    		throw new Error("<Axis>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get pos() {
    		throw new Error("<Axis>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set pos(value) {
    		throw new Error("<Axis>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get style() {
    		throw new Error("<Axis>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set style(value) {
    		throw new Error("<Axis>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get grid1() {
    		throw new Error("<Axis>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set grid1(value) {
    		throw new Error("<Axis>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get grid2() {
    		throw new Error("<Axis>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set grid2(value) {
    		throw new Error("<Axis>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get axisLine() {
    		throw new Error("<Axis>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set axisLine(value) {
    		throw new Error("<Axis>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get tickCoords() {
    		throw new Error("<Axis>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set tickCoords(value) {
    		throw new Error("<Axis>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get titleCoords() {
    		throw new Error("<Axis>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set titleCoords(value) {
    		throw new Error("<Axis>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get lineColor() {
    		throw new Error("<Axis>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set lineColor(value) {
    		throw new Error("<Axis>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get gridColor() {
    		throw new Error("<Axis>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set gridColor(value) {
    		throw new Error("<Axis>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get textColor() {
    		throw new Error("<Axis>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set textColor(value) {
    		throw new Error("<Axis>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* ../shared/plots3d/XAxis.svelte generated by Svelte v3.50.1 */

    // (99:0) {#if $isOk && axisLine.length > 0}
    function create_if_block$3(ctx) {
    	let axis;
    	let current;

    	axis = new Axis({
    			props: {
    				style: "mdaplot__xaxis",
    				pos: 1,
    				title: /*title*/ ctx[2],
    				lineColor: /*lineColor*/ ctx[3],
    				gridColor: /*gridColor*/ ctx[4],
    				textColor: /*textColor*/ ctx[5],
    				titleCoords: /*titleCoords*/ ctx[7],
    				showGrid: /*showGrid*/ ctx[1],
    				grid1: /*grid1*/ ctx[8],
    				grid2: /*grid2*/ ctx[9],
    				axisLine: /*axisLine*/ ctx[10],
    				tickCoords: /*tickCoords*/ ctx[11],
    				tickLabels: /*tickLabels*/ ctx[0]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(axis.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(axis, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const axis_changes = {};
    			if (dirty & /*title*/ 4) axis_changes.title = /*title*/ ctx[2];
    			if (dirty & /*lineColor*/ 8) axis_changes.lineColor = /*lineColor*/ ctx[3];
    			if (dirty & /*gridColor*/ 16) axis_changes.gridColor = /*gridColor*/ ctx[4];
    			if (dirty & /*textColor*/ 32) axis_changes.textColor = /*textColor*/ ctx[5];
    			if (dirty & /*titleCoords*/ 128) axis_changes.titleCoords = /*titleCoords*/ ctx[7];
    			if (dirty & /*showGrid*/ 2) axis_changes.showGrid = /*showGrid*/ ctx[1];
    			if (dirty & /*grid1*/ 256) axis_changes.grid1 = /*grid1*/ ctx[8];
    			if (dirty & /*grid2*/ 512) axis_changes.grid2 = /*grid2*/ ctx[9];
    			if (dirty & /*axisLine*/ 1024) axis_changes.axisLine = /*axisLine*/ ctx[10];
    			if (dirty & /*tickCoords*/ 2048) axis_changes.tickCoords = /*tickCoords*/ ctx[11];
    			if (dirty & /*tickLabels*/ 1) axis_changes.tickLabels = /*tickLabels*/ ctx[0];
    			axis.$set(axis_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(axis.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(axis.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(axis, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$3.name,
    		type: "if",
    		source: "(99:0) {#if $isOk && axisLine.length > 0}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$6(ctx) {
    	let if_block_anchor;
    	let current;
    	let if_block = /*$isOk*/ ctx[6] && /*axisLine*/ ctx[10].length > 0 && create_if_block$3(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*$isOk*/ ctx[6] && /*axisLine*/ ctx[10].length > 0) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*$isOk, axisLine*/ 1088) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block$3(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let $zLim;
    	let $yLim;
    	let $xLim;
    	let $scale;
    	let $isOk;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('XAxis', slots, []);
    	let { slot = "xaxis" } = $$props;
    	let { ticks = undefined } = $$props;
    	let { tickLabels = ticks } = $$props;
    	let { showGrid = false } = $$props;
    	let { title = "" } = $$props; // axis title
    	let { lineColor = Colors.DARKGRAY } = $$props;
    	let { gridColor = Colors.MIDDLEGRAY } = $$props;
    	let { textColor = Colors.DARKGRAY } = $$props;

    	// set up tick mode
    	const tickMode = ticks === undefined ? "auto" : "manual";

    	// sanity checks
    	if (slot !== "xaxis") {
    		throw "XAxis: this component must have \"slot='xaxis'\" attribute.";
    	}

    	if (ticks !== undefined && !Array.isArray(ticks)) {
    		throw "XAxis: 'ticks' must be a vector of numbers.";
    	}

    	if (ticks !== undefined && !(Array.isArray(tickLabels) && tickLabels.length == ticks.length)) {
    		throw "XAxis: 'tickLabels' must be a vector of the same size as ticks.";
    	}

    	// get axes context and adjust x margins
    	const axes = getContext('axes');

    	// get reactive variables needed to compute coordinates
    	const xLim = axes.xLim;

    	validate_store(xLim, 'xLim');
    	component_subscribe($$self, xLim, value => $$invalidate(21, $xLim = value));
    	const yLim = axes.yLim;
    	validate_store(yLim, 'yLim');
    	component_subscribe($$self, yLim, value => $$invalidate(20, $yLim = value));
    	const zLim = axes.zLim;
    	validate_store(zLim, 'zLim');
    	component_subscribe($$self, zLim, value => $$invalidate(19, $zLim = value));
    	const scale = axes.scale;
    	validate_store(scale, 'scale');
    	component_subscribe($$self, scale, value => $$invalidate(22, $scale = value));
    	const isOk = axes.isOk;
    	validate_store(isOk, 'isOk');
    	component_subscribe($$self, isOk, value => $$invalidate(6, $isOk = value));

    	// prepare variables for coordinates
    	let titleCoords = [];

    	let grid1 = [];
    	let grid2 = [];
    	let axisLine = [];
    	let tickCoords = [];

    	const writable_props = [
    		'slot',
    		'ticks',
    		'tickLabels',
    		'showGrid',
    		'title',
    		'lineColor',
    		'gridColor',
    		'textColor'
    	];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<XAxis> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('slot' in $$props) $$invalidate(17, slot = $$props.slot);
    		if ('ticks' in $$props) $$invalidate(18, ticks = $$props.ticks);
    		if ('tickLabels' in $$props) $$invalidate(0, tickLabels = $$props.tickLabels);
    		if ('showGrid' in $$props) $$invalidate(1, showGrid = $$props.showGrid);
    		if ('title' in $$props) $$invalidate(2, title = $$props.title);
    		if ('lineColor' in $$props) $$invalidate(3, lineColor = $$props.lineColor);
    		if ('gridColor' in $$props) $$invalidate(4, gridColor = $$props.gridColor);
    		if ('textColor' in $$props) $$invalidate(5, textColor = $$props.textColor);
    	};

    	$$self.$capture_state = () => ({
    		mean,
    		rep,
    		getContext,
    		Colors,
    		Axis,
    		slot,
    		ticks,
    		tickLabels,
    		showGrid,
    		title,
    		lineColor,
    		gridColor,
    		textColor,
    		tickMode,
    		axes,
    		xLim,
    		yLim,
    		zLim,
    		scale,
    		isOk,
    		titleCoords,
    		grid1,
    		grid2,
    		axisLine,
    		tickCoords,
    		$zLim,
    		$yLim,
    		$xLim,
    		$scale,
    		$isOk
    	});

    	$$self.$inject_state = $$props => {
    		if ('slot' in $$props) $$invalidate(17, slot = $$props.slot);
    		if ('ticks' in $$props) $$invalidate(18, ticks = $$props.ticks);
    		if ('tickLabels' in $$props) $$invalidate(0, tickLabels = $$props.tickLabels);
    		if ('showGrid' in $$props) $$invalidate(1, showGrid = $$props.showGrid);
    		if ('title' in $$props) $$invalidate(2, title = $$props.title);
    		if ('lineColor' in $$props) $$invalidate(3, lineColor = $$props.lineColor);
    		if ('gridColor' in $$props) $$invalidate(4, gridColor = $$props.gridColor);
    		if ('textColor' in $$props) $$invalidate(5, textColor = $$props.textColor);
    		if ('titleCoords' in $$props) $$invalidate(7, titleCoords = $$props.titleCoords);
    		if ('grid1' in $$props) $$invalidate(8, grid1 = $$props.grid1);
    		if ('grid2' in $$props) $$invalidate(9, grid2 = $$props.grid2);
    		if ('axisLine' in $$props) $$invalidate(10, axisLine = $$props.axisLine);
    		if ('tickCoords' in $$props) $$invalidate(11, tickCoords = $$props.tickCoords);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$isOk, $xLim, $scale, ticks, $yLim, $zLim, tickLabels*/ 8126529) {
    			// compute tick x-coordinates
    			if ($isOk) {
    				const ticksX = tickMode === "auto"
    				? axes.getAxisTicks(undefined, $xLim, axes.TICK_NUM[$scale], true)
    				: ticks;

    				const tickNum = ticksX.length;

    				// compute tick y-coordinates (middle, up and bottom)
    				const dY = ($yLim[1] - $yLim[0]) / 100; // 1% of axis size

    				const ticksY = rep($yLim[0], tickNum);
    				const ticksY1 = rep($yLim[0] - dY, tickNum);
    				const ticksY2 = rep($yLim[0] + dY, tickNum);

    				// tick z-coordinates
    				const ticksZ = rep($zLim[0], tickNum);

    				// coordinates for the ends of grid
    				const gridYEnd = rep($yLim[1], tickNum);

    				const gridZEnd = rep($zLim[1], tickNum);

    				// tick labels
    				$$invalidate(0, tickLabels = tickMode === "auto" ? ticksX : tickLabels);

    				// combine all coordinates together
    				$$invalidate(8, grid1 = [[ticksX, ticksY, ticksZ], [ticksX, gridYEnd, ticksZ]]);

    				$$invalidate(9, grid2 = [[ticksX, ticksY, ticksZ], [ticksX, ticksY2, gridZEnd]]);

    				$$invalidate(10, axisLine = [
    					[[$xLim[0]], [$yLim[0]], [$zLim[0]]],
    					[[$xLim[1]], [$yLim[0]], [$zLim[0]]]
    				]);

    				$$invalidate(11, tickCoords = [[ticksX, ticksY1, ticksZ], [ticksX, ticksY2, ticksZ]]);
    				$$invalidate(7, titleCoords = [[$xLim[1]], [ticksY1[0] - 0.05 * ($yLim[1] - $yLim[0])], [$zLim[0]]]);
    			}
    		}
    	};

    	return [
    		tickLabels,
    		showGrid,
    		title,
    		lineColor,
    		gridColor,
    		textColor,
    		$isOk,
    		titleCoords,
    		grid1,
    		grid2,
    		axisLine,
    		tickCoords,
    		xLim,
    		yLim,
    		zLim,
    		scale,
    		isOk,
    		slot,
    		ticks,
    		$zLim,
    		$yLim,
    		$xLim,
    		$scale
    	];
    }

    class XAxis extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {
    			slot: 17,
    			ticks: 18,
    			tickLabels: 0,
    			showGrid: 1,
    			title: 2,
    			lineColor: 3,
    			gridColor: 4,
    			textColor: 5
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "XAxis",
    			options,
    			id: create_fragment$6.name
    		});
    	}

    	get slot() {
    		throw new Error("<XAxis>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set slot(value) {
    		throw new Error("<XAxis>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get ticks() {
    		throw new Error("<XAxis>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set ticks(value) {
    		throw new Error("<XAxis>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get tickLabels() {
    		throw new Error("<XAxis>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set tickLabels(value) {
    		throw new Error("<XAxis>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get showGrid() {
    		throw new Error("<XAxis>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set showGrid(value) {
    		throw new Error("<XAxis>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get title() {
    		throw new Error("<XAxis>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set title(value) {
    		throw new Error("<XAxis>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get lineColor() {
    		throw new Error("<XAxis>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set lineColor(value) {
    		throw new Error("<XAxis>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get gridColor() {
    		throw new Error("<XAxis>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set gridColor(value) {
    		throw new Error("<XAxis>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get textColor() {
    		throw new Error("<XAxis>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set textColor(value) {
    		throw new Error("<XAxis>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* ../shared/plots3d/YAxis.svelte generated by Svelte v3.50.1 */

    // (101:0) {#if $isOk && axisLine.length > 0}
    function create_if_block$2(ctx) {
    	let axis;
    	let current;

    	axis = new Axis({
    			props: {
    				style: "mdaplot__yaxis",
    				pos: 2,
    				title: /*title*/ ctx[2],
    				lineColor: /*lineColor*/ ctx[3],
    				gridColor: /*gridColor*/ ctx[4],
    				textColor: /*textColor*/ ctx[5],
    				titleCoords: /*titleCoords*/ ctx[7],
    				showGrid: /*showGrid*/ ctx[1],
    				grid1: /*grid1*/ ctx[8],
    				grid2: /*grid2*/ ctx[9],
    				axisLine: /*axisLine*/ ctx[10],
    				tickCoords: /*tickCoords*/ ctx[11],
    				tickLabels: /*tickLabels*/ ctx[0]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(axis.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(axis, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const axis_changes = {};
    			if (dirty & /*title*/ 4) axis_changes.title = /*title*/ ctx[2];
    			if (dirty & /*lineColor*/ 8) axis_changes.lineColor = /*lineColor*/ ctx[3];
    			if (dirty & /*gridColor*/ 16) axis_changes.gridColor = /*gridColor*/ ctx[4];
    			if (dirty & /*textColor*/ 32) axis_changes.textColor = /*textColor*/ ctx[5];
    			if (dirty & /*titleCoords*/ 128) axis_changes.titleCoords = /*titleCoords*/ ctx[7];
    			if (dirty & /*showGrid*/ 2) axis_changes.showGrid = /*showGrid*/ ctx[1];
    			if (dirty & /*grid1*/ 256) axis_changes.grid1 = /*grid1*/ ctx[8];
    			if (dirty & /*grid2*/ 512) axis_changes.grid2 = /*grid2*/ ctx[9];
    			if (dirty & /*axisLine*/ 1024) axis_changes.axisLine = /*axisLine*/ ctx[10];
    			if (dirty & /*tickCoords*/ 2048) axis_changes.tickCoords = /*tickCoords*/ ctx[11];
    			if (dirty & /*tickLabels*/ 1) axis_changes.tickLabels = /*tickLabels*/ ctx[0];
    			axis.$set(axis_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(axis.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(axis.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(axis, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(101:0) {#if $isOk && axisLine.length > 0}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$5(ctx) {
    	let if_block_anchor;
    	let current;
    	let if_block = /*$isOk*/ ctx[6] && /*axisLine*/ ctx[10].length > 0 && create_if_block$2(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*$isOk*/ ctx[6] && /*axisLine*/ ctx[10].length > 0) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*$isOk, axisLine*/ 1088) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block$2(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let $zLim;
    	let $yLim;
    	let $xLim;
    	let $scale;
    	let $isOk;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('YAxis', slots, []);
    	let { slot = "yaxis" } = $$props;
    	let { ticks = undefined } = $$props;
    	let { tickLabels = ticks } = $$props;
    	let { showGrid = false } = $$props;
    	let { title = "" } = $$props; // axis title
    	let { lineColor = Colors.DARKGRAY } = $$props;
    	let { gridColor = Colors.MIDDLEGRAY } = $$props;
    	let { textColor = Colors.DARKGRAY } = $$props;

    	// set up tick mode
    	const tickMode = ticks === undefined ? "auto" : "manual";

    	// sanity checks
    	if (slot !== "yaxis") {
    		throw "YAxis: this component must have \"slot='yaxis'\" attribute.";
    	}

    	if (ticks !== undefined && !Array.isArray(ticks)) {
    		throw "YAxis: 'ticks' must be a vector of numbers.";
    	}

    	if (ticks !== undefined && !(Array.isArray(tickLabels) && tickLabels.length == ticks.length)) {
    		throw "YAxis: 'tickLabels' must be a vector of the same size as ticks.";
    	}

    	// get axes context and adjust x margins
    	const axes = getContext('axes');

    	// get reactive variables needed to compute coordinates
    	const xLim = axes.xLim;

    	validate_store(xLim, 'xLim');
    	component_subscribe($$self, xLim, value => $$invalidate(21, $xLim = value));
    	const yLim = axes.yLim;
    	validate_store(yLim, 'yLim');
    	component_subscribe($$self, yLim, value => $$invalidate(20, $yLim = value));
    	const zLim = axes.zLim;
    	validate_store(zLim, 'zLim');
    	component_subscribe($$self, zLim, value => $$invalidate(19, $zLim = value));
    	const scale = axes.scale;
    	validate_store(scale, 'scale');
    	component_subscribe($$self, scale, value => $$invalidate(22, $scale = value));
    	const isOk = axes.isOk;
    	validate_store(isOk, 'isOk');
    	component_subscribe($$self, isOk, value => $$invalidate(6, $isOk = value));

    	// prepare variables for coordinates
    	let titleCoords = [];

    	let grid1 = [];
    	let grid2 = [];
    	let axisLine = [];
    	let tickCoords = [];

    	const writable_props = [
    		'slot',
    		'ticks',
    		'tickLabels',
    		'showGrid',
    		'title',
    		'lineColor',
    		'gridColor',
    		'textColor'
    	];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<YAxis> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('slot' in $$props) $$invalidate(17, slot = $$props.slot);
    		if ('ticks' in $$props) $$invalidate(18, ticks = $$props.ticks);
    		if ('tickLabels' in $$props) $$invalidate(0, tickLabels = $$props.tickLabels);
    		if ('showGrid' in $$props) $$invalidate(1, showGrid = $$props.showGrid);
    		if ('title' in $$props) $$invalidate(2, title = $$props.title);
    		if ('lineColor' in $$props) $$invalidate(3, lineColor = $$props.lineColor);
    		if ('gridColor' in $$props) $$invalidate(4, gridColor = $$props.gridColor);
    		if ('textColor' in $$props) $$invalidate(5, textColor = $$props.textColor);
    	};

    	$$self.$capture_state = () => ({
    		mean,
    		rep,
    		getContext,
    		Colors,
    		Axis,
    		slot,
    		ticks,
    		tickLabels,
    		showGrid,
    		title,
    		lineColor,
    		gridColor,
    		textColor,
    		tickMode,
    		axes,
    		xLim,
    		yLim,
    		zLim,
    		scale,
    		isOk,
    		titleCoords,
    		grid1,
    		grid2,
    		axisLine,
    		tickCoords,
    		$zLim,
    		$yLim,
    		$xLim,
    		$scale,
    		$isOk
    	});

    	$$self.$inject_state = $$props => {
    		if ('slot' in $$props) $$invalidate(17, slot = $$props.slot);
    		if ('ticks' in $$props) $$invalidate(18, ticks = $$props.ticks);
    		if ('tickLabels' in $$props) $$invalidate(0, tickLabels = $$props.tickLabels);
    		if ('showGrid' in $$props) $$invalidate(1, showGrid = $$props.showGrid);
    		if ('title' in $$props) $$invalidate(2, title = $$props.title);
    		if ('lineColor' in $$props) $$invalidate(3, lineColor = $$props.lineColor);
    		if ('gridColor' in $$props) $$invalidate(4, gridColor = $$props.gridColor);
    		if ('textColor' in $$props) $$invalidate(5, textColor = $$props.textColor);
    		if ('titleCoords' in $$props) $$invalidate(7, titleCoords = $$props.titleCoords);
    		if ('grid1' in $$props) $$invalidate(8, grid1 = $$props.grid1);
    		if ('grid2' in $$props) $$invalidate(9, grid2 = $$props.grid2);
    		if ('axisLine' in $$props) $$invalidate(10, axisLine = $$props.axisLine);
    		if ('tickCoords' in $$props) $$invalidate(11, tickCoords = $$props.tickCoords);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$isOk, $yLim, $scale, ticks, $xLim, $zLim, tickLabels*/ 8126529) {
    			// compute tick x-coordinates
    			if ($isOk) {
    				const ticksY = tickMode === "auto"
    				? axes.getAxisTicks(undefined, $yLim, axes.TICK_NUM[$scale], true)
    				: ticks;

    				const tickNum = ticksY.length;

    				// compute tick y-coordinates (middle, up and bottom)
    				const dX = ($xLim[1] - $xLim[0]) / 100; // 1% of axis size

    				const ticksX = rep($xLim[0], tickNum);
    				const ticksX1 = rep($xLim[0] - dX, tickNum);
    				const ticksX2 = rep($xLim[0] + dX, tickNum);

    				// tick z-coordinates
    				const ticksZ = rep($zLim[0], tickNum);

    				// coordinates for the ends of grid
    				const gridXEnd = rep($xLim[1], tickNum);

    				const gridZEnd = rep($zLim[1], tickNum);

    				// tick labels
    				$$invalidate(0, tickLabels = tickMode === "auto" ? ticksY : tickLabels);

    				// combine all coordinates together
    				$$invalidate(8, grid1 = [[ticksX, ticksY, ticksZ], [gridXEnd, ticksY, ticksZ]]);

    				$$invalidate(9, grid2 = [[ticksX, ticksY, ticksZ], [ticksX, ticksY, gridZEnd]]);

    				$$invalidate(10, axisLine = [
    					[[$xLim[0]], [$yLim[0]], [$zLim[0]]],
    					[[$xLim[0]], [$yLim[1]], [$zLim[0]]]
    				]);

    				$$invalidate(11, tickCoords = [[ticksX1, ticksY, ticksZ], [ticksX2, ticksY, ticksZ]]);
    				$$invalidate(7, titleCoords = [[ticksX1[0] - 0.05 * ($xLim[1] - $xLim[0])], [$yLim[1]], [$zLim[0]]]);
    			}
    		}
    	};

    	return [
    		tickLabels,
    		showGrid,
    		title,
    		lineColor,
    		gridColor,
    		textColor,
    		$isOk,
    		titleCoords,
    		grid1,
    		grid2,
    		axisLine,
    		tickCoords,
    		xLim,
    		yLim,
    		zLim,
    		scale,
    		isOk,
    		slot,
    		ticks,
    		$zLim,
    		$yLim,
    		$xLim,
    		$scale
    	];
    }

    class YAxis extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {
    			slot: 17,
    			ticks: 18,
    			tickLabels: 0,
    			showGrid: 1,
    			title: 2,
    			lineColor: 3,
    			gridColor: 4,
    			textColor: 5
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "YAxis",
    			options,
    			id: create_fragment$5.name
    		});
    	}

    	get slot() {
    		throw new Error("<YAxis>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set slot(value) {
    		throw new Error("<YAxis>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get ticks() {
    		throw new Error("<YAxis>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set ticks(value) {
    		throw new Error("<YAxis>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get tickLabels() {
    		throw new Error("<YAxis>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set tickLabels(value) {
    		throw new Error("<YAxis>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get showGrid() {
    		throw new Error("<YAxis>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set showGrid(value) {
    		throw new Error("<YAxis>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get title() {
    		throw new Error("<YAxis>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set title(value) {
    		throw new Error("<YAxis>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get lineColor() {
    		throw new Error("<YAxis>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set lineColor(value) {
    		throw new Error("<YAxis>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get gridColor() {
    		throw new Error("<YAxis>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set gridColor(value) {
    		throw new Error("<YAxis>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get textColor() {
    		throw new Error("<YAxis>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set textColor(value) {
    		throw new Error("<YAxis>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* ../shared/plots3d/ZAxis.svelte generated by Svelte v3.50.1 */

    // (102:0) {#if $isOk && axisLine.length > 0}
    function create_if_block$1(ctx) {
    	let axis;
    	let current;

    	axis = new Axis({
    			props: {
    				style: "mdaplot__yaxis",
    				pos: 2,
    				title: /*title*/ ctx[2],
    				lineColor: /*lineColor*/ ctx[3],
    				gridColor: /*gridColor*/ ctx[4],
    				textColor: /*textColor*/ ctx[5],
    				titleCoords: /*titleCoords*/ ctx[6],
    				showGrid: /*showGrid*/ ctx[1],
    				grid1: /*grid1*/ ctx[7],
    				grid2: /*grid2*/ ctx[8],
    				axisLine: /*axisLine*/ ctx[9],
    				tickCoords: /*tickCoords*/ ctx[10],
    				tickLabels: /*tickLabels*/ ctx[0]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(axis.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(axis, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const axis_changes = {};
    			if (dirty & /*title*/ 4) axis_changes.title = /*title*/ ctx[2];
    			if (dirty & /*lineColor*/ 8) axis_changes.lineColor = /*lineColor*/ ctx[3];
    			if (dirty & /*gridColor*/ 16) axis_changes.gridColor = /*gridColor*/ ctx[4];
    			if (dirty & /*textColor*/ 32) axis_changes.textColor = /*textColor*/ ctx[5];
    			if (dirty & /*titleCoords*/ 64) axis_changes.titleCoords = /*titleCoords*/ ctx[6];
    			if (dirty & /*showGrid*/ 2) axis_changes.showGrid = /*showGrid*/ ctx[1];
    			if (dirty & /*grid1*/ 128) axis_changes.grid1 = /*grid1*/ ctx[7];
    			if (dirty & /*grid2*/ 256) axis_changes.grid2 = /*grid2*/ ctx[8];
    			if (dirty & /*axisLine*/ 512) axis_changes.axisLine = /*axisLine*/ ctx[9];
    			if (dirty & /*tickCoords*/ 1024) axis_changes.tickCoords = /*tickCoords*/ ctx[10];
    			if (dirty & /*tickLabels*/ 1) axis_changes.tickLabels = /*tickLabels*/ ctx[0];
    			axis.$set(axis_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(axis.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(axis.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(axis, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(102:0) {#if $isOk && axisLine.length > 0}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let if_block_anchor;
    	let current;
    	let if_block = /*$isOk*/ ctx[11] && /*axisLine*/ ctx[9].length > 0 && create_if_block$1(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*$isOk*/ ctx[11] && /*axisLine*/ ctx[9].length > 0) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*$isOk, axisLine*/ 2560) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block$1(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let $zLim;
    	let $yLim;
    	let $xLim;
    	let $scale;
    	let $isOk;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('ZAxis', slots, []);
    	let { slot = "zaxis" } = $$props;
    	let { ticks = undefined } = $$props;
    	let { tickLabels = ticks } = $$props;
    	let { showGrid = false } = $$props;
    	let { title = "" } = $$props; // axis title
    	let { lineColor = Colors.DARKGRAY } = $$props;
    	let { gridColor = Colors.MIDDLEGRAY } = $$props;
    	let { textColor = Colors.DARKGRAY } = $$props;

    	// set up tick mode
    	const tickMode = ticks === undefined ? "auto" : "manual";

    	// sanity checks
    	if (slot !== "zaxis") {
    		throw "ZAxis: this component must have \"slot='zaxis'\" attribute.";
    	}

    	if (ticks !== undefined && !Array.isArray(ticks)) {
    		throw "ZAxis: 'ticks' must be a vector of numbers.";
    	}

    	if (ticks !== undefined && !(Array.isArray(tickLabels) && tickLabels.length == ticks.length)) {
    		throw "ZAxis: 'tickLabels' must be a vector of the same size as ticks.";
    	}

    	// get axes context
    	const axes = getContext('axes');

    	// get reactive variables needed to compute coordinates
    	const xLim = axes.xLim;

    	validate_store(xLim, 'xLim');
    	component_subscribe($$self, xLim, value => $$invalidate(21, $xLim = value));
    	const yLim = axes.yLim;
    	validate_store(yLim, 'yLim');
    	component_subscribe($$self, yLim, value => $$invalidate(20, $yLim = value));
    	const zLim = axes.zLim;
    	validate_store(zLim, 'zLim');
    	component_subscribe($$self, zLim, value => $$invalidate(19, $zLim = value));
    	const scale = axes.scale;
    	validate_store(scale, 'scale');
    	component_subscribe($$self, scale, value => $$invalidate(22, $scale = value));
    	const isOk = axes.isOk;
    	validate_store(isOk, 'isOk');
    	component_subscribe($$self, isOk, value => $$invalidate(11, $isOk = value));

    	// prepare variables for coordinates
    	let titleCoords = [];

    	let grid1 = [];
    	let grid2 = [];
    	let axisLine = [];
    	let tickCoords = [];

    	// compute tick x-coordinates
    	if ($isOk) {
    		const ticksZ = tickMode === "auto"
    		? axes.getAxisTicks(undefined, $zLim, axes.TICK_NUM[$scale], true)
    		: ticks;

    		const tickNum = ticksZ.length;

    		// compute tick y-coordinates (middle, up and bottom)
    		const dX = ($xLim[1] - $xLim[0]) / 100; // 1% of axis size

    		const ticksX = rep($xLim[0], tickNum);
    		const ticksX1 = rep($xLim[0] - dX, tickNum);
    		const ticksX2 = rep($xLim[0] + dX, tickNum);

    		// tick z-coordinates
    		const ticksY = rep($yLim[0], tickNum);

    		// coordinates for the ends of grid
    		const gridXEnd = rep($xLim[1], tickNum);

    		const gridYEnd = rep($yLim[1], tickNum);

    		// tick labels
    		tickLabels = tickMode === "auto" ? ticksZ : tickLabels;

    		// combine all coordinates together
    		grid1 = [[ticksX, ticksY, ticksZ], [gridXEnd, ticksY, ticksZ]];

    		grid2 = [[ticksX, ticksY, ticksZ], [ticksX, gridYEnd, ticksZ]];
    		axisLine = [[[$xLim[0]], [$yLim[0]], [$zLim[0]]], [[$xLim[0]], [$yLim[0]], [$zLim[1]]]];
    		tickCoords = [[ticksX1, ticksY, ticksZ], [ticksX2, ticksY, ticksZ]];
    		titleCoords = [[ticksX1[0] - 0.05 * ($xLim[1] - $xLim[0])], [$yLim[0]], [$zLim[1]]];
    	}

    	const writable_props = [
    		'slot',
    		'ticks',
    		'tickLabels',
    		'showGrid',
    		'title',
    		'lineColor',
    		'gridColor',
    		'textColor'
    	];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<ZAxis> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('slot' in $$props) $$invalidate(17, slot = $$props.slot);
    		if ('ticks' in $$props) $$invalidate(18, ticks = $$props.ticks);
    		if ('tickLabels' in $$props) $$invalidate(0, tickLabels = $$props.tickLabels);
    		if ('showGrid' in $$props) $$invalidate(1, showGrid = $$props.showGrid);
    		if ('title' in $$props) $$invalidate(2, title = $$props.title);
    		if ('lineColor' in $$props) $$invalidate(3, lineColor = $$props.lineColor);
    		if ('gridColor' in $$props) $$invalidate(4, gridColor = $$props.gridColor);
    		if ('textColor' in $$props) $$invalidate(5, textColor = $$props.textColor);
    	};

    	$$self.$capture_state = () => ({
    		rep,
    		getContext,
    		Colors,
    		Axis,
    		slot,
    		ticks,
    		tickLabels,
    		showGrid,
    		title,
    		lineColor,
    		gridColor,
    		textColor,
    		tickMode,
    		axes,
    		xLim,
    		yLim,
    		zLim,
    		scale,
    		isOk,
    		titleCoords,
    		grid1,
    		grid2,
    		axisLine,
    		tickCoords,
    		$zLim,
    		$yLim,
    		$xLim,
    		$scale,
    		$isOk
    	});

    	$$self.$inject_state = $$props => {
    		if ('slot' in $$props) $$invalidate(17, slot = $$props.slot);
    		if ('ticks' in $$props) $$invalidate(18, ticks = $$props.ticks);
    		if ('tickLabels' in $$props) $$invalidate(0, tickLabels = $$props.tickLabels);
    		if ('showGrid' in $$props) $$invalidate(1, showGrid = $$props.showGrid);
    		if ('title' in $$props) $$invalidate(2, title = $$props.title);
    		if ('lineColor' in $$props) $$invalidate(3, lineColor = $$props.lineColor);
    		if ('gridColor' in $$props) $$invalidate(4, gridColor = $$props.gridColor);
    		if ('textColor' in $$props) $$invalidate(5, textColor = $$props.textColor);
    		if ('titleCoords' in $$props) $$invalidate(6, titleCoords = $$props.titleCoords);
    		if ('grid1' in $$props) $$invalidate(7, grid1 = $$props.grid1);
    		if ('grid2' in $$props) $$invalidate(8, grid2 = $$props.grid2);
    		if ('axisLine' in $$props) $$invalidate(9, axisLine = $$props.axisLine);
    		if ('tickCoords' in $$props) $$invalidate(10, tickCoords = $$props.tickCoords);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		tickLabels,
    		showGrid,
    		title,
    		lineColor,
    		gridColor,
    		textColor,
    		titleCoords,
    		grid1,
    		grid2,
    		axisLine,
    		tickCoords,
    		$isOk,
    		xLim,
    		yLim,
    		zLim,
    		scale,
    		isOk,
    		slot,
    		ticks
    	];
    }

    class ZAxis extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {
    			slot: 17,
    			ticks: 18,
    			tickLabels: 0,
    			showGrid: 1,
    			title: 2,
    			lineColor: 3,
    			gridColor: 4,
    			textColor: 5
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ZAxis",
    			options,
    			id: create_fragment$4.name
    		});
    	}

    	get slot() {
    		throw new Error("<ZAxis>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set slot(value) {
    		throw new Error("<ZAxis>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get ticks() {
    		throw new Error("<ZAxis>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set ticks(value) {
    		throw new Error("<ZAxis>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get tickLabels() {
    		throw new Error("<ZAxis>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set tickLabels(value) {
    		throw new Error("<ZAxis>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get showGrid() {
    		throw new Error("<ZAxis>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set showGrid(value) {
    		throw new Error("<ZAxis>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get title() {
    		throw new Error("<ZAxis>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set title(value) {
    		throw new Error("<ZAxis>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get lineColor() {
    		throw new Error("<ZAxis>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set lineColor(value) {
    		throw new Error("<ZAxis>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get gridColor() {
    		throw new Error("<ZAxis>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set gridColor(value) {
    		throw new Error("<ZAxis>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get textColor() {
    		throw new Error("<ZAxis>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set textColor(value) {
    		throw new Error("<ZAxis>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* ../shared/plots3d/Segments.svelte generated by Svelte v3.50.1 */
    const file$2 = "../shared/plots3d/Segments.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[22] = list[i];
    	child_ctx[24] = i;
    	return child_ctx;
    }

    // (70:0) {#if x1 !== undefined && y1 !== undefined && x2 !== undefined && y2 !== undefined}
    function create_if_block(ctx) {
    	let each_1_anchor;
    	let each_value = /*x1*/ ctx[5];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*x1, x2, y1, y2, lineStyleStr*/ 62) {
    				each_value = /*x1*/ ctx[5];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(70:0) {#if x1 !== undefined && y1 !== undefined && x2 !== undefined && y2 !== undefined}",
    		ctx
    	});

    	return block;
    }

    // (71:3) {#each x1 as v, i}
    function create_each_block(ctx) {
    	let line;
    	let line_x__value;
    	let line_x__value_1;
    	let line_y__value;
    	let line_y__value_1;

    	const block = {
    		c: function create() {
    			line = svg_element("line");
    			attr_dev(line, "vector-effect", "non-scaling-stroke");
    			attr_dev(line, "x1", line_x__value = /*x1*/ ctx[5][/*i*/ ctx[24]]);
    			attr_dev(line, "x2", line_x__value_1 = /*x2*/ ctx[4][/*i*/ ctx[24]]);
    			attr_dev(line, "y1", line_y__value = /*y1*/ ctx[3][/*i*/ ctx[24]]);
    			attr_dev(line, "y2", line_y__value_1 = /*y2*/ ctx[2][/*i*/ ctx[24]]);
    			attr_dev(line, "style", /*lineStyleStr*/ ctx[1]);
    			add_location(line, file$2, 71, 6, 2473);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, line, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*x1*/ 32 && line_x__value !== (line_x__value = /*x1*/ ctx[5][/*i*/ ctx[24]])) {
    				attr_dev(line, "x1", line_x__value);
    			}

    			if (dirty & /*x2*/ 16 && line_x__value_1 !== (line_x__value_1 = /*x2*/ ctx[4][/*i*/ ctx[24]])) {
    				attr_dev(line, "x2", line_x__value_1);
    			}

    			if (dirty & /*y1*/ 8 && line_y__value !== (line_y__value = /*y1*/ ctx[3][/*i*/ ctx[24]])) {
    				attr_dev(line, "y1", line_y__value);
    			}

    			if (dirty & /*y2*/ 4 && line_y__value_1 !== (line_y__value_1 = /*y2*/ ctx[2][/*i*/ ctx[24]])) {
    				attr_dev(line, "y2", line_y__value_1);
    			}

    			if (dirty & /*lineStyleStr*/ 2) {
    				attr_dev(line, "style", /*lineStyleStr*/ ctx[1]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(line);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(71:3) {#each x1 as v, i}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let g;
    	let if_block = /*x1*/ ctx[5] !== undefined && /*y1*/ ctx[3] !== undefined && /*x2*/ ctx[4] !== undefined && /*y2*/ ctx[2] !== undefined && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			g = svg_element("g");
    			if (if_block) if_block.c();
    			attr_dev(g, "class", "series series_segment");
    			attr_dev(g, "data-title", /*title*/ ctx[0]);
    			add_location(g, file$2, 68, 0, 2307);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, g, anchor);
    			if (if_block) if_block.m(g, null);
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*x1*/ ctx[5] !== undefined && /*y1*/ ctx[3] !== undefined && /*x2*/ ctx[4] !== undefined && /*y2*/ ctx[2] !== undefined) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					if_block.m(g, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (dirty & /*title*/ 1) {
    				attr_dev(g, "data-title", /*title*/ ctx[0]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(g);
    			if (if_block) if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let coords1;
    	let coords2;
    	let x1;
    	let x2;
    	let y1;
    	let y2;
    	let lineStyleStr;
    	let $scale;
    	let $tM;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Segments', slots, []);
    	let { title = "" } = $$props;
    	let { xStart } = $$props;
    	let { xEnd } = $$props;
    	let { yStart } = $$props;
    	let { yEnd } = $$props;
    	let { zStart = undefined } = $$props;
    	let { zEnd = undefined } = $$props;
    	let { lineColor = Colors.PRIMARY } = $$props;
    	let { lineType = 1 } = $$props;
    	let { lineWidth = 1 } = $$props;

    	// get axes context and reactive variables needed to compute coordinates
    	const axes = getContext('axes');

    	const scale = axes.scale;
    	validate_store(scale, 'scale');
    	component_subscribe($$self, scale, value => $$invalidate(19, $scale = value));
    	const tM = axes.tM;
    	validate_store(tM, 'tM');
    	component_subscribe($$self, tM, value => $$invalidate(20, $tM = value));

    	const writable_props = [
    		'title',
    		'xStart',
    		'xEnd',
    		'yStart',
    		'yEnd',
    		'zStart',
    		'zEnd',
    		'lineColor',
    		'lineType',
    		'lineWidth'
    	];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Segments> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('title' in $$props) $$invalidate(0, title = $$props.title);
    		if ('xStart' in $$props) $$invalidate(10, xStart = $$props.xStart);
    		if ('xEnd' in $$props) $$invalidate(11, xEnd = $$props.xEnd);
    		if ('yStart' in $$props) $$invalidate(12, yStart = $$props.yStart);
    		if ('yEnd' in $$props) $$invalidate(13, yEnd = $$props.yEnd);
    		if ('zStart' in $$props) $$invalidate(8, zStart = $$props.zStart);
    		if ('zEnd' in $$props) $$invalidate(9, zEnd = $$props.zEnd);
    		if ('lineColor' in $$props) $$invalidate(14, lineColor = $$props.lineColor);
    		if ('lineType' in $$props) $$invalidate(15, lineType = $$props.lineType);
    		if ('lineWidth' in $$props) $$invalidate(16, lineWidth = $$props.lineWidth);
    	};

    	$$self.$capture_state = () => ({
    		mrange,
    		rep,
    		getContext,
    		Colors,
    		title,
    		xStart,
    		xEnd,
    		yStart,
    		yEnd,
    		zStart,
    		zEnd,
    		lineColor,
    		lineType,
    		lineWidth,
    		axes,
    		scale,
    		tM,
    		lineStyleStr,
    		coords2,
    		y2,
    		coords1,
    		y1,
    		x2,
    		x1,
    		$scale,
    		$tM
    	});

    	$$self.$inject_state = $$props => {
    		if ('title' in $$props) $$invalidate(0, title = $$props.title);
    		if ('xStart' in $$props) $$invalidate(10, xStart = $$props.xStart);
    		if ('xEnd' in $$props) $$invalidate(11, xEnd = $$props.xEnd);
    		if ('yStart' in $$props) $$invalidate(12, yStart = $$props.yStart);
    		if ('yEnd' in $$props) $$invalidate(13, yEnd = $$props.yEnd);
    		if ('zStart' in $$props) $$invalidate(8, zStart = $$props.zStart);
    		if ('zEnd' in $$props) $$invalidate(9, zEnd = $$props.zEnd);
    		if ('lineColor' in $$props) $$invalidate(14, lineColor = $$props.lineColor);
    		if ('lineType' in $$props) $$invalidate(15, lineType = $$props.lineType);
    		if ('lineWidth' in $$props) $$invalidate(16, lineWidth = $$props.lineWidth);
    		if ('lineStyleStr' in $$props) $$invalidate(1, lineStyleStr = $$props.lineStyleStr);
    		if ('coords2' in $$props) $$invalidate(17, coords2 = $$props.coords2);
    		if ('y2' in $$props) $$invalidate(2, y2 = $$props.y2);
    		if ('coords1' in $$props) $$invalidate(18, coords1 = $$props.coords1);
    		if ('y1' in $$props) $$invalidate(3, y1 = $$props.y1);
    		if ('x2' in $$props) $$invalidate(4, x2 = $$props.x2);
    		if ('x1' in $$props) $$invalidate(5, x1 = $$props.x1);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*xStart, xEnd, yStart, yEnd, zStart, zEnd*/ 16128) {
    			// sanity check for input parameters
    			{
    				if (!Array.isArray(xStart) || !Array.isArray(xEnd) || !Array.isArray(yStart) || !Array.isArray(yEnd)) {
    					throw "Segments: parameters 'xStart', 'yStart', 'xEnd' and 'yEnd' must be vectors.";
    				}

    				const n = xStart.length;

    				if (xEnd.length !== n || yStart.length !== n || yEnd.length !== n) {
    					throw "Segments: parameters 'xStart', 'yStart', 'xEnd' and 'yEnd' should have the same length.";
    				}

    				if (zStart === undefined) {
    					$$invalidate(8, zStart = rep(0, n));
    				}

    				if (zEnd === undefined) {
    					$$invalidate(9, zEnd = zStart);
    				}
    			}
    		}

    		if ($$self.$$.dirty & /*xStart, xEnd*/ 3072) {
    			axes.adjustXAxisLimits(mrange(xStart.concat(xEnd)));
    		}

    		if ($$self.$$.dirty & /*yStart, yEnd*/ 12288) {
    			axes.adjustYAxisLimits(mrange(yStart.concat(yEnd)));
    		}

    		if ($$self.$$.dirty & /*zStart, zEnd*/ 768) {
    			axes.adjustZAxisLimits(mrange(zStart.concat(zEnd)));
    		}

    		if ($$self.$$.dirty & /*xStart, yStart, zStart, $tM*/ 1053952) {
    			// reactive variables for coordinates of data points in pixels (and line style)
    			$$invalidate(18, coords1 = axes.world2pixels([xStart, yStart, zStart], $tM));
    		}

    		if ($$self.$$.dirty & /*xEnd, yEnd, zEnd, $tM*/ 1059328) {
    			$$invalidate(17, coords2 = axes.world2pixels([xEnd, yEnd, zEnd], $tM));
    		}

    		if ($$self.$$.dirty & /*coords1*/ 262144) {
    			$$invalidate(5, x1 = coords1[0]);
    		}

    		if ($$self.$$.dirty & /*coords2*/ 131072) {
    			$$invalidate(4, x2 = coords2[0]);
    		}

    		if ($$self.$$.dirty & /*coords1*/ 262144) {
    			$$invalidate(3, y1 = coords1[1]);
    		}

    		if ($$self.$$.dirty & /*coords2*/ 131072) {
    			$$invalidate(2, y2 = coords2[1]);
    		}

    		if ($$self.$$.dirty & /*lineColor, lineWidth, $scale, lineType*/ 638976) {
    			$$invalidate(1, lineStyleStr = `stroke:${lineColor};stroke-width: ${lineWidth}px;stroke-dasharray:${axes.LINE_STYLES[$scale][lineType - 1]}`);
    		}
    	};

    	return [
    		title,
    		lineStyleStr,
    		y2,
    		y1,
    		x2,
    		x1,
    		scale,
    		tM,
    		zStart,
    		zEnd,
    		xStart,
    		xEnd,
    		yStart,
    		yEnd,
    		lineColor,
    		lineType,
    		lineWidth,
    		coords2,
    		coords1,
    		$scale,
    		$tM
    	];
    }

    class Segments extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {
    			title: 0,
    			xStart: 10,
    			xEnd: 11,
    			yStart: 12,
    			yEnd: 13,
    			zStart: 8,
    			zEnd: 9,
    			lineColor: 14,
    			lineType: 15,
    			lineWidth: 16
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Segments",
    			options,
    			id: create_fragment$3.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*xStart*/ ctx[10] === undefined && !('xStart' in props)) {
    			console.warn("<Segments> was created without expected prop 'xStart'");
    		}

    		if (/*xEnd*/ ctx[11] === undefined && !('xEnd' in props)) {
    			console.warn("<Segments> was created without expected prop 'xEnd'");
    		}

    		if (/*yStart*/ ctx[12] === undefined && !('yStart' in props)) {
    			console.warn("<Segments> was created without expected prop 'yStart'");
    		}

    		if (/*yEnd*/ ctx[13] === undefined && !('yEnd' in props)) {
    			console.warn("<Segments> was created without expected prop 'yEnd'");
    		}
    	}

    	get title() {
    		throw new Error("<Segments>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set title(value) {
    		throw new Error("<Segments>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get xStart() {
    		throw new Error("<Segments>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set xStart(value) {
    		throw new Error("<Segments>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get xEnd() {
    		throw new Error("<Segments>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set xEnd(value) {
    		throw new Error("<Segments>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get yStart() {
    		throw new Error("<Segments>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set yStart(value) {
    		throw new Error("<Segments>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get yEnd() {
    		throw new Error("<Segments>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set yEnd(value) {
    		throw new Error("<Segments>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get zStart() {
    		throw new Error("<Segments>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set zStart(value) {
    		throw new Error("<Segments>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get zEnd() {
    		throw new Error("<Segments>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set zEnd(value) {
    		throw new Error("<Segments>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get lineColor() {
    		throw new Error("<Segments>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set lineColor(value) {
    		throw new Error("<Segments>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get lineType() {
    		throw new Error("<Segments>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set lineType(value) {
    		throw new Error("<Segments>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get lineWidth() {
    		throw new Error("<Segments>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set lineWidth(value) {
    		throw new Error("<Segments>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* ../shared/plots3d/ScatterSeries.svelte generated by Svelte v3.50.1 */

    function create_fragment$2(ctx) {
    	let textlabels;
    	let current;

    	textlabels = new TextLabels({
    			props: {
    				xValues: /*xValues*/ ctx[1],
    				yValues: /*yValues*/ ctx[2],
    				zValues: /*zValues*/ ctx[0],
    				faceColor: /*faceColor*/ ctx[4],
    				borderColor: /*borderColor*/ ctx[5],
    				borderWidth: /*borderWidth*/ ctx[6],
    				title: /*title*/ ctx[3],
    				style: "series_scatter",
    				labels: /*markerSymbol*/ ctx[8],
    				textSize: /*markerSize*/ ctx[7]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(textlabels.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(textlabels, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const textlabels_changes = {};
    			if (dirty & /*xValues*/ 2) textlabels_changes.xValues = /*xValues*/ ctx[1];
    			if (dirty & /*yValues*/ 4) textlabels_changes.yValues = /*yValues*/ ctx[2];
    			if (dirty & /*zValues*/ 1) textlabels_changes.zValues = /*zValues*/ ctx[0];
    			if (dirty & /*faceColor*/ 16) textlabels_changes.faceColor = /*faceColor*/ ctx[4];
    			if (dirty & /*borderColor*/ 32) textlabels_changes.borderColor = /*borderColor*/ ctx[5];
    			if (dirty & /*borderWidth*/ 64) textlabels_changes.borderWidth = /*borderWidth*/ ctx[6];
    			if (dirty & /*title*/ 8) textlabels_changes.title = /*title*/ ctx[3];
    			if (dirty & /*markerSymbol*/ 256) textlabels_changes.labels = /*markerSymbol*/ ctx[8];
    			if (dirty & /*markerSize*/ 128) textlabels_changes.textSize = /*markerSize*/ ctx[7];
    			textlabels.$set(textlabels_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(textlabels.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(textlabels.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(textlabels, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('ScatterSeries', slots, []);
    	let { xValues } = $$props;
    	let { yValues } = $$props;
    	let { zValues = undefined } = $$props;
    	let { marker = 1 } = $$props;
    	let { title = "" } = $$props;
    	let { faceColor = "transparent" } = $$props;
    	let { borderColor = Colors.PRIMARY } = $$props;
    	let { borderWidth = 1 } = $$props;
    	let { markerSize = 1 } = $$props;

    	/* constants for internal use */
    	const markers = ["●", "◼", "▲", "▼", "⬥", "+", "*", "⨯"];

    	let markerSymbol;

    	/* sanity check of input parameters */
    	if (typeof marker !== "number" || marker < 1 || marker > markers.length) {
    		throw `ScatterSeries: parameter 'marker' must be a number from 1 to ${markers.length}."`;
    	}

    	// get axes context and reactive variables needed to compute coordinates
    	const axes = getContext('axes');

    	const writable_props = [
    		'xValues',
    		'yValues',
    		'zValues',
    		'marker',
    		'title',
    		'faceColor',
    		'borderColor',
    		'borderWidth',
    		'markerSize'
    	];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<ScatterSeries> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('xValues' in $$props) $$invalidate(1, xValues = $$props.xValues);
    		if ('yValues' in $$props) $$invalidate(2, yValues = $$props.yValues);
    		if ('zValues' in $$props) $$invalidate(0, zValues = $$props.zValues);
    		if ('marker' in $$props) $$invalidate(9, marker = $$props.marker);
    		if ('title' in $$props) $$invalidate(3, title = $$props.title);
    		if ('faceColor' in $$props) $$invalidate(4, faceColor = $$props.faceColor);
    		if ('borderColor' in $$props) $$invalidate(5, borderColor = $$props.borderColor);
    		if ('borderWidth' in $$props) $$invalidate(6, borderWidth = $$props.borderWidth);
    		if ('markerSize' in $$props) $$invalidate(7, markerSize = $$props.markerSize);
    	};

    	$$self.$capture_state = () => ({
    		range,
    		mrange,
    		rep,
    		getContext,
    		Colors,
    		TextLabels,
    		xValues,
    		yValues,
    		zValues,
    		marker,
    		title,
    		faceColor,
    		borderColor,
    		borderWidth,
    		markerSize,
    		markers,
    		markerSymbol,
    		axes
    	});

    	$$self.$inject_state = $$props => {
    		if ('xValues' in $$props) $$invalidate(1, xValues = $$props.xValues);
    		if ('yValues' in $$props) $$invalidate(2, yValues = $$props.yValues);
    		if ('zValues' in $$props) $$invalidate(0, zValues = $$props.zValues);
    		if ('marker' in $$props) $$invalidate(9, marker = $$props.marker);
    		if ('title' in $$props) $$invalidate(3, title = $$props.title);
    		if ('faceColor' in $$props) $$invalidate(4, faceColor = $$props.faceColor);
    		if ('borderColor' in $$props) $$invalidate(5, borderColor = $$props.borderColor);
    		if ('borderWidth' in $$props) $$invalidate(6, borderWidth = $$props.borderWidth);
    		if ('markerSize' in $$props) $$invalidate(7, markerSize = $$props.markerSize);
    		if ('markerSymbol' in $$props) $$invalidate(8, markerSymbol = $$props.markerSymbol);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*xValues, yValues, zValues*/ 7) {
    			// sanity check for input parameters
    			{
    				if (!Array.isArray(xValues) || !Array.isArray(yValues)) {
    					throw "ScatterSeries: parameters 'xValues' and 'yValues' must be vectors.";
    				}

    				const n = xValues.length;

    				if (yValues.length !== n) {
    					throw "ScatterSeries: parameters 'xValues', 'yValues' should have the same length.";
    				}

    				if (zValues === undefined) {
    					$$invalidate(0, zValues = rep(0, n));
    				}
    			}
    		}

    		if ($$self.$$.dirty & /*xValues*/ 2) {
    			axes.adjustXAxisLimits(mrange(xValues));
    		}

    		if ($$self.$$.dirty & /*yValues*/ 4) {
    			axes.adjustYAxisLimits(mrange(yValues));
    		}

    		if ($$self.$$.dirty & /*zValues*/ 1) {
    			axes.adjustZAxisLimits(mrange(zValues));
    		}

    		if ($$self.$$.dirty & /*marker*/ 512) {
    			// reactive variables for coordinates of data points in pixels (and line style)
    			$$invalidate(8, markerSymbol = markers[marker - 1]);
    		}
    	};

    	return [
    		zValues,
    		xValues,
    		yValues,
    		title,
    		faceColor,
    		borderColor,
    		borderWidth,
    		markerSize,
    		markerSymbol,
    		marker
    	];
    }

    class ScatterSeries extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {
    			xValues: 1,
    			yValues: 2,
    			zValues: 0,
    			marker: 9,
    			title: 3,
    			faceColor: 4,
    			borderColor: 5,
    			borderWidth: 6,
    			markerSize: 7
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ScatterSeries",
    			options,
    			id: create_fragment$2.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*xValues*/ ctx[1] === undefined && !('xValues' in props)) {
    			console.warn("<ScatterSeries> was created without expected prop 'xValues'");
    		}

    		if (/*yValues*/ ctx[2] === undefined && !('yValues' in props)) {
    			console.warn("<ScatterSeries> was created without expected prop 'yValues'");
    		}
    	}

    	get xValues() {
    		throw new Error("<ScatterSeries>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set xValues(value) {
    		throw new Error("<ScatterSeries>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get yValues() {
    		throw new Error("<ScatterSeries>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set yValues(value) {
    		throw new Error("<ScatterSeries>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get zValues() {
    		throw new Error("<ScatterSeries>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set zValues(value) {
    		throw new Error("<ScatterSeries>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get marker() {
    		throw new Error("<ScatterSeries>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set marker(value) {
    		throw new Error("<ScatterSeries>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get title() {
    		throw new Error("<ScatterSeries>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set title(value) {
    		throw new Error("<ScatterSeries>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get faceColor() {
    		throw new Error("<ScatterSeries>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set faceColor(value) {
    		throw new Error("<ScatterSeries>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get borderColor() {
    		throw new Error("<ScatterSeries>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set borderColor(value) {
    		throw new Error("<ScatterSeries>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get borderWidth() {
    		throw new Error("<ScatterSeries>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set borderWidth(value) {
    		throw new Error("<ScatterSeries>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get markerSize() {
    		throw new Error("<ScatterSeries>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set markerSize(value) {
    		throw new Error("<ScatterSeries>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/AppPlot.svelte generated by Svelte v3.50.1 */
    const file$1 = "src/AppPlot.svelte";

    // (42:3) <Axes limY={[0, 5]} limZ={[0, 5]} {zoom} {phi} {theta}>
    function create_default_slot$1(ctx) {
    	let segments0;
    	let t0;
    	let scatterseries0;
    	let t1;
    	let scatterseries1;
    	let t2;
    	let segments1;
    	let current;

    	segments0 = new Segments({
    			props: {
    				xStart: /*X1Start*/ ctx[3][1],
    				zStart: /*X1Start*/ ctx[3][2],
    				yStart: /*Y1Start*/ ctx[4][0],
    				xEnd: /*X1End*/ ctx[5][1],
    				zEnd: /*X1End*/ ctx[5][2],
    				yEnd: /*Y1End*/ ctx[6][0],
    				lineColor: "#4466ff60"
    			},
    			$$inline: true
    		});

    	scatterseries0 = new ScatterSeries({
    			props: {
    				xValues: [/*pX*/ ctx[7]],
    				yValues: [/*pY*/ ctx[9]],
    				zValues: [/*pZ*/ ctx[8]]
    			},
    			$$inline: true
    		});

    	scatterseries1 = new ScatterSeries({
    			props: {
    				xValues: [/*pX*/ ctx[7]],
    				yValues: [0],
    				zValues: [/*pZ*/ ctx[8]]
    			},
    			$$inline: true
    		});

    	segments1 = new Segments({
    			props: {
    				xStart: [/*pX*/ ctx[7]],
    				zStart: [0],
    				yStart: [0],
    				xEnd: [/*pX*/ ctx[7]],
    				zEnd: [/*pZ*/ ctx[8]],
    				yEnd: [0],
    				lineColor: "#4466ff60"
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(segments0.$$.fragment);
    			t0 = space();
    			create_component(scatterseries0.$$.fragment);
    			t1 = space();
    			create_component(scatterseries1.$$.fragment);
    			t2 = space();
    			create_component(segments1.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(segments0, target, anchor);
    			insert_dev(target, t0, anchor);
    			mount_component(scatterseries0, target, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(scatterseries1, target, anchor);
    			insert_dev(target, t2, anchor);
    			mount_component(segments1, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(segments0.$$.fragment, local);
    			transition_in(scatterseries0.$$.fragment, local);
    			transition_in(scatterseries1.$$.fragment, local);
    			transition_in(segments1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(segments0.$$.fragment, local);
    			transition_out(scatterseries0.$$.fragment, local);
    			transition_out(scatterseries1.$$.fragment, local);
    			transition_out(segments1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(segments0, detaching);
    			if (detaching) detach_dev(t0);
    			destroy_component(scatterseries0, detaching);
    			if (detaching) detach_dev(t1);
    			destroy_component(scatterseries1, detaching);
    			if (detaching) detach_dev(t2);
    			destroy_component(segments1, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$1.name,
    		type: "slot",
    		source: "(42:3) <Axes limY={[0, 5]} limZ={[0, 5]} {zoom} {phi} {theta}>",
    		ctx
    	});

    	return block;
    }

    // (56:6) 
    function create_xaxis_slot(ctx) {
    	let xaxis;
    	let current;

    	xaxis = new XAxis({
    			props: {
    				showGrid: true,
    				title: "X1",
    				slot: "xaxis"
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(xaxis.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(xaxis, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(xaxis.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(xaxis.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(xaxis, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_xaxis_slot.name,
    		type: "slot",
    		source: "(56:6) ",
    		ctx
    	});

    	return block;
    }

    // (57:6) 
    function create_yaxis_slot(ctx) {
    	let yaxis;
    	let current;

    	yaxis = new YAxis({
    			props: {
    				showGrid: true,
    				title: "Y",
    				slot: "yaxis"
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(yaxis.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(yaxis, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(yaxis.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(yaxis.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(yaxis, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_yaxis_slot.name,
    		type: "slot",
    		source: "(57:6) ",
    		ctx
    	});

    	return block;
    }

    // (58:6) 
    function create_zaxis_slot(ctx) {
    	let zaxis;
    	let current;

    	zaxis = new ZAxis({
    			props: {
    				showGrid: true,
    				title: "X2",
    				slot: "zaxis"
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(zaxis.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(zaxis, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(zaxis.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(zaxis.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(zaxis, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_zaxis_slot.name,
    		type: "slot",
    		source: "(58:6) ",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let div;
    	let axes;
    	let current;

    	axes = new Axes({
    			props: {
    				limY: [0, 5],
    				limZ: [0, 5],
    				zoom: /*zoom*/ ctx[2],
    				phi: /*phi*/ ctx[0],
    				theta: /*theta*/ ctx[1],
    				$$slots: {
    					zaxis: [create_zaxis_slot],
    					yaxis: [create_yaxis_slot],
    					xaxis: [create_xaxis_slot],
    					default: [create_default_slot$1]
    				},
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(axes.$$.fragment);
    			attr_dev(div, "class", "plot-container");
    			add_location(div, file$1, 40, 0, 1337);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(axes, div, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const axes_changes = {};
    			if (dirty & /*zoom*/ 4) axes_changes.zoom = /*zoom*/ ctx[2];
    			if (dirty & /*phi*/ 1) axes_changes.phi = /*phi*/ ctx[0];
    			if (dirty & /*theta*/ 2) axes_changes.theta = /*theta*/ ctx[1];

    			if (dirty & /*$$scope*/ 8192) {
    				axes_changes.$$scope = { dirty, ctx };
    			}

    			axes.$set(axes_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(axes.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(axes.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(axes);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('AppPlot', slots, []);
    	const b = [[1, 0, 0, 0]];
    	const X11 = seq(1, 5);
    	const X12 = [1, 5];
    	const X1Start = [rep(1, X11.length), X11, rep(-5, X11.length), vmult(X11, -5)];
    	const Y1Start = mdot(X1Start, b);
    	const X1End = [rep(1, X11.length), X11, rep(5, X11.length), vmult(X11, 5)];
    	const Y1End = mdot(X1End, b);
    	let pX = 2;
    	let pZ = 2;
    	let pY = mdot([[1], [pX], [pZ], [pX * pZ]], b);
    	let phi = 0;
    	let theta = 0;
    	let zoom = 0.85;

    	document.onkeydown = function (event) {
    		if (event.key == "ArrowLeft") $$invalidate(0, phi = phi - 0.05);
    		if (event.key == "ArrowRight") $$invalidate(0, phi = phi + 0.05);
    		if (event.key == "ArrowUp") $$invalidate(1, theta = theta - 0.01);
    		if (event.key == "ArrowDown") $$invalidate(1, theta = theta + 0.01);
    		if (event.key == "+") $$invalidate(2, zoom = zoom * 1.1);
    		if (event.key == "-") $$invalidate(2, zoom = zoom * 0.9);
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<AppPlot> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		Axes,
    		XAxis,
    		YAxis,
    		ZAxis,
    		Segments,
    		ScatterSeries,
    		expandGrid,
    		rep,
    		seq,
    		mdot,
    		transpose,
    		matrix,
    		vmult,
    		mmult,
    		b,
    		X11,
    		X12,
    		X1Start,
    		Y1Start,
    		X1End,
    		Y1End,
    		pX,
    		pZ,
    		pY,
    		phi,
    		theta,
    		zoom
    	});

    	$$self.$inject_state = $$props => {
    		if ('pX' in $$props) $$invalidate(7, pX = $$props.pX);
    		if ('pZ' in $$props) $$invalidate(8, pZ = $$props.pZ);
    		if ('pY' in $$props) $$invalidate(9, pY = $$props.pY);
    		if ('phi' in $$props) $$invalidate(0, phi = $$props.phi);
    		if ('theta' in $$props) $$invalidate(1, theta = $$props.theta);
    		if ('zoom' in $$props) $$invalidate(2, zoom = $$props.zoom);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [phi, theta, zoom, X1Start, Y1Start, X1End, Y1End, pX, pZ, pY];
    }

    class AppPlot extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "AppPlot",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src/App.svelte generated by Svelte v3.50.1 */

    const file = "src/App.svelte";

    // (31:9) <AppControlArea>
    function create_default_slot_1(ctx) {
    	let appcontrolrange;
    	let updating_value;
    	let current;

    	function appcontrolrange_value_binding(value) {
    		/*appcontrolrange_value_binding*/ ctx[1](value);
    	}

    	let appcontrolrange_props = { id: "b1", label: "b1", min: 0, max: 1 };

    	if (/*b1*/ ctx[0] !== void 0) {
    		appcontrolrange_props.value = /*b1*/ ctx[0];
    	}

    	appcontrolrange = new AppControlRange({
    			props: appcontrolrange_props,
    			$$inline: true
    		});

    	binding_callbacks.push(() => bind(appcontrolrange, 'value', appcontrolrange_value_binding));

    	const block = {
    		c: function create() {
    			create_component(appcontrolrange.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(appcontrolrange, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const appcontrolrange_changes = {};

    			if (!updating_value && dirty & /*b1*/ 1) {
    				updating_value = true;
    				appcontrolrange_changes.value = /*b1*/ ctx[0];
    				add_flush_callback(() => updating_value = false);
    			}

    			appcontrolrange.$set(appcontrolrange_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(appcontrolrange.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(appcontrolrange.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(appcontrolrange, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1.name,
    		type: "slot",
    		source: "(31:9) <AppControlArea>",
    		ctx
    	});

    	return block;
    }

    // (18:0) <StatApp>
    function create_default_slot(ctx) {
    	let div3;
    	let div0;
    	let appplot;
    	let t0;
    	let div1;
    	let t1;
    	let div2;
    	let appcontrolarea;
    	let current;
    	appplot = new AppPlot({ $$inline: true });

    	appcontrolarea = new AppControlArea({
    			props: {
    				$$slots: { default: [create_default_slot_1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div3 = element("div");
    			div0 = element("div");
    			create_component(appplot.$$.fragment);
    			t0 = space();
    			div1 = element("div");
    			t1 = space();
    			div2 = element("div");
    			create_component(appcontrolarea.$$.fragment);
    			attr_dev(div0, "class", "app-plot-area svelte-2flzrm");
    			add_location(div0, file, 20, 6, 572);
    			attr_dev(div1, "class", "app-table-area svelte-2flzrm");
    			add_location(div1, file, 25, 6, 672);
    			attr_dev(div2, "class", "app-controls-area svelte-2flzrm");
    			add_location(div2, file, 28, 6, 721);
    			attr_dev(div3, "class", "app-layout svelte-2flzrm");
    			add_location(div3, file, 18, 3, 540);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div3, anchor);
    			append_dev(div3, div0);
    			mount_component(appplot, div0, null);
    			append_dev(div3, t0);
    			append_dev(div3, div1);
    			append_dev(div3, t1);
    			append_dev(div3, div2);
    			mount_component(appcontrolarea, div2, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const appcontrolarea_changes = {};

    			if (dirty & /*$$scope, b1*/ 5) {
    				appcontrolarea_changes.$$scope = { dirty, ctx };
    			}

    			appcontrolarea.$set(appcontrolarea_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(appplot.$$.fragment, local);
    			transition_in(appcontrolarea.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(appplot.$$.fragment, local);
    			transition_out(appcontrolarea.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);
    			destroy_component(appplot);
    			destroy_component(appcontrolarea);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(18:0) <StatApp>",
    		ctx
    	});

    	return block;
    }

    // (40:3) 
    function create_help_slot(ctx) {
    	let div;
    	let h2;
    	let t1;
    	let p;

    	const block = {
    		c: function create() {
    			div = element("div");
    			h2 = element("h2");
    			h2.textContent = "Multiple linear regression model";
    			t1 = space();
    			p = element("p");
    			add_location(h2, file, 40, 6, 1017);
    			add_location(p, file, 41, 6, 1065);
    			attr_dev(div, "slot", "help");
    			add_location(div, file, 39, 3, 993);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, h2);
    			append_dev(div, t1);
    			append_dev(div, p);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_help_slot.name,
    		type: "slot",
    		source: "(40:3) ",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let statapp;
    	let current;

    	statapp = new StatApp({
    			props: {
    				$$slots: {
    					help: [create_help_slot],
    					default: [create_default_slot]
    				},
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(statapp.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(statapp, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const statapp_changes = {};

    			if (dirty & /*$$scope, b1*/ 5) {
    				statapp_changes.$$scope = { dirty, ctx };
    			}

    			statapp.$set(statapp_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(statapp.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(statapp.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(statapp, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	let b1 = 0;
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	function appcontrolrange_value_binding(value) {
    		b1 = value;
    		$$invalidate(0, b1);
    	}

    	$$self.$capture_state = () => ({
    		StatApp,
    		AppControlArea,
    		AppControlButton,
    		AppControlSwitch,
    		AppPlot,
    		b1
    	});

    	$$self.$inject_state = $$props => {
    		if ('b1' in $$props) $$invalidate(0, b1 = $$props.b1);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [b1, appcontrolrange_value_binding];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
    	target: document.getElementById("graasta-app-container"),
    });

    return app;

})();
//# sourceMappingURL=asta-b308.js.map
