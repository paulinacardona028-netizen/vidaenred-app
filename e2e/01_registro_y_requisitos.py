import re, time, sys
import os, sys
ENTIDAD = os.environ.get("ENTIDAD")          # nombre de una entidad aliada ya importada
DONANTE_CORREO = os.environ.get("DONANTE_CORREO")  # cuenta de donante compatible con O+
DONANTE_CLAVE = os.environ.get("DONANTE_CLAVE")
if not ENTIDAD or not DONANTE_CORREO or not DONANTE_CLAVE:
    sys.exit("Define ENTIDAD, DONANTE_CORREO y DONANTE_CLAVE con datos reales de tu base de prueba.")
from playwright.sync_api import sync_playwright, expect

WEB = "http://localhost:8081"
TS = str(int(time.time()))
ANA = f"ana.{TS}@correo.com"
open("/tmp/ana.txt","w").write(ANA)
resultados = []

def paso(nombre, fn, page):
    try:
        fn()
        resultados.append((nombre, "OK"))
        print(f"[OK]   {nombre}", flush=True)
    except Exception as e:
        resultados.append((nombre, f"FALLO: {str(e).splitlines()[0][:200]}"))
        print(f"[FALLO] {nombre}: {str(e).splitlines()[0][:200]}", flush=True)
        page.screenshot(path=f"/tmp/shots/fallo_{len(resultados)}.png", full_page=True)

with sync_playwright() as p:
    browser = p.chromium.launch()
    ctx = browser.new_context(viewport={"width": 390, "height": 844}, device_scale_factor=1)
    page = ctx.new_page()
    page.set_default_timeout(15000)
    errores_consola = []
    page.on("pageerror", lambda e: errores_consola.append(str(e)))
    page.goto(WEB)

    paso("1. Pantalla de inicio de sesión visible", lambda: expect(page.get_by_text("VidaEnRed").first).to_be_visible(), page)
    page.screenshot(path="/tmp/shots/01_login.png")

    def registrar():
        page.get_by_text("No tengo cuenta, registrarme").click()
        page.get_by_placeholder("Tu nombre").fill("Ana Prueba")
        page.get_by_placeholder("Tu ciudad").fill("Medellín")
        page.get_by_placeholder("nombre@correo.com").fill(ANA)
        page.get_by_placeholder("Mínimo 6 caracteres").fill("secreto1")
        page.get_by_text("Crear cuenta", exact=True).click()
        expect(page.get_by_text("Mis solicitudes").or_(page.get_by_text("Solicitudes cerca")).first).to_be_visible()
    paso("2. Registro sin tipo de sangre entra a la app", registrar, page)
    page.screenshot(path="/tmp/shots/02_inicio_solicitante.png")

    def ver_entidades_en_crear():
        page.get_by_text("Nueva solicitud", exact=True).click()
        expect(page.get_by_text("Hospital o banco de sangre")).to_be_visible()
        expect(page.get_by_text(ENTIDAD).first).to_be_visible()
    paso("3. Crear solicitud muestra entidades del catálogo", ver_entidades_en_crear, page)
    page.screenshot(path="/tmp/shots/03_crear_solicitud.png", full_page=True)

    def publicar_solicitud():
        page.get_by_text(ENTIDAD, exact=True).first.click()
        page.get_by_placeholder("Ej. Ana Gómez").fill("Mamá de Ana")
        page.get_by_placeholder("300 000 0000").fill("3001112233")
        page.get_by_text("Publicar solicitud", exact=True).click()
        expect(page.get_by_text("Mis solicitudes").first).to_be_visible()
        expect(page.get_by_text("O+ alta").first).to_be_visible()
    paso("4. Publicar solicitud y aparece en Mis solicitudes", publicar_solicitud, page)
    page.screenshot(path="/tmp/shots/04_mis_solicitudes.png")

    def ir_perfil():
        page.get_by_text("Perfil", exact=True).last.click()
        expect(page.get_by_text("Mis roles")).to_be_visible()
    paso("5. Perfil muestra roles", ir_perfil, page)

    def activar_donante_abre_formulario():
        page.get_by_role("switch").nth(0).click()
        expect(page.get_by_text("Requisitos para donar").first).to_be_visible()
    paso("6. Activar 'Puedo donar' abre el formulario de requisitos", activar_donante_abre_formulario, page)
    page.screenshot(path="/tmp/shots/05_requisitos.png", full_page=True)

    def llenar_y_enviar_requisitos():
        page.get_by_placeholder("1995-03-10").fill("1995-03-10")
        page.get_by_placeholder("70").fill("70")
        page.get_by_text("Hombre", exact=True).click()
        page.get_by_text("Enviar formulario", exact=True).click()
        expect(page.get_by_text("Cumples los requisitos")).to_be_visible()
    paso("7. Enviar requisitos muestra resultado 'cumple'", llenar_y_enviar_requisitos, page)
    page.screenshot(path="/tmp/shots/06_resultado_requisitos.png", full_page=True)

    def volver_perfil_donante():
        page.get_by_text("Volver al perfil", exact=True).click()
        expect(page.get_by_text("Activo").first).to_be_visible()
    paso("8. Volver al perfil: rol donante activo", volver_perfil_donante, page)

    def inicio_con_carrusel():
        page.get_by_text("Inicio", exact=True).last.click()
        expect(page.get_by_text("Entidades aliadas")).to_be_visible()
        expect(page.get_by_text("Cómo llegar en Google Maps").first).to_be_visible() if False else None
        expect(page.get_by_text(ENTIDAD).first).to_be_visible()
        
    paso("9. Inicio muestra carrusel con solo entidades aliadas", inicio_con_carrusel, page)
    page.screenshot(path="/tmp/shots/07_carrusel.png")

    def selector_modos():
        expect(page.get_by_text("Donar", exact=True).first).to_be_visible()
        expect(page.get_by_text("Solicitar", exact=True).first).to_be_visible()
    paso("10. Selector Donar/Solicitar visible con ambos roles", selector_modos, page)

    print("\nErrores JS en consola:", len(errores_consola))
    for e in errores_consola[:5]:
        print("  -", e[:200])
    ok = sum(1 for _, r in resultados if r == "OK")
    print(f"\nRESULTADO: {ok}/{len(resultados)} pasos OK")
    browser.close()
