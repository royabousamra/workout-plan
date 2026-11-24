# My 3-Day Strength Plan

A small, offline workout website for a 3-day full-body strength plan using dumbbells,
loop bands, a band platform and an over-the-door anchor. No bench or table needed.

Open `dist/my-workout-plan.html` in any browser. It's a single file and works offline
(only the YouTube links need internet).

## Features
- Pick Day 1, 2 or 3, then step through a warm-up and 7 exercises with Back / Next (or arrow keys).
- Each exercise shows sets and reps, muscles worked, form cues, an easier option, a platform option, set check-offs and a tutorial video link.
- Animated demos (drawn in code as SVG) with a red glow on the working muscles and on-screen tempo cues, plus real start/finish photos.
- Phone layout (stacked) and a wide two-column layout for laptops and desktops that fits on one screen.

## Project layout
| Path | What it is |
|---|---|
| `src/template.html` | Page layout, styles, exercise library and the 3-day plan |
| `src/figures.js` | Animation engine: poses for each exercise, drawn as SVG every frame |
| `src/figtest.html` | Preview sheet showing each animation at five points in the movement |
| `assets/photos/` | Start/finish photos for each exercise |
| `assets/band-platform.png` | Photo of the band platform |
| `build.py` | Inlines everything into `dist/my-workout-plan.html` |

## Building
```
pip install pillow
python build.py
```

## Credits
Exercise photos are from [free-exercise-db](https://github.com/yuhonas/free-exercise-db) (public domain, Unlicense).
Animations were drawn for this project. Form cues are general guidance, not medical advice.
