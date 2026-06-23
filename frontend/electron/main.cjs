const { app, BrowserWindow, dialog, ipcMain, shell } = require("electron");
const { spawn } = require("node:child_process");
const http = require("node:http");
const path = require("node:path");

const FRONTEND_DIR = path.resolve(__dirname, "..");
const ROOT_DIR = path.resolve(FRONTEND_DIR, "..");
const BACKEND_DIR = path.join(ROOT_DIR, "backend");
const PYTHON_EXE = path.join(BACKEND_DIR, ".venv", "Scripts", "python.exe");
const HEALTH_URL = "http://127.0.0.1:8010/api/health";
const REQUIRED_ASSET_SAMPLING_VERSION = 2;
const RENDERER_URL = process.env.ELECTRON_RENDERER_URL || "http://127.0.0.1:5173";

let mainWindow = null;
let backendProcess = null;
let backendStartedByElectron = false;

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 960,
    minWidth: 1100,
    minHeight: 760,
    title: "AI GameDev Toolkit",
    backgroundColor: "#020617",
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  await mainWindow.loadURL(RENDERER_URL);
}

async function ensureBackend() {
  const health = await getBackendHealth();
  if (health.healthy && health.compatible) {
    return;
  }
  if (health.healthy && !health.compatible) {
    throw new Error(
      [
        "A stale backend is already running on http://127.0.0.1:8010.",
        "",
        "Please stop the existing backend process and start the Electron dev shell again.",
        "The current Asset Tools frame sampling requires a newer backend.",
      ].join("\n"),
    );
  }

  if (!require("node:fs").existsSync(PYTHON_EXE)) {
    throw new Error(
      [
        "Backend virtual environment was not found.",
        "",
        `Expected Python executable: ${PYTHON_EXE}`,
        "",
        "Create it from backend/ with:",
        "python -m venv .venv",
        ".venv\\Scripts\\python.exe -m pip install -r requirements.txt",
      ].join("\n"),
    );
  }

  backendProcess = spawn(PYTHON_EXE, ["-m", "uvicorn", "app.main:app", "--port", "8010"], {
    cwd: BACKEND_DIR,
    windowsHide: true,
    stdio: "ignore",
  });
  backendStartedByElectron = true;

  backendProcess.on("exit", () => {
    backendProcess = null;
    backendStartedByElectron = false;
  });

  await waitForBackend();
}

function getBackendHealth() {
  return new Promise((resolve) => {
    const request = http.get(HEALTH_URL, { timeout: 1500 }, (response) => {
      let body = "";
      response.setEncoding("utf8");
      response.on("data", (chunk) => {
        body += chunk;
      });
      response.on("end", () => {
        const healthy = response.statusCode >= 200 && response.statusCode < 300;
        let payload = {};
        try {
          payload = JSON.parse(body);
        } catch {
          payload = {};
        }
        resolve({
          healthy,
          compatible: healthy && payload.asset_sampling_version >= REQUIRED_ASSET_SAMPLING_VERSION,
        });
      });
    });

    request.on("timeout", () => {
      request.destroy();
      resolve({ healthy: false, compatible: false });
    });
    request.on("error", () => resolve({ healthy: false, compatible: false }));
  });
}

async function waitForBackend() {
  const startedAt = Date.now();
  const timeoutMs = 30000;

  while (Date.now() - startedAt < timeoutMs) {
    const health = await getBackendHealth();
    if (health.healthy && health.compatible) {
      return;
    }
    await delay(500);
  }

  throw new Error(`Backend did not become healthy within ${timeoutMs / 1000} seconds.`);
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function stopBackendIfOwned() {
  if (!backendStartedByElectron || !backendProcess) {
    return;
  }

  backendProcess.kill();
  backendProcess = null;
  backendStartedByElectron = false;
}

app.whenReady().then(async () => {
  ipcMain.handle("dialog:choose-folder", async (_event, options = {}) => {
    const dialogOptions = {
      title: options.title || "Choose Folder",
      properties: ["openDirectory"],
    };
    const result = mainWindow
      ? await dialog.showOpenDialog(mainWindow, dialogOptions)
      : await dialog.showOpenDialog(dialogOptions);

    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }

    return result.filePaths[0];
  });

  ipcMain.handle("shell:show-item-in-folder", async (_event, filePath) => {
    if (!filePath || typeof filePath !== "string") {
      return false;
    }

    shell.showItemInFolder(filePath);
    return true;
  });

  try {
    await ensureBackend();
    await createWindow();
  } catch (error) {
    dialog.showErrorBox("AI GameDev Toolkit startup failed", error.message || String(error));
    app.quit();
  }

  app.on("activate", async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      await createWindow();
    }
  });
});

app.on("before-quit", () => {
  stopBackendIfOwned();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
