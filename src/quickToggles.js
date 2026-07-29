import settingsManager, { getSettings } from './settings.js';

export function initQuickToggles() {
  const container = document.createElement('div');
  container.id = 'fx-quick-toggles';
  container.style.position = 'fixed';
  container.style.bottom = '80px'; 
  container.style.right = '10px';
  container.style.zIndex = '1000';
  container.style.display = 'flex';
  container.style.flexDirection = 'column';
  container.style.gap = '10px';

  const btnOpt = document.createElement('button');
  btnOpt.innerHTML = '⚙️';
  btnOpt.title = 'Toggle Optimized Settings (Shift+O)';
  styleButton(btnOpt);
  btnOpt.addEventListener('click', () => {
    const s = getSettings();
    s.optimizedSettings = !s.optimizedSettings;
    settingsManager.applySettings();
    localStorage.setItem("fx_settings", JSON.stringify(s));
    window.updateQuickToggleUI();
  });

  const btnBoat = document.createElement('button');
  btnBoat.innerHTML = '🚢';
  btnBoat.title = 'Toggle Boat Paths (Shift+B)';
  styleButton(btnBoat);
  btnBoat.addEventListener('click', () => {
    const s = getSettings();
    s.showBoatPaths = !s.showBoatPaths;
    settingsManager.applySettings();
    localStorage.setItem("fx_settings", JSON.stringify(s));
    window.updateQuickToggleUI();
  });

  container.append(btnOpt, btnBoat);
  document.body.append(container);

  window.updateQuickToggleUI = function() {
    const s = getSettings();
    btnOpt.style.opacity = s.optimizedSettings ? '1' : '0.4';
    btnBoat.style.opacity = s.showBoatPaths ? '1' : '0.4';
  };
  setTimeout(window.updateQuickToggleUI, 500);
}

function styleButton(btn) {
  btn.style.fontSize = '20px';
  btn.style.padding = '10px';
  btn.style.background = 'rgba(0, 0, 0, 0.6)';
  btn.style.border = '1px solid #444';
  btn.style.borderRadius = '8px';
  btn.style.cursor = 'pointer';
  btn.style.color = 'white';
  btn.style.width = '44px';
  btn.style.height = '44px';
  btn.style.display = 'flex';
  btn.style.alignItems = 'center';
  btn.style.justifyContent = 'center';
  btn.style.backdropFilter = 'blur(2px)';
}
