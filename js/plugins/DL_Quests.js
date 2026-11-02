//=============================================================================
// DL_Quests.js
//=============================================================================
/*:
 * @plugindesc v1.0 Keeps the Quest Journal in step with the story switches.
 * Place below YEP_QuestJournal and YEP_X_MapQuestWindow.
 * @author Dragon Lords
 *
 * @help
 * Each quest below lists conditions (switches, variables, items) for when
 * it starts, when each objective appears and is done, and when the quest
 * is complete. The journal is updated on every map, so saves made before
 * the quest book existed fill in automatically.
 *
 * The table is generated from tools/quests.js by tools/install_plugins.js.
 * Edit quests there, then re-run the installer.
 */

var Imported = Imported || {};
Imported.DL_Quests = true;

(function() {
  'use strict';
  if (!Imported.YEP_QuestJournal) return;

  // <quest-table>
  var QUESTS = [{"id":1,"start":"s(1)","done":"s(9)","objectives":[{"show":"","done":"s(2)"},{"show":"s(2)","done":"s(3)"},{"show":"s(3)","done":"s(4) && s(5) && s(6)"},{"show":"s(7)","done":"s(8)"},{"show":"s(8)","done":"s(9)"}]},{"id":2,"start":"s(9)","done":"s(15)","objectives":[{"show":"","done":"s(12)"},{"show":"s(12)","done":"s(13)"},{"show":"s(13)","done":"s(16)"},{"show":"s(16)","done":"s(15)"}]},{"id":3,"start":"s(21)","done":"s(33)","objectives":[{"show":"","done":"s(24)"},{"show":"s(24)","done":"s(25)"},{"show":"s(25)","done":"s(26)"},{"show":"s(26)","done":"s(27)"},{"show":"s(27)","done":"s(28) && s(29) && s(30)"},{"show":"s(28) && s(29) && s(30)","done":"s(32)"}]},{"id":4,"start":"s(33)","done":"s(65)","objectives":[{"show":"","done":"s(50)"},{"show":"s(50)","done":"s(51)"},{"show":"s(51)","done":"s(54)"},{"show":"s(54)","done":"s(55)"},{"show":"s(55)","done":"s(61)"},{"show":"s(61)","done":"s(64)"}]},{"id":5,"start":"s(42) || s(18)","done":"s(19)","objectives":[{"show":"","done":"s(18)"},{"show":"s(18)","done":"s(19)"}]},{"id":6,"start":"s(43)","done":"s(66)","objectives":[{"show":"","done":"s(60)"},{"show":"s(60)","done":"s(66)"}]},{"id":7,"start":"s(34)","done":"s(35)","objectives":[{"show":"","done":"v(11) >= 3"},{"show":"v(11) >= 3","done":"s(35)"}]},{"id":8,"start":"s(36)","done":"s(38)","objectives":[{"show":"","done":"s(37)"},{"show":"s(37)","done":"s(38)"}]},{"id":9,"start":"s(39)","done":"s(41)","objectives":[{"show":"","done":"s(40)"},{"show":"s(40)","done":"s(41)"}]},{"id":10,"start":"s(44)","done":"s(46)","objectives":[{"show":"","done":"s(45)"},{"show":"s(45)","done":"s(46)"}]},{"id":11,"start":"s(80)","done":"s(94)","objectives":[{"show":"","done":"s(82)"},{"show":"s(82)","done":"s(83)"},{"show":"s(83)","done":"s(90)"},{"show":"s(90)","done":"s(91)"},{"show":"s(91)","done":"s(93)"}]},{"id":12,"start":"s(94)","done":"s(150)","objectives":[{"show":"","done":"s(141)"},{"show":"s(141)","done":"s(143)"},{"show":"s(143)","done":"s(148)"},{"show":"s(148)","done":"s(149)"}]},{"id":13,"start":"s(83)","done":"s(87)","objectives":[{"show":"","done":"v(18) >= 3"},{"show":"v(18) >= 3","done":"s(87)"}]},{"id":14,"start":"s(114)","done":"s(115)","objectives":[{"show":"","done":"v(16) >= 5"},{"show":"v(16) >= 5","done":"s(115)"}]},{"id":15,"start":"s(109)","done":"s(111)","objectives":[{"show":"","done":"v(13) >= 8"},{"show":"","done":"s(110)"},{"show":"","done":"s(111)"}]},{"id":16,"start":"s(109) && s(114)","done":"s(113)","objectives":[{"show":"","done":"i(19) >= 1 || s(113)"},{"show":"i(19) >= 1 || s(113)","done":"s(113)"}]},{"id":17,"start":"s(116)","done":"s(70)","objectives":[{"show":"","done":"s(68)"},{"show":"s(68)","done":"s(69)"},{"show":"s(69)","done":"s(70)"}]},{"id":18,"start":"s(44)","done":"s(124)","objectives":[{"show":"","done":"s(121)"},{"show":"s(121)","done":"s(122)"},{"show":"s(122)","done":"s(124)"}]},{"id":19,"start":"s(16)","done":"s(149)","objectives":[{"show":"","done":"s(16)"},{"show":"s(16)","done":"s(32)"},{"show":"s(32)","done":"s(93)"},{"show":"s(93)","done":"s(149)"}]},{"id":20,"start":"s(15)","done":"window.DLSubclass && DLSubclass.maxRank() >= 5","objectives":[{"show":"","done":"s(130)"},{"show":"s(130)","done":"window.DLSubclass && DLSubclass.maxRank() >= 1"},{"show":"s(130)","done":"window.DLSubclass && DLSubclass.maxRank() >= 5"}]},{"id":21,"start":"s(150)","done":"","objectives":[{"show":"","done":""}]},{"id":22,"start":"s(151)","done":"s(152)","objectives":[{"show":"","done":"v(31) >= 3"},{"show":"v(31) >= 3","done":"s(152)"}]}];
  // </quest-table>

  var s = function(id) { return $gameSwitches.value(id); };
  var v = function(id) { return $gameVariables.value(id); };
  var i = function(id) { return $gameParty.numItems($dataItems[id]); };
  var compile = function(cond) {
    if (!cond) return null;
    return new Function('s', 'v', 'i', 'return !!(' + cond + ');');
  };
  QUESTS.forEach(function(q) {
    q.startFn = compile(q.start);
    q.doneFn = compile(q.done);
    q.objectives.forEach(function(o) { o.showFn = compile(o.show); o.doneFn = compile(o.done); });
  });
  var test = function(fn) { return !!fn && fn(s, v, i); };

  window.DLQuests = {
    quests: QUESTS,
    sync: function() {
      var sys = $gameSystem;
      sys.initQuestSettings();
      QUESTS.forEach(function(q) {
        if (sys._questsKnown.indexOf(q.id) < 0) {
          if (!test(q.startFn)) return;
          sys.questAdd(q.id);
        }
        q.objectives.forEach(function(o, index) {
          var n = index + 1;
          if (o.showFn && test(o.showFn) && sys.getQuestObjectives(q.id).indexOf(n) < 0) sys.questObjectivesShow(q.id, n);
          if (test(o.doneFn) && (sys._questsObjectivesCompleted[q.id] || []).indexOf(n) < 0) sys.questObjectivesComplete(q.id, n);
        });
        if (test(q.doneFn) && sys._questsCompleted.indexOf(q.id) < 0) {
          sys.questObjectivesShowAll(q.id);
          sys.questObjectivesCompleteAll(q.id);
          sys.questSetCompleted(q.id);
          sys.questRewardsClaimAll(q.id);
        }
      });
      // Track the current main quest on the map unless the player picked one.
      // A side quest we picked only because no main quest was open gives way to the next main quest.
      if (sys.getActiveQuestId && sys.setActiveQuestId) {
        var active = sys.getActiveQuestId();
        var open = sys.getQuestsAvailable();
        var main = open.filter(function(id) { return $dataQuests[id] && $dataQuests[id].type === 'Main Quests'; })[0];
        var invalid = !active || sys._questsCompleted.indexOf(active) >= 0 || sys._questsKnown.indexOf(active) < 0;
        var autoSide = active && active === sys._dlAutoActive && main && $dataQuests[active] && $dataQuests[active].type !== 'Main Quests';
        if (invalid || autoSide) {
          var next = main || open[0] || 0;
          if (next !== active) sys.setActiveQuestId(next);
          sys._dlAutoActive = next;
        }
      }
    }
  };

  var _Scene_Map_start = Scene_Map.prototype.start;
  Scene_Map.prototype.start = function() {
    _Scene_Map_start.call(this);
    DLQuests.sync();
  };

  var _Scene_Map_update = Scene_Map.prototype.update;
  Scene_Map.prototype.update = function() {
    _Scene_Map_update.call(this);
    if (Graphics.frameCount % 20 === 0) DLQuests.sync();
  };
})();
