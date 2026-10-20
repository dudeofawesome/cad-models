# Command Bin

A collection of Gridfinity bins and grids for storing living room media peripherals (think controllers, keyboards, mics, etc).

## Development

Uses the repository's pnpm workspace and devenv. Run these commands from the repository root:

```sh
devenv shell
pnpm install
pnpm --filter command-bin dev
```

Open the URL printed by the preview server to view `bin.brep.ts`.

```sh
pnpm --filter command-bin check
pnpm --filter command-bin verify
pnpm --filter command-bin build
```
