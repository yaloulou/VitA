# Collecte des indicateurs

La collecte comprend sept modules et 24 champs. Le catalogue de reference est
`src/indicators/catalog.json`. Sa copie mobile est embarquee dans
`vita_mobile/assets/indicator-catalog.json` pour permettre la saisie sans reseau.
Lors d'une modification du catalogue, mettre a jour cette copie et la version
du formulaire avant de publier une nouvelle application.

## Regles retenues

- Periode mensuelle au format `YYYY-MM`.
- Un rapport par module, mois et perimetre (structure, zone, province ou national).
- Les champs vides restent non renseignes. Zero est une valeur explicite.
- Au moins un champ est requis. Les valeurs doivent etre des entiers positifs ou
  nuls, inferieurs ou egaux a `Number.MAX_SAFE_INTEGER`.
- Les enfants supplementes a six mois restent un indicateur separe des 6-11 mois.
  Aucun total par age ou sexe, taux de couverture ou enfant manque n'est deduit.
- Les activites de causerie et sensibilisation sont distinctes.
- Les formations comptent les effectifs declares, sans identification ni
  deduplication individuelle des personnes formees entre les mois.
- Les relais actifs sont un effectif : la synthese multi-mois retient la derniere
  valeur renseignee de chaque perimetre, puis les additionne. Les autres champs
  sont des comptes de periode qui sont additionnes.
- Les syntheses et graphiques excluent brouillons, rejets et demandes de correction.
  Seuls les rapports soumis ou valides participent aux calculs.
- Les niveaux de collecte ne sont jamais additionnes entre eux. Un rapport
  provincial et un rapport de structure peuvent concerner les memes activites.
- Le suivi des transmissions considere un rapport non-brouillon comme recu.
  Par defaut, un mois revolu sans rapport est indique en retard. Aucune relance SMS.

Ces conventions sont a confirmer avec les responsables metier, en particulier
les recoupements d'ages, les enfants manques, la periodicite des formations et
l'echeance institutionnelle de transmission.

## API

Toutes les routes exigent `Authorization: Bearer <token>` et utilisent le prefixe
`/api/v1`.

- `GET /indicators/catalog` : modules et champs.
- `GET /indicators/reports` : rapports du perimetre du compte, sans revisions.
  Filtres : `moduleId`, `period`, `provinceId`, `healthZoneId`, `facilityId`, `status`.
- `GET /indicators/reports/:id` : rapport et anciennes versions.
- `POST /indicators/reports` : creation idempotente par `clientId` (UUID).
- `PATCH /indicators/reports/:id` : correction avec `version`, `values`, `reason`,
  `status` (`draft` ou `submitted`).
- `POST /indicators/reports/:id/review` : `version`, `decision` (`validated`,
  `correction_requested` ou `rejected`) et `reason`.

Exemple de creation d'un rapport affecte a une structure :

```json
{
  "clientId": "5bcb18c2-fd7d-4dc2-b580-b4270f6f6401",
  "reportedBy": "111111111111111111111111",
  "moduleId": "supplementation",
  "period": "2026-10",
  "facilityId": "222222222222222222222222",
  "values": { "targetedChildren": 100, "supplementedChildren": 80 },
  "status": "submitted"
}
```

L'auteur est verifie contre le compte connecte. La hierarchie est reconstruite
depuis le referentiel, sans faire confiance aux identifiants parents envoyes.
Les utilisateurs non nationaux doivent avoir une affectation.
MCZ, superviseurs et administrateurs peuvent reviser un rapport de leur perimetre,
mais ne peuvent pas valider leur propre rapport. Seul l'auteur peut modifier un
brouillon ou un rapport pour lequel une correction est demandee.
Toute modification conserve l'ancienne version, les valeurs, le statut, l'auteur
du changement, la date et le motif. Les versions concurrentes retournent HTTP 409.

## Synchronisation et deploiement

Les nouveaux rapports utilisent une boite Hive distincte sur mobile. La file
d'attente est isolee par auteur ; une sauvegarde locale reste disponible si le
serveur est inaccessible. Les reprises reutilisent le meme UUID. Les conflits
ne sont pas ecrases : l'utilisateur peut confirmer un rechargement serveur.
Une application ouverte synchronise apres sauvegarde, au retour du reseau, au
retour au premier plan et a l'actualisation manuelle. Elle ne garantit pas la
synchronisation lorsque le systeme ferme l'application.

La collection `indicator_reports` est creee automatiquement. Les index uniques
sont crees au demarrage de ce nouveau module, meme en production avec autoIndex
desactive. Le compte MongoDB doit pouvoir creer les collections et index.
Aucune variable d'environnement supplementaire n'est requise.
Deployer le backend en premier, puis le frontend, puis reconstruire le mobile.
Les collections et formulaires de stocks existants sont conserves.
