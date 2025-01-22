use portable_pty::{native_pty_system, CommandBuilder, PtyPair, PtySize};
use std::{
    io::{BufRead, BufReader, Read, Write},
    sync::Arc,
};
use tauri::{async_runtime::Mutex, State};

pub struct TerminalState {
    pty_pair: Arc<Mutex<PtyPair>>,
    writer: Arc<Mutex<Box<dyn Write + Send>>>,
    reader: Arc<Mutex<BufReader<Box<dyn Read + Send>>>>,
}

impl Default for TerminalState {
    fn default() -> Self {
        let pty_system = native_pty_system();
        let pty_pair = pty_system
            .openpty(PtySize {
                rows: 24,
                cols: 80,
                pixel_width: 0,
                pixel_height: 0,
            })
            .unwrap();

        let reader = pty_pair.master.try_clone_reader().unwrap();
        let writer = pty_pair.master.take_writer().unwrap();

        Self {
            pty_pair: Arc::new(Mutex::new(pty_pair)),
            writer: Arc::new(Mutex::new(writer)),
            reader: Arc::new(Mutex::new(BufReader::new(reader))),
        }
    }
}

#[tauri::command]
pub async fn async_create_shell(state: State<'_, TerminalState>) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    let mut cmd = CommandBuilder::new("powershell.exe");

    #[cfg(not(target_os = "windows"))]
    let mut cmd = CommandBuilder::new("bash");

    // Set TERM environment variable for proper terminal behavior
    #[cfg(target_os = "windows")]
    cmd.env("TERM", "cygwin");

    #[cfg(not(target_os = "windows"))]
    cmd.env("TERM", "xterm-256color");

    let mut child = state
        .pty_pair
        .lock()
        .await
        .slave
        .spawn_command(cmd)
        .map_err(|err| err.to_string())?;

    std::thread::spawn(move || {
        let status = child.wait().unwrap();
        std::process::exit(status.exit_code() as i32);
    });

    Ok(())
}

#[tauri::command]
pub async fn async_write_to_pty(data: &str, state: State<'_, TerminalState>) -> Result<(), String> {
    write!(state.writer.lock().await, "{}", data).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn async_read_from_pty(state: State<'_, TerminalState>) -> Result<Option<String>, String> {
    let mut reader = state.reader.lock().await;
    let data = {
        // Read all available text
        let data = reader.fill_buf().map_err(|e| e.to_string())?;

        // Send the data to the webview if necessary
        if !data.is_empty() {
            std::str::from_utf8(data)
                .map(|v| Some(v.to_string()))
                .map_err(|e| e.to_string())?
        } else {
            None
        }
    };

    if let Some(data) = &data {
        reader.consume(data.len());
    }

    Ok(data)
}

#[tauri::command]
pub async fn async_resize_pty(
    rows: u16,
    cols: u16,
    state: State<'_, TerminalState>,
) -> Result<(), String> {
    state
        .pty_pair
        .lock()
        .await
        .master
        .resize(PtySize {
            rows,
            cols,
            pixel_width: 0,
            pixel_height: 0,
        })
        .map_err(|e| e.to_string())
}
