# Known issues and corrections

This page records every known problem in the source data and every correction
made while exporting it, so any figure on the website can be traced back to a
cell and a reason. The website itself shows the data only; the detail lives here.

The study's `Final data KZOO` workbooks are the source of truth and are never
modified. Corrections are made by `tools/export_from_excel.py` as it writes the
CSV files.

---

## Corrections applied during export

| Where in the workbook | Workbook value | Exported value | Why |
|---|---|---|---|
| `Employees!H24` — July 2025 employees | `2` | `15598` | The workbook's own copy of the same figure, at `H56`, reads 15,598. Uncorrected, it drags the Q3-2025 employee average from about 14,950 down to 9,752, which four of the workbook's charts plot. |
| `Outgoing traffic!A11, A23, A34, A45` | `Bus US-31` | `Bus US-131` | The incoming sheet spells the same corridor `Bus US-131`. Without this the two directions of the corridor never join. |
| `weekend evenings!C5` — Zone 1, January 2023 | `P` | *(empty)* | The cell holds a letter instead of a count. The zone is left out of January 2023's weekend-evening figure rather than guessed. The typed percentage in `C24` implies it was 219. |
| Lot 20, 2026 (row 21, all parking sheets) | no counts, 36 spaces still in the total | left out while uncounted | The workbook keeps Lot 20's spaces in the denominator after the lot stopped being counted, which makes 2026 surface-lot occupancy read about three points low. |

## Where the website differs from the published quarterly reports

The website recalculates everything from the monthly cells, so it does not
inherit errors in the workbooks' summary formulas. Two measures therefore differ
from the published reports:

- **Parking utilization — about one point higher in 2026.** The reports keep
  Lot 20's 36 spaces in the denominator after the lot stopped being counted, and
  several quarterly formulas average the wrong months (see below). Q2 2026, for
  example, is 32.0% on the website and 30.9% in the report.
- **Bus passengers, Q3 and Q4 2023 — about 55,000 lower per quarter.** The
  reports' summary counts every stop other than the Transit Center twice. The
  website shows 336,007 and 339,101; the reports show 391,113 and 394,207.

- **Bus passengers, Q4 2024 and Q1 2025 — small differences.** The reports'
  summary sheet holds typed values (345,870 and 322,172) that the stop-level data
  does not reproduce; the website shows 340,186 and 322,405.

Everything else matches. For Q2 2026, for example, visits, employees, Transit
Center users, bus passengers and traffic volume are identical to the report.

## Known issues left in the source workbooks

These are visible in the workbooks but do not reach the website.

**Transit (`Transit data DA.xlsx`)**

- `Sheet3!C59` (Q3 2023) sums the stop rows plus the subtotal in row 56, so
  every street stop is counted twice; `Sheet3!C60` (Q4 2023) then adds that same
  Q3 subtotal again. Both errors add exactly 55,106. The values were typed into
  `Summary!B4:B5` and appeared on the study's original website.
- `Summary!B9` (Q4 2024) reads 345,870, which no sheet reproduces;
  `'2024 Data'!J116` gives 340,186.
- `Summary!B10` (Q1 2025) reads 322,172; `'2025 Data'!C115` gives 322,405.
- `'Transit centre data'!B13` (Q2 2024) is `=SUM(Q3:S4,Q6,Q6:S7)`, which counts
  cell `Q6` twice: 318,927 instead of 269,957.
- `'2026 Data'!B116:B117` and `'2025 Data'!C117` start their ranges one row
  late and skip stop 1 (Rose at Water). No effect today, because stop 1 has no
  counts in those periods, but it would drop the stop silently if service returns.
- The two Transit Center stops are labelled inconsistently: stop 1004 is
  "Burdickside" in `2025 Data` and `Sheet3` but "Rose Side" in
  `Transit centre data`; stop 1011 is the reverse. The quarterly reports treat
  1004 as the Rose Street side, and the website follows the reports.
- In sheet `1` (the GIS export), `Alight23` equals the sum of the monthly
  boarding columns and `Board23` the sum of the monthly alighting columns; the
  per-day fields are crossed the same way.
- `Summary!A1` is titled "Number of transit users", but the values are
  boardings plus alightings — a round trip counts at least twice.

**Parking (`Parking_Diana.xlsx`)**

- `Afternoon!V27` types August 2024's overall occupancy as 20.8%; the counts
  give about 34–35%. The Q3-2024 afternoon total in `H32` shows 31.7% instead of
  36.7%.
- `D31` on all three sheets averages row 27 (all facilities) instead of row 26
  (surface lots) for Q3 2023.
- `E31` on all three sheets averages November–December only for Q4 2023,
  leaving out October.
- `Afternoon!M29:M32` (Q4 2025) averages September–December, four months.
- `weekday evenings!F29:G31` average March–April for Q1 2024 and May–July for
  Q2 2024.
- `weekend evenings!F29:G31` and `K29:K32` average April–May (Q1 2024),
  June–August (Q2 2024) and February–April (Q2 2025).
- Row 27 ("Occupancy") mixes two methods: values typed through August 2024 are
  all vehicles divided by all 2,795 spaces, while formulas from September 2024
  average the three facility-type percentages.
- Column `O` (January 2024) is empty on all three sheets.
- `weekday evenings!D7` reads 14 for Zone 3 in February 2023; every other month
  is between 106 and 169. Probably a typo; left as is because the true value is
  unknown.

**Visitors, employees and residents (`No. of visitors , employees , residents.xlsx`)**

- `Employees!P15` is labelled "Q2-2025" but its formula averages April–June 2026.
- `Employees!Q3:Q6` (Q2 2023 to Q1 2024 averages) are blank.
- `Employees!D16` (March 2024 dwell time) is blank and `Employees!C39` reads "N/A".

**Traffic (`Traffic volumes.xlsx`)**

- The side table in `Incoming traffic!S2:V17` adds three monthly averages without
  dividing by three (Q3 2023: 256,835 = 3 × 85,612), and its outgoing values in
  `V8:V11` are typed rather than calculated.

## Data caveats (not errors)

- **The study-area boundary changed in January 2025.** After the City's Q3 2024
  feedback, the Placer.ai study area was redrawn. Visit, people and dwell-time
  figures step at January 2025 and are not directly comparable across that line;
  the `visits_yoy` column, supplied by the data provider, compares like with like.
  Visitor visits read 21% higher in 2025 than 2024 from the raw totals, while the
  provider's own comparison puts 2025 at −2.5%.
- **South Westnedge Avenue, March–October 2024.** Incoming traffic fell to about
  230 vehicles a day during roadwork. The City reported the traffic was diverted
  to Burdick Street, Oakland Drive and Portage Street; Burdick is not one of the
  nine counted corridors, so the network total dips.
- **Panel visits** is the provider's raw device sample, which grows two to four
  times over the period. It is kept in the data for reference but is not a
  measure of demand and is not charted.
- **Parking** covers public counted facilities only, one count per time window
  per month.
- **Stops out of service.** Stop 1 (Rose at Water) and stop 1079 (Rose at
  Butler) have had no service since November 2024 because of road construction.
