import { KeybindsInput } from "./keybindsInput.js";
import winCounter from "./winCounter.js";
import WindowManager from "./windowManager.js";
import versionData from '../version.json';
import { displayChangelog } from './changelog.js';
import replayHistory from './replayHistory.js'
import emojiBar from "./emojiBar.js";
import { initQuickToggles } from './quickToggles.js';

window.__fx = window.__fx || {};
const __fx = window.__fx;

var settings = {
  //"showBotDonations": false,
  displayWinCounter: true,
  displayTickNumber: true,
  useFullscreenMode: false,
  hoveringTooltip: true,
  //"hideAllLinks": false,
  realisticNames: false,
  showPlayerDensity: true,
  coloredDensity: true,
  densityDisplayStyle: "absoluteQuotient",
  hideBotNames: false,
  highlightClanSpawns: false,
  detailedTeamPercentage: false,
  openDonationHistoryFromLb: true,
  //"customMapFileBtn": true
  customBackgroundUrl: "",
  keybindButtons: false,
  attackPercentageKeybinds: [],
  hidePropagandaPopup: false,
  showReplayTimebar: true,
  customEmojiBar: false,
  emojiBar: [],
  // NEW SETTINGS
  optimizedSettings: true,
  showBoatPaths: true
};
__fx.settings = settings;
const discontinuedSettings = ["hideAllLinks", "fontName"];
__fx.makeMainMenuTransparent = false;

// https://stackoverflow.com/a/34156339
function saveFile(content, fileName, contentType) {
  var a = document.createElement("a");
  var file = new Blob([content], { type: contentType });
  a.href = URL.createObjectURL(file);
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(a.href);
}
function createButton(text, action) {
    const button = document.createElement("button");
    button.textContent = text;
    button.addEventListener("click", action);
    return button;
}

function ReplayHistoryList(container) {
  const title = document.createElement("p");
  title.innerHTML = "<b>Saved Replays</b> (auto-saves your last 5 games)";
  container.append(title);

  const list = document.createElement("div");
  container.append(list);

  function formatTime(timestamp) {
    const minutes = Math.floor((Date.now() - timestamp) / 60000);
    if (minutes < 1) return "just now";
    if (minutes < 60) return minutes + "m ago";
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return hours + "h ago";
    return Math.floor(hours / 24) + "d ago";
  }

  function render() {
    list.innerHTML = "";
    const replays = replayHistory.getAll();
    if (!replays.length) {
      const empty = document.createElement("small");
      empty.innerText = "No replays saved yet. Finish a game and it'll show up here.";
      list.append(empty);
      return;
    }
    replays.forEach((replay) => {
      const row = document.createElement("div");
      row.style.display = "flex";
      row.style.alignItems = "center";
      row.style.gap = "6px";
      row.style.marginBottom = "4px";

      const label = document.createElement("small");
      label.innerText = formatTime(replay.timestamp);
      label.style.flex = "1";

      const loadBtn = createButton("Load", () => {
        WindowManager.closeWindow("settings");
        replayHistory.load(replay.data);
      })
      const copyBtn = createButton("Copy", () => {
          navigator.clipboard.writeText(replay.data).then(() => {
          copyBtn.innerText = "Copied!";
          setTimeout(() => (copyBtn.innerText = "Copy"), 1500);
        }).catch(() => alert("Failed to copy"));
      });
      const deleteBtn = createButton("Delete", () => {
        replayHistory.remove(replay.timestamp);
        render();
      });
      const downloadBtn = createButton("Download", () =>
        saveFile(replay.data, `replay_${replay.timestamp}.txt`, "text/plain"),
      )
      row.append(label, loadBtn, copyBtn, downloadBtn, deleteBtn);
      list.append(row);
    });
  }

  this.update = render;
}

function EmojiBarEditor(container) {
  const title = document.createElement("p");
  title.innerHTML = "<b>Custom emoji bar</b> (the 9 emojis shown on the first click of the emoji button)";
  const slots = document.createElement("div");
  slots.className = "emoji-bar-slots";
  const palette = document.createElement("div");
  palette.className = "emoji-bar-palette";
  const pager = document.createElement("div");
  pager.className = "emoji-bar-pager";
  const note = document.createElement("small");
  note.innerText = 'Click a slot, then click an emoji or flag below to place it there.';
  container.append(title, slots, palette, pager, note);

  const perPage = 49;
  let bar = [], selected = 0, page = 0;


  function fill(button, pl) {
    const tile = emojiBar.tileFor(pl);
    if (!tile) return button.append(emojiBar.emojiFor(pl));
    const img = document.createElement("img");
    img.src = tile;
    button.append(img);
  }

  function renderSlots() {
    slots.innerHTML = "";
    bar.forEach((pl, i) => {
      const slot = createButton("", () => (selected = i, renderSlots()));
      slot.className = "emoji-slot" + (i === selected ? " selected" : "");
      fill(slot, pl);
      slots.append(slot);
    });
  }

  function renderPage() {
    const all = emojiBar.palette();
    const pages = Math.ceil(all.length / perPage) || 1;
    if (page >= pages) page = pages - 1;
    palette.innerHTML = "";
    all.slice(page * perPage, (page + 1) * perPage).forEach((pl) => {
      const choice = createButton("", () => {
        bar[selected] = pl;
        selected = (selected + 1) % 9;
        renderSlots();
      });
      choice.className = "emoji-choice";
      fill(choice, pl);
      palette.append(choice);
    });
    pager.innerHTML = "";
    if (pages < 2) return;
    const label = document.createElement("small");
    label.innerText = `Page ${page + 1} / ${pages}`;
    const flip = (step) => (page = (page + step + pages) % pages, renderPage());
    pager.append(createButton("‹", () => flip(-1)), label, createButton("›", () => flip(1)));
  }

  this.update = function (settings) {
    if (settings.emojiBar?.length !== 9) settings.emojiBar = emojiBar.defaultBar.slice();
    bar = settings.emojiBar;
    selected = page = 0;
    renderPage();
    renderSlots();
  };
}

const settingsManager = new (function () {
  const settingsStructure = [
    {
      for: "displayWinCounter",
      type: "checkbox",
      label: "Display win counter",
      note: "The win counter tracks multiplayer solo wins (not in team games)",
    },
    {
      type: "button",
      text: "Reset win counter",
      action: winCounter.removeWins,
    },
    {
      for: "displayTickNumber",
      type: "checkbox",
      label: "Display tick number near the balance",
    },
    {
      for: "useFullscreenMode",
      type: "checkbox",
      label: "Use fullscreen mode",
      note: "Note: fullscreen mode will trigger after you click anywhere on the page due to browser policy restrictions.",
    },
    {
      for: "hoveringTooltip",
      type: "checkbox",
      label: "Hovering tooltip",
      note: "Display map territory info constantly (on mouse hover) instead of only when right clicking on the map",
    },
    //{ for: "hideAllLinks", type: "checkbox", label: "Hide Links option also hides app store links" },
    { for: "realisticNames", type: "checkbox", label: "Realistic Bot Names" },
    {
      for: "showPlayerDensity",
      type: "checkbox",
      label: "Show player density",
    },
    {
      for: "coloredDensity",
      type: "checkbox",
      label: "Colored density",
      note: "Display the density with a color between red and green depending on the density value",
    },
    {
      for: "densityDisplayStyle",
      type: "selectMenu",
      label: "Density value display style:",
      tooltip: "Controls how the territorial density value should be rendered",
      options: [
        { value: "percentage", label: "Percentage" },
        {
          value: "absoluteQuotient",
          label: "Value from 0 to 150 (BetterTT style)",
        },
      ],
    },
    { for: "hideBotNames", type: "checkbox", label: "Hide bot names" },
    {
      for: "highlightClanSpawns",
      type: "checkbox",
      label: "Highlight clan spawnpoints",
      note: "Increases the spawnpoint glow size for members of your clan",
    },
    {
      for: "hidePropagandaPopup",
      type: "checkbox",
      label: "Hide propaganda popup"
    },
    {
      for: "detailedTeamPercentage", type: "checkbox",
      label: "Detailed team pie chart percentage",
      note: "For example: this would show 25.82% instead of 26% on the pie chart in team games"
    },
    {
      for: "openDonationHistoryFromLb",
      type: "checkbox",
      label: "Open donation history from the leaderboard",
      note: "Changes whether or not clicking on a player's name in the in-game leaderboard in team games will open their donation history",
    },
    {
      for: "customBackgroundUrl",
      type: "textInput",
      label: "Custom main menu background:",
      placeholder: "Enter an image URL here",
      tooltip:
        "A custom image to be shown as the main menu background instead of the currently selected map.",
    },
    KeybindsInput,
    {
      for: "keybindButtons", type: "checkbox",
      label: "Keybind buttons", note: "Show keybind buttons above the troop selector (max 6)"
    },
    {
      for: "showReplayTimebar",
      type: "checkbox",
      label: "Replay timebar",
      note: "Show a seek bar when watching replays, allowing you to skip to any point of the replay. Seeking backward re-simulates the replay from the start, which can take a few seconds.",
    },
    {
      for: "customEmojiBar",
      type: "checkbox",
      label: "Custom emoji bar",
      note: "Use a fixed set of favorite emojis for the first-click emoji bar instead of having the game constantly reorder it by usage. Choose the emojis below.",
    },
    EmojiBarEditor,
    ReplayHistoryList,
    // --- NEW UI TOGGLES ---
    {
      for: "optimizedSettings",
      type: "checkbox",
      label: "Optimized Settings",
      note: "Forces best settings: Very High resolution, Fast text rendering, Small font size. Uncheck to use Territorial.io defaults.",
    },
    {
      for: "showBoatPaths",
      type: "checkbox",
      label: "Show Boat Paths",
      note: "Draws lines showing boat routes. Green = Your boats, Red = Enemy boats, White = Others.",
    },
    function Footer(container) {
      const versionInfo = document.createElement("p");
      versionInfo.innerText = `FX Client v${versionData.version}`;
      const links = document.createElement("p");
      links.innerHTML = `<a href="https://discord.gg/dyxcwdNKwK" target="_blank">Discord server</a> |
        <a href="https://github.com/fxclient/FXclient#readme">Github repository</a>`;
      const changelogButton = document.createElement("button");
      changelogButton.innerText = "Changelog";
      changelogButton.addEventListener("click", displayChangelog);
      container.append(versionInfo, links, changelogButton);
    }
  ];
  const settingsContainer = document.querySelector(".settings .scrollable");
  var inputFields = {}; // (includes select menus)
  var checkboxFields = {};
  var customElements = [];
  settingsStructure.forEach((item) => {
    if (typeof item === "function") {
      const container = document.createElement("div");
      customElements.push(new item(container));
      return settingsContainer.append(container);
    }
    const label = document.createElement("label");
    if (item.tooltip) label.title = item.tooltip;
    const isValueInput = item.type.endsWith("Input");
    const element = document.createElement(
      isValueInput || item.type === "checkbox"
        ? "input"
        : item.type === "selectMenu"
        ? "select"
        : "button"
    );
    if (item.type === "textInput") element.type = "text";
    if (item.placeholder) element.placeholder = item.placeholder;
    if (isValueInput || item.type === "selectMenu")
      inputFields[item.for] = element;
    if (item.text) element.innerText = item.text;
    if (item.action) element.addEventListener("click", item.action);
    if (item.label) label.append(item.label + " ");
    if (item.note) {
      const note = document.createElement("small");
      note.innerText = item.note;
      label.append(document.createElement("br"), note);
    }
    if (item.options)
      item.options.forEach((option) => {
        const optionElement = document.createElement("option");
        optionElement.setAttribute("value", option.value);
        optionElement.innerText = option.label;
        element.append(optionElement);
      });
    label.append(element);
    if (item.type === "checkbox") {
      element.type = "checkbox";
      const checkmark = document.createElement("span");
      checkmark.className = "checkmark";
      label.className = "checkbox";
      label.append(checkmark);
      checkboxFields[item.for] = element;
    } else label.append(document.createElement("br"));
    settingsContainer.append(label, document.createElement("br"));
  });
  this.save = function () {
    Object.keys(inputFields).forEach(function (key) {
      settings[key] = inputFields[key].value.trim();
    });
    Object.keys(checkboxFields).forEach(function (key) {
      settings[key] = checkboxFields[key].checked;
    });
    this.applySettings();
    WindowManager.closeWindow("settings");
    discontinuedSettings.forEach((settingName) => delete settings[settingName]);
    localStorage.setItem("fx_settings", JSON.stringify(settings));
    window.location.reload();
  };

  const fileInput = document.createElement("input");
  fileInput.type = "file";
  function handleFileSelect(event) {
    const input = event.target;
    /** @type {File} */
    const selectedFile = input.files[0];
    if (!selectedFile) return;

    input.removeEventListener("change", handleFileSelect);
    input.value = "";
    if (!selectedFile.name.endsWith(".json"))
      return alert("Invalid file format");
    const fileReader = new FileReader();
    fileReader.onload = function () {
      let result;
      try {
        result = JSON.parse(fileReader.result);
        if (
          confirm(
            'Warning: This will override all current settings, click "OK" to confirm'
          )
        )
          __fx.settings = settings = result;
        localStorage.setItem("fx_settings", JSON.stringify(settings));
        window.location.reload();
      } catch (error) {
        alert("Error\n" + error);
      }
    };
    fileReader.readAsText(selectedFile);
  }
  this.importFromFile = function () {
    fileInput.click();
    fileInput.addEventListener("change", handleFileSelect);
  };
  this.exportToFile = function () {
    saveFile(
      JSON.stringify(settings),
      "FX_client_settings.json",
      "application/json"
    );
  };

  this.syncFields = function () {
    Object.keys(inputFields).forEach(function (key) {
      inputFields[key].value = settings[key];
    });
    Object.keys(checkboxFields).forEach(function (key) {
      checkboxFields[key].checked = settings[key];
    });
    customElements.forEach((element) => element.update?.(settings));
  };
  this.resetAll = function () {
    if (
      !confirm(
        "Are you Really SURE you want to RESET ALL SETTINGS back to the default?"
      )
    )
      return;
    localStorage.removeItem("fx_settings");
    window.location.reload();
  };
  this.applySettings = function () {
    if (settings.customBackgroundUrl !== "") {
      document.body.style.backgroundImage =
        "url(" + settings.customBackgroundUrl + ")";
      document.body.style.backgroundSize = "cover";
      document.body.style.backgroundPosition = "center";
    }
    __fx.makeMainMenuTransparent = settings.customBackgroundUrl !== "";
    
    this.applyCustomFeatures();
  };

  // --- NEW FUNCTION FOR FEATURE 1 & 2 ---
  this.applyCustomFeatures = function () {
    // Feature 1: Optimized Settings
    if (window.game && window.game.gfx) {
      if (settings.optimizedSettings) {
        window.game.gfx.resolution = 3;        // 3 = Very High
        window.game.gfx.textRenderingSpeed = 2; // 2 = Fast
        window.game.gfx.minimalFontSize = 1;    // 1 = Small
      } else {
        // Territorial.io Defaults
        window.game.gfx.resolution = 1;        // 1 = Medium
        window.game.gfx.textRenderingSpeed = 1; // 1 = Normal
        window.game.gfx.minimalFontSize = 2;    // 2 = Medium
      }
    }

    // Feature 2: Boat Paths
    if (window.boatPathTracker) {
      window.boatPathTracker.setEnabled(settings.showBoatPaths);
    }
  };

  if (settings.useFullscreenMode) tryEnterFullscreen();
})();

export function tryEnterFullscreen() {
  if (document.fullscreenElement !== null || !document.fullscreenEnabled) return
  document.documentElement
    .requestFullscreen({ navigationUI: "hide" })
    .then(() => console.log("Fullscreen mode activated"))
    .catch((error) => console.warn("Could not enter fullscreen mode:", error))
}

const openCustomBackgroundFilePicker = () => {
  const fileInput = document.getElementById("customBackgroundFileInput");
  fileInput.click();
  fileInput.addEventListener("change", handleFileSelect);
};
function handleFileSelect(event) {
  const fileInput = event.target;
  const selectedFile = fileInput.files[0];
  console.log(fileInput.files);
  console.log(fileInput.files[0]);
  if (selectedFile) {
    const fileUrl = URL.createObjectURL(selectedFile);
    console.log("File URL:", fileUrl);
    fileInput.value = "";
    fileInput.removeEventListener("change", handleFileSelect);
  }
}

WindowManager.add({
  name: "settings",
  element: document.querySelector(".settings"),
  beforeOpen: function () {
    settingsManager.syncFields();
  },
});

if (localStorage.getItem("fx_settings") !== null) {
  __fx.settings = settings = {
    ...settings,
    ...JSON.parse(localStorage.getItem("fx_settings")),
  };
}
settingsManager.applySettings();

// --- TOAST NOTIFICATION SYSTEM ---
function showToast(message) {
  let toast = document.getElementById('fx-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'fx-toast';
    toast.style.position = 'fixed';
    toast.style.top = '20px';
    toast.style.left = '50%';
    toast.style.transform = 'translateX(-50%)';
    toast.style.background = 'rgba(0, 0, 0, 0.8)';
    toast.style.color = '#fff';
    toast.style.padding = '10px 20px';
    toast.style.borderRadius = '5px';
    toast.style.zIndex = '10000';
    toast.style.fontSize = '14px';
    toast.style.fontFamily = 'sans-serif';
    toast.style.pointerEvents = 'none';
    toast.style.transition = 'opacity 0.3s';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.style.opacity = '1';
  clearTimeout(toast.timeoutId);
  toast.timeoutId = setTimeout(() => { toast.style.opacity = '0'; }, 1500);
}

// --- KEYBOARD SHORTCUTS (Desktop) ---
document.addEventListener('keydown', function(event) {
  if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') return;

  // Shift + O: Toggle Optimized Settings
  if (event.shiftKey && event.key.toLowerCase() === 'o') {
    settings.optimizedSettings = !settings.optimizedSettings;
    settingsManager.applySettings();
    localStorage.setItem("fx_settings", JSON.stringify(settings));
    showToast(`Optimized Settings: ${settings.optimizedSettings ? 'ON' : 'OFF'}`);
    if (window.updateQuickToggleUI) window.updateQuickToggleUI();
  }

  // Shift + B: Toggle Boat Paths
  if (event.shiftKey && event.key.toLowerCase() === 'b') {
    settings.showBoatPaths = !settings.showBoatPaths;
    settingsManager.applySettings();
    localStorage.setItem("fx_settings", JSON.stringify(settings));
    showToast(`Boat Paths: ${settings.showBoatPaths ? 'ON' : 'OFF'}`);
    if (window.updateQuickToggleUI) window.updateQuickToggleUI();
  }
});

// --- INITIALIZE MOBILE UI ---
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initQuickToggles);
} else {
  initQuickToggles();
}

export default settingsManager;
export function getSettings() {
  return settings;
}
