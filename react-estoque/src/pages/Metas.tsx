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

export default function Metas() {
  return (
    <div>
      <h1 style={titleStyle}>Metas</h1>
      <p style={textStyle}>Acompanhamento das metas comerciais dos vendedores.</p>

      <div style={gridStyle}>
        <div style={summaryCardStyle}>
          <h3>Total de Metas</h3>
          <h2>0</h2>
        </div>

        <div style={summaryCardStyle}>
          <h3>Metas Atingidas</h3>
          <h2>0</h2>
        </div>

        <div style={summaryCardStyle}>
          <h3>Percentual Médio</h3>
          <h2>0%</h2>
        </div>
      </div>

      <div style={cardStyle}>
        <h2 style={{ marginTop: 0, color: "#071633" }}>Lista de Metas</h2>
        <p style={{ color: "#6b7280" }}>
          Aqui ficará a tabela de metas com vendedor, período, valor da meta e percentual atingido.
        </p>
      </div>
    </div>
  );
}