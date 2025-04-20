import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { Button } from "@/components/ui/button"
import NotesApp from './components/Notes'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
   <NotesApp/>

    
    </>
  )
}

export default App
