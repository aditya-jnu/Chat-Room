import InputBox from './components/InputBox'
import Chat from './components/Chat'
import { Route, Routes  } from 'react-router-dom'

function App() {
  return (
    <Routes>
      <Route path="/" element={<InputBox/>}/>
      <Route path="/room/:code" element={<Chat />} />
    </Routes>
  )
}

export default App
