```markdown
# Kikai
A lightweight, type-safe state machine library with intuitive syntax, minimal boilerplate, and a tiny footprint.
This is a brand new project, so please feel free to offer suggestions and feedback! Far less complex than XState,
but just as powerful.

## Installation

```bash
npm install kikai
```

## Basic Usage

```typescript
import $ from 'state-machine'

// Define states and transitions
// $ is a proxy that will create your state when you create a new property
// `On` and `Off` are state functions that utilize the ability to in javascript
// to coerce a an object or a function to a primitive type via `Symbol.toPrimitive`
// (also toString, valueOf, and toJSON).
// `allows` is where you define the valid transitions for a state. You simply
// use the bitwise OR ( | ) operator to define the valid transitions for a state,
// similar to how you define a union type in typescript.

// Define allowed transitions - no need to define the states ahead of time
// They are defined as you use them
$.state1.allows = $.state2 | $.state3
$.state2.allows = $.state1 | $.state3
// $.state3 doesn't transition to anything, so no need to define it

// Circular transitions are allowed
$.On.allows = $.Off
$.Off.allows = $.On

// Use states
$.Off()  // Start in Off state
$.On()   // Transition to On state
$.Off()  // Transition back to Off
```

## States with Data and Events
```typescript
// Define state with data and event handlers
$.Form({
  initial: {
    values: {},
    touched: new Set<string>()
  },
  validate: (data) => {
    // Validate data shape
    return true
  },
  on: {
    submit: (data, payload) => {
      // Handle submit event
      return $.Loading(data)
    },
    change: (data, payload) => {
      // Update form data
      return {
        ...data,
        values: { ...data.values, [payload.field]: payload.value },
        touched: new Set([...data.touched, payload.field])
      }
    }
  }
})

// Fire events
$.Form.fire('change', { field: 'email', value: 'test@example.com' })
```

## Complex State Flows

```typescript
// Define allowed transitions
$.Idle.allows = $.Loading | $.Error
$.Loading.allows = $.Success | $.Error
$.Error.allows = $.Idle
$.Success.allows = $.Idle

// State with validation
const LoadingState = $.Loading({
  initial: { progress: 0 },
  validate: (data) => data.progress >= 0 && data.progress <= 100,
  on: {
    progress: (data, amount) => ({
      ...data,
      progress: amount
    })
  }
})

// Use states
$.Idle()
LoadingState()
LoadingState.fire('progress', 50)
```

## Features

- Type-safe state definitions and transitions
- Efficient bitwise operations for state management
- Event handling with data validation
- Simple API with minimal boilerplate
- TypeScript support
- Small bundle size

## API

### State Creation
- `$.[StateName]` - Create a simple state
- `$.[StateName]({...config})` - Create configured state

### State Configuration
```typescript
interface StateConfig<TData> {
  initial?: TData             // Initial state data
  validate?: (data) => boolean  // Data validation
  on?: {                      // Event handlers
    [eventName: string]: (data, payload) => TData | StateFunction
  }
}
```

### State Functions
- `allows` - Define valid transitions
- `fire(eventName, payload?)` - Trigger event
- `getData()` - Get current state data
- `set(prop, value)` - Update state data

## License
MIT

## Future Plans
- Add optional "machine" import that will combine multiple state machines together as one
- Visualize state machines
- Debug helpers
