import React from 'react'
import { atom, useAtom } from 'jotai'
import { $, jotaiHandler } from 'kikai'
$.configure({ stateHandler: jotaiHandler })

type TrafficLightState = {
  color: 'red' | 'yellow' | 'green'
  timeInState: number
}

const colorAtom = atom<'red' | 'yellow' | 'green'>('red')
const timeInStateAtom = atom<number>(0)

// Our state machine setup
const managedStore = {
  get color() {
    return colorAtom.read()
  },
  set color(value: 'red' | 'yellow' | 'green') {
    colorAtom.write(value)
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
  const [color, setColor] = useAtom(colorAtom)
  const [, setTimeInState] = useAtom(timeInStateAtom)

  React.useEffect(() => {
    const interval = setInterval(() => {
      if (color === 'red') {
        yellow()
      } else if (color === 'yellow') {
        green()
      } else if (color === 'green') {
        red()
      }
      setTimeInState((prev) => prev + 1)
    }, 1000)

    return () => clearInterval(interval)
  }, [color, setTimeInState])

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
