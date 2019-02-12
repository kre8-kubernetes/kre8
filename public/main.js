const { electron, app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');

const events = require('../eventTypes.js')

// Create our window object
let win;

// Function to create our application window, that will be invoked with app.on('ready')
function createWindow () {
  win = new BrowserWindow({width: 1200, height: 800});

  win.loadURL(isDev ? 'http://localhost:3000' : `file://${path.join(__dirname, 'dist/index.html')}`)

  win.on('closed', () => win = null)
}

// AWS SDK EVENTS WILL GO HERE
ipcMain.on(events.CREATE_IAM_ROLE, (event, data) => {
  // TEST data should be 'CREATE_ROLE';
  console.log('data from create iam role', data);
  // Perform logic to create the ROLE

  // Once role is created then we need to indicate back to the renderer process
  // that the role is made
  win.webContents.send(events.HANDLE_NEW_ROLE, 'New Role Name Here');
})


// KUBECTL EVENTS WILL GO HERE
ipcMain.on(events.CREATE_POD, (event, data) => {
  // TEST data should be 'CREATE_ROLE';
  console.log('data from create a pod', data)
  // Perform logic to create the POD

  // Once role is created then we need to indicate back to the renderer process
  // that the role is made
  win.webContents.send(events.HANDLE_NEW_POD, 'New Pod Here');
})


// HANDLE app ready
app.on('ready', createWindow);

// HANDLE app shutdown
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
})

app.on('activate', () => {
  if (win === null) {
    createWindow();
  }
})
