#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

mod window_management;

use tauri::{Emitter, Manager, Runtime};
use std::sync::Mutex;
use std::sync::atomic::{AtomicBool, Ordering};
use serde_json;
use std::path::{Path, PathBuf};
use std::fs::{self, File};
use chrono::{DateTime, Utc};
use serde::{Serialize, Deserialize};
use tauri_plugin_shell::ShellExt;
use tauri_plugin_shell::process::{CommandChild, CommandEvent};
use std::collections::HashMap;

#[derive(Debug, Serialize)]
struct FileNode {
    name: String,
    path: String,
    is_dir: bool,
    children: Option<Vec<FileNode>>,
}

fn build_file_tree(path: &Path) -> Result<FileNode, String> {
    let metadata = fs::metadata(path).map_err(|e| e.to_string())?;
    let name = path.file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("")
        .to_string();
    let path_str = path.to_string_lossy().into_owned();

    if metadata.is_dir() {
        let mut children = Vec::new();
        for entry in fs::read_dir(path).map_err(|e| e.to_string())? {
            let entry = entry.map_err(|e| e.to_string())?;
            let child = build_file_tree(&entry.path())?;
            children.push(child);
        }
        children.sort_by(|a, b| {
            match (a.is_dir, b.is_dir) {
                (true, false) => std::cmp::Ordering::Less,
                (false, true) => std::cmp::Ordering::Greater,
                _ => a.name.cmp(&b.name),
            }
        });
        Ok(FileNode {
            name,
            path: path_str,
            is_dir: true,
            children: Some(children),
        })
    } else {
        Ok(FileNode {
            name,
            path: path_str,
            is_dir: false,
            children: None,
        })
    }
}

#[tauri::command]
async fn get_project_structure(path: String) -> Result<FileNode, String> {
    build_file_tree(Path::new(&path))
}

// Improved terminal session management
pub struct TerminalSession {
    child: CommandChild,
}

pub struct TerminalState {
    sessions: Mutex<HashMap<u32, TerminalSession>>,
}

impl Default for TerminalState {
    fn default() -> Self {
        Self {
            sessions: Mutex::new(HashMap::new()),
        }
    }
}

#[derive(Debug, Serialize, Deserialize)]
struct RecentProject {
    name: String,
    path: String,
    last_opened: DateTime<Utc>,
    template: String,
}

#[derive(Debug, Serialize, Deserialize)]
struct ProjectConfig {
    recent_projects: Vec<RecentProject>,
}

impl ProjectConfig {
    fn load() -> Self {
        let config_dir = dirs::config_dir()
            .expect("Failed to get config dir")
            .join("warpcode");
        let config_file = config_dir.join("projects.json");

        if !config_dir.exists() {
            fs::create_dir_all(&config_dir).expect("Failed to create config directory");
        }

        if !config_file.exists() {
            return ProjectConfig {
                recent_projects: Vec::new(),
            };
        }

        let content = fs::read_to_string(config_file).expect("Failed to read config file");
        serde_json::from_str(&content).unwrap_or_else(|_| ProjectConfig {
            recent_projects: Vec::new(),
        })
    }

    fn save(&self) {
        let config_dir = dirs::config_dir()
            .expect("Failed to get config dir")
            .join("warpcode");
        let config_file = config_dir.join("projects.json");

        let content = serde_json::to_string_pretty(self).expect("Failed to serialize config");
        fs::write(config_file, content).expect("Failed to write config file");
    }

    fn add_recent_project(&mut self, name: String, path: String, template: String) {
        self.recent_projects.retain(|p| p.path != path);
        self.recent_projects.insert(0, RecentProject {
            name,
            path,
            last_opened: Utc::now(),
            template,
        });
        if self.recent_projects.len() > 10 {
            self.recent_projects.truncate(10);
        }
        self.save();
    }

    fn remove_recent_project(&mut self, path: String) {
        self.recent_projects.retain(|p| p.path != path);
        self.save();
    }
}

#[tauri::command]
async fn get_recent_projects() -> Result<Vec<RecentProject>, String> {
    let config = ProjectConfig::load();
    Ok(config.recent_projects)
}

#[tauri::command]
async fn remove_recent_project(path: String) -> Result<(), String> {
    let mut config = ProjectConfig::load();
    config.remove_recent_project(path);
    Ok(())
}

#[tauri::command]
async fn create_project(
    name: String,
    template: String,
    path: String,
    app_handle: tauri::AppHandle,
) -> Result<(), String> {
    let project_path = PathBuf::from(&path).join(&name);
    fs::create_dir_all(&project_path)
        .map_err(|e| format!("Failed to create project directory: {}", e))?;

    let template_path = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .join("templates")
        .join(&template);

    if !template_path.exists() {
        return Err(format!("Template '{}' not found", template));
    }

    copy_dir_all(&template_path, &project_path)
        .map_err(|e| format!("Failed to copy template: {}", e))?;

    let project_path_str = project_path.to_string_lossy().into_owned();
    let mut config = ProjectConfig::load();
    config.add_recent_project(
        name,
        project_path_str.clone(),
        template,
    );

    // Open the editor window first
    window_management::open_editor_window(&app_handle, &project_path)?;

    // Then close the launcher window
    if let Some(launcher) = app_handle.get_webview_window("launcher") {
        launcher.close().map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
async fn open_project(
    path: String,
    app_handle: tauri::AppHandle,
) -> Result<(), String> {
    let project_path = PathBuf::from(&path);
    if !project_path.exists() {
        return Err("Project directory does not exist".into());
    }

    let name = project_path
        .file_name()
        .and_then(|n| n.to_str())
        .ok_or("Invalid project name")?
        .to_string();

    let mut config = ProjectConfig::load();
    config.add_recent_project(
        name,
        path.clone(),
        "unknown".into(),
    );

    // Open the editor window first
    window_management::open_editor_window(&app_handle, &PathBuf::from(path))?;

    // Then close the launcher window
    if let Some(launcher) = app_handle.get_webview_window("launcher") {
        launcher.close().map_err(|e| e.to_string())?;
    }
    Ok(())
}

fn copy_dir_all(src: impl AsRef<Path>, dst: impl AsRef<Path>) -> std::io::Result<()> {
    let src = src.as_ref();
    let dst = dst.as_ref();
    if !dst.exists() {
        fs::create_dir_all(dst)?;
    }
    
    for entry in fs::read_dir(src)? {
        let entry = entry?;
        let ty = entry.file_type()?;
        let path = entry.path();
        
        // Get the relative path from src to the current file
        let relative = path.strip_prefix(src).unwrap();
        let target = dst.join(relative);
        
        if ty.is_dir() {
            fs::create_dir_all(&target)?;
            copy_dir_all(&path, &target)?;
        } else {
            if let Some(parent) = target.parent() {
                if !parent.exists() {
                    fs::create_dir_all(parent)?;
                }
            }
            fs::copy(&path, &target)?;
        }
    }
    Ok(())
}

#[derive(Debug, Clone, Serialize)]
struct TerminalOutput {
    pid: u32,
    data: String,
}

#[tauri::command]
async fn create_terminal_session<R: Runtime>(app: tauri::AppHandle<R>) -> Result<u32, String> {
    let shell = app.shell();
    
    // Use the shell plugin to spawn a new shell process
    let shell_command = if cfg!(target_os = "windows") {
        "cmd"
    } else if Path::new("/bin/zsh").exists() {
        "/bin/zsh"
    } else {
        "/bin/bash"
    };
    
    let (mut rx, child) = shell
        .command(shell_command)
        .spawn()
        .map_err(|e| format!("Failed to spawn shell: {}", e))?;
    
    let pid = child.pid();
    
    // Store the terminal session
    let state: tauri::State<TerminalState> = app.state();
    state.sessions.lock().unwrap().insert(pid, TerminalSession { child });
    
    // Handle terminal output
    let app_handle = app.clone();
    tauri::async_runtime::spawn(async move {
        while let Some(event) = rx.recv().await {
            match event {
                CommandEvent::Stdout(data) => {
                    if let Ok(str_data) = String::from_utf8(data.clone()) {
                        let _ = app_handle.emit("terminal-output", TerminalOutput {
                            pid,
                            data: str_data,
                        });
                    }
                }
                CommandEvent::Stderr(data) => {
                    if let Ok(str_data) = String::from_utf8(data.clone()) {
                        let _ = app_handle.emit("terminal-output", TerminalOutput {
                            pid,
                            data: str_data,
                        });
                    }
                }
                _ => {}
            }
        }
    });
    
    Ok(pid)
}

#[tauri::command]
async fn kill_terminal_session<R: Runtime>(
    app: tauri::AppHandle<R>,
    pid: u32,
) -> Result<(), String> {
    let state: tauri::State<TerminalState> = app.state();
    let mut sessions = state.sessions.lock().unwrap();
    
    if let Some(session) = sessions.remove(&pid) {
        session.child.kill().map_err(|e| e.to_string())?;
    }
    
    Ok(())
}

#[tauri::command]
async fn write_to_terminal<R: Runtime>(
    app: tauri::AppHandle<R>,
    pid: u32,
    data: String,
) -> Result<(), String> {
    let state: tauri::State<TerminalState> = app.state();
    let mut sessions = state.sessions.lock().unwrap();
    
    if let Some(session) = sessions.get_mut(&pid) {
        session.child.write(data.as_bytes()).map_err(|e| e.to_string())?;
    } else {
        return Err("Terminal session not found".into());
    }
    
    Ok(())
}

#[tauri::command]
async fn read_file_content(path: String) -> Result<String, String> {
    fs::read_to_string(path).map_err(|e| e.to_string())
}

#[tauri::command]
async fn write_file_content(path: String, content: String) -> Result<(), String> {
    fs::write(path, content).map_err(|e| e.to_string())
}

#[derive(Debug, Clone, Serialize)]
struct FileEvent {
    kind: String,
    paths: Vec<String>,
}

#[tauri::command]
async fn watch_path(
    path: String,
    app_handle: tauri::AppHandle,
) -> Result<(), String> {
    use notify::{Watcher, RecursiveMode};
    let app = app_handle.clone();
    
    let mut watcher = notify::recommended_watcher(move |res: Result<notify::Event, _>| {
        match res {
            Ok(event) => {
                let event_data = FileEvent {
                    kind: format!("{:?}", event.kind),
                    paths: event.paths.iter().map(|p| p.to_string_lossy().into_owned()).collect(),
                };
                let _ = app.emit("fs-event", event_data);
            }
            Err(e) => println!("watch error: {:?}", e),
        }
    }).map_err(|e| e.to_string())?;

    watcher.watch(Path::new(&path), RecursiveMode::Recursive)
        .map_err(|e| e.to_string())?;
    
    Ok(())
}

// File system operations
#[tauri::command]
async fn create_file(path: String) -> Result<(), String> {
    File::create(&path)
        .map_err(|e| format!("Failed to create file: {}", e))?;
    Ok(())
}

#[tauri::command]
async fn create_directory(path: String) -> Result<(), String> {
    fs::create_dir_all(&path)
        .map_err(|e| format!("Failed to create directory: {}", e))?;
    Ok(())
}

#[tauri::command]
async fn rename_path(from: String, to: String) -> Result<(), String> {
    let from_path = Path::new(&from).canonicalize()
        .map_err(|e| format!("Failed to resolve source path: {}", e))?;
    let to_path = Path::new(&to);
    
    // Ensure parent directory exists
    if let Some(parent) = to_path.parent() {
        fs::create_dir_all(parent)
            .map_err(|e| format!("Failed to create parent directory: {}", e))?;
    }
    
    fs::rename(&from_path, to_path)
        .map_err(|e| format!("Failed to rename: {}", e))?;
    Ok(())
}

#[tauri::command]
async fn delete_path(path: String) -> Result<(), String> {
    let path = Path::new(&path).canonicalize()
        .map_err(|e| format!("Failed to resolve path: {}", e))?;
    
    if !path.exists() {
        return Err("Path does not exist".to_string());
    }
    
    if path.is_dir() {
        fs::remove_dir_all(&path)
            .map_err(|e| format!("Failed to delete directory: {}", e))?;
    } else {
        fs::remove_file(&path)
            .map_err(|e| format!("Failed to delete file: {}", e))?;
    }
    Ok(())
}

// Clipboard operations with improved path handling
static mut CLIPBOARD: Option<(String, bool)> = None; // (path, is_cut)
static CLIPBOARD_LOCK: AtomicBool = AtomicBool::new(false);

#[tauri::command]
async fn copy_path(path: String, cut: bool) -> Result<(), String> {
    // Verify the path exists before copying
    let canonical_path = Path::new(&path).canonicalize()
        .map_err(|e| format!("Failed to resolve path: {}", e))?;
    
    if !canonical_path.exists() {
        return Err("Source path does not exist".to_string());
    }
    
    while CLIPBOARD_LOCK.compare_exchange(false, true, Ordering::Acquire, Ordering::Relaxed).is_err() {
        std::thread::yield_now();
    }
    
    unsafe {
        CLIPBOARD = Some((canonical_path.to_string_lossy().into_owned(), cut));
    }
    
    CLIPBOARD_LOCK.store(false, Ordering::Release);
    Ok(())
}

#[tauri::command]
async fn paste_path(destination: String) -> Result<(), String> {
    while CLIPBOARD_LOCK.compare_exchange(false, true, Ordering::Acquire, Ordering::Relaxed).is_err() {
        std::thread::yield_now();
    }
    
    let result = unsafe {
        if let Some((ref source, is_cut)) = CLIPBOARD {
            let source_path = Path::new(source).canonicalize()
                .map_err(|e| format!("Failed to resolve source path: {}", e))?;
                
            if !source_path.exists() {
                return Err("Source path no longer exists".to_string());
            }
            
            let dest_dir = Path::new(&destination).canonicalize()
                .map_err(|e| format!("Failed to resolve destination path: {}", e))?;
                
            if !dest_dir.exists() || !dest_dir.is_dir() {
                return Err("Destination directory does not exist".to_string());
            }
            
            let file_name = source_path.file_name()
                .ok_or_else(|| "Invalid source path".to_string())?;
            let dest_path = dest_dir.join(file_name);
            
            if is_cut {
                fs::rename(&source_path, &dest_path)
                    .map_err(|e| format!("Failed to move: {}", e))?;
                CLIPBOARD = None;
            } else {
                if source_path.is_dir() {
                    copy_dir_all(&source_path, &dest_path)
                        .map_err(|e| format!("Failed to copy directory: {}", e))?;
                } else {
                    fs::copy(&source_path, &dest_path)
                        .map_err(|e| format!("Failed to copy file: {}", e))?;
                }
            }
            Ok(())
        } else {
            Err("Nothing in clipboard".to_string())
        }
    };
    
    CLIPBOARD_LOCK.store(false, Ordering::Release);
    result
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(TerminalState::default())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![
            create_terminal_session,
            kill_terminal_session,
            write_to_terminal,
            read_file_content,
            write_file_content,
            watch_path,
            get_recent_projects,
            create_project,
            open_project,
            get_project_structure,
            remove_recent_project,
            create_file,
            create_directory,
            rename_path,
            delete_path,
            copy_path,
            paste_path,
        ])
        .setup(|app| {
            let launcher = app.get_webview_window("launcher").unwrap();
            launcher.show().unwrap();

            #[cfg(debug_assertions)]
            {
                launcher.open_devtools();
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
