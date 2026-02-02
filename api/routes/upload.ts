import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const router = Router();

// Configuração do Multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Definir pasta de destino baseada no tipo (opcional, aqui tudo vai para uploads/partners por padrão)
        // Se quiser separar, pode passar via query param ou body, mas multipart é chato.
        // Vamos salvar tudo em 'uploads' por enquanto.
        const uploadDir = path.join(process.cwd(), 'uploads');

        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, uniqueSuffix + ext);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'image/jpeg',
            'image/png',
            'image/jpg',
            'image/webp'
        ];

        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Tipo de arquivo inválido. Apenas imagens e documentos são permitidos.'));
        }
    }
});

// Rota de upload único
router.post('/', upload.single('file'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Nenhum arquivo enviado.' });
        }

        // Construir URL pública
        // O backend deve servir a pasta 'uploads' estaticamente
        // Se o backend estiver em api.dominio.com, a url será api.dominio.com/uploads/arquivo
        // Ajuste conforme sua configuração de proxy/dominio

        const protocol = req.protocol;
        const host = req.get('host');
        const filename = req.file.filename;

        // Retornar URL relativa ou absoluta
        // Para facilitar, retornamos absoluta se soubermos o host, ou relativa
        const url = `/uploads/${filename}`;

        res.json({
            success: true,
            url: url,
            filename: filename,
            mimetype: req.file.mimetype,
            size: req.file.size
        });

    } catch (error) {
        console.error('Erro no upload:', error);
        res.status(500).json({ error: 'Erro interno no upload.' });
    }
});

export default router;
