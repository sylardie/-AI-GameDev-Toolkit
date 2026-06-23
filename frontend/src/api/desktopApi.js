export function isDesktopRuntime() {
  return Boolean(window.aiGameDevToolkit?.chooseFolder);
}

export async function chooseFolder(title) {
  if (!isDesktopRuntime()) {
    return null;
  }

  return window.aiGameDevToolkit.chooseFolder({ title });
}

export function canShowItemInFolder() {
  return Boolean(window.aiGameDevToolkit?.showItemInFolder);
}

export async function showProjectFileInFolder(projectPath, relativePath) {
  if (!canShowItemInFolder() || !projectPath || !relativePath) {
    return false;
  }

  const normalizedProjectPath = projectPath.replace(/[\\/]+$/, "");
  const normalizedRelativePath = relativePath.replace(/^[\\/]+/, "");
  const separator = normalizedProjectPath.includes("\\") ? "\\" : "/";
  const fullPath = `${normalizedProjectPath}${separator}${normalizedRelativePath}`;
  return window.aiGameDevToolkit.showItemInFolder(fullPath);
}
