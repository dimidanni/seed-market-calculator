# SEED Market Calculator

Gratis statische calculator voor GitHub Pages. Onofficiële tool; geen live SEED-API en geen echte marktprijzen inbegrepen.

## Publiceren
1. Maak een publieke GitHub-repository (bijvoorbeeld `seed-market-calculator`).
2. Upload `index.html`, `app.js`, `data/market-prices.json` en desgewenst deze README naar de hoofdmap.
3. Ga naar **Settings → Pages → Build and deployment**, kies **Deploy from a branch**, branch **main**, folder **/(root)** en klik Save.
4. De website wordt normaal bereikbaar op `https://GEBRUIKERSNAAM.github.io/seed-market-calculator/`.

## Gebruik
- Items & prijzen: maak items aan en geef ask (inkoop) en bid (verkoop) op.
- Recepten: definieer de output per batch en de benodigde ingrediënten. Subrecepten worden automatisch doorgerekend.
- Calculator: selecteer product, aantal, arbeid, vaste kosten, transport en verkoopkostenpercentage.
- Data & instellingen: importeer/exporteer een back-up of haal prijzen op van een publieke HTTPS-JSON-URL met CORS-toegang.
- De gegevens staan alleen in de lokale browser (`localStorage`). Ze synchroniseren niet tussen apparaten.

## Formaat voor externe prijzen
```json
{"updatedAt":"2026-10-30T12:00:00Z","source":"approved-feed","items":[{"id":"iron-ore","name":"Iron Ore","ask":12,"bid":10}]}
```
De voorbeeldgetallen zijn fictief. De externe updater verandert alleen prijzen, niet recepten. Item-ID's moeten overeenkomen. De updater ondersteunt alleen bronnen die door de browser via CORS bereikbaar zijn.

## Beperkingen
- Geen automatische marktfeed zolang er geen toegestane databron is.
- De berekening gebruikt de beste ingevoerde prijs zonder rekening te houden met orderdiepte, beschikbaarheid, minimumlot, afronding, kwaliteitsverschillen of tijdsafhankelijke marktbewegingen.
- Craftinghoeveelheden worden lineair opgeschaald; geen batchafronding of afval.
- De belastingparameter is een algemene schatting en geen bevestiging van SEED-belastingregels.
- Geen wachtwoorden, tokens of sessiecookies in deze publieke repository opslaan.

## Klang benaderen
Officiële support: https://klang-games.eu.theymes.com/hc/en/seed/contact-us en support@klang-games.com. Vraag schriftelijk naar toegestane publieke item-/receptdata en read-only marktdata (orders, prijs, volume, society, tijdstempel), API-documentatie, toegestane cache-/updatefrequentie, CORS en attributie/licentie.

## V2 wiki and catalog

Open wiki.html from the v2 preview. All 2,110 definitions, 883 schematics and 53 categories are retained, including technical entries. Search by names, IDs, machine tags and skills; filter categories/machines/skills and inspect ingredients, outputs, raw probabilities, timing and activity details. Icons are original text placeholders; no game artwork is redistributed.

Source: the two user-supplied static exports under data/. Regenerate with node scripts/build-catalog.cjs; verify with node tests/catalog.cjs. catalog.json records the SHA-256, build ID and 142,125 source lines. Documents inherit at the root-field level; an explicitly present document replaces the parent document. Tests compare every input/output with the independent supplied export.

Wiki recipes are explicitly imported one at a time into the calculator. Existing prices and recipes are preserved. Multiple outputs, chance outputs, flagged/test/abstract recipes and variations remain wiki-only. Activity outcomes may change actual yield; imported calculations use base batches. No live prices are bundled. V2 browser storage uses seed-market-v2 and can initially read the legacy store without writing to it.

Feature changes live on feature/v2-calculator-dashboard. On main, only preview/v2 is updated; root production files stay unchanged.

### Item icons
940 SVG icons extracted from the supplied SEED ClientUICompilation asset and matched by exact item ID. Publication permission was confirmed by the user. data/item-icons.json maps catalog IDs to assets/items/. Missing mappings use a placeholder. SVGs are displayed as images, never injected into the DOM. The archive, game binaries and launcher files are not part of this repository.
