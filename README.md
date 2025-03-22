# denovitan

A Deno-based "electron" using webview for the app shell and vite for the
frontend.

# Philosophies

1. Why powershell for scripts? It works on all three major OSes without changes

# Debugging

## In vscode:

`CTRL-SHIFT-P` => Tasks: Run Task => start-dev-servers

this'll fire off three terminal processes: the backend, the frontend, and the
app. The app will wait for a debugger to connect.

`CTRL-SHIFT-D` will bring you to the Debug pane. At the top-left switch to
`Attach to Backend` and hit f5. This'll let you debug the backend in vscode.

You can `CTRL-SHIFT-I` in the webview to pop up an inspector window to inspect
frontend things.

# DB Migration

`deno -A --node-modules-dir npm:drizzle-kit generate`
