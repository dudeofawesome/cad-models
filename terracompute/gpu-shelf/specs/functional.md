# Functional

## Usability

- must house the entire machine and its internal cabling
- motherboard I/O must remain accessible from the front of the rack: the rear-I/O edge (Ethernet, IPMI, USB, VGA, power / reset / locator buttons) faces front, like the networking gear in the same cabinet
- normal operation requires only external Ethernet and power connections
- GPUs operate headlessly; external access to their video outputs is not required
- device adapters and breakout boards may be replaced (GPUs dropping off the bus is under investigation, and these are suspects): each must come out without removing other GPUs or unbolting structure
  - GPUs should be fixed only by their brackets, with adapters held in place by the card rather than screwed down

### Components

Published dimensions and sources are in `../references/dimensions.md`.

- 1x ASRock Rack ROME2D32GM-2T motherboard
  - proprietary form factor, no PCIe slots; all GPUs and U.2 drives connect through its onboard SlimSAS (SFF-8654 x8) connectors
  - rear I/O: 2x 10GbE RJ45, 1x IPMI RJ45, VGA, 4x USB
- 2x AMD EPYC 7742 CPU (225 W TDP each)
- 2x Dynatron A39 CPU cooler (active, 80 mm fan, 3U+)
- 32x Samsung M393A2G40DB0-CPB 16 GB DDR4 ECC RDIMM (512 GB, all slots filled)
- 8x RTX 4090 GPU
  - 4x Nvidia RTX 4090 Founders Edition 900-1G136-2530-000
  - 1x ASUS TUF Gaming 4090 OC TUF-RTX4090-O24G-GAMING
  - 1x Gigabyte RTX 4090 Aero GV-N4090AERO-OC-24GD
  - 1x GIGABYTE RTX4090 WINDFORCE V2 GV-N4090WF3V2-24GD
  - 1x MSI RTX4090 GAMING X TRIO 24G G4090GXT24
- 8x C-Payne SlimSAS PCIe gen4 device adapter (2x SlimSAS 8i in → PCIe x16 slot, 6-pin PCIe power in), one per GPU
- storage
  - 1x Samsung PM9A3 7.68 TB U.2 (2.5", 7 mm)
  - 1x Samsung PM1733 7.68 TB U.2 (2.5", 15 mm)
  - 1x Intel 670p 1 TB M.2 (mounts on the motherboard)
- GPU power: 4x Dell 1400 W server PSU D1200E-S0, each plugged into a Parallel Miner X11BRK 16-port 6-pin breakout board
  - each PSU takes a C13 to Dell-inlet adapter (~50 mm long, C13-sized) that adds to its length
  - a 5th PSU and breakout board are spares and need not be housed
  - PSU bays must accept either Dell PSU variant in use (same 195 × 85 × 40 body), and should not block slightly longer server PSUs
- motherboard power: 1x EVGA SuperNOVA 850 T2 Titanium 220-T2-0850-X1 ATX PSU
- cables
  - 16x SlimSAS SFF-8654 8i to 8i, 1 m (2 per GPU adapter, PCIe x16)
  - SlimSAS SFF-8654 8i to 2x SFF-8639 (U.2 drives)
  - 41x 24" 16 AWG 6-pin PCIe power cables (breakout boards to GPUs and device adapters)
  - 12VHPWR (16-pin) to 4x 8-pin adapters, one per GPU
  - 240 V NEMA 6-50P to 8x C13 mains cable, feeding every PSU

## Cooling

- must provide sufficient airflow to all GPUs and the rest of the machine
- airflow runs front to back, matching the cabinet's perforated front and rear doors
  - the motherboard's rear-I/O edge faces front, so air crosses the board from the I/O edge toward the SlimSAS edge; the CPU cooler fans, which currently blow toward the I/O edge, must be reversed
  - server PSUs exhaust at their cord end, so PSU cord ends face the rear
- must cool the GPUs at their full 450 W; they are power-limited to 300 W today only because cooling is lacking
- estimated heat load is ~4.3 kW at full load (8x 450 W GPUs, 2x 225 W CPUs, plus RAM, drives, fans, and PSU losses)
- should be quiet; prefer more, larger, slower fans, and accept a larger chassis to get them
- the cabinet sits in a garage whose temperature roughly tracks the house; it will also hold a ~100 W home server, a UniFi Dream Machine Pro, and a PoE switch
- cabinet-level cooling (fans on the cabinet doors or top) is acceptable in place of, or in addition to, chassis fans
- GPU video-output access and ventilation are separate requirements; any obstruction near a GPU bracket must be evaluated for its effect on airflow
- component placement must account for intake and exhaust paths, cable clearance, and cooling hardware
- cooling adequacy must be validated under representative operating load; a geometric fit alone is insufficient

## Compatibility

- must fit the user's 19" server cabinet, using measured usable depth and mounting dimensions
- chassis height is flexible; 4U is an initial suggestion only
- mains input is a single 240 V NEMA 6-50P circuit

## Cost

- budget is ~$400 for the chassis, mounting, and cooling hardware
- prefer off-the-shelf parts where they are affordable
