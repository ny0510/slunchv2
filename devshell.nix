{pkgs}:
with pkgs;
  devshell.mkShell {
    name = "android-project";
    motd = ''
      Entered the Android app development environment.
    '';
    env = [
      {
        name = "ANDROID_HOME";
        value = "${android-sdk}/share/android-sdk";
      }
      {
        name = "ANDROID_SDK_ROOT";
        value = "${android-sdk}/share/android-sdk";
      }
      {
        name = "JAVA_HOME";
        value = jdk17.home;
      }
      {
        name = "GRADLE_OPTS";
        value = "-Dorg.gradle.project.android.aapt2FromMavenOverride=${aapt}/bin/aapt2"; # Using the nixpkgs aapt2 to resolve an issue with dynamically linked executables
      }
      {
        name = "PATH";
        prefix = "${android-sdk}/share/android-sdk/emulator";
      }
      {
        name = "PATH";
        prefix = "${android-sdk}/share/android-sdk/platform-tools";
      }
    ];
    commands = [
      {
        help = "take screenshot of connected android device";
        name = "adbcap";
        command = "adb exec-out screencap -p > /tmp/screen-$(date +%Y-%m-%d-%H.%M.%S).png";
      }
    ];
    packages = [
      android-studio
      android-sdk
      gradle
      jdk17
      aapt
    ];
  }

