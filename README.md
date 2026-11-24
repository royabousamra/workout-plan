# My Strength Plan

A small, offline workout website for a 3-day or 4-day strength plan using dumbbells,
loop bands, a band platform and an over-the-door anchor. No bench or table needed.

Open `dist/my-workout-plan.html` in any browser. It's a single file and works offline
(only the YouTube links need internet).

## Features
- **Two programs:** 3 days a week (full body A/B/C) or 4 days a week (upper/lower split). The choice is remembered.
- **Guided workouts:** a warm-up and 7 exercises per day with Back / Next (or arrow keys). Each exercise shows sets and reps, muscles worked, form cues, an easier option, a platform option and a tutorial video link.
- **Remembers your progress:** ticked sets, what you used ("10 lb", "green band") and where you are. Leave mid-workout and continue later. Each exercise shows what you used last time.
- **Check-ins:** finishing a workout asks how it felt and logs it. You can also log a workout or other activity (a walk, a class) by hand, for any past date.
- **History:** a calendar of workout days, workouts this week against your target, a weekly streak, "Next up" on the next day in rotation, and a list of past check-ins.
- **Backup:** export and import your data as a JSON file to keep it safe or move it to another device.
- **Visuals:** animated demos (drawn in code as SVG) with a red glow on the working muscles and on-screen tempo cues, plus real start/finish photos.
- **Layouts:** stacked on phones, two columns on laptops and desktops, fitting on one screen.

Data is stored in the browser's local storage, so it stays on the device and browser you use.

## Project layout
| Path | What it is |
|---|---|
| `src/template.html` | Page layout, styles, exercise library, both programs, saving and check-ins |
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
