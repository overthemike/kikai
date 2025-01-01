import Valtio from './Valtio'
import Jotai from './Jotai'
import Zustand from './Zustand'

export default function TrafficLight() {
  return (
    <div className='flex flex-col items-center p-4 bg-gray-800 rounded-lg space-y-4'>
      <h2 className='text-2xl'>Kikai Traffic Light - Valtio</h2>
      <Valtio />
      <h2 className='text-2xl'>Kikai Traffic Light - Jotai</h2>
      <Jotai />
      <h2 className='text-2xl'>Kikai Traffic Light - Zustand</h2>
      <Zustand />
    </div>
  )
}
