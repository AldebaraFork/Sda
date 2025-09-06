const express = require('express');
const multer = require('multer');
const path = require('path');
const { Pool } = require('pg');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;

// --- CONFIGURAÇÃO INICIAL ---
const app = express();
const PORT = process.env.PORT || 3000;

// --- CONFIGURAÇÃO DO CLOUDINARY (Nosso "Closet na Nuvem") ---
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// --- CONFIGURAÇÃO DO BANCO DE DADOS POSTGRESQL ---
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
  // ✨✨✨ A PEÇA FINAL QUE FALTAVA ✨✨✨
  // Força a conexão a usar o endereço antigo e confiável (IPv4)
  family: 4 
});

const criarTabela = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS fotos (
      id SERIAL PRIMARY KEY,
      titulo VARCHAR(255) NOT NULL,
      descricao TEXT,
      caminho TEXT NOT NULL,
      cloudinary_id TEXT NOT NULL,
      data_criacao TIMESTAMPTZ DEFAULT NOW()
    );
  `;
  try {
    await pool.query(query);
    console.log("Tabela 'fotos' verificada/criada com sucesso.");
  } catch (err) { console.error("Erro ao criar tabela:", err); }
};
criarTabela();

// --- MIDDLEWARES ---
app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- CONFIGURAÇÃO DO UPLOAD (DIRECIONADO PARA O CLOUDINARY) ---
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'galeria_casal',
    allowed_formats: ['jpg', 'jpeg', 'png']
  }
});
const upload = multer({ storage: storage });

// --- ROTAS DA NOSSA API ---

// ROTA POST: ENVIAR UMA NOVA FOTO
app.post('/upload', upload.single('foto'), async (req, res) => {
  const { titulo, descricao } = req.body;
  const caminho = req.file.path;
  const cloudinaryId = req.file.filename;

  const sql = `INSERT INTO fotos (titulo, descricao, caminho, cloudinary_id) VALUES ($1, $2, $3, $4) RETURNING *`;
  try {
    const result = await pool.query(sql, [titulo, descricao, caminho, cloudinaryId]);
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Erro ao salvar no banco de dados' });
  }
});

// ROTA GET: PEGAR TODAS AS FOTOS
app.get('/fotos', async (req, res) => {
  const sql = "SELECT * FROM fotos ORDER BY data_criacao DESC";
  try {
    const result = await pool.query(sql);
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Erro ao buscar fotos' });
  }
});

// ROTA DELETE: APAGAR UMA FOTO
app.delete('/fotos/:id', async (req, res) => {
  const id = req.params.id;
  try {
    const selectResult = await pool.query(`SELECT cloudinary_id FROM fotos WHERE id = $1`, [id]);
    if (selectResult.rows.length === 0) {
      return res.status(404).json({ error: "Foto não encontrada" });
    }
    const cloudinaryId = selectResult.rows[0].cloudinary_id;
    
    await cloudinary.uploader.destroy(cloudinaryId);
    
    await pool.query(`DELETE FROM fotos WHERE id = $1`, [id]);
    res.json({ message: 'Foto deletada com sucesso da galeria e da nuvem!' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Erro ao deletar foto' });
  }
});

// --- INICIAR O SERVIDOR ---
app.listen(PORT, () => {
  console.log(`Servidor com memória de elefante e closet infinito no ar! Na porta ${PORT}`);
});