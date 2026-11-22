// Carga backend/.env sin importar desde qué carpeta se ejecute el comando.
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const carpetaBackend = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
dotenv.config({ path: path.join(carpetaBackend, ".env") });
