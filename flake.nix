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
          defaultBuildToolsVersion = "35.0.0"; # This value can be passed to the devshell in the future
          sdkPkgs = android.sdk.${system} (sdkPkgs:
            with sdkPkgs; [
              # Useful packages for building and testing.
              build-tools-35-0-0
              build-tools-34-0-0
              cmdline-tools-latest
              emulator
              platform-tools
              platforms-android-35
              platforms-android-31

              # Other useful packages for a development environment.
              ndk-29-0-13113456
              # skiaparser-3
              sources-android-35

              system-images-android-35-google-apis-x86-64
              system-images-android-35-google-apis-playstore-x86-64
              cmake-3-22-1
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
