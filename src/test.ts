import $ from 'core/state'

// Define possible states and their allowed transitions
$.On.allows = $.Off
$.Off.allows = $.On

// Try some transitions
try {
  // Start in Off state
  $.Off()
  console.log('Started in Off state')

  // Transition to On
  $.On()
  console.log('Switched to On state')

  // Try valid transition back to Off
  $.Off()
  console.log('Switched back to Off state')

  // Try invalid transition (should throw error)
  // $.Loading()
  // console.log('Should not reach here')
} catch ({ message }: any) {
  console.error(`Error: ${message}`)
}
