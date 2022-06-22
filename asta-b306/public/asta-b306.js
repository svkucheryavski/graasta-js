
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
     * Computes a range of values in a vector with a margin
     * @param {number[]} x - vector with values
     * @param {number} margin - margin in parts of one (e.g. 0.1 for 10% or 2 for 200%)
     * @returns{number[]} array with marginal range boundaries
     */
    function mrange$1(x, margin = 0.05) {
       const mn = min$1(x);
       const mx = max$1(x);
       const d = mx - mn;

       return [mn - d * margin, max$1(x) + d * margin];
    }


    /**
     * Computes difference between all adjacent values in a vector
     * @param {number[]} x - vector with values
     * @returns {number[]} vector with the differences
     */
    function diff(x) {
       return x.slice(1).map( (y, i) => (y - x[i]));
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
     * Cumulative distribution function for F-distribution
     * @param {number|number[]} F - F-value or a vector of t-values
     * @param {number} d1 - degrees of freedom
     * @param {number} d2 - degrees of freedom
     */
    function pf(F, d1, d2) {

       if (F < 0 || d1 < 0 || d2 < 0) {
          throw new Error("All 3 parameters must be positive.");
       }

       if (Array.isArray(F)) {
          return F.map(v => pf(v, d1, d2));
       }

       return ibeta(d1 * F / (d1 * F + d2), d1/2, d2/2)
    }



    /***********************************************
     * Functions for manipulations with values     *
     ***********************************************/


    /**
     * Sorts values in a vector
     * @param {Array} x - vector with values
     * @returns {Array} vector with sorted values
     */
    function sort(x, decreasing = false) {
       return decreasing ? [...x].sort((a, b) => b - a) : [...x].sort((a, b) => a - b);
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

       if (isNaN(q2) || isNaN(q4)) {
          throw Error("Numerical integration ended up with NaN number.")
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

       if (y > 100) {
          // for large y we use slower integrate version
          return integrate((u) => Math.pow(u, x - 1) / Math.pow(1 + u, x + y), 0, Infinity)
       }

       return gamma(x) * gamma(y) / gamma(x + y);
    }


    /**
     * Incomplete Betta function (approximation via numeric integration)
     * @param {number} x - first argument (one value)
     * @param {number} a - second argument (one value)
     * @param {number} b - third argument (one value)
     * @returns {number} value of the function
     */
    function ibeta(x, a, b) {
       if (x === 0) return 0;
       if (x === 1) return 1;
       if (b === 1) return x ** a;
       if (a === 1) return (1 - (1 - x)**b);
       return integrate((t) => t ** (a - 1) * (1 - t) ** (b - 1), 0, x) / beta(a, b);
    }

    /**********************************************
     * Functions for manipulations with vectors   *
     **********************************************/

    /* Simple functions for arithmetics */
    const add = (a, b) => a + b;
    const subtract = (a, b) => a - b;
    const times = (a, b) => a * b;
    const divide = (a, b) => a/b;

    /**
     * Computes a Euclidean norm of a vector x
     * @param {Array} x — a vector of values
     * @returns a number (the norm)
     */
    function norm2(x) {

       if (!isvector(x)) {
          throw Error("Argument 'x' must be a vector.");
       }

       return Math.sqrt(sum(x.map(v => v**2)));
    }

    /**
     * Replaces subset of values in vector x, specified by indices, with values from vector y
     *
     * @param {Array} x — vector with values to be replaced
     * @param {Array} y — vector with values used for replacement
     * @param {Array} ind — vector of indices to select (starting from 1)
     */
    function vreplace(x, y, ind) {

       if (!isvector(x)) {
          throw Error("Argument 'x' must be a vector.");
       }

       if (!isvector(y)) {
          throw Error("Argument 'y' must be a vector.");
       }

       ind = processIndices(ind, x.length, true);

       if (ind.length !== y.length) {
          throw Error("Number of values in 'ind' should match the number of elements in 'y'.");
       }

       let z = subset(x, []);
       for (let i = 0; i < ind.length; i++) {
          z[ind[i] - 1] = y[i];
       }

       return z;
    }

    /**
     * Applies a function to each element of a vector
     *
     * @param {Array} x - a vector
     * @param {function} fun - a function which takes a numbers and returns a number
     * @returns {Array} - result of the operation
     */
    function vapply(x, fun) {

       if (!isvector(x)) {
          throw Error("Argument 'x' must be a vector.");
       }

       return x.map(v => fun(v));
    }

    /**
     * Does element by element division of two vectors, or a vector and a scalar
     * (one of the arguments must be a vector)
     *
     * @param {Array|number} x - a vector or a scalar
     * @param {Array|number} y - a vector or a scalar
     * @returns {Array} - result of the multiplication
     */
    function vdiv(x, y) {
       return vop(x, y, divide);
    }


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
     * Does element by element subtraction of two vectors, or a vector and a scalar
     * (one of the arguments must be a vector)
     *
     * @param {Array|number} x - a vector or a scalar
     * @param {Array|number} y - a vector or a scalar
     * @returns {Array} - result of the subtraction
     */
    function vsubtract(x, y) {
       return vop(x, y, subtract);
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
     * Check row or column indices
     * @param {Array|number} ind — vector or a value with indices
     * @param {number} n — number of rows or columns in original matrix
     * @param {number} fill — logical, if 'true' and 'ind' is empty, will generate values from 1 to n
     * @returns array with indices
     */
    function processIndices(ind, n, fill) {
       if (!Array.isArray(ind)) {
          ind = [ind];
       }

       if (ind.length > 0 && (min$1(ind) < 1 || max$1(ind) > n)) {
          throw Error("Wrong values for indices.");
       }

       if (ind.length === 0 && fill) {
          ind = seq(1, n);
       }

       return ind;
    }

    /**
     * Creates a subset of matrix X specified by row and column indices
     *
     * If all rows or all columns must be selected provide empty array, [], as indices.
     *
     * @param {Array} X — matrix with values
     * @param {Array} rowInd — vector of row indices to select (starting from 1)
     * @param {Array} colInd — vector of column indices to select (starting from 1)
     * @param {string} method - what to do with values ("select" or "remove")
     */
    function msubset(X, rowInd, colInd, method) {

       if (!ismatrix(X)) {
          throw Error("Argument 'X' must be a matrix.");
       }

       colInd = processIndices(colInd, ncol(X), method === "select");
       rowInd = processIndices(rowInd, nrow(X), false);

       if (method === "remove" || colInd.length === 0) {
          colInd = subset(seq(1, ncol(X)), colInd, "remove");
       }

       let Y = Array(colInd.length);
       for (let c = 0; c < colInd.length; c++) {
          Y[c] = subset(X[colInd[c] - 1], rowInd, method);
       }

       return Y;
    }


    /**
     * Replaces subset of values in matrix X, specified by row and column indices, with values from matrix Y
     *
     * If all rows or all columns must be taken provide empty array, [], as indices.
     *
     * @param {Array} X — matrix with values to be replaced
     * @param {Array} Y — matrix with values used for replacement
     * @param {Array} rowInd — vector of row indices to select (starting from 1)
     * @param {Array} colInd — vector of column indices to select (starting from 1)
     */
    function mreplace(X, Y, rowInd, colInd) {

       if (!ismatrix(X)) {
          throw Error("Argument 'X' must be a matrix.");
       }

       rowInd = processIndices(rowInd, nrow(X), true);
       colInd = processIndices(colInd, ncol(X), true);

       if (rowInd.length !== nrow(Y)) {
          throw Error("Number of values in 'rowInd' should match the number of rows in 'Y'.");
       }

       if (colInd.length !== ncol(Y)) {
          throw Error("Number of values in 'colInd' should match the number of columns in 'Y'.");
       }

       let Z = msubset(X, [], []);
       for (let c = 0; c < colInd.length; c++) {
          for (let r = 0; r < rowInd.length; r++) {
             Z[colInd[c] - 1][rowInd[r] - 1] = Y[c][r];
          }
       }

       return Z;
    }


    /**
     * Computes XY' product
     *
     * @param {Array} X - a matrix
     * @param {Array} Y - a matrix
     * @returns {Array} - result of the product
     */
    function tcrossprod(X, Y) {

       if (!Y) {
          Y = msubset(X, [], []);
       }

       if (!ismatrix(X)  || !ismatrix(Y)) {
          throw Error("Both arguments must be matrices (2D Arrays).");
       }

       return mdot(X, transpose(Y));
    }


    /**
     * Computes X'Y product
     *
     * @param {Array} X - a matrix
     * @param {Array} Y - a matrix
     * @returns {Array} - result of the product
     */
    function crossprod(X, Y) {

       if (!Y) {
          Y = msubset(X, [], []);
       }

       if (!ismatrix(X)  || !ismatrix(Y)) {
          throw Error("Both arguments must be matrices (2D Arrays).");
       }

       return mdot(transpose(X), Y);
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
     * Does element by element addition of two matrices, a matrix and a scalar or a matrix and a vector
     *
     * if second argument is a vector, function checks its dimension. If it has the same number of elements
     * as number of rows in 'X' it will be applied to every column of 'X'. If it has the same number of
     * elements as number of columns in 'X', it will be applied to every row.
     *
     * @param {Array} X - a matrix
     * @param {Array|number} Y - a matrix, a vector or a scalar
     * @returns {Array} - result of the addition
     */
    function madd(X, Y) {
       return mop(X, Y, add);
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
     * Returns the main diagonal of a matrix as a vector
     * @param {Array} x - a vector with values
     */
    function getdiag(x) {
       if (!ismatrix(x)) throw Error("Argument 'x' must be a matrix.");
       if (!issquaredmat(x)) throw Error("Argument 'x' must be a squared matrix.");

       const n = x.length;
       let res = rep(0, n);
       for (let i = 0; i < n; i++) {
          res[i] = x[i][i];
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

    /**
     * Return true if matrix is squared
     * @param {number[]} X - matrix to check (2D Array)
     * @returns logical value
     */
    function issquaredmat(X) {
       return nrow(X) === ncol(X);
    }


    /**
     * Return true if matrix is lower triangular
     * @param {number[]} X - matrix to check (2D Array)
     * @returns logical value
     */
    function islowertrianmat(X) {
       return isuppertrianmat(transpose(X));
    }


    /**
     * Return true if matrix is upper triangular
     * @param {number[]} X - matrix to check (2D Array)
     * @returns logical value
     */
    function isuppertrianmat(X) {

       if (!issquaredmat) return false;

       const n = ncol(X);
       for (let i = 0; i < n; i++)
          for (let j = i + 1; j < n; j++)
             if (Math.abs(X[i][j]) > 10**(-10) )
                return false;

       return true;
    }

    /**********************************************
     * Functions for decompositions of matrices   *
     **********************************************/

    /**
     * Computes QR decomposition of matrix X using Householder reflections
     * @param {number[]} X - matrix to decompose (2D Array)
     * @returns JSON with two matrices, Q and R
     */
    function qr(X) {

       const ncols = ncol(X);
       const nrows = nrow(X);
       const tMax = min$1([nrows, ncols]);

       let R = msubset(X, [], []);
       let Q = eye(nrows);

       for (let ic = 0; ic < tMax; ic++) {

          const x = subset(R[ic], seq(ic + 1, nrows));
          const n = x.length;

          let e = rep(0, n);
          e[0] = Math.sign(x[0]) * norm2(x);

          const v = vadd(e, x);
          const Qt = madd(eye(n), mmult(tcrossprod([v]), -2 / (norm2(v) ** 2)));
          const Qk = mreplace(eye(nrows), Qt, seq(nrows - n + 1, nrows), seq(nrows - n + 1, nrows));

          Q = mdot(Q, Qk);
          R = mdot(Qk, R);
       }

       return {Q, R};
    }


    /**
     * Computes inverse of a squared matrix X
     * @param {number[]} X — squared matrix
     * @returns inverse of X
     */
    function inv(X) {

       if (!issquaredmat(X)) {
          throw Error("Only squared matrices can be inverted.");
       }

       if (isuppertrianmat(X)) {
          return transpose(inv(transpose(X)));
       }

       if (islowertrianmat(X)) {
          const n = ncol(X);
          const I = eye(n);
          let Y = zeros(n, n);

          for (let k = 1; k <= n; k++) {
             for (let i = 1; i <= n; i++) {
                Y[i - 1][k - 1] = (
                   I[i -  1][k - 1] - mdot(
                         msubset(X, k, seq(1, k - 1)),
                         msubset(Y, seq(1, k - 1), i)
                      )
                   ) / X[k - 1][k - 1];
             }
          }
          return Y;
       }

       // invert matrix using QR transformation
       const r = qr(X);
       if (!isuppertrianmat(r.R)) {
          throw Error("QR decomposition of the matrix returned incorrect result.")
       }

       return mdot(inv(r.R), transpose(r.Q));
    }

    /**
     * For given vector 'x' and number 'd' returns matrix with power of x values from 1 to d as columns
     * @param {number[]} x - vector with values
     * @param {number} d - polynomial degree
     * @returns a matrix with 'd' columns
     */
    function polymat(x, d) {

       if (!isvector(x)) {
          throw Error("Argument 'x' must be a vector.");
       }

       return d > 1 ? seq(1, d).map(p => x.map(v => v ** p)) : [x];
    }

    /**
     * Fitting a univariate polynomial model
     * @param {number[]} x - vector with predictors
     * @param {number[]} y - vector with responses
     * @param {number} d - polynomial degree
     * @return JSON with model parameters and performance statistics
     */
    function polyfit(x, y, d) {

       if (d < 1 || d >= x.length) {
          throw Error("Polynomial degree 'd' must a positive value smaller than number of measurements.");
       }

       let model = lmfit(polymat(x, d), y);
       model.pdegree = d;
       model.class = "pm";

       return model;
    }

    /**
     * Predicts response values based on the fitted model and predictors
     * @param {JSON} m - regression model (object returned by 'polyfit()')
     * @param {number[]} x - vector with predictors
     * @return vector with predicted response values
     */
    function polypredict(m, x) {

       if (!isvector(x)) {
          throw Error("Argument 'x' must be a vector.");
       }

       if (m.class !== "pm") {
          throw Error("Argument 'm' must be object with polynomial model returned by method 'polyfit()'.");
       }

       return lmpredict(m, polymat(x, m.pdegree));
    }

    /**
     * Fitting a linear model (SLR or MLR)
     * @param {number[]} X - vector or matrix with predictors
     * @param {number[]} y - vector with responses
     * @return JSON with model parameters and performance statistics
     */
    function lmfit(X, y) {

       if (!isarray(X)) {
          throw Error("Argument 'X' must be a matrix or a vector.");
       }

       if (!isvector(y)) {
          throw Error("Argument 'y' must be a vector.");
       }

       const n = nrow(X);
       if (nrow(y) !== n) {
          throw Error("Arguments 'X' and 'y' must have the same number of measurements.");
       }

       if (n <= ncol(X)) {
          throw Error("Number of measurements must be larger than number of predictors.");
       }

       if (!ismatrix(X)) {
          X = [X];
       }

       // add column of ones for estimation of intercept
       const Xr = msubset(X, [], []);
       Xr.unshift(rep(1, n));

       // compute inverse of variance-covariance matrix
       const R = inv(crossprod(Xr));

       // estimate regression coefficients
       const estimate = mdot(mdot(R, transpose(Xr)), y)[0];

       // compute predicted y-values and performance statistics
       const fitted = mdot(Xr, estimate)[0];
       const stat = regstat(y, fitted, ncol(X));

       // compute standard error and t-values for regression coefficients, H0: beta = 0
       const coeffse = vapply(getdiag(mmult(R, stat.se**2)), Math.sqrt);
       const tstat = vdiv(estimate, coeffse);

       // compute critical t-value for confidence intervals
       const tCrit = qt(0.975, stat.DoF);

       // return JSON with all results
       return {
          class: "lm",
          data: {X: X, y: y},
          coeffs: {
             estimate: estimate,
             se: coeffse,
             tstat: tstat,
             p: tstat.map(t => t > 0 ? 2 * pt(-t, stat.DoF) : 2 * pt(t, stat.DoF)),
             lower: estimate.map((b, i) => b - tCrit * coeffse[i]),
             upper: estimate.map((b, i) => b + tCrit * coeffse[i])
          },
          fitted: fitted,
          stat: stat
       }
    }

    /**
     * Predicts response values based on the fitted model and predictors
     * @param {JSON} m - regression model (object returned by 'limfit()')
     * @param {number[]} X - vector or matrix with predictors
     * @return vector with predicted response values
     */
    function lmpredict(m, X) {

       if (!isarray(X)) {
          throw Error("Argument 'X' must be a matrix or a vector.");
       }

       if (!(m.class === "lm" || m.class === "pm") || !m.coeffs.estimate || m.coeffs.estimate.length < 1) {
          throw Error("Argument 'm' must be object with MLR model returned by method 'lmfit()'.");
       }

       if (ncol(X) !== (m.coeffs.estimate.length - 1)) {
          throw Error("Number of columns in 'X' do not match number of coefficients in model 'm'.");
       }


       if (!ismatrix(X)) {
          X = [X];
       }

       const Xr = msubset(X, [], []);
       Xr.unshift(rep(1, nrow(X)));
       return mdot(Xr, m.coeffs.estimate)[0];
    }

    /**
     * Computes performance statistics for predicted and reference response values
     * @param {number[]} y — vector with reference response values
     * @param {number[]} yp — vector with predicted response values
     * @return JSON with statistics (adjusted R2, R2, s(e), F-value, p-value)
     */
    function regstat(y, yp, p) {

       const n = nrow(y);
       if (!p) p = 1;

       const e = vsubtract(y, yp);
       const SSe = vdot(e, e);
       const SSy = variance(y) * (n - 1);
       const R2 = (1 - SSe / SSy);
       const DoF = n - p - 1;
       const F = ((SSy - SSe)/p) / (SSe/DoF);

       return {
          R2: R2,
          R2adj: 1 - (1 - R2) * (n - 1) / DoF,
          Fstat: F,
          p: 1 - pf(F, p, DoF),
          DoF: DoF,
          se: Math.sqrt(SSe/DoF)
       };
    }

    /* ../shared/StatApp.svelte generated by Svelte v3.48.0 */

    const file$e = "../shared/StatApp.svelte";
    const get_help_slot_changes = dirty => ({});
    const get_help_slot_context = ctx => ({});

    // (20:3) {#if showHelp}
    function create_if_block$a(ctx) {
    	let div;
    	let current;
    	const help_slot_template = /*#slots*/ ctx[3].help;
    	const help_slot = create_slot(help_slot_template, ctx, /*$$scope*/ ctx[2], get_help_slot_context);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (help_slot) help_slot.c();
    			attr_dev(div, "class", "helptext svelte-11mbpxp");
    			add_location(div, file$e, 20, 3, 381);
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
    		id: create_if_block$a.name,
    		type: "if",
    		source: "(20:3) {#if showHelp}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$g(ctx) {
    	let main;
    	let div;
    	let t;
    	let current;
    	let mounted;
    	let dispose;
    	const default_slot_template = /*#slots*/ ctx[3].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[2], null);
    	let if_block = /*showHelp*/ ctx[0] && create_if_block$a(ctx);

    	const block = {
    		c: function create() {
    			main = element("main");
    			div = element("div");
    			if (default_slot) default_slot.c();
    			t = space();
    			if (if_block) if_block.c();
    			attr_dev(div, "class", "content svelte-11mbpxp");
    			add_location(div, file$e, 15, 3, 307);
    			attr_dev(main, "class", "graasta-app svelte-11mbpxp");
    			add_location(main, file$e, 13, 0, 276);
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
    		id: create_fragment$g.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$g($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$g, create_fragment$g, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "StatApp",
    			options,
    			id: create_fragment$g.name
    		});
    	}
    }

    /* ../shared/controls/AppControlArea.svelte generated by Svelte v3.48.0 */

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

    function create_fragment$f(ctx) {
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
    		id: create_fragment$f.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$f($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$f, create_fragment$f, safe_not_equal, { errormsg: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "AppControlArea",
    			options,
    			id: create_fragment$f.name
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

    const file$c = "../shared/controls/AppControl.svelte";

    function create_fragment$e(ctx) {
    	let div;
    	let label_1;
    	let t;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[5].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[4], null);

    	const block = {
    		c: function create() {
    			div = element("div");
    			label_1 = element("label");
    			t = space();
    			if (default_slot) default_slot.c();
    			attr_dev(label_1, "for", /*id*/ ctx[0]);
    			attr_dev(label_1, "class", "svelte-19prgdd");
    			add_location(label_1, file$c, 8, 3, 176);
    			attr_dev(div, "class", "app-control svelte-19prgdd");
    			toggle_class(div, "hidden", /*hidden*/ ctx[3]);
    			toggle_class(div, "disable", /*disable*/ ctx[2]);
    			add_location(div, file$c, 7, 0, 120);
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
    				toggle_class(div, "hidden", /*hidden*/ ctx[3]);
    			}

    			if (dirty & /*disable*/ 4) {
    				toggle_class(div, "disable", /*disable*/ ctx[2]);
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
    		id: create_fragment$e.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$e($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$e, create_fragment$e, safe_not_equal, { id: 0, label: 1, disable: 2, hidden: 3 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "AppControl",
    			options,
    			id: create_fragment$e.name
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
    const file$b = "../shared/controls/AppControlButton.svelte";

    // (9:0) <AppControl id={id} label={label} >
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
    		id: create_default_slot$3.name,
    		type: "slot",
    		source: "(9:0) <AppControl id={id} label={label} >",
    		ctx
    	});

    	return block;
    }

    function create_fragment$d(ctx) {
    	let appcontrol;
    	let current;

    	appcontrol = new AppControl({
    			props: {
    				id: /*id*/ ctx[0],
    				label: /*label*/ ctx[1],
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
    		id: create_fragment$d.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$d($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('AppControlButton', slots, []);
    	let { id } = $$props;
    	let { label } = $$props;
    	let { text } = $$props;
    	const writable_props = ['id', 'label', 'text'];

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
    	};

    	$$self.$capture_state = () => ({ AppControl, id, label, text });

    	$$self.$inject_state = $$props => {
    		if ('id' in $$props) $$invalidate(0, id = $$props.id);
    		if ('label' in $$props) $$invalidate(1, label = $$props.label);
    		if ('text' in $$props) $$invalidate(2, text = $$props.text);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [id, label, text, click_handler];
    }

    class AppControlButton extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$d, create_fragment$d, safe_not_equal, { id: 0, label: 1, text: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "AppControlButton",
    			options,
    			id: create_fragment$d.name
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
    const file$a = "../shared/controls/AppControlSwitch.svelte";

    function get_each_context$6(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[8] = list[i];
    	return child_ctx;
    }

    // (16:6) {#each options as option (option)}
    function create_each_block$6(key_1, ctx) {
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
    			add_location(div, file$a, 16, 6, 392);
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
    		id: create_each_block$6.name,
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
    	validate_each_keys(ctx, each_value, get_each_context$6, get_key);

    	for (let i = 0; i < each_value.length; i += 1) {
    		let child_ctx = get_each_context$6(ctx, each_value, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block$6(key, child_ctx));
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
    			add_location(div, file$a, 14, 3, 322);
    			attr_dev(input, "name", /*id*/ ctx[1]);
    			attr_dev(input, "class", "svelte-yqpg3s");
    			add_location(input, file$a, 20, 3, 518);
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
    				validate_each_keys(ctx, each_value, get_each_context$6, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each_1_lookup, div, destroy_block, create_each_block$6, null, get_each_context$6);
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

    function create_fragment$c(ctx) {
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
    		id: create_fragment$c.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$c($$self, $$props, $$invalidate) {
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

    		init(this, options, instance$c, create_fragment$c, safe_not_equal, {
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
    			id: create_fragment$c.name
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

    const file$9 = "../shared/tables/DataTableValues.svelte";

    function get_each_context_1$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[2] = list[i];
    	return child_ctx;
    }

    function get_each_context$5(ctx, list, i) {
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
    function create_if_block$8(ctx) {
    	let each_1_anchor;
    	let each_value = /*values*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$5(get_each_context$5(ctx, each_value, i));
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
    					const child_ctx = get_each_context$5(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$5(child_ctx);
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
    			add_location(td, file$9, 11, 3, 263);
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
    function create_each_block$5(ctx) {
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
    			add_location(td, file$9, 7, 3, 112);
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
    		id: create_each_block$5.name,
    		type: "each",
    		source: "(7:3) {#each values as value}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$b(ctx) {
    	let if_block_anchor;

    	function select_block_type(ctx, dirty) {
    		if (/*decNum*/ ctx[1] >= 0) return create_if_block$8;
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
    		id: create_fragment$b.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$b($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$b, create_fragment$b, safe_not_equal, { values: 0, decNum: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "DataTableValues",
    			options,
    			id: create_fragment$b.name
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
    const file$8 = "../shared/tables/DataTable.svelte";

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

    function get_each_context$4(ctx, list, i) {
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
    			add_location(tr, file$8, 25, 3, 740);
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
    function create_if_block$7(ctx) {
    	let each_1_anchor;
    	let current;
    	let each_value = /*variables*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$4(get_each_context$4(ctx, each_value, i));
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
    					const child_ctx = get_each_context$4(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$4(child_ctx);
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
    		id: create_if_block$7.name,
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
    			add_location(td, file$8, 27, 6, 817);
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
    			add_location(tr, file$8, 31, 3, 934);
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
    function create_each_block$4(ctx) {
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
    			add_location(td, file$8, 20, 6, 607);
    			attr_dev(tr, "class", "datatable__row");
    			add_location(tr, file$8, 19, 3, 573);
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
    		id: create_each_block$4.name,
    		type: "each",
    		source: "(19:3) {#each variables as {label, values}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$a(ctx) {
    	let table;
    	let current_block_type_index;
    	let if_block;
    	let current;
    	const if_block_creators = [create_if_block$7, create_else_block];
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
    			add_location(table, file$8, 15, 0, 482);
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
    		id: create_fragment$a.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$a($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$a, create_fragment$a, safe_not_equal, { variables: 0, horizontal: 1, decNum: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "DataTable",
    			options,
    			id: create_fragment$a.name
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

    /* src/AppTable.svelte generated by Svelte v3.48.0 */
    const file$7 = "src/AppTable.svelte";

    function create_fragment$9(ctx) {
    	let div;
    	let datatable;
    	let current;

    	datatable = new DataTable({
    			props: {
    				variables: [
    					{
    						label: "#",
    						values: /*segments*/ ctx[0].num.concat([NaN])
    					},
    					{
    						label: "x",
    						values: /*x*/ ctx[1].concat([NaN])
    					},
    					{
    						label: "y",
    						values: /*y*/ ctx[2].concat([NaN])
    					},
    					{
    						label: "y<sub>cv</sub>",
    						values: /*ycv*/ ctx[3].concat([NaN])
    					},
    					{
    						label: "e",
    						values: /*e*/ ctx[5].concat([NaN])
    					},
    					{
    						label: "e<sup>2</sup>",
    						values: /*e2*/ ctx[6].concat(sum(/*e2*/ ctx[6]))
    					}
    				],
    				decNum: [0, 2, 1, 1, 1, 2],
    				horizontal: false
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(datatable.$$.fragment);
    			attr_dev(div, "class", "table-container svelte-6h7rxc");
    			add_location(div, file$7, 26, 0, 625);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(datatable, div, null);
    			/*div_binding*/ ctx[8](div);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const datatable_changes = {};

    			if (dirty & /*segments, x, y, ycv, e, e2*/ 111) datatable_changes.variables = [
    				{
    					label: "#",
    					values: /*segments*/ ctx[0].num.concat([NaN])
    				},
    				{
    					label: "x",
    					values: /*x*/ ctx[1].concat([NaN])
    				},
    				{
    					label: "y",
    					values: /*y*/ ctx[2].concat([NaN])
    				},
    				{
    					label: "y<sub>cv</sub>",
    					values: /*ycv*/ ctx[3].concat([NaN])
    				},
    				{
    					label: "e",
    					values: /*e*/ ctx[5].concat([NaN])
    				},
    				{
    					label: "e<sup>2</sup>",
    					values: /*e2*/ ctx[6].concat(sum(/*e2*/ ctx[6]))
    				}
    			];

    			datatable.$set(datatable_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(datatable.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(datatable.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(datatable);
    			/*div_binding*/ ctx[8](null);
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
    	let e;
    	let e2;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('AppTable', slots, []);
    	let { segments } = $$props;
    	let { indSeg } = $$props;
    	let { x } = $$props;
    	let { y } = $$props;
    	let { ycv } = $$props;
    	let t;
    	const writable_props = ['segments', 'indSeg', 'x', 'y', 'ycv'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<AppTable> was created with unknown prop '${key}'`);
    	});

    	function div_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			t = $$value;
    			$$invalidate(4, t);
    		});
    	}

    	$$self.$$set = $$props => {
    		if ('segments' in $$props) $$invalidate(0, segments = $$props.segments);
    		if ('indSeg' in $$props) $$invalidate(7, indSeg = $$props.indSeg);
    		if ('x' in $$props) $$invalidate(1, x = $$props.x);
    		if ('y' in $$props) $$invalidate(2, y = $$props.y);
    		if ('ycv' in $$props) $$invalidate(3, ycv = $$props.ycv);
    	};

    	$$self.$capture_state = () => ({
    		sum,
    		vsubtract,
    		vmult,
    		DataTable,
    		segments,
    		indSeg,
    		x,
    		y,
    		ycv,
    		t,
    		e,
    		e2
    	});

    	$$self.$inject_state = $$props => {
    		if ('segments' in $$props) $$invalidate(0, segments = $$props.segments);
    		if ('indSeg' in $$props) $$invalidate(7, indSeg = $$props.indSeg);
    		if ('x' in $$props) $$invalidate(1, x = $$props.x);
    		if ('y' in $$props) $$invalidate(2, y = $$props.y);
    		if ('ycv' in $$props) $$invalidate(3, ycv = $$props.ycv);
    		if ('t' in $$props) $$invalidate(4, t = $$props.t);
    		if ('e' in $$props) $$invalidate(5, e = $$props.e);
    		if ('e2' in $$props) $$invalidate(6, e2 = $$props.e2);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*y, ycv*/ 12) {
    			$$invalidate(5, e = vsubtract(y, ycv));
    		}

    		if ($$self.$$.dirty & /*e*/ 32) {
    			$$invalidate(6, e2 = vmult(e, e));
    		}

    		if ($$self.$$.dirty & /*t, indSeg*/ 144) {
    			t
    			? t.querySelectorAll("table > tr").forEach(e => {
    					e.classList.remove("selected");
    					const c = e.querySelector(".datatable__value");

    					if (c && c.innerHTML === (indSeg + 1).toString()) {
    						e.classList.add("selected");
    					}
    				})
    			: "";
    		}
    	};

    	return [segments, x, y, ycv, t, e, e2, indSeg, div_binding];
    }

    class AppTable extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$9, create_fragment$9, safe_not_equal, {
    			segments: 0,
    			indSeg: 7,
    			x: 1,
    			y: 2,
    			ycv: 3
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "AppTable",
    			options,
    			id: create_fragment$9.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*segments*/ ctx[0] === undefined && !('segments' in props)) {
    			console.warn("<AppTable> was created without expected prop 'segments'");
    		}

    		if (/*indSeg*/ ctx[7] === undefined && !('indSeg' in props)) {
    			console.warn("<AppTable> was created without expected prop 'indSeg'");
    		}

    		if (/*x*/ ctx[1] === undefined && !('x' in props)) {
    			console.warn("<AppTable> was created without expected prop 'x'");
    		}

    		if (/*y*/ ctx[2] === undefined && !('y' in props)) {
    			console.warn("<AppTable> was created without expected prop 'y'");
    		}

    		if (/*ycv*/ ctx[3] === undefined && !('ycv' in props)) {
    			console.warn("<AppTable> was created without expected prop 'ycv'");
    		}
    	}

    	get segments() {
    		throw new Error("<AppTable>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set segments(value) {
    		throw new Error("<AppTable>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get indSeg() {
    		throw new Error("<AppTable>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set indSeg(value) {
    		throw new Error("<AppTable>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get x() {
    		throw new Error("<AppTable>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set x(value) {
    		throw new Error("<AppTable>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get y() {
    		throw new Error("<AppTable>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set y(value) {
    		throw new Error("<AppTable>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get ycv() {
    		throw new Error("<AppTable>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set ycv(value) {
    		throw new Error("<AppTable>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
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
    const file$6 = "../node_modules/svelte-plots-basic/src/Axes.svelte";
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
    			add_location(div, file$6, 337, 21, 12836);
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
    			add_location(span, file$6, 338, 48, 12934);
    			attr_dev(div, "class", "axes__ylabel");
    			add_location(div, file$6, 338, 22, 12908);
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
    			add_location(span, file$6, 339, 48, 13021);
    			attr_dev(div, "class", "axes__xlabel");
    			add_location(div, file$6, 339, 22, 12995);
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
    function create_if_block$6(ctx) {
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
    			add_location(br, file$6, 369, 51, 13916);
    			attr_dev(p, "class", "message_error");
    			add_location(p, file$6, 368, 3, 13839);
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
    		id: create_if_block$6.name,
    		type: "if",
    		source: "(368:3) {#if !$isOk}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$8(ctx) {
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
    	let if_block3 = !/*$isOk*/ ctx[3] && create_if_block$6(ctx);

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
    			add_location(rect, file$6, 348, 15, 13340);
    			attr_dev(clipPath, "id", /*clipPathID*/ ctx[8]);
    			add_location(clipPath, file$6, 347, 12, 13296);
    			add_location(defs, file$6, 346, 9, 13277);
    			attr_dev(g, "clip-path", "url(#" + /*clipPathID*/ ctx[8] + ")");
    			add_location(g, file$6, 357, 9, 13654);
    			attr_dev(svg, "preserveAspectRatio", "none");
    			attr_dev(svg, "class", "axes");
    			add_location(svg, file$6, 343, 6, 13159);
    			attr_dev(div0, "class", "axes-wrapper svelte-n80kcc");
    			add_location(div0, file$6, 342, 3, 13101);
    			attr_dev(div1, "class", div1_class_value = "plot " + ('plot_' + /*$scale*/ ctx[4]) + " svelte-n80kcc");
    			toggle_class(div1, "plot_error", !/*$isOk*/ ctx[3]);
    			add_location(div1, file$6, 334, 0, 12708);
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
    					if_block3 = create_if_block$6(ctx);
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
    		id: create_fragment$8.name,
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

    function instance$8($$self, $$props, $$invalidate) {
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
    			instance$8,
    			create_fragment$8,
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
    			id: create_fragment$8.name
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

    /* ../node_modules/svelte-plots-basic/src/XAxis.svelte generated by Svelte v3.48.0 */
    const file$5 = "../node_modules/svelte-plots-basic/src/XAxis.svelte";

    function get_each_context$3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[26] = list[i];
    	child_ctx[28] = i;
    	return child_ctx;
    }

    // (57:0) {#if $isOk && x !== undefined && y !== undefined }
    function create_if_block$5(ctx) {
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
    			attr_dev(line, "x1", line_x__value = /*x*/ ctx[5][0]);
    			attr_dev(line, "x2", line_x__value_1 = /*x*/ ctx[5][1]);
    			attr_dev(line, "y1", line_y__value = /*y*/ ctx[2][0]);
    			attr_dev(line, "y2", line_y__value_1 = /*y*/ ctx[2][0]);
    			attr_dev(line, "style", /*axisLineStyleStr*/ ctx[7]);
    			add_location(line, file$5, 63, 3, 2597);
    			attr_dev(g, "class", "mdaplot__axis mdaplot__xaxis");
    			add_location(g, file$5, 57, 3, 2169);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, g, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(g, null);
    			}

    			append_dev(g, line);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*ticksX, ticksY, dy, tickLabels, axisLineStyleStr, y, gridLineStyleStr*/ 415) {
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

    			if (dirty & /*x*/ 32 && line_x__value !== (line_x__value = /*x*/ ctx[5][0])) {
    				attr_dev(line, "x1", line_x__value);
    			}

    			if (dirty & /*x*/ 32 && line_x__value_1 !== (line_x__value_1 = /*x*/ ctx[5][1])) {
    				attr_dev(line, "x2", line_x__value_1);
    			}

    			if (dirty & /*y*/ 4 && line_y__value !== (line_y__value = /*y*/ ctx[2][0])) {
    				attr_dev(line, "y1", line_y__value);
    			}

    			if (dirty & /*y*/ 4 && line_y__value_1 !== (line_y__value_1 = /*y*/ ctx[2][0])) {
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
    		id: create_if_block$5.name,
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
    			attr_dev(line0, "y1", line0_y__value = /*y*/ ctx[2][0]);
    			attr_dev(line0, "y2", line0_y__value_1 = /*y*/ ctx[2][1]);
    			attr_dev(line0, "style", /*gridLineStyleStr*/ ctx[8]);
    			add_location(line0, file$5, 59, 6, 2243);
    			attr_dev(line1, "x1", line1_x__value = /*tx*/ ctx[26]);
    			attr_dev(line1, "x2", line1_x__value_1 = /*tx*/ ctx[26]);
    			attr_dev(line1, "y1", line1_y__value = /*ticksY*/ ctx[3][0]);
    			attr_dev(line1, "y2", line1_y__value_1 = /*ticksY*/ ctx[3][1]);
    			attr_dev(line1, "style", /*axisLineStyleStr*/ ctx[7]);
    			add_location(line1, file$5, 60, 6, 2334);
    			attr_dev(text_1, "x", text_1_x_value = /*tx*/ ctx[26]);
    			attr_dev(text_1, "y", text_1_y_value = /*ticksY*/ ctx[3][1]);
    			attr_dev(text_1, "dx", "0");
    			attr_dev(text_1, "dy", /*dy*/ ctx[1]);
    			attr_dev(text_1, "class", "mdaplot__axis-labels");
    			attr_dev(text_1, "dominant-baseline", "middle");
    			attr_dev(text_1, "text-anchor", "middle");
    			add_location(text_1, file$5, 61, 6, 2435);
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

    			if (dirty & /*y*/ 4 && line0_y__value !== (line0_y__value = /*y*/ ctx[2][0])) {
    				attr_dev(line0, "y1", line0_y__value);
    			}

    			if (dirty & /*y*/ 4 && line0_y__value_1 !== (line0_y__value_1 = /*y*/ ctx[2][1])) {
    				attr_dev(line0, "y2", line0_y__value_1);
    			}

    			if (dirty & /*ticksX*/ 16 && line1_x__value !== (line1_x__value = /*tx*/ ctx[26])) {
    				attr_dev(line1, "x1", line1_x__value);
    			}

    			if (dirty & /*ticksX*/ 16 && line1_x__value_1 !== (line1_x__value_1 = /*tx*/ ctx[26])) {
    				attr_dev(line1, "x2", line1_x__value_1);
    			}

    			if (dirty & /*ticksY*/ 8 && line1_y__value !== (line1_y__value = /*ticksY*/ ctx[3][0])) {
    				attr_dev(line1, "y1", line1_y__value);
    			}

    			if (dirty & /*ticksY*/ 8 && line1_y__value_1 !== (line1_y__value_1 = /*ticksY*/ ctx[3][1])) {
    				attr_dev(line1, "y2", line1_y__value_1);
    			}

    			if (dirty & /*tickLabels*/ 1 && t_value !== (t_value = /*tickLabels*/ ctx[0][/*i*/ ctx[28]] + "")) set_data_dev(t, t_value);

    			if (dirty & /*ticksX*/ 16 && text_1_x_value !== (text_1_x_value = /*tx*/ ctx[26])) {
    				attr_dev(text_1, "x", text_1_x_value);
    			}

    			if (dirty & /*ticksY*/ 8 && text_1_y_value !== (text_1_y_value = /*ticksY*/ ctx[3][1])) {
    				attr_dev(text_1, "y", text_1_y_value);
    			}

    			if (dirty & /*dy*/ 2) {
    				attr_dev(text_1, "dy", /*dy*/ ctx[1]);
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

    function create_fragment$7(ctx) {
    	let if_block_anchor;
    	let if_block = /*$isOk*/ ctx[6] && /*x*/ ctx[5] !== undefined && /*y*/ ctx[2] !== undefined && create_if_block$5(ctx);

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
    			if (/*$isOk*/ ctx[6] && /*x*/ ctx[5] !== undefined && /*y*/ ctx[2] !== undefined) {
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
    	let dy;
    	let tickNum;
    	let ticksX;
    	let ticksY;
    	let $axesWidth;
    	let $xLim;
    	let $scale;
    	let $axesHeight;
    	let $yLim;
    	let $isOk;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('XAxis', slots, []);
    	let { slot = "xaxis" } = $$props;
    	let { ticks = undefined } = $$props;
    	let { tickLabels = ticks } = $$props;
    	let { showGrid = false } = $$props;

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
    	const axes = getContext('axes');

    	axes.addXAxisMargins();

    	// get reactive variables needed to compute coordinates
    	const xLim = axes.xLim;

    	validate_store(xLim, 'xLim');
    	component_subscribe($$self, xLim, value => $$invalidate(20, $xLim = value));
    	const yLim = axes.yLim;
    	validate_store(yLim, 'yLim');
    	component_subscribe($$self, yLim, value => $$invalidate(23, $yLim = value));
    	const axesWidth = axes.width;
    	validate_store(axesWidth, 'axesWidth');
    	component_subscribe($$self, axesWidth, value => $$invalidate(19, $axesWidth = value));
    	const axesHeight = axes.height;
    	validate_store(axesHeight, 'axesHeight');
    	component_subscribe($$self, axesHeight, value => $$invalidate(22, $axesHeight = value));
    	const scale = axes.scale;
    	validate_store(scale, 'scale');
    	component_subscribe($$self, scale, value => $$invalidate(21, $scale = value));
    	const isOk = axes.isOk;
    	validate_store(isOk, 'isOk');
    	component_subscribe($$self, isOk, value => $$invalidate(6, $isOk = value));
    	const writable_props = ['slot', 'ticks', 'tickLabels', 'showGrid'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<XAxis> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('slot' in $$props) $$invalidate(16, slot = $$props.slot);
    		if ('ticks' in $$props) $$invalidate(15, ticks = $$props.ticks);
    		if ('tickLabels' in $$props) $$invalidate(0, tickLabels = $$props.tickLabels);
    		if ('showGrid' in $$props) $$invalidate(17, showGrid = $$props.showGrid);
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
    		dy,
    		y,
    		ticksY,
    		ticksX,
    		tickNum,
    		x,
    		$axesWidth,
    		$xLim,
    		$scale,
    		$axesHeight,
    		$yLim,
    		$isOk
    	});

    	$$self.$inject_state = $$props => {
    		if ('slot' in $$props) $$invalidate(16, slot = $$props.slot);
    		if ('ticks' in $$props) $$invalidate(15, ticks = $$props.ticks);
    		if ('tickLabels' in $$props) $$invalidate(0, tickLabels = $$props.tickLabels);
    		if ('showGrid' in $$props) $$invalidate(17, showGrid = $$props.showGrid);
    		if ('dy' in $$props) $$invalidate(1, dy = $$props.dy);
    		if ('y' in $$props) $$invalidate(2, y = $$props.y);
    		if ('ticksY' in $$props) $$invalidate(3, ticksY = $$props.ticksY);
    		if ('ticksX' in $$props) $$invalidate(4, ticksX = $$props.ticksX);
    		if ('tickNum' in $$props) $$invalidate(18, tickNum = $$props.tickNum);
    		if ('x' in $$props) $$invalidate(5, x = $$props.x);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$xLim, $axesWidth*/ 1572864) {
    			// reactive variables for coordinates of axis lines
    			$$invalidate(5, x = axes.scaleX($xLim, $xLim, $axesWidth));
    		}

    		if ($$self.$$.dirty & /*$yLim, $axesHeight*/ 12582912) {
    			$$invalidate(2, y = axes.scaleY($yLim, $yLim, $axesHeight));
    		}

    		if ($$self.$$.dirty & /*$scale*/ 2097152) {
    			// reactive variables for ticks and their coordinates
    			$$invalidate(1, dy = $scale === "small" ? 7 : 10);
    		}

    		if ($$self.$$.dirty & /*$scale*/ 2097152) {
    			$$invalidate(18, tickNum = axes.TICK_NUM[$scale]);
    		}

    		if ($$self.$$.dirty & /*$xLim, tickNum, ticks*/ 1343488) {
    			$$invalidate(15, ticks = tickMode === "auto"
    			? axes.getAxisTicks(undefined, $xLim, tickNum, true)
    			: ticks);
    		}

    		if ($$self.$$.dirty & /*ticks, tickLabels*/ 32769) {
    			$$invalidate(0, tickLabels = tickMode === "auto" ? ticks : tickLabels);
    		}

    		if ($$self.$$.dirty & /*ticks, $xLim, $axesWidth*/ 1605632) {
    			$$invalidate(4, ticksX = axes.scaleX(ticks, $xLim, $axesWidth));
    		}

    		if ($$self.$$.dirty & /*y, dy*/ 6) {
    			$$invalidate(3, ticksY = y === undefined ? undefined : [y[0], y[0] + dy]);
    		}
    	};

    	return [
    		tickLabels,
    		dy,
    		y,
    		ticksY,
    		ticksX,
    		x,
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
    		tickNum,
    		$axesWidth,
    		$xLim,
    		$scale,
    		$axesHeight,
    		$yLim
    	];
    }

    class XAxis extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$7, create_fragment$7, safe_not_equal, {
    			slot: 16,
    			ticks: 15,
    			tickLabels: 0,
    			showGrid: 17
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "XAxis",
    			options,
    			id: create_fragment$7.name
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

    /* ../node_modules/svelte-plots-basic/src/YAxis.svelte generated by Svelte v3.48.0 */
    const file$4 = "../node_modules/svelte-plots-basic/src/YAxis.svelte";

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[26] = list[i];
    	child_ctx[28] = i;
    	return child_ctx;
    }

    // (60:0) {#if x !== undefined && y !== undefined }
    function create_if_block$4(ctx) {
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
    		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
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
    			attr_dev(line, "y1", line_y__value = /*y*/ ctx[5][0]);
    			attr_dev(line, "y2", line_y__value_1 = /*y*/ ctx[5][1]);
    			attr_dev(line, "style", /*axisLineStyleStr*/ ctx[7]);
    			add_location(line, file$4, 66, 3, 2703);
    			attr_dev(g, "class", "mdaplot__axis mdaplot__yaxis");
    			add_location(g, file$4, 60, 3, 2240);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, g, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(g, null);
    			}

    			append_dev(g, line);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*ticksX, ticksY, dx, transform, tickLabels, axisLineStyleStr, x, gridLineStyleStr*/ 479) {
    				each_value = /*ticksY*/ ctx[4];
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

    			if (dirty & /*x*/ 2 && line_x__value !== (line_x__value = /*x*/ ctx[1][0])) {
    				attr_dev(line, "x1", line_x__value);
    			}

    			if (dirty & /*x*/ 2 && line_x__value_1 !== (line_x__value_1 = /*x*/ ctx[1][0])) {
    				attr_dev(line, "x2", line_x__value_1);
    			}

    			if (dirty & /*y*/ 32 && line_y__value !== (line_y__value = /*y*/ ctx[5][0])) {
    				attr_dev(line, "y1", line_y__value);
    			}

    			if (dirty & /*y*/ 32 && line_y__value_1 !== (line_y__value_1 = /*y*/ ctx[5][1])) {
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
    		source: "(60:0) {#if x !== undefined && y !== undefined }",
    		ctx
    	});

    	return block;
    }

    // (62:3) {#each ticksY as ty, i}
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
    			attr_dev(line0, "x1", line0_x__value = /*x*/ ctx[1][0]);
    			attr_dev(line0, "x2", line0_x__value_1 = /*x*/ ctx[1][1]);
    			attr_dev(line0, "y1", line0_y__value = /*ty*/ ctx[26]);
    			attr_dev(line0, "y2", line0_y__value_1 = /*ty*/ ctx[26]);
    			attr_dev(line0, "style", /*gridLineStyleStr*/ ctx[8]);
    			add_location(line0, file$4, 62, 6, 2314);
    			attr_dev(line1, "x1", line1_x__value = /*ticksX*/ ctx[3][0]);
    			attr_dev(line1, "x2", line1_x__value_1 = /*ticksX*/ ctx[3][1]);
    			attr_dev(line1, "y1", line1_y__value = /*ty*/ ctx[26]);
    			attr_dev(line1, "y2", line1_y__value_1 = /*ty*/ ctx[26]);
    			attr_dev(line1, "style", /*axisLineStyleStr*/ ctx[7]);
    			add_location(line1, file$4, 63, 6, 2405);
    			attr_dev(text_1, "x", text_1_x_value = /*ticksX*/ ctx[3][0]);
    			attr_dev(text_1, "y", text_1_y_value = /*ty*/ ctx[26]);
    			attr_dev(text_1, "dx", /*dx*/ ctx[2]);
    			attr_dev(text_1, "dy", 0);
    			attr_dev(text_1, "transform", /*transform*/ ctx[6]);
    			set_style(text_1, "background", "red");
    			attr_dev(text_1, "class", "mdaplot__axis-labels");
    			attr_dev(text_1, "dominant-baseline", "middle");
    			attr_dev(text_1, "text-anchor", "end");
    			add_location(text_1, file$4, 64, 6, 2507);
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

    			if (dirty & /*ticksX*/ 8 && line1_x__value !== (line1_x__value = /*ticksX*/ ctx[3][0])) {
    				attr_dev(line1, "x1", line1_x__value);
    			}

    			if (dirty & /*ticksX*/ 8 && line1_x__value_1 !== (line1_x__value_1 = /*ticksX*/ ctx[3][1])) {
    				attr_dev(line1, "x2", line1_x__value_1);
    			}

    			if (dirty & /*ticksY*/ 16 && line1_y__value !== (line1_y__value = /*ty*/ ctx[26])) {
    				attr_dev(line1, "y1", line1_y__value);
    			}

    			if (dirty & /*ticksY*/ 16 && line1_y__value_1 !== (line1_y__value_1 = /*ty*/ ctx[26])) {
    				attr_dev(line1, "y2", line1_y__value_1);
    			}

    			if (dirty & /*tickLabels*/ 1 && t_value !== (t_value = /*tickLabels*/ ctx[0][/*i*/ ctx[28]] + "")) set_data_dev(t, t_value);

    			if (dirty & /*ticksX*/ 8 && text_1_x_value !== (text_1_x_value = /*ticksX*/ ctx[3][0])) {
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
    		id: create_each_block$2.name,
    		type: "each",
    		source: "(62:3) {#each ticksY as ty, i}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$6(ctx) {
    	let if_block_anchor;
    	let if_block = /*x*/ ctx[1] !== undefined && /*y*/ ctx[5] !== undefined && create_if_block$4(ctx);

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
    			if (/*x*/ ctx[1] !== undefined && /*y*/ ctx[5] !== undefined) {
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
    	let tickNum;
    	let ticksY;
    	let ticksX;
    	let $axesHeight;
    	let $yLim;
    	let $scale;
    	let $axesWidth;
    	let $xLim;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('YAxis', slots, []);
    	let { slot = "yaxis" } = $$props;
    	let { ticks = undefined } = $$props;
    	let { tickLabels = ticks } = $$props;
    	let { showGrid = false } = $$props;
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
    	const axes = getContext('axes');

    	axes.addYAxisMargins();

    	// get reactive variables needed to compute coordinates
    	const xLim = axes.xLim;

    	validate_store(xLim, 'xLim');
    	component_subscribe($$self, xLim, value => $$invalidate(23, $xLim = value));
    	const yLim = axes.yLim;
    	validate_store(yLim, 'yLim');
    	component_subscribe($$self, yLim, value => $$invalidate(20, $yLim = value));
    	const axesWidth = axes.width;
    	validate_store(axesWidth, 'axesWidth');
    	component_subscribe($$self, axesWidth, value => $$invalidate(22, $axesWidth = value));
    	const axesHeight = axes.height;
    	validate_store(axesHeight, 'axesHeight');
    	component_subscribe($$self, axesHeight, value => $$invalidate(19, $axesHeight = value));
    	const scale = axes.scale;
    	validate_store(scale, 'scale');
    	component_subscribe($$self, scale, value => $$invalidate(21, $scale = value));
    	const writable_props = ['slot', 'ticks', 'tickLabels', 'showGrid', 'las'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<YAxis> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('slot' in $$props) $$invalidate(15, slot = $$props.slot);
    		if ('ticks' in $$props) $$invalidate(14, ticks = $$props.ticks);
    		if ('tickLabels' in $$props) $$invalidate(0, tickLabels = $$props.tickLabels);
    		if ('showGrid' in $$props) $$invalidate(16, showGrid = $$props.showGrid);
    		if ('las' in $$props) $$invalidate(17, las = $$props.las);
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
    		dx,
    		ticksX,
    		ticksY,
    		tickNum,
    		y,
    		$axesHeight,
    		$yLim,
    		$scale,
    		$axesWidth,
    		$xLim
    	});

    	$$self.$inject_state = $$props => {
    		if ('slot' in $$props) $$invalidate(15, slot = $$props.slot);
    		if ('ticks' in $$props) $$invalidate(14, ticks = $$props.ticks);
    		if ('tickLabels' in $$props) $$invalidate(0, tickLabels = $$props.tickLabels);
    		if ('showGrid' in $$props) $$invalidate(16, showGrid = $$props.showGrid);
    		if ('las' in $$props) $$invalidate(17, las = $$props.las);
    		if ('x' in $$props) $$invalidate(1, x = $$props.x);
    		if ('dx' in $$props) $$invalidate(2, dx = $$props.dx);
    		if ('ticksX' in $$props) $$invalidate(3, ticksX = $$props.ticksX);
    		if ('ticksY' in $$props) $$invalidate(4, ticksY = $$props.ticksY);
    		if ('tickNum' in $$props) $$invalidate(18, tickNum = $$props.tickNum);
    		if ('y' in $$props) $$invalidate(5, y = $$props.y);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$xLim, $axesWidth*/ 12582912) {
    			// reactive variables for coordinates of axis lines
    			$$invalidate(1, x = axes.scaleX($xLim, $xLim, $axesWidth));
    		}

    		if ($$self.$$.dirty & /*$yLim, $axesHeight*/ 1572864) {
    			$$invalidate(5, y = axes.scaleY($yLim, $yLim, $axesHeight));
    		}

    		if ($$self.$$.dirty & /*$scale*/ 2097152) {
    			// reactive variables for ticks and their coordinates
    			$$invalidate(2, dx = $scale === "small" ? -4 : -6);
    		}

    		if ($$self.$$.dirty & /*$scale*/ 2097152) {
    			$$invalidate(18, tickNum = axes.TICK_NUM[$scale]);
    		}

    		if ($$self.$$.dirty & /*$yLim, tickNum, ticks*/ 1327104) {
    			$$invalidate(14, ticks = tickMode === "auto"
    			? axes.getAxisTicks(undefined, $yLim, tickNum, true)
    			: ticks);
    		}

    		if ($$self.$$.dirty & /*ticks, tickLabels*/ 16385) {
    			$$invalidate(0, tickLabels = tickMode === "auto" ? ticks : tickLabels);
    		}

    		if ($$self.$$.dirty & /*ticks, $yLim, $axesHeight*/ 1589248) {
    			$$invalidate(4, ticksY = axes.scaleY(ticks, $yLim, $axesHeight));
    		}

    		if ($$self.$$.dirty & /*x, dx*/ 6) {
    			$$invalidate(3, ticksX = x === undefined ? undefined : [x[0] + dx, x[0]]);
    		}
    	};

    	return [
    		tickLabels,
    		x,
    		dx,
    		ticksX,
    		ticksY,
    		y,
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
    		tickNum,
    		$axesHeight,
    		$yLim,
    		$scale,
    		$axesWidth,
    		$xLim
    	];
    }

    class YAxis extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {
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
    			id: create_fragment$6.name
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

    /* ../node_modules/svelte-plots-basic/src/TextLabels.svelte generated by Svelte v3.48.0 */
    const file$3 = "../node_modules/svelte-plots-basic/src/TextLabels.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[27] = list[i];
    	child_ctx[29] = i;
    	return child_ctx;
    }

    // (66:0) {#if x !== undefined && y !== undefined}
    function create_if_block$3(ctx) {
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
    			add_location(g, file$3, 66, 3, 2502);
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
    		id: create_if_block$3.name,
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
    			add_location(text_1, file$3, 68, 6, 2592);
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

    function create_fragment$5(ctx) {
    	let if_block_anchor;
    	let if_block = /*x*/ ctx[7] !== undefined && /*y*/ ctx[6] !== undefined && create_if_block$3(ctx);

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

    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {
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
    			id: create_fragment$5.name
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

    /* ../node_modules/svelte-plots-basic/src/TextLegend.svelte generated by Svelte v3.48.0 */
    const file$2 = "../node_modules/svelte-plots-basic/src/TextLegend.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[22] = list[i];
    	child_ctx[24] = i;
    	return child_ctx;
    }

    // (32:0) {#if x !== undefined && y !== undefined && elements.length > 0}
    function create_if_block$2(ctx) {
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

    			attr_dev(text_1, "style", /*textStyleStr*/ ctx[3]);
    			attr_dev(text_1, "x", /*x*/ ctx[5]);
    			attr_dev(text_1, "y", /*y*/ ctx[4]);
    			attr_dev(text_1, "dx", /*dx*/ ctx[0]);
    			attr_dev(text_1, "dy", /*dy*/ ctx[1]);
    			attr_dev(text_1, "dominant-baseline", "middle");
    			attr_dev(text_1, "text-anchor", "start");
    			add_location(text_1, file$2, 32, 3, 1039);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, text_1, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(text_1, null);
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*x, dx, dy, elements*/ 39) {
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

    			if (dirty & /*textStyleStr*/ 8) {
    				attr_dev(text_1, "style", /*textStyleStr*/ ctx[3]);
    			}

    			if (dirty & /*x*/ 32) {
    				attr_dev(text_1, "x", /*x*/ ctx[5]);
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
    		id: create_if_block$2.name,
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
    			attr_dev(tspan, "x", /*x*/ ctx[5]);
    			attr_dev(tspan, "dx", /*dx*/ ctx[0]);
    			attr_dev(tspan, "dy", tspan_dy_value = /*i*/ ctx[24] === 0 ? 0 : /*dy*/ ctx[1]);
    			add_location(tspan, file$2, 34, 9, 1183);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, tspan, anchor);
    			tspan.innerHTML = raw_value;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*elements*/ 4 && raw_value !== (raw_value = /*el*/ ctx[22] + "")) tspan.innerHTML = raw_value;
    			if (dirty & /*x*/ 32) {
    				attr_dev(tspan, "x", /*x*/ ctx[5]);
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

    function create_fragment$4(ctx) {
    	let if_block_anchor;
    	let if_block = /*x*/ ctx[5] !== undefined && /*y*/ ctx[4] !== undefined && /*elements*/ ctx[2].length > 0 && create_if_block$2(ctx);

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
    			if (/*x*/ ctx[5] !== undefined && /*y*/ ctx[4] !== undefined && /*elements*/ ctx[2].length > 0) {
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
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let x;
    	let y;
    	let textStyleStr;
    	let $axesHeight;
    	let $yLim;
    	let $axesWidth;
    	let $xLim;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('TextLegend', slots, []);
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
    	const axes = getContext('axes');

    	const xLim = axes.xLim;
    	validate_store(xLim, 'xLim');
    	component_subscribe($$self, xLim, value => $$invalidate(19, $xLim = value));
    	const yLim = axes.yLim;
    	validate_store(yLim, 'yLim');
    	component_subscribe($$self, yLim, value => $$invalidate(17, $yLim = value));
    	const axesWidth = axes.width;
    	validate_store(axesWidth, 'axesWidth');
    	component_subscribe($$self, axesWidth, value => $$invalidate(18, $axesWidth = value));
    	const axesHeight = axes.height;
    	validate_store(axesHeight, 'axesHeight');
    	component_subscribe($$self, axesHeight, value => $$invalidate(16, $axesHeight = value));
    	const scale = axes.scale;

    	const writable_props = [
    		'left',
    		'top',
    		'dx',
    		'dy',
    		'elements',
    		'faceColor',
    		'borderColor',
    		'borderWidth',
    		'textSize'
    	];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<TextLegend> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('left' in $$props) $$invalidate(10, left = $$props.left);
    		if ('top' in $$props) $$invalidate(11, top = $$props.top);
    		if ('dx' in $$props) $$invalidate(0, dx = $$props.dx);
    		if ('dy' in $$props) $$invalidate(1, dy = $$props.dy);
    		if ('elements' in $$props) $$invalidate(2, elements = $$props.elements);
    		if ('faceColor' in $$props) $$invalidate(12, faceColor = $$props.faceColor);
    		if ('borderColor' in $$props) $$invalidate(13, borderColor = $$props.borderColor);
    		if ('borderWidth' in $$props) $$invalidate(14, borderWidth = $$props.borderWidth);
    		if ('textSize' in $$props) $$invalidate(15, textSize = $$props.textSize);
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
    		textStyleStr,
    		y,
    		x,
    		$axesHeight,
    		$yLim,
    		$axesWidth,
    		$xLim
    	});

    	$$self.$inject_state = $$props => {
    		if ('left' in $$props) $$invalidate(10, left = $$props.left);
    		if ('top' in $$props) $$invalidate(11, top = $$props.top);
    		if ('dx' in $$props) $$invalidate(0, dx = $$props.dx);
    		if ('dy' in $$props) $$invalidate(1, dy = $$props.dy);
    		if ('elements' in $$props) $$invalidate(2, elements = $$props.elements);
    		if ('faceColor' in $$props) $$invalidate(12, faceColor = $$props.faceColor);
    		if ('borderColor' in $$props) $$invalidate(13, borderColor = $$props.borderColor);
    		if ('borderWidth' in $$props) $$invalidate(14, borderWidth = $$props.borderWidth);
    		if ('textSize' in $$props) $$invalidate(15, textSize = $$props.textSize);
    		if ('textStyleStr' in $$props) $$invalidate(3, textStyleStr = $$props.textStyleStr);
    		if ('y' in $$props) $$invalidate(4, y = $$props.y);
    		if ('x' in $$props) $$invalidate(5, x = $$props.x);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*left, $xLim, $axesWidth*/ 787456) {
    			// reactive variables for coordinates of data points in pixels
    			$$invalidate(5, x = axes.scaleX([left], $xLim, $axesWidth));
    		}

    		if ($$self.$$.dirty & /*top, $yLim, $axesHeight*/ 198656) {
    			$$invalidate(4, y = axes.scaleY([top], $yLim, $axesHeight));
    		}

    		if ($$self.$$.dirty & /*faceColor, borderWidth, borderColor, textSize*/ 61440) {
    			// styles for bars and labels
    			$$invalidate(3, textStyleStr = `fill:${faceColor};stroke-width:${borderWidth}px;stroke:${borderColor};font-size:${textSize}em;`);
    		}
    	};

    	return [
    		dx,
    		dy,
    		elements,
    		textStyleStr,
    		y,
    		x,
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
    		$axesHeight,
    		$yLim,
    		$axesWidth,
    		$xLim
    	];
    }

    class TextLegend extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {
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
    			id: create_fragment$4.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*left*/ ctx[10] === undefined && !('left' in props)) {
    			console.warn("<TextLegend> was created without expected prop 'left'");
    		}

    		if (/*top*/ ctx[11] === undefined && !('top' in props)) {
    			console.warn("<TextLegend> was created without expected prop 'top'");
    		}

    		if (/*elements*/ ctx[2] === undefined && !('elements' in props)) {
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

    function create_fragment$3(ctx) {
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
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
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

    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {
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
    			id: create_fragment$3.name
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

    /* ../node_modules/svelte-plots-basic/src/LineSeries.svelte generated by Svelte v3.48.0 */
    const file$1 = "../node_modules/svelte-plots-basic/src/LineSeries.svelte";

    // (43:0) {#if p !== undefined}
    function create_if_block$1(ctx) {
    	let g;
    	let polyline;

    	const block = {
    		c: function create() {
    			g = svg_element("g");
    			polyline = svg_element("polyline");
    			attr_dev(polyline, "class", "line");
    			attr_dev(polyline, "points", /*p*/ ctx[2]);
    			add_location(polyline, file$1, 44, 6, 1622);
    			attr_dev(g, "class", "series series_line");
    			attr_dev(g, "style", /*lineStyleStr*/ ctx[1]);
    			attr_dev(g, "title", /*title*/ ctx[0]);
    			add_location(g, file$1, 43, 3, 1550);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, g, anchor);
    			append_dev(g, polyline);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*p*/ 4) {
    				attr_dev(polyline, "points", /*p*/ ctx[2]);
    			}

    			if (dirty & /*lineStyleStr*/ 2) {
    				attr_dev(g, "style", /*lineStyleStr*/ ctx[1]);
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

    function create_fragment$2(ctx) {
    	let if_block_anchor;
    	let if_block = /*p*/ ctx[2] !== undefined && create_if_block$1(ctx);

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
    			if (/*p*/ ctx[2] !== undefined) {
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
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let x;
    	let y;
    	let p;
    	let lineStyleStr;
    	let $scale;
    	let $axesHeight;
    	let $yLim;
    	let $axesWidth;
    	let $xLim;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('LineSeries', slots, []);
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
    	const axes = getContext('axes');

    	axes.adjustXAxisLimits(xValuesRange);
    	axes.adjustYAxisLimits(yValuesRange);

    	// get reactive variables needed to compute coordinates
    	const xLim = axes.xLim;

    	validate_store(xLim, 'xLim');
    	component_subscribe($$self, xLim, value => $$invalidate(19, $xLim = value));
    	const yLim = axes.yLim;
    	validate_store(yLim, 'yLim');
    	component_subscribe($$self, yLim, value => $$invalidate(17, $yLim = value));
    	const axesWidth = axes.width;
    	validate_store(axesWidth, 'axesWidth');
    	component_subscribe($$self, axesWidth, value => $$invalidate(18, $axesWidth = value));
    	const axesHeight = axes.height;
    	validate_store(axesHeight, 'axesHeight');
    	component_subscribe($$self, axesHeight, value => $$invalidate(16, $axesHeight = value));
    	const scale = axes.scale;
    	validate_store(scale, 'scale');
    	component_subscribe($$self, scale, value => $$invalidate(15, $scale = value));
    	const writable_props = ['xValues', 'yValues', 'title', 'lineWidth', 'lineColor', 'lineType'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<LineSeries> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('xValues' in $$props) $$invalidate(8, xValues = $$props.xValues);
    		if ('yValues' in $$props) $$invalidate(9, yValues = $$props.yValues);
    		if ('title' in $$props) $$invalidate(0, title = $$props.title);
    		if ('lineWidth' in $$props) $$invalidate(10, lineWidth = $$props.lineWidth);
    		if ('lineColor' in $$props) $$invalidate(11, lineColor = $$props.lineColor);
    		if ('lineType' in $$props) $$invalidate(12, lineType = $$props.lineType);
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
    		lineStyleStr,
    		y,
    		x,
    		p,
    		$scale,
    		$axesHeight,
    		$yLim,
    		$axesWidth,
    		$xLim
    	});

    	$$self.$inject_state = $$props => {
    		if ('xValues' in $$props) $$invalidate(8, xValues = $$props.xValues);
    		if ('yValues' in $$props) $$invalidate(9, yValues = $$props.yValues);
    		if ('title' in $$props) $$invalidate(0, title = $$props.title);
    		if ('lineWidth' in $$props) $$invalidate(10, lineWidth = $$props.lineWidth);
    		if ('lineColor' in $$props) $$invalidate(11, lineColor = $$props.lineColor);
    		if ('lineType' in $$props) $$invalidate(12, lineType = $$props.lineType);
    		if ('lineStyleStr' in $$props) $$invalidate(1, lineStyleStr = $$props.lineStyleStr);
    		if ('y' in $$props) $$invalidate(13, y = $$props.y);
    		if ('x' in $$props) $$invalidate(14, x = $$props.x);
    		if ('p' in $$props) $$invalidate(2, p = $$props.p);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*xValues, $xLim, $axesWidth*/ 786688) {
    			// reactive variables for coordinates of data points in pixels
    			$$invalidate(14, x = axes.scaleX(xValues, $xLim, $axesWidth));
    		}

    		if ($$self.$$.dirty & /*yValues, $yLim, $axesHeight*/ 197120) {
    			$$invalidate(13, y = axes.scaleY(yValues, $yLim, $axesHeight));
    		}

    		if ($$self.$$.dirty & /*x, y*/ 24576) {
    			$$invalidate(2, p = x !== undefined && y !== undefined
    			? x.map((v, i) => `${v},${y[i]}`).join(' ')
    			: undefined);
    		}

    		if ($$self.$$.dirty & /*lineColor, lineWidth, $scale, lineType*/ 39936) {
    			$$invalidate(1, lineStyleStr = `fill:transparent;stroke:${lineColor};stroke-width: ${lineWidth}px;
      stroke-dasharray:${axes.LINE_STYLES[$scale][lineType - 1]}`);
    		}
    	};

    	return [
    		title,
    		lineStyleStr,
    		p,
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
    		y,
    		x,
    		$scale,
    		$axesHeight,
    		$yLim,
    		$axesWidth,
    		$xLim
    	];
    }

    class LineSeries extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {
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
    			id: create_fragment$2.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*xValues*/ ctx[8] === undefined && !('xValues' in props)) {
    			console.warn("<LineSeries> was created without expected prop 'xValues'");
    		}

    		if (/*yValues*/ ctx[9] === undefined && !('yValues' in props)) {
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

    /* src/AppPlot.svelte generated by Svelte v3.48.0 */

    // (71:3) {#if localModel !== undefined && indSeg >= 0}
    function create_if_block_1(ctx) {
    	let scatterseries0;
    	let t0;
    	let scatterseries1;
    	let t1;
    	let lineseries;
    	let t2;
    	let textlegend;
    	let current;

    	scatterseries0 = new ScatterSeries({
    			props: {
    				xValues: /*xLocal*/ ctx[6],
    				yValues: /*yLocal*/ ctx[7],
    				markerSize: 1.2,
    				borderWidth: 2,
    				borderColor: /*colorLocal*/ ctx[15]
    			},
    			$$inline: true
    		});

    	scatterseries1 = new ScatterSeries({
    			props: {
    				xValues: /*xLocalVal*/ ctx[8],
    				yValues: /*yLocalVal*/ ctx[9],
    				borderWidth: 2,
    				markerSize: 1.2,
    				borderColor: colorLocalVal
    			},
    			$$inline: true
    		});

    	lineseries = new LineSeries({
    			props: {
    				xValues: /*lineX*/ ctx[5],
    				yValues: /*lineYLocal*/ ctx[11],
    				lineColor: /*colorLocal*/ ctx[15]
    			},
    			$$inline: true
    		});

    	textlegend = new TextLegend({
    			props: {
    				textSize: 1.05,
    				left: min$1(/*xGlobal*/ ctx[4]) * 0.55 + max$1(/*xGlobal*/ ctx[4]) * 0.45,
    				top: min$1(/*yGlobal*/ ctx[3]) * 0.8 + max$1(/*yGlobal*/ ctx[3]) * 0.2,
    				dx: "1em",
    				dy: "1.35em",
    				elements: /*textLocal*/ ctx[10]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(scatterseries0.$$.fragment);
    			t0 = space();
    			create_component(scatterseries1.$$.fragment);
    			t1 = space();
    			create_component(lineseries.$$.fragment);
    			t2 = space();
    			create_component(textlegend.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(scatterseries0, target, anchor);
    			insert_dev(target, t0, anchor);
    			mount_component(scatterseries1, target, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(lineseries, target, anchor);
    			insert_dev(target, t2, anchor);
    			mount_component(textlegend, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const scatterseries0_changes = {};
    			if (dirty & /*xLocal*/ 64) scatterseries0_changes.xValues = /*xLocal*/ ctx[6];
    			if (dirty & /*yLocal*/ 128) scatterseries0_changes.yValues = /*yLocal*/ ctx[7];
    			scatterseries0.$set(scatterseries0_changes);
    			const scatterseries1_changes = {};
    			if (dirty & /*xLocalVal*/ 256) scatterseries1_changes.xValues = /*xLocalVal*/ ctx[8];
    			if (dirty & /*yLocalVal*/ 512) scatterseries1_changes.yValues = /*yLocalVal*/ ctx[9];
    			scatterseries1.$set(scatterseries1_changes);
    			const lineseries_changes = {};
    			if (dirty & /*lineX*/ 32) lineseries_changes.xValues = /*lineX*/ ctx[5];
    			if (dirty & /*lineYLocal*/ 2048) lineseries_changes.yValues = /*lineYLocal*/ ctx[11];
    			lineseries.$set(lineseries_changes);
    			const textlegend_changes = {};
    			if (dirty & /*xGlobal*/ 16) textlegend_changes.left = min$1(/*xGlobal*/ ctx[4]) * 0.55 + max$1(/*xGlobal*/ ctx[4]) * 0.45;
    			if (dirty & /*yGlobal*/ 8) textlegend_changes.top = min$1(/*yGlobal*/ ctx[3]) * 0.8 + max$1(/*yGlobal*/ ctx[3]) * 0.2;
    			if (dirty & /*textLocal*/ 1024) textlegend_changes.elements = /*textLocal*/ ctx[10];
    			textlegend.$set(textlegend_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(scatterseries0.$$.fragment, local);
    			transition_in(scatterseries1.$$.fragment, local);
    			transition_in(lineseries.$$.fragment, local);
    			transition_in(textlegend.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(scatterseries0.$$.fragment, local);
    			transition_out(scatterseries1.$$.fragment, local);
    			transition_out(lineseries.$$.fragment, local);
    			transition_out(textlegend.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(scatterseries0, detaching);
    			if (detaching) detach_dev(t0);
    			destroy_component(scatterseries1, detaching);
    			if (detaching) detach_dev(t1);
    			destroy_component(lineseries, detaching);
    			if (detaching) detach_dev(t2);
    			destroy_component(textlegend, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(71:3) {#if localModel !== undefined && indSeg >= 0}",
    		ctx
    	});

    	return block;
    }

    // (79:3) {#if statCV !== undefined}
    function create_if_block(ctx) {
    	let textlegend;
    	let current;

    	textlegend = new TextLegend({
    			props: {
    				textSize: 1.05,
    				left: min$1(/*xGlobal*/ ctx[4]) * 0.45 + max$1(/*xGlobal*/ ctx[4]) * 0.55,
    				top: min$1(/*yGlobal*/ ctx[3]) * 0.8 + max$1(/*yGlobal*/ ctx[3]) * 0.2,
    				dx: "1em",
    				dy: "1.35em",
    				elements: /*textLocal*/ ctx[10]
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
    			if (dirty & /*xGlobal*/ 16) textlegend_changes.left = min$1(/*xGlobal*/ ctx[4]) * 0.45 + max$1(/*xGlobal*/ ctx[4]) * 0.55;
    			if (dirty & /*yGlobal*/ 8) textlegend_changes.top = min$1(/*yGlobal*/ ctx[3]) * 0.8 + max$1(/*yGlobal*/ ctx[3]) * 0.2;
    			if (dirty & /*textLocal*/ 1024) textlegend_changes.elements = /*textLocal*/ ctx[10];
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
    		source: "(79:3) {#if statCV !== undefined}",
    		ctx
    	});

    	return block;
    }

    // (63:0) <Axes limX={mrange(xGlobal)} limY={mrange(yGlobal)} xLabel="x" yLabel="y">
    function create_default_slot$1(ctx) {
    	let scatterseries;
    	let t0;
    	let lineseries;
    	let t1;
    	let textlegend;
    	let t2;
    	let t3;
    	let t4;
    	let current;

    	scatterseries = new ScatterSeries({
    			props: {
    				xValues: /*xGlobal*/ ctx[4],
    				yValues: /*yGlobal*/ ctx[3],
    				borderWidth: 1,
    				faceColor: /*colorGlobal*/ ctx[14],
    				borderColor: /*colorGlobal*/ ctx[14]
    			},
    			$$inline: true
    		});

    	lineseries = new LineSeries({
    			props: {
    				xValues: /*lineX*/ ctx[5],
    				yValues: /*lineYGlobal*/ ctx[12],
    				lineColor: /*colorGlobal*/ ctx[14]
    			},
    			$$inline: true
    		});

    	textlegend = new TextLegend({
    			props: {
    				textSize: 1.05,
    				left: min$1(/*xGlobal*/ ctx[4]),
    				top: max$1(/*yGlobal*/ ctx[3]),
    				dx: "1em",
    				dy: "1.35em",
    				elements: /*textGlobal*/ ctx[13]
    			},
    			$$inline: true
    		});

    	let if_block0 = /*localModel*/ ctx[0] !== undefined && /*indSeg*/ ctx[1] >= 0 && create_if_block_1(ctx);
    	let if_block1 = /*statCV*/ ctx[2] !== undefined && create_if_block(ctx);
    	const default_slot_template = /*#slots*/ ctx[18].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[19], null);

    	const block = {
    		c: function create() {
    			create_component(scatterseries.$$.fragment);
    			t0 = space();
    			create_component(lineseries.$$.fragment);
    			t1 = space();
    			create_component(textlegend.$$.fragment);
    			t2 = space();
    			if (if_block0) if_block0.c();
    			t3 = space();
    			if (if_block1) if_block1.c();
    			t4 = space();
    			if (default_slot) default_slot.c();
    		},
    		m: function mount(target, anchor) {
    			mount_component(scatterseries, target, anchor);
    			insert_dev(target, t0, anchor);
    			mount_component(lineseries, target, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(textlegend, target, anchor);
    			insert_dev(target, t2, anchor);
    			if (if_block0) if_block0.m(target, anchor);
    			insert_dev(target, t3, anchor);
    			if (if_block1) if_block1.m(target, anchor);
    			insert_dev(target, t4, anchor);

    			if (default_slot) {
    				default_slot.m(target, anchor);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const scatterseries_changes = {};
    			if (dirty & /*xGlobal*/ 16) scatterseries_changes.xValues = /*xGlobal*/ ctx[4];
    			if (dirty & /*yGlobal*/ 8) scatterseries_changes.yValues = /*yGlobal*/ ctx[3];
    			scatterseries.$set(scatterseries_changes);
    			const lineseries_changes = {};
    			if (dirty & /*lineX*/ 32) lineseries_changes.xValues = /*lineX*/ ctx[5];
    			if (dirty & /*lineYGlobal*/ 4096) lineseries_changes.yValues = /*lineYGlobal*/ ctx[12];
    			lineseries.$set(lineseries_changes);
    			const textlegend_changes = {};
    			if (dirty & /*xGlobal*/ 16) textlegend_changes.left = min$1(/*xGlobal*/ ctx[4]);
    			if (dirty & /*yGlobal*/ 8) textlegend_changes.top = max$1(/*yGlobal*/ ctx[3]);
    			if (dirty & /*textGlobal*/ 8192) textlegend_changes.elements = /*textGlobal*/ ctx[13];
    			textlegend.$set(textlegend_changes);

    			if (/*localModel*/ ctx[0] !== undefined && /*indSeg*/ ctx[1] >= 0) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);

    					if (dirty & /*localModel, indSeg*/ 3) {
    						transition_in(if_block0, 1);
    					}
    				} else {
    					if_block0 = create_if_block_1(ctx);
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(t3.parentNode, t3);
    				}
    			} else if (if_block0) {
    				group_outros();

    				transition_out(if_block0, 1, 1, () => {
    					if_block0 = null;
    				});

    				check_outros();
    			}

    			if (/*statCV*/ ctx[2] !== undefined) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);

    					if (dirty & /*statCV*/ 4) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(t4.parentNode, t4);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}

    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 524288)) {
    					update_slot_base(
    						default_slot,
    						default_slot_template,
    						ctx,
    						/*$$scope*/ ctx[19],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[19])
    						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[19], dirty, null),
    						null
    					);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(scatterseries.$$.fragment, local);
    			transition_in(lineseries.$$.fragment, local);
    			transition_in(textlegend.$$.fragment, local);
    			transition_in(if_block0);
    			transition_in(if_block1);
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(scatterseries.$$.fragment, local);
    			transition_out(lineseries.$$.fragment, local);
    			transition_out(textlegend.$$.fragment, local);
    			transition_out(if_block0);
    			transition_out(if_block1);
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(scatterseries, detaching);
    			if (detaching) detach_dev(t0);
    			destroy_component(lineseries, detaching);
    			if (detaching) detach_dev(t1);
    			destroy_component(textlegend, detaching);
    			if (detaching) detach_dev(t2);
    			if (if_block0) if_block0.d(detaching);
    			if (detaching) detach_dev(t3);
    			if (if_block1) if_block1.d(detaching);
    			if (detaching) detach_dev(t4);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$1.name,
    		type: "slot",
    		source: "(63:0) <Axes limX={mrange(xGlobal)} limY={mrange(yGlobal)} xLabel=\\\"x\\\" yLabel=\\\"y\\\">",
    		ctx
    	});

    	return block;
    }

    // (83:3) 
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
    		source: "(83:3) ",
    		ctx
    	});

    	return block;
    }

    // (84:3) 
    function create_yaxis_slot(ctx) {
    	let yaxis;
    	let current;
    	yaxis = new YAxis({ props: { slot: "yaxis" }, $$inline: true });

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
    		source: "(84:3) ",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let axes;
    	let current;

    	axes = new Axes({
    			props: {
    				limX: mrange$1(/*xGlobal*/ ctx[4]),
    				limY: mrange$1(/*yGlobal*/ ctx[3]),
    				xLabel: "x",
    				yLabel: "y",
    				$$slots: {
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
    			if (dirty & /*xGlobal*/ 16) axes_changes.limX = mrange$1(/*xGlobal*/ ctx[4]);
    			if (dirty & /*yGlobal*/ 8) axes_changes.limY = mrange$1(/*yGlobal*/ ctx[3]);

    			if (dirty & /*$$scope, xGlobal, yGlobal, textLocal, statCV, lineX, lineYLocal, xLocalVal, yLocalVal, xLocal, yLocal, localModel, indSeg, textGlobal, lineYGlobal*/ 540671) {
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

    const colorLocalVal = "#ff0000";

    // function for getting strings with model info
    function getModelString(m, name) {
    	return [
    		`<tspan font-weight=bold>${name}:</tspan>`,
    		'y =  ' + m.coeffs.estimate.map((b, p) => (p > 0 ? '+' : '') + ' <tspan fill="#0000ff" font-weight=bold>' + b.toFixed(2) + '</tspan>' + (p > 0 ? '<tspan font-weight=bold>x</tspan>' : '') + (p > 1
    		? '<tspan font-size="70%" baseline-shift = "super">' + p + '</tspan>'
    		: '')).join(" ")
    	];
    }

    // function for getting strings with prediction statistics
    function getStatString(s) {
    	return [
    		`s(e) =  <tspan font-weight=bold>${s.se.toFixed(2)}</tspan>`,
    		`R2 =  <tspan font-weight=bold>${s.R2.toFixed(3)}</tspan>`
    	];
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let xGlobal;
    	let yGlobal;
    	let lineX;
    	let textGlobal;
    	let lineYGlobal;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('AppPlot', slots, ['default']);
    	let { globalModel } = $$props;
    	let { localModel } = $$props;
    	let { indSeg } = $$props;
    	let { segments } = $$props;
    	let { statCV } = $$props;
    	const colorGlobal = colors.plots.SAMPLES[0] + "60";
    	const colorLocal = colors.plots.SAMPLES[0];
    	let xLocal = [];
    	let yLocal = [];
    	let xLocalVal = [];
    	let yLocalVal = [];
    	let textLocal = [];
    	let lineYLocal = [];
    	const writable_props = ['globalModel', 'localModel', 'indSeg', 'segments', 'statCV'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<AppPlot> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('globalModel' in $$props) $$invalidate(16, globalModel = $$props.globalModel);
    		if ('localModel' in $$props) $$invalidate(0, localModel = $$props.localModel);
    		if ('indSeg' in $$props) $$invalidate(1, indSeg = $$props.indSeg);
    		if ('segments' in $$props) $$invalidate(17, segments = $$props.segments);
    		if ('statCV' in $$props) $$invalidate(2, statCV = $$props.statCV);
    		if ('$$scope' in $$props) $$invalidate(19, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		max: max$1,
    		min: min$1,
    		mrange: mrange$1,
    		subset,
    		seq,
    		polypredict,
    		Axes,
    		XAxis,
    		YAxis,
    		ScatterSeries,
    		LineSeries,
    		TextLegend,
    		colors,
    		globalModel,
    		localModel,
    		indSeg,
    		segments,
    		statCV,
    		colorGlobal,
    		colorLocal,
    		colorLocalVal,
    		xLocal,
    		yLocal,
    		xLocalVal,
    		yLocalVal,
    		textLocal,
    		lineYLocal,
    		getModelString,
    		getStatString,
    		yGlobal,
    		xGlobal,
    		lineX,
    		lineYGlobal,
    		textGlobal
    	});

    	$$self.$inject_state = $$props => {
    		if ('globalModel' in $$props) $$invalidate(16, globalModel = $$props.globalModel);
    		if ('localModel' in $$props) $$invalidate(0, localModel = $$props.localModel);
    		if ('indSeg' in $$props) $$invalidate(1, indSeg = $$props.indSeg);
    		if ('segments' in $$props) $$invalidate(17, segments = $$props.segments);
    		if ('statCV' in $$props) $$invalidate(2, statCV = $$props.statCV);
    		if ('xLocal' in $$props) $$invalidate(6, xLocal = $$props.xLocal);
    		if ('yLocal' in $$props) $$invalidate(7, yLocal = $$props.yLocal);
    		if ('xLocalVal' in $$props) $$invalidate(8, xLocalVal = $$props.xLocalVal);
    		if ('yLocalVal' in $$props) $$invalidate(9, yLocalVal = $$props.yLocalVal);
    		if ('textLocal' in $$props) $$invalidate(10, textLocal = $$props.textLocal);
    		if ('lineYLocal' in $$props) $$invalidate(11, lineYLocal = $$props.lineYLocal);
    		if ('yGlobal' in $$props) $$invalidate(3, yGlobal = $$props.yGlobal);
    		if ('xGlobal' in $$props) $$invalidate(4, xGlobal = $$props.xGlobal);
    		if ('lineX' in $$props) $$invalidate(5, lineX = $$props.lineX);
    		if ('lineYGlobal' in $$props) $$invalidate(12, lineYGlobal = $$props.lineYGlobal);
    		if ('textGlobal' in $$props) $$invalidate(13, textGlobal = $$props.textGlobal);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*globalModel*/ 65536) {
    			// points and statistics for global model
    			$$invalidate(4, xGlobal = globalModel.data.X[0]);
    		}

    		if ($$self.$$.dirty & /*globalModel*/ 65536) {
    			$$invalidate(3, yGlobal = globalModel.data.y);
    		}

    		if ($$self.$$.dirty & /*xGlobal*/ 16) {
    			$$invalidate(5, lineX = seq(min$1(xGlobal), max$1(xGlobal), 100));
    		}

    		if ($$self.$$.dirty & /*globalModel*/ 65536) {
    			$$invalidate(13, textGlobal = getModelString(globalModel, "Global model").concat(getStatString(globalModel.stat)));
    		}

    		if ($$self.$$.dirty & /*globalModel, lineX*/ 65568) {
    			$$invalidate(12, lineYGlobal = polypredict(globalModel, lineX));
    		}

    		if ($$self.$$.dirty & /*localModel, indSeg, statCV, lineX, xGlobal, segments, yGlobal*/ 131135) {
    			// points and statistics for current local model
    			if (localModel !== undefined) {
    				$$invalidate(6, xLocal = localModel.data.X[0]);
    				$$invalidate(7, yLocal = localModel.data.y);

    				$$invalidate(10, textLocal = indSeg >= 0
    				? getModelString(localModel, "Local model")
    				: ["<tspan font-weight=bold>CV performance:</tspan>"].concat(getStatString(statCV)));

    				$$invalidate(11, lineYLocal = polypredict(localModel, lineX));
    				$$invalidate(8, xLocalVal = subset(xGlobal, segments.val[indSeg]));
    				$$invalidate(9, yLocalVal = subset(yGlobal, segments.val[indSeg]));
    			}
    		}
    	};

    	return [
    		localModel,
    		indSeg,
    		statCV,
    		yGlobal,
    		xGlobal,
    		lineX,
    		xLocal,
    		yLocal,
    		xLocalVal,
    		yLocalVal,
    		textLocal,
    		lineYLocal,
    		lineYGlobal,
    		textGlobal,
    		colorGlobal,
    		colorLocal,
    		globalModel,
    		segments,
    		slots,
    		$$scope
    	];
    }

    class AppPlot extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {
    			globalModel: 16,
    			localModel: 0,
    			indSeg: 1,
    			segments: 17,
    			statCV: 2
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "AppPlot",
    			options,
    			id: create_fragment$1.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*globalModel*/ ctx[16] === undefined && !('globalModel' in props)) {
    			console.warn("<AppPlot> was created without expected prop 'globalModel'");
    		}

    		if (/*localModel*/ ctx[0] === undefined && !('localModel' in props)) {
    			console.warn("<AppPlot> was created without expected prop 'localModel'");
    		}

    		if (/*indSeg*/ ctx[1] === undefined && !('indSeg' in props)) {
    			console.warn("<AppPlot> was created without expected prop 'indSeg'");
    		}

    		if (/*segments*/ ctx[17] === undefined && !('segments' in props)) {
    			console.warn("<AppPlot> was created without expected prop 'segments'");
    		}

    		if (/*statCV*/ ctx[2] === undefined && !('statCV' in props)) {
    			console.warn("<AppPlot> was created without expected prop 'statCV'");
    		}
    	}

    	get globalModel() {
    		throw new Error("<AppPlot>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set globalModel(value) {
    		throw new Error("<AppPlot>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get localModel() {
    		throw new Error("<AppPlot>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set localModel(value) {
    		throw new Error("<AppPlot>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get indSeg() {
    		throw new Error("<AppPlot>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set indSeg(value) {
    		throw new Error("<AppPlot>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get segments() {
    		throw new Error("<AppPlot>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set segments(value) {
    		throw new Error("<AppPlot>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get statCV() {
    		throw new Error("<AppPlot>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set statCV(value) {
    		throw new Error("<AppPlot>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/App.svelte generated by Svelte v3.48.0 */
    const file = "src/App.svelte";

    // (132:9) <AppControlArea>
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
    		/*appcontrolswitch0_value_binding*/ ctx[11](value);
    	}

    	let appcontrolswitch0_props = {
    		id: "cvType",
    		label: "CV",
    		options: ["full", "random", "venetian"]
    	};

    	if (/*cvType*/ ctx[0] !== void 0) {
    		appcontrolswitch0_props.value = /*cvType*/ ctx[0];
    	}

    	appcontrolswitch0 = new AppControlSwitch({
    			props: appcontrolswitch0_props,
    			$$inline: true
    		});

    	binding_callbacks.push(() => bind(appcontrolswitch0, 'value', appcontrolswitch0_value_binding));

    	function appcontrolswitch1_value_binding(value) {
    		/*appcontrolswitch1_value_binding*/ ctx[12](value);
    	}

    	let appcontrolswitch1_props = {
    		id: "pDegree",
    		label: "Polynomial",
    		options: [1, 2, 3]
    	};

    	if (/*pDegree*/ ctx[1] !== void 0) {
    		appcontrolswitch1_props.value = /*pDegree*/ ctx[1];
    	}

    	appcontrolswitch1 = new AppControlSwitch({
    			props: appcontrolswitch1_props,
    			$$inline: true
    		});

    	binding_callbacks.push(() => bind(appcontrolswitch1, 'value', appcontrolswitch1_value_binding));

    	appcontrolbutton = new AppControlButton({
    			props: { id: "runCV", label: "", text: "Run" },
    			$$inline: true
    		});

    	appcontrolbutton.$on("click", /*click_handler*/ ctx[13]);

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

    			if (!updating_value && dirty & /*cvType*/ 1) {
    				updating_value = true;
    				appcontrolswitch0_changes.value = /*cvType*/ ctx[0];
    				add_flush_callback(() => updating_value = false);
    			}

    			appcontrolswitch0.$set(appcontrolswitch0_changes);
    			const appcontrolswitch1_changes = {};

    			if (!updating_value_1 && dirty & /*pDegree*/ 2) {
    				updating_value_1 = true;
    				appcontrolswitch1_changes.value = /*pDegree*/ ctx[1];
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
    		source: "(132:9) <AppControlArea>",
    		ctx
    	});

    	return block;
    }

    // (119:0) <StatApp>
    function create_default_slot(ctx) {
    	let div3;
    	let div0;
    	let appplot;
    	let t0;
    	let div1;
    	let apptable;
    	let t1;
    	let div2;
    	let appcontrolarea;
    	let current;

    	appplot = new AppPlot({
    			props: {
    				segments: /*segments*/ ctx[2],
    				indSeg: /*indSeg*/ ctx[3],
    				statCV: /*statCV*/ ctx[5],
    				localModel: /*localModel*/ ctx[6],
    				globalModel: /*globalModel*/ ctx[7]
    			},
    			$$inline: true
    		});

    	apptable = new AppTable({
    			props: {
    				segments: /*segments*/ ctx[2],
    				indSeg: /*indSeg*/ ctx[3],
    				x: /*sampX*/ ctx[8],
    				y: /*sampY*/ ctx[9],
    				ycv: /*yCV*/ ctx[4]
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
    			create_component(appplot.$$.fragment);
    			t0 = space();
    			div1 = element("div");
    			create_component(apptable.$$.fragment);
    			t1 = space();
    			div2 = element("div");
    			create_component(appcontrolarea.$$.fragment);
    			attr_dev(div0, "class", "app-plot-area svelte-s1hwyg");
    			add_location(div0, file, 121, 6, 3806);
    			attr_dev(div1, "class", "app-table-area svelte-s1hwyg");
    			add_location(div1, file, 125, 6, 3961);
    			attr_dev(div2, "class", "app-controls-area svelte-s1hwyg");
    			add_location(div2, file, 129, 6, 4105);
    			attr_dev(div3, "class", "app-layout svelte-s1hwyg");
    			add_location(div3, file, 119, 3, 3774);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div3, anchor);
    			append_dev(div3, div0);
    			mount_component(appplot, div0, null);
    			append_dev(div3, t0);
    			append_dev(div3, div1);
    			mount_component(apptable, div1, null);
    			append_dev(div3, t1);
    			append_dev(div3, div2);
    			mount_component(appcontrolarea, div2, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const appplot_changes = {};
    			if (dirty & /*segments*/ 4) appplot_changes.segments = /*segments*/ ctx[2];
    			if (dirty & /*indSeg*/ 8) appplot_changes.indSeg = /*indSeg*/ ctx[3];
    			if (dirty & /*statCV*/ 32) appplot_changes.statCV = /*statCV*/ ctx[5];
    			if (dirty & /*localModel*/ 64) appplot_changes.localModel = /*localModel*/ ctx[6];
    			if (dirty & /*globalModel*/ 128) appplot_changes.globalModel = /*globalModel*/ ctx[7];
    			appplot.$set(appplot_changes);
    			const apptable_changes = {};
    			if (dirty & /*segments*/ 4) apptable_changes.segments = /*segments*/ ctx[2];
    			if (dirty & /*indSeg*/ 8) apptable_changes.indSeg = /*indSeg*/ ctx[3];
    			if (dirty & /*yCV*/ 16) apptable_changes.ycv = /*yCV*/ ctx[4];
    			apptable.$set(apptable_changes);
    			const appcontrolarea_changes = {};

    			if (dirty & /*$$scope, pDegree, cvType*/ 262147) {
    				appcontrolarea_changes.$$scope = { dirty, ctx };
    			}

    			appcontrolarea.$set(appcontrolarea_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(appplot.$$.fragment, local);
    			transition_in(apptable.$$.fragment, local);
    			transition_in(appcontrolarea.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(appplot.$$.fragment, local);
    			transition_out(apptable.$$.fragment, local);
    			transition_out(appcontrolarea.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);
    			destroy_component(appplot);
    			destroy_component(apptable);
    			destroy_component(appcontrolarea);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(119:0) <StatApp>",
    		ctx
    	});

    	return block;
    }

    // (148:3) 
    function create_help_slot(ctx) {
    	let div;
    	let h2;
    	let t1;
    	let p;

    	const block = {
    		c: function create() {
    			div = element("div");
    			h2 = element("h2");
    			h2.textContent = "Cross-validation";
    			t1 = space();
    			p = element("p");
    			add_location(h2, file, 148, 6, 4717);
    			add_location(p, file, 149, 6, 4749);
    			attr_dev(div, "slot", "help");
    			add_location(div, file, 147, 3, 4693);
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
    		source: "(148:3) ",
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

    			if (dirty & /*$$scope, pDegree, cvType, segments, indSeg, yCV, statCV, localModel, globalModel*/ 262399) {
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

    const CVDELAY = 1000;

    // constant parameters
    const nSegments = 4;

    const sampSize = 12;
    const meanX = 0;
    const sdX = 1;
    const noise = 0.5;

    function instance($$self, $$props, $$invalidate) {
    	let globalModel;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	let cvType = "random";
    	let pDegree = 1;

    	// create a sample
    	const sampZ = rnorm(sampSize);

    	const sampX = sort(rnorm(sampSize, meanX, sdX));
    	const sampY = sampX.map((x, i) => -2 + 2.5 * x + noise * sampZ[i]);

    	// timer for delay
    	const timer = ms => new Promise(res => setTimeout(res, ms));

    	// runtime parameters
    	let segments = {};

    	let indSeg = -1;
    	let yCV = rep(NaN, sampSize);
    	let statCV = undefined;
    	let localModel = undefined;

    	// function for compoting R2 and se for a model
    	function getStat(y, yp, p) {
    		const SSE = sum(vapply(vsubtract(y, yp), v => v ** 2));
    		const SSY = sum(vapply(vsubtract(y, mean(y)), v => v ** 2));
    		const DoF = y.length - (pDegree + 1);

    		return {
    			R2: 1 - SSE / SSY,
    			se: Math.sqrt(SSE / DoF)
    		};
    	}

    	// function for creating indices of CV segments
    	function getCVSegments(type, nSegments) {
    		// reset all previous CV results
    		$$invalidate(4, yCV = rep(NaN, sampSize));

    		$$invalidate(6, localModel = undefined);
    		$$invalidate(5, statCV = undefined);
    		$$invalidate(3, indSeg = -1);

    		// create vector with row indices
    		let indAll = seq(1, sampSize);

    		if (type === "random") {
    			indAll = shuffle(indAll);
    		}

    		// create vector of indices for the local validation sets
    		let segSize = 1;

    		let segVal = transpose(seq(1, sampSize));

    		if (type !== "full") {
    			segSize = sampSize / nSegments;
    			segVal = transpose(tomatrix(indAll, nSegments, segSize));
    		}

    		// create vector of indices for the local calibration sets
    		const segCal = segVal.map(v => indAll.filter(x => !v.includes(x)));

    		// create vector of segment number for each data row
    		let segNum = rep(0, sampSize);

    		for (let i = 0; i < segVal.length; i++) {
    			segNum = vreplace(segNum, rep(i + 1, segSize), segVal[i]);
    		}

    		return { cal: segCal, val: segVal, num: segNum };
    	}

    	// function for running cross-validation iterations with delay
    	async function run() {
    		// reset all CV results
    		$$invalidate(4, yCV = rep(NaN, sampSize));

    		$$invalidate(5, statCV = undefined);
    		$$invalidate(3, indSeg = -1);

    		// the cross-validation loop
    		for (let i = 0; i < segments.val.length; i++) {
    			$$invalidate(3, indSeg = i);
    			$$invalidate(6, localModel = polyfit(subset(sampX, segments.cal[indSeg]), subset(sampY, segments.cal[indSeg]), pDegree));
    			$$invalidate(4, yCV = vreplace(yCV, polypredict(localModel, subset(sampX, segments.val[indSeg])), segments.val[indSeg]));
    			await timer(CVDELAY);
    		}

    		// set indSeg to -1 to remove last segment from plot and compute overall performance
    		$$invalidate(3, indSeg = -1);

    		$$invalidate(5, statCV = getStat(sampY, yCV));
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	function appcontrolswitch0_value_binding(value) {
    		cvType = value;
    		$$invalidate(0, cvType);
    	}

    	function appcontrolswitch1_value_binding(value) {
    		pDegree = value;
    		$$invalidate(1, pDegree);
    	}

    	const click_handler = () => run();

    	$$self.$capture_state = () => ({
    		rnorm,
    		subset,
    		mean,
    		sum,
    		rep,
    		sort,
    		seq,
    		shuffle,
    		polyfit,
    		polypredict,
    		tomatrix,
    		vreplace,
    		vsubtract,
    		vapply,
    		transpose,
    		StatApp,
    		AppControlArea,
    		AppControlButton,
    		AppControlSwitch,
    		AppTable,
    		AppPlot,
    		CVDELAY,
    		cvType,
    		pDegree,
    		nSegments,
    		sampSize,
    		meanX,
    		sdX,
    		noise,
    		sampZ,
    		sampX,
    		sampY,
    		timer,
    		segments,
    		indSeg,
    		yCV,
    		statCV,
    		localModel,
    		getStat,
    		getCVSegments,
    		run,
    		globalModel
    	});

    	$$self.$inject_state = $$props => {
    		if ('cvType' in $$props) $$invalidate(0, cvType = $$props.cvType);
    		if ('pDegree' in $$props) $$invalidate(1, pDegree = $$props.pDegree);
    		if ('segments' in $$props) $$invalidate(2, segments = $$props.segments);
    		if ('indSeg' in $$props) $$invalidate(3, indSeg = $$props.indSeg);
    		if ('yCV' in $$props) $$invalidate(4, yCV = $$props.yCV);
    		if ('statCV' in $$props) $$invalidate(5, statCV = $$props.statCV);
    		if ('localModel' in $$props) $$invalidate(6, localModel = $$props.localModel);
    		if ('globalModel' in $$props) $$invalidate(7, globalModel = $$props.globalModel);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*pDegree*/ 2) {
    			// create global model for given polynomial degree
    			$$invalidate(7, globalModel = polyfit(sampX, sampY, pDegree));
    		}

    		if ($$self.$$.dirty & /*cvType*/ 1) {
    			// make new CV segments
    			$$invalidate(2, segments = getCVSegments(cvType, nSegments));
    		}
    	};

    	return [
    		cvType,
    		pDegree,
    		segments,
    		indSeg,
    		yCV,
    		statCV,
    		localModel,
    		globalModel,
    		sampX,
    		sampY,
    		run,
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
//# sourceMappingURL=asta-b306.js.map
