# AstroFITS Studio: Planetary Derotation & Deep-Sky ROI (DSO) Suite

This document outlines the complete architectural specifications and implementation details for:
1. **Planetary Derotation & Frame Stacking Suite**: Sub-pixel center-of-mass registration, physical rotational motion blur compensation, and arithmetic averaging with theoretical $\sqrt{N}$ SNR boost.
2. **Deep-Sky & Planetary Region of Interest (ROI) Suite**: Dedicated algorithmic detection, auto-centering, and detail enhancement for **Galaxies**, **Nebulae**, **Star Clusters**, and **Planets**.
3. **Gemini AI Server Integration**: Secure, zero-configuration server-side proxy powered by `@google/genai` utilizing AI Studio environment keys without requiring manual user input.

---

## 1. Deep-Sky & Planetary Region of Interest (ROI) Engine

### Algorithms by Astronomical Target Category

| Target Category | Detection Algorithm | Mathematical Formulation | ROI Detail Enhancement |
| :--- | :--- | :--- | :--- |
| **Galaxies** (e.g. M31, M51, M81) | Nuclear Peak Smoothing + 2D Central Spatial Moments | Centroid: $(\bar{x}, \bar{y}) = \left(\frac{\sum x(I - I_{th})}{\sum (I - I_{th})}, \frac{\sum y(I - I_{th})}{\sum (I - I_{th})}\right)$<br>Major axis tilt: $\theta = \frac{1}{2}\arctan2(2\mu'_{11}, \mu'_{20} - \mu'_{02})$ | Nucleus HDR tone compression (prevents burnt white galactic core) + dust lane absorption contrast boost |
| **Nebulae** (e.g. M42, M8, M45) | Morphological Diffuse Gas Segmentation (non-stellar) | Excess emission weighting: $W = \max(0, L - L_{bg}) + 1.5\max(0, R_{H\alpha} - L)$ with bounding box | Ionization core isolation (e.g. Trapezium cavity) + H-alpha/OIII shockfront saturation |
| **Star Clusters** (e.g. M13, Pleiades) | Spatial Laplacian Point Peak Grid Density | 2D spatial binning of detected point stars: $\rho(B_x, B_y) = \sum_{stars \in B} I_*$; half-light radius $R_{50}$ | Cluster core star deconvolution / anti-bloat (separates crowded core stars into crisp pinpoints) |
| **Planets** (e.g. Jupiter, Saturn, Mars) | Intensity-weighted Center of Mass (CoM) | $\bar{c} = \frac{\sum \mathbf{x} \cdot I(\mathbf{x})}{\sum I(\mathbf{x})}$, radius $R \approx \sqrt{N_{disk} / \pi}$ | Spherical disk limb recovery, atmospheric band enhancement, and Cassini ring gap isolation |

### Viewport & HUD Reticle Integration
- **Observatory Corner Reticle**: Active visual brackets `┌ ┐ └ ┘` with target-specific color theming (Purple for Galaxies, Emerald for Nebulae, Amber for Star Clusters, Cyan for Planets).
- **Interactive Manipulation**: Direct dragging of the ROI reticle on canvas, or one-click snap to center.
- **Magnification Levels**: 1× (Full Field), 2× (Framing), 4× (Core Inspection), 8× (Ultra-High Resolution).
- **Curated Celestial Presets**: 1-click loading for Andromeda Core, Whirlpool Dual Nuclei, Orion Trapezium, Pleiades Nebulosity, Hercules Globular Core, and Jupiter Belts.

---

## 2. Gemini AI Integration & API Key Security

### Environment Constraints & Zero User Burden
- Under the Google AI Studio architecture, Gemini API calls route through the server endpoint `/api/gemini/analyze-astro` in `server.ts`.
- The API key is securely injected from the runtime environment via `process.env.GEMINI_API_KEY` (or `process.env.API_KEY`).
- **No manual user key configuration is required**: Users do not need to paste or generate an API key; the system connects automatically.
- A reassuring status indicator (`AI Studio Managed Key Active • Zero Setup Required`) is displayed inside the Gemini AI modal.

---

## 3. Planetary Derotation & Multi-Frame Stacking

- **Centroid Registration**: Automatically calculates sub-pixel center of mass for each captured frame to eliminate atmospheric seeing wobble and tracking errors.
- **Rotational Compensation**: Projects spherical coordinates to cylindrical space, corrects for planet-specific angular velocity ($\omega_{Jupiter} \approx 36.58^\circ/\text{hr}$, $\omega_{Saturn} \approx 33.8^\circ/\text{hr}$), and maps back to image space.
- **Arithmetic Integration**: Uniform arithmetic averaging delivers $\sqrt{N}$ reduction in Gaussian and Poisson shot noise (e.g., $+12.04\text{ dB}$ SNR gain for 16 stacked frames).
- **Hand-off to Dwarf 3 Studio**: Direct one-click transfer of the integrated master frame to the main workspace with ADC, Wavelets, and ROI Framing active.
