
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
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
    function update_slot(slot, slot_definition, ctx, $$scope, dirty, get_slot_changes_fn, get_slot_context_fn) {
        const slot_changes = get_slot_changes(slot_definition, $$scope, dirty, get_slot_changes_fn);
        if (slot_changes) {
            const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
            slot.p(slot_context, slot_changes);
        }
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
    function to_number(value) {
        return value === '' ? null : +value;
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
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
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
    }
    function setContext(key, context) {
        get_current_component().$$.context.set(key, context);
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
            callbacks.slice().forEach(fn => fn(event));
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
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
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
        flushing = false;
        seen_callbacks.clear();
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

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);

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
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
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
            context: new Map(parent_component ? parent_component.$$.context : options.context || []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
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
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.38.2' }, detail)));
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
     * Computes a range of values in a vector with a margin
     * @param {number[]} x - vector with values
     * @param {number} margin - margin in parts of one (e.g. 0.1 for 10% or 2 for 200%)
     * @returns{number[]} array with marginal range boundaries
     */
    function mrange(x, margin) {
       const mn = min(x);
       const mx = max(x);
       const d = mx - mn;

       return [mn - d * margin, max(x) + d * margin];
    }


    /**
     * Probability density function for normal distribution
     * @param {Array} x - vector of values
     * @param {number} mu - average value of the population
     * @param {number} sigma - standard deviation of the population
     * @returns {Array} vector with densities
     */
    function dnorm(x, mu = 0, sigma = 1) {

       if (!Array.isArray(x)) x = [x];

       const n = x.length;
       const A = 1 / (Math.sqrt(2 * Math.PI) * sigma);
       const frac = -0.5 / sigma ** 2;

       let d = Array(n);
       for (let i = 0; i < n; i++) {
          const df = x[i] - mu;
          d[i] = A * Math.exp(frac * df * df);
       }

       return x.length === 1 ? d[0] : d;
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
     */
    function subset(x, indices) {

       if (!Array.isArray(x)) x = [x];
       if (!Array.isArray(indices)) indices = [indices];

       if (max(indices) > x.length || min(indices) < 1) {
          throw new Error("Parameter 'indices' must have values between 1 and 'x.length'.");
       }

       const n = indices.length;
       let out = Array(n);
       for (let i = 0; i < n; i++) {
          out[i] = x[indices[i] - 1];
       }

       return out;
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


    /**
     * Shuffles values in vector x using Fisher–Yates algorithm
     * @param {Array} x - a vector with values
     */
    function shuffle(x) {
      let y = [...x];
      let n = y.length;
      let t, i;

      while (n) {
        i = Math.floor(Math.random() * n--);
        t = y[n];
        y[n] = y[i];
        y[i] = t;
      }

      return y;
    }

    /* ../shared/StatApp.svelte generated by Svelte v3.38.2 */
    const file$d = "../shared/StatApp.svelte";
    const get_help_slot_changes = dirty => ({});
    const get_help_slot_context = ctx => ({});

    // (41:3) {:else}
    function create_else_block(ctx) {
    	let div;
    	let current;
    	const help_slot_template = /*#slots*/ ctx[5].help;
    	const help_slot = create_slot(help_slot_template, ctx, /*$$scope*/ ctx[4], get_help_slot_context);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (help_slot) help_slot.c();
    			attr_dev(div, "class", "helptext svelte-d5wxow");
    			add_location(div, file$d, 41, 3, 905);
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
    				if (help_slot.p && (!current || dirty & /*$$scope*/ 16)) {
    					update_slot(help_slot, help_slot_template, ctx, /*$$scope*/ ctx[4], dirty, get_help_slot_changes, get_help_slot_context);
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
    		id: create_else_block.name,
    		type: "else",
    		source: "(41:3) {:else}",
    		ctx
    	});

    	return block;
    }

    // (36:3) {#if !showHelp}
    function create_if_block$7(ctx) {
    	let div;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[5].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[4], null);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (default_slot) default_slot.c();
    			attr_dev(div, "class", "content svelte-d5wxow");
    			add_location(div, file$d, 36, 3, 841);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 16)) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[4], dirty, null, null);
    				}
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
    			if (detaching) detach_dev(div);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$7.name,
    		type: "if",
    		source: "(36:3) {#if !showHelp}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$h(ctx) {
    	let main;
    	let current_block_type_index;
    	let if_block;
    	let main_class_value;
    	let current;
    	let mounted;
    	let dispose;
    	const if_block_creators = [create_if_block$7, create_else_block];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (!/*showHelp*/ ctx[0]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			main = element("main");
    			if_block.c();
    			attr_dev(main, "class", main_class_value = "mdatools-app mdatools-app_" + /*scale*/ ctx[1] + " svelte-d5wxow");
    			add_location(main, file$d, 33, 0, 744);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			if_blocks[current_block_type_index].m(main, null);
    			/*main_binding*/ ctx[6](main);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(window, "keypress", /*handleKeyPress*/ ctx[3], false, false, false);
    				mounted = true;
    			}
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
    				if_block.m(main, null);
    			}

    			if (!current || dirty & /*scale*/ 2 && main_class_value !== (main_class_value = "mdatools-app mdatools-app_" + /*scale*/ ctx[1] + " svelte-d5wxow")) {
    				attr_dev(main, "class", main_class_value);
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
    			if (detaching) detach_dev(main);
    			if_blocks[current_block_type_index].d();
    			/*main_binding*/ ctx[6](null);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$h.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$h($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("StatApp", slots, ['default','help']);
    	let showHelp = false;
    	let scale = "medium";
    	let appContainer;
    	const toggleHelp = () => $$invalidate(0, showHelp = !showHelp);

    	const getScale = function (width, height) {
    		if (width < 959) return "small";
    		if (width < 1279) return "medium";
    		return "large";
    	};

    	/* observer for the plotting area size */
    	var ro = new ResizeObserver(entries => {
    			for (let entry of entries) {
    				const cr = entry.contentRect;
    				$$invalidate(1, scale = getScale(cr.width, cr.height));
    			}
    		});

    	const handleKeyPress = e => {
    		if (e.key === "h") toggleHelp();
    	};

    	onMount(() => {
    		ro.observe(appContainer);
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<StatApp> was created with unknown prop '${key}'`);
    	});

    	function main_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			appContainer = $$value;
    			$$invalidate(2, appContainer);
    		});
    	}

    	$$self.$$set = $$props => {
    		if ("$$scope" in $$props) $$invalidate(4, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		showHelp,
    		scale,
    		appContainer,
    		toggleHelp,
    		getScale,
    		ro,
    		handleKeyPress
    	});

    	$$self.$inject_state = $$props => {
    		if ("showHelp" in $$props) $$invalidate(0, showHelp = $$props.showHelp);
    		if ("scale" in $$props) $$invalidate(1, scale = $$props.scale);
    		if ("appContainer" in $$props) $$invalidate(2, appContainer = $$props.appContainer);
    		if ("ro" in $$props) ro = $$props.ro;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [showHelp, scale, appContainer, handleKeyPress, $$scope, slots, main_binding];
    }

    class StatApp extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$h, create_fragment$h, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "StatApp",
    			options,
    			id: create_fragment$h.name
    		});
    	}
    }

    /* ../shared/controls/AppControlArea.svelte generated by Svelte v3.38.2 */

    const file$c = "../shared/controls/AppControlArea.svelte";

    // (7:3) {#if errormsg}
    function create_if_block$6(ctx) {
    	let div;
    	let t;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t = text(/*errormsg*/ ctx[0]);
    			attr_dev(div, "class", "app-control-error svelte-8w06qs");
    			add_location(div, file$c, 6, 17, 126);
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

    function create_fragment$g(ctx) {
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
    			add_location(fieldset, file$c, 4, 0, 56);
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
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[1], dirty, null, null);
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
    		id: create_fragment$g.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$g($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("AppControlArea", slots, ['default']);
    	let { errormsg = undefined } = $$props;
    	const writable_props = ["errormsg"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<AppControlArea> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("errormsg" in $$props) $$invalidate(0, errormsg = $$props.errormsg);
    		if ("$$scope" in $$props) $$invalidate(1, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({ errormsg });

    	$$self.$inject_state = $$props => {
    		if ("errormsg" in $$props) $$invalidate(0, errormsg = $$props.errormsg);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [errormsg, $$scope, slots];
    }

    class AppControlArea extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$g, create_fragment$g, safe_not_equal, { errormsg: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "AppControlArea",
    			options,
    			id: create_fragment$g.name
    		});
    	}

    	get errormsg() {
    		throw new Error("<AppControlArea>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set errormsg(value) {
    		throw new Error("<AppControlArea>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* ../shared/controls/AppControl.svelte generated by Svelte v3.38.2 */

    const file$b = "../shared/controls/AppControl.svelte";

    function create_fragment$f(ctx) {
    	let div;
    	let label_1;
    	let t;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[3].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[2], null);

    	const block = {
    		c: function create() {
    			div = element("div");
    			label_1 = element("label");
    			t = space();
    			if (default_slot) default_slot.c();
    			attr_dev(label_1, "for", /*id*/ ctx[0]);
    			attr_dev(label_1, "class", "svelte-u0fryu");
    			add_location(label_1, file$b, 6, 3, 88);
    			attr_dev(div, "class", "app-control svelte-u0fryu");
    			add_location(div, file$b, 5, 0, 59);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, label_1);
    			label_1.innerHTML = /*label*/ ctx[1];
    			append_dev(div, t);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (!current || dirty & /*label*/ 2) label_1.innerHTML = /*label*/ ctx[1];
    			if (!current || dirty & /*id*/ 1) {
    				attr_dev(label_1, "for", /*id*/ ctx[0]);
    			}

    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 4)) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[2], dirty, null, null);
    				}
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
    			if (detaching) detach_dev(div);
    			if (default_slot) default_slot.d(detaching);
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
    	validate_slots("AppControl", slots, ['default']);
    	let { id } = $$props;
    	let { label } = $$props;
    	const writable_props = ["id", "label"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<AppControl> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("id" in $$props) $$invalidate(0, id = $$props.id);
    		if ("label" in $$props) $$invalidate(1, label = $$props.label);
    		if ("$$scope" in $$props) $$invalidate(2, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({ id, label });

    	$$self.$inject_state = $$props => {
    		if ("id" in $$props) $$invalidate(0, id = $$props.id);
    		if ("label" in $$props) $$invalidate(1, label = $$props.label);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [id, label, $$scope, slots];
    }

    class AppControl extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$f, create_fragment$f, safe_not_equal, { id: 0, label: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "AppControl",
    			options,
    			id: create_fragment$f.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*id*/ ctx[0] === undefined && !("id" in props)) {
    			console.warn("<AppControl> was created without expected prop 'id'");
    		}

    		if (/*label*/ ctx[1] === undefined && !("label" in props)) {
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
    }

    /* ../shared/controls/AppControlButton.svelte generated by Svelte v3.38.2 */
    const file$a = "../shared/controls/AppControlButton.svelte";

    // (9:0) <AppControl id={id} label={label} >
    function create_default_slot$6(ctx) {
    	let button;
    	let t;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			t = text(/*text*/ ctx[2]);
    			attr_dev(button, "class", "svelte-16fv6fd");
    			add_location(button, file$a, 9, 3, 168);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, t);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler*/ ctx[3], false, false, false);
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
    		id: create_default_slot$6.name,
    		type: "slot",
    		source: "(9:0) <AppControl id={id} label={label} >",
    		ctx
    	});

    	return block;
    }

    function create_fragment$e(ctx) {
    	let appcontrol;
    	let current;

    	appcontrol = new AppControl({
    			props: {
    				id: /*id*/ ctx[0],
    				label: /*label*/ ctx[1],
    				$$slots: { default: [create_default_slot$6] },
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

    			if (dirty & /*$$scope, text*/ 20) {
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
    		id: create_fragment$e.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$e($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("AppControlButton", slots, []);
    	let { id } = $$props;
    	let { label } = $$props;
    	let { text } = $$props;
    	const writable_props = ["id", "label", "text"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<AppControlButton> was created with unknown prop '${key}'`);
    	});

    	function click_handler(event) {
    		bubble($$self, event);
    	}

    	$$self.$$set = $$props => {
    		if ("id" in $$props) $$invalidate(0, id = $$props.id);
    		if ("label" in $$props) $$invalidate(1, label = $$props.label);
    		if ("text" in $$props) $$invalidate(2, text = $$props.text);
    	};

    	$$self.$capture_state = () => ({ AppControl, id, label, text });

    	$$self.$inject_state = $$props => {
    		if ("id" in $$props) $$invalidate(0, id = $$props.id);
    		if ("label" in $$props) $$invalidate(1, label = $$props.label);
    		if ("text" in $$props) $$invalidate(2, text = $$props.text);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [id, label, text, click_handler];
    }

    class AppControlButton extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$e, create_fragment$e, safe_not_equal, { id: 0, label: 1, text: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "AppControlButton",
    			options,
    			id: create_fragment$e.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*id*/ ctx[0] === undefined && !("id" in props)) {
    			console.warn("<AppControlButton> was created without expected prop 'id'");
    		}

    		if (/*label*/ ctx[1] === undefined && !("label" in props)) {
    			console.warn("<AppControlButton> was created without expected prop 'label'");
    		}

    		if (/*text*/ ctx[2] === undefined && !("text" in props)) {
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

    /* ../shared/controls/AppControlSwitch.svelte generated by Svelte v3.38.2 */
    const file$9 = "../shared/controls/AppControlSwitch.svelte";

    function get_each_context$3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[6] = list[i];
    	return child_ctx;
    }

    // (14:6) {#each options as option (option)}
    function create_each_block$3(key_1, ctx) {
    	let div;
    	let t_value = /*option*/ ctx[6] + "";
    	let t;
    	let mounted;
    	let dispose;

    	function click_handler() {
    		return /*click_handler*/ ctx[4](/*option*/ ctx[6]);
    	}

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			div = element("div");
    			t = text(t_value);
    			attr_dev(div, "class", "option svelte-yqpg3s");
    			toggle_class(div, "selected", /*option*/ ctx[6] == /*value*/ ctx[0]);
    			add_location(div, file$9, 14, 6, 321);
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
    			if (dirty & /*options*/ 8 && t_value !== (t_value = /*option*/ ctx[6] + "")) set_data_dev(t, t_value);

    			if (dirty & /*options, value*/ 9) {
    				toggle_class(div, "selected", /*option*/ ctx[6] == /*value*/ ctx[0]);
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
    		source: "(14:6) {#each options as option (option)}",
    		ctx
    	});

    	return block;
    }

    // (11:0) <AppControl id={id} label={label} >
    function create_default_slot$5(ctx) {
    	let div;
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let t;
    	let input;
    	let mounted;
    	let dispose;
    	let each_value = /*options*/ ctx[3];
    	validate_each_argument(each_value);
    	const get_key = ctx => /*option*/ ctx[6];
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
    			add_location(div, file$9, 12, 3, 251);
    			attr_dev(input, "name", /*id*/ ctx[1]);
    			attr_dev(input, "class", "svelte-yqpg3s");
    			add_location(input, file$9, 18, 3, 447);
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
    				dispose = listen_dev(input, "input", /*input_input_handler*/ ctx[5]);
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
    		id: create_default_slot$5.name,
    		type: "slot",
    		source: "(11:0) <AppControl id={id} label={label} >",
    		ctx
    	});

    	return block;
    }

    function create_fragment$d(ctx) {
    	let appcontrol;
    	let current;

    	appcontrol = new AppControl({
    			props: {
    				id: /*id*/ ctx[1],
    				label: /*label*/ ctx[2],
    				$$slots: { default: [create_default_slot$5] },
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

    			if (dirty & /*$$scope, id, value, options*/ 523) {
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
    		id: create_fragment$d.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$d($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("AppControlSwitch", slots, []);
    	let { id } = $$props;
    	let { label } = $$props;
    	let { options } = $$props;
    	let { value = options[0] } = $$props;
    	const writable_props = ["id", "label", "options", "value"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<AppControlSwitch> was created with unknown prop '${key}'`);
    	});

    	const click_handler = option => $$invalidate(0, value = option);

    	function input_input_handler() {
    		value = this.value;
    		$$invalidate(0, value);
    	}

    	$$self.$$set = $$props => {
    		if ("id" in $$props) $$invalidate(1, id = $$props.id);
    		if ("label" in $$props) $$invalidate(2, label = $$props.label);
    		if ("options" in $$props) $$invalidate(3, options = $$props.options);
    		if ("value" in $$props) $$invalidate(0, value = $$props.value);
    	};

    	$$self.$capture_state = () => ({
    		fade,
    		AppControl,
    		id,
    		label,
    		options,
    		value
    	});

    	$$self.$inject_state = $$props => {
    		if ("id" in $$props) $$invalidate(1, id = $$props.id);
    		if ("label" in $$props) $$invalidate(2, label = $$props.label);
    		if ("options" in $$props) $$invalidate(3, options = $$props.options);
    		if ("value" in $$props) $$invalidate(0, value = $$props.value);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [value, id, label, options, click_handler, input_input_handler];
    }

    class AppControlSwitch extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$d, create_fragment$d, safe_not_equal, { id: 1, label: 2, options: 3, value: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "AppControlSwitch",
    			options,
    			id: create_fragment$d.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*id*/ ctx[1] === undefined && !("id" in props)) {
    			console.warn("<AppControlSwitch> was created without expected prop 'id'");
    		}

    		if (/*label*/ ctx[2] === undefined && !("label" in props)) {
    			console.warn("<AppControlSwitch> was created without expected prop 'label'");
    		}

    		if (/*options*/ ctx[3] === undefined && !("options" in props)) {
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
    }

    /* ../shared/controls/AppControlRange.svelte generated by Svelte v3.38.2 */
    const file$8 = "../shared/controls/AppControlRange.svelte";

    // (67:0) <AppControl id={id} label={label}>
    function create_default_slot$4(ctx) {
    	let div1;
    	let div0;
    	let t0;
    	let span;
    	let t1_value = /*value*/ ctx[0].toFixed(/*decNum*/ ctx[5]) + "";
    	let t1;
    	let t2;
    	let input;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			t0 = space();
    			span = element("span");
    			t1 = text(t1_value);
    			t2 = space();
    			input = element("input");
    			attr_dev(div0, "class", "rangeSlider svelte-1n1k125");
    			set_style(div0, "width", /*width*/ ctx[9] + "%");
    			add_location(div0, file$8, 75, 6, 2016);
    			attr_dev(span, "class", "svelte-1n1k125");
    			add_location(span, file$8, 76, 6, 2103);
    			attr_dev(div1, "class", "rangeSliderContainer svelte-1n1k125");
    			add_location(div1, file$8, 67, 3, 1806);
    			attr_dev(input, "type", "range");
    			attr_dev(input, "step", /*step*/ ctx[6]);
    			attr_dev(input, "min", /*min*/ ctx[3]);
    			attr_dev(input, "max", /*max*/ ctx[4]);
    			attr_dev(input, "class", "svelte-1n1k125");
    			add_location(input, file$8, 78, 3, 2153);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			/*div0_binding*/ ctx[13](div0);
    			append_dev(div1, t0);
    			append_dev(div1, span);
    			append_dev(span, t1);
    			/*div1_binding*/ ctx[14](div1);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, input, anchor);
    			set_input_value(input, /*value*/ ctx[0]);

    			if (!mounted) {
    				dispose = [
    					listen_dev(div1, "mousewheel", /*changing*/ ctx[12], false, false, false),
    					listen_dev(div1, "mousemove", /*changing*/ ctx[12], false, false, false),
    					listen_dev(div1, "mouseup", /*stopChanging*/ ctx[11], false, false, false),
    					listen_dev(div1, "mousedown", /*startChanging*/ ctx[10], false, false, false),
    					listen_dev(input, "change", /*input_change_input_handler*/ ctx[15]),
    					listen_dev(input, "input", /*input_change_input_handler*/ ctx[15])
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*width*/ 512) {
    				set_style(div0, "width", /*width*/ ctx[9] + "%");
    			}

    			if (dirty & /*value, decNum*/ 33 && t1_value !== (t1_value = /*value*/ ctx[0].toFixed(/*decNum*/ ctx[5]) + "")) set_data_dev(t1, t1_value);

    			if (dirty & /*step*/ 64) {
    				attr_dev(input, "step", /*step*/ ctx[6]);
    			}

    			if (dirty & /*min*/ 8) {
    				attr_dev(input, "min", /*min*/ ctx[3]);
    			}

    			if (dirty & /*max*/ 16) {
    				attr_dev(input, "max", /*max*/ ctx[4]);
    			}

    			if (dirty & /*value*/ 1) {
    				set_input_value(input, /*value*/ ctx[0]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			/*div0_binding*/ ctx[13](null);
    			/*div1_binding*/ ctx[14](null);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(input);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$4.name,
    		type: "slot",
    		source: "(67:0) <AppControl id={id} label={label}>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$c(ctx) {
    	let appcontrol;
    	let current;

    	appcontrol = new AppControl({
    			props: {
    				id: /*id*/ ctx[1],
    				label: /*label*/ ctx[2],
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
    			if (dirty & /*id*/ 2) appcontrol_changes.id = /*id*/ ctx[1];
    			if (dirty & /*label*/ 4) appcontrol_changes.label = /*label*/ ctx[2];

    			if (dirty & /*$$scope, step, min, max, value, sliderContainer, decNum, width, sliderElement*/ 1049593) {
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
    	let width;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("AppControlRange", slots, []);
    	let { id } = $$props;
    	let { label } = $$props;
    	let { value } = $$props;
    	let { min } = $$props;
    	let { max } = $$props;
    	let { decNum = 1 } = $$props;
    	let { step = +((max - min) / 100).toFixed(4) } = $$props;

    	if (value < min || value > max) {
    		throw "The value is outside of the provided range.";
    	}

    	const dispatch = createEventDispatcher();
    	let sliderElement;
    	let sliderContainer;
    	let isDragging = false;

    	const computeValue = p => {
    		const tmpValue = min + p * (max - min);

    		// strange construction below is needed for:
    		// a. make a value fractionated according to step
    		// b. get rid of small decimals added by JS due to loss of precision
    		return +(Math.round(tmpValue / step) * step).toFixed(4);
    	};

    	const getRelativePosition = e => {
    		const sliderRect = sliderElement.getBoundingClientRect();
    		const parentRect = sliderContainer.getBoundingClientRect();
    		const minX = sliderRect.x;
    		const maxX = parentRect.x + parentRect.width;
    		return (e.clientX - minX) / (maxX - minX);
    	};

    	const startChanging = e => {
    		const p = getRelativePosition(e);
    		if (p < 0 || p > 1) return;
    		isDragging = p * 100 > width - 5 && p * 100 < width + 5;
    	};

    	const stopChanging = e => {
    		isDragging = false;
    		const p = getRelativePosition(e);
    		if (p < 0 || p > 1) return;
    		$$invalidate(0, value = computeValue(p));
    	};

    	const changing = e => {
    		if (!isDragging) return;
    		const p = getRelativePosition(e);
    		if (p < 0 || p > 1) return;
    		$$invalidate(0, value = computeValue(p));
    	};

    	const writable_props = ["id", "label", "value", "min", "max", "decNum", "step"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<AppControlRange> was created with unknown prop '${key}'`);
    	});

    	function div0_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			sliderElement = $$value;
    			$$invalidate(7, sliderElement);
    		});
    	}

    	function div1_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			sliderContainer = $$value;
    			$$invalidate(8, sliderContainer);
    		});
    	}

    	function input_change_input_handler() {
    		value = to_number(this.value);
    		$$invalidate(0, value);
    	}

    	$$self.$$set = $$props => {
    		if ("id" in $$props) $$invalidate(1, id = $$props.id);
    		if ("label" in $$props) $$invalidate(2, label = $$props.label);
    		if ("value" in $$props) $$invalidate(0, value = $$props.value);
    		if ("min" in $$props) $$invalidate(3, min = $$props.min);
    		if ("max" in $$props) $$invalidate(4, max = $$props.max);
    		if ("decNum" in $$props) $$invalidate(5, decNum = $$props.decNum);
    		if ("step" in $$props) $$invalidate(6, step = $$props.step);
    	};

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		AppControl,
    		id,
    		label,
    		value,
    		min,
    		max,
    		decNum,
    		step,
    		dispatch,
    		sliderElement,
    		sliderContainer,
    		isDragging,
    		computeValue,
    		getRelativePosition,
    		startChanging,
    		stopChanging,
    		changing,
    		width
    	});

    	$$self.$inject_state = $$props => {
    		if ("id" in $$props) $$invalidate(1, id = $$props.id);
    		if ("label" in $$props) $$invalidate(2, label = $$props.label);
    		if ("value" in $$props) $$invalidate(0, value = $$props.value);
    		if ("min" in $$props) $$invalidate(3, min = $$props.min);
    		if ("max" in $$props) $$invalidate(4, max = $$props.max);
    		if ("decNum" in $$props) $$invalidate(5, decNum = $$props.decNum);
    		if ("step" in $$props) $$invalidate(6, step = $$props.step);
    		if ("sliderElement" in $$props) $$invalidate(7, sliderElement = $$props.sliderElement);
    		if ("sliderContainer" in $$props) $$invalidate(8, sliderContainer = $$props.sliderContainer);
    		if ("isDragging" in $$props) isDragging = $$props.isDragging;
    		if ("width" in $$props) $$invalidate(9, width = $$props.width);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*value, min, max*/ 25) {
    			$$invalidate(9, width = (value - min) / (max - min) * 100);
    		}

    		if ($$self.$$.dirty & /*value*/ 1) {
    			dispatch("change", value);
    		}
    	};

    	return [
    		value,
    		id,
    		label,
    		min,
    		max,
    		decNum,
    		step,
    		sliderElement,
    		sliderContainer,
    		width,
    		startChanging,
    		stopChanging,
    		changing,
    		div0_binding,
    		div1_binding,
    		input_change_input_handler
    	];
    }

    class AppControlRange extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$c, create_fragment$c, safe_not_equal, {
    			id: 1,
    			label: 2,
    			value: 0,
    			min: 3,
    			max: 4,
    			decNum: 5,
    			step: 6
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "AppControlRange",
    			options,
    			id: create_fragment$c.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*id*/ ctx[1] === undefined && !("id" in props)) {
    			console.warn("<AppControlRange> was created without expected prop 'id'");
    		}

    		if (/*label*/ ctx[2] === undefined && !("label" in props)) {
    			console.warn("<AppControlRange> was created without expected prop 'label'");
    		}

    		if (/*value*/ ctx[0] === undefined && !("value" in props)) {
    			console.warn("<AppControlRange> was created without expected prop 'value'");
    		}

    		if (/*min*/ ctx[3] === undefined && !("min" in props)) {
    			console.warn("<AppControlRange> was created without expected prop 'min'");
    		}

    		if (/*max*/ ctx[4] === undefined && !("max" in props)) {
    			console.warn("<AppControlRange> was created without expected prop 'max'");
    		}
    	}

    	get id() {
    		throw new Error("<AppControlRange>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set id(value) {
    		throw new Error("<AppControlRange>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get label() {
    		throw new Error("<AppControlRange>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set label(value) {
    		throw new Error("<AppControlRange>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get value() {
    		throw new Error("<AppControlRange>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set value(value) {
    		throw new Error("<AppControlRange>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get min() {
    		throw new Error("<AppControlRange>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set min(value) {
    		throw new Error("<AppControlRange>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get max() {
    		throw new Error("<AppControlRange>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set max(value) {
    		throw new Error("<AppControlRange>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get decNum() {
    		throw new Error("<AppControlRange>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set decNum(value) {
    		throw new Error("<AppControlRange>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get step() {
    		throw new Error("<AppControlRange>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set step(value) {
    		throw new Error("<AppControlRange>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
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
        const subscribers = [];
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (let i = 0; i < subscribers.length; i += 1) {
                        const s = subscribers[i];
                        s[1]();
                        subscriber_queue.push(s, value);
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
            subscribers.push(subscriber);
            if (subscribers.length === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                const index = subscribers.indexOf(subscriber);
                if (index !== -1) {
                    subscribers.splice(index, 1);
                }
                if (subscribers.length === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    /* ../../svelte-plots-basic/src/Axes.svelte generated by Svelte v3.38.2 */
    const file$7 = "../../svelte-plots-basic/src/Axes.svelte";
    const get_box_slot_changes = dirty => ({});
    const get_box_slot_context = ctx => ({});
    const get_yaxis_slot_changes = dirty => ({});
    const get_yaxis_slot_context = ctx => ({});
    const get_xaxis_slot_changes = dirty => ({});
    const get_xaxis_slot_context = ctx => ({});

    // (311:3) {#if title !== ""}
    function create_if_block_3(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", "axes__title");
    			add_location(div, file$7, 310, 21, 11963);
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
    		source: "(311:3) {#if title !== \\\"\\\"}",
    		ctx
    	});

    	return block;
    }

    // (312:3) {#if yLabel !== ""}
    function create_if_block_2(ctx) {
    	let div;
    	let span;

    	const block = {
    		c: function create() {
    			div = element("div");
    			span = element("span");
    			add_location(span, file$7, 311, 48, 12061);
    			attr_dev(div, "class", "axes__ylabel");
    			add_location(div, file$7, 311, 22, 12035);
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
    		source: "(312:3) {#if yLabel !== \\\"\\\"}",
    		ctx
    	});

    	return block;
    }

    // (313:3) {#if xLabel !== ""}
    function create_if_block_1(ctx) {
    	let div;
    	let span;

    	const block = {
    		c: function create() {
    			div = element("div");
    			span = element("span");
    			add_location(span, file$7, 312, 48, 12148);
    			attr_dev(div, "class", "axes__xlabel");
    			add_location(div, file$7, 312, 22, 12122);
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
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(313:3) {#if xLabel !== \\\"\\\"}",
    		ctx
    	});

    	return block;
    }

    // (341:3) {#if !$isOk}
    function create_if_block$5(ctx) {
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
    			add_location(br, file$7, 342, 51, 12994);
    			attr_dev(p, "class", "message_error");
    			add_location(p, file$7, 341, 3, 12917);
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
    		id: create_if_block$5.name,
    		type: "if",
    		source: "(341:3) {#if !$isOk}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$b(ctx) {
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
    	let if_block0 = /*title*/ ctx[0] !== "" && create_if_block_3(ctx);
    	let if_block1 = /*yLabel*/ ctx[2] !== "" && create_if_block_2(ctx);
    	let if_block2 = /*xLabel*/ ctx[1] !== "" && create_if_block_1(ctx);
    	const xaxis_slot_template = /*#slots*/ ctx[24].xaxis;
    	const xaxis_slot = create_slot(xaxis_slot_template, ctx, /*$$scope*/ ctx[23], get_xaxis_slot_context);
    	const yaxis_slot_template = /*#slots*/ ctx[24].yaxis;
    	const yaxis_slot = create_slot(yaxis_slot_template, ctx, /*$$scope*/ ctx[23], get_yaxis_slot_context);
    	const default_slot_template = /*#slots*/ ctx[24].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[23], null);
    	const box_slot_template = /*#slots*/ ctx[24].box;
    	const box_slot = create_slot(box_slot_template, ctx, /*$$scope*/ ctx[23], get_box_slot_context);
    	let if_block3 = !/*$isOk*/ ctx[3] && create_if_block$5(ctx);

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
    			attr_dev(rect, "x", rect_x_value = /*cpx*/ ctx[6][0]);
    			attr_dev(rect, "y", rect_y_value = /*cpy*/ ctx[7][1]);
    			attr_dev(rect, "width", rect_width_value = /*cpx*/ ctx[6][1] - /*cpx*/ ctx[6][0]);
    			attr_dev(rect, "height", rect_height_value = /*cpy*/ ctx[7][0] - /*cpy*/ ctx[7][1]);
    			add_location(rect, file$7, 321, 15, 12446);
    			attr_dev(clipPath, "id", /*clipPathID*/ ctx[8]);
    			add_location(clipPath, file$7, 320, 12, 12402);
    			add_location(defs, file$7, 319, 9, 12383);
    			attr_dev(g, "clip-path", "url(#" + /*clipPathID*/ ctx[8] + ")");
    			add_location(g, file$7, 330, 9, 12732);
    			attr_dev(svg, "preserveAspectRatio", "none");
    			attr_dev(svg, "class", "axes");
    			add_location(svg, file$7, 316, 6, 12288);
    			attr_dev(div0, "class", "axes-wrapper");
    			add_location(div0, file$7, 315, 3, 12228);
    			attr_dev(div1, "class", div1_class_value = "plot " + ("plot_" + /*$scale*/ ctx[4]));
    			toggle_class(div1, "plot_error", !/*$isOk*/ ctx[3]);
    			add_location(div1, file$7, 307, 0, 11835);
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

    			/*div0_binding*/ ctx[25](div0);
    			append_dev(div1, t3);
    			if (if_block3) if_block3.m(div1, null);
    			current = true;
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
    					if_block2 = create_if_block_1(ctx);
    					if_block2.c();
    					if_block2.m(div1, t2);
    				}
    			} else if (if_block2) {
    				if_block2.d(1);
    				if_block2 = null;
    			}

    			if (!current || dirty[0] & /*cpx*/ 64 && rect_x_value !== (rect_x_value = /*cpx*/ ctx[6][0])) {
    				attr_dev(rect, "x", rect_x_value);
    			}

    			if (!current || dirty[0] & /*cpy*/ 128 && rect_y_value !== (rect_y_value = /*cpy*/ ctx[7][1])) {
    				attr_dev(rect, "y", rect_y_value);
    			}

    			if (!current || dirty[0] & /*cpx*/ 64 && rect_width_value !== (rect_width_value = /*cpx*/ ctx[6][1] - /*cpx*/ ctx[6][0])) {
    				attr_dev(rect, "width", rect_width_value);
    			}

    			if (!current || dirty[0] & /*cpy*/ 128 && rect_height_value !== (rect_height_value = /*cpy*/ ctx[7][0] - /*cpy*/ ctx[7][1])) {
    				attr_dev(rect, "height", rect_height_value);
    			}

    			if (xaxis_slot) {
    				if (xaxis_slot.p && (!current || dirty[0] & /*$$scope*/ 8388608)) {
    					update_slot(xaxis_slot, xaxis_slot_template, ctx, /*$$scope*/ ctx[23], dirty, get_xaxis_slot_changes, get_xaxis_slot_context);
    				}
    			}

    			if (yaxis_slot) {
    				if (yaxis_slot.p && (!current || dirty[0] & /*$$scope*/ 8388608)) {
    					update_slot(yaxis_slot, yaxis_slot_template, ctx, /*$$scope*/ ctx[23], dirty, get_yaxis_slot_changes, get_yaxis_slot_context);
    				}
    			}

    			if (default_slot) {
    				if (default_slot.p && (!current || dirty[0] & /*$$scope*/ 8388608)) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[23], dirty, null, null);
    				}
    			}

    			if (box_slot) {
    				if (box_slot.p && (!current || dirty[0] & /*$$scope*/ 8388608)) {
    					update_slot(box_slot, box_slot_template, ctx, /*$$scope*/ ctx[23], dirty, get_box_slot_changes, get_box_slot_context);
    				}
    			}

    			if (!/*$isOk*/ ctx[3]) {
    				if (if_block3) ; else {
    					if_block3 = create_if_block$5(ctx);
    					if_block3.c();
    					if_block3.m(div1, null);
    				}
    			} else if (if_block3) {
    				if_block3.d(1);
    				if_block3 = null;
    			}

    			if (!current || dirty[0] & /*$scale*/ 16 && div1_class_value !== (div1_class_value = "plot " + ("plot_" + /*$scale*/ ctx[4]))) {
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
    			/*div0_binding*/ ctx[25](null);
    			if (if_block3) if_block3.d();
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

    function instance$b($$self, $$props, $$invalidate) {
    	let margins;
    	let cpx;
    	let cpy;
    	let $isOk;
    	let $scale;
    	let $yLim;
    	let $xLim;
    	let $width;
    	let $height;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Axes", slots, ['xaxis','yaxis','default','box']);
    	let { limX = [undefined, undefined] } = $$props; // limits for x-axis (in plot units) [min, max]
    	let { limY = [undefined, undefined] } = $$props; // limits for y-axis (in plot units) [min, max]
    	let { title = "" } = $$props; // title of the plot
    	let { xLabel = "" } = $$props; // label for x-axis
    	let { yLabel = "" } = $$props; // label for y-axis
    	let { multiSeries = true } = $$props; // is the plot for one series or for many

    	/* constants for internal use */
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

    	validate_store(width, "width");
    	component_subscribe($$self, width, value => $$invalidate(21, $width = value));
    	const height = writable(100); // actual height of plotting area in pixels
    	validate_store(height, "height");
    	component_subscribe($$self, height, value => $$invalidate(22, $height = value));
    	const xLim = writable([undefined, undefined]); // actual limits for x-axis in plot units
    	validate_store(xLim, "xLim");
    	component_subscribe($$self, xLim, value => $$invalidate(20, $xLim = value));
    	const yLim = writable([undefined, undefined]); // actual limits for y-axis in plot units
    	validate_store(yLim, "yLim");
    	component_subscribe($$self, yLim, value => $$invalidate(19, $yLim = value));
    	const scale = writable("medium"); // scale factor (how big the shown plot is)
    	validate_store(scale, "scale");
    	component_subscribe($$self, scale, value => $$invalidate(4, $scale = value));
    	const isOk = writable(false); // are axes ready for drawing
    	validate_store(isOk, "isOk");
    	component_subscribe($$self, isOk, value => $$invalidate(3, $isOk = value));

    	/** Adds margins for x-axis (e.g. when x-axis must be shown) */
    	const addXAxisMargins = function () {
    		$$invalidate(18, axesMargins[0] = 1, axesMargins);
    		$$invalidate(18, axesMargins[2] = 0.5, axesMargins);
    		$$invalidate(18, axesMargins[1] = axesMargins[1] > 0.5 ? axesMargins[1] : 0.5, axesMargins);
    		$$invalidate(18, axesMargins[3] = axesMargins[3] > 0.5 ? axesMargins[3] : 0.5, axesMargins);
    	};

    	/** Adds margins for y-axis (e.g. when y-axis must be shown) */
    	const addYAxisMargins = function () {
    		$$invalidate(18, axesMargins[1] = 1, axesMargins);
    		$$invalidate(18, axesMargins[3] = 0.5, axesMargins);
    		$$invalidate(18, axesMargins[0] = axesMargins[0] > 0.5 ? axesMargins[0] : 0.5, axesMargins);
    		$$invalidate(18, axesMargins[2] = axesMargins[2] > 0.5 ? axesMargins[2] : 0.5, axesMargins);
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

    	setContext("axes", context);

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

    	const writable_props = ["limX", "limY", "title", "xLabel", "yLabel", "multiSeries"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Axes> was created with unknown prop '${key}'`);
    	});

    	function div0_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			axesWrapper = $$value;
    			$$invalidate(5, axesWrapper);
    		});
    	}

    	$$self.$$set = $$props => {
    		if ("limX" in $$props) $$invalidate(15, limX = $$props.limX);
    		if ("limY" in $$props) $$invalidate(16, limY = $$props.limY);
    		if ("title" in $$props) $$invalidate(0, title = $$props.title);
    		if ("xLabel" in $$props) $$invalidate(1, xLabel = $$props.xLabel);
    		if ("yLabel" in $$props) $$invalidate(2, yLabel = $$props.yLabel);
    		if ("multiSeries" in $$props) $$invalidate(17, multiSeries = $$props.multiSeries);
    		if ("$$scope" in $$props) $$invalidate(23, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		setContext,
    		writable,
    		limX,
    		limY,
    		title,
    		xLabel,
    		yLabel,
    		multiSeries,
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
    		$isOk,
    		margins,
    		$scale,
    		$yLim,
    		$xLim,
    		cpx,
    		$width,
    		cpy,
    		$height
    	});

    	$$self.$inject_state = $$props => {
    		if ("limX" in $$props) $$invalidate(15, limX = $$props.limX);
    		if ("limY" in $$props) $$invalidate(16, limY = $$props.limY);
    		if ("title" in $$props) $$invalidate(0, title = $$props.title);
    		if ("xLabel" in $$props) $$invalidate(1, xLabel = $$props.xLabel);
    		if ("yLabel" in $$props) $$invalidate(2, yLabel = $$props.yLabel);
    		if ("multiSeries" in $$props) $$invalidate(17, multiSeries = $$props.multiSeries);
    		if ("axesWrapper" in $$props) $$invalidate(5, axesWrapper = $$props.axesWrapper);
    		if ("axesMargins" in $$props) $$invalidate(18, axesMargins = $$props.axesMargins);
    		if ("context" in $$props) context = $$props.context;
    		if ("ro" in $$props) ro = $$props.ro;
    		if ("margins" in $$props) margins = $$props.margins;
    		if ("cpx" in $$props) $$invalidate(6, cpx = $$props.cpx);
    		if ("cpy" in $$props) $$invalidate(7, cpy = $$props.cpy);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty[0] & /*limX*/ 32768) {
    			// this is reactive in case if limX and limY are interactively changed by parent script
    			if (!limX.some(v => v === undefined)) xLim.update(v => limX);
    		}

    		if ($$self.$$.dirty[0] & /*limY*/ 65536) {
    			if (!limY.some(v => v === undefined)) yLim.update(v => limY);
    		}

    		if ($$self.$$.dirty[0] & /*axesMargins, $scale*/ 262160) {
    			// computes real margins in pixels based on current scale
    			margins = axesMargins.map(v => v * AXES_MARGIN_FACTORS[$scale]);
    		}

    		if ($$self.$$.dirty[0] & /*$yLim, $xLim*/ 1572864) {
    			// computes status which tells that axes limits look fine and it is safe to draw
    			// the status is based on the axis limits validity
    			isOk.update(v => Array.isArray($yLim) && Array.isArray($xLim) && $xLim.length === 2 && $yLim.length === 2 && !$yLim.some(v => v === undefined) && !$xLim.some(v => v === undefined) && !$yLim.some(v => isNaN(v)) && !$xLim.some(v => isNaN(v)) && $xLim[1] !== $xLim[0] && $yLim[1] !== $yLim[0]);
    		}

    		if ($$self.$$.dirty[0] & /*$isOk, $xLim, $width*/ 3145736) {
    			// computes coordinates for clip path box
    			$$invalidate(6, cpx = $isOk ? scaleX($xLim, $xLim, $width) : [0, 1]);
    		}

    		if ($$self.$$.dirty[0] & /*$isOk, $yLim, $height*/ 4718600) {
    			$$invalidate(7, cpy = $isOk ? scaleY($yLim, $yLim, $height) : [1, 0]);
    		}
    	};

    	return [
    		title,
    		xLabel,
    		yLabel,
    		$isOk,
    		$scale,
    		axesWrapper,
    		cpx,
    		cpy,
    		clipPathID,
    		width,
    		height,
    		xLim,
    		yLim,
    		scale,
    		isOk,
    		limX,
    		limY,
    		multiSeries,
    		axesMargins,
    		$yLim,
    		$xLim,
    		$width,
    		$height,
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
    			instance$b,
    			create_fragment$b,
    			safe_not_equal,
    			{
    				limX: 15,
    				limY: 16,
    				title: 0,
    				xLabel: 1,
    				yLabel: 2,
    				multiSeries: 17
    			},
    			[-1, -1]
    		);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Axes",
    			options,
    			id: create_fragment$b.name
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

    /* ../../svelte-plots-basic/src/XAxis.svelte generated by Svelte v3.38.2 */
    const file$6 = "../../svelte-plots-basic/src/XAxis.svelte";

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[26] = list[i];
    	child_ctx[28] = i;
    	return child_ctx;
    }

    // (57:0) {#if $isOk && x !== undefined && y !== undefined }
    function create_if_block$4(ctx) {
    	let g;
    	let line;
    	let line_x__value;
    	let line_x__value_1;
    	let line_y__value;
    	let line_y__value_1;
    	let each_value = /*ticksX*/ ctx[4];
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

    			line = svg_element("line");
    			attr_dev(line, "x1", line_x__value = /*x*/ ctx[3][0]);
    			attr_dev(line, "x2", line_x__value_1 = /*x*/ ctx[3][1]);
    			attr_dev(line, "y1", line_y__value = /*y*/ ctx[1][0]);
    			attr_dev(line, "y2", line_y__value_1 = /*y*/ ctx[1][0]);
    			attr_dev(line, "style", /*axisLineStyleStr*/ ctx[7]);
    			add_location(line, file$6, 63, 3, 2597);
    			attr_dev(g, "class", "mdaplot__axis mdaplot__xaxis");
    			add_location(g, file$6, 57, 3, 2169);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, g, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(g, null);
    			}

    			append_dev(g, line);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*ticksX, ticksY, dy, tickLabels, axisLineStyleStr, y, gridLineStyleStr*/ 439) {
    				each_value = /*ticksX*/ ctx[4];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$2(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$2(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(g, line);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (dirty & /*x*/ 8 && line_x__value !== (line_x__value = /*x*/ ctx[3][0])) {
    				attr_dev(line, "x1", line_x__value);
    			}

    			if (dirty & /*x*/ 8 && line_x__value_1 !== (line_x__value_1 = /*x*/ ctx[3][1])) {
    				attr_dev(line, "x2", line_x__value_1);
    			}

    			if (dirty & /*y*/ 2 && line_y__value !== (line_y__value = /*y*/ ctx[1][0])) {
    				attr_dev(line, "y1", line_y__value);
    			}

    			if (dirty & /*y*/ 2 && line_y__value_1 !== (line_y__value_1 = /*y*/ ctx[1][0])) {
    				attr_dev(line, "y2", line_y__value_1);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(g);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$4.name,
    		type: "if",
    		source: "(57:0) {#if $isOk && x !== undefined && y !== undefined }",
    		ctx
    	});

    	return block;
    }

    // (59:3) {#each ticksX as tx, i}
    function create_each_block$2(ctx) {
    	let line0;
    	let line0_x__value;
    	let line0_x__value_1;
    	let line0_y__value;
    	let line0_y__value_1;
    	let line1;
    	let line1_x__value;
    	let line1_x__value_1;
    	let line1_y__value;
    	let line1_y__value_1;
    	let text_1;
    	let t_value = /*tickLabels*/ ctx[0][/*i*/ ctx[28]] + "";
    	let t;
    	let text_1_x_value;
    	let text_1_y_value;

    	const block = {
    		c: function create() {
    			line0 = svg_element("line");
    			line1 = svg_element("line");
    			text_1 = svg_element("text");
    			t = text(t_value);
    			attr_dev(line0, "x1", line0_x__value = /*tx*/ ctx[26]);
    			attr_dev(line0, "x2", line0_x__value_1 = /*tx*/ ctx[26]);
    			attr_dev(line0, "y1", line0_y__value = /*y*/ ctx[1][0]);
    			attr_dev(line0, "y2", line0_y__value_1 = /*y*/ ctx[1][1]);
    			attr_dev(line0, "style", /*gridLineStyleStr*/ ctx[8]);
    			add_location(line0, file$6, 59, 6, 2243);
    			attr_dev(line1, "x1", line1_x__value = /*tx*/ ctx[26]);
    			attr_dev(line1, "x2", line1_x__value_1 = /*tx*/ ctx[26]);
    			attr_dev(line1, "y1", line1_y__value = /*ticksY*/ ctx[5][0]);
    			attr_dev(line1, "y2", line1_y__value_1 = /*ticksY*/ ctx[5][1]);
    			attr_dev(line1, "style", /*axisLineStyleStr*/ ctx[7]);
    			add_location(line1, file$6, 60, 6, 2334);
    			attr_dev(text_1, "x", text_1_x_value = /*tx*/ ctx[26]);
    			attr_dev(text_1, "y", text_1_y_value = /*ticksY*/ ctx[5][1]);
    			attr_dev(text_1, "dx", "0");
    			attr_dev(text_1, "dy", /*dy*/ ctx[2]);
    			attr_dev(text_1, "class", "mdaplot__axis-labels");
    			attr_dev(text_1, "dominant-baseline", "middle");
    			attr_dev(text_1, "text-anchor", "middle");
    			add_location(text_1, file$6, 61, 6, 2435);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, line0, anchor);
    			insert_dev(target, line1, anchor);
    			insert_dev(target, text_1, anchor);
    			append_dev(text_1, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*ticksX*/ 16 && line0_x__value !== (line0_x__value = /*tx*/ ctx[26])) {
    				attr_dev(line0, "x1", line0_x__value);
    			}

    			if (dirty & /*ticksX*/ 16 && line0_x__value_1 !== (line0_x__value_1 = /*tx*/ ctx[26])) {
    				attr_dev(line0, "x2", line0_x__value_1);
    			}

    			if (dirty & /*y*/ 2 && line0_y__value !== (line0_y__value = /*y*/ ctx[1][0])) {
    				attr_dev(line0, "y1", line0_y__value);
    			}

    			if (dirty & /*y*/ 2 && line0_y__value_1 !== (line0_y__value_1 = /*y*/ ctx[1][1])) {
    				attr_dev(line0, "y2", line0_y__value_1);
    			}

    			if (dirty & /*ticksX*/ 16 && line1_x__value !== (line1_x__value = /*tx*/ ctx[26])) {
    				attr_dev(line1, "x1", line1_x__value);
    			}

    			if (dirty & /*ticksX*/ 16 && line1_x__value_1 !== (line1_x__value_1 = /*tx*/ ctx[26])) {
    				attr_dev(line1, "x2", line1_x__value_1);
    			}

    			if (dirty & /*ticksY*/ 32 && line1_y__value !== (line1_y__value = /*ticksY*/ ctx[5][0])) {
    				attr_dev(line1, "y1", line1_y__value);
    			}

    			if (dirty & /*ticksY*/ 32 && line1_y__value_1 !== (line1_y__value_1 = /*ticksY*/ ctx[5][1])) {
    				attr_dev(line1, "y2", line1_y__value_1);
    			}

    			if (dirty & /*tickLabels*/ 1 && t_value !== (t_value = /*tickLabels*/ ctx[0][/*i*/ ctx[28]] + "")) set_data_dev(t, t_value);

    			if (dirty & /*ticksX*/ 16 && text_1_x_value !== (text_1_x_value = /*tx*/ ctx[26])) {
    				attr_dev(text_1, "x", text_1_x_value);
    			}

    			if (dirty & /*ticksY*/ 32 && text_1_y_value !== (text_1_y_value = /*ticksY*/ ctx[5][1])) {
    				attr_dev(text_1, "y", text_1_y_value);
    			}

    			if (dirty & /*dy*/ 4) {
    				attr_dev(text_1, "dy", /*dy*/ ctx[2]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(line0);
    			if (detaching) detach_dev(line1);
    			if (detaching) detach_dev(text_1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$2.name,
    		type: "each",
    		source: "(59:3) {#each ticksX as tx, i}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$a(ctx) {
    	let if_block_anchor;
    	let if_block = /*$isOk*/ ctx[6] && /*x*/ ctx[3] !== undefined && /*y*/ ctx[1] !== undefined && create_if_block$4(ctx);

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
    			if (/*$isOk*/ ctx[6] && /*x*/ ctx[3] !== undefined && /*y*/ ctx[1] !== undefined) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$4(ctx);
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
    		id: create_fragment$a.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$a($$self, $$props, $$invalidate) {
    	let x;
    	let y;
    	let dy;
    	let tickNum;
    	let ticksX;
    	let ticksY;
    	let $xLim;
    	let $axesWidth;
    	let $yLim;
    	let $axesHeight;
    	let $scale;
    	let $isOk;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("XAxis", slots, []);
    	let { slot = "xaxis" } = $$props; // slot the component must be placed in
    	let { ticks = undefined } = $$props; // vector with numeric tick positions in plot units
    	let { tickLabels = ticks } = $$props; // vector with labels for each tick
    	let { showGrid = false } = $$props; // logical, show or not grid lines

    	// set up tick mode
    	const tickMode = ticks === undefined ? "auto" : "manual";

    	/* sanity checks of input parameters */
    	if (slot !== "xaxis") {
    		throw "Component XAxis must have \"slot='xaxis'\" attribute.";
    	}

    	if (ticks !== undefined && !Array.isArray(ticks)) {
    		throw "XAxis: 'ticks' must be a vector of numbers.";
    	}

    	if (ticks !== undefined && !(Array.isArray(tickLabels) && tickLabels.length == ticks.length)) {
    		throw "XAxis: 'tickLabels' must be a vector of the same size as ticks.";
    	}

    	/* styles for axis and grid lines */
    	const axisLineStyleStr = `stroke:${Colors.DARKGRAY};line-width:1px;`;

    	const gridLineStyleStr = `stroke:${Colors.MIDDLEGRAY};stroke-opacity:${showGrid ? 1 : 0};stroke-dasharray:2px;`;

    	// get axes context and adjust x margins
    	const axes = getContext("axes");

    	axes.addXAxisMargins();

    	// get reactive variables needed to compute coordinates
    	const xLim = axes.xLim;

    	validate_store(xLim, "xLim");
    	component_subscribe($$self, xLim, value => $$invalidate(18, $xLim = value));
    	const yLim = axes.yLim;
    	validate_store(yLim, "yLim");
    	component_subscribe($$self, yLim, value => $$invalidate(20, $yLim = value));
    	const axesWidth = axes.width;
    	validate_store(axesWidth, "axesWidth");
    	component_subscribe($$self, axesWidth, value => $$invalidate(19, $axesWidth = value));
    	const axesHeight = axes.height;
    	validate_store(axesHeight, "axesHeight");
    	component_subscribe($$self, axesHeight, value => $$invalidate(21, $axesHeight = value));
    	const scale = axes.scale;
    	validate_store(scale, "scale");
    	component_subscribe($$self, scale, value => $$invalidate(22, $scale = value));
    	const isOk = axes.isOk;
    	validate_store(isOk, "isOk");
    	component_subscribe($$self, isOk, value => $$invalidate(6, $isOk = value));
    	const writable_props = ["slot", "ticks", "tickLabels", "showGrid"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<XAxis> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("slot" in $$props) $$invalidate(16, slot = $$props.slot);
    		if ("ticks" in $$props) $$invalidate(15, ticks = $$props.ticks);
    		if ("tickLabels" in $$props) $$invalidate(0, tickLabels = $$props.tickLabels);
    		if ("showGrid" in $$props) $$invalidate(17, showGrid = $$props.showGrid);
    	};

    	$$self.$capture_state = () => ({
    		getContext,
    		Colors,
    		slot,
    		ticks,
    		tickLabels,
    		showGrid,
    		tickMode,
    		axisLineStyleStr,
    		gridLineStyleStr,
    		axes,
    		xLim,
    		yLim,
    		axesWidth,
    		axesHeight,
    		scale,
    		isOk,
    		x,
    		$xLim,
    		$axesWidth,
    		y,
    		$yLim,
    		$axesHeight,
    		dy,
    		$scale,
    		tickNum,
    		ticksX,
    		ticksY,
    		$isOk
    	});

    	$$self.$inject_state = $$props => {
    		if ("slot" in $$props) $$invalidate(16, slot = $$props.slot);
    		if ("ticks" in $$props) $$invalidate(15, ticks = $$props.ticks);
    		if ("tickLabels" in $$props) $$invalidate(0, tickLabels = $$props.tickLabels);
    		if ("showGrid" in $$props) $$invalidate(17, showGrid = $$props.showGrid);
    		if ("x" in $$props) $$invalidate(3, x = $$props.x);
    		if ("y" in $$props) $$invalidate(1, y = $$props.y);
    		if ("dy" in $$props) $$invalidate(2, dy = $$props.dy);
    		if ("tickNum" in $$props) $$invalidate(23, tickNum = $$props.tickNum);
    		if ("ticksX" in $$props) $$invalidate(4, ticksX = $$props.ticksX);
    		if ("ticksY" in $$props) $$invalidate(5, ticksY = $$props.ticksY);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$xLim, $axesWidth*/ 786432) {
    			// reactive variables for coordinates of axis lines
    			$$invalidate(3, x = axes.scaleX($xLim, $xLim, $axesWidth));
    		}

    		if ($$self.$$.dirty & /*$yLim, $axesHeight*/ 3145728) {
    			$$invalidate(1, y = axes.scaleY($yLim, $yLim, $axesHeight));
    		}

    		if ($$self.$$.dirty & /*$scale*/ 4194304) {
    			// reactive variables for ticks and their coordinates
    			$$invalidate(2, dy = $scale === "small" ? 7 : 10);
    		}

    		if ($$self.$$.dirty & /*$scale*/ 4194304) {
    			$$invalidate(23, tickNum = axes.TICK_NUM[$scale]);
    		}

    		if ($$self.$$.dirty & /*$xLim, tickNum, ticks*/ 8683520) {
    			$$invalidate(15, ticks = tickMode === "auto"
    			? axes.getAxisTicks(undefined, $xLim, tickNum, true)
    			: ticks);
    		}

    		if ($$self.$$.dirty & /*ticks, tickLabels*/ 32769) {
    			$$invalidate(0, tickLabels = tickMode === "auto" ? ticks : tickLabels);
    		}

    		if ($$self.$$.dirty & /*ticks, $xLim, $axesWidth*/ 819200) {
    			$$invalidate(4, ticksX = axes.scaleX(ticks, $xLim, $axesWidth));
    		}

    		if ($$self.$$.dirty & /*y, dy*/ 6) {
    			$$invalidate(5, ticksY = y === undefined ? undefined : [y[0], y[0] + dy]);
    		}
    	};

    	return [
    		tickLabels,
    		y,
    		dy,
    		x,
    		ticksX,
    		ticksY,
    		$isOk,
    		axisLineStyleStr,
    		gridLineStyleStr,
    		xLim,
    		yLim,
    		axesWidth,
    		axesHeight,
    		scale,
    		isOk,
    		ticks,
    		slot,
    		showGrid,
    		$xLim,
    		$axesWidth,
    		$yLim,
    		$axesHeight,
    		$scale,
    		tickNum
    	];
    }

    class XAxis extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$a, create_fragment$a, safe_not_equal, {
    			slot: 16,
    			ticks: 15,
    			tickLabels: 0,
    			showGrid: 17
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "XAxis",
    			options,
    			id: create_fragment$a.name
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
    }

    /* ../../svelte-plots-basic/src/Segments.svelte generated by Svelte v3.38.2 */
    const file$5 = "../../svelte-plots-basic/src/Segments.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[24] = list[i];
    	child_ctx[26] = i;
    	return child_ctx;
    }

    // (41:0) {#if x1 !== undefined && y1 !== undefined}
    function create_if_block$3(ctx) {
    	let each_1_anchor;
    	let each_value = /*x1*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
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
    			if (dirty & /*x1, x2, y1, y2, lineStyleStr*/ 31) {
    				each_value = /*x1*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
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
    		id: create_if_block$3.name,
    		type: "if",
    		source: "(41:0) {#if x1 !== undefined && y1 !== undefined}",
    		ctx
    	});

    	return block;
    }

    // (42:3) {#each x1 as v, i}
    function create_each_block$1(ctx) {
    	let line;
    	let line_x__value;
    	let line_x__value_1;
    	let line_y__value;
    	let line_y__value_1;

    	const block = {
    		c: function create() {
    			line = svg_element("line");
    			attr_dev(line, "x1", line_x__value = /*x1*/ ctx[0][/*i*/ ctx[26]]);
    			attr_dev(line, "x2", line_x__value_1 = /*x2*/ ctx[1][/*i*/ ctx[26]]);
    			attr_dev(line, "y1", line_y__value = /*y1*/ ctx[2][/*i*/ ctx[26]]);
    			attr_dev(line, "y2", line_y__value_1 = /*y2*/ ctx[3][/*i*/ ctx[26]]);
    			attr_dev(line, "style", /*lineStyleStr*/ ctx[4]);
    			add_location(line, file$5, 42, 6, 1516);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, line, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*x1*/ 1 && line_x__value !== (line_x__value = /*x1*/ ctx[0][/*i*/ ctx[26]])) {
    				attr_dev(line, "x1", line_x__value);
    			}

    			if (dirty & /*x2*/ 2 && line_x__value_1 !== (line_x__value_1 = /*x2*/ ctx[1][/*i*/ ctx[26]])) {
    				attr_dev(line, "x2", line_x__value_1);
    			}

    			if (dirty & /*y1*/ 4 && line_y__value !== (line_y__value = /*y1*/ ctx[2][/*i*/ ctx[26]])) {
    				attr_dev(line, "y1", line_y__value);
    			}

    			if (dirty & /*y2*/ 8 && line_y__value_1 !== (line_y__value_1 = /*y2*/ ctx[3][/*i*/ ctx[26]])) {
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
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(42:3) {#each x1 as v, i}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$9(ctx) {
    	let if_block_anchor;
    	let if_block = /*x1*/ ctx[0] !== undefined && /*y1*/ ctx[2] !== undefined && create_if_block$3(ctx);

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
    			if (/*x1*/ ctx[0] !== undefined && /*y1*/ ctx[2] !== undefined) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$3(ctx);
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
    	let x1;
    	let x2;
    	let y1;
    	let y2;
    	let lineStyleStr;
    	let $xLim;
    	let $axesWidth;
    	let $yLim;
    	let $axesHeight;
    	let $scale;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Segments", slots, []);
    	let { xStart } = $$props;
    	let { xEnd } = $$props;
    	let { yStart } = $$props;
    	let { yEnd } = $$props;
    	let { lineColor = Colors.PRIMARY } = $$props;
    	let { lineType = 1 } = $$props;
    	let { lineWidth = 1 } = $$props;

    	/* sanity check for input parameters */
    	if (!Array.isArray(xStart) || !Array.isArray(xEnd) || !Array.isArray(yStart) || !Array.isArray(yEnd)) {
    		throw "Segments: parameters 'xStart', 'yStart', 'xEnd' and 'yEnd' must be vectors.";
    	}

    	const n = xStart.length;

    	if (xEnd.length !== n || yStart.length !== n || yEnd.length !== n) {
    		throw "Segments: parameters 'xStart', 'yStart', 'xEnd' and 'yEnd' should have the same length.";
    	}

    	// get axes context and reactive variables needed to compute coordinates
    	const axes = getContext("axes");

    	const xLim = axes.xLim;
    	validate_store(xLim, "xLim");
    	component_subscribe($$self, xLim, value => $$invalidate(17, $xLim = value));
    	const yLim = axes.yLim;
    	validate_store(yLim, "yLim");
    	component_subscribe($$self, yLim, value => $$invalidate(19, $yLim = value));
    	const axesWidth = axes.width;
    	validate_store(axesWidth, "axesWidth");
    	component_subscribe($$self, axesWidth, value => $$invalidate(18, $axesWidth = value));
    	const axesHeight = axes.height;
    	validate_store(axesHeight, "axesHeight");
    	component_subscribe($$self, axesHeight, value => $$invalidate(20, $axesHeight = value));
    	const scale = axes.scale;
    	validate_store(scale, "scale");
    	component_subscribe($$self, scale, value => $$invalidate(21, $scale = value));
    	const writable_props = ["xStart", "xEnd", "yStart", "yEnd", "lineColor", "lineType", "lineWidth"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Segments> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("xStart" in $$props) $$invalidate(10, xStart = $$props.xStart);
    		if ("xEnd" in $$props) $$invalidate(11, xEnd = $$props.xEnd);
    		if ("yStart" in $$props) $$invalidate(12, yStart = $$props.yStart);
    		if ("yEnd" in $$props) $$invalidate(13, yEnd = $$props.yEnd);
    		if ("lineColor" in $$props) $$invalidate(14, lineColor = $$props.lineColor);
    		if ("lineType" in $$props) $$invalidate(15, lineType = $$props.lineType);
    		if ("lineWidth" in $$props) $$invalidate(16, lineWidth = $$props.lineWidth);
    	};

    	$$self.$capture_state = () => ({
    		getContext,
    		Colors,
    		xStart,
    		xEnd,
    		yStart,
    		yEnd,
    		lineColor,
    		lineType,
    		lineWidth,
    		n,
    		axes,
    		xLim,
    		yLim,
    		axesWidth,
    		axesHeight,
    		scale,
    		x1,
    		$xLim,
    		$axesWidth,
    		x2,
    		y1,
    		$yLim,
    		$axesHeight,
    		y2,
    		lineStyleStr,
    		$scale
    	});

    	$$self.$inject_state = $$props => {
    		if ("xStart" in $$props) $$invalidate(10, xStart = $$props.xStart);
    		if ("xEnd" in $$props) $$invalidate(11, xEnd = $$props.xEnd);
    		if ("yStart" in $$props) $$invalidate(12, yStart = $$props.yStart);
    		if ("yEnd" in $$props) $$invalidate(13, yEnd = $$props.yEnd);
    		if ("lineColor" in $$props) $$invalidate(14, lineColor = $$props.lineColor);
    		if ("lineType" in $$props) $$invalidate(15, lineType = $$props.lineType);
    		if ("lineWidth" in $$props) $$invalidate(16, lineWidth = $$props.lineWidth);
    		if ("x1" in $$props) $$invalidate(0, x1 = $$props.x1);
    		if ("x2" in $$props) $$invalidate(1, x2 = $$props.x2);
    		if ("y1" in $$props) $$invalidate(2, y1 = $$props.y1);
    		if ("y2" in $$props) $$invalidate(3, y2 = $$props.y2);
    		if ("lineStyleStr" in $$props) $$invalidate(4, lineStyleStr = $$props.lineStyleStr);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*xStart, $xLim, $axesWidth*/ 394240) {
    			// reactive variables for coordinates of data points in pixels (and line style)
    			$$invalidate(0, x1 = axes.scaleX(xStart, $xLim, $axesWidth));
    		}

    		if ($$self.$$.dirty & /*xEnd, $xLim, $axesWidth*/ 395264) {
    			$$invalidate(1, x2 = axes.scaleX(xEnd, $xLim, $axesWidth));
    		}

    		if ($$self.$$.dirty & /*yStart, $yLim, $axesHeight*/ 1576960) {
    			$$invalidate(2, y1 = axes.scaleY(yStart, $yLim, $axesHeight));
    		}

    		if ($$self.$$.dirty & /*yEnd, $yLim, $axesHeight*/ 1581056) {
    			$$invalidate(3, y2 = axes.scaleY(yEnd, $yLim, $axesHeight));
    		}

    		if ($$self.$$.dirty & /*lineColor, lineWidth, $scale, lineType*/ 2211840) {
    			$$invalidate(4, lineStyleStr = `stroke:${lineColor};stroke-width: ${lineWidth}px;stroke-dasharray:${axes.LINE_STYLES[$scale][lineType - 1]}`);
    		}
    	};

    	return [
    		x1,
    		x2,
    		y1,
    		y2,
    		lineStyleStr,
    		xLim,
    		yLim,
    		axesWidth,
    		axesHeight,
    		scale,
    		xStart,
    		xEnd,
    		yStart,
    		yEnd,
    		lineColor,
    		lineType,
    		lineWidth,
    		$xLim,
    		$axesWidth,
    		$yLim,
    		$axesHeight,
    		$scale
    	];
    }

    class Segments extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$9, create_fragment$9, safe_not_equal, {
    			xStart: 10,
    			xEnd: 11,
    			yStart: 12,
    			yEnd: 13,
    			lineColor: 14,
    			lineType: 15,
    			lineWidth: 16
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Segments",
    			options,
    			id: create_fragment$9.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*xStart*/ ctx[10] === undefined && !("xStart" in props)) {
    			console.warn("<Segments> was created without expected prop 'xStart'");
    		}

    		if (/*xEnd*/ ctx[11] === undefined && !("xEnd" in props)) {
    			console.warn("<Segments> was created without expected prop 'xEnd'");
    		}

    		if (/*yStart*/ ctx[12] === undefined && !("yStart" in props)) {
    			console.warn("<Segments> was created without expected prop 'yStart'");
    		}

    		if (/*yEnd*/ ctx[13] === undefined && !("yEnd" in props)) {
    			console.warn("<Segments> was created without expected prop 'yEnd'");
    		}
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

    /* ../../svelte-plots-basic/src/TextLabels.svelte generated by Svelte v3.38.2 */
    const file$4 = "../../svelte-plots-basic/src/TextLabels.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[25] = list[i];
    	child_ctx[27] = i;
    	return child_ctx;
    }

    // (56:0) {#if x !== undefined && y !== undefined}
    function create_if_block$2(ctx) {
    	let each_1_anchor;
    	let each_value = /*x*/ ctx[2];
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
    			if (dirty & /*textStyleStr, x, y, dx, dy, textAnchors, pos, labels*/ 255) {
    				each_value = /*x*/ ctx[2];
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
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(56:0) {#if x !== undefined && y !== undefined}",
    		ctx
    	});

    	return block;
    }

    // (57:3) {#each x as v, i}
    function create_each_block(ctx) {
    	let text_1;
    	let raw_value = /*labels*/ ctx[0][/*i*/ ctx[27]] + "";
    	let text_1_x_value;
    	let text_1_y_value;
    	let text_1_text_anchor_value;

    	const block = {
    		c: function create() {
    			text_1 = svg_element("text");
    			attr_dev(text_1, "style", /*textStyleStr*/ ctx[6]);
    			attr_dev(text_1, "x", text_1_x_value = /*x*/ ctx[2][/*i*/ ctx[27]]);
    			attr_dev(text_1, "y", text_1_y_value = /*y*/ ctx[3][/*i*/ ctx[27]]);
    			attr_dev(text_1, "dx", /*dx*/ ctx[4]);
    			attr_dev(text_1, "dy", /*dy*/ ctx[5]);
    			attr_dev(text_1, "dominant-baseline", "middle");
    			attr_dev(text_1, "text-anchor", text_1_text_anchor_value = /*textAnchors*/ ctx[7][/*pos*/ ctx[1]]);
    			add_location(text_1, file$4, 57, 6, 2089);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, text_1, anchor);
    			text_1.innerHTML = raw_value;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*labels*/ 1 && raw_value !== (raw_value = /*labels*/ ctx[0][/*i*/ ctx[27]] + "")) text_1.innerHTML = raw_value;
    			if (dirty & /*textStyleStr*/ 64) {
    				attr_dev(text_1, "style", /*textStyleStr*/ ctx[6]);
    			}

    			if (dirty & /*x*/ 4 && text_1_x_value !== (text_1_x_value = /*x*/ ctx[2][/*i*/ ctx[27]])) {
    				attr_dev(text_1, "x", text_1_x_value);
    			}

    			if (dirty & /*y*/ 8 && text_1_y_value !== (text_1_y_value = /*y*/ ctx[3][/*i*/ ctx[27]])) {
    				attr_dev(text_1, "y", text_1_y_value);
    			}

    			if (dirty & /*dx*/ 16) {
    				attr_dev(text_1, "dx", /*dx*/ ctx[4]);
    			}

    			if (dirty & /*dy*/ 32) {
    				attr_dev(text_1, "dy", /*dy*/ ctx[5]);
    			}

    			if (dirty & /*pos*/ 2 && text_1_text_anchor_value !== (text_1_text_anchor_value = /*textAnchors*/ ctx[7][/*pos*/ ctx[1]])) {
    				attr_dev(text_1, "text-anchor", text_1_text_anchor_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(text_1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(57:3) {#each x as v, i}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$8(ctx) {
    	let if_block_anchor;
    	let if_block = /*x*/ ctx[2] !== undefined && /*y*/ ctx[3] !== undefined && create_if_block$2(ctx);

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
    			if (/*x*/ ctx[2] !== undefined && /*y*/ ctx[3] !== undefined) {
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
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$8($$self, $$props, $$invalidate) {
    	let x;
    	let y;
    	let dx;
    	let dy;
    	let textStyleStr;
    	let $xLim;
    	let $axesWidth;
    	let $yLim;
    	let $axesHeight;
    	let $scale;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("TextLabels", slots, []);
    	let { xValues } = $$props;
    	let { yValues } = $$props;
    	let { labels } = $$props;
    	let { pos = 0 } = $$props;
    	let { faceColor = Colors.PRIMARY_TEXT } = $$props;
    	let { borderColor = "transparent" } = $$props;
    	let { borderWidth = 0 } = $$props;
    	let { textSize = 1 } = $$props;

    	// text-anchor values depending on position
    	const textAnchors = ["middle", "middle", "start", "middle", "end"];

    	/* sanity check for input parameters */
    	if (!Array.isArray(xValues) || !Array.isArray(yValues) || xValues.length !== yValues.length) {
    		throw "TextLabels: parameters 'xValues' and 'yValues' must be vectors of the same length.";
    	}

    	// get axes context and reactive variables needed to compute coordinates
    	const axes = getContext("axes");

    	const xLim = axes.xLim;
    	validate_store(xLim, "xLim");
    	component_subscribe($$self, xLim, value => $$invalidate(19, $xLim = value));
    	const yLim = axes.yLim;
    	validate_store(yLim, "yLim");
    	component_subscribe($$self, yLim, value => $$invalidate(21, $yLim = value));
    	const axesWidth = axes.width;
    	validate_store(axesWidth, "axesWidth");
    	component_subscribe($$self, axesWidth, value => $$invalidate(20, $axesWidth = value));
    	const axesHeight = axes.height;
    	validate_store(axesHeight, "axesHeight");
    	component_subscribe($$self, axesHeight, value => $$invalidate(22, $axesHeight = value));
    	const scale = axes.scale;
    	validate_store(scale, "scale");
    	component_subscribe($$self, scale, value => $$invalidate(23, $scale = value));

    	const writable_props = [
    		"xValues",
    		"yValues",
    		"labels",
    		"pos",
    		"faceColor",
    		"borderColor",
    		"borderWidth",
    		"textSize"
    	];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<TextLabels> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("xValues" in $$props) $$invalidate(13, xValues = $$props.xValues);
    		if ("yValues" in $$props) $$invalidate(14, yValues = $$props.yValues);
    		if ("labels" in $$props) $$invalidate(0, labels = $$props.labels);
    		if ("pos" in $$props) $$invalidate(1, pos = $$props.pos);
    		if ("faceColor" in $$props) $$invalidate(15, faceColor = $$props.faceColor);
    		if ("borderColor" in $$props) $$invalidate(16, borderColor = $$props.borderColor);
    		if ("borderWidth" in $$props) $$invalidate(17, borderWidth = $$props.borderWidth);
    		if ("textSize" in $$props) $$invalidate(18, textSize = $$props.textSize);
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
    		textAnchors,
    		axes,
    		xLim,
    		yLim,
    		axesWidth,
    		axesHeight,
    		scale,
    		x,
    		$xLim,
    		$axesWidth,
    		y,
    		$yLim,
    		$axesHeight,
    		dx,
    		$scale,
    		dy,
    		textStyleStr
    	});

    	$$self.$inject_state = $$props => {
    		if ("xValues" in $$props) $$invalidate(13, xValues = $$props.xValues);
    		if ("yValues" in $$props) $$invalidate(14, yValues = $$props.yValues);
    		if ("labels" in $$props) $$invalidate(0, labels = $$props.labels);
    		if ("pos" in $$props) $$invalidate(1, pos = $$props.pos);
    		if ("faceColor" in $$props) $$invalidate(15, faceColor = $$props.faceColor);
    		if ("borderColor" in $$props) $$invalidate(16, borderColor = $$props.borderColor);
    		if ("borderWidth" in $$props) $$invalidate(17, borderWidth = $$props.borderWidth);
    		if ("textSize" in $$props) $$invalidate(18, textSize = $$props.textSize);
    		if ("x" in $$props) $$invalidate(2, x = $$props.x);
    		if ("y" in $$props) $$invalidate(3, y = $$props.y);
    		if ("dx" in $$props) $$invalidate(4, dx = $$props.dx);
    		if ("dy" in $$props) $$invalidate(5, dy = $$props.dy);
    		if ("textStyleStr" in $$props) $$invalidate(6, textStyleStr = $$props.textStyleStr);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*xValues, labels*/ 8193) {
    			// multiply labels values if needed
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

    		if ($$self.$$.dirty & /*xValues, $xLim, $axesWidth*/ 1581056) {
    			// reactive variables for coordinates of data points in pixels
    			$$invalidate(2, x = axes.scaleX(xValues, $xLim, $axesWidth));
    		}

    		if ($$self.$$.dirty & /*yValues, $yLim, $axesHeight*/ 6307840) {
    			$$invalidate(3, y = axes.scaleY(yValues, $yLim, $axesHeight));
    		}

    		if ($$self.$$.dirty & /*pos, $scale*/ 8388610) {
    			$$invalidate(4, dx = [0, 0, 1, 0, -1][pos] * axes.LABELS_MARGIN[$scale]);
    		}

    		if ($$self.$$.dirty & /*pos, $scale*/ 8388610) {
    			$$invalidate(5, dy = [0, 1, 0, -1, 0][pos] * axes.LABELS_MARGIN[$scale]);
    		}

    		if ($$self.$$.dirty & /*faceColor, borderWidth, borderColor, textSize*/ 491520) {
    			// styles for bars and labels
    			$$invalidate(6, textStyleStr = `fill:${faceColor};stroke-width:${borderWidth}px;stroke:${borderColor};font-size:${textSize}em;`);
    		}
    	};

    	return [
    		labels,
    		pos,
    		x,
    		y,
    		dx,
    		dy,
    		textStyleStr,
    		textAnchors,
    		xLim,
    		yLim,
    		axesWidth,
    		axesHeight,
    		scale,
    		xValues,
    		yValues,
    		faceColor,
    		borderColor,
    		borderWidth,
    		textSize,
    		$xLim,
    		$axesWidth,
    		$yLim,
    		$axesHeight,
    		$scale
    	];
    }

    class TextLabels extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$8, create_fragment$8, safe_not_equal, {
    			xValues: 13,
    			yValues: 14,
    			labels: 0,
    			pos: 1,
    			faceColor: 15,
    			borderColor: 16,
    			borderWidth: 17,
    			textSize: 18
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "TextLabels",
    			options,
    			id: create_fragment$8.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*xValues*/ ctx[13] === undefined && !("xValues" in props)) {
    			console.warn("<TextLabels> was created without expected prop 'xValues'");
    		}

    		if (/*yValues*/ ctx[14] === undefined && !("yValues" in props)) {
    			console.warn("<TextLabels> was created without expected prop 'yValues'");
    		}

    		if (/*labels*/ ctx[0] === undefined && !("labels" in props)) {
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
    }

    /* ../../svelte-plots-basic/src/TextLegend.svelte generated by Svelte v3.38.2 */

    function create_fragment$7(ctx) {
    	let textlabels;
    	let current;

    	textlabels = new TextLabels({
    			props: {
    				textSize: /*textSize*/ ctx[6],
    				borderColor: /*borderColor*/ ctx[4],
    				borderWidth: /*borderWidth*/ ctx[5],
    				faceColor: /*faceColor*/ ctx[3],
    				xValues: [/*x*/ ctx[0]],
    				yValues: [/*y*/ ctx[1]],
    				pos: /*pos*/ ctx[2],
    				labels: /*labelsStr*/ ctx[7]
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
    			if (dirty & /*textSize*/ 64) textlabels_changes.textSize = /*textSize*/ ctx[6];
    			if (dirty & /*borderColor*/ 16) textlabels_changes.borderColor = /*borderColor*/ ctx[4];
    			if (dirty & /*borderWidth*/ 32) textlabels_changes.borderWidth = /*borderWidth*/ ctx[5];
    			if (dirty & /*faceColor*/ 8) textlabels_changes.faceColor = /*faceColor*/ ctx[3];
    			if (dirty & /*x*/ 1) textlabels_changes.xValues = [/*x*/ ctx[0]];
    			if (dirty & /*y*/ 2) textlabels_changes.yValues = [/*y*/ ctx[1]];
    			if (dirty & /*pos*/ 4) textlabels_changes.pos = /*pos*/ ctx[2];
    			if (dirty & /*labelsStr*/ 128) textlabels_changes.labels = /*labelsStr*/ ctx[7];
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
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("TextLegend", slots, []);
    	let { x } = $$props;
    	let { y } = $$props;
    	let { dx = "0" } = $$props;
    	let { dy = "1.25em" } = $$props;
    	let { elements } = $$props;
    	let { pos = 0 } = $$props;
    	let { faceColor = Colors.PRIMARY_TEXT } = $$props;
    	let { borderColor = "transparent" } = $$props;
    	let { borderWidth = 0 } = $$props;
    	let { textSize = 1 } = $$props;
    	let labelsStr = "";

    	const writable_props = [
    		"x",
    		"y",
    		"dx",
    		"dy",
    		"elements",
    		"pos",
    		"faceColor",
    		"borderColor",
    		"borderWidth",
    		"textSize"
    	];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<TextLegend> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("x" in $$props) $$invalidate(0, x = $$props.x);
    		if ("y" in $$props) $$invalidate(1, y = $$props.y);
    		if ("dx" in $$props) $$invalidate(8, dx = $$props.dx);
    		if ("dy" in $$props) $$invalidate(9, dy = $$props.dy);
    		if ("elements" in $$props) $$invalidate(10, elements = $$props.elements);
    		if ("pos" in $$props) $$invalidate(2, pos = $$props.pos);
    		if ("faceColor" in $$props) $$invalidate(3, faceColor = $$props.faceColor);
    		if ("borderColor" in $$props) $$invalidate(4, borderColor = $$props.borderColor);
    		if ("borderWidth" in $$props) $$invalidate(5, borderWidth = $$props.borderWidth);
    		if ("textSize" in $$props) $$invalidate(6, textSize = $$props.textSize);
    	};

    	$$self.$capture_state = () => ({
    		TextLabels,
    		Colors,
    		x,
    		y,
    		dx,
    		dy,
    		elements,
    		pos,
    		faceColor,
    		borderColor,
    		borderWidth,
    		textSize,
    		labelsStr
    	});

    	$$self.$inject_state = $$props => {
    		if ("x" in $$props) $$invalidate(0, x = $$props.x);
    		if ("y" in $$props) $$invalidate(1, y = $$props.y);
    		if ("dx" in $$props) $$invalidate(8, dx = $$props.dx);
    		if ("dy" in $$props) $$invalidate(9, dy = $$props.dy);
    		if ("elements" in $$props) $$invalidate(10, elements = $$props.elements);
    		if ("pos" in $$props) $$invalidate(2, pos = $$props.pos);
    		if ("faceColor" in $$props) $$invalidate(3, faceColor = $$props.faceColor);
    		if ("borderColor" in $$props) $$invalidate(4, borderColor = $$props.borderColor);
    		if ("borderWidth" in $$props) $$invalidate(5, borderWidth = $$props.borderWidth);
    		if ("textSize" in $$props) $$invalidate(6, textSize = $$props.textSize);
    		if ("labelsStr" in $$props) $$invalidate(7, labelsStr = $$props.labelsStr);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*elements, labelsStr, dx, dy*/ 1920) {
    			{
    				$$invalidate(7, labelsStr = "");

    				for (let i = 0; i < elements.length; i++) {
    					$$invalidate(7, labelsStr += `<tspan x=0 dx=${dx} dy=${i === 0 ? 0 : dy}>${elements[i]}</tspan>`);
    				}
    			}
    		}
    	};

    	return [
    		x,
    		y,
    		pos,
    		faceColor,
    		borderColor,
    		borderWidth,
    		textSize,
    		labelsStr,
    		dx,
    		dy,
    		elements
    	];
    }

    class TextLegend extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$7, create_fragment$7, safe_not_equal, {
    			x: 0,
    			y: 1,
    			dx: 8,
    			dy: 9,
    			elements: 10,
    			pos: 2,
    			faceColor: 3,
    			borderColor: 4,
    			borderWidth: 5,
    			textSize: 6
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "TextLegend",
    			options,
    			id: create_fragment$7.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*x*/ ctx[0] === undefined && !("x" in props)) {
    			console.warn("<TextLegend> was created without expected prop 'x'");
    		}

    		if (/*y*/ ctx[1] === undefined && !("y" in props)) {
    			console.warn("<TextLegend> was created without expected prop 'y'");
    		}

    		if (/*elements*/ ctx[10] === undefined && !("elements" in props)) {
    			console.warn("<TextLegend> was created without expected prop 'elements'");
    		}
    	}

    	get x() {
    		throw new Error("<TextLegend>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set x(value) {
    		throw new Error("<TextLegend>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get y() {
    		throw new Error("<TextLegend>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set y(value) {
    		throw new Error("<TextLegend>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get dx() {
    		throw new Error("<TextLegend>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set dx(value) {
    		throw new Error("<TextLegend>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get dy() {
    		throw new Error("<TextLegend>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set dy(value) {
    		throw new Error("<TextLegend>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get elements() {
    		throw new Error("<TextLegend>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set elements(value) {
    		throw new Error("<TextLegend>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get pos() {
    		throw new Error("<TextLegend>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set pos(value) {
    		throw new Error("<TextLegend>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get faceColor() {
    		throw new Error("<TextLegend>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set faceColor(value) {
    		throw new Error("<TextLegend>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get borderColor() {
    		throw new Error("<TextLegend>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set borderColor(value) {
    		throw new Error("<TextLegend>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get borderWidth() {
    		throw new Error("<TextLegend>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set borderWidth(value) {
    		throw new Error("<TextLegend>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get textSize() {
    		throw new Error("<TextLegend>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set textSize(value) {
    		throw new Error("<TextLegend>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* ../../svelte-plots-basic/src/ScatterSeries.svelte generated by Svelte v3.38.2 */
    const file$3 = "../../svelte-plots-basic/src/ScatterSeries.svelte";

    function create_fragment$6(ctx) {
    	let g;
    	let textlabels;
    	let current;

    	textlabels = new TextLabels({
    			props: {
    				xValues: /*xValues*/ ctx[0],
    				yValues: /*yValues*/ ctx[1],
    				labels: /*markerSymbol*/ ctx[7],
    				textSize: /*markerSize*/ ctx[6],
    				faceColor: /*faceColor*/ ctx[3],
    				borderColor: /*borderColor*/ ctx[4],
    				borderWidth: /*borderWidth*/ ctx[5]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			g = svg_element("g");
    			create_component(textlabels.$$.fragment);
    			attr_dev(g, "class", "series series_scatter");
    			attr_dev(g, "title", /*title*/ ctx[2]);
    			add_location(g, file$3, 62, 0, 1797);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, g, anchor);
    			mount_component(textlabels, g, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const textlabels_changes = {};
    			if (dirty & /*xValues*/ 1) textlabels_changes.xValues = /*xValues*/ ctx[0];
    			if (dirty & /*yValues*/ 2) textlabels_changes.yValues = /*yValues*/ ctx[1];
    			if (dirty & /*markerSymbol*/ 128) textlabels_changes.labels = /*markerSymbol*/ ctx[7];
    			if (dirty & /*markerSize*/ 64) textlabels_changes.textSize = /*markerSize*/ ctx[6];
    			if (dirty & /*faceColor*/ 8) textlabels_changes.faceColor = /*faceColor*/ ctx[3];
    			if (dirty & /*borderColor*/ 16) textlabels_changes.borderColor = /*borderColor*/ ctx[4];
    			if (dirty & /*borderWidth*/ 32) textlabels_changes.borderWidth = /*borderWidth*/ ctx[5];
    			textlabels.$set(textlabels_changes);

    			if (!current || dirty & /*title*/ 4) {
    				attr_dev(g, "title", /*title*/ ctx[2]);
    			}
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
    			if (detaching) detach_dev(g);
    			destroy_component(textlabels);
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
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("ScatterSeries", slots, []);
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
    	const markers = ["●", "◼", "▲", "▼", "⬥", "+", "*", "⨯"];

    	let markerSymbol;

    	/* sanity check of input parameters */
    	if (typeof marker !== "number" || marker < 1 || marker > markers.length) {
    		throw `ScatterSeries: parameter 'marker' must be a number from 1 to ${markers.length}."`;
    	}

    	// to access shared parameters and methods from Axes
    	const axes = getContext("axes");

    	const writable_props = [
    		"xValues",
    		"yValues",
    		"marker",
    		"title",
    		"faceColor",
    		"borderColor",
    		"borderWidth",
    		"markerSize"
    	];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<ScatterSeries> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("xValues" in $$props) $$invalidate(0, xValues = $$props.xValues);
    		if ("yValues" in $$props) $$invalidate(1, yValues = $$props.yValues);
    		if ("marker" in $$props) $$invalidate(8, marker = $$props.marker);
    		if ("title" in $$props) $$invalidate(2, title = $$props.title);
    		if ("faceColor" in $$props) $$invalidate(3, faceColor = $$props.faceColor);
    		if ("borderColor" in $$props) $$invalidate(4, borderColor = $$props.borderColor);
    		if ("borderWidth" in $$props) $$invalidate(5, borderWidth = $$props.borderWidth);
    		if ("markerSize" in $$props) $$invalidate(6, markerSize = $$props.markerSize);
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
    		if ("xValues" in $$props) $$invalidate(0, xValues = $$props.xValues);
    		if ("yValues" in $$props) $$invalidate(1, yValues = $$props.yValues);
    		if ("marker" in $$props) $$invalidate(8, marker = $$props.marker);
    		if ("title" in $$props) $$invalidate(2, title = $$props.title);
    		if ("faceColor" in $$props) $$invalidate(3, faceColor = $$props.faceColor);
    		if ("borderColor" in $$props) $$invalidate(4, borderColor = $$props.borderColor);
    		if ("borderWidth" in $$props) $$invalidate(5, borderWidth = $$props.borderWidth);
    		if ("markerSize" in $$props) $$invalidate(6, markerSize = $$props.markerSize);
    		if ("markerSymbol" in $$props) $$invalidate(7, markerSymbol = $$props.markerSymbol);
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

    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {
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
    			id: create_fragment$6.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*xValues*/ ctx[0] === undefined && !("xValues" in props)) {
    			console.warn("<ScatterSeries> was created without expected prop 'xValues'");
    		}

    		if (/*yValues*/ ctx[1] === undefined && !("yValues" in props)) {
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

    /* ../../svelte-plots-basic/src/LineSeries.svelte generated by Svelte v3.38.2 */
    const file$2 = "../../svelte-plots-basic/src/LineSeries.svelte";

    // (43:0) {#if p !== undefined}
    function create_if_block$1(ctx) {
    	let g;
    	let polyline;

    	const block = {
    		c: function create() {
    			g = svg_element("g");
    			polyline = svg_element("polyline");
    			attr_dev(polyline, "class", "line");
    			attr_dev(polyline, "points", /*p*/ ctx[1]);
    			add_location(polyline, file$2, 44, 3, 1609);
    			attr_dev(g, "class", "series lineseries");
    			attr_dev(g, "style", /*lineStyleStr*/ ctx[2]);
    			attr_dev(g, "title", /*title*/ ctx[0]);
    			add_location(g, file$2, 43, 3, 1537);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, g, anchor);
    			append_dev(g, polyline);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*p*/ 2) {
    				attr_dev(polyline, "points", /*p*/ ctx[1]);
    			}

    			if (dirty & /*lineStyleStr*/ 4) {
    				attr_dev(g, "style", /*lineStyleStr*/ ctx[2]);
    			}

    			if (dirty & /*title*/ 1) {
    				attr_dev(g, "title", /*title*/ ctx[0]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(g);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(43:0) {#if p !== undefined}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$5(ctx) {
    	let if_block_anchor;
    	let if_block = /*p*/ ctx[1] !== undefined && create_if_block$1(ctx);

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
    			if (/*p*/ ctx[1] !== undefined) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$1(ctx);
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
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let x;
    	let y;
    	let p;
    	let lineStyleStr;
    	let $xLim;
    	let $axesWidth;
    	let $yLim;
    	let $axesHeight;
    	let $scale;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("LineSeries", slots, []);
    	let { xValues } = $$props;
    	let { yValues } = $$props;
    	let { title = "" } = $$props;
    	let { lineWidth = 1 } = $$props;
    	let { lineColor = Colors.PRIMARY } = $$props;
    	let { lineType = 1 } = $$props;

    	/* sanity check of input parameters */
    	if (!Array.isArray(xValues) || !Array.isArray(yValues) || xValues.length != yValues.length) {
    		throw "LineSeries: parameters 'xValues' and 'yValues' must be numeric vectors of the same length.";
    	}

    	// compute ranges for x and y values
    	const xValuesRange = mrange(xValues, 0.05);

    	const yValuesRange = mrange(yValues, 0.05);

    	// get axes context and adjust axes limits
    	const axes = getContext("axes");

    	axes.adjustXAxisLimits(xValuesRange);
    	axes.adjustYAxisLimits(yValuesRange);

    	// get reactive variables needed to compute coordinates
    	const xLim = axes.xLim;

    	validate_store(xLim, "xLim");
    	component_subscribe($$self, xLim, value => $$invalidate(14, $xLim = value));
    	const yLim = axes.yLim;
    	validate_store(yLim, "yLim");
    	component_subscribe($$self, yLim, value => $$invalidate(17, $yLim = value));
    	const axesWidth = axes.width;
    	validate_store(axesWidth, "axesWidth");
    	component_subscribe($$self, axesWidth, value => $$invalidate(15, $axesWidth = value));
    	const axesHeight = axes.height;
    	validate_store(axesHeight, "axesHeight");
    	component_subscribe($$self, axesHeight, value => $$invalidate(18, $axesHeight = value));
    	const scale = axes.scale;
    	validate_store(scale, "scale");
    	component_subscribe($$self, scale, value => $$invalidate(19, $scale = value));
    	const writable_props = ["xValues", "yValues", "title", "lineWidth", "lineColor", "lineType"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<LineSeries> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("xValues" in $$props) $$invalidate(8, xValues = $$props.xValues);
    		if ("yValues" in $$props) $$invalidate(9, yValues = $$props.yValues);
    		if ("title" in $$props) $$invalidate(0, title = $$props.title);
    		if ("lineWidth" in $$props) $$invalidate(10, lineWidth = $$props.lineWidth);
    		if ("lineColor" in $$props) $$invalidate(11, lineColor = $$props.lineColor);
    		if ("lineType" in $$props) $$invalidate(12, lineType = $$props.lineType);
    	};

    	$$self.$capture_state = () => ({
    		getContext,
    		mrange,
    		Colors,
    		xValues,
    		yValues,
    		title,
    		lineWidth,
    		lineColor,
    		lineType,
    		xValuesRange,
    		yValuesRange,
    		axes,
    		xLim,
    		yLim,
    		axesWidth,
    		axesHeight,
    		scale,
    		x,
    		$xLim,
    		$axesWidth,
    		y,
    		$yLim,
    		$axesHeight,
    		p,
    		lineStyleStr,
    		$scale
    	});

    	$$self.$inject_state = $$props => {
    		if ("xValues" in $$props) $$invalidate(8, xValues = $$props.xValues);
    		if ("yValues" in $$props) $$invalidate(9, yValues = $$props.yValues);
    		if ("title" in $$props) $$invalidate(0, title = $$props.title);
    		if ("lineWidth" in $$props) $$invalidate(10, lineWidth = $$props.lineWidth);
    		if ("lineColor" in $$props) $$invalidate(11, lineColor = $$props.lineColor);
    		if ("lineType" in $$props) $$invalidate(12, lineType = $$props.lineType);
    		if ("x" in $$props) $$invalidate(13, x = $$props.x);
    		if ("y" in $$props) $$invalidate(16, y = $$props.y);
    		if ("p" in $$props) $$invalidate(1, p = $$props.p);
    		if ("lineStyleStr" in $$props) $$invalidate(2, lineStyleStr = $$props.lineStyleStr);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*xValues, $xLim, $axesWidth*/ 49408) {
    			// reactive variables for coordinates of data points in pixels
    			$$invalidate(13, x = axes.scaleX(xValues, $xLim, $axesWidth));
    		}

    		if ($$self.$$.dirty & /*yValues, $yLim, $axesHeight*/ 393728) {
    			$$invalidate(16, y = axes.scaleY(yValues, $yLim, $axesHeight));
    		}

    		if ($$self.$$.dirty & /*x, y*/ 73728) {
    			$$invalidate(1, p = x !== undefined && y !== undefined
    			? x.map((v, i) => `${v},${y[i]}`).join(" ")
    			: undefined);
    		}

    		if ($$self.$$.dirty & /*lineColor, lineWidth, $scale, lineType*/ 531456) {
    			$$invalidate(2, lineStyleStr = `fill:transparent;stroke:${lineColor};stroke-width: ${lineWidth}px;stroke-dasharray:${axes.LINE_STYLES[$scale][lineType - 1]}`);
    		}
    	};

    	return [
    		title,
    		p,
    		lineStyleStr,
    		xLim,
    		yLim,
    		axesWidth,
    		axesHeight,
    		scale,
    		xValues,
    		yValues,
    		lineWidth,
    		lineColor,
    		lineType,
    		x,
    		$xLim,
    		$axesWidth,
    		y,
    		$yLim,
    		$axesHeight,
    		$scale
    	];
    }

    class LineSeries extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {
    			xValues: 8,
    			yValues: 9,
    			title: 0,
    			lineWidth: 10,
    			lineColor: 11,
    			lineType: 12
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "LineSeries",
    			options,
    			id: create_fragment$5.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*xValues*/ ctx[8] === undefined && !("xValues" in props)) {
    			console.warn("<LineSeries> was created without expected prop 'xValues'");
    		}

    		if (/*yValues*/ ctx[9] === undefined && !("yValues" in props)) {
    			console.warn("<LineSeries> was created without expected prop 'yValues'");
    		}
    	}

    	get xValues() {
    		throw new Error("<LineSeries>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set xValues(value) {
    		throw new Error("<LineSeries>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get yValues() {
    		throw new Error("<LineSeries>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set yValues(value) {
    		throw new Error("<LineSeries>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get title() {
    		throw new Error("<LineSeries>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set title(value) {
    		throw new Error("<LineSeries>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get lineWidth() {
    		throw new Error("<LineSeries>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set lineWidth(value) {
    		throw new Error("<LineSeries>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get lineColor() {
    		throw new Error("<LineSeries>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set lineColor(value) {
    		throw new Error("<LineSeries>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get lineType() {
    		throw new Error("<LineSeries>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set lineType(value) {
    		throw new Error("<LineSeries>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* ../../svelte-plots-basic/src/AreaSeries.svelte generated by Svelte v3.38.2 */
    const file$1 = "../../svelte-plots-basic/src/AreaSeries.svelte";

    // (46:0) {#if p !== undefined}
    function create_if_block(ctx) {
    	let g;
    	let polygon;
    	let polygon_points_value;

    	const block = {
    		c: function create() {
    			g = svg_element("g");
    			polygon = svg_element("polygon");
    			attr_dev(polygon, "points", polygon_points_value = /*x*/ ctx[1][0] + "," + /*y0*/ ctx[2] + " " + /*p*/ ctx[3] + " " + /*x*/ ctx[1][/*x*/ ctx[1].length - 1] + "," + /*y0*/ ctx[2][0]);
    			add_location(polygon, file$1, 47, 3, 1747);
    			attr_dev(g, "class", "series lineseries");
    			attr_dev(g, "style", /*areaStyleStr*/ ctx[4]);
    			attr_dev(g, "title", /*title*/ ctx[0]);
    			add_location(g, file$1, 46, 3, 1675);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, g, anchor);
    			append_dev(g, polygon);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*x, y0, p*/ 14 && polygon_points_value !== (polygon_points_value = /*x*/ ctx[1][0] + "," + /*y0*/ ctx[2] + " " + /*p*/ ctx[3] + " " + /*x*/ ctx[1][/*x*/ ctx[1].length - 1] + "," + /*y0*/ ctx[2][0])) {
    				attr_dev(polygon, "points", polygon_points_value);
    			}

    			if (dirty & /*areaStyleStr*/ 16) {
    				attr_dev(g, "style", /*areaStyleStr*/ ctx[4]);
    			}

    			if (dirty & /*title*/ 1) {
    				attr_dev(g, "title", /*title*/ ctx[0]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(g);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(46:0) {#if p !== undefined}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let if_block_anchor;
    	let if_block = /*p*/ ctx[3] !== undefined && create_if_block(ctx);

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
    			if (/*p*/ ctx[3] !== undefined) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block(ctx);
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
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let y0;
    	let x;
    	let y;
    	let p;
    	let areaStyleStr;
    	let $yLim;
    	let $axesHeight;
    	let $xLim;
    	let $axesWidth;
    	let $scale;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("AreaSeries", slots, []);
    	let { xValues } = $$props;
    	let { yValues } = $$props;
    	let { title = "" } = $$props;
    	let { lineWidth = 1 } = $$props;
    	let { lineColor = Colors.PRIMARY } = $$props;
    	let { fillColor = Colors.PRIMARY } = $$props;
    	let { opacity = 1 } = $$props;
    	let { lineType = 1 } = $$props;

    	/* sanity check of input parameters */
    	if (!Array.isArray(xValues) || !Array.isArray(yValues) || xValues.length != yValues.length) {
    		throw "AreaSeries: parameters 'xValues' and 'yValues' must be numeric vectors of the same length.";
    	}

    	// compute ranges for x and y values
    	const xValuesRange = mrange(xValues, 0.05);

    	const yValuesRange = mrange(yValues, 0.05);

    	// get axes context and adjust axes limits
    	const axes = getContext("axes");

    	axes.adjustXAxisLimits(xValuesRange);
    	axes.adjustYAxisLimits(yValuesRange);

    	// get reactive variables needed to compute coordinates
    	const xLim = axes.xLim;

    	validate_store(xLim, "xLim");
    	component_subscribe($$self, xLim, value => $$invalidate(19, $xLim = value));
    	const yLim = axes.yLim;
    	validate_store(yLim, "yLim");
    	component_subscribe($$self, yLim, value => $$invalidate(17, $yLim = value));
    	const axesWidth = axes.width;
    	validate_store(axesWidth, "axesWidth");
    	component_subscribe($$self, axesWidth, value => $$invalidate(20, $axesWidth = value));
    	const axesHeight = axes.height;
    	validate_store(axesHeight, "axesHeight");
    	component_subscribe($$self, axesHeight, value => $$invalidate(18, $axesHeight = value));
    	const scale = axes.scale;
    	validate_store(scale, "scale");
    	component_subscribe($$self, scale, value => $$invalidate(22, $scale = value));

    	const writable_props = [
    		"xValues",
    		"yValues",
    		"title",
    		"lineWidth",
    		"lineColor",
    		"fillColor",
    		"opacity",
    		"lineType"
    	];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<AreaSeries> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("xValues" in $$props) $$invalidate(10, xValues = $$props.xValues);
    		if ("yValues" in $$props) $$invalidate(11, yValues = $$props.yValues);
    		if ("title" in $$props) $$invalidate(0, title = $$props.title);
    		if ("lineWidth" in $$props) $$invalidate(12, lineWidth = $$props.lineWidth);
    		if ("lineColor" in $$props) $$invalidate(13, lineColor = $$props.lineColor);
    		if ("fillColor" in $$props) $$invalidate(14, fillColor = $$props.fillColor);
    		if ("opacity" in $$props) $$invalidate(15, opacity = $$props.opacity);
    		if ("lineType" in $$props) $$invalidate(16, lineType = $$props.lineType);
    	};

    	$$self.$capture_state = () => ({
    		getContext,
    		mrange,
    		Colors,
    		xValues,
    		yValues,
    		title,
    		lineWidth,
    		lineColor,
    		fillColor,
    		opacity,
    		lineType,
    		xValuesRange,
    		yValuesRange,
    		axes,
    		xLim,
    		yLim,
    		axesWidth,
    		axesHeight,
    		scale,
    		y0,
    		$yLim,
    		$axesHeight,
    		x,
    		$xLim,
    		$axesWidth,
    		y,
    		p,
    		areaStyleStr,
    		$scale
    	});

    	$$self.$inject_state = $$props => {
    		if ("xValues" in $$props) $$invalidate(10, xValues = $$props.xValues);
    		if ("yValues" in $$props) $$invalidate(11, yValues = $$props.yValues);
    		if ("title" in $$props) $$invalidate(0, title = $$props.title);
    		if ("lineWidth" in $$props) $$invalidate(12, lineWidth = $$props.lineWidth);
    		if ("lineColor" in $$props) $$invalidate(13, lineColor = $$props.lineColor);
    		if ("fillColor" in $$props) $$invalidate(14, fillColor = $$props.fillColor);
    		if ("opacity" in $$props) $$invalidate(15, opacity = $$props.opacity);
    		if ("lineType" in $$props) $$invalidate(16, lineType = $$props.lineType);
    		if ("y0" in $$props) $$invalidate(2, y0 = $$props.y0);
    		if ("x" in $$props) $$invalidate(1, x = $$props.x);
    		if ("y" in $$props) $$invalidate(21, y = $$props.y);
    		if ("p" in $$props) $$invalidate(3, p = $$props.p);
    		if ("areaStyleStr" in $$props) $$invalidate(4, areaStyleStr = $$props.areaStyleStr);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$yLim, $axesHeight*/ 393216) {
    			// reactive variables for coordinates of data points in pixels
    			$$invalidate(2, y0 = axes.scaleY([0], $yLim, $axesHeight));
    		}

    		if ($$self.$$.dirty & /*xValues, $xLim, $axesWidth*/ 1573888) {
    			$$invalidate(1, x = axes.scaleX(xValues, $xLim, $axesWidth));
    		}

    		if ($$self.$$.dirty & /*yValues, $yLim, $axesHeight*/ 395264) {
    			$$invalidate(21, y = axes.scaleY(yValues, $yLim, $axesHeight));
    		}

    		if ($$self.$$.dirty & /*x, y*/ 2097154) {
    			$$invalidate(3, p = x !== undefined && y !== undefined
    			? x.map((v, i) => `${v},${y[i]}`).join(" ")
    			: undefined);
    		}

    		if ($$self.$$.dirty & /*opacity, fillColor, lineColor, lineWidth, $scale, lineType*/ 4321280) {
    			$$invalidate(4, areaStyleStr = `opacity:${opacity};fill:${fillColor};stroke:${lineColor};stroke-width: ${lineWidth}px;stroke-dasharray:${axes.LINE_STYLES[$scale][lineType - 1]}`);
    		}
    	};

    	return [
    		title,
    		x,
    		y0,
    		p,
    		areaStyleStr,
    		xLim,
    		yLim,
    		axesWidth,
    		axesHeight,
    		scale,
    		xValues,
    		yValues,
    		lineWidth,
    		lineColor,
    		fillColor,
    		opacity,
    		lineType,
    		$yLim,
    		$axesHeight,
    		$xLim,
    		$axesWidth,
    		y,
    		$scale
    	];
    }

    class AreaSeries extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {
    			xValues: 10,
    			yValues: 11,
    			title: 0,
    			lineWidth: 12,
    			lineColor: 13,
    			fillColor: 14,
    			opacity: 15,
    			lineType: 16
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "AreaSeries",
    			options,
    			id: create_fragment$4.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*xValues*/ ctx[10] === undefined && !("xValues" in props)) {
    			console.warn("<AreaSeries> was created without expected prop 'xValues'");
    		}

    		if (/*yValues*/ ctx[11] === undefined && !("yValues" in props)) {
    			console.warn("<AreaSeries> was created without expected prop 'yValues'");
    		}
    	}

    	get xValues() {
    		throw new Error("<AreaSeries>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set xValues(value) {
    		throw new Error("<AreaSeries>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get yValues() {
    		throw new Error("<AreaSeries>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set yValues(value) {
    		throw new Error("<AreaSeries>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get title() {
    		throw new Error("<AreaSeries>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set title(value) {
    		throw new Error("<AreaSeries>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get lineWidth() {
    		throw new Error("<AreaSeries>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set lineWidth(value) {
    		throw new Error("<AreaSeries>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get lineColor() {
    		throw new Error("<AreaSeries>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set lineColor(value) {
    		throw new Error("<AreaSeries>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get fillColor() {
    		throw new Error("<AreaSeries>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set fillColor(value) {
    		throw new Error("<AreaSeries>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get opacity() {
    		throw new Error("<AreaSeries>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set opacity(value) {
    		throw new Error("<AreaSeries>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get lineType() {
    		throw new Error("<AreaSeries>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set lineType(value) {
    		throw new Error("<AreaSeries>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/PopulationPlot.svelte generated by Svelte v3.38.2 */

    const { Error: Error_1 } = globals;

    // (42:0) <Axes title="Population (N = {popSize})" limX={mrange(pop[0], 0.1)} limY={mrange(pop[1], 0.05)} >
    function create_default_slot$3(ctx) {
    	let scatterseries0;
    	let t0;
    	let scatterseries1;
    	let t1;
    	let scatterseries2;
    	let t2;
    	let scatterseries3;
    	let current;

    	scatterseries0 = new ScatterSeries({
    			props: {
    				xValues: /*pop1X*/ ctx[1],
    				yValues: /*pop1Y*/ ctx[2],
    				borderWidth: 1.5,
    				markerSize: 1.5,
    				borderColor: /*colors*/ ctx[0][0] + "50",
    				faceColor: /*colors*/ ctx[0][0] + "50"
    			},
    			$$inline: true
    		});

    	scatterseries1 = new ScatterSeries({
    			props: {
    				xValues: /*pop2X*/ ctx[3],
    				yValues: /*pop2Y*/ ctx[4],
    				borderWidth: 1.5,
    				markerSize: 1.5,
    				borderColor: /*colors*/ ctx[0][1] + "50",
    				faceColor: /*colors*/ ctx[0][1] + "50"
    			},
    			$$inline: true
    		});

    	scatterseries2 = new ScatterSeries({
    			props: {
    				xValues: /*samp1X*/ ctx[5],
    				yValues: /*samp1Y*/ ctx[6],
    				borderWidth: 2.75,
    				markerSize: 1.65,
    				borderColor: /*colors*/ ctx[0][0],
    				faceColor: "white"
    			},
    			$$inline: true
    		});

    	scatterseries3 = new ScatterSeries({
    			props: {
    				xValues: /*samp2X*/ ctx[7],
    				yValues: /*samp2Y*/ ctx[8],
    				borderWidth: 2.75,
    				markerSize: 1.65,
    				borderColor: /*colors*/ ctx[0][1],
    				faceColor: "white"
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(scatterseries0.$$.fragment);
    			t0 = space();
    			create_component(scatterseries1.$$.fragment);
    			t1 = space();
    			create_component(scatterseries2.$$.fragment);
    			t2 = space();
    			create_component(scatterseries3.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(scatterseries0, target, anchor);
    			insert_dev(target, t0, anchor);
    			mount_component(scatterseries1, target, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(scatterseries2, target, anchor);
    			insert_dev(target, t2, anchor);
    			mount_component(scatterseries3, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const scatterseries0_changes = {};
    			if (dirty & /*pop1X*/ 2) scatterseries0_changes.xValues = /*pop1X*/ ctx[1];
    			if (dirty & /*pop1Y*/ 4) scatterseries0_changes.yValues = /*pop1Y*/ ctx[2];
    			if (dirty & /*colors*/ 1) scatterseries0_changes.borderColor = /*colors*/ ctx[0][0] + "50";
    			if (dirty & /*colors*/ 1) scatterseries0_changes.faceColor = /*colors*/ ctx[0][0] + "50";
    			scatterseries0.$set(scatterseries0_changes);
    			const scatterseries1_changes = {};
    			if (dirty & /*pop2X*/ 8) scatterseries1_changes.xValues = /*pop2X*/ ctx[3];
    			if (dirty & /*pop2Y*/ 16) scatterseries1_changes.yValues = /*pop2Y*/ ctx[4];
    			if (dirty & /*colors*/ 1) scatterseries1_changes.borderColor = /*colors*/ ctx[0][1] + "50";
    			if (dirty & /*colors*/ 1) scatterseries1_changes.faceColor = /*colors*/ ctx[0][1] + "50";
    			scatterseries1.$set(scatterseries1_changes);
    			const scatterseries2_changes = {};
    			if (dirty & /*samp1X*/ 32) scatterseries2_changes.xValues = /*samp1X*/ ctx[5];
    			if (dirty & /*samp1Y*/ 64) scatterseries2_changes.yValues = /*samp1Y*/ ctx[6];
    			if (dirty & /*colors*/ 1) scatterseries2_changes.borderColor = /*colors*/ ctx[0][0];
    			scatterseries2.$set(scatterseries2_changes);
    			const scatterseries3_changes = {};
    			if (dirty & /*samp2X*/ 128) scatterseries3_changes.xValues = /*samp2X*/ ctx[7];
    			if (dirty & /*samp2Y*/ 256) scatterseries3_changes.yValues = /*samp2Y*/ ctx[8];
    			if (dirty & /*colors*/ 1) scatterseries3_changes.borderColor = /*colors*/ ctx[0][1];
    			scatterseries3.$set(scatterseries3_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(scatterseries0.$$.fragment, local);
    			transition_in(scatterseries1.$$.fragment, local);
    			transition_in(scatterseries2.$$.fragment, local);
    			transition_in(scatterseries3.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(scatterseries0.$$.fragment, local);
    			transition_out(scatterseries1.$$.fragment, local);
    			transition_out(scatterseries2.$$.fragment, local);
    			transition_out(scatterseries3.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(scatterseries0, detaching);
    			if (detaching) detach_dev(t0);
    			destroy_component(scatterseries1, detaching);
    			if (detaching) detach_dev(t1);
    			destroy_component(scatterseries2, detaching);
    			if (detaching) detach_dev(t2);
    			destroy_component(scatterseries3, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$3.name,
    		type: "slot",
    		source: "(42:0) <Axes title=\\\"Population (N = {popSize})\\\" limX={mrange(pop[0], 0.1)} limY={mrange(pop[1], 0.05)} >",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let axes;
    	let current;

    	axes = new Axes({
    			props: {
    				title: "Population (N = " + /*popSize*/ ctx[9] + ")",
    				limX: mrange(/*pop*/ ctx[10][0], 0.1),
    				limY: mrange(/*pop*/ ctx[10][1], 0.05),
    				$$slots: { default: [create_default_slot$3] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(axes.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error_1("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(axes, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const axes_changes = {};

    			if (dirty & /*$$scope, samp2X, samp2Y, colors, samp1X, samp1Y, pop2X, pop2Y, pop1X, pop1Y*/ 524799) {
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
    	let pop1Index;
    	let pop2Index;
    	let pop1X;
    	let pop1Y;
    	let pop2X;
    	let pop2Y;
    	let samp1Index;
    	let samp2Index;
    	let samp1X;
    	let samp1Y;
    	let samp2X;
    	let samp2Y;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("PopulationPlot", slots, []);
    	let { groups } = $$props;
    	let { sample } = $$props;
    	let { colors } = $$props;

    	// size of population and axes plus coordinates of the points
    	const popSize = groups.length;

    	const popAxisSize = Math.round(Math.sqrt(popSize));
    	const popIndex = seq(1, popSize, popSize);
    	const pop = expandGrid(seq(1, popAxisSize, popAxisSize), seq(1, popAxisSize, popAxisSize));

    	if (popAxisSize ** 2 !== popSize) {
    		throw new Error("Population size should be a square of a number.");
    	}

    	const writable_props = ["groups", "sample", "colors"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<PopulationPlot> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("groups" in $$props) $$invalidate(11, groups = $$props.groups);
    		if ("sample" in $$props) $$invalidate(12, sample = $$props.sample);
    		if ("colors" in $$props) $$invalidate(0, colors = $$props.colors);
    	};

    	$$self.$capture_state = () => ({
    		seq,
    		subset,
    		expandGrid,
    		mrange,
    		Axes,
    		ScatterSeries,
    		groups,
    		sample,
    		colors,
    		popSize,
    		popAxisSize,
    		popIndex,
    		pop,
    		pop1Index,
    		pop2Index,
    		pop1X,
    		pop1Y,
    		pop2X,
    		pop2Y,
    		samp1Index,
    		samp2Index,
    		samp1X,
    		samp1Y,
    		samp2X,
    		samp2Y
    	});

    	$$self.$inject_state = $$props => {
    		if ("groups" in $$props) $$invalidate(11, groups = $$props.groups);
    		if ("sample" in $$props) $$invalidate(12, sample = $$props.sample);
    		if ("colors" in $$props) $$invalidate(0, colors = $$props.colors);
    		if ("pop1Index" in $$props) $$invalidate(13, pop1Index = $$props.pop1Index);
    		if ("pop2Index" in $$props) $$invalidate(14, pop2Index = $$props.pop2Index);
    		if ("pop1X" in $$props) $$invalidate(1, pop1X = $$props.pop1X);
    		if ("pop1Y" in $$props) $$invalidate(2, pop1Y = $$props.pop1Y);
    		if ("pop2X" in $$props) $$invalidate(3, pop2X = $$props.pop2X);
    		if ("pop2Y" in $$props) $$invalidate(4, pop2Y = $$props.pop2Y);
    		if ("samp1Index" in $$props) $$invalidate(15, samp1Index = $$props.samp1Index);
    		if ("samp2Index" in $$props) $$invalidate(16, samp2Index = $$props.samp2Index);
    		if ("samp1X" in $$props) $$invalidate(5, samp1X = $$props.samp1X);
    		if ("samp1Y" in $$props) $$invalidate(6, samp1Y = $$props.samp1Y);
    		if ("samp2X" in $$props) $$invalidate(7, samp2X = $$props.samp2X);
    		if ("samp2Y" in $$props) $$invalidate(8, samp2Y = $$props.samp2Y);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*groups*/ 2048) {
    			// indices for blue and red circles
    			$$invalidate(13, pop1Index = popIndex.filter((v, i) => groups[i] == 1));
    		}

    		if ($$self.$$.dirty & /*groups*/ 2048) {
    			$$invalidate(14, pop2Index = popIndex.filter((v, i) => groups[i] == 2));
    		}

    		if ($$self.$$.dirty & /*pop1Index*/ 8192) {
    			// X and Y coordinates for each group
    			$$invalidate(1, pop1X = subset(pop[0], pop1Index));
    		}

    		if ($$self.$$.dirty & /*pop1Index*/ 8192) {
    			$$invalidate(2, pop1Y = subset(pop[1], pop1Index));
    		}

    		if ($$self.$$.dirty & /*pop2Index*/ 16384) {
    			$$invalidate(3, pop2X = subset(pop[0], pop2Index));
    		}

    		if ($$self.$$.dirty & /*pop2Index*/ 16384) {
    			$$invalidate(4, pop2Y = subset(pop[1], pop2Index));
    		}

    		if ($$self.$$.dirty & /*sample, groups*/ 6144) {
    			// indices of sample points for each group
    			$$invalidate(15, samp1Index = sample.filter(v => groups[v - 1] == 1));
    		}

    		if ($$self.$$.dirty & /*sample, groups*/ 6144) {
    			$$invalidate(16, samp2Index = sample.filter(v => groups[v - 1] == 2));
    		}

    		if ($$self.$$.dirty & /*samp1Index*/ 32768) {
    			// X and Y coordinates of sample points from group 1
    			$$invalidate(5, samp1X = subset(pop[0], samp1Index));
    		}

    		if ($$self.$$.dirty & /*samp1Index*/ 32768) {
    			$$invalidate(6, samp1Y = subset(pop[1], samp1Index));
    		}

    		if ($$self.$$.dirty & /*samp2Index*/ 65536) {
    			// X and Y coordinates of sample points from group 2
    			$$invalidate(7, samp2X = subset(pop[0], samp2Index));
    		}

    		if ($$self.$$.dirty & /*samp2Index*/ 65536) {
    			$$invalidate(8, samp2Y = subset(pop[1], samp2Index));
    		}
    	};

    	return [
    		colors,
    		pop1X,
    		pop1Y,
    		pop2X,
    		pop2Y,
    		samp1X,
    		samp1Y,
    		samp2X,
    		samp2Y,
    		popSize,
    		pop,
    		groups,
    		sample,
    		pop1Index,
    		pop2Index,
    		samp1Index,
    		samp2Index
    	];
    }

    class PopulationPlot extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { groups: 11, sample: 12, colors: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "PopulationPlot",
    			options,
    			id: create_fragment$3.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*groups*/ ctx[11] === undefined && !("groups" in props)) {
    			console.warn("<PopulationPlot> was created without expected prop 'groups'");
    		}

    		if (/*sample*/ ctx[12] === undefined && !("sample" in props)) {
    			console.warn("<PopulationPlot> was created without expected prop 'sample'");
    		}

    		if (/*colors*/ ctx[0] === undefined && !("colors" in props)) {
    			console.warn("<PopulationPlot> was created without expected prop 'colors'");
    		}
    	}

    	get groups() {
    		throw new Error_1("<PopulationPlot>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set groups(value) {
    		throw new Error_1("<PopulationPlot>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get sample() {
    		throw new Error_1("<PopulationPlot>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set sample(value) {
    		throw new Error_1("<PopulationPlot>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get colors() {
    		throw new Error_1("<PopulationPlot>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set colors(value) {
    		throw new Error_1("<PopulationPlot>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/SamplePlot.svelte generated by Svelte v3.38.2 */

    // (31:0) <Axes limX={[0.25, nInRow + 0.5]} limY={[-1.25, 6.25]}>
    function create_default_slot$2(ctx) {
    	let scatterseries0;
    	let t;
    	let scatterseries1;
    	let current;

    	scatterseries0 = new ScatterSeries({
    			props: {
    				xValues: /*samp1X*/ ctx[1],
    				yValues: /*samp1Y*/ ctx[2],
    				borderWidth: 3,
    				markerSize: 2.15,
    				borderColor: /*colors*/ ctx[0][0],
    				faceColor: "white"
    			},
    			$$inline: true
    		});

    	scatterseries1 = new ScatterSeries({
    			props: {
    				xValues: /*samp2X*/ ctx[3],
    				yValues: /*samp2Y*/ ctx[4],
    				borderWidth: 3,
    				markerSize: 2.15,
    				borderColor: /*colors*/ ctx[0][1],
    				faceColor: "white"
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(scatterseries0.$$.fragment);
    			t = space();
    			create_component(scatterseries1.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(scatterseries0, target, anchor);
    			insert_dev(target, t, anchor);
    			mount_component(scatterseries1, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const scatterseries0_changes = {};
    			if (dirty & /*samp1X*/ 2) scatterseries0_changes.xValues = /*samp1X*/ ctx[1];
    			if (dirty & /*samp1Y*/ 4) scatterseries0_changes.yValues = /*samp1Y*/ ctx[2];
    			if (dirty & /*colors*/ 1) scatterseries0_changes.borderColor = /*colors*/ ctx[0][0];
    			scatterseries0.$set(scatterseries0_changes);
    			const scatterseries1_changes = {};
    			if (dirty & /*samp2X*/ 8) scatterseries1_changes.xValues = /*samp2X*/ ctx[3];
    			if (dirty & /*samp2Y*/ 16) scatterseries1_changes.yValues = /*samp2Y*/ ctx[4];
    			if (dirty & /*colors*/ 1) scatterseries1_changes.borderColor = /*colors*/ ctx[0][1];
    			scatterseries1.$set(scatterseries1_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(scatterseries0.$$.fragment, local);
    			transition_in(scatterseries1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(scatterseries0.$$.fragment, local);
    			transition_out(scatterseries1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(scatterseries0, detaching);
    			if (detaching) detach_dev(t);
    			destroy_component(scatterseries1, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$2.name,
    		type: "slot",
    		source: "(31:0) <Axes limX={[0.25, nInRow + 0.5]} limY={[-1.25, 6.25]}>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let axes;
    	let current;

    	axes = new Axes({
    			props: {
    				limX: [0.25, nInRow + 0.5],
    				limY: [-1.25, 6.25],
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

    			if (dirty & /*$$scope, samp2X, samp2Y, colors, samp1X, samp1Y*/ 8223) {
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
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const nInRow = 10;

    function instance$2($$self, $$props, $$invalidate) {
    	let sampIndex;
    	let sampGroups;
    	let samp1Index;
    	let samp2Index;
    	let sampX;
    	let sampY;
    	let samp1X;
    	let samp1Y;
    	let samp2X;
    	let samp2Y;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("SamplePlot", slots, []);
    	let { groups } = $$props;
    	let { sample } = $$props;
    	let { colors } = $$props;
    	const writable_props = ["groups", "sample", "colors"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<SamplePlot> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("groups" in $$props) $$invalidate(5, groups = $$props.groups);
    		if ("sample" in $$props) $$invalidate(6, sample = $$props.sample);
    		if ("colors" in $$props) $$invalidate(0, colors = $$props.colors);
    	};

    	$$self.$capture_state = () => ({
    		seq,
    		subset,
    		Axes,
    		ScatterSeries,
    		groups,
    		sample,
    		colors,
    		nInRow,
    		sampIndex,
    		sampGroups,
    		samp1Index,
    		samp2Index,
    		sampX,
    		sampY,
    		samp1X,
    		samp1Y,
    		samp2X,
    		samp2Y
    	});

    	$$self.$inject_state = $$props => {
    		if ("groups" in $$props) $$invalidate(5, groups = $$props.groups);
    		if ("sample" in $$props) $$invalidate(6, sample = $$props.sample);
    		if ("colors" in $$props) $$invalidate(0, colors = $$props.colors);
    		if ("sampIndex" in $$props) $$invalidate(7, sampIndex = $$props.sampIndex);
    		if ("sampGroups" in $$props) $$invalidate(8, sampGroups = $$props.sampGroups);
    		if ("samp1Index" in $$props) $$invalidate(9, samp1Index = $$props.samp1Index);
    		if ("samp2Index" in $$props) $$invalidate(10, samp2Index = $$props.samp2Index);
    		if ("sampX" in $$props) $$invalidate(11, sampX = $$props.sampX);
    		if ("sampY" in $$props) $$invalidate(12, sampY = $$props.sampY);
    		if ("samp1X" in $$props) $$invalidate(1, samp1X = $$props.samp1X);
    		if ("samp1Y" in $$props) $$invalidate(2, samp1Y = $$props.samp1Y);
    		if ("samp2X" in $$props) $$invalidate(3, samp2X = $$props.samp2X);
    		if ("samp2Y" in $$props) $$invalidate(4, samp2Y = $$props.samp2Y);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*sample*/ 64) {
    			// indices and groups of sample individuals
    			$$invalidate(7, sampIndex = seq(1, sample.length, sample.length));
    		}

    		if ($$self.$$.dirty & /*groups, sample*/ 96) {
    			$$invalidate(8, sampGroups = subset(groups, sample));
    		}

    		if ($$self.$$.dirty & /*sampIndex, sampGroups*/ 384) {
    			// indices of points for each group
    			$$invalidate(9, samp1Index = sampIndex.filter(v => sampGroups[v - 1] == 1));
    		}

    		if ($$self.$$.dirty & /*sampIndex, sampGroups*/ 384) {
    			$$invalidate(10, samp2Index = sampIndex.filter(v => sampGroups[v - 1] == 2));
    		}

    		if ($$self.$$.dirty & /*sampIndex*/ 128) {
    			// coordinates of the sample circle
    			$$invalidate(11, sampX = sampIndex.map(v => (v - 1) % nInRow + 1));
    		}

    		if ($$self.$$.dirty & /*sampIndex*/ 128) {
    			$$invalidate(12, sampY = sampIndex.map(v => Math.floor((v - 1) / nInRow + 1)));
    		}

    		if ($$self.$$.dirty & /*sampX, samp1Index*/ 2560) {
    			// X and Y coordinates for each group
    			$$invalidate(1, samp1X = subset(sampX, samp1Index));
    		}

    		if ($$self.$$.dirty & /*sampY, samp1Index*/ 4608) {
    			$$invalidate(2, samp1Y = subset(sampY, samp1Index));
    		}

    		if ($$self.$$.dirty & /*sampX, samp2Index*/ 3072) {
    			$$invalidate(3, samp2X = subset(sampX, samp2Index));
    		}

    		if ($$self.$$.dirty & /*sampY, samp2Index*/ 5120) {
    			$$invalidate(4, samp2Y = subset(sampY, samp2Index));
    		}
    	};

    	return [
    		colors,
    		samp1X,
    		samp1Y,
    		samp2X,
    		samp2Y,
    		groups,
    		sample,
    		sampIndex,
    		sampGroups,
    		samp1Index,
    		samp2Index,
    		sampX,
    		sampY
    	];
    }

    class SamplePlot extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { groups: 5, sample: 6, colors: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "SamplePlot",
    			options,
    			id: create_fragment$2.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*groups*/ ctx[5] === undefined && !("groups" in props)) {
    			console.warn("<SamplePlot> was created without expected prop 'groups'");
    		}

    		if (/*sample*/ ctx[6] === undefined && !("sample" in props)) {
    			console.warn("<SamplePlot> was created without expected prop 'sample'");
    		}

    		if (/*colors*/ ctx[0] === undefined && !("colors" in props)) {
    			console.warn("<SamplePlot> was created without expected prop 'colors'");
    		}
    	}

    	get groups() {
    		throw new Error("<SamplePlot>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set groups(value) {
    		throw new Error("<SamplePlot>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get sample() {
    		throw new Error("<SamplePlot>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set sample(value) {
    		throw new Error("<SamplePlot>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get colors() {
    		throw new Error("<SamplePlot>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set colors(value) {
    		throw new Error("<SamplePlot>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/CIPlot.svelte generated by Svelte v3.38.2 */

    // (59:0) <Axes limX={[-0.02, 1.02]} limY={[-0.01, max(f) * 1.65]}>
    function create_default_slot$1(ctx) {
    	let textlegend;
    	let t0;
    	let areaseries;
    	let t1;
    	let lineseries;
    	let t2;
    	let segments;
    	let current;

    	textlegend = new TextLegend({
    			props: {
    				textSize: 1.15,
    				x: 90,
    				y: max(/*f*/ ctx[4]) * 1.55,
    				pos: 2,
    				dx: "1.25em",
    				elements: [
    					/*tableNSamplesInside*/ ctx[7],
    					"95% CI: " + /*tableCI*/ ctx[6],
    					"sample prop.: " + /*sampProp*/ ctx[1].toFixed(2)
    				]
    			},
    			$$inline: true
    		});

    	areaseries = new AreaSeries({
    			props: {
    				xValues: /*cix*/ ctx[3],
    				yValues: /*cif*/ ctx[5],
    				lineColor: /*colors*/ ctx[0][0] + "40",
    				fillColor: /*colors*/ ctx[0][0] + "40"
    			},
    			$$inline: true
    		});

    	lineseries = new LineSeries({
    			props: {
    				xValues: /*x*/ ctx[2],
    				yValues: /*f*/ ctx[4],
    				lineColor: /*colors*/ ctx[0][0] + "40"
    			},
    			$$inline: true
    		});

    	segments = new Segments({
    			props: {
    				xStart: [/*sampProp*/ ctx[1]],
    				xEnd: [/*sampProp*/ ctx[1]],
    				yStart: [0],
    				yEnd: [max(/*f*/ ctx[4])],
    				lineColor: /*colors*/ ctx[0][0]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(textlegend.$$.fragment);
    			t0 = space();
    			create_component(areaseries.$$.fragment);
    			t1 = space();
    			create_component(lineseries.$$.fragment);
    			t2 = space();
    			create_component(segments.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(textlegend, target, anchor);
    			insert_dev(target, t0, anchor);
    			mount_component(areaseries, target, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(lineseries, target, anchor);
    			insert_dev(target, t2, anchor);
    			mount_component(segments, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const textlegend_changes = {};
    			if (dirty & /*f*/ 16) textlegend_changes.y = max(/*f*/ ctx[4]) * 1.55;

    			if (dirty & /*tableNSamplesInside, tableCI, sampProp*/ 194) textlegend_changes.elements = [
    				/*tableNSamplesInside*/ ctx[7],
    				"95% CI: " + /*tableCI*/ ctx[6],
    				"sample prop.: " + /*sampProp*/ ctx[1].toFixed(2)
    			];

    			textlegend.$set(textlegend_changes);
    			const areaseries_changes = {};
    			if (dirty & /*cix*/ 8) areaseries_changes.xValues = /*cix*/ ctx[3];
    			if (dirty & /*cif*/ 32) areaseries_changes.yValues = /*cif*/ ctx[5];
    			if (dirty & /*colors*/ 1) areaseries_changes.lineColor = /*colors*/ ctx[0][0] + "40";
    			if (dirty & /*colors*/ 1) areaseries_changes.fillColor = /*colors*/ ctx[0][0] + "40";
    			areaseries.$set(areaseries_changes);
    			const lineseries_changes = {};
    			if (dirty & /*x*/ 4) lineseries_changes.xValues = /*x*/ ctx[2];
    			if (dirty & /*f*/ 16) lineseries_changes.yValues = /*f*/ ctx[4];
    			if (dirty & /*colors*/ 1) lineseries_changes.lineColor = /*colors*/ ctx[0][0] + "40";
    			lineseries.$set(lineseries_changes);
    			const segments_changes = {};
    			if (dirty & /*sampProp*/ 2) segments_changes.xStart = [/*sampProp*/ ctx[1]];
    			if (dirty & /*sampProp*/ 2) segments_changes.xEnd = [/*sampProp*/ ctx[1]];
    			if (dirty & /*f*/ 16) segments_changes.yEnd = [max(/*f*/ ctx[4])];
    			if (dirty & /*colors*/ 1) segments_changes.lineColor = /*colors*/ ctx[0][0];
    			segments.$set(segments_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(textlegend.$$.fragment, local);
    			transition_in(areaseries.$$.fragment, local);
    			transition_in(lineseries.$$.fragment, local);
    			transition_in(segments.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(textlegend.$$.fragment, local);
    			transition_out(areaseries.$$.fragment, local);
    			transition_out(lineseries.$$.fragment, local);
    			transition_out(segments.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(textlegend, detaching);
    			if (detaching) detach_dev(t0);
    			destroy_component(areaseries, detaching);
    			if (detaching) detach_dev(t1);
    			destroy_component(lineseries, detaching);
    			if (detaching) detach_dev(t2);
    			destroy_component(segments, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$1.name,
    		type: "slot",
    		source: "(59:0) <Axes limX={[-0.02, 1.02]} limY={[-0.01, max(f) * 1.65]}>",
    		ctx
    	});

    	return block;
    }

    // (72:3) 
    function create_xaxis_slot(ctx) {
    	let xaxis;
    	let current;
    	xaxis = new XAxis({ props: { slot: "xaxis" }, $$inline: true });

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
    		source: "(72:3) ",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let axes;
    	let current;

    	axes = new Axes({
    			props: {
    				limX: [-0.02, 1.02],
    				limY: [-0.01, max(/*f*/ ctx[4]) * 1.65],
    				$$slots: {
    					xaxis: [create_xaxis_slot],
    					default: [create_default_slot$1]
    				},
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
    			if (dirty & /*f*/ 16) axes_changes.limY = [-0.01, max(/*f*/ ctx[4]) * 1.65];

    			if (dirty & /*$$scope, sampProp, f, colors, x, cix, cif, tableNSamplesInside, tableCI*/ 262399) {
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
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let sd;
    	let x;
    	let f;
    	let ci;
    	let cix;
    	let cif;
    	let nSamples;
    	let nSamplesInside;
    	let tableCI;
    	let tableNSamplesInside;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("CIPlot", slots, []);
    	let { groups } = $$props;
    	let { sample } = $$props;
    	let { colors } = $$props;
    	let sampStat = [];
    	let popProp;
    	let sampProp;
    	let sampleSize;
    	let sampleSizeOld = sample.length;
    	const writable_props = ["groups", "sample", "colors"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<CIPlot> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("groups" in $$props) $$invalidate(8, groups = $$props.groups);
    		if ("sample" in $$props) $$invalidate(9, sample = $$props.sample);
    		if ("colors" in $$props) $$invalidate(0, colors = $$props.colors);
    	};

    	$$self.$capture_state = () => ({
    		sum,
    		seq,
    		subset,
    		min,
    		max,
    		dnorm,
    		Axes,
    		XAxis,
    		LineSeries,
    		AreaSeries,
    		TextLegend,
    		Segments,
    		groups,
    		sample,
    		colors,
    		sampStat,
    		popProp,
    		sampProp,
    		sampleSize,
    		sampleSizeOld,
    		sd,
    		x,
    		f,
    		ci,
    		cix,
    		cif,
    		nSamples,
    		nSamplesInside,
    		tableCI,
    		tableNSamplesInside
    	});

    	$$self.$inject_state = $$props => {
    		if ("groups" in $$props) $$invalidate(8, groups = $$props.groups);
    		if ("sample" in $$props) $$invalidate(9, sample = $$props.sample);
    		if ("colors" in $$props) $$invalidate(0, colors = $$props.colors);
    		if ("sampStat" in $$props) $$invalidate(10, sampStat = $$props.sampStat);
    		if ("popProp" in $$props) $$invalidate(11, popProp = $$props.popProp);
    		if ("sampProp" in $$props) $$invalidate(1, sampProp = $$props.sampProp);
    		if ("sampleSize" in $$props) $$invalidate(12, sampleSize = $$props.sampleSize);
    		if ("sampleSizeOld" in $$props) $$invalidate(13, sampleSizeOld = $$props.sampleSizeOld);
    		if ("sd" in $$props) $$invalidate(14, sd = $$props.sd);
    		if ("x" in $$props) $$invalidate(2, x = $$props.x);
    		if ("f" in $$props) $$invalidate(4, f = $$props.f);
    		if ("ci" in $$props) $$invalidate(15, ci = $$props.ci);
    		if ("cix" in $$props) $$invalidate(3, cix = $$props.cix);
    		if ("cif" in $$props) $$invalidate(5, cif = $$props.cif);
    		if ("nSamples" in $$props) $$invalidate(16, nSamples = $$props.nSamples);
    		if ("nSamplesInside" in $$props) $$invalidate(17, nSamplesInside = $$props.nSamplesInside);
    		if ("tableCI" in $$props) $$invalidate(6, tableCI = $$props.tableCI);
    		if ("tableNSamplesInside" in $$props) $$invalidate(7, tableNSamplesInside = $$props.tableNSamplesInside);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*sample, sampleSize, sampleSizeOld*/ 12800) {
    			// when sample size has changed - reset statistics
    			{
    				$$invalidate(12, sampleSize = sample.length);

    				if (sampleSize != sampleSizeOld) {
    					$$invalidate(13, sampleSizeOld = sampleSize);
    					$$invalidate(10, sampStat = []);
    				}
    			}
    		}

    		if ($$self.$$.dirty & /*groups, sample, sampleSize*/ 4864) {
    			// proportion of current sample
    			$$invalidate(1, sampProp = 1 - sum(subset(groups, sample).map(v => v - 1)) / sampleSize);
    		}

    		if ($$self.$$.dirty & /*groups*/ 256) {
    			// if population has changed - reset statistics
    			{
    				$$invalidate(11, popProp = 1 - sum(groups.map(v => v - 1)) / groups.length);
    				$$invalidate(10, sampStat = []);
    			}
    		}

    		if ($$self.$$.dirty & /*popProp, sampleSize*/ 6144) {
    			// standard error for CI
    			$$invalidate(14, sd = Math.sqrt((1 - popProp) * popProp / sampleSize));
    		}

    		if ($$self.$$.dirty & /*popProp, sd*/ 18432) {
    			// PDF curve
    			$$invalidate(2, x = seq(popProp - 3.5 * sd, popProp + 3.5 * sd, 100));
    		}

    		if ($$self.$$.dirty & /*x, popProp, sd*/ 18436) {
    			$$invalidate(4, f = dnorm(x, popProp, sd));
    		}

    		if ($$self.$$.dirty & /*popProp, sd*/ 18432) {
    			// CI and CI area
    			$$invalidate(15, ci = [max([0, popProp - 1.96 * sd]), min([1, popProp + 1.96 * sd])]);
    		}

    		if ($$self.$$.dirty & /*ci*/ 32768) {
    			$$invalidate(3, cix = seq(ci[0], ci[1], 100));
    		}

    		if ($$self.$$.dirty & /*cix, popProp, sd*/ 18440) {
    			$$invalidate(5, cif = dnorm(cix, popProp, sd));
    		}

    		if ($$self.$$.dirty & /*sampStat, sampProp, ci*/ 33794) {
    			// if new sample is taken, add true if it is inside CI and false otherwise
    			$$invalidate(10, sampStat = [...sampStat, sampProp >= ci[0] && sampProp <= ci[1] ? 1 : 0]);
    		}

    		if ($$self.$$.dirty & /*sampStat*/ 1024) {
    			// numeric values for stat table
    			$$invalidate(16, nSamples = sampStat.length);
    		}

    		if ($$self.$$.dirty & /*sampStat*/ 1024) {
    			$$invalidate(17, nSamplesInside = sum(sampStat));
    		}

    		if ($$self.$$.dirty & /*ci*/ 32768) {
    			// text values for stat table
    			$$invalidate(6, tableCI = `[${ci[0].toFixed(2)}, ${ci[1].toFixed(2)}]`);
    		}

    		if ($$self.$$.dirty & /*nSamplesInside, nSamples*/ 196608) {
    			$$invalidate(7, tableNSamplesInside = `# samples inside CI: ${nSamplesInside}/${nSamples} (${(nSamplesInside / nSamples * 100).toFixed(1)}%)`);
    		}
    	};

    	return [
    		colors,
    		sampProp,
    		x,
    		cix,
    		f,
    		cif,
    		tableCI,
    		tableNSamplesInside,
    		groups,
    		sample,
    		sampStat,
    		popProp,
    		sampleSize,
    		sampleSizeOld,
    		sd,
    		ci,
    		nSamples,
    		nSamplesInside
    	];
    }

    class CIPlot extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { groups: 8, sample: 9, colors: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "CIPlot",
    			options,
    			id: create_fragment$1.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*groups*/ ctx[8] === undefined && !("groups" in props)) {
    			console.warn("<CIPlot> was created without expected prop 'groups'");
    		}

    		if (/*sample*/ ctx[9] === undefined && !("sample" in props)) {
    			console.warn("<CIPlot> was created without expected prop 'sample'");
    		}

    		if (/*colors*/ ctx[0] === undefined && !("colors" in props)) {
    			console.warn("<CIPlot> was created without expected prop 'colors'");
    		}
    	}

    	get groups() {
    		throw new Error("<CIPlot>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set groups(value) {
    		throw new Error("<CIPlot>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get sample() {
    		throw new Error("<CIPlot>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set sample(value) {
    		throw new Error("<CIPlot>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get colors() {
    		throw new Error("<CIPlot>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set colors(value) {
    		throw new Error("<CIPlot>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/App.svelte generated by Svelte v3.38.2 */
    const file = "src/App.svelte";

    // (58:9) <AppControlArea>
    function create_default_slot_1(ctx) {
    	let appcontrolrange;
    	let updating_value;
    	let t0;
    	let appcontrolswitch;
    	let updating_value_1;
    	let t1;
    	let appcontrolbutton;
    	let current;

    	function appcontrolrange_value_binding(value) {
    		/*appcontrolrange_value_binding*/ ctx[6](value);
    	}

    	let appcontrolrange_props = {
    		id: "popProp",
    		label: "Proportion",
    		min: 0.1,
    		max: 0.9,
    		step: 0.05,
    		decNum: 2
    	};

    	if (/*popProp*/ ctx[0] !== void 0) {
    		appcontrolrange_props.value = /*popProp*/ ctx[0];
    	}

    	appcontrolrange = new AppControlRange({
    			props: appcontrolrange_props,
    			$$inline: true
    		});

    	binding_callbacks.push(() => bind(appcontrolrange, "value", appcontrolrange_value_binding));

    	function appcontrolswitch_value_binding(value) {
    		/*appcontrolswitch_value_binding*/ ctx[7](value);
    	}

    	let appcontrolswitch_props = {
    		id: "sampleSize",
    		label: "Sample size",
    		options: [10, 20, 40]
    	};

    	if (/*sampSize*/ ctx[1] !== void 0) {
    		appcontrolswitch_props.value = /*sampSize*/ ctx[1];
    	}

    	appcontrolswitch = new AppControlSwitch({
    			props: appcontrolswitch_props,
    			$$inline: true
    		});

    	binding_callbacks.push(() => bind(appcontrolswitch, "value", appcontrolswitch_value_binding));

    	appcontrolbutton = new AppControlButton({
    			props: {
    				id: "newSample",
    				label: "Sample",
    				text: "Take new"
    			},
    			$$inline: true
    		});

    	appcontrolbutton.$on("click", /*takeNewSample*/ ctx[5]);

    	const block = {
    		c: function create() {
    			create_component(appcontrolrange.$$.fragment);
    			t0 = space();
    			create_component(appcontrolswitch.$$.fragment);
    			t1 = space();
    			create_component(appcontrolbutton.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(appcontrolrange, target, anchor);
    			insert_dev(target, t0, anchor);
    			mount_component(appcontrolswitch, target, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(appcontrolbutton, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const appcontrolrange_changes = {};

    			if (!updating_value && dirty & /*popProp*/ 1) {
    				updating_value = true;
    				appcontrolrange_changes.value = /*popProp*/ ctx[0];
    				add_flush_callback(() => updating_value = false);
    			}

    			appcontrolrange.$set(appcontrolrange_changes);
    			const appcontrolswitch_changes = {};

    			if (!updating_value_1 && dirty & /*sampSize*/ 2) {
    				updating_value_1 = true;
    				appcontrolswitch_changes.value = /*sampSize*/ ctx[1];
    				add_flush_callback(() => updating_value_1 = false);
    			}

    			appcontrolswitch.$set(appcontrolswitch_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(appcontrolrange.$$.fragment, local);
    			transition_in(appcontrolswitch.$$.fragment, local);
    			transition_in(appcontrolbutton.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(appcontrolrange.$$.fragment, local);
    			transition_out(appcontrolswitch.$$.fragment, local);
    			transition_out(appcontrolbutton.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(appcontrolrange, detaching);
    			if (detaching) detach_dev(t0);
    			destroy_component(appcontrolswitch, detaching);
    			if (detaching) detach_dev(t1);
    			destroy_component(appcontrolbutton, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1.name,
    		type: "slot",
    		source: "(58:9) <AppControlArea>",
    		ctx
    	});

    	return block;
    }

    // (38:0) <StatApp>
    function create_default_slot(ctx) {
    	let div4;
    	let div0;
    	let populationplot;
    	let t0;
    	let div1;
    	let sampleplot;
    	let t1;
    	let div2;
    	let ciplot;
    	let t2;
    	let div3;
    	let appcontrolarea;
    	let current;

    	populationplot = new PopulationPlot({
    			props: {
    				groups: /*groups*/ ctx[3],
    				sample: /*sample*/ ctx[2],
    				colors: /*colors*/ ctx[4]
    			},
    			$$inline: true
    		});

    	sampleplot = new SamplePlot({
    			props: {
    				groups: /*groups*/ ctx[3],
    				sample: /*sample*/ ctx[2],
    				colors: /*colors*/ ctx[4]
    			},
    			$$inline: true
    		});

    	ciplot = new CIPlot({
    			props: {
    				groups: /*groups*/ ctx[3],
    				sample: /*sample*/ ctx[2],
    				colors: /*colors*/ ctx[4]
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
    			create_component(populationplot.$$.fragment);
    			t0 = space();
    			div1 = element("div");
    			create_component(sampleplot.$$.fragment);
    			t1 = space();
    			div2 = element("div");
    			create_component(ciplot.$$.fragment);
    			t2 = space();
    			div3 = element("div");
    			create_component(appcontrolarea.$$.fragment);
    			attr_dev(div0, "class", "app-population-plot-area svelte-13queh6");
    			add_location(div0, file, 41, 6, 1439);
    			attr_dev(div1, "class", "app-sample-plot-area svelte-13queh6");
    			add_location(div1, file, 46, 6, 1596);
    			attr_dev(div2, "class", "app-ci-plot-area svelte-13queh6");
    			add_location(div2, file, 51, 6, 1758);
    			attr_dev(div3, "class", "app-controls-area svelte-13queh6");
    			add_location(div3, file, 56, 6, 1888);
    			attr_dev(div4, "class", "app-layout svelte-13queh6");
    			add_location(div4, file, 38, 3, 1359);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div4, anchor);
    			append_dev(div4, div0);
    			mount_component(populationplot, div0, null);
    			append_dev(div4, t0);
    			append_dev(div4, div1);
    			mount_component(sampleplot, div1, null);
    			append_dev(div4, t1);
    			append_dev(div4, div2);
    			mount_component(ciplot, div2, null);
    			append_dev(div4, t2);
    			append_dev(div4, div3);
    			mount_component(appcontrolarea, div3, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const populationplot_changes = {};
    			if (dirty & /*groups*/ 8) populationplot_changes.groups = /*groups*/ ctx[3];
    			if (dirty & /*sample*/ 4) populationplot_changes.sample = /*sample*/ ctx[2];
    			populationplot.$set(populationplot_changes);
    			const sampleplot_changes = {};
    			if (dirty & /*groups*/ 8) sampleplot_changes.groups = /*groups*/ ctx[3];
    			if (dirty & /*sample*/ 4) sampleplot_changes.sample = /*sample*/ ctx[2];
    			sampleplot.$set(sampleplot_changes);
    			const ciplot_changes = {};
    			if (dirty & /*groups*/ 8) ciplot_changes.groups = /*groups*/ ctx[3];
    			if (dirty & /*sample*/ 4) ciplot_changes.sample = /*sample*/ ctx[2];
    			ciplot.$set(ciplot_changes);
    			const appcontrolarea_changes = {};

    			if (dirty & /*$$scope, sampSize, popProp*/ 515) {
    				appcontrolarea_changes.$$scope = { dirty, ctx };
    			}

    			appcontrolarea.$set(appcontrolarea_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(populationplot.$$.fragment, local);
    			transition_in(sampleplot.$$.fragment, local);
    			transition_in(ciplot.$$.fragment, local);
    			transition_in(appcontrolarea.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(populationplot.$$.fragment, local);
    			transition_out(sampleplot.$$.fragment, local);
    			transition_out(ciplot.$$.fragment, local);
    			transition_out(appcontrolarea.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div4);
    			destroy_component(populationplot);
    			destroy_component(sampleplot);
    			destroy_component(ciplot);
    			destroy_component(appcontrolarea);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(38:0) <StatApp>",
    		ctx
    	});

    	return block;
    }

    // (67:3) 
    function create_help_slot(ctx) {
    	let div;
    	let h2;
    	let t1;
    	let p0;
    	let t3;
    	let p1;
    	let t4;
    	let em0;
    	let t6;
    	let em1;
    	let t8;
    	let t9;
    	let p2;
    	let t10;
    	let strong;
    	let t12;

    	const block = {
    		c: function create() {
    			div = element("div");
    			h2 = element("h2");
    			h2.textContent = "Population based confidence interval for proportion";
    			t1 = space();
    			p0 = element("p");
    			p0.textContent = "This app allows you to play with proportion of a random sample. Here we have a population with N = 1600\n         individuals. Some of them are red, some are blue. You can change the proportion of the red\n         individuals as you want (by default it is 50%). The population is shown as large plot on the left.";
    			t3 = space();
    			p1 = element("p");
    			t4 = text("If we know proportion of population and sample size we can compute an interval of expected proportions\n         of the future samples. So, when you take a new random sample of that size from the population, its proportion\n         will likely to be inside the interval. This interval is called ");
    			em0 = element("em");
    			em0.textContent = "confidence interval for proportion";
    			t6 = text("\n         and since we compute it based on proportion parameter, it is ");
    			em1 = element("em");
    			em1.textContent = "population based";
    			t8 = text(".");
    			t9 = space();
    			p2 = element("p");
    			t10 = text("The interval for selected population proportion and current sample size computed for 95% confidence level is\n         shown as a red area under a distribution curve on the right. The vertical line on that plot is a proportion of\n         your current sample. Try to take many samples and see how often the proportion of the sample will be inside\n         the interval (text on the plot shows this information). If you repeat this many (hundreds) times, about\n         95% of the samples should have proportion within the interval. ");
    			strong = element("strong");
    			strong.textContent = "However this works only if number of\n         individuals in each group is at least 5.";
    			t12 = text(" So if proportion is 10% you need to have sample size n = 50 to meat\n         this requirement.");
    			add_location(h2, file, 67, 6, 2371);
    			add_location(p0, file, 68, 6, 2438);
    			add_location(em0, file, 76, 72, 3087);
    			add_location(em1, file, 77, 70, 3201);
    			add_location(p1, file, 73, 6, 2780);
    			add_location(strong, file, 84, 72, 3789);
    			add_location(p2, file, 79, 6, 3245);
    			attr_dev(div, "slot", "help");
    			add_location(div, file, 66, 3, 2347);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, h2);
    			append_dev(div, t1);
    			append_dev(div, p0);
    			append_dev(div, t3);
    			append_dev(div, p1);
    			append_dev(p1, t4);
    			append_dev(p1, em0);
    			append_dev(p1, t6);
    			append_dev(p1, em1);
    			append_dev(p1, t8);
    			append_dev(div, t9);
    			append_dev(div, p2);
    			append_dev(p2, t10);
    			append_dev(p2, strong);
    			append_dev(p2, t12);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_help_slot.name,
    		type: "slot",
    		source: "(67:3) ",
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

    			if (dirty & /*$$scope, sampSize, popProp, groups, sample*/ 527) {
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

    const popSize = 1600;

    function instance($$self, $$props, $$invalidate) {
    	let groups;
    	let sample;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);
    	const popIndex = seq(1, popSize, popSize);
    	const colors = ["#ff0000", "#0000ff"];

    	// variable parameters
    	let popProp = 0.5;

    	let sampSize = 10;

    	function takeNewSample() {
    		$$invalidate(2, sample = subset(shuffle(popIndex), seq(1, sampSize, sampSize)));
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	function appcontrolrange_value_binding(value) {
    		popProp = value;
    		$$invalidate(0, popProp);
    	}

    	function appcontrolswitch_value_binding(value) {
    		sampSize = value;
    		$$invalidate(1, sampSize);
    	}

    	$$self.$capture_state = () => ({
    		seq,
    		subset,
    		rep,
    		shuffle,
    		StatApp,
    		AppControlArea,
    		AppControlButton,
    		AppControlSwitch,
    		AppControlRange,
    		PopulationPlot,
    		SamplePlot,
    		CIPlot,
    		popSize,
    		popIndex,
    		colors,
    		popProp,
    		sampSize,
    		takeNewSample,
    		sample,
    		groups
    	});

    	$$self.$inject_state = $$props => {
    		if ("popProp" in $$props) $$invalidate(0, popProp = $$props.popProp);
    		if ("sampSize" in $$props) $$invalidate(1, sampSize = $$props.sampSize);
    		if ("sample" in $$props) $$invalidate(2, sample = $$props.sample);
    		if ("groups" in $$props) $$invalidate(3, groups = $$props.groups);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*popProp*/ 1) {
    			// generate groups of population randomly
    			$$invalidate(3, groups = shuffle(rep(1, Math.round(popProp * popSize)).concat(rep(2, Math.round((1 - popProp) * popSize)))));
    		}

    		if ($$self.$$.dirty & /*popProp, sampSize*/ 3) {
    			// take a sample if population proportion has changed
    			$$invalidate(2, sample = popProp
    			? subset(shuffle(popIndex), seq(1, sampSize, sampSize))
    			: NULL);
    		}
    	};

    	return [
    		popProp,
    		sampSize,
    		sample,
    		groups,
    		colors,
    		takeNewSample,
    		appcontrolrange_value_binding,
    		appcontrolswitch_value_binding
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
    	target: document.getElementById("mdatools-app-container"),
    });

    return app;

}());
//# sourceMappingURL=asta-b201.js.map
