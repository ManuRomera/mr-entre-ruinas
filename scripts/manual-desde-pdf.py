"""Convierte los tres PDF de MIDRA en _data/manual.json (JournalEntry con páginas HTML).

Los PDF no viajan en el repositorio. Uso, con poppler (pdftotext) instalado:
    ER_PDFS=/ruta/a/los/pdf python3 scripts/manual-desde-pdf.py
"""
import html, json, re, subprocess, os

DL = os.environ.get("ER_PDFS", os.path.expanduser("~/Downloads"))
SIS = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RUTA = "systems/mr-entre-ruinas/assets"

PDF = {
    "manual": f"{DL}/Manual de juego Entre ruinas 2026.pdf",
    "campana": f"{DL}/Entre ruinas suplemento de campaña de Un mundo violento 2026.pdf",
    "refugios": f"{DL}/suplemento Entre ruinas refugios 2026.pdf",
}


def pdftexto(pdf, desde=1, hasta=None):
    args = ["pdftotext", "-f", str(desde)] + (["-l", str(hasta)] if hasta else []) + [pdf, "-"]
    return subprocess.run(args, capture_output=True, text=True, check=True).stdout


def indice(pdf):
    out = []
    for l in pdftexto(pdf, 2, 3).split("\n"):
        l = l.replace("\f", "").strip()
        if "...." not in l:
            continue
        e = re.sub(r"\.{3,}\s*\d+$", "", l).strip()
        if e and e != "Índice":
            out.append(e)
    return out


def lineas(pdf, desde, hasta):
    res = []
    for l in pdftexto(pdf, desde, hasta).split("\n"):
        l = l.replace("\f", "").strip()
        if re.fullmatch(r"\d{1,2}", l) or not l:
            continue
        res.append(l)
    return res


E = html.escape


def enfatizar(t):
    """«Término — explicación» → término en negrita; etiquetas «Situación:»."""
    t = E(t, quote=False)
    m = re.match(r"^([^—]{2,40}?) — (.+)$", t)
    if m:
        return f"<strong>{m.group(1)}</strong> — {m.group(2)}"
    m = re.match(r"^(Situación|Pregunta incómoda):\s*(.+)$", t)
    if m:
        return f"<strong>{m.group(1)}:</strong> {m.group(2)}"
    return t


TABLAS = {
    "atributos": """<table><thead><tr><th>Atributo</th><th>Cubre</th></tr></thead><tbody>
<tr><td>Violencia</td><td>Pelea, intimidación, brutalidad, destruir cosas.</td></tr>
<tr><td>Coco</td><td>Improvisar, investigar, analizar, pensar bajo presión.</td></tr>
<tr><td>Labia</td><td>Mentir, convencer, conectar, manipular.</td></tr>
<tr><td>Aguante</td><td>Resistir el dolor, el miedo, el hambre y el agotamiento.</td></tr></tbody></table>""",
    "resultados": """<h2>7.2 Resultados</h2><table><thead><tr><th>Resultado</th><th>Efecto</th></tr></thead><tbody>
<tr><td>10+</td><td><strong>Éxito limpio.</strong> El personaje consigue lo que buscaba y, además, la situación mejora.</td></tr>
<tr><td>7–9</td><td><strong>Éxito con coste.</strong> El personaje lo consigue, pero… La Voz elige una consecuencia.</td></tr>
<tr><td>6 o menos</td><td><strong>Fallo.</strong> La Voz ejecuta un Movimiento Duro y la ficción empeora.</td></tr></tbody></table>""",
    "caos": """<table><thead><tr><th>Coste</th><th>Efecto</th></tr></thead><tbody>
<tr><td>1 ficha</td><td>Introducir un detalle pequeño. Ejemplos: «la puerta ya estaba abierta», «reconozco esta calle».</td></tr>
<tr><td>2 fichas</td><td>Introducir un giro de mayor peso. Ejemplos: «ese saqueador me conoce», «la radio sigue funcionando».</td></tr>
<tr><td>3 fichas</td><td>Alterar radicalmente una escena entera. Ejemplos: «las luces vuelven», «el edificio empieza a derrumbarse», «llega otra facción».</td></tr></tbody></table>""",
}


def sustituir_tabla(ls, inicio, fin_prefijo, clave):
    """Sustituye desde la línea `inicio` hasta antes de la primera que empiece por `fin_prefijo`."""
    i = ls.index(inicio)
    j = next(k for k in range(i + 1, len(ls)) if ls[k].startswith(fin_prefijo))
    return ls[:i] + [f"@@{clave}@@"] + ls[j:]


def bloques(ls, titulos, ancho):
    """Agrupa líneas en bloques: ('h', texto) | ('p', texto) | ('li', texto) | ('ej', texto) | ('raw', html)."""
    out, parrafo, lista = [], [], None

    def cerrar():
        nonlocal parrafo
        if parrafo:
            out.append(("p", " ".join(parrafo)))
            parrafo = []

    ejemplo = False
    for l in ls:
        if l.startswith("@@"):
            cerrar(); out.append(("raw", TABLAS[l.strip("@")])); continue
        if l in titulos:
            cerrar(); out.append(("h", l)); continue
        if l == "EJEMPLO":
            cerrar(); ejemplo = True; continue
        if l.startswith("FRASES QUE AYUDAN"):
            cerrar(); out.append(("h3", "Frases que ayudan a la Voz a improvisar")); continue
        if l.startswith("•"):
            cerrar(); out.append(("li", l.lstrip("• ").strip())); continue
        # Continuación de un elemento de lista cortado por el ancho de línea.
        if out and out[-1][0] == "li" and not parrafo and not re.search(r"[.!?»:]$", out[-1][1]):
            out[-1] = ("li", out[-1][1] + " " + l); continue
        parrafo.append(l)
        fin = re.search(r"[.!?»:…)]$", l) and len(l) < ancho * 0.9
        if fin:
            texto = " ".join(parrafo); parrafo = []
            if ejemplo:
                out.append(("ej", texto)); ejemplo = False
            elif re.fullmatch(r"«[^»]+»", texto) or (out and out[-1][0] == "h3"):
                out.append(("li", texto)) if texto.startswith("«") else out.append(("p", texto))
            else:
                out.append(("p", texto))
    cerrar()
    return out


def html_de(bs, nivel):
    """nivel: función texto_de_titulo → 'h2'|'h3'."""
    partes, en_lista = [], False
    for tipo, t in bs:
        if tipo == "li":
            if not en_lista:
                partes.append("<ul>"); en_lista = True
            partes.append(f"<li>{enfatizar(t)}</li>")
            continue
        if en_lista:
            partes.append("</ul>"); en_lista = False
        if tipo == "h":
            partes.append(f"<{nivel(t)}>{E(t)}</{nivel(t)}>")
        elif tipo == "h3":
            partes.append(f"<h3>{E(t)}</h3>")
        elif tipo == "p":
            partes.append(f"<p>{enfatizar(t)}</p>")
        elif tipo == "ej":
            partes.append(f'<div class="er-ejemplo">{E(t)}</div>')
        elif tipo == "raw":
            partes.append(t)
    if en_lista:
        partes.append("</ul>")
    return "\n".join(partes)


def paginas(bs, es_pagina, nivel, prefijo):
    """Corta los bloques en páginas por los títulos de primer nivel."""
    pags, actual = [], None
    for b in bs:
        if b[0] == "h" and es_pagina(b[1]):
            actual = {"name": b[1], "bloques": []}
            pags.append(actual)
            continue
        if actual is None:
            actual = {"name": "Introducción", "bloques": []}
            pags.append(actual)
        actual["bloques"].append(b)
    return [
        texto_pagina(f"{prefijo}{i:02d}", p["name"], html_de(p["bloques"], nivel), (i + 2) * 1000)
        for i, p in enumerate(pags)
    ]


def ident(base):
    base = re.sub(r"[^A-Za-z0-9]", "", base)
    return (base + "0" * 16)[:16]


def texto_pagina(id_, nombre, contenido, orden):
    return {
        "_id": ident(id_), "name": nombre, "type": "text",
        "title": {"show": True, "level": 1},
        "text": {"format": 1, "content": f'<div class="er-manual">\n{contenido}\n</div>'},
        "sort": orden, "ownership": {"default": -1},
    }


def imagen_pagina(id_, nombre, src, pie, orden):
    return {
        "_id": ident(id_), "name": nombre, "type": "image", "src": f"{RUTA}/{src}",
        "image": {"caption": pie}, "title": {"show": False, "level": 1},
        "sort": orden, "ownership": {"default": -1},
    }


def diario(id_, nombre, pags):
    return {"_id": id_, "name": nombre, "pages": pags, "ownership": {"default": 0}, "flags": {}}


# ─── Manual ────────────────────────────────────────────────────────────
def manual():
    pdf = PDF["manual"]
    tit = indice(pdf)
    ls = lineas(pdf, 4, 20)
    ls = sustituir_tabla(ls, "Atributo", "5.3 ", "atributos")
    ls = sustituir_tabla(ls, "Resultado", "7.3 ", "resultados")
    ls = sustituir_tabla(ls, "Coste", "9.3 ", "caos")
    bs = bloques(ls, set(tit), 108)
    # «La última regla»: cierre destacado.
    ultimo = [i for i, b in enumerate(bs) if b == ("h", "20. La última regla")][0]
    final = " ".join(b[1] for b in bs[ultimo + 1:])
    bs = bs[:ultimo + 1] + [("raw", f'<p class="er-cita-final">{E(final)}</p>')]
    pags = paginas(bs, lambda t: re.match(r"^\d+\. ", t), lambda t: "h2", "manualpag")
    # Foundry ya numera las páginas (la portada es la 0): el número del capítulo sobraría.
    for p in pags:
        p["name"] = re.sub(r"^\d+\. ", "", p["name"])
    pre = """<p>Los cuatro supervivientes del manual están listos para jugar en el compendio <strong>ER · Supervivientes pregenerados</strong>, con sus Marcas, relaciones, vínculos y preguntas incómodas.</p>
""" + "\n".join(f'<img src="{RUTA}/pregenerados/{k}-ficha.webp" alt="{n}">' for k, n in [
        ("luz", "Lucía “Luz” Romero"), ("gabo", "Gabriel “Gabo” Salvatierra"), ("marta", "Marta Vidal"), ("ivan", "Iván Ortega")])
    return diario("manualEntreRuina", "Entre Ruinas · Manual de juego", [
        imagen_pagina("manualportada", "Portada", "portadas/manual.webp", "Entre Ruinas. Sobrevivir no es lo mismo que seguir adelante.", 1000),
        *pags,
        texto_pagina("manualpregen", "Supervivientes pregenerados", pre, 90000),
        imagen_pagina("manualcontra", "Contraportada", "portadas/contraportada.webp", "Nadie recuerda cómo empezó. Pero todos recuerdan a quién dejaron atrás.", 91000),
    ])


# ─── Un Mundo Violento ─────────────────────────────────────────────────
PARTES_V = {"5. El Colapso", "11. El Mundo Roto", "16. Comunidades", "20. Los Violentos", "23. Las Voces",
            "26. Hacer Campañas", "29. Temporadas", "32. Herramientas de la Voz", "35. Escenarios",
            "39. Rumores sobre el mundo", "40. Epílogo — Todavía seguimos aquí"}


def campana():
    pdf = PDF["campana"]
    tit = indice(pdf)
    ls = lineas(pdf, 4, 11)
    bs = bloques(ls, set(tit), 108)
    # La frase que sigue a cada parte es su lema: se muestra como entradilla.
    for i, b in enumerate(bs):
        if b[0] == "h" and b[1] in PARTES_V and i + 1 < len(bs) and bs[i + 1][0] == "p" and len(bs[i + 1][1]) < 80:
            bs[i + 1] = ("raw", f'<p class="er-cita-final">{E(bs[i + 1][1])}</p>')
    pags = paginas(bs, lambda t: t in PARTES_V, lambda t: "h2", "mundopag")
    for p in pags:
        p["name"] = re.sub(r"^\d+\. ", "", p["name"])
    return diario("mundoViolento000", "Un Mundo Violento · Suplemento de campaña", [
        imagen_pagina("mundoportada", "Portada", "portadas/mundo-violento.webp", "Un Mundo Violento. Historias de supervivencia en un mundo roto.", 1000),
        *pags,
    ])


# ─── Refugios ──────────────────────────────────────────────────────────
def refugios():
    pdf = PDF["refugios"]
    tit = indice(pdf)
    ls = lineas(pdf, 4, 14)
    # Errata del original: el refugio aislado es un ferry (el suplemento de campaña lo nombra así).
    ls = [l.replace("Terry abandonado", "Ferry abandonado") for l in ls]
    bs = bloques(ls, set(tit), 108)
    ultimo = [i for i, b in enumerate(bs) if b == ("h", "La última regla")][0]
    final = " ".join(b[1] for b in bs[ultimo + 1:])
    bs = bs[:ultimo + 1] + [("raw", f'<p class="er-cita-final">{E(final)}</p>')]
    es_pagina = lambda t: t == "Introducción" or t.startswith("Capítulo ")
    pags = paginas(bs, es_pagina, lambda t: "h2", "refugiopag")
    return diario("refugiosSuplemen", "Refugios · Suplemento", [
        imagen_pagina("refugioportada", "Portada", "portadas/refugios.webp", "Refugios. Suplemento narrativo para comunidades al borde del colapso.", 1000),
        *pags,
    ])


# ─── Guía del sistema ──────────────────────────────────────────────────
GUIA = [
    ("Empezar", """<p>MR- Entre Ruinas convierte el manual y sus dos suplementos en herramientas de mesa. No hay director: cada episodio una persona distinta es <strong>la Voz</strong>, y todo el sistema está pensado para que cualquiera pueda serlo.</p>
<ol>
<li><strong>Cread los personajes.</strong> Al crear un Actor de tipo <em>Personaje</em> se abre el <em>asistente de creación</em> con los seis pasos del manual, los ejemplos del libro como sugerencias y el reparto de atributos validado. También podéis arrastrar a los cuatro supervivientes del compendio <em>Supervivientes pregenerados</em>.</li>
<li><strong>Cread el refugio</strong> (sesión 0, suplemento Refugios): un Actor de tipo <em>Refugio</em>. Pertenece a toda la mesa.</li>
<li><strong>Abrid el Panel de la Voz</strong>: botón en el directorio de Actores o en la barra de herramientas de fichas (icono de micrófono). Elegid quién es la Voz y preparad el lugar, el problema, la amenaza y la pregunta incómoda.</li>
</ol>
<p>Todas las ventanas del sistema recuerdan su posición, su tamaño, la pestaña y las secciones plegadas. Si algo queda fuera de sitio: <em>Configuración → Memoria de ventanas → Olvidar posiciones</em>.</p>"""),
    ("La ficha de personaje", """<p>La columna izquierda no se mueve nunca: es lo que se usa en cada escena.</p>
<ul>
<li><strong>Atributos.</strong> Clic en la fila = tirada de 2d6 + atributo. La tarjeta del chat muestra el resultado: en un 7–9 la Voz elige la consecuencia con un clic; en un 6 o menos aparecen los Movimientos Duros y se marca 1 Estrés automáticamente (se puede desactivar en la configuración).</li>
<li><strong>Ayudo a mi Vínculo Positivo.</strong> Actívalo antes de tirar: suma +1 a la siguiente tirada y se apaga solo.</li>
<li><strong>Estrés.</strong> Clic en una casilla para fijarlo. El botón + pide el motivo y lo publica. Al llenar la quinta casilla llega la <strong>Crisis</strong>: se abre un diálogo para describir cómo explota el personaje y elegir su nueva Marca permanente; después el Estrés se vacía.</li>
<li><strong>Fichas de Caos.</strong> + para ganar una con su motivo; la mano para gastarlas (detalle, flashback, giro o alterar la escena). Clic directo en una ficha corrige el contador sin avisar al chat.</li>
<li><strong>Candado.</strong> Los atributos, el retrato, el nombre y los borrados solo se tocan desbloqueando la ficha. El resto del texto se edita siempre: las relaciones cambian cada episodio.</li>
<li><strong>Modo compacto.</strong> Reduce la ficha a una columna con Marcas y Vínculos resumidos, para tenerla abierta junto al lienzo.</li>
</ul>
<p>En la columna derecha: <strong>Marcas</strong> (el rayo da 1 Ficha de Caos al interpretarla; la luna la deja en suspenso hasta el final del episodio), <strong>Vínculos</strong> (arrastra un personaje a la foto para enlazarlo), relaciones iniciales, objeto importante, pregunta incómoda (su respuesta solo la ve quien lleva el personaje hasta que la saca a la luz) y el diario.</p>"""),
    ("El Panel de la Voz", """<ul>
<li><strong>Cabecera fija:</strong> temporada, episodio, quién es la Voz y las fases del episodio (Cold Open, escenas rápidas, escalada, punto de ruptura y cliffhanger). «Siguiente fase» anuncia cada fase en el chat.</li>
<li><strong>Corte de escena:</strong> cualquiera puede pedirlo; también está en la barra de herramientas de fichas.</li>
<li><strong>Escena de refugio:</strong> cada personaje elige una forma de recuperarse (borrar Estrés, fortalecer un vínculo, revelar una verdad, suspender una Marca, mejorar la Moral o bajar el Estrés del refugio…). Su ficha le avisa hasta que elige.</li>
<li><strong>Fin del episodio:</strong> publica el cliffhanger, devuelve las Marcas suspendidas, avanza el contador (tras el sexto empieza una temporada nueva) y sugiere la siguiente Voz entre quienes aún no lo han sido esta temporada.</li>
<li><strong>Pestañas:</strong> preparación de la sesión con ejemplos del libro y los tres escenarios de Un Mundo Violento; consecuencias y Movimientos Duros a un clic; y todos los oráculos de los tres libros, con dado para elegir al azar.</li>
</ul>
<p>Cualquier jugador puede abrir el panel y cambiar el estado de la mesa: la Voz rota. Los cambios los aplica el GM conectado, así que debe haber uno en la partida.</p>"""),
    ("El refugio", """<p>Arriba, siempre a la vista, los cinco valores (Seguridad, Suministros, Moral, Ruido y Confianza, de 0 a 5) y el Estrés del refugio (6 casillas). Cuando un valor llega a su umbral, el chat avisa de lo que ocurre. Con los Suministros a 0, al empezar cada episodio todos los personajes ganan 1 Estrés automáticamente.</p>
<p>Al llenar el Estrés del refugio llega la Crisis: la Voz elige un Movimiento de comunidad y el refugio gana una Marca. Si se pierde <em>lo que lo mantiene vivo</em>, el botón «Se pierde» provoca la Crisis inmediata.</p>
<p>Los <strong>relojes</strong> son tartas: clic avanza, clic derecho retrocede; al completarse, la amenaza ocurre. Los <strong>roles</strong> asignan cargas a los personajes, y cada ficha de personaje muestra la suya.</p>"""),
]


def guia():
    return diario("guiaDelSistema00", "MR- Entre Ruinas · Cómo se usa en Foundry", [
        texto_pagina(f"guiapag{i}", n, c, (i + 1) * 1000) for i, (n, c) in enumerate(GUIA)
    ] + [texto_pagina("guiacreditos", "Créditos", f"""<img src="{RUTA}/midra.webp" alt="MIDRA" style="width:160px;box-shadow:none">
<p><strong>Entre Ruinas</strong>, <strong>Un Mundo Violento</strong> y <strong>Refugios</strong>: juego original, textos, ambientación y arte de <strong>MIDRA · Midespinas &amp; Amdra</strong>. Todos los derechos reservados; su contenido se incluye en este sistema con permiso.</p>
<p>Implementación para Foundry VTT: <strong>Manu Romera</strong>.</p>
<p class="er-referencia">Tipografías Oswald, Barlow Semi Condensed y Caveat bajo SIL Open Font License 1.1.</p>""", 9000)])


docs = [guia(), manual(), campana(), refugios()]
with open(f"{SIS}/_data/manual.json", "w") as f:
    json.dump(docs, f, ensure_ascii=False, indent=1)
for d in docs:
    print(d["name"])
    for p in d["pages"]:
        print("   ", p["name"], len(p.get("text", {}).get("content", "")))
