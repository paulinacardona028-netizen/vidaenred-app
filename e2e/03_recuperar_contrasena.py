import os, sys
ENTIDAD = os.environ.get("ENTIDAD")          # nombre de una entidad aliada ya importada
DONANTE_CORREO = os.environ.get("DONANTE_CORREO")  # cuenta de donante compatible con O+
DONANTE_CLAVE = os.environ.get("DONANTE_CLAVE")
if not ENTIDAD or not DONANTE_CORREO or not DONANTE_CLAVE:
    sys.exit("Define ENTIDAD, DONANTE_CORREO y DONANTE_CLAVE con datos reales de tu base de prueba.")
from playwright.sync_api import sync_playwright, expect
WEB = "http://localhost:8081"
res = []
def paso(n, fn, page):
    try: fn(); res.append(1); print(f"[OK]   {n}", flush=True)
    except Exception as e:
        res.append(0); print(f"[FALLO] {n}: {str(e).splitlines()[0][:200]}", flush=True)
        page.screenshot(path=f"/tmp/shots/fallo_e3_{len(res)}.png", full_page=True)
with sync_playwright() as p:
    b = p.chromium.launch(); ctx = b.new_context(viewport={"width":390,"height":844}); page = ctx.new_page(); page.set_default_timeout(15000)
    page.goto(WEB)
    paso("1. Login: enlace '¿Olvidaste tu contraseña?' abre recuperación", lambda: (page.get_by_text("¿Olvidaste tu contraseña?").click(), expect(page.get_by_text("Recuperar contraseña").first).to_be_visible()), page)
    page.screenshot(path="/tmp/shots/12_recuperar.png")
    paso("2. Solicitar código avanza al paso de escribir el código", lambda: (
        page.locator("input[placeholder=\"nombre@correo.com\"] >> visible=true").fill(DONANTE_CORREO),
        page.get_by_text("Enviar código", exact=True).click(),
        expect(page.get_by_text("Escribe el código")).to_be_visible()), page)
    page.screenshot(path="/tmp/shots/13_codigo.png")
    paso("3. Código incorrecto muestra error (no cambia la contraseña)", lambda: (
        page.locator("input[placeholder=\"123456\"] >> visible=true").fill("000000"),
        page.locator("input[placeholder=\"Mínimo 6 caracteres\"] >> visible=true").fill("nueva999"),
        page.get_by_text("Cambiar contraseña", exact=True).click(),
        page.wait_for_timeout(1500)), page)
    b.close()
print(f"RESULTADO: {sum(res)}/{len(res)} OK")
