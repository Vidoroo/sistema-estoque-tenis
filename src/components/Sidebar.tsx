import { NavLink } from 'react-router-dom';

const sidebarStyle: React.CSSProperties = {
  width: '250px',
  backgroundColor: '#071633',
  color: '#fff',
  padding: '24px 16px',
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
};

const logoStyle: React.CSSProperties = {
  fontSize: '28px',
  fontWeight: 800,
  marginBottom: '20px',
};

const linkBaseStyle: React.CSSProperties = {
  color: '#fff',
  textDecoration: 'none',
  padding: '12px 14px',
  borderRadius: '8px',
  fontWeight: 600,
};

export default function Sidebar() {
  const menuItems = [
    { path: '/', label: 'Dashboard' },
    { path: '/produtos', label: 'Produtos' },
    { path: '/cadastro-produto', label: 'Cadastrar Produto' },
    { path: '/estoque', label: 'Estoque' },
    { path: '/clientes', label: 'Clientes' },
    { path: '/vendedores', label: 'Vendedores' },
    { path: '/pedidos', label: 'Pedidos' },
    { path: '/vendas', label: 'Vendas' },
    { path: '/comissoes', label: 'Comissões' },
    { path: '/metas', label: 'Metas' },
    { path: '/devolucoes', label: 'Devoluções' },
    { path: '/fluxo-caixa', label: 'Fluxo de Caixa' },
  ];

  return (
    <aside style={sidebarStyle}>
      <div style={logoStyle}>React Estoque</div>

      {menuItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          style={({ isActive }) => ({
            ...linkBaseStyle,
            backgroundColor: isActive ? '#1d4ed8' : 'transparent',
          })}
        >
          {item.label}
        </NavLink>
      ))}
    </aside>
  );
}