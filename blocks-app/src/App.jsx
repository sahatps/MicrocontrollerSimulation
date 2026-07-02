import { useState } from 'react'
import './App.css'
import BlocklyArea from './blockly/BlocklyArea'
import Toolbar from './components/toolbar/Toolbar'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      {/* <Toolbar /> */}
      <BlocklyArea />
    </>
  )
}

export default App
