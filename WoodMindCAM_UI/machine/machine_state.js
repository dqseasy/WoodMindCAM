/* =========================================================
WoodMind CAM - Machine State
Phase 2.1
========================================================= */

window.WoodMind = window.WoodMind || {};

/* =========================================================
MODE
========================================================= */

const MODE = {
VIEW: 'view',
NEW: 'new',
EDIT: 'edit'
};

/* =========================================================
DEFAULT MACHINE
(khớp với machine1.xml)
========================================================= */

const DEFAULT_MACHINE = {
schema_version: 1,

id: 0,

name: '',
manufacturer: '',
controller: '',

units: 'MM',
feed_unit: 'MM_MIN',

image: '../assets/default_machine.png',

startup_code: 'G90\nG17\nG40\nG49',

atc: {
enable: true,

tools: [],

tool_change: 'M05\\nM06 T[T]\\nG43 H[T]\\nM03 S[S]'

},

drill: {
enable: true,

tools: [],

drill_on: 'M90\\nM10',

drill_off: 'M91\\nM12',

tool_change: 'T[T]\\nH[T]'

},

shutdown_code: 'M05\nM30'
};

/* =========================================================
GLOBAL STATE
========================================================= */

const AppState = {

mode: MODE.VIEW,

currentTab: 'general',

selectedId: null,

dirty: false,

machineList: [],

machineMap: {},

currentMachine: null,

originalMachine: null

};

/* =========================================================
HELPERS
========================================================= */

function deepClone(obj) {
return JSON.parse(JSON.stringify(obj));
}

function createEmptyMachine() {
return deepClone(DEFAULT_MACHINE);
}

function hasMachine(id) {
return Object.prototype.hasOwnProperty.call(AppState.machineMap, String(id));
}

function getMachine(id) {
return AppState.machineMap[String(id)] || null;
}

function setCurrentMachine(machine) {
AppState.currentMachine = deepClone(machine);
}

function resetDirty() {
AppState.dirty = false;
}

function markDirty() {
AppState.dirty = true;
}

/* =========================================================
LOAD MACHINE LIST
Ruby sẽ gọi:
window.WoodMind.receiveMachineList(data)
========================================================= */

function loadMachineList(data) {

AppState.machineList = Array.isArray(data?.machines)
? data.machines
: [];

AppState.machineMap = data?.machine_map || {};

if (AppState.machineList.length > 0) {

const first = AppState.machineList[0];

AppState.selectedId = first.id;

const machine = getMachine(first.id);

setCurrentMachine(machine);

AppState.originalMachine = deepClone(machine);

} else {

AppState.selectedId = null;

const machine = createEmptyMachine();

setCurrentMachine(machine);

AppState.originalMachine = deepClone(machine);

}

AppState.mode = MODE.VIEW;

resetDirty();
}

/* =========================================================
SELECT MACHINE
========================================================= */

function selectMachine(id) {

if (!hasMachine(id))
return false;

AppState.selectedId = id;

const machine = getMachine(id);

setCurrentMachine(machine);

AppState.originalMachine = deepClone(machine);

AppState.mode = MODE.VIEW;

resetDirty();

return true;
}

/* =========================================================
MODE
========================================================= */

function enterViewMode() {

AppState.mode = MODE.VIEW;

resetDirty();
}

function enterNewMode() {

AppState.mode = MODE.NEW;

AppState.selectedId = null;

const machine = createEmptyMachine();

setCurrentMachine(machine);

AppState.originalMachine = deepClone(machine);

resetDirty();
}

function enterEditMode() {

if (!AppState.currentMachine)
return;

AppState.mode = MODE.EDIT;

AppState.originalMachine = deepClone(AppState.currentMachine);

resetDirty();
}

function cancelEditing() {

AppState.currentMachine = deepClone(AppState.originalMachine);

AppState.mode = MODE.VIEW;

resetDirty();
}

/* =========================================================
TAB
========================================================= */

function setCurrentTab(tabName) {
AppState.currentTab = tabName;
}

/* =========================================================
SERIALIZE
========================================================= */

function getCurrentMachineData() {
return deepClone(AppState.currentMachine);
}

/* =========================================================
EXPORT
========================================================= */

window.WoodMind.MODE = MODE;

window.WoodMind.AppState = AppState;

window.WoodMind.loadMachineList = loadMachineList;

window.WoodMind.selectMachine = selectMachine;

window.WoodMind.enterViewMode = enterViewMode;

window.WoodMind.enterNewMode = enterNewMode;

window.WoodMind.enterEditMode = enterEditMode;

window.WoodMind.cancelEditing = cancelEditing;

window.WoodMind.setCurrentTab = setCurrentTab;

window.WoodMind.getCurrentMachineData = getCurrentMachineData;

window.WoodMind.markDirty = markDirty;

window.WoodMind.resetDirty = resetDirty;

window.WoodMind.receiveMachineList = function (data) {

loadMachineList(data);

if (window.WoodMind.renderAll)
window.WoodMind.renderAll();
};
