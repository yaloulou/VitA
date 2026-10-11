import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const RUNTIME_NODE_MODULES =
  "C:\\Users\\scs_g\\.cache\\codex-runtimes\\codex-primary-runtime\\dependencies\\node\\node_modules";
const artifactToolUrl = pathToFileURL(
  path.join(RUNTIME_NODE_MODULES, "@oai", "artifact-tool", "dist", "artifact_tool.mjs"),
).href;
const { PresentationFile, FileBlob } = await import(artifactToolUrl);

const finalPath =
  "C:\\Users\\scs_g\\vita_back\\outputs\\KSPH_VitA_Stock_Evolution_Projet_2026-09-09_v4_captures.pptx";
const renderDir =
  "C:\\Users\\scs_g\\vita_back\\.codex-build\\vita-presentation\\rendered";

await fs.mkdir(renderDir, { recursive: true });
const presentation = await PresentationFile.importPptx(await FileBlob.load(finalPath));

for (let index = 0; index < 10; index += 1) {
  const slide = presentation.slides.getItem(index);
  const preview = await slide.export({ format: "png", scale: 1 });
  await fs.writeFile(
    path.join(renderDir, `slide-${String(index + 1).padStart(2, "0")}.png`),
    new Uint8Array(await preview.arrayBuffer()),
  );
}

const montage = await presentation.export({ format: "png", montage: true, scale: 0.35 });
await fs.writeFile(
  path.join(renderDir, "contact-sheet.png"),
  new Uint8Array(await montage.arrayBuffer()),
);

console.log(JSON.stringify({ renderDir, slideCount: 10 }, null, 2));
