import { useNavigate } from 'react-router-dom'
import './App.css'
import BottomNav from "./components/BottomNav";

function App() {
  const navigate = useNavigate()

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      gap: '20px'
    }}>
      <h1>SuzuList</h1>

      <button onClick={() => navigate('/lister')}
        style={{
          padding: '15px 25px',
          fontSize: '18px',
          borderRadius: '10px',
          cursor: 'pointer'
        }}>
        I am the Lister
      </button>

      <button onClick={() => navigate('/shopper')}
        style={{
          padding: '15px 25px',
          fontSize: '18px',
          borderRadius: '10px',
          cursor: 'pointer'
        }}>
        I am the Shopper
      </button>
      <BottomNav />
    </div>
  )
}

export default App
