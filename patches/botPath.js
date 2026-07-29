import { boatPathTracker } from '../src/boatPathTracker.js';

export function initBoatPathPatches() {
  // Wait for the Game class to be available on the window object
  const checkInterval = setInterval(() => {
    if (window.Game && window.Game.prototype) {
      clearInterval(checkInterval);
      applyPatches();
    }
  }, 100);
}

function applyPatches() {
  // 1. Hook into the Game's Update Loop
  const originalUpdate = window.Game.prototype.update;
  window.Game.prototype.update = function(...args) {
    originalUpdate.apply(this, args);
    
    if (this.boats) {
      boatPathTracker.update(this.boats);
    }
    if (!boatPathTracker.playerId && this.playerId) {
      boatPathTracker.setPlayerId(this.playerId);
    }
  };

  // 2. Hook into the Game's Render Loop
  const originalRender = window.Game.prototype.render;
  window.Game.prototype.render = function(ctx, ...args) {
    originalRender.apply(this, [ctx, ...args]);
    
    // Draw boat paths on top of everything
    if (boatPathTracker && boatPathTracker.enabled) {
      boatPathTracker.render(ctx);
    }
  };

  // 3. Clear paths when a new game starts/restarts
  // We hook into the function that handles joining/resetting the game
  const originalJoinGame = window.Game.prototype.joinGame || window.Game.prototype.startGame;
  if (originalJoinGame) {
    window.Game.prototype.joinGame = function(...args) {
      boatPathTracker.clearPaths();
      return originalJoinGame.apply(this, args);
    };
  }
}
