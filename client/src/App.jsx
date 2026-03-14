import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Join from './pages/Join';
import HostLobby from './pages/HostLobby';
import HostGame from './pages/HostGame';
import PlayerGame from './pages/PlayerGame';
import CreateGame from './pages/CreateGame';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col items-center">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/join" element={<Join />} />
          <Route path="/host/create" element={<CreateGame />} />
          <Route path="/host/lobby" element={<HostLobby />} />
          <Route path="/host/game/:pin" element={<HostGame />} />
          <Route path="/player/game/:pin" element={<PlayerGame />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
