const vscode = require('vscode');

let statusBarItem;
let timerInterval;
let deadlineDate;
let dayBeforeShown = false;  // За сутки панель
let afterShown = false;      // После дедлайна панель

function activate(context) {
  let startCmd =
      vscode.commands.registerCommand('deadline-timer.start', async function() {
        const input = await vscode.window.showInputBox(
            {prompt: 'Введите дедлайн в формате ГГГГ-ММ-ДД ЧЧ:ММ'});
        if (!input) return;

        const parsed = new Date(input);
        if (isNaN(parsed.getTime())) {
          vscode.window.showErrorMessage('Неверный формат даты.');
          return;
        }

        deadlineDate = parsed;
        dayBeforeShown = false;
        afterShown = false;

        startStatusBarTimer(context);
        vscode.window.showInformationMessage('⏱ Таймер до дедлайна запущен');
      });

  context.subscriptions.push(startCmd);
}

function startStatusBarTimer(context) {
  if (!statusBarItem) {
    statusBarItem =
        vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    statusBarItem.command = 'deadline-timer.start';
    context.subscriptions.push(statusBarItem);
  }
  statusBarItem.show();

  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    updateStatusBar(context);
  }, 1000);
}

function updateStatusBar(context) {
  if (!deadlineDate) return;

  const now = new Date();
  const diff = deadlineDate - now;

  // 🚨 Дедлайн прошёл
  if (diff <= 0) {
    statusBarItem.text = `🚨 Дедлайн истёк! Печалик :(`;

    if (!afterShown) {
      afterShown = true;
      openAfterDeadlinePanel(context);
    }
    return;
  }

  // ⚠️ До дедлайна ≤ 24 часов
  if (diff <= 24 * 60 * 60 * 1000 && !dayBeforeShown) {
    dayBeforeShown = true;
    openBeforeDeadlinePanel(context);
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  statusBarItem.text = `⏱ ${days}д ${hours}ч ${minutes}м ${seconds}с`;
}

// Панель за сутки
function openBeforeDeadlinePanel(context) {
  const panel = vscode.window.createWebviewPanel(
      'deadlineTimerBefore', '⚠️ До дедлайна сутки! Делай быстрее 😡',
      vscode.ViewColumn.One, {
        enableScripts: true,
        localResourceRoots: [vscode.Uri.joinPath(context.extensionUri, 'media')]
      });

  const beforeImg = panel.webview.asWebviewUri(
      vscode.Uri.joinPath(context.extensionUri, 'media', 'before.png'));

  panel.webview.html = `
        <!DOCTYPE html>
        <html lang="ru">
        <head>
            <meta charset="UTF-8">
            <title>⚠️ До дедлайна сутки! Делай быстрее 😡</title>
            <style>body { font-family:sans-serif; text-align:center; padding:20px; } img { max-width:300px; margin-top:20px; }</style>
        </head>
        <body>
            <h2>⚠️ До дедлайна сутки! Делай быстрее 😡</h2>
            <img src="${beforeImg}">
        </body>
        </html>
    `;
}

// Панель после дедлайна
function openAfterDeadlinePanel(context) {
  const panel = vscode.window.createWebviewPanel(
      'deadlineTimerAfter', '🚨 Дедлайн истёк! Печалик :(',
      vscode.ViewColumn.One, {
        enableScripts: true,
        localResourceRoots: [vscode.Uri.joinPath(context.extensionUri, 'media')]
      });

  const afterImg = panel.webview.asWebviewUri(
      vscode.Uri.joinPath(context.extensionUri, 'media', 'after.png'));

  panel.webview.html = `
        <!DOCTYPE html>
        <html lang="ru">
        <head>
            <meta charset="UTF-8">
            <title>🚨 Дедлайн истёк! Печалик :(</title>
            <style>body { font-family:sans-serif; text-align:center; padding:20px; } img { max-width:300px; margin-top:20px; }</style>
        </head>
        <body>
            <h2>🚨 Дедлайн истёк! Печалик :(</h2>
            <img src="${afterImg}">
        </body>
        </html>
    `;
}

function deactivate() {
  if (timerInterval) clearInterval(timerInterval);
  if (statusBarItem) statusBarItem.dispose();
}

module.exports = {
  activate,
  deactivate
};