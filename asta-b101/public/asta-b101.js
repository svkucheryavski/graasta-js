
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
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



    /***************************************************
     * Functions for computing vectors of statistics   *
     ***************************************************/


    /**
     * Computes a p-th quantile/quantiles for a numeric vector
     * @param {number[]} x - vector with values
     * @param {number|number[]} p - probability (one value or a vector)
     * @returns {number}
     */
    function quantile(x, p) {

       x = sort(x);
       const n = x.length;

       if (!Array.isArray(p)) p = [p];
       if (typeof(p[0]) !== "number" || min(p) < 0 || max(p) > 1) {
          throw new Error("Parameter 'p' must be between 0 and 1 (both included).");
       }

       function q(x, p) {
          const h = (n - 1) * p + 1;
          const n1 = Math.floor(h);
          const n2 = Math.ceil(h);
          return x[n1 - 1] + (x[n2 - 1] - x[n1 - 1]) * (h - Math.floor(h));
       }

       const out =  p.map(v => q(x, v));
       return p.length == 1 ? out[0] : out;
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
     * Computes difference between all adjacent values in a vector
     * @param {number[]} x - vector with values
     * @returns {number[]} vector with the differences
     */
    function diff(x) {
       return x.slice(1).map( (y, i) => (y - x[i]));
    }


    /**
     * Finds outliers in a vector based on inter-quartile range distance
     * @param {Array} x - vector with values
     * @param {number} Q1 - first quartile (optional parameter)
     * @param {Array} Q3 - third quartile (optional parameter)
     * @returns {Array} vector with outliers or empty vector if none were found.
     */
    function getOutliers(x, Q1 = undefined, Q3 = undefined) {

       if (Q1 === undefined) Q1 = quantile(x, 0.25);
       if (Q3 === undefined) Q3 = quantile(x, 0.75);

       const IQR = Q3 - Q1;
       const bl = Q1 - 1.5 * IQR;
       const bu = Q3 + 1.5 * IQR;
       return(x.filter(v => v < bl || v > bu));
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

    /* ../shared/StatApp.svelte generated by Svelte v3.38.2 */
    const file$d = "../shared/StatApp.svelte";
    const get_help_slot_changes = dirty => ({});
    const get_help_slot_context = ctx => ({});

    // (40:3) {#if showHelp}
    function create_if_block$9(ctx) {
    	let div;
    	let current;
    	const help_slot_template = /*#slots*/ ctx[5].help;
    	const help_slot = create_slot(help_slot_template, ctx, /*$$scope*/ ctx[4], get_help_slot_context);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (help_slot) help_slot.c();
    			attr_dev(div, "class", "helptext svelte-coelov");
    			add_location(div, file$d, 40, 3, 893);
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
    		id: create_if_block$9.name,
    		type: "if",
    		source: "(40:3) {#if showHelp}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$h(ctx) {
    	let main;
    	let div;
    	let t;
    	let main_class_value;
    	let current;
    	let mounted;
    	let dispose;
    	const default_slot_template = /*#slots*/ ctx[5].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[4], null);
    	let if_block = /*showHelp*/ ctx[0] && create_if_block$9(ctx);

    	const block = {
    		c: function create() {
    			main = element("main");
    			div = element("div");
    			if (default_slot) default_slot.c();
    			t = space();
    			if (if_block) if_block.c();
    			attr_dev(div, "class", "content svelte-coelov");
    			add_location(div, file$d, 35, 3, 822);
    			attr_dev(main, "class", main_class_value = "mdatools-app mdatools-app_" + /*scale*/ ctx[1] + " svelte-coelov");
    			add_location(main, file$d, 33, 0, 744);
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

    /* ../shared/controls/AppControl.svelte generated by Svelte v3.38.2 */

    const file$c = "../shared/controls/AppControl.svelte";

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

    /* ../shared/controls/AppControlRange.svelte generated by Svelte v3.38.2 */
    const file$b = "../shared/controls/AppControlRange.svelte";

    // (67:0) <AppControl id={id} label={label}>
    function create_default_slot$3(ctx) {
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
    		id: create_default_slot$3.name,
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

    /* ../shared/controls/AppControlButton.svelte generated by Svelte v3.38.2 */
    const file$a = "../shared/controls/AppControlButton.svelte";

    // (9:0) <AppControl id={id} label={label} >
    function create_default_slot$2(ctx) {
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
    		id: create_default_slot$2.name,
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

    /* ../shared/controls/AppControlArea.svelte generated by Svelte v3.38.2 */

    const file$9 = "../shared/controls/AppControlArea.svelte";

    // (7:3) {#if errormsg}
    function create_if_block$8(ctx) {
    	let div;
    	let t;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t = text(/*errormsg*/ ctx[0]);
    			attr_dev(div, "class", "app-control-error svelte-8w06qs");
    			add_location(div, file$9, 6, 17, 126);
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

    function create_fragment$d(ctx) {
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
    			add_location(fieldset, file$9, 4, 0, 56);
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
    		id: create_fragment$d.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$d($$self, $$props, $$invalidate) {
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
    function create_if_block_2(ctx) {
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
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(313:3) {#if xLabel !== \\\"\\\"}",
    		ctx
    	});

    	return block;
    }

    // (341:3) {#if !$isOk}
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
    		id: create_if_block$7.name,
    		type: "if",
    		source: "(341:3) {#if !$isOk}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$c(ctx) {
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
    	let if_block3 = !/*$isOk*/ ctx[3] && create_if_block$7(ctx);

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
    					if_block3 = create_if_block$7(ctx);
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
    		id: create_fragment$c.name,
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

    function instance$c($$self, $$props, $$invalidate) {
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
    			instance$c,
    			create_fragment$c,
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
    			id: create_fragment$c.name
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

    function get_each_context$5(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[26] = list[i];
    	child_ctx[28] = i;
    	return child_ctx;
    }

    // (57:0) {#if $isOk && x !== undefined && y !== undefined }
    function create_if_block$6(ctx) {
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
    		each_blocks[i] = create_each_block$5(get_each_context$5(ctx, each_value, i));
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
    					const child_ctx = get_each_context$5(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$5(child_ctx);
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
    		id: create_if_block$6.name,
    		type: "if",
    		source: "(57:0) {#if $isOk && x !== undefined && y !== undefined }",
    		ctx
    	});

    	return block;
    }

    // (59:3) {#each ticksX as tx, i}
    function create_each_block$5(ctx) {
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
    		id: create_each_block$5.name,
    		type: "each",
    		source: "(59:3) {#each ticksX as tx, i}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$b(ctx) {
    	let if_block_anchor;
    	let if_block = /*$isOk*/ ctx[6] && /*x*/ ctx[3] !== undefined && /*y*/ ctx[1] !== undefined && create_if_block$6(ctx);

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

    		init(this, options, instance$b, create_fragment$b, safe_not_equal, {
    			slot: 16,
    			ticks: 15,
    			tickLabels: 0,
    			showGrid: 17
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "XAxis",
    			options,
    			id: create_fragment$b.name
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

    /* ../../svelte-plots-basic/src/Rectangles.svelte generated by Svelte v3.38.2 */
    const file$6 = "../../svelte-plots-basic/src/Rectangles.svelte";

    function get_each_context$4(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[23] = list[i];
    	child_ctx[25] = i;
    	return child_ctx;
    }

    // (51:0) {#if rx !== undefined && ry !== undefined}
    function create_if_block$5(ctx) {
    	let each_1_anchor;
    	let each_value = /*left*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$4(get_each_context$4(ctx, each_value, i));
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
    					const child_ctx = get_each_context$4(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$4(child_ctx);
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
    		source: "(51:0) {#if rx !== undefined && ry !== undefined}",
    		ctx
    	});

    	return block;
    }

    // (52:3) {#each left as v, i}
    function create_each_block$4(ctx) {
    	let rect;
    	let rect_x_value;
    	let rect_y_value;
    	let rect_width_value;
    	let rect_height_value;

    	const block = {
    		c: function create() {
    			rect = svg_element("rect");
    			attr_dev(rect, "x", rect_x_value = /*rx*/ ctx[1][/*i*/ ctx[25]]);
    			attr_dev(rect, "y", rect_y_value = /*ry*/ ctx[2][/*i*/ ctx[25]]);
    			attr_dev(rect, "width", rect_width_value = /*rw*/ ctx[3][/*i*/ ctx[25]]);
    			attr_dev(rect, "height", rect_height_value = /*rh*/ ctx[4][/*i*/ ctx[25]]);
    			attr_dev(rect, "style", /*barsStyleStr*/ ctx[5]);
    			add_location(rect, file$6, 52, 6, 1969);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, rect, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*rx*/ 2 && rect_x_value !== (rect_x_value = /*rx*/ ctx[1][/*i*/ ctx[25]])) {
    				attr_dev(rect, "x", rect_x_value);
    			}

    			if (dirty & /*ry*/ 4 && rect_y_value !== (rect_y_value = /*ry*/ ctx[2][/*i*/ ctx[25]])) {
    				attr_dev(rect, "y", rect_y_value);
    			}

    			if (dirty & /*rw*/ 8 && rect_width_value !== (rect_width_value = /*rw*/ ctx[3][/*i*/ ctx[25]])) {
    				attr_dev(rect, "width", rect_width_value);
    			}

    			if (dirty & /*rh*/ 16 && rect_height_value !== (rect_height_value = /*rh*/ ctx[4][/*i*/ ctx[25]])) {
    				attr_dev(rect, "height", rect_height_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(rect);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$4.name,
    		type: "each",
    		source: "(52:3) {#each left as v, i}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$a(ctx) {
    	let if_block_anchor;
    	let if_block = /*rx*/ ctx[1] !== undefined && /*ry*/ ctx[2] !== undefined && create_if_block$5(ctx);

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
    	let { lineWidth = 1 } = $$props;

    	// styles for bars and labels
    	const barsStyleStr = `fill:${faceColor};stroke:${borderColor};stroke-width: ${lineWidth}px;`;

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

    	const writable_props = [
    		"left",
    		"top",
    		"width",
    		"height",
    		"labels",
    		"faceColor",
    		"borderColor",
    		"lineWidth"
    	];

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
    		if ("lineWidth" in $$props) $$invalidate(16, lineWidth = $$props.lineWidth);
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
    		lineWidth,
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
    		if ("lineWidth" in $$props) $$invalidate(16, lineWidth = $$props.lineWidth);
    		if ("rx" in $$props) $$invalidate(1, rx = $$props.rx);
    		if ("ry" in $$props) $$invalidate(2, ry = $$props.ry);
    		if ("rw" in $$props) $$invalidate(3, rw = $$props.rw);
    		if ("rh" in $$props) $$invalidate(4, rh = $$props.rh);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*left, $xLim, $axesWidth*/ 393217) {
    			// reactive variables for coordinates of data points in pixels
    			$$invalidate(1, rx = axes.scaleX(left, $xLim, $axesWidth));
    		}

    		if ($$self.$$.dirty & /*top, $yLim, $axesHeight*/ 1576960) {
    			$$invalidate(2, ry = axes.scaleY(top, $yLim, $axesHeight));
    		}

    		if ($$self.$$.dirty & /*width, $xLim, $axesWidth*/ 394240) {
    			$$invalidate(3, rw = axes.scaleX(width, $xLim, $axesWidth, true));
    		}

    		if ($$self.$$.dirty & /*height, $yLim, $axesHeight*/ 1574912) {
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
    		lineWidth,
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
    			borderColor: 15,
    			lineWidth: 16
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

    	get lineWidth() {
    		throw new Error("<Rectangles>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set lineWidth(value) {
    		throw new Error("<Rectangles>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* ../../svelte-plots-basic/src/Segments.svelte generated by Svelte v3.38.2 */
    const file$5 = "../../svelte-plots-basic/src/Segments.svelte";

    function get_each_context$3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[24] = list[i];
    	child_ctx[26] = i;
    	return child_ctx;
    }

    // (41:0) {#if x1 !== undefined && y1 !== undefined}
    function create_if_block$4(ctx) {
    	let each_1_anchor;
    	let each_value = /*x1*/ ctx[0];
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
    			if (dirty & /*x1, x2, y1, y2, lineStyleStr*/ 31) {
    				each_value = /*x1*/ ctx[0];
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
    		id: create_if_block$4.name,
    		type: "if",
    		source: "(41:0) {#if x1 !== undefined && y1 !== undefined}",
    		ctx
    	});

    	return block;
    }

    // (42:3) {#each x1 as v, i}
    function create_each_block$3(ctx) {
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
    		id: create_each_block$3.name,
    		type: "each",
    		source: "(42:3) {#each x1 as v, i}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$9(ctx) {
    	let if_block_anchor;
    	let if_block = /*x1*/ ctx[0] !== undefined && /*y1*/ ctx[2] !== undefined && create_if_block$4(ctx);

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

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[25] = list[i];
    	child_ctx[27] = i;
    	return child_ctx;
    }

    // (56:0) {#if x !== undefined && y !== undefined}
    function create_if_block$3(ctx) {
    	let each_1_anchor;
    	let each_value = /*x*/ ctx[2];
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
    			if (dirty & /*textStyleStr, x, y, dx, dy, textAnchors, pos, labels*/ 255) {
    				each_value = /*x*/ ctx[2];
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
    		id: create_if_block$3.name,
    		type: "if",
    		source: "(56:0) {#if x !== undefined && y !== undefined}",
    		ctx
    	});

    	return block;
    }

    // (57:3) {#each x as v, i}
    function create_each_block$2(ctx) {
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
    		id: create_each_block$2.name,
    		type: "each",
    		source: "(57:3) {#each x as v, i}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$8(ctx) {
    	let if_block_anchor;
    	let if_block = /*x*/ ctx[2] !== undefined && /*y*/ ctx[3] !== undefined && create_if_block$3(ctx);

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

    /* ../../svelte-plots-basic/src/ScatterSeries.svelte generated by Svelte v3.38.2 */
    const file$3 = "../../svelte-plots-basic/src/ScatterSeries.svelte";

    function create_fragment$7(ctx) {
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
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props, $$invalidate) {
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

    		init(this, options, instance$7, create_fragment$7, safe_not_equal, {
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
    			id: create_fragment$7.name
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

    /* ../shared/plots/BoxAndWhiskers.svelte generated by Svelte v3.38.2 */

    // (90:0) {#if out.length > 0}
    function create_if_block$2(ctx) {
    	let textlabels;
    	let current;

    	textlabels = new TextLabels({
    			props: {
    				xValues: /*px*/ ctx[12],
    				yValues: /*py*/ ctx[13],
    				labels: "●",
    				faceColor: /*faceColor*/ ctx[0],
    				borderColor: /*borderColor*/ ctx[1],
    				borderWidth: /*lineWidth*/ ctx[2]
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
    			if (dirty & /*px*/ 4096) textlabels_changes.xValues = /*px*/ ctx[12];
    			if (dirty & /*py*/ 8192) textlabels_changes.yValues = /*py*/ ctx[13];
    			if (dirty & /*faceColor*/ 1) textlabels_changes.faceColor = /*faceColor*/ ctx[0];
    			if (dirty & /*borderColor*/ 2) textlabels_changes.borderColor = /*borderColor*/ ctx[1];
    			if (dirty & /*lineWidth*/ 4) textlabels_changes.borderWidth = /*lineWidth*/ ctx[2];
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
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(90:0) {#if out.length > 0}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$6(ctx) {
    	let rectangles;
    	let t0;
    	let segments;
    	let t1;
    	let if_block_anchor;
    	let current;

    	rectangles = new Rectangles({
    			props: {
    				left: [/*bl*/ ctx[3]],
    				top: [/*bt*/ ctx[6]],
    				width: [/*bw*/ ctx[4]],
    				height: [/*bh*/ ctx[5]],
    				lineWidth: /*lineWidth*/ ctx[2],
    				faceColor: /*faceColor*/ ctx[0],
    				borderColor: /*borderColor*/ ctx[1]
    			},
    			$$inline: true
    		});

    	segments = new Segments({
    			props: {
    				xStart: /*xs*/ ctx[8],
    				xEnd: /*xe*/ ctx[9],
    				yStart: /*ys*/ ctx[10],
    				yEnd: /*ye*/ ctx[11],
    				lineWidth: /*lineWidth*/ ctx[2],
    				lineColor: /*borderColor*/ ctx[1]
    			},
    			$$inline: true
    		});

    	let if_block = /*out*/ ctx[7].length > 0 && create_if_block$2(ctx);

    	const block = {
    		c: function create() {
    			create_component(rectangles.$$.fragment);
    			t0 = space();
    			create_component(segments.$$.fragment);
    			t1 = space();
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(rectangles, target, anchor);
    			insert_dev(target, t0, anchor);
    			mount_component(segments, target, anchor);
    			insert_dev(target, t1, anchor);
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const rectangles_changes = {};
    			if (dirty & /*bl*/ 8) rectangles_changes.left = [/*bl*/ ctx[3]];
    			if (dirty & /*bt*/ 64) rectangles_changes.top = [/*bt*/ ctx[6]];
    			if (dirty & /*bw*/ 16) rectangles_changes.width = [/*bw*/ ctx[4]];
    			if (dirty & /*bh*/ 32) rectangles_changes.height = [/*bh*/ ctx[5]];
    			if (dirty & /*lineWidth*/ 4) rectangles_changes.lineWidth = /*lineWidth*/ ctx[2];
    			if (dirty & /*faceColor*/ 1) rectangles_changes.faceColor = /*faceColor*/ ctx[0];
    			if (dirty & /*borderColor*/ 2) rectangles_changes.borderColor = /*borderColor*/ ctx[1];
    			rectangles.$set(rectangles_changes);
    			const segments_changes = {};
    			if (dirty & /*xs*/ 256) segments_changes.xStart = /*xs*/ ctx[8];
    			if (dirty & /*xe*/ 512) segments_changes.xEnd = /*xe*/ ctx[9];
    			if (dirty & /*ys*/ 1024) segments_changes.yStart = /*ys*/ ctx[10];
    			if (dirty & /*ye*/ 2048) segments_changes.yEnd = /*ye*/ ctx[11];
    			if (dirty & /*lineWidth*/ 4) segments_changes.lineWidth = /*lineWidth*/ ctx[2];
    			if (dirty & /*borderColor*/ 2) segments_changes.lineColor = /*borderColor*/ ctx[1];
    			segments.$set(segments_changes);

    			if (/*out*/ ctx[7].length > 0) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*out*/ 128) {
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
    			transition_in(rectangles.$$.fragment, local);
    			transition_in(segments.$$.fragment, local);
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(rectangles.$$.fragment, local);
    			transition_out(segments.$$.fragment, local);
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(rectangles, detaching);
    			if (detaching) detach_dev(t0);
    			destroy_component(segments, detaching);
    			if (detaching) detach_dev(t1);
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
    	let Q1;
    	let Q2;
    	let Q3;
    	let IQR;
    	let out;
    	let outFreeValues;
    	let mn;
    	let mx;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("BoxAndWhiskers", slots, []);
    	let { values = [] } = $$props;
    	let { boxPosition } = $$props;
    	let { boxSize = boxPosition * 0.05 } = $$props;
    	let { horizontal = false } = $$props;
    	let { faceColor = "white" } = $$props;
    	let { borderColor = "blue" } = $$props;
    	let { lineWidth = 1 } = $$props;
    	let { quartiles = [] } = $$props;
    	let { outliers = [] } = $$props;
    	let { range = [] } = $$props;

    	// coordinates of box, range segments and outliers
    	let bl, bw, bh, bt;

    	let xs, xe, ys, ye;
    	let px, py;

    	// to access shared parameters and methods from Axes
    	const axes = getContext("axes");

    	const writable_props = [
    		"values",
    		"boxPosition",
    		"boxSize",
    		"horizontal",
    		"faceColor",
    		"borderColor",
    		"lineWidth",
    		"quartiles",
    		"outliers",
    		"range"
    	];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<BoxAndWhiskers> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("values" in $$props) $$invalidate(14, values = $$props.values);
    		if ("boxPosition" in $$props) $$invalidate(15, boxPosition = $$props.boxPosition);
    		if ("boxSize" in $$props) $$invalidate(16, boxSize = $$props.boxSize);
    		if ("horizontal" in $$props) $$invalidate(17, horizontal = $$props.horizontal);
    		if ("faceColor" in $$props) $$invalidate(0, faceColor = $$props.faceColor);
    		if ("borderColor" in $$props) $$invalidate(1, borderColor = $$props.borderColor);
    		if ("lineWidth" in $$props) $$invalidate(2, lineWidth = $$props.lineWidth);
    		if ("quartiles" in $$props) $$invalidate(18, quartiles = $$props.quartiles);
    		if ("outliers" in $$props) $$invalidate(19, outliers = $$props.outliers);
    		if ("range" in $$props) $$invalidate(20, range = $$props.range);
    	};

    	$$self.$capture_state = () => ({
    		Rectangles,
    		Segments,
    		TextLabels,
    		min,
    		max,
    		quantile,
    		getOutliers,
    		getContext,
    		values,
    		boxPosition,
    		boxSize,
    		horizontal,
    		faceColor,
    		borderColor,
    		lineWidth,
    		quartiles,
    		outliers,
    		range,
    		bl,
    		bw,
    		bh,
    		bt,
    		xs,
    		xe,
    		ys,
    		ye,
    		px,
    		py,
    		axes,
    		Q1,
    		Q2,
    		Q3,
    		IQR,
    		out,
    		outFreeValues,
    		mn,
    		mx
    	});

    	$$self.$inject_state = $$props => {
    		if ("values" in $$props) $$invalidate(14, values = $$props.values);
    		if ("boxPosition" in $$props) $$invalidate(15, boxPosition = $$props.boxPosition);
    		if ("boxSize" in $$props) $$invalidate(16, boxSize = $$props.boxSize);
    		if ("horizontal" in $$props) $$invalidate(17, horizontal = $$props.horizontal);
    		if ("faceColor" in $$props) $$invalidate(0, faceColor = $$props.faceColor);
    		if ("borderColor" in $$props) $$invalidate(1, borderColor = $$props.borderColor);
    		if ("lineWidth" in $$props) $$invalidate(2, lineWidth = $$props.lineWidth);
    		if ("quartiles" in $$props) $$invalidate(18, quartiles = $$props.quartiles);
    		if ("outliers" in $$props) $$invalidate(19, outliers = $$props.outliers);
    		if ("range" in $$props) $$invalidate(20, range = $$props.range);
    		if ("bl" in $$props) $$invalidate(3, bl = $$props.bl);
    		if ("bw" in $$props) $$invalidate(4, bw = $$props.bw);
    		if ("bh" in $$props) $$invalidate(5, bh = $$props.bh);
    		if ("bt" in $$props) $$invalidate(6, bt = $$props.bt);
    		if ("xs" in $$props) $$invalidate(8, xs = $$props.xs);
    		if ("xe" in $$props) $$invalidate(9, xe = $$props.xe);
    		if ("ys" in $$props) $$invalidate(10, ys = $$props.ys);
    		if ("ye" in $$props) $$invalidate(11, ye = $$props.ye);
    		if ("px" in $$props) $$invalidate(12, px = $$props.px);
    		if ("py" in $$props) $$invalidate(13, py = $$props.py);
    		if ("Q1" in $$props) $$invalidate(21, Q1 = $$props.Q1);
    		if ("Q2" in $$props) $$invalidate(22, Q2 = $$props.Q2);
    		if ("Q3" in $$props) $$invalidate(23, Q3 = $$props.Q3);
    		if ("IQR" in $$props) $$invalidate(24, IQR = $$props.IQR);
    		if ("out" in $$props) $$invalidate(7, out = $$props.out);
    		if ("outFreeValues" in $$props) $$invalidate(25, outFreeValues = $$props.outFreeValues);
    		if ("mn" in $$props) $$invalidate(26, mn = $$props.mn);
    		if ("mx" in $$props) $$invalidate(27, mx = $$props.mx);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*quartiles, values*/ 278528) {
    			// compute quartiles and IQR
    			$$invalidate(21, Q1 = quartiles.length === 3
    			? quartiles[0]
    			: quantile(values, 0.25));
    		}

    		if ($$self.$$.dirty & /*quartiles, values*/ 278528) {
    			$$invalidate(22, Q2 = quartiles.length === 3
    			? quartiles[1]
    			: quantile(values, 0.5));
    		}

    		if ($$self.$$.dirty & /*quartiles, values*/ 278528) {
    			$$invalidate(23, Q3 = quartiles.length === 3
    			? quartiles[2]
    			: quantile(values, 0.75));
    		}

    		if ($$self.$$.dirty & /*Q3, Q1*/ 10485760) {
    			$$invalidate(24, IQR = Q3 - Q1);
    		}

    		if ($$self.$$.dirty & /*values, outliers, Q1, Q3*/ 11026432) {
    			$$invalidate(7, out = values.length === 0
    			? outliers
    			: getOutliers(values, Q1, Q3));
    		}

    		if ($$self.$$.dirty & /*out, values*/ 16512) {
    			$$invalidate(25, outFreeValues = out.length > 0
    			? values.filter(v => !out.some(o => o == v))
    			: values);
    		}

    		if ($$self.$$.dirty & /*range, outFreeValues*/ 34603008) {
    			$$invalidate(26, mn = range.length === 2 ? range[0] : min(outFreeValues));
    		}

    		if ($$self.$$.dirty & /*range, outFreeValues*/ 34603008) {
    			$$invalidate(27, mx = range.length === 2 ? range[1] : max(outFreeValues));
    		}

    		if ($$self.$$.dirty & /*horizontal, Q1, boxPosition, boxSize, IQR, mn, Q3, Q2, mx, bt, bh, out, bl, bw*/ 233013496) {
    			{
    				if (horizontal === true) {
    					$$invalidate(3, bl = Q1);
    					$$invalidate(6, bt = boxPosition + boxSize / 2);
    					$$invalidate(4, bw = IQR);
    					$$invalidate(5, bh = boxSize);
    					$$invalidate(8, xs = [mn < Q1 ? mn : Q1, Q3, Q2]);
    					$$invalidate(9, xe = [Q1, mx > Q3 ? mx : Q3, Q2]);
    					$$invalidate(10, ys = [boxPosition, boxPosition, bt]);
    					$$invalidate(11, ye = [boxPosition, boxPosition, bt - bh]);
    					$$invalidate(12, px = out);
    					$$invalidate(13, py = Array(out.length).fill(boxPosition));

    					// correct axis limits
    					const xLimMin = min(out.concat([mn]));

    					const xLimMax = max(out.concat([mx]));
    					const dXLim = (xLimMax - xLimMin) * 0.05;
    					axes.adjustXAxisLimits([xLimMin - dXLim, xLimMax + dXLim]);
    					axes.adjustYAxisLimits([boxPosition - boxSize / 1.5, boxPosition + boxSize / 1.5]);
    				} else {
    					$$invalidate(3, bl = boxPosition - boxSize / 2);
    					$$invalidate(6, bt = Q3);
    					$$invalidate(4, bw = boxSize);
    					$$invalidate(5, bh = IQR);
    					$$invalidate(10, ys = [mn < Q1 ? mn : Q1, Q3, Q2]);
    					$$invalidate(11, ye = [Q1, mx > Q3 ? Q3 : mx, Q2]);
    					$$invalidate(8, xs = [boxPosition, boxPosition, bl]);
    					$$invalidate(9, xe = [boxPosition, boxPosition, bl + bw]);
    					$$invalidate(13, py = out);
    					$$invalidate(12, px = Array(out.length).fill(boxPosition));

    					// correct axis limits
    					const yLimMin = min(out.concat([mn]));

    					const yLimMax = max(out.concat([mx]));
    					const dYLim = (yLimMax - yLimMin) * 0.05;
    					axes.adjustYAxisLimits([yLimMin - dYLim, yLimMax + dYLim]);
    					axes.adjustXAxisLimits([boxPosition - boxSize / 1.5, boxPosition + boxSize / 1.5]);
    				}
    			}
    		}
    	};

    	return [
    		faceColor,
    		borderColor,
    		lineWidth,
    		bl,
    		bw,
    		bh,
    		bt,
    		out,
    		xs,
    		xe,
    		ys,
    		ye,
    		px,
    		py,
    		values,
    		boxPosition,
    		boxSize,
    		horizontal,
    		quartiles,
    		outliers,
    		range,
    		Q1,
    		Q2,
    		Q3,
    		IQR,
    		outFreeValues,
    		mn,
    		mx
    	];
    }

    class BoxAndWhiskers extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {
    			values: 14,
    			boxPosition: 15,
    			boxSize: 16,
    			horizontal: 17,
    			faceColor: 0,
    			borderColor: 1,
    			lineWidth: 2,
    			quartiles: 18,
    			outliers: 19,
    			range: 20
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "BoxAndWhiskers",
    			options,
    			id: create_fragment$6.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*boxPosition*/ ctx[15] === undefined && !("boxPosition" in props)) {
    			console.warn("<BoxAndWhiskers> was created without expected prop 'boxPosition'");
    		}
    	}

    	get values() {
    		throw new Error("<BoxAndWhiskers>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set values(value) {
    		throw new Error("<BoxAndWhiskers>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get boxPosition() {
    		throw new Error("<BoxAndWhiskers>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set boxPosition(value) {
    		throw new Error("<BoxAndWhiskers>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get boxSize() {
    		throw new Error("<BoxAndWhiskers>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set boxSize(value) {
    		throw new Error("<BoxAndWhiskers>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get horizontal() {
    		throw new Error("<BoxAndWhiskers>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set horizontal(value) {
    		throw new Error("<BoxAndWhiskers>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get faceColor() {
    		throw new Error("<BoxAndWhiskers>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set faceColor(value) {
    		throw new Error("<BoxAndWhiskers>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get borderColor() {
    		throw new Error("<BoxAndWhiskers>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set borderColor(value) {
    		throw new Error("<BoxAndWhiskers>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get lineWidth() {
    		throw new Error("<BoxAndWhiskers>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set lineWidth(value) {
    		throw new Error("<BoxAndWhiskers>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get quartiles() {
    		throw new Error("<BoxAndWhiskers>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set quartiles(value) {
    		throw new Error("<BoxAndWhiskers>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get outliers() {
    		throw new Error("<BoxAndWhiskers>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set outliers(value) {
    		throw new Error("<BoxAndWhiskers>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get range() {
    		throw new Error("<BoxAndWhiskers>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set range(value) {
    		throw new Error("<BoxAndWhiskers>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/AppPlot.svelte generated by Svelte v3.38.2 */

    // (37:0) <Axes xLabel="IQ" limX={limX} limY="{limY}">
    function create_default_slot$1(ctx) {
    	let segments0;
    	let t0;
    	let scatterseries0;
    	let t1;
    	let textlabels0;
    	let t2;
    	let segments1;
    	let t3;
    	let textlabels1;
    	let t4;
    	let textlabels2;
    	let t5;
    	let segments2;
    	let t6;
    	let textlabels3;
    	let t7;
    	let textlabels4;
    	let t8;
    	let scatterseries1;
    	let t9;
    	let boxandwhiskers;
    	let t10;
    	let segments3;
    	let current;

    	segments0 = new Segments({
    			props: {
    				xStart: /*statValues*/ ctx[7],
    				xEnd: /*statValues*/ ctx[7],
    				yStart: /*yBottom*/ ctx[11],
    				yEnd: /*yTop*/ ctx[12],
    				lineColor: statLineColor
    			},
    			$$inline: true
    		});

    	scatterseries0 = new ScatterSeries({
    			props: {
    				xValues: /*statValues*/ ctx[7],
    				yValues: /*yBottom*/ ctx[11],
    				borderColor: "transparent",
    				faceColor: statLineColor
    			},
    			$$inline: true
    		});

    	textlabels0 = new TextLabels({
    			props: {
    				xValues: /*statValues*/ ctx[7],
    				yValues: /*yBottom*/ ctx[11],
    				labels: /*statLabels*/ ctx[8],
    				pos: 1
    			},
    			$$inline: true
    		});

    	segments1 = new Segments({
    			props: {
    				xStart: [/*Q1*/ ctx[1]],
    				xEnd: [/*outLeft*/ ctx[3]],
    				yStart: [/*yTop*/ ctx[12][0]],
    				yEnd: [/*yTop*/ ctx[12][0]],
    				lineColor: outlierDetectorColor
    			},
    			$$inline: true
    		});

    	textlabels1 = new TextLabels({
    			props: {
    				xValues: [/*Q1*/ ctx[1], /*outLeft*/ ctx[3]],
    				yValues: [/*yTop*/ ctx[12][0], /*yTop*/ ctx[12][0]],
    				labels: ["●", "|"],
    				pos: 0,
    				faceColor: outlierDetectorColor
    			},
    			$$inline: true
    		});

    	textlabels2 = new TextLabels({
    			props: {
    				xValues: [mean([/*Q1*/ ctx[1], /*outLeft*/ ctx[3]])],
    				yValues: [/*yTop*/ ctx[12][0]],
    				labels: ["Q1 - 1.5 IQR"],
    				pos: 3,
    				faceColor: "darkred"
    			},
    			$$inline: true
    		});

    	segments2 = new Segments({
    			props: {
    				xStart: [/*Q3*/ ctx[2]],
    				xEnd: [/*outRight*/ ctx[4]],
    				yStart: [/*yTop*/ ctx[12][0]],
    				yEnd: [/*yTop*/ ctx[12][0]],
    				lineColor: "red"
    			},
    			$$inline: true
    		});

    	textlabels3 = new TextLabels({
    			props: {
    				xValues: [/*Q3*/ ctx[2], /*outRight*/ ctx[4]],
    				yValues: [/*yTop*/ ctx[12][0], /*yTop*/ ctx[12][0]],
    				labels: ["●", "|"],
    				pos: 0,
    				faceColor: "red"
    			},
    			$$inline: true
    		});

    	textlabels4 = new TextLabels({
    			props: {
    				xValues: [mean([/*Q3*/ ctx[2], /*outRight*/ ctx[4]])],
    				yValues: [/*yTop*/ ctx[12][0]],
    				labels: ["Q3 + 1.5 IQR"],
    				pos: 3,
    				faceColor: "darkred"
    			},
    			$$inline: true
    		});

    	scatterseries1 = new ScatterSeries({
    			props: {
    				xValues: /*values*/ ctx[0],
    				yValues: /*yMid*/ ctx[10],
    				faceColor: "transparent",
    				borderColor: colors.plots.SAMPLES[0],
    				markerSize: 1.5,
    				borderWidth: 2
    			},
    			$$inline: true
    		});

    	boxandwhiskers = new BoxAndWhiskers({
    			props: {
    				values: /*values*/ ctx[0],
    				boxPosition: 2,
    				boxSize: 1,
    				horizontal: true,
    				lineWidth: 1.5,
    				borderColor: boxPlotColor
    			},
    			$$inline: true
    		});

    	segments3 = new Segments({
    			props: {
    				xStart: [/*m*/ ctx[5]],
    				xEnd: [/*m*/ ctx[5]],
    				yStart: [2.5],
    				yEnd: [1.5],
    				lineColor: boxPlotColor,
    				lineWidth: 1.3,
    				lineType: 3
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(segments0.$$.fragment);
    			t0 = space();
    			create_component(scatterseries0.$$.fragment);
    			t1 = space();
    			create_component(textlabels0.$$.fragment);
    			t2 = space();
    			create_component(segments1.$$.fragment);
    			t3 = space();
    			create_component(textlabels1.$$.fragment);
    			t4 = space();
    			create_component(textlabels2.$$.fragment);
    			t5 = space();
    			create_component(segments2.$$.fragment);
    			t6 = space();
    			create_component(textlabels3.$$.fragment);
    			t7 = space();
    			create_component(textlabels4.$$.fragment);
    			t8 = space();
    			create_component(scatterseries1.$$.fragment);
    			t9 = space();
    			create_component(boxandwhiskers.$$.fragment);
    			t10 = space();
    			create_component(segments3.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(segments0, target, anchor);
    			insert_dev(target, t0, anchor);
    			mount_component(scatterseries0, target, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(textlabels0, target, anchor);
    			insert_dev(target, t2, anchor);
    			mount_component(segments1, target, anchor);
    			insert_dev(target, t3, anchor);
    			mount_component(textlabels1, target, anchor);
    			insert_dev(target, t4, anchor);
    			mount_component(textlabels2, target, anchor);
    			insert_dev(target, t5, anchor);
    			mount_component(segments2, target, anchor);
    			insert_dev(target, t6, anchor);
    			mount_component(textlabels3, target, anchor);
    			insert_dev(target, t7, anchor);
    			mount_component(textlabels4, target, anchor);
    			insert_dev(target, t8, anchor);
    			mount_component(scatterseries1, target, anchor);
    			insert_dev(target, t9, anchor);
    			mount_component(boxandwhiskers, target, anchor);
    			insert_dev(target, t10, anchor);
    			mount_component(segments3, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const segments0_changes = {};
    			if (dirty & /*statValues*/ 128) segments0_changes.xStart = /*statValues*/ ctx[7];
    			if (dirty & /*statValues*/ 128) segments0_changes.xEnd = /*statValues*/ ctx[7];
    			segments0.$set(segments0_changes);
    			const scatterseries0_changes = {};
    			if (dirty & /*statValues*/ 128) scatterseries0_changes.xValues = /*statValues*/ ctx[7];
    			scatterseries0.$set(scatterseries0_changes);
    			const textlabels0_changes = {};
    			if (dirty & /*statValues*/ 128) textlabels0_changes.xValues = /*statValues*/ ctx[7];
    			textlabels0.$set(textlabels0_changes);
    			const segments1_changes = {};
    			if (dirty & /*Q1*/ 2) segments1_changes.xStart = [/*Q1*/ ctx[1]];
    			if (dirty & /*outLeft*/ 8) segments1_changes.xEnd = [/*outLeft*/ ctx[3]];
    			segments1.$set(segments1_changes);
    			const textlabels1_changes = {};
    			if (dirty & /*Q1, outLeft*/ 10) textlabels1_changes.xValues = [/*Q1*/ ctx[1], /*outLeft*/ ctx[3]];
    			textlabels1.$set(textlabels1_changes);
    			const textlabels2_changes = {};
    			if (dirty & /*Q1, outLeft*/ 10) textlabels2_changes.xValues = [mean([/*Q1*/ ctx[1], /*outLeft*/ ctx[3]])];
    			textlabels2.$set(textlabels2_changes);
    			const segments2_changes = {};
    			if (dirty & /*Q3*/ 4) segments2_changes.xStart = [/*Q3*/ ctx[2]];
    			if (dirty & /*outRight*/ 16) segments2_changes.xEnd = [/*outRight*/ ctx[4]];
    			segments2.$set(segments2_changes);
    			const textlabels3_changes = {};
    			if (dirty & /*Q3, outRight*/ 20) textlabels3_changes.xValues = [/*Q3*/ ctx[2], /*outRight*/ ctx[4]];
    			textlabels3.$set(textlabels3_changes);
    			const textlabels4_changes = {};
    			if (dirty & /*Q3, outRight*/ 20) textlabels4_changes.xValues = [mean([/*Q3*/ ctx[2], /*outRight*/ ctx[4]])];
    			textlabels4.$set(textlabels4_changes);
    			const scatterseries1_changes = {};
    			if (dirty & /*values*/ 1) scatterseries1_changes.xValues = /*values*/ ctx[0];
    			scatterseries1.$set(scatterseries1_changes);
    			const boxandwhiskers_changes = {};
    			if (dirty & /*values*/ 1) boxandwhiskers_changes.values = /*values*/ ctx[0];
    			boxandwhiskers.$set(boxandwhiskers_changes);
    			const segments3_changes = {};
    			if (dirty & /*m*/ 32) segments3_changes.xStart = [/*m*/ ctx[5]];
    			if (dirty & /*m*/ 32) segments3_changes.xEnd = [/*m*/ ctx[5]];
    			segments3.$set(segments3_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(segments0.$$.fragment, local);
    			transition_in(scatterseries0.$$.fragment, local);
    			transition_in(textlabels0.$$.fragment, local);
    			transition_in(segments1.$$.fragment, local);
    			transition_in(textlabels1.$$.fragment, local);
    			transition_in(textlabels2.$$.fragment, local);
    			transition_in(segments2.$$.fragment, local);
    			transition_in(textlabels3.$$.fragment, local);
    			transition_in(textlabels4.$$.fragment, local);
    			transition_in(scatterseries1.$$.fragment, local);
    			transition_in(boxandwhiskers.$$.fragment, local);
    			transition_in(segments3.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(segments0.$$.fragment, local);
    			transition_out(scatterseries0.$$.fragment, local);
    			transition_out(textlabels0.$$.fragment, local);
    			transition_out(segments1.$$.fragment, local);
    			transition_out(textlabels1.$$.fragment, local);
    			transition_out(textlabels2.$$.fragment, local);
    			transition_out(segments2.$$.fragment, local);
    			transition_out(textlabels3.$$.fragment, local);
    			transition_out(textlabels4.$$.fragment, local);
    			transition_out(scatterseries1.$$.fragment, local);
    			transition_out(boxandwhiskers.$$.fragment, local);
    			transition_out(segments3.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(segments0, detaching);
    			if (detaching) detach_dev(t0);
    			destroy_component(scatterseries0, detaching);
    			if (detaching) detach_dev(t1);
    			destroy_component(textlabels0, detaching);
    			if (detaching) detach_dev(t2);
    			destroy_component(segments1, detaching);
    			if (detaching) detach_dev(t3);
    			destroy_component(textlabels1, detaching);
    			if (detaching) detach_dev(t4);
    			destroy_component(textlabels2, detaching);
    			if (detaching) detach_dev(t5);
    			destroy_component(segments2, detaching);
    			if (detaching) detach_dev(t6);
    			destroy_component(textlabels3, detaching);
    			if (detaching) detach_dev(t7);
    			destroy_component(textlabels4, detaching);
    			if (detaching) detach_dev(t8);
    			destroy_component(scatterseries1, detaching);
    			if (detaching) detach_dev(t9);
    			destroy_component(boxandwhiskers, detaching);
    			if (detaching) detach_dev(t10);
    			destroy_component(segments3, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$1.name,
    		type: "slot",
    		source: "(37:0) <Axes xLabel=\\\"IQ\\\" limX={limX} limY=\\\"{limY}\\\">",
    		ctx
    	});

    	return block;
    }

    // (62:3) 
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
    		source: "(62:3) ",
    		ctx
    	});

    	return block;
    }

    function create_fragment$5(ctx) {
    	let axes;
    	let current;

    	axes = new Axes({
    			props: {
    				xLabel: "IQ",
    				limX: /*limX*/ ctx[6],
    				limY: /*limY*/ ctx[9],
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
    			if (dirty & /*limX*/ 64) axes_changes.limX = /*limX*/ ctx[6];

    			if (dirty & /*$$scope, m, values, Q3, outRight, Q1, outLeft, statValues*/ 32959) {
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

    const statLineColor = "#d8d8d8";
    const outlierDetectorColor = "#ff0000";
    const boxPlotColor = "#404040";

    function instance$5($$self, $$props, $$invalidate) {
    	let m;
    	let Q1;
    	let Q2;
    	let Q3;
    	let outLeft;
    	let outRight;
    	let limX;
    	let statValues;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("AppPlot", slots, []);
    	let { values } = $$props;

    	// fixed values
    	const statLabels = ["min", "Q1", "Q2", "Q3", "max"];

    	const limY = [-2, 3.8];
    	const statNum = statLabels.length;

    	// plot parameters
    	const yMid = Array.from({ length: values.length }, () => 0);

    	const yBottom = Array.from({ length: statNum }, () => -1);
    	const yTop = Array.from({ length: statNum }, () => 3.3);
    	const writable_props = ["values"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<AppPlot> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("values" in $$props) $$invalidate(0, values = $$props.values);
    	};

    	$$self.$capture_state = () => ({
    		max,
    		quantile,
    		mean,
    		min,
    		Axes,
    		XAxis,
    		Segments,
    		TextLabels,
    		ScatterSeries,
    		colors,
    		BoxAndWhiskers,
    		values,
    		statLabels,
    		limY,
    		statNum,
    		statLineColor,
    		outlierDetectorColor,
    		boxPlotColor,
    		yMid,
    		yBottom,
    		yTop,
    		m,
    		Q1,
    		Q2,
    		Q3,
    		outLeft,
    		outRight,
    		limX,
    		statValues
    	});

    	$$self.$inject_state = $$props => {
    		if ("values" in $$props) $$invalidate(0, values = $$props.values);
    		if ("m" in $$props) $$invalidate(5, m = $$props.m);
    		if ("Q1" in $$props) $$invalidate(1, Q1 = $$props.Q1);
    		if ("Q2" in $$props) $$invalidate(13, Q2 = $$props.Q2);
    		if ("Q3" in $$props) $$invalidate(2, Q3 = $$props.Q3);
    		if ("outLeft" in $$props) $$invalidate(3, outLeft = $$props.outLeft);
    		if ("outRight" in $$props) $$invalidate(4, outRight = $$props.outRight);
    		if ("limX" in $$props) $$invalidate(6, limX = $$props.limX);
    		if ("statValues" in $$props) $$invalidate(7, statValues = $$props.statValues);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*values*/ 1) {
    			// statistics
    			$$invalidate(5, m = mean(values));
    		}

    		if ($$self.$$.dirty & /*values*/ 1) {
    			$$invalidate(1, Q1 = quantile(values, 0.25));
    		}

    		if ($$self.$$.dirty & /*values*/ 1) {
    			$$invalidate(13, Q2 = quantile(values, 0.5));
    		}

    		if ($$self.$$.dirty & /*values*/ 1) {
    			$$invalidate(2, Q3 = quantile(values, 0.75));
    		}

    		if ($$self.$$.dirty & /*Q1, Q3*/ 6) {
    			// other reactive parameters
    			$$invalidate(3, outLeft = Q1 - (Q3 - Q1) * 1.5);
    		}

    		if ($$self.$$.dirty & /*Q3, Q1*/ 6) {
    			$$invalidate(4, outRight = Q3 + (Q3 - Q1) * 1.5);
    		}

    		if ($$self.$$.dirty & /*values, outLeft, outRight*/ 25) {
    			$$invalidate(6, limX = [min(values.concat([outLeft])) - 2, max(values.concat([outRight])) + 2]);
    		}

    		if ($$self.$$.dirty & /*values, Q1, Q2, Q3*/ 8199) {
    			$$invalidate(7, statValues = [min(values), Q1, Q2, Q3, max(values)]);
    		}
    	};

    	return [
    		values,
    		Q1,
    		Q3,
    		outLeft,
    		outRight,
    		m,
    		limX,
    		statValues,
    		statLabels,
    		limY,
    		yMid,
    		yBottom,
    		yTop,
    		Q2
    	];
    }

    class AppPlot extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, { values: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "AppPlot",
    			options,
    			id: create_fragment$5.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*values*/ ctx[0] === undefined && !("values" in props)) {
    			console.warn("<AppPlot> was created without expected prop 'values'");
    		}
    	}

    	get values() {
    		throw new Error("<AppPlot>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set values(value) {
    		throw new Error("<AppPlot>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* ../shared/tables/DataTableValues.svelte generated by Svelte v3.38.2 */

    const file$2 = "../shared/tables/DataTableValues.svelte";

    function get_each_context_1$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[2] = list[i];
    	return child_ctx;
    }

    function get_each_context$1(ctx, list, i) {
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

    // (6:0) {#if decNum > 0}
    function create_if_block$1(ctx) {
    	let each_1_anchor;
    	let each_value = /*values*/ ctx[0];
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
    			if (dirty & /*values, decNum*/ 3) {
    				each_value = /*values*/ ctx[0];
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
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(6:0) {#if decNum > 0}",
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
    			add_location(td, file$2, 11, 3, 242);
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
    function create_each_block$1(ctx) {
    	let td;
    	let t_value = /*value*/ ctx[2].toFixed(/*decNum*/ ctx[1]) + "";
    	let t;

    	const block = {
    		c: function create() {
    			td = element("td");
    			t = text(t_value);
    			attr_dev(td, "class", "datatable__value datatable__value_number svelte-1m7xmmh");
    			add_location(td, file$2, 7, 3, 111);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, td, anchor);
    			append_dev(td, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*values, decNum*/ 3 && t_value !== (t_value = /*value*/ ctx[2].toFixed(/*decNum*/ ctx[1]) + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(td);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(7:3) {#each values as value}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let if_block_anchor;

    	function select_block_type(ctx, dirty) {
    		if (/*decNum*/ ctx[1] > 0) return create_if_block$1;
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
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("DataTableValues", slots, []);
    	let { values } = $$props;
    	let { decNum } = $$props;
    	const writable_props = ["values", "decNum"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<DataTableValues> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("values" in $$props) $$invalidate(0, values = $$props.values);
    		if ("decNum" in $$props) $$invalidate(1, decNum = $$props.decNum);
    	};

    	$$self.$capture_state = () => ({ values, decNum });

    	$$self.$inject_state = $$props => {
    		if ("values" in $$props) $$invalidate(0, values = $$props.values);
    		if ("decNum" in $$props) $$invalidate(1, decNum = $$props.decNum);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [values, decNum];
    }

    class DataTableValues extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, { values: 0, decNum: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "DataTableValues",
    			options,
    			id: create_fragment$4.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*values*/ ctx[0] === undefined && !("values" in props)) {
    			console.warn("<DataTableValues> was created without expected prop 'values'");
    		}

    		if (/*decNum*/ ctx[1] === undefined && !("decNum" in props)) {
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

    /* ../shared/tables/DataTable.svelte generated by Svelte v3.38.2 */
    const file$1 = "../shared/tables/DataTable.svelte";

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

    function get_each_context(ctx, list, i) {
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
    			add_location(tr, file$1, 25, 3, 728);
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
    function create_if_block(ctx) {
    	let each_1_anchor;
    	let current;
    	let each_value = /*variables*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
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
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
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
    		id: create_if_block.name,
    		type: "if",
    		source: "(18:0) {#if horizontal }",
    		ctx
    	});

    	return block;
    }

    // (27:6) {#each variables as {label, values}}
    function create_each_block_3(ctx) {
    	let td;
    	let t_value = /*label*/ ctx[4] + "";
    	let t;

    	const block = {
    		c: function create() {
    			td = element("td");
    			t = text(t_value);
    			attr_dev(td, "class", "datatable__label svelte-1r68t2h");
    			add_location(td, file$1, 27, 6, 805);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, td, anchor);
    			append_dev(td, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*variables*/ 1 && t_value !== (t_value = /*label*/ ctx[4] + "")) set_data_dev(t, t_value);
    		},
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
    			add_location(tr, file$1, 31, 3, 916);
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
    function create_each_block(ctx) {
    	let tr;
    	let td;
    	let t0_value = /*label*/ ctx[4] + "";
    	let t0;
    	let t1;
    	let datatablevalues;
    	let t2;
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
    			t0 = text(t0_value);
    			t1 = space();
    			create_component(datatablevalues.$$.fragment);
    			t2 = space();
    			attr_dev(td, "class", "datatable__label svelte-1r68t2h");
    			add_location(td, file$1, 20, 6, 601);
    			attr_dev(tr, "class", "datatable__row");
    			add_location(tr, file$1, 19, 3, 567);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, tr, anchor);
    			append_dev(tr, td);
    			append_dev(td, t0);
    			append_dev(tr, t1);
    			mount_component(datatablevalues, tr, null);
    			append_dev(tr, t2);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if ((!current || dirty & /*variables*/ 1) && t0_value !== (t0_value = /*label*/ ctx[4] + "")) set_data_dev(t0, t0_value);
    			const datatablevalues_changes = {};
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
    		id: create_each_block.name,
    		type: "each",
    		source: "(19:3) {#each variables as {label, values}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let table;
    	let current_block_type_index;
    	let if_block;
    	let current;
    	const if_block_creators = [create_if_block, create_else_block];
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
    			add_location(table, file$1, 15, 0, 476);
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
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("DataTable", slots, []);
    	let { variables = [] } = $$props;
    	let { horizontal = false } = $$props;
    	let { decNum = undefined } = $$props;

    	const getDecimalsNum = x => {
    		const dec = Math.log10(min(diff(x).map(v => Math.abs(v))));
    		return Math.abs(dec < 0 ? Math.floor(dec) : Math.ceil(dec));
    	};

    	const writable_props = ["variables", "horizontal", "decNum"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<DataTable> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("variables" in $$props) $$invalidate(0, variables = $$props.variables);
    		if ("horizontal" in $$props) $$invalidate(1, horizontal = $$props.horizontal);
    		if ("decNum" in $$props) $$invalidate(2, decNum = $$props.decNum);
    	};

    	$$self.$capture_state = () => ({
    		min,
    		diff,
    		DataTableValues,
    		variables,
    		horizontal,
    		decNum,
    		getDecimalsNum
    	});

    	$$self.$inject_state = $$props => {
    		if ("variables" in $$props) $$invalidate(0, variables = $$props.variables);
    		if ("horizontal" in $$props) $$invalidate(1, horizontal = $$props.horizontal);
    		if ("decNum" in $$props) $$invalidate(2, decNum = $$props.decNum);
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
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { variables: 0, horizontal: 1, decNum: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "DataTable",
    			options,
    			id: create_fragment$3.name
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

    /* src/AppDataTable.svelte generated by Svelte v3.38.2 */

    function create_fragment$2(ctx) {
    	let datatable;
    	let current;

    	datatable = new DataTable({
    			props: {
    				variables: [
    					{ label: "i", values: /*sample*/ ctx[0].i },
    					{ label: "x", values: /*sample*/ ctx[0].x },
    					{ label: "p", values: /*sample*/ ctx[0].p }
    				],
    				decNum: [0, 1, 3],
    				horizontal: true
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(datatable.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(datatable, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const datatable_changes = {};

    			if (dirty & /*sample*/ 1) datatable_changes.variables = [
    				{ label: "i", values: /*sample*/ ctx[0].i },
    				{ label: "x", values: /*sample*/ ctx[0].x },
    				{ label: "p", values: /*sample*/ ctx[0].p }
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
    			destroy_component(datatable, detaching);
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
    	validate_slots("AppDataTable", slots, []);
    	let { sample } = $$props;
    	const writable_props = ["sample"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<AppDataTable> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("sample" in $$props) $$invalidate(0, sample = $$props.sample);
    	};

    	$$self.$capture_state = () => ({ DataTable, sample });

    	$$self.$inject_state = $$props => {
    		if ("sample" in $$props) $$invalidate(0, sample = $$props.sample);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [sample];
    }

    class AppDataTable extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { sample: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "AppDataTable",
    			options,
    			id: create_fragment$2.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*sample*/ ctx[0] === undefined && !("sample" in props)) {
    			console.warn("<AppDataTable> was created without expected prop 'sample'");
    		}
    	}

    	get sample() {
    		throw new Error("<AppDataTable>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set sample(value) {
    		throw new Error("<AppDataTable>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/AppStatTable.svelte generated by Svelte v3.38.2 */

    function create_fragment$1(ctx) {
    	let datatable;
    	let current;

    	datatable = new DataTable({
    			props: {
    				variables: [
    					{
    						label: "min",
    						values: [/*values*/ ctx[0][0]]
    					},
    					{ label: "Q1", values: [/*Q1*/ ctx[1]] },
    					{ label: "Q2", values: [/*Q2*/ ctx[2]] },
    					{ label: "mean", values: [/*m*/ ctx[4]] },
    					{ label: "Q3", values: [/*Q3*/ ctx[3]] },
    					{
    						label: "max",
    						values: [/*values*/ ctx[0][/*sampleSize*/ ctx[5] - 1]]
    					}
    				],
    				decNum: [1, 1, 1, 1, 1, 1, 1],
    				horizontal: true
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(datatable.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(datatable, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const datatable_changes = {};

    			if (dirty & /*values, Q1, Q2, m, Q3, sampleSize*/ 63) datatable_changes.variables = [
    				{
    					label: "min",
    					values: [/*values*/ ctx[0][0]]
    				},
    				{ label: "Q1", values: [/*Q1*/ ctx[1]] },
    				{ label: "Q2", values: [/*Q2*/ ctx[2]] },
    				{ label: "mean", values: [/*m*/ ctx[4]] },
    				{ label: "Q3", values: [/*Q3*/ ctx[3]] },
    				{
    					label: "max",
    					values: [/*values*/ ctx[0][/*sampleSize*/ ctx[5] - 1]]
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
    			destroy_component(datatable, detaching);
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
    	let Q1;
    	let Q2;
    	let Q3;
    	let m;
    	let sampleSize;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("AppStatTable", slots, []);
    	let { values } = $$props;
    	const writable_props = ["values"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<AppStatTable> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("values" in $$props) $$invalidate(0, values = $$props.values);
    	};

    	$$self.$capture_state = () => ({
    		quantile,
    		mean,
    		DataTable,
    		values,
    		Q1,
    		Q2,
    		Q3,
    		m,
    		sampleSize
    	});

    	$$self.$inject_state = $$props => {
    		if ("values" in $$props) $$invalidate(0, values = $$props.values);
    		if ("Q1" in $$props) $$invalidate(1, Q1 = $$props.Q1);
    		if ("Q2" in $$props) $$invalidate(2, Q2 = $$props.Q2);
    		if ("Q3" in $$props) $$invalidate(3, Q3 = $$props.Q3);
    		if ("m" in $$props) $$invalidate(4, m = $$props.m);
    		if ("sampleSize" in $$props) $$invalidate(5, sampleSize = $$props.sampleSize);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*values*/ 1) {
    			$$invalidate(1, Q1 = quantile(values, 0.25));
    		}

    		if ($$self.$$.dirty & /*values*/ 1) {
    			$$invalidate(2, Q2 = quantile(values, 0.5));
    		}

    		if ($$self.$$.dirty & /*values*/ 1) {
    			$$invalidate(3, Q3 = quantile(values, 0.75));
    		}

    		if ($$self.$$.dirty & /*values*/ 1) {
    			$$invalidate(4, m = mean(values));
    		}

    		if ($$self.$$.dirty & /*values*/ 1) {
    			$$invalidate(5, sampleSize = values.length);
    		}
    	};

    	return [values, Q1, Q2, Q3, m, sampleSize];
    }

    class AppStatTable extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { values: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "AppStatTable",
    			options,
    			id: create_fragment$1.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*values*/ ctx[0] === undefined && !("values" in props)) {
    			console.warn("<AppStatTable> was created without expected prop 'values'");
    		}
    	}

    	get values() {
    		throw new Error("<AppStatTable>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set values(value) {
    		throw new Error("<AppStatTable>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/App.svelte generated by Svelte v3.38.2 */
    const file = "src/App.svelte";

    // (67:9) <AppControlArea {errormsg}>
    function create_default_slot_1(ctx) {
    	let appcontrolrange0;
    	let updating_value;
    	let t0;
    	let appcontrolrange1;
    	let updating_value_1;
    	let t1;
    	let appcontrolbutton;
    	let current;

    	function appcontrolrange0_value_binding(value) {
    		/*appcontrolrange0_value_binding*/ ctx[5](value);
    	}

    	let appcontrolrange0_props = {
    		id: "minValue",
    		label: "Change min:",
    		step: 0.1,
    		min: /*minRange*/ ctx[0][0],
    		max: /*minRange*/ ctx[0][1]
    	};

    	if (/*sample*/ ctx[2].x[0] !== void 0) {
    		appcontrolrange0_props.value = /*sample*/ ctx[2].x[0];
    	}

    	appcontrolrange0 = new AppControlRange({
    			props: appcontrolrange0_props,
    			$$inline: true
    		});

    	binding_callbacks.push(() => bind(appcontrolrange0, "value", appcontrolrange0_value_binding));

    	function appcontrolrange1_value_binding(value) {
    		/*appcontrolrange1_value_binding*/ ctx[6](value);
    	}

    	let appcontrolrange1_props = {
    		id: "maxValue",
    		label: "Change max:",
    		step: 0.1,
    		min: /*maxRange*/ ctx[1][0],
    		max: /*maxRange*/ ctx[1][1]
    	};

    	if (/*sample*/ ctx[2].x[sampleSize - 1] !== void 0) {
    		appcontrolrange1_props.value = /*sample*/ ctx[2].x[sampleSize - 1];
    	}

    	appcontrolrange1 = new AppControlRange({
    			props: appcontrolrange1_props,
    			$$inline: true
    		});

    	binding_callbacks.push(() => bind(appcontrolrange1, "value", appcontrolrange1_value_binding));

    	appcontrolbutton = new AppControlButton({
    			props: {
    				id: "getSample",
    				label: "Sample:",
    				text: "Take new"
    			},
    			$$inline: true
    		});

    	appcontrolbutton.$on("click", /*click_handler*/ ctx[7]);

    	const block = {
    		c: function create() {
    			create_component(appcontrolrange0.$$.fragment);
    			t0 = space();
    			create_component(appcontrolrange1.$$.fragment);
    			t1 = space();
    			create_component(appcontrolbutton.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(appcontrolrange0, target, anchor);
    			insert_dev(target, t0, anchor);
    			mount_component(appcontrolrange1, target, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(appcontrolbutton, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const appcontrolrange0_changes = {};
    			if (dirty & /*minRange*/ 1) appcontrolrange0_changes.min = /*minRange*/ ctx[0][0];
    			if (dirty & /*minRange*/ 1) appcontrolrange0_changes.max = /*minRange*/ ctx[0][1];

    			if (!updating_value && dirty & /*sample*/ 4) {
    				updating_value = true;
    				appcontrolrange0_changes.value = /*sample*/ ctx[2].x[0];
    				add_flush_callback(() => updating_value = false);
    			}

    			appcontrolrange0.$set(appcontrolrange0_changes);
    			const appcontrolrange1_changes = {};
    			if (dirty & /*maxRange*/ 2) appcontrolrange1_changes.min = /*maxRange*/ ctx[1][0];
    			if (dirty & /*maxRange*/ 2) appcontrolrange1_changes.max = /*maxRange*/ ctx[1][1];

    			if (!updating_value_1 && dirty & /*sample, sampleSize*/ 4) {
    				updating_value_1 = true;
    				appcontrolrange1_changes.value = /*sample*/ ctx[2].x[sampleSize - 1];
    				add_flush_callback(() => updating_value_1 = false);
    			}

    			appcontrolrange1.$set(appcontrolrange1_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(appcontrolrange0.$$.fragment, local);
    			transition_in(appcontrolrange1.$$.fragment, local);
    			transition_in(appcontrolbutton.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(appcontrolrange0.$$.fragment, local);
    			transition_out(appcontrolrange1.$$.fragment, local);
    			transition_out(appcontrolbutton.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(appcontrolrange0, detaching);
    			if (detaching) detach_dev(t0);
    			destroy_component(appcontrolrange1, detaching);
    			if (detaching) detach_dev(t1);
    			destroy_component(appcontrolbutton, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1.name,
    		type: "slot",
    		source: "(67:9) <AppControlArea {errormsg}>",
    		ctx
    	});

    	return block;
    }

    // (47:0) <StatApp>
    function create_default_slot(ctx) {
    	let div4;
    	let div0;
    	let plot;
    	let t0;
    	let div1;
    	let datatable;
    	let t1;
    	let div2;
    	let stattable;
    	let t2;
    	let div3;
    	let appcontrolarea;
    	let current;

    	plot = new AppPlot({
    			props: { values: /*sample*/ ctx[2].x },
    			$$inline: true
    		});

    	datatable = new AppDataTable({
    			props: { sample: /*sample*/ ctx[2] },
    			$$inline: true
    		});

    	stattable = new AppStatTable({
    			props: { values: /*sample*/ ctx[2].x },
    			$$inline: true
    		});

    	appcontrolarea = new AppControlArea({
    			props: {
    				errormsg: /*errormsg*/ ctx[3],
    				$$slots: { default: [create_default_slot_1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div4 = element("div");
    			div0 = element("div");
    			create_component(plot.$$.fragment);
    			t0 = space();
    			div1 = element("div");
    			create_component(datatable.$$.fragment);
    			t1 = space();
    			div2 = element("div");
    			create_component(stattable.$$.fragment);
    			t2 = space();
    			div3 = element("div");
    			create_component(appcontrolarea.$$.fragment);
    			attr_dev(div0, "class", "app-plot-area svelte-1vnhz0y");
    			add_location(div0, file, 50, 6, 1667);
    			attr_dev(div1, "class", "app-datatable-area svelte-1vnhz0y");
    			add_location(div1, file, 55, 6, 1777);
    			attr_dev(div2, "class", "app-stattable-area svelte-1vnhz0y");
    			add_location(div2, file, 60, 6, 1899);
    			attr_dev(div3, "class", "app-controls-area svelte-1vnhz0y");
    			add_location(div3, file, 65, 6, 2025);
    			attr_dev(div4, "class", "app-layout svelte-1vnhz0y");
    			add_location(div4, file, 47, 3, 1584);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div4, anchor);
    			append_dev(div4, div0);
    			mount_component(plot, div0, null);
    			append_dev(div4, t0);
    			append_dev(div4, div1);
    			mount_component(datatable, div1, null);
    			append_dev(div4, t1);
    			append_dev(div4, div2);
    			mount_component(stattable, div2, null);
    			append_dev(div4, t2);
    			append_dev(div4, div3);
    			mount_component(appcontrolarea, div3, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const plot_changes = {};
    			if (dirty & /*sample*/ 4) plot_changes.values = /*sample*/ ctx[2].x;
    			plot.$set(plot_changes);
    			const datatable_changes = {};
    			if (dirty & /*sample*/ 4) datatable_changes.sample = /*sample*/ ctx[2];
    			datatable.$set(datatable_changes);
    			const stattable_changes = {};
    			if (dirty & /*sample*/ 4) stattable_changes.values = /*sample*/ ctx[2].x;
    			stattable.$set(stattable_changes);
    			const appcontrolarea_changes = {};
    			if (dirty & /*errormsg*/ 8) appcontrolarea_changes.errormsg = /*errormsg*/ ctx[3];

    			if (dirty & /*$$scope, sample, maxRange, minRange*/ 263) {
    				appcontrolarea_changes.$$scope = { dirty, ctx };
    			}

    			appcontrolarea.$set(appcontrolarea_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(plot.$$.fragment, local);
    			transition_in(datatable.$$.fragment, local);
    			transition_in(stattable.$$.fragment, local);
    			transition_in(appcontrolarea.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(plot.$$.fragment, local);
    			transition_out(datatable.$$.fragment, local);
    			transition_out(stattable.$$.fragment, local);
    			transition_out(appcontrolarea.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div4);
    			destroy_component(plot);
    			destroy_component(datatable);
    			destroy_component(stattable);
    			destroy_component(appcontrolarea);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(47:0) <StatApp>",
    		ctx
    	});

    	return block;
    }

    // (75:3) 
    function create_help_slot(ctx) {
    	let div;
    	let h2;
    	let t1;
    	let p0;
    	let t2;
    	let i0;
    	let t4;
    	let i1;
    	let t6;
    	let i2;
    	let t8;
    	let i3;
    	let t10;
    	let t11;
    	let p1;
    	let t12;
    	let i4;
    	let t14;
    	let i5;
    	let t16;
    	let t17;
    	let p2;
    	let t18;
    	let i6;
    	let t20;
    	let i7;
    	let t22;
    	let i8;
    	let t24;
    	let em;
    	let t26;
    	let code;
    	let t28;

    	const block = {
    		c: function create() {
    			div = element("div");
    			h2 = element("h2");
    			h2.textContent = "Quantiles, quartiles, percentiles";
    			t1 = space();
    			p0 = element("p");
    			t2 = text("This app shows calculation of main non-parametric descriptive statistics: ");
    			i0 = element("i");
    			i0.textContent = "min";
    			t4 = text(", ");
    			i1 = element("i");
    			i1.textContent = "max";
    			t6 = text(", ");
    			i2 = element("i");
    			i2.textContent = "quartiles";
    			t8 = text(" and\n         ");
    			i3 = element("i");
    			i3.textContent = "percentils";
    			t10 = text(". The plot contains current sample values as points and the traditional box and whiskers plot. The dashed line inside\n         the box shows the mean. The red elements represent boundaries for detection of outliers (based on ±1.5IQR rule).");
    			t11 = space();
    			p1 = element("p");
    			t12 = text("Try to change the smallest (");
    			i4 = element("i");
    			i4.textContent = "min";
    			t14 = text(") or the largest (");
    			i5 = element("i");
    			i5.textContent = "max";
    			t16 = text(") values of your current sample using the sliders in order to see what happens to the boxplot if one of the values will be outside the boundaries. You can also pay attention which statistics are changing and which remain stable in this case.");
    			t17 = space();
    			p2 = element("p");
    			t18 = text("The table in the bottom shows the current values (");
    			i6 = element("i");
    			i6.textContent = "x";
    			t20 = text(") ordered from smallest to largest, their rank (");
    			i7 = element("i");
    			i7.textContent = "i";
    			t22 = text("), as well\n         as their percentiles (");
    			i8 = element("i");
    			i8.textContent = "p";
    			t24 = text(") also known as ");
    			em = element("em");
    			em.textContent = "sample quantiles";
    			t26 = text(". The percentiles are computed using ");
    			code = element("code");
    			code.textContent = "(i - 0.5)/n";
    			t28 = text(" rule. The table on the right side shows the computed statistics.");
    			add_location(h2, file, 75, 6, 2589);
    			add_location(i0, file, 77, 83, 2725);
    			add_location(i1, file, 77, 95, 2737);
    			add_location(i2, file, 77, 107, 2749);
    			add_location(i3, file, 78, 9, 2779);
    			add_location(p0, file, 76, 6, 2638);
    			add_location(i4, file, 82, 37, 3094);
    			add_location(i5, file, 82, 65, 3122);
    			add_location(p1, file, 81, 6, 3053);
    			add_location(i6, file, 85, 59, 3454);
    			add_location(i7, file, 85, 115, 3510);
    			add_location(i8, file, 86, 31, 3560);
    			add_location(em, file, 86, 55, 3584);
    			add_location(code, file, 86, 117, 3646);
    			add_location(p2, file, 84, 6, 3391);
    			attr_dev(div, "slot", "help");
    			add_location(div, file, 74, 3, 2565);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, h2);
    			append_dev(div, t1);
    			append_dev(div, p0);
    			append_dev(p0, t2);
    			append_dev(p0, i0);
    			append_dev(p0, t4);
    			append_dev(p0, i1);
    			append_dev(p0, t6);
    			append_dev(p0, i2);
    			append_dev(p0, t8);
    			append_dev(p0, i3);
    			append_dev(p0, t10);
    			append_dev(div, t11);
    			append_dev(div, p1);
    			append_dev(p1, t12);
    			append_dev(p1, i4);
    			append_dev(p1, t14);
    			append_dev(p1, i5);
    			append_dev(p1, t16);
    			append_dev(div, t17);
    			append_dev(div, p2);
    			append_dev(p2, t18);
    			append_dev(p2, i6);
    			append_dev(p2, t20);
    			append_dev(p2, i7);
    			append_dev(p2, t22);
    			append_dev(p2, i8);
    			append_dev(p2, t24);
    			append_dev(p2, em);
    			append_dev(p2, t26);
    			append_dev(p2, code);
    			append_dev(p2, t28);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_help_slot.name,
    		type: "slot",
    		source: "(75:3) ",
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

    			if (dirty & /*$$scope, errormsg, sample, maxRange, minRange*/ 271) {
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

    const sampleSize = 12;
    const popMean = 110;
    const popStd = 5;

    function instance($$self, $$props, $$invalidate) {
    	let sample;
    	let errormsg;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);
    	let minRange = [0, 0];
    	let maxRange = [0, 0];

    	const getSample = function (n) {
    		// take random normally distributed values and sort them
    		let values = sort(rnorm(n, popMean, popStd));

    		// half of the range of the values
    		const dv = (max(values) - min(values)) * 0.5;

    		// compute range for min and max controllers
    		$$invalidate(0, minRange = [values[0] - dv, values[1] - (values[1] - values[0]) * 0.1]);

    		$$invalidate(1, maxRange = [values[n - 2] + (values[n - 1] - values[n - 2]) * 0.1, values[n - 1] + dv]);

    		// return object with ranks, values and percentiles
    		return {
    			i: Array.from({ length: n }, (v, i) => i + 1),
    			x: values,
    			p: Array.from({ length: n }, (v, i) => (i + 0.5) / n)
    		};
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	function appcontrolrange0_value_binding(value) {
    		if ($$self.$$.not_equal(sample.x[0], value)) {
    			sample.x[0] = value;
    			$$invalidate(2, sample);
    		}
    	}

    	function appcontrolrange1_value_binding(value) {
    		if ($$self.$$.not_equal(sample.x[sampleSize - 1], value)) {
    			sample.x[sampleSize - 1] = value;
    			$$invalidate(2, sample);
    		}
    	}

    	const click_handler = () => $$invalidate(2, sample = getSample(sampleSize));

    	$$self.$capture_state = () => ({
    		max,
    		rnorm,
    		sort,
    		min,
    		StatApp,
    		AppControlRange,
    		AppControlButton,
    		AppControlArea,
    		Plot: AppPlot,
    		DataTable: AppDataTable,
    		StatTable: AppStatTable,
    		sampleSize,
    		popMean,
    		popStd,
    		minRange,
    		maxRange,
    		getSample,
    		sample,
    		errormsg
    	});

    	$$self.$inject_state = $$props => {
    		if ("minRange" in $$props) $$invalidate(0, minRange = $$props.minRange);
    		if ("maxRange" in $$props) $$invalidate(1, maxRange = $$props.maxRange);
    		if ("sample" in $$props) $$invalidate(2, sample = $$props.sample);
    		if ("errormsg" in $$props) $$invalidate(3, errormsg = $$props.errormsg);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$invalidate(2, sample = getSample(sampleSize));

    	$$invalidate(3, errormsg = "");

    	return [
    		minRange,
    		maxRange,
    		sample,
    		errormsg,
    		getSample,
    		appcontrolrange0_value_binding,
    		appcontrolrange1_value_binding,
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
    	target: document.getElementById("mdatools-app-container"),
    });

    return app;

}());
//# sourceMappingURL=asta-b101.js.map
