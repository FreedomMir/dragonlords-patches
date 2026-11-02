//=============================================================================
// DL_DragonBond.js
//=============================================================================
/*:
 * @plugindesc v1.0 Dragon Bonds: every freed Dragon Lord becomes a summon one
 * of the heroes can call once per battle.
 * @author Dragon Lords
 *
 * @help
 * Skills with <DragonBond: Name> in their note can be used once per battle.
 * When one is used, the dragon appears on screen (the "Dragon" picture,
 * tinted per dragon) before the skill takes effect.
 *
 * Each bond is learned automatically once its story switch is on (see BONDS
 * below), so older saves get their bonds too.
 */

var Imported = Imported || {};
Imported.DL_DragonBond = true;

(function() {
  'use strict';

  // Who learns which summon, and when.
  var BONDS = [
    { name: 'Ysmera', actor: 1, skill: 52, sw: 16, tone: [80, 40, -50, 0], line: 'The Dawn Hearth answers!' },
    { name: 'Nyxara', actor: 3, skill: 53, sw: 32, tone: [-70, -90, 50, 0], line: 'The Veiled Night falls!' },
    { name: 'Korrath', actor: 4, skill: 54, sw: 93, tone: [20, 0, -70, 60], line: 'The Stone Warden rises!' },
    { name: 'Aerielle', actor: 2, skill: 55, sw: 149, tone: [-60, 20, 90, 0], line: 'The Storm Crown descends!' }
  ];
  var bondFor = function(skillId) {
    for (var i = 0; i < BONDS.length; i++) if (BONDS[i].skill === skillId) return BONDS[i];
    return null;
  };
  var isBond = function(item) { return item && DataManager.isSkill(item) && !!item.meta.DragonBond; };

  //---------------------------------------------------------------------------
  // Learning bonds
  //---------------------------------------------------------------------------
  var pending = [];
  var syncBonds = function() {
    BONDS.forEach(function(b) {
      var actor = $gameActors.actor(b.actor);
      if (actor && $gameSwitches.value(b.sw) && !actor.isLearnedSkill(b.skill)) {
        actor.learnSkill(b.skill);
        pending.push(b);
      }
    });
  };

  var _Scene_Map_update = Scene_Map.prototype.update;
  Scene_Map.prototype.update = function() {
    _Scene_Map_update.call(this);
    if (Graphics.frameCount % 30 === 0) syncBonds();
    if (pending.length && !$gameMap.isEventRunning() && !$gameMessage.isBusy() && this.isActive()) {
      var b = pending.shift(), actor = $gameActors.actor(b.actor);
      AudioManager.playSe({ name: 'Saint3', volume: 90, pitch: 100, pan: 0 });
      $gameMessage.add('\\C[17]Dragon Bond formed!\\C[0]');
      $gameMessage.add((actor ? actor.name() : 'A hero') + ' can now call on \\C[17]' + b.name + '\\C[0] once per battle.');
      $gameMessage.add('(Find it under "Dragon Bond" in battle.)');
    }
  };

  //---------------------------------------------------------------------------
  // Once per battle
  //---------------------------------------------------------------------------
  var _Game_Battler_onBattleStart = Game_Battler.prototype.onBattleStart;
  Game_Battler.prototype.onBattleStart = function() {
    _Game_Battler_onBattleStart.call(this);
    this._dlBondsUsed = {};
  };

  var _meetsSkillConditions = Game_BattlerBase.prototype.meetsSkillConditions;
  Game_BattlerBase.prototype.meetsSkillConditions = function(skill) {
    if (isBond(skill) && (!$gameParty.inBattle() || (this._dlBondsUsed && this._dlBondsUsed[skill.id]))) return false;
    return _meetsSkillConditions.call(this, skill);
  };

  var _Game_Battler_useItem = Game_Battler.prototype.useItem;
  Game_Battler.prototype.useItem = function(item) {
    _Game_Battler_useItem.call(this, item);
    if (isBond(item) && $gameParty.inBattle()) {
      this._dlBondsUsed = this._dlBondsUsed || {};
      this._dlBondsUsed[item.id] = true;
      BattleManager._dlSummon = bondFor(item.id) || { name: item.meta.DragonBond, tone: [0, 0, 0, 0], line: '' };
    }
  };

  //---------------------------------------------------------------------------
  // The summon on screen
  //---------------------------------------------------------------------------
  function Sprite_DragonSummon() {
    Sprite.call(this, ImageManager.loadPicture('Dragon'));
    this.anchor.x = 0.5;
    this.anchor.y = 0.5;
    this.x = Graphics.boxWidth / 2;
    this.y = Graphics.boxHeight / 2 - 40;
    this.opacity = 0;
    this._timer = 0;
    this._text = new Sprite(new Bitmap(Graphics.boxWidth, 60));
    this._text.anchor.x = 0.5;
    this._text.y = -230; // above the dragon, clear of the status window
    this.addChild(this._text);
  }
  Sprite_DragonSummon.prototype = Object.create(Sprite.prototype);
  Sprite_DragonSummon.prototype.constructor = Sprite_DragonSummon;
  Sprite_DragonSummon.prototype.isBusy = function() { return this._timer > 0; };
  Sprite_DragonSummon.prototype.start = function(bond) {
    this.setColorTone(bond.tone);
    this._timer = 110;
    this.scale.x = this.scale.y = 0.8;
    var b = this._text.bitmap;
    b.clear(); b.fontSize = 34; b.outlineWidth = 6; b.textColor = '#ffdd88';
    b.drawText(bond.name.toUpperCase() + '!', 0, 0, b.width, 36, 'center');
    b.fontSize = 20; b.textColor = '#ffffff';
    b.drawText(bond.line || '', 0, 34, b.width, 26, 'center');
    AudioManager.playSe({ name: 'Monster4', volume: 90, pitch: 80, pan: 0 });
    $gameScreen.startFlash([255, 238, 170, 200], 30);
    $gameScreen.startShake(6, 7, 40);
  };
  Sprite_DragonSummon.prototype.update = function() {
    Sprite.prototype.update.call(this);
    if (BattleManager._dlSummon) { this.start(BattleManager._dlSummon); BattleManager._dlSummon = null; }
    if (this._timer <= 0) { this.opacity = 0; return; }
    this._timer--;
    var t = 110 - this._timer;
    this.opacity = t < 25 ? t * 10 : this._timer < 25 ? this._timer * 10 : 255;
    this.scale.x = this.scale.y = 0.8 + Math.min(t, 40) * 0.006;
  };

  var _Scene_Battle_createDisplayObjects = Scene_Battle.prototype.createDisplayObjects;
  Scene_Battle.prototype.createDisplayObjects = function() {
    _Scene_Battle_createDisplayObjects.call(this);
    this._dlSummonSprite = new Sprite_DragonSummon();
    this.addChild(this._dlSummonSprite);
  };

  // Hold the battle while the dragon is on screen.
  var _BattleManager_isBusy = BattleManager.isBusy;
  BattleManager.isBusy = function() {
    var scene = SceneManager._scene;
    if (scene && scene._dlSummonSprite && (scene._dlSummonSprite.isBusy() || this._dlSummon)) return true;
    return _BattleManager_isBusy.call(this);
  };

  window.DLBonds = { BONDS: BONDS, sync: syncBonds };
})();
