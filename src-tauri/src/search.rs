use std::process::Command;
use serde::{Deserialize, Serialize};
use tauri::command;

#[derive(Debug, Serialize, Deserialize)]
pub struct SearchMatch {
    start: usize,
    end: usize,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SearchResult {
    path: String,
    line: usize,
    content: String,
    matches: Vec<SearchMatch>,
}

#[command]
pub async fn search_in_files(path: String, query: String) -> Result<Vec<SearchResult>, String> {
    // Use ripgrep for fast searching
    let output = Command::new("rg")
        .args([
            "--json",           // Output in JSON format
            "--line-number",    // Show line numbers
            "--no-heading",     // Don't group matches by file
            "--max-columns", "150", // Limit line length
            "--max-count", "100",   // Limit results per file
            &query,
            &path,
        ])
        .output()
        .map_err(|e| e.to_string())?;

    if !output.status.success() {
        // If no matches found (exit code 1), return empty results
        if output.status.code() == Some(1) {
            return Ok(Vec::new());
        }
        // Otherwise, there was an error
        return Err(String::from_utf8_lossy(&output.stderr).into_owned());
    }

    let output_str = String::from_utf8_lossy(&output.stdout);
    let mut results = Vec::new();

    // Parse each line of JSON output
    for line in output_str.lines() {
        if let Ok(value) = serde_json::from_str::<serde_json::Value>(line) {
            if let Some(obj) = value.as_object() {
                if obj["type"] == "match" {
                    let data = &obj["data"];
                    let path = data["path"]["text"].as_str().unwrap_or("").to_string();
                    let line_num = data["line_number"].as_u64().unwrap_or(0) as usize;
                    let content = data["lines"]["text"].as_str().unwrap_or("").to_string();

                    // Extract match positions
                    let mut matches = Vec::new();
                    if let Some(submatches) = data["submatches"].as_array() {
                        for submatch in submatches {
                            if let (Some(start), Some(end)) = (
                                submatch["start"].as_u64(),
                                submatch["end"].as_u64()
                            ) {
                                matches.push(SearchMatch {
                                    start: start as usize,
                                    end: end as usize,
                                });
                            }
                        }
                    }

                    results.push(SearchResult {
                        path,
                        line: line_num,
                        content,
                        matches,
                    });
                }
            }
        }
    }

    Ok(results)
}
