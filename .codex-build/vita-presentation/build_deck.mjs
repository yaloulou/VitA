import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const RUNTIME_NODE_MODULES =
  "C:\\Users\\scs_g\\.cache\\codex-runtimes\\codex-primary-runtime\\dependencies\\node\\node_modules";
const RUNTIME_PYTHON =
  "C:\\Users\\scs_g\\.cache\\codex-runtimes\\codex-primary-runtime\\dependencies\\python\\python.exe";
const SKILL_DIR =
  "C:\\Users\\scs_g\\.codex\\plugins\\cache\\openai-primary-runtime\\presentations\\26.904.11930\\skills\\presentations";

process.env.RUNTIME_NODE_MODULES = RUNTIME_NODE_MODULES;
process.env.SKILL_DIR = SKILL_DIR;
process.env.TMP_DIR = "C:\\Users\\scs_g\\vita_back\\.codex-build\\vita-presentation";

const workspaceDir = "C:\\Users\\scs_g\\vita_back";
const TMP_DIR = path.join(workspaceDir, ".codex-build", "vita-presentation");
const outputDir = path.join(workspaceDir, "outputs");
const FINAL_PPTX = path.join(
  outputDir,
  "KSPH_VitA_Stock_Evolution_Projet_2026-09-09_v4_captures.pptx",
);

const artifactToolUrl = pathToFileURL(
  path.join(RUNTIME_NODE_MODULES, "@oai", "artifact-tool", "dist", "artifact_tool.mjs"),
).href;
const { Presentation, PresentationFile, FileBlob } = await import(artifactToolUrl);
const { resolvePresentationFont, finalizePresentation } = await import(
  pathToFileURL(path.join(SKILL_DIR, "container_tools", "artifact_tool_utils.mjs")).href
);

await fs.mkdir(TMP_DIR, { recursive: true });
await fs.mkdir(outputDir, { recursive: true });

const images = {
  adminAlerts:
    "C:\\Users\\scs_g\\Downloads\\WhatsApp Image 2026-09-05 at 16.05.43.jpeg",
  adminReference:
    "C:\\Users\\scs_g\\Downloads\\WhatsApp Image 2026-09-05 at 16.04.51 (1).jpeg",
  adminUsers:
    "C:\\Users\\scs_g\\Downloads\\WhatsApp Image 2026-09-05 at 16.04.51.jpeg",
  mobileLogin:
    "C:\\Users\\scs_g\\Downloads\\WhatsApp Image 2026-09-07 at 00.28.13.jpeg",
  mobileStock:
    "C:\\Users\\scs_g\\Downloads\\WhatsApp Image 2026-09-07 at 11.38.23.jpeg",
};

async function imageBytes(imagePath) {
  return new Uint8Array(await fs.readFile(imagePath));
}

const img = {};
for (const [key, imagePath] of Object.entries(images)) {
  img[key] = await imageBytes(imagePath);
}

const family = resolvePresentationFont({ fontFamily: "Aptos" });
const presentation = Presentation.create({
  slideSize: { width: 1280, height: 720 },
});

const C = {
  bg: "#F6F8FA",
  white: "#FFFFFF",
  ink: "#0F172A",
  text: "#334155",
  muted: "#64748B",
  line: "#D8DEE6",
  green: "#0B7F5A",
  green2: "#1F8F72",
  paleGreen: "#E9F7F1",
  red: "#C2412D",
  amber: "#B7791F",
  blue: "#285E8E",
};

function addBox(slide, x, y, w, h, fill = C.white, line = C.line) {
  return slide.shapes.add({
    geometry: "rect",
    position: { left: x, top: y, width: w, height: h },
    fill,
    line: { style: "solid", fill: line, width: 1 },
  });
}

function addText(slide, text, x, y, w, h, opts = {}) {
  const shape = slide.shapes.add({
    geometry: "textbox",
    position: { left: x, top: y, width: w, height: h },
    fill: "none",
    line: { fill: "none", width: 0 },
  });
  shape.text = text;
  shape.text.style = {
    typeface: family,
    fontSize: opts.size ?? 22,
    bold: opts.bold ?? false,
    color: opts.color ?? C.text,
    autoFit: "shrinkText",
  };
  return shape;
}

function addTitle(slide, title, subtitle) {
  addText(slide, title, 70, 48, 760, 54, {
    size: 34,
    bold: true,
    color: C.ink,
  });
  if (subtitle) {
    addText(slide, subtitle, 72, 94, 900, 34, {
      size: 18,
      color: C.muted,
    });
  }
}

function addFooter(slide, n) {
  addText(slide, "KSPH VitA Stock", 72, 666, 260, 24, {
    size: 13,
    color: C.muted,
  });
  addText(slide, String(n).padStart(2, "0"), 1165, 662, 44, 26, {
    size: 14,
    bold: true,
    color: C.muted,
  });
}

function addPill(slide, label, x, y, w, color = C.green) {
  const box = addBox(slide, x, y, w, 38, "#F8FAFC", "#DDE5EC");
  box.text = label;
  box.text.style = {
    typeface: family,
    fontSize: 15,
    bold: true,
    color,
    autoFit: "shrinkText",
  };
}

function addBullets(slide, items, x, y, w, lineHeight = 50) {
  items.forEach((item, index) => {
    const top = y + index * lineHeight;
    addText(slide, "✓", x, top + 2, 28, 30, {
      size: 19,
      bold: true,
      color: C.green,
    });
    addText(slide, item, x + 38, top, w - 38, lineHeight - 8, {
      size: 19,
      color: C.text,
    });
  });
}

function addImage(slide, bytes, alt, x, y, w, h, fit = "contain", crop) {
  slide.images.add({
    blob: bytes,
    contentType: "image/jpeg",
    alt,
    fit,
    position: { left: x, top: y, width: w, height: h },
    ...(crop ? { crop } : {}),
  });
}

function note(slide, text) {
  slide.speakerNotes.textFrame.setText(text);
}

function addSectionLabel(slide, text, x, y, w, color = C.green) {
  addText(slide, text, x, y, w, 26, {
    size: 15,
    bold: true,
    color,
  });
}

function slideBase(n, title, subtitle) {
  const slide = presentation.slides.add();
  slide.background.fill = C.bg;
  addTitle(slide, title, subtitle);
  addFooter(slide, n);
  return slide;
}

{
  const slide = presentation.slides.add();
  slide.background.fill = C.white;
  addBox(slide, 0, 0, 1280, 720, C.white, C.white);
  addBox(slide, 0, 0, 1280, 190, C.paleGreen, C.paleGreen);
  addText(slide, "KSPH VitA Stock", 80, 86, 760, 62, {
    size: 46,
    bold: true,
    color: C.ink,
  });
  addText(
    slide,
    "Évolution du projet et fonctionnalités déjà disponibles",
    82,
    154,
    760,
    36,
    { size: 22, color: C.text },
  );
  addImage(
    slide,
    img.adminReference,
    "Console admin avec référentiel des provinces, zones, structures et produits",
    720,
    235,
    460,
    260,
    "cover",
  );
  addText(
    slide,
    "Présentation centrée sur les écrans déjà visibles: console admin, alertes, référentiel, utilisateurs, connexion mobile et formulaire de stock.",
    82,
    290,
    510,
    150,
    { size: 25, color: C.text },
  );
  addPill(slide, "Version de démonstration fonctionnelle", 82, 486, 330, C.green);
  addFooter(slide, 1);
  note(slide, "Sources: captures fournies par l'utilisateur et code local des projets vita_back, vita-frontend et vita_mobile.");
}

{
  const slide = slideBase(2, "Lecture des captures", "Les écrans montrent le périmètre fonctionnel déjà matérialisé");
  addBullets(
    slide,
    [
      "La barre latérale admin donne accès aux quatre blocs livrés: Dashboard, Utilisateurs, Référentiel et Alertes.",
      "La console utilise le nom KSPH VitA Stock et place la coordination vitamine A au centre du pilotage.",
      "Les écrans mobile reprennent le même usage métier: connexion du terrain puis saisie de stock.",
      "Les captures couvrent le flux complet entre administration et collecte terrain.",
    ],
    96,
    178,
    620,
    74,
  );
  addBox(slide, 820, 168, 300, 300, C.white, C.line);
  addText(slide, "Ce que l'on peut déjà montrer", 850, 202, 230, 58, {
    size: 24,
    bold: true,
    color: C.ink,
  });
  addText(
    slide,
    "Création de comptes\nCréation du référentiel\nSuivi des alertes\nSaisie mobile",
    850,
    262,
    230,
    150,
    { size: 22, color: C.text },
  );
  note(slide, "Lecture transversale des captures fournies par l'utilisateur.");
}

{
  const slide = slideBase(3, "Console administrative", "La navigation montre les blocs disponibles pour le pilotage");
  addImage(
    slide,
    img.adminReference,
    "Console administrative avec menu latéral et référentiel",
    72,
    150,
    690,
    390,
    "cover",
  );
  addSectionLabel(slide, "Menu de gauche", 810, 168, 220);
  addText(
    slide,
    "Les entrées Dashboard, Utilisateurs, Référentiel et Alertes structurent l'outil admin autour des tâches récurrentes.",
    810,
    200,
    350,
    78,
    { size: 20, color: C.text },
  );
  addSectionLabel(slide, "En-tête", 810, 320, 220, C.blue);
  addText(
    slide,
    "Le libellé Coordination vitamine A indique que l'interface vise directement le suivi opérationnel VitA.",
    810,
    352,
    350,
    74,
    { size: 20, color: C.text },
  );
  note(slide, "Source: capture admin référentiel fournie par l'utilisateur.");
}

{
  const slide = slideBase(4, "Gestion des utilisateurs", "La capture montre la création et le suivi des comptes");
  addImage(
    slide,
    img.adminUsers,
    "Page Utilisateurs de la console administrative",
    70,
    145,
    700,
    394,
    "cover",
  );
  addBullets(
    slide,
    [
      "Le formulaire prévoit le nom complet, le téléphone, le mot de passe temporaire et le rôle.",
      "L'affectation rattache le compte à une structure, une zone ou une province.",
      "La liste à droite permet de voir les comptes actifs et leur rôle opérationnel.",
      "Cette page crée les acteurs terrain et les superviseurs.",
    ],
    825,
    165,
    330,
    88,
  );
  note(slide, "Source: capture admin utilisateurs fournie par l'utilisateur.");
}

{
  const slide = slideBase(5, "Référentiel sanitaire", "La capture montre la préparation des données de base");
  addImage(
    slide,
    img.adminReference,
    "Page Référentiel de la console administrative",
    72,
    145,
    720,
    405,
    "cover",
  );
  addBullets(
    slide,
    [
      "Les cartes Province, Zone de santé, Structure et Produit couvrent les entités visibles dans les rapports.",
      "Les listes du bas confirment les structures suivies, comme CS Binza et CS Nzanza.",
      "Le produit Vitamine A apparaît comme produit suivi avec l'unité capsule.",
      "Ce référentiel rend les formulaires plus fiables grâce à des choix contrôlés.",
    ],
    835,
    165,
    325,
    82,
  );
  note(slide, "Source: capture admin référentiel fournie par l'utilisateur.");
}

{
  const slide = slideBase(6, "Alertes opérationnelles", "La console met en évidence les situations à traiter");
  addImage(
    slide,
    img.adminAlerts,
    "Page Alertes de la console administrative",
    72,
    148,
    720,
    405,
    "cover",
  );
  addBullets(
    slide,
    [
      "Le bouton Evaluer les alertes déclenche le recalcul depuis la console.",
      "La première alerte signale CS Binza en stock critique avec environ 1 jour restant.",
      "La deuxième alerte signale CS Nzanza pour rapport manquant avant l'échéance.",
      "Les boutons à droite servent à traiter l'alerte, par exemple accuser réception ou résoudre.",
    ],
    840,
    168,
    330,
    76,
  );
  note(slide, "Sources: capture admin alertes fournie par l'utilisateur; endpoints /alerts, /alerts/evaluate et /alerts/:id.");
}

{
  const slide = slideBase(7, "Connexion mobile", "La capture montre l'entrée sécurisée pour les acteurs terrain");
  addImage(
    slide,
    img.mobileLogin,
    "Écran de connexion mobile VitA Stock",
    104,
    150,
    315,
    430,
    "cover",
    { left: 0, top: 0.22, right: 0, bottom: 0.18 },
  );
  addBullets(
    slide,
    [
      "Le champ Telephone ou email accepte les deux identifiants prévus pour les utilisateurs.",
      "Le champ Mot de passe active une connexion contrôlée avant la saisie de stock.",
      "Le bouton Se connecter donne un parcours simple aux relais et infirmiers.",
      "Le visuel reprend l'identité VitA Stock avec le symbole de santé.",
    ],
    520,
    180,
    610,
    76,
  );
  note(slide, "Sources: capture mobile login; lib/features/auth/data/auth_repository.dart et écrans d'authentification Flutter.");
}

{
  const slide = slideBase(8, "Formulaire mobile de stock", "La capture montre les champs nécessaires au rapport terrain");
  addImage(
    slide,
    img.mobileStock,
    "Formulaire mobile de saisie de stock",
    95,
    126,
    300,
    530,
    "contain",
  );
  addBullets(
    slide,
    [
      "L'utilisateur connecté apparaît en haut avec son rôle de relais communautaire.",
      "Le formulaire demande la structure de santé, le produit et la période Début/Fin.",
      "Les champs Quantité reçue, Quantité distribuée et Quantité disponible couvrent le suivi stock.",
      "La bascule Rupture déclarée et le commentaire ajoutent le contexte opérationnel.",
      "Le bouton Enregistrer finalise la saisie terrain.",
    ],
    520,
    162,
    610,
    66,
  );
  note(slide, "Sources: capture mobile formulaire; lib/features/stock/data/stock_repository.dart et lib/features/stock/presentation/stock_entry_screen.dart.");
}

{
  const slide = slideBase(9, "Flux observé dans les écrans", "Les captures montrent le lien entre administration et terrain");
  addBox(slide, 88, 160, 500, 330, C.white, C.line);
  addBox(slide, 692, 160, 500, 330, C.white, C.line);
  addText(slide, "Côté admin web", 124, 205, 360, 38, {
    size: 28,
    bold: true,
    color: C.green,
  });
  addText(
    slide,
    "Créer les comptes\nPréparer le référentiel\nÉvaluer les alertes\nSuivre les statuts",
    124,
    275,
    380,
    160,
    { size: 23, color: C.text },
  );
  addText(slide, "Côté mobile", 730, 205, 360, 38, {
    size: 28,
    bold: true,
    color: C.blue,
  });
  addText(
    slide,
    "Se connecter\nChoisir la structure\nRenseigner les quantités\nDéclarer une rupture",
    730,
    275,
    410,
    160,
    { size: 23, color: C.text },
  );
  note(slide, "Synthèse visuelle basée sur les captures fournies.");
}

{
  const slide = slideBase(10, "Ce que les captures permettent de défendre", "Le projet dispose déjà d'une démonstration exploitable");
  addBullets(
    slide,
    [
      "Un administrateur peut créer les comptes et organiser le référentiel sanitaire.",
      "Un responsable peut ouvrir l'écran Alertes pour voir les structures à risque.",
      "Un acteur terrain peut se connecter sur mobile et renseigner un rapport de stock complet.",
      "Les prochaines démonstrations doivent montrer le dashboard rempli avec les données remontées du mobile.",
      "Les SMS et l'assistant LLM peuvent venir après stabilisation du flux visible dans ces écrans.",
    ],
    92,
    162,
    1030,
    72,
  );
  addText(
    slide,
    "Priorité recommandée: stabiliser les règles d'accès, les tests et le pilotage opérationnel avant les automatisations avancées.",
    94,
    560,
    1030,
    44,
    { size: 21, bold: true, color: C.ink },
  );
  note(slide, "Synthèse de recommandations basée sur l'état actuel du projet et les objectifs exprimés par l'utilisateur.");
}

const expectedSlideSizeEmu = "12192000,6858000";
const requirements = {
  explicitTotalSlideCount: 10,
  requiredNativeTableOwnerSlides: [],
  requiredNativeChartOwnerSlides: [],
};
const fontPolicy = { basis: "design", families: [family] };

const stagingDir = path.join(workspaceDir, ".codex-finalizer");
await fs.mkdir(stagingDir, { recursive: true });
const candidatePath = path.join(stagingDir, "candidate_vita_evolution.pptx");
await (await PresentationFile.exportPptx(presentation)).save(candidatePath);

const result = await finalizePresentation({
  ...requirements,
  workspaceDir,
  candidatePath,
  finalPath: FINAL_PPTX,
  pythonExecutable: RUNTIME_PYTHON,
  integrityValidatorPath: path.join(
    SKILL_DIR,
    "container_tools",
    "inspect_presentation_package_integrity.py",
  ),
  layoutValidatorPath: path.join(
    SKILL_DIR,
    "container_tools",
    "inspect_presentation_layout_geometry.py",
  ),
  layoutArgs: [
    "--expected-slide-size-emu",
    expectedSlideSizeEmu,
    "--validate-bullet-geometry",
    "--validate-heading-fit",
  ],
  requiredNativeTableOwnerSlides: [],
  fontPolicy,
  verifyArtifactToolImport: true,
  receiptPath: path.join(
    stagingDir,
    `${path.basename(FINAL_PPTX)}.validation.json`,
  ),
});

const finalPresentation = await PresentationFile.importPptx(
  await FileBlob.load(FINAL_PPTX),
);
const renderDir = path.join(TMP_DIR, "rendered");
await fs.mkdir(renderDir, { recursive: true });
for (let index = 0; index < finalPresentation.slides.length; index += 1) {
  const slide = finalPresentation.slides.get(index);
  const preview = await slide.export({ format: "png", scale: 1 });
  await fs.writeFile(
    path.join(renderDir, `slide-${String(index + 1).padStart(2, "0")}.png`),
    new Uint8Array(await preview.arrayBuffer()),
  );
}

console.log(
  JSON.stringify(
    {
      finalPath: FINAL_PPTX,
      renderDir,
      slides: finalPresentation.slides.length,
      validation: result,
    },
    null,
    2,
  ),
);
