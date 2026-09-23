# The data

These five CSV files are the study's accumulated record and the only thing the
website reads. Update a file here and the site shows the new numbers on its next
load — no page is edited and nothing is rebuilt.

`month` is always `YYYY-MM`. An empty cell means **not reported or not in
service**, which is not the same as zero; the site leaves those out of a
calculation rather than counting them as nothing.

---

## traffic_monthly.csv

One row per corridor, direction and month.

| Column | Meaning |
|---|---|
| `month` | Month of the count |
| `corridor` | One of the nine gateway roads into downtown |
| `direction` | `incoming` (toward downtown) or `outgoing` |
| `vehicles_per_day` | Average vehicles per day during that month |

Source: StreetLight network performance exports, run monthly under the City's
subscription. A quarter is the **average** of its months, never a sum: each
value is already an average day.

## people_monthly.csv

One row per group and month.

| Column | Meaning |
|---|---|
| `month` | Month |
| `segment` | `visitors`, `employees` or `residents` |
| `visits` | Trips into the study area that month |
| `people` | Distinct people seen that month |
| `visits_per_person` | `visits` ÷ `people`, as supplied |
| `avg_dwell_minutes` | Average minutes per visit |
| `panel_visits` | Raw device sample before scaling — **not a demand measure**, it grows with the panel |
| `visits_yoy` | Change against the same month a year earlier, as a fraction (`0.05` = +5%), supplied with the source data |

The July 2025 employee count is corrected during export; see
[KNOWN_ISSUES.md](../KNOWN_ISSUES.md).

Source: Placer.ai via Discover Kalamazoo. Visits add up over a quarter; people
and dwell time are averaged, because the same person recurs across months.

**The study area boundary changed after the City's Q3-2024 feedback.** Visit
counts step up from January 2025. Use `visits_yoy` to compare across that line.

## parking_monthly.csv

One row per facility, time window and month.

| Column | Meaning |
|---|---|
| `month` | Month of the count |
| `time_window` | `Weekday afternoon`, `Weekday evening` or `Weekend evening` |
| `facility_type` | `On-street`, `Ramps` or `Surface lots` |
| `facility` | Zone 1–3, Ramp 2–3, Lot 1–20 |
| `spaces` | Inventory for that facility |
| `occupied` | Vehicles counted |

Source: City of Kalamazoo occupancy counts. One count per window per month —
not a continuous measurement, and public counted facilities only. January 2024
has no counts at all.

## transit_monthly.csv

One row per stop and month.

| Column | Meaning |
|---|---|
| `month` | Month |
| `stop_id` | K-Metro stop number. **1004 and 1011 are the Transit Center** |
| `stop_name` | Stop name as given in the workbook |
| `boardings` | People getting on |
| `alightings` | People getting off |

Source: Kalamazoo Metro. Boardings + alightings are passenger movements, not
people: a transfer at the Transit Center counts twice.

## metrics_extra.csv

One row per quarter, for the report metrics that come from outside this dataset.
Fill these in each quarter from the quarterly report.

| Column | Meaning |
|---|---|
| `quarter` | `YYYY-Qn` |
| `businesses` | Number of downtown businesses |
| `floor_space_sf` | Total floor space, square feet |
| `space_occupancy_rate` | Fraction, `0.95` = 95% |
| `travel_time_delay_pct` | Fraction above free-flow travel time, `0.067` = 6.7% |
| `source` | Where the figure came from, for traceability |

Leave a cell empty if the quarter's figure is not available; the site shows a
dash. Floor space for 2026 is recorded as 40,112,921 and 40,104,921 square feet;
the quarterly report prints these with a decimal point ("40,112.921"), which
reads as a thousands-separator slip against the 40,049,764 given for 2025 Q2.

---

## Updating

**With the workbooks** (preferred):

```
python tools/export_from_excel.py --source "D:/Downtown/Final data KZOO"
```

It reads the four workbooks, never writes to them, and rewrites the four monthly
CSVs. Review the diff, then commit.

**By hand:** open a CSV in Excel or a text editor and add the new rows, keeping
the column order and the `YYYY-MM` month format. Save as CSV, not as a workbook.
