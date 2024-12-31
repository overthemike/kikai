import React from 'react'
import { proxy, useSnapshot } from 'valtio'
import { $ } from '../../../src'

type TrafficLightState = {
  color: 'red' | 'yellow' | 'green'
  timeInState: number
}
// Our state machine
const store = proxy<TrafficLightState>({
  color: 'red',
  timeInState: 0
})

// Define states and transitions
$.red.allows = $.yellow
$.yellow.allows = $.green
$.green.allows = $.yellow

// Add validation
$.red.validate = (state: TrafficLightState) => state.color === 'red'
$.yellow.validate = (state: TrafficLightState) => state.color === 'yellow'
$.green.validate = (state: TrafficLightState) => state.color === 'green'

// Wrap store with our state machine
const managedStore = $(store)

// Create the component
export default function TrafficLight() {
  const snap = useSnapshot(store)

  React.useEffect(() => {
    // Set up automatic transitions
    const interval = setInterval(() => {
      if (snap.color === 'red') {
        managedStore.color = 'yellow'
        $.yellow()
      } else if (snap.color === 'yellow') {
        managedStore.color = snap.timeInState > 3000 ? 'red' : 'green'
        snap.timeInState > 3000 ? $.red() : $.green()
      } else if (snap.color === 'green') {
        managedStore.color = 'yellow'
        $.yellow()
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [snap])

  return (
    <div className='flex flex-col items-center p-4 bg-gray-800 rounded-lg space-y-4'>
      <div
        className={`w-16 h-16 rounded-full ${
          snap.color === 'red' ? 'bg-red-500' : 'bg-red-900'
        }`}
      />
      <div
        className={`w-16 h-16 rounded-full ${
          snap.color === 'yellow' ? 'bg-yellow-500' : 'bg-yellow-900'
        }`}
      />
      <div
        className={`w-16 h-16 rounded-full ${
          snap.color === 'green' ? 'bg-green-500' : 'bg-green-900'
        }`}
      />
      <div className='text-white'>Current State: {snap.color}</div>
    </div>
  )
}
