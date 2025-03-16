{
  description = "My React Native project";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs";
    devshell.url = "github:numtide/devshell";
    flake-utils.url = "github:numtide/flake-utils";
    android.url = "github:tadfisher/android-nixpkgs";
  };

  outputs = {
    self,
    nixpkgs,
    devshell,
    flake-utils,
    android,
  }:
    {
      overlay = final: prev: {
        inherit (self.packages.${final.system}) android-sdk android-studio;
      };
    }
    // flake-utils.lib.eachSystem ["aarch64-darwin" "x86_64-darwin" "x86_64-linux"] (
      system: let
        pkgs = import nixpkgs {
          inherit system;
          config.allowUnfree = true;
          overlays = [
            devshell.overlays.default
            self.overlay
          ];
        };

        androidConfig = {
          defaultBuildToolsVersion = "34.0.0"; # This value can be passed to the devshell in the future
          sdkPkgs = android.sdk.${system} (sdkPkgs:
            with sdkPkgs; [
              # Useful packages for building and testing.
              build-tools-34-0-0
              cmdline-tools-latest
              emulator
              platform-tools
              platforms-android-34

              # Other useful packages for a development environment.
              ndk-26-1-10909125
              # skiaparser-3
              sources-android-34
            ]);
        };
      in {
        packages = {
          android-sdk = androidConfig.sdkPkgs;

          # Android Studio in nixpkgs is currently packaged for x86_64-linux only.
          android-studio = pkgs.androidStudioPackages.stable;
          # android-studio = pkgs.androidStudioPackages.beta;
          # android-studio = pkgs.androidStudioPackages.preview;
          # android-studio = pkgs.androidStudioPackage.canary;
        };

        devShell = import ./devshell.nix {inherit pkgs;};
      }
    );
}
