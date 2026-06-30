const { app, BrowserWindow, dialog, ipcMain, safeStorage, session, shell } = require("electron");
const { spawn } = require("node:child_process");
const crypto = require("node:crypto");
const fs = require("node:fs");
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
const REQUIRED_LOCAL_SECURITY_VERSION = 1;
const RENDERER_URL = process.env.ELECTRON_RENDERER_URL
  || (app.isPackaged ? "http://127.0.0.1:8010" : "http://127.0.0.1:5173");

let mainWindow = null;
let backendProcess = null;
let backendStartedByElectron = false;
let apiToken = "";
let settingsKey = "";

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
    if (!isTrustedUrl(url)) {
      event.preventDefault();
    }
  });
  mainWindow.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  session.defaultSession.setPermissionRequestHandler((_webContents, _permission, callback) => {
    callback(false);
  });

  await mainWindow.loadURL(RENDERER_URL);
}

async function ensureBackend() {
  const health = await getBackendHealth();
  if (health.healthy && health.compatible && health.secure) {
    return;
  }
  if (health.healthy) {
    throw new Error(
      [
        "A stale backend is already running on http://127.0.0.1:8010.",
        "",
        "Please stop the existing backend process and start the Electron dev shell again.",
        "The current application requires a compatible authenticated backend.",
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
    AI_GAMEDEV_DEFAULT_DATA_DIR: path.join(app.getPath("userData"), "data"),
    AI_GAMEDEV_API_TOKEN: apiToken,
    AI_GAMEDEV_SETTINGS_KEY: settingsKey,
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
          secure: healthy
            && payload.local_security_version >= REQUIRED_LOCAL_SECURITY_VERSION
            && payload.api_auth_required === true,
        });
      });
    });

    request.on("timeout", () => {
      request.destroy();
      resolve({ healthy: false, compatible: false });
    });
    request.on("error", () => resolve({ healthy: false, compatible: false, secure: false }));
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
  ipcMain.handle("security:get-api-token", (event) => {
    if (!isTrustedRenderer(event)) {
      return "";
    }
    return apiToken;
  });

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
    initializeSecuritySecrets();
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

function initializeSecuritySecrets() {
  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error(
      "Windows credential encryption is unavailable. Secure startup cannot continue.",
    );
  }

  apiToken = crypto.randomBytes(32).toString("base64url");
  const keyPath = path.join(app.getPath("userData"), "settings-key.bin");
  let masterKey;

  if (fs.existsSync(keyPath)) {
    try {
      masterKey = Buffer.from(
        safeStorage.decryptString(fs.readFileSync(keyPath)),
        "base64",
      );
    } catch (error) {
      throw new Error(`Unable to decrypt the local settings key: ${error.message}`);
    }
  } else {
    masterKey = crypto.randomBytes(32);
    const encrypted = safeStorage.encryptString(masterKey.toString("base64"));
    const temporaryPath = `${keyPath}.tmp`;
    fs.mkdirSync(path.dirname(keyPath), { recursive: true });
    fs.writeFileSync(temporaryPath, encrypted);
    fs.renameSync(temporaryPath, keyPath);
  }

  if (masterKey.length !== 32) {
    throw new Error("The local settings encryption key is invalid.");
  }
  settingsKey = masterKey.toString("base64url");
}

function isTrustedRenderer(event) {
  const url = event.senderFrame?.url || "";
  return isTrustedUrl(url);
}

function isTrustedUrl(url) {
  try {
    return new URL(url).origin === new URL(RENDERER_URL).origin;
  } catch {
    return false;
  }
}

app.on("before-quit", () => {
  stopBackendIfOwned();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
