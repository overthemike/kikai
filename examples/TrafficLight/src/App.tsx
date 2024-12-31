import React from 'react'
import { proxy, useSnapshot } from 'valtio'
import { $ } from 'kikai'
// import { valtioHandler } from 'kikai'

type TrafficLightState = {
  color: 'red' | 'yellow' | 'green'
  timeInState: number
}
// Our state machine
const store = proxy<TrafficLightState>({
  color: 'red',
  timeInState: 0
})

const managedStore = $(store)
const green = $.green({
  allows: yellow,
  on: {
    enter: () => {
      managedStore.color = 'green'
    }
  }
})

const red = $.red({
  allows: yellow,
  validate: (state: TrafficLightState) => state.color === 'red',
  on: {
    enter: () => {
      managedStore.color = 'red'
    }
  }
})

const yellow = $.yellow({
  allows: red,
  validate: (state: TrafficLightState) => state.color === 'yellow',
  on: {
    enter: () => {
      managedStore.color = 'yellow'
    }
  }
})

// red.allows = yellow
// yellow.allows = green
// green.allows = red

// red.validate = (state: TrafficLightState) => state.color === 'red'
// yellow.validate = (state: TrafficLightState) => state.color === 'yellow'
// green.validate = (state: TrafficLightState) => state.color === 'green'

// $.red.on('enter', () => {
//   managedStore.color = 'red'
// })

// $.yellow.on('enter', () => {
//   managedStore.color = 'yellow'
// })

// $.green.on('enter', () => {
//   managedStore.color = 'green'
// })

// Create the component
export default function TrafficLight() {
  const snap = useSnapshot(store)

  React.useEffect(() => {
    // Set up automatic transitions
    const interval = setInterval(() => {
      if (snap.color === 'red') {
        $.yellow()
      } else if (snap.color === 'yellow') {
        $.green()
      } else if (snap.color === 'green') {
        $.red()
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
