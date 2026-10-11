import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const RUNTIME_NODE =
  "C:\\Users\\scs_g\\.cache\\codex-runtimes\\codex-primary-runtime\\dependencies\\node\\bin\\node.exe";
const RUNTIME_NODE_MODULES =
  "C:\\Users\\scs_g\\.cache\\codex-runtimes\\codex-primary-runtime\\dependencies\\node\\node_modules";
const RUNTIME_PYTHON =
  "C:\\Users\\scs_g\\.cache\\codex-runtimes\\codex-primary-runtime\\dependencies\\python\\python.exe";
const SKILL_DIR =
  "C:\\Users\\scs_g\\.codex\\plugins\\cache\\openai-primary-runtime\\presentations\\26.904.11930\\skills\\presentations";
const workspaceDir = "C:\\Users\\scs_g\\vita_back";
const TMP_DIR = path.join(workspaceDir, ".codex-build", "vita-presentation-3slides");
const FINAL_PPTX = path.join(
  workspaceDir,
  "outputs",
  "KSPH_VitA_Stock_presentation_3_slides_captures_v2.pptx",
);

process.env.RUNTIME_NODE = RUNTIME_NODE;
process.env.RUNTIME_NODE_MODULES = RUNTIME_NODE_MODULES;
process.env.SKILL_DIR = SKILL_DIR;
process.env.TMP_DIR = TMP_DIR;

const artifactToolUrl = pathToFileURL(
  path.join(RUNTIME_NODE_MODULES, "@oai", "artifact-tool", "dist", "artifact_tool.mjs"),
).href;
const { Presentation, PresentationFile, FileBlob } = await import(artifactToolUrl);
const { resolvePresentationFont, finalizePresentation } = await import(
  pathToFileURL(path.join(SKILL_DIR, "container_tools", "artifact_tool_utils.mjs")).href,
);

await fs.mkdir(TMP_DIR, { recursive: true });
await fs.mkdir(path.dirname(FINAL_PPTX), { recursive: true });

const imagePaths = {
  alertsA: "C:\\Users\\scs_g\\Downloads\\WhatsApp Image 2026-09-05 at 16.05.43.jpeg",
  alertsB: "C:\\Users\\scs_g\\Downloads\\WhatsApp Image 2026-09-05 at 16.04.51 (2).jpeg",
  reference: "C:\\Users\\scs_g\\Downloads\\WhatsApp Image 2026-09-05 at 16.04.51 (1).jpeg",
  users: "C:\\Users\\scs_g\\Downloads\\WhatsApp Image 2026-09-05 at 16.04.51.jpeg",
  mobileLogin: "C:\\Users\\scs_g\\Downloads\\WhatsApp Image 2026-09-07 at 00.28.13.jpeg",
  mobileStock: "C:\\Users\\scs_g\\Downloads\\WhatsApp Image 2026-09-07 at 11.38.23.jpeg",
};

const images = {};
for (const [key, imagePath] of Object.entries(imagePaths)) {
  images[key] = new Uint8Array(await fs.readFile(imagePath));
}

const family = resolvePresentationFont({ fontFamily: "Aptos" });
const presentation = Presentation.create({ slideSize: { width: 1280, height: 720 } });

const C = {
  bg: "#F6F8FA",
  ink: "#0F172A",
  text: "#334155",
  muted: "#64748B",
  green: "#0B7F5A",
  blue: "#285E8E",
  amber: "#B7791F",
  line: "#D8DEE6",
  white: "#FFFFFF",
};

function addText(slide, text, left, top, width, height, opts = {}) {
  const box = slide.shapes.add({
    geometry: "textbox",
    position: { left, top, width, height },
    fill: "none",
    line: { fill: "none", width: 0 },
  });
  box.text = text;
  box.text.style = {
    typeface: family,
    fontSize: opts.size ?? 18,
    bold: opts.bold ?? false,
    color: opts.color ?? C.text,
    autoFit: "shrinkText",
  };
  return box;
}

function addRule(slide, left, top, width, color = C.green) {
  slide.shapes.add({
    geometry: "rect",
    position: { left, top, width, height: 4 },
    fill: color,
    line: { fill: color, width: 0 },
  });
}

function addImage(slide, bytes, alt, left, top, width, height, fit = "cover", crop) {
  slide.images.add({
    blob: bytes,
    contentType: "image/jpeg",
    alt,
    position: { left, top, width, height },
    fit,
    ...(crop ? { crop } : {}),
  });
}

function addComment(slide, title, body, left, top, color = C.green) {
  addText(slide, title, left, top, 335, 24, {
    size: 17,
    bold: true,
    color,
  });
  addText(slide, body, left, top + 28, 350, 70, {
    size: 16,
    color: C.text,
  });
}

function addHeader(slide, number, title, subtitle) {
  slide.background.fill = C.bg;
  addText(slide, title, 64, 40, 850, 44, {
    size: 32,
    bold: true,
    color: C.ink,
  });
  addText(slide, subtitle, 66, 86, 900, 28, {
    size: 17,
    color: C.muted,
  });
  addText(slide, `0${number}`, 1170, 50, 45, 24, {
    size: 15,
    bold: true,
    color: C.muted,
  });
  addRule(slide, 66, 124, 104, number === 1 ? C.green : number === 2 ? C.amber : C.blue);
}

function addFooter(slide) {
  addText(slide, "KSPH VitA Stock", 66, 670, 220, 20, {
    size: 12,
    color: C.muted,
  });
}

function setNotes(slide, text) {
  slide.speakerNotes.textFrame.setText(text);
}

{
  const slide = presentation.slides.add();
  addHeader(
    slide,
    1,
    "Console admin: utilisateurs et référentiel",
    "Les captures montrent la préparation des comptes, des structures et du produit Vitamine A",
  );
  addImage(slide, images.users, "Console admin: création et liste des utilisateurs", 62, 150, 520, 270);
  addImage(slide, images.reference, "Console admin: référentiel sanitaire", 62, 438, 520, 190, "contain");
  addComment(
    slide,
    "Création des utilisateurs",
    "Le formulaire permet de créer un compte, choisir un rôle, définir un périmètre et affecter l'utilisateur à une structure.",
    640,
    158,
    C.green,
  );
  addComment(
    slide,
    "Comptes actifs",
    "La liste affiche les utilisateurs existants avec téléphone, rôle et statut. Elle sert au suivi des accès terrain et supervision.",
    640,
    284,
    C.green,
  );
  addComment(
    slide,
    "Référentiel sanitaire",
    "Les formulaires couvrent province, zone de santé, structure et produit. Vitamine A apparaît comme produit suivi en capsule.",
    640,
    462,
    C.blue,
  );
  addFooter(slide);
  setNotes(slide, "Sources: captures utilisateurs et référentiel fournies par l'utilisateur.");
}

{
  const slide = presentation.slides.add();
  addHeader(
    slide,
    2,
    "Console admin: alertes opérationnelles",
    "Les deux captures montrent le même module de suivi des risques et retards de rapport",
  );
  addImage(slide, images.alertsA, "Console admin: alertes opérationnelles, capture 1", 62, 154, 545, 306);
  addImage(slide, images.alertsB, "Console admin: alertes opérationnelles, capture 2", 62, 482, 545, 130);
  addComment(
    slide,
    "Évaluer les alertes",
    "Le bouton en haut à droite permet de relancer l'analyse des situations à risque à partir des données disponibles.",
    665,
    160,
    C.amber,
  );
  addComment(
    slide,
    "Stock critique",
    "L'alerte critical_stock signale CS Binza avec environ 1 jour de stock restant pour la Vitamine A.",
    665,
    290,
    C.amber,
  );
  addComment(
    slide,
    "Rapport manquant",
    "L'alerte missing_report signale CS Nzanza lorsque le rapport attendu n'a pas été reçu à temps.",
    665,
    420,
    C.amber,
  );
  addComment(
    slide,
    "Traitement des alertes",
    "Les actions à droite de chaque ligne servent à accuser réception ou résoudre une alerte suivie par les responsables.",
    665,
    550,
    C.amber,
  );
  addFooter(slide);
  setNotes(slide, "Sources: deux captures du module Alertes fournies par l'utilisateur.");
}

{
  const slide = presentation.slides.add();
  addHeader(
    slide,
    3,
    "Application mobile: connexion et saisie stock",
    "Les captures montrent le parcours terrain, de l'identification à l'enregistrement du rapport",
  );
  addImage(
    slide,
    images.mobileLogin,
    "Application mobile: écran de connexion",
    74,
    150,
    260,
    360,
    "cover",
    { left: 0, top: 0.22, right: 0, bottom: 0.18 },
  );
  addImage(slide, images.mobileStock, "Application mobile: formulaire de saisie de stock", 378, 142, 250, 450, "contain");
  addComment(
    slide,
    "Connexion terrain",
    "L'utilisateur se connecte avec téléphone ou email et mot de passe. L'écran reprend l'identité VitA Stock.",
    695,
    152,
    C.blue,
  );
  addComment(
    slide,
    "Profil visible",
    "Le formulaire affiche l'utilisateur connecté, ici un relais communautaire, avant la saisie des données.",
    695,
    280,
    C.blue,
  );
  addComment(
    slide,
    "Formulaire complet",
    "La saisie couvre structure, produit, période, quantités reçues, distribuées et disponibles.",
    695,
    408,
    C.blue,
  );
  addComment(
    slide,
    "Rupture déclarée",
    "La bascule de rupture et le commentaire optionnel ajoutent le contexte nécessaire aux superviseurs.",
    695,
    536,
    C.blue,
  );
  addFooter(slide);
  setNotes(slide, "Sources: captures de connexion mobile et formulaire de saisie stock fournies par l'utilisateur.");
}

const expectedSlideSizeEmu = "12192000,6858000";
const requirements = {
  explicitTotalSlideCount: 3,
  requiredNativeTableOwnerSlides: [],
  requiredNativeChartOwnerSlides: [],
};
const fontPolicy = { basis: "design", families: [family] };
const stagingDir = path.join(workspaceDir, ".codex-finalizer");
await fs.mkdir(stagingDir, { recursive: true });
const candidatePath = path.join(stagingDir, "candidate_vita_3slides.pptx");
await (await PresentationFile.exportPptx(presentation)).save(candidatePath);

const result = await finalizePresentation({
  ...requirements,
  workspaceDir,
  candidatePath,
  finalPath: FINAL_PPTX,
  pythonExecutable: RUNTIME_PYTHON,
  integrityValidatorPath: path.join(SKILL_DIR, "container_tools", "inspect_presentation_package_integrity.py"),
  layoutValidatorPath: path.join(SKILL_DIR, "container_tools", "inspect_presentation_layout_geometry.py"),
  layoutArgs: [
    "--expected-slide-size-emu",
    expectedSlideSizeEmu,
    "--validate-bullet-geometry",
    "--validate-heading-fit",
  ],
  requiredNativeTableOwnerSlides: [],
  fontPolicy,
  verifyArtifactToolImport: true,
  receiptPath: path.join(stagingDir, `${path.basename(FINAL_PPTX)}.validation.json`),
});

const renderedDir = path.join(TMP_DIR, "rendered");
await fs.mkdir(renderedDir, { recursive: true });
const finalPresentation = await PresentationFile.importPptx(await FileBlob.load(FINAL_PPTX));
for (let index = 0; index < 3; index += 1) {
  const slide = finalPresentation.slides.getItem(index);
  const preview = await slide.export({ format: "png", scale: 1 });
  await fs.writeFile(
    path.join(renderedDir, `slide-${String(index + 1).padStart(2, "0")}.png`),
    new Uint8Array(await preview.arrayBuffer()),
  );
}
const montage = await finalPresentation.export({ format: "png", montage: true, scale: 0.5 });
await fs.writeFile(path.join(renderedDir, "contact-sheet.png"), new Uint8Array(await montage.arrayBuffer()));

console.log(
  JSON.stringify(
    {
      finalPath: FINAL_PPTX,
      renderedDir,
      slideCount: 3,
      validation: {
        packageIntegrity: result.packageIntegrity?.status,
        layoutWarnings: result.presentationLayout?.warning_count ?? 0,
      },
    },
    null,
    2,
  ),
);
