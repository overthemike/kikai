import React from 'react'
import { create } from 'zustand'
import { $, zustandHandler } from 'kikai'
$.configure({ stateHandler: zustandHandler })

type TrafficLightState = {
  color: 'red' | 'yellow' | 'green'
  timeInState: number
  setColor: (color: 'red' | 'yellow' | 'green') => void
}

const useStore = create<TrafficLightState>((set) => ({
  color: 'red',
  timeInState: 0,
  setColor: (color) => set({ color })
}))

// Our state machine setup
const managedStore = {
  get color() {
    return useStore.getState().color
  },
  set color(value: 'red' | 'yellow' | 'green') {
    useStore.getState().setColor(value)
  }
}

const green = $.green({
  allows: $.red,
  on: {
    enter: () => {
      managedStore.color = 'green'
    }
  }
})

const red = $.red({
  allows: $.yellow,
  validate: (state: TrafficLightState) => state.color === 'red',
  on: {
    enter: () => {
      managedStore.color = 'red'
    }
  }
})

const yellow = $.yellow({
  allows: $.green,
  validate: (state: TrafficLightState) => state.color === 'yellow',
  on: {
    enter: () => {
      managedStore.color = 'yellow'
    }
  }
})

export default function TrafficLight() {
  const color = useStore((state) => state.color)

  React.useEffect(() => {
    const interval = setInterval(() => {
      if (color === 'red') {
        yellow()
      } else if (color === 'yellow') {
        green()
      } else if (color === 'green') {
        red()
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [color])

  return (
    <div className='flex flex-col items-center p-4 bg-gray-800 rounded-lg space-y-4'>
      <div
        className={`w-16 h-16 rounded-full ${
          color === 'red' ? 'bg-red-500' : 'bg-red-900'
        }`}
      />
      <div
        className={`w-16 h-16 rounded-full ${
          color === 'yellow' ? 'bg-yellow-500' : 'bg-yellow-900'
        }`}
      />
      <div
        className={`w-16 h-16 rounded-full ${
          color === 'green' ? 'bg-green-500' : 'bg-green-900'
        }`}
      />
      <div className='text-white'>Current State: {color}</div>
    </div>
  )
}
