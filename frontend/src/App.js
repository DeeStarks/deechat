import './App.css';
import { Route, Routes } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import ChatView from './views/ChatView';
import { UserProvider } from './contexts/UserContext';
import HomeView from './views/HomeView';
import { ChatProvider } from './contexts/ChatContext';

function App() {
  return (
    <div className="App">
      <UserProvider>
        <ChatProvider>
          <Routes>
            <Route path="/" element={<MainLayout>
              <HomeView />
            </MainLayout>} />
            <Route path="/chat/:receiver" element={<MainLayout>
              <ChatView />
            </MainLayout>} />
          </Routes>
        </ChatProvider>
      </UserProvider>
    </div>
  );
}

export default App;
