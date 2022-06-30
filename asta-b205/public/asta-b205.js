
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
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.48.0' }, detail), { bubbles: true }));
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

    /**********************************************
     * Functions for statistical tests and models *
     **********************************************/


    /**
     * Finds smallest value in a vector
     * @param {number[]} x - vector with values
     * @returns {number}
     */
    function min$1(x) {
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
    function max$1(x) {
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
     * Computes difference between all adjacent values in a vector
     * @param {number[]} x - vector with values
     * @returns {number[]} vector with the differences
     */
    function diff(x) {
       return x.slice(1).map( (y, i) => (y - x[i]));
    }



    /***********************************************
     * Functions for theoretical distribution      *
     ***********************************************/


    /**
     * Generates 'n' random numbers from a uniform distribution
     * @param {number} n - amount of numbers to generate
     * @param {number} a - smallest value (min) of the population
     * @param {number} b - largest value (max) of the population
     * @returns {number[]} vector with generated numbers
     */
    function runif(n, a = 0, b = 1) {
       let out = Array(n);
       for (let i = 0; i < n; i++) out[i] = (a + Math.random() * (b - a));
       return out;
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

       if (max$1(indices) > x.length || min$1(indices) < 1) {
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

    /* ../shared/StatApp.svelte generated by Svelte v3.48.0 */

    const file$9 = "../shared/StatApp.svelte";
    const get_help_slot_changes = dirty => ({});
    const get_help_slot_context = ctx => ({});

    // (20:3) {#if showHelp}
    function create_if_block$7(ctx) {
    	let div;
    	let current;
    	const help_slot_template = /*#slots*/ ctx[3].help;
    	const help_slot = create_slot(help_slot_template, ctx, /*$$scope*/ ctx[2], get_help_slot_context);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (help_slot) help_slot.c();
    			attr_dev(div, "class", "helptext svelte-zlnjf7");
    			add_location(div, file$9, 20, 3, 381);
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
    		id: create_if_block$7.name,
    		type: "if",
    		source: "(20:3) {#if showHelp}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$e(ctx) {
    	let main;
    	let div;
    	let t;
    	let current;
    	let mounted;
    	let dispose;
    	const default_slot_template = /*#slots*/ ctx[3].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[2], null);
    	let if_block = /*showHelp*/ ctx[0] && create_if_block$7(ctx);

    	const block = {
    		c: function create() {
    			main = element("main");
    			div = element("div");
    			if (default_slot) default_slot.c();
    			t = space();
    			if (if_block) if_block.c();
    			attr_dev(div, "class", "content svelte-zlnjf7");
    			add_location(div, file$9, 15, 3, 307);
    			attr_dev(main, "class", "graasta-app svelte-zlnjf7");
    			add_location(main, file$9, 13, 0, 276);
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
    					if_block = create_if_block$7(ctx);
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
    		id: create_fragment$e.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$e($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$e, create_fragment$e, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "StatApp",
    			options,
    			id: create_fragment$e.name
    		});
    	}
    }

    /* ../shared/controls/AppControlArea.svelte generated by Svelte v3.48.0 */

    const file$8 = "../shared/controls/AppControlArea.svelte";

    // (7:3) {#if errormsg}
    function create_if_block$6(ctx) {
    	let div;
    	let t;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t = text(/*errormsg*/ ctx[0]);
    			attr_dev(div, "class", "app-control-error svelte-8w06qs");
    			add_location(div, file$8, 6, 17, 126);
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
    		id: create_if_block$6.name,
    		type: "if",
    		source: "(7:3) {#if errormsg}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$d(ctx) {
    	let fieldset;
    	let t;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[2].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[1], null);
    	let if_block = /*errormsg*/ ctx[0] && create_if_block$6(ctx);

    	const block = {
    		c: function create() {
    			fieldset = element("fieldset");
    			if (default_slot) default_slot.c();
    			t = space();
    			if (if_block) if_block.c();
    			attr_dev(fieldset, "class", "app-control-area svelte-8w06qs");
    			add_location(fieldset, file$8, 4, 0, 56);
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
    					if_block = create_if_block$6(ctx);
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
    		id: create_fragment$d.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$d($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$d, create_fragment$d, safe_not_equal, { errormsg: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "AppControlArea",
    			options,
    			id: create_fragment$d.name
    		});
    	}

    	get errormsg() {
    		throw new Error("<AppControlArea>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set errormsg(value) {
    		throw new Error("<AppControlArea>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* ../shared/controls/AppControl.svelte generated by Svelte v3.48.0 */

    const file$7 = "../shared/controls/AppControl.svelte";

    function create_fragment$c(ctx) {
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
    			add_location(div0, file$7, 8, 3, 176);
    			attr_dev(label_1, "for", /*id*/ ctx[0]);
    			attr_dev(label_1, "class", "svelte-1u3qye");
    			add_location(label_1, file$7, 9, 3, 206);
    			attr_dev(div1, "class", "app-control svelte-1u3qye");
    			toggle_class(div1, "hidden", /*hidden*/ ctx[3]);
    			toggle_class(div1, "disable", /*disable*/ ctx[2]);
    			add_location(div1, file$7, 7, 0, 120);
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

    			if (dirty & /*hidden*/ 8) {
    				toggle_class(div1, "hidden", /*hidden*/ ctx[3]);
    			}

    			if (dirty & /*disable*/ 4) {
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
    		id: create_fragment$c.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$c($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$c, create_fragment$c, safe_not_equal, { id: 0, label: 1, disable: 2, hidden: 3 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "AppControl",
    			options,
    			id: create_fragment$c.name
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

    /* ../shared/controls/AppControlButton.svelte generated by Svelte v3.48.0 */
    const file$6 = "../shared/controls/AppControlButton.svelte";

    // (12:0) <AppControl id={id} label={label} {disable} {hidden}>
    function create_default_slot$4(ctx) {
    	let button;
    	let t;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			t = text(/*text*/ ctx[2]);
    			attr_dev(button, "class", "svelte-16fv6fd");
    			add_location(button, file$6, 12, 3, 248);
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
    		id: create_default_slot$4.name,
    		type: "slot",
    		source: "(12:0) <AppControl id={id} label={label} {disable} {hidden}>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$b(ctx) {
    	let appcontrol;
    	let current;

    	appcontrol = new AppControl({
    			props: {
    				id: /*id*/ ctx[0],
    				label: /*label*/ ctx[1],
    				disable: /*disable*/ ctx[3],
    				hidden: /*hidden*/ ctx[4],
    				$$slots: { default: [create_default_slot$4] },
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
    		id: create_fragment$b.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$b($$self, $$props, $$invalidate) {
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

    		init(this, options, instance$b, create_fragment$b, safe_not_equal, {
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
    			id: create_fragment$b.name
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

    /* ../shared/controls/AppControlSwitch.svelte generated by Svelte v3.48.0 */
    const file$5 = "../shared/controls/AppControlSwitch.svelte";

    function get_each_context$4(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[8] = list[i];
    	return child_ctx;
    }

    // (16:6) {#each options as option (option)}
    function create_each_block$4(key_1, ctx) {
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
    			add_location(div, file$5, 16, 6, 392);
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
    		id: create_each_block$4.name,
    		type: "each",
    		source: "(16:6) {#each options as option (option)}",
    		ctx
    	});

    	return block;
    }

    // (13:0) <AppControl {id} {label} {disable} {hidden} >
    function create_default_slot$3(ctx) {
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
    	validate_each_keys(ctx, each_value, get_each_context$4, get_key);

    	for (let i = 0; i < each_value.length; i += 1) {
    		let child_ctx = get_each_context$4(ctx, each_value, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block$4(key, child_ctx));
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
    			add_location(div, file$5, 14, 3, 322);
    			attr_dev(input, "name", /*id*/ ctx[1]);
    			attr_dev(input, "class", "svelte-yqpg3s");
    			add_location(input, file$5, 20, 3, 518);
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
    				validate_each_keys(ctx, each_value, get_each_context$4, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each_1_lookup, div, destroy_block, create_each_block$4, null, get_each_context$4);
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
    		id: create_default_slot$3.name,
    		type: "slot",
    		source: "(13:0) <AppControl {id} {label} {disable} {hidden} >",
    		ctx
    	});

    	return block;
    }

    function create_fragment$a(ctx) {
    	let appcontrol;
    	let current;

    	appcontrol = new AppControl({
    			props: {
    				id: /*id*/ ctx[1],
    				label: /*label*/ ctx[2],
    				disable: /*disable*/ ctx[4],
    				hidden: /*hidden*/ ctx[5],
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
    		id: create_fragment$a.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$a($$self, $$props, $$invalidate) {
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

    		init(this, options, instance$a, create_fragment$a, safe_not_equal, {
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
    			id: create_fragment$a.name
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

    /* ../shared/tables/DataTableValues.svelte generated by Svelte v3.48.0 */

    const file$4 = "../shared/tables/DataTableValues.svelte";

    function get_each_context_1$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[2] = list[i];
    	return child_ctx;
    }

    function get_each_context$3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[2] = list[i];
    	return child_ctx;
    }

    // (10:0) {:else}
    function create_else_block$1(ctx) {
    	let each_1_anchor;
    	let each_value_1 = /*values*/ ctx[0];
    	validate_each_argument(each_value_1);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1$1(get_each_context_1$1(ctx, each_value_1, i));
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
    			if (dirty & /*values*/ 1) {
    				each_value_1 = /*values*/ ctx[0];
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1$1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_1$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_1.length;
    			}
    		},
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(10:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (6:0) {#if decNum >= 0}
    function create_if_block$5(ctx) {
    	let each_1_anchor;
    	let each_value = /*values*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$3(get_each_context$3(ctx, each_value, i));
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
    			if (dirty & /*isNaN, values, decNum*/ 3) {
    				each_value = /*values*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$3(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$3(child_ctx);
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
    		id: create_if_block$5.name,
    		type: "if",
    		source: "(6:0) {#if decNum >= 0}",
    		ctx
    	});

    	return block;
    }

    // (11:3) {#each values as value}
    function create_each_block_1$1(ctx) {
    	let td;
    	let raw_value = /*value*/ ctx[2] + "";

    	const block = {
    		c: function create() {
    			td = element("td");
    			attr_dev(td, "class", "datatable__value datatable__value_text svelte-1m7xmmh");
    			add_location(td, file$4, 11, 3, 263);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, td, anchor);
    			td.innerHTML = raw_value;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*values*/ 1 && raw_value !== (raw_value = /*value*/ ctx[2] + "")) td.innerHTML = raw_value;		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(td);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1$1.name,
    		type: "each",
    		source: "(11:3) {#each values as value}",
    		ctx
    	});

    	return block;
    }

    // (7:3) {#each values as value}
    function create_each_block$3(ctx) {
    	let td;

    	let t_value = (isNaN(/*value*/ ctx[2])
    	? ""
    	: /*value*/ ctx[2].toFixed(/*decNum*/ ctx[1])) + "";

    	let t;

    	const block = {
    		c: function create() {
    			td = element("td");
    			t = text(t_value);
    			attr_dev(td, "class", "datatable__value datatable__value_number svelte-1m7xmmh");
    			add_location(td, file$4, 7, 3, 112);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, td, anchor);
    			append_dev(td, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*values, decNum*/ 3 && t_value !== (t_value = (isNaN(/*value*/ ctx[2])
    			? ""
    			: /*value*/ ctx[2].toFixed(/*decNum*/ ctx[1])) + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(td);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$3.name,
    		type: "each",
    		source: "(7:3) {#each values as value}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$9(ctx) {
    	let if_block_anchor;

    	function select_block_type(ctx, dirty) {
    		if (/*decNum*/ ctx[1] >= 0) return create_if_block$5;
    		return create_else_block$1;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if_block.d(detaching);
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
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('DataTableValues', slots, []);
    	let { values } = $$props;
    	let { decNum } = $$props;
    	const writable_props = ['values', 'decNum'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<DataTableValues> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('values' in $$props) $$invalidate(0, values = $$props.values);
    		if ('decNum' in $$props) $$invalidate(1, decNum = $$props.decNum);
    	};

    	$$self.$capture_state = () => ({ values, decNum });

    	$$self.$inject_state = $$props => {
    		if ('values' in $$props) $$invalidate(0, values = $$props.values);
    		if ('decNum' in $$props) $$invalidate(1, decNum = $$props.decNum);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [values, decNum];
    }

    class DataTableValues extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$9, create_fragment$9, safe_not_equal, { values: 0, decNum: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "DataTableValues",
    			options,
    			id: create_fragment$9.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*values*/ ctx[0] === undefined && !('values' in props)) {
    			console.warn("<DataTableValues> was created without expected prop 'values'");
    		}

    		if (/*decNum*/ ctx[1] === undefined && !('decNum' in props)) {
    			console.warn("<DataTableValues> was created without expected prop 'decNum'");
    		}
    	}

    	get values() {
    		throw new Error("<DataTableValues>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set values(value) {
    		throw new Error("<DataTableValues>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get decNum() {
    		throw new Error("<DataTableValues>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set decNum(value) {
    		throw new Error("<DataTableValues>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* ../shared/tables/DataTable.svelte generated by Svelte v3.48.0 */
    const file$3 = "../shared/tables/DataTable.svelte";

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[8] = list[i];
    	child_ctx[10] = i;
    	return child_ctx;
    }

    function get_each_context_2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[4] = list[i].label;
    	child_ctx[5] = list[i].values;
    	child_ctx[7] = i;
    	return child_ctx;
    }

    function get_each_context_3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[4] = list[i].label;
    	child_ctx[5] = list[i].values;
    	return child_ctx;
    }

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[4] = list[i].label;
    	child_ctx[5] = list[i].values;
    	child_ctx[7] = i;
    	return child_ctx;
    }

    // (25:0) {:else}
    function create_else_block(ctx) {
    	let tr;
    	let t;
    	let each1_anchor;
    	let current;
    	let each_value_3 = /*variables*/ ctx[0];
    	validate_each_argument(each_value_3);
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_3.length; i += 1) {
    		each_blocks_1[i] = create_each_block_3(get_each_context_3(ctx, each_value_3, i));
    	}

    	let each_value_1 = /*variables*/ ctx[0][0].values;
    	validate_each_argument(each_value_1);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			tr = element("tr");

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each1_anchor = empty();
    			attr_dev(tr, "class", "datatable__row");
    			add_location(tr, file$3, 25, 3, 740);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, tr, anchor);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(tr, null);
    			}

    			insert_dev(target, t, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each1_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*variables*/ 1) {
    				each_value_3 = /*variables*/ ctx[0];
    				validate_each_argument(each_value_3);
    				let i;

    				for (i = 0; i < each_value_3.length; i += 1) {
    					const child_ctx = get_each_context_3(ctx, each_value_3, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_1[i] = create_each_block_3(child_ctx);
    						each_blocks_1[i].c();
    						each_blocks_1[i].m(tr, null);
    					}
    				}

    				for (; i < each_blocks_1.length; i += 1) {
    					each_blocks_1[i].d(1);
    				}

    				each_blocks_1.length = each_value_3.length;
    			}

    			if (dirty & /*variables, decNum*/ 5) {
    				each_value_1 = /*variables*/ ctx[0][0].values;
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block_1(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(each1_anchor.parentNode, each1_anchor);
    					}
    				}

    				group_outros();

    				for (i = each_value_1.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value_1.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(tr);
    			destroy_each(each_blocks_1, detaching);
    			if (detaching) detach_dev(t);
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(25:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (18:0) {#if horizontal }
    function create_if_block$4(ctx) {
    	let each_1_anchor;
    	let current;
    	let each_value = /*variables*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

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
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*variables, decNum*/ 5) {
    				each_value = /*variables*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$2(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$2(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$4.name,
    		type: "if",
    		source: "(18:0) {#if horizontal }",
    		ctx
    	});

    	return block;
    }

    // (27:6) {#each variables as {label, values}}
    function create_each_block_3(ctx) {
    	let td;
    	let raw_value = /*label*/ ctx[4] + "";

    	const block = {
    		c: function create() {
    			td = element("td");
    			attr_dev(td, "class", "datatable__label svelte-1r68t2h");
    			add_location(td, file$3, 27, 6, 817);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, td, anchor);
    			td.innerHTML = raw_value;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*variables*/ 1 && raw_value !== (raw_value = /*label*/ ctx[4] + "")) td.innerHTML = raw_value;		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(td);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_3.name,
    		type: "each",
    		source: "(27:6) {#each variables as {label, values}}",
    		ctx
    	});

    	return block;
    }

    // (33:6) {#each variables as {label, values}
    function create_each_block_2(ctx) {
    	let datatablevalues;
    	let current;

    	datatablevalues = new DataTableValues({
    			props: {
    				values: [/*values*/ ctx[5][/*j*/ ctx[10]]],
    				decNum: /*decNum*/ ctx[2][/*i*/ ctx[7]]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(datatablevalues.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(datatablevalues, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const datatablevalues_changes = {};
    			if (dirty & /*variables*/ 1) datatablevalues_changes.values = [/*values*/ ctx[5][/*j*/ ctx[10]]];
    			if (dirty & /*decNum*/ 4) datatablevalues_changes.decNum = /*decNum*/ ctx[2][/*i*/ ctx[7]];
    			datatablevalues.$set(datatablevalues_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(datatablevalues.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(datatablevalues.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(datatablevalues, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_2.name,
    		type: "each",
    		source: "(33:6) {#each variables as {label, values}",
    		ctx
    	});

    	return block;
    }

    // (31:3) {#each variables[0].values as value, j}
    function create_each_block_1(ctx) {
    	let tr;
    	let t;
    	let current;
    	let each_value_2 = /*variables*/ ctx[0];
    	validate_each_argument(each_value_2);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_2.length; i += 1) {
    		each_blocks[i] = create_each_block_2(get_each_context_2(ctx, each_value_2, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			tr = element("tr");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t = space();
    			attr_dev(tr, "class", "datatable__row");
    			add_location(tr, file$3, 31, 3, 934);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, tr, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(tr, null);
    			}

    			append_dev(tr, t);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*variables, decNum*/ 5) {
    				each_value_2 = /*variables*/ ctx[0];
    				validate_each_argument(each_value_2);
    				let i;

    				for (i = 0; i < each_value_2.length; i += 1) {
    					const child_ctx = get_each_context_2(ctx, each_value_2, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block_2(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(tr, t);
    					}
    				}

    				group_outros();

    				for (i = each_value_2.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value_2.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(tr);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(31:3) {#each variables[0].values as value, j}",
    		ctx
    	});

    	return block;
    }

    // (19:3) {#each variables as {label, values}
    function create_each_block$2(ctx) {
    	let tr;
    	let td;
    	let raw_value = /*label*/ ctx[4] + "";
    	let t0;
    	let datatablevalues;
    	let t1;
    	let current;

    	datatablevalues = new DataTableValues({
    			props: {
    				values: /*values*/ ctx[5],
    				decNum: /*decNum*/ ctx[2][/*i*/ ctx[7]]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			tr = element("tr");
    			td = element("td");
    			t0 = space();
    			create_component(datatablevalues.$$.fragment);
    			t1 = space();
    			attr_dev(td, "class", "datatable__label svelte-1r68t2h");
    			add_location(td, file$3, 20, 6, 607);
    			attr_dev(tr, "class", "datatable__row");
    			add_location(tr, file$3, 19, 3, 573);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, tr, anchor);
    			append_dev(tr, td);
    			td.innerHTML = raw_value;
    			append_dev(tr, t0);
    			mount_component(datatablevalues, tr, null);
    			append_dev(tr, t1);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if ((!current || dirty & /*variables*/ 1) && raw_value !== (raw_value = /*label*/ ctx[4] + "")) td.innerHTML = raw_value;			const datatablevalues_changes = {};
    			if (dirty & /*variables*/ 1) datatablevalues_changes.values = /*values*/ ctx[5];
    			if (dirty & /*decNum*/ 4) datatablevalues_changes.decNum = /*decNum*/ ctx[2][/*i*/ ctx[7]];
    			datatablevalues.$set(datatablevalues_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(datatablevalues.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(datatablevalues.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(tr);
    			destroy_component(datatablevalues);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$2.name,
    		type: "each",
    		source: "(19:3) {#each variables as {label, values}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$8(ctx) {
    	let table;
    	let current_block_type_index;
    	let if_block;
    	let current;
    	const if_block_creators = [create_if_block$4, create_else_block];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*horizontal*/ ctx[1]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			table = element("table");
    			if_block.c();
    			attr_dev(table, "class", "datatable svelte-1r68t2h");
    			add_location(table, file$3, 15, 0, 482);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, table, anchor);
    			if_blocks[current_block_type_index].m(table, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(table, null);
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
    			if (detaching) detach_dev(table);
    			if_blocks[current_block_type_index].d();
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
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('DataTable', slots, []);
    	let { variables = [] } = $$props;
    	let { horizontal = false } = $$props;
    	let { decNum = undefined } = $$props;

    	const getDecimalsNum = x => {
    		const dec = Math.log10(min$1(diff(x).map(v => Math.abs(v))));
    		return Math.abs(dec < 0 ? Math.floor(dec) : Math.ceil(dec));
    	};

    	const writable_props = ['variables', 'horizontal', 'decNum'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<DataTable> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('variables' in $$props) $$invalidate(0, variables = $$props.variables);
    		if ('horizontal' in $$props) $$invalidate(1, horizontal = $$props.horizontal);
    		if ('decNum' in $$props) $$invalidate(2, decNum = $$props.decNum);
    	};

    	$$self.$capture_state = () => ({
    		min: min$1,
    		diff,
    		DataTableValues,
    		variables,
    		horizontal,
    		decNum,
    		getDecimalsNum
    	});

    	$$self.$inject_state = $$props => {
    		if ('variables' in $$props) $$invalidate(0, variables = $$props.variables);
    		if ('horizontal' in $$props) $$invalidate(1, horizontal = $$props.horizontal);
    		if ('decNum' in $$props) $$invalidate(2, decNum = $$props.decNum);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*decNum, variables*/ 5) {
    			decNum === undefined
    			? variables.map(v => getDecimalsNum(v.values))
    			: decNum;
    		}
    	};

    	return [variables, horizontal, decNum];
    }

    class DataTable extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, { variables: 0, horizontal: 1, decNum: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "DataTable",
    			options,
    			id: create_fragment$8.name
    		});
    	}

    	get variables() {
    		throw new Error("<DataTable>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set variables(value) {
    		throw new Error("<DataTable>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get horizontal() {
    		throw new Error("<DataTable>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set horizontal(value) {
    		throw new Error("<DataTable>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get decNum() {
    		throw new Error("<DataTable>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set decNum(value) {
    		throw new Error("<DataTable>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
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

    /* ../node_modules/svelte-plots-basic/src/Axes.svelte generated by Svelte v3.48.0 */
    const file$2 = "../node_modules/svelte-plots-basic/src/Axes.svelte";
    const get_box_slot_changes = dirty => ({});
    const get_box_slot_context = ctx => ({});
    const get_yaxis_slot_changes = dirty => ({});
    const get_yaxis_slot_context = ctx => ({});
    const get_xaxis_slot_changes = dirty => ({});
    const get_xaxis_slot_context = ctx => ({});

    // (338:3) {#if title !== ""}
    function create_if_block_3(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", "axes__title");
    			add_location(div, file$2, 337, 21, 12836);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			div.innerHTML = /*title*/ ctx[0];
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*title*/ 1) div.innerHTML = /*title*/ ctx[0];		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(338:3) {#if title !== \\\"\\\"}",
    		ctx
    	});

    	return block;
    }

    // (339:3) {#if yLabel !== ""}
    function create_if_block_2(ctx) {
    	let div;
    	let span;

    	const block = {
    		c: function create() {
    			div = element("div");
    			span = element("span");
    			add_location(span, file$2, 338, 48, 12934);
    			attr_dev(div, "class", "axes__ylabel");
    			add_location(div, file$2, 338, 22, 12908);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, span);
    			span.innerHTML = /*yLabel*/ ctx[2];
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*yLabel*/ 4) span.innerHTML = /*yLabel*/ ctx[2];		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(339:3) {#if yLabel !== \\\"\\\"}",
    		ctx
    	});

    	return block;
    }

    // (340:3) {#if xLabel !== ""}
    function create_if_block_1$1(ctx) {
    	let div;
    	let span;

    	const block = {
    		c: function create() {
    			div = element("div");
    			span = element("span");
    			add_location(span, file$2, 339, 48, 13021);
    			attr_dev(div, "class", "axes__xlabel");
    			add_location(div, file$2, 339, 22, 12995);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, span);
    			span.innerHTML = /*xLabel*/ ctx[1];
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*xLabel*/ 2) span.innerHTML = /*xLabel*/ ctx[1];		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(340:3) {#if xLabel !== \\\"\\\"}",
    		ctx
    	});

    	return block;
    }

    // (368:3) {#if !$isOk}
    function create_if_block$3(ctx) {
    	let p;
    	let t0;
    	let br;
    	let t1;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t0 = text("Axes component was not properly initialized. ");
    			br = element("br");
    			t1 = text("\n      Add plot series (check that coordinates are numeric) or define axes limits manually.");
    			add_location(br, file$2, 369, 51, 13916);
    			attr_dev(p, "class", "message_error");
    			add_location(p, file$2, 368, 3, 13839);
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
    		id: create_if_block$3.name,
    		type: "if",
    		source: "(368:3) {#if !$isOk}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$7(ctx) {
    	let div1;
    	let t0;
    	let t1;
    	let t2;
    	let div0;
    	let svg;
    	let defs;
    	let clipPath;
    	let rect;
    	let rect_x_value;
    	let rect_y_value;
    	let rect_width_value;
    	let rect_height_value;
    	let g;
    	let t3;
    	let div1_class_value;
    	let current;
    	let mounted;
    	let dispose;
    	let if_block0 = /*title*/ ctx[0] !== "" && create_if_block_3(ctx);
    	let if_block1 = /*yLabel*/ ctx[2] !== "" && create_if_block_2(ctx);
    	let if_block2 = /*xLabel*/ ctx[1] !== "" && create_if_block_1$1(ctx);
    	const xaxis_slot_template = /*#slots*/ ctx[26].xaxis;
    	const xaxis_slot = create_slot(xaxis_slot_template, ctx, /*$$scope*/ ctx[25], get_xaxis_slot_context);
    	const yaxis_slot_template = /*#slots*/ ctx[26].yaxis;
    	const yaxis_slot = create_slot(yaxis_slot_template, ctx, /*$$scope*/ ctx[25], get_yaxis_slot_context);
    	const default_slot_template = /*#slots*/ ctx[26].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[25], null);
    	const box_slot_template = /*#slots*/ ctx[26].box;
    	const box_slot = create_slot(box_slot_template, ctx, /*$$scope*/ ctx[25], get_box_slot_context);
    	let if_block3 = !/*$isOk*/ ctx[3] && create_if_block$3(ctx);

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			if (if_block0) if_block0.c();
    			t0 = space();
    			if (if_block1) if_block1.c();
    			t1 = space();
    			if (if_block2) if_block2.c();
    			t2 = space();
    			div0 = element("div");
    			svg = svg_element("svg");
    			defs = svg_element("defs");
    			clipPath = svg_element("clipPath");
    			rect = svg_element("rect");
    			if (xaxis_slot) xaxis_slot.c();
    			if (yaxis_slot) yaxis_slot.c();
    			g = svg_element("g");
    			if (default_slot) default_slot.c();
    			if (box_slot) box_slot.c();
    			t3 = space();
    			if (if_block3) if_block3.c();
    			set_style(rect, "pointer-events", "none");
    			attr_dev(rect, "x", rect_x_value = /*cpx*/ ctx[7][0]);
    			attr_dev(rect, "y", rect_y_value = /*cpy*/ ctx[6][1]);
    			attr_dev(rect, "width", rect_width_value = /*cpx*/ ctx[7][1] - /*cpx*/ ctx[7][0]);
    			attr_dev(rect, "height", rect_height_value = /*cpy*/ ctx[6][0] - /*cpy*/ ctx[6][1]);
    			add_location(rect, file$2, 348, 15, 13340);
    			attr_dev(clipPath, "id", /*clipPathID*/ ctx[8]);
    			add_location(clipPath, file$2, 347, 12, 13296);
    			add_location(defs, file$2, 346, 9, 13277);
    			attr_dev(g, "clip-path", "url(#" + /*clipPathID*/ ctx[8] + ")");
    			add_location(g, file$2, 357, 9, 13654);
    			attr_dev(svg, "preserveAspectRatio", "none");
    			attr_dev(svg, "class", "axes");
    			add_location(svg, file$2, 343, 6, 13159);
    			attr_dev(div0, "class", "axes-wrapper svelte-n80kcc");
    			add_location(div0, file$2, 342, 3, 13101);
    			attr_dev(div1, "class", div1_class_value = "plot " + ('plot_' + /*$scale*/ ctx[4]) + " svelte-n80kcc");
    			toggle_class(div1, "plot_error", !/*$isOk*/ ctx[3]);
    			add_location(div1, file$2, 334, 0, 12708);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			if (if_block0) if_block0.m(div1, null);
    			append_dev(div1, t0);
    			if (if_block1) if_block1.m(div1, null);
    			append_dev(div1, t1);
    			if (if_block2) if_block2.m(div1, null);
    			append_dev(div1, t2);
    			append_dev(div1, div0);
    			append_dev(div0, svg);
    			append_dev(svg, defs);
    			append_dev(defs, clipPath);
    			append_dev(clipPath, rect);

    			if (xaxis_slot) {
    				xaxis_slot.m(svg, null);
    			}

    			if (yaxis_slot) {
    				yaxis_slot.m(svg, null);
    			}

    			append_dev(svg, g);

    			if (default_slot) {
    				default_slot.m(g, null);
    			}

    			if (box_slot) {
    				box_slot.m(svg, null);
    			}

    			/*div0_binding*/ ctx[27](div0);
    			append_dev(div1, t3);
    			if (if_block3) if_block3.m(div1, null);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(svg, "click", /*handleClick*/ ctx[15], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (/*title*/ ctx[0] !== "") {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_3(ctx);
    					if_block0.c();
    					if_block0.m(div1, t0);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (/*yLabel*/ ctx[2] !== "") {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block_2(ctx);
    					if_block1.c();
    					if_block1.m(div1, t1);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

    			if (/*xLabel*/ ctx[1] !== "") {
    				if (if_block2) {
    					if_block2.p(ctx, dirty);
    				} else {
    					if_block2 = create_if_block_1$1(ctx);
    					if_block2.c();
    					if_block2.m(div1, t2);
    				}
    			} else if (if_block2) {
    				if_block2.d(1);
    				if_block2 = null;
    			}

    			if (!current || dirty[0] & /*cpx*/ 128 && rect_x_value !== (rect_x_value = /*cpx*/ ctx[7][0])) {
    				attr_dev(rect, "x", rect_x_value);
    			}

    			if (!current || dirty[0] & /*cpy*/ 64 && rect_y_value !== (rect_y_value = /*cpy*/ ctx[6][1])) {
    				attr_dev(rect, "y", rect_y_value);
    			}

    			if (!current || dirty[0] & /*cpx*/ 128 && rect_width_value !== (rect_width_value = /*cpx*/ ctx[7][1] - /*cpx*/ ctx[7][0])) {
    				attr_dev(rect, "width", rect_width_value);
    			}

    			if (!current || dirty[0] & /*cpy*/ 64 && rect_height_value !== (rect_height_value = /*cpy*/ ctx[6][0] - /*cpy*/ ctx[6][1])) {
    				attr_dev(rect, "height", rect_height_value);
    			}

    			if (xaxis_slot) {
    				if (xaxis_slot.p && (!current || dirty[0] & /*$$scope*/ 33554432)) {
    					update_slot_base(
    						xaxis_slot,
    						xaxis_slot_template,
    						ctx,
    						/*$$scope*/ ctx[25],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[25])
    						: get_slot_changes(xaxis_slot_template, /*$$scope*/ ctx[25], dirty, get_xaxis_slot_changes),
    						get_xaxis_slot_context
    					);
    				}
    			}

    			if (yaxis_slot) {
    				if (yaxis_slot.p && (!current || dirty[0] & /*$$scope*/ 33554432)) {
    					update_slot_base(
    						yaxis_slot,
    						yaxis_slot_template,
    						ctx,
    						/*$$scope*/ ctx[25],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[25])
    						: get_slot_changes(yaxis_slot_template, /*$$scope*/ ctx[25], dirty, get_yaxis_slot_changes),
    						get_yaxis_slot_context
    					);
    				}
    			}

    			if (default_slot) {
    				if (default_slot.p && (!current || dirty[0] & /*$$scope*/ 33554432)) {
    					update_slot_base(
    						default_slot,
    						default_slot_template,
    						ctx,
    						/*$$scope*/ ctx[25],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[25])
    						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[25], dirty, null),
    						null
    					);
    				}
    			}

    			if (box_slot) {
    				if (box_slot.p && (!current || dirty[0] & /*$$scope*/ 33554432)) {
    					update_slot_base(
    						box_slot,
    						box_slot_template,
    						ctx,
    						/*$$scope*/ ctx[25],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[25])
    						: get_slot_changes(box_slot_template, /*$$scope*/ ctx[25], dirty, get_box_slot_changes),
    						get_box_slot_context
    					);
    				}
    			}

    			if (!/*$isOk*/ ctx[3]) {
    				if (if_block3) ; else {
    					if_block3 = create_if_block$3(ctx);
    					if_block3.c();
    					if_block3.m(div1, null);
    				}
    			} else if (if_block3) {
    				if_block3.d(1);
    				if_block3 = null;
    			}

    			if (!current || dirty[0] & /*$scale*/ 16 && div1_class_value !== (div1_class_value = "plot " + ('plot_' + /*$scale*/ ctx[4]) + " svelte-n80kcc")) {
    				attr_dev(div1, "class", div1_class_value);
    			}

    			if (dirty[0] & /*$scale, $isOk*/ 24) {
    				toggle_class(div1, "plot_error", !/*$isOk*/ ctx[3]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(xaxis_slot, local);
    			transition_in(yaxis_slot, local);
    			transition_in(default_slot, local);
    			transition_in(box_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(xaxis_slot, local);
    			transition_out(yaxis_slot, local);
    			transition_out(default_slot, local);
    			transition_out(box_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			if (if_block2) if_block2.d();
    			if (xaxis_slot) xaxis_slot.d(detaching);
    			if (yaxis_slot) yaxis_slot.d(detaching);
    			if (default_slot) default_slot.d(detaching);
    			if (box_slot) box_slot.d(detaching);
    			/*div0_binding*/ ctx[27](null);
    			if (if_block3) if_block3.d();
    			mounted = false;
    			dispose();
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

    function niceNum(localRange, round) {
    	const exponent = Math.floor(Math.log10(localRange));
    	const fraction = localRange / Math.pow(10, exponent);
    	let niceFraction;

    	if (round) {
    		if (fraction < 1.5) niceFraction = 1; else if (fraction < 3) niceFraction = 2; else if (fraction < 7) niceFraction = 5; else niceFraction = 10;
    	} else {
    		if (fraction <= 1) niceFraction = 1; else if (fraction <= 2) niceFraction = 2; else if (fraction <= 5) niceFraction = 5; else niceFraction = 10;
    	}

    	return niceFraction * Math.pow(10, exponent);
    }

    /** Computes a scale level
     * @param {numeric} width - width of plotting area in pixels
     * @param {numeric} height - height of plotting area in pixels
     * @returns {text} the scale level ("small", "medium" or "large")
     */
    function getScale(width, height) {
    	if (height < 300.2 || width < 300.2) return "small";
    	if (height < 600.2 || width < 600.2) return "medium";
    	return "large";
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let margins;
    	let cpx;
    	let cpy;
    	let $height;
    	let $yLim;
    	let $isOk;
    	let $width;
    	let $xLim;
    	let $scale;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Axes', slots, ['xaxis','yaxis','default','box']);
    	let { limX = [undefined, undefined] } = $$props;
    	let { limY = [undefined, undefined] } = $$props;
    	let { title = "" } = $$props;
    	let { xLabel = "" } = $$props;
    	let { yLabel = "" } = $$props;
    	let { multiSeries = true } = $$props;

    	// event dispatcher
    	const dispatch = createEventDispatcher();

    	// how big are margins (number of pixels in unit margin value) between axis and plot area if axis are shown
    	const AXES_MARGIN_FACTORS = { "small": 30, "medium": 40, "large": 50 };

    	// number of ticks along each axis
    	const TICK_NUM = { "small": 5, "medium": 8, "large": 12 };

    	// margin between plot series elements and data labels
    	const LABELS_MARGIN = { "small": 10, "medium": 15, "large": 20 };

    	// line styles for different scales and types
    	const LINE_STYLES = {
    		small: ["0", "3,3", "1,1", "3,1"],
    		medium: ["0", "5,5", "2,2", "5,2"],
    		large: ["0", "7,7", "3,3", "7,3"]
    	};

    	// constant to make clip path ID unique
    	const clipPathID = "plottingArea" + Math.round(Math.random() * 10000);

    	/* parameters for internal use inside the component */
    	let axesWrapper; // pointer to axes wrapper DOM element

    	let axesMargins = [0.034, 0.034, 0.034, 0.034]; // initial margins (will be multiplied to FACTORS)

    	/* reactive parameters to be shared with children via context */
    	const width = writable(100); // actual width of plotting area in pixels

    	validate_store(width, 'width');
    	component_subscribe($$self, width, value => $$invalidate(23, $width = value));
    	const height = writable(100); // actual height of plotting area in pixels
    	validate_store(height, 'height');
    	component_subscribe($$self, height, value => $$invalidate(21, $height = value));
    	const xLim = writable([undefined, undefined]); // actual limits for x-axis in plot units
    	validate_store(xLim, 'xLim');
    	component_subscribe($$self, xLim, value => $$invalidate(24, $xLim = value));
    	const yLim = writable([undefined, undefined]); // actual limits for y-axis in plot units
    	validate_store(yLim, 'yLim');
    	component_subscribe($$self, yLim, value => $$invalidate(22, $yLim = value));
    	const scale = writable("medium"); // scale factor (how big the shown plot is)
    	validate_store(scale, 'scale');
    	component_subscribe($$self, scale, value => $$invalidate(4, $scale = value));
    	const isOk = writable(false); // are axes ready for drawing
    	validate_store(isOk, 'isOk');
    	component_subscribe($$self, isOk, value => $$invalidate(3, $isOk = value));

    	/** Adds margins for x-axis (e.g. when x-axis must be shown) */
    	const addXAxisMargins = function () {
    		$$invalidate(19, axesMargins[0] = 1, axesMargins);
    		$$invalidate(19, axesMargins[2] = 0.5, axesMargins);
    		$$invalidate(19, axesMargins[1] = axesMargins[1] > 0.5 ? axesMargins[1] : 0.5, axesMargins);
    		$$invalidate(19, axesMargins[3] = axesMargins[3] > 0.5 ? axesMargins[3] : 0.5, axesMargins);
    	};

    	/** Adds margins for y-axis (e.g. when y-axis must be shown) */
    	const addYAxisMargins = function () {
    		$$invalidate(19, axesMargins[1] = 1, axesMargins);
    		$$invalidate(19, axesMargins[3] = 0.5, axesMargins);
    		$$invalidate(19, axesMargins[0] = axesMargins[0] > 0.5 ? axesMargins[0] : 0.5, axesMargins);
    		$$invalidate(19, axesMargins[2] = axesMargins[2] > 0.5 ? axesMargins[2] : 0.5, axesMargins);
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

    	/** Adjusts x- or y- axis limits (e.g. when new elements are added)
     *  @param {Array} lim - vector with limits for current axis (two values)
     *  @param {Array} newLim - vector with new limits  (two values)
     *  @returns {Array} vector with rescaled values
     *
     *  The new limits are set separately for min and max. Either if current value is undefined or
     *  if new value is outside the current limits (smaller than min or larger than max).
     */
    	const adjustAxisLimits = function (lim, newLim) {
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

    	/** Rescales x-values from plot coordinates to screen (SVG) coordinates
     *  @param {Array} x - vector with coordinates (or objects size) in original plot coordinates
     *  @param {Array} xLim - vector with current limits for x-axis in original plot coordinates
     *  @param {number} width - width of coordinate system in pixels
     *  @param {boolean} doSizeScreen - scale size of objects (true) or coordinates
     *  @returns {Array} vector with rescaled values
     */
    	const scaleX = function (x, xLim, width, doSizeScale = false) {
    		if (!$isOk || x === undefined || !Array.isArray(x)) return undefined;

    		if (doSizeScale) {
    			// scale size of objects instead of coordinates
    			return x.map(v => v / (xLim[1] - xLim[0]) * (width - margins[1] - margins[3]));
    		}

    		return x.map(v => (v - xLim[0]) / (xLim[1] - xLim[0]) * (width - margins[1] - margins[3]) + margins[1]);
    	};

    	/** Rescales x-values from plot coordinates to screen (SVG) coordinates
     *  @param {Array} x - vector with coordinates (or objects size) in original plot coordinates
     *  @param {Array} xLim - vector with current limits for x-axis in original plot coordinates
     *  @param {number} width - width of coordinate system in pixels
     *  @param {boolean} doSizeScreen - scale size of objects (true) or coordinates
     *  @returns {Array} vector with rescaled values
     */
    	const scaleY = function (y, yLim, height, doSizeScale = false) {
    		if (!$isOk || y === undefined || !Array.isArray(y)) return undefined;

    		if (doSizeScale) {
    			// scale size of objects instead of coordinates
    			return y.map(v => v / (yLim[1] - yLim[0]) * (height - margins[0] - margins[2]));
    		}

    		// for coordinates we also need to invert (flip) the y-axis
    		return y.map(v => (yLim[1] - v) / (yLim[1] - yLim[0]) * (height - margins[0] - margins[2]) + margins[2]);
    	};

    	/** Computes nice tick values for axis
     * @param {Array} ticks - vector with ticks if alredy available (if not, new will be computed)
     * @param {Array} lim - vector with axis limits tickets must be computed for
     * @param {number} maxTickNum - maximum number of ticks to compute
     * @param {boolean} round - round or not the fractions when computing nice numbers for the ticks
     * @returns {Array} a vector with computed tick positions
     */
    	const getAxisTicks = function (ticks, lim, maxTickNum, round = true) {
    		// if ticks are already provided do not recompute them
    		if (ticks !== undefined) return ticks;

    		// check if limits are ok
    		if (!Array.isArray(lim) || lim[0] === undefined || lim[1] === undefined) return undefined;

    		// get range as a nice number and compute min, max and steps for the tick sequence
    		const range = niceNum(lim[1] - lim[0], round);

    		const tickSpacing = niceNum(range / (maxTickNum - 1), round);
    		const tickMin = Math.ceil(lim[0] / tickSpacing) * tickSpacing;
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
    		return ticks.filter(x => x >= lim[0] & x <= lim[1]);
    	};

    	/* context with Axes constants, properties and methods to share with children */
    	let context = {
    		// methods
    		addXAxisMargins,
    		addYAxisMargins,
    		adjustXAxisLimits,
    		adjustYAxisLimits,
    		getAxisTicks,
    		scaleX,
    		scaleY,
    		// variables
    		isOk,
    		scale,
    		width,
    		height,
    		xLim,
    		yLim,
    		// constants
    		LINE_STYLES,
    		LABELS_MARGIN,
    		TICK_NUM
    	};

    	setContext('axes', context);

    	/* observer for the plotting area size */
    	var ro = new ResizeObserver(entries => {
    			for (let entry of entries) {
    				const cr = entry.contentRect;
    				width.update(x => cr.width);
    				height.update(x => cr.height);
    				scale.update(x => getScale(cr.width, cr.height));
    			}
    		});

    	onMount(() => {
    		ro.observe(axesWrapper);
    	});

    	// handle click on plot elements and dispatch manual events
    	function dispatchClickEvent(eventName, el) {
    		dispatch(eventName, {
    			seriesTitle: el.parentNode.getAttribute('title'),
    			elementID: el.dataset.id
    		});
    	}

    	function handleClick(e) {
    		// scatter plot markers
    		if (e.target.tagName === "text" && e.target.parentNode.classList.contains("series_scatter")) {
    			dispatchClickEvent("markerclick", e.target);
    			return;
    		}

    		// bar plot bars
    		if (e.target.tagName === "rect" && e.target.parentNode.classList.contains("series_bar")) {
    			dispatchClickEvent("barclick", e.target);
    			return;
    		}

    		// outside any plot element
    		dispatch("axesclick");
    	}

    	const writable_props = ['limX', 'limY', 'title', 'xLabel', 'yLabel', 'multiSeries'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Axes> was created with unknown prop '${key}'`);
    	});

    	function div0_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			axesWrapper = $$value;
    			$$invalidate(5, axesWrapper);
    		});
    	}

    	$$self.$$set = $$props => {
    		if ('limX' in $$props) $$invalidate(16, limX = $$props.limX);
    		if ('limY' in $$props) $$invalidate(17, limY = $$props.limY);
    		if ('title' in $$props) $$invalidate(0, title = $$props.title);
    		if ('xLabel' in $$props) $$invalidate(1, xLabel = $$props.xLabel);
    		if ('yLabel' in $$props) $$invalidate(2, yLabel = $$props.yLabel);
    		if ('multiSeries' in $$props) $$invalidate(18, multiSeries = $$props.multiSeries);
    		if ('$$scope' in $$props) $$invalidate(25, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		setContext,
    		createEventDispatcher,
    		writable,
    		limX,
    		limY,
    		title,
    		xLabel,
    		yLabel,
    		multiSeries,
    		dispatch,
    		AXES_MARGIN_FACTORS,
    		TICK_NUM,
    		LABELS_MARGIN,
    		LINE_STYLES,
    		clipPathID,
    		axesWrapper,
    		axesMargins,
    		width,
    		height,
    		xLim,
    		yLim,
    		scale,
    		isOk,
    		addXAxisMargins,
    		addYAxisMargins,
    		adjustXAxisLimits,
    		adjustYAxisLimits,
    		adjustAxisLimits,
    		scaleX,
    		scaleY,
    		getAxisTicks,
    		niceNum,
    		getScale,
    		context,
    		ro,
    		dispatchClickEvent,
    		handleClick,
    		cpy,
    		cpx,
    		margins,
    		$height,
    		$yLim,
    		$isOk,
    		$width,
    		$xLim,
    		$scale
    	});

    	$$self.$inject_state = $$props => {
    		if ('limX' in $$props) $$invalidate(16, limX = $$props.limX);
    		if ('limY' in $$props) $$invalidate(17, limY = $$props.limY);
    		if ('title' in $$props) $$invalidate(0, title = $$props.title);
    		if ('xLabel' in $$props) $$invalidate(1, xLabel = $$props.xLabel);
    		if ('yLabel' in $$props) $$invalidate(2, yLabel = $$props.yLabel);
    		if ('multiSeries' in $$props) $$invalidate(18, multiSeries = $$props.multiSeries);
    		if ('axesWrapper' in $$props) $$invalidate(5, axesWrapper = $$props.axesWrapper);
    		if ('axesMargins' in $$props) $$invalidate(19, axesMargins = $$props.axesMargins);
    		if ('context' in $$props) context = $$props.context;
    		if ('ro' in $$props) ro = $$props.ro;
    		if ('cpy' in $$props) $$invalidate(6, cpy = $$props.cpy);
    		if ('cpx' in $$props) $$invalidate(7, cpx = $$props.cpx);
    		if ('margins' in $$props) $$invalidate(20, margins = $$props.margins);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty[0] & /*limX*/ 65536) {
    			// this is reactive in case if limX and limY are interactively changed by parent script
    			if (!limX.some(v => v === undefined)) xLim.update(v => limX);
    		}

    		if ($$self.$$.dirty[0] & /*limY*/ 131072) {
    			if (!limY.some(v => v === undefined)) yLim.update(v => limY);
    		}

    		if ($$self.$$.dirty[0] & /*axesMargins, $scale*/ 524304) {
    			// computes real margins in pixels based on current scale
    			$$invalidate(20, margins = axesMargins.map(v => v * AXES_MARGIN_FACTORS[$scale]));
    		}

    		if ($$self.$$.dirty[0] & /*$yLim, $xLim, $width, margins, $height*/ 32505856) {
    			// computes status which tells that axes limits look fine and it is safe to draw
    			// the status is based on the axis limits validity
    			isOk.update(v => Array.isArray($yLim) && Array.isArray($xLim) && $xLim.length === 2 && $yLim.length === 2 && !$yLim.some(v => v === undefined) && !$xLim.some(v => v === undefined) && !$yLim.some(v => isNaN(v)) && !$xLim.some(v => isNaN(v)) && $xLim[1] !== $xLim[0] && $yLim[1] !== $yLim[0] && $width > margins[1] + margins[3] && $height > margins[0] + margins[2]);
    		}

    		if ($$self.$$.dirty[0] & /*$isOk, $xLim, $width*/ 25165832) {
    			// computes coordinates for clip path box
    			$$invalidate(7, cpx = $isOk ? scaleX($xLim, $xLim, $width) : [0, 1]);
    		}

    		if ($$self.$$.dirty[0] & /*$isOk, $yLim, $height*/ 6291464) {
    			$$invalidate(6, cpy = $isOk ? scaleY($yLim, $yLim, $height) : [1, 0]);
    		}
    	};

    	return [
    		title,
    		xLabel,
    		yLabel,
    		$isOk,
    		$scale,
    		axesWrapper,
    		cpy,
    		cpx,
    		clipPathID,
    		width,
    		height,
    		xLim,
    		yLim,
    		scale,
    		isOk,
    		handleClick,
    		limX,
    		limY,
    		multiSeries,
    		axesMargins,
    		margins,
    		$height,
    		$yLim,
    		$width,
    		$xLim,
    		$$scope,
    		slots,
    		div0_binding
    	];
    }

    class Axes extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(
    			this,
    			options,
    			instance$7,
    			create_fragment$7,
    			safe_not_equal,
    			{
    				limX: 16,
    				limY: 17,
    				title: 0,
    				xLabel: 1,
    				yLabel: 2,
    				multiSeries: 18
    			},
    			null,
    			[-1, -1]
    		);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Axes",
    			options,
    			id: create_fragment$7.name
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

    	get title() {
    		throw new Error("<Axes>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set title(value) {
    		throw new Error("<Axes>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get xLabel() {
    		throw new Error("<Axes>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set xLabel(value) {
    		throw new Error("<Axes>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get yLabel() {
    		throw new Error("<Axes>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set yLabel(value) {
    		throw new Error("<Axes>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get multiSeries() {
    		throw new Error("<Axes>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set multiSeries(value) {
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

    /* ../node_modules/svelte-plots-basic/src/TextLabels.svelte generated by Svelte v3.48.0 */
    const file$1 = "../node_modules/svelte-plots-basic/src/TextLabels.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[27] = list[i];
    	child_ctx[29] = i;
    	return child_ctx;
    }

    // (66:0) {#if x !== undefined && y !== undefined}
    function create_if_block$2(ctx) {
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

    			attr_dev(g, "class", g_class_value = "series " + /*style*/ ctx[1]);
    			attr_dev(g, "title", /*title*/ ctx[2]);
    			attr_dev(g, "style", /*textStyleStr*/ ctx[3]);
    			add_location(g, file$1, 66, 3, 2502);
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

    			if (dirty & /*style*/ 2 && g_class_value !== (g_class_value = "series " + /*style*/ ctx[1])) {
    				attr_dev(g, "class", g_class_value);
    			}

    			if (dirty & /*title*/ 4) {
    				attr_dev(g, "title", /*title*/ ctx[2]);
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
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(66:0) {#if x !== undefined && y !== undefined}",
    		ctx
    	});

    	return block;
    }

    // (68:3) {#each x as v, i}
    function create_each_block$1(ctx) {
    	let text_1;
    	let raw_value = /*labels*/ ctx[0][/*i*/ ctx[29]] + "";
    	let text_1_x_value;
    	let text_1_y_value;

    	const block = {
    		c: function create() {
    			text_1 = svg_element("text");
    			attr_dev(text_1, "data-id", /*i*/ ctx[29]);
    			attr_dev(text_1, "x", text_1_x_value = /*x*/ ctx[7][/*i*/ ctx[29]]);
    			attr_dev(text_1, "y", text_1_y_value = /*y*/ ctx[6][/*i*/ ctx[29]]);
    			attr_dev(text_1, "dx", /*dx*/ ctx[5]);
    			attr_dev(text_1, "dy", /*dy*/ ctx[4]);
    			attr_dev(text_1, "class", "svelte-1xvrp9d");
    			add_location(text_1, file$1, 68, 6, 2592);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, text_1, anchor);
    			text_1.innerHTML = raw_value;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*labels*/ 1 && raw_value !== (raw_value = /*labels*/ ctx[0][/*i*/ ctx[29]] + "")) text_1.innerHTML = raw_value;
    			if (dirty & /*x*/ 128 && text_1_x_value !== (text_1_x_value = /*x*/ ctx[7][/*i*/ ctx[29]])) {
    				attr_dev(text_1, "x", text_1_x_value);
    			}

    			if (dirty & /*y*/ 64 && text_1_y_value !== (text_1_y_value = /*y*/ ctx[6][/*i*/ ctx[29]])) {
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
    		source: "(68:3) {#each x as v, i}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$6(ctx) {
    	let if_block_anchor;
    	let if_block = /*x*/ ctx[7] !== undefined && /*y*/ ctx[6] !== undefined && create_if_block$2(ctx);

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
    					if_block = create_if_block$2(ctx);
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
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let x;
    	let y;
    	let dx;
    	let dy;
    	let textStyleStr;
    	let $scale;
    	let $axesHeight;
    	let $yLim;
    	let $axesWidth;
    	let $xLim;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('TextLabels', slots, []);
    	let { xValues } = $$props;
    	let { yValues } = $$props;
    	let { labels } = $$props;
    	let { pos = 0 } = $$props;
    	let { faceColor = Colors.PRIMARY_TEXT } = $$props;
    	let { borderColor = "transparent" } = $$props;
    	let { borderWidth = 0 } = $$props;
    	let { textSize = 1 } = $$props;
    	let { style = "" } = $$props;
    	let { title = "series_text" } = $$props;

    	// text-anchor values depending on position
    	const textAnchors = ["middle", "middle", "start", "middle", "end"];

    	// sanity check for input parameters
    	if (!Array.isArray(xValues) || !Array.isArray(yValues) || xValues.length !== yValues.length) {
    		throw "TextLabels: parameters 'xValues' and 'yValues' must be vectors of the same length.";
    	}

    	// get axes context and reactive variables needed to compute coordinates
    	const axes = getContext('axes');

    	const xLim = axes.xLim;
    	validate_store(xLim, 'xLim');
    	component_subscribe($$self, xLim, value => $$invalidate(24, $xLim = value));
    	const yLim = axes.yLim;
    	validate_store(yLim, 'yLim');
    	component_subscribe($$self, yLim, value => $$invalidate(22, $yLim = value));
    	const axesWidth = axes.width;
    	validate_store(axesWidth, 'axesWidth');
    	component_subscribe($$self, axesWidth, value => $$invalidate(23, $axesWidth = value));
    	const axesHeight = axes.height;
    	validate_store(axesHeight, 'axesHeight');
    	component_subscribe($$self, axesHeight, value => $$invalidate(21, $axesHeight = value));
    	const scale = axes.scale;
    	validate_store(scale, 'scale');
    	component_subscribe($$self, scale, value => $$invalidate(20, $scale = value));

    	const writable_props = [
    		'xValues',
    		'yValues',
    		'labels',
    		'pos',
    		'faceColor',
    		'borderColor',
    		'borderWidth',
    		'textSize',
    		'style',
    		'title'
    	];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<TextLabels> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('xValues' in $$props) $$invalidate(13, xValues = $$props.xValues);
    		if ('yValues' in $$props) $$invalidate(14, yValues = $$props.yValues);
    		if ('labels' in $$props) $$invalidate(0, labels = $$props.labels);
    		if ('pos' in $$props) $$invalidate(15, pos = $$props.pos);
    		if ('faceColor' in $$props) $$invalidate(16, faceColor = $$props.faceColor);
    		if ('borderColor' in $$props) $$invalidate(17, borderColor = $$props.borderColor);
    		if ('borderWidth' in $$props) $$invalidate(18, borderWidth = $$props.borderWidth);
    		if ('textSize' in $$props) $$invalidate(19, textSize = $$props.textSize);
    		if ('style' in $$props) $$invalidate(1, style = $$props.style);
    		if ('title' in $$props) $$invalidate(2, title = $$props.title);
    	};

    	$$self.$capture_state = () => ({
    		getContext,
    		Colors,
    		xValues,
    		yValues,
    		labels,
    		pos,
    		faceColor,
    		borderColor,
    		borderWidth,
    		textSize,
    		style,
    		title,
    		textAnchors,
    		axes,
    		xLim,
    		yLim,
    		axesWidth,
    		axesHeight,
    		scale,
    		textStyleStr,
    		dy,
    		dx,
    		y,
    		x,
    		$scale,
    		$axesHeight,
    		$yLim,
    		$axesWidth,
    		$xLim
    	});

    	$$self.$inject_state = $$props => {
    		if ('xValues' in $$props) $$invalidate(13, xValues = $$props.xValues);
    		if ('yValues' in $$props) $$invalidate(14, yValues = $$props.yValues);
    		if ('labels' in $$props) $$invalidate(0, labels = $$props.labels);
    		if ('pos' in $$props) $$invalidate(15, pos = $$props.pos);
    		if ('faceColor' in $$props) $$invalidate(16, faceColor = $$props.faceColor);
    		if ('borderColor' in $$props) $$invalidate(17, borderColor = $$props.borderColor);
    		if ('borderWidth' in $$props) $$invalidate(18, borderWidth = $$props.borderWidth);
    		if ('textSize' in $$props) $$invalidate(19, textSize = $$props.textSize);
    		if ('style' in $$props) $$invalidate(1, style = $$props.style);
    		if ('title' in $$props) $$invalidate(2, title = $$props.title);
    		if ('textStyleStr' in $$props) $$invalidate(3, textStyleStr = $$props.textStyleStr);
    		if ('dy' in $$props) $$invalidate(4, dy = $$props.dy);
    		if ('dx' in $$props) $$invalidate(5, dx = $$props.dx);
    		if ('y' in $$props) $$invalidate(6, y = $$props.y);
    		if ('x' in $$props) $$invalidate(7, x = $$props.x);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*xValues, labels*/ 8193) {
    			// multiply label values if needed
    			{
    				const n = xValues.length;
    				if (!Array.isArray(labels)) $$invalidate(0, labels = Array(n).fill(labels));

    				// workaround for an issue when xValues and yValues are changed in parent app
    				// but array of labels is still the same as in the
    				if (labels.length != n) $$invalidate(0, labels = Array(n).fill(labels[0]));

    				// check that the length of labels vector is correct
    				if (labels.length !== n) {
    					throw "TextLabels: parameter 'labels' must be a single text value or a vector of the same size as 'x' and 'y'.";
    				}
    			}
    		}

    		if ($$self.$$.dirty & /*xValues, $xLim, $axesWidth*/ 25174016) {
    			// reactive variables for coordinates of data points in pixels
    			$$invalidate(7, x = axes.scaleX(xValues, $xLim, $axesWidth));
    		}

    		if ($$self.$$.dirty & /*yValues, $yLim, $axesHeight*/ 6307840) {
    			$$invalidate(6, y = axes.scaleY(yValues, $yLim, $axesHeight));
    		}

    		if ($$self.$$.dirty & /*pos, $scale*/ 1081344) {
    			$$invalidate(5, dx = [0, 0, 1, 0, -1][pos] * axes.LABELS_MARGIN[$scale]);
    		}

    		if ($$self.$$.dirty & /*pos, $scale*/ 1081344) {
    			$$invalidate(4, dy = [0, 1, 0, -1, 0][pos] * axes.LABELS_MARGIN[$scale]);
    		}

    		if ($$self.$$.dirty & /*faceColor, borderWidth, borderColor, textSize, pos*/ 1015808) {
    			// styles for the elements
    			$$invalidate(3, textStyleStr = `fill:${faceColor};stroke-width:${borderWidth}px;stroke:${borderColor};
      font-size:${textSize}em; text-anchor:${textAnchors[pos]};`);
    		}
    	};

    	return [
    		labels,
    		style,
    		title,
    		textStyleStr,
    		dy,
    		dx,
    		y,
    		x,
    		xLim,
    		yLim,
    		axesWidth,
    		axesHeight,
    		scale,
    		xValues,
    		yValues,
    		pos,
    		faceColor,
    		borderColor,
    		borderWidth,
    		textSize,
    		$scale,
    		$axesHeight,
    		$yLim,
    		$axesWidth,
    		$xLim
    	];
    }

    class TextLabels extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {
    			xValues: 13,
    			yValues: 14,
    			labels: 0,
    			pos: 15,
    			faceColor: 16,
    			borderColor: 17,
    			borderWidth: 18,
    			textSize: 19,
    			style: 1,
    			title: 2
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "TextLabels",
    			options,
    			id: create_fragment$6.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*xValues*/ ctx[13] === undefined && !('xValues' in props)) {
    			console.warn("<TextLabels> was created without expected prop 'xValues'");
    		}

    		if (/*yValues*/ ctx[14] === undefined && !('yValues' in props)) {
    			console.warn("<TextLabels> was created without expected prop 'yValues'");
    		}

    		if (/*labels*/ ctx[0] === undefined && !('labels' in props)) {
    			console.warn("<TextLabels> was created without expected prop 'labels'");
    		}
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

    	get title() {
    		throw new Error("<TextLabels>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set title(value) {
    		throw new Error("<TextLabels>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /**********************************************
     * Functions for statistical tests            *
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

    /* ../node_modules/svelte-plots-basic/src/ScatterSeries.svelte generated by Svelte v3.48.0 */

    function create_fragment$5(ctx) {
    	let textlabels;
    	let current;

    	textlabels = new TextLabels({
    			props: {
    				xValues: /*xValues*/ ctx[0],
    				yValues: /*yValues*/ ctx[1],
    				faceColor: /*faceColor*/ ctx[3],
    				borderColor: /*borderColor*/ ctx[4],
    				borderWidth: /*borderWidth*/ ctx[5],
    				title: /*title*/ ctx[2],
    				style: "series_scatter",
    				labels: /*markerSymbol*/ ctx[7],
    				textSize: /*markerSize*/ ctx[6]
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
    			if (dirty & /*xValues*/ 1) textlabels_changes.xValues = /*xValues*/ ctx[0];
    			if (dirty & /*yValues*/ 2) textlabels_changes.yValues = /*yValues*/ ctx[1];
    			if (dirty & /*faceColor*/ 8) textlabels_changes.faceColor = /*faceColor*/ ctx[3];
    			if (dirty & /*borderColor*/ 16) textlabels_changes.borderColor = /*borderColor*/ ctx[4];
    			if (dirty & /*borderWidth*/ 32) textlabels_changes.borderWidth = /*borderWidth*/ ctx[5];
    			if (dirty & /*title*/ 4) textlabels_changes.title = /*title*/ ctx[2];
    			if (dirty & /*markerSymbol*/ 128) textlabels_changes.labels = /*markerSymbol*/ ctx[7];
    			if (dirty & /*markerSize*/ 64) textlabels_changes.textSize = /*markerSize*/ ctx[6];
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
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('ScatterSeries', slots, []);
    	let { xValues } = $$props;
    	let { yValues } = $$props;
    	let { marker = 1 } = $$props;
    	let { title = "" } = $$props;
    	let { faceColor = "transparent" } = $$props;
    	let { borderColor = Colors.PRIMARY } = $$props;
    	let { borderWidth = 1 } = $$props;
    	let { markerSize = 1 } = $$props;

    	// TODO: implement later
    	//export let labels = yValues;
    	//export let showLabels = "no"; // can be "no", "hover", "always"
    	/* constants for internal use */
    	const markers = ["●", "◼", "▲", "▼", "⬥", "+", "*", "⨯"];

    	let markerSymbol;

    	/* sanity check of input parameters */
    	if (typeof marker !== "number" || marker < 1 || marker > markers.length) {
    		throw `ScatterSeries: parameter 'marker' must be a number from 1 to ${markers.length}."`;
    	}

    	// to access shared parameters and methods from Axes
    	const axes = getContext('axes');

    	const writable_props = [
    		'xValues',
    		'yValues',
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
    		if ('xValues' in $$props) $$invalidate(0, xValues = $$props.xValues);
    		if ('yValues' in $$props) $$invalidate(1, yValues = $$props.yValues);
    		if ('marker' in $$props) $$invalidate(8, marker = $$props.marker);
    		if ('title' in $$props) $$invalidate(2, title = $$props.title);
    		if ('faceColor' in $$props) $$invalidate(3, faceColor = $$props.faceColor);
    		if ('borderColor' in $$props) $$invalidate(4, borderColor = $$props.borderColor);
    		if ('borderWidth' in $$props) $$invalidate(5, borderWidth = $$props.borderWidth);
    		if ('markerSize' in $$props) $$invalidate(6, markerSize = $$props.markerSize);
    	};

    	$$self.$capture_state = () => ({
    		getContext,
    		mrange,
    		Colors,
    		TextLabels,
    		xValues,
    		yValues,
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
    		if ('xValues' in $$props) $$invalidate(0, xValues = $$props.xValues);
    		if ('yValues' in $$props) $$invalidate(1, yValues = $$props.yValues);
    		if ('marker' in $$props) $$invalidate(8, marker = $$props.marker);
    		if ('title' in $$props) $$invalidate(2, title = $$props.title);
    		if ('faceColor' in $$props) $$invalidate(3, faceColor = $$props.faceColor);
    		if ('borderColor' in $$props) $$invalidate(4, borderColor = $$props.borderColor);
    		if ('borderWidth' in $$props) $$invalidate(5, borderWidth = $$props.borderWidth);
    		if ('markerSize' in $$props) $$invalidate(6, markerSize = $$props.markerSize);
    		if ('markerSymbol' in $$props) $$invalidate(7, markerSymbol = $$props.markerSymbol);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*xValues, marker*/ 257) {
    			/* reactive actions related to x-values, fires when there are changes in:
     * - xValues
     * - marker
     */
    			{
    				if (!Array.isArray(xValues)) {
    					throw "ScatterSeries: parameter 'xValues' must be a numeric vector.";
    				}

    				const xValuesRange = mrange(xValues, 0.05);
    				axes.adjustXAxisLimits(xValuesRange);
    				$$invalidate(7, markerSymbol = "");
    				$$invalidate(7, markerSymbol = markers[marker - 1]);
    			}
    		}

    		if ($$self.$$.dirty & /*yValues, xValues*/ 3) {
    			/* reactive actions related to y-values, fires when there are changes in:
     * - yValues
     */
    			{
    				if (!Array.isArray(yValues) || xValues.length != yValues.length) {
    					throw "BarSeries: parameter 'yValues' must be a numeric vector of the same length as 'xValues'.";
    				}

    				const yValuesRange = mrange(yValues, 0.05);
    				axes.adjustYAxisLimits(yValuesRange);
    			}
    		}
    	};

    	return [
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

    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {
    			xValues: 0,
    			yValues: 1,
    			marker: 8,
    			title: 2,
    			faceColor: 3,
    			borderColor: 4,
    			borderWidth: 5,
    			markerSize: 6
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ScatterSeries",
    			options,
    			id: create_fragment$5.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*xValues*/ ctx[0] === undefined && !('xValues' in props)) {
    			console.warn("<ScatterSeries> was created without expected prop 'xValues'");
    		}

    		if (/*yValues*/ ctx[1] === undefined && !('yValues' in props)) {
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

    let colors = {
       plots: {
          // population colors
          POPULATIONS_PALE: ["#33668820", "#ff990020"],
          POPULATIONS: ["#33668850", "#ff990050"],
          SAMPLES: ["#336688", "#ff9900"],

          // statistics on plot legend
          STAT_NAME: "#808080",
          STAT_VALUE: "#202020"
       }
    };


    function formatLabels(labels) {

       if (!Array.isArray(labels)) labels = [labels];
       let labelsStr = Array(length = labels.length);


       for (let i = 0; i < labels.length; i++) {
          labelsStr[i] =    "<tspan fill=" + colors.plots.STAT_NAME + ">" + labels[i].name + ":</tspan> " + labels[i].value;
       }

       return labelsStr;
    }

    /* src/SampleSeries.svelte generated by Svelte v3.48.0 */

    // (32:0) {#if nT > 0}
    function create_if_block_1(ctx) {
    	let scatterseries;
    	let current;

    	scatterseries = new ScatterSeries({
    			props: {
    				xValues: /*xT*/ ctx[8],
    				yValues: /*yT*/ ctx[7],
    				markerSize: /*markerSize*/ ctx[0],
    				borderWidth,
    				faceColor: /*bgColors*/ ctx[2][0],
    				borderColor: /*lineColors*/ ctx[1][0]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(scatterseries.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(scatterseries, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const scatterseries_changes = {};
    			if (dirty & /*xT*/ 256) scatterseries_changes.xValues = /*xT*/ ctx[8];
    			if (dirty & /*yT*/ 128) scatterseries_changes.yValues = /*yT*/ ctx[7];
    			if (dirty & /*markerSize*/ 1) scatterseries_changes.markerSize = /*markerSize*/ ctx[0];
    			if (dirty & /*bgColors*/ 4) scatterseries_changes.faceColor = /*bgColors*/ ctx[2][0];
    			if (dirty & /*lineColors*/ 2) scatterseries_changes.borderColor = /*lineColors*/ ctx[1][0];
    			scatterseries.$set(scatterseries_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(scatterseries.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(scatterseries.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(scatterseries, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(32:0) {#if nT > 0}",
    		ctx
    	});

    	return block;
    }

    // (36:0) {#if nH > 0}
    function create_if_block$1(ctx) {
    	let scatterseries;
    	let current;

    	scatterseries = new ScatterSeries({
    			props: {
    				xValues: /*xH*/ ctx[5],
    				yValues: /*yH*/ ctx[4],
    				markerSize: /*markerSize*/ ctx[0],
    				borderWidth,
    				faceColor: /*bgColors*/ ctx[2][1],
    				borderColor: /*lineColors*/ ctx[1][1]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(scatterseries.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(scatterseries, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const scatterseries_changes = {};
    			if (dirty & /*xH*/ 32) scatterseries_changes.xValues = /*xH*/ ctx[5];
    			if (dirty & /*yH*/ 16) scatterseries_changes.yValues = /*yH*/ ctx[4];
    			if (dirty & /*markerSize*/ 1) scatterseries_changes.markerSize = /*markerSize*/ ctx[0];
    			if (dirty & /*bgColors*/ 4) scatterseries_changes.faceColor = /*bgColors*/ ctx[2][1];
    			if (dirty & /*lineColors*/ 2) scatterseries_changes.borderColor = /*lineColors*/ ctx[1][1];
    			scatterseries.$set(scatterseries_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(scatterseries.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(scatterseries.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(scatterseries, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(36:0) {#if nH > 0}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let t;
    	let if_block1_anchor;
    	let current;
    	let if_block0 = /*nT*/ ctx[3] > 0 && create_if_block_1(ctx);
    	let if_block1 = /*nH*/ ctx[6] > 0 && create_if_block$1(ctx);

    	const block = {
    		c: function create() {
    			if (if_block0) if_block0.c();
    			t = space();
    			if (if_block1) if_block1.c();
    			if_block1_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block0) if_block0.m(target, anchor);
    			insert_dev(target, t, anchor);
    			if (if_block1) if_block1.m(target, anchor);
    			insert_dev(target, if_block1_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*nT*/ ctx[3] > 0) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);

    					if (dirty & /*nT*/ 8) {
    						transition_in(if_block0, 1);
    					}
    				} else {
    					if_block0 = create_if_block_1(ctx);
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(t.parentNode, t);
    				}
    			} else if (if_block0) {
    				group_outros();

    				transition_out(if_block0, 1, 1, () => {
    					if_block0 = null;
    				});

    				check_outros();
    			}

    			if (/*nH*/ ctx[6] > 0) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);

    					if (dirty & /*nH*/ 64) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block$1(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(if_block1_anchor.parentNode, if_block1_anchor);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block0);
    			transition_in(if_block1);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block0);
    			transition_out(if_block1);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block0) if_block0.d(detaching);
    			if (detaching) detach_dev(t);
    			if (if_block1) if_block1.d(detaching);
    			if (detaching) detach_dev(if_block1_anchor);
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

    const borderWidth = 1.5;

    function instance$4($$self, $$props, $$invalidate) {
    	let n;
    	let x;
    	let y;
    	let nT;
    	let xT;
    	let yT;
    	let nH;
    	let xH;
    	let yH;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('SampleSeries', slots, []);
    	let { yPos = 0 } = $$props;
    	let { sample = [] } = $$props;
    	let { markerSize = 5 } = $$props;
    	let { lineColors = colors.plots.SAMPLES } = $$props;
    	let { bgColors = colors.plots.POPULATIONS } = $$props;
    	const writable_props = ['yPos', 'sample', 'markerSize', 'lineColors', 'bgColors'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<SampleSeries> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('yPos' in $$props) $$invalidate(9, yPos = $$props.yPos);
    		if ('sample' in $$props) $$invalidate(10, sample = $$props.sample);
    		if ('markerSize' in $$props) $$invalidate(0, markerSize = $$props.markerSize);
    		if ('lineColors' in $$props) $$invalidate(1, lineColors = $$props.lineColors);
    		if ('bgColors' in $$props) $$invalidate(2, bgColors = $$props.bgColors);
    	};

    	$$self.$capture_state = () => ({
    		seq,
    		rep,
    		sum,
    		ScatterSeries,
    		colors,
    		yPos,
    		sample,
    		markerSize,
    		lineColors,
    		bgColors,
    		borderWidth,
    		y,
    		yH,
    		x,
    		xH,
    		nT,
    		n,
    		nH,
    		yT,
    		xT
    	});

    	$$self.$inject_state = $$props => {
    		if ('yPos' in $$props) $$invalidate(9, yPos = $$props.yPos);
    		if ('sample' in $$props) $$invalidate(10, sample = $$props.sample);
    		if ('markerSize' in $$props) $$invalidate(0, markerSize = $$props.markerSize);
    		if ('lineColors' in $$props) $$invalidate(1, lineColors = $$props.lineColors);
    		if ('bgColors' in $$props) $$invalidate(2, bgColors = $$props.bgColors);
    		if ('y' in $$props) $$invalidate(11, y = $$props.y);
    		if ('yH' in $$props) $$invalidate(4, yH = $$props.yH);
    		if ('x' in $$props) $$invalidate(12, x = $$props.x);
    		if ('xH' in $$props) $$invalidate(5, xH = $$props.xH);
    		if ('nT' in $$props) $$invalidate(3, nT = $$props.nT);
    		if ('n' in $$props) $$invalidate(13, n = $$props.n);
    		if ('nH' in $$props) $$invalidate(6, nH = $$props.nH);
    		if ('yT' in $$props) $$invalidate(7, yT = $$props.yT);
    		if ('xT' in $$props) $$invalidate(8, xT = $$props.xT);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*sample*/ 1024) {
    			// sample size and coordinates for its elements
    			$$invalidate(13, n = sample.length);
    		}

    		if ($$self.$$.dirty & /*n*/ 8192) {
    			$$invalidate(12, x = seq(1, n));
    		}

    		if ($$self.$$.dirty & /*yPos, n*/ 8704) {
    			$$invalidate(11, y = rep(yPos, n));
    		}

    		if ($$self.$$.dirty & /*sample*/ 1024) {
    			// number and coordiantes of tails
    			$$invalidate(3, nT = sum(sample));
    		}

    		if ($$self.$$.dirty & /*x, sample*/ 5120) {
    			$$invalidate(8, xT = x.filter((v, i) => sample[i]));
    		}

    		if ($$self.$$.dirty & /*y, sample*/ 3072) {
    			$$invalidate(7, yT = y.filter((v, i) => sample[i]));
    		}

    		if ($$self.$$.dirty & /*n, nT*/ 8200) {
    			// number and coordiantes of heads
    			$$invalidate(6, nH = n - nT);
    		}

    		if ($$self.$$.dirty & /*x, sample*/ 5120) {
    			$$invalidate(5, xH = x.filter((v, i) => !sample[i]));
    		}

    		if ($$self.$$.dirty & /*y, sample*/ 3072) {
    			$$invalidate(4, yH = y.filter((v, i) => !sample[i]));
    		}
    	};

    	return [
    		markerSize,
    		lineColors,
    		bgColors,
    		nT,
    		yH,
    		xH,
    		nH,
    		yT,
    		xT,
    		yPos,
    		sample,
    		y,
    		x,
    		n
    	];
    }

    class SampleSeries extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {
    			yPos: 9,
    			sample: 10,
    			markerSize: 0,
    			lineColors: 1,
    			bgColors: 2
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "SampleSeries",
    			options,
    			id: create_fragment$4.name
    		});
    	}

    	get yPos() {
    		throw new Error("<SampleSeries>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set yPos(value) {
    		throw new Error("<SampleSeries>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get sample() {
    		throw new Error("<SampleSeries>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set sample(value) {
    		throw new Error("<SampleSeries>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get markerSize() {
    		throw new Error("<SampleSeries>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set markerSize(value) {
    		throw new Error("<SampleSeries>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get lineColors() {
    		throw new Error("<SampleSeries>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set lineColors(value) {
    		throw new Error("<SampleSeries>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get bgColors() {
    		throw new Error("<SampleSeries>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set bgColors(value) {
    		throw new Error("<SampleSeries>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/OutcomesColumn.svelte generated by Svelte v3.48.0 */

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[7] = list[i];
    	child_ctx[9] = i;
    	return child_ctx;
    }

    // (19:3) {#each outcomes as outcome, i}
    function create_each_block(ctx) {
    	let sampleseries;
    	let current;

    	sampleseries = new SampleSeries({
    			props: {
    				sample: /*outcome*/ ctx[7],
    				yPos: /*i*/ ctx[9],
    				markerSize: /*mSize*/ ctx[0]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(sampleseries.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(sampleseries, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const sampleseries_changes = {};
    			if (dirty & /*outcomes*/ 2) sampleseries_changes.sample = /*outcome*/ ctx[7];
    			if (dirty & /*mSize*/ 1) sampleseries_changes.markerSize = /*mSize*/ ctx[0];
    			sampleseries.$set(sampleseries_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(sampleseries.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(sampleseries.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(sampleseries, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(19:3) {#each outcomes as outcome, i}",
    		ctx
    	});

    	return block;
    }

    // (18:0) <Axes limX={[0, sampSize + 1]} limY={limY}>
    function create_default_slot$2(ctx) {
    	let t;
    	let textlabels;
    	let current;
    	let each_value = /*outcomes*/ ctx[1];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	textlabels = new TextLabels({
    			props: {
    				textSize: 1 + (/*mSize*/ ctx[0] + 1) / 10,
    				xValues: [/*sampSize*/ ctx[3] / 2 + 0.5],
    				yValues: /*mYPos*/ ctx[4],
    				labels: formatLabels([
    					{
    						name: /*name*/ ctx[2],
    						value: /*N*/ ctx[6]
    					}
    				])
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t = space();
    			create_component(textlabels.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, t, anchor);
    			mount_component(textlabels, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*outcomes, mSize*/ 3) {
    				each_value = /*outcomes*/ ctx[1];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(t.parentNode, t);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}

    			const textlabels_changes = {};
    			if (dirty & /*mSize*/ 1) textlabels_changes.textSize = 1 + (/*mSize*/ ctx[0] + 1) / 10;
    			if (dirty & /*sampSize*/ 8) textlabels_changes.xValues = [/*sampSize*/ ctx[3] / 2 + 0.5];
    			if (dirty & /*mYPos*/ 16) textlabels_changes.yValues = /*mYPos*/ ctx[4];

    			if (dirty & /*name, N*/ 68) textlabels_changes.labels = formatLabels([
    				{
    					name: /*name*/ ctx[2],
    					value: /*N*/ ctx[6]
    				}
    			]);

    			textlabels.$set(textlabels_changes);
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			transition_in(textlabels.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			transition_out(textlabels.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(t);
    			destroy_component(textlabels, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$2.name,
    		type: "slot",
    		source: "(18:0) <Axes limX={[0, sampSize + 1]} limY={limY}>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let axes;
    	let current;

    	axes = new Axes({
    			props: {
    				limX: [0, /*sampSize*/ ctx[3] + 1],
    				limY: /*limY*/ ctx[5],
    				$$slots: { default: [create_default_slot$2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(axes.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(axes, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const axes_changes = {};
    			if (dirty & /*sampSize*/ 8) axes_changes.limX = [0, /*sampSize*/ ctx[3] + 1];
    			if (dirty & /*limY*/ 32) axes_changes.limY = /*limY*/ ctx[5];

    			if (dirty & /*$$scope, mSize, sampSize, mYPos, name, N, outcomes*/ 1119) {
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
    			destroy_component(axes, detaching);
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
    	let N;
    	let limY;
    	let mYPos;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('OutcomesColumn', slots, []);
    	let { outcomes } = $$props;
    	let { name = "xxx" } = $$props;
    	let { sampSize } = $$props;
    	let { mSize } = $$props;
    	const writable_props = ['outcomes', 'name', 'sampSize', 'mSize'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<OutcomesColumn> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('outcomes' in $$props) $$invalidate(1, outcomes = $$props.outcomes);
    		if ('name' in $$props) $$invalidate(2, name = $$props.name);
    		if ('sampSize' in $$props) $$invalidate(3, sampSize = $$props.sampSize);
    		if ('mSize' in $$props) $$invalidate(0, mSize = $$props.mSize);
    	};

    	$$self.$capture_state = () => ({
    		Axes,
    		TextLabels,
    		formatLabels,
    		SampleSeries,
    		outcomes,
    		name,
    		sampSize,
    		mSize,
    		mYPos,
    		limY,
    		N
    	});

    	$$self.$inject_state = $$props => {
    		if ('outcomes' in $$props) $$invalidate(1, outcomes = $$props.outcomes);
    		if ('name' in $$props) $$invalidate(2, name = $$props.name);
    		if ('sampSize' in $$props) $$invalidate(3, sampSize = $$props.sampSize);
    		if ('mSize' in $$props) $$invalidate(0, mSize = $$props.mSize);
    		if ('mYPos' in $$props) $$invalidate(4, mYPos = $$props.mYPos);
    		if ('limY' in $$props) $$invalidate(5, limY = $$props.limY);
    		if ('N' in $$props) $$invalidate(6, N = $$props.N);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*outcomes*/ 2) {
    			$$invalidate(6, N = outcomes.length);
    		}

    		if ($$self.$$.dirty & /*sampSize*/ 8) {
    			$$invalidate(5, limY = sampSize == 4
    			? [-1.5, 2 ** sampSize + 1]
    			: [-4.5, 2 ** sampSize + 0.5]);
    		}

    		if ($$self.$$.dirty & /*sampSize*/ 8) {
    			$$invalidate(4, mYPos = sampSize == 4 ? [-1] : [-2]);
    		}

    		if ($$self.$$.dirty & /*sampSize*/ 8) {
    			$$invalidate(0, mSize = sampSize == 4 ? 2 : 1);
    		}
    	};

    	return [mSize, outcomes, name, sampSize, mYPos, limY, N];
    }

    class OutcomesColumn extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {
    			outcomes: 1,
    			name: 2,
    			sampSize: 3,
    			mSize: 0
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "OutcomesColumn",
    			options,
    			id: create_fragment$3.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*outcomes*/ ctx[1] === undefined && !('outcomes' in props)) {
    			console.warn("<OutcomesColumn> was created without expected prop 'outcomes'");
    		}

    		if (/*sampSize*/ ctx[3] === undefined && !('sampSize' in props)) {
    			console.warn("<OutcomesColumn> was created without expected prop 'sampSize'");
    		}

    		if (/*mSize*/ ctx[0] === undefined && !('mSize' in props)) {
    			console.warn("<OutcomesColumn> was created without expected prop 'mSize'");
    		}
    	}

    	get outcomes() {
    		throw new Error("<OutcomesColumn>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set outcomes(value) {
    		throw new Error("<OutcomesColumn>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get name() {
    		throw new Error("<OutcomesColumn>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set name(value) {
    		throw new Error("<OutcomesColumn>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get sampSize() {
    		throw new Error("<OutcomesColumn>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set sampSize(value) {
    		throw new Error("<OutcomesColumn>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get mSize() {
    		throw new Error("<OutcomesColumn>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set mSize(value) {
    		throw new Error("<OutcomesColumn>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/OutcomesPlot.svelte generated by Svelte v3.48.0 */

    function create_fragment$2(ctx) {
    	let outcomescolumn0;
    	let t0;
    	let outcomescolumn1;
    	let t1;
    	let outcomescolumn2;
    	let current;

    	outcomescolumn0 = new OutcomesColumn({
    			props: {
    				outcomes: /*outcomes2*/ ctx[1],
    				sampSize: /*n*/ ctx[3],
    				name: "more extreme"
    			},
    			$$inline: true
    		});

    	outcomescolumn1 = new OutcomesColumn({
    			props: {
    				outcomes: /*outcomes1*/ ctx[0],
    				sampSize: /*n*/ ctx[3],
    				name: "equally extreme"
    			},
    			$$inline: true
    		});

    	outcomescolumn2 = new OutcomesColumn({
    			props: {
    				outcomes: /*outcomes3*/ ctx[2],
    				sampSize: /*n*/ ctx[3],
    				name: "less extreme"
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(outcomescolumn0.$$.fragment);
    			t0 = space();
    			create_component(outcomescolumn1.$$.fragment);
    			t1 = space();
    			create_component(outcomescolumn2.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(outcomescolumn0, target, anchor);
    			insert_dev(target, t0, anchor);
    			mount_component(outcomescolumn1, target, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(outcomescolumn2, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const outcomescolumn0_changes = {};
    			if (dirty & /*outcomes2*/ 2) outcomescolumn0_changes.outcomes = /*outcomes2*/ ctx[1];
    			if (dirty & /*n*/ 8) outcomescolumn0_changes.sampSize = /*n*/ ctx[3];
    			outcomescolumn0.$set(outcomescolumn0_changes);
    			const outcomescolumn1_changes = {};
    			if (dirty & /*outcomes1*/ 1) outcomescolumn1_changes.outcomes = /*outcomes1*/ ctx[0];
    			if (dirty & /*n*/ 8) outcomescolumn1_changes.sampSize = /*n*/ ctx[3];
    			outcomescolumn1.$set(outcomescolumn1_changes);
    			const outcomescolumn2_changes = {};
    			if (dirty & /*outcomes3*/ 4) outcomescolumn2_changes.outcomes = /*outcomes3*/ ctx[2];
    			if (dirty & /*n*/ 8) outcomescolumn2_changes.sampSize = /*n*/ ctx[3];
    			outcomescolumn2.$set(outcomescolumn2_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(outcomescolumn0.$$.fragment, local);
    			transition_in(outcomescolumn1.$$.fragment, local);
    			transition_in(outcomescolumn2.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(outcomescolumn0.$$.fragment, local);
    			transition_out(outcomescolumn1.$$.fragment, local);
    			transition_out(outcomescolumn2.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(outcomescolumn0, detaching);
    			if (detaching) detach_dev(t0);
    			destroy_component(outcomescolumn1, detaching);
    			if (detaching) detach_dev(t1);
    			destroy_component(outcomescolumn2, detaching);
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
    	let n;
    	let nH;
    	let nT;
    	let N;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('OutcomesPlot', slots, []);
    	let { sample } = $$props;
    	let { tail } = $$props;
    	let { value } = $$props;

    	// create all possible outcomes for given sample size
    	let outcomes = [];

    	// find extremes for head (head means true)
    	// both:  H0: P(H) =  0.5
    	// left:  H0: P(H) <= 0.5
    	// right: H0: P(H) >= 0.5
    	let outcomes1 = [], outcomes2 = [], outcomes3 = [];

    	let N1 = 0, N2 = 0, N3 = 0;
    	const writable_props = ['sample', 'tail', 'value'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<OutcomesPlot> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('sample' in $$props) $$invalidate(5, sample = $$props.sample);
    		if ('tail' in $$props) $$invalidate(6, tail = $$props.tail);
    		if ('value' in $$props) $$invalidate(4, value = $$props.value);
    	};

    	$$self.$capture_state = () => ({
    		seq,
    		sum,
    		min: min$1,
    		OutcomesColumn,
    		sample,
    		tail,
    		value,
    		outcomes,
    		outcomes1,
    		outcomes2,
    		outcomes3,
    		N1,
    		N2,
    		N3,
    		nT,
    		nH,
    		N,
    		n
    	});

    	$$self.$inject_state = $$props => {
    		if ('sample' in $$props) $$invalidate(5, sample = $$props.sample);
    		if ('tail' in $$props) $$invalidate(6, tail = $$props.tail);
    		if ('value' in $$props) $$invalidate(4, value = $$props.value);
    		if ('outcomes' in $$props) $$invalidate(7, outcomes = $$props.outcomes);
    		if ('outcomes1' in $$props) $$invalidate(0, outcomes1 = $$props.outcomes1);
    		if ('outcomes2' in $$props) $$invalidate(1, outcomes2 = $$props.outcomes2);
    		if ('outcomes3' in $$props) $$invalidate(2, outcomes3 = $$props.outcomes3);
    		if ('N1' in $$props) $$invalidate(8, N1 = $$props.N1);
    		if ('N2' in $$props) $$invalidate(9, N2 = $$props.N2);
    		if ('N3' in $$props) $$invalidate(10, N3 = $$props.N3);
    		if ('nT' in $$props) $$invalidate(11, nT = $$props.nT);
    		if ('nH' in $$props) $$invalidate(12, nH = $$props.nH);
    		if ('N' in $$props) N = $$props.N;
    		if ('n' in $$props) $$invalidate(3, n = $$props.n);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*sample*/ 32) {
    			// sample size, number of heads and tails
    			$$invalidate(3, n = sample.length);
    		}

    		if ($$self.$$.dirty & /*sample*/ 32) {
    			$$invalidate(12, nH = sum(sample));
    		}

    		if ($$self.$$.dirty & /*n, nH*/ 4104) {
    			$$invalidate(11, nT = n - nH);
    		}

    		if ($$self.$$.dirty & /*n*/ 8) {
    			$$invalidate(7, outcomes = seq(0, 2 ** n - 1).map(v => [...(v >>> 0).toString(2).padStart(n, "0")].map(v => v === "1")));
    		}

    		if ($$self.$$.dirty & /*outcomes*/ 128) {
    			N = outcomes.length;
    		}

    		if ($$self.$$.dirty & /*tail, outcomes, nH, nT, outcomes1, outcomes2, outcomes3, N1, N2, N3*/ 8135) {
    			{
    				if (tail == "left") {
    					$$invalidate(0, outcomes1 = outcomes.filter(v => sum(v) == nH));
    					$$invalidate(1, outcomes2 = outcomes.filter(v => sum(v) < nH));
    					$$invalidate(2, outcomes3 = outcomes.filter(v => sum(v) > nH));
    				} else if (tail == "right") {
    					$$invalidate(0, outcomes1 = outcomes.filter(v => sum(v) == nH));
    					$$invalidate(1, outcomes2 = outcomes.filter(v => sum(v) > nH));
    					$$invalidate(2, outcomes3 = outcomes.filter(v => sum(v) < nH));
    				} else {
    					$$invalidate(0, outcomes1 = outcomes.filter(v => sum(v) == min$1([nH, nT]) | nH + nT - sum(v) == min$1([nH, nT])));
    					$$invalidate(1, outcomes2 = outcomes.filter(v => sum(v) < min$1([nH, nT]) | nH + nT - sum(v) < min$1([nH, nT])));
    					$$invalidate(2, outcomes3 = outcomes.filter(v => !(sum(v) <= min$1([nH, nT]) | nH + nT - sum(v) <= min$1([nH, nT]))));
    				}

    				$$invalidate(8, N1 = outcomes1.length);
    				$$invalidate(9, N2 = outcomes2.length);
    				$$invalidate(10, N3 = outcomes3.length);
    				$$invalidate(4, value = [N1, N2, N3]);
    			}
    		}
    	};

    	return [
    		outcomes1,
    		outcomes2,
    		outcomes3,
    		n,
    		value,
    		sample,
    		tail,
    		outcomes,
    		N1,
    		N2,
    		N3,
    		nT,
    		nH
    	];
    }

    class OutcomesPlot extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { sample: 5, tail: 6, value: 4 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "OutcomesPlot",
    			options,
    			id: create_fragment$2.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*sample*/ ctx[5] === undefined && !('sample' in props)) {
    			console.warn("<OutcomesPlot> was created without expected prop 'sample'");
    		}

    		if (/*tail*/ ctx[6] === undefined && !('tail' in props)) {
    			console.warn("<OutcomesPlot> was created without expected prop 'tail'");
    		}

    		if (/*value*/ ctx[4] === undefined && !('value' in props)) {
    			console.warn("<OutcomesPlot> was created without expected prop 'value'");
    		}
    	}

    	get sample() {
    		throw new Error("<OutcomesPlot>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set sample(value) {
    		throw new Error("<OutcomesPlot>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get tail() {
    		throw new Error("<OutcomesPlot>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set tail(value) {
    		throw new Error("<OutcomesPlot>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get value() {
    		throw new Error("<OutcomesPlot>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set value(value) {
    		throw new Error("<OutcomesPlot>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/SamplePlot.svelte generated by Svelte v3.48.0 */

    // (8:0) {#if sample.length > 0}
    function create_if_block(ctx) {
    	let axes;
    	let current;

    	axes = new Axes({
    			props: {
    				limX: [0, /*sample*/ ctx[0].length + 1],
    				limY: [-1, 1],
    				$$slots: { default: [create_default_slot$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(axes.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(axes, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const axes_changes = {};
    			if (dirty & /*sample*/ 1) axes_changes.limX = [0, /*sample*/ ctx[0].length + 1];

    			if (dirty & /*$$scope, sample*/ 3) {
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
    			destroy_component(axes, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(8:0) {#if sample.length > 0}",
    		ctx
    	});

    	return block;
    }

    // (9:0) <Axes limX={[0, sample.length + 1]} limY={[-1, 1]} >
    function create_default_slot$1(ctx) {
    	let sampleseries;
    	let current;

    	sampleseries = new SampleSeries({
    			props: {
    				sample: /*sample*/ ctx[0],
    				markerSize: /*sample*/ ctx[0].length === 4 ? 4 : 3
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(sampleseries.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(sampleseries, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const sampleseries_changes = {};
    			if (dirty & /*sample*/ 1) sampleseries_changes.sample = /*sample*/ ctx[0];
    			if (dirty & /*sample*/ 1) sampleseries_changes.markerSize = /*sample*/ ctx[0].length === 4 ? 4 : 3;
    			sampleseries.$set(sampleseries_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(sampleseries.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(sampleseries.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(sampleseries, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$1.name,
    		type: "slot",
    		source: "(9:0) <Axes limX={[0, sample.length + 1]} limY={[-1, 1]} >",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let if_block_anchor;
    	let current;
    	let if_block = /*sample*/ ctx[0].length > 0 && create_if_block(ctx);

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
    			if (/*sample*/ ctx[0].length > 0) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*sample*/ 1) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block(ctx);
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
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('SamplePlot', slots, []);
    	let { sample = [] } = $$props;
    	const writable_props = ['sample'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<SamplePlot> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('sample' in $$props) $$invalidate(0, sample = $$props.sample);
    	};

    	$$self.$capture_state = () => ({ Axes, SampleSeries, sample });

    	$$self.$inject_state = $$props => {
    		if ('sample' in $$props) $$invalidate(0, sample = $$props.sample);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [sample];
    }

    class SamplePlot extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { sample: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "SamplePlot",
    			options,
    			id: create_fragment$1.name
    		});
    	}

    	get sample() {
    		throw new Error("<SamplePlot>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set sample(value) {
    		throw new Error("<SamplePlot>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/App.svelte generated by Svelte v3.48.0 */
    const file = "src/App.svelte";

    // (73:9) <AppControlArea>
    function create_default_slot_1(ctx) {
    	let appcontrolswitch0;
    	let updating_value;
    	let t0;
    	let appcontrolswitch1;
    	let updating_value_1;
    	let t1;
    	let appcontrolbutton;
    	let current;

    	function appcontrolswitch0_value_binding(value) {
    		/*appcontrolswitch0_value_binding*/ ctx[9](value);
    	}

    	let appcontrolswitch0_props = {
    		id: "tail",
    		label: "Tail",
    		options: ["left", "both", "right"]
    	};

    	if (/*tail*/ ctx[2] !== void 0) {
    		appcontrolswitch0_props.value = /*tail*/ ctx[2];
    	}

    	appcontrolswitch0 = new AppControlSwitch({
    			props: appcontrolswitch0_props,
    			$$inline: true
    		});

    	binding_callbacks.push(() => bind(appcontrolswitch0, 'value', appcontrolswitch0_value_binding));

    	function appcontrolswitch1_value_binding(value) {
    		/*appcontrolswitch1_value_binding*/ ctx[10](value);
    	}

    	let appcontrolswitch1_props = {
    		id: "sampleSize",
    		label: "Sample size",
    		options: [4, 6]
    	};

    	if (/*sampSize*/ ctx[0] !== void 0) {
    		appcontrolswitch1_props.value = /*sampSize*/ ctx[0];
    	}

    	appcontrolswitch1 = new AppControlSwitch({
    			props: appcontrolswitch1_props,
    			$$inline: true
    		});

    	binding_callbacks.push(() => bind(appcontrolswitch1, 'value', appcontrolswitch1_value_binding));

    	appcontrolbutton = new AppControlButton({
    			props: {
    				id: "newSample",
    				label: "Sample",
    				text: "Take new"
    			},
    			$$inline: true
    		});

    	appcontrolbutton.$on("click", /*click_handler*/ ctx[11]);

    	const block = {
    		c: function create() {
    			create_component(appcontrolswitch0.$$.fragment);
    			t0 = space();
    			create_component(appcontrolswitch1.$$.fragment);
    			t1 = space();
    			create_component(appcontrolbutton.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(appcontrolswitch0, target, anchor);
    			insert_dev(target, t0, anchor);
    			mount_component(appcontrolswitch1, target, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(appcontrolbutton, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const appcontrolswitch0_changes = {};

    			if (!updating_value && dirty & /*tail*/ 4) {
    				updating_value = true;
    				appcontrolswitch0_changes.value = /*tail*/ ctx[2];
    				add_flush_callback(() => updating_value = false);
    			}

    			appcontrolswitch0.$set(appcontrolswitch0_changes);
    			const appcontrolswitch1_changes = {};

    			if (!updating_value_1 && dirty & /*sampSize*/ 1) {
    				updating_value_1 = true;
    				appcontrolswitch1_changes.value = /*sampSize*/ ctx[0];
    				add_flush_callback(() => updating_value_1 = false);
    			}

    			appcontrolswitch1.$set(appcontrolswitch1_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(appcontrolswitch0.$$.fragment, local);
    			transition_in(appcontrolswitch1.$$.fragment, local);
    			transition_in(appcontrolbutton.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(appcontrolswitch0.$$.fragment, local);
    			transition_out(appcontrolswitch1.$$.fragment, local);
    			transition_out(appcontrolbutton.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(appcontrolswitch0, detaching);
    			if (detaching) detach_dev(t0);
    			destroy_component(appcontrolswitch1, detaching);
    			if (detaching) detach_dev(t1);
    			destroy_component(appcontrolbutton, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1.name,
    		type: "slot",
    		source: "(73:9) <AppControlArea>",
    		ctx
    	});

    	return block;
    }

    // (45:0) <StatApp>
    function create_default_slot(ctx) {
    	let div4;
    	let div0;
    	let outcomesplot;
    	let updating_value;
    	let t0;
    	let div1;
    	let sampleplot;
    	let t1;
    	let div2;
    	let datatable;
    	let t2;
    	let div3;
    	let appcontrolarea;
    	let current;

    	function outcomesplot_value_binding(value) {
    		/*outcomesplot_value_binding*/ ctx[8](value);
    	}

    	let outcomesplot_props = {
    		sample: /*sample*/ ctx[1],
    		tail: /*tail*/ ctx[2]
    	};

    	if (/*N*/ ctx[3] !== void 0) {
    		outcomesplot_props.value = /*N*/ ctx[3];
    	}

    	outcomesplot = new OutcomesPlot({
    			props: outcomesplot_props,
    			$$inline: true
    		});

    	binding_callbacks.push(() => bind(outcomesplot, 'value', outcomesplot_value_binding));

    	sampleplot = new SamplePlot({
    			props: { sample: /*sample*/ ctx[1] },
    			$$inline: true
    		});

    	datatable = new DataTable({
    			props: {
    				variables: [
    					{
    						label: "Null hypothesis:",
    						values: [/*h0Str*/ ctx[6]]
    					},
    					{
    						label: "Sample proportion:",
    						values: [/*sampPropStr*/ ctx[5]]
    					},
    					{
    						label: "p-value:",
    						values: [/*pValStr*/ ctx[4]]
    					}
    				],
    				decNum: [-1, -1, -1],
    				horizontal: true
    			},
    			$$inline: true
    		});

    	appcontrolarea = new AppControlArea({
    			props: {
    				$$slots: { default: [create_default_slot_1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div4 = element("div");
    			div0 = element("div");
    			create_component(outcomesplot.$$.fragment);
    			t0 = space();
    			div1 = element("div");
    			create_component(sampleplot.$$.fragment);
    			t1 = space();
    			div2 = element("div");
    			create_component(datatable.$$.fragment);
    			t2 = space();
    			div3 = element("div");
    			create_component(appcontrolarea.$$.fragment);
    			attr_dev(div0, "class", "app-outcomes-plot-area svelte-1mxoi52");
    			add_location(div0, file, 48, 6, 1601);
    			attr_dev(div1, "class", "app-sample-plot-area svelte-1mxoi52");
    			add_location(div1, file, 53, 6, 1756);
    			attr_dev(div2, "class", "app-stattable-area svelte-1mxoi52");
    			add_location(div2, file, 58, 6, 1875);
    			attr_dev(div3, "class", "app-controls-area svelte-1mxoi52");
    			add_location(div3, file, 71, 6, 2281);
    			attr_dev(div4, "class", "app-layout svelte-1mxoi52");
    			add_location(div4, file, 45, 3, 1514);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div4, anchor);
    			append_dev(div4, div0);
    			mount_component(outcomesplot, div0, null);
    			append_dev(div4, t0);
    			append_dev(div4, div1);
    			mount_component(sampleplot, div1, null);
    			append_dev(div4, t1);
    			append_dev(div4, div2);
    			mount_component(datatable, div2, null);
    			append_dev(div4, t2);
    			append_dev(div4, div3);
    			mount_component(appcontrolarea, div3, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const outcomesplot_changes = {};
    			if (dirty & /*sample*/ 2) outcomesplot_changes.sample = /*sample*/ ctx[1];
    			if (dirty & /*tail*/ 4) outcomesplot_changes.tail = /*tail*/ ctx[2];

    			if (!updating_value && dirty & /*N*/ 8) {
    				updating_value = true;
    				outcomesplot_changes.value = /*N*/ ctx[3];
    				add_flush_callback(() => updating_value = false);
    			}

    			outcomesplot.$set(outcomesplot_changes);
    			const sampleplot_changes = {};
    			if (dirty & /*sample*/ 2) sampleplot_changes.sample = /*sample*/ ctx[1];
    			sampleplot.$set(sampleplot_changes);
    			const datatable_changes = {};

    			if (dirty & /*h0Str, sampPropStr, pValStr*/ 112) datatable_changes.variables = [
    				{
    					label: "Null hypothesis:",
    					values: [/*h0Str*/ ctx[6]]
    				},
    				{
    					label: "Sample proportion:",
    					values: [/*sampPropStr*/ ctx[5]]
    				},
    				{
    					label: "p-value:",
    					values: [/*pValStr*/ ctx[4]]
    				}
    			];

    			datatable.$set(datatable_changes);
    			const appcontrolarea_changes = {};

    			if (dirty & /*$$scope, sample, sampSize, tail*/ 8199) {
    				appcontrolarea_changes.$$scope = { dirty, ctx };
    			}

    			appcontrolarea.$set(appcontrolarea_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(outcomesplot.$$.fragment, local);
    			transition_in(sampleplot.$$.fragment, local);
    			transition_in(datatable.$$.fragment, local);
    			transition_in(appcontrolarea.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(outcomesplot.$$.fragment, local);
    			transition_out(sampleplot.$$.fragment, local);
    			transition_out(datatable.$$.fragment, local);
    			transition_out(appcontrolarea.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div4);
    			destroy_component(outcomesplot);
    			destroy_component(sampleplot);
    			destroy_component(datatable);
    			destroy_component(appcontrolarea);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(45:0) <StatApp>",
    		ctx
    	});

    	return block;
    }

    // (82:3) 
    function create_help_slot(ctx) {
    	let div;
    	let h2;
    	let t1;
    	let p0;
    	let t3;
    	let p1;
    	let em0;
    	let t5;
    	let p2;
    	let t6;
    	let em1;
    	let t8;
    	let em2;
    	let t10;
    	let em3;
    	let t12;
    	let strong;
    	let t14;
    	let t15;
    	let p3;
    	let t16;
    	let em4;
    	let t18;
    	let em5;
    	let t20;
    	let em6;
    	let t22;

    	const block = {
    		c: function create() {
    			div = element("div");
    			h2 = element("h2");
    			h2.textContent = "What is p-value?";
    			t1 = space();
    			p0 = element("p");
    			p0.textContent = "This app helps to understand the meaning of a p-value in hypotheses testing:";
    			t3 = space();
    			p1 = element("p");
    			em0 = element("em");
    			em0.textContent = "p-value is a chance to get a sample as extreme as the one you have or even more extreme assuming\n         that the null hypothesis (H0) is true.";
    			t5 = space();
    			p2 = element("p");
    			t6 = text("In case if all outcomes of an experiment are equally likely, to compute a p-value we need to\n         know: ");
    			em1 = element("em");
    			em1.textContent = "N1";
    			t8 = text(" — number of possible outcomes which will be as extreme as the one we currently\n         have, ");
    			em2 = element("em");
    			em2.textContent = "N2";
    			t10 = text(" — number of outcomes which will be more extreme for given H0, and ");
    			em3 = element("em");
    			em3.textContent = "N";
    			t12 = text(" —\n         total number of all possible outcomes. In this case the p-value can be computed as:\n         ");
    			strong = element("strong");
    			strong.textContent = "p = (N1 + N2)/N";
    			t14 = text(".");
    			t15 = space();
    			p3 = element("p");
    			t16 = text("However, when we deal with continuous variables, number of possible outcomes is infinite and\n         different outcomes may have different probabilities, therefore we have to use theoretical distributions for\n         computing chances, which will be also shown in next apps. But in this app we introduce p-values based on\n         experiment with limited number of outcomes — tossing a balanced coin several times\n         (4 or 6). So we can count ");
    			em4 = element("em");
    			em4.textContent = "N1";
    			t18 = text(", ");
    			em5 = element("em");
    			em5.textContent = "N2";
    			t20 = text(" and ");
    			em6 = element("em");
    			em6.textContent = "N";
    			t22 = text(" and compute the p-value manually.");
    			add_location(h2, file, 82, 6, 2757);
    			add_location(p0, file, 83, 6, 2789);
    			add_location(em0, file, 86, 9, 2899);
    			add_location(p1, file, 86, 6, 2896);
    			add_location(em1, file, 93, 15, 3202);
    			add_location(em2, file, 94, 15, 3308);
    			add_location(em3, file, 94, 93, 3386);
    			add_location(strong, file, 96, 9, 3501);
    			add_location(p2, file, 91, 6, 3081);
    			add_location(em4, file, 103, 35, 4016);
    			add_location(em5, file, 103, 48, 4029);
    			add_location(em6, file, 103, 64, 4045);
    			add_location(p3, file, 98, 6, 3552);
    			attr_dev(div, "slot", "help");
    			add_location(div, file, 81, 3, 2733);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, h2);
    			append_dev(div, t1);
    			append_dev(div, p0);
    			append_dev(div, t3);
    			append_dev(div, p1);
    			append_dev(p1, em0);
    			append_dev(div, t5);
    			append_dev(div, p2);
    			append_dev(p2, t6);
    			append_dev(p2, em1);
    			append_dev(p2, t8);
    			append_dev(p2, em2);
    			append_dev(p2, t10);
    			append_dev(p2, em3);
    			append_dev(p2, t12);
    			append_dev(p2, strong);
    			append_dev(p2, t14);
    			append_dev(div, t15);
    			append_dev(div, p3);
    			append_dev(p3, t16);
    			append_dev(p3, em4);
    			append_dev(p3, t18);
    			append_dev(p3, em5);
    			append_dev(p3, t20);
    			append_dev(p3, em6);
    			append_dev(p3, t22);
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
    		source: "(82:3) ",
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

    			if (dirty & /*$$scope, sample, sampSize, tail, h0Str, sampPropStr, pValStr, N*/ 8319) {
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
    	let h0Str;
    	let sampPropStr;
    	let pValStr;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	const signs = { "both": "=", "left": "≥", "right": "≤" };

    	// variable parameters
    	let sampSize = 4;

    	let sample;
    	let tail = "both";

    	// number of outcomes [same extreme, more extreme, less extreme] - is binded
    	let N = [];

    	// function to get a new sample based on uniform distribution
    	function takeNewSample() {
    		return runif(sampSize).map(x => x > 0.5);
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	function outcomesplot_value_binding(value) {
    		N = value;
    		$$invalidate(3, N);
    	}

    	function appcontrolswitch0_value_binding(value) {
    		tail = value;
    		$$invalidate(2, tail);
    	}

    	function appcontrolswitch1_value_binding(value) {
    		sampSize = value;
    		$$invalidate(0, sampSize);
    	}

    	const click_handler = () => $$invalidate(1, sample = takeNewSample());

    	$$self.$capture_state = () => ({
    		runif,
    		sum,
    		subset,
    		StatApp,
    		AppControlArea,
    		AppControlButton,
    		AppControlSwitch,
    		DataTable,
    		OutcomesPlot,
    		SamplePlot,
    		signs,
    		sampSize,
    		sample,
    		tail,
    		N,
    		takeNewSample,
    		pValStr,
    		sampPropStr,
    		h0Str
    	});

    	$$self.$inject_state = $$props => {
    		if ('sampSize' in $$props) $$invalidate(0, sampSize = $$props.sampSize);
    		if ('sample' in $$props) $$invalidate(1, sample = $$props.sample);
    		if ('tail' in $$props) $$invalidate(2, tail = $$props.tail);
    		if ('N' in $$props) $$invalidate(3, N = $$props.N);
    		if ('pValStr' in $$props) $$invalidate(4, pValStr = $$props.pValStr);
    		if ('sampPropStr' in $$props) $$invalidate(5, sampPropStr = $$props.sampPropStr);
    		if ('h0Str' in $$props) $$invalidate(6, h0Str = $$props.h0Str);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*sampSize*/ 1) {
    			// take new sample when sample size is changed
    			$$invalidate(1, sample = takeNewSample());
    		}

    		if ($$self.$$.dirty & /*tail*/ 4) {
    			// strings for statistics table
    			$$invalidate(6, h0Str = `π(<span style="color:#336688">o</span>) ${signs[tail]} 0.5`);
    		}

    		if ($$self.$$.dirty & /*sample*/ 2) {
    			$$invalidate(5, sampPropStr = (sum(sample) / sample.length).toFixed(3));
    		}

    		if ($$self.$$.dirty & /*N*/ 8) {
    			$$invalidate(4, pValStr = N.length == 3
    			? `
      (${N[1]} + ${N[0]}) / (${N[1]} + ${N[0]} + ${N[2]}) = ${(sum(subset(N, [1, 2])) / sum(N)).toFixed(3)}`
    			: "");
    		}
    	};

    	return [
    		sampSize,
    		sample,
    		tail,
    		N,
    		pValStr,
    		sampPropStr,
    		h0Str,
    		takeNewSample,
    		outcomesplot_value_binding,
    		appcontrolswitch0_value_binding,
    		appcontrolswitch1_value_binding,
    		click_handler
    	];
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
//# sourceMappingURL=asta-b205.js.map
