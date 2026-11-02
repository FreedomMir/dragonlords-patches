//=============================================================================
// DL_Extras.js
//=============================================================================
/*:
 * @plugindesc v1.0 Dragon Lords extras: fishing minigame, waystone fast
 * travel, and rare-drop fanfare.
 * @author Dragon Lords
 *
 * @param Rod Item
 * @type item
 * @desc Key item needed to fish.
 * @default 20
 *
 * @param Fish Caught Variable
 * @type variable
 * @desc Total fish caught.
 * @default 14
 *
 * @param Species Variable
 * @type variable
 * @desc Number of different fish species caught.
 * @default 16
 *
 * @help
 * ============================================================================
 * Fishing
 * ============================================================================
 * Plugin command:  Fish river      (tables: river, marsh, canal, mountain)
 *
 * Cast, wait for the bite, and press OK the moment the bobber dips. Then
 * press OK each time the marker is inside the green zone: three good reels
 * land the fish, three misses and it escapes. Rare fish have smaller zones
 * and faster markers. Needs the Fishing Rod item.
 *
 * ============================================================================
 * Waystones
 * ============================================================================
 * Plugin command:  Waystone        (opens the travel menu)
 * Each waystone unlocks when its story switch is on (see WAYSTONES below).
 *
 * ============================================================================
 * Rare drops
 * ============================================================================
 * Items, weapons and armour with <Rare> in their note play a fanfare when
 * dropped and are announced in the multiplayer chat. Enemies with <Gilded>
 * in their note flash in gold when the battle starts.
 */

var Imported = Imported || {};
Imported.DL_Extras = true;

(function() {
  'use strict';
  var params = PluginManager.parameters('DL_Extras');
  var ROD = Number(params['Rod Item'] || 20);
  var VAR_CAUGHT = Number(params['Fish Caught Variable'] || 14);
  var VAR_SPECIES = Number(params['Species Variable'] || 16);

  //---------------------------------------------------------------------------
  // Data
  //---------------------------------------------------------------------------
  // [item id, weight, difficulty 1-5]
  var FISH = {
    river:    [[12, 40, 1], [13, 30, 2], [15, 12, 3], [18, 10, 1], [17, 6, 4], [19, 1, 5]],
    marsh:    [[12, 25, 1], [14, 35, 2], [16, 10, 4], [18, 15, 1], [19, 1, 5]],
    canal:    [[12, 35, 1], [13, 25, 2], [15, 18, 3], [18, 15, 1], [17, 6, 4], [19, 1, 5]],
    mountain: [[13, 30, 2], [15, 25, 3], [16, 12, 4], [17, 10, 4], [19, 2, 5]]
  };
  // Destinations: name, story switch that unlocks it, map and arrival tile.
  var WAYSTONES = [
    { name: 'Hollowmere', sw: 12, map: 10, x: 19, y: 22, d: 2 },
    { name: 'Duskwater', sw: 24, map: 15, x: 23, y: 29, d: 2 },
    { name: 'Caldrith', sw: 53, map: 21, x: 23, y: 31, d: 2 },
    { name: 'Stoneheart Hold', sw: 82, map: 26, x: 19, y: 22, d: 2 },
    { name: 'Galeward', sw: 141, map: 32, x: 30, y: 10, d: 2 }
  ];

  //---------------------------------------------------------------------------
  // Waystones
  //---------------------------------------------------------------------------
  var openWaystone = function() {
    var here = $gameMap.mapId();
    var list = WAYSTONES.filter(function(w) { return $gameSwitches.value(w.sw) && w.map !== here; });
    if (!list.length) {
      $gameMessage.add('The waystone hums, but it has nowhere else to send you yet.');
      return;
    }
    $gameMessage.add('The waystone glows. Where do you want to go?');
    $gameMessage.setChoices(list.map(function(w) { return w.name; }).concat(['Stay here']), 0, list.length);
    $gameMessage.setChoiceCallback(function(n) {
      var w = list[n];
      if (!w) return;
      AudioManager.playSe({ name: 'Teleport', volume: 90, pitch: 100, pan: 0 });
      $gamePlayer.reserveTransfer(w.map, w.x, w.y, w.d, 0);
    });
  };

  //---------------------------------------------------------------------------
  // Fishing
  //---------------------------------------------------------------------------
  var pickFish = function(table) {
    var list = FISH[table] || FISH.river, total = 0;
    list.forEach(function(f) { total += f[1]; });
    var r = Math.random() * total;
    for (var i = 0; i < list.length; i++) { r -= list[i][1]; if (r < 0) return list[i]; }
    return list[0];
  };

  function Sprite_Fishing(table) {
    Sprite.call(this, new Bitmap(420, 130));
    this.anchor.x = 0.5;
    this.x = Graphics.boxWidth / 2;
    this.y = Graphics.boxHeight - 190;
    this._fish = pickFish(table);
    this._phase = 'wait';
    this._timer = 60 + Math.floor(Math.random() * 150);
    this._pos = 0; this._dir = 1;
    this._hits = 0; this._misses = 0;
    var diff = this._fish[2];
    this._speed = 0.008 + diff * 0.004;
    this._zone = 0.30 - diff * 0.04;
    this._zoneAt = 0.2 + Math.random() * (0.8 - this._zone - 0.2);
    this.result = null;
    this.refresh();
  }
  Sprite_Fishing.prototype = Object.create(Sprite.prototype);
  Sprite_Fishing.prototype.constructor = Sprite_Fishing;

  Sprite_Fishing.prototype.refresh = function() {
    var b = this.bitmap, w = b.width;
    b.clear();
    b.fillRect(0, 0, w, b.height, 'rgba(10,20,40,0.82)');
    b.fillRect(0, 0, w, 2, '#c9a35c'); b.fillRect(0, b.height - 2, w, 2, '#c9a35c');
    b.fontSize = 22; b.outlineWidth = 4;
    if (this._phase === 'wait') {
      b.drawText('Waiting for a bite' + '...'.slice(0, 1 + Math.floor(Graphics.frameCount / 20) % 3), 0, 14, w, 30, 'center');
      b.fontSize = 16; b.textColor = '#aaccff';
      b.drawText('Press OK the moment the bobber dips!', 0, 52, w, 24, 'center');
    } else if (this._phase === 'bite') {
      b.textColor = '#ffdd55';
      b.drawText('! ! !   BITE!   ! ! !', 0, 14, w, 30, 'center');
      b.fontSize = 16; b.textColor = '#ffffff';
      b.drawText('Press OK now!', 0, 52, w, 24, 'center');
    } else if (this._phase === 'reel') {
      b.drawText('Reel it in!', 0, 6, w, 28, 'center');
      var bx = 20, bw = w - 40, by = 46;
      b.fillRect(bx, by, bw, 26, 'rgba(0,0,0,0.6)');
      b.fillRect(bx + Math.floor(bw * this._zoneAt), by, Math.floor(bw * this._zone), 26, '#3fbf5f');
      b.fillRect(bx + Math.floor(bw * this._pos) - 3, by - 6, 6, 38, '#ffffff');
      b.fontSize = 18;
      var dots = '';
      for (var i = 0; i < 3; i++) dots += i < this._hits ? '● ' : '○ ';
      b.textColor = '#88ff88'; b.drawText('Reels: ' + dots, 20, 84, 200, 26);
      var xs = '';
      for (var j = 0; j < 3; j++) xs += j < this._misses ? 'X ' : '- ';
      b.textColor = '#ff8888'; b.drawText('Misses: ' + xs, 220, 84, 180, 26, 'right');
    }
    b.textColor = '#ffffff';
  };

  Sprite_Fishing.prototype.update = function() {
    Sprite.prototype.update.call(this);
    if (this.result) return;
    var ok = Input.isTriggered('ok') || TouchInput.isTriggered();
    if (this._phase === 'wait') {
      if (ok) { this.finish('early'); return; }
      if (--this._timer <= 0) {
        this._phase = 'bite'; this._timer = 55 - this._fish[2] * 5;
        AudioManager.playSe({ name: 'Water1', volume: 90, pitch: 120, pan: 0 });
      }
      if (Graphics.frameCount % 20 === 0) this.refresh();
      return;
    }
    if (this._phase === 'bite') {
      if (ok) { this._phase = 'reel'; SoundManager.playOk(); this.refresh(); return; }
      if (--this._timer <= 0) this.finish('slow');
      return;
    }
    // reel: the marker sweeps back and forth
    this._pos += this._speed * this._dir;
    if (this._pos >= 1) { this._pos = 1; this._dir = -1; }
    if (this._pos <= 0) { this._pos = 0; this._dir = 1; }
    if (ok) {
      if (this._pos >= this._zoneAt && this._pos <= this._zoneAt + this._zone) {
        this._hits++;
        AudioManager.playSe({ name: 'Water2', volume: 80, pitch: 100 + this._hits * 10, pan: 0 });
        this._zoneAt = 0.05 + Math.random() * (0.9 - this._zone);
        if (this._hits >= 3) { this.finish('caught'); return; }
      } else {
        this._misses++;
        SoundManager.playBuzzer();
        if (this._misses >= 3) { this.finish('escaped'); return; }
      }
    }
    this.refresh();
  };

  Sprite_Fishing.prototype.finish = function(how) {
    this.result = how;
    this.visible = false;
    var item = $dataItems[this._fish[0]];
    if (how === 'caught' && item) {
      $gameParty.gainItem(item, 1);
      AudioManager.playMe({ name: 'Item', volume: 90, pitch: 100, pan: 0 });
      var log = $gameSystem._dlFish = $gameSystem._dlFish || {};
      log[item.id] = (log[item.id] || 0) + 1;
      $gameVariables.setValue(VAR_CAUGHT, $gameVariables.value(VAR_CAUGHT) + 1);
      $gameVariables.setValue(VAR_SPECIES, Object.keys(log).length);
      var rare = this._fish[2] >= 4;
      $gameMessage.add((rare ? '\\C[17]Rare catch!\\C[0] ' : '') + 'You caught \\C[3]' + item.name + '\\C[0]!');
      if (rare && window.DLMP && DLMP.isOnline()) DLMP.send({ t: 'chat', text: 'caught a rare ' + item.name + '!' });
    } else if (how === 'early') {
      $gameMessage.add('You yanked the line too soon. The fish scattered.');
    } else if (how === 'slow') {
      $gameMessage.add('Too slow! The fish stole the bait.');
    } else {
      $gameMessage.add('Snap! The fish got away...');
    }
  };

  var startFishing = function(interpreter, table) {
    if (!$gameParty.hasItem($dataItems[ROD])) {
      $gameMessage.add('Fish are jumping here. If only you had a fishing rod...');
      return;
    }
    var scene = SceneManager._scene;
    if (!(scene instanceof Scene_Map)) return;
    AudioManager.playSe({ name: 'Water3', volume: 70, pitch: 110, pan: 0 });
    var sprite = new Sprite_Fishing(table);
    scene.addChild(sprite);
    interpreter._dlFishing = sprite;
    interpreter.setWaitMode('dlFishing');
  };

  var _Game_Interpreter_updateWaitMode = Game_Interpreter.prototype.updateWaitMode;
  Game_Interpreter.prototype.updateWaitMode = function() {
    if (this._waitMode !== 'dlFishing') return _Game_Interpreter_updateWaitMode.call(this);
    var s = this._dlFishing;
    if (s && !s.result) return true;
    if (s && s.parent) s.parent.removeChild(s);
    this._dlFishing = null;
    this._waitMode = '';
    return false;
  };

  //---------------------------------------------------------------------------
  // Rare drops and gilded monsters
  //---------------------------------------------------------------------------
  var _BattleManager_gainDropItems = BattleManager.gainDropItems;
  BattleManager.gainDropItems = function() {
    _BattleManager_gainDropItems.call(this);
    this._rewards.items.forEach(function(item) {
      if (!item || !item.meta || !item.meta.Rare) return;
      AudioManager.playSe({ name: 'Saint3', volume: 90, pitch: 110, pan: 0 });
      if (window.DLMP) {
        DLMP.addChat('★ Rare drop: ' + item.name + '!', '#ffcc33');
        if (DLMP.isOnline()) DLMP.send({ t: 'chat', text: 'found a rare ' + item.name + '!' });
      }
    });
  };

  var _BattleManager_startBattle = BattleManager.startBattle;
  BattleManager.startBattle = function() {
    _BattleManager_startBattle.call(this);
    var gilded = $gameTroop.members().some(function(e) { return e.enemy().meta.Gilded; });
    if (gilded) {
      AudioManager.playSe({ name: 'Saint3', volume: 90, pitch: 130, pan: 0 });
      $gameScreen.startFlash([255, 221, 85, 170], 40);
    }
  };

  //---------------------------------------------------------------------------
  // Plugin commands
  //---------------------------------------------------------------------------
  var _Game_Interpreter_pluginCommand = Game_Interpreter.prototype.pluginCommand;
  Game_Interpreter.prototype.pluginCommand = function(command, args) {
    _Game_Interpreter_pluginCommand.call(this, command, args);
    var c = command.toUpperCase();
    if (c === 'FISH') startFishing(this, String(args[0] || 'river').toLowerCase());
    else if (c === 'WAYSTONE') openWaystone();
  };

  window.DLExtras = { FISH: FISH, WAYSTONES: WAYSTONES };
})();
