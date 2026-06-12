use std::path::{Path, PathBuf};
use std::process::{Child, Command, Stdio};
use std::sync::Mutex;
use std::time::Duration;
use tauri::{AppHandle, Manager, RunEvent};

struct ServerProcess(Mutex<Option<Child>>);

fn resolve_bundle_dir(resource_dir: &Path) -> PathBuf {
    let nested = resource_dir.join("bundle-resources");
    let server_entry = |base: &Path| base.join("server").join("dist").join("index.js");

    if server_entry(&nested).exists() {
        return nested;
    }
    if server_entry(resource_dir).exists() {
        return resource_dir.to_path_buf();
    }
    nested
}

fn wait_for_server(port: u16) {
    for _ in 0..60 {
        if std::net::TcpStream::connect(format!("127.0.0.1:{port}")).is_ok() {
            return;
        }
        std::thread::sleep(Duration::from_millis(250));
    }
}

fn stop_server(app: &AppHandle) {
    if let Some(state) = app.try_state::<ServerProcess>() {
        if let Ok(mut guard) = state.0.lock() {
            if let Some(mut child) = guard.take() {
                let _ = child.kill();
            }
        }
    }
}

#[cfg(not(debug_assertions))]
fn start_server(app: &tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    let resource_dir = app.path().resource_dir()?;
    let bundle_dir = resolve_bundle_dir(&resource_dir);
    let server_dir = bundle_dir.join("server");
    let node = bundle_dir.join("bin").join(if cfg!(windows) { "node.exe" } else { "node" });
    let server_entry = server_dir.join("dist").join("index.js");
    let client_dist = server_dir.join("client-dist");
    let data_dir = app.path().app_data_dir()?;
    std::fs::create_dir_all(&data_dir)?;

    if !node.exists() {
        return Err(format!("Node не найден: {}", node.display()).into());
    }
    if !server_entry.exists() {
        return Err(format!("Сервер не найден: {}", server_entry.display()).into());
    }

    let db_path = data_dir.join("finance.db");
    let log_path = data_dir.join("finance-server.log");
    let log_file = std::fs::OpenOptions::new()
        .create(true)
        .append(true)
        .open(&log_path)?;

    let mut cmd = Command::new(&node);
    cmd.arg(&server_entry)
        .current_dir(&server_dir)
        .envs(std::env::vars())
        .env("SERVE_CLIENT", "true")
        .env("CLIENT_DIST", &client_dist)
        .env("DB_PATH", &db_path)
        .env("PORT", "3001")
        .stdout(Stdio::from(log_file.try_clone()?))
        .stderr(Stdio::from(log_file));

    let child = cmd.spawn()?;

    app.state::<ServerProcess>().0.lock().unwrap().replace(child);
    wait_for_server(3001);
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let app = tauri::Builder::default()
        .manage(ServerProcess(Mutex::new(None)))
        .setup(|app| {
            #[cfg(not(debug_assertions))]
            start_server(app)?;
            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("error while building tauri application");

    app.run(|app_handle, event| {
        if let RunEvent::Exit = event {
            stop_server(app_handle);
        }
    });
}
