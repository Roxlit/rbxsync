import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { RbxSyncClient } from './server/client';
import { StatusBarManager } from './views/statusBar';
import { SidebarWebviewProvider } from './views/sidebarWebview';
import { connectCommand, disconnectCommand } from './commands/connect';
import { extractCommand } from './commands/extract';
import { syncCommand } from './commands/sync';
import { runPlayTest, disposeTestChannel } from './commands/test';
import { openConsole, closeConsole, toggleE2EMode, initE2EMode, disposeConsole, isE2EMode } from './commands/console';
import {
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
  TransportKind,
} from 'vscode-languageclient/node';

let client: RbxSyncClient;
let languageClient: LanguageClient | undefined;
let statusBar: StatusBarManager;
let sidebarView: SidebarWebviewProvider;

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  // Get configuration
  const config = vscode.workspace.getConfiguration('rbxsync');
  const port = config.get<number>('serverPort') || 44755;
  const autoConnect = config.get<boolean>('autoConnect') ?? true;

  // Initialize components
  client = new RbxSyncClient(port);

  // Initialize E2E mode from saved state
  initE2EMode(context);

  // Set project directory for multi-workspace support
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (workspaceFolders?.length) {
    client.setProjectDir(workspaceFolders[0].uri.fsPath);
  }

  statusBar = new StatusBarManager(client);
  sidebarView = new SidebarWebviewProvider(context.extensionUri);

  // Register webview sidebar view
  const sidebarViewDisposable = vscode.window.registerWebviewViewProvider(
    SidebarWebviewProvider.viewType,
    sidebarView
  );

  // Listen for connection changes and fetch all places
  client.onConnectionChange(async (state) => {
    if (state.connected) {
      // Fetch all connected places
      const places = await client.getConnectedPlaces();
      const projectDir = client.projectDir;

      // Update both status bar and activity view with all places
      statusBar.updatePlaces(places, projectDir);
      sidebarView.setConnectionStatus('connected', places, projectDir);
    } else {
      statusBar.updatePlaces([], '');
      sidebarView.setConnectionStatus('disconnected', [], '');
    }
  });

  // Register commands
  const commands = [
    vscode.commands.registerCommand('rbxsync.connect', async () => {
      sidebarView.setConnectionStatus('connecting');
      await connectCommand(client, statusBar);
    }),

    vscode.commands.registerCommand('rbxsync.disconnect', async () => {
      await disconnectCommand(client, statusBar);
    }),

    vscode.commands.registerCommand('rbxsync.extract', async () => {
      statusBar.setBusy('Extracting');
      sidebarView.setCurrentOperation('Extracting');
      await extractCommand(client, statusBar, sidebarView);
      sidebarView.setCurrentOperation(null);
      statusBar.clearBusy();
    }),

    vscode.commands.registerCommand('rbxsync.sync', async () => {
      statusBar.setBusy('Syncing');
      sidebarView.setCurrentOperation('Syncing');
      await syncCommand(client, statusBar);
      sidebarView.setCurrentOperation(null);
      statusBar.clearBusy();
    }),

    vscode.commands.registerCommand('rbxsync.runTest', async () => {
      statusBar.setBusy('Testing');
      sidebarView.setCurrentOperation('Testing');
      await runPlayTest(client);
      sidebarView.setCurrentOperation(null);
      statusBar.clearBusy();
    }),

    // Per-studio commands (take projectDir as argument)
    vscode.commands.registerCommand('rbxsync.syncTo', async (projectDir: string) => {
      statusBar.setBusy('Syncing');
      sidebarView.setCurrentOperation(`Syncing to ${projectDir}`);
      await syncCommand(client, statusBar, projectDir);
      sidebarView.setCurrentOperation(null);
      statusBar.clearBusy();
    }),

    vscode.commands.registerCommand('rbxsync.extractFrom', async (projectDir: string) => {
      statusBar.setBusy('Extracting');
      sidebarView.setCurrentOperation(`Extracting from ${projectDir}`);
      await extractCommand(client, statusBar, sidebarView, projectDir);
      sidebarView.setCurrentOperation(null);
      statusBar.clearBusy();
    }),

    vscode.commands.registerCommand('rbxsync.runTestOn', async (projectDir: string) => {
      statusBar.setBusy('Testing');
      sidebarView.setCurrentOperation(`Testing ${projectDir}`);
      await runPlayTest(client, projectDir);
      sidebarView.setCurrentOperation(null);
      statusBar.clearBusy();
    }),

    vscode.commands.registerCommand('rbxsync.refresh', () => {
      sidebarView.refresh();
    }),

    vscode.commands.registerCommand('rbxsync.openMetadata', async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) return;

      const currentFile = editor.document.uri.fsPath;
      const ext = path.extname(currentFile);

      if (ext !== '.lua' && ext !== '.luau') return;

      const baseName = path.basename(currentFile)
        .replace('.server.luau', '')
        .replace('.client.luau', '')
        .replace('.luau', '')
        .replace('.server.lua', '')
        .replace('.client.lua', '')
        .replace('.lua', '');

      const dir = path.dirname(currentFile);
      const metadataFile = path.join(dir, `${baseName}.rbxjson`);

      if (fs.existsSync(metadataFile)) {
        const doc = await vscode.workspace.openTextDocument(metadataFile);
        await vscode.window.showTextDocument(doc, { viewColumn: vscode.ViewColumn.Beside });
      }
    }),

    vscode.commands.registerCommand('rbxsync.toggleMetadataFiles', async () => {
      const filesConfig = vscode.workspace.getConfiguration('files');
      const exclude = filesConfig.get<Record<string, boolean>>('exclude') || {};
      const isHidden = exclude['**/*.rbxjson'] === true;

      exclude['**/*.rbxjson'] = !isHidden;
      await filesConfig.update('exclude', exclude, vscode.ConfigurationTarget.Workspace);
    }),

    // Console commands for E2E testing
    vscode.commands.registerCommand('rbxsync.openConsole', async () => {
      await openConsole(client);
    }),

    vscode.commands.registerCommand('rbxsync.closeConsole', () => {
      closeConsole();
    }),

    vscode.commands.registerCommand('rbxsync.toggleE2EMode', () => {
      const enabled = toggleE2EMode(context);
      sidebarView.setE2EMode(enabled);
    })
  ];

  // Add to subscriptions
  context.subscriptions.push(
    client,
    statusBar,
    sidebarViewDisposable,
    ...commands
  );

  // Show status bar
  statusBar.show();

  // Auto-connect if enabled
  if (autoConnect) {
    setTimeout(async () => {
      sidebarView.setConnectionStatus('connecting');
      const connected = await client.connect();
      if (connected) {
        // Register workspace with server immediately
        if (client.projectDir) {
          await client.registerWorkspace(client.projectDir);
          statusBar.updatePlaces([], client.projectDir); // Set currentProjectDir for polling
        }
      } else {
        // Set project dir for polling even if not connected yet
        if (client.projectDir) {
          statusBar.updatePlaces([], client.projectDir);
        }
      }
      // Always start polling to detect server when it starts
      statusBar.startPolling();
    }, 1000);
  }

  // Start rbxjson Language Server
  await startLanguageServer(context);
}

/**
 * Start the rbxjson Language Server
 */
async function startLanguageServer(context: vscode.ExtensionContext): Promise<void> {
  // The server is implemented in the same extension
  const serverModule = context.asAbsolutePath(path.join('dist', 'lsp', 'server.js'));

  // If the server module doesn't exist, skip LSP (development mode)
  if (!fs.existsSync(serverModule)) {
    console.log('[rbxjson LSP] Server module not found, skipping LSP initialization');
    return;
  }

  const serverOptions: ServerOptions = {
    run: {
      module: serverModule,
      transport: TransportKind.ipc,
    },
    debug: {
      module: serverModule,
      transport: TransportKind.ipc,
      options: { execArgv: ['--nolazy', '--inspect=6009'] },
    },
  };

  const clientOptions: LanguageClientOptions = {
    documentSelector: [{ scheme: 'file', language: 'rbxjson' }],
    synchronize: {
      fileEvents: vscode.workspace.createFileSystemWatcher('**/*.rbxjson'),
    },
  };

  languageClient = new LanguageClient(
    'rbxjsonLanguageServer',
    'rbxjson Language Server',
    serverOptions,
    clientOptions
  );

  // Start the client (also launches the server)
  await languageClient.start();
  console.log('[rbxjson LSP] Language server started');
}

export async function deactivate(): Promise<void> {
  disposeTestChannel();
  disposeConsole();

  // Stop the language server
  if (languageClient) {
    await languageClient.stop();
  }
}
