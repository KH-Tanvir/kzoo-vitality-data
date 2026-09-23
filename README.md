# Downtown Kalamazoo Vitality Data — website

A small static website that publishes the measured data from the Downtown
Kalamazoo Economic Vitality Study: traffic, visits, parking and transit, monthly
since January 2023.

It has no build step, no framework and no server. The pages read the CSV files in
`data/` in the browser and draw the charts from them, so **updating a CSV in this
repository updates the website**. That is what makes the site both the study's
data store and its public output.

---

## Publish it on GitHub Pages

You only do this once. No command line is needed.

1. **Create the repository.** On [github.com](https://github.com), click **+** →
   **New repository**. Name it something like `kzoo-vitality-data`, set it to
   **Public** (GitHub Pages needs Public on a free account), and leave
   "Add a README" unticked. Click **Create repository**.

2. **Upload these files.** On the new repository's page, click
   **uploading an existing file**. Drag in *everything inside this folder* — the
   seven `.html` files, `README.md`, `.nojekyll`, and the `assets`, `data` and
   `tools` folders. Drag the folders themselves so their contents keep their
   paths. Wait for every file to finish uploading, then click **Commit changes**.

3. **Turn on Pages.** Go to **Settings** (top of the repository) → **Pages** (left
   sidebar). Under "Build and deployment", set **Source** to *Deploy from a
   branch*, **Branch** to `main` and the folder to `/ (root)`. Click **Save**.

4. **Wait about a minute,** then reload the Settings → Pages screen. It shows the
   address, which will look like:

   ```
   https://<your-username>.github.io/kzoo-vitality-data/
   ```

5. **Check it.** Open the address. The Overview page should show the scorecard
   and four trend tiles. If pages load but charts are empty, the `data` folder
   did not upload — check that `data/traffic_monthly.csv` exists in the
   repository.

### If you prefer the command line

```bash
cd kzoo-vitality-site
git init
git add .
git commit -m "Downtown Kalamazoo vitality data site"
git branch -M main
git remote add origin https://github.com/<your-username>/kzoo-vitality-data.git
git push -u origin main
```

Then do step 3 above.

---

## Update the data each quarter

After the quarterly report is finished:

1. **Re-export from the workbooks.** With Python installed (`pip install openpyxl`):

   ```
   python tools/export_from_excel.py --source "D:/Downtown/Final data KZOO"
   ```

   It reads the four workbooks and rewrites the four monthly CSVs. It never
   writes to the workbooks.

2. **Add the quarter's outside figures** to `data/metrics_extra.csv`: number of
   businesses, floor space, space occupancy rate and travel-time delay. These
   come from the quarterly report, not from this dataset.

3. **Commit the changed files.** On github.com, open the file, click the pencil
   icon, paste the new contents and commit — or push from the command line. The
   site updates within a minute.

No page needs to be edited to add a quarter. The charts, tables, scorecard and
the "latest quarter" labels all follow the data.

Anyone with write access to the repository can do this, and every change is
recorded in the repository's history, which is what makes the site usable as the
study's data store after the project ends.

---

## Look at it locally before publishing

Browsers will not load data files from a `file://` path, so double-clicking
`index.html` shows empty charts. Serve the folder instead:

```
cd kzoo-vitality-site
python -m http.server 8000
```

Then open <http://localhost:8000>.

---

## What is in here

```
index.html      Overview: the quarterly scorecard and trend tiles
traffic.html    Vehicles in and out, by corridor
people.html     Visitors, employees and residents
parking.html    Occupancy by facility and time of day
transit.html    Boardings and alightings by stop
data.html       Dictionary, downloads, method, corrections
about.html      The study, in about 250 words
assets/
  style.css     All styling, including dark mode
  charts.js     Small SVG chart toolkit (no dependencies)
  site.js       Loads the CSVs and calculates the quarterly figures
data/
  *.csv         The data — the only thing you normally change
  README.md     What every column means
  CORRECTIONS.md  Changes made during export, and why
tools/
  export_from_excel.py   Workbooks → CSV
```

## Before you make the repository public

Three things are worth settling first:

- **Licensing.** Placer.ai, StreetLight and CoStar data arrive under
  subscriptions held by the City and Discover Kalamazoo. Publishing monthly
  aggregates is very likely fine — the reports already circulate them — but
  confirm in writing before publishing the CSVs for download.
- **Branding.** The site currently uses plain text rather than institutional
  logos. Add the WMU, City, Discover Kalamazoo and Southwest Michigan First marks
  once the partners have approved how they appear.
- **Contact.** `about.html` has a placeholder where a contact address should go.

## Sources

StreetLight (traffic) · Placer.ai via Discover Kalamazoo (visits) · City of
Kalamazoo (parking) · Kalamazoo Metro (transit) · CoStar via Discover Kalamazoo
(property, in `metrics_extra.csv`).

Prepared for the Downtown Kalamazoo Economic Vitality Study, Western Michigan
University, for the City of Kalamazoo.
