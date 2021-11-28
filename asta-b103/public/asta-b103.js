
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
     * Probability density function for uniform distribution
     * @param {Array} x - vector of values
     * @param {number} a - smallest value (min) of the population
     * @param {number} b - largest value (max) of the population
     * @returns {Array} vector with densities
     */
    function dunif(x, a = 0, b = 1) {

       if (!Array.isArray(x)) x = [x];

       const n = x.length;
       const A = 1 / (b - a);
       let d = Array(n);

       for (let i = 0; i < n; i++) {
          d[i] = (x[i] < a || x[i] > b ) ? 0 : A;
       }

       return d;
    }


    /**
     * Cumulative distribution function for uniform distribution
     * @param {Array} x - vector of values
     * @param {number} a - smallest value (min) of the population
     * @param {number} b - largest value (max) of the population
     * @returns {Array} vector with probabilities
     */
    function punif(x, a = 0, b = 1) {

       if (!Array.isArray(x)) x = [x];

       const n = x.length;
       let p = Array(n);
       for (let i = 0; i < n; i++) {
          if (x[i] < a) {
             p[i] = 0;
          } else if (x[i] > b) {
             p[i] = 1;
          } else {
             p[i] = (x[i] - a) / (b - a);
          }
       }

       return p;
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
     * Cumulative distribution function for normal distribution
     * @param {Array} x - vector of values
     * @param {number} mu - average value of the population
     * @param {number} sigma - standard deviation of the population
     * @returns {Array} vector with probabilities
     */
    function pnorm(x, mu = 0, sigma = 1) {

       if (!Array.isArray(x)) x = [x];

       const n = x.length;
       const frac = 1 / (Math.sqrt(2) * sigma);

       let p = Array(n);
       for (let i = 0; i < n; i++) {
          p[i] = 0.5 * (1 + erf((x[i] - mu) * frac));
       }

       return p.length === 1 ? p[0] : p;
    }


    /**
     * Finds index of value in x which is closest to the value a
     * @param {number[]} x - a vector with values
     * @param {number}  a - a value
     */
    function closestIndex(x, a) {
       const c = x.reduce((prev, curr) => Math.abs(curr - a) < Math.abs(prev - a) ? curr : prev);
       return x.indexOf(c);
    }


    /**
     * Error function for normal distribution
     * @param {number} x - a number
     * @returns {number} value for erf
     */
    function erf(x) {

      const sign = (x >= 0) ? 1 : -1;
      x = Math.abs(x);

      // constants
      const a1 =  0.254829592;
      const a2 = -0.284496736;
      const a3 =  1.421413741;
      const a4 = -1.453152027;
      const a5 =  1.061405429;
      const p  =  0.3275911;

      // approximation
      const t = 1.0 / (1.0 + p * x);
      const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
      return sign * y;
    }

    /* ../shared/StatApp.svelte generated by Svelte v3.38.2 */
    const file$f = "../shared/StatApp.svelte";
    const get_help_slot_changes = dirty => ({});
    const get_help_slot_context = ctx => ({});

    // (45:3) {:else}
    function create_else_block$1(ctx) {
    	let div;
    	let current;
    	const help_slot_template = /*#slots*/ ctx[5].help;
    	const help_slot = create_slot(help_slot_template, ctx, /*$$scope*/ ctx[4], get_help_slot_context);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (help_slot) help_slot.c();
    			attr_dev(div, "class", "helptext svelte-d5wxow");
    			add_location(div, file$f, 45, 3, 1017);
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
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(45:3) {:else}",
    		ctx
    	});

    	return block;
    }

    // (40:3) {#if !showHelp}
    function create_if_block$d(ctx) {
    	let div;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[5].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[4], null);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (default_slot) default_slot.c();
    			attr_dev(div, "class", "content svelte-d5wxow");
    			add_location(div, file$f, 40, 3, 953);
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
    		id: create_if_block$d.name,
    		type: "if",
    		source: "(40:3) {#if !showHelp}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$i(ctx) {
    	let main;
    	let current_block_type_index;
    	let if_block;
    	let main_class_value;
    	let current;
    	let mounted;
    	let dispose;
    	const if_block_creators = [create_if_block$d, create_else_block$1];
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
    			add_location(main, file$f, 37, 0, 856);
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
    		id: create_fragment$i.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$i($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$i, create_fragment$i, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "StatApp",
    			options,
    			id: create_fragment$i.name
    		});
    	}
    }

    /* ../shared/controls/AppControlArea.svelte generated by Svelte v3.38.2 */

    const file$e = "../shared/controls/AppControlArea.svelte";

    // (7:3) {#if errormsg}
    function create_if_block$c(ctx) {
    	let div;
    	let t;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t = text(/*errormsg*/ ctx[0]);
    			attr_dev(div, "class", "app-control-error svelte-8w06qs");
    			add_location(div, file$e, 6, 17, 126);
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
    		id: create_if_block$c.name,
    		type: "if",
    		source: "(7:3) {#if errormsg}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$h(ctx) {
    	let fieldset;
    	let t;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[2].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[1], null);
    	let if_block = /*errormsg*/ ctx[0] && create_if_block$c(ctx);

    	const block = {
    		c: function create() {
    			fieldset = element("fieldset");
    			if (default_slot) default_slot.c();
    			t = space();
    			if (if_block) if_block.c();
    			attr_dev(fieldset, "class", "app-control-area svelte-8w06qs");
    			add_location(fieldset, file$e, 4, 0, 56);
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
    					if_block = create_if_block$c(ctx);
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
    		id: create_fragment$h.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$h($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$h, create_fragment$h, safe_not_equal, { errormsg: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "AppControlArea",
    			options,
    			id: create_fragment$h.name
    		});
    	}

    	get errormsg() {
    		throw new Error("<AppControlArea>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set errormsg(value) {
    		throw new Error("<AppControlArea>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
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

    /* ../shared/controls/AppControl.svelte generated by Svelte v3.38.2 */

    const file$d = "../shared/controls/AppControl.svelte";

    function create_fragment$g(ctx) {
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
    			add_location(label_1, file$d, 6, 3, 88);
    			attr_dev(div, "class", "app-control svelte-u0fryu");
    			add_location(div, file$d, 5, 0, 59);
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
    		id: create_fragment$g.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$g($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$g, create_fragment$g, safe_not_equal, { id: 0, label: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "AppControl",
    			options,
    			id: create_fragment$g.name
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

    /* ../shared/controls/AppControlSwitch.svelte generated by Svelte v3.38.2 */
    const file$c = "../shared/controls/AppControlSwitch.svelte";

    function get_each_context$5(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[6] = list[i];
    	return child_ctx;
    }

    // (14:6) {#each options as option (option)}
    function create_each_block$5(key_1, ctx) {
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
    			add_location(div, file$c, 14, 6, 321);
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
    		id: create_each_block$5.name,
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
    	validate_each_keys(ctx, each_value, get_each_context$5, get_key);

    	for (let i = 0; i < each_value.length; i += 1) {
    		let child_ctx = get_each_context$5(ctx, each_value, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block$5(key, child_ctx));
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
    			add_location(div, file$c, 12, 3, 251);
    			attr_dev(input, "name", /*id*/ ctx[1]);
    			attr_dev(input, "class", "svelte-yqpg3s");
    			add_location(input, file$c, 18, 3, 447);
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
    				validate_each_keys(ctx, each_value, get_each_context$5, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each_1_lookup, div, destroy_block, create_each_block$5, null, get_each_context$5);
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

    function create_fragment$f(ctx) {
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
    		id: create_fragment$f.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$f($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$f, create_fragment$f, safe_not_equal, { id: 1, label: 2, options: 3, value: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "AppControlSwitch",
    			options,
    			id: create_fragment$f.name
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
    const file$b = "../shared/controls/AppControlRange.svelte";

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
    			add_location(div0, file$b, 75, 6, 2016);
    			attr_dev(span, "class", "svelte-1n1k125");
    			add_location(span, file$b, 76, 6, 2103);
    			attr_dev(div1, "class", "rangeSliderContainer svelte-1n1k125");
    			add_location(div1, file$b, 67, 3, 1806);
    			attr_dev(input, "type", "range");
    			attr_dev(input, "step", /*step*/ ctx[6]);
    			attr_dev(input, "min", /*min*/ ctx[3]);
    			attr_dev(input, "max", /*max*/ ctx[4]);
    			attr_dev(input, "class", "svelte-1n1k125");
    			add_location(input, file$b, 78, 3, 2153);
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

    function create_fragment$e(ctx) {
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
    		id: create_fragment$e.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$e($$self, $$props, $$invalidate) {
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

    		init(this, options, instance$e, create_fragment$e, safe_not_equal, {
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
    			id: create_fragment$e.name
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
    const file$a = "../../svelte-plots-basic/src/Axes.svelte";
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
    			add_location(div, file$a, 310, 21, 11963);
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
    			add_location(span, file$a, 311, 48, 12061);
    			attr_dev(div, "class", "axes__ylabel");
    			add_location(div, file$a, 311, 22, 12035);
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
    function create_if_block_1$1(ctx) {
    	let div;
    	let span;

    	const block = {
    		c: function create() {
    			div = element("div");
    			span = element("span");
    			add_location(span, file$a, 312, 48, 12148);
    			attr_dev(div, "class", "axes__xlabel");
    			add_location(div, file$a, 312, 22, 12122);
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
    		source: "(313:3) {#if xLabel !== \\\"\\\"}",
    		ctx
    	});

    	return block;
    }

    // (341:3) {#if !$isOk}
    function create_if_block$b(ctx) {
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
    			add_location(br, file$a, 342, 51, 12994);
    			attr_dev(p, "class", "message_error");
    			add_location(p, file$a, 341, 3, 12917);
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
    		id: create_if_block$b.name,
    		type: "if",
    		source: "(341:3) {#if !$isOk}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$d(ctx) {
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
    	let if_block2 = /*xLabel*/ ctx[1] !== "" && create_if_block_1$1(ctx);
    	const xaxis_slot_template = /*#slots*/ ctx[24].xaxis;
    	const xaxis_slot = create_slot(xaxis_slot_template, ctx, /*$$scope*/ ctx[23], get_xaxis_slot_context);
    	const yaxis_slot_template = /*#slots*/ ctx[24].yaxis;
    	const yaxis_slot = create_slot(yaxis_slot_template, ctx, /*$$scope*/ ctx[23], get_yaxis_slot_context);
    	const default_slot_template = /*#slots*/ ctx[24].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[23], null);
    	const box_slot_template = /*#slots*/ ctx[24].box;
    	const box_slot = create_slot(box_slot_template, ctx, /*$$scope*/ ctx[23], get_box_slot_context);
    	let if_block3 = !/*$isOk*/ ctx[3] && create_if_block$b(ctx);

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
    			add_location(rect, file$a, 321, 15, 12446);
    			attr_dev(clipPath, "id", /*clipPathID*/ ctx[8]);
    			add_location(clipPath, file$a, 320, 12, 12402);
    			add_location(defs, file$a, 319, 9, 12383);
    			attr_dev(g, "clip-path", "url(#" + /*clipPathID*/ ctx[8] + ")");
    			add_location(g, file$a, 330, 9, 12732);
    			attr_dev(svg, "preserveAspectRatio", "none");
    			attr_dev(svg, "class", "axes");
    			add_location(svg, file$a, 316, 6, 12288);
    			attr_dev(div0, "class", "axes-wrapper");
    			add_location(div0, file$a, 315, 3, 12228);
    			attr_dev(div1, "class", div1_class_value = "plot " + ("plot_" + /*$scale*/ ctx[4]));
    			toggle_class(div1, "plot_error", !/*$isOk*/ ctx[3]);
    			add_location(div1, file$a, 307, 0, 11835);
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
    					if_block2 = create_if_block_1$1(ctx);
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
    					if_block3 = create_if_block$b(ctx);
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
    		id: create_fragment$d.name,
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

    function instance$d($$self, $$props, $$invalidate) {
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
    			instance$d,
    			create_fragment$d,
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
    			id: create_fragment$d.name
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
    const file$9 = "../../svelte-plots-basic/src/XAxis.svelte";

    function get_each_context$4(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[26] = list[i];
    	child_ctx[28] = i;
    	return child_ctx;
    }

    // (57:0) {#if $isOk && x !== undefined && y !== undefined }
    function create_if_block$a(ctx) {
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
    		each_blocks[i] = create_each_block$4(get_each_context$4(ctx, each_value, i));
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
    			add_location(line, file$9, 63, 3, 2597);
    			attr_dev(g, "class", "mdaplot__axis mdaplot__xaxis");
    			add_location(g, file$9, 57, 3, 2169);
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
    					const child_ctx = get_each_context$4(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$4(child_ctx);
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
    		id: create_if_block$a.name,
    		type: "if",
    		source: "(57:0) {#if $isOk && x !== undefined && y !== undefined }",
    		ctx
    	});

    	return block;
    }

    // (59:3) {#each ticksX as tx, i}
    function create_each_block$4(ctx) {
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
    			add_location(line0, file$9, 59, 6, 2243);
    			attr_dev(line1, "x1", line1_x__value = /*tx*/ ctx[26]);
    			attr_dev(line1, "x2", line1_x__value_1 = /*tx*/ ctx[26]);
    			attr_dev(line1, "y1", line1_y__value = /*ticksY*/ ctx[5][0]);
    			attr_dev(line1, "y2", line1_y__value_1 = /*ticksY*/ ctx[5][1]);
    			attr_dev(line1, "style", /*axisLineStyleStr*/ ctx[7]);
    			add_location(line1, file$9, 60, 6, 2334);
    			attr_dev(text_1, "x", text_1_x_value = /*tx*/ ctx[26]);
    			attr_dev(text_1, "y", text_1_y_value = /*ticksY*/ ctx[5][1]);
    			attr_dev(text_1, "dx", "0");
    			attr_dev(text_1, "dy", /*dy*/ ctx[2]);
    			attr_dev(text_1, "class", "mdaplot__axis-labels");
    			attr_dev(text_1, "dominant-baseline", "middle");
    			attr_dev(text_1, "text-anchor", "middle");
    			add_location(text_1, file$9, 61, 6, 2435);
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
    		id: create_each_block$4.name,
    		type: "each",
    		source: "(59:3) {#each ticksX as tx, i}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$c(ctx) {
    	let if_block_anchor;
    	let if_block = /*$isOk*/ ctx[6] && /*x*/ ctx[3] !== undefined && /*y*/ ctx[1] !== undefined && create_if_block$a(ctx);

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
    					if_block = create_if_block$a(ctx);
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
    		id: create_fragment$c.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$c($$self, $$props, $$invalidate) {
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

    		init(this, options, instance$c, create_fragment$c, safe_not_equal, {
    			slot: 16,
    			ticks: 15,
    			tickLabels: 0,
    			showGrid: 17
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "XAxis",
    			options,
    			id: create_fragment$c.name
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

    /* ../../svelte-plots-basic/src/YAxis.svelte generated by Svelte v3.38.2 */
    const file$8 = "../../svelte-plots-basic/src/YAxis.svelte";

    function get_each_context$3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[26] = list[i];
    	child_ctx[28] = i;
    	return child_ctx;
    }

    // (60:0) {#if x !== undefined && y !== undefined }
    function create_if_block$9(ctx) {
    	let g;
    	let line;
    	let line_x__value;
    	let line_x__value_1;
    	let line_y__value;
    	let line_y__value_1;
    	let each_value = /*ticksY*/ ctx[4];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$3(get_each_context$3(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			g = svg_element("g");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			line = svg_element("line");
    			attr_dev(line, "x1", line_x__value = /*x*/ ctx[1][0]);
    			attr_dev(line, "x2", line_x__value_1 = /*x*/ ctx[1][0]);
    			attr_dev(line, "y1", line_y__value = /*y*/ ctx[3][0]);
    			attr_dev(line, "y2", line_y__value_1 = /*y*/ ctx[3][1]);
    			attr_dev(line, "style", /*axisLineStyleStr*/ ctx[7]);
    			add_location(line, file$8, 66, 3, 2703);
    			attr_dev(g, "class", "mdaplot__axis mdaplot__yaxis");
    			add_location(g, file$8, 60, 3, 2240);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, g, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(g, null);
    			}

    			append_dev(g, line);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*ticksX, ticksY, dx, transform, tickLabels, axisLineStyleStr, x, gridLineStyleStr*/ 503) {
    				each_value = /*ticksY*/ ctx[4];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$3(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$3(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(g, line);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (dirty & /*x*/ 2 && line_x__value !== (line_x__value = /*x*/ ctx[1][0])) {
    				attr_dev(line, "x1", line_x__value);
    			}

    			if (dirty & /*x*/ 2 && line_x__value_1 !== (line_x__value_1 = /*x*/ ctx[1][0])) {
    				attr_dev(line, "x2", line_x__value_1);
    			}

    			if (dirty & /*y*/ 8 && line_y__value !== (line_y__value = /*y*/ ctx[3][0])) {
    				attr_dev(line, "y1", line_y__value);
    			}

    			if (dirty & /*y*/ 8 && line_y__value_1 !== (line_y__value_1 = /*y*/ ctx[3][1])) {
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
    		id: create_if_block$9.name,
    		type: "if",
    		source: "(60:0) {#if x !== undefined && y !== undefined }",
    		ctx
    	});

    	return block;
    }

    // (62:3) {#each ticksY as ty, i}
    function create_each_block$3(ctx) {
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
    			attr_dev(line0, "x1", line0_x__value = /*x*/ ctx[1][0]);
    			attr_dev(line0, "x2", line0_x__value_1 = /*x*/ ctx[1][1]);
    			attr_dev(line0, "y1", line0_y__value = /*ty*/ ctx[26]);
    			attr_dev(line0, "y2", line0_y__value_1 = /*ty*/ ctx[26]);
    			attr_dev(line0, "style", /*gridLineStyleStr*/ ctx[8]);
    			add_location(line0, file$8, 62, 6, 2314);
    			attr_dev(line1, "x1", line1_x__value = /*ticksX*/ ctx[5][0]);
    			attr_dev(line1, "x2", line1_x__value_1 = /*ticksX*/ ctx[5][1]);
    			attr_dev(line1, "y1", line1_y__value = /*ty*/ ctx[26]);
    			attr_dev(line1, "y2", line1_y__value_1 = /*ty*/ ctx[26]);
    			attr_dev(line1, "style", /*axisLineStyleStr*/ ctx[7]);
    			add_location(line1, file$8, 63, 6, 2405);
    			attr_dev(text_1, "x", text_1_x_value = /*ticksX*/ ctx[5][0]);
    			attr_dev(text_1, "y", text_1_y_value = /*ty*/ ctx[26]);
    			attr_dev(text_1, "dx", /*dx*/ ctx[2]);
    			attr_dev(text_1, "dy", 0);
    			attr_dev(text_1, "transform", /*transform*/ ctx[6]);
    			set_style(text_1, "background", "red");
    			attr_dev(text_1, "class", "mdaplot__axis-labels");
    			attr_dev(text_1, "dominant-baseline", "middle");
    			attr_dev(text_1, "text-anchor", "end");
    			add_location(text_1, file$8, 64, 6, 2507);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, line0, anchor);
    			insert_dev(target, line1, anchor);
    			insert_dev(target, text_1, anchor);
    			append_dev(text_1, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*x*/ 2 && line0_x__value !== (line0_x__value = /*x*/ ctx[1][0])) {
    				attr_dev(line0, "x1", line0_x__value);
    			}

    			if (dirty & /*x*/ 2 && line0_x__value_1 !== (line0_x__value_1 = /*x*/ ctx[1][1])) {
    				attr_dev(line0, "x2", line0_x__value_1);
    			}

    			if (dirty & /*ticksY*/ 16 && line0_y__value !== (line0_y__value = /*ty*/ ctx[26])) {
    				attr_dev(line0, "y1", line0_y__value);
    			}

    			if (dirty & /*ticksY*/ 16 && line0_y__value_1 !== (line0_y__value_1 = /*ty*/ ctx[26])) {
    				attr_dev(line0, "y2", line0_y__value_1);
    			}

    			if (dirty & /*ticksX*/ 32 && line1_x__value !== (line1_x__value = /*ticksX*/ ctx[5][0])) {
    				attr_dev(line1, "x1", line1_x__value);
    			}

    			if (dirty & /*ticksX*/ 32 && line1_x__value_1 !== (line1_x__value_1 = /*ticksX*/ ctx[5][1])) {
    				attr_dev(line1, "x2", line1_x__value_1);
    			}

    			if (dirty & /*ticksY*/ 16 && line1_y__value !== (line1_y__value = /*ty*/ ctx[26])) {
    				attr_dev(line1, "y1", line1_y__value);
    			}

    			if (dirty & /*ticksY*/ 16 && line1_y__value_1 !== (line1_y__value_1 = /*ty*/ ctx[26])) {
    				attr_dev(line1, "y2", line1_y__value_1);
    			}

    			if (dirty & /*tickLabels*/ 1 && t_value !== (t_value = /*tickLabels*/ ctx[0][/*i*/ ctx[28]] + "")) set_data_dev(t, t_value);

    			if (dirty & /*ticksX*/ 32 && text_1_x_value !== (text_1_x_value = /*ticksX*/ ctx[5][0])) {
    				attr_dev(text_1, "x", text_1_x_value);
    			}

    			if (dirty & /*ticksY*/ 16 && text_1_y_value !== (text_1_y_value = /*ty*/ ctx[26])) {
    				attr_dev(text_1, "y", text_1_y_value);
    			}

    			if (dirty & /*dx*/ 4) {
    				attr_dev(text_1, "dx", /*dx*/ ctx[2]);
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
    		id: create_each_block$3.name,
    		type: "each",
    		source: "(62:3) {#each ticksY as ty, i}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$b(ctx) {
    	let if_block_anchor;
    	let if_block = /*x*/ ctx[1] !== undefined && /*y*/ ctx[3] !== undefined && create_if_block$9(ctx);

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
    			if (/*x*/ ctx[1] !== undefined && /*y*/ ctx[3] !== undefined) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$9(ctx);
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
    		id: create_fragment$b.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$b($$self, $$props, $$invalidate) {
    	let x;
    	let y;
    	let dx;
    	let tickNum;
    	let ticksY;
    	let ticksX;
    	let $xLim;
    	let $axesWidth;
    	let $yLim;
    	let $axesHeight;
    	let $scale;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("YAxis", slots, []);
    	let { slot = "yaxis" } = $$props; // slot the component must be placed in
    	let { ticks = undefined } = $$props; // vector with numeric tick positions in plot units
    	let { tickLabels = ticks } = $$props; // vector with labels for each tick
    	let { showGrid = false } = $$props; // logical, show or not grid lines
    	let { las = 1 } = $$props;

    	// set up tick mode
    	const tickMode = ticks === undefined ? "auto" : "manual";

    	// TODO: set up tick text translation
    	const transform = las > 1 ? "" : "";

    	/* sanity checks of input parameters */
    	if (slot !== "yaxis") {
    		throw "Component YAxis must have \"slot='yaxis'\" attribute.";
    	}

    	if (ticks !== undefined && !Array.isArray(ticks)) {
    		throw "YAxis: 'ticks' must be a vector of numbers.";
    	}

    	if (ticks !== undefined && !(Array.isArray(tickLabels) && tickLabels.length == ticks.length)) {
    		throw "YAxis: 'tickLabels' must be a vector of the same size as ticks.";
    	}

    	/* styles for axis and grid lines */
    	const axisLineStyleStr = `stroke:${Colors.DARKGRAY};line-width:1px;`;

    	const gridLineStyleStr = `stroke:${Colors.MIDDLEGRAY};stroke-opacity:${showGrid ? 1 : 0};stroke-dasharray:2px;`;

    	// get axes context and adjust x margins
    	const axes = getContext("axes");

    	axes.addYAxisMargins();

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
    	const writable_props = ["slot", "ticks", "tickLabels", "showGrid", "las"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<YAxis> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("slot" in $$props) $$invalidate(15, slot = $$props.slot);
    		if ("ticks" in $$props) $$invalidate(14, ticks = $$props.ticks);
    		if ("tickLabels" in $$props) $$invalidate(0, tickLabels = $$props.tickLabels);
    		if ("showGrid" in $$props) $$invalidate(16, showGrid = $$props.showGrid);
    		if ("las" in $$props) $$invalidate(17, las = $$props.las);
    	};

    	$$self.$capture_state = () => ({
    		getContext,
    		Colors,
    		slot,
    		ticks,
    		tickLabels,
    		showGrid,
    		las,
    		tickMode,
    		transform,
    		axisLineStyleStr,
    		gridLineStyleStr,
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
    		tickNum,
    		ticksY,
    		ticksX
    	});

    	$$self.$inject_state = $$props => {
    		if ("slot" in $$props) $$invalidate(15, slot = $$props.slot);
    		if ("ticks" in $$props) $$invalidate(14, ticks = $$props.ticks);
    		if ("tickLabels" in $$props) $$invalidate(0, tickLabels = $$props.tickLabels);
    		if ("showGrid" in $$props) $$invalidate(16, showGrid = $$props.showGrid);
    		if ("las" in $$props) $$invalidate(17, las = $$props.las);
    		if ("x" in $$props) $$invalidate(1, x = $$props.x);
    		if ("y" in $$props) $$invalidate(3, y = $$props.y);
    		if ("dx" in $$props) $$invalidate(2, dx = $$props.dx);
    		if ("tickNum" in $$props) $$invalidate(23, tickNum = $$props.tickNum);
    		if ("ticksY" in $$props) $$invalidate(4, ticksY = $$props.ticksY);
    		if ("ticksX" in $$props) $$invalidate(5, ticksX = $$props.ticksX);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$xLim, $axesWidth*/ 786432) {
    			// reactive variables for coordinates of axis lines
    			$$invalidate(1, x = axes.scaleX($xLim, $xLim, $axesWidth));
    		}

    		if ($$self.$$.dirty & /*$yLim, $axesHeight*/ 3145728) {
    			$$invalidate(3, y = axes.scaleY($yLim, $yLim, $axesHeight));
    		}

    		if ($$self.$$.dirty & /*$scale*/ 4194304) {
    			// reactive variables for ticks and their coordinates
    			$$invalidate(2, dx = $scale === "small" ? -4 : -6);
    		}

    		if ($$self.$$.dirty & /*$scale*/ 4194304) {
    			$$invalidate(23, tickNum = axes.TICK_NUM[$scale]);
    		}

    		if ($$self.$$.dirty & /*$yLim, tickNum, ticks*/ 9453568) {
    			$$invalidate(14, ticks = tickMode === "auto"
    			? axes.getAxisTicks(undefined, $yLim, tickNum, true)
    			: ticks);
    		}

    		if ($$self.$$.dirty & /*ticks, tickLabels*/ 16385) {
    			$$invalidate(0, tickLabels = tickMode === "auto" ? ticks : tickLabels);
    		}

    		if ($$self.$$.dirty & /*ticks, $yLim, $axesHeight*/ 3162112) {
    			$$invalidate(4, ticksY = axes.scaleY(ticks, $yLim, $axesHeight));
    		}

    		if ($$self.$$.dirty & /*x, dx*/ 6) {
    			$$invalidate(5, ticksX = x === undefined ? undefined : [x[0] + dx, x[0]]);
    		}
    	};

    	return [
    		tickLabels,
    		x,
    		dx,
    		y,
    		ticksY,
    		ticksX,
    		transform,
    		axisLineStyleStr,
    		gridLineStyleStr,
    		xLim,
    		yLim,
    		axesWidth,
    		axesHeight,
    		scale,
    		ticks,
    		slot,
    		showGrid,
    		las,
    		$xLim,
    		$axesWidth,
    		$yLim,
    		$axesHeight,
    		$scale,
    		tickNum
    	];
    }

    class YAxis extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$b, create_fragment$b, safe_not_equal, {
    			slot: 15,
    			ticks: 14,
    			tickLabels: 0,
    			showGrid: 16,
    			las: 17
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "YAxis",
    			options,
    			id: create_fragment$b.name
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

    	get las() {
    		throw new Error("<YAxis>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set las(value) {
    		throw new Error("<YAxis>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* ../../svelte-plots-basic/src/Rectangles.svelte generated by Svelte v3.38.2 */
    const file$7 = "../../svelte-plots-basic/src/Rectangles.svelte";

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[22] = list[i];
    	child_ctx[24] = i;
    	return child_ctx;
    }

    // (50:0) {#if rx !== undefined && ry !== undefined}
    function create_if_block$8(ctx) {
    	let each_1_anchor;
    	let each_value = /*left*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
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
    			if (dirty & /*rx, ry, rw, rh, barsStyleStr, left*/ 63) {
    				each_value = /*left*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$2(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$2(child_ctx);
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
    		id: create_if_block$8.name,
    		type: "if",
    		source: "(50:0) {#if rx !== undefined && ry !== undefined}",
    		ctx
    	});

    	return block;
    }

    // (51:3) {#each left as v, i}
    function create_each_block$2(ctx) {
    	let rect;
    	let rect_x_value;
    	let rect_y_value;
    	let rect_width_value;
    	let rect_height_value;

    	const block = {
    		c: function create() {
    			rect = svg_element("rect");
    			attr_dev(rect, "x", rect_x_value = /*rx*/ ctx[1][/*i*/ ctx[24]]);
    			attr_dev(rect, "y", rect_y_value = /*ry*/ ctx[2][/*i*/ ctx[24]]);
    			attr_dev(rect, "width", rect_width_value = /*rw*/ ctx[3][/*i*/ ctx[24]]);
    			attr_dev(rect, "height", rect_height_value = /*rh*/ ctx[4][/*i*/ ctx[24]]);
    			attr_dev(rect, "style", /*barsStyleStr*/ ctx[5]);
    			add_location(rect, file$7, 51, 6, 1929);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, rect, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*rx*/ 2 && rect_x_value !== (rect_x_value = /*rx*/ ctx[1][/*i*/ ctx[24]])) {
    				attr_dev(rect, "x", rect_x_value);
    			}

    			if (dirty & /*ry*/ 4 && rect_y_value !== (rect_y_value = /*ry*/ ctx[2][/*i*/ ctx[24]])) {
    				attr_dev(rect, "y", rect_y_value);
    			}

    			if (dirty & /*rw*/ 8 && rect_width_value !== (rect_width_value = /*rw*/ ctx[3][/*i*/ ctx[24]])) {
    				attr_dev(rect, "width", rect_width_value);
    			}

    			if (dirty & /*rh*/ 16 && rect_height_value !== (rect_height_value = /*rh*/ ctx[4][/*i*/ ctx[24]])) {
    				attr_dev(rect, "height", rect_height_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(rect);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$2.name,
    		type: "each",
    		source: "(51:3) {#each left as v, i}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$a(ctx) {
    	let if_block_anchor;
    	let if_block = /*rx*/ ctx[1] !== undefined && /*ry*/ ctx[2] !== undefined && create_if_block$8(ctx);

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
    			if (/*rx*/ ctx[1] !== undefined && /*ry*/ ctx[2] !== undefined) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$8(ctx);
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
    	let rx;
    	let ry;
    	let rw;
    	let rh;
    	let $xLim;
    	let $axesWidth;
    	let $yLim;
    	let $axesHeight;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Rectangles", slots, []);
    	let { left } = $$props;
    	let { top } = $$props;
    	let { width } = $$props;
    	let { height } = $$props;
    	let { labels = undefined } = $$props;
    	let { faceColor = Colors.PRIMARY } = $$props;
    	let { borderColor = faceColor } = $$props;

    	// styles for bars and labels
    	const barsStyleStr = `fill:${faceColor};stroke:${borderColor};stroke-width: 1px;`;

    	// multiply width and height values if needed
    	if (!Array.isArray(left) || !Array.isArray(top) || left.length < 1 || left.length != top.length) {
    		throw "Rectangles: parameters 'left' and 'top' must be vectors of the same size.";
    	}

    	// we make this reactive in case if left and right has been changed but not width
    	const n = left.length;

    	if (!Array.isArray(height)) height = Array(n).fill(height);
    	if (!Array.isArray(width)) width = Array(n).fill(width);

    	/* sanity check for input parameters */
    	if (top.length !== n || width.length !== n || height.length !== n) {
    		throw "Rectangles: x, y, w and h should have the same length (w and h can be single values).";
    	}

    	if (labels !== undefined && (!Array.isArray(labels) || labels.length !== n)) {
    		throw "Rectangles: vector with labels should have the same length as vectors with x and y coordinates.";
    	}

    	// get axes context and reactive variables needed to compute coordinates
    	const axes = getContext("axes");

    	const xLim = axes.xLim;
    	validate_store(xLim, "xLim");
    	component_subscribe($$self, xLim, value => $$invalidate(16, $xLim = value));
    	const yLim = axes.yLim;
    	validate_store(yLim, "yLim");
    	component_subscribe($$self, yLim, value => $$invalidate(18, $yLim = value));
    	const axesWidth = axes.width;
    	validate_store(axesWidth, "axesWidth");
    	component_subscribe($$self, axesWidth, value => $$invalidate(17, $axesWidth = value));
    	const axesHeight = axes.height;
    	validate_store(axesHeight, "axesHeight");
    	component_subscribe($$self, axesHeight, value => $$invalidate(19, $axesHeight = value));
    	const writable_props = ["left", "top", "width", "height", "labels", "faceColor", "borderColor"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Rectangles> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("left" in $$props) $$invalidate(0, left = $$props.left);
    		if ("top" in $$props) $$invalidate(12, top = $$props.top);
    		if ("width" in $$props) $$invalidate(10, width = $$props.width);
    		if ("height" in $$props) $$invalidate(11, height = $$props.height);
    		if ("labels" in $$props) $$invalidate(13, labels = $$props.labels);
    		if ("faceColor" in $$props) $$invalidate(14, faceColor = $$props.faceColor);
    		if ("borderColor" in $$props) $$invalidate(15, borderColor = $$props.borderColor);
    	};

    	$$self.$capture_state = () => ({
    		getContext,
    		Colors,
    		left,
    		top,
    		width,
    		height,
    		labels,
    		faceColor,
    		borderColor,
    		barsStyleStr,
    		n,
    		axes,
    		xLim,
    		yLim,
    		axesWidth,
    		axesHeight,
    		rx,
    		$xLim,
    		$axesWidth,
    		ry,
    		$yLim,
    		$axesHeight,
    		rw,
    		rh
    	});

    	$$self.$inject_state = $$props => {
    		if ("left" in $$props) $$invalidate(0, left = $$props.left);
    		if ("top" in $$props) $$invalidate(12, top = $$props.top);
    		if ("width" in $$props) $$invalidate(10, width = $$props.width);
    		if ("height" in $$props) $$invalidate(11, height = $$props.height);
    		if ("labels" in $$props) $$invalidate(13, labels = $$props.labels);
    		if ("faceColor" in $$props) $$invalidate(14, faceColor = $$props.faceColor);
    		if ("borderColor" in $$props) $$invalidate(15, borderColor = $$props.borderColor);
    		if ("rx" in $$props) $$invalidate(1, rx = $$props.rx);
    		if ("ry" in $$props) $$invalidate(2, ry = $$props.ry);
    		if ("rw" in $$props) $$invalidate(3, rw = $$props.rw);
    		if ("rh" in $$props) $$invalidate(4, rh = $$props.rh);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*left, $xLim, $axesWidth*/ 196609) {
    			// reactive variables for coordinates of data points in pixels
    			$$invalidate(1, rx = axes.scaleX(left, $xLim, $axesWidth));
    		}

    		if ($$self.$$.dirty & /*top, $yLim, $axesHeight*/ 790528) {
    			$$invalidate(2, ry = axes.scaleY(top, $yLim, $axesHeight));
    		}

    		if ($$self.$$.dirty & /*width, $xLim, $axesWidth*/ 197632) {
    			$$invalidate(3, rw = axes.scaleX(width, $xLim, $axesWidth, true));
    		}

    		if ($$self.$$.dirty & /*height, $yLim, $axesHeight*/ 788480) {
    			$$invalidate(4, rh = axes.scaleY(height, $yLim, $axesHeight, true));
    		}
    	};

    	return [
    		left,
    		rx,
    		ry,
    		rw,
    		rh,
    		barsStyleStr,
    		xLim,
    		yLim,
    		axesWidth,
    		axesHeight,
    		width,
    		height,
    		top,
    		labels,
    		faceColor,
    		borderColor,
    		$xLim,
    		$axesWidth,
    		$yLim,
    		$axesHeight
    	];
    }

    class Rectangles extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$a, create_fragment$a, safe_not_equal, {
    			left: 0,
    			top: 12,
    			width: 10,
    			height: 11,
    			labels: 13,
    			faceColor: 14,
    			borderColor: 15
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Rectangles",
    			options,
    			id: create_fragment$a.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*left*/ ctx[0] === undefined && !("left" in props)) {
    			console.warn("<Rectangles> was created without expected prop 'left'");
    		}

    		if (/*top*/ ctx[12] === undefined && !("top" in props)) {
    			console.warn("<Rectangles> was created without expected prop 'top'");
    		}

    		if (/*width*/ ctx[10] === undefined && !("width" in props)) {
    			console.warn("<Rectangles> was created without expected prop 'width'");
    		}

    		if (/*height*/ ctx[11] === undefined && !("height" in props)) {
    			console.warn("<Rectangles> was created without expected prop 'height'");
    		}
    	}

    	get left() {
    		throw new Error("<Rectangles>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set left(value) {
    		throw new Error("<Rectangles>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get top() {
    		throw new Error("<Rectangles>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set top(value) {
    		throw new Error("<Rectangles>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get width() {
    		throw new Error("<Rectangles>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set width(value) {
    		throw new Error("<Rectangles>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get height() {
    		throw new Error("<Rectangles>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set height(value) {
    		throw new Error("<Rectangles>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get labels() {
    		throw new Error("<Rectangles>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set labels(value) {
    		throw new Error("<Rectangles>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get faceColor() {
    		throw new Error("<Rectangles>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set faceColor(value) {
    		throw new Error("<Rectangles>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get borderColor() {
    		throw new Error("<Rectangles>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set borderColor(value) {
    		throw new Error("<Rectangles>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* ../../svelte-plots-basic/src/Box.svelte generated by Svelte v3.38.2 */
    const file$6 = "../../svelte-plots-basic/src/Box.svelte";

    // (28:0) {#if $isOk}
    function create_if_block$7(ctx) {
    	let g;
    	let rectangles;
    	let current;

    	rectangles = new Rectangles({
    			props: {
    				left: /*left*/ ctx[0],
    				top: /*top*/ ctx[1],
    				width: /*width*/ ctx[2],
    				height: /*height*/ ctx[3],
    				borderColor: Colors.DARKGRAY,
    				faceColor: "transparent"
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			g = svg_element("g");
    			create_component(rectangles.$$.fragment);
    			attr_dev(g, "class", "mdaplot__axes-box");
    			add_location(g, file$6, 28, 3, 744);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, g, anchor);
    			mount_component(rectangles, g, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const rectangles_changes = {};
    			if (dirty & /*left*/ 1) rectangles_changes.left = /*left*/ ctx[0];
    			if (dirty & /*top*/ 2) rectangles_changes.top = /*top*/ ctx[1];
    			if (dirty & /*width*/ 4) rectangles_changes.width = /*width*/ ctx[2];
    			if (dirty & /*height*/ 8) rectangles_changes.height = /*height*/ ctx[3];
    			rectangles.$set(rectangles_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(rectangles.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(rectangles.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(g);
    			destroy_component(rectangles);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$7.name,
    		type: "if",
    		source: "(28:0) {#if $isOk}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$9(ctx) {
    	let if_block_anchor;
    	let current;
    	let if_block = /*$isOk*/ ctx[4] && create_if_block$7(ctx);

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
    			if (/*$isOk*/ ctx[4]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*$isOk*/ 16) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block$7(ctx);
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
    		id: create_fragment$9.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$9($$self, $$props, $$invalidate) {
    	let left;
    	let top;
    	let width;
    	let height;
    	let $xLim;
    	let $yLim;
    	let $isOk;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Box", slots, []);
    	let { slot } = $$props;

    	// check that the box is located in a correct slot
    	if (slot !== "box") {
    		throw "Component Box must have \"slot='box'\" attribute.";
    	}

    	// get axes context and reactive variables needed to compute coordinates
    	const axes = getContext("axes");

    	const xLim = axes.xLim;
    	validate_store(xLim, "xLim");
    	component_subscribe($$self, xLim, value => $$invalidate(9, $xLim = value));
    	const yLim = axes.yLim;
    	validate_store(yLim, "yLim");
    	component_subscribe($$self, yLim, value => $$invalidate(10, $yLim = value));
    	const isOk = axes.isOk;
    	validate_store(isOk, "isOk");
    	component_subscribe($$self, isOk, value => $$invalidate(4, $isOk = value));
    	const writable_props = ["slot"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Box> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("slot" in $$props) $$invalidate(8, slot = $$props.slot);
    	};

    	$$self.$capture_state = () => ({
    		getContext,
    		Colors,
    		Rectangles,
    		slot,
    		axes,
    		xLim,
    		yLim,
    		isOk,
    		left,
    		$xLim,
    		top,
    		$yLim,
    		width,
    		height,
    		$isOk
    	});

    	$$self.$inject_state = $$props => {
    		if ("slot" in $$props) $$invalidate(8, slot = $$props.slot);
    		if ("left" in $$props) $$invalidate(0, left = $$props.left);
    		if ("top" in $$props) $$invalidate(1, top = $$props.top);
    		if ("width" in $$props) $$invalidate(2, width = $$props.width);
    		if ("height" in $$props) $$invalidate(3, height = $$props.height);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$xLim*/ 512) {
    			// reactive variables for coordinates of box points in pixels
    			$$invalidate(0, left = [$xLim[0]]);
    		}

    		if ($$self.$$.dirty & /*$yLim*/ 1024) {
    			$$invalidate(1, top = [$yLim[1]]);
    		}

    		if ($$self.$$.dirty & /*$xLim*/ 512) {
    			$$invalidate(2, width = [$xLim[1] - $xLim[0]]);
    		}

    		if ($$self.$$.dirty & /*$yLim*/ 1024) {
    			$$invalidate(3, height = [$yLim[1] - $yLim[0]]);
    		}
    	};

    	return [left, top, width, height, $isOk, xLim, yLim, isOk, slot, $xLim, $yLim];
    }

    class Box extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$9, create_fragment$9, safe_not_equal, { slot: 8 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Box",
    			options,
    			id: create_fragment$9.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*slot*/ ctx[8] === undefined && !("slot" in props)) {
    			console.warn("<Box> was created without expected prop 'slot'");
    		}
    	}

    	get slot() {
    		throw new Error("<Box>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set slot(value) {
    		throw new Error("<Box>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
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
    function create_if_block$6(ctx) {
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
    		id: create_if_block$6.name,
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

    function create_fragment$8(ctx) {
    	let if_block_anchor;
    	let if_block = /*x1*/ ctx[0] !== undefined && /*y1*/ ctx[2] !== undefined && create_if_block$6(ctx);

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
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$8($$self, $$props, $$invalidate) {
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

    		init(this, options, instance$8, create_fragment$8, safe_not_equal, {
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
    			id: create_fragment$8.name
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
    function create_if_block$5(ctx) {
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
    		id: create_if_block$5.name,
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

    function create_fragment$7(ctx) {
    	let if_block_anchor;
    	let if_block = /*x*/ ctx[2] !== undefined && /*y*/ ctx[3] !== undefined && create_if_block$5(ctx);

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
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props, $$invalidate) {
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

    		init(this, options, instance$7, create_fragment$7, safe_not_equal, {
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
    			id: create_fragment$7.name
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
    function create_if_block$4(ctx) {
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
    		id: create_if_block$4.name,
    		type: "if",
    		source: "(43:0) {#if p !== undefined}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$5(ctx) {
    	let if_block_anchor;
    	let if_block = /*p*/ ctx[1] !== undefined && create_if_block$4(ctx);

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
    function create_if_block$3(ctx) {
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
    		id: create_if_block$3.name,
    		type: "if",
    		source: "(46:0) {#if p !== undefined}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let if_block_anchor;
    	let if_block = /*p*/ ctx[3] !== undefined && create_if_block$3(ctx);

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

    /* src/PDFPlot.svelte generated by Svelte v3.38.2 */

    // (20:0) <Axes title="PDF" xLabel={varName} yLabel="Density" {limX} {limY}>
    function create_default_slot$3(ctx) {
    	let lineseries0;
    	let t0;
    	let segments;
    	let t1;
    	let lineseries1;
    	let t2;
    	let areaseries;
    	let t3;
    	let textlabels;
    	let current;

    	lineseries0 = new LineSeries({
    			props: {
    				lineColor: "#909090",
    				lineWidth: 2,
    				xValues: /*x*/ ctx[0],
    				yValues: /*y*/ ctx[1]
    			},
    			$$inline: true
    		});

    	segments = new Segments({
    			props: {
    				xStart: /*xs*/ ctx[6],
    				yStart: [0, 0],
    				xEnd: /*xs*/ ctx[6],
    				yEnd: /*ys*/ ctx[7]
    			},
    			$$inline: true
    		});

    	lineseries1 = new LineSeries({
    			props: {
    				lineWidth: 2,
    				xValues: /*xi*/ ctx[8],
    				yValues: /*yi*/ ctx[9]
    			},
    			$$inline: true
    		});

    	areaseries = new AreaSeries({
    			props: {
    				lineWidth: 2,
    				xValues: /*xi*/ ctx[8],
    				yValues: /*yi*/ ctx[9],
    				opacity: 0.25
    			},
    			$$inline: true
    		});

    	textlabels = new TextLabels({
    			props: {
    				xValues: [mean(/*xs*/ ctx[6])],
    				yValues: [0],
    				labels: [/*p*/ ctx[2].toFixed(3)],
    				faceColor: Colors.PRIMARY,
    				pos: 3
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(lineseries0.$$.fragment);
    			t0 = space();
    			create_component(segments.$$.fragment);
    			t1 = space();
    			create_component(lineseries1.$$.fragment);
    			t2 = space();
    			create_component(areaseries.$$.fragment);
    			t3 = space();
    			create_component(textlabels.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(lineseries0, target, anchor);
    			insert_dev(target, t0, anchor);
    			mount_component(segments, target, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(lineseries1, target, anchor);
    			insert_dev(target, t2, anchor);
    			mount_component(areaseries, target, anchor);
    			insert_dev(target, t3, anchor);
    			mount_component(textlabels, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const lineseries0_changes = {};
    			if (dirty & /*x*/ 1) lineseries0_changes.xValues = /*x*/ ctx[0];
    			if (dirty & /*y*/ 2) lineseries0_changes.yValues = /*y*/ ctx[1];
    			lineseries0.$set(lineseries0_changes);
    			const segments_changes = {};
    			if (dirty & /*xs*/ 64) segments_changes.xStart = /*xs*/ ctx[6];
    			if (dirty & /*xs*/ 64) segments_changes.xEnd = /*xs*/ ctx[6];
    			if (dirty & /*ys*/ 128) segments_changes.yEnd = /*ys*/ ctx[7];
    			segments.$set(segments_changes);
    			const lineseries1_changes = {};
    			if (dirty & /*xi*/ 256) lineseries1_changes.xValues = /*xi*/ ctx[8];
    			if (dirty & /*yi*/ 512) lineseries1_changes.yValues = /*yi*/ ctx[9];
    			lineseries1.$set(lineseries1_changes);
    			const areaseries_changes = {};
    			if (dirty & /*xi*/ 256) areaseries_changes.xValues = /*xi*/ ctx[8];
    			if (dirty & /*yi*/ 512) areaseries_changes.yValues = /*yi*/ ctx[9];
    			areaseries.$set(areaseries_changes);
    			const textlabels_changes = {};
    			if (dirty & /*xs*/ 64) textlabels_changes.xValues = [mean(/*xs*/ ctx[6])];
    			if (dirty & /*p*/ 4) textlabels_changes.labels = [/*p*/ ctx[2].toFixed(3)];
    			textlabels.$set(textlabels_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(lineseries0.$$.fragment, local);
    			transition_in(segments.$$.fragment, local);
    			transition_in(lineseries1.$$.fragment, local);
    			transition_in(areaseries.$$.fragment, local);
    			transition_in(textlabels.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(lineseries0.$$.fragment, local);
    			transition_out(segments.$$.fragment, local);
    			transition_out(lineseries1.$$.fragment, local);
    			transition_out(areaseries.$$.fragment, local);
    			transition_out(textlabels.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(lineseries0, detaching);
    			if (detaching) detach_dev(t0);
    			destroy_component(segments, detaching);
    			if (detaching) detach_dev(t1);
    			destroy_component(lineseries1, detaching);
    			if (detaching) detach_dev(t2);
    			destroy_component(areaseries, detaching);
    			if (detaching) detach_dev(t3);
    			destroy_component(textlabels, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$3.name,
    		type: "slot",
    		source: "(20:0) <Axes title=\\\"PDF\\\" xLabel={varName} yLabel=\\\"Density\\\" {limX} {limY}>",
    		ctx
    	});

    	return block;
    }

    // (21:3) 
    function create_xaxis_slot$2(ctx) {
    	let xaxis;
    	let current;

    	xaxis = new XAxis({
    			props: { slot: "xaxis", showGrid: true },
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
    		id: create_xaxis_slot$2.name,
    		type: "slot",
    		source: "(21:3) ",
    		ctx
    	});

    	return block;
    }

    // (22:3) 
    function create_yaxis_slot$2(ctx) {
    	let yaxis;
    	let current;

    	yaxis = new YAxis({
    			props: { slot: "yaxis", showGrid: true },
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
    		id: create_yaxis_slot$2.name,
    		type: "slot",
    		source: "(22:3) ",
    		ctx
    	});

    	return block;
    }

    // (23:3) 
    function create_box_slot$2(ctx) {
    	let box;
    	let current;
    	box = new Box({ props: { slot: "box" }, $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(box.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(box, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(box.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(box.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(box, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_box_slot$2.name,
    		type: "slot",
    		source: "(23:3) ",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let axes;
    	let current;

    	axes = new Axes({
    			props: {
    				title: "PDF",
    				xLabel: /*varName*/ ctx[5],
    				yLabel: "Density",
    				limX: /*limX*/ ctx[3],
    				limY: /*limY*/ ctx[4],
    				$$slots: {
    					box: [create_box_slot$2],
    					yaxis: [create_yaxis_slot$2],
    					xaxis: [create_xaxis_slot$2],
    					default: [create_default_slot$3]
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
    			if (dirty & /*varName*/ 32) axes_changes.xLabel = /*varName*/ ctx[5];
    			if (dirty & /*limX*/ 8) axes_changes.limX = /*limX*/ ctx[3];
    			if (dirty & /*limY*/ 16) axes_changes.limY = /*limY*/ ctx[4];

    			if (dirty & /*$$scope, xs, p, xi, yi, ys, x, y*/ 3015) {
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
    	let xs;
    	let ys;
    	let xi;
    	let yi;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("PDFPlot", slots, []);
    	let { x } = $$props;
    	let { y } = $$props;
    	let { p } = $$props;
    	let { limX } = $$props;
    	let { limY } = $$props;
    	let { intInd } = $$props;
    	let { varName } = $$props;
    	const writable_props = ["x", "y", "p", "limX", "limY", "intInd", "varName"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<PDFPlot> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("x" in $$props) $$invalidate(0, x = $$props.x);
    		if ("y" in $$props) $$invalidate(1, y = $$props.y);
    		if ("p" in $$props) $$invalidate(2, p = $$props.p);
    		if ("limX" in $$props) $$invalidate(3, limX = $$props.limX);
    		if ("limY" in $$props) $$invalidate(4, limY = $$props.limY);
    		if ("intInd" in $$props) $$invalidate(10, intInd = $$props.intInd);
    		if ("varName" in $$props) $$invalidate(5, varName = $$props.varName);
    	};

    	$$self.$capture_state = () => ({
    		mean,
    		Axes,
    		XAxis,
    		YAxis,
    		Box,
    		Segments,
    		AreaSeries,
    		TextLabels,
    		Colors,
    		LineSeries,
    		x,
    		y,
    		p,
    		limX,
    		limY,
    		intInd,
    		varName,
    		xs,
    		ys,
    		xi,
    		yi
    	});

    	$$self.$inject_state = $$props => {
    		if ("x" in $$props) $$invalidate(0, x = $$props.x);
    		if ("y" in $$props) $$invalidate(1, y = $$props.y);
    		if ("p" in $$props) $$invalidate(2, p = $$props.p);
    		if ("limX" in $$props) $$invalidate(3, limX = $$props.limX);
    		if ("limY" in $$props) $$invalidate(4, limY = $$props.limY);
    		if ("intInd" in $$props) $$invalidate(10, intInd = $$props.intInd);
    		if ("varName" in $$props) $$invalidate(5, varName = $$props.varName);
    		if ("xs" in $$props) $$invalidate(6, xs = $$props.xs);
    		if ("ys" in $$props) $$invalidate(7, ys = $$props.ys);
    		if ("xi" in $$props) $$invalidate(8, xi = $$props.xi);
    		if ("yi" in $$props) $$invalidate(9, yi = $$props.yi);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*x, intInd*/ 1025) {
    			$$invalidate(6, xs = [x[intInd[0]], x[intInd[1]]]);
    		}

    		if ($$self.$$.dirty & /*y, intInd*/ 1026) {
    			$$invalidate(7, ys = [y[intInd[0]], y[intInd[1]]]);
    		}

    		if ($$self.$$.dirty & /*x, intInd*/ 1025) {
    			$$invalidate(8, xi = x.filter((v, i) => i >= intInd[0] & i <= intInd[1]));
    		}

    		if ($$self.$$.dirty & /*y, intInd*/ 1026) {
    			$$invalidate(9, yi = y.filter((v, i) => i >= intInd[0] & i <= intInd[1]));
    		}
    	};

    	return [x, y, p, limX, limY, varName, xs, ys, xi, yi, intInd];
    }

    class PDFPlot extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {
    			x: 0,
    			y: 1,
    			p: 2,
    			limX: 3,
    			limY: 4,
    			intInd: 10,
    			varName: 5
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "PDFPlot",
    			options,
    			id: create_fragment$3.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*x*/ ctx[0] === undefined && !("x" in props)) {
    			console.warn("<PDFPlot> was created without expected prop 'x'");
    		}

    		if (/*y*/ ctx[1] === undefined && !("y" in props)) {
    			console.warn("<PDFPlot> was created without expected prop 'y'");
    		}

    		if (/*p*/ ctx[2] === undefined && !("p" in props)) {
    			console.warn("<PDFPlot> was created without expected prop 'p'");
    		}

    		if (/*limX*/ ctx[3] === undefined && !("limX" in props)) {
    			console.warn("<PDFPlot> was created without expected prop 'limX'");
    		}

    		if (/*limY*/ ctx[4] === undefined && !("limY" in props)) {
    			console.warn("<PDFPlot> was created without expected prop 'limY'");
    		}

    		if (/*intInd*/ ctx[10] === undefined && !("intInd" in props)) {
    			console.warn("<PDFPlot> was created without expected prop 'intInd'");
    		}

    		if (/*varName*/ ctx[5] === undefined && !("varName" in props)) {
    			console.warn("<PDFPlot> was created without expected prop 'varName'");
    		}
    	}

    	get x() {
    		throw new Error("<PDFPlot>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set x(value) {
    		throw new Error("<PDFPlot>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get y() {
    		throw new Error("<PDFPlot>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set y(value) {
    		throw new Error("<PDFPlot>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get p() {
    		throw new Error("<PDFPlot>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set p(value) {
    		throw new Error("<PDFPlot>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get limX() {
    		throw new Error("<PDFPlot>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set limX(value) {
    		throw new Error("<PDFPlot>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get limY() {
    		throw new Error("<PDFPlot>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set limY(value) {
    		throw new Error("<PDFPlot>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get intInd() {
    		throw new Error("<PDFPlot>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set intInd(value) {
    		throw new Error("<PDFPlot>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get varName() {
    		throw new Error("<PDFPlot>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set varName(value) {
    		throw new Error("<PDFPlot>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/CDFPlot.svelte generated by Svelte v3.38.2 */

    // (34:3) {#if mode === "Interval"}
    function create_if_block$2(ctx) {
    	let segments0;
    	let t0;
    	let segments1;
    	let t1;
    	let lineseries;
    	let t2;
    	let scatterseries;
    	let t3;
    	let textlabels;
    	let current;

    	segments0 = new Segments({
    			props: {
    				xStart: [/*xs*/ ctx[7][0]],
    				yStart: [/*limY*/ ctx[3][0]],
    				xEnd: [/*xs*/ ctx[7][0]],
    				yEnd: [/*ys*/ ctx[6][0]]
    			},
    			$$inline: true
    		});

    	segments1 = new Segments({
    			props: {
    				xStart: [/*limX*/ ctx[2][0]],
    				yStart: [/*ys*/ ctx[6][0]],
    				xEnd: [/*xs*/ ctx[7][0]],
    				yEnd: [/*ys*/ ctx[6][0]]
    			},
    			$$inline: true
    		});

    	lineseries = new LineSeries({
    			props: {
    				lineWidth: 2,
    				xValues: /*xi*/ ctx[8],
    				yValues: /*yi*/ ctx[9]
    			},
    			$$inline: true
    		});

    	scatterseries = new ScatterSeries({
    			props: {
    				xValues: [/*xs*/ ctx[7][0]],
    				yValues: [/*ys*/ ctx[6][0]],
    				faceColor: Colors.PRIMARY
    			},
    			$$inline: true
    		});

    	textlabels = new TextLabels({
    			props: {
    				xValues: [/*limX*/ ctx[2][0] + 15],
    				yValues: [/*ys*/ ctx[6][0]],
    				labels: /*ys*/ ctx[6][0].toFixed(3),
    				pos: /*pos*/ ctx[10],
    				faceColor: Colors.PRIMARY
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(segments0.$$.fragment);
    			t0 = space();
    			create_component(segments1.$$.fragment);
    			t1 = space();
    			create_component(lineseries.$$.fragment);
    			t2 = space();
    			create_component(scatterseries.$$.fragment);
    			t3 = space();
    			create_component(textlabels.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(segments0, target, anchor);
    			insert_dev(target, t0, anchor);
    			mount_component(segments1, target, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(lineseries, target, anchor);
    			insert_dev(target, t2, anchor);
    			mount_component(scatterseries, target, anchor);
    			insert_dev(target, t3, anchor);
    			mount_component(textlabels, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const segments0_changes = {};
    			if (dirty & /*xs*/ 128) segments0_changes.xStart = [/*xs*/ ctx[7][0]];
    			if (dirty & /*limY*/ 8) segments0_changes.yStart = [/*limY*/ ctx[3][0]];
    			if (dirty & /*xs*/ 128) segments0_changes.xEnd = [/*xs*/ ctx[7][0]];
    			if (dirty & /*ys*/ 64) segments0_changes.yEnd = [/*ys*/ ctx[6][0]];
    			segments0.$set(segments0_changes);
    			const segments1_changes = {};
    			if (dirty & /*limX*/ 4) segments1_changes.xStart = [/*limX*/ ctx[2][0]];
    			if (dirty & /*ys*/ 64) segments1_changes.yStart = [/*ys*/ ctx[6][0]];
    			if (dirty & /*xs*/ 128) segments1_changes.xEnd = [/*xs*/ ctx[7][0]];
    			if (dirty & /*ys*/ 64) segments1_changes.yEnd = [/*ys*/ ctx[6][0]];
    			segments1.$set(segments1_changes);
    			const lineseries_changes = {};
    			if (dirty & /*xi*/ 256) lineseries_changes.xValues = /*xi*/ ctx[8];
    			if (dirty & /*yi*/ 512) lineseries_changes.yValues = /*yi*/ ctx[9];
    			lineseries.$set(lineseries_changes);
    			const scatterseries_changes = {};
    			if (dirty & /*xs*/ 128) scatterseries_changes.xValues = [/*xs*/ ctx[7][0]];
    			if (dirty & /*ys*/ 64) scatterseries_changes.yValues = [/*ys*/ ctx[6][0]];
    			scatterseries.$set(scatterseries_changes);
    			const textlabels_changes = {};
    			if (dirty & /*limX*/ 4) textlabels_changes.xValues = [/*limX*/ ctx[2][0] + 15];
    			if (dirty & /*ys*/ 64) textlabels_changes.yValues = [/*ys*/ ctx[6][0]];
    			if (dirty & /*ys*/ 64) textlabels_changes.labels = /*ys*/ ctx[6][0].toFixed(3);
    			if (dirty & /*pos*/ 1024) textlabels_changes.pos = /*pos*/ ctx[10];
    			textlabels.$set(textlabels_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(segments0.$$.fragment, local);
    			transition_in(segments1.$$.fragment, local);
    			transition_in(lineseries.$$.fragment, local);
    			transition_in(scatterseries.$$.fragment, local);
    			transition_in(textlabels.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(segments0.$$.fragment, local);
    			transition_out(segments1.$$.fragment, local);
    			transition_out(lineseries.$$.fragment, local);
    			transition_out(scatterseries.$$.fragment, local);
    			transition_out(textlabels.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(segments0, detaching);
    			if (detaching) detach_dev(t0);
    			destroy_component(segments1, detaching);
    			if (detaching) detach_dev(t1);
    			destroy_component(lineseries, detaching);
    			if (detaching) detach_dev(t2);
    			destroy_component(scatterseries, detaching);
    			if (detaching) detach_dev(t3);
    			destroy_component(textlabels, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(34:3) {#if mode === \\\"Interval\\\"}",
    		ctx
    	});

    	return block;
    }

    // (21:0) <Axes title="CDF" xLabel={varName} yLabel="Probability, p" {limX} {limY} >
    function create_default_slot$2(ctx) {
    	let lineseries0;
    	let t0;
    	let segments0;
    	let t1;
    	let segments1;
    	let t2;
    	let lineseries1;
    	let t3;
    	let scatterseries;
    	let t4;
    	let textlabels;
    	let t5;
    	let if_block_anchor;
    	let current;

    	lineseries0 = new LineSeries({
    			props: {
    				lineColor: "#909090",
    				lineWidth: 2,
    				xValues: /*x*/ ctx[0],
    				yValues: /*y*/ ctx[1]
    			},
    			$$inline: true
    		});

    	segments0 = new Segments({
    			props: {
    				xStart: [/*xs*/ ctx[7][1]],
    				yStart: [/*limY*/ ctx[3][0]],
    				xEnd: [/*xs*/ ctx[7][1]],
    				yEnd: [/*ys*/ ctx[6][1]]
    			},
    			$$inline: true
    		});

    	segments1 = new Segments({
    			props: {
    				xStart: [/*limX*/ ctx[2][0]],
    				yStart: [/*ys*/ ctx[6][1]],
    				xEnd: [/*xs*/ ctx[7][1]],
    				yEnd: [/*ys*/ ctx[6][1]]
    			},
    			$$inline: true
    		});

    	lineseries1 = new LineSeries({
    			props: {
    				lineWidth: 2,
    				xValues: /*xi*/ ctx[8],
    				yValues: /*yi*/ ctx[9]
    			},
    			$$inline: true
    		});

    	scatterseries = new ScatterSeries({
    			props: {
    				xValues: [/*xs*/ ctx[7][1]],
    				yValues: [/*ys*/ ctx[6][1]],
    				faceColor: Colors.PRIMARY
    			},
    			$$inline: true
    		});

    	textlabels = new TextLabels({
    			props: {
    				xValues: [/*limX*/ ctx[2][0] + 15],
    				yValues: [/*ys*/ ctx[6][1]],
    				labels: /*ys*/ ctx[6][1].toFixed(4),
    				pos: 3,
    				faceColor: Colors.PRIMARY
    			},
    			$$inline: true
    		});

    	let if_block = /*mode*/ ctx[4] === "Interval" && create_if_block$2(ctx);

    	const block = {
    		c: function create() {
    			create_component(lineseries0.$$.fragment);
    			t0 = space();
    			create_component(segments0.$$.fragment);
    			t1 = space();
    			create_component(segments1.$$.fragment);
    			t2 = space();
    			create_component(lineseries1.$$.fragment);
    			t3 = space();
    			create_component(scatterseries.$$.fragment);
    			t4 = space();
    			create_component(textlabels.$$.fragment);
    			t5 = space();
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			mount_component(lineseries0, target, anchor);
    			insert_dev(target, t0, anchor);
    			mount_component(segments0, target, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(segments1, target, anchor);
    			insert_dev(target, t2, anchor);
    			mount_component(lineseries1, target, anchor);
    			insert_dev(target, t3, anchor);
    			mount_component(scatterseries, target, anchor);
    			insert_dev(target, t4, anchor);
    			mount_component(textlabels, target, anchor);
    			insert_dev(target, t5, anchor);
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const lineseries0_changes = {};
    			if (dirty & /*x*/ 1) lineseries0_changes.xValues = /*x*/ ctx[0];
    			if (dirty & /*y*/ 2) lineseries0_changes.yValues = /*y*/ ctx[1];
    			lineseries0.$set(lineseries0_changes);
    			const segments0_changes = {};
    			if (dirty & /*xs*/ 128) segments0_changes.xStart = [/*xs*/ ctx[7][1]];
    			if (dirty & /*limY*/ 8) segments0_changes.yStart = [/*limY*/ ctx[3][0]];
    			if (dirty & /*xs*/ 128) segments0_changes.xEnd = [/*xs*/ ctx[7][1]];
    			if (dirty & /*ys*/ 64) segments0_changes.yEnd = [/*ys*/ ctx[6][1]];
    			segments0.$set(segments0_changes);
    			const segments1_changes = {};
    			if (dirty & /*limX*/ 4) segments1_changes.xStart = [/*limX*/ ctx[2][0]];
    			if (dirty & /*ys*/ 64) segments1_changes.yStart = [/*ys*/ ctx[6][1]];
    			if (dirty & /*xs*/ 128) segments1_changes.xEnd = [/*xs*/ ctx[7][1]];
    			if (dirty & /*ys*/ 64) segments1_changes.yEnd = [/*ys*/ ctx[6][1]];
    			segments1.$set(segments1_changes);
    			const lineseries1_changes = {};
    			if (dirty & /*xi*/ 256) lineseries1_changes.xValues = /*xi*/ ctx[8];
    			if (dirty & /*yi*/ 512) lineseries1_changes.yValues = /*yi*/ ctx[9];
    			lineseries1.$set(lineseries1_changes);
    			const scatterseries_changes = {};
    			if (dirty & /*xs*/ 128) scatterseries_changes.xValues = [/*xs*/ ctx[7][1]];
    			if (dirty & /*ys*/ 64) scatterseries_changes.yValues = [/*ys*/ ctx[6][1]];
    			scatterseries.$set(scatterseries_changes);
    			const textlabels_changes = {};
    			if (dirty & /*limX*/ 4) textlabels_changes.xValues = [/*limX*/ ctx[2][0] + 15];
    			if (dirty & /*ys*/ 64) textlabels_changes.yValues = [/*ys*/ ctx[6][1]];
    			if (dirty & /*ys*/ 64) textlabels_changes.labels = /*ys*/ ctx[6][1].toFixed(4);
    			textlabels.$set(textlabels_changes);

    			if (/*mode*/ ctx[4] === "Interval") {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*mode*/ 16) {
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
    			transition_in(lineseries0.$$.fragment, local);
    			transition_in(segments0.$$.fragment, local);
    			transition_in(segments1.$$.fragment, local);
    			transition_in(lineseries1.$$.fragment, local);
    			transition_in(scatterseries.$$.fragment, local);
    			transition_in(textlabels.$$.fragment, local);
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(lineseries0.$$.fragment, local);
    			transition_out(segments0.$$.fragment, local);
    			transition_out(segments1.$$.fragment, local);
    			transition_out(lineseries1.$$.fragment, local);
    			transition_out(scatterseries.$$.fragment, local);
    			transition_out(textlabels.$$.fragment, local);
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(lineseries0, detaching);
    			if (detaching) detach_dev(t0);
    			destroy_component(segments0, detaching);
    			if (detaching) detach_dev(t1);
    			destroy_component(segments1, detaching);
    			if (detaching) detach_dev(t2);
    			destroy_component(lineseries1, detaching);
    			if (detaching) detach_dev(t3);
    			destroy_component(scatterseries, detaching);
    			if (detaching) detach_dev(t4);
    			destroy_component(textlabels, detaching);
    			if (detaching) detach_dev(t5);
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$2.name,
    		type: "slot",
    		source: "(21:0) <Axes title=\\\"CDF\\\" xLabel={varName} yLabel=\\\"Probability, p\\\" {limX} {limY} >",
    		ctx
    	});

    	return block;
    }

    // (22:3) 
    function create_xaxis_slot$1(ctx) {
    	let xaxis;
    	let current;

    	xaxis = new XAxis({
    			props: { slot: "xaxis", showGrid: true },
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
    		id: create_xaxis_slot$1.name,
    		type: "slot",
    		source: "(22:3) ",
    		ctx
    	});

    	return block;
    }

    // (23:3) 
    function create_yaxis_slot$1(ctx) {
    	let yaxis;
    	let current;

    	yaxis = new YAxis({
    			props: { slot: "yaxis", showGrid: true },
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
    		id: create_yaxis_slot$1.name,
    		type: "slot",
    		source: "(23:3) ",
    		ctx
    	});

    	return block;
    }

    // (24:3) 
    function create_box_slot$1(ctx) {
    	let box;
    	let current;
    	box = new Box({ props: { slot: "box" }, $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(box.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(box, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(box.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(box.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(box, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_box_slot$1.name,
    		type: "slot",
    		source: "(24:3) ",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let axes;
    	let current;

    	axes = new Axes({
    			props: {
    				title: "CDF",
    				xLabel: /*varName*/ ctx[5],
    				yLabel: "Probability, p",
    				limX: /*limX*/ ctx[2],
    				limY: /*limY*/ ctx[3],
    				$$slots: {
    					box: [create_box_slot$1],
    					yaxis: [create_yaxis_slot$1],
    					xaxis: [create_xaxis_slot$1],
    					default: [create_default_slot$2]
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
    			if (dirty & /*varName*/ 32) axes_changes.xLabel = /*varName*/ ctx[5];
    			if (dirty & /*limX*/ 4) axes_changes.limX = /*limX*/ ctx[2];
    			if (dirty & /*limY*/ 8) axes_changes.limY = /*limY*/ ctx[3];

    			if (dirty & /*$$scope, limX, ys, pos, xs, xi, yi, limY, mode, x, y*/ 6111) {
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

    function instance$2($$self, $$props, $$invalidate) {
    	let xs;
    	let ys;
    	let xi;
    	let yi;
    	let pos;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("CDFPlot", slots, []);
    	let { x } = $$props;
    	let { y } = $$props;
    	let { limX } = $$props;
    	let { limY } = $$props;
    	let { mode } = $$props;
    	let { intInd } = $$props;
    	let { varName } = $$props;
    	const writable_props = ["x", "y", "limX", "limY", "mode", "intInd", "varName"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<CDFPlot> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("x" in $$props) $$invalidate(0, x = $$props.x);
    		if ("y" in $$props) $$invalidate(1, y = $$props.y);
    		if ("limX" in $$props) $$invalidate(2, limX = $$props.limX);
    		if ("limY" in $$props) $$invalidate(3, limY = $$props.limY);
    		if ("mode" in $$props) $$invalidate(4, mode = $$props.mode);
    		if ("intInd" in $$props) $$invalidate(11, intInd = $$props.intInd);
    		if ("varName" in $$props) $$invalidate(5, varName = $$props.varName);
    	};

    	$$self.$capture_state = () => ({
    		mean,
    		Axes,
    		XAxis,
    		YAxis,
    		Box,
    		Segments,
    		ScatterSeries,
    		Colors,
    		TextLabels,
    		AreaSeries,
    		LineSeries,
    		x,
    		y,
    		limX,
    		limY,
    		mode,
    		intInd,
    		varName,
    		xs,
    		ys,
    		xi,
    		yi,
    		pos
    	});

    	$$self.$inject_state = $$props => {
    		if ("x" in $$props) $$invalidate(0, x = $$props.x);
    		if ("y" in $$props) $$invalidate(1, y = $$props.y);
    		if ("limX" in $$props) $$invalidate(2, limX = $$props.limX);
    		if ("limY" in $$props) $$invalidate(3, limY = $$props.limY);
    		if ("mode" in $$props) $$invalidate(4, mode = $$props.mode);
    		if ("intInd" in $$props) $$invalidate(11, intInd = $$props.intInd);
    		if ("varName" in $$props) $$invalidate(5, varName = $$props.varName);
    		if ("xs" in $$props) $$invalidate(7, xs = $$props.xs);
    		if ("ys" in $$props) $$invalidate(6, ys = $$props.ys);
    		if ("xi" in $$props) $$invalidate(8, xi = $$props.xi);
    		if ("yi" in $$props) $$invalidate(9, yi = $$props.yi);
    		if ("pos" in $$props) $$invalidate(10, pos = $$props.pos);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*x, intInd*/ 2049) {
    			$$invalidate(7, xs = [x[intInd[0]], x[intInd[1]]]);
    		}

    		if ($$self.$$.dirty & /*y, intInd*/ 2050) {
    			$$invalidate(6, ys = [y[intInd[0]], y[intInd[1]]]);
    		}

    		if ($$self.$$.dirty & /*x, intInd*/ 2049) {
    			$$invalidate(8, xi = x.filter((v, i) => i >= intInd[0] & i <= intInd[1]));
    		}

    		if ($$self.$$.dirty & /*y, intInd*/ 2050) {
    			$$invalidate(9, yi = y.filter((v, i) => i >= intInd[0] & i <= intInd[1]));
    		}

    		if ($$self.$$.dirty & /*ys*/ 64) {
    			$$invalidate(10, pos = ys[0] < 0.08 ? 3 : 1);
    		}
    	};

    	return [x, y, limX, limY, mode, varName, ys, xs, xi, yi, pos, intInd];
    }

    class CDFPlot extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {
    			x: 0,
    			y: 1,
    			limX: 2,
    			limY: 3,
    			mode: 4,
    			intInd: 11,
    			varName: 5
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "CDFPlot",
    			options,
    			id: create_fragment$2.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*x*/ ctx[0] === undefined && !("x" in props)) {
    			console.warn("<CDFPlot> was created without expected prop 'x'");
    		}

    		if (/*y*/ ctx[1] === undefined && !("y" in props)) {
    			console.warn("<CDFPlot> was created without expected prop 'y'");
    		}

    		if (/*limX*/ ctx[2] === undefined && !("limX" in props)) {
    			console.warn("<CDFPlot> was created without expected prop 'limX'");
    		}

    		if (/*limY*/ ctx[3] === undefined && !("limY" in props)) {
    			console.warn("<CDFPlot> was created without expected prop 'limY'");
    		}

    		if (/*mode*/ ctx[4] === undefined && !("mode" in props)) {
    			console.warn("<CDFPlot> was created without expected prop 'mode'");
    		}

    		if (/*intInd*/ ctx[11] === undefined && !("intInd" in props)) {
    			console.warn("<CDFPlot> was created without expected prop 'intInd'");
    		}

    		if (/*varName*/ ctx[5] === undefined && !("varName" in props)) {
    			console.warn("<CDFPlot> was created without expected prop 'varName'");
    		}
    	}

    	get x() {
    		throw new Error("<CDFPlot>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set x(value) {
    		throw new Error("<CDFPlot>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get y() {
    		throw new Error("<CDFPlot>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set y(value) {
    		throw new Error("<CDFPlot>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get limX() {
    		throw new Error("<CDFPlot>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set limX(value) {
    		throw new Error("<CDFPlot>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get limY() {
    		throw new Error("<CDFPlot>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set limY(value) {
    		throw new Error("<CDFPlot>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get mode() {
    		throw new Error("<CDFPlot>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set mode(value) {
    		throw new Error("<CDFPlot>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get intInd() {
    		throw new Error("<CDFPlot>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set intInd(value) {
    		throw new Error("<CDFPlot>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get varName() {
    		throw new Error("<CDFPlot>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set varName(value) {
    		throw new Error("<CDFPlot>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/ICDFPlot.svelte generated by Svelte v3.38.2 */

    // (45:3) {#if mode === "Interval"}
    function create_if_block$1(ctx) {
    	let segments0;
    	let t0;
    	let segments1;
    	let t1;
    	let lineseries;
    	let t2;
    	let scatterseries;
    	let t3;
    	let textlabels;
    	let current;

    	segments0 = new Segments({
    			props: {
    				xStart: [/*ys*/ ctx[7][0]],
    				yStart: [/*limX*/ ctx[2][0]],
    				xEnd: [/*ys*/ ctx[7][0]],
    				yEnd: [/*xs*/ ctx[6][0]]
    			},
    			$$inline: true
    		});

    	segments1 = new Segments({
    			props: {
    				xStart: [/*limY*/ ctx[3][0]],
    				yStart: [/*xs*/ ctx[6][0]],
    				xEnd: [/*ys*/ ctx[7][0]],
    				yEnd: [/*xs*/ ctx[6][0]]
    			},
    			$$inline: true
    		});

    	lineseries = new LineSeries({
    			props: {
    				lineWidth: 2,
    				xValues: /*yi*/ ctx[9],
    				yValues: /*xi*/ ctx[8]
    			},
    			$$inline: true
    		});

    	scatterseries = new ScatterSeries({
    			props: {
    				xValues: [/*ys*/ ctx[7][0]],
    				yValues: [/*xs*/ ctx[6][0]],
    				faceColor: Colors.PRIMARY
    			},
    			$$inline: true
    		});

    	textlabels = new TextLabels({
    			props: {
    				xValues: [/*limY*/ ctx[3][0] + 0.1],
    				yValues: [/*xs*/ ctx[6][0]],
    				labels: /*xs*/ ctx[6][0].toFixed(1),
    				pos: /*pos*/ ctx[10],
    				faceColor: Colors.PRIMARY
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(segments0.$$.fragment);
    			t0 = space();
    			create_component(segments1.$$.fragment);
    			t1 = space();
    			create_component(lineseries.$$.fragment);
    			t2 = space();
    			create_component(scatterseries.$$.fragment);
    			t3 = space();
    			create_component(textlabels.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(segments0, target, anchor);
    			insert_dev(target, t0, anchor);
    			mount_component(segments1, target, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(lineseries, target, anchor);
    			insert_dev(target, t2, anchor);
    			mount_component(scatterseries, target, anchor);
    			insert_dev(target, t3, anchor);
    			mount_component(textlabels, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const segments0_changes = {};
    			if (dirty & /*ys*/ 128) segments0_changes.xStart = [/*ys*/ ctx[7][0]];
    			if (dirty & /*limX*/ 4) segments0_changes.yStart = [/*limX*/ ctx[2][0]];
    			if (dirty & /*ys*/ 128) segments0_changes.xEnd = [/*ys*/ ctx[7][0]];
    			if (dirty & /*xs*/ 64) segments0_changes.yEnd = [/*xs*/ ctx[6][0]];
    			segments0.$set(segments0_changes);
    			const segments1_changes = {};
    			if (dirty & /*limY*/ 8) segments1_changes.xStart = [/*limY*/ ctx[3][0]];
    			if (dirty & /*xs*/ 64) segments1_changes.yStart = [/*xs*/ ctx[6][0]];
    			if (dirty & /*ys*/ 128) segments1_changes.xEnd = [/*ys*/ ctx[7][0]];
    			if (dirty & /*xs*/ 64) segments1_changes.yEnd = [/*xs*/ ctx[6][0]];
    			segments1.$set(segments1_changes);
    			const lineseries_changes = {};
    			if (dirty & /*yi*/ 512) lineseries_changes.xValues = /*yi*/ ctx[9];
    			if (dirty & /*xi*/ 256) lineseries_changes.yValues = /*xi*/ ctx[8];
    			lineseries.$set(lineseries_changes);
    			const scatterseries_changes = {};
    			if (dirty & /*ys*/ 128) scatterseries_changes.xValues = [/*ys*/ ctx[7][0]];
    			if (dirty & /*xs*/ 64) scatterseries_changes.yValues = [/*xs*/ ctx[6][0]];
    			scatterseries.$set(scatterseries_changes);
    			const textlabels_changes = {};
    			if (dirty & /*limY*/ 8) textlabels_changes.xValues = [/*limY*/ ctx[3][0] + 0.1];
    			if (dirty & /*xs*/ 64) textlabels_changes.yValues = [/*xs*/ ctx[6][0]];
    			if (dirty & /*xs*/ 64) textlabels_changes.labels = /*xs*/ ctx[6][0].toFixed(1);
    			if (dirty & /*pos*/ 1024) textlabels_changes.pos = /*pos*/ ctx[10];
    			textlabels.$set(textlabels_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(segments0.$$.fragment, local);
    			transition_in(segments1.$$.fragment, local);
    			transition_in(lineseries.$$.fragment, local);
    			transition_in(scatterseries.$$.fragment, local);
    			transition_in(textlabels.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(segments0.$$.fragment, local);
    			transition_out(segments1.$$.fragment, local);
    			transition_out(lineseries.$$.fragment, local);
    			transition_out(scatterseries.$$.fragment, local);
    			transition_out(textlabels.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(segments0, detaching);
    			if (detaching) detach_dev(t0);
    			destroy_component(segments1, detaching);
    			if (detaching) detach_dev(t1);
    			destroy_component(lineseries, detaching);
    			if (detaching) detach_dev(t2);
    			destroy_component(scatterseries, detaching);
    			if (detaching) detach_dev(t3);
    			destroy_component(textlabels, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(45:3) {#if mode === \\\"Interval\\\"}",
    		ctx
    	});

    	return block;
    }

    // (25:0) <Axes title="Inverse CDF" xLabel="Probability" yLabel={varName} limX={limY} limY={limX} >
    function create_default_slot$1(ctx) {
    	let lineseries0;
    	let t0;
    	let segments0;
    	let t1;
    	let segments1;
    	let t2;
    	let lineseries1;
    	let t3;
    	let scatterseries;
    	let t4;
    	let textlabels;
    	let t5;
    	let if_block_anchor;
    	let current;

    	lineseries0 = new LineSeries({
    			props: {
    				lineColor: "#909090",
    				lineWidth: 2,
    				xValues: /*y*/ ctx[1],
    				yValues: /*x*/ ctx[0]
    			},
    			$$inline: true
    		});

    	segments0 = new Segments({
    			props: {
    				xStart: [/*ys*/ ctx[7][1]],
    				yStart: [/*limX*/ ctx[2][0]],
    				xEnd: [/*ys*/ ctx[7][1]],
    				yEnd: [/*xs*/ ctx[6][1]]
    			},
    			$$inline: true
    		});

    	segments1 = new Segments({
    			props: {
    				xStart: [/*limY*/ ctx[3][0]],
    				yStart: [/*xs*/ ctx[6][1]],
    				xEnd: [/*ys*/ ctx[7][1]],
    				yEnd: [/*xs*/ ctx[6][1]]
    			},
    			$$inline: true
    		});

    	lineseries1 = new LineSeries({
    			props: {
    				lineWidth: 2,
    				xValues: /*yi*/ ctx[9],
    				yValues: /*xi*/ ctx[8]
    			},
    			$$inline: true
    		});

    	scatterseries = new ScatterSeries({
    			props: {
    				xValues: [/*ys*/ ctx[7][1]],
    				yValues: [/*xs*/ ctx[6][1]],
    				faceColor: Colors.PRIMARY
    			},
    			$$inline: true
    		});

    	textlabels = new TextLabels({
    			props: {
    				xValues: [/*limY*/ ctx[3][0] + 0.1],
    				yValues: [/*xs*/ ctx[6][1]],
    				labels: /*xs*/ ctx[6][1].toFixed(1),
    				pos: 3,
    				faceColor: Colors.PRIMARY
    			},
    			$$inline: true
    		});

    	let if_block = /*mode*/ ctx[4] === "Interval" && create_if_block$1(ctx);

    	const block = {
    		c: function create() {
    			create_component(lineseries0.$$.fragment);
    			t0 = space();
    			create_component(segments0.$$.fragment);
    			t1 = space();
    			create_component(segments1.$$.fragment);
    			t2 = space();
    			create_component(lineseries1.$$.fragment);
    			t3 = space();
    			create_component(scatterseries.$$.fragment);
    			t4 = space();
    			create_component(textlabels.$$.fragment);
    			t5 = space();
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			mount_component(lineseries0, target, anchor);
    			insert_dev(target, t0, anchor);
    			mount_component(segments0, target, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(segments1, target, anchor);
    			insert_dev(target, t2, anchor);
    			mount_component(lineseries1, target, anchor);
    			insert_dev(target, t3, anchor);
    			mount_component(scatterseries, target, anchor);
    			insert_dev(target, t4, anchor);
    			mount_component(textlabels, target, anchor);
    			insert_dev(target, t5, anchor);
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const lineseries0_changes = {};
    			if (dirty & /*y*/ 2) lineseries0_changes.xValues = /*y*/ ctx[1];
    			if (dirty & /*x*/ 1) lineseries0_changes.yValues = /*x*/ ctx[0];
    			lineseries0.$set(lineseries0_changes);
    			const segments0_changes = {};
    			if (dirty & /*ys*/ 128) segments0_changes.xStart = [/*ys*/ ctx[7][1]];
    			if (dirty & /*limX*/ 4) segments0_changes.yStart = [/*limX*/ ctx[2][0]];
    			if (dirty & /*ys*/ 128) segments0_changes.xEnd = [/*ys*/ ctx[7][1]];
    			if (dirty & /*xs*/ 64) segments0_changes.yEnd = [/*xs*/ ctx[6][1]];
    			segments0.$set(segments0_changes);
    			const segments1_changes = {};
    			if (dirty & /*limY*/ 8) segments1_changes.xStart = [/*limY*/ ctx[3][0]];
    			if (dirty & /*xs*/ 64) segments1_changes.yStart = [/*xs*/ ctx[6][1]];
    			if (dirty & /*ys*/ 128) segments1_changes.xEnd = [/*ys*/ ctx[7][1]];
    			if (dirty & /*xs*/ 64) segments1_changes.yEnd = [/*xs*/ ctx[6][1]];
    			segments1.$set(segments1_changes);
    			const lineseries1_changes = {};
    			if (dirty & /*yi*/ 512) lineseries1_changes.xValues = /*yi*/ ctx[9];
    			if (dirty & /*xi*/ 256) lineseries1_changes.yValues = /*xi*/ ctx[8];
    			lineseries1.$set(lineseries1_changes);
    			const scatterseries_changes = {};
    			if (dirty & /*ys*/ 128) scatterseries_changes.xValues = [/*ys*/ ctx[7][1]];
    			if (dirty & /*xs*/ 64) scatterseries_changes.yValues = [/*xs*/ ctx[6][1]];
    			scatterseries.$set(scatterseries_changes);
    			const textlabels_changes = {};
    			if (dirty & /*limY*/ 8) textlabels_changes.xValues = [/*limY*/ ctx[3][0] + 0.1];
    			if (dirty & /*xs*/ 64) textlabels_changes.yValues = [/*xs*/ ctx[6][1]];
    			if (dirty & /*xs*/ 64) textlabels_changes.labels = /*xs*/ ctx[6][1].toFixed(1);
    			textlabels.$set(textlabels_changes);

    			if (/*mode*/ ctx[4] === "Interval") {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*mode*/ 16) {
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
    			transition_in(lineseries0.$$.fragment, local);
    			transition_in(segments0.$$.fragment, local);
    			transition_in(segments1.$$.fragment, local);
    			transition_in(lineseries1.$$.fragment, local);
    			transition_in(scatterseries.$$.fragment, local);
    			transition_in(textlabels.$$.fragment, local);
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(lineseries0.$$.fragment, local);
    			transition_out(segments0.$$.fragment, local);
    			transition_out(segments1.$$.fragment, local);
    			transition_out(lineseries1.$$.fragment, local);
    			transition_out(scatterseries.$$.fragment, local);
    			transition_out(textlabels.$$.fragment, local);
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(lineseries0, detaching);
    			if (detaching) detach_dev(t0);
    			destroy_component(segments0, detaching);
    			if (detaching) detach_dev(t1);
    			destroy_component(segments1, detaching);
    			if (detaching) detach_dev(t2);
    			destroy_component(lineseries1, detaching);
    			if (detaching) detach_dev(t3);
    			destroy_component(scatterseries, detaching);
    			if (detaching) detach_dev(t4);
    			destroy_component(textlabels, detaching);
    			if (detaching) detach_dev(t5);
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$1.name,
    		type: "slot",
    		source: "(25:0) <Axes title=\\\"Inverse CDF\\\" xLabel=\\\"Probability\\\" yLabel={varName} limX={limY} limY={limX} >",
    		ctx
    	});

    	return block;
    }

    // (27:3) 
    function create_xaxis_slot(ctx) {
    	let xaxis;
    	let current;

    	xaxis = new XAxis({
    			props: { slot: "xaxis", showGrid: true },
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
    		source: "(27:3) ",
    		ctx
    	});

    	return block;
    }

    // (28:3) 
    function create_yaxis_slot(ctx) {
    	let yaxis;
    	let current;

    	yaxis = new YAxis({
    			props: { slot: "yaxis", showGrid: true },
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
    		source: "(28:3) ",
    		ctx
    	});

    	return block;
    }

    // (29:3) 
    function create_box_slot(ctx) {
    	let box;
    	let current;
    	box = new Box({ props: { slot: "box" }, $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(box.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(box, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(box.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(box.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(box, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_box_slot.name,
    		type: "slot",
    		source: "(29:3) ",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let axes;
    	let current;

    	axes = new Axes({
    			props: {
    				title: "Inverse CDF",
    				xLabel: "Probability",
    				yLabel: /*varName*/ ctx[5],
    				limX: /*limY*/ ctx[3],
    				limY: /*limX*/ ctx[2],
    				$$slots: {
    					box: [create_box_slot],
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
    			if (dirty & /*varName*/ 32) axes_changes.yLabel = /*varName*/ ctx[5];
    			if (dirty & /*limY*/ 8) axes_changes.limX = /*limY*/ ctx[3];
    			if (dirty & /*limX*/ 4) axes_changes.limY = /*limX*/ ctx[2];

    			if (dirty & /*$$scope, limY, xs, pos, ys, yi, xi, limX, mode, y, x*/ 6111) {
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
    	let xs;
    	let ys;
    	let xi;
    	let yi;
    	let pos;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("ICDFPlot", slots, []);
    	let { x } = $$props;
    	let { y } = $$props;
    	let { limX } = $$props;
    	let { limY } = $$props;
    	let { mode } = $$props;
    	let { intInd } = $$props;
    	let { varName } = $$props;
    	const writable_props = ["x", "y", "limX", "limY", "mode", "intInd", "varName"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<ICDFPlot> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("x" in $$props) $$invalidate(0, x = $$props.x);
    		if ("y" in $$props) $$invalidate(1, y = $$props.y);
    		if ("limX" in $$props) $$invalidate(2, limX = $$props.limX);
    		if ("limY" in $$props) $$invalidate(3, limY = $$props.limY);
    		if ("mode" in $$props) $$invalidate(4, mode = $$props.mode);
    		if ("intInd" in $$props) $$invalidate(11, intInd = $$props.intInd);
    		if ("varName" in $$props) $$invalidate(5, varName = $$props.varName);
    	};

    	$$self.$capture_state = () => ({
    		Axes,
    		XAxis,
    		YAxis,
    		Box,
    		Segments,
    		ScatterSeries,
    		Colors,
    		TextLabels,
    		LineSeries,
    		x,
    		y,
    		limX,
    		limY,
    		mode,
    		intInd,
    		varName,
    		xs,
    		ys,
    		xi,
    		yi,
    		pos
    	});

    	$$self.$inject_state = $$props => {
    		if ("x" in $$props) $$invalidate(0, x = $$props.x);
    		if ("y" in $$props) $$invalidate(1, y = $$props.y);
    		if ("limX" in $$props) $$invalidate(2, limX = $$props.limX);
    		if ("limY" in $$props) $$invalidate(3, limY = $$props.limY);
    		if ("mode" in $$props) $$invalidate(4, mode = $$props.mode);
    		if ("intInd" in $$props) $$invalidate(11, intInd = $$props.intInd);
    		if ("varName" in $$props) $$invalidate(5, varName = $$props.varName);
    		if ("xs" in $$props) $$invalidate(6, xs = $$props.xs);
    		if ("ys" in $$props) $$invalidate(7, ys = $$props.ys);
    		if ("xi" in $$props) $$invalidate(8, xi = $$props.xi);
    		if ("yi" in $$props) $$invalidate(9, yi = $$props.yi);
    		if ("pos" in $$props) $$invalidate(10, pos = $$props.pos);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*x, intInd*/ 2049) {
    			// coordinates of end points of the interval
    			$$invalidate(6, xs = [x[intInd[0]], x[intInd[1]]]);
    		}

    		if ($$self.$$.dirty & /*y, intInd*/ 2050) {
    			$$invalidate(7, ys = [y[intInd[0]], y[intInd[1]]]);
    		}

    		if ($$self.$$.dirty & /*x, intInd*/ 2049) {
    			// coordinates of points between the end points
    			$$invalidate(8, xi = x.filter((v, i) => i >= intInd[0] & i <= intInd[1]));
    		}

    		if ($$self.$$.dirty & /*y, intInd*/ 2050) {
    			$$invalidate(9, yi = y.filter((v, i) => i >= intInd[0] & i <= intInd[1]));
    		}

    		if ($$self.$$.dirty & /*xs, limX*/ 68) {
    			// position of label for p1
    			$$invalidate(10, pos = xs[0] < limX[0] + 15 ? 3 : 1);
    		}
    	};

    	return [x, y, limX, limY, mode, varName, xs, ys, xi, yi, pos, intInd];
    }

    class ICDFPlot extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {
    			x: 0,
    			y: 1,
    			limX: 2,
    			limY: 3,
    			mode: 4,
    			intInd: 11,
    			varName: 5
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ICDFPlot",
    			options,
    			id: create_fragment$1.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*x*/ ctx[0] === undefined && !("x" in props)) {
    			console.warn("<ICDFPlot> was created without expected prop 'x'");
    		}

    		if (/*y*/ ctx[1] === undefined && !("y" in props)) {
    			console.warn("<ICDFPlot> was created without expected prop 'y'");
    		}

    		if (/*limX*/ ctx[2] === undefined && !("limX" in props)) {
    			console.warn("<ICDFPlot> was created without expected prop 'limX'");
    		}

    		if (/*limY*/ ctx[3] === undefined && !("limY" in props)) {
    			console.warn("<ICDFPlot> was created without expected prop 'limY'");
    		}

    		if (/*mode*/ ctx[4] === undefined && !("mode" in props)) {
    			console.warn("<ICDFPlot> was created without expected prop 'mode'");
    		}

    		if (/*intInd*/ ctx[11] === undefined && !("intInd" in props)) {
    			console.warn("<ICDFPlot> was created without expected prop 'intInd'");
    		}

    		if (/*varName*/ ctx[5] === undefined && !("varName" in props)) {
    			console.warn("<ICDFPlot> was created without expected prop 'varName'");
    		}
    	}

    	get x() {
    		throw new Error("<ICDFPlot>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set x(value) {
    		throw new Error("<ICDFPlot>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get y() {
    		throw new Error("<ICDFPlot>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set y(value) {
    		throw new Error("<ICDFPlot>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get limX() {
    		throw new Error("<ICDFPlot>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set limX(value) {
    		throw new Error("<ICDFPlot>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get limY() {
    		throw new Error("<ICDFPlot>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set limY(value) {
    		throw new Error("<ICDFPlot>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get mode() {
    		throw new Error("<ICDFPlot>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set mode(value) {
    		throw new Error("<ICDFPlot>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get intInd() {
    		throw new Error("<ICDFPlot>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set intInd(value) {
    		throw new Error("<ICDFPlot>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get varName() {
    		throw new Error("<ICDFPlot>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set varName(value) {
    		throw new Error("<ICDFPlot>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/App.svelte generated by Svelte v3.38.2 */

    const { Object: Object_1 } = globals;
    const file = "src/App.svelte";

    // (95:12) <AppControlArea>
    function create_default_slot_3(ctx) {
    	let appcontrolswitch;
    	let updating_value;
    	let t0;
    	let appcontrolrange0;
    	let updating_value_1;
    	let t1;
    	let appcontrolrange1;
    	let updating_value_2;
    	let current;

    	function appcontrolswitch_value_binding(value) {
    		/*appcontrolswitch_value_binding*/ ctx[13](value);
    	}

    	let appcontrolswitch_props = {
    		id: "distributionName",
    		label: "Distribution",
    		options: Object.keys(/*distrs*/ ctx[12])
    	};

    	if (/*selectedName*/ ctx[5] !== void 0) {
    		appcontrolswitch_props.value = /*selectedName*/ ctx[5];
    	}

    	appcontrolswitch = new AppControlSwitch({
    			props: appcontrolswitch_props,
    			$$inline: true
    		});

    	binding_callbacks.push(() => bind(appcontrolswitch, "value", appcontrolswitch_value_binding));

    	function appcontrolrange0_value_binding(value) {
    		/*appcontrolrange0_value_binding*/ ctx[14](value);
    	}

    	let appcontrolrange0_props = {
    		id: "param1",
    		label: /*distr*/ ctx[8].paramLabels[0],
    		min: /*distr*/ ctx[8].paramLimits[0][0],
    		max: /*distr*/ ctx[8].paramLimits[0][1]
    	};

    	if (/*distr*/ ctx[8].params[0] !== void 0) {
    		appcontrolrange0_props.value = /*distr*/ ctx[8].params[0];
    	}

    	appcontrolrange0 = new AppControlRange({
    			props: appcontrolrange0_props,
    			$$inline: true
    		});

    	binding_callbacks.push(() => bind(appcontrolrange0, "value", appcontrolrange0_value_binding));

    	function appcontrolrange1_value_binding(value) {
    		/*appcontrolrange1_value_binding*/ ctx[15](value);
    	}

    	let appcontrolrange1_props = {
    		id: "param2",
    		label: /*distr*/ ctx[8].paramLabels[1],
    		min: /*distr*/ ctx[8].paramLimits[1][0],
    		max: /*distr*/ ctx[8].paramLimits[1][1]
    	};

    	if (/*distr*/ ctx[8].params[1] !== void 0) {
    		appcontrolrange1_props.value = /*distr*/ ctx[8].params[1];
    	}

    	appcontrolrange1 = new AppControlRange({
    			props: appcontrolrange1_props,
    			$$inline: true
    		});

    	binding_callbacks.push(() => bind(appcontrolrange1, "value", appcontrolrange1_value_binding));

    	const block = {
    		c: function create() {
    			create_component(appcontrolswitch.$$.fragment);
    			t0 = space();
    			create_component(appcontrolrange0.$$.fragment);
    			t1 = space();
    			create_component(appcontrolrange1.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(appcontrolswitch, target, anchor);
    			insert_dev(target, t0, anchor);
    			mount_component(appcontrolrange0, target, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(appcontrolrange1, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const appcontrolswitch_changes = {};

    			if (!updating_value && dirty & /*selectedName*/ 32) {
    				updating_value = true;
    				appcontrolswitch_changes.value = /*selectedName*/ ctx[5];
    				add_flush_callback(() => updating_value = false);
    			}

    			appcontrolswitch.$set(appcontrolswitch_changes);
    			const appcontrolrange0_changes = {};
    			if (dirty & /*distr*/ 256) appcontrolrange0_changes.label = /*distr*/ ctx[8].paramLabels[0];
    			if (dirty & /*distr*/ 256) appcontrolrange0_changes.min = /*distr*/ ctx[8].paramLimits[0][0];
    			if (dirty & /*distr*/ 256) appcontrolrange0_changes.max = /*distr*/ ctx[8].paramLimits[0][1];

    			if (!updating_value_1 && dirty & /*distr*/ 256) {
    				updating_value_1 = true;
    				appcontrolrange0_changes.value = /*distr*/ ctx[8].params[0];
    				add_flush_callback(() => updating_value_1 = false);
    			}

    			appcontrolrange0.$set(appcontrolrange0_changes);
    			const appcontrolrange1_changes = {};
    			if (dirty & /*distr*/ 256) appcontrolrange1_changes.label = /*distr*/ ctx[8].paramLabels[1];
    			if (dirty & /*distr*/ 256) appcontrolrange1_changes.min = /*distr*/ ctx[8].paramLimits[1][0];
    			if (dirty & /*distr*/ 256) appcontrolrange1_changes.max = /*distr*/ ctx[8].paramLimits[1][1];

    			if (!updating_value_2 && dirty & /*distr*/ 256) {
    				updating_value_2 = true;
    				appcontrolrange1_changes.value = /*distr*/ ctx[8].params[1];
    				add_flush_callback(() => updating_value_2 = false);
    			}

    			appcontrolrange1.$set(appcontrolrange1_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(appcontrolswitch.$$.fragment, local);
    			transition_in(appcontrolrange0.$$.fragment, local);
    			transition_in(appcontrolrange1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(appcontrolswitch.$$.fragment, local);
    			transition_out(appcontrolrange0.$$.fragment, local);
    			transition_out(appcontrolrange1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(appcontrolswitch, detaching);
    			if (detaching) detach_dev(t0);
    			destroy_component(appcontrolrange0, detaching);
    			if (detaching) detach_dev(t1);
    			destroy_component(appcontrolrange1, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_3.name,
    		type: "slot",
    		source: "(95:12) <AppControlArea>",
    		ctx
    	});

    	return block;
    }

    // (125:15) {:else}
    function create_else_block_1(ctx) {
    	let appcontrol;
    	let current;

    	appcontrol = new AppControl({
    			props: { id: "empty", label: " " },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(appcontrol.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(appcontrol, target, anchor);
    			current = true;
    		},
    		p: noop,
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
    		id: create_else_block_1.name,
    		type: "else",
    		source: "(125:15) {:else}",
    		ctx
    	});

    	return block;
    }

    // (123:15) {#if mode === "Interval"}
    function create_if_block_1(ctx) {
    	let appcontrolrange;
    	let updating_value;
    	let current;

    	function appcontrolrange_value_binding(value) {
    		/*appcontrolrange_value_binding*/ ctx[16](value);
    	}

    	let appcontrolrange_props = {
    		id: "a",
    		label: "x<sub>1</sub>",
    		step: 0.5,
    		min: /*limX*/ ctx[11][0],
    		max: /*limX*/ ctx[11][1]
    	};

    	if (/*x1*/ ctx[1] !== void 0) {
    		appcontrolrange_props.value = /*x1*/ ctx[1];
    	}

    	appcontrolrange = new AppControlRange({
    			props: appcontrolrange_props,
    			$$inline: true
    		});

    	binding_callbacks.push(() => bind(appcontrolrange, "value", appcontrolrange_value_binding));

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

    			if (!updating_value && dirty & /*x1*/ 2) {
    				updating_value = true;
    				appcontrolrange_changes.value = /*x1*/ ctx[1];
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
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(123:15) {#if mode === \\\"Interval\\\"}",
    		ctx
    	});

    	return block;
    }

    // (122:12) <AppControlArea>
    function create_default_slot_2(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let t0;
    	let appcontrolrange;
    	let updating_value;
    	let t1;
    	let appcontrolswitch;
    	let updating_value_1;
    	let current;
    	const if_block_creators = [create_if_block_1, create_else_block_1];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*mode*/ ctx[0] === "Interval") return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	function appcontrolrange_value_binding_1(value) {
    		/*appcontrolrange_value_binding_1*/ ctx[17](value);
    	}

    	let appcontrolrange_props = {
    		id: "b",
    		label: "x<sub>2</sub>",
    		step: 0.5,
    		min: /*limX*/ ctx[11][0],
    		max: /*limX*/ ctx[11][1]
    	};

    	if (/*x2*/ ctx[2] !== void 0) {
    		appcontrolrange_props.value = /*x2*/ ctx[2];
    	}

    	appcontrolrange = new AppControlRange({
    			props: appcontrolrange_props,
    			$$inline: true
    		});

    	binding_callbacks.push(() => bind(appcontrolrange, "value", appcontrolrange_value_binding_1));

    	function appcontrolswitch_value_binding_1(value) {
    		/*appcontrolswitch_value_binding_1*/ ctx[18](value);
    	}

    	let appcontrolswitch_props = {
    		id: "mode",
    		label: "Mode",
    		options: ["Value", "Interval"]
    	};

    	if (/*mode*/ ctx[0] !== void 0) {
    		appcontrolswitch_props.value = /*mode*/ ctx[0];
    	}

    	appcontrolswitch = new AppControlSwitch({
    			props: appcontrolswitch_props,
    			$$inline: true
    		});

    	binding_callbacks.push(() => bind(appcontrolswitch, "value", appcontrolswitch_value_binding_1));

    	const block = {
    		c: function create() {
    			if_block.c();
    			t0 = space();
    			create_component(appcontrolrange.$$.fragment);
    			t1 = space();
    			create_component(appcontrolswitch.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, t0, anchor);
    			mount_component(appcontrolrange, target, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(appcontrolswitch, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
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
    				if_block.m(t0.parentNode, t0);
    			}

    			const appcontrolrange_changes = {};

    			if (!updating_value && dirty & /*x2*/ 4) {
    				updating_value = true;
    				appcontrolrange_changes.value = /*x2*/ ctx[2];
    				add_flush_callback(() => updating_value = false);
    			}

    			appcontrolrange.$set(appcontrolrange_changes);
    			const appcontrolswitch_changes = {};

    			if (!updating_value_1 && dirty & /*mode*/ 1) {
    				updating_value_1 = true;
    				appcontrolswitch_changes.value = /*mode*/ ctx[0];
    				add_flush_callback(() => updating_value_1 = false);
    			}

    			appcontrolswitch.$set(appcontrolswitch_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			transition_in(appcontrolrange.$$.fragment, local);
    			transition_in(appcontrolswitch.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			transition_out(appcontrolrange.$$.fragment, local);
    			transition_out(appcontrolswitch.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(t0);
    			destroy_component(appcontrolrange, detaching);
    			if (detaching) detach_dev(t1);
    			destroy_component(appcontrolswitch, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_2.name,
    		type: "slot",
    		source: "(122:12) <AppControlArea>",
    		ctx
    	});

    	return block;
    }

    // (144:15) {:else}
    function create_else_block(ctx) {
    	let appcontrol;
    	let current;

    	appcontrol = new AppControl({
    			props: { id: "empty", label: " " },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(appcontrol.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(appcontrol, target, anchor);
    			current = true;
    		},
    		p: noop,
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
    		id: create_else_block.name,
    		type: "else",
    		source: "(144:15) {:else}",
    		ctx
    	});

    	return block;
    }

    // (142:15) {#if mode === "Interval"}
    function create_if_block(ctx) {
    	let appcontrolrange;
    	let updating_value;
    	let current;

    	function appcontrolrange_value_binding_2(value) {
    		/*appcontrolrange_value_binding_2*/ ctx[19](value);
    	}

    	let appcontrolrange_props = {
    		id: "pa",
    		label: "p<sub>1</sub>",
    		step: 0.005,
    		min: 0,
    		max: 1,
    		decNum: 3
    	};

    	if (/*p1*/ ctx[3] !== void 0) {
    		appcontrolrange_props.value = /*p1*/ ctx[3];
    	}

    	appcontrolrange = new AppControlRange({
    			props: appcontrolrange_props,
    			$$inline: true
    		});

    	binding_callbacks.push(() => bind(appcontrolrange, "value", appcontrolrange_value_binding_2));

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

    			if (!updating_value && dirty & /*p1*/ 8) {
    				updating_value = true;
    				appcontrolrange_changes.value = /*p1*/ ctx[3];
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
    		id: create_if_block.name,
    		type: "if",
    		source: "(142:15) {#if mode === \\\"Interval\\\"}",
    		ctx
    	});

    	return block;
    }

    // (141:12) <AppControlArea>
    function create_default_slot_1(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let t0;
    	let appcontrolrange;
    	let updating_value;
    	let t1;
    	let appcontrolswitch;
    	let updating_value_1;
    	let current;
    	const if_block_creators = [create_if_block, create_else_block];
    	const if_blocks = [];

    	function select_block_type_1(ctx, dirty) {
    		if (/*mode*/ ctx[0] === "Interval") return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type_1(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	function appcontrolrange_value_binding_3(value) {
    		/*appcontrolrange_value_binding_3*/ ctx[20](value);
    	}

    	let appcontrolrange_props = {
    		id: "pb",
    		label: "p<sub>2</sub>",
    		step: 0.005,
    		min: 0,
    		max: 1,
    		decNum: 3
    	};

    	if (/*p2*/ ctx[4] !== void 0) {
    		appcontrolrange_props.value = /*p2*/ ctx[4];
    	}

    	appcontrolrange = new AppControlRange({
    			props: appcontrolrange_props,
    			$$inline: true
    		});

    	binding_callbacks.push(() => bind(appcontrolrange, "value", appcontrolrange_value_binding_3));

    	function appcontrolswitch_value_binding_2(value) {
    		/*appcontrolswitch_value_binding_2*/ ctx[21](value);
    	}

    	let appcontrolswitch_props = {
    		id: "mode",
    		label: "Mode",
    		options: ["Value", "Interval"]
    	};

    	if (/*mode*/ ctx[0] !== void 0) {
    		appcontrolswitch_props.value = /*mode*/ ctx[0];
    	}

    	appcontrolswitch = new AppControlSwitch({
    			props: appcontrolswitch_props,
    			$$inline: true
    		});

    	binding_callbacks.push(() => bind(appcontrolswitch, "value", appcontrolswitch_value_binding_2));

    	const block = {
    		c: function create() {
    			if_block.c();
    			t0 = space();
    			create_component(appcontrolrange.$$.fragment);
    			t1 = space();
    			create_component(appcontrolswitch.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, t0, anchor);
    			mount_component(appcontrolrange, target, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(appcontrolswitch, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type_1(ctx);

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
    				if_block.m(t0.parentNode, t0);
    			}

    			const appcontrolrange_changes = {};

    			if (!updating_value && dirty & /*p2*/ 16) {
    				updating_value = true;
    				appcontrolrange_changes.value = /*p2*/ ctx[4];
    				add_flush_callback(() => updating_value = false);
    			}

    			appcontrolrange.$set(appcontrolrange_changes);
    			const appcontrolswitch_changes = {};

    			if (!updating_value_1 && dirty & /*mode*/ 1) {
    				updating_value_1 = true;
    				appcontrolswitch_changes.value = /*mode*/ ctx[0];
    				add_flush_callback(() => updating_value_1 = false);
    			}

    			appcontrolswitch.$set(appcontrolswitch_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			transition_in(appcontrolrange.$$.fragment, local);
    			transition_in(appcontrolswitch.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			transition_out(appcontrolrange.$$.fragment, local);
    			transition_out(appcontrolswitch.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(t0);
    			destroy_component(appcontrolrange, detaching);
    			if (detaching) detach_dev(t1);
    			destroy_component(appcontrolswitch, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1.name,
    		type: "slot",
    		source: "(141:12) <AppControlArea>",
    		ctx
    	});

    	return block;
    }

    // (90:0) <StatApp>
    function create_default_slot(ctx) {
    	let div6;
    	let div1;
    	let pdfplot;
    	let t0;
    	let div0;
    	let appcontrolarea0;
    	let t1;
    	let div3;
    	let cdfplot;
    	let t2;
    	let div2;
    	let appcontrolarea1;
    	let t3;
    	let div5;
    	let icdfplot;
    	let t4;
    	let div4;
    	let appcontrolarea2;
    	let current;

    	pdfplot = new PDFPlot({
    			props: {
    				x: /*x*/ ctx[7],
    				y: /*d*/ ctx[10],
    				varName,
    				intInd: /*intInd*/ ctx[9],
    				p: /*p*/ ctx[6][/*intInd*/ ctx[9][1]] - /*p*/ ctx[6][/*intInd*/ ctx[9][0]],
    				limX: /*limX*/ ctx[11],
    				limY: /*distr*/ ctx[8].limY
    			},
    			$$inline: true
    		});

    	appcontrolarea0 = new AppControlArea({
    			props: {
    				$$slots: { default: [create_default_slot_3] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	cdfplot = new CDFPlot({
    			props: {
    				x: /*x*/ ctx[7],
    				y: /*p*/ ctx[6],
    				varName,
    				mode: /*mode*/ ctx[0],
    				intInd: /*intInd*/ ctx[9],
    				limX: /*limX*/ ctx[11],
    				limY: [-0.05, 1.05]
    			},
    			$$inline: true
    		});

    	appcontrolarea1 = new AppControlArea({
    			props: {
    				$$slots: { default: [create_default_slot_2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	icdfplot = new ICDFPlot({
    			props: {
    				x: /*x*/ ctx[7],
    				y: /*p*/ ctx[6],
    				varName,
    				mode: /*mode*/ ctx[0],
    				intInd: /*intInd*/ ctx[9],
    				limX: /*limX*/ ctx[11],
    				limY: [-0.05, 1.05]
    			},
    			$$inline: true
    		});

    	appcontrolarea2 = new AppControlArea({
    			props: {
    				$$slots: { default: [create_default_slot_1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div6 = element("div");
    			div1 = element("div");
    			create_component(pdfplot.$$.fragment);
    			t0 = space();
    			div0 = element("div");
    			create_component(appcontrolarea0.$$.fragment);
    			t1 = space();
    			div3 = element("div");
    			create_component(cdfplot.$$.fragment);
    			t2 = space();
    			div2 = element("div");
    			create_component(appcontrolarea1.$$.fragment);
    			t3 = space();
    			div5 = element("div");
    			create_component(icdfplot.$$.fragment);
    			t4 = space();
    			div4 = element("div");
    			create_component(appcontrolarea2.$$.fragment);
    			attr_dev(div0, "class", "app-control-area svelte-ycups1");
    			add_location(div0, file, 93, 9, 2530);
    			attr_dev(div1, "class", "app-layout-column pdf-area svelte-ycups1");
    			add_location(div1, file, 91, 6, 2366);
    			attr_dev(div2, "class", "app-control-area svelte-ycups1");
    			add_location(div2, file, 120, 9, 3559);
    			attr_dev(div3, "class", "app-layout-column cdf-area svelte-ycups1");
    			add_location(div3, file, 118, 6, 3417);
    			attr_dev(div4, "class", "app-control-area svelte-ycups1");
    			add_location(div4, file, 139, 9, 4414);
    			attr_dev(div5, "class", "app-layout-column icdf-area svelte-ycups1");
    			add_location(div5, file, 137, 6, 4270);
    			attr_dev(div6, "class", "app-layout svelte-ycups1");
    			add_location(div6, file, 90, 3, 2335);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div6, anchor);
    			append_dev(div6, div1);
    			mount_component(pdfplot, div1, null);
    			append_dev(div1, t0);
    			append_dev(div1, div0);
    			mount_component(appcontrolarea0, div0, null);
    			append_dev(div6, t1);
    			append_dev(div6, div3);
    			mount_component(cdfplot, div3, null);
    			append_dev(div3, t2);
    			append_dev(div3, div2);
    			mount_component(appcontrolarea1, div2, null);
    			append_dev(div6, t3);
    			append_dev(div6, div5);
    			mount_component(icdfplot, div5, null);
    			append_dev(div5, t4);
    			append_dev(div5, div4);
    			mount_component(appcontrolarea2, div4, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const pdfplot_changes = {};
    			if (dirty & /*x*/ 128) pdfplot_changes.x = /*x*/ ctx[7];
    			if (dirty & /*d*/ 1024) pdfplot_changes.y = /*d*/ ctx[10];
    			if (dirty & /*intInd*/ 512) pdfplot_changes.intInd = /*intInd*/ ctx[9];
    			if (dirty & /*p, intInd*/ 576) pdfplot_changes.p = /*p*/ ctx[6][/*intInd*/ ctx[9][1]] - /*p*/ ctx[6][/*intInd*/ ctx[9][0]];
    			if (dirty & /*distr*/ 256) pdfplot_changes.limY = /*distr*/ ctx[8].limY;
    			pdfplot.$set(pdfplot_changes);
    			const appcontrolarea0_changes = {};

    			if (dirty & /*$$scope, distr, selectedName*/ 16777504) {
    				appcontrolarea0_changes.$$scope = { dirty, ctx };
    			}

    			appcontrolarea0.$set(appcontrolarea0_changes);
    			const cdfplot_changes = {};
    			if (dirty & /*x*/ 128) cdfplot_changes.x = /*x*/ ctx[7];
    			if (dirty & /*p*/ 64) cdfplot_changes.y = /*p*/ ctx[6];
    			if (dirty & /*mode*/ 1) cdfplot_changes.mode = /*mode*/ ctx[0];
    			if (dirty & /*intInd*/ 512) cdfplot_changes.intInd = /*intInd*/ ctx[9];
    			cdfplot.$set(cdfplot_changes);
    			const appcontrolarea1_changes = {};

    			if (dirty & /*$$scope, mode, x2, x1*/ 16777223) {
    				appcontrolarea1_changes.$$scope = { dirty, ctx };
    			}

    			appcontrolarea1.$set(appcontrolarea1_changes);
    			const icdfplot_changes = {};
    			if (dirty & /*x*/ 128) icdfplot_changes.x = /*x*/ ctx[7];
    			if (dirty & /*p*/ 64) icdfplot_changes.y = /*p*/ ctx[6];
    			if (dirty & /*mode*/ 1) icdfplot_changes.mode = /*mode*/ ctx[0];
    			if (dirty & /*intInd*/ 512) icdfplot_changes.intInd = /*intInd*/ ctx[9];
    			icdfplot.$set(icdfplot_changes);
    			const appcontrolarea2_changes = {};

    			if (dirty & /*$$scope, mode, p2, p1*/ 16777241) {
    				appcontrolarea2_changes.$$scope = { dirty, ctx };
    			}

    			appcontrolarea2.$set(appcontrolarea2_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(pdfplot.$$.fragment, local);
    			transition_in(appcontrolarea0.$$.fragment, local);
    			transition_in(cdfplot.$$.fragment, local);
    			transition_in(appcontrolarea1.$$.fragment, local);
    			transition_in(icdfplot.$$.fragment, local);
    			transition_in(appcontrolarea2.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(pdfplot.$$.fragment, local);
    			transition_out(appcontrolarea0.$$.fragment, local);
    			transition_out(cdfplot.$$.fragment, local);
    			transition_out(appcontrolarea1.$$.fragment, local);
    			transition_out(icdfplot.$$.fragment, local);
    			transition_out(appcontrolarea2.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div6);
    			destroy_component(pdfplot);
    			destroy_component(appcontrolarea0);
    			destroy_component(cdfplot);
    			destroy_component(appcontrolarea1);
    			destroy_component(icdfplot);
    			destroy_component(appcontrolarea2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(90:0) <StatApp>",
    		ctx
    	});

    	return block;
    }

    // (159:3) 
    function create_help_slot(ctx) {
    	let div;
    	let h2;
    	let t1;
    	let p0;
    	let t2;
    	let em0;
    	let t4;
    	let em1;
    	let t6;
    	let em2;
    	let t8;
    	let em3;
    	let t10;
    	let t11;
    	let p1_1;
    	let t13;
    	let p2_1;
    	let t14;
    	let em4;
    	let sub0;
    	let t17;
    	let em5;
    	let sub1;
    	let t20;

    	const block = {
    		c: function create() {
    			div = element("div");
    			h2 = element("h2");
    			h2.textContent = "PDF, CDF, and ICDF";
    			t1 = space();
    			p0 = element("p");
    			t2 = text("This app lets you play with three main functions available for any theoretical distribution: ");
    			em0 = element("em");
    			em0.textContent = "Probability Density Function";
    			t4 = text(" (PDF), ");
    			em1 = element("em");
    			em1.textContent = "Cumulative Distribution Function";
    			t6 = text(" (CDF) and ");
    			em2 = element("em");
    			em2.textContent = "Inverse Cumulative Distribution Function";
    			t8 = text(" (ICDF).\n         The functions can be used for different purposes. Thus PDF shows a shape of distribution in form of a density of the values, the higher density — the bigger chance that your random value will be there. For example, in case of normal distribution, the higest density is around ");
    			em3 = element("em");
    			em3.textContent = "mean";
    			t10 = text(", so mean is the most expected value in this case.");
    			t11 = space();
    			p1_1 = element("p");
    			p1_1.textContent = "CDF function gives you a chance to get a value smaller than given. While the ICDF does the opposite — gives you a value for a given probability. The functions in this app can be used in \"Value\" mode, for a single value, as well as in \"Interval\" mode for an interval limited by two values.";
    			t13 = space();
    			p2_1 = element("p");
    			t14 = text("For example, we are talking about height of people, normally distributed with mean = 170 cm and std = 10 cm (initial settings of the app). What is a chance that a random person from this population will have height between 160 and 180 cm? Or, in other words, how many people in percent have height between these two values in the population? Just set ");
    			em4 = element("em");
    			em4.textContent = "x";
    			sub0 = element("sub");
    			sub0.textContent = "1";
    			t17 = text(" to 160 and ");
    			em5 = element("em");
    			em5.textContent = "x";
    			sub1 = element("sub");
    			sub1.textContent = "2";
    			t20 = text(" to 180 under the CDF plot and you will see the result (in this case the chance is around 0.683 or 68.3%).");
    			add_location(h2, file, 159, 6, 5161);
    			add_location(em0, file, 162, 102, 5302);
    			add_location(em1, file, 162, 147, 5347);
    			add_location(em2, file, 162, 199, 5399);
    			add_location(em3, file, 163, 285, 5742);
    			add_location(p0, file, 161, 6, 5196);
    			add_location(p1_1, file, 166, 6, 5824);
    			add_location(em4, file, 170, 360, 6513);
    			add_location(sub0, file, 170, 370, 6523);
    			add_location(em5, file, 170, 394, 6547);
    			add_location(sub1, file, 170, 404, 6557);
    			add_location(p2_1, file, 169, 9, 6149);
    			attr_dev(div, "slot", "help");
    			add_location(div, file, 158, 3, 5137);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, h2);
    			append_dev(div, t1);
    			append_dev(div, p0);
    			append_dev(p0, t2);
    			append_dev(p0, em0);
    			append_dev(p0, t4);
    			append_dev(p0, em1);
    			append_dev(p0, t6);
    			append_dev(p0, em2);
    			append_dev(p0, t8);
    			append_dev(p0, em3);
    			append_dev(p0, t10);
    			append_dev(div, t11);
    			append_dev(div, p1_1);
    			append_dev(div, t13);
    			append_dev(div, p2_1);
    			append_dev(p2_1, t14);
    			append_dev(p2_1, em4);
    			append_dev(p2_1, sub0);
    			append_dev(p2_1, t17);
    			append_dev(p2_1, em5);
    			append_dev(p2_1, sub1);
    			append_dev(p2_1, t20);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_help_slot.name,
    		type: "slot",
    		source: "(159:3) ",
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

    			if (dirty & /*$$scope, mode, p2, p1, x, p, intInd, x2, x1, distr, selectedName, d*/ 16779263) {
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

    const size = 1301;
    const varName = "Height, cm";

    function instance($$self, $$props, $$invalidate) {
    	let distr;
    	let x;
    	let d;
    	let p;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);
    	const limX = [100, 230];
    	let mode = "Value";

    	let distrs = {
    		"Normal": {
    			params: [170, 10],
    			paramLabels: ["Mean", "Std"],
    			paramLimits: [[160, 180], [5, 15]],
    			pdf: dnorm,
    			cdf: pnorm,
    			limY: [-0.001, 0.06]
    		},
    		"Uniform": {
    			params: [135, 205],
    			paramLabels: ["Min", "Max"],
    			paramLimits: [[120, 150], [180, 220]],
    			pdf: dunif,
    			cdf: punif,
    			limY: [-0.001, 0.04]
    		}
    	};

    	let intInd = [0, Math.round(size / 2) + 1];

    	function changeValues(x, a, b, mode) {
    		if (mode === "Value") {
    			$$invalidate(9, intInd = [0, closestIndex(x, b)]);
    			$$invalidate(1, x1 = x[0]);
    		} else {
    			a = a > b ? b : a;
    			$$invalidate(1, x1 = a);
    			$$invalidate(9, intInd = [closestIndex(x, a), closestIndex(x, b)]);
    		}

    		$$invalidate(3, p1 = p[intInd[0]]);
    		$$invalidate(4, p2 = p[intInd[1]]);
    	}

    	function changeProbabilities(p, pa, pb, mode) {
    		if (mode === "Value") {
    			$$invalidate(9, intInd = [0, closestIndex(p, pb)]);
    			$$invalidate(3, p1 = p[0]);
    		} else {
    			pa = pa > pb ? pb : pa;
    			$$invalidate(3, p1 = pa);
    			$$invalidate(9, intInd = [closestIndex(p, pa), closestIndex(p, pb)]);
    		}

    		$$invalidate(1, x1 = x[intInd[0]]);
    		$$invalidate(2, x2 = x[intInd[1]]);
    	}

    	let x1 = 100;
    	let x2 = 170;
    	let p1 = 0;
    	let p2 = 0.5;
    	let selectedName = "Normal";
    	const writable_props = [];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	function appcontrolswitch_value_binding(value) {
    		selectedName = value;
    		$$invalidate(5, selectedName);
    	}

    	function appcontrolrange0_value_binding(value) {
    		if ($$self.$$.not_equal(distr.params[0], value)) {
    			distr.params[0] = value;
    			(($$invalidate(8, distr), $$invalidate(12, distrs)), $$invalidate(5, selectedName));
    		}
    	}

    	function appcontrolrange1_value_binding(value) {
    		if ($$self.$$.not_equal(distr.params[1], value)) {
    			distr.params[1] = value;
    			(($$invalidate(8, distr), $$invalidate(12, distrs)), $$invalidate(5, selectedName));
    		}
    	}

    	function appcontrolrange_value_binding(value) {
    		x1 = value;
    		$$invalidate(1, x1);
    	}

    	function appcontrolrange_value_binding_1(value) {
    		x2 = value;
    		$$invalidate(2, x2);
    	}

    	function appcontrolswitch_value_binding_1(value) {
    		mode = value;
    		$$invalidate(0, mode);
    	}

    	function appcontrolrange_value_binding_2(value) {
    		p1 = value;
    		$$invalidate(3, p1);
    	}

    	function appcontrolrange_value_binding_3(value) {
    		p2 = value;
    		$$invalidate(4, p2);
    	}

    	function appcontrolswitch_value_binding_2(value) {
    		mode = value;
    		$$invalidate(0, mode);
    	}

    	$$self.$capture_state = () => ({
    		seq,
    		dnorm,
    		dunif,
    		pnorm,
    		punif,
    		closestIndex,
    		StatApp,
    		AppControlArea,
    		AppControlSwitch,
    		AppControlRange,
    		AppControl,
    		PDFPlot,
    		CDFPlot,
    		ICDFPlot,
    		size,
    		limX,
    		varName,
    		mode,
    		distrs,
    		intInd,
    		changeValues,
    		changeProbabilities,
    		x1,
    		x2,
    		p1,
    		p2,
    		selectedName,
    		p,
    		x,
    		distr,
    		d
    	});

    	$$self.$inject_state = $$props => {
    		if ("mode" in $$props) $$invalidate(0, mode = $$props.mode);
    		if ("distrs" in $$props) $$invalidate(12, distrs = $$props.distrs);
    		if ("intInd" in $$props) $$invalidate(9, intInd = $$props.intInd);
    		if ("x1" in $$props) $$invalidate(1, x1 = $$props.x1);
    		if ("x2" in $$props) $$invalidate(2, x2 = $$props.x2);
    		if ("p1" in $$props) $$invalidate(3, p1 = $$props.p1);
    		if ("p2" in $$props) $$invalidate(4, p2 = $$props.p2);
    		if ("selectedName" in $$props) $$invalidate(5, selectedName = $$props.selectedName);
    		if ("p" in $$props) $$invalidate(6, p = $$props.p);
    		if ("x" in $$props) $$invalidate(7, x = $$props.x);
    		if ("distr" in $$props) $$invalidate(8, distr = $$props.distr);
    		if ("d" in $$props) $$invalidate(10, d = $$props.d);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*selectedName*/ 32) {
    			$$invalidate(8, distr = distrs[selectedName]);
    		}

    		if ($$self.$$.dirty & /*distr, x*/ 384) {
    			$$invalidate(10, d = distr.pdf(x, distr.params[0], distr.params[1]));
    		}

    		if ($$self.$$.dirty & /*distr, x*/ 384) {
    			$$invalidate(6, p = distr.cdf(x, distr.params[0], distr.params[1]));
    		}

    		if ($$self.$$.dirty & /*x, x1, x2, mode*/ 135) {
    			changeValues(x, x1, x2, mode);
    		}

    		if ($$self.$$.dirty & /*p, p1, p2, mode*/ 89) {
    			changeProbabilities(p, p1, p2, mode);
    		}
    	};

    	$$invalidate(7, x = seq(limX[0], limX[1], size));

    	return [
    		mode,
    		x1,
    		x2,
    		p1,
    		p2,
    		selectedName,
    		p,
    		x,
    		distr,
    		intInd,
    		d,
    		limX,
    		distrs,
    		appcontrolswitch_value_binding,
    		appcontrolrange0_value_binding,
    		appcontrolrange1_value_binding,
    		appcontrolrange_value_binding,
    		appcontrolrange_value_binding_1,
    		appcontrolswitch_value_binding_1,
    		appcontrolrange_value_binding_2,
    		appcontrolrange_value_binding_3,
    		appcontrolswitch_value_binding_2
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
//# sourceMappingURL=asta-b103.js.map
