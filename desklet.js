const Desklet = imports.ui.desklet;
const St = imports.gi.St;
const Settings = imports.ui.settings;
const MainLoop = imports.mainloop;
const Lang = imports.lang;

const UUID = "deadlines@shadowthink";
const MILLISEC_IN_MINUTE = 60 * 1000;
const MILLISEC_IN_HOUR = MILLISEC_IN_MINUTE * 60;
const MILLISEC_IN_DAY = MILLISEC_IN_HOUR * 24;
const MILLISEC_IN_WEEK = MILLISEC_IN_DAY * 7;
const TEXT_SIZE = 20;
const TASK_LEFT_PAD = 20;
const WIN_BORDER = 10;

function DeadlinesDesklet(metadata, desklet_id) {
  this._init(metadata, desklet_id);
}

DeadlinesDesklet.prototype = {
  __proto__: Desklet.Desklet.prototype,

  _init: function(metadata, desklet_id) {
    this.deadlineLst = [];

    try {
      Desklet.Desklet.prototype._init.call(this, metadata, desklet_id);
      this.settings = new Settings.DeskletSettings(this, UUID, desklet_id);
      this.settings.bindProperty(Settings.BindingDirection.ONE_WAY, "listLength", "listLength", this.refresh, null);
      this.settings.bindProperty(Settings.BindingDirection.ONE_WAY, "transparency", "transparency", this.refresh, null);
      this.settings.bindProperty(Settings.BindingDirection.ONE_WAY, "zoom", "zoom", this.refresh, null);
      this.settings.bindProperty(Settings.BindingDirection.ONE_WAY, "textcolor", "textcolor", this.refresh, null);
      this.settings.bindProperty(Settings.BindingDirection.ONE_WAY, "bgcolor", "bgcolor", this.refresh, null);
      this.settings.bindProperty(Settings.BindingDirection.ONE_WAY, "deadlines", "deadlines", this.refresh, null);
      this.setHeader("Deadlines");
      this.setupUI();
    }
    catch (e) {
      global.logError(e);
    }
  },

  setupUI: function() {
    this._parseDeadlines();
    this._createWindow();
    this.display();
    this.refreshLoop();
  },

  _parseDeadlines: function() {
    var i = 0, lst = this.deadlines.split(';');
    var now = Date.now();
    this.deadlineLst = [];
    for(; i < lst.length; i++) {
      var item = lst[i].trim().split(',');
      var timediff = this._getTimeDiff(now, item[0]);
      this.deadlineLst.push([timediff[0], timediff[1], item[1]]);
    }
    this.deadlineLst.sort(function(a, b) {
      return a[0] - b[0];
    });
  },

  _getTimeDiff: function(now, future) {
    if (typeof future == "string") future = new Date(future);
    var diff = future - now;
    if (diff <= 0) return [0, "0 weeks 0 days 00:00"];

    var week = parseInt(diff / MILLISEC_IN_WEEK);
    diff = diff - week * MILLISEC_IN_WEEK;
    var day = parseInt(diff / MILLISEC_IN_DAY);
    diff = diff - day * MILLISEC_IN_DAY;
    var hour = parseInt(diff / MILLISEC_IN_HOUR);
    diff = diff - hour * MILLISEC_IN_HOUR;
    var minute = parseInt(diff / MILLISEC_IN_MINUTE);
    var diffstr = week + " weeks " + day + " days " + this._zeroPadTimeDiff(hour, 2) + ":" + this._zeroPadTimeDiff(minute, 2);
    return [future - now, diffstr];
  },

  _zeroPadTimeDiff: function(diff, size) {
    var s = "00000000" + diff;
    return s.substr(s.length - size);
  },

  _createWindow: function() {
    this.window = new St.BoxLayout({"vertical": true});
    this.container = new St.BoxLayout({"vertical": false, "x_align": 2, "y_align": 2});
    this.countDown = new St.BoxLayout({"vertical": true, "y_align": 2});
    this.task = new St.BoxLayout({"vertical": true, "y_align": 2});
    var i;
    this.count_down_lst = [];
    this.task_lst = [];
    for (i = 0; i < this.listLength; i++) {
      var count_down = new St.Label();
      var task_caption = new St.Label();
      this.countDown.add_actor(count_down);
      this.task.add_actor(task_caption);
      this.count_down_lst.push(count_down);
      this.task_lst.push(task_caption);
    }
    this.container.add_actor(this.countDown);
    this.container.add_actor(this.task);
    this.window.add_actor(this.container);

    this.setContent(this.window);
  },

  display: function() {
    var i;
    for (i = 0; i < this.deadlineLst.length; i++) {
      if (i >= this.listLength) break;
      this.count_down_lst[i].text = this.deadlineLst[i][1];
      this.count_down_lst[i].style = "font-size: " + TEXT_SIZE * this.zoom + "px";
      this.task_lst[i].text = this.deadlineLst[i][2];
      this.task_lst[i].style = "font-size: " + TEXT_SIZE * this.zoom + "px; padding-left: " + TASK_LEFT_PAD * this.zoom + "px";
    }

    this.window.set_style_class_name('desklet');
    this.window.style = "border: " + WIN_BORDER + "px solid; background-color: " + (this.bgcolor.replace(")", ","+this.transparency+")")).replace("rgb", "rgba") + "; color: " + this.textcolor;
  },

  refresh: function() {
    this._parseDeadlines();
    this.display();
  },

  on_desklet_removed: function() {
    MainLoop.source_remove(this.timeout);
  },

  refreshLoop: function() {
    this.refresh();
    this.timeout = MainLoop.timeout_add_seconds(60, Lang.bind(this, this.refreshLoop));
  },

};

function main(metadata, desklet_id) {
  return new DeadlinesDesklet(metadata, desklet_id);
}
