# Kikai
A lightweight and type-safe finite state machine library with intuitive syntax, minimal boilerplate, and a tiny footprint.
This is a brand new project, so please feel free to offer suggestions and feedback! Far less complex than XState,
but just as powerful.

## Installation
```bash
npm install kikai
```
## Why Kikai?

The most popular state machine library out there is [XState](https://xstate.js.org/). While it is a great library, it is also quite large, has a steep learning curve, and it requires a lot of boilerplate to get started. Everything is done by configuration, which gets unwieldy quickly. Kikai is designed to be as simple as possible, with a minimal API and minimal boilerplate.

Kikai works by utilizing the ability to coerce an object or a function to a primitive type via `Symbol.toPrimitive` (also toString, valueOf, and toJSON), paired with old fashioned bitwise operations (primarily the `|` operator). There is no need to udnerstand how bitwise operations work, so don't let that scare yo off. The syntax is something you're already used to if you use typescript.

Kikai also attempts to get rid of unnecessary bloat such as `actors` and `guards` by simply letting you use regular functions to define your states and transitions. This makes it easier to reason about your code and makes it more intuitive.

## Basic Usage
```typescript
import { state } from 'kikai'

// Traffic light
const Red = state() // you don't have to pass any configuration if it isn't needed
const FlashingYellow = state()
const Yellow = state()
const Green = state()

// Define each state's allowed transitions by using the `allows` or `to` property along with the bitwise OR operator

// The "Red" state allows transitioning into either the "FlashingYellow" or "Green" states.
Red.allows = FlashingYellow | Green
// The "FlashingYellow" state allows transitioning into either the "Red" or "Yellow" states.
FlassingYellow.allows = Red | Yellow
// The "Yellow" state only allows transitioning into the "Red" state.
Yellow.allows = Red
// The "Green" state allows transitioning into either the "Yellow" or "FlashingYellow" states.
Green.allows = Yellow | FlashingYellow

// Initial State Transition
Red()

// transition to Green
Green()

// transition to Yellow
Yellow()

// transition to a non-allowed state throws an error
Green() // Error: Invalid transition from Green to FlashingYellow

```
The above is the most basic example of transitioning between states. States are simply functions.


## $ shorthand

When your application requires a lot of different states, it can be cumbersome and repetetive to define a new variable for each one. `$` attempts to simplify this by allowing you to define your states simply by adding a new property to the `$` object. It will automatically create a state function for you as soon as you access that property. `$` is simply a proxy with a `get` trap that will create a state function when you access a property that doesn't exist, or return the existing state function if it does.

Same example from above, but using the `$` shorthand:
```typescript
import $ from 'kikai'

$.Red.allows = $.FlashingYellow | $.Green
$.FlashingYellow.allows = $.Red | $.Yellow
$.Yellow.allows = $.Red
$.Green.allows = $.Yellow | $.FlashingYellow

$.Red()
$.Green()
$.Yellow()
$.Green() // Error: Invalid transition from Green to FlashingYellow
```

## States with Data and Events

Each state function has data and events associated with it if you want it to. You can optionally pass in a configuration object when you create a state function.

```typescript
const Red = state({
  initial: { color: 'red' },
  validate: (data) => data.color === 'red',
  on: {
    change: (data, payload) => {
      return { ...data, color: payload.color }
    }
  }
})
// if `validate` is defined, it will be called on the data you pass in to your state function. You define your  own validation in the `validate` property of the configuration object.

// `fire` will trigger whatever event you pass in. You defined your own events in the `on` property of the configuration object.
Red.fire('change', { color: 'blue' })
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
- `const [StateName] = state()` - Create a simple state
- `$.[StateName]` - Create a simple state
- `const [StateName] = state({...config})` - Create a configured state
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
- `allows` or `to` - Define valid transitions
- `fire(eventName, payload?)` - Trigger event
- `getData()` - Get current state data
- `set(prop, value)` - Update state data

## What about Machines?
Machines are actually not necessary. State can handle themselves. However, there is a work in progress that will allow you to combine multiple state functions into an optional "machine" import that will combine multiple state functions together as one "machine".

## License
MIT

## Future Plans
- Add optional "machine" import that will combine multiple state machines together as one
- Visualize state machines
- Debug helpers
