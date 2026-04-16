import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

const layoutStyle: React.CSSProperties = {
  display: 'flex',
  minHeight: '100vh',
  backgroundColor: '#f3f4f6',
};

const contentWrapperStyle: React.CSSProperties = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
};

const topbarStyle: React.CSSProperties = {
  height: '70px',
  backgroundColor: '#ffffff',
  borderBottom: '1px solid #e5e7eb',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '0 24px',
};

const mainStyle: React.CSSProperties = {
  flex: 1,
  padding: '24px',
};

export default function Layout() {
  const username = localStorage.getItem('username') || 'Usuário';

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    window.location.href = '/login';
  };
console.log("Home carregou");
  return (
    <div style={layoutStyle}>
      <Sidebar />

      <div style={contentWrapperStyle}>
        <header style={topbarStyle}>
          <h2 style={{ margin: 0, fontSize: '20px', color: '#111827' }}>
            Sistema de Estoque
          </h2>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ color: '#374151', fontWeight: 600 }}>
              {username}
            </span>

            <button
              onClick={handleLogout}
              style={{
                backgroundColor: '#ef4444',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                padding: '10px 16px',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              Sair
            </button>
          </div>
        </header>

        <main style={mainStyle}>
          <Outlet />
          
        </main>
      </div>
    </div>
  );
}