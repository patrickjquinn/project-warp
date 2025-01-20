use std::fs;
use std::path::Path;

fn copy_templates() {
    let src = Path::new("templates");
    let dst = Path::new("target/release/resources/templates");
    
    if src.exists() {
        let _ = fs::create_dir_all(dst);
        let _ = fs::remove_dir_all(dst); // Clean existing
        let _ = fs::create_dir_all(dst);
        
        for entry in fs::read_dir(src).unwrap() {
            let entry = entry.unwrap();
            let ty = entry.file_type().unwrap();
            let src_path = entry.path();
            let dst_path = dst.join(entry.file_name());
            
            if ty.is_dir() {
                let _ = fs::create_dir_all(&dst_path);
                copy_dir_recursive(&src_path, &dst_path);
            } else {
                let _ = fs::copy(&src_path, &dst_path);
            }
        }
    }
}

fn copy_dir_recursive(src: &Path, dst: &Path) {
    for entry in fs::read_dir(src).unwrap() {
        let entry = entry.unwrap();
        let ty = entry.file_type().unwrap();
        let src_path = entry.path();
        let dst_path = dst.join(entry.file_name());
        
        if ty.is_dir() {
            let _ = fs::create_dir_all(&dst_path);
            copy_dir_recursive(&src_path, &dst_path);
        } else {
            let _ = fs::copy(&src_path, &dst_path);
        }
    }
}

fn main() {
    copy_templates();
    tauri_build::build()
}
