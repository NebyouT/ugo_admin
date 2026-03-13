// UGO Landing Page - jQuery Like Library (Fixed)

// ===== JQUERY LIKE FUNCTIONS ===== */
window.$ = window.jQuery = function(selector) {
    if (typeof selector === 'string') {
        const elements = document.querySelectorAll(selector);
        return {
            elements: Array.from(elements),
            on: function(event, handler) {
                this.elements.forEach(el => el.addEventListener(event, handler));
                return this;
            },
            click: function(handler) {
                this.elements.forEach(el => el.addEventListener('click', handler));
                return this;
            },
            hide: function() {
                this.elements.forEach(el => el.style.display = 'none');
                return this;
            },
            show: function() {
                this.elements.forEach(el => el.style.display = 'block');
                return this;
            },
            addClass: function(className) {
                this.elements.forEach(el => el.classList.add(className));
                return this;
            },
            removeClass: function(className) {
                this.elements.forEach(el => el.classList.remove(className));
                return this;
            },
            toggleClass: function(className) {
                this.elements.forEach(el => el.classList.toggle(className));
                return this;
            },
            css: function(property, value) {
                if (typeof property === 'object') {
                    Object.keys(property).forEach(prop => {
                        this.elements.forEach(el => el.style[prop] = property[prop]);
                    });
                } else {
                    this.elements.forEach(el => el.style[property] = value);
                }
                return this;
            },
            attr: function(name, value) {
                if (value !== undefined) {
                    this.elements.forEach(el => el.setAttribute(name, value));
                    return this;
                } else {
                    return this.elements[0]?.getAttribute(name);
                }
            },
            html: function(content) {
                if (content !== undefined) {
                    this.elements.forEach(el => el.innerHTML = content);
                    return this;
                } else {
                    return this.elements[0]?.innerHTML;
                }
            },
            text: function(content) {
                if (content !== undefined) {
                    this.elements.forEach(el => el.textContent = content);
                    return this;
                } else {
                    return this.elements[0]?.textContent;
                }
            },
            val: function(value) {
                if (value !== undefined) {
                    this.elements.forEach(el => el.value = value);
                    return this;
                } else {
                    return this.elements[0]?.value;
                }
            },
            focus: function() {
                if (this.elements[0]) this.elements[0].focus();
                return this;
            },
            blur: function() {
                this.elements.forEach(el => el.blur());
                return this;
            },
            submit: function() {
                this.elements.forEach(el => {
                    if (el.tagName === 'FORM') el.submit();
                });
                return this;
            },
            preventDefault: function() {
                this.elements.forEach(el => {
                    el.addEventListener('click', e => e.preventDefault());
                });
                return this;
            },
            stopPropagation: function() {
                this.elements.forEach(el => {
                    el.addEventListener('click', e => e.stopPropagation());
                });
                return this;
            },
            fadeIn: function(duration = 300) {
                this.elements.forEach(el => {
                    el.style.opacity = '0';
                    el.style.display = 'block';
                    el.style.transition = `opacity ${duration}ms`;
                    setTimeout(() => el.style.opacity = '1', 10);
                });
                return this;
            },
            fadeOut: function(duration = 300) {
                this.elements.forEach(el => {
                    el.style.opacity = '1';
                    el.style.transition = `opacity ${duration}ms`;
                    el.style.opacity = '0';
                    setTimeout(() => el.style.display = 'none', duration);
                });
                return this;
            },
            slideUp: function(duration = 300) {
                this.elements.forEach(el => {
                    el.style.transition = `height ${duration}ms`;
                    el.style.height = el.offsetHeight + 'px';
                    setTimeout(() => el.style.height = '0', 10);
                    setTimeout(() => el.style.display = 'none', duration);
                });
                return this;
            },
            slideDown: function(duration = 300) {
                this.elements.forEach(el => {
                    el.style.display = 'block';
                    el.style.height = '0';
                    el.style.transition = `height ${duration}ms`;
                    el.style.overflow = 'hidden';
                    setTimeout(() => el.style.height = el.scrollHeight + 'px', 10);
                });
                return this;
            },
            animate: function(properties, duration = 300) {
                this.elements.forEach(el => {
                    el.style.transition = `all ${duration}ms`;
                    Object.keys(properties).forEach(prop => {
                        el.style[prop] = properties[prop];
                    });
                });
                return this;
            },
            offset: function() {
                if (this.elements[0]) {
                    const rect = this.elements[0].getBoundingClientRect();
                    return {
                        top: rect.top + window.pageYOffset,
                        left: rect.left + window.pageXOffset
                    };
                }
                return null;
            },
            position: function() {
                if (this.elements[0]) {
                    return {
                        top: this.elements[0].offsetTop,
                        left: this.elements[0].offsetLeft
                    };
                }
                return null;
            },
            width: function() {
                return this.elements[0]?.offsetWidth || 0;
            },
            height: function() {
                return this.elements[0]?.offsetHeight || 0;
            },
            outerWidth: function() {
                if (this.elements[0]) {
                    const styles = window.getComputedStyle(this.elements[0]);
                    return this.elements[0].offsetWidth + 
                           parseInt(styles.marginLeft) + 
                           parseInt(styles.marginRight);
                }
                return 0;
            },
            outerHeight: function() {
                if (this.elements[0]) {
                    const styles = window.getComputedStyle(this.elements[0]);
                    return this.elements[0].offsetHeight + 
                           parseInt(styles.marginTop) + 
                           parseInt(styles.marginBottom);
                }
                return 0;
            },
            scrollTop: function(value) {
                if (value !== undefined) {
                    this.elements.forEach(el => el.scrollTop = value);
                    return this;
                } else {
                    return this.elements[0]?.scrollTop || 0;
                }
            },
            scrollLeft: function(value) {
                if (value !== undefined) {
                    this.elements.forEach(el => el.scrollLeft = value);
                    return this;
                } else {
                    return this.elements[0]?.scrollLeft || 0;
                }
            },
            data: function(key, value) {
                if (value !== undefined) {
                    this.elements.forEach(el => {
                        if (!el.dataset) el.dataset = {};
                        el.dataset[key] = value;
                    });
                    return this;
                } else {
                    return this.elements[0]?.dataset?.[key];
                }
            },
            remove: function() {
                this.elements.forEach(el => el.remove());
                return this;
            },
            empty: function() {
                this.elements.forEach(el => el.innerHTML = '');
                return this;
            },
            clone: function() {
                return $(this.elements.map(el => el.cloneNode(true)));
            },
            find: function(selector) {
                const found = [];
                this.elements.forEach(el => {
                    found.push(...el.querySelectorAll(selector));
                });
                return $(found);
            },
            closest: function(selector) {
                if (this.elements[0]) {
                    let el = this.elements[0].closest(selector);
                    return el ? $(el) : $();
                }
                return $();
            },
            parent: function() {
                return $(this.elements.map(el => el.parentElement).filter(Boolean));
            },
            children: function() {
                return $(this.elements.map(el => Array.from(el.children)).flat());
            },
            siblings: function() {
                return $(this.elements.map(el => 
                    Array.from(el.parentElement.children).filter(child => child !== el)
                ).flat());
            },
            next: function() {
                return $(this.elements.map(el => el.nextElementSibling).filter(Boolean));
            },
            prev: function() {
                return $(this.elements.map(el => el.previousElementSibling).filter(Boolean));
            },
            first: function() {
                return this.elements[0] ? $(this.elements[0]) : $();
            },
            last: function() {
                return this.elements[this.elements.length - 1] ? 
                       $(this.elements[this.elements.length - 1]) : $();
            },
            eq: function(index) {
                return this.elements[index] ? $(this.elements[index]) : $();
            },
            is: function(selector) {
                return this.elements.some(el => el.matches(selector));
            },
            has: function(selector) {
                return this.elements.some(el => el.querySelector(selector));
            },
            not: function(selector) {
                return $(this.elements.filter(el => !el.matches(selector)));
            },
            filter: function(selector) {
                return $(this.elements.filter(el => el.matches(selector)));
            },
            each: function(callback) {
                this.elements.forEach((el, index) => callback.call(el, index, el));
                return this;
            },
            length: function() {
                return this.elements.length;
            },
            get: function(index) {
                return this.elements[index];
            }
        };
    }
    // Return document element for $(document) calls
    return {
        elements: [document],
        ready: function(callback) {
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', callback);
            } else {
                callback();
            }
            return this;
        },
        on: function(event, handler) {
            document.addEventListener(event, handler);
            return this;
        }
    };
};

// ===== DOCUMENT READY ===== */
$(document).ready(function() {
    // Initialize dropdowns
    document.querySelectorAll('[data-bs-toggle="dropdown"]').forEach(element => {
        element.addEventListener('click', function(e) {
            e.preventDefault();
            const dropdown = new bootstrap.Dropdown(element);
            dropdown.toggle();
        });
    });
    
    // Initialize tooltips
    document.querySelectorAll('[data-bs-toggle="tooltip"]').forEach(element => {
        new bootstrap.Tooltip(element);
    });
    
    // Initialize modals
    document.querySelectorAll('.modal').forEach(element => {
        const modal = new bootstrap.Modal(element);
        element.addEventListener('click', function(e) {
            if (e.target === element) {
                modal.hide();
            }
        });
    });
    
    // Initialize alerts
    document.querySelectorAll('.alert .btn-close').forEach(element => {
        element.addEventListener('click', function() {
            const alert = new bootstrap.Alert(element.closest('.alert'));
            alert.close();
        });
    });
});

// ===== EXPORT ===== */
if (typeof module !== 'undefined' && module.exports) {
    module.exports = $;
}
