import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Always resolve backend/.env regardless of the command execution directory.
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
