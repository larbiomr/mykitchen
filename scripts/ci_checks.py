#!/usr/bin/env python3
"""Contrôles CI de MyKitchen : « security » (secrets, CSP, DOM) et « pwa »."""
import json
import re
import struct
import subprocess
import sys
from pathlib import Path

RACINE = Path(__file__).resolve().parent.parent

SECRETS = {
    "clé AWS": r"AKIA[0-9A-Z]{16}",
    "jeton GitHub": r"gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{40,}",
    "jeton Netlify": r"nfp_[A-Za-z0-9]{30,}",
    "clé Google": r"AIza[0-9A-Za-z_-]{35}",
    "clé d'API": r"\b(?:sk|gsk)[-_][A-Za-z0-9_-]{20,}",
    "clé privée": r"-----BEGIN [A-Z ]*PRIVATE KEY-----",
    "jeton JWT": r"eyJ[A-Za-z0-9_-]{15,}\.eyJ[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{15,}",
    "secret en dur": r"(?i)(?:api[_-]?key|secret|token|password|passwd)[\"']?\s*[:=]\s*[\"'][^\"'$\s{}<>]{12,}[\"']",
}

# Constructions DOM interdites dans le code de l'application
DOM_DANGEREUX = r"\.innerHTML|\.outerHTML|insertAdjacentHTML|document\.write|\beval\(|new Function\("

DIRECTIVES = {"default-src": "'none'", "script-src": "'self'", "object-src": "'none'", "base-uri": "'none'"}


def fichiers_suivis():
    sortie = subprocess.run(["git", "ls-files", "-z"], cwd=RACINE, capture_output=True, check=True)
    return [RACINE / nom for nom in sortie.stdout.decode().split("\0") if nom]


def analyser_csp(texte):
    return {m.split()[0]: " ".join(m.split()[1:]) for m in texte.split(";") if m.strip()}


def verifier_csp(source, valeur, erreurs):
    csp = analyser_csp(valeur)
    for directive, attendu in DIRECTIVES.items():
        if csp.get(directive) != attendu:
            erreurs.append(f"{source} : {directive} doit valoir {attendu}")
    if re.search(r"'unsafe-(inline|eval)'|\*", valeur):
        erreurs.append(f"{source} : CSP trop permissive (unsafe-* ou joker)")


def security():
    erreurs = []
    fichiers = fichiers_suivis()
    if not fichiers:
        erreurs.append("aucun fichier suivi par git : rien à analyser")
    for chemin in fichiers:
        if chemin.suffix == ".png":
            continue
        texte = chemin.read_text(encoding="utf-8", errors="replace")
        nom = chemin.relative_to(RACINE)
        for libelle, motif in SECRETS.items():
            for trouve in re.finditer(motif, texte):
                ligne = texte.count("\n", 0, trouve.start()) + 1
                # La valeur trouvée n'est jamais affichée dans les journaux
                erreurs.append(f"{nom}:{ligne} : {libelle} potentiel")
        if nom.parts[0] in ("js", "sw.js") and re.search(DOM_DANGEREUX, texte):
            erreurs.append(f"{nom} : construction DOM dangereuse")

    html = (RACINE / "index.html").read_text(encoding="utf-8")
    meta = re.search(r'http-equiv="Content-Security-Policy"\s+content="([^"]+)"', html)
    if meta:
        verifier_csp("index.html", meta.group(1), erreurs)
    else:
        erreurs.append("index.html : balise CSP absente")
    if re.search(r"<script(?![^>]*\bsrc=)|\son[a-z]+=|\sstyle=", html):
        erreurs.append("index.html : script, gestionnaire ou style en ligne")

    entetes = (RACINE / "_headers").read_text(encoding="utf-8")
    politiques = re.findall(r"Content-Security-Policy:\s*(.+)", entetes)
    if not politiques:
        erreurs.append("_headers : CSP absente")
    for valeur in politiques:
        verifier_csp("_headers", valeur, erreurs)
        if "frame-ancestors 'none'" not in valeur:
            erreurs.append("_headers : frame-ancestors 'none' manquant")
    for nom in ("X-Frame-Options", "X-Content-Type-Options", "Referrer-Policy", "Strict-Transport-Security"):
        if nom not in entetes:
            erreurs.append(f"_headers : en-tête {nom} manquant")
    return erreurs


def taille_png(chemin):
    largeur, hauteur = struct.unpack(">II", chemin.read_bytes()[16:24])
    return f"{largeur}x{hauteur}"


def pwa():
    """Remplace la catégorie PWA, retirée de Lighthouse 12."""
    erreurs = []
    manifeste = json.loads((RACINE / "manifest.json").read_text(encoding="utf-8"))
    for champ in ("name", "short_name", "start_url", "display", "theme_color", "background_color", "icons"):
        if not manifeste.get(champ):
            erreurs.append(f"manifest.json : champ {champ} manquant")
    tailles = set()
    for icone in manifeste.get("icons", []):
        chemin = RACINE / icone["src"]
        if not chemin.is_file():
            erreurs.append(f"icône absente : {icone['src']}")
        elif chemin.suffix == ".png":
            reelle = taille_png(chemin)
            tailles.add(reelle)
            if reelle != icone["sizes"]:
                erreurs.append(f"{icone['src']} : taille réelle {reelle}, déclarée {icone['sizes']}")
    for requise in ("192x192", "512x512"):
        if requise not in tailles:
            erreurs.append(f"manifest.json : icône PNG {requise} manquante")

    sw = (RACINE / "sw.js").read_text(encoding="utf-8")
    bloc = re.search(r"const FICHIERS = \[(.*?)\];", sw, re.S)
    liste = set(re.findall(r"'\./([^']+)'", bloc.group(1))) if bloc else set()
    reels = {"index.html", "manifest.json"} | {
        p.relative_to(RACINE).as_posix()
        for dossier in ("css", "js", "assets") for p in (RACINE / dossier).rglob("*") if p.is_file()
    }
    erreurs += [f"sw.js : absent du cache : {f}" for f in sorted(reels - liste)]
    erreurs += [f"sw.js : fichier inexistant : {f}" for f in sorted(liste - reels)]
    if "serviceWorker.register" not in (RACINE / "js/app.js").read_text(encoding="utf-8"):
        erreurs.append("js/app.js : service worker non enregistré")
    return erreurs


if __name__ == "__main__":
    controles = {"security": security, "pwa": pwa}
    if len(sys.argv) != 2 or sys.argv[1] not in controles:
        sys.exit(f"usage : {sys.argv[0]} {'|'.join(controles)}")
    problemes = controles[sys.argv[1]]()
    for probleme in problemes:
        print(f"::error::{probleme}")
    print(f"{sys.argv[1]} : {len(problemes)} problème(s)")
    sys.exit(1 if problemes else 0)
