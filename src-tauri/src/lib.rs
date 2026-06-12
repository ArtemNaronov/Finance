use std::process::{Child, Command, Stdio};
use std::sync::Mutex;
use std::time::Duration;
use tauri::{AppHandle, Manager, RunEvent};

struct ServerProcess(Mutex<Option<Child>>);

fn wait_for_server(port: u16) {
    for _ in 0..40 {
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
    let bundle_dir = resource_dir.join("bundle-resources");
    let node = bundle_dir.join("bin").join(if cfg!(windows) { "node.exe" } else { "node" });
    let server_entry = bundle_dir.join("server").join("dist").join("index.js");
    let client_dist = bundle_dir.join("client-dist");
    let data_dir = app.path().app_data_dir()?;
    std::fs::create_dir_all(&data_dir)?;

    let db_path = data_dir.join("finance.db");

    let child = Command::new(node)
        .arg(server_entry)
        .env("SERVE_CLIENT", "true")
        .env("CLIENT_DIST", client_dist)
        .env("DB_PATH", db_path)
        .env("PORT", "3001")
        .stdout(Stdio::null())
        .stderr(Stdio::null())
        .spawn()?;

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
