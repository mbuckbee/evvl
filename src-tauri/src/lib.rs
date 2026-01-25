use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use std::collections::HashMap;
use std::io::{self, Read};
use std::path::Path;
use std::process::Command;
use tauri::{
    menu::{Menu, MenuItem, PredefinedMenuItem, Submenu},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Emitter, Manager, Runtime,
};
use tauri_plugin_cli::CliExt;
use tauri_plugin_global_shortcut::GlobalShortcutExt;

// ============================================================================
// Data Types (matching TypeScript types)
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Project {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    #[serde(rename = "createdAt")]
    pub created_at: i64,
    #[serde(rename = "updatedAt")]
    pub updated_at: i64,
    #[serde(rename = "promptIds")]
    pub prompt_ids: Vec<String>,
    #[serde(rename = "modelConfigIds")]
    pub model_config_ids: Vec<String>,
    #[serde(rename = "dataSetIds")]
    pub data_set_ids: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PromptVersion {
    pub id: String,
    #[serde(rename = "versionNumber")]
    pub version_number: i32,
    pub content: String,
    #[serde(rename = "systemPrompt")]
    pub system_prompt: Option<String>,
    pub parameters: Option<Value>,
    pub note: Option<String>,
    #[serde(rename = "createdAt")]
    pub created_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Prompt {
    pub id: String,
    #[serde(rename = "projectId")]
    pub project_id: String,
    pub name: String,
    pub description: Option<String>,
    pub versions: Vec<PromptVersion>,
    #[serde(rename = "currentVersionId")]
    pub current_version_id: String,
    #[serde(rename = "createdAt")]
    pub created_at: i64,
    #[serde(rename = "updatedAt")]
    pub updated_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProjectModelConfig {
    pub id: String,
    #[serde(rename = "projectId")]
    pub project_id: String,
    pub name: String,
    pub provider: String,
    pub model: String,
    pub parameters: Option<Value>,
    #[serde(rename = "createdAt")]
    pub created_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DataSetItem {
    pub id: String,
    pub name: Option<String>,
    pub variables: HashMap<String, String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DataSet {
    pub id: String,
    #[serde(rename = "projectId")]
    pub project_id: String,
    pub name: String,
    pub items: Vec<DataSetItem>,
    #[serde(rename = "createdAt")]
    pub created_at: i64,
    #[serde(rename = "updatedAt")]
    pub updated_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EvaluationRun {
    pub id: String,
    #[serde(rename = "projectId")]
    pub project_id: String,
    #[serde(rename = "promptId")]
    pub prompt_id: String,
    #[serde(rename = "promptVersionId")]
    pub prompt_version_id: String,
    #[serde(rename = "modelConfigIds")]
    pub model_config_ids: Vec<String>,
    #[serde(rename = "dataSetId")]
    pub data_set_id: Option<String>,
    pub results: Vec<Value>,
    pub status: String,
    #[serde(rename = "createdAt")]
    pub created_at: i64,
    #[serde(rename = "completedAt")]
    pub completed_at: Option<i64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ApiKeys {
    pub openai: Option<String>,
    pub anthropic: Option<String>,
    pub openrouter: Option<String>,
    pub gemini: Option<String>,
}

// ============================================================================
// CLI Output Types
// ============================================================================

#[derive(Debug, Serialize)]
struct CliProjectOutput {
    id: String,
    name: String,
    description: Option<String>,
    prompts: i32,
    models: i32,
    datasets: i32,
}

#[derive(Debug, Serialize)]
struct CliPromptOutput {
    id: String,
    name: String,
    project: String,
    versions: i32,
    current_version: i32,
}

#[derive(Debug, Serialize)]
struct CliRunOutput {
    id: String,
    timestamp: i64,
    prompt: String,
    results: Vec<CliRunResult>,
    status: String,
}

#[derive(Debug, Serialize)]
struct CliRunResult {
    model: String,
    provider: String,
    content: Option<String>,
    tokens: Option<i32>,
    latency: Option<i64>,
    error: Option<String>,
}

// ============================================================================
// Store Utilities
// ============================================================================

fn get_store_path() -> std::path::PathBuf {
    let mut path = dirs::home_dir().unwrap_or_else(|| std::path::PathBuf::from("."));
    path.push(".evvl");
    path.push("store.json");
    path
}

fn load_from_store<T: for<'de> Deserialize<'de>>(key: &str) -> Option<T> {
    let store_path = get_store_path();
    if !store_path.exists() {
        return None;
    }

    let contents = std::fs::read_to_string(&store_path).ok()?;
    let store: HashMap<String, Value> = serde_json::from_str(&contents).ok()?;
    let value = store.get(key)?;
    serde_json::from_value(value.clone()).ok()
}

fn save_to_store<T: Serialize>(key: &str, value: &T) -> Result<(), String> {
    let store_path = get_store_path();

    // Ensure directory exists
    if let Some(parent) = store_path.parent() {
        std::fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }

    // Load existing store or create new
    let mut store: HashMap<String, Value> = if store_path.exists() {
        let contents = std::fs::read_to_string(&store_path).map_err(|e| e.to_string())?;
        serde_json::from_str(&contents).unwrap_or_default()
    } else {
        HashMap::new()
    };

    // Update value
    let json_value = serde_json::to_value(value).map_err(|e| e.to_string())?;
    store.insert(key.to_string(), json_value);

    // Write back
    let contents = serde_json::to_string_pretty(&store).map_err(|e| e.to_string())?;
    std::fs::write(&store_path, contents).map_err(|e| e.to_string())?;

    Ok(())
}

// ============================================================================
// Git Detection
// ============================================================================

/// Detect if current directory is in a git repo and return the repo name
fn detect_git_repo() -> Option<String> {
    // Try to get the git root directory
    let output = Command::new("git")
        .args(["rev-parse", "--show-toplevel"])
        .output()
        .ok()?;

    if !output.status.success() {
        return None;
    }

    let root_path = String::from_utf8(output.stdout).ok()?;
    let root_path = root_path.trim();

    // Extract directory name from path
    Path::new(root_path)
        .file_name()
        .and_then(|n| n.to_str())
        .map(|s| s.to_string())
}

/// Get or create a project for the current git repo
fn get_or_create_repo_project(repo_name: &str, json_output: bool) -> Option<Project> {
    let mut projects: Vec<Project> = load_from_store("evvl_projects_v2").unwrap_or_default();

    // Check if project already exists
    if let Some(existing) = projects.iter().find(|p| p.name.to_lowercase() == repo_name.to_lowercase()) {
        return Some(existing.clone());
    }

    // Create new project
    let now = chrono::Utc::now().timestamp_millis();
    let project = Project {
        id: uuid::Uuid::new_v4().to_string(),
        name: repo_name.to_string(),
        description: Some(format!("Auto-created from git repo: {}", repo_name)),
        created_at: now,
        updated_at: now,
        prompt_ids: vec![],
        model_config_ids: vec![],
        data_set_ids: vec![],
    };

    projects.push(project.clone());
    if let Err(e) = save_to_store("evvl_projects_v2", &projects) {
        eprintln!("Warning: Failed to save project: {}", e);
        return None;
    }

    if !json_output {
        println!("Created project '{}' from git repo", repo_name);
    }

    Some(project)
}

/// Get or create a default prompt for a project (named after the project)
fn get_or_create_default_prompt(project: &mut Project, json_output: bool) -> Option<Prompt> {
    let mut prompts: Vec<Prompt> = load_from_store("evvl_prompts_v2").unwrap_or_default();

    // Check if project has any prompts
    if let Some(existing) = prompts.iter().find(|p| p.project_id == project.id) {
        return Some(existing.clone());
    }

    // Create default prompt (named same as project/repo)
    let now = chrono::Utc::now().timestamp_millis();
    let version_id = uuid::Uuid::new_v4().to_string();
    let prompt_id = uuid::Uuid::new_v4().to_string();

    let prompt = Prompt {
        id: prompt_id.clone(),
        project_id: project.id.clone(),
        name: project.name.clone(),
        description: Some(format!("Prompt for {} CLI evaluations", project.name)),
        versions: vec![PromptVersion {
            id: version_id.clone(),
            version_number: 1,
            content: String::new(), // Will be filled in by the run command
            system_prompt: None,
            parameters: None,
            note: Some("Initial version".to_string()),
            created_at: now,
        }],
        current_version_id: version_id,
        created_at: now,
        updated_at: now,
    };

    // Update project to reference this prompt
    project.prompt_ids.push(prompt_id.clone());

    // Save both
    prompts.push(prompt.clone());
    if let Err(e) = save_to_store("evvl_prompts_v2", &prompts) {
        eprintln!("Warning: Failed to save prompt: {}", e);
        return None;
    }

    // Update project in store
    let mut projects: Vec<Project> = load_from_store("evvl_projects_v2").unwrap_or_default();
    if let Some(p) = projects.iter_mut().find(|p| p.id == project.id) {
        p.prompt_ids = project.prompt_ids.clone();
        p.updated_at = now;
    }
    let _ = save_to_store("evvl_projects_v2", &projects);

    if !json_output {
        println!("Created prompt '{}' for project", project.name);
    }

    Some(prompt)
}

// ============================================================================
// CLI Command Handlers
// ============================================================================

fn handle_projects_command(json_output: bool) -> i32 {
    let projects: Vec<Project> = load_from_store("evvl_projects_v2").unwrap_or_default();

    if json_output {
        let output: Vec<CliProjectOutput> = projects
            .iter()
            .map(|p| CliProjectOutput {
                id: p.id.clone(),
                name: p.name.clone(),
                description: p.description.clone(),
                prompts: p.prompt_ids.len() as i32,
                models: p.model_config_ids.len() as i32,
                datasets: p.data_set_ids.len() as i32,
            })
            .collect();
        println!("{}", serde_json::to_string_pretty(&output).unwrap());
    } else {
        if projects.is_empty() {
            println!("No projects found.");
            println!("Create a project in the Evvl GUI first, or run 'evvl --open' to launch it.");
        } else {
            println!("Projects ({}):", projects.len());
            println!("{:<36}  {:<30}  Prompts  Models  Datasets", "ID", "Name");
            println!("{}", "-".repeat(100));
            for project in &projects {
                println!(
                    "{:<36}  {:<30}  {:>7}  {:>6}  {:>8}",
                    project.id,
                    truncate_string(&project.name, 30),
                    project.prompt_ids.len(),
                    project.model_config_ids.len(),
                    project.data_set_ids.len()
                );
            }
        }
    }
    0
}

fn handle_prompts_list_command(project_filter: Option<&str>, json_output: bool) -> i32 {
    let prompts: Vec<Prompt> = load_from_store("evvl_prompts_v2").unwrap_or_default();
    let projects: Vec<Project> = load_from_store("evvl_projects_v2").unwrap_or_default();

    // Filter by project if specified
    let filtered_prompts: Vec<&Prompt> = if let Some(filter) = project_filter {
        // Find project by name or ID
        let project = projects.iter().find(|p| {
            p.id == filter || p.name.to_lowercase() == filter.to_lowercase()
        });

        match project {
            Some(p) => prompts.iter().filter(|prompt| prompt.project_id == p.id).collect(),
            None => {
                eprintln!("Error: Project '{}' not found", filter);
                return 1;
            }
        }
    } else {
        prompts.iter().collect()
    };

    if json_output {
        let output: Vec<CliPromptOutput> = filtered_prompts
            .iter()
            .map(|p| {
                let project_name = projects
                    .iter()
                    .find(|proj| proj.id == p.project_id)
                    .map(|proj| proj.name.clone())
                    .unwrap_or_else(|| "Unknown".to_string());
                let current_version = p.versions
                    .iter()
                    .find(|v| v.id == p.current_version_id)
                    .map(|v| v.version_number)
                    .unwrap_or(0);
                CliPromptOutput {
                    id: p.id.clone(),
                    name: p.name.clone(),
                    project: project_name,
                    versions: p.versions.len() as i32,
                    current_version,
                }
            })
            .collect();
        println!("{}", serde_json::to_string_pretty(&output).unwrap());
    } else {
        if filtered_prompts.is_empty() {
            println!("No prompts found.");
        } else {
            println!("Prompts ({}):", filtered_prompts.len());
            println!("{:<36}  {:<25}  {:<20}  Versions", "ID", "Name", "Project");
            println!("{}", "-".repeat(95));
            for prompt in &filtered_prompts {
                let project_name = projects
                    .iter()
                    .find(|proj| proj.id == prompt.project_id)
                    .map(|proj| proj.name.clone())
                    .unwrap_or_else(|| "Unknown".to_string());
                println!(
                    "{:<36}  {:<25}  {:<20}  {:>8}",
                    prompt.id,
                    truncate_string(&prompt.name, 25),
                    truncate_string(&project_name, 20),
                    prompt.versions.len()
                );
            }
        }
    }
    0
}

fn handle_export_command(run_id: Option<&str>, format: Option<&str>, _json_output: bool) -> i32 {
    let runs: Vec<EvaluationRun> = load_from_store("evvl_evaluation_runs").unwrap_or_default();
    let model_configs: Vec<ProjectModelConfig> = load_from_store("evvl_model_configs_v2").unwrap_or_default();
    let prompts: Vec<Prompt> = load_from_store("evvl_prompts_v2").unwrap_or_default();

    // If no run ID specified, list recent runs
    let run = if let Some(id) = run_id {
        runs.iter().find(|r| r.id == id)
    } else {
        // Get most recent completed run
        runs.iter()
            .filter(|r| r.status == "completed")
            .max_by_key(|r| r.created_at)
    };

    match run {
        Some(r) => {
            let prompt = prompts.iter().find(|p| p.id == r.prompt_id);
            let prompt_content = prompt
                .and_then(|p| p.versions.iter().find(|v| v.id == r.prompt_version_id))
                .map(|v| v.content.clone())
                .unwrap_or_else(|| "Unknown".to_string());

            let export_format = format.unwrap_or("json");

            match export_format {
                "csv" => {
                    println!("model,provider,content,tokens,latency,error");
                    for result in &r.results {
                        let model_id = result.get("modelConfigId").and_then(|v| v.as_str()).unwrap_or("");
                        let config = model_configs.iter().find(|c| c.id == model_id);
                        let output = result.get("output").unwrap_or(&Value::Null);

                        let model_name = config.map(|c| c.model.as_str()).unwrap_or("unknown");
                        let provider = config.map(|c| c.provider.as_str()).unwrap_or("unknown");
                        let content = output.get("content").and_then(|v| v.as_str()).unwrap_or("");
                        let tokens = output.get("tokens").and_then(|v| v.as_i64()).unwrap_or(0);
                        let latency = output.get("latency").and_then(|v| v.as_i64()).unwrap_or(0);
                        let error = output.get("error").and_then(|v| v.as_str()).unwrap_or("");

                        // CSV escape content
                        let escaped_content = content.replace("\"", "\"\"");
                        println!(
                            "\"{}\",\"{}\",\"{}\",{},{},\"{}\"",
                            model_name, provider, escaped_content, tokens, latency, error
                        );
                    }
                }
                _ => {
                    // JSON output
                    let results: Vec<CliRunResult> = r.results.iter().map(|result| {
                        let model_id = result.get("modelConfigId").and_then(|v| v.as_str()).unwrap_or("");
                        let config = model_configs.iter().find(|c| c.id == model_id);
                        let output = result.get("output").unwrap_or(&Value::Null);

                        CliRunResult {
                            model: config.map(|c| c.model.clone()).unwrap_or_else(|| "unknown".to_string()),
                            provider: config.map(|c| c.provider.clone()).unwrap_or_else(|| "unknown".to_string()),
                            content: output.get("content").and_then(|v| v.as_str()).map(|s| s.to_string()),
                            tokens: output.get("tokens").and_then(|v| v.as_i64()).map(|n| n as i32),
                            latency: output.get("latency").and_then(|v| v.as_i64()),
                            error: output.get("error").and_then(|v| v.as_str()).map(|s| s.to_string()),
                        }
                    }).collect();

                    let output = CliRunOutput {
                        id: r.id.clone(),
                        timestamp: r.created_at,
                        prompt: prompt_content,
                        results,
                        status: r.status.clone(),
                    };
                    println!("{}", serde_json::to_string_pretty(&output).unwrap());
                }
            }
            0
        }
        None => {
            if run_id.is_some() {
                eprintln!("Error: Run ID not found");
            } else {
                eprintln!("Error: No evaluation runs found");
            }
            1
        }
    }
}

fn handle_run_command(
    prompt_text: Option<&str>,
    prompt_name: Option<&str>,
    version_note: Option<&str>,
    models: Option<&str>,
    dataset_name: Option<&str>,
    no_dataset: bool,
    project_filter: Option<&str>,
    json_output: bool,
    open_gui: bool,
) -> i32 {
    let projects: Vec<Project> = load_from_store("evvl_projects_v2").unwrap_or_default();
    let model_configs: Vec<ProjectModelConfig> = load_from_store("evvl_model_configs_v2").unwrap_or_default();
    let data_sets: Vec<DataSet> = load_from_store("evvl_data_sets_v2").unwrap_or_default();

    // Find or create project
    let mut project: Option<Project> = if let Some(proj_filter) = project_filter {
        // Explicit project specified
        let found = projects.iter().find(|p| {
            p.id == proj_filter || p.name.to_lowercase() == proj_filter.to_lowercase()
        });
        if found.is_none() {
            eprintln!("Error: Project '{}' not found", proj_filter);
            return 1;
        }
        found.cloned()
    } else if let Some(repo_name) = detect_git_repo() {
        // Auto-detect from git repo
        get_or_create_repo_project(&repo_name, json_output)
    } else {
        None
    };

    // If we have a project but no prompt-name, use/create default prompt (named after project)
    let effective_prompt_name: Option<String> = if prompt_name.is_some() {
        prompt_name.map(|s| s.to_string())
    } else if let Some(ref proj) = project {
        // Use prompt named after the project/repo
        Some(proj.name.clone())
    } else {
        None
    };

    // Load prompts (may have been created by get_or_create_repo_project)
    let mut prompts: Vec<Prompt> = load_from_store("evvl_prompts_v2").unwrap_or_default();

    // Get prompt content - either from --prompt, stdin, or existing prompt
    let final_prompt: String;
    let mut prompt_id: Option<String> = None;
    let mut prompt_version_id: Option<String> = None;
    let mut saved_new_version = false;

    // First, get the raw prompt text from --prompt or stdin
    let raw_prompt_text = if let Some(text) = prompt_text {
        Some(text.to_string())
    } else if atty::isnt(atty::Stream::Stdin) {
        let mut stdin = String::new();
        io::stdin().read_to_string(&mut stdin).ok();
        if !stdin.trim().is_empty() {
            Some(stdin.trim().to_string())
        } else {
            None
        }
    } else {
        None
    };

    // If we have a prompt name (explicit or default), find or create the prompt
    if let Some(name) = effective_prompt_name.as_deref() {
        // First, check if prompt exists
        let prompt_exists = if let Some(ref proj) = project {
            prompts.iter().any(|p| {
                p.project_id == proj.id &&
                p.name.to_lowercase() == name.to_lowercase()
            })
        } else {
            prompts.iter().any(|p| p.name.to_lowercase() == name.to_lowercase())
        };

        // If prompt doesn't exist and we have a project, create it
        if !prompt_exists {
            if let Some(ref mut proj) = project {
                if get_or_create_default_prompt(proj, json_output).is_some() {
                    prompts = load_from_store("evvl_prompts_v2").unwrap_or_default();
                }
            }
        }

        // Now find the prompt
        let prompt = if let Some(ref proj) = project {
            prompts.iter_mut().find(|p| {
                p.project_id == proj.id &&
                p.name.to_lowercase() == name.to_lowercase()
            })
        } else {
            prompts.iter_mut().find(|p| p.name.to_lowercase() == name.to_lowercase())
        };

        match prompt {
            Some(p) => {
                prompt_id = Some(p.id.clone());

                // Get the current version
                let current_version = p.versions.iter().find(|v| v.id == p.current_version_id);

                match current_version {
                    Some(cv) => {
                        // If we have new prompt text, check if it differs from current
                        if let Some(ref new_content) = raw_prompt_text {
                            if new_content != &cv.content {
                                // Content differs - auto-save as new version
                                let new_version_number = p.versions.iter()
                                    .map(|v| v.version_number)
                                    .max()
                                    .unwrap_or(0) + 1;

                                let new_version_id = uuid::Uuid::new_v4().to_string();
                                let new_version = PromptVersion {
                                    id: new_version_id.clone(),
                                    version_number: new_version_number,
                                    content: new_content.clone(),
                                    system_prompt: None,
                                    parameters: None,
                                    note: version_note.map(|s| s.to_string()),
                                    created_at: chrono::Utc::now().timestamp_millis(),
                                };

                                p.versions.push(new_version);
                                p.current_version_id = new_version_id.clone();
                                p.updated_at = chrono::Utc::now().timestamp_millis();

                                // Save updated prompts
                                if let Err(e) = save_to_store("evvl_prompts_v2", &prompts) {
                                    eprintln!("Warning: Failed to save new version: {}", e);
                                } else if !json_output {
                                    println!("Saved as version {} of prompt '{}'", new_version_number, name);
                                }

                                final_prompt = new_content.clone();
                                prompt_version_id = Some(new_version_id);
                                saved_new_version = true;
                            } else {
                                // Content same as current - use existing version
                                final_prompt = cv.content.clone();
                                prompt_version_id = Some(cv.id.clone());
                            }
                        } else {
                            // No new content provided - use existing version
                            final_prompt = cv.content.clone();
                            prompt_version_id = Some(cv.id.clone());
                        }
                    }
                    None => {
                        eprintln!("Error: No current version found for prompt '{}'", name);
                        return 1;
                    }
                }
            }
            None => {
                eprintln!("Error: Prompt '{}' not found", name);
                return 1;
            }
        }
    } else if let Some(text) = raw_prompt_text {
        final_prompt = text;
    } else {
        eprintln!("Error: No prompt provided. Use --prompt, --prompt-name, or pipe text to stdin.");
        return 1;
    }

    // Determine models to use
    let model_list: Vec<String> = if let Some(m) = models {
        m.split(',').map(|s| s.trim().to_string()).collect()
    } else if let Some(ref proj) = project {
        // Use project's model configs
        let project_models: Vec<String> = model_configs.iter()
            .filter(|c| c.project_id == proj.id)
            .map(|c| format!("{}/{}", c.provider, c.model))
            .collect();

        if project_models.is_empty() {
            if !json_output {
                eprintln!("Warning: No model configs in project, using defaults");
            }
            vec!["anthropic/claude-3-5-sonnet".to_string(), "openai/gpt-4".to_string()]
        } else {
            project_models
        }
    } else {
        vec!["anthropic/claude-3-5-sonnet".to_string(), "openai/gpt-4".to_string()]
    };

    // Determine dataset to use
    let final_dataset = if no_dataset {
        None
    } else if let Some(ds_name) = dataset_name {
        // Find dataset by name
        let ds = if let Some(ref proj) = project {
            data_sets.iter().find(|d| {
                d.project_id == proj.id &&
                d.name.to_lowercase() == ds_name.to_lowercase()
            })
        } else {
            data_sets.iter().find(|d| d.name.to_lowercase() == ds_name.to_lowercase())
        };
        ds.map(|d| d.name.clone())
    } else if let Some(ref proj) = project {
        // Use project's first dataset by default
        data_sets.iter()
            .find(|d| d.project_id == proj.id)
            .map(|d| d.name.clone())
    } else {
        None
    };

    // Build run config
    let run_config = json!({
        "source": "cli",
        "prompt": final_prompt,
        "models": model_list,
        "dataset": final_dataset,
        "promptId": prompt_id,
        "promptVersionId": prompt_version_id,
        "projectId": project.as_ref().map(|p| p.id.clone()),
        "projectName": project.as_ref().map(|p| p.name.clone()),
        "openGui": open_gui,
        "status": "pending",
        "savedVersion": saved_new_version
    });

    if json_output {
        println!("{}", serde_json::to_string_pretty(&run_config).unwrap());
    } else {
        println!("Run Configuration:");
        println!("  Prompt: {}", truncate_string(&final_prompt, 60));
        println!("  Models: {}", model_list.join(", "));
        if let Some(ref ds) = final_dataset {
            println!("  Dataset: {}", ds);
        }
        if let Some(ref proj) = project {
            println!("  Project: {}", proj.name);
        }
        if saved_new_version {
            println!("  New version saved: yes");
        }
        println!("\nUse --open to execute in GUI.");
    }

    // If --open flag is set, save config for GUI to pick up
    if open_gui {
        let pending_runs: Vec<Value> = load_from_store("evvl_pending_cli_runs").unwrap_or_default();
        let mut runs = pending_runs;
        runs.push(run_config);
        let _ = save_to_store("evvl_pending_cli_runs", &runs);
    }

    0
}

fn truncate_string(s: &str, max_len: usize) -> String {
    if s.len() <= max_len {
        s.to_string()
    } else {
        format!("{}...", &s[..max_len - 3])
    }
}

fn print_help() {
    let version = env!("CARGO_PKG_VERSION");
    println!("evvl {} - AI Model Evaluation CLI", version);
    println!();
    println!("USAGE:");
    println!("    evvl [OPTIONS] [PROMPT]");
    println!("    evvl <COMMAND> [OPTIONS]");
    println!();
    println!("ARGS:");
    println!("    [PROMPT]    Prompt text to evaluate (auto-detects git repo as project)");
    println!();
    println!("OPTIONS:");
    println!("    -h, --help       Print help information");
    println!("    -v, --version    Print version information");
    println!("    --settings       Open settings page");
    println!("    -o, --open       Open GUI to show results");
    println!("    --json           Output as JSON (default when piped)");
    println!("    -p, --project    Project name or ID");
    println!();
    println!("COMMANDS:");
    println!("    run        Run an evaluation with options");
    println!("    projects   List all projects");
    println!("    prompts    List or test prompts");
    println!("    export     Export evaluation results");
    println!();
    println!("EXAMPLES:");
    println!("    evvl \"Explain quantum computing\"");
    println!("    evvl \"Review this code\" --open");
    println!("    evvl run --prompt \"Hello\" --models gpt-4,claude-3-5-sonnet");
    println!("    evvl projects");
    println!("    evvl export --format json");
    println!();
    println!("ENVIRONMENT VARIABLES:");
    println!("    OPENAI_API_KEY       OpenAI API key");
    println!("    ANTHROPIC_API_KEY    Anthropic API key");
    println!("    OPENROUTER_API_KEY   OpenRouter API key");
    println!("    GOOGLE_API_KEY       Google/Gemini API key");
}

// ============================================================================
// Menu Building (unchanged)
// ============================================================================

/// Build the native menu bar
fn build_menu<R: Runtime>(app: &tauri::AppHandle<R>) -> tauri::Result<Menu<R>> {
    // File menu
    let new_item = MenuItem::with_id(app, "new", "New Evaluation", true, Some("CmdOrCtrl+N"))?;
    let export_json = MenuItem::with_id(app, "export-json", "Export to JSON...", true, Some("CmdOrCtrl+E"))?;
    let export_csv = MenuItem::with_id(app, "export-csv", "Export to CSV...", true, None::<&str>)?;
    let quit = MenuItem::with_id(app, "quit", "Quit", true, Some("CmdOrCtrl+Q"))?;
    let file_menu = Submenu::with_items(
        app,
        "File",
        true,
        &[&new_item, &export_json, &export_csv, &PredefinedMenuItem::separator(app)?, &quit],
    )?;

    // Edit menu
    let edit_menu = Submenu::with_items(
        app,
        "Edit",
        true,
        &[
            &PredefinedMenuItem::undo(app, None)?,
            &PredefinedMenuItem::redo(app, None)?,
            &PredefinedMenuItem::separator(app)?,
            &PredefinedMenuItem::cut(app, None)?,
            &PredefinedMenuItem::copy(app, None)?,
            &PredefinedMenuItem::paste(app, None)?,
            &PredefinedMenuItem::select_all(app, None)?,
        ],
    )?;

    // View menu
    let settings = MenuItem::with_id(app, "settings", "Settings", true, Some("CmdOrCtrl+,"))?;
    let reload = MenuItem::with_id(app, "reload", "Reload", true, Some("CmdOrCtrl+R"))?;
    let view_menu = Submenu::with_items(
        app,
        "View",
        true,
        &[&settings, &reload],
    )?;

    // Help menu
    let docs = MenuItem::with_id(app, "docs", "Documentation", true, None::<&str>)?;
    let about = MenuItem::with_id(app, "about", "About Evvl", true, None::<&str>)?;
    let help_menu = Submenu::with_items(app, "Help", true, &[&docs, &about])?;

    // Build the complete menu
    Menu::with_items(app, &[&file_menu, &edit_menu, &view_menu, &help_menu])
}

/// Build the system tray menu
fn build_tray_menu<R: Runtime>(app: &tauri::AppHandle<R>) -> tauri::Result<Menu<R>> {
    let show = MenuItem::with_id(app, "show", "Show Evvl", true, None::<&str>)?;
    let new_eval = MenuItem::with_id(app, "tray-new", "New Evaluation", true, None::<&str>)?;
    let quit = MenuItem::with_id(app, "tray-quit", "Quit", true, None::<&str>)?;

    Menu::with_items(app, &[&show, &new_eval, &PredefinedMenuItem::separator(app)?, &quit])
}

/// Handle menu events
fn handle_menu_event(app: &tauri::AppHandle, event: tauri::menu::MenuEvent) {
    match event.id().as_ref() {
        "new" | "tray-new" => {
            // Emit event to frontend to create new evaluation
            let _ = app.emit("menu-new-evaluation", ());
        }
        "export-json" => {
            let _ = app.emit("menu-export-json", ());
        }
        "export-csv" => {
            let _ = app.emit("menu-export-csv", ());
        }
        "settings" => {
            // Navigate to settings page
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.eval("window.location.href = '/settings'");
            }
        }
        "reload" => {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.eval("window.location.reload()");
            }
        }
        "docs" => {
            let _ = open::that("https://github.com/yourusername/evvl#readme");
        }
        "about" => {
            let _ = app.emit("menu-about", ());
        }
        "show" => {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.show();
                let _ = window.set_focus();
            }
        }
        "quit" | "tray-quit" => {
            app.exit(0);
        }
        _ => {}
    }
}

/// Setup system tray
fn setup_tray(app: &tauri::AppHandle) -> tauri::Result<()> {
    let tray_menu = build_tray_menu(app)?;

    let _tray = TrayIconBuilder::new()
        .icon(app.default_window_icon().unwrap().clone())
        .menu(&tray_menu)
        .on_menu_event(move |app, event| handle_menu_event(app, event))
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } = event
            {
                let app = tray.app_handle();
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.show();
                    let _ = window.set_focus();
                }
            }
        })
        .build(app)?;

    Ok(())
}

// ============================================================================
// Tauri Commands (callable from frontend)
// ============================================================================

#[tauri::command]
fn get_store_data(key: String) -> Option<Value> {
    load_from_store(&key)
}

#[tauri::command]
fn set_store_data(key: String, value: Value) -> Result<(), String> {
    save_to_store(&key, &value)
}

#[tauri::command]
fn get_pending_cli_runs() -> Vec<Value> {
    let runs: Vec<Value> = load_from_store("evvl_pending_cli_runs").unwrap_or_default();
    // Clear the pending runs after reading
    let _ = save_to_store("evvl_pending_cli_runs", &Vec::<Value>::new());
    runs
}

/// Get API keys from environment variables
/// Returns keys for providers that have standard env vars set
#[tauri::command]
fn get_env_api_keys() -> ApiKeys {
    ApiKeys {
        openai: std::env::var("OPENAI_API_KEY").ok(),
        anthropic: std::env::var("ANTHROPIC_API_KEY").ok(),
        openrouter: std::env::var("OPENROUTER_API_KEY").ok(),
        gemini: std::env::var("GOOGLE_API_KEY")
            .or_else(|_| std::env::var("GEMINI_API_KEY"))
            .ok(),
    }
}

#[derive(Debug, Serialize)]
struct CliInstallResult {
    success: bool,
    message: String,
    path: Option<String>,
}

#[derive(Debug, Serialize)]
struct CliStatus {
    installed: bool,
    path: Option<String>,
    current_exe: String,
}

/// Check if CLI is installed and accessible
#[tauri::command]
fn check_cli_installed() -> CliStatus {
    let exe_path = std::env::current_exe()
        .map(|p| p.to_string_lossy().to_string())
        .unwrap_or_default();

    #[cfg(target_os = "macos")]
    {
        let target = Path::new("/usr/local/bin/evvl");
        if target.exists() {
            // Check if it's a symlink pointing to our exe
            if let Ok(link_target) = std::fs::read_link(target) {
                let current_exe = std::env::current_exe().ok();
                if current_exe.as_ref() == Some(&link_target) {
                    return CliStatus {
                        installed: true,
                        path: Some("/usr/local/bin/evvl".to_string()),
                        current_exe: exe_path,
                    };
                }
            }
        }
        CliStatus {
            installed: false,
            path: None,
            current_exe: exe_path,
        }
    }

    #[cfg(target_os = "linux")]
    {
        let home = dirs::home_dir().unwrap_or_else(|| std::path::PathBuf::from("."));
        let target = home.join(".local").join("bin").join("evvl");
        if target.exists() {
            if let Ok(link_target) = std::fs::read_link(&target) {
                let current_exe = std::env::current_exe().ok();
                if current_exe.as_ref() == Some(&link_target) {
                    return CliStatus {
                        installed: true,
                        path: Some(target.to_string_lossy().to_string()),
                        current_exe: exe_path,
                    };
                }
            }
        }
        CliStatus {
            installed: false,
            path: None,
            current_exe: exe_path,
        }
    }

    #[cfg(target_os = "windows")]
    {
        let exe_dir = std::env::current_exe()
            .ok()
            .and_then(|p| p.parent().map(|p| p.to_path_buf()));

        if let Some(dir) = exe_dir {
            let dir_str = dir.to_string_lossy().to_string();
            let current_path = std::env::var("PATH").unwrap_or_default();

            if current_path.split(';').any(|p| p.eq_ignore_ascii_case(&dir_str)) {
                return CliStatus {
                    installed: true,
                    path: Some(dir_str),
                    current_exe: exe_path,
                };
            }
        }
        CliStatus {
            installed: false,
            path: None,
            current_exe: exe_path,
        }
    }
}

/// Install CLI to system PATH
/// - macOS: Creates symlink at /usr/local/bin/evvl
/// - Linux: Creates symlink at ~/.local/bin/evvl
/// - Windows: Adds app directory to user PATH
#[tauri::command]
fn install_cli() -> CliInstallResult {
    let exe_path = match std::env::current_exe() {
        Ok(path) => path,
        Err(e) => {
            return CliInstallResult {
                success: false,
                message: format!("Could not find executable path: {}", e),
                path: None,
            };
        }
    };

    #[cfg(target_os = "macos")]
    {
        let target = "/usr/local/bin/evvl";

        // Check if /usr/local/bin exists, create if not
        let usr_local_bin = Path::new("/usr/local/bin");
        if !usr_local_bin.exists() {
            // Try to create it (will likely fail without sudo)
            if let Err(_) = std::fs::create_dir_all(usr_local_bin) {
                return CliInstallResult {
                    success: false,
                    message: "Please run: sudo mkdir -p /usr/local/bin".to_string(),
                    path: None,
                };
            }
        }

        // Remove existing symlink if present
        let _ = std::fs::remove_file(target);

        // Create symlink
        match std::os::unix::fs::symlink(&exe_path, target) {
            Ok(_) => CliInstallResult {
                success: true,
                message: format!("CLI installed! You can now use 'evvl' from terminal."),
                path: Some(target.to_string()),
            },
            Err(e) => {
                if e.kind() == std::io::ErrorKind::PermissionDenied {
                    CliInstallResult {
                        success: false,
                        message: format!(
                            "Permission denied. Run in terminal:\nsudo ln -sf \"{}\" {}",
                            exe_path.display(),
                            target
                        ),
                        path: None,
                    }
                } else {
                    CliInstallResult {
                        success: false,
                        message: format!("Failed to create symlink: {}", e),
                        path: None,
                    }
                }
            }
        }
    }

    #[cfg(target_os = "linux")]
    {
        // Use ~/.local/bin which doesn't require sudo
        let home = dirs::home_dir().unwrap_or_else(|| std::path::PathBuf::from("."));
        let local_bin = home.join(".local").join("bin");

        // Create ~/.local/bin if it doesn't exist
        if let Err(e) = std::fs::create_dir_all(&local_bin) {
            return CliInstallResult {
                success: false,
                message: format!("Failed to create ~/.local/bin: {}", e),
                path: None,
            };
        }

        let target = local_bin.join("evvl");

        // Remove existing symlink if present
        let _ = std::fs::remove_file(&target);

        // Create symlink
        match std::os::unix::fs::symlink(&exe_path, &target) {
            Ok(_) => {
                let path_str = target.to_string_lossy().to_string();
                CliInstallResult {
                    success: true,
                    message: format!(
                        "CLI installed to ~/.local/bin/evvl\nMake sure ~/.local/bin is in your PATH."
                    ),
                    path: Some(path_str),
                }
            }
            Err(e) => CliInstallResult {
                success: false,
                message: format!("Failed to create symlink: {}", e),
                path: None,
            },
        }
    }

    #[cfg(target_os = "windows")]
    {
        // Get the directory containing the executable
        let exe_dir = exe_path.parent().unwrap_or(&exe_path);
        let exe_dir_str = exe_dir.to_string_lossy().to_string();

        // Get current user PATH
        let current_path = std::env::var("PATH").unwrap_or_default();

        // Check if already in PATH
        if current_path.split(';').any(|p| p.eq_ignore_ascii_case(&exe_dir_str)) {
            return CliInstallResult {
                success: true,
                message: "CLI is already in PATH. You can use 'Evvl' from command prompt.".to_string(),
                path: Some(exe_dir_str),
            };
        }

        // Add to user PATH via registry
        let output = Command::new("reg")
            .args([
                "add",
                "HKCU\\Environment",
                "/v",
                "Path",
                "/t",
                "REG_EXPAND_SZ",
                "/d",
                &format!("{};{}", current_path, exe_dir_str),
                "/f",
            ])
            .output();

        match output {
            Ok(result) if result.status.success() => {
                // Notify the system that environment has changed
                let _ = Command::new("setx")
                    .args(["EVVL_INSTALLED", "1"])
                    .output();

                CliInstallResult {
                    success: true,
                    message: "CLI added to PATH. Restart your terminal to use 'Evvl' command.".to_string(),
                    path: Some(exe_dir_str),
                }
            }
            Ok(result) => CliInstallResult {
                success: false,
                message: format!(
                    "Failed to update PATH: {}",
                    String::from_utf8_lossy(&result.stderr)
                ),
                path: None,
            },
            Err(e) => CliInstallResult {
                success: false,
                message: format!("Failed to run reg command: {}", e),
                path: None,
            },
        }
    }
}

// ============================================================================
// Main Entry Point
// ============================================================================

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_cli::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_single_instance::init(|app, args, _cwd| {
            // When a second instance is launched, emit event to existing instance
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.show();
                let _ = window.set_focus();
                // Pass CLI args to the running instance
                let _ = app.emit("cli-args-received", args);
            }
        }))
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .invoke_handler(tauri::generate_handler![
            get_store_data,
            set_store_data,
            get_pending_cli_runs,
            get_env_api_keys,
            install_cli,
            check_cli_installed
        ])
        .setup(|app| {
            // Setup logging in debug mode
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }

            // Handle CLI arguments
            let cli_matches = app.cli().matches()?;

            // Check for --help flag first
            let show_help = cli_matches.args.get("help")
                .map(|a| a.occurrences > 0)
                .unwrap_or(false);

            if show_help {
                print_help();
                std::process::exit(0);
            }

            // Check for --version flag
            let show_version = cli_matches.args.get("version")
                .map(|a| a.occurrences > 0)
                .unwrap_or(false);

            if show_version {
                let version = env!("CARGO_PKG_VERSION");
                println!("evvl {}", version);
                std::process::exit(0);
            }

            // Check for --settings flag
            let open_settings = cli_matches.args.get("settings")
                .map(|a| a.occurrences > 0)
                .unwrap_or(false);

            // Check for global flags
            let json_output = cli_matches.args.get("json")
                .map(|a| a.occurrences > 0)
                .unwrap_or(false) || !atty::is(atty::Stream::Stdout);

            let open_gui = cli_matches.args.get("open")
                .map(|a| a.occurrences > 0)
                .unwrap_or(false);

            let project_filter = cli_matches.args.get("project")
                .and_then(|a| a.value.as_str())
                .map(|s| s.to_string());

            // Check if a subcommand was invoked
            let mut should_run_gui = true;
            let mut exit_code = 0;

            if let Some(subcommand_matches) = cli_matches.subcommand {
                let subcommand = subcommand_matches.name.as_str();
                let matches = &subcommand_matches.matches;

                match subcommand {
                    "projects" => {
                        exit_code = handle_projects_command(json_output);
                        should_run_gui = open_gui;
                    }
                    "prompts" => {
                        if let Some(sub_subcommand_matches) = &matches.subcommand {
                            let sub_subcommand = sub_subcommand_matches.name.as_str();
                            match sub_subcommand {
                                "list" | "test" => {
                                    exit_code = handle_prompts_list_command(
                                        project_filter.as_deref(),
                                        json_output
                                    );
                                    should_run_gui = open_gui;
                                }
                                _ => {}
                            }
                        } else {
                            // No subcommand, default to list
                            exit_code = handle_prompts_list_command(
                                project_filter.as_deref(),
                                json_output
                            );
                            should_run_gui = open_gui;
                        }
                    }
                    "export" => {
                        let run_id = matches.args.get("run")
                            .and_then(|a| a.value.as_str());
                        let format = matches.args.get("format")
                            .and_then(|a| a.value.as_str());
                        exit_code = handle_export_command(run_id, format, json_output);
                        should_run_gui = open_gui;
                    }
                    "run" => {
                        let prompt_text = matches.args.get("prompt")
                            .and_then(|a| a.value.as_str());
                        let prompt_name = matches.args.get("prompt-name")
                            .and_then(|a| a.value.as_str());
                        let version_note = matches.args.get("version-note")
                            .and_then(|a| a.value.as_str());
                        let models = matches.args.get("models")
                            .and_then(|a| a.value.as_str());
                        let dataset = matches.args.get("dataset")
                            .and_then(|a| a.value.as_str());
                        let no_dataset = matches.args.get("no-dataset")
                            .map(|a| a.occurrences > 0)
                            .unwrap_or(false);

                        exit_code = handle_run_command(
                            prompt_text,
                            prompt_name,
                            version_note,
                            models,
                            dataset,
                            no_dataset,
                            project_filter.as_deref(),
                            json_output,
                            open_gui
                        );
                        should_run_gui = open_gui;
                    }
                    _ => {}
                }
            } else {
                // No subcommand - check if positional prompt argument was provided
                // This enables the simplified syntax: evvl "prompt goes here"
                let positional_prompt = cli_matches.args.get("prompt")
                    .and_then(|a| {
                        // Handle multiple values (when prompt has multiple words)
                        match &a.value {
                            Value::Array(arr) => {
                                let parts: Vec<String> = arr.iter()
                                    .filter_map(|v| v.as_str().map(|s| s.to_string()))
                                    .collect();
                                if parts.is_empty() { None } else { Some(parts.join(" ")) }
                            }
                            Value::String(s) if !s.is_empty() => Some(s.clone()),
                            _ => None
                        }
                    });

                if let Some(prompt_text) = positional_prompt {
                    // Run with the positional prompt - auto-detect git repo as project
                    exit_code = handle_run_command(
                        Some(prompt_text.as_str()),
                        None,  // prompt_name
                        None,  // version_note
                        None,  // models (use project defaults)
                        None,  // dataset (use project default)
                        false, // no_dataset
                        project_filter.as_deref(),
                        json_output,
                        open_gui
                    );
                    should_run_gui = open_gui;
                }
            }

            // If we processed a CLI command and shouldn't open GUI, exit
            if !should_run_gui {
                std::process::exit(exit_code);
            }

            // Build and set the menu
            let menu = build_menu(&app.handle())?;
            app.set_menu(menu)?;

            // Setup system tray
            setup_tray(&app.handle())?;

            // If --settings flag, navigate to settings page
            if open_settings {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.eval("window.location.href = '/settings'");
                }
            }

            // Register global shortcuts
            app.global_shortcut().on_shortcut("CommandOrControl+N", {
                let app_handle = app.handle().clone();
                move |_app, _shortcut, _event| {
                    let _ = app_handle.emit("shortcut-new-evaluation", ());
                }
            })?;

            app.global_shortcut().on_shortcut("CommandOrControl+E", {
                let app_handle = app.handle().clone();
                move |_app, _shortcut, _event| {
                    let _ = app_handle.emit("shortcut-export", ());
                }
            })?;

            app.global_shortcut().on_shortcut("CommandOrControl+,", {
                let app_handle = app.handle().clone();
                move |_app, _shortcut, _event| {
                    if let Some(window) = app_handle.get_webview_window("main") {
                        let _ = window.eval("window.location.href = '/settings'");
                    }
                }
            })?;

            Ok(())
        })
        .on_menu_event(|app, event| handle_menu_event(app, event))
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
