# Terracompute

A collection of hardware designs for Terracompute server hosting.

## Development

Uses the repository's pnpm workspace and devenv. Run these commands from the repository root:

```sh
devenv shell
pnpm install
pnpm --filter terracompute dev
```

Open the URL printed by the preview server to view `bin.brep.ts`.

```sh
pnpm --filter terracompute check
pnpm --filter terracompute verify
pnpm --filter terracompute build
```
