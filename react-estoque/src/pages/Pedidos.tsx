const cardStyle: React.CSSProperties = {
  backgroundColor: "#ffffff",
  borderRadius: "12px",
  padding: "24px",
  boxShadow: "0 2px 10px rgba(0, 0, 0, 0.08)",
};

const titleStyle: React.CSSProperties = {
  fontSize: "2.2rem",
  fontWeight: 800,
  color: "#071633",
  marginBottom: "8px",
};

const textStyle: React.CSSProperties = {
  color: "#6b7280",
  marginBottom: "24px",
};

const gridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "20px",
  marginBottom: "24px",
};

const summaryCardStyle: React.CSSProperties = {
  backgroundColor: "#ffffff",
  borderRadius: "12px",
  padding: "20px",
  boxShadow: "0 2px 10px rgba(0, 0, 0, 0.08)",
};

export default function Pedidos() {
  return (
    <div>
      <h1 style={titleStyle}>Pedidos</h1>
      <p style={textStyle}>Controle e acompanhamento dos pedidos realizados.</p>

      <div style={gridStyle}>
        <div style={summaryCardStyle}>
          <h3>Total de Pedidos</h3>
          <h2>0</h2>
        </div>

        <div style={summaryCardStyle}>
          <h3>Pedidos Pendentes</h3>
          <h2>0</h2>
        </div>

        <div style={summaryCardStyle}>
          <h3>Valor Total</h3>
          <h2>R$ 0,00</h2>
        </div>
      </div>

      <div style={cardStyle}>
        <h2 style={{ marginTop: 0, color: "#071633" }}>Lista de Pedidos</h2>
        <p style={{ color: "#6b7280" }}>
          Aqui ficará a tabela de pedidos com status, cliente, vendedor e valor.
        </p>
      </div>
    </div>
  );
}