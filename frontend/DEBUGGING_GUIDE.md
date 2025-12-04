# React Frontend Debugging Guide

This guide covers various debugging techniques for your React application.

## Table of Contents
1. [Browser DevTools](#browser-devtools)
2. [React DevTools](#react-devtools)
3. [VS Code Debugging](#vs-code-debugging)
4. [Console Debugging](#console-debugging)
5. [Network Debugging](#network-debugging)
6. [State Debugging](#state-debugging)
7. [Error Boundaries](#error-boundaries)
8. [Performance Debugging](#performance-debugging)

---

## Browser DevTools

### Chrome/Edge DevTools
1. **Open DevTools**: Press `F12` or `Ctrl+Shift+I` (Windows) / `Cmd+Option+I` (Mac)
2. **Console Tab**: View logs, errors, and run JavaScript commands
3. **Sources Tab**: Set breakpoints, step through code, inspect variables
4. **Network Tab**: Monitor API calls, check request/response data
5. **Application Tab**: Inspect localStorage, sessionStorage, cookies
6. **React Components Tab**: (Requires React DevTools extension)

### Quick Tips
- Use `console.log()`, `console.error()`, `console.warn()` for logging
- Use `debugger;` statement to pause execution
- Right-click → "Inspect Element" to jump to component in DevTools

---

## React DevTools

### Installation
Install the React DevTools browser extension:
- **Chrome/Edge**: [Chrome Web Store](https://chrome.google.com/webstore/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi)
- **Firefox**: [Firefox Add-ons](https://addons.mozilla.org/en-US/firefox/addon/react-devtools/)

### Usage
1. Open DevTools (`F12`)
2. Look for **"Components"** and **"Profiler"** tabs
3. **Components Tab**: 
   - Inspect component tree
   - View props and state
   - Edit props/state in real-time
   - See component render times
4. **Profiler Tab**:
   - Record performance
   - Identify slow components
   - Analyze re-renders

### Example: Inspecting TaskListPage
```typescript
// In TaskListPage.tsx, you can add:
console.log('TaskListPage render', { tasks, filters, loading });
```

---

## VS Code Debugging

### Setup
Your `.vscode/launch.json` already includes React debugging configurations.

### How to Use
1. **Start the dev server**: Run `npm start` in the `frontend` directory
2. **Set breakpoints**: Click in the gutter (left of line numbers) in VS Code
3. **Start debugging**: 
   - Press `F5` or click the Debug icon
   - Select "Debug React App (Chrome)"
4. **Debug controls**:
   - `F5`: Continue
   - `F10`: Step over
   - `F11`: Step into
   - `Shift+F11`: Step out
   - `Shift+F5`: Stop debugging

### Debugging Tips
- Set breakpoints in your service files (e.g., `taskService.ts`)
- Inspect variables in the Variables panel
- Use the Debug Console to evaluate expressions
- Check the Call Stack to see the execution path

### Example: Debugging API Calls
```typescript
// In taskService.ts, set a breakpoint on line 101
const response = await api.get<PageResponse<Task>>(url, {
    params
});
// When paused, inspect: url, params, response
```

---

## Console Debugging

### Basic Logging
```typescript
// Simple logging
console.log('Value:', value);

// Multiple values
console.log('State:', state, 'Props:', props);

// Formatted logging
console.log('%cStyled message', 'color: blue; font-weight: bold');

// Table view for arrays/objects
console.table(tasks);

// Grouped logs
console.group('API Call');
console.log('URL:', url);
console.log('Params:', params);
console.groupEnd();
```

### Advanced Console Methods
```typescript
// Count occurrences
console.count('API Call');

// Time operations
console.time('fetchTasks');
await taskService.getTasks();
console.timeEnd('fetchTasks');

// Assertions
console.assert(condition, 'Error message if false');

// Stack trace
console.trace('Current call stack');
```

### Example from Your Code
You're already using console.log in `taskService.ts`:
```typescript
console.log('taskService.getTasks - projectId:', projectId, ...);
console.log('taskService.getTasks - Final URL:', url, 'params:', params);
```

---

## Network Debugging

### Using Browser DevTools Network Tab
1. Open DevTools → Network tab
2. Filter by XHR/Fetch to see API calls
3. Click on a request to see:
   - Request headers, body, query params
   - Response headers, body, status
   - Timing information

### Adding Request/Response Logging
You can enhance your `api.ts` interceptor:

```typescript
// In api.ts, add logging to interceptors
api.interceptors.request.use(
  (config) => {
    console.log('🚀 Request:', {
      method: config.method?.toUpperCase(),
      url: config.url,
      baseURL: config.baseURL,
      params: config.params,
      data: config.data
    });
    // ... existing code
  }
);

api.interceptors.response.use(
  (response) => {
    console.log('✅ Response:', {
      status: response.status,
      url: response.config.url,
      data: response.data
    });
    return response;
  },
  (error) => {
    console.error('❌ Error:', {
      status: error.response?.status,
      url: error.config?.url,
      message: error.message,
      data: error.response?.data
    });
    // ... existing error handling
  }
);
```

---

## State Debugging

### Using React DevTools
- Inspect component state in the Components tab
- Edit state values to test different scenarios
- See state changes in real-time

### Adding State Logging
```typescript
// In your components, use useEffect to log state changes
useEffect(() => {
  console.log('State changed:', state);
}, [state]);

// Or use a custom hook
function useDebugState(name: string, value: any) {
  useEffect(() => {
    console.log(`${name} changed:`, value);
  }, [name, value]);
}

// Usage
useDebugState('tasks', tasks);
```

### Redux DevTools (if using Redux)
If you add Redux later, install Redux DevTools extension for time-travel debugging.

---

## Error Boundaries

### Creating an Error Boundary
Create `src/components/ErrorBoundary.tsx`:

```typescript
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div>
          <h2>Something went wrong.</h2>
          <details>
            <summary>Error details</summary>
            <pre>{this.state.error?.stack}</pre>
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
```

### Using Error Boundary
Wrap your app or specific components:
```typescript
<ErrorBoundary>
  <TaskListPage />
</ErrorBoundary>
```

---

## Performance Debugging

### React Profiler
1. Install React DevTools
2. Open Profiler tab
3. Click record (circle icon)
4. Interact with your app
5. Stop recording
6. Analyze:
   - Component render times
   - Re-render frequency
   - Commit details

### Performance API
```typescript
// Measure component render time
const startTime = performance.now();
// ... component logic
const endTime = performance.now();
console.log(`Component rendered in ${endTime - startTime}ms`);
```

### Identifying Performance Issues
- Look for unnecessary re-renders
- Use `React.memo()` for expensive components
- Use `useMemo()` and `useCallback()` hooks
- Check Network tab for slow API calls

---

## Common Debugging Scenarios

### 1. API Call Not Working
```typescript
// Check in Network tab:
// - Is the request being sent?
// - What's the response status?
// - Are headers correct (Authorization)?
// - Is the URL correct?

// Add logging:
console.log('Making API call:', url, params);
try {
  const response = await api.get(url, { params });
  console.log('API response:', response.data);
} catch (error) {
  console.error('API error:', error.response?.data || error.message);
}
```

### 2. State Not Updating
```typescript
// Check:
// - Is setState being called?
// - Are dependencies correct in useEffect?
// - Is state being mutated directly?

// Add logging:
useEffect(() => {
  console.log('State update:', state);
}, [state]);
```

### 3. Component Not Rendering
```typescript
// Check:
// - Are props being passed correctly?
// - Is there a conditional render blocking it?
// - Check React DevTools Components tab

// Add logging:
console.log('Component render', { props, state });
```

### 4. Routing Issues
```typescript
// Check:
// - Is the route defined correctly?
// - Are you using the correct path?
// - Check browser console for router errors

// Add logging in your route components:
useEffect(() => {
  console.log('Route mounted:', window.location.pathname);
}, []);
```

---

## Quick Reference

### Keyboard Shortcuts
- `F12`: Open DevTools
- `Ctrl+Shift+C`: Inspect Element
- `Ctrl+Shift+J`: Open Console
- `Ctrl+Shift+E`: Open Network tab
- `F5`: Refresh page
- `Ctrl+R`: Hard refresh

### Useful Console Commands
```javascript
// In browser console:
$0  // Reference to selected element
$1, $2, etc.  // Previous element references
$_  // Last evaluated expression
clear()  // Clear console
copy(object)  // Copy object to clipboard
```

### VS Code Debugging Shortcuts
- `F5`: Start/Continue debugging
- `F9`: Toggle breakpoint
- `F10`: Step over
- `F11`: Step into
- `Shift+F11`: Step out
- `Shift+F5`: Stop debugging

---

## Best Practices

1. **Remove console.logs before production** (or use a logger that strips them)
2. **Use meaningful log messages** with context
3. **Set breakpoints strategically** at key decision points
4. **Use React DevTools** for component debugging
5. **Monitor Network tab** for API issues
6. **Use Error Boundaries** to catch and handle errors gracefully
7. **Profile performance** before optimizing (measure first!)

---

## Additional Resources

- [React DevTools Documentation](https://react.dev/learn/react-developer-tools)
- [Chrome DevTools Guide](https://developer.chrome.com/docs/devtools/)
- [VS Code Debugging Guide](https://code.visualstudio.com/docs/nodejs/nodejs-debugging)
- [React Performance Optimization](https://react.dev/learn/render-and-commit)

