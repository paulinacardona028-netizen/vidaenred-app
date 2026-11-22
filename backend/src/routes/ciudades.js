import { Router } from "express";
import { CIUDADES } from "../lib/ciudades.js";

// Catálogo público de ciudades para el registro y el filtro de entidades
const router = Router();

router.get("/", (req, res) => {
  res.json([...CIUDADES].sort((a, b) => a.localeCompare(b, "es")));
});

export default router;
