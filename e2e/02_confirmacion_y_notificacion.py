import os, sys
ENTIDAD = os.environ.get("ENTIDAD")          # nombre de una entidad aliada ya importada
DONANTE_CORREO = os.environ.get("DONANTE_CORREO")  # cuenta de donante compatible con O+
DONANTE_CLAVE = os.environ.get("DONANTE_CLAVE")
if not ENTIDAD or not DONANTE_CORREO or not DONANTE_CLAVE:
    sys.exit("Define ENTIDAD, DONANTE_CORREO y DONANTE_CLAVE con datos reales de tu base de prueba.")
from playwright.sync_api import sync_playwright, expect
ANA = open("/tmp/ana.txt").read().strip()
WEB = "http://localhost:8081"
resultados = []
def paso(nombre, fn, page, shot=None):
    try:
        fn(); resultados.append((nombre, "OK")); print(f"[OK]   {nombre}", flush=True)
    except Exception as e:
        resultados.append((nombre, "FALLO")); print(f"[FALLO] {nombre}: {str(e).splitlines()[0][:220]}", flush=True)
        page.screenshot(path=f"/tmp/shots/fallo_e2_{len(resultados)}.png", full_page=True)

def login(page, correo, clave):
    page.goto(WEB)
    page.get_by_placeholder("nombre@correo.com").fill(correo)
    page.get_by_placeholder("********").fill(clave)
    page.get_by_text("Ingresar", exact=True).click()

with sync_playwright() as p:
    browser = p.chromium.launch()
    # ── Juan (donante O+) ve la solicitud de Ana y confirma ──
    ctx = browser.new_context(viewport={"width": 390, "height": 844}); page = ctx.new_page(); page.set_default_timeout(15000)
    errores = []; page.on("pageerror", lambda e: errores.append(str(e)))
    paso("A. Juan inicia sesión", lambda: (login(page, DONANTE_CORREO, DONANTE_CLAVE), expect(page.locator("text=Entidades aliadas >> visible=true").first).to_be_visible()), page)
    paso("B. Juan ve la solicitud compatible y abre el detalle", lambda: (
        expect(page.get_by_text(ENTIDAD).first).to_be_visible(),
        page.get_by_text("O+ alta").first.click()  # solicitud O+ publicada por el solicitante de prueba,
        expect(page.get_by_text("Tipo requerido: O+")).to_be_visible()), page)
    page.screenshot(path="/tmp/shots/08_detalle_donante.png")
    paso("C. 'Puedo donar' muestra la confirmación", lambda: (
        page.get_by_text("Puedo donar", exact=True).click(),
        expect(page.get_by_text("¡Gracias por tu disposición!")).to_be_visible()), page)
    page.screenshot(path="/tmp/shots/09_confirmacion.png")
    paso("D. Juan vuelve al inicio", lambda: (page.get_by_text("Volver al inicio", exact=True).click(),
        expect(page.locator("text=Entidades aliadas >> visible=true").first).to_be_visible()), page)
    print("errores JS (Juan):", len(errores))
    ctx.close()

    # ── Ana: contador y notificación de la confirmación ──
    ctx2 = browser.new_context(viewport={"width": 390, "height": 844}); page2 = ctx2.new_page(); page2.set_default_timeout(15000)
    paso("E. Ana inicia sesión", lambda: (login(page2, ANA, "secreto1"), expect(page2.get_by_text("Solicitudes cerca").first).to_be_visible()), page2)
    page2.screenshot(path="/tmp/shots/10_ana_inicio.png")
    paso("F. Ana abre Notificaciones y ve que Juan confirmó", lambda: (
        page2.mouse.click(357, 32),
        expect(page2.get_by_text("confirmó que puede donar").first).to_be_visible()), page2)
    page2.screenshot(path="/tmp/shots/11_notificaciones_ana.png")
    browser.close()

ok = sum(1 for _, r in resultados if r == "OK")
print(f"\nRESULTADO: {ok}/{len(resultados)} pasos OK")
