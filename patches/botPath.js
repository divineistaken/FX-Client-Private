// patches/boatPaths.js

class BoatPathTracker {
  constructor() {
    this.boatPaths = new Map();
    this.maxPathLength = 30; 
    this.updateInterval = 5; 
    this.frameCounter = 0;
    this.enabled = true;
    this.playerId = null;
  }

  setPlayerId(id) { this.playerId = id; }
  setEnabled(enabled) {
    this.enabled = enabled;
    if (!enabled) this.clearPaths();
  }
  clearPaths() { this.boatPaths.clear(); }

  update(boats) {
    if (!this.enabled || !boats) return;
    this.frameCounter++;
    if (this.frameCounter % this.updateInterval !== 0) return;

    const activeIds = new Set();
    for (const boat of boats) {
      if (boat.id === undefined || boat.x === undefined || boat.y === undefined) continue;
      activeIds.add(boat.id);

      if (!this.boatPaths.has(boat.id)) {
        const isPlayer = (boat.ownerId === this.playerId);
        const isEnemy = !isPlayer && boat.isEnemy; 
        this.boatPaths.set(boat.id, { points: [], isPlayer, isEnemy });
      }

      const pathData = this.boatPaths.get(boat.id);
      pathData.points.push({ x: boat.x, y: boat.y });
      if (pathData.points.length > this.maxPathLength) pathData.points.shift();
    }

    for (const id of this.boatPaths.keys()) {
      if (!activeIds.has(id)) this.boatPaths.delete(id);
    }
  }

  render(ctx) {
    if (!this.enabled) return;
    ctx.save();
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);

    for (const [boatId, pathData] of this.boatPaths) {
      if (pathData.points.length < 2) continue;

      if (pathData.isPlayer) ctx.strokeStyle = 'rgba(76, 175, 80, 0.7)'; // Green
      else if (pathData.isEnemy) ctx.strokeStyle = 'rgba(244, 67, 54, 0.7)'; // Red
      else ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)'; // White

      ctx.beginPath();
      ctx.moveTo(pathData.points[0].x, pathData.points[0].y);
      for (let i = 1; i < pathData.points.length; i++) {
        ctx.lineTo(pathData.points[i].x, pathData.points[i].y);
      }
      ctx.stroke();
    }
    ctx.restore();
  }
}

// Put it on the window object so settings.js can find it
const boatPathTracker = new BoatPathTracker();
window.boatPathTracker = boatPathTracker;

// Self-executing function to hook into the game safely
function applyBoatPathHooks() {
  if (window.Game && window.Game.prototype) {
    // 1. Hook Update
    const originalUpdate = window.Game.prototype.update;
    window.Game.prototype.update = function(...args) {
      originalUpdate.apply(this, args);
      if (this.boats) boatPathTracker.update(this.boats);
      if (!boatPathTracker.playerId && this.playerId) boatPathTracker.setPlayerId(this.playerId);
    };

    // 2. Hook Render
    const originalRender = window.Game.prototype.render;
    window.Game.prototype.render = function(ctx, ...args) {
      originalRender.apply(this, [ctx, ...args]);
      if (boatPathTracker.enabled) boatPathTracker.render(ctx);
    };

    // 3. Clear on Game Start/Reset
    const originalStart = window.Game.prototype.startGame || window.Game.prototype.reset;
    if (originalStart) {
      window.Game.prototype.startGame = function(...args) {
        boatPathTracker.clearPaths();
        return originalStart.apply(this, args);
      };
    }
  } else {
    setTimeout(applyBoatPathHooks, 100); // Wait for game to load
  }
}
applyBoatPathHooks();
