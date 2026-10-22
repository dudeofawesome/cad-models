# Terracompute

A collection of hardware designs for Terracompute server hosting.

## Development

Uses the repository's pnpm workspace and devenv. Run these commands from the repository root:

```sh
devenv shell
pnpm install
pnpm --filter terracompute dev:references
```

Open the URL printed by the preview server to view the motherboard reference model. Pass another `.brep.ts` path to `brep --serve` to view a different part.

```sh
pnpm --filter terracompute check
pnpm --filter terracompute verify:references
pnpm --filter terracompute verify:layout
pnpm --filter terracompute export
```
