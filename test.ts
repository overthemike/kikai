import $, { state } from './src/core/state'
import { inspect } from 'node:util'

// $.On({
//   initial: { foo: 'bar' },
//   on: {
//     flip: (data) => {
//       console.log('Flipped', data)
//       return data
//     }
//   }
// })

// // Define possible states and their allowed transitions
// $.On.allows = $.Off | $.Foo
// $.Foo.allows = $.Off | $.On
// $.Off.allows = $.On

const On = state({
  initial: { foo: 'bar' }
})
const Off = state()

On.allows = Off
Off.allows = Off

try {
  console.log(On.getData())
  Off({ foo: 'bat' })
  console.log(On.getData())

  console.log('Started in Off state')
  On({ foo: 'cat' })
  console.log(On.getData())
  console.log('Switched to On state')
  Off({ foo: 'dat' })
  console.log(On.getData())
  console.log('Switched back to Off state')
} catch (err) {
  console.error(`Error: ${err.message}`)
}

// console.log($.Off | $.Foo, $.On.allows)
// // Try some transitions
// try {
//   // Start in Off state
//   $.Off()
//   console.log('Started in Off state')

//   // Transition to On
//   $.On()
//   console.log('Switched to On state')
//   $.On.fire('flip', 'bar')

//   console.log('data', inspect($.On))

//   $.Foo()
//   console.log('Switched to Foo state')

//   $.On()
//   console.log('Switched to On state')

//   // Try valid transition back to Off
//   $.Off()
//   console.log('Switched back to Off state')

//   // Try invalid transition (should throw error)
//   // $.Loading()
//   // console.log('Should not reach here')
//   // biome-ignore lint/suspicious/noExplicitAny: <explanation>
// } catch ({ message }: any) {
//   console.error(`Error: ${message}`)
// }
