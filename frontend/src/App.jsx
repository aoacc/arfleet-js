import { useState } from 'react'
import './App.css'

import Header from './components/Header'
import Sidebar from './components/Sidebar'
import Content from './components/Content'

function App() {
  // const []

  return (
    <div className="app-container">
      <Header />
      <div className="main-container">
        <Sidebar />
        <Content />
      </div>
    </div>
  )
}

export default App