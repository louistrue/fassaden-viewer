# 🏠 Fassaden Viewer

Ein interaktiver 3D-Viewer zur Visualisierung von Holzfassaden mit verschiedenen Behandlungen und Alterungszuständen. Entwickelt mit React, Three.js und Vite.

## 🎥 Demo

![Fassaden Viewer Demo](public/demo.gif)
*(Das Demo-GIF zeigt möglicherweise nicht alle aktuellen Features.)*

## ✨ Features

- **Realistische 3D-Darstellung:** Visualisieren Sie Holzfassadenmodelle im Detail..
- **Materialauswahl:**
    - **Holzarten:** Wählen Sie aus verschiedenen Holztypen (z.B. Fichte/Tanne).
    - **Oberflächen:** Definieren Sie die Oberflächenstruktur (z.B. gehobelt).
    - **Behandlungen:** Simulieren Sie verschiedene Oberflächenbehandlungen (unbehandelt, Lasur, deckende Farbe) inklusive Farbauswahl.
- **Alterungssimulation:** Sehen Sie, wie sich die Fassade über die Jahre optisch verändert.
- **Benutzerdefinierte Hintergründe:** Laden Sie eigene Bilder als Hintergrund für die Szene hoch.
- **Interaktive Steuerung:** Orbit-Controls zum Drehen, Zoomen und Verschieben der Ansicht.
- **Schnittansicht (Clipping):** Definieren Sie einen Bereich, um einen Querschnitt der Fassade zu betrachten (experimentell).
- **Modell-Auswahl:** Laden Sie verschiedene vordefinierte Fassadenmodelle.

## 📂 Projektstruktur

Die wichtigsten Verzeichnisse für das Verständnis und die Anpassung der Anwendung sind:

*   `public/models/`: Enthält die `.glb` 3D-Modelle für die Fassaden.
*   `public/`: Andere statische Assets wie das Logo (`Sagerei.png`).
*   `src/`: Hauptverzeichnis des Anwendungs-Quellcodes.
    *   `components/`: React-Komponenten, unterteilt in UI-Elemente (z.B. `Header`, `Toolbar`) und 3D-Szenenlogik (z.B. `FacadeViewer`, `CustomModel`, `SceneController`).
    *   `config/`: Konfigurationsdateien, insbesondere `constants.ts` für Materialdefinitionen (Holzarten, Farben etc.).
    *   `utils/`: Hilfsfunktionen, z.B. `modelUtils.ts` zum Laden der verfügbaren Modelle.
    *   `App.tsx`: Die Haupt-React-Komponente, die alles zusammenfügt.
    *   `main.tsx`: Der Einstiegspunkt der Anwendung, der die React-App rendert.

## 🛠️ Konfiguration

Die primären Konfigurationsoptionen (Holzarten, Oberflächen, Farben, etc.) befinden sich in `src/config/constants.ts`. Hier können Sie die verfügbaren Auswahlmöglichkeiten anpassen.

## 🧩 Eigene Modelle hinzufügen

1.  Platzieren Sie Ihre `.glb`-Modelldateien im Verzeichnis `public/models/`.
2.  Die Anwendung lädt Modelle aus diesem Verzeichnis automatisch. Der Dateiname (ohne `.glb`) wird in der Modellauswahl angezeigt.
    *Hinweis: Stellen Sie sicher, dass die Modelle korrekt skaliert und ausgerichtet sind.*

## 🚀 Erste Schritte

### Voraussetzungen

- Node.js (Version 18 oder höher empfohlen)
- npm oder pnpm (oder yarn)

### Installation

1.  **Repository klonen:**
    ```bash
    git clone https://github.com/ihr-username/fassaden-viewer.git
    cd fassaden-viewer
    ```
2.  **Abhängigkeiten installieren:**
    ```bash
    npm install
    # oder
    pnpm install
    ```

### Entwicklung

Starten Sie den Vite-Entwicklungsserver:
```bash
npm run dev
# oder
pnpm dev
```
Öffnen Sie die angezeigte URL (normalerweise `http://localhost:5173`) in Ihrem Browser.

### Build

Erstellen Sie einen optimierten Produktions-Build:
```bash
npm run build
# oder
pnpm build
```
Die fertigen Dateien befinden sich im `dist`-Verzeichnis.

## 💻 Technologie-Stack

- **UI Framework:** [React](https://reactjs.org/) 18+
- **3D Rendering:** [Three.js](https://threejs.org/)
- **React Renderer für Three.js:** [React Three Fiber](https://docs.pmnd.rs/react-three-fiber) (`@react-three/fiber`)
- **Three.js Helpers für R3F:** [Drei](https://github.com/pmndrs/drei) (`@react-three/drei`)
- **GUI Controls:** [Leva](https://github.com/pmndrs/leva)
- **Build-Tool & Dev Server:** [Vite](https://vitejs.dev/)
- **Sprache:** [TypeScript](https://www.typescriptlang.org/)

## 🙌 Mitwirken (Contributing)

Beiträge sind willkommen! Wenn Sie Fehler finden oder Verbesserungsvorschläge haben:

1.  Forken Sie das Repository.
2.  Erstellen Sie einen neuen Branch (`git checkout -b feature/IhrFeatureName`).
3.  Machen Sie Ihre Änderungen.
4.  Committen Sie Ihre Änderungen (`git commit -m 'Add some feature'`).
5.  Pushen Sie zum Branch (`git push origin feature/IhrFeatureName`).
6.  Öffnen Sie einen Pull Request.

## 📄 Lizenz

Dieses Projekt steht unter der **GNU Affero General Public License v3.0 (AGPL-3.0)**. Siehe [LICENSE](LICENSE) für Details.

**Wichtiger Hinweis zur AGPL-3.0:** Diese Lizenz erfordert, dass der vollständige Quellcode aller Modifikationen und abgeleiteter Werke offengelegt wird, auch wenn die Software nur über ein Netzwerk (z. B. als Webanwendung) bereitgestellt wird. Wenn Sie diese Software verwenden oder modifizieren, müssen Sie sicherstellen, dass die Benutzer des Netzwerkdienstes Zugriff auf den entsprechenden Quellcode erhalten.
