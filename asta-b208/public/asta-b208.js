
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
     * Returns a p-value for any test
     * @param {function} pfun - reference to a CDF function (e.g. pnorm)
     * @param {number} crit - critical value for the test (e.g. z-score or t-score)
     * @param {string} tail - which tail to use ("left", "right", or "both")
     * @param {Array} params - additional parameters to CDF function
     * @returns {number} - a p-value for the test
     */
    function getPValue(pfun, crit, tail, params = []) {

       if (tail === "left") {
          return(pfun(crit, ...params));
       }

       if (tail === "right") {
          return(1 - pfun(crit, ...params));
       }

       if (tail === "both") {
          let p = pfun(crit, ...params);
          return min([p, 1 - p]) * 2;
       }
    }


    /**
     * Makes one-sample t-test for a mean
     * @param {number[]} x - vector with sample values
     * @param {number} mu - assumed mean value for population (H0)
     * @param {number} alpha - significance level (used to compute confidence interval)
     * @param {string} tail - which tail to use ("left", "right", or "both")
     * @returns {Object} - a JSON with test results
     */
    function tTest1(x, mu = 0, alpha = 0.05, tail = "both") {

       if (typeof(mu) !== "number") {
          throw Error("Parameter 'mu' should be a number.");
       }

       const nx = x.length;

       const effectExpected = mu;
       const effectObserved = mean(x);
       const se = sd(x) / Math.sqrt(nx);
       const tValue = (effectObserved - effectExpected) / se;
       const DoF = nx - 1;
       const errMargin = qt(1 - alpha/2, DoF) * se;

       return {
          test: "One sample t-test",
          effectExpected: mu,
          effectObserved: effectObserved,
          se: se,
          tValue: tValue,
          alpha: alpha,
          tail: tail,
          DoF: DoF,
          pValue: getPValue(pt, tValue, tail, [DoF]),
          ci: [effectObserved - errMargin, effectObserved + errMargin]
       };
    }


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
     * Computes covariance between two vectors
     * @param {number[]} x - vector with values
     * @param {number[]} y - vector with values
     * @param {boolean} biased - compute a biased version with n degrees of freedom or not (with n-1).
     * @param {number} mx - mean of x values (if already known)
     * @param {number} my - mean of y values (if already known)
     * @returns {number}
     */
    function cov(x, y, biased = false, mx = undefined, my = undefined) {

       const n = x.length;

       if (y.length !== n) {
          throw Error("Vectors 'x' and 'y' must have the same length.");
       }

       if (n < 2) {
          throw Error("Vectors 'x' and 'y' must have at least two values.");
       }

       if (mx === undefined) mx = mean(x);
       if (my === undefined) my = mean(y);

       let cov = 0;
       for (let i = 0; i < n; i++) {
          cov = cov + (x[i] - mx) * (y[i] - my);
       }

       return cov / (biased ? n : n - 1);
    }


    /**
     * Computes variance for a vector
     * @param {number[]} x - vector with values
     * @param {boolean} biased - compute a biased version with n degrees of freedom or not (with n-1).
     * @param {number} m - mean value (e.g. if already computed).
     * @returns {number}
     */
    function variance(x, biased = false, m = undefined) {
       return cov(x, x, biased, m, m);
    }


    /**
     * Computes standard deviation for a vector
     * @param {number[]} x - vector with values
     * @param {boolean} biased - compute a biased version with n degrees of freedom or not (with n-1).
     * @param {number} m - mean value (e.g. if already computed).
     * @returns {number}
     */
    function sd(x, biased = false, m = undefined) {
       return Math.sqrt(variance(x, biased, m));
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
    function mrange(x, margin) {
       const mn = min(x);
       const mx = max(x);
       const d = mx - mn;

       return [mn - d * margin, max(x) + d * margin];
    }


     /**
     * Generates 'n' random numbers from a normal distribution
     * @param {number} n - amount of numbers to generate
     * @param {number} mu - average value of the population
     * @param {number} sigma - standard deviation of the population
     * @returns {Array} vector with generated numbers
     */
    function rnorm(n, mu = 0, sigma = 1) {

       let out = Array(n);
       for (let i = 0; i < n; i ++) {
          const a = Math.sqrt(-2 * Math.log(Math.random()));
          const b = 2 * Math.PI * Math.random();
          out[i] = (a * Math.sin(b) * sigma + mu);
       }

       return out;
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
     * Inverse cumulative distribution function for normal distribution
     * @param {number|number[]} p - vector of probabilities or a single probability value
     * @param {number} mu - average value of the population
     * @param {number} sigma - standard deviation of the population
     * @returns {number|number[]} vector with quantiles or single quantile value
     */
    function qnorm(p, mu = 0, sigma = 1) {

       if (Array.isArray(p)) {
          return p.map(v => qnorm(v, mu, sigma));
       }

       if (mu !== 0 || sigma !== 1) {
          return qnorm(p) * sigma + mu;
       }

       if (p < 0 || p > 1) {
          throw Error("Parameter 'p' must be between 0 and 1.");
       }

       if (p < 0.0000000001) return -Infinity;
       if (p > 0.9999999999) return +Infinity;

       const SP1 = 0.425;
       const SP2 = 5.0;
       const C1 = 0.180625;
       const C2 = 1.6;

       const a0 = 3.3871327179;
       const a1 = 5.0434271938 * 10;
       const a2 = 1.5929113202 * 100;
       const a3 = 5.9109374720 * 10;
       const b1 = 1.7895169469 * 10;
       const b2 = 7.8757757664 * 10;
       const b3 = 6.7187563600 * 10;

       const c0 = 1.4234372777;
       const c1 = 2.7568153900;
       const c2 = 1.3067284816;
       const c3 = 1.7023821103 * 0.1;
       const d1 = 7.3700164250 * 0.1;
       const d2 = 1.2021132975 * 0.1;

       const e0 = 6.6579051150;
       const e1 = 3.0812263860;
       const e2 = 4.2868294337 * 0.1;
       const e3 = 1.7337203997 * 0.01;
       const f1 = 2.4197894225 * 0.1;
       const f2 = 1.2258202635 * 0.01;

       const q = p - 0.5;
       let r;

       if (Math.abs(q) <= SP1) {
          r = C1 - q * q;
          return q * (((a3 * r + a2) * r + a1) *r + a0) / (((b3 * r + b2) * r + b1) * r + 1.0);
       }

       r = q < 0 ? p : 1 - p;
       r = Math.sqrt(-Math.log(r));
       let res;

       if (r <= SP2) {
          r = r - C2;
          res = (((c3 * r + c2) * r + c1) * r + c0) / ((d2 * r + d1) * r + 1.0);
       } else {
          r = r - SP2;
          res = (((e3 * r + e2) * r + e1) + e0) / ((f2 * r + f1) * r + 1.0);
       }

       return q < 0 ? -res : res;
    }

    /**
     * Probability density function for Student's t-distribution
     * @param {number|number[]} t - t-value or a vector of t-values
     * @param {number} dof - degrees of freedom
     */
    function dt(t, dof) {

       if (dof < 0) {
          throw new Error("Parameter 'dof' should be a positive number.");
       }

       if (Array.isArray(t)) {
          return t.map(v => dt(v, dof));
       }

       const pow = -0.5 * (dof + 1);
       const A = 1 / (Math.sqrt(dof) * beta(0.5, dof/2));
       return (A * Math.pow((1 + t * t / dof), pow));
    }


    /**
     * Cumulative distribution function for Student's t-distribution
     * @param {number|number[]} t - t-value or a vector of t-values
     * @param {number} dof - degrees of freedom
     */
    function pt(t, dof) {

       if (dof === undefined || dof === null || dof < 1) {
          throw Error("Parameter 'dof' (degrees of freedom) must be an integer number >= 1.");
       }

       if (Array.isArray(t)) {
          return t.map(v => pt(v, dof));
       }

       // since distribution in symmetric we can use only left tail
       if (t === 0) return 0.5;
       if (t === -Infinity) return 0;
       if (t === Infinity) return 1;
       if (t > 0) return (1 - pt(-t, dof));

       return integrate((x) => dt(x, dof), -Infinity, t);
    }


    /**
     * Inverse cumulative distribution function for Student's t-distribution
     * @param {number|number[]} p - probability or vector with probabilities
     * @param {number} dof - degrees of freedom
     */
    function qt(p, dof) {

       if (dof === undefined || dof === null || dof < 1) {
          throw Error("Parameter 'dof' (degrees of freedom) must be an integer number >= 1.");
       }

       if (p < 0 || p > 1) {
          throw Error("Parameter 'p' must be between 0 and 1.");
       }

       if (Array.isArray(p)) {
          return p.map(v => qt(v, dof));
       }

       if (p < 0.0000000001) return -Infinity;
       if (p > 0.9999999999) return +Infinity;


       // simple cases — exact solutions
       if (dof === 1) {
          return Math.tan(Math.PI * (p - 0.5));
       }

       if (dof === 2) {
          return 2 * (p - 0.5) * Math.sqrt(2 / (4 * p * (1 - p)));
       }

       // approximation

       let sign = -1;
       if (p >= 0.5){
          sign = +1 ;
          p = 2 * (1 - p);
       } else {
          sign = -1;
          p = 2 * p;
       }

       const a = 1.0 / (dof - 0.5);
       const b = 48.0 / (a ** 2);
       let c = ((20700 * a / b - 98) * a - 16) * a + 96.36;
       const d = ((94.5 / (b + c) - 3.0)/b + 1.0) * Math.sqrt(a * Math.PI / 2) * dof;

       let x = d * p;
       let y = x ** (2.0/dof);

       if (y > 0.05 + a) {

          // asymptotic inverse expansion about normal
          x = qnorm(p * 0.5);
          y = x ** 2;

          if (dof < 5) {
             c = c + 0.3 * (dof - 4.5) * (x + 0.6);
          }

          c = (((0.05 * d * x - 5.0) * x - 7.0) * x - 2.0) * x + b + c;
          y = (((((0.4 * y + 6.3) * y + 36.0) * y + 94.5) / c - y - 3.0)/b + 1.0) * x;
          y = a * (y ** 2);
          y = y > 0.002 ? Math.exp(y) - 1.0 : 0.5 * (y ** 2) + y;
       } else {
          y = ((1.0 / (((dof + 6.0)/(dof * y) - 0.089 * d - 0.822) * (dof + 2.0) * 3.0) + 0.5/(dof + 4.0)) * y - 1.0) *
             (dof + 1.0)/(dof + 2.0) + 1.0/y;
       }

       return sign * Math.sqrt(dof * y);
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
     * Finds index of value in x which is closest to the value a
     * @param {number[]} x - a vector with values
     * @param {number}  a - a value
     */
    function closestIndex(x, a) {
       const c = x.reduce((prev, curr) => Math.abs(curr - a) < Math.abs(prev - a) ? curr : prev);
       return x.indexOf(c);
    }



    /***************************************************************
     * Mathematical functions and methods needed for computations  *
     ***************************************************************/

    /**
     * Computes numeric integral for function "f" with limits (a, b)
     * @param {function} f - a reference to a function
     * @param {number} a - lower limit for integration
     * @param {number} b - upper limit for integration
     * @param {number} acc - absolute accuracy
     * @param {number} eps - relative accuracy
     * @param {number[]} oldfs - vector of values needed for recursion
     * @returns {number} result of integration
     */
    function integrate(f, a, b, acc = 0.000001, eps = 0.00001, oldfs = undefined) {

       if (typeof(a) !== "number" || typeof(b) !== "number") {
          throw Error("Parameters 'a' and 'b' must be numbers.");
       }

       if (b < a) {
          throw Error("Parameter 'b' must be larger 'a'.");
       }

       // special case when left limit is minus infinity
       if (a === -Infinity && b !== Infinity) {
          return integrate((t) => f(b - (1 - t) / t) / (t ** 2), 0, 1);
       }

       // special case when right limit is plus infinity
       if (a !== -Infinity && b === Infinity) {
          return integrate((t) => f(a + (1 - t) / t) / (t ** 2), 0, 1);
       }

       // special case when both limits are infinite
       if (a === -Infinity && b === Infinity) {
          return integrate((t) => (f((1 - t) / t) + f((t - 1) / t)) / t ** 2, 0, 1);
       }

       // constants for splitting the integration interval
       const x = [1/6, 2/6, 4/6, 5/6];
       const w = [2/6, 1/6, 1/6, 2/6];
       const v = [1/4, 1/4, 1/4, 1/4];
       const p = [1, 0, 0, 1];

       let n = x.length, h = b - a;
       let fs;

       if (oldfs === undefined) {
          fs = x.map(v => f(a + v * h));
       } else {
          fs = new Array(n);
          for (let k = 0, i = 0; i < n; i++) {
             fs[i] = p[i] === 1 ? f(a + x[i] * h) : oldfs[k++];
          }
       }

       let q4 = 0, q2 = 0;
       for (let i = 0; i < n; i++) {
          q4 += w[i] * fs[i] * h;
          q2 += v[i] * fs[i] * h;
       }

       let tol = acc + eps * Math.abs(q4);
       let err = Math.abs((q4 - q2)/3);

       if (err < tol) return q4;

       acc = acc / Math.sqrt(2.);
       let mid = (a + b) / 2;
       let left = fs.filter((v, i) => i < n/2);
       let right = fs.filter((v, i) => i >= n/2);

       let ql = integrate(f, a, mid, eps, acc, left);
       let qr = integrate(f, mid, b, eps, acc, right);
       return (ql + qr);
    }


    /**
     * Gamma function (approximation)
     * @param {number|number[]} z - argument (one value or a vector)
     * @returns {number} value of the Gamma function
     */
    function gamma(z) {

       if (Array.isArray(z)) {
          return z.map(v => gamma(v));
       }

       if (z <= 0) {
          throw new Error("Gamma function only works with arguments > 0.");
       }

       // coefficients
       const p = [
            676.5203681218851,
          -1259.1392167224028,
            771.32342877765313,
           -176.61502916214059,
             12.507343278686905,
             -0.13857109526572012,
              9.9843695780195716e-6,
              1.5056327351493116e-7
        ];

       if (z < 0.5) {
          return Math.PI / (Math.sin(Math.PI * z) + gamma(1 - z));
       }

       z = z - 1;
       let x = 0.99999999999980993;

       for (let i = 0; i < p.length; i++) {
          x = x + p[i] / (z + i + 1);
       }

       const t = z + p.length - 0.5;
       return Math.sqrt(2 * Math.PI) * Math.pow(t, z + 0.5) * Math.exp(-t) * x;
    }


    /**
     * Betta function (approximation)
     * @param {number} x - first argument (one value)
     * @param {number} y - second argument (one value)
     * @returns {number} value of the Beta function
     */
    function beta(x, y) {
       return gamma(x) * gamma(y) / gamma(x + y);
    }

    /* ../shared/StatApp.svelte generated by Svelte v3.38.2 */
    const file$e = "../shared/StatApp.svelte";
    const get_help_slot_changes = dirty => ({});
    const get_help_slot_context = ctx => ({});

    // (40:3) {#if showHelp}
    function create_if_block$a(ctx) {
    	let div;
    	let current;
    	const help_slot_template = /*#slots*/ ctx[5].help;
    	const help_slot = create_slot(help_slot_template, ctx, /*$$scope*/ ctx[4], get_help_slot_context);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (help_slot) help_slot.c();
    			attr_dev(div, "class", "helptext svelte-coelov");
    			add_location(div, file$e, 40, 3, 893);
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
    		id: create_if_block$a.name,
    		type: "if",
    		source: "(40:3) {#if showHelp}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$k(ctx) {
    	let main;
    	let div;
    	let t;
    	let main_class_value;
    	let current;
    	let mounted;
    	let dispose;
    	const default_slot_template = /*#slots*/ ctx[5].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[4], null);
    	let if_block = /*showHelp*/ ctx[0] && create_if_block$a(ctx);

    	const block = {
    		c: function create() {
    			main = element("main");
    			div = element("div");
    			if (default_slot) default_slot.c();
    			t = space();
    			if (if_block) if_block.c();
    			attr_dev(div, "class", "content svelte-coelov");
    			add_location(div, file$e, 35, 3, 822);
    			attr_dev(main, "class", main_class_value = "mdatools-app mdatools-app_" + /*scale*/ ctx[1] + " svelte-coelov");
    			add_location(main, file$e, 33, 0, 744);
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
    			/*main_binding*/ ctx[6](main);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(window, "keypress", /*handleKeyPress*/ ctx[3], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 16)) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[4], dirty, null, null);
    				}
    			}

    			if (/*showHelp*/ ctx[0]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*showHelp*/ 1) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block$a(ctx);
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

    			if (!current || dirty & /*scale*/ 2 && main_class_value !== (main_class_value = "mdatools-app mdatools-app_" + /*scale*/ ctx[1] + " svelte-coelov")) {
    				attr_dev(main, "class", main_class_value);
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
    			/*main_binding*/ ctx[6](null);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$k.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$k($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$k, create_fragment$k, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "StatApp",
    			options,
    			id: create_fragment$k.name
    		});
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

    /* ../shared/controls/AppControlArea.svelte generated by Svelte v3.38.2 */

    const file$d = "../shared/controls/AppControlArea.svelte";

    // (7:3) {#if errormsg}
    function create_if_block$9(ctx) {
    	let div;
    	let t;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t = text(/*errormsg*/ ctx[0]);
    			attr_dev(div, "class", "app-control-error svelte-8w06qs");
    			add_location(div, file$d, 6, 17, 126);
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
    		id: create_if_block$9.name,
    		type: "if",
    		source: "(7:3) {#if errormsg}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$j(ctx) {
    	let fieldset;
    	let t;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[2].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[1], null);
    	let if_block = /*errormsg*/ ctx[0] && create_if_block$9(ctx);

    	const block = {
    		c: function create() {
    			fieldset = element("fieldset");
    			if (default_slot) default_slot.c();
    			t = space();
    			if (if_block) if_block.c();
    			attr_dev(fieldset, "class", "app-control-area svelte-8w06qs");
    			add_location(fieldset, file$d, 4, 0, 56);
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
    					if_block = create_if_block$9(ctx);
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
    		id: create_fragment$j.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$j($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$j, create_fragment$j, safe_not_equal, { errormsg: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "AppControlArea",
    			options,
    			id: create_fragment$j.name
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

    const file$c = "../shared/controls/AppControl.svelte";

    function create_fragment$i(ctx) {
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
    			add_location(label_1, file$c, 6, 3, 88);
    			attr_dev(div, "class", "app-control svelte-u0fryu");
    			add_location(div, file$c, 5, 0, 59);
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
    		id: create_fragment$i.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$i($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$i, create_fragment$i, safe_not_equal, { id: 0, label: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "AppControl",
    			options,
    			id: create_fragment$i.name
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
    const file$b = "../shared/controls/AppControlButton.svelte";

    // (9:0) <AppControl id={id} label={label} >
    function create_default_slot$9(ctx) {
    	let button;
    	let t;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			t = text(/*text*/ ctx[2]);
    			attr_dev(button, "class", "svelte-16fv6fd");
    			add_location(button, file$b, 9, 3, 168);
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
    		id: create_default_slot$9.name,
    		type: "slot",
    		source: "(9:0) <AppControl id={id} label={label} >",
    		ctx
    	});

    	return block;
    }

    function create_fragment$h(ctx) {
    	let appcontrol;
    	let current;

    	appcontrol = new AppControl({
    			props: {
    				id: /*id*/ ctx[0],
    				label: /*label*/ ctx[1],
    				$$slots: { default: [create_default_slot$9] },
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
    		id: create_fragment$h.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$h($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$h, create_fragment$h, safe_not_equal, { id: 0, label: 1, text: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "AppControlButton",
    			options,
    			id: create_fragment$h.name
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
    const file$a = "../shared/controls/AppControlSwitch.svelte";

    function get_each_context$4(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[6] = list[i];
    	return child_ctx;
    }

    // (14:6) {#each options as option (option)}
    function create_each_block$4(key_1, ctx) {
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
    			add_location(div, file$a, 14, 6, 321);
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
    		id: create_each_block$4.name,
    		type: "each",
    		source: "(14:6) {#each options as option (option)}",
    		ctx
    	});

    	return block;
    }

    // (11:0) <AppControl id={id} label={label} >
    function create_default_slot$8(ctx) {
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
    			add_location(div, file$a, 12, 3, 251);
    			attr_dev(input, "name", /*id*/ ctx[1]);
    			attr_dev(input, "class", "svelte-yqpg3s");
    			add_location(input, file$a, 18, 3, 447);
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
    		id: create_default_slot$8.name,
    		type: "slot",
    		source: "(11:0) <AppControl id={id} label={label} >",
    		ctx
    	});

    	return block;
    }

    function create_fragment$g(ctx) {
    	let appcontrol;
    	let current;

    	appcontrol = new AppControl({
    			props: {
    				id: /*id*/ ctx[1],
    				label: /*label*/ ctx[2],
    				$$slots: { default: [create_default_slot$8] },
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
    		id: create_fragment$g.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$g($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$g, create_fragment$g, safe_not_equal, { id: 1, label: 2, options: 3, value: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "AppControlSwitch",
    			options,
    			id: create_fragment$g.name
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
    const file$9 = "../shared/controls/AppControlRange.svelte";

    // (67:0) <AppControl id={id} label={label}>
    function create_default_slot$7(ctx) {
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
    			add_location(div0, file$9, 75, 6, 2016);
    			attr_dev(span, "class", "svelte-1n1k125");
    			add_location(span, file$9, 76, 6, 2103);
    			attr_dev(div1, "class", "rangeSliderContainer svelte-1n1k125");
    			add_location(div1, file$9, 67, 3, 1806);
    			attr_dev(input, "type", "range");
    			attr_dev(input, "step", /*step*/ ctx[6]);
    			attr_dev(input, "min", /*min*/ ctx[3]);
    			attr_dev(input, "max", /*max*/ ctx[4]);
    			attr_dev(input, "class", "svelte-1n1k125");
    			add_location(input, file$9, 78, 3, 2153);
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
    		id: create_default_slot$7.name,
    		type: "slot",
    		source: "(67:0) <AppControl id={id} label={label}>",
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
    				$$slots: { default: [create_default_slot$7] },
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
    		id: create_fragment$f.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$f($$self, $$props, $$invalidate) {
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

    		init(this, options, instance$f, create_fragment$f, safe_not_equal, {
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
    			id: create_fragment$f.name
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
    const file$8 = "../../svelte-plots-basic/src/Axes.svelte";
    const get_box_slot_changes$1 = dirty => ({});
    const get_box_slot_context$1 = ctx => ({});
    const get_yaxis_slot_changes$1 = dirty => ({});
    const get_yaxis_slot_context$1 = ctx => ({});
    const get_xaxis_slot_changes = dirty => ({});
    const get_xaxis_slot_context = ctx => ({});

    // (311:3) {#if title !== ""}
    function create_if_block_3(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", "axes__title");
    			add_location(div, file$8, 310, 21, 11963);
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
    function create_if_block_2$1(ctx) {
    	let div;
    	let span;

    	const block = {
    		c: function create() {
    			div = element("div");
    			span = element("span");
    			add_location(span, file$8, 311, 48, 12061);
    			attr_dev(div, "class", "axes__ylabel");
    			add_location(div, file$8, 311, 22, 12035);
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
    		id: create_if_block_2$1.name,
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
    			add_location(span, file$8, 312, 48, 12148);
    			attr_dev(div, "class", "axes__xlabel");
    			add_location(div, file$8, 312, 22, 12122);
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
    function create_if_block$8(ctx) {
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
    			add_location(br, file$8, 342, 51, 12994);
    			attr_dev(p, "class", "message_error");
    			add_location(p, file$8, 341, 3, 12917);
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
    		id: create_if_block$8.name,
    		type: "if",
    		source: "(341:3) {#if !$isOk}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$e(ctx) {
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
    	let if_block1 = /*yLabel*/ ctx[2] !== "" && create_if_block_2$1(ctx);
    	let if_block2 = /*xLabel*/ ctx[1] !== "" && create_if_block_1$1(ctx);
    	const xaxis_slot_template = /*#slots*/ ctx[24].xaxis;
    	const xaxis_slot = create_slot(xaxis_slot_template, ctx, /*$$scope*/ ctx[23], get_xaxis_slot_context);
    	const yaxis_slot_template = /*#slots*/ ctx[24].yaxis;
    	const yaxis_slot = create_slot(yaxis_slot_template, ctx, /*$$scope*/ ctx[23], get_yaxis_slot_context$1);
    	const default_slot_template = /*#slots*/ ctx[24].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[23], null);
    	const box_slot_template = /*#slots*/ ctx[24].box;
    	const box_slot = create_slot(box_slot_template, ctx, /*$$scope*/ ctx[23], get_box_slot_context$1);
    	let if_block3 = !/*$isOk*/ ctx[3] && create_if_block$8(ctx);

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
    			add_location(rect, file$8, 321, 15, 12446);
    			attr_dev(clipPath, "id", /*clipPathID*/ ctx[8]);
    			add_location(clipPath, file$8, 320, 12, 12402);
    			add_location(defs, file$8, 319, 9, 12383);
    			attr_dev(g, "clip-path", "url(#" + /*clipPathID*/ ctx[8] + ")");
    			add_location(g, file$8, 330, 9, 12732);
    			attr_dev(svg, "preserveAspectRatio", "none");
    			attr_dev(svg, "class", "axes");
    			add_location(svg, file$8, 316, 6, 12288);
    			attr_dev(div0, "class", "axes-wrapper");
    			add_location(div0, file$8, 315, 3, 12228);
    			attr_dev(div1, "class", div1_class_value = "plot " + ("plot_" + /*$scale*/ ctx[4]));
    			toggle_class(div1, "plot_error", !/*$isOk*/ ctx[3]);
    			add_location(div1, file$8, 307, 0, 11835);
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
    					if_block1 = create_if_block_2$1(ctx);
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
    					update_slot(yaxis_slot, yaxis_slot_template, ctx, /*$$scope*/ ctx[23], dirty, get_yaxis_slot_changes$1, get_yaxis_slot_context$1);
    				}
    			}

    			if (default_slot) {
    				if (default_slot.p && (!current || dirty[0] & /*$$scope*/ 8388608)) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[23], dirty, null, null);
    				}
    			}

    			if (box_slot) {
    				if (box_slot.p && (!current || dirty[0] & /*$$scope*/ 8388608)) {
    					update_slot(box_slot, box_slot_template, ctx, /*$$scope*/ ctx[23], dirty, get_box_slot_changes$1, get_box_slot_context$1);
    				}
    			}

    			if (!/*$isOk*/ ctx[3]) {
    				if (if_block3) ; else {
    					if_block3 = create_if_block$8(ctx);
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
    		id: create_fragment$e.name,
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

    function instance$e($$self, $$props, $$invalidate) {
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
    			instance$e,
    			create_fragment$e,
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
    			id: create_fragment$e.name
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
    const file$7 = "../../svelte-plots-basic/src/XAxis.svelte";

    function get_each_context$3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[26] = list[i];
    	child_ctx[28] = i;
    	return child_ctx;
    }

    // (57:0) {#if $isOk && x !== undefined && y !== undefined }
    function create_if_block$7(ctx) {
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
    		each_blocks[i] = create_each_block$3(get_each_context$3(ctx, each_value, i));
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
    			add_location(line, file$7, 63, 3, 2597);
    			attr_dev(g, "class", "mdaplot__axis mdaplot__xaxis");
    			add_location(g, file$7, 57, 3, 2169);
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
    		id: create_if_block$7.name,
    		type: "if",
    		source: "(57:0) {#if $isOk && x !== undefined && y !== undefined }",
    		ctx
    	});

    	return block;
    }

    // (59:3) {#each ticksX as tx, i}
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
    			attr_dev(line0, "x1", line0_x__value = /*tx*/ ctx[26]);
    			attr_dev(line0, "x2", line0_x__value_1 = /*tx*/ ctx[26]);
    			attr_dev(line0, "y1", line0_y__value = /*y*/ ctx[1][0]);
    			attr_dev(line0, "y2", line0_y__value_1 = /*y*/ ctx[1][1]);
    			attr_dev(line0, "style", /*gridLineStyleStr*/ ctx[8]);
    			add_location(line0, file$7, 59, 6, 2243);
    			attr_dev(line1, "x1", line1_x__value = /*tx*/ ctx[26]);
    			attr_dev(line1, "x2", line1_x__value_1 = /*tx*/ ctx[26]);
    			attr_dev(line1, "y1", line1_y__value = /*ticksY*/ ctx[5][0]);
    			attr_dev(line1, "y2", line1_y__value_1 = /*ticksY*/ ctx[5][1]);
    			attr_dev(line1, "style", /*axisLineStyleStr*/ ctx[7]);
    			add_location(line1, file$7, 60, 6, 2334);
    			attr_dev(text_1, "x", text_1_x_value = /*tx*/ ctx[26]);
    			attr_dev(text_1, "y", text_1_y_value = /*ticksY*/ ctx[5][1]);
    			attr_dev(text_1, "dx", "0");
    			attr_dev(text_1, "dy", /*dy*/ ctx[2]);
    			attr_dev(text_1, "class", "mdaplot__axis-labels");
    			attr_dev(text_1, "dominant-baseline", "middle");
    			attr_dev(text_1, "text-anchor", "middle");
    			add_location(text_1, file$7, 61, 6, 2435);
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
    		id: create_each_block$3.name,
    		type: "each",
    		source: "(59:3) {#each ticksX as tx, i}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$d(ctx) {
    	let if_block_anchor;
    	let if_block = /*$isOk*/ ctx[6] && /*x*/ ctx[3] !== undefined && /*y*/ ctx[1] !== undefined && create_if_block$7(ctx);

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
    					if_block = create_if_block$7(ctx);
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
    		id: create_fragment$d.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$d($$self, $$props, $$invalidate) {
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

    		init(this, options, instance$d, create_fragment$d, safe_not_equal, {
    			slot: 16,
    			ticks: 15,
    			tickLabels: 0,
    			showGrid: 17
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "XAxis",
    			options,
    			id: create_fragment$d.name
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
    const file$6 = "../../svelte-plots-basic/src/Segments.svelte";

    function get_each_context$2(ctx, list, i) {
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
    function create_each_block$2(ctx) {
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
    			add_location(line, file$6, 42, 6, 1516);
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
    		id: create_each_block$2.name,
    		type: "each",
    		source: "(42:3) {#each x1 as v, i}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$c(ctx) {
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
    		id: create_fragment$c.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$c($$self, $$props, $$invalidate) {
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

    		init(this, options, instance$c, create_fragment$c, safe_not_equal, {
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
    			id: create_fragment$c.name
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
    const file$5 = "../../svelte-plots-basic/src/TextLabels.svelte";

    function get_each_context$1(ctx, list, i) {
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
    			if (dirty & /*textStyleStr, x, y, dx, dy, textAnchors, pos, labels*/ 255) {
    				each_value = /*x*/ ctx[2];
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
    		id: create_if_block$5.name,
    		type: "if",
    		source: "(56:0) {#if x !== undefined && y !== undefined}",
    		ctx
    	});

    	return block;
    }

    // (57:3) {#each x as v, i}
    function create_each_block$1(ctx) {
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
    			add_location(text_1, file$5, 57, 6, 2089);
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
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(57:3) {#each x as v, i}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$b(ctx) {
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

    		init(this, options, instance$b, create_fragment$b, safe_not_equal, {
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
    			id: create_fragment$b.name
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
    const file$4 = "../../svelte-plots-basic/src/TextLegend.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[22] = list[i];
    	child_ctx[24] = i;
    	return child_ctx;
    }

    // (32:0) {#if x !== undefined && y !== undefined && elements.length > 0}
    function create_if_block$4(ctx) {
    	let text_1;
    	let each_value = /*elements*/ ctx[2];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			text_1 = svg_element("text");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(text_1, "style", /*textStyleStr*/ ctx[5]);
    			attr_dev(text_1, "x", /*x*/ ctx[3]);
    			attr_dev(text_1, "y", /*y*/ ctx[4]);
    			attr_dev(text_1, "dx", /*dx*/ ctx[0]);
    			attr_dev(text_1, "dy", /*dy*/ ctx[1]);
    			attr_dev(text_1, "dominant-baseline", "middle");
    			attr_dev(text_1, "text-anchor", "start");
    			add_location(text_1, file$4, 32, 3, 1039);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, text_1, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(text_1, null);
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*x, dx, dy, elements*/ 15) {
    				each_value = /*elements*/ ctx[2];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(text_1, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (dirty & /*textStyleStr*/ 32) {
    				attr_dev(text_1, "style", /*textStyleStr*/ ctx[5]);
    			}

    			if (dirty & /*x*/ 8) {
    				attr_dev(text_1, "x", /*x*/ ctx[3]);
    			}

    			if (dirty & /*y*/ 16) {
    				attr_dev(text_1, "y", /*y*/ ctx[4]);
    			}

    			if (dirty & /*dx*/ 1) {
    				attr_dev(text_1, "dx", /*dx*/ ctx[0]);
    			}

    			if (dirty & /*dy*/ 2) {
    				attr_dev(text_1, "dy", /*dy*/ ctx[1]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(text_1);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$4.name,
    		type: "if",
    		source: "(32:0) {#if x !== undefined && y !== undefined && elements.length > 0}",
    		ctx
    	});

    	return block;
    }

    // (34:6) {#each elements as el, i}
    function create_each_block(ctx) {
    	let tspan;
    	let raw_value = /*el*/ ctx[22] + "";
    	let tspan_dy_value;

    	const block = {
    		c: function create() {
    			tspan = svg_element("tspan");
    			attr_dev(tspan, "x", /*x*/ ctx[3]);
    			attr_dev(tspan, "dx", /*dx*/ ctx[0]);
    			attr_dev(tspan, "dy", tspan_dy_value = /*i*/ ctx[24] === 0 ? 0 : /*dy*/ ctx[1]);
    			add_location(tspan, file$4, 34, 9, 1183);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, tspan, anchor);
    			tspan.innerHTML = raw_value;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*elements*/ 4 && raw_value !== (raw_value = /*el*/ ctx[22] + "")) tspan.innerHTML = raw_value;
    			if (dirty & /*x*/ 8) {
    				attr_dev(tspan, "x", /*x*/ ctx[3]);
    			}

    			if (dirty & /*dx*/ 1) {
    				attr_dev(tspan, "dx", /*dx*/ ctx[0]);
    			}

    			if (dirty & /*dy*/ 2 && tspan_dy_value !== (tspan_dy_value = /*i*/ ctx[24] === 0 ? 0 : /*dy*/ ctx[1])) {
    				attr_dev(tspan, "dy", tspan_dy_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(tspan);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(34:6) {#each elements as el, i}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$a(ctx) {
    	let if_block_anchor;
    	let if_block = /*x*/ ctx[3] !== undefined && /*y*/ ctx[4] !== undefined && /*elements*/ ctx[2].length > 0 && create_if_block$4(ctx);

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
    			if (/*x*/ ctx[3] !== undefined && /*y*/ ctx[4] !== undefined && /*elements*/ ctx[2].length > 0) {
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
    	let textStyleStr;
    	let $xLim;
    	let $axesWidth;
    	let $yLim;
    	let $axesHeight;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("TextLegend", slots, []);
    	let { left } = $$props;
    	let { top } = $$props;
    	let { dx = "0" } = $$props;
    	let { dy = "1.25em" } = $$props;
    	let { elements } = $$props;
    	let { faceColor = Colors.PRIMARY_TEXT } = $$props;
    	let { borderColor = "transparent" } = $$props;
    	let { borderWidth = 0 } = $$props;
    	let { textSize = 1 } = $$props;

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
    	const scale = axes.scale;

    	const writable_props = [
    		"left",
    		"top",
    		"dx",
    		"dy",
    		"elements",
    		"faceColor",
    		"borderColor",
    		"borderWidth",
    		"textSize"
    	];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<TextLegend> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("left" in $$props) $$invalidate(10, left = $$props.left);
    		if ("top" in $$props) $$invalidate(11, top = $$props.top);
    		if ("dx" in $$props) $$invalidate(0, dx = $$props.dx);
    		if ("dy" in $$props) $$invalidate(1, dy = $$props.dy);
    		if ("elements" in $$props) $$invalidate(2, elements = $$props.elements);
    		if ("faceColor" in $$props) $$invalidate(12, faceColor = $$props.faceColor);
    		if ("borderColor" in $$props) $$invalidate(13, borderColor = $$props.borderColor);
    		if ("borderWidth" in $$props) $$invalidate(14, borderWidth = $$props.borderWidth);
    		if ("textSize" in $$props) $$invalidate(15, textSize = $$props.textSize);
    	};

    	$$self.$capture_state = () => ({
    		getContext,
    		Colors,
    		left,
    		top,
    		dx,
    		dy,
    		elements,
    		faceColor,
    		borderColor,
    		borderWidth,
    		textSize,
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
    		textStyleStr
    	});

    	$$self.$inject_state = $$props => {
    		if ("left" in $$props) $$invalidate(10, left = $$props.left);
    		if ("top" in $$props) $$invalidate(11, top = $$props.top);
    		if ("dx" in $$props) $$invalidate(0, dx = $$props.dx);
    		if ("dy" in $$props) $$invalidate(1, dy = $$props.dy);
    		if ("elements" in $$props) $$invalidate(2, elements = $$props.elements);
    		if ("faceColor" in $$props) $$invalidate(12, faceColor = $$props.faceColor);
    		if ("borderColor" in $$props) $$invalidate(13, borderColor = $$props.borderColor);
    		if ("borderWidth" in $$props) $$invalidate(14, borderWidth = $$props.borderWidth);
    		if ("textSize" in $$props) $$invalidate(15, textSize = $$props.textSize);
    		if ("x" in $$props) $$invalidate(3, x = $$props.x);
    		if ("y" in $$props) $$invalidate(4, y = $$props.y);
    		if ("textStyleStr" in $$props) $$invalidate(5, textStyleStr = $$props.textStyleStr);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*left, $xLim, $axesWidth*/ 197632) {
    			// reactive variables for coordinates of data points in pixels
    			$$invalidate(3, x = axes.scaleX([left], $xLim, $axesWidth));
    		}

    		if ($$self.$$.dirty & /*top, $yLim, $axesHeight*/ 788480) {
    			$$invalidate(4, y = axes.scaleY([top], $yLim, $axesHeight));
    		}

    		if ($$self.$$.dirty & /*faceColor, borderWidth, borderColor, textSize*/ 61440) {
    			// styles for bars and labels
    			$$invalidate(5, textStyleStr = `fill:${faceColor};stroke-width:${borderWidth}px;stroke:${borderColor};font-size:${textSize}em;`);
    		}
    	};

    	return [
    		dx,
    		dy,
    		elements,
    		x,
    		y,
    		textStyleStr,
    		xLim,
    		yLim,
    		axesWidth,
    		axesHeight,
    		left,
    		top,
    		faceColor,
    		borderColor,
    		borderWidth,
    		textSize,
    		$xLim,
    		$axesWidth,
    		$yLim,
    		$axesHeight
    	];
    }

    class TextLegend extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$a, create_fragment$a, safe_not_equal, {
    			left: 10,
    			top: 11,
    			dx: 0,
    			dy: 1,
    			elements: 2,
    			faceColor: 12,
    			borderColor: 13,
    			borderWidth: 14,
    			textSize: 15
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "TextLegend",
    			options,
    			id: create_fragment$a.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*left*/ ctx[10] === undefined && !("left" in props)) {
    			console.warn("<TextLegend> was created without expected prop 'left'");
    		}

    		if (/*top*/ ctx[11] === undefined && !("top" in props)) {
    			console.warn("<TextLegend> was created without expected prop 'top'");
    		}

    		if (/*elements*/ ctx[2] === undefined && !("elements" in props)) {
    			console.warn("<TextLegend> was created without expected prop 'elements'");
    		}
    	}

    	get left() {
    		throw new Error("<TextLegend>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set left(value) {
    		throw new Error("<TextLegend>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get top() {
    		throw new Error("<TextLegend>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set top(value) {
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

    function create_fragment$9(ctx) {
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
    		id: create_fragment$9.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$9($$self, $$props, $$invalidate) {
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

    		init(this, options, instance$9, create_fragment$9, safe_not_equal, {
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
    			id: create_fragment$9.name
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
    function create_if_block$3(ctx) {
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
    		id: create_if_block$3.name,
    		type: "if",
    		source: "(43:0) {#if p !== undefined}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$8(ctx) {
    	let if_block_anchor;
    	let if_block = /*p*/ ctx[1] !== undefined && create_if_block$3(ctx);

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

    		init(this, options, instance$8, create_fragment$8, safe_not_equal, {
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
    			id: create_fragment$8.name
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
    function create_if_block$2(ctx) {
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
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(46:0) {#if p !== undefined}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$7(ctx) {
    	let if_block_anchor;
    	let if_block = /*p*/ ctx[3] !== undefined && create_if_block$2(ctx);

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
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props, $$invalidate) {
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

    		init(this, options, instance$7, create_fragment$7, safe_not_equal, {
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
    			id: create_fragment$7.name
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

    /* ../shared/plots/DistributionPlot.svelte generated by Svelte v3.38.2 */
    const get_yaxis_slot_changes = dirty => ({});
    const get_yaxis_slot_context = ctx => ({});
    const get_legend_slot_changes$1 = dirty => ({});
    const get_legend_slot_context$1 = ctx => ({});
    const get_box_slot_changes = dirty => ({});
    const get_box_slot_context = ctx => ({});

    // (51:3) {#if axLeft && axLeft.length > 1 && (tail === "left" || tail === "both")}
    function create_if_block_2(ctx) {
    	let areaseries;
    	let current;

    	areaseries = new AreaSeries({
    			props: {
    				xValues: /*axLeft*/ ctx[11],
    				yValues: /*afLeft*/ ctx[13],
    				lineColor: "transparent",
    				fillColor: /*areaColor*/ ctx[1]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(areaseries.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(areaseries, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const areaseries_changes = {};
    			if (dirty & /*axLeft*/ 2048) areaseries_changes.xValues = /*axLeft*/ ctx[11];
    			if (dirty & /*afLeft*/ 8192) areaseries_changes.yValues = /*afLeft*/ ctx[13];
    			if (dirty & /*areaColor*/ 2) areaseries_changes.fillColor = /*areaColor*/ ctx[1];
    			areaseries.$set(areaseries_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(areaseries.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(areaseries.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(areaseries, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(51:3) {#if axLeft && axLeft.length > 1 && (tail === \\\"left\\\" || tail === \\\"both\\\")}",
    		ctx
    	});

    	return block;
    }

    // (56:3) {#if axRight !== undefined && axRight.length > 1 && (tail === "right" || tail === "both")}
    function create_if_block_1(ctx) {
    	let areaseries;
    	let current;

    	areaseries = new AreaSeries({
    			props: {
    				xValues: /*axRight*/ ctx[12],
    				yValues: /*afRight*/ ctx[14],
    				lineColor: "transparent",
    				fillColor: /*areaColor*/ ctx[1]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(areaseries.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(areaseries, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const areaseries_changes = {};
    			if (dirty & /*axRight*/ 4096) areaseries_changes.xValues = /*axRight*/ ctx[12];
    			if (dirty & /*afRight*/ 16384) areaseries_changes.yValues = /*afRight*/ ctx[14];
    			if (dirty & /*areaColor*/ 2) areaseries_changes.fillColor = /*areaColor*/ ctx[1];
    			areaseries.$set(areaseries_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(areaseries.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(areaseries.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(areaseries, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(56:3) {#if axRight !== undefined && axRight.length > 1 && (tail === \\\"right\\\" || tail === \\\"both\\\")}",
    		ctx
    	});

    	return block;
    }

    // (64:3) {#if cx.length > 0}
    function create_if_block$1(ctx) {
    	let segments;
    	let current;

    	segments = new Segments({
    			props: {
    				xStart: /*cx*/ ctx[15],
    				xEnd: /*cx*/ ctx[15],
    				yStart: rep(0, /*cf*/ ctx[16].length),
    				yEnd: /*cf*/ ctx[16],
    				lineColor: /*statColor*/ ctx[2]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(segments.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(segments, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const segments_changes = {};
    			if (dirty & /*cx*/ 32768) segments_changes.xStart = /*cx*/ ctx[15];
    			if (dirty & /*cx*/ 32768) segments_changes.xEnd = /*cx*/ ctx[15];
    			if (dirty & /*cf*/ 65536) segments_changes.yStart = rep(0, /*cf*/ ctx[16].length);
    			if (dirty & /*cf*/ 65536) segments_changes.yEnd = /*cf*/ ctx[16];
    			if (dirty & /*statColor*/ 4) segments_changes.lineColor = /*statColor*/ ctx[2];
    			segments.$set(segments_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(segments.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(segments.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(segments, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(64:3) {#if cx.length > 0}",
    		ctx
    	});

    	return block;
    }

    // (44:0) <Axes {limX} {limY} {xLabel} {yLabel} {title}>
    function create_default_slot$6(ctx) {
    	let t0;
    	let t1;
    	let t2;
    	let t3;
    	let lineseries;
    	let t4;
    	let t5;
    	let t6;
    	let current;
    	const box_slot_template = /*#slots*/ ctx[19].box;
    	const box_slot = create_slot(box_slot_template, ctx, /*$$scope*/ ctx[20], get_box_slot_context);
    	const legend_slot_template = /*#slots*/ ctx[19].legend;
    	const legend_slot = create_slot(legend_slot_template, ctx, /*$$scope*/ ctx[20], get_legend_slot_context$1);
    	let if_block0 = /*axLeft*/ ctx[11] && /*axLeft*/ ctx[11].length > 1 && (/*tail*/ ctx[5] === "left" || /*tail*/ ctx[5] === "both") && create_if_block_2(ctx);
    	let if_block1 = /*axRight*/ ctx[12] !== undefined && /*axRight*/ ctx[12].length > 1 && (/*tail*/ ctx[5] === "right" || /*tail*/ ctx[5] === "both") && create_if_block_1(ctx);

    	lineseries = new LineSeries({
    			props: {
    				xValues: /*x*/ ctx[3],
    				yValues: /*f*/ ctx[4],
    				lineColor: /*lineColor*/ ctx[0]
    			},
    			$$inline: true
    		});

    	let if_block2 = /*cx*/ ctx[15].length > 0 && create_if_block$1(ctx);
    	const default_slot_template = /*#slots*/ ctx[19].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[20], null);
    	const yaxis_slot_template = /*#slots*/ ctx[19].yaxis;
    	const yaxis_slot = create_slot(yaxis_slot_template, ctx, /*$$scope*/ ctx[20], get_yaxis_slot_context);

    	const block = {
    		c: function create() {
    			if (box_slot) box_slot.c();
    			t0 = space();
    			if (legend_slot) legend_slot.c();
    			t1 = space();
    			if (if_block0) if_block0.c();
    			t2 = space();
    			if (if_block1) if_block1.c();
    			t3 = space();
    			create_component(lineseries.$$.fragment);
    			t4 = space();
    			if (if_block2) if_block2.c();
    			t5 = space();
    			if (default_slot) default_slot.c();
    			t6 = space();
    			if (yaxis_slot) yaxis_slot.c();
    		},
    		m: function mount(target, anchor) {
    			if (box_slot) {
    				box_slot.m(target, anchor);
    			}

    			insert_dev(target, t0, anchor);

    			if (legend_slot) {
    				legend_slot.m(target, anchor);
    			}

    			insert_dev(target, t1, anchor);
    			if (if_block0) if_block0.m(target, anchor);
    			insert_dev(target, t2, anchor);
    			if (if_block1) if_block1.m(target, anchor);
    			insert_dev(target, t3, anchor);
    			mount_component(lineseries, target, anchor);
    			insert_dev(target, t4, anchor);
    			if (if_block2) if_block2.m(target, anchor);
    			insert_dev(target, t5, anchor);

    			if (default_slot) {
    				default_slot.m(target, anchor);
    			}

    			insert_dev(target, t6, anchor);

    			if (yaxis_slot) {
    				yaxis_slot.m(target, anchor);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (box_slot) {
    				if (box_slot.p && (!current || dirty & /*$$scope*/ 1048576)) {
    					update_slot(box_slot, box_slot_template, ctx, /*$$scope*/ ctx[20], dirty, get_box_slot_changes, get_box_slot_context);
    				}
    			}

    			if (legend_slot) {
    				if (legend_slot.p && (!current || dirty & /*$$scope*/ 1048576)) {
    					update_slot(legend_slot, legend_slot_template, ctx, /*$$scope*/ ctx[20], dirty, get_legend_slot_changes$1, get_legend_slot_context$1);
    				}
    			}

    			if (/*axLeft*/ ctx[11] && /*axLeft*/ ctx[11].length > 1 && (/*tail*/ ctx[5] === "left" || /*tail*/ ctx[5] === "both")) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);

    					if (dirty & /*axLeft, tail*/ 2080) {
    						transition_in(if_block0, 1);
    					}
    				} else {
    					if_block0 = create_if_block_2(ctx);
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(t2.parentNode, t2);
    				}
    			} else if (if_block0) {
    				group_outros();

    				transition_out(if_block0, 1, 1, () => {
    					if_block0 = null;
    				});

    				check_outros();
    			}

    			if (/*axRight*/ ctx[12] !== undefined && /*axRight*/ ctx[12].length > 1 && (/*tail*/ ctx[5] === "right" || /*tail*/ ctx[5] === "both")) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);

    					if (dirty & /*axRight, tail*/ 4128) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block_1(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(t3.parentNode, t3);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}

    			const lineseries_changes = {};
    			if (dirty & /*x*/ 8) lineseries_changes.xValues = /*x*/ ctx[3];
    			if (dirty & /*f*/ 16) lineseries_changes.yValues = /*f*/ ctx[4];
    			if (dirty & /*lineColor*/ 1) lineseries_changes.lineColor = /*lineColor*/ ctx[0];
    			lineseries.$set(lineseries_changes);

    			if (/*cx*/ ctx[15].length > 0) {
    				if (if_block2) {
    					if_block2.p(ctx, dirty);

    					if (dirty & /*cx*/ 32768) {
    						transition_in(if_block2, 1);
    					}
    				} else {
    					if_block2 = create_if_block$1(ctx);
    					if_block2.c();
    					transition_in(if_block2, 1);
    					if_block2.m(t5.parentNode, t5);
    				}
    			} else if (if_block2) {
    				group_outros();

    				transition_out(if_block2, 1, 1, () => {
    					if_block2 = null;
    				});

    				check_outros();
    			}

    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 1048576)) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[20], dirty, null, null);
    				}
    			}

    			if (yaxis_slot) {
    				if (yaxis_slot.p && (!current || dirty & /*$$scope*/ 1048576)) {
    					update_slot(yaxis_slot, yaxis_slot_template, ctx, /*$$scope*/ ctx[20], dirty, get_yaxis_slot_changes, get_yaxis_slot_context);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(box_slot, local);
    			transition_in(legend_slot, local);
    			transition_in(if_block0);
    			transition_in(if_block1);
    			transition_in(lineseries.$$.fragment, local);
    			transition_in(if_block2);
    			transition_in(default_slot, local);
    			transition_in(yaxis_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(box_slot, local);
    			transition_out(legend_slot, local);
    			transition_out(if_block0);
    			transition_out(if_block1);
    			transition_out(lineseries.$$.fragment, local);
    			transition_out(if_block2);
    			transition_out(default_slot, local);
    			transition_out(yaxis_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (box_slot) box_slot.d(detaching);
    			if (detaching) detach_dev(t0);
    			if (legend_slot) legend_slot.d(detaching);
    			if (detaching) detach_dev(t1);
    			if (if_block0) if_block0.d(detaching);
    			if (detaching) detach_dev(t2);
    			if (if_block1) if_block1.d(detaching);
    			if (detaching) detach_dev(t3);
    			destroy_component(lineseries, detaching);
    			if (detaching) detach_dev(t4);
    			if (if_block2) if_block2.d(detaching);
    			if (detaching) detach_dev(t5);
    			if (default_slot) default_slot.d(detaching);
    			if (detaching) detach_dev(t6);
    			if (yaxis_slot) yaxis_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$6.name,
    		type: "slot",
    		source: "(44:0) <Axes {limX} {limY} {xLabel} {yLabel} {title}>",
    		ctx
    	});

    	return block;
    }

    // (70:3) 
    function create_xaxis_slot$1(ctx) {
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
    		id: create_xaxis_slot$1.name,
    		type: "slot",
    		source: "(70:3) ",
    		ctx
    	});

    	return block;
    }

    function create_fragment$6(ctx) {
    	let axes;
    	let current;

    	axes = new Axes({
    			props: {
    				limX: /*limX*/ ctx[6],
    				limY: /*limY*/ ctx[7],
    				xLabel: /*xLabel*/ ctx[8],
    				yLabel: /*yLabel*/ ctx[9],
    				title: /*title*/ ctx[10],
    				$$slots: {
    					xaxis: [create_xaxis_slot$1],
    					default: [create_default_slot$6]
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
    			if (dirty & /*limX*/ 64) axes_changes.limX = /*limX*/ ctx[6];
    			if (dirty & /*limY*/ 128) axes_changes.limY = /*limY*/ ctx[7];
    			if (dirty & /*xLabel*/ 256) axes_changes.xLabel = /*xLabel*/ ctx[8];
    			if (dirty & /*yLabel*/ 512) axes_changes.yLabel = /*yLabel*/ ctx[9];
    			if (dirty & /*title*/ 1024) axes_changes.title = /*title*/ ctx[10];

    			if (dirty & /*$$scope, cx, cf, statColor, x, f, lineColor, axRight, afRight, areaColor, tail, axLeft, afLeft*/ 1177663) {
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
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("DistributionPlot", slots, ['box','legend','default','yaxis']);
    	let { lineColor = "#000000" } = $$props;
    	let { areaColor = lineColor + "40" } = $$props;
    	let { statColor = "#000000" } = $$props;
    	let { x } = $$props;
    	let { f } = $$props;
    	let { crit = [] } = $$props;
    	let { tail = "left" } = $$props;
    	let { limX = mrange(x, 0.1) } = $$props;
    	let { limY = [0, max(f) * 1.2] } = $$props;
    	let { xLabel = "" } = $$props;
    	let { yLabel = undefined } = $$props;
    	let { title = null } = $$props;
    	let axLeft = [], axRight = [], afLeft = [], afRight = [];
    	let cxInd, cx, cf;

    	const writable_props = [
    		"lineColor",
    		"areaColor",
    		"statColor",
    		"x",
    		"f",
    		"crit",
    		"tail",
    		"limX",
    		"limY",
    		"xLabel",
    		"yLabel",
    		"title"
    	];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<DistributionPlot> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("lineColor" in $$props) $$invalidate(0, lineColor = $$props.lineColor);
    		if ("areaColor" in $$props) $$invalidate(1, areaColor = $$props.areaColor);
    		if ("statColor" in $$props) $$invalidate(2, statColor = $$props.statColor);
    		if ("x" in $$props) $$invalidate(3, x = $$props.x);
    		if ("f" in $$props) $$invalidate(4, f = $$props.f);
    		if ("crit" in $$props) $$invalidate(17, crit = $$props.crit);
    		if ("tail" in $$props) $$invalidate(5, tail = $$props.tail);
    		if ("limX" in $$props) $$invalidate(6, limX = $$props.limX);
    		if ("limY" in $$props) $$invalidate(7, limY = $$props.limY);
    		if ("xLabel" in $$props) $$invalidate(8, xLabel = $$props.xLabel);
    		if ("yLabel" in $$props) $$invalidate(9, yLabel = $$props.yLabel);
    		if ("title" in $$props) $$invalidate(10, title = $$props.title);
    		if ("$$scope" in $$props) $$invalidate(20, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		max,
    		mrange,
    		subset,
    		seq,
    		rep,
    		closestIndex,
    		Axes,
    		XAxis,
    		LineSeries,
    		AreaSeries,
    		Segments,
    		lineColor,
    		areaColor,
    		statColor,
    		x,
    		f,
    		crit,
    		tail,
    		limX,
    		limY,
    		xLabel,
    		yLabel,
    		title,
    		axLeft,
    		axRight,
    		afLeft,
    		afRight,
    		cxInd,
    		cx,
    		cf
    	});

    	$$self.$inject_state = $$props => {
    		if ("lineColor" in $$props) $$invalidate(0, lineColor = $$props.lineColor);
    		if ("areaColor" in $$props) $$invalidate(1, areaColor = $$props.areaColor);
    		if ("statColor" in $$props) $$invalidate(2, statColor = $$props.statColor);
    		if ("x" in $$props) $$invalidate(3, x = $$props.x);
    		if ("f" in $$props) $$invalidate(4, f = $$props.f);
    		if ("crit" in $$props) $$invalidate(17, crit = $$props.crit);
    		if ("tail" in $$props) $$invalidate(5, tail = $$props.tail);
    		if ("limX" in $$props) $$invalidate(6, limX = $$props.limX);
    		if ("limY" in $$props) $$invalidate(7, limY = $$props.limY);
    		if ("xLabel" in $$props) $$invalidate(8, xLabel = $$props.xLabel);
    		if ("yLabel" in $$props) $$invalidate(9, yLabel = $$props.yLabel);
    		if ("title" in $$props) $$invalidate(10, title = $$props.title);
    		if ("axLeft" in $$props) $$invalidate(11, axLeft = $$props.axLeft);
    		if ("axRight" in $$props) $$invalidate(12, axRight = $$props.axRight);
    		if ("afLeft" in $$props) $$invalidate(13, afLeft = $$props.afLeft);
    		if ("afRight" in $$props) $$invalidate(14, afRight = $$props.afRight);
    		if ("cxInd" in $$props) $$invalidate(18, cxInd = $$props.cxInd);
    		if ("cx" in $$props) $$invalidate(15, cx = $$props.cx);
    		if ("cf" in $$props) $$invalidate(16, cf = $$props.cf);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*crit, x, cxInd, f, tail*/ 393272) {
    			{
    				$$invalidate(18, cxInd = crit.map(v => closestIndex(x, v) + 1));
    				$$invalidate(15, cx = subset(x, cxInd));
    				$$invalidate(16, cf = subset(f, cxInd));

    				if (tail === "left" || tail === "both") {
    					const indLeft = cxInd[0] >= 1 ? seq(1, cxInd[0]) : [];
    					$$invalidate(11, axLeft = subset(x, indLeft));
    					$$invalidate(13, afLeft = subset(f, indLeft));
    				}

    				if (tail === "right" || tail === "both") {
    					const indRight = seq(cxInd.length > 1 ? cxInd[1] : cxInd[0], x.length);
    					$$invalidate(12, axRight = subset(x, indRight));
    					$$invalidate(14, afRight = subset(f, indRight));
    				}
    			}
    		}
    	};

    	return [
    		lineColor,
    		areaColor,
    		statColor,
    		x,
    		f,
    		tail,
    		limX,
    		limY,
    		xLabel,
    		yLabel,
    		title,
    		axLeft,
    		axRight,
    		afLeft,
    		afRight,
    		cx,
    		cf,
    		crit,
    		cxInd,
    		slots,
    		$$scope
    	];
    }

    class DistributionPlot extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {
    			lineColor: 0,
    			areaColor: 1,
    			statColor: 2,
    			x: 3,
    			f: 4,
    			crit: 17,
    			tail: 5,
    			limX: 6,
    			limY: 7,
    			xLabel: 8,
    			yLabel: 9,
    			title: 10
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "DistributionPlot",
    			options,
    			id: create_fragment$6.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*x*/ ctx[3] === undefined && !("x" in props)) {
    			console.warn("<DistributionPlot> was created without expected prop 'x'");
    		}

    		if (/*f*/ ctx[4] === undefined && !("f" in props)) {
    			console.warn("<DistributionPlot> was created without expected prop 'f'");
    		}
    	}

    	get lineColor() {
    		throw new Error("<DistributionPlot>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set lineColor(value) {
    		throw new Error("<DistributionPlot>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get areaColor() {
    		throw new Error("<DistributionPlot>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set areaColor(value) {
    		throw new Error("<DistributionPlot>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get statColor() {
    		throw new Error("<DistributionPlot>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set statColor(value) {
    		throw new Error("<DistributionPlot>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get x() {
    		throw new Error("<DistributionPlot>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set x(value) {
    		throw new Error("<DistributionPlot>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get f() {
    		throw new Error("<DistributionPlot>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set f(value) {
    		throw new Error("<DistributionPlot>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get crit() {
    		throw new Error("<DistributionPlot>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set crit(value) {
    		throw new Error("<DistributionPlot>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get tail() {
    		throw new Error("<DistributionPlot>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set tail(value) {
    		throw new Error("<DistributionPlot>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get limX() {
    		throw new Error("<DistributionPlot>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set limX(value) {
    		throw new Error("<DistributionPlot>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get limY() {
    		throw new Error("<DistributionPlot>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set limY(value) {
    		throw new Error("<DistributionPlot>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get xLabel() {
    		throw new Error("<DistributionPlot>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set xLabel(value) {
    		throw new Error("<DistributionPlot>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get yLabel() {
    		throw new Error("<DistributionPlot>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set yLabel(value) {
    		throw new Error("<DistributionPlot>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get title() {
    		throw new Error("<DistributionPlot>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set title(value) {
    		throw new Error("<DistributionPlot>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* ../shared/plots/MeanPopulationPlot.svelte generated by Svelte v3.38.2 */

    // (35:0) <Axes title={`Population: µ = ${popMean}, σ = ${popSD.toFixed(1)}`} xLabel={"Chloride in water, [mg/L]"} {limX} {limY}>
    function create_default_slot$5(ctx) {
    	let t0;
    	let lineseries;
    	let t1;
    	let areaseries;
    	let t2;
    	let segments0;
    	let t3;
    	let scatterseries;
    	let t4;
    	let segments1;
    	let t5;
    	let textlegend;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[14].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[15], null);

    	lineseries = new LineSeries({
    			props: {
    				xValues: /*popX*/ ctx[7],
    				yValues: /*popY*/ ctx[8],
    				lineColor: /*popColor*/ ctx[3]
    			},
    			$$inline: true
    		});

    	areaseries = new AreaSeries({
    			props: {
    				xValues: /*popX*/ ctx[7],
    				yValues: /*popY*/ ctx[8],
    				lineColor: "transparent",
    				fillColor: /*popAreaColor*/ ctx[4]
    			},
    			$$inline: true
    		});

    	segments0 = new Segments({
    			props: {
    				xStart: [/*sampMean*/ ctx[11]],
    				xEnd: [/*sampMean*/ ctx[11]],
    				yStart: [0],
    				yEnd: [max(/*popY*/ ctx[8])],
    				lineColor: /*sampColor*/ ctx[5],
    				lineType: 3
    			},
    			$$inline: true
    		});

    	scatterseries = new ScatterSeries({
    			props: {
    				xValues: /*sample*/ ctx[2],
    				yValues: /*sampY*/ ctx[10],
    				borderWidth: 2,
    				markerSize: 1.25,
    				faceColor: "transparent",
    				borderColor: /*sampColor*/ ctx[5]
    			},
    			$$inline: true
    		});

    	segments1 = new Segments({
    			props: {
    				xStart: [/*popMean*/ ctx[0]],
    				xEnd: [/*popMean*/ ctx[0]],
    				yStart: [0],
    				yEnd: [max(/*popY*/ ctx[8])],
    				lineColor: /*popColor*/ ctx[3],
    				lineType: 2
    			},
    			$$inline: true
    		});

    	textlegend = new TextLegend({
    			props: {
    				textSize: 1.15,
    				left: /*left*/ ctx[9],
    				top: max(/*popY*/ ctx[8]) * 0.9,
    				dx: "0",
    				elements: /*labelsStr*/ ctx[13]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			if (default_slot) default_slot.c();
    			t0 = space();
    			create_component(lineseries.$$.fragment);
    			t1 = space();
    			create_component(areaseries.$$.fragment);
    			t2 = space();
    			create_component(segments0.$$.fragment);
    			t3 = space();
    			create_component(scatterseries.$$.fragment);
    			t4 = space();
    			create_component(segments1.$$.fragment);
    			t5 = space();
    			create_component(textlegend.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			if (default_slot) {
    				default_slot.m(target, anchor);
    			}

    			insert_dev(target, t0, anchor);
    			mount_component(lineseries, target, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(areaseries, target, anchor);
    			insert_dev(target, t2, anchor);
    			mount_component(segments0, target, anchor);
    			insert_dev(target, t3, anchor);
    			mount_component(scatterseries, target, anchor);
    			insert_dev(target, t4, anchor);
    			mount_component(segments1, target, anchor);
    			insert_dev(target, t5, anchor);
    			mount_component(textlegend, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 32768)) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[15], dirty, null, null);
    				}
    			}

    			const lineseries_changes = {};
    			if (dirty & /*popX*/ 128) lineseries_changes.xValues = /*popX*/ ctx[7];
    			if (dirty & /*popY*/ 256) lineseries_changes.yValues = /*popY*/ ctx[8];
    			if (dirty & /*popColor*/ 8) lineseries_changes.lineColor = /*popColor*/ ctx[3];
    			lineseries.$set(lineseries_changes);
    			const areaseries_changes = {};
    			if (dirty & /*popX*/ 128) areaseries_changes.xValues = /*popX*/ ctx[7];
    			if (dirty & /*popY*/ 256) areaseries_changes.yValues = /*popY*/ ctx[8];
    			if (dirty & /*popAreaColor*/ 16) areaseries_changes.fillColor = /*popAreaColor*/ ctx[4];
    			areaseries.$set(areaseries_changes);
    			const segments0_changes = {};
    			if (dirty & /*sampMean*/ 2048) segments0_changes.xStart = [/*sampMean*/ ctx[11]];
    			if (dirty & /*sampMean*/ 2048) segments0_changes.xEnd = [/*sampMean*/ ctx[11]];
    			if (dirty & /*popY*/ 256) segments0_changes.yEnd = [max(/*popY*/ ctx[8])];
    			if (dirty & /*sampColor*/ 32) segments0_changes.lineColor = /*sampColor*/ ctx[5];
    			segments0.$set(segments0_changes);
    			const scatterseries_changes = {};
    			if (dirty & /*sample*/ 4) scatterseries_changes.xValues = /*sample*/ ctx[2];
    			if (dirty & /*sampY*/ 1024) scatterseries_changes.yValues = /*sampY*/ ctx[10];
    			if (dirty & /*sampColor*/ 32) scatterseries_changes.borderColor = /*sampColor*/ ctx[5];
    			scatterseries.$set(scatterseries_changes);
    			const segments1_changes = {};
    			if (dirty & /*popMean*/ 1) segments1_changes.xStart = [/*popMean*/ ctx[0]];
    			if (dirty & /*popMean*/ 1) segments1_changes.xEnd = [/*popMean*/ ctx[0]];
    			if (dirty & /*popY*/ 256) segments1_changes.yEnd = [max(/*popY*/ ctx[8])];
    			if (dirty & /*popColor*/ 8) segments1_changes.lineColor = /*popColor*/ ctx[3];
    			segments1.$set(segments1_changes);
    			const textlegend_changes = {};
    			if (dirty & /*left*/ 512) textlegend_changes.left = /*left*/ ctx[9];
    			if (dirty & /*popY*/ 256) textlegend_changes.top = max(/*popY*/ ctx[8]) * 0.9;
    			if (dirty & /*labelsStr*/ 8192) textlegend_changes.elements = /*labelsStr*/ ctx[13];
    			textlegend.$set(textlegend_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			transition_in(lineseries.$$.fragment, local);
    			transition_in(areaseries.$$.fragment, local);
    			transition_in(segments0.$$.fragment, local);
    			transition_in(scatterseries.$$.fragment, local);
    			transition_in(segments1.$$.fragment, local);
    			transition_in(textlegend.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			transition_out(lineseries.$$.fragment, local);
    			transition_out(areaseries.$$.fragment, local);
    			transition_out(segments0.$$.fragment, local);
    			transition_out(scatterseries.$$.fragment, local);
    			transition_out(segments1.$$.fragment, local);
    			transition_out(textlegend.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (default_slot) default_slot.d(detaching);
    			if (detaching) detach_dev(t0);
    			destroy_component(lineseries, detaching);
    			if (detaching) detach_dev(t1);
    			destroy_component(areaseries, detaching);
    			if (detaching) detach_dev(t2);
    			destroy_component(segments0, detaching);
    			if (detaching) detach_dev(t3);
    			destroy_component(scatterseries, detaching);
    			if (detaching) detach_dev(t4);
    			destroy_component(segments1, detaching);
    			if (detaching) detach_dev(t5);
    			destroy_component(textlegend, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$5.name,
    		type: "slot",
    		source: "(35:0) <Axes title={`Population: µ = ${popMean}, σ = ${popSD.toFixed(1)}`} xLabel={\\\"Chloride in water, [mg/L]\\\"} {limX} {limY}>",
    		ctx
    	});

    	return block;
    }

    // (51:3) 
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
    		source: "(51:3) ",
    		ctx
    	});

    	return block;
    }

    function create_fragment$5(ctx) {
    	let axes;
    	let current;

    	axes = new Axes({
    			props: {
    				title: `Population: µ = ${/*popMean*/ ctx[0]}, σ = ${/*popSD*/ ctx[1].toFixed(1)}`,
    				xLabel: "Chloride in water, [mg/L]",
    				limX: /*limX*/ ctx[6],
    				limY: /*limY*/ ctx[12],
    				$$slots: {
    					xaxis: [create_xaxis_slot],
    					default: [create_default_slot$5]
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
    			if (dirty & /*popMean, popSD*/ 3) axes_changes.title = `Population: µ = ${/*popMean*/ ctx[0]}, σ = ${/*popSD*/ ctx[1].toFixed(1)}`;
    			if (dirty & /*limX*/ 64) axes_changes.limX = /*limX*/ ctx[6];
    			if (dirty & /*limY*/ 4096) axes_changes.limY = /*limY*/ ctx[12];

    			if (dirty & /*$$scope, left, popY, labelsStr, popMean, popColor, sample, sampY, sampColor, sampMean, popX, popAreaColor*/ 44989) {
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
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let left;
    	let popX;
    	let popY;
    	let sampY;
    	let sampMean;
    	let limY;
    	let labelsStr;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("MeanPopulationPlot", slots, ['default']);
    	let { popMean } = $$props;
    	let { popSD } = $$props;
    	let { sample } = $$props;
    	let { popColor } = $$props;
    	let { popAreaColor } = $$props;
    	let { sampColor } = $$props;
    	let { limX = [80, 120] } = $$props;
    	const writable_props = ["popMean", "popSD", "sample", "popColor", "popAreaColor", "sampColor", "limX"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<MeanPopulationPlot> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("popMean" in $$props) $$invalidate(0, popMean = $$props.popMean);
    		if ("popSD" in $$props) $$invalidate(1, popSD = $$props.popSD);
    		if ("sample" in $$props) $$invalidate(2, sample = $$props.sample);
    		if ("popColor" in $$props) $$invalidate(3, popColor = $$props.popColor);
    		if ("popAreaColor" in $$props) $$invalidate(4, popAreaColor = $$props.popAreaColor);
    		if ("sampColor" in $$props) $$invalidate(5, sampColor = $$props.sampColor);
    		if ("limX" in $$props) $$invalidate(6, limX = $$props.limX);
    		if ("$$scope" in $$props) $$invalidate(15, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		seq,
    		dnorm,
    		rep,
    		mean,
    		sd,
    		max,
    		mrange,
    		range,
    		Axes,
    		XAxis,
    		LineSeries,
    		Segments,
    		TextLegend,
    		ScatterSeries,
    		AreaSeries,
    		formatLabels,
    		popMean,
    		popSD,
    		sample,
    		popColor,
    		popAreaColor,
    		sampColor,
    		limX,
    		left,
    		popX,
    		popY,
    		sampY,
    		sampMean,
    		limY,
    		labelsStr
    	});

    	$$self.$inject_state = $$props => {
    		if ("popMean" in $$props) $$invalidate(0, popMean = $$props.popMean);
    		if ("popSD" in $$props) $$invalidate(1, popSD = $$props.popSD);
    		if ("sample" in $$props) $$invalidate(2, sample = $$props.sample);
    		if ("popColor" in $$props) $$invalidate(3, popColor = $$props.popColor);
    		if ("popAreaColor" in $$props) $$invalidate(4, popAreaColor = $$props.popAreaColor);
    		if ("sampColor" in $$props) $$invalidate(5, sampColor = $$props.sampColor);
    		if ("limX" in $$props) $$invalidate(6, limX = $$props.limX);
    		if ("left" in $$props) $$invalidate(9, left = $$props.left);
    		if ("popX" in $$props) $$invalidate(7, popX = $$props.popX);
    		if ("popY" in $$props) $$invalidate(8, popY = $$props.popY);
    		if ("sampY" in $$props) $$invalidate(10, sampY = $$props.sampY);
    		if ("sampMean" in $$props) $$invalidate(11, sampMean = $$props.sampMean);
    		if ("limY" in $$props) $$invalidate(12, limY = $$props.limY);
    		if ("labelsStr" in $$props) $$invalidate(13, labelsStr = $$props.labelsStr);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*limX*/ 64) {
    			// left position of the legend
    			$$invalidate(9, left = limX[0] + 0.75 * (limX[1] - limX[0]));
    		}

    		if ($$self.$$.dirty & /*popMean, popSD*/ 3) {
    			// parameters of PDF curve
    			$$invalidate(7, popX = seq(popMean - 3.5 * popSD, popMean + 3.5 * popSD, 100));
    		}

    		if ($$self.$$.dirty & /*popX, popMean, popSD*/ 131) {
    			$$invalidate(8, popY = dnorm(popX, popMean, popSD));
    		}

    		if ($$self.$$.dirty & /*popY, sample*/ 260) {
    			// sample statistics
    			$$invalidate(10, sampY = rep(max(popY) * 0.05, sample.length));
    		}

    		if ($$self.$$.dirty & /*sample*/ 4) {
    			$$invalidate(11, sampMean = mean(sample));
    		}

    		if ($$self.$$.dirty & /*popY*/ 256) {
    			// limits for y-axis
    			$$invalidate(12, limY = mrange(popY, 0.01));
    		}

    		if ($$self.$$.dirty & /*sample*/ 4) {
    			// text values for legend
    			$$invalidate(13, labelsStr = formatLabels([
    				{
    					name: "Sample mean",
    					value: mean(sample).toFixed(1)
    				},
    				{
    					name: "Sample sd",
    					value: sd(sample).toFixed(1)
    				}
    			]));
    		}
    	};

    	return [
    		popMean,
    		popSD,
    		sample,
    		popColor,
    		popAreaColor,
    		sampColor,
    		limX,
    		popX,
    		popY,
    		left,
    		sampY,
    		sampMean,
    		limY,
    		labelsStr,
    		slots,
    		$$scope
    	];
    }

    class MeanPopulationPlot extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {
    			popMean: 0,
    			popSD: 1,
    			sample: 2,
    			popColor: 3,
    			popAreaColor: 4,
    			sampColor: 5,
    			limX: 6
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "MeanPopulationPlot",
    			options,
    			id: create_fragment$5.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*popMean*/ ctx[0] === undefined && !("popMean" in props)) {
    			console.warn("<MeanPopulationPlot> was created without expected prop 'popMean'");
    		}

    		if (/*popSD*/ ctx[1] === undefined && !("popSD" in props)) {
    			console.warn("<MeanPopulationPlot> was created without expected prop 'popSD'");
    		}

    		if (/*sample*/ ctx[2] === undefined && !("sample" in props)) {
    			console.warn("<MeanPopulationPlot> was created without expected prop 'sample'");
    		}

    		if (/*popColor*/ ctx[3] === undefined && !("popColor" in props)) {
    			console.warn("<MeanPopulationPlot> was created without expected prop 'popColor'");
    		}

    		if (/*popAreaColor*/ ctx[4] === undefined && !("popAreaColor" in props)) {
    			console.warn("<MeanPopulationPlot> was created without expected prop 'popAreaColor'");
    		}

    		if (/*sampColor*/ ctx[5] === undefined && !("sampColor" in props)) {
    			console.warn("<MeanPopulationPlot> was created without expected prop 'sampColor'");
    		}
    	}

    	get popMean() {
    		throw new Error("<MeanPopulationPlot>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set popMean(value) {
    		throw new Error("<MeanPopulationPlot>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get popSD() {
    		throw new Error("<MeanPopulationPlot>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set popSD(value) {
    		throw new Error("<MeanPopulationPlot>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get sample() {
    		throw new Error("<MeanPopulationPlot>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set sample(value) {
    		throw new Error("<MeanPopulationPlot>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get popColor() {
    		throw new Error("<MeanPopulationPlot>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set popColor(value) {
    		throw new Error("<MeanPopulationPlot>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get popAreaColor() {
    		throw new Error("<MeanPopulationPlot>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set popAreaColor(value) {
    		throw new Error("<MeanPopulationPlot>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get sampColor() {
    		throw new Error("<MeanPopulationPlot>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set sampColor(value) {
    		throw new Error("<MeanPopulationPlot>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get limX() {
    		throw new Error("<MeanPopulationPlot>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set limX(value) {
    		throw new Error("<MeanPopulationPlot>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/PopulationPlot.svelte generated by Svelte v3.38.2 */

    // (35:0) <MeanPopulationPlot {popMean} {popSD} {sample} popColor={colorsPop.line} popAreaColor={colorsPop.area} sampColor={colorsPop.sample}>
    function create_default_slot$4(ctx) {
    	let lineseries;
    	let t0;
    	let areaseries;
    	let t1;
    	let segments;
    	let t2;
    	let textlabels0;
    	let t3;
    	let textlabels1;
    	let current;

    	lineseries = new LineSeries({
    			props: {
    				xValues: /*popH0X*/ ctx[7],
    				yValues: /*popH0Y*/ ctx[8],
    				lineColor: /*colorsH0*/ ctx[5].line
    			},
    			$$inline: true
    		});

    	areaseries = new AreaSeries({
    			props: {
    				xValues: /*popH0X*/ ctx[7],
    				yValues: /*popH0Y*/ ctx[8],
    				lineColor: "transparent",
    				fillColor: /*colorsH0*/ ctx[5].area
    			},
    			$$inline: true
    		});

    	segments = new Segments({
    			props: {
    				xStart: [/*popH0Mean*/ ctx[0]],
    				xEnd: [/*popH0Mean*/ ctx[0]],
    				yStart: [0],
    				yEnd: [max(/*popY*/ ctx[6])],
    				lineColor: /*colorsH0*/ ctx[5].line,
    				lineType: 2
    			},
    			$$inline: true
    		});

    	textlabels0 = new TextLabels({
    			props: {
    				xValues: [/*popH0Mean*/ ctx[0]],
    				yValues: [max(/*popH0Y*/ ctx[8])],
    				labels: ["H0"],
    				pos: 3,
    				faceColor: /*colorsH0*/ ctx[5].stat
    			},
    			$$inline: true
    		});

    	textlabels1 = new TextLabels({
    			props: {
    				xValues: [/*popMean*/ ctx[1]],
    				yValues: [max(/*popY*/ ctx[6])],
    				labels: ["Reality"],
    				pos: 3,
    				faceColor: /*colorsPop*/ ctx[4].stat
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(lineseries.$$.fragment);
    			t0 = space();
    			create_component(areaseries.$$.fragment);
    			t1 = space();
    			create_component(segments.$$.fragment);
    			t2 = space();
    			create_component(textlabels0.$$.fragment);
    			t3 = space();
    			create_component(textlabels1.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(lineseries, target, anchor);
    			insert_dev(target, t0, anchor);
    			mount_component(areaseries, target, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(segments, target, anchor);
    			insert_dev(target, t2, anchor);
    			mount_component(textlabels0, target, anchor);
    			insert_dev(target, t3, anchor);
    			mount_component(textlabels1, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const lineseries_changes = {};
    			if (dirty & /*popH0X*/ 128) lineseries_changes.xValues = /*popH0X*/ ctx[7];
    			if (dirty & /*popH0Y*/ 256) lineseries_changes.yValues = /*popH0Y*/ ctx[8];
    			if (dirty & /*colorsH0*/ 32) lineseries_changes.lineColor = /*colorsH0*/ ctx[5].line;
    			lineseries.$set(lineseries_changes);
    			const areaseries_changes = {};
    			if (dirty & /*popH0X*/ 128) areaseries_changes.xValues = /*popH0X*/ ctx[7];
    			if (dirty & /*popH0Y*/ 256) areaseries_changes.yValues = /*popH0Y*/ ctx[8];
    			if (dirty & /*colorsH0*/ 32) areaseries_changes.fillColor = /*colorsH0*/ ctx[5].area;
    			areaseries.$set(areaseries_changes);
    			const segments_changes = {};
    			if (dirty & /*popH0Mean*/ 1) segments_changes.xStart = [/*popH0Mean*/ ctx[0]];
    			if (dirty & /*popH0Mean*/ 1) segments_changes.xEnd = [/*popH0Mean*/ ctx[0]];
    			if (dirty & /*popY*/ 64) segments_changes.yEnd = [max(/*popY*/ ctx[6])];
    			if (dirty & /*colorsH0*/ 32) segments_changes.lineColor = /*colorsH0*/ ctx[5].line;
    			segments.$set(segments_changes);
    			const textlabels0_changes = {};
    			if (dirty & /*popH0Mean*/ 1) textlabels0_changes.xValues = [/*popH0Mean*/ ctx[0]];
    			if (dirty & /*popH0Y*/ 256) textlabels0_changes.yValues = [max(/*popH0Y*/ ctx[8])];
    			if (dirty & /*colorsH0*/ 32) textlabels0_changes.faceColor = /*colorsH0*/ ctx[5].stat;
    			textlabels0.$set(textlabels0_changes);
    			const textlabels1_changes = {};
    			if (dirty & /*popMean*/ 2) textlabels1_changes.xValues = [/*popMean*/ ctx[1]];
    			if (dirty & /*popY*/ 64) textlabels1_changes.yValues = [max(/*popY*/ ctx[6])];
    			if (dirty & /*colorsPop*/ 16) textlabels1_changes.faceColor = /*colorsPop*/ ctx[4].stat;
    			textlabels1.$set(textlabels1_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(lineseries.$$.fragment, local);
    			transition_in(areaseries.$$.fragment, local);
    			transition_in(segments.$$.fragment, local);
    			transition_in(textlabels0.$$.fragment, local);
    			transition_in(textlabels1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(lineseries.$$.fragment, local);
    			transition_out(areaseries.$$.fragment, local);
    			transition_out(segments.$$.fragment, local);
    			transition_out(textlabels0.$$.fragment, local);
    			transition_out(textlabels1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(lineseries, detaching);
    			if (detaching) detach_dev(t0);
    			destroy_component(areaseries, detaching);
    			if (detaching) detach_dev(t1);
    			destroy_component(segments, detaching);
    			if (detaching) detach_dev(t2);
    			destroy_component(textlabels0, detaching);
    			if (detaching) detach_dev(t3);
    			destroy_component(textlabels1, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$4.name,
    		type: "slot",
    		source: "(35:0) <MeanPopulationPlot {popMean} {popSD} {sample} popColor={colorsPop.line} popAreaColor={colorsPop.area} sampColor={colorsPop.sample}>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let meanpopulationplot;
    	let current;

    	meanpopulationplot = new MeanPopulationPlot({
    			props: {
    				popMean: /*popMean*/ ctx[1],
    				popSD: /*popSD*/ ctx[2],
    				sample: /*sample*/ ctx[3],
    				popColor: /*colorsPop*/ ctx[4].line,
    				popAreaColor: /*colorsPop*/ ctx[4].area,
    				sampColor: /*colorsPop*/ ctx[4].sample,
    				$$slots: { default: [create_default_slot$4] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(meanpopulationplot.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(meanpopulationplot, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const meanpopulationplot_changes = {};
    			if (dirty & /*popMean*/ 2) meanpopulationplot_changes.popMean = /*popMean*/ ctx[1];
    			if (dirty & /*popSD*/ 4) meanpopulationplot_changes.popSD = /*popSD*/ ctx[2];
    			if (dirty & /*sample*/ 8) meanpopulationplot_changes.sample = /*sample*/ ctx[3];
    			if (dirty & /*colorsPop*/ 16) meanpopulationplot_changes.popColor = /*colorsPop*/ ctx[4].line;
    			if (dirty & /*colorsPop*/ 16) meanpopulationplot_changes.popAreaColor = /*colorsPop*/ ctx[4].area;
    			if (dirty & /*colorsPop*/ 16) meanpopulationplot_changes.sampColor = /*colorsPop*/ ctx[4].sample;

    			if (dirty & /*$$scope, popMean, popY, colorsPop, popH0Mean, popH0Y, colorsH0, popH0X*/ 33267) {
    				meanpopulationplot_changes.$$scope = { dirty, ctx };
    			}

    			meanpopulationplot.$set(meanpopulationplot_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(meanpopulationplot.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(meanpopulationplot.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(meanpopulationplot, detaching);
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

    const xLabel$1 = "Chloride in water, [mg/L]";

    function instance$4($$self, $$props, $$invalidate) {
    	let popX;
    	let popY;
    	let popH0X;
    	let popH0Y;
    	let sampY;
    	let sampMean;
    	let title;
    	let limY;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("PopulationPlot", slots, []);
    	let { popH0Mean } = $$props;
    	let { popMean } = $$props;
    	let { popSD } = $$props;
    	let { sample } = $$props;
    	let { colorsPop } = $$props;
    	let { colorsH0 } = $$props;
    	const limX = [80, 120];
    	const writable_props = ["popH0Mean", "popMean", "popSD", "sample", "colorsPop", "colorsH0"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<PopulationPlot> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("popH0Mean" in $$props) $$invalidate(0, popH0Mean = $$props.popH0Mean);
    		if ("popMean" in $$props) $$invalidate(1, popMean = $$props.popMean);
    		if ("popSD" in $$props) $$invalidate(2, popSD = $$props.popSD);
    		if ("sample" in $$props) $$invalidate(3, sample = $$props.sample);
    		if ("colorsPop" in $$props) $$invalidate(4, colorsPop = $$props.colorsPop);
    		if ("colorsH0" in $$props) $$invalidate(5, colorsH0 = $$props.colorsH0);
    	};

    	$$self.$capture_state = () => ({
    		seq,
    		dnorm,
    		rep,
    		mean,
    		max,
    		LineSeries,
    		Segments,
    		TextLabels,
    		ScatterSeries,
    		AreaSeries,
    		DistributionPlot,
    		MeanPopulationPlot,
    		popH0Mean,
    		popMean,
    		popSD,
    		sample,
    		colorsPop,
    		colorsH0,
    		limX,
    		xLabel: xLabel$1,
    		popX,
    		popY,
    		popH0X,
    		popH0Y,
    		sampY,
    		sampMean,
    		title,
    		limY
    	});

    	$$self.$inject_state = $$props => {
    		if ("popH0Mean" in $$props) $$invalidate(0, popH0Mean = $$props.popH0Mean);
    		if ("popMean" in $$props) $$invalidate(1, popMean = $$props.popMean);
    		if ("popSD" in $$props) $$invalidate(2, popSD = $$props.popSD);
    		if ("sample" in $$props) $$invalidate(3, sample = $$props.sample);
    		if ("colorsPop" in $$props) $$invalidate(4, colorsPop = $$props.colorsPop);
    		if ("colorsH0" in $$props) $$invalidate(5, colorsH0 = $$props.colorsH0);
    		if ("popX" in $$props) $$invalidate(9, popX = $$props.popX);
    		if ("popY" in $$props) $$invalidate(6, popY = $$props.popY);
    		if ("popH0X" in $$props) $$invalidate(7, popH0X = $$props.popH0X);
    		if ("popH0Y" in $$props) $$invalidate(8, popH0Y = $$props.popH0Y);
    		if ("sampY" in $$props) sampY = $$props.sampY;
    		if ("sampMean" in $$props) sampMean = $$props.sampMean;
    		if ("title" in $$props) title = $$props.title;
    		if ("limY" in $$props) limY = $$props.limY;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*popMean, popSD*/ 6) {
    			// size of population and axes plus coordinates of the points
    			$$invalidate(9, popX = seq(popMean - 3.5 * popSD, popMean + 3.5 * popSD, 100));
    		}

    		if ($$self.$$.dirty & /*popX, popMean, popSD*/ 518) {
    			$$invalidate(6, popY = dnorm(popX, popMean, popSD));
    		}

    		if ($$self.$$.dirty & /*popH0Mean, popSD*/ 5) {
    			$$invalidate(7, popH0X = seq(popH0Mean - 3.5 * popSD, popH0Mean + 3.5 * popSD, 100));
    		}

    		if ($$self.$$.dirty & /*popH0X, popH0Mean, popSD*/ 133) {
    			$$invalidate(8, popH0Y = dnorm(popH0X, popH0Mean, popSD));
    		}

    		if ($$self.$$.dirty & /*popY, sample*/ 72) {
    			sampY = rep(max(popY) * 0.05, sample.length);
    		}

    		if ($$self.$$.dirty & /*sample*/ 8) {
    			sampMean = mean(sample);
    		}

    		if ($$self.$$.dirty & /*popMean, popSD*/ 6) {
    			title = `Population: µ = ${popMean}, σ = ${popSD.toFixed(1)}`;
    		}

    		if ($$self.$$.dirty & /*popY*/ 64) {
    			limY = [0, max(popY) * 1.1];
    		}
    	};

    	return [
    		popH0Mean,
    		popMean,
    		popSD,
    		sample,
    		colorsPop,
    		colorsH0,
    		popY,
    		popH0X,
    		popH0Y,
    		popX
    	];
    }

    class PopulationPlot extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {
    			popH0Mean: 0,
    			popMean: 1,
    			popSD: 2,
    			sample: 3,
    			colorsPop: 4,
    			colorsH0: 5
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "PopulationPlot",
    			options,
    			id: create_fragment$4.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*popH0Mean*/ ctx[0] === undefined && !("popH0Mean" in props)) {
    			console.warn("<PopulationPlot> was created without expected prop 'popH0Mean'");
    		}

    		if (/*popMean*/ ctx[1] === undefined && !("popMean" in props)) {
    			console.warn("<PopulationPlot> was created without expected prop 'popMean'");
    		}

    		if (/*popSD*/ ctx[2] === undefined && !("popSD" in props)) {
    			console.warn("<PopulationPlot> was created without expected prop 'popSD'");
    		}

    		if (/*sample*/ ctx[3] === undefined && !("sample" in props)) {
    			console.warn("<PopulationPlot> was created without expected prop 'sample'");
    		}

    		if (/*colorsPop*/ ctx[4] === undefined && !("colorsPop" in props)) {
    			console.warn("<PopulationPlot> was created without expected prop 'colorsPop'");
    		}

    		if (/*colorsH0*/ ctx[5] === undefined && !("colorsH0" in props)) {
    			console.warn("<PopulationPlot> was created without expected prop 'colorsH0'");
    		}
    	}

    	get popH0Mean() {
    		throw new Error("<PopulationPlot>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set popH0Mean(value) {
    		throw new Error("<PopulationPlot>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get popMean() {
    		throw new Error("<PopulationPlot>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set popMean(value) {
    		throw new Error("<PopulationPlot>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get popSD() {
    		throw new Error("<PopulationPlot>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set popSD(value) {
    		throw new Error("<PopulationPlot>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get sample() {
    		throw new Error("<PopulationPlot>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set sample(value) {
    		throw new Error("<PopulationPlot>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get colorsPop() {
    		throw new Error("<PopulationPlot>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set colorsPop(value) {
    		throw new Error("<PopulationPlot>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get colorsH0() {
    		throw new Error("<PopulationPlot>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set colorsH0(value) {
    		throw new Error("<PopulationPlot>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* ../shared/plots/TestPlot.svelte generated by Svelte v3.38.2 */
    const get_legend_slot_changes = dirty => ({});
    const get_legend_slot_context = ctx => ({});

    // (69:3) {#if showLegend}
    function create_if_block(ctx) {
    	let textlegend;
    	let current;

    	textlegend = new TextLegend({
    			props: {
    				textSize: 1.15,
    				left: /*limX*/ ctx[6][0],
    				top: max(/*f*/ ctx[1]) * 1.35,
    				dx: "1.5em",
    				dy: "1.35em",
    				elements: /*labelsStr*/ ctx[11]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(textlegend.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(textlegend, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const textlegend_changes = {};
    			if (dirty & /*limX*/ 64) textlegend_changes.left = /*limX*/ ctx[6][0];
    			if (dirty & /*f*/ 2) textlegend_changes.top = max(/*f*/ ctx[1]) * 1.35;
    			if (dirty & /*labelsStr*/ 2048) textlegend_changes.elements = /*labelsStr*/ ctx[11];
    			textlegend.$set(textlegend_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(textlegend.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(textlegend.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(textlegend, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(69:3) {#if showLegend}",
    		ctx
    	});

    	return block;
    }

    // (68:23)     
    function fallback_block(ctx) {
    	let if_block_anchor;
    	let current;
    	let if_block = /*showLegend*/ ctx[5] && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (/*showLegend*/ ctx[5]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*showLegend*/ 32) {
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
    		id: fallback_block.name,
    		type: "fallback",
    		source: "(68:23)     ",
    		ctx
    	});

    	return block;
    }

    // (66:0) <DistributionPlot {x} {f} {xLabel} {crit} {tail} {lineColor} {areaColor} {statColor} {limX} limY={limYLocal} >
    function create_default_slot$3(ctx) {
    	let t;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[22].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[23], null);
    	const legend_slot_template = /*#slots*/ ctx[22].legend;
    	const legend_slot = create_slot(legend_slot_template, ctx, /*$$scope*/ ctx[23], get_legend_slot_context);
    	const legend_slot_or_fallback = legend_slot || fallback_block(ctx);

    	const block = {
    		c: function create() {
    			if (default_slot) default_slot.c();
    			t = space();
    			if (legend_slot_or_fallback) legend_slot_or_fallback.c();
    		},
    		m: function mount(target, anchor) {
    			if (default_slot) {
    				default_slot.m(target, anchor);
    			}

    			insert_dev(target, t, anchor);

    			if (legend_slot_or_fallback) {
    				legend_slot_or_fallback.m(target, anchor);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 8388608)) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[23], dirty, null, null);
    				}
    			}

    			if (legend_slot) {
    				if (legend_slot.p && (!current || dirty & /*$$scope*/ 8388608)) {
    					update_slot(legend_slot, legend_slot_template, ctx, /*$$scope*/ ctx[23], dirty, get_legend_slot_changes, get_legend_slot_context);
    				}
    			} else {
    				if (legend_slot_or_fallback && legend_slot_or_fallback.p && dirty & /*limX, f, labelsStr, showLegend*/ 2146) {
    					legend_slot_or_fallback.p(ctx, dirty);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			transition_in(legend_slot_or_fallback, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			transition_out(legend_slot_or_fallback, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (default_slot) default_slot.d(detaching);
    			if (detaching) detach_dev(t);
    			if (legend_slot_or_fallback) legend_slot_or_fallback.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$3.name,
    		type: "slot",
    		source: "(66:0) <DistributionPlot {x} {f} {xLabel} {crit} {tail} {lineColor} {areaColor} {statColor} {limX} limY={limYLocal} >",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let distributionplot;
    	let current;

    	distributionplot = new DistributionPlot({
    			props: {
    				x: /*x*/ ctx[0],
    				f: /*f*/ ctx[1],
    				xLabel: /*xLabel*/ ctx[4],
    				crit: /*crit*/ ctx[2],
    				tail: /*tail*/ ctx[3],
    				lineColor: /*lineColor*/ ctx[7],
    				areaColor: /*areaColor*/ ctx[8],
    				statColor: /*statColor*/ ctx[9],
    				limX: /*limX*/ ctx[6],
    				limY: /*limYLocal*/ ctx[10],
    				$$slots: { default: [create_default_slot$3] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(distributionplot.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(distributionplot, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const distributionplot_changes = {};
    			if (dirty & /*x*/ 1) distributionplot_changes.x = /*x*/ ctx[0];
    			if (dirty & /*f*/ 2) distributionplot_changes.f = /*f*/ ctx[1];
    			if (dirty & /*xLabel*/ 16) distributionplot_changes.xLabel = /*xLabel*/ ctx[4];
    			if (dirty & /*crit*/ 4) distributionplot_changes.crit = /*crit*/ ctx[2];
    			if (dirty & /*tail*/ 8) distributionplot_changes.tail = /*tail*/ ctx[3];
    			if (dirty & /*lineColor*/ 128) distributionplot_changes.lineColor = /*lineColor*/ ctx[7];
    			if (dirty & /*areaColor*/ 256) distributionplot_changes.areaColor = /*areaColor*/ ctx[8];
    			if (dirty & /*statColor*/ 512) distributionplot_changes.statColor = /*statColor*/ ctx[9];
    			if (dirty & /*limX*/ 64) distributionplot_changes.limX = /*limX*/ ctx[6];
    			if (dirty & /*limYLocal*/ 1024) distributionplot_changes.limY = /*limYLocal*/ ctx[10];

    			if (dirty & /*$$scope, limX, f, labelsStr, showLegend*/ 8390754) {
    				distributionplot_changes.$$scope = { dirty, ctx };
    			}

    			distributionplot.$set(distributionplot_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(distributionplot.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(distributionplot.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(distributionplot, detaching);
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
    	let lineColor;
    	let areaColor;
    	let statColor;
    	let limYLocal;
    	let labelsStr;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("TestPlot", slots, ['default','legend']);
    	let { x } = $$props;
    	let { f } = $$props;
    	let { crit } = $$props;
    	let { tail } = $$props;
    	let { pValue } = $$props;
    	let { alpha } = $$props;
    	let { xLabel } = $$props;
    	let { clicked } = $$props;
    	let { showLegend = true } = $$props;
    	let { H0LegendStr = "" } = $$props;
    	let { reset = false } = $$props;
    	let { limX = mrange(x, 0.1) } = $$props;
    	let { limY = null } = $$props;
    	let { mainColor = "#000000" } = $$props;
    	let { testFailColor = "#ff2211" } = $$props;
    	let nSamples = 0;
    	let nSamplesBelowAlpha = 0;

    	const writable_props = [
    		"x",
    		"f",
    		"crit",
    		"tail",
    		"pValue",
    		"alpha",
    		"xLabel",
    		"clicked",
    		"showLegend",
    		"H0LegendStr",
    		"reset",
    		"limX",
    		"limY",
    		"mainColor",
    		"testFailColor"
    	];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<TestPlot> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("x" in $$props) $$invalidate(0, x = $$props.x);
    		if ("f" in $$props) $$invalidate(1, f = $$props.f);
    		if ("crit" in $$props) $$invalidate(2, crit = $$props.crit);
    		if ("tail" in $$props) $$invalidate(3, tail = $$props.tail);
    		if ("pValue" in $$props) $$invalidate(12, pValue = $$props.pValue);
    		if ("alpha" in $$props) $$invalidate(13, alpha = $$props.alpha);
    		if ("xLabel" in $$props) $$invalidate(4, xLabel = $$props.xLabel);
    		if ("clicked" in $$props) $$invalidate(14, clicked = $$props.clicked);
    		if ("showLegend" in $$props) $$invalidate(5, showLegend = $$props.showLegend);
    		if ("H0LegendStr" in $$props) $$invalidate(15, H0LegendStr = $$props.H0LegendStr);
    		if ("reset" in $$props) $$invalidate(16, reset = $$props.reset);
    		if ("limX" in $$props) $$invalidate(6, limX = $$props.limX);
    		if ("limY" in $$props) $$invalidate(17, limY = $$props.limY);
    		if ("mainColor" in $$props) $$invalidate(18, mainColor = $$props.mainColor);
    		if ("testFailColor" in $$props) $$invalidate(19, testFailColor = $$props.testFailColor);
    		if ("$$scope" in $$props) $$invalidate(23, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		mrange,
    		max,
    		TextLegend,
    		DistributionPlot,
    		formatLabels,
    		x,
    		f,
    		crit,
    		tail,
    		pValue,
    		alpha,
    		xLabel,
    		clicked,
    		showLegend,
    		H0LegendStr,
    		reset,
    		limX,
    		limY,
    		mainColor,
    		testFailColor,
    		nSamples,
    		nSamplesBelowAlpha,
    		lineColor,
    		areaColor,
    		statColor,
    		limYLocal,
    		labelsStr
    	});

    	$$self.$inject_state = $$props => {
    		if ("x" in $$props) $$invalidate(0, x = $$props.x);
    		if ("f" in $$props) $$invalidate(1, f = $$props.f);
    		if ("crit" in $$props) $$invalidate(2, crit = $$props.crit);
    		if ("tail" in $$props) $$invalidate(3, tail = $$props.tail);
    		if ("pValue" in $$props) $$invalidate(12, pValue = $$props.pValue);
    		if ("alpha" in $$props) $$invalidate(13, alpha = $$props.alpha);
    		if ("xLabel" in $$props) $$invalidate(4, xLabel = $$props.xLabel);
    		if ("clicked" in $$props) $$invalidate(14, clicked = $$props.clicked);
    		if ("showLegend" in $$props) $$invalidate(5, showLegend = $$props.showLegend);
    		if ("H0LegendStr" in $$props) $$invalidate(15, H0LegendStr = $$props.H0LegendStr);
    		if ("reset" in $$props) $$invalidate(16, reset = $$props.reset);
    		if ("limX" in $$props) $$invalidate(6, limX = $$props.limX);
    		if ("limY" in $$props) $$invalidate(17, limY = $$props.limY);
    		if ("mainColor" in $$props) $$invalidate(18, mainColor = $$props.mainColor);
    		if ("testFailColor" in $$props) $$invalidate(19, testFailColor = $$props.testFailColor);
    		if ("nSamples" in $$props) $$invalidate(20, nSamples = $$props.nSamples);
    		if ("nSamplesBelowAlpha" in $$props) $$invalidate(21, nSamplesBelowAlpha = $$props.nSamplesBelowAlpha);
    		if ("lineColor" in $$props) $$invalidate(7, lineColor = $$props.lineColor);
    		if ("areaColor" in $$props) $$invalidate(8, areaColor = $$props.areaColor);
    		if ("statColor" in $$props) $$invalidate(9, statColor = $$props.statColor);
    		if ("limYLocal" in $$props) $$invalidate(10, limYLocal = $$props.limYLocal);
    		if ("labelsStr" in $$props) $$invalidate(11, labelsStr = $$props.labelsStr);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*pValue, alpha, testFailColor, mainColor*/ 798720) {
    			$$invalidate(7, lineColor = pValue < alpha ? testFailColor : mainColor);
    		}

    		if ($$self.$$.dirty & /*lineColor*/ 128) {
    			$$invalidate(8, areaColor = lineColor + "40");
    		}

    		if ($$self.$$.dirty & /*lineColor*/ 128) {
    			$$invalidate(9, statColor = lineColor + "90");
    		}

    		if ($$self.$$.dirty & /*limY, f, showLegend*/ 131106) {
    			$$invalidate(10, limYLocal = limY === null
    			? [0, max(f) * (showLegend ? 1.45 : 1.2)]
    			: limY);
    		}

    		if ($$self.$$.dirty & /*clicked, reset, nSamples, nSamplesBelowAlpha, pValue, alpha*/ 3239936) {
    			// cumulative statistics
    			{

    				// reset statistics if sample size, population proportion or a test tail has been changed
    				if (reset) {
    					$$invalidate(20, nSamples = 0);
    					$$invalidate(21, nSamplesBelowAlpha = 0);
    				}

    				// count number of samples taken for the same test conditions and how many have p-value < 0.05
    				$$invalidate(20, nSamples = nSamples + 1);

    				$$invalidate(21, nSamplesBelowAlpha = nSamplesBelowAlpha + (pValue < alpha));
    			}
    		}

    		if ($$self.$$.dirty & /*H0LegendStr, pValue, alpha, testFailColor, nSamplesBelowAlpha, nSamples*/ 3715072) {
    			// text values for stat table
    			$$invalidate(11, labelsStr = formatLabels([
    				{
    					name: H0LegendStr + ", p",
    					value: `<tspan ${pValue < alpha ? "fill=" + testFailColor : ""}>${pValue.toFixed(3)}</tspan>`
    				},
    				{
    					name: `# samples with p < ${alpha}`,
    					value: `${nSamplesBelowAlpha}/${nSamples} (${(100 * nSamplesBelowAlpha / nSamples).toFixed(1)}%)`
    				}
    			]));
    		}
    	};

    	return [
    		x,
    		f,
    		crit,
    		tail,
    		xLabel,
    		showLegend,
    		limX,
    		lineColor,
    		areaColor,
    		statColor,
    		limYLocal,
    		labelsStr,
    		pValue,
    		alpha,
    		clicked,
    		H0LegendStr,
    		reset,
    		limY,
    		mainColor,
    		testFailColor,
    		nSamples,
    		nSamplesBelowAlpha,
    		slots,
    		$$scope
    	];
    }

    class TestPlot extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {
    			x: 0,
    			f: 1,
    			crit: 2,
    			tail: 3,
    			pValue: 12,
    			alpha: 13,
    			xLabel: 4,
    			clicked: 14,
    			showLegend: 5,
    			H0LegendStr: 15,
    			reset: 16,
    			limX: 6,
    			limY: 17,
    			mainColor: 18,
    			testFailColor: 19
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "TestPlot",
    			options,
    			id: create_fragment$3.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*x*/ ctx[0] === undefined && !("x" in props)) {
    			console.warn("<TestPlot> was created without expected prop 'x'");
    		}

    		if (/*f*/ ctx[1] === undefined && !("f" in props)) {
    			console.warn("<TestPlot> was created without expected prop 'f'");
    		}

    		if (/*crit*/ ctx[2] === undefined && !("crit" in props)) {
    			console.warn("<TestPlot> was created without expected prop 'crit'");
    		}

    		if (/*tail*/ ctx[3] === undefined && !("tail" in props)) {
    			console.warn("<TestPlot> was created without expected prop 'tail'");
    		}

    		if (/*pValue*/ ctx[12] === undefined && !("pValue" in props)) {
    			console.warn("<TestPlot> was created without expected prop 'pValue'");
    		}

    		if (/*alpha*/ ctx[13] === undefined && !("alpha" in props)) {
    			console.warn("<TestPlot> was created without expected prop 'alpha'");
    		}

    		if (/*xLabel*/ ctx[4] === undefined && !("xLabel" in props)) {
    			console.warn("<TestPlot> was created without expected prop 'xLabel'");
    		}

    		if (/*clicked*/ ctx[14] === undefined && !("clicked" in props)) {
    			console.warn("<TestPlot> was created without expected prop 'clicked'");
    		}
    	}

    	get x() {
    		throw new Error("<TestPlot>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set x(value) {
    		throw new Error("<TestPlot>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get f() {
    		throw new Error("<TestPlot>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set f(value) {
    		throw new Error("<TestPlot>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get crit() {
    		throw new Error("<TestPlot>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set crit(value) {
    		throw new Error("<TestPlot>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get tail() {
    		throw new Error("<TestPlot>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set tail(value) {
    		throw new Error("<TestPlot>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get pValue() {
    		throw new Error("<TestPlot>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set pValue(value) {
    		throw new Error("<TestPlot>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get alpha() {
    		throw new Error("<TestPlot>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set alpha(value) {
    		throw new Error("<TestPlot>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get xLabel() {
    		throw new Error("<TestPlot>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set xLabel(value) {
    		throw new Error("<TestPlot>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get clicked() {
    		throw new Error("<TestPlot>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set clicked(value) {
    		throw new Error("<TestPlot>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get showLegend() {
    		throw new Error("<TestPlot>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set showLegend(value) {
    		throw new Error("<TestPlot>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get H0LegendStr() {
    		throw new Error("<TestPlot>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set H0LegendStr(value) {
    		throw new Error("<TestPlot>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get reset() {
    		throw new Error("<TestPlot>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set reset(value) {
    		throw new Error("<TestPlot>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get limX() {
    		throw new Error("<TestPlot>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set limX(value) {
    		throw new Error("<TestPlot>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get limY() {
    		throw new Error("<TestPlot>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set limY(value) {
    		throw new Error("<TestPlot>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get mainColor() {
    		throw new Error("<TestPlot>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set mainColor(value) {
    		throw new Error("<TestPlot>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get testFailColor() {
    		throw new Error("<TestPlot>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set testFailColor(value) {
    		throw new Error("<TestPlot>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* ../shared/plots/TTestPlot.svelte generated by Svelte v3.38.2 */

    // (25:0) <TestPlot    {x} {f} {crit} {showLegend} {mainColor} {xLabel} {H0LegendStr} {limX} {limY} {reset} {clicked}    pValue={testRes.pValue}    alpha={testRes.alpha}    tail={testRes.tail} >
    function create_default_slot$2(ctx) {
    	let current;
    	const default_slot_template = /*#slots*/ ctx[13].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[14], null);

    	const block = {
    		c: function create() {
    			if (default_slot) default_slot.c();
    		},
    		m: function mount(target, anchor) {
    			if (default_slot) {
    				default_slot.m(target, anchor);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 16384)) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[14], dirty, null, null);
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
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$2.name,
    		type: "slot",
    		source: "(25:0) <TestPlot    {x} {f} {crit} {showLegend} {mainColor} {xLabel} {H0LegendStr} {limX} {limY} {reset} {clicked}    pValue={testRes.pValue}    alpha={testRes.alpha}    tail={testRes.tail} >",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let testplot;
    	let current;

    	testplot = new TestPlot({
    			props: {
    				x: /*x*/ ctx[9],
    				f: /*f*/ ctx[10],
    				crit: /*crit*/ ctx[11],
    				showLegend: /*showLegend*/ ctx[1],
    				mainColor: /*mainColor*/ ctx[6],
    				xLabel: /*xLabel*/ ctx[3],
    				H0LegendStr: /*H0LegendStr*/ ctx[2],
    				limX: /*limX*/ ctx[4],
    				limY: /*limY*/ ctx[5],
    				reset: /*reset*/ ctx[7],
    				clicked: /*clicked*/ ctx[8],
    				pValue: /*testRes*/ ctx[0].pValue,
    				alpha: /*testRes*/ ctx[0].alpha,
    				tail: /*testRes*/ ctx[0].tail,
    				$$slots: { default: [create_default_slot$2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(testplot.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(testplot, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const testplot_changes = {};
    			if (dirty & /*x*/ 512) testplot_changes.x = /*x*/ ctx[9];
    			if (dirty & /*f*/ 1024) testplot_changes.f = /*f*/ ctx[10];
    			if (dirty & /*crit*/ 2048) testplot_changes.crit = /*crit*/ ctx[11];
    			if (dirty & /*showLegend*/ 2) testplot_changes.showLegend = /*showLegend*/ ctx[1];
    			if (dirty & /*mainColor*/ 64) testplot_changes.mainColor = /*mainColor*/ ctx[6];
    			if (dirty & /*xLabel*/ 8) testplot_changes.xLabel = /*xLabel*/ ctx[3];
    			if (dirty & /*H0LegendStr*/ 4) testplot_changes.H0LegendStr = /*H0LegendStr*/ ctx[2];
    			if (dirty & /*limX*/ 16) testplot_changes.limX = /*limX*/ ctx[4];
    			if (dirty & /*limY*/ 32) testplot_changes.limY = /*limY*/ ctx[5];
    			if (dirty & /*reset*/ 128) testplot_changes.reset = /*reset*/ ctx[7];
    			if (dirty & /*clicked*/ 256) testplot_changes.clicked = /*clicked*/ ctx[8];
    			if (dirty & /*testRes*/ 1) testplot_changes.pValue = /*testRes*/ ctx[0].pValue;
    			if (dirty & /*testRes*/ 1) testplot_changes.alpha = /*testRes*/ ctx[0].alpha;
    			if (dirty & /*testRes*/ 1) testplot_changes.tail = /*testRes*/ ctx[0].tail;

    			if (dirty & /*$$scope*/ 16384) {
    				testplot_changes.$$scope = { dirty, ctx };
    			}

    			testplot.$set(testplot_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(testplot.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(testplot.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(testplot, detaching);
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
    	let t;
    	let x;
    	let f;
    	let crit;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("TTestPlot", slots, ['default']);
    	let { testRes } = $$props;
    	let { showLegend = true } = $$props;
    	let { H0LegendStr = "" } = $$props;
    	let { xLabel = "" } = $$props;
    	let { limX = undefined } = $$props;
    	let { limY = undefined } = $$props;
    	let { mainColor = "#404040" } = $$props;
    	let { reset } = $$props;
    	let { clicked } = $$props;

    	const writable_props = [
    		"testRes",
    		"showLegend",
    		"H0LegendStr",
    		"xLabel",
    		"limX",
    		"limY",
    		"mainColor",
    		"reset",
    		"clicked"
    	];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<TTestPlot> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("testRes" in $$props) $$invalidate(0, testRes = $$props.testRes);
    		if ("showLegend" in $$props) $$invalidate(1, showLegend = $$props.showLegend);
    		if ("H0LegendStr" in $$props) $$invalidate(2, H0LegendStr = $$props.H0LegendStr);
    		if ("xLabel" in $$props) $$invalidate(3, xLabel = $$props.xLabel);
    		if ("limX" in $$props) $$invalidate(4, limX = $$props.limX);
    		if ("limY" in $$props) $$invalidate(5, limY = $$props.limY);
    		if ("mainColor" in $$props) $$invalidate(6, mainColor = $$props.mainColor);
    		if ("reset" in $$props) $$invalidate(7, reset = $$props.reset);
    		if ("clicked" in $$props) $$invalidate(8, clicked = $$props.clicked);
    		if ("$$scope" in $$props) $$invalidate(14, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		seq,
    		max,
    		mrange,
    		dt,
    		TestPlot,
    		testRes,
    		showLegend,
    		H0LegendStr,
    		xLabel,
    		limX,
    		limY,
    		mainColor,
    		reset,
    		clicked,
    		t,
    		x,
    		f,
    		crit
    	});

    	$$self.$inject_state = $$props => {
    		if ("testRes" in $$props) $$invalidate(0, testRes = $$props.testRes);
    		if ("showLegend" in $$props) $$invalidate(1, showLegend = $$props.showLegend);
    		if ("H0LegendStr" in $$props) $$invalidate(2, H0LegendStr = $$props.H0LegendStr);
    		if ("xLabel" in $$props) $$invalidate(3, xLabel = $$props.xLabel);
    		if ("limX" in $$props) $$invalidate(4, limX = $$props.limX);
    		if ("limY" in $$props) $$invalidate(5, limY = $$props.limY);
    		if ("mainColor" in $$props) $$invalidate(6, mainColor = $$props.mainColor);
    		if ("reset" in $$props) $$invalidate(7, reset = $$props.reset);
    		if ("clicked" in $$props) $$invalidate(8, clicked = $$props.clicked);
    		if ("t" in $$props) $$invalidate(12, t = $$props.t);
    		if ("x" in $$props) $$invalidate(9, x = $$props.x);
    		if ("f" in $$props) $$invalidate(10, f = $$props.f);
    		if ("crit" in $$props) $$invalidate(11, crit = $$props.crit);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*t, testRes*/ 4097) {
    			$$invalidate(9, x = t.map(v => v * testRes.se + testRes.effectExpected));
    		}

    		if ($$self.$$.dirty & /*t, testRes*/ 4097) {
    			$$invalidate(10, f = dt(t, testRes.DoF));
    		}

    		if ($$self.$$.dirty & /*testRes*/ 1) {
    			// critical t-value
    			$$invalidate(11, crit = testRes.tail === "both"
    			? [-Math.abs(testRes.effectObserved), Math.abs(testRes.effectObserved)]
    			: [testRes.effectObserved]);
    		}
    	};

    	$$invalidate(12, t = seq(-10, 10, 300));

    	return [
    		testRes,
    		showLegend,
    		H0LegendStr,
    		xLabel,
    		limX,
    		limY,
    		mainColor,
    		reset,
    		clicked,
    		x,
    		f,
    		crit,
    		t,
    		slots,
    		$$scope
    	];
    }

    class TTestPlot extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {
    			testRes: 0,
    			showLegend: 1,
    			H0LegendStr: 2,
    			xLabel: 3,
    			limX: 4,
    			limY: 5,
    			mainColor: 6,
    			reset: 7,
    			clicked: 8
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "TTestPlot",
    			options,
    			id: create_fragment$2.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*testRes*/ ctx[0] === undefined && !("testRes" in props)) {
    			console.warn("<TTestPlot> was created without expected prop 'testRes'");
    		}

    		if (/*reset*/ ctx[7] === undefined && !("reset" in props)) {
    			console.warn("<TTestPlot> was created without expected prop 'reset'");
    		}

    		if (/*clicked*/ ctx[8] === undefined && !("clicked" in props)) {
    			console.warn("<TTestPlot> was created without expected prop 'clicked'");
    		}
    	}

    	get testRes() {
    		throw new Error("<TTestPlot>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set testRes(value) {
    		throw new Error("<TTestPlot>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get showLegend() {
    		throw new Error("<TTestPlot>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set showLegend(value) {
    		throw new Error("<TTestPlot>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get H0LegendStr() {
    		throw new Error("<TTestPlot>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set H0LegendStr(value) {
    		throw new Error("<TTestPlot>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get xLabel() {
    		throw new Error("<TTestPlot>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set xLabel(value) {
    		throw new Error("<TTestPlot>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get limX() {
    		throw new Error("<TTestPlot>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set limX(value) {
    		throw new Error("<TTestPlot>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get limY() {
    		throw new Error("<TTestPlot>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set limY(value) {
    		throw new Error("<TTestPlot>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get mainColor() {
    		throw new Error("<TTestPlot>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set mainColor(value) {
    		throw new Error("<TTestPlot>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get reset() {
    		throw new Error("<TTestPlot>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set reset(value) {
    		throw new Error("<TTestPlot>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get clicked() {
    		throw new Error("<TTestPlot>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set clicked(value) {
    		throw new Error("<TTestPlot>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/TestResults.svelte generated by Svelte v3.38.2 */

    // (46:0) <TTestPlot {mainColor} {clicked} {reset} {testRes} {H0LegendStr} {limX} {xLabel} >
    function create_default_slot$1(ctx) {
    	let lineseries;
    	let t0;
    	let segments;
    	let t1;
    	let textlegend;
    	let current;

    	lineseries = new LineSeries({
    			props: {
    				xValues: /*xr*/ ctx[4],
    				yValues: /*fr*/ ctx[5],
    				lineColor: /*colorsPop*/ ctx[0].sample + "a0"
    			},
    			$$inline: true
    		});

    	segments = new Segments({
    			props: {
    				xStart: [/*testRes*/ ctx[3].effectObserved],
    				xEnd: [/*testRes*/ ctx[3].effectObserved],
    				yStart: [0],
    				yEnd: [max(/*fr*/ ctx[5])],
    				lineColor: /*colorsPop*/ ctx[0].sample,
    				lineType: 2
    			},
    			$$inline: true
    		});

    	textlegend = new TextLegend({
    			props: {
    				textSize: 1.15,
    				top: max(/*fr*/ ctx[5]) * 1.05,
    				dx: "1.5em",
    				dy: "2.7em",
    				left: 85,
    				elements: formatLabels([
    					{
    						name: "power",
    						value: /*power*/ ctx[6].toFixed(3)
    					}
    				])
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(lineseries.$$.fragment);
    			t0 = space();
    			create_component(segments.$$.fragment);
    			t1 = space();
    			create_component(textlegend.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(lineseries, target, anchor);
    			insert_dev(target, t0, anchor);
    			mount_component(segments, target, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(textlegend, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const lineseries_changes = {};
    			if (dirty & /*xr*/ 16) lineseries_changes.xValues = /*xr*/ ctx[4];
    			if (dirty & /*fr*/ 32) lineseries_changes.yValues = /*fr*/ ctx[5];
    			if (dirty & /*colorsPop*/ 1) lineseries_changes.lineColor = /*colorsPop*/ ctx[0].sample + "a0";
    			lineseries.$set(lineseries_changes);
    			const segments_changes = {};
    			if (dirty & /*testRes*/ 8) segments_changes.xStart = [/*testRes*/ ctx[3].effectObserved];
    			if (dirty & /*testRes*/ 8) segments_changes.xEnd = [/*testRes*/ ctx[3].effectObserved];
    			if (dirty & /*fr*/ 32) segments_changes.yEnd = [max(/*fr*/ ctx[5])];
    			if (dirty & /*colorsPop*/ 1) segments_changes.lineColor = /*colorsPop*/ ctx[0].sample;
    			segments.$set(segments_changes);
    			const textlegend_changes = {};
    			if (dirty & /*fr*/ 32) textlegend_changes.top = max(/*fr*/ ctx[5]) * 1.05;

    			if (dirty & /*power*/ 64) textlegend_changes.elements = formatLabels([
    				{
    					name: "power",
    					value: /*power*/ ctx[6].toFixed(3)
    				}
    			]);

    			textlegend.$set(textlegend_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(lineseries.$$.fragment, local);
    			transition_in(segments.$$.fragment, local);
    			transition_in(textlegend.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(lineseries.$$.fragment, local);
    			transition_out(segments.$$.fragment, local);
    			transition_out(textlegend.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(lineseries, detaching);
    			if (detaching) detach_dev(t0);
    			destroy_component(segments, detaching);
    			if (detaching) detach_dev(t1);
    			destroy_component(textlegend, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$1.name,
    		type: "slot",
    		source: "(46:0) <TTestPlot {mainColor} {clicked} {reset} {testRes} {H0LegendStr} {limX} {xLabel} >",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let ttestplot;
    	let current;

    	ttestplot = new TTestPlot({
    			props: {
    				mainColor,
    				clicked: /*clicked*/ ctx[2],
    				reset: /*reset*/ ctx[1],
    				testRes: /*testRes*/ ctx[3],
    				H0LegendStr: /*H0LegendStr*/ ctx[7],
    				limX: /*limX*/ ctx[8],
    				xLabel,
    				$$slots: { default: [create_default_slot$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(ttestplot.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(ttestplot, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const ttestplot_changes = {};
    			if (dirty & /*clicked*/ 4) ttestplot_changes.clicked = /*clicked*/ ctx[2];
    			if (dirty & /*reset*/ 2) ttestplot_changes.reset = /*reset*/ ctx[1];
    			if (dirty & /*testRes*/ 8) ttestplot_changes.testRes = /*testRes*/ ctx[3];
    			if (dirty & /*H0LegendStr*/ 128) ttestplot_changes.H0LegendStr = /*H0LegendStr*/ ctx[7];

    			if (dirty & /*$$scope, fr, power, testRes, colorsPop, xr*/ 1048697) {
    				ttestplot_changes.$$scope = { dirty, ctx };
    			}

    			ttestplot.$set(ttestplot_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(ttestplot.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(ttestplot.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(ttestplot, detaching);
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

    const alpha = 0.05;
    const mainColor = "#a0a0a0";
    const xLabel = "Expected sample mean, m";

    function instance$1($$self, $$props, $$invalidate) {
    	let testRes;
    	let sampSize;
    	let popSE;
    	let t;
    	let xr;
    	let fr;
    	let tCrit;
    	let critMean;
    	let power;
    	let H0LegendStr;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("TestResults", slots, []);
    	let { popMean } = $$props;
    	let { popH0Mean } = $$props;
    	let { popSD } = $$props;
    	let { sample } = $$props;
    	let { tail } = $$props;
    	let { colorsPop } = $$props;
    	let { reset } = $$props;
    	let { clicked } = $$props;

    	// constant parameters
    	const signs = { "both": "=", "left": "≥", "right": "≤" };

    	const limX = [85, 115];

    	const writable_props = [
    		"popMean",
    		"popH0Mean",
    		"popSD",
    		"sample",
    		"tail",
    		"colorsPop",
    		"reset",
    		"clicked"
    	];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<TestResults> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("popMean" in $$props) $$invalidate(9, popMean = $$props.popMean);
    		if ("popH0Mean" in $$props) $$invalidate(10, popH0Mean = $$props.popH0Mean);
    		if ("popSD" in $$props) $$invalidate(11, popSD = $$props.popSD);
    		if ("sample" in $$props) $$invalidate(12, sample = $$props.sample);
    		if ("tail" in $$props) $$invalidate(13, tail = $$props.tail);
    		if ("colorsPop" in $$props) $$invalidate(0, colorsPop = $$props.colorsPop);
    		if ("reset" in $$props) $$invalidate(1, reset = $$props.reset);
    		if ("clicked" in $$props) $$invalidate(2, clicked = $$props.clicked);
    	};

    	$$self.$capture_state = () => ({
    		pt,
    		tTest1,
    		seq,
    		max,
    		dt,
    		qt,
    		LineSeries,
    		TextLegend,
    		Segments,
    		formatLabels,
    		TTestPlot,
    		popMean,
    		popH0Mean,
    		popSD,
    		sample,
    		tail,
    		colorsPop,
    		reset,
    		clicked,
    		signs,
    		alpha,
    		mainColor,
    		xLabel,
    		limX,
    		testRes,
    		sampSize,
    		popSE,
    		t,
    		xr,
    		fr,
    		tCrit,
    		critMean,
    		power,
    		H0LegendStr
    	});

    	$$self.$inject_state = $$props => {
    		if ("popMean" in $$props) $$invalidate(9, popMean = $$props.popMean);
    		if ("popH0Mean" in $$props) $$invalidate(10, popH0Mean = $$props.popH0Mean);
    		if ("popSD" in $$props) $$invalidate(11, popSD = $$props.popSD);
    		if ("sample" in $$props) $$invalidate(12, sample = $$props.sample);
    		if ("tail" in $$props) $$invalidate(13, tail = $$props.tail);
    		if ("colorsPop" in $$props) $$invalidate(0, colorsPop = $$props.colorsPop);
    		if ("reset" in $$props) $$invalidate(1, reset = $$props.reset);
    		if ("clicked" in $$props) $$invalidate(2, clicked = $$props.clicked);
    		if ("testRes" in $$props) $$invalidate(3, testRes = $$props.testRes);
    		if ("sampSize" in $$props) $$invalidate(14, sampSize = $$props.sampSize);
    		if ("popSE" in $$props) $$invalidate(15, popSE = $$props.popSE);
    		if ("t" in $$props) $$invalidate(16, t = $$props.t);
    		if ("xr" in $$props) $$invalidate(4, xr = $$props.xr);
    		if ("fr" in $$props) $$invalidate(5, fr = $$props.fr);
    		if ("tCrit" in $$props) $$invalidate(17, tCrit = $$props.tCrit);
    		if ("critMean" in $$props) $$invalidate(18, critMean = $$props.critMean);
    		if ("power" in $$props) $$invalidate(6, power = $$props.power);
    		if ("H0LegendStr" in $$props) $$invalidate(7, H0LegendStr = $$props.H0LegendStr);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*sample, popH0Mean, tail*/ 13312) {
    			// run t-test
    			$$invalidate(3, testRes = tTest1(sample, popH0Mean, 0.05, tail));
    		}

    		if ($$self.$$.dirty & /*sample*/ 4096) {
    			// statistics for current sample
    			$$invalidate(14, sampSize = sample.length);
    		}

    		if ($$self.$$.dirty & /*popSD, sampSize*/ 18432) {
    			$$invalidate(15, popSE = popSD / Math.sqrt(sampSize));
    		}

    		if ($$self.$$.dirty & /*t, popSE, popMean*/ 98816) {
    			$$invalidate(4, xr = t.map(v => v * popSE + popMean));
    		}

    		if ($$self.$$.dirty & /*t, sampSize*/ 81920) {
    			$$invalidate(5, fr = dt(t, sampSize - 1));
    		}

    		if ($$self.$$.dirty & /*tail, sampSize*/ 24576) {
    			// power of test and corresponding PDF
    			$$invalidate(17, tCrit = qt(tail === "left" ? alpha : 1 - alpha, sampSize - 1));
    		}

    		if ($$self.$$.dirty & /*popH0Mean, tCrit, popSE*/ 164864) {
    			$$invalidate(18, critMean = popH0Mean + tCrit * popSE);
    		}

    		if ($$self.$$.dirty & /*tail, critMean, popMean, sampSize, popSE*/ 320000) {
    			$$invalidate(6, power = tail === "right"
    			? 1 - pt(critMean - popMean, sampSize - 1)
    			: pt((critMean - popMean) / popSE, sampSize - 1));
    		}

    		if ($$self.$$.dirty & /*tail, popH0Mean*/ 9216) {
    			// string for H0 hypothesis
    			$$invalidate(7, H0LegendStr = `H0: µ ${signs[tail]} ${popH0Mean.toFixed(1)}`);
    		}
    	};

    	$$invalidate(16, t = seq(-10, 10, 300));

    	return [
    		colorsPop,
    		reset,
    		clicked,
    		testRes,
    		xr,
    		fr,
    		power,
    		H0LegendStr,
    		limX,
    		popMean,
    		popH0Mean,
    		popSD,
    		sample,
    		tail,
    		sampSize,
    		popSE,
    		t,
    		tCrit,
    		critMean
    	];
    }

    class TestResults extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {
    			popMean: 9,
    			popH0Mean: 10,
    			popSD: 11,
    			sample: 12,
    			tail: 13,
    			colorsPop: 0,
    			reset: 1,
    			clicked: 2
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "TestResults",
    			options,
    			id: create_fragment$1.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*popMean*/ ctx[9] === undefined && !("popMean" in props)) {
    			console.warn("<TestResults> was created without expected prop 'popMean'");
    		}

    		if (/*popH0Mean*/ ctx[10] === undefined && !("popH0Mean" in props)) {
    			console.warn("<TestResults> was created without expected prop 'popH0Mean'");
    		}

    		if (/*popSD*/ ctx[11] === undefined && !("popSD" in props)) {
    			console.warn("<TestResults> was created without expected prop 'popSD'");
    		}

    		if (/*sample*/ ctx[12] === undefined && !("sample" in props)) {
    			console.warn("<TestResults> was created without expected prop 'sample'");
    		}

    		if (/*tail*/ ctx[13] === undefined && !("tail" in props)) {
    			console.warn("<TestResults> was created without expected prop 'tail'");
    		}

    		if (/*colorsPop*/ ctx[0] === undefined && !("colorsPop" in props)) {
    			console.warn("<TestResults> was created without expected prop 'colorsPop'");
    		}

    		if (/*reset*/ ctx[1] === undefined && !("reset" in props)) {
    			console.warn("<TestResults> was created without expected prop 'reset'");
    		}

    		if (/*clicked*/ ctx[2] === undefined && !("clicked" in props)) {
    			console.warn("<TestResults> was created without expected prop 'clicked'");
    		}
    	}

    	get popMean() {
    		throw new Error("<TestResults>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set popMean(value) {
    		throw new Error("<TestResults>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get popH0Mean() {
    		throw new Error("<TestResults>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set popH0Mean(value) {
    		throw new Error("<TestResults>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get popSD() {
    		throw new Error("<TestResults>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set popSD(value) {
    		throw new Error("<TestResults>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get sample() {
    		throw new Error("<TestResults>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set sample(value) {
    		throw new Error("<TestResults>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get tail() {
    		throw new Error("<TestResults>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set tail(value) {
    		throw new Error("<TestResults>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get colorsPop() {
    		throw new Error("<TestResults>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set colorsPop(value) {
    		throw new Error("<TestResults>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get reset() {
    		throw new Error("<TestResults>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set reset(value) {
    		throw new Error("<TestResults>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get clicked() {
    		throw new Error("<TestResults>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set clicked(value) {
    		throw new Error("<TestResults>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/App.svelte generated by Svelte v3.38.2 */
    const file = "src/App.svelte";

    // (88:9) <AppControlArea>
    function create_default_slot_1(ctx) {
    	let appcontrolswitch0;
    	let updating_value;
    	let t0;
    	let appcontrolrange0;
    	let updating_value_1;
    	let t1;
    	let appcontrolrange1;
    	let updating_value_2;
    	let t2;
    	let appcontrolswitch1;
    	let updating_value_3;
    	let t3;
    	let appcontrolbutton;
    	let current;

    	function appcontrolswitch0_value_binding(value) {
    		/*appcontrolswitch0_value_binding*/ ctx[14](value);
    	}

    	let appcontrolswitch0_props = {
    		id: "tail",
    		label: "Tail",
    		options: ["left", "right"]
    	};

    	if (/*tail*/ ctx[4] !== void 0) {
    		appcontrolswitch0_props.value = /*tail*/ ctx[4];
    	}

    	appcontrolswitch0 = new AppControlSwitch({
    			props: appcontrolswitch0_props,
    			$$inline: true
    		});

    	binding_callbacks.push(() => bind(appcontrolswitch0, "value", appcontrolswitch0_value_binding));

    	function appcontrolrange0_value_binding(value) {
    		/*appcontrolrange0_value_binding*/ ctx[15](value);
    	}

    	let appcontrolrange0_props = {
    		id: "popMean",
    		label: "Real mean (µ)",
    		min: 95,
    		max: 105,
    		step: 1,
    		decNum: 0
    	};

    	if (/*popMean*/ ctx[0] !== void 0) {
    		appcontrolrange0_props.value = /*popMean*/ ctx[0];
    	}

    	appcontrolrange0 = new AppControlRange({
    			props: appcontrolrange0_props,
    			$$inline: true
    		});

    	binding_callbacks.push(() => bind(appcontrolrange0, "value", appcontrolrange0_value_binding));

    	function appcontrolrange1_value_binding(value) {
    		/*appcontrolrange1_value_binding*/ ctx[16](value);
    	}

    	let appcontrolrange1_props = {
    		id: "popSD",
    		label: "Sigma (σ)",
    		min: 2,
    		max: 4,
    		step: 0.1,
    		decNum: 1
    	};

    	if (/*popSD*/ ctx[1] !== void 0) {
    		appcontrolrange1_props.value = /*popSD*/ ctx[1];
    	}

    	appcontrolrange1 = new AppControlRange({
    			props: appcontrolrange1_props,
    			$$inline: true
    		});

    	binding_callbacks.push(() => bind(appcontrolrange1, "value", appcontrolrange1_value_binding));

    	function appcontrolswitch1_value_binding(value) {
    		/*appcontrolswitch1_value_binding*/ ctx[17](value);
    	}

    	let appcontrolswitch1_props = {
    		id: "sampleSize",
    		label: "Sample size",
    		options: [5, 10, 20, 40]
    	};

    	if (/*sampSize*/ ctx[2] !== void 0) {
    		appcontrolswitch1_props.value = /*sampSize*/ ctx[2];
    	}

    	appcontrolswitch1 = new AppControlSwitch({
    			props: appcontrolswitch1_props,
    			$$inline: true
    		});

    	binding_callbacks.push(() => bind(appcontrolswitch1, "value", appcontrolswitch1_value_binding));

    	appcontrolbutton = new AppControlButton({
    			props: {
    				id: "newSample",
    				label: "Sample",
    				text: "Take new"
    			},
    			$$inline: true
    		});

    	appcontrolbutton.$on("click", /*takeNewSample*/ ctx[9]);

    	const block = {
    		c: function create() {
    			create_component(appcontrolswitch0.$$.fragment);
    			t0 = space();
    			create_component(appcontrolrange0.$$.fragment);
    			t1 = space();
    			create_component(appcontrolrange1.$$.fragment);
    			t2 = space();
    			create_component(appcontrolswitch1.$$.fragment);
    			t3 = space();
    			create_component(appcontrolbutton.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(appcontrolswitch0, target, anchor);
    			insert_dev(target, t0, anchor);
    			mount_component(appcontrolrange0, target, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(appcontrolrange1, target, anchor);
    			insert_dev(target, t2, anchor);
    			mount_component(appcontrolswitch1, target, anchor);
    			insert_dev(target, t3, anchor);
    			mount_component(appcontrolbutton, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const appcontrolswitch0_changes = {};

    			if (!updating_value && dirty & /*tail*/ 16) {
    				updating_value = true;
    				appcontrolswitch0_changes.value = /*tail*/ ctx[4];
    				add_flush_callback(() => updating_value = false);
    			}

    			appcontrolswitch0.$set(appcontrolswitch0_changes);
    			const appcontrolrange0_changes = {};

    			if (!updating_value_1 && dirty & /*popMean*/ 1) {
    				updating_value_1 = true;
    				appcontrolrange0_changes.value = /*popMean*/ ctx[0];
    				add_flush_callback(() => updating_value_1 = false);
    			}

    			appcontrolrange0.$set(appcontrolrange0_changes);
    			const appcontrolrange1_changes = {};

    			if (!updating_value_2 && dirty & /*popSD*/ 2) {
    				updating_value_2 = true;
    				appcontrolrange1_changes.value = /*popSD*/ ctx[1];
    				add_flush_callback(() => updating_value_2 = false);
    			}

    			appcontrolrange1.$set(appcontrolrange1_changes);
    			const appcontrolswitch1_changes = {};

    			if (!updating_value_3 && dirty & /*sampSize*/ 4) {
    				updating_value_3 = true;
    				appcontrolswitch1_changes.value = /*sampSize*/ ctx[2];
    				add_flush_callback(() => updating_value_3 = false);
    			}

    			appcontrolswitch1.$set(appcontrolswitch1_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(appcontrolswitch0.$$.fragment, local);
    			transition_in(appcontrolrange0.$$.fragment, local);
    			transition_in(appcontrolrange1.$$.fragment, local);
    			transition_in(appcontrolswitch1.$$.fragment, local);
    			transition_in(appcontrolbutton.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(appcontrolswitch0.$$.fragment, local);
    			transition_out(appcontrolrange0.$$.fragment, local);
    			transition_out(appcontrolrange1.$$.fragment, local);
    			transition_out(appcontrolswitch1.$$.fragment, local);
    			transition_out(appcontrolbutton.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(appcontrolswitch0, detaching);
    			if (detaching) detach_dev(t0);
    			destroy_component(appcontrolrange0, detaching);
    			if (detaching) detach_dev(t1);
    			destroy_component(appcontrolrange1, detaching);
    			if (detaching) detach_dev(t2);
    			destroy_component(appcontrolswitch1, detaching);
    			if (detaching) detach_dev(t3);
    			destroy_component(appcontrolbutton, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1.name,
    		type: "slot",
    		source: "(88:9) <AppControlArea>",
    		ctx
    	});

    	return block;
    }

    // (73:0) <StatApp>
    function create_default_slot(ctx) {
    	let div3;
    	let div0;
    	let populationplot;
    	let t0;
    	let div1;
    	let testresults;
    	let t1;
    	let div2;
    	let appcontrolarea;
    	let current;

    	populationplot = new PopulationPlot({
    			props: {
    				popMean: /*popMean*/ ctx[0],
    				popH0Mean,
    				popSD: /*popSD*/ ctx[1],
    				sample: /*sample*/ ctx[3],
    				colorsPop: /*colorsPop*/ ctx[7],
    				colorsH0: /*colorsH0*/ ctx[8]
    			},
    			$$inline: true
    		});

    	testresults = new TestResults({
    			props: {
    				clicked: /*clicked*/ ctx[6],
    				reset: /*reset*/ ctx[5],
    				popMean: /*popMean*/ ctx[0],
    				popH0Mean,
    				popSD: /*popSD*/ ctx[1],
    				sample: /*sample*/ ctx[3],
    				tail: /*tail*/ ctx[4],
    				colorsPop: /*colorsPop*/ ctx[7]
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
    			div3 = element("div");
    			div0 = element("div");
    			create_component(populationplot.$$.fragment);
    			t0 = space();
    			div1 = element("div");
    			create_component(testresults.$$.fragment);
    			t1 = space();
    			div2 = element("div");
    			create_component(appcontrolarea.$$.fragment);
    			attr_dev(div0, "class", "app-population-plot-area svelte-sak2bp");
    			add_location(div0, file, 76, 6, 2067);
    			attr_dev(div1, "class", "app-test-plot-area svelte-sak2bp");
    			add_location(div1, file, 81, 6, 2273);
    			attr_dev(div2, "class", "app-controls-area svelte-sak2bp");
    			add_location(div2, file, 86, 6, 2459);
    			attr_dev(div3, "class", "app-layout svelte-sak2bp");
    			add_location(div3, file, 73, 3, 1987);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div3, anchor);
    			append_dev(div3, div0);
    			mount_component(populationplot, div0, null);
    			append_dev(div3, t0);
    			append_dev(div3, div1);
    			mount_component(testresults, div1, null);
    			append_dev(div3, t1);
    			append_dev(div3, div2);
    			mount_component(appcontrolarea, div2, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const populationplot_changes = {};
    			if (dirty & /*popMean*/ 1) populationplot_changes.popMean = /*popMean*/ ctx[0];
    			if (dirty & /*popSD*/ 2) populationplot_changes.popSD = /*popSD*/ ctx[1];
    			if (dirty & /*sample*/ 8) populationplot_changes.sample = /*sample*/ ctx[3];
    			populationplot.$set(populationplot_changes);
    			const testresults_changes = {};
    			if (dirty & /*clicked*/ 64) testresults_changes.clicked = /*clicked*/ ctx[6];
    			if (dirty & /*reset*/ 32) testresults_changes.reset = /*reset*/ ctx[5];
    			if (dirty & /*popMean*/ 1) testresults_changes.popMean = /*popMean*/ ctx[0];
    			if (dirty & /*popSD*/ 2) testresults_changes.popSD = /*popSD*/ ctx[1];
    			if (dirty & /*sample*/ 8) testresults_changes.sample = /*sample*/ ctx[3];
    			if (dirty & /*tail*/ 16) testresults_changes.tail = /*tail*/ ctx[4];
    			testresults.$set(testresults_changes);
    			const appcontrolarea_changes = {};

    			if (dirty & /*$$scope, sampSize, popSD, popMean, tail*/ 262167) {
    				appcontrolarea_changes.$$scope = { dirty, ctx };
    			}

    			appcontrolarea.$set(appcontrolarea_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(populationplot.$$.fragment, local);
    			transition_in(testresults.$$.fragment, local);
    			transition_in(appcontrolarea.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(populationplot.$$.fragment, local);
    			transition_out(testresults.$$.fragment, local);
    			transition_out(appcontrolarea.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);
    			destroy_component(populationplot);
    			destroy_component(testresults);
    			destroy_component(appcontrolarea);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(73:0) <StatApp>",
    		ctx
    	});

    	return block;
    }

    // (99:3) 
    function create_help_slot(ctx) {
    	let div;
    	let h2;
    	let t1;
    	let p0;
    	let t2;
    	let code;
    	let t4;
    	let t5;
    	let p1;
    	let t6;
    	let strong0;
    	let t8;
    	let strong1;
    	let t10;
    	let t11;
    	let p2;
    	let t12;
    	let strong2;
    	let t14;

    	const block = {
    		c: function create() {
    			div = element("div");
    			h2 = element("h2");
    			h2.textContent = "Power of test and Type II errors";
    			t1 = space();
    			p0 = element("p");
    			t2 = text("This app is similar to ");
    			code = element("code");
    			code.textContent = "asta-b207";
    			t4 = text(" where you played with one-sample t-test. However, in this case\n         you can emulate situations when H0 is not true, meaning the true population mean, µ, is different from\n         what you expect by setting H0. The possibilities for H0 are the same, depending on a tail, you have the\n         following options — \"left\": µ ≥ 100 mg/L, and \"right\": µ ≤ 100 mg/L. But now you can\n         also change the real population mean and set it to be smaller or larger than 100 mg/L.");
    			t5 = space();
    			p1 = element("p");
    			t6 = text("Try to do this and check how often you will be able to reject H0 (in this case we work with significance\n         level 0.05, so we reject H0 when p-value is below this value). A probability to reject wrong H0 is called a\n         ");
    			strong0 = element("strong");
    			strong0.textContent = "power of test";
    			t8 = text(". And the situation when you can not reject it is called ");
    			strong1 = element("strong");
    			strong1.textContent = "Type II";
    			t10 = text("\n         error or false negative. The probability to get Type II error is always opposite to the power of test, e.g.\n         if power is 80% you have 20% chance to make a Type II error.");
    			t11 = space();
    			p2 = element("p");
    			t12 = text("The power of any test depends on several things. First of all it is the test itself — different methods have\n         different power. Second, it depends on the ");
    			strong2 = element("strong");
    			strong2.textContent = "size of effect";
    			t14 = text(" — difference between H0 mean and the real\n         population mean (H1). E.g. if H0 assumes that µ ≤ 100 and the real µ = 105, this difference is 5. Finally, power also\n         depends on standard deviation of your population as well as on the sample size. The last has very important consequence\n         — the smaller effect you want to detect, the larger sample size shpuld be.");
    			add_location(h2, file, 99, 6, 3164);
    			add_location(code, file, 101, 32, 3248);
    			add_location(p0, file, 100, 6, 3212);
    			add_location(strong0, file, 110, 9, 4010);
    			add_location(strong1, file, 110, 96, 4097);
    			add_location(p1, file, 107, 6, 3766);
    			add_location(strong2, file, 116, 52, 4500);
    			add_location(p2, file, 114, 6, 4326);
    			attr_dev(div, "slot", "help");
    			add_location(div, file, 98, 3, 3140);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, h2);
    			append_dev(div, t1);
    			append_dev(div, p0);
    			append_dev(p0, t2);
    			append_dev(p0, code);
    			append_dev(p0, t4);
    			append_dev(div, t5);
    			append_dev(div, p1);
    			append_dev(p1, t6);
    			append_dev(p1, strong0);
    			append_dev(p1, t8);
    			append_dev(p1, strong1);
    			append_dev(p1, t10);
    			append_dev(div, t11);
    			append_dev(div, p2);
    			append_dev(p2, t12);
    			append_dev(p2, strong2);
    			append_dev(p2, t14);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_help_slot.name,
    		type: "slot",
    		source: "(99:3) ",
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

    			if (dirty & /*$$scope, sampSize, popSD, popMean, tail, clicked, reset, sample*/ 262271) {
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

    const popH0Mean = 100;

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);

    	const colorsPop = {
    		line: colors.plots.POPULATIONS[0],
    		area: colors.plots.POPULATIONS_PALE[0],
    		sample: colors.plots.SAMPLES[0],
    		stat: colors.plots.SAMPLES[0]
    	};

    	// colors for H0
    	const colorsH0 = {
    		line: "#c0c0c0",
    		area: "#c0c0c020",
    		stat: "606060"
    	};

    	// variable parameters
    	let popMean = 105;

    	let popSD = 3;
    	let sampSize = 5;
    	let sample = [];
    	let tail = "right";
    	let sampSizeOld = sampSize;
    	let popSDOld = popSD;
    	let popMeanOld = popMean;
    	let tailOld = tail;
    	let reset = false;
    	let clicked;

    	function takeNewSample() {
    		$$invalidate(3, sample = rnorm(sampSize, popMean, popSD));
    		$$invalidate(6, clicked = Math.random());
    	}

    	// take first sample
    	takeNewSample();

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	function appcontrolswitch0_value_binding(value) {
    		tail = value;
    		$$invalidate(4, tail);
    	}

    	function appcontrolrange0_value_binding(value) {
    		popMean = value;
    		$$invalidate(0, popMean);
    	}

    	function appcontrolrange1_value_binding(value) {
    		popSD = value;
    		$$invalidate(1, popSD);
    	}

    	function appcontrolswitch1_value_binding(value) {
    		sampSize = value;
    		$$invalidate(2, sampSize);
    	}

    	$$self.$capture_state = () => ({
    		rnorm,
    		StatApp,
    		colors,
    		AppControlArea,
    		AppControlButton,
    		AppControlSwitch,
    		AppControlRange,
    		PopulationPlot,
    		TestResults,
    		colorsPop,
    		colorsH0,
    		popH0Mean,
    		popMean,
    		popSD,
    		sampSize,
    		sample,
    		tail,
    		sampSizeOld,
    		popSDOld,
    		popMeanOld,
    		tailOld,
    		reset,
    		clicked,
    		takeNewSample
    	});

    	$$self.$inject_state = $$props => {
    		if ("popMean" in $$props) $$invalidate(0, popMean = $$props.popMean);
    		if ("popSD" in $$props) $$invalidate(1, popSD = $$props.popSD);
    		if ("sampSize" in $$props) $$invalidate(2, sampSize = $$props.sampSize);
    		if ("sample" in $$props) $$invalidate(3, sample = $$props.sample);
    		if ("tail" in $$props) $$invalidate(4, tail = $$props.tail);
    		if ("sampSizeOld" in $$props) $$invalidate(10, sampSizeOld = $$props.sampSizeOld);
    		if ("popSDOld" in $$props) $$invalidate(11, popSDOld = $$props.popSDOld);
    		if ("popMeanOld" in $$props) $$invalidate(12, popMeanOld = $$props.popMeanOld);
    		if ("tailOld" in $$props) $$invalidate(13, tailOld = $$props.tailOld);
    		if ("reset" in $$props) $$invalidate(5, reset = $$props.reset);
    		if ("clicked" in $$props) $$invalidate(6, clicked = $$props.clicked);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*sample, tailOld, tail, sampSizeOld, sampSize, popSDOld, popSD, popMean, popMeanOld*/ 15391) {
    			// when sample size or population SD changed - reset statistics and take new sample
    			{
    				if (sample && (tailOld !== tail || sampSizeOld !== sampSize || popSDOld !== popSD || popMean !== popMeanOld)) {
    					$$invalidate(5, reset = true);
    					$$invalidate(10, sampSizeOld = sampSize);
    					$$invalidate(11, popSDOld = popSD);
    					$$invalidate(12, popMeanOld = popMean);
    					$$invalidate(13, tailOld = tail);
    					takeNewSample();
    				} else {
    					$$invalidate(5, reset = false);
    				}
    			}
    		}
    	};

    	return [
    		popMean,
    		popSD,
    		sampSize,
    		sample,
    		tail,
    		reset,
    		clicked,
    		colorsPop,
    		colorsH0,
    		takeNewSample,
    		sampSizeOld,
    		popSDOld,
    		popMeanOld,
    		tailOld,
    		appcontrolswitch0_value_binding,
    		appcontrolrange0_value_binding,
    		appcontrolrange1_value_binding,
    		appcontrolswitch1_value_binding
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
//# sourceMappingURL=asta-b208.js.map
