import { type Request, type Response } from 'express';
// @ts-ignore
import bcrypt from 'bcrypt';
// @ts-ignore
import jwt from 'jsonwebtoken';
// @ts-ignore
import pool from '../config/db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'trincard-secret-key-change-this-in-prod';

export const register = async (req: Request, res: Response) => {
    const { email, password, full_name, cpf, phone } = req.body;

    try {
        // Check if user exists
        const userCheck = await pool.query('SELECT id FROM users WHERE email = $1 OR cpf = $2', [email, cpf]);
        if (userCheck.rows.length > 0) {
            return res.status(400).json({ error: 'User already exists (email or cpf)' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // Insert user
        const newUser = await pool.query(
            `INSERT INTO users (email, password_hash, full_name, cpf, phone) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING id, email, full_name, role`,
            [email, passwordHash, full_name, cpf, phone]
        );

        const user = newUser.rows[0];
        const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '24h' });

        res.status(201).json({ user, token });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const login = async (req: Request, res: Response) => {
    const { email, password } = req.body;

    try {
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

        if (result.rows.length === 0) {
            return res.status(400).json({ error: 'User not found' });
        }

        const user = result.rows[0];

        // Auto-fix for admin placeholder hash
        if (email === 'admin@trincard.com' && user.password_hash.includes('hash placeholder')) {
            if (password === 'admin123') {
                // Correct password provided, update hash
                const salt = await bcrypt.genSalt(10);
                const newHash = await bcrypt.hash(password, salt);
                await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [newHash, user.id]);

                // Proceed to login
                const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
                // Remove sensitive data
                delete user.password_hash;
                return res.json({ user, token });
            }
        }

        // Normal login
        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) {
            return res.status(400).json({ error: 'Invalid password' });
        }

        const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '24h' });

        // Remove sensitive data
        delete user.password_hash;

        res.json({ user, token });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getMe = async (req: Request, res: Response) => {
    try {
        const userId = req.user.id;
        const result = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const user = result.rows[0];
        delete user.password_hash;
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};
