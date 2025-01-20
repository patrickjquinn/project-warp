Upgrade from Tauri 1.0
This guide walks you through upgrading your Tauri 1.0 application to Tauri 2.0.

Preparing for Mobile
The mobile interface of Tauri requires your project to output a shared library. If you are targeting mobile for your existing application, you must change your crate to produce that kind of artifact along with the desktop executable.

Change the Cargo manifest to produce the library. Append the following block:
src-tauri/Cargo.toml
[lib]
name = "app_lib"
crate-type = ["staticlib", "cdylib", "rlib"]

Rename src-tauri/src/main.rs to src-tauri/src/lib.rs. This file will be shared by both desktop and mobile targets.

Rename the main function header in lib.rs to the following:

src-tauri/src/lib.rs
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // your code here
}

The tauri::mobile_entry_point macro prepares your function to be executed on mobile.

Recreate the main.rs file calling the shared run function:
src-tauri/src/main.rs
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
  app_lib::run();
}

Automated Migration
The Tauri v2 CLI includes a migrate command that automates most of the process and helps you finish the migration:

npm
yarn
pnpm
cargo
npm install @tauri-apps/cli@latest
npm run tauri migrate

Learn more about the migrate command in the Command Line Interface reference

Summary of Changes
Below is a summary of the changes from Tauri 1.0 to Tauri 2.0:

Tauri Configuration
package > productName and package > version moved to top-level object.
the binary name is no longer renamed to match productName automatically, so you must add a mainBinaryName string to the top-level object matching productName.
package removed.
tauri key renamed to app.
tauri > allowlist removed. Refer to Migrate Permissions.
tauri > allowlist > protocol > assetScope moved to app > security > assetProtocol > scope.
tauri > cli moved to plugins > cli.
tauri > windows > fileDropEnabled renamed to app > windows > dragDropEnabled.
tauri > updater > active removed.
tauri > updater > dialog removed.
tauri > updater moved to plugins > updater.
bundle > createUpdaterArtifacts added, must be set when using the app updater.
set it to v1Compatible when upgrading from v1 apps that were already distributed. See the updater guide for more information.
tauri > systemTray renamed to app > trayIcon.
tauri > pattern moved to app > security > pattern.
tauri > bundle moved top-level.
tauri > bundle > identifier moved to top-level object.
tauri > bundle > dmg moved to bundle > macOS > dmg
tauri > bundle > deb moved to bundle > linux > deb
tauri > bundle > appimage moved to bundle > linux > appimage
tauri > bundle > macOS > license removed, use bundle > licenseFile instead.
tauri > bundle > windows > wix > license removed, use bundle > licenseFile instead.
tauri > bundle > windows > nsis > license removed, use bundle > licenseFile instead.
tauri > bundle > windows > webviewFixedRuntimePath removed, use bundle > windows > webviewInstallMode instead.
build > withGlobalTauri moved to app > withGlobalTauri.
build > distDir renamed to frontendDist.
build > devPath renamed to devUrl.
Tauri 2.0 Configuration API reference

New Cargo Features
linux-protocol-body: Enables custom protocol request body parsing, allowing the IPC to use it. Requires webkit2gtk 2.40.
Removed Cargo Features
reqwest-client: reqwest is now the only supported client.
reqwest-native-tls-vendored: use native-tls-vendored instead.
process-command-api: use the shell plugin instead (see instructions in the following section).
shell-open-api: use the shell plugin instead (see instructions in the following section).
windows7-compat: moved to the notification plugin.
updater: Updater is now a plugin.
linux-protocol-headers: Now enabled by default since we upgraded our minimum webkit2gtk version.
system-tray: renamed to tray-icon.
Rust Crate Changes
api module removed. Each API module can be found in a Tauri plugin.
api::dialog module removed. Use tauri-plugin-dialog instead. Migration
api::file module removed. Use Rust’s std::fs instead.
api::http module removed. Use tauri-plugin-http instead. Migration
api::ip module rewritten and moved to tauri::ipc. Check out the new APIs, specially tauri::ipc::Channel.
api::path module functions and tauri::PathResolved moved to tauri::Manager::path. Migration
api::process::Command, tauri::api::shell and tauri::Manager::shell_scope APIs removed. Use tauri-plugin-shell instead. Migration
api::process::current_binary and tauri::api::process::restart moved to tauri::process.
api::version module has been removed. Use the semver crate instead.
App::clipboard_manager and AppHandle::clipboard_manager removed. Use tauri-plugin-clipboard instead. Migration
App::get_cli_matches removed. Use tauri-plugin-cli instead. Migration
App::global_shortcut_manager and AppHandle::global_shortcut_manager removed. Use tauri-plugin-global-shortcut instead. Migration
Manager::fs_scope removed. The file system scope can be accessed via tauri_plugin_fs::FsExt.
Plugin::PluginApi now receives a plugin configuration as a second argument.
Plugin::setup_with_config removed. Use the updated tauri::Plugin::PluginApi instead.
scope::ipc::RemoteDomainAccessScope::enable_tauri_api and scope::ipc::RemoteDomainAccessScope::enables_tauri_api removed. Enable each core plugin individually via scope::ipc::RemoteDomainAccessScope::add_plugin instead.
scope::IpcScope removed, use scope::ipc::Scope instead.
scope::FsScope, scope::GlobPattern and scope::FsScopeEvent removed, use scope::fs::Scope, scope::fs::Pattern and scope::fs::Event respectively.
updater module removed. Use tauri-plugin-updater instead. Migration
Env.args field has been removed, use Env.args_os field instead.
Menu, MenuEvent, CustomMenuItem, Submenu, WindowMenuEvent, MenuItem and Builder::on_menu_event APIs removed. Migration
SystemTray, SystemTrayHandle, SystemTrayMenu, SystemTrayMenuItemHandle, SystemTraySubmenu, MenuEntry and SystemTrayMenuItem APIs removed. Migration
JavaScript API Changes
The @tauri-apps/api package no longer provides non-core modules. Only the previous tauri (now core), path, event and window modules are exported. All others have been moved to plugins.

@tauri-apps/api/tauri module renamed to @tauri-apps/api/core. Migration
@tauri-apps/api/cli module removed. Use @tauri-apps/plugin-cli instead. Migration
@tauri-apps/api/clipboard module removed. Use @tauri-apps/plugin-clipboard instead. Migration
@tauri-apps/api/dialog module removed. Use @tauri-apps/plugin-dialog instead. Migration
@tauri-apps/api/fs module removed. Use @tauri-apps/plugin-fs instead. Migration
@tauri-apps/api/global-shortcut module removed. Use @tauri-apps/plugin-global-shortcut instead. Migration
@tauri-apps/api/http module removed. Use @tauri-apps/plugin-http instead. Migration
@tauri-apps/api/os module removed. Use @tauri-apps/plugin-os instead. Migration
@tauri-apps/api/notification module removed. Use @tauri-apps/plugin-notification instead. Migration
@tauri-apps/api/process module removed. Use @tauri-apps/plugin-process instead. Migration
@tauri-apps/api/shell module removed. Use @tauri-apps/plugin-shell instead. Migration
@tauri-apps/api/updater module removed. Use @tauri-apps/plugin-updater instead Migration
@tauri-apps/api/window module renamed to @tauri-apps/api/webviewWindow. Migration
The v1 plugins are now published as @tauri-apps/plugin-<plugin-name>. Previously they were available from git as tauri-plugin-<plugin-name>-api.

Environment Variables Changes
Most of the environment variables read and written by the Tauri CLI were renamed for consistency and prevention of mistakes:

TAURI_PRIVATE_KEY -> TAURI_SIGNING_PRIVATE_KEY
TAURI_KEY_PASSWORD -> TAURI_SIGNING_PRIVATE_KEY_PASSWORD
TAURI_SKIP_DEVSERVER_CHECK -> TAURI_CLI_NO_DEV_SERVER_WAIT
TAURI_DEV_SERVER_PORT -> TAURI_CLI_PORT
TAURI_PATH_DEPTH -> TAURI_CLI_CONFIG_DEPTH
TAURI_FIPS_COMPLIANT -> TAURI_BUNDLER_WIX_FIPS_COMPLIANT
TAURI_DEV_WATCHER_IGNORE_FILE -> TAURI_CLI_WATCHER_IGNORE_FILENAME
TAURI_TRAY -> TAURI_LINUX_AYATANA_APPINDICATOR
TAURI_APPLE_DEVELOPMENT_TEAM -> APPLE_DEVELOPMENT_TEAM
TAURI_PLATFORM -> TAURI_ENV_PLATFORM
TAURI_ARCH -> TAURI_ENV_ARCH
TAURI_FAMILY -> TAURI_ENV_FAMILY
TAURI_PLATFORM_VERSION -> TAURI_ENV_PLATFORM_VERSION
TAURI_PLATFORM_TYPE -> TAURI_ENV_PLATFORM_TYPE
TAURI_DEBUG -> TAURI_ENV_DEBUG
Event System
The event system was redesigned to be easier to use. Instead of relying on the source of the event, it now has a simpler implementation that relies on event targets.

The emit function now emits the event to all event listeners
Added a new emit_to function to trigger an event to a specific target
emit_filter now filters based on EventTarget instead of a window.
Renamed listen_global to listen_any. It now listens to all events regardless of their filters and targets.
Multiwebview support
Tauri v2 introduces multiwebview support currently behind an unstable feature flag. In order to support it, we renamed the Rust Window type to WebviewWindow and the Manager get_window function to get_webview_window.

The WebviewWindow JS API type is now re-exported from @tauri-apps/api/webviewWindow instead of @tauri-apps/api/window.

New origin URL on Windows
On Windows the frontend files in production apps are now hosted on http://tauri.localhost instead of https://tauri.localhost. Because of this IndexedDB, LocalStorage and Cookies will be reset unless dangerousUseHttpScheme was used in v1. To prevent this you can set app > windows > useHttpsScheme to true or use WebviewWindowBuilder::use_https_scheme to keep using the https scheme.

Detailed Migration Steps
Common scenarios you may encounter when migrating your Tauri 1.0 app to Tauri 2.0.

Migrate to Core Module
The @tauri-apps/api/tauri module was renamed to @tauri-apps/api/core. Simply rename the module import:

import { invoke } from "@tauri-apps/api/tauri"
import { invoke } from "@tauri-apps/api/core"

Migrate to CLI Plugin
The Rust App::get_cli_matches JavaScript @tauri-apps/api/cli APIs have been removed. Use the @tauri-apps/plugin-cli plugin instead:

Add to cargo dependencies:
Cargo.toml
[dependencies]
tauri-plugin-cli = "2"

Use in JavaScript or Rust project:
JavaScript
Rust
fn main() {
    use tauri_plugin_cli::CliExt;
    tauri::Builder::default()
        .plugin(tauri_plugin_cli::init())
        .setup(|app| {
            let cli_matches = app.cli().matches()?;
            Ok(())
        })
}

Migrate to Clipboard Plugin
The Rust App::clipboard_manager and AppHandle::clipboard_manager and JavaScript @tauri-apps/api/clipboard APIs have been removed. Use the @tauri-apps/plugin-clipboard-manager plugin instead:

[dependencies]
tauri-plugin-clipboard-manager = "2"

JavaScript
Rust
use tauri_plugin_clipboard::{ClipboardExt, ClipKind};
tauri::Builder::default()
    .plugin(tauri_plugin_clipboard::init())
    .setup(|app| {
        app.clipboard().write(ClipKind::PlainText {
            label: None,
            text: "Tauri is awesome!".into(),
        })?;
        Ok(())
    })

Migrate to Dialog Plugin
The Rust tauri::api::dialog JavaScript @tauri-apps/api/dialog APIs have been removed. Use the @tauri-apps/plugin-dialog plugin instead:

Add to cargo dependencies:
Cargo.toml
[dependencies]
tauri-plugin-dialog = "2"

Use in JavaScript or Rust project:
JavaScript
Rust
use tauri_plugin_dialog::DialogExt;
tauri::Builder::default()
    .plugin(tauri_plugin_dialog::init())
    .setup(|app| {
        app.dialog().file().pick_file(|file_path| {
            // do something with the optional file path here
            // the file path is `None` if the user closed the dialog
        });

        app.dialog().message("Tauri is Awesome!").show();
        Ok(())
     })

Migrate to File System Plugin
The Rust App::get_cli_matches JavaScript @tauri-apps/api/fs APIs have been removed. Use the std::fs for Rust and @tauri-apps/plugin-fs plugin for JavaScript instead:

Add to cargo dependencies:
Cargo.toml
[dependencies]
tauri-plugin-fs = "2"

Use in JavaScript or Rust project:
JavaScript
Rust
Use the Rust std::fs functions.

Migrate to Global Shortcut Plugin
The Rust App::global_shortcut_manager and AppHandle::global_shortcut_manager and JavaScript @tauri-apps/api/global-shortcut APIs have been removed. Use the @tauri-apps/plugin-global-shortcut plugin instead:

Add to cargo dependencies:
Cargo.toml
[dependencies]
[target."cfg(not(any(target_os = \"android\", target_os = \"ios\")))".dependencies]
tauri-plugin-global-shortcut = "2"

Use in JavaScript or Rust project:
JavaScript
Rust
use tauri_plugin_global_shortcut::GlobalShortcutExt;

tauri::Builder::default()
    .plugin(
        tauri_plugin_global_shortcut::Builder::new().with_handler(|app, shortcut| {
            println!("Shortcut triggered: {:?}", shortcut);
        })
        .build(),
    )
    .setup(|app| {
        // register a global shortcut
        // on macOS, the Cmd key is used
        // on Windows and Linux, the Ctrl key is used
        app.global_shortcut().register("CmdOrCtrl+Y")?;
        Ok(())
    })

Migrate to HTTP Plugin
The Rust tauri::api::http JavaScript @tauri-apps/api/http APIs have been removed. Use the @tauri-apps/plugin-http plugin instead:

Add to cargo dependencies:
Cargo.toml
[dependencies]
tauri-plugin-http = "2"

Use in JavaScript or Rust project:
JavaScript
Rust
use tauri_plugin_http::reqwest;

tauri::Builder::default()
    .plugin(tauri_plugin_http::init())
    .setup(|app| {
        let response_data = tauri::async_runtime::block_on(async {
            let response = reqwest::get(
                "https://raw.githubusercontent.com/tauri-apps/tauri/dev/package.json",
            )
            .await
            .unwrap();
            response.text().await
        })?;
        Ok(())
    })

The HTTP plugin re-exports reqwest so you can check out their documentation for more information.

Migrate to Notification Plugin
The Rust tauri::api::notification JavaScript @tauri-apps/api/notification APIs have been removed. Use the @tauri-apps/plugin-notification plugin instead:

Add to cargo dependencies:
Cargo.toml
[dependencies]
tauri-plugin-notification = "2"

Use in JavaScript or Rust project:
JavaScript
Rust
use tauri_plugin_notification::NotificationExt;
use tauri::plugin::PermissionState;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_notification::init())
        .setup(|app| {
            if app.notification().permission_state()? == PermissionState::Unknown {
                app.notification().request_permission()?;
            }
            if app.notification().permission_state()? == PermissionState::Granted {
                app.notification()
                    .builder()
                    .body("Tauri is awesome!")
                    .show()?;
            }
            Ok(())
        })
}

Migrate to Menu Module
The Rust Menu APIs were moved to the tauri::menu module and refactored to use the muda crate.

Use tauri::menu::MenuBuilder
Use tauri::menu::MenuBuilder instead of tauri::Menu. Note that its constructor takes a Manager instance (one of App, AppHandle or WebviewWindow) as an argument:

use tauri::menu::MenuBuilder;

tauri::Builder::default()
    .setup(|app| {
        let menu = MenuBuilder::new(app)
            .copy()
            .paste()
            .separator()
            .undo()
            .redo()
            .text("open-url", "Open URL")
            .check("toggle", "Toggle")
            .icon("show-app", "Show App", app.default_window_icon().cloned().unwrap())
            .build()?;
        Ok(())
    })

Use tauri::menu::PredefinedMenuItem
Use tauri::menu::PredefinedMenuItem instead of tauri::MenuItem:

use tauri::menu::{MenuBuilder, PredefinedMenuItem};

tauri::Builder::default()
    .setup(|app| {
        let menu = MenuBuilder::new(app).item(&PredefinedMenuItem::copy(app)?).build()?;
        Ok(())
    })

Tip

The menu builder has dedicated methods to add each predefined menu item so you can call .copy() instead of .item(&PredefinedMenuItem::copy(app, None)?).

Use tauri::menu::MenuItemBuilder
Use tauri::menu::MenuItemBuilder instead of tauri::CustomMenuItem:

use tauri::menu::MenuItemBuilder;

tauri::Builder::default()
    .setup(|app| {
        let toggle = MenuItemBuilder::new("Toggle").accelerator("Ctrl+Shift+T").build(app)?;
        Ok(())
    })

Use tauri::menu::SubmenuBuilder
Use tauri::menu::SubmenuBuilder instead of tauri::Submenu:

use tauri::menu::{MenuBuilder, SubmenuBuilder};

tauri::Builder::default()
    .setup(|app| {
        let submenu = SubmenuBuilder::new(app, "Sub")
            .text("Tauri")
            .separator()
            .check("Is Awesome")
            .build()?;
        let menu = MenuBuilder::new(app).item(&submenu).build()?;
        Ok(())
    })

tauri::Builder::menu now takes a closure because the menu needs a Manager instance to be built. See the documentation for more information.

Menu Events
The Rust tauri::Builder::on_menu_event API was removed. Use tauri::App::on_menu_event or tauri::AppHandle::on_menu_event instead:

use tauri::menu::{CheckMenuItemBuilder, MenuBuilder, MenuItemBuilder};

tauri::Builder::default()
    .setup(|app| {
        let toggle = MenuItemBuilder::with_id("toggle", "Toggle").build(app)?;
        let check = CheckMenuItemBuilder::new("Mark").build(app)?;
        let menu = MenuBuilder::new(app).items(&[&toggle, &check]).build()?;

        app.set_menu(menu)?;

        app.on_menu_event(move |app, event| {
            if event.id() == check.id() {
                println!("`check` triggered, do something! is checked? {}", check.is_checked().unwrap());
            } else if event.id() == "toggle" {
                println!("toggle triggered!");
            }
        });
        Ok(())
    })

Note that there are two ways to check which menu item was selected: move the item to the event handler closure and compare IDs, or define a custom ID for the item through the with_id constructor and use that ID string to compare.

Tip

Menu items can be shared across menus, and the menu event is bound to a menu item instead of a menu or window. If you don’t want all listeners to be triggered when a menu item is selected, do not share menu items and use dedicated instances instead, that you could move into tauri::WebviewWindow/WebviewWindowBuilder::on_menu_event closure.

Migrate to OS Plugin
The Rust tauri::api::os JavaScript @tauri-apps/api/os APIs have been removed. Use the @tauri-apps/plugin-os plugin instead:

Add to cargo dependencies:
Cargo.toml
[dependencies]
tauri-plugin-os = "2"

Use in JavaScript or Rust project:
JavaScript
Rust
fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_os::init())
        .setup(|app| {
            let os_arch = tauri_plugin_os::arch();
            Ok(())
        })
}

Migrate to Process Plugin
The Rust tauri::api::process JavaScript @tauri-apps/api/process APIs have been removed. Use the @tauri-apps/plugin-process plugin instead:

Add to cargo dependencies:
Cargo.toml
[dependencies]
tauri-plugin-process = "2"

Use in JavaScript or Rust project:
JavaScript
Rust
fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_process::init())
        .setup(|app| {
            // exit the app with a status code
            app.handle().exit(1);
            // restart the app
            app.handle().restart();
            Ok(())
        })
}

Migrate to Shell Plugin
The Rust tauri::api::shell JavaScript @tauri-apps/api/shell APIs have been removed. Use the @tauri-apps/plugin-shell plugin instead:

Add to cargo dependencies:
Cargo.toml
[dependencies]
tauri-plugin-shell = "2"

Use in JavaScript or Rust project:
JavaScript
Rust
Open an URL
use tauri_plugin_shell::ShellExt;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            app.shell().open("https://github.com/tauri-apps/tauri", None)?;
            Ok(())
        })
}

Spawn a child process and retrieve the status code
use tauri_plugin_shell::ShellExt;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            let status = tauri::async_runtime::block_on(async move { app.shell().command("which").args(["ls"]).status().await.unwrap() });
            println!("`which` finished with status: {:?}", status.code());
            Ok(())
        })
}

Spawn a child process and capture its output
use tauri_plugin_shell::ShellExt;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            let output = tauri::async_runtime::block_on(async move { app.shell().command("echo").args(["TAURI"]).output().await.unwrap() });
            assert!(output.status.success());
            assert_eq!(String::from_utf8(output.stdout).unwrap(), "TAURI");
            Ok(())
        })
}

Spawn a child process and read its events asynchronously:
use tauri_plugin_shell::{ShellExt, process::CommandEvent};

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            let handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                let (mut rx, mut child) = handle.shell().command("cargo")
                    .args(["tauri", "dev"])
                    .spawn()
                    .expect("Failed to spawn cargo");

                let mut i = 0;
                while let Some(event) = rx.recv().await {
                    if let CommandEvent::Stdout(line) = event {
                        println!("got: {}", String::from_utf8(line).unwrap());
                       i += 1;
                       if i == 4 {
                           child.write("message from Rust\n".as_bytes()).unwrap();
                           i = 0;
                       }
                   }
                }
            });
            Ok(())
        })
}

Migrate to Tray Icon Module
The Rust SystemTray APIs were renamed to TrayIcon for consistency. The new APIs can be found in the Rust tray module.

Use tauri::tray::TrayIconBuilder
Use tauri::tray::TrayIconBuilder instead of tauri::SystemTray:

let tray = tauri::tray::TrayIconBuilder::with_id("my-tray").build(app)?;

See TrayIconBuilder for more information.

Migrate to Menu
Use tauri::menu::Menu instead of tauri::SystemTrayMenu, tauri::menu::Submenu instead of tauri::SystemTraySubmenu and tauri::menu::PredefinedMenuItem instead of tauri::SystemTrayMenuItem.

Tray Events
tauri::SystemTray::on_event have been split into tauri::tray::TrayIconBuilder::on_menu_event and tauri::tray::TrayIconBuilder::on_tray_icon_event:

use tauri::{
    menu::{MenuBuilder, MenuItemBuilder},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
};

tauri::Builder::default()
    .setup(|app| {
        let toggle = MenuItemBuilder::with_id("toggle", "Toggle").build(app)?;
        let menu = MenuBuilder::new(app).items(&[&toggle]).build()?;
        let tray = TrayIconBuilder::new()
            .menu(&menu)
            .on_menu_event(move |app, event| match event.id().as_ref() {
                "toggle" => {
                    println!("toggle clicked");
                }
                _ => (),
            })
            .on_tray_icon_event(|tray, event| {
                if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                } = event
                {
                    let app = tray.app_handle();
                    if let Some(webview_window) = app.get_webview_window("main") {
                    let _ = webview_window.show();
                    let _ = webview_window.set_focus();
                    }
                }
            })
            .build(app)?;

        Ok(())
    })

Migrate to Updater Plugin
The built-in dialog with an automatic update check was removed, use the Rust and JS APIs to check for and install updates instead.

The Rust tauri::updater and JavaScript @tauri-apps/api-updater APIs have been removed. To set a custom updater target with the @tauri-apps/plugin-updater:

Add to cargo dependencies:
[dependencies]
tauri-plugin-updater = "2"

Use in JavaScript or Rust project:
JavaScript
Rust
To check for updates:

use tauri_plugin_updater::UpdaterExt;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_updater::Builder::new().build())
        .setup(|app| {
            let handle = app.handle();
            tauri::async_runtime::spawn(async move {
                let response = handle.updater().check().await;
            });
            Ok(())
        })
}

To set a custom updater target:

fn main() {
    let mut updater = tauri_plugin_updater::Builder::new();
    #[cfg(target_os = "macos")]
    {
        updater = updater.target("darwin-universal");
    }
    tauri::Builder::default()
        .plugin(updater.build())
}

Migrate Path to Tauri Manager
The Rust tauri::api::path module functions and tauri::PathResolver have been moved to tauri::Manager::path:

use tauri::{path::BaseDirectory, Manager};

tauri::Builder::default()
    .setup(|app| {
        let home_dir_path = app.path().home_dir().expect("failed to get home dir");

        let path = app.path().resolve("path/to/something", BaseDirectory::Config)?;

        Ok(())
  })

Migrate to new Window API
On the Rust side, Window was renamed to WebviewWindow, its builder WindowBuilder is now named WebviewWindowBuilder and WindowUrl is now named WebviewUrl.

Additionally, the Manager::get_window function was renamed to get_webview_window and the window’s parent_window API was renamed to parent_raw to support a high level window parent API.

On the JavaScript side, the WebviewWindow class is now exported in the @tauri-apps/api/webviewWindow path.

The onMenuClicked function was removed, you can intercept menu events when creating a menu in JavaScript instead.

Migrate Embedded Additional Files (Resources)
On the JavaScript side, make sure you Migrate to File System Plugin. Additionally, note the changes made to the v1 allowlist in Migrate Permissions.

On the Rust side, make sure you Migrate Path to Tauri Manager.

Migrate Embedded External Binaries (Sidecar)
In Tauri v1, the external binaries and their arguments were defined in the allowlist. In v2, use the new permissions system. Read Migrate Permissions for more information.

On the JavaScript side, make sure you Migrate to Shell Plugin.

On the Rust side, tauri::api::process API has been removed. Use tauri_plugin_shell::ShellExt and tauri_plugin_shell::process::CommandEvent APIs instead. Read the Embedding External Binaries guide to see how.

The “process-command-api” features flag has been removed in v2. So running the external binaries does not require this feature to be defined in the Tauri config anymore.

Migrate Permissions
The v1 allowlist have been rewritten to a completely new system for permissions that works for individual plugins and is much more configurable for multiwindow and remote URL support. This new system works like an access control list (ACL) where you can allow or deny commands, allocate permissions to a specific set of windows and domains, and define access scopes.

To enable permissions for your app, you must create capability files inside the src-tauri/capabilities folder, and Tauri will automatically configure everything else for you.

The migrate CLI command automatically parses your v1 allowlist and generates the associated capability file.

To learn more about permissions and capabilities, see the security documentation.

Permissions
Permissions are descriptions of explicit privileges of commands.

[[permission]]
identifier = "my-identifier"
description = "This describes the impact and more."
commands.allow = [
    "read_file"
]

[[scope.allow]]
my-scope = "$HOME/*"

[[scope.deny]]
my-scope = "$HOME/secret"

It can enable commands to be accessible in the frontend of a Tauri application. It can map scopes to commands and defines which commands are enabled. Permissions can enable or deny certain commands, define scopes or combine both.

Permissions can be grouped as a set under a new identifier. This is called a permission set. This allows you to combine scope related permissions with command related permissions. It also allows to group or bundle operating specific permissions into more usable sets.

As a plugin developer you can ship multiple, pre-defined, well named permissions for all of your exposed commands.

As an application developer you can extend existing plugin permissions or define them for your own commands. They can be grouped or extended in a set to be re-used or to simplify the main configuration files later.

Permission Identifier
The permissions identifier is used to ensure that permissions can be re-used and have unique names.

Tip

With name we refer to the plugin crate name without the tauri-plugin- prefix. This is meant as namespacing to reduce likelihood of naming conflicts. When referencing permissions of the application itself it is not necessary.

<name>:default Indicates the permission is the default for a plugin or application
<name>:<command-name> Indicates the permission is for an individual command
The plugin prefix tauri-plugin- will be automatically prepended to the identifier of plugins at compile time and is not required to be manually specified.

Identifiers are limited to ASCII lower case alphabetic characters [a-z] and the maximum length of the identifier is currently limited to 116 due to the following constants:

const IDENTIFIER_SEPARATOR: u8 = b':';
const PLUGIN_PREFIX: &str = "tauri-plugin-";

// https://doc.rust-lang.org/cargo/reference/manifest.html#the-name-field
const MAX_LEN_PREFIX: usize = 64 - PLUGIN_PREFIX.len();
const MAX_LEN_BASE: usize = 64;
const MAX_LEN_IDENTIFIER: usize = MAX_LEN_PREFIX + 1 + MAX_LEN_BASE;

Configuration Files
Simplified example of an example Tauri plugin directory structure:

Terminal window
tauri-plugin
├── README.md
├── src
│  └── lib.rs
├── build.rs
├── Cargo.toml
├── permissions
│  └── <identifier>.json/toml
│  └── default.json/toml

The default permission is handled in a special way, as it is automatically added to the application configuration, as long as the Tauri CLI is used to add plugins to a Tauri application.

For application developers the structure is similar:

Terminal window
tauri-app
├── index.html
├── package.json
├── src
├── src-tauri
│   ├── Cargo.toml
│   ├── permissions
│      └── <identifier>.toml
|   ├── capabilities
│      └── <identifier>.json/.toml
│   ├── src
│   ├── tauri.conf.json

Note

As an application developer the capability files can be written in json/json5 or toml, whereas permissions only can be defined in toml.

Examples
Example permissions from the File System plugin.

plugins/fs/permissions/autogenerated/base-directories/home.toml
[[permission]]
identifier = "scope-home"
description = """This scope permits access to all files and
list content of top level directories in the `$HOME`folder."""

[[scope.allow]]
path = "$HOME/*"

plugins/fs/permissions/read-files.toml
[[permission]]
identifier = "read-files"
description = """This enables all file read related
commands without any pre-configured accessible paths."""
commands.allow = [
    "read_file",
    "read",
    "open",
    "read_text_file",
    "read_text_file_lines",
    "read_text_file_lines_next"
]

plugins/fs/permissions/autogenerated/commands/mkdir.toml
[[permission]]
identifier = "allow-mkdir"
description = "This enables the mkdir command."
commands.allow = [
    "mkdir"
]

Example implementation extending above plugin permissions in your app:

my-app/src-tauri/permissions/home-read-extends.toml
[[set]]
identifier = "allow-home-read-extended"
description = """ This allows non-recursive read access to files and to create directories
in the `$HOME` folder.
"""
permissions = [
    "fs:read-files",
    "fs:scope-home",
    "fs:allow-mkdir"
]

Command Scopes
A scope is a granular way to define (dis)allowed behavior of a Tauri command.

Scopes are categorized into allow or deny scopes, where deny always supersedes the allow scope.

The scope type needs be of any serde serializable type. These types are plugin-specific in general. For scoped commands implemented in a Tauri application the scope type needs to be defined in the application and then enforced in the command implementation.

For instance, the Fs plugin allows you to use scopes to allow or deny certain directories and files and the http plugin uses scopes to filter URLs that are allowed to be reached.

The scope is passed to the command and handling or properly enforcing is implemented by the command itself.

Caution

Command developers need to ensure that there are no scope bypasses possible. The scope validation implementation should be audited to ensure correctness.

Examples
These examples are taken from the Fs plugin permissions:

The scope type in this plugin for all commands is a string, which contains a glob compatible path.

plugins/fs/permissions/autogenerated/base-directories/applocaldata.toml
[[permission]]
identifier = "scope-applocaldata-recursive"
description = '''
This scope recursive access to the complete `$APPLOCALDATA` folder,
including sub directories and files.
'''

[[permission.scope.allow]]
path = "$APPLOCALDATA/**"

plugins/fs/permissions/deny-webview-data.toml
[[permission]]
identifier = "deny-webview-data-linux"
description = '''
This denies read access to the
`$APPLOCALDATA` folder on linux as the webview data and
configuration values are stored here.
Allowing access can lead to sensitive information disclosure and
should be well considered.
'''
platforms = ["linux"]

[[scope.deny]]
path = "$APPLOCALDATA/**"

[[permission]]
identifier = "deny-webview-data-windows"
description = '''
This denies read access to the
`$APPLOCALDATA/EBWebView` folder on windows as the webview data and
configuration values are stored here.
Allowing access can lead to sensitive information disclosure and
should be well considered.
'''
platforms = ["windows"]

[[scope.deny]]
path = "$APPLOCALDATA/EBWebView/**"

The above scopes can be used to allow access to the APPLOCALDATA folder, while preventing access to the EBWebView subfolder on windows, which contains sensitive webview data.

These can merged into a set, which reduces duplicate configuration and makes it more understandable for anyone looking into the application configuration.

First the deny scopes are merged into deny-default:

plugins/fs/permissions/deny-default.toml
[[set]]
identifier = "deny-default"
description = '''
This denies access to dangerous Tauri relevant files and
folders by default.
'''
permissions = ["deny-webview-data-linux", "deny-webview-data-windows"]

Afterwards deny and allow scopes are merged:

[[set]]
identifier = "scope-applocaldata-reasonable"
description = '''
This scope set allows access to the `APPLOCALDATA` folder and
subfolders except for linux,
while it denies access to dangerous Tauri relevant files and
folders by default on windows.
'''
permissions = ["scope-applocaldata-recursive", "deny-default"]

These scopes can be either used for all commands, by extending the global scope of the plugin, or for only selected commands when they are used in combination with a enabled command inside a permission.

Reasonable read only file access to files in the APPLOCALDATA could look like this:

[[set]]
identifier = "read-files-applocaldata"
description = '''
This set allows file read access to the `APPLOCALDATA` folder and
subfolders except for linux,
while it denies access to dangerous Tauri relevant files and
folders by default on windows.'''
permissions = ["scope-applocaldata-reasonable", "allow-read-file"]

These examples only highlight the scope functionality itself. Each plugin or application developer needs to consider reasonable combinations of scope depending on their use cases.

Capabilities
Tauri provides application and plugin developers with a capabilities system, to granually enable and constrain the core exposure to the application frontend running in the system WebView.

Capabilities are a set of permissions mapped to application windows and webviews by their respective label. Capabilities can affect multiple windows and webviews and these can be referenced in multiple capabilities.

Security Tip

Windows and WebViews which are part of more than one capability effectivly merge the security boundaries and permissions of all involved capabilities.

Capability files are either defined as a JSON or a TOML file inside the src-tauri/capabilities directory.

It is good practice to use individual files and only reference them by identifier in the tauri.conf.json but it is also possible to define them directly in the capabilities field.

All capabilities inside the capabilities directory are automatically enabled by default. Once capabilities are explicitly enabled in the tauri.conf.json, only these are used in the application build.

For a full reference of the configuration scheme please see the references section.

The following example JSON defines a capability that enables default functionality for core plugins and the window.setTitle API.

src-tauri/capabilities/default.json
{
  "$schema": "./schemas/desktop-schema.json",
  "identifier": "main-capability",
  "description": "Capability for the main window",
  "windows": ["main"],
  "permissions": [
    "core:path:default",
    "core:event:default",
    "core:window:default",
    "core:app:default",
    "core:resources:default",
    "core:menu:default",
    "core:tray:default",
    "core:window:allow-set-title"
  ]
}

These snippets are part of the Tauri configuration file.

This is likely the most common configuration method, where the individual capabilities are inlined and only permissions are referenced by identifier.

This requires well defined capability files in the capabilities directory.

src-tauri/tauri.conf.json
{
  "app": {
    "security": {
      "capabilities": ["my-capability", "main-capability"]
    }
  }
}

Inline capabilities can be mixed with pre-defined capabilities.

src-tauri/tauri.conf.json
{
  "app": {
    "security": {
      "capabilities": [
        {
          "identifier": "my-capability",
          "description": "My application capability used for all windows",
          "windows": ["*"],
          "permissions": ["fs:default", "allow-home-read-extended"]
        },
        "my-second-capability"
      ]
    }
  }
}

Target Platform
Capabilities can be platform-specific by defining the platforms array. By default the capability is applied to all targets, but you can select a subset of the linux, macOS, windows, iOS and android targets.

For example a capability for desktop operating systems. Note it enables permissions on plugins that are only available on desktop:

src-tauri/capabilities/desktop.json
{
  "$schema": "./schemas/desktop-schema.json",
  "identifier": "desktop-capability",
  "windows": ["main"],
  "platforms": ["linux", "macOS", "windows"],
  "permissions": ["global-shortcut:allow-register"]
}

And another example of a capability for mobile. Note it enables permissions on plugins that are only available on mobile:

src-tauri/capabilities/mobile.json
{
  "$schema": "./schemas/mobile-schema.json",
  "identifier": "mobile-capability",
  "windows": ["main"],
  "platforms": ["iOS", "android"],
  "permissions": [
    "nfc:allow-scan",
    "biometric:allow-authenticate",
    "barcode-scanner:allow-scan"
  ]
}

Remote API Access
By default the API is only accessible to bundled code shipped with the Tauri App. To allow remote sources access to certain Tauri Commands it is possible to define this in the capability configuration file.

This example would allow to scan for NFC tags and to use the barcode scanner from all subdomains of tauri.app.

src-tauri/capabilities/remote-tags.json
{
  "$schema": "./schemas/remote-schema.json",
  "identifier": "remote-tag-capability",
  "windows": ["main"],
  "remote": {
    "urls": ["https://*.tauri.app"]
  },
  "platforms": ["iOS", "android"],
  "permissions": ["nfc:allow-scan", "barcode-scanner:allow-scan"]
}

Caution

On Linux and Android, Tauri is unable to distinguish between requests from an embedded <iframe> and the window itself.

Please consider usage of this feature very carefully and read more into the specific security implications for your targeted operating system in the reference section of this feature.

Security Boundaries
What does it protect against?

Depending on the permissions and capabilities it is able to:

Minimize impact of frontend compromise
Prevent or reduce (accidential) exposure of local system interfaces and data
Prevent or reduce possible privilege escalation from frontend to backend/system
What does it not protect against?

Malicious or insecure Rust code
Too lax scopes and configuration
Incorrect scope checks in the command implementation
Intentional bypasses from Rust code
Basically anything which was written in the rust core of an application
0-days or unpatched 1-days in the system WebView
Supply chain attacks or otherwise compromised developer systems
Security Tip

The security boundaries are depending on window labels (not titles). We recommend to only expose of the window creation functionality to higher privileged windows.

Schema Files
Tauri generates a JSON schema with all the permissions that are available to your application so you have autocompletion in your IDE. To use the schema, set the $schema property to one of the schemas inside the gen/schemas directory, which are platform-specific. Usually you will set it to ../gen/schemas/desktop-schema.json or ../gen/schemas/mobile-schema.json though you can also define a capability for a specific target platform.

Configuration Files
Simplified example of an example Tauri application directory structure:

Terminal window
tauri-app
├── index.html
├── package.json
├── src
├── src-tauri
│   ├── Cargo.toml
│   ├── capabilities
│      └── <identifier>.json/toml
│   ├── src
│   ├── tauri.conf.json

Everything can be inlined into the tauri.conf.json but even a little more advanced configuration would bloat this file and the goal of this approach is that the permissions are abstracted away whenever possible and simple to understand.

Core Permissions
A list of all core permissions can be found on the Core Permissions page.

File System
GitHub
npm
crates.io
API Reference
Access the file system.

Supported Platforms
This plugin requires a Rust version of at least 1.77.2

Platform	Level	Notes
windows	
Apps installed via MSI or NSIS in perMachine and both mode require admin permissions for write acces in $RESOURCES folder

linux	
No write access to $RESOURCES folder

macos	
No write access to $RESOURCES folder

android	
Access is restricted to Application folder by default

ios	
Access is restricted to Application folder by default

Setup
Install the fs plugin to get started.

Automatic
Manual
Use your project’s package manager to add the dependency:

npm
yarn
pnpm
deno
bun
cargo
bun tauri add fs

Configuration
Android
When using the audio, cache, documents, downloads, picture, public or video directories your app must have access to the external storage.

Include the following permissions to the manifest tag in the gen/android/app/src/main/AndroidManifest.xml file:

<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE"/>
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />

iOS
Apple requires app developers to specify approved reasons for API usage to enhance user privacy.

You must create a PrivacyInfo.xcprivacy file in the src-tauri/gen/apple folder with the required NSPrivacyAccessedAPICategoryFileTimestamp key and the C617.1 recommended reason.

<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
  <dict>
    <key>NSPrivacyAccessedAPITypes</key>
    <array>
      <dict>
        <key>NSPrivacyAccessedAPIType</key>
        <string>NSPrivacyAccessedAPICategoryFileTimestamp</string>
        <key>NSPrivacyAccessedAPITypeReasons</key>
        <array>
          <string>C617.1</string>
        </array>
      </dict>
    </array>
  </dict>
</plist>

Usage
The fs plugin is available in both JavaScript and Rust.

JavaScript
Rust
src-tauri/src/lib.rs
use tauri_plugin_fs::FsExt;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
      .plugin(tauri_plugin_fs::init())
      .setup(|app| {
          // allowed the given directory
          let scope = app.fs_scope();
          scope.allow_directory("/path/to/directory", false);
          dbg!(scope.allowed());

          Ok(())
       })
       .run(tauri::generate_context!())
       .expect("error while running tauri application");
}

Security
This module prevents path traversal, not allowing parent directory accessors to be used (i.e. “/usr/path/to/../file” or ”../path/to/file” paths are not allowed). Paths accessed with this API must be either relative to one of the base directories or created with the path API.

See @tauri-apps/plugin-fs - Security for more information.

Paths
The file system plugin offers two ways of manipulating paths: the base directory and the path API.

base directory

Every API has an options argument that lets you define a baseDir that acts as the working directory of the operation.

import { readFile } from '@tauri-apps/plugin-fs';
const contents = await readFile('avatars/tauri.png', {
  baseDir: BaseDirectory.Home,
});

In the above example the ~/avatars/tauri.png file is read since we are using the Home base directory.

path API

Alternatively you can use the path APIs to perform path manipulations.

import { readFile } from '@tauri-apps/plugin-fs';
import * as path from '@tauri-apps/api/path';
const home = await path.homeDir();
const contents = await readFile(await path.join(home, 'avatars/tauri.png'));

Files
Create
Creates a file and returns a handle to it. If the file already exists, it is truncated.

import { create, BaseDirectory } from '@tauri-apps/plugin-fs';
const file = await create('foo/bar.txt', { baseDir: BaseDirectory.App });
await file.write(new TextEncoder().encode('Hello world'));
await file.close();

Note

Always call file.close() when you are done manipulating the file.

Write
The plugin offers separate APIs for writing text and binary files for performance.

text files

import { writeTextFile, BaseDirectory } from '@tauri-apps/plugin-fs';
const contents = JSON.stringify({ notifications: true });
await writeTextFile('config.json', contents, {
  baseDir: BaseDirectory.AppConfig,
});

binary files

import { writeFile, BaseDirectory } from '@tauri-apps/plugin-fs';
const contents = new Uint8Array(); // fill a byte array
await writeFile('config', contents, {
  baseDir: BaseDirectory.AppConfig,
});

Open
Opens a file and returns a handle to it. With this API you have more control over how the file should be opened (read-only mode, write-only mode, append instead of overwrite, only create if it does not exist, etc).

Note

Always call file.close() when you are done manipulating the file.

read-only

This is the default mode.

import { open, BaseDirectory } from '@tauri-apps/plugin-fs';
const file = await open('foo/bar.txt', {
  read: true,
  baseDir: BaseDirectory.App,
});
const buf = new Uint8Array();
await file.read(buf);
const textContents = new TextDecoder().decode(buf);
await file.close();

write-only

import { open, BaseDirectory } from '@tauri-apps/plugin-fs';
const file = await open('foo/bar.txt', {
  write: true,
  baseDir: BaseDirectory.App,
});
await file.write(new TextEncoder().encode('Hello world'));
await file.close();

By default the file is truncated on any file.write() call. See the following example to learn how to append to the existing contents instead.

append

import { open, BaseDirectory } from '@tauri-apps/plugin-fs';
const file = await open('foo/bar.txt', {
  append: true,
  baseDir: BaseDirectory.App,
});
await file.write(new TextEncoder().encode('world'));
await file.close();

Note that { append: true } has the same effect as { write: true, append: true }.

truncate

When the truncate option is set and the file already exists, it will be truncated to length 0.

import { open, BaseDirectory } from '@tauri-apps/plugin-fs';
const file = await open('foo/bar.txt', {
  write: true,
  truncate: true,
  baseDir: BaseDirectory.App,
});
await file.write(new TextEncoder().encode('world'));
await file.close();

This option requires write to be true.

You can use it along the append option if you want to rewrite an existing file using multiple file.write() calls.

create

By default the open API only opens existing files. To create the file if it does not exist, opening it if it does, set create to true:

import { open, BaseDirectory } from '@tauri-apps/plugin-fs';
const file = await open('foo/bar.txt', {
  write: true,
  create: true,
  baseDir: BaseDirectory.App,
});
await file.write(new TextEncoder().encode('world'));
await file.close();

In order for the file to be created, write or append must also be set to true.

To fail if the file already exists, see createNew.

createNew

createNew works similarly to create, but if the file does not exist, the operation fails.

import { open, BaseDirectory } from '@tauri-apps/plugin-fs';
const file = await open('foo/bar.txt', {
  write: true,
  createNew: true,
  baseDir: BaseDirectory.App,
});
await file.write(new TextEncoder().encode('world'));
await file.close();

In order for the file to be created, write must also be set to true.

Read
The plugin offers separate APIs for reading text and binary files for performance.

text files

import { readTextFile, BaseDirectory } from '@tauri-apps/plugin-fs';
const configToml = await readTextFile('config.toml', {
  baseDir: BaseDirectory.AppConfig,
});

If the file is large you can stream its lines with the readTextFileLines API:

import { readTextFileLines, BaseDirectory } from '@tauri-apps/plugin-fs';
const lines = await readTextFileLines('app.logs', {
  baseDir: BaseDirectory.AppLog,
});
for await (const line of lines) {
  console.log(line);
}

binary files

import { readFile, BaseDirectory } from '@tauri-apps/plugin-fs';
const icon = await readFile('icon.png', {
  baseDir: BaseDirectory.Resources,
});

Remove
Call remove() to delete a file. If the file does not exist, an error is returned.

import { remove, BaseDirectory } from '@tauri-apps/plugin-fs';
await remove('user.db', { baseDir: BaseDirectory.AppLocalData });

Copy
The copyFile function takes the source and destination paths. Note that you must configure each base directory separately.

import { copyFile, BaseDirectory } from '@tauri-apps/plugin-fs';
await copyFile('user.db', 'user.db.bk', {
  fromPathBaseDir: BaseDirectory.AppLocalData,
  toPathBaseDir: BaseDirectory.Temp,
});

In the above example the <app-local-data>/user.db file is copied to $TMPDIR/user.db.bk.

Exists
Use the exists() function to check if a file exists:

import { exists, BaseDirectory } from '@tauri-apps/plugin-fs';
const tokenExists = await exists('token', {
  baseDir: BaseDirectory.AppLocalData,
});

Metadata
File metadata can be retrieved with the stat and the lstat functions. stat follows symlinks (and returns an error if the actual file it points to is not allowed by the scope) and lstat does not follow symlinks, returning the information of the symlink itself.

import { stat, BaseDirectory } from '@tauri-apps/plugin-fs';
const metadata = await stat('app.db', {
  baseDir: BaseDirectory.AppLocalData,
});

Rename
The rename function takes the source and destination paths. Note that you must configure each base directory separately.

import { rename, BaseDirectory } from '@tauri-apps/plugin-fs';
await rename('user.db.bk', 'user.db', {
  fromPathBaseDir: BaseDirectory.AppLocalData,
  toPathBaseDir: BaseDirectory.Temp,
});

In the above example the <app-local-data>/user.db.bk file is renamed to $TMPDIR/user.db.

Truncate
Truncates or extends the specified file to reach the specified file length (defaults to 0).

truncate to 0 length
import { truncate } from '@tauri-apps/plugin-fs';
await truncate('my_file.txt', 0, { baseDir: BaseDirectory.AppLocalData });

truncate to a specific length
import {
  truncate,
  readTextFile,
  writeTextFile,
  BaseDirectory,
} from '@tauri-apps/plugin-fs';

const filePath = 'file.txt';
await writeTextFile(filePath, 'Hello World', {
  baseDir: BaseDirectory.AppLocalData,
});
await truncate(filePath, 7, {
  baseDir: BaseDirectory.AppLocalData,
});
const data = await readTextFile(filePath, {
  baseDir: BaseDirectory.AppLocalData,
});
console.log(data); // "Hello W"

Directories
Create
To create a directory, call the mkdir function:

import { mkdir, BaseDirectory } from '@tauri-apps/plugin-fs';
await mkdir('images', {
  baseDir: BaseDirectory.AppLocalData,
});

Read
The readDir function recursively lists the entries of a directory:

import { readDir, BaseDirectory } from '@tauri-apps/plugin-fs';
const entries = await readDir('users', { baseDir: BaseDirectory.AppLocalData });

Remove
Call remove() to delete a directory. If the directory does not exist, an error is returned.

import { remove, BaseDirectory } from '@tauri-apps/plugin-fs';
await remove('images', { baseDir: BaseDirectory.AppLocalData });

If the directory is not empty, the recursive option must be set to true:

import { remove, BaseDirectory } from '@tauri-apps/plugin-fs';
await remove('images', {
  baseDir: BaseDirectory.AppLocalData,
  recursive: true,
});

Exists
Use the exists() function to check if a directory exists:

import { exists, BaseDirectory } from '@tauri-apps/plugin-fs';
const tokenExists = await exists('images', {
  baseDir: BaseDirectory.AppLocalData,
});

Metadata
Directory metadata can be retrieved with the stat and the lstat functions. stat follows symlinks (and returns an error if the actual file it points to is not allowed by the scope) and lstat does not follow symlinks, returning the information of the symlink itself.

import { stat, BaseDirectory } from '@tauri-apps/plugin-fs';
const metadata = await stat('databases', {
  baseDir: BaseDirectory.AppLocalData,
});

Watching changes
To watch a directory or file for changes, use the watch or watchImmediate functions.

watch

watch is debounced so it only emits events after a certain delay:

import { watch, BaseDirectory } from '@tauri-apps/plugin-fs';
await watch(
  'app.log',
  (event) => {
    console.log('app.log event', event);
  },
  {
    baseDir: BaseDirectory.AppLog,
    delayMs: 500,
  }
);

watchImmediate

watchImmediate immediately notifies listeners of an event:

import { watchImmediate, BaseDirectory } from '@tauri-apps/plugin-fs';
await watchImmediate(
  'logs',
  (event) => {
    console.log('logs directory event', event);
  },
  {
    baseDir: BaseDirectory.AppLog,
    recursive: true,
  }
);

By default watch operations on a directory are not recursive. Set the recursive option to true to recursively watch for changes on all sub-directories.

Note

The watch functions require the watch feature flag:

src-tauri/Cargo.toml
[dependencies]
tauri-plugin-fs = { version = "2.0.0", features = ["watch"] }

Permissions
By default all potentially dangerous plugin commands and scopes are blocked and cannot be accessed. You must modify the permissions in your capabilities configuration to enable these.

See the Capabilities Overview for more information and the step by step guide to use plugin permissions.

src-tauri/capabilities/default.json
{
  "$schema": "../gen/schemas/desktop-schema.json",
  "identifier": "main-capability",
  "description": "Capability for the main window",
  "windows": ["main"],
  "permissions": [
    "fs:default",
    {
      "identifier": "fs:allow-exists",
      "allow": [{ "path": "$APPDATA/*" }]
    }
  ]
}

Default Permission
This set of permissions describes the what kind of file system access the fs plugin has enabled or denied by default.

Granted Permissions
This default permission set enables read access to the application specific directories (AppConfig, AppData, AppLocalData, AppCache, AppLog) and all files and sub directories created in it. The location of these directories depends on the operating system, where the application is run.

In general these directories need to be manually created by the application at runtime, before accessing files or folders in it is possible.

Therefore, it is also allowed to create all of these folders via the mkdir command.

Denied Permissions
This default permission set prevents access to critical components of the Tauri application by default. On Windows the webview data folder access is denied.

Included permissions within this default permission set:
create-app-specific-dirs
read-app-specific-dirs-recursive
deny-default
Permission Table
Identifier	Description
fs:allow-app-read-recursive

This allows full recursive read access to the complete application folders, files and subdirectories.

fs:allow-app-write-recursive

This allows full recursive write access to the complete application folders, files and subdirectories.

fs:allow-app-read

This allows non-recursive read access to the application folders.

fs:allow-app-write

This allows non-recursive write access to the application folders.

fs:allow-app-meta-recursive

This allows full recursive read access to metadata of the application folders, including file listing and statistics.

fs:allow-app-meta

This allows non-recursive read access to metadata of the application folders, including file listing and statistics.

fs:scope-app-recursive

This scope permits recursive access to the complete application folders, including sub directories and files.

fs:scope-app

This scope permits access to all files and list content of top level directories in the application folders.

fs:scope-app-index

This scope permits to list all files and folders in the application directories.

fs:allow-appcache-read-recursive

This allows full recursive read access to the complete $APPCACHE folder, files and subdirectories.

fs:allow-appcache-write-recursive

This allows full recursive write access to the complete $APPCACHE folder, files and subdirectories.

fs:allow-appcache-read

This allows non-recursive read access to the $APPCACHE folder.

fs:allow-appcache-write

This allows non-recursive write access to the $APPCACHE folder.

fs:allow-appcache-meta-recursive

This allows full recursive read access to metadata of the $APPCACHE folder, including file listing and statistics.

fs:allow-appcache-meta

This allows non-recursive read access to metadata of the $APPCACHE folder, including file listing and statistics.

fs:scope-appcache-recursive

This scope permits recursive access to the complete $APPCACHE folder, including sub directories and files.

fs:scope-appcache

This scope permits access to all files and list content of top level directories in the $APPCACHE folder.

fs:scope-appcache-index

This scope permits to list all files and folders in the $APPCACHEfolder.

fs:allow-appconfig-read-recursive

This allows full recursive read access to the complete $APPCONFIG folder, files and subdirectories.

fs:allow-appconfig-write-recursive

This allows full recursive write access to the complete $APPCONFIG folder, files and subdirectories.

fs:allow-appconfig-read

This allows non-recursive read access to the $APPCONFIG folder.

fs:allow-appconfig-write

This allows non-recursive write access to the $APPCONFIG folder.

fs:allow-appconfig-meta-recursive

This allows full recursive read access to metadata of the $APPCONFIG folder, including file listing and statistics.

fs:allow-appconfig-meta

This allows non-recursive read access to metadata of the $APPCONFIG folder, including file listing and statistics.

fs:scope-appconfig-recursive

This scope permits recursive access to the complete $APPCONFIG folder, including sub directories and files.

fs:scope-appconfig

This scope permits access to all files and list content of top level directories in the $APPCONFIG folder.

fs:scope-appconfig-index

This scope permits to list all files and folders in the $APPCONFIGfolder.

fs:allow-appdata-read-recursive

This allows full recursive read access to the complete $APPDATA folder, files and subdirectories.

fs:allow-appdata-write-recursive

This allows full recursive write access to the complete $APPDATA folder, files and subdirectories.

fs:allow-appdata-read

This allows non-recursive read access to the $APPDATA folder.

fs:allow-appdata-write

This allows non-recursive write access to the $APPDATA folder.

fs:allow-appdata-meta-recursive

This allows full recursive read access to metadata of the $APPDATA folder, including file listing and statistics.

fs:allow-appdata-meta

This allows non-recursive read access to metadata of the $APPDATA folder, including file listing and statistics.

fs:scope-appdata-recursive

This scope permits recursive access to the complete $APPDATA folder, including sub directories and files.

fs:scope-appdata

This scope permits access to all files and list content of top level directories in the $APPDATA folder.

fs:scope-appdata-index

This scope permits to list all files and folders in the $APPDATAfolder.

fs:allow-applocaldata-read-recursive

This allows full recursive read access to the complete $APPLOCALDATA folder, files and subdirectories.

fs:allow-applocaldata-write-recursive

This allows full recursive write access to the complete $APPLOCALDATA folder, files and subdirectories.

fs:allow-applocaldata-read

This allows non-recursive read access to the $APPLOCALDATA folder.

fs:allow-applocaldata-write

This allows non-recursive write access to the $APPLOCALDATA folder.

fs:allow-applocaldata-meta-recursive

This allows full recursive read access to metadata of the $APPLOCALDATA folder, including file listing and statistics.

fs:allow-applocaldata-meta

This allows non-recursive read access to metadata of the $APPLOCALDATA folder, including file listing and statistics.

fs:scope-applocaldata-recursive

This scope permits recursive access to the complete $APPLOCALDATA folder, including sub directories and files.

fs:scope-applocaldata

This scope permits access to all files and list content of top level directories in the $APPLOCALDATA folder.

fs:scope-applocaldata-index

This scope permits to list all files and folders in the $APPLOCALDATAfolder.

fs:allow-applog-read-recursive

This allows full recursive read access to the complete $APPLOG folder, files and subdirectories.

fs:allow-applog-write-recursive

This allows full recursive write access to the complete $APPLOG folder, files and subdirectories.

fs:allow-applog-read

This allows non-recursive read access to the $APPLOG folder.

fs:allow-applog-write

This allows non-recursive write access to the $APPLOG folder.

fs:allow-applog-meta-recursive

This allows full recursive read access to metadata of the $APPLOG folder, including file listing and statistics.

fs:allow-applog-meta

This allows non-recursive read access to metadata of the $APPLOG folder, including file listing and statistics.

fs:scope-applog-recursive

This scope permits recursive access to the complete $APPLOG folder, including sub directories and files.

fs:scope-applog

This scope permits access to all files and list content of top level directories in the $APPLOG folder.

fs:scope-applog-index

This scope permits to list all files and folders in the $APPLOGfolder.

fs:allow-audio-read-recursive

This allows full recursive read access to the complete $AUDIO folder, files and subdirectories.

fs:allow-audio-write-recursive

This allows full recursive write access to the complete $AUDIO folder, files and subdirectories.

fs:allow-audio-read

This allows non-recursive read access to the $AUDIO folder.

fs:allow-audio-write

This allows non-recursive write access to the $AUDIO folder.

fs:allow-audio-meta-recursive

This allows full recursive read access to metadata of the $AUDIO folder, including file listing and statistics.

fs:allow-audio-meta

This allows non-recursive read access to metadata of the $AUDIO folder, including file listing and statistics.

fs:scope-audio-recursive

This scope permits recursive access to the complete $AUDIO folder, including sub directories and files.

fs:scope-audio

This scope permits access to all files and list content of top level directories in the $AUDIO folder.

fs:scope-audio-index

This scope permits to list all files and folders in the $AUDIOfolder.

fs:allow-cache-read-recursive

This allows full recursive read access to the complete $CACHE folder, files and subdirectories.

fs:allow-cache-write-recursive

This allows full recursive write access to the complete $CACHE folder, files and subdirectories.

fs:allow-cache-read

This allows non-recursive read access to the $CACHE folder.

fs:allow-cache-write

This allows non-recursive write access to the $CACHE folder.

fs:allow-cache-meta-recursive

This allows full recursive read access to metadata of the $CACHE folder, including file listing and statistics.

fs:allow-cache-meta

This allows non-recursive read access to metadata of the $CACHE folder, including file listing and statistics.

fs:scope-cache-recursive

This scope permits recursive access to the complete $CACHE folder, including sub directories and files.

fs:scope-cache

This scope permits access to all files and list content of top level directories in the $CACHE folder.

fs:scope-cache-index

This scope permits to list all files and folders in the $CACHEfolder.

fs:allow-config-read-recursive

This allows full recursive read access to the complete $CONFIG folder, files and subdirectories.

fs:allow-config-write-recursive

This allows full recursive write access to the complete $CONFIG folder, files and subdirectories.

fs:allow-config-read

This allows non-recursive read access to the $CONFIG folder.

fs:allow-config-write

This allows non-recursive write access to the $CONFIG folder.

fs:allow-config-meta-recursive

This allows full recursive read access to metadata of the $CONFIG folder, including file listing and statistics.

fs:allow-config-meta

This allows non-recursive read access to metadata of the $CONFIG folder, including file listing and statistics.

fs:scope-config-recursive

This scope permits recursive access to the complete $CONFIG folder, including sub directories and files.

fs:scope-config

This scope permits access to all files and list content of top level directories in the $CONFIG folder.

fs:scope-config-index

This scope permits to list all files and folders in the $CONFIGfolder.

fs:allow-data-read-recursive

This allows full recursive read access to the complete $DATA folder, files and subdirectories.

fs:allow-data-write-recursive

This allows full recursive write access to the complete $DATA folder, files and subdirectories.

fs:allow-data-read

This allows non-recursive read access to the $DATA folder.

fs:allow-data-write

This allows non-recursive write access to the $DATA folder.

fs:allow-data-meta-recursive

This allows full recursive read access to metadata of the $DATA folder, including file listing and statistics.

fs:allow-data-meta

This allows non-recursive read access to metadata of the $DATA folder, including file listing and statistics.

fs:scope-data-recursive

This scope permits recursive access to the complete $DATA folder, including sub directories and files.

fs:scope-data

This scope permits access to all files and list content of top level directories in the $DATA folder.

fs:scope-data-index

This scope permits to list all files and folders in the $DATAfolder.

fs:allow-desktop-read-recursive

This allows full recursive read access to the complete $DESKTOP folder, files and subdirectories.

fs:allow-desktop-write-recursive

This allows full recursive write access to the complete $DESKTOP folder, files and subdirectories.

fs:allow-desktop-read

This allows non-recursive read access to the $DESKTOP folder.

fs:allow-desktop-write

This allows non-recursive write access to the $DESKTOP folder.

fs:allow-desktop-meta-recursive

This allows full recursive read access to metadata of the $DESKTOP folder, including file listing and statistics.

fs:allow-desktop-meta

This allows non-recursive read access to metadata of the $DESKTOP folder, including file listing and statistics.

fs:scope-desktop-recursive

This scope permits recursive access to the complete $DESKTOP folder, including sub directories and files.

fs:scope-desktop

This scope permits access to all files and list content of top level directories in the $DESKTOP folder.

fs:scope-desktop-index

This scope permits to list all files and folders in the $DESKTOPfolder.

fs:allow-document-read-recursive

This allows full recursive read access to the complete $DOCUMENT folder, files and subdirectories.

fs:allow-document-write-recursive

This allows full recursive write access to the complete $DOCUMENT folder, files and subdirectories.

fs:allow-document-read

This allows non-recursive read access to the $DOCUMENT folder.

fs:allow-document-write

This allows non-recursive write access to the $DOCUMENT folder.

fs:allow-document-meta-recursive

This allows full recursive read access to metadata of the $DOCUMENT folder, including file listing and statistics.

fs:allow-document-meta

This allows non-recursive read access to metadata of the $DOCUMENT folder, including file listing and statistics.

fs:scope-document-recursive

This scope permits recursive access to the complete $DOCUMENT folder, including sub directories and files.

fs:scope-document

This scope permits access to all files and list content of top level directories in the $DOCUMENT folder.

fs:scope-document-index

This scope permits to list all files and folders in the $DOCUMENTfolder.

fs:allow-download-read-recursive

This allows full recursive read access to the complete $DOWNLOAD folder, files and subdirectories.

fs:allow-download-write-recursive

This allows full recursive write access to the complete $DOWNLOAD folder, files and subdirectories.

fs:allow-download-read

This allows non-recursive read access to the $DOWNLOAD folder.

fs:allow-download-write

This allows non-recursive write access to the $DOWNLOAD folder.

fs:allow-download-meta-recursive

This allows full recursive read access to metadata of the $DOWNLOAD folder, including file listing and statistics.

fs:allow-download-meta

This allows non-recursive read access to metadata of the $DOWNLOAD folder, including file listing and statistics.

fs:scope-download-recursive

This scope permits recursive access to the complete $DOWNLOAD folder, including sub directories and files.

fs:scope-download

This scope permits access to all files and list content of top level directories in the $DOWNLOAD folder.

fs:scope-download-index

This scope permits to list all files and folders in the $DOWNLOADfolder.

fs:allow-exe-read-recursive

This allows full recursive read access to the complete $EXE folder, files and subdirectories.

fs:allow-exe-write-recursive

This allows full recursive write access to the complete $EXE folder, files and subdirectories.

fs:allow-exe-read

This allows non-recursive read access to the $EXE folder.

fs:allow-exe-write

This allows non-recursive write access to the $EXE folder.

fs:allow-exe-meta-recursive

This allows full recursive read access to metadata of the $EXE folder, including file listing and statistics.

fs:allow-exe-meta

This allows non-recursive read access to metadata of the $EXE folder, including file listing and statistics.

fs:scope-exe-recursive

This scope permits recursive access to the complete $EXE folder, including sub directories and files.

fs:scope-exe

This scope permits access to all files and list content of top level directories in the $EXE folder.

fs:scope-exe-index

This scope permits to list all files and folders in the $EXEfolder.

fs:allow-font-read-recursive

This allows full recursive read access to the complete $FONT folder, files and subdirectories.

fs:allow-font-write-recursive

This allows full recursive write access to the complete $FONT folder, files and subdirectories.

fs:allow-font-read

This allows non-recursive read access to the $FONT folder.

fs:allow-font-write

This allows non-recursive write access to the $FONT folder.

fs:allow-font-meta-recursive

This allows full recursive read access to metadata of the $FONT folder, including file listing and statistics.

fs:allow-font-meta

This allows non-recursive read access to metadata of the $FONT folder, including file listing and statistics.

fs:scope-font-recursive

This scope permits recursive access to the complete $FONT folder, including sub directories and files.

fs:scope-font

This scope permits access to all files and list content of top level directories in the $FONT folder.

fs:scope-font-index

This scope permits to list all files and folders in the $FONTfolder.

fs:allow-home-read-recursive

This allows full recursive read access to the complete $HOME folder, files and subdirectories.

fs:allow-home-write-recursive

This allows full recursive write access to the complete $HOME folder, files and subdirectories.

fs:allow-home-read

This allows non-recursive read access to the $HOME folder.

fs:allow-home-write

This allows non-recursive write access to the $HOME folder.

fs:allow-home-meta-recursive

This allows full recursive read access to metadata of the $HOME folder, including file listing and statistics.

fs:allow-home-meta

This allows non-recursive read access to metadata of the $HOME folder, including file listing and statistics.

fs:scope-home-recursive

This scope permits recursive access to the complete $HOME folder, including sub directories and files.

fs:scope-home

This scope permits access to all files and list content of top level directories in the $HOME folder.

fs:scope-home-index

This scope permits to list all files and folders in the $HOMEfolder.

fs:allow-localdata-read-recursive

This allows full recursive read access to the complete $LOCALDATA folder, files and subdirectories.

fs:allow-localdata-write-recursive

This allows full recursive write access to the complete $LOCALDATA folder, files and subdirectories.

fs:allow-localdata-read

This allows non-recursive read access to the $LOCALDATA folder.

fs:allow-localdata-write

This allows non-recursive write access to the $LOCALDATA folder.

fs:allow-localdata-meta-recursive

This allows full recursive read access to metadata of the $LOCALDATA folder, including file listing and statistics.

fs:allow-localdata-meta

This allows non-recursive read access to metadata of the $LOCALDATA folder, including file listing and statistics.

fs:scope-localdata-recursive

This scope permits recursive access to the complete $LOCALDATA folder, including sub directories and files.

fs:scope-localdata

This scope permits access to all files and list content of top level directories in the $LOCALDATA folder.

fs:scope-localdata-index

This scope permits to list all files and folders in the $LOCALDATAfolder.

fs:allow-log-read-recursive

This allows full recursive read access to the complete $LOG folder, files and subdirectories.

fs:allow-log-write-recursive

This allows full recursive write access to the complete $LOG folder, files and subdirectories.

fs:allow-log-read

This allows non-recursive read access to the $LOG folder.

fs:allow-log-write

This allows non-recursive write access to the $LOG folder.

fs:allow-log-meta-recursive

This allows full recursive read access to metadata of the $LOG folder, including file listing and statistics.

fs:allow-log-meta

This allows non-recursive read access to metadata of the $LOG folder, including file listing and statistics.

fs:scope-log-recursive

This scope permits recursive access to the complete $LOG folder, including sub directories and files.

fs:scope-log

This scope permits access to all files and list content of top level directories in the $LOG folder.

fs:scope-log-index

This scope permits to list all files and folders in the $LOGfolder.

fs:allow-picture-read-recursive

This allows full recursive read access to the complete $PICTURE folder, files and subdirectories.

fs:allow-picture-write-recursive

This allows full recursive write access to the complete $PICTURE folder, files and subdirectories.

fs:allow-picture-read

This allows non-recursive read access to the $PICTURE folder.

fs:allow-picture-write

This allows non-recursive write access to the $PICTURE folder.

fs:allow-picture-meta-recursive

This allows full recursive read access to metadata of the $PICTURE folder, including file listing and statistics.

fs:allow-picture-meta

This allows non-recursive read access to metadata of the $PICTURE folder, including file listing and statistics.

fs:scope-picture-recursive

This scope permits recursive access to the complete $PICTURE folder, including sub directories and files.

fs:scope-picture

This scope permits access to all files and list content of top level directories in the $PICTURE folder.

fs:scope-picture-index

This scope permits to list all files and folders in the $PICTUREfolder.

fs:allow-public-read-recursive

This allows full recursive read access to the complete $PUBLIC folder, files and subdirectories.

fs:allow-public-write-recursive

This allows full recursive write access to the complete $PUBLIC folder, files and subdirectories.

fs:allow-public-read

This allows non-recursive read access to the $PUBLIC folder.

fs:allow-public-write

This allows non-recursive write access to the $PUBLIC folder.

fs:allow-public-meta-recursive

This allows full recursive read access to metadata of the $PUBLIC folder, including file listing and statistics.

fs:allow-public-meta

This allows non-recursive read access to metadata of the $PUBLIC folder, including file listing and statistics.

fs:scope-public-recursive

This scope permits recursive access to the complete $PUBLIC folder, including sub directories and files.

fs:scope-public

This scope permits access to all files and list content of top level directories in the $PUBLIC folder.

fs:scope-public-index

This scope permits to list all files and folders in the $PUBLICfolder.

fs:allow-resource-read-recursive

This allows full recursive read access to the complete $RESOURCE folder, files and subdirectories.

fs:allow-resource-write-recursive

This allows full recursive write access to the complete $RESOURCE folder, files and subdirectories.

fs:allow-resource-read

This allows non-recursive read access to the $RESOURCE folder.

fs:allow-resource-write

This allows non-recursive write access to the $RESOURCE folder.

fs:allow-resource-meta-recursive

This allows full recursive read access to metadata of the $RESOURCE folder, including file listing and statistics.

fs:allow-resource-meta

This allows non-recursive read access to metadata of the $RESOURCE folder, including file listing and statistics.

fs:scope-resource-recursive

This scope permits recursive access to the complete $RESOURCE folder, including sub directories and files.

fs:scope-resource

This scope permits access to all files and list content of top level directories in the $RESOURCE folder.

fs:scope-resource-index

This scope permits to list all files and folders in the $RESOURCEfolder.

fs:allow-runtime-read-recursive

This allows full recursive read access to the complete $RUNTIME folder, files and subdirectories.

fs:allow-runtime-write-recursive

This allows full recursive write access to the complete $RUNTIME folder, files and subdirectories.

fs:allow-runtime-read

This allows non-recursive read access to the $RUNTIME folder.

fs:allow-runtime-write

This allows non-recursive write access to the $RUNTIME folder.

fs:allow-runtime-meta-recursive

This allows full recursive read access to metadata of the $RUNTIME folder, including file listing and statistics.

fs:allow-runtime-meta

This allows non-recursive read access to metadata of the $RUNTIME folder, including file listing and statistics.

fs:scope-runtime-recursive

This scope permits recursive access to the complete $RUNTIME folder, including sub directories and files.

fs:scope-runtime

This scope permits access to all files and list content of top level directories in the $RUNTIME folder.

fs:scope-runtime-index

This scope permits to list all files and folders in the $RUNTIMEfolder.

fs:allow-temp-read-recursive

This allows full recursive read access to the complete $TEMP folder, files and subdirectories.

fs:allow-temp-write-recursive

This allows full recursive write access to the complete $TEMP folder, files and subdirectories.

fs:allow-temp-read

This allows non-recursive read access to the $TEMP folder.

fs:allow-temp-write

This allows non-recursive write access to the $TEMP folder.

fs:allow-temp-meta-recursive

This allows full recursive read access to metadata of the $TEMP folder, including file listing and statistics.

fs:allow-temp-meta

This allows non-recursive read access to metadata of the $TEMP folder, including file listing and statistics.

fs:scope-temp-recursive

This scope permits recursive access to the complete $TEMP folder, including sub directories and files.

fs:scope-temp

This scope permits access to all files and list content of top level directories in the $TEMP folder.

fs:scope-temp-index

This scope permits to list all files and folders in the $TEMPfolder.

fs:allow-template-read-recursive

This allows full recursive read access to the complete $TEMPLATE folder, files and subdirectories.

fs:allow-template-write-recursive

This allows full recursive write access to the complete $TEMPLATE folder, files and subdirectories.

fs:allow-template-read

This allows non-recursive read access to the $TEMPLATE folder.

fs:allow-template-write

This allows non-recursive write access to the $TEMPLATE folder.

fs:allow-template-meta-recursive

This allows full recursive read access to metadata of the $TEMPLATE folder, including file listing and statistics.

fs:allow-template-meta

This allows non-recursive read access to metadata of the $TEMPLATE folder, including file listing and statistics.

fs:scope-template-recursive

This scope permits recursive access to the complete $TEMPLATE folder, including sub directories and files.

fs:scope-template

This scope permits access to all files and list content of top level directories in the $TEMPLATE folder.

fs:scope-template-index

This scope permits to list all files and folders in the $TEMPLATEfolder.

fs:allow-video-read-recursive

This allows full recursive read access to the complete $VIDEO folder, files and subdirectories.

fs:allow-video-write-recursive

This allows full recursive write access to the complete $VIDEO folder, files and subdirectories.

fs:allow-video-read

This allows non-recursive read access to the $VIDEO folder.

fs:allow-video-write

This allows non-recursive write access to the $VIDEO folder.

fs:allow-video-meta-recursive

This allows full recursive read access to metadata of the $VIDEO folder, including file listing and statistics.

fs:allow-video-meta

This allows non-recursive read access to metadata of the $VIDEO folder, including file listing and statistics.

fs:scope-video-recursive

This scope permits recursive access to the complete $VIDEO folder, including sub directories and files.

fs:scope-video

This scope permits access to all files and list content of top level directories in the $VIDEO folder.

fs:scope-video-index

This scope permits to list all files and folders in the $VIDEOfolder.

fs:allow-copy-file

Enables the copy_file command without any pre-configured scope.

fs:deny-copy-file

Denies the copy_file command without any pre-configured scope.

fs:allow-create

Enables the create command without any pre-configured scope.

fs:deny-create

Denies the create command without any pre-configured scope.

fs:allow-exists

Enables the exists command without any pre-configured scope.

fs:deny-exists

Denies the exists command without any pre-configured scope.

fs:allow-fstat

Enables the fstat command without any pre-configured scope.

fs:deny-fstat

Denies the fstat command without any pre-configured scope.

fs:allow-ftruncate

Enables the ftruncate command without any pre-configured scope.

fs:deny-ftruncate

Denies the ftruncate command without any pre-configured scope.

fs:allow-lstat

Enables the lstat command without any pre-configured scope.

fs:deny-lstat

Denies the lstat command without any pre-configured scope.

fs:allow-mkdir

Enables the mkdir command without any pre-configured scope.

fs:deny-mkdir

Denies the mkdir command without any pre-configured scope.

fs:allow-open

Enables the open command without any pre-configured scope.

fs:deny-open

Denies the open command without any pre-configured scope.

fs:allow-read

Enables the read command without any pre-configured scope.

fs:deny-read

Denies the read command without any pre-configured scope.

fs:allow-read-dir

Enables the read_dir command without any pre-configured scope.

fs:deny-read-dir

Denies the read_dir command without any pre-configured scope.

fs:allow-read-file

Enables the read_file command without any pre-configured scope.

fs:deny-read-file

Denies the read_file command without any pre-configured scope.

fs:allow-read-text-file

Enables the read_text_file command without any pre-configured scope.

fs:deny-read-text-file

Denies the read_text_file command without any pre-configured scope.

fs:allow-read-text-file-lines

Enables the read_text_file_lines command without any pre-configured scope.

fs:deny-read-text-file-lines

Denies the read_text_file_lines command without any pre-configured scope.

fs:allow-read-text-file-lines-next

Enables the read_text_file_lines_next command without any pre-configured scope.

fs:deny-read-text-file-lines-next

Denies the read_text_file_lines_next command without any pre-configured scope.

fs:allow-remove

Enables the remove command without any pre-configured scope.

fs:deny-remove

Denies the remove command without any pre-configured scope.

fs:allow-rename

Enables the rename command without any pre-configured scope.

fs:deny-rename

Denies the rename command without any pre-configured scope.

fs:allow-seek

Enables the seek command without any pre-configured scope.

fs:deny-seek

Denies the seek command without any pre-configured scope.

fs:allow-size

Enables the size command without any pre-configured scope.

fs:deny-size

Denies the size command without any pre-configured scope.

fs:allow-stat

Enables the stat command without any pre-configured scope.

fs:deny-stat

Denies the stat command without any pre-configured scope.

fs:allow-truncate

Enables the truncate command without any pre-configured scope.

fs:deny-truncate

Denies the truncate command without any pre-configured scope.

fs:allow-unwatch

Enables the unwatch command without any pre-configured scope.

fs:deny-unwatch

Denies the unwatch command without any pre-configured scope.

fs:allow-watch

Enables the watch command without any pre-configured scope.

fs:deny-watch

Denies the watch command without any pre-configured scope.

fs:allow-write

Enables the write command without any pre-configured scope.

fs:deny-write

Denies the write command without any pre-configured scope.

fs:allow-write-file

Enables the write_file command without any pre-configured scope.

fs:deny-write-file

Denies the write_file command without any pre-configured scope.

fs:allow-write-text-file

Enables the write_text_file command without any pre-configured scope.

fs:deny-write-text-file

Denies the write_text_file command without any pre-configured scope.

fs:create-app-specific-dirs

This permissions allows to create the application specific directories.

fs:deny-default

This denies access to dangerous Tauri relevant files and folders by default.

fs:deny-webview-data-linux

This denies read access to the $APPLOCALDATA folder on linux as the webview data and configuration values are stored here. Allowing access can lead to sensitive information disclosure and should be well considered.

fs:deny-webview-data-windows

This denies read access to the $APPLOCALDATA/EBWebView folder on windows as the webview data and configuration values are stored here. Allowing access can lead to sensitive information disclosure and should be well considered.

fs:read-all

This enables all read related commands without any pre-configured accessible paths.

fs:read-app-specific-dirs-recursive

This permission allows recursive read functionality on the application specific base directories.

fs:read-dirs

This enables directory read and file metadata related commands without any pre-configured accessible paths.

fs:read-files

This enables file read related commands without any pre-configured accessible paths.

fs:read-meta

This enables all index or metadata related commands without any pre-configured accessible paths.

fs:scope

An empty permission you can use to modify the global scope.

fs:write-all

This enables all write related commands without any pre-configured accessible paths.

fs:write-files

This enables all file write related commands without any pre-configured accessible paths.

Scopes
This plugin permissions includes scopes for defining which paths are allowed or explicitly rejected. For more information on scopes, see the Command Scopes.

Each allow or deny scope must include an array listing all paths that should be allowed or denied. The scope entries are in the { path: string } format.

Note

deny take precedence over allow so if a path is denied by a scope, it will be blocked at runtime even if it is allowed by another scope.

Scope entries can use $<path> variables to reference common system paths such as the home directory, the app resources directory and the config directory. The following table lists all common paths you can reference:

Path	Variable
appConfigDir	$APPCONFIG
appDataDir	$APPDATA
appLocalDataDir	$APPLOCALDATA
appcacheDir	$APPCACHE
applogDir	$APPLOG
audioDir	$AUDIO
cacheDir	$CACHE
configDir	$CONFIG
dataDir	$DATA
localDataDir	$LOCALDATA
desktopDir	$DESKTOP
documentDir	$DOCUMENT
downloadDir	$DOWNLOAD
executableDir	$EXE
fontDir	$FONT
homeDir	$HOME
pictureDir	$PICTURE
publicDir	$PUBLIC
runtimeDir	$RUNTIME
templateDir	$TEMPLATE
videoDir	$VIDEO
resourceDir	$RESOURCE
tempDir	$TEMP
Examples
global scope
To apply a scope to any fs command, use the fs:scope permission:

src-tauri/capabilities/default.json
{
  "$schema": "../gen/schemas/desktop-schema.json",
  "identifier": "main-capability",
  "description": "Capability for the main window",
  "windows": ["main"],
  "permissions": [
    {
      "identifier": "fs:scope",
      "allow": [{ "path": "$APPDATA" }, { "path": "$APPDATA/**" }]
    }
  ]
}

To apply a scope to a specific fs command, use the the object form of permissions { "identifier": string, "allow"?: [], "deny"?: [] }:

src-tauri/capabilities/default.json
{
  "$schema": "../gen/schemas/desktop-schema.json",
  "identifier": "main-capability",
  "description": "Capability for the main window",
  "windows": ["main"],
  "permissions": [
    {
      "identifier": "fs:allow-rename",
      "allow": [{ "path": "$HOME/**" }]
    },
    {
      "identifier": "fs:allow-rename",
      "deny": [{ "path": "$HOME/.config/**" }]
    },
    {
      "identifier": "fs:allow-exists",
      "allow": [{ "path": "$APPDATA/*" }]
    }
  ]
}

In the above example you can use the exists API using any $APPDATA sub path (does not include sub-directories) and the rename

Shell
GitHub
npm
crates.io
API Reference
Access the system shell. Allows you to spawn child processes and manage files and URLs using their default application.

Supported Platforms
This plugin requires a Rust version of at least 1.77.2

Platform	Level	Notes
windows	
linux	
macos	
android	
Only allows to open URLs via open

ios	
Only allows to open URLs via open

Setup
Install the shell plugin to get started.

Automatic
Manual
Use your project’s package manager to add the dependency:

npm
yarn
pnpm
deno
bun
cargo
bun tauri add shell

Usage
The shell plugin is available in both JavaScript and Rust.

JavaScript
Rust
use tauri_plugin_shell::ShellExt;

let shell = app_handle.shell();
let output = tauri::async_runtime::block_on(async move {
    shell
        .command("echo")
        .args(["Hello from Rust!"])
        .output()
        .await
        .unwrap()
});
if output.status.success() {
    println!("Result: {:?}", String::from_utf8(output.stdout));
} else {
    println!("Exit with code: {}", output.status.code().unwrap());
}

Permissions
By default all potentially dangerous plugin commands and scopes are blocked and cannot be accessed. You must modify the permissions in your capabilities configuration to enable these.

See the Capabilities Overview for more information and the step by step guide to use plugin permissions.

src-tauri/capabilities/default.json
{
  "$schema": "../gen/schemas/desktop-schema.json",
  "identifier": "main-capability",
  "description": "Capability for the main window",
  "windows": ["main"],
  "permissions": [
    {
      "identifier": "shell:allow-execute",
      "allow": [
        {
          "name": "exec-sh",
          "cmd": "sh",
          "args": [
            "-c",
            {
              "validator": "\\S+"
            }
          ],
          "sidecar": false
        }
      ]
    }
  ]
}

Default Permission
This permission set configures which shell functionality is exposed by default.

Granted Permissions
It allows to use the open functionality without any specific scope pre-configured. It will allow opening http(s)://, tel: and mailto: links.

allow-open
Permission Table
Identifier	Description
shell:allow-execute

Enables the execute command without any pre-configured scope.

shell:deny-execute

Denies the execute command without any pre-configured scope.

shell:allow-kill

Enables the kill command without any pre-configured scope.

shell:deny-kill

Denies the kill command without any pre-configured scope.

shell:allow-open

Enables the open command without any pre-configured scope.

shell:deny-open

Denies the open command without any pre-configured scope.

shell:allow-spawn

Enables the spawn command without any pre-configured scope.

shell:deny-spawn

Denies the spawn command without any pre-configured scope.

shell:allow-stdin-write

Enables the stdin_write command without any pre-configured scope.

shell:deny-stdin-write

Denies the stdin_write command without any pre-configured scope.

Process
GitHub
npm
crates.io
API Reference
This plugin provides APIs to access the current process. To spawn child processes, see the shell plugin.

Supported Platforms
This plugin requires a Rust version of at least 1.77.2

Platform	Level	Notes
windows	
linux	
macos	
android	
ios	
Setup
Install the plugin-process to get started.

Automatic
Manual
Use your project’s package manager to add the dependency:

npm
yarn
pnpm
deno
bun
cargo
bun tauri add process

Usage
The process plugin is available in both JavaScript and Rust.

JavaScript
Rust
Note that app is an instance of AppHandle.

// exits the app with the given status code
app.exit(0);

// restarts the app
app.restart();

Permissions
By default all potentially dangerous plugin commands and scopes are blocked and cannot be accessed. You must modify the permissions in your capabilities configuration to enable these.

See the Capabilities Overview for more information and the step by step guide to use plugin permissions.

src-tauri/capabilities/default.json
{
  "permissions": [
    ...,
    "process:default",
  ]
}

Default Permission
This permission set configures which process feeatures are by default exposed.

Granted Permissions
This enables to quit via allow-exit and restart via allow-restart the application.

allow-exit
allow-restart
Permission Table
Identifier	Description
process:allow-exit

Enables the exit command without any pre-configured scope.

process:deny-exit

Denies the exit command without any pre-configured scope.

process:allow-restart

Enables the restart command without any pre-configured scope.

process:deny-restart

Denies the restart command without any pre-configured scope.