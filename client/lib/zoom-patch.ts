// Zoom SDK React Compatibility Patch
// This file must be imported BEFORE Zoom SDK to prevent ReactCurrentOwner errors
import * as React from 'react';

console.log('🚀 Loading Zoom SDK compatibility patch...');

// IMMEDIATE PATCH - Runs as soon as this module loads, before any other code
if (typeof window !== 'undefined') {
  console.log('🔥 EMERGENCY PATCH - Applying immediately at module load...');

  // React 19 Compatibility Patch for Zoom SDK
  try {
    const ReactAny = React as any;
    if (!ReactAny.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED) {
      ReactAny.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = {
        ReactCurrentOwner: { current: null },
      };
      console.log('🔥 React 19 Patch: Created __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED');
    } else if (!ReactAny.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner) {
      ReactAny.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner = { current: null };
      console.log('🔥 React 19 Patch: Added ReactCurrentOwner to existing internals');
    }
  } catch (err) {
    console.error('Failed to patch React internals for Zoom SDK:', err);
  }

  
  // Type assertion for window object with React devtools hook
  const windowWithReact = window as any;
  
  // Create React devtools hook immediately with protected ReactCurrentOwner
  if (!windowWithReact.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
    const hook: any = {
      renderers: new Map(),
      supportsFiber: true,
      inject: () => {},
      onCommitFiberRoot: () => {},
      onCommitFiberUnmount: () => {},
      checkDCE: () => false,
      onScheduleRoot: () => {},
      setStrictMode: () => {},
      getFiberRoots: () => new Set(),
    };
    
    // Define ReactCurrentOwner as a non-writable, protected property
    Object.defineProperty(hook, 'ReactCurrentOwner', {
      value: { current: null },
      writable: false,
      configurable: false,
      enumerable: true
    });
    
    windowWithReact.__REACT_DEVTOOLS_GLOBAL_HOOK__ = hook;
    console.log('🔥 EMERGENCY: React devtools hook created immediately');
  } else {
    // Hook exists, ensure ReactCurrentOwner is protected
    const existingHook = windowWithReact.__REACT_DEVTOOLS_GLOBAL_HOOK__;
    if (!existingHook.ReactCurrentOwner) {
      Object.defineProperty(existingHook, 'ReactCurrentOwner', {
        value: { current: null },
        writable: false,
        configurable: false,
        enumerable: true
      });
      console.log('🔥 EMERGENCY: Added ReactCurrentOwner to existing hook');
    }
  }
  
  // Emergency Object.defineProperty override - use any to avoid TypeScript signature issues
  const originalDefineProperty = Object.defineProperty;
  (Object as any).defineProperty = function(
    obj: any, 
    prop: any, 
    descriptor: any
  ): any {
    if (typeof prop === 'string' && prop === 'ReactCurrentOwner') {
      console.log('🔥 EMERGENCY BLOCKING ReactCurrentOwner access');
      return originalDefineProperty.call(this, obj, prop, {
        ...descriptor,
        value: { current: null },
        writable: false,
        configurable: false,
        enumerable: false
      });
    }
    return originalDefineProperty.call(this, obj, prop, descriptor);
  };
  
  console.log('🔥 EMERGENCY PATCH APPLIED');
}

// Apply patch IMMEDIATELY at module load time
if (typeof window !== 'undefined') {
  console.log('🔧 Applying Zoom SDK compatibility patch IMMEDIATELY...');
  
  // Type assertion for window object
  const windowWithReact = window as any;
  
  // Create a comprehensive React devtools hook
  const reactDevToolsHook = {
    ReactCurrentOwner: { current: null },
    renderers: new Map(),
    supportsFiber: true,
    inject: () => {},
    onCommitFiberRoot: () => {},
    onCommitFiberUnmount: () => {},
    checkDCE: () => false,
    onScheduleRoot: () => {},
    setStrictMode: () => {},
    getFiberRoots: () => new Set(),
  };
  
  // Set up the hook IMMEDIATELY - before anything else
  if (!windowWithReact.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
    windowWithReact.__REACT_DEVTOOLS_GLOBAL_HOOK__ = reactDevToolsHook;
    console.log('✅ React devtools hook created');
  }
  
  // Override Object.defineProperty IMMEDIATELY - most aggressive approach
  const originalDefineProperty = Object.defineProperty;
  (Object as any).defineProperty = function(
    obj: any, 
    prop: any, 
    descriptor: any
  ): any {
    // Ensure prop is a string before calling string methods
    if (typeof prop !== 'string') {
      return originalDefineProperty.call(this, obj, prop, descriptor);
    }
    
    // BLOCK ReactCurrentOwner access - NO EXCEPTIONS
    if (prop === 'ReactCurrentOwner') {
      console.log('🛡️ BLOCKING Zoom SDK access to ReactCurrentOwner');
      return originalDefineProperty.call(this, obj, prop, {
        ...descriptor,
        value: { current: null },
        writable: false,
        configurable: false,
        enumerable: false
      });
    }
    

    return originalDefineProperty.call(this, obj, prop, descriptor);
  };
  
  // Also override Object.defineProperties for additional protection
  const originalDefineProperties = Object.defineProperties;
  (Object as any).defineProperties = function(
    obj: any, 
    props: any
  ): any {
    const newProps: any = {};
    for (const prop in props) {
      if (typeof prop === 'string' && prop === 'ReactCurrentOwner') {
        console.log(`🛡️ BLOCKING defineProperties for: ${prop}`);
        // Skip React properties or make them safe
        newProps[prop] = {
          ...props[prop],
          value: { current: null },
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
  EventTarget.prototype.dispatchEvent = function(event: Event): boolean {
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
      console.warn('⚠️ Zoom SDK dispatchEvent error suppressed:', error);
      return true;
    }
  };
  
  // Additional safety: Protect React devtools hook without redefining
  const existingHook = (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__;
  let currentHook = existingHook || reactDevToolsHook;
  
  if (existingHook) {
    // Hook already exists, just ensure ReactCurrentOwner is safe
    if (existingHook.ReactCurrentOwner) {
      try {
        Object.defineProperty(existingHook, 'ReactCurrentOwner', {
          value: { current: null },
          writable: false,
          configurable: false
        });
      } catch (e) {
        // ReactCurrentOwner might already be protected, that's fine
        console.log('ℹ️ ReactCurrentOwner already protected');
      }
    }
  }
  
  // Protect the hook from future overrides
  try {
    Object.defineProperty(window, '__REACT_DEVTOOLS_GLOBAL_HOOK__', {
      get: () => currentHook,
      set: (value) => {
        if (value && value.ReactCurrentOwner) {
          console.log('🛡️ Preventing override of React devtools hook');
          return; // Don't allow override
        }
        currentHook = value;
      },
      configurable: false, // Make it non-configurable
      enumerable: false
    });
  } catch (error) {
    // Property already defined, that's okay
    console.log('ℹ️ React devtools hook already protected');
  }
  
  console.log('✅ Zoom SDK compatibility patch applied SUCCESSFULLY');
} else {
  console.log('⚠️ Not in browser environment, skipping patch');
}

export const applyZoomCompatibilityPatch = () => {
  console.log('🔄 applyZoomCompatibilityPatch called (patch already applied at module load)');
};
