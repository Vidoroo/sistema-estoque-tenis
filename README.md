# 📦 React Estoque

Sistema completo de controle de estoque com autenticação de usuários, desenvolvido com **React (frontend)** e **Flask + MySQL (backend)**.

---

##  Funcionalidades

###  Autenticação

* Cadastro de usuário
* Login com validação
* Bloqueio após 3 tentativas inválidas
* Logout
* Rotas protegidas (PrivateRoute)

###  Produtos

* Listar produtos
* Cadastrar produtos
* Editar produtos
* Excluir produtos

###  Estoque

* Visualização de itens cadastrados
* Controle básico de quantidade

---

##  Tecnologias utilizadas

### Frontend

* React
* TypeScript
* React Router
* Fetch API

### Backend

* Python
* Flask
* SQLAlchemy
* MySQL

---

##  Estrutura do projeto

```
react-estoque/
├── backend/
│   ├── app/
│   ├── config.py
│   ├── run.py
│   ├── requirements.txt
│   └── .env.example
│
├── src/
│   ├── components/
│   ├── pages/
│   ├── services/
│   └── App.tsx
│
├── public/
├── .gitignore
└── README.md
```

---

##  Como rodar o projeto

###  Backend (Flask)

1. Acesse a pasta:

```bash
cd backend
```

2. Crie o ambiente virtual:

```bash
python -m venv venv
```

3. Ative o ambiente:

Windows:

```bash
venv\Scripts\activate
```

4. Instale as dependências:

```bash
pip install -r requirements.txt
```

5. Configure o `.env` baseado no `.env.example`

Exemplo:

```
DB_USER=root
DB_PASSWORD=sua_senha
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=estoque_db
```

6. Crie o banco de dados no MySQL:

```sql
CREATE DATABASE estoque_db;
```

7. Execute o servidor:

```bash
python run.py
```

Backend rodará em:

```
http://127.0.0.1:5000
```

---

###  Frontend (React)

1. Acesse a raiz do projeto:

```bash
cd react-estoque
```

2. Instale as dependências:

```bash
npm install
```

3. Execute o projeto:

```bash
npm run dev
```

Frontend rodará em:

```
http://localhost:5173
```

---

##  Integração API

A comunicação entre frontend e backend é feita via:

```
http://127.0.0.1:5000/api/products/
```

---

##  Segurança

* Senhas criptografadas com bcrypt
* Bloqueio de login após múltiplas tentativas
* Controle de sessão via localStorage

---



