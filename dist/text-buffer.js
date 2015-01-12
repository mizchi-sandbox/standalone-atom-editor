/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;
/******/
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	(function() {
	  var BufferPatch, CompositeDisposable, Delegator, Emitter, EmitterMixin, Grim, History, MarkerManager, Point, Q, Range, Serializable, SpanSkipList, Subscriber, TextBuffer, diff, newlineRegex, spliceArray, _, _ref, _ref1;

	  _ = __webpack_require__(12);

	  Delegator = __webpack_require__(13);

	  Grim = __webpack_require__(14);

	  Serializable = __webpack_require__(15);

	  Subscriber = __webpack_require__(16).Subscriber;

	  EmitterMixin = __webpack_require__(16).Emitter;

	  _ref = __webpack_require__(17), Emitter = _ref.Emitter, CompositeDisposable = _ref.CompositeDisposable;

	  SpanSkipList = __webpack_require__(18);

	  diff = __webpack_require__(10);

	  Q = __webpack_require__(11);

	  Point = __webpack_require__(1);

	  Range = __webpack_require__(2);

	  History = __webpack_require__(3);

	  MarkerManager = __webpack_require__(4);

	  BufferPatch = __webpack_require__(5);

	  _ref1 = __webpack_require__(6), spliceArray = _ref1.spliceArray, newlineRegex = _ref1.newlineRegex;

	  module.exports = TextBuffer = (function() {
	    TextBuffer.Point = Point;

	    TextBuffer.Range = Range;

	    TextBuffer.newlineRegex = newlineRegex;

	    Delegator.includeInto(TextBuffer);

	    EmitterMixin.includeInto(TextBuffer);

	    Serializable.includeInto(TextBuffer);

	    Subscriber.includeInto(TextBuffer);

	    TextBuffer.prototype.cachedText = null;

	    TextBuffer.prototype.encoding = null;

	    TextBuffer.prototype.stoppedChangingDelay = 300;

	    TextBuffer.prototype.stoppedChangingTimeout = null;

	    TextBuffer.prototype.cachedDiskContents = null;

	    TextBuffer.prototype.conflict = false;

	    TextBuffer.prototype.file = null;

	    TextBuffer.prototype.refcount = 0;

	    TextBuffer.prototype.fileSubscriptions = null;

	    TextBuffer.delegatesMethods('undo', 'redo', 'transact', 'beginTransaction', 'commitTransaction', 'abortTransaction', 'isTransacting', 'clearUndoStack', {
	      toProperty: 'history'
	    });


	    /*
	    Section: Construction
	     */

	    function TextBuffer(params) {
	      var text, _ref2, _ref3, _ref4, _ref5, _ref6;
	      if (typeof params === 'string') {
	        text = params;
	      }
	      this.emitter = new Emitter;
	      this.lines = [''];
	      this.lineEndings = [''];
	      this.offsetIndex = new SpanSkipList('rows', 'characters');
	      this.setTextInRange([[0, 0], [0, 0]], (_ref2 = text != null ? text : params != null ? params.text : void 0) != null ? _ref2 : '', {
	        normalizeLineEndings: false
	      });
	      this.history = (_ref3 = params != null ? params.history : void 0) != null ? _ref3 : new History(this);
	      this.markers = (_ref4 = params != null ? params.markers : void 0) != null ? _ref4 : new MarkerManager(this);
	      this.setEncoding(params != null ? params.encoding : void 0);
	      this.loaded = false;
	      this.digestWhenLastPersisted = (_ref5 = params != null ? params.digestWhenLastPersisted : void 0) != null ? _ref5 : false;
	      this.modifiedWhenLastPersisted = (_ref6 = params != null ? params.modifiedWhenLastPersisted : void 0) != null ? _ref6 : false;
	      this.useSerializedText = this.modifiedWhenLastPersisted !== false;
	      if (params != null ? params.filePath : void 0) {
	        this.setPath(params.filePath);
	      }
	      if (params != null ? params.load : void 0) {
	        this.load();
	      }
	    }

	    TextBuffer.prototype.deserializeParams = function(params) {
	      params.markers = MarkerManager.deserialize(params.markers, {
	        buffer: this
	      });
	      params.history = History.deserialize(params.history, {
	        buffer: this
	      });
	      params.load = true;
	      return params;
	    };

	    TextBuffer.prototype.serializeParams = function() {
	      var _ref2;
	      return {
	        text: this.getText(),
	        markers: this.markers.serialize(),
	        history: this.history.serialize(),
	        encoding: this.getEncoding(),
	        filePath: this.getPath(),
	        modifiedWhenLastPersisted: this.isModified(),
	        digestWhenLastPersisted: (_ref2 = this.file) != null ? _ref2.getDigest() : void 0
	      };
	    };


	    /*
	    Section: Event Subscription
	     */

	    TextBuffer.prototype.onDidChange = function(callback) {
	      return this.emitter.on('did-change', callback);
	    };

	    TextBuffer.prototype.preemptDidChange = function(callback) {
	      return this.emitter.preempt('did-change', callback);
	    };

	    TextBuffer.prototype.onDidStopChanging = function(callback) {
	      return this.emitter.on('did-stop-changing', callback);
	    };

	    TextBuffer.prototype.onDidConflict = function(callback) {
	      return this.emitter.on('did-conflict', callback);
	    };

	    TextBuffer.prototype.onDidChangeModified = function(callback) {
	      return this.emitter.on('did-change-modified', callback);
	    };

	    TextBuffer.prototype.onDidUpdateMarkers = function(callback) {
	      return this.emitter.on('did-update-markers', callback);
	    };

	    TextBuffer.prototype.onDidCreateMarker = function(callback) {
	      return this.emitter.on('did-create-marker', callback);
	    };

	    TextBuffer.prototype.onDidChangePath = function(callback) {
	      return this.emitter.on('did-change-path', callback);
	    };

	    TextBuffer.prototype.onDidChangeEncoding = function(callback) {
	      return this.emitter.on('did-change-encoding', callback);
	    };

	    TextBuffer.prototype.onWillSave = function(callback) {
	      return this.emitter.on('will-save', callback);
	    };

	    TextBuffer.prototype.onDidSave = function(callback) {
	      return this.emitter.on('did-save', callback);
	    };

	    TextBuffer.prototype.onWillReload = function(callback) {
	      return this.emitter.on('will-reload', callback);
	    };

	    TextBuffer.prototype.onDidReload = function(callback) {
	      return this.emitter.on('did-reload', callback);
	    };

	    TextBuffer.prototype.onDidDestroy = function(callback) {
	      return this.emitter.on('did-destroy', callback);
	    };

	    TextBuffer.prototype.onWillThrowWatchError = function(callback) {
	      return this.emitter.on('will-throw-watch-error', callback);
	    };

	    TextBuffer.prototype.getStoppedChangingDelay = function() {
	      return this.stoppedChangingDelay;
	    };

	    TextBuffer.prototype.on = function(eventName) {
	      switch (eventName) {
	        case 'changed':
	          Grim.deprecate("Use TextBuffer::onDidChange instead");
	          break;
	        case 'contents-modified':
	          Grim.deprecate("Use TextBuffer::onDidStopChanging instead. If you need the modified status, call TextBuffer::isModified yourself in your callback.");
	          break;
	        case 'contents-conflicted':
	          Grim.deprecate("Use TextBuffer::onDidConflict instead");
	          break;
	        case 'modified-status-changed':
	          Grim.deprecate("Use TextBuffer::onDidChangeModified instead");
	          break;
	        case 'markers-updated':
	          Grim.deprecate("Use TextBuffer::onDidUpdateMarkers instead");
	          break;
	        case 'marker-created':
	          Grim.deprecate("Use TextBuffer::onDidCreateMarker instead");
	          break;
	        case 'path-changed':
	          Grim.deprecate("Use TextBuffer::onDidChangePath instead. The path is now provided as a callback argument rather than a TextBuffer instance.");
	          break;
	        case 'will-be-saved':
	          Grim.deprecate("Use TextBuffer::onWillSave instead. A TextBuffer instance is no longer provided as a callback argument.");
	          break;
	        case 'saved':
	          Grim.deprecate("Use TextBuffer::onDidSave instead. A TextBuffer instance is no longer provided as a callback argument.");
	          break;
	        case 'will-reload':
	          Grim.deprecate("Use TextBuffer::onWillReload instead.");
	          break;
	        case 'reloaded':
	          Grim.deprecate("Use TextBuffer::onDidReload instead.");
	          break;
	        case 'destroyed':
	          Grim.deprecate("Use TextBuffer::onDidDestroy instead");
	          break;
	        default:
	          Grim.deprecate("TextBuffer::on is deprecated. Use event subscription methods instead.");
	      }
	      return EmitterMixin.prototype.on.apply(this, arguments);
	    };


	    /*
	    Section: File Details
	     */

	    TextBuffer.prototype.isModified = function() {
	      var _ref2;
	      if (!this.loaded) {
	        return false;
	      }
	      if (this.file) {
	        if (this.file.exists()) {
	          return this.getText() !== this.cachedDiskContents;
	        } else {
	          return (_ref2 = this.wasModifiedBeforeRemove) != null ? _ref2 : !this.isEmpty();
	        }
	      } else {
	        return !this.isEmpty();
	      }
	    };

	    TextBuffer.prototype.isInConflict = function() {
	      return this.conflict;
	    };

	    TextBuffer.prototype.getPath = function() {
	      var _ref2;
	      return (_ref2 = this.file) != null ? _ref2.getPath() : void 0;
	    };

	    TextBuffer.prototype.setPath = function(filePath) {
	      if (filePath === this.getPath()) {
	        return;
	      }
	      this.file = null;
	      this.emitter.emit('did-change-path', this.getPath());
	      return this.emit("path-changed", this);
	    };

	    TextBuffer.prototype.setEncoding = function(encoding) {
	      if (encoding == null) {
	        encoding = 'utf8';
	      }
	      if (encoding === this.getEncoding()) {
	        return;
	      }
	      this.encoding = encoding;
	      if (this.file != null) {
	        this.file.setEncoding(encoding);
	        this.emitter.emit('did-change-encoding', encoding);
	        if (!this.isModified()) {
	          this.updateCachedDiskContents(true, (function(_this) {
	            return function() {
	              _this.reload();
	              return _this.clearUndoStack();
	            };
	          })(this));
	        }
	      } else {
	        this.emitter.emit('did-change-encoding', encoding);
	      }
	    };

	    TextBuffer.prototype.getEncoding = function() {
	      var _ref2, _ref3;
	      return (_ref2 = this.encoding) != null ? _ref2 : (_ref3 = this.file) != null ? _ref3.getEncoding() : void 0;
	    };

	    TextBuffer.prototype.getUri = function() {
	      return this.getPath();
	    };

	    TextBuffer.prototype.getBaseName = function() {
	      var _ref2;
	      return (_ref2 = this.file) != null ? _ref2.getBaseName() : void 0;
	    };


	    /*
	    Section: Reading Text
	     */

	    TextBuffer.prototype.isEmpty = function() {
	      return this.getLastRow() === 0 && this.lineLengthForRow(0) === 0;
	    };

	    TextBuffer.prototype.getText = function() {
	      var row, text, _i, _ref2;
	      if (this.cachedText != null) {
	        return this.cachedText;
	      } else {
	        text = '';
	        for (row = _i = 0, _ref2 = this.getLastRow(); 0 <= _ref2 ? _i <= _ref2 : _i >= _ref2; row = 0 <= _ref2 ? ++_i : --_i) {
	          text += this.lineForRow(row) + this.lineEndingForRow(row);
	        }
	        return this.cachedText = text;
	      }
	    };

	    TextBuffer.prototype.getTextInRange = function(range) {
	      var endRow, line, row, startRow, text, _i;
	      range = this.clipRange(Range.fromObject(range));
	      startRow = range.start.row;
	      endRow = range.end.row;
	      if (startRow === endRow) {
	        return this.lineForRow(startRow).slice(range.start.column, range.end.column);
	      } else {
	        text = '';
	        for (row = _i = startRow; startRow <= endRow ? _i <= endRow : _i >= endRow; row = startRow <= endRow ? ++_i : --_i) {
	          line = this.lineForRow(row);
	          if (row === startRow) {
	            text += line.slice(range.start.column);
	          } else if (row === endRow) {
	            text += line.slice(0, range.end.column);
	            continue;
	          } else {
	            text += line;
	          }
	          text += this.lineEndingForRow(row);
	        }
	        return text;
	      }
	    };

	    TextBuffer.prototype.getLines = function() {
	      return this.lines.slice();
	    };

	    TextBuffer.prototype.getLastLine = function() {
	      return this.lineForRow(this.getLastRow());
	    };

	    TextBuffer.prototype.lineForRow = function(row) {
	      return this.lines[row];
	    };

	    TextBuffer.prototype.lineEndingForRow = function(row) {
	      return this.lineEndings[row];
	    };

	    TextBuffer.prototype.lineLengthForRow = function(row) {
	      return this.lines[row].length;
	    };

	    TextBuffer.prototype.isRowBlank = function(row) {
	      return !/\S/.test(this.lineForRow(row));
	    };

	    TextBuffer.prototype.previousNonBlankRow = function(startRow) {
	      var row, _i, _ref2;
	      if (startRow === 0) {
	        return null;
	      }
	      startRow = Math.min(startRow, this.getLastRow());
	      for (row = _i = _ref2 = startRow - 1; _ref2 <= 0 ? _i <= 0 : _i >= 0; row = _ref2 <= 0 ? ++_i : --_i) {
	        if (!this.isRowBlank(row)) {
	          return row;
	        }
	      }
	      return null;
	    };

	    TextBuffer.prototype.nextNonBlankRow = function(startRow) {
	      var lastRow, row, _i, _ref2;
	      lastRow = this.getLastRow();
	      if (startRow < lastRow) {
	        for (row = _i = _ref2 = startRow + 1; _ref2 <= lastRow ? _i <= lastRow : _i >= lastRow; row = _ref2 <= lastRow ? ++_i : --_i) {
	          if (!this.isRowBlank(row)) {
	            return row;
	          }
	        }
	      }
	      return null;
	    };


	    /*
	    Section: Mutating Text
	     */

	    TextBuffer.prototype.setText = function(text) {
	      return this.setTextInRange(this.getRange(), text, {
	        normalizeLineEndings: false
	      });
	    };

	    TextBuffer.prototype.setTextViaDiff = function(text) {
	      var computeBufferColumn, currentText, endsWithNewline;
	      currentText = this.getText();
	      if (currentText === text) {
	        return;
	      }
	      endsWithNewline = function(str) {
	        return /[\r\n]+$/g.test(str);
	      };
	      computeBufferColumn = function(str) {
	        var newlineIndex;
	        newlineIndex = Math.max(str.lastIndexOf('\n'), str.lastIndexOf('\r'));
	        if (endsWithNewline(str)) {
	          return 0;
	        } else if (newlineIndex === -1) {
	          return str.length;
	        } else {
	          return str.length - newlineIndex - 1;
	        }
	      };
	      return this.transact((function(_this) {
	        return function() {
	          var change, changeOptions, column, currentPosition, endColumn, endRow, lineCount, lineDiff, row, _i, _len, _ref2, _ref3, _results;
	          row = 0;
	          column = 0;
	          currentPosition = [0, 0];
	          lineDiff = diff.diffLines(currentText, text);
	          changeOptions = {
	            normalizeLineEndings: false
	          };
	          _results = [];
	          for (_i = 0, _len = lineDiff.length; _i < _len; _i++) {
	            change = lineDiff[_i];
	            lineCount = (_ref2 = (_ref3 = change.value.match(newlineRegex)) != null ? _ref3.length : void 0) != null ? _ref2 : 0;
	            currentPosition[0] = row;
	            currentPosition[1] = column;
	            if (change.added) {
	              _this.setTextInRange([currentPosition, currentPosition], change.value, changeOptions);
	              row += lineCount;
	              _results.push(column = computeBufferColumn(change.value));
	            } else if (change.removed) {
	              endRow = row + lineCount;
	              endColumn = column + computeBufferColumn(change.value);
	              _results.push(_this.setTextInRange([currentPosition, [endRow, endColumn]], '', changeOptions));
	            } else {
	              row += lineCount;
	              _results.push(column = computeBufferColumn(change.value));
	            }
	          }
	          return _results;
	        };
	      })(this));
	    };

	    TextBuffer.prototype.setTextInRange = function(range, text, options) {
	      var normalizeLineEndings, patch, undo, _ref2;
	      if (typeof options === 'boolean') {
	        normalizeLineEndings = options;
	        Grim.deprecate("The normalizeLineEndings argument is now an options hash. Use {normalizeLineEndings: " + options + "} instead");
	      } else if (options != null) {
	        normalizeLineEndings = options.normalizeLineEndings, undo = options.undo;
	      }
	      if (normalizeLineEndings == null) {
	        normalizeLineEndings = true;
	      }
	      patch = this.buildPatch(range, text, normalizeLineEndings);
	      if (undo !== 'skip') {
	        if ((_ref2 = this.history) != null) {
	          _ref2.recordNewPatch(patch);
	        }
	      }
	      this.applyPatch(patch);
	      return patch.newRange;
	    };

	    TextBuffer.prototype.insert = function(position, text, options) {
	      return this.setTextInRange(new Range(position, position), text, options);
	    };

	    TextBuffer.prototype.append = function(text, options) {
	      return this.insert(this.getEndPosition(), text, options);
	    };

	    TextBuffer.prototype.buildPatch = function(oldRange, newText, normalizeLineEndings) {
	      var newRange, oldText, patch, _ref2;
	      oldRange = this.clipRange(oldRange);
	      oldText = this.getTextInRange(oldRange);
	      newRange = Range.fromText(oldRange.start, newText);
	      patch = new BufferPatch(oldRange, newRange, oldText, newText, normalizeLineEndings);
	      if ((_ref2 = this.markers) != null) {
	        _ref2.handleBufferChange(patch);
	      }
	      return patch;
	    };

	    TextBuffer.prototype.applyPatch = function(_arg) {
	      var changeEvent, endRow, lastIndex, lastLine, lastLineEnding, lineEndings, lineStartIndex, lines, markerPatches, newRange, newText, normalizeLineEndings, normalizedEnding, offsets, oldRange, oldText, prefix, result, rowCount, startRow, suffix, _ref2, _ref3, _ref4;
	      oldRange = _arg.oldRange, newRange = _arg.newRange, oldText = _arg.oldText, newText = _arg.newText, normalizeLineEndings = _arg.normalizeLineEndings, markerPatches = _arg.markerPatches;
	      this.cachedText = null;
	      startRow = oldRange.start.row;
	      endRow = oldRange.end.row;
	      rowCount = endRow - startRow + 1;
	      if (normalizeLineEndings) {
	        normalizedEnding = this.lineEndingForRow(startRow);
	        if (normalizedEnding === '') {
	          if (startRow > 0) {
	            normalizedEnding = this.lineEndingForRow(startRow - 1);
	          } else {
	            normalizedEnding = null;
	          }
	        }
	      }
	      lines = [];
	      lineEndings = [];
	      lineStartIndex = 0;
	      while (result = newlineRegex.exec(newText)) {
	        lines.push(newText.slice(lineStartIndex, result.index));
	        lineEndings.push(normalizedEnding != null ? normalizedEnding : result[0]);
	        lineStartIndex = newlineRegex.lastIndex;
	      }
	      lastLine = newText.slice(lineStartIndex);
	      lines.push(lastLine);
	      lineEndings.push('');
	      prefix = this.lineForRow(startRow).slice(0, oldRange.start.column);
	      lines[0] = prefix + lines[0];
	      suffix = this.lineForRow(endRow).slice(oldRange.end.column);
	      lastIndex = lines.length - 1;
	      lines[lastIndex] += suffix;
	      lastLineEnding = this.lineEndingForRow(endRow);
	      if (lastLineEnding !== '' && (normalizedEnding != null)) {
	        lastLineEnding = normalizedEnding;
	      }
	      lineEndings[lastIndex] = lastLineEnding;
	      spliceArray(this.lines, startRow, rowCount, lines);
	      spliceArray(this.lineEndings, startRow, rowCount, lineEndings);
	      offsets = lines.map(function(line, index) {
	        return {
	          rows: 1,
	          characters: line.length + lineEndings[index].length
	        };
	      });
	      this.offsetIndex.spliceArray('rows', startRow, rowCount, offsets);
	      if ((_ref2 = this.markers) != null) {
	        _ref2.pauseChangeEvents();
	      }
	      if ((_ref3 = this.markers) != null) {
	        _ref3.applyPatches(markerPatches, true);
	      }
	      changeEvent = {
	        oldRange: oldRange,
	        newRange: newRange,
	        oldText: oldText,
	        newText: newText
	      };
	      if (this.conflict && !this.isModified()) {
	        this.conflict = false;
	      }
	      this.scheduleModifiedEvents();
	      this.emitter.emit('did-change', changeEvent);
	      this.emit('changed', changeEvent);
	      if ((_ref4 = this.markers) != null) {
	        _ref4.resumeChangeEvents();
	      }
	      this.emitter.emit('did-update-markers');
	      return this.emit('markers-updated');
	    };

	    TextBuffer.prototype["delete"] = function(range) {
	      return this.setTextInRange(range, '');
	    };

	    TextBuffer.prototype.deleteRow = function(row) {
	      return this.deleteRows(row, row);
	    };

	    TextBuffer.prototype.deleteRows = function(startRow, endRow) {
	      var endPoint, lastRow, startPoint, _ref2;
	      lastRow = this.getLastRow();
	      if (startRow > endRow) {
	        _ref2 = [endRow, startRow], startRow = _ref2[0], endRow = _ref2[1];
	      }
	      if (endRow < 0) {
	        return new Range(this.getFirstPosition(), this.getFirstPosition());
	      }
	      if (startRow > lastRow) {
	        return new Range(this.getEndPosition(), this.getEndPosition());
	      }
	      startRow = Math.max(0, startRow);
	      endRow = Math.min(lastRow, endRow);
	      if (endRow < lastRow) {
	        startPoint = new Point(startRow, 0);
	        endPoint = new Point(endRow + 1, 0);
	      } else {
	        if (startRow === 0) {
	          startPoint = new Point(startRow, 0);
	        } else {
	          startPoint = new Point(startRow - 1, this.lineLengthForRow(startRow - 1));
	        }
	        endPoint = new Point(endRow, this.lineLengthForRow(endRow));
	      }
	      return this["delete"](new Range(startPoint, endPoint));
	    };


	    /*
	    Section: Markers
	     */

	    TextBuffer.prototype.markRange = function(range, properties) {
	      return this.markers.markRange(range, properties);
	    };

	    TextBuffer.prototype.markPosition = function(position, properties) {
	      return this.markers.markPosition(position, properties);
	    };

	    TextBuffer.prototype.getMarkers = function() {
	      return this.markers.getMarkers();
	    };

	    TextBuffer.prototype.getMarker = function(id) {
	      return this.markers.getMarker(id);
	    };

	    TextBuffer.prototype.findMarkers = function(params) {
	      return this.markers.findMarkers(params);
	    };

	    TextBuffer.prototype.getMarkerCount = function() {
	      return this.markers.getMarkerCount();
	    };

	    TextBuffer.prototype.destroyMarker = function(id) {
	      var _ref2;
	      return (_ref2 = this.getMarker(id)) != null ? _ref2.destroy() : void 0;
	    };


	    /*
	    Section: History
	     */

	    TextBuffer.prototype.undo = function() {
	      return this.history.undo();
	    };

	    TextBuffer.prototype.redo = function() {
	      return this.history.redo();
	    };

	    TextBuffer.prototype.transact = function(groupingInterval, fn) {
	      return this.history.transact(groupingInterval, fn);
	    };

	    TextBuffer.prototype.beginTransaction = function(groupingInterval) {
	      Grim.deprecate("Open-ended transactions are deprecated. Use checkpoints instead.");
	      return this.history.beginTransaction(groupingInterval);
	    };

	    TextBuffer.prototype.commitTransaction = function() {
	      Grim.deprecate("Open-ended transactions are deprecated. Use checkpoints instead.");
	      return this.history.commitTransaction();
	    };

	    TextBuffer.prototype.abortTransaction = function() {
	      Grim.deprecate("Open-ended transactions are deprecated. Use checkpoints instead.");
	      return this.history.abortTransaction();
	    };

	    TextBuffer.prototype.clearUndoStack = function() {
	      return this.history.clearUndoStack();
	    };

	    TextBuffer.prototype.createCheckpoint = function() {
	      return this.history.createCheckpoint();
	    };

	    TextBuffer.prototype.revertToCheckpoint = function(checkpoint) {
	      return this.history.revertToCheckpoint(checkpoint);
	    };

	    TextBuffer.prototype.groupChangesSinceCheckpoint = function(checkpoint) {
	      return this.history.groupChangesSinceCheckpoint(checkpoint);
	    };


	    /*
	    Section: Search And Replace
	     */

	    TextBuffer.prototype.scan = function(regex, iterator) {
	      return this.scanInRange(regex, this.getRange(), (function(_this) {
	        return function(result) {
	          result.lineText = _this.lineForRow(result.range.start.row);
	          result.lineTextOffset = 0;
	          return iterator(result);
	        };
	      })(this));
	    };

	    TextBuffer.prototype.backwardsScan = function(regex, iterator) {
	      return this.backwardsScanInRange(regex, this.getRange(), (function(_this) {
	        return function(result) {
	          result.lineText = _this.lineForRow(result.range.start.row);
	          result.lineTextOffset = 0;
	          return iterator(result);
	        };
	      })(this));
	    };

	    TextBuffer.prototype.scanInRange = function(regex, range, iterator, reverse) {
	      var endIndex, endPosition, flags, global, keepLooping, lengthDelta, match, matchEndIndex, matchLength, matchStartIndex, matchText, matches, replace, replacementText, startIndex, startPosition, stop, _i, _len, _results;
	      if (reverse == null) {
	        reverse = false;
	      }
	      range = this.clipRange(range);
	      global = regex.global;
	      flags = "gm";
	      if (regex.ignoreCase) {
	        flags += "i";
	      }
	      regex = new RegExp(regex.source, flags);
	      startIndex = this.characterIndexForPosition(range.start);
	      endIndex = this.characterIndexForPosition(range.end);
	      matches = this.matchesInCharacterRange(regex, startIndex, endIndex);
	      lengthDelta = 0;
	      keepLooping = null;
	      replacementText = null;
	      stop = function() {
	        return keepLooping = false;
	      };
	      replace = function(text) {
	        return replacementText = text;
	      };
	      if (reverse) {
	        matches.reverse();
	      }
	      _results = [];
	      for (_i = 0, _len = matches.length; _i < _len; _i++) {
	        match = matches[_i];
	        matchLength = match[0].length;
	        matchStartIndex = match.index;
	        matchEndIndex = matchStartIndex + matchLength;
	        startPosition = this.positionForCharacterIndex(matchStartIndex + lengthDelta);
	        endPosition = this.positionForCharacterIndex(matchEndIndex + lengthDelta);
	        range = new Range(startPosition, endPosition);
	        keepLooping = true;
	        replacementText = null;
	        matchText = match[0];
	        iterator({
	          match: match,
	          matchText: matchText,
	          range: range,
	          stop: stop,
	          replace: replace
	        });
	        if (replacementText != null) {
	          this.setTextInRange(range, replacementText);
	          if (!reverse) {
	            lengthDelta += replacementText.length - matchLength;
	          }
	        }
	        if (!(global && keepLooping)) {
	          break;
	        } else {
	          _results.push(void 0);
	        }
	      }
	      return _results;
	    };

	    TextBuffer.prototype.backwardsScanInRange = function(regex, range, iterator) {
	      return this.scanInRange(regex, range, iterator, true);
	    };

	    TextBuffer.prototype.replace = function(regex, replacementText) {
	      var doSave, replacements;
	      doSave = !this.isModified();
	      replacements = 0;
	      this.transact((function(_this) {
	        return function() {
	          return _this.scan(regex, function(_arg) {
	            var matchText, replace;
	            matchText = _arg.matchText, replace = _arg.replace;
	            replace(matchText.replace(regex, replacementText));
	            return replacements++;
	          });
	        };
	      })(this));
	      if (doSave) {
	        this.save();
	      }
	      return replacements;
	    };

	    TextBuffer.prototype.matchesInCharacterRange = function(regex, startIndex, endIndex) {
	      var match, matchEndIndex, matchLength, matchStartIndex, matches, submatch, text;
	      text = this.getText();
	      matches = [];
	      regex.lastIndex = startIndex;
	      while (match = regex.exec(text)) {
	        matchLength = match[0].length;
	        matchStartIndex = match.index;
	        matchEndIndex = matchStartIndex + matchLength;
	        if (matchEndIndex > endIndex) {
	          regex.lastIndex = 0;
	          if (matchStartIndex < endIndex && (submatch = regex.exec(text.slice(matchStartIndex, endIndex)))) {
	            submatch.index = matchStartIndex;
	            matches.push(submatch);
	          }
	          break;
	        }
	        if (matchLength === 0) {
	          matchEndIndex++;
	        }
	        regex.lastIndex = matchEndIndex;
	        matches.push(match);
	      }
	      return matches;
	    };


	    /*
	    Section: Buffer Range Details
	     */

	    TextBuffer.prototype.getRange = function() {
	      return new Range(this.getFirstPosition(), this.getEndPosition());
	    };

	    TextBuffer.prototype.getLineCount = function() {
	      return this.lines.length;
	    };

	    TextBuffer.prototype.getLastRow = function() {
	      return this.getLineCount() - 1;
	    };

	    TextBuffer.prototype.getFirstPosition = function() {
	      return new Point(0, 0);
	    };

	    TextBuffer.prototype.getEndPosition = function() {
	      var lastRow;
	      lastRow = this.getLastRow();
	      return new Point(lastRow, this.lineLengthForRow(lastRow));
	    };

	    TextBuffer.prototype.getMaxCharacterIndex = function() {
	      return this.offsetIndex.totalTo(Infinity, 'rows').characters;
	    };

	    TextBuffer.prototype.rangeForRow = function(row, includeNewline) {
	      if (typeof includeNewline === 'object') {
	        Grim.deprecate("The second param is no longer an object, it's a boolean argument named `includeNewline`.");
	        includeNewline = includeNewline.includeNewline;
	      }
	      if (includeNewline && row < this.getLastRow()) {
	        return new Range(new Point(row, 0), new Point(row + 1, 0));
	      } else {
	        return new Range(new Point(row, 0), new Point(row, this.lineLengthForRow(row)));
	      }
	    };

	    TextBuffer.prototype.characterIndexForPosition = function(position) {
	      var characters, column, row, _ref2;
	      _ref2 = this.clipPosition(Point.fromObject(position)), row = _ref2.row, column = _ref2.column;
	      if (row < 0 || row > this.getLastRow() || column < 0 || column > this.lineLengthForRow(row)) {
	        throw new Error("Position " + position + " is invalid");
	      }
	      characters = this.offsetIndex.totalTo(row, 'rows').characters;
	      return characters + column;
	    };

	    TextBuffer.prototype.positionForCharacterIndex = function(offset) {
	      var characters, rows, _ref2;
	      offset = Math.max(0, offset);
	      offset = Math.min(this.getMaxCharacterIndex(), offset);
	      _ref2 = this.offsetIndex.totalTo(offset, 'characters'), rows = _ref2.rows, characters = _ref2.characters;
	      if (rows > this.getLastRow()) {
	        return this.getEndPosition();
	      } else {
	        return new Point(rows, offset - characters);
	      }
	    };

	    TextBuffer.prototype.clipRange = function(range) {
	      var end, start;
	      range = Range.fromObject(range);
	      start = this.clipPosition(range.start);
	      end = this.clipPosition(range.end);
	      if (range.start.isEqual(start) && range.end.isEqual(end)) {
	        return range;
	      } else {
	        return new Range(start, end);
	      }
	    };

	    TextBuffer.prototype.clipPosition = function(position) {
	      var column, row;
	      position = Point.fromObject(position);
	      row = position.row, column = position.column;
	      if (row < 0) {
	        return this.getFirstPosition();
	      } else if (row > this.getLastRow()) {
	        return this.getEndPosition();
	      } else {
	        column = Math.min(Math.max(column, 0), this.lineLengthForRow(row));
	        if (column === position.column) {
	          return position;
	        } else {
	          return new Point(row, column);
	        }
	      }
	    };


	    /*
	    Section: Buffer Operations
	     */

	    TextBuffer.prototype.save = function() {
	      return this.saveAs(this.getPath());
	    };

	    TextBuffer.prototype.saveAs = function(filePath) {
	      if (!filePath) {
	        throw new Error("Can't save buffer with no file path");
	      }
	      this.emitter.emit('will-save', {
	        path: filePath
	      });
	      this.emit('will-be-saved', this);
	      this.setPath(filePath);
	      this.file.write(this.getText());
	      this.cachedDiskContents = this.getText();
	      this.conflict = false;
	      this.emitModifiedStatusChanged(false);
	      this.emitter.emit('did-save', {
	        path: filePath
	      });
	      return this.emit('saved', this);
	    };

	    TextBuffer.prototype.reload = function() {
	      this.emitter.emit('will-reload');
	      this.emit('will-reload');
	      this.setTextViaDiff(this.cachedDiskContents);
	      this.emitModifiedStatusChanged(false);
	      this.emitter.emit('did-reload');
	      return this.emit('reloaded');
	    };

	    TextBuffer.prototype.updateCachedDiskContentsSync = function() {
	      var _ref2, _ref3;
	      return this.cachedDiskContents = (_ref2 = (_ref3 = this.file) != null ? _ref3.readSync() : void 0) != null ? _ref2 : "";
	    };

	    TextBuffer.prototype.updateCachedDiskContents = function(flushCache, callback) {
	      var _ref2, _ref3;
	      if (flushCache == null) {
	        flushCache = false;
	      }
	      return Q((_ref2 = (_ref3 = this.file) != null ? _ref3.read(flushCache) : void 0) != null ? _ref2 : "").then((function(_this) {
	        return function(contents) {
	          _this.cachedDiskContents = contents;
	          return typeof callback === "function" ? callback() : void 0;
	        };
	      })(this));
	    };


	    /*
	    Section: Private Utility Methods
	     */

	    TextBuffer.prototype.markerCreated = function(marker) {
	      this.emitter.emit('did-create-marker', marker);
	      return this.emit('marker-created', marker);
	    };

	    TextBuffer.prototype.loadSync = function() {
	      this.updateCachedDiskContentsSync();
	      return this.finishLoading();
	    };

	    TextBuffer.prototype.load = function() {
	      return this.updateCachedDiskContents().then((function(_this) {
	        return function() {
	          return _this.finishLoading();
	        };
	      })(this));
	    };

	    TextBuffer.prototype.finishLoading = function() {
	      var _ref2;
	      if (this.isAlive()) {
	        this.loaded = true;
	        if (this.useSerializedText && this.digestWhenLastPersisted === ((_ref2 = this.file) != null ? _ref2.getDigest() : void 0)) {
	          this.emitModifiedStatusChanged(true);
	        } else {
	          this.reload();
	        }
	        this.clearUndoStack();
	      }
	      return this;
	    };

	    TextBuffer.prototype.destroy = function() {
	      var _ref2;
	      if (!this.destroyed) {
	        this.cancelStoppedChangingTimeout();
	        if ((_ref2 = this.fileSubscriptions) != null) {
	          _ref2.dispose();
	        }
	        this.unsubscribe();
	        this.destroyed = true;
	        this.emitter.emit('did-destroy');
	        return this.emit('destroyed');
	      }
	    };

	    TextBuffer.prototype.isAlive = function() {
	      return !this.destroyed;
	    };

	    TextBuffer.prototype.isDestroyed = function() {
	      return this.destroyed;
	    };

	    TextBuffer.prototype.isRetained = function() {
	      return this.refcount > 0;
	    };

	    TextBuffer.prototype.retain = function() {
	      this.refcount++;
	      return this;
	    };

	    TextBuffer.prototype.release = function() {
	      this.refcount--;
	      if (!this.isRetained()) {
	        this.destroy();
	      }
	      return this;
	    };

	    TextBuffer.prototype.subscribeToFile = function() {
	      var _ref2;
	      if ((_ref2 = this.fileSubscriptions) != null) {
	        _ref2.dispose();
	      }
	      this.fileSubscriptions = new CompositeDisposable;
	      this.fileSubscriptions.add(this.file.onDidChange((function(_this) {
	        return function() {
	          var previousContents;
	          if (_this.isModified()) {
	            _this.conflict = true;
	          }
	          previousContents = _this.cachedDiskContents;
	          _this.updateCachedDiskContentsSync();
	          if (previousContents === _this.cachedDiskContents) {
	            return;
	          }
	          if (_this.conflict) {
	            _this.emitter.emit('did-conflict');
	            return _this.emit("contents-conflicted");
	          } else {
	            return _this.reload();
	          }
	        };
	      })(this)));
	      this.fileSubscriptions.add(this.file.onDidDelete((function(_this) {
	        return function() {
	          var modified;
	          modified = _this.getText() !== _this.cachedDiskContents;
	          _this.wasModifiedBeforeRemove = modified;
	          if (modified) {
	            return _this.updateCachedDiskContents();
	          } else {
	            return _this.destroy();
	          }
	        };
	      })(this)));
	      this.fileSubscriptions.add(this.file.onDidRename((function(_this) {
	        return function() {
	          _this.emitter.emit('did-change-path', _this.getPath());
	          return _this.emit("path-changed", _this);
	        };
	      })(this)));
	      return this.fileSubscriptions.add(this.file.onWillThrowWatchError((function(_this) {
	        return function(errorObject) {
	          return _this.emitter.emit('will-throw-watch-error', errorObject);
	        };
	      })(this)));
	    };

	    TextBuffer.prototype.hasMultipleEditors = function() {
	      return this.refcount > 1;
	    };

	    TextBuffer.prototype.cancelStoppedChangingTimeout = function() {
	      if (this.stoppedChangingTimeout) {
	        return clearTimeout(this.stoppedChangingTimeout);
	      }
	    };

	    TextBuffer.prototype.scheduleModifiedEvents = function() {
	      var stoppedChangingCallback;
	      this.cancelStoppedChangingTimeout();
	      stoppedChangingCallback = (function(_this) {
	        return function() {
	          var modifiedStatus;
	          _this.stoppedChangingTimeout = null;
	          modifiedStatus = _this.isModified();
	          _this.emitter.emit('did-stop-changing');
	          _this.emit('contents-modified', modifiedStatus);
	          return _this.emitModifiedStatusChanged(modifiedStatus);
	        };
	      })(this);
	      return this.stoppedChangingTimeout = setTimeout(stoppedChangingCallback, this.stoppedChangingDelay);
	    };

	    TextBuffer.prototype.emitModifiedStatusChanged = function(modifiedStatus) {
	      if (modifiedStatus === this.previousModifiedStatus) {
	        return;
	      }
	      this.previousModifiedStatus = modifiedStatus;
	      this.emitter.emit('did-change-modified', modifiedStatus);
	      return this.emit('modified-status-changed', modifiedStatus);
	    };

	    TextBuffer.prototype.usesSoftTabs = function() {
	      var match, row, _i, _ref2;
	      Grim.deprecate("Use Editor::usesSoftTabs instead. TextBuffer doesn't have enough context to determine this.");
	      for (row = _i = 0, _ref2 = this.getLastRow(); 0 <= _ref2 ? _i <= _ref2 : _i >= _ref2; row = 0 <= _ref2 ? ++_i : --_i) {
	        if (match = this.lineForRow(row).match(/^\s/)) {
	          return match[0][0] !== '\t';
	        }
	      }
	      return void 0;
	    };

	    TextBuffer.prototype.change = function(oldRange, newText, options) {
	      if (options == null) {
	        options = {};
	      }
	      Grim.deprecate("Use TextBuffer::setTextInRange instead.");
	      return this.setTextInRange(oldRange, newText, options.normalizeLineEndings);
	    };

	    TextBuffer.prototype.getEofPosition = function() {
	      Grim.deprecate("Use TextBuffer::getEndPosition instead.");
	      return this.getEndPosition();
	    };

	    TextBuffer.prototype.logLines = function(start, end) {
	      var line, row, _i, _results;
	      if (start == null) {
	        start = 0;
	      }
	      if (end == null) {
	        end = this.getLastRow();
	      }
	      _results = [];
	      for (row = _i = start; start <= end ? _i <= end : _i >= end; row = start <= end ? ++_i : --_i) {
	        line = this.lineForRow(row);
	        _results.push(console.log(row, line, line.length));
	      }
	      return _results;
	    };

	    return TextBuffer;

	  })();

	}).call(this);


/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	(function() {
	  var Point, deprecate;

	  deprecate = __webpack_require__(14).deprecate;

	  module.exports = Point = (function() {

	    /*
	    Section: Construction
	     */
	    Point.fromObject = function(object, copy) {
	      var column, row;
	      if (object instanceof Point) {
	        if (copy) {
	          return object.copy();
	        } else {
	          return object;
	        }
	      } else {
	        if (Array.isArray(object)) {
	          row = object[0], column = object[1];
	        } else {
	          row = object.row, column = object.column;
	        }
	        return new Point(row, column);
	      }
	    };


	    /*
	    Section: Comparison
	     */

	    Point.min = function(point1, point2) {
	      point1 = this.fromObject(point1);
	      point2 = this.fromObject(point2);
	      if (point1.isLessThanOrEqual(point2)) {
	        return point1;
	      } else {
	        return point2;
	      }
	    };


	    /*
	    Section: Construction
	     */

	    function Point(row, column) {
	      this.row = row != null ? row : 0;
	      this.column = column != null ? column : 0;
	    }

	    Point.prototype.copy = function() {
	      return new Point(this.row, this.column);
	    };


	    /*
	    Section: Operations
	     */

	    Point.prototype.freeze = function() {
	      return Object.freeze(this);
	    };

	    Point.prototype.translate = function(other) {
	      var column, row, _ref;
	      _ref = Point.fromObject(other), row = _ref.row, column = _ref.column;
	      return new Point(this.row + row, this.column + column);
	    };

	    Point.prototype.traverse = function(other) {
	      var column, row;
	      other = Point.fromObject(other);
	      row = this.row + other.row;
	      if (other.row === 0) {
	        column = this.column + other.column;
	      } else {
	        column = other.column;
	      }
	      return new Point(row, column);
	    };

	    Point.prototype.add = function(other) {
	      deprecate("Use Point::traverse instead");
	      return this.traverse(other);
	    };

	    Point.prototype.splitAt = function(column) {
	      var rightColumn;
	      if (this.row === 0) {
	        rightColumn = this.column - column;
	      } else {
	        rightColumn = this.column;
	      }
	      return [new Point(0, column), new Point(this.row, rightColumn)];
	    };


	    /*
	    Section: Comparison
	     */

	    Point.prototype.compare = function(other) {
	      if (this.row > other.row) {
	        return 1;
	      } else if (this.row < other.row) {
	        return -1;
	      } else {
	        if (this.column > other.column) {
	          return 1;
	        } else if (this.column < other.column) {
	          return -1;
	        } else {
	          return 0;
	        }
	      }
	    };

	    Point.prototype.isEqual = function(other) {
	      if (!other) {
	        return false;
	      }
	      other = Point.fromObject(other);
	      return this.row === other.row && this.column === other.column;
	    };

	    Point.prototype.isLessThan = function(other) {
	      return this.compare(other) < 0;
	    };

	    Point.prototype.isLessThanOrEqual = function(other) {
	      return this.compare(other) <= 0;
	    };

	    Point.prototype.isGreaterThan = function(other) {
	      return this.compare(other) > 0;
	    };

	    Point.prototype.isGreaterThanOrEqual = function(other) {
	      return this.compare(other) >= 0;
	    };


	    /*
	    Section: Conversion
	     */

	    Point.prototype.toArray = function() {
	      return [this.row, this.column];
	    };

	    Point.prototype.serialize = function() {
	      return this.toArray();
	    };

	    Point.prototype.toString = function() {
	      return "(" + this.row + ", " + this.column + ")";
	    };

	    return Point;

	  })();

	}).call(this);


/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	(function() {
	  var Grim, Point, Range, newlineRegex,
	    __slice = [].slice;

	  Grim = __webpack_require__(14);

	  Point = __webpack_require__(1);

	  newlineRegex = __webpack_require__(6).newlineRegex;

	  module.exports = Range = (function() {

	    /*
	    Section: Construction
	     */
	    Range.fromObject = function(object, copy) {
	      if (Array.isArray(object)) {
	        return new this(object[0], object[1]);
	      } else if (object instanceof this) {
	        if (copy) {
	          return object.copy();
	        } else {
	          return object;
	        }
	      } else {
	        return new this(object.start, object.end);
	      }
	    };

	    Range.fromText = function() {
	      var args, endPoint, lastIndex, lines, startPoint, text;
	      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
	      if (args.length > 1) {
	        startPoint = Point.fromObject(args.shift());
	      } else {
	        startPoint = new Point(0, 0);
	      }
	      text = args.shift();
	      endPoint = startPoint.copy();
	      lines = text.split(newlineRegex);
	      if (lines.length > 1) {
	        lastIndex = lines.length - 1;
	        endPoint.row += lastIndex;
	        endPoint.column = lines[lastIndex].length;
	      } else {
	        endPoint.column += lines[0].length;
	      }
	      return new this(startPoint, endPoint);
	    };

	    Range.fromPointWithDelta = function(startPoint, rowDelta, columnDelta) {
	      var endPoint;
	      startPoint = Point.fromObject(startPoint);
	      endPoint = new Point(startPoint.row + rowDelta, startPoint.column + columnDelta);
	      return new this(startPoint, endPoint);
	    };


	    /*
	    Section: Serialization and Deserialization
	     */

	    Range.deserialize = function(array) {
	      if (Array.isArray(array)) {
	        return new this(array[0], array[1]);
	      } else {
	        return new this();
	      }
	    };


	    /*
	    Section: Construction
	     */

	    function Range(pointA, pointB) {
	      if (pointA == null) {
	        pointA = new Point(0, 0);
	      }
	      if (pointB == null) {
	        pointB = new Point(0, 0);
	      }
	      pointA = Point.fromObject(pointA);
	      pointB = Point.fromObject(pointB);
	      if (pointA.isLessThanOrEqual(pointB)) {
	        this.start = pointA;
	        this.end = pointB;
	      } else {
	        this.start = pointB;
	        this.end = pointA;
	      }
	    }

	    Range.prototype.copy = function() {
	      return new this.constructor(this.start.copy(), this.end.copy());
	    };


	    /*
	    Section: Serialization and Deserialization
	     */

	    Range.prototype.serialize = function() {
	      return [this.start.serialize(), this.end.serialize()];
	    };


	    /*
	    Section: Range Details
	     */

	    Range.prototype.isEmpty = function() {
	      return this.start.isEqual(this.end);
	    };

	    Range.prototype.isSingleLine = function() {
	      return this.start.row === this.end.row;
	    };

	    Range.prototype.getRowCount = function() {
	      return this.end.row - this.start.row + 1;
	    };

	    Range.prototype.getRows = function() {
	      var _i, _ref, _ref1, _results;
	      return (function() {
	        _results = [];
	        for (var _i = _ref = this.start.row, _ref1 = this.end.row; _ref <= _ref1 ? _i <= _ref1 : _i >= _ref1; _ref <= _ref1 ? _i++ : _i--){ _results.push(_i); }
	        return _results;
	      }).apply(this);
	    };


	    /*
	    Section: Operations
	     */

	    Range.prototype.freeze = function() {
	      this.start.freeze();
	      this.end.freeze();
	      return Object.freeze(this);
	    };

	    Range.prototype.union = function(otherRange) {
	      var end, start;
	      start = this.start.isLessThan(otherRange.start) ? this.start : otherRange.start;
	      end = this.end.isGreaterThan(otherRange.end) ? this.end : otherRange.end;
	      return new this.constructor(start, end);
	    };

	    Range.prototype.translate = function(startDelta, endDelta) {
	      if (endDelta == null) {
	        endDelta = startDelta;
	      }
	      return new this.constructor(this.start.translate(startDelta), this.end.translate(endDelta));
	    };

	    Range.prototype.traverse = function(delta) {
	      return new this.constructor(this.start.traverse(delta), this.end.traverse(delta));
	    };

	    Range.prototype.add = function(delta) {
	      Grim.deprecate("Use Range::traverse instead");
	      return this.traverse(delta);
	    };


	    /*
	    Section: Comparison
	     */

	    Range.prototype.compare = function(other) {
	      var value;
	      other = this.constructor.fromObject(other);
	      if (value = this.start.compare(other.start)) {
	        return value;
	      } else {
	        return other.end.compare(this.end);
	      }
	    };

	    Range.prototype.isEqual = function(other) {
	      if (other == null) {
	        return false;
	      }
	      other = this.constructor.fromObject(other);
	      return other.start.isEqual(this.start) && other.end.isEqual(this.end);
	    };

	    Range.prototype.coversSameRows = function(other) {
	      return this.start.row === other.start.row && this.end.row === other.end.row;
	    };

	    Range.prototype.intersectsWith = function(otherRange, exclusive) {
	      if (exclusive) {
	        return !(this.end.isLessThanOrEqual(otherRange.start) || this.start.isGreaterThanOrEqual(otherRange.end));
	      } else {
	        return !(this.end.isLessThan(otherRange.start) || this.start.isGreaterThan(otherRange.end));
	      }
	    };

	    Range.prototype.containsRange = function(otherRange, exclusive) {
	      var end, start, _ref;
	      _ref = this.constructor.fromObject(otherRange), start = _ref.start, end = _ref.end;
	      return this.containsPoint(start, exclusive) && this.containsPoint(end, exclusive);
	    };

	    Range.prototype.containsPoint = function(point, exclusive) {
	      if ((exclusive != null) && typeof exclusive === 'object') {
	        Grim.deprecate("The second param is no longer an object, it's a boolean argument named `exclusive`.");
	        exclusive = exclusive.exclusive;
	      }
	      point = Point.fromObject(point);
	      if (exclusive) {
	        return point.isGreaterThan(this.start) && point.isLessThan(this.end);
	      } else {
	        return point.isGreaterThanOrEqual(this.start) && point.isLessThanOrEqual(this.end);
	      }
	    };

	    Range.prototype.intersectsRow = function(row) {
	      return (this.start.row <= row && row <= this.end.row);
	    };

	    Range.prototype.intersectsRowRange = function(startRow, endRow) {
	      var _ref;
	      if (startRow > endRow) {
	        _ref = [endRow, startRow], startRow = _ref[0], endRow = _ref[1];
	      }
	      return this.end.row >= startRow && endRow >= this.start.row;
	    };


	    /*
	    Section: Conversion
	     */

	    Range.prototype.toDelta = function() {
	      var columns, rows;
	      rows = this.end.row - this.start.row;
	      if (rows === 0) {
	        columns = this.end.column - this.start.column;
	      } else {
	        columns = this.end.column;
	      }
	      return new Point(rows, columns);
	    };

	    Range.prototype.toString = function() {
	      return "[" + this.start + " - " + this.end + "]";
	    };

	    return Range;

	  })();

	}).call(this);


/***/ },
/* 3 */
/***/ function(module, exports, __webpack_require__) {

	(function() {
	  var BufferPatch, Checkpoint, History, Serializable, Transaction, TransactionAborted, last,
	    __hasProp = {}.hasOwnProperty,
	    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
	    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

	  Serializable = __webpack_require__(15);

	  Transaction = __webpack_require__(7);

	  BufferPatch = __webpack_require__(5);

	  Checkpoint = __webpack_require__(8);

	  last = __webpack_require__(12).last;

	  TransactionAborted = new Error("Transaction Aborted");

	  module.exports = History = (function(_super) {
	    __extends(History, _super);

	    History.registerDeserializers(Transaction, BufferPatch);

	    History.prototype.currentTransaction = null;

	    History.prototype.transactionDepth = 0;

	    History.prototype.transactCallDepth = 0;

	    function History(buffer, undoStack, redoStack) {
	      this.buffer = buffer;
	      this.undoStack = undoStack != null ? undoStack : [];
	      this.redoStack = redoStack != null ? redoStack : [];
	    }

	    History.prototype.serializeParams = function() {
	      return {
	        undoStack: this.undoStack.map(function(patch) {
	          return patch.serialize();
	        }),
	        redoStack: this.redoStack.map(function(patch) {
	          return patch.serialize();
	        })
	      };
	    };

	    History.prototype.deserializeParams = function(params) {
	      params.undoStack = params.undoStack.map((function(_this) {
	        return function(patchState) {
	          return _this.constructor.deserialize(patchState);
	        };
	      })(this));
	      params.redoStack = params.redoStack.map((function(_this) {
	        return function(patchState) {
	          return _this.constructor.deserialize(patchState);
	        };
	      })(this));
	      return params;
	    };

	    History.prototype.recordNewPatch = function(patch) {
	      if (this.currentTransaction != null) {
	        this.currentTransaction.push(patch);
	        if (patch instanceof BufferPatch) {
	          return this.clearRedoStack();
	        }
	      } else {
	        this.undoStack.push(patch);
	        return this.clearRedoStack();
	      }
	    };

	    History.prototype.undo = function() {
	      var inverse, patch;
	      if (this.currentTransaction != null) {
	        throw new Error("Can't undo with an open transaction");
	      }
	      if (last(this.undoStack) instanceof Checkpoint) {
	        if (!(this.undoStack.length > 1)) {
	          return;
	        }
	        this.redoStack.push(this.undoStack.pop());
	      }
	      if (patch = this.undoStack.pop()) {
	        inverse = patch.invert(this.buffer);
	        this.redoStack.push(inverse);
	        return inverse.applyTo(this.buffer);
	      }
	    };

	    History.prototype.redo = function() {
	      var inverse, patch;
	      if (this.currentTransaction != null) {
	        throw new Error("Can't redo with an open transaction");
	      }
	      if (patch = this.redoStack.pop()) {
	        inverse = patch.invert(this.buffer);
	        this.undoStack.push(inverse);
	        inverse.applyTo(this.buffer);
	        if (last(this.redoStack) instanceof Checkpoint) {
	          return this.undoStack.push(this.redoStack.pop());
	        }
	      }
	    };

	    History.prototype.transact = function(groupingInterval, fn) {
	      var error, result;
	      if (fn == null) {
	        fn = groupingInterval;
	        groupingInterval = void 0;
	      }
	      this.beginTransaction(groupingInterval);
	      try {
	        ++this.transactCallDepth;
	        result = fn();
	        --this.transactCallDepth;
	        this.commitTransaction();
	        return result;
	      } catch (_error) {
	        error = _error;
	        if (--this.transactCallDepth === 0) {
	          this.abortTransaction();
	          if (error !== TransactionAborted) {
	            throw error;
	          }
	        } else {
	          throw error;
	        }
	      }
	    };

	    History.prototype.beginTransaction = function(groupingInterval) {
	      if (++this.transactionDepth === 1) {
	        return this.currentTransaction = new Transaction([], groupingInterval);
	      }
	    };

	    History.prototype.commitTransaction = function() {
	      var lastTransaction, _base;
	      if (!(this.transactionDepth > 0)) {
	        throw new Error("No transaction is open");
	      }
	      if (--this.transactionDepth === 0) {
	        if (this.currentTransaction.hasBufferPatches()) {
	          lastTransaction = last(this.undoStack);
	          if ((typeof (_base = this.currentTransaction).isOpenForGrouping === "function" ? _base.isOpenForGrouping() : void 0) && (lastTransaction != null ? typeof lastTransaction.isOpenForGrouping === "function" ? lastTransaction.isOpenForGrouping() : void 0 : void 0)) {
	            lastTransaction.merge(this.currentTransaction);
	          } else {
	            this.undoStack.push(this.currentTransaction);
	          }
	        }
	        return this.currentTransaction = null;
	      }
	    };

	    History.prototype.abortTransaction = function() {
	      var inverse;
	      if (!(this.transactionDepth > 0)) {
	        throw new Error("No transaction is open");
	      }
	      if (this.transactCallDepth === 0) {
	        inverse = this.currentTransaction.invert(this.buffer);
	        this.currentTransaction = null;
	        this.transactionDepth = 0;
	        return inverse.applyTo(this.buffer);
	      } else {
	        throw TransactionAborted;
	      }
	    };

	    History.prototype.createCheckpoint = function() {
	      var checkpoint;
	      if (this.isTransacting()) {
	        throw new Error("Cannot create a checkpoint inside of a transaction");
	      }
	      if (last(this.undoStack) instanceof Checkpoint) {
	        return last(this.undoStack);
	      } else {
	        checkpoint = new Checkpoint;
	        this.undoStack.push(checkpoint);
	        return checkpoint;
	      }
	    };

	    History.prototype.revertToCheckpoint = function(checkpoint) {
	      if (__indexOf.call(this.undoStack, checkpoint) >= 0) {
	        while (last(this.undoStack) !== checkpoint) {
	          this.undo();
	        }
	        this.clearRedoStack();
	        return true;
	      } else {
	        return false;
	      }
	    };

	    History.prototype.groupChangesSinceCheckpoint = function(checkpoint) {
	      var groupedTransaction, index, patch, _i, _len, _ref;
	      groupedTransaction = new Transaction;
	      index = this.undoStack.indexOf(checkpoint) + 1;
	      if (index === 0) {
	        return false;
	      }
	      if (index === this.undoStack.length) {
	        return false;
	      }
	      _ref = this.undoStack.splice(index, this.undoStack.length - index);
	      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
	        patch = _ref[_i];
	        if (!(patch instanceof Checkpoint)) {
	          groupedTransaction.merge(patch);
	        }
	      }
	      this.undoStack.push(groupedTransaction);
	      return true;
	    };

	    History.prototype.isTransacting = function() {
	      return this.currentTransaction != null;
	    };

	    History.prototype.clearUndoStack = function() {
	      return this.undoStack.length = 0;
	    };

	    History.prototype.clearRedoStack = function() {
	      return this.redoStack.length = 0;
	    };

	    return History;

	  })(Serializable);

	}).call(this);


/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	(function() {
	  var Delegator, IntervalSkipList, Marker, MarkerManager, Point, Range, Serializable, clone, compact, defaults, intersection, keys, max, omit, size, values, _ref;

	  IntervalSkipList = __webpack_require__(20);

	  Serializable = __webpack_require__(15);

	  Delegator = __webpack_require__(13);

	  _ref = __webpack_require__(12), omit = _ref.omit, defaults = _ref.defaults, values = _ref.values, clone = _ref.clone, compact = _ref.compact, intersection = _ref.intersection, keys = _ref.keys, max = _ref.max, size = _ref.size;

	  Marker = __webpack_require__(9);

	  Point = __webpack_require__(1);

	  Range = __webpack_require__(2);

	  module.exports = MarkerManager = (function() {
	    Serializable.includeInto(MarkerManager);

	    Delegator.includeInto(MarkerManager);

	    MarkerManager.delegatesMethods('clipPosition', 'clipRange', {
	      toProperty: 'buffer'
	    });

	    MarkerManager.prototype.nextMarkerId = 1;

	    function MarkerManager(buffer, markers) {
	      this.buffer = buffer;
	      this.markers = markers;
	      if (this.intervals == null) {
	        this.intervals = this.buildIntervals();
	      }
	      if (this.markers != null) {
	        this.nextMarkerId = max(keys(this.markers).map(function(id) {
	          return parseInt(id);
	        })) + 1;
	      } else {
	        this.markers = {};
	      }
	    }

	    MarkerManager.prototype.buildIntervals = function() {
	      return new IntervalSkipList({
	        compare: function(a, b) {
	          return a.compare(b);
	        },
	        minIndex: new Point(-Infinity, -Infinity),
	        maxIndex: new Point(Infinity, Infinity)
	      });
	    };

	    MarkerManager.prototype.serializeParams = function() {
	      var id, marker, markers, _ref1;
	      markers = {};
	      _ref1 = this.markers;
	      for (id in _ref1) {
	        marker = _ref1[id];
	        if (marker.persistent) {
	          markers[id] = marker.serialize();
	        }
	      }
	      return {
	        markers: markers
	      };
	    };

	    MarkerManager.prototype.deserializeParams = function(state) {
	      var id, markerState, _ref1;
	      this.intervals = this.buildIntervals();
	      _ref1 = state.markers;
	      for (id in _ref1) {
	        markerState = _ref1[id];
	        state.markers[id] = Marker.deserialize(markerState, {
	          manager: this
	        });
	      }
	      return state;
	    };

	    MarkerManager.prototype.markRange = function(range, properties) {
	      var params;
	      range = this.clipRange(Range.fromObject(range, true)).freeze();
	      params = Marker.extractParams(properties);
	      params.range = range;
	      return this.createMarker(params);
	    };

	    MarkerManager.prototype.markPosition = function(position, properties) {
	      return this.markRange(new Range(position, position), defaults({
	        tailed: false
	      }, properties));
	    };

	    MarkerManager.prototype.getMarker = function(id) {
	      return this.markers[id];
	    };

	    MarkerManager.prototype.getMarkers = function() {
	      return values(this.markers);
	    };

	    MarkerManager.prototype.getMarkerCount = function() {
	      return size(this.markers);
	    };

	    MarkerManager.prototype.findMarkers = function(params) {
	      var candidateIds, candidates, endRow, key, markers, range, startRow, value;
	      params = clone(params);
	      candidateIds = [];
	      for (key in params) {
	        value = params[key];
	        switch (key) {
	          case 'startPosition':
	            candidateIds.push(this.intervals.findStartingAt(Point.fromObject(value)));
	            delete params[key];
	            break;
	          case 'endPosition':
	            candidateIds.push(this.intervals.findEndingAt(Point.fromObject(value)));
	            delete params[key];
	            break;
	          case 'containsPoint':
	            candidateIds.push(this.intervals.findContaining(Point.fromObject(value)));
	            delete params[key];
	            break;
	          case 'containsRange':
	            range = Range.fromObject(value);
	            candidateIds.push(this.intervals.findContaining(range.start, range.end));
	            delete params[key];
	            break;
	          case 'intersectsRange':
	            range = Range.fromObject(value);
	            candidateIds.push(this.intervals.findIntersecting(range.start, range.end));
	            delete params[key];
	            break;
	          case 'containedInRange':
	            range = Range.fromObject(value);
	            candidateIds.push(this.intervals.findContainedIn(range.start, range.end));
	            delete params[key];
	            break;
	          case 'startRow':
	            candidateIds.push(this.intervals.findStartingIn(new Point(value, 0), new Point(value, Infinity)));
	            delete params[key];
	            break;
	          case 'endRow':
	            candidateIds.push(this.intervals.findEndingIn(new Point(value, 0), new Point(value, Infinity)));
	            delete params[key];
	            break;
	          case 'intersectsRow':
	            candidateIds.push(this.intervals.findIntersecting(new Point(value, 0), new Point(value, Infinity)));
	            delete params[key];
	            break;
	          case 'intersectsRowRange':
	            startRow = value[0], endRow = value[1];
	            candidateIds.push(this.intervals.findIntersecting(new Point(startRow, 0), new Point(endRow, Infinity)));
	            delete params[key];
	        }
	      }
	      if (candidateIds.length > 0) {
	        candidates = compact(intersection.apply(null, candidateIds).map((function(_this) {
	          return function(id) {
	            return _this.getMarker(id);
	          };
	        })(this)));
	      } else {
	        candidates = this.getMarkers();
	      }
	      markers = candidates.filter(function(marker) {
	        return marker.matchesParams(params);
	      });
	      return markers.sort(function(a, b) {
	        return a.compare(b);
	      });
	    };

	    MarkerManager.prototype.createMarker = function(params) {
	      var marker;
	      params.manager = this;
	      params.id = this.nextMarkerId++;
	      marker = new Marker(params);
	      this.markers[marker.id] = marker;
	      this.buffer.markerCreated(marker);
	      return marker;
	    };

	    MarkerManager.prototype.removeMarker = function(id) {
	      return delete this.markers[id];
	    };

	    MarkerManager.prototype.recordMarkerPatch = function(patch) {
	      if (this.buffer.isTransacting()) {
	        return this.buffer.history.recordNewPatch(patch);
	      }
	    };

	    MarkerManager.prototype.handleBufferChange = function(patch) {
	      var id, marker, _ref1, _results;
	      _ref1 = this.markers;
	      _results = [];
	      for (id in _ref1) {
	        marker = _ref1[id];
	        _results.push(marker.handleBufferChange(patch));
	      }
	      return _results;
	    };

	    MarkerManager.prototype.applyPatches = function(markerPatches, textChanged) {
	      var id, patch, _ref1, _results;
	      _results = [];
	      for (id in markerPatches) {
	        patch = markerPatches[id];
	        _results.push((_ref1 = this.getMarker(id)) != null ? _ref1.applyPatch(patch, textChanged) : void 0);
	      }
	      return _results;
	    };

	    MarkerManager.prototype.pauseChangeEvents = function() {
	      var marker, _i, _len, _ref1, _results;
	      _ref1 = this.getMarkers();
	      _results = [];
	      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
	        marker = _ref1[_i];
	        _results.push(marker.pauseChangeEvents());
	      }
	      return _results;
	    };

	    MarkerManager.prototype.resumeChangeEvents = function() {
	      var marker, _i, _len, _ref1, _results;
	      _ref1 = this.getMarkers();
	      _results = [];
	      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
	        marker = _ref1[_i];
	        _results.push(marker.resumeChangeEvents());
	      }
	      return _results;
	    };

	    return MarkerManager;

	  })();

	}).call(this);


/***/ },
/* 5 */
/***/ function(module, exports, __webpack_require__) {

	(function() {
	  var BufferPatch, Range, Serializable,
	    __hasProp = {}.hasOwnProperty,
	    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

	  Serializable = __webpack_require__(15);

	  Range = __webpack_require__(2);

	  module.exports = BufferPatch = (function(_super) {
	    __extends(BufferPatch, _super);

	    function BufferPatch(oldRange, newRange, oldText, newText, normalizeLineEndings, markerPatches) {
	      this.oldRange = oldRange;
	      this.newRange = newRange;
	      this.oldText = oldText;
	      this.newText = newText;
	      this.normalizeLineEndings = normalizeLineEndings;
	      this.markerPatches = markerPatches != null ? markerPatches : {};
	    }

	    BufferPatch.prototype.serializeParams = function() {
	      var id, markerPatches, newRange, oldRange, patch, _i, _len, _ref;
	      oldRange = this.oldRange.serialize();
	      newRange = this.newRange.serialize();
	      markerPatches = {};
	      _ref = this.markerPatches;
	      for (patch = _i = 0, _len = _ref.length; _i < _len; patch = ++_i) {
	        id = _ref[patch];
	        markerPatches[id] = patch.serialize();
	      }
	      return {
	        oldRange: oldRange,
	        newRange: newRange,
	        oldText: this.oldText,
	        newText: this.newText,
	        normalizeLineEndings: this.normalizeLineEndings,
	        markerPatches: markerPatches
	      };
	    };

	    BufferPatch.prototype.deserializeParams = function(params) {
	      var id, patchState, _i, _len, _ref;
	      params.oldRange = Range.deserialize(params.oldRange);
	      params.newRange = Range.deserialize(params.newRange);
	      _ref = params.markerPatches;
	      for (patchState = _i = 0, _len = _ref.length; _i < _len; patchState = ++_i) {
	        id = _ref[patchState];
	        params.markerPatches[id] = MarkerPatch.deserialize(patchState);
	      }
	      return params;
	    };

	    BufferPatch.prototype.invert = function(buffer) {
	      var id, invertedPatch, marker, markerPatches, patch, _i, _len, _ref, _ref1;
	      markerPatches = {};
	      _ref = this.markerPatches;
	      for (id in _ref) {
	        patch = _ref[id];
	        markerPatches[id] = patch.invert();
	      }
	      invertedPatch = new this.constructor(this.newRange, this.oldRange, this.newText, this.oldText, this.normalizeLineEndings, markerPatches);
	      _ref1 = buffer.getMarkers();
	      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
	        marker = _ref1[_i];
	        if (this.markerPatches[marker.id] == null) {
	          marker.handleBufferChange(invertedPatch);
	        }
	      }
	      return invertedPatch;
	    };

	    BufferPatch.prototype.applyTo = function(buffer) {
	      return buffer.applyPatch(this);
	    };

	    BufferPatch.prototype.addMarkerPatch = function(patch) {
	      return this.markerPatches[patch.id] = patch;
	    };

	    return BufferPatch;

	  })(Serializable);

	}).call(this);


/***/ },
/* 6 */
/***/ function(module, exports, __webpack_require__) {

	(function() {
	  var SpliceArrayChunkSize,
	    __slice = [].slice;

	  SpliceArrayChunkSize = 100000;

	  module.exports = {
	    spliceArray: function(originalArray, start, length, insertedArray) {
	      var chunk, chunkEnd, chunkStart, removedValues, _i, _ref;
	      if (insertedArray == null) {
	        insertedArray = [];
	      }
	      if (insertedArray.length < SpliceArrayChunkSize) {
	        return originalArray.splice.apply(originalArray, [start, length].concat(__slice.call(insertedArray)));
	      } else {
	        removedValues = originalArray.splice(start, length);
	        for (chunkStart = _i = 0, _ref = insertedArray.length; SpliceArrayChunkSize > 0 ? _i <= _ref : _i >= _ref; chunkStart = _i += SpliceArrayChunkSize) {
	          chunkEnd = chunkStart + SpliceArrayChunkSize;
	          chunk = insertedArray.slice(chunkStart, chunkEnd);
	          originalArray.splice.apply(originalArray, [start + chunkStart, 0].concat(__slice.call(chunk)));
	        }
	        return removedValues;
	      }
	    },
	    newlineRegex: /\r\n|\n|\r/g
	  };

	}).call(this);


/***/ },
/* 7 */
/***/ function(module, exports, __webpack_require__) {

	(function() {
	  var BufferPatch, MarkerPatch, Serializable, Transaction, find,
	    __hasProp = {}.hasOwnProperty,
	    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

	  find = __webpack_require__(12).find;

	  Serializable = __webpack_require__(15);

	  BufferPatch = __webpack_require__(5);

	  MarkerPatch = __webpack_require__(19);

	  module.exports = Transaction = (function(_super) {
	    __extends(Transaction, _super);

	    Transaction.registerDeserializers(BufferPatch, MarkerPatch);

	    function Transaction(patches, groupingInterval) {
	      this.patches = patches != null ? patches : [];
	      if (groupingInterval == null) {
	        groupingInterval = 0;
	      }
	      this.groupingExpirationTime = Date.now() + groupingInterval;
	    }

	    Transaction.prototype.serializeParams = function() {
	      return {
	        patches: this.patches.map(function(patch) {
	          return patch.serialize();
	        })
	      };
	    };

	    Transaction.prototype.deserializeParams = function(params) {
	      params.patches = params.patches.map((function(_this) {
	        return function(patchState) {
	          return _this.constructor.deserialize(patchState);
	        };
	      })(this));
	      return params;
	    };

	    Transaction.prototype.push = function(patch) {
	      return this.patches.push(patch);
	    };

	    Transaction.prototype.invert = function(buffer) {
	      return new this.constructor(this.patches.map(function(patch) {
	        return patch.invert(buffer);
	      }).reverse());
	    };

	    Transaction.prototype.applyTo = function(buffer) {
	      var patch, _i, _len, _ref, _results;
	      _ref = this.patches;
	      _results = [];
	      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
	        patch = _ref[_i];
	        _results.push(patch.applyTo(buffer));
	      }
	      return _results;
	    };

	    Transaction.prototype.hasBufferPatches = function() {
	      return find(this.patches, function(patch) {
	        return patch instanceof BufferPatch;
	      });
	    };

	    Transaction.prototype.merge = function(patch) {
	      var subpatch, _i, _len, _ref;
	      if (patch instanceof Transaction) {
	        _ref = patch.patches;
	        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
	          subpatch = _ref[_i];
	          this.push(subpatch);
	        }
	        return this.groupingExpirationTime = patch.groupingExpirationTime, patch;
	      } else {
	        return this.push(patch);
	      }
	    };

	    Transaction.prototype.isOpenForGrouping = function() {
	      return this.groupingExpirationTime > Date.now();
	    };

	    return Transaction;

	  })(Serializable);

	}).call(this);


/***/ },
/* 8 */
/***/ function(module, exports, __webpack_require__) {

	(function() {
	  var Checkpoint;

	  module.exports = Checkpoint = (function() {
	    function Checkpoint() {}

	    return Checkpoint;

	  })();

	}).call(this);


/***/ },
/* 9 */
/***/ function(module, exports, __webpack_require__) {

	(function() {
	  var Delegator, Emitter, EmitterMixin, Grim, Marker, MarkerPatch, OptionKeys, Point, Range, Serializable, extend, isEqual, omit, pick, size, _ref,
	    __slice = [].slice;

	  _ref = __webpack_require__(12), extend = _ref.extend, isEqual = _ref.isEqual, omit = _ref.omit, pick = _ref.pick, size = _ref.size;

	  EmitterMixin = __webpack_require__(16).Emitter;

	  Emitter = __webpack_require__(17).Emitter;

	  Grim = __webpack_require__(14);

	  Delegator = __webpack_require__(13);

	  Serializable = __webpack_require__(15);

	  MarkerPatch = __webpack_require__(19);

	  Point = __webpack_require__(1);

	  Range = __webpack_require__(2);

	  OptionKeys = ['reversed', 'tailed', 'invalidate', 'persistent'];

	  module.exports = Marker = (function() {
	    EmitterMixin.includeInto(Marker);

	    Delegator.includeInto(Marker);

	    Serializable.includeInto(Marker);

	    Marker.extractParams = function(inputParams) {
	      var outputParams, properties;
	      outputParams = {};
	      if (inputParams != null) {
	        this.handleDeprecatedParams(inputParams);
	        extend(outputParams, pick(inputParams, OptionKeys));
	        properties = omit(inputParams, OptionKeys);
	        if (size(properties) > 0) {
	          outputParams.properties = properties;
	        }
	      }
	      return outputParams;
	    };

	    Marker.handleDeprecatedParams = function(params) {
	      if (params.isReversed != null) {
	        Grim.deprecate("The option `isReversed` is deprecated, use `reversed` instead");
	        params.reversed = params.isReversed;
	        delete params.isReversed;
	      }
	      if (params.hasTail != null) {
	        Grim.deprecate("The option `hasTail` is deprecated, use `tailed` instead");
	        params.tailed = params.hasTail;
	        delete params.hasTail;
	      }
	      if (params.persist != null) {
	        Grim.deprecate("The option `persist` is deprecated, use `persistent` instead");
	        params.persistent = params.persist;
	        delete params.persist;
	      }
	      if (params.invalidation) {
	        Grim.deprecate("The option `invalidation` is deprecated, use `invalidate` instead");
	        params.invalidate = params.invalidation;
	        return delete params.invalidation;
	      }
	    };

	    Marker.delegatesMethods('containsPoint', 'containsRange', 'intersectsRow', {
	      toProperty: 'range'
	    });

	    Marker.delegatesMethods('clipPosition', 'clipRange', {
	      toProperty: 'manager'
	    });

	    Marker.prototype.deferredChangeEvents = null;

	    function Marker(params) {
	      this.manager = params.manager, this.id = params.id, this.range = params.range, this.tailed = params.tailed, this.reversed = params.reversed;
	      this.valid = params.valid, this.invalidate = params.invalidate, this.persistent = params.persistent, this.properties = params.properties;
	      this.emitter = new Emitter;
	      if (this.tailed == null) {
	        this.tailed = true;
	      }
	      if (this.reversed == null) {
	        this.reversed = false;
	      }
	      if (this.valid == null) {
	        this.valid = true;
	      }
	      if (this.invalidate == null) {
	        this.invalidate = 'overlap';
	      }
	      if (this.persistent == null) {
	        this.persistent = true;
	      }
	      if (this.properties == null) {
	        this.properties = {};
	      }
	      this.destroyed = false;
	      Object.freeze(this.properties);
	      this.updateIntervals();
	    }

	    Marker.prototype.serializeParams = function() {
	      var range;
	      range = this.range.serialize();
	      return {
	        id: this.id,
	        range: range,
	        tailed: this.tailed,
	        reversed: this.reversed,
	        valid: this.valid,
	        invalidate: this.invalidate,
	        persistent: this.persistent,
	        properties: this.properties
	      };
	    };

	    Marker.prototype.deserializeParams = function(state) {
	      state.range = Range.deserialize(state.range);
	      return state;
	    };

	    Marker.prototype.onDidDestroy = function(callback) {
	      return this.emitter.on('did-destroy', callback);
	    };

	    Marker.prototype.onDidChange = function(callback) {
	      return this.emitter.on('did-change', callback);
	    };

	    Marker.prototype.on = function(eventName) {
	      switch (eventName) {
	        case 'changed':
	          Grim.deprecate("Use Marker::onDidChange instead");
	          break;
	        case 'destroyed':
	          Grim.deprecate("Use Marker::onDidDestroy instead");
	          break;
	        default:
	          Grim.deprecate("Marker::on is deprecated. Use event subscription methods instead.");
	      }
	      return EmitterMixin.prototype.on.apply(this, arguments);
	    };

	    Marker.prototype.getRange = function() {
	      return this.range;
	    };

	    Marker.prototype.setRange = function(range, properties) {
	      var params;
	      params = this.extractParams(properties);
	      params.tailed = true;
	      params.range = this.clipRange(Range.fromObject(range, true));
	      return this.update(params);
	    };

	    Marker.prototype.getHeadPosition = function() {
	      if (this.reversed) {
	        return this.range.start;
	      } else {
	        return this.range.end;
	      }
	    };

	    Marker.prototype.setHeadPosition = function(position, properties) {
	      var params;
	      position = this.clipPosition(Point.fromObject(position, true));
	      params = this.extractParams(properties);
	      if (this.hasTail()) {
	        if (this.isReversed()) {
	          if (position.isLessThan(this.range.end)) {
	            params.range = new Range(position, this.range.end);
	          } else {
	            params.reversed = false;
	            params.range = new Range(this.range.end, position);
	          }
	        } else {
	          if (position.isLessThan(this.range.start)) {
	            params.reversed = true;
	            params.range = new Range(position, this.range.start);
	          } else {
	            params.range = new Range(this.range.start, position);
	          }
	        }
	      } else {
	        params.range = new Range(position, position);
	      }
	      return this.update(params);
	    };

	    Marker.prototype.getTailPosition = function() {
	      if (this.hasTail()) {
	        if (this.reversed) {
	          return this.range.end;
	        } else {
	          return this.range.start;
	        }
	      } else {
	        return this.getHeadPosition();
	      }
	    };

	    Marker.prototype.setTailPosition = function(position, properties) {
	      var params;
	      position = this.clipPosition(Point.fromObject(position, true));
	      params = this.extractParams(properties);
	      params.tailed = true;
	      if (this.reversed) {
	        if (position.isLessThan(this.range.start)) {
	          params.reversed = false;
	          params.range = new Range(position, this.range.start);
	        } else {
	          params.range = new Range(this.range.start, position);
	        }
	      } else {
	        if (position.isLessThan(this.range.end)) {
	          params.range = new Range(position, this.range.end);
	        } else {
	          params.reversed = true;
	          params.range = new Range(this.range.end, position);
	        }
	      }
	      return this.update(params);
	    };

	    Marker.prototype.getStartPosition = function() {
	      if (this.reversed) {
	        return this.getHeadPosition();
	      } else {
	        return this.getTailPosition();
	      }
	    };

	    Marker.prototype.getEndPosition = function() {
	      if (this.reversed) {
	        return this.getTailPosition();
	      } else {
	        return this.getHeadPosition();
	      }
	    };

	    Marker.prototype.clearTail = function(properties) {
	      var headPosition, params;
	      params = this.extractParams(properties);
	      params.tailed = false;
	      headPosition = this.getHeadPosition();
	      params.range = new Range(headPosition, headPosition);
	      return this.update(params);
	    };

	    Marker.prototype.plantTail = function(properties) {
	      var params;
	      params = this.extractParams(properties);
	      if (!this.hasTail()) {
	        params.tailed = true;
	        params.range = new Range(this.getHeadPosition(), this.getHeadPosition());
	      }
	      return this.update(params);
	    };

	    Marker.prototype.isReversed = function() {
	      return this.tailed && this.reversed;
	    };

	    Marker.prototype.hasTail = function() {
	      return this.tailed;
	    };

	    Marker.prototype.isValid = function() {
	      return !this.isDestroyed() && this.valid;
	    };

	    Marker.prototype.isDestroyed = function() {
	      return this.destroyed;
	    };

	    Marker.prototype.isEqual = function(other) {
	      return isEqual(this.toParams(true), other.toParams(true));
	    };

	    Marker.prototype.getInvalidationStrategy = function() {
	      return this.invalidate;
	    };

	    Marker.prototype.getAttributes = function() {
	      Grim.deprecate("Use Marker::getProperties instead.");
	      return this.getProperties();
	    };

	    Marker.prototype.setAttributes = function() {
	      var args;
	      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
	      Grim.deprecate("Use Marker::setProperties instead.");
	      return this.setProperties.apply(this, args);
	    };

	    Marker.prototype.getProperties = function() {
	      return this.properties;
	    };

	    Marker.prototype.setProperties = function(properties) {
	      return this.update({
	        properties: extend({}, this.getProperties(), properties)
	      });
	    };

	    Marker.prototype.copy = function(params) {
	      return this.manager.createMarker(extend(this.toParams(), this.extractParams(params)));
	    };

	    Marker.prototype.destroy = function() {
	      this.destroyed = true;
	      this.manager.removeMarker(this.id);
	      this.manager.intervals.remove(this.id);
	      this.emitter.emit('did-destroy');
	      return this.emit('destroyed');
	    };

	    Marker.prototype.extractParams = function(params) {
	      params = this.constructor.extractParams(params);
	      if (params.properties != null) {
	        params.properties = extend({}, this.properties, params.properties);
	      }
	      return params;
	    };

	    Marker.prototype.compare = function(other) {
	      return this.range.compare(other.range);
	    };

	    Marker.prototype.matchesAttributes = function() {
	      var args;
	      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
	      return this.matchesParams.apply(this, args);
	    };

	    Marker.prototype.matchesParams = function(params) {
	      var key, value;
	      for (key in params) {
	        value = params[key];
	        if (!this.matchesParam(key, value)) {
	          return false;
	        }
	      }
	      return true;
	    };

	    Marker.prototype.matchesParam = function(key, value) {
	      switch (key) {
	        case 'startPosition':
	          return this.getStartPosition().isEqual(value);
	        case 'endPosition':
	          return this.getEndPosition().isEqual(value);
	        case 'containsPoint':
	        case 'containsPosition':
	          return this.containsPoint(value);
	        case 'containsRange':
	          return this.containsRange(value);
	        case 'startRow':
	          return this.getStartPosition().row === value;
	        case 'endRow':
	          return this.getEndPosition().row === value;
	        case 'intersectsRow':
	          return this.intersectsRow(value);
	        case 'invalidate':
	        case 'reversed':
	        case 'tailed':
	        case 'persistent':
	          return isEqual(this[key], value);
	        default:
	          return isEqual(this.properties[key], value);
	      }
	    };

	    Marker.prototype.toParams = function(omitId) {
	      var params;
	      params = {
	        range: this.range,
	        reversed: this.reversed,
	        tailed: this.tailed,
	        invalidate: this.invalidate,
	        persistent: this.persistent,
	        properties: this.properties
	      };
	      if (!omitId) {
	        params.id = this.id;
	      }
	      return params;
	    };

	    Marker.prototype.update = function(params) {
	      var patch;
	      if (patch = this.buildPatch(params)) {
	        this.manager.recordMarkerPatch(patch);
	        this.applyPatch(patch);
	        return true;
	      } else {
	        return false;
	      }
	    };

	    Marker.prototype.handleBufferChange = function(patch) {
	      var changePrecedesMarkerEnd, changePrecedesMarkerStart, changeSurroundsMarkerEnd, changeSurroundsMarkerStart, columnDelta, exclusive, markerEnd, markerPatch, markerStart, newMarkerRange, newRange, oldRange, rowDelta, valid;
	      oldRange = patch.oldRange, newRange = patch.newRange;
	      rowDelta = newRange.end.row - oldRange.end.row;
	      columnDelta = newRange.end.column - oldRange.end.column;
	      markerStart = this.range.start;
	      markerEnd = this.range.end;
	      if (markerEnd.isLessThan(oldRange.start)) {
	        return;
	      }
	      switch (this.getInvalidationStrategy()) {
	        case 'never':
	          valid = true;
	          break;
	        case 'surround':
	          valid = markerStart.isLessThan(oldRange.start) || oldRange.end.isLessThanOrEqual(markerEnd);
	          break;
	        case 'overlap':
	          valid = !oldRange.containsPoint(markerStart, true) && !oldRange.containsPoint(markerEnd, true);
	          break;
	        case 'inside':
	          if (this.hasTail()) {
	            valid = oldRange.end.isLessThanOrEqual(markerStart) || markerEnd.isLessThanOrEqual(oldRange.start);
	          } else {
	            valid = this.valid;
	          }
	          break;
	        case 'touch':
	          valid = oldRange.end.isLessThan(markerStart) || markerEnd.isLessThan(oldRange.start);
	      }
	      newMarkerRange = this.range.copy();
	      exclusive = !this.hasTail() || this.getInvalidationStrategy() === 'inside';
	      changePrecedesMarkerStart = oldRange.end.isLessThan(markerStart) || (exclusive && oldRange.end.isLessThanOrEqual(markerStart));
	      changeSurroundsMarkerStart = !changePrecedesMarkerStart && oldRange.start.isLessThan(markerStart);
	      changePrecedesMarkerEnd = changePrecedesMarkerStart || oldRange.end.isLessThan(markerEnd) || (!exclusive && oldRange.end.isLessThanOrEqual(markerEnd));
	      changeSurroundsMarkerEnd = !changePrecedesMarkerEnd && oldRange.start.isLessThan(markerEnd);
	      if (changePrecedesMarkerStart) {
	        newMarkerRange.start.row += rowDelta;
	        if (oldRange.end.row === markerStart.row) {
	          newMarkerRange.start.column += columnDelta;
	        }
	      } else if (changeSurroundsMarkerStart) {
	        newMarkerRange.start = newRange.end;
	      }
	      if (changePrecedesMarkerEnd) {
	        newMarkerRange.end.row += rowDelta;
	        if (oldRange.end.row === markerEnd.row) {
	          newMarkerRange.end.column += columnDelta;
	        }
	      } else if (changeSurroundsMarkerEnd) {
	        newMarkerRange.end = newRange.end;
	      }
	      if (markerPatch = this.buildPatch({
	        valid: valid,
	        range: newMarkerRange
	      })) {
	        return patch.addMarkerPatch(markerPatch);
	      }
	    };

	    Marker.prototype.buildPatch = function(newParams) {
	      var name, oldParams, value;
	      oldParams = {};
	      for (name in newParams) {
	        value = newParams[name];
	        if (isEqual(this[name], value)) {
	          delete newParams[name];
	        } else {
	          oldParams[name] = this[name];
	        }
	      }
	      if (size(newParams)) {
	        return new MarkerPatch(this.id, oldParams, newParams);
	      }
	    };

	    Marker.prototype.applyPatch = function(patch, textChanged) {
	      var event, hadTail, hasTail, isValid, newHeadPosition, newProperties, newTailPosition, oldHeadPosition, oldProperties, oldTailPosition, properties, range, reversed, tailed, updated, valid, wasValid, _ref1;
	      if (textChanged == null) {
	        textChanged = false;
	      }
	      oldHeadPosition = this.getHeadPosition();
	      oldTailPosition = this.getTailPosition();
	      wasValid = this.isValid();
	      hadTail = this.hasTail();
	      oldProperties = this.getProperties();
	      updated = false;
	      _ref1 = patch.newParams, range = _ref1.range, reversed = _ref1.reversed, tailed = _ref1.tailed, valid = _ref1.valid, properties = _ref1.properties;
	      if ((range != null) && !range.isEqual(this.range)) {
	        this.range = range.freeze();
	        this.updateIntervals();
	        updated = true;
	      }
	      if ((reversed != null) && reversed !== this.reversed) {
	        this.reversed = reversed;
	        updated = true;
	      }
	      if ((tailed != null) && tailed !== this.tailed) {
	        this.tailed = tailed;
	        updated = true;
	      }
	      if ((valid != null) && valid !== this.valid) {
	        this.valid = valid;
	        updated = true;
	      }
	      if ((properties != null) && !isEqual(properties, this.properties)) {
	        this.properties = Object.freeze(properties);
	        updated = true;
	      }
	      if (!updated) {
	        return false;
	      }
	      newHeadPosition = this.getHeadPosition();
	      newTailPosition = this.getTailPosition();
	      isValid = this.isValid();
	      hasTail = this.hasTail();
	      newProperties = this.getProperties();
	      event = {
	        oldHeadPosition: oldHeadPosition,
	        newHeadPosition: newHeadPosition,
	        oldTailPosition: oldTailPosition,
	        newTailPosition: newTailPosition,
	        wasValid: wasValid,
	        isValid: isValid,
	        hadTail: hadTail,
	        hasTail: hasTail,
	        oldProperties: oldProperties,
	        newProperties: newProperties,
	        textChanged: textChanged
	      };
	      if (this.deferredChangeEvents != null) {
	        this.deferredChangeEvents.push(event);
	      } else {
	        this.emitter.emit('did-change', event);
	        this.emit('changed', event);
	      }
	      return true;
	    };

	    Marker.prototype.updateIntervals = function() {
	      return this.manager.intervals.update(this.id, this.range.start, this.range.end);
	    };

	    Marker.prototype.pauseChangeEvents = function() {
	      return this.deferredChangeEvents = [];
	    };

	    Marker.prototype.resumeChangeEvents = function() {
	      var deferredChangeEvents, event, _i, _len, _results;
	      if (deferredChangeEvents = this.deferredChangeEvents) {
	        this.deferredChangeEvents = null;
	        _results = [];
	        for (_i = 0, _len = deferredChangeEvents.length; _i < _len; _i++) {
	          event = deferredChangeEvents[_i];
	          this.emitter.emit('did-change', event);
	          _results.push(this.emit('changed', event));
	        }
	        return _results;
	      }
	    };

	    return Marker;

	  })();

	}).call(this);


/***/ },
/* 10 */
/***/ function(module, exports, __webpack_require__) {

	/* See LICENSE file for terms of use */

	/*
	 * Text diff implementation.
	 *
	 * This library supports the following APIS:
	 * JsDiff.diffChars: Character by character diff
	 * JsDiff.diffWords: Word (as defined by \b regex) diff which ignores whitespace
	 * JsDiff.diffLines: Line based diff
	 *
	 * JsDiff.diffCss: Diff targeted at CSS content
	 *
	 * These methods are based on the implementation proposed in
	 * "An O(ND) Difference Algorithm and its Variations" (Myers, 1986).
	 * http://citeseerx.ist.psu.edu/viewdoc/summary?doi=10.1.1.4.6927
	 */
	var JsDiff = (function() {
	  /*jshint maxparams: 5*/
	  function clonePath(path) {
	    return { newPos: path.newPos, components: path.components.slice(0) };
	  }
	  function removeEmpty(array) {
	    var ret = [];
	    for (var i = 0; i < array.length; i++) {
	      if (array[i]) {
	        ret.push(array[i]);
	      }
	    }
	    return ret;
	  }
	  function escapeHTML(s) {
	    var n = s;
	    n = n.replace(/&/g, '&amp;');
	    n = n.replace(/</g, '&lt;');
	    n = n.replace(/>/g, '&gt;');
	    n = n.replace(/"/g, '&quot;');

	    return n;
	  }

	  var Diff = function(ignoreWhitespace) {
	    this.ignoreWhitespace = ignoreWhitespace;
	  };
	  Diff.prototype = {
	      diff: function(oldString, newString) {
	        // Handle the identity case (this is due to unrolling editLength == 0
	        if (newString === oldString) {
	          return [{ value: newString }];
	        }
	        if (!newString) {
	          return [{ value: oldString, removed: true }];
	        }
	        if (!oldString) {
	          return [{ value: newString, added: true }];
	        }

	        newString = this.tokenize(newString);
	        oldString = this.tokenize(oldString);

	        var newLen = newString.length, oldLen = oldString.length;
	        var maxEditLength = newLen + oldLen;
	        var bestPath = [{ newPos: -1, components: [] }];

	        // Seed editLength = 0
	        var oldPos = this.extractCommon(bestPath[0], newString, oldString, 0);
	        if (bestPath[0].newPos+1 >= newLen && oldPos+1 >= oldLen) {
	          return bestPath[0].components;
	        }

	        for (var editLength = 1; editLength <= maxEditLength; editLength++) {
	          for (var diagonalPath = -1*editLength; diagonalPath <= editLength; diagonalPath+=2) {
	            var basePath;
	            var addPath = bestPath[diagonalPath-1],
	                removePath = bestPath[diagonalPath+1];
	            oldPos = (removePath ? removePath.newPos : 0) - diagonalPath;
	            if (addPath) {
	              // No one else is going to attempt to use this value, clear it
	              bestPath[diagonalPath-1] = undefined;
	            }

	            var canAdd = addPath && addPath.newPos+1 < newLen;
	            var canRemove = removePath && 0 <= oldPos && oldPos < oldLen;
	            if (!canAdd && !canRemove) {
	              bestPath[diagonalPath] = undefined;
	              continue;
	            }

	            // Select the diagonal that we want to branch from. We select the prior
	            // path whose position in the new string is the farthest from the origin
	            // and does not pass the bounds of the diff graph
	            if (!canAdd || (canRemove && addPath.newPos < removePath.newPos)) {
	              basePath = clonePath(removePath);
	              this.pushComponent(basePath.components, oldString[oldPos], undefined, true);
	            } else {
	              basePath = clonePath(addPath);
	              basePath.newPos++;
	              this.pushComponent(basePath.components, newString[basePath.newPos], true, undefined);
	            }

	            var oldPos = this.extractCommon(basePath, newString, oldString, diagonalPath);

	            if (basePath.newPos+1 >= newLen && oldPos+1 >= oldLen) {
	              return basePath.components;
	            } else {
	              bestPath[diagonalPath] = basePath;
	            }
	          }
	        }
	      },

	      pushComponent: function(components, value, added, removed) {
	        var last = components[components.length-1];
	        if (last && last.added === added && last.removed === removed) {
	          // We need to clone here as the component clone operation is just
	          // as shallow array clone
	          components[components.length-1] =
	            {value: this.join(last.value, value), added: added, removed: removed };
	        } else {
	          components.push({value: value, added: added, removed: removed });
	        }
	      },
	      extractCommon: function(basePath, newString, oldString, diagonalPath) {
	        var newLen = newString.length,
	            oldLen = oldString.length,
	            newPos = basePath.newPos,
	            oldPos = newPos - diagonalPath;
	        while (newPos+1 < newLen && oldPos+1 < oldLen && this.equals(newString[newPos+1], oldString[oldPos+1])) {
	          newPos++;
	          oldPos++;

	          this.pushComponent(basePath.components, newString[newPos], undefined, undefined);
	        }
	        basePath.newPos = newPos;
	        return oldPos;
	      },

	      equals: function(left, right) {
	        var reWhitespace = /\S/;
	        if (this.ignoreWhitespace && !reWhitespace.test(left) && !reWhitespace.test(right)) {
	          return true;
	        } else {
	          return left === right;
	        }
	      },
	      join: function(left, right) {
	        return left + right;
	      },
	      tokenize: function(value) {
	        return value;
	      }
	  };

	  var CharDiff = new Diff();

	  var WordDiff = new Diff(true);
	  var WordWithSpaceDiff = new Diff();
	  WordDiff.tokenize = WordWithSpaceDiff.tokenize = function(value) {
	    return removeEmpty(value.split(/(\s+|\b)/));
	  };

	  var CssDiff = new Diff(true);
	  CssDiff.tokenize = function(value) {
	    return removeEmpty(value.split(/([{}:;,]|\s+)/));
	  };

	  var LineDiff = new Diff();
	  LineDiff.tokenize = function(value) {
	    var retLines = [];
	    var lines = value.split(/^/m);

	    for(var i = 0; i < lines.length; i++) {
	      var line = lines[i];
	      var lastLine = lines[i - 1];

	      if(line == '\n' && lastLine && lastLine.indexOf('\r') == lastLine.length - 1)
	        retLines[retLines.length - 1] += '\n';
	      else if(line)
	        retLines.push(line);
	    }

	    return retLines;
	  };

	  return {
	    Diff: Diff,

	    diffChars: function(oldStr, newStr) { return CharDiff.diff(oldStr, newStr); },
	    diffWords: function(oldStr, newStr) { return WordDiff.diff(oldStr, newStr); },
	    diffWordsWithSpace: function(oldStr, newStr) { return WordWithSpaceDiff.diff(oldStr, newStr); },
	    diffLines: function(oldStr, newStr) { return LineDiff.diff(oldStr, newStr); },

	    diffCss: function(oldStr, newStr) { return CssDiff.diff(oldStr, newStr); },

	    createPatch: function(fileName, oldStr, newStr, oldHeader, newHeader) {
	      var ret = [];

	      ret.push('Index: ' + fileName);
	      ret.push('===================================================================');
	      ret.push('--- ' + fileName + (typeof oldHeader === 'undefined' ? '' : '\t' + oldHeader));
	      ret.push('+++ ' + fileName + (typeof newHeader === 'undefined' ? '' : '\t' + newHeader));

	      var diff = LineDiff.diff(oldStr, newStr);
	      if (!diff[diff.length-1].value) {
	        diff.pop();   // Remove trailing newline add
	      }
	      diff.push({value: '', lines: []});   // Append an empty value to make cleanup easier

	      function contextLines(lines) {
	        return lines.map(function(entry) { return ' ' + entry; });
	      }
	      function eofNL(curRange, i, current) {
	        var last = diff[diff.length-2],
	            isLast = i === diff.length-2,
	            isLastOfType = i === diff.length-3 && (current.added !== last.added || current.removed !== last.removed);

	        // Figure out if this is the last line for the given file and missing NL
	        if (!/\n$/.test(current.value) && (isLast || isLastOfType)) {
	          curRange.push('\\ No newline at end of file');
	        }
	      }

	      var oldRangeStart = 0, newRangeStart = 0, curRange = [],
	          oldLine = 1, newLine = 1;
	      for (var i = 0; i < diff.length; i++) {
	        var current = diff[i],
	            lines = current.lines || current.value.replace(/\n$/, '').split('\n');
	        current.lines = lines;

	        if (current.added || current.removed) {
	          if (!oldRangeStart) {
	            var prev = diff[i-1];
	            oldRangeStart = oldLine;
	            newRangeStart = newLine;

	            if (prev) {
	              curRange = contextLines(prev.lines.slice(-4));
	              oldRangeStart -= curRange.length;
	              newRangeStart -= curRange.length;
	            }
	          }
	          curRange.push.apply(curRange, lines.map(function(entry) { return (current.added?'+':'-') + entry; }));
	          eofNL(curRange, i, current);

	          if (current.added) {
	            newLine += lines.length;
	          } else {
	            oldLine += lines.length;
	          }
	        } else {
	          if (oldRangeStart) {
	            // Close out any changes that have been output (or join overlapping)
	            if (lines.length <= 8 && i < diff.length-2) {
	              // Overlapping
	              curRange.push.apply(curRange, contextLines(lines));
	            } else {
	              // end the range and output
	              var contextSize = Math.min(lines.length, 4);
	              ret.push(
	                  '@@ -' + oldRangeStart + ',' + (oldLine-oldRangeStart+contextSize)
	                  + ' +' + newRangeStart + ',' + (newLine-newRangeStart+contextSize)
	                  + ' @@');
	              ret.push.apply(ret, curRange);
	              ret.push.apply(ret, contextLines(lines.slice(0, contextSize)));
	              if (lines.length <= 4) {
	                eofNL(ret, i, current);
	              }

	              oldRangeStart = 0;  newRangeStart = 0; curRange = [];
	            }
	          }
	          oldLine += lines.length;
	          newLine += lines.length;
	        }
	      }

	      return ret.join('\n') + '\n';
	    },

	    applyPatch: function(oldStr, uniDiff) {
	      var diffstr = uniDiff.split('\n');
	      var diff = [];
	      var remEOFNL = false,
	          addEOFNL = false;

	      for (var i = (diffstr[0][0]==='I'?4:0); i < diffstr.length; i++) {
	        if(diffstr[i][0] === '@') {
	          var meh = diffstr[i].split(/@@ -(\d+),(\d+) \+(\d+),(\d+) @@/);
	          diff.unshift({
	            start:meh[3],
	            oldlength:meh[2],
	            oldlines:[],
	            newlength:meh[4],
	            newlines:[]
	          });
	        } else if(diffstr[i][0] === '+') {
	          diff[0].newlines.push(diffstr[i].substr(1));
	        } else if(diffstr[i][0] === '-') {
	          diff[0].oldlines.push(diffstr[i].substr(1));
	        } else if(diffstr[i][0] === ' ') {
	          diff[0].newlines.push(diffstr[i].substr(1));
	          diff[0].oldlines.push(diffstr[i].substr(1));
	        } else if(diffstr[i][0] === '\\') {
	          if (diffstr[i-1][0] === '+') {
	            remEOFNL = true;
	          } else if(diffstr[i-1][0] === '-') {
	            addEOFNL = true;
	          }
	        }
	      }

	      var str = oldStr.split('\n');
	      for (var i = diff.length - 1; i >= 0; i--) {
	        var d = diff[i];
	        for (var j = 0; j < d.oldlength; j++) {
	          if(str[d.start-1+j] !== d.oldlines[j]) {
	            return false;
	          }
	        }
	        Array.prototype.splice.apply(str,[d.start-1,+d.oldlength].concat(d.newlines));
	      }

	      if (remEOFNL) {
	        while (!str[str.length-1]) {
	          str.pop();
	        }
	      } else if (addEOFNL) {
	        str.push('');
	      }
	      return str.join('\n');
	    },

	    convertChangesToXML: function(changes){
	      var ret = [];
	      for ( var i = 0; i < changes.length; i++) {
	        var change = changes[i];
	        if (change.added) {
	          ret.push('<ins>');
	        } else if (change.removed) {
	          ret.push('<del>');
	        }

	        ret.push(escapeHTML(change.value));

	        if (change.added) {
	          ret.push('</ins>');
	        } else if (change.removed) {
	          ret.push('</del>');
	        }
	      }
	      return ret.join('');
	    },

	    // See: http://code.google.com/p/google-diff-match-patch/wiki/API
	    convertChangesToDMP: function(changes){
	      var ret = [], change;
	      for ( var i = 0; i < changes.length; i++) {
	        change = changes[i];
	        ret.push([(change.added ? 1 : change.removed ? -1 : 0), change.value]);
	      }
	      return ret;
	    }
	  };
	})();

	if (true) {
	    module.exports = JsDiff;
	}


/***/ },
/* 11 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(process) {// vim:ts=4:sts=4:sw=4:
	/*!
	 *
	 * Copyright 2009-2012 Kris Kowal under the terms of the MIT
	 * license found at http://github.com/kriskowal/q/raw/master/LICENSE
	 *
	 * With parts by Tyler Close
	 * Copyright 2007-2009 Tyler Close under the terms of the MIT X license found
	 * at http://www.opensource.org/licenses/mit-license.html
	 * Forked at ref_send.js version: 2009-05-11
	 *
	 * With parts by Mark Miller
	 * Copyright (C) 2011 Google Inc.
	 *
	 * Licensed under the Apache License, Version 2.0 (the "License");
	 * you may not use this file except in compliance with the License.
	 * You may obtain a copy of the License at
	 *
	 * http://www.apache.org/licenses/LICENSE-2.0
	 *
	 * Unless required by applicable law or agreed to in writing, software
	 * distributed under the License is distributed on an "AS IS" BASIS,
	 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
	 * See the License for the specific language governing permissions and
	 * limitations under the License.
	 *
	 */

	(function (definition) {
	    // Turn off strict mode for this function so we can assign to global.Q
	    /* jshint strict: false */

	    // This file will function properly as a <script> tag, or a module
	    // using CommonJS and NodeJS or RequireJS module formats.  In
	    // Common/Node/RequireJS, the module exports the Q API and when
	    // executed as a simple <script>, it creates a Q global instead.

	    // Montage Require
	    if (typeof bootstrap === "function") {
	        bootstrap("promise", definition);

	    // CommonJS
	    } else if (true) {
	        module.exports = definition();

	    // RequireJS
	    } else if (typeof define === "function" && define.amd) {
	        define(definition);

	    // SES (Secure EcmaScript)
	    } else if (typeof ses !== "undefined") {
	        if (!ses.ok()) {
	            return;
	        } else {
	            ses.makeQ = definition;
	        }

	    // <script>
	    } else {
	        Q = definition();
	    }

	})(function () {
	"use strict";

	var hasStacks = false;
	try {
	    throw new Error();
	} catch (e) {
	    hasStacks = !!e.stack;
	}

	// All code after this point will be filtered from stack traces reported
	// by Q.
	var qStartingLine = captureLine();
	var qFileName;

	// shims

	// used for fallback in "allResolved"
	var noop = function () {};

	// Use the fastest possible means to execute a task in a future turn
	// of the event loop.
	var nextTick =(function () {
	    // linked list of tasks (single, with head node)
	    var head = {task: void 0, next: null};
	    var tail = head;
	    var flushing = false;
	    var requestTick = void 0;
	    var isNodeJS = false;

	    function flush() {
	        /* jshint loopfunc: true */

	        while (head.next) {
	            head = head.next;
	            var task = head.task;
	            head.task = void 0;
	            var domain = head.domain;

	            if (domain) {
	                head.domain = void 0;
	                domain.enter();
	            }

	            try {
	                task();

	            } catch (e) {
	                if (isNodeJS) {
	                    // In node, uncaught exceptions are considered fatal errors.
	                    // Re-throw them synchronously to interrupt flushing!

	                    // Ensure continuation if the uncaught exception is suppressed
	                    // listening "uncaughtException" events (as domains does).
	                    // Continue in next event to avoid tick recursion.
	                    if (domain) {
	                        domain.exit();
	                    }
	                    setTimeout(flush, 0);
	                    if (domain) {
	                        domain.enter();
	                    }

	                    throw e;

	                } else {
	                    // In browsers, uncaught exceptions are not fatal.
	                    // Re-throw them asynchronously to avoid slow-downs.
	                    setTimeout(function() {
	                       throw e;
	                    }, 0);
	                }
	            }

	            if (domain) {
	                domain.exit();
	            }
	        }

	        flushing = false;
	    }

	    nextTick = function (task) {
	        tail = tail.next = {
	            task: task,
	            domain: isNodeJS && process.domain,
	            next: null
	        };

	        if (!flushing) {
	            flushing = true;
	            requestTick();
	        }
	    };

	    if (typeof process !== "undefined" && process.nextTick) {
	        // Node.js before 0.9. Note that some fake-Node environments, like the
	        // Mocha test runner, introduce a `process` global without a `nextTick`.
	        isNodeJS = true;

	        requestTick = function () {
	            process.nextTick(flush);
	        };

	    } else if (typeof setImmediate === "function") {
	        // In IE10, Node.js 0.9+, or https://github.com/NobleJS/setImmediate
	        if (typeof window !== "undefined") {
	            requestTick = setImmediate.bind(window, flush);
	        } else {
	            requestTick = function () {
	                setImmediate(flush);
	            };
	        }

	    } else if (typeof MessageChannel !== "undefined") {
	        // modern browsers
	        // http://www.nonblocking.io/2011/06/windownexttick.html
	        var channel = new MessageChannel();
	        // At least Safari Version 6.0.5 (8536.30.1) intermittently cannot create
	        // working message ports the first time a page loads.
	        channel.port1.onmessage = function () {
	            requestTick = requestPortTick;
	            channel.port1.onmessage = flush;
	            flush();
	        };
	        var requestPortTick = function () {
	            // Opera requires us to provide a message payload, regardless of
	            // whether we use it.
	            channel.port2.postMessage(0);
	        };
	        requestTick = function () {
	            setTimeout(flush, 0);
	            requestPortTick();
	        };

	    } else {
	        // old browsers
	        requestTick = function () {
	            setTimeout(flush, 0);
	        };
	    }

	    return nextTick;
	})();

	// Attempt to make generics safe in the face of downstream
	// modifications.
	// There is no situation where this is necessary.
	// If you need a security guarantee, these primordials need to be
	// deeply frozen anyway, and if you don’t need a security guarantee,
	// this is just plain paranoid.
	// However, this **might** have the nice side-effect of reducing the size of
	// the minified code by reducing x.call() to merely x()
	// See Mark Miller’s explanation of what this does.
	// http://wiki.ecmascript.org/doku.php?id=conventions:safe_meta_programming
	var call = Function.call;
	function uncurryThis(f) {
	    return function () {
	        return call.apply(f, arguments);
	    };
	}
	// This is equivalent, but slower:
	// uncurryThis = Function_bind.bind(Function_bind.call);
	// http://jsperf.com/uncurrythis

	var array_slice = uncurryThis(Array.prototype.slice);

	var array_reduce = uncurryThis(
	    Array.prototype.reduce || function (callback, basis) {
	        var index = 0,
	            length = this.length;
	        // concerning the initial value, if one is not provided
	        if (arguments.length === 1) {
	            // seek to the first value in the array, accounting
	            // for the possibility that is is a sparse array
	            do {
	                if (index in this) {
	                    basis = this[index++];
	                    break;
	                }
	                if (++index >= length) {
	                    throw new TypeError();
	                }
	            } while (1);
	        }
	        // reduce
	        for (; index < length; index++) {
	            // account for the possibility that the array is sparse
	            if (index in this) {
	                basis = callback(basis, this[index], index);
	            }
	        }
	        return basis;
	    }
	);

	var array_indexOf = uncurryThis(
	    Array.prototype.indexOf || function (value) {
	        // not a very good shim, but good enough for our one use of it
	        for (var i = 0; i < this.length; i++) {
	            if (this[i] === value) {
	                return i;
	            }
	        }
	        return -1;
	    }
	);

	var array_map = uncurryThis(
	    Array.prototype.map || function (callback, thisp) {
	        var self = this;
	        var collect = [];
	        array_reduce(self, function (undefined, value, index) {
	            collect.push(callback.call(thisp, value, index, self));
	        }, void 0);
	        return collect;
	    }
	);

	var object_create = Object.create || function (prototype) {
	    function Type() { }
	    Type.prototype = prototype;
	    return new Type();
	};

	var object_hasOwnProperty = uncurryThis(Object.prototype.hasOwnProperty);

	var object_keys = Object.keys || function (object) {
	    var keys = [];
	    for (var key in object) {
	        if (object_hasOwnProperty(object, key)) {
	            keys.push(key);
	        }
	    }
	    return keys;
	};

	var object_toString = uncurryThis(Object.prototype.toString);

	function isObject(value) {
	    return value === Object(value);
	}

	// generator related shims

	// FIXME: Remove this function once ES6 generators are in SpiderMonkey.
	function isStopIteration(exception) {
	    return (
	        object_toString(exception) === "[object StopIteration]" ||
	        exception instanceof QReturnValue
	    );
	}

	// FIXME: Remove this helper and Q.return once ES6 generators are in
	// SpiderMonkey.
	var QReturnValue;
	if (typeof ReturnValue !== "undefined") {
	    QReturnValue = ReturnValue;
	} else {
	    QReturnValue = function (value) {
	        this.value = value;
	    };
	}

	// long stack traces

	var STACK_JUMP_SEPARATOR = "From previous event:";

	function makeStackTraceLong(error, promise) {
	    // If possible, transform the error stack trace by removing Node and Q
	    // cruft, then concatenating with the stack trace of `promise`. See #57.
	    if (hasStacks &&
	        promise.stack &&
	        typeof error === "object" &&
	        error !== null &&
	        error.stack &&
	        error.stack.indexOf(STACK_JUMP_SEPARATOR) === -1
	    ) {
	        var stacks = [];
	        for (var p = promise; !!p; p = p.source) {
	            if (p.stack) {
	                stacks.unshift(p.stack);
	            }
	        }
	        stacks.unshift(error.stack);

	        var concatedStacks = stacks.join("\n" + STACK_JUMP_SEPARATOR + "\n");
	        error.stack = filterStackString(concatedStacks);
	    }
	}

	function filterStackString(stackString) {
	    var lines = stackString.split("\n");
	    var desiredLines = [];
	    for (var i = 0; i < lines.length; ++i) {
	        var line = lines[i];

	        if (!isInternalFrame(line) && !isNodeFrame(line) && line) {
	            desiredLines.push(line);
	        }
	    }
	    return desiredLines.join("\n");
	}

	function isNodeFrame(stackLine) {
	    return stackLine.indexOf("(module.js:") !== -1 ||
	           stackLine.indexOf("(node.js:") !== -1;
	}

	function getFileNameAndLineNumber(stackLine) {
	    // Named functions: "at functionName (filename:lineNumber:columnNumber)"
	    // In IE10 function name can have spaces ("Anonymous function") O_o
	    var attempt1 = /at .+ \((.+):(\d+):(?:\d+)\)$/.exec(stackLine);
	    if (attempt1) {
	        return [attempt1[1], Number(attempt1[2])];
	    }

	    // Anonymous functions: "at filename:lineNumber:columnNumber"
	    var attempt2 = /at ([^ ]+):(\d+):(?:\d+)$/.exec(stackLine);
	    if (attempt2) {
	        return [attempt2[1], Number(attempt2[2])];
	    }

	    // Firefox style: "function@filename:lineNumber or @filename:lineNumber"
	    var attempt3 = /.*@(.+):(\d+)$/.exec(stackLine);
	    if (attempt3) {
	        return [attempt3[1], Number(attempt3[2])];
	    }
	}

	function isInternalFrame(stackLine) {
	    var fileNameAndLineNumber = getFileNameAndLineNumber(stackLine);

	    if (!fileNameAndLineNumber) {
	        return false;
	    }

	    var fileName = fileNameAndLineNumber[0];
	    var lineNumber = fileNameAndLineNumber[1];

	    return fileName === qFileName &&
	        lineNumber >= qStartingLine &&
	        lineNumber <= qEndingLine;
	}

	// discover own file name and line number range for filtering stack
	// traces
	function captureLine() {
	    if (!hasStacks) {
	        return;
	    }

	    try {
	        throw new Error();
	    } catch (e) {
	        var lines = e.stack.split("\n");
	        var firstLine = lines[0].indexOf("@") > 0 ? lines[1] : lines[2];
	        var fileNameAndLineNumber = getFileNameAndLineNumber(firstLine);
	        if (!fileNameAndLineNumber) {
	            return;
	        }

	        qFileName = fileNameAndLineNumber[0];
	        return fileNameAndLineNumber[1];
	    }
	}

	function deprecate(callback, name, alternative) {
	    return function () {
	        if (typeof console !== "undefined" &&
	            typeof console.warn === "function") {
	            console.warn(name + " is deprecated, use " + alternative +
	                         " instead.", new Error("").stack);
	        }
	        return callback.apply(callback, arguments);
	    };
	}

	// end of shims
	// beginning of real work

	/**
	 * Constructs a promise for an immediate reference, passes promises through, or
	 * coerces promises from different systems.
	 * @param value immediate reference or promise
	 */
	function Q(value) {
	    // If the object is already a Promise, return it directly.  This enables
	    // the resolve function to both be used to created references from objects,
	    // but to tolerably coerce non-promises to promises.
	    if (isPromise(value)) {
	        return value;
	    }

	    // assimilate thenables
	    if (isPromiseAlike(value)) {
	        return coerce(value);
	    } else {
	        return fulfill(value);
	    }
	}
	Q.resolve = Q;

	/**
	 * Performs a task in a future turn of the event loop.
	 * @param {Function} task
	 */
	Q.nextTick = nextTick;

	/**
	 * Controls whether or not long stack traces will be on
	 */
	Q.longStackSupport = false;

	/**
	 * Constructs a {promise, resolve, reject} object.
	 *
	 * `resolve` is a callback to invoke with a more resolved value for the
	 * promise. To fulfill the promise, invoke `resolve` with any value that is
	 * not a thenable. To reject the promise, invoke `resolve` with a rejected
	 * thenable, or invoke `reject` with the reason directly. To resolve the
	 * promise to another thenable, thus putting it in the same state, invoke
	 * `resolve` with that other thenable.
	 */
	Q.defer = defer;
	function defer() {
	    // if "messages" is an "Array", that indicates that the promise has not yet
	    // been resolved.  If it is "undefined", it has been resolved.  Each
	    // element of the messages array is itself an array of complete arguments to
	    // forward to the resolved promise.  We coerce the resolution value to a
	    // promise using the `resolve` function because it handles both fully
	    // non-thenable values and other thenables gracefully.
	    var messages = [], progressListeners = [], resolvedPromise;

	    var deferred = object_create(defer.prototype);
	    var promise = object_create(Promise.prototype);

	    promise.promiseDispatch = function (resolve, op, operands) {
	        var args = array_slice(arguments);
	        if (messages) {
	            messages.push(args);
	            if (op === "when" && operands[1]) { // progress operand
	                progressListeners.push(operands[1]);
	            }
	        } else {
	            nextTick(function () {
	                resolvedPromise.promiseDispatch.apply(resolvedPromise, args);
	            });
	        }
	    };

	    // XXX deprecated
	    promise.valueOf = function () {
	        if (messages) {
	            return promise;
	        }
	        var nearerValue = nearer(resolvedPromise);
	        if (isPromise(nearerValue)) {
	            resolvedPromise = nearerValue; // shorten chain
	        }
	        return nearerValue;
	    };

	    promise.inspect = function () {
	        if (!resolvedPromise) {
	            return { state: "pending" };
	        }
	        return resolvedPromise.inspect();
	    };

	    if (Q.longStackSupport && hasStacks) {
	        try {
	            throw new Error();
	        } catch (e) {
	            // NOTE: don't try to use `Error.captureStackTrace` or transfer the
	            // accessor around; that causes memory leaks as per GH-111. Just
	            // reify the stack trace as a string ASAP.
	            //
	            // At the same time, cut off the first line; it's always just
	            // "[object Promise]\n", as per the `toString`.
	            promise.stack = e.stack.substring(e.stack.indexOf("\n") + 1);
	        }
	    }

	    // NOTE: we do the checks for `resolvedPromise` in each method, instead of
	    // consolidating them into `become`, since otherwise we'd create new
	    // promises with the lines `become(whatever(value))`. See e.g. GH-252.

	    function become(newPromise) {
	        resolvedPromise = newPromise;
	        promise.source = newPromise;

	        array_reduce(messages, function (undefined, message) {
	            nextTick(function () {
	                newPromise.promiseDispatch.apply(newPromise, message);
	            });
	        }, void 0);

	        messages = void 0;
	        progressListeners = void 0;
	    }

	    deferred.promise = promise;
	    deferred.resolve = function (value) {
	        if (resolvedPromise) {
	            return;
	        }

	        become(Q(value));
	    };

	    deferred.fulfill = function (value) {
	        if (resolvedPromise) {
	            return;
	        }

	        become(fulfill(value));
	    };
	    deferred.reject = function (reason) {
	        if (resolvedPromise) {
	            return;
	        }

	        become(reject(reason));
	    };
	    deferred.notify = function (progress) {
	        if (resolvedPromise) {
	            return;
	        }

	        array_reduce(progressListeners, function (undefined, progressListener) {
	            nextTick(function () {
	                progressListener(progress);
	            });
	        }, void 0);
	    };

	    return deferred;
	}

	/**
	 * Creates a Node-style callback that will resolve or reject the deferred
	 * promise.
	 * @returns a nodeback
	 */
	defer.prototype.makeNodeResolver = function () {
	    var self = this;
	    return function (error, value) {
	        if (error) {
	            self.reject(error);
	        } else if (arguments.length > 2) {
	            self.resolve(array_slice(arguments, 1));
	        } else {
	            self.resolve(value);
	        }
	    };
	};

	/**
	 * @param resolver {Function} a function that returns nothing and accepts
	 * the resolve, reject, and notify functions for a deferred.
	 * @returns a promise that may be resolved with the given resolve and reject
	 * functions, or rejected by a thrown exception in resolver
	 */
	Q.Promise = promise; // ES6
	Q.promise = promise;
	function promise(resolver) {
	    if (typeof resolver !== "function") {
	        throw new TypeError("resolver must be a function.");
	    }
	    var deferred = defer();
	    try {
	        resolver(deferred.resolve, deferred.reject, deferred.notify);
	    } catch (reason) {
	        deferred.reject(reason);
	    }
	    return deferred.promise;
	}

	promise.race = race; // ES6
	promise.all = all; // ES6
	promise.reject = reject; // ES6
	promise.resolve = Q; // ES6

	// XXX experimental.  This method is a way to denote that a local value is
	// serializable and should be immediately dispatched to a remote upon request,
	// instead of passing a reference.
	Q.passByCopy = function (object) {
	    //freeze(object);
	    //passByCopies.set(object, true);
	    return object;
	};

	Promise.prototype.passByCopy = function () {
	    //freeze(object);
	    //passByCopies.set(object, true);
	    return this;
	};

	/**
	 * If two promises eventually fulfill to the same value, promises that value,
	 * but otherwise rejects.
	 * @param x {Any*}
	 * @param y {Any*}
	 * @returns {Any*} a promise for x and y if they are the same, but a rejection
	 * otherwise.
	 *
	 */
	Q.join = function (x, y) {
	    return Q(x).join(y);
	};

	Promise.prototype.join = function (that) {
	    return Q([this, that]).spread(function (x, y) {
	        if (x === y) {
	            // TODO: "===" should be Object.is or equiv
	            return x;
	        } else {
	            throw new Error("Can't join: not the same: " + x + " " + y);
	        }
	    });
	};

	/**
	 * Returns a promise for the first of an array of promises to become fulfilled.
	 * @param answers {Array[Any*]} promises to race
	 * @returns {Any*} the first promise to be fulfilled
	 */
	Q.race = race;
	function race(answerPs) {
	    return promise(function(resolve, reject) {
	        // Switch to this once we can assume at least ES5
	        // answerPs.forEach(function(answerP) {
	        //     Q(answerP).then(resolve, reject);
	        // });
	        // Use this in the meantime
	        for (var i = 0, len = answerPs.length; i < len; i++) {
	            Q(answerPs[i]).then(resolve, reject);
	        }
	    });
	}

	Promise.prototype.race = function () {
	    return this.then(Q.race);
	};

	/**
	 * Constructs a Promise with a promise descriptor object and optional fallback
	 * function.  The descriptor contains methods like when(rejected), get(name),
	 * set(name, value), post(name, args), and delete(name), which all
	 * return either a value, a promise for a value, or a rejection.  The fallback
	 * accepts the operation name, a resolver, and any further arguments that would
	 * have been forwarded to the appropriate method above had a method been
	 * provided with the proper name.  The API makes no guarantees about the nature
	 * of the returned object, apart from that it is usable whereever promises are
	 * bought and sold.
	 */
	Q.makePromise = Promise;
	function Promise(descriptor, fallback, inspect) {
	    if (fallback === void 0) {
	        fallback = function (op) {
	            return reject(new Error(
	                "Promise does not support operation: " + op
	            ));
	        };
	    }
	    if (inspect === void 0) {
	        inspect = function () {
	            return {state: "unknown"};
	        };
	    }

	    var promise = object_create(Promise.prototype);

	    promise.promiseDispatch = function (resolve, op, args) {
	        var result;
	        try {
	            if (descriptor[op]) {
	                result = descriptor[op].apply(promise, args);
	            } else {
	                result = fallback.call(promise, op, args);
	            }
	        } catch (exception) {
	            result = reject(exception);
	        }
	        if (resolve) {
	            resolve(result);
	        }
	    };

	    promise.inspect = inspect;

	    // XXX deprecated `valueOf` and `exception` support
	    if (inspect) {
	        var inspected = inspect();
	        if (inspected.state === "rejected") {
	            promise.exception = inspected.reason;
	        }

	        promise.valueOf = function () {
	            var inspected = inspect();
	            if (inspected.state === "pending" ||
	                inspected.state === "rejected") {
	                return promise;
	            }
	            return inspected.value;
	        };
	    }

	    return promise;
	}

	Promise.prototype.toString = function () {
	    return "[object Promise]";
	};

	Promise.prototype.then = function (fulfilled, rejected, progressed) {
	    var self = this;
	    var deferred = defer();
	    var done = false;   // ensure the untrusted promise makes at most a
	                        // single call to one of the callbacks

	    function _fulfilled(value) {
	        try {
	            return typeof fulfilled === "function" ? fulfilled(value) : value;
	        } catch (exception) {
	            return reject(exception);
	        }
	    }

	    function _rejected(exception) {
	        if (typeof rejected === "function") {
	            makeStackTraceLong(exception, self);
	            try {
	                return rejected(exception);
	            } catch (newException) {
	                return reject(newException);
	            }
	        }
	        return reject(exception);
	    }

	    function _progressed(value) {
	        return typeof progressed === "function" ? progressed(value) : value;
	    }

	    nextTick(function () {
	        self.promiseDispatch(function (value) {
	            if (done) {
	                return;
	            }
	            done = true;

	            deferred.resolve(_fulfilled(value));
	        }, "when", [function (exception) {
	            if (done) {
	                return;
	            }
	            done = true;

	            deferred.resolve(_rejected(exception));
	        }]);
	    });

	    // Progress propagator need to be attached in the current tick.
	    self.promiseDispatch(void 0, "when", [void 0, function (value) {
	        var newValue;
	        var threw = false;
	        try {
	            newValue = _progressed(value);
	        } catch (e) {
	            threw = true;
	            if (Q.onerror) {
	                Q.onerror(e);
	            } else {
	                throw e;
	            }
	        }

	        if (!threw) {
	            deferred.notify(newValue);
	        }
	    }]);

	    return deferred.promise;
	};

	/**
	 * Registers an observer on a promise.
	 *
	 * Guarantees:
	 *
	 * 1. that fulfilled and rejected will be called only once.
	 * 2. that either the fulfilled callback or the rejected callback will be
	 *    called, but not both.
	 * 3. that fulfilled and rejected will not be called in this turn.
	 *
	 * @param value      promise or immediate reference to observe
	 * @param fulfilled  function to be called with the fulfilled value
	 * @param rejected   function to be called with the rejection exception
	 * @param progressed function to be called on any progress notifications
	 * @return promise for the return value from the invoked callback
	 */
	Q.when = when;
	function when(value, fulfilled, rejected, progressed) {
	    return Q(value).then(fulfilled, rejected, progressed);
	}

	Promise.prototype.thenResolve = function (value) {
	    return this.then(function () { return value; });
	};

	Q.thenResolve = function (promise, value) {
	    return Q(promise).thenResolve(value);
	};

	Promise.prototype.thenReject = function (reason) {
	    return this.then(function () { throw reason; });
	};

	Q.thenReject = function (promise, reason) {
	    return Q(promise).thenReject(reason);
	};

	/**
	 * If an object is not a promise, it is as "near" as possible.
	 * If a promise is rejected, it is as "near" as possible too.
	 * If it’s a fulfilled promise, the fulfillment value is nearer.
	 * If it’s a deferred promise and the deferred has been resolved, the
	 * resolution is "nearer".
	 * @param object
	 * @returns most resolved (nearest) form of the object
	 */

	// XXX should we re-do this?
	Q.nearer = nearer;
	function nearer(value) {
	    if (isPromise(value)) {
	        var inspected = value.inspect();
	        if (inspected.state === "fulfilled") {
	            return inspected.value;
	        }
	    }
	    return value;
	}

	/**
	 * @returns whether the given object is a promise.
	 * Otherwise it is a fulfilled value.
	 */
	Q.isPromise = isPromise;
	function isPromise(object) {
	    return isObject(object) &&
	        typeof object.promiseDispatch === "function" &&
	        typeof object.inspect === "function";
	}

	Q.isPromiseAlike = isPromiseAlike;
	function isPromiseAlike(object) {
	    return isObject(object) && typeof object.then === "function";
	}

	/**
	 * @returns whether the given object is a pending promise, meaning not
	 * fulfilled or rejected.
	 */
	Q.isPending = isPending;
	function isPending(object) {
	    return isPromise(object) && object.inspect().state === "pending";
	}

	Promise.prototype.isPending = function () {
	    return this.inspect().state === "pending";
	};

	/**
	 * @returns whether the given object is a value or fulfilled
	 * promise.
	 */
	Q.isFulfilled = isFulfilled;
	function isFulfilled(object) {
	    return !isPromise(object) || object.inspect().state === "fulfilled";
	}

	Promise.prototype.isFulfilled = function () {
	    return this.inspect().state === "fulfilled";
	};

	/**
	 * @returns whether the given object is a rejected promise.
	 */
	Q.isRejected = isRejected;
	function isRejected(object) {
	    return isPromise(object) && object.inspect().state === "rejected";
	}

	Promise.prototype.isRejected = function () {
	    return this.inspect().state === "rejected";
	};

	//// BEGIN UNHANDLED REJECTION TRACKING

	// This promise library consumes exceptions thrown in handlers so they can be
	// handled by a subsequent promise.  The exceptions get added to this array when
	// they are created, and removed when they are handled.  Note that in ES6 or
	// shimmed environments, this would naturally be a `Set`.
	var unhandledReasons = [];
	var unhandledRejections = [];
	var trackUnhandledRejections = true;

	function resetUnhandledRejections() {
	    unhandledReasons.length = 0;
	    unhandledRejections.length = 0;

	    if (!trackUnhandledRejections) {
	        trackUnhandledRejections = true;
	    }
	}

	function trackRejection(promise, reason) {
	    if (!trackUnhandledRejections) {
	        return;
	    }

	    unhandledRejections.push(promise);
	    if (reason && typeof reason.stack !== "undefined") {
	        unhandledReasons.push(reason.stack);
	    } else {
	        unhandledReasons.push("(no stack) " + reason);
	    }
	}

	function untrackRejection(promise) {
	    if (!trackUnhandledRejections) {
	        return;
	    }

	    var at = array_indexOf(unhandledRejections, promise);
	    if (at !== -1) {
	        unhandledRejections.splice(at, 1);
	        unhandledReasons.splice(at, 1);
	    }
	}

	Q.resetUnhandledRejections = resetUnhandledRejections;

	Q.getUnhandledReasons = function () {
	    // Make a copy so that consumers can't interfere with our internal state.
	    return unhandledReasons.slice();
	};

	Q.stopUnhandledRejectionTracking = function () {
	    resetUnhandledRejections();
	    trackUnhandledRejections = false;
	};

	resetUnhandledRejections();

	//// END UNHANDLED REJECTION TRACKING

	/**
	 * Constructs a rejected promise.
	 * @param reason value describing the failure
	 */
	Q.reject = reject;
	function reject(reason) {
	    var rejection = Promise({
	        "when": function (rejected) {
	            // note that the error has been handled
	            if (rejected) {
	                untrackRejection(this);
	            }
	            return rejected ? rejected(reason) : this;
	        }
	    }, function fallback() {
	        return this;
	    }, function inspect() {
	        return { state: "rejected", reason: reason };
	    });

	    // Note that the reason has not been handled.
	    trackRejection(rejection, reason);

	    return rejection;
	}

	/**
	 * Constructs a fulfilled promise for an immediate reference.
	 * @param value immediate reference
	 */
	Q.fulfill = fulfill;
	function fulfill(value) {
	    return Promise({
	        "when": function () {
	            return value;
	        },
	        "get": function (name) {
	            return value[name];
	        },
	        "set": function (name, rhs) {
	            value[name] = rhs;
	        },
	        "delete": function (name) {
	            delete value[name];
	        },
	        "post": function (name, args) {
	            // Mark Miller proposes that post with no name should apply a
	            // promised function.
	            if (name === null || name === void 0) {
	                return value.apply(void 0, args);
	            } else {
	                return value[name].apply(value, args);
	            }
	        },
	        "apply": function (thisp, args) {
	            return value.apply(thisp, args);
	        },
	        "keys": function () {
	            return object_keys(value);
	        }
	    }, void 0, function inspect() {
	        return { state: "fulfilled", value: value };
	    });
	}

	/**
	 * Converts thenables to Q promises.
	 * @param promise thenable promise
	 * @returns a Q promise
	 */
	function coerce(promise) {
	    var deferred = defer();
	    nextTick(function () {
	        try {
	            promise.then(deferred.resolve, deferred.reject, deferred.notify);
	        } catch (exception) {
	            deferred.reject(exception);
	        }
	    });
	    return deferred.promise;
	}

	/**
	 * Annotates an object such that it will never be
	 * transferred away from this process over any promise
	 * communication channel.
	 * @param object
	 * @returns promise a wrapping of that object that
	 * additionally responds to the "isDef" message
	 * without a rejection.
	 */
	Q.master = master;
	function master(object) {
	    return Promise({
	        "isDef": function () {}
	    }, function fallback(op, args) {
	        return dispatch(object, op, args);
	    }, function () {
	        return Q(object).inspect();
	    });
	}

	/**
	 * Spreads the values of a promised array of arguments into the
	 * fulfillment callback.
	 * @param fulfilled callback that receives variadic arguments from the
	 * promised array
	 * @param rejected callback that receives the exception if the promise
	 * is rejected.
	 * @returns a promise for the return value or thrown exception of
	 * either callback.
	 */
	Q.spread = spread;
	function spread(value, fulfilled, rejected) {
	    return Q(value).spread(fulfilled, rejected);
	}

	Promise.prototype.spread = function (fulfilled, rejected) {
	    return this.all().then(function (array) {
	        return fulfilled.apply(void 0, array);
	    }, rejected);
	};

	/**
	 * The async function is a decorator for generator functions, turning
	 * them into asynchronous generators.  Although generators are only part
	 * of the newest ECMAScript 6 drafts, this code does not cause syntax
	 * errors in older engines.  This code should continue to work and will
	 * in fact improve over time as the language improves.
	 *
	 * ES6 generators are currently part of V8 version 3.19 with the
	 * --harmony-generators runtime flag enabled.  SpiderMonkey has had them
	 * for longer, but under an older Python-inspired form.  This function
	 * works on both kinds of generators.
	 *
	 * Decorates a generator function such that:
	 *  - it may yield promises
	 *  - execution will continue when that promise is fulfilled
	 *  - the value of the yield expression will be the fulfilled value
	 *  - it returns a promise for the return value (when the generator
	 *    stops iterating)
	 *  - the decorated function returns a promise for the return value
	 *    of the generator or the first rejected promise among those
	 *    yielded.
	 *  - if an error is thrown in the generator, it propagates through
	 *    every following yield until it is caught, or until it escapes
	 *    the generator function altogether, and is translated into a
	 *    rejection for the promise returned by the decorated generator.
	 */
	Q.async = async;
	function async(makeGenerator) {
	    return function () {
	        // when verb is "send", arg is a value
	        // when verb is "throw", arg is an exception
	        function continuer(verb, arg) {
	            var result;

	            // Until V8 3.19 / Chromium 29 is released, SpiderMonkey is the only
	            // engine that has a deployed base of browsers that support generators.
	            // However, SM's generators use the Python-inspired semantics of
	            // outdated ES6 drafts.  We would like to support ES6, but we'd also
	            // like to make it possible to use generators in deployed browsers, so
	            // we also support Python-style generators.  At some point we can remove
	            // this block.

	            if (typeof StopIteration === "undefined") {
	                // ES6 Generators
	                try {
	                    result = generator[verb](arg);
	                } catch (exception) {
	                    return reject(exception);
	                }
	                if (result.done) {
	                    return result.value;
	                } else {
	                    return when(result.value, callback, errback);
	                }
	            } else {
	                // SpiderMonkey Generators
	                // FIXME: Remove this case when SM does ES6 generators.
	                try {
	                    result = generator[verb](arg);
	                } catch (exception) {
	                    if (isStopIteration(exception)) {
	                        return exception.value;
	                    } else {
	                        return reject(exception);
	                    }
	                }
	                return when(result, callback, errback);
	            }
	        }
	        var generator = makeGenerator.apply(this, arguments);
	        var callback = continuer.bind(continuer, "next");
	        var errback = continuer.bind(continuer, "throw");
	        return callback();
	    };
	}

	/**
	 * The spawn function is a small wrapper around async that immediately
	 * calls the generator and also ends the promise chain, so that any
	 * unhandled errors are thrown instead of forwarded to the error
	 * handler. This is useful because it's extremely common to run
	 * generators at the top-level to work with libraries.
	 */
	Q.spawn = spawn;
	function spawn(makeGenerator) {
	    Q.done(Q.async(makeGenerator)());
	}

	// FIXME: Remove this interface once ES6 generators are in SpiderMonkey.
	/**
	 * Throws a ReturnValue exception to stop an asynchronous generator.
	 *
	 * This interface is a stop-gap measure to support generator return
	 * values in older Firefox/SpiderMonkey.  In browsers that support ES6
	 * generators like Chromium 29, just use "return" in your generator
	 * functions.
	 *
	 * @param value the return value for the surrounding generator
	 * @throws ReturnValue exception with the value.
	 * @example
	 * // ES6 style
	 * Q.async(function* () {
	 *      var foo = yield getFooPromise();
	 *      var bar = yield getBarPromise();
	 *      return foo + bar;
	 * })
	 * // Older SpiderMonkey style
	 * Q.async(function () {
	 *      var foo = yield getFooPromise();
	 *      var bar = yield getBarPromise();
	 *      Q.return(foo + bar);
	 * })
	 */
	Q["return"] = _return;
	function _return(value) {
	    throw new QReturnValue(value);
	}

	/**
	 * The promised function decorator ensures that any promise arguments
	 * are settled and passed as values (`this` is also settled and passed
	 * as a value).  It will also ensure that the result of a function is
	 * always a promise.
	 *
	 * @example
	 * var add = Q.promised(function (a, b) {
	 *     return a + b;
	 * });
	 * add(Q(a), Q(B));
	 *
	 * @param {function} callback The function to decorate
	 * @returns {function} a function that has been decorated.
	 */
	Q.promised = promised;
	function promised(callback) {
	    return function () {
	        return spread([this, all(arguments)], function (self, args) {
	            return callback.apply(self, args);
	        });
	    };
	}

	/**
	 * sends a message to a value in a future turn
	 * @param object* the recipient
	 * @param op the name of the message operation, e.g., "when",
	 * @param args further arguments to be forwarded to the operation
	 * @returns result {Promise} a promise for the result of the operation
	 */
	Q.dispatch = dispatch;
	function dispatch(object, op, args) {
	    return Q(object).dispatch(op, args);
	}

	Promise.prototype.dispatch = function (op, args) {
	    var self = this;
	    var deferred = defer();
	    nextTick(function () {
	        self.promiseDispatch(deferred.resolve, op, args);
	    });
	    return deferred.promise;
	};

	/**
	 * Gets the value of a property in a future turn.
	 * @param object    promise or immediate reference for target object
	 * @param name      name of property to get
	 * @return promise for the property value
	 */
	Q.get = function (object, key) {
	    return Q(object).dispatch("get", [key]);
	};

	Promise.prototype.get = function (key) {
	    return this.dispatch("get", [key]);
	};

	/**
	 * Sets the value of a property in a future turn.
	 * @param object    promise or immediate reference for object object
	 * @param name      name of property to set
	 * @param value     new value of property
	 * @return promise for the return value
	 */
	Q.set = function (object, key, value) {
	    return Q(object).dispatch("set", [key, value]);
	};

	Promise.prototype.set = function (key, value) {
	    return this.dispatch("set", [key, value]);
	};

	/**
	 * Deletes a property in a future turn.
	 * @param object    promise or immediate reference for target object
	 * @param name      name of property to delete
	 * @return promise for the return value
	 */
	Q.del = // XXX legacy
	Q["delete"] = function (object, key) {
	    return Q(object).dispatch("delete", [key]);
	};

	Promise.prototype.del = // XXX legacy
	Promise.prototype["delete"] = function (key) {
	    return this.dispatch("delete", [key]);
	};

	/**
	 * Invokes a method in a future turn.
	 * @param object    promise or immediate reference for target object
	 * @param name      name of method to invoke
	 * @param value     a value to post, typically an array of
	 *                  invocation arguments for promises that
	 *                  are ultimately backed with `resolve` values,
	 *                  as opposed to those backed with URLs
	 *                  wherein the posted value can be any
	 *                  JSON serializable object.
	 * @return promise for the return value
	 */
	// bound locally because it is used by other methods
	Q.mapply = // XXX As proposed by "Redsandro"
	Q.post = function (object, name, args) {
	    return Q(object).dispatch("post", [name, args]);
	};

	Promise.prototype.mapply = // XXX As proposed by "Redsandro"
	Promise.prototype.post = function (name, args) {
	    return this.dispatch("post", [name, args]);
	};

	/**
	 * Invokes a method in a future turn.
	 * @param object    promise or immediate reference for target object
	 * @param name      name of method to invoke
	 * @param ...args   array of invocation arguments
	 * @return promise for the return value
	 */
	Q.send = // XXX Mark Miller's proposed parlance
	Q.mcall = // XXX As proposed by "Redsandro"
	Q.invoke = function (object, name /*...args*/) {
	    return Q(object).dispatch("post", [name, array_slice(arguments, 2)]);
	};

	Promise.prototype.send = // XXX Mark Miller's proposed parlance
	Promise.prototype.mcall = // XXX As proposed by "Redsandro"
	Promise.prototype.invoke = function (name /*...args*/) {
	    return this.dispatch("post", [name, array_slice(arguments, 1)]);
	};

	/**
	 * Applies the promised function in a future turn.
	 * @param object    promise or immediate reference for target function
	 * @param args      array of application arguments
	 */
	Q.fapply = function (object, args) {
	    return Q(object).dispatch("apply", [void 0, args]);
	};

	Promise.prototype.fapply = function (args) {
	    return this.dispatch("apply", [void 0, args]);
	};

	/**
	 * Calls the promised function in a future turn.
	 * @param object    promise or immediate reference for target function
	 * @param ...args   array of application arguments
	 */
	Q["try"] =
	Q.fcall = function (object /* ...args*/) {
	    return Q(object).dispatch("apply", [void 0, array_slice(arguments, 1)]);
	};

	Promise.prototype.fcall = function (/*...args*/) {
	    return this.dispatch("apply", [void 0, array_slice(arguments)]);
	};

	/**
	 * Binds the promised function, transforming return values into a fulfilled
	 * promise and thrown errors into a rejected one.
	 * @param object    promise or immediate reference for target function
	 * @param ...args   array of application arguments
	 */
	Q.fbind = function (object /*...args*/) {
	    var promise = Q(object);
	    var args = array_slice(arguments, 1);
	    return function fbound() {
	        return promise.dispatch("apply", [
	            this,
	            args.concat(array_slice(arguments))
	        ]);
	    };
	};
	Promise.prototype.fbind = function (/*...args*/) {
	    var promise = this;
	    var args = array_slice(arguments);
	    return function fbound() {
	        return promise.dispatch("apply", [
	            this,
	            args.concat(array_slice(arguments))
	        ]);
	    };
	};

	/**
	 * Requests the names of the owned properties of a promised
	 * object in a future turn.
	 * @param object    promise or immediate reference for target object
	 * @return promise for the keys of the eventually settled object
	 */
	Q.keys = function (object) {
	    return Q(object).dispatch("keys", []);
	};

	Promise.prototype.keys = function () {
	    return this.dispatch("keys", []);
	};

	/**
	 * Turns an array of promises into a promise for an array.  If any of
	 * the promises gets rejected, the whole array is rejected immediately.
	 * @param {Array*} an array (or promise for an array) of values (or
	 * promises for values)
	 * @returns a promise for an array of the corresponding values
	 */
	// By Mark Miller
	// http://wiki.ecmascript.org/doku.php?id=strawman:concurrency&rev=1308776521#allfulfilled
	Q.all = all;
	function all(promises) {
	    return when(promises, function (promises) {
	        var countDown = 0;
	        var deferred = defer();
	        array_reduce(promises, function (undefined, promise, index) {
	            var snapshot;
	            if (
	                isPromise(promise) &&
	                (snapshot = promise.inspect()).state === "fulfilled"
	            ) {
	                promises[index] = snapshot.value;
	            } else {
	                ++countDown;
	                when(
	                    promise,
	                    function (value) {
	                        promises[index] = value;
	                        if (--countDown === 0) {
	                            deferred.resolve(promises);
	                        }
	                    },
	                    deferred.reject,
	                    function (progress) {
	                        deferred.notify({ index: index, value: progress });
	                    }
	                );
	            }
	        }, void 0);
	        if (countDown === 0) {
	            deferred.resolve(promises);
	        }
	        return deferred.promise;
	    });
	}

	Promise.prototype.all = function () {
	    return all(this);
	};

	/**
	 * Waits for all promises to be settled, either fulfilled or
	 * rejected.  This is distinct from `all` since that would stop
	 * waiting at the first rejection.  The promise returned by
	 * `allResolved` will never be rejected.
	 * @param promises a promise for an array (or an array) of promises
	 * (or values)
	 * @return a promise for an array of promises
	 */
	Q.allResolved = deprecate(allResolved, "allResolved", "allSettled");
	function allResolved(promises) {
	    return when(promises, function (promises) {
	        promises = array_map(promises, Q);
	        return when(all(array_map(promises, function (promise) {
	            return when(promise, noop, noop);
	        })), function () {
	            return promises;
	        });
	    });
	}

	Promise.prototype.allResolved = function () {
	    return allResolved(this);
	};

	/**
	 * @see Promise#allSettled
	 */
	Q.allSettled = allSettled;
	function allSettled(promises) {
	    return Q(promises).allSettled();
	}

	/**
	 * Turns an array of promises into a promise for an array of their states (as
	 * returned by `inspect`) when they have all settled.
	 * @param {Array[Any*]} values an array (or promise for an array) of values (or
	 * promises for values)
	 * @returns {Array[State]} an array of states for the respective values.
	 */
	Promise.prototype.allSettled = function () {
	    return this.then(function (promises) {
	        return all(array_map(promises, function (promise) {
	            promise = Q(promise);
	            function regardless() {
	                return promise.inspect();
	            }
	            return promise.then(regardless, regardless);
	        }));
	    });
	};

	/**
	 * Captures the failure of a promise, giving an oportunity to recover
	 * with a callback.  If the given promise is fulfilled, the returned
	 * promise is fulfilled.
	 * @param {Any*} promise for something
	 * @param {Function} callback to fulfill the returned promise if the
	 * given promise is rejected
	 * @returns a promise for the return value of the callback
	 */
	Q.fail = // XXX legacy
	Q["catch"] = function (object, rejected) {
	    return Q(object).then(void 0, rejected);
	};

	Promise.prototype.fail = // XXX legacy
	Promise.prototype["catch"] = function (rejected) {
	    return this.then(void 0, rejected);
	};

	/**
	 * Attaches a listener that can respond to progress notifications from a
	 * promise's originating deferred. This listener receives the exact arguments
	 * passed to ``deferred.notify``.
	 * @param {Any*} promise for something
	 * @param {Function} callback to receive any progress notifications
	 * @returns the given promise, unchanged
	 */
	Q.progress = progress;
	function progress(object, progressed) {
	    return Q(object).then(void 0, void 0, progressed);
	}

	Promise.prototype.progress = function (progressed) {
	    return this.then(void 0, void 0, progressed);
	};

	/**
	 * Provides an opportunity to observe the settling of a promise,
	 * regardless of whether the promise is fulfilled or rejected.  Forwards
	 * the resolution to the returned promise when the callback is done.
	 * The callback can return a promise to defer completion.
	 * @param {Any*} promise
	 * @param {Function} callback to observe the resolution of the given
	 * promise, takes no arguments.
	 * @returns a promise for the resolution of the given promise when
	 * ``fin`` is done.
	 */
	Q.fin = // XXX legacy
	Q["finally"] = function (object, callback) {
	    return Q(object)["finally"](callback);
	};

	Promise.prototype.fin = // XXX legacy
	Promise.prototype["finally"] = function (callback) {
	    callback = Q(callback);
	    return this.then(function (value) {
	        return callback.fcall().then(function () {
	            return value;
	        });
	    }, function (reason) {
	        // TODO attempt to recycle the rejection with "this".
	        return callback.fcall().then(function () {
	            throw reason;
	        });
	    });
	};

	/**
	 * Terminates a chain of promises, forcing rejections to be
	 * thrown as exceptions.
	 * @param {Any*} promise at the end of a chain of promises
	 * @returns nothing
	 */
	Q.done = function (object, fulfilled, rejected, progress) {
	    return Q(object).done(fulfilled, rejected, progress);
	};

	Promise.prototype.done = function (fulfilled, rejected, progress) {
	    var onUnhandledError = function (error) {
	        // forward to a future turn so that ``when``
	        // does not catch it and turn it into a rejection.
	        nextTick(function () {
	            makeStackTraceLong(error, promise);
	            if (Q.onerror) {
	                Q.onerror(error);
	            } else {
	                throw error;
	            }
	        });
	    };

	    // Avoid unnecessary `nextTick`ing via an unnecessary `when`.
	    var promise = fulfilled || rejected || progress ?
	        this.then(fulfilled, rejected, progress) :
	        this;

	    if (typeof process === "object" && process && process.domain) {
	        onUnhandledError = process.domain.bind(onUnhandledError);
	    }

	    promise.then(void 0, onUnhandledError);
	};

	/**
	 * Causes a promise to be rejected if it does not get fulfilled before
	 * some milliseconds time out.
	 * @param {Any*} promise
	 * @param {Number} milliseconds timeout
	 * @param {String} custom error message (optional)
	 * @returns a promise for the resolution of the given promise if it is
	 * fulfilled before the timeout, otherwise rejected.
	 */
	Q.timeout = function (object, ms, message) {
	    return Q(object).timeout(ms, message);
	};

	Promise.prototype.timeout = function (ms, message) {
	    var deferred = defer();
	    var timeoutId = setTimeout(function () {
	        deferred.reject(new Error(message || "Timed out after " + ms + " ms"));
	    }, ms);

	    this.then(function (value) {
	        clearTimeout(timeoutId);
	        deferred.resolve(value);
	    }, function (exception) {
	        clearTimeout(timeoutId);
	        deferred.reject(exception);
	    }, deferred.notify);

	    return deferred.promise;
	};

	/**
	 * Returns a promise for the given value (or promised value), some
	 * milliseconds after it resolved. Passes rejections immediately.
	 * @param {Any*} promise
	 * @param {Number} milliseconds
	 * @returns a promise for the resolution of the given promise after milliseconds
	 * time has elapsed since the resolution of the given promise.
	 * If the given promise rejects, that is passed immediately.
	 */
	Q.delay = function (object, timeout) {
	    if (timeout === void 0) {
	        timeout = object;
	        object = void 0;
	    }
	    return Q(object).delay(timeout);
	};

	Promise.prototype.delay = function (timeout) {
	    return this.then(function (value) {
	        var deferred = defer();
	        setTimeout(function () {
	            deferred.resolve(value);
	        }, timeout);
	        return deferred.promise;
	    });
	};

	/**
	 * Passes a continuation to a Node function, which is called with the given
	 * arguments provided as an array, and returns a promise.
	 *
	 *      Q.nfapply(FS.readFile, [__filename])
	 *      .then(function (content) {
	 *      })
	 *
	 */
	Q.nfapply = function (callback, args) {
	    return Q(callback).nfapply(args);
	};

	Promise.prototype.nfapply = function (args) {
	    var deferred = defer();
	    var nodeArgs = array_slice(args);
	    nodeArgs.push(deferred.makeNodeResolver());
	    this.fapply(nodeArgs).fail(deferred.reject);
	    return deferred.promise;
	};

	/**
	 * Passes a continuation to a Node function, which is called with the given
	 * arguments provided individually, and returns a promise.
	 * @example
	 * Q.nfcall(FS.readFile, __filename)
	 * .then(function (content) {
	 * })
	 *
	 */
	Q.nfcall = function (callback /*...args*/) {
	    var args = array_slice(arguments, 1);
	    return Q(callback).nfapply(args);
	};

	Promise.prototype.nfcall = function (/*...args*/) {
	    var nodeArgs = array_slice(arguments);
	    var deferred = defer();
	    nodeArgs.push(deferred.makeNodeResolver());
	    this.fapply(nodeArgs).fail(deferred.reject);
	    return deferred.promise;
	};

	/**
	 * Wraps a NodeJS continuation passing function and returns an equivalent
	 * version that returns a promise.
	 * @example
	 * Q.nfbind(FS.readFile, __filename)("utf-8")
	 * .then(console.log)
	 * .done()
	 */
	Q.nfbind =
	Q.denodeify = function (callback /*...args*/) {
	    var baseArgs = array_slice(arguments, 1);
	    return function () {
	        var nodeArgs = baseArgs.concat(array_slice(arguments));
	        var deferred = defer();
	        nodeArgs.push(deferred.makeNodeResolver());
	        Q(callback).fapply(nodeArgs).fail(deferred.reject);
	        return deferred.promise;
	    };
	};

	Promise.prototype.nfbind =
	Promise.prototype.denodeify = function (/*...args*/) {
	    var args = array_slice(arguments);
	    args.unshift(this);
	    return Q.denodeify.apply(void 0, args);
	};

	Q.nbind = function (callback, thisp /*...args*/) {
	    var baseArgs = array_slice(arguments, 2);
	    return function () {
	        var nodeArgs = baseArgs.concat(array_slice(arguments));
	        var deferred = defer();
	        nodeArgs.push(deferred.makeNodeResolver());
	        function bound() {
	            return callback.apply(thisp, arguments);
	        }
	        Q(bound).fapply(nodeArgs).fail(deferred.reject);
	        return deferred.promise;
	    };
	};

	Promise.prototype.nbind = function (/*thisp, ...args*/) {
	    var args = array_slice(arguments, 0);
	    args.unshift(this);
	    return Q.nbind.apply(void 0, args);
	};

	/**
	 * Calls a method of a Node-style object that accepts a Node-style
	 * callback with a given array of arguments, plus a provided callback.
	 * @param object an object that has the named method
	 * @param {String} name name of the method of object
	 * @param {Array} args arguments to pass to the method; the callback
	 * will be provided by Q and appended to these arguments.
	 * @returns a promise for the value or error
	 */
	Q.nmapply = // XXX As proposed by "Redsandro"
	Q.npost = function (object, name, args) {
	    return Q(object).npost(name, args);
	};

	Promise.prototype.nmapply = // XXX As proposed by "Redsandro"
	Promise.prototype.npost = function (name, args) {
	    var nodeArgs = array_slice(args || []);
	    var deferred = defer();
	    nodeArgs.push(deferred.makeNodeResolver());
	    this.dispatch("post", [name, nodeArgs]).fail(deferred.reject);
	    return deferred.promise;
	};

	/**
	 * Calls a method of a Node-style object that accepts a Node-style
	 * callback, forwarding the given variadic arguments, plus a provided
	 * callback argument.
	 * @param object an object that has the named method
	 * @param {String} name name of the method of object
	 * @param ...args arguments to pass to the method; the callback will
	 * be provided by Q and appended to these arguments.
	 * @returns a promise for the value or error
	 */
	Q.nsend = // XXX Based on Mark Miller's proposed "send"
	Q.nmcall = // XXX Based on "Redsandro's" proposal
	Q.ninvoke = function (object, name /*...args*/) {
	    var nodeArgs = array_slice(arguments, 2);
	    var deferred = defer();
	    nodeArgs.push(deferred.makeNodeResolver());
	    Q(object).dispatch("post", [name, nodeArgs]).fail(deferred.reject);
	    return deferred.promise;
	};

	Promise.prototype.nsend = // XXX Based on Mark Miller's proposed "send"
	Promise.prototype.nmcall = // XXX Based on "Redsandro's" proposal
	Promise.prototype.ninvoke = function (name /*...args*/) {
	    var nodeArgs = array_slice(arguments, 1);
	    var deferred = defer();
	    nodeArgs.push(deferred.makeNodeResolver());
	    this.dispatch("post", [name, nodeArgs]).fail(deferred.reject);
	    return deferred.promise;
	};

	/**
	 * If a function would like to support both Node continuation-passing-style and
	 * promise-returning-style, it can end its internal promise chain with
	 * `nodeify(nodeback)`, forwarding the optional nodeback argument.  If the user
	 * elects to use a nodeback, the result will be sent there.  If they do not
	 * pass a nodeback, they will receive the result promise.
	 * @param object a result (or a promise for a result)
	 * @param {Function} nodeback a Node.js-style callback
	 * @returns either the promise or nothing
	 */
	Q.nodeify = nodeify;
	function nodeify(object, nodeback) {
	    return Q(object).nodeify(nodeback);
	}

	Promise.prototype.nodeify = function (nodeback) {
	    if (nodeback) {
	        this.then(function (value) {
	            nextTick(function () {
	                nodeback(null, value);
	            });
	        }, function (error) {
	            nextTick(function () {
	                nodeback(error);
	            });
	        });
	    } else {
	        return this;
	    }
	};

	// All code before this point will be filtered from stack traces.
	var qEndingLine = captureLine();

	return Q;

	});
	
	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(30)))

/***/ },
/* 12 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(process) {(function() {
	  var isEqual, isPlainObject, macModifierKeyMap, nonMacModifierKeyMap, plus, shiftKeyMap, splitKeyPath, _,
	    __slice = [].slice;

	  _ = __webpack_require__(33);

	  macModifierKeyMap = {
	    cmd: '\u2318',
	    ctrl: '\u2303',
	    alt: '\u2325',
	    option: '\u2325',
	    shift: '\u21e7',
	    enter: '\u23ce',
	    left: '\u2190',
	    right: '\u2192',
	    up: '\u2191',
	    down: '\u2193'
	  };

	  nonMacModifierKeyMap = {
	    cmd: 'Cmd',
	    ctrl: 'Ctrl',
	    alt: 'Alt',
	    option: 'Alt',
	    shift: 'Shift',
	    enter: 'Enter',
	    left: 'Left',
	    right: 'Right',
	    up: 'Up',
	    down: 'Down'
	  };

	  shiftKeyMap = {
	    '~': '`',
	    '_': '-',
	    '+': '=',
	    '|': '\\',
	    '{': '[',
	    '}': ']',
	    ':': ';',
	    '"': '\'',
	    '<': ',',
	    '>': '.',
	    '?': '/'
	  };

	  splitKeyPath = function(keyPath) {
	    var char, i, keyPathArray, startIndex, _i, _len;
	    startIndex = 0;
	    keyPathArray = [];
	    if (keyPath == null) {
	      return keyPathArray;
	    }
	    for (i = _i = 0, _len = keyPath.length; _i < _len; i = ++_i) {
	      char = keyPath[i];
	      if (char === '.' && (i === 0 || keyPath[i - 1] !== '\\')) {
	        keyPathArray.push(keyPath.substring(startIndex, i));
	        startIndex = i + 1;
	      }
	    }
	    keyPathArray.push(keyPath.substr(startIndex, keyPath.length));
	    return keyPathArray;
	  };

	  isPlainObject = function(value) {
	    return _.isObject(value) && !_.isArray(value);
	  };

	  plus = {
	    adviseBefore: function(object, methodName, advice) {
	      var original;
	      original = object[methodName];
	      return object[methodName] = function() {
	        var args;
	        args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
	        if (advice.apply(this, args) !== false) {
	          return original.apply(this, args);
	        }
	      };
	    },
	    camelize: function(string) {
	      if (string) {
	        return string.replace(/[_-]+(\w)/g, function(m) {
	          return m[1].toUpperCase();
	        });
	      } else {
	        return '';
	      }
	    },
	    capitalize: function(word) {
	      if (!word) {
	        return '';
	      }
	      if (word.toLowerCase() === 'github') {
	        return 'GitHub';
	      } else {
	        return word[0].toUpperCase() + word.slice(1);
	      }
	    },
	    compactObject: function(object) {
	      var key, newObject, value;
	      newObject = {};
	      for (key in object) {
	        value = object[key];
	        if (value != null) {
	          newObject[key] = value;
	        }
	      }
	      return newObject;
	    },
	    dasherize: function(string) {
	      if (!string) {
	        return '';
	      }
	      string = string[0].toLowerCase() + string.slice(1);
	      return string.replace(/([A-Z])|(_)/g, function(m, letter) {
	        if (letter) {
	          return "-" + letter.toLowerCase();
	        } else {
	          return "-";
	        }
	      });
	    },
	    deepClone: function(object) {
	      if (_.isArray(object)) {
	        return object.map(function(value) {
	          return plus.deepClone(value);
	        });
	      } else if (_.isObject(object) && !_.isFunction(object)) {
	        return plus.mapObject(object, (function(_this) {
	          return function(key, value) {
	            return [key, plus.deepClone(value)];
	          };
	        })(this));
	      } else {
	        return object;
	      }
	    },
	    deepExtend: function(target) {
	      var i, key, object, result, _i, _len, _ref;
	      result = target;
	      i = 0;
	      while (++i < arguments.length) {
	        object = arguments[i];
	        if (isPlainObject(result) && isPlainObject(object)) {
	          _ref = Object.keys(object);
	          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
	            key = _ref[_i];
	            result[key] = plus.deepExtend(result[key], object[key]);
	          }
	        } else {
	          result = plus.deepClone(object);
	        }
	      }
	      return result;
	    },
	    deepContains: function(array, target) {
	      var object, _i, _len;
	      if (array == null) {
	        return false;
	      }
	      for (_i = 0, _len = array.length; _i < _len; _i++) {
	        object = array[_i];
	        if (_.isEqual(object, target)) {
	          return true;
	        }
	      }
	      return false;
	    },
	    endsWith: function(string, suffix) {
	      if (suffix == null) {
	        suffix = '';
	      }
	      if (string) {
	        return string.indexOf(suffix, string.length - suffix.length) !== -1;
	      } else {
	        return false;
	      }
	    },
	    escapeAttribute: function(string) {
	      if (string) {
	        return string.replace(/"/g, '&quot;').replace(/\n/g, '').replace(/\\/g, '-');
	      } else {
	        return '';
	      }
	    },
	    escapeRegExp: function(string) {
	      if (string) {
	        return string.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
	      } else {
	        return '';
	      }
	    },
	    humanizeEventName: function(eventName, eventDoc) {
	      var event, namespace, namespaceDoc, _ref;
	      _ref = eventName.split(':'), namespace = _ref[0], event = _ref[1];
	      if (event == null) {
	        return plus.undasherize(namespace);
	      }
	      namespaceDoc = plus.undasherize(namespace);
	      if (eventDoc == null) {
	        eventDoc = plus.undasherize(event);
	      }
	      return "" + namespaceDoc + ": " + eventDoc;
	    },
	    humanizeKey: function(key, platform) {
	      var modifierKeyMap;
	      if (platform == null) {
	        platform = process.platform;
	      }
	      if (!key) {
	        return key;
	      }
	      modifierKeyMap = platform === 'darwin' ? macModifierKeyMap : nonMacModifierKeyMap;
	      if (modifierKeyMap[key]) {
	        return modifierKeyMap[key];
	      } else if (key.length === 1 && (shiftKeyMap[key] != null)) {
	        return [modifierKeyMap.shift, shiftKeyMap[key]];
	      } else if (key.length === 1 && key === key.toUpperCase() && key.toUpperCase() !== key.toLowerCase()) {
	        return [modifierKeyMap.shift, key.toUpperCase()];
	      } else if (key.length === 1 || /f[0-9]{1,2}/.test(key)) {
	        return key.toUpperCase();
	      } else {
	        if (platform === 'darwin') {
	          return key;
	        } else {
	          return plus.capitalize(key);
	        }
	      }
	    },
	    humanizeKeystroke: function(keystroke, platform) {
	      var humanizedKeystrokes, index, key, keys, keystrokes, splitKeystroke, _i, _j, _len, _len1;
	      if (platform == null) {
	        platform = process.platform;
	      }
	      if (!keystroke) {
	        return keystroke;
	      }
	      keystrokes = keystroke.split(' ');
	      humanizedKeystrokes = [];
	      for (_i = 0, _len = keystrokes.length; _i < _len; _i++) {
	        keystroke = keystrokes[_i];
	        keys = [];
	        splitKeystroke = keystroke.split('-');
	        for (index = _j = 0, _len1 = splitKeystroke.length; _j < _len1; index = ++_j) {
	          key = splitKeystroke[index];
	          if (key === '' && splitKeystroke[index - 1] === '') {
	            key = '-';
	          }
	          if (key) {
	            keys.push(plus.humanizeKey(key, platform));
	          }
	        }
	        keys = _.uniq(_.flatten(keys));
	        if (platform === 'darwin') {
	          keys = keys.join('');
	        } else {
	          keys = keys.join('+');
	        }
	        humanizedKeystrokes.push(keys);
	      }
	      return humanizedKeystrokes.join(' ');
	    },
	    isSubset: function(potentialSubset, potentialSuperset) {
	      return _.every(potentialSubset, function(element) {
	        return _.include(potentialSuperset, element);
	      });
	    },
	    losslessInvert: function(hash) {
	      var inverted, key, value;
	      inverted = {};
	      for (key in hash) {
	        value = hash[key];
	        if (inverted[value] == null) {
	          inverted[value] = [];
	        }
	        inverted[value].push(key);
	      }
	      return inverted;
	    },
	    mapObject: function(object, iterator) {
	      var key, newObject, value, _i, _len, _ref, _ref1;
	      newObject = {};
	      _ref = Object.keys(object);
	      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
	        key = _ref[_i];
	        _ref1 = iterator(key, object[key]), key = _ref1[0], value = _ref1[1];
	        newObject[key] = value;
	      }
	      return newObject;
	    },
	    multiplyString: function(string, n) {
	      var finalString, i;
	      finalString = "";
	      i = 0;
	      while (i < n) {
	        finalString += string;
	        i++;
	      }
	      return finalString;
	    },
	    pluralize: function(count, singular, plural) {
	      if (count == null) {
	        count = 0;
	      }
	      if (plural == null) {
	        plural = singular + 's';
	      }
	      if (count === 1) {
	        return "" + count + " " + singular;
	      } else {
	        return "" + count + " " + plural;
	      }
	    },
	    remove: function(array, element) {
	      var index;
	      index = array.indexOf(element);
	      if (index >= 0) {
	        array.splice(index, 1);
	      }
	      return array;
	    },
	    setValueForKeyPath: function(object, keyPath, value) {
	      var key, keys;
	      keys = splitKeyPath(keyPath);
	      while (keys.length > 1) {
	        key = keys.shift();
	        if (object[key] == null) {
	          object[key] = {};
	        }
	        object = object[key];
	      }
	      if (value != null) {
	        return object[keys.shift()] = value;
	      } else {
	        return delete object[keys.shift()];
	      }
	    },
	    hasKeyPath: function(object, keyPath) {
	      var key, keys, _i, _len;
	      keys = splitKeyPath(keyPath);
	      for (_i = 0, _len = keys.length; _i < _len; _i++) {
	        key = keys[_i];
	        if (!object.hasOwnProperty(key)) {
	          return false;
	        }
	        object = object[key];
	      }
	      return true;
	    },
	    spliceWithArray: function(originalArray, start, length, insertedArray, chunkSize) {
	      var chunkStart, _i, _ref, _results;
	      if (chunkSize == null) {
	        chunkSize = 100000;
	      }
	      if (insertedArray.length < chunkSize) {
	        return originalArray.splice.apply(originalArray, [start, length].concat(__slice.call(insertedArray)));
	      } else {
	        originalArray.splice(start, length);
	        _results = [];
	        for (chunkStart = _i = 0, _ref = insertedArray.length; chunkSize > 0 ? _i <= _ref : _i >= _ref; chunkStart = _i += chunkSize) {
	          _results.push(originalArray.splice.apply(originalArray, [start + chunkStart, 0].concat(__slice.call(insertedArray.slice(chunkStart, chunkStart + chunkSize)))));
	        }
	        return _results;
	      }
	    },
	    sum: function(array) {
	      var elt, sum, _i, _len;
	      sum = 0;
	      for (_i = 0, _len = array.length; _i < _len; _i++) {
	        elt = array[_i];
	        sum += elt;
	      }
	      return sum;
	    },
	    uncamelcase: function(string) {
	      var result;
	      if (!string) {
	        return '';
	      }
	      result = string.replace(/([A-Z])|_+/g, function(match, letter) {
	        if (letter == null) {
	          letter = '';
	        }
	        return " " + letter;
	      });
	      return plus.capitalize(result.trim());
	    },
	    undasherize: function(string) {
	      if (string) {
	        return string.split('-').map(plus.capitalize).join(' ');
	      } else {
	        return '';
	      }
	    },
	    underscore: function(string) {
	      if (!string) {
	        return '';
	      }
	      string = string[0].toLowerCase() + string.slice(1);
	      return string.replace(/([A-Z])|-+/g, function(match, letter) {
	        if (letter == null) {
	          letter = '';
	        }
	        return "_" + (letter.toLowerCase());
	      });
	    },
	    valueForKeyPath: function(object, keyPath) {
	      var key, keys, _i, _len;
	      keys = splitKeyPath(keyPath);
	      for (_i = 0, _len = keys.length; _i < _len; _i++) {
	        key = keys[_i];
	        object = object[key];
	        if (object == null) {
	          return;
	        }
	      }
	      return object;
	    },
	    isEqual: function(a, b, aStack, bStack) {
	      if (_.isArray(aStack) && _.isArray(bStack)) {
	        return isEqual(a, b, aStack, bStack);
	      } else {
	        return isEqual(a, b);
	      }
	    },
	    isEqualForProperties: function() {
	      var a, b, properties, property, _i, _len;
	      a = arguments[0], b = arguments[1], properties = 3 <= arguments.length ? __slice.call(arguments, 2) : [];
	      for (_i = 0, _len = properties.length; _i < _len; _i++) {
	        property = properties[_i];
	        if (!_.isEqual(a[property], b[property])) {
	          return false;
	        }
	      }
	      return true;
	    }
	  };

	  isEqual = function(a, b, aStack, bStack) {
	    var aCtor, aCtorValid, aElement, aKeyCount, aValue, bCtor, bCtorValid, bKeyCount, bValue, equal, i, key, stackIndex, _i, _len;
	    if (aStack == null) {
	      aStack = [];
	    }
	    if (bStack == null) {
	      bStack = [];
	    }
	    if (a === b) {
	      return _.isEqual(a, b);
	    }
	    if (_.isFunction(a) || _.isFunction(b)) {
	      return _.isEqual(a, b);
	    }
	    stackIndex = aStack.length;
	    while (stackIndex--) {
	      if (aStack[stackIndex] === a) {
	        return bStack[stackIndex] === b;
	      }
	    }
	    aStack.push(a);
	    bStack.push(b);
	    equal = false;
	    if (_.isFunction(a != null ? a.isEqual : void 0)) {
	      equal = a.isEqual(b, aStack, bStack);
	    } else if (_.isFunction(b != null ? b.isEqual : void 0)) {
	      equal = b.isEqual(a, bStack, aStack);
	    } else if (_.isArray(a) && _.isArray(b) && a.length === b.length) {
	      equal = true;
	      for (i = _i = 0, _len = a.length; _i < _len; i = ++_i) {
	        aElement = a[i];
	        if (!isEqual(aElement, b[i], aStack, bStack)) {
	          equal = false;
	          break;
	        }
	      }
	    } else if (_.isRegExp(a) && _.isRegExp(b)) {
	      equal = _.isEqual(a, b);
	    } else if (_.isElement(a) && _.isElement(b)) {
	      equal = a === b;
	    } else if (_.isObject(a) && _.isObject(b)) {
	      aCtor = a.constructor;
	      bCtor = b.constructor;
	      aCtorValid = _.isFunction(aCtor) && aCtor instanceof aCtor;
	      bCtorValid = _.isFunction(bCtor) && bCtor instanceof bCtor;
	      if (aCtor !== bCtor && !(aCtorValid && bCtorValid)) {
	        equal = false;
	      } else {
	        aKeyCount = 0;
	        equal = true;
	        for (key in a) {
	          aValue = a[key];
	          if (!_.has(a, key)) {
	            continue;
	          }
	          aKeyCount++;
	          if (!(_.has(b, key) && isEqual(aValue, b[key], aStack, bStack))) {
	            equal = false;
	            break;
	          }
	        }
	        if (equal) {
	          bKeyCount = 0;
	          for (key in b) {
	            bValue = b[key];
	            if (_.has(b, key)) {
	              bKeyCount++;
	            }
	          }
	          equal = aKeyCount === bKeyCount;
	        }
	      }
	    } else {
	      equal = _.isEqual(a, b);
	    }
	    aStack.pop();
	    bStack.pop();
	    return equal;
	  };

	  module.exports = _.extend({}, _, plus);

	}).call(this);
	
	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(30)))

/***/ },
/* 13 */
/***/ function(module, exports, __webpack_require__) {

	(function() {
	  var Delegator, Mixin, _ref,
	    __hasProp = {}.hasOwnProperty,
	    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
	    __slice = [].slice;

	  Mixin = __webpack_require__(35);

	  module.exports = Delegator = (function(_super) {
	    __extends(Delegator, _super);

	    function Delegator() {
	      _ref = Delegator.__super__.constructor.apply(this, arguments);
	      return _ref;
	    }

	    Delegator.delegatesProperties = function() {
	      var propertyName, propertyNames, toMethod, toProperty, _arg, _i, _j, _len, _results,
	        _this = this;
	      propertyNames = 2 <= arguments.length ? __slice.call(arguments, 0, _i = arguments.length - 1) : (_i = 0, []), _arg = arguments[_i++];
	      toProperty = _arg.toProperty, toMethod = _arg.toMethod;
	      _results = [];
	      for (_j = 0, _len = propertyNames.length; _j < _len; _j++) {
	        propertyName = propertyNames[_j];
	        _results.push((function(propertyName) {
	          return Object.defineProperty(_this.prototype, propertyName, (function() {
	            if (toProperty != null) {
	              return {
	                get: function() {
	                  return this[toProperty][propertyName];
	                },
	                set: function(value) {
	                  return this[toProperty][propertyName] = value;
	                }
	              };
	            } else if (toMethod != null) {
	              return {
	                get: function() {
	                  return this[toMethod]()[propertyName];
	                },
	                set: function(value) {
	                  return this[toMethod]()[propertyName] = value;
	                }
	              };
	            } else {
	              throw new Error("No delegation target specified");
	            }
	          })());
	        })(propertyName));
	      }
	      return _results;
	    };

	    Delegator.delegatesMethods = function() {
	      var methodName, methodNames, toMethod, toProperty, _arg, _i, _j, _len, _results,
	        _this = this;
	      methodNames = 2 <= arguments.length ? __slice.call(arguments, 0, _i = arguments.length - 1) : (_i = 0, []), _arg = arguments[_i++];
	      toProperty = _arg.toProperty, toMethod = _arg.toMethod;
	      _results = [];
	      for (_j = 0, _len = methodNames.length; _j < _len; _j++) {
	        methodName = methodNames[_j];
	        _results.push((function(methodName) {
	          if (toProperty != null) {
	            return _this.prototype[methodName] = function() {
	              var args, _ref1;
	              args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
	              return (_ref1 = this[toProperty])[methodName].apply(_ref1, args);
	            };
	          } else if (toMethod != null) {
	            return _this.prototype[methodName] = function() {
	              var args, _ref1;
	              args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
	              return (_ref1 = this[toMethod]())[methodName].apply(_ref1, args);
	            };
	          } else {
	            throw new Error("No delegation target specified");
	          }
	        })(methodName));
	      }
	      return _results;
	    };

	    Delegator.delegatesProperty = function() {
	      var args;
	      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
	      return this.delegatesProperties.apply(this, args);
	    };

	    Delegator.delegatesMethod = function() {
	      var args;
	      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
	      return this.delegatesMethods.apply(this, args);
	    };

	    return Delegator;

	  })(Mixin);

	}).call(this);


/***/ },
/* 14 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(global) {(function() {
	  var Deprecation, Emitter, grim, _;

	  _ = __webpack_require__(12);

	  Emitter = __webpack_require__(16).Emitter;

	  Deprecation = __webpack_require__(21);

	  if (global.__grim__ == null) {
	    grim = global.__grim__ = {
	      deprecations: {},
	      getDeprecations: function() {
	        var deprecation, deprecations, deprecationsByLineNumber, fileName, lineNumber, _ref;
	        deprecations = [];
	        _ref = grim.deprecations;
	        for (fileName in _ref) {
	          deprecationsByLineNumber = _ref[fileName];
	          for (lineNumber in deprecationsByLineNumber) {
	            deprecation = deprecationsByLineNumber[lineNumber];
	            deprecations.push(deprecation);
	          }
	        }
	        return deprecations;
	      },
	      getDeprecationsLength: function() {
	        return this.getDeprecations().length;
	      },
	      clearDeprecations: function() {
	        return grim.deprecations = {};
	      },
	      logDeprecations: function() {
	        var deprecation, deprecations, _i, _len, _results;
	        deprecations = this.getDeprecations();
	        deprecations.sort(function(a, b) {
	          return b.getCallCount() - a.getCallCount();
	        });
	        console.warn("\nCalls to deprecated functions\n-----------------------------");
	        _results = [];
	        for (_i = 0, _len = deprecations.length; _i < _len; _i++) {
	          deprecation = deprecations[_i];
	          _results.push(console.warn("(" + (deprecation.getCallCount()) + ") " + (deprecation.getOriginName()) + " : " + (deprecation.getMessage()), deprecation));
	        }
	        return _results;
	      },
	      deprecate: function(message) {
	        var deprecation, deprecationSite, error, fileName, lineNumber, originalPrepareStackTrace, originalStackTraceLimit, stack, _base, _base1;
	        originalStackTraceLimit = Error.stackTraceLimit;
	        Error.stackTraceLimit = 3;
	        error = new Error;
	        Error.captureStackTrace(error);
	        Error.stackTraceLimit = originalStackTraceLimit;
	        originalPrepareStackTrace = Error.prepareStackTrace;
	        Error.prepareStackTrace = function(error, stack) {
	          return stack;
	        };
	        stack = error.stack.slice(1);
	        Error.prepareStackTrace = originalPrepareStackTrace;
	        deprecationSite = stack[0];
	        fileName = deprecationSite.getFileName();
	        lineNumber = deprecationSite.getLineNumber();
	        if ((_base = grim.deprecations)[fileName] == null) {
	          _base[fileName] = {};
	        }
	        if ((_base1 = grim.deprecations[fileName])[lineNumber] == null) {
	          _base1[lineNumber] = new Deprecation(message);
	        }
	        deprecation = grim.deprecations[fileName][lineNumber];
	        deprecation.addStack(stack);
	        return grim.emit("updated", deprecation);
	      }
	    };
	    Emitter.extend(grim);
	  }

	  module.exports = global.__grim__;

	}).call(this);
	
	/* WEBPACK VAR INJECTION */}.call(exports, (function() { return this; }())))

/***/ },
/* 15 */
/***/ function(module, exports, __webpack_require__) {

	(function() {
	  var Mixin, Serializable, extend, getParameterNames, _ref,
	    __hasProp = {}.hasOwnProperty,
	    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
	    __slice = [].slice;

	  extend = __webpack_require__(12).extend;

	  Mixin = __webpack_require__(36);

	  getParameterNames = __webpack_require__(31);

	  module.exports = Serializable = (function(_super) {
	    __extends(Serializable, _super);

	    function Serializable() {
	      _ref = Serializable.__super__.constructor.apply(this, arguments);
	      return _ref;
	    }

	    Serializable.prototype.deserializers = null;

	    Serializable.registerDeserializers = function() {
	      var deserializer, deserializers, _i, _len, _results;
	      deserializers = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
	      _results = [];
	      for (_i = 0, _len = deserializers.length; _i < _len; _i++) {
	        deserializer = deserializers[_i];
	        _results.push(this.registerDeserializer(deserializer));
	      }
	      return _results;
	    };

	    Serializable.registerDeserializer = function(deserializer) {
	      if (this.deserializers == null) {
	        this.deserializers = {};
	      }
	      return this.deserializers[deserializer.name] = deserializer;
	    };

	    Serializable.deserialize = function(state, params) {
	      var deserializer, object, orderedParams, _ref1;
	      if (state == null) {
	        return;
	      }
	      if (state.deserializer === this.name) {
	        deserializer = this;
	      } else {
	        deserializer = (_ref1 = this.deserializers) != null ? _ref1[state.deserializer] : void 0;
	      }
	      if (!((deserializer != null) && deserializer.version === state.version)) {
	        return;
	      }
	      object = Object.create(deserializer.prototype);
	      params = extend({}, state, params);
	      delete params.deserializer;
	      if (typeof object.deserializeParams === 'function') {
	        params = object.deserializeParams(params);
	      }
	      if (params == null) {
	        return;
	      }
	      if (deserializer.parameterNames == null) {
	        deserializer.parameterNames = getParameterNames(deserializer);
	      }
	      if (deserializer.parameterNames.length > 1 || params.hasOwnProperty(deserializer.parameterNames[0])) {
	        orderedParams = deserializer.parameterNames.map(function(name) {
	          return params[name];
	        });
	        deserializer.call.apply(deserializer, [object].concat(__slice.call(orderedParams)));
	      } else {
	        deserializer.call(object, params);
	      }
	      return object;
	    };

	    Serializable.prototype.serialize = function() {
	      var state, _ref1;
	      state = (_ref1 = typeof this.serializeParams === "function" ? this.serializeParams() : void 0) != null ? _ref1 : {};
	      state.deserializer = this.constructor.name;
	      if (this.constructor.version != null) {
	        state.version = this.constructor.version;
	      }
	      return state;
	    };

	    Serializable.prototype.testSerialization = function(params) {
	      return this.constructor.deserialize(this.serialize(), params);
	    };

	    return Serializable;

	  })(Mixin);

	}).call(this);


/***/ },
/* 16 */
/***/ function(module, exports, __webpack_require__) {

	(function() {
	  var combine;

	  combine = __webpack_require__(22).combine;

	  module.exports = {
	    Emitter: __webpack_require__(23),
	    Subscriber: __webpack_require__(24),
	    Signal: __webpack_require__(25),
	    Behavior: __webpack_require__(26),
	    combine: combine
	  };

	}).call(this);


/***/ },
/* 17 */
/***/ function(module, exports, __webpack_require__) {

	(function() {
	  exports.Emitter = __webpack_require__(27);

	  exports.Disposable = __webpack_require__(28);

	  exports.CompositeDisposable = __webpack_require__(29);

	}).call(this);


/***/ },
/* 18 */
/***/ function(module, exports, __webpack_require__) {

	(function() {
	  var Node, SpanSkipList, clone, isEqual, random, _ref,
	    __slice = [].slice;

	  _ref = __webpack_require__(34), random = _ref.random, clone = _ref.clone, isEqual = _ref.isEqual;

	  module.exports = SpanSkipList = (function() {
	    SpanSkipList.prototype.maxHeight = 8;

	    SpanSkipList.prototype.probability = .25;

	    function SpanSkipList() {
	      var dimensions, i, _i, _ref1;
	      dimensions = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
	      this.dimensions = dimensions;
	      this.head = new Node(this.maxHeight, this.buildZeroDistance());
	      this.tail = new Node(this.maxHeight, this.buildZeroDistance());
	      for (i = _i = 0, _ref1 = this.maxHeight; 0 <= _ref1 ? _i < _ref1 : _i > _ref1; i = 0 <= _ref1 ? ++_i : --_i) {
	        this.head.next[i] = this.tail;
	        this.head.distance[i] = this.buildZeroDistance();
	      }
	    }

	    SpanSkipList.prototype.totalTo = function(target, dimension) {
	      var i, nextDistanceInTargetDimension, node, totalDistance, _i, _ref1, _ref2;
	      totalDistance = this.buildZeroDistance();
	      node = this.head;
	      for (i = _i = _ref1 = this.maxHeight - 1; _ref1 <= 0 ? _i <= 0 : _i >= 0; i = _ref1 <= 0 ? ++_i : --_i) {
	        while (true) {
	          if (node.next[i] === this.tail) {
	            break;
	          }
	          nextDistanceInTargetDimension = totalDistance[dimension] + node.distance[i][dimension] + ((_ref2 = node.next[i].element[dimension]) != null ? _ref2 : 1);
	          if (nextDistanceInTargetDimension > target) {
	            break;
	          }
	          this.incrementDistance(totalDistance, node.distance[i]);
	          this.incrementDistance(totalDistance, node.next[i].element);
	          node = node.next[i];
	        }
	      }
	      return totalDistance;
	    };

	    SpanSkipList.prototype.splice = function() {
	      var count, dimension, elements, index;
	      dimension = arguments[0], index = arguments[1], count = arguments[2], elements = 4 <= arguments.length ? __slice.call(arguments, 3) : [];
	      return this.spliceArray(dimension, index, count, elements);
	    };

	    SpanSkipList.prototype.spliceArray = function(dimension, index, count, elements) {
	      var element, i, newNode, nextNode, previous, previousDistances, removedElements;
	      previous = this.buildPreviousArray();
	      previousDistances = this.buildPreviousDistancesArray();
	      nextNode = this.findClosestNode(dimension, index, previous, previousDistances);
	      removedElements = [];
	      while (count > 0 && nextNode !== this.tail) {
	        removedElements.push(nextNode.element);
	        nextNode = this.removeNode(nextNode, previous, previousDistances);
	        count--;
	      }
	      i = elements.length - 1;
	      while (i >= 0) {
	        element = elements[i];
	        newNode = new Node(this.getRandomNodeHeight(), element);
	        this.insertNode(newNode, previous, previousDistances);
	        i--;
	      }
	      return removedElements;
	    };

	    SpanSkipList.prototype.getLength = function() {
	      return this.getElements().length;
	    };

	    SpanSkipList.prototype.getElements = function() {
	      var elements, node;
	      elements = [];
	      node = this.head;
	      while (node.next[0] !== this.tail) {
	        elements.push(node.next[0].element);
	        node = node.next[0];
	      }
	      return elements;
	    };

	    SpanSkipList.prototype.findClosestNode = function(dimension, index, previous, previousDistances) {
	      var i, nextHopDistance, node, totalDistance, _i, _ref1, _ref2;
	      totalDistance = this.buildZeroDistance();
	      node = this.head;
	      for (i = _i = _ref1 = this.maxHeight - 1; _ref1 <= 0 ? _i <= 0 : _i >= 0; i = _ref1 <= 0 ? ++_i : --_i) {
	        while (true) {
	          if (node.next[i] === this.tail) {
	            break;
	          }
	          nextHopDistance = ((_ref2 = node.next[i].element[dimension]) != null ? _ref2 : 1) + node.distance[i][dimension];
	          if (totalDistance[dimension] + nextHopDistance > index) {
	            break;
	          }
	          this.incrementDistance(totalDistance, node.distance[i]);
	          this.incrementDistance(totalDistance, node.next[i].element);
	          this.incrementDistance(previousDistances[i], node.distance[i]);
	          this.incrementDistance(previousDistances[i], node.next[i].element);
	          node = node.next[i];
	        }
	        previous[i] = node;
	      }
	      return node.next[0];
	    };

	    SpanSkipList.prototype.insertNode = function(node, previous, previousDistances) {
	      var coveredDistance, level, _i, _j, _ref1, _ref2, _ref3, _results;
	      coveredDistance = this.buildZeroDistance();
	      for (level = _i = 0, _ref1 = node.height; 0 <= _ref1 ? _i < _ref1 : _i > _ref1; level = 0 <= _ref1 ? ++_i : --_i) {
	        node.next[level] = previous[level].next[level];
	        previous[level].next[level] = node;
	        node.distance[level] = this.subtractDistances(previous[level].distance[level], coveredDistance);
	        previous[level].distance[level] = clone(coveredDistance);
	        this.incrementDistance(coveredDistance, previousDistances[level]);
	      }
	      _results = [];
	      for (level = _j = _ref2 = node.height, _ref3 = this.maxHeight; _ref2 <= _ref3 ? _j < _ref3 : _j > _ref3; level = _ref2 <= _ref3 ? ++_j : --_j) {
	        _results.push(this.incrementDistance(previous[level].distance[level], node.element));
	      }
	      return _results;
	    };

	    SpanSkipList.prototype.removeNode = function(node, previous) {
	      var level, _i, _j, _ref1, _ref2, _ref3;
	      for (level = _i = 0, _ref1 = node.height; 0 <= _ref1 ? _i < _ref1 : _i > _ref1; level = 0 <= _ref1 ? ++_i : --_i) {
	        previous[level].next[level] = node.next[level];
	        this.incrementDistance(previous[level].distance[level], node.distance[level]);
	      }
	      for (level = _j = _ref2 = node.height, _ref3 = this.maxHeight; _ref2 <= _ref3 ? _j < _ref3 : _j > _ref3; level = _ref2 <= _ref3 ? ++_j : --_j) {
	        this.decrementDistance(previous[level].distance[level], node.element);
	      }
	      return node.next[0];
	    };

	    SpanSkipList.prototype.buildPreviousArray = function() {
	      var i, previous, _i, _ref1;
	      previous = new Array(this.maxHeight);
	      for (i = _i = 0, _ref1 = this.maxHeight; 0 <= _ref1 ? _i < _ref1 : _i > _ref1; i = 0 <= _ref1 ? ++_i : --_i) {
	        previous[i] = this.head;
	      }
	      return previous;
	    };

	    SpanSkipList.prototype.buildPreviousDistancesArray = function() {
	      var distances, i, _i, _ref1;
	      distances = new Array(this.maxHeight);
	      for (i = _i = 0, _ref1 = this.maxHeight; 0 <= _ref1 ? _i < _ref1 : _i > _ref1; i = 0 <= _ref1 ? ++_i : --_i) {
	        distances[i] = this.buildZeroDistance();
	      }
	      return distances;
	    };

	    SpanSkipList.prototype.getRandomNodeHeight = function() {
	      var height;
	      height = 1;
	      while (height < this.maxHeight && Math.random() < this.probability) {
	        height++;
	      }
	      return height;
	    };

	    SpanSkipList.prototype.buildZeroDistance = function() {
	      var dimension, distance, _i, _len, _ref1;
	      distance = {
	        elements: 0
	      };
	      _ref1 = this.dimensions;
	      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
	        dimension = _ref1[_i];
	        distance[dimension] = 0;
	      }
	      return distance;
	    };

	    SpanSkipList.prototype.incrementDistance = function(distance, delta) {
	      var dimension, _i, _len, _ref1, _ref2, _results;
	      distance.elements += (_ref1 = delta.elements) != null ? _ref1 : 1;
	      _ref2 = this.dimensions;
	      _results = [];
	      for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
	        dimension = _ref2[_i];
	        _results.push(distance[dimension] += delta[dimension]);
	      }
	      return _results;
	    };

	    SpanSkipList.prototype.decrementDistance = function(distance, delta) {
	      var dimension, _i, _len, _ref1, _ref2, _results;
	      distance.elements -= (_ref1 = delta.elements) != null ? _ref1 : 1;
	      _ref2 = this.dimensions;
	      _results = [];
	      for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
	        dimension = _ref2[_i];
	        _results.push(distance[dimension] -= delta[dimension]);
	      }
	      return _results;
	    };

	    SpanSkipList.prototype.addDistances = function(a, b) {
	      var dimension, distance, _i, _len, _ref1, _ref2, _ref3;
	      distance = {
	        elements: ((_ref1 = a.elements) != null ? _ref1 : 1) + ((_ref2 = b.elements) != null ? _ref2 : 1)
	      };
	      _ref3 = this.dimensions;
	      for (_i = 0, _len = _ref3.length; _i < _len; _i++) {
	        dimension = _ref3[_i];
	        distance[dimension] = a[dimension] + b[dimension];
	      }
	      return distance;
	    };

	    SpanSkipList.prototype.subtractDistances = function(a, b) {
	      var dimension, distance, _i, _len, _ref1, _ref2, _ref3;
	      distance = {
	        elements: ((_ref1 = a.elements) != null ? _ref1 : 1) - ((_ref2 = b.elements) != null ? _ref2 : 1)
	      };
	      _ref3 = this.dimensions;
	      for (_i = 0, _len = _ref3.length; _i < _len; _i++) {
	        dimension = _ref3[_i];
	        distance[dimension] = a[dimension] - b[dimension];
	      }
	      return distance;
	    };

	    SpanSkipList.prototype.verifyDistanceInvariant = function() {
	      var distanceOnPreviousLevel, distanceOnThisLevel, level, node, _i, _ref1, _results;
	      _results = [];
	      for (level = _i = _ref1 = this.maxHeight - 1; _ref1 <= 1 ? _i <= 1 : _i >= 1; level = _ref1 <= 1 ? ++_i : --_i) {
	        node = this.head;
	        _results.push((function() {
	          var _results1;
	          _results1 = [];
	          while (node !== this.tail) {
	            distanceOnThisLevel = this.addDistances(node.element, node.distance[level]);
	            distanceOnPreviousLevel = this.distanceBetweenNodesAtLevel(node, node.next[level], level - 1);
	            if (!isEqual(distanceOnThisLevel, distanceOnPreviousLevel)) {
	              console.log(this.inspect());
	              throw new Error("On level " + level + ": Distance " + (JSON.stringify(distanceOnThisLevel)) + " does not match " + (JSON.stringify(distanceOnPreviousLevel)));
	            }
	            _results1.push(node = node.next[level]);
	          }
	          return _results1;
	        }).call(this));
	      }
	      return _results;
	    };

	    SpanSkipList.prototype.distanceBetweenNodesAtLevel = function(startNode, endNode, level) {
	      var distance, node;
	      distance = this.buildZeroDistance();
	      node = startNode;
	      while (node !== endNode) {
	        this.incrementDistance(distance, node.element);
	        this.incrementDistance(distance, node.distance[level]);
	        node = node.next[level];
	      }
	      return distance;
	    };

	    return SpanSkipList;

	  })();

	  Node = (function() {
	    function Node(height, element) {
	      this.height = height;
	      this.element = element;
	      this.next = new Array(this.height);
	      this.distance = new Array(this.height);
	    }

	    return Node;

	  })();

	}).call(this);


/***/ },
/* 19 */
/***/ function(module, exports, __webpack_require__) {

	(function() {
	  var MarkerPatch, Range, Serializable, clone,
	    __hasProp = {}.hasOwnProperty,
	    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

	  clone = __webpack_require__(12).clone;

	  Serializable = __webpack_require__(15);

	  Range = __webpack_require__(2);

	  module.exports = MarkerPatch = (function(_super) {
	    __extends(MarkerPatch, _super);

	    function MarkerPatch(id, oldParams, newParams) {
	      this.id = id;
	      this.oldParams = oldParams;
	      this.newParams = newParams;
	    }

	    MarkerPatch.prototype.serializeParams = function() {
	      var newParams, oldParams;
	      oldParams = clone(this.oldParams);
	      if (this.oldParams.range != null) {
	        oldParams.range = this.oldParams.range.serialize();
	      }
	      newParams = clone(this.newParams);
	      if (this.newParams.range != null) {
	        newParams.range = this.newParams.range.serialize();
	      }
	      return {
	        id: this.id,
	        oldParams: oldParams,
	        newParams: newParams
	      };
	    };

	    MarkerPatch.prototype.deserializeParams = function(params) {
	      params.oldParams.range = Range.deserialize(params.oldParams.range);
	      params.newParams.range = Range.deserialize(params.newParams.range);
	      return params;
	    };

	    MarkerPatch.prototype.invert = function() {
	      return new this.constructor(this.id, this.newParams, this.oldParams);
	    };

	    MarkerPatch.prototype.applyTo = function(buffer) {
	      var _ref;
	      return (_ref = buffer.getMarker(this.id)) != null ? _ref.update(this.newParams) : void 0;
	    };

	    return MarkerPatch;

	  })(Serializable);

	}).call(this);


/***/ },
/* 20 */
/***/ function(module, exports, __webpack_require__) {

	(function() {
	  var DefaultComparator, IntervalSkipList, Node, clone, first, include, intersection, last, remove, union, _ref,
	    __slice = [].slice;

	  _ref = __webpack_require__(38), clone = _ref.clone, include = _ref.include, first = _ref.first, last = _ref.last, union = _ref.union, intersection = _ref.intersection;

	  remove = function(array, element) {
	    var index;
	    index = array.indexOf(element);
	    if (index !== -1) {
	      return array.splice(index, 1);
	    }
	  };

	  DefaultComparator = function(a, b) {
	    if (a < b) {
	      return -1;
	    } else if (a > b) {
	      return 1;
	    } else {
	      return 0;
	    }
	  };

	  module.exports = IntervalSkipList = (function() {
	    IntervalSkipList.prototype.maxHeight = 8;

	    IntervalSkipList.prototype.probability = .25;

	    function IntervalSkipList(params) {
	      var i, _i, _ref1;
	      if (params != null) {
	        this.compare = params.compare, this.minIndex = params.minIndex, this.maxIndex = params.maxIndex;
	      }
	      if (this.compare == null) {
	        this.compare = DefaultComparator;
	      }
	      if (this.minIndex == null) {
	        this.minIndex = -Infinity;
	      }
	      if (this.maxIndex == null) {
	        this.maxIndex = Infinity;
	      }
	      this.head = new Node(this.maxHeight, this.minIndex);
	      this.tail = new Node(this.maxHeight, this.maxIndex);
	      for (i = _i = 0, _ref1 = this.maxHeight; 0 <= _ref1 ? _i < _ref1 : _i > _ref1; i = 0 <= _ref1 ? ++_i : --_i) {
	        this.head.next[i] = this.tail;
	      }
	      this.intervalsByMarker = {};
	    }

	    IntervalSkipList.prototype.findContaining = function() {
	      var i, markers, node, searchIndex, searchIndices, _i, _ref1;
	      searchIndices = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
	      if (searchIndices.length > 1) {
	        searchIndices = this.sortIndices(searchIndices);
	        return intersection(this.findContaining(first(searchIndices)), this.findContaining(last(searchIndices)));
	      }
	      searchIndex = searchIndices[0];
	      markers = [];
	      node = this.head;
	      for (i = _i = _ref1 = this.maxHeight - 1; _ref1 <= 1 ? _i <= 1 : _i >= 1; i = _ref1 <= 1 ? ++_i : --_i) {
	        while (this.compare(node.next[i].index, searchIndex) < 0) {
	          node = node.next[i];
	        }
	        markers.push.apply(markers, node.markers[i]);
	      }
	      while (this.compare(node.next[0].index, searchIndex) < 0) {
	        node = node.next[0];
	      }
	      markers.push.apply(markers, node.markers[0]);
	      node = node.next[0];
	      if (this.compare(node.index, searchIndex) === 0) {
	        return markers.concat(node.startingMarkers);
	      } else {
	        return markers;
	      }
	    };

	    IntervalSkipList.prototype.findIntersecting = function(searchStartIndex, searchEndIndex) {
	      var i, markers, node, _i, _ref1;
	      markers = [];
	      node = this.head;
	      for (i = _i = _ref1 = this.maxHeight - 1; _ref1 <= 1 ? _i <= 1 : _i >= 1; i = _ref1 <= 1 ? ++_i : --_i) {
	        while (this.compare(node.next[i].index, searchStartIndex) < 0) {
	          node = node.next[i];
	        }
	        markers.push.apply(markers, node.markers[i]);
	      }
	      while (this.compare(node.next[0].index, searchStartIndex) < 0) {
	        node = node.next[0];
	      }
	      markers.push.apply(markers, node.markers[0]);
	      node = node.next[0];
	      while (this.compare(node.index, searchEndIndex) <= 0) {
	        markers.push.apply(markers, node.startingMarkers);
	        node = node.next[0];
	      }
	      return markers;
	    };

	    IntervalSkipList.prototype.findStartingAt = function(searchIndex) {
	      var node;
	      node = this.findClosestNode(searchIndex);
	      if (this.compare(node.index, searchIndex) === 0) {
	        return node.startingMarkers;
	      } else {
	        return [];
	      }
	    };

	    IntervalSkipList.prototype.findEndingAt = function(searchIndex) {
	      var node;
	      node = this.findClosestNode(searchIndex);
	      if (this.compare(node.index, searchIndex) === 0) {
	        return node.endingMarkers;
	      } else {
	        return [];
	      }
	    };

	    IntervalSkipList.prototype.findStartingIn = function(searchStartIndex, searchEndIndex) {
	      var markers, node;
	      markers = [];
	      node = this.findClosestNode(searchStartIndex);
	      while (this.compare(node.index, searchEndIndex) <= 0) {
	        markers.push.apply(markers, node.startingMarkers);
	        node = node.next[0];
	      }
	      return markers;
	    };

	    IntervalSkipList.prototype.findEndingIn = function(searchStartIndex, searchEndIndex) {
	      var markers, node;
	      markers = [];
	      node = this.findClosestNode(searchStartIndex);
	      while (this.compare(node.index, searchEndIndex) <= 0) {
	        markers.push.apply(markers, node.endingMarkers);
	        node = node.next[0];
	      }
	      return markers;
	    };

	    IntervalSkipList.prototype.findContainedIn = function(searchStartIndex, searchEndIndex) {
	      var marker, markers, node, startedMarkers, _i, _j, _len, _len1, _ref1, _ref2;
	      startedMarkers = {};
	      markers = [];
	      node = this.findClosestNode(searchStartIndex);
	      while (this.compare(node.index, searchEndIndex) <= 0) {
	        _ref1 = node.startingMarkers;
	        for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
	          marker = _ref1[_i];
	          startedMarkers[marker] = true;
	        }
	        _ref2 = node.endingMarkers;
	        for (_j = 0, _len1 = _ref2.length; _j < _len1; _j++) {
	          marker = _ref2[_j];
	          if (startedMarkers[marker]) {
	            markers.push(marker);
	          }
	        }
	        node = node.next[0];
	      }
	      return markers;
	    };

	    IntervalSkipList.prototype.insert = function(marker, startIndex, endIndex) {
	      var endNode, startNode;
	      if (this.intervalsByMarker[marker] != null) {
	        throw new Error("Interval for " + marker + " already exists.");
	      }
	      if (this.compare(startIndex, endIndex) > 0) {
	        throw new Error("Start index " + startIndex + " must be <= end index " + endIndex);
	      }
	      if (this.compare(startIndex, this.minIndex) < 0) {
	        throw new Error("Start index " + startIndex + " must be > min index " + this.minIndex);
	      }
	      if (this.compare(endIndex, this.maxIndex) >= 0) {
	        throw new Error("Start index " + endIndex + " must be < max index " + this.maxIndex);
	      }
	      startNode = this.insertNode(startIndex);
	      endNode = this.insertNode(endIndex);
	      this.placeMarker(marker, startNode, endNode);
	      return this.intervalsByMarker[marker] = [startIndex, endIndex];
	    };

	    IntervalSkipList.prototype.remove = function(marker) {
	      var endIndex, endNode, interval, startIndex, startNode;
	      if (!(interval = this.intervalsByMarker[marker])) {
	        return;
	      }
	      startIndex = interval[0], endIndex = interval[1];
	      delete this.intervalsByMarker[marker];
	      startNode = this.findClosestNode(startIndex);
	      endNode = this.findClosestNode(endIndex);
	      this.removeMarker(marker, startNode, endNode);
	      if (startNode.endpointMarkers.length === 0) {
	        this.removeNode(startIndex);
	      }
	      if (endNode.endpointMarkers.length === 0) {
	        return this.removeNode(endIndex);
	      }
	    };

	    IntervalSkipList.prototype.update = function(marker, startIndex, endIndex) {
	      this.remove(marker);
	      return this.insert(marker, startIndex, endIndex);
	    };

	    IntervalSkipList.prototype.insertNode = function(index) {
	      var closestNode, i, newNode, prevNode, update, _i, _ref1;
	      update = this.buildUpdateArray();
	      closestNode = this.findClosestNode(index, update);
	      if (this.compare(closestNode.index, index) > 0) {
	        newNode = new Node(this.getRandomNodeHeight(), index);
	        for (i = _i = 0, _ref1 = newNode.height; 0 <= _ref1 ? _i < _ref1 : _i > _ref1; i = 0 <= _ref1 ? ++_i : --_i) {
	          prevNode = update[i];
	          newNode.next[i] = prevNode.next[i];
	          prevNode.next[i] = newNode;
	        }
	        this.adjustMarkersOnInsert(newNode, update);
	        return newNode;
	      } else {
	        return closestNode;
	      }
	    };

	    IntervalSkipList.prototype.adjustMarkersOnInsert = function(node, updated) {
	      var endIndex, i, marker, newPromoted, promoted, startIndex, _i, _j, _k, _l, _len, _len1, _len2, _len3, _m, _n, _ref1, _ref10, _ref2, _ref3, _ref4, _ref5, _ref6, _ref7, _ref8, _ref9;
	      promoted = [];
	      newPromoted = [];
	      for (i = _i = 0, _ref1 = node.height - 1; 0 <= _ref1 ? _i < _ref1 : _i > _ref1; i = 0 <= _ref1 ? ++_i : --_i) {
	        _ref2 = clone(updated[i].markers[i]);
	        for (_j = 0, _len = _ref2.length; _j < _len; _j++) {
	          marker = _ref2[_j];
	          _ref3 = this.intervalsByMarker[marker], startIndex = _ref3[0], endIndex = _ref3[1];
	          if (this.compare(node.next[i + 1].index, endIndex) <= 0) {
	            this.removeMarkerOnPath(marker, node.next[i], node.next[i + 1], i);
	            newPromoted.push(marker);
	          } else {
	            node.addMarkerAtLevel(marker, i);
	          }
	        }
	        _ref4 = clone(promoted);
	        for (_k = 0, _len1 = _ref4.length; _k < _len1; _k++) {
	          marker = _ref4[_k];
	          _ref5 = this.intervalsByMarker[marker], startIndex = _ref5[0], endIndex = _ref5[1];
	          if (this.compare(node.next[i + 1].index, endIndex) <= 0) {
	            this.removeMarkerOnPath(marker, node.next[i], node.next[i + 1], i);
	          } else {
	            node.addMarkerAtLevel(marker, i);
	            remove(promoted, marker);
	          }
	        }
	        promoted = promoted.concat(newPromoted);
	        newPromoted.length = 0;
	      }
	      node.addMarkersAtLevel(updated[i].markers[i].concat(promoted), i);
	      promoted.length = 0;
	      newPromoted.length = 0;
	      for (i = _l = 0, _ref6 = node.height - 1; 0 <= _ref6 ? _l < _ref6 : _l > _ref6; i = 0 <= _ref6 ? ++_l : --_l) {
	        _ref7 = clone(updated[i].markers[i]);
	        for (_m = 0, _len2 = _ref7.length; _m < _len2; _m++) {
	          marker = _ref7[_m];
	          _ref8 = this.intervalsByMarker[marker], startIndex = _ref8[0], endIndex = _ref8[1];
	          if (this.compare(startIndex, updated[i + 1].index) <= 0) {
	            newPromoted.push(marker);
	            this.removeMarkerOnPath(marker, updated[i + 1], node, i);
	          }
	        }
	        _ref9 = clone(promoted);
	        for (_n = 0, _len3 = _ref9.length; _n < _len3; _n++) {
	          marker = _ref9[_n];
	          _ref10 = this.intervalsByMarker[marker], startIndex = _ref10[0], endIndex = _ref10[1];
	          if (this.compare(startIndex, updated[i + 1].index) <= 0) {
	            this.removeMarkerOnPath(marker, updated[i + 1], node, i);
	          } else {
	            updated[i].addMarkerAtLevel(marker, i);
	            remove(promoted, marker);
	          }
	        }
	        promoted = promoted.concat(newPromoted);
	        newPromoted.length = 0;
	      }
	      return updated[i].addMarkersAtLevel(promoted, i);
	    };

	    IntervalSkipList.prototype.removeNode = function(index) {
	      var i, node, update, _i, _ref1, _results;
	      update = this.buildUpdateArray();
	      node = this.findClosestNode(index, update);
	      if (this.compare(node.index, index) === 0) {
	        this.adjustMarkersOnRemove(node, update);
	        _results = [];
	        for (i = _i = 0, _ref1 = node.height; 0 <= _ref1 ? _i < _ref1 : _i > _ref1; i = 0 <= _ref1 ? ++_i : --_i) {
	          _results.push(update[i].next[i] = node.next[i]);
	        }
	        return _results;
	      }
	    };

	    IntervalSkipList.prototype.adjustMarkersOnRemove = function(node, updated) {
	      var demoted, endIndex, i, marker, newDemoted, startIndex, _i, _j, _k, _l, _len, _len1, _len2, _len3, _m, _n, _ref1, _ref10, _ref2, _ref3, _ref4, _ref5, _ref6, _ref7, _ref8, _ref9, _results;
	      demoted = [];
	      newDemoted = [];
	      for (i = _i = _ref1 = node.height - 1; _ref1 <= 0 ? _i <= 0 : _i >= 0; i = _ref1 <= 0 ? ++_i : --_i) {
	        _ref2 = clone(updated[i].markers[i]);
	        for (_j = 0, _len = _ref2.length; _j < _len; _j++) {
	          marker = _ref2[_j];
	          _ref3 = this.intervalsByMarker[marker], startIndex = _ref3[0], endIndex = _ref3[1];
	          if (this.compare(node.next[i].index, endIndex) > 0) {
	            newDemoted.push(marker);
	            updated[i].removeMarkerAtLevel(marker, i);
	          }
	        }
	        _ref4 = clone(demoted);
	        for (_k = 0, _len1 = _ref4.length; _k < _len1; _k++) {
	          marker = _ref4[_k];
	          this.placeMarkerOnPath(marker, updated[i + 1], updated[i], i);
	          _ref5 = this.intervalsByMarker[marker], startIndex = _ref5[0], endIndex = _ref5[1];
	          if (this.compare(node.next[i].index, endIndex) <= 0) {
	            updated[i].addMarkerAtLevel(marker, i);
	            remove(demoted, marker);
	          }
	        }
	        demoted.push.apply(demoted, newDemoted);
	        newDemoted.length = 0;
	      }
	      demoted.length = 0;
	      newDemoted.length = 0;
	      _results = [];
	      for (i = _l = _ref6 = node.height - 1; _ref6 <= 0 ? _l <= 0 : _l >= 0; i = _ref6 <= 0 ? ++_l : --_l) {
	        _ref7 = node.markers[i];
	        for (_m = 0, _len2 = _ref7.length; _m < _len2; _m++) {
	          marker = _ref7[_m];
	          _ref8 = this.intervalsByMarker[marker], startIndex = _ref8[0], endIndex = _ref8[1];
	          if (this.compare(updated[i].index, startIndex) < 0) {
	            newDemoted.push(marker);
	          }
	        }
	        _ref9 = clone(demoted);
	        for (_n = 0, _len3 = _ref9.length; _n < _len3; _n++) {
	          marker = _ref9[_n];
	          this.placeMarkerOnPath(marker, node.next[i], node.next[i + 1], i);
	          _ref10 = this.intervalsByMarker[marker], startIndex = _ref10[0], endIndex = _ref10[1];
	          if (this.compare(updated[i].index, startIndex) >= 0) {
	            remove(demoted, marker);
	          }
	        }
	        demoted.push.apply(demoted, newDemoted);
	        _results.push(newDemoted.length = 0);
	      }
	      return _results;
	    };

	    IntervalSkipList.prototype.placeMarker = function(marker, startNode, endNode) {
	      var endIndex, i, node, startIndex, _results;
	      startNode.addStartingMarker(marker);
	      endNode.addEndingMarker(marker);
	      startIndex = startNode.index;
	      endIndex = endNode.index;
	      node = startNode;
	      i = 0;
	      while (this.compare(node.next[i].index, endIndex) <= 0) {
	        while (i < node.height - 1 && this.compare(node.next[i + 1].index, endIndex) <= 0) {
	          i++;
	        }
	        node.addMarkerAtLevel(marker, i);
	        node = node.next[i];
	      }
	      _results = [];
	      while (node !== endNode) {
	        while (i > 0 && this.compare(node.next[i].index, endIndex) > 0) {
	          i--;
	        }
	        if (node == null) {
	          debugger;
	        }
	        node.addMarkerAtLevel(marker, i);
	        _results.push(node = node.next[i]);
	      }
	      return _results;
	    };

	    IntervalSkipList.prototype.removeMarker = function(marker, startNode, endNode) {
	      var endIndex, i, node, startIndex, _results;
	      startNode.removeStartingMarker(marker);
	      endNode.removeEndingMarker(marker);
	      startIndex = startNode.index;
	      endIndex = endNode.index;
	      node = startNode;
	      i = 0;
	      while (this.compare(node.next[i].index, endIndex) <= 0) {
	        while (i < node.height - 1 && this.compare(node.next[i + 1].index, endIndex) <= 0) {
	          i++;
	        }
	        node.removeMarkerAtLevel(marker, i);
	        node = node.next[i];
	      }
	      _results = [];
	      while (node !== endNode) {
	        while (i > 0 && this.compare(node.next[i].index, endIndex) > 0) {
	          i--;
	        }
	        node.removeMarkerAtLevel(marker, i);
	        _results.push(node = node.next[i]);
	      }
	      return _results;
	    };

	    IntervalSkipList.prototype.removeMarkerOnPath = function(marker, startNode, endNode, level) {
	      var node, _results;
	      node = startNode;
	      _results = [];
	      while (node !== endNode) {
	        node.removeMarkerAtLevel(marker, level);
	        _results.push(node = node.next[level]);
	      }
	      return _results;
	    };

	    IntervalSkipList.prototype.placeMarkerOnPath = function(marker, startNode, endNode, level) {
	      var node, _results;
	      node = startNode;
	      _results = [];
	      while (node !== endNode) {
	        node.addMarkerAtLevel(marker, level);
	        _results.push(node = node.next[level]);
	      }
	      return _results;
	    };

	    IntervalSkipList.prototype.buildUpdateArray = function() {
	      var i, path, _i, _ref1;
	      path = new Array(this.maxHeight);
	      for (i = _i = 0, _ref1 = this.maxHeight; 0 <= _ref1 ? _i < _ref1 : _i > _ref1; i = 0 <= _ref1 ? ++_i : --_i) {
	        path[i] = this.head;
	      }
	      return path;
	    };

	    IntervalSkipList.prototype.findClosestNode = function(index, update) {
	      var currentNode, i, _i, _ref1;
	      currentNode = this.head;
	      for (i = _i = _ref1 = this.maxHeight - 1; _ref1 <= 0 ? _i <= 0 : _i >= 0; i = _ref1 <= 0 ? ++_i : --_i) {
	        while (this.compare(currentNode.next[i].index, index) < 0) {
	          currentNode = currentNode.next[i];
	        }
	        if (update != null) {
	          update[i] = currentNode;
	        }
	      }
	      return currentNode.next[0];
	    };

	    IntervalSkipList.prototype.sortIndices = function(indices) {
	      var _this = this;
	      return clone(indices).sort(function(a, b) {
	        return _this.compare(a, b);
	      });
	    };

	    IntervalSkipList.prototype.getRandomNodeHeight = function() {
	      var height;
	      height = 1;
	      while (height < this.maxHeight && Math.random() < this.probability) {
	        height++;
	      }
	      return height;
	    };

	    IntervalSkipList.prototype.verifyMarkerInvariant = function() {
	      var endIndex, marker, node, startIndex, _ref1, _ref2, _results;
	      _ref1 = this.intervalsByMarker;
	      _results = [];
	      for (marker in _ref1) {
	        _ref2 = _ref1[marker], startIndex = _ref2[0], endIndex = _ref2[1];
	        node = this.findClosestNode(startIndex);
	        if (this.compare(node.index, startIndex) !== 0) {
	          throw new Error("Could not find node for marker " + marker + " with start index " + startIndex);
	        }
	        _results.push(node.verifyMarkerInvariant(marker, endIndex, this.compare));
	      }
	      return _results;
	    };

	    return IntervalSkipList;

	  })();

	  Node = (function() {
	    function Node(height, index) {
	      var i, _i, _ref1;
	      this.height = height;
	      this.index = index;
	      this.next = new Array(this.height);
	      this.markers = new Array(this.height);
	      for (i = _i = 0, _ref1 = this.height; 0 <= _ref1 ? _i < _ref1 : _i > _ref1; i = 0 <= _ref1 ? ++_i : --_i) {
	        this.markers[i] = [];
	      }
	      this.endpointMarkers = [];
	      this.startingMarkers = [];
	      this.endingMarkers = [];
	    }

	    Node.prototype.addStartingMarker = function(marker) {
	      this.startingMarkers.push(marker);
	      return this.endpointMarkers.push(marker);
	    };

	    Node.prototype.removeStartingMarker = function(marker) {
	      remove(this.startingMarkers, marker);
	      return remove(this.endpointMarkers, marker);
	    };

	    Node.prototype.addEndingMarker = function(marker) {
	      this.endingMarkers.push(marker);
	      return this.endpointMarkers.push(marker);
	    };

	    Node.prototype.removeEndingMarker = function(marker) {
	      remove(this.endingMarkers, marker);
	      return remove(this.endpointMarkers, marker);
	    };

	    Node.prototype.removeMarkerAtLevel = function(marker, level) {
	      return remove(this.markers[level], marker);
	    };

	    Node.prototype.addMarkerAtLevel = function(marker, level) {
	      return this.markers[level].push(marker);
	    };

	    Node.prototype.addMarkersAtLevel = function(markers, level) {
	      var marker, _i, _len, _results;
	      _results = [];
	      for (_i = 0, _len = markers.length; _i < _len; _i++) {
	        marker = markers[_i];
	        _results.push(this.addMarkerAtLevel(marker, level));
	      }
	      return _results;
	    };

	    Node.prototype.markersAboveLevel = function(level) {
	      return flatten(this.markers.slice(level, this.height));
	    };

	    Node.prototype.verifyMarkerInvariant = function(marker, endIndex, compare) {
	      var i, nextIndex, _i, _ref1;
	      if (compare(this.index, endIndex) === 0) {
	        return;
	      }
	      for (i = _i = _ref1 = this.height - 1; _ref1 <= 0 ? _i <= 0 : _i >= 0; i = _ref1 <= 0 ? ++_i : --_i) {
	        nextIndex = this.next[i].index;
	        if (compare(nextIndex, endIndex) <= 0) {
	          if (!include(this.markers[i], marker)) {
	            throw new Error("Node at " + this.index + " should have marker " + marker + " at level " + i + " pointer to node at " + nextIndex + " <= " + endIndex);
	          }
	          if (i > 0) {
	            this.verifyNotMarkedBelowLevel(marker, i, nextIndex, compare);
	          }
	          this.next[i].verifyMarkerInvariant(marker, endIndex, compare);
	          return;
	        }
	      }
	      throw new Error("Node at " + this.index + " should have marker " + marker + " on some forward pointer to an index <= " + endIndex + ", but it doesn't");
	    };

	    Node.prototype.verifyNotMarkedBelowLevel = function(marker, level, untilIndex, compare) {
	      var i, _i, _ref1;
	      for (i = _i = _ref1 = level - 1; _ref1 <= 0 ? _i <= 0 : _i >= 0; i = _ref1 <= 0 ? ++_i : --_i) {
	        if (include(this.markers[i], marker)) {
	          throw new Error("Node at " + this.index + " should not have marker " + marker + " at level " + i + " pointer to node at " + this.next[i].index);
	        }
	      }
	      if (compare(this.next[0].index, untilIndex) < 0) {
	        return this.next[0].verifyNotMarkedBelowLevel(marker, level, untilIndex, compare);
	      }
	    };

	    return Node;

	  })();

	}).call(this);


/***/ },
/* 21 */
/***/ function(module, exports, __webpack_require__) {

	(function() {
	  var Deprecation, SourceMapCache, convertLine, _;

	  _ = __webpack_require__(12);

	  convertLine = __webpack_require__(37).convertLine;

	  SourceMapCache = {};

	  module.exports = Deprecation = (function() {
	    Deprecation.getFunctionNameFromCallsite = function(callsite) {};

	    function Deprecation(message) {
	      this.message = message;
	      this.callCount = 0;
	      this.stacks = {};
	      this.stackCallCounts = {};
	    }

	    Deprecation.prototype.getFunctionNameFromCallsite = function(callsite) {
	      var _ref, _ref1, _ref2;
	      if (callsite.isToplevel()) {
	        return (_ref = callsite.getFunctionName()) != null ? _ref : '<unknown>';
	      } else {
	        if (callsite.isConstructor()) {
	          return "new " + (callsite.getFunctionName());
	        } else if (callsite.getMethodName() && !callsite.getFunctionName()) {
	          return callsite.getMethodName();
	        } else {
	          return "" + (callsite.getTypeName()) + "." + ((_ref1 = (_ref2 = callsite.getMethodName()) != null ? _ref2 : callsite.getFunctionName()) != null ? _ref1 : '<anonymous>');
	        }
	      }
	    };

	    Deprecation.prototype.getLocationFromCallsite = function(callsite) {
	      var column, converted, fileName, line;
	      if (callsite.isNative()) {
	        return "native";
	      } else if (callsite.isEval()) {
	        return "eval at " + (this.getLocationFromCallsite(callsite.getEvalOrigin()));
	      } else {
	        fileName = callsite.getFileName();
	        line = callsite.getLineNumber();
	        column = callsite.getColumnNumber();
	        if (/\.coffee$/.test(fileName)) {
	          if (converted = convertLine(fileName, line, column, SourceMapCache)) {
	            line = converted.line, column = converted.column;
	          }
	        }
	        return "" + fileName + ":" + line + ":" + column;
	      }
	    };

	    Deprecation.prototype.getOriginName = function() {
	      return this.originName;
	    };

	    Deprecation.prototype.getMessage = function() {
	      return this.message;
	    };

	    Deprecation.prototype.getStacks = function() {
	      var location, parsedStack, parsedStacks, stack, _ref;
	      parsedStacks = [];
	      _ref = this.stacks;
	      for (location in _ref) {
	        stack = _ref[location];
	        parsedStack = this.parseStack(stack);
	        parsedStack.callCount = this.stackCallCounts[location];
	        parsedStacks.push(parsedStack);
	      }
	      return parsedStacks;
	    };

	    Deprecation.prototype.getCallCount = function() {
	      return this.callCount;
	    };

	    Deprecation.prototype.addStack = function(stack) {
	      var callerLocation, _base, _base1;
	      if (this.originName == null) {
	        this.originName = this.getFunctionNameFromCallsite(stack[0]);
	      }
	      this.callCount++;
	      callerLocation = this.getLocationFromCallsite(stack[1]);
	      if ((_base = this.stacks)[callerLocation] == null) {
	        _base[callerLocation] = stack;
	      }
	      if ((_base1 = this.stackCallCounts)[callerLocation] == null) {
	        _base1[callerLocation] = 0;
	      }
	      return this.stackCallCounts[callerLocation]++;
	    };

	    Deprecation.prototype.parseStack = function(stack) {
	      return stack.map((function(_this) {
	        return function(callsite) {
	          return {
	            functionName: _this.getFunctionNameFromCallsite(callsite),
	            location: _this.getLocationFromCallsite(callsite),
	            fileName: callsite.getFileName()
	          };
	        };
	      })(this));
	    };

	    return Deprecation;

	  })();

	}).call(this);


/***/ },
/* 22 */
/***/ function(module, exports, __webpack_require__) {

	(function() {
	  var Behavior, combineArray, combineWithFunction,
	    __slice = [].slice;

	  Behavior = __webpack_require__(26);

	  exports.combine = function() {
	    var args;
	    args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
	    if (args.length === 1 && Array.isArray(args[0])) {
	      return combineArray(args[0]);
	    } else if (typeof args[args.length - 1] === 'function') {
	      return combineWithFunction(args);
	    } else {
	      throw new Error("Invalid object type");
	    }
	  };

	  combineArray = function(array) {
	    var behavior;
	    return behavior = new Behavior(function() {
	      var element, i, outputArray, ready, _i, _len,
	        _this = this;
	      outputArray = array.slice();
	      ready = false;
	      for (i = _i = 0, _len = array.length; _i < _len; i = ++_i) {
	        element = array[i];
	        if (element.constructor.name === 'Behavior') {
	          (function(element, i) {
	            return _this.subscribe(element.onValue(function(value, metadata) {
	              if (ready) {
	                outputArray = outputArray.slice();
	              }
	              outputArray[i] = value;
	              if (ready) {
	                return _this.emitValue(outputArray, metadata);
	              }
	            }));
	          })(element, i);
	        }
	      }
	      ready = true;
	      return this.emitValue(outputArray);
	    });
	  };

	  combineWithFunction = function(args) {
	    var fn;
	    fn = args.pop();
	    return combineArray(args).map(function(argsArray) {
	      return fn.apply(null, argsArray);
	    });
	  };

	}).call(this);


/***/ },
/* 23 */
/***/ function(module, exports, __webpack_require__) {

	(function() {
	  var Emitter, Mixin, Signal, Subscription, removeFromArray, subscriptionRemovedPattern, _ref,
	    __hasProp = {}.hasOwnProperty,
	    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
	    __slice = [].slice;

	  Mixin = __webpack_require__(40);

	  Signal = null;

	  Subscription = null;

	  subscriptionRemovedPattern = /^(last-)?.+-subscription-removed$/;

	  module.exports = Emitter = (function(_super) {
	    __extends(Emitter, _super);

	    function Emitter() {
	      _ref = Emitter.__super__.constructor.apply(this, arguments);
	      return _ref;
	    }

	    Emitter.prototype.eventHandlersByEventName = null;

	    Emitter.prototype.eventHandlersByNamespace = null;

	    Emitter.prototype.subscriptionCounts = null;

	    Emitter.prototype.pauseCountsByEventName = null;

	    Emitter.prototype.queuedEventsByEventName = null;

	    Emitter.prototype.globalPauseCount = null;

	    Emitter.prototype.globalQueuedEvents = null;

	    Emitter.prototype.signalsByEventName = null;

	    Emitter.prototype.on = function(eventNames, handler) {
	      var eventName, namespace, _base, _base1, _base2, _i, _len, _ref1, _ref2;
	      _ref1 = eventNames.split(/\s+/);
	      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
	        eventName = _ref1[_i];
	        if (!(eventName !== '')) {
	          continue;
	        }
	        _ref2 = eventName.split('.'), eventName = _ref2[0], namespace = _ref2[1];
	        this.emit("" + eventName + "-subscription-will-be-added", handler);
	        if (this.incrementSubscriptionCount(eventName) === 1) {
	          this.emit("first-" + eventName + "-subscription-will-be-added", handler);
	        }
	        if (this.eventHandlersByEventName == null) {
	          this.eventHandlersByEventName = {};
	        }
	        if ((_base = this.eventHandlersByEventName)[eventName] == null) {
	          _base[eventName] = [];
	        }
	        this.eventHandlersByEventName[eventName].push(handler);
	        if (namespace) {
	          if (this.eventHandlersByNamespace == null) {
	            this.eventHandlersByNamespace = {};
	          }
	          if ((_base1 = this.eventHandlersByNamespace)[namespace] == null) {
	            _base1[namespace] = {};
	          }
	          if ((_base2 = this.eventHandlersByNamespace[namespace])[eventName] == null) {
	            _base2[eventName] = [];
	          }
	          this.eventHandlersByNamespace[namespace][eventName].push(handler);
	        }
	        this.emit("" + eventName + "-subscription-added", handler);
	      }
	      if (Subscription == null) {
	        Subscription = __webpack_require__(32);
	      }
	      return new Subscription(this, eventNames, handler);
	    };

	    Emitter.prototype.once = function(eventName, handler) {
	      var subscription;
	      return subscription = this.on(eventName, function() {
	        var args;
	        args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
	        subscription.off();
	        return handler.apply(null, args);
	      });
	    };

	    Emitter.prototype.signal = function(eventName) {
	      var _base;
	      if (Signal == null) {
	        Signal = __webpack_require__(25);
	      }
	      if (this.signalsByEventName == null) {
	        this.signalsByEventName = {};
	      }
	      return (_base = this.signalsByEventName)[eventName] != null ? (_base = this.signalsByEventName)[eventName] : _base[eventName] = Signal.fromEmitter(this, eventName);
	    };

	    Emitter.prototype.behavior = function(eventName, initialValue) {
	      return this.signal(eventName).toBehavior(initialValue);
	    };

	    Emitter.prototype.emit = function(eventName, payload) {
	      var handler, handlers, queuedEvents, _i, _len, _ref1, _ref2, _ref3;
	      if (arguments.length > 2 || /\s|\./.test(eventName)) {
	        return this.emitSlow.apply(this, arguments);
	      } else {
	        if (this.globalQueuedEvents != null) {
	          return this.globalQueuedEvents.push([eventName, payload]);
	        } else {
	          if (queuedEvents = (_ref1 = this.queuedEventsByEventName) != null ? _ref1[eventName] : void 0) {
	            return queuedEvents.push([eventName, payload]);
	          } else if (handlers = (_ref2 = this.eventHandlersByEventName) != null ? _ref2[eventName] : void 0) {
	            _ref3 = handlers.slice();
	            for (_i = 0, _len = _ref3.length; _i < _len; _i++) {
	              handler = _ref3[_i];
	              handler(payload);
	            }
	            return this.emit("after-" + eventName, payload);
	          }
	        }
	      }
	    };

	    Emitter.prototype.emitSlow = function() {
	      var args, eventName, handlers, namespace, queuedEvents, _ref1, _ref2, _ref3, _ref4, _ref5, _ref6;
	      eventName = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
	      if (this.globalQueuedEvents) {
	        return this.globalQueuedEvents.push([eventName].concat(__slice.call(args)));
	      } else {
	        _ref1 = eventName.split('.'), eventName = _ref1[0], namespace = _ref1[1];
	        if (namespace) {
	          if (queuedEvents = (_ref2 = this.queuedEventsByEventName) != null ? _ref2[eventName] : void 0) {
	            return queuedEvents.push(["" + eventName + "." + namespace].concat(__slice.call(args)));
	          } else if (handlers = (_ref3 = this.eventHandlersByNamespace) != null ? (_ref4 = _ref3[namespace]) != null ? _ref4[eventName] : void 0 : void 0) {
	            (function(func, args, ctor) {
	              ctor.prototype = func.prototype;
	              var child = new ctor, result = func.apply(child, args);
	              return Object(result) === result ? result : child;
	            })(Array, handlers, function(){}).forEach(function(handler) {
	              return handler.apply(null, args);
	            });
	            return this.emit.apply(this, ["after-" + eventName].concat(__slice.call(args)));
	          }
	        } else {
	          if (queuedEvents = (_ref5 = this.queuedEventsByEventName) != null ? _ref5[eventName] : void 0) {
	            return queuedEvents.push([eventName].concat(__slice.call(args)));
	          } else if (handlers = (_ref6 = this.eventHandlersByEventName) != null ? _ref6[eventName] : void 0) {
	            (function(func, args, ctor) {
	              ctor.prototype = func.prototype;
	              var child = new ctor, result = func.apply(child, args);
	              return Object(result) === result ? result : child;
	            })(Array, handlers, function(){}).forEach(function(handler) {
	              return handler.apply(null, args);
	            });
	            return this.emit.apply(this, ["after-" + eventName].concat(__slice.call(args)));
	          }
	        }
	      }
	    };

	    Emitter.prototype.off = function(eventNames, handler) {
	      var eventHandlers, eventName, handlers, namespace, namespaceHandlers, _i, _j, _k, _l, _len, _len1, _len2, _len3, _ref1, _ref10, _ref2, _ref3, _ref4, _ref5, _ref6, _ref7, _ref8, _ref9;
	      if (eventNames) {
	        _ref1 = eventNames.split(/\s+/);
	        for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
	          eventName = _ref1[_i];
	          if (!(eventName !== '')) {
	            continue;
	          }
	          _ref2 = eventName.split('.'), eventName = _ref2[0], namespace = _ref2[1];
	          if (eventName === '') {
	            eventName = void 0;
	          }
	          if (namespace) {
	            if (eventName) {
	              handlers = (_ref3 = (_ref4 = this.eventHandlersByNamespace) != null ? (_ref5 = _ref4[namespace]) != null ? _ref5[eventName] : void 0 : void 0) != null ? _ref3 : [];
	              if (handler != null) {
	                removeFromArray(handlers, handler);
	                this.off(eventName, handler);
	              } else {
	                _ref6 = (function(func, args, ctor) {
	                  ctor.prototype = func.prototype;
	                  var child = new ctor, result = func.apply(child, args);
	                  return Object(result) === result ? result : child;
	                })(Array, handlers, function(){});
	                for (_j = 0, _len1 = _ref6.length; _j < _len1; _j++) {
	                  handler = _ref6[_j];
	                  removeFromArray(handlers, handler);
	                  this.off(eventName, handler);
	                }
	              }
	            } else {
	              namespaceHandlers = (_ref7 = (_ref8 = this.eventHandlersByNamespace) != null ? _ref8[namespace] : void 0) != null ? _ref7 : {};
	              if (handler != null) {
	                for (eventName in namespaceHandlers) {
	                  handlers = namespaceHandlers[eventName];
	                  removeFromArray(handlers, handler);
	                  this.off(eventName, handler);
	                }
	              } else {
	                for (eventName in namespaceHandlers) {
	                  handlers = namespaceHandlers[eventName];
	                  _ref9 = (function(func, args, ctor) {
	                    ctor.prototype = func.prototype;
	                    var child = new ctor, result = func.apply(child, args);
	                    return Object(result) === result ? result : child;
	                  })(Array, handlers, function(){});
	                  for (_k = 0, _len2 = _ref9.length; _k < _len2; _k++) {
	                    handler = _ref9[_k];
	                    removeFromArray(handlers, handler);
	                    this.off(eventName, handler);
	                  }
	                }
	              }
	            }
	          } else {
	            eventHandlers = (_ref10 = this.eventHandlersByEventName) != null ? _ref10[eventName] : void 0;
	            if (eventHandlers == null) {
	              return;
	            }
	            if (handler == null) {
	              for (_l = 0, _len3 = eventHandlers.length; _l < _len3; _l++) {
	                handler = eventHandlers[_l];
	                this.off(eventName, handler);
	              }
	              return;
	            }
	            if (removeFromArray(eventHandlers, handler)) {
	              this.decrementSubscriptionCount(eventName);
	              this.emit("" + eventName + "-subscription-removed", handler);
	              if (this.getSubscriptionCount(eventName) === 0) {
	                this.emit("last-" + eventName + "-subscription-removed", handler);
	                delete this.eventHandlersByEventName[eventName];
	              }
	            }
	          }
	        }
	      } else {
	        for (eventName in this.eventHandlersByEventName) {
	          if (!subscriptionRemovedPattern.test(eventName)) {
	            this.off(eventName);
	          }
	        }
	        for (eventName in this.eventHandlersByEventName) {
	          this.off(eventName);
	        }
	        return this.eventHandlersByNamespace = {};
	      }
	    };

	    Emitter.prototype.pauseEvents = function(eventNames) {
	      var eventName, _base, _base1, _i, _len, _ref1, _results;
	      if (eventNames) {
	        _ref1 = eventNames.split(/\s+/);
	        _results = [];
	        for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
	          eventName = _ref1[_i];
	          if (!(eventName !== '')) {
	            continue;
	          }
	          if (this.pauseCountsByEventName == null) {
	            this.pauseCountsByEventName = {};
	          }
	          if (this.queuedEventsByEventName == null) {
	            this.queuedEventsByEventName = {};
	          }
	          if ((_base = this.pauseCountsByEventName)[eventName] == null) {
	            _base[eventName] = 0;
	          }
	          this.pauseCountsByEventName[eventName]++;
	          _results.push((_base1 = this.queuedEventsByEventName)[eventName] != null ? (_base1 = this.queuedEventsByEventName)[eventName] : _base1[eventName] = []);
	        }
	        return _results;
	      } else {
	        if (this.globalPauseCount == null) {
	          this.globalPauseCount = 0;
	        }
	        if (this.globalQueuedEvents == null) {
	          this.globalQueuedEvents = [];
	        }
	        return this.globalPauseCount++;
	      }
	    };

	    Emitter.prototype.resumeEvents = function(eventNames) {
	      var event, eventName, queuedEvents, _i, _j, _len, _len1, _ref1, _ref2, _results, _results1;
	      if (eventNames) {
	        _ref1 = eventNames.split(/\s+/);
	        _results = [];
	        for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
	          eventName = _ref1[_i];
	          if (eventName !== '') {
	            if (((_ref2 = this.pauseCountsByEventName) != null ? _ref2[eventName] : void 0) > 0 && --this.pauseCountsByEventName[eventName] === 0) {
	              queuedEvents = this.queuedEventsByEventName[eventName];
	              this.queuedEventsByEventName[eventName] = null;
	              _results.push((function() {
	                var _j, _len1, _results1;
	                _results1 = [];
	                for (_j = 0, _len1 = queuedEvents.length; _j < _len1; _j++) {
	                  event = queuedEvents[_j];
	                  _results1.push(this.emit.apply(this, event));
	                }
	                return _results1;
	              }).call(this));
	            } else {
	              _results.push(void 0);
	            }
	          }
	        }
	        return _results;
	      } else {
	        for (eventName in this.pauseCountsByEventName) {
	          this.resumeEvents(eventName);
	        }
	        if (this.globalPauseCount > 0 && --this.globalPauseCount === 0) {
	          queuedEvents = this.globalQueuedEvents;
	          this.globalQueuedEvents = null;
	          _results1 = [];
	          for (_j = 0, _len1 = queuedEvents.length; _j < _len1; _j++) {
	            event = queuedEvents[_j];
	            _results1.push(this.emit.apply(this, event));
	          }
	          return _results1;
	        }
	      }
	    };

	    Emitter.prototype.incrementSubscriptionCount = function(eventName) {
	      var _base;
	      if (this.subscriptionCounts == null) {
	        this.subscriptionCounts = {};
	      }
	      if ((_base = this.subscriptionCounts)[eventName] == null) {
	        _base[eventName] = 0;
	      }
	      return ++this.subscriptionCounts[eventName];
	    };

	    Emitter.prototype.decrementSubscriptionCount = function(eventName) {
	      var count;
	      count = --this.subscriptionCounts[eventName];
	      if (count === 0) {
	        delete this.subscriptionCounts[eventName];
	      }
	      return count;
	    };

	    Emitter.prototype.getSubscriptionCount = function(eventName) {
	      var count, name, total, _ref1, _ref2, _ref3;
	      if (eventName != null) {
	        return (_ref1 = (_ref2 = this.subscriptionCounts) != null ? _ref2[eventName] : void 0) != null ? _ref1 : 0;
	      } else {
	        total = 0;
	        _ref3 = this.subscriptionCounts;
	        for (name in _ref3) {
	          count = _ref3[name];
	          total += count;
	        }
	        return total;
	      }
	    };

	    Emitter.prototype.hasSubscriptions = function(eventName) {
	      return this.getSubscriptionCount(eventName) > 0;
	    };

	    return Emitter;

	  })(Mixin);

	  removeFromArray = function(array, element) {
	    var index;
	    index = array.indexOf(element);
	    if (index > -1) {
	      array.splice(index, 1);
	      return true;
	    } else {
	      return false;
	    }
	  };

	}).call(this);


/***/ },
/* 24 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(global) {(function() {
	  var Mixin, Signal, Subscriber, Subscription, WeakMap, _ref, _ref1,
	    __hasProp = {}.hasOwnProperty,
	    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
	    __slice = [].slice;

	  Mixin = __webpack_require__(40);

	  Signal = null;

	  WeakMap = (_ref = global.WeakMap) != null ? _ref : __webpack_require__(39).WeakMap;

	  Subscription = __webpack_require__(32);

	  module.exports = Subscriber = (function(_super) {
	    __extends(Subscriber, _super);

	    function Subscriber() {
	      _ref1 = Subscriber.__super__.constructor.apply(this, arguments);
	      return _ref1;
	    }

	    Subscriber.prototype.subscribeWith = function(eventEmitter, methodName, args) {
	      var callback, eventNames;
	      if (eventEmitter[methodName] == null) {
	        throw new Error("Object does not have method '" + methodName + "' with which to subscribe");
	      }
	      eventEmitter[methodName].apply(eventEmitter, args);
	      eventNames = args[0];
	      callback = args[args.length - 1];
	      return this.addSubscription(new Subscription(eventEmitter, eventNames, callback));
	    };

	    Subscriber.prototype.addSubscription = function(subscription) {
	      var emitter;
	      if (this._subscriptions == null) {
	        this._subscriptions = [];
	      }
	      this._subscriptions.push(subscription);
	      emitter = subscription.emitter;
	      if (emitter != null) {
	        if (this._subscriptionsByObject == null) {
	          this._subscriptionsByObject = new WeakMap;
	        }
	        if (this._subscriptionsByObject.has(emitter)) {
	          this._subscriptionsByObject.get(emitter).push(subscription);
	        } else {
	          this._subscriptionsByObject.set(emitter, [subscription]);
	        }
	      }
	      return subscription;
	    };

	    Subscriber.prototype.subscribe = function() {
	      var args, eventEmitterOrSubscription;
	      eventEmitterOrSubscription = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
	      if (args.length === 0) {
	        return this.addSubscription(eventEmitterOrSubscription);
	      } else {
	        if (args.length === 1 && eventEmitterOrSubscription.isSignal) {
	          args.unshift('value');
	        }
	        return this.subscribeWith(eventEmitterOrSubscription, 'on', args);
	      }
	    };

	    Subscriber.prototype.subscribeToCommand = function() {
	      var args, eventEmitter;
	      eventEmitter = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
	      return this.subscribeWith(eventEmitter, 'command', args);
	    };

	    Subscriber.prototype.unsubscribe = function(object) {
	      var index, subscription, _i, _j, _len, _len1, _ref2, _ref3, _ref4, _ref5, _ref6, _ref7;
	      if (object != null) {
	        _ref4 = (_ref2 = (_ref3 = this._subscriptionsByObject) != null ? _ref3.get(object) : void 0) != null ? _ref2 : [];
	        for (_i = 0, _len = _ref4.length; _i < _len; _i++) {
	          subscription = _ref4[_i];
	          if (typeof subscription.dispose === 'function') {
	            subscription.dispose();
	          } else {
	            subscription.off();
	          }
	          index = this._subscriptions.indexOf(subscription);
	          if (index >= 0) {
	            this._subscriptions.splice(index, 1);
	          }
	        }
	        return (_ref5 = this._subscriptionsByObject) != null ? _ref5["delete"](object) : void 0;
	      } else {
	        _ref7 = (_ref6 = this._subscriptions) != null ? _ref6 : [];
	        for (_j = 0, _len1 = _ref7.length; _j < _len1; _j++) {
	          subscription = _ref7[_j];
	          if (typeof subscription.dispose === 'function') {
	            subscription.dispose();
	          } else {
	            subscription.off();
	          }
	        }
	        this._subscriptions = null;
	        return this._subscriptionsByObject = null;
	      }
	    };

	    return Subscriber;

	  })(Mixin);

	}).call(this);
	
	/* WEBPACK VAR INJECTION */}.call(exports, (function() { return this; }())))

/***/ },
/* 25 */
/***/ function(module, exports, __webpack_require__) {

	(function() {
	  var Behavior, Emitter, Signal, Subscriber, isEqual,
	    __hasProp = {}.hasOwnProperty,
	    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
	    __slice = [].slice;

	  isEqual = __webpack_require__(12).isEqual;

	  Emitter = __webpack_require__(23);

	  Subscriber = __webpack_require__(24);

	  Behavior = null;

	  module.exports = Signal = (function(_super) {
	    __extends(Signal, _super);

	    Subscriber.includeInto(Signal);

	    Signal.fromEmitter = function(emitter, eventName) {
	      return new Signal(function() {
	        var _this = this;
	        return this.subscribe(emitter, eventName, function() {
	          var metadata, value;
	          value = arguments[0], metadata = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
	          return _this.emitValue.apply(_this, [value].concat(__slice.call(metadata)));
	        });
	      });
	    };

	    function Signal(subscribeCallback) {
	      var _this = this;
	      this.subscribeCallback = subscribeCallback;
	      this.retainCount = 0;
	      this.on('value-subscription-will-be-added', function() {
	        return _this.retain();
	      });
	      this.on('value-subscription-removed', function() {
	        return _this.release();
	      });
	    }

	    Signal.prototype.isSignal = true;

	    Signal.prototype.retained = function() {
	      return typeof this.subscribeCallback === "function" ? this.subscribeCallback() : void 0;
	    };

	    Signal.prototype.released = function() {
	      return this.unsubscribe();
	    };

	    Signal.prototype.retain = function() {
	      if (++this.retainCount === 1) {
	        if (typeof this.retained === "function") {
	          this.retained();
	        }
	      }
	      return this;
	    };

	    Signal.prototype.release = function() {
	      if (--this.retainCount === 0) {
	        if (typeof this.released === "function") {
	          this.released();
	        }
	      }
	      return this;
	    };

	    Signal.prototype.onValue = function(handler) {
	      return this.on('value', handler);
	    };

	    Signal.prototype.emitValue = function(value, metadata) {
	      if (metadata == null) {
	        metadata = {};
	      }
	      if (metadata.source == null) {
	        metadata.source = this;
	      }
	      return this.emit('value', value, metadata);
	    };

	    Signal.prototype.toBehavior = function(initialValue) {
	      var source;
	      source = this;
	      return this.buildBehavior(initialValue, function() {
	        var _this = this;
	        return this.subscribe(source, 'value', function() {
	          var metadata, value;
	          value = arguments[0], metadata = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
	          return _this.emitValue.apply(_this, [value].concat(__slice.call(metadata)));
	        });
	      });
	    };

	    Signal.prototype.changes = function() {
	      return this;
	    };

	    Signal.prototype.injectMetadata = function(fn) {
	      var source;
	      source = this;
	      return new this.constructor(function() {
	        var _this = this;
	        return this.subscribe(source, 'value', function(value, metadata) {
	          var k, newMetadata, v;
	          newMetadata = fn(value, metadata);
	          for (k in newMetadata) {
	            v = newMetadata[k];
	            metadata[k] = v;
	          }
	          return _this.emitValue(value, metadata);
	        });
	      });
	    };

	    Signal.prototype.filter = function(predicate) {
	      var source;
	      source = this;
	      return new this.constructor(function() {
	        var _this = this;
	        return this.subscribe(source, 'value', function() {
	          var metadata, value;
	          value = arguments[0], metadata = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
	          if (predicate.call(value, value)) {
	            return _this.emitValue.apply(_this, [value].concat(__slice.call(metadata)));
	          }
	        });
	      });
	    };

	    Signal.prototype.filterDefined = function() {
	      return this.filter(function(value) {
	        return value != null;
	      });
	    };

	    Signal.prototype.map = function(fn) {
	      var property, source;
	      if (typeof fn === 'string') {
	        property = fn;
	        fn = function(value) {
	          return value != null ? value[property] : void 0;
	        };
	      }
	      source = this;
	      return new this.constructor(function() {
	        var _this = this;
	        return this.subscribe(source, 'value', function() {
	          var metadata, value;
	          value = arguments[0], metadata = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
	          return _this.emitValue.apply(_this, [fn.call(value, value)].concat(__slice.call(metadata)));
	        });
	      });
	    };

	    Signal.prototype["switch"] = function(fn) {
	      var source;
	      source = this.map(fn);
	      return new this.constructor(function() {
	        var currentSignal,
	          _this = this;
	        currentSignal = null;
	        return this.subscribe(source, 'value', function(newSignal, outerMetadata) {
	          if (currentSignal != null) {
	            _this.unsubscribe(currentSignal);
	          }
	          currentSignal = newSignal;
	          if (currentSignal != null) {
	            return _this.subscribe(currentSignal, 'value', function(value, innerMetadata) {
	              return _this.emitValue(value, innerMetadata);
	            });
	          } else {
	            return _this.emitValue(void 0, outerMetadata);
	          }
	        });
	      });
	    };

	    Signal.prototype.skipUntil = function(predicateOrTargetValue) {
	      var doneSkipping, predicate, targetValue;
	      if (typeof predicateOrTargetValue !== 'function') {
	        targetValue = predicateOrTargetValue;
	        return this.skipUntil(function(value) {
	          return isEqual(value, targetValue);
	        });
	      }
	      predicate = predicateOrTargetValue;
	      doneSkipping = false;
	      return this.filter(function(value) {
	        if (doneSkipping) {
	          return true;
	        }
	        if (predicate(value)) {
	          return doneSkipping = true;
	        } else {
	          return false;
	        }
	      });
	    };

	    Signal.prototype.scan = function(initialValue, fn) {
	      var source;
	      source = this;
	      return this.buildBehavior(initialValue, function() {
	        var oldValue,
	          _this = this;
	        oldValue = initialValue;
	        return this.subscribe(source, 'value', function() {
	          var metadata, newValue;
	          newValue = arguments[0], metadata = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
	          return _this.emitValue.apply(_this, [(oldValue = fn(oldValue, newValue))].concat(__slice.call(metadata)));
	        });
	      });
	    };

	    Signal.prototype.diff = function(initialValue, fn) {
	      var source;
	      source = this;
	      return this.buildBehavior(function() {
	        var oldValue,
	          _this = this;
	        oldValue = initialValue;
	        return this.subscribe(source, 'value', function() {
	          var fnOldValue, metadata, newValue;
	          newValue = arguments[0], metadata = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
	          fnOldValue = oldValue;
	          oldValue = newValue;
	          return _this.emitValue.apply(_this, [fn(fnOldValue, newValue)].concat(__slice.call(metadata)));
	        });
	      });
	    };

	    Signal.prototype.distinctUntilChanged = function() {
	      var source;
	      source = this;
	      return new this.constructor(function() {
	        var oldValue, receivedValue,
	          _this = this;
	        receivedValue = false;
	        oldValue = void 0;
	        return this.subscribe(source, 'value', function() {
	          var metadata, newValue;
	          newValue = arguments[0], metadata = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
	          if (receivedValue) {
	            if (isEqual(oldValue, newValue)) {
	              return oldValue = newValue;
	            } else {
	              oldValue = newValue;
	              return _this.emitValue.apply(_this, [newValue].concat(__slice.call(metadata)));
	            }
	          } else {
	            receivedValue = true;
	            oldValue = newValue;
	            return _this.emitValue.apply(_this, [newValue].concat(__slice.call(metadata)));
	          }
	        });
	      });
	    };

	    Signal.prototype.equals = function(expected) {
	      return this.map(function(actual) {
	        return isEqual(actual, expected);
	      }).distinctUntilChanged();
	    };

	    Signal.prototype.isDefined = function() {
	      return this.map(function(value) {
	        return value != null;
	      }).distinctUntilChanged();
	    };

	    Signal.prototype.buildBehavior = function() {
	      var args;
	      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
	      if (Behavior == null) {
	        Behavior = __webpack_require__(26);
	      }
	      return (function(func, args, ctor) {
	        ctor.prototype = func.prototype;
	        var child = new ctor, result = func.apply(child, args);
	        return Object(result) === result ? result : child;
	      })(Behavior, args, function(){});
	    };

	    return Signal;

	  })(Emitter);

	}).call(this);


/***/ },
/* 26 */
/***/ function(module, exports, __webpack_require__) {

	(function() {
	  var Behavior, PropertyAccessors, Signal, helpers, isEqual,
	    __hasProp = {}.hasOwnProperty,
	    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
	    __slice = [].slice;

	  isEqual = __webpack_require__(12).isEqual;

	  PropertyAccessors = __webpack_require__(41);

	  Signal = __webpack_require__(25);

	  module.exports = Behavior = (function(_super) {
	    __extends(Behavior, _super);

	    PropertyAccessors.includeInto(Behavior);

	    function Behavior() {
	      var args, subscribeCallback, _ref;
	      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
	      if (typeof ((_ref = args[0]) != null ? _ref.call : void 0) !== 'function') {
	        this.value = args.shift();
	      }
	      Behavior.__super__.constructor.call(this, subscribeCallback = args.shift());
	    }

	    Behavior.prototype.retained = function() {
	      var _this = this;
	      this.subscribe(this, 'value-internal', function(value) {
	        return _this.value = value;
	      });
	      this.subscribe(this, 'value-subscription-added', function(handler) {
	        return handler(_this.value);
	      });
	      return typeof this.subscribeCallback === "function" ? this.subscribeCallback() : void 0;
	    };

	    Behavior.prototype.emit = function() {
	      var args, name;
	      name = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
	      if (name === 'value') {
	        this.emit.apply(this, ['value-internal'].concat(__slice.call(args)));
	      }
	      return Behavior.__super__.emit.apply(this, arguments);
	    };

	    Behavior.prototype.getValue = function() {
	      if (!(this.retainCount > 0)) {
	        throw new Error("Subscribe to or retain this behavior before calling getValue");
	      }
	      return this.value;
	    };

	    Behavior.prototype.and = function(right) {
	      return helpers.combine(this, right, (function(leftValue, rightValue) {
	        return leftValue && rightValue;
	      })).distinctUntilChanged();
	    };

	    Behavior.prototype.or = function(right) {
	      return helpers.combine(this, right, (function(leftValue, rightValue) {
	        return leftValue || rightValue;
	      })).distinctUntilChanged();
	    };

	    Behavior.prototype.toBehavior = function() {
	      return this;
	    };

	    Behavior.prototype.lazyAccessor('changes', function() {
	      var source;
	      source = this;
	      return new Signal(function() {
	        var gotFirst,
	          _this = this;
	        gotFirst = false;
	        return this.subscribe(source, 'value', function() {
	          var metadata, value;
	          value = arguments[0], metadata = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
	          if (gotFirst) {
	            _this.emitValue.apply(_this, [value].concat(__slice.call(metadata)));
	          }
	          return gotFirst = true;
	        });
	      });
	    });

	    Behavior.prototype.becomes = function(predicateOrTargetValue) {
	      var predicate, targetValue;
	      if (typeof predicateOrTargetValue !== 'function') {
	        targetValue = predicateOrTargetValue;
	        return this.becomes(function(value) {
	          return isEqual(value, targetValue);
	        });
	      }
	      predicate = predicateOrTargetValue;
	      return this.map(function(value) {
	        return !!predicate(value);
	      }).distinctUntilChanged().changes;
	    };

	    Behavior.prototype.becomesLessThan = function(targetValue) {
	      return this.becomes(function(value) {
	        return value < targetValue;
	      });
	    };

	    Behavior.prototype.becomesGreaterThan = function(targetValue) {
	      return this.becomes(function(value) {
	        return value > targetValue;
	      });
	    };

	    return Behavior;

	  })(Signal);

	  helpers = __webpack_require__(22);

	}).call(this);


/***/ },
/* 27 */
/***/ function(module, exports, __webpack_require__) {

	(function() {
	  var Disposable, Emitter;

	  Disposable = __webpack_require__(28);

	  module.exports = Emitter = (function() {
	    Emitter.prototype.isDisposed = false;


	    /*
	    Section: Construction and Destruction
	     */

	    function Emitter() {
	      this.handlersByEventName = {};
	    }

	    Emitter.prototype.dispose = function() {
	      this.handlersByEventName = null;
	      return this.isDisposed = true;
	    };


	    /*
	    Section: Event Subscription
	     */

	    Emitter.prototype.on = function(eventName, handler, unshift) {
	      var currentHandlers;
	      if (unshift == null) {
	        unshift = false;
	      }
	      if (this.isDisposed) {
	        throw new Error("Emitter has been disposed");
	      }
	      if (typeof handler !== 'function') {
	        throw new Error("Handler must be a function");
	      }
	      if (currentHandlers = this.handlersByEventName[eventName]) {
	        if (unshift) {
	          this.handlersByEventName[eventName] = [handler].concat(currentHandlers);
	        } else {
	          this.handlersByEventName[eventName] = currentHandlers.concat(handler);
	        }
	      } else {
	        this.handlersByEventName[eventName] = [handler];
	      }
	      return new Disposable(this.off.bind(this, eventName, handler));
	    };

	    Emitter.prototype.preempt = function(eventName, handler) {
	      return this.on(eventName, handler, true);
	    };

	    Emitter.prototype.off = function(eventName, handlerToRemove) {
	      var handler, newHandlers, oldHandlers, _i, _len;
	      if (this.isDisposed) {
	        return;
	      }
	      if (oldHandlers = this.handlersByEventName[eventName]) {
	        newHandlers = [];
	        for (_i = 0, _len = oldHandlers.length; _i < _len; _i++) {
	          handler = oldHandlers[_i];
	          if (handler !== handlerToRemove) {
	            newHandlers.push(handler);
	          }
	        }
	        return this.handlersByEventName[eventName] = newHandlers;
	      }
	    };


	    /*
	    Section: Event Emission
	     */

	    Emitter.prototype.emit = function(eventName, value) {
	      var handler, handlers, _i, _len, _ref;
	      if (handlers = (_ref = this.handlersByEventName) != null ? _ref[eventName] : void 0) {
	        for (_i = 0, _len = handlers.length; _i < _len; _i++) {
	          handler = handlers[_i];
	          handler(value);
	        }
	      }
	    };

	    return Emitter;

	  })();

	}).call(this);


/***/ },
/* 28 */
/***/ function(module, exports, __webpack_require__) {

	(function() {
	  var Disposable, Grim;

	  Grim = __webpack_require__(14);

	  module.exports = Disposable = (function() {
	    Disposable.prototype.disposed = false;


	    /*
	    Section: Construction and Destruction
	     */

	    function Disposable(disposalAction) {
	      this.disposalAction = disposalAction;
	    }

	    Disposable.prototype.dispose = function() {
	      if (!this.disposed) {
	        this.disposed = true;
	        return typeof this.disposalAction === "function" ? this.disposalAction() : void 0;
	      }
	    };

	    Disposable.prototype.off = function() {
	      Grim.deprecate("Use ::dispose to cancel subscriptions instead of ::off");
	      return this.dispose();
	    };

	    return Disposable;

	  })();

	}).call(this);


/***/ },
/* 29 */
/***/ function(module, exports, __webpack_require__) {

	(function() {
	  var CompositeDisposable;

	  module.exports = CompositeDisposable = (function() {
	    CompositeDisposable.prototype.disposed = false;


	    /*
	    Section: Construction and Destruction
	     */

	    function CompositeDisposable() {
	      var disposable, _i, _len;
	      this.disposables = [];
	      for (_i = 0, _len = arguments.length; _i < _len; _i++) {
	        disposable = arguments[_i];
	        this.add(disposable);
	      }
	    }

	    CompositeDisposable.prototype.dispose = function() {
	      var disposable, _results;
	      if (!this.disposed) {
	        this.disposed = true;
	        _results = [];
	        while (disposable = this.disposables.shift()) {
	          _results.push(disposable.dispose());
	        }
	        return _results;
	      }
	    };


	    /*
	    Section: Managing Disposables
	     */

	    CompositeDisposable.prototype.add = function(disposable) {
	      if (!this.disposed) {
	        return this.disposables.push(disposable);
	      }
	    };

	    CompositeDisposable.prototype.remove = function(disposable) {
	      var index;
	      index = this.disposables.indexOf(disposable);
	      if (index !== -1) {
	        return this.disposables.splice(index, 1);
	      }
	    };

	    CompositeDisposable.prototype.clear = function() {
	      return this.disposables.length = 0;
	    };

	    return CompositeDisposable;

	  })();

	}).call(this);


/***/ },
/* 30 */
/***/ function(module, exports, __webpack_require__) {

	// shim for using process in browser

	var process = module.exports = {};

	process.nextTick = (function () {
	    var canSetImmediate = typeof window !== 'undefined'
	    && window.setImmediate;
	    var canMutationObserver = typeof window !== 'undefined'
	    && window.MutationObserver;
	    var canPost = typeof window !== 'undefined'
	    && window.postMessage && window.addEventListener
	    ;

	    if (canSetImmediate) {
	        return function (f) { return window.setImmediate(f) };
	    }

	    var queue = [];

	    if (canMutationObserver) {
	        var hiddenDiv = document.createElement("div");
	        var observer = new MutationObserver(function () {
	            var queueList = queue.slice();
	            queue.length = 0;
	            queueList.forEach(function (fn) {
	                fn();
	            });
	        });

	        observer.observe(hiddenDiv, { attributes: true });

	        return function nextTick(fn) {
	            if (!queue.length) {
	                hiddenDiv.setAttribute('yes', 'no');
	            }
	            queue.push(fn);
	        };
	    }

	    if (canPost) {
	        window.addEventListener('message', function (ev) {
	            var source = ev.source;
	            if ((source === window || source === null) && ev.data === 'process-tick') {
	                ev.stopPropagation();
	                if (queue.length > 0) {
	                    var fn = queue.shift();
	                    fn();
	                }
	            }
	        }, true);

	        return function nextTick(fn) {
	            queue.push(fn);
	            window.postMessage('process-tick', '*');
	        };
	    }

	    return function nextTick(fn) {
	        setTimeout(fn, 0);
	    };
	})();

	process.title = 'browser';
	process.browser = true;
	process.env = {};
	process.argv = [];

	function noop() {}

	process.on = noop;
	process.addListener = noop;
	process.once = noop;
	process.off = noop;
	process.removeListener = noop;
	process.removeAllListeners = noop;
	process.emit = noop;

	process.binding = function (name) {
	    throw new Error('process.binding is not supported');
	};

	// TODO(shtylman)
	process.cwd = function () { return '/' };
	process.chdir = function (dir) {
	    throw new Error('process.chdir is not supported');
	};


/***/ },
/* 31 */
/***/ function(module, exports, __webpack_require__) {

	/*jshint asi: true */
	var identifier = /^([$A-Z\_a-z\xaa\xb5\xba\xc0-\xd6\xd8-\xf6\xf8-\u02c1\u02c6-\u02d1\u02e0-\u02e4\u02ec\u02ee\u0370-\u0374\u0376\u0377\u037a-\u037d\u0386\u0388-\u038a\u038c\u038e-\u03a1\u03a3-\u03f5\u03f7-\u0481\u048a-\u0527\u0531-\u0556\u0559\u0561-\u0587\u05d0-\u05ea\u05f0-\u05f2\u0620-\u064a\u066e\u066f\u0671-\u06d3\u06d5\u06e5\u06e6\u06ee\u06ef\u06fa-\u06fc\u06ff\u0710\u0712-\u072f\u074d-\u07a5\u07b1\u07ca-\u07ea\u07f4\u07f5\u07fa\u0800-\u0815\u081a\u0824\u0828\u0840-\u0858\u08a0\u08a2-\u08ac\u0904-\u0939\u093d\u0950\u0958-\u0961\u0971-\u0977\u0979-\u097f\u0985-\u098c\u098f\u0990\u0993-\u09a8\u09aa-\u09b0\u09b2\u09b6-\u09b9\u09bd\u09ce\u09dc\u09dd\u09df-\u09e1\u09f0\u09f1\u0a05-\u0a0a\u0a0f\u0a10\u0a13-\u0a28\u0a2a-\u0a30\u0a32\u0a33\u0a35\u0a36\u0a38\u0a39\u0a59-\u0a5c\u0a5e\u0a72-\u0a74\u0a85-\u0a8d\u0a8f-\u0a91\u0a93-\u0aa8\u0aaa-\u0ab0\u0ab2\u0ab3\u0ab5-\u0ab9\u0abd\u0ad0\u0ae0\u0ae1\u0b05-\u0b0c\u0b0f\u0b10\u0b13-\u0b28\u0b2a-\u0b30\u0b32\u0b33\u0b35-\u0b39\u0b3d\u0b5c\u0b5d\u0b5f-\u0b61\u0b71\u0b83\u0b85-\u0b8a\u0b8e-\u0b90\u0b92-\u0b95\u0b99\u0b9a\u0b9c\u0b9e\u0b9f\u0ba3\u0ba4\u0ba8-\u0baa\u0bae-\u0bb9\u0bd0\u0c05-\u0c0c\u0c0e-\u0c10\u0c12-\u0c28\u0c2a-\u0c33\u0c35-\u0c39\u0c3d\u0c58\u0c59\u0c60\u0c61\u0c85-\u0c8c\u0c8e-\u0c90\u0c92-\u0ca8\u0caa-\u0cb3\u0cb5-\u0cb9\u0cbd\u0cde\u0ce0\u0ce1\u0cf1\u0cf2\u0d05-\u0d0c\u0d0e-\u0d10\u0d12-\u0d3a\u0d3d\u0d4e\u0d60\u0d61\u0d7a-\u0d7f\u0d85-\u0d96\u0d9a-\u0db1\u0db3-\u0dbb\u0dbd\u0dc0-\u0dc6\u0e01-\u0e30\u0e32\u0e33\u0e40-\u0e46\u0e81\u0e82\u0e84\u0e87\u0e88\u0e8a\u0e8d\u0e94-\u0e97\u0e99-\u0e9f\u0ea1-\u0ea3\u0ea5\u0ea7\u0eaa\u0eab\u0ead-\u0eb0\u0eb2\u0eb3\u0ebd\u0ec0-\u0ec4\u0ec6\u0edc-\u0edf\u0f00\u0f40-\u0f47\u0f49-\u0f6c\u0f88-\u0f8c\u1000-\u102a\u103f\u1050-\u1055\u105a-\u105d\u1061\u1065\u1066\u106e-\u1070\u1075-\u1081\u108e\u10a0-\u10c5\u10c7\u10cd\u10d0-\u10fa\u10fc-\u1248\u124a-\u124d\u1250-\u1256\u1258\u125a-\u125d\u1260-\u1288\u128a-\u128d\u1290-\u12b0\u12b2-\u12b5\u12b8-\u12be\u12c0\u12c2-\u12c5\u12c8-\u12d6\u12d8-\u1310\u1312-\u1315\u1318-\u135a\u1380-\u138f\u13a0-\u13f4\u1401-\u166c\u166f-\u167f\u1681-\u169a\u16a0-\u16ea\u16ee-\u16f0\u1700-\u170c\u170e-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176c\u176e-\u1770\u1780-\u17b3\u17d7\u17dc\u1820-\u1877\u1880-\u18a8\u18aa\u18b0-\u18f5\u1900-\u191c\u1950-\u196d\u1970-\u1974\u1980-\u19ab\u19c1-\u19c7\u1a00-\u1a16\u1a20-\u1a54\u1aa7\u1b05-\u1b33\u1b45-\u1b4b\u1b83-\u1ba0\u1bae\u1baf\u1bba-\u1be5\u1c00-\u1c23\u1c4d-\u1c4f\u1c5a-\u1c7d\u1ce9-\u1cec\u1cee-\u1cf1\u1cf5\u1cf6\u1d00-\u1dbf\u1e00-\u1f15\u1f18-\u1f1d\u1f20-\u1f45\u1f48-\u1f4d\u1f50-\u1f57\u1f59\u1f5b\u1f5d\u1f5f-\u1f7d\u1f80-\u1fb4\u1fb6-\u1fbc\u1fbe\u1fc2-\u1fc4\u1fc6-\u1fcc\u1fd0-\u1fd3\u1fd6-\u1fdb\u1fe0-\u1fec\u1ff2-\u1ff4\u1ff6-\u1ffc\u2071\u207f\u2090-\u209c\u2102\u2107\u210a-\u2113\u2115\u2119-\u211d\u2124\u2126\u2128\u212a-\u212d\u212f-\u2139\u213c-\u213f\u2145-\u2149\u214e\u2160-\u2188\u2c00-\u2c2e\u2c30-\u2c5e\u2c60-\u2ce4\u2ceb-\u2cee\u2cf2\u2cf3\u2d00-\u2d25\u2d27\u2d2d\u2d30-\u2d67\u2d6f\u2d80-\u2d96\u2da0-\u2da6\u2da8-\u2dae\u2db0-\u2db6\u2db8-\u2dbe\u2dc0-\u2dc6\u2dc8-\u2dce\u2dd0-\u2dd6\u2dd8-\u2dde\u2e2f\u3005-\u3007\u3021-\u3029\u3031-\u3035\u3038-\u303c\u3041-\u3096\u309d-\u309f\u30a1-\u30fa\u30fc-\u30ff\u3105-\u312d\u3131-\u318e\u31a0-\u31ba\u31f0-\u31ff\u3400-\u4db5\u4e00-\u9fcc\ua000-\ua48c\ua4d0-\ua4fd\ua500-\ua60c\ua610-\ua61f\ua62a\ua62b\ua640-\ua66e\ua67f-\ua697\ua6a0-\ua6ef\ua717-\ua71f\ua722-\ua788\ua78b-\ua78e\ua790-\ua793\ua7a0-\ua7aa\ua7f8-\ua801\ua803-\ua805\ua807-\ua80a\ua80c-\ua822\ua840-\ua873\ua882-\ua8b3\ua8f2-\ua8f7\ua8fb\ua90a-\ua925\ua930-\ua946\ua960-\ua97c\ua984-\ua9b2\ua9cf\uaa00-\uaa28\uaa40-\uaa42\uaa44-\uaa4b\uaa60-\uaa76\uaa7a\uaa80-\uaaaf\uaab1\uaab5\uaab6\uaab9-\uaabd\uaac0\uaac2\uaadb-\uaadd\uaae0-\uaaea\uaaf2-\uaaf4\uab01-\uab06\uab09-\uab0e\uab11-\uab16\uab20-\uab26\uab28-\uab2e\uabc0-\uabe2\uac00-\ud7a3\ud7b0-\ud7c6\ud7cb-\ud7fb\uf900-\ufa6d\ufa70-\ufad9\ufb00-\ufb06\ufb13-\ufb17\ufb1d\ufb1f-\ufb28\ufb2a-\ufb36\ufb38-\ufb3c\ufb3e\ufb40\ufb41\ufb43\ufb44\ufb46-\ufbb1\ufbd3-\ufd3d\ufd50-\ufd8f\ufd92-\ufdc7\ufdf0-\ufdfb\ufe70-\ufe74\ufe76-\ufefc\uff21-\uff3a\uff41-\uff5a\uff66-\uffbe\uffc2-\uffc7\uffca-\uffcf\uffd2-\uffd7\uffda-\uffdc][$A-Z\_a-z\xaa\xb5\xba\xc0-\xd6\xd8-\xf6\xf8-\u02c1\u02c6-\u02d1\u02e0-\u02e4\u02ec\u02ee\u0370-\u0374\u0376\u0377\u037a-\u037d\u0386\u0388-\u038a\u038c\u038e-\u03a1\u03a3-\u03f5\u03f7-\u0481\u048a-\u0527\u0531-\u0556\u0559\u0561-\u0587\u05d0-\u05ea\u05f0-\u05f2\u0620-\u064a\u066e\u066f\u0671-\u06d3\u06d5\u06e5\u06e6\u06ee\u06ef\u06fa-\u06fc\u06ff\u0710\u0712-\u072f\u074d-\u07a5\u07b1\u07ca-\u07ea\u07f4\u07f5\u07fa\u0800-\u0815\u081a\u0824\u0828\u0840-\u0858\u08a0\u08a2-\u08ac\u0904-\u0939\u093d\u0950\u0958-\u0961\u0971-\u0977\u0979-\u097f\u0985-\u098c\u098f\u0990\u0993-\u09a8\u09aa-\u09b0\u09b2\u09b6-\u09b9\u09bd\u09ce\u09dc\u09dd\u09df-\u09e1\u09f0\u09f1\u0a05-\u0a0a\u0a0f\u0a10\u0a13-\u0a28\u0a2a-\u0a30\u0a32\u0a33\u0a35\u0a36\u0a38\u0a39\u0a59-\u0a5c\u0a5e\u0a72-\u0a74\u0a85-\u0a8d\u0a8f-\u0a91\u0a93-\u0aa8\u0aaa-\u0ab0\u0ab2\u0ab3\u0ab5-\u0ab9\u0abd\u0ad0\u0ae0\u0ae1\u0b05-\u0b0c\u0b0f\u0b10\u0b13-\u0b28\u0b2a-\u0b30\u0b32\u0b33\u0b35-\u0b39\u0b3d\u0b5c\u0b5d\u0b5f-\u0b61\u0b71\u0b83\u0b85-\u0b8a\u0b8e-\u0b90\u0b92-\u0b95\u0b99\u0b9a\u0b9c\u0b9e\u0b9f\u0ba3\u0ba4\u0ba8-\u0baa\u0bae-\u0bb9\u0bd0\u0c05-\u0c0c\u0c0e-\u0c10\u0c12-\u0c28\u0c2a-\u0c33\u0c35-\u0c39\u0c3d\u0c58\u0c59\u0c60\u0c61\u0c85-\u0c8c\u0c8e-\u0c90\u0c92-\u0ca8\u0caa-\u0cb3\u0cb5-\u0cb9\u0cbd\u0cde\u0ce0\u0ce1\u0cf1\u0cf2\u0d05-\u0d0c\u0d0e-\u0d10\u0d12-\u0d3a\u0d3d\u0d4e\u0d60\u0d61\u0d7a-\u0d7f\u0d85-\u0d96\u0d9a-\u0db1\u0db3-\u0dbb\u0dbd\u0dc0-\u0dc6\u0e01-\u0e30\u0e32\u0e33\u0e40-\u0e46\u0e81\u0e82\u0e84\u0e87\u0e88\u0e8a\u0e8d\u0e94-\u0e97\u0e99-\u0e9f\u0ea1-\u0ea3\u0ea5\u0ea7\u0eaa\u0eab\u0ead-\u0eb0\u0eb2\u0eb3\u0ebd\u0ec0-\u0ec4\u0ec6\u0edc-\u0edf\u0f00\u0f40-\u0f47\u0f49-\u0f6c\u0f88-\u0f8c\u1000-\u102a\u103f\u1050-\u1055\u105a-\u105d\u1061\u1065\u1066\u106e-\u1070\u1075-\u1081\u108e\u10a0-\u10c5\u10c7\u10cd\u10d0-\u10fa\u10fc-\u1248\u124a-\u124d\u1250-\u1256\u1258\u125a-\u125d\u1260-\u1288\u128a-\u128d\u1290-\u12b0\u12b2-\u12b5\u12b8-\u12be\u12c0\u12c2-\u12c5\u12c8-\u12d6\u12d8-\u1310\u1312-\u1315\u1318-\u135a\u1380-\u138f\u13a0-\u13f4\u1401-\u166c\u166f-\u167f\u1681-\u169a\u16a0-\u16ea\u16ee-\u16f0\u1700-\u170c\u170e-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176c\u176e-\u1770\u1780-\u17b3\u17d7\u17dc\u1820-\u1877\u1880-\u18a8\u18aa\u18b0-\u18f5\u1900-\u191c\u1950-\u196d\u1970-\u1974\u1980-\u19ab\u19c1-\u19c7\u1a00-\u1a16\u1a20-\u1a54\u1aa7\u1b05-\u1b33\u1b45-\u1b4b\u1b83-\u1ba0\u1bae\u1baf\u1bba-\u1be5\u1c00-\u1c23\u1c4d-\u1c4f\u1c5a-\u1c7d\u1ce9-\u1cec\u1cee-\u1cf1\u1cf5\u1cf6\u1d00-\u1dbf\u1e00-\u1f15\u1f18-\u1f1d\u1f20-\u1f45\u1f48-\u1f4d\u1f50-\u1f57\u1f59\u1f5b\u1f5d\u1f5f-\u1f7d\u1f80-\u1fb4\u1fb6-\u1fbc\u1fbe\u1fc2-\u1fc4\u1fc6-\u1fcc\u1fd0-\u1fd3\u1fd6-\u1fdb\u1fe0-\u1fec\u1ff2-\u1ff4\u1ff6-\u1ffc\u2071\u207f\u2090-\u209c\u2102\u2107\u210a-\u2113\u2115\u2119-\u211d\u2124\u2126\u2128\u212a-\u212d\u212f-\u2139\u213c-\u213f\u2145-\u2149\u214e\u2160-\u2188\u2c00-\u2c2e\u2c30-\u2c5e\u2c60-\u2ce4\u2ceb-\u2cee\u2cf2\u2cf3\u2d00-\u2d25\u2d27\u2d2d\u2d30-\u2d67\u2d6f\u2d80-\u2d96\u2da0-\u2da6\u2da8-\u2dae\u2db0-\u2db6\u2db8-\u2dbe\u2dc0-\u2dc6\u2dc8-\u2dce\u2dd0-\u2dd6\u2dd8-\u2dde\u2e2f\u3005-\u3007\u3021-\u3029\u3031-\u3035\u3038-\u303c\u3041-\u3096\u309d-\u309f\u30a1-\u30fa\u30fc-\u30ff\u3105-\u312d\u3131-\u318e\u31a0-\u31ba\u31f0-\u31ff\u3400-\u4db5\u4e00-\u9fcc\ua000-\ua48c\ua4d0-\ua4fd\ua500-\ua60c\ua610-\ua61f\ua62a\ua62b\ua640-\ua66e\ua67f-\ua697\ua6a0-\ua6ef\ua717-\ua71f\ua722-\ua788\ua78b-\ua78e\ua790-\ua793\ua7a0-\ua7aa\ua7f8-\ua801\ua803-\ua805\ua807-\ua80a\ua80c-\ua822\ua840-\ua873\ua882-\ua8b3\ua8f2-\ua8f7\ua8fb\ua90a-\ua925\ua930-\ua946\ua960-\ua97c\ua984-\ua9b2\ua9cf\uaa00-\uaa28\uaa40-\uaa42\uaa44-\uaa4b\uaa60-\uaa76\uaa7a\uaa80-\uaaaf\uaab1\uaab5\uaab6\uaab9-\uaabd\uaac0\uaac2\uaadb-\uaadd\uaae0-\uaaea\uaaf2-\uaaf4\uab01-\uab06\uab09-\uab0e\uab11-\uab16\uab20-\uab26\uab28-\uab2e\uabc0-\uabe2\uac00-\ud7a3\ud7b0-\ud7c6\ud7cb-\ud7fb\uf900-\ufa6d\ufa70-\ufad9\ufb00-\ufb06\ufb13-\ufb17\ufb1d\ufb1f-\ufb28\ufb2a-\ufb36\ufb38-\ufb3c\ufb3e\ufb40\ufb41\ufb43\ufb44\ufb46-\ufbb1\ufbd3-\ufd3d\ufd50-\ufd8f\ufd92-\ufdc7\ufdf0-\ufdfb\ufe70-\ufe74\ufe76-\ufefc\uff21-\uff3a\uff41-\uff5a\uff66-\uffbe\uffc2-\uffc7\uffca-\uffcf\uffd2-\uffd7\uffda-\uffdc0-9\u0300-\u036f\u0483-\u0487\u0591-\u05bd\u05bf\u05c1\u05c2\u05c4\u05c5\u05c7\u0610-\u061a\u064b-\u0669\u0670\u06d6-\u06dc\u06df-\u06e4\u06e7\u06e8\u06ea-\u06ed\u06f0-\u06f9\u0711\u0730-\u074a\u07a6-\u07b0\u07c0-\u07c9\u07eb-\u07f3\u0816-\u0819\u081b-\u0823\u0825-\u0827\u0829-\u082d\u0859-\u085b\u08e4-\u08fe\u0900-\u0903\u093a-\u093c\u093e-\u094f\u0951-\u0957\u0962\u0963\u0966-\u096f\u0981-\u0983\u09bc\u09be-\u09c4\u09c7\u09c8\u09cb-\u09cd\u09d7\u09e2\u09e3\u09e6-\u09ef\u0a01-\u0a03\u0a3c\u0a3e-\u0a42\u0a47\u0a48\u0a4b-\u0a4d\u0a51\u0a66-\u0a71\u0a75\u0a81-\u0a83\u0abc\u0abe-\u0ac5\u0ac7-\u0ac9\u0acb-\u0acd\u0ae2\u0ae3\u0ae6-\u0aef\u0b01-\u0b03\u0b3c\u0b3e-\u0b44\u0b47\u0b48\u0b4b-\u0b4d\u0b56\u0b57\u0b62\u0b63\u0b66-\u0b6f\u0b82\u0bbe-\u0bc2\u0bc6-\u0bc8\u0bca-\u0bcd\u0bd7\u0be6-\u0bef\u0c01-\u0c03\u0c3e-\u0c44\u0c46-\u0c48\u0c4a-\u0c4d\u0c55\u0c56\u0c62\u0c63\u0c66-\u0c6f\u0c82\u0c83\u0cbc\u0cbe-\u0cc4\u0cc6-\u0cc8\u0cca-\u0ccd\u0cd5\u0cd6\u0ce2\u0ce3\u0ce6-\u0cef\u0d02\u0d03\u0d3e-\u0d44\u0d46-\u0d48\u0d4a-\u0d4d\u0d57\u0d62\u0d63\u0d66-\u0d6f\u0d82\u0d83\u0dca\u0dcf-\u0dd4\u0dd6\u0dd8-\u0ddf\u0df2\u0df3\u0e31\u0e34-\u0e3a\u0e47-\u0e4e\u0e50-\u0e59\u0eb1\u0eb4-\u0eb9\u0ebb\u0ebc\u0ec8-\u0ecd\u0ed0-\u0ed9\u0f18\u0f19\u0f20-\u0f29\u0f35\u0f37\u0f39\u0f3e\u0f3f\u0f71-\u0f84\u0f86\u0f87\u0f8d-\u0f97\u0f99-\u0fbc\u0fc6\u102b-\u103e\u1040-\u1049\u1056-\u1059\u105e-\u1060\u1062-\u1064\u1067-\u106d\u1071-\u1074\u1082-\u108d\u108f-\u109d\u135d-\u135f\u1712-\u1714\u1732-\u1734\u1752\u1753\u1772\u1773\u17b4-\u17d3\u17dd\u17e0-\u17e9\u180b-\u180d\u1810-\u1819\u18a9\u1920-\u192b\u1930-\u193b\u1946-\u194f\u19b0-\u19c0\u19c8\u19c9\u19d0-\u19d9\u1a17-\u1a1b\u1a55-\u1a5e\u1a60-\u1a7c\u1a7f-\u1a89\u1a90-\u1a99\u1b00-\u1b04\u1b34-\u1b44\u1b50-\u1b59\u1b6b-\u1b73\u1b80-\u1b82\u1ba1-\u1bad\u1bb0-\u1bb9\u1be6-\u1bf3\u1c24-\u1c37\u1c40-\u1c49\u1c50-\u1c59\u1cd0-\u1cd2\u1cd4-\u1ce8\u1ced\u1cf2-\u1cf4\u1dc0-\u1de6\u1dfc-\u1dff\u200c\u200d\u203f\u2040\u2054\u20d0-\u20dc\u20e1\u20e5-\u20f0\u2cef-\u2cf1\u2d7f\u2de0-\u2dff\u302a-\u302f\u3099\u309a\ua620-\ua629\ua66f\ua674-\ua67d\ua69f\ua6f0\ua6f1\ua802\ua806\ua80b\ua823-\ua827\ua880\ua881\ua8b4-\ua8c4\ua8d0-\ua8d9\ua8e0-\ua8f1\ua900-\ua909\ua926-\ua92d\ua947-\ua953\ua980-\ua983\ua9b3-\ua9c0\ua9d0-\ua9d9\uaa29-\uaa36\uaa43\uaa4c\uaa4d\uaa50-\uaa59\uaa7b\uaab0\uaab2-\uaab4\uaab7\uaab8\uaabe\uaabf\uaac1\uaaeb-\uaaef\uaaf5\uaaf6\uabe3-\uabea\uabec\uabed\uabf0-\uabf9\ufb1e\ufe00-\ufe0f\ufe20-\ufe26\ufe33\ufe34\ufe4d-\ufe4f\uff10-\uff19\uff3f]*)/

	function getParameterNames(fn) {
	  var code = fn.toString()

	  // Cleanup code by removing extra space
	  code.trim()

	  var i = 0
	  var item = ''
	  var chunk = ''
	  var ignore = false
	  var params = []
	  var args = []

	  // scan each character until we find something to parse
	  while (i < code.length) {
	    // grabs the remaining chunk of code
	    chunk = code.substr(i, code.length)

	    if (ignore) {
	      // end of comments
	      if (/^(\*\/)/.test(chunk)) {
	        ignore = false
	        i += 2
	        continue
	      }
	      i += 1
	      continue
	    }

	    // matches tokens
	    if (identifier.test(chunk)) {
	      item = identifier.exec(chunk)[1]
	      params.length && args.push(item)
	      i += item.length

	    // start of comments
	    } else if (/^(\/\*)/.test(chunk)) {
	      ignore = true
	      i += 2
	    // ignore whitespace
	    } else if (/^\s/.test(chunk)) {
	      i += 1
	    // parenthesis begin
	    } else if (/^\(/.test(chunk)) {
	      params.push(1)
	      i += 1
	    // parenthesis end
	    } else if (/^\)/.test(chunk)) {
	      params.pop()
	      i += 1

	      if (!params.length) {
	        break
	      }
	    } else {
	      i += 1
	    }
	  }

	  return args
	}

	module.exports = getParameterNames


/***/ },
/* 32 */
/***/ function(module, exports, __webpack_require__) {

	(function() {
	  var Emitter, Subscription,
	    __hasProp = {}.hasOwnProperty,
	    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

	  Emitter = __webpack_require__(23);

	  module.exports = Subscription = (function(_super) {
	    __extends(Subscription, _super);

	    Subscription.prototype.cancelled = false;

	    function Subscription(emitter, eventNames, handler) {
	      this.emitter = emitter;
	      this.eventNames = eventNames;
	      this.handler = handler;
	    }

	    Subscription.prototype.off = function() {
	      return this.dispose();
	    };

	    Subscription.prototype.dispose = function() {
	      var unsubscribe, _ref;
	      if (this.cancelled) {
	        return;
	      }
	      unsubscribe = (_ref = this.emitter.off) != null ? _ref : this.emitter.removeListener;
	      unsubscribe.call(this.emitter, this.eventNames, this.handler);
	      this.emitter = null;
	      this.handler = null;
	      this.cancelled = true;
	      return this.emit('cancelled');
	    };

	    return Subscription;

	  })(Emitter);

	}).call(this);


/***/ },
/* 33 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;//     Underscore.js 1.6.0
	//     http://underscorejs.org
	//     (c) 2009-2014 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
	//     Underscore may be freely distributed under the MIT license.

	(function() {

	  // Baseline setup
	  // --------------

	  // Establish the root object, `window` in the browser, or `exports` on the server.
	  var root = this;

	  // Save the previous value of the `_` variable.
	  var previousUnderscore = root._;

	  // Establish the object that gets returned to break out of a loop iteration.
	  var breaker = {};

	  // Save bytes in the minified (but not gzipped) version:
	  var ArrayProto = Array.prototype, ObjProto = Object.prototype, FuncProto = Function.prototype;

	  // Create quick reference variables for speed access to core prototypes.
	  var
	    push             = ArrayProto.push,
	    slice            = ArrayProto.slice,
	    concat           = ArrayProto.concat,
	    toString         = ObjProto.toString,
	    hasOwnProperty   = ObjProto.hasOwnProperty;

	  // All **ECMAScript 5** native function implementations that we hope to use
	  // are declared here.
	  var
	    nativeForEach      = ArrayProto.forEach,
	    nativeMap          = ArrayProto.map,
	    nativeReduce       = ArrayProto.reduce,
	    nativeReduceRight  = ArrayProto.reduceRight,
	    nativeFilter       = ArrayProto.filter,
	    nativeEvery        = ArrayProto.every,
	    nativeSome         = ArrayProto.some,
	    nativeIndexOf      = ArrayProto.indexOf,
	    nativeLastIndexOf  = ArrayProto.lastIndexOf,
	    nativeIsArray      = Array.isArray,
	    nativeKeys         = Object.keys,
	    nativeBind         = FuncProto.bind;

	  // Create a safe reference to the Underscore object for use below.
	  var _ = function(obj) {
	    if (obj instanceof _) return obj;
	    if (!(this instanceof _)) return new _(obj);
	    this._wrapped = obj;
	  };

	  // Export the Underscore object for **Node.js**, with
	  // backwards-compatibility for the old `require()` API. If we're in
	  // the browser, add `_` as a global object via a string identifier,
	  // for Closure Compiler "advanced" mode.
	  if (true) {
	    if (typeof module !== 'undefined' && module.exports) {
	      exports = module.exports = _;
	    }
	    exports._ = _;
	  } else {
	    root._ = _;
	  }

	  // Current version.
	  _.VERSION = '1.6.0';

	  // Collection Functions
	  // --------------------

	  // The cornerstone, an `each` implementation, aka `forEach`.
	  // Handles objects with the built-in `forEach`, arrays, and raw objects.
	  // Delegates to **ECMAScript 5**'s native `forEach` if available.
	  var each = _.each = _.forEach = function(obj, iterator, context) {
	    if (obj == null) return obj;
	    if (nativeForEach && obj.forEach === nativeForEach) {
	      obj.forEach(iterator, context);
	    } else if (obj.length === +obj.length) {
	      for (var i = 0, length = obj.length; i < length; i++) {
	        if (iterator.call(context, obj[i], i, obj) === breaker) return;
	      }
	    } else {
	      var keys = _.keys(obj);
	      for (var i = 0, length = keys.length; i < length; i++) {
	        if (iterator.call(context, obj[keys[i]], keys[i], obj) === breaker) return;
	      }
	    }
	    return obj;
	  };

	  // Return the results of applying the iterator to each element.
	  // Delegates to **ECMAScript 5**'s native `map` if available.
	  _.map = _.collect = function(obj, iterator, context) {
	    var results = [];
	    if (obj == null) return results;
	    if (nativeMap && obj.map === nativeMap) return obj.map(iterator, context);
	    each(obj, function(value, index, list) {
	      results.push(iterator.call(context, value, index, list));
	    });
	    return results;
	  };

	  var reduceError = 'Reduce of empty array with no initial value';

	  // **Reduce** builds up a single result from a list of values, aka `inject`,
	  // or `foldl`. Delegates to **ECMAScript 5**'s native `reduce` if available.
	  _.reduce = _.foldl = _.inject = function(obj, iterator, memo, context) {
	    var initial = arguments.length > 2;
	    if (obj == null) obj = [];
	    if (nativeReduce && obj.reduce === nativeReduce) {
	      if (context) iterator = _.bind(iterator, context);
	      return initial ? obj.reduce(iterator, memo) : obj.reduce(iterator);
	    }
	    each(obj, function(value, index, list) {
	      if (!initial) {
	        memo = value;
	        initial = true;
	      } else {
	        memo = iterator.call(context, memo, value, index, list);
	      }
	    });
	    if (!initial) throw new TypeError(reduceError);
	    return memo;
	  };

	  // The right-associative version of reduce, also known as `foldr`.
	  // Delegates to **ECMAScript 5**'s native `reduceRight` if available.
	  _.reduceRight = _.foldr = function(obj, iterator, memo, context) {
	    var initial = arguments.length > 2;
	    if (obj == null) obj = [];
	    if (nativeReduceRight && obj.reduceRight === nativeReduceRight) {
	      if (context) iterator = _.bind(iterator, context);
	      return initial ? obj.reduceRight(iterator, memo) : obj.reduceRight(iterator);
	    }
	    var length = obj.length;
	    if (length !== +length) {
	      var keys = _.keys(obj);
	      length = keys.length;
	    }
	    each(obj, function(value, index, list) {
	      index = keys ? keys[--length] : --length;
	      if (!initial) {
	        memo = obj[index];
	        initial = true;
	      } else {
	        memo = iterator.call(context, memo, obj[index], index, list);
	      }
	    });
	    if (!initial) throw new TypeError(reduceError);
	    return memo;
	  };

	  // Return the first value which passes a truth test. Aliased as `detect`.
	  _.find = _.detect = function(obj, predicate, context) {
	    var result;
	    any(obj, function(value, index, list) {
	      if (predicate.call(context, value, index, list)) {
	        result = value;
	        return true;
	      }
	    });
	    return result;
	  };

	  // Return all the elements that pass a truth test.
	  // Delegates to **ECMAScript 5**'s native `filter` if available.
	  // Aliased as `select`.
	  _.filter = _.select = function(obj, predicate, context) {
	    var results = [];
	    if (obj == null) return results;
	    if (nativeFilter && obj.filter === nativeFilter) return obj.filter(predicate, context);
	    each(obj, function(value, index, list) {
	      if (predicate.call(context, value, index, list)) results.push(value);
	    });
	    return results;
	  };

	  // Return all the elements for which a truth test fails.
	  _.reject = function(obj, predicate, context) {
	    return _.filter(obj, function(value, index, list) {
	      return !predicate.call(context, value, index, list);
	    }, context);
	  };

	  // Determine whether all of the elements match a truth test.
	  // Delegates to **ECMAScript 5**'s native `every` if available.
	  // Aliased as `all`.
	  _.every = _.all = function(obj, predicate, context) {
	    predicate || (predicate = _.identity);
	    var result = true;
	    if (obj == null) return result;
	    if (nativeEvery && obj.every === nativeEvery) return obj.every(predicate, context);
	    each(obj, function(value, index, list) {
	      if (!(result = result && predicate.call(context, value, index, list))) return breaker;
	    });
	    return !!result;
	  };

	  // Determine if at least one element in the object matches a truth test.
	  // Delegates to **ECMAScript 5**'s native `some` if available.
	  // Aliased as `any`.
	  var any = _.some = _.any = function(obj, predicate, context) {
	    predicate || (predicate = _.identity);
	    var result = false;
	    if (obj == null) return result;
	    if (nativeSome && obj.some === nativeSome) return obj.some(predicate, context);
	    each(obj, function(value, index, list) {
	      if (result || (result = predicate.call(context, value, index, list))) return breaker;
	    });
	    return !!result;
	  };

	  // Determine if the array or object contains a given value (using `===`).
	  // Aliased as `include`.
	  _.contains = _.include = function(obj, target) {
	    if (obj == null) return false;
	    if (nativeIndexOf && obj.indexOf === nativeIndexOf) return obj.indexOf(target) != -1;
	    return any(obj, function(value) {
	      return value === target;
	    });
	  };

	  // Invoke a method (with arguments) on every item in a collection.
	  _.invoke = function(obj, method) {
	    var args = slice.call(arguments, 2);
	    var isFunc = _.isFunction(method);
	    return _.map(obj, function(value) {
	      return (isFunc ? method : value[method]).apply(value, args);
	    });
	  };

	  // Convenience version of a common use case of `map`: fetching a property.
	  _.pluck = function(obj, key) {
	    return _.map(obj, _.property(key));
	  };

	  // Convenience version of a common use case of `filter`: selecting only objects
	  // containing specific `key:value` pairs.
	  _.where = function(obj, attrs) {
	    return _.filter(obj, _.matches(attrs));
	  };

	  // Convenience version of a common use case of `find`: getting the first object
	  // containing specific `key:value` pairs.
	  _.findWhere = function(obj, attrs) {
	    return _.find(obj, _.matches(attrs));
	  };

	  // Return the maximum element or (element-based computation).
	  // Can't optimize arrays of integers longer than 65,535 elements.
	  // See [WebKit Bug 80797](https://bugs.webkit.org/show_bug.cgi?id=80797)
	  _.max = function(obj, iterator, context) {
	    if (!iterator && _.isArray(obj) && obj[0] === +obj[0] && obj.length < 65535) {
	      return Math.max.apply(Math, obj);
	    }
	    var result = -Infinity, lastComputed = -Infinity;
	    each(obj, function(value, index, list) {
	      var computed = iterator ? iterator.call(context, value, index, list) : value;
	      if (computed > lastComputed) {
	        result = value;
	        lastComputed = computed;
	      }
	    });
	    return result;
	  };

	  // Return the minimum element (or element-based computation).
	  _.min = function(obj, iterator, context) {
	    if (!iterator && _.isArray(obj) && obj[0] === +obj[0] && obj.length < 65535) {
	      return Math.min.apply(Math, obj);
	    }
	    var result = Infinity, lastComputed = Infinity;
	    each(obj, function(value, index, list) {
	      var computed = iterator ? iterator.call(context, value, index, list) : value;
	      if (computed < lastComputed) {
	        result = value;
	        lastComputed = computed;
	      }
	    });
	    return result;
	  };

	  // Shuffle an array, using the modern version of the
	  // [Fisher-Yates shuffle](http://en.wikipedia.org/wiki/Fisher–Yates_shuffle).
	  _.shuffle = function(obj) {
	    var rand;
	    var index = 0;
	    var shuffled = [];
	    each(obj, function(value) {
	      rand = _.random(index++);
	      shuffled[index - 1] = shuffled[rand];
	      shuffled[rand] = value;
	    });
	    return shuffled;
	  };

	  // Sample **n** random values from a collection.
	  // If **n** is not specified, returns a single random element.
	  // The internal `guard` argument allows it to work with `map`.
	  _.sample = function(obj, n, guard) {
	    if (n == null || guard) {
	      if (obj.length !== +obj.length) obj = _.values(obj);
	      return obj[_.random(obj.length - 1)];
	    }
	    return _.shuffle(obj).slice(0, Math.max(0, n));
	  };

	  // An internal function to generate lookup iterators.
	  var lookupIterator = function(value) {
	    if (value == null) return _.identity;
	    if (_.isFunction(value)) return value;
	    return _.property(value);
	  };

	  // Sort the object's values by a criterion produced by an iterator.
	  _.sortBy = function(obj, iterator, context) {
	    iterator = lookupIterator(iterator);
	    return _.pluck(_.map(obj, function(value, index, list) {
	      return {
	        value: value,
	        index: index,
	        criteria: iterator.call(context, value, index, list)
	      };
	    }).sort(function(left, right) {
	      var a = left.criteria;
	      var b = right.criteria;
	      if (a !== b) {
	        if (a > b || a === void 0) return 1;
	        if (a < b || b === void 0) return -1;
	      }
	      return left.index - right.index;
	    }), 'value');
	  };

	  // An internal function used for aggregate "group by" operations.
	  var group = function(behavior) {
	    return function(obj, iterator, context) {
	      var result = {};
	      iterator = lookupIterator(iterator);
	      each(obj, function(value, index) {
	        var key = iterator.call(context, value, index, obj);
	        behavior(result, key, value);
	      });
	      return result;
	    };
	  };

	  // Groups the object's values by a criterion. Pass either a string attribute
	  // to group by, or a function that returns the criterion.
	  _.groupBy = group(function(result, key, value) {
	    _.has(result, key) ? result[key].push(value) : result[key] = [value];
	  });

	  // Indexes the object's values by a criterion, similar to `groupBy`, but for
	  // when you know that your index values will be unique.
	  _.indexBy = group(function(result, key, value) {
	    result[key] = value;
	  });

	  // Counts instances of an object that group by a certain criterion. Pass
	  // either a string attribute to count by, or a function that returns the
	  // criterion.
	  _.countBy = group(function(result, key) {
	    _.has(result, key) ? result[key]++ : result[key] = 1;
	  });

	  // Use a comparator function to figure out the smallest index at which
	  // an object should be inserted so as to maintain order. Uses binary search.
	  _.sortedIndex = function(array, obj, iterator, context) {
	    iterator = lookupIterator(iterator);
	    var value = iterator.call(context, obj);
	    var low = 0, high = array.length;
	    while (low < high) {
	      var mid = (low + high) >>> 1;
	      iterator.call(context, array[mid]) < value ? low = mid + 1 : high = mid;
	    }
	    return low;
	  };

	  // Safely create a real, live array from anything iterable.
	  _.toArray = function(obj) {
	    if (!obj) return [];
	    if (_.isArray(obj)) return slice.call(obj);
	    if (obj.length === +obj.length) return _.map(obj, _.identity);
	    return _.values(obj);
	  };

	  // Return the number of elements in an object.
	  _.size = function(obj) {
	    if (obj == null) return 0;
	    return (obj.length === +obj.length) ? obj.length : _.keys(obj).length;
	  };

	  // Array Functions
	  // ---------------

	  // Get the first element of an array. Passing **n** will return the first N
	  // values in the array. Aliased as `head` and `take`. The **guard** check
	  // allows it to work with `_.map`.
	  _.first = _.head = _.take = function(array, n, guard) {
	    if (array == null) return void 0;
	    if ((n == null) || guard) return array[0];
	    if (n < 0) return [];
	    return slice.call(array, 0, n);
	  };

	  // Returns everything but the last entry of the array. Especially useful on
	  // the arguments object. Passing **n** will return all the values in
	  // the array, excluding the last N. The **guard** check allows it to work with
	  // `_.map`.
	  _.initial = function(array, n, guard) {
	    return slice.call(array, 0, array.length - ((n == null) || guard ? 1 : n));
	  };

	  // Get the last element of an array. Passing **n** will return the last N
	  // values in the array. The **guard** check allows it to work with `_.map`.
	  _.last = function(array, n, guard) {
	    if (array == null) return void 0;
	    if ((n == null) || guard) return array[array.length - 1];
	    return slice.call(array, Math.max(array.length - n, 0));
	  };

	  // Returns everything but the first entry of the array. Aliased as `tail` and `drop`.
	  // Especially useful on the arguments object. Passing an **n** will return
	  // the rest N values in the array. The **guard**
	  // check allows it to work with `_.map`.
	  _.rest = _.tail = _.drop = function(array, n, guard) {
	    return slice.call(array, (n == null) || guard ? 1 : n);
	  };

	  // Trim out all falsy values from an array.
	  _.compact = function(array) {
	    return _.filter(array, _.identity);
	  };

	  // Internal implementation of a recursive `flatten` function.
	  var flatten = function(input, shallow, output) {
	    if (shallow && _.every(input, _.isArray)) {
	      return concat.apply(output, input);
	    }
	    each(input, function(value) {
	      if (_.isArray(value) || _.isArguments(value)) {
	        shallow ? push.apply(output, value) : flatten(value, shallow, output);
	      } else {
	        output.push(value);
	      }
	    });
	    return output;
	  };

	  // Flatten out an array, either recursively (by default), or just one level.
	  _.flatten = function(array, shallow) {
	    return flatten(array, shallow, []);
	  };

	  // Return a version of the array that does not contain the specified value(s).
	  _.without = function(array) {
	    return _.difference(array, slice.call(arguments, 1));
	  };

	  // Split an array into two arrays: one whose elements all satisfy the given
	  // predicate, and one whose elements all do not satisfy the predicate.
	  _.partition = function(array, predicate) {
	    var pass = [], fail = [];
	    each(array, function(elem) {
	      (predicate(elem) ? pass : fail).push(elem);
	    });
	    return [pass, fail];
	  };

	  // Produce a duplicate-free version of the array. If the array has already
	  // been sorted, you have the option of using a faster algorithm.
	  // Aliased as `unique`.
	  _.uniq = _.unique = function(array, isSorted, iterator, context) {
	    if (_.isFunction(isSorted)) {
	      context = iterator;
	      iterator = isSorted;
	      isSorted = false;
	    }
	    var initial = iterator ? _.map(array, iterator, context) : array;
	    var results = [];
	    var seen = [];
	    each(initial, function(value, index) {
	      if (isSorted ? (!index || seen[seen.length - 1] !== value) : !_.contains(seen, value)) {
	        seen.push(value);
	        results.push(array[index]);
	      }
	    });
	    return results;
	  };

	  // Produce an array that contains the union: each distinct element from all of
	  // the passed-in arrays.
	  _.union = function() {
	    return _.uniq(_.flatten(arguments, true));
	  };

	  // Produce an array that contains every item shared between all the
	  // passed-in arrays.
	  _.intersection = function(array) {
	    var rest = slice.call(arguments, 1);
	    return _.filter(_.uniq(array), function(item) {
	      return _.every(rest, function(other) {
	        return _.contains(other, item);
	      });
	    });
	  };

	  // Take the difference between one array and a number of other arrays.
	  // Only the elements present in just the first array will remain.
	  _.difference = function(array) {
	    var rest = concat.apply(ArrayProto, slice.call(arguments, 1));
	    return _.filter(array, function(value){ return !_.contains(rest, value); });
	  };

	  // Zip together multiple lists into a single array -- elements that share
	  // an index go together.
	  _.zip = function() {
	    var length = _.max(_.pluck(arguments, 'length').concat(0));
	    var results = new Array(length);
	    for (var i = 0; i < length; i++) {
	      results[i] = _.pluck(arguments, '' + i);
	    }
	    return results;
	  };

	  // Converts lists into objects. Pass either a single array of `[key, value]`
	  // pairs, or two parallel arrays of the same length -- one of keys, and one of
	  // the corresponding values.
	  _.object = function(list, values) {
	    if (list == null) return {};
	    var result = {};
	    for (var i = 0, length = list.length; i < length; i++) {
	      if (values) {
	        result[list[i]] = values[i];
	      } else {
	        result[list[i][0]] = list[i][1];
	      }
	    }
	    return result;
	  };

	  // If the browser doesn't supply us with indexOf (I'm looking at you, **MSIE**),
	  // we need this function. Return the position of the first occurrence of an
	  // item in an array, or -1 if the item is not included in the array.
	  // Delegates to **ECMAScript 5**'s native `indexOf` if available.
	  // If the array is large and already in sort order, pass `true`
	  // for **isSorted** to use binary search.
	  _.indexOf = function(array, item, isSorted) {
	    if (array == null) return -1;
	    var i = 0, length = array.length;
	    if (isSorted) {
	      if (typeof isSorted == 'number') {
	        i = (isSorted < 0 ? Math.max(0, length + isSorted) : isSorted);
	      } else {
	        i = _.sortedIndex(array, item);
	        return array[i] === item ? i : -1;
	      }
	    }
	    if (nativeIndexOf && array.indexOf === nativeIndexOf) return array.indexOf(item, isSorted);
	    for (; i < length; i++) if (array[i] === item) return i;
	    return -1;
	  };

	  // Delegates to **ECMAScript 5**'s native `lastIndexOf` if available.
	  _.lastIndexOf = function(array, item, from) {
	    if (array == null) return -1;
	    var hasIndex = from != null;
	    if (nativeLastIndexOf && array.lastIndexOf === nativeLastIndexOf) {
	      return hasIndex ? array.lastIndexOf(item, from) : array.lastIndexOf(item);
	    }
	    var i = (hasIndex ? from : array.length);
	    while (i--) if (array[i] === item) return i;
	    return -1;
	  };

	  // Generate an integer Array containing an arithmetic progression. A port of
	  // the native Python `range()` function. See
	  // [the Python documentation](http://docs.python.org/library/functions.html#range).
	  _.range = function(start, stop, step) {
	    if (arguments.length <= 1) {
	      stop = start || 0;
	      start = 0;
	    }
	    step = arguments[2] || 1;

	    var length = Math.max(Math.ceil((stop - start) / step), 0);
	    var idx = 0;
	    var range = new Array(length);

	    while(idx < length) {
	      range[idx++] = start;
	      start += step;
	    }

	    return range;
	  };

	  // Function (ahem) Functions
	  // ------------------

	  // Reusable constructor function for prototype setting.
	  var ctor = function(){};

	  // Create a function bound to a given object (assigning `this`, and arguments,
	  // optionally). Delegates to **ECMAScript 5**'s native `Function.bind` if
	  // available.
	  _.bind = function(func, context) {
	    var args, bound;
	    if (nativeBind && func.bind === nativeBind) return nativeBind.apply(func, slice.call(arguments, 1));
	    if (!_.isFunction(func)) throw new TypeError;
	    args = slice.call(arguments, 2);
	    return bound = function() {
	      if (!(this instanceof bound)) return func.apply(context, args.concat(slice.call(arguments)));
	      ctor.prototype = func.prototype;
	      var self = new ctor;
	      ctor.prototype = null;
	      var result = func.apply(self, args.concat(slice.call(arguments)));
	      if (Object(result) === result) return result;
	      return self;
	    };
	  };

	  // Partially apply a function by creating a version that has had some of its
	  // arguments pre-filled, without changing its dynamic `this` context. _ acts
	  // as a placeholder, allowing any combination of arguments to be pre-filled.
	  _.partial = function(func) {
	    var boundArgs = slice.call(arguments, 1);
	    return function() {
	      var position = 0;
	      var args = boundArgs.slice();
	      for (var i = 0, length = args.length; i < length; i++) {
	        if (args[i] === _) args[i] = arguments[position++];
	      }
	      while (position < arguments.length) args.push(arguments[position++]);
	      return func.apply(this, args);
	    };
	  };

	  // Bind a number of an object's methods to that object. Remaining arguments
	  // are the method names to be bound. Useful for ensuring that all callbacks
	  // defined on an object belong to it.
	  _.bindAll = function(obj) {
	    var funcs = slice.call(arguments, 1);
	    if (funcs.length === 0) throw new Error('bindAll must be passed function names');
	    each(funcs, function(f) { obj[f] = _.bind(obj[f], obj); });
	    return obj;
	  };

	  // Memoize an expensive function by storing its results.
	  _.memoize = function(func, hasher) {
	    var memo = {};
	    hasher || (hasher = _.identity);
	    return function() {
	      var key = hasher.apply(this, arguments);
	      return _.has(memo, key) ? memo[key] : (memo[key] = func.apply(this, arguments));
	    };
	  };

	  // Delays a function for the given number of milliseconds, and then calls
	  // it with the arguments supplied.
	  _.delay = function(func, wait) {
	    var args = slice.call(arguments, 2);
	    return setTimeout(function(){ return func.apply(null, args); }, wait);
	  };

	  // Defers a function, scheduling it to run after the current call stack has
	  // cleared.
	  _.defer = function(func) {
	    return _.delay.apply(_, [func, 1].concat(slice.call(arguments, 1)));
	  };

	  // Returns a function, that, when invoked, will only be triggered at most once
	  // during a given window of time. Normally, the throttled function will run
	  // as much as it can, without ever going more than once per `wait` duration;
	  // but if you'd like to disable the execution on the leading edge, pass
	  // `{leading: false}`. To disable execution on the trailing edge, ditto.
	  _.throttle = function(func, wait, options) {
	    var context, args, result;
	    var timeout = null;
	    var previous = 0;
	    options || (options = {});
	    var later = function() {
	      previous = options.leading === false ? 0 : _.now();
	      timeout = null;
	      result = func.apply(context, args);
	      context = args = null;
	    };
	    return function() {
	      var now = _.now();
	      if (!previous && options.leading === false) previous = now;
	      var remaining = wait - (now - previous);
	      context = this;
	      args = arguments;
	      if (remaining <= 0) {
	        clearTimeout(timeout);
	        timeout = null;
	        previous = now;
	        result = func.apply(context, args);
	        context = args = null;
	      } else if (!timeout && options.trailing !== false) {
	        timeout = setTimeout(later, remaining);
	      }
	      return result;
	    };
	  };

	  // Returns a function, that, as long as it continues to be invoked, will not
	  // be triggered. The function will be called after it stops being called for
	  // N milliseconds. If `immediate` is passed, trigger the function on the
	  // leading edge, instead of the trailing.
	  _.debounce = function(func, wait, immediate) {
	    var timeout, args, context, timestamp, result;

	    var later = function() {
	      var last = _.now() - timestamp;
	      if (last < wait) {
	        timeout = setTimeout(later, wait - last);
	      } else {
	        timeout = null;
	        if (!immediate) {
	          result = func.apply(context, args);
	          context = args = null;
	        }
	      }
	    };

	    return function() {
	      context = this;
	      args = arguments;
	      timestamp = _.now();
	      var callNow = immediate && !timeout;
	      if (!timeout) {
	        timeout = setTimeout(later, wait);
	      }
	      if (callNow) {
	        result = func.apply(context, args);
	        context = args = null;
	      }

	      return result;
	    };
	  };

	  // Returns a function that will be executed at most one time, no matter how
	  // often you call it. Useful for lazy initialization.
	  _.once = function(func) {
	    var ran = false, memo;
	    return function() {
	      if (ran) return memo;
	      ran = true;
	      memo = func.apply(this, arguments);
	      func = null;
	      return memo;
	    };
	  };

	  // Returns the first function passed as an argument to the second,
	  // allowing you to adjust arguments, run code before and after, and
	  // conditionally execute the original function.
	  _.wrap = function(func, wrapper) {
	    return _.partial(wrapper, func);
	  };

	  // Returns a function that is the composition of a list of functions, each
	  // consuming the return value of the function that follows.
	  _.compose = function() {
	    var funcs = arguments;
	    return function() {
	      var args = arguments;
	      for (var i = funcs.length - 1; i >= 0; i--) {
	        args = [funcs[i].apply(this, args)];
	      }
	      return args[0];
	    };
	  };

	  // Returns a function that will only be executed after being called N times.
	  _.after = function(times, func) {
	    return function() {
	      if (--times < 1) {
	        return func.apply(this, arguments);
	      }
	    };
	  };

	  // Object Functions
	  // ----------------

	  // Retrieve the names of an object's properties.
	  // Delegates to **ECMAScript 5**'s native `Object.keys`
	  _.keys = function(obj) {
	    if (!_.isObject(obj)) return [];
	    if (nativeKeys) return nativeKeys(obj);
	    var keys = [];
	    for (var key in obj) if (_.has(obj, key)) keys.push(key);
	    return keys;
	  };

	  // Retrieve the values of an object's properties.
	  _.values = function(obj) {
	    var keys = _.keys(obj);
	    var length = keys.length;
	    var values = new Array(length);
	    for (var i = 0; i < length; i++) {
	      values[i] = obj[keys[i]];
	    }
	    return values;
	  };

	  // Convert an object into a list of `[key, value]` pairs.
	  _.pairs = function(obj) {
	    var keys = _.keys(obj);
	    var length = keys.length;
	    var pairs = new Array(length);
	    for (var i = 0; i < length; i++) {
	      pairs[i] = [keys[i], obj[keys[i]]];
	    }
	    return pairs;
	  };

	  // Invert the keys and values of an object. The values must be serializable.
	  _.invert = function(obj) {
	    var result = {};
	    var keys = _.keys(obj);
	    for (var i = 0, length = keys.length; i < length; i++) {
	      result[obj[keys[i]]] = keys[i];
	    }
	    return result;
	  };

	  // Return a sorted list of the function names available on the object.
	  // Aliased as `methods`
	  _.functions = _.methods = function(obj) {
	    var names = [];
	    for (var key in obj) {
	      if (_.isFunction(obj[key])) names.push(key);
	    }
	    return names.sort();
	  };

	  // Extend a given object with all the properties in passed-in object(s).
	  _.extend = function(obj) {
	    each(slice.call(arguments, 1), function(source) {
	      if (source) {
	        for (var prop in source) {
	          obj[prop] = source[prop];
	        }
	      }
	    });
	    return obj;
	  };

	  // Return a copy of the object only containing the whitelisted properties.
	  _.pick = function(obj) {
	    var copy = {};
	    var keys = concat.apply(ArrayProto, slice.call(arguments, 1));
	    each(keys, function(key) {
	      if (key in obj) copy[key] = obj[key];
	    });
	    return copy;
	  };

	   // Return a copy of the object without the blacklisted properties.
	  _.omit = function(obj) {
	    var copy = {};
	    var keys = concat.apply(ArrayProto, slice.call(arguments, 1));
	    for (var key in obj) {
	      if (!_.contains(keys, key)) copy[key] = obj[key];
	    }
	    return copy;
	  };

	  // Fill in a given object with default properties.
	  _.defaults = function(obj) {
	    each(slice.call(arguments, 1), function(source) {
	      if (source) {
	        for (var prop in source) {
	          if (obj[prop] === void 0) obj[prop] = source[prop];
	        }
	      }
	    });
	    return obj;
	  };

	  // Create a (shallow-cloned) duplicate of an object.
	  _.clone = function(obj) {
	    if (!_.isObject(obj)) return obj;
	    return _.isArray(obj) ? obj.slice() : _.extend({}, obj);
	  };

	  // Invokes interceptor with the obj, and then returns obj.
	  // The primary purpose of this method is to "tap into" a method chain, in
	  // order to perform operations on intermediate results within the chain.
	  _.tap = function(obj, interceptor) {
	    interceptor(obj);
	    return obj;
	  };

	  // Internal recursive comparison function for `isEqual`.
	  var eq = function(a, b, aStack, bStack) {
	    // Identical objects are equal. `0 === -0`, but they aren't identical.
	    // See the [Harmony `egal` proposal](http://wiki.ecmascript.org/doku.php?id=harmony:egal).
	    if (a === b) return a !== 0 || 1 / a == 1 / b;
	    // A strict comparison is necessary because `null == undefined`.
	    if (a == null || b == null) return a === b;
	    // Unwrap any wrapped objects.
	    if (a instanceof _) a = a._wrapped;
	    if (b instanceof _) b = b._wrapped;
	    // Compare `[[Class]]` names.
	    var className = toString.call(a);
	    if (className != toString.call(b)) return false;
	    switch (className) {
	      // Strings, numbers, dates, and booleans are compared by value.
	      case '[object String]':
	        // Primitives and their corresponding object wrappers are equivalent; thus, `"5"` is
	        // equivalent to `new String("5")`.
	        return a == String(b);
	      case '[object Number]':
	        // `NaN`s are equivalent, but non-reflexive. An `egal` comparison is performed for
	        // other numeric values.
	        return a != +a ? b != +b : (a == 0 ? 1 / a == 1 / b : a == +b);
	      case '[object Date]':
	      case '[object Boolean]':
	        // Coerce dates and booleans to numeric primitive values. Dates are compared by their
	        // millisecond representations. Note that invalid dates with millisecond representations
	        // of `NaN` are not equivalent.
	        return +a == +b;
	      // RegExps are compared by their source patterns and flags.
	      case '[object RegExp]':
	        return a.source == b.source &&
	               a.global == b.global &&
	               a.multiline == b.multiline &&
	               a.ignoreCase == b.ignoreCase;
	    }
	    if (typeof a != 'object' || typeof b != 'object') return false;
	    // Assume equality for cyclic structures. The algorithm for detecting cyclic
	    // structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.
	    var length = aStack.length;
	    while (length--) {
	      // Linear search. Performance is inversely proportional to the number of
	      // unique nested structures.
	      if (aStack[length] == a) return bStack[length] == b;
	    }
	    // Objects with different constructors are not equivalent, but `Object`s
	    // from different frames are.
	    var aCtor = a.constructor, bCtor = b.constructor;
	    if (aCtor !== bCtor && !(_.isFunction(aCtor) && (aCtor instanceof aCtor) &&
	                             _.isFunction(bCtor) && (bCtor instanceof bCtor))
	                        && ('constructor' in a && 'constructor' in b)) {
	      return false;
	    }
	    // Add the first object to the stack of traversed objects.
	    aStack.push(a);
	    bStack.push(b);
	    var size = 0, result = true;
	    // Recursively compare objects and arrays.
	    if (className == '[object Array]') {
	      // Compare array lengths to determine if a deep comparison is necessary.
	      size = a.length;
	      result = size == b.length;
	      if (result) {
	        // Deep compare the contents, ignoring non-numeric properties.
	        while (size--) {
	          if (!(result = eq(a[size], b[size], aStack, bStack))) break;
	        }
	      }
	    } else {
	      // Deep compare objects.
	      for (var key in a) {
	        if (_.has(a, key)) {
	          // Count the expected number of properties.
	          size++;
	          // Deep compare each member.
	          if (!(result = _.has(b, key) && eq(a[key], b[key], aStack, bStack))) break;
	        }
	      }
	      // Ensure that both objects contain the same number of properties.
	      if (result) {
	        for (key in b) {
	          if (_.has(b, key) && !(size--)) break;
	        }
	        result = !size;
	      }
	    }
	    // Remove the first object from the stack of traversed objects.
	    aStack.pop();
	    bStack.pop();
	    return result;
	  };

	  // Perform a deep comparison to check if two objects are equal.
	  _.isEqual = function(a, b) {
	    return eq(a, b, [], []);
	  };

	  // Is a given array, string, or object empty?
	  // An "empty" object has no enumerable own-properties.
	  _.isEmpty = function(obj) {
	    if (obj == null) return true;
	    if (_.isArray(obj) || _.isString(obj)) return obj.length === 0;
	    for (var key in obj) if (_.has(obj, key)) return false;
	    return true;
	  };

	  // Is a given value a DOM element?
	  _.isElement = function(obj) {
	    return !!(obj && obj.nodeType === 1);
	  };

	  // Is a given value an array?
	  // Delegates to ECMA5's native Array.isArray
	  _.isArray = nativeIsArray || function(obj) {
	    return toString.call(obj) == '[object Array]';
	  };

	  // Is a given variable an object?
	  _.isObject = function(obj) {
	    return obj === Object(obj);
	  };

	  // Add some isType methods: isArguments, isFunction, isString, isNumber, isDate, isRegExp.
	  each(['Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp'], function(name) {
	    _['is' + name] = function(obj) {
	      return toString.call(obj) == '[object ' + name + ']';
	    };
	  });

	  // Define a fallback version of the method in browsers (ahem, IE), where
	  // there isn't any inspectable "Arguments" type.
	  if (!_.isArguments(arguments)) {
	    _.isArguments = function(obj) {
	      return !!(obj && _.has(obj, 'callee'));
	    };
	  }

	  // Optimize `isFunction` if appropriate.
	  if (true) {
	    _.isFunction = function(obj) {
	      return typeof obj === 'function';
	    };
	  }

	  // Is a given object a finite number?
	  _.isFinite = function(obj) {
	    return isFinite(obj) && !isNaN(parseFloat(obj));
	  };

	  // Is the given value `NaN`? (NaN is the only number which does not equal itself).
	  _.isNaN = function(obj) {
	    return _.isNumber(obj) && obj != +obj;
	  };

	  // Is a given value a boolean?
	  _.isBoolean = function(obj) {
	    return obj === true || obj === false || toString.call(obj) == '[object Boolean]';
	  };

	  // Is a given value equal to null?
	  _.isNull = function(obj) {
	    return obj === null;
	  };

	  // Is a given variable undefined?
	  _.isUndefined = function(obj) {
	    return obj === void 0;
	  };

	  // Shortcut function for checking if an object has a given property directly
	  // on itself (in other words, not on a prototype).
	  _.has = function(obj, key) {
	    return hasOwnProperty.call(obj, key);
	  };

	  // Utility Functions
	  // -----------------

	  // Run Underscore.js in *noConflict* mode, returning the `_` variable to its
	  // previous owner. Returns a reference to the Underscore object.
	  _.noConflict = function() {
	    root._ = previousUnderscore;
	    return this;
	  };

	  // Keep the identity function around for default iterators.
	  _.identity = function(value) {
	    return value;
	  };

	  _.constant = function(value) {
	    return function () {
	      return value;
	    };
	  };

	  _.property = function(key) {
	    return function(obj) {
	      return obj[key];
	    };
	  };

	  // Returns a predicate for checking whether an object has a given set of `key:value` pairs.
	  _.matches = function(attrs) {
	    return function(obj) {
	      if (obj === attrs) return true; //avoid comparing an object to itself.
	      for (var key in attrs) {
	        if (attrs[key] !== obj[key])
	          return false;
	      }
	      return true;
	    }
	  };

	  // Run a function **n** times.
	  _.times = function(n, iterator, context) {
	    var accum = Array(Math.max(0, n));
	    for (var i = 0; i < n; i++) accum[i] = iterator.call(context, i);
	    return accum;
	  };

	  // Return a random integer between min and max (inclusive).
	  _.random = function(min, max) {
	    if (max == null) {
	      max = min;
	      min = 0;
	    }
	    return min + Math.floor(Math.random() * (max - min + 1));
	  };

	  // A (possibly faster) way to get the current timestamp as an integer.
	  _.now = Date.now || function() { return new Date().getTime(); };

	  // List of HTML entities for escaping.
	  var entityMap = {
	    escape: {
	      '&': '&amp;',
	      '<': '&lt;',
	      '>': '&gt;',
	      '"': '&quot;',
	      "'": '&#x27;'
	    }
	  };
	  entityMap.unescape = _.invert(entityMap.escape);

	  // Regexes containing the keys and values listed immediately above.
	  var entityRegexes = {
	    escape:   new RegExp('[' + _.keys(entityMap.escape).join('') + ']', 'g'),
	    unescape: new RegExp('(' + _.keys(entityMap.unescape).join('|') + ')', 'g')
	  };

	  // Functions for escaping and unescaping strings to/from HTML interpolation.
	  _.each(['escape', 'unescape'], function(method) {
	    _[method] = function(string) {
	      if (string == null) return '';
	      return ('' + string).replace(entityRegexes[method], function(match) {
	        return entityMap[method][match];
	      });
	    };
	  });

	  // If the value of the named `property` is a function then invoke it with the
	  // `object` as context; otherwise, return it.
	  _.result = function(object, property) {
	    if (object == null) return void 0;
	    var value = object[property];
	    return _.isFunction(value) ? value.call(object) : value;
	  };

	  // Add your own custom functions to the Underscore object.
	  _.mixin = function(obj) {
	    each(_.functions(obj), function(name) {
	      var func = _[name] = obj[name];
	      _.prototype[name] = function() {
	        var args = [this._wrapped];
	        push.apply(args, arguments);
	        return result.call(this, func.apply(_, args));
	      };
	    });
	  };

	  // Generate a unique integer id (unique within the entire client session).
	  // Useful for temporary DOM ids.
	  var idCounter = 0;
	  _.uniqueId = function(prefix) {
	    var id = ++idCounter + '';
	    return prefix ? prefix + id : id;
	  };

	  // By default, Underscore uses ERB-style template delimiters, change the
	  // following template settings to use alternative delimiters.
	  _.templateSettings = {
	    evaluate    : /<%([\s\S]+?)%>/g,
	    interpolate : /<%=([\s\S]+?)%>/g,
	    escape      : /<%-([\s\S]+?)%>/g
	  };

	  // When customizing `templateSettings`, if you don't want to define an
	  // interpolation, evaluation or escaping regex, we need one that is
	  // guaranteed not to match.
	  var noMatch = /(.)^/;

	  // Certain characters need to be escaped so that they can be put into a
	  // string literal.
	  var escapes = {
	    "'":      "'",
	    '\\':     '\\',
	    '\r':     'r',
	    '\n':     'n',
	    '\t':     't',
	    '\u2028': 'u2028',
	    '\u2029': 'u2029'
	  };

	  var escaper = /\\|'|\r|\n|\t|\u2028|\u2029/g;

	  // JavaScript micro-templating, similar to John Resig's implementation.
	  // Underscore templating handles arbitrary delimiters, preserves whitespace,
	  // and correctly escapes quotes within interpolated code.
	  _.template = function(text, data, settings) {
	    var render;
	    settings = _.defaults({}, settings, _.templateSettings);

	    // Combine delimiters into one regular expression via alternation.
	    var matcher = new RegExp([
	      (settings.escape || noMatch).source,
	      (settings.interpolate || noMatch).source,
	      (settings.evaluate || noMatch).source
	    ].join('|') + '|$', 'g');

	    // Compile the template source, escaping string literals appropriately.
	    var index = 0;
	    var source = "__p+='";
	    text.replace(matcher, function(match, escape, interpolate, evaluate, offset) {
	      source += text.slice(index, offset)
	        .replace(escaper, function(match) { return '\\' + escapes[match]; });

	      if (escape) {
	        source += "'+\n((__t=(" + escape + "))==null?'':_.escape(__t))+\n'";
	      }
	      if (interpolate) {
	        source += "'+\n((__t=(" + interpolate + "))==null?'':__t)+\n'";
	      }
	      if (evaluate) {
	        source += "';\n" + evaluate + "\n__p+='";
	      }
	      index = offset + match.length;
	      return match;
	    });
	    source += "';\n";

	    // If a variable is not specified, place data values in local scope.
	    if (!settings.variable) source = 'with(obj||{}){\n' + source + '}\n';

	    source = "var __t,__p='',__j=Array.prototype.join," +
	      "print=function(){__p+=__j.call(arguments,'');};\n" +
	      source + "return __p;\n";

	    try {
	      render = new Function(settings.variable || 'obj', '_', source);
	    } catch (e) {
	      e.source = source;
	      throw e;
	    }

	    if (data) return render(data, _);
	    var template = function(data) {
	      return render.call(this, data, _);
	    };

	    // Provide the compiled function source as a convenience for precompilation.
	    template.source = 'function(' + (settings.variable || 'obj') + '){\n' + source + '}';

	    return template;
	  };

	  // Add a "chain" function, which will delegate to the wrapper.
	  _.chain = function(obj) {
	    return _(obj).chain();
	  };

	  // OOP
	  // ---------------
	  // If Underscore is called as a function, it returns a wrapped object that
	  // can be used OO-style. This wrapper holds altered versions of all the
	  // underscore functions. Wrapped objects may be chained.

	  // Helper function to continue chaining intermediate results.
	  var result = function(obj) {
	    return this._chain ? _(obj).chain() : obj;
	  };

	  // Add all of the Underscore functions to the wrapper object.
	  _.mixin(_);

	  // Add all mutator Array functions to the wrapper.
	  each(['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'], function(name) {
	    var method = ArrayProto[name];
	    _.prototype[name] = function() {
	      var obj = this._wrapped;
	      method.apply(obj, arguments);
	      if ((name == 'shift' || name == 'splice') && obj.length === 0) delete obj[0];
	      return result.call(this, obj);
	    };
	  });

	  // Add all accessor Array functions to the wrapper.
	  each(['concat', 'join', 'slice'], function(name) {
	    var method = ArrayProto[name];
	    _.prototype[name] = function() {
	      return result.call(this, method.apply(this._wrapped, arguments));
	    };
	  });

	  _.extend(_.prototype, {

	    // Start chaining a wrapped Underscore object.
	    chain: function() {
	      this._chain = true;
	      return this;
	    },

	    // Extracts the result from a wrapped and chained object.
	    value: function() {
	      return this._wrapped;
	    }

	  });

	  // AMD registration happens at the end for compatibility with AMD loaders
	  // that may not enforce next-turn semantics on modules. Even though general
	  // practice for AMD registration is to be anonymous, underscore registers
	  // as a named module because, like jQuery, it is a base library that is
	  // popular enough to be bundled in a third party lib, but not be part of
	  // an AMD load request. Those cases could generate an error when an
	  // anonymous define() is called outside of a loader request.
	  if (true) {
	    !(__WEBPACK_AMD_DEFINE_ARRAY__ = [], __WEBPACK_AMD_DEFINE_RESULT__ = function() {
	      return _;
	    }.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
	  }
	}).call(this);


/***/ },
/* 34 */
/***/ function(module, exports, __webpack_require__) {

	//     Underscore.js 1.5.2
	//     http://underscorejs.org
	//     (c) 2009-2013 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
	//     Underscore may be freely distributed under the MIT license.

	(function() {

	  // Baseline setup
	  // --------------

	  // Establish the root object, `window` in the browser, or `exports` on the server.
	  var root = this;

	  // Save the previous value of the `_` variable.
	  var previousUnderscore = root._;

	  // Establish the object that gets returned to break out of a loop iteration.
	  var breaker = {};

	  // Save bytes in the minified (but not gzipped) version:
	  var ArrayProto = Array.prototype, ObjProto = Object.prototype, FuncProto = Function.prototype;

	  // Create quick reference variables for speed access to core prototypes.
	  var
	    push             = ArrayProto.push,
	    slice            = ArrayProto.slice,
	    concat           = ArrayProto.concat,
	    toString         = ObjProto.toString,
	    hasOwnProperty   = ObjProto.hasOwnProperty;

	  // All **ECMAScript 5** native function implementations that we hope to use
	  // are declared here.
	  var
	    nativeForEach      = ArrayProto.forEach,
	    nativeMap          = ArrayProto.map,
	    nativeReduce       = ArrayProto.reduce,
	    nativeReduceRight  = ArrayProto.reduceRight,
	    nativeFilter       = ArrayProto.filter,
	    nativeEvery        = ArrayProto.every,
	    nativeSome         = ArrayProto.some,
	    nativeIndexOf      = ArrayProto.indexOf,
	    nativeLastIndexOf  = ArrayProto.lastIndexOf,
	    nativeIsArray      = Array.isArray,
	    nativeKeys         = Object.keys,
	    nativeBind         = FuncProto.bind;

	  // Create a safe reference to the Underscore object for use below.
	  var _ = function(obj) {
	    if (obj instanceof _) return obj;
	    if (!(this instanceof _)) return new _(obj);
	    this._wrapped = obj;
	  };

	  // Export the Underscore object for **Node.js**, with
	  // backwards-compatibility for the old `require()` API. If we're in
	  // the browser, add `_` as a global object via a string identifier,
	  // for Closure Compiler "advanced" mode.
	  if (true) {
	    if (typeof module !== 'undefined' && module.exports) {
	      exports = module.exports = _;
	    }
	    exports._ = _;
	  } else {
	    root._ = _;
	  }

	  // Current version.
	  _.VERSION = '1.5.2';

	  // Collection Functions
	  // --------------------

	  // The cornerstone, an `each` implementation, aka `forEach`.
	  // Handles objects with the built-in `forEach`, arrays, and raw objects.
	  // Delegates to **ECMAScript 5**'s native `forEach` if available.
	  var each = _.each = _.forEach = function(obj, iterator, context) {
	    if (obj == null) return;
	    if (nativeForEach && obj.forEach === nativeForEach) {
	      obj.forEach(iterator, context);
	    } else if (obj.length === +obj.length) {
	      for (var i = 0, length = obj.length; i < length; i++) {
	        if (iterator.call(context, obj[i], i, obj) === breaker) return;
	      }
	    } else {
	      var keys = _.keys(obj);
	      for (var i = 0, length = keys.length; i < length; i++) {
	        if (iterator.call(context, obj[keys[i]], keys[i], obj) === breaker) return;
	      }
	    }
	  };

	  // Return the results of applying the iterator to each element.
	  // Delegates to **ECMAScript 5**'s native `map` if available.
	  _.map = _.collect = function(obj, iterator, context) {
	    var results = [];
	    if (obj == null) return results;
	    if (nativeMap && obj.map === nativeMap) return obj.map(iterator, context);
	    each(obj, function(value, index, list) {
	      results.push(iterator.call(context, value, index, list));
	    });
	    return results;
	  };

	  var reduceError = 'Reduce of empty array with no initial value';

	  // **Reduce** builds up a single result from a list of values, aka `inject`,
	  // or `foldl`. Delegates to **ECMAScript 5**'s native `reduce` if available.
	  _.reduce = _.foldl = _.inject = function(obj, iterator, memo, context) {
	    var initial = arguments.length > 2;
	    if (obj == null) obj = [];
	    if (nativeReduce && obj.reduce === nativeReduce) {
	      if (context) iterator = _.bind(iterator, context);
	      return initial ? obj.reduce(iterator, memo) : obj.reduce(iterator);
	    }
	    each(obj, function(value, index, list) {
	      if (!initial) {
	        memo = value;
	        initial = true;
	      } else {
	        memo = iterator.call(context, memo, value, index, list);
	      }
	    });
	    if (!initial) throw new TypeError(reduceError);
	    return memo;
	  };

	  // The right-associative version of reduce, also known as `foldr`.
	  // Delegates to **ECMAScript 5**'s native `reduceRight` if available.
	  _.reduceRight = _.foldr = function(obj, iterator, memo, context) {
	    var initial = arguments.length > 2;
	    if (obj == null) obj = [];
	    if (nativeReduceRight && obj.reduceRight === nativeReduceRight) {
	      if (context) iterator = _.bind(iterator, context);
	      return initial ? obj.reduceRight(iterator, memo) : obj.reduceRight(iterator);
	    }
	    var length = obj.length;
	    if (length !== +length) {
	      var keys = _.keys(obj);
	      length = keys.length;
	    }
	    each(obj, function(value, index, list) {
	      index = keys ? keys[--length] : --length;
	      if (!initial) {
	        memo = obj[index];
	        initial = true;
	      } else {
	        memo = iterator.call(context, memo, obj[index], index, list);
	      }
	    });
	    if (!initial) throw new TypeError(reduceError);
	    return memo;
	  };

	  // Return the first value which passes a truth test. Aliased as `detect`.
	  _.find = _.detect = function(obj, iterator, context) {
	    var result;
	    any(obj, function(value, index, list) {
	      if (iterator.call(context, value, index, list)) {
	        result = value;
	        return true;
	      }
	    });
	    return result;
	  };

	  // Return all the elements that pass a truth test.
	  // Delegates to **ECMAScript 5**'s native `filter` if available.
	  // Aliased as `select`.
	  _.filter = _.select = function(obj, iterator, context) {
	    var results = [];
	    if (obj == null) return results;
	    if (nativeFilter && obj.filter === nativeFilter) return obj.filter(iterator, context);
	    each(obj, function(value, index, list) {
	      if (iterator.call(context, value, index, list)) results.push(value);
	    });
	    return results;
	  };

	  // Return all the elements for which a truth test fails.
	  _.reject = function(obj, iterator, context) {
	    return _.filter(obj, function(value, index, list) {
	      return !iterator.call(context, value, index, list);
	    }, context);
	  };

	  // Determine whether all of the elements match a truth test.
	  // Delegates to **ECMAScript 5**'s native `every` if available.
	  // Aliased as `all`.
	  _.every = _.all = function(obj, iterator, context) {
	    iterator || (iterator = _.identity);
	    var result = true;
	    if (obj == null) return result;
	    if (nativeEvery && obj.every === nativeEvery) return obj.every(iterator, context);
	    each(obj, function(value, index, list) {
	      if (!(result = result && iterator.call(context, value, index, list))) return breaker;
	    });
	    return !!result;
	  };

	  // Determine if at least one element in the object matches a truth test.
	  // Delegates to **ECMAScript 5**'s native `some` if available.
	  // Aliased as `any`.
	  var any = _.some = _.any = function(obj, iterator, context) {
	    iterator || (iterator = _.identity);
	    var result = false;
	    if (obj == null) return result;
	    if (nativeSome && obj.some === nativeSome) return obj.some(iterator, context);
	    each(obj, function(value, index, list) {
	      if (result || (result = iterator.call(context, value, index, list))) return breaker;
	    });
	    return !!result;
	  };

	  // Determine if the array or object contains a given value (using `===`).
	  // Aliased as `include`.
	  _.contains = _.include = function(obj, target) {
	    if (obj == null) return false;
	    if (nativeIndexOf && obj.indexOf === nativeIndexOf) return obj.indexOf(target) != -1;
	    return any(obj, function(value) {
	      return value === target;
	    });
	  };

	  // Invoke a method (with arguments) on every item in a collection.
	  _.invoke = function(obj, method) {
	    var args = slice.call(arguments, 2);
	    var isFunc = _.isFunction(method);
	    return _.map(obj, function(value) {
	      return (isFunc ? method : value[method]).apply(value, args);
	    });
	  };

	  // Convenience version of a common use case of `map`: fetching a property.
	  _.pluck = function(obj, key) {
	    return _.map(obj, function(value){ return value[key]; });
	  };

	  // Convenience version of a common use case of `filter`: selecting only objects
	  // containing specific `key:value` pairs.
	  _.where = function(obj, attrs, first) {
	    if (_.isEmpty(attrs)) return first ? void 0 : [];
	    return _[first ? 'find' : 'filter'](obj, function(value) {
	      for (var key in attrs) {
	        if (attrs[key] !== value[key]) return false;
	      }
	      return true;
	    });
	  };

	  // Convenience version of a common use case of `find`: getting the first object
	  // containing specific `key:value` pairs.
	  _.findWhere = function(obj, attrs) {
	    return _.where(obj, attrs, true);
	  };

	  // Return the maximum element or (element-based computation).
	  // Can't optimize arrays of integers longer than 65,535 elements.
	  // See [WebKit Bug 80797](https://bugs.webkit.org/show_bug.cgi?id=80797)
	  _.max = function(obj, iterator, context) {
	    if (!iterator && _.isArray(obj) && obj[0] === +obj[0] && obj.length < 65535) {
	      return Math.max.apply(Math, obj);
	    }
	    if (!iterator && _.isEmpty(obj)) return -Infinity;
	    var result = {computed : -Infinity, value: -Infinity};
	    each(obj, function(value, index, list) {
	      var computed = iterator ? iterator.call(context, value, index, list) : value;
	      computed > result.computed && (result = {value : value, computed : computed});
	    });
	    return result.value;
	  };

	  // Return the minimum element (or element-based computation).
	  _.min = function(obj, iterator, context) {
	    if (!iterator && _.isArray(obj) && obj[0] === +obj[0] && obj.length < 65535) {
	      return Math.min.apply(Math, obj);
	    }
	    if (!iterator && _.isEmpty(obj)) return Infinity;
	    var result = {computed : Infinity, value: Infinity};
	    each(obj, function(value, index, list) {
	      var computed = iterator ? iterator.call(context, value, index, list) : value;
	      computed < result.computed && (result = {value : value, computed : computed});
	    });
	    return result.value;
	  };

	  // Shuffle an array, using the modern version of the 
	  // [Fisher-Yates shuffle](http://en.wikipedia.org/wiki/Fisher–Yates_shuffle).
	  _.shuffle = function(obj) {
	    var rand;
	    var index = 0;
	    var shuffled = [];
	    each(obj, function(value) {
	      rand = _.random(index++);
	      shuffled[index - 1] = shuffled[rand];
	      shuffled[rand] = value;
	    });
	    return shuffled;
	  };

	  // Sample **n** random values from an array.
	  // If **n** is not specified, returns a single random element from the array.
	  // The internal `guard` argument allows it to work with `map`.
	  _.sample = function(obj, n, guard) {
	    if (arguments.length < 2 || guard) {
	      return obj[_.random(obj.length - 1)];
	    }
	    return _.shuffle(obj).slice(0, Math.max(0, n));
	  };

	  // An internal function to generate lookup iterators.
	  var lookupIterator = function(value) {
	    return _.isFunction(value) ? value : function(obj){ return obj[value]; };
	  };

	  // Sort the object's values by a criterion produced by an iterator.
	  _.sortBy = function(obj, value, context) {
	    var iterator = lookupIterator(value);
	    return _.pluck(_.map(obj, function(value, index, list) {
	      return {
	        value: value,
	        index: index,
	        criteria: iterator.call(context, value, index, list)
	      };
	    }).sort(function(left, right) {
	      var a = left.criteria;
	      var b = right.criteria;
	      if (a !== b) {
	        if (a > b || a === void 0) return 1;
	        if (a < b || b === void 0) return -1;
	      }
	      return left.index - right.index;
	    }), 'value');
	  };

	  // An internal function used for aggregate "group by" operations.
	  var group = function(behavior) {
	    return function(obj, value, context) {
	      var result = {};
	      var iterator = value == null ? _.identity : lookupIterator(value);
	      each(obj, function(value, index) {
	        var key = iterator.call(context, value, index, obj);
	        behavior(result, key, value);
	      });
	      return result;
	    };
	  };

	  // Groups the object's values by a criterion. Pass either a string attribute
	  // to group by, or a function that returns the criterion.
	  _.groupBy = group(function(result, key, value) {
	    (_.has(result, key) ? result[key] : (result[key] = [])).push(value);
	  });

	  // Indexes the object's values by a criterion, similar to `groupBy`, but for
	  // when you know that your index values will be unique.
	  _.indexBy = group(function(result, key, value) {
	    result[key] = value;
	  });

	  // Counts instances of an object that group by a certain criterion. Pass
	  // either a string attribute to count by, or a function that returns the
	  // criterion.
	  _.countBy = group(function(result, key) {
	    _.has(result, key) ? result[key]++ : result[key] = 1;
	  });

	  // Use a comparator function to figure out the smallest index at which
	  // an object should be inserted so as to maintain order. Uses binary search.
	  _.sortedIndex = function(array, obj, iterator, context) {
	    iterator = iterator == null ? _.identity : lookupIterator(iterator);
	    var value = iterator.call(context, obj);
	    var low = 0, high = array.length;
	    while (low < high) {
	      var mid = (low + high) >>> 1;
	      iterator.call(context, array[mid]) < value ? low = mid + 1 : high = mid;
	    }
	    return low;
	  };

	  // Safely create a real, live array from anything iterable.
	  _.toArray = function(obj) {
	    if (!obj) return [];
	    if (_.isArray(obj)) return slice.call(obj);
	    if (obj.length === +obj.length) return _.map(obj, _.identity);
	    return _.values(obj);
	  };

	  // Return the number of elements in an object.
	  _.size = function(obj) {
	    if (obj == null) return 0;
	    return (obj.length === +obj.length) ? obj.length : _.keys(obj).length;
	  };

	  // Array Functions
	  // ---------------

	  // Get the first element of an array. Passing **n** will return the first N
	  // values in the array. Aliased as `head` and `take`. The **guard** check
	  // allows it to work with `_.map`.
	  _.first = _.head = _.take = function(array, n, guard) {
	    if (array == null) return void 0;
	    return (n == null) || guard ? array[0] : slice.call(array, 0, n);
	  };

	  // Returns everything but the last entry of the array. Especially useful on
	  // the arguments object. Passing **n** will return all the values in
	  // the array, excluding the last N. The **guard** check allows it to work with
	  // `_.map`.
	  _.initial = function(array, n, guard) {
	    return slice.call(array, 0, array.length - ((n == null) || guard ? 1 : n));
	  };

	  // Get the last element of an array. Passing **n** will return the last N
	  // values in the array. The **guard** check allows it to work with `_.map`.
	  _.last = function(array, n, guard) {
	    if (array == null) return void 0;
	    if ((n == null) || guard) {
	      return array[array.length - 1];
	    } else {
	      return slice.call(array, Math.max(array.length - n, 0));
	    }
	  };

	  // Returns everything but the first entry of the array. Aliased as `tail` and `drop`.
	  // Especially useful on the arguments object. Passing an **n** will return
	  // the rest N values in the array. The **guard**
	  // check allows it to work with `_.map`.
	  _.rest = _.tail = _.drop = function(array, n, guard) {
	    return slice.call(array, (n == null) || guard ? 1 : n);
	  };

	  // Trim out all falsy values from an array.
	  _.compact = function(array) {
	    return _.filter(array, _.identity);
	  };

	  // Internal implementation of a recursive `flatten` function.
	  var flatten = function(input, shallow, output) {
	    if (shallow && _.every(input, _.isArray)) {
	      return concat.apply(output, input);
	    }
	    each(input, function(value) {
	      if (_.isArray(value) || _.isArguments(value)) {
	        shallow ? push.apply(output, value) : flatten(value, shallow, output);
	      } else {
	        output.push(value);
	      }
	    });
	    return output;
	  };

	  // Flatten out an array, either recursively (by default), or just one level.
	  _.flatten = function(array, shallow) {
	    return flatten(array, shallow, []);
	  };

	  // Return a version of the array that does not contain the specified value(s).
	  _.without = function(array) {
	    return _.difference(array, slice.call(arguments, 1));
	  };

	  // Produce a duplicate-free version of the array. If the array has already
	  // been sorted, you have the option of using a faster algorithm.
	  // Aliased as `unique`.
	  _.uniq = _.unique = function(array, isSorted, iterator, context) {
	    if (_.isFunction(isSorted)) {
	      context = iterator;
	      iterator = isSorted;
	      isSorted = false;
	    }
	    var initial = iterator ? _.map(array, iterator, context) : array;
	    var results = [];
	    var seen = [];
	    each(initial, function(value, index) {
	      if (isSorted ? (!index || seen[seen.length - 1] !== value) : !_.contains(seen, value)) {
	        seen.push(value);
	        results.push(array[index]);
	      }
	    });
	    return results;
	  };

	  // Produce an array that contains the union: each distinct element from all of
	  // the passed-in arrays.
	  _.union = function() {
	    return _.uniq(_.flatten(arguments, true));
	  };

	  // Produce an array that contains every item shared between all the
	  // passed-in arrays.
	  _.intersection = function(array) {
	    var rest = slice.call(arguments, 1);
	    return _.filter(_.uniq(array), function(item) {
	      return _.every(rest, function(other) {
	        return _.indexOf(other, item) >= 0;
	      });
	    });
	  };

	  // Take the difference between one array and a number of other arrays.
	  // Only the elements present in just the first array will remain.
	  _.difference = function(array) {
	    var rest = concat.apply(ArrayProto, slice.call(arguments, 1));
	    return _.filter(array, function(value){ return !_.contains(rest, value); });
	  };

	  // Zip together multiple lists into a single array -- elements that share
	  // an index go together.
	  _.zip = function() {
	    var length = _.max(_.pluck(arguments, "length").concat(0));
	    var results = new Array(length);
	    for (var i = 0; i < length; i++) {
	      results[i] = _.pluck(arguments, '' + i);
	    }
	    return results;
	  };

	  // Converts lists into objects. Pass either a single array of `[key, value]`
	  // pairs, or two parallel arrays of the same length -- one of keys, and one of
	  // the corresponding values.
	  _.object = function(list, values) {
	    if (list == null) return {};
	    var result = {};
	    for (var i = 0, length = list.length; i < length; i++) {
	      if (values) {
	        result[list[i]] = values[i];
	      } else {
	        result[list[i][0]] = list[i][1];
	      }
	    }
	    return result;
	  };

	  // If the browser doesn't supply us with indexOf (I'm looking at you, **MSIE**),
	  // we need this function. Return the position of the first occurrence of an
	  // item in an array, or -1 if the item is not included in the array.
	  // Delegates to **ECMAScript 5**'s native `indexOf` if available.
	  // If the array is large and already in sort order, pass `true`
	  // for **isSorted** to use binary search.
	  _.indexOf = function(array, item, isSorted) {
	    if (array == null) return -1;
	    var i = 0, length = array.length;
	    if (isSorted) {
	      if (typeof isSorted == 'number') {
	        i = (isSorted < 0 ? Math.max(0, length + isSorted) : isSorted);
	      } else {
	        i = _.sortedIndex(array, item);
	        return array[i] === item ? i : -1;
	      }
	    }
	    if (nativeIndexOf && array.indexOf === nativeIndexOf) return array.indexOf(item, isSorted);
	    for (; i < length; i++) if (array[i] === item) return i;
	    return -1;
	  };

	  // Delegates to **ECMAScript 5**'s native `lastIndexOf` if available.
	  _.lastIndexOf = function(array, item, from) {
	    if (array == null) return -1;
	    var hasIndex = from != null;
	    if (nativeLastIndexOf && array.lastIndexOf === nativeLastIndexOf) {
	      return hasIndex ? array.lastIndexOf(item, from) : array.lastIndexOf(item);
	    }
	    var i = (hasIndex ? from : array.length);
	    while (i--) if (array[i] === item) return i;
	    return -1;
	  };

	  // Generate an integer Array containing an arithmetic progression. A port of
	  // the native Python `range()` function. See
	  // [the Python documentation](http://docs.python.org/library/functions.html#range).
	  _.range = function(start, stop, step) {
	    if (arguments.length <= 1) {
	      stop = start || 0;
	      start = 0;
	    }
	    step = arguments[2] || 1;

	    var length = Math.max(Math.ceil((stop - start) / step), 0);
	    var idx = 0;
	    var range = new Array(length);

	    while(idx < length) {
	      range[idx++] = start;
	      start += step;
	    }

	    return range;
	  };

	  // Function (ahem) Functions
	  // ------------------

	  // Reusable constructor function for prototype setting.
	  var ctor = function(){};

	  // Create a function bound to a given object (assigning `this`, and arguments,
	  // optionally). Delegates to **ECMAScript 5**'s native `Function.bind` if
	  // available.
	  _.bind = function(func, context) {
	    var args, bound;
	    if (nativeBind && func.bind === nativeBind) return nativeBind.apply(func, slice.call(arguments, 1));
	    if (!_.isFunction(func)) throw new TypeError;
	    args = slice.call(arguments, 2);
	    return bound = function() {
	      if (!(this instanceof bound)) return func.apply(context, args.concat(slice.call(arguments)));
	      ctor.prototype = func.prototype;
	      var self = new ctor;
	      ctor.prototype = null;
	      var result = func.apply(self, args.concat(slice.call(arguments)));
	      if (Object(result) === result) return result;
	      return self;
	    };
	  };

	  // Partially apply a function by creating a version that has had some of its
	  // arguments pre-filled, without changing its dynamic `this` context.
	  _.partial = function(func) {
	    var args = slice.call(arguments, 1);
	    return function() {
	      return func.apply(this, args.concat(slice.call(arguments)));
	    };
	  };

	  // Bind all of an object's methods to that object. Useful for ensuring that
	  // all callbacks defined on an object belong to it.
	  _.bindAll = function(obj) {
	    var funcs = slice.call(arguments, 1);
	    if (funcs.length === 0) throw new Error("bindAll must be passed function names");
	    each(funcs, function(f) { obj[f] = _.bind(obj[f], obj); });
	    return obj;
	  };

	  // Memoize an expensive function by storing its results.
	  _.memoize = function(func, hasher) {
	    var memo = {};
	    hasher || (hasher = _.identity);
	    return function() {
	      var key = hasher.apply(this, arguments);
	      return _.has(memo, key) ? memo[key] : (memo[key] = func.apply(this, arguments));
	    };
	  };

	  // Delays a function for the given number of milliseconds, and then calls
	  // it with the arguments supplied.
	  _.delay = function(func, wait) {
	    var args = slice.call(arguments, 2);
	    return setTimeout(function(){ return func.apply(null, args); }, wait);
	  };

	  // Defers a function, scheduling it to run after the current call stack has
	  // cleared.
	  _.defer = function(func) {
	    return _.delay.apply(_, [func, 1].concat(slice.call(arguments, 1)));
	  };

	  // Returns a function, that, when invoked, will only be triggered at most once
	  // during a given window of time. Normally, the throttled function will run
	  // as much as it can, without ever going more than once per `wait` duration;
	  // but if you'd like to disable the execution on the leading edge, pass
	  // `{leading: false}`. To disable execution on the trailing edge, ditto.
	  _.throttle = function(func, wait, options) {
	    var context, args, result;
	    var timeout = null;
	    var previous = 0;
	    options || (options = {});
	    var later = function() {
	      previous = options.leading === false ? 0 : new Date;
	      timeout = null;
	      result = func.apply(context, args);
	    };
	    return function() {
	      var now = new Date;
	      if (!previous && options.leading === false) previous = now;
	      var remaining = wait - (now - previous);
	      context = this;
	      args = arguments;
	      if (remaining <= 0) {
	        clearTimeout(timeout);
	        timeout = null;
	        previous = now;
	        result = func.apply(context, args);
	      } else if (!timeout && options.trailing !== false) {
	        timeout = setTimeout(later, remaining);
	      }
	      return result;
	    };
	  };

	  // Returns a function, that, as long as it continues to be invoked, will not
	  // be triggered. The function will be called after it stops being called for
	  // N milliseconds. If `immediate` is passed, trigger the function on the
	  // leading edge, instead of the trailing.
	  _.debounce = function(func, wait, immediate) {
	    var timeout, args, context, timestamp, result;
	    return function() {
	      context = this;
	      args = arguments;
	      timestamp = new Date();
	      var later = function() {
	        var last = (new Date()) - timestamp;
	        if (last < wait) {
	          timeout = setTimeout(later, wait - last);
	        } else {
	          timeout = null;
	          if (!immediate) result = func.apply(context, args);
	        }
	      };
	      var callNow = immediate && !timeout;
	      if (!timeout) {
	        timeout = setTimeout(later, wait);
	      }
	      if (callNow) result = func.apply(context, args);
	      return result;
	    };
	  };

	  // Returns a function that will be executed at most one time, no matter how
	  // often you call it. Useful for lazy initialization.
	  _.once = function(func) {
	    var ran = false, memo;
	    return function() {
	      if (ran) return memo;
	      ran = true;
	      memo = func.apply(this, arguments);
	      func = null;
	      return memo;
	    };
	  };

	  // Returns the first function passed as an argument to the second,
	  // allowing you to adjust arguments, run code before and after, and
	  // conditionally execute the original function.
	  _.wrap = function(func, wrapper) {
	    return function() {
	      var args = [func];
	      push.apply(args, arguments);
	      return wrapper.apply(this, args);
	    };
	  };

	  // Returns a function that is the composition of a list of functions, each
	  // consuming the return value of the function that follows.
	  _.compose = function() {
	    var funcs = arguments;
	    return function() {
	      var args = arguments;
	      for (var i = funcs.length - 1; i >= 0; i--) {
	        args = [funcs[i].apply(this, args)];
	      }
	      return args[0];
	    };
	  };

	  // Returns a function that will only be executed after being called N times.
	  _.after = function(times, func) {
	    return function() {
	      if (--times < 1) {
	        return func.apply(this, arguments);
	      }
	    };
	  };

	  // Object Functions
	  // ----------------

	  // Retrieve the names of an object's properties.
	  // Delegates to **ECMAScript 5**'s native `Object.keys`
	  _.keys = nativeKeys || function(obj) {
	    if (obj !== Object(obj)) throw new TypeError('Invalid object');
	    var keys = [];
	    for (var key in obj) if (_.has(obj, key)) keys.push(key);
	    return keys;
	  };

	  // Retrieve the values of an object's properties.
	  _.values = function(obj) {
	    var keys = _.keys(obj);
	    var length = keys.length;
	    var values = new Array(length);
	    for (var i = 0; i < length; i++) {
	      values[i] = obj[keys[i]];
	    }
	    return values;
	  };

	  // Convert an object into a list of `[key, value]` pairs.
	  _.pairs = function(obj) {
	    var keys = _.keys(obj);
	    var length = keys.length;
	    var pairs = new Array(length);
	    for (var i = 0; i < length; i++) {
	      pairs[i] = [keys[i], obj[keys[i]]];
	    }
	    return pairs;
	  };

	  // Invert the keys and values of an object. The values must be serializable.
	  _.invert = function(obj) {
	    var result = {};
	    var keys = _.keys(obj);
	    for (var i = 0, length = keys.length; i < length; i++) {
	      result[obj[keys[i]]] = keys[i];
	    }
	    return result;
	  };

	  // Return a sorted list of the function names available on the object.
	  // Aliased as `methods`
	  _.functions = _.methods = function(obj) {
	    var names = [];
	    for (var key in obj) {
	      if (_.isFunction(obj[key])) names.push(key);
	    }
	    return names.sort();
	  };

	  // Extend a given object with all the properties in passed-in object(s).
	  _.extend = function(obj) {
	    each(slice.call(arguments, 1), function(source) {
	      if (source) {
	        for (var prop in source) {
	          obj[prop] = source[prop];
	        }
	      }
	    });
	    return obj;
	  };

	  // Return a copy of the object only containing the whitelisted properties.
	  _.pick = function(obj) {
	    var copy = {};
	    var keys = concat.apply(ArrayProto, slice.call(arguments, 1));
	    each(keys, function(key) {
	      if (key in obj) copy[key] = obj[key];
	    });
	    return copy;
	  };

	   // Return a copy of the object without the blacklisted properties.
	  _.omit = function(obj) {
	    var copy = {};
	    var keys = concat.apply(ArrayProto, slice.call(arguments, 1));
	    for (var key in obj) {
	      if (!_.contains(keys, key)) copy[key] = obj[key];
	    }
	    return copy;
	  };

	  // Fill in a given object with default properties.
	  _.defaults = function(obj) {
	    each(slice.call(arguments, 1), function(source) {
	      if (source) {
	        for (var prop in source) {
	          if (obj[prop] === void 0) obj[prop] = source[prop];
	        }
	      }
	    });
	    return obj;
	  };

	  // Create a (shallow-cloned) duplicate of an object.
	  _.clone = function(obj) {
	    if (!_.isObject(obj)) return obj;
	    return _.isArray(obj) ? obj.slice() : _.extend({}, obj);
	  };

	  // Invokes interceptor with the obj, and then returns obj.
	  // The primary purpose of this method is to "tap into" a method chain, in
	  // order to perform operations on intermediate results within the chain.
	  _.tap = function(obj, interceptor) {
	    interceptor(obj);
	    return obj;
	  };

	  // Internal recursive comparison function for `isEqual`.
	  var eq = function(a, b, aStack, bStack) {
	    // Identical objects are equal. `0 === -0`, but they aren't identical.
	    // See the [Harmony `egal` proposal](http://wiki.ecmascript.org/doku.php?id=harmony:egal).
	    if (a === b) return a !== 0 || 1 / a == 1 / b;
	    // A strict comparison is necessary because `null == undefined`.
	    if (a == null || b == null) return a === b;
	    // Unwrap any wrapped objects.
	    if (a instanceof _) a = a._wrapped;
	    if (b instanceof _) b = b._wrapped;
	    // Compare `[[Class]]` names.
	    var className = toString.call(a);
	    if (className != toString.call(b)) return false;
	    switch (className) {
	      // Strings, numbers, dates, and booleans are compared by value.
	      case '[object String]':
	        // Primitives and their corresponding object wrappers are equivalent; thus, `"5"` is
	        // equivalent to `new String("5")`.
	        return a == String(b);
	      case '[object Number]':
	        // `NaN`s are equivalent, but non-reflexive. An `egal` comparison is performed for
	        // other numeric values.
	        return a != +a ? b != +b : (a == 0 ? 1 / a == 1 / b : a == +b);
	      case '[object Date]':
	      case '[object Boolean]':
	        // Coerce dates and booleans to numeric primitive values. Dates are compared by their
	        // millisecond representations. Note that invalid dates with millisecond representations
	        // of `NaN` are not equivalent.
	        return +a == +b;
	      // RegExps are compared by their source patterns and flags.
	      case '[object RegExp]':
	        return a.source == b.source &&
	               a.global == b.global &&
	               a.multiline == b.multiline &&
	               a.ignoreCase == b.ignoreCase;
	    }
	    if (typeof a != 'object' || typeof b != 'object') return false;
	    // Assume equality for cyclic structures. The algorithm for detecting cyclic
	    // structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.
	    var length = aStack.length;
	    while (length--) {
	      // Linear search. Performance is inversely proportional to the number of
	      // unique nested structures.
	      if (aStack[length] == a) return bStack[length] == b;
	    }
	    // Objects with different constructors are not equivalent, but `Object`s
	    // from different frames are.
	    var aCtor = a.constructor, bCtor = b.constructor;
	    if (aCtor !== bCtor && !(_.isFunction(aCtor) && (aCtor instanceof aCtor) &&
	                             _.isFunction(bCtor) && (bCtor instanceof bCtor))) {
	      return false;
	    }
	    // Add the first object to the stack of traversed objects.
	    aStack.push(a);
	    bStack.push(b);
	    var size = 0, result = true;
	    // Recursively compare objects and arrays.
	    if (className == '[object Array]') {
	      // Compare array lengths to determine if a deep comparison is necessary.
	      size = a.length;
	      result = size == b.length;
	      if (result) {
	        // Deep compare the contents, ignoring non-numeric properties.
	        while (size--) {
	          if (!(result = eq(a[size], b[size], aStack, bStack))) break;
	        }
	      }
	    } else {
	      // Deep compare objects.
	      for (var key in a) {
	        if (_.has(a, key)) {
	          // Count the expected number of properties.
	          size++;
	          // Deep compare each member.
	          if (!(result = _.has(b, key) && eq(a[key], b[key], aStack, bStack))) break;
	        }
	      }
	      // Ensure that both objects contain the same number of properties.
	      if (result) {
	        for (key in b) {
	          if (_.has(b, key) && !(size--)) break;
	        }
	        result = !size;
	      }
	    }
	    // Remove the first object from the stack of traversed objects.
	    aStack.pop();
	    bStack.pop();
	    return result;
	  };

	  // Perform a deep comparison to check if two objects are equal.
	  _.isEqual = function(a, b) {
	    return eq(a, b, [], []);
	  };

	  // Is a given array, string, or object empty?
	  // An "empty" object has no enumerable own-properties.
	  _.isEmpty = function(obj) {
	    if (obj == null) return true;
	    if (_.isArray(obj) || _.isString(obj)) return obj.length === 0;
	    for (var key in obj) if (_.has(obj, key)) return false;
	    return true;
	  };

	  // Is a given value a DOM element?
	  _.isElement = function(obj) {
	    return !!(obj && obj.nodeType === 1);
	  };

	  // Is a given value an array?
	  // Delegates to ECMA5's native Array.isArray
	  _.isArray = nativeIsArray || function(obj) {
	    return toString.call(obj) == '[object Array]';
	  };

	  // Is a given variable an object?
	  _.isObject = function(obj) {
	    return obj === Object(obj);
	  };

	  // Add some isType methods: isArguments, isFunction, isString, isNumber, isDate, isRegExp.
	  each(['Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp'], function(name) {
	    _['is' + name] = function(obj) {
	      return toString.call(obj) == '[object ' + name + ']';
	    };
	  });

	  // Define a fallback version of the method in browsers (ahem, IE), where
	  // there isn't any inspectable "Arguments" type.
	  if (!_.isArguments(arguments)) {
	    _.isArguments = function(obj) {
	      return !!(obj && _.has(obj, 'callee'));
	    };
	  }

	  // Optimize `isFunction` if appropriate.
	  if (true) {
	    _.isFunction = function(obj) {
	      return typeof obj === 'function';
	    };
	  }

	  // Is a given object a finite number?
	  _.isFinite = function(obj) {
	    return isFinite(obj) && !isNaN(parseFloat(obj));
	  };

	  // Is the given value `NaN`? (NaN is the only number which does not equal itself).
	  _.isNaN = function(obj) {
	    return _.isNumber(obj) && obj != +obj;
	  };

	  // Is a given value a boolean?
	  _.isBoolean = function(obj) {
	    return obj === true || obj === false || toString.call(obj) == '[object Boolean]';
	  };

	  // Is a given value equal to null?
	  _.isNull = function(obj) {
	    return obj === null;
	  };

	  // Is a given variable undefined?
	  _.isUndefined = function(obj) {
	    return obj === void 0;
	  };

	  // Shortcut function for checking if an object has a given property directly
	  // on itself (in other words, not on a prototype).
	  _.has = function(obj, key) {
	    return hasOwnProperty.call(obj, key);
	  };

	  // Utility Functions
	  // -----------------

	  // Run Underscore.js in *noConflict* mode, returning the `_` variable to its
	  // previous owner. Returns a reference to the Underscore object.
	  _.noConflict = function() {
	    root._ = previousUnderscore;
	    return this;
	  };

	  // Keep the identity function around for default iterators.
	  _.identity = function(value) {
	    return value;
	  };

	  // Run a function **n** times.
	  _.times = function(n, iterator, context) {
	    var accum = Array(Math.max(0, n));
	    for (var i = 0; i < n; i++) accum[i] = iterator.call(context, i);
	    return accum;
	  };

	  // Return a random integer between min and max (inclusive).
	  _.random = function(min, max) {
	    if (max == null) {
	      max = min;
	      min = 0;
	    }
	    return min + Math.floor(Math.random() * (max - min + 1));
	  };

	  // List of HTML entities for escaping.
	  var entityMap = {
	    escape: {
	      '&': '&amp;',
	      '<': '&lt;',
	      '>': '&gt;',
	      '"': '&quot;',
	      "'": '&#x27;'
	    }
	  };
	  entityMap.unescape = _.invert(entityMap.escape);

	  // Regexes containing the keys and values listed immediately above.
	  var entityRegexes = {
	    escape:   new RegExp('[' + _.keys(entityMap.escape).join('') + ']', 'g'),
	    unescape: new RegExp('(' + _.keys(entityMap.unescape).join('|') + ')', 'g')
	  };

	  // Functions for escaping and unescaping strings to/from HTML interpolation.
	  _.each(['escape', 'unescape'], function(method) {
	    _[method] = function(string) {
	      if (string == null) return '';
	      return ('' + string).replace(entityRegexes[method], function(match) {
	        return entityMap[method][match];
	      });
	    };
	  });

	  // If the value of the named `property` is a function then invoke it with the
	  // `object` as context; otherwise, return it.
	  _.result = function(object, property) {
	    if (object == null) return void 0;
	    var value = object[property];
	    return _.isFunction(value) ? value.call(object) : value;
	  };

	  // Add your own custom functions to the Underscore object.
	  _.mixin = function(obj) {
	    each(_.functions(obj), function(name) {
	      var func = _[name] = obj[name];
	      _.prototype[name] = function() {
	        var args = [this._wrapped];
	        push.apply(args, arguments);
	        return result.call(this, func.apply(_, args));
	      };
	    });
	  };

	  // Generate a unique integer id (unique within the entire client session).
	  // Useful for temporary DOM ids.
	  var idCounter = 0;
	  _.uniqueId = function(prefix) {
	    var id = ++idCounter + '';
	    return prefix ? prefix + id : id;
	  };

	  // By default, Underscore uses ERB-style template delimiters, change the
	  // following template settings to use alternative delimiters.
	  _.templateSettings = {
	    evaluate    : /<%([\s\S]+?)%>/g,
	    interpolate : /<%=([\s\S]+?)%>/g,
	    escape      : /<%-([\s\S]+?)%>/g
	  };

	  // When customizing `templateSettings`, if you don't want to define an
	  // interpolation, evaluation or escaping regex, we need one that is
	  // guaranteed not to match.
	  var noMatch = /(.)^/;

	  // Certain characters need to be escaped so that they can be put into a
	  // string literal.
	  var escapes = {
	    "'":      "'",
	    '\\':     '\\',
	    '\r':     'r',
	    '\n':     'n',
	    '\t':     't',
	    '\u2028': 'u2028',
	    '\u2029': 'u2029'
	  };

	  var escaper = /\\|'|\r|\n|\t|\u2028|\u2029/g;

	  // JavaScript micro-templating, similar to John Resig's implementation.
	  // Underscore templating handles arbitrary delimiters, preserves whitespace,
	  // and correctly escapes quotes within interpolated code.
	  _.template = function(text, data, settings) {
	    var render;
	    settings = _.defaults({}, settings, _.templateSettings);

	    // Combine delimiters into one regular expression via alternation.
	    var matcher = new RegExp([
	      (settings.escape || noMatch).source,
	      (settings.interpolate || noMatch).source,
	      (settings.evaluate || noMatch).source
	    ].join('|') + '|$', 'g');

	    // Compile the template source, escaping string literals appropriately.
	    var index = 0;
	    var source = "__p+='";
	    text.replace(matcher, function(match, escape, interpolate, evaluate, offset) {
	      source += text.slice(index, offset)
	        .replace(escaper, function(match) { return '\\' + escapes[match]; });

	      if (escape) {
	        source += "'+\n((__t=(" + escape + "))==null?'':_.escape(__t))+\n'";
	      }
	      if (interpolate) {
	        source += "'+\n((__t=(" + interpolate + "))==null?'':__t)+\n'";
	      }
	      if (evaluate) {
	        source += "';\n" + evaluate + "\n__p+='";
	      }
	      index = offset + match.length;
	      return match;
	    });
	    source += "';\n";

	    // If a variable is not specified, place data values in local scope.
	    if (!settings.variable) source = 'with(obj||{}){\n' + source + '}\n';

	    source = "var __t,__p='',__j=Array.prototype.join," +
	      "print=function(){__p+=__j.call(arguments,'');};\n" +
	      source + "return __p;\n";

	    try {
	      render = new Function(settings.variable || 'obj', '_', source);
	    } catch (e) {
	      e.source = source;
	      throw e;
	    }

	    if (data) return render(data, _);
	    var template = function(data) {
	      return render.call(this, data, _);
	    };

	    // Provide the compiled function source as a convenience for precompilation.
	    template.source = 'function(' + (settings.variable || 'obj') + '){\n' + source + '}';

	    return template;
	  };

	  // Add a "chain" function, which will delegate to the wrapper.
	  _.chain = function(obj) {
	    return _(obj).chain();
	  };

	  // OOP
	  // ---------------
	  // If Underscore is called as a function, it returns a wrapped object that
	  // can be used OO-style. This wrapper holds altered versions of all the
	  // underscore functions. Wrapped objects may be chained.

	  // Helper function to continue chaining intermediate results.
	  var result = function(obj) {
	    return this._chain ? _(obj).chain() : obj;
	  };

	  // Add all of the Underscore functions to the wrapper object.
	  _.mixin(_);

	  // Add all mutator Array functions to the wrapper.
	  each(['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'], function(name) {
	    var method = ArrayProto[name];
	    _.prototype[name] = function() {
	      var obj = this._wrapped;
	      method.apply(obj, arguments);
	      if ((name == 'shift' || name == 'splice') && obj.length === 0) delete obj[0];
	      return result.call(this, obj);
	    };
	  });

	  // Add all accessor Array functions to the wrapper.
	  each(['concat', 'join', 'slice'], function(name) {
	    var method = ArrayProto[name];
	    _.prototype[name] = function() {
	      return result.call(this, method.apply(this._wrapped, arguments));
	    };
	  });

	  _.extend(_.prototype, {

	    // Start chaining a wrapped Underscore object.
	    chain: function() {
	      this._chain = true;
	      return this;
	    },

	    // Extracts the result from a wrapped and chained object.
	    value: function() {
	      return this._wrapped;
	    }

	  });

	}).call(this);


/***/ },
/* 35 */
/***/ function(module, exports, __webpack_require__) {

	(function() {
	  var ExcludedClassProperties, ExcludedPrototypeProperties, Mixin, name;

	  module.exports = Mixin = (function() {
	    Mixin.includeInto = function(constructor) {
	      var name, value, _ref;
	      this.extend(constructor.prototype);
	      for (name in this) {
	        value = this[name];
	        if (ExcludedClassProperties.indexOf(name) === -1) {
	          if (!constructor.hasOwnProperty(name)) {
	            constructor[name] = value;
	          }
	        }
	      }
	      return (_ref = this.included) != null ? _ref.call(constructor) : void 0;
	    };

	    Mixin.extend = function(object) {
	      var name, _i, _len, _ref, _ref1;
	      _ref = Object.getOwnPropertyNames(this.prototype);
	      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
	        name = _ref[_i];
	        if (ExcludedPrototypeProperties.indexOf(name) === -1) {
	          if (!object.hasOwnProperty(name)) {
	            object[name] = this.prototype[name];
	          }
	        }
	      }
	      return (_ref1 = this.prototype.extended) != null ? _ref1.call(object) : void 0;
	    };

	    function Mixin() {
	      if (typeof this.extended === "function") {
	        this.extended();
	      }
	    }

	    return Mixin;

	  })();

	  ExcludedClassProperties = ['__super__'];

	  for (name in Mixin) {
	    ExcludedClassProperties.push(name);
	  }

	  ExcludedPrototypeProperties = ['constructor', 'extended'];

	}).call(this);


/***/ },
/* 36 */
/***/ function(module, exports, __webpack_require__) {

	(function() {
	  var ExcludedClassProperties, ExcludedPrototypeProperties, Mixin, name;

	  module.exports = Mixin = (function() {
	    Mixin.includeInto = function(constructor) {
	      var name, value, _ref;
	      this.extend(constructor.prototype);
	      for (name in this) {
	        value = this[name];
	        if (ExcludedClassProperties.indexOf(name) === -1) {
	          if (!constructor.hasOwnProperty(name)) {
	            constructor[name] = value;
	          }
	        }
	      }
	      return (_ref = this.included) != null ? _ref.call(constructor) : void 0;
	    };

	    Mixin.extend = function(object) {
	      var name, _i, _len, _ref, _ref1;
	      _ref = Object.getOwnPropertyNames(this.prototype);
	      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
	        name = _ref[_i];
	        if (ExcludedPrototypeProperties.indexOf(name) === -1) {
	          if (!object.hasOwnProperty(name)) {
	            object[name] = this.prototype[name];
	          }
	        }
	      }
	      return (_ref1 = this.prototype.extended) != null ? _ref1.call(object) : void 0;
	    };

	    function Mixin() {
	      if (typeof this.extended === "function") {
	        this.extended();
	      }
	    }

	    return Mixin;

	  })();

	  ExcludedClassProperties = ['__super__'];

	  for (name in Mixin) {
	    ExcludedClassProperties.push(name);
	  }

	  ExcludedPrototypeProperties = ['constructor', 'extended'];

	}).call(this);


/***/ },
/* 37 */
/***/ function(module, exports, __webpack_require__) {

	(function() {
	  var CoffeeScript, SourceMapConsumer, convertLine, convertStackTrace, fs, path;

	  fs = __webpack_require__(!(function webpackMissingModule() { var e = new Error("Cannot find module \"fs\""); e.code = 'MODULE_NOT_FOUND'; throw e; }()));

	  path = __webpack_require__(42);

	  CoffeeScript = __webpack_require__(44);

	  SourceMapConsumer = __webpack_require__(43).SourceMapConsumer;

	  convertLine = function(filePath, line, column, sourceMaps) {
	    var code, position, source, sourceMap, sourceMapContents, sourceMapPath, v3SourceMap;
	    if (sourceMaps == null) {
	      sourceMaps = {};
	    }
	    try {
	      if (!(sourceMapContents = sourceMaps[filePath])) {
	        if (path.extname(filePath) === '.js') {
	          sourceMapPath = "" + filePath + ".map";
	          sourceMapContents = fs.readFileSync(sourceMapPath, 'utf8');
	        } else {
	          code = fs.readFileSync(filePath, 'utf8');
	          v3SourceMap = CoffeeScript.compile(code, {
	            sourceMap: true,
	            filename: filePath
	          }).v3SourceMap;
	          sourceMapContents = v3SourceMap;
	        }
	      }
	      if (sourceMapContents) {
	        sourceMaps[filePath] = sourceMapContents;
	        sourceMap = new SourceMapConsumer(sourceMapContents);
	        position = sourceMap.originalPositionFor({
	          line: line,
	          column: column
	        });
	        if ((position.line != null) && (position.column != null)) {
	          if (position.source) {
	            source = path.resolve(filePath, '..', position.source);
	          } else {
	            source = filePath;
	          }
	          return {
	            line: position.line,
	            column: position.column,
	            source: source
	          };
	        }
	      }
	    } catch (_error) {}
	    return null;
	  };

	  convertStackTrace = function(stackTrace, sourceMaps) {
	    var atLinePattern, column, convertedLines, filePath, line, mappedLine, match, stackTraceLine, _i, _len, _ref;
	    if (sourceMaps == null) {
	      sourceMaps = {};
	    }
	    if (!stackTrace) {
	      return stackTrace;
	    }
	    convertedLines = [];
	    atLinePattern = /^(\s+at .* )\((.*):(\d+):(\d+)\)/;
	    _ref = stackTrace.split('\n');
	    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
	      stackTraceLine = _ref[_i];
	      if (match = atLinePattern.exec(stackTraceLine)) {
	        filePath = match[2];
	        line = match[3];
	        column = match[4];
	        if (path.extname(filePath) === '.js') {
	          mappedLine = convertLine(filePath, line, column, sourceMaps);
	        }
	        if (mappedLine != null) {
	          convertedLines.push("" + match[1] + "(" + mappedLine.source + ":" + mappedLine.line + ":" + mappedLine.column + ")");
	        } else {
	          convertedLines.push(stackTraceLine);
	        }
	      } else {
	        convertedLines.push(stackTraceLine);
	      }
	    }
	    return convertedLines.join('\n');
	  };

	  module.exports = {
	    convertLine: convertLine,
	    convertStackTrace: convertStackTrace
	  };

	}).call(this);


/***/ },
/* 38 */
/***/ function(module, exports, __webpack_require__) {

	//     Underscore.js 1.5.2
	//     http://underscorejs.org
	//     (c) 2009-2013 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
	//     Underscore may be freely distributed under the MIT license.

	(function() {

	  // Baseline setup
	  // --------------

	  // Establish the root object, `window` in the browser, or `exports` on the server.
	  var root = this;

	  // Save the previous value of the `_` variable.
	  var previousUnderscore = root._;

	  // Establish the object that gets returned to break out of a loop iteration.
	  var breaker = {};

	  // Save bytes in the minified (but not gzipped) version:
	  var ArrayProto = Array.prototype, ObjProto = Object.prototype, FuncProto = Function.prototype;

	  // Create quick reference variables for speed access to core prototypes.
	  var
	    push             = ArrayProto.push,
	    slice            = ArrayProto.slice,
	    concat           = ArrayProto.concat,
	    toString         = ObjProto.toString,
	    hasOwnProperty   = ObjProto.hasOwnProperty;

	  // All **ECMAScript 5** native function implementations that we hope to use
	  // are declared here.
	  var
	    nativeForEach      = ArrayProto.forEach,
	    nativeMap          = ArrayProto.map,
	    nativeReduce       = ArrayProto.reduce,
	    nativeReduceRight  = ArrayProto.reduceRight,
	    nativeFilter       = ArrayProto.filter,
	    nativeEvery        = ArrayProto.every,
	    nativeSome         = ArrayProto.some,
	    nativeIndexOf      = ArrayProto.indexOf,
	    nativeLastIndexOf  = ArrayProto.lastIndexOf,
	    nativeIsArray      = Array.isArray,
	    nativeKeys         = Object.keys,
	    nativeBind         = FuncProto.bind;

	  // Create a safe reference to the Underscore object for use below.
	  var _ = function(obj) {
	    if (obj instanceof _) return obj;
	    if (!(this instanceof _)) return new _(obj);
	    this._wrapped = obj;
	  };

	  // Export the Underscore object for **Node.js**, with
	  // backwards-compatibility for the old `require()` API. If we're in
	  // the browser, add `_` as a global object via a string identifier,
	  // for Closure Compiler "advanced" mode.
	  if (true) {
	    if (typeof module !== 'undefined' && module.exports) {
	      exports = module.exports = _;
	    }
	    exports._ = _;
	  } else {
	    root._ = _;
	  }

	  // Current version.
	  _.VERSION = '1.5.2';

	  // Collection Functions
	  // --------------------

	  // The cornerstone, an `each` implementation, aka `forEach`.
	  // Handles objects with the built-in `forEach`, arrays, and raw objects.
	  // Delegates to **ECMAScript 5**'s native `forEach` if available.
	  var each = _.each = _.forEach = function(obj, iterator, context) {
	    if (obj == null) return;
	    if (nativeForEach && obj.forEach === nativeForEach) {
	      obj.forEach(iterator, context);
	    } else if (obj.length === +obj.length) {
	      for (var i = 0, length = obj.length; i < length; i++) {
	        if (iterator.call(context, obj[i], i, obj) === breaker) return;
	      }
	    } else {
	      var keys = _.keys(obj);
	      for (var i = 0, length = keys.length; i < length; i++) {
	        if (iterator.call(context, obj[keys[i]], keys[i], obj) === breaker) return;
	      }
	    }
	  };

	  // Return the results of applying the iterator to each element.
	  // Delegates to **ECMAScript 5**'s native `map` if available.
	  _.map = _.collect = function(obj, iterator, context) {
	    var results = [];
	    if (obj == null) return results;
	    if (nativeMap && obj.map === nativeMap) return obj.map(iterator, context);
	    each(obj, function(value, index, list) {
	      results.push(iterator.call(context, value, index, list));
	    });
	    return results;
	  };

	  var reduceError = 'Reduce of empty array with no initial value';

	  // **Reduce** builds up a single result from a list of values, aka `inject`,
	  // or `foldl`. Delegates to **ECMAScript 5**'s native `reduce` if available.
	  _.reduce = _.foldl = _.inject = function(obj, iterator, memo, context) {
	    var initial = arguments.length > 2;
	    if (obj == null) obj = [];
	    if (nativeReduce && obj.reduce === nativeReduce) {
	      if (context) iterator = _.bind(iterator, context);
	      return initial ? obj.reduce(iterator, memo) : obj.reduce(iterator);
	    }
	    each(obj, function(value, index, list) {
	      if (!initial) {
	        memo = value;
	        initial = true;
	      } else {
	        memo = iterator.call(context, memo, value, index, list);
	      }
	    });
	    if (!initial) throw new TypeError(reduceError);
	    return memo;
	  };

	  // The right-associative version of reduce, also known as `foldr`.
	  // Delegates to **ECMAScript 5**'s native `reduceRight` if available.
	  _.reduceRight = _.foldr = function(obj, iterator, memo, context) {
	    var initial = arguments.length > 2;
	    if (obj == null) obj = [];
	    if (nativeReduceRight && obj.reduceRight === nativeReduceRight) {
	      if (context) iterator = _.bind(iterator, context);
	      return initial ? obj.reduceRight(iterator, memo) : obj.reduceRight(iterator);
	    }
	    var length = obj.length;
	    if (length !== +length) {
	      var keys = _.keys(obj);
	      length = keys.length;
	    }
	    each(obj, function(value, index, list) {
	      index = keys ? keys[--length] : --length;
	      if (!initial) {
	        memo = obj[index];
	        initial = true;
	      } else {
	        memo = iterator.call(context, memo, obj[index], index, list);
	      }
	    });
	    if (!initial) throw new TypeError(reduceError);
	    return memo;
	  };

	  // Return the first value which passes a truth test. Aliased as `detect`.
	  _.find = _.detect = function(obj, iterator, context) {
	    var result;
	    any(obj, function(value, index, list) {
	      if (iterator.call(context, value, index, list)) {
	        result = value;
	        return true;
	      }
	    });
	    return result;
	  };

	  // Return all the elements that pass a truth test.
	  // Delegates to **ECMAScript 5**'s native `filter` if available.
	  // Aliased as `select`.
	  _.filter = _.select = function(obj, iterator, context) {
	    var results = [];
	    if (obj == null) return results;
	    if (nativeFilter && obj.filter === nativeFilter) return obj.filter(iterator, context);
	    each(obj, function(value, index, list) {
	      if (iterator.call(context, value, index, list)) results.push(value);
	    });
	    return results;
	  };

	  // Return all the elements for which a truth test fails.
	  _.reject = function(obj, iterator, context) {
	    return _.filter(obj, function(value, index, list) {
	      return !iterator.call(context, value, index, list);
	    }, context);
	  };

	  // Determine whether all of the elements match a truth test.
	  // Delegates to **ECMAScript 5**'s native `every` if available.
	  // Aliased as `all`.
	  _.every = _.all = function(obj, iterator, context) {
	    iterator || (iterator = _.identity);
	    var result = true;
	    if (obj == null) return result;
	    if (nativeEvery && obj.every === nativeEvery) return obj.every(iterator, context);
	    each(obj, function(value, index, list) {
	      if (!(result = result && iterator.call(context, value, index, list))) return breaker;
	    });
	    return !!result;
	  };

	  // Determine if at least one element in the object matches a truth test.
	  // Delegates to **ECMAScript 5**'s native `some` if available.
	  // Aliased as `any`.
	  var any = _.some = _.any = function(obj, iterator, context) {
	    iterator || (iterator = _.identity);
	    var result = false;
	    if (obj == null) return result;
	    if (nativeSome && obj.some === nativeSome) return obj.some(iterator, context);
	    each(obj, function(value, index, list) {
	      if (result || (result = iterator.call(context, value, index, list))) return breaker;
	    });
	    return !!result;
	  };

	  // Determine if the array or object contains a given value (using `===`).
	  // Aliased as `include`.
	  _.contains = _.include = function(obj, target) {
	    if (obj == null) return false;
	    if (nativeIndexOf && obj.indexOf === nativeIndexOf) return obj.indexOf(target) != -1;
	    return any(obj, function(value) {
	      return value === target;
	    });
	  };

	  // Invoke a method (with arguments) on every item in a collection.
	  _.invoke = function(obj, method) {
	    var args = slice.call(arguments, 2);
	    var isFunc = _.isFunction(method);
	    return _.map(obj, function(value) {
	      return (isFunc ? method : value[method]).apply(value, args);
	    });
	  };

	  // Convenience version of a common use case of `map`: fetching a property.
	  _.pluck = function(obj, key) {
	    return _.map(obj, function(value){ return value[key]; });
	  };

	  // Convenience version of a common use case of `filter`: selecting only objects
	  // containing specific `key:value` pairs.
	  _.where = function(obj, attrs, first) {
	    if (_.isEmpty(attrs)) return first ? void 0 : [];
	    return _[first ? 'find' : 'filter'](obj, function(value) {
	      for (var key in attrs) {
	        if (attrs[key] !== value[key]) return false;
	      }
	      return true;
	    });
	  };

	  // Convenience version of a common use case of `find`: getting the first object
	  // containing specific `key:value` pairs.
	  _.findWhere = function(obj, attrs) {
	    return _.where(obj, attrs, true);
	  };

	  // Return the maximum element or (element-based computation).
	  // Can't optimize arrays of integers longer than 65,535 elements.
	  // See [WebKit Bug 80797](https://bugs.webkit.org/show_bug.cgi?id=80797)
	  _.max = function(obj, iterator, context) {
	    if (!iterator && _.isArray(obj) && obj[0] === +obj[0] && obj.length < 65535) {
	      return Math.max.apply(Math, obj);
	    }
	    if (!iterator && _.isEmpty(obj)) return -Infinity;
	    var result = {computed : -Infinity, value: -Infinity};
	    each(obj, function(value, index, list) {
	      var computed = iterator ? iterator.call(context, value, index, list) : value;
	      computed > result.computed && (result = {value : value, computed : computed});
	    });
	    return result.value;
	  };

	  // Return the minimum element (or element-based computation).
	  _.min = function(obj, iterator, context) {
	    if (!iterator && _.isArray(obj) && obj[0] === +obj[0] && obj.length < 65535) {
	      return Math.min.apply(Math, obj);
	    }
	    if (!iterator && _.isEmpty(obj)) return Infinity;
	    var result = {computed : Infinity, value: Infinity};
	    each(obj, function(value, index, list) {
	      var computed = iterator ? iterator.call(context, value, index, list) : value;
	      computed < result.computed && (result = {value : value, computed : computed});
	    });
	    return result.value;
	  };

	  // Shuffle an array, using the modern version of the 
	  // [Fisher-Yates shuffle](http://en.wikipedia.org/wiki/Fisher–Yates_shuffle).
	  _.shuffle = function(obj) {
	    var rand;
	    var index = 0;
	    var shuffled = [];
	    each(obj, function(value) {
	      rand = _.random(index++);
	      shuffled[index - 1] = shuffled[rand];
	      shuffled[rand] = value;
	    });
	    return shuffled;
	  };

	  // Sample **n** random values from an array.
	  // If **n** is not specified, returns a single random element from the array.
	  // The internal `guard` argument allows it to work with `map`.
	  _.sample = function(obj, n, guard) {
	    if (arguments.length < 2 || guard) {
	      return obj[_.random(obj.length - 1)];
	    }
	    return _.shuffle(obj).slice(0, Math.max(0, n));
	  };

	  // An internal function to generate lookup iterators.
	  var lookupIterator = function(value) {
	    return _.isFunction(value) ? value : function(obj){ return obj[value]; };
	  };

	  // Sort the object's values by a criterion produced by an iterator.
	  _.sortBy = function(obj, value, context) {
	    var iterator = lookupIterator(value);
	    return _.pluck(_.map(obj, function(value, index, list) {
	      return {
	        value: value,
	        index: index,
	        criteria: iterator.call(context, value, index, list)
	      };
	    }).sort(function(left, right) {
	      var a = left.criteria;
	      var b = right.criteria;
	      if (a !== b) {
	        if (a > b || a === void 0) return 1;
	        if (a < b || b === void 0) return -1;
	      }
	      return left.index - right.index;
	    }), 'value');
	  };

	  // An internal function used for aggregate "group by" operations.
	  var group = function(behavior) {
	    return function(obj, value, context) {
	      var result = {};
	      var iterator = value == null ? _.identity : lookupIterator(value);
	      each(obj, function(value, index) {
	        var key = iterator.call(context, value, index, obj);
	        behavior(result, key, value);
	      });
	      return result;
	    };
	  };

	  // Groups the object's values by a criterion. Pass either a string attribute
	  // to group by, or a function that returns the criterion.
	  _.groupBy = group(function(result, key, value) {
	    (_.has(result, key) ? result[key] : (result[key] = [])).push(value);
	  });

	  // Indexes the object's values by a criterion, similar to `groupBy`, but for
	  // when you know that your index values will be unique.
	  _.indexBy = group(function(result, key, value) {
	    result[key] = value;
	  });

	  // Counts instances of an object that group by a certain criterion. Pass
	  // either a string attribute to count by, or a function that returns the
	  // criterion.
	  _.countBy = group(function(result, key) {
	    _.has(result, key) ? result[key]++ : result[key] = 1;
	  });

	  // Use a comparator function to figure out the smallest index at which
	  // an object should be inserted so as to maintain order. Uses binary search.
	  _.sortedIndex = function(array, obj, iterator, context) {
	    iterator = iterator == null ? _.identity : lookupIterator(iterator);
	    var value = iterator.call(context, obj);
	    var low = 0, high = array.length;
	    while (low < high) {
	      var mid = (low + high) >>> 1;
	      iterator.call(context, array[mid]) < value ? low = mid + 1 : high = mid;
	    }
	    return low;
	  };

	  // Safely create a real, live array from anything iterable.
	  _.toArray = function(obj) {
	    if (!obj) return [];
	    if (_.isArray(obj)) return slice.call(obj);
	    if (obj.length === +obj.length) return _.map(obj, _.identity);
	    return _.values(obj);
	  };

	  // Return the number of elements in an object.
	  _.size = function(obj) {
	    if (obj == null) return 0;
	    return (obj.length === +obj.length) ? obj.length : _.keys(obj).length;
	  };

	  // Array Functions
	  // ---------------

	  // Get the first element of an array. Passing **n** will return the first N
	  // values in the array. Aliased as `head` and `take`. The **guard** check
	  // allows it to work with `_.map`.
	  _.first = _.head = _.take = function(array, n, guard) {
	    if (array == null) return void 0;
	    return (n == null) || guard ? array[0] : slice.call(array, 0, n);
	  };

	  // Returns everything but the last entry of the array. Especially useful on
	  // the arguments object. Passing **n** will return all the values in
	  // the array, excluding the last N. The **guard** check allows it to work with
	  // `_.map`.
	  _.initial = function(array, n, guard) {
	    return slice.call(array, 0, array.length - ((n == null) || guard ? 1 : n));
	  };

	  // Get the last element of an array. Passing **n** will return the last N
	  // values in the array. The **guard** check allows it to work with `_.map`.
	  _.last = function(array, n, guard) {
	    if (array == null) return void 0;
	    if ((n == null) || guard) {
	      return array[array.length - 1];
	    } else {
	      return slice.call(array, Math.max(array.length - n, 0));
	    }
	  };

	  // Returns everything but the first entry of the array. Aliased as `tail` and `drop`.
	  // Especially useful on the arguments object. Passing an **n** will return
	  // the rest N values in the array. The **guard**
	  // check allows it to work with `_.map`.
	  _.rest = _.tail = _.drop = function(array, n, guard) {
	    return slice.call(array, (n == null) || guard ? 1 : n);
	  };

	  // Trim out all falsy values from an array.
	  _.compact = function(array) {
	    return _.filter(array, _.identity);
	  };

	  // Internal implementation of a recursive `flatten` function.
	  var flatten = function(input, shallow, output) {
	    if (shallow && _.every(input, _.isArray)) {
	      return concat.apply(output, input);
	    }
	    each(input, function(value) {
	      if (_.isArray(value) || _.isArguments(value)) {
	        shallow ? push.apply(output, value) : flatten(value, shallow, output);
	      } else {
	        output.push(value);
	      }
	    });
	    return output;
	  };

	  // Flatten out an array, either recursively (by default), or just one level.
	  _.flatten = function(array, shallow) {
	    return flatten(array, shallow, []);
	  };

	  // Return a version of the array that does not contain the specified value(s).
	  _.without = function(array) {
	    return _.difference(array, slice.call(arguments, 1));
	  };

	  // Produce a duplicate-free version of the array. If the array has already
	  // been sorted, you have the option of using a faster algorithm.
	  // Aliased as `unique`.
	  _.uniq = _.unique = function(array, isSorted, iterator, context) {
	    if (_.isFunction(isSorted)) {
	      context = iterator;
	      iterator = isSorted;
	      isSorted = false;
	    }
	    var initial = iterator ? _.map(array, iterator, context) : array;
	    var results = [];
	    var seen = [];
	    each(initial, function(value, index) {
	      if (isSorted ? (!index || seen[seen.length - 1] !== value) : !_.contains(seen, value)) {
	        seen.push(value);
	        results.push(array[index]);
	      }
	    });
	    return results;
	  };

	  // Produce an array that contains the union: each distinct element from all of
	  // the passed-in arrays.
	  _.union = function() {
	    return _.uniq(_.flatten(arguments, true));
	  };

	  // Produce an array that contains every item shared between all the
	  // passed-in arrays.
	  _.intersection = function(array) {
	    var rest = slice.call(arguments, 1);
	    return _.filter(_.uniq(array), function(item) {
	      return _.every(rest, function(other) {
	        return _.indexOf(other, item) >= 0;
	      });
	    });
	  };

	  // Take the difference between one array and a number of other arrays.
	  // Only the elements present in just the first array will remain.
	  _.difference = function(array) {
	    var rest = concat.apply(ArrayProto, slice.call(arguments, 1));
	    return _.filter(array, function(value){ return !_.contains(rest, value); });
	  };

	  // Zip together multiple lists into a single array -- elements that share
	  // an index go together.
	  _.zip = function() {
	    var length = _.max(_.pluck(arguments, "length").concat(0));
	    var results = new Array(length);
	    for (var i = 0; i < length; i++) {
	      results[i] = _.pluck(arguments, '' + i);
	    }
	    return results;
	  };

	  // Converts lists into objects. Pass either a single array of `[key, value]`
	  // pairs, or two parallel arrays of the same length -- one of keys, and one of
	  // the corresponding values.
	  _.object = function(list, values) {
	    if (list == null) return {};
	    var result = {};
	    for (var i = 0, length = list.length; i < length; i++) {
	      if (values) {
	        result[list[i]] = values[i];
	      } else {
	        result[list[i][0]] = list[i][1];
	      }
	    }
	    return result;
	  };

	  // If the browser doesn't supply us with indexOf (I'm looking at you, **MSIE**),
	  // we need this function. Return the position of the first occurrence of an
	  // item in an array, or -1 if the item is not included in the array.
	  // Delegates to **ECMAScript 5**'s native `indexOf` if available.
	  // If the array is large and already in sort order, pass `true`
	  // for **isSorted** to use binary search.
	  _.indexOf = function(array, item, isSorted) {
	    if (array == null) return -1;
	    var i = 0, length = array.length;
	    if (isSorted) {
	      if (typeof isSorted == 'number') {
	        i = (isSorted < 0 ? Math.max(0, length + isSorted) : isSorted);
	      } else {
	        i = _.sortedIndex(array, item);
	        return array[i] === item ? i : -1;
	      }
	    }
	    if (nativeIndexOf && array.indexOf === nativeIndexOf) return array.indexOf(item, isSorted);
	    for (; i < length; i++) if (array[i] === item) return i;
	    return -1;
	  };

	  // Delegates to **ECMAScript 5**'s native `lastIndexOf` if available.
	  _.lastIndexOf = function(array, item, from) {
	    if (array == null) return -1;
	    var hasIndex = from != null;
	    if (nativeLastIndexOf && array.lastIndexOf === nativeLastIndexOf) {
	      return hasIndex ? array.lastIndexOf(item, from) : array.lastIndexOf(item);
	    }
	    var i = (hasIndex ? from : array.length);
	    while (i--) if (array[i] === item) return i;
	    return -1;
	  };

	  // Generate an integer Array containing an arithmetic progression. A port of
	  // the native Python `range()` function. See
	  // [the Python documentation](http://docs.python.org/library/functions.html#range).
	  _.range = function(start, stop, step) {
	    if (arguments.length <= 1) {
	      stop = start || 0;
	      start = 0;
	    }
	    step = arguments[2] || 1;

	    var length = Math.max(Math.ceil((stop - start) / step), 0);
	    var idx = 0;
	    var range = new Array(length);

	    while(idx < length) {
	      range[idx++] = start;
	      start += step;
	    }

	    return range;
	  };

	  // Function (ahem) Functions
	  // ------------------

	  // Reusable constructor function for prototype setting.
	  var ctor = function(){};

	  // Create a function bound to a given object (assigning `this`, and arguments,
	  // optionally). Delegates to **ECMAScript 5**'s native `Function.bind` if
	  // available.
	  _.bind = function(func, context) {
	    var args, bound;
	    if (nativeBind && func.bind === nativeBind) return nativeBind.apply(func, slice.call(arguments, 1));
	    if (!_.isFunction(func)) throw new TypeError;
	    args = slice.call(arguments, 2);
	    return bound = function() {
	      if (!(this instanceof bound)) return func.apply(context, args.concat(slice.call(arguments)));
	      ctor.prototype = func.prototype;
	      var self = new ctor;
	      ctor.prototype = null;
	      var result = func.apply(self, args.concat(slice.call(arguments)));
	      if (Object(result) === result) return result;
	      return self;
	    };
	  };

	  // Partially apply a function by creating a version that has had some of its
	  // arguments pre-filled, without changing its dynamic `this` context.
	  _.partial = function(func) {
	    var args = slice.call(arguments, 1);
	    return function() {
	      return func.apply(this, args.concat(slice.call(arguments)));
	    };
	  };

	  // Bind all of an object's methods to that object. Useful for ensuring that
	  // all callbacks defined on an object belong to it.
	  _.bindAll = function(obj) {
	    var funcs = slice.call(arguments, 1);
	    if (funcs.length === 0) throw new Error("bindAll must be passed function names");
	    each(funcs, function(f) { obj[f] = _.bind(obj[f], obj); });
	    return obj;
	  };

	  // Memoize an expensive function by storing its results.
	  _.memoize = function(func, hasher) {
	    var memo = {};
	    hasher || (hasher = _.identity);
	    return function() {
	      var key = hasher.apply(this, arguments);
	      return _.has(memo, key) ? memo[key] : (memo[key] = func.apply(this, arguments));
	    };
	  };

	  // Delays a function for the given number of milliseconds, and then calls
	  // it with the arguments supplied.
	  _.delay = function(func, wait) {
	    var args = slice.call(arguments, 2);
	    return setTimeout(function(){ return func.apply(null, args); }, wait);
	  };

	  // Defers a function, scheduling it to run after the current call stack has
	  // cleared.
	  _.defer = function(func) {
	    return _.delay.apply(_, [func, 1].concat(slice.call(arguments, 1)));
	  };

	  // Returns a function, that, when invoked, will only be triggered at most once
	  // during a given window of time. Normally, the throttled function will run
	  // as much as it can, without ever going more than once per `wait` duration;
	  // but if you'd like to disable the execution on the leading edge, pass
	  // `{leading: false}`. To disable execution on the trailing edge, ditto.
	  _.throttle = function(func, wait, options) {
	    var context, args, result;
	    var timeout = null;
	    var previous = 0;
	    options || (options = {});
	    var later = function() {
	      previous = options.leading === false ? 0 : new Date;
	      timeout = null;
	      result = func.apply(context, args);
	    };
	    return function() {
	      var now = new Date;
	      if (!previous && options.leading === false) previous = now;
	      var remaining = wait - (now - previous);
	      context = this;
	      args = arguments;
	      if (remaining <= 0) {
	        clearTimeout(timeout);
	        timeout = null;
	        previous = now;
	        result = func.apply(context, args);
	      } else if (!timeout && options.trailing !== false) {
	        timeout = setTimeout(later, remaining);
	      }
	      return result;
	    };
	  };

	  // Returns a function, that, as long as it continues to be invoked, will not
	  // be triggered. The function will be called after it stops being called for
	  // N milliseconds. If `immediate` is passed, trigger the function on the
	  // leading edge, instead of the trailing.
	  _.debounce = function(func, wait, immediate) {
	    var timeout, args, context, timestamp, result;
	    return function() {
	      context = this;
	      args = arguments;
	      timestamp = new Date();
	      var later = function() {
	        var last = (new Date()) - timestamp;
	        if (last < wait) {
	          timeout = setTimeout(later, wait - last);
	        } else {
	          timeout = null;
	          if (!immediate) result = func.apply(context, args);
	        }
	      };
	      var callNow = immediate && !timeout;
	      if (!timeout) {
	        timeout = setTimeout(later, wait);
	      }
	      if (callNow) result = func.apply(context, args);
	      return result;
	    };
	  };

	  // Returns a function that will be executed at most one time, no matter how
	  // often you call it. Useful for lazy initialization.
	  _.once = function(func) {
	    var ran = false, memo;
	    return function() {
	      if (ran) return memo;
	      ran = true;
	      memo = func.apply(this, arguments);
	      func = null;
	      return memo;
	    };
	  };

	  // Returns the first function passed as an argument to the second,
	  // allowing you to adjust arguments, run code before and after, and
	  // conditionally execute the original function.
	  _.wrap = function(func, wrapper) {
	    return function() {
	      var args = [func];
	      push.apply(args, arguments);
	      return wrapper.apply(this, args);
	    };
	  };

	  // Returns a function that is the composition of a list of functions, each
	  // consuming the return value of the function that follows.
	  _.compose = function() {
	    var funcs = arguments;
	    return function() {
	      var args = arguments;
	      for (var i = funcs.length - 1; i >= 0; i--) {
	        args = [funcs[i].apply(this, args)];
	      }
	      return args[0];
	    };
	  };

	  // Returns a function that will only be executed after being called N times.
	  _.after = function(times, func) {
	    return function() {
	      if (--times < 1) {
	        return func.apply(this, arguments);
	      }
	    };
	  };

	  // Object Functions
	  // ----------------

	  // Retrieve the names of an object's properties.
	  // Delegates to **ECMAScript 5**'s native `Object.keys`
	  _.keys = nativeKeys || function(obj) {
	    if (obj !== Object(obj)) throw new TypeError('Invalid object');
	    var keys = [];
	    for (var key in obj) if (_.has(obj, key)) keys.push(key);
	    return keys;
	  };

	  // Retrieve the values of an object's properties.
	  _.values = function(obj) {
	    var keys = _.keys(obj);
	    var length = keys.length;
	    var values = new Array(length);
	    for (var i = 0; i < length; i++) {
	      values[i] = obj[keys[i]];
	    }
	    return values;
	  };

	  // Convert an object into a list of `[key, value]` pairs.
	  _.pairs = function(obj) {
	    var keys = _.keys(obj);
	    var length = keys.length;
	    var pairs = new Array(length);
	    for (var i = 0; i < length; i++) {
	      pairs[i] = [keys[i], obj[keys[i]]];
	    }
	    return pairs;
	  };

	  // Invert the keys and values of an object. The values must be serializable.
	  _.invert = function(obj) {
	    var result = {};
	    var keys = _.keys(obj);
	    for (var i = 0, length = keys.length; i < length; i++) {
	      result[obj[keys[i]]] = keys[i];
	    }
	    return result;
	  };

	  // Return a sorted list of the function names available on the object.
	  // Aliased as `methods`
	  _.functions = _.methods = function(obj) {
	    var names = [];
	    for (var key in obj) {
	      if (_.isFunction(obj[key])) names.push(key);
	    }
	    return names.sort();
	  };

	  // Extend a given object with all the properties in passed-in object(s).
	  _.extend = function(obj) {
	    each(slice.call(arguments, 1), function(source) {
	      if (source) {
	        for (var prop in source) {
	          obj[prop] = source[prop];
	        }
	      }
	    });
	    return obj;
	  };

	  // Return a copy of the object only containing the whitelisted properties.
	  _.pick = function(obj) {
	    var copy = {};
	    var keys = concat.apply(ArrayProto, slice.call(arguments, 1));
	    each(keys, function(key) {
	      if (key in obj) copy[key] = obj[key];
	    });
	    return copy;
	  };

	   // Return a copy of the object without the blacklisted properties.
	  _.omit = function(obj) {
	    var copy = {};
	    var keys = concat.apply(ArrayProto, slice.call(arguments, 1));
	    for (var key in obj) {
	      if (!_.contains(keys, key)) copy[key] = obj[key];
	    }
	    return copy;
	  };

	  // Fill in a given object with default properties.
	  _.defaults = function(obj) {
	    each(slice.call(arguments, 1), function(source) {
	      if (source) {
	        for (var prop in source) {
	          if (obj[prop] === void 0) obj[prop] = source[prop];
	        }
	      }
	    });
	    return obj;
	  };

	  // Create a (shallow-cloned) duplicate of an object.
	  _.clone = function(obj) {
	    if (!_.isObject(obj)) return obj;
	    return _.isArray(obj) ? obj.slice() : _.extend({}, obj);
	  };

	  // Invokes interceptor with the obj, and then returns obj.
	  // The primary purpose of this method is to "tap into" a method chain, in
	  // order to perform operations on intermediate results within the chain.
	  _.tap = function(obj, interceptor) {
	    interceptor(obj);
	    return obj;
	  };

	  // Internal recursive comparison function for `isEqual`.
	  var eq = function(a, b, aStack, bStack) {
	    // Identical objects are equal. `0 === -0`, but they aren't identical.
	    // See the [Harmony `egal` proposal](http://wiki.ecmascript.org/doku.php?id=harmony:egal).
	    if (a === b) return a !== 0 || 1 / a == 1 / b;
	    // A strict comparison is necessary because `null == undefined`.
	    if (a == null || b == null) return a === b;
	    // Unwrap any wrapped objects.
	    if (a instanceof _) a = a._wrapped;
	    if (b instanceof _) b = b._wrapped;
	    // Compare `[[Class]]` names.
	    var className = toString.call(a);
	    if (className != toString.call(b)) return false;
	    switch (className) {
	      // Strings, numbers, dates, and booleans are compared by value.
	      case '[object String]':
	        // Primitives and their corresponding object wrappers are equivalent; thus, `"5"` is
	        // equivalent to `new String("5")`.
	        return a == String(b);
	      case '[object Number]':
	        // `NaN`s are equivalent, but non-reflexive. An `egal` comparison is performed for
	        // other numeric values.
	        return a != +a ? b != +b : (a == 0 ? 1 / a == 1 / b : a == +b);
	      case '[object Date]':
	      case '[object Boolean]':
	        // Coerce dates and booleans to numeric primitive values. Dates are compared by their
	        // millisecond representations. Note that invalid dates with millisecond representations
	        // of `NaN` are not equivalent.
	        return +a == +b;
	      // RegExps are compared by their source patterns and flags.
	      case '[object RegExp]':
	        return a.source == b.source &&
	               a.global == b.global &&
	               a.multiline == b.multiline &&
	               a.ignoreCase == b.ignoreCase;
	    }
	    if (typeof a != 'object' || typeof b != 'object') return false;
	    // Assume equality for cyclic structures. The algorithm for detecting cyclic
	    // structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.
	    var length = aStack.length;
	    while (length--) {
	      // Linear search. Performance is inversely proportional to the number of
	      // unique nested structures.
	      if (aStack[length] == a) return bStack[length] == b;
	    }
	    // Objects with different constructors are not equivalent, but `Object`s
	    // from different frames are.
	    var aCtor = a.constructor, bCtor = b.constructor;
	    if (aCtor !== bCtor && !(_.isFunction(aCtor) && (aCtor instanceof aCtor) &&
	                             _.isFunction(bCtor) && (bCtor instanceof bCtor))) {
	      return false;
	    }
	    // Add the first object to the stack of traversed objects.
	    aStack.push(a);
	    bStack.push(b);
	    var size = 0, result = true;
	    // Recursively compare objects and arrays.
	    if (className == '[object Array]') {
	      // Compare array lengths to determine if a deep comparison is necessary.
	      size = a.length;
	      result = size == b.length;
	      if (result) {
	        // Deep compare the contents, ignoring non-numeric properties.
	        while (size--) {
	          if (!(result = eq(a[size], b[size], aStack, bStack))) break;
	        }
	      }
	    } else {
	      // Deep compare objects.
	      for (var key in a) {
	        if (_.has(a, key)) {
	          // Count the expected number of properties.
	          size++;
	          // Deep compare each member.
	          if (!(result = _.has(b, key) && eq(a[key], b[key], aStack, bStack))) break;
	        }
	      }
	      // Ensure that both objects contain the same number of properties.
	      if (result) {
	        for (key in b) {
	          if (_.has(b, key) && !(size--)) break;
	        }
	        result = !size;
	      }
	    }
	    // Remove the first object from the stack of traversed objects.
	    aStack.pop();
	    bStack.pop();
	    return result;
	  };

	  // Perform a deep comparison to check if two objects are equal.
	  _.isEqual = function(a, b) {
	    return eq(a, b, [], []);
	  };

	  // Is a given array, string, or object empty?
	  // An "empty" object has no enumerable own-properties.
	  _.isEmpty = function(obj) {
	    if (obj == null) return true;
	    if (_.isArray(obj) || _.isString(obj)) return obj.length === 0;
	    for (var key in obj) if (_.has(obj, key)) return false;
	    return true;
	  };

	  // Is a given value a DOM element?
	  _.isElement = function(obj) {
	    return !!(obj && obj.nodeType === 1);
	  };

	  // Is a given value an array?
	  // Delegates to ECMA5's native Array.isArray
	  _.isArray = nativeIsArray || function(obj) {
	    return toString.call(obj) == '[object Array]';
	  };

	  // Is a given variable an object?
	  _.isObject = function(obj) {
	    return obj === Object(obj);
	  };

	  // Add some isType methods: isArguments, isFunction, isString, isNumber, isDate, isRegExp.
	  each(['Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp'], function(name) {
	    _['is' + name] = function(obj) {
	      return toString.call(obj) == '[object ' + name + ']';
	    };
	  });

	  // Define a fallback version of the method in browsers (ahem, IE), where
	  // there isn't any inspectable "Arguments" type.
	  if (!_.isArguments(arguments)) {
	    _.isArguments = function(obj) {
	      return !!(obj && _.has(obj, 'callee'));
	    };
	  }

	  // Optimize `isFunction` if appropriate.
	  if (true) {
	    _.isFunction = function(obj) {
	      return typeof obj === 'function';
	    };
	  }

	  // Is a given object a finite number?
	  _.isFinite = function(obj) {
	    return isFinite(obj) && !isNaN(parseFloat(obj));
	  };

	  // Is the given value `NaN`? (NaN is the only number which does not equal itself).
	  _.isNaN = function(obj) {
	    return _.isNumber(obj) && obj != +obj;
	  };

	  // Is a given value a boolean?
	  _.isBoolean = function(obj) {
	    return obj === true || obj === false || toString.call(obj) == '[object Boolean]';
	  };

	  // Is a given value equal to null?
	  _.isNull = function(obj) {
	    return obj === null;
	  };

	  // Is a given variable undefined?
	  _.isUndefined = function(obj) {
	    return obj === void 0;
	  };

	  // Shortcut function for checking if an object has a given property directly
	  // on itself (in other words, not on a prototype).
	  _.has = function(obj, key) {
	    return hasOwnProperty.call(obj, key);
	  };

	  // Utility Functions
	  // -----------------

	  // Run Underscore.js in *noConflict* mode, returning the `_` variable to its
	  // previous owner. Returns a reference to the Underscore object.
	  _.noConflict = function() {
	    root._ = previousUnderscore;
	    return this;
	  };

	  // Keep the identity function around for default iterators.
	  _.identity = function(value) {
	    return value;
	  };

	  // Run a function **n** times.
	  _.times = function(n, iterator, context) {
	    var accum = Array(Math.max(0, n));
	    for (var i = 0; i < n; i++) accum[i] = iterator.call(context, i);
	    return accum;
	  };

	  // Return a random integer between min and max (inclusive).
	  _.random = function(min, max) {
	    if (max == null) {
	      max = min;
	      min = 0;
	    }
	    return min + Math.floor(Math.random() * (max - min + 1));
	  };

	  // List of HTML entities for escaping.
	  var entityMap = {
	    escape: {
	      '&': '&amp;',
	      '<': '&lt;',
	      '>': '&gt;',
	      '"': '&quot;',
	      "'": '&#x27;'
	    }
	  };
	  entityMap.unescape = _.invert(entityMap.escape);

	  // Regexes containing the keys and values listed immediately above.
	  var entityRegexes = {
	    escape:   new RegExp('[' + _.keys(entityMap.escape).join('') + ']', 'g'),
	    unescape: new RegExp('(' + _.keys(entityMap.unescape).join('|') + ')', 'g')
	  };

	  // Functions for escaping and unescaping strings to/from HTML interpolation.
	  _.each(['escape', 'unescape'], function(method) {
	    _[method] = function(string) {
	      if (string == null) return '';
	      return ('' + string).replace(entityRegexes[method], function(match) {
	        return entityMap[method][match];
	      });
	    };
	  });

	  // If the value of the named `property` is a function then invoke it with the
	  // `object` as context; otherwise, return it.
	  _.result = function(object, property) {
	    if (object == null) return void 0;
	    var value = object[property];
	    return _.isFunction(value) ? value.call(object) : value;
	  };

	  // Add your own custom functions to the Underscore object.
	  _.mixin = function(obj) {
	    each(_.functions(obj), function(name) {
	      var func = _[name] = obj[name];
	      _.prototype[name] = function() {
	        var args = [this._wrapped];
	        push.apply(args, arguments);
	        return result.call(this, func.apply(_, args));
	      };
	    });
	  };

	  // Generate a unique integer id (unique within the entire client session).
	  // Useful for temporary DOM ids.
	  var idCounter = 0;
	  _.uniqueId = function(prefix) {
	    var id = ++idCounter + '';
	    return prefix ? prefix + id : id;
	  };

	  // By default, Underscore uses ERB-style template delimiters, change the
	  // following template settings to use alternative delimiters.
	  _.templateSettings = {
	    evaluate    : /<%([\s\S]+?)%>/g,
	    interpolate : /<%=([\s\S]+?)%>/g,
	    escape      : /<%-([\s\S]+?)%>/g
	  };

	  // When customizing `templateSettings`, if you don't want to define an
	  // interpolation, evaluation or escaping regex, we need one that is
	  // guaranteed not to match.
	  var noMatch = /(.)^/;

	  // Certain characters need to be escaped so that they can be put into a
	  // string literal.
	  var escapes = {
	    "'":      "'",
	    '\\':     '\\',
	    '\r':     'r',
	    '\n':     'n',
	    '\t':     't',
	    '\u2028': 'u2028',
	    '\u2029': 'u2029'
	  };

	  var escaper = /\\|'|\r|\n|\t|\u2028|\u2029/g;

	  // JavaScript micro-templating, similar to John Resig's implementation.
	  // Underscore templating handles arbitrary delimiters, preserves whitespace,
	  // and correctly escapes quotes within interpolated code.
	  _.template = function(text, data, settings) {
	    var render;
	    settings = _.defaults({}, settings, _.templateSettings);

	    // Combine delimiters into one regular expression via alternation.
	    var matcher = new RegExp([
	      (settings.escape || noMatch).source,
	      (settings.interpolate || noMatch).source,
	      (settings.evaluate || noMatch).source
	    ].join('|') + '|$', 'g');

	    // Compile the template source, escaping string literals appropriately.
	    var index = 0;
	    var source = "__p+='";
	    text.replace(matcher, function(match, escape, interpolate, evaluate, offset) {
	      source += text.slice(index, offset)
	        .replace(escaper, function(match) { return '\\' + escapes[match]; });

	      if (escape) {
	        source += "'+\n((__t=(" + escape + "))==null?'':_.escape(__t))+\n'";
	      }
	      if (interpolate) {
	        source += "'+\n((__t=(" + interpolate + "))==null?'':__t)+\n'";
	      }
	      if (evaluate) {
	        source += "';\n" + evaluate + "\n__p+='";
	      }
	      index = offset + match.length;
	      return match;
	    });
	    source += "';\n";

	    // If a variable is not specified, place data values in local scope.
	    if (!settings.variable) source = 'with(obj||{}){\n' + source + '}\n';

	    source = "var __t,__p='',__j=Array.prototype.join," +
	      "print=function(){__p+=__j.call(arguments,'');};\n" +
	      source + "return __p;\n";

	    try {
	      render = new Function(settings.variable || 'obj', '_', source);
	    } catch (e) {
	      e.source = source;
	      throw e;
	    }

	    if (data) return render(data, _);
	    var template = function(data) {
	      return render.call(this, data, _);
	    };

	    // Provide the compiled function source as a convenience for precompilation.
	    template.source = 'function(' + (settings.variable || 'obj') + '){\n' + source + '}';

	    return template;
	  };

	  // Add a "chain" function, which will delegate to the wrapper.
	  _.chain = function(obj) {
	    return _(obj).chain();
	  };

	  // OOP
	  // ---------------
	  // If Underscore is called as a function, it returns a wrapped object that
	  // can be used OO-style. This wrapper holds altered versions of all the
	  // underscore functions. Wrapped objects may be chained.

	  // Helper function to continue chaining intermediate results.
	  var result = function(obj) {
	    return this._chain ? _(obj).chain() : obj;
	  };

	  // Add all of the Underscore functions to the wrapper object.
	  _.mixin(_);

	  // Add all mutator Array functions to the wrapper.
	  each(['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'], function(name) {
	    var method = ArrayProto[name];
	    _.prototype[name] = function() {
	      var obj = this._wrapped;
	      method.apply(obj, arguments);
	      if ((name == 'shift' || name == 'splice') && obj.length === 0) delete obj[0];
	      return result.call(this, obj);
	    };
	  });

	  // Add all accessor Array functions to the wrapper.
	  each(['concat', 'join', 'slice'], function(name) {
	    var method = ArrayProto[name];
	    _.prototype[name] = function() {
	      return result.call(this, method.apply(this._wrapped, arguments));
	    };
	  });

	  _.extend(_.prototype, {

	    // Start chaining a wrapped Underscore object.
	    chain: function() {
	      this._chain = true;
	      return this;
	    },

	    // Extracts the result from a wrapped and chained object.
	    value: function() {
	      return this._wrapped;
	    }

	  });

	}).call(this);


/***/ },
/* 39 */
/***/ function(module, exports, __webpack_require__) {

	/* (The MIT License)
	 *
	 * Copyright (c) 2012 Brandon Benvie <http://bbenvie.com>
	 *
	 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and
	 * associated documentation files (the 'Software'), to deal in the Software without restriction,
	 * including without limitation the rights to use, copy, modify, merge, publish, distribute,
	 * sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is
	 * furnished to do so, subject to the following conditions:
	 *
	 * The above copyright notice and this permission notice shall be included with all copies or
	 * substantial portions of the Software.
	 *
	 * THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
	 * BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
	 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY  CLAIM,
	 * DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
	 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
	 */

	// Original WeakMap implementation by Gozala @ https://gist.github.com/1269991
	// Updated and bugfixed by Raynos @ https://gist.github.com/1638059
	// Expanded by Benvie @ https://github.com/Benvie/harmony-collections

	void function(string_, object_, function_, prototype_, toString_,
	              Array, Object, Function, FP, global, exports, undefined_, undefined){

	  var getProperties = Object.getOwnPropertyNames,
	      es5 = typeof getProperties === function_ && !(prototype_ in getProperties);

	  var callbind = FP.bind
	    ? FP.bind.bind(FP.call)
	    : (function(call){
	        return function(func){
	          return function(){
	            return call.apply(func, arguments);
	          };
	        };
	      }(FP.call));

	  var functionToString = callbind(FP[toString_]),
	      objectToString = callbind({}[toString_]),
	      numberToString = callbind(.0.toString),
	      call = callbind(FP.call),
	      apply = callbind(FP.apply),
	      hasOwn = callbind({}.hasOwnProperty),
	      push = callbind([].push),
	      splice = callbind([].splice);

	  var name = function(func){
	    if (typeof func !== function_)
	      return '';
	    else if ('name' in func)
	      return func.name;

	    return functionToString(func).match(/^\n?function\s?(\w*)?_?\(/)[1];
	  };

	  var create = es5
	    ? Object.create
	    : function(proto, descs){
	        var Ctor = function(){};
	        Ctor[prototype_] = Object(proto);
	        var object = new Ctor;

	        if (descs)
	          for (var key in descs)
	            defineProperty(object, key, descs[k]);

	        return object;
	      };


	  function Hash(){}

	  if (es5 || typeof document === "undefined") {
	    void function(ObjectCreate){
	      Hash.prototype = ObjectCreate(null);
	      function inherit(obj){
	        return ObjectCreate(obj);
	      }
	      Hash.inherit = inherit;
	    }(Object.create);
	  } else {
	    void function(F){
	      var iframe = document.createElement('iframe');
	      iframe.style.display = 'none';
	      document.body.appendChild(iframe);
	      iframe.src = 'javascript:'
	      Hash.prototype = iframe.contentWindow.Object.prototype;
	      document.body.removeChild(iframe);
	      iframe = null;

	      var props = ['constructor', 'hasOwnProperty', 'propertyIsEnumerable',
	                   'isProtoypeOf', 'toLocaleString', 'toString', 'valueOf'];

	      for (var i=0; i < props.length; i++)
	        delete Hash.prototype[props[i]];

	      function inherit(obj){
	        F.prototype = obj;
	        obj = new F;
	        F.prototype = null;
	        return obj;
	      }

	      Hash.inherit = inherit;
	    }(function(){});
	  }

	  var defineProperty = es5
	    ? Object.defineProperty
	    : function(object, key, desc) {
	        object[key] = desc.value;
	        return object;
	      };

	  var define = function(object, key, value){
	    if (typeof key === function_) {
	      value = key;
	      key = name(value).replace(/_$/, '');
	    }

	    return defineProperty(object, key, { configurable: true, writable: true, value: value });
	  };

	  var isArray = es5
	    ? (function(isArray){
	        return function(o){
	          return isArray(o) || o instanceof Array;
	        };
	      })(Array.isArray)
	    : function(o){
	        return o instanceof Array || objectToString(o) === '[object Array]';
	      };

	  // ############
	  // ### Data ###
	  // ############

	  var builtinWeakMap = 'WeakMap' in global;

	  var MapData = builtinWeakMap
	    ? (function(){
	      var BuiltinWeakMap = global.WeakMap,
	          wmget = callbind(BuiltinWeakMap[prototype_].get),
	          wmset = callbind(BuiltinWeakMap[prototype_].set),
	          wmhas = callbind(BuiltinWeakMap[prototype_].has);

	      function MapData(name){
	        var map = new BuiltinWeakMap;

	        this.get = function(o){
	          return wmget(map, o);
	        };
	        this.set = function(o, v){
	          wmset(map, o, v);
	        };

	        if (name) {
	          this.wrap = function(o, v){
	            if (wmhas(map, o))
	              throw new TypeError("Object is already a " + name);
	            wmset(map, o, v);
	          };
	          this.unwrap = function(o){
	            var storage = wmget(map, o);
	            if (!storage)
	              throw new TypeError(name + " is not generic");
	            return storage;
	          };
	        }
	      }

	      return MapData;
	    })()
	    : (function(){
	      var locker = 'return function(k){if(k===s)return l}',
	          random = Math.random,
	          uids = new Hash,
	          slice = callbind(''.slice),
	          indexOf = callbind([].indexOf);

	      var createUID = function(){
	        var key = slice(numberToString(random(), 36), 2);
	        return key in uids ? createUID() : uids[key] = key;
	      };

	      var globalID = createUID();

	      // common per-object storage area made visible by patching getOwnPropertyNames'
	      function getOwnPropertyNames(obj){
	        var props = getProperties(obj);
	        if (hasOwn(obj, globalID))
	          splice(props, indexOf(props, globalID), 1);
	        return props;
	      }

	      if (es5) {
	        // check for the random key on an object, create new storage if missing, return it
	        var storage = function(obj){
	          if (!hasOwn(obj, globalID))
	            defineProperty(obj, globalID, { value: new Hash });
	          return obj[globalID];
	        };

	        define(Object, getOwnPropertyNames);
	      } else {

	        var toStringToString = function(s){
	          function toString(){ return s }
	          return toString[toString_] = toString;
	        }(Object[prototype_][toString_]+'');

	        // store the values on a custom valueOf in order to hide them but store them locally
	        var storage = function(obj){
	          if (hasOwn(obj, toString_) && globalID in obj[toString_])
	            return obj[toString_][globalID];

	          if (!(toString_ in obj))
	            throw new Error("Can't store values for "+obj);

	          var oldToString = obj[toString_];
	          function toString(){ return oldToString.call(this) }
	          obj[toString_] = toString;
	          toString[toString_] = toStringToString;
	          return toString[globalID] = {};
	        };
	      }



	      // shim for [[MapData]] from es6 spec, and pulls double duty as WeakMap storage
	      function MapData(name){
	        var puid = createUID(),
	            iuid = createUID(),
	            secret = { value: undefined, writable: true };

	        var attach = function(obj){
	          var store = storage(obj);
	          if (hasOwn(store, puid))
	            return store[puid](secret);

	          var lockbox = new Hash;
	          defineProperty(lockbox, iuid, secret);
	          defineProperty(store, puid, {
	            value: new Function('s', 'l', locker)(secret, lockbox)
	          });
	          return lockbox;
	        };

	        this.get = function(o){
	          return attach(o)[iuid];
	        };
	        this.set = function(o, v){
	          attach(o)[iuid] = v;
	        };

	        if (name) {
	          this.wrap = function(o, v){
	            var lockbox = attach(o);
	            if (lockbox[iuid])
	              throw new TypeError("Object is already a " + name);
	            lockbox[iuid] = v;
	          };
	          this.unwrap = function(o){
	            var storage = attach(o)[iuid];
	            if (!storage)
	              throw new TypeError(name + " is not generic");
	            return storage;
	          };
	        }
	      }

	      return MapData;
	    }());

	  var exporter = (function(){
	    // [native code] looks slightly different in each engine
	    var src = (''+Object).split('Object');

	    // fake [native code]
	    function toString(){
	      return src[0] + name(this) + src[1];
	    }

	    define(toString, toString);

	    // attempt to use __proto__ so the methods don't all have an own toString
	    var prepFunction = { __proto__: [] } instanceof Array
	      ? function(func){ func.__proto__ = toString }
	      : function(func){ define(func, toString) };

	    // assemble an array of functions into a fully formed class
	    var prepare = function(methods){
	      var Ctor = methods.shift(),
	          brand = '[object ' + name(Ctor) + ']';

	      function toString(){ return brand }
	      methods.push(toString);
	      prepFunction(Ctor);

	      for (var i=0; i < methods.length; i++) {
	        prepFunction(methods[i]);
	        define(Ctor[prototype_], methods[i]);
	      }

	      return Ctor;
	    };

	    return function(name, init){
	      if (name in exports)
	        return exports[name];

	      var data = new MapData(name);

	      return exports[name] = prepare(init(
	        function(collection, value){
	          data.wrap(collection, value);
	        },
	        function(collection){
	          return data.unwrap(collection);
	        }
	      ));
	    };
	  }());


	  // initialize collection with an iterable, currently only supports forEach function
	  var initialize = function(iterable, callback){
	    if (iterable !== null && typeof iterable === object_ && typeof iterable.forEach === function_) {
	      iterable.forEach(function(item, i){
	        if (isArray(item) && item.length === 2)
	          callback(iterable[i][0], iterable[i][1]);
	        else
	          callback(iterable[i], i);
	      });
	    }
	  }

	  // attempt to fix the name of "delete_" methods, should work in V8 and spidermonkey
	  var fixDelete = function(func, scopeNames, scopeValues){
	    try {
	      scopeNames[scopeNames.length] = ('return '+func).replace('e_', '\\u0065');
	      return Function.apply(0, scopeNames).apply(0, scopeValues);
	    } catch (e) {
	      return func;
	    }
	  }

	  var WM, HM, M;

	  // ###############
	  // ### WeakMap ###
	  // ###############

	  WM = builtinWeakMap ? (exports.WeakMap = global.WeakMap) : exporter('WeakMap', function(wrap, unwrap){
	    var prototype = WeakMap[prototype_];
	    var validate = function(key){
	      if (key == null || typeof key !== object_ && typeof key !== function_)
	        throw new TypeError("Invalid WeakMap key");
	    };

	    /**
	     * @class        WeakMap
	     * @description  Collection using objects with unique identities as keys that disallows enumeration
	     *               and allows for better garbage collection.
	     * @param        {Iterable} [iterable]  An item to populate the collection with.
	     */
	    function WeakMap(iterable){
	      if (this === global || this == null || this === prototype)
	        return new WeakMap(iterable);

	      wrap(this, new MapData);

	      var self = this;
	      iterable && initialize(iterable, function(value, key){
	        call(set, self, value, key);
	      });
	    }
	    /**
	     * @method       <get>
	     * @description  Retrieve the value in the collection that matches key
	     * @param        {Any} key
	     * @return       {Any}
	     */
	    function get(key){
	      validate(key);
	      var value = unwrap(this).get(key);
	      return value === undefined_ ? undefined : value;
	    }
	    /**
	     * @method       <set>
	     * @description  Add or update a pair in the collection. Enforces uniqueness by overwriting.
	     * @param        {Any} key
	     * @param        {Any} val
	     **/
	    function set(key, value){
	      validate(key);
	      // store a token for explicit undefined so that "has" works correctly
	      unwrap(this).set(key, value === undefined ? undefined_ : value);
	    }
	    /*
	     * @method       <has>
	     * @description  Check if key is in the collection
	     * @param        {Any} key
	     * @return       {Boolean}
	     **/
	    function has(key){
	      validate(key);
	      return unwrap(this).get(key) !== undefined;
	    }
	    /**
	     * @method       <delete>
	     * @description  Remove key and matching value if found
	     * @param        {Any} key
	     * @return       {Boolean} true if item was in collection
	     */
	    function delete_(key){
	      validate(key);
	      var data = unwrap(this);

	      if (data.get(key) === undefined)
	        return false;

	      data.set(key, undefined);
	      return true;
	    }

	    delete_ = fixDelete(delete_, ['validate', 'unwrap'], [validate, unwrap]);
	    return [WeakMap, get, set, has, delete_];
	  });


	  // ###############
	  // ### HashMap ###
	  // ###############

	  HM = exporter('HashMap', function(wrap, unwrap){
	    // separate numbers, strings, and atoms to compensate for key coercion to string

	    var prototype = HashMap[prototype_],
	        STRING = 0, NUMBER = 1, OTHER = 2,
	        others = { 'true': true, 'false': false, 'null': null, 0: -0 };

	    var proto = Math.random().toString(36).slice(2);

	    var coerce = function(key){
	      return key === '__proto__' ? proto : key;
	    };

	    var uncoerce = function(type, key){
	      switch (type) {
	        case STRING: return key === proto ? '__proto__' : key;
	        case NUMBER: return +key;
	        case OTHER: return others[key];
	      }
	    }


	    var validate = function(key){
	      if (key == null) return OTHER;
	      switch (typeof key) {
	        case 'boolean': return OTHER;
	        case string_: return STRING;
	        // negative zero has to be explicitly accounted for
	        case 'number': return key === 0 && Infinity / key === -Infinity ? OTHER : NUMBER;
	        default: throw new TypeError("Invalid HashMap key");
	      }
	    }

	    /**
	     * @class          HashMap
	     * @description    Collection that only allows primitives to be keys.
	     * @param          {Iterable} [iterable]  An item to populate the collection with.
	     */
	    function HashMap(iterable){
	      if (this === global || this == null || this === prototype)
	        return new HashMap(iterable);

	      wrap(this, {
	        size: 0,
	        0: new Hash,
	        1: new Hash,
	        2: new Hash
	      });

	      var self = this;
	      iterable && initialize(iterable, function(value, key){
	        call(set, self, value, key);
	      });
	    }
	    /**
	     * @method       <get>
	     * @description  Retrieve the value in the collection that matches key
	     * @param        {Any} key
	     * @return       {Any}
	     */
	    function get(key){
	      return unwrap(this)[validate(key)][coerce(key)];
	    }
	    /**
	     * @method       <set>
	     * @description  Add or update a pair in the collection. Enforces uniqueness by overwriting.
	     * @param        {Any} key
	     * @param        {Any} val
	     **/
	    function set(key, value){
	      var items = unwrap(this),
	          data = items[validate(key)];

	      key = coerce(key);
	      key in data || items.size++;
	      data[key] = value;
	    }
	    /**
	     * @method       <has>
	     * @description  Check if key exists in the collection.
	     * @param        {Any} key
	     * @return       {Boolean} is in collection
	     **/
	    function has(key){
	      return coerce(key) in unwrap(this)[validate(key)];
	    }
	    /**
	     * @method       <delete>
	     * @description  Remove key and matching value if found
	     * @param        {Any} key
	     * @return       {Boolean} true if item was in collection
	     */
	    function delete_(key){
	      var items = unwrap(this),
	          data = items[validate(key)];

	      key = coerce(key);
	      if (key in data) {
	        delete data[key];
	        items.size--;
	        return true;
	      }

	      return false;
	    }
	    /**
	     * @method       <size>
	     * @description  Retrieve the amount of items in the collection
	     * @return       {Number}
	     */
	    function size(){
	      return unwrap(this).size;
	    }
	    /**
	     * @method       <forEach>
	     * @description  Loop through the collection raising callback for each
	     * @param        {Function} callback  `callback(value, key)`
	     * @param        {Object}   context    The `this` binding for callbacks, default null
	     */
	    function forEach(callback, context){
	      var data = unwrap(this);
	      context = context == null ? global : context;
	      for (var i=0; i < 3; i++)
	        for (var key in data[i])
	          call(callback, context, data[i][key], uncoerce(i, key), this);
	    }

	    delete_ = fixDelete(delete_, ['validate', 'unwrap', 'coerce'], [validate, unwrap, coerce]);
	    return [HashMap, get, set, has, delete_, size, forEach];
	  });


	  // ###########
	  // ### Map ###
	  // ###########

	  // if a fully implemented Map exists then use it
	  if ('Map' in global && 'forEach' in global.Map.prototype) {
	    M = exports.Map = global.Map;
	  } else {
	    M = exporter('Map', function(wrap, unwrap){
	      // attempt to use an existing partially implemented Map
	      var BuiltinMap = global.Map,
	          prototype = Map[prototype_],
	          wm = WM[prototype_],
	          hm = (BuiltinMap || HM)[prototype_],
	          mget    = [callbind(hm.get), callbind(wm.get)],
	          mset    = [callbind(hm.set), callbind(wm.set)],
	          mhas    = [callbind(hm.has), callbind(wm.has)],
	          mdelete = [callbind(hm['delete']), callbind(wm['delete'])];

	      var type = BuiltinMap
	        ? function(){ return 0 }
	        : function(o){ return +(typeof o === object_ ? o !== null : typeof o === function_) }

	      // if we have a builtin Map we can let it do most of the heavy lifting
	      var init = BuiltinMap
	        ? function(){ return { 0: new BuiltinMap } }
	        : function(){ return { 0: new HM, 1: new WM } };

	      /**
	       * @class         Map
	       * @description   Collection that allows any kind of value to be a key.
	       * @param         {Iterable} [iterable]  An item to populate the collection with.
	       */
	      function Map(iterable){
	        if (this === global || this == null || this === prototype)
	          return new Map(iterable);

	        var data = init();
	        data.keys = [];
	        data.values = [];
	        wrap(this, data);

	        var self = this;
	        iterable && initialize(iterable, function(value, key){
	          call(set, self, value, key);
	        });
	      }
	      /**
	       * @method       <get>
	       * @description  Retrieve the value in the collection that matches key
	       * @param        {Any} key
	       * @return       {Any}
	       */
	      function get(key){
	        var data = unwrap(this),
	            t = type(key);
	        return data.values[mget[t](data[t], key)];
	      }
	      /**
	       * @method       <set>
	       * @description  Add or update a pair in the collection. Enforces uniqueness by overwriting.
	       * @param        {Any} key
	       * @param        {Any} val
	       **/
	      function set(key, value){
	        var data = unwrap(this),
	            t = type(key),
	            index = mget[t](data[t], key);

	        if (index === undefined) {
	          mset[t](data[t], key, data.keys.length);
	          push(data.keys, key);
	          push(data.values, value);
	        } else {
	          data.keys[index] = key;
	          data.values[index] = value;
	        }
	      }
	      /**
	       * @method       <has>
	       * @description  Check if key exists in the collection.
	       * @param        {Any} key
	       * @return       {Boolean} is in collection
	       **/
	      function has(key){
	        var t = type(key);
	        return mhas[t](unwrap(this)[t], key);
	      }
	      /**
	       * @method       <delete>
	       * @description  Remove key and matching value if found
	       * @param        {Any} key
	       * @return       {Boolean} true if item was in collection
	       */
	      function delete_(key){
	        var data = unwrap(this),
	            t = type(key),
	            index = mget[t](data[t], key);

	        if (index === undefined)
	          return false;

	        mdelete[t](data[t], key);
	        splice(data.keys, index, 1);
	        splice(data.values, index, 1);
	        return true;
	      }
	      /**
	       * @method       <size>
	       * @description  Retrieve the amount of items in the collection
	       * @return       {Number}
	       */
	      function size(){
	        return unwrap(this).keys.length;
	      }
	      /**
	       * @method       <forEach>
	       * @description  Loop through the collection raising callback for each
	       * @param        {Function} callback  `callback(value, key)`
	       * @param        {Object}   context    The `this` binding for callbacks, default null
	       */
	      function forEach(callback, context){
	        var data = unwrap(this),
	            keys = data.keys,
	            values = data.values;

	        context = context == null ? global : context;

	        for (var i=0, len=keys.length; i < len; i++)
	          call(callback, context, values[i], keys[i], this);
	      }

	      delete_ = fixDelete(delete_,
	        ['type', 'unwrap', 'call', 'splice'],
	        [type, unwrap, call, splice]
	      );
	      return [Map, get, set, has, delete_, size, forEach];
	    });
	  }


	  // ###########
	  // ### Set ###
	  // ###########

	  exporter('Set', function(wrap, unwrap){
	    var prototype = Set[prototype_],
	        m = M[prototype_],
	        msize = callbind(m.size),
	        mforEach = callbind(m.forEach),
	        mget = callbind(m.get),
	        mset = callbind(m.set),
	        mhas = callbind(m.has),
	        mdelete = callbind(m['delete']);

	    /**
	     * @class        Set
	     * @description  Collection of values that enforces uniqueness.
	     * @param        {Iterable} [iterable]  An item to populate the collection with.
	     **/
	    function Set(iterable){
	      if (this === global || this == null || this === prototype)
	        return new Set(iterable);

	      wrap(this, new M);

	      var self = this;
	      iterable && initialize(iterable, function(value, key){
	        call(add, self, key);
	      });
	    }
	    /**
	     * @method       <add>
	     * @description  Insert value if not found, enforcing uniqueness.
	     * @param        {Any} val
	     */
	    function add(key){
	      mset(unwrap(this), key, key);
	    }
	    /**
	     * @method       <has>
	     * @description  Check if key exists in the collection.
	     * @param        {Any} key
	     * @return       {Boolean} is in collection
	     **/
	    function has(key){
	      return mhas(unwrap(this), key);
	    }
	    /**
	     * @method       <delete>
	     * @description  Remove key and matching value if found
	     * @param        {Any} key
	     * @return       {Boolean} true if item was in collection
	     */
	    function delete_(key){
	      return mdelete(unwrap(this), key);
	    }
	    /**
	     * @method       <size>
	     * @description  Retrieve the amount of items in the collection
	     * @return       {Number}
	     */
	    function size(){
	      return msize(unwrap(this));
	    }
	    /**
	     * @method       <forEach>
	     * @description  Loop through the collection raising callback for each. Index is simply the counter for the current iteration.
	     * @param        {Function} callback  `callback(value, index)`
	     * @param        {Object}   context    The `this` binding for callbacks, default null
	     */
	    function forEach(callback, context){
	      var index = 0,
	          self = this;
	      mforEach(unwrap(this), function(key){
	        call(callback, this, key, index++, self);
	      }, context);
	    }

	    delete_ = fixDelete(delete_, ['mdelete', 'unwrap'], [mdelete, unwrap]);
	    return [Set, add, has, delete_, size, forEach];
	  });
	}('string', 'object', 'function', 'prototype', 'toString',
	  Array, Object, Function, Function.prototype, (0, eval)('this'),
	  false ? this : exports, {});


/***/ },
/* 40 */
/***/ function(module, exports, __webpack_require__) {

	(function() {
	  var ExcludedClassProperties, ExcludedPrototypeProperties, Mixin, name;

	  module.exports = Mixin = (function() {
	    Mixin.includeInto = function(constructor) {
	      var name, value, _ref;
	      this.extend(constructor.prototype);
	      for (name in this) {
	        value = this[name];
	        if (ExcludedClassProperties.indexOf(name) === -1) {
	          if (!constructor.hasOwnProperty(name)) {
	            constructor[name] = value;
	          }
	        }
	      }
	      return (_ref = this.included) != null ? _ref.call(constructor) : void 0;
	    };

	    Mixin.extend = function(object) {
	      var name, _i, _len, _ref, _ref1;
	      _ref = Object.getOwnPropertyNames(this.prototype);
	      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
	        name = _ref[_i];
	        if (ExcludedPrototypeProperties.indexOf(name) === -1) {
	          if (!object.hasOwnProperty(name)) {
	            object[name] = this.prototype[name];
	          }
	        }
	      }
	      return (_ref1 = this.prototype.extended) != null ? _ref1.call(object) : void 0;
	    };

	    function Mixin() {
	      if (typeof this.extended === "function") {
	        this.extended();
	      }
	    }

	    return Mixin;

	  })();

	  ExcludedClassProperties = ['__super__'];

	  for (name in Mixin) {
	    ExcludedClassProperties.push(name);
	  }

	  ExcludedPrototypeProperties = ['constructor', 'extended'];

	}).call(this);


/***/ },
/* 41 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(global) {(function() {
	  var Mixin, PropertyAccessors, WeakMap, _ref, _ref1,
	    __hasProp = {}.hasOwnProperty,
	    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

	  Mixin = __webpack_require__(40);

	  WeakMap = (_ref = global.WeakMap) != null ? _ref : __webpack_require__(45).WeakMap;

	  module.exports = PropertyAccessors = (function(_super) {
	    __extends(PropertyAccessors, _super);

	    function PropertyAccessors() {
	      _ref1 = PropertyAccessors.__super__.constructor.apply(this, arguments);
	      return _ref1;
	    }

	    PropertyAccessors.prototype.accessor = function(name, definition) {
	      if (typeof definition === 'function') {
	        definition = {
	          get: definition
	        };
	      }
	      return Object.defineProperty(this, name, definition);
	    };

	    PropertyAccessors.prototype.advisedAccessor = function(name, definition) {
	      var getAdvice, setAdvice, values;
	      if (typeof definition === 'function') {
	        getAdvice = definition;
	      } else {
	        getAdvice = definition.get;
	        setAdvice = definition.set;
	      }
	      values = new WeakMap;
	      return this.accessor(name, {
	        get: function() {
	          if (getAdvice != null) {
	            getAdvice.call(this);
	          }
	          return values.get(this);
	        },
	        set: function(newValue) {
	          if (setAdvice != null) {
	            setAdvice.call(this, newValue, values.get(this));
	          }
	          return values.set(this, newValue);
	        }
	      });
	    };

	    PropertyAccessors.prototype.lazyAccessor = function(name, definition) {
	      var values;
	      values = new WeakMap;
	      return this.accessor(name, {
	        get: function() {
	          if (values.has(this)) {
	            return values.get(this);
	          } else {
	            values.set(this, definition.call(this));
	            return values.get(this);
	          }
	        },
	        set: function(value) {
	          return values.set(this, value);
	        }
	      });
	    };

	    return PropertyAccessors;

	  })(Mixin);

	}).call(this);
	
	/* WEBPACK VAR INJECTION */}.call(exports, (function() { return this; }())))

/***/ },
/* 42 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(process) {// Copyright Joyent, Inc. and other Node contributors.
	//
	// Permission is hereby granted, free of charge, to any person obtaining a
	// copy of this software and associated documentation files (the
	// "Software"), to deal in the Software without restriction, including
	// without limitation the rights to use, copy, modify, merge, publish,
	// distribute, sublicense, and/or sell copies of the Software, and to permit
	// persons to whom the Software is furnished to do so, subject to the
	// following conditions:
	//
	// The above copyright notice and this permission notice shall be included
	// in all copies or substantial portions of the Software.
	//
	// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
	// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
	// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
	// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
	// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
	// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
	// USE OR OTHER DEALINGS IN THE SOFTWARE.

	// resolves . and .. elements in a path array with directory names there
	// must be no slashes, empty elements, or device names (c:\) in the array
	// (so also no leading and trailing slashes - it does not distinguish
	// relative and absolute paths)
	function normalizeArray(parts, allowAboveRoot) {
	  // if the path tries to go above the root, `up` ends up > 0
	  var up = 0;
	  for (var i = parts.length - 1; i >= 0; i--) {
	    var last = parts[i];
	    if (last === '.') {
	      parts.splice(i, 1);
	    } else if (last === '..') {
	      parts.splice(i, 1);
	      up++;
	    } else if (up) {
	      parts.splice(i, 1);
	      up--;
	    }
	  }

	  // if the path is allowed to go above the root, restore leading ..s
	  if (allowAboveRoot) {
	    for (; up--; up) {
	      parts.unshift('..');
	    }
	  }

	  return parts;
	}

	// Split a filename into [root, dir, basename, ext], unix version
	// 'root' is just a slash, or nothing.
	var splitPathRe =
	    /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
	var splitPath = function(filename) {
	  return splitPathRe.exec(filename).slice(1);
	};

	// path.resolve([from ...], to)
	// posix version
	exports.resolve = function() {
	  var resolvedPath = '',
	      resolvedAbsolute = false;

	  for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
	    var path = (i >= 0) ? arguments[i] : process.cwd();

	    // Skip empty and invalid entries
	    if (typeof path !== 'string') {
	      throw new TypeError('Arguments to path.resolve must be strings');
	    } else if (!path) {
	      continue;
	    }

	    resolvedPath = path + '/' + resolvedPath;
	    resolvedAbsolute = path.charAt(0) === '/';
	  }

	  // At this point the path should be resolved to a full absolute path, but
	  // handle relative paths to be safe (might happen when process.cwd() fails)

	  // Normalize the path
	  resolvedPath = normalizeArray(filter(resolvedPath.split('/'), function(p) {
	    return !!p;
	  }), !resolvedAbsolute).join('/');

	  return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
	};

	// path.normalize(path)
	// posix version
	exports.normalize = function(path) {
	  var isAbsolute = exports.isAbsolute(path),
	      trailingSlash = substr(path, -1) === '/';

	  // Normalize the path
	  path = normalizeArray(filter(path.split('/'), function(p) {
	    return !!p;
	  }), !isAbsolute).join('/');

	  if (!path && !isAbsolute) {
	    path = '.';
	  }
	  if (path && trailingSlash) {
	    path += '/';
	  }

	  return (isAbsolute ? '/' : '') + path;
	};

	// posix version
	exports.isAbsolute = function(path) {
	  return path.charAt(0) === '/';
	};

	// posix version
	exports.join = function() {
	  var paths = Array.prototype.slice.call(arguments, 0);
	  return exports.normalize(filter(paths, function(p, index) {
	    if (typeof p !== 'string') {
	      throw new TypeError('Arguments to path.join must be strings');
	    }
	    return p;
	  }).join('/'));
	};


	// path.relative(from, to)
	// posix version
	exports.relative = function(from, to) {
	  from = exports.resolve(from).substr(1);
	  to = exports.resolve(to).substr(1);

	  function trim(arr) {
	    var start = 0;
	    for (; start < arr.length; start++) {
	      if (arr[start] !== '') break;
	    }

	    var end = arr.length - 1;
	    for (; end >= 0; end--) {
	      if (arr[end] !== '') break;
	    }

	    if (start > end) return [];
	    return arr.slice(start, end - start + 1);
	  }

	  var fromParts = trim(from.split('/'));
	  var toParts = trim(to.split('/'));

	  var length = Math.min(fromParts.length, toParts.length);
	  var samePartsLength = length;
	  for (var i = 0; i < length; i++) {
	    if (fromParts[i] !== toParts[i]) {
	      samePartsLength = i;
	      break;
	    }
	  }

	  var outputParts = [];
	  for (var i = samePartsLength; i < fromParts.length; i++) {
	    outputParts.push('..');
	  }

	  outputParts = outputParts.concat(toParts.slice(samePartsLength));

	  return outputParts.join('/');
	};

	exports.sep = '/';
	exports.delimiter = ':';

	exports.dirname = function(path) {
	  var result = splitPath(path),
	      root = result[0],
	      dir = result[1];

	  if (!root && !dir) {
	    // No dirname whatsoever
	    return '.';
	  }

	  if (dir) {
	    // It has a dirname, strip trailing slash
	    dir = dir.substr(0, dir.length - 1);
	  }

	  return root + dir;
	};


	exports.basename = function(path, ext) {
	  var f = splitPath(path)[2];
	  // TODO: make this comparison case-insensitive on windows?
	  if (ext && f.substr(-1 * ext.length) === ext) {
	    f = f.substr(0, f.length - ext.length);
	  }
	  return f;
	};


	exports.extname = function(path) {
	  return splitPath(path)[3];
	};

	function filter (xs, f) {
	    if (xs.filter) return xs.filter(f);
	    var res = [];
	    for (var i = 0; i < xs.length; i++) {
	        if (f(xs[i], i, xs)) res.push(xs[i]);
	    }
	    return res;
	}

	// String.prototype.substr - negative index don't work in IE8
	var substr = 'ab'.substr(-1) === 'b'
	    ? function (str, start, len) { return str.substr(start, len) }
	    : function (str, start, len) {
	        if (start < 0) start = str.length + start;
	        return str.substr(start, len);
	    }
	;
	
	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(30)))

/***/ },
/* 43 */
/***/ function(module, exports, __webpack_require__) {

	/*
	 * Copyright 2009-2011 Mozilla Foundation and contributors
	 * Licensed under the New BSD license. See LICENSE.txt or:
	 * http://opensource.org/licenses/BSD-3-Clause
	 */
	exports.SourceMapGenerator = __webpack_require__(53).SourceMapGenerator;
	exports.SourceMapConsumer = __webpack_require__(54).SourceMapConsumer;
	exports.SourceNode = __webpack_require__(55).SourceNode;


/***/ },
/* 44 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(process, global) {// Generated by CoffeeScript 1.7.1
	(function() {
	  var Lexer, SourceMap, compile, formatSourcePosition, fs, getSourceMap, helpers, lexer, parser, path, sourceMaps, vm, withPrettyErrors,
	    __hasProp = {}.hasOwnProperty,
	    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

	  fs = __webpack_require__(!(function webpackMissingModule() { var e = new Error("Cannot find module \"fs\""); e.code = 'MODULE_NOT_FOUND'; throw e; }()));

	  vm = __webpack_require__(65);

	  path = __webpack_require__(42);

	  Lexer = __webpack_require__(46).Lexer;

	  parser = __webpack_require__(47).parser;

	  helpers = __webpack_require__(48);

	  SourceMap = __webpack_require__(49);

	  exports.VERSION = '1.7.1';

	  exports.FILE_EXTENSIONS = ['.coffee', '.litcoffee', '.coffee.md'];

	  exports.helpers = helpers;

	  withPrettyErrors = function(fn) {
	    return function(code, options) {
	      var err;
	      if (options == null) {
	        options = {};
	      }
	      try {
	        return fn.call(this, code, options);
	      } catch (_error) {
	        err = _error;
	        throw helpers.updateSyntaxError(err, code, options.filename);
	      }
	    };
	  };

	  exports.compile = compile = withPrettyErrors(function(code, options) {
	    var answer, currentColumn, currentLine, extend, fragment, fragments, header, js, map, merge, newLines, _i, _len;
	    merge = helpers.merge, extend = helpers.extend;
	    options = extend({}, options);
	    if (options.sourceMap) {
	      map = new SourceMap;
	    }
	    fragments = parser.parse(lexer.tokenize(code, options)).compileToFragments(options);
	    currentLine = 0;
	    if (options.header) {
	      currentLine += 1;
	    }
	    if (options.shiftLine) {
	      currentLine += 1;
	    }
	    currentColumn = 0;
	    js = "";
	    for (_i = 0, _len = fragments.length; _i < _len; _i++) {
	      fragment = fragments[_i];
	      if (options.sourceMap) {
	        if (fragment.locationData) {
	          map.add([fragment.locationData.first_line, fragment.locationData.first_column], [currentLine, currentColumn], {
	            noReplace: true
	          });
	        }
	        newLines = helpers.count(fragment.code, "\n");
	        currentLine += newLines;
	        if (newLines) {
	          currentColumn = fragment.code.length - (fragment.code.lastIndexOf("\n") + 1);
	        } else {
	          currentColumn += fragment.code.length;
	        }
	      }
	      js += fragment.code;
	    }
	    if (options.header) {
	      header = "Generated by CoffeeScript " + this.VERSION;
	      js = "// " + header + "\n" + js;
	    }
	    if (options.sourceMap) {
	      answer = {
	        js: js
	      };
	      answer.sourceMap = map;
	      answer.v3SourceMap = map.generate(options, code);
	      return answer;
	    } else {
	      return js;
	    }
	  });

	  exports.tokens = withPrettyErrors(function(code, options) {
	    return lexer.tokenize(code, options);
	  });

	  exports.nodes = withPrettyErrors(function(source, options) {
	    if (typeof source === 'string') {
	      return parser.parse(lexer.tokenize(source, options));
	    } else {
	      return parser.parse(source);
	    }
	  });

	  exports.run = function(code, options) {
	    var answer, dir, mainModule, _ref;
	    if (options == null) {
	      options = {};
	    }
	    mainModule = __webpack_require__.c[0];
	    mainModule.filename = process.argv[1] = options.filename ? fs.realpathSync(options.filename) : '.';
	    mainModule.moduleCache && (mainModule.moduleCache = {});
	    dir = options.filename ? path.dirname(fs.realpathSync(options.filename)) : fs.realpathSync('.');
	    mainModule.paths = __webpack_require__(!(function webpackMissingModule() { var e = new Error("Cannot find module \"module\""); e.code = 'MODULE_NOT_FOUND'; throw e; }()))._nodeModulePaths(dir);
	    if (!helpers.isCoffee(mainModule.filename) || (void 0)) {
	      answer = compile(code, options);
	      code = (_ref = answer.js) != null ? _ref : answer;
	    }
	    return mainModule._compile(code, mainModule.filename);
	  };

	  exports["eval"] = function(code, options) {
	    var Module, Script, js, k, o, r, sandbox, v, _i, _len, _module, _ref, _ref1, _require;
	    if (options == null) {
	      options = {};
	    }
	    if (!(code = code.trim())) {
	      return;
	    }
	    Script = vm.Script;
	    if (Script) {
	      if (options.sandbox != null) {
	        if (options.sandbox instanceof Script.createContext().constructor) {
	          sandbox = options.sandbox;
	        } else {
	          sandbox = Script.createContext();
	          _ref = options.sandbox;
	          for (k in _ref) {
	            if (!__hasProp.call(_ref, k)) continue;
	            v = _ref[k];
	            sandbox[k] = v;
	          }
	        }
	        sandbox.global = sandbox.root = sandbox.GLOBAL = sandbox;
	      } else {
	        sandbox = global;
	      }
	      sandbox.__filename = options.filename || 'eval';
	      sandbox.__dirname = path.dirname(sandbox.__filename);
	      if (!(sandbox !== global || sandbox.module || sandbox.require)) {
	        Module = __webpack_require__(!(function webpackMissingModule() { var e = new Error("Cannot find module \"module\""); e.code = 'MODULE_NOT_FOUND'; throw e; }()));
	        sandbox.module = _module = new Module(options.modulename || 'eval');
	        sandbox.require = _require = function(path) {
	          return Module._load(path, _module, true);
	        };
	        _module.filename = sandbox.__filename;
	        _ref1 = Object.getOwnPropertyNames(__webpack_require__(50));
	        for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
	          r = _ref1[_i];
	          if (r !== 'paths') {
	            _require[r] = __webpack_require__(50)[r];
	          }
	        }
	        _require.paths = _module.paths = Module._nodeModulePaths(process.cwd());
	        _require.resolve = function(request) {
	          return Module._resolveFilename(request, _module);
	        };
	      }
	    }
	    o = {};
	    for (k in options) {
	      if (!__hasProp.call(options, k)) continue;
	      v = options[k];
	      o[k] = v;
	    }
	    o.bare = true;
	    js = compile(code, o);
	    if (sandbox === global) {
	      return vm.runInThisContext(js);
	    } else {
	      return vm.runInContext(js, sandbox);
	    }
	  };

	  exports.register = function() {
	    return __webpack_require__(51);
	  };

	  exports._compileFile = function(filename, sourceMap) {
	    var answer, err, raw, stripped;
	    if (sourceMap == null) {
	      sourceMap = false;
	    }
	    raw = fs.readFileSync(filename, 'utf8');
	    stripped = raw.charCodeAt(0) === 0xFEFF ? raw.substring(1) : raw;
	    try {
	      answer = compile(stripped, {
	        filename: filename,
	        sourceMap: sourceMap,
	        literate: helpers.isLiterate(filename)
	      });
	    } catch (_error) {
	      err = _error;
	      throw helpers.updateSyntaxError(err, stripped, filename);
	    }
	    return answer;
	  };

	  lexer = new Lexer;

	  parser.lexer = {
	    lex: function() {
	      var tag, token;
	      token = this.tokens[this.pos++];
	      if (token) {
	        tag = token[0], this.yytext = token[1], this.yylloc = token[2];
	        this.errorToken = token.origin || token;
	        this.yylineno = this.yylloc.first_line;
	      } else {
	        tag = '';
	      }
	      return tag;
	    },
	    setInput: function(tokens) {
	      this.tokens = tokens;
	      return this.pos = 0;
	    },
	    upcomingInput: function() {
	      return "";
	    }
	  };

	  parser.yy = __webpack_require__(52);

	  parser.yy.parseError = function(message, _arg) {
	    var errorLoc, errorTag, errorText, errorToken, token, tokens, _ref;
	    token = _arg.token;
	    _ref = parser.lexer, errorToken = _ref.errorToken, tokens = _ref.tokens;
	    errorTag = errorToken[0], errorText = errorToken[1], errorLoc = errorToken[2];
	    errorText = errorToken === tokens[tokens.length - 1] ? 'end of input' : errorTag === 'INDENT' || errorTag === 'OUTDENT' ? 'indentation' : helpers.nameWhitespaceCharacter(errorText);
	    return helpers.throwSyntaxError("unexpected " + errorText, errorLoc);
	  };

	  formatSourcePosition = function(frame, getSourceMapping) {
	    var as, column, fileLocation, fileName, functionName, isConstructor, isMethodCall, line, methodName, source, tp, typeName;
	    fileName = void 0;
	    fileLocation = '';
	    if (frame.isNative()) {
	      fileLocation = "native";
	    } else {
	      if (frame.isEval()) {
	        fileName = frame.getScriptNameOrSourceURL();
	        if (!fileName) {
	          fileLocation = "" + (frame.getEvalOrigin()) + ", ";
	        }
	      } else {
	        fileName = frame.getFileName();
	      }
	      fileName || (fileName = "<anonymous>");
	      line = frame.getLineNumber();
	      column = frame.getColumnNumber();
	      source = getSourceMapping(fileName, line, column);
	      fileLocation = source ? "" + fileName + ":" + source[0] + ":" + source[1] : "" + fileName + ":" + line + ":" + column;
	    }
	    functionName = frame.getFunctionName();
	    isConstructor = frame.isConstructor();
	    isMethodCall = !(frame.isToplevel() || isConstructor);
	    if (isMethodCall) {
	      methodName = frame.getMethodName();
	      typeName = frame.getTypeName();
	      if (functionName) {
	        tp = as = '';
	        if (typeName && functionName.indexOf(typeName)) {
	          tp = "" + typeName + ".";
	        }
	        if (methodName && functionName.indexOf("." + methodName) !== functionName.length - methodName.length - 1) {
	          as = " [as " + methodName + "]";
	        }
	        return "" + tp + functionName + as + " (" + fileLocation + ")";
	      } else {
	        return "" + typeName + "." + (methodName || '<anonymous>') + " (" + fileLocation + ")";
	      }
	    } else if (isConstructor) {
	      return "new " + (functionName || '<anonymous>') + " (" + fileLocation + ")";
	    } else if (functionName) {
	      return "" + functionName + " (" + fileLocation + ")";
	    } else {
	      return fileLocation;
	    }
	  };

	  sourceMaps = {};

	  getSourceMap = function(filename) {
	    var answer, _ref;
	    if (sourceMaps[filename]) {
	      return sourceMaps[filename];
	    }
	    if (_ref = path != null ? path.extname(filename) : void 0, __indexOf.call(exports.FILE_EXTENSIONS, _ref) < 0) {
	      return;
	    }
	    answer = exports._compileFile(filename, true);
	    return sourceMaps[filename] = answer.sourceMap;
	  };

	  Error.prepareStackTrace = function(err, stack) {
	    var frame, frames, getSourceMapping, _ref;
	    getSourceMapping = function(filename, line, column) {
	      var answer, sourceMap;
	      sourceMap = getSourceMap(filename);
	      if (sourceMap) {
	        answer = sourceMap.sourceLocation([line - 1, column - 1]);
	      }
	      if (answer) {
	        return [answer[0] + 1, answer[1] + 1];
	      } else {
	        return null;
	      }
	    };
	    frames = (function() {
	      var _i, _len, _results;
	      _results = [];
	      for (_i = 0, _len = stack.length; _i < _len; _i++) {
	        frame = stack[_i];
	        if (frame.getFunction() === exports.run) {
	          break;
	        }
	        _results.push("  at " + (formatSourcePosition(frame, getSourceMapping)));
	      }
	      return _results;
	    })();
	    return "" + err.name + ": " + ((_ref = err.message) != null ? _ref : '') + "\n" + (frames.join('\n')) + "\n";
	  };

	}).call(this);
	
	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(30), (function() { return this; }())))

/***/ },
/* 45 */
/***/ function(module, exports, __webpack_require__) {

	/* (The MIT License)
	 *
	 * Copyright (c) 2012 Brandon Benvie <http://bbenvie.com>
	 *
	 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and
	 * associated documentation files (the 'Software'), to deal in the Software without restriction,
	 * including without limitation the rights to use, copy, modify, merge, publish, distribute,
	 * sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is
	 * furnished to do so, subject to the following conditions:
	 *
	 * The above copyright notice and this permission notice shall be included with all copies or
	 * substantial portions of the Software.
	 *
	 * THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
	 * BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
	 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY  CLAIM,
	 * DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
	 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
	 */

	// Original WeakMap implementation by Gozala @ https://gist.github.com/1269991
	// Updated and bugfixed by Raynos @ https://gist.github.com/1638059
	// Expanded by Benvie @ https://github.com/Benvie/harmony-collections

	void function(string_, object_, function_, prototype_, toString_,
	              Array, Object, Function, FP, global, exports, undefined_, undefined){

	  var getProperties = Object.getOwnPropertyNames,
	      es5 = typeof getProperties === function_ && !(prototype_ in getProperties);

	  var callbind = FP.bind
	    ? FP.bind.bind(FP.call)
	    : (function(call){
	        return function(func){
	          return function(){
	            return call.apply(func, arguments);
	          };
	        };
	      }(FP.call));

	  var functionToString = callbind(FP[toString_]),
	      objectToString = callbind({}[toString_]),
	      numberToString = callbind(.0.toString),
	      call = callbind(FP.call),
	      apply = callbind(FP.apply),
	      hasOwn = callbind({}.hasOwnProperty),
	      push = callbind([].push),
	      splice = callbind([].splice);

	  var name = function(func){
	    if (typeof func !== function_)
	      return '';
	    else if ('name' in func)
	      return func.name;

	    return functionToString(func).match(/^\n?function\s?(\w*)?_?\(/)[1];
	  };

	  var create = es5
	    ? Object.create
	    : function(proto, descs){
	        var Ctor = function(){};
	        Ctor[prototype_] = Object(proto);
	        var object = new Ctor;

	        if (descs)
	          for (var key in descs)
	            defineProperty(object, key, descs[k]);

	        return object;
	      };


	  function Hash(){}

	  if (es5 || typeof document === "undefined") {
	    void function(ObjectCreate){
	      Hash.prototype = ObjectCreate(null);
	      function inherit(obj){
	        return ObjectCreate(obj);
	      }
	      Hash.inherit = inherit;
	    }(Object.create);
	  } else {
	    void function(F){
	      var iframe = document.createElement('iframe');
	      iframe.style.display = 'none';
	      document.body.appendChild(iframe);
	      iframe.src = 'javascript:'
	      Hash.prototype = iframe.contentWindow.Object.prototype;
	      document.body.removeChild(iframe);
	      iframe = null;

	      var props = ['constructor', 'hasOwnProperty', 'propertyIsEnumerable',
	                   'isProtoypeOf', 'toLocaleString', 'toString', 'valueOf'];

	      for (var i=0; i < props.length; i++)
	        delete Hash.prototype[props[i]];

	      function inherit(obj){
	        F.prototype = obj;
	        obj = new F;
	        F.prototype = null;
	        return obj;
	      }

	      Hash.inherit = inherit;
	    }(function(){});
	  }

	  var defineProperty = es5
	    ? Object.defineProperty
	    : function(object, key, desc) {
	        object[key] = desc.value;
	        return object;
	      };

	  var define = function(object, key, value){
	    if (typeof key === function_) {
	      value = key;
	      key = name(value).replace(/_$/, '');
	    }

	    return defineProperty(object, key, { configurable: true, writable: true, value: value });
	  };

	  var isArray = es5
	    ? (function(isArray){
	        return function(o){
	          return isArray(o) || o instanceof Array;
	        };
	      })(Array.isArray)
	    : function(o){
	        return o instanceof Array || objectToString(o) === '[object Array]';
	      };

	  // ############
	  // ### Data ###
	  // ############

	  var builtinWeakMap = 'WeakMap' in global;

	  var MapData = builtinWeakMap
	    ? (function(){
	      var BuiltinWeakMap = global.WeakMap,
	          wmget = callbind(BuiltinWeakMap[prototype_].get),
	          wmset = callbind(BuiltinWeakMap[prototype_].set),
	          wmhas = callbind(BuiltinWeakMap[prototype_].has);

	      function MapData(name){
	        var map = new BuiltinWeakMap;

	        this.get = function(o){
	          return wmget(map, o);
	        };
	        this.set = function(o, v){
	          wmset(map, o, v);
	        };

	        if (name) {
	          this.wrap = function(o, v){
	            if (wmhas(map, o))
	              throw new TypeError("Object is already a " + name);
	            wmset(map, o, v);
	          };
	          this.unwrap = function(o){
	            var storage = wmget(map, o);
	            if (!storage)
	              throw new TypeError(name + " is not generic");
	            return storage;
	          };
	        }
	      }

	      return MapData;
	    })()
	    : (function(){
	      var locker = 'return function(k){if(k===s)return l}',
	          random = Math.random,
	          uids = new Hash,
	          slice = callbind(''.slice),
	          indexOf = callbind([].indexOf);

	      var createUID = function(){
	        var key = slice(numberToString(random(), 36), 2);
	        return key in uids ? createUID() : uids[key] = key;
	      };

	      var globalID = createUID();

	      // common per-object storage area made visible by patching getOwnPropertyNames'
	      function getOwnPropertyNames(obj){
	        var props = getProperties(obj);
	        if (hasOwn(obj, globalID))
	          splice(props, indexOf(props, globalID), 1);
	        return props;
	      }

	      if (es5) {
	        // check for the random key on an object, create new storage if missing, return it
	        var storage = function(obj){
	          if (!hasOwn(obj, globalID))
	            defineProperty(obj, globalID, { value: new Hash });
	          return obj[globalID];
	        };

	        define(Object, getOwnPropertyNames);
	      } else {

	        var toStringToString = function(s){
	          function toString(){ return s }
	          return toString[toString_] = toString;
	        }(Object[prototype_][toString_]+'');

	        // store the values on a custom valueOf in order to hide them but store them locally
	        var storage = function(obj){
	          if (hasOwn(obj, toString_) && globalID in obj[toString_])
	            return obj[toString_][globalID];

	          if (!(toString_ in obj))
	            throw new Error("Can't store values for "+obj);

	          var oldToString = obj[toString_];
	          function toString(){ return oldToString.call(this) }
	          obj[toString_] = toString;
	          toString[toString_] = toStringToString;
	          return toString[globalID] = {};
	        };
	      }



	      // shim for [[MapData]] from es6 spec, and pulls double duty as WeakMap storage
	      function MapData(name){
	        var puid = createUID(),
	            iuid = createUID(),
	            secret = { value: undefined, writable: true };

	        var attach = function(obj){
	          var store = storage(obj);
	          if (hasOwn(store, puid))
	            return store[puid](secret);

	          var lockbox = new Hash;
	          defineProperty(lockbox, iuid, secret);
	          defineProperty(store, puid, {
	            value: new Function('s', 'l', locker)(secret, lockbox)
	          });
	          return lockbox;
	        };

	        this.get = function(o){
	          return attach(o)[iuid];
	        };
	        this.set = function(o, v){
	          attach(o)[iuid] = v;
	        };

	        if (name) {
	          this.wrap = function(o, v){
	            var lockbox = attach(o);
	            if (lockbox[iuid])
	              throw new TypeError("Object is already a " + name);
	            lockbox[iuid] = v;
	          };
	          this.unwrap = function(o){
	            var storage = attach(o)[iuid];
	            if (!storage)
	              throw new TypeError(name + " is not generic");
	            return storage;
	          };
	        }
	      }

	      return MapData;
	    }());

	  var exporter = (function(){
	    // [native code] looks slightly different in each engine
	    var src = (''+Object).split('Object');

	    // fake [native code]
	    function toString(){
	      return src[0] + name(this) + src[1];
	    }

	    define(toString, toString);

	    // attempt to use __proto__ so the methods don't all have an own toString
	    var prepFunction = { __proto__: [] } instanceof Array
	      ? function(func){ func.__proto__ = toString }
	      : function(func){ define(func, toString) };

	    // assemble an array of functions into a fully formed class
	    var prepare = function(methods){
	      var Ctor = methods.shift(),
	          brand = '[object ' + name(Ctor) + ']';

	      function toString(){ return brand }
	      methods.push(toString);
	      prepFunction(Ctor);

	      for (var i=0; i < methods.length; i++) {
	        prepFunction(methods[i]);
	        define(Ctor[prototype_], methods[i]);
	      }

	      return Ctor;
	    };

	    return function(name, init){
	      if (name in exports)
	        return exports[name];

	      var data = new MapData(name);

	      return exports[name] = prepare(init(
	        function(collection, value){
	          data.wrap(collection, value);
	        },
	        function(collection){
	          return data.unwrap(collection);
	        }
	      ));
	    };
	  }());


	  // initialize collection with an iterable, currently only supports forEach function
	  var initialize = function(iterable, callback){
	    if (iterable !== null && typeof iterable === object_ && typeof iterable.forEach === function_) {
	      iterable.forEach(function(item, i){
	        if (isArray(item) && item.length === 2)
	          callback(iterable[i][0], iterable[i][1]);
	        else
	          callback(iterable[i], i);
	      });
	    }
	  }

	  // attempt to fix the name of "delete_" methods, should work in V8 and spidermonkey
	  var fixDelete = function(func, scopeNames, scopeValues){
	    try {
	      scopeNames[scopeNames.length] = ('return '+func).replace('e_', '\\u0065');
	      return Function.apply(0, scopeNames).apply(0, scopeValues);
	    } catch (e) {
	      return func;
	    }
	  }

	  var WM, HM, M;

	  // ###############
	  // ### WeakMap ###
	  // ###############

	  WM = builtinWeakMap ? (exports.WeakMap = global.WeakMap) : exporter('WeakMap', function(wrap, unwrap){
	    var prototype = WeakMap[prototype_];
	    var validate = function(key){
	      if (key == null || typeof key !== object_ && typeof key !== function_)
	        throw new TypeError("Invalid WeakMap key");
	    };

	    /**
	     * @class        WeakMap
	     * @description  Collection using objects with unique identities as keys that disallows enumeration
	     *               and allows for better garbage collection.
	     * @param        {Iterable} [iterable]  An item to populate the collection with.
	     */
	    function WeakMap(iterable){
	      if (this === global || this == null || this === prototype)
	        return new WeakMap(iterable);

	      wrap(this, new MapData);

	      var self = this;
	      iterable && initialize(iterable, function(value, key){
	        call(set, self, value, key);
	      });
	    }
	    /**
	     * @method       <get>
	     * @description  Retrieve the value in the collection that matches key
	     * @param        {Any} key
	     * @return       {Any}
	     */
	    function get(key){
	      validate(key);
	      var value = unwrap(this).get(key);
	      return value === undefined_ ? undefined : value;
	    }
	    /**
	     * @method       <set>
	     * @description  Add or update a pair in the collection. Enforces uniqueness by overwriting.
	     * @param        {Any} key
	     * @param        {Any} val
	     **/
	    function set(key, value){
	      validate(key);
	      // store a token for explicit undefined so that "has" works correctly
	      unwrap(this).set(key, value === undefined ? undefined_ : value);
	    }
	    /*
	     * @method       <has>
	     * @description  Check if key is in the collection
	     * @param        {Any} key
	     * @return       {Boolean}
	     **/
	    function has(key){
	      validate(key);
	      return unwrap(this).get(key) !== undefined;
	    }
	    /**
	     * @method       <delete>
	     * @description  Remove key and matching value if found
	     * @param        {Any} key
	     * @return       {Boolean} true if item was in collection
	     */
	    function delete_(key){
	      validate(key);
	      var data = unwrap(this);

	      if (data.get(key) === undefined)
	        return false;

	      data.set(key, undefined);
	      return true;
	    }

	    delete_ = fixDelete(delete_, ['validate', 'unwrap'], [validate, unwrap]);
	    return [WeakMap, get, set, has, delete_];
	  });


	  // ###############
	  // ### HashMap ###
	  // ###############

	  HM = exporter('HashMap', function(wrap, unwrap){
	    // separate numbers, strings, and atoms to compensate for key coercion to string

	    var prototype = HashMap[prototype_],
	        STRING = 0, NUMBER = 1, OTHER = 2,
	        others = { 'true': true, 'false': false, 'null': null, 0: -0 };

	    var proto = Math.random().toString(36).slice(2);

	    var coerce = function(key){
	      return key === '__proto__' ? proto : key;
	    };

	    var uncoerce = function(type, key){
	      switch (type) {
	        case STRING: return key === proto ? '__proto__' : key;
	        case NUMBER: return +key;
	        case OTHER: return others[key];
	      }
	    }


	    var validate = function(key){
	      if (key == null) return OTHER;
	      switch (typeof key) {
	        case 'boolean': return OTHER;
	        case string_: return STRING;
	        // negative zero has to be explicitly accounted for
	        case 'number': return key === 0 && Infinity / key === -Infinity ? OTHER : NUMBER;
	        default: throw new TypeError("Invalid HashMap key");
	      }
	    }

	    /**
	     * @class          HashMap
	     * @description    Collection that only allows primitives to be keys.
	     * @param          {Iterable} [iterable]  An item to populate the collection with.
	     */
	    function HashMap(iterable){
	      if (this === global || this == null || this === prototype)
	        return new HashMap(iterable);

	      wrap(this, {
	        size: 0,
	        0: new Hash,
	        1: new Hash,
	        2: new Hash
	      });

	      var self = this;
	      iterable && initialize(iterable, function(value, key){
	        call(set, self, value, key);
	      });
	    }
	    /**
	     * @method       <get>
	     * @description  Retrieve the value in the collection that matches key
	     * @param        {Any} key
	     * @return       {Any}
	     */
	    function get(key){
	      return unwrap(this)[validate(key)][coerce(key)];
	    }
	    /**
	     * @method       <set>
	     * @description  Add or update a pair in the collection. Enforces uniqueness by overwriting.
	     * @param        {Any} key
	     * @param        {Any} val
	     **/
	    function set(key, value){
	      var items = unwrap(this),
	          data = items[validate(key)];

	      key = coerce(key);
	      key in data || items.size++;
	      data[key] = value;
	    }
	    /**
	     * @method       <has>
	     * @description  Check if key exists in the collection.
	     * @param        {Any} key
	     * @return       {Boolean} is in collection
	     **/
	    function has(key){
	      return coerce(key) in unwrap(this)[validate(key)];
	    }
	    /**
	     * @method       <delete>
	     * @description  Remove key and matching value if found
	     * @param        {Any} key
	     * @return       {Boolean} true if item was in collection
	     */
	    function delete_(key){
	      var items = unwrap(this),
	          data = items[validate(key)];

	      key = coerce(key);
	      if (key in data) {
	        delete data[key];
	        items.size--;
	        return true;
	      }

	      return false;
	    }
	    /**
	     * @method       <size>
	     * @description  Retrieve the amount of items in the collection
	     * @return       {Number}
	     */
	    function size(){
	      return unwrap(this).size;
	    }
	    /**
	     * @method       <forEach>
	     * @description  Loop through the collection raising callback for each
	     * @param        {Function} callback  `callback(value, key)`
	     * @param        {Object}   context    The `this` binding for callbacks, default null
	     */
	    function forEach(callback, context){
	      var data = unwrap(this);
	      context = context == null ? global : context;
	      for (var i=0; i < 3; i++)
	        for (var key in data[i])
	          call(callback, context, data[i][key], uncoerce(i, key), this);
	    }

	    delete_ = fixDelete(delete_, ['validate', 'unwrap', 'coerce'], [validate, unwrap, coerce]);
	    return [HashMap, get, set, has, delete_, size, forEach];
	  });


	  // ###########
	  // ### Map ###
	  // ###########

	  // if a fully implemented Map exists then use it
	  if ('Map' in global && 'forEach' in global.Map.prototype) {
	    M = exports.Map = global.Map;
	  } else {
	    M = exporter('Map', function(wrap, unwrap){
	      // attempt to use an existing partially implemented Map
	      var BuiltinMap = global.Map,
	          prototype = Map[prototype_],
	          wm = WM[prototype_],
	          hm = (BuiltinMap || HM)[prototype_],
	          mget    = [callbind(hm.get), callbind(wm.get)],
	          mset    = [callbind(hm.set), callbind(wm.set)],
	          mhas    = [callbind(hm.has), callbind(wm.has)],
	          mdelete = [callbind(hm['delete']), callbind(wm['delete'])];

	      var type = BuiltinMap
	        ? function(){ return 0 }
	        : function(o){ return +(typeof o === object_ ? o !== null : typeof o === function_) }

	      // if we have a builtin Map we can let it do most of the heavy lifting
	      var init = BuiltinMap
	        ? function(){ return { 0: new BuiltinMap } }
	        : function(){ return { 0: new HM, 1: new WM } };

	      /**
	       * @class         Map
	       * @description   Collection that allows any kind of value to be a key.
	       * @param         {Iterable} [iterable]  An item to populate the collection with.
	       */
	      function Map(iterable){
	        if (this === global || this == null || this === prototype)
	          return new Map(iterable);

	        var data = init();
	        data.keys = [];
	        data.values = [];
	        wrap(this, data);

	        var self = this;
	        iterable && initialize(iterable, function(value, key){
	          call(set, self, value, key);
	        });
	      }
	      /**
	       * @method       <get>
	       * @description  Retrieve the value in the collection that matches key
	       * @param        {Any} key
	       * @return       {Any}
	       */
	      function get(key){
	        var data = unwrap(this),
	            t = type(key);
	        return data.values[mget[t](data[t], key)];
	      }
	      /**
	       * @method       <set>
	       * @description  Add or update a pair in the collection. Enforces uniqueness by overwriting.
	       * @param        {Any} key
	       * @param        {Any} val
	       **/
	      function set(key, value){
	        var data = unwrap(this),
	            t = type(key),
	            index = mget[t](data[t], key);

	        if (index === undefined) {
	          mset[t](data[t], key, data.keys.length);
	          push(data.keys, key);
	          push(data.values, value);
	        } else {
	          data.keys[index] = key;
	          data.values[index] = value;
	        }
	      }
	      /**
	       * @method       <has>
	       * @description  Check if key exists in the collection.
	       * @param        {Any} key
	       * @return       {Boolean} is in collection
	       **/
	      function has(key){
	        var t = type(key);
	        return mhas[t](unwrap(this)[t], key);
	      }
	      /**
	       * @method       <delete>
	       * @description  Remove key and matching value if found
	       * @param        {Any} key
	       * @return       {Boolean} true if item was in collection
	       */
	      function delete_(key){
	        var data = unwrap(this),
	            t = type(key),
	            index = mget[t](data[t], key);

	        if (index === undefined)
	          return false;

	        mdelete[t](data[t], key);
	        splice(data.keys, index, 1);
	        splice(data.values, index, 1);
	        return true;
	      }
	      /**
	       * @method       <size>
	       * @description  Retrieve the amount of items in the collection
	       * @return       {Number}
	       */
	      function size(){
	        return unwrap(this).keys.length;
	      }
	      /**
	       * @method       <forEach>
	       * @description  Loop through the collection raising callback for each
	       * @param        {Function} callback  `callback(value, key)`
	       * @param        {Object}   context    The `this` binding for callbacks, default null
	       */
	      function forEach(callback, context){
	        var data = unwrap(this),
	            keys = data.keys,
	            values = data.values;

	        context = context == null ? global : context;

	        for (var i=0, len=keys.length; i < len; i++)
	          call(callback, context, values[i], keys[i], this);
	      }

	      delete_ = fixDelete(delete_,
	        ['type', 'unwrap', 'call', 'splice'],
	        [type, unwrap, call, splice]
	      );
	      return [Map, get, set, has, delete_, size, forEach];
	    });
	  }


	  // ###########
	  // ### Set ###
	  // ###########

	  exporter('Set', function(wrap, unwrap){
	    var prototype = Set[prototype_],
	        m = M[prototype_],
	        msize = callbind(m.size),
	        mforEach = callbind(m.forEach),
	        mget = callbind(m.get),
	        mset = callbind(m.set),
	        mhas = callbind(m.has),
	        mdelete = callbind(m['delete']);

	    /**
	     * @class        Set
	     * @description  Collection of values that enforces uniqueness.
	     * @param        {Iterable} [iterable]  An item to populate the collection with.
	     **/
	    function Set(iterable){
	      if (this === global || this == null || this === prototype)
	        return new Set(iterable);

	      wrap(this, new M);

	      var self = this;
	      iterable && initialize(iterable, function(value, key){
	        call(add, self, key);
	      });
	    }
	    /**
	     * @method       <add>
	     * @description  Insert value if not found, enforcing uniqueness.
	     * @param        {Any} val
	     */
	    function add(key){
	      mset(unwrap(this), key, key);
	    }
	    /**
	     * @method       <has>
	     * @description  Check if key exists in the collection.
	     * @param        {Any} key
	     * @return       {Boolean} is in collection
	     **/
	    function has(key){
	      return mhas(unwrap(this), key);
	    }
	    /**
	     * @method       <delete>
	     * @description  Remove key and matching value if found
	     * @param        {Any} key
	     * @return       {Boolean} true if item was in collection
	     */
	    function delete_(key){
	      return mdelete(unwrap(this), key);
	    }
	    /**
	     * @method       <size>
	     * @description  Retrieve the amount of items in the collection
	     * @return       {Number}
	     */
	    function size(){
	      return msize(unwrap(this));
	    }
	    /**
	     * @method       <forEach>
	     * @description  Loop through the collection raising callback for each. Index is simply the counter for the current iteration.
	     * @param        {Function} callback  `callback(value, index)`
	     * @param        {Object}   context    The `this` binding for callbacks, default null
	     */
	    function forEach(callback, context){
	      var index = 0,
	          self = this;
	      mforEach(unwrap(this), function(key){
	        call(callback, this, key, index++, self);
	      }, context);
	    }

	    delete_ = fixDelete(delete_, ['mdelete', 'unwrap'], [mdelete, unwrap]);
	    return [Set, add, has, delete_, size, forEach];
	  });
	}('string', 'object', 'function', 'prototype', 'toString',
	  Array, Object, Function, Function.prototype, (0, eval)('this'),
	  false ? this : exports, {});


/***/ },
/* 46 */
/***/ function(module, exports, __webpack_require__) {

	// Generated by CoffeeScript 1.7.1
	(function() {
	  var BOM, BOOL, CALLABLE, CODE, COFFEE_ALIASES, COFFEE_ALIAS_MAP, COFFEE_KEYWORDS, COMMENT, COMPARE, COMPOUND_ASSIGN, HEREDOC, HEREDOC_ILLEGAL, HEREDOC_INDENT, HEREGEX, HEREGEX_OMIT, IDENTIFIER, INDENTABLE_CLOSERS, INDEXABLE, INVERSES, JSTOKEN, JS_FORBIDDEN, JS_KEYWORDS, LINE_BREAK, LINE_CONTINUER, LOGIC, Lexer, MATH, MULTILINER, MULTI_DENT, NOT_REGEX, NOT_SPACED_REGEX, NUMBER, OPERATOR, REGEX, RELATION, RESERVED, Rewriter, SHIFT, SIMPLESTR, STRICT_PROSCRIBED, TRAILING_SPACES, UNARY, UNARY_MATH, WHITESPACE, compact, count, invertLiterate, key, last, locationDataToString, repeat, starts, throwSyntaxError, _ref, _ref1,
	    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

	  _ref = __webpack_require__(63), Rewriter = _ref.Rewriter, INVERSES = _ref.INVERSES;

	  _ref1 = __webpack_require__(48), count = _ref1.count, starts = _ref1.starts, compact = _ref1.compact, last = _ref1.last, repeat = _ref1.repeat, invertLiterate = _ref1.invertLiterate, locationDataToString = _ref1.locationDataToString, throwSyntaxError = _ref1.throwSyntaxError;

	  exports.Lexer = Lexer = (function() {
	    function Lexer() {}

	    Lexer.prototype.tokenize = function(code, opts) {
	      var consumed, i, tag, _ref2;
	      if (opts == null) {
	        opts = {};
	      }
	      this.literate = opts.literate;
	      this.indent = 0;
	      this.baseIndent = 0;
	      this.indebt = 0;
	      this.outdebt = 0;
	      this.indents = [];
	      this.ends = [];
	      this.tokens = [];
	      this.chunkLine = opts.line || 0;
	      this.chunkColumn = opts.column || 0;
	      code = this.clean(code);
	      i = 0;
	      while (this.chunk = code.slice(i)) {
	        consumed = this.identifierToken() || this.commentToken() || this.whitespaceToken() || this.lineToken() || this.heredocToken() || this.stringToken() || this.numberToken() || this.regexToken() || this.jsToken() || this.literalToken();
	        _ref2 = this.getLineAndColumnFromChunk(consumed), this.chunkLine = _ref2[0], this.chunkColumn = _ref2[1];
	        i += consumed;
	      }
	      this.closeIndentation();
	      if (tag = this.ends.pop()) {
	        this.error("missing " + tag);
	      }
	      if (opts.rewrite === false) {
	        return this.tokens;
	      }
	      return (new Rewriter).rewrite(this.tokens);
	    };

	    Lexer.prototype.clean = function(code) {
	      if (code.charCodeAt(0) === BOM) {
	        code = code.slice(1);
	      }
	      code = code.replace(/\r/g, '').replace(TRAILING_SPACES, '');
	      if (WHITESPACE.test(code)) {
	        code = "\n" + code;
	        this.chunkLine--;
	      }
	      if (this.literate) {
	        code = invertLiterate(code);
	      }
	      return code;
	    };

	    Lexer.prototype.identifierToken = function() {
	      var colon, colonOffset, forcedIdentifier, id, idLength, input, match, poppedToken, prev, tag, tagToken, _ref2, _ref3, _ref4;
	      if (!(match = IDENTIFIER.exec(this.chunk))) {
	        return 0;
	      }
	      input = match[0], id = match[1], colon = match[2];
	      idLength = id.length;
	      poppedToken = void 0;
	      if (id === 'own' && this.tag() === 'FOR') {
	        this.token('OWN', id);
	        return id.length;
	      }
	      forcedIdentifier = colon || (prev = last(this.tokens)) && (((_ref2 = prev[0]) === '.' || _ref2 === '?.' || _ref2 === '::' || _ref2 === '?::') || !prev.spaced && prev[0] === '@');
	      tag = 'IDENTIFIER';
	      if (!forcedIdentifier && (__indexOf.call(JS_KEYWORDS, id) >= 0 || __indexOf.call(COFFEE_KEYWORDS, id) >= 0)) {
	        tag = id.toUpperCase();
	        if (tag === 'WHEN' && (_ref3 = this.tag(), __indexOf.call(LINE_BREAK, _ref3) >= 0)) {
	          tag = 'LEADING_WHEN';
	        } else if (tag === 'FOR') {
	          this.seenFor = true;
	        } else if (tag === 'UNLESS') {
	          tag = 'IF';
	        } else if (__indexOf.call(UNARY, tag) >= 0) {
	          tag = 'UNARY';
	        } else if (__indexOf.call(RELATION, tag) >= 0) {
	          if (tag !== 'INSTANCEOF' && this.seenFor) {
	            tag = 'FOR' + tag;
	            this.seenFor = false;
	          } else {
	            tag = 'RELATION';
	            if (this.value() === '!') {
	              poppedToken = this.tokens.pop();
	              id = '!' + id;
	            }
	          }
	        }
	      }
	      if (__indexOf.call(JS_FORBIDDEN, id) >= 0) {
	        if (forcedIdentifier) {
	          tag = 'IDENTIFIER';
	          id = new String(id);
	          id.reserved = true;
	        } else if (__indexOf.call(RESERVED, id) >= 0) {
	          this.error("reserved word \"" + id + "\"");
	        }
	      }
	      if (!forcedIdentifier) {
	        if (__indexOf.call(COFFEE_ALIASES, id) >= 0) {
	          id = COFFEE_ALIAS_MAP[id];
	        }
	        tag = (function() {
	          switch (id) {
	            case '!':
	              return 'UNARY';
	            case '==':
	            case '!=':
	              return 'COMPARE';
	            case '&&':
	            case '||':
	              return 'LOGIC';
	            case 'true':
	            case 'false':
	              return 'BOOL';
	            case 'break':
	            case 'continue':
	              return 'STATEMENT';
	            default:
	              return tag;
	          }
	        })();
	      }
	      tagToken = this.token(tag, id, 0, idLength);
	      if (poppedToken) {
	        _ref4 = [poppedToken[2].first_line, poppedToken[2].first_column], tagToken[2].first_line = _ref4[0], tagToken[2].first_column = _ref4[1];
	      }
	      if (colon) {
	        colonOffset = input.lastIndexOf(':');
	        this.token(':', ':', colonOffset, colon.length);
	      }
	      return input.length;
	    };

	    Lexer.prototype.numberToken = function() {
	      var binaryLiteral, lexedLength, match, number, octalLiteral;
	      if (!(match = NUMBER.exec(this.chunk))) {
	        return 0;
	      }
	      number = match[0];
	      if (/^0[BOX]/.test(number)) {
	        this.error("radix prefix '" + number + "' must be lowercase");
	      } else if (/E/.test(number) && !/^0x/.test(number)) {
	        this.error("exponential notation '" + number + "' must be indicated with a lowercase 'e'");
	      } else if (/^0\d*[89]/.test(number)) {
	        this.error("decimal literal '" + number + "' must not be prefixed with '0'");
	      } else if (/^0\d+/.test(number)) {
	        this.error("octal literal '" + number + "' must be prefixed with '0o'");
	      }
	      lexedLength = number.length;
	      if (octalLiteral = /^0o([0-7]+)/.exec(number)) {
	        number = '0x' + parseInt(octalLiteral[1], 8).toString(16);
	      }
	      if (binaryLiteral = /^0b([01]+)/.exec(number)) {
	        number = '0x' + parseInt(binaryLiteral[1], 2).toString(16);
	      }
	      this.token('NUMBER', number, 0, lexedLength);
	      return lexedLength;
	    };

	    Lexer.prototype.stringToken = function() {
	      var octalEsc, quote, string, trimmed;
	      switch (quote = this.chunk.charAt(0)) {
	        case "'":
	          string = SIMPLESTR.exec(this.chunk)[0];
	          break;
	        case '"':
	          string = this.balancedString(this.chunk, '"');
	      }
	      if (!string) {
	        return 0;
	      }
	      trimmed = this.removeNewlines(string.slice(1, -1));
	      if (quote === '"' && 0 < string.indexOf('#{', 1)) {
	        this.interpolateString(trimmed, {
	          strOffset: 1,
	          lexedLength: string.length
	        });
	      } else {
	        this.token('STRING', quote + this.escapeLines(trimmed) + quote, 0, string.length);
	      }
	      if (octalEsc = /^(?:\\.|[^\\])*\\(?:0[0-7]|[1-7])/.test(string)) {
	        this.error("octal escape sequences " + string + " are not allowed");
	      }
	      return string.length;
	    };

	    Lexer.prototype.heredocToken = function() {
	      var doc, heredoc, match, quote;
	      if (!(match = HEREDOC.exec(this.chunk))) {
	        return 0;
	      }
	      heredoc = match[0];
	      quote = heredoc.charAt(0);
	      doc = this.sanitizeHeredoc(match[2], {
	        quote: quote,
	        indent: null
	      });
	      if (quote === '"' && 0 <= doc.indexOf('#{')) {
	        this.interpolateString(doc, {
	          heredoc: true,
	          strOffset: 3,
	          lexedLength: heredoc.length
	        });
	      } else {
	        this.token('STRING', this.makeString(doc, quote, true), 0, heredoc.length);
	      }
	      return heredoc.length;
	    };

	    Lexer.prototype.commentToken = function() {
	      var comment, here, match;
	      if (!(match = this.chunk.match(COMMENT))) {
	        return 0;
	      }
	      comment = match[0], here = match[1];
	      if (here) {
	        this.token('HERECOMMENT', this.sanitizeHeredoc(here, {
	          herecomment: true,
	          indent: repeat(' ', this.indent)
	        }), 0, comment.length);
	      }
	      return comment.length;
	    };

	    Lexer.prototype.jsToken = function() {
	      var match, script;
	      if (!(this.chunk.charAt(0) === '`' && (match = JSTOKEN.exec(this.chunk)))) {
	        return 0;
	      }
	      this.token('JS', (script = match[0]).slice(1, -1), 0, script.length);
	      return script.length;
	    };

	    Lexer.prototype.regexToken = function() {
	      var flags, length, match, prev, regex, _ref2, _ref3;
	      if (this.chunk.charAt(0) !== '/') {
	        return 0;
	      }
	      if (length = this.heregexToken()) {
	        return length;
	      }
	      prev = last(this.tokens);
	      if (prev && (_ref2 = prev[0], __indexOf.call((prev.spaced ? NOT_REGEX : NOT_SPACED_REGEX), _ref2) >= 0)) {
	        return 0;
	      }
	      if (!(match = REGEX.exec(this.chunk))) {
	        return 0;
	      }
	      _ref3 = match, match = _ref3[0], regex = _ref3[1], flags = _ref3[2];
	      if (regex === '//') {
	        return 0;
	      }
	      if (regex.slice(0, 2) === '/*') {
	        this.error('regular expressions cannot begin with `*`');
	      }
	      this.token('REGEX', "" + regex + flags, 0, match.length);
	      return match.length;
	    };

	    Lexer.prototype.heregexToken = function() {
	      var body, flags, flagsOffset, heregex, match, plusToken, prev, re, tag, token, tokens, value, _i, _len, _ref2, _ref3, _ref4;
	      if (!(match = HEREGEX.exec(this.chunk))) {
	        return 0;
	      }
	      heregex = match[0], body = match[1], flags = match[2];
	      if (0 > body.indexOf('#{')) {
	        re = this.escapeLines(body.replace(HEREGEX_OMIT, '$1$2').replace(/\//g, '\\/'), true);
	        if (re.match(/^\*/)) {
	          this.error('regular expressions cannot begin with `*`');
	        }
	        this.token('REGEX', "/" + (re || '(?:)') + "/" + flags, 0, heregex.length);
	        return heregex.length;
	      }
	      this.token('IDENTIFIER', 'RegExp', 0, 0);
	      this.token('CALL_START', '(', 0, 0);
	      tokens = [];
	      _ref2 = this.interpolateString(body, {
	        regex: true
	      });
	      for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
	        token = _ref2[_i];
	        tag = token[0], value = token[1];
	        if (tag === 'TOKENS') {
	          tokens.push.apply(tokens, value);
	        } else if (tag === 'NEOSTRING') {
	          if (!(value = value.replace(HEREGEX_OMIT, '$1$2'))) {
	            continue;
	          }
	          value = value.replace(/\\/g, '\\\\');
	          token[0] = 'STRING';
	          token[1] = this.makeString(value, '"', true);
	          tokens.push(token);
	        } else {
	          this.error("Unexpected " + tag);
	        }
	        prev = last(this.tokens);
	        plusToken = ['+', '+'];
	        plusToken[2] = prev[2];
	        tokens.push(plusToken);
	      }
	      tokens.pop();
	      if (((_ref3 = tokens[0]) != null ? _ref3[0] : void 0) !== 'STRING') {
	        this.token('STRING', '""', 0, 0);
	        this.token('+', '+', 0, 0);
	      }
	      (_ref4 = this.tokens).push.apply(_ref4, tokens);
	      if (flags) {
	        flagsOffset = heregex.lastIndexOf(flags);
	        this.token(',', ',', flagsOffset, 0);
	        this.token('STRING', '"' + flags + '"', flagsOffset, flags.length);
	      }
	      this.token(')', ')', heregex.length - 1, 0);
	      return heregex.length;
	    };

	    Lexer.prototype.lineToken = function() {
	      var diff, indent, match, noNewlines, size;
	      if (!(match = MULTI_DENT.exec(this.chunk))) {
	        return 0;
	      }
	      indent = match[0];
	      this.seenFor = false;
	      size = indent.length - 1 - indent.lastIndexOf('\n');
	      noNewlines = this.unfinished();
	      if (size - this.indebt === this.indent) {
	        if (noNewlines) {
	          this.suppressNewlines();
	        } else {
	          this.newlineToken(0);
	        }
	        return indent.length;
	      }
	      if (size > this.indent) {
	        if (noNewlines) {
	          this.indebt = size - this.indent;
	          this.suppressNewlines();
	          return indent.length;
	        }
	        if (!this.tokens.length) {
	          this.baseIndent = this.indent = size;
	          return indent.length;
	        }
	        diff = size - this.indent + this.outdebt;
	        this.token('INDENT', diff, indent.length - size, size);
	        this.indents.push(diff);
	        this.ends.push('OUTDENT');
	        this.outdebt = this.indebt = 0;
	        this.indent = size;
	      } else if (size < this.baseIndent) {
	        this.error('missing indentation', indent.length);
	      } else {
	        this.indebt = 0;
	        this.outdentToken(this.indent - size, noNewlines, indent.length);
	      }
	      return indent.length;
	    };

	    Lexer.prototype.outdentToken = function(moveOut, noNewlines, outdentLength) {
	      var decreasedIndent, dent, lastIndent, _ref2;
	      decreasedIndent = this.indent - moveOut;
	      while (moveOut > 0) {
	        lastIndent = this.indents[this.indents.length - 1];
	        if (!lastIndent) {
	          moveOut = 0;
	        } else if (lastIndent === this.outdebt) {
	          moveOut -= this.outdebt;
	          this.outdebt = 0;
	        } else if (lastIndent < this.outdebt) {
	          this.outdebt -= lastIndent;
	          moveOut -= lastIndent;
	        } else {
	          dent = this.indents.pop() + this.outdebt;
	          if (outdentLength && (_ref2 = this.chunk[outdentLength], __indexOf.call(INDENTABLE_CLOSERS, _ref2) >= 0)) {
	            decreasedIndent -= dent - moveOut;
	            moveOut = dent;
	          }
	          this.outdebt = 0;
	          this.pair('OUTDENT');
	          this.token('OUTDENT', moveOut, 0, outdentLength);
	          moveOut -= dent;
	        }
	      }
	      if (dent) {
	        this.outdebt -= moveOut;
	      }
	      while (this.value() === ';') {
	        this.tokens.pop();
	      }
	      if (!(this.tag() === 'TERMINATOR' || noNewlines)) {
	        this.token('TERMINATOR', '\n', outdentLength, 0);
	      }
	      this.indent = decreasedIndent;
	      return this;
	    };

	    Lexer.prototype.whitespaceToken = function() {
	      var match, nline, prev;
	      if (!((match = WHITESPACE.exec(this.chunk)) || (nline = this.chunk.charAt(0) === '\n'))) {
	        return 0;
	      }
	      prev = last(this.tokens);
	      if (prev) {
	        prev[match ? 'spaced' : 'newLine'] = true;
	      }
	      if (match) {
	        return match[0].length;
	      } else {
	        return 0;
	      }
	    };

	    Lexer.prototype.newlineToken = function(offset) {
	      while (this.value() === ';') {
	        this.tokens.pop();
	      }
	      if (this.tag() !== 'TERMINATOR') {
	        this.token('TERMINATOR', '\n', offset, 0);
	      }
	      return this;
	    };

	    Lexer.prototype.suppressNewlines = function() {
	      if (this.value() === '\\') {
	        this.tokens.pop();
	      }
	      return this;
	    };

	    Lexer.prototype.literalToken = function() {
	      var match, prev, tag, value, _ref2, _ref3, _ref4, _ref5;
	      if (match = OPERATOR.exec(this.chunk)) {
	        value = match[0];
	        if (CODE.test(value)) {
	          this.tagParameters();
	        }
	      } else {
	        value = this.chunk.charAt(0);
	      }
	      tag = value;
	      prev = last(this.tokens);
	      if (value === '=' && prev) {
	        if (!prev[1].reserved && (_ref2 = prev[1], __indexOf.call(JS_FORBIDDEN, _ref2) >= 0)) {
	          this.error("reserved word \"" + (this.value()) + "\" can't be assigned");
	        }
	        if ((_ref3 = prev[1]) === '||' || _ref3 === '&&') {
	          prev[0] = 'COMPOUND_ASSIGN';
	          prev[1] += '=';
	          return value.length;
	        }
	      }
	      if (value === ';') {
	        this.seenFor = false;
	        tag = 'TERMINATOR';
	      } else if (__indexOf.call(MATH, value) >= 0) {
	        tag = 'MATH';
	      } else if (__indexOf.call(COMPARE, value) >= 0) {
	        tag = 'COMPARE';
	      } else if (__indexOf.call(COMPOUND_ASSIGN, value) >= 0) {
	        tag = 'COMPOUND_ASSIGN';
	      } else if (__indexOf.call(UNARY, value) >= 0) {
	        tag = 'UNARY';
	      } else if (__indexOf.call(UNARY_MATH, value) >= 0) {
	        tag = 'UNARY_MATH';
	      } else if (__indexOf.call(SHIFT, value) >= 0) {
	        tag = 'SHIFT';
	      } else if (__indexOf.call(LOGIC, value) >= 0 || value === '?' && (prev != null ? prev.spaced : void 0)) {
	        tag = 'LOGIC';
	      } else if (prev && !prev.spaced) {
	        if (value === '(' && (_ref4 = prev[0], __indexOf.call(CALLABLE, _ref4) >= 0)) {
	          if (prev[0] === '?') {
	            prev[0] = 'FUNC_EXIST';
	          }
	          tag = 'CALL_START';
	        } else if (value === '[' && (_ref5 = prev[0], __indexOf.call(INDEXABLE, _ref5) >= 0)) {
	          tag = 'INDEX_START';
	          switch (prev[0]) {
	            case '?':
	              prev[0] = 'INDEX_SOAK';
	          }
	        }
	      }
	      switch (value) {
	        case '(':
	        case '{':
	        case '[':
	          this.ends.push(INVERSES[value]);
	          break;
	        case ')':
	        case '}':
	        case ']':
	          this.pair(value);
	      }
	      this.token(tag, value);
	      return value.length;
	    };

	    Lexer.prototype.sanitizeHeredoc = function(doc, options) {
	      var attempt, herecomment, indent, match, _ref2;
	      indent = options.indent, herecomment = options.herecomment;
	      if (herecomment) {
	        if (HEREDOC_ILLEGAL.test(doc)) {
	          this.error("block comment cannot contain \"*/\", starting");
	        }
	        if (doc.indexOf('\n') < 0) {
	          return doc;
	        }
	      } else {
	        while (match = HEREDOC_INDENT.exec(doc)) {
	          attempt = match[1];
	          if (indent === null || (0 < (_ref2 = attempt.length) && _ref2 < indent.length)) {
	            indent = attempt;
	          }
	        }
	      }
	      if (indent) {
	        doc = doc.replace(RegExp("\\n" + indent, "g"), '\n');
	      }
	      if (!herecomment) {
	        doc = doc.replace(/^\n/, '');
	      }
	      return doc;
	    };

	    Lexer.prototype.tagParameters = function() {
	      var i, stack, tok, tokens;
	      if (this.tag() !== ')') {
	        return this;
	      }
	      stack = [];
	      tokens = this.tokens;
	      i = tokens.length;
	      tokens[--i][0] = 'PARAM_END';
	      while (tok = tokens[--i]) {
	        switch (tok[0]) {
	          case ')':
	            stack.push(tok);
	            break;
	          case '(':
	          case 'CALL_START':
	            if (stack.length) {
	              stack.pop();
	            } else if (tok[0] === '(') {
	              tok[0] = 'PARAM_START';
	              return this;
	            } else {
	              return this;
	            }
	        }
	      }
	      return this;
	    };

	    Lexer.prototype.closeIndentation = function() {
	      return this.outdentToken(this.indent);
	    };

	    Lexer.prototype.balancedString = function(str, end) {
	      var continueCount, i, letter, match, prev, stack, _i, _ref2;
	      continueCount = 0;
	      stack = [end];
	      for (i = _i = 1, _ref2 = str.length; 1 <= _ref2 ? _i < _ref2 : _i > _ref2; i = 1 <= _ref2 ? ++_i : --_i) {
	        if (continueCount) {
	          --continueCount;
	          continue;
	        }
	        switch (letter = str.charAt(i)) {
	          case '\\':
	            ++continueCount;
	            continue;
	          case end:
	            stack.pop();
	            if (!stack.length) {
	              return str.slice(0, +i + 1 || 9e9);
	            }
	            end = stack[stack.length - 1];
	            continue;
	        }
	        if (end === '}' && (letter === '"' || letter === "'")) {
	          stack.push(end = letter);
	        } else if (end === '}' && letter === '/' && (match = HEREGEX.exec(str.slice(i)) || REGEX.exec(str.slice(i)))) {
	          continueCount += match[0].length - 1;
	        } else if (end === '}' && letter === '{') {
	          stack.push(end = '}');
	        } else if (end === '"' && prev === '#' && letter === '{') {
	          stack.push(end = '}');
	        }
	        prev = letter;
	      }
	      return this.error("missing " + (stack.pop()) + ", starting");
	    };

	    Lexer.prototype.interpolateString = function(str, options) {
	      var column, errorToken, expr, heredoc, i, inner, interpolated, len, letter, lexedLength, line, locationToken, nested, offsetInChunk, pi, plusToken, popped, regex, rparen, strOffset, tag, token, tokens, value, _i, _len, _ref2, _ref3, _ref4;
	      if (options == null) {
	        options = {};
	      }
	      heredoc = options.heredoc, regex = options.regex, offsetInChunk = options.offsetInChunk, strOffset = options.strOffset, lexedLength = options.lexedLength;
	      offsetInChunk || (offsetInChunk = 0);
	      strOffset || (strOffset = 0);
	      lexedLength || (lexedLength = str.length);
	      tokens = [];
	      pi = 0;
	      i = -1;
	      while (letter = str.charAt(i += 1)) {
	        if (letter === '\\') {
	          i += 1;
	          continue;
	        }
	        if (!(letter === '#' && str.charAt(i + 1) === '{' && (expr = this.balancedString(str.slice(i + 1), '}')))) {
	          continue;
	        }
	        if (pi < i) {
	          tokens.push(this.makeToken('NEOSTRING', str.slice(pi, i), strOffset + pi));
	        }
	        if (!errorToken) {
	          errorToken = this.makeToken('', 'string interpolation', offsetInChunk + i + 1, 2);
	        }
	        inner = expr.slice(1, -1);
	        if (inner.length) {
	          _ref2 = this.getLineAndColumnFromChunk(strOffset + i + 1), line = _ref2[0], column = _ref2[1];
	          nested = new Lexer().tokenize(inner, {
	            line: line,
	            column: column,
	            rewrite: false
	          });
	          popped = nested.pop();
	          if (((_ref3 = nested[0]) != null ? _ref3[0] : void 0) === 'TERMINATOR') {
	            popped = nested.shift();
	          }
	          if (len = nested.length) {
	            if (len > 1) {
	              nested.unshift(this.makeToken('(', '(', strOffset + i + 1, 0));
	              nested.push(this.makeToken(')', ')', strOffset + i + 1 + inner.length, 0));
	            }
	            tokens.push(['TOKENS', nested]);
	          }
	        }
	        i += expr.length;
	        pi = i + 1;
	      }
	      if ((i > pi && pi < str.length)) {
	        tokens.push(this.makeToken('NEOSTRING', str.slice(pi), strOffset + pi));
	      }
	      if (regex) {
	        return tokens;
	      }
	      if (!tokens.length) {
	        return this.token('STRING', '""', offsetInChunk, lexedLength);
	      }
	      if (tokens[0][0] !== 'NEOSTRING') {
	        tokens.unshift(this.makeToken('NEOSTRING', '', offsetInChunk));
	      }
	      if (interpolated = tokens.length > 1) {
	        this.token('(', '(', offsetInChunk, 0, errorToken);
	      }
	      for (i = _i = 0, _len = tokens.length; _i < _len; i = ++_i) {
	        token = tokens[i];
	        tag = token[0], value = token[1];
	        if (i) {
	          if (i) {
	            plusToken = this.token('+', '+');
	          }
	          locationToken = tag === 'TOKENS' ? value[0] : token;
	          plusToken[2] = {
	            first_line: locationToken[2].first_line,
	            first_column: locationToken[2].first_column,
	            last_line: locationToken[2].first_line,
	            last_column: locationToken[2].first_column
	          };
	        }
	        if (tag === 'TOKENS') {
	          (_ref4 = this.tokens).push.apply(_ref4, value);
	        } else if (tag === 'NEOSTRING') {
	          token[0] = 'STRING';
	          token[1] = this.makeString(value, '"', heredoc);
	          this.tokens.push(token);
	        } else {
	          this.error("Unexpected " + tag);
	        }
	      }
	      if (interpolated) {
	        rparen = this.makeToken(')', ')', offsetInChunk + lexedLength, 0);
	        rparen.stringEnd = true;
	        this.tokens.push(rparen);
	      }
	      return tokens;
	    };

	    Lexer.prototype.pair = function(tag) {
	      var wanted;
	      if (tag !== (wanted = last(this.ends))) {
	        if ('OUTDENT' !== wanted) {
	          this.error("unmatched " + tag);
	        }
	        this.outdentToken(last(this.indents), true);
	        return this.pair(tag);
	      }
	      return this.ends.pop();
	    };

	    Lexer.prototype.getLineAndColumnFromChunk = function(offset) {
	      var column, lineCount, lines, string;
	      if (offset === 0) {
	        return [this.chunkLine, this.chunkColumn];
	      }
	      if (offset >= this.chunk.length) {
	        string = this.chunk;
	      } else {
	        string = this.chunk.slice(0, +(offset - 1) + 1 || 9e9);
	      }
	      lineCount = count(string, '\n');
	      column = this.chunkColumn;
	      if (lineCount > 0) {
	        lines = string.split('\n');
	        column = last(lines).length;
	      } else {
	        column += string.length;
	      }
	      return [this.chunkLine + lineCount, column];
	    };

	    Lexer.prototype.makeToken = function(tag, value, offsetInChunk, length) {
	      var lastCharacter, locationData, token, _ref2, _ref3;
	      if (offsetInChunk == null) {
	        offsetInChunk = 0;
	      }
	      if (length == null) {
	        length = value.length;
	      }
	      locationData = {};
	      _ref2 = this.getLineAndColumnFromChunk(offsetInChunk), locationData.first_line = _ref2[0], locationData.first_column = _ref2[1];
	      lastCharacter = Math.max(0, length - 1);
	      _ref3 = this.getLineAndColumnFromChunk(offsetInChunk + lastCharacter), locationData.last_line = _ref3[0], locationData.last_column = _ref3[1];
	      token = [tag, value, locationData];
	      return token;
	    };

	    Lexer.prototype.token = function(tag, value, offsetInChunk, length, origin) {
	      var token;
	      token = this.makeToken(tag, value, offsetInChunk, length);
	      if (origin) {
	        token.origin = origin;
	      }
	      this.tokens.push(token);
	      return token;
	    };

	    Lexer.prototype.tag = function(index, tag) {
	      var tok;
	      return (tok = last(this.tokens, index)) && (tag ? tok[0] = tag : tok[0]);
	    };

	    Lexer.prototype.value = function(index, val) {
	      var tok;
	      return (tok = last(this.tokens, index)) && (val ? tok[1] = val : tok[1]);
	    };

	    Lexer.prototype.unfinished = function() {
	      var _ref2;
	      return LINE_CONTINUER.test(this.chunk) || ((_ref2 = this.tag()) === '\\' || _ref2 === '.' || _ref2 === '?.' || _ref2 === '?::' || _ref2 === 'UNARY' || _ref2 === 'MATH' || _ref2 === 'UNARY_MATH' || _ref2 === '+' || _ref2 === '-' || _ref2 === '**' || _ref2 === 'SHIFT' || _ref2 === 'RELATION' || _ref2 === 'COMPARE' || _ref2 === 'LOGIC' || _ref2 === 'THROW' || _ref2 === 'EXTENDS');
	    };

	    Lexer.prototype.removeNewlines = function(str) {
	      return str.replace(/^\s*\n\s*/, '').replace(/([^\\]|\\\\)\s*\n\s*$/, '$1');
	    };

	    Lexer.prototype.escapeLines = function(str, heredoc) {
	      str = str.replace(/\\[^\S\n]*(\n|\\)\s*/g, function(escaped, character) {
	        if (character === '\n') {
	          return '';
	        } else {
	          return escaped;
	        }
	      });
	      if (heredoc) {
	        return str.replace(MULTILINER, '\\n');
	      } else {
	        return str.replace(/\s*\n\s*/g, ' ');
	      }
	    };

	    Lexer.prototype.makeString = function(body, quote, heredoc) {
	      if (!body) {
	        return quote + quote;
	      }
	      body = body.replace(RegExp("\\\\(" + quote + "|\\\\)", "g"), function(match, contents) {
	        if (contents === quote) {
	          return contents;
	        } else {
	          return match;
	        }
	      });
	      body = body.replace(RegExp("" + quote, "g"), '\\$&');
	      return quote + this.escapeLines(body, heredoc) + quote;
	    };

	    Lexer.prototype.error = function(message, offset) {
	      var first_column, first_line, _ref2;
	      if (offset == null) {
	        offset = 0;
	      }
	      _ref2 = this.getLineAndColumnFromChunk(offset), first_line = _ref2[0], first_column = _ref2[1];
	      return throwSyntaxError(message, {
	        first_line: first_line,
	        first_column: first_column
	      });
	    };

	    return Lexer;

	  })();

	  JS_KEYWORDS = ['true', 'false', 'null', 'this', 'new', 'delete', 'typeof', 'in', 'instanceof', 'return', 'throw', 'break', 'continue', 'debugger', 'if', 'else', 'switch', 'for', 'while', 'do', 'try', 'catch', 'finally', 'class', 'extends', 'super'];

	  COFFEE_KEYWORDS = ['undefined', 'then', 'unless', 'until', 'loop', 'of', 'by', 'when'];

	  COFFEE_ALIAS_MAP = {
	    and: '&&',
	    or: '||',
	    is: '==',
	    isnt: '!=',
	    not: '!',
	    yes: 'true',
	    no: 'false',
	    on: 'true',
	    off: 'false'
	  };

	  COFFEE_ALIASES = (function() {
	    var _results;
	    _results = [];
	    for (key in COFFEE_ALIAS_MAP) {
	      _results.push(key);
	    }
	    return _results;
	  })();

	  COFFEE_KEYWORDS = COFFEE_KEYWORDS.concat(COFFEE_ALIASES);

	  RESERVED = ['case', 'default', 'function', 'var', 'void', 'with', 'const', 'let', 'enum', 'export', 'import', 'native', '__hasProp', '__extends', '__slice', '__bind', '__indexOf', 'implements', 'interface', 'package', 'private', 'protected', 'public', 'static', 'yield'];

	  STRICT_PROSCRIBED = ['arguments', 'eval'];

	  JS_FORBIDDEN = JS_KEYWORDS.concat(RESERVED).concat(STRICT_PROSCRIBED);

	  exports.RESERVED = RESERVED.concat(JS_KEYWORDS).concat(COFFEE_KEYWORDS).concat(STRICT_PROSCRIBED);

	  exports.STRICT_PROSCRIBED = STRICT_PROSCRIBED;

	  BOM = 65279;

	  IDENTIFIER = /^([$A-Za-z_\x7f-\uffff][$\w\x7f-\uffff]*)([^\n\S]*:(?!:))?/;

	  NUMBER = /^0b[01]+|^0o[0-7]+|^0x[\da-f]+|^\d*\.?\d+(?:e[+-]?\d+)?/i;

	  HEREDOC = /^("""|''')((?:\\[\s\S]|[^\\])*?)(?:\n[^\n\S]*)?\1/;

	  OPERATOR = /^(?:[-=]>|[-+*\/%<>&|^!?=]=|>>>=?|([-+:])\1|([&|<>*\/%])\2=?|\?(\.|::)|\.{2,3})/;

	  WHITESPACE = /^[^\n\S]+/;

	  COMMENT = /^###([^#][\s\S]*?)(?:###[^\n\S]*|###$)|^(?:\s*#(?!##[^#]).*)+/;

	  CODE = /^[-=]>/;

	  MULTI_DENT = /^(?:\n[^\n\S]*)+/;

	  SIMPLESTR = /^'[^\\']*(?:\\[\s\S][^\\']*)*'/;

	  JSTOKEN = /^`[^\\`]*(?:\\.[^\\`]*)*`/;

	  REGEX = /^(\/(?![\s=])[^[\/\n\\]*(?:(?:\\[\s\S]|\[[^\]\n\\]*(?:\\[\s\S][^\]\n\\]*)*])[^[\/\n\\]*)*\/)([imgy]{0,4})(?!\w)/;

	  HEREGEX = /^\/{3}((?:\\?[\s\S])+?)\/{3}([imgy]{0,4})(?!\w)/;

	  HEREGEX_OMIT = /((?:\\\\)+)|\\(\s|\/)|\s+(?:#.*)?/g;

	  MULTILINER = /\n/g;

	  HEREDOC_INDENT = /\n+([^\n\S]*)/g;

	  HEREDOC_ILLEGAL = /\*\//;

	  LINE_CONTINUER = /^\s*(?:,|\??\.(?![.\d])|::)/;

	  TRAILING_SPACES = /\s+$/;

	  COMPOUND_ASSIGN = ['-=', '+=', '/=', '*=', '%=', '||=', '&&=', '?=', '<<=', '>>=', '>>>=', '&=', '^=', '|=', '**=', '//=', '%%='];

	  UNARY = ['NEW', 'TYPEOF', 'DELETE', 'DO'];

	  UNARY_MATH = ['!', '~'];

	  LOGIC = ['&&', '||', '&', '|', '^'];

	  SHIFT = ['<<', '>>', '>>>'];

	  COMPARE = ['==', '!=', '<', '>', '<=', '>='];

	  MATH = ['*', '/', '%', '//', '%%'];

	  RELATION = ['IN', 'OF', 'INSTANCEOF'];

	  BOOL = ['TRUE', 'FALSE'];

	  NOT_REGEX = ['NUMBER', 'REGEX', 'BOOL', 'NULL', 'UNDEFINED', '++', '--'];

	  NOT_SPACED_REGEX = NOT_REGEX.concat(')', '}', 'THIS', 'IDENTIFIER', 'STRING', ']');

	  CALLABLE = ['IDENTIFIER', 'STRING', 'REGEX', ')', ']', '}', '?', '::', '@', 'THIS', 'SUPER'];

	  INDEXABLE = CALLABLE.concat('NUMBER', 'BOOL', 'NULL', 'UNDEFINED');

	  LINE_BREAK = ['INDENT', 'OUTDENT', 'TERMINATOR'];

	  INDENTABLE_CLOSERS = [')', '}', ']'];

	}).call(this);


/***/ },
/* 47 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(process, module) {/* parser generated by jison 0.4.13 */
	/*
	  Returns a Parser object of the following structure:

	  Parser: {
	    yy: {}
	  }

	  Parser.prototype: {
	    yy: {},
	    trace: function(),
	    symbols_: {associative list: name ==> number},
	    terminals_: {associative list: number ==> name},
	    productions_: [...],
	    performAction: function anonymous(yytext, yyleng, yylineno, yy, yystate, $$, _$),
	    table: [...],
	    defaultActions: {...},
	    parseError: function(str, hash),
	    parse: function(input),

	    lexer: {
	        EOF: 1,
	        parseError: function(str, hash),
	        setInput: function(input),
	        input: function(),
	        unput: function(str),
	        more: function(),
	        less: function(n),
	        pastInput: function(),
	        upcomingInput: function(),
	        showPosition: function(),
	        test_match: function(regex_match_array, rule_index),
	        next: function(),
	        lex: function(),
	        begin: function(condition),
	        popState: function(),
	        _currentRules: function(),
	        topState: function(),
	        pushState: function(condition),

	        options: {
	            ranges: boolean           (optional: true ==> token location info will include a .range[] member)
	            flex: boolean             (optional: true ==> flex-like lexing behaviour where the rules are tested exhaustively to find the longest match)
	            backtrack_lexer: boolean  (optional: true ==> lexer regexes are tested in order and for each matching regex the action code is invoked; the lexer terminates the scan when a token is returned by the action code)
	        },

	        performAction: function(yy, yy_, $avoiding_name_collisions, YY_START),
	        rules: [...],
	        conditions: {associative list: name ==> set},
	    }
	  }


	  token location info (@$, _$, etc.): {
	    first_line: n,
	    last_line: n,
	    first_column: n,
	    last_column: n,
	    range: [start_number, end_number]       (where the numbers are indexes into the input string, regular zero-based)
	  }


	  the parseError function receives a 'hash' object with these members for lexer and parser errors: {
	    text:        (matched text)
	    token:       (the produced terminal token, if any)
	    line:        (yylineno)
	  }
	  while parser (grammar) errors will also provide these members, i.e. parser errors deliver a superset of attributes: {
	    loc:         (yylloc)
	    expected:    (string describing the set of expected tokens)
	    recoverable: (boolean: TRUE when the parser has a error recovery rule available for this particular error)
	  }
	*/
	var parser = (function(){
	var parser = {trace: function trace() { },
	yy: {},
	symbols_: {"error":2,"Root":3,"Body":4,"Line":5,"TERMINATOR":6,"Expression":7,"Statement":8,"Return":9,"Comment":10,"STATEMENT":11,"Value":12,"Invocation":13,"Code":14,"Operation":15,"Assign":16,"If":17,"Try":18,"While":19,"For":20,"Switch":21,"Class":22,"Throw":23,"Block":24,"INDENT":25,"OUTDENT":26,"Identifier":27,"IDENTIFIER":28,"AlphaNumeric":29,"NUMBER":30,"STRING":31,"Literal":32,"JS":33,"REGEX":34,"DEBUGGER":35,"UNDEFINED":36,"NULL":37,"BOOL":38,"Assignable":39,"=":40,"AssignObj":41,"ObjAssignable":42,":":43,"ThisProperty":44,"RETURN":45,"HERECOMMENT":46,"PARAM_START":47,"ParamList":48,"PARAM_END":49,"FuncGlyph":50,"->":51,"=>":52,"OptComma":53,",":54,"Param":55,"ParamVar":56,"...":57,"Array":58,"Object":59,"Splat":60,"SimpleAssignable":61,"Accessor":62,"Parenthetical":63,"Range":64,"This":65,".":66,"?.":67,"::":68,"?::":69,"Index":70,"INDEX_START":71,"IndexValue":72,"INDEX_END":73,"INDEX_SOAK":74,"Slice":75,"{":76,"AssignList":77,"}":78,"CLASS":79,"EXTENDS":80,"OptFuncExist":81,"Arguments":82,"SUPER":83,"FUNC_EXIST":84,"CALL_START":85,"CALL_END":86,"ArgList":87,"THIS":88,"@":89,"[":90,"]":91,"RangeDots":92,"..":93,"Arg":94,"SimpleArgs":95,"TRY":96,"Catch":97,"FINALLY":98,"CATCH":99,"THROW":100,"(":101,")":102,"WhileSource":103,"WHILE":104,"WHEN":105,"UNTIL":106,"Loop":107,"LOOP":108,"ForBody":109,"FOR":110,"ForStart":111,"ForSource":112,"ForVariables":113,"OWN":114,"ForValue":115,"FORIN":116,"FOROF":117,"BY":118,"SWITCH":119,"Whens":120,"ELSE":121,"When":122,"LEADING_WHEN":123,"IfBlock":124,"IF":125,"POST_IF":126,"UNARY":127,"UNARY_MATH":128,"-":129,"+":130,"--":131,"++":132,"?":133,"MATH":134,"**":135,"SHIFT":136,"COMPARE":137,"LOGIC":138,"RELATION":139,"COMPOUND_ASSIGN":140,"$accept":0,"$end":1},
	terminals_: {2:"error",6:"TERMINATOR",11:"STATEMENT",25:"INDENT",26:"OUTDENT",28:"IDENTIFIER",30:"NUMBER",31:"STRING",33:"JS",34:"REGEX",35:"DEBUGGER",36:"UNDEFINED",37:"NULL",38:"BOOL",40:"=",43:":",45:"RETURN",46:"HERECOMMENT",47:"PARAM_START",49:"PARAM_END",51:"->",52:"=>",54:",",57:"...",66:".",67:"?.",68:"::",69:"?::",71:"INDEX_START",73:"INDEX_END",74:"INDEX_SOAK",76:"{",78:"}",79:"CLASS",80:"EXTENDS",83:"SUPER",84:"FUNC_EXIST",85:"CALL_START",86:"CALL_END",88:"THIS",89:"@",90:"[",91:"]",93:"..",96:"TRY",98:"FINALLY",99:"CATCH",100:"THROW",101:"(",102:")",104:"WHILE",105:"WHEN",106:"UNTIL",108:"LOOP",110:"FOR",114:"OWN",116:"FORIN",117:"FOROF",118:"BY",119:"SWITCH",121:"ELSE",123:"LEADING_WHEN",125:"IF",126:"POST_IF",127:"UNARY",128:"UNARY_MATH",129:"-",130:"+",131:"--",132:"++",133:"?",134:"MATH",135:"**",136:"SHIFT",137:"COMPARE",138:"LOGIC",139:"RELATION",140:"COMPOUND_ASSIGN"},
	productions_: [0,[3,0],[3,1],[4,1],[4,3],[4,2],[5,1],[5,1],[8,1],[8,1],[8,1],[7,1],[7,1],[7,1],[7,1],[7,1],[7,1],[7,1],[7,1],[7,1],[7,1],[7,1],[7,1],[24,2],[24,3],[27,1],[29,1],[29,1],[32,1],[32,1],[32,1],[32,1],[32,1],[32,1],[32,1],[16,3],[16,4],[16,5],[41,1],[41,3],[41,5],[41,1],[42,1],[42,1],[42,1],[9,2],[9,1],[10,1],[14,5],[14,2],[50,1],[50,1],[53,0],[53,1],[48,0],[48,1],[48,3],[48,4],[48,6],[55,1],[55,2],[55,3],[55,1],[56,1],[56,1],[56,1],[56,1],[60,2],[61,1],[61,2],[61,2],[61,1],[39,1],[39,1],[39,1],[12,1],[12,1],[12,1],[12,1],[12,1],[62,2],[62,2],[62,2],[62,2],[62,1],[62,1],[70,3],[70,2],[72,1],[72,1],[59,4],[77,0],[77,1],[77,3],[77,4],[77,6],[22,1],[22,2],[22,3],[22,4],[22,2],[22,3],[22,4],[22,5],[13,3],[13,3],[13,1],[13,2],[81,0],[81,1],[82,2],[82,4],[65,1],[65,1],[44,2],[58,2],[58,4],[92,1],[92,1],[64,5],[75,3],[75,2],[75,2],[75,1],[87,1],[87,3],[87,4],[87,4],[87,6],[94,1],[94,1],[94,1],[95,1],[95,3],[18,2],[18,3],[18,4],[18,5],[97,3],[97,3],[97,2],[23,2],[63,3],[63,5],[103,2],[103,4],[103,2],[103,4],[19,2],[19,2],[19,2],[19,1],[107,2],[107,2],[20,2],[20,2],[20,2],[109,2],[109,2],[111,2],[111,3],[115,1],[115,1],[115,1],[115,1],[113,1],[113,3],[112,2],[112,2],[112,4],[112,4],[112,4],[112,6],[112,6],[21,5],[21,7],[21,4],[21,6],[120,1],[120,2],[122,3],[122,4],[124,3],[124,5],[17,1],[17,3],[17,3],[17,3],[15,2],[15,2],[15,2],[15,2],[15,2],[15,2],[15,2],[15,2],[15,2],[15,3],[15,3],[15,3],[15,3],[15,3],[15,3],[15,3],[15,3],[15,3],[15,5],[15,4],[15,3]],
	performAction: function anonymous(yytext, yyleng, yylineno, yy, yystate /* action[1] */, $$ /* vstack */, _$ /* lstack */) {
	/* this == yyval */

	var $0 = $$.length - 1;
	switch (yystate) {
	case 1:return this.$ = yy.addLocationDataFn(_$[$0], _$[$0])(new yy.Block);
	break;
	case 2:return this.$ = $$[$0];
	break;
	case 3:this.$ = yy.addLocationDataFn(_$[$0], _$[$0])(yy.Block.wrap([$$[$0]]));
	break;
	case 4:this.$ = yy.addLocationDataFn(_$[$0-2], _$[$0])($$[$0-2].push($$[$0]));
	break;
	case 5:this.$ = $$[$0-1];
	break;
	case 6:this.$ = $$[$0];
	break;
	case 7:this.$ = $$[$0];
	break;
	case 8:this.$ = $$[$0];
	break;
	case 9:this.$ = $$[$0];
	break;
	case 10:this.$ = yy.addLocationDataFn(_$[$0], _$[$0])(new yy.Literal($$[$0]));
	break;
	case 11:this.$ = $$[$0];
	break;
	case 12:this.$ = $$[$0];
	break;
	case 13:this.$ = $$[$0];
	break;
	case 14:this.$ = $$[$0];
	break;
	case 15:this.$ = $$[$0];
	break;
	case 16:this.$ = $$[$0];
	break;
	case 17:this.$ = $$[$0];
	break;
	case 18:this.$ = $$[$0];
	break;
	case 19:this.$ = $$[$0];
	break;
	case 20:this.$ = $$[$0];
	break;
	case 21:this.$ = $$[$0];
	break;
	case 22:this.$ = $$[$0];
	break;
	case 23:this.$ = yy.addLocationDataFn(_$[$0-1], _$[$0])(new yy.Block);
	break;
	case 24:this.$ = yy.addLocationDataFn(_$[$0-2], _$[$0])($$[$0-1]);
	break;
	case 25:this.$ = yy.addLocationDataFn(_$[$0], _$[$0])(new yy.Literal($$[$0]));
	break;
	case 26:this.$ = yy.addLocationDataFn(_$[$0], _$[$0])(new yy.Literal($$[$0]));
	break;
	case 27:this.$ = yy.addLocationDataFn(_$[$0], _$[$0])(new yy.Literal($$[$0]));
	break;
	case 28:this.$ = $$[$0];
	break;
	case 29:this.$ = yy.addLocationDataFn(_$[$0], _$[$0])(new yy.Literal($$[$0]));
	break;
	case 30:this.$ = yy.addLocationDataFn(_$[$0], _$[$0])(new yy.Literal($$[$0]));
	break;
	case 31:this.$ = yy.addLocationDataFn(_$[$0], _$[$0])(new yy.Literal($$[$0]));
	break;
	case 32:this.$ = yy.addLocationDataFn(_$[$0], _$[$0])(new yy.Undefined);
	break;
	case 33:this.$ = yy.addLocationDataFn(_$[$0], _$[$0])(new yy.Null);
	break;
	case 34:this.$ = yy.addLocationDataFn(_$[$0], _$[$0])(new yy.Bool($$[$0]));
	break;
	case 35:this.$ = yy.addLocationDataFn(_$[$0-2], _$[$0])(new yy.Assign($$[$0-2], $$[$0]));
	break;
	case 36:this.$ = yy.addLocationDataFn(_$[$0-3], _$[$0])(new yy.Assign($$[$0-3], $$[$0]));
	break;
	case 37:this.$ = yy.addLocationDataFn(_$[$0-4], _$[$0])(new yy.Assign($$[$0-4], $$[$0-1]));
	break;
	case 38:this.$ = yy.addLocationDataFn(_$[$0], _$[$0])(new yy.Value($$[$0]));
	break;
	case 39:this.$ = yy.addLocationDataFn(_$[$0-2], _$[$0])(new yy.Assign(yy.addLocationDataFn(_$[$0-2])(new yy.Value($$[$0-2])), $$[$0], 'object'));
	break;
	case 40:this.$ = yy.addLocationDataFn(_$[$0-4], _$[$0])(new yy.Assign(yy.addLocationDataFn(_$[$0-4])(new yy.Value($$[$0-4])), $$[$0-1], 'object'));
	break;
	case 41:this.$ = $$[$0];
	break;
	case 42:this.$ = $$[$0];
	break;
	case 43:this.$ = $$[$0];
	break;
	case 44:this.$ = $$[$0];
	break;
	case 45:this.$ = yy.addLocationDataFn(_$[$0-1], _$[$0])(new yy.Return($$[$0]));
	break;
	case 46:this.$ = yy.addLocationDataFn(_$[$0], _$[$0])(new yy.Return);
	break;
	case 47:this.$ = yy.addLocationDataFn(_$[$0], _$[$0])(new yy.Comment($$[$0]));
	break;
	case 48:this.$ = yy.addLocationDataFn(_$[$0-4], _$[$0])(new yy.Code($$[$0-3], $$[$0], $$[$0-1]));
	break;
	case 49:this.$ = yy.addLocationDataFn(_$[$0-1], _$[$0])(new yy.Code([], $$[$0], $$[$0-1]));
	break;
	case 50:this.$ = yy.addLocationDataFn(_$[$0], _$[$0])('func');
	break;
	case 51:this.$ = yy.addLocationDataFn(_$[$0], _$[$0])('boundfunc');
	break;
	case 52:this.$ = $$[$0];
	break;
	case 53:this.$ = $$[$0];
	break;
	case 54:this.$ = yy.addLocationDataFn(_$[$0], _$[$0])([]);
	break;
	case 55:this.$ = yy.addLocationDataFn(_$[$0], _$[$0])([$$[$0]]);
	break;
	case 56:this.$ = yy.addLocationDataFn(_$[$0-2], _$[$0])($$[$0-2].concat($$[$0]));
	break;
	case 57:this.$ = yy.addLocationDataFn(_$[$0-3], _$[$0])($$[$0-3].concat($$[$0]));
	break;
	case 58:this.$ = yy.addLocationDataFn(_$[$0-5], _$[$0])($$[$0-5].concat($$[$0-2]));
	break;
	case 59:this.$ = yy.addLocationDataFn(_$[$0], _$[$0])(new yy.Param($$[$0]));
	break;
	case 60:this.$ = yy.addLocationDataFn(_$[$0-1], _$[$0])(new yy.Param($$[$0-1], null, true));
	break;
	case 61:this.$ = yy.addLocationDataFn(_$[$0-2], _$[$0])(new yy.Param($$[$0-2], $$[$0]));
	break;
	case 62:this.$ = yy.addLocationDataFn(_$[$0], _$[$0])(new yy.Expansion);
	break;
	case 63:this.$ = $$[$0];
	break;
	case 64:this.$ = $$[$0];
	break;
	case 65:this.$ = $$[$0];
	break;
	case 66:this.$ = $$[$0];
	break;
	case 67:this.$ = yy.addLocationDataFn(_$[$0-1], _$[$0])(new yy.Splat($$[$0-1]));
	break;
	case 68:this.$ = yy.addLocationDataFn(_$[$0], _$[$0])(new yy.Value($$[$0]));
	break;
	case 69:this.$ = yy.addLocationDataFn(_$[$0-1], _$[$0])($$[$0-1].add($$[$0]));
	break;
	case 70:this.$ = yy.addLocationDataFn(_$[$0-1], _$[$0])(new yy.Value($$[$0-1], [].concat($$[$0])));
	break;
	case 71:this.$ = $$[$0];
	break;
	case 72:this.$ = $$[$0];
	break;
	case 73:this.$ = yy.addLocationDataFn(_$[$0], _$[$0])(new yy.Value($$[$0]));
	break;
	case 74:this.$ = yy.addLocationDataFn(_$[$0], _$[$0])(new yy.Value($$[$0]));
	break;
	case 75:this.$ = $$[$0];
	break;
	case 76:this.$ = yy.addLocationDataFn(_$[$0], _$[$0])(new yy.Value($$[$0]));
	break;
	case 77:this.$ = yy.addLocationDataFn(_$[$0], _$[$0])(new yy.Value($$[$0]));
	break;
	case 78:this.$ = yy.addLocationDataFn(_$[$0], _$[$0])(new yy.Value($$[$0]));
	break;
	case 79:this.$ = $$[$0];
	break;
	case 80:this.$ = yy.addLocationDataFn(_$[$0-1], _$[$0])(new yy.Access($$[$0]));
	break;
	case 81:this.$ = yy.addLocationDataFn(_$[$0-1], _$[$0])(new yy.Access($$[$0], 'soak'));
	break;
	case 82:this.$ = yy.addLocationDataFn(_$[$0-1], _$[$0])([yy.addLocationDataFn(_$[$0-1])(new yy.Access(new yy.Literal('prototype'))), yy.addLocationDataFn(_$[$0])(new yy.Access($$[$0]))]);
	break;
	case 83:this.$ = yy.addLocationDataFn(_$[$0-1], _$[$0])([yy.addLocationDataFn(_$[$0-1])(new yy.Access(new yy.Literal('prototype'), 'soak')), yy.addLocationDataFn(_$[$0])(new yy.Access($$[$0]))]);
	break;
	case 84:this.$ = yy.addLocationDataFn(_$[$0], _$[$0])(new yy.Access(new yy.Literal('prototype')));
	break;
	case 85:this.$ = $$[$0];
	break;
	case 86:this.$ = yy.addLocationDataFn(_$[$0-2], _$[$0])($$[$0-1]);
	break;
	case 87:this.$ = yy.addLocationDataFn(_$[$0-1], _$[$0])(yy.extend($$[$0], {
	          soak: true
	        }));
	break;
	case 88:this.$ = yy.addLocationDataFn(_$[$0], _$[$0])(new yy.Index($$[$0]));
	break;
	case 89:this.$ = yy.addLocationDataFn(_$[$0], _$[$0])(new yy.Slice($$[$0]));
	break;
	case 90:this.$ = yy.addLocationDataFn(_$[$0-3], _$[$0])(new yy.Obj($$[$0-2], $$[$0-3].generated));
	break;
	case 91:this.$ = yy.addLocationDataFn(_$[$0], _$[$0])([]);
	break;
	case 92:this.$ = yy.addLocationDataFn(_$[$0], _$[$0])([$$[$0]]);
	break;
	case 93:this.$ = yy.addLocationDataFn(_$[$0-2], _$[$0])($$[$0-2].concat($$[$0]));
	break;
	case 94:this.$ = yy.addLocationDataFn(_$[$0-3], _$[$0])($$[$0-3].concat($$[$0]));
	break;
	case 95:this.$ = yy.addLocationDataFn(_$[$0-5], _$[$0])($$[$0-5].concat($$[$0-2]));
	break;
	case 96:this.$ = yy.addLocationDataFn(_$[$0], _$[$0])(new yy.Class);
	break;
	case 97:this.$ = yy.addLocationDataFn(_$[$0-1], _$[$0])(new yy.Class(null, null, $$[$0]));
	break;
	case 98:this.$ = yy.addLocationDataFn(_$[$0-2], _$[$0])(new yy.Class(null, $$[$0]));
	break;
	case 99:this.$ = yy.addLocationDataFn(_$[$0-3], _$[$0])(new yy.Class(null, $$[$0-1], $$[$0]));
	break;
	case 100:this.$ = yy.addLocationDataFn(_$[$0-1], _$[$0])(new yy.Class($$[$0]));
	break;
	case 101:this.$ = yy.addLocationDataFn(_$[$0-2], _$[$0])(new yy.Class($$[$0-1], null, $$[$0]));
	break;
	case 102:this.$ = yy.addLocationDataFn(_$[$0-3], _$[$0])(new yy.Class($$[$0-2], $$[$0]));
	break;
	case 103:this.$ = yy.addLocationDataFn(_$[$0-4], _$[$0])(new yy.Class($$[$0-3], $$[$0-1], $$[$0]));
	break;
	case 104:this.$ = yy.addLocationDataFn(_$[$0-2], _$[$0])(new yy.Call($$[$0-2], $$[$0], $$[$0-1]));
	break;
	case 105:this.$ = yy.addLocationDataFn(_$[$0-2], _$[$0])(new yy.Call($$[$0-2], $$[$0], $$[$0-1]));
	break;
	case 106:this.$ = yy.addLocationDataFn(_$[$0], _$[$0])(new yy.Call('super', [new yy.Splat(new yy.Literal('arguments'))]));
	break;
	case 107:this.$ = yy.addLocationDataFn(_$[$0-1], _$[$0])(new yy.Call('super', $$[$0]));
	break;
	case 108:this.$ = yy.addLocationDataFn(_$[$0], _$[$0])(false);
	break;
	case 109:this.$ = yy.addLocationDataFn(_$[$0], _$[$0])(true);
	break;
	case 110:this.$ = yy.addLocationDataFn(_$[$0-1], _$[$0])([]);
	break;
	case 111:this.$ = yy.addLocationDataFn(_$[$0-3], _$[$0])($$[$0-2]);
	break;
	case 112:this.$ = yy.addLocationDataFn(_$[$0], _$[$0])(new yy.Value(new yy.Literal('this')));
	break;
	case 113:this.$ = yy.addLocationDataFn(_$[$0], _$[$0])(new yy.Value(new yy.Literal('this')));
	break;
	case 114:this.$ = yy.addLocationDataFn(_$[$0-1], _$[$0])(new yy.Value(yy.addLocationDataFn(_$[$0-1])(new yy.Literal('this')), [yy.addLocationDataFn(_$[$0])(new yy.Access($$[$0]))], 'this'));
	break;
	case 115:this.$ = yy.addLocationDataFn(_$[$0-1], _$[$0])(new yy.Arr([]));
	break;
	case 116:this.$ = yy.addLocationDataFn(_$[$0-3], _$[$0])(new yy.Arr($$[$0-2]));
	break;
	case 117:this.$ = yy.addLocationDataFn(_$[$0], _$[$0])('inclusive');
	break;
	case 118:this.$ = yy.addLocationDataFn(_$[$0], _$[$0])('exclusive');
	break;
	case 119:this.$ = yy.addLocationDataFn(_$[$0-4], _$[$0])(new yy.Range($$[$0-3], $$[$0-1], $$[$0-2]));
	break;
	case 120:this.$ = yy.addLocationDataFn(_$[$0-2], _$[$0])(new yy.Range($$[$0-2], $$[$0], $$[$0-1]));
	break;
	case 121:this.$ = yy.addLocationDataFn(_$[$0-1], _$[$0])(new yy.Range($$[$0-1], null, $$[$0]));
	break;
	case 122:this.$ = yy.addLocationDataFn(_$[$0-1], _$[$0])(new yy.Range(null, $$[$0], $$[$0-1]));
	break;
	case 123:this.$ = yy.addLocationDataFn(_$[$0], _$[$0])(new yy.Range(null, null, $$[$0]));
	break;
	case 124:this.$ = yy.addLocationDataFn(_$[$0], _$[$0])([$$[$0]]);
	break;
	case 125:this.$ = yy.addLocationDataFn(_$[$0-2], _$[$0])($$[$0-2].concat($$[$0]));
	break;
	case 126:this.$ = yy.addLocationDataFn(_$[$0-3], _$[$0])($$[$0-3].concat($$[$0]));
	break;
	case 127:this.$ = yy.addLocationDataFn(_$[$0-3], _$[$0])($$[$0-2]);
	break;
	case 128:this.$ = yy.addLocationDataFn(_$[$0-5], _$[$0])($$[$0-5].concat($$[$0-2]));
	break;
	case 129:this.$ = $$[$0];
	break;
	case 130:this.$ = $$[$0];
	break;
	case 131:this.$ = yy.addLocationDataFn(_$[$0], _$[$0])(new yy.Expansion);
	break;
	case 132:this.$ = $$[$0];
	break;
	case 133:this.$ = yy.addLocationDataFn(_$[$0-2], _$[$0])([].concat($$[$0-2], $$[$0]));
	break;
	case 134:this.$ = yy.addLocationDataFn(_$[$0-1], _$[$0])(new yy.Try($$[$0]));
	break;
	case 135:this.$ = yy.addLocationDataFn(_$[$0-2], _$[$0])(new yy.Try($$[$0-1], $$[$0][0], $$[$0][1]));
	break;
	case 136:this.$ = yy.addLocationDataFn(_$[$0-3], _$[$0])(new yy.Try($$[$0-2], null, null, $$[$0]));
	break;
	case 137:this.$ = yy.addLocationDataFn(_$[$0-4], _$[$0])(new yy.Try($$[$0-3], $$[$0-2][0], $$[$0-2][1], $$[$0]));
	break;
	case 138:this.$ = yy.addLocationDataFn(_$[$0-2], _$[$0])([$$[$0-1], $$[$0]]);
	break;
	case 139:this.$ = yy.addLocationDataFn(_$[$0-2], _$[$0])([yy.addLocationDataFn(_$[$0-1])(new yy.Value($$[$0-1])), $$[$0]]);
	break;
	case 140:this.$ = yy.addLocationDataFn(_$[$0-1], _$[$0])([null, $$[$0]]);
	break;
	case 141:this.$ = yy.addLocationDataFn(_$[$0-1], _$[$0])(new yy.Throw($$[$0]));
	break;
	case 142:this.$ = yy.addLocationDataFn(_$[$0-2], _$[$0])(new yy.Parens($$[$0-1]));
	break;
	case 143:this.$ = yy.addLocationDataFn(_$[$0-4], _$[$0])(new yy.Parens($$[$0-2]));
	break;
	case 144:this.$ = yy.addLocationDataFn(_$[$0-1], _$[$0])(new yy.While($$[$0]));
	break;
	case 145:this.$ = yy.addLocationDataFn(_$[$0-3], _$[$0])(new yy.While($$[$0-2], {
	          guard: $$[$0]
	        }));
	break;
	case 146:this.$ = yy.addLocationDataFn(_$[$0-1], _$[$0])(new yy.While($$[$0], {
	          invert: true
	        }));
	break;
	case 147:this.$ = yy.addLocationDataFn(_$[$0-3], _$[$0])(new yy.While($$[$0-2], {
	          invert: true,
	          guard: $$[$0]
	        }));
	break;
	case 148:this.$ = yy.addLocationDataFn(_$[$0-1], _$[$0])($$[$0-1].addBody($$[$0]));
	break;
	case 149:this.$ = yy.addLocationDataFn(_$[$0-1], _$[$0])($$[$0].addBody(yy.addLocationDataFn(_$[$0-1])(yy.Block.wrap([$$[$0-1]]))));
	break;
	case 150:this.$ = yy.addLocationDataFn(_$[$0-1], _$[$0])($$[$0].addBody(yy.addLocationDataFn(_$[$0-1])(yy.Block.wrap([$$[$0-1]]))));
	break;
	case 151:this.$ = yy.addLocationDataFn(_$[$0], _$[$0])($$[$0]);
	break;
	case 152:this.$ = yy.addLocationDataFn(_$[$0-1], _$[$0])(new yy.While(yy.addLocationDataFn(_$[$0-1])(new yy.Literal('true'))).addBody($$[$0]));
	break;
	case 153:this.$ = yy.addLocationDataFn(_$[$0-1], _$[$0])(new yy.While(yy.addLocationDataFn(_$[$0-1])(new yy.Literal('true'))).addBody(yy.addLocationDataFn(_$[$0])(yy.Block.wrap([$$[$0]]))));
	break;
	case 154:this.$ = yy.addLocationDataFn(_$[$0-1], _$[$0])(new yy.For($$[$0-1], $$[$0]));
	break;
	case 155:this.$ = yy.addLocationDataFn(_$[$0-1], _$[$0])(new yy.For($$[$0-1], $$[$0]));
	break;
	case 156:this.$ = yy.addLocationDataFn(_$[$0-1], _$[$0])(new yy.For($$[$0], $$[$0-1]));
	break;
	case 157:this.$ = yy.addLocationDataFn(_$[$0-1], _$[$0])({
	          source: yy.addLocationDataFn(_$[$0])(new yy.Value($$[$0]))
	        });
	break;
	case 158:this.$ = yy.addLocationDataFn(_$[$0-1], _$[$0])((function () {
	        $$[$0].own = $$[$0-1].own;
	        $$[$0].name = $$[$0-1][0];
	        $$[$0].index = $$[$0-1][1];
	        return $$[$0];
	      }()));
	break;
	case 159:this.$ = yy.addLocationDataFn(_$[$0-1], _$[$0])($$[$0]);
	break;
	case 160:this.$ = yy.addLocationDataFn(_$[$0-2], _$[$0])((function () {
	        $$[$0].own = true;
	        return $$[$0];
	      }()));
	break;
	case 161:this.$ = $$[$0];
	break;
	case 162:this.$ = $$[$0];
	break;
	case 163:this.$ = yy.addLocationDataFn(_$[$0], _$[$0])(new yy.Value($$[$0]));
	break;
	case 164:this.$ = yy.addLocationDataFn(_$[$0], _$[$0])(new yy.Value($$[$0]));
	break;
	case 165:this.$ = yy.addLocationDataFn(_$[$0], _$[$0])([$$[$0]]);
	break;
	case 166:this.$ = yy.addLocationDataFn(_$[$0-2], _$[$0])([$$[$0-2], $$[$0]]);
	break;
	case 167:this.$ = yy.addLocationDataFn(_$[$0-1], _$[$0])({
	          source: $$[$0]
	        });
	break;
	case 168:this.$ = yy.addLocationDataFn(_$[$0-1], _$[$0])({
	          source: $$[$0],
	          object: true
	        });
	break;
	case 169:this.$ = yy.addLocationDataFn(_$[$0-3], _$[$0])({
	          source: $$[$0-2],
	          guard: $$[$0]
	        });
	break;
	case 170:this.$ = yy.addLocationDataFn(_$[$0-3], _$[$0])({
	          source: $$[$0-2],
	          guard: $$[$0],
	          object: true
	        });
	break;
	case 171:this.$ = yy.addLocationDataFn(_$[$0-3], _$[$0])({
	          source: $$[$0-2],
	          step: $$[$0]
	        });
	break;
	case 172:this.$ = yy.addLocationDataFn(_$[$0-5], _$[$0])({
	          source: $$[$0-4],
	          guard: $$[$0-2],
	          step: $$[$0]
	        });
	break;
	case 173:this.$ = yy.addLocationDataFn(_$[$0-5], _$[$0])({
	          source: $$[$0-4],
	          step: $$[$0-2],
	          guard: $$[$0]
	        });
	break;
	case 174:this.$ = yy.addLocationDataFn(_$[$0-4], _$[$0])(new yy.Switch($$[$0-3], $$[$0-1]));
	break;
	case 175:this.$ = yy.addLocationDataFn(_$[$0-6], _$[$0])(new yy.Switch($$[$0-5], $$[$0-3], $$[$0-1]));
	break;
	case 176:this.$ = yy.addLocationDataFn(_$[$0-3], _$[$0])(new yy.Switch(null, $$[$0-1]));
	break;
	case 177:this.$ = yy.addLocationDataFn(_$[$0-5], _$[$0])(new yy.Switch(null, $$[$0-3], $$[$0-1]));
	break;
	case 178:this.$ = $$[$0];
	break;
	case 179:this.$ = yy.addLocationDataFn(_$[$0-1], _$[$0])($$[$0-1].concat($$[$0]));
	break;
	case 180:this.$ = yy.addLocationDataFn(_$[$0-2], _$[$0])([[$$[$0-1], $$[$0]]]);
	break;
	case 181:this.$ = yy.addLocationDataFn(_$[$0-3], _$[$0])([[$$[$0-2], $$[$0-1]]]);
	break;
	case 182:this.$ = yy.addLocationDataFn(_$[$0-2], _$[$0])(new yy.If($$[$0-1], $$[$0], {
	          type: $$[$0-2]
	        }));
	break;
	case 183:this.$ = yy.addLocationDataFn(_$[$0-4], _$[$0])($$[$0-4].addElse(yy.addLocationDataFn(_$[$0-2], _$[$0])(new yy.If($$[$0-1], $$[$0], {
	          type: $$[$0-2]
	        }))));
	break;
	case 184:this.$ = $$[$0];
	break;
	case 185:this.$ = yy.addLocationDataFn(_$[$0-2], _$[$0])($$[$0-2].addElse($$[$0]));
	break;
	case 186:this.$ = yy.addLocationDataFn(_$[$0-2], _$[$0])(new yy.If($$[$0], yy.addLocationDataFn(_$[$0-2])(yy.Block.wrap([$$[$0-2]])), {
	          type: $$[$0-1],
	          statement: true
	        }));
	break;
	case 187:this.$ = yy.addLocationDataFn(_$[$0-2], _$[$0])(new yy.If($$[$0], yy.addLocationDataFn(_$[$0-2])(yy.Block.wrap([$$[$0-2]])), {
	          type: $$[$0-1],
	          statement: true
	        }));
	break;
	case 188:this.$ = yy.addLocationDataFn(_$[$0-1], _$[$0])(new yy.Op($$[$0-1], $$[$0]));
	break;
	case 189:this.$ = yy.addLocationDataFn(_$[$0-1], _$[$0])(new yy.Op($$[$0-1], $$[$0]));
	break;
	case 190:this.$ = yy.addLocationDataFn(_$[$0-1], _$[$0])(new yy.Op('-', $$[$0]));
	break;
	case 191:this.$ = yy.addLocationDataFn(_$[$0-1], _$[$0])(new yy.Op('+', $$[$0]));
	break;
	case 192:this.$ = yy.addLocationDataFn(_$[$0-1], _$[$0])(new yy.Op('--', $$[$0]));
	break;
	case 193:this.$ = yy.addLocationDataFn(_$[$0-1], _$[$0])(new yy.Op('++', $$[$0]));
	break;
	case 194:this.$ = yy.addLocationDataFn(_$[$0-1], _$[$0])(new yy.Op('--', $$[$0-1], null, true));
	break;
	case 195:this.$ = yy.addLocationDataFn(_$[$0-1], _$[$0])(new yy.Op('++', $$[$0-1], null, true));
	break;
	case 196:this.$ = yy.addLocationDataFn(_$[$0-1], _$[$0])(new yy.Existence($$[$0-1]));
	break;
	case 197:this.$ = yy.addLocationDataFn(_$[$0-2], _$[$0])(new yy.Op('+', $$[$0-2], $$[$0]));
	break;
	case 198:this.$ = yy.addLocationDataFn(_$[$0-2], _$[$0])(new yy.Op('-', $$[$0-2], $$[$0]));
	break;
	case 199:this.$ = yy.addLocationDataFn(_$[$0-2], _$[$0])(new yy.Op($$[$0-1], $$[$0-2], $$[$0]));
	break;
	case 200:this.$ = yy.addLocationDataFn(_$[$0-2], _$[$0])(new yy.Op($$[$0-1], $$[$0-2], $$[$0]));
	break;
	case 201:this.$ = yy.addLocationDataFn(_$[$0-2], _$[$0])(new yy.Op($$[$0-1], $$[$0-2], $$[$0]));
	break;
	case 202:this.$ = yy.addLocationDataFn(_$[$0-2], _$[$0])(new yy.Op($$[$0-1], $$[$0-2], $$[$0]));
	break;
	case 203:this.$ = yy.addLocationDataFn(_$[$0-2], _$[$0])(new yy.Op($$[$0-1], $$[$0-2], $$[$0]));
	break;
	case 204:this.$ = yy.addLocationDataFn(_$[$0-2], _$[$0])((function () {
	        if ($$[$0-1].charAt(0) === '!') {
	          return new yy.Op($$[$0-1].slice(1), $$[$0-2], $$[$0]).invert();
	        } else {
	          return new yy.Op($$[$0-1], $$[$0-2], $$[$0]);
	        }
	      }()));
	break;
	case 205:this.$ = yy.addLocationDataFn(_$[$0-2], _$[$0])(new yy.Assign($$[$0-2], $$[$0], $$[$0-1]));
	break;
	case 206:this.$ = yy.addLocationDataFn(_$[$0-4], _$[$0])(new yy.Assign($$[$0-4], $$[$0-1], $$[$0-3]));
	break;
	case 207:this.$ = yy.addLocationDataFn(_$[$0-3], _$[$0])(new yy.Assign($$[$0-3], $$[$0], $$[$0-2]));
	break;
	case 208:this.$ = yy.addLocationDataFn(_$[$0-2], _$[$0])(new yy.Extends($$[$0-2], $$[$0]));
	break;
	}
	},
	table: [{1:[2,1],3:1,4:2,5:3,7:4,8:5,9:18,10:19,11:[1,20],12:6,13:7,14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,27:61,28:[1,72],29:48,30:[1,70],31:[1,71],32:22,33:[1,49],34:[1,50],35:[1,51],36:[1,52],37:[1,53],38:[1,54],39:21,44:62,45:[1,44],46:[1,45],47:[1,27],50:28,51:[1,59],52:[1,60],58:46,59:47,61:35,63:23,64:24,65:25,76:[1,69],79:[1,42],83:[1,26],88:[1,57],89:[1,58],90:[1,56],96:[1,37],100:[1,43],101:[1,55],103:38,104:[1,64],106:[1,65],107:39,108:[1,66],109:40,110:[1,67],111:68,119:[1,41],124:36,125:[1,63],127:[1,29],128:[1,30],129:[1,31],130:[1,32],131:[1,33],132:[1,34]},{1:[3]},{1:[2,2],6:[1,73]},{1:[2,3],6:[2,3],26:[2,3],102:[2,3]},{1:[2,6],6:[2,6],26:[2,6],102:[2,6],103:84,104:[1,64],106:[1,65],109:85,110:[1,67],111:68,126:[1,83],129:[1,76],130:[1,75],133:[1,74],134:[1,77],135:[1,78],136:[1,79],137:[1,80],138:[1,81],139:[1,82]},{1:[2,7],6:[2,7],26:[2,7],102:[2,7],103:87,104:[1,64],106:[1,65],109:88,110:[1,67],111:68,126:[1,86]},{1:[2,11],6:[2,11],25:[2,11],26:[2,11],49:[2,11],54:[2,11],57:[2,11],62:90,66:[1,92],67:[1,93],68:[1,94],69:[1,95],70:96,71:[1,97],73:[2,11],74:[1,98],78:[2,11],81:89,84:[1,91],85:[2,108],86:[2,11],91:[2,11],93:[2,11],102:[2,11],104:[2,11],105:[2,11],106:[2,11],110:[2,11],118:[2,11],126:[2,11],129:[2,11],130:[2,11],133:[2,11],134:[2,11],135:[2,11],136:[2,11],137:[2,11],138:[2,11],139:[2,11]},{1:[2,12],6:[2,12],25:[2,12],26:[2,12],49:[2,12],54:[2,12],57:[2,12],62:100,66:[1,92],67:[1,93],68:[1,94],69:[1,95],70:96,71:[1,97],73:[2,12],74:[1,98],78:[2,12],81:99,84:[1,91],85:[2,108],86:[2,12],91:[2,12],93:[2,12],102:[2,12],104:[2,12],105:[2,12],106:[2,12],110:[2,12],118:[2,12],126:[2,12],129:[2,12],130:[2,12],133:[2,12],134:[2,12],135:[2,12],136:[2,12],137:[2,12],138:[2,12],139:[2,12]},{1:[2,13],6:[2,13],25:[2,13],26:[2,13],49:[2,13],54:[2,13],57:[2,13],73:[2,13],78:[2,13],86:[2,13],91:[2,13],93:[2,13],102:[2,13],104:[2,13],105:[2,13],106:[2,13],110:[2,13],118:[2,13],126:[2,13],129:[2,13],130:[2,13],133:[2,13],134:[2,13],135:[2,13],136:[2,13],137:[2,13],138:[2,13],139:[2,13]},{1:[2,14],6:[2,14],25:[2,14],26:[2,14],49:[2,14],54:[2,14],57:[2,14],73:[2,14],78:[2,14],86:[2,14],91:[2,14],93:[2,14],102:[2,14],104:[2,14],105:[2,14],106:[2,14],110:[2,14],118:[2,14],126:[2,14],129:[2,14],130:[2,14],133:[2,14],134:[2,14],135:[2,14],136:[2,14],137:[2,14],138:[2,14],139:[2,14]},{1:[2,15],6:[2,15],25:[2,15],26:[2,15],49:[2,15],54:[2,15],57:[2,15],73:[2,15],78:[2,15],86:[2,15],91:[2,15],93:[2,15],102:[2,15],104:[2,15],105:[2,15],106:[2,15],110:[2,15],118:[2,15],126:[2,15],129:[2,15],130:[2,15],133:[2,15],134:[2,15],135:[2,15],136:[2,15],137:[2,15],138:[2,15],139:[2,15]},{1:[2,16],6:[2,16],25:[2,16],26:[2,16],49:[2,16],54:[2,16],57:[2,16],73:[2,16],78:[2,16],86:[2,16],91:[2,16],93:[2,16],102:[2,16],104:[2,16],105:[2,16],106:[2,16],110:[2,16],118:[2,16],126:[2,16],129:[2,16],130:[2,16],133:[2,16],134:[2,16],135:[2,16],136:[2,16],137:[2,16],138:[2,16],139:[2,16]},{1:[2,17],6:[2,17],25:[2,17],26:[2,17],49:[2,17],54:[2,17],57:[2,17],73:[2,17],78:[2,17],86:[2,17],91:[2,17],93:[2,17],102:[2,17],104:[2,17],105:[2,17],106:[2,17],110:[2,17],118:[2,17],126:[2,17],129:[2,17],130:[2,17],133:[2,17],134:[2,17],135:[2,17],136:[2,17],137:[2,17],138:[2,17],139:[2,17]},{1:[2,18],6:[2,18],25:[2,18],26:[2,18],49:[2,18],54:[2,18],57:[2,18],73:[2,18],78:[2,18],86:[2,18],91:[2,18],93:[2,18],102:[2,18],104:[2,18],105:[2,18],106:[2,18],110:[2,18],118:[2,18],126:[2,18],129:[2,18],130:[2,18],133:[2,18],134:[2,18],135:[2,18],136:[2,18],137:[2,18],138:[2,18],139:[2,18]},{1:[2,19],6:[2,19],25:[2,19],26:[2,19],49:[2,19],54:[2,19],57:[2,19],73:[2,19],78:[2,19],86:[2,19],91:[2,19],93:[2,19],102:[2,19],104:[2,19],105:[2,19],106:[2,19],110:[2,19],118:[2,19],126:[2,19],129:[2,19],130:[2,19],133:[2,19],134:[2,19],135:[2,19],136:[2,19],137:[2,19],138:[2,19],139:[2,19]},{1:[2,20],6:[2,20],25:[2,20],26:[2,20],49:[2,20],54:[2,20],57:[2,20],73:[2,20],78:[2,20],86:[2,20],91:[2,20],93:[2,20],102:[2,20],104:[2,20],105:[2,20],106:[2,20],110:[2,20],118:[2,20],126:[2,20],129:[2,20],130:[2,20],133:[2,20],134:[2,20],135:[2,20],136:[2,20],137:[2,20],138:[2,20],139:[2,20]},{1:[2,21],6:[2,21],25:[2,21],26:[2,21],49:[2,21],54:[2,21],57:[2,21],73:[2,21],78:[2,21],86:[2,21],91:[2,21],93:[2,21],102:[2,21],104:[2,21],105:[2,21],106:[2,21],110:[2,21],118:[2,21],126:[2,21],129:[2,21],130:[2,21],133:[2,21],134:[2,21],135:[2,21],136:[2,21],137:[2,21],138:[2,21],139:[2,21]},{1:[2,22],6:[2,22],25:[2,22],26:[2,22],49:[2,22],54:[2,22],57:[2,22],73:[2,22],78:[2,22],86:[2,22],91:[2,22],93:[2,22],102:[2,22],104:[2,22],105:[2,22],106:[2,22],110:[2,22],118:[2,22],126:[2,22],129:[2,22],130:[2,22],133:[2,22],134:[2,22],135:[2,22],136:[2,22],137:[2,22],138:[2,22],139:[2,22]},{1:[2,8],6:[2,8],26:[2,8],102:[2,8],104:[2,8],106:[2,8],110:[2,8],126:[2,8]},{1:[2,9],6:[2,9],26:[2,9],102:[2,9],104:[2,9],106:[2,9],110:[2,9],126:[2,9]},{1:[2,10],6:[2,10],26:[2,10],102:[2,10],104:[2,10],106:[2,10],110:[2,10],126:[2,10]},{1:[2,75],6:[2,75],25:[2,75],26:[2,75],40:[1,101],49:[2,75],54:[2,75],57:[2,75],66:[2,75],67:[2,75],68:[2,75],69:[2,75],71:[2,75],73:[2,75],74:[2,75],78:[2,75],84:[2,75],85:[2,75],86:[2,75],91:[2,75],93:[2,75],102:[2,75],104:[2,75],105:[2,75],106:[2,75],110:[2,75],118:[2,75],126:[2,75],129:[2,75],130:[2,75],133:[2,75],134:[2,75],135:[2,75],136:[2,75],137:[2,75],138:[2,75],139:[2,75]},{1:[2,76],6:[2,76],25:[2,76],26:[2,76],49:[2,76],54:[2,76],57:[2,76],66:[2,76],67:[2,76],68:[2,76],69:[2,76],71:[2,76],73:[2,76],74:[2,76],78:[2,76],84:[2,76],85:[2,76],86:[2,76],91:[2,76],93:[2,76],102:[2,76],104:[2,76],105:[2,76],106:[2,76],110:[2,76],118:[2,76],126:[2,76],129:[2,76],130:[2,76],133:[2,76],134:[2,76],135:[2,76],136:[2,76],137:[2,76],138:[2,76],139:[2,76]},{1:[2,77],6:[2,77],25:[2,77],26:[2,77],49:[2,77],54:[2,77],57:[2,77],66:[2,77],67:[2,77],68:[2,77],69:[2,77],71:[2,77],73:[2,77],74:[2,77],78:[2,77],84:[2,77],85:[2,77],86:[2,77],91:[2,77],93:[2,77],102:[2,77],104:[2,77],105:[2,77],106:[2,77],110:[2,77],118:[2,77],126:[2,77],129:[2,77],130:[2,77],133:[2,77],134:[2,77],135:[2,77],136:[2,77],137:[2,77],138:[2,77],139:[2,77]},{1:[2,78],6:[2,78],25:[2,78],26:[2,78],49:[2,78],54:[2,78],57:[2,78],66:[2,78],67:[2,78],68:[2,78],69:[2,78],71:[2,78],73:[2,78],74:[2,78],78:[2,78],84:[2,78],85:[2,78],86:[2,78],91:[2,78],93:[2,78],102:[2,78],104:[2,78],105:[2,78],106:[2,78],110:[2,78],118:[2,78],126:[2,78],129:[2,78],130:[2,78],133:[2,78],134:[2,78],135:[2,78],136:[2,78],137:[2,78],138:[2,78],139:[2,78]},{1:[2,79],6:[2,79],25:[2,79],26:[2,79],49:[2,79],54:[2,79],57:[2,79],66:[2,79],67:[2,79],68:[2,79],69:[2,79],71:[2,79],73:[2,79],74:[2,79],78:[2,79],84:[2,79],85:[2,79],86:[2,79],91:[2,79],93:[2,79],102:[2,79],104:[2,79],105:[2,79],106:[2,79],110:[2,79],118:[2,79],126:[2,79],129:[2,79],130:[2,79],133:[2,79],134:[2,79],135:[2,79],136:[2,79],137:[2,79],138:[2,79],139:[2,79]},{1:[2,106],6:[2,106],25:[2,106],26:[2,106],49:[2,106],54:[2,106],57:[2,106],66:[2,106],67:[2,106],68:[2,106],69:[2,106],71:[2,106],73:[2,106],74:[2,106],78:[2,106],82:102,84:[2,106],85:[1,103],86:[2,106],91:[2,106],93:[2,106],102:[2,106],104:[2,106],105:[2,106],106:[2,106],110:[2,106],118:[2,106],126:[2,106],129:[2,106],130:[2,106],133:[2,106],134:[2,106],135:[2,106],136:[2,106],137:[2,106],138:[2,106],139:[2,106]},{6:[2,54],25:[2,54],27:108,28:[1,72],44:109,48:104,49:[2,54],54:[2,54],55:105,56:106,57:[1,107],58:110,59:111,76:[1,69],89:[1,112],90:[1,113]},{24:114,25:[1,115]},{7:116,8:117,9:18,10:19,11:[1,20],12:6,13:7,14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,27:61,28:[1,72],29:48,30:[1,70],31:[1,71],32:22,33:[1,49],34:[1,50],35:[1,51],36:[1,52],37:[1,53],38:[1,54],39:21,44:62,45:[1,44],46:[1,45],47:[1,27],50:28,51:[1,59],52:[1,60],58:46,59:47,61:35,63:23,64:24,65:25,76:[1,69],79:[1,42],83:[1,26],88:[1,57],89:[1,58],90:[1,56],96:[1,37],100:[1,43],101:[1,55],103:38,104:[1,64],106:[1,65],107:39,108:[1,66],109:40,110:[1,67],111:68,119:[1,41],124:36,125:[1,63],127:[1,29],128:[1,30],129:[1,31],130:[1,32],131:[1,33],132:[1,34]},{7:118,8:117,9:18,10:19,11:[1,20],12:6,13:7,14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,27:61,28:[1,72],29:48,30:[1,70],31:[1,71],32:22,33:[1,49],34:[1,50],35:[1,51],36:[1,52],37:[1,53],38:[1,54],39:21,44:62,45:[1,44],46:[1,45],47:[1,27],50:28,51:[1,59],52:[1,60],58:46,59:47,61:35,63:23,64:24,65:25,76:[1,69],79:[1,42],83:[1,26],88:[1,57],89:[1,58],90:[1,56],96:[1,37],100:[1,43],101:[1,55],103:38,104:[1,64],106:[1,65],107:39,108:[1,66],109:40,110:[1,67],111:68,119:[1,41],124:36,125:[1,63],127:[1,29],128:[1,30],129:[1,31],130:[1,32],131:[1,33],132:[1,34]},{7:119,8:117,9:18,10:19,11:[1,20],12:6,13:7,14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,27:61,28:[1,72],29:48,30:[1,70],31:[1,71],32:22,33:[1,49],34:[1,50],35:[1,51],36:[1,52],37:[1,53],38:[1,54],39:21,44:62,45:[1,44],46:[1,45],47:[1,27],50:28,51:[1,59],52:[1,60],58:46,59:47,61:35,63:23,64:24,65:25,76:[1,69],79:[1,42],83:[1,26],88:[1,57],89:[1,58],90:[1,56],96:[1,37],100:[1,43],101:[1,55],103:38,104:[1,64],106:[1,65],107:39,108:[1,66],109:40,110:[1,67],111:68,119:[1,41],124:36,125:[1,63],127:[1,29],128:[1,30],129:[1,31],130:[1,32],131:[1,33],132:[1,34]},{7:120,8:117,9:18,10:19,11:[1,20],12:6,13:7,14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,27:61,28:[1,72],29:48,30:[1,70],31:[1,71],32:22,33:[1,49],34:[1,50],35:[1,51],36:[1,52],37:[1,53],38:[1,54],39:21,44:62,45:[1,44],46:[1,45],47:[1,27],50:28,51:[1,59],52:[1,60],58:46,59:47,61:35,63:23,64:24,65:25,76:[1,69],79:[1,42],83:[1,26],88:[1,57],89:[1,58],90:[1,56],96:[1,37],100:[1,43],101:[1,55],103:38,104:[1,64],106:[1,65],107:39,108:[1,66],109:40,110:[1,67],111:68,119:[1,41],124:36,125:[1,63],127:[1,29],128:[1,30],129:[1,31],130:[1,32],131:[1,33],132:[1,34]},{12:122,13:123,27:61,28:[1,72],29:48,30:[1,70],31:[1,71],32:22,33:[1,49],34:[1,50],35:[1,51],36:[1,52],37:[1,53],38:[1,54],39:124,44:62,58:46,59:47,61:121,63:23,64:24,65:25,76:[1,69],83:[1,26],88:[1,57],89:[1,58],90:[1,56],101:[1,55]},{12:122,13:123,27:61,28:[1,72],29:48,30:[1,70],31:[1,71],32:22,33:[1,49],34:[1,50],35:[1,51],36:[1,52],37:[1,53],38:[1,54],39:124,44:62,58:46,59:47,61:125,63:23,64:24,65:25,76:[1,69],83:[1,26],88:[1,57],89:[1,58],90:[1,56],101:[1,55]},{1:[2,72],6:[2,72],25:[2,72],26:[2,72],40:[2,72],49:[2,72],54:[2,72],57:[2,72],66:[2,72],67:[2,72],68:[2,72],69:[2,72],71:[2,72],73:[2,72],74:[2,72],78:[2,72],80:[1,129],84:[2,72],85:[2,72],86:[2,72],91:[2,72],93:[2,72],102:[2,72],104:[2,72],105:[2,72],106:[2,72],110:[2,72],118:[2,72],126:[2,72],129:[2,72],130:[2,72],131:[1,126],132:[1,127],133:[2,72],134:[2,72],135:[2,72],136:[2,72],137:[2,72],138:[2,72],139:[2,72],140:[1,128]},{1:[2,184],6:[2,184],25:[2,184],26:[2,184],49:[2,184],54:[2,184],57:[2,184],73:[2,184],78:[2,184],86:[2,184],91:[2,184],93:[2,184],102:[2,184],104:[2,184],105:[2,184],106:[2,184],110:[2,184],118:[2,184],121:[1,130],126:[2,184],129:[2,184],130:[2,184],133:[2,184],134:[2,184],135:[2,184],136:[2,184],137:[2,184],138:[2,184],139:[2,184]},{24:131,25:[1,115]},{24:132,25:[1,115]},{1:[2,151],6:[2,151],25:[2,151],26:[2,151],49:[2,151],54:[2,151],57:[2,151],73:[2,151],78:[2,151],86:[2,151],91:[2,151],93:[2,151],102:[2,151],104:[2,151],105:[2,151],106:[2,151],110:[2,151],118:[2,151],126:[2,151],129:[2,151],130:[2,151],133:[2,151],134:[2,151],135:[2,151],136:[2,151],137:[2,151],138:[2,151],139:[2,151]},{24:133,25:[1,115]},{7:134,8:117,9:18,10:19,11:[1,20],12:6,13:7,14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,25:[1,135],27:61,28:[1,72],29:48,30:[1,70],31:[1,71],32:22,33:[1,49],34:[1,50],35:[1,51],36:[1,52],37:[1,53],38:[1,54],39:21,44:62,45:[1,44],46:[1,45],47:[1,27],50:28,51:[1,59],52:[1,60],58:46,59:47,61:35,63:23,64:24,65:25,76:[1,69],79:[1,42],83:[1,26],88:[1,57],89:[1,58],90:[1,56],96:[1,37],100:[1,43],101:[1,55],103:38,104:[1,64],106:[1,65],107:39,108:[1,66],109:40,110:[1,67],111:68,119:[1,41],124:36,125:[1,63],127:[1,29],128:[1,30],129:[1,31],130:[1,32],131:[1,33],132:[1,34]},{1:[2,96],6:[2,96],12:122,13:123,24:136,25:[1,115],26:[2,96],27:61,28:[1,72],29:48,30:[1,70],31:[1,71],32:22,33:[1,49],34:[1,50],35:[1,51],36:[1,52],37:[1,53],38:[1,54],39:124,44:62,49:[2,96],54:[2,96],57:[2,96],58:46,59:47,61:138,63:23,64:24,65:25,73:[2,96],76:[1,69],78:[2,96],80:[1,137],83:[1,26],86:[2,96],88:[1,57],89:[1,58],90:[1,56],91:[2,96],93:[2,96],101:[1,55],102:[2,96],104:[2,96],105:[2,96],106:[2,96],110:[2,96],118:[2,96],126:[2,96],129:[2,96],130:[2,96],133:[2,96],134:[2,96],135:[2,96],136:[2,96],137:[2,96],138:[2,96],139:[2,96]},{7:139,8:117,9:18,10:19,11:[1,20],12:6,13:7,14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,27:61,28:[1,72],29:48,30:[1,70],31:[1,71],32:22,33:[1,49],34:[1,50],35:[1,51],36:[1,52],37:[1,53],38:[1,54],39:21,44:62,45:[1,44],46:[1,45],47:[1,27],50:28,51:[1,59],52:[1,60],58:46,59:47,61:35,63:23,64:24,65:25,76:[1,69],79:[1,42],83:[1,26],88:[1,57],89:[1,58],90:[1,56],96:[1,37],100:[1,43],101:[1,55],103:38,104:[1,64],106:[1,65],107:39,108:[1,66],109:40,110:[1,67],111:68,119:[1,41],124:36,125:[1,63],127:[1,29],128:[1,30],129:[1,31],130:[1,32],131:[1,33],132:[1,34]},{1:[2,46],6:[2,46],7:140,8:117,9:18,10:19,11:[1,20],12:6,13:7,14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,26:[2,46],27:61,28:[1,72],29:48,30:[1,70],31:[1,71],32:22,33:[1,49],34:[1,50],35:[1,51],36:[1,52],37:[1,53],38:[1,54],39:21,44:62,45:[1,44],46:[1,45],47:[1,27],50:28,51:[1,59],52:[1,60],58:46,59:47,61:35,63:23,64:24,65:25,76:[1,69],79:[1,42],83:[1,26],88:[1,57],89:[1,58],90:[1,56],96:[1,37],100:[1,43],101:[1,55],102:[2,46],103:38,104:[2,46],106:[2,46],107:39,108:[1,66],109:40,110:[2,46],111:68,119:[1,41],124:36,125:[1,63],126:[2,46],127:[1,29],128:[1,30],129:[1,31],130:[1,32],131:[1,33],132:[1,34]},{1:[2,47],6:[2,47],25:[2,47],26:[2,47],54:[2,47],78:[2,47],102:[2,47],104:[2,47],106:[2,47],110:[2,47],126:[2,47]},{1:[2,73],6:[2,73],25:[2,73],26:[2,73],40:[2,73],49:[2,73],54:[2,73],57:[2,73],66:[2,73],67:[2,73],68:[2,73],69:[2,73],71:[2,73],73:[2,73],74:[2,73],78:[2,73],84:[2,73],85:[2,73],86:[2,73],91:[2,73],93:[2,73],102:[2,73],104:[2,73],105:[2,73],106:[2,73],110:[2,73],118:[2,73],126:[2,73],129:[2,73],130:[2,73],133:[2,73],134:[2,73],135:[2,73],136:[2,73],137:[2,73],138:[2,73],139:[2,73]},{1:[2,74],6:[2,74],25:[2,74],26:[2,74],40:[2,74],49:[2,74],54:[2,74],57:[2,74],66:[2,74],67:[2,74],68:[2,74],69:[2,74],71:[2,74],73:[2,74],74:[2,74],78:[2,74],84:[2,74],85:[2,74],86:[2,74],91:[2,74],93:[2,74],102:[2,74],104:[2,74],105:[2,74],106:[2,74],110:[2,74],118:[2,74],126:[2,74],129:[2,74],130:[2,74],133:[2,74],134:[2,74],135:[2,74],136:[2,74],137:[2,74],138:[2,74],139:[2,74]},{1:[2,28],6:[2,28],25:[2,28],26:[2,28],49:[2,28],54:[2,28],57:[2,28],66:[2,28],67:[2,28],68:[2,28],69:[2,28],71:[2,28],73:[2,28],74:[2,28],78:[2,28],84:[2,28],85:[2,28],86:[2,28],91:[2,28],93:[2,28],102:[2,28],104:[2,28],105:[2,28],106:[2,28],110:[2,28],118:[2,28],126:[2,28],129:[2,28],130:[2,28],133:[2,28],134:[2,28],135:[2,28],136:[2,28],137:[2,28],138:[2,28],139:[2,28]},{1:[2,29],6:[2,29],25:[2,29],26:[2,29],49:[2,29],54:[2,29],57:[2,29],66:[2,29],67:[2,29],68:[2,29],69:[2,29],71:[2,29],73:[2,29],74:[2,29],78:[2,29],84:[2,29],85:[2,29],86:[2,29],91:[2,29],93:[2,29],102:[2,29],104:[2,29],105:[2,29],106:[2,29],110:[2,29],118:[2,29],126:[2,29],129:[2,29],130:[2,29],133:[2,29],134:[2,29],135:[2,29],136:[2,29],137:[2,29],138:[2,29],139:[2,29]},{1:[2,30],6:[2,30],25:[2,30],26:[2,30],49:[2,30],54:[2,30],57:[2,30],66:[2,30],67:[2,30],68:[2,30],69:[2,30],71:[2,30],73:[2,30],74:[2,30],78:[2,30],84:[2,30],85:[2,30],86:[2,30],91:[2,30],93:[2,30],102:[2,30],104:[2,30],105:[2,30],106:[2,30],110:[2,30],118:[2,30],126:[2,30],129:[2,30],130:[2,30],133:[2,30],134:[2,30],135:[2,30],136:[2,30],137:[2,30],138:[2,30],139:[2,30]},{1:[2,31],6:[2,31],25:[2,31],26:[2,31],49:[2,31],54:[2,31],57:[2,31],66:[2,31],67:[2,31],68:[2,31],69:[2,31],71:[2,31],73:[2,31],74:[2,31],78:[2,31],84:[2,31],85:[2,31],86:[2,31],91:[2,31],93:[2,31],102:[2,31],104:[2,31],105:[2,31],106:[2,31],110:[2,31],118:[2,31],126:[2,31],129:[2,31],130:[2,31],133:[2,31],134:[2,31],135:[2,31],136:[2,31],137:[2,31],138:[2,31],139:[2,31]},{1:[2,32],6:[2,32],25:[2,32],26:[2,32],49:[2,32],54:[2,32],57:[2,32],66:[2,32],67:[2,32],68:[2,32],69:[2,32],71:[2,32],73:[2,32],74:[2,32],78:[2,32],84:[2,32],85:[2,32],86:[2,32],91:[2,32],93:[2,32],102:[2,32],104:[2,32],105:[2,32],106:[2,32],110:[2,32],118:[2,32],126:[2,32],129:[2,32],130:[2,32],133:[2,32],134:[2,32],135:[2,32],136:[2,32],137:[2,32],138:[2,32],139:[2,32]},{1:[2,33],6:[2,33],25:[2,33],26:[2,33],49:[2,33],54:[2,33],57:[2,33],66:[2,33],67:[2,33],68:[2,33],69:[2,33],71:[2,33],73:[2,33],74:[2,33],78:[2,33],84:[2,33],85:[2,33],86:[2,33],91:[2,33],93:[2,33],102:[2,33],104:[2,33],105:[2,33],106:[2,33],110:[2,33],118:[2,33],126:[2,33],129:[2,33],130:[2,33],133:[2,33],134:[2,33],135:[2,33],136:[2,33],137:[2,33],138:[2,33],139:[2,33]},{1:[2,34],6:[2,34],25:[2,34],26:[2,34],49:[2,34],54:[2,34],57:[2,34],66:[2,34],67:[2,34],68:[2,34],69:[2,34],71:[2,34],73:[2,34],74:[2,34],78:[2,34],84:[2,34],85:[2,34],86:[2,34],91:[2,34],93:[2,34],102:[2,34],104:[2,34],105:[2,34],106:[2,34],110:[2,34],118:[2,34],126:[2,34],129:[2,34],130:[2,34],133:[2,34],134:[2,34],135:[2,34],136:[2,34],137:[2,34],138:[2,34],139:[2,34]},{4:141,5:3,7:4,8:5,9:18,10:19,11:[1,20],12:6,13:7,14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,25:[1,142],27:61,28:[1,72],29:48,30:[1,70],31:[1,71],32:22,33:[1,49],34:[1,50],35:[1,51],36:[1,52],37:[1,53],38:[1,54],39:21,44:62,45:[1,44],46:[1,45],47:[1,27],50:28,51:[1,59],52:[1,60],58:46,59:47,61:35,63:23,64:24,65:25,76:[1,69],79:[1,42],83:[1,26],88:[1,57],89:[1,58],90:[1,56],96:[1,37],100:[1,43],101:[1,55],103:38,104:[1,64],106:[1,65],107:39,108:[1,66],109:40,110:[1,67],111:68,119:[1,41],124:36,125:[1,63],127:[1,29],128:[1,30],129:[1,31],130:[1,32],131:[1,33],132:[1,34]},{7:143,8:117,9:18,10:19,11:[1,20],12:6,13:7,14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,25:[1,147],27:61,28:[1,72],29:48,30:[1,70],31:[1,71],32:22,33:[1,49],34:[1,50],35:[1,51],36:[1,52],37:[1,53],38:[1,54],39:21,44:62,45:[1,44],46:[1,45],47:[1,27],50:28,51:[1,59],52:[1,60],57:[1,149],58:46,59:47,60:148,61:35,63:23,64:24,65:25,76:[1,69],79:[1,42],83:[1,26],87:145,88:[1,57],89:[1,58],90:[1,56],91:[1,144],94:146,96:[1,37],100:[1,43],101:[1,55],103:38,104:[1,64],106:[1,65],107:39,108:[1,66],109:40,110:[1,67],111:68,119:[1,41],124:36,125:[1,63],127:[1,29],128:[1,30],129:[1,31],130:[1,32],131:[1,33],132:[1,34]},{1:[2,112],6:[2,112],25:[2,112],26:[2,112],49:[2,112],54:[2,112],57:[2,112],66:[2,112],67:[2,112],68:[2,112],69:[2,112],71:[2,112],73:[2,112],74:[2,112],78:[2,112],84:[2,112],85:[2,112],86:[2,112],91:[2,112],93:[2,112],102:[2,112],104:[2,112],105:[2,112],106:[2,112],110:[2,112],118:[2,112],126:[2,112],129:[2,112],130:[2,112],133:[2,112],134:[2,112],135:[2,112],136:[2,112],137:[2,112],138:[2,112],139:[2,112]},{1:[2,113],6:[2,113],25:[2,113],26:[2,113],27:150,28:[1,72],49:[2,113],54:[2,113],57:[2,113],66:[2,113],67:[2,113],68:[2,113],69:[2,113],71:[2,113],73:[2,113],74:[2,113],78:[2,113],84:[2,113],85:[2,113],86:[2,113],91:[2,113],93:[2,113],102:[2,113],104:[2,113],105:[2,113],106:[2,113],110:[2,113],118:[2,113],126:[2,113],129:[2,113],130:[2,113],133:[2,113],134:[2,113],135:[2,113],136:[2,113],137:[2,113],138:[2,113],139:[2,113]},{25:[2,50]},{25:[2,51]},{1:[2,68],6:[2,68],25:[2,68],26:[2,68],40:[2,68],49:[2,68],54:[2,68],57:[2,68],66:[2,68],67:[2,68],68:[2,68],69:[2,68],71:[2,68],73:[2,68],74:[2,68],78:[2,68],80:[2,68],84:[2,68],85:[2,68],86:[2,68],91:[2,68],93:[2,68],102:[2,68],104:[2,68],105:[2,68],106:[2,68],110:[2,68],118:[2,68],126:[2,68],129:[2,68],130:[2,68],131:[2,68],132:[2,68],133:[2,68],134:[2,68],135:[2,68],136:[2,68],137:[2,68],138:[2,68],139:[2,68],140:[2,68]},{1:[2,71],6:[2,71],25:[2,71],26:[2,71],40:[2,71],49:[2,71],54:[2,71],57:[2,71],66:[2,71],67:[2,71],68:[2,71],69:[2,71],71:[2,71],73:[2,71],74:[2,71],78:[2,71],80:[2,71],84:[2,71],85:[2,71],86:[2,71],91:[2,71],93:[2,71],102:[2,71],104:[2,71],105:[2,71],106:[2,71],110:[2,71],118:[2,71],126:[2,71],129:[2,71],130:[2,71],131:[2,71],132:[2,71],133:[2,71],134:[2,71],135:[2,71],136:[2,71],137:[2,71],138:[2,71],139:[2,71],140:[2,71]},{7:151,8:117,9:18,10:19,11:[1,20],12:6,13:7,14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,27:61,28:[1,72],29:48,30:[1,70],31:[1,71],32:22,33:[1,49],34:[1,50],35:[1,51],36:[1,52],37:[1,53],38:[1,54],39:21,44:62,45:[1,44],46:[1,45],47:[1,27],50:28,51:[1,59],52:[1,60],58:46,59:47,61:35,63:23,64:24,65:25,76:[1,69],79:[1,42],83:[1,26],88:[1,57],89:[1,58],90:[1,56],96:[1,37],100:[1,43],101:[1,55],103:38,104:[1,64],106:[1,65],107:39,108:[1,66],109:40,110:[1,67],111:68,119:[1,41],124:36,125:[1,63],127:[1,29],128:[1,30],129:[1,31],130:[1,32],131:[1,33],132:[1,34]},{7:152,8:117,9:18,10:19,11:[1,20],12:6,13:7,14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,27:61,28:[1,72],29:48,30:[1,70],31:[1,71],32:22,33:[1,49],34:[1,50],35:[1,51],36:[1,52],37:[1,53],38:[1,54],39:21,44:62,45:[1,44],46:[1,45],47:[1,27],50:28,51:[1,59],52:[1,60],58:46,59:47,61:35,63:23,64:24,65:25,76:[1,69],79:[1,42],83:[1,26],88:[1,57],89:[1,58],90:[1,56],96:[1,37],100:[1,43],101:[1,55],103:38,104:[1,64],106:[1,65],107:39,108:[1,66],109:40,110:[1,67],111:68,119:[1,41],124:36,125:[1,63],127:[1,29],128:[1,30],129:[1,31],130:[1,32],131:[1,33],132:[1,34]},{7:153,8:117,9:18,10:19,11:[1,20],12:6,13:7,14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,27:61,28:[1,72],29:48,30:[1,70],31:[1,71],32:22,33:[1,49],34:[1,50],35:[1,51],36:[1,52],37:[1,53],38:[1,54],39:21,44:62,45:[1,44],46:[1,45],47:[1,27],50:28,51:[1,59],52:[1,60],58:46,59:47,61:35,63:23,64:24,65:25,76:[1,69],79:[1,42],83:[1,26],88:[1,57],89:[1,58],90:[1,56],96:[1,37],100:[1,43],101:[1,55],103:38,104:[1,64],106:[1,65],107:39,108:[1,66],109:40,110:[1,67],111:68,119:[1,41],124:36,125:[1,63],127:[1,29],128:[1,30],129:[1,31],130:[1,32],131:[1,33],132:[1,34]},{7:155,8:117,9:18,10:19,11:[1,20],12:6,13:7,14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:154,25:[1,115],27:61,28:[1,72],29:48,30:[1,70],31:[1,71],32:22,33:[1,49],34:[1,50],35:[1,51],36:[1,52],37:[1,53],38:[1,54],39:21,44:62,45:[1,44],46:[1,45],47:[1,27],50:28,51:[1,59],52:[1,60],58:46,59:47,61:35,63:23,64:24,65:25,76:[1,69],79:[1,42],83:[1,26],88:[1,57],89:[1,58],90:[1,56],96:[1,37],100:[1,43],101:[1,55],103:38,104:[1,64],106:[1,65],107:39,108:[1,66],109:40,110:[1,67],111:68,119:[1,41],124:36,125:[1,63],127:[1,29],128:[1,30],129:[1,31],130:[1,32],131:[1,33],132:[1,34]},{27:160,28:[1,72],44:161,58:162,59:163,64:156,76:[1,69],89:[1,112],90:[1,56],113:157,114:[1,158],115:159},{112:164,116:[1,165],117:[1,166]},{6:[2,91],10:170,25:[2,91],27:171,28:[1,72],29:172,30:[1,70],31:[1,71],41:168,42:169,44:173,46:[1,45],54:[2,91],77:167,78:[2,91],89:[1,112]},{1:[2,26],6:[2,26],25:[2,26],26:[2,26],43:[2,26],49:[2,26],54:[2,26],57:[2,26],66:[2,26],67:[2,26],68:[2,26],69:[2,26],71:[2,26],73:[2,26],74:[2,26],78:[2,26],84:[2,26],85:[2,26],86:[2,26],91:[2,26],93:[2,26],102:[2,26],104:[2,26],105:[2,26],106:[2,26],110:[2,26],118:[2,26],126:[2,26],129:[2,26],130:[2,26],133:[2,26],134:[2,26],135:[2,26],136:[2,26],137:[2,26],138:[2,26],139:[2,26]},{1:[2,27],6:[2,27],25:[2,27],26:[2,27],43:[2,27],49:[2,27],54:[2,27],57:[2,27],66:[2,27],67:[2,27],68:[2,27],69:[2,27],71:[2,27],73:[2,27],74:[2,27],78:[2,27],84:[2,27],85:[2,27],86:[2,27],91:[2,27],93:[2,27],102:[2,27],104:[2,27],105:[2,27],106:[2,27],110:[2,27],118:[2,27],126:[2,27],129:[2,27],130:[2,27],133:[2,27],134:[2,27],135:[2,27],136:[2,27],137:[2,27],138:[2,27],139:[2,27]},{1:[2,25],6:[2,25],25:[2,25],26:[2,25],40:[2,25],43:[2,25],49:[2,25],54:[2,25],57:[2,25],66:[2,25],67:[2,25],68:[2,25],69:[2,25],71:[2,25],73:[2,25],74:[2,25],78:[2,25],80:[2,25],84:[2,25],85:[2,25],86:[2,25],91:[2,25],93:[2,25],102:[2,25],104:[2,25],105:[2,25],106:[2,25],110:[2,25],116:[2,25],117:[2,25],118:[2,25],126:[2,25],129:[2,25],130:[2,25],131:[2,25],132:[2,25],133:[2,25],134:[2,25],135:[2,25],136:[2,25],137:[2,25],138:[2,25],139:[2,25],140:[2,25]},{1:[2,5],5:174,6:[2,5],7:4,8:5,9:18,10:19,11:[1,20],12:6,13:7,14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,26:[2,5],27:61,28:[1,72],29:48,30:[1,70],31:[1,71],32:22,33:[1,49],34:[1,50],35:[1,51],36:[1,52],37:[1,53],38:[1,54],39:21,44:62,45:[1,44],46:[1,45],47:[1,27],50:28,51:[1,59],52:[1,60],58:46,59:47,61:35,63:23,64:24,65:25,76:[1,69],79:[1,42],83:[1,26],88:[1,57],89:[1,58],90:[1,56],96:[1,37],100:[1,43],101:[1,55],102:[2,5],103:38,104:[1,64],106:[1,65],107:39,108:[1,66],109:40,110:[1,67],111:68,119:[1,41],124:36,125:[1,63],127:[1,29],128:[1,30],129:[1,31],130:[1,32],131:[1,33],132:[1,34]},{1:[2,196],6:[2,196],25:[2,196],26:[2,196],49:[2,196],54:[2,196],57:[2,196],73:[2,196],78:[2,196],86:[2,196],91:[2,196],93:[2,196],102:[2,196],104:[2,196],105:[2,196],106:[2,196],110:[2,196],118:[2,196],126:[2,196],129:[2,196],130:[2,196],133:[2,196],134:[2,196],135:[2,196],136:[2,196],137:[2,196],138:[2,196],139:[2,196]},{7:175,8:117,9:18,10:19,11:[1,20],12:6,13:7,14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,27:61,28:[1,72],29:48,30:[1,70],31:[1,71],32:22,33:[1,49],34:[1,50],35:[1,51],36:[1,52],37:[1,53],38:[1,54],39:21,44:62,45:[1,44],46:[1,45],47:[1,27],50:28,51:[1,59],52:[1,60],58:46,59:47,61:35,63:23,64:24,65:25,76:[1,69],79:[1,42],83:[1,26],88:[1,57],89:[1,58],90:[1,56],96:[1,37],100:[1,43],101:[1,55],103:38,104:[1,64],106:[1,65],107:39,108:[1,66],109:40,110:[1,67],111:68,119:[1,41],124:36,125:[1,63],127:[1,29],128:[1,30],129:[1,31],130:[1,32],131:[1,33],132:[1,34]},{7:176,8:117,9:18,10:19,11:[1,20],12:6,13:7,14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,27:61,28:[1,72],29:48,30:[1,70],31:[1,71],32:22,33:[1,49],34:[1,50],35:[1,51],36:[1,52],37:[1,53],38:[1,54],39:21,44:62,45:[1,44],46:[1,45],47:[1,27],50:28,51:[1,59],52:[1,60],58:46,59:47,61:35,63:23,64:24,65:25,76:[1,69],79:[1,42],83:[1,26],88:[1,57],89:[1,58],90:[1,56],96:[1,37],100:[1,43],101:[1,55],103:38,104:[1,64],106:[1,65],107:39,108:[1,66],109:40,110:[1,67],111:68,119:[1,41],124:36,125:[1,63],127:[1,29],128:[1,30],129:[1,31],130:[1,32],131:[1,33],132:[1,34]},{7:177,8:117,9:18,10:19,11:[1,20],12:6,13:7,14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,27:61,28:[1,72],29:48,30:[1,70],31:[1,71],32:22,33:[1,49],34:[1,50],35:[1,51],36:[1,52],37:[1,53],38:[1,54],39:21,44:62,45:[1,44],46:[1,45],47:[1,27],50:28,51:[1,59],52:[1,60],58:46,59:47,61:35,63:23,64:24,65:25,76:[1,69],79:[1,42],83:[1,26],88:[1,57],89:[1,58],90:[1,56],96:[1,37],100:[1,43],101:[1,55],103:38,104:[1,64],106:[1,65],107:39,108:[1,66],109:40,110:[1,67],111:68,119:[1,41],124:36,125:[1,63],127:[1,29],128:[1,30],129:[1,31],130:[1,32],131:[1,33],132:[1,34]},{7:178,8:117,9:18,10:19,11:[1,20],12:6,13:7,14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,27:61,28:[1,72],29:48,30:[1,70],31:[1,71],32:22,33:[1,49],34:[1,50],35:[1,51],36:[1,52],37:[1,53],38:[1,54],39:21,44:62,45:[1,44],46:[1,45],47:[1,27],50:28,51:[1,59],52:[1,60],58:46,59:47,61:35,63:23,64:24,65:25,76:[1,69],79:[1,42],83:[1,26],88:[1,57],89:[1,58],90:[1,56],96:[1,37],100:[1,43],101:[1,55],103:38,104:[1,64],106:[1,65],107:39,108:[1,66],109:40,110:[1,67],111:68,119:[1,41],124:36,125:[1,63],127:[1,29],128:[1,30],129:[1,31],130:[1,32],131:[1,33],132:[1,34]},{7:179,8:117,9:18,10:19,11:[1,20],12:6,13:7,14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,27:61,28:[1,72],29:48,30:[1,70],31:[1,71],32:22,33:[1,49],34:[1,50],35:[1,51],36:[1,52],37:[1,53],38:[1,54],39:21,44:62,45:[1,44],46:[1,45],47:[1,27],50:28,51:[1,59],52:[1,60],58:46,59:47,61:35,63:23,64:24,65:25,76:[1,69],79:[1,42],83:[1,26],88:[1,57],89:[1,58],90:[1,56],96:[1,37],100:[1,43],101:[1,55],103:38,104:[1,64],106:[1,65],107:39,108:[1,66],109:40,110:[1,67],111:68,119:[1,41],124:36,125:[1,63],127:[1,29],128:[1,30],129:[1,31],130:[1,32],131:[1,33],132:[1,34]},{7:180,8:117,9:18,10:19,11:[1,20],12:6,13:7,14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,27:61,28:[1,72],29:48,30:[1,70],31:[1,71],32:22,33:[1,49],34:[1,50],35:[1,51],36:[1,52],37:[1,53],38:[1,54],39:21,44:62,45:[1,44],46:[1,45],47:[1,27],50:28,51:[1,59],52:[1,60],58:46,59:47,61:35,63:23,64:24,65:25,76:[1,69],79:[1,42],83:[1,26],88:[1,57],89:[1,58],90:[1,56],96:[1,37],100:[1,43],101:[1,55],103:38,104:[1,64],106:[1,65],107:39,108:[1,66],109:40,110:[1,67],111:68,119:[1,41],124:36,125:[1,63],127:[1,29],128:[1,30],129:[1,31],130:[1,32],131:[1,33],132:[1,34]},{7:181,8:117,9:18,10:19,11:[1,20],12:6,13:7,14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,27:61,28:[1,72],29:48,30:[1,70],31:[1,71],32:22,33:[1,49],34:[1,50],35:[1,51],36:[1,52],37:[1,53],38:[1,54],39:21,44:62,45:[1,44],46:[1,45],47:[1,27],50:28,51:[1,59],52:[1,60],58:46,59:47,61:35,63:23,64:24,65:25,76:[1,69],79:[1,42],83:[1,26],88:[1,57],89:[1,58],90:[1,56],96:[1,37],100:[1,43],101:[1,55],103:38,104:[1,64],106:[1,65],107:39,108:[1,66],109:40,110:[1,67],111:68,119:[1,41],124:36,125:[1,63],127:[1,29],128:[1,30],129:[1,31],130:[1,32],131:[1,33],132:[1,34]},{7:182,8:117,9:18,10:19,11:[1,20],12:6,13:7,14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,27:61,28:[1,72],29:48,30:[1,70],31:[1,71],32:22,33:[1,49],34:[1,50],35:[1,51],36:[1,52],37:[1,53],38:[1,54],39:21,44:62,45:[1,44],46:[1,45],47:[1,27],50:28,51:[1,59],52:[1,60],58:46,59:47,61:35,63:23,64:24,65:25,76:[1,69],79:[1,42],83:[1,26],88:[1,57],89:[1,58],90:[1,56],96:[1,37],100:[1,43],101:[1,55],103:38,104:[1,64],106:[1,65],107:39,108:[1,66],109:40,110:[1,67],111:68,119:[1,41],124:36,125:[1,63],127:[1,29],128:[1,30],129:[1,31],130:[1,32],131:[1,33],132:[1,34]},{7:183,8:117,9:18,10:19,11:[1,20],12:6,13:7,14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,27:61,28:[1,72],29:48,30:[1,70],31:[1,71],32:22,33:[1,49],34:[1,50],35:[1,51],36:[1,52],37:[1,53],38:[1,54],39:21,44:62,45:[1,44],46:[1,45],47:[1,27],50:28,51:[1,59],52:[1,60],58:46,59:47,61:35,63:23,64:24,65:25,76:[1,69],79:[1,42],83:[1,26],88:[1,57],89:[1,58],90:[1,56],96:[1,37],100:[1,43],101:[1,55],103:38,104:[1,64],106:[1,65],107:39,108:[1,66],109:40,110:[1,67],111:68,119:[1,41],124:36,125:[1,63],127:[1,29],128:[1,30],129:[1,31],130:[1,32],131:[1,33],132:[1,34]},{1:[2,150],6:[2,150],25:[2,150],26:[2,150],49:[2,150],54:[2,150],57:[2,150],73:[2,150],78:[2,150],86:[2,150],91:[2,150],93:[2,150],102:[2,150],104:[2,150],105:[2,150],106:[2,150],110:[2,150],118:[2,150],126:[2,150],129:[2,150],130:[2,150],133:[2,150],134:[2,150],135:[2,150],136:[2,150],137:[2,150],138:[2,150],139:[2,150]},{1:[2,155],6:[2,155],25:[2,155],26:[2,155],49:[2,155],54:[2,155],57:[2,155],73:[2,155],78:[2,155],86:[2,155],91:[2,155],93:[2,155],102:[2,155],104:[2,155],105:[2,155],106:[2,155],110:[2,155],118:[2,155],126:[2,155],129:[2,155],130:[2,155],133:[2,155],134:[2,155],135:[2,155],136:[2,155],137:[2,155],138:[2,155],139:[2,155]},{7:184,8:117,9:18,10:19,11:[1,20],12:6,13:7,14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,27:61,28:[1,72],29:48,30:[1,70],31:[1,71],32:22,33:[1,49],34:[1,50],35:[1,51],36:[1,52],37:[1,53],38:[1,54],39:21,44:62,45:[1,44],46:[1,45],47:[1,27],50:28,51:[1,59],52:[1,60],58:46,59:47,61:35,63:23,64:24,65:25,76:[1,69],79:[1,42],83:[1,26],88:[1,57],89:[1,58],90:[1,56],96:[1,37],100:[1,43],101:[1,55],103:38,104:[1,64],106:[1,65],107:39,108:[1,66],109:40,110:[1,67],111:68,119:[1,41],124:36,125:[1,63],127:[1,29],128:[1,30],129:[1,31],130:[1,32],131:[1,33],132:[1,34]},{1:[2,149],6:[2,149],25:[2,149],26:[2,149],49:[2,149],54:[2,149],57:[2,149],73:[2,149],78:[2,149],86:[2,149],91:[2,149],93:[2,149],102:[2,149],104:[2,149],105:[2,149],106:[2,149],110:[2,149],118:[2,149],126:[2,149],129:[2,149],130:[2,149],133:[2,149],134:[2,149],135:[2,149],136:[2,149],137:[2,149],138:[2,149],139:[2,149]},{1:[2,154],6:[2,154],25:[2,154],26:[2,154],49:[2,154],54:[2,154],57:[2,154],73:[2,154],78:[2,154],86:[2,154],91:[2,154],93:[2,154],102:[2,154],104:[2,154],105:[2,154],106:[2,154],110:[2,154],118:[2,154],126:[2,154],129:[2,154],130:[2,154],133:[2,154],134:[2,154],135:[2,154],136:[2,154],137:[2,154],138:[2,154],139:[2,154]},{82:185,85:[1,103]},{1:[2,69],6:[2,69],25:[2,69],26:[2,69],40:[2,69],49:[2,69],54:[2,69],57:[2,69],66:[2,69],67:[2,69],68:[2,69],69:[2,69],71:[2,69],73:[2,69],74:[2,69],78:[2,69],80:[2,69],84:[2,69],85:[2,69],86:[2,69],91:[2,69],93:[2,69],102:[2,69],104:[2,69],105:[2,69],106:[2,69],110:[2,69],118:[2,69],126:[2,69],129:[2,69],130:[2,69],131:[2,69],132:[2,69],133:[2,69],134:[2,69],135:[2,69],136:[2,69],137:[2,69],138:[2,69],139:[2,69],140:[2,69]},{85:[2,109]},{27:186,28:[1,72]},{27:187,28:[1,72]},{1:[2,84],6:[2,84],25:[2,84],26:[2,84],27:188,28:[1,72],40:[2,84],49:[2,84],54:[2,84],57:[2,84],66:[2,84],67:[2,84],68:[2,84],69:[2,84],71:[2,84],73:[2,84],74:[2,84],78:[2,84],80:[2,84],84:[2,84],85:[2,84],86:[2,84],91:[2,84],93:[2,84],102:[2,84],104:[2,84],105:[2,84],106:[2,84],110:[2,84],118:[2,84],126:[2,84],129:[2,84],130:[2,84],131:[2,84],132:[2,84],133:[2,84],134:[2,84],135:[2,84],136:[2,84],137:[2,84],138:[2,84],139:[2,84],140:[2,84]},{27:189,28:[1,72]},{1:[2,85],6:[2,85],25:[2,85],26:[2,85],40:[2,85],49:[2,85],54:[2,85],57:[2,85],66:[2,85],67:[2,85],68:[2,85],69:[2,85],71:[2,85],73:[2,85],74:[2,85],78:[2,85],80:[2,85],84:[2,85],85:[2,85],86:[2,85],91:[2,85],93:[2,85],102:[2,85],104:[2,85],105:[2,85],106:[2,85],110:[2,85],118:[2,85],126:[2,85],129:[2,85],130:[2,85],131:[2,85],132:[2,85],133:[2,85],134:[2,85],135:[2,85],136:[2,85],137:[2,85],138:[2,85],139:[2,85],140:[2,85]},{7:191,8:117,9:18,10:19,11:[1,20],12:6,13:7,14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,27:61,28:[1,72],29:48,30:[1,70],31:[1,71],32:22,33:[1,49],34:[1,50],35:[1,51],36:[1,52],37:[1,53],38:[1,54],39:21,44:62,45:[1,44],46:[1,45],47:[1,27],50:28,51:[1,59],52:[1,60],57:[1,195],58:46,59:47,61:35,63:23,64:24,65:25,72:190,75:192,76:[1,69],79:[1,42],83:[1,26],88:[1,57],89:[1,58],90:[1,56],92:193,93:[1,194],96:[1,37],100:[1,43],101:[1,55],103:38,104:[1,64],106:[1,65],107:39,108:[1,66],109:40,110:[1,67],111:68,119:[1,41],124:36,125:[1,63],127:[1,29],128:[1,30],129:[1,31],130:[1,32],131:[1,33],132:[1,34]},{70:196,71:[1,97],74:[1,98]},{82:197,85:[1,103]},{1:[2,70],6:[2,70],25:[2,70],26:[2,70],40:[2,70],49:[2,70],54:[2,70],57:[2,70],66:[2,70],67:[2,70],68:[2,70],69:[2,70],71:[2,70],73:[2,70],74:[2,70],78:[2,70],80:[2,70],84:[2,70],85:[2,70],86:[2,70],91:[2,70],93:[2,70],102:[2,70],104:[2,70],105:[2,70],106:[2,70],110:[2,70],118:[2,70],126:[2,70],129:[2,70],130:[2,70],131:[2,70],132:[2,70],133:[2,70],134:[2,70],135:[2,70],136:[2,70],137:[2,70],138:[2,70],139:[2,70],140:[2,70]},{6:[1,199],7:198,8:117,9:18,10:19,11:[1,20],12:6,13:7,14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,25:[1,200],27:61,28:[1,72],29:48,30:[1,70],31:[1,71],32:22,33:[1,49],34:[1,50],35:[1,51],36:[1,52],37:[1,53],38:[1,54],39:21,44:62,45:[1,44],46:[1,45],47:[1,27],50:28,51:[1,59],52:[1,60],58:46,59:47,61:35,63:23,64:24,65:25,76:[1,69],79:[1,42],83:[1,26],88:[1,57],89:[1,58],90:[1,56],96:[1,37],100:[1,43],101:[1,55],103:38,104:[1,64],106:[1,65],107:39,108:[1,66],109:40,110:[1,67],111:68,119:[1,41],124:36,125:[1,63],127:[1,29],128:[1,30],129:[1,31],130:[1,32],131:[1,33],132:[1,34]},{1:[2,107],6:[2,107],25:[2,107],26:[2,107],49:[2,107],54:[2,107],57:[2,107],66:[2,107],67:[2,107],68:[2,107],69:[2,107],71:[2,107],73:[2,107],74:[2,107],78:[2,107],84:[2,107],85:[2,107],86:[2,107],91:[2,107],93:[2,107],102:[2,107],104:[2,107],105:[2,107],106:[2,107],110:[2,107],118:[2,107],126:[2,107],129:[2,107],130:[2,107],133:[2,107],134:[2,107],135:[2,107],136:[2,107],137:[2,107],138:[2,107],139:[2,107]},{7:203,8:117,9:18,10:19,11:[1,20],12:6,13:7,14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,25:[1,147],27:61,28:[1,72],29:48,30:[1,70],31:[1,71],32:22,33:[1,49],34:[1,50],35:[1,51],36:[1,52],37:[1,53],38:[1,54],39:21,44:62,45:[1,44],46:[1,45],47:[1,27],50:28,51:[1,59],52:[1,60],57:[1,149],58:46,59:47,60:148,61:35,63:23,64:24,65:25,76:[1,69],79:[1,42],83:[1,26],86:[1,201],87:202,88:[1,57],89:[1,58],90:[1,56],94:146,96:[1,37],100:[1,43],101:[1,55],103:38,104:[1,64],106:[1,65],107:39,108:[1,66],109:40,110:[1,67],111:68,119:[1,41],124:36,125:[1,63],127:[1,29],128:[1,30],129:[1,31],130:[1,32],131:[1,33],132:[1,34]},{6:[2,52],25:[2,52],49:[1,204],53:206,54:[1,205]},{6:[2,55],25:[2,55],26:[2,55],49:[2,55],54:[2,55]},{6:[2,59],25:[2,59],26:[2,59],40:[1,208],49:[2,59],54:[2,59],57:[1,207]},{6:[2,62],25:[2,62],26:[2,62],49:[2,62],54:[2,62]},{6:[2,63],25:[2,63],26:[2,63],40:[2,63],49:[2,63],54:[2,63],57:[2,63]},{6:[2,64],25:[2,64],26:[2,64],40:[2,64],49:[2,64],54:[2,64],57:[2,64]},{6:[2,65],25:[2,65],26:[2,65],40:[2,65],49:[2,65],54:[2,65],57:[2,65]},{6:[2,66],25:[2,66],26:[2,66],40:[2,66],49:[2,66],54:[2,66],57:[2,66]},{27:150,28:[1,72]},{7:203,8:117,9:18,10:19,11:[1,20],12:6,13:7,14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,25:[1,147],27:61,28:[1,72],29:48,30:[1,70],31:[1,71],32:22,33:[1,49],34:[1,50],35:[1,51],36:[1,52],37:[1,53],38:[1,54],39:21,44:62,45:[1,44],46:[1,45],47:[1,27],50:28,51:[1,59],52:[1,60],57:[1,149],58:46,59:47,60:148,61:35,63:23,64:24,65:25,76:[1,69],79:[1,42],83:[1,26],87:145,88:[1,57],89:[1,58],90:[1,56],91:[1,144],94:146,96:[1,37],100:[1,43],101:[1,55],103:38,104:[1,64],106:[1,65],107:39,108:[1,66],109:40,110:[1,67],111:68,119:[1,41],124:36,125:[1,63],127:[1,29],128:[1,30],129:[1,31],130:[1,32],131:[1,33],132:[1,34]},{1:[2,49],6:[2,49],25:[2,49],26:[2,49],49:[2,49],54:[2,49],57:[2,49],73:[2,49],78:[2,49],86:[2,49],91:[2,49],93:[2,49],102:[2,49],104:[2,49],105:[2,49],106:[2,49],110:[2,49],118:[2,49],126:[2,49],129:[2,49],130:[2,49],133:[2,49],134:[2,49],135:[2,49],136:[2,49],137:[2,49],138:[2,49],139:[2,49]},{4:210,5:3,7:4,8:5,9:18,10:19,11:[1,20],12:6,13:7,14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,26:[1,209],27:61,28:[1,72],29:48,30:[1,70],31:[1,71],32:22,33:[1,49],34:[1,50],35:[1,51],36:[1,52],37:[1,53],38:[1,54],39:21,44:62,45:[1,44],46:[1,45],47:[1,27],50:28,51:[1,59],52:[1,60],58:46,59:47,61:35,63:23,64:24,65:25,76:[1,69],79:[1,42],83:[1,26],88:[1,57],89:[1,58],90:[1,56],96:[1,37],100:[1,43],101:[1,55],103:38,104:[1,64],106:[1,65],107:39,108:[1,66],109:40,110:[1,67],111:68,119:[1,41],124:36,125:[1,63],127:[1,29],128:[1,30],129:[1,31],130:[1,32],131:[1,33],132:[1,34]},{1:[2,188],6:[2,188],25:[2,188],26:[2,188],49:[2,188],54:[2,188],57:[2,188],73:[2,188],78:[2,188],86:[2,188],91:[2,188],93:[2,188],102:[2,188],103:84,104:[2,188],105:[2,188],106:[2,188],109:85,110:[2,188],111:68,118:[2,188],126:[2,188],129:[2,188],130:[2,188],133:[1,74],134:[2,188],135:[2,188],136:[2,188],137:[2,188],138:[2,188],139:[2,188]},{103:87,104:[1,64],106:[1,65],109:88,110:[1,67],111:68,126:[1,86]},{1:[2,189],6:[2,189],25:[2,189],26:[2,189],49:[2,189],54:[2,189],57:[2,189],73:[2,189],78:[2,189],86:[2,189],91:[2,189],93:[2,189],102:[2,189],103:84,104:[2,189],105:[2,189],106:[2,189],109:85,110:[2,189],111:68,118:[2,189],126:[2,189],129:[2,189],130:[2,189],133:[1,74],134:[2,189],135:[1,78],136:[2,189],137:[2,189],138:[2,189],139:[2,189]},{1:[2,190],6:[2,190],25:[2,190],26:[2,190],49:[2,190],54:[2,190],57:[2,190],73:[2,190],78:[2,190],86:[2,190],91:[2,190],93:[2,190],102:[2,190],103:84,104:[2,190],105:[2,190],106:[2,190],109:85,110:[2,190],111:68,118:[2,190],126:[2,190],129:[2,190],130:[2,190],133:[1,74],134:[2,190],135:[1,78],136:[2,190],137:[2,190],138:[2,190],139:[2,190]},{1:[2,191],6:[2,191],25:[2,191],26:[2,191],49:[2,191],54:[2,191],57:[2,191],73:[2,191],78:[2,191],86:[2,191],91:[2,191],93:[2,191],102:[2,191],103:84,104:[2,191],105:[2,191],106:[2,191],109:85,110:[2,191],111:68,118:[2,191],126:[2,191],129:[2,191],130:[2,191],133:[1,74],134:[2,191],135:[1,78],136:[2,191],137:[2,191],138:[2,191],139:[2,191]},{1:[2,192],6:[2,192],25:[2,192],26:[2,192],49:[2,192],54:[2,192],57:[2,192],66:[2,72],67:[2,72],68:[2,72],69:[2,72],71:[2,72],73:[2,192],74:[2,72],78:[2,192],84:[2,72],85:[2,72],86:[2,192],91:[2,192],93:[2,192],102:[2,192],104:[2,192],105:[2,192],106:[2,192],110:[2,192],118:[2,192],126:[2,192],129:[2,192],130:[2,192],133:[2,192],134:[2,192],135:[2,192],136:[2,192],137:[2,192],138:[2,192],139:[2,192]},{62:90,66:[1,92],67:[1,93],68:[1,94],69:[1,95],70:96,71:[1,97],74:[1,98],81:89,84:[1,91],85:[2,108]},{62:100,66:[1,92],67:[1,93],68:[1,94],69:[1,95],70:96,71:[1,97],74:[1,98],81:99,84:[1,91],85:[2,108]},{66:[2,75],67:[2,75],68:[2,75],69:[2,75],71:[2,75],74:[2,75],84:[2,75],85:[2,75]},{1:[2,193],6:[2,193],25:[2,193],26:[2,193],49:[2,193],54:[2,193],57:[2,193],66:[2,72],67:[2,72],68:[2,72],69:[2,72],71:[2,72],73:[2,193],74:[2,72],78:[2,193],84:[2,72],85:[2,72],86:[2,193],91:[2,193],93:[2,193],102:[2,193],104:[2,193],105:[2,193],106:[2,193],110:[2,193],118:[2,193],126:[2,193],129:[2,193],130:[2,193],133:[2,193],134:[2,193],135:[2,193],136:[2,193],137:[2,193],138:[2,193],139:[2,193]},{1:[2,194],6:[2,194],25:[2,194],26:[2,194],49:[2,194],54:[2,194],57:[2,194],73:[2,194],78:[2,194],86:[2,194],91:[2,194],93:[2,194],102:[2,194],104:[2,194],105:[2,194],106:[2,194],110:[2,194],118:[2,194],126:[2,194],129:[2,194],130:[2,194],133:[2,194],134:[2,194],135:[2,194],136:[2,194],137:[2,194],138:[2,194],139:[2,194]},{1:[2,195],6:[2,195],25:[2,195],26:[2,195],49:[2,195],54:[2,195],57:[2,195],73:[2,195],78:[2,195],86:[2,195],91:[2,195],93:[2,195],102:[2,195],104:[2,195],105:[2,195],106:[2,195],110:[2,195],118:[2,195],126:[2,195],129:[2,195],130:[2,195],133:[2,195],134:[2,195],135:[2,195],136:[2,195],137:[2,195],138:[2,195],139:[2,195]},{6:[1,213],7:211,8:117,9:18,10:19,11:[1,20],12:6,13:7,14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,25:[1,212],27:61,28:[1,72],29:48,30:[1,70],31:[1,71],32:22,33:[1,49],34:[1,50],35:[1,51],36:[1,52],37:[1,53],38:[1,54],39:21,44:62,45:[1,44],46:[1,45],47:[1,27],50:28,51:[1,59],52:[1,60],58:46,59:47,61:35,63:23,64:24,65:25,76:[1,69],79:[1,42],83:[1,26],88:[1,57],89:[1,58],90:[1,56],96:[1,37],100:[1,43],101:[1,55],103:38,104:[1,64],106:[1,65],107:39,108:[1,66],109:40,110:[1,67],111:68,119:[1,41],124:36,125:[1,63],127:[1,29],128:[1,30],129:[1,31],130:[1,32],131:[1,33],132:[1,34]},{7:214,8:117,9:18,10:19,11:[1,20],12:6,13:7,14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,27:61,28:[1,72],29:48,30:[1,70],31:[1,71],32:22,33:[1,49],34:[1,50],35:[1,51],36:[1,52],37:[1,53],38:[1,54],39:21,44:62,45:[1,44],46:[1,45],47:[1,27],50:28,51:[1,59],52:[1,60],58:46,59:47,61:35,63:23,64:24,65:25,76:[1,69],79:[1,42],83:[1,26],88:[1,57],89:[1,58],90:[1,56],96:[1,37],100:[1,43],101:[1,55],103:38,104:[1,64],106:[1,65],107:39,108:[1,66],109:40,110:[1,67],111:68,119:[1,41],124:36,125:[1,63],127:[1,29],128:[1,30],129:[1,31],130:[1,32],131:[1,33],132:[1,34]},{24:215,25:[1,115],125:[1,216]},{1:[2,134],6:[2,134],25:[2,134],26:[2,134],49:[2,134],54:[2,134],57:[2,134],73:[2,134],78:[2,134],86:[2,134],91:[2,134],93:[2,134],97:217,98:[1,218],99:[1,219],102:[2,134],104:[2,134],105:[2,134],106:[2,134],110:[2,134],118:[2,134],126:[2,134],129:[2,134],130:[2,134],133:[2,134],134:[2,134],135:[2,134],136:[2,134],137:[2,134],138:[2,134],139:[2,134]},{1:[2,148],6:[2,148],25:[2,148],26:[2,148],49:[2,148],54:[2,148],57:[2,148],73:[2,148],78:[2,148],86:[2,148],91:[2,148],93:[2,148],102:[2,148],104:[2,148],105:[2,148],106:[2,148],110:[2,148],118:[2,148],126:[2,148],129:[2,148],130:[2,148],133:[2,148],134:[2,148],135:[2,148],136:[2,148],137:[2,148],138:[2,148],139:[2,148]},{1:[2,156],6:[2,156],25:[2,156],26:[2,156],49:[2,156],54:[2,156],57:[2,156],73:[2,156],78:[2,156],86:[2,156],91:[2,156],93:[2,156],102:[2,156],104:[2,156],105:[2,156],106:[2,156],110:[2,156],118:[2,156],126:[2,156],129:[2,156],130:[2,156],133:[2,156],134:[2,156],135:[2,156],136:[2,156],137:[2,156],138:[2,156],139:[2,156]},{25:[1,220],103:84,104:[1,64],106:[1,65],109:85,110:[1,67],111:68,126:[1,83],129:[1,76],130:[1,75],133:[1,74],134:[1,77],135:[1,78],136:[1,79],137:[1,80],138:[1,81],139:[1,82]},{120:221,122:222,123:[1,223]},{1:[2,97],6:[2,97],25:[2,97],26:[2,97],49:[2,97],54:[2,97],57:[2,97],73:[2,97],78:[2,97],86:[2,97],91:[2,97],93:[2,97],102:[2,97],104:[2,97],105:[2,97],106:[2,97],110:[2,97],118:[2,97],126:[2,97],129:[2,97],130:[2,97],133:[2,97],134:[2,97],135:[2,97],136:[2,97],137:[2,97],138:[2,97],139:[2,97]},{7:224,8:117,9:18,10:19,11:[1,20],12:6,13:7,14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,27:61,28:[1,72],29:48,30:[1,70],31:[1,71],32:22,33:[1,49],34:[1,50],35:[1,51],36:[1,52],37:[1,53],38:[1,54],39:21,44:62,45:[1,44],46:[1,45],47:[1,27],50:28,51:[1,59],52:[1,60],58:46,59:47,61:35,63:23,64:24,65:25,76:[1,69],79:[1,42],83:[1,26],88:[1,57],89:[1,58],90:[1,56],96:[1,37],100:[1,43],101:[1,55],103:38,104:[1,64],106:[1,65],107:39,108:[1,66],109:40,110:[1,67],111:68,119:[1,41],124:36,125:[1,63],127:[1,29],128:[1,30],129:[1,31],130:[1,32],131:[1,33],132:[1,34]},{1:[2,100],6:[2,100],24:225,25:[1,115],26:[2,100],49:[2,100],54:[2,100],57:[2,100],66:[2,72],67:[2,72],68:[2,72],69:[2,72],71:[2,72],73:[2,100],74:[2,72],78:[2,100],80:[1,226],84:[2,72],85:[2,72],86:[2,100],91:[2,100],93:[2,100],102:[2,100],104:[2,100],105:[2,100],106:[2,100],110:[2,100],118:[2,100],126:[2,100],129:[2,100],130:[2,100],133:[2,100],134:[2,100],135:[2,100],136:[2,100],137:[2,100],138:[2,100],139:[2,100]},{1:[2,141],6:[2,141],25:[2,141],26:[2,141],49:[2,141],54:[2,141],57:[2,141],73:[2,141],78:[2,141],86:[2,141],91:[2,141],93:[2,141],102:[2,141],103:84,104:[2,141],105:[2,141],106:[2,141],109:85,110:[2,141],111:68,118:[2,141],126:[2,141],129:[1,76],130:[1,75],133:[1,74],134:[1,77],135:[1,78],136:[1,79],137:[1,80],138:[1,81],139:[1,82]},{1:[2,45],6:[2,45],26:[2,45],102:[2,45],103:84,104:[2,45],106:[2,45],109:85,110:[2,45],111:68,126:[2,45],129:[1,76],130:[1,75],133:[1,74],134:[1,77],135:[1,78],136:[1,79],137:[1,80],138:[1,81],139:[1,82]},{6:[1,73],102:[1,227]},{4:228,5:3,7:4,8:5,9:18,10:19,11:[1,20],12:6,13:7,14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,27:61,28:[1,72],29:48,30:[1,70],31:[1,71],32:22,33:[1,49],34:[1,50],35:[1,51],36:[1,52],37:[1,53],38:[1,54],39:21,44:62,45:[1,44],46:[1,45],47:[1,27],50:28,51:[1,59],52:[1,60],58:46,59:47,61:35,63:23,64:24,65:25,76:[1,69],79:[1,42],83:[1,26],88:[1,57],89:[1,58],90:[1,56],96:[1,37],100:[1,43],101:[1,55],103:38,104:[1,64],106:[1,65],107:39,108:[1,66],109:40,110:[1,67],111:68,119:[1,41],124:36,125:[1,63],127:[1,29],128:[1,30],129:[1,31],130:[1,32],131:[1,33],132:[1,34]},{6:[2,129],25:[2,129],54:[2,129],57:[1,230],91:[2,129],92:229,93:[1,194],103:84,104:[1,64],106:[1,65],109:85,110:[1,67],111:68,126:[1,83],129:[1,76],130:[1,75],133:[1,74],134:[1,77],135:[1,78],136:[1,79],137:[1,80],138:[1,81],139:[1,82]},{1:[2,115],6:[2,115],25:[2,115],26:[2,115],40:[2,115],49:[2,115],54:[2,115],57:[2,115],66:[2,115],67:[2,115],68:[2,115],69:[2,115],71:[2,115],73:[2,115],74:[2,115],78:[2,115],84:[2,115],85:[2,115],86:[2,115],91:[2,115],93:[2,115],102:[2,115],104:[2,115],105:[2,115],106:[2,115],110:[2,115],116:[2,115],117:[2,115],118:[2,115],126:[2,115],129:[2,115],130:[2,115],133:[2,115],134:[2,115],135:[2,115],136:[2,115],137:[2,115],138:[2,115],139:[2,115]},{6:[2,52],25:[2,52],53:231,54:[1,232],91:[2,52]},{6:[2,124],25:[2,124],26:[2,124],54:[2,124],86:[2,124],91:[2,124]},{7:203,8:117,9:18,10:19,11:[1,20],12:6,13:7,14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,25:[1,147],27:61,28:[1,72],29:48,30:[1,70],31:[1,71],32:22,33:[1,49],34:[1,50],35:[1,51],36:[1,52],37:[1,53],38:[1,54],39:21,44:62,45:[1,44],46:[1,45],47:[1,27],50:28,51:[1,59],52:[1,60],57:[1,149],58:46,59:47,60:148,61:35,63:23,64:24,65:25,76:[1,69],79:[1,42],83:[1,26],87:233,88:[1,57],89:[1,58],90:[1,56],94:146,96:[1,37],100:[1,43],101:[1,55],103:38,104:[1,64],106:[1,65],107:39,108:[1,66],109:40,110:[1,67],111:68,119:[1,41],124:36,125:[1,63],127:[1,29],128:[1,30],129:[1,31],130:[1,32],131:[1,33],132:[1,34]},{6:[2,130],25:[2,130],26:[2,130],54:[2,130],86:[2,130],91:[2,130]},{6:[2,131],25:[2,131],26:[2,131],54:[2,131],86:[2,131],91:[2,131]},{1:[2,114],6:[2,114],25:[2,114],26:[2,114],40:[2,114],43:[2,114],49:[2,114],54:[2,114],57:[2,114],66:[2,114],67:[2,114],68:[2,114],69:[2,114],71:[2,114],73:[2,114],74:[2,114],78:[2,114],80:[2,114],84:[2,114],85:[2,114],86:[2,114],91:[2,114],93:[2,114],102:[2,114],104:[2,114],105:[2,114],106:[2,114],110:[2,114],116:[2,114],117:[2,114],118:[2,114],126:[2,114],129:[2,114],130:[2,114],131:[2,114],132:[2,114],133:[2,114],134:[2,114],135:[2,114],136:[2,114],137:[2,114],138:[2,114],139:[2,114],140:[2,114]},{24:234,25:[1,115],103:84,104:[1,64],106:[1,65],109:85,110:[1,67],111:68,126:[1,83],129:[1,76],130:[1,75],133:[1,74],134:[1,77],135:[1,78],136:[1,79],137:[1,80],138:[1,81],139:[1,82]},{1:[2,144],6:[2,144],25:[2,144],26:[2,144],49:[2,144],54:[2,144],57:[2,144],73:[2,144],78:[2,144],86:[2,144],91:[2,144],93:[2,144],102:[2,144],103:84,104:[1,64],105:[1,235],106:[1,65],109:85,110:[1,67],111:68,118:[2,144],126:[2,144],129:[1,76],130:[1,75],133:[1,74],134:[1,77],135:[1,78],136:[1,79],137:[1,80],138:[1,81],139:[1,82]},{1:[2,146],6:[2,146],25:[2,146],26:[2,146],49:[2,146],54:[2,146],57:[2,146],73:[2,146],78:[2,146],86:[2,146],91:[2,146],93:[2,146],102:[2,146],103:84,104:[1,64],105:[1,236],106:[1,65],109:85,110:[1,67],111:68,118:[2,146],126:[2,146],129:[1,76],130:[1,75],133:[1,74],134:[1,77],135:[1,78],136:[1,79],137:[1,80],138:[1,81],139:[1,82]},{1:[2,152],6:[2,152],25:[2,152],26:[2,152],49:[2,152],54:[2,152],57:[2,152],73:[2,152],78:[2,152],86:[2,152],91:[2,152],93:[2,152],102:[2,152],104:[2,152],105:[2,152],106:[2,152],110:[2,152],118:[2,152],126:[2,152],129:[2,152],130:[2,152],133:[2,152],134:[2,152],135:[2,152],136:[2,152],137:[2,152],138:[2,152],139:[2,152]},{1:[2,153],6:[2,153],25:[2,153],26:[2,153],49:[2,153],54:[2,153],57:[2,153],73:[2,153],78:[2,153],86:[2,153],91:[2,153],93:[2,153],102:[2,153],103:84,104:[1,64],105:[2,153],106:[1,65],109:85,110:[1,67],111:68,118:[2,153],126:[2,153],129:[1,76],130:[1,75],133:[1,74],134:[1,77],135:[1,78],136:[1,79],137:[1,80],138:[1,81],139:[1,82]},{1:[2,157],6:[2,157],25:[2,157],26:[2,157],49:[2,157],54:[2,157],57:[2,157],73:[2,157],78:[2,157],86:[2,157],91:[2,157],93:[2,157],102:[2,157],104:[2,157],105:[2,157],106:[2,157],110:[2,157],118:[2,157],126:[2,157],129:[2,157],130:[2,157],133:[2,157],134:[2,157],135:[2,157],136:[2,157],137:[2,157],138:[2,157],139:[2,157]},{116:[2,159],117:[2,159]},{27:160,28:[1,72],44:161,58:162,59:163,76:[1,69],89:[1,112],90:[1,113],113:237,115:159},{54:[1,238],116:[2,165],117:[2,165]},{54:[2,161],116:[2,161],117:[2,161]},{54:[2,162],116:[2,162],117:[2,162]},{54:[2,163],116:[2,163],117:[2,163]},{54:[2,164],116:[2,164],117:[2,164]},{1:[2,158],6:[2,158],25:[2,158],26:[2,158],49:[2,158],54:[2,158],57:[2,158],73:[2,158],78:[2,158],86:[2,158],91:[2,158],93:[2,158],102:[2,158],104:[2,158],105:[2,158],106:[2,158],110:[2,158],118:[2,158],126:[2,158],129:[2,158],130:[2,158],133:[2,158],134:[2,158],135:[2,158],136:[2,158],137:[2,158],138:[2,158],139:[2,158]},{7:239,8:117,9:18,10:19,11:[1,20],12:6,13:7,14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,27:61,28:[1,72],29:48,30:[1,70],31:[1,71],32:22,33:[1,49],34:[1,50],35:[1,51],36:[1,52],37:[1,53],38:[1,54],39:21,44:62,45:[1,44],46:[1,45],47:[1,27],50:28,51:[1,59],52:[1,60],58:46,59:47,61:35,63:23,64:24,65:25,76:[1,69],79:[1,42],83:[1,26],88:[1,57],89:[1,58],90:[1,56],96:[1,37],100:[1,43],101:[1,55],103:38,104:[1,64],106:[1,65],107:39,108:[1,66],109:40,110:[1,67],111:68,119:[1,41],124:36,125:[1,63],127:[1,29],128:[1,30],129:[1,31],130:[1,32],131:[1,33],132:[1,34]},{7:240,8:117,9:18,10:19,11:[1,20],12:6,13:7,14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,27:61,28:[1,72],29:48,30:[1,70],31:[1,71],32:22,33:[1,49],34:[1,50],35:[1,51],36:[1,52],37:[1,53],38:[1,54],39:21,44:62,45:[1,44],46:[1,45],47:[1,27],50:28,51:[1,59],52:[1,60],58:46,59:47,61:35,63:23,64:24,65:25,76:[1,69],79:[1,42],83:[1,26],88:[1,57],89:[1,58],90:[1,56],96:[1,37],100:[1,43],101:[1,55],103:38,104:[1,64],106:[1,65],107:39,108:[1,66],109:40,110:[1,67],111:68,119:[1,41],124:36,125:[1,63],127:[1,29],128:[1,30],129:[1,31],130:[1,32],131:[1,33],132:[1,34]},{6:[2,52],25:[2,52],53:241,54:[1,242],78:[2,52]},{6:[2,92],25:[2,92],26:[2,92],54:[2,92],78:[2,92]},{6:[2,38],25:[2,38],26:[2,38],43:[1,243],54:[2,38],78:[2,38]},{6:[2,41],25:[2,41],26:[2,41],54:[2,41],78:[2,41]},{6:[2,42],25:[2,42],26:[2,42],43:[2,42],54:[2,42],78:[2,42]},{6:[2,43],25:[2,43],26:[2,43],43:[2,43],54:[2,43],78:[2,43]},{6:[2,44],25:[2,44],26:[2,44],43:[2,44],54:[2,44],78:[2,44]},{1:[2,4],6:[2,4],26:[2,4],102:[2,4]},{1:[2,197],6:[2,197],25:[2,197],26:[2,197],49:[2,197],54:[2,197],57:[2,197],73:[2,197],78:[2,197],86:[2,197],91:[2,197],93:[2,197],102:[2,197],103:84,104:[2,197],105:[2,197],106:[2,197],109:85,110:[2,197],111:68,118:[2,197],126:[2,197],129:[2,197],130:[2,197],133:[1,74],134:[1,77],135:[1,78],136:[2,197],137:[2,197],138:[2,197],139:[2,197]},{1:[2,198],6:[2,198],25:[2,198],26:[2,198],49:[2,198],54:[2,198],57:[2,198],73:[2,198],78:[2,198],86:[2,198],91:[2,198],93:[2,198],102:[2,198],103:84,104:[2,198],105:[2,198],106:[2,198],109:85,110:[2,198],111:68,118:[2,198],126:[2,198],129:[2,198],130:[2,198],133:[1,74],134:[1,77],135:[1,78],136:[2,198],137:[2,198],138:[2,198],139:[2,198]},{1:[2,199],6:[2,199],25:[2,199],26:[2,199],49:[2,199],54:[2,199],57:[2,199],73:[2,199],78:[2,199],86:[2,199],91:[2,199],93:[2,199],102:[2,199],103:84,104:[2,199],105:[2,199],106:[2,199],109:85,110:[2,199],111:68,118:[2,199],126:[2,199],129:[2,199],130:[2,199],133:[1,74],134:[2,199],135:[1,78],136:[2,199],137:[2,199],138:[2,199],139:[2,199]},{1:[2,200],6:[2,200],25:[2,200],26:[2,200],49:[2,200],54:[2,200],57:[2,200],73:[2,200],78:[2,200],86:[2,200],91:[2,200],93:[2,200],102:[2,200],103:84,104:[2,200],105:[2,200],106:[2,200],109:85,110:[2,200],111:68,118:[2,200],126:[2,200],129:[2,200],130:[2,200],133:[1,74],134:[2,200],135:[1,78],136:[2,200],137:[2,200],138:[2,200],139:[2,200]},{1:[2,201],6:[2,201],25:[2,201],26:[2,201],49:[2,201],54:[2,201],57:[2,201],73:[2,201],78:[2,201],86:[2,201],91:[2,201],93:[2,201],102:[2,201],103:84,104:[2,201],105:[2,201],106:[2,201],109:85,110:[2,201],111:68,118:[2,201],126:[2,201],129:[1,76],130:[1,75],133:[1,74],134:[1,77],135:[1,78],136:[2,201],137:[2,201],138:[2,201],139:[2,201]},{1:[2,202],6:[2,202],25:[2,202],26:[2,202],49:[2,202],54:[2,202],57:[2,202],73:[2,202],78:[2,202],86:[2,202],91:[2,202],93:[2,202],102:[2,202],103:84,104:[2,202],105:[2,202],106:[2,202],109:85,110:[2,202],111:68,118:[2,202],126:[2,202],129:[1,76],130:[1,75],133:[1,74],134:[1,77],135:[1,78],136:[1,79],137:[2,202],138:[2,202],139:[1,82]},{1:[2,203],6:[2,203],25:[2,203],26:[2,203],49:[2,203],54:[2,203],57:[2,203],73:[2,203],78:[2,203],86:[2,203],91:[2,203],93:[2,203],102:[2,203],103:84,104:[2,203],105:[2,203],106:[2,203],109:85,110:[2,203],111:68,118:[2,203],126:[2,203],129:[1,76],130:[1,75],133:[1,74],134:[1,77],135:[1,78],136:[1,79],137:[1,80],138:[2,203],139:[1,82]},{1:[2,204],6:[2,204],25:[2,204],26:[2,204],49:[2,204],54:[2,204],57:[2,204],73:[2,204],78:[2,204],86:[2,204],91:[2,204],93:[2,204],102:[2,204],103:84,104:[2,204],105:[2,204],106:[2,204],109:85,110:[2,204],111:68,118:[2,204],126:[2,204],129:[1,76],130:[1,75],133:[1,74],134:[1,77],135:[1,78],136:[1,79],137:[2,204],138:[2,204],139:[2,204]},{1:[2,187],6:[2,187],25:[2,187],26:[2,187],49:[2,187],54:[2,187],57:[2,187],73:[2,187],78:[2,187],86:[2,187],91:[2,187],93:[2,187],102:[2,187],103:84,104:[1,64],105:[2,187],106:[1,65],109:85,110:[1,67],111:68,118:[2,187],126:[2,187],129:[1,76],130:[1,75],133:[1,74],134:[1,77],135:[1,78],136:[1,79],137:[1,80],138:[1,81],139:[1,82]},{1:[2,186],6:[2,186],25:[2,186],26:[2,186],49:[2,186],54:[2,186],57:[2,186],73:[2,186],78:[2,186],86:[2,186],91:[2,186],93:[2,186],102:[2,186],103:84,104:[1,64],105:[2,186],106:[1,65],109:85,110:[1,67],111:68,118:[2,186],126:[2,186],129:[1,76],130:[1,75],133:[1,74],134:[1,77],135:[1,78],136:[1,79],137:[1,80],138:[1,81],139:[1,82]},{1:[2,104],6:[2,104],25:[2,104],26:[2,104],49:[2,104],54:[2,104],57:[2,104],66:[2,104],67:[2,104],68:[2,104],69:[2,104],71:[2,104],73:[2,104],74:[2,104],78:[2,104],84:[2,104],85:[2,104],86:[2,104],91:[2,104],93:[2,104],102:[2,104],104:[2,104],105:[2,104],106:[2,104],110:[2,104],118:[2,104],126:[2,104],129:[2,104],130:[2,104],133:[2,104],134:[2,104],135:[2,104],136:[2,104],137:[2,104],138:[2,104],139:[2,104]},{1:[2,80],6:[2,80],25:[2,80],26:[2,80],40:[2,80],49:[2,80],54:[2,80],57:[2,80],66:[2,80],67:[2,80],68:[2,80],69:[2,80],71:[2,80],73:[2,80],74:[2,80],78:[2,80],80:[2,80],84:[2,80],85:[2,80],86:[2,80],91:[2,80],93:[2,80],102:[2,80],104:[2,80],105:[2,80],106:[2,80],110:[2,80],118:[2,80],126:[2,80],129:[2,80],130:[2,80],131:[2,80],132:[2,80],133:[2,80],134:[2,80],135:[2,80],136:[2,80],137:[2,80],138:[2,80],139:[2,80],140:[2,80]},{1:[2,81],6:[2,81],25:[2,81],26:[2,81],40:[2,81],49:[2,81],54:[2,81],57:[2,81],66:[2,81],67:[2,81],68:[2,81],69:[2,81],71:[2,81],73:[2,81],74:[2,81],78:[2,81],80:[2,81],84:[2,81],85:[2,81],86:[2,81],91:[2,81],93:[2,81],102:[2,81],104:[2,81],105:[2,81],106:[2,81],110:[2,81],118:[2,81],126:[2,81],129:[2,81],130:[2,81],131:[2,81],132:[2,81],133:[2,81],134:[2,81],135:[2,81],136:[2,81],137:[2,81],138:[2,81],139:[2,81],140:[2,81]},{1:[2,82],6:[2,82],25:[2,82],26:[2,82],40:[2,82],49:[2,82],54:[2,82],57:[2,82],66:[2,82],67:[2,82],68:[2,82],69:[2,82],71:[2,82],73:[2,82],74:[2,82],78:[2,82],80:[2,82],84:[2,82],85:[2,82],86:[2,82],91:[2,82],93:[2,82],102:[2,82],104:[2,82],105:[2,82],106:[2,82],110:[2,82],118:[2,82],126:[2,82],129:[2,82],130:[2,82],131:[2,82],132:[2,82],133:[2,82],134:[2,82],135:[2,82],136:[2,82],137:[2,82],138:[2,82],139:[2,82],140:[2,82]},{1:[2,83],6:[2,83],25:[2,83],26:[2,83],40:[2,83],49:[2,83],54:[2,83],57:[2,83],66:[2,83],67:[2,83],68:[2,83],69:[2,83],71:[2,83],73:[2,83],74:[2,83],78:[2,83],80:[2,83],84:[2,83],85:[2,83],86:[2,83],91:[2,83],93:[2,83],102:[2,83],104:[2,83],105:[2,83],106:[2,83],110:[2,83],118:[2,83],126:[2,83],129:[2,83],130:[2,83],131:[2,83],132:[2,83],133:[2,83],134:[2,83],135:[2,83],136:[2,83],137:[2,83],138:[2,83],139:[2,83],140:[2,83]},{73:[1,244]},{57:[1,195],73:[2,88],92:245,93:[1,194],103:84,104:[1,64],106:[1,65],109:85,110:[1,67],111:68,126:[1,83],129:[1,76],130:[1,75],133:[1,74],134:[1,77],135:[1,78],136:[1,79],137:[1,80],138:[1,81],139:[1,82]},{73:[2,89]},{7:246,8:117,9:18,10:19,11:[1,20],12:6,13:7,14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,27:61,28:[1,72],29:48,30:[1,70],31:[1,71],32:22,33:[1,49],34:[1,50],35:[1,51],36:[1,52],37:[1,53],38:[1,54],39:21,44:62,45:[1,44],46:[1,45],47:[1,27],50:28,51:[1,59],52:[1,60],58:46,59:47,61:35,63:23,64:24,65:25,73:[2,123],76:[1,69],79:[1,42],83:[1,26],88:[1,57],89:[1,58],90:[1,56],96:[1,37],100:[1,43],101:[1,55],103:38,104:[1,64],106:[1,65],107:39,108:[1,66],109:40,110:[1,67],111:68,119:[1,41],124:36,125:[1,63],127:[1,29],128:[1,30],129:[1,31],130:[1,32],131:[1,33],132:[1,34]},{11:[2,117],28:[2,117],30:[2,117],31:[2,117],33:[2,117],34:[2,117],35:[2,117],36:[2,117],37:[2,117],38:[2,117],45:[2,117],46:[2,117],47:[2,117],51:[2,117],52:[2,117],73:[2,117],76:[2,117],79:[2,117],83:[2,117],88:[2,117],89:[2,117],90:[2,117],96:[2,117],100:[2,117],101:[2,117],104:[2,117],106:[2,117],108:[2,117],110:[2,117],119:[2,117],125:[2,117],127:[2,117],128:[2,117],129:[2,117],130:[2,117],131:[2,117],132:[2,117]},{11:[2,118],28:[2,118],30:[2,118],31:[2,118],33:[2,118],34:[2,118],35:[2,118],36:[2,118],37:[2,118],38:[2,118],45:[2,118],46:[2,118],47:[2,118],51:[2,118],52:[2,118],73:[2,118],76:[2,118],79:[2,118],83:[2,118],88:[2,118],89:[2,118],90:[2,118],96:[2,118],100:[2,118],101:[2,118],104:[2,118],106:[2,118],108:[2,118],110:[2,118],119:[2,118],125:[2,118],127:[2,118],128:[2,118],129:[2,118],130:[2,118],131:[2,118],132:[2,118]},{1:[2,87],6:[2,87],25:[2,87],26:[2,87],40:[2,87],49:[2,87],54:[2,87],57:[2,87],66:[2,87],67:[2,87],68:[2,87],69:[2,87],71:[2,87],73:[2,87],74:[2,87],78:[2,87],80:[2,87],84:[2,87],85:[2,87],86:[2,87],91:[2,87],93:[2,87],102:[2,87],104:[2,87],105:[2,87],106:[2,87],110:[2,87],118:[2,87],126:[2,87],129:[2,87],130:[2,87],131:[2,87],132:[2,87],133:[2,87],134:[2,87],135:[2,87],136:[2,87],137:[2,87],138:[2,87],139:[2,87],140:[2,87]},{1:[2,105],6:[2,105],25:[2,105],26:[2,105],49:[2,105],54:[2,105],57:[2,105],66:[2,105],67:[2,105],68:[2,105],69:[2,105],71:[2,105],73:[2,105],74:[2,105],78:[2,105],84:[2,105],85:[2,105],86:[2,105],91:[2,105],93:[2,105],102:[2,105],104:[2,105],105:[2,105],106:[2,105],110:[2,105],118:[2,105],126:[2,105],129:[2,105],130:[2,105],133:[2,105],134:[2,105],135:[2,105],136:[2,105],137:[2,105],138:[2,105],139:[2,105]},{1:[2,35],6:[2,35],25:[2,35],26:[2,35],49:[2,35],54:[2,35],57:[2,35],73:[2,35],78:[2,35],86:[2,35],91:[2,35],93:[2,35],102:[2,35],103:84,104:[2,35],105:[2,35],106:[2,35],109:85,110:[2,35],111:68,118:[2,35],126:[2,35],129:[1,76],130:[1,75],133:[1,74],134:[1,77],135:[1,78],136:[1,79],137:[1,80],138:[1,81],139:[1,82]},{7:247,8:117,9:18,10:19,11:[1,20],12:6,13:7,14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,27:61,28:[1,72],29:48,30:[1,70],31:[1,71],32:22,33:[1,49],34:[1,50],35:[1,51],36:[1,52],37:[1,53],38:[1,54],39:21,44:62,45:[1,44],46:[1,45],47:[1,27],50:28,51:[1,59],52:[1,60],58:46,59:47,61:35,63:23,64:24,65:25,76:[1,69],79:[1,42],83:[1,26],88:[1,57],89:[1,58],90:[1,56],96:[1,37],100:[1,43],101:[1,55],103:38,104:[1,64],106:[1,65],107:39,108:[1,66],109:40,110:[1,67],111:68,119:[1,41],124:36,125:[1,63],127:[1,29],128:[1,30],129:[1,31],130:[1,32],131:[1,33],132:[1,34]},{7:248,8:117,9:18,10:19,11:[1,20],12:6,13:7,14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,27:61,28:[1,72],29:48,30:[1,70],31:[1,71],32:22,33:[1,49],34:[1,50],35:[1,51],36:[1,52],37:[1,53],38:[1,54],39:21,44:62,45:[1,44],46:[1,45],47:[1,27],50:28,51:[1,59],52:[1,60],58:46,59:47,61:35,63:23,64:24,65:25,76:[1,69],79:[1,42],83:[1,26],88:[1,57],89:[1,58],90:[1,56],96:[1,37],100:[1,43],101:[1,55],103:38,104:[1,64],106:[1,65],107:39,108:[1,66],109:40,110:[1,67],111:68,119:[1,41],124:36,125:[1,63],127:[1,29],128:[1,30],129:[1,31],130:[1,32],131:[1,33],132:[1,34]},{1:[2,110],6:[2,110],25:[2,110],26:[2,110],49:[2,110],54:[2,110],57:[2,110],66:[2,110],67:[2,110],68:[2,110],69:[2,110],71:[2,110],73:[2,110],74:[2,110],78:[2,110],84:[2,110],85:[2,110],86:[2,110],91:[2,110],93:[2,110],102:[2,110],104:[2,110],105:[2,110],106:[2,110],110:[2,110],118:[2,110],126:[2,110],129:[2,110],130:[2,110],133:[2,110],134:[2,110],135:[2,110],136:[2,110],137:[2,110],138:[2,110],139:[2,110]},{6:[2,52],25:[2,52],53:249,54:[1,232],86:[2,52]},{6:[2,129],25:[2,129],26:[2,129],54:[2,129],57:[1,250],86:[2,129],91:[2,129],103:84,104:[1,64],106:[1,65],109:85,110:[1,67],111:68,126:[1,83],129:[1,76],130:[1,75],133:[1,74],134:[1,77],135:[1,78],136:[1,79],137:[1,80],138:[1,81],139:[1,82]},{50:251,51:[1,59],52:[1,60]},{6:[2,53],25:[2,53],26:[2,53],27:108,28:[1,72],44:109,55:252,56:106,57:[1,107],58:110,59:111,76:[1,69],89:[1,112],90:[1,113]},{6:[1,253],25:[1,254]},{6:[2,60],25:[2,60],26:[2,60],49:[2,60],54:[2,60]},{7:255,8:117,9:18,10:19,11:[1,20],12:6,13:7,14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,27:61,28:[1,72],29:48,30:[1,70],31:[1,71],32:22,33:[1,49],34:[1,50],35:[1,51],36:[1,52],37:[1,53],38:[1,54],39:21,44:62,45:[1,44],46:[1,45],47:[1,27],50:28,51:[1,59],52:[1,60],58:46,59:47,61:35,63:23,64:24,65:25,76:[1,69],79:[1,42],83:[1,26],88:[1,57],89:[1,58],90:[1,56],96:[1,37],100:[1,43],101:[1,55],103:38,104:[1,64],106:[1,65],107:39,108:[1,66],109:40,110:[1,67],111:68,119:[1,41],124:36,125:[1,63],127:[1,29],128:[1,30],129:[1,31],130:[1,32],131:[1,33],132:[1,34]},{1:[2,23],6:[2,23],25:[2,23],26:[2,23],49:[2,23],54:[2,23],57:[2,23],73:[2,23],78:[2,23],86:[2,23],91:[2,23],93:[2,23],98:[2,23],99:[2,23],102:[2,23],104:[2,23],105:[2,23],106:[2,23],110:[2,23],118:[2,23],121:[2,23],123:[2,23],126:[2,23],129:[2,23],130:[2,23],133:[2,23],134:[2,23],135:[2,23],136:[2,23],137:[2,23],138:[2,23],139:[2,23]},{6:[1,73],26:[1,256]},{1:[2,205],6:[2,205],25:[2,205],26:[2,205],49:[2,205],54:[2,205],57:[2,205],73:[2,205],78:[2,205],86:[2,205],91:[2,205],93:[2,205],102:[2,205],103:84,104:[2,205],105:[2,205],106:[2,205],109:85,110:[2,205],111:68,118:[2,205],126:[2,205],129:[1,76],130:[1,75],133:[1,74],134:[1,77],135:[1,78],136:[1,79],137:[1,80],138:[1,81],139:[1,82]},{7:257,8:117,9:18,10:19,11:[1,20],12:6,13:7,14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,27:61,28:[1,72],29:48,30:[1,70],31:[1,71],32:22,33:[1,49],34:[1,50],35:[1,51],36:[1,52],37:[1,53],38:[1,54],39:21,44:62,45:[1,44],46:[1,45],47:[1,27],50:28,51:[1,59],52:[1,60],58:46,59:47,61:35,63:23,64:24,65:25,76:[1,69],79:[1,42],83:[1,26],88:[1,57],89:[1,58],90:[1,56],96:[1,37],100:[1,43],101:[1,55],103:38,104:[1,64],106:[1,65],107:39,108:[1,66],109:40,110:[1,67],111:68,119:[1,41],124:36,125:[1,63],127:[1,29],128:[1,30],129:[1,31],130:[1,32],131:[1,33],132:[1,34]},{7:258,8:117,9:18,10:19,11:[1,20],12:6,13:7,14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,27:61,28:[1,72],29:48,30:[1,70],31:[1,71],32:22,33:[1,49],34:[1,50],35:[1,51],36:[1,52],37:[1,53],38:[1,54],39:21,44:62,45:[1,44],46:[1,45],47:[1,27],50:28,51:[1,59],52:[1,60],58:46,59:47,61:35,63:23,64:24,65:25,76:[1,69],79:[1,42],83:[1,26],88:[1,57],89:[1,58],90:[1,56],96:[1,37],100:[1,43],101:[1,55],103:38,104:[1,64],106:[1,65],107:39,108:[1,66],109:40,110:[1,67],111:68,119:[1,41],124:36,125:[1,63],127:[1,29],128:[1,30],129:[1,31],130:[1,32],131:[1,33],132:[1,34]},{1:[2,208],6:[2,208],25:[2,208],26:[2,208],49:[2,208],54:[2,208],57:[2,208],73:[2,208],78:[2,208],86:[2,208],91:[2,208],93:[2,208],102:[2,208],103:84,104:[2,208],105:[2,208],106:[2,208],109:85,110:[2,208],111:68,118:[2,208],126:[2,208],129:[1,76],130:[1,75],133:[1,74],134:[1,77],135:[1,78],136:[1,79],137:[1,80],138:[1,81],139:[1,82]},{1:[2,185],6:[2,185],25:[2,185],26:[2,185],49:[2,185],54:[2,185],57:[2,185],73:[2,185],78:[2,185],86:[2,185],91:[2,185],93:[2,185],102:[2,185],104:[2,185],105:[2,185],106:[2,185],110:[2,185],118:[2,185],126:[2,185],129:[2,185],130:[2,185],133:[2,185],134:[2,185],135:[2,185],136:[2,185],137:[2,185],138:[2,185],139:[2,185]},{7:259,8:117,9:18,10:19,11:[1,20],12:6,13:7,14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,27:61,28:[1,72],29:48,30:[1,70],31:[1,71],32:22,33:[1,49],34:[1,50],35:[1,51],36:[1,52],37:[1,53],38:[1,54],39:21,44:62,45:[1,44],46:[1,45],47:[1,27],50:28,51:[1,59],52:[1,60],58:46,59:47,61:35,63:23,64:24,65:25,76:[1,69],79:[1,42],83:[1,26],88:[1,57],89:[1,58],90:[1,56],96:[1,37],100:[1,43],101:[1,55],103:38,104:[1,64],106:[1,65],107:39,108:[1,66],109:40,110:[1,67],111:68,119:[1,41],124:36,125:[1,63],127:[1,29],128:[1,30],129:[1,31],130:[1,32],131:[1,33],132:[1,34]},{1:[2,135],6:[2,135],25:[2,135],26:[2,135],49:[2,135],54:[2,135],57:[2,135],73:[2,135],78:[2,135],86:[2,135],91:[2,135],93:[2,135],98:[1,260],102:[2,135],104:[2,135],105:[2,135],106:[2,135],110:[2,135],118:[2,135],126:[2,135],129:[2,135],130:[2,135],133:[2,135],134:[2,135],135:[2,135],136:[2,135],137:[2,135],138:[2,135],139:[2,135]},{24:261,25:[1,115]},{24:264,25:[1,115],27:262,28:[1,72],59:263,76:[1,69]},{120:265,122:222,123:[1,223]},{26:[1,266],121:[1,267],122:268,123:[1,223]},{26:[2,178],121:[2,178],123:[2,178]},{7:270,8:117,9:18,10:19,11:[1,20],12:6,13:7,14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,27:61,28:[1,72],29:48,30:[1,70],31:[1,71],32:22,33:[1,49],34:[1,50],35:[1,51],36:[1,52],37:[1,53],38:[1,54],39:21,44:62,45:[1,44],46:[1,45],47:[1,27],50:28,51:[1,59],52:[1,60],58:46,59:47,61:35,63:23,64:24,65:25,76:[1,69],79:[1,42],83:[1,26],88:[1,57],89:[1,58],90:[1,56],95:269,96:[1,37],100:[1,43],101:[1,55],103:38,104:[1,64],106:[1,65],107:39,108:[1,66],109:40,110:[1,67],111:68,119:[1,41],124:36,125:[1,63],127:[1,29],128:[1,30],129:[1,31],130:[1,32],131:[1,33],132:[1,34]},{1:[2,98],6:[2,98],24:271,25:[1,115],26:[2,98],49:[2,98],54:[2,98],57:[2,98],73:[2,98],78:[2,98],86:[2,98],91:[2,98],93:[2,98],102:[2,98],103:84,104:[1,64],105:[2,98],106:[1,65],109:85,110:[1,67],111:68,118:[2,98],126:[2,98],129:[1,76],130:[1,75],133:[1,74],134:[1,77],135:[1,78],136:[1,79],137:[1,80],138:[1,81],139:[1,82]},{1:[2,101],6:[2,101],25:[2,101],26:[2,101],49:[2,101],54:[2,101],57:[2,101],73:[2,101],78:[2,101],86:[2,101],91:[2,101],93:[2,101],102:[2,101],104:[2,101],105:[2,101],106:[2,101],110:[2,101],118:[2,101],126:[2,101],129:[2,101],130:[2,101],133:[2,101],134:[2,101],135:[2,101],136:[2,101],137:[2,101],138:[2,101],139:[2,101]},{7:272,8:117,9:18,10:19,11:[1,20],12:6,13:7,14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,27:61,28:[1,72],29:48,30:[1,70],31:[1,71],32:22,33:[1,49],34:[1,50],35:[1,51],36:[1,52],37:[1,53],38:[1,54],39:21,44:62,45:[1,44],46:[1,45],47:[1,27],50:28,51:[1,59],52:[1,60],58:46,59:47,61:35,63:23,64:24,65:25,76:[1,69],79:[1,42],83:[1,26],88:[1,57],89:[1,58],90:[1,56],96:[1,37],100:[1,43],101:[1,55],103:38,104:[1,64],106:[1,65],107:39,108:[1,66],109:40,110:[1,67],111:68,119:[1,41],124:36,125:[1,63],127:[1,29],128:[1,30],129:[1,31],130:[1,32],131:[1,33],132:[1,34]},{1:[2,142],6:[2,142],25:[2,142],26:[2,142],49:[2,142],54:[2,142],57:[2,142],66:[2,142],67:[2,142],68:[2,142],69:[2,142],71:[2,142],73:[2,142],74:[2,142],78:[2,142],84:[2,142],85:[2,142],86:[2,142],91:[2,142],93:[2,142],102:[2,142],104:[2,142],105:[2,142],106:[2,142],110:[2,142],118:[2,142],126:[2,142],129:[2,142],130:[2,142],133:[2,142],134:[2,142],135:[2,142],136:[2,142],137:[2,142],138:[2,142],139:[2,142]},{6:[1,73],26:[1,273]},{7:274,8:117,9:18,10:19,11:[1,20],12:6,13:7,14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,27:61,28:[1,72],29:48,30:[1,70],31:[1,71],32:22,33:[1,49],34:[1,50],35:[1,51],36:[1,52],37:[1,53],38:[1,54],39:21,44:62,45:[1,44],46:[1,45],47:[1,27],50:28,51:[1,59],52:[1,60],58:46,59:47,61:35,63:23,64:24,65:25,76:[1,69],79:[1,42],83:[1,26],88:[1,57],89:[1,58],90:[1,56],96:[1,37],100:[1,43],101:[1,55],103:38,104:[1,64],106:[1,65],107:39,108:[1,66],109:40,110:[1,67],111:68,119:[1,41],124:36,125:[1,63],127:[1,29],128:[1,30],129:[1,31],130:[1,32],131:[1,33],132:[1,34]},{6:[2,67],11:[2,118],25:[2,67],28:[2,118],30:[2,118],31:[2,118],33:[2,118],34:[2,118],35:[2,118],36:[2,118],37:[2,118],38:[2,118],45:[2,118],46:[2,118],47:[2,118],51:[2,118],52:[2,118],54:[2,67],76:[2,118],79:[2,118],83:[2,118],88:[2,118],89:[2,118],90:[2,118],91:[2,67],96:[2,118],100:[2,118],101:[2,118],104:[2,118],106:[2,118],108:[2,118],110:[2,118],119:[2,118],125:[2,118],127:[2,118],128:[2,118],129:[2,118],130:[2,118],131:[2,118],132:[2,118]},{6:[1,276],25:[1,277],91:[1,275]},{6:[2,53],7:203,8:117,9:18,10:19,11:[1,20],12:6,13:7,14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,25:[2,53],26:[2,53],27:61,28:[1,72],29:48,30:[1,70],31:[1,71],32:22,33:[1,49],34:[1,50],35:[1,51],36:[1,52],37:[1,53],38:[1,54],39:21,44:62,45:[1,44],46:[1,45],47:[1,27],50:28,51:[1,59],52:[1,60],57:[1,149],58:46,59:47,60:148,61:35,63:23,64:24,65:25,76:[1,69],79:[1,42],83:[1,26],86:[2,53],88:[1,57],89:[1,58],90:[1,56],91:[2,53],94:278,96:[1,37],100:[1,43],101:[1,55],103:38,104:[1,64],106:[1,65],107:39,108:[1,66],109:40,110:[1,67],111:68,119:[1,41],124:36,125:[1,63],127:[1,29],128:[1,30],129:[1,31],130:[1,32],131:[1,33],132:[1,34]},{6:[2,52],25:[2,52],26:[2,52],53:279,54:[1,232]},{1:[2,182],6:[2,182],25:[2,182],26:[2,182],49:[2,182],54:[2,182],57:[2,182],73:[2,182],78:[2,182],86:[2,182],91:[2,182],93:[2,182],102:[2,182],104:[2,182],105:[2,182],106:[2,182],110:[2,182],118:[2,182],121:[2,182],126:[2,182],129:[2,182],130:[2,182],133:[2,182],134:[2,182],135:[2,182],136:[2,182],137:[2,182],138:[2,182],139:[2,182]},{7:280,8:117,9:18,10:19,11:[1,20],12:6,13:7,14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,27:61,28:[1,72],29:48,30:[1,70],31:[1,71],32:22,33:[1,49],34:[1,50],35:[1,51],36:[1,52],37:[1,53],38:[1,54],39:21,44:62,45:[1,44],46:[1,45],47:[1,27],50:28,51:[1,59],52:[1,60],58:46,59:47,61:35,63:23,64:24,65:25,76:[1,69],79:[1,42],83:[1,26],88:[1,57],89:[1,58],90:[1,56],96:[1,37],100:[1,43],101:[1,55],103:38,104:[1,64],106:[1,65],107:39,108:[1,66],109:40,110:[1,67],111:68,119:[1,41],124:36,125:[1,63],127:[1,29],128:[1,30],129:[1,31],130:[1,32],131:[1,33],132:[1,34]},{7:281,8:117,9:18,10:19,11:[1,20],12:6,13:7,14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,27:61,28:[1,72],29:48,30:[1,70],31:[1,71],32:22,33:[1,49],34:[1,50],35:[1,51],36:[1,52],37:[1,53],38:[1,54],39:21,44:62,45:[1,44],46:[1,45],47:[1,27],50:28,51:[1,59],52:[1,60],58:46,59:47,61:35,63:23,64:24,65:25,76:[1,69],79:[1,42],83:[1,26],88:[1,57],89:[1,58],90:[1,56],96:[1,37],100:[1,43],101:[1,55],103:38,104:[1,64],106:[1,65],107:39,108:[1,66],109:40,110:[1,67],111:68,119:[1,41],124:36,125:[1,63],127:[1,29],128:[1,30],129:[1,31],130:[1,32],131:[1,33],132:[1,34]},{116:[2,160],117:[2,160]},{27:160,28:[1,72],44:161,58:162,59:163,76:[1,69],89:[1,112],90:[1,113],115:282},{1:[2,167],6:[2,167],25:[2,167],26:[2,167],49:[2,167],54:[2,167],57:[2,167],73:[2,167],78:[2,167],86:[2,167],91:[2,167],93:[2,167],102:[2,167],103:84,104:[2,167],105:[1,283],106:[2,167],109:85,110:[2,167],111:68,118:[1,284],126:[2,167],129:[1,76],130:[1,75],133:[1,74],134:[1,77],135:[1,78],136:[1,79],137:[1,80],138:[1,81],139:[1,82]},{1:[2,168],6:[2,168],25:[2,168],26:[2,168],49:[2,168],54:[2,168],57:[2,168],73:[2,168],78:[2,168],86:[2,168],91:[2,168],93:[2,168],102:[2,168],103:84,104:[2,168],105:[1,285],106:[2,168],109:85,110:[2,168],111:68,118:[2,168],126:[2,168],129:[1,76],130:[1,75],133:[1,74],134:[1,77],135:[1,78],136:[1,79],137:[1,80],138:[1,81],139:[1,82]},{6:[1,287],25:[1,288],78:[1,286]},{6:[2,53],10:170,25:[2,53],26:[2,53],27:171,28:[1,72],29:172,30:[1,70],31:[1,71],41:289,42:169,44:173,46:[1,45],78:[2,53],89:[1,112]},{7:290,8:117,9:18,10:19,11:[1,20],12:6,13:7,14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,25:[1,291],27:61,28:[1,72],29:48,30:[1,70],31:[1,71],32:22,33:[1,49],34:[1,50],35:[1,51],36:[1,52],37:[1,53],38:[1,54],39:21,44:62,45:[1,44],46:[1,45],47:[1,27],50:28,51:[1,59],52:[1,60],58:46,59:47,61:35,63:23,64:24,65:25,76:[1,69],79:[1,42],83:[1,26],88:[1,57],89:[1,58],90:[1,56],96:[1,37],100:[1,43],101:[1,55],103:38,104:[1,64],106:[1,65],107:39,108:[1,66],109:40,110:[1,67],111:68,119:[1,41],124:36,125:[1,63],127:[1,29],128:[1,30],129:[1,31],130:[1,32],131:[1,33],132:[1,34]},{1:[2,86],6:[2,86],25:[2,86],26:[2,86],40:[2,86],49:[2,86],54:[2,86],57:[2,86],66:[2,86],67:[2,86],68:[2,86],69:[2,86],71:[2,86],73:[2,86],74:[2,86],78:[2,86],80:[2,86],84:[2,86],85:[2,86],86:[2,86],91:[2,86],93:[2,86],102:[2,86],104:[2,86],105:[2,86],106:[2,86],110:[2,86],118:[2,86],126:[2,86],129:[2,86],130:[2,86],131:[2,86],132:[2,86],133:[2,86],134:[2,86],135:[2,86],136:[2,86],137:[2,86],138:[2,86],139:[2,86],140:[2,86]},{7:292,8:117,9:18,10:19,11:[1,20],12:6,13:7,14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,27:61,28:[1,72],29:48,30:[1,70],31:[1,71],32:22,33:[1,49],34:[1,50],35:[1,51],36:[1,52],37:[1,53],38:[1,54],39:21,44:62,45:[1,44],46:[1,45],47:[1,27],50:28,51:[1,59],52:[1,60],58:46,59:47,61:35,63:23,64:24,65:25,73:[2,121],76:[1,69],79:[1,42],83:[1,26],88:[1,57],89:[1,58],90:[1,56],96:[1,37],100:[1,43],101:[1,55],103:38,104:[1,64],106:[1,65],107:39,108:[1,66],109:40,110:[1,67],111:68,119:[1,41],124:36,125:[1,63],127:[1,29],128:[1,30],129:[1,31],130:[1,32],131:[1,33],132:[1,34]},{73:[2,122],103:84,104:[1,64],106:[1,65],109:85,110:[1,67],111:68,126:[1,83],129:[1,76],130:[1,75],133:[1,74],134:[1,77],135:[1,78],136:[1,79],137:[1,80],138:[1,81],139:[1,82]},{1:[2,36],6:[2,36],25:[2,36],26:[2,36],49:[2,36],54:[2,36],57:[2,36],73:[2,36],78:[2,36],86:[2,36],91:[2,36],93:[2,36],102:[2,36],103:84,104:[2,36],105:[2,36],106:[2,36],109:85,110:[2,36],111:68,118:[2,36],126:[2,36],129:[1,76],130:[1,75],133:[1,74],134:[1,77],135:[1,78],136:[1,79],137:[1,80],138:[1,81],139:[1,82]},{26:[1,293],103:84,104:[1,64],106:[1,65],109:85,110:[1,67],111:68,126:[1,83],129:[1,76],130:[1,75],133:[1,74],134:[1,77],135:[1,78],136:[1,79],137:[1,80],138:[1,81],139:[1,82]},{6:[1,276],25:[1,277],86:[1,294]},{6:[2,67],25:[2,67],26:[2,67],54:[2,67],86:[2,67],91:[2,67]},{24:295,25:[1,115]},{6:[2,56],25:[2,56],26:[2,56],49:[2,56],54:[2,56]},{27:108,28:[1,72],44:109,55:296,56:106,57:[1,107],58:110,59:111,76:[1,69],89:[1,112],90:[1,113]},{6:[2,54],25:[2,54],26:[2,54],27:108,28:[1,72],44:109,48:297,54:[2,54],55:105,56:106,57:[1,107],58:110,59:111,76:[1,69],89:[1,112],90:[1,113]},{6:[2,61],25:[2,61],26:[2,61],49:[2,61],54:[2,61],103:84,104:[1,64],106:[1,65],109:85,110:[1,67],111:68,126:[1,83],129:[1,76],130:[1,75],133:[1,74],134:[1,77],135:[1,78],136:[1,79],137:[1,80],138:[1,81],139:[1,82]},{1:[2,24],6:[2,24],25:[2,24],26:[2,24],49:[2,24],54:[2,24],57:[2,24],73:[2,24],78:[2,24],86:[2,24],91:[2,24],93:[2,24],98:[2,24],99:[2,24],102:[2,24],104:[2,24],105:[2,24],106:[2,24],110:[2,24],118:[2,24],121:[2,24],123:[2,24],126:[2,24],129:[2,24],130:[2,24],133:[2,24],134:[2,24],135:[2,24],136:[2,24],137:[2,24],138:[2,24],139:[2,24]},{26:[1,298],103:84,104:[1,64],106:[1,65],109:85,110:[1,67],111:68,126:[1,83],129:[1,76],130:[1,75],133:[1,74],134:[1,77],135:[1,78],136:[1,79],137:[1,80],138:[1,81],139:[1,82]},{1:[2,207],6:[2,207],25:[2,207],26:[2,207],49:[2,207],54:[2,207],57:[2,207],73:[2,207],78:[2,207],86:[2,207],91:[2,207],93:[2,207],102:[2,207],103:84,104:[2,207],105:[2,207],106:[2,207],109:85,110:[2,207],111:68,118:[2,207],126:[2,207],129:[1,76],130:[1,75],133:[1,74],134:[1,77],135:[1,78],136:[1,79],137:[1,80],138:[1,81],139:[1,82]},{24:299,25:[1,115],103:84,104:[1,64],106:[1,65],109:85,110:[1,67],111:68,126:[1,83],129:[1,76],130:[1,75],133:[1,74],134:[1,77],135:[1,78],136:[1,79],137:[1,80],138:[1,81],139:[1,82]},{24:300,25:[1,115]},{1:[2,136],6:[2,136],25:[2,136],26:[2,136],49:[2,136],54:[2,136],57:[2,136],73:[2,136],78:[2,136],86:[2,136],91:[2,136],93:[2,136],102:[2,136],104:[2,136],105:[2,136],106:[2,136],110:[2,136],118:[2,136],126:[2,136],129:[2,136],130:[2,136],133:[2,136],134:[2,136],135:[2,136],136:[2,136],137:[2,136],138:[2,136],139:[2,136]},{24:301,25:[1,115]},{24:302,25:[1,115]},{1:[2,140],6:[2,140],25:[2,140],26:[2,140],49:[2,140],54:[2,140],57:[2,140],73:[2,140],78:[2,140],86:[2,140],91:[2,140],93:[2,140],98:[2,140],102:[2,140],104:[2,140],105:[2,140],106:[2,140],110:[2,140],118:[2,140],126:[2,140],129:[2,140],130:[2,140],133:[2,140],134:[2,140],135:[2,140],136:[2,140],137:[2,140],138:[2,140],139:[2,140]},{26:[1,303],121:[1,304],122:268,123:[1,223]},{1:[2,176],6:[2,176],25:[2,176],26:[2,176],49:[2,176],54:[2,176],57:[2,176],73:[2,176],78:[2,176],86:[2,176],91:[2,176],93:[2,176],102:[2,176],104:[2,176],105:[2,176],106:[2,176],110:[2,176],118:[2,176],126:[2,176],129:[2,176],130:[2,176],133:[2,176],134:[2,176],135:[2,176],136:[2,176],137:[2,176],138:[2,176],139:[2,176]},{24:305,25:[1,115]},{26:[2,179],121:[2,179],123:[2,179]},{24:306,25:[1,115],54:[1,307]},{25:[2,132],54:[2,132],103:84,104:[1,64],106:[1,65],109:85,110:[1,67],111:68,126:[1,83],129:[1,76],130:[1,75],133:[1,74],134:[1,77],135:[1,78],136:[1,79],137:[1,80],138:[1,81],139:[1,82]},{1:[2,99],6:[2,99],25:[2,99],26:[2,99],49:[2,99],54:[2,99],57:[2,99],73:[2,99],78:[2,99],86:[2,99],91:[2,99],93:[2,99],102:[2,99],104:[2,99],105:[2,99],106:[2,99],110:[2,99],118:[2,99],126:[2,99],129:[2,99],130:[2,99],133:[2,99],134:[2,99],135:[2,99],136:[2,99],137:[2,99],138:[2,99],139:[2,99]},{1:[2,102],6:[2,102],24:308,25:[1,115],26:[2,102],49:[2,102],54:[2,102],57:[2,102],73:[2,102],78:[2,102],86:[2,102],91:[2,102],93:[2,102],102:[2,102],103:84,104:[1,64],105:[2,102],106:[1,65],109:85,110:[1,67],111:68,118:[2,102],126:[2,102],129:[1,76],130:[1,75],133:[1,74],134:[1,77],135:[1,78],136:[1,79],137:[1,80],138:[1,81],139:[1,82]},{102:[1,309]},{91:[1,310],103:84,104:[1,64],106:[1,65],109:85,110:[1,67],111:68,126:[1,83],129:[1,76],130:[1,75],133:[1,74],134:[1,77],135:[1,78],136:[1,79],137:[1,80],138:[1,81],139:[1,82]},{1:[2,116],6:[2,116],25:[2,116],26:[2,116],40:[2,116],49:[2,116],54:[2,116],57:[2,116],66:[2,116],67:[2,116],68:[2,116],69:[2,116],71:[2,116],73:[2,116],74:[2,116],78:[2,116],84:[2,116],85:[2,116],86:[2,116],91:[2,116],93:[2,116],102:[2,116],104:[2,116],105:[2,116],106:[2,116],110:[2,116],116:[2,116],117:[2,116],118:[2,116],126:[2,116],129:[2,116],130:[2,116],133:[2,116],134:[2,116],135:[2,116],136:[2,116],137:[2,116],138:[2,116],139:[2,116]},{7:203,8:117,9:18,10:19,11:[1,20],12:6,13:7,14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,27:61,28:[1,72],29:48,30:[1,70],31:[1,71],32:22,33:[1,49],34:[1,50],35:[1,51],36:[1,52],37:[1,53],38:[1,54],39:21,44:62,45:[1,44],46:[1,45],47:[1,27],50:28,51:[1,59],52:[1,60],57:[1,149],58:46,59:47,60:148,61:35,63:23,64:24,65:25,76:[1,69],79:[1,42],83:[1,26],88:[1,57],89:[1,58],90:[1,56],94:311,96:[1,37],100:[1,43],101:[1,55],103:38,104:[1,64],106:[1,65],107:39,108:[1,66],109:40,110:[1,67],111:68,119:[1,41],124:36,125:[1,63],127:[1,29],128:[1,30],129:[1,31],130:[1,32],131:[1,33],132:[1,34]},{7:203,8:117,9:18,10:19,11:[1,20],12:6,13:7,14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,25:[1,147],27:61,28:[1,72],29:48,30:[1,70],31:[1,71],32:22,33:[1,49],34:[1,50],35:[1,51],36:[1,52],37:[1,53],38:[1,54],39:21,44:62,45:[1,44],46:[1,45],47:[1,27],50:28,51:[1,59],52:[1,60],57:[1,149],58:46,59:47,60:148,61:35,63:23,64:24,65:25,76:[1,69],79:[1,42],83:[1,26],87:312,88:[1,57],89:[1,58],90:[1,56],94:146,96:[1,37],100:[1,43],101:[1,55],103:38,104:[1,64],106:[1,65],107:39,108:[1,66],109:40,110:[1,67],111:68,119:[1,41],124:36,125:[1,63],127:[1,29],128:[1,30],129:[1,31],130:[1,32],131:[1,33],132:[1,34]},{6:[2,125],25:[2,125],26:[2,125],54:[2,125],86:[2,125],91:[2,125]},{6:[1,276],25:[1,277],26:[1,313]},{1:[2,145],6:[2,145],25:[2,145],26:[2,145],49:[2,145],54:[2,145],57:[2,145],73:[2,145],78:[2,145],86:[2,145],91:[2,145],93:[2,145],102:[2,145],103:84,104:[1,64],105:[2,145],106:[1,65],109:85,110:[1,67],111:68,118:[2,145],126:[2,145],129:[1,76],130:[1,75],133:[1,74],134:[1,77],135:[1,78],136:[1,79],137:[1,80],138:[1,81],139:[1,82]},{1:[2,147],6:[2,147],25:[2,147],26:[2,147],49:[2,147],54:[2,147],57:[2,147],73:[2,147],78:[2,147],86:[2,147],91:[2,147],93:[2,147],102:[2,147],103:84,104:[1,64],105:[2,147],106:[1,65],109:85,110:[1,67],111:68,118:[2,147],126:[2,147],129:[1,76],130:[1,75],133:[1,74],134:[1,77],135:[1,78],136:[1,79],137:[1,80],138:[1,81],139:[1,82]},{116:[2,166],117:[2,166]},{7:314,8:117,9:18,10:19,11:[1,20],12:6,13:7,14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,27:61,28:[1,72],29:48,30:[1,70],31:[1,71],32:22,33:[1,49],34:[1,50],35:[1,51],36:[1,52],37:[1,53],38:[1,54],39:21,44:62,45:[1,44],46:[1,45],47:[1,27],50:28,51:[1,59],52:[1,60],58:46,59:47,61:35,63:23,64:24,65:25,76:[1,69],79:[1,42],83:[1,26],88:[1,57],89:[1,58],90:[1,56],96:[1,37],100:[1,43],101:[1,55],103:38,104:[1,64],106:[1,65],107:39,108:[1,66],109:40,110:[1,67],111:68,119:[1,41],124:36,125:[1,63],127:[1,29],128:[1,30],129:[1,31],130:[1,32],131:[1,33],132:[1,34]},{7:315,8:117,9:18,10:19,11:[1,20],12:6,13:7,14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,27:61,28:[1,72],29:48,30:[1,70],31:[1,71],32:22,33:[1,49],34:[1,50],35:[1,51],36:[1,52],37:[1,53],38:[1,54],39:21,44:62,45:[1,44],46:[1,45],47:[1,27],50:28,51:[1,59],52:[1,60],58:46,59:47,61:35,63:23,64:24,65:25,76:[1,69],79:[1,42],83:[1,26],88:[1,57],89:[1,58],90:[1,56],96:[1,37],100:[1,43],101:[1,55],103:38,104:[1,64],106:[1,65],107:39,108:[1,66],109:40,110:[1,67],111:68,119:[1,41],124:36,125:[1,63],127:[1,29],128:[1,30],129:[1,31],130:[1,32],131:[1,33],132:[1,34]},{7:316,8:117,9:18,10:19,11:[1,20],12:6,13:7,14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,27:61,28:[1,72],29:48,30:[1,70],31:[1,71],32:22,33:[1,49],34:[1,50],35:[1,51],36:[1,52],37:[1,53],38:[1,54],39:21,44:62,45:[1,44],46:[1,45],47:[1,27],50:28,51:[1,59],52:[1,60],58:46,59:47,61:35,63:23,64:24,65:25,76:[1,69],79:[1,42],83:[1,26],88:[1,57],89:[1,58],90:[1,56],96:[1,37],100:[1,43],101:[1,55],103:38,104:[1,64],106:[1,65],107:39,108:[1,66],109:40,110:[1,67],111:68,119:[1,41],124:36,125:[1,63],127:[1,29],128:[1,30],129:[1,31],130:[1,32],131:[1,33],132:[1,34]},{1:[2,90],6:[2,90],25:[2,90],26:[2,90],40:[2,90],49:[2,90],54:[2,90],57:[2,90],66:[2,90],67:[2,90],68:[2,90],69:[2,90],71:[2,90],73:[2,90],74:[2,90],78:[2,90],84:[2,90],85:[2,90],86:[2,90],91:[2,90],93:[2,90],102:[2,90],104:[2,90],105:[2,90],106:[2,90],110:[2,90],116:[2,90],117:[2,90],118:[2,90],126:[2,90],129:[2,90],130:[2,90],133:[2,90],134:[2,90],135:[2,90],136:[2,90],137:[2,90],138:[2,90],139:[2,90]},{10:170,27:171,28:[1,72],29:172,30:[1,70],31:[1,71],41:317,42:169,44:173,46:[1,45],89:[1,112]},{6:[2,91],10:170,25:[2,91],26:[2,91],27:171,28:[1,72],29:172,30:[1,70],31:[1,71],41:168,42:169,44:173,46:[1,45],54:[2,91],77:318,89:[1,112]},{6:[2,93],25:[2,93],26:[2,93],54:[2,93],78:[2,93]},{6:[2,39],25:[2,39],26:[2,39],54:[2,39],78:[2,39],103:84,104:[1,64],106:[1,65],109:85,110:[1,67],111:68,126:[1,83],129:[1,76],130:[1,75],133:[1,74],134:[1,77],135:[1,78],136:[1,79],137:[1,80],138:[1,81],139:[1,82]},{7:319,8:117,9:18,10:19,11:[1,20],12:6,13:7,14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,27:61,28:[1,72],29:48,30:[1,70],31:[1,71],32:22,33:[1,49],34:[1,50],35:[1,51],36:[1,52],37:[1,53],38:[1,54],39:21,44:62,45:[1,44],46:[1,45],47:[1,27],50:28,51:[1,59],52:[1,60],58:46,59:47,61:35,63:23,64:24,65:25,76:[1,69],79:[1,42],83:[1,26],88:[1,57],89:[1,58],90:[1,56],96:[1,37],100:[1,43],101:[1,55],103:38,104:[1,64],106:[1,65],107:39,108:[1,66],109:40,110:[1,67],111:68,119:[1,41],124:36,125:[1,63],127:[1,29],128:[1,30],129:[1,31],130:[1,32],131:[1,33],132:[1,34]},{73:[2,120],103:84,104:[1,64],106:[1,65],109:85,110:[1,67],111:68,126:[1,83],129:[1,76],130:[1,75],133:[1,74],134:[1,77],135:[1,78],136:[1,79],137:[1,80],138:[1,81],139:[1,82]},{1:[2,37],6:[2,37],25:[2,37],26:[2,37],49:[2,37],54:[2,37],57:[2,37],73:[2,37],78:[2,37],86:[2,37],91:[2,37],93:[2,37],102:[2,37],104:[2,37],105:[2,37],106:[2,37],110:[2,37],118:[2,37],126:[2,37],129:[2,37],130:[2,37],133:[2,37],134:[2,37],135:[2,37],136:[2,37],137:[2,37],138:[2,37],139:[2,37]},{1:[2,111],6:[2,111],25:[2,111],26:[2,111],49:[2,111],54:[2,111],57:[2,111],66:[2,111],67:[2,111],68:[2,111],69:[2,111],71:[2,111],73:[2,111],74:[2,111],78:[2,111],84:[2,111],85:[2,111],86:[2,111],91:[2,111],93:[2,111],102:[2,111],104:[2,111],105:[2,111],106:[2,111],110:[2,111],118:[2,111],126:[2,111],129:[2,111],130:[2,111],133:[2,111],134:[2,111],135:[2,111],136:[2,111],137:[2,111],138:[2,111],139:[2,111]},{1:[2,48],6:[2,48],25:[2,48],26:[2,48],49:[2,48],54:[2,48],57:[2,48],73:[2,48],78:[2,48],86:[2,48],91:[2,48],93:[2,48],102:[2,48],104:[2,48],105:[2,48],106:[2,48],110:[2,48],118:[2,48],126:[2,48],129:[2,48],130:[2,48],133:[2,48],134:[2,48],135:[2,48],136:[2,48],137:[2,48],138:[2,48],139:[2,48]},{6:[2,57],25:[2,57],26:[2,57],49:[2,57],54:[2,57]},{6:[2,52],25:[2,52],26:[2,52],53:320,54:[1,205]},{1:[2,206],6:[2,206],25:[2,206],26:[2,206],49:[2,206],54:[2,206],57:[2,206],73:[2,206],78:[2,206],86:[2,206],91:[2,206],93:[2,206],102:[2,206],104:[2,206],105:[2,206],106:[2,206],110:[2,206],118:[2,206],126:[2,206],129:[2,206],130:[2,206],133:[2,206],134:[2,206],135:[2,206],136:[2,206],137:[2,206],138:[2,206],139:[2,206]},{1:[2,183],6:[2,183],25:[2,183],26:[2,183],49:[2,183],54:[2,183],57:[2,183],73:[2,183],78:[2,183],86:[2,183],91:[2,183],93:[2,183],102:[2,183],104:[2,183],105:[2,183],106:[2,183],110:[2,183],118:[2,183],121:[2,183],126:[2,183],129:[2,183],130:[2,183],133:[2,183],134:[2,183],135:[2,183],136:[2,183],137:[2,183],138:[2,183],139:[2,183]},{1:[2,137],6:[2,137],25:[2,137],26:[2,137],49:[2,137],54:[2,137],57:[2,137],73:[2,137],78:[2,137],86:[2,137],91:[2,137],93:[2,137],102:[2,137],104:[2,137],105:[2,137],106:[2,137],110:[2,137],118:[2,137],126:[2,137],129:[2,137],130:[2,137],133:[2,137],134:[2,137],135:[2,137],136:[2,137],137:[2,137],138:[2,137],139:[2,137]},{1:[2,138],6:[2,138],25:[2,138],26:[2,138],49:[2,138],54:[2,138],57:[2,138],73:[2,138],78:[2,138],86:[2,138],91:[2,138],93:[2,138],98:[2,138],102:[2,138],104:[2,138],105:[2,138],106:[2,138],110:[2,138],118:[2,138],126:[2,138],129:[2,138],130:[2,138],133:[2,138],134:[2,138],135:[2,138],136:[2,138],137:[2,138],138:[2,138],139:[2,138]},{1:[2,139],6:[2,139],25:[2,139],26:[2,139],49:[2,139],54:[2,139],57:[2,139],73:[2,139],78:[2,139],86:[2,139],91:[2,139],93:[2,139],98:[2,139],102:[2,139],104:[2,139],105:[2,139],106:[2,139],110:[2,139],118:[2,139],126:[2,139],129:[2,139],130:[2,139],133:[2,139],134:[2,139],135:[2,139],136:[2,139],137:[2,139],138:[2,139],139:[2,139]},{1:[2,174],6:[2,174],25:[2,174],26:[2,174],49:[2,174],54:[2,174],57:[2,174],73:[2,174],78:[2,174],86:[2,174],91:[2,174],93:[2,174],102:[2,174],104:[2,174],105:[2,174],106:[2,174],110:[2,174],118:[2,174],126:[2,174],129:[2,174],130:[2,174],133:[2,174],134:[2,174],135:[2,174],136:[2,174],137:[2,174],138:[2,174],139:[2,174]},{24:321,25:[1,115]},{26:[1,322]},{6:[1,323],26:[2,180],121:[2,180],123:[2,180]},{7:324,8:117,9:18,10:19,11:[1,20],12:6,13:7,14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,27:61,28:[1,72],29:48,30:[1,70],31:[1,71],32:22,33:[1,49],34:[1,50],35:[1,51],36:[1,52],37:[1,53],38:[1,54],39:21,44:62,45:[1,44],46:[1,45],47:[1,27],50:28,51:[1,59],52:[1,60],58:46,59:47,61:35,63:23,64:24,65:25,76:[1,69],79:[1,42],83:[1,26],88:[1,57],89:[1,58],90:[1,56],96:[1,37],100:[1,43],101:[1,55],103:38,104:[1,64],106:[1,65],107:39,108:[1,66],109:40,110:[1,67],111:68,119:[1,41],124:36,125:[1,63],127:[1,29],128:[1,30],129:[1,31],130:[1,32],131:[1,33],132:[1,34]},{1:[2,103],6:[2,103],25:[2,103],26:[2,103],49:[2,103],54:[2,103],57:[2,103],73:[2,103],78:[2,103],86:[2,103],91:[2,103],93:[2,103],102:[2,103],104:[2,103],105:[2,103],106:[2,103],110:[2,103],118:[2,103],126:[2,103],129:[2,103],130:[2,103],133:[2,103],134:[2,103],135:[2,103],136:[2,103],137:[2,103],138:[2,103],139:[2,103]},{1:[2,143],6:[2,143],25:[2,143],26:[2,143],49:[2,143],54:[2,143],57:[2,143],66:[2,143],67:[2,143],68:[2,143],69:[2,143],71:[2,143],73:[2,143],74:[2,143],78:[2,143],84:[2,143],85:[2,143],86:[2,143],91:[2,143],93:[2,143],102:[2,143],104:[2,143],105:[2,143],106:[2,143],110:[2,143],118:[2,143],126:[2,143],129:[2,143],130:[2,143],133:[2,143],134:[2,143],135:[2,143],136:[2,143],137:[2,143],138:[2,143],139:[2,143]},{1:[2,119],6:[2,119],25:[2,119],26:[2,119],49:[2,119],54:[2,119],57:[2,119],66:[2,119],67:[2,119],68:[2,119],69:[2,119],71:[2,119],73:[2,119],74:[2,119],78:[2,119],84:[2,119],85:[2,119],86:[2,119],91:[2,119],93:[2,119],102:[2,119],104:[2,119],105:[2,119],106:[2,119],110:[2,119],118:[2,119],126:[2,119],129:[2,119],130:[2,119],133:[2,119],134:[2,119],135:[2,119],136:[2,119],137:[2,119],138:[2,119],139:[2,119]},{6:[2,126],25:[2,126],26:[2,126],54:[2,126],86:[2,126],91:[2,126]},{6:[2,52],25:[2,52],26:[2,52],53:325,54:[1,232]},{6:[2,127],25:[2,127],26:[2,127],54:[2,127],86:[2,127],91:[2,127]},{1:[2,169],6:[2,169],25:[2,169],26:[2,169],49:[2,169],54:[2,169],57:[2,169],73:[2,169],78:[2,169],86:[2,169],91:[2,169],93:[2,169],102:[2,169],103:84,104:[2,169],105:[2,169],106:[2,169],109:85,110:[2,169],111:68,118:[1,326],126:[2,169],129:[1,76],130:[1,75],133:[1,74],134:[1,77],135:[1,78],136:[1,79],137:[1,80],138:[1,81],139:[1,82]},{1:[2,171],6:[2,171],25:[2,171],26:[2,171],49:[2,171],54:[2,171],57:[2,171],73:[2,171],78:[2,171],86:[2,171],91:[2,171],93:[2,171],102:[2,171],103:84,104:[2,171],105:[1,327],106:[2,171],109:85,110:[2,171],111:68,118:[2,171],126:[2,171],129:[1,76],130:[1,75],133:[1,74],134:[1,77],135:[1,78],136:[1,79],137:[1,80],138:[1,81],139:[1,82]},{1:[2,170],6:[2,170],25:[2,170],26:[2,170],49:[2,170],54:[2,170],57:[2,170],73:[2,170],78:[2,170],86:[2,170],91:[2,170],93:[2,170],102:[2,170],103:84,104:[2,170],105:[2,170],106:[2,170],109:85,110:[2,170],111:68,118:[2,170],126:[2,170],129:[1,76],130:[1,75],133:[1,74],134:[1,77],135:[1,78],136:[1,79],137:[1,80],138:[1,81],139:[1,82]},{6:[2,94],25:[2,94],26:[2,94],54:[2,94],78:[2,94]},{6:[2,52],25:[2,52],26:[2,52],53:328,54:[1,242]},{26:[1,329],103:84,104:[1,64],106:[1,65],109:85,110:[1,67],111:68,126:[1,83],129:[1,76],130:[1,75],133:[1,74],134:[1,77],135:[1,78],136:[1,79],137:[1,80],138:[1,81],139:[1,82]},{6:[1,253],25:[1,254],26:[1,330]},{26:[1,331]},{1:[2,177],6:[2,177],25:[2,177],26:[2,177],49:[2,177],54:[2,177],57:[2,177],73:[2,177],78:[2,177],86:[2,177],91:[2,177],93:[2,177],102:[2,177],104:[2,177],105:[2,177],106:[2,177],110:[2,177],118:[2,177],126:[2,177],129:[2,177],130:[2,177],133:[2,177],134:[2,177],135:[2,177],136:[2,177],137:[2,177],138:[2,177],139:[2,177]},{26:[2,181],121:[2,181],123:[2,181]},{25:[2,133],54:[2,133],103:84,104:[1,64],106:[1,65],109:85,110:[1,67],111:68,126:[1,83],129:[1,76],130:[1,75],133:[1,74],134:[1,77],135:[1,78],136:[1,79],137:[1,80],138:[1,81],139:[1,82]},{6:[1,276],25:[1,277],26:[1,332]},{7:333,8:117,9:18,10:19,11:[1,20],12:6,13:7,14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,27:61,28:[1,72],29:48,30:[1,70],31:[1,71],32:22,33:[1,49],34:[1,50],35:[1,51],36:[1,52],37:[1,53],38:[1,54],39:21,44:62,45:[1,44],46:[1,45],47:[1,27],50:28,51:[1,59],52:[1,60],58:46,59:47,61:35,63:23,64:24,65:25,76:[1,69],79:[1,42],83:[1,26],88:[1,57],89:[1,58],90:[1,56],96:[1,37],100:[1,43],101:[1,55],103:38,104:[1,64],106:[1,65],107:39,108:[1,66],109:40,110:[1,67],111:68,119:[1,41],124:36,125:[1,63],127:[1,29],128:[1,30],129:[1,31],130:[1,32],131:[1,33],132:[1,34]},{7:334,8:117,9:18,10:19,11:[1,20],12:6,13:7,14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,27:61,28:[1,72],29:48,30:[1,70],31:[1,71],32:22,33:[1,49],34:[1,50],35:[1,51],36:[1,52],37:[1,53],38:[1,54],39:21,44:62,45:[1,44],46:[1,45],47:[1,27],50:28,51:[1,59],52:[1,60],58:46,59:47,61:35,63:23,64:24,65:25,76:[1,69],79:[1,42],83:[1,26],88:[1,57],89:[1,58],90:[1,56],96:[1,37],100:[1,43],101:[1,55],103:38,104:[1,64],106:[1,65],107:39,108:[1,66],109:40,110:[1,67],111:68,119:[1,41],124:36,125:[1,63],127:[1,29],128:[1,30],129:[1,31],130:[1,32],131:[1,33],132:[1,34]},{6:[1,287],25:[1,288],26:[1,335]},{6:[2,40],25:[2,40],26:[2,40],54:[2,40],78:[2,40]},{6:[2,58],25:[2,58],26:[2,58],49:[2,58],54:[2,58]},{1:[2,175],6:[2,175],25:[2,175],26:[2,175],49:[2,175],54:[2,175],57:[2,175],73:[2,175],78:[2,175],86:[2,175],91:[2,175],93:[2,175],102:[2,175],104:[2,175],105:[2,175],106:[2,175],110:[2,175],118:[2,175],126:[2,175],129:[2,175],130:[2,175],133:[2,175],134:[2,175],135:[2,175],136:[2,175],137:[2,175],138:[2,175],139:[2,175]},{6:[2,128],25:[2,128],26:[2,128],54:[2,128],86:[2,128],91:[2,128]},{1:[2,172],6:[2,172],25:[2,172],26:[2,172],49:[2,172],54:[2,172],57:[2,172],73:[2,172],78:[2,172],86:[2,172],91:[2,172],93:[2,172],102:[2,172],103:84,104:[2,172],105:[2,172],106:[2,172],109:85,110:[2,172],111:68,118:[2,172],126:[2,172],129:[1,76],130:[1,75],133:[1,74],134:[1,77],135:[1,78],136:[1,79],137:[1,80],138:[1,81],139:[1,82]},{1:[2,173],6:[2,173],25:[2,173],26:[2,173],49:[2,173],54:[2,173],57:[2,173],73:[2,173],78:[2,173],86:[2,173],91:[2,173],93:[2,173],102:[2,173],103:84,104:[2,173],105:[2,173],106:[2,173],109:85,110:[2,173],111:68,118:[2,173],126:[2,173],129:[1,76],130:[1,75],133:[1,74],134:[1,77],135:[1,78],136:[1,79],137:[1,80],138:[1,81],139:[1,82]},{6:[2,95],25:[2,95],26:[2,95],54:[2,95],78:[2,95]}],
	defaultActions: {59:[2,50],60:[2,51],91:[2,109],192:[2,89]},
	parseError: function parseError(str, hash) {
	    if (hash.recoverable) {
	        this.trace(str);
	    } else {
	        throw new Error(str);
	    }
	},
	parse: function parse(input) {
	    var self = this, stack = [0], vstack = [null], lstack = [], table = this.table, yytext = '', yylineno = 0, yyleng = 0, recovering = 0, TERROR = 2, EOF = 1;
	    var args = lstack.slice.call(arguments, 1);
	    this.lexer.setInput(input);
	    this.lexer.yy = this.yy;
	    this.yy.lexer = this.lexer;
	    this.yy.parser = this;
	    if (typeof this.lexer.yylloc == 'undefined') {
	        this.lexer.yylloc = {};
	    }
	    var yyloc = this.lexer.yylloc;
	    lstack.push(yyloc);
	    var ranges = this.lexer.options && this.lexer.options.ranges;
	    if (typeof this.yy.parseError === 'function') {
	        this.parseError = this.yy.parseError;
	    } else {
	        this.parseError = Object.getPrototypeOf(this).parseError;
	    }
	    function popStack(n) {
	        stack.length = stack.length - 2 * n;
	        vstack.length = vstack.length - n;
	        lstack.length = lstack.length - n;
	    }
	    function lex() {
	        var token;
	        token = self.lexer.lex() || EOF;
	        if (typeof token !== 'number') {
	            token = self.symbols_[token] || token;
	        }
	        return token;
	    }
	    var symbol, preErrorSymbol, state, action, a, r, yyval = {}, p, len, newState, expected;
	    while (true) {
	        state = stack[stack.length - 1];
	        if (this.defaultActions[state]) {
	            action = this.defaultActions[state];
	        } else {
	            if (symbol === null || typeof symbol == 'undefined') {
	                symbol = lex();
	            }
	            action = table[state] && table[state][symbol];
	        }
	                    if (typeof action === 'undefined' || !action.length || !action[0]) {
	                var errStr = '';
	                expected = [];
	                for (p in table[state]) {
	                    if (this.terminals_[p] && p > TERROR) {
	                        expected.push('\'' + this.terminals_[p] + '\'');
	                    }
	                }
	                if (this.lexer.showPosition) {
	                    errStr = 'Parse error on line ' + (yylineno + 1) + ':\n' + this.lexer.showPosition() + '\nExpecting ' + expected.join(', ') + ', got \'' + (this.terminals_[symbol] || symbol) + '\'';
	                } else {
	                    errStr = 'Parse error on line ' + (yylineno + 1) + ': Unexpected ' + (symbol == EOF ? 'end of input' : '\'' + (this.terminals_[symbol] || symbol) + '\'');
	                }
	                this.parseError(errStr, {
	                    text: this.lexer.match,
	                    token: this.terminals_[symbol] || symbol,
	                    line: this.lexer.yylineno,
	                    loc: yyloc,
	                    expected: expected
	                });
	            }
	        if (action[0] instanceof Array && action.length > 1) {
	            throw new Error('Parse Error: multiple actions possible at state: ' + state + ', token: ' + symbol);
	        }
	        switch (action[0]) {
	        case 1:
	            stack.push(symbol);
	            vstack.push(this.lexer.yytext);
	            lstack.push(this.lexer.yylloc);
	            stack.push(action[1]);
	            symbol = null;
	            if (!preErrorSymbol) {
	                yyleng = this.lexer.yyleng;
	                yytext = this.lexer.yytext;
	                yylineno = this.lexer.yylineno;
	                yyloc = this.lexer.yylloc;
	                if (recovering > 0) {
	                    recovering--;
	                }
	            } else {
	                symbol = preErrorSymbol;
	                preErrorSymbol = null;
	            }
	            break;
	        case 2:
	            len = this.productions_[action[1]][1];
	            yyval.$ = vstack[vstack.length - len];
	            yyval._$ = {
	                first_line: lstack[lstack.length - (len || 1)].first_line,
	                last_line: lstack[lstack.length - 1].last_line,
	                first_column: lstack[lstack.length - (len || 1)].first_column,
	                last_column: lstack[lstack.length - 1].last_column
	            };
	            if (ranges) {
	                yyval._$.range = [
	                    lstack[lstack.length - (len || 1)].range[0],
	                    lstack[lstack.length - 1].range[1]
	                ];
	            }
	            r = this.performAction.apply(yyval, [
	                yytext,
	                yyleng,
	                yylineno,
	                this.yy,
	                action[1],
	                vstack,
	                lstack
	            ].concat(args));
	            if (typeof r !== 'undefined') {
	                return r;
	            }
	            if (len) {
	                stack = stack.slice(0, -1 * len * 2);
	                vstack = vstack.slice(0, -1 * len);
	                lstack = lstack.slice(0, -1 * len);
	            }
	            stack.push(this.productions_[action[1]][0]);
	            vstack.push(yyval.$);
	            lstack.push(yyval._$);
	            newState = table[stack[stack.length - 2]][stack[stack.length - 1]];
	            stack.push(newState);
	            break;
	        case 3:
	            return true;
	        }
	    }
	    return true;
	}};

	function Parser () {
	  this.yy = {};
	}
	Parser.prototype = parser;parser.Parser = Parser;
	return new Parser;
	})();


	if (true) {
	exports.parser = parser;
	exports.Parser = parser.Parser;
	exports.parse = function () { return parser.parse.apply(parser, arguments); };
	exports.main = function commonjsMain(args) {
	    if (!args[1]) {
	        console.log('Usage: '+args[0]+' FILE');
	        process.exit(1);
	    }
	    var source = __webpack_require__(!(function webpackMissingModule() { var e = new Error("Cannot find module \"fs\""); e.code = 'MODULE_NOT_FOUND'; throw e; }())).readFileSync(__webpack_require__(42).normalize(args[1]), "utf8");
	    return exports.parser.parse(source);
	};
	if (typeof module !== 'undefined' && __webpack_require__.c[0] === module) {
	  exports.main(process.argv.slice(1));
	}
	}
	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(30), __webpack_require__(72)(module)))

/***/ },
/* 48 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(process) {// Generated by CoffeeScript 1.7.1
	(function() {
	  var buildLocationData, extend, flatten, last, repeat, syntaxErrorToString, _ref;

	  exports.starts = function(string, literal, start) {
	    return literal === string.substr(start, literal.length);
	  };

	  exports.ends = function(string, literal, back) {
	    var len;
	    len = literal.length;
	    return literal === string.substr(string.length - len - (back || 0), len);
	  };

	  exports.repeat = repeat = function(str, n) {
	    var res;
	    res = '';
	    while (n > 0) {
	      if (n & 1) {
	        res += str;
	      }
	      n >>>= 1;
	      str += str;
	    }
	    return res;
	  };

	  exports.compact = function(array) {
	    var item, _i, _len, _results;
	    _results = [];
	    for (_i = 0, _len = array.length; _i < _len; _i++) {
	      item = array[_i];
	      if (item) {
	        _results.push(item);
	      }
	    }
	    return _results;
	  };

	  exports.count = function(string, substr) {
	    var num, pos;
	    num = pos = 0;
	    if (!substr.length) {
	      return 1 / 0;
	    }
	    while (pos = 1 + string.indexOf(substr, pos)) {
	      num++;
	    }
	    return num;
	  };

	  exports.merge = function(options, overrides) {
	    return extend(extend({}, options), overrides);
	  };

	  extend = exports.extend = function(object, properties) {
	    var key, val;
	    for (key in properties) {
	      val = properties[key];
	      object[key] = val;
	    }
	    return object;
	  };

	  exports.flatten = flatten = function(array) {
	    var element, flattened, _i, _len;
	    flattened = [];
	    for (_i = 0, _len = array.length; _i < _len; _i++) {
	      element = array[_i];
	      if (element instanceof Array) {
	        flattened = flattened.concat(flatten(element));
	      } else {
	        flattened.push(element);
	      }
	    }
	    return flattened;
	  };

	  exports.del = function(obj, key) {
	    var val;
	    val = obj[key];
	    delete obj[key];
	    return val;
	  };

	  exports.last = last = function(array, back) {
	    return array[array.length - (back || 0) - 1];
	  };

	  exports.some = (_ref = Array.prototype.some) != null ? _ref : function(fn) {
	    var e, _i, _len;
	    for (_i = 0, _len = this.length; _i < _len; _i++) {
	      e = this[_i];
	      if (fn(e)) {
	        return true;
	      }
	    }
	    return false;
	  };

	  exports.invertLiterate = function(code) {
	    var line, lines, maybe_code;
	    maybe_code = true;
	    lines = (function() {
	      var _i, _len, _ref1, _results;
	      _ref1 = code.split('\n');
	      _results = [];
	      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
	        line = _ref1[_i];
	        if (maybe_code && /^([ ]{4}|[ ]{0,3}\t)/.test(line)) {
	          _results.push(line);
	        } else if (maybe_code = /^\s*$/.test(line)) {
	          _results.push(line);
	        } else {
	          _results.push('# ' + line);
	        }
	      }
	      return _results;
	    })();
	    return lines.join('\n');
	  };

	  buildLocationData = function(first, last) {
	    if (!last) {
	      return first;
	    } else {
	      return {
	        first_line: first.first_line,
	        first_column: first.first_column,
	        last_line: last.last_line,
	        last_column: last.last_column
	      };
	    }
	  };

	  exports.addLocationDataFn = function(first, last) {
	    return function(obj) {
	      if (((typeof obj) === 'object') && (!!obj['updateLocationDataIfMissing'])) {
	        obj.updateLocationDataIfMissing(buildLocationData(first, last));
	      }
	      return obj;
	    };
	  };

	  exports.locationDataToString = function(obj) {
	    var locationData;
	    if (("2" in obj) && ("first_line" in obj[2])) {
	      locationData = obj[2];
	    } else if ("first_line" in obj) {
	      locationData = obj;
	    }
	    if (locationData) {
	      return ("" + (locationData.first_line + 1) + ":" + (locationData.first_column + 1) + "-") + ("" + (locationData.last_line + 1) + ":" + (locationData.last_column + 1));
	    } else {
	      return "No location data";
	    }
	  };

	  exports.baseFileName = function(file, stripExt, useWinPathSep) {
	    var parts, pathSep;
	    if (stripExt == null) {
	      stripExt = false;
	    }
	    if (useWinPathSep == null) {
	      useWinPathSep = false;
	    }
	    pathSep = useWinPathSep ? /\\|\// : /\//;
	    parts = file.split(pathSep);
	    file = parts[parts.length - 1];
	    if (!(stripExt && file.indexOf('.') >= 0)) {
	      return file;
	    }
	    parts = file.split('.');
	    parts.pop();
	    if (parts[parts.length - 1] === 'coffee' && parts.length > 1) {
	      parts.pop();
	    }
	    return parts.join('.');
	  };

	  exports.isCoffee = function(file) {
	    return /\.((lit)?coffee|coffee\.md)$/.test(file);
	  };

	  exports.isLiterate = function(file) {
	    return /\.(litcoffee|coffee\.md)$/.test(file);
	  };

	  exports.throwSyntaxError = function(message, location) {
	    var error;
	    error = new SyntaxError(message);
	    error.location = location;
	    error.toString = syntaxErrorToString;
	    error.stack = error.toString();
	    throw error;
	  };

	  exports.updateSyntaxError = function(error, code, filename) {
	    if (error.toString === syntaxErrorToString) {
	      error.code || (error.code = code);
	      error.filename || (error.filename = filename);
	      error.stack = error.toString();
	    }
	    return error;
	  };

	  syntaxErrorToString = function() {
	    var codeLine, colorize, colorsEnabled, end, filename, first_column, first_line, last_column, last_line, marker, start, _ref1, _ref2;
	    if (!(this.code && this.location)) {
	      return Error.prototype.toString.call(this);
	    }
	    _ref1 = this.location, first_line = _ref1.first_line, first_column = _ref1.first_column, last_line = _ref1.last_line, last_column = _ref1.last_column;
	    if (last_line == null) {
	      last_line = first_line;
	    }
	    if (last_column == null) {
	      last_column = first_column;
	    }
	    filename = this.filename || '[stdin]';
	    codeLine = this.code.split('\n')[first_line];
	    start = first_column;
	    end = first_line === last_line ? last_column + 1 : codeLine.length;
	    marker = repeat(' ', start) + repeat('^', end - start);
	    if (typeof process !== "undefined" && process !== null) {
	      colorsEnabled = process.stdout.isTTY && !process.env.NODE_DISABLE_COLORS;
	    }
	    if ((_ref2 = this.colorful) != null ? _ref2 : colorsEnabled) {
	      colorize = function(str) {
	        return "\x1B[1;31m" + str + "\x1B[0m";
	      };
	      codeLine = codeLine.slice(0, start) + colorize(codeLine.slice(start, end)) + codeLine.slice(end);
	      marker = colorize(marker);
	    }
	    return "" + filename + ":" + (first_line + 1) + ":" + (first_column + 1) + ": error: " + this.message + "\n" + codeLine + "\n" + marker;
	  };

	  exports.nameWhitespaceCharacter = function(string) {
	    switch (string) {
	      case ' ':
	        return 'space';
	      case '\n':
	        return 'newline';
	      case '\r':
	        return 'carriage return';
	      case '\t':
	        return 'tab';
	      default:
	        return string;
	    }
	  };

	}).call(this);
	
	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(30)))

/***/ },
/* 49 */
/***/ function(module, exports, __webpack_require__) {

	// Generated by CoffeeScript 1.7.1
	(function() {
	  var LineMap, SourceMap;

	  LineMap = (function() {
	    function LineMap(line) {
	      this.line = line;
	      this.columns = [];
	    }

	    LineMap.prototype.add = function(column, _arg, options) {
	      var sourceColumn, sourceLine;
	      sourceLine = _arg[0], sourceColumn = _arg[1];
	      if (options == null) {
	        options = {};
	      }
	      if (this.columns[column] && options.noReplace) {
	        return;
	      }
	      return this.columns[column] = {
	        line: this.line,
	        column: column,
	        sourceLine: sourceLine,
	        sourceColumn: sourceColumn
	      };
	    };

	    LineMap.prototype.sourceLocation = function(column) {
	      var mapping;
	      while (!((mapping = this.columns[column]) || (column <= 0))) {
	        column--;
	      }
	      return mapping && [mapping.sourceLine, mapping.sourceColumn];
	    };

	    return LineMap;

	  })();

	  SourceMap = (function() {
	    var BASE64_CHARS, VLQ_CONTINUATION_BIT, VLQ_SHIFT, VLQ_VALUE_MASK;

	    function SourceMap() {
	      this.lines = [];
	    }

	    SourceMap.prototype.add = function(sourceLocation, generatedLocation, options) {
	      var column, line, lineMap, _base;
	      if (options == null) {
	        options = {};
	      }
	      line = generatedLocation[0], column = generatedLocation[1];
	      lineMap = ((_base = this.lines)[line] || (_base[line] = new LineMap(line)));
	      return lineMap.add(column, sourceLocation, options);
	    };

	    SourceMap.prototype.sourceLocation = function(_arg) {
	      var column, line, lineMap;
	      line = _arg[0], column = _arg[1];
	      while (!((lineMap = this.lines[line]) || (line <= 0))) {
	        line--;
	      }
	      return lineMap && lineMap.sourceLocation(column);
	    };

	    SourceMap.prototype.generate = function(options, code) {
	      var buffer, lastColumn, lastSourceColumn, lastSourceLine, lineMap, lineNumber, mapping, needComma, v3, writingline, _i, _j, _len, _len1, _ref, _ref1;
	      if (options == null) {
	        options = {};
	      }
	      if (code == null) {
	        code = null;
	      }
	      writingline = 0;
	      lastColumn = 0;
	      lastSourceLine = 0;
	      lastSourceColumn = 0;
	      needComma = false;
	      buffer = "";
	      _ref = this.lines;
	      for (lineNumber = _i = 0, _len = _ref.length; _i < _len; lineNumber = ++_i) {
	        lineMap = _ref[lineNumber];
	        if (lineMap) {
	          _ref1 = lineMap.columns;
	          for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
	            mapping = _ref1[_j];
	            if (!(mapping)) {
	              continue;
	            }
	            while (writingline < mapping.line) {
	              lastColumn = 0;
	              needComma = false;
	              buffer += ";";
	              writingline++;
	            }
	            if (needComma) {
	              buffer += ",";
	              needComma = false;
	            }
	            buffer += this.encodeVlq(mapping.column - lastColumn);
	            lastColumn = mapping.column;
	            buffer += this.encodeVlq(0);
	            buffer += this.encodeVlq(mapping.sourceLine - lastSourceLine);
	            lastSourceLine = mapping.sourceLine;
	            buffer += this.encodeVlq(mapping.sourceColumn - lastSourceColumn);
	            lastSourceColumn = mapping.sourceColumn;
	            needComma = true;
	          }
	        }
	      }
	      v3 = {
	        version: 3,
	        file: options.generatedFile || '',
	        sourceRoot: options.sourceRoot || '',
	        sources: options.sourceFiles || [''],
	        names: [],
	        mappings: buffer
	      };
	      if (options.inline) {
	        v3.sourcesContent = [code];
	      }
	      return JSON.stringify(v3, null, 2);
	    };

	    VLQ_SHIFT = 5;

	    VLQ_CONTINUATION_BIT = 1 << VLQ_SHIFT;

	    VLQ_VALUE_MASK = VLQ_CONTINUATION_BIT - 1;

	    SourceMap.prototype.encodeVlq = function(value) {
	      var answer, nextChunk, signBit, valueToEncode;
	      answer = '';
	      signBit = value < 0 ? 1 : 0;
	      valueToEncode = (Math.abs(value) << 1) + signBit;
	      while (valueToEncode || !answer) {
	        nextChunk = valueToEncode & VLQ_VALUE_MASK;
	        valueToEncode = valueToEncode >> VLQ_SHIFT;
	        if (valueToEncode) {
	          nextChunk |= VLQ_CONTINUATION_BIT;
	        }
	        answer += this.encodeBase64(nextChunk);
	      }
	      return answer;
	    };

	    BASE64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

	    SourceMap.prototype.encodeBase64 = function(value) {
	      return BASE64_CHARS[value] || (function() {
	        throw new Error("Cannot Base64 encode value: " + value);
	      })();
	    };

	    return SourceMap;

	  })();

	  module.exports = SourceMap;

	}).call(this);


/***/ },
/* 50 */
/***/ function(module, exports, __webpack_require__) {

	var map = {
		"./browser": 56,
		"./browser.js": 56,
		"./cake": 57,
		"./cake.js": 57,
		"./coffee-script": 44,
		"./coffee-script.js": 44,
		"./command": 58,
		"./command.js": 58,
		"./grammar": 59,
		"./grammar.js": 59,
		"./helpers": 48,
		"./helpers.js": 48,
		"./index": 60,
		"./index.js": 60,
		"./lexer": 46,
		"./lexer.js": 46,
		"./nodes": 52,
		"./nodes.js": 52,
		"./optparse": 61,
		"./optparse.js": 61,
		"./parser": 47,
		"./parser.js": 47,
		"./register": 51,
		"./register.js": 51,
		"./repl": 62,
		"./repl.js": 62,
		"./rewriter": 63,
		"./rewriter.js": 63,
		"./scope": 64,
		"./scope.js": 64,
		"./sourcemap": 49,
		"./sourcemap.js": 49
	};
	function webpackContext(req) {
		return __webpack_require__(webpackContextResolve(req));
	};
	function webpackContextResolve(req) {
		return map[req] || (function() { throw new Error("Cannot find module '" + req + "'.") }());
	};
	webpackContext.keys = function webpackContextKeys() {
		return Object.keys(map);
	};
	webpackContext.resolve = webpackContextResolve;
	module.exports = webpackContext;
	webpackContext.id = 50;


/***/ },
/* 51 */
/***/ function(module, exports, __webpack_require__) {

	// Generated by CoffeeScript 1.7.1
	(function() {
	  var CoffeeScript, Module, binary, child_process, ext, findExtension, fork, helpers, loadFile, path, _i, _len, _ref;

	  CoffeeScript = __webpack_require__(44);

	  child_process = __webpack_require__(!(function webpackMissingModule() { var e = new Error("Cannot find module \"child_process\""); e.code = 'MODULE_NOT_FOUND'; throw e; }()));

	  helpers = __webpack_require__(48);

	  path = __webpack_require__(42);

	  loadFile = function(module, filename) {
	    var answer;
	    answer = CoffeeScript._compileFile(filename, false);
	    return module._compile(answer, filename);
	  };

	  if ((void 0)) {
	    _ref = CoffeeScript.FILE_EXTENSIONS;
	    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
	      ext = _ref[_i];
	      (void 0)[ext] = loadFile;
	    }
	    Module = __webpack_require__(!(function webpackMissingModule() { var e = new Error("Cannot find module \"module\""); e.code = 'MODULE_NOT_FOUND'; throw e; }()));
	    findExtension = function(filename) {
	      var curExtension, extensions;
	      extensions = path.basename(filename).split('.');
	      if (extensions[0] === '') {
	        extensions.shift();
	      }
	      while (extensions.shift()) {
	        curExtension = '.' + extensions.join('.');
	        if (Module._extensions[curExtension]) {
	          return curExtension;
	        }
	      }
	      return '.js';
	    };
	    Module.prototype.load = function(filename) {
	      var extension;
	      this.filename = filename;
	      this.paths = Module._nodeModulePaths(path.dirname(filename));
	      extension = findExtension(filename);
	      Module._extensions[extension](this, filename);
	      return this.loaded = true;
	    };
	  }

	  if (child_process) {
	    fork = child_process.fork;
	    binary = /*require.resolve*/(!(function webpackMissingModule() { var e = new Error("Cannot find module \"../../bin/coffee\""); e.code = 'MODULE_NOT_FOUND'; throw e; }()));
	    child_process.fork = function(path, args, options) {
	      if (helpers.isCoffee(path)) {
	        if (!Array.isArray(args)) {
	          options = args || {};
	          args = [];
	        }
	        args = [path].concat(args);
	        path = binary;
	      }
	      return fork(path, args, options);
	    };
	  }

	}).call(this);


/***/ },
/* 52 */
/***/ function(module, exports, __webpack_require__) {

	// Generated by CoffeeScript 1.7.1
	(function() {
	  var Access, Arr, Assign, Base, Block, Call, Class, Code, CodeFragment, Comment, Existence, Expansion, Extends, For, HEXNUM, IDENTIFIER, IDENTIFIER_STR, IS_REGEX, IS_STRING, If, In, Index, LEVEL_ACCESS, LEVEL_COND, LEVEL_LIST, LEVEL_OP, LEVEL_PAREN, LEVEL_TOP, Literal, METHOD_DEF, NEGATE, NO, NUMBER, Obj, Op, Param, Parens, RESERVED, Range, Return, SIMPLENUM, STRICT_PROSCRIBED, Scope, Slice, Splat, Switch, TAB, THIS, Throw, Try, UTILITIES, Value, While, YES, addLocationDataFn, compact, del, ends, extend, flatten, fragmentsToText, isLiteralArguments, isLiteralThis, last, locationDataToString, merge, multident, parseNum, some, starts, throwSyntaxError, unfoldSoak, utility, _ref, _ref1,
	    __hasProp = {}.hasOwnProperty,
	    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
	    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; },
	    __slice = [].slice;

	  Error.stackTraceLimit = Infinity;

	  Scope = __webpack_require__(64).Scope;

	  _ref = __webpack_require__(46), RESERVED = _ref.RESERVED, STRICT_PROSCRIBED = _ref.STRICT_PROSCRIBED;

	  _ref1 = __webpack_require__(48), compact = _ref1.compact, flatten = _ref1.flatten, extend = _ref1.extend, merge = _ref1.merge, del = _ref1.del, starts = _ref1.starts, ends = _ref1.ends, last = _ref1.last, some = _ref1.some, addLocationDataFn = _ref1.addLocationDataFn, locationDataToString = _ref1.locationDataToString, throwSyntaxError = _ref1.throwSyntaxError;

	  exports.extend = extend;

	  exports.addLocationDataFn = addLocationDataFn;

	  YES = function() {
	    return true;
	  };

	  NO = function() {
	    return false;
	  };

	  THIS = function() {
	    return this;
	  };

	  NEGATE = function() {
	    this.negated = !this.negated;
	    return this;
	  };

	  exports.CodeFragment = CodeFragment = (function() {
	    function CodeFragment(parent, code) {
	      var _ref2;
	      this.code = "" + code;
	      this.locationData = parent != null ? parent.locationData : void 0;
	      this.type = (parent != null ? (_ref2 = parent.constructor) != null ? _ref2.name : void 0 : void 0) || 'unknown';
	    }

	    CodeFragment.prototype.toString = function() {
	      return "" + this.code + (this.locationData ? ": " + locationDataToString(this.locationData) : '');
	    };

	    return CodeFragment;

	  })();

	  fragmentsToText = function(fragments) {
	    var fragment;
	    return ((function() {
	      var _i, _len, _results;
	      _results = [];
	      for (_i = 0, _len = fragments.length; _i < _len; _i++) {
	        fragment = fragments[_i];
	        _results.push(fragment.code);
	      }
	      return _results;
	    })()).join('');
	  };

	  exports.Base = Base = (function() {
	    function Base() {}

	    Base.prototype.compile = function(o, lvl) {
	      return fragmentsToText(this.compileToFragments(o, lvl));
	    };

	    Base.prototype.compileToFragments = function(o, lvl) {
	      var node;
	      o = extend({}, o);
	      if (lvl) {
	        o.level = lvl;
	      }
	      node = this.unfoldSoak(o) || this;
	      node.tab = o.indent;
	      if (o.level === LEVEL_TOP || !node.isStatement(o)) {
	        return node.compileNode(o);
	      } else {
	        return node.compileClosure(o);
	      }
	    };

	    Base.prototype.compileClosure = function(o) {
	      var args, argumentsNode, func, jumpNode, meth;
	      if (jumpNode = this.jumps()) {
	        jumpNode.error('cannot use a pure statement in an expression');
	      }
	      o.sharedScope = true;
	      func = new Code([], Block.wrap([this]));
	      args = [];
	      if ((argumentsNode = this.contains(isLiteralArguments)) || this.contains(isLiteralThis)) {
	        args = [new Literal('this')];
	        if (argumentsNode) {
	          meth = 'apply';
	          args.push(new Literal('arguments'));
	        } else {
	          meth = 'call';
	        }
	        func = new Value(func, [new Access(new Literal(meth))]);
	      }
	      return (new Call(func, args)).compileNode(o);
	    };

	    Base.prototype.cache = function(o, level, reused) {
	      var ref, sub;
	      if (!this.isComplex()) {
	        ref = level ? this.compileToFragments(o, level) : this;
	        return [ref, ref];
	      } else {
	        ref = new Literal(reused || o.scope.freeVariable('ref'));
	        sub = new Assign(ref, this);
	        if (level) {
	          return [sub.compileToFragments(o, level), [this.makeCode(ref.value)]];
	        } else {
	          return [sub, ref];
	        }
	      }
	    };

	    Base.prototype.cacheToCodeFragments = function(cacheValues) {
	      return [fragmentsToText(cacheValues[0]), fragmentsToText(cacheValues[1])];
	    };

	    Base.prototype.makeReturn = function(res) {
	      var me;
	      me = this.unwrapAll();
	      if (res) {
	        return new Call(new Literal("" + res + ".push"), [me]);
	      } else {
	        return new Return(me);
	      }
	    };

	    Base.prototype.contains = function(pred) {
	      var node;
	      node = void 0;
	      this.traverseChildren(false, function(n) {
	        if (pred(n)) {
	          node = n;
	          return false;
	        }
	      });
	      return node;
	    };

	    Base.prototype.lastNonComment = function(list) {
	      var i;
	      i = list.length;
	      while (i--) {
	        if (!(list[i] instanceof Comment)) {
	          return list[i];
	        }
	      }
	      return null;
	    };

	    Base.prototype.toString = function(idt, name) {
	      var tree;
	      if (idt == null) {
	        idt = '';
	      }
	      if (name == null) {
	        name = this.constructor.name;
	      }
	      tree = '\n' + idt + name;
	      if (this.soak) {
	        tree += '?';
	      }
	      this.eachChild(function(node) {
	        return tree += node.toString(idt + TAB);
	      });
	      return tree;
	    };

	    Base.prototype.eachChild = function(func) {
	      var attr, child, _i, _j, _len, _len1, _ref2, _ref3;
	      if (!this.children) {
	        return this;
	      }
	      _ref2 = this.children;
	      for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
	        attr = _ref2[_i];
	        if (this[attr]) {
	          _ref3 = flatten([this[attr]]);
	          for (_j = 0, _len1 = _ref3.length; _j < _len1; _j++) {
	            child = _ref3[_j];
	            if (func(child) === false) {
	              return this;
	            }
	          }
	        }
	      }
	      return this;
	    };

	    Base.prototype.traverseChildren = function(crossScope, func) {
	      return this.eachChild(function(child) {
	        var recur;
	        recur = func(child);
	        if (recur !== false) {
	          return child.traverseChildren(crossScope, func);
	        }
	      });
	    };

	    Base.prototype.invert = function() {
	      return new Op('!', this);
	    };

	    Base.prototype.unwrapAll = function() {
	      var node;
	      node = this;
	      while (node !== (node = node.unwrap())) {
	        continue;
	      }
	      return node;
	    };

	    Base.prototype.children = [];

	    Base.prototype.isStatement = NO;

	    Base.prototype.jumps = NO;

	    Base.prototype.isComplex = YES;

	    Base.prototype.isChainable = NO;

	    Base.prototype.isAssignable = NO;

	    Base.prototype.unwrap = THIS;

	    Base.prototype.unfoldSoak = NO;

	    Base.prototype.assigns = NO;

	    Base.prototype.updateLocationDataIfMissing = function(locationData) {
	      if (this.locationData) {
	        return this;
	      }
	      this.locationData = locationData;
	      return this.eachChild(function(child) {
	        return child.updateLocationDataIfMissing(locationData);
	      });
	    };

	    Base.prototype.error = function(message) {
	      return throwSyntaxError(message, this.locationData);
	    };

	    Base.prototype.makeCode = function(code) {
	      return new CodeFragment(this, code);
	    };

	    Base.prototype.wrapInBraces = function(fragments) {
	      return [].concat(this.makeCode('('), fragments, this.makeCode(')'));
	    };

	    Base.prototype.joinFragmentArrays = function(fragmentsList, joinStr) {
	      var answer, fragments, i, _i, _len;
	      answer = [];
	      for (i = _i = 0, _len = fragmentsList.length; _i < _len; i = ++_i) {
	        fragments = fragmentsList[i];
	        if (i) {
	          answer.push(this.makeCode(joinStr));
	        }
	        answer = answer.concat(fragments);
	      }
	      return answer;
	    };

	    return Base;

	  })();

	  exports.Block = Block = (function(_super) {
	    __extends(Block, _super);

	    function Block(nodes) {
	      this.expressions = compact(flatten(nodes || []));
	    }

	    Block.prototype.children = ['expressions'];

	    Block.prototype.push = function(node) {
	      this.expressions.push(node);
	      return this;
	    };

	    Block.prototype.pop = function() {
	      return this.expressions.pop();
	    };

	    Block.prototype.unshift = function(node) {
	      this.expressions.unshift(node);
	      return this;
	    };

	    Block.prototype.unwrap = function() {
	      if (this.expressions.length === 1) {
	        return this.expressions[0];
	      } else {
	        return this;
	      }
	    };

	    Block.prototype.isEmpty = function() {
	      return !this.expressions.length;
	    };

	    Block.prototype.isStatement = function(o) {
	      var exp, _i, _len, _ref2;
	      _ref2 = this.expressions;
	      for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
	        exp = _ref2[_i];
	        if (exp.isStatement(o)) {
	          return true;
	        }
	      }
	      return false;
	    };

	    Block.prototype.jumps = function(o) {
	      var exp, jumpNode, _i, _len, _ref2;
	      _ref2 = this.expressions;
	      for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
	        exp = _ref2[_i];
	        if (jumpNode = exp.jumps(o)) {
	          return jumpNode;
	        }
	      }
	    };

	    Block.prototype.makeReturn = function(res) {
	      var expr, len;
	      len = this.expressions.length;
	      while (len--) {
	        expr = this.expressions[len];
	        if (!(expr instanceof Comment)) {
	          this.expressions[len] = expr.makeReturn(res);
	          if (expr instanceof Return && !expr.expression) {
	            this.expressions.splice(len, 1);
	          }
	          break;
	        }
	      }
	      return this;
	    };

	    Block.prototype.compileToFragments = function(o, level) {
	      if (o == null) {
	        o = {};
	      }
	      if (o.scope) {
	        return Block.__super__.compileToFragments.call(this, o, level);
	      } else {
	        return this.compileRoot(o);
	      }
	    };

	    Block.prototype.compileNode = function(o) {
	      var answer, compiledNodes, fragments, index, node, top, _i, _len, _ref2;
	      this.tab = o.indent;
	      top = o.level === LEVEL_TOP;
	      compiledNodes = [];
	      _ref2 = this.expressions;
	      for (index = _i = 0, _len = _ref2.length; _i < _len; index = ++_i) {
	        node = _ref2[index];
	        node = node.unwrapAll();
	        node = node.unfoldSoak(o) || node;
	        if (node instanceof Block) {
	          compiledNodes.push(node.compileNode(o));
	        } else if (top) {
	          node.front = true;
	          fragments = node.compileToFragments(o);
	          if (!node.isStatement(o)) {
	            fragments.unshift(this.makeCode("" + this.tab));
	            fragments.push(this.makeCode(";"));
	          }
	          compiledNodes.push(fragments);
	        } else {
	          compiledNodes.push(node.compileToFragments(o, LEVEL_LIST));
	        }
	      }
	      if (top) {
	        if (this.spaced) {
	          return [].concat(this.joinFragmentArrays(compiledNodes, '\n\n'), this.makeCode("\n"));
	        } else {
	          return this.joinFragmentArrays(compiledNodes, '\n');
	        }
	      }
	      if (compiledNodes.length) {
	        answer = this.joinFragmentArrays(compiledNodes, ', ');
	      } else {
	        answer = [this.makeCode("void 0")];
	      }
	      if (compiledNodes.length > 1 && o.level >= LEVEL_LIST) {
	        return this.wrapInBraces(answer);
	      } else {
	        return answer;
	      }
	    };

	    Block.prototype.compileRoot = function(o) {
	      var exp, fragments, i, name, prelude, preludeExps, rest, _i, _len, _ref2;
	      o.indent = o.bare ? '' : TAB;
	      o.level = LEVEL_TOP;
	      this.spaced = true;
	      o.scope = new Scope(null, this, null);
	      _ref2 = o.locals || [];
	      for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
	        name = _ref2[_i];
	        o.scope.parameter(name);
	      }
	      prelude = [];
	      if (!o.bare) {
	        preludeExps = (function() {
	          var _j, _len1, _ref3, _results;
	          _ref3 = this.expressions;
	          _results = [];
	          for (i = _j = 0, _len1 = _ref3.length; _j < _len1; i = ++_j) {
	            exp = _ref3[i];
	            if (!(exp.unwrap() instanceof Comment)) {
	              break;
	            }
	            _results.push(exp);
	          }
	          return _results;
	        }).call(this);
	        rest = this.expressions.slice(preludeExps.length);
	        this.expressions = preludeExps;
	        if (preludeExps.length) {
	          prelude = this.compileNode(merge(o, {
	            indent: ''
	          }));
	          prelude.push(this.makeCode("\n"));
	        }
	        this.expressions = rest;
	      }
	      fragments = this.compileWithDeclarations(o);
	      if (o.bare) {
	        return fragments;
	      }
	      return [].concat(prelude, this.makeCode("(function() {\n"), fragments, this.makeCode("\n}).call(this);\n"));
	    };

	    Block.prototype.compileWithDeclarations = function(o) {
	      var assigns, declars, exp, fragments, i, post, rest, scope, spaced, _i, _len, _ref2, _ref3, _ref4;
	      fragments = [];
	      post = [];
	      _ref2 = this.expressions;
	      for (i = _i = 0, _len = _ref2.length; _i < _len; i = ++_i) {
	        exp = _ref2[i];
	        exp = exp.unwrap();
	        if (!(exp instanceof Comment || exp instanceof Literal)) {
	          break;
	        }
	      }
	      o = merge(o, {
	        level: LEVEL_TOP
	      });
	      if (i) {
	        rest = this.expressions.splice(i, 9e9);
	        _ref3 = [this.spaced, false], spaced = _ref3[0], this.spaced = _ref3[1];
	        _ref4 = [this.compileNode(o), spaced], fragments = _ref4[0], this.spaced = _ref4[1];
	        this.expressions = rest;
	      }
	      post = this.compileNode(o);
	      scope = o.scope;
	      if (scope.expressions === this) {
	        declars = o.scope.hasDeclarations();
	        assigns = scope.hasAssignments;
	        if (declars || assigns) {
	          if (i) {
	            fragments.push(this.makeCode('\n'));
	          }
	          fragments.push(this.makeCode("" + this.tab + "var "));
	          if (declars) {
	            fragments.push(this.makeCode(scope.declaredVariables().join(', ')));
	          }
	          if (assigns) {
	            if (declars) {
	              fragments.push(this.makeCode(",\n" + (this.tab + TAB)));
	            }
	            fragments.push(this.makeCode(scope.assignedVariables().join(",\n" + (this.tab + TAB))));
	          }
	          fragments.push(this.makeCode(";\n" + (this.spaced ? '\n' : '')));
	        } else if (fragments.length && post.length) {
	          fragments.push(this.makeCode("\n"));
	        }
	      }
	      return fragments.concat(post);
	    };

	    Block.wrap = function(nodes) {
	      if (nodes.length === 1 && nodes[0] instanceof Block) {
	        return nodes[0];
	      }
	      return new Block(nodes);
	    };

	    return Block;

	  })(Base);

	  exports.Literal = Literal = (function(_super) {
	    __extends(Literal, _super);

	    function Literal(value) {
	      this.value = value;
	    }

	    Literal.prototype.makeReturn = function() {
	      if (this.isStatement()) {
	        return this;
	      } else {
	        return Literal.__super__.makeReturn.apply(this, arguments);
	      }
	    };

	    Literal.prototype.isAssignable = function() {
	      return IDENTIFIER.test(this.value);
	    };

	    Literal.prototype.isStatement = function() {
	      var _ref2;
	      return (_ref2 = this.value) === 'break' || _ref2 === 'continue' || _ref2 === 'debugger';
	    };

	    Literal.prototype.isComplex = NO;

	    Literal.prototype.assigns = function(name) {
	      return name === this.value;
	    };

	    Literal.prototype.jumps = function(o) {
	      if (this.value === 'break' && !((o != null ? o.loop : void 0) || (o != null ? o.block : void 0))) {
	        return this;
	      }
	      if (this.value === 'continue' && !(o != null ? o.loop : void 0)) {
	        return this;
	      }
	    };

	    Literal.prototype.compileNode = function(o) {
	      var answer, code, _ref2;
	      code = this.value === 'this' ? ((_ref2 = o.scope.method) != null ? _ref2.bound : void 0) ? o.scope.method.context : this.value : this.value.reserved ? "\"" + this.value + "\"" : this.value;
	      answer = this.isStatement() ? "" + this.tab + code + ";" : code;
	      return [this.makeCode(answer)];
	    };

	    Literal.prototype.toString = function() {
	      return ' "' + this.value + '"';
	    };

	    return Literal;

	  })(Base);

	  exports.Undefined = (function(_super) {
	    __extends(Undefined, _super);

	    function Undefined() {
	      return Undefined.__super__.constructor.apply(this, arguments);
	    }

	    Undefined.prototype.isAssignable = NO;

	    Undefined.prototype.isComplex = NO;

	    Undefined.prototype.compileNode = function(o) {
	      return [this.makeCode(o.level >= LEVEL_ACCESS ? '(void 0)' : 'void 0')];
	    };

	    return Undefined;

	  })(Base);

	  exports.Null = (function(_super) {
	    __extends(Null, _super);

	    function Null() {
	      return Null.__super__.constructor.apply(this, arguments);
	    }

	    Null.prototype.isAssignable = NO;

	    Null.prototype.isComplex = NO;

	    Null.prototype.compileNode = function() {
	      return [this.makeCode("null")];
	    };

	    return Null;

	  })(Base);

	  exports.Bool = (function(_super) {
	    __extends(Bool, _super);

	    Bool.prototype.isAssignable = NO;

	    Bool.prototype.isComplex = NO;

	    Bool.prototype.compileNode = function() {
	      return [this.makeCode(this.val)];
	    };

	    function Bool(val) {
	      this.val = val;
	    }

	    return Bool;

	  })(Base);

	  exports.Return = Return = (function(_super) {
	    __extends(Return, _super);

	    function Return(expr) {
	      if (expr && !expr.unwrap().isUndefined) {
	        this.expression = expr;
	      }
	    }

	    Return.prototype.children = ['expression'];

	    Return.prototype.isStatement = YES;

	    Return.prototype.makeReturn = THIS;

	    Return.prototype.jumps = THIS;

	    Return.prototype.compileToFragments = function(o, level) {
	      var expr, _ref2;
	      expr = (_ref2 = this.expression) != null ? _ref2.makeReturn() : void 0;
	      if (expr && !(expr instanceof Return)) {
	        return expr.compileToFragments(o, level);
	      } else {
	        return Return.__super__.compileToFragments.call(this, o, level);
	      }
	    };

	    Return.prototype.compileNode = function(o) {
	      var answer;
	      answer = [];
	      answer.push(this.makeCode(this.tab + ("return" + (this.expression ? " " : ""))));
	      if (this.expression) {
	        answer = answer.concat(this.expression.compileToFragments(o, LEVEL_PAREN));
	      }
	      answer.push(this.makeCode(";"));
	      return answer;
	    };

	    return Return;

	  })(Base);

	  exports.Value = Value = (function(_super) {
	    __extends(Value, _super);

	    function Value(base, props, tag) {
	      if (!props && base instanceof Value) {
	        return base;
	      }
	      this.base = base;
	      this.properties = props || [];
	      if (tag) {
	        this[tag] = true;
	      }
	      return this;
	    }

	    Value.prototype.children = ['base', 'properties'];

	    Value.prototype.add = function(props) {
	      this.properties = this.properties.concat(props);
	      return this;
	    };

	    Value.prototype.hasProperties = function() {
	      return !!this.properties.length;
	    };

	    Value.prototype.bareLiteral = function(type) {
	      return !this.properties.length && this.base instanceof type;
	    };

	    Value.prototype.isArray = function() {
	      return this.bareLiteral(Arr);
	    };

	    Value.prototype.isRange = function() {
	      return this.bareLiteral(Range);
	    };

	    Value.prototype.isComplex = function() {
	      return this.hasProperties() || this.base.isComplex();
	    };

	    Value.prototype.isAssignable = function() {
	      return this.hasProperties() || this.base.isAssignable();
	    };

	    Value.prototype.isSimpleNumber = function() {
	      return this.bareLiteral(Literal) && SIMPLENUM.test(this.base.value);
	    };

	    Value.prototype.isString = function() {
	      return this.bareLiteral(Literal) && IS_STRING.test(this.base.value);
	    };

	    Value.prototype.isRegex = function() {
	      return this.bareLiteral(Literal) && IS_REGEX.test(this.base.value);
	    };

	    Value.prototype.isAtomic = function() {
	      var node, _i, _len, _ref2;
	      _ref2 = this.properties.concat(this.base);
	      for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
	        node = _ref2[_i];
	        if (node.soak || node instanceof Call) {
	          return false;
	        }
	      }
	      return true;
	    };

	    Value.prototype.isNotCallable = function() {
	      return this.isSimpleNumber() || this.isString() || this.isRegex() || this.isArray() || this.isRange() || this.isSplice() || this.isObject();
	    };

	    Value.prototype.isStatement = function(o) {
	      return !this.properties.length && this.base.isStatement(o);
	    };

	    Value.prototype.assigns = function(name) {
	      return !this.properties.length && this.base.assigns(name);
	    };

	    Value.prototype.jumps = function(o) {
	      return !this.properties.length && this.base.jumps(o);
	    };

	    Value.prototype.isObject = function(onlyGenerated) {
	      if (this.properties.length) {
	        return false;
	      }
	      return (this.base instanceof Obj) && (!onlyGenerated || this.base.generated);
	    };

	    Value.prototype.isSplice = function() {
	      return last(this.properties) instanceof Slice;
	    };

	    Value.prototype.looksStatic = function(className) {
	      var _ref2;
	      return this.base.value === className && this.properties.length && ((_ref2 = this.properties[0].name) != null ? _ref2.value : void 0) !== 'prototype';
	    };

	    Value.prototype.unwrap = function() {
	      if (this.properties.length) {
	        return this;
	      } else {
	        return this.base;
	      }
	    };

	    Value.prototype.cacheReference = function(o) {
	      var base, bref, name, nref;
	      name = last(this.properties);
	      if (this.properties.length < 2 && !this.base.isComplex() && !(name != null ? name.isComplex() : void 0)) {
	        return [this, this];
	      }
	      base = new Value(this.base, this.properties.slice(0, -1));
	      if (base.isComplex()) {
	        bref = new Literal(o.scope.freeVariable('base'));
	        base = new Value(new Parens(new Assign(bref, base)));
	      }
	      if (!name) {
	        return [base, bref];
	      }
	      if (name.isComplex()) {
	        nref = new Literal(o.scope.freeVariable('name'));
	        name = new Index(new Assign(nref, name.index));
	        nref = new Index(nref);
	      }
	      return [base.add(name), new Value(bref || base.base, [nref || name])];
	    };

	    Value.prototype.compileNode = function(o) {
	      var fragments, prop, props, _i, _len;
	      this.base.front = this.front;
	      props = this.properties;
	      fragments = this.base.compileToFragments(o, (props.length ? LEVEL_ACCESS : null));
	      if ((this.base instanceof Parens || props.length) && SIMPLENUM.test(fragmentsToText(fragments))) {
	        fragments.push(this.makeCode('.'));
	      }
	      for (_i = 0, _len = props.length; _i < _len; _i++) {
	        prop = props[_i];
	        fragments.push.apply(fragments, prop.compileToFragments(o));
	      }
	      return fragments;
	    };

	    Value.prototype.unfoldSoak = function(o) {
	      return this.unfoldedSoak != null ? this.unfoldedSoak : this.unfoldedSoak = (function(_this) {
	        return function() {
	          var fst, i, ifn, prop, ref, snd, _i, _len, _ref2, _ref3;
	          if (ifn = _this.base.unfoldSoak(o)) {
	            (_ref2 = ifn.body.properties).push.apply(_ref2, _this.properties);
	            return ifn;
	          }
	          _ref3 = _this.properties;
	          for (i = _i = 0, _len = _ref3.length; _i < _len; i = ++_i) {
	            prop = _ref3[i];
	            if (!prop.soak) {
	              continue;
	            }
	            prop.soak = false;
	            fst = new Value(_this.base, _this.properties.slice(0, i));
	            snd = new Value(_this.base, _this.properties.slice(i));
	            if (fst.isComplex()) {
	              ref = new Literal(o.scope.freeVariable('ref'));
	              fst = new Parens(new Assign(ref, fst));
	              snd.base = ref;
	            }
	            return new If(new Existence(fst), snd, {
	              soak: true
	            });
	          }
	          return false;
	        };
	      })(this)();
	    };

	    return Value;

	  })(Base);

	  exports.Comment = Comment = (function(_super) {
	    __extends(Comment, _super);

	    function Comment(comment) {
	      this.comment = comment;
	    }

	    Comment.prototype.isStatement = YES;

	    Comment.prototype.makeReturn = THIS;

	    Comment.prototype.compileNode = function(o, level) {
	      var code, comment;
	      comment = this.comment.replace(/^(\s*)#/gm, "$1 *");
	      code = "/*" + (multident(comment, this.tab)) + (__indexOf.call(comment, '\n') >= 0 ? "\n" + this.tab : '') + " */";
	      if ((level || o.level) === LEVEL_TOP) {
	        code = o.indent + code;
	      }
	      return [this.makeCode("\n"), this.makeCode(code)];
	    };

	    return Comment;

	  })(Base);

	  exports.Call = Call = (function(_super) {
	    __extends(Call, _super);

	    function Call(variable, args, soak) {
	      this.args = args != null ? args : [];
	      this.soak = soak;
	      this.isNew = false;
	      this.isSuper = variable === 'super';
	      this.variable = this.isSuper ? null : variable;
	      if (variable instanceof Value && variable.isNotCallable()) {
	        variable.error("literal is not a function");
	      }
	    }

	    Call.prototype.children = ['variable', 'args'];

	    Call.prototype.newInstance = function() {
	      var base, _ref2;
	      base = ((_ref2 = this.variable) != null ? _ref2.base : void 0) || this.variable;
	      if (base instanceof Call && !base.isNew) {
	        base.newInstance();
	      } else {
	        this.isNew = true;
	      }
	      return this;
	    };

	    Call.prototype.superReference = function(o) {
	      var accesses, method;
	      method = o.scope.namedMethod();
	      if (method != null ? method.klass : void 0) {
	        accesses = [new Access(new Literal('__super__'))];
	        if (method["static"]) {
	          accesses.push(new Access(new Literal('constructor')));
	        }
	        accesses.push(new Access(new Literal(method.name)));
	        return (new Value(new Literal(method.klass), accesses)).compile(o);
	      } else if (method != null ? method.ctor : void 0) {
	        return "" + method.name + ".__super__.constructor";
	      } else {
	        return this.error('cannot call super outside of an instance method.');
	      }
	    };

	    Call.prototype.superThis = function(o) {
	      var method;
	      method = o.scope.method;
	      return (method && !method.klass && method.context) || "this";
	    };

	    Call.prototype.unfoldSoak = function(o) {
	      var call, ifn, left, list, rite, _i, _len, _ref2, _ref3;
	      if (this.soak) {
	        if (this.variable) {
	          if (ifn = unfoldSoak(o, this, 'variable')) {
	            return ifn;
	          }
	          _ref2 = new Value(this.variable).cacheReference(o), left = _ref2[0], rite = _ref2[1];
	        } else {
	          left = new Literal(this.superReference(o));
	          rite = new Value(left);
	        }
	        rite = new Call(rite, this.args);
	        rite.isNew = this.isNew;
	        left = new Literal("typeof " + (left.compile(o)) + " === \"function\"");
	        return new If(left, new Value(rite), {
	          soak: true
	        });
	      }
	      call = this;
	      list = [];
	      while (true) {
	        if (call.variable instanceof Call) {
	          list.push(call);
	          call = call.variable;
	          continue;
	        }
	        if (!(call.variable instanceof Value)) {
	          break;
	        }
	        list.push(call);
	        if (!((call = call.variable.base) instanceof Call)) {
	          break;
	        }
	      }
	      _ref3 = list.reverse();
	      for (_i = 0, _len = _ref3.length; _i < _len; _i++) {
	        call = _ref3[_i];
	        if (ifn) {
	          if (call.variable instanceof Call) {
	            call.variable = ifn;
	          } else {
	            call.variable.base = ifn;
	          }
	        }
	        ifn = unfoldSoak(o, call, 'variable');
	      }
	      return ifn;
	    };

	    Call.prototype.compileNode = function(o) {
	      var arg, argIndex, compiledArgs, compiledArray, fragments, preface, _i, _len, _ref2, _ref3;
	      if ((_ref2 = this.variable) != null) {
	        _ref2.front = this.front;
	      }
	      compiledArray = Splat.compileSplattedArray(o, this.args, true);
	      if (compiledArray.length) {
	        return this.compileSplat(o, compiledArray);
	      }
	      compiledArgs = [];
	      _ref3 = this.args;
	      for (argIndex = _i = 0, _len = _ref3.length; _i < _len; argIndex = ++_i) {
	        arg = _ref3[argIndex];
	        if (argIndex) {
	          compiledArgs.push(this.makeCode(", "));
	        }
	        compiledArgs.push.apply(compiledArgs, arg.compileToFragments(o, LEVEL_LIST));
	      }
	      fragments = [];
	      if (this.isSuper) {
	        preface = this.superReference(o) + (".call(" + (this.superThis(o)));
	        if (compiledArgs.length) {
	          preface += ", ";
	        }
	        fragments.push(this.makeCode(preface));
	      } else {
	        if (this.isNew) {
	          fragments.push(this.makeCode('new '));
	        }
	        fragments.push.apply(fragments, this.variable.compileToFragments(o, LEVEL_ACCESS));
	        fragments.push(this.makeCode("("));
	      }
	      fragments.push.apply(fragments, compiledArgs);
	      fragments.push(this.makeCode(")"));
	      return fragments;
	    };

	    Call.prototype.compileSplat = function(o, splatArgs) {
	      var answer, base, fun, idt, name, ref;
	      if (this.isSuper) {
	        return [].concat(this.makeCode("" + (this.superReference(o)) + ".apply(" + (this.superThis(o)) + ", "), splatArgs, this.makeCode(")"));
	      }
	      if (this.isNew) {
	        idt = this.tab + TAB;
	        return [].concat(this.makeCode("(function(func, args, ctor) {\n" + idt + "ctor.prototype = func.prototype;\n" + idt + "var child = new ctor, result = func.apply(child, args);\n" + idt + "return Object(result) === result ? result : child;\n" + this.tab + "})("), this.variable.compileToFragments(o, LEVEL_LIST), this.makeCode(", "), splatArgs, this.makeCode(", function(){})"));
	      }
	      answer = [];
	      base = new Value(this.variable);
	      if ((name = base.properties.pop()) && base.isComplex()) {
	        ref = o.scope.freeVariable('ref');
	        answer = answer.concat(this.makeCode("(" + ref + " = "), base.compileToFragments(o, LEVEL_LIST), this.makeCode(")"), name.compileToFragments(o));
	      } else {
	        fun = base.compileToFragments(o, LEVEL_ACCESS);
	        if (SIMPLENUM.test(fragmentsToText(fun))) {
	          fun = this.wrapInBraces(fun);
	        }
	        if (name) {
	          ref = fragmentsToText(fun);
	          fun.push.apply(fun, name.compileToFragments(o));
	        } else {
	          ref = 'null';
	        }
	        answer = answer.concat(fun);
	      }
	      return answer = answer.concat(this.makeCode(".apply(" + ref + ", "), splatArgs, this.makeCode(")"));
	    };

	    return Call;

	  })(Base);

	  exports.Extends = Extends = (function(_super) {
	    __extends(Extends, _super);

	    function Extends(child, parent) {
	      this.child = child;
	      this.parent = parent;
	    }

	    Extends.prototype.children = ['child', 'parent'];

	    Extends.prototype.compileToFragments = function(o) {
	      return new Call(new Value(new Literal(utility('extends'))), [this.child, this.parent]).compileToFragments(o);
	    };

	    return Extends;

	  })(Base);

	  exports.Access = Access = (function(_super) {
	    __extends(Access, _super);

	    function Access(name, tag) {
	      this.name = name;
	      this.name.asKey = true;
	      this.soak = tag === 'soak';
	    }

	    Access.prototype.children = ['name'];

	    Access.prototype.compileToFragments = function(o) {
	      var name;
	      name = this.name.compileToFragments(o);
	      if (IDENTIFIER.test(fragmentsToText(name))) {
	        name.unshift(this.makeCode("."));
	      } else {
	        name.unshift(this.makeCode("["));
	        name.push(this.makeCode("]"));
	      }
	      return name;
	    };

	    Access.prototype.isComplex = NO;

	    return Access;

	  })(Base);

	  exports.Index = Index = (function(_super) {
	    __extends(Index, _super);

	    function Index(index) {
	      this.index = index;
	    }

	    Index.prototype.children = ['index'];

	    Index.prototype.compileToFragments = function(o) {
	      return [].concat(this.makeCode("["), this.index.compileToFragments(o, LEVEL_PAREN), this.makeCode("]"));
	    };

	    Index.prototype.isComplex = function() {
	      return this.index.isComplex();
	    };

	    return Index;

	  })(Base);

	  exports.Range = Range = (function(_super) {
	    __extends(Range, _super);

	    Range.prototype.children = ['from', 'to'];

	    function Range(from, to, tag) {
	      this.from = from;
	      this.to = to;
	      this.exclusive = tag === 'exclusive';
	      this.equals = this.exclusive ? '' : '=';
	    }

	    Range.prototype.compileVariables = function(o) {
	      var step, _ref2, _ref3, _ref4, _ref5;
	      o = merge(o, {
	        top: true
	      });
	      _ref2 = this.cacheToCodeFragments(this.from.cache(o, LEVEL_LIST)), this.fromC = _ref2[0], this.fromVar = _ref2[1];
	      _ref3 = this.cacheToCodeFragments(this.to.cache(o, LEVEL_LIST)), this.toC = _ref3[0], this.toVar = _ref3[1];
	      if (step = del(o, 'step')) {
	        _ref4 = this.cacheToCodeFragments(step.cache(o, LEVEL_LIST)), this.step = _ref4[0], this.stepVar = _ref4[1];
	      }
	      _ref5 = [this.fromVar.match(NUMBER), this.toVar.match(NUMBER)], this.fromNum = _ref5[0], this.toNum = _ref5[1];
	      if (this.stepVar) {
	        return this.stepNum = this.stepVar.match(NUMBER);
	      }
	    };

	    Range.prototype.compileNode = function(o) {
	      var cond, condPart, from, gt, idx, idxName, known, lt, namedIndex, stepPart, to, varPart, _ref2, _ref3;
	      if (!this.fromVar) {
	        this.compileVariables(o);
	      }
	      if (!o.index) {
	        return this.compileArray(o);
	      }
	      known = this.fromNum && this.toNum;
	      idx = del(o, 'index');
	      idxName = del(o, 'name');
	      namedIndex = idxName && idxName !== idx;
	      varPart = "" + idx + " = " + this.fromC;
	      if (this.toC !== this.toVar) {
	        varPart += ", " + this.toC;
	      }
	      if (this.step !== this.stepVar) {
	        varPart += ", " + this.step;
	      }
	      _ref2 = ["" + idx + " <" + this.equals, "" + idx + " >" + this.equals], lt = _ref2[0], gt = _ref2[1];
	      condPart = this.stepNum ? parseNum(this.stepNum[0]) > 0 ? "" + lt + " " + this.toVar : "" + gt + " " + this.toVar : known ? ((_ref3 = [parseNum(this.fromNum[0]), parseNum(this.toNum[0])], from = _ref3[0], to = _ref3[1], _ref3), from <= to ? "" + lt + " " + to : "" + gt + " " + to) : (cond = this.stepVar ? "" + this.stepVar + " > 0" : "" + this.fromVar + " <= " + this.toVar, "" + cond + " ? " + lt + " " + this.toVar + " : " + gt + " " + this.toVar);
	      stepPart = this.stepVar ? "" + idx + " += " + this.stepVar : known ? namedIndex ? from <= to ? "++" + idx : "--" + idx : from <= to ? "" + idx + "++" : "" + idx + "--" : namedIndex ? "" + cond + " ? ++" + idx + " : --" + idx : "" + cond + " ? " + idx + "++ : " + idx + "--";
	      if (namedIndex) {
	        varPart = "" + idxName + " = " + varPart;
	      }
	      if (namedIndex) {
	        stepPart = "" + idxName + " = " + stepPart;
	      }
	      return [this.makeCode("" + varPart + "; " + condPart + "; " + stepPart)];
	    };

	    Range.prototype.compileArray = function(o) {
	      var args, body, cond, hasArgs, i, idt, post, pre, range, result, vars, _i, _ref2, _ref3, _results;
	      if (this.fromNum && this.toNum && Math.abs(this.fromNum - this.toNum) <= 20) {
	        range = (function() {
	          _results = [];
	          for (var _i = _ref2 = +this.fromNum, _ref3 = +this.toNum; _ref2 <= _ref3 ? _i <= _ref3 : _i >= _ref3; _ref2 <= _ref3 ? _i++ : _i--){ _results.push(_i); }
	          return _results;
	        }).apply(this);
	        if (this.exclusive) {
	          range.pop();
	        }
	        return [this.makeCode("[" + (range.join(', ')) + "]")];
	      }
	      idt = this.tab + TAB;
	      i = o.scope.freeVariable('i');
	      result = o.scope.freeVariable('results');
	      pre = "\n" + idt + result + " = [];";
	      if (this.fromNum && this.toNum) {
	        o.index = i;
	        body = fragmentsToText(this.compileNode(o));
	      } else {
	        vars = ("" + i + " = " + this.fromC) + (this.toC !== this.toVar ? ", " + this.toC : '');
	        cond = "" + this.fromVar + " <= " + this.toVar;
	        body = "var " + vars + "; " + cond + " ? " + i + " <" + this.equals + " " + this.toVar + " : " + i + " >" + this.equals + " " + this.toVar + "; " + cond + " ? " + i + "++ : " + i + "--";
	      }
	      post = "{ " + result + ".push(" + i + "); }\n" + idt + "return " + result + ";\n" + o.indent;
	      hasArgs = function(node) {
	        return node != null ? node.contains(isLiteralArguments) : void 0;
	      };
	      if (hasArgs(this.from) || hasArgs(this.to)) {
	        args = ', arguments';
	      }
	      return [this.makeCode("(function() {" + pre + "\n" + idt + "for (" + body + ")" + post + "}).apply(this" + (args != null ? args : '') + ")")];
	    };

	    return Range;

	  })(Base);

	  exports.Slice = Slice = (function(_super) {
	    __extends(Slice, _super);

	    Slice.prototype.children = ['range'];

	    function Slice(range) {
	      this.range = range;
	      Slice.__super__.constructor.call(this);
	    }

	    Slice.prototype.compileNode = function(o) {
	      var compiled, compiledText, from, fromCompiled, to, toStr, _ref2;
	      _ref2 = this.range, to = _ref2.to, from = _ref2.from;
	      fromCompiled = from && from.compileToFragments(o, LEVEL_PAREN) || [this.makeCode('0')];
	      if (to) {
	        compiled = to.compileToFragments(o, LEVEL_PAREN);
	        compiledText = fragmentsToText(compiled);
	        if (!(!this.range.exclusive && +compiledText === -1)) {
	          toStr = ', ' + (this.range.exclusive ? compiledText : SIMPLENUM.test(compiledText) ? "" + (+compiledText + 1) : (compiled = to.compileToFragments(o, LEVEL_ACCESS), "+" + (fragmentsToText(compiled)) + " + 1 || 9e9"));
	        }
	      }
	      return [this.makeCode(".slice(" + (fragmentsToText(fromCompiled)) + (toStr || '') + ")")];
	    };

	    return Slice;

	  })(Base);

	  exports.Obj = Obj = (function(_super) {
	    __extends(Obj, _super);

	    function Obj(props, generated) {
	      this.generated = generated != null ? generated : false;
	      this.objects = this.properties = props || [];
	    }

	    Obj.prototype.children = ['properties'];

	    Obj.prototype.compileNode = function(o) {
	      var answer, i, idt, indent, join, lastNoncom, node, prop, props, _i, _j, _len, _len1;
	      props = this.properties;
	      if (!props.length) {
	        return [this.makeCode(this.front ? '({})' : '{}')];
	      }
	      if (this.generated) {
	        for (_i = 0, _len = props.length; _i < _len; _i++) {
	          node = props[_i];
	          if (node instanceof Value) {
	            node.error('cannot have an implicit value in an implicit object');
	          }
	        }
	      }
	      idt = o.indent += TAB;
	      lastNoncom = this.lastNonComment(this.properties);
	      answer = [];
	      for (i = _j = 0, _len1 = props.length; _j < _len1; i = ++_j) {
	        prop = props[i];
	        join = i === props.length - 1 ? '' : prop === lastNoncom || prop instanceof Comment ? '\n' : ',\n';
	        indent = prop instanceof Comment ? '' : idt;
	        if (prop instanceof Assign && prop.variable instanceof Value && prop.variable.hasProperties()) {
	          prop.variable.error('Invalid object key');
	        }
	        if (prop instanceof Value && prop["this"]) {
	          prop = new Assign(prop.properties[0].name, prop, 'object');
	        }
	        if (!(prop instanceof Comment)) {
	          if (!(prop instanceof Assign)) {
	            prop = new Assign(prop, prop, 'object');
	          }
	          (prop.variable.base || prop.variable).asKey = true;
	        }
	        if (indent) {
	          answer.push(this.makeCode(indent));
	        }
	        answer.push.apply(answer, prop.compileToFragments(o, LEVEL_TOP));
	        if (join) {
	          answer.push(this.makeCode(join));
	        }
	      }
	      answer.unshift(this.makeCode("{" + (props.length && '\n')));
	      answer.push(this.makeCode("" + (props.length && '\n' + this.tab) + "}"));
	      if (this.front) {
	        return this.wrapInBraces(answer);
	      } else {
	        return answer;
	      }
	    };

	    Obj.prototype.assigns = function(name) {
	      var prop, _i, _len, _ref2;
	      _ref2 = this.properties;
	      for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
	        prop = _ref2[_i];
	        if (prop.assigns(name)) {
	          return true;
	        }
	      }
	      return false;
	    };

	    return Obj;

	  })(Base);

	  exports.Arr = Arr = (function(_super) {
	    __extends(Arr, _super);

	    function Arr(objs) {
	      this.objects = objs || [];
	    }

	    Arr.prototype.children = ['objects'];

	    Arr.prototype.compileNode = function(o) {
	      var answer, compiledObjs, fragments, index, obj, _i, _len;
	      if (!this.objects.length) {
	        return [this.makeCode('[]')];
	      }
	      o.indent += TAB;
	      answer = Splat.compileSplattedArray(o, this.objects);
	      if (answer.length) {
	        return answer;
	      }
	      answer = [];
	      compiledObjs = (function() {
	        var _i, _len, _ref2, _results;
	        _ref2 = this.objects;
	        _results = [];
	        for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
	          obj = _ref2[_i];
	          _results.push(obj.compileToFragments(o, LEVEL_LIST));
	        }
	        return _results;
	      }).call(this);
	      for (index = _i = 0, _len = compiledObjs.length; _i < _len; index = ++_i) {
	        fragments = compiledObjs[index];
	        if (index) {
	          answer.push(this.makeCode(", "));
	        }
	        answer.push.apply(answer, fragments);
	      }
	      if (fragmentsToText(answer).indexOf('\n') >= 0) {
	        answer.unshift(this.makeCode("[\n" + o.indent));
	        answer.push(this.makeCode("\n" + this.tab + "]"));
	      } else {
	        answer.unshift(this.makeCode("["));
	        answer.push(this.makeCode("]"));
	      }
	      return answer;
	    };

	    Arr.prototype.assigns = function(name) {
	      var obj, _i, _len, _ref2;
	      _ref2 = this.objects;
	      for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
	        obj = _ref2[_i];
	        if (obj.assigns(name)) {
	          return true;
	        }
	      }
	      return false;
	    };

	    return Arr;

	  })(Base);

	  exports.Class = Class = (function(_super) {
	    __extends(Class, _super);

	    function Class(variable, parent, body) {
	      this.variable = variable;
	      this.parent = parent;
	      this.body = body != null ? body : new Block;
	      this.boundFuncs = [];
	      this.body.classBody = true;
	    }

	    Class.prototype.children = ['variable', 'parent', 'body'];

	    Class.prototype.determineName = function() {
	      var decl, tail;
	      if (!this.variable) {
	        return null;
	      }
	      decl = (tail = last(this.variable.properties)) ? tail instanceof Access && tail.name.value : this.variable.base.value;
	      if (__indexOf.call(STRICT_PROSCRIBED, decl) >= 0) {
	        this.variable.error("class variable name may not be " + decl);
	      }
	      return decl && (decl = IDENTIFIER.test(decl) && decl);
	    };

	    Class.prototype.setContext = function(name) {
	      return this.body.traverseChildren(false, function(node) {
	        if (node.classBody) {
	          return false;
	        }
	        if (node instanceof Literal && node.value === 'this') {
	          return node.value = name;
	        } else if (node instanceof Code) {
	          node.klass = name;
	          if (node.bound) {
	            return node.context = name;
	          }
	        }
	      });
	    };

	    Class.prototype.addBoundFunctions = function(o) {
	      var bvar, lhs, _i, _len, _ref2;
	      _ref2 = this.boundFuncs;
	      for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
	        bvar = _ref2[_i];
	        lhs = (new Value(new Literal("this"), [new Access(bvar)])).compile(o);
	        this.ctor.body.unshift(new Literal("" + lhs + " = " + (utility('bind')) + "(" + lhs + ", this)"));
	      }
	    };

	    Class.prototype.addProperties = function(node, name, o) {
	      var assign, base, exprs, func, props;
	      props = node.base.properties.slice(0);
	      exprs = (function() {
	        var _results;
	        _results = [];
	        while (assign = props.shift()) {
	          if (assign instanceof Assign) {
	            base = assign.variable.base;
	            delete assign.context;
	            func = assign.value;
	            if (base.value === 'constructor') {
	              if (this.ctor) {
	                assign.error('cannot define more than one constructor in a class');
	              }
	              if (func.bound) {
	                assign.error('cannot define a constructor as a bound function');
	              }
	              if (func instanceof Code) {
	                assign = this.ctor = func;
	              } else {
	                this.externalCtor = o.classScope.freeVariable('class');
	                assign = new Assign(new Literal(this.externalCtor), func);
	              }
	            } else {
	              if (assign.variable["this"]) {
	                func["static"] = true;
	              } else {
	                assign.variable = new Value(new Literal(name), [new Access(new Literal('prototype')), new Access(base)]);
	                if (func instanceof Code && func.bound) {
	                  this.boundFuncs.push(base);
	                  func.bound = false;
	                }
	              }
	            }
	          }
	          _results.push(assign);
	        }
	        return _results;
	      }).call(this);
	      return compact(exprs);
	    };

	    Class.prototype.walkBody = function(name, o) {
	      return this.traverseChildren(false, (function(_this) {
	        return function(child) {
	          var cont, exps, i, node, _i, _len, _ref2;
	          cont = true;
	          if (child instanceof Class) {
	            return false;
	          }
	          if (child instanceof Block) {
	            _ref2 = exps = child.expressions;
	            for (i = _i = 0, _len = _ref2.length; _i < _len; i = ++_i) {
	              node = _ref2[i];
	              if (node instanceof Assign && node.variable.looksStatic(name)) {
	                node.value["static"] = true;
	              } else if (node instanceof Value && node.isObject(true)) {
	                cont = false;
	                exps[i] = _this.addProperties(node, name, o);
	              }
	            }
	            child.expressions = exps = flatten(exps);
	          }
	          return cont && !(child instanceof Class);
	        };
	      })(this));
	    };

	    Class.prototype.hoistDirectivePrologue = function() {
	      var expressions, index, node;
	      index = 0;
	      expressions = this.body.expressions;
	      while ((node = expressions[index]) && node instanceof Comment || node instanceof Value && node.isString()) {
	        ++index;
	      }
	      return this.directives = expressions.splice(0, index);
	    };

	    Class.prototype.ensureConstructor = function(name) {
	      if (!this.ctor) {
	        this.ctor = new Code;
	        if (this.externalCtor) {
	          this.ctor.body.push(new Literal("" + this.externalCtor + ".apply(this, arguments)"));
	        } else if (this.parent) {
	          this.ctor.body.push(new Literal("" + name + ".__super__.constructor.apply(this, arguments)"));
	        }
	        this.ctor.body.makeReturn();
	        this.body.expressions.unshift(this.ctor);
	      }
	      this.ctor.ctor = this.ctor.name = name;
	      this.ctor.klass = null;
	      return this.ctor.noReturn = true;
	    };

	    Class.prototype.compileNode = function(o) {
	      var args, argumentsNode, func, jumpNode, klass, lname, name, superClass, _ref2;
	      if (jumpNode = this.body.jumps()) {
	        jumpNode.error('Class bodies cannot contain pure statements');
	      }
	      if (argumentsNode = this.body.contains(isLiteralArguments)) {
	        argumentsNode.error("Class bodies shouldn't reference arguments");
	      }
	      name = this.determineName() || '_Class';
	      if (name.reserved) {
	        name = "_" + name;
	      }
	      lname = new Literal(name);
	      func = new Code([], Block.wrap([this.body]));
	      args = [];
	      o.classScope = func.makeScope(o.scope);
	      this.hoistDirectivePrologue();
	      this.setContext(name);
	      this.walkBody(name, o);
	      this.ensureConstructor(name);
	      this.addBoundFunctions(o);
	      this.body.spaced = true;
	      this.body.expressions.push(lname);
	      if (this.parent) {
	        superClass = new Literal(o.classScope.freeVariable('super', false));
	        this.body.expressions.unshift(new Extends(lname, superClass));
	        func.params.push(new Param(superClass));
	        args.push(this.parent);
	      }
	      (_ref2 = this.body.expressions).unshift.apply(_ref2, this.directives);
	      klass = new Parens(new Call(func, args));
	      if (this.variable) {
	        klass = new Assign(this.variable, klass);
	      }
	      return klass.compileToFragments(o);
	    };

	    return Class;

	  })(Base);

	  exports.Assign = Assign = (function(_super) {
	    __extends(Assign, _super);

	    function Assign(variable, value, context, options) {
	      var forbidden, name, _ref2;
	      this.variable = variable;
	      this.value = value;
	      this.context = context;
	      this.param = options && options.param;
	      this.subpattern = options && options.subpattern;
	      forbidden = (_ref2 = (name = this.variable.unwrapAll().value), __indexOf.call(STRICT_PROSCRIBED, _ref2) >= 0);
	      if (forbidden && this.context !== 'object') {
	        this.variable.error("variable name may not be \"" + name + "\"");
	      }
	    }

	    Assign.prototype.children = ['variable', 'value'];

	    Assign.prototype.isStatement = function(o) {
	      return (o != null ? o.level : void 0) === LEVEL_TOP && (this.context != null) && __indexOf.call(this.context, "?") >= 0;
	    };

	    Assign.prototype.assigns = function(name) {
	      return this[this.context === 'object' ? 'value' : 'variable'].assigns(name);
	    };

	    Assign.prototype.unfoldSoak = function(o) {
	      return unfoldSoak(o, this, 'variable');
	    };

	    Assign.prototype.compileNode = function(o) {
	      var answer, compiledName, isValue, match, name, val, varBase, _ref2, _ref3, _ref4, _ref5;
	      if (isValue = this.variable instanceof Value) {
	        if (this.variable.isArray() || this.variable.isObject()) {
	          return this.compilePatternMatch(o);
	        }
	        if (this.variable.isSplice()) {
	          return this.compileSplice(o);
	        }
	        if ((_ref2 = this.context) === '||=' || _ref2 === '&&=' || _ref2 === '?=') {
	          return this.compileConditional(o);
	        }
	        if ((_ref3 = this.context) === '**=' || _ref3 === '//=' || _ref3 === '%%=') {
	          return this.compileSpecialMath(o);
	        }
	      }
	      compiledName = this.variable.compileToFragments(o, LEVEL_LIST);
	      name = fragmentsToText(compiledName);
	      if (!this.context) {
	        varBase = this.variable.unwrapAll();
	        if (!varBase.isAssignable()) {
	          this.variable.error("\"" + (this.variable.compile(o)) + "\" cannot be assigned");
	        }
	        if (!(typeof varBase.hasProperties === "function" ? varBase.hasProperties() : void 0)) {
	          if (this.param) {
	            o.scope.add(name, 'var');
	          } else {
	            o.scope.find(name);
	          }
	        }
	      }
	      if (this.value instanceof Code && (match = METHOD_DEF.exec(name))) {
	        if (match[2]) {
	          this.value.klass = match[1];
	        }
	        this.value.name = (_ref4 = (_ref5 = match[3]) != null ? _ref5 : match[4]) != null ? _ref4 : match[5];
	      }
	      val = this.value.compileToFragments(o, LEVEL_LIST);
	      if (this.context === 'object') {
	        return compiledName.concat(this.makeCode(": "), val);
	      }
	      answer = compiledName.concat(this.makeCode(" " + (this.context || '=') + " "), val);
	      if (o.level <= LEVEL_LIST) {
	        return answer;
	      } else {
	        return this.wrapInBraces(answer);
	      }
	    };

	    Assign.prototype.compilePatternMatch = function(o) {
	      var acc, assigns, code, expandedIdx, fragments, i, idx, isObject, ivar, name, obj, objects, olen, ref, rest, top, val, value, vvar, vvarText, _i, _len, _ref2, _ref3, _ref4, _ref5, _ref6, _ref7;
	      top = o.level === LEVEL_TOP;
	      value = this.value;
	      objects = this.variable.base.objects;
	      if (!(olen = objects.length)) {
	        code = value.compileToFragments(o);
	        if (o.level >= LEVEL_OP) {
	          return this.wrapInBraces(code);
	        } else {
	          return code;
	        }
	      }
	      isObject = this.variable.isObject();
	      if (top && olen === 1 && !((obj = objects[0]) instanceof Splat)) {
	        if (obj instanceof Assign) {
	          _ref2 = obj, (_ref3 = _ref2.variable, idx = _ref3.base), obj = _ref2.value;
	        } else {
	          idx = isObject ? obj["this"] ? obj.properties[0].name : obj : new Literal(0);
	        }
	        acc = IDENTIFIER.test(idx.unwrap().value || 0);
	        value = new Value(value);
	        value.properties.push(new (acc ? Access : Index)(idx));
	        if (_ref4 = obj.unwrap().value, __indexOf.call(RESERVED, _ref4) >= 0) {
	          obj.error("assignment to a reserved word: " + (obj.compile(o)));
	        }
	        return new Assign(obj, value, null, {
	          param: this.param
	        }).compileToFragments(o, LEVEL_TOP);
	      }
	      vvar = value.compileToFragments(o, LEVEL_LIST);
	      vvarText = fragmentsToText(vvar);
	      assigns = [];
	      expandedIdx = false;
	      if (!IDENTIFIER.test(vvarText) || this.variable.assigns(vvarText)) {
	        assigns.push([this.makeCode("" + (ref = o.scope.freeVariable('ref')) + " = ")].concat(__slice.call(vvar)));
	        vvar = [this.makeCode(ref)];
	        vvarText = ref;
	      }
	      for (i = _i = 0, _len = objects.length; _i < _len; i = ++_i) {
	        obj = objects[i];
	        idx = i;
	        if (isObject) {
	          if (obj instanceof Assign) {
	            _ref5 = obj, (_ref6 = _ref5.variable, idx = _ref6.base), obj = _ref5.value;
	          } else {
	            if (obj.base instanceof Parens) {
	              _ref7 = new Value(obj.unwrapAll()).cacheReference(o), obj = _ref7[0], idx = _ref7[1];
	            } else {
	              idx = obj["this"] ? obj.properties[0].name : obj;
	            }
	          }
	        }
	        if (!expandedIdx && obj instanceof Splat) {
	          name = obj.name.unwrap().value;
	          obj = obj.unwrap();
	          val = "" + olen + " <= " + vvarText + ".length ? " + (utility('slice')) + ".call(" + vvarText + ", " + i;
	          if (rest = olen - i - 1) {
	            ivar = o.scope.freeVariable('i');
	            val += ", " + ivar + " = " + vvarText + ".length - " + rest + ") : (" + ivar + " = " + i + ", [])";
	          } else {
	            val += ") : []";
	          }
	          val = new Literal(val);
	          expandedIdx = "" + ivar + "++";
	        } else if (!expandedIdx && obj instanceof Expansion) {
	          if (rest = olen - i - 1) {
	            if (rest === 1) {
	              expandedIdx = "" + vvarText + ".length - 1";
	            } else {
	              ivar = o.scope.freeVariable('i');
	              val = new Literal("" + ivar + " = " + vvarText + ".length - " + rest);
	              expandedIdx = "" + ivar + "++";
	              assigns.push(val.compileToFragments(o, LEVEL_LIST));
	            }
	          }
	          continue;
	        } else {
	          name = obj.unwrap().value;
	          if (obj instanceof Splat || obj instanceof Expansion) {
	            obj.error("multiple splats/expansions are disallowed in an assignment");
	          }
	          if (typeof idx === 'number') {
	            idx = new Literal(expandedIdx || idx);
	            acc = false;
	          } else {
	            acc = isObject && IDENTIFIER.test(idx.unwrap().value || 0);
	          }
	          val = new Value(new Literal(vvarText), [new (acc ? Access : Index)(idx)]);
	        }
	        if ((name != null) && __indexOf.call(RESERVED, name) >= 0) {
	          obj.error("assignment to a reserved word: " + (obj.compile(o)));
	        }
	        assigns.push(new Assign(obj, val, null, {
	          param: this.param,
	          subpattern: true
	        }).compileToFragments(o, LEVEL_LIST));
	      }
	      if (!(top || this.subpattern)) {
	        assigns.push(vvar);
	      }
	      fragments = this.joinFragmentArrays(assigns, ', ');
	      if (o.level < LEVEL_LIST) {
	        return fragments;
	      } else {
	        return this.wrapInBraces(fragments);
	      }
	    };

	    Assign.prototype.compileConditional = function(o) {
	      var fragments, left, right, _ref2;
	      _ref2 = this.variable.cacheReference(o), left = _ref2[0], right = _ref2[1];
	      if (!left.properties.length && left.base instanceof Literal && left.base.value !== "this" && !o.scope.check(left.base.value)) {
	        this.variable.error("the variable \"" + left.base.value + "\" can't be assigned with " + this.context + " because it has not been declared before");
	      }
	      if (__indexOf.call(this.context, "?") >= 0) {
	        o.isExistentialEquals = true;
	        return new If(new Existence(left), right, {
	          type: 'if'
	        }).addElse(new Assign(right, this.value, '=')).compileToFragments(o);
	      } else {
	        fragments = new Op(this.context.slice(0, -1), left, new Assign(right, this.value, '=')).compileToFragments(o);
	        if (o.level <= LEVEL_LIST) {
	          return fragments;
	        } else {
	          return this.wrapInBraces(fragments);
	        }
	      }
	    };

	    Assign.prototype.compileSpecialMath = function(o) {
	      var left, right, _ref2;
	      _ref2 = this.variable.cacheReference(o), left = _ref2[0], right = _ref2[1];
	      return new Assign(left, new Op(this.context.slice(0, -1), right, this.value)).compileToFragments(o);
	    };

	    Assign.prototype.compileSplice = function(o) {
	      var answer, exclusive, from, fromDecl, fromRef, name, to, valDef, valRef, _ref2, _ref3, _ref4;
	      _ref2 = this.variable.properties.pop().range, from = _ref2.from, to = _ref2.to, exclusive = _ref2.exclusive;
	      name = this.variable.compile(o);
	      if (from) {
	        _ref3 = this.cacheToCodeFragments(from.cache(o, LEVEL_OP)), fromDecl = _ref3[0], fromRef = _ref3[1];
	      } else {
	        fromDecl = fromRef = '0';
	      }
	      if (to) {
	        if (from instanceof Value && from.isSimpleNumber() && to instanceof Value && to.isSimpleNumber()) {
	          to = to.compile(o) - fromRef;
	          if (!exclusive) {
	            to += 1;
	          }
	        } else {
	          to = to.compile(o, LEVEL_ACCESS) + ' - ' + fromRef;
	          if (!exclusive) {
	            to += ' + 1';
	          }
	        }
	      } else {
	        to = "9e9";
	      }
	      _ref4 = this.value.cache(o, LEVEL_LIST), valDef = _ref4[0], valRef = _ref4[1];
	      answer = [].concat(this.makeCode("[].splice.apply(" + name + ", [" + fromDecl + ", " + to + "].concat("), valDef, this.makeCode(")), "), valRef);
	      if (o.level > LEVEL_TOP) {
	        return this.wrapInBraces(answer);
	      } else {
	        return answer;
	      }
	    };

	    return Assign;

	  })(Base);

	  exports.Code = Code = (function(_super) {
	    __extends(Code, _super);

	    function Code(params, body, tag) {
	      this.params = params || [];
	      this.body = body || new Block;
	      this.bound = tag === 'boundfunc';
	    }

	    Code.prototype.children = ['params', 'body'];

	    Code.prototype.isStatement = function() {
	      return !!this.ctor;
	    };

	    Code.prototype.jumps = NO;

	    Code.prototype.makeScope = function(parentScope) {
	      return new Scope(parentScope, this.body, this);
	    };

	    Code.prototype.compileNode = function(o) {
	      var answer, boundfunc, code, exprs, i, lit, p, param, params, ref, splats, uniqs, val, wasEmpty, wrapper, _i, _j, _k, _l, _len, _len1, _len2, _len3, _len4, _len5, _m, _n, _ref2, _ref3, _ref4, _ref5, _ref6, _ref7;
	      if (this.bound && ((_ref2 = o.scope.method) != null ? _ref2.bound : void 0)) {
	        this.context = o.scope.method.context;
	      }
	      if (this.bound && !this.context) {
	        this.context = '_this';
	        wrapper = new Code([new Param(new Literal(this.context))], new Block([this]));
	        boundfunc = new Call(wrapper, [new Literal('this')]);
	        boundfunc.updateLocationDataIfMissing(this.locationData);
	        return boundfunc.compileNode(o);
	      }
	      o.scope = del(o, 'classScope') || this.makeScope(o.scope);
	      o.scope.shared = del(o, 'sharedScope');
	      o.indent += TAB;
	      delete o.bare;
	      delete o.isExistentialEquals;
	      params = [];
	      exprs = [];
	      _ref3 = this.params;
	      for (_i = 0, _len = _ref3.length; _i < _len; _i++) {
	        param = _ref3[_i];
	        if (!(param instanceof Expansion)) {
	          o.scope.parameter(param.asReference(o));
	        }
	      }
	      _ref4 = this.params;
	      for (_j = 0, _len1 = _ref4.length; _j < _len1; _j++) {
	        param = _ref4[_j];
	        if (!(param.splat || param instanceof Expansion)) {
	          continue;
	        }
	        _ref5 = this.params;
	        for (_k = 0, _len2 = _ref5.length; _k < _len2; _k++) {
	          p = _ref5[_k].name;
	          if (!(!(param instanceof Expansion))) {
	            continue;
	          }
	          if (p["this"]) {
	            p = p.properties[0].name;
	          }
	          if (p.value) {
	            o.scope.add(p.value, 'var', true);
	          }
	        }
	        splats = new Assign(new Value(new Arr((function() {
	          var _l, _len3, _ref6, _results;
	          _ref6 = this.params;
	          _results = [];
	          for (_l = 0, _len3 = _ref6.length; _l < _len3; _l++) {
	            p = _ref6[_l];
	            _results.push(p.asReference(o));
	          }
	          return _results;
	        }).call(this))), new Value(new Literal('arguments')));
	        break;
	      }
	      _ref6 = this.params;
	      for (_l = 0, _len3 = _ref6.length; _l < _len3; _l++) {
	        param = _ref6[_l];
	        if (param.isComplex()) {
	          val = ref = param.asReference(o);
	          if (param.value) {
	            val = new Op('?', ref, param.value);
	          }
	          exprs.push(new Assign(new Value(param.name), val, '=', {
	            param: true
	          }));
	        } else {
	          ref = param;
	          if (param.value) {
	            lit = new Literal(ref.name.value + ' == null');
	            val = new Assign(new Value(param.name), param.value, '=');
	            exprs.push(new If(lit, val));
	          }
	        }
	        if (!splats) {
	          params.push(ref);
	        }
	      }
	      wasEmpty = this.body.isEmpty();
	      if (splats) {
	        exprs.unshift(splats);
	      }
	      if (exprs.length) {
	        (_ref7 = this.body.expressions).unshift.apply(_ref7, exprs);
	      }
	      for (i = _m = 0, _len4 = params.length; _m < _len4; i = ++_m) {
	        p = params[i];
	        params[i] = p.compileToFragments(o);
	        o.scope.parameter(fragmentsToText(params[i]));
	      }
	      uniqs = [];
	      this.eachParamName(function(name, node) {
	        if (__indexOf.call(uniqs, name) >= 0) {
	          node.error("multiple parameters named '" + name + "'");
	        }
	        return uniqs.push(name);
	      });
	      if (!(wasEmpty || this.noReturn)) {
	        this.body.makeReturn();
	      }
	      code = 'function';
	      if (this.ctor) {
	        code += ' ' + this.name;
	      }
	      code += '(';
	      answer = [this.makeCode(code)];
	      for (i = _n = 0, _len5 = params.length; _n < _len5; i = ++_n) {
	        p = params[i];
	        if (i) {
	          answer.push(this.makeCode(", "));
	        }
	        answer.push.apply(answer, p);
	      }
	      answer.push(this.makeCode(') {'));
	      if (!this.body.isEmpty()) {
	        answer = answer.concat(this.makeCode("\n"), this.body.compileWithDeclarations(o), this.makeCode("\n" + this.tab));
	      }
	      answer.push(this.makeCode('}'));
	      if (this.ctor) {
	        return [this.makeCode(this.tab)].concat(__slice.call(answer));
	      }
	      if (this.front || (o.level >= LEVEL_ACCESS)) {
	        return this.wrapInBraces(answer);
	      } else {
	        return answer;
	      }
	    };

	    Code.prototype.eachParamName = function(iterator) {
	      var param, _i, _len, _ref2, _results;
	      _ref2 = this.params;
	      _results = [];
	      for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
	        param = _ref2[_i];
	        _results.push(param.eachName(iterator));
	      }
	      return _results;
	    };

	    Code.prototype.traverseChildren = function(crossScope, func) {
	      if (crossScope) {
	        return Code.__super__.traverseChildren.call(this, crossScope, func);
	      }
	    };

	    return Code;

	  })(Base);

	  exports.Param = Param = (function(_super) {
	    __extends(Param, _super);

	    function Param(name, value, splat) {
	      var _ref2;
	      this.name = name;
	      this.value = value;
	      this.splat = splat;
	      if (_ref2 = (name = this.name.unwrapAll().value), __indexOf.call(STRICT_PROSCRIBED, _ref2) >= 0) {
	        this.name.error("parameter name \"" + name + "\" is not allowed");
	      }
	    }

	    Param.prototype.children = ['name', 'value'];

	    Param.prototype.compileToFragments = function(o) {
	      return this.name.compileToFragments(o, LEVEL_LIST);
	    };

	    Param.prototype.asReference = function(o) {
	      var node;
	      if (this.reference) {
	        return this.reference;
	      }
	      node = this.name;
	      if (node["this"]) {
	        node = node.properties[0].name;
	        if (node.value.reserved) {
	          node = new Literal(o.scope.freeVariable(node.value));
	        }
	      } else if (node.isComplex()) {
	        node = new Literal(o.scope.freeVariable('arg'));
	      }
	      node = new Value(node);
	      if (this.splat) {
	        node = new Splat(node);
	      }
	      node.updateLocationDataIfMissing(this.locationData);
	      return this.reference = node;
	    };

	    Param.prototype.isComplex = function() {
	      return this.name.isComplex();
	    };

	    Param.prototype.eachName = function(iterator, name) {
	      var atParam, node, obj, _i, _len, _ref2;
	      if (name == null) {
	        name = this.name;
	      }
	      atParam = function(obj) {
	        var node;
	        node = obj.properties[0].name;
	        if (!node.value.reserved) {
	          return iterator(node.value, node);
	        }
	      };
	      if (name instanceof Literal) {
	        return iterator(name.value, name);
	      }
	      if (name instanceof Value) {
	        return atParam(name);
	      }
	      _ref2 = name.objects;
	      for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
	        obj = _ref2[_i];
	        if (obj instanceof Assign) {
	          this.eachName(iterator, obj.value.unwrap());
	        } else if (obj instanceof Splat) {
	          node = obj.name.unwrap();
	          iterator(node.value, node);
	        } else if (obj instanceof Value) {
	          if (obj.isArray() || obj.isObject()) {
	            this.eachName(iterator, obj.base);
	          } else if (obj["this"]) {
	            atParam(obj);
	          } else {
	            iterator(obj.base.value, obj.base);
	          }
	        } else if (!(obj instanceof Expansion)) {
	          obj.error("illegal parameter " + (obj.compile()));
	        }
	      }
	    };

	    return Param;

	  })(Base);

	  exports.Splat = Splat = (function(_super) {
	    __extends(Splat, _super);

	    Splat.prototype.children = ['name'];

	    Splat.prototype.isAssignable = YES;

	    function Splat(name) {
	      this.name = name.compile ? name : new Literal(name);
	    }

	    Splat.prototype.assigns = function(name) {
	      return this.name.assigns(name);
	    };

	    Splat.prototype.compileToFragments = function(o) {
	      return this.name.compileToFragments(o);
	    };

	    Splat.prototype.unwrap = function() {
	      return this.name;
	    };

	    Splat.compileSplattedArray = function(o, list, apply) {
	      var args, base, compiledNode, concatPart, fragments, i, index, node, _i, _len;
	      index = -1;
	      while ((node = list[++index]) && !(node instanceof Splat)) {
	        continue;
	      }
	      if (index >= list.length) {
	        return [];
	      }
	      if (list.length === 1) {
	        node = list[0];
	        fragments = node.compileToFragments(o, LEVEL_LIST);
	        if (apply) {
	          return fragments;
	        }
	        return [].concat(node.makeCode("" + (utility('slice')) + ".call("), fragments, node.makeCode(")"));
	      }
	      args = list.slice(index);
	      for (i = _i = 0, _len = args.length; _i < _len; i = ++_i) {
	        node = args[i];
	        compiledNode = node.compileToFragments(o, LEVEL_LIST);
	        args[i] = node instanceof Splat ? [].concat(node.makeCode("" + (utility('slice')) + ".call("), compiledNode, node.makeCode(")")) : [].concat(node.makeCode("["), compiledNode, node.makeCode("]"));
	      }
	      if (index === 0) {
	        node = list[0];
	        concatPart = node.joinFragmentArrays(args.slice(1), ', ');
	        return args[0].concat(node.makeCode(".concat("), concatPart, node.makeCode(")"));
	      }
	      base = (function() {
	        var _j, _len1, _ref2, _results;
	        _ref2 = list.slice(0, index);
	        _results = [];
	        for (_j = 0, _len1 = _ref2.length; _j < _len1; _j++) {
	          node = _ref2[_j];
	          _results.push(node.compileToFragments(o, LEVEL_LIST));
	        }
	        return _results;
	      })();
	      base = list[0].joinFragmentArrays(base, ', ');
	      concatPart = list[index].joinFragmentArrays(args, ', ');
	      return [].concat(list[0].makeCode("["), base, list[index].makeCode("].concat("), concatPart, (last(list)).makeCode(")"));
	    };

	    return Splat;

	  })(Base);

	  exports.Expansion = Expansion = (function(_super) {
	    __extends(Expansion, _super);

	    function Expansion() {
	      return Expansion.__super__.constructor.apply(this, arguments);
	    }

	    Expansion.prototype.isComplex = NO;

	    Expansion.prototype.compileNode = function(o) {
	      return this.error('Expansion must be used inside a destructuring assignment or parameter list');
	    };

	    Expansion.prototype.asReference = function(o) {
	      return this;
	    };

	    Expansion.prototype.eachName = function(iterator) {};

	    return Expansion;

	  })(Base);

	  exports.While = While = (function(_super) {
	    __extends(While, _super);

	    function While(condition, options) {
	      this.condition = (options != null ? options.invert : void 0) ? condition.invert() : condition;
	      this.guard = options != null ? options.guard : void 0;
	    }

	    While.prototype.children = ['condition', 'guard', 'body'];

	    While.prototype.isStatement = YES;

	    While.prototype.makeReturn = function(res) {
	      if (res) {
	        return While.__super__.makeReturn.apply(this, arguments);
	      } else {
	        this.returns = !this.jumps({
	          loop: true
	        });
	        return this;
	      }
	    };

	    While.prototype.addBody = function(body) {
	      this.body = body;
	      return this;
	    };

	    While.prototype.jumps = function() {
	      var expressions, jumpNode, node, _i, _len;
	      expressions = this.body.expressions;
	      if (!expressions.length) {
	        return false;
	      }
	      for (_i = 0, _len = expressions.length; _i < _len; _i++) {
	        node = expressions[_i];
	        if (jumpNode = node.jumps({
	          loop: true
	        })) {
	          return jumpNode;
	        }
	      }
	      return false;
	    };

	    While.prototype.compileNode = function(o) {
	      var answer, body, rvar, set;
	      o.indent += TAB;
	      set = '';
	      body = this.body;
	      if (body.isEmpty()) {
	        body = this.makeCode('');
	      } else {
	        if (this.returns) {
	          body.makeReturn(rvar = o.scope.freeVariable('results'));
	          set = "" + this.tab + rvar + " = [];\n";
	        }
	        if (this.guard) {
	          if (body.expressions.length > 1) {
	            body.expressions.unshift(new If((new Parens(this.guard)).invert(), new Literal("continue")));
	          } else {
	            if (this.guard) {
	              body = Block.wrap([new If(this.guard, body)]);
	            }
	          }
	        }
	        body = [].concat(this.makeCode("\n"), body.compileToFragments(o, LEVEL_TOP), this.makeCode("\n" + this.tab));
	      }
	      answer = [].concat(this.makeCode(set + this.tab + "while ("), this.condition.compileToFragments(o, LEVEL_PAREN), this.makeCode(") {"), body, this.makeCode("}"));
	      if (this.returns) {
	        answer.push(this.makeCode("\n" + this.tab + "return " + rvar + ";"));
	      }
	      return answer;
	    };

	    return While;

	  })(Base);

	  exports.Op = Op = (function(_super) {
	    var CONVERSIONS, INVERSIONS;

	    __extends(Op, _super);

	    function Op(op, first, second, flip) {
	      if (op === 'in') {
	        return new In(first, second);
	      }
	      if (op === 'do') {
	        return this.generateDo(first);
	      }
	      if (op === 'new') {
	        if (first instanceof Call && !first["do"] && !first.isNew) {
	          return first.newInstance();
	        }
	        if (first instanceof Code && first.bound || first["do"]) {
	          first = new Parens(first);
	        }
	      }
	      this.operator = CONVERSIONS[op] || op;
	      this.first = first;
	      this.second = second;
	      this.flip = !!flip;
	      return this;
	    }

	    CONVERSIONS = {
	      '==': '===',
	      '!=': '!==',
	      'of': 'in'
	    };

	    INVERSIONS = {
	      '!==': '===',
	      '===': '!=='
	    };

	    Op.prototype.children = ['first', 'second'];

	    Op.prototype.isSimpleNumber = NO;

	    Op.prototype.isUnary = function() {
	      return !this.second;
	    };

	    Op.prototype.isComplex = function() {
	      var _ref2;
	      return !(this.isUnary() && ((_ref2 = this.operator) === '+' || _ref2 === '-')) || this.first.isComplex();
	    };

	    Op.prototype.isChainable = function() {
	      var _ref2;
	      return (_ref2 = this.operator) === '<' || _ref2 === '>' || _ref2 === '>=' || _ref2 === '<=' || _ref2 === '===' || _ref2 === '!==';
	    };

	    Op.prototype.invert = function() {
	      var allInvertable, curr, fst, op, _ref2;
	      if (this.isChainable() && this.first.isChainable()) {
	        allInvertable = true;
	        curr = this;
	        while (curr && curr.operator) {
	          allInvertable && (allInvertable = curr.operator in INVERSIONS);
	          curr = curr.first;
	        }
	        if (!allInvertable) {
	          return new Parens(this).invert();
	        }
	        curr = this;
	        while (curr && curr.operator) {
	          curr.invert = !curr.invert;
	          curr.operator = INVERSIONS[curr.operator];
	          curr = curr.first;
	        }
	        return this;
	      } else if (op = INVERSIONS[this.operator]) {
	        this.operator = op;
	        if (this.first.unwrap() instanceof Op) {
	          this.first.invert();
	        }
	        return this;
	      } else if (this.second) {
	        return new Parens(this).invert();
	      } else if (this.operator === '!' && (fst = this.first.unwrap()) instanceof Op && ((_ref2 = fst.operator) === '!' || _ref2 === 'in' || _ref2 === 'instanceof')) {
	        return fst;
	      } else {
	        return new Op('!', this);
	      }
	    };

	    Op.prototype.unfoldSoak = function(o) {
	      var _ref2;
	      return ((_ref2 = this.operator) === '++' || _ref2 === '--' || _ref2 === 'delete') && unfoldSoak(o, this, 'first');
	    };

	    Op.prototype.generateDo = function(exp) {
	      var call, func, param, passedParams, ref, _i, _len, _ref2;
	      passedParams = [];
	      func = exp instanceof Assign && (ref = exp.value.unwrap()) instanceof Code ? ref : exp;
	      _ref2 = func.params || [];
	      for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
	        param = _ref2[_i];
	        if (param.value) {
	          passedParams.push(param.value);
	          delete param.value;
	        } else {
	          passedParams.push(param);
	        }
	      }
	      call = new Call(exp, passedParams);
	      call["do"] = true;
	      return call;
	    };

	    Op.prototype.compileNode = function(o) {
	      var answer, isChain, lhs, rhs, _ref2, _ref3;
	      isChain = this.isChainable() && this.first.isChainable();
	      if (!isChain) {
	        this.first.front = this.front;
	      }
	      if (this.operator === 'delete' && o.scope.check(this.first.unwrapAll().value)) {
	        this.error('delete operand may not be argument or var');
	      }
	      if (((_ref2 = this.operator) === '--' || _ref2 === '++') && (_ref3 = this.first.unwrapAll().value, __indexOf.call(STRICT_PROSCRIBED, _ref3) >= 0)) {
	        this.error("cannot increment/decrement \"" + (this.first.unwrapAll().value) + "\"");
	      }
	      if (this.isUnary()) {
	        return this.compileUnary(o);
	      }
	      if (isChain) {
	        return this.compileChain(o);
	      }
	      switch (this.operator) {
	        case '?':
	          return this.compileExistence(o);
	        case '**':
	          return this.compilePower(o);
	        case '//':
	          return this.compileFloorDivision(o);
	        case '%%':
	          return this.compileModulo(o);
	        default:
	          lhs = this.first.compileToFragments(o, LEVEL_OP);
	          rhs = this.second.compileToFragments(o, LEVEL_OP);
	          answer = [].concat(lhs, this.makeCode(" " + this.operator + " "), rhs);
	          if (o.level <= LEVEL_OP) {
	            return answer;
	          } else {
	            return this.wrapInBraces(answer);
	          }
	      }
	    };

	    Op.prototype.compileChain = function(o) {
	      var fragments, fst, shared, _ref2;
	      _ref2 = this.first.second.cache(o), this.first.second = _ref2[0], shared = _ref2[1];
	      fst = this.first.compileToFragments(o, LEVEL_OP);
	      fragments = fst.concat(this.makeCode(" " + (this.invert ? '&&' : '||') + " "), shared.compileToFragments(o), this.makeCode(" " + this.operator + " "), this.second.compileToFragments(o, LEVEL_OP));
	      return this.wrapInBraces(fragments);
	    };

	    Op.prototype.compileExistence = function(o) {
	      var fst, ref;
	      if (this.first.isComplex()) {
	        ref = new Literal(o.scope.freeVariable('ref'));
	        fst = new Parens(new Assign(ref, this.first));
	      } else {
	        fst = this.first;
	        ref = fst;
	      }
	      return new If(new Existence(fst), ref, {
	        type: 'if'
	      }).addElse(this.second).compileToFragments(o);
	    };

	    Op.prototype.compileUnary = function(o) {
	      var op, parts, plusMinus;
	      parts = [];
	      op = this.operator;
	      parts.push([this.makeCode(op)]);
	      if (op === '!' && this.first instanceof Existence) {
	        this.first.negated = !this.first.negated;
	        return this.first.compileToFragments(o);
	      }
	      if (o.level >= LEVEL_ACCESS) {
	        return (new Parens(this)).compileToFragments(o);
	      }
	      plusMinus = op === '+' || op === '-';
	      if ((op === 'new' || op === 'typeof' || op === 'delete') || plusMinus && this.first instanceof Op && this.first.operator === op) {
	        parts.push([this.makeCode(' ')]);
	      }
	      if ((plusMinus && this.first instanceof Op) || (op === 'new' && this.first.isStatement(o))) {
	        this.first = new Parens(this.first);
	      }
	      parts.push(this.first.compileToFragments(o, LEVEL_OP));
	      if (this.flip) {
	        parts.reverse();
	      }
	      return this.joinFragmentArrays(parts, '');
	    };

	    Op.prototype.compilePower = function(o) {
	      var pow;
	      pow = new Value(new Literal('Math'), [new Access(new Literal('pow'))]);
	      return new Call(pow, [this.first, this.second]).compileToFragments(o);
	    };

	    Op.prototype.compileFloorDivision = function(o) {
	      var div, floor;
	      floor = new Value(new Literal('Math'), [new Access(new Literal('floor'))]);
	      div = new Op('/', this.first, this.second);
	      return new Call(floor, [div]).compileToFragments(o);
	    };

	    Op.prototype.compileModulo = function(o) {
	      var mod;
	      mod = new Value(new Literal(utility('modulo')));
	      return new Call(mod, [this.first, this.second]).compileToFragments(o);
	    };

	    Op.prototype.toString = function(idt) {
	      return Op.__super__.toString.call(this, idt, this.constructor.name + ' ' + this.operator);
	    };

	    return Op;

	  })(Base);

	  exports.In = In = (function(_super) {
	    __extends(In, _super);

	    function In(object, array) {
	      this.object = object;
	      this.array = array;
	    }

	    In.prototype.children = ['object', 'array'];

	    In.prototype.invert = NEGATE;

	    In.prototype.compileNode = function(o) {
	      var hasSplat, obj, _i, _len, _ref2;
	      if (this.array instanceof Value && this.array.isArray() && this.array.base.objects.length) {
	        _ref2 = this.array.base.objects;
	        for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
	          obj = _ref2[_i];
	          if (!(obj instanceof Splat)) {
	            continue;
	          }
	          hasSplat = true;
	          break;
	        }
	        if (!hasSplat) {
	          return this.compileOrTest(o);
	        }
	      }
	      return this.compileLoopTest(o);
	    };

	    In.prototype.compileOrTest = function(o) {
	      var cmp, cnj, i, item, ref, sub, tests, _i, _len, _ref2, _ref3, _ref4;
	      _ref2 = this.object.cache(o, LEVEL_OP), sub = _ref2[0], ref = _ref2[1];
	      _ref3 = this.negated ? [' !== ', ' && '] : [' === ', ' || '], cmp = _ref3[0], cnj = _ref3[1];
	      tests = [];
	      _ref4 = this.array.base.objects;
	      for (i = _i = 0, _len = _ref4.length; _i < _len; i = ++_i) {
	        item = _ref4[i];
	        if (i) {
	          tests.push(this.makeCode(cnj));
	        }
	        tests = tests.concat((i ? ref : sub), this.makeCode(cmp), item.compileToFragments(o, LEVEL_ACCESS));
	      }
	      if (o.level < LEVEL_OP) {
	        return tests;
	      } else {
	        return this.wrapInBraces(tests);
	      }
	    };

	    In.prototype.compileLoopTest = function(o) {
	      var fragments, ref, sub, _ref2;
	      _ref2 = this.object.cache(o, LEVEL_LIST), sub = _ref2[0], ref = _ref2[1];
	      fragments = [].concat(this.makeCode(utility('indexOf') + ".call("), this.array.compileToFragments(o, LEVEL_LIST), this.makeCode(", "), ref, this.makeCode(") " + (this.negated ? '< 0' : '>= 0')));
	      if (fragmentsToText(sub) === fragmentsToText(ref)) {
	        return fragments;
	      }
	      fragments = sub.concat(this.makeCode(', '), fragments);
	      if (o.level < LEVEL_LIST) {
	        return fragments;
	      } else {
	        return this.wrapInBraces(fragments);
	      }
	    };

	    In.prototype.toString = function(idt) {
	      return In.__super__.toString.call(this, idt, this.constructor.name + (this.negated ? '!' : ''));
	    };

	    return In;

	  })(Base);

	  exports.Try = Try = (function(_super) {
	    __extends(Try, _super);

	    function Try(attempt, errorVariable, recovery, ensure) {
	      this.attempt = attempt;
	      this.errorVariable = errorVariable;
	      this.recovery = recovery;
	      this.ensure = ensure;
	    }

	    Try.prototype.children = ['attempt', 'recovery', 'ensure'];

	    Try.prototype.isStatement = YES;

	    Try.prototype.jumps = function(o) {
	      var _ref2;
	      return this.attempt.jumps(o) || ((_ref2 = this.recovery) != null ? _ref2.jumps(o) : void 0);
	    };

	    Try.prototype.makeReturn = function(res) {
	      if (this.attempt) {
	        this.attempt = this.attempt.makeReturn(res);
	      }
	      if (this.recovery) {
	        this.recovery = this.recovery.makeReturn(res);
	      }
	      return this;
	    };

	    Try.prototype.compileNode = function(o) {
	      var catchPart, ensurePart, placeholder, tryPart;
	      o.indent += TAB;
	      tryPart = this.attempt.compileToFragments(o, LEVEL_TOP);
	      catchPart = this.recovery ? (placeholder = new Literal('_error'), this.errorVariable ? this.recovery.unshift(new Assign(this.errorVariable, placeholder)) : void 0, [].concat(this.makeCode(" catch ("), placeholder.compileToFragments(o), this.makeCode(") {\n"), this.recovery.compileToFragments(o, LEVEL_TOP), this.makeCode("\n" + this.tab + "}"))) : !(this.ensure || this.recovery) ? [this.makeCode(' catch (_error) {}')] : [];
	      ensurePart = this.ensure ? [].concat(this.makeCode(" finally {\n"), this.ensure.compileToFragments(o, LEVEL_TOP), this.makeCode("\n" + this.tab + "}")) : [];
	      return [].concat(this.makeCode("" + this.tab + "try {\n"), tryPart, this.makeCode("\n" + this.tab + "}"), catchPart, ensurePart);
	    };

	    return Try;

	  })(Base);

	  exports.Throw = Throw = (function(_super) {
	    __extends(Throw, _super);

	    function Throw(expression) {
	      this.expression = expression;
	    }

	    Throw.prototype.children = ['expression'];

	    Throw.prototype.isStatement = YES;

	    Throw.prototype.jumps = NO;

	    Throw.prototype.makeReturn = THIS;

	    Throw.prototype.compileNode = function(o) {
	      return [].concat(this.makeCode(this.tab + "throw "), this.expression.compileToFragments(o), this.makeCode(";"));
	    };

	    return Throw;

	  })(Base);

	  exports.Existence = Existence = (function(_super) {
	    __extends(Existence, _super);

	    function Existence(expression) {
	      this.expression = expression;
	    }

	    Existence.prototype.children = ['expression'];

	    Existence.prototype.invert = NEGATE;

	    Existence.prototype.compileNode = function(o) {
	      var cmp, cnj, code, _ref2;
	      this.expression.front = this.front;
	      code = this.expression.compile(o, LEVEL_OP);
	      if (IDENTIFIER.test(code) && !o.scope.check(code)) {
	        _ref2 = this.negated ? ['===', '||'] : ['!==', '&&'], cmp = _ref2[0], cnj = _ref2[1];
	        code = "typeof " + code + " " + cmp + " \"undefined\" " + cnj + " " + code + " " + cmp + " null";
	      } else {
	        code = "" + code + " " + (this.negated ? '==' : '!=') + " null";
	      }
	      return [this.makeCode(o.level <= LEVEL_COND ? code : "(" + code + ")")];
	    };

	    return Existence;

	  })(Base);

	  exports.Parens = Parens = (function(_super) {
	    __extends(Parens, _super);

	    function Parens(body) {
	      this.body = body;
	    }

	    Parens.prototype.children = ['body'];

	    Parens.prototype.unwrap = function() {
	      return this.body;
	    };

	    Parens.prototype.isComplex = function() {
	      return this.body.isComplex();
	    };

	    Parens.prototype.compileNode = function(o) {
	      var bare, expr, fragments;
	      expr = this.body.unwrap();
	      if (expr instanceof Value && expr.isAtomic()) {
	        expr.front = this.front;
	        return expr.compileToFragments(o);
	      }
	      fragments = expr.compileToFragments(o, LEVEL_PAREN);
	      bare = o.level < LEVEL_OP && (expr instanceof Op || expr instanceof Call || (expr instanceof For && expr.returns));
	      if (bare) {
	        return fragments;
	      } else {
	        return this.wrapInBraces(fragments);
	      }
	    };

	    return Parens;

	  })(Base);

	  exports.For = For = (function(_super) {
	    __extends(For, _super);

	    function For(body, source) {
	      var _ref2;
	      this.source = source.source, this.guard = source.guard, this.step = source.step, this.name = source.name, this.index = source.index;
	      this.body = Block.wrap([body]);
	      this.own = !!source.own;
	      this.object = !!source.object;
	      if (this.object) {
	        _ref2 = [this.index, this.name], this.name = _ref2[0], this.index = _ref2[1];
	      }
	      if (this.index instanceof Value) {
	        this.index.error('index cannot be a pattern matching expression');
	      }
	      this.range = this.source instanceof Value && this.source.base instanceof Range && !this.source.properties.length;
	      this.pattern = this.name instanceof Value;
	      if (this.range && this.index) {
	        this.index.error('indexes do not apply to range loops');
	      }
	      if (this.range && this.pattern) {
	        this.name.error('cannot pattern match over range loops');
	      }
	      if (this.own && !this.object) {
	        this.name.error('cannot use own with for-in');
	      }
	      this.returns = false;
	    }

	    For.prototype.children = ['body', 'source', 'guard', 'step'];

	    For.prototype.compileNode = function(o) {
	      var body, bodyFragments, compare, compareDown, declare, declareDown, defPart, defPartFragments, down, forPartFragments, guardPart, idt1, increment, index, ivar, kvar, kvarAssign, lastJumps, lvar, name, namePart, ref, resultPart, returnResult, rvar, scope, source, step, stepNum, stepVar, svar, varPart, _ref2, _ref3;
	      body = Block.wrap([this.body]);
	      lastJumps = (_ref2 = last(body.expressions)) != null ? _ref2.jumps() : void 0;
	      if (lastJumps && lastJumps instanceof Return) {
	        this.returns = false;
	      }
	      source = this.range ? this.source.base : this.source;
	      scope = o.scope;
	      if (!this.pattern) {
	        name = this.name && (this.name.compile(o, LEVEL_LIST));
	      }
	      index = this.index && (this.index.compile(o, LEVEL_LIST));
	      if (name && !this.pattern) {
	        scope.find(name);
	      }
	      if (index) {
	        scope.find(index);
	      }
	      if (this.returns) {
	        rvar = scope.freeVariable('results');
	      }
	      ivar = (this.object && index) || scope.freeVariable('i');
	      kvar = (this.range && name) || index || ivar;
	      kvarAssign = kvar !== ivar ? "" + kvar + " = " : "";
	      if (this.step && !this.range) {
	        _ref3 = this.cacheToCodeFragments(this.step.cache(o, LEVEL_LIST)), step = _ref3[0], stepVar = _ref3[1];
	        stepNum = stepVar.match(NUMBER);
	      }
	      if (this.pattern) {
	        name = ivar;
	      }
	      varPart = '';
	      guardPart = '';
	      defPart = '';
	      idt1 = this.tab + TAB;
	      if (this.range) {
	        forPartFragments = source.compileToFragments(merge(o, {
	          index: ivar,
	          name: name,
	          step: this.step
	        }));
	      } else {
	        svar = this.source.compile(o, LEVEL_LIST);
	        if ((name || this.own) && !IDENTIFIER.test(svar)) {
	          defPart += "" + this.tab + (ref = scope.freeVariable('ref')) + " = " + svar + ";\n";
	          svar = ref;
	        }
	        if (name && !this.pattern) {
	          namePart = "" + name + " = " + svar + "[" + kvar + "]";
	        }
	        if (!this.object) {
	          if (step !== stepVar) {
	            defPart += "" + this.tab + step + ";\n";
	          }
	          if (!(this.step && stepNum && (down = parseNum(stepNum[0]) < 0))) {
	            lvar = scope.freeVariable('len');
	          }
	          declare = "" + kvarAssign + ivar + " = 0, " + lvar + " = " + svar + ".length";
	          declareDown = "" + kvarAssign + ivar + " = " + svar + ".length - 1";
	          compare = "" + ivar + " < " + lvar;
	          compareDown = "" + ivar + " >= 0";
	          if (this.step) {
	            if (stepNum) {
	              if (down) {
	                compare = compareDown;
	                declare = declareDown;
	              }
	            } else {
	              compare = "" + stepVar + " > 0 ? " + compare + " : " + compareDown;
	              declare = "(" + stepVar + " > 0 ? (" + declare + ") : " + declareDown + ")";
	            }
	            increment = "" + ivar + " += " + stepVar;
	          } else {
	            increment = "" + (kvar !== ivar ? "++" + ivar : "" + ivar + "++");
	          }
	          forPartFragments = [this.makeCode("" + declare + "; " + compare + "; " + kvarAssign + increment)];
	        }
	      }
	      if (this.returns) {
	        resultPart = "" + this.tab + rvar + " = [];\n";
	        returnResult = "\n" + this.tab + "return " + rvar + ";";
	        body.makeReturn(rvar);
	      }
	      if (this.guard) {
	        if (body.expressions.length > 1) {
	          body.expressions.unshift(new If((new Parens(this.guard)).invert(), new Literal("continue")));
	        } else {
	          if (this.guard) {
	            body = Block.wrap([new If(this.guard, body)]);
	          }
	        }
	      }
	      if (this.pattern) {
	        body.expressions.unshift(new Assign(this.name, new Literal("" + svar + "[" + kvar + "]")));
	      }
	      defPartFragments = [].concat(this.makeCode(defPart), this.pluckDirectCall(o, body));
	      if (namePart) {
	        varPart = "\n" + idt1 + namePart + ";";
	      }
	      if (this.object) {
	        forPartFragments = [this.makeCode("" + kvar + " in " + svar)];
	        if (this.own) {
	          guardPart = "\n" + idt1 + "if (!" + (utility('hasProp')) + ".call(" + svar + ", " + kvar + ")) continue;";
	        }
	      }
	      bodyFragments = body.compileToFragments(merge(o, {
	        indent: idt1
	      }), LEVEL_TOP);
	      if (bodyFragments && (bodyFragments.length > 0)) {
	        bodyFragments = [].concat(this.makeCode("\n"), bodyFragments, this.makeCode("\n"));
	      }
	      return [].concat(defPartFragments, this.makeCode("" + (resultPart || '') + this.tab + "for ("), forPartFragments, this.makeCode(") {" + guardPart + varPart), bodyFragments, this.makeCode("" + this.tab + "}" + (returnResult || '')));
	    };

	    For.prototype.pluckDirectCall = function(o, body) {
	      var base, defs, expr, fn, idx, ref, val, _i, _len, _ref2, _ref3, _ref4, _ref5, _ref6, _ref7, _ref8;
	      defs = [];
	      _ref2 = body.expressions;
	      for (idx = _i = 0, _len = _ref2.length; _i < _len; idx = ++_i) {
	        expr = _ref2[idx];
	        expr = expr.unwrapAll();
	        if (!(expr instanceof Call)) {
	          continue;
	        }
	        val = (_ref3 = expr.variable) != null ? _ref3.unwrapAll() : void 0;
	        if (!((val instanceof Code) || (val instanceof Value && ((_ref4 = val.base) != null ? _ref4.unwrapAll() : void 0) instanceof Code && val.properties.length === 1 && ((_ref5 = (_ref6 = val.properties[0].name) != null ? _ref6.value : void 0) === 'call' || _ref5 === 'apply')))) {
	          continue;
	        }
	        fn = ((_ref7 = val.base) != null ? _ref7.unwrapAll() : void 0) || val;
	        ref = new Literal(o.scope.freeVariable('fn'));
	        base = new Value(ref);
	        if (val.base) {
	          _ref8 = [base, val], val.base = _ref8[0], base = _ref8[1];
	        }
	        body.expressions[idx] = new Call(base, expr.args);
	        defs = defs.concat(this.makeCode(this.tab), new Assign(ref, fn).compileToFragments(o, LEVEL_TOP), this.makeCode(';\n'));
	      }
	      return defs;
	    };

	    return For;

	  })(While);

	  exports.Switch = Switch = (function(_super) {
	    __extends(Switch, _super);

	    function Switch(subject, cases, otherwise) {
	      this.subject = subject;
	      this.cases = cases;
	      this.otherwise = otherwise;
	    }

	    Switch.prototype.children = ['subject', 'cases', 'otherwise'];

	    Switch.prototype.isStatement = YES;

	    Switch.prototype.jumps = function(o) {
	      var block, conds, jumpNode, _i, _len, _ref2, _ref3, _ref4;
	      if (o == null) {
	        o = {
	          block: true
	        };
	      }
	      _ref2 = this.cases;
	      for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
	        _ref3 = _ref2[_i], conds = _ref3[0], block = _ref3[1];
	        if (jumpNode = block.jumps(o)) {
	          return jumpNode;
	        }
	      }
	      return (_ref4 = this.otherwise) != null ? _ref4.jumps(o) : void 0;
	    };

	    Switch.prototype.makeReturn = function(res) {
	      var pair, _i, _len, _ref2, _ref3;
	      _ref2 = this.cases;
	      for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
	        pair = _ref2[_i];
	        pair[1].makeReturn(res);
	      }
	      if (res) {
	        this.otherwise || (this.otherwise = new Block([new Literal('void 0')]));
	      }
	      if ((_ref3 = this.otherwise) != null) {
	        _ref3.makeReturn(res);
	      }
	      return this;
	    };

	    Switch.prototype.compileNode = function(o) {
	      var block, body, cond, conditions, expr, fragments, i, idt1, idt2, _i, _j, _len, _len1, _ref2, _ref3, _ref4;
	      idt1 = o.indent + TAB;
	      idt2 = o.indent = idt1 + TAB;
	      fragments = [].concat(this.makeCode(this.tab + "switch ("), (this.subject ? this.subject.compileToFragments(o, LEVEL_PAREN) : this.makeCode("false")), this.makeCode(") {\n"));
	      _ref2 = this.cases;
	      for (i = _i = 0, _len = _ref2.length; _i < _len; i = ++_i) {
	        _ref3 = _ref2[i], conditions = _ref3[0], block = _ref3[1];
	        _ref4 = flatten([conditions]);
	        for (_j = 0, _len1 = _ref4.length; _j < _len1; _j++) {
	          cond = _ref4[_j];
	          if (!this.subject) {
	            cond = cond.invert();
	          }
	          fragments = fragments.concat(this.makeCode(idt1 + "case "), cond.compileToFragments(o, LEVEL_PAREN), this.makeCode(":\n"));
	        }
	        if ((body = block.compileToFragments(o, LEVEL_TOP)).length > 0) {
	          fragments = fragments.concat(body, this.makeCode('\n'));
	        }
	        if (i === this.cases.length - 1 && !this.otherwise) {
	          break;
	        }
	        expr = this.lastNonComment(block.expressions);
	        if (expr instanceof Return || (expr instanceof Literal && expr.jumps() && expr.value !== 'debugger')) {
	          continue;
	        }
	        fragments.push(cond.makeCode(idt2 + 'break;\n'));
	      }
	      if (this.otherwise && this.otherwise.expressions.length) {
	        fragments.push.apply(fragments, [this.makeCode(idt1 + "default:\n")].concat(__slice.call(this.otherwise.compileToFragments(o, LEVEL_TOP)), [this.makeCode("\n")]));
	      }
	      fragments.push(this.makeCode(this.tab + '}'));
	      return fragments;
	    };

	    return Switch;

	  })(Base);

	  exports.If = If = (function(_super) {
	    __extends(If, _super);

	    function If(condition, body, options) {
	      this.body = body;
	      if (options == null) {
	        options = {};
	      }
	      this.condition = options.type === 'unless' ? condition.invert() : condition;
	      this.elseBody = null;
	      this.isChain = false;
	      this.soak = options.soak;
	    }

	    If.prototype.children = ['condition', 'body', 'elseBody'];

	    If.prototype.bodyNode = function() {
	      var _ref2;
	      return (_ref2 = this.body) != null ? _ref2.unwrap() : void 0;
	    };

	    If.prototype.elseBodyNode = function() {
	      var _ref2;
	      return (_ref2 = this.elseBody) != null ? _ref2.unwrap() : void 0;
	    };

	    If.prototype.addElse = function(elseBody) {
	      if (this.isChain) {
	        this.elseBodyNode().addElse(elseBody);
	      } else {
	        this.isChain = elseBody instanceof If;
	        this.elseBody = this.ensureBlock(elseBody);
	        this.elseBody.updateLocationDataIfMissing(elseBody.locationData);
	      }
	      return this;
	    };

	    If.prototype.isStatement = function(o) {
	      var _ref2;
	      return (o != null ? o.level : void 0) === LEVEL_TOP || this.bodyNode().isStatement(o) || ((_ref2 = this.elseBodyNode()) != null ? _ref2.isStatement(o) : void 0);
	    };

	    If.prototype.jumps = function(o) {
	      var _ref2;
	      return this.body.jumps(o) || ((_ref2 = this.elseBody) != null ? _ref2.jumps(o) : void 0);
	    };

	    If.prototype.compileNode = function(o) {
	      if (this.isStatement(o)) {
	        return this.compileStatement(o);
	      } else {
	        return this.compileExpression(o);
	      }
	    };

	    If.prototype.makeReturn = function(res) {
	      if (res) {
	        this.elseBody || (this.elseBody = new Block([new Literal('void 0')]));
	      }
	      this.body && (this.body = new Block([this.body.makeReturn(res)]));
	      this.elseBody && (this.elseBody = new Block([this.elseBody.makeReturn(res)]));
	      return this;
	    };

	    If.prototype.ensureBlock = function(node) {
	      if (node instanceof Block) {
	        return node;
	      } else {
	        return new Block([node]);
	      }
	    };

	    If.prototype.compileStatement = function(o) {
	      var answer, body, child, cond, exeq, ifPart, indent;
	      child = del(o, 'chainChild');
	      exeq = del(o, 'isExistentialEquals');
	      if (exeq) {
	        return new If(this.condition.invert(), this.elseBodyNode(), {
	          type: 'if'
	        }).compileToFragments(o);
	      }
	      indent = o.indent + TAB;
	      cond = this.condition.compileToFragments(o, LEVEL_PAREN);
	      body = this.ensureBlock(this.body).compileToFragments(merge(o, {
	        indent: indent
	      }));
	      ifPart = [].concat(this.makeCode("if ("), cond, this.makeCode(") {\n"), body, this.makeCode("\n" + this.tab + "}"));
	      if (!child) {
	        ifPart.unshift(this.makeCode(this.tab));
	      }
	      if (!this.elseBody) {
	        return ifPart;
	      }
	      answer = ifPart.concat(this.makeCode(' else '));
	      if (this.isChain) {
	        o.chainChild = true;
	        answer = answer.concat(this.elseBody.unwrap().compileToFragments(o, LEVEL_TOP));
	      } else {
	        answer = answer.concat(this.makeCode("{\n"), this.elseBody.compileToFragments(merge(o, {
	          indent: indent
	        }), LEVEL_TOP), this.makeCode("\n" + this.tab + "}"));
	      }
	      return answer;
	    };

	    If.prototype.compileExpression = function(o) {
	      var alt, body, cond, fragments;
	      cond = this.condition.compileToFragments(o, LEVEL_COND);
	      body = this.bodyNode().compileToFragments(o, LEVEL_LIST);
	      alt = this.elseBodyNode() ? this.elseBodyNode().compileToFragments(o, LEVEL_LIST) : [this.makeCode('void 0')];
	      fragments = cond.concat(this.makeCode(" ? "), body, this.makeCode(" : "), alt);
	      if (o.level >= LEVEL_COND) {
	        return this.wrapInBraces(fragments);
	      } else {
	        return fragments;
	      }
	    };

	    If.prototype.unfoldSoak = function() {
	      return this.soak && this;
	    };

	    return If;

	  })(Base);

	  UTILITIES = {
	    "extends": function() {
	      return "function(child, parent) { for (var key in parent) { if (" + (utility('hasProp')) + ".call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; }";
	    },
	    bind: function() {
	      return 'function(fn, me){ return function(){ return fn.apply(me, arguments); }; }';
	    },
	    indexOf: function() {
	      return "[].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; }";
	    },
	    modulo: function() {
	      return "function(a, b) { return (a % b + +b) % b; }";
	    },
	    hasProp: function() {
	      return '{}.hasOwnProperty';
	    },
	    slice: function() {
	      return '[].slice';
	    }
	  };

	  LEVEL_TOP = 1;

	  LEVEL_PAREN = 2;

	  LEVEL_LIST = 3;

	  LEVEL_COND = 4;

	  LEVEL_OP = 5;

	  LEVEL_ACCESS = 6;

	  TAB = '  ';

	  IDENTIFIER_STR = "[$A-Za-z_\\x7f-\\uffff][$\\w\\x7f-\\uffff]*";

	  IDENTIFIER = RegExp("^" + IDENTIFIER_STR + "$");

	  SIMPLENUM = /^[+-]?\d+$/;

	  HEXNUM = /^[+-]?0x[\da-f]+/i;

	  NUMBER = /^[+-]?(?:0x[\da-f]+|\d*\.?\d+(?:e[+-]?\d+)?)$/i;

	  METHOD_DEF = RegExp("^(" + IDENTIFIER_STR + ")(\\.prototype)?(?:\\.(" + IDENTIFIER_STR + ")|\\[(\"(?:[^\\\\\"\\r\\n]|\\\\.)*\"|'(?:[^\\\\'\\r\\n]|\\\\.)*')\\]|\\[(0x[\\da-fA-F]+|\\d*\\.?\\d+(?:[eE][+-]?\\d+)?)\\])$");

	  IS_STRING = /^['"]/;

	  IS_REGEX = /^\//;

	  utility = function(name) {
	    var ref;
	    ref = "__" + name;
	    Scope.root.assign(ref, UTILITIES[name]());
	    return ref;
	  };

	  multident = function(code, tab) {
	    code = code.replace(/\n/g, '$&' + tab);
	    return code.replace(/\s+$/, '');
	  };

	  parseNum = function(x) {
	    if (x == null) {
	      return 0;
	    } else if (x.match(HEXNUM)) {
	      return parseInt(x, 16);
	    } else {
	      return parseFloat(x);
	    }
	  };

	  isLiteralArguments = function(node) {
	    return node instanceof Literal && node.value === 'arguments' && !node.asKey;
	  };

	  isLiteralThis = function(node) {
	    return (node instanceof Literal && node.value === 'this' && !node.asKey) || (node instanceof Code && node.bound) || (node instanceof Call && node.isSuper);
	  };

	  unfoldSoak = function(o, parent, name) {
	    var ifn;
	    if (!(ifn = parent[name].unfoldSoak(o))) {
	      return;
	    }
	    parent[name] = ifn.body;
	    ifn.body = new Value(parent);
	    return ifn;
	  };

	}).call(this);


/***/ },
/* 53 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_RESULT__;/* -*- Mode: js; js-indent-level: 2; -*- */
	/*
	 * Copyright 2011 Mozilla Foundation and contributors
	 * Licensed under the New BSD license. See LICENSE or:
	 * http://opensource.org/licenses/BSD-3-Clause
	 */
	if (false) {
	    var define = require('amdefine')(module, require);
	}
	!(__WEBPACK_AMD_DEFINE_RESULT__ = function (require, exports, module) {

	  var base64VLQ = __webpack_require__(66);
	  var util = __webpack_require__(67);
	  var ArraySet = __webpack_require__(68).ArraySet;
	  var MappingList = __webpack_require__(69).MappingList;

	  /**
	   * An instance of the SourceMapGenerator represents a source map which is
	   * being built incrementally. You may pass an object with the following
	   * properties:
	   *
	   *   - file: The filename of the generated source.
	   *   - sourceRoot: A root for all relative URLs in this source map.
	   */
	  function SourceMapGenerator(aArgs) {
	    if (!aArgs) {
	      aArgs = {};
	    }
	    this._file = util.getArg(aArgs, 'file', null);
	    this._sourceRoot = util.getArg(aArgs, 'sourceRoot', null);
	    this._skipValidation = util.getArg(aArgs, 'skipValidation', false);
	    this._sources = new ArraySet();
	    this._names = new ArraySet();
	    this._mappings = new MappingList();
	    this._sourcesContents = null;
	  }

	  SourceMapGenerator.prototype._version = 3;

	  /**
	   * Creates a new SourceMapGenerator based on a SourceMapConsumer
	   *
	   * @param aSourceMapConsumer The SourceMap.
	   */
	  SourceMapGenerator.fromSourceMap =
	    function SourceMapGenerator_fromSourceMap(aSourceMapConsumer) {
	      var sourceRoot = aSourceMapConsumer.sourceRoot;
	      var generator = new SourceMapGenerator({
	        file: aSourceMapConsumer.file,
	        sourceRoot: sourceRoot
	      });
	      aSourceMapConsumer.eachMapping(function (mapping) {
	        var newMapping = {
	          generated: {
	            line: mapping.generatedLine,
	            column: mapping.generatedColumn
	          }
	        };

	        if (mapping.source != null) {
	          newMapping.source = mapping.source;
	          if (sourceRoot != null) {
	            newMapping.source = util.relative(sourceRoot, newMapping.source);
	          }

	          newMapping.original = {
	            line: mapping.originalLine,
	            column: mapping.originalColumn
	          };

	          if (mapping.name != null) {
	            newMapping.name = mapping.name;
	          }
	        }

	        generator.addMapping(newMapping);
	      });
	      aSourceMapConsumer.sources.forEach(function (sourceFile) {
	        var content = aSourceMapConsumer.sourceContentFor(sourceFile);
	        if (content != null) {
	          generator.setSourceContent(sourceFile, content);
	        }
	      });
	      return generator;
	    };

	  /**
	   * Add a single mapping from original source line and column to the generated
	   * source's line and column for this source map being created. The mapping
	   * object should have the following properties:
	   *
	   *   - generated: An object with the generated line and column positions.
	   *   - original: An object with the original line and column positions.
	   *   - source: The original source file (relative to the sourceRoot).
	   *   - name: An optional original token name for this mapping.
	   */
	  SourceMapGenerator.prototype.addMapping =
	    function SourceMapGenerator_addMapping(aArgs) {
	      var generated = util.getArg(aArgs, 'generated');
	      var original = util.getArg(aArgs, 'original', null);
	      var source = util.getArg(aArgs, 'source', null);
	      var name = util.getArg(aArgs, 'name', null);

	      if (!this._skipValidation) {
	        this._validateMapping(generated, original, source, name);
	      }

	      if (source != null && !this._sources.has(source)) {
	        this._sources.add(source);
	      }

	      if (name != null && !this._names.has(name)) {
	        this._names.add(name);
	      }

	      this._mappings.add({
	        generatedLine: generated.line,
	        generatedColumn: generated.column,
	        originalLine: original != null && original.line,
	        originalColumn: original != null && original.column,
	        source: source,
	        name: name
	      });
	    };

	  /**
	   * Set the source content for a source file.
	   */
	  SourceMapGenerator.prototype.setSourceContent =
	    function SourceMapGenerator_setSourceContent(aSourceFile, aSourceContent) {
	      var source = aSourceFile;
	      if (this._sourceRoot != null) {
	        source = util.relative(this._sourceRoot, source);
	      }

	      if (aSourceContent != null) {
	        // Add the source content to the _sourcesContents map.
	        // Create a new _sourcesContents map if the property is null.
	        if (!this._sourcesContents) {
	          this._sourcesContents = {};
	        }
	        this._sourcesContents[util.toSetString(source)] = aSourceContent;
	      } else if (this._sourcesContents) {
	        // Remove the source file from the _sourcesContents map.
	        // If the _sourcesContents map is empty, set the property to null.
	        delete this._sourcesContents[util.toSetString(source)];
	        if (Object.keys(this._sourcesContents).length === 0) {
	          this._sourcesContents = null;
	        }
	      }
	    };

	  /**
	   * Applies the mappings of a sub-source-map for a specific source file to the
	   * source map being generated. Each mapping to the supplied source file is
	   * rewritten using the supplied source map. Note: The resolution for the
	   * resulting mappings is the minimium of this map and the supplied map.
	   *
	   * @param aSourceMapConsumer The source map to be applied.
	   * @param aSourceFile Optional. The filename of the source file.
	   *        If omitted, SourceMapConsumer's file property will be used.
	   * @param aSourceMapPath Optional. The dirname of the path to the source map
	   *        to be applied. If relative, it is relative to the SourceMapConsumer.
	   *        This parameter is needed when the two source maps aren't in the same
	   *        directory, and the source map to be applied contains relative source
	   *        paths. If so, those relative source paths need to be rewritten
	   *        relative to the SourceMapGenerator.
	   */
	  SourceMapGenerator.prototype.applySourceMap =
	    function SourceMapGenerator_applySourceMap(aSourceMapConsumer, aSourceFile, aSourceMapPath) {
	      var sourceFile = aSourceFile;
	      // If aSourceFile is omitted, we will use the file property of the SourceMap
	      if (aSourceFile == null) {
	        if (aSourceMapConsumer.file == null) {
	          throw new Error(
	            'SourceMapGenerator.prototype.applySourceMap requires either an explicit source file, ' +
	            'or the source map\'s "file" property. Both were omitted.'
	          );
	        }
	        sourceFile = aSourceMapConsumer.file;
	      }
	      var sourceRoot = this._sourceRoot;
	      // Make "sourceFile" relative if an absolute Url is passed.
	      if (sourceRoot != null) {
	        sourceFile = util.relative(sourceRoot, sourceFile);
	      }
	      // Applying the SourceMap can add and remove items from the sources and
	      // the names array.
	      var newSources = new ArraySet();
	      var newNames = new ArraySet();

	      // Find mappings for the "sourceFile"
	      this._mappings.unsortedForEach(function (mapping) {
	        if (mapping.source === sourceFile && mapping.originalLine != null) {
	          // Check if it can be mapped by the source map, then update the mapping.
	          var original = aSourceMapConsumer.originalPositionFor({
	            line: mapping.originalLine,
	            column: mapping.originalColumn
	          });
	          if (original.source != null) {
	            // Copy mapping
	            mapping.source = original.source;
	            if (aSourceMapPath != null) {
	              mapping.source = util.join(aSourceMapPath, mapping.source)
	            }
	            if (sourceRoot != null) {
	              mapping.source = util.relative(sourceRoot, mapping.source);
	            }
	            mapping.originalLine = original.line;
	            mapping.originalColumn = original.column;
	            if (original.name != null) {
	              mapping.name = original.name;
	            }
	          }
	        }

	        var source = mapping.source;
	        if (source != null && !newSources.has(source)) {
	          newSources.add(source);
	        }

	        var name = mapping.name;
	        if (name != null && !newNames.has(name)) {
	          newNames.add(name);
	        }

	      }, this);
	      this._sources = newSources;
	      this._names = newNames;

	      // Copy sourcesContents of applied map.
	      aSourceMapConsumer.sources.forEach(function (sourceFile) {
	        var content = aSourceMapConsumer.sourceContentFor(sourceFile);
	        if (content != null) {
	          if (aSourceMapPath != null) {
	            sourceFile = util.join(aSourceMapPath, sourceFile);
	          }
	          if (sourceRoot != null) {
	            sourceFile = util.relative(sourceRoot, sourceFile);
	          }
	          this.setSourceContent(sourceFile, content);
	        }
	      }, this);
	    };

	  /**
	   * A mapping can have one of the three levels of data:
	   *
	   *   1. Just the generated position.
	   *   2. The Generated position, original position, and original source.
	   *   3. Generated and original position, original source, as well as a name
	   *      token.
	   *
	   * To maintain consistency, we validate that any new mapping being added falls
	   * in to one of these categories.
	   */
	  SourceMapGenerator.prototype._validateMapping =
	    function SourceMapGenerator_validateMapping(aGenerated, aOriginal, aSource,
	                                                aName) {
	      if (aGenerated && 'line' in aGenerated && 'column' in aGenerated
	          && aGenerated.line > 0 && aGenerated.column >= 0
	          && !aOriginal && !aSource && !aName) {
	        // Case 1.
	        return;
	      }
	      else if (aGenerated && 'line' in aGenerated && 'column' in aGenerated
	               && aOriginal && 'line' in aOriginal && 'column' in aOriginal
	               && aGenerated.line > 0 && aGenerated.column >= 0
	               && aOriginal.line > 0 && aOriginal.column >= 0
	               && aSource) {
	        // Cases 2 and 3.
	        return;
	      }
	      else {
	        throw new Error('Invalid mapping: ' + JSON.stringify({
	          generated: aGenerated,
	          source: aSource,
	          original: aOriginal,
	          name: aName
	        }));
	      }
	    };

	  /**
	   * Serialize the accumulated mappings in to the stream of base 64 VLQs
	   * specified by the source map format.
	   */
	  SourceMapGenerator.prototype._serializeMappings =
	    function SourceMapGenerator_serializeMappings() {
	      var previousGeneratedColumn = 0;
	      var previousGeneratedLine = 1;
	      var previousOriginalColumn = 0;
	      var previousOriginalLine = 0;
	      var previousName = 0;
	      var previousSource = 0;
	      var result = '';
	      var mapping;

	      var mappings = this._mappings.toArray();

	      for (var i = 0, len = mappings.length; i < len; i++) {
	        mapping = mappings[i];

	        if (mapping.generatedLine !== previousGeneratedLine) {
	          previousGeneratedColumn = 0;
	          while (mapping.generatedLine !== previousGeneratedLine) {
	            result += ';';
	            previousGeneratedLine++;
	          }
	        }
	        else {
	          if (i > 0) {
	            if (!util.compareByGeneratedPositions(mapping, mappings[i - 1])) {
	              continue;
	            }
	            result += ',';
	          }
	        }

	        result += base64VLQ.encode(mapping.generatedColumn
	                                   - previousGeneratedColumn);
	        previousGeneratedColumn = mapping.generatedColumn;

	        if (mapping.source != null) {
	          result += base64VLQ.encode(this._sources.indexOf(mapping.source)
	                                     - previousSource);
	          previousSource = this._sources.indexOf(mapping.source);

	          // lines are stored 0-based in SourceMap spec version 3
	          result += base64VLQ.encode(mapping.originalLine - 1
	                                     - previousOriginalLine);
	          previousOriginalLine = mapping.originalLine - 1;

	          result += base64VLQ.encode(mapping.originalColumn
	                                     - previousOriginalColumn);
	          previousOriginalColumn = mapping.originalColumn;

	          if (mapping.name != null) {
	            result += base64VLQ.encode(this._names.indexOf(mapping.name)
	                                       - previousName);
	            previousName = this._names.indexOf(mapping.name);
	          }
	        }
	      }

	      return result;
	    };

	  SourceMapGenerator.prototype._generateSourcesContent =
	    function SourceMapGenerator_generateSourcesContent(aSources, aSourceRoot) {
	      return aSources.map(function (source) {
	        if (!this._sourcesContents) {
	          return null;
	        }
	        if (aSourceRoot != null) {
	          source = util.relative(aSourceRoot, source);
	        }
	        var key = util.toSetString(source);
	        return Object.prototype.hasOwnProperty.call(this._sourcesContents,
	                                                    key)
	          ? this._sourcesContents[key]
	          : null;
	      }, this);
	    };

	  /**
	   * Externalize the source map.
	   */
	  SourceMapGenerator.prototype.toJSON =
	    function SourceMapGenerator_toJSON() {
	      var map = {
	        version: this._version,
	        sources: this._sources.toArray(),
	        names: this._names.toArray(),
	        mappings: this._serializeMappings()
	      };
	      if (this._file != null) {
	        map.file = this._file;
	      }
	      if (this._sourceRoot != null) {
	        map.sourceRoot = this._sourceRoot;
	      }
	      if (this._sourcesContents) {
	        map.sourcesContent = this._generateSourcesContent(map.sources, map.sourceRoot);
	      }

	      return map;
	    };

	  /**
	   * Render the source map being generated to a string.
	   */
	  SourceMapGenerator.prototype.toString =
	    function SourceMapGenerator_toString() {
	      return JSON.stringify(this);
	    };

	  exports.SourceMapGenerator = SourceMapGenerator;

	}.call(exports, __webpack_require__, exports, module), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ },
/* 54 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_RESULT__;/* -*- Mode: js; js-indent-level: 2; -*- */
	/*
	 * Copyright 2011 Mozilla Foundation and contributors
	 * Licensed under the New BSD license. See LICENSE or:
	 * http://opensource.org/licenses/BSD-3-Clause
	 */
	if (false) {
	    var define = require('amdefine')(module, require);
	}
	!(__WEBPACK_AMD_DEFINE_RESULT__ = function (require, exports, module) {

	  var util = __webpack_require__(67);
	  var binarySearch = __webpack_require__(70);
	  var ArraySet = __webpack_require__(68).ArraySet;
	  var base64VLQ = __webpack_require__(66);

	  /**
	   * A SourceMapConsumer instance represents a parsed source map which we can
	   * query for information about the original file positions by giving it a file
	   * position in the generated source.
	   *
	   * The only parameter is the raw source map (either as a JSON string, or
	   * already parsed to an object). According to the spec, source maps have the
	   * following attributes:
	   *
	   *   - version: Which version of the source map spec this map is following.
	   *   - sources: An array of URLs to the original source files.
	   *   - names: An array of identifiers which can be referrenced by individual mappings.
	   *   - sourceRoot: Optional. The URL root from which all sources are relative.
	   *   - sourcesContent: Optional. An array of contents of the original source files.
	   *   - mappings: A string of base64 VLQs which contain the actual mappings.
	   *   - file: Optional. The generated file this source map is associated with.
	   *
	   * Here is an example source map, taken from the source map spec[0]:
	   *
	   *     {
	   *       version : 3,
	   *       file: "out.js",
	   *       sourceRoot : "",
	   *       sources: ["foo.js", "bar.js"],
	   *       names: ["src", "maps", "are", "fun"],
	   *       mappings: "AA,AB;;ABCDE;"
	   *     }
	   *
	   * [0]: https://docs.google.com/document/d/1U1RGAehQwRypUTovF1KRlpiOFze0b-_2gc6fAH0KY0k/edit?pli=1#
	   */
	  function SourceMapConsumer(aSourceMap) {
	    var sourceMap = aSourceMap;
	    if (typeof aSourceMap === 'string') {
	      sourceMap = JSON.parse(aSourceMap.replace(/^\)\]\}'/, ''));
	    }

	    var version = util.getArg(sourceMap, 'version');
	    var sources = util.getArg(sourceMap, 'sources');
	    // Sass 3.3 leaves out the 'names' array, so we deviate from the spec (which
	    // requires the array) to play nice here.
	    var names = util.getArg(sourceMap, 'names', []);
	    var sourceRoot = util.getArg(sourceMap, 'sourceRoot', null);
	    var sourcesContent = util.getArg(sourceMap, 'sourcesContent', null);
	    var mappings = util.getArg(sourceMap, 'mappings');
	    var file = util.getArg(sourceMap, 'file', null);

	    // Once again, Sass deviates from the spec and supplies the version as a
	    // string rather than a number, so we use loose equality checking here.
	    if (version != this._version) {
	      throw new Error('Unsupported version: ' + version);
	    }

	    // Some source maps produce relative source paths like "./foo.js" instead of
	    // "foo.js".  Normalize these first so that future comparisons will succeed.
	    // See bugzil.la/1090768.
	    sources = sources.map(util.normalize);

	    // Pass `true` below to allow duplicate names and sources. While source maps
	    // are intended to be compressed and deduplicated, the TypeScript compiler
	    // sometimes generates source maps with duplicates in them. See Github issue
	    // #72 and bugzil.la/889492.
	    this._names = ArraySet.fromArray(names, true);
	    this._sources = ArraySet.fromArray(sources, true);

	    this.sourceRoot = sourceRoot;
	    this.sourcesContent = sourcesContent;
	    this._mappings = mappings;
	    this.file = file;
	  }

	  /**
	   * Create a SourceMapConsumer from a SourceMapGenerator.
	   *
	   * @param SourceMapGenerator aSourceMap
	   *        The source map that will be consumed.
	   * @returns SourceMapConsumer
	   */
	  SourceMapConsumer.fromSourceMap =
	    function SourceMapConsumer_fromSourceMap(aSourceMap) {
	      var smc = Object.create(SourceMapConsumer.prototype);

	      smc._names = ArraySet.fromArray(aSourceMap._names.toArray(), true);
	      smc._sources = ArraySet.fromArray(aSourceMap._sources.toArray(), true);
	      smc.sourceRoot = aSourceMap._sourceRoot;
	      smc.sourcesContent = aSourceMap._generateSourcesContent(smc._sources.toArray(),
	                                                              smc.sourceRoot);
	      smc.file = aSourceMap._file;

	      smc.__generatedMappings = aSourceMap._mappings.toArray().slice();
	      smc.__originalMappings = aSourceMap._mappings.toArray().slice()
	        .sort(util.compareByOriginalPositions);

	      return smc;
	    };

	  /**
	   * The version of the source mapping spec that we are consuming.
	   */
	  SourceMapConsumer.prototype._version = 3;

	  /**
	   * The list of original sources.
	   */
	  Object.defineProperty(SourceMapConsumer.prototype, 'sources', {
	    get: function () {
	      return this._sources.toArray().map(function (s) {
	        return this.sourceRoot != null ? util.join(this.sourceRoot, s) : s;
	      }, this);
	    }
	  });

	  // `__generatedMappings` and `__originalMappings` are arrays that hold the
	  // parsed mapping coordinates from the source map's "mappings" attribute. They
	  // are lazily instantiated, accessed via the `_generatedMappings` and
	  // `_originalMappings` getters respectively, and we only parse the mappings
	  // and create these arrays once queried for a source location. We jump through
	  // these hoops because there can be many thousands of mappings, and parsing
	  // them is expensive, so we only want to do it if we must.
	  //
	  // Each object in the arrays is of the form:
	  //
	  //     {
	  //       generatedLine: The line number in the generated code,
	  //       generatedColumn: The column number in the generated code,
	  //       source: The path to the original source file that generated this
	  //               chunk of code,
	  //       originalLine: The line number in the original source that
	  //                     corresponds to this chunk of generated code,
	  //       originalColumn: The column number in the original source that
	  //                       corresponds to this chunk of generated code,
	  //       name: The name of the original symbol which generated this chunk of
	  //             code.
	  //     }
	  //
	  // All properties except for `generatedLine` and `generatedColumn` can be
	  // `null`.
	  //
	  // `_generatedMappings` is ordered by the generated positions.
	  //
	  // `_originalMappings` is ordered by the original positions.

	  SourceMapConsumer.prototype.__generatedMappings = null;
	  Object.defineProperty(SourceMapConsumer.prototype, '_generatedMappings', {
	    get: function () {
	      if (!this.__generatedMappings) {
	        this.__generatedMappings = [];
	        this.__originalMappings = [];
	        this._parseMappings(this._mappings, this.sourceRoot);
	      }

	      return this.__generatedMappings;
	    }
	  });

	  SourceMapConsumer.prototype.__originalMappings = null;
	  Object.defineProperty(SourceMapConsumer.prototype, '_originalMappings', {
	    get: function () {
	      if (!this.__originalMappings) {
	        this.__generatedMappings = [];
	        this.__originalMappings = [];
	        this._parseMappings(this._mappings, this.sourceRoot);
	      }

	      return this.__originalMappings;
	    }
	  });

	  SourceMapConsumer.prototype._nextCharIsMappingSeparator =
	    function SourceMapConsumer_nextCharIsMappingSeparator(aStr) {
	      var c = aStr.charAt(0);
	      return c === ";" || c === ",";
	    };

	  /**
	   * Parse the mappings in a string in to a data structure which we can easily
	   * query (the ordered arrays in the `this.__generatedMappings` and
	   * `this.__originalMappings` properties).
	   */
	  SourceMapConsumer.prototype._parseMappings =
	    function SourceMapConsumer_parseMappings(aStr, aSourceRoot) {
	      var generatedLine = 1;
	      var previousGeneratedColumn = 0;
	      var previousOriginalLine = 0;
	      var previousOriginalColumn = 0;
	      var previousSource = 0;
	      var previousName = 0;
	      var str = aStr;
	      var temp = {};
	      var mapping;

	      while (str.length > 0) {
	        if (str.charAt(0) === ';') {
	          generatedLine++;
	          str = str.slice(1);
	          previousGeneratedColumn = 0;
	        }
	        else if (str.charAt(0) === ',') {
	          str = str.slice(1);
	        }
	        else {
	          mapping = {};
	          mapping.generatedLine = generatedLine;

	          // Generated column.
	          base64VLQ.decode(str, temp);
	          mapping.generatedColumn = previousGeneratedColumn + temp.value;
	          previousGeneratedColumn = mapping.generatedColumn;
	          str = temp.rest;

	          if (str.length > 0 && !this._nextCharIsMappingSeparator(str)) {
	            // Original source.
	            base64VLQ.decode(str, temp);
	            mapping.source = this._sources.at(previousSource + temp.value);
	            previousSource += temp.value;
	            str = temp.rest;
	            if (str.length === 0 || this._nextCharIsMappingSeparator(str)) {
	              throw new Error('Found a source, but no line and column');
	            }

	            // Original line.
	            base64VLQ.decode(str, temp);
	            mapping.originalLine = previousOriginalLine + temp.value;
	            previousOriginalLine = mapping.originalLine;
	            // Lines are stored 0-based
	            mapping.originalLine += 1;
	            str = temp.rest;
	            if (str.length === 0 || this._nextCharIsMappingSeparator(str)) {
	              throw new Error('Found a source and line, but no column');
	            }

	            // Original column.
	            base64VLQ.decode(str, temp);
	            mapping.originalColumn = previousOriginalColumn + temp.value;
	            previousOriginalColumn = mapping.originalColumn;
	            str = temp.rest;

	            if (str.length > 0 && !this._nextCharIsMappingSeparator(str)) {
	              // Original name.
	              base64VLQ.decode(str, temp);
	              mapping.name = this._names.at(previousName + temp.value);
	              previousName += temp.value;
	              str = temp.rest;
	            }
	          }

	          this.__generatedMappings.push(mapping);
	          if (typeof mapping.originalLine === 'number') {
	            this.__originalMappings.push(mapping);
	          }
	        }
	      }

	      this.__generatedMappings.sort(util.compareByGeneratedPositions);
	      this.__originalMappings.sort(util.compareByOriginalPositions);
	    };

	  /**
	   * Find the mapping that best matches the hypothetical "needle" mapping that
	   * we are searching for in the given "haystack" of mappings.
	   */
	  SourceMapConsumer.prototype._findMapping =
	    function SourceMapConsumer_findMapping(aNeedle, aMappings, aLineName,
	                                           aColumnName, aComparator) {
	      // To return the position we are searching for, we must first find the
	      // mapping for the given position and then return the opposite position it
	      // points to. Because the mappings are sorted, we can use binary search to
	      // find the best mapping.

	      if (aNeedle[aLineName] <= 0) {
	        throw new TypeError('Line must be greater than or equal to 1, got '
	                            + aNeedle[aLineName]);
	      }
	      if (aNeedle[aColumnName] < 0) {
	        throw new TypeError('Column must be greater than or equal to 0, got '
	                            + aNeedle[aColumnName]);
	      }

	      return binarySearch.search(aNeedle, aMappings, aComparator);
	    };

	  /**
	   * Compute the last column for each generated mapping. The last column is
	   * inclusive.
	   */
	  SourceMapConsumer.prototype.computeColumnSpans =
	    function SourceMapConsumer_computeColumnSpans() {
	      for (var index = 0; index < this._generatedMappings.length; ++index) {
	        var mapping = this._generatedMappings[index];

	        // Mappings do not contain a field for the last generated columnt. We
	        // can come up with an optimistic estimate, however, by assuming that
	        // mappings are contiguous (i.e. given two consecutive mappings, the
	        // first mapping ends where the second one starts).
	        if (index + 1 < this._generatedMappings.length) {
	          var nextMapping = this._generatedMappings[index + 1];

	          if (mapping.generatedLine === nextMapping.generatedLine) {
	            mapping.lastGeneratedColumn = nextMapping.generatedColumn - 1;
	            continue;
	          }
	        }

	        // The last mapping for each line spans the entire line.
	        mapping.lastGeneratedColumn = Infinity;
	      }
	    };

	  /**
	   * Returns the original source, line, and column information for the generated
	   * source's line and column positions provided. The only argument is an object
	   * with the following properties:
	   *
	   *   - line: The line number in the generated source.
	   *   - column: The column number in the generated source.
	   *
	   * and an object is returned with the following properties:
	   *
	   *   - source: The original source file, or null.
	   *   - line: The line number in the original source, or null.
	   *   - column: The column number in the original source, or null.
	   *   - name: The original identifier, or null.
	   */
	  SourceMapConsumer.prototype.originalPositionFor =
	    function SourceMapConsumer_originalPositionFor(aArgs) {
	      var needle = {
	        generatedLine: util.getArg(aArgs, 'line'),
	        generatedColumn: util.getArg(aArgs, 'column')
	      };

	      var index = this._findMapping(needle,
	                                    this._generatedMappings,
	                                    "generatedLine",
	                                    "generatedColumn",
	                                    util.compareByGeneratedPositions);

	      if (index >= 0) {
	        var mapping = this._generatedMappings[index];

	        if (mapping.generatedLine === needle.generatedLine) {
	          var source = util.getArg(mapping, 'source', null);
	          if (source != null && this.sourceRoot != null) {
	            source = util.join(this.sourceRoot, source);
	          }
	          return {
	            source: source,
	            line: util.getArg(mapping, 'originalLine', null),
	            column: util.getArg(mapping, 'originalColumn', null),
	            name: util.getArg(mapping, 'name', null)
	          };
	        }
	      }

	      return {
	        source: null,
	        line: null,
	        column: null,
	        name: null
	      };
	    };

	  /**
	   * Returns the original source content. The only argument is the url of the
	   * original source file. Returns null if no original source content is
	   * availible.
	   */
	  SourceMapConsumer.prototype.sourceContentFor =
	    function SourceMapConsumer_sourceContentFor(aSource) {
	      if (!this.sourcesContent) {
	        return null;
	      }

	      if (this.sourceRoot != null) {
	        aSource = util.relative(this.sourceRoot, aSource);
	      }

	      if (this._sources.has(aSource)) {
	        return this.sourcesContent[this._sources.indexOf(aSource)];
	      }

	      var url;
	      if (this.sourceRoot != null
	          && (url = util.urlParse(this.sourceRoot))) {
	        // XXX: file:// URIs and absolute paths lead to unexpected behavior for
	        // many users. We can help them out when they expect file:// URIs to
	        // behave like it would if they were running a local HTTP server. See
	        // https://bugzilla.mozilla.org/show_bug.cgi?id=885597.
	        var fileUriAbsPath = aSource.replace(/^file:\/\//, "");
	        if (url.scheme == "file"
	            && this._sources.has(fileUriAbsPath)) {
	          return this.sourcesContent[this._sources.indexOf(fileUriAbsPath)]
	        }

	        if ((!url.path || url.path == "/")
	            && this._sources.has("/" + aSource)) {
	          return this.sourcesContent[this._sources.indexOf("/" + aSource)];
	        }
	      }

	      throw new Error('"' + aSource + '" is not in the SourceMap.');
	    };

	  /**
	   * Returns the generated line and column information for the original source,
	   * line, and column positions provided. The only argument is an object with
	   * the following properties:
	   *
	   *   - source: The filename of the original source.
	   *   - line: The line number in the original source.
	   *   - column: The column number in the original source.
	   *
	   * and an object is returned with the following properties:
	   *
	   *   - line: The line number in the generated source, or null.
	   *   - column: The column number in the generated source, or null.
	   */
	  SourceMapConsumer.prototype.generatedPositionFor =
	    function SourceMapConsumer_generatedPositionFor(aArgs) {
	      var needle = {
	        source: util.getArg(aArgs, 'source'),
	        originalLine: util.getArg(aArgs, 'line'),
	        originalColumn: util.getArg(aArgs, 'column')
	      };

	      if (this.sourceRoot != null) {
	        needle.source = util.relative(this.sourceRoot, needle.source);
	      }

	      var index = this._findMapping(needle,
	                                    this._originalMappings,
	                                    "originalLine",
	                                    "originalColumn",
	                                    util.compareByOriginalPositions);

	      if (index >= 0) {
	        var mapping = this._originalMappings[index];

	        return {
	          line: util.getArg(mapping, 'generatedLine', null),
	          column: util.getArg(mapping, 'generatedColumn', null),
	          lastColumn: util.getArg(mapping, 'lastGeneratedColumn', null)
	        };
	      }

	      return {
	        line: null,
	        column: null,
	        lastColumn: null
	      };
	    };

	  /**
	   * Returns all generated line and column information for the original source
	   * and line provided. The only argument is an object with the following
	   * properties:
	   *
	   *   - source: The filename of the original source.
	   *   - line: The line number in the original source.
	   *
	   * and an array of objects is returned, each with the following properties:
	   *
	   *   - line: The line number in the generated source, or null.
	   *   - column: The column number in the generated source, or null.
	   */
	  SourceMapConsumer.prototype.allGeneratedPositionsFor =
	    function SourceMapConsumer_allGeneratedPositionsFor(aArgs) {
	      // When there is no exact match, SourceMapConsumer.prototype._findMapping
	      // returns the index of the closest mapping less than the needle. By
	      // setting needle.originalColumn to Infinity, we thus find the last
	      // mapping for the given line, provided such a mapping exists.
	      var needle = {
	        source: util.getArg(aArgs, 'source'),
	        originalLine: util.getArg(aArgs, 'line'),
	        originalColumn: Infinity
	      };

	      if (this.sourceRoot != null) {
	        needle.source = util.relative(this.sourceRoot, needle.source);
	      }

	      var mappings = [];

	      var index = this._findMapping(needle,
	                                    this._originalMappings,
	                                    "originalLine",
	                                    "originalColumn",
	                                    util.compareByOriginalPositions);
	      if (index >= 0) {
	        var mapping = this._originalMappings[index];

	        while (mapping && mapping.originalLine === needle.originalLine) {
	          mappings.push({
	            line: util.getArg(mapping, 'generatedLine', null),
	            column: util.getArg(mapping, 'generatedColumn', null),
	            lastColumn: util.getArg(mapping, 'lastGeneratedColumn', null)
	          });

	          mapping = this._originalMappings[--index];
	        }
	      }

	      return mappings.reverse();
	    };

	  SourceMapConsumer.GENERATED_ORDER = 1;
	  SourceMapConsumer.ORIGINAL_ORDER = 2;

	  /**
	   * Iterate over each mapping between an original source/line/column and a
	   * generated line/column in this source map.
	   *
	   * @param Function aCallback
	   *        The function that is called with each mapping.
	   * @param Object aContext
	   *        Optional. If specified, this object will be the value of `this` every
	   *        time that `aCallback` is called.
	   * @param aOrder
	   *        Either `SourceMapConsumer.GENERATED_ORDER` or
	   *        `SourceMapConsumer.ORIGINAL_ORDER`. Specifies whether you want to
	   *        iterate over the mappings sorted by the generated file's line/column
	   *        order or the original's source/line/column order, respectively. Defaults to
	   *        `SourceMapConsumer.GENERATED_ORDER`.
	   */
	  SourceMapConsumer.prototype.eachMapping =
	    function SourceMapConsumer_eachMapping(aCallback, aContext, aOrder) {
	      var context = aContext || null;
	      var order = aOrder || SourceMapConsumer.GENERATED_ORDER;

	      var mappings;
	      switch (order) {
	      case SourceMapConsumer.GENERATED_ORDER:
	        mappings = this._generatedMappings;
	        break;
	      case SourceMapConsumer.ORIGINAL_ORDER:
	        mappings = this._originalMappings;
	        break;
	      default:
	        throw new Error("Unknown order of iteration.");
	      }

	      var sourceRoot = this.sourceRoot;
	      mappings.map(function (mapping) {
	        var source = mapping.source;
	        if (source != null && sourceRoot != null) {
	          source = util.join(sourceRoot, source);
	        }
	        return {
	          source: source,
	          generatedLine: mapping.generatedLine,
	          generatedColumn: mapping.generatedColumn,
	          originalLine: mapping.originalLine,
	          originalColumn: mapping.originalColumn,
	          name: mapping.name
	        };
	      }).forEach(aCallback, context);
	    };

	  exports.SourceMapConsumer = SourceMapConsumer;

	}.call(exports, __webpack_require__, exports, module), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ },
/* 55 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_RESULT__;/* -*- Mode: js; js-indent-level: 2; -*- */
	/*
	 * Copyright 2011 Mozilla Foundation and contributors
	 * Licensed under the New BSD license. See LICENSE or:
	 * http://opensource.org/licenses/BSD-3-Clause
	 */
	if (false) {
	    var define = require('amdefine')(module, require);
	}
	!(__WEBPACK_AMD_DEFINE_RESULT__ = function (require, exports, module) {

	  var SourceMapGenerator = __webpack_require__(53).SourceMapGenerator;
	  var util = __webpack_require__(67);

	  // Matches a Windows-style `\r\n` newline or a `\n` newline used by all other
	  // operating systems these days (capturing the result).
	  var REGEX_NEWLINE = /(\r?\n)/;

	  // Newline character code for charCodeAt() comparisons
	  var NEWLINE_CODE = 10;

	  // Private symbol for identifying `SourceNode`s when multiple versions of
	  // the source-map library are loaded. This MUST NOT CHANGE across
	  // versions!
	  var isSourceNode = "$$$isSourceNode$$$";

	  /**
	   * SourceNodes provide a way to abstract over interpolating/concatenating
	   * snippets of generated JavaScript source code while maintaining the line and
	   * column information associated with the original source code.
	   *
	   * @param aLine The original line number.
	   * @param aColumn The original column number.
	   * @param aSource The original source's filename.
	   * @param aChunks Optional. An array of strings which are snippets of
	   *        generated JS, or other SourceNodes.
	   * @param aName The original identifier.
	   */
	  function SourceNode(aLine, aColumn, aSource, aChunks, aName) {
	    this.children = [];
	    this.sourceContents = {};
	    this.line = aLine == null ? null : aLine;
	    this.column = aColumn == null ? null : aColumn;
	    this.source = aSource == null ? null : aSource;
	    this.name = aName == null ? null : aName;
	    this[isSourceNode] = true;
	    if (aChunks != null) this.add(aChunks);
	  }

	  /**
	   * Creates a SourceNode from generated code and a SourceMapConsumer.
	   *
	   * @param aGeneratedCode The generated code
	   * @param aSourceMapConsumer The SourceMap for the generated code
	   * @param aRelativePath Optional. The path that relative sources in the
	   *        SourceMapConsumer should be relative to.
	   */
	  SourceNode.fromStringWithSourceMap =
	    function SourceNode_fromStringWithSourceMap(aGeneratedCode, aSourceMapConsumer, aRelativePath) {
	      // The SourceNode we want to fill with the generated code
	      // and the SourceMap
	      var node = new SourceNode();

	      // All even indices of this array are one line of the generated code,
	      // while all odd indices are the newlines between two adjacent lines
	      // (since `REGEX_NEWLINE` captures its match).
	      // Processed fragments are removed from this array, by calling `shiftNextLine`.
	      var remainingLines = aGeneratedCode.split(REGEX_NEWLINE);
	      var shiftNextLine = function() {
	        var lineContents = remainingLines.shift();
	        // The last line of a file might not have a newline.
	        var newLine = remainingLines.shift() || "";
	        return lineContents + newLine;
	      };

	      // We need to remember the position of "remainingLines"
	      var lastGeneratedLine = 1, lastGeneratedColumn = 0;

	      // The generate SourceNodes we need a code range.
	      // To extract it current and last mapping is used.
	      // Here we store the last mapping.
	      var lastMapping = null;

	      aSourceMapConsumer.eachMapping(function (mapping) {
	        if (lastMapping !== null) {
	          // We add the code from "lastMapping" to "mapping":
	          // First check if there is a new line in between.
	          if (lastGeneratedLine < mapping.generatedLine) {
	            var code = "";
	            // Associate first line with "lastMapping"
	            addMappingWithCode(lastMapping, shiftNextLine());
	            lastGeneratedLine++;
	            lastGeneratedColumn = 0;
	            // The remaining code is added without mapping
	          } else {
	            // There is no new line in between.
	            // Associate the code between "lastGeneratedColumn" and
	            // "mapping.generatedColumn" with "lastMapping"
	            var nextLine = remainingLines[0];
	            var code = nextLine.substr(0, mapping.generatedColumn -
	                                          lastGeneratedColumn);
	            remainingLines[0] = nextLine.substr(mapping.generatedColumn -
	                                                lastGeneratedColumn);
	            lastGeneratedColumn = mapping.generatedColumn;
	            addMappingWithCode(lastMapping, code);
	            // No more remaining code, continue
	            lastMapping = mapping;
	            return;
	          }
	        }
	        // We add the generated code until the first mapping
	        // to the SourceNode without any mapping.
	        // Each line is added as separate string.
	        while (lastGeneratedLine < mapping.generatedLine) {
	          node.add(shiftNextLine());
	          lastGeneratedLine++;
	        }
	        if (lastGeneratedColumn < mapping.generatedColumn) {
	          var nextLine = remainingLines[0];
	          node.add(nextLine.substr(0, mapping.generatedColumn));
	          remainingLines[0] = nextLine.substr(mapping.generatedColumn);
	          lastGeneratedColumn = mapping.generatedColumn;
	        }
	        lastMapping = mapping;
	      }, this);
	      // We have processed all mappings.
	      if (remainingLines.length > 0) {
	        if (lastMapping) {
	          // Associate the remaining code in the current line with "lastMapping"
	          addMappingWithCode(lastMapping, shiftNextLine());
	        }
	        // and add the remaining lines without any mapping
	        node.add(remainingLines.join(""));
	      }

	      // Copy sourcesContent into SourceNode
	      aSourceMapConsumer.sources.forEach(function (sourceFile) {
	        var content = aSourceMapConsumer.sourceContentFor(sourceFile);
	        if (content != null) {
	          if (aRelativePath != null) {
	            sourceFile = util.join(aRelativePath, sourceFile);
	          }
	          node.setSourceContent(sourceFile, content);
	        }
	      });

	      return node;

	      function addMappingWithCode(mapping, code) {
	        if (mapping === null || mapping.source === undefined) {
	          node.add(code);
	        } else {
	          var source = aRelativePath
	            ? util.join(aRelativePath, mapping.source)
	            : mapping.source;
	          node.add(new SourceNode(mapping.originalLine,
	                                  mapping.originalColumn,
	                                  source,
	                                  code,
	                                  mapping.name));
	        }
	      }
	    };

	  /**
	   * Add a chunk of generated JS to this source node.
	   *
	   * @param aChunk A string snippet of generated JS code, another instance of
	   *        SourceNode, or an array where each member is one of those things.
	   */
	  SourceNode.prototype.add = function SourceNode_add(aChunk) {
	    if (Array.isArray(aChunk)) {
	      aChunk.forEach(function (chunk) {
	        this.add(chunk);
	      }, this);
	    }
	    else if (aChunk[isSourceNode] || typeof aChunk === "string") {
	      if (aChunk) {
	        this.children.push(aChunk);
	      }
	    }
	    else {
	      throw new TypeError(
	        "Expected a SourceNode, string, or an array of SourceNodes and strings. Got " + aChunk
	      );
	    }
	    return this;
	  };

	  /**
	   * Add a chunk of generated JS to the beginning of this source node.
	   *
	   * @param aChunk A string snippet of generated JS code, another instance of
	   *        SourceNode, or an array where each member is one of those things.
	   */
	  SourceNode.prototype.prepend = function SourceNode_prepend(aChunk) {
	    if (Array.isArray(aChunk)) {
	      for (var i = aChunk.length-1; i >= 0; i--) {
	        this.prepend(aChunk[i]);
	      }
	    }
	    else if (aChunk[isSourceNode] || typeof aChunk === "string") {
	      this.children.unshift(aChunk);
	    }
	    else {
	      throw new TypeError(
	        "Expected a SourceNode, string, or an array of SourceNodes and strings. Got " + aChunk
	      );
	    }
	    return this;
	  };

	  /**
	   * Walk over the tree of JS snippets in this node and its children. The
	   * walking function is called once for each snippet of JS and is passed that
	   * snippet and the its original associated source's line/column location.
	   *
	   * @param aFn The traversal function.
	   */
	  SourceNode.prototype.walk = function SourceNode_walk(aFn) {
	    var chunk;
	    for (var i = 0, len = this.children.length; i < len; i++) {
	      chunk = this.children[i];
	      if (chunk[isSourceNode]) {
	        chunk.walk(aFn);
	      }
	      else {
	        if (chunk !== '') {
	          aFn(chunk, { source: this.source,
	                       line: this.line,
	                       column: this.column,
	                       name: this.name });
	        }
	      }
	    }
	  };

	  /**
	   * Like `String.prototype.join` except for SourceNodes. Inserts `aStr` between
	   * each of `this.children`.
	   *
	   * @param aSep The separator.
	   */
	  SourceNode.prototype.join = function SourceNode_join(aSep) {
	    var newChildren;
	    var i;
	    var len = this.children.length;
	    if (len > 0) {
	      newChildren = [];
	      for (i = 0; i < len-1; i++) {
	        newChildren.push(this.children[i]);
	        newChildren.push(aSep);
	      }
	      newChildren.push(this.children[i]);
	      this.children = newChildren;
	    }
	    return this;
	  };

	  /**
	   * Call String.prototype.replace on the very right-most source snippet. Useful
	   * for trimming whitespace from the end of a source node, etc.
	   *
	   * @param aPattern The pattern to replace.
	   * @param aReplacement The thing to replace the pattern with.
	   */
	  SourceNode.prototype.replaceRight = function SourceNode_replaceRight(aPattern, aReplacement) {
	    var lastChild = this.children[this.children.length - 1];
	    if (lastChild[isSourceNode]) {
	      lastChild.replaceRight(aPattern, aReplacement);
	    }
	    else if (typeof lastChild === 'string') {
	      this.children[this.children.length - 1] = lastChild.replace(aPattern, aReplacement);
	    }
	    else {
	      this.children.push(''.replace(aPattern, aReplacement));
	    }
	    return this;
	  };

	  /**
	   * Set the source content for a source file. This will be added to the SourceMapGenerator
	   * in the sourcesContent field.
	   *
	   * @param aSourceFile The filename of the source file
	   * @param aSourceContent The content of the source file
	   */
	  SourceNode.prototype.setSourceContent =
	    function SourceNode_setSourceContent(aSourceFile, aSourceContent) {
	      this.sourceContents[util.toSetString(aSourceFile)] = aSourceContent;
	    };

	  /**
	   * Walk over the tree of SourceNodes. The walking function is called for each
	   * source file content and is passed the filename and source content.
	   *
	   * @param aFn The traversal function.
	   */
	  SourceNode.prototype.walkSourceContents =
	    function SourceNode_walkSourceContents(aFn) {
	      for (var i = 0, len = this.children.length; i < len; i++) {
	        if (this.children[i][isSourceNode]) {
	          this.children[i].walkSourceContents(aFn);
	        }
	      }

	      var sources = Object.keys(this.sourceContents);
	      for (var i = 0, len = sources.length; i < len; i++) {
	        aFn(util.fromSetString(sources[i]), this.sourceContents[sources[i]]);
	      }
	    };

	  /**
	   * Return the string representation of this source node. Walks over the tree
	   * and concatenates all the various snippets together to one string.
	   */
	  SourceNode.prototype.toString = function SourceNode_toString() {
	    var str = "";
	    this.walk(function (chunk) {
	      str += chunk;
	    });
	    return str;
	  };

	  /**
	   * Returns the string representation of this source node along with a source
	   * map.
	   */
	  SourceNode.prototype.toStringWithSourceMap = function SourceNode_toStringWithSourceMap(aArgs) {
	    var generated = {
	      code: "",
	      line: 1,
	      column: 0
	    };
	    var map = new SourceMapGenerator(aArgs);
	    var sourceMappingActive = false;
	    var lastOriginalSource = null;
	    var lastOriginalLine = null;
	    var lastOriginalColumn = null;
	    var lastOriginalName = null;
	    this.walk(function (chunk, original) {
	      generated.code += chunk;
	      if (original.source !== null
	          && original.line !== null
	          && original.column !== null) {
	        if(lastOriginalSource !== original.source
	           || lastOriginalLine !== original.line
	           || lastOriginalColumn !== original.column
	           || lastOriginalName !== original.name) {
	          map.addMapping({
	            source: original.source,
	            original: {
	              line: original.line,
	              column: original.column
	            },
	            generated: {
	              line: generated.line,
	              column: generated.column
	            },
	            name: original.name
	          });
	        }
	        lastOriginalSource = original.source;
	        lastOriginalLine = original.line;
	        lastOriginalColumn = original.column;
	        lastOriginalName = original.name;
	        sourceMappingActive = true;
	      } else if (sourceMappingActive) {
	        map.addMapping({
	          generated: {
	            line: generated.line,
	            column: generated.column
	          }
	        });
	        lastOriginalSource = null;
	        sourceMappingActive = false;
	      }
	      for (var idx = 0, length = chunk.length; idx < length; idx++) {
	        if (chunk.charCodeAt(idx) === NEWLINE_CODE) {
	          generated.line++;
	          generated.column = 0;
	          // Mappings end at eol
	          if (idx + 1 === length) {
	            lastOriginalSource = null;
	            sourceMappingActive = false;
	          } else if (sourceMappingActive) {
	            map.addMapping({
	              source: original.source,
	              original: {
	                line: original.line,
	                column: original.column
	              },
	              generated: {
	                line: generated.line,
	                column: generated.column
	              },
	              name: original.name
	            });
	          }
	        } else {
	          generated.column++;
	        }
	      }
	    });
	    this.walkSourceContents(function (sourceFile, sourceContent) {
	      map.setSourceContent(sourceFile, sourceContent);
	    });

	    return { code: generated.code, map: map };
	  };

	  exports.SourceNode = SourceNode;

	}.call(exports, __webpack_require__, exports, module), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ },
/* 56 */
/***/ function(module, exports, __webpack_require__) {

	// Generated by CoffeeScript 1.7.1
	(function() {
	  var CoffeeScript, compile, runScripts,
	    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

	  CoffeeScript = __webpack_require__(44);

	  CoffeeScript.require = __webpack_require__(50);

	  compile = CoffeeScript.compile;

	  CoffeeScript["eval"] = function(code, options) {
	    if (options == null) {
	      options = {};
	    }
	    if (options.bare == null) {
	      options.bare = true;
	    }
	    return eval(compile(code, options));
	  };

	  CoffeeScript.run = function(code, options) {
	    if (options == null) {
	      options = {};
	    }
	    options.bare = true;
	    options.shiftLine = true;
	    return Function(compile(code, options))();
	  };

	  if (typeof window === "undefined" || window === null) {
	    return;
	  }

	  if ((typeof btoa !== "undefined" && btoa !== null) && (typeof JSON !== "undefined" && JSON !== null) && (typeof unescape !== "undefined" && unescape !== null) && (typeof encodeURIComponent !== "undefined" && encodeURIComponent !== null)) {
	    compile = function(code, options) {
	      var js, v3SourceMap, _ref;
	      if (options == null) {
	        options = {};
	      }
	      options.sourceMap = true;
	      options.inline = true;
	      _ref = CoffeeScript.compile(code, options), js = _ref.js, v3SourceMap = _ref.v3SourceMap;
	      return "" + js + "\n//# sourceMappingURL=data:application/json;base64," + (btoa(unescape(encodeURIComponent(v3SourceMap)))) + "\n//# sourceURL=coffeescript";
	    };
	  }

	  CoffeeScript.load = function(url, callback, options, hold) {
	    var xhr;
	    if (options == null) {
	      options = {};
	    }
	    if (hold == null) {
	      hold = false;
	    }
	    options.sourceFiles = [url];
	    xhr = window.ActiveXObject ? new window.ActiveXObject('Microsoft.XMLHTTP') : new window.XMLHttpRequest();
	    xhr.open('GET', url, true);
	    if ('overrideMimeType' in xhr) {
	      xhr.overrideMimeType('text/plain');
	    }
	    xhr.onreadystatechange = function() {
	      var param, _ref;
	      if (xhr.readyState === 4) {
	        if ((_ref = xhr.status) === 0 || _ref === 200) {
	          param = [xhr.responseText, options];
	          if (!hold) {
	            CoffeeScript.run.apply(CoffeeScript, param);
	          }
	        } else {
	          throw new Error("Could not load " + url);
	        }
	        if (callback) {
	          return callback(param);
	        }
	      }
	    };
	    return xhr.send(null);
	  };

	  runScripts = function() {
	    var coffees, coffeetypes, execute, i, index, s, script, scripts, _fn, _i, _len;
	    scripts = window.document.getElementsByTagName('script');
	    coffeetypes = ['text/coffeescript', 'text/literate-coffeescript'];
	    coffees = (function() {
	      var _i, _len, _ref, _results;
	      _results = [];
	      for (_i = 0, _len = scripts.length; _i < _len; _i++) {
	        s = scripts[_i];
	        if (_ref = s.type, __indexOf.call(coffeetypes, _ref) >= 0) {
	          _results.push(s);
	        }
	      }
	      return _results;
	    })();
	    index = 0;
	    execute = function() {
	      var param;
	      param = coffees[index];
	      if (param instanceof Array) {
	        CoffeeScript.run.apply(CoffeeScript, param);
	        index++;
	        return execute();
	      }
	    };
	    _fn = function(script, i) {
	      var options;
	      options = {
	        literate: script.type === coffeetypes[1]
	      };
	      if (script.src) {
	        return CoffeeScript.load(script.src, function(param) {
	          coffees[i] = param;
	          return execute();
	        }, options, true);
	      } else {
	        options.sourceFiles = ['embedded'];
	        return coffees[i] = [script.innerHTML, options];
	      }
	    };
	    for (i = _i = 0, _len = coffees.length; _i < _len; i = ++_i) {
	      script = coffees[i];
	      _fn(script, i);
	    }
	    return execute();
	  };

	  if (window.addEventListener) {
	    window.addEventListener('DOMContentLoaded', runScripts, false);
	  } else {
	    window.attachEvent('onload', runScripts);
	  }

	}).call(this);


/***/ },
/* 57 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(global, process) {// Generated by CoffeeScript 1.7.1
	(function() {
	  var CoffeeScript, cakefileDirectory, fatalError, fs, helpers, missingTask, oparse, options, optparse, path, printTasks, switches, tasks;

	  fs = __webpack_require__(!(function webpackMissingModule() { var e = new Error("Cannot find module \"fs\""); e.code = 'MODULE_NOT_FOUND'; throw e; }()));

	  path = __webpack_require__(42);

	  helpers = __webpack_require__(48);

	  optparse = __webpack_require__(61);

	  CoffeeScript = __webpack_require__(44);

	  tasks = {};

	  options = {};

	  switches = [];

	  oparse = null;

	  helpers.extend(global, {
	    task: function(name, description, action) {
	      var _ref;
	      if (!action) {
	        _ref = [description, action], action = _ref[0], description = _ref[1];
	      }
	      return tasks[name] = {
	        name: name,
	        description: description,
	        action: action
	      };
	    },
	    option: function(letter, flag, description) {
	      return switches.push([letter, flag, description]);
	    },
	    invoke: function(name) {
	      if (!tasks[name]) {
	        missingTask(name);
	      }
	      return tasks[name].action(options);
	    }
	  });

	  exports.run = function() {
	    var arg, args, e, _i, _len, _ref, _results;
	    global.__originalDirname = fs.realpathSync('.');
	    process.chdir(cakefileDirectory(__originalDirname));
	    args = process.argv.slice(2);
	    CoffeeScript.run(fs.readFileSync('Cakefile').toString(), {
	      filename: 'Cakefile'
	    });
	    oparse = new optparse.OptionParser(switches);
	    if (!args.length) {
	      return printTasks();
	    }
	    try {
	      options = oparse.parse(args);
	    } catch (_error) {
	      e = _error;
	      return fatalError("" + e);
	    }
	    _ref = options["arguments"];
	    _results = [];
	    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
	      arg = _ref[_i];
	      _results.push(invoke(arg));
	    }
	    return _results;
	  };

	  printTasks = function() {
	    var cakefilePath, desc, name, relative, spaces, task;
	    relative = path.relative || path.resolve;
	    cakefilePath = path.join(relative(__originalDirname, process.cwd()), 'Cakefile');
	    console.log("" + cakefilePath + " defines the following tasks:\n");
	    for (name in tasks) {
	      task = tasks[name];
	      spaces = 20 - name.length;
	      spaces = spaces > 0 ? Array(spaces + 1).join(' ') : '';
	      desc = task.description ? "# " + task.description : '';
	      console.log("cake " + name + spaces + " " + desc);
	    }
	    if (switches.length) {
	      return console.log(oparse.help());
	    }
	  };

	  fatalError = function(message) {
	    console.error(message + '\n');
	    console.log('To see a list of all tasks/options, run "cake"');
	    return process.exit(1);
	  };

	  missingTask = function(task) {
	    return fatalError("No such task: " + task);
	  };

	  cakefileDirectory = function(dir) {
	    var parent;
	    if (fs.existsSync(path.join(dir, 'Cakefile'))) {
	      return dir;
	    }
	    parent = path.normalize(path.join(dir, '..'));
	    if (parent !== dir) {
	      return cakefileDirectory(parent);
	    }
	    throw new Error("Cakefile not found in " + (process.cwd()));
	  };

	}).call(this);
	
	/* WEBPACK VAR INJECTION */}.call(exports, (function() { return this; }()), __webpack_require__(30)))

/***/ },
/* 58 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(process) {// Generated by CoffeeScript 1.7.1
	(function() {
	  var BANNER, CoffeeScript, EventEmitter, SWITCHES, compileJoin, compileOptions, compilePath, compileScript, compileStdio, exec, findDirectoryIndex, forkNode, fs, helpers, hidden, joinTimeout, mkdirp, notSources, optionParser, optparse, opts, outputPath, parseOptions, path, printLine, printTokens, printWarn, removeSource, removeSourceDir, silentUnlink, sourceCode, sources, spawn, timeLog, usage, useWinPathSep, version, wait, watch, watchDir, watchedDirs, writeJs, _ref,
	    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

	  fs = __webpack_require__(!(function webpackMissingModule() { var e = new Error("Cannot find module \"fs\""); e.code = 'MODULE_NOT_FOUND'; throw e; }()));

	  path = __webpack_require__(42);

	  helpers = __webpack_require__(48);

	  optparse = __webpack_require__(61);

	  CoffeeScript = __webpack_require__(44);

	  mkdirp = __webpack_require__(74);

	  _ref = __webpack_require__(!(function webpackMissingModule() { var e = new Error("Cannot find module \"child_process\""); e.code = 'MODULE_NOT_FOUND'; throw e; }())), spawn = _ref.spawn, exec = _ref.exec;

	  EventEmitter = __webpack_require__(75).EventEmitter;

	  useWinPathSep = path.sep === '\\';

	  helpers.extend(CoffeeScript, new EventEmitter);

	  printLine = function(line) {
	    return process.stdout.write(line + '\n');
	  };

	  printWarn = function(line) {
	    return process.stderr.write(line + '\n');
	  };

	  hidden = function(file) {
	    return /^\.|~$/.test(file);
	  };

	  BANNER = 'Usage: coffee [options] path/to/script.coffee -- [args]\n\nIf called without options, `coffee` will run your script.';

	  SWITCHES = [['-b', '--bare', 'compile without a top-level function wrapper'], ['-c', '--compile', 'compile to JavaScript and save as .js files'], ['-e', '--eval', 'pass a string from the command line as input'], ['-h', '--help', 'display this help message'], ['-i', '--interactive', 'run an interactive CoffeeScript REPL'], ['-j', '--join [FILE]', 'concatenate the source CoffeeScript before compiling'], ['-m', '--map', 'generate source map and save as .map files'], ['-n', '--nodes', 'print out the parse tree that the parser produces'], ['--nodejs [ARGS]', 'pass options directly to the "node" binary'], ['--no-header', 'suppress the "Generated by" header'], ['-o', '--output [DIR]', 'set the output directory for compiled JavaScript'], ['-p', '--print', 'print out the compiled JavaScript'], ['-s', '--stdio', 'listen for and compile scripts over stdio'], ['-l', '--literate', 'treat stdio as literate style coffee-script'], ['-t', '--tokens', 'print out the tokens that the lexer/rewriter produce'], ['-v', '--version', 'display the version number'], ['-w', '--watch', 'watch scripts for changes and rerun commands']];

	  opts = {};

	  sources = [];

	  sourceCode = [];

	  notSources = {};

	  watchedDirs = {};

	  optionParser = null;

	  exports.run = function() {
	    var literals, replCliOpts, source, _i, _len, _ref1, _results;
	    parseOptions();
	    replCliOpts = {
	      useGlobal: true
	    };
	    if (opts.nodejs) {
	      return forkNode();
	    }
	    if (opts.help) {
	      return usage();
	    }
	    if (opts.version) {
	      return version();
	    }
	    if (opts.interactive) {
	      return __webpack_require__(62).start(replCliOpts);
	    }
	    if (opts.stdio) {
	      return compileStdio();
	    }
	    if (opts["eval"]) {
	      return compileScript(null, opts["arguments"][0]);
	    }
	    if (!opts["arguments"].length) {
	      return __webpack_require__(62).start(replCliOpts);
	    }
	    literals = opts.run ? opts["arguments"].splice(1) : [];
	    process.argv = process.argv.slice(0, 2).concat(literals);
	    process.argv[0] = 'coffee';
	    if (opts.output) {
	      opts.output = path.resolve(opts.output);
	    }
	    if (opts.join) {
	      opts.join = path.resolve(opts.join);
	    }
	    _ref1 = opts["arguments"];
	    _results = [];
	    for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
	      source = _ref1[_i];
	      source = path.resolve(source);
	      _results.push(compilePath(source, true, source));
	    }
	    return _results;
	  };

	  compilePath = function(source, topLevel, base) {
	    var code, err, file, files, stats, _i, _len, _results;
	    if (__indexOf.call(sources, source) >= 0 || watchedDirs[source] || !topLevel && (notSources[source] || hidden(source))) {
	      return;
	    }
	    try {
	      stats = fs.statSync(source);
	    } catch (_error) {
	      err = _error;
	      if (err.code === 'ENOENT') {
	        console.error("File not found: " + source);
	        process.exit(1);
	      }
	      throw err;
	    }
	    if (stats.isDirectory()) {
	      if (path.basename(source) === 'node_modules') {
	        notSources[source] = true;
	        return;
	      }
	      if (opts.run) {
	        compilePath(findDirectoryIndex(source), topLevel, base);
	        return;
	      }
	      if (opts.watch) {
	        watchDir(source, base);
	      }
	      try {
	        files = fs.readdirSync(source);
	      } catch (_error) {
	        err = _error;
	        if (err.code === 'ENOENT') {
	          return;
	        } else {
	          throw err;
	        }
	      }
	      _results = [];
	      for (_i = 0, _len = files.length; _i < _len; _i++) {
	        file = files[_i];
	        _results.push(compilePath(path.join(source, file), false, base));
	      }
	      return _results;
	    } else if (topLevel || helpers.isCoffee(source)) {
	      sources.push(source);
	      sourceCode.push(null);
	      delete notSources[source];
	      if (opts.watch) {
	        watch(source, base);
	      }
	      try {
	        code = fs.readFileSync(source);
	      } catch (_error) {
	        err = _error;
	        if (err.code === 'ENOENT') {
	          return;
	        } else {
	          throw err;
	        }
	      }
	      return compileScript(source, code.toString(), base);
	    } else {
	      return notSources[source] = true;
	    }
	  };

	  findDirectoryIndex = function(source) {
	    var err, ext, index, _i, _len, _ref1;
	    _ref1 = CoffeeScript.FILE_EXTENSIONS;
	    for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
	      ext = _ref1[_i];
	      index = path.join(source, "index" + ext);
	      try {
	        if ((fs.statSync(index)).isFile()) {
	          return index;
	        }
	      } catch (_error) {
	        err = _error;
	        if (err.code !== 'ENOENT') {
	          throw err;
	        }
	      }
	    }
	    console.error("Missing index.coffee or index.litcoffee in " + source);
	    return process.exit(1);
	  };

	  compileScript = function(file, input, base) {
	    var compiled, err, message, o, options, t, task;
	    if (base == null) {
	      base = null;
	    }
	    o = opts;
	    options = compileOptions(file, base);
	    try {
	      t = task = {
	        file: file,
	        input: input,
	        options: options
	      };
	      CoffeeScript.emit('compile', task);
	      if (o.tokens) {
	        return printTokens(CoffeeScript.tokens(t.input, t.options));
	      } else if (o.nodes) {
	        return printLine(CoffeeScript.nodes(t.input, t.options).toString().trim());
	      } else if (o.run) {
	        CoffeeScript.register();
	        return CoffeeScript.run(t.input, t.options);
	      } else if (o.join && t.file !== o.join) {
	        if (helpers.isLiterate(file)) {
	          t.input = helpers.invertLiterate(t.input);
	        }
	        sourceCode[sources.indexOf(t.file)] = t.input;
	        return compileJoin();
	      } else {
	        compiled = CoffeeScript.compile(t.input, t.options);
	        t.output = compiled;
	        if (o.map) {
	          t.output = compiled.js;
	          t.sourceMap = compiled.v3SourceMap;
	        }
	        CoffeeScript.emit('success', task);
	        if (o.print) {
	          return printLine(t.output.trim());
	        } else if (o.compile || o.map) {
	          return writeJs(base, t.file, t.output, options.jsPath, t.sourceMap);
	        }
	      }
	    } catch (_error) {
	      err = _error;
	      CoffeeScript.emit('failure', err, task);
	      if (CoffeeScript.listeners('failure').length) {
	        return;
	      }
	      message = err.stack || ("" + err);
	      if (o.watch) {
	        return printLine(message + '\x07');
	      } else {
	        printWarn(message);
	        return process.exit(1);
	      }
	    }
	  };

	  compileStdio = function() {
	    var code, stdin;
	    code = '';
	    stdin = process.openStdin();
	    stdin.on('data', function(buffer) {
	      if (buffer) {
	        return code += buffer.toString();
	      }
	    });
	    return stdin.on('end', function() {
	      return compileScript(null, code);
	    });
	  };

	  joinTimeout = null;

	  compileJoin = function() {
	    if (!opts.join) {
	      return;
	    }
	    if (!sourceCode.some(function(code) {
	      return code === null;
	    })) {
	      clearTimeout(joinTimeout);
	      return joinTimeout = wait(100, function() {
	        return compileScript(opts.join, sourceCode.join('\n'), opts.join);
	      });
	    }
	  };

	  watch = function(source, base) {
	    var compile, compileTimeout, err, prevStats, rewatch, startWatcher, watchErr, watcher;
	    watcher = null;
	    prevStats = null;
	    compileTimeout = null;
	    watchErr = function(err) {
	      if (err.code !== 'ENOENT') {
	        throw err;
	      }
	      if (__indexOf.call(sources, source) < 0) {
	        return;
	      }
	      try {
	        rewatch();
	        return compile();
	      } catch (_error) {
	        removeSource(source, base);
	        return compileJoin();
	      }
	    };
	    compile = function() {
	      clearTimeout(compileTimeout);
	      return compileTimeout = wait(25, function() {
	        return fs.stat(source, function(err, stats) {
	          if (err) {
	            return watchErr(err);
	          }
	          if (prevStats && stats.size === prevStats.size && stats.mtime.getTime() === prevStats.mtime.getTime()) {
	            return rewatch();
	          }
	          prevStats = stats;
	          return fs.readFile(source, function(err, code) {
	            if (err) {
	              return watchErr(err);
	            }
	            compileScript(source, code.toString(), base);
	            return rewatch();
	          });
	        });
	      });
	    };
	    startWatcher = function() {
	      return watcher = fs.watch(source).on('change', compile).on('error', function(err) {
	        if (err.code !== 'EPERM') {
	          throw err;
	        }
	        return removeSource(source, base);
	      });
	    };
	    rewatch = function() {
	      if (watcher != null) {
	        watcher.close();
	      }
	      return startWatcher();
	    };
	    try {
	      return startWatcher();
	    } catch (_error) {
	      err = _error;
	      return watchErr(err);
	    }
	  };

	  watchDir = function(source, base) {
	    var err, readdirTimeout, startWatcher, stopWatcher, watcher;
	    watcher = null;
	    readdirTimeout = null;
	    startWatcher = function() {
	      return watcher = fs.watch(source).on('error', function(err) {
	        if (err.code !== 'EPERM') {
	          throw err;
	        }
	        return stopWatcher();
	      }).on('change', function() {
	        clearTimeout(readdirTimeout);
	        return readdirTimeout = wait(25, function() {
	          var err, file, files, _i, _len, _results;
	          try {
	            files = fs.readdirSync(source);
	          } catch (_error) {
	            err = _error;
	            if (err.code !== 'ENOENT') {
	              throw err;
	            }
	            return stopWatcher();
	          }
	          _results = [];
	          for (_i = 0, _len = files.length; _i < _len; _i++) {
	            file = files[_i];
	            _results.push(compilePath(path.join(source, file), false, base));
	          }
	          return _results;
	        });
	      });
	    };
	    stopWatcher = function() {
	      watcher.close();
	      return removeSourceDir(source, base);
	    };
	    watchedDirs[source] = true;
	    try {
	      return startWatcher();
	    } catch (_error) {
	      err = _error;
	      if (err.code !== 'ENOENT') {
	        throw err;
	      }
	    }
	  };

	  removeSourceDir = function(source, base) {
	    var file, sourcesChanged, _i, _len;
	    delete watchedDirs[source];
	    sourcesChanged = false;
	    for (_i = 0, _len = sources.length; _i < _len; _i++) {
	      file = sources[_i];
	      if (!(source === path.dirname(file))) {
	        continue;
	      }
	      removeSource(file, base);
	      sourcesChanged = true;
	    }
	    if (sourcesChanged) {
	      return compileJoin();
	    }
	  };

	  removeSource = function(source, base) {
	    var index;
	    index = sources.indexOf(source);
	    sources.splice(index, 1);
	    sourceCode.splice(index, 1);
	    if (!opts.join) {
	      silentUnlink(outputPath(source, base));
	      silentUnlink(outputPath(source, base, '.map'));
	      return timeLog("removed " + source);
	    }
	  };

	  silentUnlink = function(path) {
	    var err, _ref1;
	    try {
	      return fs.unlinkSync(path);
	    } catch (_error) {
	      err = _error;
	      if ((_ref1 = err.code) !== 'ENOENT' && _ref1 !== 'EPERM') {
	        throw err;
	      }
	    }
	  };

	  outputPath = function(source, base, extension) {
	    var basename, dir, srcDir;
	    if (extension == null) {
	      extension = ".js";
	    }
	    basename = helpers.baseFileName(source, true, useWinPathSep);
	    srcDir = path.dirname(source);
	    if (!opts.output) {
	      dir = srcDir;
	    } else if (source === base) {
	      dir = opts.output;
	    } else {
	      dir = path.join(opts.output, path.relative(base, srcDir));
	    }
	    return path.join(dir, basename + extension);
	  };

	  writeJs = function(base, sourcePath, js, jsPath, generatedSourceMap) {
	    var compile, jsDir, sourceMapPath;
	    if (generatedSourceMap == null) {
	      generatedSourceMap = null;
	    }
	    sourceMapPath = outputPath(sourcePath, base, ".map");
	    jsDir = path.dirname(jsPath);
	    compile = function() {
	      if (opts.compile) {
	        if (js.length <= 0) {
	          js = ' ';
	        }
	        if (generatedSourceMap) {
	          js = "" + js + "\n//# sourceMappingURL=" + (helpers.baseFileName(sourceMapPath, false, useWinPathSep)) + "\n";
	        }
	        fs.writeFile(jsPath, js, function(err) {
	          if (err) {
	            return printLine(err.message);
	          } else if (opts.compile && opts.watch) {
	            return timeLog("compiled " + sourcePath);
	          }
	        });
	      }
	      if (generatedSourceMap) {
	        return fs.writeFile(sourceMapPath, generatedSourceMap, function(err) {
	          if (err) {
	            return printLine("Could not write source map: " + err.message);
	          }
	        });
	      }
	    };
	    return fs.exists(jsDir, function(itExists) {
	      if (itExists) {
	        return compile();
	      } else {
	        return mkdirp(jsDir, compile);
	      }
	    });
	  };

	  wait = function(milliseconds, func) {
	    return setTimeout(func, milliseconds);
	  };

	  timeLog = function(message) {
	    return console.log("" + ((new Date).toLocaleTimeString()) + " - " + message);
	  };

	  printTokens = function(tokens) {
	    var strings, tag, token, value;
	    strings = (function() {
	      var _i, _len, _results;
	      _results = [];
	      for (_i = 0, _len = tokens.length; _i < _len; _i++) {
	        token = tokens[_i];
	        tag = token[0];
	        value = token[1].toString().replace(/\n/, '\\n');
	        _results.push("[" + tag + " " + value + "]");
	      }
	      return _results;
	    })();
	    return printLine(strings.join(' '));
	  };

	  parseOptions = function() {
	    var o;
	    optionParser = new optparse.OptionParser(SWITCHES, BANNER);
	    o = opts = optionParser.parse(process.argv.slice(2));
	    o.compile || (o.compile = !!o.output);
	    o.run = !(o.compile || o.print || o.map);
	    return o.print = !!(o.print || (o["eval"] || o.stdio && o.compile));
	  };

	  compileOptions = function(filename, base) {
	    var answer, cwd, jsDir, jsPath;
	    answer = {
	      filename: filename,
	      literate: opts.literate || helpers.isLiterate(filename),
	      bare: opts.bare,
	      header: opts.compile && !opts['no-header'],
	      sourceMap: opts.map
	    };
	    if (filename) {
	      if (base) {
	        cwd = process.cwd();
	        jsPath = outputPath(filename, base);
	        jsDir = path.dirname(jsPath);
	        answer = helpers.merge(answer, {
	          jsPath: jsPath,
	          sourceRoot: path.relative(jsDir, cwd),
	          sourceFiles: [path.relative(cwd, filename)],
	          generatedFile: helpers.baseFileName(jsPath, false, useWinPathSep)
	        });
	      } else {
	        answer = helpers.merge(answer, {
	          sourceRoot: "",
	          sourceFiles: [helpers.baseFileName(filename, false, useWinPathSep)],
	          generatedFile: helpers.baseFileName(filename, true, useWinPathSep) + ".js"
	        });
	      }
	    }
	    return answer;
	  };

	  forkNode = function() {
	    var args, nodeArgs, p;
	    nodeArgs = opts.nodejs.split(/\s+/);
	    args = process.argv.slice(1);
	    args.splice(args.indexOf('--nodejs'), 2);
	    p = spawn(process.execPath, nodeArgs.concat(args), {
	      cwd: process.cwd(),
	      env: process.env,
	      customFds: [0, 1, 2]
	    });
	    return p.on('exit', function(code) {
	      return process.exit(code);
	    });
	  };

	  usage = function() {
	    return printLine((new optparse.OptionParser(SWITCHES, BANNER)).help());
	  };

	  version = function() {
	    return printLine("CoffeeScript version " + CoffeeScript.VERSION);
	  };

	}).call(this);
	
	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(30)))

/***/ },
/* 59 */
/***/ function(module, exports, __webpack_require__) {

	// Generated by CoffeeScript 1.7.1
	(function() {
	  var Parser, alt, alternatives, grammar, name, o, operators, token, tokens, unwrap;

	  Parser = __webpack_require__(!(function webpackMissingModule() { var e = new Error("Cannot find module \"jison\""); e.code = 'MODULE_NOT_FOUND'; throw e; }())).Parser;

	  unwrap = /^function\s*\(\)\s*\{\s*return\s*([\s\S]*);\s*\}/;

	  o = function(patternString, action, options) {
	    var addLocationDataFn, match, patternCount;
	    patternString = patternString.replace(/\s{2,}/g, ' ');
	    patternCount = patternString.split(' ').length;
	    if (!action) {
	      return [patternString, '$$ = $1;', options];
	    }
	    action = (match = unwrap.exec(action)) ? match[1] : "(" + action + "())";
	    action = action.replace(/\bnew /g, '$&yy.');
	    action = action.replace(/\b(?:Block\.wrap|extend)\b/g, 'yy.$&');
	    addLocationDataFn = function(first, last) {
	      if (!last) {
	        return "yy.addLocationDataFn(@" + first + ")";
	      } else {
	        return "yy.addLocationDataFn(@" + first + ", @" + last + ")";
	      }
	    };
	    action = action.replace(/LOC\(([0-9]*)\)/g, addLocationDataFn('$1'));
	    action = action.replace(/LOC\(([0-9]*),\s*([0-9]*)\)/g, addLocationDataFn('$1', '$2'));
	    return [patternString, "$$ = " + (addLocationDataFn(1, patternCount)) + "(" + action + ");", options];
	  };

	  grammar = {
	    Root: [
	      o('', function() {
	        return new Block;
	      }), o('Body')
	    ],
	    Body: [
	      o('Line', function() {
	        return Block.wrap([$1]);
	      }), o('Body TERMINATOR Line', function() {
	        return $1.push($3);
	      }), o('Body TERMINATOR')
	    ],
	    Line: [o('Expression'), o('Statement')],
	    Statement: [
	      o('Return'), o('Comment'), o('STATEMENT', function() {
	        return new Literal($1);
	      })
	    ],
	    Expression: [o('Value'), o('Invocation'), o('Code'), o('Operation'), o('Assign'), o('If'), o('Try'), o('While'), o('For'), o('Switch'), o('Class'), o('Throw')],
	    Block: [
	      o('INDENT OUTDENT', function() {
	        return new Block;
	      }), o('INDENT Body OUTDENT', function() {
	        return $2;
	      })
	    ],
	    Identifier: [
	      o('IDENTIFIER', function() {
	        return new Literal($1);
	      })
	    ],
	    AlphaNumeric: [
	      o('NUMBER', function() {
	        return new Literal($1);
	      }), o('STRING', function() {
	        return new Literal($1);
	      })
	    ],
	    Literal: [
	      o('AlphaNumeric'), o('JS', function() {
	        return new Literal($1);
	      }), o('REGEX', function() {
	        return new Literal($1);
	      }), o('DEBUGGER', function() {
	        return new Literal($1);
	      }), o('UNDEFINED', function() {
	        return new Undefined;
	      }), o('NULL', function() {
	        return new Null;
	      }), o('BOOL', function() {
	        return new Bool($1);
	      })
	    ],
	    Assign: [
	      o('Assignable = Expression', function() {
	        return new Assign($1, $3);
	      }), o('Assignable = TERMINATOR Expression', function() {
	        return new Assign($1, $4);
	      }), o('Assignable = INDENT Expression OUTDENT', function() {
	        return new Assign($1, $4);
	      })
	    ],
	    AssignObj: [
	      o('ObjAssignable', function() {
	        return new Value($1);
	      }), o('ObjAssignable : Expression', function() {
	        return new Assign(LOC(1)(new Value($1)), $3, 'object');
	      }), o('ObjAssignable : INDENT Expression OUTDENT', function() {
	        return new Assign(LOC(1)(new Value($1)), $4, 'object');
	      }), o('Comment')
	    ],
	    ObjAssignable: [o('Identifier'), o('AlphaNumeric'), o('ThisProperty')],
	    Return: [
	      o('RETURN Expression', function() {
	        return new Return($2);
	      }), o('RETURN', function() {
	        return new Return;
	      })
	    ],
	    Comment: [
	      o('HERECOMMENT', function() {
	        return new Comment($1);
	      })
	    ],
	    Code: [
	      o('PARAM_START ParamList PARAM_END FuncGlyph Block', function() {
	        return new Code($2, $5, $4);
	      }), o('FuncGlyph Block', function() {
	        return new Code([], $2, $1);
	      })
	    ],
	    FuncGlyph: [
	      o('->', function() {
	        return 'func';
	      }), o('=>', function() {
	        return 'boundfunc';
	      })
	    ],
	    OptComma: [o(''), o(',')],
	    ParamList: [
	      o('', function() {
	        return [];
	      }), o('Param', function() {
	        return [$1];
	      }), o('ParamList , Param', function() {
	        return $1.concat($3);
	      }), o('ParamList OptComma TERMINATOR Param', function() {
	        return $1.concat($4);
	      }), o('ParamList OptComma INDENT ParamList OptComma OUTDENT', function() {
	        return $1.concat($4);
	      })
	    ],
	    Param: [
	      o('ParamVar', function() {
	        return new Param($1);
	      }), o('ParamVar ...', function() {
	        return new Param($1, null, true);
	      }), o('ParamVar = Expression', function() {
	        return new Param($1, $3);
	      }), o('...', function() {
	        return new Expansion;
	      })
	    ],
	    ParamVar: [o('Identifier'), o('ThisProperty'), o('Array'), o('Object')],
	    Splat: [
	      o('Expression ...', function() {
	        return new Splat($1);
	      })
	    ],
	    SimpleAssignable: [
	      o('Identifier', function() {
	        return new Value($1);
	      }), o('Value Accessor', function() {
	        return $1.add($2);
	      }), o('Invocation Accessor', function() {
	        return new Value($1, [].concat($2));
	      }), o('ThisProperty')
	    ],
	    Assignable: [
	      o('SimpleAssignable'), o('Array', function() {
	        return new Value($1);
	      }), o('Object', function() {
	        return new Value($1);
	      })
	    ],
	    Value: [
	      o('Assignable'), o('Literal', function() {
	        return new Value($1);
	      }), o('Parenthetical', function() {
	        return new Value($1);
	      }), o('Range', function() {
	        return new Value($1);
	      }), o('This')
	    ],
	    Accessor: [
	      o('.  Identifier', function() {
	        return new Access($2);
	      }), o('?. Identifier', function() {
	        return new Access($2, 'soak');
	      }), o(':: Identifier', function() {
	        return [LOC(1)(new Access(new Literal('prototype'))), LOC(2)(new Access($2))];
	      }), o('?:: Identifier', function() {
	        return [LOC(1)(new Access(new Literal('prototype'), 'soak')), LOC(2)(new Access($2))];
	      }), o('::', function() {
	        return new Access(new Literal('prototype'));
	      }), o('Index')
	    ],
	    Index: [
	      o('INDEX_START IndexValue INDEX_END', function() {
	        return $2;
	      }), o('INDEX_SOAK  Index', function() {
	        return extend($2, {
	          soak: true
	        });
	      })
	    ],
	    IndexValue: [
	      o('Expression', function() {
	        return new Index($1);
	      }), o('Slice', function() {
	        return new Slice($1);
	      })
	    ],
	    Object: [
	      o('{ AssignList OptComma }', function() {
	        return new Obj($2, $1.generated);
	      })
	    ],
	    AssignList: [
	      o('', function() {
	        return [];
	      }), o('AssignObj', function() {
	        return [$1];
	      }), o('AssignList , AssignObj', function() {
	        return $1.concat($3);
	      }), o('AssignList OptComma TERMINATOR AssignObj', function() {
	        return $1.concat($4);
	      }), o('AssignList OptComma INDENT AssignList OptComma OUTDENT', function() {
	        return $1.concat($4);
	      })
	    ],
	    Class: [
	      o('CLASS', function() {
	        return new Class;
	      }), o('CLASS Block', function() {
	        return new Class(null, null, $2);
	      }), o('CLASS EXTENDS Expression', function() {
	        return new Class(null, $3);
	      }), o('CLASS EXTENDS Expression Block', function() {
	        return new Class(null, $3, $4);
	      }), o('CLASS SimpleAssignable', function() {
	        return new Class($2);
	      }), o('CLASS SimpleAssignable Block', function() {
	        return new Class($2, null, $3);
	      }), o('CLASS SimpleAssignable EXTENDS Expression', function() {
	        return new Class($2, $4);
	      }), o('CLASS SimpleAssignable EXTENDS Expression Block', function() {
	        return new Class($2, $4, $5);
	      })
	    ],
	    Invocation: [
	      o('Value OptFuncExist Arguments', function() {
	        return new Call($1, $3, $2);
	      }), o('Invocation OptFuncExist Arguments', function() {
	        return new Call($1, $3, $2);
	      }), o('SUPER', function() {
	        return new Call('super', [new Splat(new Literal('arguments'))]);
	      }), o('SUPER Arguments', function() {
	        return new Call('super', $2);
	      })
	    ],
	    OptFuncExist: [
	      o('', function() {
	        return false;
	      }), o('FUNC_EXIST', function() {
	        return true;
	      })
	    ],
	    Arguments: [
	      o('CALL_START CALL_END', function() {
	        return [];
	      }), o('CALL_START ArgList OptComma CALL_END', function() {
	        return $2;
	      })
	    ],
	    This: [
	      o('THIS', function() {
	        return new Value(new Literal('this'));
	      }), o('@', function() {
	        return new Value(new Literal('this'));
	      })
	    ],
	    ThisProperty: [
	      o('@ Identifier', function() {
	        return new Value(LOC(1)(new Literal('this')), [LOC(2)(new Access($2))], 'this');
	      })
	    ],
	    Array: [
	      o('[ ]', function() {
	        return new Arr([]);
	      }), o('[ ArgList OptComma ]', function() {
	        return new Arr($2);
	      })
	    ],
	    RangeDots: [
	      o('..', function() {
	        return 'inclusive';
	      }), o('...', function() {
	        return 'exclusive';
	      })
	    ],
	    Range: [
	      o('[ Expression RangeDots Expression ]', function() {
	        return new Range($2, $4, $3);
	      })
	    ],
	    Slice: [
	      o('Expression RangeDots Expression', function() {
	        return new Range($1, $3, $2);
	      }), o('Expression RangeDots', function() {
	        return new Range($1, null, $2);
	      }), o('RangeDots Expression', function() {
	        return new Range(null, $2, $1);
	      }), o('RangeDots', function() {
	        return new Range(null, null, $1);
	      })
	    ],
	    ArgList: [
	      o('Arg', function() {
	        return [$1];
	      }), o('ArgList , Arg', function() {
	        return $1.concat($3);
	      }), o('ArgList OptComma TERMINATOR Arg', function() {
	        return $1.concat($4);
	      }), o('INDENT ArgList OptComma OUTDENT', function() {
	        return $2;
	      }), o('ArgList OptComma INDENT ArgList OptComma OUTDENT', function() {
	        return $1.concat($4);
	      })
	    ],
	    Arg: [
	      o('Expression'), o('Splat'), o('...', function() {
	        return new Expansion;
	      })
	    ],
	    SimpleArgs: [
	      o('Expression'), o('SimpleArgs , Expression', function() {
	        return [].concat($1, $3);
	      })
	    ],
	    Try: [
	      o('TRY Block', function() {
	        return new Try($2);
	      }), o('TRY Block Catch', function() {
	        return new Try($2, $3[0], $3[1]);
	      }), o('TRY Block FINALLY Block', function() {
	        return new Try($2, null, null, $4);
	      }), o('TRY Block Catch FINALLY Block', function() {
	        return new Try($2, $3[0], $3[1], $5);
	      })
	    ],
	    Catch: [
	      o('CATCH Identifier Block', function() {
	        return [$2, $3];
	      }), o('CATCH Object Block', function() {
	        return [LOC(2)(new Value($2)), $3];
	      }), o('CATCH Block', function() {
	        return [null, $2];
	      })
	    ],
	    Throw: [
	      o('THROW Expression', function() {
	        return new Throw($2);
	      })
	    ],
	    Parenthetical: [
	      o('( Body )', function() {
	        return new Parens($2);
	      }), o('( INDENT Body OUTDENT )', function() {
	        return new Parens($3);
	      })
	    ],
	    WhileSource: [
	      o('WHILE Expression', function() {
	        return new While($2);
	      }), o('WHILE Expression WHEN Expression', function() {
	        return new While($2, {
	          guard: $4
	        });
	      }), o('UNTIL Expression', function() {
	        return new While($2, {
	          invert: true
	        });
	      }), o('UNTIL Expression WHEN Expression', function() {
	        return new While($2, {
	          invert: true,
	          guard: $4
	        });
	      })
	    ],
	    While: [
	      o('WhileSource Block', function() {
	        return $1.addBody($2);
	      }), o('Statement  WhileSource', function() {
	        return $2.addBody(LOC(1)(Block.wrap([$1])));
	      }), o('Expression WhileSource', function() {
	        return $2.addBody(LOC(1)(Block.wrap([$1])));
	      }), o('Loop', function() {
	        return $1;
	      })
	    ],
	    Loop: [
	      o('LOOP Block', function() {
	        return new While(LOC(1)(new Literal('true'))).addBody($2);
	      }), o('LOOP Expression', function() {
	        return new While(LOC(1)(new Literal('true'))).addBody(LOC(2)(Block.wrap([$2])));
	      })
	    ],
	    For: [
	      o('Statement  ForBody', function() {
	        return new For($1, $2);
	      }), o('Expression ForBody', function() {
	        return new For($1, $2);
	      }), o('ForBody    Block', function() {
	        return new For($2, $1);
	      })
	    ],
	    ForBody: [
	      o('FOR Range', function() {
	        return {
	          source: LOC(2)(new Value($2))
	        };
	      }), o('ForStart ForSource', function() {
	        $2.own = $1.own;
	        $2.name = $1[0];
	        $2.index = $1[1];
	        return $2;
	      })
	    ],
	    ForStart: [
	      o('FOR ForVariables', function() {
	        return $2;
	      }), o('FOR OWN ForVariables', function() {
	        $3.own = true;
	        return $3;
	      })
	    ],
	    ForValue: [
	      o('Identifier'), o('ThisProperty'), o('Array', function() {
	        return new Value($1);
	      }), o('Object', function() {
	        return new Value($1);
	      })
	    ],
	    ForVariables: [
	      o('ForValue', function() {
	        return [$1];
	      }), o('ForValue , ForValue', function() {
	        return [$1, $3];
	      })
	    ],
	    ForSource: [
	      o('FORIN Expression', function() {
	        return {
	          source: $2
	        };
	      }), o('FOROF Expression', function() {
	        return {
	          source: $2,
	          object: true
	        };
	      }), o('FORIN Expression WHEN Expression', function() {
	        return {
	          source: $2,
	          guard: $4
	        };
	      }), o('FOROF Expression WHEN Expression', function() {
	        return {
	          source: $2,
	          guard: $4,
	          object: true
	        };
	      }), o('FORIN Expression BY Expression', function() {
	        return {
	          source: $2,
	          step: $4
	        };
	      }), o('FORIN Expression WHEN Expression BY Expression', function() {
	        return {
	          source: $2,
	          guard: $4,
	          step: $6
	        };
	      }), o('FORIN Expression BY Expression WHEN Expression', function() {
	        return {
	          source: $2,
	          step: $4,
	          guard: $6
	        };
	      })
	    ],
	    Switch: [
	      o('SWITCH Expression INDENT Whens OUTDENT', function() {
	        return new Switch($2, $4);
	      }), o('SWITCH Expression INDENT Whens ELSE Block OUTDENT', function() {
	        return new Switch($2, $4, $6);
	      }), o('SWITCH INDENT Whens OUTDENT', function() {
	        return new Switch(null, $3);
	      }), o('SWITCH INDENT Whens ELSE Block OUTDENT', function() {
	        return new Switch(null, $3, $5);
	      })
	    ],
	    Whens: [
	      o('When'), o('Whens When', function() {
	        return $1.concat($2);
	      })
	    ],
	    When: [
	      o('LEADING_WHEN SimpleArgs Block', function() {
	        return [[$2, $3]];
	      }), o('LEADING_WHEN SimpleArgs Block TERMINATOR', function() {
	        return [[$2, $3]];
	      })
	    ],
	    IfBlock: [
	      o('IF Expression Block', function() {
	        return new If($2, $3, {
	          type: $1
	        });
	      }), o('IfBlock ELSE IF Expression Block', function() {
	        return $1.addElse(LOC(3, 5)(new If($4, $5, {
	          type: $3
	        })));
	      })
	    ],
	    If: [
	      o('IfBlock'), o('IfBlock ELSE Block', function() {
	        return $1.addElse($3);
	      }), o('Statement  POST_IF Expression', function() {
	        return new If($3, LOC(1)(Block.wrap([$1])), {
	          type: $2,
	          statement: true
	        });
	      }), o('Expression POST_IF Expression', function() {
	        return new If($3, LOC(1)(Block.wrap([$1])), {
	          type: $2,
	          statement: true
	        });
	      })
	    ],
	    Operation: [
	      o('UNARY Expression', function() {
	        return new Op($1, $2);
	      }), o('UNARY_MATH Expression', function() {
	        return new Op($1, $2);
	      }), o('-     Expression', (function() {
	        return new Op('-', $2);
	      }), {
	        prec: 'UNARY_MATH'
	      }), o('+     Expression', (function() {
	        return new Op('+', $2);
	      }), {
	        prec: 'UNARY_MATH'
	      }), o('-- SimpleAssignable', function() {
	        return new Op('--', $2);
	      }), o('++ SimpleAssignable', function() {
	        return new Op('++', $2);
	      }), o('SimpleAssignable --', function() {
	        return new Op('--', $1, null, true);
	      }), o('SimpleAssignable ++', function() {
	        return new Op('++', $1, null, true);
	      }), o('Expression ?', function() {
	        return new Existence($1);
	      }), o('Expression +  Expression', function() {
	        return new Op('+', $1, $3);
	      }), o('Expression -  Expression', function() {
	        return new Op('-', $1, $3);
	      }), o('Expression MATH     Expression', function() {
	        return new Op($2, $1, $3);
	      }), o('Expression **       Expression', function() {
	        return new Op($2, $1, $3);
	      }), o('Expression SHIFT    Expression', function() {
	        return new Op($2, $1, $3);
	      }), o('Expression COMPARE  Expression', function() {
	        return new Op($2, $1, $3);
	      }), o('Expression LOGIC    Expression', function() {
	        return new Op($2, $1, $3);
	      }), o('Expression RELATION Expression', function() {
	        if ($2.charAt(0) === '!') {
	          return new Op($2.slice(1), $1, $3).invert();
	        } else {
	          return new Op($2, $1, $3);
	        }
	      }), o('SimpleAssignable COMPOUND_ASSIGN Expression', function() {
	        return new Assign($1, $3, $2);
	      }), o('SimpleAssignable COMPOUND_ASSIGN INDENT Expression OUTDENT', function() {
	        return new Assign($1, $4, $2);
	      }), o('SimpleAssignable COMPOUND_ASSIGN TERMINATOR Expression', function() {
	        return new Assign($1, $4, $2);
	      }), o('SimpleAssignable EXTENDS Expression', function() {
	        return new Extends($1, $3);
	      })
	    ]
	  };

	  operators = [['left', '.', '?.', '::', '?::'], ['left', 'CALL_START', 'CALL_END'], ['nonassoc', '++', '--'], ['left', '?'], ['right', 'UNARY'], ['right', '**'], ['right', 'UNARY_MATH'], ['left', 'MATH'], ['left', '+', '-'], ['left', 'SHIFT'], ['left', 'RELATION'], ['left', 'COMPARE'], ['left', 'LOGIC'], ['nonassoc', 'INDENT', 'OUTDENT'], ['right', '=', ':', 'COMPOUND_ASSIGN', 'RETURN', 'THROW', 'EXTENDS'], ['right', 'FORIN', 'FOROF', 'BY', 'WHEN'], ['right', 'IF', 'ELSE', 'FOR', 'WHILE', 'UNTIL', 'LOOP', 'SUPER', 'CLASS'], ['left', 'POST_IF']];

	  tokens = [];

	  for (name in grammar) {
	    alternatives = grammar[name];
	    grammar[name] = (function() {
	      var _i, _j, _len, _len1, _ref, _results;
	      _results = [];
	      for (_i = 0, _len = alternatives.length; _i < _len; _i++) {
	        alt = alternatives[_i];
	        _ref = alt[0].split(' ');
	        for (_j = 0, _len1 = _ref.length; _j < _len1; _j++) {
	          token = _ref[_j];
	          if (!grammar[token]) {
	            tokens.push(token);
	          }
	        }
	        if (name === 'Root') {
	          alt[1] = "return " + alt[1];
	        }
	        _results.push(alt);
	      }
	      return _results;
	    })();
	  }

	  exports.parser = new Parser({
	    tokens: tokens.join(' '),
	    bnf: grammar,
	    operators: operators.reverse(),
	    startSymbol: 'Root'
	  });

	}).call(this);


/***/ },
/* 60 */
/***/ function(module, exports, __webpack_require__) {

	// Generated by CoffeeScript 1.7.1
	(function() {
	  var key, val, _ref;

	  _ref = __webpack_require__(44);
	  for (key in _ref) {
	    val = _ref[key];
	    exports[key] = val;
	  }

	}).call(this);


/***/ },
/* 61 */
/***/ function(module, exports, __webpack_require__) {

	// Generated by CoffeeScript 1.7.1
	(function() {
	  var LONG_FLAG, MULTI_FLAG, OPTIONAL, OptionParser, SHORT_FLAG, buildRule, buildRules, normalizeArguments, repeat;

	  repeat = __webpack_require__(48).repeat;

	  exports.OptionParser = OptionParser = (function() {
	    function OptionParser(rules, banner) {
	      this.banner = banner;
	      this.rules = buildRules(rules);
	    }

	    OptionParser.prototype.parse = function(args) {
	      var arg, i, isOption, matchedRule, options, originalArgs, pos, rule, seenNonOptionArg, skippingArgument, value, _i, _j, _len, _len1, _ref;
	      options = {
	        "arguments": []
	      };
	      skippingArgument = false;
	      originalArgs = args;
	      args = normalizeArguments(args);
	      for (i = _i = 0, _len = args.length; _i < _len; i = ++_i) {
	        arg = args[i];
	        if (skippingArgument) {
	          skippingArgument = false;
	          continue;
	        }
	        if (arg === '--') {
	          pos = originalArgs.indexOf('--');
	          options["arguments"] = options["arguments"].concat(originalArgs.slice(pos + 1));
	          break;
	        }
	        isOption = !!(arg.match(LONG_FLAG) || arg.match(SHORT_FLAG));
	        seenNonOptionArg = options["arguments"].length > 0;
	        if (!seenNonOptionArg) {
	          matchedRule = false;
	          _ref = this.rules;
	          for (_j = 0, _len1 = _ref.length; _j < _len1; _j++) {
	            rule = _ref[_j];
	            if (rule.shortFlag === arg || rule.longFlag === arg) {
	              value = true;
	              if (rule.hasArgument) {
	                skippingArgument = true;
	                value = args[i + 1];
	              }
	              options[rule.name] = rule.isList ? (options[rule.name] || []).concat(value) : value;
	              matchedRule = true;
	              break;
	            }
	          }
	          if (isOption && !matchedRule) {
	            throw new Error("unrecognized option: " + arg);
	          }
	        }
	        if (seenNonOptionArg || !isOption) {
	          options["arguments"].push(arg);
	        }
	      }
	      return options;
	    };

	    OptionParser.prototype.help = function() {
	      var letPart, lines, rule, spaces, _i, _len, _ref;
	      lines = [];
	      if (this.banner) {
	        lines.unshift("" + this.banner + "\n");
	      }
	      _ref = this.rules;
	      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
	        rule = _ref[_i];
	        spaces = 15 - rule.longFlag.length;
	        spaces = spaces > 0 ? repeat(' ', spaces) : '';
	        letPart = rule.shortFlag ? rule.shortFlag + ', ' : '    ';
	        lines.push('  ' + letPart + rule.longFlag + spaces + rule.description);
	      }
	      return "\n" + (lines.join('\n')) + "\n";
	    };

	    return OptionParser;

	  })();

	  LONG_FLAG = /^(--\w[\w\-]*)/;

	  SHORT_FLAG = /^(-\w)$/;

	  MULTI_FLAG = /^-(\w{2,})/;

	  OPTIONAL = /\[(\w+(\*?))\]/;

	  buildRules = function(rules) {
	    var tuple, _i, _len, _results;
	    _results = [];
	    for (_i = 0, _len = rules.length; _i < _len; _i++) {
	      tuple = rules[_i];
	      if (tuple.length < 3) {
	        tuple.unshift(null);
	      }
	      _results.push(buildRule.apply(null, tuple));
	    }
	    return _results;
	  };

	  buildRule = function(shortFlag, longFlag, description, options) {
	    var match;
	    if (options == null) {
	      options = {};
	    }
	    match = longFlag.match(OPTIONAL);
	    longFlag = longFlag.match(LONG_FLAG)[1];
	    return {
	      name: longFlag.substr(2),
	      shortFlag: shortFlag,
	      longFlag: longFlag,
	      description: description,
	      hasArgument: !!(match && match[1]),
	      isList: !!(match && match[2])
	    };
	  };

	  normalizeArguments = function(args) {
	    var arg, l, match, result, _i, _j, _len, _len1, _ref;
	    args = args.slice(0);
	    result = [];
	    for (_i = 0, _len = args.length; _i < _len; _i++) {
	      arg = args[_i];
	      if (match = arg.match(MULTI_FLAG)) {
	        _ref = match[1].split('');
	        for (_j = 0, _len1 = _ref.length; _j < _len1; _j++) {
	          l = _ref[_j];
	          result.push('-' + l);
	        }
	      } else {
	        result.push(arg);
	      }
	    }
	    return result;
	  };

	}).call(this);


/***/ },
/* 62 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(process, global, Buffer) {// Generated by CoffeeScript 1.7.1
	(function() {
	  var CoffeeScript, addHistory, addMultilineHandler, fs, merge, nodeREPL, path, replDefaults, updateSyntaxError, vm, _ref;

	  fs = __webpack_require__(!(function webpackMissingModule() { var e = new Error("Cannot find module \"fs\""); e.code = 'MODULE_NOT_FOUND'; throw e; }()));

	  path = __webpack_require__(42);

	  vm = __webpack_require__(65);

	  nodeREPL = __webpack_require__(!(function webpackMissingModule() { var e = new Error("Cannot find module \"repl\""); e.code = 'MODULE_NOT_FOUND'; throw e; }()));

	  CoffeeScript = __webpack_require__(44);

	  _ref = __webpack_require__(48), merge = _ref.merge, updateSyntaxError = _ref.updateSyntaxError;

	  replDefaults = {
	    prompt: 'coffee> ',
	    historyFile: process.env.HOME ? path.join(process.env.HOME, '.coffee_history') : void 0,
	    historyMaxInputSize: 10240,
	    "eval": function(input, context, filename, cb) {
	      var Assign, Block, Literal, Value, ast, err, js, result, _ref1;
	      input = input.replace(/\uFF00/g, '\n');
	      input = input.replace(/^\(([\s\S]*)\n\)$/m, '$1');
	      _ref1 = __webpack_require__(52), Block = _ref1.Block, Assign = _ref1.Assign, Value = _ref1.Value, Literal = _ref1.Literal;
	      try {
	        ast = CoffeeScript.nodes(input);
	        ast = new Block([new Assign(new Value(new Literal('_')), ast, '=')]);
	        js = ast.compile({
	          bare: true,
	          locals: Object.keys(context)
	        });
	        result = context === global ? vm.runInThisContext(js, filename) : vm.runInContext(js, context, filename);
	        return cb(null, result);
	      } catch (_error) {
	        err = _error;
	        updateSyntaxError(err, input);
	        return cb(err);
	      }
	    }
	  };

	  addMultilineHandler = function(repl) {
	    var inputStream, multiline, nodeLineListener, outputStream, rli;
	    rli = repl.rli, inputStream = repl.inputStream, outputStream = repl.outputStream;
	    multiline = {
	      enabled: false,
	      initialPrompt: repl.prompt.replace(/^[^> ]*/, function(x) {
	        return x.replace(/./g, '-');
	      }),
	      prompt: repl.prompt.replace(/^[^> ]*>?/, function(x) {
	        return x.replace(/./g, '.');
	      }),
	      buffer: ''
	    };
	    nodeLineListener = rli.listeners('line')[0];
	    rli.removeListener('line', nodeLineListener);
	    rli.on('line', function(cmd) {
	      if (multiline.enabled) {
	        multiline.buffer += "" + cmd + "\n";
	        rli.setPrompt(multiline.prompt);
	        rli.prompt(true);
	      } else {
	        nodeLineListener(cmd);
	      }
	    });
	    return inputStream.on('keypress', function(char, key) {
	      if (!(key && key.ctrl && !key.meta && !key.shift && key.name === 'v')) {
	        return;
	      }
	      if (multiline.enabled) {
	        if (!multiline.buffer.match(/\n/)) {
	          multiline.enabled = !multiline.enabled;
	          rli.setPrompt(repl.prompt);
	          rli.prompt(true);
	          return;
	        }
	        if ((rli.line != null) && !rli.line.match(/^\s*$/)) {
	          return;
	        }
	        multiline.enabled = !multiline.enabled;
	        rli.line = '';
	        rli.cursor = 0;
	        rli.output.cursorTo(0);
	        rli.output.clearLine(1);
	        multiline.buffer = multiline.buffer.replace(/\n/g, '\uFF00');
	        rli.emit('line', multiline.buffer);
	        multiline.buffer = '';
	      } else {
	        multiline.enabled = !multiline.enabled;
	        rli.setPrompt(multiline.initialPrompt);
	        rli.prompt(true);
	      }
	    });
	  };

	  addHistory = function(repl, filename, maxSize) {
	    var buffer, fd, lastLine, readFd, size, stat;
	    lastLine = null;
	    try {
	      stat = fs.statSync(filename);
	      size = Math.min(maxSize, stat.size);
	      readFd = fs.openSync(filename, 'r');
	      buffer = new Buffer(size);
	      fs.readSync(readFd, buffer, 0, size, stat.size - size);
	      repl.rli.history = buffer.toString().split('\n').reverse();
	      if (stat.size > maxSize) {
	        repl.rli.history.pop();
	      }
	      if (repl.rli.history[0] === '') {
	        repl.rli.history.shift();
	      }
	      repl.rli.historyIndex = -1;
	      lastLine = repl.rli.history[0];
	    } catch (_error) {}
	    fd = fs.openSync(filename, 'a');
	    repl.rli.addListener('line', function(code) {
	      if (code && code.length && code !== '.history' && lastLine !== code) {
	        fs.write(fd, "" + code + "\n");
	        return lastLine = code;
	      }
	    });
	    repl.rli.on('exit', function() {
	      return fs.close(fd);
	    });
	    return repl.commands['.history'] = {
	      help: 'Show command history',
	      action: function() {
	        repl.outputStream.write("" + (repl.rli.history.slice(0).reverse().join('\n')) + "\n");
	        return repl.displayPrompt();
	      }
	    };
	  };

	  module.exports = {
	    start: function(opts) {
	      var build, major, minor, repl, _ref1;
	      if (opts == null) {
	        opts = {};
	      }
	      _ref1 = process.versions.node.split('.').map(function(n) {
	        return parseInt(n);
	      }), major = _ref1[0], minor = _ref1[1], build = _ref1[2];
	      if (major === 0 && minor < 8) {
	        console.warn("Node 0.8.0+ required for CoffeeScript REPL");
	        process.exit(1);
	      }
	      CoffeeScript.register();
	      process.argv = ['coffee'].concat(process.argv.slice(2));
	      opts = merge(replDefaults, opts);
	      repl = nodeREPL.start(opts);
	      repl.on('exit', function() {
	        return repl.outputStream.write('\n');
	      });
	      addMultilineHandler(repl);
	      if (opts.historyFile) {
	        addHistory(repl, opts.historyFile, opts.historyMaxInputSize);
	      }
	      return repl;
	    }
	  };

	}).call(this);
	
	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(30), (function() { return this; }()), __webpack_require__(76).Buffer))

/***/ },
/* 63 */
/***/ function(module, exports, __webpack_require__) {

	// Generated by CoffeeScript 1.7.1
	(function() {
	  var BALANCED_PAIRS, CALL_CLOSERS, EXPRESSION_CLOSE, EXPRESSION_END, EXPRESSION_START, IMPLICIT_CALL, IMPLICIT_END, IMPLICIT_FUNC, IMPLICIT_UNSPACED_CALL, INVERSES, LINEBREAKS, SINGLE_CLOSERS, SINGLE_LINERS, generate, left, rite, _i, _len, _ref,
	    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; },
	    __slice = [].slice;

	  generate = function(tag, value, origin) {
	    var tok;
	    tok = [tag, value];
	    tok.generated = true;
	    if (origin) {
	      tok.origin = origin;
	    }
	    return tok;
	  };

	  exports.Rewriter = (function() {
	    function Rewriter() {}

	    Rewriter.prototype.rewrite = function(tokens) {
	      this.tokens = tokens;
	      this.removeLeadingNewlines();
	      this.closeOpenCalls();
	      this.closeOpenIndexes();
	      this.normalizeLines();
	      this.tagPostfixConditionals();
	      this.addImplicitBracesAndParens();
	      this.addLocationDataToGeneratedTokens();
	      return this.tokens;
	    };

	    Rewriter.prototype.scanTokens = function(block) {
	      var i, token, tokens;
	      tokens = this.tokens;
	      i = 0;
	      while (token = tokens[i]) {
	        i += block.call(this, token, i, tokens);
	      }
	      return true;
	    };

	    Rewriter.prototype.detectEnd = function(i, condition, action) {
	      var levels, token, tokens, _ref, _ref1;
	      tokens = this.tokens;
	      levels = 0;
	      while (token = tokens[i]) {
	        if (levels === 0 && condition.call(this, token, i)) {
	          return action.call(this, token, i);
	        }
	        if (!token || levels < 0) {
	          return action.call(this, token, i - 1);
	        }
	        if (_ref = token[0], __indexOf.call(EXPRESSION_START, _ref) >= 0) {
	          levels += 1;
	        } else if (_ref1 = token[0], __indexOf.call(EXPRESSION_END, _ref1) >= 0) {
	          levels -= 1;
	        }
	        i += 1;
	      }
	      return i - 1;
	    };

	    Rewriter.prototype.removeLeadingNewlines = function() {
	      var i, tag, _i, _len, _ref;
	      _ref = this.tokens;
	      for (i = _i = 0, _len = _ref.length; _i < _len; i = ++_i) {
	        tag = _ref[i][0];
	        if (tag !== 'TERMINATOR') {
	          break;
	        }
	      }
	      if (i) {
	        return this.tokens.splice(0, i);
	      }
	    };

	    Rewriter.prototype.closeOpenCalls = function() {
	      var action, condition;
	      condition = function(token, i) {
	        var _ref;
	        return ((_ref = token[0]) === ')' || _ref === 'CALL_END') || token[0] === 'OUTDENT' && this.tag(i - 1) === ')';
	      };
	      action = function(token, i) {
	        return this.tokens[token[0] === 'OUTDENT' ? i - 1 : i][0] = 'CALL_END';
	      };
	      return this.scanTokens(function(token, i) {
	        if (token[0] === 'CALL_START') {
	          this.detectEnd(i + 1, condition, action);
	        }
	        return 1;
	      });
	    };

	    Rewriter.prototype.closeOpenIndexes = function() {
	      var action, condition;
	      condition = function(token, i) {
	        var _ref;
	        return (_ref = token[0]) === ']' || _ref === 'INDEX_END';
	      };
	      action = function(token, i) {
	        return token[0] = 'INDEX_END';
	      };
	      return this.scanTokens(function(token, i) {
	        if (token[0] === 'INDEX_START') {
	          this.detectEnd(i + 1, condition, action);
	        }
	        return 1;
	      });
	    };

	    Rewriter.prototype.matchTags = function() {
	      var fuzz, i, j, pattern, _i, _ref, _ref1;
	      i = arguments[0], pattern = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
	      fuzz = 0;
	      for (j = _i = 0, _ref = pattern.length; 0 <= _ref ? _i < _ref : _i > _ref; j = 0 <= _ref ? ++_i : --_i) {
	        while (this.tag(i + j + fuzz) === 'HERECOMMENT') {
	          fuzz += 2;
	        }
	        if (pattern[j] == null) {
	          continue;
	        }
	        if (typeof pattern[j] === 'string') {
	          pattern[j] = [pattern[j]];
	        }
	        if (_ref1 = this.tag(i + j + fuzz), __indexOf.call(pattern[j], _ref1) < 0) {
	          return false;
	        }
	      }
	      return true;
	    };

	    Rewriter.prototype.looksObjectish = function(j) {
	      return this.matchTags(j, '@', null, ':') || this.matchTags(j, null, ':');
	    };

	    Rewriter.prototype.findTagsBackwards = function(i, tags) {
	      var backStack, _ref, _ref1, _ref2, _ref3, _ref4, _ref5;
	      backStack = [];
	      while (i >= 0 && (backStack.length || (_ref2 = this.tag(i), __indexOf.call(tags, _ref2) < 0) && ((_ref3 = this.tag(i), __indexOf.call(EXPRESSION_START, _ref3) < 0) || this.tokens[i].generated) && (_ref4 = this.tag(i), __indexOf.call(LINEBREAKS, _ref4) < 0))) {
	        if (_ref = this.tag(i), __indexOf.call(EXPRESSION_END, _ref) >= 0) {
	          backStack.push(this.tag(i));
	        }
	        if ((_ref1 = this.tag(i), __indexOf.call(EXPRESSION_START, _ref1) >= 0) && backStack.length) {
	          backStack.pop();
	        }
	        i -= 1;
	      }
	      return _ref5 = this.tag(i), __indexOf.call(tags, _ref5) >= 0;
	    };

	    Rewriter.prototype.addImplicitBracesAndParens = function() {
	      var stack;
	      stack = [];
	      return this.scanTokens(function(token, i, tokens) {
	        var endImplicitCall, endImplicitObject, forward, inImplicit, inImplicitCall, inImplicitControl, inImplicitObject, newLine, nextTag, offset, prevTag, prevToken, s, sameLine, stackIdx, stackTag, stackTop, startIdx, startImplicitCall, startImplicitObject, startsLine, tag, _ref, _ref1, _ref2, _ref3, _ref4, _ref5;
	        tag = token[0];
	        prevTag = (prevToken = i > 0 ? tokens[i - 1] : [])[0];
	        nextTag = (i < tokens.length - 1 ? tokens[i + 1] : [])[0];
	        stackTop = function() {
	          return stack[stack.length - 1];
	        };
	        startIdx = i;
	        forward = function(n) {
	          return i - startIdx + n;
	        };
	        inImplicit = function() {
	          var _ref, _ref1;
	          return (_ref = stackTop()) != null ? (_ref1 = _ref[2]) != null ? _ref1.ours : void 0 : void 0;
	        };
	        inImplicitCall = function() {
	          var _ref;
	          return inImplicit() && ((_ref = stackTop()) != null ? _ref[0] : void 0) === '(';
	        };
	        inImplicitObject = function() {
	          var _ref;
	          return inImplicit() && ((_ref = stackTop()) != null ? _ref[0] : void 0) === '{';
	        };
	        inImplicitControl = function() {
	          var _ref;
	          return inImplicit && ((_ref = stackTop()) != null ? _ref[0] : void 0) === 'CONTROL';
	        };
	        startImplicitCall = function(j) {
	          var idx;
	          idx = j != null ? j : i;
	          stack.push([
	            '(', idx, {
	              ours: true
	            }
	          ]);
	          tokens.splice(idx, 0, generate('CALL_START', '('));
	          if (j == null) {
	            return i += 1;
	          }
	        };
	        endImplicitCall = function() {
	          stack.pop();
	          tokens.splice(i, 0, generate('CALL_END', ')'));
	          return i += 1;
	        };
	        startImplicitObject = function(j, startsLine) {
	          var idx;
	          if (startsLine == null) {
	            startsLine = true;
	          }
	          idx = j != null ? j : i;
	          stack.push([
	            '{', idx, {
	              sameLine: true,
	              startsLine: startsLine,
	              ours: true
	            }
	          ]);
	          tokens.splice(idx, 0, generate('{', generate(new String('{')), token));
	          if (j == null) {
	            return i += 1;
	          }
	        };
	        endImplicitObject = function(j) {
	          j = j != null ? j : i;
	          stack.pop();
	          tokens.splice(j, 0, generate('}', '}', token));
	          return i += 1;
	        };
	        if (inImplicitCall() && (tag === 'IF' || tag === 'TRY' || tag === 'FINALLY' || tag === 'CATCH' || tag === 'CLASS' || tag === 'SWITCH')) {
	          stack.push([
	            'CONTROL', i, {
	              ours: true
	            }
	          ]);
	          return forward(1);
	        }
	        if (tag === 'INDENT' && inImplicit()) {
	          if (prevTag !== '=>' && prevTag !== '->' && prevTag !== '[' && prevTag !== '(' && prevTag !== ',' && prevTag !== '{' && prevTag !== 'TRY' && prevTag !== 'ELSE' && prevTag !== '=') {
	            while (inImplicitCall()) {
	              endImplicitCall();
	            }
	          }
	          if (inImplicitControl()) {
	            stack.pop();
	          }
	          stack.push([tag, i]);
	          return forward(1);
	        }
	        if (__indexOf.call(EXPRESSION_START, tag) >= 0) {
	          stack.push([tag, i]);
	          return forward(1);
	        }
	        if (__indexOf.call(EXPRESSION_END, tag) >= 0) {
	          while (inImplicit()) {
	            if (inImplicitCall()) {
	              endImplicitCall();
	            } else if (inImplicitObject()) {
	              endImplicitObject();
	            } else {
	              stack.pop();
	            }
	          }
	          stack.pop();
	        }
	        if ((__indexOf.call(IMPLICIT_FUNC, tag) >= 0 && token.spaced && !token.stringEnd || tag === '?' && i > 0 && !tokens[i - 1].spaced) && (__indexOf.call(IMPLICIT_CALL, nextTag) >= 0 || __indexOf.call(IMPLICIT_UNSPACED_CALL, nextTag) >= 0 && !((_ref = tokens[i + 1]) != null ? _ref.spaced : void 0) && !((_ref1 = tokens[i + 1]) != null ? _ref1.newLine : void 0))) {
	          if (tag === '?') {
	            tag = token[0] = 'FUNC_EXIST';
	          }
	          startImplicitCall(i + 1);
	          return forward(2);
	        }
	        if (__indexOf.call(IMPLICIT_FUNC, tag) >= 0 && this.matchTags(i + 1, 'INDENT', null, ':') && !this.findTagsBackwards(i, ['CLASS', 'EXTENDS', 'IF', 'CATCH', 'SWITCH', 'LEADING_WHEN', 'FOR', 'WHILE', 'UNTIL'])) {
	          startImplicitCall(i + 1);
	          stack.push(['INDENT', i + 2]);
	          return forward(3);
	        }
	        if (tag === ':') {
	          if (this.tag(i - 2) === '@') {
	            s = i - 2;
	          } else {
	            s = i - 1;
	          }
	          while (this.tag(s - 2) === 'HERECOMMENT') {
	            s -= 2;
	          }
	          this.insideForDeclaration = nextTag === 'FOR';
	          startsLine = s === 0 || (_ref2 = this.tag(s - 1), __indexOf.call(LINEBREAKS, _ref2) >= 0) || tokens[s - 1].newLine;
	          if (stackTop()) {
	            _ref3 = stackTop(), stackTag = _ref3[0], stackIdx = _ref3[1];
	            if ((stackTag === '{' || stackTag === 'INDENT' && this.tag(stackIdx - 1) === '{') && (startsLine || this.tag(s - 1) === ',' || this.tag(s - 1) === '{')) {
	              return forward(1);
	            }
	          }
	          startImplicitObject(s, !!startsLine);
	          return forward(2);
	        }
	        if (inImplicitObject() && __indexOf.call(LINEBREAKS, tag) >= 0) {
	          stackTop()[2].sameLine = false;
	        }
	        newLine = prevTag === 'OUTDENT' || prevToken.newLine;
	        if (__indexOf.call(IMPLICIT_END, tag) >= 0 || __indexOf.call(CALL_CLOSERS, tag) >= 0 && newLine) {
	          while (inImplicit()) {
	            _ref4 = stackTop(), stackTag = _ref4[0], stackIdx = _ref4[1], (_ref5 = _ref4[2], sameLine = _ref5.sameLine, startsLine = _ref5.startsLine);
	            if (inImplicitCall() && prevTag !== ',') {
	              endImplicitCall();
	            } else if (inImplicitObject() && !this.insideForDeclaration && sameLine && tag !== 'TERMINATOR' && prevTag !== ':' && endImplicitObject()) {

	            } else if (inImplicitObject() && tag === 'TERMINATOR' && prevTag !== ',' && !(startsLine && this.looksObjectish(i + 1))) {
	              endImplicitObject();
	            } else {
	              break;
	            }
	          }
	        }
	        if (tag === ',' && !this.looksObjectish(i + 1) && inImplicitObject() && !this.insideForDeclaration && (nextTag !== 'TERMINATOR' || !this.looksObjectish(i + 2))) {
	          offset = nextTag === 'OUTDENT' ? 1 : 0;
	          while (inImplicitObject()) {
	            endImplicitObject(i + offset);
	          }
	        }
	        return forward(1);
	      });
	    };

	    Rewriter.prototype.addLocationDataToGeneratedTokens = function() {
	      return this.scanTokens(function(token, i, tokens) {
	        var column, line, nextLocation, prevLocation, _ref, _ref1;
	        if (token[2]) {
	          return 1;
	        }
	        if (!(token.generated || token.explicit)) {
	          return 1;
	        }
	        if (token[0] === '{' && (nextLocation = (_ref = tokens[i + 1]) != null ? _ref[2] : void 0)) {
	          line = nextLocation.first_line, column = nextLocation.first_column;
	        } else if (prevLocation = (_ref1 = tokens[i - 1]) != null ? _ref1[2] : void 0) {
	          line = prevLocation.last_line, column = prevLocation.last_column;
	        } else {
	          line = column = 0;
	        }
	        token[2] = {
	          first_line: line,
	          first_column: column,
	          last_line: line,
	          last_column: column
	        };
	        return 1;
	      });
	    };

	    Rewriter.prototype.normalizeLines = function() {
	      var action, condition, indent, outdent, starter;
	      starter = indent = outdent = null;
	      condition = function(token, i) {
	        var _ref, _ref1, _ref2, _ref3;
	        return token[1] !== ';' && (_ref = token[0], __indexOf.call(SINGLE_CLOSERS, _ref) >= 0) && !(token[0] === 'TERMINATOR' && (_ref1 = this.tag(i + 1), __indexOf.call(EXPRESSION_CLOSE, _ref1) >= 0)) && !(token[0] === 'ELSE' && starter !== 'THEN') && !(((_ref2 = token[0]) === 'CATCH' || _ref2 === 'FINALLY') && (starter === '->' || starter === '=>')) || (_ref3 = token[0], __indexOf.call(CALL_CLOSERS, _ref3) >= 0) && this.tokens[i - 1].newLine;
	      };
	      action = function(token, i) {
	        return this.tokens.splice((this.tag(i - 1) === ',' ? i - 1 : i), 0, outdent);
	      };
	      return this.scanTokens(function(token, i, tokens) {
	        var j, tag, _i, _ref, _ref1, _ref2;
	        tag = token[0];
	        if (tag === 'TERMINATOR') {
	          if (this.tag(i + 1) === 'ELSE' && this.tag(i - 1) !== 'OUTDENT') {
	            tokens.splice.apply(tokens, [i, 1].concat(__slice.call(this.indentation())));
	            return 1;
	          }
	          if (_ref = this.tag(i + 1), __indexOf.call(EXPRESSION_CLOSE, _ref) >= 0) {
	            tokens.splice(i, 1);
	            return 0;
	          }
	        }
	        if (tag === 'CATCH') {
	          for (j = _i = 1; _i <= 2; j = ++_i) {
	            if (!((_ref1 = this.tag(i + j)) === 'OUTDENT' || _ref1 === 'TERMINATOR' || _ref1 === 'FINALLY')) {
	              continue;
	            }
	            tokens.splice.apply(tokens, [i + j, 0].concat(__slice.call(this.indentation())));
	            return 2 + j;
	          }
	        }
	        if (__indexOf.call(SINGLE_LINERS, tag) >= 0 && this.tag(i + 1) !== 'INDENT' && !(tag === 'ELSE' && this.tag(i + 1) === 'IF')) {
	          starter = tag;
	          _ref2 = this.indentation(tokens[i]), indent = _ref2[0], outdent = _ref2[1];
	          if (starter === 'THEN') {
	            indent.fromThen = true;
	          }
	          tokens.splice(i + 1, 0, indent);
	          this.detectEnd(i + 2, condition, action);
	          if (tag === 'THEN') {
	            tokens.splice(i, 1);
	          }
	          return 1;
	        }
	        return 1;
	      });
	    };

	    Rewriter.prototype.tagPostfixConditionals = function() {
	      var action, condition, original;
	      original = null;
	      condition = function(token, i) {
	        var prevTag, tag;
	        tag = token[0];
	        prevTag = this.tokens[i - 1][0];
	        return tag === 'TERMINATOR' || (tag === 'INDENT' && __indexOf.call(SINGLE_LINERS, prevTag) < 0);
	      };
	      action = function(token, i) {
	        if (token[0] !== 'INDENT' || (token.generated && !token.fromThen)) {
	          return original[0] = 'POST_' + original[0];
	        }
	      };
	      return this.scanTokens(function(token, i) {
	        if (token[0] !== 'IF') {
	          return 1;
	        }
	        original = token;
	        this.detectEnd(i + 1, condition, action);
	        return 1;
	      });
	    };

	    Rewriter.prototype.indentation = function(origin) {
	      var indent, outdent;
	      indent = ['INDENT', 2];
	      outdent = ['OUTDENT', 2];
	      if (origin) {
	        indent.generated = outdent.generated = true;
	        indent.origin = outdent.origin = origin;
	      } else {
	        indent.explicit = outdent.explicit = true;
	      }
	      return [indent, outdent];
	    };

	    Rewriter.prototype.generate = generate;

	    Rewriter.prototype.tag = function(i) {
	      var _ref;
	      return (_ref = this.tokens[i]) != null ? _ref[0] : void 0;
	    };

	    return Rewriter;

	  })();

	  BALANCED_PAIRS = [['(', ')'], ['[', ']'], ['{', '}'], ['INDENT', 'OUTDENT'], ['CALL_START', 'CALL_END'], ['PARAM_START', 'PARAM_END'], ['INDEX_START', 'INDEX_END']];

	  exports.INVERSES = INVERSES = {};

	  EXPRESSION_START = [];

	  EXPRESSION_END = [];

	  for (_i = 0, _len = BALANCED_PAIRS.length; _i < _len; _i++) {
	    _ref = BALANCED_PAIRS[_i], left = _ref[0], rite = _ref[1];
	    EXPRESSION_START.push(INVERSES[rite] = left);
	    EXPRESSION_END.push(INVERSES[left] = rite);
	  }

	  EXPRESSION_CLOSE = ['CATCH', 'THEN', 'ELSE', 'FINALLY'].concat(EXPRESSION_END);

	  IMPLICIT_FUNC = ['IDENTIFIER', 'SUPER', ')', 'CALL_END', ']', 'INDEX_END', '@', 'THIS'];

	  IMPLICIT_CALL = ['IDENTIFIER', 'NUMBER', 'STRING', 'JS', 'REGEX', 'NEW', 'PARAM_START', 'CLASS', 'IF', 'TRY', 'SWITCH', 'THIS', 'BOOL', 'NULL', 'UNDEFINED', 'UNARY', 'UNARY_MATH', 'SUPER', 'THROW', '@', '->', '=>', '[', '(', '{', '--', '++'];

	  IMPLICIT_UNSPACED_CALL = ['+', '-'];

	  IMPLICIT_END = ['POST_IF', 'FOR', 'WHILE', 'UNTIL', 'WHEN', 'BY', 'LOOP', 'TERMINATOR'];

	  SINGLE_LINERS = ['ELSE', '->', '=>', 'TRY', 'FINALLY', 'THEN'];

	  SINGLE_CLOSERS = ['TERMINATOR', 'CATCH', 'FINALLY', 'ELSE', 'OUTDENT', 'LEADING_WHEN'];

	  LINEBREAKS = ['TERMINATOR', 'INDENT', 'OUTDENT'];

	  CALL_CLOSERS = ['.', '?.', '::', '?::'];

	}).call(this);


/***/ },
/* 64 */
/***/ function(module, exports, __webpack_require__) {

	// Generated by CoffeeScript 1.7.1
	(function() {
	  var Scope, extend, last, _ref;

	  _ref = __webpack_require__(48), extend = _ref.extend, last = _ref.last;

	  exports.Scope = Scope = (function() {
	    Scope.root = null;

	    function Scope(parent, expressions, method) {
	      this.parent = parent;
	      this.expressions = expressions;
	      this.method = method;
	      this.variables = [
	        {
	          name: 'arguments',
	          type: 'arguments'
	        }
	      ];
	      this.positions = {};
	      if (!this.parent) {
	        Scope.root = this;
	      }
	    }

	    Scope.prototype.add = function(name, type, immediate) {
	      if (this.shared && !immediate) {
	        return this.parent.add(name, type, immediate);
	      }
	      if (Object.prototype.hasOwnProperty.call(this.positions, name)) {
	        return this.variables[this.positions[name]].type = type;
	      } else {
	        return this.positions[name] = this.variables.push({
	          name: name,
	          type: type
	        }) - 1;
	      }
	    };

	    Scope.prototype.namedMethod = function() {
	      var _ref1;
	      if (((_ref1 = this.method) != null ? _ref1.name : void 0) || !this.parent) {
	        return this.method;
	      }
	      return this.parent.namedMethod();
	    };

	    Scope.prototype.find = function(name) {
	      if (this.check(name)) {
	        return true;
	      }
	      this.add(name, 'var');
	      return false;
	    };

	    Scope.prototype.parameter = function(name) {
	      if (this.shared && this.parent.check(name, true)) {
	        return;
	      }
	      return this.add(name, 'param');
	    };

	    Scope.prototype.check = function(name) {
	      var _ref1;
	      return !!(this.type(name) || ((_ref1 = this.parent) != null ? _ref1.check(name) : void 0));
	    };

	    Scope.prototype.temporary = function(name, index) {
	      if (name.length > 1) {
	        return '_' + name + (index > 1 ? index - 1 : '');
	      } else {
	        return '_' + (index + parseInt(name, 36)).toString(36).replace(/\d/g, 'a');
	      }
	    };

	    Scope.prototype.type = function(name) {
	      var v, _i, _len, _ref1;
	      _ref1 = this.variables;
	      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
	        v = _ref1[_i];
	        if (v.name === name) {
	          return v.type;
	        }
	      }
	      return null;
	    };

	    Scope.prototype.freeVariable = function(name, reserve) {
	      var index, temp;
	      if (reserve == null) {
	        reserve = true;
	      }
	      index = 0;
	      while (this.check((temp = this.temporary(name, index)))) {
	        index++;
	      }
	      if (reserve) {
	        this.add(temp, 'var', true);
	      }
	      return temp;
	    };

	    Scope.prototype.assign = function(name, value) {
	      this.add(name, {
	        value: value,
	        assigned: true
	      }, true);
	      return this.hasAssignments = true;
	    };

	    Scope.prototype.hasDeclarations = function() {
	      return !!this.declaredVariables().length;
	    };

	    Scope.prototype.declaredVariables = function() {
	      var realVars, tempVars, v, _i, _len, _ref1;
	      realVars = [];
	      tempVars = [];
	      _ref1 = this.variables;
	      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
	        v = _ref1[_i];
	        if (v.type === 'var') {
	          (v.name.charAt(0) === '_' ? tempVars : realVars).push(v.name);
	        }
	      }
	      return realVars.sort().concat(tempVars.sort());
	    };

	    Scope.prototype.assignedVariables = function() {
	      var v, _i, _len, _ref1, _results;
	      _ref1 = this.variables;
	      _results = [];
	      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
	        v = _ref1[_i];
	        if (v.type.assigned) {
	          _results.push("" + v.name + " = " + v.type.value);
	        }
	      }
	      return _results;
	    };

	    return Scope;

	  })();

	}).call(this);


/***/ },
/* 65 */
/***/ function(module, exports, __webpack_require__) {

	var indexOf = __webpack_require__(77);

	var Object_keys = function (obj) {
	    if (Object.keys) return Object.keys(obj)
	    else {
	        var res = [];
	        for (var key in obj) res.push(key)
	        return res;
	    }
	};

	var forEach = function (xs, fn) {
	    if (xs.forEach) return xs.forEach(fn)
	    else for (var i = 0; i < xs.length; i++) {
	        fn(xs[i], i, xs);
	    }
	};

	var defineProp = (function() {
	    try {
	        Object.defineProperty({}, '_', {});
	        return function(obj, name, value) {
	            Object.defineProperty(obj, name, {
	                writable: true,
	                enumerable: false,
	                configurable: true,
	                value: value
	            })
	        };
	    } catch(e) {
	        return function(obj, name, value) {
	            obj[name] = value;
	        };
	    }
	}());

	var globals = ['Array', 'Boolean', 'Date', 'Error', 'EvalError', 'Function',
	'Infinity', 'JSON', 'Math', 'NaN', 'Number', 'Object', 'RangeError',
	'ReferenceError', 'RegExp', 'String', 'SyntaxError', 'TypeError', 'URIError',
	'decodeURI', 'decodeURIComponent', 'encodeURI', 'encodeURIComponent', 'escape',
	'eval', 'isFinite', 'isNaN', 'parseFloat', 'parseInt', 'undefined', 'unescape'];

	function Context() {}
	Context.prototype = {};

	var Script = exports.Script = function NodeScript (code) {
	    if (!(this instanceof Script)) return new Script(code);
	    this.code = code;
	};

	Script.prototype.runInContext = function (context) {
	    if (!(context instanceof Context)) {
	        throw new TypeError("needs a 'context' argument.");
	    }
	    
	    var iframe = document.createElement('iframe');
	    if (!iframe.style) iframe.style = {};
	    iframe.style.display = 'none';
	    
	    document.body.appendChild(iframe);
	    
	    var win = iframe.contentWindow;
	    var wEval = win.eval, wExecScript = win.execScript;

	    if (!wEval && wExecScript) {
	        // win.eval() magically appears when this is called in IE:
	        wExecScript.call(win, 'null');
	        wEval = win.eval;
	    }
	    
	    forEach(Object_keys(context), function (key) {
	        win[key] = context[key];
	    });
	    forEach(globals, function (key) {
	        if (context[key]) {
	            win[key] = context[key];
	        }
	    });
	    
	    var winKeys = Object_keys(win);

	    var res = wEval.call(win, this.code);
	    
	    forEach(Object_keys(win), function (key) {
	        // Avoid copying circular objects like `top` and `window` by only
	        // updating existing context properties or new properties in the `win`
	        // that was only introduced after the eval.
	        if (key in context || indexOf(winKeys, key) === -1) {
	            context[key] = win[key];
	        }
	    });

	    forEach(globals, function (key) {
	        if (!(key in context)) {
	            defineProp(context, key, win[key]);
	        }
	    });
	    
	    document.body.removeChild(iframe);
	    
	    return res;
	};

	Script.prototype.runInThisContext = function () {
	    return eval(this.code); // maybe...
	};

	Script.prototype.runInNewContext = function (context) {
	    var ctx = Script.createContext(context);
	    var res = this.runInContext(ctx);

	    forEach(Object_keys(ctx), function (key) {
	        context[key] = ctx[key];
	    });

	    return res;
	};

	forEach(Object_keys(Script.prototype), function (name) {
	    exports[name] = Script[name] = function (code) {
	        var s = Script(code);
	        return s[name].apply(s, [].slice.call(arguments, 1));
	    };
	});

	exports.createScript = function (code) {
	    return exports.Script(code);
	};

	exports.createContext = Script.createContext = function (context) {
	    var copy = new Context();
	    if(typeof context === 'object') {
	        forEach(Object_keys(context), function (key) {
	            copy[key] = context[key];
	        });
	    }
	    return copy;
	};


/***/ },
/* 66 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_RESULT__;/* -*- Mode: js; js-indent-level: 2; -*- */
	/*
	 * Copyright 2011 Mozilla Foundation and contributors
	 * Licensed under the New BSD license. See LICENSE or:
	 * http://opensource.org/licenses/BSD-3-Clause
	 *
	 * Based on the Base 64 VLQ implementation in Closure Compiler:
	 * https://code.google.com/p/closure-compiler/source/browse/trunk/src/com/google/debugging/sourcemap/Base64VLQ.java
	 *
	 * Copyright 2011 The Closure Compiler Authors. All rights reserved.
	 * Redistribution and use in source and binary forms, with or without
	 * modification, are permitted provided that the following conditions are
	 * met:
	 *
	 *  * Redistributions of source code must retain the above copyright
	 *    notice, this list of conditions and the following disclaimer.
	 *  * Redistributions in binary form must reproduce the above
	 *    copyright notice, this list of conditions and the following
	 *    disclaimer in the documentation and/or other materials provided
	 *    with the distribution.
	 *  * Neither the name of Google Inc. nor the names of its
	 *    contributors may be used to endorse or promote products derived
	 *    from this software without specific prior written permission.
	 *
	 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
	 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
	 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
	 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
	 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
	 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
	 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
	 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
	 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
	 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
	 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
	 */
	if (false) {
	    var define = require('amdefine')(module, require);
	}
	!(__WEBPACK_AMD_DEFINE_RESULT__ = function (require, exports, module) {

	  var base64 = __webpack_require__(73);

	  // A single base 64 digit can contain 6 bits of data. For the base 64 variable
	  // length quantities we use in the source map spec, the first bit is the sign,
	  // the next four bits are the actual value, and the 6th bit is the
	  // continuation bit. The continuation bit tells us whether there are more
	  // digits in this value following this digit.
	  //
	  //   Continuation
	  //   |    Sign
	  //   |    |
	  //   V    V
	  //   101011

	  var VLQ_BASE_SHIFT = 5;

	  // binary: 100000
	  var VLQ_BASE = 1 << VLQ_BASE_SHIFT;

	  // binary: 011111
	  var VLQ_BASE_MASK = VLQ_BASE - 1;

	  // binary: 100000
	  var VLQ_CONTINUATION_BIT = VLQ_BASE;

	  /**
	   * Converts from a two-complement value to a value where the sign bit is
	   * placed in the least significant bit.  For example, as decimals:
	   *   1 becomes 2 (10 binary), -1 becomes 3 (11 binary)
	   *   2 becomes 4 (100 binary), -2 becomes 5 (101 binary)
	   */
	  function toVLQSigned(aValue) {
	    return aValue < 0
	      ? ((-aValue) << 1) + 1
	      : (aValue << 1) + 0;
	  }

	  /**
	   * Converts to a two-complement value from a value where the sign bit is
	   * placed in the least significant bit.  For example, as decimals:
	   *   2 (10 binary) becomes 1, 3 (11 binary) becomes -1
	   *   4 (100 binary) becomes 2, 5 (101 binary) becomes -2
	   */
	  function fromVLQSigned(aValue) {
	    var isNegative = (aValue & 1) === 1;
	    var shifted = aValue >> 1;
	    return isNegative
	      ? -shifted
	      : shifted;
	  }

	  /**
	   * Returns the base 64 VLQ encoded value.
	   */
	  exports.encode = function base64VLQ_encode(aValue) {
	    var encoded = "";
	    var digit;

	    var vlq = toVLQSigned(aValue);

	    do {
	      digit = vlq & VLQ_BASE_MASK;
	      vlq >>>= VLQ_BASE_SHIFT;
	      if (vlq > 0) {
	        // There are still more digits in this value, so we must make sure the
	        // continuation bit is marked.
	        digit |= VLQ_CONTINUATION_BIT;
	      }
	      encoded += base64.encode(digit);
	    } while (vlq > 0);

	    return encoded;
	  };

	  /**
	   * Decodes the next base 64 VLQ value from the given string and returns the
	   * value and the rest of the string via the out parameter.
	   */
	  exports.decode = function base64VLQ_decode(aStr, aOutParam) {
	    var i = 0;
	    var strLen = aStr.length;
	    var result = 0;
	    var shift = 0;
	    var continuation, digit;

	    do {
	      if (i >= strLen) {
	        throw new Error("Expected more digits in base 64 VLQ value.");
	      }
	      digit = base64.decode(aStr.charAt(i++));
	      continuation = !!(digit & VLQ_CONTINUATION_BIT);
	      digit &= VLQ_BASE_MASK;
	      result = result + (digit << shift);
	      shift += VLQ_BASE_SHIFT;
	    } while (continuation);

	    aOutParam.value = fromVLQSigned(result);
	    aOutParam.rest = aStr.slice(i);
	  };

	}.call(exports, __webpack_require__, exports, module), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ },
/* 67 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_RESULT__;/* -*- Mode: js; js-indent-level: 2; -*- */
	/*
	 * Copyright 2011 Mozilla Foundation and contributors
	 * Licensed under the New BSD license. See LICENSE or:
	 * http://opensource.org/licenses/BSD-3-Clause
	 */
	if (false) {
	    var define = require('amdefine')(module, require);
	}
	!(__WEBPACK_AMD_DEFINE_RESULT__ = function (require, exports, module) {

	  /**
	   * This is a helper function for getting values from parameter/options
	   * objects.
	   *
	   * @param args The object we are extracting values from
	   * @param name The name of the property we are getting.
	   * @param defaultValue An optional value to return if the property is missing
	   * from the object. If this is not specified and the property is missing, an
	   * error will be thrown.
	   */
	  function getArg(aArgs, aName, aDefaultValue) {
	    if (aName in aArgs) {
	      return aArgs[aName];
	    } else if (arguments.length === 3) {
	      return aDefaultValue;
	    } else {
	      throw new Error('"' + aName + '" is a required argument.');
	    }
	  }
	  exports.getArg = getArg;

	  var urlRegexp = /^(?:([\w+\-.]+):)?\/\/(?:(\w+:\w+)@)?([\w.]*)(?::(\d+))?(\S*)$/;
	  var dataUrlRegexp = /^data:.+\,.+$/;

	  function urlParse(aUrl) {
	    var match = aUrl.match(urlRegexp);
	    if (!match) {
	      return null;
	    }
	    return {
	      scheme: match[1],
	      auth: match[2],
	      host: match[3],
	      port: match[4],
	      path: match[5]
	    };
	  }
	  exports.urlParse = urlParse;

	  function urlGenerate(aParsedUrl) {
	    var url = '';
	    if (aParsedUrl.scheme) {
	      url += aParsedUrl.scheme + ':';
	    }
	    url += '//';
	    if (aParsedUrl.auth) {
	      url += aParsedUrl.auth + '@';
	    }
	    if (aParsedUrl.host) {
	      url += aParsedUrl.host;
	    }
	    if (aParsedUrl.port) {
	      url += ":" + aParsedUrl.port
	    }
	    if (aParsedUrl.path) {
	      url += aParsedUrl.path;
	    }
	    return url;
	  }
	  exports.urlGenerate = urlGenerate;

	  /**
	   * Normalizes a path, or the path portion of a URL:
	   *
	   * - Replaces consequtive slashes with one slash.
	   * - Removes unnecessary '.' parts.
	   * - Removes unnecessary '<dir>/..' parts.
	   *
	   * Based on code in the Node.js 'path' core module.
	   *
	   * @param aPath The path or url to normalize.
	   */
	  function normalize(aPath) {
	    var path = aPath;
	    var url = urlParse(aPath);
	    if (url) {
	      if (!url.path) {
	        return aPath;
	      }
	      path = url.path;
	    }
	    var isAbsolute = (path.charAt(0) === '/');

	    var parts = path.split(/\/+/);
	    for (var part, up = 0, i = parts.length - 1; i >= 0; i--) {
	      part = parts[i];
	      if (part === '.') {
	        parts.splice(i, 1);
	      } else if (part === '..') {
	        up++;
	      } else if (up > 0) {
	        if (part === '') {
	          // The first part is blank if the path is absolute. Trying to go
	          // above the root is a no-op. Therefore we can remove all '..' parts
	          // directly after the root.
	          parts.splice(i + 1, up);
	          up = 0;
	        } else {
	          parts.splice(i, 2);
	          up--;
	        }
	      }
	    }
	    path = parts.join('/');

	    if (path === '') {
	      path = isAbsolute ? '/' : '.';
	    }

	    if (url) {
	      url.path = path;
	      return urlGenerate(url);
	    }
	    return path;
	  }
	  exports.normalize = normalize;

	  /**
	   * Joins two paths/URLs.
	   *
	   * @param aRoot The root path or URL.
	   * @param aPath The path or URL to be joined with the root.
	   *
	   * - If aPath is a URL or a data URI, aPath is returned, unless aPath is a
	   *   scheme-relative URL: Then the scheme of aRoot, if any, is prepended
	   *   first.
	   * - Otherwise aPath is a path. If aRoot is a URL, then its path portion
	   *   is updated with the result and aRoot is returned. Otherwise the result
	   *   is returned.
	   *   - If aPath is absolute, the result is aPath.
	   *   - Otherwise the two paths are joined with a slash.
	   * - Joining for example 'http://' and 'www.example.com' is also supported.
	   */
	  function join(aRoot, aPath) {
	    if (aRoot === "") {
	      aRoot = ".";
	    }
	    if (aPath === "") {
	      aPath = ".";
	    }
	    var aPathUrl = urlParse(aPath);
	    var aRootUrl = urlParse(aRoot);
	    if (aRootUrl) {
	      aRoot = aRootUrl.path || '/';
	    }

	    // `join(foo, '//www.example.org')`
	    if (aPathUrl && !aPathUrl.scheme) {
	      if (aRootUrl) {
	        aPathUrl.scheme = aRootUrl.scheme;
	      }
	      return urlGenerate(aPathUrl);
	    }

	    if (aPathUrl || aPath.match(dataUrlRegexp)) {
	      return aPath;
	    }

	    // `join('http://', 'www.example.com')`
	    if (aRootUrl && !aRootUrl.host && !aRootUrl.path) {
	      aRootUrl.host = aPath;
	      return urlGenerate(aRootUrl);
	    }

	    var joined = aPath.charAt(0) === '/'
	      ? aPath
	      : normalize(aRoot.replace(/\/+$/, '') + '/' + aPath);

	    if (aRootUrl) {
	      aRootUrl.path = joined;
	      return urlGenerate(aRootUrl);
	    }
	    return joined;
	  }
	  exports.join = join;

	  /**
	   * Make a path relative to a URL or another path.
	   *
	   * @param aRoot The root path or URL.
	   * @param aPath The path or URL to be made relative to aRoot.
	   */
	  function relative(aRoot, aPath) {
	    if (aRoot === "") {
	      aRoot = ".";
	    }

	    aRoot = aRoot.replace(/\/$/, '');

	    // XXX: It is possible to remove this block, and the tests still pass!
	    var url = urlParse(aRoot);
	    if (aPath.charAt(0) == "/" && url && url.path == "/") {
	      return aPath.slice(1);
	    }

	    return aPath.indexOf(aRoot + '/') === 0
	      ? aPath.substr(aRoot.length + 1)
	      : aPath;
	  }
	  exports.relative = relative;

	  /**
	   * Because behavior goes wacky when you set `__proto__` on objects, we
	   * have to prefix all the strings in our set with an arbitrary character.
	   *
	   * See https://github.com/mozilla/source-map/pull/31 and
	   * https://github.com/mozilla/source-map/issues/30
	   *
	   * @param String aStr
	   */
	  function toSetString(aStr) {
	    return '$' + aStr;
	  }
	  exports.toSetString = toSetString;

	  function fromSetString(aStr) {
	    return aStr.substr(1);
	  }
	  exports.fromSetString = fromSetString;

	  function strcmp(aStr1, aStr2) {
	    var s1 = aStr1 || "";
	    var s2 = aStr2 || "";
	    return (s1 > s2) - (s1 < s2);
	  }

	  /**
	   * Comparator between two mappings where the original positions are compared.
	   *
	   * Optionally pass in `true` as `onlyCompareGenerated` to consider two
	   * mappings with the same original source/line/column, but different generated
	   * line and column the same. Useful when searching for a mapping with a
	   * stubbed out mapping.
	   */
	  function compareByOriginalPositions(mappingA, mappingB, onlyCompareOriginal) {
	    var cmp;

	    cmp = strcmp(mappingA.source, mappingB.source);
	    if (cmp) {
	      return cmp;
	    }

	    cmp = mappingA.originalLine - mappingB.originalLine;
	    if (cmp) {
	      return cmp;
	    }

	    cmp = mappingA.originalColumn - mappingB.originalColumn;
	    if (cmp || onlyCompareOriginal) {
	      return cmp;
	    }

	    cmp = strcmp(mappingA.name, mappingB.name);
	    if (cmp) {
	      return cmp;
	    }

	    cmp = mappingA.generatedLine - mappingB.generatedLine;
	    if (cmp) {
	      return cmp;
	    }

	    return mappingA.generatedColumn - mappingB.generatedColumn;
	  };
	  exports.compareByOriginalPositions = compareByOriginalPositions;

	  /**
	   * Comparator between two mappings where the generated positions are
	   * compared.
	   *
	   * Optionally pass in `true` as `onlyCompareGenerated` to consider two
	   * mappings with the same generated line and column, but different
	   * source/name/original line and column the same. Useful when searching for a
	   * mapping with a stubbed out mapping.
	   */
	  function compareByGeneratedPositions(mappingA, mappingB, onlyCompareGenerated) {
	    var cmp;

	    cmp = mappingA.generatedLine - mappingB.generatedLine;
	    if (cmp) {
	      return cmp;
	    }

	    cmp = mappingA.generatedColumn - mappingB.generatedColumn;
	    if (cmp || onlyCompareGenerated) {
	      return cmp;
	    }

	    cmp = strcmp(mappingA.source, mappingB.source);
	    if (cmp) {
	      return cmp;
	    }

	    cmp = mappingA.originalLine - mappingB.originalLine;
	    if (cmp) {
	      return cmp;
	    }

	    cmp = mappingA.originalColumn - mappingB.originalColumn;
	    if (cmp) {
	      return cmp;
	    }

	    return strcmp(mappingA.name, mappingB.name);
	  };
	  exports.compareByGeneratedPositions = compareByGeneratedPositions;

	}.call(exports, __webpack_require__, exports, module), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ },
/* 68 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_RESULT__;/* -*- Mode: js; js-indent-level: 2; -*- */
	/*
	 * Copyright 2011 Mozilla Foundation and contributors
	 * Licensed under the New BSD license. See LICENSE or:
	 * http://opensource.org/licenses/BSD-3-Clause
	 */
	if (false) {
	    var define = require('amdefine')(module, require);
	}
	!(__WEBPACK_AMD_DEFINE_RESULT__ = function (require, exports, module) {

	  var util = __webpack_require__(67);

	  /**
	   * A data structure which is a combination of an array and a set. Adding a new
	   * member is O(1), testing for membership is O(1), and finding the index of an
	   * element is O(1). Removing elements from the set is not supported. Only
	   * strings are supported for membership.
	   */
	  function ArraySet() {
	    this._array = [];
	    this._set = {};
	  }

	  /**
	   * Static method for creating ArraySet instances from an existing array.
	   */
	  ArraySet.fromArray = function ArraySet_fromArray(aArray, aAllowDuplicates) {
	    var set = new ArraySet();
	    for (var i = 0, len = aArray.length; i < len; i++) {
	      set.add(aArray[i], aAllowDuplicates);
	    }
	    return set;
	  };

	  /**
	   * Add the given string to this set.
	   *
	   * @param String aStr
	   */
	  ArraySet.prototype.add = function ArraySet_add(aStr, aAllowDuplicates) {
	    var isDuplicate = this.has(aStr);
	    var idx = this._array.length;
	    if (!isDuplicate || aAllowDuplicates) {
	      this._array.push(aStr);
	    }
	    if (!isDuplicate) {
	      this._set[util.toSetString(aStr)] = idx;
	    }
	  };

	  /**
	   * Is the given string a member of this set?
	   *
	   * @param String aStr
	   */
	  ArraySet.prototype.has = function ArraySet_has(aStr) {
	    return Object.prototype.hasOwnProperty.call(this._set,
	                                                util.toSetString(aStr));
	  };

	  /**
	   * What is the index of the given string in the array?
	   *
	   * @param String aStr
	   */
	  ArraySet.prototype.indexOf = function ArraySet_indexOf(aStr) {
	    if (this.has(aStr)) {
	      return this._set[util.toSetString(aStr)];
	    }
	    throw new Error('"' + aStr + '" is not in the set.');
	  };

	  /**
	   * What is the element at the given index?
	   *
	   * @param Number aIdx
	   */
	  ArraySet.prototype.at = function ArraySet_at(aIdx) {
	    if (aIdx >= 0 && aIdx < this._array.length) {
	      return this._array[aIdx];
	    }
	    throw new Error('No element indexed by ' + aIdx);
	  };

	  /**
	   * Returns the array representation of this set (which has the proper indices
	   * indicated by indexOf). Note that this is a copy of the internal array used
	   * for storing the members so that no one can mess with internal state.
	   */
	  ArraySet.prototype.toArray = function ArraySet_toArray() {
	    return this._array.slice();
	  };

	  exports.ArraySet = ArraySet;

	}.call(exports, __webpack_require__, exports, module), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ },
/* 69 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_RESULT__;/* -*- Mode: js; js-indent-level: 2; -*- */
	/*
	 * Copyright 2014 Mozilla Foundation and contributors
	 * Licensed under the New BSD license. See LICENSE or:
	 * http://opensource.org/licenses/BSD-3-Clause
	 */
	if (false) {
	    var define = require('amdefine')(module, require);
	}
	!(__WEBPACK_AMD_DEFINE_RESULT__ = function (require, exports, module) {

	  var util = __webpack_require__(67);

	  /**
	   * Determine whether mappingB is after mappingA with respect to generated
	   * position.
	   */
	  function generatedPositionAfter(mappingA, mappingB) {
	    // Optimized for most common case
	    var lineA = mappingA.generatedLine;
	    var lineB = mappingB.generatedLine;
	    var columnA = mappingA.generatedColumn;
	    var columnB = mappingB.generatedColumn;
	    return lineB > lineA || lineB == lineA && columnB >= columnA ||
	           util.compareByGeneratedPositions(mappingA, mappingB) <= 0;
	  }

	  /**
	   * A data structure to provide a sorted view of accumulated mappings in a
	   * performance conscious manner. It trades a neglibable overhead in general
	   * case for a large speedup in case of mappings being added in order.
	   */
	  function MappingList() {
	    this._array = [];
	    this._sorted = true;
	    // Serves as infimum
	    this._last = {generatedLine: -1, generatedColumn: 0};
	  }

	  /**
	   * Iterate through internal items. This method takes the same arguments that
	   * `Array.prototype.forEach` takes.
	   *
	   * NOTE: The order of the mappings is NOT guaranteed.
	   */
	  MappingList.prototype.unsortedForEach =
	    function MappingList_forEach(aCallback, aThisArg) {
	      this._array.forEach(aCallback, aThisArg);
	    };

	  /**
	   * Add the given source mapping.
	   *
	   * @param Object aMapping
	   */
	  MappingList.prototype.add = function MappingList_add(aMapping) {
	    var mapping;
	    if (generatedPositionAfter(this._last, aMapping)) {
	      this._last = aMapping;
	      this._array.push(aMapping);
	    } else {
	      this._sorted = false;
	      this._array.push(aMapping);
	    }
	  };

	  /**
	   * Returns the flat, sorted array of mappings. The mappings are sorted by
	   * generated position.
	   *
	   * WARNING: This method returns internal data without copying, for
	   * performance. The return value must NOT be mutated, and should be treated as
	   * an immutable borrow. If you want to take ownership, you must make your own
	   * copy.
	   */
	  MappingList.prototype.toArray = function MappingList_toArray() {
	    if (!this._sorted) {
	      this._array.sort(util.compareByGeneratedPositions);
	      this._sorted = true;
	    }
	    return this._array;
	  };

	  exports.MappingList = MappingList;

	}.call(exports, __webpack_require__, exports, module), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ },
/* 70 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_RESULT__;/* -*- Mode: js; js-indent-level: 2; -*- */
	/*
	 * Copyright 2011 Mozilla Foundation and contributors
	 * Licensed under the New BSD license. See LICENSE or:
	 * http://opensource.org/licenses/BSD-3-Clause
	 */
	if (false) {
	    var define = require('amdefine')(module, require);
	}
	!(__WEBPACK_AMD_DEFINE_RESULT__ = function (require, exports, module) {

	  /**
	   * Recursive implementation of binary search.
	   *
	   * @param aLow Indices here and lower do not contain the needle.
	   * @param aHigh Indices here and higher do not contain the needle.
	   * @param aNeedle The element being searched for.
	   * @param aHaystack The non-empty array being searched.
	   * @param aCompare Function which takes two elements and returns -1, 0, or 1.
	   */
	  function recursiveSearch(aLow, aHigh, aNeedle, aHaystack, aCompare) {
	    // This function terminates when one of the following is true:
	    //
	    //   1. We find the exact element we are looking for.
	    //
	    //   2. We did not find the exact element, but we can return the index of
	    //      the next closest element that is less than that element.
	    //
	    //   3. We did not find the exact element, and there is no next-closest
	    //      element which is less than the one we are searching for, so we
	    //      return -1.
	    var mid = Math.floor((aHigh - aLow) / 2) + aLow;
	    var cmp = aCompare(aNeedle, aHaystack[mid], true);
	    if (cmp === 0) {
	      // Found the element we are looking for.
	      return mid;
	    }
	    else if (cmp > 0) {
	      // aHaystack[mid] is greater than our needle.
	      if (aHigh - mid > 1) {
	        // The element is in the upper half.
	        return recursiveSearch(mid, aHigh, aNeedle, aHaystack, aCompare);
	      }
	      // We did not find an exact match, return the next closest one
	      // (termination case 2).
	      return mid;
	    }
	    else {
	      // aHaystack[mid] is less than our needle.
	      if (mid - aLow > 1) {
	        // The element is in the lower half.
	        return recursiveSearch(aLow, mid, aNeedle, aHaystack, aCompare);
	      }
	      // The exact needle element was not found in this haystack. Determine if
	      // we are in termination case (2) or (3) and return the appropriate thing.
	      return aLow < 0 ? -1 : aLow;
	    }
	  }

	  /**
	   * This is an implementation of binary search which will always try and return
	   * the index of next lowest value checked if there is no exact hit. This is
	   * because mappings between original and generated line/col pairs are single
	   * points, and there is an implicit region between each of them, so a miss
	   * just means that you aren't on the very start of a region.
	   *
	   * @param aNeedle The element you are looking for.
	   * @param aHaystack The array that is being searched.
	   * @param aCompare A function which takes the needle and an element in the
	   *     array and returns -1, 0, or 1 depending on whether the needle is less
	   *     than, equal to, or greater than the element, respectively.
	   */
	  exports.search = function search(aNeedle, aHaystack, aCompare) {
	    if (aHaystack.length === 0) {
	      return -1;
	    }
	    return recursiveSearch(-1, aHaystack.length, aNeedle, aHaystack, aCompare)
	  };

	}.call(exports, __webpack_require__, exports, module), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ },
/* 71 */,
/* 72 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = function(module) {
		if(!module.webpackPolyfill) {
			module.deprecate = function() {};
			module.paths = [];
			// module.parent = undefined by default
			module.children = [];
			module.webpackPolyfill = 1;
		}
		return module;
	}


/***/ },
/* 73 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_RESULT__;/* -*- Mode: js; js-indent-level: 2; -*- */
	/*
	 * Copyright 2011 Mozilla Foundation and contributors
	 * Licensed under the New BSD license. See LICENSE or:
	 * http://opensource.org/licenses/BSD-3-Clause
	 */
	if (false) {
	    var define = require('amdefine')(module, require);
	}
	!(__WEBPACK_AMD_DEFINE_RESULT__ = function (require, exports, module) {

	  var charToIntMap = {};
	  var intToCharMap = {};

	  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
	    .split('')
	    .forEach(function (ch, index) {
	      charToIntMap[ch] = index;
	      intToCharMap[index] = ch;
	    });

	  /**
	   * Encode an integer in the range of 0 to 63 to a single base 64 digit.
	   */
	  exports.encode = function base64_encode(aNumber) {
	    if (aNumber in intToCharMap) {
	      return intToCharMap[aNumber];
	    }
	    throw new TypeError("Must be between 0 and 63: " + aNumber);
	  };

	  /**
	   * Decode a single base 64 digit to an integer.
	   */
	  exports.decode = function base64_decode(aChar) {
	    if (aChar in charToIntMap) {
	      return charToIntMap[aChar];
	    }
	    throw new TypeError("Not a valid base 64 digit: " + aChar);
	  };

	}.call(exports, __webpack_require__, exports, module), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ },
/* 74 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(process) {var path = __webpack_require__(42);
	var fs = __webpack_require__(!(function webpackMissingModule() { var e = new Error("Cannot find module \"fs\""); e.code = 'MODULE_NOT_FOUND'; throw e; }()));

	module.exports = mkdirP.mkdirp = mkdirP.mkdirP = mkdirP;

	function mkdirP (p, mode, f, made) {
	    if (typeof mode === 'function' || mode === undefined) {
	        f = mode;
	        mode = 0777 & (~process.umask());
	    }
	    if (!made) made = null;

	    var cb = f || function () {};
	    if (typeof mode === 'string') mode = parseInt(mode, 8);
	    p = path.resolve(p);

	    fs.mkdir(p, mode, function (er) {
	        if (!er) {
	            made = made || p;
	            return cb(null, made);
	        }
	        switch (er.code) {
	            case 'ENOENT':
	                mkdirP(path.dirname(p), mode, function (er, made) {
	                    if (er) cb(er, made);
	                    else mkdirP(p, mode, cb, made);
	                });
	                break;

	            // In the case of any other error, just see if there's a dir
	            // there already.  If so, then hooray!  If not, then something
	            // is borked.
	            default:
	                fs.stat(p, function (er2, stat) {
	                    // if the stat fails, then that's super weird.
	                    // let the original error be the failure reason.
	                    if (er2 || !stat.isDirectory()) cb(er, made)
	                    else cb(null, made);
	                });
	                break;
	        }
	    });
	}

	mkdirP.sync = function sync (p, mode, made) {
	    if (mode === undefined) {
	        mode = 0777 & (~process.umask());
	    }
	    if (!made) made = null;

	    if (typeof mode === 'string') mode = parseInt(mode, 8);
	    p = path.resolve(p);

	    try {
	        fs.mkdirSync(p, mode);
	        made = made || p;
	    }
	    catch (err0) {
	        switch (err0.code) {
	            case 'ENOENT' :
	                made = sync(path.dirname(p), mode, made);
	                sync(p, mode, made);
	                break;

	            // In the case of any other error, just see if there's a dir
	            // there already.  If so, then hooray!  If not, then something
	            // is borked.
	            default:
	                var stat;
	                try {
	                    stat = fs.statSync(p);
	                }
	                catch (err1) {
	                    throw err0;
	                }
	                if (!stat.isDirectory()) throw err0;
	                break;
	        }
	    }

	    return made;
	};
	
	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(30)))

/***/ },
/* 75 */
/***/ function(module, exports, __webpack_require__) {

	// Copyright Joyent, Inc. and other Node contributors.
	//
	// Permission is hereby granted, free of charge, to any person obtaining a
	// copy of this software and associated documentation files (the
	// "Software"), to deal in the Software without restriction, including
	// without limitation the rights to use, copy, modify, merge, publish,
	// distribute, sublicense, and/or sell copies of the Software, and to permit
	// persons to whom the Software is furnished to do so, subject to the
	// following conditions:
	//
	// The above copyright notice and this permission notice shall be included
	// in all copies or substantial portions of the Software.
	//
	// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
	// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
	// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
	// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
	// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
	// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
	// USE OR OTHER DEALINGS IN THE SOFTWARE.

	function EventEmitter() {
	  this._events = this._events || {};
	  this._maxListeners = this._maxListeners || undefined;
	}
	module.exports = EventEmitter;

	// Backwards-compat with node 0.10.x
	EventEmitter.EventEmitter = EventEmitter;

	EventEmitter.prototype._events = undefined;
	EventEmitter.prototype._maxListeners = undefined;

	// By default EventEmitters will print a warning if more than 10 listeners are
	// added to it. This is a useful default which helps finding memory leaks.
	EventEmitter.defaultMaxListeners = 10;

	// Obviously not all Emitters should be limited to 10. This function allows
	// that to be increased. Set to zero for unlimited.
	EventEmitter.prototype.setMaxListeners = function(n) {
	  if (!isNumber(n) || n < 0 || isNaN(n))
	    throw TypeError('n must be a positive number');
	  this._maxListeners = n;
	  return this;
	};

	EventEmitter.prototype.emit = function(type) {
	  var er, handler, len, args, i, listeners;

	  if (!this._events)
	    this._events = {};

	  // If there is no 'error' event listener then throw.
	  if (type === 'error') {
	    if (!this._events.error ||
	        (isObject(this._events.error) && !this._events.error.length)) {
	      er = arguments[1];
	      if (er instanceof Error) {
	        throw er; // Unhandled 'error' event
	      }
	      throw TypeError('Uncaught, unspecified "error" event.');
	    }
	  }

	  handler = this._events[type];

	  if (isUndefined(handler))
	    return false;

	  if (isFunction(handler)) {
	    switch (arguments.length) {
	      // fast cases
	      case 1:
	        handler.call(this);
	        break;
	      case 2:
	        handler.call(this, arguments[1]);
	        break;
	      case 3:
	        handler.call(this, arguments[1], arguments[2]);
	        break;
	      // slower
	      default:
	        len = arguments.length;
	        args = new Array(len - 1);
	        for (i = 1; i < len; i++)
	          args[i - 1] = arguments[i];
	        handler.apply(this, args);
	    }
	  } else if (isObject(handler)) {
	    len = arguments.length;
	    args = new Array(len - 1);
	    for (i = 1; i < len; i++)
	      args[i - 1] = arguments[i];

	    listeners = handler.slice();
	    len = listeners.length;
	    for (i = 0; i < len; i++)
	      listeners[i].apply(this, args);
	  }

	  return true;
	};

	EventEmitter.prototype.addListener = function(type, listener) {
	  var m;

	  if (!isFunction(listener))
	    throw TypeError('listener must be a function');

	  if (!this._events)
	    this._events = {};

	  // To avoid recursion in the case that type === "newListener"! Before
	  // adding it to the listeners, first emit "newListener".
	  if (this._events.newListener)
	    this.emit('newListener', type,
	              isFunction(listener.listener) ?
	              listener.listener : listener);

	  if (!this._events[type])
	    // Optimize the case of one listener. Don't need the extra array object.
	    this._events[type] = listener;
	  else if (isObject(this._events[type]))
	    // If we've already got an array, just append.
	    this._events[type].push(listener);
	  else
	    // Adding the second element, need to change to array.
	    this._events[type] = [this._events[type], listener];

	  // Check for listener leak
	  if (isObject(this._events[type]) && !this._events[type].warned) {
	    var m;
	    if (!isUndefined(this._maxListeners)) {
	      m = this._maxListeners;
	    } else {
	      m = EventEmitter.defaultMaxListeners;
	    }

	    if (m && m > 0 && this._events[type].length > m) {
	      this._events[type].warned = true;
	      console.error('(node) warning: possible EventEmitter memory ' +
	                    'leak detected. %d listeners added. ' +
	                    'Use emitter.setMaxListeners() to increase limit.',
	                    this._events[type].length);
	      if (typeof console.trace === 'function') {
	        // not supported in IE 10
	        console.trace();
	      }
	    }
	  }

	  return this;
	};

	EventEmitter.prototype.on = EventEmitter.prototype.addListener;

	EventEmitter.prototype.once = function(type, listener) {
	  if (!isFunction(listener))
	    throw TypeError('listener must be a function');

	  var fired = false;

	  function g() {
	    this.removeListener(type, g);

	    if (!fired) {
	      fired = true;
	      listener.apply(this, arguments);
	    }
	  }

	  g.listener = listener;
	  this.on(type, g);

	  return this;
	};

	// emits a 'removeListener' event iff the listener was removed
	EventEmitter.prototype.removeListener = function(type, listener) {
	  var list, position, length, i;

	  if (!isFunction(listener))
	    throw TypeError('listener must be a function');

	  if (!this._events || !this._events[type])
	    return this;

	  list = this._events[type];
	  length = list.length;
	  position = -1;

	  if (list === listener ||
	      (isFunction(list.listener) && list.listener === listener)) {
	    delete this._events[type];
	    if (this._events.removeListener)
	      this.emit('removeListener', type, listener);

	  } else if (isObject(list)) {
	    for (i = length; i-- > 0;) {
	      if (list[i] === listener ||
	          (list[i].listener && list[i].listener === listener)) {
	        position = i;
	        break;
	      }
	    }

	    if (position < 0)
	      return this;

	    if (list.length === 1) {
	      list.length = 0;
	      delete this._events[type];
	    } else {
	      list.splice(position, 1);
	    }

	    if (this._events.removeListener)
	      this.emit('removeListener', type, listener);
	  }

	  return this;
	};

	EventEmitter.prototype.removeAllListeners = function(type) {
	  var key, listeners;

	  if (!this._events)
	    return this;

	  // not listening for removeListener, no need to emit
	  if (!this._events.removeListener) {
	    if (arguments.length === 0)
	      this._events = {};
	    else if (this._events[type])
	      delete this._events[type];
	    return this;
	  }

	  // emit removeListener for all listeners on all events
	  if (arguments.length === 0) {
	    for (key in this._events) {
	      if (key === 'removeListener') continue;
	      this.removeAllListeners(key);
	    }
	    this.removeAllListeners('removeListener');
	    this._events = {};
	    return this;
	  }

	  listeners = this._events[type];

	  if (isFunction(listeners)) {
	    this.removeListener(type, listeners);
	  } else {
	    // LIFO order
	    while (listeners.length)
	      this.removeListener(type, listeners[listeners.length - 1]);
	  }
	  delete this._events[type];

	  return this;
	};

	EventEmitter.prototype.listeners = function(type) {
	  var ret;
	  if (!this._events || !this._events[type])
	    ret = [];
	  else if (isFunction(this._events[type]))
	    ret = [this._events[type]];
	  else
	    ret = this._events[type].slice();
	  return ret;
	};

	EventEmitter.listenerCount = function(emitter, type) {
	  var ret;
	  if (!emitter._events || !emitter._events[type])
	    ret = 0;
	  else if (isFunction(emitter._events[type]))
	    ret = 1;
	  else
	    ret = emitter._events[type].length;
	  return ret;
	};

	function isFunction(arg) {
	  return typeof arg === 'function';
	}

	function isNumber(arg) {
	  return typeof arg === 'number';
	}

	function isObject(arg) {
	  return typeof arg === 'object' && arg !== null;
	}

	function isUndefined(arg) {
	  return arg === void 0;
	}


/***/ },
/* 76 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(Buffer) {/*!
	 * The buffer module from node.js, for the browser.
	 *
	 * @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
	 * @license  MIT
	 */

	var base64 = __webpack_require__(80)
	var ieee754 = __webpack_require__(78)
	var isArray = __webpack_require__(79)

	exports.Buffer = Buffer
	exports.SlowBuffer = Buffer
	exports.INSPECT_MAX_BYTES = 50
	Buffer.poolSize = 8192 // not used by this implementation

	var kMaxLength = 0x3fffffff

	/**
	 * If `Buffer.TYPED_ARRAY_SUPPORT`:
	 *   === true    Use Uint8Array implementation (fastest)
	 *   === false   Use Object implementation (most compatible, even IE6)
	 *
	 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
	 * Opera 11.6+, iOS 4.2+.
	 *
	 * Note:
	 *
	 * - Implementation must support adding new properties to `Uint8Array` instances.
	 *   Firefox 4-29 lacked support, fixed in Firefox 30+.
	 *   See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438.
	 *
	 *  - Chrome 9-10 is missing the `TypedArray.prototype.subarray` function.
	 *
	 *  - IE10 has a broken `TypedArray.prototype.subarray` function which returns arrays of
	 *    incorrect length in some situations.
	 *
	 * We detect these buggy browsers and set `Buffer.TYPED_ARRAY_SUPPORT` to `false` so they will
	 * get the Object implementation, which is slower but will work correctly.
	 */
	Buffer.TYPED_ARRAY_SUPPORT = (function () {
	  try {
	    var buf = new ArrayBuffer(0)
	    var arr = new Uint8Array(buf)
	    arr.foo = function () { return 42 }
	    return 42 === arr.foo() && // typed array instances can be augmented
	        typeof arr.subarray === 'function' && // chrome 9-10 lack `subarray`
	        new Uint8Array(1).subarray(1, 1).byteLength === 0 // ie10 has broken `subarray`
	  } catch (e) {
	    return false
	  }
	})()

	/**
	 * Class: Buffer
	 * =============
	 *
	 * The Buffer constructor returns instances of `Uint8Array` that are augmented
	 * with function properties for all the node `Buffer` API functions. We use
	 * `Uint8Array` so that square bracket notation works as expected -- it returns
	 * a single octet.
	 *
	 * By augmenting the instances, we can avoid modifying the `Uint8Array`
	 * prototype.
	 */
	function Buffer (subject, encoding, noZero) {
	  if (!(this instanceof Buffer))
	    return new Buffer(subject, encoding, noZero)

	  var type = typeof subject

	  // Find the length
	  var length
	  if (type === 'number')
	    length = subject > 0 ? subject >>> 0 : 0
	  else if (type === 'string') {
	    if (encoding === 'base64')
	      subject = base64clean(subject)
	    length = Buffer.byteLength(subject, encoding)
	  } else if (type === 'object' && subject !== null) { // assume object is array-like
	    if (subject.type === 'Buffer' && isArray(subject.data))
	      subject = subject.data
	    length = +subject.length > 0 ? Math.floor(+subject.length) : 0
	  } else
	    throw new TypeError('must start with number, buffer, array or string')

	  if (this.length > kMaxLength)
	    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
	      'size: 0x' + kMaxLength.toString(16) + ' bytes')

	  var buf
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    // Preferred: Return an augmented `Uint8Array` instance for best performance
	    buf = Buffer._augment(new Uint8Array(length))
	  } else {
	    // Fallback: Return THIS instance of Buffer (created by `new`)
	    buf = this
	    buf.length = length
	    buf._isBuffer = true
	  }

	  var i
	  if (Buffer.TYPED_ARRAY_SUPPORT && typeof subject.byteLength === 'number') {
	    // Speed optimization -- use set if we're copying from a typed array
	    buf._set(subject)
	  } else if (isArrayish(subject)) {
	    // Treat array-ish objects as a byte array
	    if (Buffer.isBuffer(subject)) {
	      for (i = 0; i < length; i++)
	        buf[i] = subject.readUInt8(i)
	    } else {
	      for (i = 0; i < length; i++)
	        buf[i] = ((subject[i] % 256) + 256) % 256
	    }
	  } else if (type === 'string') {
	    buf.write(subject, 0, encoding)
	  } else if (type === 'number' && !Buffer.TYPED_ARRAY_SUPPORT && !noZero) {
	    for (i = 0; i < length; i++) {
	      buf[i] = 0
	    }
	  }

	  return buf
	}

	Buffer.isBuffer = function (b) {
	  return !!(b != null && b._isBuffer)
	}

	Buffer.compare = function (a, b) {
	  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b))
	    throw new TypeError('Arguments must be Buffers')

	  var x = a.length
	  var y = b.length
	  for (var i = 0, len = Math.min(x, y); i < len && a[i] === b[i]; i++) {}
	  if (i !== len) {
	    x = a[i]
	    y = b[i]
	  }
	  if (x < y) return -1
	  if (y < x) return 1
	  return 0
	}

	Buffer.isEncoding = function (encoding) {
	  switch (String(encoding).toLowerCase()) {
	    case 'hex':
	    case 'utf8':
	    case 'utf-8':
	    case 'ascii':
	    case 'binary':
	    case 'base64':
	    case 'raw':
	    case 'ucs2':
	    case 'ucs-2':
	    case 'utf16le':
	    case 'utf-16le':
	      return true
	    default:
	      return false
	  }
	}

	Buffer.concat = function (list, totalLength) {
	  if (!isArray(list)) throw new TypeError('Usage: Buffer.concat(list[, length])')

	  if (list.length === 0) {
	    return new Buffer(0)
	  } else if (list.length === 1) {
	    return list[0]
	  }

	  var i
	  if (totalLength === undefined) {
	    totalLength = 0
	    for (i = 0; i < list.length; i++) {
	      totalLength += list[i].length
	    }
	  }

	  var buf = new Buffer(totalLength)
	  var pos = 0
	  for (i = 0; i < list.length; i++) {
	    var item = list[i]
	    item.copy(buf, pos)
	    pos += item.length
	  }
	  return buf
	}

	Buffer.byteLength = function (str, encoding) {
	  var ret
	  str = str + ''
	  switch (encoding || 'utf8') {
	    case 'ascii':
	    case 'binary':
	    case 'raw':
	      ret = str.length
	      break
	    case 'ucs2':
	    case 'ucs-2':
	    case 'utf16le':
	    case 'utf-16le':
	      ret = str.length * 2
	      break
	    case 'hex':
	      ret = str.length >>> 1
	      break
	    case 'utf8':
	    case 'utf-8':
	      ret = utf8ToBytes(str).length
	      break
	    case 'base64':
	      ret = base64ToBytes(str).length
	      break
	    default:
	      ret = str.length
	  }
	  return ret
	}

	// pre-set for values that may exist in the future
	Buffer.prototype.length = undefined
	Buffer.prototype.parent = undefined

	// toString(encoding, start=0, end=buffer.length)
	Buffer.prototype.toString = function (encoding, start, end) {
	  var loweredCase = false

	  start = start >>> 0
	  end = end === undefined || end === Infinity ? this.length : end >>> 0

	  if (!encoding) encoding = 'utf8'
	  if (start < 0) start = 0
	  if (end > this.length) end = this.length
	  if (end <= start) return ''

	  while (true) {
	    switch (encoding) {
	      case 'hex':
	        return hexSlice(this, start, end)

	      case 'utf8':
	      case 'utf-8':
	        return utf8Slice(this, start, end)

	      case 'ascii':
	        return asciiSlice(this, start, end)

	      case 'binary':
	        return binarySlice(this, start, end)

	      case 'base64':
	        return base64Slice(this, start, end)

	      case 'ucs2':
	      case 'ucs-2':
	      case 'utf16le':
	      case 'utf-16le':
	        return utf16leSlice(this, start, end)

	      default:
	        if (loweredCase)
	          throw new TypeError('Unknown encoding: ' + encoding)
	        encoding = (encoding + '').toLowerCase()
	        loweredCase = true
	    }
	  }
	}

	Buffer.prototype.equals = function (b) {
	  if(!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
	  return Buffer.compare(this, b) === 0
	}

	Buffer.prototype.inspect = function () {
	  var str = ''
	  var max = exports.INSPECT_MAX_BYTES
	  if (this.length > 0) {
	    str = this.toString('hex', 0, max).match(/.{2}/g).join(' ')
	    if (this.length > max)
	      str += ' ... '
	  }
	  return '<Buffer ' + str + '>'
	}

	Buffer.prototype.compare = function (b) {
	  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
	  return Buffer.compare(this, b)
	}

	// `get` will be removed in Node 0.13+
	Buffer.prototype.get = function (offset) {
	  console.log('.get() is deprecated. Access using array indexes instead.')
	  return this.readUInt8(offset)
	}

	// `set` will be removed in Node 0.13+
	Buffer.prototype.set = function (v, offset) {
	  console.log('.set() is deprecated. Access using array indexes instead.')
	  return this.writeUInt8(v, offset)
	}

	function hexWrite (buf, string, offset, length) {
	  offset = Number(offset) || 0
	  var remaining = buf.length - offset
	  if (!length) {
	    length = remaining
	  } else {
	    length = Number(length)
	    if (length > remaining) {
	      length = remaining
	    }
	  }

	  // must be an even number of digits
	  var strLen = string.length
	  if (strLen % 2 !== 0) throw new Error('Invalid hex string')

	  if (length > strLen / 2) {
	    length = strLen / 2
	  }
	  for (var i = 0; i < length; i++) {
	    var byte = parseInt(string.substr(i * 2, 2), 16)
	    if (isNaN(byte)) throw new Error('Invalid hex string')
	    buf[offset + i] = byte
	  }
	  return i
	}

	function utf8Write (buf, string, offset, length) {
	  var charsWritten = blitBuffer(utf8ToBytes(string), buf, offset, length)
	  return charsWritten
	}

	function asciiWrite (buf, string, offset, length) {
	  var charsWritten = blitBuffer(asciiToBytes(string), buf, offset, length)
	  return charsWritten
	}

	function binaryWrite (buf, string, offset, length) {
	  return asciiWrite(buf, string, offset, length)
	}

	function base64Write (buf, string, offset, length) {
	  var charsWritten = blitBuffer(base64ToBytes(string), buf, offset, length)
	  return charsWritten
	}

	function utf16leWrite (buf, string, offset, length) {
	  var charsWritten = blitBuffer(utf16leToBytes(string), buf, offset, length, 2)
	  return charsWritten
	}

	Buffer.prototype.write = function (string, offset, length, encoding) {
	  // Support both (string, offset, length, encoding)
	  // and the legacy (string, encoding, offset, length)
	  if (isFinite(offset)) {
	    if (!isFinite(length)) {
	      encoding = length
	      length = undefined
	    }
	  } else {  // legacy
	    var swap = encoding
	    encoding = offset
	    offset = length
	    length = swap
	  }

	  offset = Number(offset) || 0
	  var remaining = this.length - offset
	  if (!length) {
	    length = remaining
	  } else {
	    length = Number(length)
	    if (length > remaining) {
	      length = remaining
	    }
	  }
	  encoding = String(encoding || 'utf8').toLowerCase()

	  var ret
	  switch (encoding) {
	    case 'hex':
	      ret = hexWrite(this, string, offset, length)
	      break
	    case 'utf8':
	    case 'utf-8':
	      ret = utf8Write(this, string, offset, length)
	      break
	    case 'ascii':
	      ret = asciiWrite(this, string, offset, length)
	      break
	    case 'binary':
	      ret = binaryWrite(this, string, offset, length)
	      break
	    case 'base64':
	      ret = base64Write(this, string, offset, length)
	      break
	    case 'ucs2':
	    case 'ucs-2':
	    case 'utf16le':
	    case 'utf-16le':
	      ret = utf16leWrite(this, string, offset, length)
	      break
	    default:
	      throw new TypeError('Unknown encoding: ' + encoding)
	  }
	  return ret
	}

	Buffer.prototype.toJSON = function () {
	  return {
	    type: 'Buffer',
	    data: Array.prototype.slice.call(this._arr || this, 0)
	  }
	}

	function base64Slice (buf, start, end) {
	  if (start === 0 && end === buf.length) {
	    return base64.fromByteArray(buf)
	  } else {
	    return base64.fromByteArray(buf.slice(start, end))
	  }
	}

	function utf8Slice (buf, start, end) {
	  var res = ''
	  var tmp = ''
	  end = Math.min(buf.length, end)

	  for (var i = start; i < end; i++) {
	    if (buf[i] <= 0x7F) {
	      res += decodeUtf8Char(tmp) + String.fromCharCode(buf[i])
	      tmp = ''
	    } else {
	      tmp += '%' + buf[i].toString(16)
	    }
	  }

	  return res + decodeUtf8Char(tmp)
	}

	function asciiSlice (buf, start, end) {
	  var ret = ''
	  end = Math.min(buf.length, end)

	  for (var i = start; i < end; i++) {
	    ret += String.fromCharCode(buf[i])
	  }
	  return ret
	}

	function binarySlice (buf, start, end) {
	  return asciiSlice(buf, start, end)
	}

	function hexSlice (buf, start, end) {
	  var len = buf.length

	  if (!start || start < 0) start = 0
	  if (!end || end < 0 || end > len) end = len

	  var out = ''
	  for (var i = start; i < end; i++) {
	    out += toHex(buf[i])
	  }
	  return out
	}

	function utf16leSlice (buf, start, end) {
	  var bytes = buf.slice(start, end)
	  var res = ''
	  for (var i = 0; i < bytes.length; i += 2) {
	    res += String.fromCharCode(bytes[i] + bytes[i + 1] * 256)
	  }
	  return res
	}

	Buffer.prototype.slice = function (start, end) {
	  var len = this.length
	  start = ~~start
	  end = end === undefined ? len : ~~end

	  if (start < 0) {
	    start += len;
	    if (start < 0)
	      start = 0
	  } else if (start > len) {
	    start = len
	  }

	  if (end < 0) {
	    end += len
	    if (end < 0)
	      end = 0
	  } else if (end > len) {
	    end = len
	  }

	  if (end < start)
	    end = start

	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    return Buffer._augment(this.subarray(start, end))
	  } else {
	    var sliceLen = end - start
	    var newBuf = new Buffer(sliceLen, undefined, true)
	    for (var i = 0; i < sliceLen; i++) {
	      newBuf[i] = this[i + start]
	    }
	    return newBuf
	  }
	}

	/*
	 * Need to make sure that buffer isn't trying to write out of bounds.
	 */
	function checkOffset (offset, ext, length) {
	  if ((offset % 1) !== 0 || offset < 0)
	    throw new RangeError('offset is not uint')
	  if (offset + ext > length)
	    throw new RangeError('Trying to access beyond buffer length')
	}

	Buffer.prototype.readUInt8 = function (offset, noAssert) {
	  if (!noAssert)
	    checkOffset(offset, 1, this.length)
	  return this[offset]
	}

	Buffer.prototype.readUInt16LE = function (offset, noAssert) {
	  if (!noAssert)
	    checkOffset(offset, 2, this.length)
	  return this[offset] | (this[offset + 1] << 8)
	}

	Buffer.prototype.readUInt16BE = function (offset, noAssert) {
	  if (!noAssert)
	    checkOffset(offset, 2, this.length)
	  return (this[offset] << 8) | this[offset + 1]
	}

	Buffer.prototype.readUInt32LE = function (offset, noAssert) {
	  if (!noAssert)
	    checkOffset(offset, 4, this.length)

	  return ((this[offset]) |
	      (this[offset + 1] << 8) |
	      (this[offset + 2] << 16)) +
	      (this[offset + 3] * 0x1000000)
	}

	Buffer.prototype.readUInt32BE = function (offset, noAssert) {
	  if (!noAssert)
	    checkOffset(offset, 4, this.length)

	  return (this[offset] * 0x1000000) +
	      ((this[offset + 1] << 16) |
	      (this[offset + 2] << 8) |
	      this[offset + 3])
	}

	Buffer.prototype.readInt8 = function (offset, noAssert) {
	  if (!noAssert)
	    checkOffset(offset, 1, this.length)
	  if (!(this[offset] & 0x80))
	    return (this[offset])
	  return ((0xff - this[offset] + 1) * -1)
	}

	Buffer.prototype.readInt16LE = function (offset, noAssert) {
	  if (!noAssert)
	    checkOffset(offset, 2, this.length)
	  var val = this[offset] | (this[offset + 1] << 8)
	  return (val & 0x8000) ? val | 0xFFFF0000 : val
	}

	Buffer.prototype.readInt16BE = function (offset, noAssert) {
	  if (!noAssert)
	    checkOffset(offset, 2, this.length)
	  var val = this[offset + 1] | (this[offset] << 8)
	  return (val & 0x8000) ? val | 0xFFFF0000 : val
	}

	Buffer.prototype.readInt32LE = function (offset, noAssert) {
	  if (!noAssert)
	    checkOffset(offset, 4, this.length)

	  return (this[offset]) |
	      (this[offset + 1] << 8) |
	      (this[offset + 2] << 16) |
	      (this[offset + 3] << 24)
	}

	Buffer.prototype.readInt32BE = function (offset, noAssert) {
	  if (!noAssert)
	    checkOffset(offset, 4, this.length)

	  return (this[offset] << 24) |
	      (this[offset + 1] << 16) |
	      (this[offset + 2] << 8) |
	      (this[offset + 3])
	}

	Buffer.prototype.readFloatLE = function (offset, noAssert) {
	  if (!noAssert)
	    checkOffset(offset, 4, this.length)
	  return ieee754.read(this, offset, true, 23, 4)
	}

	Buffer.prototype.readFloatBE = function (offset, noAssert) {
	  if (!noAssert)
	    checkOffset(offset, 4, this.length)
	  return ieee754.read(this, offset, false, 23, 4)
	}

	Buffer.prototype.readDoubleLE = function (offset, noAssert) {
	  if (!noAssert)
	    checkOffset(offset, 8, this.length)
	  return ieee754.read(this, offset, true, 52, 8)
	}

	Buffer.prototype.readDoubleBE = function (offset, noAssert) {
	  if (!noAssert)
	    checkOffset(offset, 8, this.length)
	  return ieee754.read(this, offset, false, 52, 8)
	}

	function checkInt (buf, value, offset, ext, max, min) {
	  if (!Buffer.isBuffer(buf)) throw new TypeError('buffer must be a Buffer instance')
	  if (value > max || value < min) throw new TypeError('value is out of bounds')
	  if (offset + ext > buf.length) throw new TypeError('index out of range')
	}

	Buffer.prototype.writeUInt8 = function (value, offset, noAssert) {
	  value = +value
	  offset = offset >>> 0
	  if (!noAssert)
	    checkInt(this, value, offset, 1, 0xff, 0)
	  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value)
	  this[offset] = value
	  return offset + 1
	}

	function objectWriteUInt16 (buf, value, offset, littleEndian) {
	  if (value < 0) value = 0xffff + value + 1
	  for (var i = 0, j = Math.min(buf.length - offset, 2); i < j; i++) {
	    buf[offset + i] = (value & (0xff << (8 * (littleEndian ? i : 1 - i)))) >>>
	      (littleEndian ? i : 1 - i) * 8
	  }
	}

	Buffer.prototype.writeUInt16LE = function (value, offset, noAssert) {
	  value = +value
	  offset = offset >>> 0
	  if (!noAssert)
	    checkInt(this, value, offset, 2, 0xffff, 0)
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    this[offset] = value
	    this[offset + 1] = (value >>> 8)
	  } else objectWriteUInt16(this, value, offset, true)
	  return offset + 2
	}

	Buffer.prototype.writeUInt16BE = function (value, offset, noAssert) {
	  value = +value
	  offset = offset >>> 0
	  if (!noAssert)
	    checkInt(this, value, offset, 2, 0xffff, 0)
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    this[offset] = (value >>> 8)
	    this[offset + 1] = value
	  } else objectWriteUInt16(this, value, offset, false)
	  return offset + 2
	}

	function objectWriteUInt32 (buf, value, offset, littleEndian) {
	  if (value < 0) value = 0xffffffff + value + 1
	  for (var i = 0, j = Math.min(buf.length - offset, 4); i < j; i++) {
	    buf[offset + i] = (value >>> (littleEndian ? i : 3 - i) * 8) & 0xff
	  }
	}

	Buffer.prototype.writeUInt32LE = function (value, offset, noAssert) {
	  value = +value
	  offset = offset >>> 0
	  if (!noAssert)
	    checkInt(this, value, offset, 4, 0xffffffff, 0)
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    this[offset + 3] = (value >>> 24)
	    this[offset + 2] = (value >>> 16)
	    this[offset + 1] = (value >>> 8)
	    this[offset] = value
	  } else objectWriteUInt32(this, value, offset, true)
	  return offset + 4
	}

	Buffer.prototype.writeUInt32BE = function (value, offset, noAssert) {
	  value = +value
	  offset = offset >>> 0
	  if (!noAssert)
	    checkInt(this, value, offset, 4, 0xffffffff, 0)
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    this[offset] = (value >>> 24)
	    this[offset + 1] = (value >>> 16)
	    this[offset + 2] = (value >>> 8)
	    this[offset + 3] = value
	  } else objectWriteUInt32(this, value, offset, false)
	  return offset + 4
	}

	Buffer.prototype.writeInt8 = function (value, offset, noAssert) {
	  value = +value
	  offset = offset >>> 0
	  if (!noAssert)
	    checkInt(this, value, offset, 1, 0x7f, -0x80)
	  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value)
	  if (value < 0) value = 0xff + value + 1
	  this[offset] = value
	  return offset + 1
	}

	Buffer.prototype.writeInt16LE = function (value, offset, noAssert) {
	  value = +value
	  offset = offset >>> 0
	  if (!noAssert)
	    checkInt(this, value, offset, 2, 0x7fff, -0x8000)
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    this[offset] = value
	    this[offset + 1] = (value >>> 8)
	  } else objectWriteUInt16(this, value, offset, true)
	  return offset + 2
	}

	Buffer.prototype.writeInt16BE = function (value, offset, noAssert) {
	  value = +value
	  offset = offset >>> 0
	  if (!noAssert)
	    checkInt(this, value, offset, 2, 0x7fff, -0x8000)
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    this[offset] = (value >>> 8)
	    this[offset + 1] = value
	  } else objectWriteUInt16(this, value, offset, false)
	  return offset + 2
	}

	Buffer.prototype.writeInt32LE = function (value, offset, noAssert) {
	  value = +value
	  offset = offset >>> 0
	  if (!noAssert)
	    checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    this[offset] = value
	    this[offset + 1] = (value >>> 8)
	    this[offset + 2] = (value >>> 16)
	    this[offset + 3] = (value >>> 24)
	  } else objectWriteUInt32(this, value, offset, true)
	  return offset + 4
	}

	Buffer.prototype.writeInt32BE = function (value, offset, noAssert) {
	  value = +value
	  offset = offset >>> 0
	  if (!noAssert)
	    checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
	  if (value < 0) value = 0xffffffff + value + 1
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    this[offset] = (value >>> 24)
	    this[offset + 1] = (value >>> 16)
	    this[offset + 2] = (value >>> 8)
	    this[offset + 3] = value
	  } else objectWriteUInt32(this, value, offset, false)
	  return offset + 4
	}

	function checkIEEE754 (buf, value, offset, ext, max, min) {
	  if (value > max || value < min) throw new TypeError('value is out of bounds')
	  if (offset + ext > buf.length) throw new TypeError('index out of range')
	}

	function writeFloat (buf, value, offset, littleEndian, noAssert) {
	  if (!noAssert)
	    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
	  ieee754.write(buf, value, offset, littleEndian, 23, 4)
	  return offset + 4
	}

	Buffer.prototype.writeFloatLE = function (value, offset, noAssert) {
	  return writeFloat(this, value, offset, true, noAssert)
	}

	Buffer.prototype.writeFloatBE = function (value, offset, noAssert) {
	  return writeFloat(this, value, offset, false, noAssert)
	}

	function writeDouble (buf, value, offset, littleEndian, noAssert) {
	  if (!noAssert)
	    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
	  ieee754.write(buf, value, offset, littleEndian, 52, 8)
	  return offset + 8
	}

	Buffer.prototype.writeDoubleLE = function (value, offset, noAssert) {
	  return writeDouble(this, value, offset, true, noAssert)
	}

	Buffer.prototype.writeDoubleBE = function (value, offset, noAssert) {
	  return writeDouble(this, value, offset, false, noAssert)
	}

	// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
	Buffer.prototype.copy = function (target, target_start, start, end) {
	  var source = this

	  if (!start) start = 0
	  if (!end && end !== 0) end = this.length
	  if (!target_start) target_start = 0

	  // Copy 0 bytes; we're done
	  if (end === start) return
	  if (target.length === 0 || source.length === 0) return

	  // Fatal error conditions
	  if (end < start) throw new TypeError('sourceEnd < sourceStart')
	  if (target_start < 0 || target_start >= target.length)
	    throw new TypeError('targetStart out of bounds')
	  if (start < 0 || start >= source.length) throw new TypeError('sourceStart out of bounds')
	  if (end < 0 || end > source.length) throw new TypeError('sourceEnd out of bounds')

	  // Are we oob?
	  if (end > this.length)
	    end = this.length
	  if (target.length - target_start < end - start)
	    end = target.length - target_start + start

	  var len = end - start

	  if (len < 1000 || !Buffer.TYPED_ARRAY_SUPPORT) {
	    for (var i = 0; i < len; i++) {
	      target[i + target_start] = this[i + start]
	    }
	  } else {
	    target._set(this.subarray(start, start + len), target_start)
	  }
	}

	// fill(value, start=0, end=buffer.length)
	Buffer.prototype.fill = function (value, start, end) {
	  if (!value) value = 0
	  if (!start) start = 0
	  if (!end) end = this.length

	  if (end < start) throw new TypeError('end < start')

	  // Fill 0 bytes; we're done
	  if (end === start) return
	  if (this.length === 0) return

	  if (start < 0 || start >= this.length) throw new TypeError('start out of bounds')
	  if (end < 0 || end > this.length) throw new TypeError('end out of bounds')

	  var i
	  if (typeof value === 'number') {
	    for (i = start; i < end; i++) {
	      this[i] = value
	    }
	  } else {
	    var bytes = utf8ToBytes(value.toString())
	    var len = bytes.length
	    for (i = start; i < end; i++) {
	      this[i] = bytes[i % len]
	    }
	  }

	  return this
	}

	/**
	 * Creates a new `ArrayBuffer` with the *copied* memory of the buffer instance.
	 * Added in Node 0.12. Only available in browsers that support ArrayBuffer.
	 */
	Buffer.prototype.toArrayBuffer = function () {
	  if (typeof Uint8Array !== 'undefined') {
	    if (Buffer.TYPED_ARRAY_SUPPORT) {
	      return (new Buffer(this)).buffer
	    } else {
	      var buf = new Uint8Array(this.length)
	      for (var i = 0, len = buf.length; i < len; i += 1) {
	        buf[i] = this[i]
	      }
	      return buf.buffer
	    }
	  } else {
	    throw new TypeError('Buffer.toArrayBuffer not supported in this browser')
	  }
	}

	// HELPER FUNCTIONS
	// ================

	var BP = Buffer.prototype

	/**
	 * Augment a Uint8Array *instance* (not the Uint8Array class!) with Buffer methods
	 */
	Buffer._augment = function (arr) {
	  arr.constructor = Buffer
	  arr._isBuffer = true

	  // save reference to original Uint8Array get/set methods before overwriting
	  arr._get = arr.get
	  arr._set = arr.set

	  // deprecated, will be removed in node 0.13+
	  arr.get = BP.get
	  arr.set = BP.set

	  arr.write = BP.write
	  arr.toString = BP.toString
	  arr.toLocaleString = BP.toString
	  arr.toJSON = BP.toJSON
	  arr.equals = BP.equals
	  arr.compare = BP.compare
	  arr.copy = BP.copy
	  arr.slice = BP.slice
	  arr.readUInt8 = BP.readUInt8
	  arr.readUInt16LE = BP.readUInt16LE
	  arr.readUInt16BE = BP.readUInt16BE
	  arr.readUInt32LE = BP.readUInt32LE
	  arr.readUInt32BE = BP.readUInt32BE
	  arr.readInt8 = BP.readInt8
	  arr.readInt16LE = BP.readInt16LE
	  arr.readInt16BE = BP.readInt16BE
	  arr.readInt32LE = BP.readInt32LE
	  arr.readInt32BE = BP.readInt32BE
	  arr.readFloatLE = BP.readFloatLE
	  arr.readFloatBE = BP.readFloatBE
	  arr.readDoubleLE = BP.readDoubleLE
	  arr.readDoubleBE = BP.readDoubleBE
	  arr.writeUInt8 = BP.writeUInt8
	  arr.writeUInt16LE = BP.writeUInt16LE
	  arr.writeUInt16BE = BP.writeUInt16BE
	  arr.writeUInt32LE = BP.writeUInt32LE
	  arr.writeUInt32BE = BP.writeUInt32BE
	  arr.writeInt8 = BP.writeInt8
	  arr.writeInt16LE = BP.writeInt16LE
	  arr.writeInt16BE = BP.writeInt16BE
	  arr.writeInt32LE = BP.writeInt32LE
	  arr.writeInt32BE = BP.writeInt32BE
	  arr.writeFloatLE = BP.writeFloatLE
	  arr.writeFloatBE = BP.writeFloatBE
	  arr.writeDoubleLE = BP.writeDoubleLE
	  arr.writeDoubleBE = BP.writeDoubleBE
	  arr.fill = BP.fill
	  arr.inspect = BP.inspect
	  arr.toArrayBuffer = BP.toArrayBuffer

	  return arr
	}

	var INVALID_BASE64_RE = /[^+\/0-9A-z]/g

	function base64clean (str) {
	  // Node strips out invalid characters like \n and \t from the string, base64-js does not
	  str = stringtrim(str).replace(INVALID_BASE64_RE, '')
	  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
	  while (str.length % 4 !== 0) {
	    str = str + '='
	  }
	  return str
	}

	function stringtrim (str) {
	  if (str.trim) return str.trim()
	  return str.replace(/^\s+|\s+$/g, '')
	}

	function isArrayish (subject) {
	  return isArray(subject) || Buffer.isBuffer(subject) ||
	      subject && typeof subject === 'object' &&
	      typeof subject.length === 'number'
	}

	function toHex (n) {
	  if (n < 16) return '0' + n.toString(16)
	  return n.toString(16)
	}

	function utf8ToBytes (str) {
	  var byteArray = []
	  for (var i = 0; i < str.length; i++) {
	    var b = str.charCodeAt(i)
	    if (b <= 0x7F) {
	      byteArray.push(b)
	    } else {
	      var start = i
	      if (b >= 0xD800 && b <= 0xDFFF) i++
	      var h = encodeURIComponent(str.slice(start, i+1)).substr(1).split('%')
	      for (var j = 0; j < h.length; j++) {
	        byteArray.push(parseInt(h[j], 16))
	      }
	    }
	  }
	  return byteArray
	}

	function asciiToBytes (str) {
	  var byteArray = []
	  for (var i = 0; i < str.length; i++) {
	    // Node's code seems to be doing this and not & 0x7F..
	    byteArray.push(str.charCodeAt(i) & 0xFF)
	  }
	  return byteArray
	}

	function utf16leToBytes (str) {
	  var c, hi, lo
	  var byteArray = []
	  for (var i = 0; i < str.length; i++) {
	    c = str.charCodeAt(i)
	    hi = c >> 8
	    lo = c % 256
	    byteArray.push(lo)
	    byteArray.push(hi)
	  }

	  return byteArray
	}

	function base64ToBytes (str) {
	  return base64.toByteArray(str)
	}

	function blitBuffer (src, dst, offset, length, unitSize) {
	  if (unitSize) length -= length % unitSize;
	  for (var i = 0; i < length; i++) {
	    if ((i + offset >= dst.length) || (i >= src.length))
	      break
	    dst[i + offset] = src[i]
	  }
	  return i
	}

	function decodeUtf8Char (str) {
	  try {
	    return decodeURIComponent(str)
	  } catch (err) {
	    return String.fromCharCode(0xFFFD) // UTF 8 invalid char
	  }
	}
	
	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(76).Buffer))

/***/ },
/* 77 */
/***/ function(module, exports, __webpack_require__) {

	
	var indexOf = [].indexOf;

	module.exports = function(arr, obj){
	  if (indexOf) return arr.indexOf(obj);
	  for (var i = 0; i < arr.length; ++i) {
	    if (arr[i] === obj) return i;
	  }
	  return -1;
	};

/***/ },
/* 78 */
/***/ function(module, exports, __webpack_require__) {

	exports.read = function(buffer, offset, isLE, mLen, nBytes) {
	  var e, m,
	      eLen = nBytes * 8 - mLen - 1,
	      eMax = (1 << eLen) - 1,
	      eBias = eMax >> 1,
	      nBits = -7,
	      i = isLE ? (nBytes - 1) : 0,
	      d = isLE ? -1 : 1,
	      s = buffer[offset + i];

	  i += d;

	  e = s & ((1 << (-nBits)) - 1);
	  s >>= (-nBits);
	  nBits += eLen;
	  for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8);

	  m = e & ((1 << (-nBits)) - 1);
	  e >>= (-nBits);
	  nBits += mLen;
	  for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8);

	  if (e === 0) {
	    e = 1 - eBias;
	  } else if (e === eMax) {
	    return m ? NaN : ((s ? -1 : 1) * Infinity);
	  } else {
	    m = m + Math.pow(2, mLen);
	    e = e - eBias;
	  }
	  return (s ? -1 : 1) * m * Math.pow(2, e - mLen);
	};

	exports.write = function(buffer, value, offset, isLE, mLen, nBytes) {
	  var e, m, c,
	      eLen = nBytes * 8 - mLen - 1,
	      eMax = (1 << eLen) - 1,
	      eBias = eMax >> 1,
	      rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0),
	      i = isLE ? 0 : (nBytes - 1),
	      d = isLE ? 1 : -1,
	      s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0;

	  value = Math.abs(value);

	  if (isNaN(value) || value === Infinity) {
	    m = isNaN(value) ? 1 : 0;
	    e = eMax;
	  } else {
	    e = Math.floor(Math.log(value) / Math.LN2);
	    if (value * (c = Math.pow(2, -e)) < 1) {
	      e--;
	      c *= 2;
	    }
	    if (e + eBias >= 1) {
	      value += rt / c;
	    } else {
	      value += rt * Math.pow(2, 1 - eBias);
	    }
	    if (value * c >= 2) {
	      e++;
	      c /= 2;
	    }

	    if (e + eBias >= eMax) {
	      m = 0;
	      e = eMax;
	    } else if (e + eBias >= 1) {
	      m = (value * c - 1) * Math.pow(2, mLen);
	      e = e + eBias;
	    } else {
	      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen);
	      e = 0;
	    }
	  }

	  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8);

	  e = (e << mLen) | m;
	  eLen += mLen;
	  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8);

	  buffer[offset + i - d] |= s * 128;
	};


/***/ },
/* 79 */
/***/ function(module, exports, __webpack_require__) {

	
	/**
	 * isArray
	 */

	var isArray = Array.isArray;

	/**
	 * toString
	 */

	var str = Object.prototype.toString;

	/**
	 * Whether or not the given `val`
	 * is an array.
	 *
	 * example:
	 *
	 *        isArray([]);
	 *        // > true
	 *        isArray(arguments);
	 *        // > false
	 *        isArray('');
	 *        // > false
	 *
	 * @param {mixed} val
	 * @return {bool}
	 */

	module.exports = isArray || function (val) {
	  return !! val && '[object Array]' == str.call(val);
	};


/***/ },
/* 80 */
/***/ function(module, exports, __webpack_require__) {

	var lookup = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

	;(function (exports) {
		'use strict';

	  var Arr = (typeof Uint8Array !== 'undefined')
	    ? Uint8Array
	    : Array

		var PLUS   = '+'.charCodeAt(0)
		var SLASH  = '/'.charCodeAt(0)
		var NUMBER = '0'.charCodeAt(0)
		var LOWER  = 'a'.charCodeAt(0)
		var UPPER  = 'A'.charCodeAt(0)

		function decode (elt) {
			var code = elt.charCodeAt(0)
			if (code === PLUS)
				return 62 // '+'
			if (code === SLASH)
				return 63 // '/'
			if (code < NUMBER)
				return -1 //no match
			if (code < NUMBER + 10)
				return code - NUMBER + 26 + 26
			if (code < UPPER + 26)
				return code - UPPER
			if (code < LOWER + 26)
				return code - LOWER + 26
		}

		function b64ToByteArray (b64) {
			var i, j, l, tmp, placeHolders, arr

			if (b64.length % 4 > 0) {
				throw new Error('Invalid string. Length must be a multiple of 4')
			}

			// the number of equal signs (place holders)
			// if there are two placeholders, than the two characters before it
			// represent one byte
			// if there is only one, then the three characters before it represent 2 bytes
			// this is just a cheap hack to not do indexOf twice
			var len = b64.length
			placeHolders = '=' === b64.charAt(len - 2) ? 2 : '=' === b64.charAt(len - 1) ? 1 : 0

			// base64 is 4/3 + up to two characters of the original data
			arr = new Arr(b64.length * 3 / 4 - placeHolders)

			// if there are placeholders, only get up to the last complete 4 chars
			l = placeHolders > 0 ? b64.length - 4 : b64.length

			var L = 0

			function push (v) {
				arr[L++] = v
			}

			for (i = 0, j = 0; i < l; i += 4, j += 3) {
				tmp = (decode(b64.charAt(i)) << 18) | (decode(b64.charAt(i + 1)) << 12) | (decode(b64.charAt(i + 2)) << 6) | decode(b64.charAt(i + 3))
				push((tmp & 0xFF0000) >> 16)
				push((tmp & 0xFF00) >> 8)
				push(tmp & 0xFF)
			}

			if (placeHolders === 2) {
				tmp = (decode(b64.charAt(i)) << 2) | (decode(b64.charAt(i + 1)) >> 4)
				push(tmp & 0xFF)
			} else if (placeHolders === 1) {
				tmp = (decode(b64.charAt(i)) << 10) | (decode(b64.charAt(i + 1)) << 4) | (decode(b64.charAt(i + 2)) >> 2)
				push((tmp >> 8) & 0xFF)
				push(tmp & 0xFF)
			}

			return arr
		}

		function uint8ToBase64 (uint8) {
			var i,
				extraBytes = uint8.length % 3, // if we have 1 byte left, pad 2 bytes
				output = "",
				temp, length

			function encode (num) {
				return lookup.charAt(num)
			}

			function tripletToBase64 (num) {
				return encode(num >> 18 & 0x3F) + encode(num >> 12 & 0x3F) + encode(num >> 6 & 0x3F) + encode(num & 0x3F)
			}

			// go through the array every three bytes, we'll deal with trailing stuff later
			for (i = 0, length = uint8.length - extraBytes; i < length; i += 3) {
				temp = (uint8[i] << 16) + (uint8[i + 1] << 8) + (uint8[i + 2])
				output += tripletToBase64(temp)
			}

			// pad the end with zeros, but make sure to not forget the extra bytes
			switch (extraBytes) {
				case 1:
					temp = uint8[uint8.length - 1]
					output += encode(temp >> 2)
					output += encode((temp << 4) & 0x3F)
					output += '=='
					break
				case 2:
					temp = (uint8[uint8.length - 2] << 8) + (uint8[uint8.length - 1])
					output += encode(temp >> 10)
					output += encode((temp >> 4) & 0x3F)
					output += encode((temp << 2) & 0x3F)
					output += '='
					break
			}

			return output
		}

		exports.toByteArray = b64ToByteArray
		exports.fromByteArray = uint8ToBase64
	}(false ? (this.base64js = {}) : exports))


/***/ }
/******/ ])