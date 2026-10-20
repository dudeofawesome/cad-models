{
  pkgs,
  lib,
  config,
  inputs,
  ...
}:

{
  # https://devenv.sh/packages/
  packages = with pkgs; [
    ruff
  ];

  # https://devenv.sh/languages/
  languages = {
    python = {
      enable = true;
      version = "3.14";

      venv.enable = true;
      uv = {
        enable = true;
        sync.enable = true;
      };
    };

    javascript = {
      enable = true;
      package = pkgs.nodejs_26;

      pnpm = {
        enable = true;
        install.enable = true;
      };
    };
    typescript = {
      enable = true;
    };
  };
}
