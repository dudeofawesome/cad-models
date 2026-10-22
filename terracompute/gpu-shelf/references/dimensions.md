# Component dimensions

Dimensions for the parts in `../specs/functional.md`, from published specs and the user's own measurements (October 2026), as input for the reference bodies. Units: mm. "Non-mfr" means a reseller, review, or mirror rather than the manufacturer. Anything marked **measure** has no reliable published figure.

## Motherboard: ASRock Rack ROME2D32GM-2T

Board frame used below: looking down at the component side with the rear-I/O (Ethernet) edge nearest you. X runs from the left edge, Y from the I/O edge.

- 420 × 351, per the [user manual](https://download.asrock.com/Manual/ROME2D32GM-2T.pdf) layout drawing (section 1.4)
  - user tape measurements: 16 9/16" (420.7) side to side, ~13 3/4" ± 1/8" (349 ± 3) front to back. These agree with the manual; the [product page](https://www.asrockrack.com/general/productdetail.asp?Model=ROME2D32GM-2T)'s 16.53" × 14.56" is wrong
- the manual says "proprietary form factor"; the hole pattern matches no standard (ATX, EEB, etc.)
- 9 mounting points. "Manual" values are scaled from the manual's layout drawing. "Photo" values come from a straight-down photo of the bare board, fitted to the other holes, and are good to about ±5:

  | Hole | X | Y | Source |
  |---|---|---|---|
  | front-left | 9.3 | 19.3 | caliper (manual: 8.1, 18.8) |
  | front, second from left | 174.4 | 19.2 | caliper, 6.5" + 9.3 from the left edge; not in the manual drawing |
  | front-right | 411.7 | 9.1 | caliper, 9.00 from the right edge (manual: 411.9, 8.8) |
  | left, middle | ~8 | 140 | Y caliper; X photo (in line with the other left holes); not in the manual drawing |
  | right, middle | ~412 | 140 | Y caliper; X photo (in line with the other right holes); not in the manual drawing |
  | center | 208.6 | 122 | Y caliper (manual 123.3); X manual |
  | back-left | 8.1 | 343.5 | manual |
  | back-right | 411.9 | 343.5 | manual |
  | back, middle | 223.2 | 341.9 | manual; this is a captive thumbscrew (green on the board), not a plain hole |

  - the manual draws the holes as keyhole slots, and the user found some slotted: server-style mounting, where the board drops onto shouldered standoffs, slides, and the thumbscrew locks it
  - the current plywood mounting board has these holes drilled, so it can serve as a drilling template
- key features, from the manual drawing (approximate):
  - CPU sockets: X 66–143 and X 276–352, both at Y 156–273; coolers sit on these
  - DIMM banks (~40 tall): X 3–62, 147–203, 214–271, 357–415, all at Y 147–306
  - SlimSAS, positions measured from a photo the user annotated (2026-10-21), mapped through the mounting holes (±3):
    - 8 side-entry along the back edge, Y 333–351, cables plugging in from behind: X 77.5–102.4, 107.3–132, 133.7–158.4, 163.3–187.7, 302.3–326, 331–355.1, 356.6–380.5, 386–409.3
    - 11 vertical-entry, ~11.5 × 28.5, cables plugging in from above: 4 at X 14.8–68 and 4 at X 239.9–295.3 (both Y 313–342), plus 3 near the front: X 52.6–64.2 and 67–79.1 (Y 79–110), X 340.9–352 (Y 81–109)
    - these are ~8 to the right of where the manual's drawing puts them; the photo is the better source
  - 24-pin ATX and one 8-pin: left edge, Y 36–108. Second 8-pin: right edge, Y 91–109
- 19x SlimSAS SFF-8654 x8 (PCIe 4.0), no PCIe slots, 1x M.2
- power in: 1x 24-pin ATX, 2x 8-pin 12 V
- 8x 6-pin fan headers

## CPU cooler: Dynatron A39

- 120 × 82 × 110 mm (L × W × H) ([Dynatron](https://www.dynatron.co/product-page/a39))
- 80 × 80 × 38 mm fan, 102.6 CFM; rated 280 W
- airflow: each fan is mounted on the cooler side facing the I/O edge and currently blows toward the I/O edge (user check, 2026-10-21); the fans can be flipped, and must be, since the I/O edge will face the front of the rack
- height above the PCB is assumed ~115 (110 cooler on the socket)

## GPUs

L = length, H = height from slot edge, T = thickness. Slot counts in brackets are thickness ÷ 20.32 mm, not published figures. All cards take a single 16-pin 12VHPWR connector.

| Card | L × H × T | Slots | Source |
|---|---|---|---|
| Nvidia RTX 4090 Founders Edition (×4) | 304 × 137 × 61 | 3 | [Nvidia](https://www.nvidia.com/en-us/geforce/graphics-cards/40-series/rtx-4090/) |
| ASUS TUF RTX 4090 OC | 348.2 × 150 × 72.6 | 3.65 | [ASUS](https://www.asus.com/motherboards-components/graphics-cards/tuf-gaming/tuf-rtx4090-o24g-gaming/techspec/) |
| Gigabyte RTX 4090 Aero OC | 342 × 150 × 75 | [3.7] | [Gigabyte](https://www.gigabyte.com/Graphics-Card/GV-N4090AERO-OC-24GD/sp) |
| Gigabyte RTX 4090 Windforce V2 | 331 × 136 × 55.5 | [2.7] | [Gigabyte](https://www.gigabyte.com/Graphics-Card/GV-N4090WF3V2-24GD-rev-10-11/sp) |
| MSI RTX 4090 Gaming X Trio | 337 × 140 × 77 | [3.8] | [MSI](https://www.msi.com/Graphics-Card/GeForce-RTX-4090-GAMING-X-TRIO-24G/Specification) |

- the Windforce V2's power connector exits sideways through a heatsink cutout (non-mfr review)
- 16-pin cable clearance beyond the card edge: assumed 55 (~20 plug + 35 straight run before bending, the usual 12VHPWR guidance) unless measured

## GPU device adapter: C-Payne SlimSAS PCIe gen4 x8/x16 (CP-0200, rev 1.0)

User caliper measurements (2026-10-21). Frame: component side up, 6-pin power connector at top left, x16 slot along the right edge. X from the left edge, Y from the bottom edge.

- PCB 40 (X) × 140 (Y); thickness not measured, assume 1.6
- mounting holes ⌀3.7 (M3 clearance) at (13.9, 105), (34.5, 105), (13.9, 5.5), (34.5, 5.5)
- x16 slot: contact centerline at X 34.1; bottom end of the contact slot at Y 13.6
  - plastic housing: ~7.2 wide (X 30.5–37.7), bottom end at Y 11.6, 11.5 tall above the PCB
  - housing 89 long, so its top end is at Y 100.6
- 2x SlimSAS 8i connectors, 8.3 tall; the plugs insert toward −Y, so both cables leave toward +Y (the 6-pin end)
  - the lower connector's cable lies over the upper connector; both SlimSAS cables and the 6-pin cable run parallel off the top (+Y) edge
  - SlimSAS cable minimum bend radius ~25 (1")
- 6-pin power connector 12 tall
- underside: solder joints protrude 2
- [C-Payne](https://c-payne.com/products/slimsas-pcie-gen4-device-adapter-x8-x16)

## Power supplies

### Dell server PSU (D1200E-S0 and a second Dell variant)

User caliper measurements (2026-10-21). Both variants in use share this size, and the design should accept either.

- body 195 (L) × 85 (W) × 40 (H)
- edge connector (blade) extends ~10 beyond the body at the front
- handle extends 34.55 beyond the body at the back
- D1200E-S0 inlet is Dell-proprietary; a solid C13-to-Dell adapter adds 56 beyond the body at the back. The other variant takes a plain cord
- airflow exhausts at the back (cord and handle end), as is usual for front-to-back server PSUs
- 1400 W at 200–240 V (non-mfr)

### Parallel Miner X11BRK breakout board

User caliper measurements (2026-10-21).

- PCB 100.6 wide (along the PSU edge-connector slot) × 104 deep (along the PSU's length)
- a plastic bottom plate puts the PCB top 7.75 above the plate's underside. Without the plate: 1.7 PCB with 2 solder joints underneath
- 16x 6-pin connectors, 13 tall above the PCB; cables plug in from above and need ~30 above the connectors to bend
- no fan ([Parallel Miner](https://www.parallelminer.com/product/x11-breakout-board-adapter/))

### PSU and breakout board plugged together

- the board sits 1.5 from the PSU body
- the board's plate underside is 8.1 lower than the PSU's underside, so the PSU must sit on an 8.1 riser (or the board in a recess)
- overall length ≈ 56 adapter + 195 body + 1.5 gap + 104 board ≈ 357 (≈ 335 with the handle instead of the adapter), plus the mains cord behind
- overall height ≈ 51 from the plate underside: PSU top 48.1, cables bending at 7.75 + 13 + 30 = 50.75
- width ≈ 101 (the board is wider than the 85 PSU), so 4 sets side by side are ~404 wide

### EVGA SuperNOVA 850 T2

- 150 × 180 × 85 (W × L × H), 140 mm fan ([EVGA](https://www.evga.com/products/product.aspx?pn=220-T2-0850-X1))

## Storage

- Samsung PM9A3 7.68 TB: 100.2 × 69.85 × 7 mm (non-mfr)
- Samsung PM1733 7.68 TB: 100.2 × 69.85 × 15 mm (non-mfr)

## Power draw

- RTX 4090: 450 W total graphics power ([Nvidia](https://www.nvidia.com/en-us/geforce/graphics-cards/40-series/rtx-4090/))
- EPYC 7742: 225 W TDP ([AMD datasheet](https://www.amd.com/content/dam/amd/en/documents/products/epyc/amd-epyc-7002-series-datasheet.pdf))
