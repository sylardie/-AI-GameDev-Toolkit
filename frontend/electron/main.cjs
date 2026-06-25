const { app, BrowserWindow, dialog, ipcMain, shell } = require("electron");
const { spawn } = require("node:child_process");
const http = require("node:http");
const path = require("node:path");

const FRONTEND_DIR = path.resolve(__dirname, "..");
const ROOT_DIR = path.resolve(FRONTEND_DIR, "..");
const BACKEND_DIR = path.join(ROOT_DIR, "backend");
const PYTHON_EXE = path.join(BACKEND_DIR, ".venv", "Scripts", "python.exe");
const PACKAGED_BACKEND_EXE = path.join(process.resourcesPath, "backend", "ai-gamedev-backend.exe");
const PACKAGED_FRONTEND_DIR = path.join(process.resourcesPath, "frontend");
const HEALTH_URL = "http://127.0.0.1:8010/api/health";
const REQUIRED_ASSET_SAMPLING_VERSION = 2;
const RENDERER_URL = process.env.ELECTRON_RENDERER_URL
  || (app.isPackaged ? "http://127.0.0.1:8010" : "http://127.0.0.1:5173");

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
      sandbox: true,
      webSecurity: true,
    },
  });

  mainWindow.webContents.on("will-navigate", (event, url) => {
    if (!url.startsWith(RENDERER_URL)) {
      event.preventDefault();
    }
  });
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    const allowedDownloadPrefix = "http://127.0.0.1:8010/api/files/download";
    return { action: url.startsWith(allowedDownloadPrefix) ? "allow" : "deny" };
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

  const backendExecutable = app.isPackaged ? PACKAGED_BACKEND_EXE : PYTHON_EXE;
  if (!require("node:fs").existsSync(backendExecutable)) {
    throw new Error(
      [
        "Backend executable was not found.",
        "",
        `Expected backend: ${backendExecutable}`,
        "",
        app.isPackaged
          ? "Reinstall the application or download a complete release package."
          : "Create backend/.venv and install backend/requirements.txt.",
      ].join("\n"),
    );
  }

  const backendArgs = app.isPackaged
    ? []
    : ["-m", "uvicorn", "app.main:app", "--port", "8010"];
  const backendCwd = app.isPackaged ? path.dirname(backendExecutable) : BACKEND_DIR;
  const backendEnv = {
    ...process.env,
    AI_GAMEDEV_DATA_DIR: app.isPackaged
      ? path.join(app.getPath("userData"), "data")
      : path.join(BACKEND_DIR, "app", "data"),
  };
  if (app.isPackaged) {
    backendEnv.AI_GAMEDEV_FRONTEND_DIR = PACKAGED_FRONTEND_DIR;
  }

  backendProcess = spawn(backendExecutable, backendArgs, {
    cwd: backendCwd,
    windowsHide: true,
    stdio: "ignore",
    env: backendEnv,
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
  ipcMain.handle("dialog:choose-folder", async (event, options = {}) => {
    if (!isTrustedRenderer(event)) {
      return null;
    }
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

  ipcMain.handle("shell:show-item-in-folder", async (event, filePath) => {
    if (!isTrustedRenderer(event)) {
      return false;
    }
    if (!filePath || typeof filePath !== "string") {
      return false;
    }

    shell.showItemInFolder(path.resolve(filePath));
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

function isTrustedRenderer(event) {
  const url = event.senderFrame?.url || "";
  return url.startsWith(RENDERER_URL);
}

app.on("before-quit", () => {
  stopBackendIfOwned();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
