# Downtown Kalamazoo Vitality Data

**Live site: <https://kh-tanvir.github.io/kzoo-vitality-data/>**

The public data site for the Downtown Kalamazoo Economic Vitality Study, run by
Western Michigan University for the City of Kalamazoo. It shows traffic, visits,
parking and bus use for downtown, month by month since January 2023.

The site has no build step and no server. Its pages read the CSV files in
[`data/`](data/) in the visitor's browser and draw every chart and table from
them. **Changing a CSV in this repository changes the website** — that is what
makes this repository both the study's data store and its public output.

---

## Updating the data each quarter

Do this after each quarterly report is finished. Only repository collaborators
can make changes.

### 1. Rebuild the CSV files from the study's workbooks

With Python installed (`pip install openpyxl`), run from this folder:

```
python tools/export_from_excel.py --source "D:/Downtown/Final data KZOO"
```

The script reads the four workbooks in `Final data KZOO`, never writes to them,
and rewrites the four monthly files in `data/`. It also applies the documented
corrections listed in [KNOWN_ISSUES.md](KNOWN_ISSUES.md).

### 2. Add the quarter's outside figures

Four measures in the site's scorecard come from outside the monthly data, so they
are entered by hand in [`data/metrics_extra.csv`](data/metrics_extra.csv). Add one
row per quarter, taking the figures from the quarterly report:

| Column | Enter | Example |
|---|---|---|
| `quarter` | The quarter, as `YYYY-Qn` | `2026-Q3` |
| `businesses` | Number of downtown businesses | `1582` |
| `floor_space_sf` | Total floor space, square feet, no commas | `40104921` |
| `space_occupancy_rate` | As a fraction — 95% is `0.95` | `0.95` |
| `travel_time_delay_pct` | As a fraction — 6.7% is `0.067` | `0.067` |
| `source` | Where the figures came from | `Report_09 2026 Q3 scorecard` |

Leave a cell empty if a figure is not available; the site shows a dash.

### 3. Put the changed files on GitHub

**On github.com (no software needed):** open the repository, go into the `data`
folder, click **Add file → Upload files**, drag in the changed CSV files (same
names, so they replace the old ones), and click **Commit changes**.

**For a small edit to one file:** open the file on github.com, click the pencil
icon, change the text and click **Commit changes**. Keep the column order and the
`YYYY-MM` month format.

**From the command line:** `git add data && git commit -m "Data to 2026 Q3" && git push`.

### 4. Check the site

Open the live site a few minutes later (refresh with Ctrl+F5 if it looks
unchanged). The Overview page's "Latest quarter" heading should show the new
quarter. No page needs editing: the charts, tables, scorecard, date range and
"What the data shows" figures all follow the data.

---

## Known issues and corrections

Problems found in the source workbooks, corrections made during export, and the
places where the website differs from the published quarterly reports are all
recorded in **[KNOWN_ISSUES.md](KNOWN_ISSUES.md)**. The website links to it from
every page footer but does not describe the issues itself.

Column-by-column definitions of the data files are in
**[data/README.md](data/README.md)**.

---

## Editing the website's text

Each page is a plain HTML file. The text sits between the tags and can be edited
directly on github.com with the pencil icon.

| Page | File |
|---|---|
| Overview | `index.html` |
| Traffic | `traffic.html` |
| People | `people.html` |
| Parking | `parking.html` |
| Transit | `transit.html` |
| Data | `data.html` |
| About | `about.html` |

Some sentences on the Overview, Parking and Transit pages include figures that
are filled in from the data when the page loads (for example the latest quarter
and the Transit Center's share). Those are set in the `<script>` at the bottom of
each page; the rest of the page is ordinary text.

## Look at it on your own computer

Browsers will not load data files from a `file://` path, so double-clicking
`index.html` shows empty charts. Serve the folder instead:

```
python -m http.server 8000
```

Then open <http://localhost:8000>.

## What is in here

```
index.html          Overview: welcome, scorecard, trends, what the data shows
traffic.html        Vehicles in and out, by road
people.html         Visitors, employees and residents
parking.html        Occupancy by facility and time of day
transit.html        Boardings and alightings by stop
data.html           Downloads, method and how to update
about.html          The study, briefly
KNOWN_ISSUES.md     Data problems, corrections and differences from the reports
assets/
  style.css         All styling, including dark mode
  charts.js         Small chart toolkit (no dependencies)
  site.js           Loads the CSV files and calculates the quarterly figures
data/
  *.csv             The data — the files you update each quarter
  README.md         What every column means
tools/
  export_from_excel.py   Workbooks → CSV files
```

## Publishing

The site is served by GitHub Pages from the `main` branch, root folder
(**Settings → Pages**). Any commit to `main` republishes it within a minute or
two.

## Before sharing widely

- **Licensing.** Placer.ai, StreetLight and CoStar figures arrive under
  subscriptions held by the City and Discover Kalamazoo. Monthly aggregates are
  very likely fine to publish, since the quarterly reports already circulate
  them, but confirm this in writing.
- **Logos.** The header uses plain text; partner logos can be added once approved.
- **Contact.** `about.html` has a marked placeholder where a contact address
  should go.

## Sources

StreetLight InSight (traffic) · Placer.ai via Discover Kalamazoo (visits,
employees, residents) · Discover Kalamazoo (parking) · Kalamazoo Metro (transit)
· CoStar via Discover Kalamazoo (businesses, floor space, occupancy) · Google
Maps (travel time).
