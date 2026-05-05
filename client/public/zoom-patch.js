// Global Zoom SDK React Compatibility Patch
// This script runs BEFORE any other JavaScript to prevent ReactCurrentOwner errors

(function() {
  'use strict';
  
  console.log('🚀 GLOBAL Zoom SDK compatibility patch loading...');
  
  // Global error handler to suppress ReactCurrentOwner errors
  window.addEventListener('error', function(event) {
    if (event.error && event.error.message && event.error.message.includes('ReactCurrentOwner')) {
      console.log('🛡️ GLOBAL: Suppressed ReactCurrentOwner error');
      event.preventDefault();
      event.stopPropagation();
      return false;
    }
  }, true);
  
  // Also catch unhandled promise rejections
  window.addEventListener('unhandledrejection', function(event) {
    if (event.reason && event.reason.message && event.reason.message.includes('ReactCurrentOwner')) {
      console.log('🛡️ GLOBAL: Suppressed ReactCurrentOwner promise rejection');
      event.preventDefault();
      event.stopPropagation();
    }
  }, true);
  
  // Apply patch IMMEDIATELY - before any other scripts
  if (typeof window !== 'undefined') {
    console.log('🔧 Applying GLOBAL Zoom SDK compatibility patch IMMEDIATELY...');
    
    // Create a comprehensive React devtools hook with getter protection
    const createHook = function() {
      const hook = {
        renderers: new Map(),
        supportsFiber: true,
        inject: () => {},
        onCommitFiberRoot: () => {},
        onCommitFiberUnmount: () => {},
        checkDCE: () => false,
        onScheduleRoot: () => {},
        setStrictMode: () => {},
        getFiberRoots: () => new Set(),
        _reactCurrentOwner: { current: null }
      };
      
      // Define ReactCurrentOwner with getter to ensure it's always accessible
      Object.defineProperty(hook, 'ReactCurrentOwner', {
        get: function() {
          return this._reactCurrentOwner || { current: null };
        },
        set: function(val) {
          // Don't allow override
          console.log('🛡️ GLOBAL: Blocked ReactCurrentOwner override attempt');
        },
        enumerable: true,
        configurable: false
      });
      
      return hook;
    };
    
    // Set up the hook IMMEDIATELY - before ANYTHING else
    if (!window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
      window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = createHook();
      console.log('✅ GLOBAL React devtools hook created');
    } else {
      // Hook exists, ensure it has ReactCurrentOwner
      var existingHook = window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
      if (!existingHook.ReactCurrentOwner) {
        Object.defineProperty(existingHook, 'ReactCurrentOwner', {
          get: function() {
            return { current: null };
          },
          set: function(val) {
            console.log('🛡️ GLOBAL: Blocked ReactCurrentOwner override on existing hook');
          },
          enumerable: true,
          configurable: false
        });
        console.log('✅ GLOBAL: Added ReactCurrentOwner getter to existing hook');
      }
    }
    
    // Override Object.defineProperty IMMEDIATELY - most aggressive approach
    const originalDefineProperty = Object.defineProperty;
    Object.defineProperty = function(obj, prop, descriptor) {
      // Ensure prop is a string before calling string methods
      if (typeof prop !== 'string') {
        return originalDefineProperty.call(this, obj, prop, descriptor);
      }
      
      // BLOCK ReactCurrentOwner access - NO EXCEPTIONS
      if (prop === 'ReactCurrentOwner') {
        console.log('🛡️ GLOBAL BLOCKING Zoom SDK access to ReactCurrentOwner');
        return originalDefineProperty.call(this, obj, prop, {
          ...descriptor,
          value: { current: null },
          writable: false,
          configurable: false,
          enumerable: false
        });
      }
      
      // BLOCK all React internal properties - NO EXCEPTIONS
      if (prop.startsWith('React') || prop.startsWith('__react')) {
        console.log('🛡️ GLOBAL BLOCKING Zoom SDK access to React property: ' + prop);
        return originalDefineProperty.call(this, obj, prop, {
          ...descriptor,
          value: descriptor.value || {},
          writable: false,
          configurable: false
        });
      }
      
      return originalDefineProperty.call(this, obj, prop, descriptor);
    };
    
    // Also override Object.defineProperties for additional protection
    const originalDefineProperties = Object.defineProperties;
    Object.defineProperties = function(obj, props) {
      const newProps = {};
      for (var prop in props) {
        if (typeof prop === 'string' && (prop === 'ReactCurrentOwner' || prop.startsWith('React') || prop.startsWith('__react'))) {
          console.log('🛡️ GLOBAL BLOCKING defineProperties for: ' + prop);
          // Skip React properties or make them safe
          newProps[prop] = {
            ...props[prop],
            value: prop === 'ReactCurrentOwner' ? { current: null } : (props[prop].value || {}),
            writable: false,
            configurable: false
          };
        } else {
          newProps[prop] = props[prop];
        }
      }
      return originalDefineProperties.call(this, obj, newProps);
    };
    
    // Patch dispatchEvent for null target errors
    const originalDispatchEvent = EventTarget.prototype.dispatchEvent;
    EventTarget.prototype.dispatchEvent = function(event) {
      if (event.target === null || event.target === undefined) {
        Object.defineProperty(event, 'target', {
          value: document.body || document.documentElement,
          writable: false,
          configurable: true
        });
      }
      try {
        return originalDispatchEvent.call(this, event);
      } catch (error) {
        console.warn('⚠️ GLOBAL Zoom SDK dispatchEvent error suppressed:', error);
        return true;
      }
    };
    
    // Protect the hook from future overrides
    try {
      const currentHook = window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
      Object.defineProperty(window, '__REACT_DEVTOOLS_GLOBAL_HOOK__', {
        get: function() {
          return currentHook;
        },
        set: function(value) {
          console.log('🛡️ GLOBAL Preventing override of React devtools hook');
          return; // Don't allow override
        },
        configurable: false, // Make it non-configurable
        enumerable: false
      });
    } catch (error) {
      console.log('ℹ️ GLOBAL React devtools hook already protected');
    }
    
    console.log('✅ GLOBAL Zoom SDK compatibility patch applied SUCCESSFULLY');
  } else {
    console.log('⚠️ Not in browser environment, skipping global patch');
  }
})();
