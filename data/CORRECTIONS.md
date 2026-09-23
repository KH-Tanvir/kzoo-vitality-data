# Corrections applied during export

The `Final data KZOO` workbooks are the source of truth and are never modified.
Where a cell is demonstrably wrong, the export corrects it and records it here,
so every figure on the site can be traced back to a cell and a reason.

| Where | What the workbook holds | What the export writes | Why |
|---|---|---|---|
| `Employees!H24` (July 2025) | `2` | `15598` | The workbook's own copy of the same figure at `H56` reads 15,598. Uncorrected, it drags the Q3-2025 employee average from about 14,950 down to 9,752, which four of the workbook's charts plot. |
| `Outgoing traffic!A11, A23, A34, A45` | `Bus US-31` | `Bus US-131` | The incoming sheet spells the same corridor `Bus US-131`. Without this the two directions never join. |
| `weekend evenings!C5` (Jan 2023, Zone 1) | `P` | *(empty)* | The cell holds a letter instead of a count. The zone is left out of January 2023's weekend-evening figure rather than guessed. The typed percentage in `C24` implies it was 219. |
| Lot 20, 2026 | no counts, 36 spaces still in the total | excluded while uncounted | The workbook keeps Lot 20's spaces in the denominator after it stopped being counted, which makes 2026 surface-lot occupancy read about three points low. |

## Known issues left alone

These are visible in the workbooks but do not reach this site, because every
figure here is recalculated from the monthly cells rather than read from a
summary.

- **Transit summary, Q3 and Q4 2023.** The workbook's summary counts the
  non-Transit-Center stops twice, adding 55,106 to each quarter (391,113 and
  394,207 instead of 336,007 and 339,101).
- **Transit summary, Q4 2024.** Reads 345,870; the stop-level sheets give
  340,186.
- **Parking quarterly formulas.** Several average the wrong months — Q1-2024 on
  the evening sheets, Q2-2025 on the weekend sheet, Q4-2025 on the afternoon
  sheet — and one August 2024 cell is typed as 20.8% where the counts give 34%.
- **`Employees!P15`** is labelled Q2-2025 but its formula covers April–June 2026.
- **Study area.** The boundary was redrawn after the City's Q3-2024 feedback, so
  visit figures step at January 2025. This is a real change in what was measured,
  not an error, and is left in place with a note on the People page.
