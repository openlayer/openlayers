var COMPILED = false;
var goog = goog || {};
goog.NODE_JS = false;
goog.global = goog.NODE_JS ? eval("global") : this;
goog.DEBUG = true;
goog.LOCALE = "en";
goog.provide = function(name) {
  if(!COMPILED) {
    if(goog.isProvided_(name)) {
      throw Error('Namespace "' + name + '" already declared.');
    }
    delete goog.implicitNamespaces_[name];
    var namespace = name;
    while(namespace = namespace.substring(0, namespace.lastIndexOf("."))) {
      if(goog.getObjectByName(namespace)) {
        break
      }
      goog.implicitNamespaces_[namespace] = true
    }
  }
  goog.exportPath_(name)
};
goog.setTestOnly = function(opt_message) {
  if(COMPILED && !goog.DEBUG) {
    opt_message = opt_message || "";
    throw Error("Importing test-only code into non-debug environment" + opt_message ? ": " + opt_message : ".");
  }
};
if(!COMPILED) {
  goog.isProvided_ = function(name) {
    return!goog.implicitNamespaces_[name] && !!goog.getObjectByName(name)
  };
  goog.implicitNamespaces_ = {}
}
goog.isExistingGlobalVariable_ = function(goog) {
  return String(eval("typeof " + goog)) !== "undefined"
};
goog.exportPath_ = function(name, opt_object, opt_objectToExportTo) {
  var parts = name.split(".");
  var cur = opt_objectToExportTo || goog.global;
  if(!(parts[0] in cur) && cur.execScript) {
    cur.execScript("var " + parts[0])
  }
  if(goog.NODE_JS && cur === goog.global) {
    if(goog.isExistingGlobalVariable_(parts[0])) {
      cur = eval(parts[0]);
      parts.shift()
    }
  }
  for(var part;parts.length && (part = parts.shift());) {
    if(!parts.length && goog.isDef(opt_object)) {
      cur[part] = opt_object
    }else {
      if(cur[part]) {
        cur = cur[part]
      }else {
        cur = cur[part] = {}
      }
    }
  }
};
goog.getObjectByName = function(name, opt_obj) {
  var parts = name.split(".");
  var cur = opt_obj || goog.global;
  if(goog.NODE_JS && cur === goog.global) {
    if(goog.isExistingGlobalVariable_(parts[0])) {
      cur = eval(parts[0]);
      parts.shift()
    }
  }
  for(var part;part = parts.shift();) {
    if(goog.isDefAndNotNull(cur[part])) {
      cur = cur[part]
    }else {
      return null
    }
  }
  return cur
};
goog.globalize = function(obj, opt_global) {
  var global = opt_global || goog.global;
  for(var x in obj) {
    global[x] = obj[x]
  }
};
goog.addDependency = function(relPath, provides, requires) {
  if(!COMPILED) {
    var provide, require;
    var path = relPath.replace(/\\/g, "/");
    var deps = goog.dependencies_;
    for(var i = 0;provide = provides[i];i++) {
      deps.nameToPath[provide] = path;
      if(!(path in deps.pathToNames)) {
        deps.pathToNames[path] = {}
      }
      deps.pathToNames[path][provide] = true
    }
    for(var j = 0;require = requires[j];j++) {
      if(!(path in deps.requires)) {
        deps.requires[path] = {}
      }
      deps.requires[path][require] = true
    }
  }
};
goog.ENABLE_DEBUG_LOADER = true;
goog.require = function(name) {
  if(!COMPILED) {
    if(goog.isProvided_(name)) {
      return
    }
    if(goog.ENABLE_DEBUG_LOADER) {
      var path = goog.getPathFromDeps_(name);
      if(path) {
        goog.included_[path] = true;
        goog.writeScripts_();
        return
      }
    }
    var errorMessage = "goog.require could not find: " + name;
    if(goog.global.console) {
      goog.global.console["error"](errorMessage)
    }
    throw Error(errorMessage);
  }
};
goog.basePath = "";
goog.global.CLOSURE_BASE_PATH;
goog.global.CLOSURE_NO_DEPS;
goog.global.CLOSURE_IMPORT_SCRIPT;
goog.nullFunction = function() {
};
goog.identityFunction = function(opt_returnValue, var_args) {
  return opt_returnValue
};
goog.abstractMethod = function() {
  throw Error("unimplemented abstract method");
};
goog.addSingletonGetter = function(ctor) {
  ctor.getInstance = function() {
    if(ctor.instance_) {
      return ctor.instance_
    }
    if(goog.DEBUG) {
      goog.instantiatedSingletons_[goog.instantiatedSingletons_.length] = ctor
    }
    return ctor.instance_ = new ctor
  }
};
goog.instantiatedSingletons_ = [];
if(!COMPILED && goog.ENABLE_DEBUG_LOADER) {
  goog.included_ = {};
  goog.dependencies_ = {pathToNames:{}, nameToPath:{}, requires:{}, visited:{}, written:{}};
  goog.inHtmlDocument_ = function() {
    var doc = goog.global.document;
    return typeof doc != "undefined" && "write" in doc
  };
  goog.findBasePath_ = function() {
    if(goog.global.CLOSURE_BASE_PATH) {
      goog.basePath = goog.global.CLOSURE_BASE_PATH;
      return
    }else {
      if(!goog.inHtmlDocument_()) {
        return
      }
    }
    var doc = goog.global.document;
    var scripts = doc.getElementsByTagName("script");
    for(var i = scripts.length - 1;i >= 0;--i) {
      var src = scripts[i].src;
      var qmark = src.lastIndexOf("?");
      var l = qmark == -1 ? src.length : qmark;
      if(src.substr(l - 7, 7) == "base.js") {
        goog.basePath = src.substr(0, l - 7);
        return
      }
    }
  };
  goog.importScript_ = function(src) {
    var importScript = goog.global.CLOSURE_IMPORT_SCRIPT || goog.writeScriptTag_;
    if(!goog.dependencies_.written[src] && importScript(src)) {
      goog.dependencies_.written[src] = true
    }
  };
  goog.writeScriptTag_ = function(src) {
    if(goog.inHtmlDocument_()) {
      var doc = goog.global.document;
      doc.write('<script type="text/javascript" src="' + src + '"></' + "script>");
      return true
    }else {
      return false
    }
  };
  goog.writeScripts_ = function() {
    var scripts = [];
    var seenScript = {};
    var deps = goog.dependencies_;
    function visitNode(path) {
      if(path in deps.written) {
        return
      }
      if(path in deps.visited) {
        if(!(path in seenScript)) {
          seenScript[path] = true;
          scripts.push(path)
        }
        return
      }
      deps.visited[path] = true;
      if(path in deps.requires) {
        for(var requireName in deps.requires[path]) {
          if(!goog.isProvided_(requireName)) {
            if(requireName in deps.nameToPath) {
              visitNode(deps.nameToPath[requireName])
            }else {
              throw Error("Undefined nameToPath for " + requireName);
            }
          }
        }
      }
      if(!(path in seenScript)) {
        seenScript[path] = true;
        scripts.push(path)
      }
    }
    for(var path in goog.included_) {
      if(!deps.written[path]) {
        visitNode(path)
      }
    }
    for(var i = 0;i < scripts.length;i++) {
      if(scripts[i]) {
        goog.importScript_(goog.basePath + scripts[i])
      }else {
        throw Error("Undefined script input");
      }
    }
  };
  goog.getPathFromDeps_ = function(rule) {
    if(rule in goog.dependencies_.nameToPath) {
      return goog.dependencies_.nameToPath[rule]
    }else {
      return null
    }
  };
  goog.findBasePath_();
  if(!goog.global.CLOSURE_NO_DEPS) {
    goog.importScript_(goog.basePath + "deps.js")
  }
}
goog.typeOf = function(value) {
  var s = typeof value;
  if(s == "object") {
    if(value) {
      if(value instanceof Array) {
        return"array"
      }else {
        if(value instanceof Object) {
          return s
        }
      }
      var className = Object.prototype.toString.call(value);
      if(className == "[object Window]") {
        return"object"
      }
      if(className == "[object Array]" || typeof value.length == "number" && typeof value.splice != "undefined" && typeof value.propertyIsEnumerable != "undefined" && !value.propertyIsEnumerable("splice")) {
        return"array"
      }
      if(className == "[object Function]" || typeof value.call != "undefined" && typeof value.propertyIsEnumerable != "undefined" && !value.propertyIsEnumerable("call")) {
        return"function"
      }
    }else {
      return"null"
    }
  }else {
    if(s == "function" && typeof value.call == "undefined") {
      return"object"
    }
  }
  return s
};
goog.isDef = function(val) {
  return val !== undefined
};
goog.isNull = function(val) {
  return val === null
};
goog.isDefAndNotNull = function(val) {
  return val != null
};
goog.isArray = function(val) {
  return goog.typeOf(val) == "array"
};
goog.isArrayLike = function(val) {
  var type = goog.typeOf(val);
  return type == "array" || type == "object" && typeof val.length == "number"
};
goog.isDateLike = function(val) {
  return goog.isObject(val) && typeof val.getFullYear == "function"
};
goog.isString = function(val) {
  return typeof val == "string"
};
goog.isBoolean = function(val) {
  return typeof val == "boolean"
};
goog.isNumber = function(val) {
  return typeof val == "number"
};
goog.isFunction = function(val) {
  return goog.typeOf(val) == "function"
};
goog.isObject = function(val) {
  var type = typeof val;
  return type == "object" && val != null || type == "function"
};
goog.getUid = function(obj) {
  return obj[goog.UID_PROPERTY_] || (obj[goog.UID_PROPERTY_] = ++goog.uidCounter_)
};
goog.removeUid = function(obj) {
  if("removeAttribute" in obj) {
    obj.removeAttribute(goog.UID_PROPERTY_)
  }
  try {
    delete obj[goog.UID_PROPERTY_]
  }catch(ex) {
  }
};
goog.UID_PROPERTY_ = "closure_uid_" + Math.floor(Math.random() * 2147483648).toString(36);
goog.uidCounter_ = 0;
goog.getHashCode = goog.getUid;
goog.removeHashCode = goog.removeUid;
goog.cloneObject = function(obj) {
  var type = goog.typeOf(obj);
  if(type == "object" || type == "array") {
    if(obj.clone) {
      return obj.clone()
    }
    var clone = type == "array" ? [] : {};
    for(var key in obj) {
      clone[key] = goog.cloneObject(obj[key])
    }
    return clone
  }
  return obj
};
goog.bindNative_ = function(fn, selfObj, var_args) {
  return fn.call.apply(fn.bind, arguments)
};
goog.bindJs_ = function(fn, selfObj, var_args) {
  if(!fn) {
    throw new Error;
  }
  if(arguments.length > 2) {
    var boundArgs = Array.prototype.slice.call(arguments, 2);
    return function() {
      var newArgs = Array.prototype.slice.call(arguments);
      Array.prototype.unshift.apply(newArgs, boundArgs);
      return fn.apply(selfObj, newArgs)
    }
  }else {
    return function() {
      return fn.apply(selfObj, arguments)
    }
  }
};
goog.bind = function(fn, selfObj, var_args) {
  if(Function.prototype.bind && Function.prototype.bind.toString().indexOf("native code") != -1) {
    goog.bind = goog.bindNative_
  }else {
    goog.bind = goog.bindJs_
  }
  return goog.bind.apply(null, arguments)
};
goog.partial = function(fn, var_args) {
  var args = Array.prototype.slice.call(arguments, 1);
  return function() {
    var newArgs = Array.prototype.slice.call(arguments);
    newArgs.unshift.apply(newArgs, args);
    return fn.apply(this, newArgs)
  }
};
goog.mixin = function(target, source) {
  for(var x in source) {
    target[x] = source[x]
  }
};
goog.now = Date.now || function() {
  return+new Date
};
goog.globalEval = function(script) {
  if(goog.global.execScript) {
    goog.global.execScript(script, "JavaScript")
  }else {
    if(goog.global.eval) {
      if(goog.evalWorksForGlobals_ == null) {
        goog.global.eval("var _et_ = 1;");
        if(typeof goog.global["_et_"] != "undefined") {
          delete goog.global["_et_"];
          goog.evalWorksForGlobals_ = true
        }else {
          goog.evalWorksForGlobals_ = false
        }
      }
      if(goog.evalWorksForGlobals_) {
        goog.global.eval(script)
      }else {
        var doc = goog.global.document;
        var scriptElt = doc.createElement("script");
        scriptElt.type = "text/javascript";
        scriptElt.defer = false;
        scriptElt.appendChild(doc.createTextNode(script));
        doc.body.appendChild(scriptElt);
        doc.body.removeChild(scriptElt)
      }
    }else {
      throw Error("goog.globalEval not available");
    }
  }
};
goog.evalWorksForGlobals_ = null;
goog.cssNameMapping_;
goog.cssNameMappingStyle_;
goog.getCssName = function(className, opt_modifier) {
  var getMapping = function(cssName) {
    return goog.cssNameMapping_[cssName] || cssName
  };
  var renameByParts = function(cssName) {
    var parts = cssName.split("-");
    var mapped = [];
    for(var i = 0;i < parts.length;i++) {
      mapped.push(getMapping(parts[i]))
    }
    return mapped.join("-")
  };
  var rename;
  if(goog.cssNameMapping_) {
    rename = goog.cssNameMappingStyle_ == "BY_WHOLE" ? getMapping : renameByParts
  }else {
    rename = function(a) {
      return a
    }
  }
  if(opt_modifier) {
    return className + "-" + rename(opt_modifier)
  }else {
    return rename(className)
  }
};
goog.setCssNameMapping = function(mapping, opt_style) {
  goog.cssNameMapping_ = mapping;
  goog.cssNameMappingStyle_ = opt_style
};
goog.global.CLOSURE_CSS_NAME_MAPPING;
if(!COMPILED && goog.global.CLOSURE_CSS_NAME_MAPPING) {
  goog.cssNameMapping_ = goog.global.CLOSURE_CSS_NAME_MAPPING
}
goog.getMsg = function(str, opt_values) {
  var values = opt_values || {};
  for(var key in values) {
    var value = ("" + values[key]).replace(/\$/g, "$$$$");
    str = str.replace(new RegExp("\\{\\$" + key + "\\}", "gi"), value)
  }
  return str
};
goog.exportSymbol = function(publicPath, object, opt_objectToExportTo) {
  goog.exportPath_(publicPath, object, opt_objectToExportTo)
};
goog.exportProperty = function(object, publicName, symbol) {
  object[publicName] = symbol
};
goog.inherits = function(childCtor, parentCtor) {
  function tempCtor() {
  }
  tempCtor.prototype = parentCtor.prototype;
  childCtor.superClass_ = parentCtor.prototype;
  childCtor.prototype = new tempCtor;
  childCtor.prototype.constructor = childCtor
};
goog.base = function(me, opt_methodName, var_args) {
  var caller = arguments.callee.caller;
  if(caller.superClass_) {
    return caller.superClass_.constructor.apply(me, Array.prototype.slice.call(arguments, 1))
  }
  var args = Array.prototype.slice.call(arguments, 2);
  var foundCaller = false;
  for(var ctor = me.constructor;ctor;ctor = ctor.superClass_ && ctor.superClass_.constructor) {
    if(ctor.prototype[opt_methodName] === caller) {
      foundCaller = true
    }else {
      if(foundCaller) {
        return ctor.prototype[opt_methodName].apply(me, args)
      }
    }
  }
  if(me[opt_methodName] === caller) {
    return me.constructor.prototype[opt_methodName].apply(me, args)
  }else {
    throw Error("goog.base called from a method of one name " + "to a method of a different name");
  }
};
goog.scope = function(fn) {
  fn.call(goog.global)
};
goog.addDependency("/closure/goog/array/array.js", ["goog.array", "goog.array.ArrayLike"], ["goog.asserts"]);
goog.addDependency("/closure/goog/asserts/asserts.js", ["goog.asserts", "goog.asserts.AssertionError"], ["goog.debug.Error", "goog.string"]);
goog.addDependency("/closure/goog/async/animationdelay.js", ["goog.async.AnimationDelay"], ["goog.async.Delay", "goog.functions"]);
goog.addDependency("/closure/goog/async/conditionaldelay.js", ["goog.async.ConditionalDelay"], ["goog.Disposable", "goog.async.Delay"]);
goog.addDependency("/closure/goog/async/delay.js", ["goog.Delay", "goog.async.Delay"], ["goog.Disposable", "goog.Timer"]);
goog.addDependency("/closure/goog/async/throttle.js", ["goog.Throttle", "goog.async.Throttle"], ["goog.Disposable", "goog.Timer"]);
goog.addDependency("/closure/goog/base.js", [], []);
goog.addDependency("/closure/goog/bootstrap/webworkers.js", [], []);
goog.addDependency("/closure/goog/color/alpha.js", ["goog.color.alpha"], ["goog.color"]);
goog.addDependency("/closure/goog/color/color.js", ["goog.color"], ["goog.color.names", "goog.math"]);
goog.addDependency("/closure/goog/color/names.js", ["goog.color.names"], []);
goog.addDependency("/closure/goog/crypt/arc4.js", ["goog.crypt.Arc4"], ["goog.asserts"]);
goog.addDependency("/closure/goog/crypt/base64.js", ["goog.crypt.base64"], ["goog.crypt", "goog.userAgent"]);
goog.addDependency("/closure/goog/crypt/basen.js", ["goog.crypt.baseN"], []);
goog.addDependency("/closure/goog/crypt/blobhasher.js", ["goog.crypt.BlobHasher", "goog.crypt.BlobHasher.EventType"], ["goog.asserts", "goog.crypt", "goog.crypt.Hash", "goog.debug.Logger", "goog.events.EventTarget", "goog.fs"]);
goog.addDependency("/closure/goog/crypt/crypt.js", ["goog.crypt"], ["goog.array"]);
goog.addDependency("/closure/goog/crypt/hash.js", ["goog.crypt.Hash"], []);
goog.addDependency("/closure/goog/crypt/hash32.js", ["goog.crypt.hash32"], ["goog.crypt"]);
goog.addDependency("/closure/goog/crypt/hash_test.js", ["goog.crypt.hash_test"], ["goog.testing.asserts"]);
goog.addDependency("/closure/goog/crypt/hmac.js", ["goog.crypt.Hmac"], ["goog.asserts", "goog.crypt.Hash"]);
goog.addDependency("/closure/goog/crypt/md5.js", ["goog.crypt.Md5"], ["goog.crypt.Hash"]);
goog.addDependency("/closure/goog/crypt/sha1.js", ["goog.crypt.Sha1"], ["goog.crypt.Hash"]);
goog.addDependency("/closure/goog/cssom/cssom.js", ["goog.cssom", "goog.cssom.CssRuleType"], ["goog.array", "goog.dom"]);
goog.addDependency("/closure/goog/cssom/iframe/style.js", ["goog.cssom.iframe.style"], ["goog.cssom", "goog.dom", "goog.dom.NodeType", "goog.dom.classes", "goog.string", "goog.style", "goog.userAgent"]);
goog.addDependency("/closure/goog/datasource/datamanager.js", ["goog.ds.DataManager"], ["goog.ds.BasicNodeList", "goog.ds.DataNode", "goog.ds.Expr", "goog.string", "goog.structs", "goog.structs.Map"]);
goog.addDependency("/closure/goog/datasource/datasource.js", ["goog.ds.BaseDataNode", "goog.ds.BasicNodeList", "goog.ds.DataNode", "goog.ds.DataNodeList", "goog.ds.EmptyNodeList", "goog.ds.LoadState", "goog.ds.SortedNodeList", "goog.ds.Util", "goog.ds.logger"], ["goog.array", "goog.debug.Logger"]);
goog.addDependency("/closure/goog/datasource/expr.js", ["goog.ds.Expr"], ["goog.ds.BasicNodeList", "goog.ds.EmptyNodeList", "goog.string"]);
goog.addDependency("/closure/goog/datasource/fastdatanode.js", ["goog.ds.AbstractFastDataNode", "goog.ds.FastDataNode", "goog.ds.FastListNode", "goog.ds.PrimitiveFastDataNode"], ["goog.ds.DataManager", "goog.ds.EmptyNodeList", "goog.string"]);
goog.addDependency("/closure/goog/datasource/jsdatasource.js", ["goog.ds.JsDataSource", "goog.ds.JsPropertyDataSource"], ["goog.ds.BaseDataNode", "goog.ds.BasicNodeList", "goog.ds.DataManager", "goog.ds.EmptyNodeList", "goog.ds.LoadState"]);
goog.addDependency("/closure/goog/datasource/jsondatasource.js", ["goog.ds.JsonDataSource"], ["goog.Uri", "goog.dom", "goog.ds.DataManager", "goog.ds.JsDataSource", "goog.ds.LoadState", "goog.ds.logger"]);
goog.addDependency("/closure/goog/datasource/jsxmlhttpdatasource.js", ["goog.ds.JsXmlHttpDataSource"], ["goog.Uri", "goog.ds.DataManager", "goog.ds.FastDataNode", "goog.ds.LoadState", "goog.ds.logger", "goog.events", "goog.net.EventType", "goog.net.XhrIo"]);
goog.addDependency("/closure/goog/datasource/xmldatasource.js", ["goog.ds.XmlDataSource", "goog.ds.XmlHttpDataSource"], ["goog.Uri", "goog.dom.NodeType", "goog.dom.xml", "goog.ds.BasicNodeList", "goog.ds.DataManager", "goog.ds.LoadState", "goog.ds.logger", "goog.net.XhrIo", "goog.string"]);
goog.addDependency("/closure/goog/date/date.js", ["goog.date", "goog.date.Date", "goog.date.DateTime", "goog.date.Interval", "goog.date.month", "goog.date.weekDay"], ["goog.asserts", "goog.date.DateLike", "goog.i18n.DateTimeSymbols", "goog.string"]);
goog.addDependency("/closure/goog/date/datelike.js", ["goog.date.DateLike"], []);
goog.addDependency("/closure/goog/date/daterange.js", ["goog.date.DateRange", "goog.date.DateRange.Iterator", "goog.date.DateRange.StandardDateRangeKeys"], ["goog.date.Date", "goog.date.Interval", "goog.iter.Iterator", "goog.iter.StopIteration"]);
goog.addDependency("/closure/goog/date/relative.js", ["goog.date.relative"], ["goog.i18n.DateTimeFormat"]);
goog.addDependency("/closure/goog/date/utcdatetime.js", ["goog.date.UtcDateTime"], ["goog.date", "goog.date.Date", "goog.date.DateTime", "goog.date.Interval"]);
goog.addDependency("/closure/goog/db/cursor.js", ["goog.db.Cursor"], ["goog.async.Deferred", "goog.db.Error", "goog.debug", "goog.events.EventTarget"]);
goog.addDependency("/closure/goog/db/db.js", ["goog.db"], ["goog.async.Deferred", "goog.db.Error", "goog.db.IndexedDb"]);
goog.addDependency("/closure/goog/db/error.js", ["goog.db.Error", "goog.db.Error.ErrorCode", "goog.db.Error.VersionChangeBlockedError"], ["goog.debug.Error"]);
goog.addDependency("/closure/goog/db/index.js", ["goog.db.Index"], ["goog.async.Deferred", "goog.db.Error", "goog.debug"]);
goog.addDependency("/closure/goog/db/indexeddb.js", ["goog.db.IndexedDb"], ["goog.async.Deferred", "goog.db.Error", "goog.db.Error.VersionChangeBlockedError", "goog.db.ObjectStore", "goog.db.Transaction", "goog.db.Transaction.TransactionMode"]);
goog.addDependency("/closure/goog/db/keyrange.js", ["goog.db.KeyRange"], []);
goog.addDependency("/closure/goog/db/objectstore.js", ["goog.db.ObjectStore"], ["goog.async.Deferred", "goog.db.Cursor", "goog.db.Error", "goog.db.Index", "goog.debug", "goog.events"]);
goog.addDependency("/closure/goog/db/transaction.js", ["goog.db.Transaction", "goog.db.Transaction.TransactionMode"], ["goog.db.Error", "goog.db.ObjectStore", "goog.events.EventHandler", "goog.events.EventTarget"]);
goog.addDependency("/closure/goog/debug/console.js", ["goog.debug.Console"], ["goog.debug.LogManager", "goog.debug.Logger.Level", "goog.debug.TextFormatter"]);
goog.addDependency("/closure/goog/debug/debug.js", ["goog.debug"], ["goog.array", "goog.string", "goog.structs.Set", "goog.userAgent"]);
goog.addDependency("/closure/goog/debug/debugwindow.js", ["goog.debug.DebugWindow"], ["goog.debug.HtmlFormatter", "goog.debug.LogManager", "goog.structs.CircularBuffer", "goog.userAgent"]);
goog.addDependency("/closure/goog/debug/devcss/devcss.js", ["goog.debug.DevCss", "goog.debug.DevCss.UserAgent"], ["goog.cssom", "goog.dom.classes", "goog.events", "goog.events.EventType", "goog.string", "goog.userAgent"]);
goog.addDependency("/closure/goog/debug/devcss/devcssrunner.js", ["goog.debug.devCssRunner"], ["goog.debug.DevCss"]);
goog.addDependency("/closure/goog/debug/divconsole.js", ["goog.debug.DivConsole"], ["goog.debug.HtmlFormatter", "goog.debug.LogManager", "goog.style"]);
goog.addDependency("/closure/goog/debug/entrypointregistry.js", ["goog.debug.EntryPointMonitor", "goog.debug.entryPointRegistry"], ["goog.asserts"]);
goog.addDependency("/closure/goog/debug/error.js", ["goog.debug.Error"], []);
goog.addDependency("/closure/goog/debug/errorhandler.js", ["goog.debug.ErrorHandler", "goog.debug.ErrorHandler.ProtectedFunctionError"], ["goog.asserts", "goog.debug", "goog.debug.EntryPointMonitor", "goog.debug.Trace"]);
goog.addDependency("/closure/goog/debug/errorhandlerweakdep.js", ["goog.debug.errorHandlerWeakDep"], []);
goog.addDependency("/closure/goog/debug/errorreporter.js", ["goog.debug.ErrorReporter", "goog.debug.ErrorReporter.ExceptionEvent"], ["goog.debug", "goog.debug.ErrorHandler", "goog.debug.Logger", "goog.debug.entryPointRegistry", "goog.events", "goog.events.Event", "goog.events.EventTarget", "goog.net.XhrIo", "goog.object", "goog.string", "goog.uri.utils", "goog.userAgent"]);
goog.addDependency("/closure/goog/debug/fancywindow.js", ["goog.debug.FancyWindow"], ["goog.debug.DebugWindow", "goog.debug.LogManager", "goog.debug.Logger", "goog.debug.Logger.Level", "goog.dom.DomHelper", "goog.object", "goog.string", "goog.userAgent"]);
goog.addDependency("/closure/goog/debug/formatter.js", ["goog.debug.Formatter", "goog.debug.HtmlFormatter", "goog.debug.TextFormatter"], ["goog.debug.RelativeTimeProvider", "goog.string"]);
goog.addDependency("/closure/goog/debug/fpsdisplay.js", ["goog.debug.FpsDisplay"], ["goog.asserts", "goog.async.AnimationDelay", "goog.ui.Component"]);
goog.addDependency("/closure/goog/debug/gcdiagnostics.js", ["goog.debug.GcDiagnostics"], ["goog.debug.Logger", "goog.debug.Trace", "goog.userAgent"]);
goog.addDependency("/closure/goog/debug/logbuffer.js", ["goog.debug.LogBuffer"], ["goog.asserts", "goog.debug.LogRecord"]);
goog.addDependency("/closure/goog/debug/logger.js", ["goog.debug.LogManager", "goog.debug.Logger", "goog.debug.Logger.Level"], ["goog.array", "goog.asserts", "goog.debug", "goog.debug.LogBuffer", "goog.debug.LogRecord"]);
goog.addDependency("/closure/goog/debug/logrecord.js", ["goog.debug.LogRecord"], []);
goog.addDependency("/closure/goog/debug/logrecordserializer.js", ["goog.debug.logRecordSerializer"], ["goog.debug.LogRecord", "goog.debug.Logger.Level", "goog.json", "goog.object"]);
goog.addDependency("/closure/goog/debug/reflect.js", ["goog.debug.reflect"], []);
goog.addDependency("/closure/goog/debug/relativetimeprovider.js", ["goog.debug.RelativeTimeProvider"], []);
goog.addDependency("/closure/goog/debug/tracer.js", ["goog.debug.Trace"], ["goog.array", "goog.debug.Logger", "goog.iter", "goog.structs.Map", "goog.structs.SimplePool"]);
goog.addDependency("/closure/goog/demos/autocompleteremotedata.js", [], []);
goog.addDependency("/closure/goog/demos/autocompleterichremotedata.js", [], []);
goog.addDependency("/closure/goog/demos/editor/equationeditor.js", ["goog.demos.editor.EquationEditor"], ["goog.ui.equation.EquationEditorDialog"]);
goog.addDependency("/closure/goog/demos/editor/helloworld.js", ["goog.demos.editor.HelloWorld"], ["goog.dom", "goog.dom.TagName", "goog.editor.Plugin"]);
goog.addDependency("/closure/goog/demos/editor/helloworlddialog.js", ["goog.demos.editor.HelloWorldDialog", "goog.demos.editor.HelloWorldDialog.OkEvent"], ["goog.dom.TagName", "goog.events.Event", "goog.string", "goog.ui.editor.AbstractDialog", "goog.ui.editor.AbstractDialog.Builder", "goog.ui.editor.AbstractDialog.EventType"]);
goog.addDependency("/closure/goog/demos/editor/helloworlddialogplugin.js", ["goog.demos.editor.HelloWorldDialogPlugin", "goog.demos.editor.HelloWorldDialogPlugin.Command"], ["goog.demos.editor.HelloWorldDialog", "goog.dom.TagName", "goog.editor.plugins.AbstractDialogPlugin", "goog.editor.range", "goog.functions", "goog.ui.editor.AbstractDialog.EventType"]);
goog.addDependency("/closure/goog/demos/graphics/tigerdata.js", [], []);
goog.addDependency("/closure/goog/demos/samplecomponent.js", ["goog.demos.SampleComponent"], ["goog.dom", "goog.dom.classes", "goog.events.EventHandler", "goog.events.EventType", "goog.events.KeyCodes", "goog.events.KeyHandler", "goog.events.KeyHandler.EventType", "goog.ui.Component"]);
goog.addDependency("/closure/goog/demos/tree/testdata.js", [], []);
goog.addDependency("/closure/goog/demos/xpc/xpcdemo.js", [], ["goog.Uri", "goog.debug.Logger", "goog.dom", "goog.events", "goog.events.EventType", "goog.json", "goog.net.xpc.CrossPageChannel"]);
goog.addDependency("/closure/goog/disposable/disposable.js", ["goog.Disposable", "goog.dispose"], ["goog.disposable.IDisposable"]);
goog.addDependency("/closure/goog/disposable/idisposable.js", ["goog.disposable.IDisposable"], []);
goog.addDependency("/closure/goog/dom/a11y.js", ["goog.dom.a11y", "goog.dom.a11y.Announcer", "goog.dom.a11y.LivePriority", "goog.dom.a11y.Role", "goog.dom.a11y.State"], ["goog.Disposable", "goog.dom", "goog.object"]);
goog.addDependency("/closure/goog/dom/abstractmultirange.js", ["goog.dom.AbstractMultiRange"], ["goog.array", "goog.dom", "goog.dom.AbstractRange"]);
goog.addDependency("/closure/goog/dom/abstractrange.js", ["goog.dom.AbstractRange", "goog.dom.RangeIterator", "goog.dom.RangeType"], ["goog.dom", "goog.dom.NodeType", "goog.dom.SavedCaretRange", "goog.dom.TagIterator", "goog.userAgent"]);
goog.addDependency("/closure/goog/dom/annotate.js", ["goog.dom.annotate"], ["goog.array", "goog.dom", "goog.dom.NodeType", "goog.string"]);
goog.addDependency("/closure/goog/dom/browserfeature.js", ["goog.dom.BrowserFeature"], ["goog.userAgent"]);
goog.addDependency("/closure/goog/dom/browserrange/abstractrange.js", ["goog.dom.browserrange.AbstractRange"], ["goog.dom", "goog.dom.NodeType", "goog.dom.RangeEndpoint", "goog.dom.TagName", "goog.dom.TextRangeIterator", "goog.iter", "goog.string", "goog.string.StringBuffer", "goog.userAgent"]);
goog.addDependency("/closure/goog/dom/browserrange/browserrange.js", ["goog.dom.browserrange", "goog.dom.browserrange.Error"], ["goog.dom", "goog.dom.browserrange.GeckoRange", "goog.dom.browserrange.IeRange", "goog.dom.browserrange.OperaRange", "goog.dom.browserrange.W3cRange", "goog.dom.browserrange.WebKitRange", "goog.userAgent"]);
goog.addDependency("/closure/goog/dom/browserrange/geckorange.js", ["goog.dom.browserrange.GeckoRange"], ["goog.dom.browserrange.W3cRange"]);
goog.addDependency("/closure/goog/dom/browserrange/ierange.js", ["goog.dom.browserrange.IeRange"], ["goog.array", "goog.debug.Logger", "goog.dom", "goog.dom.NodeIterator", "goog.dom.NodeType", "goog.dom.RangeEndpoint", "goog.dom.TagName", "goog.dom.browserrange.AbstractRange", "goog.iter", "goog.iter.StopIteration", "goog.string"]);
goog.addDependency("/closure/goog/dom/browserrange/operarange.js", ["goog.dom.browserrange.OperaRange"], ["goog.dom.browserrange.W3cRange"]);
goog.addDependency("/closure/goog/dom/browserrange/w3crange.js", ["goog.dom.browserrange.W3cRange"], ["goog.dom", "goog.dom.NodeType", "goog.dom.RangeEndpoint", "goog.dom.browserrange.AbstractRange", "goog.string"]);
goog.addDependency("/closure/goog/dom/browserrange/webkitrange.js", ["goog.dom.browserrange.WebKitRange"], ["goog.dom.RangeEndpoint", "goog.dom.browserrange.W3cRange", "goog.userAgent"]);
goog.addDependency("/closure/goog/dom/classes.js", ["goog.dom.classes"], ["goog.array"]);
goog.addDependency("/closure/goog/dom/classes_test.js", ["goog.dom.classes_test"], ["goog.dom", "goog.dom.classes", "goog.testing.jsunit"]);
goog.addDependency("/closure/goog/dom/controlrange.js", ["goog.dom.ControlRange", "goog.dom.ControlRangeIterator"], ["goog.array", "goog.dom", "goog.dom.AbstractMultiRange", "goog.dom.AbstractRange", "goog.dom.RangeIterator", "goog.dom.RangeType", "goog.dom.SavedRange", "goog.dom.TagWalkType", "goog.dom.TextRange", "goog.iter.StopIteration", "goog.userAgent"]);
goog.addDependency("/closure/goog/dom/dataset.js", ["goog.dom.dataset"], ["goog.string"]);
goog.addDependency("/closure/goog/dom/dom.js", ["goog.dom", "goog.dom.DomHelper", "goog.dom.NodeType"], ["goog.array", "goog.dom.BrowserFeature", "goog.dom.TagName", "goog.dom.classes", "goog.math.Coordinate", "goog.math.Size", "goog.object", "goog.string", "goog.userAgent"]);
goog.addDependency("/closure/goog/dom/dom_test.js", ["goog.dom.dom_test"], ["goog.dom", "goog.dom.DomHelper", "goog.dom.NodeType", "goog.dom.TagName", "goog.object", "goog.testing.asserts", "goog.userAgent", "goog.userAgent.product", "goog.userAgent.product.isVersion"]);
goog.addDependency("/closure/goog/dom/fontsizemonitor.js", ["goog.dom.FontSizeMonitor", "goog.dom.FontSizeMonitor.EventType"], ["goog.dom", "goog.events", "goog.events.EventTarget", "goog.events.EventType", "goog.userAgent"]);
goog.addDependency("/closure/goog/dom/forms.js", ["goog.dom.forms"], ["goog.structs.Map"]);
goog.addDependency("/closure/goog/dom/fullscreen.js", ["goog.dom.fullscreen", "goog.dom.fullscreen.EventType"], ["goog.dom", "goog.userAgent", "goog.userAgent.product"]);
goog.addDependency("/closure/goog/dom/iframe.js", ["goog.dom.iframe"], ["goog.dom"]);
goog.addDependency("/closure/goog/dom/iter.js", ["goog.dom.iter.AncestorIterator", "goog.dom.iter.ChildIterator", "goog.dom.iter.SiblingIterator"], ["goog.iter.Iterator", "goog.iter.StopIteration"]);
goog.addDependency("/closure/goog/dom/multirange.js", ["goog.dom.MultiRange", "goog.dom.MultiRangeIterator"], ["goog.array", "goog.debug.Logger", "goog.dom.AbstractMultiRange", "goog.dom.AbstractRange", "goog.dom.RangeIterator", "goog.dom.RangeType", "goog.dom.SavedRange", "goog.dom.TextRange", "goog.iter.StopIteration"]);
goog.addDependency("/closure/goog/dom/nodeiterator.js", ["goog.dom.NodeIterator"], ["goog.dom.TagIterator"]);
goog.addDependency("/closure/goog/dom/nodeoffset.js", ["goog.dom.NodeOffset"], ["goog.Disposable", "goog.dom.TagName"]);
goog.addDependency("/closure/goog/dom/pattern/abstractpattern.js", ["goog.dom.pattern.AbstractPattern"], ["goog.dom.pattern.MatchType"]);
goog.addDependency("/closure/goog/dom/pattern/allchildren.js", ["goog.dom.pattern.AllChildren"], ["goog.dom.pattern.AbstractPattern", "goog.dom.pattern.MatchType"]);
goog.addDependency("/closure/goog/dom/pattern/callback/callback.js", ["goog.dom.pattern.callback"], ["goog.dom", "goog.dom.TagWalkType", "goog.iter"]);
goog.addDependency("/closure/goog/dom/pattern/callback/counter.js", ["goog.dom.pattern.callback.Counter"], []);
goog.addDependency("/closure/goog/dom/pattern/callback/test.js", ["goog.dom.pattern.callback.Test"], ["goog.iter.StopIteration"]);
goog.addDependency("/closure/goog/dom/pattern/childmatches.js", ["goog.dom.pattern.ChildMatches"], ["goog.dom.pattern.AllChildren", "goog.dom.pattern.MatchType"]);
goog.addDependency("/closure/goog/dom/pattern/endtag.js", ["goog.dom.pattern.EndTag"], ["goog.dom.TagWalkType", "goog.dom.pattern.Tag"]);
goog.addDependency("/closure/goog/dom/pattern/fulltag.js", ["goog.dom.pattern.FullTag"], ["goog.dom.pattern.MatchType", "goog.dom.pattern.StartTag", "goog.dom.pattern.Tag"]);
goog.addDependency("/closure/goog/dom/pattern/matcher.js", ["goog.dom.pattern.Matcher"], ["goog.dom.TagIterator", "goog.dom.pattern.MatchType", "goog.iter"]);
goog.addDependency("/closure/goog/dom/pattern/nodetype.js", ["goog.dom.pattern.NodeType"], ["goog.dom.pattern.AbstractPattern", "goog.dom.pattern.MatchType"]);
goog.addDependency("/closure/goog/dom/pattern/pattern.js", ["goog.dom.pattern", "goog.dom.pattern.MatchType"], []);
goog.addDependency("/closure/goog/dom/pattern/repeat.js", ["goog.dom.pattern.Repeat"], ["goog.dom.NodeType", "goog.dom.pattern.AbstractPattern", "goog.dom.pattern.MatchType"]);
goog.addDependency("/closure/goog/dom/pattern/sequence.js", ["goog.dom.pattern.Sequence"], ["goog.dom.NodeType", "goog.dom.pattern.AbstractPattern", "goog.dom.pattern.MatchType"]);
goog.addDependency("/closure/goog/dom/pattern/starttag.js", ["goog.dom.pattern.StartTag"], ["goog.dom.TagWalkType", "goog.dom.pattern.Tag"]);
goog.addDependency("/closure/goog/dom/pattern/tag.js", ["goog.dom.pattern.Tag"], ["goog.dom.pattern", "goog.dom.pattern.AbstractPattern", "goog.dom.pattern.MatchType", "goog.object"]);
goog.addDependency("/closure/goog/dom/pattern/text.js", ["goog.dom.pattern.Text"], ["goog.dom.NodeType", "goog.dom.pattern", "goog.dom.pattern.AbstractPattern", "goog.dom.pattern.MatchType"]);
goog.addDependency("/closure/goog/dom/range.js", ["goog.dom.Range"], ["goog.dom", "goog.dom.AbstractRange", "goog.dom.ControlRange", "goog.dom.MultiRange", "goog.dom.NodeType", "goog.dom.TextRange", "goog.userAgent"]);
goog.addDependency("/closure/goog/dom/rangeendpoint.js", ["goog.dom.RangeEndpoint"], []);
goog.addDependency("/closure/goog/dom/savedcaretrange.js", ["goog.dom.SavedCaretRange"], ["goog.array", "goog.dom", "goog.dom.SavedRange", "goog.dom.TagName", "goog.string"]);
goog.addDependency("/closure/goog/dom/savedrange.js", ["goog.dom.SavedRange"], ["goog.Disposable", "goog.debug.Logger"]);
goog.addDependency("/closure/goog/dom/selection.js", ["goog.dom.selection"], ["goog.string", "goog.userAgent"]);
goog.addDependency("/closure/goog/dom/tagiterator.js", ["goog.dom.TagIterator", "goog.dom.TagWalkType"], ["goog.dom.NodeType", "goog.iter.Iterator", "goog.iter.StopIteration"]);
goog.addDependency("/closure/goog/dom/tagname.js", ["goog.dom.TagName"], []);
goog.addDependency("/closure/goog/dom/textrange.js", ["goog.dom.TextRange"], ["goog.array", "goog.dom", "goog.dom.AbstractRange", "goog.dom.RangeType", "goog.dom.SavedRange", "goog.dom.TagName", "goog.dom.TextRangeIterator", "goog.dom.browserrange", "goog.string", "goog.userAgent"]);
goog.addDependency("/closure/goog/dom/textrangeiterator.js", ["goog.dom.TextRangeIterator"], ["goog.array", "goog.dom.NodeType", "goog.dom.RangeIterator", "goog.dom.TagName", "goog.iter.StopIteration"]);
goog.addDependency("/closure/goog/dom/viewportsizemonitor.js", ["goog.dom.ViewportSizeMonitor"], ["goog.dom", "goog.events", "goog.events.EventTarget", "goog.events.EventType", "goog.math.Size", "goog.userAgent"]);
goog.addDependency("/closure/goog/dom/xml.js", ["goog.dom.xml"], ["goog.dom", "goog.dom.NodeType"]);
goog.addDependency("/closure/goog/editor/browserfeature.js", ["goog.editor.BrowserFeature"], ["goog.editor.defines", "goog.userAgent", "goog.userAgent.product", "goog.userAgent.product.isVersion"]);
goog.addDependency("/closure/goog/editor/clicktoeditwrapper.js", ["goog.editor.ClickToEditWrapper"], ["goog.Disposable", "goog.asserts", "goog.debug.Logger", "goog.dom", "goog.dom.Range", "goog.dom.TagName", "goog.editor.BrowserFeature", "goog.editor.Command", "goog.editor.Field.EventType", "goog.editor.range", "goog.events.BrowserEvent.MouseButton", "goog.events.EventHandler", "goog.events.EventType"]);
goog.addDependency("/closure/goog/editor/command.js", ["goog.editor.Command"], []);
goog.addDependency("/closure/goog/editor/contenteditablefield.js", ["goog.editor.ContentEditableField"], ["goog.asserts", "goog.debug.Logger", "goog.editor.Field"]);
goog.addDependency("/closure/goog/editor/defines.js", ["goog.editor.defines"], []);
goog.addDependency("/closure/goog/editor/field.js", ["goog.editor.Field", "goog.editor.Field.EventType"], ["goog.array", "goog.async.Delay", "goog.debug.Logger", "goog.dom", "goog.dom.Range", "goog.dom.TagName", "goog.dom.classes", "goog.editor.BrowserFeature", "goog.editor.Command", "goog.editor.Plugin", "goog.editor.icontent", "goog.editor.icontent.FieldFormatInfo", "goog.editor.icontent.FieldStyleInfo", "goog.editor.node", "goog.editor.range", "goog.events", "goog.events.EventHandler", "goog.events.EventTarget", 
"goog.events.EventType", "goog.events.KeyCodes", "goog.functions", "goog.string", "goog.string.Unicode", "goog.style", "goog.userAgent", "goog.userAgent.product"]);
goog.addDependency("/closure/goog/editor/field_test.js", ["goog.editor.field_test"], ["goog.dom.Range", "goog.editor.Field", "goog.editor.Plugin", "goog.editor.Command", "goog.events", "goog.events.KeyCodes", "goog.functions", "goog.testing.LooseMock", "goog.testing.MockClock", "goog.testing.dom", "goog.testing.events", "goog.testing.recordFunction", "goog.userAgent", "goog.userAgent.product"]);
goog.addDependency("/closure/goog/editor/focus.js", ["goog.editor.focus"], ["goog.dom.selection"]);
goog.addDependency("/closure/goog/editor/icontent.js", ["goog.editor.icontent", "goog.editor.icontent.FieldFormatInfo", "goog.editor.icontent.FieldStyleInfo"], ["goog.editor.BrowserFeature", "goog.style", "goog.userAgent"]);
goog.addDependency("/closure/goog/editor/link.js", ["goog.editor.Link"], ["goog.array", "goog.dom", "goog.dom.NodeType", "goog.dom.Range", "goog.editor.BrowserFeature", "goog.editor.Command", "goog.editor.node", "goog.editor.range", "goog.string", "goog.string.Unicode", "goog.uri.utils", "goog.uri.utils.ComponentIndex"]);
goog.addDependency("/closure/goog/editor/node.js", ["goog.editor.node"], ["goog.dom", "goog.dom.NodeType", "goog.dom.TagName", "goog.dom.iter.ChildIterator", "goog.dom.iter.SiblingIterator", "goog.iter", "goog.object", "goog.string", "goog.string.Unicode"]);
goog.addDependency("/closure/goog/editor/plugin.js", ["goog.editor.Plugin"], ["goog.debug.Logger", "goog.editor.Command", "goog.events.EventTarget", "goog.functions", "goog.object", "goog.reflect"]);
goog.addDependency("/closure/goog/editor/plugins/abstractbubbleplugin.js", ["goog.editor.plugins.AbstractBubblePlugin"], ["goog.dom", "goog.dom.NodeType", "goog.dom.Range", "goog.dom.TagName", "goog.editor.Plugin", "goog.editor.style", "goog.events", "goog.events.EventHandler", "goog.events.EventType", "goog.functions", "goog.string.Unicode", "goog.ui.Component.EventType", "goog.ui.editor.Bubble", "goog.userAgent"]);
goog.addDependency("/closure/goog/editor/plugins/abstractdialogplugin.js", ["goog.editor.plugins.AbstractDialogPlugin", "goog.editor.plugins.AbstractDialogPlugin.EventType"], ["goog.dom", "goog.dom.Range", "goog.editor.Field.EventType", "goog.editor.Plugin", "goog.editor.range", "goog.events", "goog.ui.editor.AbstractDialog.EventType"]);
goog.addDependency("/closure/goog/editor/plugins/abstracttabhandler.js", ["goog.editor.plugins.AbstractTabHandler"], ["goog.editor.Plugin", "goog.events.KeyCodes"]);
goog.addDependency("/closure/goog/editor/plugins/basictextformatter.js", ["goog.editor.plugins.BasicTextFormatter", "goog.editor.plugins.BasicTextFormatter.COMMAND"], ["goog.array", "goog.debug.Logger", "goog.dom", "goog.dom.NodeType", "goog.dom.Range", "goog.dom.TagName", "goog.editor.BrowserFeature", "goog.editor.Command", "goog.editor.Link", "goog.editor.Plugin", "goog.editor.node", "goog.editor.range", "goog.editor.style", "goog.iter", "goog.iter.StopIteration", "goog.object", "goog.string", 
"goog.string.Unicode", "goog.style", "goog.ui.editor.messages", "goog.userAgent"]);
goog.addDependency("/closure/goog/editor/plugins/blockquote.js", ["goog.editor.plugins.Blockquote"], ["goog.debug.Logger", "goog.dom", "goog.dom.NodeType", "goog.dom.TagName", "goog.dom.classes", "goog.editor.BrowserFeature", "goog.editor.Command", "goog.editor.Plugin", "goog.editor.node", "goog.functions"]);
goog.addDependency("/closure/goog/editor/plugins/emoticons.js", ["goog.editor.plugins.Emoticons"], ["goog.dom.TagName", "goog.editor.Plugin", "goog.functions", "goog.ui.emoji.Emoji"]);
goog.addDependency("/closure/goog/editor/plugins/enterhandler.js", ["goog.editor.plugins.EnterHandler"], ["goog.dom", "goog.dom.AbstractRange", "goog.dom.NodeOffset", "goog.dom.NodeType", "goog.dom.TagName", "goog.editor.BrowserFeature", "goog.editor.Plugin", "goog.editor.node", "goog.editor.plugins.Blockquote", "goog.editor.range", "goog.editor.style", "goog.events.KeyCodes", "goog.string", "goog.userAgent"]);
goog.addDependency("/closure/goog/editor/plugins/equationeditorbubble.js", ["goog.editor.plugins.equation.EquationBubble"], ["goog.dom", "goog.dom.TagName", "goog.editor.Command", "goog.editor.plugins.AbstractBubblePlugin", "goog.string.Unicode", "goog.ui.editor.Bubble", "goog.ui.equation.ImageRenderer"]);
goog.addDependency("/closure/goog/editor/plugins/equationeditorplugin.js", ["goog.editor.plugins.EquationEditorPlugin"], ["goog.editor.Command", "goog.editor.plugins.AbstractDialogPlugin", "goog.editor.range", "goog.functions", "goog.ui.editor.AbstractDialog.Builder", "goog.ui.editor.EquationEditorDialog", "goog.ui.editor.EquationEditorOkEvent", "goog.ui.equation.EquationEditor", "goog.ui.equation.ImageRenderer", "goog.ui.equation.TexEditor"]);
goog.addDependency("/closure/goog/editor/plugins/headerformatter.js", ["goog.editor.plugins.HeaderFormatter"], ["goog.editor.Command", "goog.editor.Plugin", "goog.userAgent"]);
goog.addDependency("/closure/goog/editor/plugins/linkbubble.js", ["goog.editor.plugins.LinkBubble", "goog.editor.plugins.LinkBubble.Action"], ["goog.array", "goog.dom", "goog.editor.BrowserFeature", "goog.editor.Command", "goog.editor.Link", "goog.editor.plugins.AbstractBubblePlugin", "goog.editor.range", "goog.string", "goog.style", "goog.ui.editor.messages", "goog.uri.utils", "goog.window"]);
goog.addDependency("/closure/goog/editor/plugins/linkdialogplugin.js", ["goog.editor.plugins.LinkDialogPlugin"], ["goog.array", "goog.dom", "goog.editor.Command", "goog.editor.plugins.AbstractDialogPlugin", "goog.events.EventHandler", "goog.functions", "goog.ui.editor.AbstractDialog.EventType", "goog.ui.editor.LinkDialog", "goog.ui.editor.LinkDialog.EventType", "goog.ui.editor.LinkDialog.OkEvent", "goog.uri.utils"]);
goog.addDependency("/closure/goog/editor/plugins/linkshortcutplugin.js", ["goog.editor.plugins.LinkShortcutPlugin"], ["goog.editor.Command", "goog.editor.Link", "goog.editor.Plugin", "goog.string"]);
goog.addDependency("/closure/goog/editor/plugins/listtabhandler.js", ["goog.editor.plugins.ListTabHandler"], ["goog.dom.TagName", "goog.editor.Command", "goog.editor.plugins.AbstractTabHandler"]);
goog.addDependency("/closure/goog/editor/plugins/loremipsum.js", ["goog.editor.plugins.LoremIpsum"], ["goog.asserts", "goog.dom", "goog.editor.Command", "goog.editor.Plugin", "goog.editor.node", "goog.functions"]);
goog.addDependency("/closure/goog/editor/plugins/removeformatting.js", ["goog.editor.plugins.RemoveFormatting"], ["goog.dom", "goog.dom.NodeType", "goog.dom.Range", "goog.dom.TagName", "goog.editor.BrowserFeature", "goog.editor.Plugin", "goog.editor.node", "goog.editor.range", "goog.string"]);
goog.addDependency("/closure/goog/editor/plugins/spacestabhandler.js", ["goog.editor.plugins.SpacesTabHandler"], ["goog.dom", "goog.dom.TagName", "goog.editor.plugins.AbstractTabHandler", "goog.editor.range"]);
goog.addDependency("/closure/goog/editor/plugins/tableeditor.js", ["goog.editor.plugins.TableEditor"], ["goog.array", "goog.dom", "goog.dom.TagName", "goog.editor.Plugin", "goog.editor.Table", "goog.editor.node", "goog.editor.range", "goog.object"]);
goog.addDependency("/closure/goog/editor/plugins/tagonenterhandler.js", ["goog.editor.plugins.TagOnEnterHandler"], ["goog.dom", "goog.dom.NodeType", "goog.dom.Range", "goog.dom.TagName", "goog.editor.Command", "goog.editor.node", "goog.editor.plugins.EnterHandler", "goog.editor.range", "goog.editor.style", "goog.events.KeyCodes", "goog.string", "goog.style", "goog.userAgent"]);
goog.addDependency("/closure/goog/editor/plugins/undoredo.js", ["goog.editor.plugins.UndoRedo"], ["goog.debug.Logger", "goog.dom", "goog.dom.NodeOffset", "goog.dom.Range", "goog.editor.BrowserFeature", "goog.editor.Command", "goog.editor.Field.EventType", "goog.editor.Plugin", "goog.editor.plugins.UndoRedoManager", "goog.editor.plugins.UndoRedoState", "goog.events", "goog.events.EventHandler"]);
goog.addDependency("/closure/goog/editor/plugins/undoredomanager.js", ["goog.editor.plugins.UndoRedoManager", "goog.editor.plugins.UndoRedoManager.EventType"], ["goog.editor.plugins.UndoRedoState", "goog.events.EventTarget"]);
goog.addDependency("/closure/goog/editor/plugins/undoredostate.js", ["goog.editor.plugins.UndoRedoState"], ["goog.events.EventTarget"]);
goog.addDependency("/closure/goog/editor/range.js", ["goog.editor.range", "goog.editor.range.Point"], ["goog.array", "goog.dom", "goog.dom.NodeType", "goog.dom.Range", "goog.dom.RangeEndpoint", "goog.dom.SavedCaretRange", "goog.editor.BrowserFeature", "goog.editor.node", "goog.editor.style", "goog.iter"]);
goog.addDependency("/closure/goog/editor/seamlessfield.js", ["goog.editor.SeamlessField"], ["goog.cssom.iframe.style", "goog.debug.Logger", "goog.dom", "goog.dom.Range", "goog.dom.TagName", "goog.editor.BrowserFeature", "goog.editor.Field", "goog.editor.icontent", "goog.editor.icontent.FieldFormatInfo", "goog.editor.icontent.FieldStyleInfo", "goog.editor.node", "goog.events", "goog.events.EventType", "goog.style"]);
goog.addDependency("/closure/goog/editor/seamlessfield_test.js", ["goog.editor.seamlessfield_test"], ["goog.dom", "goog.dom.DomHelper", "goog.dom.Range", "goog.editor.BrowserFeature", "goog.editor.Field", "goog.editor.SeamlessField", "goog.events", "goog.functions", "goog.style", "goog.testing.MockClock", "goog.testing.MockRange", "goog.testing.jsunit"]);
goog.addDependency("/closure/goog/editor/style.js", ["goog.editor.style"], ["goog.dom", "goog.dom.NodeType", "goog.editor.BrowserFeature", "goog.events.EventType", "goog.object", "goog.style", "goog.userAgent"]);
goog.addDependency("/closure/goog/editor/table.js", ["goog.editor.Table", "goog.editor.TableCell", "goog.editor.TableRow"], ["goog.debug.Logger", "goog.dom", "goog.dom.DomHelper", "goog.dom.NodeType", "goog.dom.TagName", "goog.string.Unicode", "goog.style"]);
goog.addDependency("/closure/goog/events/actioneventwrapper.js", ["goog.events.actionEventWrapper"], ["goog.events", "goog.events.EventHandler", "goog.events.EventType", "goog.events.EventWrapper", "goog.events.KeyCodes"]);
goog.addDependency("/closure/goog/events/actionhandler.js", ["goog.events.ActionEvent", "goog.events.ActionHandler", "goog.events.ActionHandler.EventType", "goog.events.BeforeActionEvent"], ["goog.events", "goog.events.BrowserEvent", "goog.events.EventTarget", "goog.events.EventType", "goog.events.KeyCodes", "goog.userAgent"]);
goog.addDependency("/closure/goog/events/browserevent.js", ["goog.events.BrowserEvent", "goog.events.BrowserEvent.MouseButton"], ["goog.events.BrowserFeature", "goog.events.Event", "goog.events.EventType", "goog.reflect", "goog.userAgent"]);
goog.addDependency("/closure/goog/events/browserfeature.js", ["goog.events.BrowserFeature"], ["goog.userAgent"]);
goog.addDependency("/closure/goog/events/event.js", ["goog.events.Event"], ["goog.Disposable"]);
goog.addDependency("/closure/goog/events/eventhandler.js", ["goog.events.EventHandler"], ["goog.Disposable", "goog.array", "goog.events", "goog.events.EventWrapper"]);
goog.addDependency("/closure/goog/events/events.js", ["goog.events"], ["goog.array", "goog.debug.entryPointRegistry", "goog.debug.errorHandlerWeakDep", "goog.events.BrowserEvent", "goog.events.BrowserFeature", "goog.events.Event", "goog.events.EventWrapper", "goog.events.Listener", "goog.object", "goog.userAgent"]);
goog.addDependency("/closure/goog/events/eventtarget.js", ["goog.events.EventTarget"], ["goog.Disposable", "goog.events"]);
goog.addDependency("/closure/goog/events/eventtype.js", ["goog.events.EventType"], ["goog.userAgent"]);
goog.addDependency("/closure/goog/events/eventwrapper.js", ["goog.events.EventWrapper"], []);
goog.addDependency("/closure/goog/events/filedrophandler.js", ["goog.events.FileDropHandler", "goog.events.FileDropHandler.EventType"], ["goog.array", "goog.debug.Logger", "goog.dom", "goog.events", "goog.events.BrowserEvent", "goog.events.EventHandler", "goog.events.EventTarget", "goog.events.EventType"]);
goog.addDependency("/closure/goog/events/focushandler.js", ["goog.events.FocusHandler", "goog.events.FocusHandler.EventType"], ["goog.events", "goog.events.BrowserEvent", "goog.events.EventTarget", "goog.userAgent"]);
goog.addDependency("/closure/goog/events/imehandler.js", ["goog.events.ImeHandler", "goog.events.ImeHandler.Event", "goog.events.ImeHandler.EventType"], ["goog.events.Event", "goog.events.EventHandler", "goog.events.EventTarget", "goog.events.EventType", "goog.events.KeyCodes", "goog.userAgent", "goog.userAgent.product"]);
goog.addDependency("/closure/goog/events/inputhandler.js", ["goog.events.InputHandler", "goog.events.InputHandler.EventType"], ["goog.Timer", "goog.dom", "goog.events", "goog.events.BrowserEvent", "goog.events.EventHandler", "goog.events.EventTarget", "goog.events.KeyCodes", "goog.userAgent"]);
goog.addDependency("/closure/goog/events/keycodes.js", ["goog.events.KeyCodes"], ["goog.userAgent"]);
goog.addDependency("/closure/goog/events/keyhandler.js", ["goog.events.KeyEvent", "goog.events.KeyHandler", "goog.events.KeyHandler.EventType"], ["goog.events", "goog.events.BrowserEvent", "goog.events.EventTarget", "goog.events.EventType", "goog.events.KeyCodes", "goog.userAgent"]);
goog.addDependency("/closure/goog/events/keynames.js", ["goog.events.KeyNames"], []);
goog.addDependency("/closure/goog/events/listener.js", ["goog.events.Listener"], []);
goog.addDependency("/closure/goog/events/mousewheelhandler.js", ["goog.events.MouseWheelEvent", "goog.events.MouseWheelHandler", "goog.events.MouseWheelHandler.EventType"], ["goog.events", "goog.events.BrowserEvent", "goog.events.EventTarget", "goog.math", "goog.style", "goog.userAgent"]);
goog.addDependency("/closure/goog/events/onlinehandler.js", ["goog.events.OnlineHandler", "goog.events.OnlineHandler.EventType"], ["goog.Timer", "goog.events.BrowserFeature", "goog.events.EventHandler", "goog.events.EventTarget", "goog.userAgent"]);
goog.addDependency("/closure/goog/events/pastehandler.js", ["goog.events.PasteHandler", "goog.events.PasteHandler.EventType", "goog.events.PasteHandler.State"], ["goog.Timer", "goog.async.ConditionalDelay", "goog.debug.Logger", "goog.events.BrowserEvent", "goog.events.EventHandler", "goog.events.EventTarget", "goog.events.EventType", "goog.events.KeyCodes"]);
goog.addDependency("/closure/goog/format/emailaddress.js", ["goog.format.EmailAddress"], ["goog.string"]);
goog.addDependency("/closure/goog/format/format.js", ["goog.format"], ["goog.i18n.GraphemeBreak", "goog.string", "goog.userAgent"]);
goog.addDependency("/closure/goog/format/htmlprettyprinter.js", ["goog.format.HtmlPrettyPrinter", "goog.format.HtmlPrettyPrinter.Buffer"], ["goog.object", "goog.string.StringBuffer"]);
goog.addDependency("/closure/goog/format/jsonprettyprinter.js", ["goog.format.JsonPrettyPrinter", "goog.format.JsonPrettyPrinter.HtmlDelimiters", "goog.format.JsonPrettyPrinter.TextDelimiters"], ["goog.json", "goog.json.Serializer", "goog.string", "goog.string.StringBuffer", "goog.string.format"]);
goog.addDependency("/closure/goog/fs/entry.js", ["goog.fs.DirectoryEntry", "goog.fs.DirectoryEntry.Behavior", "goog.fs.Entry", "goog.fs.FileEntry"], ["goog.array", "goog.async.Deferred", "goog.fs.Error", "goog.fs.FileWriter", "goog.functions", "goog.string"]);
goog.addDependency("/closure/goog/fs/error.js", ["goog.fs.Error", "goog.fs.Error.ErrorCode"], ["goog.debug.Error", "goog.string"]);
goog.addDependency("/closure/goog/fs/filereader.js", ["goog.fs.FileReader", "goog.fs.FileReader.EventType", "goog.fs.FileReader.ReadyState"], ["goog.async.Deferred", "goog.events.Event", "goog.events.EventTarget", "goog.fs.Error", "goog.fs.ProgressEvent"]);
goog.addDependency("/closure/goog/fs/filesaver.js", ["goog.fs.FileSaver", "goog.fs.FileSaver.EventType", "goog.fs.FileSaver.ProgressEvent", "goog.fs.FileSaver.ReadyState"], ["goog.events.Event", "goog.events.EventTarget", "goog.fs.Error", "goog.fs.ProgressEvent"]);
goog.addDependency("/closure/goog/fs/filesystem.js", ["goog.fs.FileSystem"], ["goog.fs.DirectoryEntry"]);
goog.addDependency("/closure/goog/fs/filewriter.js", ["goog.fs.FileWriter"], ["goog.fs.Error", "goog.fs.FileSaver"]);
goog.addDependency("/closure/goog/fs/fs.js", ["goog.fs"], ["goog.async.Deferred", "goog.events", "goog.fs.Error", "goog.fs.FileReader", "goog.fs.FileSystem", "goog.userAgent"]);
goog.addDependency("/closure/goog/fs/progressevent.js", ["goog.fs.ProgressEvent"], ["goog.events.Event"]);
goog.addDependency("/closure/goog/functions/functions.js", ["goog.functions"], []);
goog.addDependency("/closure/goog/fx/abstractdragdrop.js", ["goog.fx.AbstractDragDrop", "goog.fx.AbstractDragDrop.EventType", "goog.fx.DragDropEvent", "goog.fx.DragDropItem"], ["goog.dom", "goog.dom.classes", "goog.events", "goog.events.Event", "goog.events.EventTarget", "goog.events.EventType", "goog.fx.Dragger", "goog.fx.Dragger.EventType", "goog.math.Box", "goog.math.Coordinate", "goog.style"]);
goog.addDependency("/closure/goog/fx/anim/anim.js", ["goog.fx.anim", "goog.fx.anim.Animated"], ["goog.async.AnimationDelay", "goog.async.Delay", "goog.object"]);
goog.addDependency("/closure/goog/fx/animation.js", ["goog.fx.Animation", "goog.fx.Animation.EventType", "goog.fx.Animation.State", "goog.fx.AnimationEvent"], ["goog.array", "goog.events.Event", "goog.fx.Transition", "goog.fx.Transition.EventType", "goog.fx.TransitionBase.State", "goog.fx.anim", "goog.fx.anim.Animated"]);
goog.addDependency("/closure/goog/fx/animationqueue.js", ["goog.fx.AnimationParallelQueue", "goog.fx.AnimationQueue", "goog.fx.AnimationSerialQueue"], ["goog.array", "goog.asserts", "goog.events.EventHandler", "goog.fx.Transition.EventType", "goog.fx.TransitionBase", "goog.fx.TransitionBase.State"]);
goog.addDependency("/closure/goog/fx/css3/fx.js", ["goog.fx.css3"], ["goog.fx.css3.Transition"]);
goog.addDependency("/closure/goog/fx/css3/transition.js", ["goog.fx.css3.Transition"], ["goog.Timer", "goog.fx.TransitionBase", "goog.style", "goog.style.transition"]);
goog.addDependency("/closure/goog/fx/cssspriteanimation.js", ["goog.fx.CssSpriteAnimation"], ["goog.fx.Animation"]);
goog.addDependency("/closure/goog/fx/dom.js", ["goog.fx.dom", "goog.fx.dom.BgColorTransform", "goog.fx.dom.ColorTransform", "goog.fx.dom.Fade", "goog.fx.dom.FadeIn", "goog.fx.dom.FadeInAndShow", "goog.fx.dom.FadeOut", "goog.fx.dom.FadeOutAndHide", "goog.fx.dom.PredefinedEffect", "goog.fx.dom.Resize", "goog.fx.dom.ResizeHeight", "goog.fx.dom.ResizeWidth", "goog.fx.dom.Scroll", "goog.fx.dom.Slide", "goog.fx.dom.SlideFrom", "goog.fx.dom.Swipe"], ["goog.color", "goog.events", "goog.fx.Animation", "goog.fx.Transition.EventType", 
"goog.style", "goog.style.bidi"]);
goog.addDependency("/closure/goog/fx/dragdrop.js", ["goog.fx.DragDrop"], ["goog.fx.AbstractDragDrop", "goog.fx.DragDropItem"]);
goog.addDependency("/closure/goog/fx/dragdropgroup.js", ["goog.fx.DragDropGroup"], ["goog.dom", "goog.fx.AbstractDragDrop", "goog.fx.DragDropItem"]);
goog.addDependency("/closure/goog/fx/dragger.js", ["goog.fx.DragEvent", "goog.fx.Dragger", "goog.fx.Dragger.EventType"], ["goog.dom", "goog.events", "goog.events.BrowserEvent.MouseButton", "goog.events.Event", "goog.events.EventHandler", "goog.events.EventTarget", "goog.events.EventType", "goog.math.Coordinate", "goog.math.Rect", "goog.style", "goog.style.bidi", "goog.userAgent"]);
goog.addDependency("/closure/goog/fx/draglistgroup.js", ["goog.fx.DragListDirection", "goog.fx.DragListGroup", "goog.fx.DragListGroup.EventType", "goog.fx.DragListGroupEvent"], ["goog.asserts", "goog.dom", "goog.dom.NodeType", "goog.dom.classes", "goog.events.Event", "goog.events.EventHandler", "goog.events.EventTarget", "goog.events.EventType", "goog.fx.Dragger", "goog.fx.Dragger.EventType", "goog.math.Coordinate", "goog.style"]);
goog.addDependency("/closure/goog/fx/dragscrollsupport.js", ["goog.fx.DragScrollSupport"], ["goog.Disposable", "goog.Timer", "goog.dom", "goog.events.EventHandler", "goog.events.EventType", "goog.math.Coordinate", "goog.style"]);
goog.addDependency("/closure/goog/fx/easing.js", ["goog.fx.easing"], []);
goog.addDependency("/closure/goog/fx/fx.js", ["goog.fx"], ["goog.asserts", "goog.fx.Animation", "goog.fx.Animation.EventType", "goog.fx.Animation.State", "goog.fx.AnimationEvent", "goog.fx.Transition.EventType", "goog.fx.easing"]);
goog.addDependency("/closure/goog/fx/transition.js", ["goog.fx.Transition", "goog.fx.Transition.EventType"], []);
goog.addDependency("/closure/goog/fx/transitionbase.js", ["goog.fx.TransitionBase", "goog.fx.TransitionBase.State"], ["goog.events.EventTarget", "goog.fx.Transition", "goog.fx.Transition.EventType"]);
goog.addDependency("/closure/goog/gears/basestore.js", ["goog.gears.BaseStore", "goog.gears.BaseStore.SchemaType"], ["goog.Disposable"]);
goog.addDependency("/closure/goog/gears/database.js", ["goog.gears.Database", "goog.gears.Database.EventType", "goog.gears.Database.TransactionEvent"], ["goog.array", "goog.debug", "goog.debug.Logger", "goog.events.Event", "goog.events.EventTarget", "goog.gears", "goog.json"]);
goog.addDependency("/closure/goog/gears/gears.js", ["goog.gears"], ["goog.string"]);
goog.addDependency("/closure/goog/gears/httprequest.js", ["goog.gears.HttpRequest"], ["goog.Timer", "goog.gears", "goog.net.WrapperXmlHttpFactory", "goog.net.XmlHttp"]);
goog.addDependency("/closure/goog/gears/loggerclient.js", ["goog.gears.LoggerClient"], ["goog.Disposable", "goog.debug", "goog.debug.Logger"]);
goog.addDependency("/closure/goog/gears/loggerserver.js", ["goog.gears.LoggerServer"], ["goog.Disposable", "goog.debug.Logger", "goog.debug.Logger.Level", "goog.gears.Worker.EventType"]);
goog.addDependency("/closure/goog/gears/logstore.js", ["goog.gears.LogStore", "goog.gears.LogStore.Query"], ["goog.async.Delay", "goog.debug.LogManager", "goog.debug.LogRecord", "goog.debug.Logger", "goog.debug.Logger.Level", "goog.gears.BaseStore", "goog.gears.BaseStore.SchemaType", "goog.json"]);
goog.addDependency("/closure/goog/gears/managedresourcestore.js", ["goog.gears.ManagedResourceStore", "goog.gears.ManagedResourceStore.EventType", "goog.gears.ManagedResourceStore.UpdateStatus", "goog.gears.ManagedResourceStoreEvent"], ["goog.debug.Logger", "goog.events.Event", "goog.events.EventTarget", "goog.gears", "goog.string"]);
goog.addDependency("/closure/goog/gears/multipartformdata.js", ["goog.gears.MultipartFormData"], ["goog.asserts", "goog.gears", "goog.string"]);
goog.addDependency("/closure/goog/gears/statustype.js", ["goog.gears.StatusType"], []);
goog.addDependency("/closure/goog/gears/urlcapture.js", ["goog.gears.UrlCapture", "goog.gears.UrlCapture.Event", "goog.gears.UrlCapture.EventType"], ["goog.Uri", "goog.debug.Logger", "goog.events.Event", "goog.events.EventTarget", "goog.gears"]);
goog.addDependency("/closure/goog/gears/worker.js", ["goog.gears.Worker", "goog.gears.Worker.EventType", "goog.gears.WorkerEvent"], ["goog.events.Event", "goog.events.EventTarget"]);
goog.addDependency("/closure/goog/gears/workerchannel.js", ["goog.gears.WorkerChannel"], ["goog.Disposable", "goog.debug", "goog.debug.Logger", "goog.events", "goog.gears.Worker", "goog.gears.Worker.EventType", "goog.gears.WorkerEvent", "goog.json", "goog.messaging.AbstractChannel"]);
goog.addDependency("/closure/goog/gears/workerpool.js", ["goog.gears.WorkerPool", "goog.gears.WorkerPool.Event", "goog.gears.WorkerPool.EventType"], ["goog.events.Event", "goog.events.EventTarget", "goog.gears", "goog.gears.Worker"]);
goog.addDependency("/closure/goog/graphics/abstractgraphics.js", ["goog.graphics.AbstractGraphics"], ["goog.graphics.Path", "goog.math.Coordinate", "goog.math.Size", "goog.style", "goog.ui.Component"]);
goog.addDependency("/closure/goog/graphics/affinetransform.js", ["goog.graphics.AffineTransform"], ["goog.math"]);
goog.addDependency("/closure/goog/graphics/canvaselement.js", ["goog.graphics.CanvasEllipseElement", "goog.graphics.CanvasGroupElement", "goog.graphics.CanvasImageElement", "goog.graphics.CanvasPathElement", "goog.graphics.CanvasRectElement", "goog.graphics.CanvasTextElement"], ["goog.array", "goog.dom", "goog.dom.TagName", "goog.graphics.EllipseElement", "goog.graphics.GroupElement", "goog.graphics.ImageElement", "goog.graphics.Path", "goog.graphics.PathElement", "goog.graphics.RectElement", "goog.graphics.TextElement"]);
goog.addDependency("/closure/goog/graphics/canvasgraphics.js", ["goog.graphics.CanvasGraphics"], ["goog.dom", "goog.events.EventType", "goog.graphics.AbstractGraphics", "goog.graphics.CanvasEllipseElement", "goog.graphics.CanvasGroupElement", "goog.graphics.CanvasImageElement", "goog.graphics.CanvasPathElement", "goog.graphics.CanvasRectElement", "goog.graphics.CanvasTextElement", "goog.graphics.Font", "goog.graphics.LinearGradient", "goog.graphics.SolidFill", "goog.graphics.Stroke", "goog.math.Size"]);
goog.addDependency("/closure/goog/graphics/element.js", ["goog.graphics.Element"], ["goog.events", "goog.events.EventTarget", "goog.graphics.AffineTransform", "goog.math"]);
goog.addDependency("/closure/goog/graphics/ellipseelement.js", ["goog.graphics.EllipseElement"], ["goog.graphics.StrokeAndFillElement"]);
goog.addDependency("/closure/goog/graphics/ext/coordinates.js", ["goog.graphics.ext.coordinates"], ["goog.string"]);
goog.addDependency("/closure/goog/graphics/ext/element.js", ["goog.graphics.ext.Element"], ["goog.events", "goog.events.EventTarget", "goog.functions", "goog.graphics", "goog.graphics.ext.coordinates"]);
goog.addDependency("/closure/goog/graphics/ext/ellipse.js", ["goog.graphics.ext.Ellipse"], ["goog.graphics.ext.StrokeAndFillElement"]);
goog.addDependency("/closure/goog/graphics/ext/ext.js", ["goog.graphics.ext"], ["goog.graphics.ext.Ellipse", "goog.graphics.ext.Graphics", "goog.graphics.ext.Group", "goog.graphics.ext.Image", "goog.graphics.ext.Rectangle", "goog.graphics.ext.Shape", "goog.graphics.ext.coordinates"]);
goog.addDependency("/closure/goog/graphics/ext/graphics.js", ["goog.graphics.ext.Graphics"], ["goog.events.EventType", "goog.graphics.ext.Group"]);
goog.addDependency("/closure/goog/graphics/ext/group.js", ["goog.graphics.ext.Group"], ["goog.graphics.ext.Element"]);
goog.addDependency("/closure/goog/graphics/ext/image.js", ["goog.graphics.ext.Image"], ["goog.graphics.ext.Element"]);
goog.addDependency("/closure/goog/graphics/ext/path.js", ["goog.graphics.ext.Path"], ["goog.graphics.AffineTransform", "goog.graphics.Path", "goog.math", "goog.math.Rect"]);
goog.addDependency("/closure/goog/graphics/ext/rectangle.js", ["goog.graphics.ext.Rectangle"], ["goog.graphics.ext.StrokeAndFillElement"]);
goog.addDependency("/closure/goog/graphics/ext/shape.js", ["goog.graphics.ext.Shape"], ["goog.graphics.ext.Path", "goog.graphics.ext.StrokeAndFillElement", "goog.math.Rect"]);
goog.addDependency("/closure/goog/graphics/ext/strokeandfillelement.js", ["goog.graphics.ext.StrokeAndFillElement"], ["goog.graphics.ext.Element"]);
goog.addDependency("/closure/goog/graphics/fill.js", ["goog.graphics.Fill"], []);
goog.addDependency("/closure/goog/graphics/font.js", ["goog.graphics.Font"], []);
goog.addDependency("/closure/goog/graphics/graphics.js", ["goog.graphics"], ["goog.graphics.CanvasGraphics", "goog.graphics.SvgGraphics", "goog.graphics.VmlGraphics", "goog.userAgent"]);
goog.addDependency("/closure/goog/graphics/groupelement.js", ["goog.graphics.GroupElement"], ["goog.graphics.Element"]);
goog.addDependency("/closure/goog/graphics/imageelement.js", ["goog.graphics.ImageElement"], ["goog.graphics.Element"]);
goog.addDependency("/closure/goog/graphics/lineargradient.js", ["goog.graphics.LinearGradient"], ["goog.asserts", "goog.graphics.Fill"]);
goog.addDependency("/closure/goog/graphics/path.js", ["goog.graphics.Path", "goog.graphics.Path.Segment"], ["goog.array", "goog.math"]);
goog.addDependency("/closure/goog/graphics/pathelement.js", ["goog.graphics.PathElement"], ["goog.graphics.StrokeAndFillElement"]);
goog.addDependency("/closure/goog/graphics/paths.js", ["goog.graphics.paths"], ["goog.graphics.Path", "goog.math.Coordinate"]);
goog.addDependency("/closure/goog/graphics/rectelement.js", ["goog.graphics.RectElement"], ["goog.graphics.StrokeAndFillElement"]);
goog.addDependency("/closure/goog/graphics/solidfill.js", ["goog.graphics.SolidFill"], ["goog.graphics.Fill"]);
goog.addDependency("/closure/goog/graphics/stroke.js", ["goog.graphics.Stroke"], []);
goog.addDependency("/closure/goog/graphics/strokeandfillelement.js", ["goog.graphics.StrokeAndFillElement"], ["goog.graphics.Element"]);
goog.addDependency("/closure/goog/graphics/svgelement.js", ["goog.graphics.SvgEllipseElement", "goog.graphics.SvgGroupElement", "goog.graphics.SvgImageElement", "goog.graphics.SvgPathElement", "goog.graphics.SvgRectElement", "goog.graphics.SvgTextElement"], ["goog.dom", "goog.graphics.EllipseElement", "goog.graphics.GroupElement", "goog.graphics.ImageElement", "goog.graphics.PathElement", "goog.graphics.RectElement", "goog.graphics.TextElement"]);
goog.addDependency("/closure/goog/graphics/svggraphics.js", ["goog.graphics.SvgGraphics"], ["goog.Timer", "goog.dom", "goog.events.EventHandler", "goog.events.EventType", "goog.graphics.AbstractGraphics", "goog.graphics.Font", "goog.graphics.LinearGradient", "goog.graphics.SolidFill", "goog.graphics.Stroke", "goog.graphics.SvgEllipseElement", "goog.graphics.SvgGroupElement", "goog.graphics.SvgImageElement", "goog.graphics.SvgPathElement", "goog.graphics.SvgRectElement", "goog.graphics.SvgTextElement", 
"goog.math.Size", "goog.style", "goog.userAgent"]);
goog.addDependency("/closure/goog/graphics/textelement.js", ["goog.graphics.TextElement"], ["goog.graphics.StrokeAndFillElement"]);
goog.addDependency("/closure/goog/graphics/vmlelement.js", ["goog.graphics.VmlEllipseElement", "goog.graphics.VmlGroupElement", "goog.graphics.VmlImageElement", "goog.graphics.VmlPathElement", "goog.graphics.VmlRectElement", "goog.graphics.VmlTextElement"], ["goog.dom", "goog.graphics.EllipseElement", "goog.graphics.GroupElement", "goog.graphics.ImageElement", "goog.graphics.PathElement", "goog.graphics.RectElement", "goog.graphics.TextElement"]);
goog.addDependency("/closure/goog/graphics/vmlgraphics.js", ["goog.graphics.VmlGraphics"], ["goog.array", "goog.dom", "goog.events.EventHandler", "goog.events.EventType", "goog.graphics.AbstractGraphics", "goog.graphics.Font", "goog.graphics.LinearGradient", "goog.graphics.SolidFill", "goog.graphics.Stroke", "goog.graphics.VmlEllipseElement", "goog.graphics.VmlGroupElement", "goog.graphics.VmlImageElement", "goog.graphics.VmlPathElement", "goog.graphics.VmlRectElement", "goog.graphics.VmlTextElement", 
"goog.math.Size", "goog.string", "goog.style"]);
goog.addDependency("/closure/goog/history/event.js", ["goog.history.Event"], ["goog.events.Event", "goog.history.EventType"]);
goog.addDependency("/closure/goog/history/eventtype.js", ["goog.history.EventType"], []);
goog.addDependency("/closure/goog/history/history.js", ["goog.History", "goog.History.Event", "goog.History.EventType"], ["goog.Timer", "goog.dom", "goog.events", "goog.events.BrowserEvent", "goog.events.Event", "goog.events.EventHandler", "goog.events.EventTarget", "goog.events.EventType", "goog.history.Event", "goog.history.EventType", "goog.string", "goog.userAgent"]);
goog.addDependency("/closure/goog/history/html5history.js", ["goog.history.Html5History", "goog.history.Html5History.TokenTransformer"], ["goog.asserts", "goog.events", "goog.events.EventTarget", "goog.events.EventType", "goog.history.Event", "goog.history.EventType"]);
goog.addDependency("/closure/goog/i18n/bidi.js", ["goog.i18n.bidi"], []);
goog.addDependency("/closure/goog/i18n/bidiformatter.js", ["goog.i18n.BidiFormatter"], ["goog.i18n.bidi", "goog.string"]);
goog.addDependency("/closure/goog/i18n/charlistdecompressor.js", ["goog.i18n.CharListDecompressor"], ["goog.array", "goog.i18n.uChar"]);
goog.addDependency("/closure/goog/i18n/charpickerdata.js", ["goog.i18n.CharPickerData"], []);
goog.addDependency("/closure/goog/i18n/currency.js", ["goog.i18n.currency"], []);
goog.addDependency("/closure/goog/i18n/currencycodemap.js", ["goog.i18n.currencyCodeMap", "goog.i18n.currencyCodeMapTier2"], []);
goog.addDependency("/closure/goog/i18n/datetimeformat.js", ["goog.i18n.DateTimeFormat", "goog.i18n.DateTimeFormat.Format"], ["goog.asserts", "goog.date.DateLike", "goog.i18n.DateTimeSymbols", "goog.i18n.TimeZone", "goog.string"]);
goog.addDependency("/closure/goog/i18n/datetimeparse.js", ["goog.i18n.DateTimeParse"], ["goog.date.DateLike", "goog.i18n.DateTimeFormat", "goog.i18n.DateTimeSymbols"]);
goog.addDependency("/closure/goog/i18n/datetimepatterns.js", ["goog.i18n.DateTimePatterns", "goog.i18n.DateTimePatterns_af", "goog.i18n.DateTimePatterns_am", "goog.i18n.DateTimePatterns_ar", "goog.i18n.DateTimePatterns_bg", "goog.i18n.DateTimePatterns_bn", "goog.i18n.DateTimePatterns_ca", "goog.i18n.DateTimePatterns_chr", "goog.i18n.DateTimePatterns_cs", "goog.i18n.DateTimePatterns_cy", "goog.i18n.DateTimePatterns_da", "goog.i18n.DateTimePatterns_de", "goog.i18n.DateTimePatterns_de_AT", "goog.i18n.DateTimePatterns_de_CH", 
"goog.i18n.DateTimePatterns_el", "goog.i18n.DateTimePatterns_en", "goog.i18n.DateTimePatterns_en_AU", "goog.i18n.DateTimePatterns_en_GB", "goog.i18n.DateTimePatterns_en_IE", "goog.i18n.DateTimePatterns_en_IN", "goog.i18n.DateTimePatterns_en_SG", "goog.i18n.DateTimePatterns_en_US", "goog.i18n.DateTimePatterns_en_ZA", "goog.i18n.DateTimePatterns_es", "goog.i18n.DateTimePatterns_es_419", "goog.i18n.DateTimePatterns_et", "goog.i18n.DateTimePatterns_eu", "goog.i18n.DateTimePatterns_fa", "goog.i18n.DateTimePatterns_fi", 
"goog.i18n.DateTimePatterns_fil", "goog.i18n.DateTimePatterns_fr", "goog.i18n.DateTimePatterns_fr_CA", "goog.i18n.DateTimePatterns_gl", "goog.i18n.DateTimePatterns_gsw", "goog.i18n.DateTimePatterns_gu", "goog.i18n.DateTimePatterns_haw", "goog.i18n.DateTimePatterns_he", "goog.i18n.DateTimePatterns_hi", "goog.i18n.DateTimePatterns_hr", "goog.i18n.DateTimePatterns_hu", "goog.i18n.DateTimePatterns_id", "goog.i18n.DateTimePatterns_in", "goog.i18n.DateTimePatterns_is", "goog.i18n.DateTimePatterns_it", 
"goog.i18n.DateTimePatterns_iw", "goog.i18n.DateTimePatterns_ja", "goog.i18n.DateTimePatterns_kn", "goog.i18n.DateTimePatterns_ko", "goog.i18n.DateTimePatterns_ln", "goog.i18n.DateTimePatterns_lt", "goog.i18n.DateTimePatterns_lv", "goog.i18n.DateTimePatterns_ml", "goog.i18n.DateTimePatterns_mo", "goog.i18n.DateTimePatterns_mr", "goog.i18n.DateTimePatterns_ms", "goog.i18n.DateTimePatterns_mt", "goog.i18n.DateTimePatterns_nl", "goog.i18n.DateTimePatterns_no", "goog.i18n.DateTimePatterns_or", "goog.i18n.DateTimePatterns_pl", 
"goog.i18n.DateTimePatterns_pt_BR", "goog.i18n.DateTimePatterns_pt_PT", "goog.i18n.DateTimePatterns_pt", "goog.i18n.DateTimePatterns_ro", "goog.i18n.DateTimePatterns_ru", "goog.i18n.DateTimePatterns_sk", "goog.i18n.DateTimePatterns_sl", "goog.i18n.DateTimePatterns_sq", "goog.i18n.DateTimePatterns_sr", "goog.i18n.DateTimePatterns_sv", "goog.i18n.DateTimePatterns_sw", "goog.i18n.DateTimePatterns_ta", "goog.i18n.DateTimePatterns_te", "goog.i18n.DateTimePatterns_th", "goog.i18n.DateTimePatterns_tl", 
"goog.i18n.DateTimePatterns_tr", "goog.i18n.DateTimePatterns_uk", "goog.i18n.DateTimePatterns_ur", "goog.i18n.DateTimePatterns_vi", "goog.i18n.DateTimePatterns_zh_TW", "goog.i18n.DateTimePatterns_zh_CN", "goog.i18n.DateTimePatterns_zh_HK", "goog.i18n.DateTimePatterns_zh", "goog.i18n.DateTimePatterns_zu"], []);
goog.addDependency("/closure/goog/i18n/datetimepatternsext.js", ["goog.i18n.DateTimePatternsExt", "goog.i18n.DateTimePatterns_af_NA", "goog.i18n.DateTimePatterns_af_ZA", "goog.i18n.DateTimePatterns_agq", "goog.i18n.DateTimePatterns_agq_CM", "goog.i18n.DateTimePatterns_ak", "goog.i18n.DateTimePatterns_ak_GH", "goog.i18n.DateTimePatterns_am_ET", "goog.i18n.DateTimePatterns_ar_AE", "goog.i18n.DateTimePatterns_ar_BH", "goog.i18n.DateTimePatterns_ar_DZ", "goog.i18n.DateTimePatterns_ar_EG", "goog.i18n.DateTimePatterns_ar_IQ", 
"goog.i18n.DateTimePatterns_ar_JO", "goog.i18n.DateTimePatterns_ar_KW", "goog.i18n.DateTimePatterns_ar_LB", "goog.i18n.DateTimePatterns_ar_LY", "goog.i18n.DateTimePatterns_ar_MA", "goog.i18n.DateTimePatterns_ar_OM", "goog.i18n.DateTimePatterns_ar_QA", "goog.i18n.DateTimePatterns_ar_SA", "goog.i18n.DateTimePatterns_ar_SD", "goog.i18n.DateTimePatterns_ar_SY", "goog.i18n.DateTimePatterns_ar_TN", "goog.i18n.DateTimePatterns_ar_YE", "goog.i18n.DateTimePatterns_as", "goog.i18n.DateTimePatterns_as_IN", 
"goog.i18n.DateTimePatterns_asa", "goog.i18n.DateTimePatterns_asa_TZ", "goog.i18n.DateTimePatterns_az", "goog.i18n.DateTimePatterns_az_Cyrl", "goog.i18n.DateTimePatterns_az_Cyrl_AZ", "goog.i18n.DateTimePatterns_az_Latn", "goog.i18n.DateTimePatterns_az_Latn_AZ", "goog.i18n.DateTimePatterns_bas", "goog.i18n.DateTimePatterns_bas_CM", "goog.i18n.DateTimePatterns_be", "goog.i18n.DateTimePatterns_be_BY", "goog.i18n.DateTimePatterns_bem", "goog.i18n.DateTimePatterns_bem_ZM", "goog.i18n.DateTimePatterns_bez", 
"goog.i18n.DateTimePatterns_bez_TZ", "goog.i18n.DateTimePatterns_bg_BG", "goog.i18n.DateTimePatterns_bm", "goog.i18n.DateTimePatterns_bm_ML", "goog.i18n.DateTimePatterns_bn_BD", "goog.i18n.DateTimePatterns_bn_IN", "goog.i18n.DateTimePatterns_bo", "goog.i18n.DateTimePatterns_bo_CN", "goog.i18n.DateTimePatterns_bo_IN", "goog.i18n.DateTimePatterns_br", "goog.i18n.DateTimePatterns_br_FR", "goog.i18n.DateTimePatterns_brx", "goog.i18n.DateTimePatterns_brx_IN", "goog.i18n.DateTimePatterns_bs", "goog.i18n.DateTimePatterns_bs_BA", 
"goog.i18n.DateTimePatterns_ca_ES", "goog.i18n.DateTimePatterns_cgg", "goog.i18n.DateTimePatterns_cgg_UG", "goog.i18n.DateTimePatterns_chr_US", "goog.i18n.DateTimePatterns_cs_CZ", "goog.i18n.DateTimePatterns_cy_GB", "goog.i18n.DateTimePatterns_da_DK", "goog.i18n.DateTimePatterns_dav", "goog.i18n.DateTimePatterns_dav_KE", "goog.i18n.DateTimePatterns_de_BE", "goog.i18n.DateTimePatterns_de_DE", "goog.i18n.DateTimePatterns_de_LI", "goog.i18n.DateTimePatterns_de_LU", "goog.i18n.DateTimePatterns_dje", 
"goog.i18n.DateTimePatterns_dje_NE", "goog.i18n.DateTimePatterns_dua", "goog.i18n.DateTimePatterns_dua_CM", "goog.i18n.DateTimePatterns_dyo", "goog.i18n.DateTimePatterns_dyo_SN", "goog.i18n.DateTimePatterns_ebu", "goog.i18n.DateTimePatterns_ebu_KE", "goog.i18n.DateTimePatterns_ee", "goog.i18n.DateTimePatterns_ee_GH", "goog.i18n.DateTimePatterns_ee_TG", "goog.i18n.DateTimePatterns_el_CY", "goog.i18n.DateTimePatterns_el_GR", "goog.i18n.DateTimePatterns_en_AS", "goog.i18n.DateTimePatterns_en_BB", "goog.i18n.DateTimePatterns_en_BE", 
"goog.i18n.DateTimePatterns_en_BM", "goog.i18n.DateTimePatterns_en_BW", "goog.i18n.DateTimePatterns_en_BZ", "goog.i18n.DateTimePatterns_en_CA", "goog.i18n.DateTimePatterns_en_GU", "goog.i18n.DateTimePatterns_en_GY", "goog.i18n.DateTimePatterns_en_HK", "goog.i18n.DateTimePatterns_en_JM", "goog.i18n.DateTimePatterns_en_MH", "goog.i18n.DateTimePatterns_en_MP", "goog.i18n.DateTimePatterns_en_MT", "goog.i18n.DateTimePatterns_en_MU", "goog.i18n.DateTimePatterns_en_NA", "goog.i18n.DateTimePatterns_en_NZ", 
"goog.i18n.DateTimePatterns_en_PH", "goog.i18n.DateTimePatterns_en_PK", "goog.i18n.DateTimePatterns_en_TT", "goog.i18n.DateTimePatterns_en_UM", "goog.i18n.DateTimePatterns_en_US_POSIX", "goog.i18n.DateTimePatterns_en_VI", "goog.i18n.DateTimePatterns_en_ZW", "goog.i18n.DateTimePatterns_eo", "goog.i18n.DateTimePatterns_es_AR", "goog.i18n.DateTimePatterns_es_BO", "goog.i18n.DateTimePatterns_es_CL", "goog.i18n.DateTimePatterns_es_CO", "goog.i18n.DateTimePatterns_es_CR", "goog.i18n.DateTimePatterns_es_DO", 
"goog.i18n.DateTimePatterns_es_EC", "goog.i18n.DateTimePatterns_es_ES", "goog.i18n.DateTimePatterns_es_GQ", "goog.i18n.DateTimePatterns_es_GT", "goog.i18n.DateTimePatterns_es_HN", "goog.i18n.DateTimePatterns_es_MX", "goog.i18n.DateTimePatterns_es_NI", "goog.i18n.DateTimePatterns_es_PA", "goog.i18n.DateTimePatterns_es_PE", "goog.i18n.DateTimePatterns_es_PR", "goog.i18n.DateTimePatterns_es_PY", "goog.i18n.DateTimePatterns_es_SV", "goog.i18n.DateTimePatterns_es_US", "goog.i18n.DateTimePatterns_es_UY", 
"goog.i18n.DateTimePatterns_es_VE", "goog.i18n.DateTimePatterns_et_EE", "goog.i18n.DateTimePatterns_eu_ES", "goog.i18n.DateTimePatterns_ewo", "goog.i18n.DateTimePatterns_ewo_CM", "goog.i18n.DateTimePatterns_fa_AF", "goog.i18n.DateTimePatterns_fa_IR", "goog.i18n.DateTimePatterns_ff", "goog.i18n.DateTimePatterns_ff_SN", "goog.i18n.DateTimePatterns_fi_FI", "goog.i18n.DateTimePatterns_fil_PH", "goog.i18n.DateTimePatterns_fo", "goog.i18n.DateTimePatterns_fo_FO", "goog.i18n.DateTimePatterns_fr_BE", "goog.i18n.DateTimePatterns_fr_BF", 
"goog.i18n.DateTimePatterns_fr_BI", "goog.i18n.DateTimePatterns_fr_BJ", "goog.i18n.DateTimePatterns_fr_BL", "goog.i18n.DateTimePatterns_fr_CD", "goog.i18n.DateTimePatterns_fr_CF", "goog.i18n.DateTimePatterns_fr_CG", "goog.i18n.DateTimePatterns_fr_CH", "goog.i18n.DateTimePatterns_fr_CI", "goog.i18n.DateTimePatterns_fr_CM", "goog.i18n.DateTimePatterns_fr_DJ", "goog.i18n.DateTimePatterns_fr_FR", "goog.i18n.DateTimePatterns_fr_GA", "goog.i18n.DateTimePatterns_fr_GF", "goog.i18n.DateTimePatterns_fr_GN", 
"goog.i18n.DateTimePatterns_fr_GP", "goog.i18n.DateTimePatterns_fr_GQ", "goog.i18n.DateTimePatterns_fr_KM", "goog.i18n.DateTimePatterns_fr_LU", "goog.i18n.DateTimePatterns_fr_MC", "goog.i18n.DateTimePatterns_fr_MF", "goog.i18n.DateTimePatterns_fr_MG", "goog.i18n.DateTimePatterns_fr_ML", "goog.i18n.DateTimePatterns_fr_MQ", "goog.i18n.DateTimePatterns_fr_NE", "goog.i18n.DateTimePatterns_fr_RE", "goog.i18n.DateTimePatterns_fr_RW", "goog.i18n.DateTimePatterns_fr_SN", "goog.i18n.DateTimePatterns_fr_TD", 
"goog.i18n.DateTimePatterns_fr_TG", "goog.i18n.DateTimePatterns_fr_YT", "goog.i18n.DateTimePatterns_ga", "goog.i18n.DateTimePatterns_ga_IE", "goog.i18n.DateTimePatterns_gl_ES", "goog.i18n.DateTimePatterns_gsw_CH", "goog.i18n.DateTimePatterns_gu_IN", "goog.i18n.DateTimePatterns_guz", "goog.i18n.DateTimePatterns_guz_KE", "goog.i18n.DateTimePatterns_gv", "goog.i18n.DateTimePatterns_gv_GB", "goog.i18n.DateTimePatterns_ha", "goog.i18n.DateTimePatterns_ha_Latn", "goog.i18n.DateTimePatterns_ha_Latn_GH", 
"goog.i18n.DateTimePatterns_ha_Latn_NE", "goog.i18n.DateTimePatterns_ha_Latn_NG", "goog.i18n.DateTimePatterns_haw_US", "goog.i18n.DateTimePatterns_he_IL", "goog.i18n.DateTimePatterns_hi_IN", "goog.i18n.DateTimePatterns_hr_HR", "goog.i18n.DateTimePatterns_hu_HU", "goog.i18n.DateTimePatterns_hy", "goog.i18n.DateTimePatterns_hy_AM", "goog.i18n.DateTimePatterns_id_ID", "goog.i18n.DateTimePatterns_ig", "goog.i18n.DateTimePatterns_ig_NG", "goog.i18n.DateTimePatterns_ii", "goog.i18n.DateTimePatterns_ii_CN", 
"goog.i18n.DateTimePatterns_is_IS", "goog.i18n.DateTimePatterns_it_CH", "goog.i18n.DateTimePatterns_it_IT", "goog.i18n.DateTimePatterns_ja_JP", "goog.i18n.DateTimePatterns_jmc", "goog.i18n.DateTimePatterns_jmc_TZ", "goog.i18n.DateTimePatterns_ka", "goog.i18n.DateTimePatterns_ka_GE", "goog.i18n.DateTimePatterns_kab", "goog.i18n.DateTimePatterns_kab_DZ", "goog.i18n.DateTimePatterns_kam", "goog.i18n.DateTimePatterns_kam_KE", "goog.i18n.DateTimePatterns_kde", "goog.i18n.DateTimePatterns_kde_TZ", "goog.i18n.DateTimePatterns_kea", 
"goog.i18n.DateTimePatterns_kea_CV", "goog.i18n.DateTimePatterns_khq", "goog.i18n.DateTimePatterns_khq_ML", "goog.i18n.DateTimePatterns_ki", "goog.i18n.DateTimePatterns_ki_KE", "goog.i18n.DateTimePatterns_kk", "goog.i18n.DateTimePatterns_kk_Cyrl", "goog.i18n.DateTimePatterns_kk_Cyrl_KZ", "goog.i18n.DateTimePatterns_kl", "goog.i18n.DateTimePatterns_kl_GL", "goog.i18n.DateTimePatterns_kln", "goog.i18n.DateTimePatterns_kln_KE", "goog.i18n.DateTimePatterns_km", "goog.i18n.DateTimePatterns_km_KH", "goog.i18n.DateTimePatterns_kn_IN", 
"goog.i18n.DateTimePatterns_ko_KR", "goog.i18n.DateTimePatterns_kok", "goog.i18n.DateTimePatterns_kok_IN", "goog.i18n.DateTimePatterns_ksb", "goog.i18n.DateTimePatterns_ksb_TZ", "goog.i18n.DateTimePatterns_ksf", "goog.i18n.DateTimePatterns_ksf_CM", "goog.i18n.DateTimePatterns_kw", "goog.i18n.DateTimePatterns_kw_GB", "goog.i18n.DateTimePatterns_lag", "goog.i18n.DateTimePatterns_lag_TZ", "goog.i18n.DateTimePatterns_lg", "goog.i18n.DateTimePatterns_lg_UG", "goog.i18n.DateTimePatterns_ln_CD", "goog.i18n.DateTimePatterns_ln_CG", 
"goog.i18n.DateTimePatterns_lt_LT", "goog.i18n.DateTimePatterns_lu", "goog.i18n.DateTimePatterns_lu_CD", "goog.i18n.DateTimePatterns_luo", "goog.i18n.DateTimePatterns_luo_KE", "goog.i18n.DateTimePatterns_luy", "goog.i18n.DateTimePatterns_luy_KE", "goog.i18n.DateTimePatterns_lv_LV", "goog.i18n.DateTimePatterns_mas", "goog.i18n.DateTimePatterns_mas_KE", "goog.i18n.DateTimePatterns_mas_TZ", "goog.i18n.DateTimePatterns_mer", "goog.i18n.DateTimePatterns_mer_KE", "goog.i18n.DateTimePatterns_mfe", "goog.i18n.DateTimePatterns_mfe_MU", 
"goog.i18n.DateTimePatterns_mg", "goog.i18n.DateTimePatterns_mg_MG", "goog.i18n.DateTimePatterns_mgh", "goog.i18n.DateTimePatterns_mgh_MZ", "goog.i18n.DateTimePatterns_mk", "goog.i18n.DateTimePatterns_mk_MK", "goog.i18n.DateTimePatterns_ml_IN", "goog.i18n.DateTimePatterns_mr_IN", "goog.i18n.DateTimePatterns_ms_BN", "goog.i18n.DateTimePatterns_ms_MY", "goog.i18n.DateTimePatterns_mt_MT", "goog.i18n.DateTimePatterns_mua", "goog.i18n.DateTimePatterns_mua_CM", "goog.i18n.DateTimePatterns_my", "goog.i18n.DateTimePatterns_my_MM", 
"goog.i18n.DateTimePatterns_naq", "goog.i18n.DateTimePatterns_naq_NA", "goog.i18n.DateTimePatterns_nb", "goog.i18n.DateTimePatterns_nb_NO", "goog.i18n.DateTimePatterns_nd", "goog.i18n.DateTimePatterns_nd_ZW", "goog.i18n.DateTimePatterns_ne", "goog.i18n.DateTimePatterns_ne_IN", "goog.i18n.DateTimePatterns_ne_NP", "goog.i18n.DateTimePatterns_nl_AW", "goog.i18n.DateTimePatterns_nl_BE", "goog.i18n.DateTimePatterns_nl_NL", "goog.i18n.DateTimePatterns_nmg", "goog.i18n.DateTimePatterns_nmg_CM", "goog.i18n.DateTimePatterns_nn", 
"goog.i18n.DateTimePatterns_nn_NO", "goog.i18n.DateTimePatterns_nus", "goog.i18n.DateTimePatterns_nus_SD", "goog.i18n.DateTimePatterns_nyn", "goog.i18n.DateTimePatterns_nyn_UG", "goog.i18n.DateTimePatterns_om", "goog.i18n.DateTimePatterns_om_ET", "goog.i18n.DateTimePatterns_om_KE", "goog.i18n.DateTimePatterns_or_IN", "goog.i18n.DateTimePatterns_pa", "goog.i18n.DateTimePatterns_pa_Arab", "goog.i18n.DateTimePatterns_pa_Arab_PK", "goog.i18n.DateTimePatterns_pa_Guru", "goog.i18n.DateTimePatterns_pa_Guru_IN", 
"goog.i18n.DateTimePatterns_pl_PL", "goog.i18n.DateTimePatterns_ps", "goog.i18n.DateTimePatterns_ps_AF", "goog.i18n.DateTimePatterns_pt_AO", "goog.i18n.DateTimePatterns_pt_GW", "goog.i18n.DateTimePatterns_pt_MZ", "goog.i18n.DateTimePatterns_pt_ST", "goog.i18n.DateTimePatterns_rm", "goog.i18n.DateTimePatterns_rm_CH", "goog.i18n.DateTimePatterns_rn", "goog.i18n.DateTimePatterns_rn_BI", "goog.i18n.DateTimePatterns_ro_MD", "goog.i18n.DateTimePatterns_ro_RO", "goog.i18n.DateTimePatterns_rof", "goog.i18n.DateTimePatterns_rof_TZ", 
"goog.i18n.DateTimePatterns_ru_MD", "goog.i18n.DateTimePatterns_ru_RU", "goog.i18n.DateTimePatterns_ru_UA", "goog.i18n.DateTimePatterns_rw", "goog.i18n.DateTimePatterns_rw_RW", "goog.i18n.DateTimePatterns_rwk", "goog.i18n.DateTimePatterns_rwk_TZ", "goog.i18n.DateTimePatterns_saq", "goog.i18n.DateTimePatterns_saq_KE", "goog.i18n.DateTimePatterns_sbp", "goog.i18n.DateTimePatterns_sbp_TZ", "goog.i18n.DateTimePatterns_seh", "goog.i18n.DateTimePatterns_seh_MZ", "goog.i18n.DateTimePatterns_ses", "goog.i18n.DateTimePatterns_ses_ML", 
"goog.i18n.DateTimePatterns_sg", "goog.i18n.DateTimePatterns_sg_CF", "goog.i18n.DateTimePatterns_shi", "goog.i18n.DateTimePatterns_shi_Latn", "goog.i18n.DateTimePatterns_shi_Latn_MA", "goog.i18n.DateTimePatterns_shi_Tfng", "goog.i18n.DateTimePatterns_shi_Tfng_MA", "goog.i18n.DateTimePatterns_si", "goog.i18n.DateTimePatterns_si_LK", "goog.i18n.DateTimePatterns_sk_SK", "goog.i18n.DateTimePatterns_sl_SI", "goog.i18n.DateTimePatterns_sn", "goog.i18n.DateTimePatterns_sn_ZW", "goog.i18n.DateTimePatterns_so", 
"goog.i18n.DateTimePatterns_so_DJ", "goog.i18n.DateTimePatterns_so_ET", "goog.i18n.DateTimePatterns_so_KE", "goog.i18n.DateTimePatterns_so_SO", "goog.i18n.DateTimePatterns_sq_AL", "goog.i18n.DateTimePatterns_sr_Cyrl", "goog.i18n.DateTimePatterns_sr_Cyrl_BA", "goog.i18n.DateTimePatterns_sr_Cyrl_ME", "goog.i18n.DateTimePatterns_sr_Cyrl_RS", "goog.i18n.DateTimePatterns_sr_Latn", "goog.i18n.DateTimePatterns_sr_Latn_BA", "goog.i18n.DateTimePatterns_sr_Latn_ME", "goog.i18n.DateTimePatterns_sr_Latn_RS", 
"goog.i18n.DateTimePatterns_sv_FI", "goog.i18n.DateTimePatterns_sv_SE", "goog.i18n.DateTimePatterns_sw_KE", "goog.i18n.DateTimePatterns_sw_TZ", "goog.i18n.DateTimePatterns_swc", "goog.i18n.DateTimePatterns_swc_CD", "goog.i18n.DateTimePatterns_ta_IN", "goog.i18n.DateTimePatterns_ta_LK", "goog.i18n.DateTimePatterns_te_IN", "goog.i18n.DateTimePatterns_teo", "goog.i18n.DateTimePatterns_teo_KE", "goog.i18n.DateTimePatterns_teo_UG", "goog.i18n.DateTimePatterns_th_TH", "goog.i18n.DateTimePatterns_ti", "goog.i18n.DateTimePatterns_ti_ER", 
"goog.i18n.DateTimePatterns_ti_ET", "goog.i18n.DateTimePatterns_to", "goog.i18n.DateTimePatterns_to_TO", "goog.i18n.DateTimePatterns_tr_TR", "goog.i18n.DateTimePatterns_twq", "goog.i18n.DateTimePatterns_twq_NE", "goog.i18n.DateTimePatterns_tzm", "goog.i18n.DateTimePatterns_tzm_Latn", "goog.i18n.DateTimePatterns_tzm_Latn_MA", "goog.i18n.DateTimePatterns_uk_UA", "goog.i18n.DateTimePatterns_ur_IN", "goog.i18n.DateTimePatterns_ur_PK", "goog.i18n.DateTimePatterns_uz", "goog.i18n.DateTimePatterns_uz_Arab", 
"goog.i18n.DateTimePatterns_uz_Arab_AF", "goog.i18n.DateTimePatterns_uz_Cyrl", "goog.i18n.DateTimePatterns_uz_Cyrl_UZ", "goog.i18n.DateTimePatterns_uz_Latn", "goog.i18n.DateTimePatterns_uz_Latn_UZ", "goog.i18n.DateTimePatterns_vai", "goog.i18n.DateTimePatterns_vai_Latn", "goog.i18n.DateTimePatterns_vai_Latn_LR", "goog.i18n.DateTimePatterns_vai_Vaii", "goog.i18n.DateTimePatterns_vai_Vaii_LR", "goog.i18n.DateTimePatterns_vi_VN", "goog.i18n.DateTimePatterns_vun", "goog.i18n.DateTimePatterns_vun_TZ", 
"goog.i18n.DateTimePatterns_xog", "goog.i18n.DateTimePatterns_xog_UG", "goog.i18n.DateTimePatterns_yav", "goog.i18n.DateTimePatterns_yav_CM", "goog.i18n.DateTimePatterns_yo", "goog.i18n.DateTimePatterns_yo_NG", "goog.i18n.DateTimePatterns_zh_Hans", "goog.i18n.DateTimePatterns_zh_Hans_CN", "goog.i18n.DateTimePatterns_zh_Hans_HK", "goog.i18n.DateTimePatterns_zh_Hans_MO", "goog.i18n.DateTimePatterns_zh_Hans_SG", "goog.i18n.DateTimePatterns_zh_Hant", "goog.i18n.DateTimePatterns_zh_Hant_HK", "goog.i18n.DateTimePatterns_zh_Hant_MO", 
"goog.i18n.DateTimePatterns_zh_Hant_TW", "goog.i18n.DateTimePatterns_zu_ZA"], ["goog.i18n.DateTimePatterns"]);
goog.addDependency("/closure/goog/i18n/datetimesymbols.js", ["goog.i18n.DateTimeSymbols", "goog.i18n.DateTimeSymbols_af", "goog.i18n.DateTimeSymbols_am", "goog.i18n.DateTimeSymbols_ar", "goog.i18n.DateTimeSymbols_bg", "goog.i18n.DateTimeSymbols_bn", "goog.i18n.DateTimeSymbols_ca", "goog.i18n.DateTimeSymbols_chr", "goog.i18n.DateTimeSymbols_cs", "goog.i18n.DateTimeSymbols_cy", "goog.i18n.DateTimeSymbols_da", "goog.i18n.DateTimeSymbols_de", "goog.i18n.DateTimeSymbols_de_AT", "goog.i18n.DateTimeSymbols_de_CH", 
"goog.i18n.DateTimeSymbols_el", "goog.i18n.DateTimeSymbols_en", "goog.i18n.DateTimeSymbols_en_AU", "goog.i18n.DateTimeSymbols_en_GB", "goog.i18n.DateTimeSymbols_en_IE", "goog.i18n.DateTimeSymbols_en_IN", "goog.i18n.DateTimeSymbols_en_ISO", "goog.i18n.DateTimeSymbols_en_SG", "goog.i18n.DateTimeSymbols_en_US", "goog.i18n.DateTimeSymbols_en_ZA", "goog.i18n.DateTimeSymbols_es", "goog.i18n.DateTimeSymbols_es_419", "goog.i18n.DateTimeSymbols_et", "goog.i18n.DateTimeSymbols_eu", "goog.i18n.DateTimeSymbols_fa", 
"goog.i18n.DateTimeSymbols_fi", "goog.i18n.DateTimeSymbols_fil", "goog.i18n.DateTimeSymbols_fr", "goog.i18n.DateTimeSymbols_fr_CA", "goog.i18n.DateTimeSymbols_gl", "goog.i18n.DateTimeSymbols_gsw", "goog.i18n.DateTimeSymbols_gu", "goog.i18n.DateTimeSymbols_haw", "goog.i18n.DateTimeSymbols_he", "goog.i18n.DateTimeSymbols_hi", "goog.i18n.DateTimeSymbols_hr", "goog.i18n.DateTimeSymbols_hu", "goog.i18n.DateTimeSymbols_id", "goog.i18n.DateTimeSymbols_in", "goog.i18n.DateTimeSymbols_is", "goog.i18n.DateTimeSymbols_it", 
"goog.i18n.DateTimeSymbols_iw", "goog.i18n.DateTimeSymbols_ja", "goog.i18n.DateTimeSymbols_kn", "goog.i18n.DateTimeSymbols_ko", "goog.i18n.DateTimeSymbols_ln", "goog.i18n.DateTimeSymbols_lt", "goog.i18n.DateTimeSymbols_lv", "goog.i18n.DateTimeSymbols_ml", "goog.i18n.DateTimeSymbols_mr", "goog.i18n.DateTimeSymbols_ms", "goog.i18n.DateTimeSymbols_mt", "goog.i18n.DateTimeSymbols_nl", "goog.i18n.DateTimeSymbols_no", "goog.i18n.DateTimeSymbols_or", "goog.i18n.DateTimeSymbols_pl", "goog.i18n.DateTimeSymbols_pt", 
"goog.i18n.DateTimeSymbols_pt_BR", "goog.i18n.DateTimeSymbols_pt_PT", "goog.i18n.DateTimeSymbols_ro", "goog.i18n.DateTimeSymbols_ru", "goog.i18n.DateTimeSymbols_sk", "goog.i18n.DateTimeSymbols_sl", "goog.i18n.DateTimeSymbols_sq", "goog.i18n.DateTimeSymbols_sr", "goog.i18n.DateTimeSymbols_sv", "goog.i18n.DateTimeSymbols_sw", "goog.i18n.DateTimeSymbols_ta", "goog.i18n.DateTimeSymbols_te", "goog.i18n.DateTimeSymbols_th", "goog.i18n.DateTimeSymbols_tl", "goog.i18n.DateTimeSymbols_tr", "goog.i18n.DateTimeSymbols_uk", 
"goog.i18n.DateTimeSymbols_ur", "goog.i18n.DateTimeSymbols_vi", "goog.i18n.DateTimeSymbols_zh", "goog.i18n.DateTimeSymbols_zh_CN", "goog.i18n.DateTimeSymbols_zh_HK", "goog.i18n.DateTimeSymbols_zh_TW", "goog.i18n.DateTimeSymbols_zu"], []);
goog.addDependency("/closure/goog/i18n/datetimesymbolsext.js", ["goog.i18n.DateTimeSymbolsExt", "goog.i18n.DateTimeSymbols_aa", "goog.i18n.DateTimeSymbols_aa_DJ", "goog.i18n.DateTimeSymbols_aa_ER", "goog.i18n.DateTimeSymbols_aa_ET", "goog.i18n.DateTimeSymbols_af_NA", "goog.i18n.DateTimeSymbols_af_ZA", "goog.i18n.DateTimeSymbols_agq", "goog.i18n.DateTimeSymbols_agq_CM", "goog.i18n.DateTimeSymbols_ak", "goog.i18n.DateTimeSymbols_ak_GH", "goog.i18n.DateTimeSymbols_am_ET", "goog.i18n.DateTimeSymbols_ar_AE", 
"goog.i18n.DateTimeSymbols_ar_BH", "goog.i18n.DateTimeSymbols_ar_DZ", "goog.i18n.DateTimeSymbols_ar_EG", "goog.i18n.DateTimeSymbols_ar_IQ", "goog.i18n.DateTimeSymbols_ar_JO", "goog.i18n.DateTimeSymbols_ar_KW", "goog.i18n.DateTimeSymbols_ar_LB", "goog.i18n.DateTimeSymbols_ar_LY", "goog.i18n.DateTimeSymbols_ar_MA", "goog.i18n.DateTimeSymbols_ar_OM", "goog.i18n.DateTimeSymbols_ar_QA", "goog.i18n.DateTimeSymbols_ar_SA", "goog.i18n.DateTimeSymbols_ar_SD", "goog.i18n.DateTimeSymbols_ar_SY", "goog.i18n.DateTimeSymbols_ar_TN", 
"goog.i18n.DateTimeSymbols_ar_YE", "goog.i18n.DateTimeSymbols_as", "goog.i18n.DateTimeSymbols_as_IN", "goog.i18n.DateTimeSymbols_asa", "goog.i18n.DateTimeSymbols_asa_TZ", "goog.i18n.DateTimeSymbols_az", "goog.i18n.DateTimeSymbols_az_Cyrl", "goog.i18n.DateTimeSymbols_az_Cyrl_AZ", "goog.i18n.DateTimeSymbols_az_Latn", "goog.i18n.DateTimeSymbols_az_Latn_AZ", "goog.i18n.DateTimeSymbols_bas", "goog.i18n.DateTimeSymbols_bas_CM", "goog.i18n.DateTimeSymbols_be", "goog.i18n.DateTimeSymbols_be_BY", "goog.i18n.DateTimeSymbols_bem", 
"goog.i18n.DateTimeSymbols_bem_ZM", "goog.i18n.DateTimeSymbols_bez", "goog.i18n.DateTimeSymbols_bez_TZ", "goog.i18n.DateTimeSymbols_bg_BG", "goog.i18n.DateTimeSymbols_bm", "goog.i18n.DateTimeSymbols_bm_ML", "goog.i18n.DateTimeSymbols_bn_BD", "goog.i18n.DateTimeSymbols_bn_IN", "goog.i18n.DateTimeSymbols_bo", "goog.i18n.DateTimeSymbols_bo_CN", "goog.i18n.DateTimeSymbols_bo_IN", "goog.i18n.DateTimeSymbols_br", "goog.i18n.DateTimeSymbols_br_FR", "goog.i18n.DateTimeSymbols_brx", "goog.i18n.DateTimeSymbols_brx_IN", 
"goog.i18n.DateTimeSymbols_bs", "goog.i18n.DateTimeSymbols_bs_BA", "goog.i18n.DateTimeSymbols_byn", "goog.i18n.DateTimeSymbols_byn_ER", "goog.i18n.DateTimeSymbols_ca_ES", "goog.i18n.DateTimeSymbols_cgg", "goog.i18n.DateTimeSymbols_cgg_UG", "goog.i18n.DateTimeSymbols_chr_US", "goog.i18n.DateTimeSymbols_ckb", "goog.i18n.DateTimeSymbols_ckb_Arab", "goog.i18n.DateTimeSymbols_ckb_Arab_IQ", "goog.i18n.DateTimeSymbols_ckb_Arab_IR", "goog.i18n.DateTimeSymbols_ckb_IQ", "goog.i18n.DateTimeSymbols_ckb_IR", 
"goog.i18n.DateTimeSymbols_ckb_Latn", "goog.i18n.DateTimeSymbols_ckb_Latn_IQ", "goog.i18n.DateTimeSymbols_cs_CZ", "goog.i18n.DateTimeSymbols_cy_GB", "goog.i18n.DateTimeSymbols_da_DK", "goog.i18n.DateTimeSymbols_dav", "goog.i18n.DateTimeSymbols_dav_KE", "goog.i18n.DateTimeSymbols_de_BE", "goog.i18n.DateTimeSymbols_de_DE", "goog.i18n.DateTimeSymbols_de_LI", "goog.i18n.DateTimeSymbols_de_LU", "goog.i18n.DateTimeSymbols_dje", "goog.i18n.DateTimeSymbols_dje_NE", "goog.i18n.DateTimeSymbols_dua", "goog.i18n.DateTimeSymbols_dua_CM", 
"goog.i18n.DateTimeSymbols_dyo", "goog.i18n.DateTimeSymbols_dyo_SN", "goog.i18n.DateTimeSymbols_dz", "goog.i18n.DateTimeSymbols_dz_BT", "goog.i18n.DateTimeSymbols_ebu", "goog.i18n.DateTimeSymbols_ebu_KE", "goog.i18n.DateTimeSymbols_ee", "goog.i18n.DateTimeSymbols_ee_GH", "goog.i18n.DateTimeSymbols_ee_TG", "goog.i18n.DateTimeSymbols_el_CY", "goog.i18n.DateTimeSymbols_el_GR", "goog.i18n.DateTimeSymbols_en_AS", "goog.i18n.DateTimeSymbols_en_BB", "goog.i18n.DateTimeSymbols_en_BE", "goog.i18n.DateTimeSymbols_en_BM", 
"goog.i18n.DateTimeSymbols_en_BW", "goog.i18n.DateTimeSymbols_en_BZ", "goog.i18n.DateTimeSymbols_en_CA", "goog.i18n.DateTimeSymbols_en_Dsrt", "goog.i18n.DateTimeSymbols_en_Dsrt_US", "goog.i18n.DateTimeSymbols_en_GU", "goog.i18n.DateTimeSymbols_en_GY", "goog.i18n.DateTimeSymbols_en_HK", "goog.i18n.DateTimeSymbols_en_JM", "goog.i18n.DateTimeSymbols_en_MH", "goog.i18n.DateTimeSymbols_en_MP", "goog.i18n.DateTimeSymbols_en_MT", "goog.i18n.DateTimeSymbols_en_MU", "goog.i18n.DateTimeSymbols_en_NA", "goog.i18n.DateTimeSymbols_en_NZ", 
"goog.i18n.DateTimeSymbols_en_PH", "goog.i18n.DateTimeSymbols_en_PK", "goog.i18n.DateTimeSymbols_en_TT", "goog.i18n.DateTimeSymbols_en_UM", "goog.i18n.DateTimeSymbols_en_VI", "goog.i18n.DateTimeSymbols_en_ZW", "goog.i18n.DateTimeSymbols_eo", "goog.i18n.DateTimeSymbols_es_AR", "goog.i18n.DateTimeSymbols_es_BO", "goog.i18n.DateTimeSymbols_es_CL", "goog.i18n.DateTimeSymbols_es_CO", "goog.i18n.DateTimeSymbols_es_CR", "goog.i18n.DateTimeSymbols_es_DO", "goog.i18n.DateTimeSymbols_es_EC", "goog.i18n.DateTimeSymbols_es_ES", 
"goog.i18n.DateTimeSymbols_es_GQ", "goog.i18n.DateTimeSymbols_es_GT", "goog.i18n.DateTimeSymbols_es_HN", "goog.i18n.DateTimeSymbols_es_MX", "goog.i18n.DateTimeSymbols_es_NI", "goog.i18n.DateTimeSymbols_es_PA", "goog.i18n.DateTimeSymbols_es_PE", "goog.i18n.DateTimeSymbols_es_PR", "goog.i18n.DateTimeSymbols_es_PY", "goog.i18n.DateTimeSymbols_es_SV", "goog.i18n.DateTimeSymbols_es_US", "goog.i18n.DateTimeSymbols_es_UY", "goog.i18n.DateTimeSymbols_es_VE", "goog.i18n.DateTimeSymbols_et_EE", "goog.i18n.DateTimeSymbols_eu_ES", 
"goog.i18n.DateTimeSymbols_ewo", "goog.i18n.DateTimeSymbols_ewo_CM", "goog.i18n.DateTimeSymbols_fa_AF", "goog.i18n.DateTimeSymbols_fa_IR", "goog.i18n.DateTimeSymbols_ff", "goog.i18n.DateTimeSymbols_ff_SN", "goog.i18n.DateTimeSymbols_fi_FI", "goog.i18n.DateTimeSymbols_fil_PH", "goog.i18n.DateTimeSymbols_fo", "goog.i18n.DateTimeSymbols_fo_FO", "goog.i18n.DateTimeSymbols_fr_BE", "goog.i18n.DateTimeSymbols_fr_BF", "goog.i18n.DateTimeSymbols_fr_BI", "goog.i18n.DateTimeSymbols_fr_BJ", "goog.i18n.DateTimeSymbols_fr_BL", 
"goog.i18n.DateTimeSymbols_fr_CD", "goog.i18n.DateTimeSymbols_fr_CF", "goog.i18n.DateTimeSymbols_fr_CG", "goog.i18n.DateTimeSymbols_fr_CH", "goog.i18n.DateTimeSymbols_fr_CI", "goog.i18n.DateTimeSymbols_fr_CM", "goog.i18n.DateTimeSymbols_fr_DJ", "goog.i18n.DateTimeSymbols_fr_FR", "goog.i18n.DateTimeSymbols_fr_GA", "goog.i18n.DateTimeSymbols_fr_GF", "goog.i18n.DateTimeSymbols_fr_GN", "goog.i18n.DateTimeSymbols_fr_GP", "goog.i18n.DateTimeSymbols_fr_GQ", "goog.i18n.DateTimeSymbols_fr_KM", "goog.i18n.DateTimeSymbols_fr_LU", 
"goog.i18n.DateTimeSymbols_fr_MC", "goog.i18n.DateTimeSymbols_fr_MF", "goog.i18n.DateTimeSymbols_fr_MG", "goog.i18n.DateTimeSymbols_fr_ML", "goog.i18n.DateTimeSymbols_fr_MQ", "goog.i18n.DateTimeSymbols_fr_NE", "goog.i18n.DateTimeSymbols_fr_RE", "goog.i18n.DateTimeSymbols_fr_RW", "goog.i18n.DateTimeSymbols_fr_SN", "goog.i18n.DateTimeSymbols_fr_TD", "goog.i18n.DateTimeSymbols_fr_TG", "goog.i18n.DateTimeSymbols_fr_YT", "goog.i18n.DateTimeSymbols_fur", "goog.i18n.DateTimeSymbols_fur_IT", "goog.i18n.DateTimeSymbols_ga", 
"goog.i18n.DateTimeSymbols_ga_IE", "goog.i18n.DateTimeSymbols_gl_ES", "goog.i18n.DateTimeSymbols_gsw_CH", "goog.i18n.DateTimeSymbols_gu_IN", "goog.i18n.DateTimeSymbols_guz", "goog.i18n.DateTimeSymbols_guz_KE", "goog.i18n.DateTimeSymbols_gv", "goog.i18n.DateTimeSymbols_gv_GB", "goog.i18n.DateTimeSymbols_ha", "goog.i18n.DateTimeSymbols_ha_Latn", "goog.i18n.DateTimeSymbols_ha_Latn_GH", "goog.i18n.DateTimeSymbols_ha_Latn_NE", "goog.i18n.DateTimeSymbols_ha_Latn_NG", "goog.i18n.DateTimeSymbols_haw_US", 
"goog.i18n.DateTimeSymbols_he_IL", "goog.i18n.DateTimeSymbols_hi_IN", "goog.i18n.DateTimeSymbols_hr_HR", "goog.i18n.DateTimeSymbols_hu_HU", "goog.i18n.DateTimeSymbols_hy", "goog.i18n.DateTimeSymbols_hy_AM", "goog.i18n.DateTimeSymbols_ia", "goog.i18n.DateTimeSymbols_id_ID", "goog.i18n.DateTimeSymbols_ig", "goog.i18n.DateTimeSymbols_ig_NG", "goog.i18n.DateTimeSymbols_ii", "goog.i18n.DateTimeSymbols_ii_CN", "goog.i18n.DateTimeSymbols_is_IS", "goog.i18n.DateTimeSymbols_it_CH", "goog.i18n.DateTimeSymbols_it_IT", 
"goog.i18n.DateTimeSymbols_ja_JP", "goog.i18n.DateTimeSymbols_jmc", "goog.i18n.DateTimeSymbols_jmc_TZ", "goog.i18n.DateTimeSymbols_ka", "goog.i18n.DateTimeSymbols_ka_GE", "goog.i18n.DateTimeSymbols_kab", "goog.i18n.DateTimeSymbols_kab_DZ", "goog.i18n.DateTimeSymbols_kam", "goog.i18n.DateTimeSymbols_kam_KE", "goog.i18n.DateTimeSymbols_kde", "goog.i18n.DateTimeSymbols_kde_TZ", "goog.i18n.DateTimeSymbols_kea", "goog.i18n.DateTimeSymbols_kea_CV", "goog.i18n.DateTimeSymbols_khq", "goog.i18n.DateTimeSymbols_khq_ML", 
"goog.i18n.DateTimeSymbols_ki", "goog.i18n.DateTimeSymbols_ki_KE", "goog.i18n.DateTimeSymbols_kk", "goog.i18n.DateTimeSymbols_kk_Cyrl", "goog.i18n.DateTimeSymbols_kk_Cyrl_KZ", "goog.i18n.DateTimeSymbols_kl", "goog.i18n.DateTimeSymbols_kl_GL", "goog.i18n.DateTimeSymbols_kln", "goog.i18n.DateTimeSymbols_kln_KE", "goog.i18n.DateTimeSymbols_km", "goog.i18n.DateTimeSymbols_km_KH", "goog.i18n.DateTimeSymbols_kn_IN", "goog.i18n.DateTimeSymbols_ko_KR", "goog.i18n.DateTimeSymbols_kok", "goog.i18n.DateTimeSymbols_kok_IN", 
"goog.i18n.DateTimeSymbols_ksb", "goog.i18n.DateTimeSymbols_ksb_TZ", "goog.i18n.DateTimeSymbols_ksf", "goog.i18n.DateTimeSymbols_ksf_CM", "goog.i18n.DateTimeSymbols_ksh", "goog.i18n.DateTimeSymbols_ksh_DE", "goog.i18n.DateTimeSymbols_ku", "goog.i18n.DateTimeSymbols_kw", "goog.i18n.DateTimeSymbols_kw_GB", "goog.i18n.DateTimeSymbols_lag", "goog.i18n.DateTimeSymbols_lag_TZ", "goog.i18n.DateTimeSymbols_lg", "goog.i18n.DateTimeSymbols_lg_UG", "goog.i18n.DateTimeSymbols_ln_CD", "goog.i18n.DateTimeSymbols_ln_CG", 
"goog.i18n.DateTimeSymbols_lo", "goog.i18n.DateTimeSymbols_lo_LA", "goog.i18n.DateTimeSymbols_lt_LT", "goog.i18n.DateTimeSymbols_lu", "goog.i18n.DateTimeSymbols_lu_CD", "goog.i18n.DateTimeSymbols_luo", "goog.i18n.DateTimeSymbols_luo_KE", "goog.i18n.DateTimeSymbols_luy", "goog.i18n.DateTimeSymbols_luy_KE", "goog.i18n.DateTimeSymbols_lv_LV", "goog.i18n.DateTimeSymbols_mas", "goog.i18n.DateTimeSymbols_mas_KE", "goog.i18n.DateTimeSymbols_mas_TZ", "goog.i18n.DateTimeSymbols_mer", "goog.i18n.DateTimeSymbols_mer_KE", 
"goog.i18n.DateTimeSymbols_mfe", "goog.i18n.DateTimeSymbols_mfe_MU", "goog.i18n.DateTimeSymbols_mg", "goog.i18n.DateTimeSymbols_mg_MG", "goog.i18n.DateTimeSymbols_mgh", "goog.i18n.DateTimeSymbols_mgh_MZ", "goog.i18n.DateTimeSymbols_mk", "goog.i18n.DateTimeSymbols_mk_MK", "goog.i18n.DateTimeSymbols_ml_IN", "goog.i18n.DateTimeSymbols_mr_IN", "goog.i18n.DateTimeSymbols_ms_BN", "goog.i18n.DateTimeSymbols_ms_MY", "goog.i18n.DateTimeSymbols_mt_MT", "goog.i18n.DateTimeSymbols_mua", "goog.i18n.DateTimeSymbols_mua_CM", 
"goog.i18n.DateTimeSymbols_my", "goog.i18n.DateTimeSymbols_my_MM", "goog.i18n.DateTimeSymbols_naq", "goog.i18n.DateTimeSymbols_naq_NA", "goog.i18n.DateTimeSymbols_nb", "goog.i18n.DateTimeSymbols_nb_NO", "goog.i18n.DateTimeSymbols_nd", "goog.i18n.DateTimeSymbols_nd_ZW", "goog.i18n.DateTimeSymbols_ne", "goog.i18n.DateTimeSymbols_ne_IN", "goog.i18n.DateTimeSymbols_ne_NP", "goog.i18n.DateTimeSymbols_nl_AW", "goog.i18n.DateTimeSymbols_nl_BE", "goog.i18n.DateTimeSymbols_nl_NL", "goog.i18n.DateTimeSymbols_nmg", 
"goog.i18n.DateTimeSymbols_nmg_CM", "goog.i18n.DateTimeSymbols_nn", "goog.i18n.DateTimeSymbols_nn_NO", "goog.i18n.DateTimeSymbols_nr", "goog.i18n.DateTimeSymbols_nr_ZA", "goog.i18n.DateTimeSymbols_nso", "goog.i18n.DateTimeSymbols_nso_ZA", "goog.i18n.DateTimeSymbols_nus", "goog.i18n.DateTimeSymbols_nus_SD", "goog.i18n.DateTimeSymbols_nyn", "goog.i18n.DateTimeSymbols_nyn_UG", "goog.i18n.DateTimeSymbols_om", "goog.i18n.DateTimeSymbols_om_ET", "goog.i18n.DateTimeSymbols_om_KE", "goog.i18n.DateTimeSymbols_or_IN", 
"goog.i18n.DateTimeSymbols_pa", "goog.i18n.DateTimeSymbols_pa_Arab", "goog.i18n.DateTimeSymbols_pa_Arab_PK", "goog.i18n.DateTimeSymbols_pa_Guru", "goog.i18n.DateTimeSymbols_pa_Guru_IN", "goog.i18n.DateTimeSymbols_pl_PL", "goog.i18n.DateTimeSymbols_ps", "goog.i18n.DateTimeSymbols_ps_AF", "goog.i18n.DateTimeSymbols_pt_AO", "goog.i18n.DateTimeSymbols_pt_GW", "goog.i18n.DateTimeSymbols_pt_MZ", "goog.i18n.DateTimeSymbols_pt_ST", "goog.i18n.DateTimeSymbols_rm", "goog.i18n.DateTimeSymbols_rm_CH", "goog.i18n.DateTimeSymbols_rn", 
"goog.i18n.DateTimeSymbols_rn_BI", "goog.i18n.DateTimeSymbols_ro_MD", "goog.i18n.DateTimeSymbols_ro_RO", "goog.i18n.DateTimeSymbols_rof", "goog.i18n.DateTimeSymbols_rof_TZ", "goog.i18n.DateTimeSymbols_ru_MD", "goog.i18n.DateTimeSymbols_ru_RU", "goog.i18n.DateTimeSymbols_ru_UA", "goog.i18n.DateTimeSymbols_rw", "goog.i18n.DateTimeSymbols_rw_RW", "goog.i18n.DateTimeSymbols_rwk", "goog.i18n.DateTimeSymbols_rwk_TZ", "goog.i18n.DateTimeSymbols_sah", "goog.i18n.DateTimeSymbols_sah_RU", "goog.i18n.DateTimeSymbols_saq", 
"goog.i18n.DateTimeSymbols_saq_KE", "goog.i18n.DateTimeSymbols_sbp", "goog.i18n.DateTimeSymbols_sbp_TZ", "goog.i18n.DateTimeSymbols_se", "goog.i18n.DateTimeSymbols_se_FI", "goog.i18n.DateTimeSymbols_se_NO", "goog.i18n.DateTimeSymbols_seh", "goog.i18n.DateTimeSymbols_seh_MZ", "goog.i18n.DateTimeSymbols_ses", "goog.i18n.DateTimeSymbols_ses_ML", "goog.i18n.DateTimeSymbols_sg", "goog.i18n.DateTimeSymbols_sg_CF", "goog.i18n.DateTimeSymbols_shi", "goog.i18n.DateTimeSymbols_shi_Latn", "goog.i18n.DateTimeSymbols_shi_Latn_MA", 
"goog.i18n.DateTimeSymbols_shi_Tfng", "goog.i18n.DateTimeSymbols_shi_Tfng_MA", "goog.i18n.DateTimeSymbols_si", "goog.i18n.DateTimeSymbols_si_LK", "goog.i18n.DateTimeSymbols_sk_SK", "goog.i18n.DateTimeSymbols_sl_SI", "goog.i18n.DateTimeSymbols_sn", "goog.i18n.DateTimeSymbols_sn_ZW", "goog.i18n.DateTimeSymbols_so", "goog.i18n.DateTimeSymbols_so_DJ", "goog.i18n.DateTimeSymbols_so_ET", "goog.i18n.DateTimeSymbols_so_KE", "goog.i18n.DateTimeSymbols_so_SO", "goog.i18n.DateTimeSymbols_sq_AL", "goog.i18n.DateTimeSymbols_sr_Cyrl", 
"goog.i18n.DateTimeSymbols_sr_Cyrl_BA", "goog.i18n.DateTimeSymbols_sr_Cyrl_ME", "goog.i18n.DateTimeSymbols_sr_Cyrl_RS", "goog.i18n.DateTimeSymbols_sr_Latn", "goog.i18n.DateTimeSymbols_sr_Latn_BA", "goog.i18n.DateTimeSymbols_sr_Latn_ME", "goog.i18n.DateTimeSymbols_sr_Latn_RS", "goog.i18n.DateTimeSymbols_ss", "goog.i18n.DateTimeSymbols_ss_SZ", "goog.i18n.DateTimeSymbols_ss_ZA", "goog.i18n.DateTimeSymbols_ssy", "goog.i18n.DateTimeSymbols_ssy_ER", "goog.i18n.DateTimeSymbols_st", "goog.i18n.DateTimeSymbols_st_LS", 
"goog.i18n.DateTimeSymbols_st_ZA", "goog.i18n.DateTimeSymbols_sv_FI", "goog.i18n.DateTimeSymbols_sv_SE", "goog.i18n.DateTimeSymbols_sw_KE", "goog.i18n.DateTimeSymbols_sw_TZ", "goog.i18n.DateTimeSymbols_swc", "goog.i18n.DateTimeSymbols_swc_CD", "goog.i18n.DateTimeSymbols_ta_IN", "goog.i18n.DateTimeSymbols_ta_LK", "goog.i18n.DateTimeSymbols_te_IN", "goog.i18n.DateTimeSymbols_teo", "goog.i18n.DateTimeSymbols_teo_KE", "goog.i18n.DateTimeSymbols_teo_UG", "goog.i18n.DateTimeSymbols_tg", "goog.i18n.DateTimeSymbols_tg_Cyrl", 
"goog.i18n.DateTimeSymbols_tg_Cyrl_TJ", "goog.i18n.DateTimeSymbols_th_TH", "goog.i18n.DateTimeSymbols_ti", "goog.i18n.DateTimeSymbols_ti_ER", "goog.i18n.DateTimeSymbols_ti_ET", "goog.i18n.DateTimeSymbols_tig", "goog.i18n.DateTimeSymbols_tig_ER", "goog.i18n.DateTimeSymbols_tn", "goog.i18n.DateTimeSymbols_tn_ZA", "goog.i18n.DateTimeSymbols_to", "goog.i18n.DateTimeSymbols_to_TO", "goog.i18n.DateTimeSymbols_tr_TR", "goog.i18n.DateTimeSymbols_ts", "goog.i18n.DateTimeSymbols_ts_ZA", "goog.i18n.DateTimeSymbols_twq", 
"goog.i18n.DateTimeSymbols_twq_NE", "goog.i18n.DateTimeSymbols_tzm", "goog.i18n.DateTimeSymbols_tzm_Latn", "goog.i18n.DateTimeSymbols_tzm_Latn_MA", "goog.i18n.DateTimeSymbols_uk_UA", "goog.i18n.DateTimeSymbols_ur_IN", "goog.i18n.DateTimeSymbols_ur_PK", "goog.i18n.DateTimeSymbols_uz", "goog.i18n.DateTimeSymbols_uz_Arab", "goog.i18n.DateTimeSymbols_uz_Arab_AF", "goog.i18n.DateTimeSymbols_uz_Cyrl", "goog.i18n.DateTimeSymbols_uz_Cyrl_UZ", "goog.i18n.DateTimeSymbols_uz_Latn", "goog.i18n.DateTimeSymbols_uz_Latn_UZ", 
"goog.i18n.DateTimeSymbols_vai", "goog.i18n.DateTimeSymbols_vai_Latn", "goog.i18n.DateTimeSymbols_vai_Latn_LR", "goog.i18n.DateTimeSymbols_vai_Vaii", "goog.i18n.DateTimeSymbols_vai_Vaii_LR", "goog.i18n.DateTimeSymbols_ve", "goog.i18n.DateTimeSymbols_ve_ZA", "goog.i18n.DateTimeSymbols_vi_VN", "goog.i18n.DateTimeSymbols_vun", "goog.i18n.DateTimeSymbols_vun_TZ", "goog.i18n.DateTimeSymbols_wae", "goog.i18n.DateTimeSymbols_wae_CH", "goog.i18n.DateTimeSymbols_wal", "goog.i18n.DateTimeSymbols_wal_ET", "goog.i18n.DateTimeSymbols_xh", 
"goog.i18n.DateTimeSymbols_xh_ZA", "goog.i18n.DateTimeSymbols_xog", "goog.i18n.DateTimeSymbols_xog_UG", "goog.i18n.DateTimeSymbols_yav", "goog.i18n.DateTimeSymbols_yav_CM", "goog.i18n.DateTimeSymbols_yo", "goog.i18n.DateTimeSymbols_yo_NG", "goog.i18n.DateTimeSymbols_zh_Hans", "goog.i18n.DateTimeSymbols_zh_Hans_CN", "goog.i18n.DateTimeSymbols_zh_Hans_HK", "goog.i18n.DateTimeSymbols_zh_Hans_MO", "goog.i18n.DateTimeSymbols_zh_Hans_SG", "goog.i18n.DateTimeSymbols_zh_Hant", "goog.i18n.DateTimeSymbols_zh_Hant_HK", 
"goog.i18n.DateTimeSymbols_zh_Hant_MO", "goog.i18n.DateTimeSymbols_zh_Hant_TW", "goog.i18n.DateTimeSymbols_zu_ZA"], ["goog.i18n.DateTimeSymbols"]);
goog.addDependency("/closure/goog/i18n/graphemebreak.js", ["goog.i18n.GraphemeBreak"], ["goog.structs.InversionMap"]);
goog.addDependency("/closure/goog/i18n/messageformat.js", ["goog.i18n.MessageFormat"], ["goog.asserts", "goog.i18n.NumberFormat", "goog.i18n.ordinalRules", "goog.i18n.pluralRules"]);
goog.addDependency("/closure/goog/i18n/mime.js", ["goog.i18n.mime", "goog.i18n.mime.encode"], []);
goog.addDependency("/closure/goog/i18n/numberformat.js", ["goog.i18n.NumberFormat", "goog.i18n.NumberFormat.CurrencyStyle", "goog.i18n.NumberFormat.Format"], ["goog.i18n.NumberFormatSymbols", "goog.i18n.currency"]);
goog.addDependency("/closure/goog/i18n/numberformatsymbols.js", ["goog.i18n.NumberFormatSymbols", "goog.i18n.NumberFormatSymbols_af", "goog.i18n.NumberFormatSymbols_af_ZA", "goog.i18n.NumberFormatSymbols_am", "goog.i18n.NumberFormatSymbols_am_ET", "goog.i18n.NumberFormatSymbols_ar", "goog.i18n.NumberFormatSymbols_ar_001", "goog.i18n.NumberFormatSymbols_ar_EG", "goog.i18n.NumberFormatSymbols_bg", "goog.i18n.NumberFormatSymbols_bg_BG", "goog.i18n.NumberFormatSymbols_bn", "goog.i18n.NumberFormatSymbols_bn_BD", 
"goog.i18n.NumberFormatSymbols_ca", "goog.i18n.NumberFormatSymbols_ca_ES", "goog.i18n.NumberFormatSymbols_chr", "goog.i18n.NumberFormatSymbols_chr_US", "goog.i18n.NumberFormatSymbols_cs", "goog.i18n.NumberFormatSymbols_cs_CZ", "goog.i18n.NumberFormatSymbols_cy", "goog.i18n.NumberFormatSymbols_cy_GB", "goog.i18n.NumberFormatSymbols_da", "goog.i18n.NumberFormatSymbols_da_DK", "goog.i18n.NumberFormatSymbols_de", "goog.i18n.NumberFormatSymbols_de_AT", "goog.i18n.NumberFormatSymbols_de_BE", "goog.i18n.NumberFormatSymbols_de_CH", 
"goog.i18n.NumberFormatSymbols_de_DE", "goog.i18n.NumberFormatSymbols_de_LU", "goog.i18n.NumberFormatSymbols_el", "goog.i18n.NumberFormatSymbols_el_GR", "goog.i18n.NumberFormatSymbols_en", "goog.i18n.NumberFormatSymbols_en_AS", "goog.i18n.NumberFormatSymbols_en_AU", "goog.i18n.NumberFormatSymbols_en_Dsrt", "goog.i18n.NumberFormatSymbols_en_Dsrt_US", "goog.i18n.NumberFormatSymbols_en_GB", "goog.i18n.NumberFormatSymbols_en_GU", "goog.i18n.NumberFormatSymbols_en_IE", "goog.i18n.NumberFormatSymbols_en_IN", 
"goog.i18n.NumberFormatSymbols_en_MH", "goog.i18n.NumberFormatSymbols_en_MP", "goog.i18n.NumberFormatSymbols_en_SG", "goog.i18n.NumberFormatSymbols_en_UM", "goog.i18n.NumberFormatSymbols_en_US", "goog.i18n.NumberFormatSymbols_en_VI", "goog.i18n.NumberFormatSymbols_en_ZA", "goog.i18n.NumberFormatSymbols_es", "goog.i18n.NumberFormatSymbols_es_419", "goog.i18n.NumberFormatSymbols_es_ES", "goog.i18n.NumberFormatSymbols_et", "goog.i18n.NumberFormatSymbols_et_EE", "goog.i18n.NumberFormatSymbols_eu", "goog.i18n.NumberFormatSymbols_eu_ES", 
"goog.i18n.NumberFormatSymbols_fa", "goog.i18n.NumberFormatSymbols_fa_IR", "goog.i18n.NumberFormatSymbols_fi", "goog.i18n.NumberFormatSymbols_fi_FI", "goog.i18n.NumberFormatSymbols_fil", "goog.i18n.NumberFormatSymbols_fil_PH", "goog.i18n.NumberFormatSymbols_fr", "goog.i18n.NumberFormatSymbols_fr_BL", "goog.i18n.NumberFormatSymbols_fr_CA", "goog.i18n.NumberFormatSymbols_fr_FR", "goog.i18n.NumberFormatSymbols_fr_GF", "goog.i18n.NumberFormatSymbols_fr_GP", "goog.i18n.NumberFormatSymbols_fr_MC", "goog.i18n.NumberFormatSymbols_fr_MF", 
"goog.i18n.NumberFormatSymbols_fr_MQ", "goog.i18n.NumberFormatSymbols_fr_RE", "goog.i18n.NumberFormatSymbols_fr_YT", "goog.i18n.NumberFormatSymbols_gl", "goog.i18n.NumberFormatSymbols_gl_ES", "goog.i18n.NumberFormatSymbols_gsw", "goog.i18n.NumberFormatSymbols_gsw_CH", "goog.i18n.NumberFormatSymbols_gu", "goog.i18n.NumberFormatSymbols_gu_IN", "goog.i18n.NumberFormatSymbols_haw", "goog.i18n.NumberFormatSymbols_haw_US", "goog.i18n.NumberFormatSymbols_he", "goog.i18n.NumberFormatSymbols_he_IL", "goog.i18n.NumberFormatSymbols_hi", 
"goog.i18n.NumberFormatSymbols_hi_IN", "goog.i18n.NumberFormatSymbols_hr", "goog.i18n.NumberFormatSymbols_hr_HR", "goog.i18n.NumberFormatSymbols_hu", "goog.i18n.NumberFormatSymbols_hu_HU", "goog.i18n.NumberFormatSymbols_id", "goog.i18n.NumberFormatSymbols_id_ID", "goog.i18n.NumberFormatSymbols_in", "goog.i18n.NumberFormatSymbols_is", "goog.i18n.NumberFormatSymbols_is_IS", "goog.i18n.NumberFormatSymbols_it", "goog.i18n.NumberFormatSymbols_it_IT", "goog.i18n.NumberFormatSymbols_iw", "goog.i18n.NumberFormatSymbols_ja", 
"goog.i18n.NumberFormatSymbols_ja_JP", "goog.i18n.NumberFormatSymbols_kn", "goog.i18n.NumberFormatSymbols_kn_IN", "goog.i18n.NumberFormatSymbols_ko", "goog.i18n.NumberFormatSymbols_ko_KR", "goog.i18n.NumberFormatSymbols_ln", "goog.i18n.NumberFormatSymbols_ln_CD", "goog.i18n.NumberFormatSymbols_lt", "goog.i18n.NumberFormatSymbols_lt_LT", "goog.i18n.NumberFormatSymbols_lv", "goog.i18n.NumberFormatSymbols_lv_LV", "goog.i18n.NumberFormatSymbols_ml", "goog.i18n.NumberFormatSymbols_ml_IN", "goog.i18n.NumberFormatSymbols_mr", 
"goog.i18n.NumberFormatSymbols_mr_IN", "goog.i18n.NumberFormatSymbols_ms", "goog.i18n.NumberFormatSymbols_ms_MY", "goog.i18n.NumberFormatSymbols_mt", "goog.i18n.NumberFormatSymbols_mt_MT", "goog.i18n.NumberFormatSymbols_nl", "goog.i18n.NumberFormatSymbols_nl_NL", "goog.i18n.NumberFormatSymbols_no", "goog.i18n.NumberFormatSymbols_or", "goog.i18n.NumberFormatSymbols_or_IN", "goog.i18n.NumberFormatSymbols_pl", "goog.i18n.NumberFormatSymbols_pl_PL", "goog.i18n.NumberFormatSymbols_pt", "goog.i18n.NumberFormatSymbols_pt_BR", 
"goog.i18n.NumberFormatSymbols_pt_PT", "goog.i18n.NumberFormatSymbols_ro", "goog.i18n.NumberFormatSymbols_ro_RO", "goog.i18n.NumberFormatSymbols_ru", "goog.i18n.NumberFormatSymbols_ru_RU", "goog.i18n.NumberFormatSymbols_sk", "goog.i18n.NumberFormatSymbols_sk_SK", "goog.i18n.NumberFormatSymbols_sl", "goog.i18n.NumberFormatSymbols_sl_SI", "goog.i18n.NumberFormatSymbols_sq", "goog.i18n.NumberFormatSymbols_sq_AL", "goog.i18n.NumberFormatSymbols_sr", "goog.i18n.NumberFormatSymbols_sr_Cyrl_RS", "goog.i18n.NumberFormatSymbols_sr_Latn_RS", 
"goog.i18n.NumberFormatSymbols_sv", "goog.i18n.NumberFormatSymbols_sv_SE", "goog.i18n.NumberFormatSymbols_sw", "goog.i18n.NumberFormatSymbols_sw_TZ", "goog.i18n.NumberFormatSymbols_ta", "goog.i18n.NumberFormatSymbols_ta_IN", "goog.i18n.NumberFormatSymbols_te", "goog.i18n.NumberFormatSymbols_te_IN", "goog.i18n.NumberFormatSymbols_th", "goog.i18n.NumberFormatSymbols_th_TH", "goog.i18n.NumberFormatSymbols_tl", "goog.i18n.NumberFormatSymbols_tr", "goog.i18n.NumberFormatSymbols_tr_TR", "goog.i18n.NumberFormatSymbols_uk", 
"goog.i18n.NumberFormatSymbols_uk_UA", "goog.i18n.NumberFormatSymbols_ur", "goog.i18n.NumberFormatSymbols_ur_PK", "goog.i18n.NumberFormatSymbols_vi", "goog.i18n.NumberFormatSymbols_vi_VN", "goog.i18n.NumberFormatSymbols_zh", "goog.i18n.NumberFormatSymbols_zh_CN", "goog.i18n.NumberFormatSymbols_zh_HK", "goog.i18n.NumberFormatSymbols_zh_Hans", "goog.i18n.NumberFormatSymbols_zh_Hans_CN", "goog.i18n.NumberFormatSymbols_zh_TW", "goog.i18n.NumberFormatSymbols_zu", "goog.i18n.NumberFormatSymbols_zu_ZA"], 
[]);
goog.addDependency("/closure/goog/i18n/numberformatsymbolsext.js", ["goog.i18n.NumberFormatSymbolsExt", "goog.i18n.NumberFormatSymbols_aa", "goog.i18n.NumberFormatSymbols_aa_DJ", "goog.i18n.NumberFormatSymbols_aa_ER", "goog.i18n.NumberFormatSymbols_aa_ET", "goog.i18n.NumberFormatSymbols_af_NA", "goog.i18n.NumberFormatSymbols_agq", "goog.i18n.NumberFormatSymbols_agq_CM", "goog.i18n.NumberFormatSymbols_ak", "goog.i18n.NumberFormatSymbols_ak_GH", "goog.i18n.NumberFormatSymbols_ar_AE", "goog.i18n.NumberFormatSymbols_ar_BH", 
"goog.i18n.NumberFormatSymbols_ar_DZ", "goog.i18n.NumberFormatSymbols_ar_IQ", "goog.i18n.NumberFormatSymbols_ar_JO", "goog.i18n.NumberFormatSymbols_ar_KW", "goog.i18n.NumberFormatSymbols_ar_LB", "goog.i18n.NumberFormatSymbols_ar_LY", "goog.i18n.NumberFormatSymbols_ar_MA", "goog.i18n.NumberFormatSymbols_ar_OM", "goog.i18n.NumberFormatSymbols_ar_QA", "goog.i18n.NumberFormatSymbols_ar_SA", "goog.i18n.NumberFormatSymbols_ar_SD", "goog.i18n.NumberFormatSymbols_ar_SY", "goog.i18n.NumberFormatSymbols_ar_TN", 
"goog.i18n.NumberFormatSymbols_ar_YE", "goog.i18n.NumberFormatSymbols_as", "goog.i18n.NumberFormatSymbols_as_IN", "goog.i18n.NumberFormatSymbols_asa", "goog.i18n.NumberFormatSymbols_asa_TZ", "goog.i18n.NumberFormatSymbols_az", "goog.i18n.NumberFormatSymbols_az_Cyrl", "goog.i18n.NumberFormatSymbols_az_Cyrl_AZ", "goog.i18n.NumberFormatSymbols_az_Latn", "goog.i18n.NumberFormatSymbols_az_Latn_AZ", "goog.i18n.NumberFormatSymbols_bas", "goog.i18n.NumberFormatSymbols_bas_CM", "goog.i18n.NumberFormatSymbols_be", 
"goog.i18n.NumberFormatSymbols_be_BY", "goog.i18n.NumberFormatSymbols_bem", "goog.i18n.NumberFormatSymbols_bem_ZM", "goog.i18n.NumberFormatSymbols_bez", "goog.i18n.NumberFormatSymbols_bez_TZ", "goog.i18n.NumberFormatSymbols_bm", "goog.i18n.NumberFormatSymbols_bm_ML", "goog.i18n.NumberFormatSymbols_bn_IN", "goog.i18n.NumberFormatSymbols_bo", "goog.i18n.NumberFormatSymbols_bo_CN", "goog.i18n.NumberFormatSymbols_bo_IN", "goog.i18n.NumberFormatSymbols_br", "goog.i18n.NumberFormatSymbols_br_FR", "goog.i18n.NumberFormatSymbols_brx", 
"goog.i18n.NumberFormatSymbols_brx_IN", "goog.i18n.NumberFormatSymbols_bs", "goog.i18n.NumberFormatSymbols_bs_BA", "goog.i18n.NumberFormatSymbols_byn", "goog.i18n.NumberFormatSymbols_byn_ER", "goog.i18n.NumberFormatSymbols_cgg", "goog.i18n.NumberFormatSymbols_cgg_UG", "goog.i18n.NumberFormatSymbols_ckb", "goog.i18n.NumberFormatSymbols_ckb_Arab", "goog.i18n.NumberFormatSymbols_ckb_Arab_IQ", "goog.i18n.NumberFormatSymbols_ckb_Arab_IR", "goog.i18n.NumberFormatSymbols_ckb_IQ", "goog.i18n.NumberFormatSymbols_ckb_IR", 
"goog.i18n.NumberFormatSymbols_ckb_Latn", "goog.i18n.NumberFormatSymbols_ckb_Latn_IQ", "goog.i18n.NumberFormatSymbols_dav", "goog.i18n.NumberFormatSymbols_dav_KE", "goog.i18n.NumberFormatSymbols_de_LI", "goog.i18n.NumberFormatSymbols_dje", "goog.i18n.NumberFormatSymbols_dje_NE", "goog.i18n.NumberFormatSymbols_dua", "goog.i18n.NumberFormatSymbols_dua_CM", "goog.i18n.NumberFormatSymbols_dyo", "goog.i18n.NumberFormatSymbols_dyo_SN", "goog.i18n.NumberFormatSymbols_dz", "goog.i18n.NumberFormatSymbols_dz_BT", 
"goog.i18n.NumberFormatSymbols_ebu", "goog.i18n.NumberFormatSymbols_ebu_KE", "goog.i18n.NumberFormatSymbols_ee", "goog.i18n.NumberFormatSymbols_ee_GH", "goog.i18n.NumberFormatSymbols_ee_TG", "goog.i18n.NumberFormatSymbols_el_CY", "goog.i18n.NumberFormatSymbols_en_BB", "goog.i18n.NumberFormatSymbols_en_BE", "goog.i18n.NumberFormatSymbols_en_BM", "goog.i18n.NumberFormatSymbols_en_BW", "goog.i18n.NumberFormatSymbols_en_BZ", "goog.i18n.NumberFormatSymbols_en_CA", "goog.i18n.NumberFormatSymbols_en_GY", 
"goog.i18n.NumberFormatSymbols_en_HK", "goog.i18n.NumberFormatSymbols_en_JM", "goog.i18n.NumberFormatSymbols_en_MT", "goog.i18n.NumberFormatSymbols_en_MU", "goog.i18n.NumberFormatSymbols_en_NA", "goog.i18n.NumberFormatSymbols_en_NZ", "goog.i18n.NumberFormatSymbols_en_PH", "goog.i18n.NumberFormatSymbols_en_PK", "goog.i18n.NumberFormatSymbols_en_TT", "goog.i18n.NumberFormatSymbols_en_ZW", "goog.i18n.NumberFormatSymbols_eo", "goog.i18n.NumberFormatSymbols_es_AR", "goog.i18n.NumberFormatSymbols_es_BO", 
"goog.i18n.NumberFormatSymbols_es_CL", "goog.i18n.NumberFormatSymbols_es_CO", "goog.i18n.NumberFormatSymbols_es_CR", "goog.i18n.NumberFormatSymbols_es_DO", "goog.i18n.NumberFormatSymbols_es_EC", "goog.i18n.NumberFormatSymbols_es_GQ", "goog.i18n.NumberFormatSymbols_es_GT", "goog.i18n.NumberFormatSymbols_es_HN", "goog.i18n.NumberFormatSymbols_es_MX", "goog.i18n.NumberFormatSymbols_es_NI", "goog.i18n.NumberFormatSymbols_es_PA", "goog.i18n.NumberFormatSymbols_es_PE", "goog.i18n.NumberFormatSymbols_es_PR", 
"goog.i18n.NumberFormatSymbols_es_PY", "goog.i18n.NumberFormatSymbols_es_SV", "goog.i18n.NumberFormatSymbols_es_US", "goog.i18n.NumberFormatSymbols_es_UY", "goog.i18n.NumberFormatSymbols_es_VE", "goog.i18n.NumberFormatSymbols_ewo", "goog.i18n.NumberFormatSymbols_ewo_CM", "goog.i18n.NumberFormatSymbols_fa_AF", "goog.i18n.NumberFormatSymbols_ff", "goog.i18n.NumberFormatSymbols_ff_SN", "goog.i18n.NumberFormatSymbols_fo", "goog.i18n.NumberFormatSymbols_fo_FO", "goog.i18n.NumberFormatSymbols_fr_BE", "goog.i18n.NumberFormatSymbols_fr_BF", 
"goog.i18n.NumberFormatSymbols_fr_BI", "goog.i18n.NumberFormatSymbols_fr_BJ", "goog.i18n.NumberFormatSymbols_fr_CD", "goog.i18n.NumberFormatSymbols_fr_CF", "goog.i18n.NumberFormatSymbols_fr_CG", "goog.i18n.NumberFormatSymbols_fr_CH", "goog.i18n.NumberFormatSymbols_fr_CI", "goog.i18n.NumberFormatSymbols_fr_CM", "goog.i18n.NumberFormatSymbols_fr_DJ", "goog.i18n.NumberFormatSymbols_fr_GA", "goog.i18n.NumberFormatSymbols_fr_GN", "goog.i18n.NumberFormatSymbols_fr_GQ", "goog.i18n.NumberFormatSymbols_fr_KM", 
"goog.i18n.NumberFormatSymbols_fr_LU", "goog.i18n.NumberFormatSymbols_fr_MG", "goog.i18n.NumberFormatSymbols_fr_ML", "goog.i18n.NumberFormatSymbols_fr_NE", "goog.i18n.NumberFormatSymbols_fr_RW", "goog.i18n.NumberFormatSymbols_fr_SN", "goog.i18n.NumberFormatSymbols_fr_TD", "goog.i18n.NumberFormatSymbols_fr_TG", "goog.i18n.NumberFormatSymbols_fur", "goog.i18n.NumberFormatSymbols_fur_IT", "goog.i18n.NumberFormatSymbols_ga", "goog.i18n.NumberFormatSymbols_ga_IE", "goog.i18n.NumberFormatSymbols_gd", "goog.i18n.NumberFormatSymbols_gd_GB", 
"goog.i18n.NumberFormatSymbols_guz", "goog.i18n.NumberFormatSymbols_guz_KE", "goog.i18n.NumberFormatSymbols_gv", "goog.i18n.NumberFormatSymbols_gv_GB", "goog.i18n.NumberFormatSymbols_ha", "goog.i18n.NumberFormatSymbols_ha_Latn", "goog.i18n.NumberFormatSymbols_ha_Latn_GH", "goog.i18n.NumberFormatSymbols_ha_Latn_NE", "goog.i18n.NumberFormatSymbols_ha_Latn_NG", "goog.i18n.NumberFormatSymbols_hy", "goog.i18n.NumberFormatSymbols_hy_AM", "goog.i18n.NumberFormatSymbols_ia", "goog.i18n.NumberFormatSymbols_ig", 
"goog.i18n.NumberFormatSymbols_ig_NG", "goog.i18n.NumberFormatSymbols_ii", "goog.i18n.NumberFormatSymbols_ii_CN", "goog.i18n.NumberFormatSymbols_it_CH", "goog.i18n.NumberFormatSymbols_jmc", "goog.i18n.NumberFormatSymbols_jmc_TZ", "goog.i18n.NumberFormatSymbols_ka", "goog.i18n.NumberFormatSymbols_ka_GE", "goog.i18n.NumberFormatSymbols_kab", "goog.i18n.NumberFormatSymbols_kab_DZ", "goog.i18n.NumberFormatSymbols_kam", "goog.i18n.NumberFormatSymbols_kam_KE", "goog.i18n.NumberFormatSymbols_kde", "goog.i18n.NumberFormatSymbols_kde_TZ", 
"goog.i18n.NumberFormatSymbols_kea", "goog.i18n.NumberFormatSymbols_kea_CV", "goog.i18n.NumberFormatSymbols_khq", "goog.i18n.NumberFormatSymbols_khq_ML", "goog.i18n.NumberFormatSymbols_ki", "goog.i18n.NumberFormatSymbols_ki_KE", "goog.i18n.NumberFormatSymbols_kk", "goog.i18n.NumberFormatSymbols_kk_Cyrl", "goog.i18n.NumberFormatSymbols_kk_Cyrl_KZ", "goog.i18n.NumberFormatSymbols_kl", "goog.i18n.NumberFormatSymbols_kl_GL", "goog.i18n.NumberFormatSymbols_kln", "goog.i18n.NumberFormatSymbols_kln_KE", 
"goog.i18n.NumberFormatSymbols_km", "goog.i18n.NumberFormatSymbols_km_KH", "goog.i18n.NumberFormatSymbols_kok", "goog.i18n.NumberFormatSymbols_kok_IN", "goog.i18n.NumberFormatSymbols_ksb", "goog.i18n.NumberFormatSymbols_ksb_TZ", "goog.i18n.NumberFormatSymbols_ksf", "goog.i18n.NumberFormatSymbols_ksf_CM", "goog.i18n.NumberFormatSymbols_ksh", "goog.i18n.NumberFormatSymbols_ksh_DE", "goog.i18n.NumberFormatSymbols_ku", "goog.i18n.NumberFormatSymbols_kw", "goog.i18n.NumberFormatSymbols_kw_GB", "goog.i18n.NumberFormatSymbols_lag", 
"goog.i18n.NumberFormatSymbols_lag_TZ", "goog.i18n.NumberFormatSymbols_lg", "goog.i18n.NumberFormatSymbols_lg_UG", "goog.i18n.NumberFormatSymbols_ln_CG", "goog.i18n.NumberFormatSymbols_lo", "goog.i18n.NumberFormatSymbols_lo_LA", "goog.i18n.NumberFormatSymbols_lu", "goog.i18n.NumberFormatSymbols_lu_CD", "goog.i18n.NumberFormatSymbols_luo", "goog.i18n.NumberFormatSymbols_luo_KE", "goog.i18n.NumberFormatSymbols_luy", "goog.i18n.NumberFormatSymbols_luy_KE", "goog.i18n.NumberFormatSymbols_mas", "goog.i18n.NumberFormatSymbols_mas_KE", 
"goog.i18n.NumberFormatSymbols_mas_TZ", "goog.i18n.NumberFormatSymbols_mer", "goog.i18n.NumberFormatSymbols_mer_KE", "goog.i18n.NumberFormatSymbols_mfe", "goog.i18n.NumberFormatSymbols_mfe_MU", "goog.i18n.NumberFormatSymbols_mg", "goog.i18n.NumberFormatSymbols_mg_MG", "goog.i18n.NumberFormatSymbols_mgh", "goog.i18n.NumberFormatSymbols_mgh_MZ", "goog.i18n.NumberFormatSymbols_mk", "goog.i18n.NumberFormatSymbols_mk_MK", "goog.i18n.NumberFormatSymbols_ms_BN", "goog.i18n.NumberFormatSymbols_mua", "goog.i18n.NumberFormatSymbols_mua_CM", 
"goog.i18n.NumberFormatSymbols_my", "goog.i18n.NumberFormatSymbols_my_MM", "goog.i18n.NumberFormatSymbols_naq", "goog.i18n.NumberFormatSymbols_naq_NA", "goog.i18n.NumberFormatSymbols_nb", "goog.i18n.NumberFormatSymbols_nb_NO", "goog.i18n.NumberFormatSymbols_nd", "goog.i18n.NumberFormatSymbols_nd_ZW", "goog.i18n.NumberFormatSymbols_ne", "goog.i18n.NumberFormatSymbols_ne_IN", "goog.i18n.NumberFormatSymbols_ne_NP", "goog.i18n.NumberFormatSymbols_nl_AW", "goog.i18n.NumberFormatSymbols_nl_BE", "goog.i18n.NumberFormatSymbols_nl_CW", 
"goog.i18n.NumberFormatSymbols_nl_SX", "goog.i18n.NumberFormatSymbols_nmg", "goog.i18n.NumberFormatSymbols_nmg_CM", "goog.i18n.NumberFormatSymbols_nn", "goog.i18n.NumberFormatSymbols_nn_NO", "goog.i18n.NumberFormatSymbols_nr", "goog.i18n.NumberFormatSymbols_nr_ZA", "goog.i18n.NumberFormatSymbols_nso", "goog.i18n.NumberFormatSymbols_nso_ZA", "goog.i18n.NumberFormatSymbols_nus", "goog.i18n.NumberFormatSymbols_nus_SD", "goog.i18n.NumberFormatSymbols_nyn", "goog.i18n.NumberFormatSymbols_nyn_UG", "goog.i18n.NumberFormatSymbols_om", 
"goog.i18n.NumberFormatSymbols_om_ET", "goog.i18n.NumberFormatSymbols_om_KE", "goog.i18n.NumberFormatSymbols_pa", "goog.i18n.NumberFormatSymbols_pa_Arab", "goog.i18n.NumberFormatSymbols_pa_Arab_PK", "goog.i18n.NumberFormatSymbols_pa_Guru", "goog.i18n.NumberFormatSymbols_pa_Guru_IN", "goog.i18n.NumberFormatSymbols_ps", "goog.i18n.NumberFormatSymbols_ps_AF", "goog.i18n.NumberFormatSymbols_pt_AO", "goog.i18n.NumberFormatSymbols_pt_GW", "goog.i18n.NumberFormatSymbols_pt_MZ", "goog.i18n.NumberFormatSymbols_pt_ST", 
"goog.i18n.NumberFormatSymbols_rm", "goog.i18n.NumberFormatSymbols_rm_CH", "goog.i18n.NumberFormatSymbols_rn", "goog.i18n.NumberFormatSymbols_rn_BI", "goog.i18n.NumberFormatSymbols_ro_MD", "goog.i18n.NumberFormatSymbols_rof", "goog.i18n.NumberFormatSymbols_rof_TZ", "goog.i18n.NumberFormatSymbols_ru_MD", "goog.i18n.NumberFormatSymbols_ru_UA", "goog.i18n.NumberFormatSymbols_rw", "goog.i18n.NumberFormatSymbols_rw_RW", "goog.i18n.NumberFormatSymbols_rwk", "goog.i18n.NumberFormatSymbols_rwk_TZ", "goog.i18n.NumberFormatSymbols_sah", 
"goog.i18n.NumberFormatSymbols_sah_RU", "goog.i18n.NumberFormatSymbols_saq", "goog.i18n.NumberFormatSymbols_saq_KE", "goog.i18n.NumberFormatSymbols_sbp", "goog.i18n.NumberFormatSymbols_sbp_TZ", "goog.i18n.NumberFormatSymbols_se", "goog.i18n.NumberFormatSymbols_se_FI", "goog.i18n.NumberFormatSymbols_se_NO", "goog.i18n.NumberFormatSymbols_seh", "goog.i18n.NumberFormatSymbols_seh_MZ", "goog.i18n.NumberFormatSymbols_ses", "goog.i18n.NumberFormatSymbols_ses_ML", "goog.i18n.NumberFormatSymbols_sg", "goog.i18n.NumberFormatSymbols_sg_CF", 
"goog.i18n.NumberFormatSymbols_shi", "goog.i18n.NumberFormatSymbols_shi_Latn", "goog.i18n.NumberFormatSymbols_shi_Latn_MA", "goog.i18n.NumberFormatSymbols_shi_Tfng", "goog.i18n.NumberFormatSymbols_shi_Tfng_MA", "goog.i18n.NumberFormatSymbols_si", "goog.i18n.NumberFormatSymbols_si_LK", "goog.i18n.NumberFormatSymbols_sn", "goog.i18n.NumberFormatSymbols_sn_ZW", "goog.i18n.NumberFormatSymbols_so", "goog.i18n.NumberFormatSymbols_so_DJ", "goog.i18n.NumberFormatSymbols_so_ET", "goog.i18n.NumberFormatSymbols_so_KE", 
"goog.i18n.NumberFormatSymbols_so_SO", "goog.i18n.NumberFormatSymbols_sr_Cyrl", "goog.i18n.NumberFormatSymbols_sr_Cyrl_BA", "goog.i18n.NumberFormatSymbols_sr_Cyrl_ME", "goog.i18n.NumberFormatSymbols_sr_Latn", "goog.i18n.NumberFormatSymbols_sr_Latn_BA", "goog.i18n.NumberFormatSymbols_sr_Latn_ME", "goog.i18n.NumberFormatSymbols_ss", "goog.i18n.NumberFormatSymbols_ss_SZ", "goog.i18n.NumberFormatSymbols_ss_ZA", "goog.i18n.NumberFormatSymbols_ssy", "goog.i18n.NumberFormatSymbols_ssy_ER", "goog.i18n.NumberFormatSymbols_st", 
"goog.i18n.NumberFormatSymbols_st_LS", "goog.i18n.NumberFormatSymbols_st_ZA", "goog.i18n.NumberFormatSymbols_sv_FI", "goog.i18n.NumberFormatSymbols_sw_KE", "goog.i18n.NumberFormatSymbols_swc", "goog.i18n.NumberFormatSymbols_swc_CD", "goog.i18n.NumberFormatSymbols_ta_LK", "goog.i18n.NumberFormatSymbols_teo", "goog.i18n.NumberFormatSymbols_teo_KE", "goog.i18n.NumberFormatSymbols_teo_UG", "goog.i18n.NumberFormatSymbols_tg", "goog.i18n.NumberFormatSymbols_tg_Cyrl", "goog.i18n.NumberFormatSymbols_tg_Cyrl_TJ", 
"goog.i18n.NumberFormatSymbols_ti", "goog.i18n.NumberFormatSymbols_ti_ER", "goog.i18n.NumberFormatSymbols_ti_ET", "goog.i18n.NumberFormatSymbols_tig", "goog.i18n.NumberFormatSymbols_tig_ER", "goog.i18n.NumberFormatSymbols_tn", "goog.i18n.NumberFormatSymbols_tn_ZA", "goog.i18n.NumberFormatSymbols_to", "goog.i18n.NumberFormatSymbols_to_TO", "goog.i18n.NumberFormatSymbols_ts", "goog.i18n.NumberFormatSymbols_ts_ZA", "goog.i18n.NumberFormatSymbols_twq", "goog.i18n.NumberFormatSymbols_twq_NE", "goog.i18n.NumberFormatSymbols_tzm", 
"goog.i18n.NumberFormatSymbols_tzm_Latn", "goog.i18n.NumberFormatSymbols_tzm_Latn_MA", "goog.i18n.NumberFormatSymbols_ur_IN", "goog.i18n.NumberFormatSymbols_uz", "goog.i18n.NumberFormatSymbols_uz_Arab", "goog.i18n.NumberFormatSymbols_uz_Arab_AF", "goog.i18n.NumberFormatSymbols_uz_Cyrl", "goog.i18n.NumberFormatSymbols_uz_Cyrl_UZ", "goog.i18n.NumberFormatSymbols_uz_Latn", "goog.i18n.NumberFormatSymbols_uz_Latn_UZ", "goog.i18n.NumberFormatSymbols_vai", "goog.i18n.NumberFormatSymbols_vai_Latn", "goog.i18n.NumberFormatSymbols_vai_Latn_LR", 
"goog.i18n.NumberFormatSymbols_vai_Vaii", "goog.i18n.NumberFormatSymbols_vai_Vaii_LR", "goog.i18n.NumberFormatSymbols_ve", "goog.i18n.NumberFormatSymbols_ve_ZA", "goog.i18n.NumberFormatSymbols_vun", "goog.i18n.NumberFormatSymbols_vun_TZ", "goog.i18n.NumberFormatSymbols_wae", "goog.i18n.NumberFormatSymbols_wae_CH", "goog.i18n.NumberFormatSymbols_wal", "goog.i18n.NumberFormatSymbols_wal_ET", "goog.i18n.NumberFormatSymbols_xh", "goog.i18n.NumberFormatSymbols_xh_ZA", "goog.i18n.NumberFormatSymbols_xog", 
"goog.i18n.NumberFormatSymbols_xog_UG", "goog.i18n.NumberFormatSymbols_yav", "goog.i18n.NumberFormatSymbols_yav_CM", "goog.i18n.NumberFormatSymbols_yo", "goog.i18n.NumberFormatSymbols_yo_NG", "goog.i18n.NumberFormatSymbols_zh_Hans_HK", "goog.i18n.NumberFormatSymbols_zh_Hans_MO", "goog.i18n.NumberFormatSymbols_zh_Hans_SG", "goog.i18n.NumberFormatSymbols_zh_Hant", "goog.i18n.NumberFormatSymbols_zh_Hant_HK", "goog.i18n.NumberFormatSymbols_zh_Hant_MO", "goog.i18n.NumberFormatSymbols_zh_Hant_TW"], ["goog.i18n.NumberFormatSymbols"]);
goog.addDependency("/closure/goog/i18n/ordinalrules.js", ["goog.i18n.ordinalRules"], []);
goog.addDependency("/closure/goog/i18n/pluralrules.js", ["goog.i18n.pluralRules"], []);
goog.addDependency("/closure/goog/i18n/timezone.js", ["goog.i18n.TimeZone"], ["goog.array", "goog.date.DateLike", "goog.string"]);
goog.addDependency("/closure/goog/i18n/uchar.js", ["goog.i18n.uChar"], []);
goog.addDependency("/closure/goog/i18n/uchar/localnamefetcher.js", ["goog.i18n.uChar.LocalNameFetcher"], ["goog.debug.Logger", "goog.i18n.uChar", "goog.i18n.uChar.NameFetcher"]);
goog.addDependency("/closure/goog/i18n/uchar/namefetcher.js", ["goog.i18n.uChar.NameFetcher"], []);
goog.addDependency("/closure/goog/i18n/uchar/remotenamefetcher.js", ["goog.i18n.uChar.RemoteNameFetcher"], ["goog.Disposable", "goog.Uri", "goog.debug.Logger", "goog.i18n.uChar", "goog.i18n.uChar.NameFetcher", "goog.net.XhrIo", "goog.structs.Map"]);
goog.addDependency("/closure/goog/iter/iter.js", ["goog.iter", "goog.iter.Iterator", "goog.iter.StopIteration"], ["goog.array", "goog.asserts"]);
goog.addDependency("/closure/goog/json/evaljsonprocessor.js", ["goog.json.EvalJsonProcessor"], ["goog.json", "goog.json.Processor", "goog.json.Serializer"]);
goog.addDependency("/closure/goog/json/json.js", ["goog.json", "goog.json.Serializer"], []);
goog.addDependency("/closure/goog/json/nativejsonprocessor.js", ["goog.json.NativeJsonProcessor"], ["goog.asserts", "goog.json", "goog.json.Processor"]);
goog.addDependency("/closure/goog/json/processor.js", ["goog.json.Processor"], ["goog.string.Parser", "goog.string.Stringifier"]);
goog.addDependency("/closure/goog/labs/net/image.js", ["goog.labs.net.image"], ["goog.events.EventHandler", "goog.events.EventType", "goog.labs.result.SimpleResult", "goog.net.EventType", "goog.userAgent"]);
goog.addDependency("/closure/goog/labs/net/image_test.js", ["goog.labs.net.imageTest"], ["goog.events", "goog.labs.net.image", "goog.labs.result", "goog.labs.result.Result", "goog.net.EventType", "goog.string", "goog.testing.AsyncTestCase", "goog.testing.jsunit", "goog.testing.recordFunction"]);
goog.addDependency("/closure/goog/labs/net/xhr.js", ["goog.labs.net.xhr", "goog.labs.net.xhr.Error", "goog.labs.net.xhr.HttpError", "goog.labs.net.xhr.TimeoutError"], ["goog.debug.Error", "goog.json", "goog.labs.result", "goog.net.HttpStatus", "goog.net.XmlHttp", "goog.string", "goog.uri.utils"]);
goog.addDependency("/closure/goog/labs/object/object.js", ["goog.labs.object"], []);
goog.addDependency("/closure/goog/labs/observe/notice.js", ["goog.labs.observe.Notice"], []);
goog.addDependency("/closure/goog/labs/observe/observable.js", ["goog.labs.observe.Observable"], ["goog.disposable.IDisposable"]);
goog.addDependency("/closure/goog/labs/observe/observableset.js", ["goog.labs.observe.ObservableSet"], ["goog.array", "goog.labs.observe.Observer"]);
goog.addDependency("/closure/goog/labs/observe/observationset.js", ["goog.labs.observe.ObservationSet"], ["goog.array", "goog.labs.observe.Observer"]);
goog.addDependency("/closure/goog/labs/observe/observer.js", ["goog.labs.observe.Observer"], []);
goog.addDependency("/closure/goog/labs/observe/simpleobservable.js", ["goog.labs.observe.SimpleObservable"], ["goog.Disposable", "goog.array", "goog.asserts", "goog.labs.observe.Notice", "goog.labs.observe.Observable", "goog.labs.observe.Observer", "goog.object"]);
goog.addDependency("/closure/goog/labs/result/deferredadaptor.js", ["goog.labs.result.DeferredAdaptor"], ["goog.async.Deferred", "goog.labs.result", "goog.labs.result.Result"]);
goog.addDependency("/closure/goog/labs/result/result_interface.js", ["goog.labs.result.Result"], ["goog.debug.Error"]);
goog.addDependency("/closure/goog/labs/result/resultutil.js", ["goog.labs.result"], ["goog.array", "goog.labs.result.Result", "goog.labs.result.SimpleResult"]);
goog.addDependency("/closure/goog/labs/result/simpleresult.js", ["goog.labs.result.SimpleResult", "goog.labs.result.SimpleResult.StateError"], ["goog.debug.Error", "goog.labs.result.Result"]);
goog.addDependency("/closure/goog/labs/structs/map.js", ["goog.labs.structs.Map"], ["goog.array", "goog.asserts", "goog.labs.object", "goog.object"]);
goog.addDependency("/closure/goog/labs/structs/map_perf.js", ["goog.labs.structs.mapPerf"], ["goog.dom", "goog.labs.structs.Map", "goog.structs.Map", "goog.testing.PerformanceTable", "goog.testing.jsunit"]);
goog.addDependency("/closure/goog/labs/structs/multimap.js", ["goog.labs.structs.Multimap"], ["goog.array", "goog.labs.object", "goog.labs.structs.Map"]);
goog.addDependency("/closure/goog/labs/testing/assertthat.js", ["goog.labs.testing.MatcherError", "goog.labs.testing.assertThat"], ["goog.asserts", "goog.debug.Error", "goog.labs.testing.Matcher"]);
goog.addDependency("/closure/goog/labs/testing/dictionarymatcher.js", ["goog.labs.testing.HasEntriesMatcher", "goog.labs.testing.HasEntryMatcher", "goog.labs.testing.HasKeyMatcher", "goog.labs.testing.HasValueMatcher"], ["goog.array", "goog.asserts", "goog.labs.testing.Matcher", "goog.string"]);
goog.addDependency("/closure/goog/labs/testing/logicmatcher.js", ["goog.labs.testing.AllOfMatcher", "goog.labs.testing.AnyOfMatcher", "goog.labs.testing.IsNotMatcher"], ["goog.array", "goog.labs.testing.Matcher"]);
goog.addDependency("/closure/goog/labs/testing/matcher.js", ["goog.labs.testing.Matcher"], []);
goog.addDependency("/closure/goog/labs/testing/numbermatcher.js", ["goog.labs.testing.CloseToMatcher", "goog.labs.testing.EqualToMatcher", "goog.labs.testing.GreaterThanEqualToMatcher", "goog.labs.testing.GreaterThanMatcher", "goog.labs.testing.LessThanEqualToMatcher", "goog.labs.testing.LessThanMatcher"], ["goog.asserts", "goog.labs.testing.Matcher"]);
goog.addDependency("/closure/goog/labs/testing/objectmatcher.js", ["goog.labs.testing.HasPropertyMatcher", "goog.labs.testing.InstanceOfMatcher", "goog.labs.testing.IsNullMatcher", "goog.labs.testing.IsNullOrUndefinedMatcher", "goog.labs.testing.IsUndefinedMatcher", "goog.labs.testing.ObjectEqualsMatcher"], ["goog.labs.testing.Matcher", "goog.string"]);
goog.addDependency("/closure/goog/labs/testing/stringmatcher.js", ["goog.labs.testing.ContainsStringMatcher", "goog.labs.testing.EndsWithMatcher", "goog.labs.testing.EqualToIgnoringCaseMatcher", "goog.labs.testing.EqualToIgnoringWhitespaceMatcher", "goog.labs.testing.EqualsMatcher", "goog.labs.testing.StartsWithMatcher", "goog.labs.testing.StringContainsInOrderMatcher"], ["goog.asserts", "goog.labs.testing.Matcher", "goog.string"]);
goog.addDependency("/closure/goog/locale/countries.js", ["goog.locale.countries"], []);
goog.addDependency("/closure/goog/locale/defaultlocalenameconstants.js", ["goog.locale.defaultLocaleNameConstants"], []);
goog.addDependency("/closure/goog/locale/genericfontnames.js", ["goog.locale.genericFontNames"], []);
goog.addDependency("/closure/goog/locale/genericfontnamesdata.js", ["goog.locale.genericFontNamesData"], ["goog.locale"]);
goog.addDependency("/closure/goog/locale/locale.js", ["goog.locale"], ["goog.locale.nativeNameConstants"]);
goog.addDependency("/closure/goog/locale/nativenameconstants.js", ["goog.locale.nativeNameConstants"], []);
goog.addDependency("/closure/goog/locale/scriptToLanguages.js", ["goog.locale.scriptToLanguages"], ["goog.locale"]);
goog.addDependency("/closure/goog/locale/timezonedetection.js", ["goog.locale.timeZoneDetection"], ["goog.locale", "goog.locale.TimeZoneFingerprint"]);
goog.addDependency("/closure/goog/locale/timezonefingerprint.js", ["goog.locale.TimeZoneFingerprint"], ["goog.locale"]);
goog.addDependency("/closure/goog/locale/timezonelist.js", ["goog.locale.TimeZoneList"], ["goog.locale"]);
goog.addDependency("/closure/goog/math/bezier.js", ["goog.math.Bezier"], ["goog.math", "goog.math.Coordinate"]);
goog.addDependency("/closure/goog/math/box.js", ["goog.math.Box"], ["goog.math.Coordinate"]);
goog.addDependency("/closure/goog/math/coordinate.js", ["goog.math.Coordinate"], ["goog.math"]);
goog.addDependency("/closure/goog/math/coordinate3.js", ["goog.math.Coordinate3"], []);
goog.addDependency("/closure/goog/math/exponentialbackoff.js", ["goog.math.ExponentialBackoff"], ["goog.asserts"]);
goog.addDependency("/closure/goog/math/integer.js", ["goog.math.Integer"], []);
goog.addDependency("/closure/goog/math/interpolator/interpolator1.js", ["goog.math.interpolator.Interpolator1"], []);
goog.addDependency("/closure/goog/math/interpolator/linear1.js", ["goog.math.interpolator.Linear1"], ["goog.array", "goog.math", "goog.math.interpolator.Interpolator1"]);
goog.addDependency("/closure/goog/math/interpolator/pchip1.js", ["goog.math.interpolator.Pchip1"], ["goog.math", "goog.math.interpolator.Spline1"]);
goog.addDependency("/closure/goog/math/interpolator/spline1.js", ["goog.math.interpolator.Spline1"], ["goog.array", "goog.math", "goog.math.interpolator.Interpolator1", "goog.math.tdma"]);
goog.addDependency("/closure/goog/math/line.js", ["goog.math.Line"], ["goog.math", "goog.math.Coordinate"]);
goog.addDependency("/closure/goog/math/long.js", ["goog.math.Long"], []);
goog.addDependency("/closure/goog/math/math.js", ["goog.math"], ["goog.array"]);
goog.addDependency("/closure/goog/math/matrix.js", ["goog.math.Matrix"], ["goog.array", "goog.math", "goog.math.Size"]);
goog.addDependency("/closure/goog/math/range.js", ["goog.math.Range"], []);
goog.addDependency("/closure/goog/math/rangeset.js", ["goog.math.RangeSet"], ["goog.array", "goog.iter.Iterator", "goog.iter.StopIteration", "goog.math.Range"]);
goog.addDependency("/closure/goog/math/rect.js", ["goog.math.Rect"], ["goog.math.Box", "goog.math.Size"]);
goog.addDependency("/closure/goog/math/size.js", ["goog.math.Size"], []);
goog.addDependency("/closure/goog/math/tdma.js", ["goog.math.tdma"], []);
goog.addDependency("/closure/goog/math/vec2.js", ["goog.math.Vec2"], ["goog.math", "goog.math.Coordinate"]);
goog.addDependency("/closure/goog/math/vec3.js", ["goog.math.Vec3"], ["goog.math", "goog.math.Coordinate3"]);
goog.addDependency("/closure/goog/memoize/memoize.js", ["goog.memoize"], []);
goog.addDependency("/closure/goog/messaging/abstractchannel.js", ["goog.messaging.AbstractChannel"], ["goog.Disposable", "goog.debug", "goog.debug.Logger", "goog.json", "goog.messaging.MessageChannel"]);
goog.addDependency("/closure/goog/messaging/bufferedchannel.js", ["goog.messaging.BufferedChannel"], ["goog.Timer", "goog.Uri", "goog.debug.Error", "goog.debug.Logger", "goog.events", "goog.messaging.MessageChannel", "goog.messaging.MultiChannel"]);
goog.addDependency("/closure/goog/messaging/deferredchannel.js", ["goog.messaging.DeferredChannel"], ["goog.Disposable", "goog.async.Deferred", "goog.messaging.MessageChannel"]);
goog.addDependency("/closure/goog/messaging/loggerclient.js", ["goog.messaging.LoggerClient"], ["goog.Disposable", "goog.debug", "goog.debug.LogManager", "goog.debug.Logger"]);
goog.addDependency("/closure/goog/messaging/loggerserver.js", ["goog.messaging.LoggerServer"], ["goog.Disposable", "goog.debug.Logger"]);
goog.addDependency("/closure/goog/messaging/messagechannel.js", ["goog.messaging.MessageChannel"], []);
goog.addDependency("/closure/goog/messaging/messaging.js", ["goog.messaging"], ["goog.messaging.MessageChannel"]);
goog.addDependency("/closure/goog/messaging/multichannel.js", ["goog.messaging.MultiChannel", "goog.messaging.MultiChannel.VirtualChannel"], ["goog.Disposable", "goog.debug.Logger", "goog.events.EventHandler", "goog.messaging.MessageChannel", "goog.object"]);
goog.addDependency("/closure/goog/messaging/portcaller.js", ["goog.messaging.PortCaller"], ["goog.Disposable", "goog.async.Deferred", "goog.messaging.DeferredChannel", "goog.messaging.PortChannel", "goog.messaging.PortNetwork", "goog.object"]);
goog.addDependency("/closure/goog/messaging/portchannel.js", ["goog.messaging.PortChannel"], ["goog.Timer", "goog.array", "goog.async.Deferred", "goog.debug", "goog.debug.Logger", "goog.dom", "goog.dom.DomHelper", "goog.events", "goog.events.EventType", "goog.json", "goog.messaging.AbstractChannel", "goog.messaging.DeferredChannel", "goog.object", "goog.string"]);
goog.addDependency("/closure/goog/messaging/portnetwork.js", ["goog.messaging.PortNetwork"], []);
goog.addDependency("/closure/goog/messaging/portoperator.js", ["goog.messaging.PortOperator"], ["goog.Disposable", "goog.asserts", "goog.debug.Logger", "goog.messaging.PortChannel", "goog.messaging.PortNetwork", "goog.object"]);
goog.addDependency("/closure/goog/messaging/respondingchannel.js", ["goog.messaging.RespondingChannel"], ["goog.Disposable", "goog.debug.Logger", "goog.messaging.MessageChannel", "goog.messaging.MultiChannel", "goog.messaging.MultiChannel.VirtualChannel"]);
goog.addDependency("/closure/goog/messaging/testdata/portchannel_worker.js", ["goog.messaging.testdata.portchannel_worker"], ["goog.messaging.PortChannel"]);
goog.addDependency("/closure/goog/messaging/testdata/portnetwork_worker1.js", ["goog.messaging.testdata.portnetwork_worker1"], ["goog.messaging.PortCaller", "goog.messaging.PortChannel"]);
goog.addDependency("/closure/goog/messaging/testdata/portnetwork_worker2.js", ["goog.messaging.testdata.portnetwork_worker2"], ["goog.messaging.PortCaller", "goog.messaging.PortChannel"]);
goog.addDependency("/closure/goog/module/abstractmoduleloader.js", ["goog.module.AbstractModuleLoader"], []);
goog.addDependency("/closure/goog/module/basemodule.js", ["goog.module.BaseModule"], ["goog.Disposable"]);
goog.addDependency("/closure/goog/module/loader.js", ["goog.module.Loader"], ["goog.Timer", "goog.array", "goog.dom", "goog.object"]);
goog.addDependency("/closure/goog/module/module.js", ["goog.module"], ["goog.array", "goog.module.Loader"]);
goog.addDependency("/closure/goog/module/moduleinfo.js", ["goog.module.ModuleInfo"], ["goog.Disposable", "goog.functions", "goog.module.BaseModule", "goog.module.ModuleLoadCallback"]);
goog.addDependency("/closure/goog/module/moduleloadcallback.js", ["goog.module.ModuleLoadCallback"], ["goog.debug.entryPointRegistry", "goog.debug.errorHandlerWeakDep"]);
goog.addDependency("/closure/goog/module/moduleloader.js", ["goog.module.ModuleLoader"], ["goog.Timer", "goog.array", "goog.debug.Logger", "goog.events", "goog.events.Event", "goog.events.EventHandler", "goog.events.EventTarget", "goog.module.AbstractModuleLoader", "goog.net.BulkLoader", "goog.net.EventType", "goog.net.jsloader"]);
goog.addDependency("/closure/goog/module/modulemanager.js", ["goog.module.ModuleManager", "goog.module.ModuleManager.CallbackType", "goog.module.ModuleManager.FailureType"], ["goog.Disposable", "goog.array", "goog.asserts", "goog.async.Deferred", "goog.debug.Logger", "goog.debug.Trace", "goog.module.ModuleInfo", "goog.module.ModuleLoadCallback", "goog.object"]);
goog.addDependency("/closure/goog/module/testdata/modA_1.js", ["goog.module.testdata.modA_1"], []);
goog.addDependency("/closure/goog/module/testdata/modA_2.js", ["goog.module.testdata.modA_2"], ["goog.module.ModuleManager"]);
goog.addDependency("/closure/goog/module/testdata/modB_1.js", ["goog.module.testdata.modB_1"], ["goog.module.ModuleManager"]);
goog.addDependency("/closure/goog/net/browserchannel.js", ["goog.net.BrowserChannel", "goog.net.BrowserChannel.Error", "goog.net.BrowserChannel.Event", "goog.net.BrowserChannel.Handler", "goog.net.BrowserChannel.LogSaver", "goog.net.BrowserChannel.QueuedMap", "goog.net.BrowserChannel.ServerReachability", "goog.net.BrowserChannel.ServerReachabilityEvent", "goog.net.BrowserChannel.Stat", "goog.net.BrowserChannel.StatEvent", "goog.net.BrowserChannel.State", "goog.net.BrowserChannel.TimingEvent"], ["goog.Uri", 
"goog.array", "goog.asserts", "goog.debug.Logger", "goog.debug.TextFormatter", "goog.events.Event", "goog.events.EventTarget", "goog.json", "goog.json.EvalJsonProcessor", "goog.net.BrowserTestChannel", "goog.net.ChannelDebug", "goog.net.ChannelRequest", "goog.net.ChannelRequest.Error", "goog.net.XhrIo", "goog.net.tmpnetwork", "goog.string", "goog.structs", "goog.structs.CircularBuffer", "goog.userAgent"]);
goog.addDependency("/closure/goog/net/browsertestchannel.js", ["goog.net.BrowserTestChannel"], ["goog.json.EvalJsonProcessor", "goog.net.ChannelRequest", "goog.net.ChannelRequest.Error", "goog.net.tmpnetwork", "goog.string.Parser", "goog.userAgent"]);
goog.addDependency("/closure/goog/net/bulkloader.js", ["goog.net.BulkLoader"], ["goog.debug.Logger", "goog.events.Event", "goog.events.EventHandler", "goog.events.EventTarget", "goog.net.BulkLoaderHelper", "goog.net.EventType", "goog.net.XhrIo"]);
goog.addDependency("/closure/goog/net/bulkloaderhelper.js", ["goog.net.BulkLoaderHelper"], ["goog.Disposable", "goog.debug.Logger"]);
goog.addDependency("/closure/goog/net/channeldebug.js", ["goog.net.ChannelDebug"], ["goog.debug.Logger", "goog.json"]);
goog.addDependency("/closure/goog/net/channelrequest.js", ["goog.net.ChannelRequest", "goog.net.ChannelRequest.Error"], ["goog.Timer", "goog.events", "goog.events.EventHandler", "goog.net.EventType", "goog.net.XmlHttp.ReadyState", "goog.object", "goog.userAgent"]);
goog.addDependency("/closure/goog/net/cookies.js", ["goog.net.Cookies", "goog.net.cookies"], ["goog.userAgent"]);
goog.addDependency("/closure/goog/net/crossdomainrpc.js", ["goog.net.CrossDomainRpc"], ["goog.Uri.QueryData", "goog.debug.Logger", "goog.dom", "goog.events", "goog.events.EventTarget", "goog.events.EventType", "goog.json", "goog.net.EventType", "goog.net.HttpStatus", "goog.userAgent"]);
goog.addDependency("/closure/goog/net/errorcode.js", ["goog.net.ErrorCode"], []);
goog.addDependency("/closure/goog/net/eventtype.js", ["goog.net.EventType"], []);
goog.addDependency("/closure/goog/net/filedownloader.js", ["goog.net.FileDownloader", "goog.net.FileDownloader.Error"], ["goog.Disposable", "goog.asserts", "goog.async.Deferred", "goog.crypt.hash32", "goog.debug.Error", "goog.events.EventHandler", "goog.fs", "goog.fs.DirectoryEntry.Behavior", "goog.fs.Error.ErrorCode", "goog.fs.FileSaver.EventType", "goog.net.EventType", "goog.net.XhrIo.ResponseType", "goog.net.XhrIoPool"]);
goog.addDependency("/closure/goog/net/httpstatus.js", ["goog.net.HttpStatus"], []);
goog.addDependency("/closure/goog/net/iframeio.js", ["goog.net.IframeIo", "goog.net.IframeIo.IncrementalDataEvent"], ["goog.Timer", "goog.Uri", "goog.debug", "goog.debug.Logger", "goog.dom", "goog.events", "goog.events.EventTarget", "goog.events.EventType", "goog.json", "goog.net.ErrorCode", "goog.net.EventType", "goog.reflect", "goog.string", "goog.structs", "goog.userAgent"]);
goog.addDependency("/closure/goog/net/iframeloadmonitor.js", ["goog.net.IframeLoadMonitor"], ["goog.dom", "goog.events", "goog.events.EventTarget", "goog.events.EventType", "goog.userAgent"]);
goog.addDependency("/closure/goog/net/imageloader.js", ["goog.net.ImageLoader"], ["goog.array", "goog.dom", "goog.events.EventHandler", "goog.events.EventTarget", "goog.events.EventType", "goog.net.EventType", "goog.object", "goog.userAgent"]);
goog.addDependency("/closure/goog/net/ipaddress.js", ["goog.net.IpAddress", "goog.net.Ipv4Address", "goog.net.Ipv6Address"], ["goog.array", "goog.math.Integer", "goog.object", "goog.string"]);
goog.addDependency("/closure/goog/net/jsloader.js", ["goog.net.jsloader", "goog.net.jsloader.Error"], ["goog.array", "goog.async.Deferred", "goog.debug.Error", "goog.dom", "goog.userAgent"]);
goog.addDependency("/closure/goog/net/jsonp.js", ["goog.net.Jsonp"], ["goog.Uri", "goog.dom", "goog.net.jsloader"]);
goog.addDependency("/closure/goog/net/mockiframeio.js", ["goog.net.MockIFrameIo"], ["goog.events.EventTarget", "goog.net.ErrorCode", "goog.net.IframeIo", "goog.net.IframeIo.IncrementalDataEvent"]);
goog.addDependency("/closure/goog/net/mockxhrlite.js", ["goog.net.MockXhrLite"], ["goog.testing.net.XhrIo"]);
goog.addDependency("/closure/goog/net/multiiframeloadmonitor.js", ["goog.net.MultiIframeLoadMonitor"], ["goog.net.IframeLoadMonitor"]);
goog.addDependency("/closure/goog/net/networktester.js", ["goog.net.NetworkTester"], ["goog.Timer", "goog.Uri", "goog.debug.Logger"]);
goog.addDependency("/closure/goog/net/testdata/jsloader_test1.js", ["goog.net.testdata.jsloader_test1"], []);
goog.addDependency("/closure/goog/net/testdata/jsloader_test2.js", ["goog.net.testdata.jsloader_test2"], []);
goog.addDependency("/closure/goog/net/testdata/jsloader_test3.js", ["goog.net.testdata.jsloader_test3"], []);
goog.addDependency("/closure/goog/net/testdata/jsloader_test4.js", ["goog.net.testdata.jsloader_test4"], []);
goog.addDependency("/closure/goog/net/tmpnetwork.js", ["goog.net.tmpnetwork"], ["goog.Uri", "goog.net.ChannelDebug"]);
goog.addDependency("/closure/goog/net/websocket.js", ["goog.net.WebSocket", "goog.net.WebSocket.ErrorEvent", "goog.net.WebSocket.EventType", "goog.net.WebSocket.MessageEvent"], ["goog.Timer", "goog.asserts", "goog.debug.Logger", "goog.debug.entryPointRegistry", "goog.events", "goog.events.Event", "goog.events.EventTarget"]);
goog.addDependency("/closure/goog/net/wrapperxmlhttpfactory.js", ["goog.net.WrapperXmlHttpFactory"], ["goog.net.XmlHttpFactory"]);
goog.addDependency("/closure/goog/net/xhrio.js", ["goog.net.XhrIo", "goog.net.XhrIo.ResponseType"], ["goog.Timer", "goog.debug.Logger", "goog.debug.entryPointRegistry", "goog.debug.errorHandlerWeakDep", "goog.events.EventTarget", "goog.json", "goog.net.ErrorCode", "goog.net.EventType", "goog.net.HttpStatus", "goog.net.XmlHttp", "goog.object", "goog.structs", "goog.structs.Map", "goog.uri.utils"]);
goog.addDependency("/closure/goog/net/xhriopool.js", ["goog.net.XhrIoPool"], ["goog.net.XhrIo", "goog.structs", "goog.structs.PriorityPool"]);
goog.addDependency("/closure/goog/net/xhrlite.js", ["goog.net.XhrLite"], ["goog.net.XhrIo"]);
goog.addDependency("/closure/goog/net/xhrlitepool.js", ["goog.net.XhrLitePool"], ["goog.net.XhrIoPool"]);
goog.addDependency("/closure/goog/net/xhrmanager.js", ["goog.net.XhrManager", "goog.net.XhrManager.Event", "goog.net.XhrManager.Request"], ["goog.Disposable", "goog.events", "goog.events.Event", "goog.events.EventHandler", "goog.events.EventTarget", "goog.net.EventType", "goog.net.XhrIo", "goog.net.XhrIoPool", "goog.structs.Map"]);
goog.addDependency("/closure/goog/net/xmlhttp.js", ["goog.net.DefaultXmlHttpFactory", "goog.net.XmlHttp", "goog.net.XmlHttp.OptionType", "goog.net.XmlHttp.ReadyState"], ["goog.net.WrapperXmlHttpFactory", "goog.net.XmlHttpFactory"]);
goog.addDependency("/closure/goog/net/xmlhttpfactory.js", ["goog.net.XmlHttpFactory"], []);
goog.addDependency("/closure/goog/net/xpc/crosspagechannel.js", ["goog.net.xpc.CrossPageChannel"], ["goog.Disposable", "goog.Uri", "goog.async.Deferred", "goog.async.Delay", "goog.dom", "goog.events", "goog.events.EventHandler", "goog.json", "goog.messaging.AbstractChannel", "goog.net.xpc", "goog.net.xpc.CrossPageChannelRole", "goog.net.xpc.FrameElementMethodTransport", "goog.net.xpc.IframePollingTransport", "goog.net.xpc.IframeRelayTransport", "goog.net.xpc.NativeMessagingTransport", "goog.net.xpc.NixTransport", 
"goog.net.xpc.Transport", "goog.userAgent"]);
goog.addDependency("/closure/goog/net/xpc/crosspagechannelrole.js", ["goog.net.xpc.CrossPageChannelRole"], []);
goog.addDependency("/closure/goog/net/xpc/frameelementmethodtransport.js", ["goog.net.xpc.FrameElementMethodTransport"], ["goog.net.xpc", "goog.net.xpc.CrossPageChannelRole", "goog.net.xpc.Transport"]);
goog.addDependency("/closure/goog/net/xpc/iframepollingtransport.js", ["goog.net.xpc.IframePollingTransport", "goog.net.xpc.IframePollingTransport.Receiver", "goog.net.xpc.IframePollingTransport.Sender"], ["goog.array", "goog.dom", "goog.net.xpc", "goog.net.xpc.CrossPageChannelRole", "goog.net.xpc.Transport", "goog.userAgent"]);
goog.addDependency("/closure/goog/net/xpc/iframerelaytransport.js", ["goog.net.xpc.IframeRelayTransport"], ["goog.dom", "goog.events", "goog.net.xpc", "goog.net.xpc.Transport", "goog.userAgent"]);
goog.addDependency("/closure/goog/net/xpc/nativemessagingtransport.js", ["goog.net.xpc.NativeMessagingTransport"], ["goog.Timer", "goog.asserts", "goog.async.Deferred", "goog.events", "goog.events.EventHandler", "goog.net.xpc", "goog.net.xpc.CrossPageChannelRole", "goog.net.xpc.Transport"]);
goog.addDependency("/closure/goog/net/xpc/nixtransport.js", ["goog.net.xpc.NixTransport"], ["goog.net.xpc", "goog.net.xpc.CrossPageChannelRole", "goog.net.xpc.Transport", "goog.reflect"]);
goog.addDependency("/closure/goog/net/xpc/relay.js", ["goog.net.xpc.relay"], []);
goog.addDependency("/closure/goog/net/xpc/transport.js", ["goog.net.xpc.Transport"], ["goog.Disposable", "goog.dom", "goog.net.xpc"]);
goog.addDependency("/closure/goog/net/xpc/xpc.js", ["goog.net.xpc", "goog.net.xpc.CfgFields", "goog.net.xpc.ChannelStates", "goog.net.xpc.TransportNames", "goog.net.xpc.TransportTypes", "goog.net.xpc.UriCfgFields"], ["goog.debug.Logger"]);
goog.addDependency("/closure/goog/object/object.js", ["goog.object"], []);
goog.addDependency("/closure/goog/positioning/absoluteposition.js", ["goog.positioning.AbsolutePosition"], ["goog.math.Box", "goog.math.Coordinate", "goog.math.Size", "goog.positioning", "goog.positioning.AbstractPosition"]);
goog.addDependency("/closure/goog/positioning/abstractposition.js", ["goog.positioning.AbstractPosition"], ["goog.math.Box", "goog.math.Size", "goog.positioning.Corner"]);
goog.addDependency("/closure/goog/positioning/anchoredposition.js", ["goog.positioning.AnchoredPosition"], ["goog.math.Box", "goog.positioning", "goog.positioning.AbstractPosition"]);
goog.addDependency("/closure/goog/positioning/anchoredviewportposition.js", ["goog.positioning.AnchoredViewportPosition"], ["goog.math.Box", "goog.positioning", "goog.positioning.AnchoredPosition", "goog.positioning.Corner", "goog.positioning.Overflow", "goog.positioning.OverflowStatus"]);
goog.addDependency("/closure/goog/positioning/clientposition.js", ["goog.positioning.ClientPosition"], ["goog.asserts", "goog.math.Box", "goog.math.Coordinate", "goog.math.Size", "goog.positioning", "goog.positioning.AbstractPosition", "goog.style"]);
goog.addDependency("/closure/goog/positioning/clientposition_test.js", ["goog.positioning.clientPositionTest"], ["goog.dom", "goog.positioning.ClientPosition", "goog.style", "goog.testing.jsunit"]);
goog.addDependency("/closure/goog/positioning/menuanchoredposition.js", ["goog.positioning.MenuAnchoredPosition"], ["goog.math.Box", "goog.math.Size", "goog.positioning", "goog.positioning.AnchoredViewportPosition", "goog.positioning.Corner", "goog.positioning.Overflow"]);
goog.addDependency("/closure/goog/positioning/positioning.js", ["goog.positioning", "goog.positioning.Corner", "goog.positioning.CornerBit", "goog.positioning.Overflow", "goog.positioning.OverflowStatus"], ["goog.asserts", "goog.dom", "goog.dom.TagName", "goog.math.Box", "goog.math.Coordinate", "goog.math.Size", "goog.style", "goog.style.bidi"]);
goog.addDependency("/closure/goog/positioning/viewportclientposition.js", ["goog.positioning.ViewportClientPosition"], ["goog.math.Box", "goog.math.Coordinate", "goog.math.Size", "goog.positioning.ClientPosition"]);
goog.addDependency("/closure/goog/positioning/viewportposition.js", ["goog.positioning.ViewportPosition"], ["goog.math.Box", "goog.math.Coordinate", "goog.math.Size", "goog.positioning.AbstractPosition"]);
goog.addDependency("/closure/goog/proto/proto.js", ["goog.proto"], ["goog.proto.Serializer"]);
goog.addDependency("/closure/goog/proto/serializer.js", ["goog.proto.Serializer"], ["goog.json.Serializer", "goog.string"]);
goog.addDependency("/closure/goog/proto2/descriptor.js", ["goog.proto2.Descriptor", "goog.proto2.Metadata"], ["goog.array", "goog.object", "goog.proto2.Util"]);
goog.addDependency("/closure/goog/proto2/fielddescriptor.js", ["goog.proto2.FieldDescriptor"], ["goog.proto2.Util", "goog.string"]);
goog.addDependency("/closure/goog/proto2/lazydeserializer.js", ["goog.proto2.LazyDeserializer"], ["goog.proto2.Serializer", "goog.proto2.Util"]);
goog.addDependency("/closure/goog/proto2/message.js", ["goog.proto2.Message"], ["goog.proto2.Descriptor", "goog.proto2.FieldDescriptor", "goog.proto2.Util", "goog.string"]);
goog.addDependency("/closure/goog/proto2/objectserializer.js", ["goog.proto2.ObjectSerializer"], ["goog.proto2.Serializer", "goog.proto2.Util", "goog.string"]);
goog.addDependency("/closure/goog/proto2/package_test.pb.js", ["someprotopackage.TestPackageTypes"], ["goog.proto2.Message", "proto2.TestAllTypes"]);
goog.addDependency("/closure/goog/proto2/pbliteserializer.js", ["goog.proto2.PbLiteSerializer"], ["goog.proto2.LazyDeserializer", "goog.proto2.Util"]);
goog.addDependency("/closure/goog/proto2/serializer.js", ["goog.proto2.Serializer"], ["goog.proto2.Descriptor", "goog.proto2.FieldDescriptor", "goog.proto2.Message", "goog.proto2.Util"]);
goog.addDependency("/closure/goog/proto2/test.pb.js", ["proto2.TestAllTypes", "proto2.TestAllTypes.NestedMessage", "proto2.TestAllTypes.OptionalGroup", "proto2.TestAllTypes.RepeatedGroup", "proto2.TestAllTypes.NestedEnum"], ["goog.proto2.Message"]);
goog.addDependency("/closure/goog/proto2/textformatserializer.js", ["goog.proto2.TextFormatSerializer", "goog.proto2.TextFormatSerializer.Parser"], ["goog.array", "goog.asserts", "goog.json", "goog.proto2.Serializer", "goog.proto2.Util", "goog.string"]);
goog.addDependency("/closure/goog/proto2/textformatserializer_test.js", ["goog.proto2.TextFormatSerializerTest"], ["goog.proto2.TextFormatSerializer", "goog.testing.jsunit", "goog.testing.recordFunction", "proto2.TestAllTypes"]);
goog.addDependency("/closure/goog/proto2/util.js", ["goog.proto2.Util"], ["goog.asserts"]);
goog.addDependency("/closure/goog/pubsub/pubsub.js", ["goog.pubsub.PubSub"], ["goog.Disposable", "goog.array"]);
goog.addDependency("/closure/goog/reflect/reflect.js", ["goog.reflect"], []);
goog.addDependency("/closure/goog/soy/renderer.js", ["goog.soy.InjectedDataSupplier", "goog.soy.Renderer"], ["goog.dom", "goog.soy"]);
goog.addDependency("/closure/goog/soy/soy.js", ["goog.soy"], ["goog.dom", "goog.dom.NodeType", "goog.dom.TagName"]);
goog.addDependency("/closure/goog/soy/soy_test.js", ["goog.soy.testHelper"], ["goog.dom", "goog.string", "goog.userAgent"]);
goog.addDependency("/closure/goog/spell/spellcheck.js", ["goog.spell.SpellCheck", "goog.spell.SpellCheck.WordChangedEvent"], ["goog.Timer", "goog.events.EventTarget", "goog.structs.Set"]);
goog.addDependency("/closure/goog/stats/basicstat.js", ["goog.stats.BasicStat"], ["goog.array", "goog.debug.Logger", "goog.iter", "goog.object", "goog.string.format", "goog.structs.CircularBuffer"]);
goog.addDependency("/closure/goog/storage/collectablestorage.js", ["goog.storage.CollectableStorage"], ["goog.array", "goog.asserts", "goog.iter", "goog.storage.ErrorCode", "goog.storage.ExpiringStorage", "goog.storage.RichStorage.Wrapper", "goog.storage.mechanism.IterableMechanism"]);
goog.addDependency("/closure/goog/storage/encryptedstorage.js", ["goog.storage.EncryptedStorage"], ["goog.crypt", "goog.crypt.Arc4", "goog.crypt.Sha1", "goog.crypt.base64", "goog.json", "goog.json.Serializer", "goog.storage.CollectableStorage", "goog.storage.ErrorCode", "goog.storage.RichStorage", "goog.storage.RichStorage.Wrapper", "goog.storage.mechanism.IterableMechanism"]);
goog.addDependency("/closure/goog/storage/errorcode.js", ["goog.storage.ErrorCode"], []);
goog.addDependency("/closure/goog/storage/expiringstorage.js", ["goog.storage.ExpiringStorage"], ["goog.storage.RichStorage", "goog.storage.RichStorage.Wrapper", "goog.storage.mechanism.Mechanism"]);
goog.addDependency("/closure/goog/storage/mechanism/errorcode.js", ["goog.storage.mechanism.ErrorCode"], []);
goog.addDependency("/closure/goog/storage/mechanism/html5localstorage.js", ["goog.storage.mechanism.HTML5LocalStorage"], ["goog.storage.mechanism.HTML5WebStorage"]);
goog.addDependency("/closure/goog/storage/mechanism/html5sessionstorage.js", ["goog.storage.mechanism.HTML5SessionStorage"], ["goog.storage.mechanism.HTML5WebStorage"]);
goog.addDependency("/closure/goog/storage/mechanism/html5webstorage.js", ["goog.storage.mechanism.HTML5WebStorage"], ["goog.asserts", "goog.iter.Iterator", "goog.iter.StopIteration", "goog.storage.mechanism.ErrorCode", "goog.storage.mechanism.IterableMechanism"]);
goog.addDependency("/closure/goog/storage/mechanism/ieuserdata.js", ["goog.storage.mechanism.IEUserData"], ["goog.asserts", "goog.iter.Iterator", "goog.iter.StopIteration", "goog.storage.mechanism.ErrorCode", "goog.storage.mechanism.IterableMechanism", "goog.structs.Map", "goog.userAgent"]);
goog.addDependency("/closure/goog/storage/mechanism/iterablemechanism.js", ["goog.storage.mechanism.IterableMechanism"], ["goog.array", "goog.asserts", "goog.iter", "goog.iter.Iterator", "goog.storage.mechanism.Mechanism"]);
goog.addDependency("/closure/goog/storage/mechanism/iterablemechanism_test.js", ["goog.storage.mechanism.iterablemechanism_test"], ["goog.iter.Iterator", "goog.storage.mechanism.IterableMechanism", "goog.testing.asserts"]);
goog.addDependency("/closure/goog/storage/mechanism/mechanism.js", ["goog.storage.mechanism.Mechanism"], []);
goog.addDependency("/closure/goog/storage/mechanism/mechanism_separation_test.js", ["goog.storage.mechanism.mechanism_separation_test"], ["goog.iter.Iterator", "goog.storage.mechanism.IterableMechanism", "goog.testing.asserts"]);
goog.addDependency("/closure/goog/storage/mechanism/mechanism_sharing_test.js", ["goog.storage.mechanism.mechanism_sharing_test"], ["goog.iter.Iterator", "goog.storage.mechanism.IterableMechanism", "goog.testing.asserts"]);
goog.addDependency("/closure/goog/storage/mechanism/mechanism_test.js", ["goog.storage.mechanism.mechanism_test"], ["goog.storage.mechanism.ErrorCode", "goog.storage.mechanism.HTML5LocalStorage", "goog.storage.mechanism.Mechanism", "goog.testing.asserts", "goog.userAgent.product", "goog.userAgent.product.isVersion"]);
goog.addDependency("/closure/goog/storage/mechanism/mechanismfactory.js", ["goog.storage.mechanism.mechanismfactory"], ["goog.storage.mechanism.HTML5LocalStorage", "goog.storage.mechanism.HTML5SessionStorage", "goog.storage.mechanism.IEUserData", "goog.storage.mechanism.IterableMechanism", "goog.storage.mechanism.PrefixedMechanism"]);
goog.addDependency("/closure/goog/storage/mechanism/prefixedmechanism.js", ["goog.storage.mechanism.PrefixedMechanism"], ["goog.iter.Iterator", "goog.storage.mechanism.IterableMechanism"]);
goog.addDependency("/closure/goog/storage/richstorage.js", ["goog.storage.RichStorage", "goog.storage.RichStorage.Wrapper"], ["goog.storage.ErrorCode", "goog.storage.Storage", "goog.storage.mechanism.Mechanism"]);
goog.addDependency("/closure/goog/storage/storage.js", ["goog.storage.Storage"], ["goog.json", "goog.json.Serializer", "goog.storage.ErrorCode", "goog.storage.mechanism.Mechanism"]);
goog.addDependency("/closure/goog/storage/storage_test.js", ["goog.storage.storage_test"], ["goog.storage.Storage", "goog.structs.Map", "goog.testing.asserts"]);
goog.addDependency("/closure/goog/string/linkify.js", ["goog.string.linkify"], ["goog.string"]);
goog.addDependency("/closure/goog/string/parser.js", ["goog.string.Parser"], []);
goog.addDependency("/closure/goog/string/path.js", ["goog.string.path"], ["goog.array", "goog.string"]);
goog.addDependency("/closure/goog/string/string.js", ["goog.string", "goog.string.Unicode"], []);
goog.addDependency("/closure/goog/string/stringbuffer.js", ["goog.string.StringBuffer"], []);
goog.addDependency("/closure/goog/string/stringformat.js", ["goog.string.format"], ["goog.string"]);
goog.addDependency("/closure/goog/string/stringifier.js", ["goog.string.Stringifier"], []);
goog.addDependency("/closure/goog/structs/avltree.js", ["goog.structs.AvlTree", "goog.structs.AvlTree.Node"], ["goog.structs", "goog.structs.Collection"]);
goog.addDependency("/closure/goog/structs/circularbuffer.js", ["goog.structs.CircularBuffer"], []);
goog.addDependency("/closure/goog/structs/collection.js", ["goog.structs.Collection"], []);
goog.addDependency("/closure/goog/structs/heap.js", ["goog.structs.Heap"], ["goog.array", "goog.object", "goog.structs.Node"]);
goog.addDependency("/closure/goog/structs/inversionmap.js", ["goog.structs.InversionMap"], ["goog.array"]);
goog.addDependency("/closure/goog/structs/linkedmap.js", ["goog.structs.LinkedMap"], ["goog.structs.Map"]);
goog.addDependency("/closure/goog/structs/map.js", ["goog.structs.Map"], ["goog.iter.Iterator", "goog.iter.StopIteration", "goog.object", "goog.structs"]);
goog.addDependency("/closure/goog/structs/node.js", ["goog.structs.Node"], []);
goog.addDependency("/closure/goog/structs/pool.js", ["goog.structs.Pool"], ["goog.Disposable", "goog.structs.Queue", "goog.structs.Set"]);
goog.addDependency("/closure/goog/structs/prioritypool.js", ["goog.structs.PriorityPool"], ["goog.structs.Pool", "goog.structs.PriorityQueue"]);
goog.addDependency("/closure/goog/structs/priorityqueue.js", ["goog.structs.PriorityQueue"], ["goog.structs", "goog.structs.Heap"]);
goog.addDependency("/closure/goog/structs/quadtree.js", ["goog.structs.QuadTree", "goog.structs.QuadTree.Node", "goog.structs.QuadTree.Point"], ["goog.math.Coordinate"]);
goog.addDependency("/closure/goog/structs/queue.js", ["goog.structs.Queue"], ["goog.array"]);
goog.addDependency("/closure/goog/structs/set.js", ["goog.structs.Set"], ["goog.structs", "goog.structs.Collection", "goog.structs.Map"]);
goog.addDependency("/closure/goog/structs/simplepool.js", ["goog.structs.SimplePool"], ["goog.Disposable"]);
goog.addDependency("/closure/goog/structs/stringset.js", ["goog.structs.StringSet"], ["goog.iter"]);
goog.addDependency("/closure/goog/structs/structs.js", ["goog.structs"], ["goog.array", "goog.object"]);
goog.addDependency("/closure/goog/structs/treenode.js", ["goog.structs.TreeNode"], ["goog.array", "goog.asserts", "goog.structs.Node"]);
goog.addDependency("/closure/goog/structs/trie.js", ["goog.structs.Trie"], ["goog.object", "goog.structs"]);
goog.addDependency("/closure/goog/style/bidi.js", ["goog.style.bidi"], ["goog.dom", "goog.style", "goog.userAgent"]);
goog.addDependency("/closure/goog/style/cursor.js", ["goog.style.cursor"], ["goog.userAgent"]);
goog.addDependency("/closure/goog/style/style.js", ["goog.style"], ["goog.array", "goog.dom", "goog.math.Box", "goog.math.Coordinate", "goog.math.Rect", "goog.math.Size", "goog.object", "goog.string", "goog.userAgent"]);
goog.addDependency("/closure/goog/style/style_test.js", ["goog.style_test"], ["goog.dom", "goog.style", "goog.testing.asserts"]);
goog.addDependency("/closure/goog/style/transition.js", ["goog.style.transition", "goog.style.transition.Css3Property"], ["goog.array", "goog.asserts", "goog.userAgent"]);
goog.addDependency("/closure/goog/testing/asserts.js", ["goog.testing.JsUnitException", "goog.testing.asserts"], ["goog.testing.stacktrace"]);
goog.addDependency("/closure/goog/testing/async/mockcontrol.js", ["goog.testing.async.MockControl"], ["goog.asserts", "goog.async.Deferred", "goog.debug", "goog.testing.asserts", "goog.testing.mockmatchers.IgnoreArgument"]);
goog.addDependency("/closure/goog/testing/asynctestcase.js", ["goog.testing.AsyncTestCase", "goog.testing.AsyncTestCase.ControlBreakingException"], ["goog.testing.TestCase", "goog.testing.TestCase.Test", "goog.testing.asserts"]);
goog.addDependency("/closure/goog/testing/benchmark.js", ["goog.testing.benchmark"], ["goog.dom", "goog.dom.TagName", "goog.testing.PerformanceTable", "goog.testing.PerformanceTimer", "goog.testing.TestCase"]);
goog.addDependency("/closure/goog/testing/benchmarks/jsbinarysizebutton.js", ["goog.ui.benchmarks.jsbinarysizebutton"], ["goog.array", "goog.dom", "goog.events", "goog.ui.Button", "goog.ui.ButtonSide", "goog.ui.Component.EventType", "goog.ui.CustomButton"]);
goog.addDependency("/closure/goog/testing/benchmarks/jsbinarysizetoolbar.js", ["goog.ui.benchmarks.jsbinarysizetoolbar"], ["goog.array", "goog.dom", "goog.events", "goog.object", "goog.ui.Component.EventType", "goog.ui.Option", "goog.ui.Toolbar", "goog.ui.ToolbarButton", "goog.ui.ToolbarSelect", "goog.ui.ToolbarSeparator"]);
goog.addDependency("/closure/goog/testing/continuationtestcase.js", ["goog.testing.ContinuationTestCase", "goog.testing.ContinuationTestCase.Step", "goog.testing.ContinuationTestCase.Test"], ["goog.array", "goog.events.EventHandler", "goog.testing.TestCase", "goog.testing.TestCase.Test", "goog.testing.asserts"]);
goog.addDependency("/closure/goog/testing/deferredtestcase.js", ["goog.testing.DeferredTestCase"], ["goog.async.Deferred", "goog.testing.AsyncTestCase", "goog.testing.TestCase"]);
goog.addDependency("/closure/goog/testing/dom.js", ["goog.testing.dom"], ["goog.dom", "goog.dom.NodeIterator", "goog.dom.NodeType", "goog.dom.TagIterator", "goog.dom.TagName", "goog.dom.classes", "goog.iter", "goog.object", "goog.string", "goog.style", "goog.testing.asserts", "goog.userAgent"]);
goog.addDependency("/closure/goog/testing/editor/dom.js", ["goog.testing.editor.dom"], ["goog.dom.NodeType", "goog.dom.TagIterator", "goog.dom.TagWalkType", "goog.iter", "goog.string", "goog.testing.asserts"]);
goog.addDependency("/closure/goog/testing/editor/fieldmock.js", ["goog.testing.editor.FieldMock"], ["goog.dom", "goog.dom.Range", "goog.editor.Field", "goog.testing.LooseMock"]);
goog.addDependency("/closure/goog/testing/editor/testhelper.js", ["goog.testing.editor.TestHelper"], ["goog.Disposable", "goog.dom", "goog.dom.Range", "goog.editor.BrowserFeature", "goog.editor.node", "goog.testing.dom"]);
goog.addDependency("/closure/goog/testing/events/eventobserver.js", ["goog.testing.events.EventObserver"], ["goog.array"]);
goog.addDependency("/closure/goog/testing/events/events.js", ["goog.testing.events", "goog.testing.events.Event"], ["goog.events", "goog.events.BrowserEvent", "goog.events.BrowserEvent.MouseButton", "goog.events.BrowserFeature", "goog.events.EventType", "goog.events.KeyCodes", "goog.object", "goog.style", "goog.userAgent"]);
goog.addDependency("/closure/goog/testing/events/matchers.js", ["goog.testing.events.EventMatcher"], ["goog.events.Event", "goog.testing.mockmatchers.ArgumentMatcher"]);
goog.addDependency("/closure/goog/testing/events/onlinehandler.js", ["goog.testing.events.OnlineHandler"], ["goog.events.EventTarget", "goog.events.OnlineHandler.EventType"]);
goog.addDependency("/closure/goog/testing/expectedfailures.js", ["goog.testing.ExpectedFailures"], ["goog.debug.DivConsole", "goog.debug.Logger", "goog.dom", "goog.dom.TagName", "goog.events", "goog.events.EventType", "goog.style", "goog.testing.JsUnitException", "goog.testing.TestCase", "goog.testing.asserts"]);
goog.addDependency("/closure/goog/testing/fs/blob.js", ["goog.testing.fs.Blob"], ["goog.crypt.base64"]);
goog.addDependency("/closure/goog/testing/fs/entry.js", ["goog.testing.fs.DirectoryEntry", "goog.testing.fs.Entry", "goog.testing.fs.FileEntry"], ["goog.Timer", "goog.array", "goog.async.Deferred", "goog.fs.DirectoryEntry", "goog.fs.DirectoryEntry.Behavior", "goog.fs.Error", "goog.functions", "goog.object", "goog.string", "goog.testing.fs.File", "goog.testing.fs.FileWriter"]);
goog.addDependency("/closure/goog/testing/fs/file.js", ["goog.testing.fs.File"], ["goog.testing.fs.Blob"]);
goog.addDependency("/closure/goog/testing/fs/filereader.js", ["goog.testing.fs.FileReader"], ["goog.Timer", "goog.events.EventTarget", "goog.fs.Error", "goog.fs.FileReader.EventType", "goog.fs.FileReader.ReadyState", "goog.testing.fs.File", "goog.testing.fs.ProgressEvent"]);
goog.addDependency("/closure/goog/testing/fs/filesystem.js", ["goog.testing.fs.FileSystem"], ["goog.testing.fs.DirectoryEntry"]);
goog.addDependency("/closure/goog/testing/fs/filewriter.js", ["goog.testing.fs.FileWriter"], ["goog.Timer", "goog.events.Event", "goog.events.EventTarget", "goog.fs.Error", "goog.fs.FileSaver.EventType", "goog.fs.FileSaver.ReadyState", "goog.string", "goog.testing.fs.File", "goog.testing.fs.ProgressEvent"]);
goog.addDependency("/closure/goog/testing/fs/fs.js", ["goog.testing.fs"], ["goog.Timer", "goog.array", "goog.fs", "goog.testing.fs.Blob", "goog.testing.fs.FileSystem"]);
goog.addDependency("/closure/goog/testing/fs/progressevent.js", ["goog.testing.fs.ProgressEvent"], ["goog.events.Event"]);
goog.addDependency("/closure/goog/testing/functionmock.js", ["goog.testing", "goog.testing.FunctionMock", "goog.testing.GlobalFunctionMock", "goog.testing.MethodMock"], ["goog.object", "goog.testing.LooseMock", "goog.testing.Mock", "goog.testing.MockInterface", "goog.testing.PropertyReplacer", "goog.testing.StrictMock"]);
goog.addDependency("/closure/goog/testing/graphics.js", ["goog.testing.graphics"], ["goog.graphics.Path.Segment", "goog.testing.asserts"]);
goog.addDependency("/closure/goog/testing/jsunit.js", ["goog.testing.jsunit"], ["goog.testing.TestCase", "goog.testing.TestRunner"]);
goog.addDependency("/closure/goog/testing/loosemock.js", ["goog.testing.LooseExpectationCollection", "goog.testing.LooseMock"], ["goog.array", "goog.structs.Map", "goog.testing.Mock"]);
goog.addDependency("/closure/goog/testing/messaging/mockmessagechannel.js", ["goog.testing.messaging.MockMessageChannel"], ["goog.messaging.AbstractChannel", "goog.testing.asserts"]);
goog.addDependency("/closure/goog/testing/messaging/mockmessageevent.js", ["goog.testing.messaging.MockMessageEvent"], ["goog.events.BrowserEvent", "goog.events.EventType", "goog.testing.events"]);
goog.addDependency("/closure/goog/testing/messaging/mockmessageport.js", ["goog.testing.messaging.MockMessagePort"], ["goog.events.EventTarget"]);
goog.addDependency("/closure/goog/testing/messaging/mockportnetwork.js", ["goog.testing.messaging.MockPortNetwork"], ["goog.messaging.PortNetwork", "goog.testing.messaging.MockMessageChannel"]);
goog.addDependency("/closure/goog/testing/mock.js", ["goog.testing.Mock", "goog.testing.MockExpectation"], ["goog.array", "goog.object", "goog.testing.JsUnitException", "goog.testing.MockInterface", "goog.testing.mockmatchers"]);
goog.addDependency("/closure/goog/testing/mockclassfactory.js", ["goog.testing.MockClassFactory", "goog.testing.MockClassRecord"], ["goog.array", "goog.object", "goog.testing.LooseMock", "goog.testing.StrictMock", "goog.testing.TestCase", "goog.testing.mockmatchers"]);
goog.addDependency("/closure/goog/testing/mockclock.js", ["goog.testing.MockClock"], ["goog.Disposable", "goog.testing.PropertyReplacer", "goog.testing.events", "goog.testing.events.Event"]);
goog.addDependency("/closure/goog/testing/mockcontrol.js", ["goog.testing.MockControl"], ["goog.array", "goog.testing", "goog.testing.LooseMock", "goog.testing.MockInterface", "goog.testing.StrictMock"]);
goog.addDependency("/closure/goog/testing/mockinterface.js", ["goog.testing.MockInterface"], []);
goog.addDependency("/closure/goog/testing/mockmatchers.js", ["goog.testing.mockmatchers", "goog.testing.mockmatchers.ArgumentMatcher", "goog.testing.mockmatchers.IgnoreArgument", "goog.testing.mockmatchers.InstanceOf", "goog.testing.mockmatchers.ObjectEquals", "goog.testing.mockmatchers.RegexpMatch", "goog.testing.mockmatchers.SaveArgument", "goog.testing.mockmatchers.TypeOf"], ["goog.array", "goog.dom", "goog.testing.asserts"]);
goog.addDependency("/closure/goog/testing/mockrandom.js", ["goog.testing.MockRandom"], ["goog.Disposable"]);
goog.addDependency("/closure/goog/testing/mockrange.js", ["goog.testing.MockRange"], ["goog.dom.AbstractRange", "goog.testing.LooseMock"]);
goog.addDependency("/closure/goog/testing/mockstorage.js", ["goog.testing.MockStorage"], ["goog.structs.Map"]);
goog.addDependency("/closure/goog/testing/mockuseragent.js", ["goog.testing.MockUserAgent"], ["goog.Disposable", "goog.userAgent"]);
goog.addDependency("/closure/goog/testing/multitestrunner.js", ["goog.testing.MultiTestRunner", "goog.testing.MultiTestRunner.TestFrame"], ["goog.Timer", "goog.array", "goog.dom", "goog.dom.classes", "goog.events.EventHandler", "goog.functions", "goog.string", "goog.ui.Component", "goog.ui.ServerChart", "goog.ui.ServerChart.ChartType", "goog.ui.TableSorter"]);
goog.addDependency("/closure/goog/testing/net/xhrio.js", ["goog.testing.net.XhrIo"], ["goog.array", "goog.dom.xml", "goog.events", "goog.events.EventTarget", "goog.json", "goog.net.ErrorCode", "goog.net.EventType", "goog.net.HttpStatus", "goog.net.XhrIo.ResponseType", "goog.net.XmlHttp", "goog.object", "goog.structs.Map", "goog.uri.utils"]);
goog.addDependency("/closure/goog/testing/net/xhriopool.js", ["goog.testing.net.XhrIoPool"], ["goog.net.XhrIoPool", "goog.testing.net.XhrIo"]);
goog.addDependency("/closure/goog/testing/objectpropertystring.js", ["goog.testing.ObjectPropertyString"], []);
goog.addDependency("/closure/goog/testing/performancetable.js", ["goog.testing.PerformanceTable"], ["goog.dom", "goog.testing.PerformanceTimer"]);
goog.addDependency("/closure/goog/testing/performancetimer.js", ["goog.testing.PerformanceTimer", "goog.testing.PerformanceTimer.Task"], ["goog.array", "goog.math"]);
goog.addDependency("/closure/goog/testing/propertyreplacer.js", ["goog.testing.PropertyReplacer"], ["goog.userAgent"]);
goog.addDependency("/closure/goog/testing/pseudorandom.js", ["goog.testing.PseudoRandom"], ["goog.Disposable"]);
goog.addDependency("/closure/goog/testing/recordfunction.js", ["goog.testing.FunctionCall", "goog.testing.recordConstructor", "goog.testing.recordFunction"], []);
goog.addDependency("/closure/goog/testing/shardingtestcase.js", ["goog.testing.ShardingTestCase"], ["goog.asserts", "goog.testing.TestCase"]);
goog.addDependency("/closure/goog/testing/singleton.js", ["goog.testing.singleton"], []);
goog.addDependency("/closure/goog/testing/stacktrace.js", ["goog.testing.stacktrace", "goog.testing.stacktrace.Frame"], []);
goog.addDependency("/closure/goog/testing/storage/fakemechanism.js", ["goog.testing.storage.FakeMechanism"], ["goog.storage.mechanism.IterableMechanism", "goog.structs.Map"]);
goog.addDependency("/closure/goog/testing/strictmock.js", ["goog.testing.StrictMock"], ["goog.array", "goog.testing.Mock"]);
goog.addDependency("/closure/goog/testing/style/layoutasserts.js", ["goog.testing.style.layoutasserts"], ["goog.style", "goog.testing.asserts", "goog.testing.style"]);
goog.addDependency("/closure/goog/testing/style/style.js", ["goog.testing.style"], ["goog.dom", "goog.math.Rect", "goog.style"]);
goog.addDependency("/closure/goog/testing/testcase.js", ["goog.testing.TestCase", "goog.testing.TestCase.Error", "goog.testing.TestCase.Order", "goog.testing.TestCase.Result", "goog.testing.TestCase.Test"], ["goog.object", "goog.testing.asserts", "goog.testing.stacktrace"]);
goog.addDependency("/closure/goog/testing/testqueue.js", ["goog.testing.TestQueue"], []);
goog.addDependency("/closure/goog/testing/testrunner.js", ["goog.testing.TestRunner"], ["goog.testing.TestCase"]);
goog.addDependency("/closure/goog/testing/ui/rendererasserts.js", ["goog.testing.ui.rendererasserts"], ["goog.testing.asserts"]);
goog.addDependency("/closure/goog/testing/ui/rendererharness.js", ["goog.testing.ui.RendererHarness"], ["goog.Disposable", "goog.dom.NodeType", "goog.testing.asserts"]);
goog.addDependency("/closure/goog/testing/ui/style.js", ["goog.testing.ui.style"], ["goog.array", "goog.dom", "goog.dom.classes", "goog.testing.asserts"]);
goog.addDependency("/closure/goog/timer/timer.js", ["goog.Timer"], ["goog.events.EventTarget"]);
goog.addDependency("/closure/goog/tweak/entries.js", ["goog.tweak.BaseEntry", "goog.tweak.BasePrimitiveSetting", "goog.tweak.BaseSetting", "goog.tweak.BooleanGroup", "goog.tweak.BooleanInGroupSetting", "goog.tweak.BooleanSetting", "goog.tweak.ButtonAction", "goog.tweak.NumericSetting", "goog.tweak.StringSetting"], ["goog.array", "goog.asserts", "goog.debug.Logger", "goog.object"]);
goog.addDependency("/closure/goog/tweak/registry.js", ["goog.tweak.Registry"], ["goog.asserts", "goog.debug.Logger", "goog.object", "goog.string", "goog.tweak.BaseEntry", "goog.uri.utils"]);
goog.addDependency("/closure/goog/tweak/testhelpers.js", ["goog.tweak.testhelpers"], ["goog.tweak"]);
goog.addDependency("/closure/goog/tweak/tweak.js", ["goog.tweak", "goog.tweak.ConfigParams"], ["goog.asserts", "goog.tweak.BooleanGroup", "goog.tweak.BooleanInGroupSetting", "goog.tweak.BooleanSetting", "goog.tweak.ButtonAction", "goog.tweak.NumericSetting", "goog.tweak.Registry", "goog.tweak.StringSetting"]);
goog.addDependency("/closure/goog/tweak/tweakui.js", ["goog.tweak.EntriesPanel", "goog.tweak.TweakUi"], ["goog.array", "goog.asserts", "goog.dom.DomHelper", "goog.object", "goog.style", "goog.tweak", "goog.ui.Zippy", "goog.userAgent"]);
goog.addDependency("/closure/goog/ui/abstractspellchecker.js", ["goog.ui.AbstractSpellChecker", "goog.ui.AbstractSpellChecker.AsyncResult"], ["goog.asserts", "goog.dom", "goog.dom.classes", "goog.dom.selection", "goog.events.EventType", "goog.math.Coordinate", "goog.spell.SpellCheck", "goog.structs.Set", "goog.style", "goog.ui.MenuItem", "goog.ui.MenuSeparator", "goog.ui.PopupMenu"]);
goog.addDependency("/closure/goog/ui/ac/ac.js", ["goog.ui.ac"], ["goog.ui.ac.ArrayMatcher", "goog.ui.ac.AutoComplete", "goog.ui.ac.InputHandler", "goog.ui.ac.Renderer"]);
goog.addDependency("/closure/goog/ui/ac/arraymatcher.js", ["goog.ui.ac.ArrayMatcher"], ["goog.iter", "goog.string"]);
goog.addDependency("/closure/goog/ui/ac/autocomplete.js", ["goog.ui.ac.AutoComplete", "goog.ui.ac.AutoComplete.EventType"], ["goog.events", "goog.events.EventTarget"]);
goog.addDependency("/closure/goog/ui/ac/inputhandler.js", ["goog.ui.ac.InputHandler"], ["goog.Disposable", "goog.Timer", "goog.dom", "goog.dom.a11y", "goog.dom.selection", "goog.events.EventHandler", "goog.events.EventType", "goog.events.KeyCodes", "goog.events.KeyHandler", "goog.events.KeyHandler.EventType", "goog.string", "goog.userAgent", "goog.userAgent.product"]);
goog.addDependency("/closure/goog/ui/ac/remote.js", ["goog.ui.ac.Remote"], ["goog.ui.ac.AutoComplete", "goog.ui.ac.InputHandler", "goog.ui.ac.RemoteArrayMatcher", "goog.ui.ac.Renderer"]);
goog.addDependency("/closure/goog/ui/ac/remotearraymatcher.js", ["goog.ui.ac.RemoteArrayMatcher"], ["goog.Disposable", "goog.Uri", "goog.events", "goog.json", "goog.net.XhrIo"]);
goog.addDependency("/closure/goog/ui/ac/renderer.js", ["goog.ui.ac.Renderer", "goog.ui.ac.Renderer.CustomRenderer"], ["goog.dispose", "goog.dom", "goog.dom.a11y", "goog.dom.classes", "goog.events.Event", "goog.events.EventTarget", "goog.events.EventType", "goog.fx.dom.FadeInAndShow", "goog.fx.dom.FadeOutAndHide", "goog.iter", "goog.positioning", "goog.positioning.Corner", "goog.positioning.Overflow", "goog.string", "goog.style", "goog.ui.IdGenerator", "goog.ui.ac.AutoComplete.EventType", "goog.userAgent"]);
goog.addDependency("/closure/goog/ui/ac/renderoptions.js", ["goog.ui.ac.RenderOptions"], []);
goog.addDependency("/closure/goog/ui/ac/richinputhandler.js", ["goog.ui.ac.RichInputHandler"], ["goog.ui.ac.InputHandler"]);
goog.addDependency("/closure/goog/ui/ac/richremote.js", ["goog.ui.ac.RichRemote"], ["goog.ui.ac.AutoComplete", "goog.ui.ac.Remote", "goog.ui.ac.Renderer", "goog.ui.ac.RichInputHandler", "goog.ui.ac.RichRemoteArrayMatcher"]);
goog.addDependency("/closure/goog/ui/ac/richremotearraymatcher.js", ["goog.ui.ac.RichRemoteArrayMatcher"], ["goog.ui.ac.RemoteArrayMatcher"]);
goog.addDependency("/closure/goog/ui/activitymonitor.js", ["goog.ui.ActivityMonitor"], ["goog.array", "goog.dom", "goog.events", "goog.events.EventHandler", "goog.events.EventTarget", "goog.events.EventType"]);
goog.addDependency("/closure/goog/ui/advancedtooltip.js", ["goog.ui.AdvancedTooltip"], ["goog.events.EventType", "goog.math.Coordinate", "goog.ui.Tooltip", "goog.userAgent"]);
goog.addDependency("/closure/goog/ui/animatedzippy.js", ["goog.ui.AnimatedZippy"], ["goog.dom", "goog.events", "goog.fx.Animation", "goog.fx.Animation.EventType", "goog.fx.Transition.EventType", "goog.fx.easing", "goog.ui.Zippy", "goog.ui.ZippyEvent"]);
goog.addDependency("/closure/goog/ui/attachablemenu.js", ["goog.ui.AttachableMenu"], ["goog.dom.a11y", "goog.dom.a11y.State", "goog.events.KeyCodes", "goog.ui.ItemEvent", "goog.ui.MenuBase"]);
goog.addDependency("/closure/goog/ui/autocomplete/arraymatcher.js", ["goog.ui.AutoComplete.ArrayMatcher"], ["goog.ui.AutoComplete", "goog.ui.ac.ArrayMatcher"]);
goog.addDependency("/closure/goog/ui/autocomplete/autocomplete.js", ["goog.ui.AutoComplete", "goog.ui.AutoComplete.EventType"], ["goog.ui.ac.AutoComplete", "goog.ui.ac.AutoComplete.EventType"]);
goog.addDependency("/closure/goog/ui/autocomplete/basic.js", ["goog.ui.AutoComplete.Basic"], ["goog.ui.AutoComplete", "goog.ui.AutoComplete.ArrayMatcher", "goog.ui.AutoComplete.InputHandler", "goog.ui.AutoComplete.Renderer", "goog.ui.ac"]);
goog.addDependency("/closure/goog/ui/autocomplete/inputhandler.js", ["goog.ui.AutoComplete.InputHandler"], ["goog.ui.AutoComplete", "goog.ui.ac.InputHandler"]);
goog.addDependency("/closure/goog/ui/autocomplete/remote.js", ["goog.ui.AutoComplete.Remote"], ["goog.ui.AutoComplete", "goog.ui.AutoComplete.InputHandler", "goog.ui.AutoComplete.RemoteArrayMatcher", "goog.ui.AutoComplete.Renderer", "goog.ui.ac.Remote"]);
goog.addDependency("/closure/goog/ui/autocomplete/remotearraymatcher.js", ["goog.ui.AutoComplete.RemoteArrayMatcher"], ["goog.ui.AutoComplete", "goog.ui.ac.RemoteArrayMatcher"]);
goog.addDependency("/closure/goog/ui/autocomplete/renderer.js", ["goog.ui.AutoComplete.Renderer", "goog.ui.AutoComplete.Renderer.CustomRenderer"], ["goog.ui.AutoComplete", "goog.ui.ac.Renderer", "goog.ui.ac.Renderer.CustomRenderer"]);
goog.addDependency("/closure/goog/ui/autocomplete/renderoptions.js", ["goog.ui.AutoComplete.RenderOptions"], ["goog.ui.AutoComplete", "goog.ui.ac.RenderOptions"]);
goog.addDependency("/closure/goog/ui/autocomplete/richinputhandler.js", ["goog.ui.AutoComplete.RichInputHandler"], ["goog.ui.AutoComplete", "goog.ui.AutoComplete.InputHandler", "goog.ui.ac.RichInputHandler"]);
goog.addDependency("/closure/goog/ui/autocomplete/richremote.js", ["goog.ui.AutoComplete.RichRemote"], ["goog.ui.AutoComplete", "goog.ui.AutoComplete.Remote", "goog.ui.AutoComplete.Renderer", "goog.ui.AutoComplete.RichInputHandler", "goog.ui.AutoComplete.RichRemoteArrayMatcher", "goog.ui.ac.RichRemote"]);
goog.addDependency("/closure/goog/ui/autocomplete/richremotearraymatcher.js", ["goog.ui.AutoComplete.RichRemoteArrayMatcher"], ["goog.ui.AutoComplete", "goog.ui.AutoComplete.RemoteArrayMatcher", "goog.ui.ac.RichRemoteArrayMatcher"]);
goog.addDependency("/closure/goog/ui/bidiinput.js", ["goog.ui.BidiInput"], ["goog.events", "goog.events.InputHandler", "goog.i18n.bidi", "goog.ui.Component"]);
goog.addDependency("/closure/goog/ui/bubble.js", ["goog.ui.Bubble"], ["goog.Timer", "goog.dom", "goog.events", "goog.events.Event", "goog.events.EventType", "goog.math.Box", "goog.positioning", "goog.positioning.AbsolutePosition", "goog.positioning.AbstractPosition", "goog.positioning.AnchoredPosition", "goog.positioning.Corner", "goog.style", "goog.ui.Component", "goog.ui.Popup", "goog.ui.Popup.AnchoredPosition"]);
goog.addDependency("/closure/goog/ui/button.js", ["goog.ui.Button", "goog.ui.Button.Side"], ["goog.events.KeyCodes", "goog.ui.ButtonRenderer", "goog.ui.ButtonSide", "goog.ui.Control", "goog.ui.ControlContent", "goog.ui.NativeButtonRenderer"]);
goog.addDependency("/closure/goog/ui/buttonrenderer.js", ["goog.ui.ButtonRenderer"], ["goog.dom.a11y", "goog.dom.a11y.Role", "goog.dom.a11y.State", "goog.ui.ButtonSide", "goog.ui.Component.State", "goog.ui.ControlRenderer"]);
goog.addDependency("/closure/goog/ui/buttonside.js", ["goog.ui.ButtonSide"], []);
goog.addDependency("/closure/goog/ui/charcounter.js", ["goog.ui.CharCounter", "goog.ui.CharCounter.Display"], ["goog.dom", "goog.events", "goog.events.EventTarget", "goog.events.InputHandler"]);
goog.addDependency("/closure/goog/ui/charpicker.js", ["goog.ui.CharPicker"], ["goog.array", "goog.dom", "goog.events", "goog.events.EventHandler", "goog.events.EventType", "goog.events.InputHandler", "goog.events.KeyHandler", "goog.i18n.CharListDecompressor", "goog.i18n.uChar", "goog.i18n.uChar.NameFetcher", "goog.structs.Set", "goog.style", "goog.ui.Button", "goog.ui.Component", "goog.ui.ContainerScroller", "goog.ui.FlatButtonRenderer", "goog.ui.HoverCard", "goog.ui.LabelInput", "goog.ui.Menu", 
"goog.ui.MenuButton", "goog.ui.MenuItem", "goog.ui.Tooltip.ElementTooltipPosition"]);
goog.addDependency("/closure/goog/ui/checkbox.js", ["goog.ui.Checkbox", "goog.ui.Checkbox.State"], ["goog.dom.a11y", "goog.dom.a11y.State", "goog.events.EventType", "goog.events.KeyCodes", "goog.ui.CheckboxRenderer", "goog.ui.Component.EventType", "goog.ui.Component.State", "goog.ui.Control", "goog.ui.registry"]);
goog.addDependency("/closure/goog/ui/checkboxmenuitem.js", ["goog.ui.CheckBoxMenuItem"], ["goog.ui.ControlContent", "goog.ui.MenuItem", "goog.ui.registry"]);
goog.addDependency("/closure/goog/ui/checkboxrenderer.js", ["goog.ui.CheckboxRenderer"], ["goog.array", "goog.asserts", "goog.dom.a11y", "goog.dom.a11y.Role", "goog.dom.a11y.State", "goog.dom.classes", "goog.object", "goog.ui.ControlRenderer"]);
goog.addDependency("/closure/goog/ui/colorbutton.js", ["goog.ui.ColorButton"], ["goog.ui.Button", "goog.ui.ColorButtonRenderer", "goog.ui.registry"]);
goog.addDependency("/closure/goog/ui/colorbuttonrenderer.js", ["goog.ui.ColorButtonRenderer"], ["goog.dom.classes", "goog.functions", "goog.ui.ColorMenuButtonRenderer"]);
goog.addDependency("/closure/goog/ui/colormenubutton.js", ["goog.ui.ColorMenuButton"], ["goog.array", "goog.object", "goog.ui.ColorMenuButtonRenderer", "goog.ui.ColorPalette", "goog.ui.Component.EventType", "goog.ui.ControlContent", "goog.ui.Menu", "goog.ui.MenuButton", "goog.ui.registry"]);
goog.addDependency("/closure/goog/ui/colormenubuttonrenderer.js", ["goog.ui.ColorMenuButtonRenderer"], ["goog.color", "goog.dom.classes", "goog.ui.ControlContent", "goog.ui.MenuButtonRenderer", "goog.userAgent"]);
goog.addDependency("/closure/goog/ui/colorpalette.js", ["goog.ui.ColorPalette"], ["goog.array", "goog.color", "goog.dom", "goog.style", "goog.ui.Palette", "goog.ui.PaletteRenderer"]);
goog.addDependency("/closure/goog/ui/colorpicker.js", ["goog.ui.ColorPicker", "goog.ui.ColorPicker.EventType"], ["goog.ui.ColorPalette", "goog.ui.Component", "goog.ui.Component.State"]);
goog.addDependency("/closure/goog/ui/colorsplitbehavior.js", ["goog.ui.ColorSplitBehavior"], ["goog.ui.ColorButton", "goog.ui.ColorMenuButton", "goog.ui.SplitBehavior"]);
goog.addDependency("/closure/goog/ui/combobox.js", ["goog.ui.ComboBox", "goog.ui.ComboBoxItem"], ["goog.Timer", "goog.debug.Logger", "goog.dom.classes", "goog.events", "goog.events.InputHandler", "goog.events.KeyCodes", "goog.events.KeyHandler", "goog.positioning.Corner", "goog.positioning.MenuAnchoredPosition", "goog.string", "goog.style", "goog.ui.Component", "goog.ui.ItemEvent", "goog.ui.LabelInput", "goog.ui.Menu", "goog.ui.MenuItem", "goog.ui.registry", "goog.userAgent"]);
goog.addDependency("/closure/goog/ui/component.js", ["goog.ui.Component", "goog.ui.Component.Error", "goog.ui.Component.EventType", "goog.ui.Component.State"], ["goog.array", "goog.array.ArrayLike", "goog.dom", "goog.events.EventHandler", "goog.events.EventTarget", "goog.object", "goog.style", "goog.ui.IdGenerator"]);
goog.addDependency("/closure/goog/ui/container.js", ["goog.ui.Container", "goog.ui.Container.EventType", "goog.ui.Container.Orientation"], ["goog.dom", "goog.dom.a11y", "goog.dom.a11y.State", "goog.events.EventType", "goog.events.KeyCodes", "goog.events.KeyHandler", "goog.events.KeyHandler.EventType", "goog.style", "goog.ui.Component", "goog.ui.Component.Error", "goog.ui.Component.EventType", "goog.ui.Component.State", "goog.ui.ContainerRenderer"]);
goog.addDependency("/closure/goog/ui/containerrenderer.js", ["goog.ui.ContainerRenderer"], ["goog.array", "goog.dom", "goog.dom.a11y", "goog.dom.classes", "goog.string", "goog.style", "goog.ui.Separator", "goog.ui.registry", "goog.userAgent"]);
goog.addDependency("/closure/goog/ui/containerscroller.js", ["goog.ui.ContainerScroller"], ["goog.Timer", "goog.events.EventHandler", "goog.style", "goog.ui.Component", "goog.ui.Component.EventType", "goog.ui.Container.EventType"]);
goog.addDependency("/closure/goog/ui/control.js", ["goog.ui.Control"], ["goog.array", "goog.dom", "goog.events.BrowserEvent.MouseButton", "goog.events.Event", "goog.events.EventType", "goog.events.KeyCodes", "goog.events.KeyHandler", "goog.events.KeyHandler.EventType", "goog.string", "goog.ui.Component", "goog.ui.Component.Error", "goog.ui.Component.EventType", "goog.ui.Component.State", "goog.ui.ControlContent", "goog.ui.ControlRenderer", "goog.ui.decorate", "goog.ui.registry", "goog.userAgent"]);
goog.addDependency("/closure/goog/ui/controlcontent.js", ["goog.ui.ControlContent"], []);
goog.addDependency("/closure/goog/ui/controlrenderer.js", ["goog.ui.ControlRenderer"], ["goog.array", "goog.dom", "goog.dom.a11y", "goog.dom.a11y.State", "goog.dom.classes", "goog.object", "goog.style", "goog.ui.Component.State", "goog.ui.ControlContent", "goog.userAgent"]);
goog.addDependency("/closure/goog/ui/cookieeditor.js", ["goog.ui.CookieEditor"], ["goog.dom", "goog.dom.TagName", "goog.events.EventType", "goog.net.cookies", "goog.string", "goog.style", "goog.ui.Component"]);
goog.addDependency("/closure/goog/ui/css3buttonrenderer.js", ["goog.ui.Css3ButtonRenderer"], ["goog.dom", "goog.dom.TagName", "goog.dom.classes", "goog.ui.Button", "goog.ui.ButtonRenderer", "goog.ui.ControlContent", "goog.ui.INLINE_BLOCK_CLASSNAME", "goog.ui.registry"]);
goog.addDependency("/closure/goog/ui/css3menubuttonrenderer.js", ["goog.ui.Css3MenuButtonRenderer"], ["goog.dom", "goog.dom.TagName", "goog.ui.ControlContent", "goog.ui.INLINE_BLOCK_CLASSNAME", "goog.ui.MenuButton", "goog.ui.MenuButtonRenderer", "goog.ui.registry"]);
goog.addDependency("/closure/goog/ui/cssnames.js", ["goog.ui.INLINE_BLOCK_CLASSNAME"], []);
goog.addDependency("/closure/goog/ui/custombutton.js", ["goog.ui.CustomButton"], ["goog.ui.Button", "goog.ui.ControlContent", "goog.ui.CustomButtonRenderer", "goog.ui.registry"]);
goog.addDependency("/closure/goog/ui/custombuttonrenderer.js", ["goog.ui.CustomButtonRenderer"], ["goog.dom", "goog.dom.classes", "goog.string", "goog.ui.ButtonRenderer", "goog.ui.ControlContent", "goog.ui.INLINE_BLOCK_CLASSNAME"]);
goog.addDependency("/closure/goog/ui/customcolorpalette.js", ["goog.ui.CustomColorPalette"], ["goog.color", "goog.dom", "goog.ui.ColorPalette"]);
goog.addDependency("/closure/goog/ui/datepicker.js", ["goog.ui.DatePicker", "goog.ui.DatePicker.Events", "goog.ui.DatePickerEvent"], ["goog.date", "goog.date.Date", "goog.date.Interval", "goog.dom", "goog.dom.a11y", "goog.dom.classes", "goog.events", "goog.events.Event", "goog.events.EventType", "goog.events.KeyHandler", "goog.events.KeyHandler.EventType", "goog.i18n.DateTimeFormat", "goog.i18n.DateTimeSymbols", "goog.style", "goog.ui.Component", "goog.ui.IdGenerator"]);
goog.addDependency("/closure/goog/ui/decorate.js", ["goog.ui.decorate"], ["goog.ui.registry"]);
goog.addDependency("/closure/goog/ui/dialog.js", ["goog.ui.Dialog", "goog.ui.Dialog.ButtonSet", "goog.ui.Dialog.ButtonSet.DefaultButtons", "goog.ui.Dialog.DefaultButtonCaptions", "goog.ui.Dialog.DefaultButtonKeys", "goog.ui.Dialog.Event", "goog.ui.Dialog.EventType"], ["goog.asserts", "goog.dom", "goog.dom.NodeType", "goog.dom.TagName", "goog.dom.a11y", "goog.dom.classes", "goog.events.Event", "goog.events.EventType", "goog.events.KeyCodes", "goog.fx.Dragger", "goog.math.Rect", "goog.structs", "goog.structs.Map", 
"goog.style", "goog.ui.ModalPopup", "goog.userAgent"]);
goog.addDependency("/closure/goog/ui/dimensionpicker.js", ["goog.ui.DimensionPicker"], ["goog.events.EventType", "goog.math.Size", "goog.ui.Control", "goog.ui.DimensionPickerRenderer", "goog.ui.registry"]);
goog.addDependency("/closure/goog/ui/dimensionpickerrenderer.js", ["goog.ui.DimensionPickerRenderer"], ["goog.dom", "goog.dom.TagName", "goog.i18n.bidi", "goog.style", "goog.ui.ControlRenderer", "goog.userAgent"]);
goog.addDependency("/closure/goog/ui/dragdropdetector.js", ["goog.ui.DragDropDetector", "goog.ui.DragDropDetector.EventType", "goog.ui.DragDropDetector.ImageDropEvent", "goog.ui.DragDropDetector.LinkDropEvent"], ["goog.dom", "goog.dom.TagName", "goog.events.Event", "goog.events.EventHandler", "goog.events.EventTarget", "goog.events.EventType", "goog.math.Coordinate", "goog.string", "goog.style", "goog.userAgent"]);
goog.addDependency("/closure/goog/ui/drilldownrow.js", ["goog.ui.DrilldownRow"], ["goog.dom", "goog.dom.classes", "goog.events", "goog.ui.Component"]);
goog.addDependency("/closure/goog/ui/editor/abstractdialog.js", ["goog.ui.editor.AbstractDialog", "goog.ui.editor.AbstractDialog.Builder", "goog.ui.editor.AbstractDialog.EventType"], ["goog.dom", "goog.dom.classes", "goog.events.EventTarget", "goog.ui.Dialog", "goog.ui.Dialog.ButtonSet", "goog.ui.Dialog.DefaultButtonKeys", "goog.ui.Dialog.Event", "goog.ui.Dialog.EventType"]);
goog.addDependency("/closure/goog/ui/editor/bubble.js", ["goog.ui.editor.Bubble"], ["goog.debug.Logger", "goog.dom", "goog.dom.ViewportSizeMonitor", "goog.editor.style", "goog.events", "goog.events.EventHandler", "goog.events.EventType", "goog.math.Box", "goog.positioning", "goog.string", "goog.style", "goog.ui.Component.EventType", "goog.ui.PopupBase", "goog.ui.PopupBase.EventType", "goog.userAgent"]);
goog.addDependency("/closure/goog/ui/editor/defaulttoolbar.js", ["goog.ui.editor.DefaultToolbar"], ["goog.dom", "goog.dom.TagName", "goog.dom.classes", "goog.editor.Command", "goog.style", "goog.ui.ControlContent", "goog.ui.editor.ToolbarFactory", "goog.ui.editor.messages"]);
goog.addDependency("/closure/goog/ui/editor/equationeditordialog.js", ["goog.ui.editor.EquationEditorDialog"], ["goog.editor.Command", "goog.ui.editor.AbstractDialog", "goog.ui.editor.EquationEditorOkEvent", "goog.ui.equation.ChangeEvent", "goog.ui.equation.TexEditor"]);
goog.addDependency("/closure/goog/ui/editor/equationeditorokevent.js", ["goog.ui.editor.EquationEditorOkEvent"], ["goog.events.Event", "goog.ui.editor.AbstractDialog"]);
goog.addDependency("/closure/goog/ui/editor/linkdialog.js", ["goog.ui.editor.LinkDialog", "goog.ui.editor.LinkDialog.BeforeTestLinkEvent", "goog.ui.editor.LinkDialog.EventType", "goog.ui.editor.LinkDialog.OkEvent"], ["goog.dom", "goog.dom.DomHelper", "goog.dom.TagName", "goog.dom.classes", "goog.dom.selection", "goog.editor.BrowserFeature", "goog.editor.Link", "goog.editor.focus", "goog.events", "goog.events.EventHandler", "goog.events.EventType", "goog.events.InputHandler", "goog.events.InputHandler.EventType", 
"goog.string", "goog.style", "goog.ui.Button", "goog.ui.LinkButtonRenderer", "goog.ui.editor.AbstractDialog", "goog.ui.editor.AbstractDialog.Builder", "goog.ui.editor.AbstractDialog.EventType", "goog.ui.editor.TabPane", "goog.ui.editor.messages", "goog.userAgent", "goog.window"]);
goog.addDependency("/closure/goog/ui/editor/messages.js", ["goog.ui.editor.messages"], []);
goog.addDependency("/closure/goog/ui/editor/tabpane.js", ["goog.ui.editor.TabPane"], ["goog.dom.TagName", "goog.events.EventHandler", "goog.ui.Component", "goog.ui.Control", "goog.ui.Tab", "goog.ui.TabBar"]);
goog.addDependency("/closure/goog/ui/editor/toolbarcontroller.js", ["goog.ui.editor.ToolbarController"], ["goog.editor.Field.EventType", "goog.events.EventHandler", "goog.events.EventTarget", "goog.ui.Component.EventType"]);
goog.addDependency("/closure/goog/ui/editor/toolbarfactory.js", ["goog.ui.editor.ToolbarFactory"], ["goog.array", "goog.dom", "goog.string", "goog.string.Unicode", "goog.style", "goog.ui.Component.State", "goog.ui.Container.Orientation", "goog.ui.ControlContent", "goog.ui.Option", "goog.ui.Toolbar", "goog.ui.ToolbarButton", "goog.ui.ToolbarColorMenuButton", "goog.ui.ToolbarMenuButton", "goog.ui.ToolbarRenderer", "goog.ui.ToolbarSelect", "goog.userAgent"]);
goog.addDependency("/closure/goog/ui/emoji/emoji.js", ["goog.ui.emoji.Emoji"], []);
goog.addDependency("/closure/goog/ui/emoji/emojipalette.js", ["goog.ui.emoji.EmojiPalette"], ["goog.events.Event", "goog.events.EventType", "goog.net.ImageLoader", "goog.ui.Palette", "goog.ui.emoji.Emoji", "goog.ui.emoji.EmojiPaletteRenderer"]);
goog.addDependency("/closure/goog/ui/emoji/emojipaletterenderer.js", ["goog.ui.emoji.EmojiPaletteRenderer"], ["goog.dom", "goog.dom.a11y", "goog.ui.PaletteRenderer", "goog.ui.emoji.Emoji", "goog.ui.emoji.SpriteInfo"]);
goog.addDependency("/closure/goog/ui/emoji/emojipicker.js", ["goog.ui.emoji.EmojiPicker"], ["goog.debug.Logger", "goog.dom", "goog.ui.Component", "goog.ui.TabPane", "goog.ui.TabPane.TabPage", "goog.ui.emoji.Emoji", "goog.ui.emoji.EmojiPalette", "goog.ui.emoji.EmojiPaletteRenderer", "goog.ui.emoji.ProgressiveEmojiPaletteRenderer"]);
goog.addDependency("/closure/goog/ui/emoji/popupemojipicker.js", ["goog.ui.emoji.PopupEmojiPicker"], ["goog.dom", "goog.events.EventType", "goog.positioning.AnchoredPosition", "goog.ui.Component", "goog.ui.Popup", "goog.ui.emoji.EmojiPicker"]);
goog.addDependency("/closure/goog/ui/emoji/progressiveemojipaletterenderer.js", ["goog.ui.emoji.ProgressiveEmojiPaletteRenderer"], ["goog.ui.emoji.EmojiPaletteRenderer"]);
goog.addDependency("/closure/goog/ui/emoji/spriteinfo.js", ["goog.ui.emoji.SpriteInfo"], []);
goog.addDependency("/closure/goog/ui/equation/arrowpalette.js", ["goog.ui.equation.ArrowPalette"], ["goog.math.Size", "goog.ui.equation.Palette"]);
goog.addDependency("/closure/goog/ui/equation/changeevent.js", ["goog.ui.equation.ChangeEvent"], ["goog.events.Event", "goog.events.EventType"]);
goog.addDependency("/closure/goog/ui/equation/comparisonpalette.js", ["goog.ui.equation.ComparisonPalette"], ["goog.math.Size", "goog.ui.equation.Palette"]);
goog.addDependency("/closure/goog/ui/equation/editorpane.js", ["goog.ui.equation.EditorPane"], ["goog.dom", "goog.style", "goog.ui.Component"]);
goog.addDependency("/closure/goog/ui/equation/equationeditor.js", ["goog.ui.equation.EquationEditor"], ["goog.dom", "goog.events", "goog.ui.Component", "goog.ui.Tab", "goog.ui.TabBar", "goog.ui.equation.EditorPane", "goog.ui.equation.ImageRenderer", "goog.ui.equation.TexPane"]);
goog.addDependency("/closure/goog/ui/equation/equationeditordialog.js", ["goog.ui.equation.EquationEditorDialog"], ["goog.dom", "goog.ui.Dialog", "goog.ui.Dialog.ButtonSet", "goog.ui.equation.EquationEditor", "goog.ui.equation.ImageRenderer", "goog.ui.equation.TexEditor"]);
goog.addDependency("/closure/goog/ui/equation/greekpalette.js", ["goog.ui.equation.GreekPalette"], ["goog.math.Size", "goog.ui.equation.Palette"]);
goog.addDependency("/closure/goog/ui/equation/imagerenderer.js", ["goog.ui.equation.ImageRenderer"], ["goog.dom.TagName", "goog.dom.classes", "goog.string", "goog.uri.utils"]);
goog.addDependency("/closure/goog/ui/equation/mathpalette.js", ["goog.ui.equation.MathPalette"], ["goog.math.Size", "goog.ui.equation.Palette"]);
goog.addDependency("/closure/goog/ui/equation/menupalette.js", ["goog.ui.equation.MenuPalette", "goog.ui.equation.MenuPaletteRenderer"], ["goog.math.Size", "goog.style", "goog.ui.equation.Palette", "goog.ui.equation.PaletteRenderer"]);
goog.addDependency("/closure/goog/ui/equation/palette.js", ["goog.ui.equation.Palette", "goog.ui.equation.PaletteEvent", "goog.ui.equation.PaletteRenderer"], ["goog.dom", "goog.dom.TagName", "goog.ui.Palette", "goog.ui.equation.ImageRenderer"]);
goog.addDependency("/closure/goog/ui/equation/palettemanager.js", ["goog.ui.equation.PaletteManager"], ["goog.Timer", "goog.events.EventTarget", "goog.ui.equation.ArrowPalette", "goog.ui.equation.ComparisonPalette", "goog.ui.equation.GreekPalette", "goog.ui.equation.MathPalette", "goog.ui.equation.MenuPalette", "goog.ui.equation.Palette", "goog.ui.equation.SymbolPalette"]);
goog.addDependency("/closure/goog/ui/equation/symbolpalette.js", ["goog.ui.equation.SymbolPalette"], ["goog.math.Size", "goog.ui.equation.Palette"]);
goog.addDependency("/closure/goog/ui/equation/texeditor.js", ["goog.ui.equation.TexEditor"], ["goog.dom", "goog.ui.Component", "goog.ui.equation.ImageRenderer", "goog.ui.equation.TexPane"]);
goog.addDependency("/closure/goog/ui/equation/texpane.js", ["goog.ui.equation.TexPane"], ["goog.Timer", "goog.dom", "goog.dom.TagName", "goog.dom.selection", "goog.events", "goog.events.EventType", "goog.events.InputHandler", "goog.string", "goog.style", "goog.ui.Component", "goog.ui.equation.ChangeEvent", "goog.ui.equation.EditorPane", "goog.ui.equation.ImageRenderer", "goog.ui.equation.PaletteManager"]);
goog.addDependency("/closure/goog/ui/filteredmenu.js", ["goog.ui.FilteredMenu"], ["goog.dom", "goog.events.EventType", "goog.events.InputHandler", "goog.events.KeyCodes", "goog.string", "goog.ui.FilterObservingMenuItem", "goog.ui.Menu"]);
goog.addDependency("/closure/goog/ui/filterobservingmenuitem.js", ["goog.ui.FilterObservingMenuItem"], ["goog.ui.ControlContent", "goog.ui.FilterObservingMenuItemRenderer", "goog.ui.MenuItem", "goog.ui.registry"]);
goog.addDependency("/closure/goog/ui/filterobservingmenuitemrenderer.js", ["goog.ui.FilterObservingMenuItemRenderer"], ["goog.ui.MenuItemRenderer"]);
goog.addDependency("/closure/goog/ui/flatbuttonrenderer.js", ["goog.ui.FlatButtonRenderer"], ["goog.dom.classes", "goog.ui.Button", "goog.ui.ButtonRenderer", "goog.ui.INLINE_BLOCK_CLASSNAME", "goog.ui.registry"]);
goog.addDependency("/closure/goog/ui/flatmenubuttonrenderer.js", ["goog.ui.FlatMenuButtonRenderer"], ["goog.style", "goog.ui.ControlContent", "goog.ui.FlatButtonRenderer", "goog.ui.INLINE_BLOCK_CLASSNAME", "goog.ui.Menu", "goog.ui.MenuButton", "goog.ui.MenuRenderer", "goog.ui.registry"]);
goog.addDependency("/closure/goog/ui/formpost.js", ["goog.ui.FormPost"], ["goog.array", "goog.dom.TagName", "goog.string", "goog.string.StringBuffer", "goog.ui.Component"]);
goog.addDependency("/closure/goog/ui/gauge.js", ["goog.ui.Gauge", "goog.ui.GaugeColoredRange"], ["goog.dom", "goog.dom.a11y", "goog.fx.Animation", "goog.fx.Animation.EventType", "goog.fx.Transition.EventType", "goog.fx.easing", "goog.graphics", "goog.graphics.Font", "goog.graphics.Path", "goog.graphics.SolidFill", "goog.ui.Component", "goog.ui.GaugeTheme"]);
goog.addDependency("/closure/goog/ui/gaugetheme.js", ["goog.ui.GaugeTheme"], ["goog.graphics.LinearGradient", "goog.graphics.SolidFill", "goog.graphics.Stroke"]);
goog.addDependency("/closure/goog/ui/hovercard.js", ["goog.ui.HoverCard", "goog.ui.HoverCard.EventType", "goog.ui.HoverCard.TriggerEvent"], ["goog.dom", "goog.events", "goog.events.EventType", "goog.ui.AdvancedTooltip"]);
goog.addDependency("/closure/goog/ui/hsvapalette.js", ["goog.ui.HsvaPalette"], ["goog.array", "goog.color", "goog.color.alpha", "goog.events.EventType", "goog.ui.Component.EventType", "goog.ui.HsvPalette"]);
goog.addDependency("/closure/goog/ui/hsvpalette.js", ["goog.ui.HsvPalette"], ["goog.color", "goog.dom", "goog.dom.DomHelper", "goog.events", "goog.events.Event", "goog.events.EventType", "goog.events.InputHandler", "goog.style", "goog.style.bidi", "goog.ui.Component", "goog.ui.Component.EventType", "goog.userAgent"]);
goog.addDependency("/closure/goog/ui/idgenerator.js", ["goog.ui.IdGenerator"], []);
goog.addDependency("/closure/goog/ui/idletimer.js", ["goog.ui.IdleTimer"], ["goog.Timer", "goog.events", "goog.events.EventTarget", "goog.structs.Set", "goog.ui.ActivityMonitor"]);
goog.addDependency("/closure/goog/ui/iframemask.js", ["goog.ui.IframeMask"], ["goog.Disposable", "goog.Timer", "goog.dom", "goog.dom.DomHelper", "goog.dom.iframe", "goog.events.EventHandler", "goog.events.EventTarget", "goog.style"]);
goog.addDependency("/closure/goog/ui/imagelessbuttonrenderer.js", ["goog.ui.ImagelessButtonRenderer"], ["goog.dom.classes", "goog.ui.Button", "goog.ui.ControlContent", "goog.ui.CustomButtonRenderer", "goog.ui.INLINE_BLOCK_CLASSNAME", "goog.ui.registry"]);
goog.addDependency("/closure/goog/ui/imagelessmenubuttonrenderer.js", ["goog.ui.ImagelessMenuButtonRenderer"], ["goog.dom", "goog.dom.TagName", "goog.dom.classes", "goog.ui.ControlContent", "goog.ui.INLINE_BLOCK_CLASSNAME", "goog.ui.MenuButton", "goog.ui.MenuButtonRenderer", "goog.ui.registry"]);
goog.addDependency("/closure/goog/ui/inputdatepicker.js", ["goog.ui.InputDatePicker"], ["goog.date.DateTime", "goog.dom", "goog.string", "goog.ui.Component", "goog.ui.DatePicker", "goog.ui.PopupBase", "goog.ui.PopupDatePicker"]);
goog.addDependency("/closure/goog/ui/itemevent.js", ["goog.ui.ItemEvent"], ["goog.events.Event"]);
goog.addDependency("/closure/goog/ui/keyboardshortcuthandler.js", ["goog.ui.KeyboardShortcutEvent", "goog.ui.KeyboardShortcutHandler", "goog.ui.KeyboardShortcutHandler.EventType"], ["goog.Timer", "goog.events", "goog.events.Event", "goog.events.EventTarget", "goog.events.EventType", "goog.events.KeyCodes", "goog.events.KeyNames", "goog.object"]);
goog.addDependency("/closure/goog/ui/labelinput.js", ["goog.ui.LabelInput"], ["goog.Timer", "goog.dom", "goog.dom.a11y", "goog.dom.a11y.State", "goog.dom.classes", "goog.events.EventHandler", "goog.events.EventType", "goog.ui.Component", "goog.userAgent"]);
goog.addDependency("/closure/goog/ui/linkbuttonrenderer.js", ["goog.ui.LinkButtonRenderer"], ["goog.ui.Button", "goog.ui.FlatButtonRenderer", "goog.ui.registry"]);
goog.addDependency("/closure/goog/ui/media/flashobject.js", ["goog.ui.media.FlashObject", "goog.ui.media.FlashObject.ScriptAccessLevel", "goog.ui.media.FlashObject.Wmodes"], ["goog.asserts", "goog.debug.Logger", "goog.events.EventHandler", "goog.string", "goog.structs.Map", "goog.style", "goog.ui.Component", "goog.ui.Component.Error", "goog.userAgent", "goog.userAgent.flash"]);
goog.addDependency("/closure/goog/ui/media/flickr.js", ["goog.ui.media.FlickrSet", "goog.ui.media.FlickrSetModel"], ["goog.object", "goog.ui.media.FlashObject", "goog.ui.media.Media", "goog.ui.media.MediaModel", "goog.ui.media.MediaModel.Player", "goog.ui.media.MediaRenderer"]);
goog.addDependency("/closure/goog/ui/media/googlevideo.js", ["goog.ui.media.GoogleVideo", "goog.ui.media.GoogleVideoModel"], ["goog.string", "goog.ui.media.FlashObject", "goog.ui.media.Media", "goog.ui.media.MediaModel", "goog.ui.media.MediaModel.Player", "goog.ui.media.MediaRenderer"]);
goog.addDependency("/closure/goog/ui/media/media.js", ["goog.ui.media.Media", "goog.ui.media.MediaRenderer"], ["goog.style", "goog.ui.Component.State", "goog.ui.Control", "goog.ui.ControlRenderer"]);
goog.addDependency("/closure/goog/ui/media/mediamodel.js", ["goog.ui.media.MediaModel", "goog.ui.media.MediaModel.Category", "goog.ui.media.MediaModel.Credit", "goog.ui.media.MediaModel.Credit.Role", "goog.ui.media.MediaModel.Credit.Scheme", "goog.ui.media.MediaModel.Medium", "goog.ui.media.MediaModel.MimeType", "goog.ui.media.MediaModel.Player", "goog.ui.media.MediaModel.SubTitle", "goog.ui.media.MediaModel.Thumbnail"], ["goog.array"]);
goog.addDependency("/closure/goog/ui/media/mp3.js", ["goog.ui.media.Mp3"], ["goog.string", "goog.ui.media.FlashObject", "goog.ui.media.Media", "goog.ui.media.MediaRenderer"]);
goog.addDependency("/closure/goog/ui/media/photo.js", ["goog.ui.media.Photo"], ["goog.ui.media.Media", "goog.ui.media.MediaRenderer"]);
goog.addDependency("/closure/goog/ui/media/picasa.js", ["goog.ui.media.PicasaAlbum", "goog.ui.media.PicasaAlbumModel"], ["goog.object", "goog.ui.media.FlashObject", "goog.ui.media.Media", "goog.ui.media.MediaModel", "goog.ui.media.MediaModel.Player", "goog.ui.media.MediaRenderer"]);
goog.addDependency("/closure/goog/ui/media/vimeo.js", ["goog.ui.media.Vimeo", "goog.ui.media.VimeoModel"], ["goog.string", "goog.ui.media.FlashObject", "goog.ui.media.Media", "goog.ui.media.MediaModel", "goog.ui.media.MediaModel.Player", "goog.ui.media.MediaRenderer"]);
goog.addDependency("/closure/goog/ui/media/youtube.js", ["goog.ui.media.Youtube", "goog.ui.media.YoutubeModel"], ["goog.string", "goog.ui.Component.Error", "goog.ui.Component.State", "goog.ui.media.FlashObject", "goog.ui.media.Media", "goog.ui.media.MediaModel", "goog.ui.media.MediaModel.Player", "goog.ui.media.MediaModel.Thumbnail", "goog.ui.media.MediaRenderer"]);
goog.addDependency("/closure/goog/ui/menu.js", ["goog.ui.Menu", "goog.ui.Menu.EventType"], ["goog.math.Coordinate", "goog.string", "goog.style", "goog.ui.Component.EventType", "goog.ui.Component.State", "goog.ui.Container", "goog.ui.Container.Orientation", "goog.ui.MenuHeader", "goog.ui.MenuItem", "goog.ui.MenuRenderer", "goog.ui.MenuSeparator"]);
goog.addDependency("/closure/goog/ui/menubar.js", ["goog.ui.menuBar"], ["goog.ui.MenuBarRenderer"]);
goog.addDependency("/closure/goog/ui/menubardecorator.js", ["goog.ui.menuBarDecorator"], ["goog.ui.Container", "goog.ui.menuBar"]);
goog.addDependency("/closure/goog/ui/menubarrenderer.js", ["goog.ui.MenuBarRenderer"], ["goog.dom", "goog.dom.a11y", "goog.dom.a11y.Role", "goog.dom.a11y.State", "goog.ui.ContainerRenderer"]);
goog.addDependency("/closure/goog/ui/menubase.js", ["goog.ui.MenuBase"], ["goog.events.EventHandler", "goog.events.EventType", "goog.events.KeyHandler", "goog.events.KeyHandler.EventType", "goog.ui.Popup"]);
goog.addDependency("/closure/goog/ui/menubutton.js", ["goog.ui.MenuButton"], ["goog.Timer", "goog.dom", "goog.dom.a11y", "goog.dom.a11y.State", "goog.events.EventType", "goog.events.KeyCodes", "goog.events.KeyHandler.EventType", "goog.math.Box", "goog.math.Rect", "goog.positioning", "goog.positioning.Corner", "goog.positioning.MenuAnchoredPosition", "goog.style", "goog.ui.Button", "goog.ui.Component.EventType", "goog.ui.Component.State", "goog.ui.Menu", "goog.ui.MenuButtonRenderer", "goog.ui.registry", 
"goog.userAgent", "goog.userAgent.product"]);
goog.addDependency("/closure/goog/ui/menubuttonrenderer.js", ["goog.ui.MenuButtonRenderer"], ["goog.dom", "goog.style", "goog.ui.CustomButtonRenderer", "goog.ui.INLINE_BLOCK_CLASSNAME", "goog.ui.Menu", "goog.ui.MenuRenderer", "goog.userAgent"]);
goog.addDependency("/closure/goog/ui/menuheader.js", ["goog.ui.MenuHeader"], ["goog.ui.Component.State", "goog.ui.Control", "goog.ui.MenuHeaderRenderer", "goog.ui.registry"]);
goog.addDependency("/closure/goog/ui/menuheaderrenderer.js", ["goog.ui.MenuHeaderRenderer"], ["goog.dom", "goog.dom.classes", "goog.ui.ControlRenderer"]);
goog.addDependency("/closure/goog/ui/menuitem.js", ["goog.ui.MenuItem"], ["goog.array", "goog.dom", "goog.dom.classes", "goog.events.KeyCodes", "goog.math.Coordinate", "goog.string", "goog.ui.Component.State", "goog.ui.Control", "goog.ui.ControlContent", "goog.ui.MenuItemRenderer", "goog.ui.registry"]);
goog.addDependency("/closure/goog/ui/menuitemrenderer.js", ["goog.ui.MenuItemRenderer"], ["goog.dom", "goog.dom.a11y", "goog.dom.a11y.Role", "goog.dom.classes", "goog.ui.Component.State", "goog.ui.ControlContent", "goog.ui.ControlRenderer"]);
goog.addDependency("/closure/goog/ui/menurenderer.js", ["goog.ui.MenuRenderer"], ["goog.dom", "goog.dom.a11y", "goog.dom.a11y.Role", "goog.dom.a11y.State", "goog.ui.ContainerRenderer", "goog.ui.Separator"]);
goog.addDependency("/closure/goog/ui/menuseparator.js", ["goog.ui.MenuSeparator"], ["goog.ui.MenuSeparatorRenderer", "goog.ui.Separator", "goog.ui.registry"]);
goog.addDependency("/closure/goog/ui/menuseparatorrenderer.js", ["goog.ui.MenuSeparatorRenderer"], ["goog.dom", "goog.dom.classes", "goog.ui.ControlContent", "goog.ui.ControlRenderer"]);
goog.addDependency("/closure/goog/ui/mockactivitymonitor.js", ["goog.ui.MockActivityMonitor"], ["goog.events.EventType", "goog.ui.ActivityMonitor"]);
goog.addDependency("/closure/goog/ui/modalpopup.js", ["goog.ui.ModalPopup"], ["goog.Timer", "goog.asserts", "goog.dom", "goog.dom.TagName", "goog.dom.classes", "goog.dom.iframe", "goog.events", "goog.events.EventType", "goog.events.FocusHandler", "goog.fx.Transition", "goog.style", "goog.ui.Component", "goog.ui.PopupBase.EventType", "goog.userAgent"]);
goog.addDependency("/closure/goog/ui/nativebuttonrenderer.js", ["goog.ui.NativeButtonRenderer"], ["goog.dom.classes", "goog.events.EventType", "goog.ui.ButtonRenderer", "goog.ui.Component.State"]);
goog.addDependency("/closure/goog/ui/offlineinstalldialog.js", ["goog.ui.OfflineInstallDialog", "goog.ui.OfflineInstallDialog.ButtonKeyType", "goog.ui.OfflineInstallDialog.EnableScreen", "goog.ui.OfflineInstallDialog.InstallScreen", "goog.ui.OfflineInstallDialog.InstallingGearsScreen", "goog.ui.OfflineInstallDialog.ScreenType", "goog.ui.OfflineInstallDialog.UpgradeScreen", "goog.ui.OfflineInstallDialogScreen"], ["goog.Disposable", "goog.dom.classes", "goog.gears", "goog.string", "goog.string.StringBuffer", 
"goog.ui.Dialog", "goog.ui.Dialog.ButtonSet", "goog.ui.Dialog.EventType", "goog.window"]);
goog.addDependency("/closure/goog/ui/offlinestatuscard.js", ["goog.ui.OfflineStatusCard", "goog.ui.OfflineStatusCard.EventType"], ["goog.dom", "goog.events.EventType", "goog.gears.StatusType", "goog.structs.Map", "goog.style", "goog.ui.Component", "goog.ui.Component.EventType", "goog.ui.ProgressBar"]);
goog.addDependency("/closure/goog/ui/offlinestatuscomponent.js", ["goog.ui.OfflineStatusComponent", "goog.ui.OfflineStatusComponent.StatusClassNames"], ["goog.dom.classes", "goog.events.EventType", "goog.gears.StatusType", "goog.positioning", "goog.positioning.AnchoredPosition", "goog.positioning.Corner", "goog.positioning.Overflow", "goog.ui.Component", "goog.ui.OfflineStatusCard.EventType", "goog.ui.Popup"]);
goog.addDependency("/closure/goog/ui/option.js", ["goog.ui.Option"], ["goog.ui.Component.EventType", "goog.ui.ControlContent", "goog.ui.MenuItem", "goog.ui.registry"]);
goog.addDependency("/closure/goog/ui/palette.js", ["goog.ui.Palette"], ["goog.array", "goog.dom", "goog.events.EventType", "goog.events.KeyCodes", "goog.math.Size", "goog.ui.Component.Error", "goog.ui.Component.EventType", "goog.ui.Control", "goog.ui.PaletteRenderer", "goog.ui.SelectionModel"]);
goog.addDependency("/closure/goog/ui/paletterenderer.js", ["goog.ui.PaletteRenderer"], ["goog.array", "goog.dom", "goog.dom.NodeType", "goog.dom.a11y", "goog.dom.classes", "goog.style", "goog.ui.ControlRenderer", "goog.userAgent"]);
goog.addDependency("/closure/goog/ui/plaintextspellchecker.js", ["goog.ui.PlainTextSpellChecker"], ["goog.Timer", "goog.dom", "goog.dom.a11y", "goog.events.EventHandler", "goog.events.EventType", "goog.events.KeyCodes", "goog.events.KeyHandler", "goog.events.KeyHandler.EventType", "goog.style", "goog.ui.AbstractSpellChecker", "goog.ui.AbstractSpellChecker.AsyncResult", "goog.ui.Component.EventType", "goog.userAgent"]);
goog.addDependency("/closure/goog/ui/popup.js", ["goog.ui.Popup", "goog.ui.Popup.AbsolutePosition", "goog.ui.Popup.AnchoredPosition", "goog.ui.Popup.AnchoredViewPortPosition", "goog.ui.Popup.ClientPosition", "goog.ui.Popup.Corner", "goog.ui.Popup.Overflow", "goog.ui.Popup.ViewPortClientPosition", "goog.ui.Popup.ViewPortPosition"], ["goog.math.Box", "goog.positioning", "goog.positioning.AbsolutePosition", "goog.positioning.AnchoredPosition", "goog.positioning.AnchoredViewportPosition", "goog.positioning.ClientPosition", 
"goog.positioning.Corner", "goog.positioning.Overflow", "goog.positioning.OverflowStatus", "goog.positioning.ViewportClientPosition", "goog.positioning.ViewportPosition", "goog.style", "goog.ui.PopupBase"]);
goog.addDependency("/closure/goog/ui/popupbase.js", ["goog.ui.PopupBase", "goog.ui.PopupBase.EventType", "goog.ui.PopupBase.Type"], ["goog.Timer", "goog.dom", "goog.events.EventHandler", "goog.events.EventTarget", "goog.events.EventType", "goog.events.KeyCodes", "goog.fx.Transition", "goog.fx.Transition.EventType", "goog.style", "goog.userAgent"]);
goog.addDependency("/closure/goog/ui/popupcolorpicker.js", ["goog.ui.PopupColorPicker"], ["goog.dom.classes", "goog.events.EventType", "goog.positioning.AnchoredPosition", "goog.positioning.Corner", "goog.ui.ColorPicker", "goog.ui.ColorPicker.EventType", "goog.ui.Component", "goog.ui.Popup"]);
goog.addDependency("/closure/goog/ui/popupdatepicker.js", ["goog.ui.PopupDatePicker"], ["goog.events.EventType", "goog.positioning.AnchoredPosition", "goog.positioning.Corner", "goog.style", "goog.ui.Component", "goog.ui.DatePicker", "goog.ui.DatePicker.Events", "goog.ui.Popup", "goog.ui.PopupBase.EventType"]);
goog.addDependency("/closure/goog/ui/popupmenu.js", ["goog.ui.PopupMenu"], ["goog.events.EventType", "goog.positioning.AnchoredViewportPosition", "goog.positioning.Corner", "goog.positioning.MenuAnchoredPosition", "goog.positioning.ViewportClientPosition", "goog.structs", "goog.structs.Map", "goog.style", "goog.ui.Component.EventType", "goog.ui.Menu", "goog.ui.PopupBase", "goog.userAgent"]);
goog.addDependency("/closure/goog/ui/progressbar.js", ["goog.ui.ProgressBar", "goog.ui.ProgressBar.Orientation"], ["goog.dom", "goog.dom.a11y", "goog.dom.classes", "goog.events", "goog.events.EventType", "goog.ui.Component", "goog.ui.Component.EventType", "goog.ui.RangeModel", "goog.userAgent"]);
goog.addDependency("/closure/goog/ui/prompt.js", ["goog.ui.Prompt"], ["goog.Timer", "goog.dom", "goog.events", "goog.events.EventType", "goog.functions", "goog.ui.Component.Error", "goog.ui.Dialog", "goog.ui.Dialog.ButtonSet", "goog.ui.Dialog.DefaultButtonKeys", "goog.ui.Dialog.EventType", "goog.userAgent"]);
goog.addDependency("/closure/goog/ui/rangemodel.js", ["goog.ui.RangeModel"], ["goog.events.EventTarget", "goog.ui.Component.EventType"]);
goog.addDependency("/closure/goog/ui/ratings.js", ["goog.ui.Ratings", "goog.ui.Ratings.EventType"], ["goog.dom.a11y", "goog.dom.classes", "goog.events.EventType", "goog.ui.Component"]);
goog.addDependency("/closure/goog/ui/registry.js", ["goog.ui.registry"], ["goog.dom.classes"]);
goog.addDependency("/closure/goog/ui/richtextspellchecker.js", ["goog.ui.RichTextSpellChecker"], ["goog.Timer", "goog.dom", "goog.dom.NodeType", "goog.events", "goog.events.EventType", "goog.string.StringBuffer", "goog.ui.AbstractSpellChecker", "goog.ui.AbstractSpellChecker.AsyncResult"]);
goog.addDependency("/closure/goog/ui/roundedpanel.js", ["goog.ui.BaseRoundedPanel", "goog.ui.CssRoundedPanel", "goog.ui.GraphicsRoundedPanel", "goog.ui.RoundedPanel", "goog.ui.RoundedPanel.Corner"], ["goog.dom", "goog.dom.classes", "goog.graphics", "goog.graphics.SolidFill", "goog.graphics.Stroke", "goog.math.Coordinate", "goog.style", "goog.ui.Component", "goog.userAgent"]);
goog.addDependency("/closure/goog/ui/roundedtabrenderer.js", ["goog.ui.RoundedTabRenderer"], ["goog.dom", "goog.ui.Tab", "goog.ui.TabBar.Location", "goog.ui.TabRenderer", "goog.ui.registry"]);
goog.addDependency("/closure/goog/ui/scrollfloater.js", ["goog.ui.ScrollFloater", "goog.ui.ScrollFloater.EventType"], ["goog.dom", "goog.dom.classes", "goog.events.EventType", "goog.object", "goog.style", "goog.ui.Component", "goog.userAgent"]);
goog.addDependency("/closure/goog/ui/select.js", ["goog.ui.Select"], ["goog.dom.a11y", "goog.dom.a11y.Role", "goog.dom.a11y.State", "goog.events.EventType", "goog.ui.Component.EventType", "goog.ui.ControlContent", "goog.ui.MenuButton", "goog.ui.SelectionModel", "goog.ui.registry"]);
goog.addDependency("/closure/goog/ui/selectionmenubutton.js", ["goog.ui.SelectionMenuButton", "goog.ui.SelectionMenuButton.SelectionState"], ["goog.events.EventType", "goog.ui.Component.EventType", "goog.ui.Menu", "goog.ui.MenuButton", "goog.ui.MenuItem"]);
goog.addDependency("/closure/goog/ui/selectionmodel.js", ["goog.ui.SelectionModel"], ["goog.array", "goog.events.EventTarget", "goog.events.EventType"]);
goog.addDependency("/closure/goog/ui/separator.js", ["goog.ui.Separator"], ["goog.dom.a11y", "goog.ui.Component.State", "goog.ui.Control", "goog.ui.MenuSeparatorRenderer", "goog.ui.registry"]);
goog.addDependency("/closure/goog/ui/serverchart.js", ["goog.ui.ServerChart", "goog.ui.ServerChart.AxisDisplayType", "goog.ui.ServerChart.ChartType", "goog.ui.ServerChart.EncodingType", "goog.ui.ServerChart.Event", "goog.ui.ServerChart.LegendPosition", "goog.ui.ServerChart.MaximumValue", "goog.ui.ServerChart.MultiAxisAlignment", "goog.ui.ServerChart.MultiAxisType", "goog.ui.ServerChart.UriParam", "goog.ui.ServerChart.UriTooLongEvent"], ["goog.Uri", "goog.array", "goog.asserts", "goog.events.Event", 
"goog.string", "goog.ui.Component"]);
goog.addDependency("/closure/goog/ui/slider.js", ["goog.ui.Slider", "goog.ui.Slider.Orientation"], ["goog.dom", "goog.dom.a11y", "goog.dom.a11y.Role", "goog.ui.SliderBase", "goog.ui.SliderBase.Orientation"]);
goog.addDependency("/closure/goog/ui/sliderbase.js", ["goog.ui.SliderBase", "goog.ui.SliderBase.Orientation"], ["goog.Timer", "goog.dom", "goog.dom.a11y", "goog.dom.a11y.Role", "goog.dom.a11y.State", "goog.dom.classes", "goog.events", "goog.events.EventType", "goog.events.KeyCodes", "goog.events.KeyHandler", "goog.events.KeyHandler.EventType", "goog.events.MouseWheelHandler", "goog.events.MouseWheelHandler.EventType", "goog.fx.AnimationParallelQueue", "goog.fx.Dragger", "goog.fx.Dragger.EventType", 
"goog.fx.Transition.EventType", "goog.fx.dom.ResizeHeight", "goog.fx.dom.ResizeWidth", "goog.fx.dom.Slide", "goog.math", "goog.math.Coordinate", "goog.style", "goog.style.bidi", "goog.ui.Component", "goog.ui.Component.EventType", "goog.ui.RangeModel"]);
goog.addDependency("/closure/goog/ui/splitbehavior.js", ["goog.ui.SplitBehavior", "goog.ui.SplitBehavior.DefaultHandlers"], ["goog.Disposable", "goog.array", "goog.dispose", "goog.dom", "goog.dom.DomHelper", "goog.dom.classes", "goog.events", "goog.events.EventHandler", "goog.events.EventType", "goog.string", "goog.ui.ButtonSide", "goog.ui.Component", "goog.ui.Component.Error", "goog.ui.INLINE_BLOCK_CLASSNAME", "goog.ui.decorate", "goog.ui.registry"]);
goog.addDependency("/closure/goog/ui/splitpane.js", ["goog.ui.SplitPane", "goog.ui.SplitPane.Orientation"], ["goog.dom", "goog.dom.classes", "goog.events.EventType", "goog.fx.Dragger", "goog.fx.Dragger.EventType", "goog.math.Rect", "goog.math.Size", "goog.style", "goog.ui.Component", "goog.ui.Component.EventType", "goog.userAgent"]);
goog.addDependency("/closure/goog/ui/style/app/buttonrenderer.js", ["goog.ui.style.app.ButtonRenderer"], ["goog.dom.classes", "goog.ui.Button", "goog.ui.ControlContent", "goog.ui.CustomButtonRenderer", "goog.ui.INLINE_BLOCK_CLASSNAME", "goog.ui.registry"]);
goog.addDependency("/closure/goog/ui/style/app/menubuttonrenderer.js", ["goog.ui.style.app.MenuButtonRenderer"], ["goog.array", "goog.dom", "goog.dom.a11y.Role", "goog.style", "goog.ui.ControlContent", "goog.ui.Menu", "goog.ui.MenuRenderer", "goog.ui.style.app.ButtonRenderer"]);
goog.addDependency("/closure/goog/ui/style/app/primaryactionbuttonrenderer.js", ["goog.ui.style.app.PrimaryActionButtonRenderer"], ["goog.ui.Button", "goog.ui.registry", "goog.ui.style.app.ButtonRenderer"]);
goog.addDependency("/closure/goog/ui/submenu.js", ["goog.ui.SubMenu"], ["goog.Timer", "goog.dom", "goog.dom.classes", "goog.events.KeyCodes", "goog.positioning.AnchoredViewportPosition", "goog.positioning.Corner", "goog.style", "goog.ui.Component", "goog.ui.Component.EventType", "goog.ui.Component.State", "goog.ui.ControlContent", "goog.ui.Menu", "goog.ui.MenuItem", "goog.ui.SubMenuRenderer", "goog.ui.registry"]);
goog.addDependency("/closure/goog/ui/submenurenderer.js", ["goog.ui.SubMenuRenderer"], ["goog.dom", "goog.dom.a11y", "goog.dom.a11y.State", "goog.dom.classes", "goog.style", "goog.ui.Menu", "goog.ui.MenuItemRenderer"]);
goog.addDependency("/closure/goog/ui/tab.js", ["goog.ui.Tab"], ["goog.ui.Component.State", "goog.ui.Control", "goog.ui.ControlContent", "goog.ui.TabRenderer", "goog.ui.registry"]);
goog.addDependency("/closure/goog/ui/tabbar.js", ["goog.ui.TabBar", "goog.ui.TabBar.Location"], ["goog.ui.Component.EventType", "goog.ui.Container", "goog.ui.Container.Orientation", "goog.ui.Tab", "goog.ui.TabBarRenderer", "goog.ui.registry"]);
goog.addDependency("/closure/goog/ui/tabbarrenderer.js", ["goog.ui.TabBarRenderer"], ["goog.dom.a11y.Role", "goog.object", "goog.ui.ContainerRenderer"]);
goog.addDependency("/closure/goog/ui/tablesorter.js", ["goog.ui.TableSorter", "goog.ui.TableSorter.EventType"], ["goog.array", "goog.dom", "goog.dom.TagName", "goog.dom.classes", "goog.events", "goog.events.EventType", "goog.functions", "goog.ui.Component"]);
goog.addDependency("/closure/goog/ui/tabpane.js", ["goog.ui.TabPane", "goog.ui.TabPane.Events", "goog.ui.TabPane.TabLocation", "goog.ui.TabPane.TabPage", "goog.ui.TabPaneEvent"], ["goog.dom", "goog.dom.classes", "goog.events", "goog.events.Event", "goog.events.EventTarget", "goog.events.EventType", "goog.events.KeyCodes", "goog.style"]);
goog.addDependency("/closure/goog/ui/tabrenderer.js", ["goog.ui.TabRenderer"], ["goog.dom.a11y.Role", "goog.ui.Component.State", "goog.ui.ControlRenderer"]);
goog.addDependency("/closure/goog/ui/textarea.js", ["goog.ui.Textarea", "goog.ui.Textarea.EventType"], ["goog.Timer", "goog.events.EventType", "goog.events.KeyCodes", "goog.style", "goog.ui.Control", "goog.ui.TextareaRenderer", "goog.userAgent", "goog.userAgent.product"]);
goog.addDependency("/closure/goog/ui/textarearenderer.js", ["goog.ui.TextareaRenderer"], ["goog.ui.Component.State", "goog.ui.ControlRenderer"]);
goog.addDependency("/closure/goog/ui/togglebutton.js", ["goog.ui.ToggleButton"], ["goog.ui.Button", "goog.ui.Component.State", "goog.ui.ControlContent", "goog.ui.CustomButtonRenderer", "goog.ui.registry"]);
goog.addDependency("/closure/goog/ui/toolbar.js", ["goog.ui.Toolbar"], ["goog.ui.Container", "goog.ui.ToolbarRenderer"]);
goog.addDependency("/closure/goog/ui/toolbarbutton.js", ["goog.ui.ToolbarButton"], ["goog.ui.Button", "goog.ui.ControlContent", "goog.ui.ToolbarButtonRenderer", "goog.ui.registry"]);
goog.addDependency("/closure/goog/ui/toolbarbuttonrenderer.js", ["goog.ui.ToolbarButtonRenderer"], ["goog.ui.CustomButtonRenderer"]);
goog.addDependency("/closure/goog/ui/toolbarcolormenubutton.js", ["goog.ui.ToolbarColorMenuButton"], ["goog.ui.ColorMenuButton", "goog.ui.ControlContent", "goog.ui.ToolbarColorMenuButtonRenderer", "goog.ui.registry"]);
goog.addDependency("/closure/goog/ui/toolbarcolormenubuttonrenderer.js", ["goog.ui.ToolbarColorMenuButtonRenderer"], ["goog.dom.classes", "goog.ui.ColorMenuButtonRenderer", "goog.ui.ControlContent", "goog.ui.MenuButtonRenderer", "goog.ui.ToolbarMenuButtonRenderer"]);
goog.addDependency("/closure/goog/ui/toolbarmenubutton.js", ["goog.ui.ToolbarMenuButton"], ["goog.ui.ControlContent", "goog.ui.MenuButton", "goog.ui.ToolbarMenuButtonRenderer", "goog.ui.registry"]);
goog.addDependency("/closure/goog/ui/toolbarmenubuttonrenderer.js", ["goog.ui.ToolbarMenuButtonRenderer"], ["goog.ui.MenuButtonRenderer"]);
goog.addDependency("/closure/goog/ui/toolbarrenderer.js", ["goog.ui.ToolbarRenderer"], ["goog.dom.a11y.Role", "goog.ui.Container.Orientation", "goog.ui.ContainerRenderer", "goog.ui.Separator", "goog.ui.ToolbarSeparatorRenderer"]);
goog.addDependency("/closure/goog/ui/toolbarselect.js", ["goog.ui.ToolbarSelect"], ["goog.ui.ControlContent", "goog.ui.Select", "goog.ui.ToolbarMenuButtonRenderer", "goog.ui.registry"]);
goog.addDependency("/closure/goog/ui/toolbarseparator.js", ["goog.ui.ToolbarSeparator"], ["goog.ui.Separator", "goog.ui.ToolbarSeparatorRenderer", "goog.ui.registry"]);
goog.addDependency("/closure/goog/ui/toolbarseparatorrenderer.js", ["goog.ui.ToolbarSeparatorRenderer"], ["goog.dom.classes", "goog.ui.INLINE_BLOCK_CLASSNAME", "goog.ui.MenuSeparatorRenderer"]);
goog.addDependency("/closure/goog/ui/toolbartogglebutton.js", ["goog.ui.ToolbarToggleButton"], ["goog.ui.ControlContent", "goog.ui.ToggleButton", "goog.ui.ToolbarButtonRenderer", "goog.ui.registry"]);
goog.addDependency("/closure/goog/ui/tooltip.js", ["goog.ui.Tooltip", "goog.ui.Tooltip.CursorTooltipPosition", "goog.ui.Tooltip.ElementTooltipPosition", "goog.ui.Tooltip.State"], ["goog.Timer", "goog.array", "goog.dom", "goog.events", "goog.events.EventType", "goog.math.Box", "goog.math.Coordinate", "goog.positioning", "goog.positioning.AnchoredPosition", "goog.positioning.Corner", "goog.positioning.Overflow", "goog.positioning.OverflowStatus", "goog.positioning.ViewportPosition", "goog.structs.Set", 
"goog.style", "goog.ui.Popup", "goog.ui.PopupBase"]);
goog.addDependency("/closure/goog/ui/tree/basenode.js", ["goog.ui.tree.BaseNode", "goog.ui.tree.BaseNode.EventType"], ["goog.Timer", "goog.asserts", "goog.dom.a11y", "goog.events.KeyCodes", "goog.string", "goog.string.StringBuffer", "goog.style", "goog.ui.Component", "goog.userAgent"]);
goog.addDependency("/closure/goog/ui/tree/treecontrol.js", ["goog.ui.tree.TreeControl"], ["goog.debug.Logger", "goog.dom.a11y", "goog.dom.classes", "goog.events.EventType", "goog.events.FocusHandler", "goog.events.KeyHandler", "goog.events.KeyHandler.EventType", "goog.ui.tree.BaseNode", "goog.ui.tree.TreeNode", "goog.ui.tree.TypeAhead", "goog.userAgent"]);
goog.addDependency("/closure/goog/ui/tree/treenode.js", ["goog.ui.tree.TreeNode"], ["goog.ui.tree.BaseNode"]);
goog.addDependency("/closure/goog/ui/tree/typeahead.js", ["goog.ui.tree.TypeAhead", "goog.ui.tree.TypeAhead.Offset"], ["goog.array", "goog.events.KeyCodes", "goog.string", "goog.structs.Trie"]);
goog.addDependency("/closure/goog/ui/tristatemenuitem.js", ["goog.ui.TriStateMenuItem", "goog.ui.TriStateMenuItem.State"], ["goog.dom.classes", "goog.ui.Component.EventType", "goog.ui.Component.State", "goog.ui.ControlContent", "goog.ui.MenuItem", "goog.ui.TriStateMenuItemRenderer", "goog.ui.registry"]);
goog.addDependency("/closure/goog/ui/tristatemenuitemrenderer.js", ["goog.ui.TriStateMenuItemRenderer"], ["goog.dom.classes", "goog.ui.MenuItemRenderer"]);
goog.addDependency("/closure/goog/ui/twothumbslider.js", ["goog.ui.TwoThumbSlider"], ["goog.dom", "goog.dom.a11y", "goog.dom.a11y.Role", "goog.ui.SliderBase"]);
goog.addDependency("/closure/goog/ui/zippy.js", ["goog.ui.Zippy", "goog.ui.Zippy.Events", "goog.ui.ZippyEvent"], ["goog.dom", "goog.dom.a11y", "goog.dom.classes", "goog.events", "goog.events.Event", "goog.events.EventHandler", "goog.events.EventTarget", "goog.events.EventType", "goog.events.KeyCodes", "goog.style"]);
goog.addDependency("/closure/goog/uri/uri.js", ["goog.Uri", "goog.Uri.QueryData"], ["goog.array", "goog.string", "goog.structs", "goog.structs.Map", "goog.uri.utils", "goog.uri.utils.ComponentIndex"]);
goog.addDependency("/closure/goog/uri/utils.js", ["goog.uri.utils", "goog.uri.utils.ComponentIndex", "goog.uri.utils.QueryArray", "goog.uri.utils.QueryValue", "goog.uri.utils.StandardQueryParam"], ["goog.asserts", "goog.string", "goog.userAgent"]);
goog.addDependency("/closure/goog/useragent/adobereader.js", ["goog.userAgent.adobeReader"], ["goog.string", "goog.userAgent"]);
goog.addDependency("/closure/goog/useragent/flash.js", ["goog.userAgent.flash"], ["goog.string"]);
goog.addDependency("/closure/goog/useragent/iphoto.js", ["goog.userAgent.iphoto"], ["goog.string", "goog.userAgent"]);
goog.addDependency("/closure/goog/useragent/jscript.js", ["goog.userAgent.jscript"], ["goog.string"]);
goog.addDependency("/closure/goog/useragent/picasa.js", ["goog.userAgent.picasa"], ["goog.string", "goog.userAgent"]);
goog.addDependency("/closure/goog/useragent/platform.js", ["goog.userAgent.platform"], ["goog.userAgent"]);
goog.addDependency("/closure/goog/useragent/product.js", ["goog.userAgent.product"], ["goog.userAgent"]);
goog.addDependency("/closure/goog/useragent/product_isversion.js", ["goog.userAgent.product.isVersion"], ["goog.userAgent.product"]);
goog.addDependency("/closure/goog/useragent/useragent.js", ["goog.userAgent"], ["goog.string"]);
goog.addDependency("/closure/goog/vec/float32array.js", ["goog.vec.Float32Array"], []);
goog.addDependency("/closure/goog/vec/float64array.js", ["goog.vec.Float64Array"], []);
goog.addDependency("/closure/goog/vec/mat3.js", ["goog.vec.Mat3"], ["goog.vec", "goog.vec.Vec3"]);
goog.addDependency("/closure/goog/vec/mat4.js", ["goog.vec.Mat4"], ["goog.vec", "goog.vec.Vec3", "goog.vec.Vec4"]);
goog.addDependency("/closure/goog/vec/matrix3.js", ["goog.vec.Matrix3"], ["goog.vec"]);
goog.addDependency("/closure/goog/vec/matrix4.js", ["goog.vec.Matrix4"], ["goog.vec", "goog.vec.Vec3", "goog.vec.Vec4"]);
goog.addDependency("/closure/goog/vec/quaternion.js", ["goog.vec.Quaternion"], ["goog.vec", "goog.vec.Vec3", "goog.vec.Vec4"]);
goog.addDependency("/closure/goog/vec/ray.js", ["goog.vec.Ray"], ["goog.vec.Vec3"]);
goog.addDependency("/closure/goog/vec/vec.js", ["goog.vec"], ["goog.vec.Float32Array", "goog.vec.Float64Array"]);
goog.addDependency("/closure/goog/vec/vec2.js", ["goog.vec.Vec2"], ["goog.vec"]);
goog.addDependency("/closure/goog/vec/vec3.js", ["goog.vec.Vec3"], ["goog.vec"]);
goog.addDependency("/closure/goog/vec/vec4.js", ["goog.vec.Vec4"], ["goog.vec"]);
goog.addDependency("/closure/goog/webgl/webgl.js", ["goog.webgl"], []);
goog.addDependency("/closure/goog/window/window.js", ["goog.window"], ["goog.string", "goog.userAgent"]);
goog.addDependency("/soy/soyutils.js", [], []);
goog.addDependency("/soy/soyutils_usegoog.js", ["soy", "soy.StringBuilder", "soy.esc", "soydata", "soydata.SanitizedHtml", "soydata.SanitizedHtmlAttribute", "soydata.SanitizedJsStrChars", "soydata.SanitizedUri"], ["goog.asserts", "goog.dom.DomHelper", "goog.format", "goog.i18n.BidiFormatter", "goog.i18n.bidi", "goog.soy", "goog.string", "goog.string.StringBuffer"]);
goog.addDependency("/third_party/closure/goog/base.js", [], []);
goog.addDependency("/third_party/closure/goog/caja/string/html/htmlparser.js", ["goog.string.html.HtmlParser", "goog.string.html.HtmlParser.EFlags", "goog.string.html.HtmlParser.Elements", "goog.string.html.HtmlParser.Entities", "goog.string.html.HtmlSaxHandler"], []);
goog.addDependency("/third_party/closure/goog/caja/string/html/htmlsanitizer.js", ["goog.string.html.HtmlSanitizer", "goog.string.html.HtmlSanitizer.AttributeType", "goog.string.html.HtmlSanitizer.Attributes", "goog.string.html.htmlSanitize"], ["goog.string.StringBuffer", "goog.string.html.HtmlParser", "goog.string.html.HtmlParser.EFlags", "goog.string.html.HtmlParser.Elements", "goog.string.html.HtmlSaxHandler"]);
goog.addDependency("/third_party/closure/goog/dojo/dom/query.js", ["goog.dom.query"], ["goog.array", "goog.dom", "goog.functions", "goog.string", "goog.userAgent"]);
goog.addDependency("/third_party/closure/goog/dojo/dom/query_test.js", [], ["goog.dom", "goog.dom.query", "goog.testing.asserts"]);
goog.addDependency("/third_party/closure/goog/jpeg_encoder/jpeg_encoder_basic.js", ["goog.crypt.JpegEncoder"], ["goog.crypt.base64"]);
goog.addDependency("/third_party/closure/goog/loremipsum/text/loremipsum.js", ["goog.text.LoremIpsum"], ["goog.array", "goog.math", "goog.string", "goog.structs.Map", "goog.structs.Set"]);
goog.addDependency("/third_party/closure/goog/mochikit/async/deferred.js", ["goog.async.Deferred", "goog.async.Deferred.AlreadyCalledError", "goog.async.Deferred.CancelledError"], ["goog.array", "goog.asserts", "goog.debug.Error"]);
goog.addDependency("/third_party/closure/goog/mochikit/async/deferredlist.js", ["goog.async.DeferredList"], ["goog.array", "goog.async.Deferred"]);
goog.addDependency("/third_party/closure/goog/osapi/osapi.js", ["goog.osapi"], []);
goog.addDependency("/third_party/closure/goog/silverlight/clipboardbutton.js", ["goog.silverlight.ClipboardButton", "goog.silverlight.ClipboardButtonType", "goog.silverlight.ClipboardEvent", "goog.silverlight.CopyButton", "goog.silverlight.PasteButton", "goog.silverlight.PasteButtonEvent"], ["goog.asserts", "goog.events.Event", "goog.math.Size", "goog.silverlight", "goog.ui.Component"]);
goog.addDependency("/third_party/closure/goog/silverlight/silverlight.js", ["goog.silverlight"], []);
goog.addDependency("/third_party/closure/goog/silverlight/supporteduseragent.js", ["goog.silverlight.supportedUserAgent"], []);
goog.addDependency("build/src/internal/src/requireall.js", [], ["ol", "ol.AnchoredElement", "ol.AnchoredElementPositioning", "ol.AnchoredElementProperty", "ol.Attribution", "ol.BrowserFeature", "ol.Collection", "ol.CollectionEvent", "ol.CollectionEventType", "ol.Color", "ol.Constraints", "ol.Coordinate", "ol.CoordinateFormatType", "ol.Ellipsoid", "ol.Extent", "ol.FrameState", "ol.Geolocation", "ol.GeolocationProperty", "ol.IView", "ol.IView2D", "ol.IView3D", "ol.Image", "ol.ImageState", "ol.ImageTile", 
"ol.ImageUrlFunction", "ol.ImageUrlFunctionType", "ol.Kinetic", "ol.Map", "ol.MapBrowserEvent", "ol.MapBrowserEvent.EventType", "ol.MapBrowserEventHandler", "ol.MapEvent", "ol.MapEventType", "ol.MapProperty", "ol.Object", "ol.ObjectEventType", "ol.Pixel", "ol.PixelBounds", "ol.PostRenderFunction", "ol.PreRenderFunction", "ol.Projection", "ol.ProjectionUnits", "ol.Rectangle", "ol.RendererHint", "ol.RendererHints", "ol.ResolutionConstraint", "ol.ResolutionConstraintType", "ol.RotationConstraint", "ol.RotationConstraintType", 
"ol.Size", "ol.Sphere", "ol.Tile", "ol.TileCache", "ol.TileCoord", "ol.TilePriorityFunction", "ol.TileQueue", "ol.TileRange", "ol.TileState", "ol.TileUrlFunction", "ol.TileUrlFunctionType", "ol.TransformFunction", "ol.View", "ol.View2D", "ol.View2DProperty", "ol.View2DState", "ol.ViewHint", "ol.animation", "ol.array", "ol.canvas", "ol.control.Attribution", "ol.control.Control", "ol.control.ControlOptions", "ol.control.DragBox", "ol.control.MousePosition", "ol.control.ScaleLine", "ol.control.ScaleLineUnits", 
"ol.control.Zoom", "ol.dom", "ol.dom.BrowserFeature", "ol.easing", "ol.ellipsoid.WGS84", "ol.interaction.ConditionType", "ol.interaction.DblClickZoom", "ol.interaction.Drag", "ol.interaction.DragPan", "ol.interaction.DragRotate", "ol.interaction.DragRotateAndZoom", "ol.interaction.DragZoom", "ol.interaction.Interaction", "ol.interaction.Keyboard", "ol.interaction.KeyboardPan", "ol.interaction.KeyboardZoom", "ol.interaction.MouseWheelZoom", "ol.interaction.Touch", "ol.interaction.TouchPan", "ol.interaction.TouchRotate", 
"ol.interaction.TouchZoom", "ol.interaction.condition", "ol.layer.ImageLayer", "ol.layer.Layer", "ol.layer.LayerProperty", "ol.layer.LayerState", "ol.layer.TileLayer", "ol.math", "ol.parser.XML", "ol.parser.ogc.ExceptionReport", "ol.parser.ogc.OWSCommon_v1", "ol.parser.ogc.OWSCommon_v1_1_0", "ol.parser.ogc.Versioned", "ol.parser.ogc.WMSCapabilities", "ol.parser.ogc.WMSCapabilities_v1", "ol.parser.ogc.WMSCapabilities_v1_1", "ol.parser.ogc.WMSCapabilities_v1_1_0", "ol.parser.ogc.WMSCapabilities_v1_1_1", 
"ol.parser.ogc.WMSCapabilities_v1_1_1_WMSC", "ol.parser.ogc.WMSCapabilities_v1_3_0", "ol.parser.ogc.WMTSCapabilities", "ol.parser.ogc.WMTSCapabilities_v1_0_0", "ol.projection", "ol.projection.EPSG3857", "ol.projection.EPSG4326", "ol.projection.addCommonProjections", "ol.renderer.Layer", "ol.renderer.Map", "ol.renderer.canvas.ImageLayer", "ol.renderer.canvas.Layer", "ol.renderer.canvas.Map", "ol.renderer.canvas.SUPPORTED", "ol.renderer.canvas.TileLayer", "ol.renderer.dom.ImageLayer", "ol.renderer.dom.Layer", 
"ol.renderer.dom.Map", "ol.renderer.dom.SUPPORTED", "ol.renderer.dom.TileLayer", "ol.renderer.webgl.FragmentShader", "ol.renderer.webgl.ImageLayer", "ol.renderer.webgl.Layer", "ol.renderer.webgl.Map", "ol.renderer.webgl.SUPPORTED", "ol.renderer.webgl.TileLayer", "ol.renderer.webgl.VertexShader", "ol.renderer.webgl.map.shader", "ol.renderer.webgl.tilelayerrenderer", "ol.renderer.webgl.tilelayerrenderer.shader.Fragment", "ol.renderer.webgl.tilelayerrenderer.shader.Vertex", "ol.source.BingMaps", "ol.source.DebugTileSource", 
"ol.source.ImageSource", "ol.source.ImageTileSource", "ol.source.ImageTileSourceOptions", "ol.source.MapQuestOSM", "ol.source.MapQuestOpenAerial", "ol.source.OpenStreetMap", "ol.source.SingleImageWMS", "ol.source.Source", "ol.source.Stamen", "ol.source.StaticImage", "ol.source.TileJSON", "ol.source.TileSource", "ol.source.TileSourceOptions", "ol.source.TiledWMS", "ol.source.XYZ", "ol.source.XYZOptions", "ol.source.wms", "ol.sphere.NORMAL", "ol.sphere.WGS84", "ol.structs.LRUCache", "ol.tilegrid.TileGrid", 
"ol.tilegrid.XYZ", "ol.tilejson", "ol.vec.Mat4", "ol.webgl", "ol.webgl.WebGLContextEventType"]);
goog.addDependency("build/src/internal/src/types.js", ["ol.AnchoredElementOptionsType", "ol.MapOptionsType", "ol.View2DOptionsType", "ol.animation.BounceOptionsType", "ol.animation.PanOptionsType", "ol.animation.RotateOptionsType", "ol.animation.ZoomOptionsType", "ol.control.AttributionOptionsType", "ol.control.MousePositionOptionsType", "ol.control.ScaleLineOptionsType", "ol.control.ZoomOptionsType", "ol.layer.LayerOptionsType", "ol.source.BingMapsOptionsType", "ol.source.DebugTileSourceOptionsType", 
"ol.source.SingleImageWMSOptionsType", "ol.source.StamenOptionsType", "ol.source.StaticImageOptionsType", "ol.source.TiledWMSOptionsType", "ol.tilegrid.TileGridOptionsType", "ol.tilegrid.XYZOptionsType"], []);
goog.addDependency("src/ol/anchoredelement.js", ["ol.AnchoredElement", "ol.AnchoredElementPositioning", "ol.AnchoredElementProperty"], ["goog.dom", "goog.events", "goog.style", "ol.Coordinate", "ol.Map", "ol.MapEventType", "ol.Object"]);
goog.addDependency("src/ol/animation.js", ["ol.animation"], ["goog.fx.easing", "ol.PreRenderFunction", "ol.ViewHint", "ol.easing"]);
goog.addDependency("src/ol/array.js", ["ol.array"], ["goog.array"]);
goog.addDependency("src/ol/attribution.js", ["ol.Attribution"], ["ol.TileRange"]);
goog.addDependency("src/ol/browserfeature.js", ["ol.BrowserFeature"], []);
goog.addDependency("src/ol/canvas/canvas.js", ["ol.canvas"], ["goog.dom", "goog.dom.TagName"]);
goog.addDependency("src/ol/collection.js", ["ol.Collection", "ol.CollectionEvent", "ol.CollectionEventType"], ["goog.array", "goog.events.Event", "ol.Object"]);
goog.addDependency("src/ol/color.js", ["ol.Color"], ["goog.color", "goog.math"]);
goog.addDependency("src/ol/constraints.js", ["ol.Constraints"], ["ol.ResolutionConstraintType", "ol.RotationConstraintType"]);
goog.addDependency("src/ol/control/attributioncontrol.js", ["ol.control.Attribution"], ["goog.array", "goog.dom", "goog.dom.TagName", "goog.events", "goog.object", "goog.style", "ol.Attribution", "ol.FrameState", "ol.MapEvent", "ol.MapEventType", "ol.TileRange", "ol.control.Control", "ol.source.Source"]);
goog.addDependency("src/ol/control/control.js", ["ol.control.Control", "ol.control.ControlOptions"], ["goog.Disposable"]);
goog.addDependency("src/ol/control/dragboxcontrol.js", ["ol.control.DragBox"], ["goog.asserts", "goog.dom", "goog.dom.TagName", "goog.events", "goog.style", "ol.Coordinate", "ol.MapBrowserEvent", "ol.MapBrowserEvent.EventType", "ol.Pixel", "ol.Size", "ol.control.Control"]);
goog.addDependency("src/ol/control/mousepositioncontrol.js", ["ol.control.MousePosition"], ["goog.array", "goog.dom", "goog.events", "goog.events.EventType", "goog.style", "ol.Coordinate", "ol.CoordinateFormatType", "ol.MapEvent", "ol.MapEventType", "ol.Pixel", "ol.Projection", "ol.TransformFunction", "ol.control.Control", "ol.projection"]);
goog.addDependency("src/ol/control/scalelinecontrol.js", ["ol.control.ScaleLine", "ol.control.ScaleLineUnits"], ["goog.dom", "goog.style", "ol.FrameState", "ol.MapEvent", "ol.MapEventType", "ol.ProjectionUnits", "ol.TransformFunction", "ol.control.Control", "ol.projection", "ol.sphere.NORMAL"]);
goog.addDependency("src/ol/control/zoomcontrol.js", ["ol.control.Zoom"], ["goog.dom", "goog.dom.TagName", "goog.events", "goog.events.EventType", "ol.control.Control"]);
goog.addDependency("src/ol/coordinate.js", ["ol.Coordinate", "ol.CoordinateFormatType"], ["goog.math", "goog.math.Vec2"]);
goog.addDependency("src/ol/dom/dom.js", ["ol.dom", "ol.dom.BrowserFeature"], ["goog.vec.Mat4"]);
goog.addDependency("src/ol/easing.js", ["ol.easing"], []);
goog.addDependency("src/ol/ellipsoid.js", ["ol.Ellipsoid"], ["goog.math", "ol.Coordinate"]);
goog.addDependency("src/ol/ellipsoid/wgs84.js", ["ol.ellipsoid.WGS84"], ["ol.Ellipsoid"]);
goog.addDependency("src/ol/extent.js", ["ol.Extent"], ["ol.Coordinate", "ol.Rectangle", "ol.TransformFunction"]);
goog.addDependency("src/ol/framestate.js", ["ol.FrameState", "ol.PostRenderFunction", "ol.PreRenderFunction"], ["goog.vec.Mat4", "ol.Attribution", "ol.Color", "ol.Extent", "ol.Size", "ol.TileQueue", "ol.TileRange", "ol.View2DState", "ol.layer.Layer", "ol.layer.LayerState"]);
goog.addDependency("src/ol/geolocation.js", ["ol.Geolocation", "ol.GeolocationProperty"], ["goog.functions", "goog.math", "ol.Coordinate", "ol.Object", "ol.Projection", "ol.projection"]);
goog.addDependency("src/ol/image.js", ["ol.Image", "ol.ImageState"], ["goog.array", "goog.events", "goog.events.EventTarget", "goog.events.EventType", "ol.Attribution", "ol.Extent"]);
goog.addDependency("src/ol/imagetile.js", ["ol.ImageTile"], ["goog.array", "goog.events", "goog.events.EventType", "ol.Tile", "ol.TileCoord", "ol.TileState"]);
goog.addDependency("src/ol/imageurlfunction.js", ["ol.ImageUrlFunction", "ol.ImageUrlFunctionType"], ["ol.Extent", "ol.Size", "ol.source.wms"]);
goog.addDependency("src/ol/interaction/condition.js", ["ol.interaction.ConditionType", "ol.interaction.condition"], []);
goog.addDependency("src/ol/interaction/dblclickzoominteraction.js", ["ol.interaction.DblClickZoom"], ["ol.MapBrowserEvent", "ol.MapBrowserEvent.EventType", "ol.View2D", "ol.interaction.Interaction"]);
goog.addDependency("src/ol/interaction/draginteraction.js", ["ol.interaction.Drag"], ["goog.asserts", "goog.functions", "ol.Coordinate", "ol.MapBrowserEvent", "ol.MapBrowserEvent.EventType", "ol.interaction.Interaction"]);
goog.addDependency("src/ol/interaction/dragpaninteraction.js", ["ol.interaction.DragPan"], ["goog.asserts", "ol.Coordinate", "ol.Kinetic", "ol.Pixel", "ol.PreRenderFunction", "ol.View2D", "ol.ViewHint", "ol.interaction.ConditionType", "ol.interaction.Drag"]);
goog.addDependency("src/ol/interaction/dragrotateandzoominteraction.js", ["ol.interaction.DragRotateAndZoom"], ["goog.math.Vec2", "ol.View2D", "ol.interaction.ConditionType", "ol.interaction.Drag"]);
goog.addDependency("src/ol/interaction/dragrotateinteraction.js", ["ol.interaction.DragRotate"], ["ol.View2D", "ol.ViewHint", "ol.interaction.ConditionType", "ol.interaction.Drag"]);
goog.addDependency("src/ol/interaction/dragzoominteraction.js", ["ol.interaction.DragZoom"], ["ol.Extent", "ol.Size", "ol.View2D", "ol.control.DragBox", "ol.interaction.ConditionType", "ol.interaction.Drag"]);
goog.addDependency("src/ol/interaction/interaction.js", ["ol.interaction.Interaction"], ["ol.MapBrowserEvent"]);
goog.addDependency("src/ol/interaction/keyboardinteraction.js", ["ol.interaction.Keyboard"], ["ol.interaction.Interaction"]);
goog.addDependency("src/ol/interaction/keyboardpaninteraction.js", ["ol.interaction.KeyboardPan"], ["goog.events.KeyCodes", "goog.events.KeyHandler.EventType", "ol.Coordinate", "ol.View2D", "ol.interaction.Interaction"]);
goog.addDependency("src/ol/interaction/keyboardzoominteraction.js", ["ol.interaction.KeyboardZoom"], ["goog.events.KeyHandler.EventType", "ol.View2D", "ol.interaction.Interaction"]);
goog.addDependency("src/ol/interaction/mousewheelzoominteraction.js", ["ol.interaction.MouseWheelZoom"], ["goog.events.MouseWheelEvent", "goog.events.MouseWheelHandler.EventType", "goog.math", "ol.Coordinate", "ol.View2D", "ol.interaction.Interaction"]);
goog.addDependency("src/ol/interaction/touchinteraction.js", ["ol.interaction.Touch"], ["goog.functions", "ol.MapBrowserEvent", "ol.MapBrowserEvent.EventType", "ol.Pixel", "ol.interaction.Interaction"]);
goog.addDependency("src/ol/interaction/touchpaninteraction.js", ["ol.interaction.TouchPan"], ["goog.asserts", "ol.Coordinate", "ol.Kinetic", "ol.Pixel", "ol.PreRenderFunction", "ol.View", "ol.ViewHint", "ol.interaction.Touch"]);
goog.addDependency("src/ol/interaction/touchrotateinteraction.js", ["ol.interaction.TouchRotate"], ["goog.asserts", "ol.View", "ol.ViewHint", "ol.interaction.Touch"]);
goog.addDependency("src/ol/interaction/touchzoominteraction.js", ["ol.interaction.TouchZoom"], ["goog.asserts", "ol.View", "ol.ViewHint", "ol.interaction.Touch"]);
goog.addDependency("src/ol/iview.js", ["ol.IView"], ["ol.IView2D", "ol.IView3D"]);
goog.addDependency("src/ol/iview2d.js", ["ol.IView2D", "ol.View2DState"], ["ol.Coordinate", "ol.Projection"]);
goog.addDependency("src/ol/iview3d.js", ["ol.IView3D"], []);
goog.addDependency("src/ol/kinetic.js", ["ol.Kinetic"], ["ol.Coordinate", "ol.PreRenderFunction", "ol.animation"]);
goog.addDependency("src/ol/layer/imagelayer.js", ["ol.layer.ImageLayer"], ["ol.layer.Layer", "ol.source.ImageSource"]);
goog.addDependency("src/ol/layer/layer.js", ["ol.layer.Layer", "ol.layer.LayerProperty", "ol.layer.LayerState"], ["goog.events", "goog.events.EventType", "goog.math", "ol.Object", "ol.source.Source"]);
goog.addDependency("src/ol/layer/tilelayer.js", ["ol.layer.TileLayer"], ["ol.layer.Layer", "ol.source.TileSource"]);
goog.addDependency("src/ol/map.js", ["ol.Map", "ol.MapProperty", "ol.RendererHint", "ol.RendererHints"], ["goog.Uri.QueryData", "goog.async.AnimationDelay", "goog.debug.Logger", "goog.dom", "goog.dom.ViewportSizeMonitor", "goog.events", "goog.events.BrowserEvent", "goog.events.Event", "goog.events.EventType", "goog.events.KeyHandler", "goog.events.KeyHandler.EventType", "goog.events.MouseWheelHandler", "goog.events.MouseWheelHandler.EventType", "ol.BrowserFeature", "ol.Collection", "ol.Color", "ol.Coordinate", 
"ol.Extent", "ol.FrameState", "ol.IView", "ol.Kinetic", "ol.MapBrowserEvent", "ol.MapBrowserEvent.EventType", "ol.MapBrowserEventHandler", "ol.MapEvent", "ol.MapEventType", "ol.Object", "ol.ObjectEventType", "ol.Pixel", "ol.PostRenderFunction", "ol.PreRenderFunction", "ol.Size", "ol.Tile", "ol.TileQueue", "ol.View", "ol.View2D", "ol.control.Attribution", "ol.control.Control", "ol.control.ScaleLine", "ol.control.Zoom", "ol.interaction.DblClickZoom", "ol.interaction.DragPan", "ol.interaction.DragRotate", 
"ol.interaction.DragZoom", "ol.interaction.Interaction", "ol.interaction.KeyboardPan", "ol.interaction.KeyboardZoom", "ol.interaction.MouseWheelZoom", "ol.interaction.TouchPan", "ol.interaction.TouchRotate", "ol.interaction.TouchZoom", "ol.interaction.condition", "ol.layer.Layer", "ol.projection", "ol.projection.addCommonProjections", "ol.renderer.Map", "ol.renderer.canvas.Map", "ol.renderer.canvas.SUPPORTED", "ol.renderer.dom.Map", "ol.renderer.dom.SUPPORTED", "ol.renderer.webgl.Map", "ol.renderer.webgl.SUPPORTED"]);
goog.addDependency("src/ol/mapbrowserevent.js", ["ol.MapBrowserEvent", "ol.MapBrowserEvent.EventType", "ol.MapBrowserEventHandler"], ["goog.array", "goog.events.BrowserEvent", "goog.events.EventTarget", "goog.events.EventType", "goog.style", "ol.BrowserFeature", "ol.Coordinate", "ol.FrameState", "ol.MapEvent", "ol.Pixel"]);
goog.addDependency("src/ol/mapevent.js", ["ol.MapEvent", "ol.MapEventType"], ["goog.events.Event", "ol.FrameState"]);
goog.addDependency("src/ol/math.js", ["ol.math"], []);
goog.addDependency("src/ol/object.js", ["ol.Object", "ol.ObjectEventType"], ["goog.array", "goog.events", "goog.events.EventTarget", "goog.object"]);
goog.addDependency("src/ol/ol.js", ["ol"], ["goog.debug.Logger"]);
goog.addDependency("src/ol/parser/ogc/exceptionreport.js", ["ol.parser.ogc.ExceptionReport"], ["goog.dom.xml", "ol.parser.XML"]);
goog.addDependency("src/ol/parser/ogc/owscommon_v1.js", ["ol.parser.ogc.OWSCommon_v1"], ["ol.Extent", "ol.parser.XML"]);
goog.addDependency("src/ol/parser/ogc/owscommon_v1_1_0.js", ["ol.parser.ogc.OWSCommon_v1_1_0"], ["goog.object", "ol.parser.ogc.OWSCommon_v1"]);
goog.addDependency("src/ol/parser/ogc/versioned.js", ["ol.parser.ogc.Versioned"], ["goog.dom.xml", "ol.parser.ogc.ExceptionReport"]);
goog.addDependency("src/ol/parser/ogc/wmscapabilities.js", ["ol.parser.ogc.WMSCapabilities"], ["ol.parser.ogc.Versioned", "ol.parser.ogc.WMSCapabilities_v1_1_0", "ol.parser.ogc.WMSCapabilities_v1_1_1", "ol.parser.ogc.WMSCapabilities_v1_1_1_WMSC", "ol.parser.ogc.WMSCapabilities_v1_3_0"]);
goog.addDependency("src/ol/parser/ogc/wmscapabilities_v1.js", ["ol.parser.ogc.WMSCapabilities_v1"], ["goog.dom.xml", "goog.object", "ol.parser.XML"]);
goog.addDependency("src/ol/parser/ogc/wmscapabilities_v1_1.js", ["ol.parser.ogc.WMSCapabilities_v1_1"], ["ol.parser.ogc.WMSCapabilities_v1"]);
goog.addDependency("src/ol/parser/ogc/wmscapabilities_v1_1_0.js", ["ol.parser.ogc.WMSCapabilities_v1_1_0"], ["ol.parser.ogc.WMSCapabilities_v1_1"]);
goog.addDependency("src/ol/parser/ogc/wmscapabilities_v1_1_1.js", ["ol.parser.ogc.WMSCapabilities_v1_1_1"], ["ol.parser.ogc.WMSCapabilities_v1_1"]);
goog.addDependency("src/ol/parser/ogc/wmscapabilities_v1_1_1_WMSC.js", ["ol.parser.ogc.WMSCapabilities_v1_1_1_WMSC"], ["ol.parser.ogc.WMSCapabilities_v1_1_1"]);
goog.addDependency("src/ol/parser/ogc/wmscapabilities_v1_3_0.js", ["ol.parser.ogc.WMSCapabilities_v1_3_0"], ["ol.parser.ogc.WMSCapabilities_v1"]);
goog.addDependency("src/ol/parser/ogc/wmtscapabilities.js", ["ol.parser.ogc.WMTSCapabilities"], ["ol.parser.ogc.Versioned", "ol.parser.ogc.WMTSCapabilities_v1_0_0"]);
goog.addDependency("src/ol/parser/ogc/wmtscapabilities_v1_0_0.js", ["ol.parser.ogc.WMTSCapabilities_v1_0_0"], ["goog.dom.xml", "ol.Coordinate", "ol.parser.XML", "ol.parser.ogc.OWSCommon_v1_1_0", "ol.projection"]);
goog.addDependency("src/ol/parser/xml.js", ["ol.parser.XML"], []);
goog.addDependency("src/ol/pixel.js", ["ol.Pixel"], ["goog.math.Coordinate"]);
goog.addDependency("src/ol/pixelbounds.js", ["ol.PixelBounds"], ["ol.Rectangle"]);
goog.addDependency("src/ol/projection.js", ["ol.Projection", "ol.ProjectionUnits", "ol.projection"], ["goog.array", "goog.asserts", "goog.object", "ol.Coordinate", "ol.Extent", "ol.TransformFunction", "ol.sphere.NORMAL"]);
goog.addDependency("src/ol/projection/common.js", ["ol.projection.addCommonProjections"], ["ol.projection", "ol.projection.EPSG3857", "ol.projection.EPSG4326"]);
goog.addDependency("src/ol/projection/epsg3857.js", ["ol.projection.EPSG3857"], ["goog.array", "ol.Extent", "ol.Projection", "ol.ProjectionUnits", "ol.math", "ol.projection"]);
goog.addDependency("src/ol/projection/epsg4326.js", ["ol.projection.EPSG4326"], ["ol.Extent", "ol.Projection", "ol.ProjectionUnits", "ol.projection"]);
goog.addDependency("src/ol/rectangle.js", ["ol.Rectangle"], ["goog.asserts", "ol.Coordinate", "ol.Size"]);
goog.addDependency("src/ol/renderer/canvas/canvasimagelayerrenderer.js", ["ol.renderer.canvas.ImageLayer"], ["goog.vec.Mat4", "ol.Image", "ol.ImageState", "ol.ViewHint", "ol.layer.ImageLayer", "ol.renderer.Map", "ol.renderer.canvas.Layer"]);
goog.addDependency("src/ol/renderer/canvas/canvaslayerrenderer.js", ["ol.renderer.canvas.Layer"], ["ol.layer.Layer", "ol.renderer.Layer"]);
goog.addDependency("src/ol/renderer/canvas/canvasmaprenderer.js", ["ol.renderer.canvas.Map"], ["goog.array", "goog.dom", "goog.style", "goog.vec.Mat4", "ol.Size", "ol.layer.ImageLayer", "ol.layer.TileLayer", "ol.renderer.Map", "ol.renderer.canvas.ImageLayer", "ol.renderer.canvas.TileLayer"]);
goog.addDependency("src/ol/renderer/canvas/canvasrenderer.js", ["ol.renderer.canvas.SUPPORTED"], ["ol.canvas"]);
goog.addDependency("src/ol/renderer/canvas/canvastilelayerrenderer.js", ["ol.renderer.canvas.TileLayer"], ["goog.array", "goog.dom", "goog.vec.Mat4", "ol.Size", "ol.Tile", "ol.TileCoord", "ol.TileState", "ol.layer.TileLayer", "ol.renderer.Map", "ol.renderer.canvas.Layer"]);
goog.addDependency("src/ol/renderer/dom/domimagelayerrenderer.js", ["ol.renderer.dom.ImageLayer"], ["goog.dom", "goog.vec.Mat4", "ol.Image", "ol.ImageState", "ol.ViewHint", "ol.dom", "ol.layer.ImageLayer", "ol.renderer.dom.Layer"]);
goog.addDependency("src/ol/renderer/dom/domlayerrenderer.js", ["ol.renderer.dom.Layer"], ["ol.layer.Layer", "ol.renderer.Layer"]);
goog.addDependency("src/ol/renderer/dom/dommaprenderer.js", ["ol.renderer.dom.Map"], ["goog.array", "goog.asserts", "goog.dom", "goog.dom.TagName", "goog.style", "ol.layer.ImageLayer", "ol.layer.TileLayer", "ol.renderer.Map", "ol.renderer.dom.ImageLayer", "ol.renderer.dom.TileLayer"]);
goog.addDependency("src/ol/renderer/dom/domrenderer.js", ["ol.renderer.dom.SUPPORTED"], []);
goog.addDependency("src/ol/renderer/dom/domtilelayerrenderer.js", ["ol.renderer.dom.TileLayer"], ["goog.asserts", "goog.dom", "goog.style", "goog.vec.Mat4", "ol.Coordinate", "ol.Extent", "ol.Tile", "ol.TileCoord", "ol.TileState", "ol.ViewHint", "ol.dom", "ol.layer.TileLayer", "ol.renderer.dom.Layer", "ol.tilegrid.TileGrid"]);
goog.addDependency("src/ol/renderer/layerrenderer.js", ["ol.renderer.Layer"], ["goog.events", "goog.events.EventType", "ol.Attribution", "ol.FrameState", "ol.Image", "ol.ImageState", "ol.Object", "ol.Tile", "ol.TileCoord", "ol.TileRange", "ol.TileState", "ol.layer.Layer", "ol.layer.LayerProperty", "ol.layer.LayerState", "ol.source.TileSource"]);
goog.addDependency("src/ol/renderer/maprenderer.js", ["ol.renderer.Map"], ["goog.Disposable", "goog.array", "goog.asserts", "goog.events", "goog.functions", "goog.vec.Mat4", "ol.CollectionEvent", "ol.CollectionEventType", "ol.FrameState", "ol.Object", "ol.layer.Layer", "ol.renderer.Layer"]);
goog.addDependency("src/ol/renderer/webgl/shader.js", ["ol.renderer.webgl.FragmentShader", "ol.renderer.webgl.VertexShader"], ["goog.functions", "goog.webgl"]);
goog.addDependency("src/ol/renderer/webgl/webglimagelayerrenderer.js", ["ol.renderer.webgl.ImageLayer"], ["goog.vec.Mat4", "ol.Coordinate", "ol.Extent", "ol.Image", "ol.ImageState", "ol.ViewHint", "ol.layer.ImageLayer", "ol.renderer.webgl.Layer"]);
goog.addDependency("src/ol/renderer/webgl/webgllayerrenderer.js", ["ol.renderer.webgl.Layer"], ["goog.vec.Mat4", "ol.layer.Layer", "ol.renderer.Layer", "ol.vec.Mat4"]);
goog.addDependency("src/ol/renderer/webgl/webglmaprenderer.js", ["ol.renderer.webgl.Map", "ol.renderer.webgl.map.shader"], ["goog.array", "goog.debug.Logger", "goog.dom", "goog.dom.TagName", "goog.events", "goog.events.Event", "goog.style", "goog.webgl", "ol.FrameState", "ol.Size", "ol.Tile", "ol.layer.ImageLayer", "ol.layer.TileLayer", "ol.renderer.Map", "ol.renderer.webgl.FragmentShader", "ol.renderer.webgl.ImageLayer", "ol.renderer.webgl.TileLayer", "ol.renderer.webgl.VertexShader", "ol.structs.LRUCache", 
"ol.webgl", "ol.webgl.WebGLContextEventType"]);
goog.addDependency("src/ol/renderer/webgl/webglrenderer.js", ["ol.renderer.webgl.SUPPORTED"], ["ol.webgl"]);
goog.addDependency("src/ol/renderer/webgl/webgltilelayerrenderer.js", ["ol.renderer.webgl.TileLayer", "ol.renderer.webgl.tilelayerrenderer", "ol.renderer.webgl.tilelayerrenderer.shader.Fragment", "ol.renderer.webgl.tilelayerrenderer.shader.Vertex"], ["goog.array", "goog.object", "goog.structs.PriorityQueue", "goog.vec.Mat4", "goog.vec.Vec4", "goog.webgl", "ol.Extent", "ol.FrameState", "ol.Size", "ol.Tile", "ol.TileCoord", "ol.TileRange", "ol.TileState", "ol.layer.TileLayer", "ol.renderer.webgl.FragmentShader", 
"ol.renderer.webgl.Layer", "ol.renderer.webgl.VertexShader"]);
goog.addDependency("src/ol/resolutionconstraint.js", ["ol.ResolutionConstraint", "ol.ResolutionConstraintType"], ["goog.math", "ol.array"]);
goog.addDependency("src/ol/rotationconstraint.js", ["ol.RotationConstraint", "ol.RotationConstraintType"], []);
goog.addDependency("src/ol/size.js", ["ol.Size"], ["goog.math.Size"]);
goog.addDependency("src/ol/source/bingmapssource.js", ["ol.source.BingMaps"], ["goog.Uri", "goog.array", "goog.net.Jsonp", "ol.Attribution", "ol.Extent", "ol.Size", "ol.TileCoord", "ol.TileRange", "ol.TileUrlFunction", "ol.projection", "ol.source.ImageTileSource", "ol.tilegrid.XYZ"]);
goog.addDependency("src/ol/source/debugtilesource.js", ["ol.source.DebugTileSource"], ["ol.Size", "ol.Tile", "ol.TileCache", "ol.TileCoord", "ol.TileState", "ol.source.TileSource", "ol.tilegrid.TileGrid"]);
goog.addDependency("src/ol/source/imagesource.js", ["ol.source.ImageSource"], ["goog.array", "ol.Attribution", "ol.Extent", "ol.Image", "ol.ImageUrlFunction", "ol.ImageUrlFunctionType", "ol.Projection", "ol.Size", "ol.array", "ol.source.Source"]);
goog.addDependency("src/ol/source/imagetilesource.js", ["ol.source.ImageTileSource", "ol.source.ImageTileSourceOptions"], ["ol.Attribution", "ol.Extent", "ol.ImageTile", "ol.Projection", "ol.Tile", "ol.TileCache", "ol.TileUrlFunction", "ol.TileUrlFunctionType", "ol.source.TileSource", "ol.tilegrid.TileGrid"]);
goog.addDependency("src/ol/source/mapquestsource.js", ["ol.source.MapQuestOSM", "ol.source.MapQuestOpenAerial"], ["ol.Attribution", "ol.source.XYZ"]);
goog.addDependency("src/ol/source/openstreetmapsource.js", ["ol.source.OpenStreetMap"], ["ol.Attribution", "ol.source.XYZ"]);
goog.addDependency("src/ol/source/singleimagewmssource.js", ["ol.source.SingleImageWMS"], ["ol.Extent", "ol.Image", "ol.ImageUrlFunction", "ol.Size", "ol.source.ImageSource"]);
goog.addDependency("src/ol/source/source.js", ["ol.source.Source"], ["goog.events.EventTarget", "goog.events.EventType", "goog.functions", "ol.Attribution", "ol.Extent", "ol.Projection"]);
goog.addDependency("src/ol/source/stamensource.js", ["ol.source.Stamen"], ["ol.Attribution", "ol.source.XYZ"]);
goog.addDependency("src/ol/source/staticimagesource.js", ["ol.source.StaticImage"], ["ol.Image", "ol.ImageUrlFunctionType", "ol.source.ImageSource"]);
goog.addDependency("src/ol/source/tiledwmssource.js", ["ol.source.TiledWMS"], ["goog.array", "ol.Extent", "ol.TileCoord", "ol.TileUrlFunction", "ol.source.ImageTileSource"]);
goog.addDependency("src/ol/source/tilejsonsource.js", ["ol.source.TileJSON", "ol.tilejson"], ["goog.asserts", "goog.net.jsloader", "ol.Attribution", "ol.Extent", "ol.TileCoord", "ol.TileRange", "ol.TileUrlFunction", "ol.projection", "ol.source.ImageTileSource", "ol.tilegrid.XYZ"]);
goog.addDependency("src/ol/source/tilesource.js", ["ol.source.TileSource", "ol.source.TileSourceOptions"], ["goog.functions", "ol.Attribution", "ol.Extent", "ol.Projection", "ol.Tile", "ol.TileCoord", "ol.TileRange", "ol.source.Source", "ol.tilegrid.TileGrid"]);
goog.addDependency("src/ol/source/wms.js", ["ol.source.wms"], []);
goog.addDependency("src/ol/source/xyzsource.js", ["ol.source.XYZ", "ol.source.XYZOptions"], ["goog.math", "ol.Attribution", "ol.Extent", "ol.Projection", "ol.TileCoord", "ol.TileUrlFunction", "ol.TileUrlFunctionType", "ol.projection", "ol.source.ImageTileSource", "ol.tilegrid.XYZ"]);
goog.addDependency("src/ol/sphere.js", ["ol.Sphere"], ["goog.math", "ol.Coordinate"]);
goog.addDependency("src/ol/sphere/normal.js", ["ol.sphere.NORMAL"], ["ol.Sphere"]);
goog.addDependency("src/ol/sphere/wgs84.js", ["ol.sphere.WGS84"], ["ol.Sphere"]);
goog.addDependency("src/ol/structs/lrucache.js", ["ol.structs.LRUCache"], ["goog.asserts", "goog.object"]);
goog.addDependency("src/ol/tile.js", ["ol.Tile", "ol.TileState"], ["goog.events", "goog.events.EventTarget", "goog.events.EventType", "ol.TileCoord"]);
goog.addDependency("src/ol/tilecache.js", ["ol.TileCache"], ["ol.Tile", "ol.TileRange", "ol.structs.LRUCache"]);
goog.addDependency("src/ol/tilecoord.js", ["ol.TileCoord"], ["goog.array", "ol.Coordinate"]);
goog.addDependency("src/ol/tilegrid/tilegrid.js", ["ol.tilegrid.TileGrid"], ["goog.array", "goog.asserts", "ol.Coordinate", "ol.Extent", "ol.PixelBounds", "ol.Projection", "ol.Size", "ol.TileCoord", "ol.TileRange", "ol.array"]);
goog.addDependency("src/ol/tilegrid/xyztilegrid.js", ["ol.tilegrid.XYZ"], ["ol.Coordinate", "ol.Size", "ol.TileRange", "ol.projection", "ol.projection.EPSG3857", "ol.tilegrid.TileGrid"]);
goog.addDependency("src/ol/tilequeue.js", ["ol.TilePriorityFunction", "ol.TileQueue"], ["goog.events", "goog.events.EventType", "ol.Coordinate", "ol.Tile", "ol.TileState"]);
goog.addDependency("src/ol/tilerange.js", ["ol.TileRange"], ["goog.asserts", "ol.Rectangle", "ol.TileCoord"]);
goog.addDependency("src/ol/tileurlfunction.js", ["ol.TileUrlFunction", "ol.TileUrlFunctionType"], ["goog.array", "goog.math", "ol.TileCoord", "ol.source.wms", "ol.tilegrid.TileGrid"]);
goog.addDependency("src/ol/transformfunction.js", ["ol.TransformFunction"], []);
goog.addDependency("src/ol/vec/mat4.js", ["ol.vec.Mat4"], ["goog.vec.Mat4"]);
goog.addDependency("src/ol/view.js", ["ol.View", "ol.ViewHint"], ["goog.array", "ol.IView", "ol.Object"]);
goog.addDependency("src/ol/view2d.js", ["ol.View2D", "ol.View2DProperty"], ["goog.fx.easing", "ol.Constraints", "ol.Coordinate", "ol.Extent", "ol.IView2D", "ol.IView3D", "ol.Projection", "ol.ResolutionConstraint", "ol.RotationConstraint", "ol.Size", "ol.View", "ol.animation", "ol.projection"]);
goog.addDependency("src/ol/webgl/webgl.js", ["ol.webgl", "ol.webgl.WebGLContextEventType"], []);
goog.provide("goog.debug.Error");
goog.debug.Error = function(opt_msg) {
  if(Error.captureStackTrace) {
    Error.captureStackTrace(this, goog.debug.Error)
  }else {
    this.stack = (new Error).stack || ""
  }
  if(opt_msg) {
    this.message = String(opt_msg)
  }
};
goog.inherits(goog.debug.Error, Error);
goog.debug.Error.prototype.name = "CustomError";
goog.provide("goog.string");
goog.provide("goog.string.Unicode");
goog.string.Unicode = {NBSP:"\u00a0"};
goog.string.startsWith = function(str, prefix) {
  return str.lastIndexOf(prefix, 0) == 0
};
goog.string.endsWith = function(str, suffix) {
  var l = str.length - suffix.length;
  return l >= 0 && str.indexOf(suffix, l) == l
};
goog.string.caseInsensitiveStartsWith = function(str, prefix) {
  return goog.string.caseInsensitiveCompare(prefix, str.substr(0, prefix.length)) == 0
};
goog.string.caseInsensitiveEndsWith = function(str, suffix) {
  return goog.string.caseInsensitiveCompare(suffix, str.substr(str.length - suffix.length, suffix.length)) == 0
};
goog.string.subs = function(str, var_args) {
  for(var i = 1;i < arguments.length;i++) {
    var replacement = String(arguments[i]).replace(/\$/g, "$$$$");
    str = str.replace(/\%s/, replacement)
  }
  return str
};
goog.string.collapseWhitespace = function(str) {
  return str.replace(/[\s\xa0]+/g, " ").replace(/^\s+|\s+$/g, "")
};
goog.string.isEmpty = function(str) {
  return/^[\s\xa0]*$/.test(str)
};
goog.string.isEmptySafe = function(str) {
  return goog.string.isEmpty(goog.string.makeSafe(str))
};
goog.string.isBreakingWhitespace = function(str) {
  return!/[^\t\n\r ]/.test(str)
};
goog.string.isAlpha = function(str) {
  return!/[^a-zA-Z]/.test(str)
};
goog.string.isNumeric = function(str) {
  return!/[^0-9]/.test(str)
};
goog.string.isAlphaNumeric = function(str) {
  return!/[^a-zA-Z0-9]/.test(str)
};
goog.string.isSpace = function(ch) {
  return ch == " "
};
goog.string.isUnicodeChar = function(ch) {
  return ch.length == 1 && ch >= " " && ch <= "~" || ch >= "\u0080" && ch <= "\ufffd"
};
goog.string.stripNewlines = function(str) {
  return str.replace(/(\r\n|\r|\n)+/g, " ")
};
goog.string.canonicalizeNewlines = function(str) {
  return str.replace(/(\r\n|\r|\n)/g, "\n")
};
goog.string.normalizeWhitespace = function(str) {
  return str.replace(/\xa0|\s/g, " ")
};
goog.string.normalizeSpaces = function(str) {
  return str.replace(/\xa0|[ \t]+/g, " ")
};
goog.string.collapseBreakingSpaces = function(str) {
  return str.replace(/[\t\r\n ]+/g, " ").replace(/^[\t\r\n ]+|[\t\r\n ]+$/g, "")
};
goog.string.trim = function(str) {
  return str.replace(/^[\s\xa0]+|[\s\xa0]+$/g, "")
};
goog.string.trimLeft = function(str) {
  return str.replace(/^[\s\xa0]+/, "")
};
goog.string.trimRight = function(str) {
  return str.replace(/[\s\xa0]+$/, "")
};
goog.string.caseInsensitiveCompare = function(str1, str2) {
  var test1 = String(str1).toLowerCase();
  var test2 = String(str2).toLowerCase();
  if(test1 < test2) {
    return-1
  }else {
    if(test1 == test2) {
      return 0
    }else {
      return 1
    }
  }
};
goog.string.numerateCompareRegExp_ = /(\.\d+)|(\d+)|(\D+)/g;
goog.string.numerateCompare = function(str1, str2) {
  if(str1 == str2) {
    return 0
  }
  if(!str1) {
    return-1
  }
  if(!str2) {
    return 1
  }
  var tokens1 = str1.toLowerCase().match(goog.string.numerateCompareRegExp_);
  var tokens2 = str2.toLowerCase().match(goog.string.numerateCompareRegExp_);
  var count = Math.min(tokens1.length, tokens2.length);
  for(var i = 0;i < count;i++) {
    var a = tokens1[i];
    var b = tokens2[i];
    if(a != b) {
      var num1 = parseInt(a, 10);
      if(!isNaN(num1)) {
        var num2 = parseInt(b, 10);
        if(!isNaN(num2) && num1 - num2) {
          return num1 - num2
        }
      }
      return a < b ? -1 : 1
    }
  }
  if(tokens1.length != tokens2.length) {
    return tokens1.length - tokens2.length
  }
  return str1 < str2 ? -1 : 1
};
goog.string.urlEncode = function(str) {
  return encodeURIComponent(String(str))
};
goog.string.urlDecode = function(str) {
  return decodeURIComponent(str.replace(/\+/g, " "))
};
goog.string.newLineToBr = function(str, opt_xml) {
  return str.replace(/(\r\n|\r|\n)/g, opt_xml ? "<br />" : "<br>")
};
goog.string.htmlEscape = function(str, opt_isLikelyToContainHtmlChars) {
  if(opt_isLikelyToContainHtmlChars) {
    return str.replace(goog.string.amperRe_, "&amp;").replace(goog.string.ltRe_, "&lt;").replace(goog.string.gtRe_, "&gt;").replace(goog.string.quotRe_, "&quot;")
  }else {
    if(!goog.string.allRe_.test(str)) {
      return str
    }
    if(str.indexOf("&") != -1) {
      str = str.replace(goog.string.amperRe_, "&amp;")
    }
    if(str.indexOf("<") != -1) {
      str = str.replace(goog.string.ltRe_, "&lt;")
    }
    if(str.indexOf(">") != -1) {
      str = str.replace(goog.string.gtRe_, "&gt;")
    }
    if(str.indexOf('"') != -1) {
      str = str.replace(goog.string.quotRe_, "&quot;")
    }
    return str
  }
};
goog.string.amperRe_ = /&/g;
goog.string.ltRe_ = /</g;
goog.string.gtRe_ = />/g;
goog.string.quotRe_ = /\"/g;
goog.string.allRe_ = /[&<>\"]/;
goog.string.unescapeEntities = function(str) {
  if(goog.string.contains(str, "&")) {
    if("document" in goog.global) {
      return goog.string.unescapeEntitiesUsingDom_(str)
    }else {
      return goog.string.unescapePureXmlEntities_(str)
    }
  }
  return str
};
goog.string.unescapeEntitiesUsingDom_ = function(str) {
  var seen = {"&amp;":"&", "&lt;":"<", "&gt;":">", "&quot;":'"'};
  var div = document.createElement("div");
  return str.replace(goog.string.HTML_ENTITY_PATTERN_, function(s, entity) {
    var value = seen[s];
    if(value) {
      return value
    }
    if(entity.charAt(0) == "#") {
      var n = Number("0" + entity.substr(1));
      if(!isNaN(n)) {
        value = String.fromCharCode(n)
      }
    }
    if(!value) {
      div.innerHTML = s + " ";
      value = div.firstChild.nodeValue.slice(0, -1)
    }
    return seen[s] = value
  })
};
goog.string.unescapePureXmlEntities_ = function(str) {
  return str.replace(/&([^;]+);/g, function(s, entity) {
    switch(entity) {
      case "amp":
        return"&";
      case "lt":
        return"<";
      case "gt":
        return">";
      case "quot":
        return'"';
      default:
        if(entity.charAt(0) == "#") {
          var n = Number("0" + entity.substr(1));
          if(!isNaN(n)) {
            return String.fromCharCode(n)
          }
        }
        return s
    }
  })
};
goog.string.HTML_ENTITY_PATTERN_ = /&([^;\s<&]+);?/g;
goog.string.whitespaceEscape = function(str, opt_xml) {
  return goog.string.newLineToBr(str.replace(/  /g, " &#160;"), opt_xml)
};
goog.string.stripQuotes = function(str, quoteChars) {
  var length = quoteChars.length;
  for(var i = 0;i < length;i++) {
    var quoteChar = length == 1 ? quoteChars : quoteChars.charAt(i);
    if(str.charAt(0) == quoteChar && str.charAt(str.length - 1) == quoteChar) {
      return str.substring(1, str.length - 1)
    }
  }
  return str
};
goog.string.truncate = function(str, chars, opt_protectEscapedCharacters) {
  if(opt_protectEscapedCharacters) {
    str = goog.string.unescapeEntities(str)
  }
  if(str.length > chars) {
    str = str.substring(0, chars - 3) + "..."
  }
  if(opt_protectEscapedCharacters) {
    str = goog.string.htmlEscape(str)
  }
  return str
};
goog.string.truncateMiddle = function(str, chars, opt_protectEscapedCharacters, opt_trailingChars) {
  if(opt_protectEscapedCharacters) {
    str = goog.string.unescapeEntities(str)
  }
  if(opt_trailingChars && str.length > chars) {
    if(opt_trailingChars > chars) {
      opt_trailingChars = chars
    }
    var endPoint = str.length - opt_trailingChars;
    var startPoint = chars - opt_trailingChars;
    str = str.substring(0, startPoint) + "..." + str.substring(endPoint)
  }else {
    if(str.length > chars) {
      var half = Math.floor(chars / 2);
      var endPos = str.length - half;
      half += chars % 2;
      str = str.substring(0, half) + "..." + str.substring(endPos)
    }
  }
  if(opt_protectEscapedCharacters) {
    str = goog.string.htmlEscape(str)
  }
  return str
};
goog.string.specialEscapeChars_ = {"\x00":"\\0", "\b":"\\b", "\f":"\\f", "\n":"\\n", "\r":"\\r", "\t":"\\t", "\x0B":"\\x0B", '"':'\\"', "\\":"\\\\"};
goog.string.jsEscapeCache_ = {"'":"\\'"};
goog.string.quote = function(s) {
  s = String(s);
  if(s.quote) {
    return s.quote()
  }else {
    var sb = ['"'];
    for(var i = 0;i < s.length;i++) {
      var ch = s.charAt(i);
      var cc = ch.charCodeAt(0);
      sb[i + 1] = goog.string.specialEscapeChars_[ch] || (cc > 31 && cc < 127 ? ch : goog.string.escapeChar(ch))
    }
    sb.push('"');
    return sb.join("")
  }
};
goog.string.escapeString = function(str) {
  var sb = [];
  for(var i = 0;i < str.length;i++) {
    sb[i] = goog.string.escapeChar(str.charAt(i))
  }
  return sb.join("")
};
goog.string.escapeChar = function(c) {
  if(c in goog.string.jsEscapeCache_) {
    return goog.string.jsEscapeCache_[c]
  }
  if(c in goog.string.specialEscapeChars_) {
    return goog.string.jsEscapeCache_[c] = goog.string.specialEscapeChars_[c]
  }
  var rv = c;
  var cc = c.charCodeAt(0);
  if(cc > 31 && cc < 127) {
    rv = c
  }else {
    if(cc < 256) {
      rv = "\\x";
      if(cc < 16 || cc > 256) {
        rv += "0"
      }
    }else {
      rv = "\\u";
      if(cc < 4096) {
        rv += "0"
      }
    }
    rv += cc.toString(16).toUpperCase()
  }
  return goog.string.jsEscapeCache_[c] = rv
};
goog.string.toMap = function(s) {
  var rv = {};
  for(var i = 0;i < s.length;i++) {
    rv[s.charAt(i)] = true
  }
  return rv
};
goog.string.contains = function(s, ss) {
  return s.indexOf(ss) != -1
};
goog.string.countOf = function(s, ss) {
  return s && ss ? s.split(ss).length - 1 : 0
};
goog.string.removeAt = function(s, index, stringLength) {
  var resultStr = s;
  if(index >= 0 && index < s.length && stringLength > 0) {
    resultStr = s.substr(0, index) + s.substr(index + stringLength, s.length - index - stringLength)
  }
  return resultStr
};
goog.string.remove = function(s, ss) {
  var re = new RegExp(goog.string.regExpEscape(ss), "");
  return s.replace(re, "")
};
goog.string.removeAll = function(s, ss) {
  var re = new RegExp(goog.string.regExpEscape(ss), "g");
  return s.replace(re, "")
};
goog.string.regExpEscape = function(s) {
  return String(s).replace(/([-()\[\]{}+?*.$\^|,:#<!\\])/g, "\\$1").replace(/\x08/g, "\\x08")
};
goog.string.repeat = function(string, length) {
  return(new Array(length + 1)).join(string)
};
goog.string.padNumber = function(num, length, opt_precision) {
  var s = goog.isDef(opt_precision) ? num.toFixed(opt_precision) : String(num);
  var index = s.indexOf(".");
  if(index == -1) {
    index = s.length
  }
  return goog.string.repeat("0", Math.max(0, length - index)) + s
};
goog.string.makeSafe = function(obj) {
  return obj == null ? "" : String(obj)
};
goog.string.buildString = function(var_args) {
  return Array.prototype.join.call(arguments, "")
};
goog.string.getRandomString = function() {
  var x = 2147483648;
  return Math.floor(Math.random() * x).toString(36) + Math.abs(Math.floor(Math.random() * x) ^ goog.now()).toString(36)
};
goog.string.compareVersions = function(version1, version2) {
  var order = 0;
  var v1Subs = goog.string.trim(String(version1)).split(".");
  var v2Subs = goog.string.trim(String(version2)).split(".");
  var subCount = Math.max(v1Subs.length, v2Subs.length);
  for(var subIdx = 0;order == 0 && subIdx < subCount;subIdx++) {
    var v1Sub = v1Subs[subIdx] || "";
    var v2Sub = v2Subs[subIdx] || "";
    var v1CompParser = new RegExp("(\\d*)(\\D*)", "g");
    var v2CompParser = new RegExp("(\\d*)(\\D*)", "g");
    do {
      var v1Comp = v1CompParser.exec(v1Sub) || ["", "", ""];
      var v2Comp = v2CompParser.exec(v2Sub) || ["", "", ""];
      if(v1Comp[0].length == 0 && v2Comp[0].length == 0) {
        break
      }
      var v1CompNum = v1Comp[1].length == 0 ? 0 : parseInt(v1Comp[1], 10);
      var v2CompNum = v2Comp[1].length == 0 ? 0 : parseInt(v2Comp[1], 10);
      order = goog.string.compareElements_(v1CompNum, v2CompNum) || goog.string.compareElements_(v1Comp[2].length == 0, v2Comp[2].length == 0) || goog.string.compareElements_(v1Comp[2], v2Comp[2])
    }while(order == 0)
  }
  return order
};
goog.string.compareElements_ = function(left, right) {
  if(left < right) {
    return-1
  }else {
    if(left > right) {
      return 1
    }
  }
  return 0
};
goog.string.HASHCODE_MAX_ = 4294967296;
goog.string.hashCode = function(str) {
  var result = 0;
  for(var i = 0;i < str.length;++i) {
    result = 31 * result + str.charCodeAt(i);
    result %= goog.string.HASHCODE_MAX_
  }
  return result
};
goog.string.uniqueStringCounter_ = Math.random() * 2147483648 | 0;
goog.string.createUniqueString = function() {
  return"goog_" + goog.string.uniqueStringCounter_++
};
goog.string.toNumber = function(str) {
  var num = Number(str);
  if(num == 0 && goog.string.isEmpty(str)) {
    return NaN
  }
  return num
};
goog.string.toCamelCase = function(str) {
  return String(str).replace(/\-([a-z])/g, function(all, match) {
    return match.toUpperCase()
  })
};
goog.string.toSelectorCase = function(str) {
  return String(str).replace(/([A-Z])/g, "-$1").toLowerCase()
};
goog.string.toTitleCase = function(str, opt_delimiters) {
  var delimiters = goog.isString(opt_delimiters) ? goog.string.regExpEscape(opt_delimiters) : "\\s";
  delimiters = delimiters ? "|[" + delimiters + "]+" : "";
  var regexp = new RegExp("(^" + delimiters + ")([a-z])", "g");
  return str.replace(regexp, function(all, p1, p2) {
    return p1 + p2.toUpperCase()
  })
};
goog.string.parseInt = function(value) {
  if(isFinite(value)) {
    value = String(value)
  }
  if(goog.isString(value)) {
    return/^\s*-?0x/i.test(value) ? parseInt(value, 16) : parseInt(value, 10)
  }
  return NaN
};
goog.provide("goog.asserts");
goog.provide("goog.asserts.AssertionError");
goog.require("goog.debug.Error");
goog.require("goog.string");
goog.asserts.ENABLE_ASSERTS = goog.DEBUG;
goog.asserts.AssertionError = function(messagePattern, messageArgs) {
  messageArgs.unshift(messagePattern);
  goog.debug.Error.call(this, goog.string.subs.apply(null, messageArgs));
  messageArgs.shift();
  this.messagePattern = messagePattern
};
goog.inherits(goog.asserts.AssertionError, goog.debug.Error);
goog.asserts.AssertionError.prototype.name = "AssertionError";
goog.asserts.doAssertFailure_ = function(defaultMessage, defaultArgs, givenMessage, givenArgs) {
  var message = "Assertion failed";
  if(givenMessage) {
    message += ": " + givenMessage;
    var args = givenArgs
  }else {
    if(defaultMessage) {
      message += ": " + defaultMessage;
      args = defaultArgs
    }
  }
  throw new goog.asserts.AssertionError("" + message, args || []);
};
goog.asserts.assert = function(condition, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !condition) {
    goog.asserts.doAssertFailure_("", null, opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return condition
};
goog.asserts.fail = function(opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS) {
    throw new goog.asserts.AssertionError("Failure" + (opt_message ? ": " + opt_message : ""), Array.prototype.slice.call(arguments, 1));
  }
};
goog.asserts.assertNumber = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isNumber(value)) {
    goog.asserts.doAssertFailure_("Expected number but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertString = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isString(value)) {
    goog.asserts.doAssertFailure_("Expected string but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertFunction = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isFunction(value)) {
    goog.asserts.doAssertFailure_("Expected function but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertObject = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isObject(value)) {
    goog.asserts.doAssertFailure_("Expected object but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertArray = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isArray(value)) {
    goog.asserts.doAssertFailure_("Expected array but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertBoolean = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isBoolean(value)) {
    goog.asserts.doAssertFailure_("Expected boolean but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertInstanceof = function(value, type, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !(value instanceof type)) {
    goog.asserts.doAssertFailure_("instanceof check failed.", null, opt_message, Array.prototype.slice.call(arguments, 3))
  }
  return value
};
goog.provide("goog.array");
goog.provide("goog.array.ArrayLike");
goog.require("goog.asserts");
goog.NATIVE_ARRAY_PROTOTYPES = true;
goog.array.ArrayLike;
goog.array.peek = function(array) {
  return array[array.length - 1]
};
goog.array.ARRAY_PROTOTYPE_ = Array.prototype;
goog.array.indexOf = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.indexOf ? function(arr, obj, opt_fromIndex) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.indexOf.call(arr, obj, opt_fromIndex)
} : function(arr, obj, opt_fromIndex) {
  var fromIndex = opt_fromIndex == null ? 0 : opt_fromIndex < 0 ? Math.max(0, arr.length + opt_fromIndex) : opt_fromIndex;
  if(goog.isString(arr)) {
    if(!goog.isString(obj) || obj.length != 1) {
      return-1
    }
    return arr.indexOf(obj, fromIndex)
  }
  for(var i = fromIndex;i < arr.length;i++) {
    if(i in arr && arr[i] === obj) {
      return i
    }
  }
  return-1
};
goog.array.lastIndexOf = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.lastIndexOf ? function(arr, obj, opt_fromIndex) {
  goog.asserts.assert(arr.length != null);
  var fromIndex = opt_fromIndex == null ? arr.length - 1 : opt_fromIndex;
  return goog.array.ARRAY_PROTOTYPE_.lastIndexOf.call(arr, obj, fromIndex)
} : function(arr, obj, opt_fromIndex) {
  var fromIndex = opt_fromIndex == null ? arr.length - 1 : opt_fromIndex;
  if(fromIndex < 0) {
    fromIndex = Math.max(0, arr.length + fromIndex)
  }
  if(goog.isString(arr)) {
    if(!goog.isString(obj) || obj.length != 1) {
      return-1
    }
    return arr.lastIndexOf(obj, fromIndex)
  }
  for(var i = fromIndex;i >= 0;i--) {
    if(i in arr && arr[i] === obj) {
      return i
    }
  }
  return-1
};
goog.array.forEach = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.forEach ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  goog.array.ARRAY_PROTOTYPE_.forEach.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2) {
      f.call(opt_obj, arr2[i], i, arr)
    }
  }
};
goog.array.forEachRight = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = l - 1;i >= 0;--i) {
    if(i in arr2) {
      f.call(opt_obj, arr2[i], i, arr)
    }
  }
};
goog.array.filter = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.filter ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.filter.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var res = [];
  var resLength = 0;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2) {
      var val = arr2[i];
      if(f.call(opt_obj, val, i, arr)) {
        res[resLength++] = val
      }
    }
  }
  return res
};
goog.array.map = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.map ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.map.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var res = new Array(l);
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2) {
      res[i] = f.call(opt_obj, arr2[i], i, arr)
    }
  }
  return res
};
goog.array.reduce = function(arr, f, val, opt_obj) {
  if(arr.reduce) {
    if(opt_obj) {
      return arr.reduce(goog.bind(f, opt_obj), val)
    }else {
      return arr.reduce(f, val)
    }
  }
  var rval = val;
  goog.array.forEach(arr, function(val, index) {
    rval = f.call(opt_obj, rval, val, index, arr)
  });
  return rval
};
goog.array.reduceRight = function(arr, f, val, opt_obj) {
  if(arr.reduceRight) {
    if(opt_obj) {
      return arr.reduceRight(goog.bind(f, opt_obj), val)
    }else {
      return arr.reduceRight(f, val)
    }
  }
  var rval = val;
  goog.array.forEachRight(arr, function(val, index) {
    rval = f.call(opt_obj, rval, val, index, arr)
  });
  return rval
};
goog.array.some = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.some ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.some.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return true
    }
  }
  return false
};
goog.array.every = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.every ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.every.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2 && !f.call(opt_obj, arr2[i], i, arr)) {
      return false
    }
  }
  return true
};
goog.array.find = function(arr, f, opt_obj) {
  var i = goog.array.findIndex(arr, f, opt_obj);
  return i < 0 ? null : goog.isString(arr) ? arr.charAt(i) : arr[i]
};
goog.array.findIndex = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return i
    }
  }
  return-1
};
goog.array.findRight = function(arr, f, opt_obj) {
  var i = goog.array.findIndexRight(arr, f, opt_obj);
  return i < 0 ? null : goog.isString(arr) ? arr.charAt(i) : arr[i]
};
goog.array.findIndexRight = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = l - 1;i >= 0;i--) {
    if(i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return i
    }
  }
  return-1
};
goog.array.contains = function(arr, obj) {
  return goog.array.indexOf(arr, obj) >= 0
};
goog.array.isEmpty = function(arr) {
  return arr.length == 0
};
goog.array.clear = function(arr) {
  if(!goog.isArray(arr)) {
    for(var i = arr.length - 1;i >= 0;i--) {
      delete arr[i]
    }
  }
  arr.length = 0
};
goog.array.insert = function(arr, obj) {
  if(!goog.array.contains(arr, obj)) {
    arr.push(obj)
  }
};
goog.array.insertAt = function(arr, obj, opt_i) {
  goog.array.splice(arr, opt_i, 0, obj)
};
goog.array.insertArrayAt = function(arr, elementsToAdd, opt_i) {
  goog.partial(goog.array.splice, arr, opt_i, 0).apply(null, elementsToAdd)
};
goog.array.insertBefore = function(arr, obj, opt_obj2) {
  var i;
  if(arguments.length == 2 || (i = goog.array.indexOf(arr, opt_obj2)) < 0) {
    arr.push(obj)
  }else {
    goog.array.insertAt(arr, obj, i)
  }
};
goog.array.remove = function(arr, obj) {
  var i = goog.array.indexOf(arr, obj);
  var rv;
  if(rv = i >= 0) {
    goog.array.removeAt(arr, i)
  }
  return rv
};
goog.array.removeAt = function(arr, i) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.splice.call(arr, i, 1).length == 1
};
goog.array.removeIf = function(arr, f, opt_obj) {
  var i = goog.array.findIndex(arr, f, opt_obj);
  if(i >= 0) {
    goog.array.removeAt(arr, i);
    return true
  }
  return false
};
goog.array.concat = function(var_args) {
  return goog.array.ARRAY_PROTOTYPE_.concat.apply(goog.array.ARRAY_PROTOTYPE_, arguments)
};
goog.array.toArray = function(object) {
  var length = object.length;
  if(length > 0) {
    var rv = new Array(length);
    for(var i = 0;i < length;i++) {
      rv[i] = object[i]
    }
    return rv
  }
  return[]
};
goog.array.clone = goog.array.toArray;
goog.array.extend = function(arr1, var_args) {
  for(var i = 1;i < arguments.length;i++) {
    var arr2 = arguments[i];
    var isArrayLike;
    if(goog.isArray(arr2) || (isArrayLike = goog.isArrayLike(arr2)) && arr2.hasOwnProperty("callee")) {
      arr1.push.apply(arr1, arr2)
    }else {
      if(isArrayLike) {
        var len1 = arr1.length;
        var len2 = arr2.length;
        for(var j = 0;j < len2;j++) {
          arr1[len1 + j] = arr2[j]
        }
      }else {
        arr1.push(arr2)
      }
    }
  }
};
goog.array.splice = function(arr, index, howMany, var_args) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.splice.apply(arr, goog.array.slice(arguments, 1))
};
goog.array.slice = function(arr, start, opt_end) {
  goog.asserts.assert(arr.length != null);
  if(arguments.length <= 2) {
    return goog.array.ARRAY_PROTOTYPE_.slice.call(arr, start)
  }else {
    return goog.array.ARRAY_PROTOTYPE_.slice.call(arr, start, opt_end)
  }
};
goog.array.removeDuplicates = function(arr, opt_rv) {
  var returnArray = opt_rv || arr;
  var seen = {}, cursorInsert = 0, cursorRead = 0;
  while(cursorRead < arr.length) {
    var current = arr[cursorRead++];
    var key = goog.isObject(current) ? "o" + goog.getUid(current) : (typeof current).charAt(0) + current;
    if(!Object.prototype.hasOwnProperty.call(seen, key)) {
      seen[key] = true;
      returnArray[cursorInsert++] = current
    }
  }
  returnArray.length = cursorInsert
};
goog.array.binarySearch = function(arr, target, opt_compareFn) {
  return goog.array.binarySearch_(arr, opt_compareFn || goog.array.defaultCompare, false, target)
};
goog.array.binarySelect = function(arr, evaluator, opt_obj) {
  return goog.array.binarySearch_(arr, evaluator, true, undefined, opt_obj)
};
goog.array.binarySearch_ = function(arr, compareFn, isEvaluator, opt_target, opt_selfObj) {
  var left = 0;
  var right = arr.length;
  var found;
  while(left < right) {
    var middle = left + right >> 1;
    var compareResult;
    if(isEvaluator) {
      compareResult = compareFn.call(opt_selfObj, arr[middle], middle, arr)
    }else {
      compareResult = compareFn(opt_target, arr[middle])
    }
    if(compareResult > 0) {
      left = middle + 1
    }else {
      right = middle;
      found = !compareResult
    }
  }
  return found ? left : ~left
};
goog.array.sort = function(arr, opt_compareFn) {
  goog.asserts.assert(arr.length != null);
  goog.array.ARRAY_PROTOTYPE_.sort.call(arr, opt_compareFn || goog.array.defaultCompare)
};
goog.array.stableSort = function(arr, opt_compareFn) {
  for(var i = 0;i < arr.length;i++) {
    arr[i] = {index:i, value:arr[i]}
  }
  var valueCompareFn = opt_compareFn || goog.array.defaultCompare;
  function stableCompareFn(obj1, obj2) {
    return valueCompareFn(obj1.value, obj2.value) || obj1.index - obj2.index
  }
  goog.array.sort(arr, stableCompareFn);
  for(var i = 0;i < arr.length;i++) {
    arr[i] = arr[i].value
  }
};
goog.array.sortObjectsByKey = function(arr, key, opt_compareFn) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  goog.array.sort(arr, function(a, b) {
    return compare(a[key], b[key])
  })
};
goog.array.isSorted = function(arr, opt_compareFn, opt_strict) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  for(var i = 1;i < arr.length;i++) {
    var compareResult = compare(arr[i - 1], arr[i]);
    if(compareResult > 0 || compareResult == 0 && opt_strict) {
      return false
    }
  }
  return true
};
goog.array.equals = function(arr1, arr2, opt_equalsFn) {
  if(!goog.isArrayLike(arr1) || !goog.isArrayLike(arr2) || arr1.length != arr2.length) {
    return false
  }
  var l = arr1.length;
  var equalsFn = opt_equalsFn || goog.array.defaultCompareEquality;
  for(var i = 0;i < l;i++) {
    if(!equalsFn(arr1[i], arr2[i])) {
      return false
    }
  }
  return true
};
goog.array.compare = function(arr1, arr2, opt_equalsFn) {
  return goog.array.equals(arr1, arr2, opt_equalsFn)
};
goog.array.compare3 = function(arr1, arr2, opt_compareFn) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  var l = Math.min(arr1.length, arr2.length);
  for(var i = 0;i < l;i++) {
    var result = compare(arr1[i], arr2[i]);
    if(result != 0) {
      return result
    }
  }
  return goog.array.defaultCompare(arr1.length, arr2.length)
};
goog.array.defaultCompare = function(a, b) {
  return a > b ? 1 : a < b ? -1 : 0
};
goog.array.defaultCompareEquality = function(a, b) {
  return a === b
};
goog.array.binaryInsert = function(array, value, opt_compareFn) {
  var index = goog.array.binarySearch(array, value, opt_compareFn);
  if(index < 0) {
    goog.array.insertAt(array, value, -(index + 1));
    return true
  }
  return false
};
goog.array.binaryRemove = function(array, value, opt_compareFn) {
  var index = goog.array.binarySearch(array, value, opt_compareFn);
  return index >= 0 ? goog.array.removeAt(array, index) : false
};
goog.array.bucket = function(array, sorter) {
  var buckets = {};
  for(var i = 0;i < array.length;i++) {
    var value = array[i];
    var key = sorter(value, i, array);
    if(goog.isDef(key)) {
      var bucket = buckets[key] || (buckets[key] = []);
      bucket.push(value)
    }
  }
  return buckets
};
goog.array.toObject = function(arr, keyFunc, opt_obj) {
  var ret = {};
  goog.array.forEach(arr, function(element, index) {
    ret[keyFunc.call(opt_obj, element, index, arr)] = element
  });
  return ret
};
goog.array.repeat = function(value, n) {
  var array = [];
  for(var i = 0;i < n;i++) {
    array[i] = value
  }
  return array
};
goog.array.flatten = function(var_args) {
  var result = [];
  for(var i = 0;i < arguments.length;i++) {
    var element = arguments[i];
    if(goog.isArray(element)) {
      result.push.apply(result, goog.array.flatten.apply(null, element))
    }else {
      result.push(element)
    }
  }
  return result
};
goog.array.rotate = function(array, n) {
  goog.asserts.assert(array.length != null);
  if(array.length) {
    n %= array.length;
    if(n > 0) {
      goog.array.ARRAY_PROTOTYPE_.unshift.apply(array, array.splice(-n, n))
    }else {
      if(n < 0) {
        goog.array.ARRAY_PROTOTYPE_.push.apply(array, array.splice(0, -n))
      }
    }
  }
  return array
};
goog.array.zip = function(var_args) {
  if(!arguments.length) {
    return[]
  }
  var result = [];
  for(var i = 0;true;i++) {
    var value = [];
    for(var j = 0;j < arguments.length;j++) {
      var arr = arguments[j];
      if(i >= arr.length) {
        return result
      }
      value.push(arr[i])
    }
    result.push(value)
  }
};
goog.array.shuffle = function(arr, opt_randFn) {
  var randFn = opt_randFn || Math.random;
  for(var i = arr.length - 1;i > 0;i--) {
    var j = Math.floor(randFn() * (i + 1));
    var tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp
  }
};
goog.provide("goog.object");
goog.object.forEach = function(obj, f, opt_obj) {
  for(var key in obj) {
    f.call(opt_obj, obj[key], key, obj)
  }
};
goog.object.filter = function(obj, f, opt_obj) {
  var res = {};
  for(var key in obj) {
    if(f.call(opt_obj, obj[key], key, obj)) {
      res[key] = obj[key]
    }
  }
  return res
};
goog.object.map = function(obj, f, opt_obj) {
  var res = {};
  for(var key in obj) {
    res[key] = f.call(opt_obj, obj[key], key, obj)
  }
  return res
};
goog.object.some = function(obj, f, opt_obj) {
  for(var key in obj) {
    if(f.call(opt_obj, obj[key], key, obj)) {
      return true
    }
  }
  return false
};
goog.object.every = function(obj, f, opt_obj) {
  for(var key in obj) {
    if(!f.call(opt_obj, obj[key], key, obj)) {
      return false
    }
  }
  return true
};
goog.object.getCount = function(obj) {
  var rv = 0;
  for(var key in obj) {
    rv++
  }
  return rv
};
goog.object.getAnyKey = function(obj) {
  for(var key in obj) {
    return key
  }
};
goog.object.getAnyValue = function(obj) {
  for(var key in obj) {
    return obj[key]
  }
};
goog.object.contains = function(obj, val) {
  return goog.object.containsValue(obj, val)
};
goog.object.getValues = function(obj) {
  var res = [];
  var i = 0;
  for(var key in obj) {
    res[i++] = obj[key]
  }
  return res
};
goog.object.getKeys = function(obj) {
  var res = [];
  var i = 0;
  for(var key in obj) {
    res[i++] = key
  }
  return res
};
goog.object.getValueByKeys = function(obj, var_args) {
  var isArrayLike = goog.isArrayLike(var_args);
  var keys = isArrayLike ? var_args : arguments;
  for(var i = isArrayLike ? 0 : 1;i < keys.length;i++) {
    obj = obj[keys[i]];
    if(!goog.isDef(obj)) {
      break
    }
  }
  return obj
};
goog.object.containsKey = function(obj, key) {
  return key in obj
};
goog.object.containsValue = function(obj, val) {
  for(var key in obj) {
    if(obj[key] == val) {
      return true
    }
  }
  return false
};
goog.object.findKey = function(obj, f, opt_this) {
  for(var key in obj) {
    if(f.call(opt_this, obj[key], key, obj)) {
      return key
    }
  }
  return undefined
};
goog.object.findValue = function(obj, f, opt_this) {
  var key = goog.object.findKey(obj, f, opt_this);
  return key && obj[key]
};
goog.object.isEmpty = function(obj) {
  for(var key in obj) {
    return false
  }
  return true
};
goog.object.clear = function(obj) {
  for(var i in obj) {
    delete obj[i]
  }
};
goog.object.remove = function(obj, key) {
  var rv;
  if(rv = key in obj) {
    delete obj[key]
  }
  return rv
};
goog.object.add = function(obj, key, val) {
  if(key in obj) {
    throw Error('The object already contains the key "' + key + '"');
  }
  goog.object.set(obj, key, val)
};
goog.object.get = function(obj, key, opt_val) {
  if(key in obj) {
    return obj[key]
  }
  return opt_val
};
goog.object.set = function(obj, key, value) {
  obj[key] = value
};
goog.object.setIfUndefined = function(obj, key, value) {
  return key in obj ? obj[key] : obj[key] = value
};
goog.object.clone = function(obj) {
  var res = {};
  for(var key in obj) {
    res[key] = obj[key]
  }
  return res
};
goog.object.unsafeClone = function(obj) {
  var type = goog.typeOf(obj);
  if(type == "object" || type == "array") {
    if(obj.clone) {
      return obj.clone()
    }
    var clone = type == "array" ? [] : {};
    for(var key in obj) {
      clone[key] = goog.object.unsafeClone(obj[key])
    }
    return clone
  }
  return obj
};
goog.object.transpose = function(obj) {
  var transposed = {};
  for(var key in obj) {
    transposed[obj[key]] = key
  }
  return transposed
};
goog.object.PROTOTYPE_FIELDS_ = ["constructor", "hasOwnProperty", "isPrototypeOf", "propertyIsEnumerable", "toLocaleString", "toString", "valueOf"];
goog.object.extend = function(target, var_args) {
  var key, source;
  for(var i = 1;i < arguments.length;i++) {
    source = arguments[i];
    for(key in source) {
      target[key] = source[key]
    }
    for(var j = 0;j < goog.object.PROTOTYPE_FIELDS_.length;j++) {
      key = goog.object.PROTOTYPE_FIELDS_[j];
      if(Object.prototype.hasOwnProperty.call(source, key)) {
        target[key] = source[key]
      }
    }
  }
};
goog.object.create = function(var_args) {
  var argLength = arguments.length;
  if(argLength == 1 && goog.isArray(arguments[0])) {
    return goog.object.create.apply(null, arguments[0])
  }
  if(argLength % 2) {
    throw Error("Uneven number of arguments");
  }
  var rv = {};
  for(var i = 0;i < argLength;i += 2) {
    rv[arguments[i]] = arguments[i + 1]
  }
  return rv
};
goog.object.createSet = function(var_args) {
  var argLength = arguments.length;
  if(argLength == 1 && goog.isArray(arguments[0])) {
    return goog.object.createSet.apply(null, arguments[0])
  }
  var rv = {};
  for(var i = 0;i < argLength;i++) {
    rv[arguments[i]] = true
  }
  return rv
};
goog.object.createImmutableView = function(obj) {
  var result = obj;
  if(Object.isFrozen && !Object.isFrozen(obj)) {
    result = Object.create(obj);
    Object.freeze(result)
  }
  return result
};
goog.object.isImmutableView = function(obj) {
  return!!Object.isFrozen && Object.isFrozen(obj)
};
goog.provide("goog.structs");
goog.require("goog.array");
goog.require("goog.object");
goog.structs.getCount = function(col) {
  if(typeof col.getCount == "function") {
    return col.getCount()
  }
  if(goog.isArrayLike(col) || goog.isString(col)) {
    return col.length
  }
  return goog.object.getCount(col)
};
goog.structs.getValues = function(col) {
  if(typeof col.getValues == "function") {
    return col.getValues()
  }
  if(goog.isString(col)) {
    return col.split("")
  }
  if(goog.isArrayLike(col)) {
    var rv = [];
    var l = col.length;
    for(var i = 0;i < l;i++) {
      rv.push(col[i])
    }
    return rv
  }
  return goog.object.getValues(col)
};
goog.structs.getKeys = function(col) {
  if(typeof col.getKeys == "function") {
    return col.getKeys()
  }
  if(typeof col.getValues == "function") {
    return undefined
  }
  if(goog.isArrayLike(col) || goog.isString(col)) {
    var rv = [];
    var l = col.length;
    for(var i = 0;i < l;i++) {
      rv.push(i)
    }
    return rv
  }
  return goog.object.getKeys(col)
};
goog.structs.contains = function(col, val) {
  if(typeof col.contains == "function") {
    return col.contains(val)
  }
  if(typeof col.containsValue == "function") {
    return col.containsValue(val)
  }
  if(goog.isArrayLike(col) || goog.isString(col)) {
    return goog.array.contains(col, val)
  }
  return goog.object.containsValue(col, val)
};
goog.structs.isEmpty = function(col) {
  if(typeof col.isEmpty == "function") {
    return col.isEmpty()
  }
  if(goog.isArrayLike(col) || goog.isString(col)) {
    return goog.array.isEmpty(col)
  }
  return goog.object.isEmpty(col)
};
goog.structs.clear = function(col) {
  if(typeof col.clear == "function") {
    col.clear()
  }else {
    if(goog.isArrayLike(col)) {
      goog.array.clear(col)
    }else {
      goog.object.clear(col)
    }
  }
};
goog.structs.forEach = function(col, f, opt_obj) {
  if(typeof col.forEach == "function") {
    col.forEach(f, opt_obj)
  }else {
    if(goog.isArrayLike(col) || goog.isString(col)) {
      goog.array.forEach(col, f, opt_obj)
    }else {
      var keys = goog.structs.getKeys(col);
      var values = goog.structs.getValues(col);
      var l = values.length;
      for(var i = 0;i < l;i++) {
        f.call(opt_obj, values[i], keys && keys[i], col)
      }
    }
  }
};
goog.structs.filter = function(col, f, opt_obj) {
  if(typeof col.filter == "function") {
    return col.filter(f, opt_obj)
  }
  if(goog.isArrayLike(col) || goog.isString(col)) {
    return goog.array.filter(col, f, opt_obj)
  }
  var rv;
  var keys = goog.structs.getKeys(col);
  var values = goog.structs.getValues(col);
  var l = values.length;
  if(keys) {
    rv = {};
    for(var i = 0;i < l;i++) {
      if(f.call(opt_obj, values[i], keys[i], col)) {
        rv[keys[i]] = values[i]
      }
    }
  }else {
    rv = [];
    for(var i = 0;i < l;i++) {
      if(f.call(opt_obj, values[i], undefined, col)) {
        rv.push(values[i])
      }
    }
  }
  return rv
};
goog.structs.map = function(col, f, opt_obj) {
  if(typeof col.map == "function") {
    return col.map(f, opt_obj)
  }
  if(goog.isArrayLike(col) || goog.isString(col)) {
    return goog.array.map(col, f, opt_obj)
  }
  var rv;
  var keys = goog.structs.getKeys(col);
  var values = goog.structs.getValues(col);
  var l = values.length;
  if(keys) {
    rv = {};
    for(var i = 0;i < l;i++) {
      rv[keys[i]] = f.call(opt_obj, values[i], keys[i], col)
    }
  }else {
    rv = [];
    for(var i = 0;i < l;i++) {
      rv[i] = f.call(opt_obj, values[i], undefined, col)
    }
  }
  return rv
};
goog.structs.some = function(col, f, opt_obj) {
  if(typeof col.some == "function") {
    return col.some(f, opt_obj)
  }
  if(goog.isArrayLike(col) || goog.isString(col)) {
    return goog.array.some(col, f, opt_obj)
  }
  var keys = goog.structs.getKeys(col);
  var values = goog.structs.getValues(col);
  var l = values.length;
  for(var i = 0;i < l;i++) {
    if(f.call(opt_obj, values[i], keys && keys[i], col)) {
      return true
    }
  }
  return false
};
goog.structs.every = function(col, f, opt_obj) {
  if(typeof col.every == "function") {
    return col.every(f, opt_obj)
  }
  if(goog.isArrayLike(col) || goog.isString(col)) {
    return goog.array.every(col, f, opt_obj)
  }
  var keys = goog.structs.getKeys(col);
  var values = goog.structs.getValues(col);
  var l = values.length;
  for(var i = 0;i < l;i++) {
    if(!f.call(opt_obj, values[i], keys && keys[i], col)) {
      return false
    }
  }
  return true
};
goog.provide("goog.structs.Collection");
goog.structs.Collection = function() {
};
goog.structs.Collection.prototype.add;
goog.structs.Collection.prototype.remove;
goog.structs.Collection.prototype.contains;
goog.structs.Collection.prototype.getCount;
goog.provide("goog.iter");
goog.provide("goog.iter.Iterator");
goog.provide("goog.iter.StopIteration");
goog.require("goog.array");
goog.require("goog.asserts");
goog.iter.Iterable;
if("StopIteration" in goog.global) {
  goog.iter.StopIteration = goog.global["StopIteration"]
}else {
  goog.iter.StopIteration = Error("StopIteration")
}
goog.iter.Iterator = function() {
};
goog.iter.Iterator.prototype.next = function() {
  throw goog.iter.StopIteration;
};
goog.iter.Iterator.prototype.__iterator__ = function(opt_keys) {
  return this
};
goog.iter.toIterator = function(iterable) {
  if(iterable instanceof goog.iter.Iterator) {
    return iterable
  }
  if(typeof iterable.__iterator__ == "function") {
    return iterable.__iterator__(false)
  }
  if(goog.isArrayLike(iterable)) {
    var i = 0;
    var newIter = new goog.iter.Iterator;
    newIter.next = function() {
      while(true) {
        if(i >= iterable.length) {
          throw goog.iter.StopIteration;
        }
        if(!(i in iterable)) {
          i++;
          continue
        }
        return iterable[i++]
      }
    };
    return newIter
  }
  throw Error("Not implemented");
};
goog.iter.forEach = function(iterable, f, opt_obj) {
  if(goog.isArrayLike(iterable)) {
    try {
      goog.array.forEach(iterable, f, opt_obj)
    }catch(ex) {
      if(ex !== goog.iter.StopIteration) {
        throw ex;
      }
    }
  }else {
    iterable = goog.iter.toIterator(iterable);
    try {
      while(true) {
        f.call(opt_obj, iterable.next(), undefined, iterable)
      }
    }catch(ex) {
      if(ex !== goog.iter.StopIteration) {
        throw ex;
      }
    }
  }
};
goog.iter.filter = function(iterable, f, opt_obj) {
  var iterator = goog.iter.toIterator(iterable);
  var newIter = new goog.iter.Iterator;
  newIter.next = function() {
    while(true) {
      var val = iterator.next();
      if(f.call(opt_obj, val, undefined, iterator)) {
        return val
      }
    }
  };
  return newIter
};
goog.iter.range = function(startOrStop, opt_stop, opt_step) {
  var start = 0;
  var stop = startOrStop;
  var step = opt_step || 1;
  if(arguments.length > 1) {
    start = startOrStop;
    stop = opt_stop
  }
  if(step == 0) {
    throw Error("Range step argument must not be zero");
  }
  var newIter = new goog.iter.Iterator;
  newIter.next = function() {
    if(step > 0 && start >= stop || step < 0 && start <= stop) {
      throw goog.iter.StopIteration;
    }
    var rv = start;
    start += step;
    return rv
  };
  return newIter
};
goog.iter.join = function(iterable, deliminator) {
  return goog.iter.toArray(iterable).join(deliminator)
};
goog.iter.map = function(iterable, f, opt_obj) {
  var iterator = goog.iter.toIterator(iterable);
  var newIter = new goog.iter.Iterator;
  newIter.next = function() {
    while(true) {
      var val = iterator.next();
      return f.call(opt_obj, val, undefined, iterator)
    }
  };
  return newIter
};
goog.iter.reduce = function(iterable, f, val, opt_obj) {
  var rval = val;
  goog.iter.forEach(iterable, function(val) {
    rval = f.call(opt_obj, rval, val)
  });
  return rval
};
goog.iter.some = function(iterable, f, opt_obj) {
  iterable = goog.iter.toIterator(iterable);
  try {
    while(true) {
      if(f.call(opt_obj, iterable.next(), undefined, iterable)) {
        return true
      }
    }
  }catch(ex) {
    if(ex !== goog.iter.StopIteration) {
      throw ex;
    }
  }
  return false
};
goog.iter.every = function(iterable, f, opt_obj) {
  iterable = goog.iter.toIterator(iterable);
  try {
    while(true) {
      if(!f.call(opt_obj, iterable.next(), undefined, iterable)) {
        return false
      }
    }
  }catch(ex) {
    if(ex !== goog.iter.StopIteration) {
      throw ex;
    }
  }
  return true
};
goog.iter.chain = function(var_args) {
  var args = arguments;
  var length = args.length;
  var i = 0;
  var newIter = new goog.iter.Iterator;
  newIter.next = function() {
    try {
      if(i >= length) {
        throw goog.iter.StopIteration;
      }
      var current = goog.iter.toIterator(args[i]);
      return current.next()
    }catch(ex) {
      if(ex !== goog.iter.StopIteration || i >= length) {
        throw ex;
      }else {
        i++;
        return this.next()
      }
    }
  };
  return newIter
};
goog.iter.dropWhile = function(iterable, f, opt_obj) {
  var iterator = goog.iter.toIterator(iterable);
  var newIter = new goog.iter.Iterator;
  var dropping = true;
  newIter.next = function() {
    while(true) {
      var val = iterator.next();
      if(dropping && f.call(opt_obj, val, undefined, iterator)) {
        continue
      }else {
        dropping = false
      }
      return val
    }
  };
  return newIter
};
goog.iter.takeWhile = function(iterable, f, opt_obj) {
  var iterator = goog.iter.toIterator(iterable);
  var newIter = new goog.iter.Iterator;
  var taking = true;
  newIter.next = function() {
    while(true) {
      if(taking) {
        var val = iterator.next();
        if(f.call(opt_obj, val, undefined, iterator)) {
          return val
        }else {
          taking = false
        }
      }else {
        throw goog.iter.StopIteration;
      }
    }
  };
  return newIter
};
goog.iter.toArray = function(iterable) {
  if(goog.isArrayLike(iterable)) {
    return goog.array.toArray(iterable)
  }
  iterable = goog.iter.toIterator(iterable);
  var array = [];
  goog.iter.forEach(iterable, function(val) {
    array.push(val)
  });
  return array
};
goog.iter.equals = function(iterable1, iterable2) {
  iterable1 = goog.iter.toIterator(iterable1);
  iterable2 = goog.iter.toIterator(iterable2);
  var b1, b2;
  try {
    while(true) {
      b1 = b2 = false;
      var val1 = iterable1.next();
      b1 = true;
      var val2 = iterable2.next();
      b2 = true;
      if(val1 != val2) {
        return false
      }
    }
  }catch(ex) {
    if(ex !== goog.iter.StopIteration) {
      throw ex;
    }else {
      if(b1 && !b2) {
        return false
      }
      if(!b2) {
        try {
          val2 = iterable2.next();
          return false
        }catch(ex1) {
          if(ex1 !== goog.iter.StopIteration) {
            throw ex1;
          }
          return true
        }
      }
    }
  }
  return false
};
goog.iter.nextOrValue = function(iterable, defaultValue) {
  try {
    return goog.iter.toIterator(iterable).next()
  }catch(e) {
    if(e != goog.iter.StopIteration) {
      throw e;
    }
    return defaultValue
  }
};
goog.iter.product = function(var_args) {
  var someArrayEmpty = goog.array.some(arguments, function(arr) {
    return!arr.length
  });
  if(someArrayEmpty || !arguments.length) {
    return new goog.iter.Iterator
  }
  var iter = new goog.iter.Iterator;
  var arrays = arguments;
  var indicies = goog.array.repeat(0, arrays.length);
  iter.next = function() {
    if(indicies) {
      var retVal = goog.array.map(indicies, function(valueIndex, arrayIndex) {
        return arrays[arrayIndex][valueIndex]
      });
      for(var i = indicies.length - 1;i >= 0;i--) {
        goog.asserts.assert(indicies);
        if(indicies[i] < arrays[i].length - 1) {
          indicies[i]++;
          break
        }
        if(i == 0) {
          indicies = null;
          break
        }
        indicies[i] = 0
      }
      return retVal
    }
    throw goog.iter.StopIteration;
  };
  return iter
};
goog.iter.cycle = function(iterable) {
  var baseIterator = goog.iter.toIterator(iterable);
  var cache = [];
  var cacheIndex = 0;
  var iter = new goog.iter.Iterator;
  var useCache = false;
  iter.next = function() {
    var returnElement = null;
    if(!useCache) {
      try {
        returnElement = baseIterator.next();
        cache.push(returnElement);
        return returnElement
      }catch(e) {
        if(e != goog.iter.StopIteration || goog.array.isEmpty(cache)) {
          throw e;
        }
        useCache = true
      }
    }
    returnElement = cache[cacheIndex];
    cacheIndex = (cacheIndex + 1) % cache.length;
    return returnElement
  };
  return iter
};
goog.provide("goog.structs.Map");
goog.require("goog.iter.Iterator");
goog.require("goog.iter.StopIteration");
goog.require("goog.object");
goog.require("goog.structs");
goog.structs.Map = function(opt_map, var_args) {
  this.map_ = {};
  this.keys_ = [];
  var argLength = arguments.length;
  if(argLength > 1) {
    if(argLength % 2) {
      throw Error("Uneven number of arguments");
    }
    for(var i = 0;i < argLength;i += 2) {
      this.set(arguments[i], arguments[i + 1])
    }
  }else {
    if(opt_map) {
      this.addAll(opt_map)
    }
  }
};
goog.structs.Map.prototype.count_ = 0;
goog.structs.Map.prototype.version_ = 0;
goog.structs.Map.prototype.getCount = function() {
  return this.count_
};
goog.structs.Map.prototype.getValues = function() {
  this.cleanupKeysArray_();
  var rv = [];
  for(var i = 0;i < this.keys_.length;i++) {
    var key = this.keys_[i];
    rv.push(this.map_[key])
  }
  return rv
};
goog.structs.Map.prototype.getKeys = function() {
  this.cleanupKeysArray_();
  return this.keys_.concat()
};
goog.structs.Map.prototype.containsKey = function(key) {
  return goog.structs.Map.hasKey_(this.map_, key)
};
goog.structs.Map.prototype.containsValue = function(val) {
  for(var i = 0;i < this.keys_.length;i++) {
    var key = this.keys_[i];
    if(goog.structs.Map.hasKey_(this.map_, key) && this.map_[key] == val) {
      return true
    }
  }
  return false
};
goog.structs.Map.prototype.equals = function(otherMap, opt_equalityFn) {
  if(this === otherMap) {
    return true
  }
  if(this.count_ != otherMap.getCount()) {
    return false
  }
  var equalityFn = opt_equalityFn || goog.structs.Map.defaultEquals;
  this.cleanupKeysArray_();
  for(var key, i = 0;key = this.keys_[i];i++) {
    if(!equalityFn(this.get(key), otherMap.get(key))) {
      return false
    }
  }
  return true
};
goog.structs.Map.defaultEquals = function(a, b) {
  return a === b
};
goog.structs.Map.prototype.isEmpty = function() {
  return this.count_ == 0
};
goog.structs.Map.prototype.clear = function() {
  this.map_ = {};
  this.keys_.length = 0;
  this.count_ = 0;
  this.version_ = 0
};
goog.structs.Map.prototype.remove = function(key) {
  if(goog.structs.Map.hasKey_(this.map_, key)) {
    delete this.map_[key];
    this.count_--;
    this.version_++;
    if(this.keys_.length > 2 * this.count_) {
      this.cleanupKeysArray_()
    }
    return true
  }
  return false
};
goog.structs.Map.prototype.cleanupKeysArray_ = function() {
  if(this.count_ != this.keys_.length) {
    var srcIndex = 0;
    var destIndex = 0;
    while(srcIndex < this.keys_.length) {
      var key = this.keys_[srcIndex];
      if(goog.structs.Map.hasKey_(this.map_, key)) {
        this.keys_[destIndex++] = key
      }
      srcIndex++
    }
    this.keys_.length = destIndex
  }
  if(this.count_ != this.keys_.length) {
    var seen = {};
    var srcIndex = 0;
    var destIndex = 0;
    while(srcIndex < this.keys_.length) {
      var key = this.keys_[srcIndex];
      if(!goog.structs.Map.hasKey_(seen, key)) {
        this.keys_[destIndex++] = key;
        seen[key] = 1
      }
      srcIndex++
    }
    this.keys_.length = destIndex
  }
};
goog.structs.Map.prototype.get = function(key, opt_val) {
  if(goog.structs.Map.hasKey_(this.map_, key)) {
    return this.map_[key]
  }
  return opt_val
};
goog.structs.Map.prototype.set = function(key, value) {
  if(!goog.structs.Map.hasKey_(this.map_, key)) {
    this.count_++;
    this.keys_.push(key);
    this.version_++
  }
  this.map_[key] = value
};
goog.structs.Map.prototype.addAll = function(map) {
  var keys, values;
  if(map instanceof goog.structs.Map) {
    keys = map.getKeys();
    values = map.getValues()
  }else {
    keys = goog.object.getKeys(map);
    values = goog.object.getValues(map)
  }
  for(var i = 0;i < keys.length;i++) {
    this.set(keys[i], values[i])
  }
};
goog.structs.Map.prototype.clone = function() {
  return new goog.structs.Map(this)
};
goog.structs.Map.prototype.transpose = function() {
  var transposed = new goog.structs.Map;
  for(var i = 0;i < this.keys_.length;i++) {
    var key = this.keys_[i];
    var value = this.map_[key];
    transposed.set(value, key)
  }
  return transposed
};
goog.structs.Map.prototype.toObject = function() {
  this.cleanupKeysArray_();
  var obj = {};
  for(var i = 0;i < this.keys_.length;i++) {
    var key = this.keys_[i];
    obj[key] = this.map_[key]
  }
  return obj
};
goog.structs.Map.prototype.getKeyIterator = function() {
  return this.__iterator__(true)
};
goog.structs.Map.prototype.getValueIterator = function() {
  return this.__iterator__(false)
};
goog.structs.Map.prototype.__iterator__ = function(opt_keys) {
  this.cleanupKeysArray_();
  var i = 0;
  var keys = this.keys_;
  var map = this.map_;
  var version = this.version_;
  var selfObj = this;
  var newIter = new goog.iter.Iterator;
  newIter.next = function() {
    while(true) {
      if(version != selfObj.version_) {
        throw Error("The map has changed since the iterator was created");
      }
      if(i >= keys.length) {
        throw goog.iter.StopIteration;
      }
      var key = keys[i++];
      return opt_keys ? key : map[key]
    }
  };
  return newIter
};
goog.structs.Map.hasKey_ = function(obj, key) {
  return Object.prototype.hasOwnProperty.call(obj, key)
};
goog.provide("goog.structs.Set");
goog.require("goog.structs");
goog.require("goog.structs.Collection");
goog.require("goog.structs.Map");
goog.structs.Set = function(opt_values) {
  this.map_ = new goog.structs.Map;
  if(opt_values) {
    this.addAll(opt_values)
  }
};
goog.structs.Set.getKey_ = function(val) {
  var type = typeof val;
  if(type == "object" && val || type == "function") {
    return"o" + goog.getUid(val)
  }else {
    return type.substr(0, 1) + val
  }
};
goog.structs.Set.prototype.getCount = function() {
  return this.map_.getCount()
};
goog.structs.Set.prototype.add = function(element) {
  this.map_.set(goog.structs.Set.getKey_(element), element)
};
goog.structs.Set.prototype.addAll = function(col) {
  var values = goog.structs.getValues(col);
  var l = values.length;
  for(var i = 0;i < l;i++) {
    this.add(values[i])
  }
};
goog.structs.Set.prototype.removeAll = function(col) {
  var values = goog.structs.getValues(col);
  var l = values.length;
  for(var i = 0;i < l;i++) {
    this.remove(values[i])
  }
};
goog.structs.Set.prototype.remove = function(element) {
  return this.map_.remove(goog.structs.Set.getKey_(element))
};
goog.structs.Set.prototype.clear = function() {
  this.map_.clear()
};
goog.structs.Set.prototype.isEmpty = function() {
  return this.map_.isEmpty()
};
goog.structs.Set.prototype.contains = function(element) {
  return this.map_.containsKey(goog.structs.Set.getKey_(element))
};
goog.structs.Set.prototype.containsAll = function(col) {
  return goog.structs.every(col, this.contains, this)
};
goog.structs.Set.prototype.intersection = function(col) {
  var result = new goog.structs.Set;
  var values = goog.structs.getValues(col);
  for(var i = 0;i < values.length;i++) {
    var value = values[i];
    if(this.contains(value)) {
      result.add(value)
    }
  }
  return result
};
goog.structs.Set.prototype.difference = function(col) {
  var result = this.clone();
  result.removeAll(col);
  return result
};
goog.structs.Set.prototype.getValues = function() {
  return this.map_.getValues()
};
goog.structs.Set.prototype.clone = function() {
  return new goog.structs.Set(this)
};
goog.structs.Set.prototype.equals = function(col) {
  return this.getCount() == goog.structs.getCount(col) && this.isSubsetOf(col)
};
goog.structs.Set.prototype.isSubsetOf = function(col) {
  var colCount = goog.structs.getCount(col);
  if(this.getCount() > colCount) {
    return false
  }
  if(!(col instanceof goog.structs.Set) && colCount > 5) {
    col = new goog.structs.Set(col)
  }
  return goog.structs.every(this, function(value) {
    return goog.structs.contains(col, value)
  })
};
goog.structs.Set.prototype.__iterator__ = function(opt_keys) {
  return this.map_.__iterator__(false)
};
goog.provide("goog.userAgent");
goog.require("goog.string");
goog.userAgent.ASSUME_IE = false;
goog.userAgent.ASSUME_GECKO = false;
goog.userAgent.ASSUME_WEBKIT = false;
goog.userAgent.ASSUME_MOBILE_WEBKIT = false;
goog.userAgent.ASSUME_OPERA = false;
goog.userAgent.ASSUME_ANY_VERSION = false;
goog.userAgent.BROWSER_KNOWN_ = goog.userAgent.ASSUME_IE || goog.userAgent.ASSUME_GECKO || goog.userAgent.ASSUME_MOBILE_WEBKIT || goog.userAgent.ASSUME_WEBKIT || goog.userAgent.ASSUME_OPERA;
goog.userAgent.getUserAgentString = function() {
  return goog.global["navigator"] ? goog.global["navigator"].userAgent : null
};
goog.userAgent.getNavigator = function() {
  return goog.global["navigator"]
};
goog.userAgent.init_ = function() {
  goog.userAgent.detectedOpera_ = false;
  goog.userAgent.detectedIe_ = false;
  goog.userAgent.detectedWebkit_ = false;
  goog.userAgent.detectedMobile_ = false;
  goog.userAgent.detectedGecko_ = false;
  var ua;
  if(!goog.userAgent.BROWSER_KNOWN_ && (ua = goog.userAgent.getUserAgentString())) {
    var navigator = goog.userAgent.getNavigator();
    goog.userAgent.detectedOpera_ = ua.indexOf("Opera") == 0;
    goog.userAgent.detectedIe_ = !goog.userAgent.detectedOpera_ && ua.indexOf("MSIE") != -1;
    goog.userAgent.detectedWebkit_ = !goog.userAgent.detectedOpera_ && ua.indexOf("WebKit") != -1;
    goog.userAgent.detectedMobile_ = goog.userAgent.detectedWebkit_ && ua.indexOf("Mobile") != -1;
    goog.userAgent.detectedGecko_ = !goog.userAgent.detectedOpera_ && !goog.userAgent.detectedWebkit_ && navigator.product == "Gecko"
  }
};
if(!goog.userAgent.BROWSER_KNOWN_) {
  goog.userAgent.init_()
}
goog.userAgent.OPERA = goog.userAgent.BROWSER_KNOWN_ ? goog.userAgent.ASSUME_OPERA : goog.userAgent.detectedOpera_;
goog.userAgent.IE = goog.userAgent.BROWSER_KNOWN_ ? goog.userAgent.ASSUME_IE : goog.userAgent.detectedIe_;
goog.userAgent.GECKO = goog.userAgent.BROWSER_KNOWN_ ? goog.userAgent.ASSUME_GECKO : goog.userAgent.detectedGecko_;
goog.userAgent.WEBKIT = goog.userAgent.BROWSER_KNOWN_ ? goog.userAgent.ASSUME_WEBKIT || goog.userAgent.ASSUME_MOBILE_WEBKIT : goog.userAgent.detectedWebkit_;
goog.userAgent.MOBILE = goog.userAgent.ASSUME_MOBILE_WEBKIT || goog.userAgent.detectedMobile_;
goog.userAgent.SAFARI = goog.userAgent.WEBKIT;
goog.userAgent.determinePlatform_ = function() {
  var navigator = goog.userAgent.getNavigator();
  return navigator && navigator.platform || ""
};
goog.userAgent.PLATFORM = goog.userAgent.determinePlatform_();
goog.userAgent.ASSUME_MAC = false;
goog.userAgent.ASSUME_WINDOWS = false;
goog.userAgent.ASSUME_LINUX = false;
goog.userAgent.ASSUME_X11 = false;
goog.userAgent.PLATFORM_KNOWN_ = goog.userAgent.ASSUME_MAC || goog.userAgent.ASSUME_WINDOWS || goog.userAgent.ASSUME_LINUX || goog.userAgent.ASSUME_X11;
goog.userAgent.initPlatform_ = function() {
  goog.userAgent.detectedMac_ = goog.string.contains(goog.userAgent.PLATFORM, "Mac");
  goog.userAgent.detectedWindows_ = goog.string.contains(goog.userAgent.PLATFORM, "Win");
  goog.userAgent.detectedLinux_ = goog.string.contains(goog.userAgent.PLATFORM, "Linux");
  goog.userAgent.detectedX11_ = !!goog.userAgent.getNavigator() && goog.string.contains(goog.userAgent.getNavigator()["appVersion"] || "", "X11")
};
if(!goog.userAgent.PLATFORM_KNOWN_) {
  goog.userAgent.initPlatform_()
}
goog.userAgent.MAC = goog.userAgent.PLATFORM_KNOWN_ ? goog.userAgent.ASSUME_MAC : goog.userAgent.detectedMac_;
goog.userAgent.WINDOWS = goog.userAgent.PLATFORM_KNOWN_ ? goog.userAgent.ASSUME_WINDOWS : goog.userAgent.detectedWindows_;
goog.userAgent.LINUX = goog.userAgent.PLATFORM_KNOWN_ ? goog.userAgent.ASSUME_LINUX : goog.userAgent.detectedLinux_;
goog.userAgent.X11 = goog.userAgent.PLATFORM_KNOWN_ ? goog.userAgent.ASSUME_X11 : goog.userAgent.detectedX11_;
goog.userAgent.determineVersion_ = function() {
  var version = "", re;
  if(goog.userAgent.OPERA && goog.global["opera"]) {
    var operaVersion = goog.global["opera"].version;
    version = typeof operaVersion == "function" ? operaVersion() : operaVersion
  }else {
    if(goog.userAgent.GECKO) {
      re = /rv\:([^\);]+)(\)|;)/
    }else {
      if(goog.userAgent.IE) {
        re = /MSIE\s+([^\);]+)(\)|;)/
      }else {
        if(goog.userAgent.WEBKIT) {
          re = /WebKit\/(\S+)/
        }
      }
    }
    if(re) {
      var arr = re.exec(goog.userAgent.getUserAgentString());
      version = arr ? arr[1] : ""
    }
  }
  if(goog.userAgent.IE) {
    var docMode = goog.userAgent.getDocumentMode_();
    if(docMode > parseFloat(version)) {
      return String(docMode)
    }
  }
  return version
};
goog.userAgent.getDocumentMode_ = function() {
  var doc = goog.global["document"];
  return doc ? doc["documentMode"] : undefined
};
goog.userAgent.VERSION = goog.userAgent.determineVersion_();
goog.userAgent.compare = function(v1, v2) {
  return goog.string.compareVersions(v1, v2)
};
goog.userAgent.isVersionCache_ = {};
goog.userAgent.isVersion = function(version) {
  return goog.userAgent.ASSUME_ANY_VERSION || goog.userAgent.isVersionCache_[version] || (goog.userAgent.isVersionCache_[version] = goog.string.compareVersions(goog.userAgent.VERSION, version) >= 0)
};
goog.userAgent.isDocumentModeCache_ = {};
goog.userAgent.isDocumentMode = function(documentMode) {
  return goog.userAgent.isDocumentModeCache_[documentMode] || (goog.userAgent.isDocumentModeCache_[documentMode] = goog.userAgent.IE && !!document.documentMode && document.documentMode >= documentMode)
};
goog.provide("goog.debug");
goog.require("goog.array");
goog.require("goog.string");
goog.require("goog.structs.Set");
goog.require("goog.userAgent");
goog.debug.catchErrors = function(logFunc, opt_cancel, opt_target) {
  var target = opt_target || goog.global;
  var oldErrorHandler = target.onerror;
  var retVal = !!opt_cancel;
  if(goog.userAgent.WEBKIT && !goog.userAgent.isVersion("535.3")) {
    retVal = !retVal
  }
  target.onerror = function(message, url, line) {
    if(oldErrorHandler) {
      oldErrorHandler(message, url, line)
    }
    logFunc({message:message, fileName:url, line:line});
    return retVal
  }
};
goog.debug.expose = function(obj, opt_showFn) {
  if(typeof obj == "undefined") {
    return"undefined"
  }
  if(obj == null) {
    return"NULL"
  }
  var str = [];
  for(var x in obj) {
    if(!opt_showFn && goog.isFunction(obj[x])) {
      continue
    }
    var s = x + " = ";
    try {
      s += obj[x]
    }catch(e) {
      s += "*** " + e + " ***"
    }
    str.push(s)
  }
  return str.join("\n")
};
goog.debug.deepExpose = function(obj, opt_showFn) {
  var previous = new goog.structs.Set;
  var str = [];
  var helper = function(obj, space) {
    var nestspace = space + "  ";
    var indentMultiline = function(str) {
      return str.replace(/\n/g, "\n" + space)
    };
    try {
      if(!goog.isDef(obj)) {
        str.push("undefined")
      }else {
        if(goog.isNull(obj)) {
          str.push("NULL")
        }else {
          if(goog.isString(obj)) {
            str.push('"' + indentMultiline(obj) + '"')
          }else {
            if(goog.isFunction(obj)) {
              str.push(indentMultiline(String(obj)))
            }else {
              if(goog.isObject(obj)) {
                if(previous.contains(obj)) {
                  str.push("*** reference loop detected ***")
                }else {
                  previous.add(obj);
                  str.push("{");
                  for(var x in obj) {
                    if(!opt_showFn && goog.isFunction(obj[x])) {
                      continue
                    }
                    str.push("\n");
                    str.push(nestspace);
                    str.push(x + " = ");
                    helper(obj[x], nestspace)
                  }
                  str.push("\n" + space + "}")
                }
              }else {
                str.push(obj)
              }
            }
          }
        }
      }
    }catch(e) {
      str.push("*** " + e + " ***")
    }
  };
  helper(obj, "");
  return str.join("")
};
goog.debug.exposeArray = function(arr) {
  var str = [];
  for(var i = 0;i < arr.length;i++) {
    if(goog.isArray(arr[i])) {
      str.push(goog.debug.exposeArray(arr[i]))
    }else {
      str.push(arr[i])
    }
  }
  return"[ " + str.join(", ") + " ]"
};
goog.debug.exposeException = function(err, opt_fn) {
  try {
    var e = goog.debug.normalizeErrorObject(err);
    var error = "Message: " + goog.string.htmlEscape(e.message) + '\nUrl: <a href="view-source:' + e.fileName + '" target="_new">' + e.fileName + "</a>\nLine: " + e.lineNumber + "\n\nBrowser stack:\n" + goog.string.htmlEscape(e.stack + "-> ") + "[end]\n\nJS stack traversal:\n" + goog.string.htmlEscape(goog.debug.getStacktrace(opt_fn) + "-> ");
    return error
  }catch(e2) {
    return"Exception trying to expose exception! You win, we lose. " + e2
  }
};
goog.debug.normalizeErrorObject = function(err) {
  var href = goog.getObjectByName("window.location.href");
  if(goog.isString(err)) {
    return{"message":err, "name":"Unknown error", "lineNumber":"Not available", "fileName":href, "stack":"Not available"}
  }
  var lineNumber, fileName;
  var threwError = false;
  try {
    lineNumber = err.lineNumber || err.line || "Not available"
  }catch(e) {
    lineNumber = "Not available";
    threwError = true
  }
  try {
    fileName = err.fileName || err.filename || err.sourceURL || href
  }catch(e) {
    fileName = "Not available";
    threwError = true
  }
  if(threwError || !err.lineNumber || !err.fileName || !err.stack) {
    return{"message":err.message, "name":err.name, "lineNumber":lineNumber, "fileName":fileName, "stack":err.stack || "Not available"}
  }
  return err
};
goog.debug.enhanceError = function(err, opt_message) {
  var error = typeof err == "string" ? Error(err) : err;
  if(!error.stack) {
    error.stack = goog.debug.getStacktrace(arguments.callee.caller)
  }
  if(opt_message) {
    var x = 0;
    while(error["message" + x]) {
      ++x
    }
    error["message" + x] = String(opt_message)
  }
  return error
};
goog.debug.getStacktraceSimple = function(opt_depth) {
  var sb = [];
  var fn = arguments.callee.caller;
  var depth = 0;
  while(fn && (!opt_depth || depth < opt_depth)) {
    sb.push(goog.debug.getFunctionName(fn));
    sb.push("()\n");
    try {
      fn = fn.caller
    }catch(e) {
      sb.push("[exception trying to get caller]\n");
      break
    }
    depth++;
    if(depth >= goog.debug.MAX_STACK_DEPTH) {
      sb.push("[...long stack...]");
      break
    }
  }
  if(opt_depth && depth >= opt_depth) {
    sb.push("[...reached max depth limit...]")
  }else {
    sb.push("[end]")
  }
  return sb.join("")
};
goog.debug.MAX_STACK_DEPTH = 50;
goog.debug.getStacktrace = function(opt_fn) {
  return goog.debug.getStacktraceHelper_(opt_fn || arguments.callee.caller, [])
};
goog.debug.getStacktraceHelper_ = function(fn, visited) {
  var sb = [];
  if(goog.array.contains(visited, fn)) {
    sb.push("[...circular reference...]")
  }else {
    if(fn && visited.length < goog.debug.MAX_STACK_DEPTH) {
      sb.push(goog.debug.getFunctionName(fn) + "(");
      var args = fn.arguments;
      for(var i = 0;i < args.length;i++) {
        if(i > 0) {
          sb.push(", ")
        }
        var argDesc;
        var arg = args[i];
        switch(typeof arg) {
          case "object":
            argDesc = arg ? "object" : "null";
            break;
          case "string":
            argDesc = arg;
            break;
          case "number":
            argDesc = String(arg);
            break;
          case "boolean":
            argDesc = arg ? "true" : "false";
            break;
          case "function":
            argDesc = goog.debug.getFunctionName(arg);
            argDesc = argDesc ? argDesc : "[fn]";
            break;
          case "undefined":
          ;
          default:
            argDesc = typeof arg;
            break
        }
        if(argDesc.length > 40) {
          argDesc = argDesc.substr(0, 40) + "..."
        }
        sb.push(argDesc)
      }
      visited.push(fn);
      sb.push(")\n");
      try {
        sb.push(goog.debug.getStacktraceHelper_(fn.caller, visited))
      }catch(e) {
        sb.push("[exception trying to get caller]\n")
      }
    }else {
      if(fn) {
        sb.push("[...long stack...]")
      }else {
        sb.push("[end]")
      }
    }
  }
  return sb.join("")
};
goog.debug.setFunctionResolver = function(resolver) {
  goog.debug.fnNameResolver_ = resolver
};
goog.debug.getFunctionName = function(fn) {
  if(goog.debug.fnNameCache_[fn]) {
    return goog.debug.fnNameCache_[fn]
  }
  if(goog.debug.fnNameResolver_) {
    var name = goog.debug.fnNameResolver_(fn);
    if(name) {
      goog.debug.fnNameCache_[fn] = name;
      return name
    }
  }
  var functionSource = String(fn);
  if(!goog.debug.fnNameCache_[functionSource]) {
    var matches = /function ([^\(]+)/.exec(functionSource);
    if(matches) {
      var method = matches[1];
      goog.debug.fnNameCache_[functionSource] = method
    }else {
      goog.debug.fnNameCache_[functionSource] = "[Anonymous]"
    }
  }
  return goog.debug.fnNameCache_[functionSource]
};
goog.debug.makeWhitespaceVisible = function(string) {
  return string.replace(/ /g, "[_]").replace(/\f/g, "[f]").replace(/\n/g, "[n]\n").replace(/\r/g, "[r]").replace(/\t/g, "[t]")
};
goog.debug.fnNameCache_ = {};
goog.debug.fnNameResolver_;
goog.provide("goog.debug.LogRecord");
goog.debug.LogRecord = function(level, msg, loggerName, opt_time, opt_sequenceNumber) {
  this.reset(level, msg, loggerName, opt_time, opt_sequenceNumber)
};
goog.debug.LogRecord.prototype.time_;
goog.debug.LogRecord.prototype.level_;
goog.debug.LogRecord.prototype.msg_;
goog.debug.LogRecord.prototype.loggerName_;
goog.debug.LogRecord.prototype.sequenceNumber_ = 0;
goog.debug.LogRecord.prototype.exception_ = null;
goog.debug.LogRecord.prototype.exceptionText_ = null;
goog.debug.LogRecord.ENABLE_SEQUENCE_NUMBERS = true;
goog.debug.LogRecord.nextSequenceNumber_ = 0;
goog.debug.LogRecord.prototype.reset = function(level, msg, loggerName, opt_time, opt_sequenceNumber) {
  if(goog.debug.LogRecord.ENABLE_SEQUENCE_NUMBERS) {
    this.sequenceNumber_ = typeof opt_sequenceNumber == "number" ? opt_sequenceNumber : goog.debug.LogRecord.nextSequenceNumber_++
  }
  this.time_ = opt_time || goog.now();
  this.level_ = level;
  this.msg_ = msg;
  this.loggerName_ = loggerName;
  delete this.exception_;
  delete this.exceptionText_
};
goog.debug.LogRecord.prototype.getLoggerName = function() {
  return this.loggerName_
};
goog.debug.LogRecord.prototype.getException = function() {
  return this.exception_
};
goog.debug.LogRecord.prototype.setException = function(exception) {
  this.exception_ = exception
};
goog.debug.LogRecord.prototype.getExceptionText = function() {
  return this.exceptionText_
};
goog.debug.LogRecord.prototype.setExceptionText = function(text) {
  this.exceptionText_ = text
};
goog.debug.LogRecord.prototype.setLoggerName = function(loggerName) {
  this.loggerName_ = loggerName
};
goog.debug.LogRecord.prototype.getLevel = function() {
  return this.level_
};
goog.debug.LogRecord.prototype.setLevel = function(level) {
  this.level_ = level
};
goog.debug.LogRecord.prototype.getMessage = function() {
  return this.msg_
};
goog.debug.LogRecord.prototype.setMessage = function(msg) {
  this.msg_ = msg
};
goog.debug.LogRecord.prototype.getMillis = function() {
  return this.time_
};
goog.debug.LogRecord.prototype.setMillis = function(time) {
  this.time_ = time
};
goog.debug.LogRecord.prototype.getSequenceNumber = function() {
  return this.sequenceNumber_
};
goog.provide("goog.debug.LogBuffer");
goog.require("goog.asserts");
goog.require("goog.debug.LogRecord");
goog.debug.LogBuffer = function() {
  goog.asserts.assert(goog.debug.LogBuffer.isBufferingEnabled(), "Cannot use goog.debug.LogBuffer without defining " + "goog.debug.LogBuffer.CAPACITY.");
  this.clear()
};
goog.debug.LogBuffer.getInstance = function() {
  if(!goog.debug.LogBuffer.instance_) {
    goog.debug.LogBuffer.instance_ = new goog.debug.LogBuffer
  }
  return goog.debug.LogBuffer.instance_
};
goog.debug.LogBuffer.CAPACITY = 0;
goog.debug.LogBuffer.prototype.buffer_;
goog.debug.LogBuffer.prototype.curIndex_;
goog.debug.LogBuffer.prototype.isFull_;
goog.debug.LogBuffer.prototype.addRecord = function(level, msg, loggerName) {
  var curIndex = (this.curIndex_ + 1) % goog.debug.LogBuffer.CAPACITY;
  this.curIndex_ = curIndex;
  if(this.isFull_) {
    var ret = this.buffer_[curIndex];
    ret.reset(level, msg, loggerName);
    return ret
  }
  this.isFull_ = curIndex == goog.debug.LogBuffer.CAPACITY - 1;
  return this.buffer_[curIndex] = new goog.debug.LogRecord(level, msg, loggerName)
};
goog.debug.LogBuffer.isBufferingEnabled = function() {
  return goog.debug.LogBuffer.CAPACITY > 0
};
goog.debug.LogBuffer.prototype.clear = function() {
  this.buffer_ = new Array(goog.debug.LogBuffer.CAPACITY);
  this.curIndex_ = -1;
  this.isFull_ = false
};
goog.debug.LogBuffer.prototype.forEachRecord = function(func) {
  var buffer = this.buffer_;
  if(!buffer[0]) {
    return
  }
  var curIndex = this.curIndex_;
  var i = this.isFull_ ? curIndex : -1;
  do {
    i = (i + 1) % goog.debug.LogBuffer.CAPACITY;
    func(buffer[i])
  }while(i != curIndex)
};
goog.provide("goog.debug.LogManager");
goog.provide("goog.debug.Logger");
goog.provide("goog.debug.Logger.Level");
goog.require("goog.array");
goog.require("goog.asserts");
goog.require("goog.debug");
goog.require("goog.debug.LogBuffer");
goog.require("goog.debug.LogRecord");
goog.debug.Logger = function(name) {
  this.name_ = name
};
goog.debug.Logger.prototype.parent_ = null;
goog.debug.Logger.prototype.level_ = null;
goog.debug.Logger.prototype.children_ = null;
goog.debug.Logger.prototype.handlers_ = null;
goog.debug.Logger.ENABLE_HIERARCHY = true;
if(!goog.debug.Logger.ENABLE_HIERARCHY) {
  goog.debug.Logger.rootHandlers_ = [];
  goog.debug.Logger.rootLevel_
}
goog.debug.Logger.Level = function(name, value) {
  this.name = name;
  this.value = value
};
goog.debug.Logger.Level.prototype.toString = function() {
  return this.name
};
goog.debug.Logger.Level.OFF = new goog.debug.Logger.Level("OFF", Infinity);
goog.debug.Logger.Level.SHOUT = new goog.debug.Logger.Level("SHOUT", 1200);
goog.debug.Logger.Level.SEVERE = new goog.debug.Logger.Level("SEVERE", 1E3);
goog.debug.Logger.Level.WARNING = new goog.debug.Logger.Level("WARNING", 900);
goog.debug.Logger.Level.INFO = new goog.debug.Logger.Level("INFO", 800);
goog.debug.Logger.Level.CONFIG = new goog.debug.Logger.Level("CONFIG", 700);
goog.debug.Logger.Level.FINE = new goog.debug.Logger.Level("FINE", 500);
goog.debug.Logger.Level.FINER = new goog.debug.Logger.Level("FINER", 400);
goog.debug.Logger.Level.FINEST = new goog.debug.Logger.Level("FINEST", 300);
goog.debug.Logger.Level.ALL = new goog.debug.Logger.Level("ALL", 0);
goog.debug.Logger.Level.PREDEFINED_LEVELS = [goog.debug.Logger.Level.OFF, goog.debug.Logger.Level.SHOUT, goog.debug.Logger.Level.SEVERE, goog.debug.Logger.Level.WARNING, goog.debug.Logger.Level.INFO, goog.debug.Logger.Level.CONFIG, goog.debug.Logger.Level.FINE, goog.debug.Logger.Level.FINER, goog.debug.Logger.Level.FINEST, goog.debug.Logger.Level.ALL];
goog.debug.Logger.Level.predefinedLevelsCache_ = null;
goog.debug.Logger.Level.createPredefinedLevelsCache_ = function() {
  goog.debug.Logger.Level.predefinedLevelsCache_ = {};
  for(var i = 0, level;level = goog.debug.Logger.Level.PREDEFINED_LEVELS[i];i++) {
    goog.debug.Logger.Level.predefinedLevelsCache_[level.value] = level;
    goog.debug.Logger.Level.predefinedLevelsCache_[level.name] = level
  }
};
goog.debug.Logger.Level.getPredefinedLevel = function(name) {
  if(!goog.debug.Logger.Level.predefinedLevelsCache_) {
    goog.debug.Logger.Level.createPredefinedLevelsCache_()
  }
  return goog.debug.Logger.Level.predefinedLevelsCache_[name] || null
};
goog.debug.Logger.Level.getPredefinedLevelByValue = function(value) {
  if(!goog.debug.Logger.Level.predefinedLevelsCache_) {
    goog.debug.Logger.Level.createPredefinedLevelsCache_()
  }
  if(value in goog.debug.Logger.Level.predefinedLevelsCache_) {
    return goog.debug.Logger.Level.predefinedLevelsCache_[value]
  }
  for(var i = 0;i < goog.debug.Logger.Level.PREDEFINED_LEVELS.length;++i) {
    var level = goog.debug.Logger.Level.PREDEFINED_LEVELS[i];
    if(level.value <= value) {
      return level
    }
  }
  return null
};
goog.debug.Logger.getLogger = function(name) {
  return goog.debug.LogManager.getLogger(name)
};
goog.debug.Logger.logToProfilers = function(msg) {
  if(goog.global["console"]) {
    if(goog.global["console"]["timeStamp"]) {
      goog.global["console"]["timeStamp"](msg)
    }else {
      if(goog.global["console"]["markTimeline"]) {
        goog.global["console"]["markTimeline"](msg)
      }
    }
  }
  if(goog.global["msWriteProfilerMark"]) {
    goog.global["msWriteProfilerMark"](msg)
  }
};
goog.debug.Logger.prototype.getName = function() {
  return this.name_
};
goog.debug.Logger.prototype.addHandler = function(handler) {
  if(goog.debug.Logger.ENABLE_HIERARCHY) {
    if(!this.handlers_) {
      this.handlers_ = []
    }
    this.handlers_.push(handler)
  }else {
    goog.asserts.assert(!this.name_, "Cannot call addHandler on a non-root logger when " + "goog.debug.Logger.ENABLE_HIERARCHY is false.");
    goog.debug.Logger.rootHandlers_.push(handler)
  }
};
goog.debug.Logger.prototype.removeHandler = function(handler) {
  var handlers = goog.debug.Logger.ENABLE_HIERARCHY ? this.handlers_ : goog.debug.Logger.rootHandlers_;
  return!!handlers && goog.array.remove(handlers, handler)
};
goog.debug.Logger.prototype.getParent = function() {
  return this.parent_
};
goog.debug.Logger.prototype.getChildren = function() {
  if(!this.children_) {
    this.children_ = {}
  }
  return this.children_
};
goog.debug.Logger.prototype.setLevel = function(level) {
  if(goog.debug.Logger.ENABLE_HIERARCHY) {
    this.level_ = level
  }else {
    goog.asserts.assert(!this.name_, "Cannot call setLevel() on a non-root logger when " + "goog.debug.Logger.ENABLE_HIERARCHY is false.");
    goog.debug.Logger.rootLevel_ = level
  }
};
goog.debug.Logger.prototype.getLevel = function() {
  return this.level_
};
goog.debug.Logger.prototype.getEffectiveLevel = function() {
  if(!goog.debug.Logger.ENABLE_HIERARCHY) {
    return goog.debug.Logger.rootLevel_
  }
  if(this.level_) {
    return this.level_
  }
  if(this.parent_) {
    return this.parent_.getEffectiveLevel()
  }
  goog.asserts.fail("Root logger has no level set.");
  return null
};
goog.debug.Logger.prototype.isLoggable = function(level) {
  return level.value >= this.getEffectiveLevel().value
};
goog.debug.Logger.prototype.log = function(level, msg, opt_exception) {
  if(this.isLoggable(level)) {
    this.doLogRecord_(this.getLogRecord(level, msg, opt_exception))
  }
};
goog.debug.Logger.prototype.getLogRecord = function(level, msg, opt_exception) {
  if(goog.debug.LogBuffer.isBufferingEnabled()) {
    var logRecord = goog.debug.LogBuffer.getInstance().addRecord(level, msg, this.name_)
  }else {
    logRecord = new goog.debug.LogRecord(level, String(msg), this.name_)
  }
  if(opt_exception) {
    logRecord.setException(opt_exception);
    logRecord.setExceptionText(goog.debug.exposeException(opt_exception, arguments.callee.caller))
  }
  return logRecord
};
goog.debug.Logger.prototype.shout = function(msg, opt_exception) {
  this.log(goog.debug.Logger.Level.SHOUT, msg, opt_exception)
};
goog.debug.Logger.prototype.severe = function(msg, opt_exception) {
  this.log(goog.debug.Logger.Level.SEVERE, msg, opt_exception)
};
goog.debug.Logger.prototype.warning = function(msg, opt_exception) {
  this.log(goog.debug.Logger.Level.WARNING, msg, opt_exception)
};
goog.debug.Logger.prototype.info = function(msg, opt_exception) {
  this.log(goog.debug.Logger.Level.INFO, msg, opt_exception)
};
goog.debug.Logger.prototype.config = function(msg, opt_exception) {
  this.log(goog.debug.Logger.Level.CONFIG, msg, opt_exception)
};
goog.debug.Logger.prototype.fine = function(msg, opt_exception) {
  this.log(goog.debug.Logger.Level.FINE, msg, opt_exception)
};
goog.debug.Logger.prototype.finer = function(msg, opt_exception) {
  this.log(goog.debug.Logger.Level.FINER, msg, opt_exception)
};
goog.debug.Logger.prototype.finest = function(msg, opt_exception) {
  this.log(goog.debug.Logger.Level.FINEST, msg, opt_exception)
};
goog.debug.Logger.prototype.logRecord = function(logRecord) {
  if(this.isLoggable(logRecord.getLevel())) {
    this.doLogRecord_(logRecord)
  }
};
goog.debug.Logger.prototype.doLogRecord_ = function(logRecord) {
  goog.debug.Logger.logToProfilers("log:" + logRecord.getMessage());
  if(goog.debug.Logger.ENABLE_HIERARCHY) {
    var target = this;
    while(target) {
      target.callPublish_(logRecord);
      target = target.getParent()
    }
  }else {
    for(var i = 0, handler;handler = goog.debug.Logger.rootHandlers_[i++];) {
      handler(logRecord)
    }
  }
};
goog.debug.Logger.prototype.callPublish_ = function(logRecord) {
  if(this.handlers_) {
    for(var i = 0, handler;handler = this.handlers_[i];i++) {
      handler(logRecord)
    }
  }
};
goog.debug.Logger.prototype.setParent_ = function(parent) {
  this.parent_ = parent
};
goog.debug.Logger.prototype.addChild_ = function(name, logger) {
  this.getChildren()[name] = logger
};
goog.debug.LogManager = {};
goog.debug.LogManager.loggers_ = {};
goog.debug.LogManager.rootLogger_ = null;
goog.debug.LogManager.initialize = function() {
  if(!goog.debug.LogManager.rootLogger_) {
    goog.debug.LogManager.rootLogger_ = new goog.debug.Logger("");
    goog.debug.LogManager.loggers_[""] = goog.debug.LogManager.rootLogger_;
    goog.debug.LogManager.rootLogger_.setLevel(goog.debug.Logger.Level.CONFIG)
  }
};
goog.debug.LogManager.getLoggers = function() {
  return goog.debug.LogManager.loggers_
};
goog.debug.LogManager.getRoot = function() {
  goog.debug.LogManager.initialize();
  return goog.debug.LogManager.rootLogger_
};
goog.debug.LogManager.getLogger = function(name) {
  goog.debug.LogManager.initialize();
  var ret = goog.debug.LogManager.loggers_[name];
  return ret || goog.debug.LogManager.createLogger_(name)
};
goog.debug.LogManager.createFunctionForCatchErrors = function(opt_logger) {
  return function(info) {
    var logger = opt_logger || goog.debug.LogManager.getRoot();
    logger.severe("Error: " + info.message + " (" + info.fileName + " @ Line: " + info.line + ")")
  }
};
goog.debug.LogManager.createLogger_ = function(name) {
  var logger = new goog.debug.Logger(name);
  if(goog.debug.Logger.ENABLE_HIERARCHY) {
    var lastDotIndex = name.lastIndexOf(".");
    var parentName = name.substr(0, lastDotIndex);
    var leafName = name.substr(lastDotIndex + 1);
    var parentLogger = goog.debug.LogManager.getLogger(parentName);
    parentLogger.addChild_(leafName, logger);
    logger.setParent_(parentLogger)
  }
  goog.debug.LogManager.loggers_[name] = logger;
  return logger
};
goog.provide("ol");
goog.require("goog.debug.Logger");
if(goog.DEBUG) {
  var logger = goog.debug.Logger.getLogger("ol");
  logger.setLevel(goog.debug.Logger.Level.FINEST)
}
;goog.provide("goog.dom.BrowserFeature");
goog.require("goog.userAgent");
goog.dom.BrowserFeature = {CAN_ADD_NAME_OR_TYPE_ATTRIBUTES:!goog.userAgent.IE || goog.userAgent.isDocumentMode(9), CAN_USE_CHILDREN_ATTRIBUTE:!goog.userAgent.GECKO && !goog.userAgent.IE || goog.userAgent.IE && goog.userAgent.isDocumentMode(9) || goog.userAgent.GECKO && goog.userAgent.isVersion("1.9.1"), CAN_USE_INNER_TEXT:goog.userAgent.IE && !goog.userAgent.isVersion("9"), CAN_USE_PARENT_ELEMENT_PROPERTY:goog.userAgent.IE || goog.userAgent.OPERA || goog.userAgent.WEBKIT, INNER_HTML_NEEDS_SCOPED_ELEMENT:goog.userAgent.IE};
goog.provide("goog.dom.TagName");
goog.dom.TagName = {A:"A", ABBR:"ABBR", ACRONYM:"ACRONYM", ADDRESS:"ADDRESS", APPLET:"APPLET", AREA:"AREA", ARTICLE:"ARTICLE", ASIDE:"ASIDE", AUDIO:"AUDIO", B:"B", BASE:"BASE", BASEFONT:"BASEFONT", BDI:"BDI", BDO:"BDO", BIG:"BIG", BLOCKQUOTE:"BLOCKQUOTE", BODY:"BODY", BR:"BR", BUTTON:"BUTTON", CANVAS:"CANVAS", CAPTION:"CAPTION", CENTER:"CENTER", CITE:"CITE", CODE:"CODE", COL:"COL", COLGROUP:"COLGROUP", COMMAND:"COMMAND", DATA:"DATA", DATALIST:"DATALIST", DD:"DD", DEL:"DEL", DETAILS:"DETAILS", DFN:"DFN", 
DIALOG:"DIALOG", DIR:"DIR", DIV:"DIV", DL:"DL", DT:"DT", EM:"EM", EMBED:"EMBED", FIELDSET:"FIELDSET", FIGCAPTION:"FIGCAPTION", FIGURE:"FIGURE", FONT:"FONT", FOOTER:"FOOTER", FORM:"FORM", FRAME:"FRAME", FRAMESET:"FRAMESET", H1:"H1", H2:"H2", H3:"H3", H4:"H4", H5:"H5", H6:"H6", HEAD:"HEAD", HEADER:"HEADER", HGROUP:"HGROUP", HR:"HR", HTML:"HTML", I:"I", IFRAME:"IFRAME", IMG:"IMG", INPUT:"INPUT", INS:"INS", ISINDEX:"ISINDEX", KBD:"KBD", KEYGEN:"KEYGEN", LABEL:"LABEL", LEGEND:"LEGEND", LI:"LI", LINK:"LINK", 
MAP:"MAP", MARK:"MARK", MATH:"MATH", MENU:"MENU", META:"META", METER:"METER", NAV:"NAV", NOFRAMES:"NOFRAMES", NOSCRIPT:"NOSCRIPT", OBJECT:"OBJECT", OL:"OL", OPTGROUP:"OPTGROUP", OPTION:"OPTION", OUTPUT:"OUTPUT", P:"P", PARAM:"PARAM", PRE:"PRE", PROGRESS:"PROGRESS", Q:"Q", RP:"RP", RT:"RT", RUBY:"RUBY", S:"S", SAMP:"SAMP", SCRIPT:"SCRIPT", SECTION:"SECTION", SELECT:"SELECT", SMALL:"SMALL", SOURCE:"SOURCE", SPAN:"SPAN", STRIKE:"STRIKE", STRONG:"STRONG", STYLE:"STYLE", SUB:"SUB", SUMMARY:"SUMMARY", 
SUP:"SUP", SVG:"SVG", TABLE:"TABLE", TBODY:"TBODY", TD:"TD", TEXTAREA:"TEXTAREA", TFOOT:"TFOOT", TH:"TH", THEAD:"THEAD", TIME:"TIME", TITLE:"TITLE", TR:"TR", TRACK:"TRACK", TT:"TT", U:"U", UL:"UL", VAR:"VAR", VIDEO:"VIDEO", WBR:"WBR"};
goog.provide("goog.dom.classes");
goog.require("goog.array");
goog.dom.classes.set = function(element, className) {
  element.className = className
};
goog.dom.classes.get = function(element) {
  var className = element.className;
  return goog.isString(className) && className.match(/\S+/g) || []
};
goog.dom.classes.add = function(element, var_args) {
  var classes = goog.dom.classes.get(element);
  var args = goog.array.slice(arguments, 1);
  var expectedCount = classes.length + args.length;
  goog.dom.classes.add_(classes, args);
  element.className = classes.join(" ");
  return classes.length == expectedCount
};
goog.dom.classes.remove = function(element, var_args) {
  var classes = goog.dom.classes.get(element);
  var args = goog.array.slice(arguments, 1);
  var newClasses = goog.dom.classes.getDifference_(classes, args);
  element.className = newClasses.join(" ");
  return newClasses.length == classes.length - args.length
};
goog.dom.classes.add_ = function(classes, args) {
  for(var i = 0;i < args.length;i++) {
    if(!goog.array.contains(classes, args[i])) {
      classes.push(args[i])
    }
  }
};
goog.dom.classes.getDifference_ = function(arr1, arr2) {
  return goog.array.filter(arr1, function(item) {
    return!goog.array.contains(arr2, item)
  })
};
goog.dom.classes.swap = function(element, fromClass, toClass) {
  var classes = goog.dom.classes.get(element);
  var removed = false;
  for(var i = 0;i < classes.length;i++) {
    if(classes[i] == fromClass) {
      goog.array.splice(classes, i--, 1);
      removed = true
    }
  }
  if(removed) {
    classes.push(toClass);
    element.className = classes.join(" ")
  }
  return removed
};
goog.dom.classes.addRemove = function(element, classesToRemove, classesToAdd) {
  var classes = goog.dom.classes.get(element);
  if(goog.isString(classesToRemove)) {
    goog.array.remove(classes, classesToRemove)
  }else {
    if(goog.isArray(classesToRemove)) {
      classes = goog.dom.classes.getDifference_(classes, classesToRemove)
    }
  }
  if(goog.isString(classesToAdd) && !goog.array.contains(classes, classesToAdd)) {
    classes.push(classesToAdd)
  }else {
    if(goog.isArray(classesToAdd)) {
      goog.dom.classes.add_(classes, classesToAdd)
    }
  }
  element.className = classes.join(" ")
};
goog.dom.classes.has = function(element, className) {
  return goog.array.contains(goog.dom.classes.get(element), className)
};
goog.dom.classes.enable = function(element, className, enabled) {
  if(enabled) {
    goog.dom.classes.add(element, className)
  }else {
    goog.dom.classes.remove(element, className)
  }
};
goog.dom.classes.toggle = function(element, className) {
  var add = !goog.dom.classes.has(element, className);
  goog.dom.classes.enable(element, className, add);
  return add
};
goog.provide("goog.math");
goog.require("goog.array");
goog.math.randomInt = function(a) {
  return Math.floor(Math.random() * a)
};
goog.math.uniformRandom = function(a, b) {
  return a + Math.random() * (b - a)
};
goog.math.clamp = function(value, min, max) {
  return Math.min(Math.max(value, min), max)
};
goog.math.modulo = function(a, b) {
  var r = a % b;
  return r * b < 0 ? r + b : r
};
goog.math.lerp = function(a, b, x) {
  return a + x * (b - a)
};
goog.math.nearlyEquals = function(a, b, opt_tolerance) {
  return Math.abs(a - b) <= (opt_tolerance || 1E-6)
};
goog.math.standardAngle = function(angle) {
  return goog.math.modulo(angle, 360)
};
goog.math.toRadians = function(angleDegrees) {
  return angleDegrees * Math.PI / 180
};
goog.math.toDegrees = function(angleRadians) {
  return angleRadians * 180 / Math.PI
};
goog.math.angleDx = function(degrees, radius) {
  return radius * Math.cos(goog.math.toRadians(degrees))
};
goog.math.angleDy = function(degrees, radius) {
  return radius * Math.sin(goog.math.toRadians(degrees))
};
goog.math.angle = function(x1, y1, x2, y2) {
  return goog.math.standardAngle(goog.math.toDegrees(Math.atan2(y2 - y1, x2 - x1)))
};
goog.math.angleDifference = function(startAngle, endAngle) {
  var d = goog.math.standardAngle(endAngle) - goog.math.standardAngle(startAngle);
  if(d > 180) {
    d = d - 360
  }else {
    if(d <= -180) {
      d = 360 + d
    }
  }
  return d
};
goog.math.sign = function(x) {
  return x == 0 ? 0 : x < 0 ? -1 : 1
};
goog.math.longestCommonSubsequence = function(array1, array2, opt_compareFn, opt_collectorFn) {
  var compare = opt_compareFn || function(a, b) {
    return a == b
  };
  var collect = opt_collectorFn || function(i1, i2) {
    return array1[i1]
  };
  var length1 = array1.length;
  var length2 = array2.length;
  var arr = [];
  for(var i = 0;i < length1 + 1;i++) {
    arr[i] = [];
    arr[i][0] = 0
  }
  for(var j = 0;j < length2 + 1;j++) {
    arr[0][j] = 0
  }
  for(i = 1;i <= length1;i++) {
    for(j = 1;j <= length1;j++) {
      if(compare(array1[i - 1], array2[j - 1])) {
        arr[i][j] = arr[i - 1][j - 1] + 1
      }else {
        arr[i][j] = Math.max(arr[i - 1][j], arr[i][j - 1])
      }
    }
  }
  var result = [];
  var i = length1, j = length2;
  while(i > 0 && j > 0) {
    if(compare(array1[i - 1], array2[j - 1])) {
      result.unshift(collect(i - 1, j - 1));
      i--;
      j--
    }else {
      if(arr[i - 1][j] > arr[i][j - 1]) {
        i--
      }else {
        j--
      }
    }
  }
  return result
};
goog.math.sum = function(var_args) {
  return goog.array.reduce(arguments, function(sum, value) {
    return sum + value
  }, 0)
};
goog.math.average = function(var_args) {
  return goog.math.sum.apply(null, arguments) / arguments.length
};
goog.math.standardDeviation = function(var_args) {
  var sampleSize = arguments.length;
  if(sampleSize < 2) {
    return 0
  }
  var mean = goog.math.average.apply(null, arguments);
  var variance = goog.math.sum.apply(null, goog.array.map(arguments, function(val) {
    return Math.pow(val - mean, 2)
  })) / (sampleSize - 1);
  return Math.sqrt(variance)
};
goog.math.isInt = function(num) {
  return isFinite(num) && num % 1 == 0
};
goog.math.isFiniteNumber = function(num) {
  return isFinite(num) && !isNaN(num)
};
goog.provide("goog.math.Coordinate");
goog.require("goog.math");
goog.math.Coordinate = function(opt_x, opt_y) {
  this.x = goog.isDef(opt_x) ? opt_x : 0;
  this.y = goog.isDef(opt_y) ? opt_y : 0
};
goog.math.Coordinate.prototype.clone = function() {
  return new goog.math.Coordinate(this.x, this.y)
};
if(goog.DEBUG) {
  goog.math.Coordinate.prototype.toString = function() {
    return"(" + this.x + ", " + this.y + ")"
  }
}
goog.math.Coordinate.equals = function(a, b) {
  if(a == b) {
    return true
  }
  if(!a || !b) {
    return false
  }
  return a.x == b.x && a.y == b.y
};
goog.math.Coordinate.distance = function(a, b) {
  var dx = a.x - b.x;
  var dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy)
};
goog.math.Coordinate.magnitude = function(a) {
  return Math.sqrt(a.x * a.x + a.y * a.y)
};
goog.math.Coordinate.azimuth = function(a) {
  return goog.math.angle(0, 0, a.x, a.y)
};
goog.math.Coordinate.squaredDistance = function(a, b) {
  var dx = a.x - b.x;
  var dy = a.y - b.y;
  return dx * dx + dy * dy
};
goog.math.Coordinate.difference = function(a, b) {
  return new goog.math.Coordinate(a.x - b.x, a.y - b.y)
};
goog.math.Coordinate.sum = function(a, b) {
  return new goog.math.Coordinate(a.x + b.x, a.y + b.y)
};
goog.provide("goog.math.Size");
goog.math.Size = function(width, height) {
  this.width = width;
  this.height = height
};
goog.math.Size.equals = function(a, b) {
  if(a == b) {
    return true
  }
  if(!a || !b) {
    return false
  }
  return a.width == b.width && a.height == b.height
};
goog.math.Size.prototype.clone = function() {
  return new goog.math.Size(this.width, this.height)
};
if(goog.DEBUG) {
  goog.math.Size.prototype.toString = function() {
    return"(" + this.width + " x " + this.height + ")"
  }
}
goog.math.Size.prototype.getLongest = function() {
  return Math.max(this.width, this.height)
};
goog.math.Size.prototype.getShortest = function() {
  return Math.min(this.width, this.height)
};
goog.math.Size.prototype.area = function() {
  return this.width * this.height
};
goog.math.Size.prototype.perimeter = function() {
  return(this.width + this.height) * 2
};
goog.math.Size.prototype.aspectRatio = function() {
  return this.width / this.height
};
goog.math.Size.prototype.isEmpty = function() {
  return!this.area()
};
goog.math.Size.prototype.ceil = function() {
  this.width = Math.ceil(this.width);
  this.height = Math.ceil(this.height);
  return this
};
goog.math.Size.prototype.fitsInside = function(target) {
  return this.width <= target.width && this.height <= target.height
};
goog.math.Size.prototype.floor = function() {
  this.width = Math.floor(this.width);
  this.height = Math.floor(this.height);
  return this
};
goog.math.Size.prototype.round = function() {
  this.width = Math.round(this.width);
  this.height = Math.round(this.height);
  return this
};
goog.math.Size.prototype.scale = function(s) {
  this.width *= s;
  this.height *= s;
  return this
};
goog.math.Size.prototype.scaleToFit = function(target) {
  var s = this.aspectRatio() > target.aspectRatio() ? target.width / this.width : target.height / this.height;
  return this.scale(s)
};
goog.provide("goog.dom");
goog.provide("goog.dom.DomHelper");
goog.provide("goog.dom.NodeType");
goog.require("goog.array");
goog.require("goog.dom.BrowserFeature");
goog.require("goog.dom.TagName");
goog.require("goog.dom.classes");
goog.require("goog.math.Coordinate");
goog.require("goog.math.Size");
goog.require("goog.object");
goog.require("goog.string");
goog.require("goog.userAgent");
goog.dom.ASSUME_QUIRKS_MODE = false;
goog.dom.ASSUME_STANDARDS_MODE = false;
goog.dom.COMPAT_MODE_KNOWN_ = goog.dom.ASSUME_QUIRKS_MODE || goog.dom.ASSUME_STANDARDS_MODE;
goog.dom.NodeType = {ELEMENT:1, ATTRIBUTE:2, TEXT:3, CDATA_SECTION:4, ENTITY_REFERENCE:5, ENTITY:6, PROCESSING_INSTRUCTION:7, COMMENT:8, DOCUMENT:9, DOCUMENT_TYPE:10, DOCUMENT_FRAGMENT:11, NOTATION:12};
goog.dom.getDomHelper = function(opt_element) {
  return opt_element ? new goog.dom.DomHelper(goog.dom.getOwnerDocument(opt_element)) : goog.dom.defaultDomHelper_ || (goog.dom.defaultDomHelper_ = new goog.dom.DomHelper)
};
goog.dom.defaultDomHelper_;
goog.dom.getDocument = function() {
  return document
};
goog.dom.getElement = function(element) {
  return goog.isString(element) ? document.getElementById(element) : element
};
goog.dom.$ = goog.dom.getElement;
goog.dom.getElementsByTagNameAndClass = function(opt_tag, opt_class, opt_el) {
  return goog.dom.getElementsByTagNameAndClass_(document, opt_tag, opt_class, opt_el)
};
goog.dom.getElementsByClass = function(className, opt_el) {
  var parent = opt_el || document;
  if(goog.dom.canUseQuerySelector_(parent)) {
    return parent.querySelectorAll("." + className)
  }else {
    if(parent.getElementsByClassName) {
      return parent.getElementsByClassName(className)
    }
  }
  return goog.dom.getElementsByTagNameAndClass_(document, "*", className, opt_el)
};
goog.dom.getElementByClass = function(className, opt_el) {
  var parent = opt_el || document;
  var retVal = null;
  if(goog.dom.canUseQuerySelector_(parent)) {
    retVal = parent.querySelector("." + className)
  }else {
    retVal = goog.dom.getElementsByClass(className, opt_el)[0]
  }
  return retVal || null
};
goog.dom.canUseQuerySelector_ = function(parent) {
  return!!(parent.querySelectorAll && parent.querySelector)
};
goog.dom.getElementsByTagNameAndClass_ = function(doc, opt_tag, opt_class, opt_el) {
  var parent = opt_el || doc;
  var tagName = opt_tag && opt_tag != "*" ? opt_tag.toUpperCase() : "";
  if(goog.dom.canUseQuerySelector_(parent) && (tagName || opt_class)) {
    var query = tagName + (opt_class ? "." + opt_class : "");
    return parent.querySelectorAll(query)
  }
  if(opt_class && parent.getElementsByClassName) {
    var els = parent.getElementsByClassName(opt_class);
    if(tagName) {
      var arrayLike = {};
      var len = 0;
      for(var i = 0, el;el = els[i];i++) {
        if(tagName == el.nodeName) {
          arrayLike[len++] = el
        }
      }
      arrayLike.length = len;
      return arrayLike
    }else {
      return els
    }
  }
  var els = parent.getElementsByTagName(tagName || "*");
  if(opt_class) {
    var arrayLike = {};
    var len = 0;
    for(var i = 0, el;el = els[i];i++) {
      var className = el.className;
      if(typeof className.split == "function" && goog.array.contains(className.split(/\s+/), opt_class)) {
        arrayLike[len++] = el
      }
    }
    arrayLike.length = len;
    return arrayLike
  }else {
    return els
  }
};
goog.dom.$$ = goog.dom.getElementsByTagNameAndClass;
goog.dom.setProperties = function(element, properties) {
  goog.object.forEach(properties, function(val, key) {
    if(key == "style") {
      element.style.cssText = val
    }else {
      if(key == "class") {
        element.className = val
      }else {
        if(key == "for") {
          element.htmlFor = val
        }else {
          if(key in goog.dom.DIRECT_ATTRIBUTE_MAP_) {
            element.setAttribute(goog.dom.DIRECT_ATTRIBUTE_MAP_[key], val)
          }else {
            if(goog.string.startsWith(key, "aria-") || goog.string.startsWith(key, "data-")) {
              element.setAttribute(key, val)
            }else {
              element[key] = val
            }
          }
        }
      }
    }
  })
};
goog.dom.DIRECT_ATTRIBUTE_MAP_ = {"cellpadding":"cellPadding", "cellspacing":"cellSpacing", "colspan":"colSpan", "frameborder":"frameBorder", "height":"height", "maxlength":"maxLength", "role":"role", "rowspan":"rowSpan", "type":"type", "usemap":"useMap", "valign":"vAlign", "width":"width"};
goog.dom.getViewportSize = function(opt_window) {
  return goog.dom.getViewportSize_(opt_window || window)
};
goog.dom.getViewportSize_ = function(win) {
  var doc = win.document;
  var el = goog.dom.isCss1CompatMode_(doc) ? doc.documentElement : doc.body;
  return new goog.math.Size(el.clientWidth, el.clientHeight)
};
goog.dom.getDocumentHeight = function() {
  return goog.dom.getDocumentHeight_(window)
};
goog.dom.getDocumentHeight_ = function(win) {
  var doc = win.document;
  var height = 0;
  if(doc) {
    var vh = goog.dom.getViewportSize_(win).height;
    var body = doc.body;
    var docEl = doc.documentElement;
    if(goog.dom.isCss1CompatMode_(doc) && docEl.scrollHeight) {
      height = docEl.scrollHeight != vh ? docEl.scrollHeight : docEl.offsetHeight
    }else {
      var sh = docEl.scrollHeight;
      var oh = docEl.offsetHeight;
      if(docEl.clientHeight != oh) {
        sh = body.scrollHeight;
        oh = body.offsetHeight
      }
      if(sh > vh) {
        height = sh > oh ? sh : oh
      }else {
        height = sh < oh ? sh : oh
      }
    }
  }
  return height
};
goog.dom.getPageScroll = function(opt_window) {
  var win = opt_window || goog.global || window;
  return goog.dom.getDomHelper(win.document).getDocumentScroll()
};
goog.dom.getDocumentScroll = function() {
  return goog.dom.getDocumentScroll_(document)
};
goog.dom.getDocumentScroll_ = function(doc) {
  var el = goog.dom.getDocumentScrollElement_(doc);
  var win = goog.dom.getWindow_(doc);
  return new goog.math.Coordinate(win.pageXOffset || el.scrollLeft, win.pageYOffset || el.scrollTop)
};
goog.dom.getDocumentScrollElement = function() {
  return goog.dom.getDocumentScrollElement_(document)
};
goog.dom.getDocumentScrollElement_ = function(doc) {
  return!goog.userAgent.WEBKIT && goog.dom.isCss1CompatMode_(doc) ? doc.documentElement : doc.body
};
goog.dom.getWindow = function(opt_doc) {
  return opt_doc ? goog.dom.getWindow_(opt_doc) : window
};
goog.dom.getWindow_ = function(doc) {
  return doc.parentWindow || doc.defaultView
};
goog.dom.createDom = function(tagName, opt_attributes, var_args) {
  return goog.dom.createDom_(document, arguments)
};
goog.dom.createDom_ = function(doc, args) {
  var tagName = args[0];
  var attributes = args[1];
  if(!goog.dom.BrowserFeature.CAN_ADD_NAME_OR_TYPE_ATTRIBUTES && attributes && (attributes.name || attributes.type)) {
    var tagNameArr = ["<", tagName];
    if(attributes.name) {
      tagNameArr.push(' name="', goog.string.htmlEscape(attributes.name), '"')
    }
    if(attributes.type) {
      tagNameArr.push(' type="', goog.string.htmlEscape(attributes.type), '"');
      var clone = {};
      goog.object.extend(clone, attributes);
      delete clone["type"];
      attributes = clone
    }
    tagNameArr.push(">");
    tagName = tagNameArr.join("")
  }
  var element = doc.createElement(tagName);
  if(attributes) {
    if(goog.isString(attributes)) {
      element.className = attributes
    }else {
      if(goog.isArray(attributes)) {
        goog.dom.classes.add.apply(null, [element].concat(attributes))
      }else {
        goog.dom.setProperties(element, attributes)
      }
    }
  }
  if(args.length > 2) {
    goog.dom.append_(doc, element, args, 2)
  }
  return element
};
goog.dom.append_ = function(doc, parent, args, startIndex) {
  function childHandler(child) {
    if(child) {
      parent.appendChild(goog.isString(child) ? doc.createTextNode(child) : child)
    }
  }
  for(var i = startIndex;i < args.length;i++) {
    var arg = args[i];
    if(goog.isArrayLike(arg) && !goog.dom.isNodeLike(arg)) {
      goog.array.forEach(goog.dom.isNodeList(arg) ? goog.array.toArray(arg) : arg, childHandler)
    }else {
      childHandler(arg)
    }
  }
};
goog.dom.$dom = goog.dom.createDom;
goog.dom.createElement = function(name) {
  return document.createElement(name)
};
goog.dom.createTextNode = function(content) {
  return document.createTextNode(content)
};
goog.dom.createTable = function(rows, columns, opt_fillWithNbsp) {
  return goog.dom.createTable_(document, rows, columns, !!opt_fillWithNbsp)
};
goog.dom.createTable_ = function(doc, rows, columns, fillWithNbsp) {
  var rowHtml = ["<tr>"];
  for(var i = 0;i < columns;i++) {
    rowHtml.push(fillWithNbsp ? "<td>&nbsp;</td>" : "<td></td>")
  }
  rowHtml.push("</tr>");
  rowHtml = rowHtml.join("");
  var totalHtml = ["<table>"];
  for(i = 0;i < rows;i++) {
    totalHtml.push(rowHtml)
  }
  totalHtml.push("</table>");
  var elem = doc.createElement(goog.dom.TagName.DIV);
  elem.innerHTML = totalHtml.join("");
  return elem.removeChild(elem.firstChild)
};
goog.dom.htmlToDocumentFragment = function(htmlString) {
  return goog.dom.htmlToDocumentFragment_(document, htmlString)
};
goog.dom.htmlToDocumentFragment_ = function(doc, htmlString) {
  var tempDiv = doc.createElement("div");
  if(goog.dom.BrowserFeature.INNER_HTML_NEEDS_SCOPED_ELEMENT) {
    tempDiv.innerHTML = "<br>" + htmlString;
    tempDiv.removeChild(tempDiv.firstChild)
  }else {
    tempDiv.innerHTML = htmlString
  }
  if(tempDiv.childNodes.length == 1) {
    return tempDiv.removeChild(tempDiv.firstChild)
  }else {
    var fragment = doc.createDocumentFragment();
    while(tempDiv.firstChild) {
      fragment.appendChild(tempDiv.firstChild)
    }
    return fragment
  }
};
goog.dom.getCompatMode = function() {
  return goog.dom.isCss1CompatMode() ? "CSS1Compat" : "BackCompat"
};
goog.dom.isCss1CompatMode = function() {
  return goog.dom.isCss1CompatMode_(document)
};
goog.dom.isCss1CompatMode_ = function(doc) {
  if(goog.dom.COMPAT_MODE_KNOWN_) {
    return goog.dom.ASSUME_STANDARDS_MODE
  }
  return doc.compatMode == "CSS1Compat"
};
goog.dom.canHaveChildren = function(node) {
  if(node.nodeType != goog.dom.NodeType.ELEMENT) {
    return false
  }
  switch(node.tagName) {
    case goog.dom.TagName.APPLET:
    ;
    case goog.dom.TagName.AREA:
    ;
    case goog.dom.TagName.BASE:
    ;
    case goog.dom.TagName.BR:
    ;
    case goog.dom.TagName.COL:
    ;
    case goog.dom.TagName.COMMAND:
    ;
    case goog.dom.TagName.EMBED:
    ;
    case goog.dom.TagName.FRAME:
    ;
    case goog.dom.TagName.HR:
    ;
    case goog.dom.TagName.IMG:
    ;
    case goog.dom.TagName.INPUT:
    ;
    case goog.dom.TagName.IFRAME:
    ;
    case goog.dom.TagName.ISINDEX:
    ;
    case goog.dom.TagName.KEYGEN:
    ;
    case goog.dom.TagName.LINK:
    ;
    case goog.dom.TagName.NOFRAMES:
    ;
    case goog.dom.TagName.NOSCRIPT:
    ;
    case goog.dom.TagName.META:
    ;
    case goog.dom.TagName.OBJECT:
    ;
    case goog.dom.TagName.PARAM:
    ;
    case goog.dom.TagName.SCRIPT:
    ;
    case goog.dom.TagName.SOURCE:
    ;
    case goog.dom.TagName.STYLE:
    ;
    case goog.dom.TagName.TRACK:
    ;
    case goog.dom.TagName.WBR:
      return false
  }
  return true
};
goog.dom.appendChild = function(parent, child) {
  parent.appendChild(child)
};
goog.dom.append = function(parent, var_args) {
  goog.dom.append_(goog.dom.getOwnerDocument(parent), parent, arguments, 1)
};
goog.dom.removeChildren = function(node) {
  var child;
  while(child = node.firstChild) {
    node.removeChild(child)
  }
};
goog.dom.insertSiblingBefore = function(newNode, refNode) {
  if(refNode.parentNode) {
    refNode.parentNode.insertBefore(newNode, refNode)
  }
};
goog.dom.insertSiblingAfter = function(newNode, refNode) {
  if(refNode.parentNode) {
    refNode.parentNode.insertBefore(newNode, refNode.nextSibling)
  }
};
goog.dom.insertChildAt = function(parent, child, index) {
  parent.insertBefore(child, parent.childNodes[index] || null)
};
goog.dom.removeNode = function(node) {
  return node && node.parentNode ? node.parentNode.removeChild(node) : null
};
goog.dom.replaceNode = function(newNode, oldNode) {
  var parent = oldNode.parentNode;
  if(parent) {
    parent.replaceChild(newNode, oldNode)
  }
};
goog.dom.flattenElement = function(element) {
  var child, parent = element.parentNode;
  if(parent && parent.nodeType != goog.dom.NodeType.DOCUMENT_FRAGMENT) {
    if(element.removeNode) {
      return element.removeNode(false)
    }else {
      while(child = element.firstChild) {
        parent.insertBefore(child, element)
      }
      return goog.dom.removeNode(element)
    }
  }
};
goog.dom.getChildren = function(element) {
  if(goog.dom.BrowserFeature.CAN_USE_CHILDREN_ATTRIBUTE && element.children != undefined) {
    return element.children
  }
  return goog.array.filter(element.childNodes, function(node) {
    return node.nodeType == goog.dom.NodeType.ELEMENT
  })
};
goog.dom.getFirstElementChild = function(node) {
  if(node.firstElementChild != undefined) {
    return node.firstElementChild
  }
  return goog.dom.getNextElementNode_(node.firstChild, true)
};
goog.dom.getLastElementChild = function(node) {
  if(node.lastElementChild != undefined) {
    return node.lastElementChild
  }
  return goog.dom.getNextElementNode_(node.lastChild, false)
};
goog.dom.getNextElementSibling = function(node) {
  if(node.nextElementSibling != undefined) {
    return node.nextElementSibling
  }
  return goog.dom.getNextElementNode_(node.nextSibling, true)
};
goog.dom.getPreviousElementSibling = function(node) {
  if(node.previousElementSibling != undefined) {
    return node.previousElementSibling
  }
  return goog.dom.getNextElementNode_(node.previousSibling, false)
};
goog.dom.getNextElementNode_ = function(node, forward) {
  while(node && node.nodeType != goog.dom.NodeType.ELEMENT) {
    node = forward ? node.nextSibling : node.previousSibling
  }
  return node
};
goog.dom.getNextNode = function(node) {
  if(!node) {
    return null
  }
  if(node.firstChild) {
    return node.firstChild
  }
  while(node && !node.nextSibling) {
    node = node.parentNode
  }
  return node ? node.nextSibling : null
};
goog.dom.getPreviousNode = function(node) {
  if(!node) {
    return null
  }
  if(!node.previousSibling) {
    return node.parentNode
  }
  node = node.previousSibling;
  while(node && node.lastChild) {
    node = node.lastChild
  }
  return node
};
goog.dom.isNodeLike = function(obj) {
  return goog.isObject(obj) && obj.nodeType > 0
};
goog.dom.isElement = function(obj) {
  return goog.isObject(obj) && obj.nodeType == goog.dom.NodeType.ELEMENT
};
goog.dom.isWindow = function(obj) {
  return goog.isObject(obj) && obj["window"] == obj
};
goog.dom.getParentElement = function(element) {
  if(goog.dom.BrowserFeature.CAN_USE_PARENT_ELEMENT_PROPERTY) {
    return element.parentElement
  }
  var parent = element.parentNode;
  return goog.dom.isElement(parent) ? parent : null
};
goog.dom.contains = function(parent, descendant) {
  if(parent.contains && descendant.nodeType == goog.dom.NodeType.ELEMENT) {
    return parent == descendant || parent.contains(descendant)
  }
  if(typeof parent.compareDocumentPosition != "undefined") {
    return parent == descendant || Boolean(parent.compareDocumentPosition(descendant) & 16)
  }
  while(descendant && parent != descendant) {
    descendant = descendant.parentNode
  }
  return descendant == parent
};
goog.dom.compareNodeOrder = function(node1, node2) {
  if(node1 == node2) {
    return 0
  }
  if(node1.compareDocumentPosition) {
    return node1.compareDocumentPosition(node2) & 2 ? 1 : -1
  }
  if((node1.nodeType == goog.dom.NodeType.DOCUMENT || node2.nodeType == goog.dom.NodeType.DOCUMENT) && goog.userAgent.IE && !goog.userAgent.isVersion(9)) {
    if(node1.nodeType == goog.dom.NodeType.DOCUMENT) {
      return-1
    }
    if(node2.nodeType == goog.dom.NodeType.DOCUMENT) {
      return 1
    }
  }
  if("sourceIndex" in node1 || node1.parentNode && "sourceIndex" in node1.parentNode) {
    var isElement1 = node1.nodeType == goog.dom.NodeType.ELEMENT;
    var isElement2 = node2.nodeType == goog.dom.NodeType.ELEMENT;
    if(isElement1 && isElement2) {
      return node1.sourceIndex - node2.sourceIndex
    }else {
      var parent1 = node1.parentNode;
      var parent2 = node2.parentNode;
      if(parent1 == parent2) {
        return goog.dom.compareSiblingOrder_(node1, node2)
      }
      if(!isElement1 && goog.dom.contains(parent1, node2)) {
        return-1 * goog.dom.compareParentsDescendantNodeIe_(node1, node2)
      }
      if(!isElement2 && goog.dom.contains(parent2, node1)) {
        return goog.dom.compareParentsDescendantNodeIe_(node2, node1)
      }
      return(isElement1 ? node1.sourceIndex : parent1.sourceIndex) - (isElement2 ? node2.sourceIndex : parent2.sourceIndex)
    }
  }
  var doc = goog.dom.getOwnerDocument(node1);
  var range1, range2;
  range1 = doc.createRange();
  range1.selectNode(node1);
  range1.collapse(true);
  range2 = doc.createRange();
  range2.selectNode(node2);
  range2.collapse(true);
  return range1.compareBoundaryPoints(goog.global["Range"].START_TO_END, range2)
};
goog.dom.compareParentsDescendantNodeIe_ = function(textNode, node) {
  var parent = textNode.parentNode;
  if(parent == node) {
    return-1
  }
  var sibling = node;
  while(sibling.parentNode != parent) {
    sibling = sibling.parentNode
  }
  return goog.dom.compareSiblingOrder_(sibling, textNode)
};
goog.dom.compareSiblingOrder_ = function(node1, node2) {
  var s = node2;
  while(s = s.previousSibling) {
    if(s == node1) {
      return-1
    }
  }
  return 1
};
goog.dom.findCommonAncestor = function(var_args) {
  var i, count = arguments.length;
  if(!count) {
    return null
  }else {
    if(count == 1) {
      return arguments[0]
    }
  }
  var paths = [];
  var minLength = Infinity;
  for(i = 0;i < count;i++) {
    var ancestors = [];
    var node = arguments[i];
    while(node) {
      ancestors.unshift(node);
      node = node.parentNode
    }
    paths.push(ancestors);
    minLength = Math.min(minLength, ancestors.length)
  }
  var output = null;
  for(i = 0;i < minLength;i++) {
    var first = paths[0][i];
    for(var j = 1;j < count;j++) {
      if(first != paths[j][i]) {
        return output
      }
    }
    output = first
  }
  return output
};
goog.dom.getOwnerDocument = function(node) {
  return node.nodeType == goog.dom.NodeType.DOCUMENT ? node : node.ownerDocument || node.document
};
goog.dom.getFrameContentDocument = function(frame) {
  var doc = frame.contentDocument || frame.contentWindow.document;
  return doc
};
goog.dom.getFrameContentWindow = function(frame) {
  return frame.contentWindow || goog.dom.getWindow_(goog.dom.getFrameContentDocument(frame))
};
goog.dom.setTextContent = function(element, text) {
  if("textContent" in element) {
    element.textContent = text
  }else {
    if(element.firstChild && element.firstChild.nodeType == goog.dom.NodeType.TEXT) {
      while(element.lastChild != element.firstChild) {
        element.removeChild(element.lastChild)
      }
      element.firstChild.data = text
    }else {
      goog.dom.removeChildren(element);
      var doc = goog.dom.getOwnerDocument(element);
      element.appendChild(doc.createTextNode(text))
    }
  }
};
goog.dom.getOuterHtml = function(element) {
  if("outerHTML" in element) {
    return element.outerHTML
  }else {
    var doc = goog.dom.getOwnerDocument(element);
    var div = doc.createElement("div");
    div.appendChild(element.cloneNode(true));
    return div.innerHTML
  }
};
goog.dom.findNode = function(root, p) {
  var rv = [];
  var found = goog.dom.findNodes_(root, p, rv, true);
  return found ? rv[0] : undefined
};
goog.dom.findNodes = function(root, p) {
  var rv = [];
  goog.dom.findNodes_(root, p, rv, false);
  return rv
};
goog.dom.findNodes_ = function(root, p, rv, findOne) {
  if(root != null) {
    var child = root.firstChild;
    while(child) {
      if(p(child)) {
        rv.push(child);
        if(findOne) {
          return true
        }
      }
      if(goog.dom.findNodes_(child, p, rv, findOne)) {
        return true
      }
      child = child.nextSibling
    }
  }
  return false
};
goog.dom.TAGS_TO_IGNORE_ = {"SCRIPT":1, "STYLE":1, "HEAD":1, "IFRAME":1, "OBJECT":1};
goog.dom.PREDEFINED_TAG_VALUES_ = {"IMG":" ", "BR":"\n"};
goog.dom.isFocusableTabIndex = function(element) {
  var attrNode = element.getAttributeNode("tabindex");
  if(attrNode && attrNode.specified) {
    var index = element.tabIndex;
    return goog.isNumber(index) && index >= 0 && index < 32768
  }
  return false
};
goog.dom.setFocusableTabIndex = function(element, enable) {
  if(enable) {
    element.tabIndex = 0
  }else {
    element.tabIndex = -1;
    element.removeAttribute("tabIndex")
  }
};
goog.dom.getTextContent = function(node) {
  var textContent;
  if(goog.dom.BrowserFeature.CAN_USE_INNER_TEXT && "innerText" in node) {
    textContent = goog.string.canonicalizeNewlines(node.innerText)
  }else {
    var buf = [];
    goog.dom.getTextContent_(node, buf, true);
    textContent = buf.join("")
  }
  textContent = textContent.replace(/ \xAD /g, " ").replace(/\xAD/g, "");
  textContent = textContent.replace(/\u200B/g, "");
  if(!goog.dom.BrowserFeature.CAN_USE_INNER_TEXT) {
    textContent = textContent.replace(/ +/g, " ")
  }
  if(textContent != " ") {
    textContent = textContent.replace(/^\s*/, "")
  }
  return textContent
};
goog.dom.getRawTextContent = function(node) {
  var buf = [];
  goog.dom.getTextContent_(node, buf, false);
  return buf.join("")
};
goog.dom.getTextContent_ = function(node, buf, normalizeWhitespace) {
  if(node.nodeName in goog.dom.TAGS_TO_IGNORE_) {
  }else {
    if(node.nodeType == goog.dom.NodeType.TEXT) {
      if(normalizeWhitespace) {
        buf.push(String(node.nodeValue).replace(/(\r\n|\r|\n)/g, ""))
      }else {
        buf.push(node.nodeValue)
      }
    }else {
      if(node.nodeName in goog.dom.PREDEFINED_TAG_VALUES_) {
        buf.push(goog.dom.PREDEFINED_TAG_VALUES_[node.nodeName])
      }else {
        var child = node.firstChild;
        while(child) {
          goog.dom.getTextContent_(child, buf, normalizeWhitespace);
          child = child.nextSibling
        }
      }
    }
  }
};
goog.dom.getNodeTextLength = function(node) {
  return goog.dom.getTextContent(node).length
};
goog.dom.getNodeTextOffset = function(node, opt_offsetParent) {
  var root = opt_offsetParent || goog.dom.getOwnerDocument(node).body;
  var buf = [];
  while(node && node != root) {
    var cur = node;
    while(cur = cur.previousSibling) {
      buf.unshift(goog.dom.getTextContent(cur))
    }
    node = node.parentNode
  }
  return goog.string.trimLeft(buf.join("")).replace(/ +/g, " ").length
};
goog.dom.getNodeAtOffset = function(parent, offset, opt_result) {
  var stack = [parent], pos = 0, cur;
  while(stack.length > 0 && pos < offset) {
    cur = stack.pop();
    if(cur.nodeName in goog.dom.TAGS_TO_IGNORE_) {
    }else {
      if(cur.nodeType == goog.dom.NodeType.TEXT) {
        var text = cur.nodeValue.replace(/(\r\n|\r|\n)/g, "").replace(/ +/g, " ");
        pos += text.length
      }else {
        if(cur.nodeName in goog.dom.PREDEFINED_TAG_VALUES_) {
          pos += goog.dom.PREDEFINED_TAG_VALUES_[cur.nodeName].length
        }else {
          for(var i = cur.childNodes.length - 1;i >= 0;i--) {
            stack.push(cur.childNodes[i])
          }
        }
      }
    }
  }
  if(goog.isObject(opt_result)) {
    opt_result.remainder = cur ? cur.nodeValue.length + offset - pos - 1 : 0;
    opt_result.node = cur
  }
  return cur
};
goog.dom.isNodeList = function(val) {
  if(val && typeof val.length == "number") {
    if(goog.isObject(val)) {
      return typeof val.item == "function" || typeof val.item == "string"
    }else {
      if(goog.isFunction(val)) {
        return typeof val.item == "function"
      }
    }
  }
  return false
};
goog.dom.getAncestorByTagNameAndClass = function(element, opt_tag, opt_class) {
  if(!opt_tag && !opt_class) {
    return null
  }
  var tagName = opt_tag ? opt_tag.toUpperCase() : null;
  return goog.dom.getAncestor(element, function(node) {
    return(!tagName || node.nodeName == tagName) && (!opt_class || goog.dom.classes.has(node, opt_class))
  }, true)
};
goog.dom.getAncestorByClass = function(element, className) {
  return goog.dom.getAncestorByTagNameAndClass(element, null, className)
};
goog.dom.getAncestor = function(element, matcher, opt_includeNode, opt_maxSearchSteps) {
  if(!opt_includeNode) {
    element = element.parentNode
  }
  var ignoreSearchSteps = opt_maxSearchSteps == null;
  var steps = 0;
  while(element && (ignoreSearchSteps || steps <= opt_maxSearchSteps)) {
    if(matcher(element)) {
      return element
    }
    element = element.parentNode;
    steps++
  }
  return null
};
goog.dom.getActiveElement = function(doc) {
  try {
    return doc && doc.activeElement
  }catch(e) {
  }
  return null
};
goog.dom.DomHelper = function(opt_document) {
  this.document_ = opt_document || goog.global.document || document
};
goog.dom.DomHelper.prototype.getDomHelper = goog.dom.getDomHelper;
goog.dom.DomHelper.prototype.setDocument = function(document) {
  this.document_ = document
};
goog.dom.DomHelper.prototype.getDocument = function() {
  return this.document_
};
goog.dom.DomHelper.prototype.getElement = function(element) {
  if(goog.isString(element)) {
    return this.document_.getElementById(element)
  }else {
    return element
  }
};
goog.dom.DomHelper.prototype.$ = goog.dom.DomHelper.prototype.getElement;
goog.dom.DomHelper.prototype.getElementsByTagNameAndClass = function(opt_tag, opt_class, opt_el) {
  return goog.dom.getElementsByTagNameAndClass_(this.document_, opt_tag, opt_class, opt_el)
};
goog.dom.DomHelper.prototype.getElementsByClass = function(className, opt_el) {
  var doc = opt_el || this.document_;
  return goog.dom.getElementsByClass(className, doc)
};
goog.dom.DomHelper.prototype.getElementByClass = function(className, opt_el) {
  var doc = opt_el || this.document_;
  return goog.dom.getElementByClass(className, doc)
};
goog.dom.DomHelper.prototype.$$ = goog.dom.DomHelper.prototype.getElementsByTagNameAndClass;
goog.dom.DomHelper.prototype.setProperties = goog.dom.setProperties;
goog.dom.DomHelper.prototype.getViewportSize = function(opt_window) {
  return goog.dom.getViewportSize(opt_window || this.getWindow())
};
goog.dom.DomHelper.prototype.getDocumentHeight = function() {
  return goog.dom.getDocumentHeight_(this.getWindow())
};
goog.dom.Appendable;
goog.dom.DomHelper.prototype.createDom = function(tagName, opt_attributes, var_args) {
  return goog.dom.createDom_(this.document_, arguments)
};
goog.dom.DomHelper.prototype.$dom = goog.dom.DomHelper.prototype.createDom;
goog.dom.DomHelper.prototype.createElement = function(name) {
  return this.document_.createElement(name)
};
goog.dom.DomHelper.prototype.createTextNode = function(content) {
  return this.document_.createTextNode(content)
};
goog.dom.DomHelper.prototype.createTable = function(rows, columns, opt_fillWithNbsp) {
  return goog.dom.createTable_(this.document_, rows, columns, !!opt_fillWithNbsp)
};
goog.dom.DomHelper.prototype.htmlToDocumentFragment = function(htmlString) {
  return goog.dom.htmlToDocumentFragment_(this.document_, htmlString)
};
goog.dom.DomHelper.prototype.getCompatMode = function() {
  return this.isCss1CompatMode() ? "CSS1Compat" : "BackCompat"
};
goog.dom.DomHelper.prototype.isCss1CompatMode = function() {
  return goog.dom.isCss1CompatMode_(this.document_)
};
goog.dom.DomHelper.prototype.getWindow = function() {
  return goog.dom.getWindow_(this.document_)
};
goog.dom.DomHelper.prototype.getDocumentScrollElement = function() {
  return goog.dom.getDocumentScrollElement_(this.document_)
};
goog.dom.DomHelper.prototype.getDocumentScroll = function() {
  return goog.dom.getDocumentScroll_(this.document_)
};
goog.dom.DomHelper.prototype.getActiveElement = function(opt_doc) {
  return goog.dom.getActiveElement(opt_doc || this.document_)
};
goog.dom.DomHelper.prototype.appendChild = goog.dom.appendChild;
goog.dom.DomHelper.prototype.append = goog.dom.append;
goog.dom.DomHelper.prototype.canHaveChildren = goog.dom.canHaveChildren;
goog.dom.DomHelper.prototype.removeChildren = goog.dom.removeChildren;
goog.dom.DomHelper.prototype.insertSiblingBefore = goog.dom.insertSiblingBefore;
goog.dom.DomHelper.prototype.insertSiblingAfter = goog.dom.insertSiblingAfter;
goog.dom.DomHelper.prototype.insertChildAt = goog.dom.insertChildAt;
goog.dom.DomHelper.prototype.removeNode = goog.dom.removeNode;
goog.dom.DomHelper.prototype.replaceNode = goog.dom.replaceNode;
goog.dom.DomHelper.prototype.flattenElement = goog.dom.flattenElement;
goog.dom.DomHelper.prototype.getChildren = goog.dom.getChildren;
goog.dom.DomHelper.prototype.getFirstElementChild = goog.dom.getFirstElementChild;
goog.dom.DomHelper.prototype.getLastElementChild = goog.dom.getLastElementChild;
goog.dom.DomHelper.prototype.getNextElementSibling = goog.dom.getNextElementSibling;
goog.dom.DomHelper.prototype.getPreviousElementSibling = goog.dom.getPreviousElementSibling;
goog.dom.DomHelper.prototype.getNextNode = goog.dom.getNextNode;
goog.dom.DomHelper.prototype.getPreviousNode = goog.dom.getPreviousNode;
goog.dom.DomHelper.prototype.isNodeLike = goog.dom.isNodeLike;
goog.dom.DomHelper.prototype.isElement = goog.dom.isElement;
goog.dom.DomHelper.prototype.isWindow = goog.dom.isWindow;
goog.dom.DomHelper.prototype.getParentElement = goog.dom.getParentElement;
goog.dom.DomHelper.prototype.contains = goog.dom.contains;
goog.dom.DomHelper.prototype.compareNodeOrder = goog.dom.compareNodeOrder;
goog.dom.DomHelper.prototype.findCommonAncestor = goog.dom.findCommonAncestor;
goog.dom.DomHelper.prototype.getOwnerDocument = goog.dom.getOwnerDocument;
goog.dom.DomHelper.prototype.getFrameContentDocument = goog.dom.getFrameContentDocument;
goog.dom.DomHelper.prototype.getFrameContentWindow = goog.dom.getFrameContentWindow;
goog.dom.DomHelper.prototype.setTextContent = goog.dom.setTextContent;
goog.dom.DomHelper.prototype.getOuterHtml = goog.dom.getOuterHtml;
goog.dom.DomHelper.prototype.findNode = goog.dom.findNode;
goog.dom.DomHelper.prototype.findNodes = goog.dom.findNodes;
goog.dom.DomHelper.prototype.isFocusableTabIndex = goog.dom.isFocusableTabIndex;
goog.dom.DomHelper.prototype.setFocusableTabIndex = goog.dom.setFocusableTabIndex;
goog.dom.DomHelper.prototype.getTextContent = goog.dom.getTextContent;
goog.dom.DomHelper.prototype.getNodeTextLength = goog.dom.getNodeTextLength;
goog.dom.DomHelper.prototype.getNodeTextOffset = goog.dom.getNodeTextOffset;
goog.dom.DomHelper.prototype.getNodeAtOffset = goog.dom.getNodeAtOffset;
goog.dom.DomHelper.prototype.isNodeList = goog.dom.isNodeList;
goog.dom.DomHelper.prototype.getAncestorByTagNameAndClass = goog.dom.getAncestorByTagNameAndClass;
goog.dom.DomHelper.prototype.getAncestorByClass = goog.dom.getAncestorByClass;
goog.dom.DomHelper.prototype.getAncestor = goog.dom.getAncestor;
goog.provide("goog.debug.EntryPointMonitor");
goog.provide("goog.debug.entryPointRegistry");
goog.require("goog.asserts");
goog.debug.EntryPointMonitor = function() {
};
goog.debug.EntryPointMonitor.prototype.wrap;
goog.debug.EntryPointMonitor.prototype.unwrap;
goog.debug.entryPointRegistry.refList_ = [];
goog.debug.entryPointRegistry.monitors_ = [];
goog.debug.entryPointRegistry.monitorsMayExist_ = false;
goog.debug.entryPointRegistry.register = function(callback) {
  goog.debug.entryPointRegistry.refList_[goog.debug.entryPointRegistry.refList_.length] = callback;
  if(goog.debug.entryPointRegistry.monitorsMayExist_) {
    var monitors = goog.debug.entryPointRegistry.monitors_;
    for(var i = 0;i < monitors.length;i++) {
      callback(goog.bind(monitors[i].wrap, monitors[i]))
    }
  }
};
goog.debug.entryPointRegistry.monitorAll = function(monitor) {
  goog.debug.entryPointRegistry.monitorsMayExist_ = true;
  var transformer = goog.bind(monitor.wrap, monitor);
  for(var i = 0;i < goog.debug.entryPointRegistry.refList_.length;i++) {
    goog.debug.entryPointRegistry.refList_[i](transformer)
  }
  goog.debug.entryPointRegistry.monitors_.push(monitor)
};
goog.debug.entryPointRegistry.unmonitorAllIfPossible = function(monitor) {
  var monitors = goog.debug.entryPointRegistry.monitors_;
  goog.asserts.assert(monitor == monitors[monitors.length - 1], "Only the most recent monitor can be unwrapped.");
  var transformer = goog.bind(monitor.unwrap, monitor);
  for(var i = 0;i < goog.debug.entryPointRegistry.refList_.length;i++) {
    goog.debug.entryPointRegistry.refList_[i](transformer)
  }
  monitors.length--
};
goog.provide("goog.debug.errorHandlerWeakDep");
goog.debug.errorHandlerWeakDep = {protectEntryPoint:function(fn, opt_tracers) {
  return fn
}};
goog.provide("goog.events.BrowserFeature");
goog.require("goog.userAgent");
goog.events.BrowserFeature = {HAS_W3C_BUTTON:!goog.userAgent.IE || goog.userAgent.isDocumentMode(9), HAS_W3C_EVENT_SUPPORT:!goog.userAgent.IE || goog.userAgent.isDocumentMode(9), SET_KEY_CODE_TO_PREVENT_DEFAULT:goog.userAgent.IE && !goog.userAgent.isVersion("9"), HAS_NAVIGATOR_ONLINE_PROPERTY:!goog.userAgent.WEBKIT || goog.userAgent.isVersion("528"), HAS_HTML5_NETWORK_EVENT_SUPPORT:goog.userAgent.GECKO && goog.userAgent.isVersion("1.9b") || goog.userAgent.IE && goog.userAgent.isVersion("8") || goog.userAgent.OPERA && 
goog.userAgent.isVersion("9.5") || goog.userAgent.WEBKIT && goog.userAgent.isVersion("528"), HTML5_NETWORK_EVENTS_FIRE_ON_BODY:goog.userAgent.GECKO && !goog.userAgent.isVersion("8") || goog.userAgent.IE && !goog.userAgent.isVersion("9")};
goog.provide("goog.disposable.IDisposable");
goog.disposable.IDisposable = function() {
};
goog.disposable.IDisposable.prototype.dispose;
goog.disposable.IDisposable.prototype.isDisposed;
goog.provide("goog.Disposable");
goog.provide("goog.dispose");
goog.require("goog.disposable.IDisposable");
goog.Disposable = function() {
  if(goog.Disposable.MONITORING_MODE != goog.Disposable.MonitoringMode.OFF) {
    this.creationStack = (new Error).stack;
    goog.Disposable.instances_[goog.getUid(this)] = this
  }
};
goog.Disposable.MonitoringMode = {OFF:0, PERMANENT:1, INTERACTIVE:2};
goog.Disposable.MONITORING_MODE = 0;
goog.Disposable.instances_ = {};
goog.Disposable.getUndisposedObjects = function() {
  var ret = [];
  for(var id in goog.Disposable.instances_) {
    if(goog.Disposable.instances_.hasOwnProperty(id)) {
      ret.push(goog.Disposable.instances_[Number(id)])
    }
  }
  return ret
};
goog.Disposable.clearUndisposedObjects = function() {
  goog.Disposable.instances_ = {}
};
goog.Disposable.prototype.disposed_ = false;
goog.Disposable.prototype.dependentDisposables_;
goog.Disposable.prototype.onDisposeCallbacks_;
goog.Disposable.prototype.creationStack;
goog.Disposable.prototype.isDisposed = function() {
  return this.disposed_
};
goog.Disposable.prototype.getDisposed = goog.Disposable.prototype.isDisposed;
goog.Disposable.prototype.dispose = function() {
  if(!this.disposed_) {
    this.disposed_ = true;
    this.disposeInternal();
    if(goog.Disposable.MONITORING_MODE != goog.Disposable.MonitoringMode.OFF) {
      var uid = goog.getUid(this);
      if(goog.Disposable.MONITORING_MODE == goog.Disposable.MonitoringMode.PERMANENT && !goog.Disposable.instances_.hasOwnProperty(uid)) {
        throw Error(this + " did not call the goog.Disposable base " + "constructor or was disposed of after a clearUndisposedObjects " + "call");
      }
      delete goog.Disposable.instances_[uid]
    }
  }
};
goog.Disposable.prototype.registerDisposable = function(disposable) {
  if(!this.dependentDisposables_) {
    this.dependentDisposables_ = []
  }
  this.dependentDisposables_.push(disposable)
};
goog.Disposable.prototype.addOnDisposeCallback = function(callback, opt_scope) {
  if(!this.onDisposeCallbacks_) {
    this.onDisposeCallbacks_ = []
  }
  this.onDisposeCallbacks_.push(goog.bind(callback, opt_scope))
};
goog.Disposable.prototype.disposeInternal = function() {
  if(this.dependentDisposables_) {
    goog.disposeAll.apply(null, this.dependentDisposables_)
  }
  if(this.onDisposeCallbacks_) {
    while(this.onDisposeCallbacks_.length) {
      this.onDisposeCallbacks_.shift()()
    }
  }
};
goog.Disposable.isDisposed = function(obj) {
  if(obj && typeof obj.isDisposed == "function") {
    return obj.isDisposed()
  }
  return false
};
goog.dispose = function(obj) {
  if(obj && typeof obj.dispose == "function") {
    obj.dispose()
  }
};
goog.disposeAll = function(var_args) {
  for(var i = 0, len = arguments.length;i < len;++i) {
    var disposable = arguments[i];
    if(goog.isArrayLike(disposable)) {
      goog.disposeAll.apply(null, disposable)
    }else {
      goog.dispose(disposable)
    }
  }
};
goog.provide("goog.events.Event");
goog.require("goog.Disposable");
goog.events.Event = function(type, opt_target) {
  this.type = type;
  this.target = opt_target;
  this.currentTarget = this.target
};
goog.events.Event.prototype.disposeInternal = function() {
};
goog.events.Event.prototype.dispose = function() {
};
goog.events.Event.prototype.propagationStopped_ = false;
goog.events.Event.prototype.defaultPrevented = false;
goog.events.Event.prototype.returnValue_ = true;
goog.events.Event.prototype.stopPropagation = function() {
  this.propagationStopped_ = true
};
goog.events.Event.prototype.preventDefault = function() {
  this.defaultPrevented = true;
  this.returnValue_ = false
};
goog.events.Event.stopPropagation = function(e) {
  e.stopPropagation()
};
goog.events.Event.preventDefault = function(e) {
  e.preventDefault()
};
goog.provide("goog.events.EventType");
goog.require("goog.userAgent");
goog.events.EventType = {CLICK:"click", DBLCLICK:"dblclick", MOUSEDOWN:"mousedown", MOUSEUP:"mouseup", MOUSEOVER:"mouseover", MOUSEOUT:"mouseout", MOUSEMOVE:"mousemove", SELECTSTART:"selectstart", KEYPRESS:"keypress", KEYDOWN:"keydown", KEYUP:"keyup", BLUR:"blur", FOCUS:"focus", DEACTIVATE:"deactivate", FOCUSIN:goog.userAgent.IE ? "focusin" : "DOMFocusIn", FOCUSOUT:goog.userAgent.IE ? "focusout" : "DOMFocusOut", CHANGE:"change", SELECT:"select", SUBMIT:"submit", INPUT:"input", PROPERTYCHANGE:"propertychange", 
DRAGSTART:"dragstart", DRAGENTER:"dragenter", DRAGOVER:"dragover", DRAGLEAVE:"dragleave", DROP:"drop", TOUCHSTART:"touchstart", TOUCHMOVE:"touchmove", TOUCHEND:"touchend", TOUCHCANCEL:"touchcancel", CONTEXTMENU:"contextmenu", ERROR:"error", HELP:"help", LOAD:"load", LOSECAPTURE:"losecapture", READYSTATECHANGE:"readystatechange", RESIZE:"resize", SCROLL:"scroll", UNLOAD:"unload", HASHCHANGE:"hashchange", PAGEHIDE:"pagehide", PAGESHOW:"pageshow", POPSTATE:"popstate", COPY:"copy", PASTE:"paste", CUT:"cut", 
BEFORECOPY:"beforecopy", BEFORECUT:"beforecut", BEFOREPASTE:"beforepaste", ONLINE:"online", OFFLINE:"offline", MESSAGE:"message", CONNECT:"connect", TRANSITIONEND:goog.userAgent.WEBKIT ? "webkitTransitionEnd" : goog.userAgent.OPERA ? "oTransitionEnd" : "transitionend"};
goog.provide("goog.reflect");
goog.reflect.object = function(type, object) {
  return object
};
goog.reflect.sinkValue = function(x) {
  goog.reflect.sinkValue[" "](x);
  return x
};
goog.reflect.sinkValue[" "] = goog.nullFunction;
goog.reflect.canAccessProperty = function(obj, prop) {
  try {
    goog.reflect.sinkValue(obj[prop]);
    return true
  }catch(e) {
  }
  return false
};
goog.provide("goog.events.BrowserEvent");
goog.provide("goog.events.BrowserEvent.MouseButton");
goog.require("goog.events.BrowserFeature");
goog.require("goog.events.Event");
goog.require("goog.events.EventType");
goog.require("goog.reflect");
goog.require("goog.userAgent");
goog.events.BrowserEvent = function(opt_e, opt_currentTarget) {
  if(opt_e) {
    this.init(opt_e, opt_currentTarget)
  }
};
goog.inherits(goog.events.BrowserEvent, goog.events.Event);
goog.events.BrowserEvent.MouseButton = {LEFT:0, MIDDLE:1, RIGHT:2};
goog.events.BrowserEvent.IEButtonMap = [1, 4, 2];
goog.events.BrowserEvent.prototype.target = null;
goog.events.BrowserEvent.prototype.currentTarget;
goog.events.BrowserEvent.prototype.relatedTarget = null;
goog.events.BrowserEvent.prototype.offsetX = 0;
goog.events.BrowserEvent.prototype.offsetY = 0;
goog.events.BrowserEvent.prototype.clientX = 0;
goog.events.BrowserEvent.prototype.clientY = 0;
goog.events.BrowserEvent.prototype.screenX = 0;
goog.events.BrowserEvent.prototype.screenY = 0;
goog.events.BrowserEvent.prototype.button = 0;
goog.events.BrowserEvent.prototype.keyCode = 0;
goog.events.BrowserEvent.prototype.charCode = 0;
goog.events.BrowserEvent.prototype.ctrlKey = false;
goog.events.BrowserEvent.prototype.altKey = false;
goog.events.BrowserEvent.prototype.shiftKey = false;
goog.events.BrowserEvent.prototype.metaKey = false;
goog.events.BrowserEvent.prototype.state;
goog.events.BrowserEvent.prototype.platformModifierKey = false;
goog.events.BrowserEvent.prototype.event_ = null;
goog.events.BrowserEvent.prototype.init = function(e, opt_currentTarget) {
  var type = this.type = e.type;
  goog.events.Event.call(this, type);
  this.target = e.target || e.srcElement;
  this.currentTarget = opt_currentTarget;
  var relatedTarget = e.relatedTarget;
  if(relatedTarget) {
    if(goog.userAgent.GECKO) {
      if(!goog.reflect.canAccessProperty(relatedTarget, "nodeName")) {
        relatedTarget = null
      }
    }
  }else {
    if(type == goog.events.EventType.MOUSEOVER) {
      relatedTarget = e.fromElement
    }else {
      if(type == goog.events.EventType.MOUSEOUT) {
        relatedTarget = e.toElement
      }
    }
  }
  this.relatedTarget = relatedTarget;
  this.offsetX = goog.userAgent.WEBKIT || e.offsetX !== undefined ? e.offsetX : e.layerX;
  this.offsetY = goog.userAgent.WEBKIT || e.offsetY !== undefined ? e.offsetY : e.layerY;
  this.clientX = e.clientX !== undefined ? e.clientX : e.pageX;
  this.clientY = e.clientY !== undefined ? e.clientY : e.pageY;
  this.screenX = e.screenX || 0;
  this.screenY = e.screenY || 0;
  this.button = e.button;
  this.keyCode = e.keyCode || 0;
  this.charCode = e.charCode || (type == "keypress" ? e.keyCode : 0);
  this.ctrlKey = e.ctrlKey;
  this.altKey = e.altKey;
  this.shiftKey = e.shiftKey;
  this.metaKey = e.metaKey;
  this.platformModifierKey = goog.userAgent.MAC ? e.metaKey : e.ctrlKey;
  this.state = e.state;
  this.event_ = e;
  if(e.defaultPrevented) {
    this.preventDefault()
  }
  delete this.propagationStopped_
};
goog.events.BrowserEvent.prototype.isButton = function(button) {
  if(!goog.events.BrowserFeature.HAS_W3C_BUTTON) {
    if(this.type == "click") {
      return button == goog.events.BrowserEvent.MouseButton.LEFT
    }else {
      return!!(this.event_.button & goog.events.BrowserEvent.IEButtonMap[button])
    }
  }else {
    return this.event_.button == button
  }
};
goog.events.BrowserEvent.prototype.isMouseActionButton = function() {
  return this.isButton(goog.events.BrowserEvent.MouseButton.LEFT) && !(goog.userAgent.WEBKIT && goog.userAgent.MAC && this.ctrlKey)
};
goog.events.BrowserEvent.prototype.stopPropagation = function() {
  goog.events.BrowserEvent.superClass_.stopPropagation.call(this);
  if(this.event_.stopPropagation) {
    this.event_.stopPropagation()
  }else {
    this.event_.cancelBubble = true
  }
};
goog.events.BrowserEvent.prototype.preventDefault = function() {
  goog.events.BrowserEvent.superClass_.preventDefault.call(this);
  var be = this.event_;
  if(!be.preventDefault) {
    be.returnValue = false;
    if(goog.events.BrowserFeature.SET_KEY_CODE_TO_PREVENT_DEFAULT) {
      try {
        var VK_F1 = 112;
        var VK_F12 = 123;
        if(be.ctrlKey || be.keyCode >= VK_F1 && be.keyCode <= VK_F12) {
          be.keyCode = -1
        }
      }catch(ex) {
      }
    }
  }else {
    be.preventDefault()
  }
};
goog.events.BrowserEvent.prototype.getBrowserEvent = function() {
  return this.event_
};
goog.events.BrowserEvent.prototype.disposeInternal = function() {
};
goog.provide("goog.events.EventWrapper");
goog.events.EventWrapper = function() {
};
goog.events.EventWrapper.prototype.listen = function(src, listener, opt_capt, opt_scope, opt_eventHandler) {
};
goog.events.EventWrapper.prototype.unlisten = function(src, listener, opt_capt, opt_scope, opt_eventHandler) {
};
goog.provide("goog.events.Listener");
goog.events.Listener = function() {
  if(goog.events.Listener.ENABLE_MONITORING) {
    this.creationStack = (new Error).stack
  }
};
goog.events.Listener.counter_ = 0;
goog.events.Listener.ENABLE_MONITORING = false;
goog.events.Listener.prototype.isFunctionListener_;
goog.events.Listener.prototype.listener;
goog.events.Listener.prototype.proxy;
goog.events.Listener.prototype.src;
goog.events.Listener.prototype.type;
goog.events.Listener.prototype.capture;
goog.events.Listener.prototype.handler;
goog.events.Listener.prototype.key = 0;
goog.events.Listener.prototype.removed = false;
goog.events.Listener.prototype.callOnce = false;
goog.events.Listener.prototype.creationStack;
goog.events.Listener.prototype.init = function(listener, proxy, src, type, capture, opt_handler) {
  if(goog.isFunction(listener)) {
    this.isFunctionListener_ = true
  }else {
    if(listener && listener.handleEvent && goog.isFunction(listener.handleEvent)) {
      this.isFunctionListener_ = false
    }else {
      throw Error("Invalid listener argument");
    }
  }
  this.listener = listener;
  this.proxy = proxy;
  this.src = src;
  this.type = type;
  this.capture = !!capture;
  this.handler = opt_handler;
  this.callOnce = false;
  this.key = ++goog.events.Listener.counter_;
  this.removed = false
};
goog.events.Listener.prototype.handleEvent = function(eventObject) {
  if(this.isFunctionListener_) {
    return this.listener.call(this.handler || this.src, eventObject)
  }
  return this.listener.handleEvent.call(this.listener, eventObject)
};
goog.provide("goog.events");
goog.require("goog.array");
goog.require("goog.debug.entryPointRegistry");
goog.require("goog.debug.errorHandlerWeakDep");
goog.require("goog.events.BrowserEvent");
goog.require("goog.events.BrowserFeature");
goog.require("goog.events.Event");
goog.require("goog.events.EventWrapper");
goog.require("goog.events.Listener");
goog.require("goog.object");
goog.require("goog.userAgent");
goog.events.listeners_ = {};
goog.events.listenerTree_ = {};
goog.events.sources_ = {};
goog.events.onString_ = "on";
goog.events.onStringMap_ = {};
goog.events.keySeparator_ = "_";
goog.events.listen = function(src, type, listener, opt_capt, opt_handler) {
  if(!type) {
    throw Error("Invalid event type");
  }else {
    if(goog.isArray(type)) {
      for(var i = 0;i < type.length;i++) {
        goog.events.listen(src, type[i], listener, opt_capt, opt_handler)
      }
      return null
    }else {
      var capture = !!opt_capt;
      var map = goog.events.listenerTree_;
      if(!(type in map)) {
        map[type] = {count_:0, remaining_:0}
      }
      map = map[type];
      if(!(capture in map)) {
        map[capture] = {count_:0, remaining_:0};
        map.count_++
      }
      map = map[capture];
      var srcUid = goog.getUid(src);
      var listenerArray, listenerObj;
      map.remaining_++;
      if(!map[srcUid]) {
        listenerArray = map[srcUid] = [];
        map.count_++
      }else {
        listenerArray = map[srcUid];
        for(var i = 0;i < listenerArray.length;i++) {
          listenerObj = listenerArray[i];
          if(listenerObj.listener == listener && listenerObj.handler == opt_handler) {
            if(listenerObj.removed) {
              break
            }
            return listenerArray[i].key
          }
        }
      }
      var proxy = goog.events.getProxy();
      proxy.src = src;
      listenerObj = new goog.events.Listener;
      listenerObj.init(listener, proxy, src, type, capture, opt_handler);
      var key = listenerObj.key;
      proxy.key = key;
      listenerArray.push(listenerObj);
      goog.events.listeners_[key] = listenerObj;
      if(!goog.events.sources_[srcUid]) {
        goog.events.sources_[srcUid] = []
      }
      goog.events.sources_[srcUid].push(listenerObj);
      if(src.addEventListener) {
        if(src == goog.global || !src.customEvent_) {
          src.addEventListener(type, proxy, capture)
        }
      }else {
        src.attachEvent(goog.events.getOnString_(type), proxy)
      }
      return key
    }
  }
};
goog.events.getProxy = function() {
  var proxyCallbackFunction = goog.events.handleBrowserEvent_;
  var f = goog.events.BrowserFeature.HAS_W3C_EVENT_SUPPORT ? function(eventObject) {
    return proxyCallbackFunction.call(f.src, f.key, eventObject)
  } : function(eventObject) {
    var v = proxyCallbackFunction.call(f.src, f.key, eventObject);
    if(!v) {
      return v
    }
  };
  return f
};
goog.events.listenOnce = function(src, type, listener, opt_capt, opt_handler) {
  if(goog.isArray(type)) {
    for(var i = 0;i < type.length;i++) {
      goog.events.listenOnce(src, type[i], listener, opt_capt, opt_handler)
    }
    return null
  }
  var key = goog.events.listen(src, type, listener, opt_capt, opt_handler);
  var listenerObj = goog.events.listeners_[key];
  listenerObj.callOnce = true;
  return key
};
goog.events.listenWithWrapper = function(src, wrapper, listener, opt_capt, opt_handler) {
  wrapper.listen(src, listener, opt_capt, opt_handler)
};
goog.events.unlisten = function(src, type, listener, opt_capt, opt_handler) {
  if(goog.isArray(type)) {
    for(var i = 0;i < type.length;i++) {
      goog.events.unlisten(src, type[i], listener, opt_capt, opt_handler)
    }
    return null
  }
  var capture = !!opt_capt;
  var listenerArray = goog.events.getListeners_(src, type, capture);
  if(!listenerArray) {
    return false
  }
  for(var i = 0;i < listenerArray.length;i++) {
    if(listenerArray[i].listener == listener && listenerArray[i].capture == capture && listenerArray[i].handler == opt_handler) {
      return goog.events.unlistenByKey(listenerArray[i].key)
    }
  }
  return false
};
goog.events.unlistenByKey = function(key) {
  if(!goog.events.listeners_[key]) {
    return false
  }
  var listener = goog.events.listeners_[key];
  if(listener.removed) {
    return false
  }
  var src = listener.src;
  var type = listener.type;
  var proxy = listener.proxy;
  var capture = listener.capture;
  if(src.removeEventListener) {
    if(src == goog.global || !src.customEvent_) {
      src.removeEventListener(type, proxy, capture)
    }
  }else {
    if(src.detachEvent) {
      src.detachEvent(goog.events.getOnString_(type), proxy)
    }
  }
  var srcUid = goog.getUid(src);
  if(goog.events.sources_[srcUid]) {
    var sourcesArray = goog.events.sources_[srcUid];
    goog.array.remove(sourcesArray, listener);
    if(sourcesArray.length == 0) {
      delete goog.events.sources_[srcUid]
    }
  }
  listener.removed = true;
  var listenerArray = goog.events.listenerTree_[type][capture][srcUid];
  if(listenerArray) {
    listenerArray.needsCleanup_ = true;
    goog.events.cleanUp_(type, capture, srcUid, listenerArray)
  }
  delete goog.events.listeners_[key];
  return true
};
goog.events.unlistenWithWrapper = function(src, wrapper, listener, opt_capt, opt_handler) {
  wrapper.unlisten(src, listener, opt_capt, opt_handler)
};
goog.events.cleanUp_ = function(type, capture, srcUid, listenerArray) {
  if(!listenerArray.locked_) {
    if(listenerArray.needsCleanup_) {
      for(var oldIndex = 0, newIndex = 0;oldIndex < listenerArray.length;oldIndex++) {
        if(listenerArray[oldIndex].removed) {
          var proxy = listenerArray[oldIndex].proxy;
          proxy.src = null;
          continue
        }
        if(oldIndex != newIndex) {
          listenerArray[newIndex] = listenerArray[oldIndex]
        }
        newIndex++
      }
      listenerArray.length = newIndex;
      listenerArray.needsCleanup_ = false;
      if(newIndex == 0) {
        delete goog.events.listenerTree_[type][capture][srcUid];
        goog.events.listenerTree_[type][capture].count_--;
        if(goog.events.listenerTree_[type][capture].count_ == 0) {
          delete goog.events.listenerTree_[type][capture];
          goog.events.listenerTree_[type].count_--
        }
        if(goog.events.listenerTree_[type].count_ == 0) {
          delete goog.events.listenerTree_[type]
        }
      }
    }
  }
};
goog.events.removeAll = function(opt_obj, opt_type, opt_capt) {
  var count = 0;
  var noObj = opt_obj == null;
  var noType = opt_type == null;
  var noCapt = opt_capt == null;
  opt_capt = !!opt_capt;
  if(!noObj) {
    var srcUid = goog.getUid(opt_obj);
    if(goog.events.sources_[srcUid]) {
      var sourcesArray = goog.events.sources_[srcUid];
      for(var i = sourcesArray.length - 1;i >= 0;i--) {
        var listener = sourcesArray[i];
        if((noType || opt_type == listener.type) && (noCapt || opt_capt == listener.capture)) {
          goog.events.unlistenByKey(listener.key);
          count++
        }
      }
    }
  }else {
    goog.object.forEach(goog.events.sources_, function(listeners) {
      for(var i = listeners.length - 1;i >= 0;i--) {
        var listener = listeners[i];
        if((noType || opt_type == listener.type) && (noCapt || opt_capt == listener.capture)) {
          goog.events.unlistenByKey(listener.key);
          count++
        }
      }
    })
  }
  return count
};
goog.events.getListeners = function(obj, type, capture) {
  return goog.events.getListeners_(obj, type, capture) || []
};
goog.events.getListeners_ = function(obj, type, capture) {
  var map = goog.events.listenerTree_;
  if(type in map) {
    map = map[type];
    if(capture in map) {
      map = map[capture];
      var objUid = goog.getUid(obj);
      if(map[objUid]) {
        return map[objUid]
      }
    }
  }
  return null
};
goog.events.getListener = function(src, type, listener, opt_capt, opt_handler) {
  var capture = !!opt_capt;
  var listenerArray = goog.events.getListeners_(src, type, capture);
  if(listenerArray) {
    for(var i = 0;i < listenerArray.length;i++) {
      if(!listenerArray[i].removed && listenerArray[i].listener == listener && listenerArray[i].capture == capture && listenerArray[i].handler == opt_handler) {
        return listenerArray[i]
      }
    }
  }
  return null
};
goog.events.hasListener = function(obj, opt_type, opt_capture) {
  var objUid = goog.getUid(obj);
  var listeners = goog.events.sources_[objUid];
  if(listeners) {
    var hasType = goog.isDef(opt_type);
    var hasCapture = goog.isDef(opt_capture);
    if(hasType && hasCapture) {
      var map = goog.events.listenerTree_[opt_type];
      return!!map && !!map[opt_capture] && objUid in map[opt_capture]
    }else {
      if(!(hasType || hasCapture)) {
        return true
      }else {
        return goog.array.some(listeners, function(listener) {
          return hasType && listener.type == opt_type || hasCapture && listener.capture == opt_capture
        })
      }
    }
  }
  return false
};
goog.events.expose = function(e) {
  var str = [];
  for(var key in e) {
    if(e[key] && e[key].id) {
      str.push(key + " = " + e[key] + " (" + e[key].id + ")")
    }else {
      str.push(key + " = " + e[key])
    }
  }
  return str.join("\n")
};
goog.events.getOnString_ = function(type) {
  if(type in goog.events.onStringMap_) {
    return goog.events.onStringMap_[type]
  }
  return goog.events.onStringMap_[type] = goog.events.onString_ + type
};
goog.events.fireListeners = function(obj, type, capture, eventObject) {
  var map = goog.events.listenerTree_;
  if(type in map) {
    map = map[type];
    if(capture in map) {
      return goog.events.fireListeners_(map[capture], obj, type, capture, eventObject)
    }
  }
  return true
};
goog.events.fireListeners_ = function(map, obj, type, capture, eventObject) {
  var retval = 1;
  var objUid = goog.getUid(obj);
  if(map[objUid]) {
    map.remaining_--;
    var listenerArray = map[objUid];
    if(!listenerArray.locked_) {
      listenerArray.locked_ = 1
    }else {
      listenerArray.locked_++
    }
    try {
      var length = listenerArray.length;
      for(var i = 0;i < length;i++) {
        var listener = listenerArray[i];
        if(listener && !listener.removed) {
          retval &= goog.events.fireListener(listener, eventObject) !== false
        }
      }
    }finally {
      listenerArray.locked_--;
      goog.events.cleanUp_(type, capture, objUid, listenerArray)
    }
  }
  return Boolean(retval)
};
goog.events.fireListener = function(listener, eventObject) {
  if(listener.callOnce) {
    goog.events.unlistenByKey(listener.key)
  }
  return listener.handleEvent(eventObject)
};
goog.events.getTotalListenerCount = function() {
  return goog.object.getCount(goog.events.listeners_)
};
goog.events.dispatchEvent = function(src, e) {
  var type = e.type || e;
  var map = goog.events.listenerTree_;
  if(!(type in map)) {
    return true
  }
  if(goog.isString(e)) {
    e = new goog.events.Event(e, src)
  }else {
    if(!(e instanceof goog.events.Event)) {
      var oldEvent = e;
      e = new goog.events.Event(type, src);
      goog.object.extend(e, oldEvent)
    }else {
      e.target = e.target || src
    }
  }
  var rv = 1, ancestors;
  map = map[type];
  var hasCapture = true in map;
  var targetsMap;
  if(hasCapture) {
    ancestors = [];
    for(var parent = src;parent;parent = parent.getParentEventTarget()) {
      ancestors.push(parent)
    }
    targetsMap = map[true];
    targetsMap.remaining_ = targetsMap.count_;
    for(var i = ancestors.length - 1;!e.propagationStopped_ && i >= 0 && targetsMap.remaining_;i--) {
      e.currentTarget = ancestors[i];
      rv &= goog.events.fireListeners_(targetsMap, ancestors[i], e.type, true, e) && e.returnValue_ != false
    }
  }
  var hasBubble = false in map;
  if(hasBubble) {
    targetsMap = map[false];
    targetsMap.remaining_ = targetsMap.count_;
    if(hasCapture) {
      for(var i = 0;!e.propagationStopped_ && i < ancestors.length && targetsMap.remaining_;i++) {
        e.currentTarget = ancestors[i];
        rv &= goog.events.fireListeners_(targetsMap, ancestors[i], e.type, false, e) && e.returnValue_ != false
      }
    }else {
      for(var current = src;!e.propagationStopped_ && current && targetsMap.remaining_;current = current.getParentEventTarget()) {
        e.currentTarget = current;
        rv &= goog.events.fireListeners_(targetsMap, current, e.type, false, e) && e.returnValue_ != false
      }
    }
  }
  return Boolean(rv)
};
goog.events.protectBrowserEventEntryPoint = function(errorHandler) {
  goog.events.handleBrowserEvent_ = errorHandler.protectEntryPoint(goog.events.handleBrowserEvent_)
};
goog.events.handleBrowserEvent_ = function(key, opt_evt) {
  if(!goog.events.listeners_[key]) {
    return true
  }
  var listener = goog.events.listeners_[key];
  var type = listener.type;
  var map = goog.events.listenerTree_;
  if(!(type in map)) {
    return true
  }
  map = map[type];
  var retval, targetsMap;
  if(!goog.events.BrowserFeature.HAS_W3C_EVENT_SUPPORT) {
    var ieEvent = opt_evt || goog.getObjectByName("window.event");
    var hasCapture = true in map;
    var hasBubble = false in map;
    if(hasCapture) {
      if(goog.events.isMarkedIeEvent_(ieEvent)) {
        return true
      }
      goog.events.markIeEvent_(ieEvent)
    }
    var evt = new goog.events.BrowserEvent;
    evt.init(ieEvent, this);
    retval = true;
    try {
      if(hasCapture) {
        var ancestors = [];
        for(var parent = evt.currentTarget;parent;parent = parent.parentNode) {
          ancestors.push(parent)
        }
        targetsMap = map[true];
        targetsMap.remaining_ = targetsMap.count_;
        for(var i = ancestors.length - 1;!evt.propagationStopped_ && i >= 0 && targetsMap.remaining_;i--) {
          evt.currentTarget = ancestors[i];
          retval &= goog.events.fireListeners_(targetsMap, ancestors[i], type, true, evt)
        }
        if(hasBubble) {
          targetsMap = map[false];
          targetsMap.remaining_ = targetsMap.count_;
          for(var i = 0;!evt.propagationStopped_ && i < ancestors.length && targetsMap.remaining_;i++) {
            evt.currentTarget = ancestors[i];
            retval &= goog.events.fireListeners_(targetsMap, ancestors[i], type, false, evt)
          }
        }
      }else {
        retval = goog.events.fireListener(listener, evt)
      }
    }finally {
      if(ancestors) {
        ancestors.length = 0
      }
    }
    return retval
  }
  var be = new goog.events.BrowserEvent(opt_evt, this);
  retval = goog.events.fireListener(listener, be);
  return retval
};
goog.events.markIeEvent_ = function(e) {
  var useReturnValue = false;
  if(e.keyCode == 0) {
    try {
      e.keyCode = -1;
      return
    }catch(ex) {
      useReturnValue = true
    }
  }
  if(useReturnValue || e.returnValue == undefined) {
    e.returnValue = true
  }
};
goog.events.isMarkedIeEvent_ = function(e) {
  return e.keyCode < 0 || e.returnValue != undefined
};
goog.events.uniqueIdCounter_ = 0;
goog.events.getUniqueId = function(identifier) {
  return identifier + "_" + goog.events.uniqueIdCounter_++
};
goog.debug.entryPointRegistry.register(function(transformer) {
  goog.events.handleBrowserEvent_ = transformer(goog.events.handleBrowserEvent_)
});
goog.provide("goog.math.Box");
goog.require("goog.math.Coordinate");
goog.math.Box = function(top, right, bottom, left) {
  this.top = top;
  this.right = right;
  this.bottom = bottom;
  this.left = left
};
goog.math.Box.boundingBox = function(var_args) {
  var box = new goog.math.Box(arguments[0].y, arguments[0].x, arguments[0].y, arguments[0].x);
  for(var i = 1;i < arguments.length;i++) {
    var coord = arguments[i];
    box.top = Math.min(box.top, coord.y);
    box.right = Math.max(box.right, coord.x);
    box.bottom = Math.max(box.bottom, coord.y);
    box.left = Math.min(box.left, coord.x)
  }
  return box
};
goog.math.Box.prototype.clone = function() {
  return new goog.math.Box(this.top, this.right, this.bottom, this.left)
};
if(goog.DEBUG) {
  goog.math.Box.prototype.toString = function() {
    return"(" + this.top + "t, " + this.right + "r, " + this.bottom + "b, " + this.left + "l)"
  }
}
goog.math.Box.prototype.contains = function(other) {
  return goog.math.Box.contains(this, other)
};
goog.math.Box.prototype.expand = function(top, opt_right, opt_bottom, opt_left) {
  if(goog.isObject(top)) {
    this.top -= top.top;
    this.right += top.right;
    this.bottom += top.bottom;
    this.left -= top.left
  }else {
    this.top -= top;
    this.right += opt_right;
    this.bottom += opt_bottom;
    this.left -= opt_left
  }
  return this
};
goog.math.Box.prototype.expandToInclude = function(box) {
  this.left = Math.min(this.left, box.left);
  this.top = Math.min(this.top, box.top);
  this.right = Math.max(this.right, box.right);
  this.bottom = Math.max(this.bottom, box.bottom)
};
goog.math.Box.equals = function(a, b) {
  if(a == b) {
    return true
  }
  if(!a || !b) {
    return false
  }
  return a.top == b.top && a.right == b.right && a.bottom == b.bottom && a.left == b.left
};
goog.math.Box.contains = function(box, other) {
  if(!box || !other) {
    return false
  }
  if(other instanceof goog.math.Box) {
    return other.left >= box.left && other.right <= box.right && other.top >= box.top && other.bottom <= box.bottom
  }
  return other.x >= box.left && other.x <= box.right && other.y >= box.top && other.y <= box.bottom
};
goog.math.Box.relativePositionX = function(box, coord) {
  if(coord.x < box.left) {
    return coord.x - box.left
  }else {
    if(coord.x > box.right) {
      return coord.x - box.right
    }
  }
  return 0
};
goog.math.Box.relativePositionY = function(box, coord) {
  if(coord.y < box.top) {
    return coord.y - box.top
  }else {
    if(coord.y > box.bottom) {
      return coord.y - box.bottom
    }
  }
  return 0
};
goog.math.Box.distance = function(box, coord) {
  var x = goog.math.Box.relativePositionX(box, coord);
  var y = goog.math.Box.relativePositionY(box, coord);
  return Math.sqrt(x * x + y * y)
};
goog.math.Box.intersects = function(a, b) {
  return a.left <= b.right && b.left <= a.right && a.top <= b.bottom && b.top <= a.bottom
};
goog.math.Box.intersectsWithPadding = function(a, b, padding) {
  return a.left <= b.right + padding && b.left <= a.right + padding && a.top <= b.bottom + padding && b.top <= a.bottom + padding
};
goog.provide("goog.math.Rect");
goog.require("goog.math.Box");
goog.require("goog.math.Size");
goog.math.Rect = function(x, y, w, h) {
  this.left = x;
  this.top = y;
  this.width = w;
  this.height = h
};
goog.math.Rect.prototype.clone = function() {
  return new goog.math.Rect(this.left, this.top, this.width, this.height)
};
goog.math.Rect.prototype.toBox = function() {
  var right = this.left + this.width;
  var bottom = this.top + this.height;
  return new goog.math.Box(this.top, right, bottom, this.left)
};
goog.math.Rect.createFromBox = function(box) {
  return new goog.math.Rect(box.left, box.top, box.right - box.left, box.bottom - box.top)
};
if(goog.DEBUG) {
  goog.math.Rect.prototype.toString = function() {
    return"(" + this.left + ", " + this.top + " - " + this.width + "w x " + this.height + "h)"
  }
}
goog.math.Rect.equals = function(a, b) {
  if(a == b) {
    return true
  }
  if(!a || !b) {
    return false
  }
  return a.left == b.left && a.width == b.width && a.top == b.top && a.height == b.height
};
goog.math.Rect.prototype.intersection = function(rect) {
  var x0 = Math.max(this.left, rect.left);
  var x1 = Math.min(this.left + this.width, rect.left + rect.width);
  if(x0 <= x1) {
    var y0 = Math.max(this.top, rect.top);
    var y1 = Math.min(this.top + this.height, rect.top + rect.height);
    if(y0 <= y1) {
      this.left = x0;
      this.top = y0;
      this.width = x1 - x0;
      this.height = y1 - y0;
      return true
    }
  }
  return false
};
goog.math.Rect.intersection = function(a, b) {
  var x0 = Math.max(a.left, b.left);
  var x1 = Math.min(a.left + a.width, b.left + b.width);
  if(x0 <= x1) {
    var y0 = Math.max(a.top, b.top);
    var y1 = Math.min(a.top + a.height, b.top + b.height);
    if(y0 <= y1) {
      return new goog.math.Rect(x0, y0, x1 - x0, y1 - y0)
    }
  }
  return null
};
goog.math.Rect.intersects = function(a, b) {
  return a.left <= b.left + b.width && b.left <= a.left + a.width && a.top <= b.top + b.height && b.top <= a.top + a.height
};
goog.math.Rect.prototype.intersects = function(rect) {
  return goog.math.Rect.intersects(this, rect)
};
goog.math.Rect.difference = function(a, b) {
  var intersection = goog.math.Rect.intersection(a, b);
  if(!intersection || !intersection.height || !intersection.width) {
    return[a.clone()]
  }
  var result = [];
  var top = a.top;
  var height = a.height;
  var ar = a.left + a.width;
  var ab = a.top + a.height;
  var br = b.left + b.width;
  var bb = b.top + b.height;
  if(b.top > a.top) {
    result.push(new goog.math.Rect(a.left, a.top, a.width, b.top - a.top));
    top = b.top;
    height -= b.top - a.top
  }
  if(bb < ab) {
    result.push(new goog.math.Rect(a.left, bb, a.width, ab - bb));
    height = bb - top
  }
  if(b.left > a.left) {
    result.push(new goog.math.Rect(a.left, top, b.left - a.left, height))
  }
  if(br < ar) {
    result.push(new goog.math.Rect(br, top, ar - br, height))
  }
  return result
};
goog.math.Rect.prototype.difference = function(rect) {
  return goog.math.Rect.difference(this, rect)
};
goog.math.Rect.prototype.boundingRect = function(rect) {
  var right = Math.max(this.left + this.width, rect.left + rect.width);
  var bottom = Math.max(this.top + this.height, rect.top + rect.height);
  this.left = Math.min(this.left, rect.left);
  this.top = Math.min(this.top, rect.top);
  this.width = right - this.left;
  this.height = bottom - this.top
};
goog.math.Rect.boundingRect = function(a, b) {
  if(!a || !b) {
    return null
  }
  var clone = a.clone();
  clone.boundingRect(b);
  return clone
};
goog.math.Rect.prototype.contains = function(another) {
  if(another instanceof goog.math.Rect) {
    return this.left <= another.left && this.left + this.width >= another.left + another.width && this.top <= another.top && this.top + this.height >= another.top + another.height
  }else {
    return another.x >= this.left && another.x <= this.left + this.width && another.y >= this.top && another.y <= this.top + this.height
  }
};
goog.math.Rect.prototype.getSize = function() {
  return new goog.math.Size(this.width, this.height)
};
goog.provide("goog.style");
goog.require("goog.array");
goog.require("goog.dom");
goog.require("goog.math.Box");
goog.require("goog.math.Coordinate");
goog.require("goog.math.Rect");
goog.require("goog.math.Size");
goog.require("goog.object");
goog.require("goog.string");
goog.require("goog.userAgent");
goog.style.setStyle = function(element, style, opt_value) {
  if(goog.isString(style)) {
    goog.style.setStyle_(element, opt_value, style)
  }else {
    goog.object.forEach(style, goog.partial(goog.style.setStyle_, element))
  }
};
goog.style.setStyle_ = function(element, value, style) {
  element.style[goog.string.toCamelCase(style)] = value
};
goog.style.getStyle = function(element, property) {
  return element.style[goog.string.toCamelCase(property)] || ""
};
goog.style.getComputedStyle = function(element, property) {
  var doc = goog.dom.getOwnerDocument(element);
  if(doc.defaultView && doc.defaultView.getComputedStyle) {
    var styles = doc.defaultView.getComputedStyle(element, null);
    if(styles) {
      return styles[property] || styles.getPropertyValue(property) || ""
    }
  }
  return""
};
goog.style.getCascadedStyle = function(element, style) {
  return element.currentStyle ? element.currentStyle[style] : null
};
goog.style.getStyle_ = function(element, style) {
  return goog.style.getComputedStyle(element, style) || goog.style.getCascadedStyle(element, style) || element.style && element.style[style]
};
goog.style.getComputedPosition = function(element) {
  return goog.style.getStyle_(element, "position")
};
goog.style.getBackgroundColor = function(element) {
  return goog.style.getStyle_(element, "backgroundColor")
};
goog.style.getComputedOverflowX = function(element) {
  return goog.style.getStyle_(element, "overflowX")
};
goog.style.getComputedOverflowY = function(element) {
  return goog.style.getStyle_(element, "overflowY")
};
goog.style.getComputedZIndex = function(element) {
  return goog.style.getStyle_(element, "zIndex")
};
goog.style.getComputedTextAlign = function(element) {
  return goog.style.getStyle_(element, "textAlign")
};
goog.style.getComputedCursor = function(element) {
  return goog.style.getStyle_(element, "cursor")
};
goog.style.setPosition = function(el, arg1, opt_arg2) {
  var x, y;
  var buggyGeckoSubPixelPos = goog.userAgent.GECKO && (goog.userAgent.MAC || goog.userAgent.X11) && goog.userAgent.isVersion("1.9");
  if(arg1 instanceof goog.math.Coordinate) {
    x = arg1.x;
    y = arg1.y
  }else {
    x = arg1;
    y = opt_arg2
  }
  el.style.left = goog.style.getPixelStyleValue_(x, buggyGeckoSubPixelPos);
  el.style.top = goog.style.getPixelStyleValue_(y, buggyGeckoSubPixelPos)
};
goog.style.getPosition = function(element) {
  return new goog.math.Coordinate(element.offsetLeft, element.offsetTop)
};
goog.style.getClientViewportElement = function(opt_node) {
  var doc;
  if(opt_node) {
    doc = goog.dom.getOwnerDocument(opt_node)
  }else {
    doc = goog.dom.getDocument()
  }
  if(goog.userAgent.IE && !goog.userAgent.isDocumentMode(9) && !goog.dom.getDomHelper(doc).isCss1CompatMode()) {
    return doc.body
  }
  return doc.documentElement
};
goog.style.getViewportPageOffset = function(doc) {
  var body = doc.body;
  var documentElement = doc.documentElement;
  var scrollLeft = body.scrollLeft || documentElement.scrollLeft;
  var scrollTop = body.scrollTop || documentElement.scrollTop;
  return new goog.math.Coordinate(scrollLeft, scrollTop)
};
goog.style.getBoundingClientRect_ = function(el) {
  var rect = el.getBoundingClientRect();
  if(goog.userAgent.IE) {
    var doc = el.ownerDocument;
    rect.left -= doc.documentElement.clientLeft + doc.body.clientLeft;
    rect.top -= doc.documentElement.clientTop + doc.body.clientTop
  }
  return rect
};
goog.style.getOffsetParent = function(element) {
  if(goog.userAgent.IE && !goog.userAgent.isDocumentMode(8)) {
    return element.offsetParent
  }
  var doc = goog.dom.getOwnerDocument(element);
  var positionStyle = goog.style.getStyle_(element, "position");
  var skipStatic = positionStyle == "fixed" || positionStyle == "absolute";
  for(var parent = element.parentNode;parent && parent != doc;parent = parent.parentNode) {
    positionStyle = goog.style.getStyle_(parent, "position");
    skipStatic = skipStatic && positionStyle == "static" && parent != doc.documentElement && parent != doc.body;
    if(!skipStatic && (parent.scrollWidth > parent.clientWidth || parent.scrollHeight > parent.clientHeight || positionStyle == "fixed" || positionStyle == "absolute" || positionStyle == "relative")) {
      return parent
    }
  }
  return null
};
goog.style.getVisibleRectForElement = function(element) {
  var visibleRect = new goog.math.Box(0, Infinity, Infinity, 0);
  var dom = goog.dom.getDomHelper(element);
  var body = dom.getDocument().body;
  var documentElement = dom.getDocument().documentElement;
  var scrollEl = dom.getDocumentScrollElement();
  for(var el = element;el = goog.style.getOffsetParent(el);) {
    if((!goog.userAgent.IE || el.clientWidth != 0) && (!goog.userAgent.WEBKIT || el.clientHeight != 0 || el != body) && el != body && el != documentElement && goog.style.getStyle_(el, "overflow") != "visible") {
      var pos = goog.style.getPageOffset(el);
      var client = goog.style.getClientLeftTop(el);
      pos.x += client.x;
      pos.y += client.y;
      visibleRect.top = Math.max(visibleRect.top, pos.y);
      visibleRect.right = Math.min(visibleRect.right, pos.x + el.clientWidth);
      visibleRect.bottom = Math.min(visibleRect.bottom, pos.y + el.clientHeight);
      visibleRect.left = Math.max(visibleRect.left, pos.x)
    }
  }
  var scrollX = scrollEl.scrollLeft, scrollY = scrollEl.scrollTop;
  visibleRect.left = Math.max(visibleRect.left, scrollX);
  visibleRect.top = Math.max(visibleRect.top, scrollY);
  var winSize = dom.getViewportSize();
  visibleRect.right = Math.min(visibleRect.right, scrollX + winSize.width);
  visibleRect.bottom = Math.min(visibleRect.bottom, scrollY + winSize.height);
  return visibleRect.top >= 0 && visibleRect.left >= 0 && visibleRect.bottom > visibleRect.top && visibleRect.right > visibleRect.left ? visibleRect : null
};
goog.style.getContainerOffsetToScrollInto = function(element, container, opt_center) {
  var elementPos = goog.style.getPageOffset(element);
  var containerPos = goog.style.getPageOffset(container);
  var containerBorder = goog.style.getBorderBox(container);
  var relX = elementPos.x - containerPos.x - containerBorder.left;
  var relY = elementPos.y - containerPos.y - containerBorder.top;
  var spaceX = container.clientWidth - element.offsetWidth;
  var spaceY = container.clientHeight - element.offsetHeight;
  var scrollLeft = container.scrollLeft;
  var scrollTop = container.scrollTop;
  if(opt_center) {
    scrollLeft += relX - spaceX / 2;
    scrollTop += relY - spaceY / 2
  }else {
    scrollLeft += Math.min(relX, Math.max(relX - spaceX, 0));
    scrollTop += Math.min(relY, Math.max(relY - spaceY, 0))
  }
  return new goog.math.Coordinate(scrollLeft, scrollTop)
};
goog.style.scrollIntoContainerView = function(element, container, opt_center) {
  var offset = goog.style.getContainerOffsetToScrollInto(element, container, opt_center);
  container.scrollLeft = offset.x;
  container.scrollTop = offset.y
};
goog.style.getClientLeftTop = function(el) {
  if(goog.userAgent.GECKO && !goog.userAgent.isVersion("1.9")) {
    var left = parseFloat(goog.style.getComputedStyle(el, "borderLeftWidth"));
    if(goog.style.isRightToLeft(el)) {
      var scrollbarWidth = el.offsetWidth - el.clientWidth - left - parseFloat(goog.style.getComputedStyle(el, "borderRightWidth"));
      left += scrollbarWidth
    }
    return new goog.math.Coordinate(left, parseFloat(goog.style.getComputedStyle(el, "borderTopWidth")))
  }
  return new goog.math.Coordinate(el.clientLeft, el.clientTop)
};
goog.style.getPageOffset = function(el) {
  var box, doc = goog.dom.getOwnerDocument(el);
  var positionStyle = goog.style.getStyle_(el, "position");
  goog.asserts.assertObject(el, "Parameter is required");
  var BUGGY_GECKO_BOX_OBJECT = goog.userAgent.GECKO && doc.getBoxObjectFor && !el.getBoundingClientRect && positionStyle == "absolute" && (box = doc.getBoxObjectFor(el)) && (box.screenX < 0 || box.screenY < 0);
  var pos = new goog.math.Coordinate(0, 0);
  var viewportElement = goog.style.getClientViewportElement(doc);
  if(el == viewportElement) {
    return pos
  }
  if(el.getBoundingClientRect) {
    box = goog.style.getBoundingClientRect_(el);
    var scrollCoord = goog.dom.getDomHelper(doc).getDocumentScroll();
    pos.x = box.left + scrollCoord.x;
    pos.y = box.top + scrollCoord.y
  }else {
    if(doc.getBoxObjectFor && !BUGGY_GECKO_BOX_OBJECT) {
      box = doc.getBoxObjectFor(el);
      var vpBox = doc.getBoxObjectFor(viewportElement);
      pos.x = box.screenX - vpBox.screenX;
      pos.y = box.screenY - vpBox.screenY
    }else {
      var parent = el;
      do {
        pos.x += parent.offsetLeft;
        pos.y += parent.offsetTop;
        if(parent != el) {
          pos.x += parent.clientLeft || 0;
          pos.y += parent.clientTop || 0
        }
        if(goog.userAgent.WEBKIT && goog.style.getComputedPosition(parent) == "fixed") {
          pos.x += doc.body.scrollLeft;
          pos.y += doc.body.scrollTop;
          break
        }
        parent = parent.offsetParent
      }while(parent && parent != el);
      if(goog.userAgent.OPERA || goog.userAgent.WEBKIT && positionStyle == "absolute") {
        pos.y -= doc.body.offsetTop
      }
      for(parent = el;(parent = goog.style.getOffsetParent(parent)) && parent != doc.body && parent != viewportElement;) {
        pos.x -= parent.scrollLeft;
        if(!goog.userAgent.OPERA || parent.tagName != "TR") {
          pos.y -= parent.scrollTop
        }
      }
    }
  }
  return pos
};
goog.style.getPageOffsetLeft = function(el) {
  return goog.style.getPageOffset(el).x
};
goog.style.getPageOffsetTop = function(el) {
  return goog.style.getPageOffset(el).y
};
goog.style.getFramedPageOffset = function(el, relativeWin) {
  var position = new goog.math.Coordinate(0, 0);
  var currentWin = goog.dom.getWindow(goog.dom.getOwnerDocument(el));
  var currentEl = el;
  do {
    var offset = currentWin == relativeWin ? goog.style.getPageOffset(currentEl) : goog.style.getClientPosition(currentEl);
    position.x += offset.x;
    position.y += offset.y
  }while(currentWin && currentWin != relativeWin && (currentEl = currentWin.frameElement) && (currentWin = currentWin.parent));
  return position
};
goog.style.translateRectForAnotherFrame = function(rect, origBase, newBase) {
  if(origBase.getDocument() != newBase.getDocument()) {
    var body = origBase.getDocument().body;
    var pos = goog.style.getFramedPageOffset(body, newBase.getWindow());
    pos = goog.math.Coordinate.difference(pos, goog.style.getPageOffset(body));
    if(goog.userAgent.IE && !origBase.isCss1CompatMode()) {
      pos = goog.math.Coordinate.difference(pos, origBase.getDocumentScroll())
    }
    rect.left += pos.x;
    rect.top += pos.y
  }
};
goog.style.getRelativePosition = function(a, b) {
  var ap = goog.style.getClientPosition(a);
  var bp = goog.style.getClientPosition(b);
  return new goog.math.Coordinate(ap.x - bp.x, ap.y - bp.y)
};
goog.style.getClientPosition = function(el) {
  var pos = new goog.math.Coordinate;
  if(el.nodeType == goog.dom.NodeType.ELEMENT) {
    el = el;
    if(el.getBoundingClientRect) {
      var box = goog.style.getBoundingClientRect_(el);
      pos.x = box.left;
      pos.y = box.top
    }else {
      var scrollCoord = goog.dom.getDomHelper(el).getDocumentScroll();
      var pageCoord = goog.style.getPageOffset(el);
      pos.x = pageCoord.x - scrollCoord.x;
      pos.y = pageCoord.y - scrollCoord.y
    }
    if(goog.userAgent.GECKO && !goog.userAgent.isVersion(12)) {
      pos = goog.math.Coordinate.sum(pos, goog.style.getCssTranslation(el))
    }
  }else {
    var isAbstractedEvent = goog.isFunction(el.getBrowserEvent);
    var targetEvent = el;
    if(el.targetTouches) {
      targetEvent = el.targetTouches[0]
    }else {
      if(isAbstractedEvent && el.getBrowserEvent().targetTouches) {
        targetEvent = el.getBrowserEvent().targetTouches[0]
      }
    }
    pos.x = targetEvent.clientX;
    pos.y = targetEvent.clientY
  }
  return pos
};
goog.style.setPageOffset = function(el, x, opt_y) {
  var cur = goog.style.getPageOffset(el);
  if(x instanceof goog.math.Coordinate) {
    opt_y = x.y;
    x = x.x
  }
  var dx = x - cur.x;
  var dy = opt_y - cur.y;
  goog.style.setPosition(el, el.offsetLeft + dx, el.offsetTop + dy)
};
goog.style.setSize = function(element, w, opt_h) {
  var h;
  if(w instanceof goog.math.Size) {
    h = w.height;
    w = w.width
  }else {
    if(opt_h == undefined) {
      throw Error("missing height argument");
    }
    h = opt_h
  }
  goog.style.setWidth(element, w);
  goog.style.setHeight(element, h)
};
goog.style.getPixelStyleValue_ = function(value, round) {
  if(typeof value == "number") {
    value = (round ? Math.round(value) : value) + "px"
  }
  return value
};
goog.style.setHeight = function(element, height) {
  element.style.height = goog.style.getPixelStyleValue_(height, true)
};
goog.style.setWidth = function(element, width) {
  element.style.width = goog.style.getPixelStyleValue_(width, true)
};
goog.style.getSize = function(element) {
  if(goog.style.getStyle_(element, "display") != "none") {
    return goog.style.getSizeWithDisplay_(element)
  }
  var style = element.style;
  var originalDisplay = style.display;
  var originalVisibility = style.visibility;
  var originalPosition = style.position;
  style.visibility = "hidden";
  style.position = "absolute";
  style.display = "inline";
  var size = goog.style.getSizeWithDisplay_(element);
  style.display = originalDisplay;
  style.position = originalPosition;
  style.visibility = originalVisibility;
  return size
};
goog.style.getSizeWithDisplay_ = function(element) {
  var offsetWidth = element.offsetWidth;
  var offsetHeight = element.offsetHeight;
  var webkitOffsetsZero = goog.userAgent.WEBKIT && !offsetWidth && !offsetHeight;
  if((!goog.isDef(offsetWidth) || webkitOffsetsZero) && element.getBoundingClientRect) {
    var clientRect = goog.style.getBoundingClientRect_(element);
    return new goog.math.Size(clientRect.right - clientRect.left, clientRect.bottom - clientRect.top)
  }
  return new goog.math.Size(offsetWidth, offsetHeight)
};
goog.style.getBounds = function(element) {
  var o = goog.style.getPageOffset(element);
  var s = goog.style.getSize(element);
  return new goog.math.Rect(o.x, o.y, s.width, s.height)
};
goog.style.toCamelCase = function(selector) {
  return goog.string.toCamelCase(String(selector))
};
goog.style.toSelectorCase = function(selector) {
  return goog.string.toSelectorCase(selector)
};
goog.style.getOpacity = function(el) {
  var style = el.style;
  var result = "";
  if("opacity" in style) {
    result = style.opacity
  }else {
    if("MozOpacity" in style) {
      result = style.MozOpacity
    }else {
      if("filter" in style) {
        var match = style.filter.match(/alpha\(opacity=([\d.]+)\)/);
        if(match) {
          result = String(match[1] / 100)
        }
      }
    }
  }
  return result == "" ? result : Number(result)
};
goog.style.setOpacity = function(el, alpha) {
  var style = el.style;
  if("opacity" in style) {
    style.opacity = alpha
  }else {
    if("MozOpacity" in style) {
      style.MozOpacity = alpha
    }else {
      if("filter" in style) {
        if(alpha === "") {
          style.filter = ""
        }else {
          style.filter = "alpha(opacity=" + alpha * 100 + ")"
        }
      }
    }
  }
};
goog.style.setTransparentBackgroundImage = function(el, src) {
  var style = el.style;
  if(goog.userAgent.IE && !goog.userAgent.isVersion("8")) {
    style.filter = "progid:DXImageTransform.Microsoft.AlphaImageLoader(" + 'src="' + src + '", sizingMethod="crop")'
  }else {
    style.backgroundImage = "url(" + src + ")";
    style.backgroundPosition = "top left";
    style.backgroundRepeat = "no-repeat"
  }
};
goog.style.clearTransparentBackgroundImage = function(el) {
  var style = el.style;
  if("filter" in style) {
    style.filter = ""
  }else {
    style.backgroundImage = "none"
  }
};
goog.style.showElement = function(el, display) {
  el.style.display = display ? "" : "none"
};
goog.style.isElementShown = function(el) {
  return el.style.display != "none"
};
goog.style.installStyles = function(stylesString, opt_node) {
  var dh = goog.dom.getDomHelper(opt_node);
  var styleSheet = null;
  if(goog.userAgent.IE) {
    styleSheet = dh.getDocument().createStyleSheet();
    goog.style.setStyles(styleSheet, stylesString)
  }else {
    var head = dh.getElementsByTagNameAndClass("head")[0];
    if(!head) {
      var body = dh.getElementsByTagNameAndClass("body")[0];
      head = dh.createDom("head");
      body.parentNode.insertBefore(head, body)
    }
    styleSheet = dh.createDom("style");
    goog.style.setStyles(styleSheet, stylesString);
    dh.appendChild(head, styleSheet)
  }
  return styleSheet
};
goog.style.uninstallStyles = function(styleSheet) {
  var node = styleSheet.ownerNode || styleSheet.owningElement || styleSheet;
  goog.dom.removeNode(node)
};
goog.style.setStyles = function(element, stylesString) {
  if(goog.userAgent.IE) {
    element.cssText = stylesString
  }else {
    element.innerHTML = stylesString
  }
};
goog.style.setPreWrap = function(el) {
  var style = el.style;
  if(goog.userAgent.IE && !goog.userAgent.isVersion("8")) {
    style.whiteSpace = "pre";
    style.wordWrap = "break-word"
  }else {
    if(goog.userAgent.GECKO) {
      style.whiteSpace = "-moz-pre-wrap"
    }else {
      style.whiteSpace = "pre-wrap"
    }
  }
};
goog.style.setInlineBlock = function(el) {
  var style = el.style;
  style.position = "relative";
  if(goog.userAgent.IE && !goog.userAgent.isVersion("8")) {
    style.zoom = "1";
    style.display = "inline"
  }else {
    if(goog.userAgent.GECKO) {
      style.display = goog.userAgent.isVersion("1.9a") ? "inline-block" : "-moz-inline-box"
    }else {
      style.display = "inline-block"
    }
  }
};
goog.style.isRightToLeft = function(el) {
  return"rtl" == goog.style.getStyle_(el, "direction")
};
goog.style.unselectableStyle_ = goog.userAgent.GECKO ? "MozUserSelect" : goog.userAgent.WEBKIT ? "WebkitUserSelect" : null;
goog.style.isUnselectable = function(el) {
  if(goog.style.unselectableStyle_) {
    return el.style[goog.style.unselectableStyle_].toLowerCase() == "none"
  }else {
    if(goog.userAgent.IE || goog.userAgent.OPERA) {
      return el.getAttribute("unselectable") == "on"
    }
  }
  return false
};
goog.style.setUnselectable = function(el, unselectable, opt_noRecurse) {
  var descendants = !opt_noRecurse ? el.getElementsByTagName("*") : null;
  var name = goog.style.unselectableStyle_;
  if(name) {
    var value = unselectable ? "none" : "";
    el.style[name] = value;
    if(descendants) {
      for(var i = 0, descendant;descendant = descendants[i];i++) {
        descendant.style[name] = value
      }
    }
  }else {
    if(goog.userAgent.IE || goog.userAgent.OPERA) {
      var value = unselectable ? "on" : "";
      el.setAttribute("unselectable", value);
      if(descendants) {
        for(var i = 0, descendant;descendant = descendants[i];i++) {
          descendant.setAttribute("unselectable", value)
        }
      }
    }
  }
};
goog.style.getBorderBoxSize = function(element) {
  return new goog.math.Size(element.offsetWidth, element.offsetHeight)
};
goog.style.setBorderBoxSize = function(element, size) {
  var doc = goog.dom.getOwnerDocument(element);
  var isCss1CompatMode = goog.dom.getDomHelper(doc).isCss1CompatMode();
  if(goog.userAgent.IE && (!isCss1CompatMode || !goog.userAgent.isVersion("8"))) {
    var style = element.style;
    if(isCss1CompatMode) {
      var paddingBox = goog.style.getPaddingBox(element);
      var borderBox = goog.style.getBorderBox(element);
      style.pixelWidth = size.width - borderBox.left - paddingBox.left - paddingBox.right - borderBox.right;
      style.pixelHeight = size.height - borderBox.top - paddingBox.top - paddingBox.bottom - borderBox.bottom
    }else {
      style.pixelWidth = size.width;
      style.pixelHeight = size.height
    }
  }else {
    goog.style.setBoxSizingSize_(element, size, "border-box")
  }
};
goog.style.getContentBoxSize = function(element) {
  var doc = goog.dom.getOwnerDocument(element);
  var ieCurrentStyle = goog.userAgent.IE && element.currentStyle;
  if(ieCurrentStyle && goog.dom.getDomHelper(doc).isCss1CompatMode() && ieCurrentStyle.width != "auto" && ieCurrentStyle.height != "auto" && !ieCurrentStyle.boxSizing) {
    var width = goog.style.getIePixelValue_(element, ieCurrentStyle.width, "width", "pixelWidth");
    var height = goog.style.getIePixelValue_(element, ieCurrentStyle.height, "height", "pixelHeight");
    return new goog.math.Size(width, height)
  }else {
    var borderBoxSize = goog.style.getBorderBoxSize(element);
    var paddingBox = goog.style.getPaddingBox(element);
    var borderBox = goog.style.getBorderBox(element);
    return new goog.math.Size(borderBoxSize.width - borderBox.left - paddingBox.left - paddingBox.right - borderBox.right, borderBoxSize.height - borderBox.top - paddingBox.top - paddingBox.bottom - borderBox.bottom)
  }
};
goog.style.setContentBoxSize = function(element, size) {
  var doc = goog.dom.getOwnerDocument(element);
  var isCss1CompatMode = goog.dom.getDomHelper(doc).isCss1CompatMode();
  if(goog.userAgent.IE && (!isCss1CompatMode || !goog.userAgent.isVersion("8"))) {
    var style = element.style;
    if(isCss1CompatMode) {
      style.pixelWidth = size.width;
      style.pixelHeight = size.height
    }else {
      var paddingBox = goog.style.getPaddingBox(element);
      var borderBox = goog.style.getBorderBox(element);
      style.pixelWidth = size.width + borderBox.left + paddingBox.left + paddingBox.right + borderBox.right;
      style.pixelHeight = size.height + borderBox.top + paddingBox.top + paddingBox.bottom + borderBox.bottom
    }
  }else {
    goog.style.setBoxSizingSize_(element, size, "content-box")
  }
};
goog.style.setBoxSizingSize_ = function(element, size, boxSizing) {
  var style = element.style;
  if(goog.userAgent.GECKO) {
    style.MozBoxSizing = boxSizing
  }else {
    if(goog.userAgent.WEBKIT) {
      style.WebkitBoxSizing = boxSizing
    }else {
      style.boxSizing = boxSizing
    }
  }
  style.width = Math.max(size.width, 0) + "px";
  style.height = Math.max(size.height, 0) + "px"
};
goog.style.getIePixelValue_ = function(element, value, name, pixelName) {
  if(/^\d+px?$/.test(value)) {
    return parseInt(value, 10)
  }else {
    var oldStyleValue = element.style[name];
    var oldRuntimeValue = element.runtimeStyle[name];
    element.runtimeStyle[name] = element.currentStyle[name];
    element.style[name] = value;
    var pixelValue = element.style[pixelName];
    element.style[name] = oldStyleValue;
    element.runtimeStyle[name] = oldRuntimeValue;
    return pixelValue
  }
};
goog.style.getIePixelDistance_ = function(element, propName) {
  return goog.style.getIePixelValue_(element, goog.style.getCascadedStyle(element, propName), "left", "pixelLeft")
};
goog.style.getBox_ = function(element, stylePrefix) {
  if(goog.userAgent.IE) {
    var left = goog.style.getIePixelDistance_(element, stylePrefix + "Left");
    var right = goog.style.getIePixelDistance_(element, stylePrefix + "Right");
    var top = goog.style.getIePixelDistance_(element, stylePrefix + "Top");
    var bottom = goog.style.getIePixelDistance_(element, stylePrefix + "Bottom");
    return new goog.math.Box(top, right, bottom, left)
  }else {
    var left = goog.style.getComputedStyle(element, stylePrefix + "Left");
    var right = goog.style.getComputedStyle(element, stylePrefix + "Right");
    var top = goog.style.getComputedStyle(element, stylePrefix + "Top");
    var bottom = goog.style.getComputedStyle(element, stylePrefix + "Bottom");
    return new goog.math.Box(parseFloat(top), parseFloat(right), parseFloat(bottom), parseFloat(left))
  }
};
goog.style.getPaddingBox = function(element) {
  return goog.style.getBox_(element, "padding")
};
goog.style.getMarginBox = function(element) {
  return goog.style.getBox_(element, "margin")
};
goog.style.ieBorderWidthKeywords_ = {"thin":2, "medium":4, "thick":6};
goog.style.getIePixelBorder_ = function(element, prop) {
  if(goog.style.getCascadedStyle(element, prop + "Style") == "none") {
    return 0
  }
  var width = goog.style.getCascadedStyle(element, prop + "Width");
  if(width in goog.style.ieBorderWidthKeywords_) {
    return goog.style.ieBorderWidthKeywords_[width]
  }
  return goog.style.getIePixelValue_(element, width, "left", "pixelLeft")
};
goog.style.getBorderBox = function(element) {
  if(goog.userAgent.IE) {
    var left = goog.style.getIePixelBorder_(element, "borderLeft");
    var right = goog.style.getIePixelBorder_(element, "borderRight");
    var top = goog.style.getIePixelBorder_(element, "borderTop");
    var bottom = goog.style.getIePixelBorder_(element, "borderBottom");
    return new goog.math.Box(top, right, bottom, left)
  }else {
    var left = goog.style.getComputedStyle(element, "borderLeftWidth");
    var right = goog.style.getComputedStyle(element, "borderRightWidth");
    var top = goog.style.getComputedStyle(element, "borderTopWidth");
    var bottom = goog.style.getComputedStyle(element, "borderBottomWidth");
    return new goog.math.Box(parseFloat(top), parseFloat(right), parseFloat(bottom), parseFloat(left))
  }
};
goog.style.getFontFamily = function(el) {
  var doc = goog.dom.getOwnerDocument(el);
  var font = "";
  if(doc.body.createTextRange) {
    var range = doc.body.createTextRange();
    range.moveToElementText(el);
    try {
      font = range.queryCommandValue("FontName")
    }catch(e) {
      font = ""
    }
  }
  if(!font) {
    font = goog.style.getStyle_(el, "fontFamily")
  }
  var fontsArray = font.split(",");
  if(fontsArray.length > 1) {
    font = fontsArray[0]
  }
  return goog.string.stripQuotes(font, "\"'")
};
goog.style.lengthUnitRegex_ = /[^\d]+$/;
goog.style.getLengthUnits = function(value) {
  var units = value.match(goog.style.lengthUnitRegex_);
  return units && units[0] || null
};
goog.style.ABSOLUTE_CSS_LENGTH_UNITS_ = {"cm":1, "in":1, "mm":1, "pc":1, "pt":1};
goog.style.CONVERTIBLE_RELATIVE_CSS_UNITS_ = {"em":1, "ex":1};
goog.style.getFontSize = function(el) {
  var fontSize = goog.style.getStyle_(el, "fontSize");
  var sizeUnits = goog.style.getLengthUnits(fontSize);
  if(fontSize && "px" == sizeUnits) {
    return parseInt(fontSize, 10)
  }
  if(goog.userAgent.IE) {
    if(sizeUnits in goog.style.ABSOLUTE_CSS_LENGTH_UNITS_) {
      return goog.style.getIePixelValue_(el, fontSize, "left", "pixelLeft")
    }else {
      if(el.parentNode && el.parentNode.nodeType == goog.dom.NodeType.ELEMENT && sizeUnits in goog.style.CONVERTIBLE_RELATIVE_CSS_UNITS_) {
        var parentElement = el.parentNode;
        var parentSize = goog.style.getStyle_(parentElement, "fontSize");
        return goog.style.getIePixelValue_(parentElement, fontSize == parentSize ? "1em" : fontSize, "left", "pixelLeft")
      }
    }
  }
  var sizeElement = goog.dom.createDom("span", {"style":"visibility:hidden;position:absolute;" + "line-height:0;padding:0;margin:0;border:0;height:1em;"});
  goog.dom.appendChild(el, sizeElement);
  fontSize = sizeElement.offsetHeight;
  goog.dom.removeNode(sizeElement);
  return fontSize
};
goog.style.parseStyleAttribute = function(value) {
  var result = {};
  goog.array.forEach(value.split(/\s*;\s*/), function(pair) {
    var keyValue = pair.split(/\s*:\s*/);
    if(keyValue.length == 2) {
      result[goog.string.toCamelCase(keyValue[0].toLowerCase())] = keyValue[1]
    }
  });
  return result
};
goog.style.toStyleAttribute = function(obj) {
  var buffer = [];
  goog.object.forEach(obj, function(value, key) {
    buffer.push(goog.string.toSelectorCase(key), ":", value, ";")
  });
  return buffer.join("")
};
goog.style.setFloat = function(el, value) {
  el.style[goog.userAgent.IE ? "styleFloat" : "cssFloat"] = value
};
goog.style.getFloat = function(el) {
  return el.style[goog.userAgent.IE ? "styleFloat" : "cssFloat"] || ""
};
goog.style.getScrollbarWidth = function(opt_className) {
  var outerDiv = goog.dom.createElement("div");
  if(opt_className) {
    outerDiv.className = opt_className
  }
  outerDiv.style.cssText = "overflow:auto;" + "position:absolute;top:0;width:100px;height:100px";
  var innerDiv = goog.dom.createElement("div");
  goog.style.setSize(innerDiv, "200px", "200px");
  outerDiv.appendChild(innerDiv);
  goog.dom.appendChild(goog.dom.getDocument().body, outerDiv);
  var width = outerDiv.offsetWidth - outerDiv.clientWidth;
  goog.dom.removeNode(outerDiv);
  return width
};
goog.style.MATRIX_TRANSLATION_REGEX_ = new RegExp("matrix\\([0-9\\.\\-]+, [0-9\\.\\-]+, " + "[0-9\\.\\-]+, [0-9\\.\\-]+, " + "([0-9\\.\\-]+)p?x?, ([0-9\\.\\-]+)p?x?\\)");
goog.style.getCssTranslation = function(element) {
  var property;
  if(goog.userAgent.IE) {
    property = "-ms-transform"
  }else {
    if(goog.userAgent.WEBKIT) {
      property = "-webkit-transform"
    }else {
      if(goog.userAgent.OPERA) {
        property = "-o-transform"
      }else {
        if(goog.userAgent.GECKO) {
          property = "-moz-transform"
        }
      }
    }
  }
  var transform;
  if(property) {
    transform = goog.style.getStyle_(element, property)
  }
  if(!transform) {
    transform = goog.style.getStyle_(element, "transform")
  }
  if(!transform) {
    return new goog.math.Coordinate(0, 0)
  }
  var matches = transform.match(goog.style.MATRIX_TRANSLATION_REGEX_);
  if(!matches) {
    return new goog.math.Coordinate(0, 0)
  }
  return new goog.math.Coordinate(parseFloat(matches[1]), parseFloat(matches[2]))
};
goog.provide("goog.math.Vec2");
goog.require("goog.math");
goog.require("goog.math.Coordinate");
goog.math.Vec2 = function(x, y) {
  this.x = x;
  this.y = y
};
goog.inherits(goog.math.Vec2, goog.math.Coordinate);
goog.math.Vec2.randomUnit = function() {
  var angle = Math.random() * Math.PI * 2;
  return new goog.math.Vec2(Math.cos(angle), Math.sin(angle))
};
goog.math.Vec2.random = function() {
  var mag = Math.sqrt(Math.random());
  var angle = Math.random() * Math.PI * 2;
  return new goog.math.Vec2(Math.cos(angle) * mag, Math.sin(angle) * mag)
};
goog.math.Vec2.fromCoordinate = function(a) {
  return new goog.math.Vec2(a.x, a.y)
};
goog.math.Vec2.prototype.clone = function() {
  return new goog.math.Vec2(this.x, this.y)
};
goog.math.Vec2.prototype.magnitude = function() {
  return Math.sqrt(this.x * this.x + this.y * this.y)
};
goog.math.Vec2.prototype.squaredMagnitude = function() {
  return this.x * this.x + this.y * this.y
};
goog.math.Vec2.prototype.scale = function(s) {
  this.x *= s;
  this.y *= s;
  return this
};
goog.math.Vec2.prototype.invert = function() {
  this.x = -this.x;
  this.y = -this.y;
  return this
};
goog.math.Vec2.prototype.normalize = function() {
  return this.scale(1 / this.magnitude())
};
goog.math.Vec2.prototype.add = function(b) {
  this.x += b.x;
  this.y += b.y;
  return this
};
goog.math.Vec2.prototype.subtract = function(b) {
  this.x -= b.x;
  this.y -= b.y;
  return this
};
goog.math.Vec2.prototype.rotate = function(angle) {
  var cos = Math.cos(angle);
  var sin = Math.sin(angle);
  var newX = this.x * cos - this.y * sin;
  var newY = this.y * cos + this.x * sin;
  this.x = newX;
  this.y = newY;
  return this
};
goog.math.Vec2.rotateAroundPoint = function(v, axisPoint, angle) {
  var res = v.clone();
  return res.subtract(axisPoint).rotate(angle).add(axisPoint)
};
goog.math.Vec2.prototype.equals = function(b) {
  return this == b || !!b && this.x == b.x && this.y == b.y
};
goog.math.Vec2.distance = goog.math.Coordinate.distance;
goog.math.Vec2.squaredDistance = goog.math.Coordinate.squaredDistance;
goog.math.Vec2.equals = goog.math.Coordinate.equals;
goog.math.Vec2.sum = function(a, b) {
  return new goog.math.Vec2(a.x + b.x, a.y + b.y)
};
goog.math.Vec2.difference = function(a, b) {
  return new goog.math.Vec2(a.x - b.x, a.y - b.y)
};
goog.math.Vec2.dot = function(a, b) {
  return a.x * b.x + a.y * b.y
};
goog.math.Vec2.lerp = function(a, b, x) {
  return new goog.math.Vec2(goog.math.lerp(a.x, b.x, x), goog.math.lerp(a.y, b.y, x))
};
goog.provide("ol.Coordinate");
goog.provide("ol.CoordinateFormatType");
goog.require("goog.math");
goog.require("goog.math.Vec2");
ol.CoordinateFormatType;
ol.Coordinate = function(x, y) {
  goog.base(this, x, y)
};
goog.inherits(ol.Coordinate, goog.math.Vec2);
ol.Coordinate.ZERO = new ol.Coordinate(0, 0);
ol.Coordinate.createStringXY = function(opt_precision) {
  return function(coordinate) {
    return ol.Coordinate.toStringXY(coordinate, opt_precision)
  }
};
ol.Coordinate.degreesToStringHDMS_ = function(degrees, hemispheres) {
  var normalizedDegrees = goog.math.modulo(degrees + 180, 360) - 180;
  var x = Math.abs(Math.round(3600 * normalizedDegrees));
  return Math.floor(x / 3600) + "\u00b0 " + Math.floor(x / 60 % 60) + "\u2032 " + Math.floor(x % 60) + "\u2033 " + hemispheres.charAt(normalizedDegrees < 0 ? 1 : 0)
};
ol.Coordinate.toStringHDMS = function(coordinate) {
  if(goog.isDef(coordinate)) {
    return ol.Coordinate.degreesToStringHDMS_(coordinate.y, "NS") + " " + ol.Coordinate.degreesToStringHDMS_(coordinate.x, "EW")
  }else {
    return""
  }
};
ol.Coordinate.toStringXY = function(coordinate, opt_precision) {
  if(goog.isDef(coordinate)) {
    var precision = opt_precision || 0;
    return coordinate.x.toFixed(precision) + ", " + coordinate.y.toFixed(precision)
  }else {
    return""
  }
};
ol.Coordinate.fromProjectedArray = function(array, axis) {
  var firstAxis = axis.charAt(0);
  if(firstAxis === "n" || firstAxis === "s") {
    return new ol.Coordinate(array[1], array[0])
  }else {
    return new ol.Coordinate(array[0], array[1])
  }
};
goog.provide("goog.uri.utils");
goog.provide("goog.uri.utils.ComponentIndex");
goog.provide("goog.uri.utils.QueryArray");
goog.provide("goog.uri.utils.QueryValue");
goog.provide("goog.uri.utils.StandardQueryParam");
goog.require("goog.asserts");
goog.require("goog.string");
goog.require("goog.userAgent");
goog.uri.utils.CharCode_ = {AMPERSAND:38, EQUAL:61, HASH:35, QUESTION:63};
goog.uri.utils.buildFromEncodedParts = function(opt_scheme, opt_userInfo, opt_domain, opt_port, opt_path, opt_queryData, opt_fragment) {
  var out = "";
  if(opt_scheme) {
    out += opt_scheme + ":"
  }
  if(opt_domain) {
    out += "//";
    if(opt_userInfo) {
      out += opt_userInfo + "@"
    }
    out += opt_domain;
    if(opt_port) {
      out += ":" + opt_port
    }
  }
  if(opt_path) {
    out += opt_path
  }
  if(opt_queryData) {
    out += "?" + opt_queryData
  }
  if(opt_fragment) {
    out += "#" + opt_fragment
  }
  return out
};
goog.uri.utils.splitRe_ = new RegExp("^" + "(?:" + "([^:/?#.]+)" + ":)?" + "(?://" + "(?:([^/?#]*)@)?" + "([\\w\\d\\-\\u0100-\\uffff.%]*)" + "(?::([0-9]+))?" + ")?" + "([^?#]+)?" + "(?:\\?([^#]*))?" + "(?:#(.*))?" + "$");
goog.uri.utils.ComponentIndex = {SCHEME:1, USER_INFO:2, DOMAIN:3, PORT:4, PATH:5, QUERY_DATA:6, FRAGMENT:7};
goog.uri.utils.split = function(uri) {
  return uri.match(goog.uri.utils.splitRe_)
};
goog.uri.utils.decodeIfPossible_ = function(uri) {
  return uri && decodeURIComponent(uri)
};
goog.uri.utils.getComponentByIndex_ = function(componentIndex, uri) {
  return goog.uri.utils.split(uri)[componentIndex] || null
};
goog.uri.utils.getScheme = function(uri) {
  return goog.uri.utils.getComponentByIndex_(goog.uri.utils.ComponentIndex.SCHEME, uri)
};
goog.uri.utils.getEffectiveScheme = function(uri) {
  var scheme = goog.uri.utils.getScheme(uri);
  if(!scheme && self.location) {
    var protocol = self.location.protocol;
    scheme = protocol.substr(0, protocol.length - 1)
  }
  return scheme ? scheme.toLowerCase() : ""
};
goog.uri.utils.getUserInfoEncoded = function(uri) {
  return goog.uri.utils.getComponentByIndex_(goog.uri.utils.ComponentIndex.USER_INFO, uri)
};
goog.uri.utils.getUserInfo = function(uri) {
  return goog.uri.utils.decodeIfPossible_(goog.uri.utils.getUserInfoEncoded(uri))
};
goog.uri.utils.getDomainEncoded = function(uri) {
  return goog.uri.utils.getComponentByIndex_(goog.uri.utils.ComponentIndex.DOMAIN, uri)
};
goog.uri.utils.getDomain = function(uri) {
  return goog.uri.utils.decodeIfPossible_(goog.uri.utils.getDomainEncoded(uri))
};
goog.uri.utils.getPort = function(uri) {
  return Number(goog.uri.utils.getComponentByIndex_(goog.uri.utils.ComponentIndex.PORT, uri)) || null
};
goog.uri.utils.getPathEncoded = function(uri) {
  return goog.uri.utils.getComponentByIndex_(goog.uri.utils.ComponentIndex.PATH, uri)
};
goog.uri.utils.getPath = function(uri) {
  return goog.uri.utils.decodeIfPossible_(goog.uri.utils.getPathEncoded(uri))
};
goog.uri.utils.getQueryData = function(uri) {
  return goog.uri.utils.getComponentByIndex_(goog.uri.utils.ComponentIndex.QUERY_DATA, uri)
};
goog.uri.utils.getFragmentEncoded = function(uri) {
  var hashIndex = uri.indexOf("#");
  return hashIndex < 0 ? null : uri.substr(hashIndex + 1)
};
goog.uri.utils.setFragmentEncoded = function(uri, fragment) {
  return goog.uri.utils.removeFragment(uri) + (fragment ? "#" + fragment : "")
};
goog.uri.utils.getFragment = function(uri) {
  return goog.uri.utils.decodeIfPossible_(goog.uri.utils.getFragmentEncoded(uri))
};
goog.uri.utils.getHost = function(uri) {
  var pieces = goog.uri.utils.split(uri);
  return goog.uri.utils.buildFromEncodedParts(pieces[goog.uri.utils.ComponentIndex.SCHEME], pieces[goog.uri.utils.ComponentIndex.USER_INFO], pieces[goog.uri.utils.ComponentIndex.DOMAIN], pieces[goog.uri.utils.ComponentIndex.PORT])
};
goog.uri.utils.getPathAndAfter = function(uri) {
  var pieces = goog.uri.utils.split(uri);
  return goog.uri.utils.buildFromEncodedParts(null, null, null, null, pieces[goog.uri.utils.ComponentIndex.PATH], pieces[goog.uri.utils.ComponentIndex.QUERY_DATA], pieces[goog.uri.utils.ComponentIndex.FRAGMENT])
};
goog.uri.utils.removeFragment = function(uri) {
  var hashIndex = uri.indexOf("#");
  return hashIndex < 0 ? uri : uri.substr(0, hashIndex)
};
goog.uri.utils.haveSameDomain = function(uri1, uri2) {
  var pieces1 = goog.uri.utils.split(uri1);
  var pieces2 = goog.uri.utils.split(uri2);
  return pieces1[goog.uri.utils.ComponentIndex.DOMAIN] == pieces2[goog.uri.utils.ComponentIndex.DOMAIN] && pieces1[goog.uri.utils.ComponentIndex.SCHEME] == pieces2[goog.uri.utils.ComponentIndex.SCHEME] && pieces1[goog.uri.utils.ComponentIndex.PORT] == pieces2[goog.uri.utils.ComponentIndex.PORT]
};
goog.uri.utils.assertNoFragmentsOrQueries_ = function(uri) {
  if(goog.DEBUG && (uri.indexOf("#") >= 0 || uri.indexOf("?") >= 0)) {
    throw Error("goog.uri.utils: Fragment or query identifiers are not " + "supported: [" + uri + "]");
  }
};
goog.uri.utils.QueryValue;
goog.uri.utils.QueryArray;
goog.uri.utils.appendQueryData_ = function(buffer) {
  if(buffer[1]) {
    var baseUri = buffer[0];
    var hashIndex = baseUri.indexOf("#");
    if(hashIndex >= 0) {
      buffer.push(baseUri.substr(hashIndex));
      buffer[0] = baseUri = baseUri.substr(0, hashIndex)
    }
    var questionIndex = baseUri.indexOf("?");
    if(questionIndex < 0) {
      buffer[1] = "?"
    }else {
      if(questionIndex == baseUri.length - 1) {
        buffer[1] = undefined
      }
    }
  }
  return buffer.join("")
};
goog.uri.utils.appendKeyValuePairs_ = function(key, value, pairs) {
  if(goog.isArray(value)) {
    goog.asserts.assertArray(value);
    for(var j = 0;j < value.length;j++) {
      goog.uri.utils.appendKeyValuePairs_(key, String(value[j]), pairs)
    }
  }else {
    if(value != null) {
      pairs.push("&", key, value === "" ? "" : "=", goog.string.urlEncode(value))
    }
  }
};
goog.uri.utils.buildQueryDataBuffer_ = function(buffer, keysAndValues, opt_startIndex) {
  goog.asserts.assert(Math.max(keysAndValues.length - (opt_startIndex || 0), 0) % 2 == 0, "goog.uri.utils: Key/value lists must be even in length.");
  for(var i = opt_startIndex || 0;i < keysAndValues.length;i += 2) {
    goog.uri.utils.appendKeyValuePairs_(keysAndValues[i], keysAndValues[i + 1], buffer)
  }
  return buffer
};
goog.uri.utils.buildQueryData = function(keysAndValues, opt_startIndex) {
  var buffer = goog.uri.utils.buildQueryDataBuffer_([], keysAndValues, opt_startIndex);
  buffer[0] = "";
  return buffer.join("")
};
goog.uri.utils.buildQueryDataBufferFromMap_ = function(buffer, map) {
  for(var key in map) {
    goog.uri.utils.appendKeyValuePairs_(key, map[key], buffer)
  }
  return buffer
};
goog.uri.utils.buildQueryDataFromMap = function(map) {
  var buffer = goog.uri.utils.buildQueryDataBufferFromMap_([], map);
  buffer[0] = "";
  return buffer.join("")
};
goog.uri.utils.appendParams = function(uri, var_args) {
  return goog.uri.utils.appendQueryData_(arguments.length == 2 ? goog.uri.utils.buildQueryDataBuffer_([uri], arguments[1], 0) : goog.uri.utils.buildQueryDataBuffer_([uri], arguments, 1))
};
goog.uri.utils.appendParamsFromMap = function(uri, map) {
  return goog.uri.utils.appendQueryData_(goog.uri.utils.buildQueryDataBufferFromMap_([uri], map))
};
goog.uri.utils.appendParam = function(uri, key, value) {
  return goog.uri.utils.appendQueryData_([uri, "&", key, "=", goog.string.urlEncode(value)])
};
goog.uri.utils.findParam_ = function(uri, startIndex, keyEncoded, hashOrEndIndex) {
  var index = startIndex;
  var keyLength = keyEncoded.length;
  while((index = uri.indexOf(keyEncoded, index)) >= 0 && index < hashOrEndIndex) {
    var precedingChar = uri.charCodeAt(index - 1);
    if(precedingChar == goog.uri.utils.CharCode_.AMPERSAND || precedingChar == goog.uri.utils.CharCode_.QUESTION) {
      var followingChar = uri.charCodeAt(index + keyLength);
      if(!followingChar || followingChar == goog.uri.utils.CharCode_.EQUAL || followingChar == goog.uri.utils.CharCode_.AMPERSAND || followingChar == goog.uri.utils.CharCode_.HASH) {
        return index
      }
    }
    index += keyLength + 1
  }
  return-1
};
goog.uri.utils.hashOrEndRe_ = /#|$/;
goog.uri.utils.hasParam = function(uri, keyEncoded) {
  return goog.uri.utils.findParam_(uri, 0, keyEncoded, uri.search(goog.uri.utils.hashOrEndRe_)) >= 0
};
goog.uri.utils.getParamValue = function(uri, keyEncoded) {
  var hashOrEndIndex = uri.search(goog.uri.utils.hashOrEndRe_);
  var foundIndex = goog.uri.utils.findParam_(uri, 0, keyEncoded, hashOrEndIndex);
  if(foundIndex < 0) {
    return null
  }else {
    var endPosition = uri.indexOf("&", foundIndex);
    if(endPosition < 0 || endPosition > hashOrEndIndex) {
      endPosition = hashOrEndIndex
    }
    foundIndex += keyEncoded.length + 1;
    return goog.string.urlDecode(uri.substr(foundIndex, endPosition - foundIndex))
  }
};
goog.uri.utils.getParamValues = function(uri, keyEncoded) {
  var hashOrEndIndex = uri.search(goog.uri.utils.hashOrEndRe_);
  var position = 0;
  var foundIndex;
  var result = [];
  while((foundIndex = goog.uri.utils.findParam_(uri, position, keyEncoded, hashOrEndIndex)) >= 0) {
    position = uri.indexOf("&", foundIndex);
    if(position < 0 || position > hashOrEndIndex) {
      position = hashOrEndIndex
    }
    foundIndex += keyEncoded.length + 1;
    result.push(goog.string.urlDecode(uri.substr(foundIndex, position - foundIndex)))
  }
  return result
};
goog.uri.utils.trailingQueryPunctuationRe_ = /[?&]($|#)/;
goog.uri.utils.removeParam = function(uri, keyEncoded) {
  var hashOrEndIndex = uri.search(goog.uri.utils.hashOrEndRe_);
  var position = 0;
  var foundIndex;
  var buffer = [];
  while((foundIndex = goog.uri.utils.findParam_(uri, position, keyEncoded, hashOrEndIndex)) >= 0) {
    buffer.push(uri.substring(position, foundIndex));
    position = Math.min(uri.indexOf("&", foundIndex) + 1 || hashOrEndIndex, hashOrEndIndex)
  }
  buffer.push(uri.substr(position));
  return buffer.join("").replace(goog.uri.utils.trailingQueryPunctuationRe_, "$1")
};
goog.uri.utils.setParam = function(uri, keyEncoded, value) {
  return goog.uri.utils.appendParam(goog.uri.utils.removeParam(uri, keyEncoded), keyEncoded, value)
};
goog.uri.utils.appendPath = function(baseUri, path) {
  goog.uri.utils.assertNoFragmentsOrQueries_(baseUri);
  if(goog.string.endsWith(baseUri, "/")) {
    baseUri = baseUri.substr(0, baseUri.length - 1)
  }
  if(goog.string.startsWith(path, "/")) {
    path = path.substr(1)
  }
  return goog.string.buildString(baseUri, "/", path)
};
goog.uri.utils.StandardQueryParam = {RANDOM:"zx"};
goog.uri.utils.makeUnique = function(uri) {
  return goog.uri.utils.setParam(uri, goog.uri.utils.StandardQueryParam.RANDOM, goog.string.getRandomString())
};
goog.provide("goog.Uri");
goog.provide("goog.Uri.QueryData");
goog.require("goog.array");
goog.require("goog.string");
goog.require("goog.structs");
goog.require("goog.structs.Map");
goog.require("goog.uri.utils");
goog.require("goog.uri.utils.ComponentIndex");
goog.Uri = function(opt_uri, opt_ignoreCase) {
  var m;
  if(opt_uri instanceof goog.Uri) {
    this.ignoreCase_ = goog.isDef(opt_ignoreCase) ? opt_ignoreCase : opt_uri.getIgnoreCase();
    this.setScheme(opt_uri.getScheme());
    this.setUserInfo(opt_uri.getUserInfo());
    this.setDomain(opt_uri.getDomain());
    this.setPort(opt_uri.getPort());
    this.setPath(opt_uri.getPath());
    this.setQueryData(opt_uri.getQueryData().clone());
    this.setFragment(opt_uri.getFragment())
  }else {
    if(opt_uri && (m = goog.uri.utils.split(String(opt_uri)))) {
      this.ignoreCase_ = !!opt_ignoreCase;
      this.setScheme(m[goog.uri.utils.ComponentIndex.SCHEME] || "", true);
      this.setUserInfo(m[goog.uri.utils.ComponentIndex.USER_INFO] || "", true);
      this.setDomain(m[goog.uri.utils.ComponentIndex.DOMAIN] || "", true);
      this.setPort(m[goog.uri.utils.ComponentIndex.PORT]);
      this.setPath(m[goog.uri.utils.ComponentIndex.PATH] || "", true);
      this.setQueryData(m[goog.uri.utils.ComponentIndex.QUERY_DATA] || "", true);
      this.setFragment(m[goog.uri.utils.ComponentIndex.FRAGMENT] || "", true)
    }else {
      this.ignoreCase_ = !!opt_ignoreCase;
      this.queryData_ = new goog.Uri.QueryData(null, null, this.ignoreCase_)
    }
  }
};
goog.Uri.preserveParameterTypesCompatibilityFlag = false;
goog.Uri.RANDOM_PARAM = goog.uri.utils.StandardQueryParam.RANDOM;
goog.Uri.prototype.scheme_ = "";
goog.Uri.prototype.userInfo_ = "";
goog.Uri.prototype.domain_ = "";
goog.Uri.prototype.port_ = null;
goog.Uri.prototype.path_ = "";
goog.Uri.prototype.queryData_;
goog.Uri.prototype.fragment_ = "";
goog.Uri.prototype.isReadOnly_ = false;
goog.Uri.prototype.ignoreCase_ = false;
goog.Uri.prototype.toString = function() {
  var out = [];
  var scheme = this.getScheme();
  if(scheme) {
    out.push(goog.Uri.encodeSpecialChars_(scheme, goog.Uri.reDisallowedInSchemeOrUserInfo_), ":")
  }
  var domain = this.getDomain();
  if(domain) {
    out.push("//");
    var userInfo = this.getUserInfo();
    if(userInfo) {
      out.push(goog.Uri.encodeSpecialChars_(userInfo, goog.Uri.reDisallowedInSchemeOrUserInfo_), "@")
    }
    out.push(goog.string.urlEncode(domain));
    var port = this.getPort();
    if(port != null) {
      out.push(":", String(port))
    }
  }
  var path = this.getPath();
  if(path) {
    if(this.hasDomain() && path.charAt(0) != "/") {
      out.push("/")
    }
    out.push(goog.Uri.encodeSpecialChars_(path, path.charAt(0) == "/" ? goog.Uri.reDisallowedInAbsolutePath_ : goog.Uri.reDisallowedInRelativePath_))
  }
  var query = this.getEncodedQuery();
  if(query) {
    out.push("?", query)
  }
  var fragment = this.getFragment();
  if(fragment) {
    out.push("#", goog.Uri.encodeSpecialChars_(fragment, goog.Uri.reDisallowedInFragment_))
  }
  return out.join("")
};
goog.Uri.prototype.resolve = function(relativeUri) {
  var absoluteUri = this.clone();
  var overridden = relativeUri.hasScheme();
  if(overridden) {
    absoluteUri.setScheme(relativeUri.getScheme())
  }else {
    overridden = relativeUri.hasUserInfo()
  }
  if(overridden) {
    absoluteUri.setUserInfo(relativeUri.getUserInfo())
  }else {
    overridden = relativeUri.hasDomain()
  }
  if(overridden) {
    absoluteUri.setDomain(relativeUri.getDomain())
  }else {
    overridden = relativeUri.hasPort()
  }
  var path = relativeUri.getPath();
  if(overridden) {
    absoluteUri.setPort(relativeUri.getPort())
  }else {
    overridden = relativeUri.hasPath();
    if(overridden) {
      if(path.charAt(0) != "/") {
        if(this.hasDomain() && !this.hasPath()) {
          path = "/" + path
        }else {
          var lastSlashIndex = absoluteUri.getPath().lastIndexOf("/");
          if(lastSlashIndex != -1) {
            path = absoluteUri.getPath().substr(0, lastSlashIndex + 1) + path
          }
        }
      }
      path = goog.Uri.removeDotSegments(path)
    }
  }
  if(overridden) {
    absoluteUri.setPath(path)
  }else {
    overridden = relativeUri.hasQuery()
  }
  if(overridden) {
    absoluteUri.setQueryData(relativeUri.getDecodedQuery())
  }else {
    overridden = relativeUri.hasFragment()
  }
  if(overridden) {
    absoluteUri.setFragment(relativeUri.getFragment())
  }
  return absoluteUri
};
goog.Uri.prototype.clone = function() {
  return new goog.Uri(this)
};
goog.Uri.prototype.getScheme = function() {
  return this.scheme_
};
goog.Uri.prototype.setScheme = function(newScheme, opt_decode) {
  this.enforceReadOnly();
  this.scheme_ = opt_decode ? goog.Uri.decodeOrEmpty_(newScheme) : newScheme;
  if(this.scheme_) {
    this.scheme_ = this.scheme_.replace(/:$/, "")
  }
  return this
};
goog.Uri.prototype.hasScheme = function() {
  return!!this.scheme_
};
goog.Uri.prototype.getUserInfo = function() {
  return this.userInfo_
};
goog.Uri.prototype.setUserInfo = function(newUserInfo, opt_decode) {
  this.enforceReadOnly();
  this.userInfo_ = opt_decode ? goog.Uri.decodeOrEmpty_(newUserInfo) : newUserInfo;
  return this
};
goog.Uri.prototype.hasUserInfo = function() {
  return!!this.userInfo_
};
goog.Uri.prototype.getDomain = function() {
  return this.domain_
};
goog.Uri.prototype.setDomain = function(newDomain, opt_decode) {
  this.enforceReadOnly();
  this.domain_ = opt_decode ? goog.Uri.decodeOrEmpty_(newDomain) : newDomain;
  return this
};
goog.Uri.prototype.hasDomain = function() {
  return!!this.domain_
};
goog.Uri.prototype.getPort = function() {
  return this.port_
};
goog.Uri.prototype.setPort = function(newPort) {
  this.enforceReadOnly();
  if(newPort) {
    newPort = Number(newPort);
    if(isNaN(newPort) || newPort < 0) {
      throw Error("Bad port number " + newPort);
    }
    this.port_ = newPort
  }else {
    this.port_ = null
  }
  return this
};
goog.Uri.prototype.hasPort = function() {
  return this.port_ != null
};
goog.Uri.prototype.getPath = function() {
  return this.path_
};
goog.Uri.prototype.setPath = function(newPath, opt_decode) {
  this.enforceReadOnly();
  this.path_ = opt_decode ? goog.Uri.decodeOrEmpty_(newPath) : newPath;
  return this
};
goog.Uri.prototype.hasPath = function() {
  return!!this.path_
};
goog.Uri.prototype.hasQuery = function() {
  return this.queryData_.toString() !== ""
};
goog.Uri.prototype.setQueryData = function(queryData, opt_decode) {
  this.enforceReadOnly();
  if(queryData instanceof goog.Uri.QueryData) {
    this.queryData_ = queryData;
    this.queryData_.setIgnoreCase(this.ignoreCase_)
  }else {
    if(!opt_decode) {
      queryData = goog.Uri.encodeSpecialChars_(queryData, goog.Uri.reDisallowedInQuery_)
    }
    this.queryData_ = new goog.Uri.QueryData(queryData, null, this.ignoreCase_)
  }
  return this
};
goog.Uri.prototype.setQuery = function(newQuery, opt_decode) {
  return this.setQueryData(newQuery, opt_decode)
};
goog.Uri.prototype.getEncodedQuery = function() {
  return this.queryData_.toString()
};
goog.Uri.prototype.getDecodedQuery = function() {
  return this.queryData_.toDecodedString()
};
goog.Uri.prototype.getQueryData = function() {
  return this.queryData_
};
goog.Uri.prototype.getQuery = function() {
  return this.getEncodedQuery()
};
goog.Uri.prototype.setParameterValue = function(key, value) {
  this.enforceReadOnly();
  this.queryData_.set(key, value);
  return this
};
goog.Uri.prototype.setParameterValues = function(key, values) {
  this.enforceReadOnly();
  if(!goog.isArray(values)) {
    values = [String(values)]
  }
  this.queryData_.setValues(key, values);
  return this
};
goog.Uri.prototype.getParameterValues = function(name) {
  return this.queryData_.getValues(name)
};
goog.Uri.prototype.getParameterValue = function(paramName) {
  return this.queryData_.get(paramName)
};
goog.Uri.prototype.getFragment = function() {
  return this.fragment_
};
goog.Uri.prototype.setFragment = function(newFragment, opt_decode) {
  this.enforceReadOnly();
  this.fragment_ = opt_decode ? goog.Uri.decodeOrEmpty_(newFragment) : newFragment;
  return this
};
goog.Uri.prototype.hasFragment = function() {
  return!!this.fragment_
};
goog.Uri.prototype.hasSameDomainAs = function(uri2) {
  return(!this.hasDomain() && !uri2.hasDomain() || this.getDomain() == uri2.getDomain()) && (!this.hasPort() && !uri2.hasPort() || this.getPort() == uri2.getPort())
};
goog.Uri.prototype.makeUnique = function() {
  this.enforceReadOnly();
  this.setParameterValue(goog.Uri.RANDOM_PARAM, goog.string.getRandomString());
  return this
};
goog.Uri.prototype.removeParameter = function(key) {
  this.enforceReadOnly();
  this.queryData_.remove(key);
  return this
};
goog.Uri.prototype.setReadOnly = function(isReadOnly) {
  this.isReadOnly_ = isReadOnly;
  return this
};
goog.Uri.prototype.isReadOnly = function() {
  return this.isReadOnly_
};
goog.Uri.prototype.enforceReadOnly = function() {
  if(this.isReadOnly_) {
    throw Error("Tried to modify a read-only Uri");
  }
};
goog.Uri.prototype.setIgnoreCase = function(ignoreCase) {
  this.ignoreCase_ = ignoreCase;
  if(this.queryData_) {
    this.queryData_.setIgnoreCase(ignoreCase)
  }
  return this
};
goog.Uri.prototype.getIgnoreCase = function() {
  return this.ignoreCase_
};
goog.Uri.parse = function(uri, opt_ignoreCase) {
  return uri instanceof goog.Uri ? uri.clone() : new goog.Uri(uri, opt_ignoreCase)
};
goog.Uri.create = function(opt_scheme, opt_userInfo, opt_domain, opt_port, opt_path, opt_query, opt_fragment, opt_ignoreCase) {
  var uri = new goog.Uri(null, opt_ignoreCase);
  opt_scheme && uri.setScheme(opt_scheme);
  opt_userInfo && uri.setUserInfo(opt_userInfo);
  opt_domain && uri.setDomain(opt_domain);
  opt_port && uri.setPort(opt_port);
  opt_path && uri.setPath(opt_path);
  opt_query && uri.setQueryData(opt_query);
  opt_fragment && uri.setFragment(opt_fragment);
  return uri
};
goog.Uri.resolve = function(base, rel) {
  if(!(base instanceof goog.Uri)) {
    base = goog.Uri.parse(base)
  }
  if(!(rel instanceof goog.Uri)) {
    rel = goog.Uri.parse(rel)
  }
  return base.resolve(rel)
};
goog.Uri.removeDotSegments = function(path) {
  if(path == ".." || path == ".") {
    return""
  }else {
    if(!goog.string.contains(path, "./") && !goog.string.contains(path, "/.")) {
      return path
    }else {
      var leadingSlash = goog.string.startsWith(path, "/");
      var segments = path.split("/");
      var out = [];
      for(var pos = 0;pos < segments.length;) {
        var segment = segments[pos++];
        if(segment == ".") {
          if(leadingSlash && pos == segments.length) {
            out.push("")
          }
        }else {
          if(segment == "..") {
            if(out.length > 1 || out.length == 1 && out[0] != "") {
              out.pop()
            }
            if(leadingSlash && pos == segments.length) {
              out.push("")
            }
          }else {
            out.push(segment);
            leadingSlash = true
          }
        }
      }
      return out.join("/")
    }
  }
};
goog.Uri.decodeOrEmpty_ = function(val) {
  return val ? decodeURIComponent(val) : ""
};
goog.Uri.encodeSpecialChars_ = function(unescapedPart, extra) {
  if(goog.isString(unescapedPart)) {
    return encodeURI(unescapedPart).replace(extra, goog.Uri.encodeChar_)
  }
  return null
};
goog.Uri.encodeChar_ = function(ch) {
  var n = ch.charCodeAt(0);
  return"%" + (n >> 4 & 15).toString(16) + (n & 15).toString(16)
};
goog.Uri.reDisallowedInSchemeOrUserInfo_ = /[#\/\?@]/g;
goog.Uri.reDisallowedInRelativePath_ = /[\#\?:]/g;
goog.Uri.reDisallowedInAbsolutePath_ = /[\#\?]/g;
goog.Uri.reDisallowedInQuery_ = /[\#\?@]/g;
goog.Uri.reDisallowedInFragment_ = /#/g;
goog.Uri.haveSameDomain = function(uri1String, uri2String) {
  var pieces1 = goog.uri.utils.split(uri1String);
  var pieces2 = goog.uri.utils.split(uri2String);
  return pieces1[goog.uri.utils.ComponentIndex.DOMAIN] == pieces2[goog.uri.utils.ComponentIndex.DOMAIN] && pieces1[goog.uri.utils.ComponentIndex.PORT] == pieces2[goog.uri.utils.ComponentIndex.PORT]
};
goog.Uri.QueryData = function(opt_query, opt_uri, opt_ignoreCase) {
  this.encodedQuery_ = opt_query || null;
  this.ignoreCase_ = !!opt_ignoreCase
};
goog.Uri.QueryData.prototype.ensureKeyMapInitialized_ = function() {
  if(!this.keyMap_) {
    this.keyMap_ = new goog.structs.Map;
    this.count_ = 0;
    if(this.encodedQuery_) {
      var pairs = this.encodedQuery_.split("&");
      for(var i = 0;i < pairs.length;i++) {
        var indexOfEquals = pairs[i].indexOf("=");
        var name = null;
        var value = null;
        if(indexOfEquals >= 0) {
          name = pairs[i].substring(0, indexOfEquals);
          value = pairs[i].substring(indexOfEquals + 1)
        }else {
          name = pairs[i]
        }
        name = goog.string.urlDecode(name);
        name = this.getKeyName_(name);
        this.add(name, value ? goog.string.urlDecode(value) : "")
      }
    }
  }
};
goog.Uri.QueryData.createFromMap = function(map, opt_uri, opt_ignoreCase) {
  var keys = goog.structs.getKeys(map);
  if(typeof keys == "undefined") {
    throw Error("Keys are undefined");
  }
  var queryData = new goog.Uri.QueryData(null, null, opt_ignoreCase);
  var values = goog.structs.getValues(map);
  for(var i = 0;i < keys.length;i++) {
    var key = keys[i];
    var value = values[i];
    if(!goog.isArray(value)) {
      queryData.add(key, value)
    }else {
      queryData.setValues(key, value)
    }
  }
  return queryData
};
goog.Uri.QueryData.createFromKeysValues = function(keys, values, opt_uri, opt_ignoreCase) {
  if(keys.length != values.length) {
    throw Error("Mismatched lengths for keys/values");
  }
  var queryData = new goog.Uri.QueryData(null, null, opt_ignoreCase);
  for(var i = 0;i < keys.length;i++) {
    queryData.add(keys[i], values[i])
  }
  return queryData
};
goog.Uri.QueryData.prototype.keyMap_ = null;
goog.Uri.QueryData.prototype.count_ = null;
goog.Uri.QueryData.prototype.getCount = function() {
  this.ensureKeyMapInitialized_();
  return this.count_
};
goog.Uri.QueryData.prototype.add = function(key, value) {
  this.ensureKeyMapInitialized_();
  this.invalidateCache_();
  key = this.getKeyName_(key);
  var values = this.keyMap_.get(key);
  if(!values) {
    this.keyMap_.set(key, values = [])
  }
  values.push(value);
  this.count_++;
  return this
};
goog.Uri.QueryData.prototype.remove = function(key) {
  this.ensureKeyMapInitialized_();
  key = this.getKeyName_(key);
  if(this.keyMap_.containsKey(key)) {
    this.invalidateCache_();
    this.count_ -= this.keyMap_.get(key).length;
    return this.keyMap_.remove(key)
  }
  return false
};
goog.Uri.QueryData.prototype.clear = function() {
  this.invalidateCache_();
  this.keyMap_ = null;
  this.count_ = 0
};
goog.Uri.QueryData.prototype.isEmpty = function() {
  this.ensureKeyMapInitialized_();
  return this.count_ == 0
};
goog.Uri.QueryData.prototype.containsKey = function(key) {
  this.ensureKeyMapInitialized_();
  key = this.getKeyName_(key);
  return this.keyMap_.containsKey(key)
};
goog.Uri.QueryData.prototype.containsValue = function(value) {
  var vals = this.getValues();
  return goog.array.contains(vals, value)
};
goog.Uri.QueryData.prototype.getKeys = function() {
  this.ensureKeyMapInitialized_();
  var vals = this.keyMap_.getValues();
  var keys = this.keyMap_.getKeys();
  var rv = [];
  for(var i = 0;i < keys.length;i++) {
    var val = vals[i];
    for(var j = 0;j < val.length;j++) {
      rv.push(keys[i])
    }
  }
  return rv
};
goog.Uri.QueryData.prototype.getValues = function(opt_key) {
  this.ensureKeyMapInitialized_();
  var rv = [];
  if(opt_key) {
    if(this.containsKey(opt_key)) {
      rv = goog.array.concat(rv, this.keyMap_.get(this.getKeyName_(opt_key)))
    }
  }else {
    var values = this.keyMap_.getValues();
    for(var i = 0;i < values.length;i++) {
      rv = goog.array.concat(rv, values[i])
    }
  }
  return rv
};
goog.Uri.QueryData.prototype.set = function(key, value) {
  this.ensureKeyMapInitialized_();
  this.invalidateCache_();
  key = this.getKeyName_(key);
  if(this.containsKey(key)) {
    this.count_ -= this.keyMap_.get(key).length
  }
  this.keyMap_.set(key, [value]);
  this.count_++;
  return this
};
goog.Uri.QueryData.prototype.get = function(key, opt_default) {
  var values = key ? this.getValues(key) : [];
  if(goog.Uri.preserveParameterTypesCompatibilityFlag) {
    return values.length > 0 ? values[0] : opt_default
  }else {
    return values.length > 0 ? String(values[0]) : opt_default
  }
};
goog.Uri.QueryData.prototype.setValues = function(key, values) {
  this.remove(key);
  if(values.length > 0) {
    this.invalidateCache_();
    this.keyMap_.set(this.getKeyName_(key), goog.array.clone(values));
    this.count_ += values.length
  }
};
goog.Uri.QueryData.prototype.toString = function() {
  if(this.encodedQuery_) {
    return this.encodedQuery_
  }
  if(!this.keyMap_) {
    return""
  }
  var sb = [];
  var keys = this.keyMap_.getKeys();
  for(var i = 0;i < keys.length;i++) {
    var key = keys[i];
    var encodedKey = goog.string.urlEncode(key);
    var val = this.getValues(key);
    for(var j = 0;j < val.length;j++) {
      var param = encodedKey;
      if(val[j] !== "") {
        param += "=" + goog.string.urlEncode(val[j])
      }
      sb.push(param)
    }
  }
  return this.encodedQuery_ = sb.join("&")
};
goog.Uri.QueryData.prototype.toDecodedString = function() {
  return goog.Uri.decodeOrEmpty_(this.toString())
};
goog.Uri.QueryData.prototype.invalidateCache_ = function() {
  this.encodedQuery_ = null
};
goog.Uri.QueryData.prototype.filterKeys = function(keys) {
  this.ensureKeyMapInitialized_();
  goog.structs.forEach(this.keyMap_, function(value, key, map) {
    if(!goog.array.contains(keys, key)) {
      this.remove(key)
    }
  }, this);
  return this
};
goog.Uri.QueryData.prototype.clone = function() {
  var rv = new goog.Uri.QueryData;
  rv.encodedQuery_ = this.encodedQuery_;
  if(this.keyMap_) {
    rv.keyMap_ = this.keyMap_.clone()
  }
  return rv
};
goog.Uri.QueryData.prototype.getKeyName_ = function(arg) {
  var keyName = String(arg);
  if(this.ignoreCase_) {
    keyName = keyName.toLowerCase()
  }
  return keyName
};
goog.Uri.QueryData.prototype.setIgnoreCase = function(ignoreCase) {
  var resetKeys = ignoreCase && !this.ignoreCase_;
  if(resetKeys) {
    this.ensureKeyMapInitialized_();
    this.invalidateCache_();
    goog.structs.forEach(this.keyMap_, function(value, key) {
      var lowerCase = key.toLowerCase();
      if(key != lowerCase) {
        this.remove(key);
        this.setValues(lowerCase, value)
      }
    }, this)
  }
  this.ignoreCase_ = ignoreCase
};
goog.Uri.QueryData.prototype.extend = function(var_args) {
  for(var i = 0;i < arguments.length;i++) {
    var data = arguments[i];
    goog.structs.forEach(data, function(value, key) {
      this.add(key, value)
    }, this)
  }
};
goog.provide("goog.events.EventTarget");
goog.require("goog.Disposable");
goog.require("goog.events");
goog.events.EventTarget = function() {
  goog.Disposable.call(this)
};
goog.inherits(goog.events.EventTarget, goog.Disposable);
goog.events.EventTarget.prototype.customEvent_ = true;
goog.events.EventTarget.prototype.parentEventTarget_ = null;
goog.events.EventTarget.prototype.getParentEventTarget = function() {
  return this.parentEventTarget_
};
goog.events.EventTarget.prototype.setParentEventTarget = function(parent) {
  this.parentEventTarget_ = parent
};
goog.events.EventTarget.prototype.addEventListener = function(type, handler, opt_capture, opt_handlerScope) {
  goog.events.listen(this, type, handler, opt_capture, opt_handlerScope)
};
goog.events.EventTarget.prototype.removeEventListener = function(type, handler, opt_capture, opt_handlerScope) {
  goog.events.unlisten(this, type, handler, opt_capture, opt_handlerScope)
};
goog.events.EventTarget.prototype.dispatchEvent = function(e) {
  return goog.events.dispatchEvent(this, e)
};
goog.events.EventTarget.prototype.disposeInternal = function() {
  goog.events.EventTarget.superClass_.disposeInternal.call(this);
  goog.events.removeAll(this);
  this.parentEventTarget_ = null
};
goog.provide("goog.Timer");
goog.require("goog.events.EventTarget");
goog.Timer = function(opt_interval, opt_timerObject) {
  goog.events.EventTarget.call(this);
  this.interval_ = opt_interval || 1;
  this.timerObject_ = opt_timerObject || goog.Timer.defaultTimerObject;
  this.boundTick_ = goog.bind(this.tick_, this);
  this.last_ = goog.now()
};
goog.inherits(goog.Timer, goog.events.EventTarget);
goog.Timer.MAX_TIMEOUT_ = 2147483647;
goog.Timer.prototype.enabled = false;
goog.Timer.defaultTimerObject = goog.global["window"];
goog.Timer.intervalScale = 0.8;
goog.Timer.prototype.timer_ = null;
goog.Timer.prototype.getInterval = function() {
  return this.interval_
};
goog.Timer.prototype.setInterval = function(interval) {
  this.interval_ = interval;
  if(this.timer_ && this.enabled) {
    this.stop();
    this.start()
  }else {
    if(this.timer_) {
      this.stop()
    }
  }
};
goog.Timer.prototype.tick_ = function() {
  if(this.enabled) {
    var elapsed = goog.now() - this.last_;
    if(elapsed > 0 && elapsed < this.interval_ * goog.Timer.intervalScale) {
      this.timer_ = this.timerObject_.setTimeout(this.boundTick_, this.interval_ - elapsed);
      return
    }
    this.dispatchTick();
    if(this.enabled) {
      this.timer_ = this.timerObject_.setTimeout(this.boundTick_, this.interval_);
      this.last_ = goog.now()
    }
  }
};
goog.Timer.prototype.dispatchTick = function() {
  this.dispatchEvent(goog.Timer.TICK)
};
goog.Timer.prototype.start = function() {
  this.enabled = true;
  if(!this.timer_) {
    this.timer_ = this.timerObject_.setTimeout(this.boundTick_, this.interval_);
    this.last_ = goog.now()
  }
};
goog.Timer.prototype.stop = function() {
  this.enabled = false;
  if(this.timer_) {
    this.timerObject_.clearTimeout(this.timer_);
    this.timer_ = null
  }
};
goog.Timer.prototype.disposeInternal = function() {
  goog.Timer.superClass_.disposeInternal.call(this);
  this.stop();
  delete this.timerObject_
};
goog.Timer.TICK = "tick";
goog.Timer.callOnce = function(listener, opt_delay, opt_handler) {
  if(goog.isFunction(listener)) {
    if(opt_handler) {
      listener = goog.bind(listener, opt_handler)
    }
  }else {
    if(listener && typeof listener.handleEvent == "function") {
      listener = goog.bind(listener.handleEvent, listener)
    }else {
      throw Error("Invalid listener argument");
    }
  }
  if(opt_delay > goog.Timer.MAX_TIMEOUT_) {
    return-1
  }else {
    return goog.Timer.defaultTimerObject.setTimeout(listener, opt_delay || 0)
  }
};
goog.Timer.clear = function(timerId) {
  goog.Timer.defaultTimerObject.clearTimeout(timerId)
};
goog.provide("goog.Delay");
goog.provide("goog.async.Delay");
goog.require("goog.Disposable");
goog.require("goog.Timer");
goog.async.Delay = function(listener, opt_interval, opt_handler) {
  goog.Disposable.call(this);
  this.listener_ = listener;
  this.interval_ = opt_interval || 0;
  this.handler_ = opt_handler;
  this.callback_ = goog.bind(this.doAction_, this)
};
goog.inherits(goog.async.Delay, goog.Disposable);
goog.Delay = goog.async.Delay;
goog.async.Delay.prototype.id_ = 0;
goog.async.Delay.prototype.disposeInternal = function() {
  goog.async.Delay.superClass_.disposeInternal.call(this);
  this.stop();
  delete this.listener_;
  delete this.handler_
};
goog.async.Delay.prototype.start = function(opt_interval) {
  this.stop();
  this.id_ = goog.Timer.callOnce(this.callback_, goog.isDef(opt_interval) ? opt_interval : this.interval_)
};
goog.async.Delay.prototype.stop = function() {
  if(this.isActive()) {
    goog.Timer.clear(this.id_)
  }
  this.id_ = 0
};
goog.async.Delay.prototype.fire = function() {
  this.stop();
  this.doAction_()
};
goog.async.Delay.prototype.fireIfActive = function() {
  if(this.isActive()) {
    this.fire()
  }
};
goog.async.Delay.prototype.isActive = function() {
  return this.id_ != 0
};
goog.async.Delay.prototype.doAction_ = function() {
  this.id_ = 0;
  if(this.listener_) {
    this.listener_.call(this.handler_)
  }
};
goog.provide("goog.functions");
goog.functions.constant = function(retValue) {
  return function() {
    return retValue
  }
};
goog.functions.FALSE = goog.functions.constant(false);
goog.functions.TRUE = goog.functions.constant(true);
goog.functions.NULL = goog.functions.constant(null);
goog.functions.identity = function(opt_returnValue, var_args) {
  return opt_returnValue
};
goog.functions.error = function(message) {
  return function() {
    throw Error(message);
  }
};
goog.functions.lock = function(f, opt_numArgs) {
  opt_numArgs = opt_numArgs || 0;
  return function() {
    return f.apply(this, Array.prototype.slice.call(arguments, 0, opt_numArgs))
  }
};
goog.functions.withReturnValue = function(f, retValue) {
  return goog.functions.sequence(f, goog.functions.constant(retValue))
};
goog.functions.compose = function(var_args) {
  var functions = arguments;
  var length = functions.length;
  return function() {
    var result;
    if(length) {
      result = functions[length - 1].apply(this, arguments)
    }
    for(var i = length - 2;i >= 0;i--) {
      result = functions[i].call(this, result)
    }
    return result
  }
};
goog.functions.sequence = function(var_args) {
  var functions = arguments;
  var length = functions.length;
  return function() {
    var result;
    for(var i = 0;i < length;i++) {
      result = functions[i].apply(this, arguments)
    }
    return result
  }
};
goog.functions.and = function(var_args) {
  var functions = arguments;
  var length = functions.length;
  return function() {
    for(var i = 0;i < length;i++) {
      if(!functions[i].apply(this, arguments)) {
        return false
      }
    }
    return true
  }
};
goog.functions.or = function(var_args) {
  var functions = arguments;
  var length = functions.length;
  return function() {
    for(var i = 0;i < length;i++) {
      if(functions[i].apply(this, arguments)) {
        return true
      }
    }
    return false
  }
};
goog.functions.not = function(f) {
  return function() {
    return!f.apply(this, arguments)
  }
};
goog.functions.create = function(constructor, var_args) {
  var temp = function() {
  };
  temp.prototype = constructor.prototype;
  var obj = new temp;
  constructor.apply(obj, Array.prototype.slice.call(arguments, 1));
  return obj
};
goog.provide("goog.async.AnimationDelay");
goog.require("goog.async.Delay");
goog.require("goog.functions");
goog.async.AnimationDelay = function(listener, opt_window, opt_handler) {
  goog.base(this);
  this.listener_ = listener;
  this.handler_ = opt_handler;
  this.win_ = opt_window || window;
  this.callback_ = goog.bind(this.doAction_, this)
};
goog.inherits(goog.async.AnimationDelay, goog.Disposable);
goog.async.AnimationDelay.prototype.id_ = null;
goog.async.AnimationDelay.prototype.usingListeners_ = false;
goog.async.AnimationDelay.TIMEOUT = 20;
goog.async.AnimationDelay.MOZ_BEFORE_PAINT_EVENT_ = "MozBeforePaint";
goog.async.AnimationDelay.prototype.start = function() {
  this.stop();
  this.usingListeners_ = false;
  var raf = this.getRaf_();
  var cancelRaf = this.getCancelRaf_();
  if(raf && !cancelRaf && this.win_.mozRequestAnimationFrame) {
    this.id_ = goog.events.listen(this.win_, goog.async.AnimationDelay.MOZ_BEFORE_PAINT_EVENT_, this.callback_);
    this.win_.mozRequestAnimationFrame(null);
    this.usingListeners_ = true
  }else {
    if(raf && cancelRaf) {
      this.id_ = raf.call(this.win_, this.callback_)
    }else {
      this.id_ = this.win_.setTimeout(goog.functions.lock(this.callback_), goog.async.AnimationDelay.TIMEOUT)
    }
  }
};
goog.async.AnimationDelay.prototype.stop = function() {
  if(this.isActive()) {
    var raf = this.getRaf_();
    var cancelRaf = this.getCancelRaf_();
    if(raf && !cancelRaf && this.win_.mozRequestAnimationFrame) {
      goog.events.unlistenByKey(this.id_)
    }else {
      if(raf && cancelRaf) {
        cancelRaf.call(this.win_, this.id_)
      }else {
        this.win_.clearTimeout(this.id_)
      }
    }
  }
  this.id_ = null
};
goog.async.AnimationDelay.prototype.fire = function() {
  this.stop();
  this.doAction_()
};
goog.async.AnimationDelay.prototype.fireIfActive = function() {
  if(this.isActive()) {
    this.fire()
  }
};
goog.async.AnimationDelay.prototype.isActive = function() {
  return this.id_ != null
};
goog.async.AnimationDelay.prototype.doAction_ = function() {
  if(this.usingListeners_ && this.id_) {
    goog.events.unlistenByKey(this.id_)
  }
  this.id_ = null;
  this.listener_.call(this.handler_, goog.now())
};
goog.async.AnimationDelay.prototype.disposeInternal = function() {
  this.stop();
  goog.base(this, "disposeInternal")
};
goog.async.AnimationDelay.prototype.getRaf_ = function() {
  var win = this.win_;
  return win.requestAnimationFrame || win.webkitRequestAnimationFrame || win.mozRequestAnimationFrame || win.oRequestAnimationFrame || win.msRequestAnimationFrame || null
};
goog.async.AnimationDelay.prototype.getCancelRaf_ = function() {
  var win = this.win_;
  return win.cancelRequestAnimationFrame || win.webkitCancelRequestAnimationFrame || win.mozCancelRequestAnimationFrame || win.oCancelRequestAnimationFrame || win.msCancelRequestAnimationFrame || null
};
goog.provide("goog.dom.ViewportSizeMonitor");
goog.require("goog.dom");
goog.require("goog.events");
goog.require("goog.events.EventTarget");
goog.require("goog.events.EventType");
goog.require("goog.math.Size");
goog.require("goog.userAgent");
goog.dom.ViewportSizeMonitor = function(opt_window) {
  goog.events.EventTarget.call(this);
  this.window_ = opt_window || window;
  this.listenerKey_ = goog.events.listen(this.window_, goog.events.EventType.RESIZE, this.handleResize_, false, this);
  this.size_ = goog.dom.getViewportSize(this.window_);
  if(this.isPollingRequired_()) {
    this.windowSizePollInterval_ = window.setInterval(goog.bind(this.checkForSizeChange_, this), goog.dom.ViewportSizeMonitor.WINDOW_SIZE_POLL_RATE)
  }
};
goog.inherits(goog.dom.ViewportSizeMonitor, goog.events.EventTarget);
goog.dom.ViewportSizeMonitor.getInstanceForWindow = function(opt_window) {
  var currentWindow = opt_window || window;
  var uid = goog.getUid(currentWindow);
  return goog.dom.ViewportSizeMonitor.windowInstanceMap_[uid] = goog.dom.ViewportSizeMonitor.windowInstanceMap_[uid] || new goog.dom.ViewportSizeMonitor(currentWindow)
};
goog.dom.ViewportSizeMonitor.removeInstanceForWindow = function(opt_window) {
  var uid = goog.getUid(opt_window || window);
  goog.dispose(goog.dom.ViewportSizeMonitor.windowInstanceMap_[uid]);
  delete goog.dom.ViewportSizeMonitor.windowInstanceMap_[uid]
};
goog.dom.ViewportSizeMonitor.windowInstanceMap_ = {};
goog.dom.ViewportSizeMonitor.WINDOW_SIZE_POLL_RATE = 500;
goog.dom.ViewportSizeMonitor.prototype.listenerKey_ = null;
goog.dom.ViewportSizeMonitor.prototype.window_ = null;
goog.dom.ViewportSizeMonitor.prototype.size_ = null;
goog.dom.ViewportSizeMonitor.prototype.windowSizePollInterval_ = null;
goog.dom.ViewportSizeMonitor.prototype.isPollingRequired_ = function() {
  return goog.userAgent.WEBKIT && goog.userAgent.WINDOWS || goog.userAgent.OPERA && this.window_.self != this.window_.top
};
goog.dom.ViewportSizeMonitor.prototype.getSize = function() {
  return this.size_ ? this.size_.clone() : null
};
goog.dom.ViewportSizeMonitor.prototype.disposeInternal = function() {
  goog.dom.ViewportSizeMonitor.superClass_.disposeInternal.call(this);
  if(this.listenerKey_) {
    goog.events.unlistenByKey(this.listenerKey_);
    this.listenerKey_ = null
  }
  if(this.windowSizePollInterval_) {
    window.clearInterval(this.windowSizePollInterval_);
    this.windowSizePollInterval_ = null
  }
  this.window_ = null;
  this.size_ = null
};
goog.dom.ViewportSizeMonitor.prototype.handleResize_ = function(event) {
  this.checkForSizeChange_()
};
goog.dom.ViewportSizeMonitor.prototype.checkForSizeChange_ = function() {
  var size = goog.dom.getViewportSize(this.window_);
  if(!goog.math.Size.equals(size, this.size_)) {
    this.size_ = size;
    this.dispatchEvent(goog.events.EventType.RESIZE)
  }
};
goog.provide("goog.events.KeyCodes");
goog.require("goog.userAgent");
goog.events.KeyCodes = {WIN_KEY_FF_LINUX:0, MAC_ENTER:3, BACKSPACE:8, TAB:9, NUM_CENTER:12, ENTER:13, SHIFT:16, CTRL:17, ALT:18, PAUSE:19, CAPS_LOCK:20, ESC:27, SPACE:32, PAGE_UP:33, PAGE_DOWN:34, END:35, HOME:36, LEFT:37, UP:38, RIGHT:39, DOWN:40, PRINT_SCREEN:44, INSERT:45, DELETE:46, ZERO:48, ONE:49, TWO:50, THREE:51, FOUR:52, FIVE:53, SIX:54, SEVEN:55, EIGHT:56, NINE:57, FF_SEMICOLON:59, FF_EQUALS:61, QUESTION_MARK:63, A:65, B:66, C:67, D:68, E:69, F:70, G:71, H:72, I:73, J:74, K:75, L:76, M:77, 
N:78, O:79, P:80, Q:81, R:82, S:83, T:84, U:85, V:86, W:87, X:88, Y:89, Z:90, META:91, WIN_KEY_RIGHT:92, CONTEXT_MENU:93, NUM_ZERO:96, NUM_ONE:97, NUM_TWO:98, NUM_THREE:99, NUM_FOUR:100, NUM_FIVE:101, NUM_SIX:102, NUM_SEVEN:103, NUM_EIGHT:104, NUM_NINE:105, NUM_MULTIPLY:106, NUM_PLUS:107, NUM_MINUS:109, NUM_PERIOD:110, NUM_DIVISION:111, F1:112, F2:113, F3:114, F4:115, F5:116, F6:117, F7:118, F8:119, F9:120, F10:121, F11:122, F12:123, NUMLOCK:144, SCROLL_LOCK:145, FIRST_MEDIA_KEY:166, LAST_MEDIA_KEY:183, 
SEMICOLON:186, DASH:189, EQUALS:187, COMMA:188, PERIOD:190, SLASH:191, APOSTROPHE:192, TILDE:192, SINGLE_QUOTE:222, OPEN_SQUARE_BRACKET:219, BACKSLASH:220, CLOSE_SQUARE_BRACKET:221, WIN_KEY:224, MAC_FF_META:224, WIN_IME:229, PHANTOM:255};
goog.events.KeyCodes.isTextModifyingKeyEvent = function(e) {
  if(e.altKey && !e.ctrlKey || e.metaKey || e.keyCode >= goog.events.KeyCodes.F1 && e.keyCode <= goog.events.KeyCodes.F12) {
    return false
  }
  switch(e.keyCode) {
    case goog.events.KeyCodes.ALT:
    ;
    case goog.events.KeyCodes.CAPS_LOCK:
    ;
    case goog.events.KeyCodes.CONTEXT_MENU:
    ;
    case goog.events.KeyCodes.CTRL:
    ;
    case goog.events.KeyCodes.DOWN:
    ;
    case goog.events.KeyCodes.END:
    ;
    case goog.events.KeyCodes.ESC:
    ;
    case goog.events.KeyCodes.HOME:
    ;
    case goog.events.KeyCodes.INSERT:
    ;
    case goog.events.KeyCodes.LEFT:
    ;
    case goog.events.KeyCodes.MAC_FF_META:
    ;
    case goog.events.KeyCodes.META:
    ;
    case goog.events.KeyCodes.NUMLOCK:
    ;
    case goog.events.KeyCodes.NUM_CENTER:
    ;
    case goog.events.KeyCodes.PAGE_DOWN:
    ;
    case goog.events.KeyCodes.PAGE_UP:
    ;
    case goog.events.KeyCodes.PAUSE:
    ;
    case goog.events.KeyCodes.PHANTOM:
    ;
    case goog.events.KeyCodes.PRINT_SCREEN:
    ;
    case goog.events.KeyCodes.RIGHT:
    ;
    case goog.events.KeyCodes.SCROLL_LOCK:
    ;
    case goog.events.KeyCodes.SHIFT:
    ;
    case goog.events.KeyCodes.UP:
    ;
    case goog.events.KeyCodes.WIN_KEY:
    ;
    case goog.events.KeyCodes.WIN_KEY_RIGHT:
      return false;
    case goog.events.KeyCodes.WIN_KEY_FF_LINUX:
      return!goog.userAgent.GECKO;
    default:
      return e.keyCode < goog.events.KeyCodes.FIRST_MEDIA_KEY || e.keyCode > goog.events.KeyCodes.LAST_MEDIA_KEY
  }
};
goog.events.KeyCodes.firesKeyPressEvent = function(keyCode, opt_heldKeyCode, opt_shiftKey, opt_ctrlKey, opt_altKey) {
  if(!goog.userAgent.IE && !(goog.userAgent.WEBKIT && goog.userAgent.isVersion("525"))) {
    return true
  }
  if(goog.userAgent.MAC && opt_altKey) {
    return goog.events.KeyCodes.isCharacterKey(keyCode)
  }
  if(opt_altKey && !opt_ctrlKey) {
    return false
  }
  if(!opt_shiftKey && (opt_heldKeyCode == goog.events.KeyCodes.CTRL || opt_heldKeyCode == goog.events.KeyCodes.ALT)) {
    return false
  }
  if(goog.userAgent.IE && opt_ctrlKey && opt_heldKeyCode == keyCode) {
    return false
  }
  switch(keyCode) {
    case goog.events.KeyCodes.ENTER:
      return!(goog.userAgent.IE && goog.userAgent.isDocumentMode(9));
    case goog.events.KeyCodes.ESC:
      return!goog.userAgent.WEBKIT
  }
  return goog.events.KeyCodes.isCharacterKey(keyCode)
};
goog.events.KeyCodes.isCharacterKey = function(keyCode) {
  if(keyCode >= goog.events.KeyCodes.ZERO && keyCode <= goog.events.KeyCodes.NINE) {
    return true
  }
  if(keyCode >= goog.events.KeyCodes.NUM_ZERO && keyCode <= goog.events.KeyCodes.NUM_MULTIPLY) {
    return true
  }
  if(keyCode >= goog.events.KeyCodes.A && keyCode <= goog.events.KeyCodes.Z) {
    return true
  }
  if(goog.userAgent.WEBKIT && keyCode == 0) {
    return true
  }
  switch(keyCode) {
    case goog.events.KeyCodes.SPACE:
    ;
    case goog.events.KeyCodes.QUESTION_MARK:
    ;
    case goog.events.KeyCodes.NUM_PLUS:
    ;
    case goog.events.KeyCodes.NUM_MINUS:
    ;
    case goog.events.KeyCodes.NUM_PERIOD:
    ;
    case goog.events.KeyCodes.NUM_DIVISION:
    ;
    case goog.events.KeyCodes.SEMICOLON:
    ;
    case goog.events.KeyCodes.FF_SEMICOLON:
    ;
    case goog.events.KeyCodes.DASH:
    ;
    case goog.events.KeyCodes.EQUALS:
    ;
    case goog.events.KeyCodes.FF_EQUALS:
    ;
    case goog.events.KeyCodes.COMMA:
    ;
    case goog.events.KeyCodes.PERIOD:
    ;
    case goog.events.KeyCodes.SLASH:
    ;
    case goog.events.KeyCodes.APOSTROPHE:
    ;
    case goog.events.KeyCodes.SINGLE_QUOTE:
    ;
    case goog.events.KeyCodes.OPEN_SQUARE_BRACKET:
    ;
    case goog.events.KeyCodes.BACKSLASH:
    ;
    case goog.events.KeyCodes.CLOSE_SQUARE_BRACKET:
      return true;
    default:
      return false
  }
};
goog.events.KeyCodes.normalizeGeckoKeyCode = function(keyCode) {
  switch(keyCode) {
    case goog.events.KeyCodes.FF_EQUALS:
      return goog.events.KeyCodes.EQUALS;
    case goog.events.KeyCodes.FF_SEMICOLON:
      return goog.events.KeyCodes.SEMICOLON;
    case goog.events.KeyCodes.MAC_FF_META:
      return goog.events.KeyCodes.META;
    case goog.events.KeyCodes.WIN_KEY_FF_LINUX:
      return goog.events.KeyCodes.WIN_KEY;
    default:
      return keyCode
  }
};
goog.provide("goog.events.KeyEvent");
goog.provide("goog.events.KeyHandler");
goog.provide("goog.events.KeyHandler.EventType");
goog.require("goog.events");
goog.require("goog.events.BrowserEvent");
goog.require("goog.events.EventTarget");
goog.require("goog.events.EventType");
goog.require("goog.events.KeyCodes");
goog.require("goog.userAgent");
goog.events.KeyHandler = function(opt_element, opt_capture) {
  goog.events.EventTarget.call(this);
  if(opt_element) {
    this.attach(opt_element, opt_capture)
  }
};
goog.inherits(goog.events.KeyHandler, goog.events.EventTarget);
goog.events.KeyHandler.prototype.element_ = null;
goog.events.KeyHandler.prototype.keyPressKey_ = null;
goog.events.KeyHandler.prototype.keyDownKey_ = null;
goog.events.KeyHandler.prototype.keyUpKey_ = null;
goog.events.KeyHandler.prototype.lastKey_ = -1;
goog.events.KeyHandler.prototype.keyCode_ = -1;
goog.events.KeyHandler.prototype.altKey_ = false;
goog.events.KeyHandler.EventType = {KEY:"key"};
goog.events.KeyHandler.safariKey_ = {3:goog.events.KeyCodes.ENTER, 12:goog.events.KeyCodes.NUMLOCK, 63232:goog.events.KeyCodes.UP, 63233:goog.events.KeyCodes.DOWN, 63234:goog.events.KeyCodes.LEFT, 63235:goog.events.KeyCodes.RIGHT, 63236:goog.events.KeyCodes.F1, 63237:goog.events.KeyCodes.F2, 63238:goog.events.KeyCodes.F3, 63239:goog.events.KeyCodes.F4, 63240:goog.events.KeyCodes.F5, 63241:goog.events.KeyCodes.F6, 63242:goog.events.KeyCodes.F7, 63243:goog.events.KeyCodes.F8, 63244:goog.events.KeyCodes.F9, 
63245:goog.events.KeyCodes.F10, 63246:goog.events.KeyCodes.F11, 63247:goog.events.KeyCodes.F12, 63248:goog.events.KeyCodes.PRINT_SCREEN, 63272:goog.events.KeyCodes.DELETE, 63273:goog.events.KeyCodes.HOME, 63275:goog.events.KeyCodes.END, 63276:goog.events.KeyCodes.PAGE_UP, 63277:goog.events.KeyCodes.PAGE_DOWN, 63289:goog.events.KeyCodes.NUMLOCK, 63302:goog.events.KeyCodes.INSERT};
goog.events.KeyHandler.keyIdentifier_ = {"Up":goog.events.KeyCodes.UP, "Down":goog.events.KeyCodes.DOWN, "Left":goog.events.KeyCodes.LEFT, "Right":goog.events.KeyCodes.RIGHT, "Enter":goog.events.KeyCodes.ENTER, "F1":goog.events.KeyCodes.F1, "F2":goog.events.KeyCodes.F2, "F3":goog.events.KeyCodes.F3, "F4":goog.events.KeyCodes.F4, "F5":goog.events.KeyCodes.F5, "F6":goog.events.KeyCodes.F6, "F7":goog.events.KeyCodes.F7, "F8":goog.events.KeyCodes.F8, "F9":goog.events.KeyCodes.F9, "F10":goog.events.KeyCodes.F10, 
"F11":goog.events.KeyCodes.F11, "F12":goog.events.KeyCodes.F12, "U+007F":goog.events.KeyCodes.DELETE, "Home":goog.events.KeyCodes.HOME, "End":goog.events.KeyCodes.END, "PageUp":goog.events.KeyCodes.PAGE_UP, "PageDown":goog.events.KeyCodes.PAGE_DOWN, "Insert":goog.events.KeyCodes.INSERT};
goog.events.KeyHandler.USES_KEYDOWN_ = goog.userAgent.IE || goog.userAgent.WEBKIT && goog.userAgent.isVersion("525");
goog.events.KeyHandler.SAVE_ALT_FOR_KEYPRESS_ = goog.userAgent.MAC && goog.userAgent.GECKO;
goog.events.KeyHandler.prototype.handleKeyDown_ = function(e) {
  if(goog.userAgent.WEBKIT && (this.lastKey_ == goog.events.KeyCodes.CTRL && !e.ctrlKey || this.lastKey_ == goog.events.KeyCodes.ALT && !e.altKey)) {
    this.lastKey_ = -1;
    this.keyCode_ = -1
  }
  if(goog.events.KeyHandler.USES_KEYDOWN_ && !goog.events.KeyCodes.firesKeyPressEvent(e.keyCode, this.lastKey_, e.shiftKey, e.ctrlKey, e.altKey)) {
    this.handleEvent(e)
  }else {
    this.keyCode_ = goog.userAgent.GECKO ? goog.events.KeyCodes.normalizeGeckoKeyCode(e.keyCode) : e.keyCode;
    if(goog.events.KeyHandler.SAVE_ALT_FOR_KEYPRESS_) {
      this.altKey_ = e.altKey
    }
  }
};
goog.events.KeyHandler.prototype.handleKeyup_ = function(e) {
  this.lastKey_ = -1;
  this.keyCode_ = -1;
  this.altKey_ = e.altKey
};
goog.events.KeyHandler.prototype.handleEvent = function(e) {
  var be = e.getBrowserEvent();
  var keyCode, charCode;
  var altKey = be.altKey;
  if(goog.userAgent.IE && e.type == goog.events.EventType.KEYPRESS) {
    keyCode = this.keyCode_;
    charCode = keyCode != goog.events.KeyCodes.ENTER && keyCode != goog.events.KeyCodes.ESC ? be.keyCode : 0
  }else {
    if(goog.userAgent.WEBKIT && e.type == goog.events.EventType.KEYPRESS) {
      keyCode = this.keyCode_;
      charCode = be.charCode >= 0 && be.charCode < 63232 && goog.events.KeyCodes.isCharacterKey(keyCode) ? be.charCode : 0
    }else {
      if(goog.userAgent.OPERA) {
        keyCode = this.keyCode_;
        charCode = goog.events.KeyCodes.isCharacterKey(keyCode) ? be.keyCode : 0
      }else {
        keyCode = be.keyCode || this.keyCode_;
        charCode = be.charCode || 0;
        if(goog.events.KeyHandler.SAVE_ALT_FOR_KEYPRESS_) {
          altKey = this.altKey_
        }
        if(goog.userAgent.MAC && charCode == goog.events.KeyCodes.QUESTION_MARK && keyCode == goog.events.KeyCodes.WIN_KEY) {
          keyCode = goog.events.KeyCodes.SLASH
        }
      }
    }
  }
  var key = keyCode;
  var keyIdentifier = be.keyIdentifier;
  if(keyCode) {
    if(keyCode >= 63232 && keyCode in goog.events.KeyHandler.safariKey_) {
      key = goog.events.KeyHandler.safariKey_[keyCode]
    }else {
      if(keyCode == 25 && e.shiftKey) {
        key = 9
      }
    }
  }else {
    if(keyIdentifier && keyIdentifier in goog.events.KeyHandler.keyIdentifier_) {
      key = goog.events.KeyHandler.keyIdentifier_[keyIdentifier]
    }
  }
  var repeat = key == this.lastKey_;
  this.lastKey_ = key;
  var event = new goog.events.KeyEvent(key, charCode, repeat, be);
  event.altKey = altKey;
  this.dispatchEvent(event)
};
goog.events.KeyHandler.prototype.getElement = function() {
  return this.element_
};
goog.events.KeyHandler.prototype.attach = function(element, opt_capture) {
  if(this.keyUpKey_) {
    this.detach()
  }
  this.element_ = element;
  this.keyPressKey_ = goog.events.listen(this.element_, goog.events.EventType.KEYPRESS, this, opt_capture);
  this.keyDownKey_ = goog.events.listen(this.element_, goog.events.EventType.KEYDOWN, this.handleKeyDown_, opt_capture, this);
  this.keyUpKey_ = goog.events.listen(this.element_, goog.events.EventType.KEYUP, this.handleKeyup_, opt_capture, this)
};
goog.events.KeyHandler.prototype.detach = function() {
  if(this.keyPressKey_) {
    goog.events.unlistenByKey(this.keyPressKey_);
    goog.events.unlistenByKey(this.keyDownKey_);
    goog.events.unlistenByKey(this.keyUpKey_);
    this.keyPressKey_ = null;
    this.keyDownKey_ = null;
    this.keyUpKey_ = null
  }
  this.element_ = null;
  this.lastKey_ = -1;
  this.keyCode_ = -1
};
goog.events.KeyHandler.prototype.disposeInternal = function() {
  goog.events.KeyHandler.superClass_.disposeInternal.call(this);
  this.detach()
};
goog.events.KeyEvent = function(keyCode, charCode, repeat, browserEvent) {
  goog.events.BrowserEvent.call(this, browserEvent);
  this.type = goog.events.KeyHandler.EventType.KEY;
  this.keyCode = keyCode;
  this.charCode = charCode;
  this.repeat = repeat
};
goog.inherits(goog.events.KeyEvent, goog.events.BrowserEvent);
goog.provide("goog.events.MouseWheelEvent");
goog.provide("goog.events.MouseWheelHandler");
goog.provide("goog.events.MouseWheelHandler.EventType");
goog.require("goog.events");
goog.require("goog.events.BrowserEvent");
goog.require("goog.events.EventTarget");
goog.require("goog.math");
goog.require("goog.style");
goog.require("goog.userAgent");
goog.events.MouseWheelHandler = function(element) {
  goog.events.EventTarget.call(this);
  this.element_ = element;
  var rtlElement = goog.dom.isElement(this.element_) ? this.element_ : this.element_ ? this.element_.body : null;
  this.isRtl_ = !!rtlElement && goog.style.isRightToLeft(rtlElement);
  var type = goog.userAgent.GECKO ? "DOMMouseScroll" : "mousewheel";
  this.listenKey_ = goog.events.listen(this.element_, type, this)
};
goog.inherits(goog.events.MouseWheelHandler, goog.events.EventTarget);
goog.events.MouseWheelHandler.EventType = {MOUSEWHEEL:"mousewheel"};
goog.events.MouseWheelHandler.prototype.maxDeltaX_;
goog.events.MouseWheelHandler.prototype.maxDeltaY_;
goog.events.MouseWheelHandler.prototype.setMaxDeltaX = function(maxDeltaX) {
  this.maxDeltaX_ = maxDeltaX
};
goog.events.MouseWheelHandler.prototype.setMaxDeltaY = function(maxDeltaY) {
  this.maxDeltaY_ = maxDeltaY
};
goog.events.MouseWheelHandler.prototype.handleEvent = function(e) {
  var deltaX = 0;
  var deltaY = 0;
  var detail = 0;
  var be = e.getBrowserEvent();
  if(be.type == "mousewheel") {
    var wheelDeltaScaleFactor = 1;
    if(goog.userAgent.IE || goog.userAgent.WEBKIT && (goog.userAgent.WINDOWS || goog.userAgent.isVersion("532.0"))) {
      wheelDeltaScaleFactor = 40
    }
    detail = goog.events.MouseWheelHandler.smartScale_(-be.wheelDelta, wheelDeltaScaleFactor);
    if(goog.isDef(be.wheelDeltaX)) {
      deltaX = goog.events.MouseWheelHandler.smartScale_(-be.wheelDeltaX, wheelDeltaScaleFactor);
      deltaY = goog.events.MouseWheelHandler.smartScale_(-be.wheelDeltaY, wheelDeltaScaleFactor)
    }else {
      deltaY = detail
    }
  }else {
    detail = be.detail;
    if(detail > 100) {
      detail = 3
    }else {
      if(detail < -100) {
        detail = -3
      }
    }
    if(goog.isDef(be.axis) && be.axis === be.HORIZONTAL_AXIS) {
      deltaX = detail
    }else {
      deltaY = detail
    }
  }
  if(goog.isNumber(this.maxDeltaX_)) {
    deltaX = goog.math.clamp(deltaX, -this.maxDeltaX_, this.maxDeltaX_)
  }
  if(goog.isNumber(this.maxDeltaY_)) {
    deltaY = goog.math.clamp(deltaY, -this.maxDeltaY_, this.maxDeltaY_)
  }
  if(this.isRtl_) {
    deltaX = -deltaX
  }
  var newEvent = new goog.events.MouseWheelEvent(detail, be, deltaX, deltaY);
  this.dispatchEvent(newEvent)
};
goog.events.MouseWheelHandler.smartScale_ = function(mouseWheelDelta, scaleFactor) {
  if(goog.userAgent.WEBKIT && (goog.userAgent.MAC || goog.userAgent.LINUX) && mouseWheelDelta % scaleFactor != 0) {
    return mouseWheelDelta
  }else {
    return mouseWheelDelta / scaleFactor
  }
};
goog.events.MouseWheelHandler.prototype.disposeInternal = function() {
  goog.events.MouseWheelHandler.superClass_.disposeInternal.call(this);
  goog.events.unlistenByKey(this.listenKey_);
  delete this.listenKey_
};
goog.events.MouseWheelEvent = function(detail, browserEvent, deltaX, deltaY) {
  goog.events.BrowserEvent.call(this, browserEvent);
  this.type = goog.events.MouseWheelHandler.EventType.MOUSEWHEEL;
  this.detail = detail;
  this.deltaX = deltaX;
  this.deltaY = deltaY
};
goog.inherits(goog.events.MouseWheelEvent, goog.events.BrowserEvent);
goog.provide("ol.BrowserFeature");
ol.ASSUME_TOUCH = false;
ol.BrowserFeature = {HAS_TOUCH:ol.ASSUME_TOUCH || document && "ontouchstart" in document.documentElement || !!window.navigator.msPointerEnabled};
goog.provide("ol.Object");
goog.provide("ol.ObjectEventType");
goog.require("goog.array");
goog.require("goog.events");
goog.require("goog.events.EventTarget");
goog.require("goog.object");
ol.ObjectEventType = {CHANGED:"changed"};
ol.ObjectProperty = {ACCESSORS:"ol_accessors_", BINDINGS:"ol_bindings_"};
ol.Object = function(opt_values) {
  goog.base(this);
  this.values_ = {};
  if(goog.isDef(opt_values)) {
    this.setValues(opt_values)
  }
};
goog.inherits(ol.Object, goog.events.EventTarget);
ol.Object.changedEventTypeCache_ = {};
ol.Object.getterNameCache_ = {};
ol.Object.setterNameCache_ = {};
ol.Object.capitalize = function(str) {
  return str.substr(0, 1).toUpperCase() + str.substr(1)
};
ol.Object.getAccessors = function(obj) {
  return obj[ol.ObjectProperty.ACCESSORS] || (obj[ol.ObjectProperty.ACCESSORS] = {})
};
ol.Object.getChangedEventType = function(key) {
  return ol.Object.changedEventTypeCache_.hasOwnProperty(key) ? ol.Object.changedEventTypeCache_[key] : ol.Object.changedEventTypeCache_[key] = key.toLowerCase() + "_changed"
};
ol.Object.getGetterName = function(key) {
  return ol.Object.getterNameCache_.hasOwnProperty(key) ? ol.Object.getterNameCache_[key] : ol.Object.getterNameCache_[key] = "get" + ol.Object.capitalize(key)
};
ol.Object.getListeners = function(obj) {
  return obj[ol.ObjectProperty.BINDINGS] || (obj[ol.ObjectProperty.BINDINGS] = {})
};
ol.Object.getSetterName = function(key) {
  return ol.Object.setterNameCache_.hasOwnProperty(key) ? ol.Object.setterNameCache_[key] : ol.Object.setterNameCache_[key] = "set" + ol.Object.capitalize(key)
};
ol.Object.prototype.bindTo = function(key, target, opt_targetKey, opt_noNotify) {
  var targetKey = opt_targetKey || key;
  this.unbind(key);
  var eventType = ol.Object.getChangedEventType(targetKey);
  var listeners = ol.Object.getListeners(this);
  listeners[key] = goog.events.listen(target, eventType, function() {
    this.notifyInternal_(key)
  }, undefined, this);
  var accessors = ol.Object.getAccessors(this);
  accessors[key] = {target:target, key:targetKey};
  var noNotify = opt_noNotify || false;
  if(!noNotify) {
    this.notifyInternal_(key)
  }
};
ol.Object.prototype.changed = goog.nullFunction;
ol.Object.prototype.get = function(key) {
  var value;
  var accessors = ol.Object.getAccessors(this);
  if(accessors.hasOwnProperty(key)) {
    var accessor = accessors[key];
    var target = accessor.target;
    var targetKey = accessor.key;
    var getterName = ol.Object.getGetterName(targetKey);
    if(target[getterName]) {
      value = target[getterName]()
    }else {
      value = target.get(targetKey)
    }
  }else {
    if(this.values_.hasOwnProperty(key)) {
      value = this.values_[key]
    }
  }
  return value
};
ol.Object.prototype.getKeys = function() {
  var keys = goog.object.getKeys(ol.Object.getAccessors(this)).concat(goog.object.getKeys(this.values_));
  goog.array.removeDuplicates(keys);
  return keys
};
ol.Object.prototype.notify = function(key) {
  var accessors = ol.Object.getAccessors(this);
  if(accessors.hasOwnProperty(key)) {
    var accessor = accessors[key];
    var target = accessor.target;
    var targetKey = accessor.key;
    target.notify(targetKey)
  }else {
    this.notifyInternal_(key)
  }
};
ol.Object.prototype.notifyInternal_ = function(key) {
  var eventType = ol.Object.getChangedEventType(key);
  this.dispatchEvent(eventType);
  this.dispatchEvent(ol.ObjectEventType.CHANGED)
};
ol.Object.prototype.set = function(key, value) {
  var accessors = ol.Object.getAccessors(this);
  if(accessors.hasOwnProperty(key)) {
    var accessor = accessors[key];
    var target = accessor.target;
    var targetKey = accessor.key;
    var setterName = ol.Object.getSetterName(targetKey);
    if(target[setterName]) {
      target[setterName](value)
    }else {
      target.set(targetKey, value)
    }
  }else {
    this.values_[key] = value;
    this.notifyInternal_(key)
  }
};
ol.Object.prototype.setOptions = function(options) {
  var key, value, setterName;
  for(key in options) {
    value = options[key];
    setterName = ol.Object.getSetterName(key);
    if(this[setterName]) {
      this[setterName](value)
    }else {
      this.set(key, value)
    }
  }
};
ol.Object.prototype.setValues = ol.Object.prototype.setOptions;
ol.Object.prototype.unbind = function(key) {
  var listeners = ol.Object.getListeners(this);
  var listener = listeners[key];
  if(listener) {
    delete listeners[key];
    goog.events.unlistenByKey(listener);
    var value = this.get(key);
    var accessors = ol.Object.getAccessors(this);
    delete accessors[key];
    this.values_[key] = value
  }
};
ol.Object.prototype.unbindAll = function() {
  for(var key in ol.Object.getListeners(this)) {
    this.unbind(key)
  }
};
goog.provide("ol.Collection");
goog.provide("ol.CollectionEvent");
goog.provide("ol.CollectionEventType");
goog.require("goog.array");
goog.require("goog.events.Event");
goog.require("ol.Object");
ol.CollectionEventType = {ADD:"add", INSERT_AT:"insert_at", REMOVE:"remove", REMOVE_AT:"remove_at", SET_AT:"set_at"};
ol.CollectionEvent = function(type, opt_elem, opt_index, opt_prev, opt_target) {
  goog.base(this, type, opt_target);
  this.elem = opt_elem;
  this.index = opt_index;
  this.prev = opt_prev
};
goog.inherits(ol.CollectionEvent, goog.events.Event);
ol.CollectionProperty = {LENGTH:"length"};
ol.Collection = function(opt_array) {
  goog.base(this);
  this.array_ = opt_array || [];
  this.updateLength_()
};
goog.inherits(ol.Collection, ol.Object);
ol.Collection.prototype.clear = function() {
  while(this.getLength() > 0) {
    this.pop()
  }
};
ol.Collection.prototype.forEach = function(f, opt_obj) {
  goog.array.forEach(this.array_, f, opt_obj)
};
ol.Collection.prototype.getArray = function() {
  return this.array_
};
ol.Collection.prototype.getAt = function(index) {
  return this.array_[index]
};
ol.Collection.prototype.getLength = function() {
  return this.get(ol.CollectionProperty.LENGTH)
};
ol.Collection.prototype.insertAt = function(index, elem) {
  goog.array.insertAt(this.array_, elem, index);
  this.updateLength_();
  this.dispatchEvent(new ol.CollectionEvent(ol.CollectionEventType.ADD, elem, undefined, undefined, this));
  this.dispatchEvent(new ol.CollectionEvent(ol.CollectionEventType.INSERT_AT, elem, index, undefined, this))
};
ol.Collection.prototype.pop = function() {
  return this.removeAt(this.getLength() - 1)
};
ol.Collection.prototype.push = function(elem) {
  var n = this.array_.length;
  this.insertAt(n, elem);
  return n
};
ol.Collection.prototype.removeAt = function(index) {
  var prev = this.array_[index];
  goog.array.removeAt(this.array_, index);
  this.updateLength_();
  this.dispatchEvent(new ol.CollectionEvent(ol.CollectionEventType.REMOVE, prev, undefined, undefined, this));
  this.dispatchEvent(new ol.CollectionEvent(ol.CollectionEventType.REMOVE_AT, undefined, index, prev, this));
  return prev
};
ol.Collection.prototype.setAt = function(index, elem) {
  var n = this.getLength();
  if(index < n) {
    var prev = this.array_[index];
    this.array_[index] = elem;
    this.dispatchEvent(new ol.CollectionEvent(ol.CollectionEventType.SET_AT, elem, index, prev, this));
    this.dispatchEvent(new ol.CollectionEvent(ol.CollectionEventType.REMOVE, prev, undefined, undefined, this));
    this.dispatchEvent(new ol.CollectionEvent(ol.CollectionEventType.ADD, elem, undefined, undefined, this))
  }else {
    var j;
    for(j = n;j < index;++j) {
      this.insertAt(j, undefined)
    }
    this.insertAt(index, elem)
  }
};
ol.Collection.prototype.updateLength_ = function() {
  this.set(ol.CollectionProperty.LENGTH, this.array_.length)
};
goog.provide("goog.color.names");
goog.color.names = {"aliceblue":"#f0f8ff", "antiquewhite":"#faebd7", "aqua":"#00ffff", "aquamarine":"#7fffd4", "azure":"#f0ffff", "beige":"#f5f5dc", "bisque":"#ffe4c4", "black":"#000000", "blanchedalmond":"#ffebcd", "blue":"#0000ff", "blueviolet":"#8a2be2", "brown":"#a52a2a", "burlywood":"#deb887", "cadetblue":"#5f9ea0", "chartreuse":"#7fff00", "chocolate":"#d2691e", "coral":"#ff7f50", "cornflowerblue":"#6495ed", "cornsilk":"#fff8dc", "crimson":"#dc143c", "cyan":"#00ffff", "darkblue":"#00008b", "darkcyan":"#008b8b", 
"darkgoldenrod":"#b8860b", "darkgray":"#a9a9a9", "darkgreen":"#006400", "darkgrey":"#a9a9a9", "darkkhaki":"#bdb76b", "darkmagenta":"#8b008b", "darkolivegreen":"#556b2f", "darkorange":"#ff8c00", "darkorchid":"#9932cc", "darkred":"#8b0000", "darksalmon":"#e9967a", "darkseagreen":"#8fbc8f", "darkslateblue":"#483d8b", "darkslategray":"#2f4f4f", "darkslategrey":"#2f4f4f", "darkturquoise":"#00ced1", "darkviolet":"#9400d3", "deeppink":"#ff1493", "deepskyblue":"#00bfff", "dimgray":"#696969", "dimgrey":"#696969", 
"dodgerblue":"#1e90ff", "firebrick":"#b22222", "floralwhite":"#fffaf0", "forestgreen":"#228b22", "fuchsia":"#ff00ff", "gainsboro":"#dcdcdc", "ghostwhite":"#f8f8ff", "gold":"#ffd700", "goldenrod":"#daa520", "gray":"#808080", "green":"#008000", "greenyellow":"#adff2f", "grey":"#808080", "honeydew":"#f0fff0", "hotpink":"#ff69b4", "indianred":"#cd5c5c", "indigo":"#4b0082", "ivory":"#fffff0", "khaki":"#f0e68c", "lavender":"#e6e6fa", "lavenderblush":"#fff0f5", "lawngreen":"#7cfc00", "lemonchiffon":"#fffacd", 
"lightblue":"#add8e6", "lightcoral":"#f08080", "lightcyan":"#e0ffff", "lightgoldenrodyellow":"#fafad2", "lightgray":"#d3d3d3", "lightgreen":"#90ee90", "lightgrey":"#d3d3d3", "lightpink":"#ffb6c1", "lightsalmon":"#ffa07a", "lightseagreen":"#20b2aa", "lightskyblue":"#87cefa", "lightslategray":"#778899", "lightslategrey":"#778899", "lightsteelblue":"#b0c4de", "lightyellow":"#ffffe0", "lime":"#00ff00", "limegreen":"#32cd32", "linen":"#faf0e6", "magenta":"#ff00ff", "maroon":"#800000", "mediumaquamarine":"#66cdaa", 
"mediumblue":"#0000cd", "mediumorchid":"#ba55d3", "mediumpurple":"#9370d8", "mediumseagreen":"#3cb371", "mediumslateblue":"#7b68ee", "mediumspringgreen":"#00fa9a", "mediumturquoise":"#48d1cc", "mediumvioletred":"#c71585", "midnightblue":"#191970", "mintcream":"#f5fffa", "mistyrose":"#ffe4e1", "moccasin":"#ffe4b5", "navajowhite":"#ffdead", "navy":"#000080", "oldlace":"#fdf5e6", "olive":"#808000", "olivedrab":"#6b8e23", "orange":"#ffa500", "orangered":"#ff4500", "orchid":"#da70d6", "palegoldenrod":"#eee8aa", 
"palegreen":"#98fb98", "paleturquoise":"#afeeee", "palevioletred":"#d87093", "papayawhip":"#ffefd5", "peachpuff":"#ffdab9", "peru":"#cd853f", "pink":"#ffc0cb", "plum":"#dda0dd", "powderblue":"#b0e0e6", "purple":"#800080", "red":"#ff0000", "rosybrown":"#bc8f8f", "royalblue":"#4169e1", "saddlebrown":"#8b4513", "salmon":"#fa8072", "sandybrown":"#f4a460", "seagreen":"#2e8b57", "seashell":"#fff5ee", "sienna":"#a0522d", "silver":"#c0c0c0", "skyblue":"#87ceeb", "slateblue":"#6a5acd", "slategray":"#708090", 
"slategrey":"#708090", "snow":"#fffafa", "springgreen":"#00ff7f", "steelblue":"#4682b4", "tan":"#d2b48c", "teal":"#008080", "thistle":"#d8bfd8", "tomato":"#ff6347", "turquoise":"#40e0d0", "violet":"#ee82ee", "wheat":"#f5deb3", "white":"#ffffff", "whitesmoke":"#f5f5f5", "yellow":"#ffff00", "yellowgreen":"#9acd32"};
goog.provide("goog.color");
goog.require("goog.color.names");
goog.require("goog.math");
goog.color.Rgb;
goog.color.Hsv;
goog.color.Hsl;
goog.color.parse = function(str) {
  var result = {};
  str = String(str);
  var maybeHex = goog.color.prependHashIfNecessaryHelper(str);
  if(goog.color.isValidHexColor_(maybeHex)) {
    result.hex = goog.color.normalizeHex(maybeHex);
    result.type = "hex";
    return result
  }else {
    var rgb = goog.color.isValidRgbColor_(str);
    if(rgb.length) {
      result.hex = goog.color.rgbArrayToHex(rgb);
      result.type = "rgb";
      return result
    }else {
      if(goog.color.names) {
        var hex = goog.color.names[str.toLowerCase()];
        if(hex) {
          result.hex = hex;
          result.type = "named";
          return result
        }
      }
    }
  }
  throw Error(str + " is not a valid color string");
};
goog.color.isValidColor = function(str) {
  var maybeHex = goog.color.prependHashIfNecessaryHelper(str);
  return!!(goog.color.isValidHexColor_(maybeHex) || goog.color.isValidRgbColor_(str).length || goog.color.names && goog.color.names[str.toLowerCase()])
};
goog.color.parseRgb = function(str) {
  var rgb = goog.color.isValidRgbColor_(str);
  if(!rgb.length) {
    throw Error(str + " is not a valid RGB color");
  }
  return rgb
};
goog.color.hexToRgbStyle = function(hexColor) {
  return goog.color.rgbStyle_(goog.color.hexToRgb(hexColor))
};
goog.color.hexTripletRe_ = /#(.)(.)(.)/;
goog.color.normalizeHex = function(hexColor) {
  if(!goog.color.isValidHexColor_(hexColor)) {
    throw Error("'" + hexColor + "' is not a valid hex color");
  }
  if(hexColor.length == 4) {
    hexColor = hexColor.replace(goog.color.hexTripletRe_, "#$1$1$2$2$3$3")
  }
  return hexColor.toLowerCase()
};
goog.color.hexToRgb = function(hexColor) {
  hexColor = goog.color.normalizeHex(hexColor);
  var r = parseInt(hexColor.substr(1, 2), 16);
  var g = parseInt(hexColor.substr(3, 2), 16);
  var b = parseInt(hexColor.substr(5, 2), 16);
  return[r, g, b]
};
goog.color.rgbToHex = function(r, g, b) {
  r = Number(r);
  g = Number(g);
  b = Number(b);
  if(isNaN(r) || r < 0 || r > 255 || isNaN(g) || g < 0 || g > 255 || isNaN(b) || b < 0 || b > 255) {
    throw Error('"(' + r + "," + g + "," + b + '") is not a valid RGB color');
  }
  var hexR = goog.color.prependZeroIfNecessaryHelper(r.toString(16));
  var hexG = goog.color.prependZeroIfNecessaryHelper(g.toString(16));
  var hexB = goog.color.prependZeroIfNecessaryHelper(b.toString(16));
  return"#" + hexR + hexG + hexB
};
goog.color.rgbArrayToHex = function(rgb) {
  return goog.color.rgbToHex(rgb[0], rgb[1], rgb[2])
};
goog.color.rgbToHsl = function(r, g, b) {
  var normR = r / 255;
  var normG = g / 255;
  var normB = b / 255;
  var max = Math.max(normR, normG, normB);
  var min = Math.min(normR, normG, normB);
  var h = 0;
  var s = 0;
  var l = 0.5 * (max + min);
  if(max != min) {
    if(max == normR) {
      h = 60 * (normG - normB) / (max - min)
    }else {
      if(max == normG) {
        h = 60 * (normB - normR) / (max - min) + 120
      }else {
        if(max == normB) {
          h = 60 * (normR - normG) / (max - min) + 240
        }
      }
    }
    if(0 < l && l <= 0.5) {
      s = (max - min) / (2 * l)
    }else {
      s = (max - min) / (2 - 2 * l)
    }
  }
  return[Math.round(h + 360) % 360, s, l]
};
goog.color.rgbArrayToHsl = function(rgb) {
  return goog.color.rgbToHsl(rgb[0], rgb[1], rgb[2])
};
goog.color.hueToRgb_ = function(v1, v2, vH) {
  if(vH < 0) {
    vH += 1
  }else {
    if(vH > 1) {
      vH -= 1
    }
  }
  if(6 * vH < 1) {
    return v1 + (v2 - v1) * 6 * vH
  }else {
    if(2 * vH < 1) {
      return v2
    }else {
      if(3 * vH < 2) {
        return v1 + (v2 - v1) * (2 / 3 - vH) * 6
      }
    }
  }
  return v1
};
goog.color.hslToRgb = function(h, s, l) {
  var r = 0;
  var g = 0;
  var b = 0;
  var normH = h / 360;
  if(s == 0) {
    r = g = b = l * 255
  }else {
    var temp1 = 0;
    var temp2 = 0;
    if(l < 0.5) {
      temp2 = l * (1 + s)
    }else {
      temp2 = l + s - s * l
    }
    temp1 = 2 * l - temp2;
    r = 255 * goog.color.hueToRgb_(temp1, temp2, normH + 1 / 3);
    g = 255 * goog.color.hueToRgb_(temp1, temp2, normH);
    b = 255 * goog.color.hueToRgb_(temp1, temp2, normH - 1 / 3)
  }
  return[Math.round(r), Math.round(g), Math.round(b)]
};
goog.color.hslArrayToRgb = function(hsl) {
  return goog.color.hslToRgb(hsl[0], hsl[1], hsl[2])
};
goog.color.validHexColorRe_ = /^#(?:[0-9a-f]{3}){1,2}$/i;
goog.color.isValidHexColor_ = function(str) {
  return goog.color.validHexColorRe_.test(str)
};
goog.color.normalizedHexColorRe_ = /^#[0-9a-f]{6}$/;
goog.color.isNormalizedHexColor_ = function(str) {
  return goog.color.normalizedHexColorRe_.test(str)
};
goog.color.rgbColorRe_ = /^(?:rgb)?\((0|[1-9]\d{0,2}),\s?(0|[1-9]\d{0,2}),\s?(0|[1-9]\d{0,2})\)$/i;
goog.color.isValidRgbColor_ = function(str) {
  var regExpResultArray = str.match(goog.color.rgbColorRe_);
  if(regExpResultArray) {
    var r = Number(regExpResultArray[1]);
    var g = Number(regExpResultArray[2]);
    var b = Number(regExpResultArray[3]);
    if(r >= 0 && r <= 255 && g >= 0 && g <= 255 && b >= 0 && b <= 255) {
      return[r, g, b]
    }
  }
  return[]
};
goog.color.prependZeroIfNecessaryHelper = function(hex) {
  return hex.length == 1 ? "0" + hex : hex
};
goog.color.prependHashIfNecessaryHelper = function(str) {
  return str.charAt(0) == "#" ? str : "#" + str
};
goog.color.rgbStyle_ = function(rgb) {
  return"rgb(" + rgb.join(",") + ")"
};
goog.color.hsvToRgb = function(h, s, brightness) {
  var red = 0;
  var green = 0;
  var blue = 0;
  if(s == 0) {
    red = brightness;
    green = brightness;
    blue = brightness
  }else {
    var sextant = Math.floor(h / 60);
    var remainder = h / 60 - sextant;
    var val1 = brightness * (1 - s);
    var val2 = brightness * (1 - s * remainder);
    var val3 = brightness * (1 - s * (1 - remainder));
    switch(sextant) {
      case 1:
        red = val2;
        green = brightness;
        blue = val1;
        break;
      case 2:
        red = val1;
        green = brightness;
        blue = val3;
        break;
      case 3:
        red = val1;
        green = val2;
        blue = brightness;
        break;
      case 4:
        red = val3;
        green = val1;
        blue = brightness;
        break;
      case 5:
        red = brightness;
        green = val1;
        blue = val2;
        break;
      case 6:
      ;
      case 0:
        red = brightness;
        green = val3;
        blue = val1;
        break
    }
  }
  return[Math.floor(red), Math.floor(green), Math.floor(blue)]
};
goog.color.rgbToHsv = function(red, green, blue) {
  var max = Math.max(Math.max(red, green), blue);
  var min = Math.min(Math.min(red, green), blue);
  var hue;
  var saturation;
  var value = max;
  if(min == max) {
    hue = 0;
    saturation = 0
  }else {
    var delta = max - min;
    saturation = delta / max;
    if(red == max) {
      hue = (green - blue) / delta
    }else {
      if(green == max) {
        hue = 2 + (blue - red) / delta
      }else {
        hue = 4 + (red - green) / delta
      }
    }
    hue *= 60;
    if(hue < 0) {
      hue += 360
    }
    if(hue > 360) {
      hue -= 360
    }
  }
  return[hue, saturation, value]
};
goog.color.rgbArrayToHsv = function(rgb) {
  return goog.color.rgbToHsv(rgb[0], rgb[1], rgb[2])
};
goog.color.hsvArrayToRgb = function(hsv) {
  return goog.color.hsvToRgb(hsv[0], hsv[1], hsv[2])
};
goog.color.hexToHsl = function(hex) {
  var rgb = goog.color.hexToRgb(hex);
  return goog.color.rgbToHsl(rgb[0], rgb[1], rgb[2])
};
goog.color.hslToHex = function(h, s, l) {
  return goog.color.rgbArrayToHex(goog.color.hslToRgb(h, s, l))
};
goog.color.hslArrayToHex = function(hsl) {
  return goog.color.rgbArrayToHex(goog.color.hslToRgb(hsl[0], hsl[1], hsl[2]))
};
goog.color.hexToHsv = function(hex) {
  return goog.color.rgbArrayToHsv(goog.color.hexToRgb(hex))
};
goog.color.hsvToHex = function(h, s, v) {
  return goog.color.rgbArrayToHex(goog.color.hsvToRgb(h, s, v))
};
goog.color.hsvArrayToHex = function(hsv) {
  return goog.color.hsvToHex(hsv[0], hsv[1], hsv[2])
};
goog.color.hslDistance = function(hsl1, hsl2) {
  var sl1, sl2;
  if(hsl1[2] <= 0.5) {
    sl1 = hsl1[1] * hsl1[2]
  }else {
    sl1 = hsl1[1] * (1 - hsl1[2])
  }
  if(hsl2[2] <= 0.5) {
    sl2 = hsl2[1] * hsl2[2]
  }else {
    sl2 = hsl2[1] * (1 - hsl2[2])
  }
  var h1 = hsl1[0] / 360;
  var h2 = hsl2[0] / 360;
  var dh = (h1 - h2) * 2 * Math.PI;
  return(hsl1[2] - hsl2[2]) * (hsl1[2] - hsl2[2]) + sl1 * sl1 + sl2 * sl2 - 2 * sl1 * sl2 * Math.cos(dh)
};
goog.color.blend = function(rgb1, rgb2, factor) {
  factor = goog.math.clamp(factor, 0, 1);
  return[Math.round(factor * rgb1[0] + (1 - factor) * rgb2[0]), Math.round(factor * rgb1[1] + (1 - factor) * rgb2[1]), Math.round(factor * rgb1[2] + (1 - factor) * rgb2[2])]
};
goog.color.darken = function(rgb, factor) {
  var black = [0, 0, 0];
  return goog.color.blend(black, rgb, factor)
};
goog.color.lighten = function(rgb, factor) {
  var white = [255, 255, 255];
  return goog.color.blend(white, rgb, factor)
};
goog.color.highContrast = function(prime, suggestions) {
  var suggestionsWithDiff = [];
  for(var i = 0;i < suggestions.length;i++) {
    suggestionsWithDiff.push({color:suggestions[i], diff:goog.color.yiqBrightnessDiff_(suggestions[i], prime) + goog.color.colorDiff_(suggestions[i], prime)})
  }
  suggestionsWithDiff.sort(function(a, b) {
    return b.diff - a.diff
  });
  return suggestionsWithDiff[0].color
};
goog.color.yiqBrightness_ = function(rgb) {
  return Math.round((rgb[0] * 299 + rgb[1] * 587 + rgb[2] * 114) / 1E3)
};
goog.color.yiqBrightnessDiff_ = function(rgb1, rgb2) {
  return Math.abs(goog.color.yiqBrightness_(rgb1) - goog.color.yiqBrightness_(rgb2))
};
goog.color.colorDiff_ = function(rgb1, rgb2) {
  return Math.abs(rgb1[0] - rgb2[0]) + Math.abs(rgb1[1] - rgb2[1]) + Math.abs(rgb1[2] - rgb2[2])
};
goog.provide("ol.Color");
goog.require("goog.color");
goog.require("goog.math");
ol.Color = function(r, g, b, a) {
  this.r = goog.math.clamp(r, 0, 255);
  this.g = goog.math.clamp(g, 0, 255);
  this.b = goog.math.clamp(b, 0, 255);
  this.a = goog.math.clamp(a, 0, 1)
};
ol.Color.createFromString = function(str, opt_a) {
  var rgb = goog.color.hexToRgb(goog.color.parse(str).hex);
  var a = opt_a || 255;
  return new ol.Color(rgb[0], rgb[1], rgb[2], a)
};
ol.Color.equals = function(color1, color2) {
  return color1.r == color2.r && color1.g == color2.g && color1.b == color2.b && color1.a == color2.a
};
goog.provide("ol.Size");
goog.require("goog.math.Size");
ol.Size = function(width, height) {
  goog.base(this, width, height)
};
goog.inherits(ol.Size, goog.math.Size);
ol.Size.prototype.equals = function(size) {
  return this.width == size.width && this.height == size.height
};
goog.provide("ol.Rectangle");
goog.require("goog.asserts");
goog.require("ol.Coordinate");
goog.require("ol.Size");
ol.Rectangle = function(minX, minY, maxX, maxY) {
  goog.asserts.assert(minX <= maxX);
  goog.asserts.assert(minY <= maxY);
  this.minX = minX;
  this.minY = minY;
  this.maxX = maxX;
  this.maxY = maxY
};
ol.Rectangle.prototype.equals = function(rectangle) {
  return this.minX == rectangle.minX && this.minY == rectangle.minY && this.maxX == rectangle.maxX && this.maxY == rectangle.maxY
};
ol.Rectangle.prototype.extend = function(rectangle) {
  this.minX = Math.min(this.minX, rectangle.minX);
  this.minY = Math.min(this.minY, rectangle.minY);
  this.maxX = Math.max(this.maxX, rectangle.maxX);
  this.maxY = Math.max(this.maxY, rectangle.maxY)
};
ol.Rectangle.prototype.getCenter = function() {
  return new ol.Coordinate((this.minX + this.maxX) / 2, (this.minY + this.maxY) / 2)
};
ol.Rectangle.prototype.getHeight = function() {
  return this.maxY - this.minY
};
ol.Rectangle.prototype.getSize = function() {
  return new ol.Size(this.getWidth(), this.getHeight())
};
ol.Rectangle.prototype.getWidth = function() {
  return this.maxX - this.minX
};
ol.Rectangle.prototype.intersects = function(rectangle) {
  return this.minX <= rectangle.maxX && this.maxX >= rectangle.minX && this.minY <= rectangle.maxY && this.maxY >= rectangle.minY
};
ol.Rectangle.prototype.normalize = function(coordinate) {
  return new ol.Coordinate((coordinate.x - this.minX) / this.getWidth(), (coordinate.y - this.minY) / this.getHeight())
};
ol.Rectangle.prototype.toString = function() {
  return"(" + [this.minX, this.minY, this.maxX, this.maxY].join(", ") + ")"
};
ol.Rectangle.prototype.scaleFromCenter = function(value) {
  var deltaX = this.getWidth() / 2 * (value - 1);
  var deltaY = this.getHeight() / 2 * (value - 1);
  this.minX -= deltaX;
  this.minY -= deltaY;
  this.maxX += deltaX;
  this.maxY += deltaY
};
goog.provide("ol.TransformFunction");
ol.TransformFunction;
goog.provide("ol.Extent");
goog.require("ol.Coordinate");
goog.require("ol.Rectangle");
goog.require("ol.TransformFunction");
ol.Extent = function(minX, minY, maxX, maxY) {
  goog.base(this, minX, minY, maxX, maxY)
};
goog.inherits(ol.Extent, ol.Rectangle);
ol.Extent.boundingExtent = function(var_args) {
  var coordinate0 = arguments[0];
  var extent = new ol.Extent(coordinate0.x, coordinate0.y, coordinate0.x, coordinate0.y);
  var i;
  for(i = 1;i < arguments.length;++i) {
    var coordinate = arguments[i];
    extent.minX = Math.min(extent.minX, coordinate.x);
    extent.minY = Math.min(extent.minY, coordinate.y);
    extent.maxX = Math.max(extent.maxX, coordinate.x);
    extent.maxY = Math.max(extent.maxY, coordinate.y)
  }
  return extent
};
ol.Extent.prototype.containsCoordinate = function(coordinate) {
  return this.minX <= coordinate.x && coordinate.x <= this.maxX && this.minY <= coordinate.y && coordinate.y <= this.maxY
};
ol.Extent.prototype.containsExtent = function(extent) {
  return this.minX <= extent.minX && extent.maxX <= this.maxX && this.minY <= extent.minY && extent.maxY <= this.maxY
};
ol.Extent.prototype.getBottomLeft = function() {
  return new ol.Coordinate(this.minX, this.minY)
};
ol.Extent.prototype.getBottomRight = function() {
  return new ol.Coordinate(this.maxX, this.minY)
};
ol.Extent.prototype.getTopLeft = function() {
  return new ol.Coordinate(this.minX, this.maxY)
};
ol.Extent.prototype.getTopRight = function() {
  return new ol.Coordinate(this.maxX, this.maxY)
};
ol.Extent.prototype.transform = function(transformFn) {
  var input = [this.minX, this.minY, this.maxX, this.maxY];
  input = transformFn(input, input, 2);
  return new ol.Extent(Math.min(input[0], input[2]), Math.min(input[1], input[3]), Math.max(input[0], input[2]), Math.max(input[1], input[3]))
};
goog.provide("goog.vec.Float32Array");
goog.vec.Float32Array = function(p0) {
  this.length = p0.length || p0;
  for(var i = 0;i < this.length;i++) {
    this[i] = p0[i] || 0
  }
};
goog.vec.Float32Array.BYTES_PER_ELEMENT = 4;
goog.vec.Float32Array.prototype.BYTES_PER_ELEMENT = 4;
goog.vec.Float32Array.prototype.set = function(values, opt_offset) {
  opt_offset = opt_offset || 0;
  for(var i = 0;i < values.length && opt_offset + i < this.length;i++) {
    this[opt_offset + i] = values[i]
  }
};
goog.vec.Float32Array.prototype.toString = Array.prototype.join;
if(typeof Float32Array == "undefined") {
  goog.exportProperty(goog.vec.Float32Array, "BYTES_PER_ELEMENT", goog.vec.Float32Array.BYTES_PER_ELEMENT);
  goog.exportProperty(goog.vec.Float32Array.prototype, "BYTES_PER_ELEMENT", goog.vec.Float32Array.prototype.BYTES_PER_ELEMENT);
  goog.exportProperty(goog.vec.Float32Array.prototype, "set", goog.vec.Float32Array.prototype.set);
  goog.exportProperty(goog.vec.Float32Array.prototype, "toString", goog.vec.Float32Array.prototype.toString);
  goog.exportSymbol("Float32Array", goog.vec.Float32Array)
}
;goog.provide("goog.vec.Float64Array");
goog.vec.Float64Array = function(p0) {
  this.length = p0.length || p0;
  for(var i = 0;i < this.length;i++) {
    this[i] = p0[i] || 0
  }
};
goog.vec.Float64Array.BYTES_PER_ELEMENT = 8;
goog.vec.Float64Array.prototype.BYTES_PER_ELEMENT = 8;
goog.vec.Float64Array.prototype.set = function(values, opt_offset) {
  opt_offset = opt_offset || 0;
  for(var i = 0;i < values.length && opt_offset + i < this.length;i++) {
    this[opt_offset + i] = values[i]
  }
};
goog.vec.Float64Array.prototype.toString = Array.prototype.join;
if(typeof Float64Array == "undefined") {
  goog.exportProperty(goog.vec.Float64Array, "BYTES_PER_ELEMENT", goog.vec.Float64Array.BYTES_PER_ELEMENT);
  goog.exportProperty(goog.vec.Float64Array.prototype, "BYTES_PER_ELEMENT", goog.vec.Float64Array.prototype.BYTES_PER_ELEMENT);
  goog.exportProperty(goog.vec.Float64Array.prototype, "set", goog.vec.Float64Array.prototype.set);
  goog.exportProperty(goog.vec.Float64Array.prototype, "toString", goog.vec.Float64Array.prototype.toString);
  goog.exportSymbol("Float64Array", goog.vec.Float64Array)
}
;goog.provide("goog.vec");
goog.require("goog.vec.Float32Array");
goog.require("goog.vec.Float64Array");
goog.vec.Float32;
goog.vec.Float64;
goog.vec.Number;
goog.vec.AnyType;
goog.vec.ArrayType;
goog.vec.EPSILON = 1E-6;
goog.provide("goog.vec.Vec3");
goog.require("goog.vec");
goog.vec.Vec3.Float32;
goog.vec.Vec3.Float64;
goog.vec.Vec3.Number;
goog.vec.Vec3.AnyType;
goog.vec.Vec3.Type;
goog.vec.Vec3.Vec3Like;
goog.vec.Vec3.createFloat32 = function() {
  return new Float32Array(3)
};
goog.vec.Vec3.createFloat64 = function() {
  return new Float64Array(3)
};
goog.vec.Vec3.createNumber = function() {
  var a = new Array(3);
  goog.vec.Vec3.setFromValues(a, 0, 0, 0);
  return a
};
goog.vec.Vec3.create = function() {
  return new Float32Array(3)
};
goog.vec.Vec3.createFloat32FromArray = function(vec) {
  var newVec = goog.vec.Vec3.createFloat32();
  goog.vec.Vec3.setFromArray(newVec, vec);
  return newVec
};
goog.vec.Vec3.createFloat32FromValues = function(v0, v1, v2) {
  var a = goog.vec.Vec3.createFloat32();
  goog.vec.Vec3.setFromValues(a, v0, v1, v2);
  return a
};
goog.vec.Vec3.cloneFloat32 = goog.vec.Vec3.createFloat32FromArray;
goog.vec.Vec3.createFloat64FromArray = function(vec) {
  var newVec = goog.vec.Vec3.createFloat64();
  goog.vec.Vec3.setFromArray(newVec, vec);
  return newVec
};
goog.vec.Vec3.createFloat64FromValues = function(v0, v1, v2) {
  var vec = goog.vec.Vec3.createFloat64();
  goog.vec.Vec3.setFromValues(vec, v0, v1, v2);
  return vec
};
goog.vec.Vec3.cloneFloat64 = goog.vec.Vec3.createFloat64FromArray;
goog.vec.Vec3.createFromArray = function(vec) {
  var newVec = goog.vec.Vec3.create();
  goog.vec.Vec3.setFromArray(newVec, vec);
  return newVec
};
goog.vec.Vec3.createFromValues = function(v0, v1, v2) {
  var vec = goog.vec.Vec3.create();
  goog.vec.Vec3.setFromValues(vec, v0, v1, v2);
  return vec
};
goog.vec.Vec3.clone = function(vec) {
  var newVec = goog.vec.Vec3.create();
  goog.vec.Vec3.setFromArray(newVec, vec);
  return newVec
};
goog.vec.Vec3.setFromValues = function(vec, v0, v1, v2) {
  vec[0] = v0;
  vec[1] = v1;
  vec[2] = v2;
  return vec
};
goog.vec.Vec3.setFromArray = function(vec, values) {
  vec[0] = values[0];
  vec[1] = values[1];
  vec[2] = values[2];
  return vec
};
goog.vec.Vec3.add = function(vec0, vec1, resultVec) {
  resultVec[0] = vec0[0] + vec1[0];
  resultVec[1] = vec0[1] + vec1[1];
  resultVec[2] = vec0[2] + vec1[2];
  return resultVec
};
goog.vec.Vec3.subtract = function(vec0, vec1, resultVec) {
  resultVec[0] = vec0[0] - vec1[0];
  resultVec[1] = vec0[1] - vec1[1];
  resultVec[2] = vec0[2] - vec1[2];
  return resultVec
};
goog.vec.Vec3.negate = function(vec0, resultVec) {
  resultVec[0] = -vec0[0];
  resultVec[1] = -vec0[1];
  resultVec[2] = -vec0[2];
  return resultVec
};
goog.vec.Vec3.scale = function(vec0, scalar, resultVec) {
  resultVec[0] = vec0[0] * scalar;
  resultVec[1] = vec0[1] * scalar;
  resultVec[2] = vec0[2] * scalar;
  return resultVec
};
goog.vec.Vec3.magnitudeSquared = function(vec0) {
  var x = vec0[0], y = vec0[1], z = vec0[2];
  return x * x + y * y + z * z
};
goog.vec.Vec3.magnitude = function(vec0) {
  var x = vec0[0], y = vec0[1], z = vec0[2];
  return Math.sqrt(x * x + y * y + z * z)
};
goog.vec.Vec3.normalize = function(vec0, resultVec) {
  var ilen = 1 / goog.vec.Vec3.magnitude(vec0);
  resultVec[0] = vec0[0] * ilen;
  resultVec[1] = vec0[1] * ilen;
  resultVec[2] = vec0[2] * ilen;
  return resultVec
};
goog.vec.Vec3.dot = function(v0, v1) {
  return v0[0] * v1[0] + v0[1] * v1[1] + v0[2] * v1[2]
};
goog.vec.Vec3.cross = function(v0, v1, resultVec) {
  var x0 = v0[0], y0 = v0[1], z0 = v0[2];
  var x1 = v1[0], y1 = v1[1], z1 = v1[2];
  resultVec[0] = y0 * z1 - z0 * y1;
  resultVec[1] = z0 * x1 - x0 * z1;
  resultVec[2] = x0 * y1 - y0 * x1;
  return resultVec
};
goog.vec.Vec3.distanceSquared = function(vec0, vec1) {
  var x = vec0[0] - vec1[0];
  var y = vec0[1] - vec1[1];
  var z = vec0[2] - vec1[2];
  return x * x + y * y + z * z
};
goog.vec.Vec3.distance = function(vec0, vec1) {
  return Math.sqrt(goog.vec.Vec3.distanceSquared(vec0, vec1))
};
goog.vec.Vec3.direction = function(vec0, vec1, resultVec) {
  var x = vec1[0] - vec0[0];
  var y = vec1[1] - vec0[1];
  var z = vec1[2] - vec0[2];
  var d = Math.sqrt(x * x + y * y + z * z);
  if(d) {
    d = 1 / d;
    resultVec[0] = x * d;
    resultVec[1] = y * d;
    resultVec[2] = z * d
  }else {
    resultVec[0] = resultVec[1] = resultVec[2] = 0
  }
  return resultVec
};
goog.vec.Vec3.lerp = function(v0, v1, f, resultVec) {
  var x = v0[0], y = v0[1], z = v0[2];
  resultVec[0] = (v1[0] - x) * f + x;
  resultVec[1] = (v1[1] - y) * f + y;
  resultVec[2] = (v1[2] - z) * f + z;
  return resultVec
};
goog.vec.Vec3.equals = function(v0, v1) {
  return v0.length == v1.length && v0[0] == v1[0] && v0[1] == v1[1] && v0[2] == v1[2]
};
goog.provide("goog.vec.Vec4");
goog.require("goog.vec");
goog.vec.Vec4.Float32;
goog.vec.Vec4.Float64;
goog.vec.Vec4.Number;
goog.vec.Vec4.AnyType;
goog.vec.Vec4.Type;
goog.vec.Vec4.Vec4Like;
goog.vec.Vec4.createFloat32 = function() {
  return new Float32Array(4)
};
goog.vec.Vec4.createFloat64 = function() {
  return new Float64Array(4)
};
goog.vec.Vec4.createNumber = function() {
  var v = new Array(4);
  goog.vec.Vec4.setFromValues(v, 0, 0, 0, 0);
  return v
};
goog.vec.Vec4.create = function() {
  return new Float32Array(4)
};
goog.vec.Vec4.createFromArray = function(vec) {
  var newVec = goog.vec.Vec4.create();
  goog.vec.Vec4.setFromArray(newVec, vec);
  return newVec
};
goog.vec.Vec4.createFloat32FromArray = function(vec) {
  var newVec = goog.vec.Vec4.createFloat32();
  goog.vec.Vec4.setFromArray(newVec, vec);
  return newVec
};
goog.vec.Vec4.createFloat32FromValues = function(v0, v1, v2, v3) {
  var vec = goog.vec.Vec4.createFloat32();
  goog.vec.Vec4.setFromValues(vec, v0, v1, v2, v3);
  return vec
};
goog.vec.Vec4.cloneFloat32 = goog.vec.Vec4.createFloat32FromArray;
goog.vec.Vec4.createFloat64FromArray = function(vec) {
  var newVec = goog.vec.Vec4.createFloat64();
  goog.vec.Vec4.setFromArray(newVec, vec);
  return newVec
};
goog.vec.Vec4.createFloat64FromValues = function(v0, v1, v2, v3) {
  var vec = goog.vec.Vec4.createFloat64();
  goog.vec.Vec4.setFromValues(vec, v0, v1, v2, v3);
  return vec
};
goog.vec.Vec4.cloneFloat64 = goog.vec.Vec4.createFloat64FromArray;
goog.vec.Vec4.createFromValues = function(v0, v1, v2, v3) {
  var vec = goog.vec.Vec4.create();
  goog.vec.Vec4.setFromValues(vec, v0, v1, v2, v3);
  return vec
};
goog.vec.Vec4.clone = goog.vec.Vec4.createFromArray;
goog.vec.Vec4.setFromValues = function(vec, v0, v1, v2, v3) {
  vec[0] = v0;
  vec[1] = v1;
  vec[2] = v2;
  vec[3] = v3;
  return vec
};
goog.vec.Vec4.setFromArray = function(vec, values) {
  vec[0] = values[0];
  vec[1] = values[1];
  vec[2] = values[2];
  vec[3] = values[3];
  return vec
};
goog.vec.Vec4.add = function(vec0, vec1, resultVec) {
  resultVec[0] = vec0[0] + vec1[0];
  resultVec[1] = vec0[1] + vec1[1];
  resultVec[2] = vec0[2] + vec1[2];
  resultVec[3] = vec0[3] + vec1[3];
  return resultVec
};
goog.vec.Vec4.subtract = function(vec0, vec1, resultVec) {
  resultVec[0] = vec0[0] - vec1[0];
  resultVec[1] = vec0[1] - vec1[1];
  resultVec[2] = vec0[2] - vec1[2];
  resultVec[3] = vec0[3] - vec1[3];
  return resultVec
};
goog.vec.Vec4.negate = function(vec0, resultVec) {
  resultVec[0] = -vec0[0];
  resultVec[1] = -vec0[1];
  resultVec[2] = -vec0[2];
  resultVec[3] = -vec0[3];
  return resultVec
};
goog.vec.Vec4.scale = function(vec0, scalar, resultVec) {
  resultVec[0] = vec0[0] * scalar;
  resultVec[1] = vec0[1] * scalar;
  resultVec[2] = vec0[2] * scalar;
  resultVec[3] = vec0[3] * scalar;
  return resultVec
};
goog.vec.Vec4.magnitudeSquared = function(vec0) {
  var x = vec0[0], y = vec0[1], z = vec0[2], w = vec0[3];
  return x * x + y * y + z * z + w * w
};
goog.vec.Vec4.magnitude = function(vec0) {
  var x = vec0[0], y = vec0[1], z = vec0[2], w = vec0[3];
  return Math.sqrt(x * x + y * y + z * z + w * w)
};
goog.vec.Vec4.normalize = function(vec0, resultVec) {
  var ilen = 1 / goog.vec.Vec4.magnitude(vec0);
  resultVec[0] = vec0[0] * ilen;
  resultVec[1] = vec0[1] * ilen;
  resultVec[2] = vec0[2] * ilen;
  resultVec[3] = vec0[3] * ilen;
  return resultVec
};
goog.vec.Vec4.dot = function(v0, v1) {
  return v0[0] * v1[0] + v0[1] * v1[1] + v0[2] * v1[2] + v0[3] * v1[3]
};
goog.vec.Vec4.lerp = function(v0, v1, f, resultVec) {
  var x = v0[0], y = v0[1], z = v0[2], w = v0[3];
  resultVec[0] = (v1[0] - x) * f + x;
  resultVec[1] = (v1[1] - y) * f + y;
  resultVec[2] = (v1[2] - z) * f + z;
  resultVec[3] = (v1[3] - w) * f + w;
  return resultVec
};
goog.vec.Vec4.equals = function(v0, v1) {
  return v0.length == v1.length && v0[0] == v1[0] && v0[1] == v1[1] && v0[2] == v1[2] && v0[3] == v1[3]
};
goog.provide("goog.vec.Mat4");
goog.require("goog.vec");
goog.require("goog.vec.Vec3");
goog.require("goog.vec.Vec4");
goog.vec.Mat4.Float32;
goog.vec.Mat4.Float64;
goog.vec.Mat4.Number;
goog.vec.Mat4.AnyType;
goog.vec.Mat4.Type;
goog.vec.Mat4.Mat4Like;
goog.vec.Mat4.createFloat32 = function() {
  return new Float32Array(16)
};
goog.vec.Mat4.createFloat64 = function() {
  return new Float64Array(16)
};
goog.vec.Mat4.createNumber = function() {
  var a = new Array(16);
  goog.vec.Mat4.setFromValues(a, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
  return a
};
goog.vec.Mat4.create = function() {
  return goog.vec.Mat4.createFloat32()
};
goog.vec.Mat4.createFloat32Identity = function() {
  var mat = goog.vec.Mat4.createFloat32();
  mat[0] = mat[5] = mat[10] = mat[15] = 1;
  return mat
};
goog.vec.Mat4.createFloat64Identity = function() {
  var mat = goog.vec.Mat4.createFloat64();
  mat[0] = mat[5] = mat[10] = mat[15] = 1;
  return mat
};
goog.vec.Mat4.createNumberIdentity = function() {
  var a = new Array(16);
  goog.vec.Mat4.setFromValues(a, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
  return a
};
goog.vec.Mat4.createIdentity = function() {
  return goog.vec.Mat4.createFloat32Identity()
};
goog.vec.Mat4.createFloat32FromArray = function(matrix) {
  var newMatrix = goog.vec.Mat4.createFloat32();
  goog.vec.Mat4.setFromArray(newMatrix, matrix);
  return newMatrix
};
goog.vec.Mat4.createFloat32FromValues = function(v00, v10, v20, v30, v01, v11, v21, v31, v02, v12, v22, v32, v03, v13, v23, v33) {
  var newMatrix = goog.vec.Mat4.createFloat32();
  goog.vec.Mat4.setFromValues(newMatrix, v00, v10, v20, v30, v01, v11, v21, v31, v02, v12, v22, v32, v03, v13, v23, v33);
  return newMatrix
};
goog.vec.Mat4.cloneFloat32 = goog.vec.Mat4.createFloat32FromArray;
goog.vec.Mat4.createFloat64FromArray = function(matrix) {
  var newMatrix = goog.vec.Mat4.createFloat64();
  goog.vec.Mat4.setFromArray(newMatrix, matrix);
  return newMatrix
};
goog.vec.Mat4.createFloat64FromValues = function(v00, v10, v20, v30, v01, v11, v21, v31, v02, v12, v22, v32, v03, v13, v23, v33) {
  var newMatrix = goog.vec.Mat4.createFloat64();
  goog.vec.Mat4.setFromValues(newMatrix, v00, v10, v20, v30, v01, v11, v21, v31, v02, v12, v22, v32, v03, v13, v23, v33);
  return newMatrix
};
goog.vec.Mat4.cloneFloat64 = goog.vec.Mat4.createFloat64FromArray;
goog.vec.Mat4.createFromArray = function(matrix) {
  var newMatrix = goog.vec.Mat4.createFloat32();
  goog.vec.Mat4.setFromArray(newMatrix, matrix);
  return newMatrix
};
goog.vec.Mat4.createFromValues = function(v00, v10, v20, v30, v01, v11, v21, v31, v02, v12, v22, v32, v03, v13, v23, v33) {
  return goog.vec.Mat4.createFloat32FromValues(v00, v10, v20, v30, v01, v11, v21, v31, v02, v12, v22, v32, v03, v13, v23, v33)
};
goog.vec.Mat4.clone = goog.vec.Mat4.createFromArray;
goog.vec.Mat4.getElement = function(mat, row, column) {
  return mat[row + column * 4]
};
goog.vec.Mat4.setElement = function(mat, row, column, value) {
  mat[row + column * 4] = value;
  return mat
};
goog.vec.Mat4.setFromValues = function(mat, v00, v10, v20, v30, v01, v11, v21, v31, v02, v12, v22, v32, v03, v13, v23, v33) {
  mat[0] = v00;
  mat[1] = v10;
  mat[2] = v20;
  mat[3] = v30;
  mat[4] = v01;
  mat[5] = v11;
  mat[6] = v21;
  mat[7] = v31;
  mat[8] = v02;
  mat[9] = v12;
  mat[10] = v22;
  mat[11] = v32;
  mat[12] = v03;
  mat[13] = v13;
  mat[14] = v23;
  mat[15] = v33;
  return mat
};
goog.vec.Mat4.setFromArray = function(mat, values) {
  mat[0] = values[0];
  mat[1] = values[1];
  mat[2] = values[2];
  mat[3] = values[3];
  mat[4] = values[4];
  mat[5] = values[5];
  mat[6] = values[6];
  mat[7] = values[7];
  mat[8] = values[8];
  mat[9] = values[9];
  mat[10] = values[10];
  mat[11] = values[11];
  mat[12] = values[12];
  mat[13] = values[13];
  mat[14] = values[14];
  mat[15] = values[15];
  return mat
};
goog.vec.Mat4.setFromRowMajorArray = function(mat, values) {
  mat[0] = values[0];
  mat[1] = values[4];
  mat[2] = values[8];
  mat[3] = values[12];
  mat[4] = values[1];
  mat[5] = values[5];
  mat[6] = values[9];
  mat[7] = values[13];
  mat[8] = values[2];
  mat[9] = values[6];
  mat[10] = values[10];
  mat[11] = values[14];
  mat[12] = values[3];
  mat[13] = values[7];
  mat[14] = values[11];
  mat[15] = values[15];
  return mat
};
goog.vec.Mat4.setDiagonalValues = function(mat, v00, v11, v22, v33) {
  mat[0] = v00;
  mat[5] = v11;
  mat[10] = v22;
  mat[15] = v33;
  return mat
};
goog.vec.Mat4.setDiagonal = function(mat, vec) {
  mat[0] = vec[0];
  mat[5] = vec[1];
  mat[10] = vec[2];
  mat[15] = vec[3];
  return mat
};
goog.vec.Mat4.getDiagonal = function(mat, vec, opt_diagonal) {
  if(!opt_diagonal) {
    vec[0] = mat[0];
    vec[1] = mat[5];
    vec[2] = mat[10];
    vec[3] = mat[15]
  }else {
    var offset = opt_diagonal > 0 ? 4 * opt_diagonal : -opt_diagonal;
    for(var i = 0;i < 4 - Math.abs(opt_diagonal);i++) {
      vec[i] = mat[offset + 5 * i]
    }
  }
  return vec
};
goog.vec.Mat4.setColumnValues = function(mat, column, v0, v1, v2, v3) {
  var i = column * 4;
  mat[i] = v0;
  mat[i + 1] = v1;
  mat[i + 2] = v2;
  mat[i + 3] = v3;
  return mat
};
goog.vec.Mat4.setColumn = function(mat, column, vec) {
  var i = column * 4;
  mat[i] = vec[0];
  mat[i + 1] = vec[1];
  mat[i + 2] = vec[2];
  mat[i + 3] = vec[3];
  return mat
};
goog.vec.Mat4.getColumn = function(mat, column, vec) {
  var i = column * 4;
  vec[0] = mat[i];
  vec[1] = mat[i + 1];
  vec[2] = mat[i + 2];
  vec[3] = mat[i + 3];
  return vec
};
goog.vec.Mat4.setColumns = function(mat, vec0, vec1, vec2, vec3) {
  goog.vec.Mat4.setColumn(mat, 0, vec0);
  goog.vec.Mat4.setColumn(mat, 1, vec1);
  goog.vec.Mat4.setColumn(mat, 2, vec2);
  goog.vec.Mat4.setColumn(mat, 3, vec3);
  return mat
};
goog.vec.Mat4.getColumns = function(mat, vec0, vec1, vec2, vec3) {
  goog.vec.Mat4.getColumn(mat, 0, vec0);
  goog.vec.Mat4.getColumn(mat, 1, vec1);
  goog.vec.Mat4.getColumn(mat, 2, vec2);
  goog.vec.Mat4.getColumn(mat, 3, vec3)
};
goog.vec.Mat4.setRowValues = function(mat, row, v0, v1, v2, v3) {
  mat[row] = v0;
  mat[row + 4] = v1;
  mat[row + 8] = v2;
  mat[row + 12] = v3;
  return mat
};
goog.vec.Mat4.setRow = function(mat, row, vec) {
  mat[row] = vec[0];
  mat[row + 4] = vec[1];
  mat[row + 8] = vec[2];
  mat[row + 12] = vec[3];
  return mat
};
goog.vec.Mat4.getRow = function(mat, row, vec) {
  vec[0] = mat[row];
  vec[1] = mat[row + 4];
  vec[2] = mat[row + 8];
  vec[3] = mat[row + 12];
  return vec
};
goog.vec.Mat4.setRows = function(mat, vec0, vec1, vec2, vec3) {
  goog.vec.Mat4.setRow(mat, 0, vec0);
  goog.vec.Mat4.setRow(mat, 1, vec1);
  goog.vec.Mat4.setRow(mat, 2, vec2);
  goog.vec.Mat4.setRow(mat, 3, vec3);
  return mat
};
goog.vec.Mat4.getRows = function(mat, vec0, vec1, vec2, vec3) {
  goog.vec.Mat4.getRow(mat, 0, vec0);
  goog.vec.Mat4.getRow(mat, 1, vec1);
  goog.vec.Mat4.getRow(mat, 2, vec2);
  goog.vec.Mat4.getRow(mat, 3, vec3)
};
goog.vec.Mat4.makeZero = function(mat) {
  mat[0] = 0;
  mat[1] = 0;
  mat[2] = 0;
  mat[3] = 0;
  mat[4] = 0;
  mat[5] = 0;
  mat[6] = 0;
  mat[7] = 0;
  mat[8] = 0;
  mat[9] = 0;
  mat[10] = 0;
  mat[11] = 0;
  mat[12] = 0;
  mat[13] = 0;
  mat[14] = 0;
  mat[15] = 0;
  return mat
};
goog.vec.Mat4.makeIdentity = function(mat) {
  mat[0] = 1;
  mat[1] = 0;
  mat[2] = 0;
  mat[3] = 0;
  mat[4] = 0;
  mat[5] = 1;
  mat[6] = 0;
  mat[7] = 0;
  mat[8] = 0;
  mat[9] = 0;
  mat[10] = 1;
  mat[11] = 0;
  mat[12] = 0;
  mat[13] = 0;
  mat[14] = 0;
  mat[15] = 1;
  return mat
};
goog.vec.Mat4.addMat = function(mat0, mat1, resultMat) {
  resultMat[0] = mat0[0] + mat1[0];
  resultMat[1] = mat0[1] + mat1[1];
  resultMat[2] = mat0[2] + mat1[2];
  resultMat[3] = mat0[3] + mat1[3];
  resultMat[4] = mat0[4] + mat1[4];
  resultMat[5] = mat0[5] + mat1[5];
  resultMat[6] = mat0[6] + mat1[6];
  resultMat[7] = mat0[7] + mat1[7];
  resultMat[8] = mat0[8] + mat1[8];
  resultMat[9] = mat0[9] + mat1[9];
  resultMat[10] = mat0[10] + mat1[10];
  resultMat[11] = mat0[11] + mat1[11];
  resultMat[12] = mat0[12] + mat1[12];
  resultMat[13] = mat0[13] + mat1[13];
  resultMat[14] = mat0[14] + mat1[14];
  resultMat[15] = mat0[15] + mat1[15];
  return resultMat
};
goog.vec.Mat4.subMat = function(mat0, mat1, resultMat) {
  resultMat[0] = mat0[0] - mat1[0];
  resultMat[1] = mat0[1] - mat1[1];
  resultMat[2] = mat0[2] - mat1[2];
  resultMat[3] = mat0[3] - mat1[3];
  resultMat[4] = mat0[4] - mat1[4];
  resultMat[5] = mat0[5] - mat1[5];
  resultMat[6] = mat0[6] - mat1[6];
  resultMat[7] = mat0[7] - mat1[7];
  resultMat[8] = mat0[8] - mat1[8];
  resultMat[9] = mat0[9] - mat1[9];
  resultMat[10] = mat0[10] - mat1[10];
  resultMat[11] = mat0[11] - mat1[11];
  resultMat[12] = mat0[12] - mat1[12];
  resultMat[13] = mat0[13] - mat1[13];
  resultMat[14] = mat0[14] - mat1[14];
  resultMat[15] = mat0[15] - mat1[15];
  return resultMat
};
goog.vec.Mat4.multScalar = function(mat, scalar, resultMat) {
  resultMat[0] = mat[0] * scalar;
  resultMat[1] = mat[1] * scalar;
  resultMat[2] = mat[2] * scalar;
  resultMat[3] = mat[3] * scalar;
  resultMat[4] = mat[4] * scalar;
  resultMat[5] = mat[5] * scalar;
  resultMat[6] = mat[6] * scalar;
  resultMat[7] = mat[7] * scalar;
  resultMat[8] = mat[8] * scalar;
  resultMat[9] = mat[9] * scalar;
  resultMat[10] = mat[10] * scalar;
  resultMat[11] = mat[11] * scalar;
  resultMat[12] = mat[12] * scalar;
  resultMat[13] = mat[13] * scalar;
  resultMat[14] = mat[14] * scalar;
  resultMat[15] = mat[15] * scalar;
  return resultMat
};
goog.vec.Mat4.multMat = function(mat0, mat1, resultMat) {
  var a00 = mat0[0], a10 = mat0[1], a20 = mat0[2], a30 = mat0[3];
  var a01 = mat0[4], a11 = mat0[5], a21 = mat0[6], a31 = mat0[7];
  var a02 = mat0[8], a12 = mat0[9], a22 = mat0[10], a32 = mat0[11];
  var a03 = mat0[12], a13 = mat0[13], a23 = mat0[14], a33 = mat0[15];
  var b00 = mat1[0], b10 = mat1[1], b20 = mat1[2], b30 = mat1[3];
  var b01 = mat1[4], b11 = mat1[5], b21 = mat1[6], b31 = mat1[7];
  var b02 = mat1[8], b12 = mat1[9], b22 = mat1[10], b32 = mat1[11];
  var b03 = mat1[12], b13 = mat1[13], b23 = mat1[14], b33 = mat1[15];
  resultMat[0] = a00 * b00 + a01 * b10 + a02 * b20 + a03 * b30;
  resultMat[1] = a10 * b00 + a11 * b10 + a12 * b20 + a13 * b30;
  resultMat[2] = a20 * b00 + a21 * b10 + a22 * b20 + a23 * b30;
  resultMat[3] = a30 * b00 + a31 * b10 + a32 * b20 + a33 * b30;
  resultMat[4] = a00 * b01 + a01 * b11 + a02 * b21 + a03 * b31;
  resultMat[5] = a10 * b01 + a11 * b11 + a12 * b21 + a13 * b31;
  resultMat[6] = a20 * b01 + a21 * b11 + a22 * b21 + a23 * b31;
  resultMat[7] = a30 * b01 + a31 * b11 + a32 * b21 + a33 * b31;
  resultMat[8] = a00 * b02 + a01 * b12 + a02 * b22 + a03 * b32;
  resultMat[9] = a10 * b02 + a11 * b12 + a12 * b22 + a13 * b32;
  resultMat[10] = a20 * b02 + a21 * b12 + a22 * b22 + a23 * b32;
  resultMat[11] = a30 * b02 + a31 * b12 + a32 * b22 + a33 * b32;
  resultMat[12] = a00 * b03 + a01 * b13 + a02 * b23 + a03 * b33;
  resultMat[13] = a10 * b03 + a11 * b13 + a12 * b23 + a13 * b33;
  resultMat[14] = a20 * b03 + a21 * b13 + a22 * b23 + a23 * b33;
  resultMat[15] = a30 * b03 + a31 * b13 + a32 * b23 + a33 * b33;
  return resultMat
};
goog.vec.Mat4.transpose = function(mat, resultMat) {
  if(resultMat == mat) {
    var a10 = mat[1], a20 = mat[2], a30 = mat[3];
    var a21 = mat[6], a31 = mat[7];
    var a32 = mat[11];
    resultMat[1] = mat[4];
    resultMat[2] = mat[8];
    resultMat[3] = mat[12];
    resultMat[4] = a10;
    resultMat[6] = mat[9];
    resultMat[7] = mat[13];
    resultMat[8] = a20;
    resultMat[9] = a21;
    resultMat[11] = mat[14];
    resultMat[12] = a30;
    resultMat[13] = a31;
    resultMat[14] = a32
  }else {
    resultMat[0] = mat[0];
    resultMat[1] = mat[4];
    resultMat[2] = mat[8];
    resultMat[3] = mat[12];
    resultMat[4] = mat[1];
    resultMat[5] = mat[5];
    resultMat[6] = mat[9];
    resultMat[7] = mat[13];
    resultMat[8] = mat[2];
    resultMat[9] = mat[6];
    resultMat[10] = mat[10];
    resultMat[11] = mat[14];
    resultMat[12] = mat[3];
    resultMat[13] = mat[7];
    resultMat[14] = mat[11];
    resultMat[15] = mat[15]
  }
  return resultMat
};
goog.vec.Mat4.determinant = function(mat) {
  var m00 = mat[0], m10 = mat[1], m20 = mat[2], m30 = mat[3];
  var m01 = mat[4], m11 = mat[5], m21 = mat[6], m31 = mat[7];
  var m02 = mat[8], m12 = mat[9], m22 = mat[10], m32 = mat[11];
  var m03 = mat[12], m13 = mat[13], m23 = mat[14], m33 = mat[15];
  var a0 = m00 * m11 - m10 * m01;
  var a1 = m00 * m21 - m20 * m01;
  var a2 = m00 * m31 - m30 * m01;
  var a3 = m10 * m21 - m20 * m11;
  var a4 = m10 * m31 - m30 * m11;
  var a5 = m20 * m31 - m30 * m21;
  var b0 = m02 * m13 - m12 * m03;
  var b1 = m02 * m23 - m22 * m03;
  var b2 = m02 * m33 - m32 * m03;
  var b3 = m12 * m23 - m22 * m13;
  var b4 = m12 * m33 - m32 * m13;
  var b5 = m22 * m33 - m32 * m23;
  return a0 * b5 - a1 * b4 + a2 * b3 + a3 * b2 - a4 * b1 + a5 * b0
};
goog.vec.Mat4.invert = function(mat, resultMat) {
  var m00 = mat[0], m10 = mat[1], m20 = mat[2], m30 = mat[3];
  var m01 = mat[4], m11 = mat[5], m21 = mat[6], m31 = mat[7];
  var m02 = mat[8], m12 = mat[9], m22 = mat[10], m32 = mat[11];
  var m03 = mat[12], m13 = mat[13], m23 = mat[14], m33 = mat[15];
  var a0 = m00 * m11 - m10 * m01;
  var a1 = m00 * m21 - m20 * m01;
  var a2 = m00 * m31 - m30 * m01;
  var a3 = m10 * m21 - m20 * m11;
  var a4 = m10 * m31 - m30 * m11;
  var a5 = m20 * m31 - m30 * m21;
  var b0 = m02 * m13 - m12 * m03;
  var b1 = m02 * m23 - m22 * m03;
  var b2 = m02 * m33 - m32 * m03;
  var b3 = m12 * m23 - m22 * m13;
  var b4 = m12 * m33 - m32 * m13;
  var b5 = m22 * m33 - m32 * m23;
  var det = a0 * b5 - a1 * b4 + a2 * b3 + a3 * b2 - a4 * b1 + a5 * b0;
  if(det == 0) {
    return false
  }
  var idet = 1 / det;
  resultMat[0] = (m11 * b5 - m21 * b4 + m31 * b3) * idet;
  resultMat[1] = (-m10 * b5 + m20 * b4 - m30 * b3) * idet;
  resultMat[2] = (m13 * a5 - m23 * a4 + m33 * a3) * idet;
  resultMat[3] = (-m12 * a5 + m22 * a4 - m32 * a3) * idet;
  resultMat[4] = (-m01 * b5 + m21 * b2 - m31 * b1) * idet;
  resultMat[5] = (m00 * b5 - m20 * b2 + m30 * b1) * idet;
  resultMat[6] = (-m03 * a5 + m23 * a2 - m33 * a1) * idet;
  resultMat[7] = (m02 * a5 - m22 * a2 + m32 * a1) * idet;
  resultMat[8] = (m01 * b4 - m11 * b2 + m31 * b0) * idet;
  resultMat[9] = (-m00 * b4 + m10 * b2 - m30 * b0) * idet;
  resultMat[10] = (m03 * a4 - m13 * a2 + m33 * a0) * idet;
  resultMat[11] = (-m02 * a4 + m12 * a2 - m32 * a0) * idet;
  resultMat[12] = (-m01 * b3 + m11 * b1 - m21 * b0) * idet;
  resultMat[13] = (m00 * b3 - m10 * b1 + m20 * b0) * idet;
  resultMat[14] = (-m03 * a3 + m13 * a1 - m23 * a0) * idet;
  resultMat[15] = (m02 * a3 - m12 * a1 + m22 * a0) * idet;
  return true
};
goog.vec.Mat4.equals = function(mat0, mat1) {
  return mat0.length == mat1.length && mat0[0] == mat1[0] && mat0[1] == mat1[1] && mat0[2] == mat1[2] && mat0[3] == mat1[3] && mat0[4] == mat1[4] && mat0[5] == mat1[5] && mat0[6] == mat1[6] && mat0[7] == mat1[7] && mat0[8] == mat1[8] && mat0[9] == mat1[9] && mat0[10] == mat1[10] && mat0[11] == mat1[11] && mat0[12] == mat1[12] && mat0[13] == mat1[13] && mat0[14] == mat1[14] && mat0[15] == mat1[15]
};
goog.vec.Mat4.multVec3 = function(mat, vec, resultVec) {
  var x = vec[0], y = vec[1], z = vec[2];
  resultVec[0] = x * mat[0] + y * mat[4] + z * mat[8] + mat[12];
  resultVec[1] = x * mat[1] + y * mat[5] + z * mat[9] + mat[13];
  resultVec[2] = x * mat[2] + y * mat[6] + z * mat[10] + mat[14];
  return resultVec
};
goog.vec.Mat4.multVec3NoTranslate = function(mat, vec, resultVec) {
  var x = vec[0], y = vec[1], z = vec[2];
  resultVec[0] = x * mat[0] + y * mat[4] + z * mat[8];
  resultVec[1] = x * mat[1] + y * mat[5] + z * mat[9];
  resultVec[2] = x * mat[2] + y * mat[6] + z * mat[10];
  return resultVec
};
goog.vec.Mat4.multVec3Projective = function(mat, vec, resultVec) {
  var x = vec[0], y = vec[1], z = vec[2];
  var invw = 1 / (x * mat[3] + y * mat[7] + z * mat[11] + mat[15]);
  resultVec[0] = (x * mat[0] + y * mat[4] + z * mat[8] + mat[12]) * invw;
  resultVec[1] = (x * mat[1] + y * mat[5] + z * mat[9] + mat[13]) * invw;
  resultVec[2] = (x * mat[2] + y * mat[6] + z * mat[10] + mat[14]) * invw;
  return resultVec
};
goog.vec.Mat4.multVec4 = function(mat, vec, resultVec) {
  var x = vec[0], y = vec[1], z = vec[2], w = vec[3];
  resultVec[0] = x * mat[0] + y * mat[4] + z * mat[8] + w * mat[12];
  resultVec[1] = x * mat[1] + y * mat[5] + z * mat[9] + w * mat[13];
  resultVec[2] = x * mat[2] + y * mat[6] + z * mat[10] + w * mat[14];
  resultVec[3] = x * mat[3] + y * mat[7] + z * mat[11] + w * mat[15];
  return resultVec
};
goog.vec.Mat4.makeTranslate = function(mat, x, y, z) {
  goog.vec.Mat4.makeIdentity(mat);
  return goog.vec.Mat4.setColumnValues(mat, 3, x, y, z, 1)
};
goog.vec.Mat4.makeScale = function(mat, x, y, z) {
  goog.vec.Mat4.makeIdentity(mat);
  return goog.vec.Mat4.setDiagonalValues(mat, x, y, z, 1)
};
goog.vec.Mat4.makeRotate = function(mat, angle, ax, ay, az) {
  var c = Math.cos(angle);
  var d = 1 - c;
  var s = Math.sin(angle);
  return goog.vec.Mat4.setFromValues(mat, ax * ax * d + c, ax * ay * d + az * s, ax * az * d - ay * s, 0, ax * ay * d - az * s, ay * ay * d + c, ay * az * d + ax * s, 0, ax * az * d + ay * s, ay * az * d - ax * s, az * az * d + c, 0, 0, 0, 0, 1)
};
goog.vec.Mat4.makeRotateX = function(mat, angle) {
  var c = Math.cos(angle);
  var s = Math.sin(angle);
  return goog.vec.Mat4.setFromValues(mat, 1, 0, 0, 0, 0, c, s, 0, 0, -s, c, 0, 0, 0, 0, 1)
};
goog.vec.Mat4.makeRotateY = function(mat, angle) {
  var c = Math.cos(angle);
  var s = Math.sin(angle);
  return goog.vec.Mat4.setFromValues(mat, c, 0, -s, 0, 0, 1, 0, 0, s, 0, c, 0, 0, 0, 0, 1)
};
goog.vec.Mat4.makeRotateZ = function(mat, angle) {
  var c = Math.cos(angle);
  var s = Math.sin(angle);
  return goog.vec.Mat4.setFromValues(mat, c, s, 0, 0, -s, c, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)
};
goog.vec.Mat4.makeFrustum = function(mat, left, right, bottom, top, near, far) {
  var x = 2 * near / (right - left);
  var y = 2 * near / (top - bottom);
  var a = (right + left) / (right - left);
  var b = (top + bottom) / (top - bottom);
  var c = -(far + near) / (far - near);
  var d = -(2 * far * near) / (far - near);
  return goog.vec.Mat4.setFromValues(mat, x, 0, 0, 0, 0, y, 0, 0, a, b, c, -1, 0, 0, d, 0)
};
goog.vec.Mat4.makePerspective = function(mat, fovy, aspect, near, far) {
  var angle = fovy / 2;
  var dz = far - near;
  var sinAngle = Math.sin(angle);
  if(dz == 0 || sinAngle == 0 || aspect == 0) {
    return mat
  }
  var cot = Math.cos(angle) / sinAngle;
  return goog.vec.Mat4.setFromValues(mat, cot / aspect, 0, 0, 0, 0, cot, 0, 0, 0, 0, -(far + near) / dz, -1, 0, 0, -(2 * near * far) / dz, 0)
};
goog.vec.Mat4.makeOrtho = function(mat, left, right, bottom, top, near, far) {
  var x = 2 / (right - left);
  var y = 2 / (top - bottom);
  var z = -2 / (far - near);
  var a = -(right + left) / (right - left);
  var b = -(top + bottom) / (top - bottom);
  var c = -(far + near) / (far - near);
  return goog.vec.Mat4.setFromValues(mat, x, 0, 0, 0, 0, y, 0, 0, 0, 0, z, 0, a, b, c, 1)
};
goog.vec.Mat4.makeLookAt = function(mat, eyePt, centerPt, worldUpVec) {
  var fwdVec = goog.vec.Mat4.tmpVec4_[0];
  goog.vec.Vec3.subtract(centerPt, eyePt, fwdVec);
  goog.vec.Vec3.normalize(fwdVec, fwdVec);
  fwdVec[3] = 0;
  var sideVec = goog.vec.Mat4.tmpVec4_[1];
  goog.vec.Vec3.cross(fwdVec, worldUpVec, sideVec);
  goog.vec.Vec3.normalize(sideVec, sideVec);
  sideVec[3] = 0;
  var upVec = goog.vec.Mat4.tmpVec4_[2];
  goog.vec.Vec3.cross(sideVec, fwdVec, upVec);
  goog.vec.Vec3.normalize(upVec, upVec);
  upVec[3] = 0;
  goog.vec.Vec3.negate(fwdVec, fwdVec);
  goog.vec.Mat4.setRow(mat, 0, sideVec);
  goog.vec.Mat4.setRow(mat, 1, upVec);
  goog.vec.Mat4.setRow(mat, 2, fwdVec);
  goog.vec.Mat4.setRowValues(mat, 3, 0, 0, 0, 1);
  goog.vec.Mat4.translate(mat, -eyePt[0], -eyePt[1], -eyePt[2]);
  return mat
};
goog.vec.Mat4.toLookAt = function(mat, eyePt, fwdVec, worldUpVec) {
  var matInverse = goog.vec.Mat4.tmpMat4_[0];
  if(!goog.vec.Mat4.invert(mat, matInverse)) {
    return false
  }
  if(eyePt) {
    eyePt[0] = matInverse[12];
    eyePt[1] = matInverse[13];
    eyePt[2] = matInverse[14]
  }
  if(fwdVec || worldUpVec) {
    if(!fwdVec) {
      fwdVec = goog.vec.Mat4.tmpVec3_[0]
    }
    fwdVec[0] = -mat[2];
    fwdVec[1] = -mat[6];
    fwdVec[2] = -mat[10];
    goog.vec.Vec3.normalize(fwdVec, fwdVec)
  }
  if(worldUpVec) {
    var side = goog.vec.Mat4.tmpVec3_[1];
    side[0] = mat[0];
    side[1] = mat[4];
    side[2] = mat[8];
    goog.vec.Vec3.cross(side, fwdVec, worldUpVec);
    goog.vec.Vec3.normalize(worldUpVec, worldUpVec)
  }
  return true
};
goog.vec.Mat4.makeEulerZXZ = function(mat, theta1, theta2, theta3) {
  var c1 = Math.cos(theta1);
  var s1 = Math.sin(theta1);
  var c2 = Math.cos(theta2);
  var s2 = Math.sin(theta2);
  var c3 = Math.cos(theta3);
  var s3 = Math.sin(theta3);
  mat[0] = c1 * c3 - c2 * s1 * s3;
  mat[1] = c2 * c1 * s3 + c3 * s1;
  mat[2] = s3 * s2;
  mat[3] = 0;
  mat[4] = -c1 * s3 - c3 * c2 * s1;
  mat[5] = c1 * c2 * c3 - s1 * s3;
  mat[6] = c3 * s2;
  mat[7] = 0;
  mat[8] = s2 * s1;
  mat[9] = -c1 * s2;
  mat[10] = c2;
  mat[11] = 0;
  mat[12] = 0;
  mat[13] = 0;
  mat[14] = 0;
  mat[15] = 1;
  return mat
};
goog.vec.Mat4.toEulerZXZ = function(mat, euler, opt_theta2IsNegative) {
  var sinTheta2 = Math.sqrt(mat[2] * mat[2] + mat[6] * mat[6]);
  var signTheta2 = opt_theta2IsNegative ? -1 : 1;
  if(sinTheta2 > goog.vec.EPSILON) {
    euler[2] = Math.atan2(mat[2] * signTheta2, mat[6] * signTheta2);
    euler[1] = Math.atan2(sinTheta2 * signTheta2, mat[10]);
    euler[0] = Math.atan2(mat[8] * signTheta2, -mat[9] * signTheta2)
  }else {
    euler[0] = 0;
    euler[1] = Math.atan2(sinTheta2 * signTheta2, mat[10]);
    euler[2] = Math.atan2(mat[1], mat[0])
  }
  euler[0] = (euler[0] + Math.PI * 2) % (Math.PI * 2);
  euler[2] = (euler[2] + Math.PI * 2) % (Math.PI * 2);
  euler[1] = (euler[1] * signTheta2 + Math.PI * 2) % (Math.PI * 2) * signTheta2;
  return euler
};
goog.vec.Mat4.translate = function(mat, x, y, z) {
  return goog.vec.Mat4.setColumnValues(mat, 3, mat[0] * x + mat[4] * y + mat[8] * z + mat[12], mat[1] * x + mat[5] * y + mat[9] * z + mat[13], mat[2] * x + mat[6] * y + mat[10] * z + mat[14], mat[3] * x + mat[7] * y + mat[11] * z + mat[15])
};
goog.vec.Mat4.scale = function(mat, x, y, z) {
  return goog.vec.Mat4.setFromValues(mat, mat[0] * x, mat[1] * x, mat[2] * x, mat[3] * x, mat[4] * y, mat[5] * y, mat[6] * y, mat[7] * y, mat[8] * z, mat[9] * z, mat[10] * z, mat[11] * z, mat[12], mat[13], mat[14], mat[15])
};
goog.vec.Mat4.rotate = function(mat, angle, x, y, z) {
  var m00 = mat[0], m10 = mat[1], m20 = mat[2], m30 = mat[3];
  var m01 = mat[4], m11 = mat[5], m21 = mat[6], m31 = mat[7];
  var m02 = mat[8], m12 = mat[9], m22 = mat[10], m32 = mat[11];
  var m03 = mat[12], m13 = mat[13], m23 = mat[14], m33 = mat[15];
  var cosAngle = Math.cos(angle);
  var sinAngle = Math.sin(angle);
  var diffCosAngle = 1 - cosAngle;
  var r00 = x * x * diffCosAngle + cosAngle;
  var r10 = x * y * diffCosAngle + z * sinAngle;
  var r20 = x * z * diffCosAngle - y * sinAngle;
  var r01 = x * y * diffCosAngle - z * sinAngle;
  var r11 = y * y * diffCosAngle + cosAngle;
  var r21 = y * z * diffCosAngle + x * sinAngle;
  var r02 = x * z * diffCosAngle + y * sinAngle;
  var r12 = y * z * diffCosAngle - x * sinAngle;
  var r22 = z * z * diffCosAngle + cosAngle;
  return goog.vec.Mat4.setFromValues(mat, m00 * r00 + m01 * r10 + m02 * r20, m10 * r00 + m11 * r10 + m12 * r20, m20 * r00 + m21 * r10 + m22 * r20, m30 * r00 + m31 * r10 + m32 * r20, m00 * r01 + m01 * r11 + m02 * r21, m10 * r01 + m11 * r11 + m12 * r21, m20 * r01 + m21 * r11 + m22 * r21, m30 * r01 + m31 * r11 + m32 * r21, m00 * r02 + m01 * r12 + m02 * r22, m10 * r02 + m11 * r12 + m12 * r22, m20 * r02 + m21 * r12 + m22 * r22, m30 * r02 + m31 * r12 + m32 * r22, m03, m13, m23, m33)
};
goog.vec.Mat4.rotateX = function(mat, angle) {
  var m01 = mat[4], m11 = mat[5], m21 = mat[6], m31 = mat[7];
  var m02 = mat[8], m12 = mat[9], m22 = mat[10], m32 = mat[11];
  var c = Math.cos(angle);
  var s = Math.sin(angle);
  mat[4] = m01 * c + m02 * s;
  mat[5] = m11 * c + m12 * s;
  mat[6] = m21 * c + m22 * s;
  mat[7] = m31 * c + m32 * s;
  mat[8] = m01 * -s + m02 * c;
  mat[9] = m11 * -s + m12 * c;
  mat[10] = m21 * -s + m22 * c;
  mat[11] = m31 * -s + m32 * c;
  return mat
};
goog.vec.Mat4.rotateY = function(mat, angle) {
  var m00 = mat[0], m10 = mat[1], m20 = mat[2], m30 = mat[3];
  var m02 = mat[8], m12 = mat[9], m22 = mat[10], m32 = mat[11];
  var c = Math.cos(angle);
  var s = Math.sin(angle);
  mat[0] = m00 * c + m02 * -s;
  mat[1] = m10 * c + m12 * -s;
  mat[2] = m20 * c + m22 * -s;
  mat[3] = m30 * c + m32 * -s;
  mat[8] = m00 * s + m02 * c;
  mat[9] = m10 * s + m12 * c;
  mat[10] = m20 * s + m22 * c;
  mat[11] = m30 * s + m32 * c;
  return mat
};
goog.vec.Mat4.rotateZ = function(mat, angle) {
  var m00 = mat[0], m10 = mat[1], m20 = mat[2], m30 = mat[3];
  var m01 = mat[4], m11 = mat[5], m21 = mat[6], m31 = mat[7];
  var c = Math.cos(angle);
  var s = Math.sin(angle);
  mat[0] = m00 * c + m01 * s;
  mat[1] = m10 * c + m11 * s;
  mat[2] = m20 * c + m21 * s;
  mat[3] = m30 * c + m31 * s;
  mat[4] = m00 * -s + m01 * c;
  mat[5] = m10 * -s + m11 * c;
  mat[6] = m20 * -s + m21 * c;
  mat[7] = m30 * -s + m31 * c;
  return mat
};
goog.vec.Mat4.getTranslation = function(mat, translation) {
  translation[0] = mat[12];
  translation[1] = mat[13];
  translation[2] = mat[14];
  return translation
};
goog.vec.Mat4.tmpVec3_ = [goog.vec.Vec3.createFloat64(), goog.vec.Vec3.createFloat64()];
goog.vec.Mat4.tmpVec4_ = [goog.vec.Vec4.createFloat64(), goog.vec.Vec4.createFloat64(), goog.vec.Vec4.createFloat64()];
goog.vec.Mat4.tmpMat4_ = [goog.vec.Mat4.createFloat64()];
goog.provide("ol.TileCoord");
goog.require("goog.array");
goog.require("ol.Coordinate");
ol.QuadKeyCharCode = {ZERO:"0".charCodeAt(0), ONE:"1".charCodeAt(0), TWO:"2".charCodeAt(0), THREE:"3".charCodeAt(0)};
ol.TileCoord = function(z, x, y) {
  goog.base(this, x, y);
  this.z = z
};
goog.inherits(ol.TileCoord, ol.Coordinate);
ol.TileCoord.createFromQuadKey = function(quadKey) {
  var z = quadKey.length, x = 0, y = 0;
  var mask = 1 << z - 1;
  var i;
  for(i = 0;i < z;++i) {
    switch(quadKey.charCodeAt(i)) {
      case ol.QuadKeyCharCode.ONE:
        x += mask;
        break;
      case ol.QuadKeyCharCode.TWO:
        y += mask;
        break;
      case ol.QuadKeyCharCode.THREE:
        x += mask;
        y += mask;
        break
    }
    mask >>= 1
  }
  return new ol.TileCoord(z, x, y)
};
ol.TileCoord.createFromString = function(str) {
  var v = str.split("/");
  v = goog.array.map(v, function(e, i, a) {
    return parseInt(e, 10)
  });
  return new ol.TileCoord(v[0], v[1], v[2])
};
ol.TileCoord.prototype.hash = function() {
  return(this.x << this.z) + this.y
};
ol.TileCoord.prototype.quadKey = function() {
  var digits = new Array(this.z);
  var mask = 1 << this.z - 1;
  var i, charCode;
  for(i = 0;i < this.z;++i) {
    charCode = ol.QuadKeyCharCode.ZERO;
    if(this.x & mask) {
      charCode += 1
    }
    if(this.y & mask) {
      charCode += 2
    }
    digits[i] = String.fromCharCode(charCode);
    mask >>= 1
  }
  return digits.join("")
};
ol.TileCoord.prototype.toString = function() {
  return[this.z, this.x, this.y].join("/")
};
goog.provide("ol.TileRange");
goog.require("goog.asserts");
goog.require("ol.Rectangle");
goog.require("ol.TileCoord");
ol.TileRange = function(minX, minY, maxX, maxY) {
  this.minX = minX;
  this.minY = minY;
  this.maxX = maxX;
  this.maxY = maxY
};
goog.inherits(ol.TileRange, ol.Rectangle);
ol.TileRange.boundingTileRange = function(var_args) {
  var tileCoord0 = arguments[0];
  var tileRange = new ol.TileRange(tileCoord0.x, tileCoord0.y, tileCoord0.x, tileCoord0.y);
  var i, tileCoord;
  for(i = 1;i < arguments.length;++i) {
    tileCoord = arguments[i];
    goog.asserts.assert(tileCoord.z == tileCoord0.z);
    tileRange.minX = Math.min(tileRange.minX, tileCoord.x);
    tileRange.minY = Math.min(tileRange.minY, tileCoord.y);
    tileRange.maxX = Math.max(tileRange.maxX, tileCoord.x);
    tileRange.maxY = Math.max(tileRange.maxY, tileCoord.y)
  }
  return tileRange
};
ol.TileRange.prototype.contains = function(tileCoord) {
  return this.minX <= tileCoord.x && tileCoord.x <= this.maxX && this.minY <= tileCoord.y && tileCoord.y <= this.maxY
};
ol.TileRange.prototype.containsTileRange = function(tileRange) {
  return this.minX <= tileRange.minX && tileRange.maxX <= this.maxX && this.minY <= tileRange.minY && tileRange.minY <= this.maxY
};
ol.TileRange.prototype.getHeight = function() {
  return this.maxY - this.minY + 1
};
ol.TileRange.prototype.getWidth = function() {
  return this.maxX - this.minX + 1
};
goog.provide("ol.Attribution");
goog.require("ol.TileRange");
ol.Attribution = function(html, opt_tileRanges) {
  this.html_ = html;
  this.tileRanges_ = opt_tileRanges || null
};
ol.Attribution.prototype.getHTML = function() {
  return this.html_
};
ol.Attribution.prototype.intersectsAnyTileRange = function(tileRanges) {
  if(goog.isNull(this.tileRanges_)) {
    return true
  }
  var i, tileRange, z;
  for(z in tileRanges) {
    if(!(z in this.tileRanges_)) {
      continue
    }
    tileRange = tileRanges[z];
    for(i = 0;i < this.tileRanges_[z].length;++i) {
      if(this.tileRanges_[z][i].intersects(tileRange)) {
        return true
      }
    }
  }
  return false
};
goog.provide("ol.Tile");
goog.provide("ol.TileState");
goog.require("goog.events");
goog.require("goog.events.EventTarget");
goog.require("goog.events.EventType");
goog.require("ol.TileCoord");
ol.TileState = {IDLE:0, LOADING:1, LOADED:2, ERROR:3};
ol.Tile = function(tileCoord) {
  goog.base(this);
  this.inQueue = 0;
  this.tileCoord = tileCoord;
  this.state = ol.TileState.IDLE
};
goog.inherits(ol.Tile, goog.events.EventTarget);
ol.Tile.prototype.dispatchChangeEvent = function() {
  this.dispatchEvent(goog.events.EventType.CHANGE)
};
ol.Tile.prototype.getImage = goog.abstractMethod;
ol.Tile.prototype.getKey = function() {
  return goog.getUid(this).toString()
};
ol.Tile.prototype.getState = function() {
  return this.state
};
ol.Tile.prototype.load = goog.abstractMethod;
goog.provide("ol.TilePriorityFunction");
goog.provide("ol.TileQueue");
goog.require("goog.events");
goog.require("goog.events.EventType");
goog.require("ol.Coordinate");
goog.require("ol.Tile");
goog.require("ol.TileState");
ol.TilePriorityFunction;
ol.TileQueue = function(tilePriorityFunction) {
  this.tilePriorityFunction_ = tilePriorityFunction;
  this.maxTilesLoading_ = 8;
  this.tilesLoading_ = 0;
  this.heap_ = [];
  this.queuedTileKeys_ = {}
};
ol.TileQueue.DROP = Infinity;
ol.TileQueue.prototype.dequeue_ = function() {
  var heap = this.heap_;
  goog.asserts.assert(heap.length > 0);
  var tile = heap[0][1];
  if(heap.length == 1) {
    heap.length = 0
  }else {
    heap[0] = heap.pop();
    this.siftUp_(0)
  }
  var tileKey = tile.getKey();
  delete this.queuedTileKeys_[tileKey];
  tile.inQueue--;
  goog.asserts.assert(tile.inQueue >= 0);
  return tile
};
ol.TileQueue.prototype.enqueue = function(tile, tileSourceKey, tileCenter) {
  if(tile.getState() != ol.TileState.IDLE) {
    return
  }
  var tileKey = tile.getKey();
  if(!(tileKey in this.queuedTileKeys_)) {
    var priority = this.tilePriorityFunction_(tile, tileSourceKey, tileCenter);
    if(priority != ol.TileQueue.DROP) {
      this.heap_.push([priority, tile, tileSourceKey, tileCenter]);
      this.queuedTileKeys_[tileKey] = true;
      this.siftDown_(0, this.heap_.length - 1);
      tile.inQueue++;
      goog.asserts.assert(tile.inQueue > 0)
    }
  }
};
ol.TileQueue.prototype.handleTileChange = function() {
  --this.tilesLoading_
};
ol.TileQueue.prototype.getLeftChildIndex_ = function(index) {
  return index * 2 + 1
};
ol.TileQueue.prototype.getRightChildIndex_ = function(index) {
  return index * 2 + 2
};
ol.TileQueue.prototype.getParentIndex_ = function(index) {
  return index - 1 >> 1
};
ol.TileQueue.prototype.heapify_ = function() {
  for(var i = (this.heap_.length >> 1) - 1;i >= 0;i--) {
    this.siftUp_(i)
  }
};
ol.TileQueue.prototype.loadMoreTiles = function() {
  var tile;
  while(this.heap_.length > 0 && this.tilesLoading_ < this.maxTilesLoading_) {
    tile = this.dequeue_();
    goog.events.listenOnce(tile, goog.events.EventType.CHANGE, this.handleTileChange, false, this);
    tile.load();
    ++this.tilesLoading_
  }
};
ol.TileQueue.prototype.siftUp_ = function(index) {
  var heap = this.heap_;
  var count = heap.length;
  var node = heap[index];
  var startIndex = index;
  while(index < count >> 1) {
    var lIndex = this.getLeftChildIndex_(index);
    var rIndex = this.getRightChildIndex_(index);
    var smallerChildIndex = rIndex < count && heap[rIndex][0] < heap[lIndex][0] ? rIndex : lIndex;
    heap[index] = heap[smallerChildIndex];
    index = smallerChildIndex
  }
  heap[index] = node;
  this.siftDown_(startIndex, index)
};
ol.TileQueue.prototype.siftDown_ = function(startIndex, index) {
  var heap = this.heap_;
  var node = heap[index];
  while(index > startIndex) {
    var parentIndex = this.getParentIndex_(index);
    if(heap[parentIndex][0] > node[0]) {
      heap[index] = heap[parentIndex];
      index = parentIndex
    }else {
      break
    }
  }
  heap[index] = node
};
ol.TileQueue.prototype.reprioritize = function() {
  var heap = this.heap_;
  var i, n = 0, node, priority, tile, tileCenter, tileKey, tileSourceKey;
  for(i = 0;i < heap.length;++i) {
    node = heap[i];
    tile = node[1];
    tileSourceKey = node[2];
    tileCenter = node[3];
    priority = this.tilePriorityFunction_(tile, tileSourceKey, tileCenter);
    if(priority == ol.TileQueue.DROP) {
      tileKey = tile.getKey();
      delete this.queuedTileKeys_[tileKey];
      tile.inQueue--;
      goog.asserts.assert(tile.inQueue >= 0);
      if(tile.inQueue === 0) {
        goog.events.removeAll(tile)
      }
    }else {
      node[0] = priority;
      heap[n++] = node
    }
  }
  heap.length = n;
  this.heapify_()
};
/*

 Latitude/longitude spherical geodesy formulae taken from
 http://www.movable-type.co.uk/scripts/latlong.html
 Licenced under CC-BY-3.0.
*/
goog.provide("ol.Sphere");
goog.require("goog.math");
goog.require("ol.Coordinate");
ol.Sphere = function(radius) {
  this.radius = radius
};
ol.Sphere.prototype.cosineDistance = function(c1, c2) {
  var lat1 = goog.math.toRadians(c1.y);
  var lat2 = goog.math.toRadians(c2.y);
  var deltaLon = goog.math.toRadians(c2.x - c1.x);
  return this.radius * Math.acos(Math.sin(lat1) * Math.sin(lat2) + Math.cos(lat1) * Math.cos(lat2) * Math.cos(deltaLon))
};
ol.Sphere.prototype.crossTrackDistance = function(c1, c2, c3) {
  var d12 = this.cosineDistance(c1, c2);
  var d13 = this.cosineDistance(c1, c2);
  var theta12 = goog.math.toRadians(this.initialBearing(c1, c2));
  var theta13 = goog.math.toRadians(this.initialBearing(c1, c3));
  return this.radius * Math.asin(Math.sin(d13 / this.radius) * Math.sin(theta13 - theta12))
};
ol.Sphere.prototype.equirectangularDistance = function(c1, c2) {
  var lat1 = goog.math.toRadians(c1.y);
  var lat2 = goog.math.toRadians(c2.y);
  var deltaLon = goog.math.toRadians(c2.x - c1.x);
  var x = deltaLon * Math.cos((lat1 + lat2) / 2);
  var y = lat2 - lat1;
  return this.radius * Math.sqrt(x * x + y * y)
};
ol.Sphere.prototype.finalBearing = function(c1, c2) {
  return(this.initialBearing(c2, c1) + 180) % 360
};
ol.Sphere.prototype.haversineDistance = function(c1, c2) {
  var lat1 = goog.math.toRadians(c1.y);
  var lat2 = goog.math.toRadians(c2.y);
  var deltaLatBy2 = (lat2 - lat1) / 2;
  var deltaLonBy2 = goog.math.toRadians(c2.x - c1.x) / 2;
  var a = Math.sin(deltaLatBy2) * Math.sin(deltaLatBy2) + Math.sin(deltaLonBy2) * Math.sin(deltaLonBy2) * Math.cos(lat1) * Math.cos(lat2);
  return 2 * this.radius * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
};
ol.Sphere.prototype.initialBearing = function(c1, c2) {
  var lat1 = goog.math.toRadians(c1.y);
  var lat2 = goog.math.toRadians(c2.y);
  var deltaLon = goog.math.toRadians(c2.x - c1.x);
  var y = Math.sin(deltaLon) * Math.cos(lat2);
  var x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(deltaLon);
  return goog.math.toDegrees(Math.atan2(y, x))
};
ol.Sphere.prototype.maximumLatitude = function(bearing, latitude) {
  return Math.cos(Math.abs(Math.sin(goog.math.toRadians(bearing)) * Math.cos(goog.math.toRadians(latitude))))
};
ol.Sphere.prototype.midpoint = function(c1, c2) {
  var lat1 = goog.math.toRadians(c1.y);
  var lat2 = goog.math.toRadians(c2.y);
  var lon1 = goog.math.toRadians(c1.x);
  var deltaLon = goog.math.toRadians(c2.x - c1.x);
  var Bx = Math.cos(lat2) * Math.cos(deltaLon);
  var By = Math.cos(lat2) * Math.sin(deltaLon);
  var cosLat1PlusBx = Math.cos(lat1) + Bx;
  var lat = Math.atan2(Math.sin(lat1) + Math.sin(lat2), Math.sqrt(cosLat1PlusBx * cosLat1PlusBx + By * By));
  var lon = lon1 + Math.atan2(By, cosLat1PlusBx);
  return new ol.Coordinate(goog.math.toDegrees(lon), goog.math.toDegrees(lat))
};
ol.Sphere.prototype.offset = function(c1, distance, bearing) {
  var lat1 = goog.math.toRadians(c1.y);
  var lon1 = goog.math.toRadians(c1.x);
  var dByR = distance / this.radius;
  var lat = Math.asin(Math.sin(lat1) * Math.cos(dByR) + Math.cos(lat1) * Math.sin(dByR) * Math.cos(bearing));
  var lon = lon1 + Math.atan2(Math.sin(bearing) * Math.sin(dByR) * Math.cos(lat1), Math.cos(dByR) - Math.sin(lat1) * Math.sin(lat));
  return new ol.Coordinate(goog.math.toDegrees(lon), goog.math.toDegrees(lat))
};
goog.provide("ol.sphere.NORMAL");
goog.require("ol.Sphere");
ol.sphere.NORMAL = new ol.Sphere(6370997);
goog.provide("ol.Projection");
goog.provide("ol.ProjectionUnits");
goog.provide("ol.projection");
goog.require("goog.array");
goog.require("goog.asserts");
goog.require("goog.object");
goog.require("ol.Coordinate");
goog.require("ol.Extent");
goog.require("ol.TransformFunction");
goog.require("ol.sphere.NORMAL");
ol.ENABLE_PROJ4JS = true;
ol.HAVE_PROJ4JS = ol.ENABLE_PROJ4JS && typeof Proj4js == "object";
ol.ProjectionUnits = {DEGREES:"degrees", FEET:"ft", METERS:"m"};
ol.Projection = function(code, units, extent, opt_axisOrientation) {
  this.code_ = code;
  this.units_ = units;
  this.extent_ = extent;
  this.axisOrientation_ = goog.isDef(opt_axisOrientation) ? opt_axisOrientation : "enu";
  this.defaultTileGrid_ = null
};
ol.Projection.prototype.getCode = function() {
  return this.code_
};
ol.Projection.prototype.getExtent = function() {
  return this.extent_
};
ol.Projection.prototype.getPointResolution = goog.abstractMethod;
ol.Projection.prototype.getUnits = function() {
  return this.units_
};
ol.Projection.prototype.getAxisOrientation = function() {
  return this.axisOrientation_
};
ol.Projection.prototype.getDefaultTileGrid = function() {
  return this.defaultTileGrid_
};
ol.Projection.prototype.setDefaultTileGrid = function(tileGrid) {
  this.defaultTileGrid_ = tileGrid
};
ol.Proj4jsProjection_ = function(code, proj4jsProj) {
  var units = proj4jsProj.units;
  goog.base(this, code, units, null, proj4jsProj.axis);
  this.proj4jsProj_ = proj4jsProj;
  this.toEPSG4326_ = null
};
goog.inherits(ol.Proj4jsProjection_, ol.Projection);
ol.Proj4jsProjection_.prototype.getPointResolution = function(resolution, point) {
  if(this.getUnits() == ol.ProjectionUnits.DEGREES) {
    return resolution
  }else {
    if(goog.isNull(this.toEPSG4326_)) {
      this.toEPSG4326_ = ol.projection.getTransform(this, ol.projection.getProj4jsProjectionFromCode_("EPSG:4326"))
    }
    var vertices = [point.x - resolution / 2, point.y, point.x + resolution / 2, point.y, point.x, point.y - resolution / 2, point.x, point.y + resolution / 2];
    vertices = this.toEPSG4326_(vertices, vertices, 2);
    var width = ol.sphere.NORMAL.haversineDistance(new ol.Coordinate(vertices[0], vertices[1]), new ol.Coordinate(vertices[2], vertices[3]));
    var height = ol.sphere.NORMAL.haversineDistance(new ol.Coordinate(vertices[4], vertices[5]), new ol.Coordinate(vertices[6], vertices[7]));
    var pointResolution = (width + height) / 2;
    if(this.getUnits() == ol.ProjectionUnits.FEET) {
      pointResolution /= 0.3048
    }
    return pointResolution
  }
};
ol.Proj4jsProjection_.prototype.getProj4jsProj = function() {
  return this.proj4jsProj_
};
ol.projection.proj4jsProjections_ = {};
ol.projection.projections_ = {};
ol.projection.transforms_ = {};
ol.projection.addEquivalentProjections = function(projections) {
  ol.projection.addProjections(projections);
  goog.array.forEach(projections, function(source) {
    goog.array.forEach(projections, function(destination) {
      if(source !== destination) {
        ol.projection.addTransform(source, destination, ol.projection.cloneTransform)
      }
    })
  })
};
ol.projection.addEquivalentTransforms = function(projections1, projections2, forwardTransform, inverseTransform) {
  goog.array.forEach(projections1, function(projection1) {
    goog.array.forEach(projections2, function(projection2) {
      ol.projection.addTransform(projection1, projection2, forwardTransform);
      ol.projection.addTransform(projection2, projection1, inverseTransform)
    })
  })
};
ol.projection.addProj4jsProjection_ = function(proj4jsProjection) {
  var proj4jsProjections = ol.projection.proj4jsProjections_;
  var code = proj4jsProjection.getCode();
  goog.asserts.assert(!goog.object.containsKey(proj4jsProjections, code));
  proj4jsProjections[code] = proj4jsProjection
};
ol.projection.addProjection = function(projection) {
  var projections = ol.projection.projections_;
  var code = projection.getCode();
  goog.asserts.assert(!goog.object.containsKey(projections, code));
  projections[code] = projection;
  ol.projection.addTransform(projection, projection, ol.projection.cloneTransform)
};
ol.projection.addProjections = function(projections) {
  goog.array.forEach(projections, function(projection) {
    ol.projection.addProjection(projection)
  })
};
ol.projection.clearAllProjections = function() {
  if(ol.ENABLE_PROJ4JS) {
    ol.projection.proj4jsProjections_ = {}
  }
  ol.projection.projections_ = {};
  ol.projection.transforms_ = {}
};
ol.projection.createProjection = function(projection, defaultCode) {
  if(!goog.isDefAndNotNull(projection)) {
    return ol.projection.getFromCode(defaultCode)
  }else {
    if(goog.isString(projection)) {
      return ol.projection.getFromCode(projection)
    }else {
      goog.asserts.assert(projection instanceof ol.Projection);
      return projection
    }
  }
};
ol.projection.addTransform = function(source, destination, transformFn) {
  var sourceCode = source.getCode();
  var destinationCode = destination.getCode();
  var transforms = ol.projection.transforms_;
  if(!goog.object.containsKey(transforms, sourceCode)) {
    transforms[sourceCode] = {}
  }
  goog.asserts.assert(!goog.object.containsKey(transforms[sourceCode], destinationCode));
  transforms[sourceCode][destinationCode] = transformFn
};
ol.projection.removeTransform = function(source, destination) {
  var sourceCode = source.getCode();
  var destinationCode = destination.getCode();
  var transforms = ol.projection.transforms_;
  goog.asserts.assert(sourceCode in transforms);
  goog.asserts.assert(destinationCode in transforms[sourceCode]);
  var transform = transforms[sourceCode][destinationCode];
  delete transforms[sourceCode][destinationCode];
  var keys = goog.object.getKeys(transforms[sourceCode]);
  if(keys.length == 0) {
    delete transforms[sourceCode]
  }
  return transform
};
ol.projection.getFromCode = function(code) {
  var projection = ol.projection.projections_[code];
  if(ol.HAVE_PROJ4JS && !goog.isDef(projection)) {
    projection = ol.projection.getProj4jsProjectionFromCode_(code)
  }
  if(!goog.isDef(projection)) {
    goog.asserts.assert(goog.isDef(projection));
    projection = null
  }
  return projection
};
ol.projection.getProj4jsProjectionFromCode_ = function(code) {
  var proj4jsProjections = ol.projection.proj4jsProjections_;
  var proj4jsProjection = proj4jsProjections[code];
  if(!goog.isDef(proj4jsProjection)) {
    var proj4jsProj = new Proj4js.Proj(code);
    proj4jsProjection = new ol.Proj4jsProjection_(code, proj4jsProj);
    proj4jsProjections[code] = proj4jsProjection
  }
  return proj4jsProjection
};
ol.projection.equivalent = function(projection1, projection2) {
  if(projection1 === projection2) {
    return true
  }else {
    if(projection1.getUnits() != projection2.getUnits()) {
      return false
    }else {
      var transformFn = ol.projection.getTransform(projection1, projection2);
      return transformFn === ol.projection.cloneTransform
    }
  }
};
ol.projection.getTransform = function(source, destination) {
  var transforms = ol.projection.transforms_;
  var sourceCode = source.getCode();
  var destinationCode = destination.getCode();
  var transform;
  if(goog.object.containsKey(transforms, sourceCode) && goog.object.containsKey(transforms[sourceCode], destinationCode)) {
    transform = transforms[sourceCode][destinationCode]
  }
  if(ol.HAVE_PROJ4JS && !goog.isDef(transform)) {
    var proj4jsSource;
    if(source instanceof ol.Proj4jsProjection_) {
      proj4jsSource = source
    }else {
      proj4jsSource = ol.projection.getProj4jsProjectionFromCode_(source.getCode())
    }
    var sourceProj4jsProj = proj4jsSource.getProj4jsProj();
    var proj4jsDestination;
    if(destination instanceof ol.Proj4jsProjection_) {
      proj4jsDestination = destination
    }else {
      proj4jsDestination = ol.projection.getProj4jsProjectionFromCode_(destination.getCode())
    }
    var destinationProj4jsProj = proj4jsDestination.getProj4jsProj();
    transform = function(input, opt_output, opt_dimension) {
      var length = input.length, dimension = opt_dimension > 1 ? opt_dimension : 2, output = opt_output;
      if(!goog.isDef(output)) {
        if(dimension > 2) {
          output = input.slice()
        }else {
          output = new Array(length)
        }
      }
      goog.asserts.assert(output.length % dimension === 0);
      var proj4jsPoint;
      for(var i = 0;i < length;i += dimension) {
        proj4jsPoint = new Proj4js.Point(input[i], input[i + 1]);
        proj4jsPoint = Proj4js.transform(sourceProj4jsProj, destinationProj4jsProj, proj4jsPoint);
        output[i] = proj4jsPoint.x;
        output[i + 1] = proj4jsPoint.y
      }
      return output
    };
    ol.projection.addTransform(source, destination, transform)
  }
  if(!goog.isDef(transform)) {
    goog.asserts.assert(goog.isDef(transform));
    transform = ol.projection.identityTransform
  }
  return transform
};
ol.projection.getTransformFromCodes = function(sourceCode, destinationCode) {
  var source = ol.projection.getFromCode(sourceCode);
  var destination = ol.projection.getFromCode(destinationCode);
  return ol.projection.getTransform(source, destination)
};
ol.projection.identityTransform = function(input, opt_output, opt_dimension) {
  if(goog.isDef(opt_output) && input !== opt_output) {
    goog.asserts.assert(false, "This should not be used internally.");
    for(var i = 0, ii = input.length;i < ii;++i) {
      opt_output[i] = input[i]
    }
    input = opt_output
  }
  return input
};
ol.projection.cloneTransform = function(input, opt_output, opt_dimension) {
  var output;
  if(goog.isDef(opt_output)) {
    for(var i = 0, ii = input.length;i < ii;++i) {
      opt_output[i] = input[i]
    }
    output = opt_output
  }else {
    output = input.slice()
  }
  return output
};
ol.projection.transform = function(point, source, destination) {
  var transformFn = ol.projection.getTransform(source, destination);
  var vertex = [point.x, point.y];
  vertex = transformFn(vertex, vertex, 2);
  return new ol.Coordinate(vertex[0], vertex[1])
};
ol.projection.transformWithCodes = function(point, sourceCode, destinationCode) {
  var transformFn = ol.projection.getTransformFromCodes(sourceCode, destinationCode);
  var vertex = [point.x, point.y];
  vertex = transformFn(vertex, vertex, 2);
  return new ol.Coordinate(vertex[0], vertex[1])
};
goog.provide("ol.IView2D");
goog.provide("ol.View2DState");
goog.require("ol.Coordinate");
goog.require("ol.Projection");
ol.View2DState;
ol.IView2D = function() {
};
ol.IView2D.prototype.getCenter = function() {
};
ol.IView2D.prototype.getProjection = function() {
};
ol.IView2D.prototype.getResolution = function() {
};
ol.IView2D.prototype.getRotation = function() {
};
ol.IView2D.prototype.getView2DState = function() {
};
goog.provide("ol.source.Source");
goog.require("goog.events.EventTarget");
goog.require("goog.events.EventType");
goog.require("goog.functions");
goog.require("ol.Attribution");
goog.require("ol.Extent");
goog.require("ol.Projection");
ol.source.SourceOptions;
ol.source.Source = function(sourceOptions) {
  goog.base(this);
  this.projection_ = goog.isDef(sourceOptions.projection) ? sourceOptions.projection : null;
  this.extent_ = goog.isDef(sourceOptions.extent) ? sourceOptions.extent : goog.isDef(sourceOptions.projection) ? sourceOptions.projection.getExtent() : null;
  this.attributions_ = goog.isDef(sourceOptions.attributions) ? sourceOptions.attributions : null
};
goog.inherits(ol.source.Source, goog.events.EventTarget);
ol.source.Source.prototype.dispatchLoadEvent = function() {
  this.dispatchEvent(goog.events.EventType.LOAD)
};
ol.source.Source.prototype.getAttributions = function() {
  return this.attributions_
};
ol.source.Source.prototype.getExtent = function() {
  return this.extent_
};
ol.source.Source.prototype.getProjection = function() {
  return this.projection_
};
ol.source.Source.prototype.getResolutions = goog.abstractMethod;
ol.source.Source.prototype.isReady = goog.functions.TRUE;
ol.source.Source.prototype.setAttributions = function(attributions) {
  this.attributions_ = attributions
};
ol.source.Source.prototype.setExtent = function(extent) {
  this.extent_ = extent
};
ol.source.Source.prototype.setProjection = function(projection) {
  this.projection_ = projection
};
goog.provide("ol.layer.Layer");
goog.provide("ol.layer.LayerProperty");
goog.provide("ol.layer.LayerState");
goog.require("goog.events");
goog.require("goog.events.EventType");
goog.require("goog.math");
goog.require("ol.Object");
goog.require("ol.source.Source");
ol.layer.LayerProperty = {BRIGHTNESS:"brightness", CONTRAST:"contrast", HUE:"hue", OPACITY:"opacity", SATURATION:"saturation", VISIBLE:"visible"};
ol.layer.LayerState;
ol.layer.Layer = function(layerOptions) {
  goog.base(this);
  this.source_ = layerOptions.source;
  this.setBrightness(goog.isDef(layerOptions.brightness) ? layerOptions.brightness : 0);
  this.setContrast(goog.isDef(layerOptions.contrast) ? layerOptions.contrast : 1);
  this.setHue(goog.isDef(layerOptions.hue) ? layerOptions.hue : 0);
  this.setOpacity(goog.isDef(layerOptions.opacity) ? layerOptions.opacity : 1);
  this.setSaturation(goog.isDef(layerOptions.saturation) ? layerOptions.saturation : 1);
  this.setVisible(goog.isDef(layerOptions.visible) ? layerOptions.visible : true);
  if(!this.source_.isReady()) {
    goog.events.listenOnce(this.source_, goog.events.EventType.LOAD, this.handleSourceLoad_, false, this)
  }
};
goog.inherits(ol.layer.Layer, ol.Object);
ol.layer.Layer.prototype.dispatchLoadEvent_ = function() {
  this.dispatchEvent(goog.events.EventType.LOAD)
};
ol.layer.Layer.prototype.getBrightness = function() {
  return this.get(ol.layer.LayerProperty.BRIGHTNESS)
};
goog.exportProperty(ol.layer.Layer.prototype, "getBrightness", ol.layer.Layer.prototype.getBrightness);
ol.layer.Layer.prototype.getContrast = function() {
  return this.get(ol.layer.LayerProperty.CONTRAST)
};
goog.exportProperty(ol.layer.Layer.prototype, "getContrast", ol.layer.Layer.prototype.getContrast);
ol.layer.Layer.prototype.getHue = function() {
  return this.get(ol.layer.LayerProperty.HUE)
};
goog.exportProperty(ol.layer.Layer.prototype, "getHue", ol.layer.Layer.prototype.getHue);
ol.layer.Layer.prototype.getLayerState = function() {
  var brightness = this.getBrightness();
  var contrast = this.getContrast();
  var hue = this.getHue();
  var opacity = this.getOpacity();
  var ready = this.isReady();
  var saturation = this.getSaturation();
  var visible = this.getVisible();
  return{brightness:goog.isDef(brightness) ? brightness : 0, contrast:goog.isDef(contrast) ? contrast : 1, hue:goog.isDef(hue) ? hue : 0, opacity:goog.isDef(opacity) ? opacity : 1, ready:ready, saturation:goog.isDef(saturation) ? saturation : 1, visible:goog.isDef(visible) ? visible : true}
};
ol.layer.Layer.prototype.getOpacity = function() {
  return this.get(ol.layer.LayerProperty.OPACITY)
};
goog.exportProperty(ol.layer.Layer.prototype, "getOpacity", ol.layer.Layer.prototype.getOpacity);
ol.layer.Layer.prototype.getSaturation = function() {
  return this.get(ol.layer.LayerProperty.SATURATION)
};
goog.exportProperty(ol.layer.Layer.prototype, "getSaturation", ol.layer.Layer.prototype.getSaturation);
ol.layer.Layer.prototype.getSource = function() {
  return this.source_
};
ol.layer.Layer.prototype.getVisible = function() {
  return this.get(ol.layer.LayerProperty.VISIBLE)
};
goog.exportProperty(ol.layer.Layer.prototype, "getVisible", ol.layer.Layer.prototype.getVisible);
ol.layer.Layer.prototype.handleSourceLoad_ = function() {
  this.dispatchLoadEvent_()
};
ol.layer.Layer.prototype.isReady = function() {
  return this.getSource().isReady()
};
ol.layer.Layer.prototype.setBrightness = function(brightness) {
  brightness = goog.math.clamp(brightness, -1, 1);
  if(brightness != this.getBrightness()) {
    this.set(ol.layer.LayerProperty.BRIGHTNESS, brightness)
  }
};
goog.exportProperty(ol.layer.Layer.prototype, "setBrightness", ol.layer.Layer.prototype.setBrightness);
ol.layer.Layer.prototype.setContrast = function(contrast) {
  contrast = Math.max(0, contrast);
  if(contrast != this.getContrast()) {
    this.set(ol.layer.LayerProperty.CONTRAST, contrast)
  }
};
goog.exportProperty(ol.layer.Layer.prototype, "setContrast", ol.layer.Layer.prototype.setContrast);
ol.layer.Layer.prototype.setHue = function(hue) {
  if(hue != this.getHue()) {
    this.set(ol.layer.LayerProperty.HUE, hue)
  }
};
goog.exportProperty(ol.layer.Layer.prototype, "setHue", ol.layer.Layer.prototype.setHue);
ol.layer.Layer.prototype.setOpacity = function(opacity) {
  opacity = goog.math.clamp(opacity, 0, 1);
  if(opacity != this.getOpacity()) {
    this.set(ol.layer.LayerProperty.OPACITY, opacity)
  }
};
goog.exportProperty(ol.layer.Layer.prototype, "setOpacity", ol.layer.Layer.prototype.setOpacity);
ol.layer.Layer.prototype.setSaturation = function(saturation) {
  saturation = Math.max(0, saturation);
  if(saturation != this.getSaturation()) {
    this.set(ol.layer.LayerProperty.SATURATION, saturation)
  }
};
goog.exportProperty(ol.layer.Layer.prototype, "setSaturation", ol.layer.Layer.prototype.setSaturation);
ol.layer.Layer.prototype.setVisible = function(visible) {
  visible = !!visible;
  if(visible != this.getVisible()) {
    this.set(ol.layer.LayerProperty.VISIBLE, visible)
  }
};
goog.exportProperty(ol.layer.Layer.prototype, "setVisible", ol.layer.Layer.prototype.setVisible);
goog.provide("ol.FrameState");
goog.provide("ol.PostRenderFunction");
goog.provide("ol.PreRenderFunction");
goog.require("goog.vec.Mat4");
goog.require("ol.Attribution");
goog.require("ol.Color");
goog.require("ol.Extent");
goog.require("ol.Size");
goog.require("ol.TileQueue");
goog.require("ol.TileRange");
goog.require("ol.View2DState");
goog.require("ol.layer.Layer");
goog.require("ol.layer.LayerState");
ol.FrameState;
ol.PostRenderFunction;
ol.PreRenderFunction;
goog.provide("ol.IView3D");
ol.IView3D = function() {
};
goog.provide("ol.IView");
goog.require("ol.IView2D");
goog.require("ol.IView3D");
ol.IView = function() {
};
ol.IView.prototype.getView2D = function() {
};
ol.IView.prototype.getView3D = function() {
};
goog.provide("goog.fx.easing");
goog.fx.easing.easeIn = function(t) {
  return t * t * t
};
goog.fx.easing.easeOut = function(t) {
  return 1 - Math.pow(1 - t, 3)
};
goog.fx.easing.inAndOut = function(t) {
  return 3 * t * t - 2 * t * t * t
};
goog.provide("ol.View");
goog.provide("ol.ViewHint");
goog.require("goog.array");
goog.require("ol.IView");
goog.require("ol.Object");
ol.ViewHint = {ANIMATING:0, INTERACTING:1};
ol.View = function() {
  goog.base(this);
  this.hints_ = [0, 0]
};
goog.inherits(ol.View, ol.Object);
ol.View.prototype.getHints = function() {
  return goog.array.clone(this.hints_)
};
ol.View.prototype.getView2D = goog.abstractMethod;
ol.View.prototype.getView3D = goog.abstractMethod;
ol.View.prototype.setHint = function(hint, delta) {
  goog.asserts.assert(0 <= hint && hint < this.hints_.length);
  this.hints_[hint] += delta;
  goog.asserts.assert(this.hints_[hint] >= 0)
};
goog.provide("ol.easing");
ol.easing.linear = function(t) {
  return t
};
ol.easing.upAndDown = function(t) {
  if(t < 0.5) {
    return goog.fx.easing.inAndOut(2 * t)
  }else {
    return 1 - goog.fx.easing.inAndOut(2 * (t - 0.5))
  }
};
ol.easing.elastic = function(t) {
  return Math.pow(2, -10 * t) * Math.sin((t - 0.075) * 2 * Math.PI / 0.3) + 1
};
ol.easing.bounce = function(t) {
  var s = 7.5625, p = 2.75, l;
  if(t < 1 / p) {
    l = s * t * t
  }else {
    if(t < 2 / p) {
      t -= 1.5 / p;
      l = s * t * t + 0.75
    }else {
      if(t < 2.5 / p) {
        t -= 2.25 / p;
        l = s * t * t + 0.9375
      }else {
        t -= 2.625 / p;
        l = s * t * t + 0.984375
      }
    }
  }
  return l
};
goog.provide("ol.animation");
goog.require("goog.fx.easing");
goog.require("ol.PreRenderFunction");
goog.require("ol.ViewHint");
goog.require("ol.easing");
ol.animation.bounce = function(options) {
  var resolution = options.resolution;
  var start = goog.isDef(options.start) ? options.start : goog.now();
  var duration = goog.isDef(options.duration) ? options.duration : 1E3;
  var easing = goog.isDef(options.easing) ? options.easing : ol.easing.upAndDown;
  return function(map, frameState) {
    if(frameState.time < start) {
      frameState.animate = true;
      frameState.viewHints[ol.ViewHint.ANIMATING] += 1;
      return true
    }else {
      if(frameState.time < start + duration) {
        var delta = easing((frameState.time - start) / duration);
        var deltaResolution = resolution - frameState.view2DState.resolution;
        frameState.animate = true;
        frameState.view2DState.resolution += delta * deltaResolution;
        frameState.viewHints[ol.ViewHint.ANIMATING] += 1;
        return true
      }else {
        return false
      }
    }
  }
};
ol.animation.pan = function(options) {
  var source = options.source;
  var start = goog.isDef(options.start) ? options.start : goog.now();
  var sourceX = source.x;
  var sourceY = source.y;
  var duration = goog.isDef(options.duration) ? options.duration : 1E3;
  var easing = goog.isDef(options.easing) ? options.easing : goog.fx.easing.inAndOut;
  return function(map, frameState) {
    if(frameState.time < start) {
      frameState.animate = true;
      frameState.viewHints[ol.ViewHint.ANIMATING] += 1;
      return true
    }else {
      if(frameState.time < start + duration) {
        var delta = 1 - easing((frameState.time - start) / duration);
        var deltaX = sourceX - frameState.view2DState.center.x;
        var deltaY = sourceY - frameState.view2DState.center.y;
        frameState.animate = true;
        frameState.view2DState.center.x += delta * deltaX;
        frameState.view2DState.center.y += delta * deltaY;
        frameState.viewHints[ol.ViewHint.ANIMATING] += 1;
        return true
      }else {
        return false
      }
    }
  }
};
ol.animation.rotate = function(options) {
  var sourceRotation = options.rotation;
  var start = goog.isDef(options.start) ? options.start : goog.now();
  var duration = goog.isDef(options.duration) ? options.duration : 1E3;
  var easing = goog.isDef(options.easing) ? options.easing : goog.fx.easing.inAndOut;
  return function(map, frameState) {
    if(frameState.time < start) {
      frameState.animate = true;
      frameState.viewHints[ol.ViewHint.ANIMATING] += 1;
      return true
    }else {
      if(frameState.time < start + duration) {
        var delta = 1 - easing((frameState.time - start) / duration);
        var deltaRotation = sourceRotation - frameState.view2DState.rotation;
        frameState.animate = true;
        frameState.view2DState.rotation += delta * deltaRotation;
        frameState.viewHints[ol.ViewHint.ANIMATING] += 1;
        return true
      }else {
        return false
      }
    }
  }
};
ol.animation.zoom = function(options) {
  var sourceResolution = options.resolution;
  var start = goog.isDef(options.start) ? options.start : goog.now();
  var duration = goog.isDef(options.duration) ? options.duration : 1E3;
  var easing = goog.isDef(options.easing) ? options.easing : ol.easing.linear;
  return function(map, frameState) {
    if(frameState.time < start) {
      frameState.animate = true;
      frameState.viewHints[ol.ViewHint.ANIMATING] += 1;
      return true
    }else {
      if(frameState.time < start + duration) {
        var delta = 1 - easing((frameState.time - start) / duration);
        var deltaResolution = sourceResolution - frameState.view2DState.resolution;
        frameState.animate = true;
        frameState.view2DState.resolution += delta * deltaResolution;
        frameState.viewHints[ol.ViewHint.ANIMATING] += 1;
        return true
      }else {
        return false
      }
    }
  }
};
goog.provide("ol.Kinetic");
goog.require("ol.Coordinate");
goog.require("ol.PreRenderFunction");
goog.require("ol.animation");
ol.KineticPoint;
ol.Kinetic = function(decay, minVelocity, delay) {
  this.decay_ = decay;
  this.minVelocity_ = minVelocity;
  this.delay_ = delay;
  this.points_ = [];
  this.angle_ = 0;
  this.initialVelocity_ = 0
};
ol.Kinetic.prototype.begin = function() {
  this.points_.length = 0;
  this.angle_ = 0;
  this.initialVelocity_ = 0
};
ol.Kinetic.prototype.update = function(x, y) {
  this.points_.push({x:x, y:y, t:goog.now()})
};
ol.Kinetic.prototype.end = function() {
  var now = goog.now();
  var lastIndex = this.points_.length - 1;
  var firstIndex = lastIndex - 1;
  while(firstIndex >= 0 && this.points_[firstIndex].t > now - this.delay_) {
    firstIndex--
  }
  if(firstIndex >= 0) {
    var first = this.points_[firstIndex];
    var last = this.points_[lastIndex];
    var dx = last.x - first.x;
    var dy = last.y - first.y;
    this.angle_ = Math.atan2(dy, dx);
    this.initialVelocity_ = Math.sqrt(dx * dx + dy * dy) / (last.t - first.t);
    return this.initialVelocity_ > this.minVelocity_
  }
  return false
};
ol.Kinetic.prototype.pan = function(source) {
  var decay = this.decay_;
  var initialVelocity = this.initialVelocity_;
  var minVelocity = this.minVelocity_;
  var duration = this.getDuration_();
  var easingFunction = function(t) {
    return initialVelocity * (Math.exp(decay * t * duration) - 1) / (minVelocity - initialVelocity)
  };
  return ol.animation.pan({source:source, duration:duration, easing:easingFunction})
};
ol.Kinetic.prototype.getDuration_ = function() {
  return Math.log(this.minVelocity_ / this.initialVelocity_) / this.decay_
};
ol.Kinetic.prototype.getDistance = function() {
  return(this.minVelocity_ - this.initialVelocity_) / this.decay_
};
ol.Kinetic.prototype.getAngle = function() {
  return this.angle_
};
goog.provide("ol.MapEvent");
goog.provide("ol.MapEventType");
goog.require("goog.events.Event");
goog.require("ol.FrameState");
ol.MapEventType = {POSTRENDER:"postrender"};
ol.MapEvent = function(type, map, opt_frameState) {
  goog.base(this, type);
  this.map = map;
  this.defaultPrevented = false;
  this.frameState = goog.isDef(opt_frameState) ? opt_frameState : null
};
goog.inherits(ol.MapEvent, goog.events.Event);
ol.MapEvent.prototype.preventDefault = function() {
  goog.base(this, "preventDefault");
  this.defaultPrevented = true
};
goog.provide("ol.Pixel");
goog.require("goog.math.Coordinate");
ol.Pixel = function(x, y) {
  goog.base(this, x, y)
};
goog.inherits(ol.Pixel, goog.math.Coordinate);
goog.provide("ol.MapBrowserEvent");
goog.provide("ol.MapBrowserEvent.EventType");
goog.provide("ol.MapBrowserEventHandler");
goog.require("goog.array");
goog.require("goog.events.BrowserEvent");
goog.require("goog.events.EventTarget");
goog.require("goog.events.EventType");
goog.require("goog.style");
goog.require("ol.BrowserFeature");
goog.require("ol.Coordinate");
goog.require("ol.FrameState");
goog.require("ol.MapEvent");
goog.require("ol.Pixel");
ol.MapBrowserEvent = function(type, map, browserEvent, opt_frameState) {
  goog.base(this, type, map, opt_frameState);
  this.browserEvent = browserEvent;
  this.coordinate_ = null;
  this.pixel_ = null
};
goog.inherits(ol.MapBrowserEvent, ol.MapEvent);
ol.MapBrowserEvent.IEEventType = {MSPOINTERDOWN:"MSPointerDown", MSPOINTERMOVE:"MSPointerMove", MSPOINTERUP:"MSPointerUp"};
ol.MapBrowserEvent.prototype.getCoordinate = function() {
  if(goog.isNull(this.coordinate_)) {
    this.coordinate_ = this.map.getCoordinateFromPixel(this.getPixel())
  }
  return this.coordinate_
};
ol.MapBrowserEvent.prototype.getPixel = function() {
  if(goog.isNull(this.pixel_)) {
    var eventPosition = goog.style.getRelativePosition(this.browserEvent, this.map.getViewport());
    this.pixel_ = new ol.Pixel(eventPosition.x, eventPosition.y)
  }
  return this.pixel_
};
ol.MapBrowserEvent.prototype.isMouseActionButton = function() {
  return ol.BrowserFeature.HAS_TOUCH || this.browserEvent.isMouseActionButton()
};
ol.MapBrowserEventHandler = function(map) {
  this.map_ = map;
  this.previous_ = null;
  this.dragged_ = false;
  this.timestamp_ = null;
  this.clickListenerKey_ = null;
  this.downListenerKey_ = null;
  this.dragListenerKeys_ = null;
  this.touchListenerKeys_ = null;
  this.down_ = null;
  var element = this.map_.getViewport();
  this.clickListenerKey_ = goog.events.listen(element, [goog.events.EventType.CLICK, goog.events.EventType.DBLCLICK], this.click_, false, this);
  this.downListenerKey_ = goog.events.listen(element, goog.events.EventType.MOUSEDOWN, this.handleMouseDown_, false, this);
  this.touchListenerKeys_ = [goog.events.listen(element, [goog.events.EventType.TOUCHSTART, ol.MapBrowserEvent.IEEventType.MSPOINTERDOWN], this.handleTouchStart_, false, this), goog.events.listen(element, [goog.events.EventType.TOUCHMOVE, ol.MapBrowserEvent.IEEventType.MSPOINTERMOVE], this.handleTouchMove_, false, this), goog.events.listen(element, [goog.events.EventType.TOUCHEND, ol.MapBrowserEvent.IEEventType.MSPOINTERUP], this.handleTouchEnd_, false, this)]
};
goog.inherits(ol.MapBrowserEventHandler, goog.events.EventTarget);
ol.MapBrowserEventHandler.prototype.click_ = function(browserEvent) {
  if(!this.dragged_) {
    var newEvent;
    var type = browserEvent.type;
    if(this.timestamp_ == 0 || type == goog.events.EventType.DBLCLICK) {
      newEvent = new ol.MapBrowserEvent(ol.MapBrowserEvent.EventType.DBLCLICK, this.map_, browserEvent);
      this.dispatchEvent(newEvent)
    }else {
      newEvent = new ol.MapBrowserEvent(ol.MapBrowserEvent.EventType.CLICK, this.map_, browserEvent);
      this.dispatchEvent(newEvent)
    }
  }
};
ol.MapBrowserEventHandler.prototype.handleMouseUp_ = function(browserEvent) {
  if(this.previous_) {
    this.down_ = null;
    goog.array.forEach(this.dragListenerKeys_, goog.events.unlistenByKey);
    this.dragListenerKeys_ = null;
    this.previous_ = null;
    if(this.dragged_) {
      var newEvent = new ol.MapBrowserEvent(ol.MapBrowserEvent.EventType.DRAGEND, this.map_, browserEvent);
      this.dispatchEvent(newEvent)
    }
  }
};
ol.MapBrowserEventHandler.prototype.handleMouseDown_ = function(browserEvent) {
  var newEvent = new ol.MapBrowserEvent(ol.MapBrowserEvent.EventType.DOWN, this.map_, browserEvent);
  this.dispatchEvent(newEvent);
  if(!this.previous_) {
    this.down_ = browserEvent;
    this.previous_ = {clientX:browserEvent.clientX, clientY:browserEvent.clientY};
    this.dragged_ = false;
    this.dragListenerKeys_ = [goog.events.listen(document, goog.events.EventType.MOUSEMOVE, this.handleMouseMove_, false, this), goog.events.listen(document, goog.events.EventType.MOUSEUP, this.handleMouseUp_, false, this)];
    browserEvent.preventDefault()
  }
};
ol.MapBrowserEventHandler.prototype.handleMouseMove_ = function(browserEvent) {
  var newEvent;
  if(!this.dragged_) {
    this.dragged_ = true;
    newEvent = new ol.MapBrowserEvent(ol.MapBrowserEvent.EventType.DRAGSTART, this.map_, this.down_);
    this.dispatchEvent(newEvent)
  }
  this.previous_ = {clientX:browserEvent.clientX, clientY:browserEvent.clientY};
  newEvent = new ol.MapBrowserEvent(ol.MapBrowserEvent.EventType.DRAG, this.map_, browserEvent);
  this.dispatchEvent(newEvent)
};
ol.MapBrowserEventHandler.prototype.handleTouchStart_ = function(browserEvent) {
  browserEvent.preventDefault();
  this.down_ = browserEvent;
  this.dragged_ = false;
  var newEvent = new ol.MapBrowserEvent(ol.MapBrowserEvent.EventType.TOUCHSTART, this.map_, browserEvent);
  this.dispatchEvent(newEvent)
};
ol.MapBrowserEventHandler.prototype.handleTouchMove_ = function(browserEvent) {
  this.dragged_ = true;
  var newEvent = new ol.MapBrowserEvent(ol.MapBrowserEvent.EventType.TOUCHMOVE, this.map_, browserEvent);
  this.dispatchEvent(newEvent)
};
ol.MapBrowserEventHandler.prototype.handleTouchEnd_ = function(browserEvent) {
  var newEvent = new ol.MapBrowserEvent(ol.MapBrowserEvent.EventType.TOUCHEND, this.map_, browserEvent);
  this.dispatchEvent(newEvent);
  if(!this.dragged_) {
    var now = goog.now();
    if(!this.timestamp_ || now - this.timestamp_ > 250) {
      this.timestamp_ = now
    }else {
      this.timestamp_ = 0
    }
    this.click_(this.down_)
  }
  this.down_ = null
};
ol.MapBrowserEventHandler.prototype.disposeInternal = function() {
  goog.events.unlistenByKey(this.clickListenerKey_);
  goog.events.unlistenByKey(this.downListenerKey_);
  if(!goog.isNull(this.dragListenerKeys_)) {
    goog.array.forEach(this.dragListenerKeys_, goog.events.unlistenByKey);
    this.dragListenerKeys_ = null
  }
  if(!goog.isNull(this.touchListenerKeys_)) {
    goog.array.forEach(this.touchListenerKeys_, goog.events.unlistenByKey);
    this.touchListenerKeys_ = null
  }
  goog.base(this, "disposeInternal")
};
ol.MapBrowserEvent.EventType = {CLICK:goog.events.EventType.CLICK, DBLCLICK:goog.events.EventType.DBLCLICK, DOWN:"down", DRAGSTART:"dragstart", DRAG:"drag", DRAGEND:"dragend", TOUCHSTART:goog.events.EventType.TOUCHSTART, TOUCHMOVE:goog.events.EventType.TOUCHMOVE, TOUCHEND:goog.events.EventType.TOUCHEND};
goog.provide("ol.array");
goog.require("goog.array");
ol.array.binaryFindNearest = function(arr, target) {
  var index = goog.array.binarySearch(arr, target, function(a, b) {
    return b - a
  });
  if(index >= 0) {
    return index
  }else {
    if(index == -1) {
      return 0
    }else {
      if(index == -arr.length - 1) {
        return arr.length - 1
      }else {
        var left = -index - 2;
        var right = -index - 1;
        if(arr[left] - target < target - arr[right]) {
          return left
        }else {
          return right
        }
      }
    }
  }
};
ol.array.linearFindNearest = function(arr, target) {
  var n = arr.length;
  if(arr[0] <= target) {
    return 0
  }else {
    if(target <= arr[n - 1]) {
      return n - 1
    }else {
      var i;
      for(i = 1;i < n;++i) {
        if(arr[i] == target) {
          return i
        }else {
          if(arr[i] < target) {
            if(arr[i - 1] - target < target - arr[i]) {
              return i - 1
            }else {
              return i
            }
          }
        }
      }
      return n - 1
    }
  }
};
goog.provide("ol.ResolutionConstraint");
goog.provide("ol.ResolutionConstraintType");
goog.require("goog.math");
goog.require("ol.array");
ol.ResolutionConstraintType;
ol.ResolutionConstraint.createContinuous = function(power, maxResolution, opt_minResolution) {
  var minResolution = opt_minResolution || 0;
  return function(resolution, delta) {
    if(goog.isDef(resolution)) {
      resolution /= Math.pow(power, delta);
      return goog.math.clamp(resolution, minResolution, maxResolution)
    }else {
      return undefined
    }
  }
};
ol.ResolutionConstraint.createSnapToResolutions = function(resolutions) {
  return function(resolution, delta) {
    if(goog.isDef(resolution)) {
      var z = ol.array.linearFindNearest(resolutions, resolution);
      z = goog.math.clamp(z + delta, 0, resolutions.length - 1);
      return resolutions[z]
    }else {
      return undefined
    }
  }
};
ol.ResolutionConstraint.createSnapToPower = function(power, maxResolution, opt_maxLevel) {
  return function(resolution, delta) {
    if(goog.isDef(resolution)) {
      var oldLevel = Math.floor(Math.log(maxResolution / resolution) / Math.log(power) + 0.5);
      var newLevel = Math.max(oldLevel + delta, 0);
      if(goog.isDef(opt_maxLevel)) {
        newLevel = Math.min(newLevel, opt_maxLevel)
      }
      return maxResolution / Math.pow(power, newLevel)
    }else {
      return undefined
    }
  }
};
goog.provide("ol.RotationConstraint");
goog.provide("ol.RotationConstraintType");
ol.RotationConstraintType;
ol.RotationConstraint.none = function(rotation, delta) {
  if(goog.isDef(rotation)) {
    return rotation + delta
  }else {
    return undefined
  }
};
ol.RotationConstraint.createSnapToN = function(n) {
  var theta = 2 * Math.PI / n;
  return function(rotation, delta) {
    if(goog.isDef(rotation)) {
      rotation = Math.floor((rotation + delta) / theta + 0.5) * theta;
      return rotation
    }else {
      return undefined
    }
  }
};
ol.RotationConstraint.createSnapToZero = function(opt_tolerance) {
  var tolerance = opt_tolerance || 0.1;
  return function(rotation, delta) {
    if(goog.isDef(rotation)) {
      if(Math.abs(rotation + delta) <= tolerance) {
        return 0
      }else {
        return rotation + delta
      }
    }else {
      return undefined
    }
  }
};
goog.provide("ol.Constraints");
goog.require("ol.ResolutionConstraintType");
goog.require("ol.RotationConstraintType");
ol.Constraints = function(resolutionConstraint, rotationConstraint) {
  this.resolution = resolutionConstraint;
  this.rotation = rotationConstraint
};
goog.provide("ol.View2D");
goog.provide("ol.View2DProperty");
goog.require("goog.fx.easing");
goog.require("ol.Constraints");
goog.require("ol.Coordinate");
goog.require("ol.Extent");
goog.require("ol.IView2D");
goog.require("ol.IView3D");
goog.require("ol.Projection");
goog.require("ol.ResolutionConstraint");
goog.require("ol.RotationConstraint");
goog.require("ol.Size");
goog.require("ol.View");
goog.require("ol.animation");
goog.require("ol.projection");
ol.View2DProperty = {CENTER:"center", PROJECTION:"projection", RESOLUTION:"resolution", ROTATION:"rotation"};
ol.View2D = function(opt_view2DOptions) {
  goog.base(this);
  var view2DOptions = opt_view2DOptions || {};
  var values = {};
  values[ol.View2DProperty.CENTER] = goog.isDef(view2DOptions.center) ? view2DOptions.center : null;
  values[ol.View2DProperty.PROJECTION] = ol.projection.createProjection(view2DOptions.projection, "EPSG:3857");
  if(goog.isDef(view2DOptions.resolution)) {
    values[ol.View2DProperty.RESOLUTION] = view2DOptions.resolution
  }else {
    if(goog.isDef(view2DOptions.zoom)) {
      var projectionExtent = values[ol.View2DProperty.PROJECTION].getExtent();
      var size = Math.max(projectionExtent.maxX - projectionExtent.minX, projectionExtent.maxY - projectionExtent.minY);
      values[ol.View2DProperty.RESOLUTION] = size / (ol.DEFAULT_TILE_SIZE * Math.pow(2, view2DOptions.zoom))
    }
  }
  values[ol.View2DProperty.ROTATION] = view2DOptions.rotation;
  this.setValues(values);
  this.constraints_ = ol.View2D.createConstraints_(view2DOptions)
};
goog.inherits(ol.View2D, ol.View);
ol.View2D.prototype.getCenter = function() {
  return this.get(ol.View2DProperty.CENTER)
};
goog.exportProperty(ol.View2D.prototype, "getCenter", ol.View2D.prototype.getCenter);
ol.View2D.prototype.getExtent = function(size) {
  goog.asserts.assert(this.isDef());
  var center = this.getCenter();
  var resolution = this.getResolution();
  var minX = center.x - resolution * size.width / 2;
  var minY = center.y - resolution * size.height / 2;
  var maxX = center.x + resolution * size.width / 2;
  var maxY = center.y + resolution * size.height / 2;
  return new ol.Extent(minX, minY, maxX, maxY)
};
ol.View2D.prototype.getProjection = function() {
  return this.get(ol.View2DProperty.PROJECTION)
};
goog.exportProperty(ol.View2D.prototype, "getProjection", ol.View2D.prototype.getProjection);
ol.View2D.prototype.getResolution = function() {
  return this.get(ol.View2DProperty.RESOLUTION)
};
goog.exportProperty(ol.View2D.prototype, "getResolution", ol.View2D.prototype.getResolution);
ol.View2D.prototype.getResolutionForExtent = function(extent, size) {
  var xResolution = (extent.maxX - extent.minX) / size.width;
  var yResolution = (extent.maxY - extent.minY) / size.height;
  return Math.max(xResolution, yResolution)
};
ol.View2D.prototype.getRotation = function() {
  return this.get(ol.View2DProperty.ROTATION) || 0
};
goog.exportProperty(ol.View2D.prototype, "getRotation", ol.View2D.prototype.getRotation);
ol.View2D.prototype.getView2D = function() {
  return this
};
ol.View2D.prototype.getView2DState = function() {
  goog.asserts.assert(this.isDef());
  var center = this.getCenter();
  var projection = this.getProjection();
  var resolution = this.getResolution();
  var rotation = this.getRotation();
  return{center:new ol.Coordinate(center.x, center.y), projection:projection, resolution:resolution, rotation:rotation}
};
ol.View2D.prototype.getView3D = function() {
};
ol.View2D.prototype.fitExtent = function(extent, size) {
  this.setCenter(extent.getCenter());
  var resolution = this.getResolutionForExtent(extent, size);
  resolution = this.constraints_.resolution(resolution, 0);
  this.setResolution(resolution)
};
ol.View2D.prototype.isDef = function() {
  return goog.isDefAndNotNull(this.getCenter()) && goog.isDef(this.getResolution())
};
ol.View2D.prototype.setCenter = function(center) {
  this.set(ol.View2DProperty.CENTER, center)
};
goog.exportProperty(ol.View2D.prototype, "setCenter", ol.View2D.prototype.setCenter);
ol.View2D.prototype.setProjection = function(projection) {
  this.set(ol.View2DProperty.PROJECTION, projection)
};
goog.exportProperty(ol.View2D.prototype, "setProjection", ol.View2D.prototype.setProjection);
ol.View2D.prototype.setResolution = function(resolution) {
  this.set(ol.View2DProperty.RESOLUTION, resolution)
};
goog.exportProperty(ol.View2D.prototype, "setResolution", ol.View2D.prototype.setResolution);
ol.View2D.prototype.setRotation = function(rotation) {
  this.set(ol.View2DProperty.ROTATION, rotation)
};
goog.exportProperty(ol.View2D.prototype, "setRotation", ol.View2D.prototype.setRotation);
ol.View2D.prototype.rotate = function(map, rotation, opt_anchor, opt_duration) {
  rotation = this.constraints_.rotation(rotation, 0);
  this.rotateWithoutConstraints(map, rotation, opt_anchor, opt_duration)
};
ol.View2D.prototype.rotateWithoutConstraints = function(map, rotation, opt_anchor, opt_duration) {
  if(goog.isDefAndNotNull(rotation)) {
    var currentRotation = this.getRotation();
    var currentCenter = this.getCenter();
    if(goog.isDef(currentRotation) && goog.isDef(currentCenter) && goog.isDef(opt_duration)) {
      map.requestRenderFrame();
      map.addPreRenderFunction(ol.animation.rotate({rotation:currentRotation, duration:opt_duration, easing:goog.fx.easing.easeOut}));
      if(goog.isDef(opt_anchor)) {
        map.addPreRenderFunction(ol.animation.pan({source:currentCenter, duration:opt_duration, easing:goog.fx.easing.easeOut}))
      }
    }
    if(goog.isDefAndNotNull(opt_anchor)) {
      var anchor = opt_anchor;
      var oldCenter = this.getCenter();
      var center = new ol.Coordinate(oldCenter.x - anchor.x, oldCenter.y - anchor.y);
      center.rotate(rotation - this.getRotation());
      center.x += anchor.x;
      center.y += anchor.y;
      map.withFrozenRendering(function() {
        this.setCenter(center);
        this.setRotation(rotation)
      }, this)
    }else {
      this.setRotation(rotation)
    }
  }
};
ol.View2D.prototype.zoom = function(map, resolution, opt_anchor, opt_duration) {
  resolution = this.constraints_.resolution(resolution, 0);
  this.zoomWithoutConstraints(map, resolution, opt_anchor, opt_duration)
};
ol.View2D.prototype.zoomByDelta = function(map, delta, opt_anchor, opt_duration) {
  var currentResolution = this.getResolution();
  var resolution = this.constraints_.resolution(currentResolution, delta);
  this.zoomWithoutConstraints(map, resolution, opt_anchor, opt_duration)
};
ol.View2D.prototype.zoomWithoutConstraints = function(map, resolution, opt_anchor, opt_duration) {
  if(goog.isDefAndNotNull(resolution)) {
    var currentResolution = this.getResolution();
    var currentCenter = this.getCenter();
    if(goog.isDef(currentResolution) && goog.isDef(currentCenter) && goog.isDef(opt_duration)) {
      map.requestRenderFrame();
      map.addPreRenderFunction(ol.animation.zoom({resolution:currentResolution, duration:opt_duration, easing:goog.fx.easing.easeOut}));
      if(goog.isDef(opt_anchor)) {
        map.addPreRenderFunction(ol.animation.pan({source:currentCenter, duration:opt_duration, easing:goog.fx.easing.easeOut}))
      }
    }
    if(goog.isDefAndNotNull(opt_anchor)) {
      var anchor = opt_anchor;
      var oldCenter = this.getCenter();
      var oldResolution = this.getResolution();
      var x = anchor.x - resolution * (anchor.x - oldCenter.x) / oldResolution;
      var y = anchor.y - resolution * (anchor.y - oldCenter.y) / oldResolution;
      var center = new ol.Coordinate(x, y);
      map.withFrozenRendering(function() {
        this.setCenter(center);
        this.setResolution(resolution)
      }, this)
    }else {
      this.setResolution(resolution)
    }
  }
};
ol.View2D.createConstraints_ = function(view2DOptions) {
  var resolutionConstraint;
  if(goog.isDef(view2DOptions.resolutions)) {
    resolutionConstraint = ol.ResolutionConstraint.createSnapToResolutions(view2DOptions.resolutions)
  }else {
    var maxResolution, numZoomLevels, zoomFactor;
    if(goog.isDef(view2DOptions.maxResolution) && goog.isDef(view2DOptions.numZoomLevels) && goog.isDef(view2DOptions.zoomFactor)) {
      maxResolution = view2DOptions.maxResolution;
      numZoomLevels = view2DOptions.numZoomLevels;
      zoomFactor = view2DOptions.zoomFactor
    }else {
      var projectionExtent = ol.projection.createProjection(view2DOptions.projection, "EPSG:3857").getExtent();
      maxResolution = Math.max(projectionExtent.maxX - projectionExtent.minX, projectionExtent.maxY - projectionExtent.minY) / ol.DEFAULT_TILE_SIZE;
      numZoomLevels = 29;
      zoomFactor = 2
    }
    resolutionConstraint = ol.ResolutionConstraint.createSnapToPower(zoomFactor, maxResolution, numZoomLevels - 1)
  }
  var rotationConstraint = ol.RotationConstraint.createSnapToZero();
  return new ol.Constraints(resolutionConstraint, rotationConstraint)
};
goog.provide("ol.control.Control");
goog.provide("ol.control.ControlOptions");
goog.require("goog.Disposable");
ol.control.ControlOptions;
ol.control.Control = function(controlOptions) {
  goog.base(this);
  this.element = goog.isDef(controlOptions.element) ? controlOptions.element : null;
  this.target_ = controlOptions.target;
  this.map_ = null;
  if(goog.isDef(controlOptions.map)) {
    this.setMap(controlOptions.map)
  }
};
goog.inherits(ol.control.Control, goog.Disposable);
ol.control.Control.prototype.disposeInternal = function() {
  goog.dom.removeNode(this.element);
  goog.base(this, "disposeInternal")
};
ol.control.Control.prototype.getMap = function() {
  return this.map_
};
ol.control.Control.prototype.setMap = function(map) {
  if(!goog.isNull(this.map_)) {
    goog.dom.removeNode(this.element)
  }
  this.map_ = map;
  if(!goog.isNull(this.map_)) {
    var target = goog.isDef(this.target_) ? this.target_ : map.getOverlayContainer();
    goog.dom.appendChild(target, this.element)
  }
};
goog.provide("ol.control.Attribution");
goog.require("goog.array");
goog.require("goog.dom");
goog.require("goog.dom.TagName");
goog.require("goog.events");
goog.require("goog.object");
goog.require("goog.style");
goog.require("ol.Attribution");
goog.require("ol.FrameState");
goog.require("ol.MapEvent");
goog.require("ol.MapEventType");
goog.require("ol.TileRange");
goog.require("ol.control.Control");
goog.require("ol.source.Source");
ol.control.Attribution = function(attributionOptions) {
  this.ulElement_ = goog.dom.createElement(goog.dom.TagName.UL);
  var element = goog.dom.createDom(goog.dom.TagName.DIV, {"class":"ol-attribution ol-unselectable"}, this.ulElement_);
  goog.base(this, {element:element, map:attributionOptions.map, target:attributionOptions.target});
  this.renderedVisible_ = true;
  this.attributionElements_ = {};
  this.attributionElementRenderedVisible_ = {};
  this.listenerKeys_ = null
};
goog.inherits(ol.control.Attribution, ol.control.Control);
ol.control.Attribution.prototype.getTileSourceAttributions = function(usedTiles, sources) {
  var attributions = {};
  var i, tileRanges, tileSource, tileSourceAttribution, tileSourceAttributionKey, tileSourceAttributions, tileSourceKey, z;
  for(tileSourceKey in usedTiles) {
    goog.asserts.assert(tileSourceKey in sources);
    tileSource = sources[tileSourceKey];
    tileSourceAttributions = tileSource.getAttributions();
    if(goog.isNull(tileSourceAttributions)) {
      continue
    }
    tileRanges = usedTiles[tileSourceKey];
    for(i = 0;i < tileSourceAttributions.length;++i) {
      tileSourceAttribution = tileSourceAttributions[i];
      tileSourceAttributionKey = goog.getUid(tileSourceAttribution).toString();
      if(tileSourceAttributionKey in attributions) {
        continue
      }
      if(tileSourceAttribution.intersectsAnyTileRange(tileRanges)) {
        attributions[tileSourceAttributionKey] = tileSourceAttribution
      }
    }
  }
  return attributions
};
ol.control.Attribution.prototype.handleMapPostrender = function(mapEvent) {
  this.updateElement_(mapEvent.frameState)
};
ol.control.Attribution.prototype.setMap = function(map) {
  if(!goog.isNull(this.listenerKeys_)) {
    goog.array.forEach(this.listenerKeys_, goog.events.unlistenByKey);
    this.listenerKeys_ = null
  }
  goog.base(this, "setMap", map);
  if(!goog.isNull(map)) {
    this.listenerKeys_ = [goog.events.listen(map, ol.MapEventType.POSTRENDER, this.handleMapPostrender, false, this)]
  }
};
ol.control.Attribution.prototype.updateElement_ = function(frameState) {
  if(goog.isNull(frameState)) {
    if(this.renderedVisible_) {
      goog.style.showElement(this.element, false);
      this.renderedVisible_ = false
    }
    return
  }
  var map = this.getMap();
  var attributionsToRemove = {};
  var sources = {};
  var layers = map.getLayers();
  if(goog.isDef(layers)) {
    layers.forEach(function(layer) {
      var source = layer.getSource();
      sources[goog.getUid(source).toString()] = source;
      var attributions = source.getAttributions();
      if(!goog.isNull(attributions)) {
        var attribution, i;
        for(i = 0;i < attributions.length;++i) {
          attribution = attributions[i];
          attributionKey = goog.getUid(attribution).toString();
          attributionsToRemove[attributionKey] = true
        }
      }
    })
  }
  var attributions = goog.object.clone(frameState.attributions);
  var tileSourceAttributions = this.getTileSourceAttributions(frameState.usedTiles, sources);
  goog.object.extend(attributions, tileSourceAttributions);
  var attributionKeys = goog.array.map(goog.object.getKeys(attributions), Number);
  goog.array.sort(attributionKeys);
  var i, attributionElement, attributionKey;
  for(i = 0;i < attributionKeys.length;++i) {
    attributionKey = attributionKeys[i].toString();
    if(attributionKey in this.attributionElements_) {
      if(!this.attributionElementRenderedVisible_[attributionKey]) {
        goog.style.showElement(this.attributionElements_[attributionKey], true);
        this.attributionElementRenderedVisible_[attributionKey] = true
      }
    }else {
      attributionElement = goog.dom.createElement(goog.dom.TagName.LI);
      attributionElement.innerHTML = attributions[attributionKey].getHTML();
      goog.dom.appendChild(this.ulElement_, attributionElement);
      this.attributionElements_[attributionKey] = attributionElement;
      this.attributionElementRenderedVisible_[attributionKey] = true
    }
    delete attributionsToRemove[attributionKey]
  }
  for(attributionKey in attributionsToRemove) {
    goog.dom.removeNode(this.attributionElements_[attributionKey]);
    delete this.attributionElements_[attributionKey];
    delete this.attributionElementRenderedVisible_[attributionKey]
  }
  var renderVisible = !goog.array.isEmpty(attributionKeys);
  if(this.renderedVisible_ != renderVisible) {
    goog.style.showElement(this.element, renderVisible);
    this.renderedVisible_ = renderVisible
  }
};
goog.provide("ol.control.ScaleLine");
goog.provide("ol.control.ScaleLineUnits");
goog.require("goog.dom");
goog.require("goog.style");
goog.require("ol.FrameState");
goog.require("ol.MapEvent");
goog.require("ol.MapEventType");
goog.require("ol.ProjectionUnits");
goog.require("ol.TransformFunction");
goog.require("ol.control.Control");
goog.require("ol.projection");
goog.require("ol.sphere.NORMAL");
ol.control.ScaleLineUnits = {DEGREES:"degrees", IMPERIAL:"imperial", NAUTICAL:"nautical", METRIC:"metric", US:"us"};
ol.control.ScaleLine = function(opt_options) {
  var options = opt_options || {};
  this.innerElement_ = goog.dom.createDom(goog.dom.TagName.DIV, {"class":"ol-scale-line-inner"});
  this.element_ = goog.dom.createDom(goog.dom.TagName.DIV, {"class":"ol-scale-line ol-unselectable"}, this.innerElement_);
  this.minWidth_ = goog.isDef(options.minWidth) ? options.minWidth : 64;
  this.units_ = goog.isDef(options.units) ? options.units : ol.control.ScaleLineUnits.METRIC;
  this.listenerKeys_ = null;
  this.renderedVisible_ = false;
  this.renderedWidth_;
  this.renderedHTML_ = "";
  this.toEPSG4326_ = null;
  goog.base(this, {element:this.element_, map:options.map, target:options.target})
};
goog.inherits(ol.control.ScaleLine, ol.control.Control);
ol.control.ScaleLine.LEADING_DIGITS = [1, 2, 5];
ol.control.ScaleLine.prototype.handleMapPostrender = function(mapEvent) {
  var frameState = mapEvent.frameState;
  this.updateElement_(mapEvent.frameState)
};
ol.control.ScaleLine.prototype.setMap = function(map) {
  if(!goog.isNull(this.listenerKeys_)) {
    goog.array.forEach(this.listenerKeys_, goog.events.unlistenByKey);
    this.listenerKeys_ = null
  }
  goog.base(this, "setMap", map);
  if(!goog.isNull(map)) {
    this.listenerKeys_ = [goog.events.listen(map, ol.MapEventType.POSTRENDER, this.handleMapPostrender, false, this)]
  }
};
ol.control.ScaleLine.prototype.updateElement_ = function(frameState) {
  if(goog.isNull(frameState)) {
    if(this.renderedVisible_) {
      goog.style.showElement(this.element_, false);
      this.renderedVisible_ = false
    }
    return
  }
  var view2DState = frameState.view2DState;
  var center = view2DState.center;
  var projection = view2DState.projection;
  var pointResolution = projection.getPointResolution(view2DState.resolution, center);
  var projectionUnits = projection.getUnits();
  var cosLatitude;
  if(projectionUnits == ol.ProjectionUnits.DEGREES && (this.units_ == ol.control.ScaleLineUnits.METRIC || this.units_ == ol.control.ScaleLineUnits.IMPERIAL)) {
    this.toEPSG4326_ = null;
    cosLatitude = Math.cos(goog.math.toRadians(center.y));
    pointResolution *= Math.PI * cosLatitude * ol.sphere.NORMAL.radius / 180;
    projectionUnits = ol.ProjectionUnits.METERS
  }else {
    if((projectionUnits == ol.ProjectionUnits.FEET || projectionUnits == ol.ProjectionUnits.METERS) && this.units_ == ol.control.ScaleLineUnits.DEGREES) {
      if(goog.isNull(this.toEPSG4326_)) {
        this.toEPSG4326_ = ol.projection.getTransform(projection, ol.projection.getFromCode("EPSG:4326"))
      }
      var vertex = [center.x, center.y];
      vertex = this.toEPSG4326_(vertex, vertex, 2);
      cosLatitude = Math.cos(goog.math.toRadians(vertex[1]));
      var radius = ol.sphere.NORMAL.radius;
      if(projectionUnits == ol.ProjectionUnits.FEET) {
        radius /= 0.3048
      }
      pointResolution *= 180 / (Math.PI * cosLatitude * radius);
      projectionUnits = ol.ProjectionUnits.DEGREES
    }else {
      this.toEPSG4326_ = null
    }
  }
  goog.asserts.assert((this.units_ == ol.control.ScaleLineUnits.METRIC || this.units_ == ol.control.ScaleLineUnits.IMPERIAL) && projectionUnits == ol.ProjectionUnits.METERS || this.units_ == ol.control.ScaleLineUnits.DEGREES && projectionUnits == ol.ProjectionUnits.DEGREES);
  var nominalCount = this.minWidth_ * pointResolution;
  var suffix = "";
  if(this.units_ == ol.control.ScaleLineUnits.DEGREES) {
    if(nominalCount < 1 / 60) {
      suffix = "\u2033";
      pointResolution *= 3600
    }else {
      if(nominalCount < 1) {
        suffix = "\u2032";
        pointResolution *= 60
      }else {
        suffix = "\u00b0"
      }
    }
  }else {
    if(this.units_ == ol.control.ScaleLineUnits.IMPERIAL) {
      if(nominalCount < 0.9144) {
        suffix = "in";
        pointResolution /= 0.0254
      }else {
        if(nominalCount < 1609.344) {
          suffix = "ft";
          pointResolution /= 0.3048
        }else {
          suffix = "mi";
          pointResolution /= 1609.344
        }
      }
    }else {
      if(this.units_ == ol.control.ScaleLineUnits.NAUTICAL) {
        pointResolution /= 1852;
        suffix = "nm"
      }else {
        if(this.units_ == ol.control.ScaleLineUnits.METRIC) {
          if(nominalCount < 1) {
            suffix = "mm";
            pointResolution *= 1E3
          }else {
            if(nominalCount < 1E3) {
              suffix = "m"
            }else {
              suffix = "km";
              pointResolution /= 1E3
            }
          }
        }else {
          if(this.units_ == ol.control.ScaleLineUnits.US) {
            if(nominalCount < 0.9144) {
              suffix = "in";
              pointResolution *= 39.37
            }else {
              if(nominalCount < 1609.344) {
                suffix = "ft";
                pointResolution /= 0.30480061
              }else {
                suffix = "mi";
                pointResolution /= 1609.3472
              }
            }
          }else {
            goog.asserts.assert(false)
          }
        }
      }
    }
  }
  var i = 3 * Math.floor(Math.log(this.minWidth_ * pointResolution) / Math.log(10));
  var count, width;
  while(true) {
    count = ol.control.ScaleLine.LEADING_DIGITS[i % 3] * Math.pow(10, Math.floor(i / 3));
    width = Math.round(count / pointResolution);
    if(width >= this.minWidth_) {
      break
    }
    ++i
  }
  var html = count + suffix;
  if(this.renderedHTML_ != html) {
    this.innerElement_.innerHTML = html;
    this.renderedHTML_ = html
  }
  if(this.renderedWidth_ != width) {
    this.innerElement_.style.width = width + "px";
    this.renderedWidth_ = width
  }
  if(!this.renderedVisible_) {
    goog.style.showElement(this.element_, true);
    this.renderedVisible_ = true
  }
};
goog.provide("ol.control.Zoom");
goog.require("goog.dom");
goog.require("goog.dom.TagName");
goog.require("goog.events");
goog.require("goog.events.EventType");
goog.require("ol.control.Control");
ol.control.ZOOM_DURATION = 250;
ol.control.Zoom = function(zoomOptions) {
  var inElement = goog.dom.createDom(goog.dom.TagName.A, {"href":"#zoomIn", "class":"ol-zoom-in"});
  goog.events.listen(inElement, [goog.events.EventType.TOUCHEND, goog.events.EventType.CLICK], this.handleIn_, false, this);
  var outElement = goog.dom.createDom(goog.dom.TagName.A, {"href":"#zoomOut", "class":"ol-zoom-out"});
  goog.events.listen(outElement, [goog.events.EventType.TOUCHEND, goog.events.EventType.CLICK], this.handleOut_, false, this);
  var element = goog.dom.createDom(goog.dom.TagName.DIV, "ol-zoom ol-unselectable", inElement, outElement);
  goog.base(this, {element:element, map:zoomOptions.map, target:zoomOptions.target});
  this.delta_ = goog.isDef(zoomOptions.delta) ? zoomOptions.delta : 1
};
goog.inherits(ol.control.Zoom, ol.control.Control);
ol.control.Zoom.prototype.handleIn_ = function(browserEvent) {
  browserEvent.preventDefault();
  var map = this.getMap();
  map.requestRenderFrame();
  map.getView().zoomByDelta(map, this.delta_, undefined, ol.control.ZOOM_DURATION)
};
ol.control.Zoom.prototype.handleOut_ = function(browserEvent) {
  browserEvent.preventDefault();
  var map = this.getMap();
  map.requestRenderFrame();
  map.getView().zoomByDelta(map, -this.delta_, undefined, ol.control.ZOOM_DURATION)
};
goog.provide("ol.interaction.Interaction");
goog.require("ol.MapBrowserEvent");
ol.interaction.Interaction = function() {
};
ol.interaction.Interaction.prototype.handleMapBrowserEvent = goog.abstractMethod;
goog.provide("ol.interaction.DblClickZoom");
goog.require("ol.MapBrowserEvent");
goog.require("ol.MapBrowserEvent.EventType");
goog.require("ol.View2D");
goog.require("ol.interaction.Interaction");
ol.interaction.DBLCLICKZOOM_ANIMATION_DURATION = 250;
ol.interaction.DblClickZoom = function(delta) {
  this.delta_ = delta;
  goog.base(this)
};
goog.inherits(ol.interaction.DblClickZoom, ol.interaction.Interaction);
ol.interaction.DblClickZoom.prototype.handleMapBrowserEvent = function(mapBrowserEvent) {
  var browserEvent = mapBrowserEvent.browserEvent;
  if(mapBrowserEvent.type == ol.MapBrowserEvent.EventType.DBLCLICK && mapBrowserEvent.isMouseActionButton()) {
    var map = mapBrowserEvent.map;
    var anchor = mapBrowserEvent.getCoordinate();
    var delta = mapBrowserEvent.browserEvent.shiftKey ? -this.delta_ : this.delta_;
    var view = map.getView();
    goog.asserts.assert(view instanceof ol.View2D);
    view.zoomByDelta(map, delta, anchor, ol.interaction.DBLCLICKZOOM_ANIMATION_DURATION);
    mapBrowserEvent.preventDefault();
    browserEvent.preventDefault()
  }
};
goog.provide("ol.interaction.ConditionType");
goog.provide("ol.interaction.condition");
ol.interaction.ConditionType;
ol.interaction.condition.altKeyOnly = function(browserEvent) {
  return browserEvent.altKey && !browserEvent.platformModifierKey && !browserEvent.shiftKey
};
ol.interaction.condition.altShiftKeysOnly = function(browserEvent) {
  return browserEvent.altKey && !browserEvent.platformModifierKey && browserEvent.shiftKey
};
ol.interaction.condition.noModifierKeys = function(browserEvent) {
  return!browserEvent.altKey && !browserEvent.platformModifierKey && !browserEvent.shiftKey
};
ol.interaction.condition.platformModifierKeyOnly = function(browserEvent) {
  return!browserEvent.altKey && browserEvent.platformModifierKey && !browserEvent.shiftKey
};
ol.interaction.condition.shiftKeyOnly = function(browserEvent) {
  return!browserEvent.altKey && !browserEvent.platformModifierKey && browserEvent.shiftKey
};
goog.provide("ol.interaction.Drag");
goog.require("goog.asserts");
goog.require("goog.functions");
goog.require("ol.Coordinate");
goog.require("ol.MapBrowserEvent");
goog.require("ol.MapBrowserEvent.EventType");
goog.require("ol.interaction.Interaction");
ol.interaction.Drag = function() {
  goog.base(this);
  this.dragging_ = false;
  this.startX = 0;
  this.startY = 0;
  this.offsetX = 0;
  this.offsetY = 0;
  this.startCenter = null;
  this.startCoordinate = null
};
goog.inherits(ol.interaction.Drag, ol.interaction.Interaction);
ol.interaction.Drag.prototype.handleDrag = goog.nullFunction;
ol.interaction.Drag.prototype.handleDragEnd = goog.nullFunction;
ol.interaction.Drag.prototype.handleDragStart = goog.functions.FALSE;
ol.interaction.Drag.prototype.handleDown = goog.nullFunction;
ol.interaction.Drag.prototype.handleMapBrowserEvent = function(mapBrowserEvent) {
  var map = mapBrowserEvent.map;
  if(!map.isDef()) {
    return
  }
  var view = map.getView();
  var browserEvent = mapBrowserEvent.browserEvent;
  if(mapBrowserEvent.type == ol.MapBrowserEvent.EventType.DOWN) {
    goog.asserts.assert(browserEvent instanceof goog.events.BrowserEvent);
    this.handleDown(mapBrowserEvent)
  }
  if(this.dragging_) {
    if(mapBrowserEvent.type == ol.MapBrowserEvent.EventType.DRAG) {
      goog.asserts.assert(browserEvent instanceof goog.events.BrowserEvent);
      this.deltaX = browserEvent.clientX - this.startX;
      this.deltaY = browserEvent.clientY - this.startY;
      this.handleDrag(mapBrowserEvent)
    }else {
      if(mapBrowserEvent.type == ol.MapBrowserEvent.EventType.DRAGEND) {
        goog.asserts.assert(browserEvent instanceof goog.events.BrowserEvent);
        this.deltaX = browserEvent.clientX - this.startX;
        this.deltaY = browserEvent.clientY - this.startY;
        this.handleDragEnd(mapBrowserEvent);
        this.dragging_ = false
      }
    }
  }else {
    if(mapBrowserEvent.type == ol.MapBrowserEvent.EventType.DRAGSTART) {
      goog.asserts.assert(browserEvent instanceof goog.events.BrowserEvent);
      this.startX = browserEvent.clientX;
      this.startY = browserEvent.clientY;
      this.deltaX = 0;
      this.deltaY = 0;
      this.startCenter = view.getCenter();
      this.startCoordinate = mapBrowserEvent.getCoordinate();
      var handled = this.handleDragStart(mapBrowserEvent);
      if(handled) {
        this.dragging_ = true;
        mapBrowserEvent.preventDefault()
      }
    }
  }
};
goog.provide("ol.interaction.DragPan");
goog.require("goog.asserts");
goog.require("ol.Coordinate");
goog.require("ol.Kinetic");
goog.require("ol.Pixel");
goog.require("ol.PreRenderFunction");
goog.require("ol.View2D");
goog.require("ol.ViewHint");
goog.require("ol.interaction.ConditionType");
goog.require("ol.interaction.Drag");
ol.interaction.DragPan = function(condition, opt_kinetic) {
  goog.base(this);
  this.condition_ = condition;
  this.kinetic_ = opt_kinetic;
  this.kineticPreRenderFn_ = null
};
goog.inherits(ol.interaction.DragPan, ol.interaction.Drag);
ol.interaction.DragPan.prototype.handleDrag = function(mapBrowserEvent) {
  if(this.kinetic_) {
    this.kinetic_.update(mapBrowserEvent.browserEvent.clientX, mapBrowserEvent.browserEvent.clientY)
  }
  var map = mapBrowserEvent.map;
  var view = map.getView();
  goog.asserts.assert(view instanceof ol.View2D);
  var resolution = view.getResolution();
  var rotation = view.getRotation();
  var delta = new ol.Coordinate(-resolution * this.deltaX, resolution * this.deltaY);
  delta.rotate(rotation);
  var newCenter = new ol.Coordinate(this.startCenter.x + delta.x, this.startCenter.y + delta.y);
  map.requestRenderFrame();
  view.setCenter(newCenter)
};
ol.interaction.DragPan.prototype.handleDragEnd = function(mapBrowserEvent) {
  var map = mapBrowserEvent.map;
  var view = map.getView();
  view.setHint(ol.ViewHint.INTERACTING, -1);
  if(this.kinetic_ && this.kinetic_.end()) {
    var distance = this.kinetic_.getDistance();
    var angle = this.kinetic_.getAngle();
    var center = view.getCenter();
    this.kineticPreRenderFn_ = this.kinetic_.pan(center);
    map.addPreRenderFunction(this.kineticPreRenderFn_);
    var centerpx = map.getPixelFromCoordinate(center);
    var destpx = new ol.Pixel(centerpx.x - distance * Math.cos(angle), centerpx.y - distance * Math.sin(angle));
    var dest = map.getCoordinateFromPixel(destpx);
    view.setCenter(dest)
  }
};
ol.interaction.DragPan.prototype.handleDragStart = function(mapBrowserEvent) {
  var browserEvent = mapBrowserEvent.browserEvent;
  if(this.condition_(browserEvent)) {
    if(this.kinetic_) {
      this.kinetic_.begin();
      this.kinetic_.update(browserEvent.clientX, browserEvent.clientY)
    }
    var map = mapBrowserEvent.map;
    map.requestRenderFrame();
    map.getView().setHint(ol.ViewHint.INTERACTING, 1);
    return true
  }else {
    return false
  }
};
ol.interaction.DragPan.prototype.handleDown = function(mapBrowserEvent) {
  var map = mapBrowserEvent.map;
  var view = map.getView();
  goog.asserts.assert(view instanceof ol.View2D);
  goog.asserts.assert(!goog.isNull(mapBrowserEvent.frameState));
  if(!goog.isNull(this.kineticPreRenderFn_) && map.removePreRenderFunction(this.kineticPreRenderFn_)) {
    map.requestRenderFrame();
    view.setCenter(mapBrowserEvent.frameState.view2DState.center);
    this.kineticPreRenderFn_ = null
  }
};
goog.provide("ol.interaction.DragRotate");
goog.require("ol.View2D");
goog.require("ol.ViewHint");
goog.require("ol.interaction.ConditionType");
goog.require("ol.interaction.Drag");
ol.interaction.DRAGROTATE_ANIMATION_DURATION = 250;
ol.interaction.DragRotate = function(condition) {
  goog.base(this);
  this.condition_ = condition;
  this.lastAngle_
};
goog.inherits(ol.interaction.DragRotate, ol.interaction.Drag);
ol.interaction.DragRotate.prototype.handleDrag = function(mapBrowserEvent) {
  var browserEvent = mapBrowserEvent.browserEvent;
  var map = mapBrowserEvent.map;
  var size = map.getSize();
  var offset = mapBrowserEvent.getPixel();
  var theta = Math.atan2(size.height / 2 - offset.y, offset.x - size.width / 2);
  if(goog.isDef(this.lastAngle_)) {
    var delta = theta - this.lastAngle_;
    var view = map.getView();
    goog.asserts.assert(view instanceof ol.View2D);
    map.requestRenderFrame();
    view.rotateWithoutConstraints(map, view.getRotation() - delta)
  }
  this.lastAngle_ = theta
};
ol.interaction.DragRotate.prototype.handleDragEnd = function(mapBrowserEvent) {
  var browserEvent = mapBrowserEvent.browserEvent;
  var map = mapBrowserEvent.map;
  var view = map.getView();
  goog.asserts.assert(view instanceof ol.View2D);
  view.rotate(map, view.getRotation(), undefined, ol.interaction.DRAGROTATE_ANIMATION_DURATION);
  view.setHint(ol.ViewHint.INTERACTING, -1)
};
ol.interaction.DragRotate.prototype.handleDragStart = function(mapBrowserEvent) {
  var browserEvent = mapBrowserEvent.browserEvent;
  if(browserEvent.isMouseActionButton() && this.condition_(browserEvent)) {
    var map = mapBrowserEvent.map;
    var view = map.getView();
    goog.asserts.assert(view instanceof ol.View2D);
    map.requestRenderFrame();
    this.lastAngle_ = undefined;
    view.setHint(ol.ViewHint.INTERACTING, 1);
    return true
  }else {
    return false
  }
};
goog.provide("ol.control.DragBox");
goog.require("goog.asserts");
goog.require("goog.dom");
goog.require("goog.dom.TagName");
goog.require("goog.events");
goog.require("goog.style");
goog.require("ol.Coordinate");
goog.require("ol.MapBrowserEvent");
goog.require("ol.MapBrowserEvent.EventType");
goog.require("ol.Pixel");
goog.require("ol.Size");
goog.require("ol.control.Control");
ol.control.DragBoxOptions;
ol.control.DragBox = function(dragBoxOptions) {
  var element = goog.dom.createDom(goog.dom.TagName.DIV, "ol-dragbox");
  this.startPixel_ = null;
  this.startCoordinate_ = dragBoxOptions.startCoordinate;
  this.dragListenKey_ = null;
  goog.base(this, {element:element, map:dragBoxOptions.map})
};
goog.inherits(ol.control.DragBox, ol.control.Control);
ol.control.DragBox.prototype.setMap = function(map) {
  if(!goog.isNull(this.dragListenKey_)) {
    goog.events.unlistenByKey(this.dragListenKey_);
    this.dragListenKey_ = null
  }
  if(!goog.isNull(map)) {
    this.startPixel_ = map.getPixelFromCoordinate(this.startCoordinate_);
    goog.asserts.assert(goog.isDef(this.startPixel_));
    goog.style.setPosition(this.element, this.startPixel_);
    goog.style.setBorderBoxSize(this.element, new ol.Size(0, 0));
    this.dragListenKey_ = goog.events.listen(map, ol.MapBrowserEvent.EventType.DRAG, this.updateBox_, false, this)
  }
  goog.base(this, "setMap", map)
};
ol.control.DragBox.prototype.updateBox_ = function(mapBrowserEvent) {
  var map = this.getMap();
  var coordinate = mapBrowserEvent.getCoordinate();
  goog.asserts.assert(goog.isDef(coordinate));
  var currentPixel = map.getPixelFromCoordinate(coordinate);
  goog.style.setPosition(this.element, new ol.Pixel(Math.min(currentPixel.x, this.startPixel_.x), Math.min(currentPixel.y, this.startPixel_.y)));
  goog.style.setBorderBoxSize(this.element, new ol.Size(Math.abs(currentPixel.x - this.startPixel_.x), Math.abs(currentPixel.y - this.startPixel_.y)))
};
goog.provide("ol.interaction.DragZoom");
goog.require("ol.Extent");
goog.require("ol.Size");
goog.require("ol.View2D");
goog.require("ol.control.DragBox");
goog.require("ol.interaction.ConditionType");
goog.require("ol.interaction.Drag");
ol.SHIFT_DRAG_ZOOM_HYSTERESIS_PIXELS = 8;
ol.SHIFT_DRAG_ZOOM_HYSTERESIS_PIXELS_SQUARED = ol.SHIFT_DRAG_ZOOM_HYSTERESIS_PIXELS * ol.SHIFT_DRAG_ZOOM_HYSTERESIS_PIXELS;
ol.interaction.DragZoom = function(condition) {
  goog.base(this);
  this.condition_ = condition;
  this.dragBox_ = null
};
goog.inherits(ol.interaction.DragZoom, ol.interaction.Drag);
ol.interaction.DragZoom.prototype.handleDragEnd = function(mapBrowserEvent) {
  this.dragBox_.setMap(null);
  this.dragBox_ = null;
  if(this.deltaX * this.deltaX + this.deltaY * this.deltaY >= ol.SHIFT_DRAG_ZOOM_HYSTERESIS_PIXELS_SQUARED) {
    var map = mapBrowserEvent.map;
    var extent = ol.Extent.boundingExtent(this.startCoordinate, mapBrowserEvent.getCoordinate());
    map.withFrozenRendering(function() {
      var view = map.getView();
      goog.asserts.assert(view instanceof ol.View2D);
      var mapSize = map.getSize();
      view.fitExtent(extent, mapSize);
      view.setRotation(0)
    })
  }
};
ol.interaction.DragZoom.prototype.handleDragStart = function(mapBrowserEvent) {
  var browserEvent = mapBrowserEvent.browserEvent;
  if(browserEvent.isMouseActionButton() && this.condition_(browserEvent)) {
    this.dragBox_ = new ol.control.DragBox({map:mapBrowserEvent.map, startCoordinate:this.startCoordinate});
    return true
  }else {
    return false
  }
};
goog.provide("ol.interaction.KeyboardPan");
goog.require("goog.events.KeyCodes");
goog.require("goog.events.KeyHandler.EventType");
goog.require("ol.Coordinate");
goog.require("ol.View2D");
goog.require("ol.interaction.Interaction");
ol.interaction.KeyboardPan = function(pixelDelta) {
  goog.base(this);
  this.pixelDelta_ = pixelDelta
};
goog.inherits(ol.interaction.KeyboardPan, ol.interaction.Interaction);
ol.interaction.KeyboardPan.prototype.handleMapBrowserEvent = function(mapBrowserEvent) {
  if(mapBrowserEvent.type == goog.events.KeyHandler.EventType.KEY) {
    var keyEvent = mapBrowserEvent.browserEvent;
    var keyCode = keyEvent.keyCode;
    if(keyCode == goog.events.KeyCodes.DOWN || keyCode == goog.events.KeyCodes.LEFT || keyCode == goog.events.KeyCodes.RIGHT || keyCode == goog.events.KeyCodes.UP) {
      var map = mapBrowserEvent.map;
      var view = map.getView();
      goog.asserts.assert(view instanceof ol.View2D);
      var resolution = view.getResolution();
      var delta;
      var mapUnitsDelta = resolution * this.pixelDelta_;
      if(keyCode == goog.events.KeyCodes.DOWN) {
        delta = new ol.Coordinate(0, -mapUnitsDelta)
      }else {
        if(keyCode == goog.events.KeyCodes.LEFT) {
          delta = new ol.Coordinate(-mapUnitsDelta, 0)
        }else {
          if(keyCode == goog.events.KeyCodes.RIGHT) {
            delta = new ol.Coordinate(mapUnitsDelta, 0)
          }else {
            goog.asserts.assert(keyCode == goog.events.KeyCodes.UP);
            delta = new ol.Coordinate(0, mapUnitsDelta)
          }
        }
      }
      var oldCenter = view.getCenter();
      var newCenter = new ol.Coordinate(oldCenter.x + delta.x, oldCenter.y + delta.y);
      view.setCenter(newCenter);
      keyEvent.preventDefault();
      mapBrowserEvent.preventDefault()
    }
  }
};
goog.provide("ol.interaction.KeyboardZoom");
goog.require("goog.events.KeyHandler.EventType");
goog.require("ol.View2D");
goog.require("ol.interaction.Interaction");
ol.interaction.KEYBOARD_ZOOM_DURATION = 100;
ol.interaction.KeyboardZoom = function() {
  goog.base(this)
};
goog.inherits(ol.interaction.KeyboardZoom, ol.interaction.Interaction);
ol.interaction.KeyboardZoom.prototype.handleMapBrowserEvent = function(mapBrowserEvent) {
  if(mapBrowserEvent.type == goog.events.KeyHandler.EventType.KEY) {
    var keyEvent = mapBrowserEvent.browserEvent;
    var charCode = keyEvent.charCode;
    if(charCode == "+".charCodeAt(0) || charCode == "-".charCodeAt(0)) {
      var map = mapBrowserEvent.map;
      var delta = charCode == "+".charCodeAt(0) ? 4 : -4;
      map.requestRenderFrame();
      var view = map.getView();
      goog.asserts.assert(view instanceof ol.View2D);
      view.zoomByDelta(map, delta, undefined, ol.interaction.KEYBOARD_ZOOM_DURATION);
      keyEvent.preventDefault();
      mapBrowserEvent.preventDefault()
    }
  }
};
goog.provide("ol.interaction.MouseWheelZoom");
goog.require("goog.events.MouseWheelEvent");
goog.require("goog.events.MouseWheelHandler.EventType");
goog.require("goog.math");
goog.require("ol.Coordinate");
goog.require("ol.View2D");
goog.require("ol.interaction.Interaction");
ol.interaction.MOUSEWHEELZOOM_ANIMATION_DURATION = 250;
ol.interaction.MOUSEWHEELZOOM_MAXDELTA = 1;
ol.interaction.MOUSEWHEELZOOM_TIMEOUT_DURATION = 80;
ol.interaction.MouseWheelZoom = function() {
  goog.base(this);
  this.delta_ = 0;
  this.lastAnchor_ = null;
  this.startTime_ = undefined;
  this.timeoutId_ = undefined
};
goog.inherits(ol.interaction.MouseWheelZoom, ol.interaction.Interaction);
ol.interaction.MouseWheelZoom.prototype.handleMapBrowserEvent = function(mapBrowserEvent) {
  if(mapBrowserEvent.type == goog.events.MouseWheelHandler.EventType.MOUSEWHEEL) {
    var map = mapBrowserEvent.map;
    var mouseWheelEvent = mapBrowserEvent.browserEvent;
    goog.asserts.assert(mouseWheelEvent instanceof goog.events.MouseWheelEvent);
    this.lastAnchor_ = mapBrowserEvent.getCoordinate();
    this.delta_ += mouseWheelEvent.deltaY / 3;
    if(!goog.isDef(this.startTime_)) {
      this.startTime_ = goog.now()
    }
    var duration = ol.interaction.MOUSEWHEELZOOM_TIMEOUT_DURATION;
    var timeLeft = Math.max(duration - (goog.now() - this.startTime_), 0);
    goog.global.clearTimeout(this.timeoutId_);
    this.timeoutId_ = goog.global.setTimeout(goog.bind(this.doZoom_, this, map), timeLeft);
    mapBrowserEvent.preventDefault();
    mouseWheelEvent.preventDefault()
  }
};
ol.interaction.MouseWheelZoom.prototype.doZoom_ = function(map) {
  var maxDelta = ol.interaction.MOUSEWHEELZOOM_MAXDELTA;
  var delta = goog.math.clamp(this.delta_, -maxDelta, maxDelta);
  var view = map.getView();
  goog.asserts.assert(view instanceof ol.View2D);
  map.requestRenderFrame();
  view.zoomByDelta(map, -delta, this.lastAnchor_, ol.interaction.MOUSEWHEELZOOM_ANIMATION_DURATION);
  this.delta_ = 0;
  this.lastAnchor_ = null;
  this.startTime_ = undefined;
  this.timeoutId_ = undefined
};
goog.provide("ol.interaction.Touch");
goog.require("goog.functions");
goog.require("ol.MapBrowserEvent");
goog.require("ol.MapBrowserEvent.EventType");
goog.require("ol.Pixel");
goog.require("ol.interaction.Interaction");
ol.interaction.Touch = function() {
  goog.base(this);
  this.handled_ = false;
  this.trackedTouches_ = {};
  this.targetTouches = []
};
goog.inherits(ol.interaction.Touch, ol.interaction.Interaction);
ol.interaction.Touch.centroid = function(touches) {
  var length = touches.length;
  var clientX = 0;
  var clientY = 0;
  for(var i = 0;i < length;i++) {
    clientX += touches[i].clientX;
    clientY += touches[i].clientY
  }
  return new ol.Pixel(clientX / length, clientY / length)
};
ol.interaction.Touch.prototype.updateTrackedTouches_ = function(mapBrowserEvent) {
  var event = mapBrowserEvent.browserEvent.getBrowserEvent();
  if(goog.isDef(event.targetTouches)) {
    this.targetTouches = event.targetTouches
  }else {
    if(mapBrowserEvent.type == ol.MapBrowserEvent.EventType.TOUCHEND) {
      delete this.trackedTouches_[event.pointerId]
    }else {
      this.trackedTouches_[event.pointerId] = event
    }
    this.targetTouches = goog.object.getValues(this.trackedTouches_)
  }
};
ol.interaction.Touch.prototype.handleTouchMove = goog.nullFunction;
ol.interaction.Touch.prototype.handleTouchEnd = goog.functions.FALSE;
ol.interaction.Touch.prototype.handleTouchStart = goog.functions.FALSE;
ol.interaction.Touch.prototype.handleMapBrowserEvent = function(mapBrowserEvent) {
  var browserEvent = mapBrowserEvent.browserEvent.getBrowserEvent();
  this.updateTrackedTouches_(mapBrowserEvent);
  if(this.handled_) {
    if(mapBrowserEvent.type == ol.MapBrowserEvent.EventType.TOUCHMOVE) {
      this.handleTouchMove(mapBrowserEvent)
    }else {
      if(mapBrowserEvent.type == ol.MapBrowserEvent.EventType.TOUCHEND) {
        this.handled_ = this.handleTouchEnd(mapBrowserEvent)
      }
    }
  }
  if(mapBrowserEvent.type == ol.MapBrowserEvent.EventType.TOUCHSTART) {
    this.handled_ = this.handleTouchStart(mapBrowserEvent)
  }
};
goog.provide("ol.interaction.TouchPan");
goog.require("goog.asserts");
goog.require("ol.Coordinate");
goog.require("ol.Kinetic");
goog.require("ol.Pixel");
goog.require("ol.PreRenderFunction");
goog.require("ol.View");
goog.require("ol.ViewHint");
goog.require("ol.interaction.Touch");
ol.interaction.TouchPan = function(opt_kinetic) {
  goog.base(this);
  this.kinetic_ = opt_kinetic;
  this.kineticPreRenderFn_ = null;
  this.lastCentroid = null
};
goog.inherits(ol.interaction.TouchPan, ol.interaction.Touch);
ol.interaction.TouchPan.prototype.handleTouchMove = function(mapBrowserEvent) {
  goog.asserts.assert(this.targetTouches.length >= 1);
  var centroid = ol.interaction.Touch.centroid(this.targetTouches);
  if(!goog.isNull(this.lastCentroid)) {
    if(this.kinetic_) {
      this.kinetic_.update(centroid.x, centroid.y)
    }
    var deltaX = this.lastCentroid.x - centroid.x;
    var deltaY = centroid.y - this.lastCentroid.y;
    var view = mapBrowserEvent.map.getView();
    var center = (new ol.Coordinate(deltaX, deltaY)).scale(view.getResolution()).rotate(view.getRotation()).add(view.getCenter());
    view.setCenter(center)
  }
  this.lastCentroid = centroid
};
ol.interaction.TouchPan.prototype.handleTouchEnd = function(mapBrowserEvent) {
  var map = mapBrowserEvent.map;
  var view = map.getView();
  if(this.targetTouches.length == 0) {
    view.setHint(ol.ViewHint.INTERACTING, -1);
    if(this.kinetic_ && this.kinetic_.end()) {
      var distance = this.kinetic_.getDistance();
      var angle = this.kinetic_.getAngle();
      var center = view.getCenter();
      this.kineticPreRenderFn_ = this.kinetic_.pan(center);
      map.addPreRenderFunction(this.kineticPreRenderFn_);
      var centerpx = map.getPixelFromCoordinate(center);
      var destpx = new ol.Pixel(centerpx.x - distance * Math.cos(angle), centerpx.y - distance * Math.sin(angle));
      var dest = map.getCoordinateFromPixel(destpx);
      view.setCenter(dest)
    }
    return false
  }else {
    this.lastCentroid = null;
    return true
  }
};
ol.interaction.TouchPan.prototype.handleTouchStart = function(mapBrowserEvent) {
  if(this.targetTouches.length >= 1) {
    var map = mapBrowserEvent.map;
    var view = map.getView();
    this.lastCentroid = null;
    if(!goog.isNull(this.kineticPreRenderFn_) && map.removePreRenderFunction(this.kineticPreRenderFn_)) {
      map.requestRenderFrame();
      view.setCenter(mapBrowserEvent.frameState.view2DState.center);
      this.kineticPreRenderFn_ = null
    }
    if(this.kinetic_) {
      this.kinetic_.begin()
    }
    view.setHint(ol.ViewHint.INTERACTING, 1);
    return true
  }else {
    return false
  }
};
goog.provide("ol.interaction.TouchRotate");
goog.require("goog.asserts");
goog.require("ol.View");
goog.require("ol.ViewHint");
goog.require("ol.interaction.Touch");
ol.interaction.TOUCHROTATE_ANIMATION_DURATION = 250;
ol.interaction.TouchRotate = function(opt_threshold) {
  goog.base(this);
  this.lastAngle_;
  this.rotating_ = false;
  this.rotationDelta_ = 0;
  this.threshold_ = goog.isDef(opt_threshold) ? opt_threshold : 0.3
};
goog.inherits(ol.interaction.TouchRotate, ol.interaction.Touch);
ol.interaction.TouchRotate.prototype.handleTouchMove = function(mapBrowserEvent) {
  goog.asserts.assert(this.targetTouches.length >= 2);
  var rotationDelta = 0;
  var touch0 = this.targetTouches[0];
  var touch1 = this.targetTouches[1];
  var dx = touch0.clientX - touch1.clientX;
  var dy = touch0.clientY - touch1.clientY;
  var angle = Math.atan2(touch1.clientY - touch0.clientY, touch1.clientX - touch0.clientX);
  if(goog.isDef(this.lastAngle_)) {
    var delta = angle - this.lastAngle_;
    this.rotationDelta_ += delta;
    if(!this.rotating_ && Math.abs(this.rotationDelta_) > this.threshold_) {
      this.rotating_ = true
    }
    rotationDelta = delta
  }
  this.lastAngle_ = angle;
  var map = mapBrowserEvent.map;
  var view = map.getView();
  var viewportPosition = goog.style.getClientPosition(map.getViewport());
  var centroid = ol.interaction.Touch.centroid(this.targetTouches);
  centroid.x -= viewportPosition.x;
  centroid.y -= viewportPosition.y;
  var anchor = map.getCoordinateFromPixel(centroid);
  if(this.rotating_) {
    view.rotateWithoutConstraints(map, view.getRotation() + rotationDelta, anchor)
  }
};
ol.interaction.TouchRotate.prototype.handleTouchEnd = function(mapBrowserEvent) {
  if(this.targetTouches.length < 2) {
    var map = mapBrowserEvent.map;
    var view = map.getView();
    if(this.rotating_) {
      view.rotate(map, view.getRotation(), undefined, ol.interaction.TOUCHROTATE_ANIMATION_DURATION)
    }
    view.setHint(ol.ViewHint.INTERACTING, -1);
    return false
  }else {
    return true
  }
};
ol.interaction.TouchRotate.prototype.handleTouchStart = function(mapBrowserEvent) {
  if(this.targetTouches.length >= 2) {
    var view = mapBrowserEvent.map.getView();
    this.lastAngle_ = undefined;
    this.rotating_ = false;
    this.rotationDelta_ = 0;
    view.setHint(ol.ViewHint.INTERACTING, 1);
    return true
  }else {
    return false
  }
};
goog.provide("ol.interaction.TouchZoom");
goog.require("goog.asserts");
goog.require("ol.View");
goog.require("ol.ViewHint");
goog.require("ol.interaction.Touch");
ol.interaction.TOUCHZOOM_ANIMATION_DURATION = 250;
ol.interaction.TouchZoom = function() {
  goog.base(this);
  this.lastDistance_
};
goog.inherits(ol.interaction.TouchZoom, ol.interaction.Touch);
ol.interaction.TouchZoom.prototype.handleTouchMove = function(mapBrowserEvent) {
  goog.asserts.assert(this.targetTouches.length >= 2);
  var scaleDelta = 1;
  var touch0 = this.targetTouches[0];
  var touch1 = this.targetTouches[1];
  var dx = touch0.clientX - touch1.clientX;
  var dy = touch0.clientY - touch1.clientY;
  var distance = Math.sqrt(dx * dx + dy * dy);
  if(goog.isDef(this.lastDistance_)) {
    scaleDelta = this.lastDistance_ / distance
  }
  this.lastDistance_ = distance;
  var map = mapBrowserEvent.map;
  var view = map.getView();
  var viewportPosition = goog.style.getClientPosition(map.getViewport());
  var centroid = ol.interaction.Touch.centroid(this.targetTouches);
  centroid.x -= viewportPosition.x;
  centroid.y -= viewportPosition.y;
  var anchor = map.getCoordinateFromPixel(centroid);
  view.zoomWithoutConstraints(map, view.getResolution() * scaleDelta, anchor)
};
ol.interaction.TouchZoom.prototype.handleTouchEnd = function(mapBrowserEvent) {
  if(this.targetTouches.length < 2) {
    var map = mapBrowserEvent.map;
    var view = map.getView();
    view.zoom(map, view.getResolution(), undefined, ol.interaction.TOUCHZOOM_ANIMATION_DURATION);
    view.setHint(ol.ViewHint.INTERACTING, -1);
    return false
  }else {
    return true
  }
};
ol.interaction.TouchZoom.prototype.handleTouchStart = function(mapBrowserEvent) {
  if(this.targetTouches.length >= 2) {
    var view = mapBrowserEvent.map.getView();
    this.lastDistance_ = undefined;
    view.setHint(ol.ViewHint.INTERACTING, 1);
    return true
  }else {
    return false
  }
};
goog.provide("ol.math");
ol.math.cosh = function(x) {
  return(Math.exp(x) + Math.exp(-x)) / 2
};
ol.math.coth = function(x) {
  var expMinusTwoX = Math.exp(-2 * x);
  return(1 + expMinusTwoX) / (1 - expMinusTwoX)
};
ol.math.csch = function(x) {
  return 2 / (Math.exp(x) - Math.exp(-x))
};
ol.math.sech = function(x) {
  return 2 / (Math.exp(x) + Math.exp(-x))
};
ol.math.sinh = function(x) {
  return(Math.exp(x) - Math.exp(-x)) / 2
};
ol.math.tanh = function(x) {
  var expMinusTwoX = Math.exp(-2 * x);
  return(1 - expMinusTwoX) / (1 + expMinusTwoX)
};
goog.provide("ol.projection.EPSG3857");
goog.require("goog.array");
goog.require("ol.Extent");
goog.require("ol.Projection");
goog.require("ol.ProjectionUnits");
goog.require("ol.math");
goog.require("ol.projection");
ol.projection.EPSG3857 = function(code) {
  goog.base(this, code, ol.ProjectionUnits.METERS, ol.projection.EPSG3857.EXTENT)
};
goog.inherits(ol.projection.EPSG3857, ol.Projection);
ol.projection.EPSG3857.RADIUS = 6378137;
ol.projection.EPSG3857.HALF_SIZE = Math.PI * ol.projection.EPSG3857.RADIUS;
ol.projection.EPSG3857.EXTENT = new ol.Extent(-ol.projection.EPSG3857.HALF_SIZE, -ol.projection.EPSG3857.HALF_SIZE, ol.projection.EPSG3857.HALF_SIZE, ol.projection.EPSG3857.HALF_SIZE);
ol.projection.EPSG3857.CODES = ["EPSG:3857", "EPSG:102100", "EPSG:102113", "EPSG:900913"];
ol.projection.EPSG3857.PROJECTIONS = goog.array.map(ol.projection.EPSG3857.CODES, function(code) {
  return new ol.projection.EPSG3857(code)
});
ol.projection.EPSG3857.fromEPSG4326 = function(input, opt_output, opt_dimension) {
  var length = input.length, dimension = opt_dimension > 1 ? opt_dimension : 2, output = opt_output;
  if(!goog.isDef(output)) {
    if(dimension > 2) {
      output = input.slice()
    }else {
      output = new Array(length)
    }
  }
  goog.asserts.assert(output.length % dimension === 0);
  for(var i = 0;i < length;i += dimension) {
    output[i] = ol.projection.EPSG3857.RADIUS * Math.PI * input[i] / 180;
    output[i + 1] = ol.projection.EPSG3857.RADIUS * Math.log(Math.tan(Math.PI * (input[i + 1] + 90) / 360))
  }
  return output
};
ol.projection.EPSG3857.toEPSG4326 = function(input, opt_output, opt_dimension) {
  var length = input.length, dimension = opt_dimension > 1 ? opt_dimension : 2, output = opt_output;
  if(!goog.isDef(output)) {
    if(dimension > 2) {
      output = input.slice()
    }else {
      output = new Array(length)
    }
  }
  goog.asserts.assert(output.length % dimension === 0);
  for(var i = 0;i < length;i += dimension) {
    output[i] = 180 * input[i] / (ol.projection.EPSG3857.RADIUS * Math.PI);
    output[i + 1] = 360 * Math.atan(Math.exp(input[i + 1] / ol.projection.EPSG3857.RADIUS)) / Math.PI - 90
  }
  return output
};
ol.projection.EPSG3857.prototype.getPointResolution = function(resolution, point) {
  return resolution / ol.math.cosh(point.y / ol.projection.EPSG3857.RADIUS)
};
goog.provide("ol.projection.EPSG4326");
goog.require("ol.Extent");
goog.require("ol.Projection");
goog.require("ol.ProjectionUnits");
goog.require("ol.projection");
ol.projection.EPSG4326 = function(code, opt_axisOrientation) {
  goog.base(this, code, ol.ProjectionUnits.DEGREES, ol.projection.EPSG4326.EXTENT, opt_axisOrientation)
};
goog.inherits(ol.projection.EPSG4326, ol.Projection);
ol.projection.EPSG4326.EXTENT = new ol.Extent(-180, -90, 180, 90);
ol.projection.EPSG4326.PROJECTIONS = [new ol.projection.EPSG4326("CRS:84"), new ol.projection.EPSG4326("EPSG:4326", "neu"), new ol.projection.EPSG4326("urn:ogc:def:crs:EPSG:6.6:4326", "neu"), new ol.projection.EPSG4326("urn:ogc:def:crs:OGC:1.3:CRS84")];
ol.projection.EPSG4326.prototype.getPointResolution = function(resolution, point) {
  return resolution
};
goog.provide("ol.projection.addCommonProjections");
goog.require("ol.projection");
goog.require("ol.projection.EPSG3857");
goog.require("ol.projection.EPSG4326");
ol.projection.addCommonProjections = function() {
  ol.projection.addEquivalentProjections(ol.projection.EPSG3857.PROJECTIONS);
  ol.projection.addEquivalentProjections(ol.projection.EPSG4326.PROJECTIONS);
  ol.projection.addEquivalentTransforms(ol.projection.EPSG4326.PROJECTIONS, ol.projection.EPSG3857.PROJECTIONS, ol.projection.EPSG3857.fromEPSG4326, ol.projection.EPSG3857.toEPSG4326)
};
goog.provide("ol.Image");
goog.provide("ol.ImageState");
goog.require("goog.array");
goog.require("goog.events");
goog.require("goog.events.EventTarget");
goog.require("goog.events.EventType");
goog.require("ol.Attribution");
goog.require("ol.Extent");
ol.ImageState = {IDLE:0, LOADING:1, LOADED:2, ERROR:3};
ol.Image = function(extent, resolution, src, crossOrigin, attributions) {
  this.attributions_ = attributions;
  this.extent_ = extent;
  this.src_ = src;
  this.resolution_ = resolution;
  this.image_ = new Image;
  if(!goog.isNull(crossOrigin)) {
    this.image_.crossOrigin = crossOrigin
  }
  this.imageByContext_ = {};
  this.imageListenerKeys_ = null;
  this.state = ol.ImageState.IDLE
};
goog.inherits(ol.Image, goog.events.EventTarget);
ol.Image.prototype.dispatchChangeEvent = function() {
  this.dispatchEvent(goog.events.EventType.CHANGE)
};
ol.Image.prototype.getAttributions = function() {
  return this.attributions_
};
ol.Image.prototype.getExtent = function() {
  return this.extent_
};
ol.Image.prototype.getImageElement = function(opt_context) {
  if(goog.isDef(opt_context)) {
    var image;
    var key = goog.getUid(opt_context);
    if(key in this.imageByContext_) {
      return this.imageByContext_[key]
    }else {
      if(goog.object.isEmpty(this.imageByContext_)) {
        image = this.image_
      }else {
        image = this.image_.cloneNode(false)
      }
    }
    this.imageByContext_[key] = image;
    return image
  }else {
    return this.image_
  }
};
ol.Image.prototype.getResolution = function() {
  return this.resolution_
};
ol.Image.prototype.getState = function() {
  return this.state
};
ol.Image.prototype.handleImageError_ = function() {
  this.state = ol.ImageState.ERROR;
  this.unlistenImage_();
  this.dispatchChangeEvent()
};
ol.Image.prototype.handleImageLoad_ = function() {
  this.state = ol.ImageState.LOADED;
  this.unlistenImage_();
  this.dispatchChangeEvent()
};
ol.Image.prototype.load = function() {
  if(this.state == ol.ImageState.IDLE) {
    this.state = ol.ImageState.LOADING;
    goog.asserts.assert(goog.isNull(this.imageListenerKeys_));
    this.imageListenerKeys_ = [goog.events.listenOnce(this.image_, goog.events.EventType.ERROR, this.handleImageError_, false, this), goog.events.listenOnce(this.image_, goog.events.EventType.LOAD, this.handleImageLoad_, false, this)];
    this.image_.src = this.src_
  }
};
ol.Image.prototype.unlistenImage_ = function() {
  goog.asserts.assert(!goog.isNull(this.imageListenerKeys_));
  goog.array.forEach(this.imageListenerKeys_, goog.events.unlistenByKey);
  this.imageListenerKeys_ = null
};
goog.provide("ol.PixelBounds");
goog.require("ol.Rectangle");
ol.PixelBounds = function(minX, minY, maxX, maxY) {
  goog.base(this, minX, minY, maxX, maxY)
};
goog.inherits(ol.PixelBounds, ol.Rectangle);
goog.provide("ol.tilegrid.TileGrid");
goog.require("goog.array");
goog.require("goog.asserts");
goog.require("ol.Coordinate");
goog.require("ol.Extent");
goog.require("ol.PixelBounds");
goog.require("ol.Projection");
goog.require("ol.Size");
goog.require("ol.TileCoord");
goog.require("ol.TileRange");
goog.require("ol.array");
ol.DEFAULT_TILE_SIZE = 256;
ol.DEFAULT_MAX_ZOOM = 42;
ol.tilegrid.TileGrid = function(tileGridOptions) {
  this.resolutions_ = tileGridOptions.resolutions;
  goog.asserts.assert(goog.array.isSorted(this.resolutions_, function(a, b) {
    return b - a
  }, true));
  this.numResolutions_ = this.resolutions_.length;
  this.origin_ = goog.isDef(tileGridOptions.origin) ? tileGridOptions.origin : null;
  this.origins_ = null;
  if(goog.isDef(tileGridOptions.origins)) {
    this.origins_ = tileGridOptions.origins;
    goog.asserts.assert(this.origins_.length == this.resolutions_.length)
  }
  goog.asserts.assert(goog.isNull(this.origin_) && !goog.isNull(this.origins_) || !goog.isNull(this.origin_) && goog.isNull(this.origins_));
  this.tileSizes_ = null;
  if(goog.isDef(tileGridOptions.tileSizes)) {
    this.tileSizes_ = tileGridOptions.tileSizes;
    goog.asserts.assert(this.tileSizes_.length == this.resolutions_.length)
  }
  this.tileSize_ = goog.isDef(tileGridOptions.tileSize) ? tileGridOptions.tileSize : goog.isNull(this.tileSizes_) ? new ol.Size(ol.DEFAULT_TILE_SIZE, ol.DEFAULT_TILE_SIZE) : null;
  goog.asserts.assert(goog.isNull(this.tileSize_) && !goog.isNull(this.tileSizes_) || !goog.isNull(this.tileSize_) && goog.isNull(this.tileSizes_))
};
ol.tilegrid.TileGrid.prototype.forEachTileCoordParentTileRange = function(tileCoord, callback, opt_obj) {
  var tileCoordExtent = this.getTileCoordExtent(tileCoord);
  var z = tileCoord.z - 1;
  while(z >= 0) {
    if(callback.call(opt_obj, z, this.getTileRangeForExtentAndZ(tileCoordExtent, z))) {
      return
    }
    --z
  }
};
ol.tilegrid.TileGrid.prototype.getOrigin = function(z) {
  if(!goog.isNull(this.origin_)) {
    return this.origin_
  }else {
    goog.asserts.assert(!goog.isNull(this.origins_));
    goog.asserts.assert(0 <= z && z < this.origins_.length);
    return this.origins_[z]
  }
};
ol.tilegrid.TileGrid.prototype.getPixelBoundsForTileCoordAndResolution = function(tileCoord, resolution) {
  var scale = resolution / this.getResolution(tileCoord.z);
  var tileSize = this.getTileSize(tileCoord.z);
  tileSize = new ol.Size(tileSize.width / scale, tileSize.height / scale);
  var minX, maxX, minY, maxY;
  minX = Math.round(tileCoord.x * tileSize.width);
  maxX = Math.round((tileCoord.x + 1) * tileSize.width);
  minY = Math.round(tileCoord.y * tileSize.height);
  maxY = Math.round((tileCoord.y + 1) * tileSize.height);
  return new ol.PixelBounds(minX, minY, maxX, maxY)
};
ol.tilegrid.TileGrid.prototype.getResolution = function(z) {
  goog.asserts.assert(0 <= z && z < this.numResolutions_);
  return this.resolutions_[z]
};
ol.tilegrid.TileGrid.prototype.getResolutions = function() {
  return this.resolutions_
};
ol.tilegrid.TileGrid.prototype.getTileRangeExtent = function(z, tileRange) {
  var origin = this.getOrigin(z);
  var resolution = this.getResolution(z);
  var tileSize = this.getTileSize(z);
  var minX = origin.x + tileRange.minX * tileSize.width * resolution;
  var minY = origin.y + tileRange.minY * tileSize.height * resolution;
  var maxX = origin.x + (tileRange.maxX + 1) * tileSize.width * resolution;
  var maxY = origin.y + (tileRange.maxY + 1) * tileSize.height * resolution;
  return new ol.Extent(minX, minY, maxX, maxY)
};
ol.tilegrid.TileGrid.prototype.getTileRangeForExtentAndResolution = function(extent, resolution) {
  var min = this.getTileCoordForCoordAndResolution_(new ol.Coordinate(extent.minX, extent.minY), resolution);
  var max = this.getTileCoordForCoordAndResolution_(new ol.Coordinate(extent.maxX, extent.maxY), resolution, true);
  return new ol.TileRange(min.x, min.y, max.x, max.y)
};
ol.tilegrid.TileGrid.prototype.getTileRangeForExtentAndZ = function(extent, z) {
  var resolution = this.getResolution(z);
  return this.getTileRangeForExtentAndResolution(extent, resolution)
};
ol.tilegrid.TileGrid.prototype.getTileCoordCenter = function(tileCoord) {
  var origin = this.getOrigin(tileCoord.z);
  var resolution = this.getResolution(tileCoord.z);
  var tileSize = this.getTileSize(tileCoord.z);
  var x = origin.x + (tileCoord.x + 0.5) * tileSize.width * resolution;
  var y = origin.y + (tileCoord.y + 0.5) * tileSize.height * resolution;
  return new ol.Coordinate(x, y)
};
ol.tilegrid.TileGrid.prototype.getTileCoordExtent = function(tileCoord) {
  var origin = this.getOrigin(tileCoord.z);
  var resolution = this.getResolution(tileCoord.z);
  var tileSize = this.getTileSize(tileCoord.z);
  var minX = origin.x + tileCoord.x * tileSize.width * resolution;
  var minY = origin.y + tileCoord.y * tileSize.height * resolution;
  var maxX = minX + tileSize.width * resolution;
  var maxY = minY + tileSize.height * resolution;
  return new ol.Extent(minX, minY, maxX, maxY)
};
ol.tilegrid.TileGrid.prototype.getTileCoordForCoordAndResolution = function(coordinate, resolution) {
  return this.getTileCoordForCoordAndResolution_(coordinate, resolution)
};
ol.tilegrid.TileGrid.prototype.getTileCoordForCoordAndResolution_ = function(coordinate, resolution, opt_reverseIntersectionPolicy) {
  var z = this.getZForResolution(resolution);
  var scale = resolution / this.getResolution(z);
  var origin = this.getOrigin(z);
  var tileSize = this.getTileSize(z);
  var x = scale * (coordinate.x - origin.x) / (resolution * tileSize.width);
  var y = scale * (coordinate.y - origin.y) / (resolution * tileSize.height);
  if(!opt_reverseIntersectionPolicy) {
    x = Math.floor(x);
    y = Math.floor(y)
  }else {
    x = Math.ceil(x) - 1;
    y = Math.ceil(y) - 1
  }
  return new ol.TileCoord(z, x, y)
};
ol.tilegrid.TileGrid.prototype.getTileCoordForCoordAndZ = function(coordinate, z) {
  var resolution = this.getResolution(z);
  return this.getTileCoordForCoordAndResolution_(coordinate, resolution)
};
ol.tilegrid.TileGrid.prototype.getTileCoordResolution = function(tileCoord) {
  goog.asserts.assert(0 <= tileCoord.z && tileCoord.z < this.numResolutions_);
  return this.resolutions_[tileCoord.z]
};
ol.tilegrid.TileGrid.prototype.getTileSize = function(z) {
  if(!goog.isNull(this.tileSize_)) {
    return this.tileSize_
  }else {
    goog.asserts.assert(!goog.isNull(this.tileSizes_));
    goog.asserts.assert(0 <= z && z < this.tileSizes_.length);
    return this.tileSizes_[z]
  }
};
ol.tilegrid.TileGrid.prototype.getZForResolution = function(resolution) {
  return ol.array.linearFindNearest(this.resolutions_, resolution)
};
ol.tilegrid.getForProjection = function(projection) {
  var tileGrid = projection.getDefaultTileGrid();
  if(goog.isNull(tileGrid)) {
    tileGrid = ol.tilegrid.createForProjection(projection);
    projection.setDefaultTileGrid(tileGrid)
  }
  return tileGrid
};
ol.tilegrid.createForProjection = function(projection, opt_maxZoom, opt_tileSize) {
  var projectionExtent = projection.getExtent();
  var size = Math.max(projectionExtent.maxX - projectionExtent.minX, projectionExtent.maxY - projectionExtent.minY);
  var maxZoom = goog.isDef(opt_maxZoom) ? opt_maxZoom : ol.DEFAULT_MAX_ZOOM;
  var tileSize = goog.isDef(opt_tileSize) ? opt_tileSize : new ol.Size(ol.DEFAULT_TILE_SIZE, ol.DEFAULT_TILE_SIZE);
  var resolutions = new Array(maxZoom + 1);
  goog.asserts.assert(tileSize.width == tileSize.height);
  size = size / tileSize.width;
  for(var z = 0, zz = resolutions.length;z < zz;++z) {
    resolutions[z] = size / Math.pow(2, z)
  }
  return new ol.tilegrid.TileGrid({origin:projectionExtent.getTopLeft(), resolutions:resolutions, tileSize:tileSize})
};
goog.provide("ol.source.TileSource");
goog.provide("ol.source.TileSourceOptions");
goog.require("goog.functions");
goog.require("ol.Attribution");
goog.require("ol.Extent");
goog.require("ol.Projection");
goog.require("ol.Tile");
goog.require("ol.TileCoord");
goog.require("ol.TileRange");
goog.require("ol.source.Source");
goog.require("ol.tilegrid.TileGrid");
ol.source.TileSourceOptions;
ol.source.TileSource = function(tileSourceOptions) {
  goog.base(this, {attributions:tileSourceOptions.attributions, extent:tileSourceOptions.extent, projection:tileSourceOptions.projection});
  this.opaque_ = goog.isDef(tileSourceOptions.opaque) ? tileSourceOptions.opaque : false;
  this.tileGrid = goog.isDef(tileSourceOptions.tileGrid) ? tileSourceOptions.tileGrid : null
};
goog.inherits(ol.source.TileSource, ol.source.Source);
ol.source.TileSource.prototype.canExpireCache = goog.functions.FALSE;
ol.source.TileSource.prototype.expireCache = goog.abstractMethod;
ol.source.TileSource.prototype.findLoadedTiles = function(loadedTilesByZ, getTileIfLoaded, z, tileRange) {
  var fullyCovered = true;
  var tile, tileCoord, tileCoordKey, x, y;
  for(x = tileRange.minX;x <= tileRange.maxX;++x) {
    for(y = tileRange.minY;y <= tileRange.maxY;++y) {
      tileCoord = new ol.TileCoord(z, x, y);
      tileCoordKey = tileCoord.toString();
      if(loadedTilesByZ[z] && loadedTilesByZ[z][tileCoordKey]) {
        continue
      }
      tile = getTileIfLoaded(tileCoord);
      if(!goog.isNull(tile)) {
        if(!loadedTilesByZ[z]) {
          loadedTilesByZ[z] = {}
        }
        loadedTilesByZ[z][tileCoordKey] = tile
      }else {
        fullyCovered = false
      }
    }
  }
  return fullyCovered
};
ol.source.TileSource.prototype.getOpaque = function() {
  return this.opaque_
};
ol.source.TileSource.prototype.getResolutions = function() {
  return this.tileGrid.getResolutions()
};
ol.source.TileSource.prototype.getTile = goog.abstractMethod;
ol.source.TileSource.prototype.getTileGrid = function() {
  return this.tileGrid
};
ol.source.TileSource.prototype.useLowResolutionTiles = function(z, extent, tileGrid) {
  var tileRange, x, y, zKey;
  for(;z >= 0;--z) {
    tileRange = tileGrid.getTileRangeForExtentAndZ(extent, z);
    for(x = tileRange.minX;x <= tileRange.maxX;++x) {
      for(y = tileRange.minY;y <= tileRange.maxY;++y) {
        this.useTile(z + "/" + x + "/" + y)
      }
    }
  }
};
ol.source.TileSource.prototype.useTile = goog.nullFunction;
goog.provide("ol.renderer.Layer");
goog.require("goog.events");
goog.require("goog.events.EventType");
goog.require("ol.Attribution");
goog.require("ol.FrameState");
goog.require("ol.Image");
goog.require("ol.ImageState");
goog.require("ol.Object");
goog.require("ol.Tile");
goog.require("ol.TileCoord");
goog.require("ol.TileRange");
goog.require("ol.TileState");
goog.require("ol.layer.Layer");
goog.require("ol.layer.LayerProperty");
goog.require("ol.layer.LayerState");
goog.require("ol.source.TileSource");
ol.renderer.Layer = function(mapRenderer, layer) {
  goog.base(this);
  this.mapRenderer_ = mapRenderer;
  this.layer_ = layer;
  this.observedTileKeys = {};
  goog.events.listen(this.layer_, ol.Object.getChangedEventType(ol.layer.LayerProperty.BRIGHTNESS), this.handleLayerBrightnessChange, false, this);
  goog.events.listen(this.layer_, ol.Object.getChangedEventType(ol.layer.LayerProperty.CONTRAST), this.handleLayerContrastChange, false, this);
  goog.events.listen(this.layer_, ol.Object.getChangedEventType(ol.layer.LayerProperty.HUE), this.handleLayerHueChange, false, this);
  goog.events.listen(this.layer_, goog.events.EventType.LOAD, this.handleLayerLoad, false, this);
  goog.events.listen(this.layer_, ol.Object.getChangedEventType(ol.layer.LayerProperty.OPACITY), this.handleLayerOpacityChange, false, this);
  goog.events.listen(this.layer_, ol.Object.getChangedEventType(ol.layer.LayerProperty.SATURATION), this.handleLayerSaturationChange, false, this);
  goog.events.listen(this.layer_, ol.Object.getChangedEventType(ol.layer.LayerProperty.VISIBLE), this.handleLayerVisibleChange, false, this)
};
goog.inherits(ol.renderer.Layer, ol.Object);
ol.renderer.Layer.prototype.dispatchChangeEvent = function() {
  this.dispatchEvent(goog.events.EventType.CHANGE)
};
ol.renderer.Layer.prototype.getLayer = function() {
  return this.layer_
};
ol.renderer.Layer.prototype.getMap = function() {
  return this.mapRenderer_.getMap()
};
ol.renderer.Layer.prototype.getMapRenderer = function() {
  return this.mapRenderer_
};
ol.renderer.Layer.prototype.handleLayerBrightnessChange = goog.nullFunction;
ol.renderer.Layer.prototype.handleLayerContrastChange = goog.nullFunction;
ol.renderer.Layer.prototype.handleLayerHueChange = goog.nullFunction;
ol.renderer.Layer.prototype.handleImageChange = function(event) {
  var image = event.target;
  if(image.getState() === ol.ImageState.LOADED) {
    this.getMap().requestRenderFrame()
  }
};
ol.renderer.Layer.prototype.handleLayerLoad = function() {
  this.dispatchChangeEvent()
};
ol.renderer.Layer.prototype.handleLayerOpacityChange = function() {
  this.dispatchChangeEvent()
};
ol.renderer.Layer.prototype.handleLayerSaturationChange = goog.nullFunction;
ol.renderer.Layer.prototype.handleLayerVisibleChange = function() {
  this.dispatchChangeEvent()
};
ol.renderer.Layer.prototype.handleTileChange_ = function(event) {
  var tile = event.target;
  if(tile.getState() === ol.TileState.LOADED) {
    this.getMap().requestRenderFrame()
  }
  delete this.observedTileKeys[tile.getKey()]
};
ol.renderer.Layer.prototype.listenToTileChange = function(tile) {
  var tileKey = tile.getKey();
  if(!(tileKey in this.observedTileKeys)) {
    this.observedTileKeys[tileKey] = true;
    goog.events.listenOnce(tile, goog.events.EventType.CHANGE, this.handleTileChange_, false, this)
  }
};
ol.renderer.Layer.prototype.renderFrame = goog.abstractMethod;
ol.renderer.Layer.prototype.scheduleExpireCache = function(frameState, tileSource) {
  if(tileSource.canExpireCache()) {
    frameState.postRenderFunctions.push(goog.partial(function(tileSource, map, frameState) {
      var tileSourceKey = goog.getUid(tileSource).toString();
      tileSource.expireCache(frameState.usedTiles[tileSourceKey])
    }, tileSource))
  }
};
ol.renderer.Layer.prototype.updateAttributions = function(attributionsSet, attributions) {
  var i;
  var attribution;
  for(i = 0;i < attributions.length;++i) {
    attribution = attributions[i];
    attributionsSet[goog.getUid(attribution).toString()] = attribution
  }
};
ol.renderer.Layer.prototype.updateUsedTiles = function(usedTiles, tileSource, z, tileRange) {
  var tileSourceKey = goog.getUid(tileSource).toString();
  var zKey = z.toString();
  if(tileSourceKey in usedTiles) {
    if(zKey in usedTiles[tileSourceKey]) {
      usedTiles[tileSourceKey][zKey].extend(tileRange)
    }else {
      usedTiles[tileSourceKey][zKey] = tileRange
    }
  }else {
    usedTiles[tileSourceKey] = {};
    usedTiles[tileSourceKey][zKey] = tileRange
  }
};
ol.renderer.Layer.prototype.updateWantedTiles = function(wantedTiles, tileSource, tileCoord) {
  var tileSourceKey = goog.getUid(tileSource).toString();
  var coordKey = tileCoord.toString();
  if(!(tileSourceKey in wantedTiles)) {
    wantedTiles[tileSourceKey] = {}
  }
  wantedTiles[tileSourceKey][coordKey] = true
};
ol.renderer.Layer.prototype.createGetTileIfLoadedFunction = function(isLoadedFunction, tileSource, tileGrid, projection) {
  return function(tileCoord) {
    var tile = tileSource.getTile(tileCoord, tileGrid, projection);
    return isLoadedFunction(tile) ? tile : null
  }
};
goog.provide("ol.renderer.Map");
goog.require("goog.Disposable");
goog.require("goog.array");
goog.require("goog.asserts");
goog.require("goog.events");
goog.require("goog.functions");
goog.require("goog.vec.Mat4");
goog.require("ol.CollectionEvent");
goog.require("ol.CollectionEventType");
goog.require("ol.FrameState");
goog.require("ol.Object");
goog.require("ol.layer.Layer");
goog.require("ol.renderer.Layer");
ol.renderer.Map = function(container, map) {
  goog.base(this);
  this.container_ = container;
  this.map = map;
  this.layerRenderers = {};
  this.mapLayersChangedListenerKey_ = goog.events.listen(map, ol.Object.getChangedEventType(ol.MapProperty.LAYERS), this.handleLayersChanged, false, this);
  this.layersListenerKeys_ = null;
  this.layerRendererChangeListenKeys_ = {}
};
goog.inherits(ol.renderer.Map, goog.Disposable);
ol.renderer.Map.prototype.addLayer = function(layer) {
  var layerRenderer = this.createLayerRenderer(layer);
  this.setLayerRenderer(layer, layerRenderer)
};
ol.renderer.Map.prototype.calculateMatrices2D = function(frameState) {
  var view2DState = frameState.view2DState;
  var coordinateToPixelMatrix = frameState.coordinateToPixelMatrix;
  goog.vec.Mat4.makeIdentity(coordinateToPixelMatrix);
  goog.vec.Mat4.translate(coordinateToPixelMatrix, frameState.size.width / 2, frameState.size.height / 2, 0);
  goog.vec.Mat4.scale(coordinateToPixelMatrix, 1 / view2DState.resolution, -1 / view2DState.resolution, 1);
  goog.vec.Mat4.rotateZ(coordinateToPixelMatrix, -view2DState.rotation);
  goog.vec.Mat4.translate(coordinateToPixelMatrix, -view2DState.center.x, -view2DState.center.y, 0);
  var inverted = goog.vec.Mat4.invert(coordinateToPixelMatrix, frameState.pixelToCoordinateMatrix);
  goog.asserts.assert(inverted)
};
ol.renderer.Map.prototype.createLayerRenderer = function(layer) {
  return new ol.renderer.Layer(this, layer)
};
ol.renderer.Map.prototype.disposeInternal = function() {
  goog.object.forEach(this.layerRenderers, function(layerRenderer) {
    goog.dispose(layerRenderer)
  });
  goog.events.unlistenByKey(this.mapLayersChangedListenerKey_);
  if(!goog.isNull(this.layersListenerKeys_)) {
    goog.array.forEach(this.layersListenerKeys_, goog.events.unlistenByKey)
  }
  goog.base(this, "disposeInternal")
};
ol.renderer.Map.prototype.getCanvas = goog.functions.NULL;
ol.renderer.Map.prototype.getLayerRenderer = function(layer) {
  var layerKey = goog.getUid(layer);
  var layerRenderer = this.layerRenderers[layerKey];
  goog.asserts.assert(goog.isDef(layerRenderer));
  return layerRenderer
};
ol.renderer.Map.prototype.getMap = function() {
  return this.map
};
ol.renderer.Map.prototype.handleLayerRendererChange = function(event) {
  this.getMap().render()
};
ol.renderer.Map.prototype.handleLayersAdd = function(collectionEvent) {
  var layer = collectionEvent.elem;
  this.addLayer(layer)
};
ol.renderer.Map.prototype.handleLayersChanged = function() {
  goog.disposeAll(goog.object.getValues(this.layerRenderers));
  this.layerRenderers = {};
  if(!goog.isNull(this.layersListenerKeys_)) {
    goog.array.forEach(this.layersListenerKeys_, goog.events.unlistenByKey);
    this.layersListenerKeys_ = null
  }
  var layers = this.map.getLayers();
  if(goog.isDefAndNotNull(layers)) {
    layers.forEach(this.addLayer, this);
    this.layersListenerKeys_ = [goog.events.listen(layers, ol.CollectionEventType.ADD, this.handleLayersAdd, false, this), goog.events.listen(layers, ol.CollectionEventType.REMOVE, this.handleLayersRemove, false, this)]
  }
};
ol.renderer.Map.prototype.handleLayersRemove = function(collectionEvent) {
  var layer = collectionEvent.elem;
  this.removeLayer(layer)
};
ol.renderer.Map.prototype.removeLayer = function(layer) {
  goog.dispose(this.removeLayerRenderer(layer))
};
ol.renderer.Map.prototype.removeLayerRenderer = function(layer) {
  var layerKey = goog.getUid(layer);
  if(layerKey in this.layerRenderers) {
    var layerRenderer = this.layerRenderers[layerKey];
    delete this.layerRenderers[layerKey];
    goog.events.unlistenByKey(this.layerRendererChangeListenKeys_[layerKey]);
    delete this.layerRendererChangeListenKeys_[layerKey];
    return layerRenderer
  }else {
    return null
  }
};
ol.renderer.Map.prototype.renderFrame = goog.nullFunction;
ol.renderer.Map.prototype.setLayerRenderer = function(layer, layerRenderer) {
  var layerKey = goog.getUid(layer);
  goog.asserts.assert(!(layerKey in this.layerRenderers));
  this.layerRenderers[layerKey] = layerRenderer;
  goog.asserts.assert(!(layerKey in this.layerRendererChangeListenKeys_));
  this.layerRendererChangeListenKeys_[layerKey] = goog.events.listen(layerRenderer, goog.events.EventType.CHANGE, this.handleLayerRendererChange, false, this)
};
goog.provide("ol.source.wms");
ol.source.wms.getUrl = function(baseUrl, params, extent, size, projection) {
  var baseParams = {"SERVICE":"WMS", "VERSION":"1.3.0", "REQUEST":"GetMap", "FORMAT":"image/png", "TRANSPARENT":true, "WIDTH":size.width, "HEIGHT":size.height};
  goog.object.extend(baseParams, params);
  var stylesParam = "STYLES";
  baseParams[stylesParam] = params[stylesParam] || new String("");
  var wms13 = baseParams["VERSION"] > "1.3";
  baseParams[wms13 ? "CRS" : "SRS"] = projection.getCode();
  var axisOrientation = projection.getAxisOrientation();
  var bboxValues = wms13 && axisOrientation.substr(0, 2) == "ne" ? [extent.minY, extent.minX, extent.maxY, extent.maxX] : [extent.minX, extent.minY, extent.maxX, extent.maxY];
  baseParams["BBOX"] = bboxValues.join(",");
  return goog.uri.utils.appendParamsFromMap(baseUrl, baseParams)
};
goog.provide("ol.ImageUrlFunction");
goog.provide("ol.ImageUrlFunctionType");
goog.require("ol.Extent");
goog.require("ol.Size");
goog.require("ol.source.wms");
ol.ImageUrlFunctionType;
ol.ImageUrlFunction.createWMSParams = function(baseUrl, params) {
  return function(extent, size, projection) {
    return ol.source.wms.getUrl(baseUrl, params, extent, size, projection)
  }
};
ol.ImageUrlFunction.nullImageUrlFunction = function(extent, size) {
  return undefined
};
goog.provide("ol.source.ImageSource");
goog.require("goog.array");
goog.require("ol.Attribution");
goog.require("ol.Extent");
goog.require("ol.Image");
goog.require("ol.ImageUrlFunction");
goog.require("ol.ImageUrlFunctionType");
goog.require("ol.Projection");
goog.require("ol.Size");
goog.require("ol.array");
goog.require("ol.source.Source");
ol.source.ImageSourceOptions;
ol.source.ImageSource = function(options) {
  goog.base(this, {attributions:options.attributions, extent:options.extent, projection:options.projection});
  this.imageUrlFunction = goog.isDef(options.imageUrlFunction) ? options.imageUrlFunction : ol.ImageUrlFunction.nullImageUrlFunction;
  this.crossOrigin_ = goog.isDef(options.crossOrigin) ? options.crossOrigin : "anonymous";
  this.resolutions_ = goog.isDef(options.resolutions) ? options.resolutions : null;
  goog.asserts.assert(goog.isNull(this.resolutions_) || goog.array.isSorted(this.resolutions_, function(a, b) {
    return b - a
  }, true))
};
goog.inherits(ol.source.ImageSource, ol.source.Source);
ol.source.ImageSource.prototype.createImage = function(extent, resolution, size, projection) {
  var image = null;
  var imageUrl = this.imageUrlFunction(extent, size, projection);
  if(goog.isDef(imageUrl)) {
    image = new ol.Image(extent, resolution, imageUrl, this.crossOrigin_, this.getAttributions())
  }
  return image
};
ol.source.ImageSource.prototype.findNearestResolution = function(resolution) {
  if(!goog.isNull(this.resolutions_)) {
    var idx = ol.array.linearFindNearest(this.resolutions_, resolution);
    resolution = this.resolutions_[idx]
  }
  return resolution
};
ol.source.ImageSource.prototype.getImage = goog.abstractMethod;
goog.provide("ol.layer.ImageLayer");
goog.require("ol.layer.Layer");
goog.require("ol.source.ImageSource");
ol.layer.ImageLayer = function(layerOptions) {
  goog.base(this, layerOptions)
};
goog.inherits(ol.layer.ImageLayer, ol.layer.Layer);
ol.layer.ImageLayer.prototype.getImageSource = function() {
  return this.getSource()
};
goog.provide("ol.layer.TileLayer");
goog.require("ol.layer.Layer");
goog.require("ol.source.TileSource");
ol.layer.TileLayer = function(layerOptions) {
  goog.base(this, layerOptions)
};
goog.inherits(ol.layer.TileLayer, ol.layer.Layer);
ol.layer.TileLayer.prototype.getTileSource = function() {
  return this.getSource()
};
goog.provide("ol.renderer.canvas.Layer");
goog.require("ol.layer.Layer");
goog.require("ol.renderer.Layer");
ol.renderer.canvas.Layer = function(mapRenderer, layer) {
  goog.base(this, mapRenderer, layer)
};
goog.inherits(ol.renderer.canvas.Layer, ol.renderer.Layer);
ol.renderer.canvas.Layer.prototype.getImage = goog.abstractMethod;
ol.renderer.canvas.Layer.prototype.getTransform = goog.abstractMethod;
goog.provide("ol.renderer.canvas.ImageLayer");
goog.require("goog.vec.Mat4");
goog.require("ol.Image");
goog.require("ol.ImageState");
goog.require("ol.ViewHint");
goog.require("ol.layer.ImageLayer");
goog.require("ol.renderer.Map");
goog.require("ol.renderer.canvas.Layer");
ol.renderer.canvas.ImageLayer = function(mapRenderer, imageLayer) {
  goog.base(this, mapRenderer, imageLayer);
  this.image_ = null;
  this.transform_ = goog.vec.Mat4.createNumber()
};
goog.inherits(ol.renderer.canvas.ImageLayer, ol.renderer.canvas.Layer);
ol.renderer.canvas.ImageLayer.prototype.getImage = function() {
  return goog.isNull(this.image_) ? null : this.image_.getImageElement(this)
};
ol.renderer.canvas.ImageLayer.prototype.getImageLayer = function() {
  return this.getLayer()
};
ol.renderer.canvas.ImageLayer.prototype.getTransform = function() {
  return this.transform_
};
ol.renderer.canvas.ImageLayer.prototype.renderFrame = function(frameState, layerState) {
  var view2DState = frameState.view2DState;
  var viewCenter = view2DState.center;
  var viewResolution = view2DState.resolution;
  var viewRotation = view2DState.rotation;
  var image;
  var imageLayer = this.getImageLayer();
  var imageSource = imageLayer.getImageSource();
  var hints = frameState.viewHints;
  if(!hints[ol.ViewHint.ANIMATING] && !hints[ol.ViewHint.INTERACTING]) {
    image = imageSource.getImage(frameState.extent, viewResolution, view2DState.projection);
    if(!goog.isNull(image)) {
      var imageState = image.getState();
      if(imageState == ol.ImageState.IDLE) {
        goog.events.listenOnce(image, goog.events.EventType.CHANGE, this.handleImageChange, false, this);
        image.load()
      }else {
        if(imageState == ol.ImageState.LOADED) {
          this.image_ = image
        }
      }
    }
  }
  if(!goog.isNull(this.image_)) {
    image = this.image_;
    var imageExtent = image.getExtent();
    var imageResolution = image.getResolution();
    var transform = this.transform_;
    goog.vec.Mat4.makeIdentity(transform);
    goog.vec.Mat4.translate(transform, frameState.size.width / 2, frameState.size.height / 2, 0);
    goog.vec.Mat4.rotateZ(transform, viewRotation);
    goog.vec.Mat4.scale(transform, imageResolution / viewResolution, imageResolution / viewResolution, 1);
    goog.vec.Mat4.translate(transform, (imageExtent.minX - viewCenter.x) / imageResolution, (viewCenter.y - imageExtent.maxY) / imageResolution, 0);
    this.updateAttributions(frameState.attributions, image.getAttributions())
  }
};
goog.provide("ol.renderer.canvas.TileLayer");
goog.require("goog.array");
goog.require("goog.dom");
goog.require("goog.vec.Mat4");
goog.require("ol.Size");
goog.require("ol.Tile");
goog.require("ol.TileCoord");
goog.require("ol.TileState");
goog.require("ol.layer.TileLayer");
goog.require("ol.renderer.Map");
goog.require("ol.renderer.canvas.Layer");
ol.renderer.canvas.TileLayer = function(mapRenderer, tileLayer) {
  goog.base(this, mapRenderer, tileLayer);
  this.canvas_ = null;
  this.canvasSize_ = null;
  this.context_ = null;
  this.transform_ = goog.vec.Mat4.createNumber();
  this.renderedTiles_ = null
};
goog.inherits(ol.renderer.canvas.TileLayer, ol.renderer.canvas.Layer);
ol.renderer.canvas.TileLayer.prototype.getImage = function() {
  return this.canvas_
};
ol.renderer.canvas.TileLayer.prototype.getTileLayer = function() {
  return this.getLayer()
};
ol.renderer.canvas.TileLayer.prototype.getTransform = function() {
  return this.transform_
};
ol.renderer.canvas.TileLayer.prototype.renderFrame = function(frameState, layerState) {
  var view2DState = frameState.view2DState;
  var projection = view2DState.projection;
  var tileLayer = this.getTileLayer();
  var tileSource = tileLayer.getTileSource();
  var tileSourceKey = goog.getUid(tileSource).toString();
  var tileGrid = tileSource.getTileGrid();
  if(goog.isNull(tileGrid)) {
    tileGrid = ol.tilegrid.getForProjection(projection)
  }
  var z = tileGrid.getZForResolution(view2DState.resolution);
  var tileSize = tileGrid.getTileSize(z);
  var tileResolution = tileGrid.getResolution(z);
  var tileRange = tileGrid.getTileRangeForExtentAndResolution(frameState.extent, tileResolution);
  var tileRangeWidth = tileRange.getWidth();
  var tileRangeHeight = tileRange.getHeight();
  var canvasSize = new ol.Size(tileSize.width * tileRangeWidth, tileSize.height * tileRangeHeight);
  var canvas, context;
  if(goog.isNull(this.canvas_)) {
    canvas = goog.dom.createElement(goog.dom.TagName.CANVAS);
    canvas.width = canvasSize.width;
    canvas.height = canvasSize.height;
    context = canvas.getContext("2d");
    this.canvas_ = canvas;
    this.canvasSize_ = canvasSize;
    this.context_ = context;
    this.renderedTiles_ = new Array(tileRangeWidth * tileRangeHeight)
  }else {
    canvas = this.canvas_;
    context = this.context_;
    if(!this.canvasSize_.equals(canvasSize)) {
      canvas.width = canvasSize.width;
      canvas.height = canvasSize.height;
      this.canvasSize_ = canvasSize;
      this.renderedTiles_ = new Array(tileRangeWidth * tileRangeHeight)
    }
  }
  var tilesToDrawByZ = {};
  tilesToDrawByZ[z] = {};
  var getTileIfLoaded = this.createGetTileIfLoadedFunction(function(tile) {
    return!goog.isNull(tile) && tile.getState() == ol.TileState.LOADED
  }, tileSource, tileGrid, projection);
  var findLoadedTiles = goog.bind(tileSource.findLoadedTiles, tileSource, tilesToDrawByZ, getTileIfLoaded);
  var allTilesLoaded = true;
  var tile, tileCenter, tileCoord, tileState, x, y;
  for(x = tileRange.minX;x <= tileRange.maxX;++x) {
    for(y = tileRange.minY;y <= tileRange.maxY;++y) {
      tileCoord = new ol.TileCoord(z, x, y);
      tile = tileSource.getTile(tileCoord, tileGrid, projection);
      if(goog.isNull(tile)) {
        continue
      }
      tileState = tile.getState();
      if(tileState == ol.TileState.IDLE) {
        this.listenToTileChange(tile);
        this.updateWantedTiles(frameState.wantedTiles, tileSource, tileCoord);
        tileCenter = tileGrid.getTileCoordCenter(tileCoord);
        frameState.tileQueue.enqueue(tile, tileSourceKey, tileCenter)
      }else {
        if(tileState == ol.TileState.LOADED) {
          tilesToDrawByZ[z][tileCoord.toString()] = tile;
          continue
        }else {
          if(tileState == ol.TileState.ERROR) {
            continue
          }
        }
      }
      allTilesLoaded = false;
      tileGrid.forEachTileCoordParentTileRange(tileCoord, findLoadedTiles)
    }
  }
  var zs = goog.array.map(goog.object.getKeys(tilesToDrawByZ), Number);
  goog.array.sort(zs);
  var opaque = tileSource.getOpaque();
  var origin = tileGrid.getTileCoordExtent(new ol.TileCoord(z, tileRange.minX, tileRange.maxY)).getTopLeft();
  var currentZ, i, index, scale, tileCoordKey, tileExtent, tilesToDraw;
  var ix, iy, interimTileExtent, interimTileRange, maxX, maxY, minX, minY;
  var height, width;
  for(i = 0;i < zs.length;++i) {
    currentZ = zs[i];
    tileSize = tileGrid.getTileSize(currentZ);
    tilesToDraw = tilesToDrawByZ[currentZ];
    if(currentZ == z) {
      for(tileCoordKey in tilesToDraw) {
        tile = tilesToDraw[tileCoordKey];
        tileCoord = tile.tileCoord;
        index = (tileCoord.y - tileRange.minY) * tileRangeWidth + (tileCoord.x - tileRange.minX);
        if(this.renderedTiles_[index] != tile) {
          x = tileSize.width * (tile.tileCoord.x - tileRange.minX);
          y = tileSize.height * (tileRange.maxY - tile.tileCoord.y);
          if(!opaque) {
            context.clearRect(x, y, tileSize.width, tileSize.height)
          }
          context.drawImage(tile.getImage(), x, y);
          this.renderedTiles_[index] = tile
        }
      }
    }else {
      scale = tileGrid.getResolution(currentZ) / tileResolution;
      for(tileCoordKey in tilesToDraw) {
        tile = tilesToDraw[tileCoordKey];
        tileExtent = tileGrid.getTileCoordExtent(tile.tileCoord);
        x = (tileExtent.minX - origin.x) / tileResolution;
        y = (origin.y - tileExtent.maxY) / tileResolution;
        width = scale * tileSize.width;
        height = scale * tileSize.height;
        if(!opaque) {
          context.clearRect(x, y, width, height)
        }
        context.drawImage(tile.getImage(), x, y, width, height);
        interimTileRange = tileGrid.getTileRangeForExtentAndZ(tileExtent, z);
        minX = Math.max(interimTileRange.minX, tileRange.minX);
        maxX = Math.min(interimTileRange.maxX, tileRange.maxX);
        minY = Math.max(interimTileRange.minY, tileRange.minY);
        maxY = Math.min(interimTileRange.maxY, tileRange.maxY);
        for(ix = minX;ix <= maxX;++ix) {
          for(iy = minY;iy <= maxY;++iy) {
            this.renderedTiles_[(iy - tileRange.minY) * tileRangeWidth + (ix - tileRange.minX)] = undefined
          }
        }
      }
    }
  }
  this.updateUsedTiles(frameState.usedTiles, tileSource, z, tileRange);
  tileSource.useLowResolutionTiles(z, frameState.extent, tileGrid);
  this.scheduleExpireCache(frameState, tileSource);
  var transform = this.transform_;
  goog.vec.Mat4.makeIdentity(transform);
  goog.vec.Mat4.translate(transform, frameState.size.width / 2, frameState.size.height / 2, 0);
  goog.vec.Mat4.rotateZ(transform, view2DState.rotation);
  goog.vec.Mat4.scale(transform, tileResolution / view2DState.resolution, tileResolution / view2DState.resolution, 1);
  goog.vec.Mat4.translate(transform, (origin.x - view2DState.center.x) / tileResolution, (view2DState.center.y - origin.y) / tileResolution, 0)
};
goog.provide("ol.renderer.canvas.Map");
goog.require("goog.array");
goog.require("goog.dom");
goog.require("goog.style");
goog.require("goog.vec.Mat4");
goog.require("ol.Size");
goog.require("ol.layer.ImageLayer");
goog.require("ol.layer.TileLayer");
goog.require("ol.renderer.Map");
goog.require("ol.renderer.canvas.ImageLayer");
goog.require("ol.renderer.canvas.TileLayer");
ol.renderer.canvas.Map = function(container, map) {
  goog.base(this, container, map);
  this.canvasSize_ = new ol.Size(container.clientHeight, container.clientWidth);
  this.canvas_ = goog.dom.createElement(goog.dom.TagName.CANVAS);
  this.canvas_.height = this.canvasSize_.height;
  this.canvas_.width = this.canvasSize_.width;
  this.canvas_.className = "ol-unselectable";
  goog.dom.insertChildAt(container, this.canvas_, 0);
  this.renderedVisible_ = true;
  this.context_ = this.canvas_.getContext("2d")
};
goog.inherits(ol.renderer.canvas.Map, ol.renderer.Map);
ol.renderer.canvas.Map.prototype.createLayerRenderer = function(layer) {
  if(layer instanceof ol.layer.ImageLayer) {
    return new ol.renderer.canvas.ImageLayer(this, layer)
  }else {
    if(layer instanceof ol.layer.TileLayer) {
      return new ol.renderer.canvas.TileLayer(this, layer)
    }else {
      goog.asserts.assert(false);
      return null
    }
  }
};
ol.renderer.canvas.Map.prototype.getCanvas = function() {
  return this.canvas_
};
ol.renderer.canvas.Map.prototype.renderFrame = function(frameState) {
  if(goog.isNull(frameState)) {
    if(this.renderedVisible_) {
      goog.style.showElement(this.canvas_, false);
      this.renderedVisible_ = false
    }
    return
  }
  var size = frameState.size;
  if(!this.canvasSize_.equals(size)) {
    this.canvas_.width = size.width;
    this.canvas_.height = size.height;
    this.canvasSize_ = size
  }
  var context = this.context_;
  context.setTransform(1, 0, 0, 1, 0, 0);
  var backgroundColor = frameState.backgroundColor;
  context.fillStyle = "rgb(" + backgroundColor.r.toFixed(0) + "," + backgroundColor.g.toFixed(0) + "," + backgroundColor.b.toFixed(0) + ")";
  context.globalAlpha = 1;
  context.fillRect(0, 0, size.width, size.height);
  goog.array.forEach(frameState.layersArray, function(layer) {
    var layerState = frameState.layerStates[goog.getUid(layer)];
    if(!layerState.visible) {
      return
    }else {
      if(!layerState.ready) {
        frameState.animate = true;
        return
      }
    }
    var layerRenderer = this.getLayerRenderer(layer);
    layerRenderer.renderFrame(frameState, layerState);
    var image = layerRenderer.getImage();
    if(!goog.isNull(image)) {
      var transform = layerRenderer.getTransform();
      context.setTransform(goog.vec.Mat4.getElement(transform, 0, 0), goog.vec.Mat4.getElement(transform, 1, 0), goog.vec.Mat4.getElement(transform, 0, 1), goog.vec.Mat4.getElement(transform, 1, 1), goog.vec.Mat4.getElement(transform, 0, 3), goog.vec.Mat4.getElement(transform, 1, 3));
      context.globalAlpha = layerState.opacity;
      context.drawImage(image, 0, 0)
    }
  }, this);
  if(!this.renderedVisible_) {
    goog.style.showElement(this.canvas_, true);
    this.renderedVisible_ = true
  }
  this.calculateMatrices2D(frameState)
};
goog.provide("ol.canvas");
goog.require("goog.dom");
goog.require("goog.dom.TagName");
ol.canvas.SUPPORTED = function() {
  if(!("HTMLCanvasElement" in goog.global)) {
    return false
  }
  try {
    var canvas = goog.dom.createElement(goog.dom.TagName.CANVAS);
    return!goog.isNull(canvas.getContext("2d"))
  }catch(e) {
    return false
  }
}();
goog.provide("ol.renderer.canvas.SUPPORTED");
goog.require("ol.canvas");
ol.renderer.canvas.SUPPORTED = ol.canvas.SUPPORTED;
goog.provide("ol.dom");
goog.provide("ol.dom.BrowserFeature");
goog.require("goog.vec.Mat4");
ol.dom.BrowserFeature = {CAN_USE_CSS_TRANSFORM:false, CAN_USE_CSS_TRANSFORM3D:true, CAN_USE_MATRIX_FILTER:false};
ol.dom.setTransform = function(element, value) {
  var style = element.style;
  style.WebkitTransform = value;
  style.MozTransform = value;
  style.OTransform = value;
  style.transform = value
};
ol.dom.transformElement2D = function(element, transform, opt_precision) {
  var i;
  if(ol.dom.BrowserFeature.CAN_USE_CSS_TRANSFORM3D) {
    var value3D;
    if(goog.isDef(opt_precision)) {
      var strings3D = new Array(16);
      for(i = 0;i < 16;++i) {
        strings3D[i] = transform[i].toFixed(opt_precision)
      }
      value3D = strings3D.join(",")
    }else {
      value3D = transform.join(",")
    }
    ol.dom.setTransform(element, "matrix3d(" + value3D + ")")
  }else {
    if(ol.dom.BrowserFeature.CAN_USE_CSS_TRANSFORM) {
      var transform2D = [goog.vec.Mat4.getElement(transform, 0, 0), goog.vec.Mat4.getElement(transform, 1, 0), goog.vec.Mat4.getElement(transform, 0, 1), goog.vec.Mat4.getElement(transform, 1, 1), goog.vec.Mat4.getElement(transform, 0, 3), goog.vec.Mat4.getElement(transform, 1, 3)];
      var value2D;
      if(goog.isDef(opt_precision)) {
        var strings2D = new Array(6);
        for(i = 0;i < 6;++i) {
          strings2D[i] = transform2D[i].toFixed(opt_precision)
        }
        value2D = strings2D.join(",")
      }else {
        value2D = transform2D.join(",")
      }
      ol.dom.setTransform(element, "matrix(" + value2D + ")")
    }else {
      if(ol.dom.BrowserFeature.CAN_USE_MATRIX_FILTER) {
        goog.asserts.assert(false)
      }else {
        var style = element.style;
        style.left = Math.round(goog.vec.Mat4.getElement(transform, 0, 3)) + "px";
        style.top = Math.round(goog.vec.Mat4.getElement(transform, 1, 3)) + "px"
      }
    }
  }
};
goog.provide("ol.renderer.dom.Layer");
goog.require("ol.layer.Layer");
goog.require("ol.renderer.Layer");
ol.renderer.dom.Layer = function(mapRenderer, layer, target) {
  goog.base(this, mapRenderer, layer);
  this.target = target
};
goog.inherits(ol.renderer.dom.Layer, ol.renderer.Layer);
ol.renderer.dom.Layer.prototype.disposeInternal = function() {
  goog.dom.removeNode(this.target);
  goog.base(this, "disposeInternal")
};
ol.renderer.dom.Layer.prototype.getTarget = function() {
  return this.target
};
goog.provide("ol.renderer.dom.ImageLayer");
goog.require("goog.dom");
goog.require("goog.vec.Mat4");
goog.require("ol.Image");
goog.require("ol.ImageState");
goog.require("ol.ViewHint");
goog.require("ol.dom");
goog.require("ol.layer.ImageLayer");
goog.require("ol.renderer.dom.Layer");
ol.renderer.dom.ImageLayer = function(mapRenderer, imageLayer) {
  var target = goog.dom.createElement(goog.dom.TagName.DIV);
  target.className = "ol-layer-image";
  target.style.position = "absolute";
  goog.base(this, mapRenderer, imageLayer, target);
  this.image_ = null;
  this.transform_ = goog.vec.Mat4.createNumberIdentity()
};
goog.inherits(ol.renderer.dom.ImageLayer, ol.renderer.dom.Layer);
ol.renderer.dom.ImageLayer.prototype.getImageLayer = function() {
  return this.getLayer()
};
ol.renderer.dom.ImageLayer.prototype.renderFrame = function(frameState, layerState) {
  var view2DState = frameState.view2DState;
  var viewCenter = view2DState.center;
  var viewResolution = view2DState.resolution;
  var viewRotation = view2DState.rotation;
  var image = this.image_;
  var imageLayer = this.getImageLayer();
  var imageSource = imageLayer.getImageSource();
  var hints = frameState.viewHints;
  if(!hints[ol.ViewHint.ANIMATING] && !hints[ol.ViewHint.INTERACTING]) {
    var image_ = imageSource.getImage(frameState.extent, viewResolution, view2DState.projection);
    if(!goog.isNull(image_)) {
      var imageState = image_.getState();
      if(imageState == ol.ImageState.IDLE) {
        goog.events.listenOnce(image_, goog.events.EventType.CHANGE, this.handleImageChange, false, this);
        image_.load()
      }else {
        if(imageState == ol.ImageState.LOADED) {
          image = image_
        }
      }
    }
  }
  if(!goog.isNull(image)) {
    var imageExtent = image.getExtent();
    var imageResolution = image.getResolution();
    var transform = goog.vec.Mat4.createNumber();
    goog.vec.Mat4.makeIdentity(transform);
    goog.vec.Mat4.translate(transform, frameState.size.width / 2, frameState.size.height / 2, 0);
    goog.vec.Mat4.rotateZ(transform, viewRotation);
    goog.vec.Mat4.scale(transform, imageResolution / viewResolution, imageResolution / viewResolution, 1);
    goog.vec.Mat4.translate(transform, (imageExtent.minX - viewCenter.x) / imageResolution, (viewCenter.y - imageExtent.maxY) / imageResolution, 0);
    if(image != this.image_) {
      var imageElement = image.getImageElement(this);
      imageElement.style.position = "absolute";
      goog.dom.removeChildren(this.target);
      goog.dom.appendChild(this.target, imageElement);
      this.image_ = image
    }
    this.setTransform(transform);
    this.updateAttributions(frameState.attributions, image.getAttributions())
  }
};
ol.renderer.dom.ImageLayer.prototype.setTransform = function(transform) {
  if(!goog.vec.Mat4.equals(transform, this.transform_)) {
    ol.dom.transformElement2D(this.target, transform, 6);
    goog.vec.Mat4.setFromArray(this.transform_, transform)
  }
};
goog.provide("ol.renderer.dom.TileLayer");
goog.require("goog.asserts");
goog.require("goog.dom");
goog.require("goog.style");
goog.require("goog.vec.Mat4");
goog.require("ol.Coordinate");
goog.require("ol.Extent");
goog.require("ol.Tile");
goog.require("ol.TileCoord");
goog.require("ol.TileState");
goog.require("ol.ViewHint");
goog.require("ol.dom");
goog.require("ol.layer.TileLayer");
goog.require("ol.renderer.dom.Layer");
goog.require("ol.tilegrid.TileGrid");
ol.renderer.dom.TileLayer = function(mapRenderer, tileLayer) {
  var target = goog.dom.createElement(goog.dom.TagName.DIV);
  target.className = "ol-layer-tile";
  target.style.position = "absolute";
  goog.base(this, mapRenderer, tileLayer, target);
  this.renderedVisible_ = true;
  this.renderedOpacity_ = 1;
  this.tileLayerZs_ = {}
};
goog.inherits(ol.renderer.dom.TileLayer, ol.renderer.dom.Layer);
ol.renderer.dom.TileLayer.prototype.getTileLayer = function() {
  return this.getLayer()
};
ol.renderer.dom.TileLayer.prototype.renderFrame = function(frameState, layerState) {
  if(!layerState.visible) {
    if(this.renderedVisible_) {
      goog.style.showElement(this.target, false);
      this.renderedVisible_ = false
    }
    return
  }
  var view2DState = frameState.view2DState;
  var projection = view2DState.projection;
  var tileLayer = this.getTileLayer();
  var tileSource = tileLayer.getTileSource();
  var tileSourceKey = goog.getUid(tileSource).toString();
  var tileGrid = tileSource.getTileGrid();
  if(goog.isNull(tileGrid)) {
    tileGrid = ol.tilegrid.getForProjection(projection)
  }
  var z = tileGrid.getZForResolution(view2DState.resolution);
  var tileResolution = tileGrid.getResolution(z);
  var tileRange = tileGrid.getTileRangeForExtentAndResolution(frameState.extent, tileResolution);
  var tilesToDrawByZ = {};
  tilesToDrawByZ[z] = {};
  var getTileIfLoaded = this.createGetTileIfLoadedFunction(function(tile) {
    return!goog.isNull(tile) && tile.getState() == ol.TileState.LOADED
  }, tileSource, tileGrid, projection);
  var findLoadedTiles = goog.bind(tileSource.findLoadedTiles, tileSource, tilesToDrawByZ, getTileIfLoaded);
  var allTilesLoaded = true;
  var tile, tileCenter, tileCoord, tileState, x, y;
  for(x = tileRange.minX;x <= tileRange.maxX;++x) {
    for(y = tileRange.minY;y <= tileRange.maxY;++y) {
      tileCoord = new ol.TileCoord(z, x, y);
      tile = tileSource.getTile(tileCoord, tileGrid, projection);
      if(goog.isNull(tile)) {
        continue
      }
      tileState = tile.getState();
      if(tileState == ol.TileState.IDLE) {
        this.listenToTileChange(tile);
        this.updateWantedTiles(frameState.wantedTiles, tileSource, tileCoord);
        tileCenter = tileGrid.getTileCoordCenter(tileCoord);
        frameState.tileQueue.enqueue(tile, tileSourceKey, tileCenter)
      }else {
        if(tileState == ol.TileState.LOADED) {
          tilesToDrawByZ[z][tileCoord.toString()] = tile;
          continue
        }else {
          if(tileState == ol.TileState.ERROR) {
            continue
          }
        }
      }
      allTilesLoaded = false;
      tileGrid.forEachTileCoordParentTileRange(tileCoord, findLoadedTiles)
    }
  }
  var zs = goog.array.map(goog.object.getKeys(tilesToDrawByZ), Number);
  goog.array.sort(zs);
  var newTileLayerZKeys = {};
  var iz, tileCoordKey, tileCoordOrigin, tileLayerZ, tileLayerZKey, tilesToDraw;
  for(iz = 0;iz < zs.length;++iz) {
    tileLayerZKey = zs[iz];
    if(tileLayerZKey in this.tileLayerZs_) {
      tileLayerZ = this.tileLayerZs_[tileLayerZKey]
    }else {
      tileCoordOrigin = tileGrid.getTileCoordForCoordAndZ(view2DState.center, tileLayerZKey);
      tileLayerZ = new ol.renderer.dom.TileLayerZ_(tileGrid, tileCoordOrigin);
      newTileLayerZKeys[tileLayerZKey] = true;
      this.tileLayerZs_[tileLayerZKey] = tileLayerZ
    }
    tilesToDraw = tilesToDrawByZ[tileLayerZKey];
    for(tileCoordKey in tilesToDraw) {
      tileLayerZ.addTile(tilesToDraw[tileCoordKey])
    }
    tileLayerZ.finalizeAddTiles()
  }
  var tileLayerZKeys = goog.array.map(goog.object.getKeys(this.tileLayerZs_), Number);
  goog.array.sort(tileLayerZKeys);
  var i, j, origin, resolution;
  var transform = goog.vec.Mat4.createNumber();
  for(i = 0;i < tileLayerZKeys.length;++i) {
    tileLayerZKey = tileLayerZKeys[i];
    tileLayerZ = this.tileLayerZs_[tileLayerZKey];
    if(!(tileLayerZKey in tilesToDrawByZ)) {
      goog.dom.removeNode(tileLayerZ.target);
      delete this.tileLayerZs_[tileLayerZKey];
      continue
    }
    resolution = tileLayerZ.getResolution();
    origin = tileLayerZ.getOrigin();
    goog.vec.Mat4.makeIdentity(transform);
    goog.vec.Mat4.translate(transform, frameState.size.width / 2, frameState.size.height / 2, 0);
    goog.vec.Mat4.rotateZ(transform, view2DState.rotation);
    goog.vec.Mat4.scale(transform, resolution / view2DState.resolution, resolution / view2DState.resolution, 1);
    goog.vec.Mat4.translate(transform, (origin.x - view2DState.center.x) / resolution, (view2DState.center.y - origin.y) / resolution, 0);
    tileLayerZ.setTransform(transform);
    if(tileLayerZKey in newTileLayerZKeys) {
      for(j = tileLayerZKey - 1;j >= 0;--j) {
        if(j in this.tileLayerZs_) {
          goog.dom.insertSiblingAfter(tileLayerZ.target, this.tileLayerZs_[j].target);
          break
        }
      }
      if(j < 0) {
        goog.dom.insertChildAt(this.target, tileLayerZ.target, 0)
      }
    }else {
      if(!frameState.viewHints[ol.ViewHint.ANIMATING] && !frameState.viewHints[ol.ViewHint.INTERACTING]) {
        tileLayerZ.removeTilesOutsideExtent(frameState.extent)
      }
    }
  }
  if(layerState.opacity != this.renderedOpacity_) {
    goog.style.setOpacity(this.target, layerState.opacity);
    this.renderedOpacity_ = layerState.opacity
  }
  if(layerState.visible && !this.renderedVisible_) {
    goog.style.showElement(this.target, true);
    this.renderedVisible_ = true
  }
  this.updateUsedTiles(frameState.usedTiles, tileSource, z, tileRange);
  tileSource.useLowResolutionTiles(z, frameState.extent, tileGrid);
  this.scheduleExpireCache(frameState, tileSource)
};
ol.renderer.dom.TileLayerZ_ = function(tileGrid, tileCoordOrigin) {
  this.target = goog.dom.createElement(goog.dom.TagName.DIV);
  this.target.style.position = "absolute";
  this.tileGrid_ = tileGrid;
  this.tileCoordOrigin_ = tileCoordOrigin;
  this.origin_ = tileGrid.getTileCoordExtent(tileCoordOrigin).getTopLeft();
  this.resolution_ = tileGrid.getResolution(tileCoordOrigin.z);
  this.tiles_ = {};
  this.documentFragment_ = null;
  this.transform_ = goog.vec.Mat4.createNumberIdentity()
};
ol.renderer.dom.TileLayerZ_.prototype.addTile = function(tile) {
  var tileCoord = tile.tileCoord;
  goog.asserts.assert(tileCoord.z == this.tileCoordOrigin_.z);
  var tileCoordKey = tileCoord.toString();
  if(tileCoordKey in this.tiles_) {
    return
  }
  var tileSize = this.tileGrid_.getTileSize(tileCoord.z);
  var image = tile.getImage(this);
  var style = image.style;
  style.position = "absolute";
  style.left = (tileCoord.x - this.tileCoordOrigin_.x) * tileSize.width + "px";
  style.top = (this.tileCoordOrigin_.y - tileCoord.y) * tileSize.height + "px";
  if(goog.isNull(this.documentFragment_)) {
    this.documentFragment_ = document.createDocumentFragment()
  }
  goog.dom.appendChild(this.documentFragment_, image);
  this.tiles_[tileCoordKey] = tile
};
ol.renderer.dom.TileLayerZ_.prototype.finalizeAddTiles = function() {
  if(!goog.isNull(this.documentFragment_)) {
    goog.dom.appendChild(this.target, this.documentFragment_);
    this.documentFragment_ = null
  }
};
ol.renderer.dom.TileLayerZ_.prototype.getOrigin = function() {
  return this.origin_
};
ol.renderer.dom.TileLayerZ_.prototype.getResolution = function() {
  return this.resolution_
};
ol.renderer.dom.TileLayerZ_.prototype.removeTilesOutsideExtent = function(extent) {
  var tileRange = this.tileGrid_.getTileRangeForExtentAndZ(extent, this.tileCoordOrigin_.z);
  var tilesToRemove = [];
  var tile, tileCoordKey;
  for(tileCoordKey in this.tiles_) {
    tile = this.tiles_[tileCoordKey];
    if(!tileRange.contains(tile.tileCoord)) {
      tilesToRemove.push(tile)
    }
  }
  var i;
  for(i = 0;i < tilesToRemove.length;++i) {
    tile = tilesToRemove[i];
    tileCoordKey = tile.tileCoord.toString();
    goog.dom.removeNode(tile.getImage(this));
    delete this.tiles_[tileCoordKey]
  }
};
ol.renderer.dom.TileLayerZ_.prototype.setTransform = function(transform) {
  if(!goog.vec.Mat4.equals(transform, this.transform_)) {
    ol.dom.transformElement2D(this.target, transform, 6);
    goog.vec.Mat4.setFromArray(this.transform_, transform)
  }
};
goog.provide("ol.renderer.dom.Map");
goog.require("goog.array");
goog.require("goog.asserts");
goog.require("goog.dom");
goog.require("goog.dom.TagName");
goog.require("goog.style");
goog.require("ol.layer.ImageLayer");
goog.require("ol.layer.TileLayer");
goog.require("ol.renderer.Map");
goog.require("ol.renderer.dom.ImageLayer");
goog.require("ol.renderer.dom.TileLayer");
ol.renderer.dom.Map = function(container, map) {
  goog.base(this, container, map);
  this.layersPane_ = goog.dom.createElement(goog.dom.TagName.DIV);
  this.layersPane_.className = "ol-layers ol-unselectable";
  var style = this.layersPane_.style;
  style.position = "absolute";
  style.width = "100%";
  style.height = "100%";
  goog.dom.insertChildAt(container, this.layersPane_, 0);
  this.renderedVisible_ = true
};
goog.inherits(ol.renderer.dom.Map, ol.renderer.Map);
ol.renderer.dom.Map.prototype.addLayer = function(layer) {
  goog.base(this, "addLayer", layer);
  this.getMap().render()
};
ol.renderer.dom.Map.prototype.createLayerRenderer = function(layer) {
  var layerRenderer;
  if(layer instanceof ol.layer.TileLayer) {
    layerRenderer = new ol.renderer.dom.TileLayer(this, layer)
  }else {
    if(layer instanceof ol.layer.ImageLayer) {
      layerRenderer = new ol.renderer.dom.ImageLayer(this, layer)
    }
  }
  goog.asserts.assert(goog.isDef(layerRenderer));
  goog.dom.appendChild(this.layersPane_, layerRenderer.getTarget());
  return layerRenderer
};
ol.renderer.dom.Map.prototype.renderFrame = function(frameState) {
  if(goog.isNull(frameState)) {
    if(this.renderedVisible_) {
      goog.style.showElement(this.layersPane_, false);
      this.renderedVisible_ = false
    }
    return
  }
  goog.array.forEach(frameState.layersArray, function(layer) {
    var layerState = frameState.layerStates[goog.getUid(layer)];
    if(!layerState.ready) {
      return
    }
    var layerRenderer = this.getLayerRenderer(layer);
    layerRenderer.renderFrame(frameState, layerState)
  }, this);
  if(!this.renderedVisible_) {
    goog.style.showElement(this.layersPane_, true);
    this.renderedVisible_ = true
  }
  this.calculateMatrices2D(frameState)
};
goog.provide("ol.renderer.dom.SUPPORTED");
ol.renderer.dom.SUPPORTED = true;
goog.provide("goog.webgl");
goog.webgl.DEPTH_BUFFER_BIT = 256;
goog.webgl.STENCIL_BUFFER_BIT = 1024;
goog.webgl.COLOR_BUFFER_BIT = 16384;
goog.webgl.POINTS = 0;
goog.webgl.LINES = 1;
goog.webgl.LINE_LOOP = 2;
goog.webgl.LINE_STRIP = 3;
goog.webgl.TRIANGLES = 4;
goog.webgl.TRIANGLE_STRIP = 5;
goog.webgl.TRIANGLE_FAN = 6;
goog.webgl.ZERO = 0;
goog.webgl.ONE = 1;
goog.webgl.SRC_COLOR = 768;
goog.webgl.ONE_MINUS_SRC_COLOR = 769;
goog.webgl.SRC_ALPHA = 770;
goog.webgl.ONE_MINUS_SRC_ALPHA = 771;
goog.webgl.DST_ALPHA = 772;
goog.webgl.ONE_MINUS_DST_ALPHA = 773;
goog.webgl.DST_COLOR = 774;
goog.webgl.ONE_MINUS_DST_COLOR = 775;
goog.webgl.SRC_ALPHA_SATURATE = 776;
goog.webgl.FUNC_ADD = 32774;
goog.webgl.BLEND_EQUATION = 32777;
goog.webgl.BLEND_EQUATION_RGB = 32777;
goog.webgl.BLEND_EQUATION_ALPHA = 34877;
goog.webgl.FUNC_SUBTRACT = 32778;
goog.webgl.FUNC_REVERSE_SUBTRACT = 32779;
goog.webgl.BLEND_DST_RGB = 32968;
goog.webgl.BLEND_SRC_RGB = 32969;
goog.webgl.BLEND_DST_ALPHA = 32970;
goog.webgl.BLEND_SRC_ALPHA = 32971;
goog.webgl.CONSTANT_COLOR = 32769;
goog.webgl.ONE_MINUS_CONSTANT_COLOR = 32770;
goog.webgl.CONSTANT_ALPHA = 32771;
goog.webgl.ONE_MINUS_CONSTANT_ALPHA = 32772;
goog.webgl.BLEND_COLOR = 32773;
goog.webgl.ARRAY_BUFFER = 34962;
goog.webgl.ELEMENT_ARRAY_BUFFER = 34963;
goog.webgl.ARRAY_BUFFER_BINDING = 34964;
goog.webgl.ELEMENT_ARRAY_BUFFER_BINDING = 34965;
goog.webgl.STREAM_DRAW = 35040;
goog.webgl.STATIC_DRAW = 35044;
goog.webgl.DYNAMIC_DRAW = 35048;
goog.webgl.BUFFER_SIZE = 34660;
goog.webgl.BUFFER_USAGE = 34661;
goog.webgl.CURRENT_VERTEX_ATTRIB = 34342;
goog.webgl.FRONT = 1028;
goog.webgl.BACK = 1029;
goog.webgl.FRONT_AND_BACK = 1032;
goog.webgl.CULL_FACE = 2884;
goog.webgl.BLEND = 3042;
goog.webgl.DITHER = 3024;
goog.webgl.STENCIL_TEST = 2960;
goog.webgl.DEPTH_TEST = 2929;
goog.webgl.SCISSOR_TEST = 3089;
goog.webgl.POLYGON_OFFSET_FILL = 32823;
goog.webgl.SAMPLE_ALPHA_TO_COVERAGE = 32926;
goog.webgl.SAMPLE_COVERAGE = 32928;
goog.webgl.NO_ERROR = 0;
goog.webgl.INVALID_ENUM = 1280;
goog.webgl.INVALID_VALUE = 1281;
goog.webgl.INVALID_OPERATION = 1282;
goog.webgl.OUT_OF_MEMORY = 1285;
goog.webgl.CW = 2304;
goog.webgl.CCW = 2305;
goog.webgl.LINE_WIDTH = 2849;
goog.webgl.ALIASED_POINT_SIZE_RANGE = 33901;
goog.webgl.ALIASED_LINE_WIDTH_RANGE = 33902;
goog.webgl.CULL_FACE_MODE = 2885;
goog.webgl.FRONT_FACE = 2886;
goog.webgl.DEPTH_RANGE = 2928;
goog.webgl.DEPTH_WRITEMASK = 2930;
goog.webgl.DEPTH_CLEAR_VALUE = 2931;
goog.webgl.DEPTH_FUNC = 2932;
goog.webgl.STENCIL_CLEAR_VALUE = 2961;
goog.webgl.STENCIL_FUNC = 2962;
goog.webgl.STENCIL_FAIL = 2964;
goog.webgl.STENCIL_PASS_DEPTH_FAIL = 2965;
goog.webgl.STENCIL_PASS_DEPTH_PASS = 2966;
goog.webgl.STENCIL_REF = 2967;
goog.webgl.STENCIL_VALUE_MASK = 2963;
goog.webgl.STENCIL_WRITEMASK = 2968;
goog.webgl.STENCIL_BACK_FUNC = 34816;
goog.webgl.STENCIL_BACK_FAIL = 34817;
goog.webgl.STENCIL_BACK_PASS_DEPTH_FAIL = 34818;
goog.webgl.STENCIL_BACK_PASS_DEPTH_PASS = 34819;
goog.webgl.STENCIL_BACK_REF = 36003;
goog.webgl.STENCIL_BACK_VALUE_MASK = 36004;
goog.webgl.STENCIL_BACK_WRITEMASK = 36005;
goog.webgl.VIEWPORT = 2978;
goog.webgl.SCISSOR_BOX = 3088;
goog.webgl.COLOR_CLEAR_VALUE = 3106;
goog.webgl.COLOR_WRITEMASK = 3107;
goog.webgl.UNPACK_ALIGNMENT = 3317;
goog.webgl.PACK_ALIGNMENT = 3333;
goog.webgl.MAX_TEXTURE_SIZE = 3379;
goog.webgl.MAX_VIEWPORT_DIMS = 3386;
goog.webgl.SUBPIXEL_BITS = 3408;
goog.webgl.RED_BITS = 3410;
goog.webgl.GREEN_BITS = 3411;
goog.webgl.BLUE_BITS = 3412;
goog.webgl.ALPHA_BITS = 3413;
goog.webgl.DEPTH_BITS = 3414;
goog.webgl.STENCIL_BITS = 3415;
goog.webgl.POLYGON_OFFSET_UNITS = 10752;
goog.webgl.POLYGON_OFFSET_FACTOR = 32824;
goog.webgl.TEXTURE_BINDING_2D = 32873;
goog.webgl.SAMPLE_BUFFERS = 32936;
goog.webgl.SAMPLES = 32937;
goog.webgl.SAMPLE_COVERAGE_VALUE = 32938;
goog.webgl.SAMPLE_COVERAGE_INVERT = 32939;
goog.webgl.COMPRESSED_TEXTURE_FORMATS = 34467;
goog.webgl.DONT_CARE = 4352;
goog.webgl.FASTEST = 4353;
goog.webgl.NICEST = 4354;
goog.webgl.GENERATE_MIPMAP_HINT = 33170;
goog.webgl.BYTE = 5120;
goog.webgl.UNSIGNED_BYTE = 5121;
goog.webgl.SHORT = 5122;
goog.webgl.UNSIGNED_SHORT = 5123;
goog.webgl.INT = 5124;
goog.webgl.UNSIGNED_INT = 5125;
goog.webgl.FLOAT = 5126;
goog.webgl.DEPTH_COMPONENT = 6402;
goog.webgl.ALPHA = 6406;
goog.webgl.RGB = 6407;
goog.webgl.RGBA = 6408;
goog.webgl.LUMINANCE = 6409;
goog.webgl.LUMINANCE_ALPHA = 6410;
goog.webgl.UNSIGNED_SHORT_4_4_4_4 = 32819;
goog.webgl.UNSIGNED_SHORT_5_5_5_1 = 32820;
goog.webgl.UNSIGNED_SHORT_5_6_5 = 33635;
goog.webgl.FRAGMENT_SHADER = 35632;
goog.webgl.VERTEX_SHADER = 35633;
goog.webgl.MAX_VERTEX_ATTRIBS = 34921;
goog.webgl.MAX_VERTEX_UNIFORM_VECTORS = 36347;
goog.webgl.MAX_VARYING_VECTORS = 36348;
goog.webgl.MAX_COMBINED_TEXTURE_IMAGE_UNITS = 35661;
goog.webgl.MAX_VERTEX_TEXTURE_IMAGE_UNITS = 35660;
goog.webgl.MAX_TEXTURE_IMAGE_UNITS = 34930;
goog.webgl.MAX_FRAGMENT_UNIFORM_VECTORS = 36349;
goog.webgl.SHADER_TYPE = 35663;
goog.webgl.DELETE_STATUS = 35712;
goog.webgl.LINK_STATUS = 35714;
goog.webgl.VALIDATE_STATUS = 35715;
goog.webgl.ATTACHED_SHADERS = 35717;
goog.webgl.ACTIVE_UNIFORMS = 35718;
goog.webgl.ACTIVE_ATTRIBUTES = 35721;
goog.webgl.SHADING_LANGUAGE_VERSION = 35724;
goog.webgl.CURRENT_PROGRAM = 35725;
goog.webgl.NEVER = 512;
goog.webgl.LESS = 513;
goog.webgl.EQUAL = 514;
goog.webgl.LEQUAL = 515;
goog.webgl.GREATER = 516;
goog.webgl.NOTEQUAL = 517;
goog.webgl.GEQUAL = 518;
goog.webgl.ALWAYS = 519;
goog.webgl.KEEP = 7680;
goog.webgl.REPLACE = 7681;
goog.webgl.INCR = 7682;
goog.webgl.DECR = 7683;
goog.webgl.INVERT = 5386;
goog.webgl.INCR_WRAP = 34055;
goog.webgl.DECR_WRAP = 34056;
goog.webgl.VENDOR = 7936;
goog.webgl.RENDERER = 7937;
goog.webgl.VERSION = 7938;
goog.webgl.NEAREST = 9728;
goog.webgl.LINEAR = 9729;
goog.webgl.NEAREST_MIPMAP_NEAREST = 9984;
goog.webgl.LINEAR_MIPMAP_NEAREST = 9985;
goog.webgl.NEAREST_MIPMAP_LINEAR = 9986;
goog.webgl.LINEAR_MIPMAP_LINEAR = 9987;
goog.webgl.TEXTURE_MAG_FILTER = 10240;
goog.webgl.TEXTURE_MIN_FILTER = 10241;
goog.webgl.TEXTURE_WRAP_S = 10242;
goog.webgl.TEXTURE_WRAP_T = 10243;
goog.webgl.TEXTURE_2D = 3553;
goog.webgl.TEXTURE = 5890;
goog.webgl.TEXTURE_CUBE_MAP = 34067;
goog.webgl.TEXTURE_BINDING_CUBE_MAP = 34068;
goog.webgl.TEXTURE_CUBE_MAP_POSITIVE_X = 34069;
goog.webgl.TEXTURE_CUBE_MAP_NEGATIVE_X = 34070;
goog.webgl.TEXTURE_CUBE_MAP_POSITIVE_Y = 34071;
goog.webgl.TEXTURE_CUBE_MAP_NEGATIVE_Y = 34072;
goog.webgl.TEXTURE_CUBE_MAP_POSITIVE_Z = 34073;
goog.webgl.TEXTURE_CUBE_MAP_NEGATIVE_Z = 34074;
goog.webgl.MAX_CUBE_MAP_TEXTURE_SIZE = 34076;
goog.webgl.TEXTURE0 = 33984;
goog.webgl.TEXTURE1 = 33985;
goog.webgl.TEXTURE2 = 33986;
goog.webgl.TEXTURE3 = 33987;
goog.webgl.TEXTURE4 = 33988;
goog.webgl.TEXTURE5 = 33989;
goog.webgl.TEXTURE6 = 33990;
goog.webgl.TEXTURE7 = 33991;
goog.webgl.TEXTURE8 = 33992;
goog.webgl.TEXTURE9 = 33993;
goog.webgl.TEXTURE10 = 33994;
goog.webgl.TEXTURE11 = 33995;
goog.webgl.TEXTURE12 = 33996;
goog.webgl.TEXTURE13 = 33997;
goog.webgl.TEXTURE14 = 33998;
goog.webgl.TEXTURE15 = 33999;
goog.webgl.TEXTURE16 = 34E3;
goog.webgl.TEXTURE17 = 34001;
goog.webgl.TEXTURE18 = 34002;
goog.webgl.TEXTURE19 = 34003;
goog.webgl.TEXTURE20 = 34004;
goog.webgl.TEXTURE21 = 34005;
goog.webgl.TEXTURE22 = 34006;
goog.webgl.TEXTURE23 = 34007;
goog.webgl.TEXTURE24 = 34008;
goog.webgl.TEXTURE25 = 34009;
goog.webgl.TEXTURE26 = 34010;
goog.webgl.TEXTURE27 = 34011;
goog.webgl.TEXTURE28 = 34012;
goog.webgl.TEXTURE29 = 34013;
goog.webgl.TEXTURE30 = 34014;
goog.webgl.TEXTURE31 = 34015;
goog.webgl.ACTIVE_TEXTURE = 34016;
goog.webgl.REPEAT = 10497;
goog.webgl.CLAMP_TO_EDGE = 33071;
goog.webgl.MIRRORED_REPEAT = 33648;
goog.webgl.FLOAT_VEC2 = 35664;
goog.webgl.FLOAT_VEC3 = 35665;
goog.webgl.FLOAT_VEC4 = 35666;
goog.webgl.INT_VEC2 = 35667;
goog.webgl.INT_VEC3 = 35668;
goog.webgl.INT_VEC4 = 35669;
goog.webgl.BOOL = 35670;
goog.webgl.BOOL_VEC2 = 35671;
goog.webgl.BOOL_VEC3 = 35672;
goog.webgl.BOOL_VEC4 = 35673;
goog.webgl.FLOAT_MAT2 = 35674;
goog.webgl.FLOAT_MAT3 = 35675;
goog.webgl.FLOAT_MAT4 = 35676;
goog.webgl.SAMPLER_2D = 35678;
goog.webgl.SAMPLER_CUBE = 35680;
goog.webgl.VERTEX_ATTRIB_ARRAY_ENABLED = 34338;
goog.webgl.VERTEX_ATTRIB_ARRAY_SIZE = 34339;
goog.webgl.VERTEX_ATTRIB_ARRAY_STRIDE = 34340;
goog.webgl.VERTEX_ATTRIB_ARRAY_TYPE = 34341;
goog.webgl.VERTEX_ATTRIB_ARRAY_NORMALIZED = 34922;
goog.webgl.VERTEX_ATTRIB_ARRAY_POINTER = 34373;
goog.webgl.VERTEX_ATTRIB_ARRAY_BUFFER_BINDING = 34975;
goog.webgl.COMPILE_STATUS = 35713;
goog.webgl.LOW_FLOAT = 36336;
goog.webgl.MEDIUM_FLOAT = 36337;
goog.webgl.HIGH_FLOAT = 36338;
goog.webgl.LOW_INT = 36339;
goog.webgl.MEDIUM_INT = 36340;
goog.webgl.HIGH_INT = 36341;
goog.webgl.FRAMEBUFFER = 36160;
goog.webgl.RENDERBUFFER = 36161;
goog.webgl.RGBA4 = 32854;
goog.webgl.RGB5_A1 = 32855;
goog.webgl.RGB565 = 36194;
goog.webgl.DEPTH_COMPONENT16 = 33189;
goog.webgl.STENCIL_INDEX = 6401;
goog.webgl.STENCIL_INDEX8 = 36168;
goog.webgl.DEPTH_STENCIL = 34041;
goog.webgl.RENDERBUFFER_WIDTH = 36162;
goog.webgl.RENDERBUFFER_HEIGHT = 36163;
goog.webgl.RENDERBUFFER_INTERNAL_FORMAT = 36164;
goog.webgl.RENDERBUFFER_RED_SIZE = 36176;
goog.webgl.RENDERBUFFER_GREEN_SIZE = 36177;
goog.webgl.RENDERBUFFER_BLUE_SIZE = 36178;
goog.webgl.RENDERBUFFER_ALPHA_SIZE = 36179;
goog.webgl.RENDERBUFFER_DEPTH_SIZE = 36180;
goog.webgl.RENDERBUFFER_STENCIL_SIZE = 36181;
goog.webgl.FRAMEBUFFER_ATTACHMENT_OBJECT_TYPE = 36048;
goog.webgl.FRAMEBUFFER_ATTACHMENT_OBJECT_NAME = 36049;
goog.webgl.FRAMEBUFFER_ATTACHMENT_TEXTURE_LEVEL = 36050;
goog.webgl.FRAMEBUFFER_ATTACHMENT_TEXTURE_CUBE_MAP_FACE = 36051;
goog.webgl.COLOR_ATTACHMENT0 = 36064;
goog.webgl.DEPTH_ATTACHMENT = 36096;
goog.webgl.STENCIL_ATTACHMENT = 36128;
goog.webgl.DEPTH_STENCIL_ATTACHMENT = 33306;
goog.webgl.NONE = 0;
goog.webgl.FRAMEBUFFER_COMPLETE = 36053;
goog.webgl.FRAMEBUFFER_INCOMPLETE_ATTACHMENT = 36054;
goog.webgl.FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT = 36055;
goog.webgl.FRAMEBUFFER_INCOMPLETE_DIMENSIONS = 36057;
goog.webgl.FRAMEBUFFER_UNSUPPORTED = 36061;
goog.webgl.FRAMEBUFFER_BINDING = 36006;
goog.webgl.RENDERBUFFER_BINDING = 36007;
goog.webgl.MAX_RENDERBUFFER_SIZE = 34024;
goog.webgl.INVALID_FRAMEBUFFER_OPERATION = 1286;
goog.webgl.UNPACK_FLIP_Y_WEBGL = 37440;
goog.webgl.UNPACK_PREMULTIPLY_ALPHA_WEBGL = 37441;
goog.webgl.CONTEXT_LOST_WEBGL = 37442;
goog.webgl.UNPACK_COLORSPACE_CONVERSION_WEBGL = 37443;
goog.webgl.BROWSER_DEFAULT_WEBGL = 37444;
goog.webgl.HALF_FLOAT_OES = 36193;
goog.webgl.FRAGMENT_SHADER_DERIVATIVE_HINT_OES = 35723;
goog.webgl.VERTEX_ARRAY_BINDING_OES = 34229;
goog.webgl.UNMASKED_VENDOR_WEBGL = 37445;
goog.webgl.UNMASKED_RENDERER_WEBGL = 37446;
goog.webgl.COMPRESSED_RGB_S3TC_DXT1_EXT = 33776;
goog.webgl.COMPRESSED_RGBA_S3TC_DXT1_EXT = 33777;
goog.webgl.COMPRESSED_RGBA_S3TC_DXT3_EXT = 33778;
goog.webgl.COMPRESSED_RGBA_S3TC_DXT5_EXT = 33779;
goog.webgl.TEXTURE_MAX_ANISOTROPY_EXT = 34046;
goog.webgl.MAX_TEXTURE_MAX_ANISOTROPY_EXT = 34047;
goog.provide("ol.renderer.webgl.FragmentShader");
goog.provide("ol.renderer.webgl.VertexShader");
goog.require("goog.functions");
goog.require("goog.webgl");
ol.renderer.webgl.Shader = function(source) {
  this.source_ = source
};
ol.renderer.webgl.Shader.prototype.getType = goog.abstractMethod;
ol.renderer.webgl.Shader.prototype.getSource = function() {
  return this.source_
};
ol.renderer.webgl.Shader.prototype.isAnimated = goog.functions.FALSE;
ol.renderer.webgl.FragmentShader = function(source) {
  goog.base(this, source)
};
goog.inherits(ol.renderer.webgl.FragmentShader, ol.renderer.webgl.Shader);
ol.renderer.webgl.FragmentShader.prototype.getType = function() {
  return goog.webgl.FRAGMENT_SHADER
};
ol.renderer.webgl.VertexShader = function(source) {
  goog.base(this, source)
};
goog.inherits(ol.renderer.webgl.VertexShader, ol.renderer.webgl.Shader);
ol.renderer.webgl.VertexShader.prototype.getType = function() {
  return goog.webgl.VERTEX_SHADER
};
goog.provide("ol.vec.Mat4");
goog.require("goog.vec.Mat4");
ol.vec.Mat4.makeBrightness = function(matrix, value) {
  goog.vec.Mat4.makeTranslate(matrix, value, value, value);
  return matrix
};
ol.vec.Mat4.makeContrast = function(matrix, value) {
  goog.vec.Mat4.makeScale(matrix, value, value, value);
  var translateValue = -0.5 * value + 0.5;
  goog.vec.Mat4.setColumnValues(matrix, 3, translateValue, translateValue, translateValue, 1);
  return matrix
};
ol.vec.Mat4.makeHue = function(matrix, value) {
  var cosHue = Math.cos(value);
  var sinHue = Math.sin(value);
  var v00 = 0.213 + cosHue * 0.787 - sinHue * 0.213;
  var v01 = 0.715 - cosHue * 0.715 - sinHue * 0.715;
  var v02 = 0.072 - cosHue * 0.072 + sinHue * 0.928;
  var v03 = 0;
  var v10 = 0.213 - cosHue * 0.213 + sinHue * 0.143;
  var v11 = 0.715 + cosHue * 0.285 + sinHue * 0.14;
  var v12 = 0.072 - cosHue * 0.072 - sinHue * 0.283;
  var v13 = 0;
  var v20 = 0.213 - cosHue * 0.213 - sinHue * 0.787;
  var v21 = 0.715 - cosHue * 0.715 + sinHue * 0.715;
  var v22 = 0.072 + cosHue * 0.928 + sinHue * 0.072;
  var v23 = 0;
  var v30 = 0;
  var v31 = 0;
  var v32 = 0;
  var v33 = 1;
  goog.vec.Mat4.setFromValues(matrix, v00, v10, v20, v30, v01, v11, v21, v31, v02, v12, v22, v32, v03, v13, v23, v33);
  return matrix
};
ol.vec.Mat4.makeSaturation = function(matrix, value) {
  var v00 = 0.213 + 0.787 * value;
  var v01 = 0.715 - 0.715 * value;
  var v02 = 0.072 - 0.072 * value;
  var v03 = 0;
  var v10 = 0.213 - 0.213 * value;
  var v11 = 0.715 + 0.285 * value;
  var v12 = 0.072 - 0.072 * value;
  var v13 = 0;
  var v20 = 0.213 - 0.213 * value;
  var v21 = 0.715 - 0.715 * value;
  var v22 = 0.072 + 0.928 * value;
  var v23 = 0;
  var v30 = 0;
  var v31 = 0;
  var v32 = 0;
  var v33 = 1;
  goog.vec.Mat4.setFromValues(matrix, v00, v10, v20, v30, v01, v11, v21, v31, v02, v12, v22, v32, v03, v13, v23, v33);
  return matrix
};
goog.provide("ol.renderer.webgl.Layer");
goog.require("goog.vec.Mat4");
goog.require("ol.layer.Layer");
goog.require("ol.renderer.Layer");
goog.require("ol.vec.Mat4");
ol.renderer.webgl.Layer = function(mapRenderer, layer) {
  goog.base(this, mapRenderer, layer);
  this.brightnessMatrix_ = goog.vec.Mat4.createFloat32();
  this.contrastMatrix_ = goog.vec.Mat4.createFloat32();
  this.hueMatrix_ = goog.vec.Mat4.createFloat32();
  this.saturationMatrix_ = goog.vec.Mat4.createFloat32();
  this.colorMatrix_ = goog.vec.Mat4.createFloat32();
  this.colorMatrixDirty_ = true;
  this.handleLayerBrightnessChange();
  this.handleLayerContrastChange();
  this.handleLayerHueChange();
  this.handleLayerSaturationChange()
};
goog.inherits(ol.renderer.webgl.Layer, ol.renderer.Layer);
ol.renderer.webgl.Layer.prototype.getColorMatrix = function() {
  if(this.colorMatrixDirty_) {
    this.updateColorMatrix_()
  }
  return this.colorMatrix_
};
ol.renderer.webgl.Layer.prototype.getMapRenderer = function() {
  return goog.base(this, "getMapRenderer")
};
ol.renderer.webgl.Layer.prototype.getTexCoordMatrix = goog.abstractMethod;
ol.renderer.webgl.Layer.prototype.getTexture = goog.abstractMethod;
ol.renderer.webgl.Layer.prototype.getProjectionMatrix = goog.abstractMethod;
ol.renderer.webgl.Layer.prototype.handleLayerBrightnessChange = function() {
  var value = this.getLayer().getBrightness();
  ol.vec.Mat4.makeBrightness(this.brightnessMatrix_, value);
  this.colorMatrixDirty_ = true;
  this.dispatchChangeEvent()
};
ol.renderer.webgl.Layer.prototype.handleLayerContrastChange = function() {
  var value = this.getLayer().getContrast();
  ol.vec.Mat4.makeContrast(this.contrastMatrix_, value);
  this.colorMatrixDirty_ = true;
  this.dispatchChangeEvent()
};
ol.renderer.webgl.Layer.prototype.handleLayerHueChange = function() {
  var value = this.getLayer().getHue();
  ol.vec.Mat4.makeHue(this.hueMatrix_, value);
  this.colorMatrixDirty_ = true;
  this.dispatchChangeEvent()
};
ol.renderer.webgl.Layer.prototype.handleLayerSaturationChange = function() {
  var saturation = this.getLayer().getSaturation();
  ol.vec.Mat4.makeSaturation(this.saturationMatrix_, saturation);
  this.colorMatrixDirty_ = true;
  this.dispatchChangeEvent()
};
ol.renderer.webgl.Layer.prototype.handleWebGLContextLost = goog.nullFunction;
ol.renderer.webgl.Layer.prototype.updateColorMatrix_ = function() {
  var colorMatrix = this.colorMatrix_;
  goog.vec.Mat4.makeIdentity(colorMatrix);
  goog.vec.Mat4.multMat(colorMatrix, this.contrastMatrix_, colorMatrix);
  goog.vec.Mat4.multMat(colorMatrix, this.brightnessMatrix_, colorMatrix);
  goog.vec.Mat4.multMat(colorMatrix, this.saturationMatrix_, colorMatrix);
  goog.vec.Mat4.multMat(colorMatrix, this.hueMatrix_, colorMatrix);
  this.colorMatrixDirty_ = false
};
goog.provide("ol.renderer.webgl.ImageLayer");
goog.require("goog.vec.Mat4");
goog.require("ol.Coordinate");
goog.require("ol.Extent");
goog.require("ol.Image");
goog.require("ol.ImageState");
goog.require("ol.ViewHint");
goog.require("ol.layer.ImageLayer");
goog.require("ol.renderer.webgl.Layer");
ol.renderer.webgl.ImageLayer = function(mapRenderer, imageLayer) {
  goog.base(this, mapRenderer, imageLayer);
  this.image_ = null;
  this.texture_ = null;
  this.texCoordMatrix_ = goog.vec.Mat4.createNumberIdentity();
  this.projectionMatrix_ = goog.vec.Mat4.createNumber()
};
goog.inherits(ol.renderer.webgl.ImageLayer, ol.renderer.webgl.Layer);
ol.renderer.webgl.ImageLayer.prototype.createTexture_ = function(image) {
  var imageElement = image.getImageElement(this);
  var gl = this.getMapRenderer().getGL();
  var texture = gl.createTexture();
  gl.bindTexture(goog.webgl.TEXTURE_2D, texture);
  gl.texImage2D(goog.webgl.TEXTURE_2D, 0, goog.webgl.RGBA, goog.webgl.RGBA, goog.webgl.UNSIGNED_BYTE, imageElement);
  gl.texParameteri(goog.webgl.TEXTURE_2D, goog.webgl.TEXTURE_WRAP_S, goog.webgl.CLAMP_TO_EDGE);
  gl.texParameteri(goog.webgl.TEXTURE_2D, goog.webgl.TEXTURE_WRAP_T, goog.webgl.CLAMP_TO_EDGE);
  gl.texParameteri(goog.webgl.TEXTURE_2D, goog.webgl.TEXTURE_MIN_FILTER, goog.webgl.LINEAR);
  gl.texParameteri(goog.webgl.TEXTURE_2D, goog.webgl.TEXTURE_MAG_FILTER, goog.webgl.LINEAR);
  return texture
};
ol.renderer.webgl.ImageLayer.prototype.disposeInternal = function() {
  var mapRenderer = this.getMapRenderer();
  var gl = mapRenderer.getGL();
  if(!gl.isContextLost()) {
    gl.deleteTexture(this.texture_)
  }
  goog.base(this, "disposeInternal")
};
ol.renderer.webgl.ImageLayer.prototype.getTexCoordMatrix = function() {
  return this.texCoordMatrix_
};
ol.renderer.webgl.ImageLayer.prototype.getTexture = function() {
  return this.texture_
};
ol.renderer.webgl.ImageLayer.prototype.getProjectionMatrix = function() {
  return this.projectionMatrix_
};
ol.renderer.webgl.ImageLayer.prototype.getImageLayer = function() {
  return this.getLayer()
};
ol.renderer.webgl.ImageLayer.prototype.handleWebGLContextLost = function() {
  this.texture_ = null
};
ol.renderer.webgl.ImageLayer.prototype.renderFrame = function(frameState, layerState) {
  var gl = this.getMapRenderer().getGL();
  var view2DState = frameState.view2DState;
  var viewCenter = view2DState.center;
  var viewResolution = view2DState.resolution;
  var viewRotation = view2DState.rotation;
  var image = this.image_;
  var texture = this.texture_;
  var imageLayer = this.getImageLayer();
  var imageSource = imageLayer.getImageSource();
  var hints = frameState.viewHints;
  if(!hints[ol.ViewHint.ANIMATING] && !hints[ol.ViewHint.INTERACTING]) {
    var image_ = imageSource.getImage(frameState.extent, viewResolution, view2DState.projection);
    if(!goog.isNull(image_)) {
      var imageState = image_.getState();
      if(imageState == ol.ImageState.IDLE) {
        goog.events.listenOnce(image_, goog.events.EventType.CHANGE, this.handleImageChange, false, this);
        image_.load()
      }else {
        if(imageState == ol.ImageState.LOADED) {
          image = image_;
          texture = this.createTexture_(image_);
          if(!goog.isNull(this.texture_)) {
            frameState.postRenderFunctions.push(goog.partial(function(gl, texture) {
              if(!gl.isContextLost()) {
                gl.deleteTexture(texture)
              }
            }, gl, this.texture_))
          }
        }
      }
    }
  }
  if(!goog.isNull(image)) {
    goog.asserts.assert(!goog.isNull(texture));
    var canvas = this.getMapRenderer().getCanvas();
    this.updateProjectionMatrix_(canvas.width, canvas.height, viewCenter, viewResolution, viewRotation, image.getExtent());
    var texCoordMatrix = this.texCoordMatrix_;
    goog.vec.Mat4.makeIdentity(texCoordMatrix);
    goog.vec.Mat4.scale(texCoordMatrix, 1, -1, 1);
    goog.vec.Mat4.translate(texCoordMatrix, 0, -1, 0);
    this.image_ = image;
    this.texture_ = texture;
    this.updateAttributions(frameState.attributions, image.getAttributions())
  }
};
ol.renderer.webgl.ImageLayer.prototype.updateProjectionMatrix_ = function(canvasWidth, canvasHeight, viewCenter, viewResolution, viewRotation, imageExtent) {
  var canvasExtentWidth = canvasWidth * viewResolution;
  var canvasExtentHeight = canvasHeight * viewResolution;
  var projectionMatrix = this.projectionMatrix_;
  goog.vec.Mat4.makeIdentity(projectionMatrix);
  goog.vec.Mat4.scale(projectionMatrix, 2 / canvasExtentWidth, 2 / canvasExtentHeight, 1);
  goog.vec.Mat4.rotateZ(projectionMatrix, -viewRotation);
  goog.vec.Mat4.translate(projectionMatrix, imageExtent.minX - viewCenter.x, imageExtent.minY - viewCenter.y, 0);
  goog.vec.Mat4.scale(projectionMatrix, imageExtent.getWidth() / 2, imageExtent.getHeight() / 2, 1);
  goog.vec.Mat4.translate(projectionMatrix, 1, 1, 0)
};
goog.provide("goog.structs.Node");
goog.structs.Node = function(key, value) {
  this.key_ = key;
  this.value_ = value
};
goog.structs.Node.prototype.getKey = function() {
  return this.key_
};
goog.structs.Node.prototype.getValue = function() {
  return this.value_
};
goog.structs.Node.prototype.clone = function() {
  return new goog.structs.Node(this.key_, this.value_)
};
goog.provide("goog.structs.Heap");
goog.require("goog.array");
goog.require("goog.object");
goog.require("goog.structs.Node");
goog.structs.Heap = function(opt_heap) {
  this.nodes_ = [];
  if(opt_heap) {
    this.insertAll(opt_heap)
  }
};
goog.structs.Heap.prototype.insert = function(key, value) {
  var node = new goog.structs.Node(key, value);
  var nodes = this.nodes_;
  nodes.push(node);
  this.moveUp_(nodes.length - 1)
};
goog.structs.Heap.prototype.insertAll = function(heap) {
  var keys, values;
  if(heap instanceof goog.structs.Heap) {
    keys = heap.getKeys();
    values = heap.getValues();
    if(heap.getCount() <= 0) {
      var nodes = this.nodes_;
      for(var i = 0;i < keys.length;i++) {
        nodes.push(new goog.structs.Node(keys[i], values[i]))
      }
      return
    }
  }else {
    keys = goog.object.getKeys(heap);
    values = goog.object.getValues(heap)
  }
  for(var i = 0;i < keys.length;i++) {
    this.insert(keys[i], values[i])
  }
};
goog.structs.Heap.prototype.remove = function() {
  var nodes = this.nodes_;
  var count = nodes.length;
  var rootNode = nodes[0];
  if(count <= 0) {
    return undefined
  }else {
    if(count == 1) {
      goog.array.clear(nodes)
    }else {
      nodes[0] = nodes.pop();
      this.moveDown_(0)
    }
  }
  return rootNode.getValue()
};
goog.structs.Heap.prototype.peek = function() {
  var nodes = this.nodes_;
  if(nodes.length == 0) {
    return undefined
  }
  return nodes[0].getValue()
};
goog.structs.Heap.prototype.peekKey = function() {
  return this.nodes_[0] && this.nodes_[0].getKey()
};
goog.structs.Heap.prototype.moveDown_ = function(index) {
  var nodes = this.nodes_;
  var count = nodes.length;
  var node = nodes[index];
  while(index < count >> 1) {
    var leftChildIndex = this.getLeftChildIndex_(index);
    var rightChildIndex = this.getRightChildIndex_(index);
    var smallerChildIndex = rightChildIndex < count && nodes[rightChildIndex].getKey() < nodes[leftChildIndex].getKey() ? rightChildIndex : leftChildIndex;
    if(nodes[smallerChildIndex].getKey() > node.getKey()) {
      break
    }
    nodes[index] = nodes[smallerChildIndex];
    index = smallerChildIndex
  }
  nodes[index] = node
};
goog.structs.Heap.prototype.moveUp_ = function(index) {
  var nodes = this.nodes_;
  var node = nodes[index];
  while(index > 0) {
    var parentIndex = this.getParentIndex_(index);
    if(nodes[parentIndex].getKey() > node.getKey()) {
      nodes[index] = nodes[parentIndex];
      index = parentIndex
    }else {
      break
    }
  }
  nodes[index] = node
};
goog.structs.Heap.prototype.getLeftChildIndex_ = function(index) {
  return index * 2 + 1
};
goog.structs.Heap.prototype.getRightChildIndex_ = function(index) {
  return index * 2 + 2
};
goog.structs.Heap.prototype.getParentIndex_ = function(index) {
  return index - 1 >> 1
};
goog.structs.Heap.prototype.getValues = function() {
  var nodes = this.nodes_;
  var rv = [];
  var l = nodes.length;
  for(var i = 0;i < l;i++) {
    rv.push(nodes[i].getValue())
  }
  return rv
};
goog.structs.Heap.prototype.getKeys = function() {
  var nodes = this.nodes_;
  var rv = [];
  var l = nodes.length;
  for(var i = 0;i < l;i++) {
    rv.push(nodes[i].getKey())
  }
  return rv
};
goog.structs.Heap.prototype.containsValue = function(val) {
  return goog.array.some(this.nodes_, function(node) {
    return node.getValue() == val
  })
};
goog.structs.Heap.prototype.containsKey = function(key) {
  return goog.array.some(this.nodes_, function(node) {
    return node.getKey() == key
  })
};
goog.structs.Heap.prototype.clone = function() {
  return new goog.structs.Heap(this)
};
goog.structs.Heap.prototype.getCount = function() {
  return this.nodes_.length
};
goog.structs.Heap.prototype.isEmpty = function() {
  return goog.array.isEmpty(this.nodes_)
};
goog.structs.Heap.prototype.clear = function() {
  goog.array.clear(this.nodes_)
};
goog.provide("goog.structs.PriorityQueue");
goog.require("goog.structs");
goog.require("goog.structs.Heap");
goog.structs.PriorityQueue = function() {
  goog.structs.Heap.call(this)
};
goog.inherits(goog.structs.PriorityQueue, goog.structs.Heap);
goog.structs.PriorityQueue.prototype.enqueue = function(priority, value) {
  this.insert(priority, value)
};
goog.structs.PriorityQueue.prototype.dequeue = function() {
  return this.remove()
};
goog.provide("ol.renderer.webgl.TileLayer");
goog.provide("ol.renderer.webgl.tilelayerrenderer");
goog.provide("ol.renderer.webgl.tilelayerrenderer.shader.Fragment");
goog.provide("ol.renderer.webgl.tilelayerrenderer.shader.Vertex");
goog.require("goog.array");
goog.require("goog.object");
goog.require("goog.structs.PriorityQueue");
goog.require("goog.vec.Mat4");
goog.require("goog.vec.Vec4");
goog.require("goog.webgl");
goog.require("ol.Extent");
goog.require("ol.FrameState");
goog.require("ol.Size");
goog.require("ol.Tile");
goog.require("ol.TileCoord");
goog.require("ol.TileRange");
goog.require("ol.TileState");
goog.require("ol.layer.TileLayer");
goog.require("ol.renderer.webgl.FragmentShader");
goog.require("ol.renderer.webgl.Layer");
goog.require("ol.renderer.webgl.VertexShader");
ol.renderer.webgl.tilelayerrenderer.shader.Fragment = function() {
  goog.base(this, ["precision mediump float;", "", "uniform sampler2D uTexture;", "", "varying vec2 vTexCoord;", "", "void main(void) {", " gl_FragColor = texture2D(uTexture, vTexCoord);", "}"].join("\n"))
};
goog.inherits(ol.renderer.webgl.tilelayerrenderer.shader.Fragment, ol.renderer.webgl.FragmentShader);
goog.addSingletonGetter(ol.renderer.webgl.tilelayerrenderer.shader.Fragment);
ol.renderer.webgl.tilelayerrenderer.shader.Vertex = function() {
  goog.base(this, ["attribute vec2 aPosition;", "attribute vec2 aTexCoord;", "", "varying vec2 vTexCoord;", "", "uniform vec4 uTileOffset;", "", "void main(void) {", "  gl_Position.xy = aPosition * uTileOffset.xy + uTileOffset.zw;", "  gl_Position.z = 0.;", "  gl_Position.w = 1.;", "  vTexCoord = aTexCoord;", "}"].join("\n"))
};
goog.inherits(ol.renderer.webgl.tilelayerrenderer.shader.Vertex, ol.renderer.webgl.VertexShader);
goog.addSingletonGetter(ol.renderer.webgl.tilelayerrenderer.shader.Vertex);
ol.renderer.webgl.TileLayer = function(mapRenderer, tileLayer) {
  goog.base(this, mapRenderer, tileLayer);
  this.fragmentShader_ = ol.renderer.webgl.tilelayerrenderer.shader.Fragment.getInstance();
  this.vertexShader_ = ol.renderer.webgl.tilelayerrenderer.shader.Vertex.getInstance();
  this.locations_ = null;
  this.arrayBuffer_ = null;
  this.texture_ = null;
  this.framebuffer_ = null;
  this.framebufferDimension_ = undefined;
  this.texCoordMatrix_ = goog.vec.Mat4.createNumber();
  this.projectionMatrix_ = goog.vec.Mat4.createNumberIdentity();
  this.renderedTileRange_ = null;
  this.renderedFramebufferExtent_ = null
};
goog.inherits(ol.renderer.webgl.TileLayer, ol.renderer.webgl.Layer);
ol.renderer.webgl.TileLayer.prototype.bindFramebuffer_ = function(frameState, framebufferDimension) {
  var mapRenderer = this.getMapRenderer();
  var gl = mapRenderer.getGL();
  if(!goog.isDef(this.framebufferDimension_) || this.framebufferDimension_ != framebufferDimension) {
    var map = this.getMap();
    frameState.postRenderFunctions.push(goog.partial(function(gl, framebuffer, texture) {
      if(!gl.isContextLost()) {
        gl.deleteFramebuffer(framebuffer);
        gl.deleteTexture(texture)
      }
    }, gl, this.framebuffer_, this.texture_));
    var texture = gl.createTexture();
    gl.bindTexture(goog.webgl.TEXTURE_2D, texture);
    gl.texImage2D(goog.webgl.TEXTURE_2D, 0, goog.webgl.RGBA, framebufferDimension, framebufferDimension, 0, goog.webgl.RGBA, goog.webgl.UNSIGNED_BYTE, null);
    gl.texParameteri(goog.webgl.TEXTURE_2D, goog.webgl.TEXTURE_MAG_FILTER, goog.webgl.LINEAR);
    gl.texParameteri(goog.webgl.TEXTURE_2D, goog.webgl.TEXTURE_MIN_FILTER, goog.webgl.LINEAR);
    var framebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(goog.webgl.FRAMEBUFFER, framebuffer);
    gl.framebufferTexture2D(goog.webgl.FRAMEBUFFER, goog.webgl.COLOR_ATTACHMENT0, goog.webgl.TEXTURE_2D, texture, 0);
    this.texture_ = texture;
    this.framebuffer_ = framebuffer;
    this.framebufferDimension_ = framebufferDimension
  }else {
    gl.bindFramebuffer(goog.webgl.FRAMEBUFFER, this.framebuffer_)
  }
};
ol.renderer.webgl.TileLayer.prototype.disposeInternal = function() {
  var mapRenderer = this.getMapRenderer();
  var gl = mapRenderer.getGL();
  if(!gl.isContextLost()) {
    gl.deleteBuffer(this.arrayBuffer_);
    gl.deleteFramebuffer(this.framebuffer_);
    gl.deleteTexture(this.texture_)
  }
  goog.base(this, "disposeInternal")
};
ol.renderer.webgl.TileLayer.prototype.getTexCoordMatrix = function() {
  return this.texCoordMatrix_
};
ol.renderer.webgl.TileLayer.prototype.getTexture = function() {
  return this.texture_
};
ol.renderer.webgl.TileLayer.prototype.getProjectionMatrix = function() {
  return this.projectionMatrix_
};
ol.renderer.webgl.TileLayer.prototype.getTileLayer = function() {
  return this.getLayer()
};
ol.renderer.webgl.TileLayer.prototype.handleWebGLContextLost = function() {
  this.locations_ = null;
  this.arrayBuffer_ = null;
  this.texture_ = null;
  this.framebuffer_ = null;
  this.framebufferDimension_ = undefined
};
ol.renderer.webgl.TileLayer.prototype.renderFrame = function(frameState, layerState) {
  var mapRenderer = this.getMapRenderer();
  var gl = mapRenderer.getGL();
  var view2DState = frameState.view2DState;
  var projection = view2DState.projection;
  var center = view2DState.center;
  var tileLayer = this.getTileLayer();
  var tileSource = tileLayer.getTileSource();
  var tileSourceKey = goog.getUid(tileSource).toString();
  var tileGrid = tileSource.getTileGrid();
  if(goog.isNull(tileGrid)) {
    tileGrid = ol.tilegrid.getForProjection(projection)
  }
  var z = tileGrid.getZForResolution(view2DState.resolution);
  var tileResolution = tileGrid.getResolution(z);
  var tileRange = tileGrid.getTileRangeForExtentAndResolution(frameState.extent, tileResolution);
  var framebufferExtent;
  if(!goog.isNull(this.renderedTileRange_) && this.renderedTileRange_.equals(tileRange)) {
    framebufferExtent = this.renderedFramebufferExtent_
  }else {
    var tileRangeSize = tileRange.getSize();
    var tileSize = tileGrid.getTileSize(z);
    var maxDimension = Math.max(tileRangeSize.width * tileSize.width, tileRangeSize.height * tileSize.height);
    var framebufferDimension = Math.pow(2, Math.ceil(Math.log(maxDimension) / Math.log(2)));
    var framebufferExtentSize = new ol.Size(tileResolution * framebufferDimension, tileResolution * framebufferDimension);
    var origin = tileGrid.getOrigin(z);
    var minX = origin.x + tileRange.minX * tileSize.width * tileResolution;
    var minY = origin.y + tileRange.minY * tileSize.height * tileResolution;
    framebufferExtent = new ol.Extent(minX, minY, minX + framebufferExtentSize.width, minY + framebufferExtentSize.height);
    this.bindFramebuffer_(frameState, framebufferDimension);
    gl.viewport(0, 0, framebufferDimension, framebufferDimension);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(goog.webgl.COLOR_BUFFER_BIT);
    gl.disable(goog.webgl.BLEND);
    var program = mapRenderer.getProgram(this.fragmentShader_, this.vertexShader_);
    gl.useProgram(program);
    if(goog.isNull(this.locations_)) {
      this.locations_ = {aPosition:gl.getAttribLocation(program, "aPosition"), aTexCoord:gl.getAttribLocation(program, "aTexCoord"), uTileOffset:gl.getUniformLocation(program, "uTileOffset"), uTexture:gl.getUniformLocation(program, "uTexture")}
    }
    if(goog.isNull(this.arrayBuffer_)) {
      var arrayBuffer = gl.createBuffer();
      gl.bindBuffer(goog.webgl.ARRAY_BUFFER, arrayBuffer);
      gl.bufferData(goog.webgl.ARRAY_BUFFER, new Float32Array([0, 0, 0, 1, 1, 0, 1, 1, 0, 1, 0, 0, 1, 1, 1, 0]), goog.webgl.STATIC_DRAW);
      this.arrayBuffer_ = arrayBuffer
    }else {
      gl.bindBuffer(goog.webgl.ARRAY_BUFFER, this.arrayBuffer_)
    }
    gl.enableVertexAttribArray(this.locations_.aPosition);
    gl.vertexAttribPointer(this.locations_.aPosition, 2, goog.webgl.FLOAT, false, 16, 0);
    gl.enableVertexAttribArray(this.locations_.aTexCoord);
    gl.vertexAttribPointer(this.locations_.aTexCoord, 2, goog.webgl.FLOAT, false, 16, 8);
    gl.uniform1i(this.locations_.uTexture, 0);
    var tilesToDrawByZ = {};
    tilesToDrawByZ[z] = {};
    var getTileIfLoaded = this.createGetTileIfLoadedFunction(function(tile) {
      return!goog.isNull(tile) && tile.getState() == ol.TileState.LOADED && mapRenderer.isTileTextureLoaded(tile)
    }, tileSource, tileGrid, projection);
    var findLoadedTiles = goog.bind(tileSource.findLoadedTiles, tileSource, tilesToDrawByZ, getTileIfLoaded);
    var tilesToLoad = new goog.structs.PriorityQueue;
    var allTilesLoaded = true;
    var deltaX, deltaY, priority, tile, tileCenter, tileCoord, tileState, x, y;
    for(x = tileRange.minX;x <= tileRange.maxX;++x) {
      for(y = tileRange.minY;y <= tileRange.maxY;++y) {
        tileCoord = new ol.TileCoord(z, x, y);
        tile = tileSource.getTile(tileCoord, tileGrid, projection);
        if(goog.isNull(tile)) {
          continue
        }
        tileState = tile.getState();
        if(tileState == ol.TileState.IDLE) {
          this.listenToTileChange(tile);
          this.updateWantedTiles(frameState.wantedTiles, tileSource, tileCoord);
          tileCenter = tileGrid.getTileCoordCenter(tileCoord);
          frameState.tileQueue.enqueue(tile, tileSourceKey, tileCenter)
        }else {
          if(tileState == ol.TileState.LOADED) {
            if(mapRenderer.isTileTextureLoaded(tile)) {
              tilesToDrawByZ[z][tileCoord.toString()] = tile;
              continue
            }else {
              tileCenter = tileGrid.getTileCoordCenter(tileCoord);
              deltaX = tileCenter.x - center.x;
              deltaY = tileCenter.y - center.y;
              priority = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
              tilesToLoad.enqueue(priority, tile)
            }
          }else {
            if(tileState == ol.TileState.ERROR) {
              continue
            }
          }
        }
        allTilesLoaded = false;
        tileGrid.forEachTileCoordParentTileRange(tileCoord, findLoadedTiles)
      }
    }
    var zs = goog.array.map(goog.object.getKeys(tilesToDrawByZ), Number);
    goog.array.sort(zs);
    var uTileOffset = goog.vec.Vec4.createFloat32();
    goog.array.forEach(zs, function(z) {
      goog.object.forEach(tilesToDrawByZ[z], function(tile) {
        var tileExtent = tileGrid.getTileCoordExtent(tile.tileCoord);
        var sx = 2 * tileExtent.getWidth() / framebufferExtentSize.width;
        var sy = 2 * tileExtent.getHeight() / framebufferExtentSize.height;
        var tx = 2 * (tileExtent.minX - framebufferExtent.minX) / framebufferExtentSize.width - 1;
        var ty = 2 * (tileExtent.minY - framebufferExtent.minY) / framebufferExtentSize.height - 1;
        goog.vec.Vec4.setFromValues(uTileOffset, sx, sy, tx, ty);
        gl.uniform4fv(this.locations_.uTileOffset, uTileOffset);
        mapRenderer.bindTileTexture(tile, goog.webgl.LINEAR, goog.webgl.LINEAR);
        gl.drawArrays(goog.webgl.TRIANGLE_STRIP, 0, 4)
      }, this)
    }, this);
    if(!tilesToLoad.isEmpty()) {
      frameState.postRenderFunctions.push(goog.partial(function(mapRenderer, tilesToLoad) {
        var i, tile;
        for(i = 0;!tilesToLoad.isEmpty() && i < 4;++i) {
          tile = tilesToLoad.remove();
          mapRenderer.bindTileTexture(tile, goog.webgl.LINEAR, goog.webgl.LINEAR)
        }
      }, mapRenderer, tilesToLoad))
    }
    if(allTilesLoaded) {
      this.renderedTileRange_ = tileRange;
      this.renderedFramebufferExtent_ = framebufferExtent
    }else {
      this.renderedTileRange_ = null;
      this.renderedFramebufferExtent_ = null;
      frameState.animate = true
    }
  }
  this.updateUsedTiles(frameState.usedTiles, tileSource, z, tileRange);
  tileSource.useLowResolutionTiles(z, frameState.extent, tileGrid);
  this.scheduleExpireCache(frameState, tileSource);
  goog.vec.Mat4.makeIdentity(this.texCoordMatrix_);
  goog.vec.Mat4.translate(this.texCoordMatrix_, (view2DState.center.x - framebufferExtent.minX) / (framebufferExtent.maxX - framebufferExtent.minX), (view2DState.center.y - framebufferExtent.minY) / (framebufferExtent.maxY - framebufferExtent.minY), 0);
  goog.vec.Mat4.rotateZ(this.texCoordMatrix_, view2DState.rotation);
  goog.vec.Mat4.scale(this.texCoordMatrix_, frameState.size.width * view2DState.resolution / (framebufferExtent.maxX - framebufferExtent.minX), frameState.size.height * view2DState.resolution / (framebufferExtent.maxY - framebufferExtent.minY), 1);
  goog.vec.Mat4.translate(this.texCoordMatrix_, -0.5, -0.5, 0)
};
goog.provide("ol.structs.LRUCache");
goog.require("goog.asserts");
goog.require("goog.object");
ol.structs.LRUCache = function() {
  this.count_ = 0;
  this.entries_ = {};
  this.oldest_ = null;
  this.newest_ = null
};
ol.structs.LRUCache.prototype.assertValid = function() {
  if(this.count_ === 0) {
    goog.asserts.assert(goog.object.isEmpty(this.entries_));
    goog.asserts.assert(goog.isNull(this.oldest_));
    goog.asserts.assert(goog.isNull(this.newest_))
  }else {
    goog.asserts.assert(goog.object.getCount(this.entries_) == this.count_);
    goog.asserts.assert(!goog.isNull(this.oldest_));
    goog.asserts.assert(goog.isNull(this.oldest_.older));
    goog.asserts.assert(!goog.isNull(this.newest_));
    goog.asserts.assert(goog.isNull(this.newest_.newer));
    var i, entry;
    var older = null;
    i = 0;
    for(entry = this.oldest_;!goog.isNull(entry);entry = entry.newer) {
      goog.asserts.assert(entry.older === older);
      older = entry;
      ++i
    }
    goog.asserts.assert(i == this.count_);
    var newer = null;
    i = 0;
    for(entry = this.newest_;!goog.isNull(entry);entry = entry.older) {
      goog.asserts.assert(entry.newer === newer);
      newer = entry;
      ++i
    }
    goog.asserts.assert(i == this.count_)
  }
};
ol.structs.LRUCache.prototype.clear = function() {
  this.count_ = 0;
  this.entries_ = {};
  this.oldest_ = null;
  this.newest_ = null
};
ol.structs.LRUCache.prototype.containsKey = function(key) {
  return this.entries_.hasOwnProperty(key)
};
ol.structs.LRUCache.prototype.forEach = function(f, opt_obj) {
  var entry = this.oldest_;
  while(!goog.isNull(entry)) {
    f.call(opt_obj, entry.value_, entry.key_, this);
    entry = entry.newer
  }
};
ol.structs.LRUCache.prototype.get = function(key) {
  var entry = this.entries_[key];
  goog.asserts.assert(goog.isDef(entry));
  if(entry === this.newest_) {
    return entry.value_
  }else {
    if(entry === this.oldest_) {
      this.oldest_ = this.oldest_.newer;
      this.oldest_.older = null
    }else {
      entry.newer.older = entry.older;
      entry.older.newer = entry.newer
    }
  }
  entry.newer = null;
  entry.older = this.newest_;
  this.newest_.newer = entry;
  this.newest_ = entry;
  return entry.value_
};
ol.structs.LRUCache.prototype.getCount = function() {
  return this.count_
};
ol.structs.LRUCache.prototype.getKeys = function() {
  var keys = new Array(this.count_);
  var i = 0;
  var entry;
  for(entry = this.newest_;!goog.isNull(entry);entry = entry.older) {
    keys[i++] = entry.key_
  }
  goog.asserts.assert(i == this.count_);
  return keys
};
ol.structs.LRUCache.prototype.getValues = function() {
  var values = new Array(this.count_);
  var i = 0;
  var entry;
  for(entry = this.newest_;!goog.isNull(entry);entry = entry.older) {
    values[i++] = entry.value_
  }
  goog.asserts.assert(i == this.count_);
  return values
};
ol.structs.LRUCache.prototype.peekLast = function() {
  goog.asserts.assert(!goog.isNull(this.oldest_));
  return this.oldest_.value_
};
ol.structs.LRUCache.prototype.peekLastKey = function() {
  goog.asserts.assert(!goog.isNull(this.oldest_));
  return this.oldest_.key_
};
ol.structs.LRUCache.prototype.pop = function() {
  goog.asserts.assert(!goog.isNull(this.oldest_));
  goog.asserts.assert(!goog.isNull(this.newest_));
  var entry = this.oldest_;
  goog.asserts.assert(entry.key_ in this.entries_);
  delete this.entries_[entry.key_];
  if(!goog.isNull(entry.newer)) {
    entry.newer.older = null
  }
  this.oldest_ = entry.newer;
  if(goog.isNull(this.oldest_)) {
    this.newest_ = null
  }
  --this.count_;
  return entry.value_
};
ol.structs.LRUCache.prototype.set = function(key, value) {
  goog.asserts.assert(!(key in {}));
  goog.asserts.assert(!(key in this.entries_));
  var entry = {key_:key, newer:null, older:this.newest_, value_:value};
  if(goog.isNull(this.newest_)) {
    this.oldest_ = entry
  }else {
    this.newest_.newer = entry
  }
  this.newest_ = entry;
  this.entries_[key] = entry;
  ++this.count_
};
ol.structs.LRUCacheEntry;
goog.provide("ol.webgl");
goog.provide("ol.webgl.WebGLContextEventType");
ol.webgl.CONTEXT_IDS_ = ["webgl", "webgl-experimental", "webkit-3d", "moz-webgl"];
ol.webgl.WebGLContextEventType = {LOST:"webglcontextlost", RESTORED:"webglcontextrestored"};
ol.webgl.getContext = function(canvas, opt_attributes) {
  var context, i, ii = ol.webgl.CONTEXT_IDS_.length;
  for(i = 0;i < ii;++i) {
    try {
      context = canvas.getContext(ol.webgl.CONTEXT_IDS_[i], opt_attributes);
      if(!goog.isNull(context)) {
        return context
      }
    }catch(e) {
    }
  }
  return null
};
ol.webgl.SUPPORTED = function() {
  if(!("WebGLRenderingContext" in goog.global)) {
    return false
  }
  try {
    var canvas = goog.dom.createElement(goog.dom.TagName.CANVAS);
    return!goog.isNull(ol.webgl.getContext(canvas))
  }catch(e) {
    return false
  }
}();
goog.provide("ol.renderer.webgl.Map");
goog.provide("ol.renderer.webgl.map.shader");
goog.require("goog.array");
goog.require("goog.debug.Logger");
goog.require("goog.dom");
goog.require("goog.dom.TagName");
goog.require("goog.events");
goog.require("goog.events.Event");
goog.require("goog.style");
goog.require("goog.webgl");
goog.require("ol.FrameState");
goog.require("ol.Size");
goog.require("ol.Tile");
goog.require("ol.layer.ImageLayer");
goog.require("ol.layer.TileLayer");
goog.require("ol.renderer.Map");
goog.require("ol.renderer.webgl.FragmentShader");
goog.require("ol.renderer.webgl.ImageLayer");
goog.require("ol.renderer.webgl.TileLayer");
goog.require("ol.renderer.webgl.VertexShader");
goog.require("ol.structs.LRUCache");
goog.require("ol.webgl");
goog.require("ol.webgl.WebGLContextEventType");
ol.WEBGL_TEXTURE_CACHE_HIGH_WATER_MARK = 1024;
ol.renderer.webgl.TextureCacheEntry;
ol.renderer.webgl.map.shader.Fragment = function() {
  goog.base(this, ["precision mediump float;", "", "uniform mat4 u_colorMatrix;", "uniform float u_opacity;", "uniform sampler2D u_texture;", "", "varying vec2 v_texCoord;", "", "void main(void) {", "", "  vec4 texColor = texture2D(u_texture, v_texCoord);", "  vec4 color = u_colorMatrix * vec4(texColor.rgb, 1.);", "  color.a = texColor.a * u_opacity;", "", "  gl_FragColor = color;", "", "}"].join("\n"))
};
goog.inherits(ol.renderer.webgl.map.shader.Fragment, ol.renderer.webgl.FragmentShader);
goog.addSingletonGetter(ol.renderer.webgl.map.shader.Fragment);
ol.renderer.webgl.map.shader.Vertex = function() {
  goog.base(this, ["attribute vec2 a_position;", "attribute vec2 a_texCoord;", "", "uniform mat4 u_texCoordMatrix;", "uniform mat4 u_projectionMatrix;", "", "varying vec2 v_texCoord;", "", "void main(void) {", "  gl_Position = u_projectionMatrix * vec4(a_position, 0., 1.);", "  v_texCoord = (u_texCoordMatrix * vec4(a_texCoord, 0., 1.)).st;", "}"].join("\n"))
};
goog.inherits(ol.renderer.webgl.map.shader.Vertex, ol.renderer.webgl.VertexShader);
goog.addSingletonGetter(ol.renderer.webgl.map.shader.Vertex);
ol.renderer.webgl.Map = function(container, map) {
  goog.base(this, container, map);
  if(goog.DEBUG) {
    this.logger = goog.debug.Logger.getLogger("ol.renderer.webgl.maprenderer." + goog.getUid(this))
  }
  this.canvas_ = goog.dom.createElement(goog.dom.TagName.CANVAS);
  this.canvas_.height = container.clientHeight;
  this.canvas_.width = container.clientWidth;
  this.canvas_.className = "ol-unselectable";
  goog.dom.insertChildAt(container, this.canvas_, 0);
  this.renderedVisible_ = true;
  this.canvasSize_ = new ol.Size(container.clientHeight, container.clientWidth);
  this.gl_ = ol.webgl.getContext(this.canvas_, {alpha:false, antialias:true, depth:false, preserveDrawingBuffer:false, stencil:false});
  goog.asserts.assert(!goog.isNull(this.gl_));
  goog.events.listen(this.canvas_, ol.webgl.WebGLContextEventType.LOST, this.handleWebGLContextLost, false, this);
  goog.events.listen(this.canvas_, ol.webgl.WebGLContextEventType.RESTORED, this.handleWebGLContextResourced, false, this);
  this.locations_ = null;
  this.arrayBuffer_ = null;
  this.shaderCache_ = {};
  this.programCache_ = {};
  this.textureCache_ = new ol.structs.LRUCache;
  this.textureCacheFrameMarkerCount_ = 0;
  this.fragmentShader_ = ol.renderer.webgl.map.shader.Fragment.getInstance();
  this.vertexShader_ = ol.renderer.webgl.map.shader.Vertex.getInstance();
  this.initializeGL_()
};
goog.inherits(ol.renderer.webgl.Map, ol.renderer.Map);
ol.renderer.webgl.Map.prototype.addLayer = function(layer) {
  goog.base(this, "addLayer", layer);
  if(layer.getVisible()) {
    this.getMap().render()
  }
};
ol.renderer.webgl.Map.prototype.bindTileTexture = function(tile, magFilter, minFilter) {
  var gl = this.getGL();
  var tileKey = tile.getKey();
  if(this.textureCache_.containsKey(tileKey)) {
    var textureCacheEntry = this.textureCache_.get(tileKey);
    gl.bindTexture(goog.webgl.TEXTURE_2D, textureCacheEntry.texture);
    if(textureCacheEntry.magFilter != magFilter) {
      gl.texParameteri(goog.webgl.TEXTURE_2D, goog.webgl.TEXTURE_MAG_FILTER, magFilter);
      textureCacheEntry.magFilter = magFilter
    }
    if(textureCacheEntry.minFilter != minFilter) {
      gl.texParameteri(goog.webgl.TEXTURE_2D, goog.webgl.TEXTURE_MAG_FILTER, minFilter);
      textureCacheEntry.minFilter = minFilter
    }
  }else {
    var texture = gl.createTexture();
    gl.bindTexture(goog.webgl.TEXTURE_2D, texture);
    gl.texImage2D(goog.webgl.TEXTURE_2D, 0, goog.webgl.RGBA, goog.webgl.RGBA, goog.webgl.UNSIGNED_BYTE, tile.getImage());
    gl.texParameteri(goog.webgl.TEXTURE_2D, goog.webgl.TEXTURE_MAG_FILTER, magFilter);
    gl.texParameteri(goog.webgl.TEXTURE_2D, goog.webgl.TEXTURE_MIN_FILTER, minFilter);
    gl.texParameteri(goog.webgl.TEXTURE_2D, goog.webgl.TEXTURE_WRAP_S, goog.webgl.CLAMP_TO_EDGE);
    gl.texParameteri(goog.webgl.TEXTURE_2D, goog.webgl.TEXTURE_WRAP_T, goog.webgl.CLAMP_TO_EDGE);
    this.textureCache_.set(tileKey, {texture:texture, magFilter:magFilter, minFilter:minFilter})
  }
};
ol.renderer.webgl.Map.prototype.createLayerRenderer = function(layer) {
  var layerRenderer = null;
  if(layer instanceof ol.layer.TileLayer) {
    layerRenderer = new ol.renderer.webgl.TileLayer(this, layer)
  }else {
    if(layer instanceof ol.layer.ImageLayer) {
      layerRenderer = new ol.renderer.webgl.ImageLayer(this, layer)
    }else {
      goog.asserts.assert(false)
    }
  }
  return layerRenderer
};
ol.renderer.webgl.Map.prototype.disposeInternal = function() {
  var gl = this.getGL();
  if(!gl.isContextLost()) {
    goog.object.forEach(this.programCache_, function(program) {
      gl.deleteProgram(program)
    });
    goog.object.forEach(this.shaderCache_, function(shader) {
      gl.deleteShader(shader)
    });
    this.textureCache_.forEach(function(textureCacheEntry) {
      if(!goog.isNull(textureCacheEntry)) {
        gl.deleteTexture(textureCacheEntry.texture)
      }
    })
  }
  goog.base(this, "disposeInternal")
};
ol.renderer.webgl.Map.prototype.expireCache_ = function(map, frameState) {
  var gl = this.getGL();
  var key, textureCacheEntry;
  while(this.textureCache_.getCount() - this.textureCacheFrameMarkerCount_ > ol.WEBGL_TEXTURE_CACHE_HIGH_WATER_MARK) {
    textureCacheEntry = this.textureCache_.peekLast();
    if(goog.isNull(textureCacheEntry)) {
      if(+this.textureCache_.peekLastKey() == frameState.time) {
        break
      }else {
        --this.textureCacheFrameMarkerCount_
      }
    }else {
      gl.deleteTexture(textureCacheEntry.texture)
    }
    this.textureCache_.pop()
  }
};
ol.renderer.webgl.Map.prototype.getCanvas = function() {
  return this.canvas_
};
ol.renderer.webgl.Map.prototype.getGL = function() {
  return this.gl_
};
ol.renderer.webgl.Map.prototype.getProgram = function(fragmentShaderObject, vertexShaderObject) {
  var programKey = goog.getUid(fragmentShaderObject) + "/" + goog.getUid(vertexShaderObject);
  if(programKey in this.programCache_) {
    return this.programCache_[programKey]
  }else {
    var gl = this.getGL();
    var program = gl.createProgram();
    gl.attachShader(program, this.getShader(fragmentShaderObject));
    gl.attachShader(program, this.getShader(vertexShaderObject));
    gl.linkProgram(program);
    if(goog.DEBUG) {
      if(!gl.getProgramParameter(program, goog.webgl.LINK_STATUS) && !gl.isContextLost()) {
        this.logger.severe(gl.getProgramInfoLog(program));
        goog.asserts.assert(gl.getProgramParameter(program, goog.webgl.LINK_STATUS))
      }
    }
    this.programCache_[programKey] = program;
    return program
  }
};
ol.renderer.webgl.Map.prototype.getShader = function(shaderObject) {
  var shaderKey = goog.getUid(shaderObject);
  if(shaderKey in this.shaderCache_) {
    return this.shaderCache_[shaderKey]
  }else {
    var gl = this.getGL();
    var shader = gl.createShader(shaderObject.getType());
    gl.shaderSource(shader, shaderObject.getSource());
    gl.compileShader(shader);
    if(goog.DEBUG) {
      if(!gl.getShaderParameter(shader, goog.webgl.COMPILE_STATUS) && !gl.isContextLost()) {
        this.logger.severe(gl.getShaderInfoLog(shader));
        goog.asserts.assert(gl.getShaderParameter(shader, goog.webgl.COMPILE_STATUS))
      }
    }
    this.shaderCache_[shaderKey] = shader;
    return shader
  }
};
ol.renderer.webgl.Map.prototype.handleWebGLContextLost = function(event) {
  if(goog.DEBUG) {
    this.logger.info("WebGLContextLost")
  }
  event.preventDefault();
  this.locations_ = null;
  this.arrayBuffer_ = null;
  this.shaderCache_ = {};
  this.programCache_ = {};
  this.textureCache_.clear();
  this.textureCacheFrameMarkerCount_ = 0;
  goog.object.forEach(this.layerRenderers, function(layerRenderer) {
    layerRenderer.handleWebGLContextLost()
  })
};
ol.renderer.webgl.Map.prototype.handleWebGLContextResourced = function() {
  if(goog.DEBUG) {
    this.logger.info("WebGLContextResourced")
  }
  this.initializeGL_();
  this.getMap().render()
};
ol.renderer.webgl.Map.prototype.initializeGL_ = function() {
  var gl = this.gl_;
  gl.activeTexture(goog.webgl.TEXTURE0);
  gl.blendFunc(goog.webgl.SRC_ALPHA, goog.webgl.ONE_MINUS_SRC_ALPHA);
  gl.disable(goog.webgl.CULL_FACE);
  gl.disable(goog.webgl.DEPTH_TEST);
  gl.disable(goog.webgl.SCISSOR_TEST)
};
ol.renderer.webgl.Map.prototype.isTileTextureLoaded = function(tile) {
  return this.textureCache_.containsKey(tile.getKey())
};
ol.renderer.webgl.Map.prototype.removeLayer = function(layer) {
  goog.base(this, "removeLayer", layer);
  if(layer.getVisible()) {
    this.getMap().render()
  }
};
ol.renderer.webgl.Map.prototype.renderFrame = function(frameState) {
  var gl = this.getGL();
  if(goog.isNull(frameState)) {
    if(this.renderedVisible_) {
      goog.style.showElement(this.canvas_, false);
      this.renderedVisible_ = false
    }
    return false
  }
  this.textureCache_.set(frameState.time.toString(), null);
  ++this.textureCacheFrameMarkerCount_;
  goog.array.forEach(frameState.layersArray, function(layer) {
    var layerState = frameState.layerStates[goog.getUid(layer)];
    if(!layerState.visible || !layerState.ready) {
      return
    }
    var layerRenderer = this.getLayerRenderer(layer);
    layerRenderer.renderFrame(frameState, layerState)
  }, this);
  var size = frameState.size;
  if(!this.canvasSize_.equals(size)) {
    this.canvas_.width = size.width;
    this.canvas_.height = size.height;
    this.canvasSize_ = size
  }
  gl.bindFramebuffer(goog.webgl.FRAMEBUFFER, null);
  var clearColor = frameState.backgroundColor;
  gl.clearColor(clearColor.r / 255, clearColor.g / 255, clearColor.b / 255, clearColor.a);
  gl.clear(goog.webgl.COLOR_BUFFER_BIT);
  gl.enable(goog.webgl.BLEND);
  gl.viewport(0, 0, size.width, size.height);
  var program = this.getProgram(this.fragmentShader_, this.vertexShader_);
  gl.useProgram(program);
  if(goog.isNull(this.locations_)) {
    this.locations_ = {a_position:gl.getAttribLocation(program, "a_position"), a_texCoord:gl.getAttribLocation(program, "a_texCoord"), u_colorMatrix:gl.getUniformLocation(program, "u_colorMatrix"), u_texCoordMatrix:gl.getUniformLocation(program, "u_texCoordMatrix"), u_projectionMatrix:gl.getUniformLocation(program, "u_projectionMatrix"), u_opacity:gl.getUniformLocation(program, "u_opacity"), u_texture:gl.getUniformLocation(program, "u_texture")}
  }
  if(goog.isNull(this.arrayBuffer_)) {
    var arrayBuffer = gl.createBuffer();
    gl.bindBuffer(goog.webgl.ARRAY_BUFFER, arrayBuffer);
    gl.bufferData(goog.webgl.ARRAY_BUFFER, new Float32Array([-1, -1, 0, 0, 1, -1, 1, 0, -1, 1, 0, 1, 1, 1, 1, 1]), goog.webgl.STATIC_DRAW);
    this.arrayBuffer_ = arrayBuffer
  }else {
    gl.bindBuffer(goog.webgl.ARRAY_BUFFER, this.arrayBuffer_)
  }
  gl.enableVertexAttribArray(this.locations_.a_position);
  gl.vertexAttribPointer(this.locations_.a_position, 2, goog.webgl.FLOAT, false, 16, 0);
  gl.enableVertexAttribArray(this.locations_.a_texCoord);
  gl.vertexAttribPointer(this.locations_.a_texCoord, 2, goog.webgl.FLOAT, false, 16, 8);
  gl.uniform1i(this.locations_.u_texture, 0);
  goog.array.forEach(frameState.layersArray, function(layer) {
    var layerState = frameState.layerStates[goog.getUid(layer)];
    if(!layerState.visible || !layerState.ready) {
      return
    }
    var layerRenderer = this.getLayerRenderer(layer);
    gl.uniformMatrix4fv(this.locations_.u_texCoordMatrix, false, layerRenderer.getTexCoordMatrix());
    gl.uniformMatrix4fv(this.locations_.u_projectionMatrix, false, layerRenderer.getProjectionMatrix());
    gl.uniformMatrix4fv(this.locations_.u_colorMatrix, false, layerRenderer.getColorMatrix());
    gl.uniform1f(this.locations_.u_opacity, layer.getOpacity());
    gl.bindTexture(goog.webgl.TEXTURE_2D, layerRenderer.getTexture());
    gl.drawArrays(goog.webgl.TRIANGLE_STRIP, 0, 4)
  }, this);
  if(!this.renderedVisible_) {
    goog.style.showElement(this.canvas_, true);
    this.renderedVisible_ = true
  }
  this.calculateMatrices2D(frameState);
  if(this.textureCache_.getCount() - this.textureCacheFrameMarkerCount_ > ol.WEBGL_TEXTURE_CACHE_HIGH_WATER_MARK) {
    frameState.postRenderFunctions.push(goog.bind(this.expireCache_, this))
  }
};
goog.provide("ol.renderer.webgl.SUPPORTED");
goog.require("ol.webgl");
ol.renderer.webgl.SUPPORTED = ol.webgl.SUPPORTED;
goog.provide("ol.Map");
goog.provide("ol.MapProperty");
goog.provide("ol.RendererHint");
goog.provide("ol.RendererHints");
goog.require("goog.Uri.QueryData");
goog.require("goog.async.AnimationDelay");
goog.require("goog.debug.Logger");
goog.require("goog.dom");
goog.require("goog.dom.ViewportSizeMonitor");
goog.require("goog.events");
goog.require("goog.events.BrowserEvent");
goog.require("goog.events.Event");
goog.require("goog.events.EventType");
goog.require("goog.events.KeyHandler");
goog.require("goog.events.KeyHandler.EventType");
goog.require("goog.events.MouseWheelHandler");
goog.require("goog.events.MouseWheelHandler.EventType");
goog.require("ol.BrowserFeature");
goog.require("ol.Collection");
goog.require("ol.Color");
goog.require("ol.Coordinate");
goog.require("ol.Extent");
goog.require("ol.FrameState");
goog.require("ol.IView");
goog.require("ol.Kinetic");
goog.require("ol.MapBrowserEvent");
goog.require("ol.MapBrowserEvent.EventType");
goog.require("ol.MapBrowserEventHandler");
goog.require("ol.MapEvent");
goog.require("ol.MapEventType");
goog.require("ol.Object");
goog.require("ol.ObjectEventType");
goog.require("ol.Pixel");
goog.require("ol.PostRenderFunction");
goog.require("ol.PreRenderFunction");
goog.require("ol.Size");
goog.require("ol.Tile");
goog.require("ol.TileQueue");
goog.require("ol.View");
goog.require("ol.View2D");
goog.require("ol.control.Attribution");
goog.require("ol.control.Control");
goog.require("ol.control.ScaleLine");
goog.require("ol.control.Zoom");
goog.require("ol.interaction.DblClickZoom");
goog.require("ol.interaction.DragPan");
goog.require("ol.interaction.DragRotate");
goog.require("ol.interaction.DragZoom");
goog.require("ol.interaction.Interaction");
goog.require("ol.interaction.KeyboardPan");
goog.require("ol.interaction.KeyboardZoom");
goog.require("ol.interaction.MouseWheelZoom");
goog.require("ol.interaction.TouchPan");
goog.require("ol.interaction.TouchRotate");
goog.require("ol.interaction.TouchZoom");
goog.require("ol.interaction.condition");
goog.require("ol.layer.Layer");
goog.require("ol.projection");
goog.require("ol.projection.addCommonProjections");
goog.require("ol.renderer.Map");
goog.require("ol.renderer.canvas.Map");
goog.require("ol.renderer.canvas.SUPPORTED");
goog.require("ol.renderer.dom.Map");
goog.require("ol.renderer.dom.SUPPORTED");
goog.require("ol.renderer.webgl.Map");
goog.require("ol.renderer.webgl.SUPPORTED");
ol.ENABLE_CANVAS = true;
ol.ENABLE_DOM = true;
ol.ENABLE_WEBGL = true;
ol.RendererHint = {CANVAS:"canvas", DOM:"dom", WEBGL:"webgl"};
ol.DEFAULT_RENDERER_HINTS = [ol.RendererHint.WEBGL, ol.RendererHint.CANVAS, ol.RendererHint.DOM];
ol.MapProperty = {BACKGROUND_COLOR:"backgroundColor", LAYERS:"layers", SIZE:"size", VIEW:"view"};
ol.Map = function(mapOptions) {
  goog.base(this);
  if(goog.DEBUG) {
    this.logger = goog.debug.Logger.getLogger("ol.map." + goog.getUid(this))
  }
  var mapOptionsInternal = ol.Map.createOptionsInternal(mapOptions);
  this.animationDelay_ = new goog.async.AnimationDelay(this.renderFrame_, undefined, this);
  this.registerDisposable(this.animationDelay_);
  this.coordinateToPixelMatrix_ = goog.vec.Mat4.createNumber();
  this.pixelToCoordinateMatrix_ = goog.vec.Mat4.createNumber();
  this.frameState_ = null;
  this.freezeRenderingCount_ = 0;
  this.dirty_ = false;
  this.target_ = mapOptionsInternal.target;
  this.viewPropertyListenerKey_ = null;
  this.viewport_ = goog.dom.createDom(goog.dom.TagName.DIV, "ol-viewport");
  this.viewport_.style.position = "relative";
  this.viewport_.style.overflow = "hidden";
  this.viewport_.style.width = "100%";
  this.viewport_.style.height = "100%";
  this.viewport_.style.msTouchAction = "none";
  goog.dom.appendChild(this.target_, this.viewport_);
  this.overlayContainer_ = goog.dom.createDom(goog.dom.TagName.DIV, "ol-overlaycontainer");
  goog.events.listen(this.overlayContainer_, [goog.events.EventType.CLICK, ol.BrowserFeature.HAS_TOUCH ? goog.events.EventType.TOUCHSTART : goog.events.EventType.MOUSEDOWN], goog.events.Event.stopPropagation);
  goog.dom.appendChild(this.viewport_, this.overlayContainer_);
  var mapBrowserEventHandler = new ol.MapBrowserEventHandler(this);
  goog.events.listen(mapBrowserEventHandler, goog.object.getValues(ol.MapBrowserEvent.EventType), this.handleMapBrowserEvent, false, this);
  this.registerDisposable(mapBrowserEventHandler);
  var keyHandler = new goog.events.KeyHandler(document);
  goog.events.listen(keyHandler, goog.events.KeyHandler.EventType.KEY, this.handleBrowserEvent, false, this);
  this.registerDisposable(keyHandler);
  var mouseWheelHandler = new goog.events.MouseWheelHandler(this.viewport_);
  goog.events.listen(mouseWheelHandler, goog.events.MouseWheelHandler.EventType.MOUSEWHEEL, this.handleBrowserEvent, false, this);
  this.registerDisposable(mouseWheelHandler);
  this.interactions_ = mapOptionsInternal.interactions;
  this.renderer_ = new mapOptionsInternal.rendererConstructor(this.viewport_, this);
  this.registerDisposable(this.renderer_);
  this.viewportSizeMonitor_ = new goog.dom.ViewportSizeMonitor;
  goog.events.listen(this.viewportSizeMonitor_, goog.events.EventType.RESIZE, this.handleBrowserWindowResize, false, this);
  this.preRenderFunctions_ = [];
  this.postRenderFunctions_ = [];
  this.handlePostRender_ = goog.bind(this.handlePostRender, this);
  this.tileQueue_ = new ol.TileQueue(goog.bind(this.getTilePriority, this));
  goog.events.listen(this, ol.Object.getChangedEventType(ol.MapProperty.VIEW), this.handleViewChanged_, false, this);
  goog.events.listen(this, ol.Object.getChangedEventType(ol.MapProperty.SIZE), this.handleSizeChanged_, false, this);
  goog.events.listen(this, ol.Object.getChangedEventType(ol.MapProperty.BACKGROUND_COLOR), this.handleBackgroundColorChanged_, false, this);
  this.setValues(mapOptionsInternal.values);
  this.handleBrowserWindowResize();
  var controls = mapOptionsInternal.controls;
  goog.array.forEach(controls, function(control) {
    control.setMap(this)
  }, this)
};
goog.inherits(ol.Map, ol.Object);
ol.Map.prototype.addPreRenderFunction = function(preRenderFunction) {
  this.requestRenderFrame();
  this.preRenderFunctions_.push(preRenderFunction)
};
ol.Map.prototype.addPreRenderFunctions = function(preRenderFunctions) {
  this.requestRenderFrame();
  Array.prototype.push.apply(this.preRenderFunctions_, preRenderFunctions)
};
ol.Map.prototype.removePreRenderFunction = function(preRenderFunction) {
  return goog.array.remove(this.preRenderFunctions_, preRenderFunction)
};
ol.Map.prototype.disposeInternal = function() {
  goog.dom.removeNode(this.viewport_);
  goog.base(this, "disposeInternal")
};
ol.Map.prototype.freezeRendering = function() {
  ++this.freezeRenderingCount_
};
ol.Map.prototype.getBackgroundColor = function() {
  return this.get(ol.MapProperty.BACKGROUND_COLOR)
};
goog.exportProperty(ol.Map.prototype, "getBackgroundColor", ol.Map.prototype.getBackgroundColor);
ol.Map.prototype.getRenderer = function() {
  return this.renderer_
};
ol.Map.prototype.getTarget = function() {
  return this.target_
};
ol.Map.prototype.getCoordinateFromPixel = function(pixel) {
  var frameState = this.frameState_;
  if(goog.isNull(frameState)) {
    return null
  }else {
    var vec3 = [pixel.x, pixel.y, 0];
    goog.vec.Mat4.multVec3(frameState.pixelToCoordinateMatrix, vec3, vec3);
    return new ol.Coordinate(vec3[0], vec3[1])
  }
};
ol.Map.prototype.getInteractions = function() {
  return this.interactions_
};
ol.Map.prototype.getLayers = function() {
  return this.get(ol.MapProperty.LAYERS)
};
goog.exportProperty(ol.Map.prototype, "getLayers", ol.Map.prototype.getLayers);
ol.Map.prototype.getPixelFromCoordinate = function(coordinate) {
  var frameState = this.frameState_;
  if(goog.isNull(frameState)) {
    return null
  }else {
    var vec3 = [coordinate.x, coordinate.y, 0];
    goog.vec.Mat4.multVec3(frameState.coordinateToPixelMatrix, vec3, vec3);
    return new ol.Pixel(vec3[0], vec3[1])
  }
};
ol.Map.prototype.getSize = function() {
  return this.get(ol.MapProperty.SIZE)
};
goog.exportProperty(ol.Map.prototype, "getSize", ol.Map.prototype.getSize);
ol.Map.prototype.getView = function() {
  return this.get(ol.MapProperty.VIEW)
};
goog.exportProperty(ol.Map.prototype, "getView", ol.Map.prototype.getView);
ol.Map.prototype.getViewport = function() {
  return this.viewport_
};
ol.Map.prototype.getOverlayContainer = function() {
  return this.overlayContainer_
};
ol.Map.prototype.getTilePriority = function(tile, tileSourceKey, tileCenter) {
  var frameState = this.frameState_;
  if(goog.isNull(frameState) || !(tileSourceKey in frameState.wantedTiles)) {
    return ol.TileQueue.DROP
  }
  var coordKey = tile.tileCoord.toString();
  if(!frameState.wantedTiles[tileSourceKey][coordKey]) {
    return ol.TileQueue.DROP
  }
  var center = frameState.view2DState.center;
  var deltaX = tileCenter.x - center.x;
  var deltaY = tileCenter.y - center.y;
  return deltaX * deltaX + deltaY * deltaY
};
ol.Map.prototype.handleBrowserEvent = function(browserEvent, opt_type) {
  var type = opt_type || browserEvent.type;
  var mapBrowserEvent = new ol.MapBrowserEvent(type, this, browserEvent);
  this.handleMapBrowserEvent(mapBrowserEvent)
};
ol.Map.prototype.handleMapBrowserEvent = function(mapBrowserEvent) {
  mapBrowserEvent.frameState = this.frameState_;
  var interactions = this.getInteractions();
  var interactionsArray = interactions.getArray();
  if(this.dispatchEvent(mapBrowserEvent) !== false) {
    for(var i = interactionsArray.length - 1;i >= 0;i--) {
      var interaction = interactionsArray[i];
      interaction.handleMapBrowserEvent(mapBrowserEvent);
      if(mapBrowserEvent.defaultPrevented) {
        break
      }
    }
  }
};
ol.Map.prototype.handlePostRender = function() {
  this.tileQueue_.reprioritize();
  this.tileQueue_.loadMoreTiles();
  var postRenderFunctions = this.postRenderFunctions_;
  var i;
  for(i = 0;i < postRenderFunctions.length;++i) {
    postRenderFunctions[i](this, this.frameState_)
  }
  postRenderFunctions.length = 0
};
ol.Map.prototype.handleBackgroundColorChanged_ = function() {
  this.render()
};
ol.Map.prototype.handleBrowserWindowResize = function() {
  var size = new ol.Size(this.target_.clientWidth, this.target_.clientHeight);
  this.setSize(size)
};
ol.Map.prototype.handleSizeChanged_ = function() {
  this.render()
};
ol.Map.prototype.handleViewPropertyChanged_ = function() {
  this.render()
};
ol.Map.prototype.handleViewChanged_ = function() {
  if(!goog.isNull(this.viewPropertyListenerKey_)) {
    goog.events.unlistenByKey(this.viewPropertyListenerKey_);
    this.viewPropertyListenerKey_ = null
  }
  var view = this.getView();
  if(goog.isDefAndNotNull(view)) {
    this.viewPropertyListenerKey_ = goog.events.listen(view, ol.ObjectEventType.CHANGED, this.handleViewPropertyChanged_, false, this)
  }
  this.render()
};
ol.Map.prototype.isDef = function() {
  var view = this.getView();
  return goog.isDef(view) && view.isDef() && goog.isDefAndNotNull(this.getSize())
};
ol.Map.prototype.render = function() {
  if(this.animationDelay_.isActive()) {
  }else {
    if(this.freezeRenderingCount_ === 0) {
      this.animationDelay_.fire()
    }else {
      this.dirty_ = true
    }
  }
};
ol.Map.prototype.requestRenderFrame = function() {
  if(this.freezeRenderingCount_ === 0) {
    if(!this.animationDelay_.isActive()) {
      this.animationDelay_.start()
    }
  }else {
    this.dirty_ = true
  }
};
ol.Map.prototype.renderFrame_ = function(time) {
  var i;
  if(this.freezeRenderingCount_ != 0) {
    return
  }
  if(goog.DEBUG) {
    this.logger.info("renderFrame_")
  }
  var size = this.getSize();
  var layers = this.getLayers();
  var layersArray = goog.isDef(layers) ? layers.getArray() : undefined;
  var view = this.getView();
  var view2D = goog.isDef(view) ? this.getView().getView2D() : undefined;
  var frameState = null;
  if(goog.isDef(layersArray) && goog.isDef(size) && goog.isDef(view2D) && view2D.isDef()) {
    var backgroundColor = this.getBackgroundColor();
    var viewHints = view.getHints();
    var layerStates = {};
    var layer;
    for(i = 0;i < layersArray.length;++i) {
      layer = layersArray[i];
      layerStates[goog.getUid(layer)] = layer.getLayerState()
    }
    var view2DState = view2D.getView2DState();
    frameState = {animate:false, attributions:{}, backgroundColor:goog.isDef(backgroundColor) ? backgroundColor : new ol.Color(255, 255, 255, 1), coordinateToPixelMatrix:this.coordinateToPixelMatrix_, extent:null, layersArray:layersArray, layerStates:layerStates, pixelToCoordinateMatrix:this.pixelToCoordinateMatrix_, postRenderFunctions:[], size:size, tileQueue:this.tileQueue_, time:time, usedTiles:{}, view2DState:view2DState, viewHints:viewHints, wantedTiles:{}}
  }
  var preRenderFunctions = this.preRenderFunctions_;
  var n = 0, preRenderFunction;
  for(i = 0;i < preRenderFunctions.length;++i) {
    preRenderFunction = preRenderFunctions[i];
    if(preRenderFunction(this, frameState)) {
      preRenderFunctions[n++] = preRenderFunction
    }
  }
  preRenderFunctions.length = n;
  if(!goog.isNull(frameState)) {
    var center = view2DState.center;
    var resolution = view2DState.resolution;
    var rotation = view2DState.rotation;
    var x = resolution * size.width / 2;
    var y = resolution * size.height / 2;
    var corners = [new ol.Coordinate(-x, -y), new ol.Coordinate(-x, y), new ol.Coordinate(x, -y), new ol.Coordinate(x, y)];
    var corner;
    for(i = 0;i < 4;++i) {
      corner = corners[i];
      corner.rotate(rotation);
      corner.add(center)
    }
    frameState.extent = ol.Extent.boundingExtent.apply(null, corners)
  }
  this.frameState_ = frameState;
  this.renderer_.renderFrame(frameState);
  this.dirty_ = false;
  if(!goog.isNull(frameState)) {
    if(frameState.animate) {
      this.requestRenderFrame()
    }
    Array.prototype.push.apply(this.postRenderFunctions_, frameState.postRenderFunctions)
  }
  this.dispatchEvent(new ol.MapEvent(ol.MapEventType.POSTRENDER, this, frameState));
  goog.global.setTimeout(this.handlePostRender_, 0)
};
ol.Map.prototype.setBackgroundColor = function(backgroundColor) {
  this.set(ol.MapProperty.BACKGROUND_COLOR, backgroundColor)
};
goog.exportProperty(ol.Map.prototype, "setBackgroundColor", ol.Map.prototype.setBackgroundColor);
ol.Map.prototype.setLayers = function(layers) {
  this.set(ol.MapProperty.LAYERS, layers)
};
goog.exportProperty(ol.Map.prototype, "setLayers", ol.Map.prototype.setLayers);
ol.Map.prototype.setSize = function(size) {
  this.set(ol.MapProperty.SIZE, size)
};
goog.exportProperty(ol.Map.prototype, "setSize", ol.Map.prototype.setSize);
ol.Map.prototype.setView = function(view) {
  this.set(ol.MapProperty.VIEW, view)
};
goog.exportProperty(ol.Map.prototype, "setView", ol.Map.prototype.setView);
ol.Map.prototype.unfreezeRendering = function() {
  goog.asserts.assert(this.freezeRenderingCount_ > 0);
  if(--this.freezeRenderingCount_ === 0 && this.dirty_) {
    this.animationDelay_.fire()
  }
};
ol.Map.prototype.withFrozenRendering = function(f, opt_obj) {
  this.freezeRendering();
  try {
    f.call(opt_obj)
  }finally {
    this.unfreezeRendering()
  }
};
ol.MapOptionsInternal;
ol.Map.createOptionsInternal = function(mapOptions) {
  var values = {};
  values[ol.MapProperty.LAYERS] = goog.isDef(mapOptions.layers) ? mapOptions.layers : new ol.Collection;
  values[ol.MapProperty.VIEW] = goog.isDef(mapOptions.view) ? mapOptions.view : new ol.View2D;
  var rendererConstructor = ol.renderer.Map;
  var rendererHints;
  if(goog.isDef(mapOptions.renderers)) {
    rendererHints = mapOptions.renderers
  }else {
    if(goog.isDef(mapOptions.renderer)) {
      rendererHints = [mapOptions.renderer]
    }else {
      rendererHints = ol.DEFAULT_RENDERER_HINTS
    }
  }
  var i, rendererHint;
  for(i = 0;i < rendererHints.length;++i) {
    rendererHint = rendererHints[i];
    if(rendererHint == ol.RendererHint.CANVAS) {
      if(ol.ENABLE_CANVAS && ol.renderer.canvas.SUPPORTED) {
        rendererConstructor = ol.renderer.canvas.Map;
        break
      }
    }else {
      if(rendererHint == ol.RendererHint.DOM) {
        if(ol.ENABLE_DOM && ol.renderer.dom.SUPPORTED) {
          rendererConstructor = ol.renderer.dom.Map;
          break
        }
      }else {
        if(rendererHint == ol.RendererHint.WEBGL) {
          if(ol.ENABLE_WEBGL && ol.renderer.webgl.SUPPORTED) {
            rendererConstructor = ol.renderer.webgl.Map;
            break
          }
        }
      }
    }
  }
  var controls = ol.Map.createControls_(mapOptions);
  var interactions;
  if(goog.isDef(mapOptions.interactions)) {
    interactions = mapOptions.interactions
  }else {
    interactions = ol.Map.createInteractions_(mapOptions)
  }
  var target = goog.dom.getElement(mapOptions.target);
  return{controls:controls, interactions:interactions, rendererConstructor:rendererConstructor, target:target, values:values}
};
ol.Map.createControls_ = function(mapOptions) {
  var controls = [];
  var attributionControl = goog.isDef(mapOptions.attributionControl) ? mapOptions.attributionControl : true;
  if(attributionControl) {
    controls.push(new ol.control.Attribution({}))
  }
  var scaleLineControl = goog.isDef(mapOptions.scaleLineControl) ? mapOptions.scaleLineControl : false;
  if(scaleLineControl) {
    var scaleLineUnits = goog.isDef(mapOptions.scaleLineUnits) ? mapOptions.scaleLineUnits : undefined;
    controls.push(new ol.control.ScaleLine({units:scaleLineUnits}))
  }
  var zoomControl = goog.isDef(mapOptions.zoomControl) ? mapOptions.zoomControl : true;
  if(zoomControl) {
    var zoomDelta = goog.isDef(mapOptions.zoomDelta) ? mapOptions.zoomDelta : 1;
    controls.push(new ol.control.Zoom({delta:zoomDelta}))
  }
  return controls
};
ol.Map.createInteractions_ = function(mapOptions) {
  var interactions = new ol.Collection;
  var rotate = goog.isDef(mapOptions.rotate) ? mapOptions.rotate : true;
  if(rotate) {
    interactions.push(new ol.interaction.DragRotate(ol.interaction.condition.altShiftKeysOnly))
  }
  var doubleClickZoom = goog.isDef(mapOptions.doubleClickZoom) ? mapOptions.doubleClickZoom : true;
  if(doubleClickZoom) {
    var zoomDelta = goog.isDef(mapOptions.zoomDelta) ? mapOptions.zoomDelta : 1;
    interactions.push(new ol.interaction.DblClickZoom(zoomDelta))
  }
  var touchPan = goog.isDef(mapOptions.touchPan) ? mapOptions.touchPan : true;
  if(touchPan) {
    interactions.push(new ol.interaction.TouchPan(new ol.Kinetic(-0.005, 0.05, 100)))
  }
  var touchRotate = goog.isDef(mapOptions.touchRotate) ? mapOptions.touchRotate : true;
  if(touchRotate) {
    interactions.push(new ol.interaction.TouchRotate)
  }
  var touchZoom = goog.isDef(mapOptions.touchZoom) ? mapOptions.touchZoom : true;
  if(touchZoom) {
    interactions.push(new ol.interaction.TouchZoom)
  }
  var dragPan = goog.isDef(mapOptions.dragPan) ? mapOptions.dragPan : true;
  if(dragPan) {
    interactions.push(new ol.interaction.DragPan(ol.interaction.condition.noModifierKeys, new ol.Kinetic(-0.005, 0.05, 100)))
  }
  var keyboard = goog.isDef(mapOptions.keyboard) ? mapOptions.keyboard : true;
  var keyboardPanOffset = goog.isDef(mapOptions.keyboardPanOffset) ? mapOptions.keyboardPanOffset : 80;
  if(keyboard) {
    interactions.push(new ol.interaction.KeyboardPan(keyboardPanOffset));
    interactions.push(new ol.interaction.KeyboardZoom)
  }
  var mouseWheelZoom = goog.isDef(mapOptions.mouseWheelZoom) ? mapOptions.mouseWheelZoom : true;
  if(mouseWheelZoom) {
    interactions.push(new ol.interaction.MouseWheelZoom)
  }
  var shiftDragZoom = goog.isDef(mapOptions.shiftDragZoom) ? mapOptions.shiftDragZoom : true;
  if(shiftDragZoom) {
    interactions.push(new ol.interaction.DragZoom(ol.interaction.condition.shiftKeyOnly))
  }
  return interactions
};
ol.RendererHints.createFromQueryData = function(opt_queryData) {
  var query = goog.global.location.search.substring(1), queryData = goog.isDef(opt_queryData) ? opt_queryData : new goog.Uri.QueryData(query);
  if(queryData.containsKey("renderers")) {
    return queryData.get("renderers").split(",")
  }else {
    if(queryData.containsKey("renderer")) {
      return[queryData.get("renderer")]
    }else {
      return ol.DEFAULT_RENDERER_HINTS
    }
  }
};
ol.projection.addCommonProjections();
goog.provide("ol.AnchoredElement");
goog.provide("ol.AnchoredElementPositioning");
goog.provide("ol.AnchoredElementProperty");
goog.require("goog.dom");
goog.require("goog.events");
goog.require("goog.style");
goog.require("ol.Coordinate");
goog.require("ol.Map");
goog.require("ol.MapEventType");
goog.require("ol.Object");
ol.AnchoredElementProperty = {ELEMENT:"element", MAP:"map", POSITION:"position", POSITIONING:"positioning"};
ol.AnchoredElementPositioning = {BOTTOM_LEFT:"bottom-left", BOTTOM_RIGHT:"bottom-right", TOP_LEFT:"top-left", TOP_RIGHT:"top-right"};
ol.AnchoredElement = function(anchoredElementOptions) {
  goog.base(this);
  this.element_ = goog.dom.createElement(goog.dom.TagName.DIV);
  this.element_.style.position = "absolute";
  this.rendered_ = {bottom_:"", left_:"", right_:"", top_:"", visible:true};
  goog.events.listen(this, ol.Object.getChangedEventType(ol.AnchoredElementProperty.ELEMENT), this.handleElementChanged, false, this);
  goog.events.listen(this, ol.Object.getChangedEventType(ol.AnchoredElementProperty.MAP), this.handleMapChanged, false, this);
  goog.events.listen(this, ol.Object.getChangedEventType(ol.AnchoredElementProperty.POSITION), this.handlePositionChanged, false, this);
  goog.events.listen(this, ol.Object.getChangedEventType(ol.AnchoredElementProperty.POSITIONING), this.handlePositioningChanged, false, this);
  if(goog.isDef(anchoredElementOptions.element)) {
    this.setElement(anchoredElementOptions.element)
  }
  if(goog.isDef(anchoredElementOptions.position)) {
    this.setPosition(anchoredElementOptions.position)
  }
  if(goog.isDef(anchoredElementOptions.positioning)) {
    this.setPositioning(anchoredElementOptions.positioning)
  }
  if(goog.isDef(anchoredElementOptions.map)) {
    this.setMap(anchoredElementOptions.map)
  }
};
goog.inherits(ol.AnchoredElement, ol.Object);
ol.AnchoredElement.prototype.getElement = function() {
  return this.get(ol.AnchoredElementProperty.ELEMENT)
};
goog.exportProperty(ol.AnchoredElement.prototype, "getElement", ol.AnchoredElement.prototype.getElement);
ol.AnchoredElement.prototype.getMap = function() {
  return this.get(ol.AnchoredElementProperty.MAP)
};
goog.exportProperty(ol.AnchoredElement.prototype, "getMap", ol.AnchoredElement.prototype.getMap);
ol.AnchoredElement.prototype.getPosition = function() {
  return this.get(ol.AnchoredElementProperty.POSITION)
};
goog.exportProperty(ol.AnchoredElement.prototype, "getPosition", ol.AnchoredElement.prototype.getPosition);
ol.AnchoredElement.prototype.getPositioning = function() {
  return this.get(ol.AnchoredElementProperty.POSITIONING)
};
goog.exportProperty(ol.AnchoredElement.prototype, "getPositioning", ol.AnchoredElement.prototype.getPositioning);
ol.AnchoredElement.prototype.handleElementChanged = function() {
  goog.dom.removeChildren(this.element_);
  var element = this.getElement();
  if(goog.isDefAndNotNull(element)) {
    goog.dom.append(this.element_, element)
  }
};
ol.AnchoredElement.prototype.handleMapChanged = function() {
  if(!goog.isNull(this.mapPostrenderListenerKey_)) {
    goog.dom.removeNode(this.element_);
    goog.events.unlistenByKey(this.mapPostrenderListenerKey_);
    this.mapPostrenderListenerKey_ = null
  }
  var map = this.getMap();
  if(goog.isDefAndNotNull(map)) {
    this.mapPostrenderListenerKey_ = goog.events.listen(map, ol.MapEventType.POSTRENDER, this.handleMapPostrender, false, this);
    this.updatePixelPosition_();
    goog.dom.append(map.getOverlayContainer(), this.element_)
  }
};
ol.AnchoredElement.prototype.handleMapPostrender = function() {
  this.updatePixelPosition_()
};
ol.AnchoredElement.prototype.handlePositionChanged = function() {
  this.updatePixelPosition_()
};
ol.AnchoredElement.prototype.handlePositioningChanged = function() {
  this.updatePixelPosition_()
};
ol.AnchoredElement.prototype.setElement = function(element) {
  this.set(ol.AnchoredElementProperty.ELEMENT, element)
};
goog.exportProperty(ol.AnchoredElement.prototype, "setElement", ol.AnchoredElement.prototype.setElement);
ol.AnchoredElement.prototype.setMap = function(map) {
  this.set(ol.AnchoredElementProperty.MAP, map)
};
goog.exportProperty(ol.AnchoredElement.prototype, "setMap", ol.AnchoredElement.prototype.setMap);
ol.AnchoredElement.prototype.setPosition = function(position) {
  this.set(ol.AnchoredElementProperty.POSITION, position)
};
goog.exportProperty(ol.AnchoredElement.prototype, "setPosition", ol.AnchoredElement.prototype.setPosition);
ol.AnchoredElement.prototype.setPositioning = function(positioning) {
  this.set(ol.AnchoredElementProperty.POSITIONING, positioning)
};
ol.AnchoredElement.prototype.updatePixelPosition_ = function() {
  var map = this.getMap();
  var position = this.getPosition();
  if(!goog.isDef(map) || !map.isDef() || !goog.isDef(position)) {
    if(this.rendered_.visible) {
      goog.style.showElement(this.element_, false);
      this.rendered_.visible = false
    }
    return
  }
  var pixel = map.getPixelFromCoordinate(position);
  var mapSize = map.getSize();
  goog.asserts.assert(goog.isDef(mapSize));
  var style = this.element_.style;
  var positioning = this.getPositioning();
  if(positioning == ol.AnchoredElementPositioning.BOTTOM_RIGHT || positioning == ol.AnchoredElementPositioning.TOP_RIGHT) {
    if(this.rendered_.left_ !== "") {
      this.rendered_.left_ = style.left = ""
    }
    var right = Math.round(mapSize.width - pixel.x) + "px";
    if(this.rendered_.right_ != right) {
      this.rendered_.right_ = style.right = right
    }
  }else {
    if(this.rendered_.right_ !== "") {
      this.rendered_.right_ = style.right = ""
    }
    var left = Math.round(pixel.x) + "px";
    if(this.rendered_.left_ != left) {
      this.rendered_.left_ = style.left = left
    }
  }
  if(positioning == ol.AnchoredElementPositioning.TOP_LEFT || positioning == ol.AnchoredElementPositioning.TOP_RIGHT) {
    if(this.rendered_.bottom_ !== "") {
      this.rendered_.bottom_ = style.bottom = ""
    }
    var top = Math.round(pixel.y) + "px";
    if(this.rendered_.top_ != top) {
      this.rendered_.top_ = style.top = top
    }
  }else {
    if(this.rendered_.top_ !== "") {
      this.rendered_.top_ = style.top = ""
    }
    var bottom = Math.round(mapSize.height - pixel.y) + "px";
    if(this.rendered_.bottom_ != bottom) {
      this.rendered_.bottom_ = style.bottom = bottom
    }
  }
  if(!this.rendered_.visible) {
    goog.style.showElement(this.element_, true);
    this.rendered_.visible = true
  }
};
goog.provide("ol.Ellipsoid");
goog.require("goog.math");
goog.require("ol.Coordinate");
ol.Ellipsoid = function(a, flattening) {
  this.a = a;
  this.flattening = flattening;
  this.b = this.a * (1 - this.flattening)
};
ol.Ellipsoid.prototype.vincenty = function(c1, c2, opt_minDeltaLambda, opt_maxIterations) {
  var minDeltaLambda = goog.isDef(opt_minDeltaLambda) ? opt_minDeltaLambda : 1E-12;
  var maxIterations = goog.isDef(opt_maxIterations) ? opt_maxIterations : 100;
  var f = this.flattening;
  var lat1 = goog.math.toRadians(c1.y);
  var lat2 = goog.math.toRadians(c2.y);
  var deltaLon = goog.math.toRadians(c2.x - c1.x);
  var U1 = Math.atan((1 - f) * Math.tan(lat1));
  var cosU1 = Math.cos(U1);
  var sinU1 = Math.sin(U1);
  var U2 = Math.atan((1 - f) * Math.tan(lat2));
  var cosU2 = Math.cos(U2);
  var sinU2 = Math.sin(U2);
  var lambda = deltaLon;
  var cosSquaredAlpha, sinAlpha;
  var cosLambda, deltaLambda = Infinity, sinLambda;
  var cos2SigmaM, cosSigma, sigma, sinSigma;
  var i;
  for(i = maxIterations;i > 0;--i) {
    cosLambda = Math.cos(lambda);
    sinLambda = Math.sin(lambda);
    var x = cosU2 * sinLambda;
    var y = cosU1 * sinU2 - sinU1 * cosU2 * cosLambda;
    sinSigma = Math.sqrt(x * x + y * y);
    if(sinSigma === 0) {
      return{distance:0, initialBearing:0, finalBearing:0}
    }
    cosSigma = sinU1 * sinU2 + cosU1 * cosU2 * cosLambda;
    sigma = Math.atan2(sinSigma, cosSigma);
    sinAlpha = cosU1 * cosU2 * sinLambda / sinSigma;
    cosSquaredAlpha = 1 - sinAlpha * sinAlpha;
    cos2SigmaM = cosSigma - 2 * sinU1 * sinU2 / cosSquaredAlpha;
    if(isNaN(cos2SigmaM)) {
      cos2SigmaM = 0
    }
    var C = f / 16 * cosSquaredAlpha * (4 + f * (4 - 3 * cosSquaredAlpha));
    var lambdaPrime = deltaLon + (1 - C) * f * sinAlpha * (sigma + C * sinSigma * (cos2SigmaM + C * cosSigma * (2 * cos2SigmaM * cos2SigmaM - 1)));
    deltaLambda = Math.abs(lambdaPrime - lambda);
    lambda = lambdaPrime;
    if(deltaLambda < minDeltaLambda) {
      break
    }
  }
  if(i === 0) {
    return{distance:NaN, finalBearing:NaN, initialBearing:NaN}
  }
  var aSquared = this.a * this.a;
  var bSquared = this.b * this.b;
  var uSquared = cosSquaredAlpha * (aSquared - bSquared) / bSquared;
  var A = 1 + uSquared / 16384 * (4096 + uSquared * (uSquared * (320 - 175 * uSquared) - 768));
  var B = uSquared / 1024 * (256 + uSquared * (uSquared * (74 - 47 * uSquared) - 128));
  var deltaSigma = B * sinSigma * (cos2SigmaM + B / 4 * (cosSigma * (2 * cos2SigmaM * cos2SigmaM - 1) - B / 6 * cos2SigmaM * (4 * sinSigma * sinSigma - 3) * (4 * cos2SigmaM * cos2SigmaM - 3)));
  cosLambda = Math.cos(lambda);
  sinLambda = Math.sin(lambda);
  var alpha1 = Math.atan2(cosU2 * sinLambda, cosU1 * sinU2 - sinU1 * cosU2 * cosLambda);
  var alpha2 = Math.atan2(cosU1 * sinLambda, cosU1 * sinU2 * cosLambda - sinU1 * cosU2);
  return{distance:this.b * A * (sigma - deltaSigma), initialBearing:goog.math.toDegrees(alpha1), finalBearing:goog.math.toDegrees(alpha2)}
};
ol.Ellipsoid.prototype.vincentyDistance = function(c1, c2, opt_minDeltaLambda, opt_maxIterations) {
  var vincenty = this.vincenty(c1, c2, opt_minDeltaLambda, opt_maxIterations);
  return vincenty.distance
};
ol.Ellipsoid.prototype.vincentyFinalBearing = function(c1, c2, opt_minDeltaLambda, opt_maxIterations) {
  var vincenty = this.vincenty(c1, c2, opt_minDeltaLambda, opt_maxIterations);
  return vincenty.finalBearing
};
ol.Ellipsoid.prototype.vincentyInitialBearing = function(c1, c2, opt_minDeltaLambda, opt_maxIterations) {
  var vincenty = this.vincenty(c1, c2, opt_minDeltaLambda, opt_maxIterations);
  return vincenty.initialBearing
};
goog.provide("ol.Geolocation");
goog.provide("ol.GeolocationProperty");
goog.require("goog.functions");
goog.require("goog.math");
goog.require("ol.Coordinate");
goog.require("ol.Object");
goog.require("ol.Projection");
goog.require("ol.projection");
ol.GeolocationProperty = {ACCURACY:"accuracy", ALTITUDE:"altitude", ALTITUDE_ACCURACY:"altitudeAccuracy", HEADING:"heading", POSITION:"position", PROJECTION:"projection", SPEED:"speed"};
ol.Geolocation = function(opt_positionOptions) {
  goog.base(this);
  this.position_ = null;
  if(ol.Geolocation.SUPPORTED) {
    goog.events.listen(this, ol.Object.getChangedEventType(ol.GeolocationProperty.PROJECTION), this.handleProjectionChanged_, false, this);
    this.watchId_ = navigator.geolocation.watchPosition(goog.bind(this.positionChange_, this), goog.bind(this.positionError_, this), opt_positionOptions)
  }
};
goog.inherits(ol.Geolocation, ol.Object);
ol.Geolocation.prototype.disposeInternal = function() {
  navigator.geolocation.clearWatch(this.watchId_);
  goog.base(this, "disposeInternal")
};
ol.Geolocation.prototype.handleProjectionChanged_ = function() {
  var projection = this.getProjection();
  if(goog.isDefAndNotNull(projection)) {
    this.transformFn_ = ol.projection.getTransform(ol.projection.getFromCode("EPSG:4326"), projection);
    if(!goog.isNull(this.position_)) {
      var vertex = [this.position_.x, this.position_.y];
      vertex = this.transformFn_(vertex, vertex, 2);
      this.set(ol.GeolocationProperty.POSITION, new ol.Coordinate(vertex[0], vertex[1]))
    }
  }
};
ol.Geolocation.SUPPORTED = "geolocation" in navigator;
ol.Geolocation.prototype.positionChange_ = function(position) {
  var coords = position.coords;
  this.set(ol.GeolocationProperty.ACCURACY, coords.accuracy);
  this.set(ol.GeolocationProperty.ALTITUDE, goog.isNull(coords.altitude) ? undefined : coords.altitude);
  this.set(ol.GeolocationProperty.ALTITUDE_ACCURACY, goog.isNull(coords.altitudeAccuracy) ? undefined : coords.altitudeAccuracy);
  this.set(ol.GeolocationProperty.HEADING, goog.isNull(coords.heading) ? undefined : goog.math.toRadians(coords.heading));
  this.position_ = new ol.Coordinate(coords.longitude, coords.latitude);
  var vertex = [coords.longitude, coords.latitude];
  vertex = this.transformFn_(vertex, vertex, 2);
  this.set(ol.GeolocationProperty.POSITION, new ol.Coordinate(vertex[0], vertex[1]));
  this.set(ol.GeolocationProperty.SPEED, goog.isNull(coords.speed) ? undefined : coords.speed)
};
ol.Geolocation.prototype.positionError_ = function(error) {
};
ol.Geolocation.prototype.getAccuracy = function() {
  return this.get(ol.GeolocationProperty.ACCURACY)
};
goog.exportProperty(ol.Geolocation.prototype, "getAccuracy", ol.Geolocation.prototype.getAccuracy);
ol.Geolocation.prototype.getAltitude = function() {
  return this.get(ol.GeolocationProperty.ALTITUDE)
};
goog.exportProperty(ol.Geolocation.prototype, "getAltitude", ol.Geolocation.prototype.getAltitude);
ol.Geolocation.prototype.getAltitudeAccuracy = function() {
  return this.get(ol.GeolocationProperty.ALTITUDE_ACCURACY)
};
goog.exportProperty(ol.Geolocation.prototype, "getAltitudeAccuracy", ol.Geolocation.prototype.getAltitudeAccuracy);
ol.Geolocation.prototype.getHeading = function() {
  return this.get(ol.GeolocationProperty.HEADING)
};
goog.exportProperty(ol.Geolocation.prototype, "getHeading", ol.Geolocation.prototype.getHeading);
ol.Geolocation.prototype.getPosition = function() {
  return this.get(ol.GeolocationProperty.POSITION)
};
goog.exportProperty(ol.Geolocation.prototype, "getPosition", ol.Geolocation.prototype.getPosition);
ol.Geolocation.prototype.getProjection = function() {
  return this.get(ol.GeolocationProperty.PROJECTION)
};
goog.exportProperty(ol.Geolocation.prototype, "getProjection", ol.Geolocation.prototype.getProjection);
ol.Geolocation.prototype.getSpeed = function() {
  return this.get(ol.GeolocationProperty.SPEED)
};
goog.exportProperty(ol.Geolocation.prototype, "getSpeed", ol.Geolocation.prototype.getSpeed);
ol.Geolocation.prototype.setProjection = function(projection) {
  this.set(ol.GeolocationProperty.PROJECTION, projection)
};
goog.exportProperty(ol.Geolocation.prototype, "setProjection", ol.Geolocation.prototype.setProjection);
ol.Geolocation.prototype.transformFn_ = goog.functions.identity;
goog.provide("ol.ImageTile");
goog.require("goog.array");
goog.require("goog.events");
goog.require("goog.events.EventType");
goog.require("ol.Tile");
goog.require("ol.TileCoord");
goog.require("ol.TileState");
ol.ImageTile = function(tileCoord, src, crossOrigin) {
  goog.base(this, tileCoord);
  this.src_ = src;
  this.image_ = new Image;
  if(!goog.isNull(crossOrigin)) {
    this.image_.crossOrigin = crossOrigin
  }
  this.imageByContext_ = {};
  this.imageListenerKeys_ = null
};
goog.inherits(ol.ImageTile, ol.Tile);
ol.ImageTile.prototype.getImage = function(opt_context) {
  if(goog.isDef(opt_context)) {
    var image;
    var key = goog.getUid(opt_context);
    if(key in this.imageByContext_) {
      return this.imageByContext_[key]
    }else {
      if(goog.object.isEmpty(this.imageByContext_)) {
        image = this.image_
      }else {
        image = this.image_.cloneNode(false)
      }
    }
    this.imageByContext_[key] = image;
    return image
  }else {
    return this.image_
  }
};
ol.ImageTile.prototype.getKey = function() {
  return this.src_
};
ol.ImageTile.prototype.handleImageError_ = function() {
  this.state = ol.TileState.ERROR;
  this.unlistenImage_();
  this.dispatchChangeEvent()
};
ol.ImageTile.prototype.handleImageLoad_ = function() {
  this.state = ol.TileState.LOADED;
  this.unlistenImage_();
  this.dispatchChangeEvent()
};
ol.ImageTile.prototype.load = function() {
  if(this.state == ol.TileState.IDLE) {
    this.state = ol.TileState.LOADING;
    goog.asserts.assert(goog.isNull(this.imageListenerKeys_));
    this.imageListenerKeys_ = [goog.events.listenOnce(this.image_, goog.events.EventType.ERROR, this.handleImageError_, false, this), goog.events.listenOnce(this.image_, goog.events.EventType.LOAD, this.handleImageLoad_, false, this)];
    this.image_.src = this.src_
  }
};
ol.ImageTile.prototype.unlistenImage_ = function() {
  goog.asserts.assert(!goog.isNull(this.imageListenerKeys_));
  goog.array.forEach(this.imageListenerKeys_, goog.events.unlistenByKey);
  this.imageListenerKeys_ = null
};
goog.provide("ol.TileCache");
goog.require("ol.Tile");
goog.require("ol.TileRange");
goog.require("ol.structs.LRUCache");
ol.DEFAULT_TILE_CACHE_HIGH_WATER_MARK = 512;
ol.TileCache = function(opt_highWaterMark) {
  goog.base(this);
  this.highWaterMark_ = goog.isDef(opt_highWaterMark) ? opt_highWaterMark : ol.DEFAULT_TILE_CACHE_HIGH_WATER_MARK
};
goog.inherits(ol.TileCache, ol.structs.LRUCache);
ol.TileCache.prototype.canExpireCache = function() {
  return this.getCount() > this.highWaterMark_
};
ol.TileCache.prototype.expireCache = function(usedTiles) {
  var tile, zKey;
  while(this.canExpireCache()) {
    tile = this.peekLast();
    zKey = tile.tileCoord.z.toString();
    if(zKey in usedTiles && usedTiles[zKey].contains(tile.tileCoord)) {
      break
    }else {
      this.pop()
    }
  }
};
goog.provide("ol.TileUrlFunction");
goog.provide("ol.TileUrlFunctionType");
goog.require("goog.array");
goog.require("goog.math");
goog.require("ol.TileCoord");
goog.require("ol.source.wms");
goog.require("ol.tilegrid.TileGrid");
ol.TileUrlFunctionType;
ol.TileUrlFunction.createFromTemplate = function(template) {
  var match = /\{(\d)-(\d)\}/.exec(template) || /\{([a-z])-([a-z])\}/.exec(template);
  if(match) {
    var templates = [];
    var startCharCode = match[1].charCodeAt(0);
    var stopCharCode = match[2].charCodeAt(0);
    var charCode;
    for(charCode = startCharCode;charCode <= stopCharCode;++charCode) {
      templates.push(template.replace(match[0], String.fromCharCode(charCode)))
    }
    return ol.TileUrlFunction.createFromTemplates(templates)
  }else {
    return function(tileCoord) {
      if(goog.isNull(tileCoord)) {
        return undefined
      }else {
        return template.replace("{z}", tileCoord.z).replace("{x}", tileCoord.x).replace("{y}", tileCoord.y)
      }
    }
  }
};
ol.TileUrlFunction.createFromTemplates = function(templates) {
  return ol.TileUrlFunction.createFromTileUrlFunctions(goog.array.map(templates, ol.TileUrlFunction.createFromTemplate))
};
ol.TileUrlFunction.createFromTileUrlFunctions = function(tileUrlFunctions) {
  return function(tileCoord, tileGrid, projection) {
    if(goog.isNull(tileCoord)) {
      return undefined
    }else {
      var index = goog.math.modulo(tileCoord.hash(), tileUrlFunctions.length);
      return tileUrlFunctions[index](tileCoord, tileGrid, projection)
    }
  }
};
ol.TileUrlFunction.createWMSParams = function(baseUrl, params) {
  return function(tileCoord, tileGrid, projection) {
    if(goog.isNull(tileCoord)) {
      return undefined
    }else {
      var size = tileGrid.getTileSize(tileCoord.z);
      var extent = tileGrid.getTileCoordExtent(tileCoord);
      return ol.source.wms.getUrl(baseUrl, params, extent, size, projection)
    }
  }
};
ol.TileUrlFunction.nullTileUrlFunction = function(tileCoord) {
  return undefined
};
ol.TileUrlFunction.withTileCoordTransform = function(transformFn, tileUrlFunction) {
  return function(tileCoord, tileGrid, projection) {
    if(goog.isNull(tileCoord)) {
      return undefined
    }else {
      return tileUrlFunction(transformFn(tileCoord, tileGrid, projection), tileGrid, projection)
    }
  }
};
goog.provide("ol.control.MousePosition");
goog.require("goog.array");
goog.require("goog.dom");
goog.require("goog.events");
goog.require("goog.events.EventType");
goog.require("goog.style");
goog.require("ol.Coordinate");
goog.require("ol.CoordinateFormatType");
goog.require("ol.MapEvent");
goog.require("ol.MapEventType");
goog.require("ol.Pixel");
goog.require("ol.Projection");
goog.require("ol.TransformFunction");
goog.require("ol.control.Control");
goog.require("ol.projection");
ol.control.MousePosition = function(mousePositionOptions) {
  var element = goog.dom.createDom(goog.dom.TagName.DIV, {"class":"ol-mouse-position"});
  goog.base(this, {element:element, map:mousePositionOptions.map, target:mousePositionOptions.target});
  this.projection_ = mousePositionOptions.projection;
  this.coordinateFormat_ = mousePositionOptions.coordinateFormat;
  this.undefinedHTML_ = goog.isDef(mousePositionOptions.undefinedHTML) ? mousePositionOptions.undefinedHTML : "";
  this.renderedHTML_ = element.innerHTML;
  this.mapProjection_ = null;
  this.transform_ = ol.projection.identityTransform;
  this.renderedProjection_ = null;
  this.lastMouseMovePixel_ = null;
  this.listenerKeys_ = null
};
goog.inherits(ol.control.MousePosition, ol.control.Control);
ol.control.MousePosition.prototype.handleMapPostrender = function(mapEvent) {
  var frameState = mapEvent.frameState;
  if(goog.isNull(frameState)) {
    this.mapProjection_ = null
  }else {
    this.mapProjection_ = frameState.view2DState.projection
  }
  this.updateHTML_(this.lastMouseMovePixel_)
};
ol.control.MousePosition.prototype.handleMouseMove = function(browserEvent) {
  var map = this.getMap();
  var eventPosition = goog.style.getRelativePosition(browserEvent, map.getViewport());
  var pixel = new ol.Pixel(eventPosition.x, eventPosition.y);
  this.updateHTML_(pixel);
  this.lastMouseMovePixel_ = pixel
};
ol.control.MousePosition.prototype.handleMouseOut = function(browserEvent) {
  this.updateHTML_(null);
  this.lastMouseMovePixel_ = null
};
ol.control.MousePosition.prototype.setMap = function(map) {
  if(!goog.isNull(this.listenerKeys_)) {
    goog.array.forEach(this.listenerKeys_, goog.events.unlistenByKey);
    this.listenerKeys_ = null
  }
  goog.base(this, "setMap", map);
  if(!goog.isNull(map)) {
    var viewport = map.getViewport();
    this.listenerKeys_ = [goog.events.listen(viewport, goog.events.EventType.MOUSEMOVE, this.handleMouseMove, false, this), goog.events.listen(viewport, goog.events.EventType.MOUSEOUT, this.handleMouseOut, false, this), goog.events.listen(map, ol.MapEventType.POSTRENDER, this.handleMapPostrender, false, this)]
  }
};
ol.control.MousePosition.prototype.updateHTML_ = function(pixel) {
  var html = this.undefinedHTML_;
  if(!goog.isNull(pixel)) {
    if(this.renderedProjection_ != this.mapProjection_) {
      if(goog.isDef(this.projection_)) {
        this.transform_ = ol.projection.getTransform(this.mapProjection_, this.projection_)
      }else {
        this.transform_ = ol.projection.identityTransform
      }
      this.renderedProjection_ = this.mapProjection_
    }
    var map = this.getMap();
    var coordinate = map.getCoordinateFromPixel(pixel);
    if(!goog.isNull(coordinate)) {
      var vertex = [coordinate.x, coordinate.y];
      vertex = this.transform_(vertex, vertex);
      coordinate = new ol.Coordinate(vertex[0], vertex[1]);
      if(goog.isDef(this.coordinateFormat_)) {
        html = this.coordinateFormat_(coordinate)
      }else {
        html = coordinate.toString()
      }
    }
  }
  if(!goog.isDef(this.renderedHTML_) || html != this.renderedHTML_) {
    this.element.innerHTML = html;
    this.renderedHTML_ = html
  }
};
goog.provide("ol.ellipsoid.WGS84");
goog.require("ol.Ellipsoid");
ol.ellipsoid.WGS84 = new ol.Ellipsoid(6378137, 1 / 298.257223563);
goog.provide("ol.interaction.DragRotateAndZoom");
goog.require("goog.math.Vec2");
goog.require("ol.View2D");
goog.require("ol.interaction.ConditionType");
goog.require("ol.interaction.Drag");
ol.interaction.DragRotateAndZoom = function(condition) {
  goog.base(this);
  this.condition_ = condition;
  this.lastAngle_;
  this.lastMagnitude_
};
goog.inherits(ol.interaction.DragRotateAndZoom, ol.interaction.Drag);
ol.interaction.DragRotateAndZoom.prototype.handleDrag = function(mapBrowserEvent) {
  var browserEvent = mapBrowserEvent.browserEvent;
  var map = mapBrowserEvent.map;
  var size = map.getSize();
  var delta = new goog.math.Vec2(browserEvent.offsetX - size.width / 2, size.height / 2 - browserEvent.offsetY);
  var theta = Math.atan2(delta.y, delta.x);
  var magnitude = delta.magnitude();
  var view = map.getView();
  goog.asserts.assert(view instanceof ol.View2D);
  map.requestRenderFrame();
  if(goog.isDef(this.lastAngle_)) {
    var angleDelta = theta - this.lastAngle_;
    view.rotate(map, view.getRotation() - angleDelta)
  }
  this.lastAngle_ = theta;
  if(goog.isDef(this.lastMagnitude_)) {
    var resolution = this.lastMagnitude_ * (view.getResolution() / magnitude);
    view.zoom(map, resolution)
  }
  this.lastMagnitude_ = magnitude
};
ol.interaction.DragRotateAndZoom.prototype.handleDragStart = function(mapBrowserEvent) {
  var browserEvent = mapBrowserEvent.browserEvent;
  if(this.condition_(browserEvent)) {
    this.lastAngle_ = undefined;
    this.lastMagnitude_ = undefined;
    return true
  }else {
    return false
  }
};
goog.provide("ol.interaction.Keyboard");
goog.require("ol.interaction.Interaction");
ol.interaction.Keyboard = function() {
  goog.base(this);
  this.charCodeCallbacks_ = {}
};
goog.inherits(ol.interaction.Keyboard, ol.interaction.Interaction);
ol.interaction.Keyboard.prototype.addCallback = function(s, callback) {
  var i;
  for(i = 0;i < s.length;++i) {
    this.charCodeCallbacks_[s.charCodeAt(i)] = callback
  }
};
ol.interaction.Keyboard.prototype.handleMapBrowserEvent = function(mapBrowserEvent) {
  if(mapBrowserEvent.type == goog.events.KeyHandler.EventType.KEY) {
    var keyEvent = mapBrowserEvent.browserEvent;
    var callback = this.charCodeCallbacks_[keyEvent.charCode];
    if(callback) {
      callback();
      mapBrowserEvent.preventDefault()
    }
  }
};
goog.provide("ol.parser.XML");
ol.parser.XML = function() {
  this.regExes = {trimSpace:/^\s*|\s*$/g, removeSpace:/\s*/g, splitSpace:/\s+/, trimComma:/\s*,\s*/g}
};
ol.parser.XML.prototype.readNode = function(node, obj) {
  if(!obj) {
    obj = {}
  }
  var group = this.readers[node.namespaceURI] || this.readers[this.defaultNamespaceURI];
  if(group) {
    var local = node.localName || node.nodeName.split(":").pop();
    var reader = group[local] || group["*"];
    if(reader) {
      reader.apply(this, [node, obj])
    }
  }
  return obj
};
ol.parser.XML.prototype.readChildNodes = function(node, obj) {
  if(!obj) {
    obj = {}
  }
  var children = node.childNodes;
  var child;
  for(var i = 0, len = children.length;i < len;++i) {
    child = children[i];
    if(child.nodeType == 1) {
      this.readNode(child, obj)
    }
  }
  return obj
};
ol.parser.XML.prototype.getChildValue = function(node, def) {
  var value = def || "";
  if(node) {
    for(var child = node.firstChild;child;child = child.nextSibling) {
      switch(child.nodeType) {
        case 3:
        ;
        case 4:
          value += child.nodeValue;
          break;
        default:
          break
      }
    }
  }
  return value
};
ol.parser.XML.prototype.getAttributeNodeNS = function(node, uri, name) {
  var attributeNode = null;
  if(node.getAttributeNodeNS) {
    attributeNode = node.getAttributeNodeNS(uri, name)
  }else {
    var attributes = node.attributes;
    var potentialNode, fullName;
    for(var i = 0, len = attributes.length;i < len;++i) {
      potentialNode = attributes[i];
      if(potentialNode.namespaceURI == uri) {
        fullName = potentialNode.prefix ? potentialNode.prefix + ":" + name : name;
        if(fullName == potentialNode.nodeName) {
          attributeNode = potentialNode;
          break
        }
      }
    }
  }
  return attributeNode
};
ol.parser.XML.prototype.getAttributeNS = function(node, uri, name) {
  var attributeValue = "";
  if(node.getAttributeNS) {
    attributeValue = node.getAttributeNS(uri, name) || ""
  }else {
    var attributeNode = this.getAttributeNodeNS(node, uri, name);
    if(attributeNode) {
      attributeValue = attributeNode.nodeValue
    }
  }
  return attributeValue
};
goog.provide("goog.dom.xml");
goog.require("goog.dom");
goog.require("goog.dom.NodeType");
goog.dom.xml.MAX_XML_SIZE_KB = 2 * 1024;
goog.dom.xml.MAX_ELEMENT_DEPTH = 256;
goog.dom.xml.createDocument = function(opt_rootTagName, opt_namespaceUri) {
  if(opt_namespaceUri && !opt_rootTagName) {
    throw Error("Can't create document with namespace and no root tag");
  }
  if(document.implementation && document.implementation.createDocument) {
    return document.implementation.createDocument(opt_namespaceUri || "", opt_rootTagName || "", null)
  }else {
    if(typeof ActiveXObject != "undefined") {
      var doc = goog.dom.xml.createMsXmlDocument_();
      if(doc) {
        if(opt_rootTagName) {
          doc.appendChild(doc.createNode(goog.dom.NodeType.ELEMENT, opt_rootTagName, opt_namespaceUri || ""))
        }
        return doc
      }
    }
  }
  throw Error("Your browser does not support creating new documents");
};
goog.dom.xml.loadXml = function(xml) {
  if(typeof DOMParser != "undefined") {
    return(new DOMParser).parseFromString(xml, "application/xml")
  }else {
    if(typeof ActiveXObject != "undefined") {
      var doc = goog.dom.xml.createMsXmlDocument_();
      doc.loadXML(xml);
      return doc
    }
  }
  throw Error("Your browser does not support loading xml documents");
};
goog.dom.xml.serialize = function(xml) {
  if(typeof XMLSerializer != "undefined") {
    return(new XMLSerializer).serializeToString(xml)
  }
  var text = xml.xml;
  if(text) {
    return text
  }
  throw Error("Your browser does not support serializing XML documents");
};
goog.dom.xml.selectSingleNode = function(node, path) {
  if(typeof node.selectSingleNode != "undefined") {
    var doc = goog.dom.getOwnerDocument(node);
    if(typeof doc.setProperty != "undefined") {
      doc.setProperty("SelectionLanguage", "XPath")
    }
    return node.selectSingleNode(path)
  }else {
    if(document.implementation.hasFeature("XPath", "3.0")) {
      var doc = goog.dom.getOwnerDocument(node);
      var resolver = doc.createNSResolver(doc.documentElement);
      var result = doc.evaluate(path, node, resolver, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
      return result.singleNodeValue
    }
  }
  return null
};
goog.dom.xml.selectNodes = function(node, path) {
  if(typeof node.selectNodes != "undefined") {
    var doc = goog.dom.getOwnerDocument(node);
    if(typeof doc.setProperty != "undefined") {
      doc.setProperty("SelectionLanguage", "XPath")
    }
    return node.selectNodes(path)
  }else {
    if(document.implementation.hasFeature("XPath", "3.0")) {
      var doc = goog.dom.getOwnerDocument(node);
      var resolver = doc.createNSResolver(doc.documentElement);
      var nodes = doc.evaluate(path, node, resolver, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
      var results = [];
      var count = nodes.snapshotLength;
      for(var i = 0;i < count;i++) {
        results.push(nodes.snapshotItem(i))
      }
      return results
    }else {
      return[]
    }
  }
};
goog.dom.xml.setAttributes = function(element, attributes) {
  for(var key in attributes) {
    if(attributes.hasOwnProperty(key)) {
      element.setAttribute(key, attributes[key])
    }
  }
};
goog.dom.xml.createMsXmlDocument_ = function() {
  var doc = new ActiveXObject("MSXML2.DOMDocument");
  if(doc) {
    doc.resolveExternals = false;
    doc.validateOnParse = false;
    try {
      doc.setProperty("ProhibitDTD", true);
      doc.setProperty("MaxXMLSize", goog.dom.xml.MAX_XML_SIZE_KB);
      doc.setProperty("MaxElementDepth", goog.dom.xml.MAX_ELEMENT_DEPTH)
    }catch(e) {
    }
  }
  return doc
};
goog.provide("ol.parser.ogc.ExceptionReport");
goog.require("goog.dom.xml");
goog.require("ol.parser.XML");
ol.parser.ogc.ExceptionReport = function() {
  var exceptionReader = function(node, exceptionReport) {
    var exception = {code:node.getAttribute("exceptionCode"), locator:node.getAttribute("locator"), texts:[]};
    exceptionReport.exceptions.push(exception);
    this.readChildNodes(node, exception)
  };
  var exceptionTextReader = function(node, exception) {
    var text = this.getChildValue(node);
    exception.texts.push(text)
  };
  this.readers = {"http://www.opengis.net/ogc":{"ServiceExceptionReport":function(node, obj) {
    obj["exceptionReport"] = {};
    obj["exceptionReport"]["exceptions"] = [];
    this.readChildNodes(node, obj["exceptionReport"])
  }, "ServiceException":function(node, exceptionReport) {
    var exception = {};
    exception["code"] = node.getAttribute("code");
    exception["locator"] = node.getAttribute("locator");
    exception["text"] = this.getChildValue(node);
    exceptionReport["exceptions"].push(exception)
  }}, "http://www.opengis.net/ows":{"ExceptionReport":function(node, obj) {
    obj.success = false;
    obj.exceptionReport = {version:node.getAttribute("version"), language:node.getAttribute("language"), exceptions:[]};
    this.readChildNodes(node, obj.exceptionReport)
  }, "Exception":function(node, exceptionReport) {
    exceptionReader.apply(this, arguments)
  }, "ExceptionText":function(node, exception) {
    exceptionTextReader.apply(this, arguments)
  }}, "http://www.opengis.net/ows/1.1":{"ExceptionReport":function(node, obj) {
    obj.exceptionReport = {version:node.getAttribute("version"), language:node.getAttribute("xml:lang"), exceptions:[]};
    this.readChildNodes(node, obj.exceptionReport)
  }, "Exception":function(node, exceptionReport) {
    exceptionReader.apply(this, arguments)
  }, "ExceptionText":function(node, exception) {
    exceptionTextReader.apply(this, arguments)
  }}};
  goog.base(this)
};
goog.inherits(ol.parser.ogc.ExceptionReport, ol.parser.XML);
ol.parser.ogc.ExceptionReport.prototype.read = function(data) {
  if(typeof data == "string") {
    data = goog.dom.xml.loadXml(data)
  }
  var exceptionInfo = {};
  exceptionInfo["exceptionReport"] = null;
  if(data) {
    this.readChildNodes(data, exceptionInfo)
  }
  return exceptionInfo
};
goog.provide("ol.parser.ogc.OWSCommon_v1");
goog.require("ol.Extent");
goog.require("ol.parser.XML");
ol.parser.ogc.OWSCommon_v1 = function() {
  this.readers = {"http://www.opengis.net/ows":{"ServiceIdentification":function(node, obj) {
    obj["serviceIdentification"] = {};
    this.readChildNodes(node, obj["serviceIdentification"])
  }, "Title":function(node, obj) {
    obj["title"] = this.getChildValue(node)
  }, "Abstract":function(node, serviceIdentification) {
    serviceIdentification["abstract"] = this.getChildValue(node)
  }, "Keywords":function(node, serviceIdentification) {
    serviceIdentification["keywords"] = {};
    this.readChildNodes(node, serviceIdentification["keywords"])
  }, "Keyword":function(node, keywords) {
    keywords[this.getChildValue(node)] = true
  }, "ServiceType":function(node, serviceIdentification) {
    serviceIdentification["serviceType"] = {"codeSpace":node.getAttribute("codeSpace"), "value":this.getChildValue(node)}
  }, "ServiceTypeVersion":function(node, serviceIdentification) {
    serviceIdentification["serviceTypeVersion"] = this.getChildValue(node)
  }, "Fees":function(node, serviceIdentification) {
    serviceIdentification["fees"] = this.getChildValue(node)
  }, "AccessConstraints":function(node, serviceIdentification) {
    serviceIdentification["accessConstraints"] = this.getChildValue(node)
  }, "ServiceProvider":function(node, obj) {
    obj["serviceProvider"] = {};
    this.readChildNodes(node, obj["serviceProvider"])
  }, "ProviderName":function(node, serviceProvider) {
    serviceProvider["providerName"] = this.getChildValue(node)
  }, "ProviderSite":function(node, serviceProvider) {
    serviceProvider["providerSite"] = this.getAttributeNS(node, "http://www.w3.org/1999/xlink", "href")
  }, "ServiceContact":function(node, serviceProvider) {
    serviceProvider["serviceContact"] = {};
    this.readChildNodes(node, serviceProvider["serviceContact"])
  }, "IndividualName":function(node, serviceContact) {
    serviceContact["individualName"] = this.getChildValue(node)
  }, "PositionName":function(node, serviceContact) {
    serviceContact["positionName"] = this.getChildValue(node)
  }, "ContactInfo":function(node, serviceContact) {
    serviceContact["contactInfo"] = {};
    this.readChildNodes(node, serviceContact["contactInfo"])
  }, "Phone":function(node, contactInfo) {
    contactInfo["phone"] = {};
    this.readChildNodes(node, contactInfo["phone"])
  }, "Voice":function(node, phone) {
    phone["voice"] = this.getChildValue(node)
  }, "Address":function(node, contactInfo) {
    contactInfo["address"] = {};
    this.readChildNodes(node, contactInfo["address"])
  }, "DeliveryPoint":function(node, address) {
    address["deliveryPoint"] = this.getChildValue(node)
  }, "City":function(node, address) {
    address["city"] = this.getChildValue(node)
  }, "AdministrativeArea":function(node, address) {
    address["administrativeArea"] = this.getChildValue(node)
  }, "PostalCode":function(node, address) {
    address["postalCode"] = this.getChildValue(node)
  }, "Country":function(node, address) {
    address["country"] = this.getChildValue(node)
  }, "ElectronicMailAddress":function(node, address) {
    address["electronicMailAddress"] = this.getChildValue(node)
  }, "Role":function(node, serviceContact) {
    serviceContact["role"] = this.getChildValue(node)
  }, "OperationsMetadata":function(node, obj) {
    obj["operationsMetadata"] = {};
    this.readChildNodes(node, obj["operationsMetadata"])
  }, "Operation":function(node, operationsMetadata) {
    var name = node.getAttribute("name");
    operationsMetadata[name] = {};
    this.readChildNodes(node, operationsMetadata[name])
  }, "DCP":function(node, operation) {
    operation["dcp"] = {};
    this.readChildNodes(node, operation["dcp"])
  }, "HTTP":function(node, dcp) {
    dcp["http"] = {};
    this.readChildNodes(node, dcp["http"])
  }, "Get":function(node, http) {
    if(!http["get"]) {
      http["get"] = []
    }
    var obj = {"url":this.getAttributeNS(node, "http://www.w3.org/1999/xlink", "href")};
    this.readChildNodes(node, obj);
    http["get"].push(obj)
  }, "Post":function(node, http) {
    if(!http["post"]) {
      http["post"] = []
    }
    var obj = {"url":this.getAttributeNS(node, "http://www.w3.org/1999/xlink", "href")};
    this.readChildNodes(node, obj);
    http["post"].push(obj)
  }, "Parameter":function(node, operation) {
    if(!operation["parameters"]) {
      operation["parameters"] = {}
    }
    var name = node.getAttribute("name");
    operation["parameters"][name] = {};
    this.readChildNodes(node, operation["parameters"][name])
  }, "Constraint":function(node, obj) {
    if(!obj["constraints"]) {
      obj["constraints"] = {}
    }
    var name = node.getAttribute("name");
    obj["constraints"][name] = {};
    this.readChildNodes(node, obj["constraints"][name])
  }, "Value":function(node, allowedValues) {
    allowedValues[this.getChildValue(node)] = true
  }, "OutputFormat":function(node, obj) {
    obj["formats"].push({"value":this.getChildValue(node)});
    this.readChildNodes(node, obj)
  }, "WGS84BoundingBox":function(node, obj) {
    var boundingBox = {};
    boundingBox["crs"] = node.getAttribute("crs");
    if(obj["BoundingBox"]) {
      obj["BoundingBox"].push(boundingBox)
    }else {
      obj["projection"] = boundingBox["crs"];
      boundingBox = obj
    }
    this.readChildNodes(node, boundingBox)
  }, "BoundingBox":function(node, obj) {
    var readers = this.readers["http://www.opengis.net/ows"];
    readers["WGS84BoundingBox"].apply(this, [node, obj])
  }, "LowerCorner":function(node, obj) {
    var str = this.getChildValue(node).replace(this.regExes.trimSpace, "");
    str = str.replace(this.regExes.trimComma, ",");
    var pointList = str.split(this.regExes.splitSpace);
    obj["left"] = pointList[0];
    obj["bottom"] = pointList[1]
  }, "UpperCorner":function(node, obj) {
    var str = this.getChildValue(node).replace(this.regExes.trimSpace, "");
    str = str.replace(this.regExes.trimComma, ",");
    var pointList = str.split(this.regExes.splitSpace);
    obj["right"] = pointList[0];
    obj["top"] = pointList[1];
    obj["bounds"] = new ol.Extent(parseFloat(obj["left"]), parseFloat(obj["bottom"]), parseFloat(obj["right"]), parseFloat(obj["top"]));
    delete obj["left"];
    delete obj["bottom"];
    delete obj["right"];
    delete obj["top"]
  }, "Language":function(node, obj) {
    obj["language"] = this.getChildValue(node)
  }}};
  goog.base(this)
};
goog.inherits(ol.parser.ogc.OWSCommon_v1, ol.parser.XML);
goog.provide("ol.parser.ogc.OWSCommon_v1_1_0");
goog.require("goog.object");
goog.require("ol.parser.ogc.OWSCommon_v1");
ol.parser.ogc.OWSCommon_v1_1_0 = function() {
  goog.base(this);
  this.readers["http://www.opengis.net/ows/1.1"] = this.readers["http://www.opengis.net/ows"];
  goog.object.extend(this.readers["http://www.opengis.net/ows/1.1"], {"AllowedValues":function(node, parameter) {
    parameter["allowedValues"] = {};
    this.readChildNodes(node, parameter["allowedValues"])
  }, "AnyValue":function(node, parameter) {
    parameter["anyValue"] = true
  }, "DataType":function(node, parameter) {
    parameter["dataType"] = this.getChildValue(node)
  }, "Range":function(node, allowedValues) {
    allowedValues["range"] = {};
    this.readChildNodes(node, allowedValues["range"])
  }, "MinimumValue":function(node, range) {
    range["minValue"] = this.getChildValue(node)
  }, "MaximumValue":function(node, range) {
    range["maxValue"] = this.getChildValue(node)
  }, "Identifier":function(node, obj) {
    obj["identifier"] = this.getChildValue(node)
  }, "SupportedCRS":function(node, obj) {
    obj["supportedCRS"] = this.getChildValue(node)
  }})
};
goog.inherits(ol.parser.ogc.OWSCommon_v1_1_0, ol.parser.ogc.OWSCommon_v1);
goog.provide("ol.parser.ogc.Versioned");
goog.require("goog.dom.xml");
goog.require("ol.parser.ogc.ExceptionReport");
ol.parser.ogc.Versioned = function(formatOptions) {
  formatOptions = formatOptions || {};
  this.options = formatOptions;
  this.defaultVersion = formatOptions.defaultVersion || null;
  this.version = formatOptions.version;
  this.profile = formatOptions.profile;
  if(formatOptions.allowFallback !== undefined) {
    this.allowFallback = formatOptions.allowFallback
  }else {
    this.allowFallback = false
  }
  if(formatOptions.stringifyOutput !== undefined) {
    this.stringifyOutput = formatOptions.stringifyOutput
  }else {
    this.stringifyOutput = false
  }
};
ol.parser.ogc.Versioned.prototype.getVersion = function(root, opt_options) {
  var version;
  if(root) {
    version = this.version;
    if(!version) {
      version = root.getAttribute("version");
      if(!version) {
        version = this.defaultVersion
      }
    }
  }else {
    version = opt_options && opt_options.version || this.version || this.defaultVersion
  }
  return version
};
ol.parser.ogc.Versioned.prototype.getParser = function(version) {
  version = version || this.defaultVersion;
  var profile = this.profile ? "_" + this.profile : "";
  if(!this.parser || this.parser.VERSION != version) {
    var format = this.parsers["v" + version.replace(/\./g, "_") + profile];
    if(!format) {
      if(profile !== "" && this.allowFallback) {
        profile = "";
        format = this.parsers["v" + version.replace(/\./g, "_") + profile]
      }
      if(!format) {
        throw"Can't find a parser for version " + version + profile;
      }
    }
    this.parser = new format(this.options)
  }
  return this.parser
};
ol.parser.ogc.Versioned.prototype.write = function(obj, opt_options) {
  var version = this.getVersion(null, opt_options);
  this.parser = this.getParser(version);
  var root = this.parser.write(obj, opt_options);
  if(this.stringifyOutput === false) {
    return root
  }else {
    return goog.dom.xml.serialize(root)
  }
};
ol.parser.ogc.Versioned.prototype.read = function(data, opt_options) {
  if(typeof data == "string") {
    data = goog.dom.xml.loadXml(data)
  }
  var root = data.documentElement;
  var version = this.getVersion(root);
  this.parser = this.getParser(version);
  var obj = this.parser.read(data, opt_options);
  var errorProperty = this.parser.errorProperty || null;
  if(errorProperty !== null && obj[errorProperty] === undefined) {
    var format = new ol.parser.ogc.ExceptionReport;
    obj.error = format.read(data)
  }
  obj.version = version;
  return obj
};
goog.provide("ol.parser.ogc.WMSCapabilities_v1");
goog.require("goog.dom.xml");
goog.require("goog.object");
goog.require("ol.parser.XML");
ol.parser.ogc.WMSCapabilities_v1 = function() {
  this.defaultNamespaceURI = "http://www.opengis.net/wms";
  this.errorProperty = "service";
  this.readers = {"http://www.opengis.net/wms":{"Service":function(node, obj) {
    obj["service"] = {};
    this.readChildNodes(node, obj["service"])
  }, "Name":function(node, obj) {
    obj["name"] = this.getChildValue(node)
  }, "Title":function(node, obj) {
    obj["title"] = this.getChildValue(node)
  }, "Abstract":function(node, obj) {
    obj["abstract"] = this.getChildValue(node)
  }, "BoundingBox":function(node, obj) {
    var bbox = {};
    bbox["bbox"] = [parseFloat(node.getAttribute("minx")), parseFloat(node.getAttribute("miny")), parseFloat(node.getAttribute("maxx")), parseFloat(node.getAttribute("maxy"))];
    var res = {x:parseFloat(node.getAttribute("resx")), y:parseFloat(node.getAttribute("resy"))};
    if(!(isNaN(res.x) && isNaN(res.y))) {
      bbox["res"] = res
    }
    return bbox
  }, "OnlineResource":function(node, obj) {
    obj["href"] = this.getAttributeNS(node, "http://www.w3.org/1999/xlink", "href")
  }, "ContactInformation":function(node, obj) {
    obj["contactInformation"] = {};
    this.readChildNodes(node, obj["contactInformation"])
  }, "ContactPersonPrimary":function(node, obj) {
    obj["personPrimary"] = {};
    this.readChildNodes(node, obj["personPrimary"])
  }, "ContactPerson":function(node, obj) {
    obj["person"] = this.getChildValue(node)
  }, "ContactOrganization":function(node, obj) {
    obj["organization"] = this.getChildValue(node)
  }, "ContactPosition":function(node, obj) {
    obj["position"] = this.getChildValue(node)
  }, "ContactAddress":function(node, obj) {
    obj["contactAddress"] = {};
    this.readChildNodes(node, obj["contactAddress"])
  }, "AddressType":function(node, obj) {
    obj["type"] = this.getChildValue(node)
  }, "Address":function(node, obj) {
    obj["address"] = this.getChildValue(node)
  }, "City":function(node, obj) {
    obj["city"] = this.getChildValue(node)
  }, "StateOrProvince":function(node, obj) {
    obj["stateOrProvince"] = this.getChildValue(node)
  }, "PostCode":function(node, obj) {
    obj["postcode"] = this.getChildValue(node)
  }, "Country":function(node, obj) {
    obj["country"] = this.getChildValue(node)
  }, "ContactVoiceTelephone":function(node, obj) {
    obj["phone"] = this.getChildValue(node)
  }, "ContactFacsimileTelephone":function(node, obj) {
    obj["fax"] = this.getChildValue(node)
  }, "ContactElectronicMailAddress":function(node, obj) {
    obj["email"] = this.getChildValue(node)
  }, "Fees":function(node, obj) {
    var fees = this.getChildValue(node);
    if(fees && fees.toLowerCase() != "none") {
      obj["fees"] = fees
    }
  }, "AccessConstraints":function(node, obj) {
    var constraints = this.getChildValue(node);
    if(constraints && constraints.toLowerCase() != "none") {
      obj["accessConstraints"] = constraints
    }
  }, "Capability":function(node, obj) {
    obj["capability"] = {};
    obj["capability"]["nestedLayers"] = [];
    obj["capability"]["layers"] = [];
    this.readChildNodes(node, obj["capability"])
  }, "Request":function(node, obj) {
    obj["request"] = {};
    this.readChildNodes(node, obj["request"])
  }, "GetCapabilities":function(node, obj) {
    obj["getcapabilities"] = {};
    obj["getcapabilities"]["formats"] = [];
    this.readChildNodes(node, obj["getcapabilities"])
  }, "Format":function(node, obj) {
    if(goog.isArray(obj["formats"])) {
      obj["formats"].push(this.getChildValue(node))
    }else {
      obj["format"] = this.getChildValue(node)
    }
  }, "DCPType":function(node, obj) {
    this.readChildNodes(node, obj)
  }, "HTTP":function(node, obj) {
    this.readChildNodes(node, obj)
  }, "Get":function(node, obj) {
    obj["get"] = {};
    this.readChildNodes(node, obj["get"])
  }, "Post":function(node, obj) {
    obj["post"] = {};
    this.readChildNodes(node, obj["post"])
  }, "GetMap":function(node, obj) {
    obj["getmap"] = {};
    obj["getmap"]["formats"] = [];
    this.readChildNodes(node, obj["getmap"])
  }, "GetFeatureInfo":function(node, obj) {
    obj["getfeatureinfo"] = {};
    obj["getfeatureinfo"]["formats"] = [];
    this.readChildNodes(node, obj["getfeatureinfo"])
  }, "Exception":function(node, obj) {
    obj["exception"] = {};
    obj["exception"]["formats"] = [];
    this.readChildNodes(node, obj["exception"])
  }, "Layer":function(node, obj) {
    var parentLayer, capability;
    if(obj["capability"]) {
      capability = obj["capability"];
      parentLayer = obj
    }else {
      capability = obj
    }
    var attrNode = node.getAttributeNode("queryable");
    var queryable = attrNode && attrNode.specified ? node.getAttribute("queryable") : null;
    attrNode = node.getAttributeNode("cascaded");
    var cascaded = attrNode && attrNode.specified ? node.getAttribute("cascaded") : null;
    attrNode = node.getAttributeNode("opaque");
    var opaque = attrNode && attrNode.specified ? node.getAttribute("opaque") : null;
    var noSubsets = node.getAttribute("noSubsets");
    var fixedWidth = node.getAttribute("fixedWidth");
    var fixedHeight = node.getAttribute("fixedHeight");
    var parent = parentLayer || {};
    var layer = {"nestedLayers":[], "styles":parentLayer ? [].concat(parentLayer["styles"]) : [], "srs":{}, "metadataURLs":[], "bbox":{}, "llbbox":parent["llbbox"], "dimensions":{}, "authorityURLs":{}, "identifiers":{}, "keywords":[], "queryable":queryable && queryable !== "" ? queryable === "1" || queryable === "true" : parent["queryable"] || false, "cascaded":cascaded !== null ? parseInt(cascaded, 10) : parent["cascaded"] || 0, "opaque":opaque ? opaque === "1" || opaque === "true" : parent["opaque"] || 
    false, "noSubsets":noSubsets !== null ? noSubsets === "1" || noSubsets === "true" : parent["noSubsets"] || false, "fixedWidth":fixedWidth !== null ? parseInt(fixedWidth, 10) : parent["fixedWidth"] || 0, "fixedHeight":fixedHeight !== null ? parseInt(fixedHeight, 10) : parent["fixedHeight"] || 0, "minScale":parent["minScale"], "maxScale":parent["maxScale"], "attribution":parent["attribution"]};
    if(parentLayer) {
      goog.object.extend(layer["srs"], parent["srs"]);
      goog.object.extend(layer["bbox"], parent["bbox"]);
      goog.object.extend(layer["dimensions"], parent["dimensions"]);
      goog.object.extend(layer["authorityURLs"], parent["authorityURLs"])
    }
    obj["nestedLayers"].push(layer);
    layer["capability"] = capability;
    this.readChildNodes(node, layer);
    delete layer["capability"];
    if(layer["name"]) {
      var parts = layer["name"].split(":"), request = capability["request"], gfi = request["getfeatureinfo"];
      if(parts.length > 0) {
        layer["prefix"] = parts[0]
      }
      capability["layers"].push(layer);
      if(layer["formats"] === undefined) {
        layer["formats"] = request["getmap"]["formats"]
      }
      if(layer["infoFormats"] === undefined && gfi) {
        layer["infoFormats"] = gfi["formats"]
      }
    }
  }, "Attribution":function(node, obj) {
    obj["attribution"] = {};
    this.readChildNodes(node, obj["attribution"])
  }, "LogoURL":function(node, obj) {
    obj["logo"] = {"width":node.getAttribute("width"), "height":node.getAttribute("height")};
    this.readChildNodes(node, obj["logo"])
  }, "Style":function(node, obj) {
    var style = {};
    obj["styles"].push(style);
    this.readChildNodes(node, style)
  }, "LegendURL":function(node, obj) {
    var legend = {"width":node.getAttribute("width"), "height":node.getAttribute("height")};
    obj["legend"] = legend;
    this.readChildNodes(node, legend)
  }, "MetadataURL":function(node, obj) {
    var metadataURL = {"type":node.getAttribute("type")};
    obj["metadataURLs"].push(metadataURL);
    this.readChildNodes(node, metadataURL)
  }, "DataURL":function(node, obj) {
    obj["dataURL"] = {};
    this.readChildNodes(node, obj["dataURL"])
  }, "FeatureListURL":function(node, obj) {
    obj["featureListURL"] = {};
    this.readChildNodes(node, obj["featureListURL"])
  }, "AuthorityURL":function(node, obj) {
    var name = node.getAttribute("name");
    var authority = {};
    this.readChildNodes(node, authority);
    obj["authorityURLs"][name] = authority["href"]
  }, "Identifier":function(node, obj) {
    var authority = node.getAttribute("authority");
    obj["identifiers"][authority] = this.getChildValue(node)
  }, "KeywordList":function(node, obj) {
    this.readChildNodes(node, obj)
  }, "SRS":function(node, obj) {
    obj["srs"][this.getChildValue(node)] = true
  }}};
  goog.base(this)
};
goog.inherits(ol.parser.ogc.WMSCapabilities_v1, ol.parser.XML);
ol.parser.ogc.WMSCapabilities_v1.prototype.read = function(data) {
  if(typeof data == "string") {
    data = goog.dom.xml.loadXml(data)
  }
  if(data && data.nodeType == 9) {
    data = data.documentElement
  }
  var obj = {};
  this.readNode(data, obj);
  return obj
};
goog.provide("ol.parser.ogc.WMSCapabilities_v1_1");
goog.require("ol.parser.ogc.WMSCapabilities_v1");
ol.parser.ogc.WMSCapabilities_v1_1 = function() {
  goog.base(this);
  var bboxreader = this.readers["http://www.opengis.net/wms"]["BoundingBox"];
  goog.object.extend(this.readers["http://www.opengis.net/wms"], {"WMT_MS_Capabilities":function(node, obj) {
    this.readChildNodes(node, obj)
  }, "Keyword":function(node, obj) {
    if(obj["keywords"]) {
      obj["keywords"].push({"value":this.getChildValue(node)})
    }
  }, "DescribeLayer":function(node, obj) {
    obj["describelayer"] = {"formats":[]};
    this.readChildNodes(node, obj["describelayer"])
  }, "GetLegendGraphic":function(node, obj) {
    obj["getlegendgraphic"] = {"formats":[]};
    this.readChildNodes(node, obj["getlegendgraphic"])
  }, "GetStyles":function(node, obj) {
    obj["getstyles"] = {"formats":[]};
    this.readChildNodes(node, obj["getstyles"])
  }, "PutStyles":function(node, obj) {
    obj["putstyles"] = {"formats":[]};
    this.readChildNodes(node, obj["putstyles"])
  }, "UserDefinedSymbolization":function(node, obj) {
    var userSymbols = {"supportSLD":parseInt(node.getAttribute("SupportSLD"), 10) == 1, "userLayer":parseInt(node.getAttribute("UserLayer"), 10) == 1, "userStyle":parseInt(node.getAttribute("UserStyle"), 10) == 1, "remoteWFS":parseInt(node.getAttribute("RemoteWFS"), 10) == 1};
    obj["userSymbols"] = userSymbols
  }, "LatLonBoundingBox":function(node, obj) {
    obj["llbbox"] = [parseFloat(node.getAttribute("minx")), parseFloat(node.getAttribute("miny")), parseFloat(node.getAttribute("maxx")), parseFloat(node.getAttribute("maxy"))]
  }, "BoundingBox":function(node, obj) {
    var bbox = bboxreader.apply(this, arguments);
    bbox["srs"] = node.getAttribute("SRS");
    obj["bbox"][bbox["srs"]] = bbox
  }, "ScaleHint":function(node, obj) {
    var min = parseFloat(node.getAttribute("min"));
    var max = parseFloat(node.getAttribute("max"));
    var rad2 = Math.pow(2, 0.5);
    var dpi = 25.4 / 0.28;
    var ipm = 39.37;
    if(min !== 0) {
      obj["maxScale"] = parseFloat(min / rad2 * ipm * dpi)
    }
    if(max != Number.POSITIVE_INFINITY) {
      obj["minScale"] = parseFloat(max / rad2 * ipm * dpi)
    }
  }, "Dimension":function(node, obj) {
    var name = node.getAttribute("name").toLowerCase();
    var dim = {"name":name, "units":node.getAttribute("units"), "unitsymbol":node.getAttribute("unitSymbol")};
    obj["dimensions"][dim.name] = dim
  }, "Extent":function(node, obj) {
    var name = node.getAttribute("name").toLowerCase();
    if(name in obj["dimensions"]) {
      var extent = obj["dimensions"][name];
      extent["nearestVal"] = node.getAttribute("nearestValue") === "1";
      extent["multipleVal"] = node.getAttribute("multipleValues") === "1";
      extent["current"] = node.getAttribute("current") === "1";
      extent["default"] = node.getAttribute("default") || "";
      var values = this.getChildValue(node);
      extent["values"] = values.split(",")
    }
  }})
};
goog.inherits(ol.parser.ogc.WMSCapabilities_v1_1, ol.parser.ogc.WMSCapabilities_v1);
goog.provide("ol.parser.ogc.WMSCapabilities_v1_1_0");
goog.require("ol.parser.ogc.WMSCapabilities_v1_1");
ol.parser.ogc.WMSCapabilities_v1_1_0 = function() {
  goog.base(this);
  this.version = "1.1.0";
  goog.object.extend(this.readers["http://www.opengis.net/wms"], {"SRS":function(node, obj) {
    var srs = this.getChildValue(node);
    var values = srs.split(/ +/);
    for(var i = 0, len = values.length;i < len;i++) {
      obj["srs"][values[i]] = true
    }
  }})
};
goog.inherits(ol.parser.ogc.WMSCapabilities_v1_1_0, ol.parser.ogc.WMSCapabilities_v1_1);
goog.provide("ol.parser.ogc.WMSCapabilities_v1_1_1");
goog.require("ol.parser.ogc.WMSCapabilities_v1_1");
ol.parser.ogc.WMSCapabilities_v1_1_1 = function() {
  goog.base(this);
  this.version = "1.1.1";
  goog.object.extend(this.readers["http://www.opengis.net/wms"], {"SRS":function(node, obj) {
    obj["srs"][this.getChildValue(node)] = true
  }})
};
goog.inherits(ol.parser.ogc.WMSCapabilities_v1_1_1, ol.parser.ogc.WMSCapabilities_v1_1);
goog.provide("ol.parser.ogc.WMSCapabilities_v1_1_1_WMSC");
goog.require("ol.parser.ogc.WMSCapabilities_v1_1_1");
ol.parser.ogc.WMSCapabilities_v1_1_1_WMSC = function() {
  goog.base(this);
  this.profile = "WMSC";
  goog.object.extend(this.readers["http://www.opengis.net/wms"], {"VendorSpecificCapabilities":function(node, obj) {
    obj["vendorSpecific"] = {"tileSets":[]};
    this.readChildNodes(node, obj["vendorSpecific"])
  }, "TileSet":function(node, vendorSpecific) {
    var tileset = {"srs":{}, "bbox":{}, "resolutions":[]};
    this.readChildNodes(node, tileset);
    vendorSpecific.tileSets.push(tileset)
  }, "Resolutions":function(node, tileset) {
    var res = this.getChildValue(node).split(" ");
    for(var i = 0, len = res.length;i < len;i++) {
      if(res[i] !== "") {
        tileset["resolutions"].push(parseFloat(res[i]))
      }
    }
  }, "Width":function(node, tileset) {
    tileset["width"] = parseInt(this.getChildValue(node), 10)
  }, "Height":function(node, tileset) {
    tileset["height"] = parseInt(this.getChildValue(node), 10)
  }, "Layers":function(node, tileset) {
    tileset["layers"] = this.getChildValue(node)
  }, "Styles":function(node, tileset) {
    tileset["styles"] = this.getChildValue(node)
  }})
};
goog.inherits(ol.parser.ogc.WMSCapabilities_v1_1_1_WMSC, ol.parser.ogc.WMSCapabilities_v1_1_1);
goog.provide("ol.parser.ogc.WMSCapabilities_v1_3_0");
goog.require("ol.parser.ogc.WMSCapabilities_v1");
ol.parser.ogc.WMSCapabilities_v1_3_0 = function() {
  goog.base(this);
  var bboxreader = this.readers["http://www.opengis.net/wms"]["BoundingBox"];
  goog.object.extend(this.readers["http://www.opengis.net/wms"], {"WMS_Capabilities":function(node, obj) {
    this.readChildNodes(node, obj)
  }, "LayerLimit":function(node, obj) {
    obj["layerLimit"] = parseInt(this.getChildValue(node), 10)
  }, "MaxWidth":function(node, obj) {
    obj["maxWidth"] = parseInt(this.getChildValue(node), 10)
  }, "MaxHeight":function(node, obj) {
    obj["maxHeight"] = parseInt(this.getChildValue(node), 10)
  }, "BoundingBox":function(node, obj) {
    var bbox = bboxreader.apply(this, arguments);
    bbox["srs"] = node.getAttribute("CRS");
    obj["bbox"][bbox["srs"]] = bbox
  }, "CRS":function(node, obj) {
    this.readers["http://www.opengis.net/wms"]["SRS"].apply(this, arguments)
  }, "EX_GeographicBoundingBox":function(node, obj) {
    obj["llbbox"] = [];
    this.readChildNodes(node, obj["llbbox"])
  }, "westBoundLongitude":function(node, obj) {
    obj[0] = this.getChildValue(node)
  }, "eastBoundLongitude":function(node, obj) {
    obj[2] = this.getChildValue(node)
  }, "southBoundLatitude":function(node, obj) {
    obj[1] = this.getChildValue(node)
  }, "northBoundLatitude":function(node, obj) {
    obj[3] = this.getChildValue(node)
  }, "MinScaleDenominator":function(node, obj) {
    obj["maxScale"] = parseFloat(this.getChildValue(node)).toPrecision(16)
  }, "MaxScaleDenominator":function(node, obj) {
    obj["minScale"] = parseFloat(this.getChildValue(node)).toPrecision(16)
  }, "Dimension":function(node, obj) {
    var name = node.getAttribute("name").toLowerCase();
    var dim = {"name":name, "units":node.getAttribute("units"), "unitsymbol":node.getAttribute("unitSymbol"), "nearestVal":node.getAttribute("nearestValue") === "1", "multipleVal":node.getAttribute("multipleValues") === "1", "default":node.getAttribute("default") || "", "current":node.getAttribute("current") === "1", "values":this.getChildValue(node).split(",")};
    obj["dimensions"][dim["name"]] = dim
  }, "Keyword":function(node, obj) {
    var keyword = {"value":this.getChildValue(node), "vocabulary":node.getAttribute("vocabulary")};
    if(obj["keywords"]) {
      obj["keywords"].push(keyword)
    }
  }});
  this.readers["sld"] = {"UserDefinedSymbolization":function(node, obj) {
    var readers = this.readers["http://www.opengis.net/wms"];
    readers.UserDefinedSymbolization.apply(this, arguments);
    var value = node.getAttribute("InlineFeature");
    obj["userSymbols"]["inlineFeature"] = parseInt(value, 10) == 1;
    value = node.getAttribute("RemoteWCS");
    obj["userSymbols"]["remoteWCS"] = parseInt(value, 10) == 1
  }, "DescribeLayer":function(node, obj) {
    var readers = this.readers["http://www.opengis.net/wms"];
    readers.DescribeLayer.apply(this, arguments)
  }, "GetLegendGraphic":function(node, obj) {
    var readers = this.readers["http://www.opengis.net/wms"];
    readers.GetLegendGraphic.apply(this, arguments)
  }}
};
goog.inherits(ol.parser.ogc.WMSCapabilities_v1_3_0, ol.parser.ogc.WMSCapabilities_v1);
goog.provide("ol.parser.ogc.WMSCapabilities");
goog.require("ol.parser.ogc.Versioned");
goog.require("ol.parser.ogc.WMSCapabilities_v1_1_0");
goog.require("ol.parser.ogc.WMSCapabilities_v1_1_1");
goog.require("ol.parser.ogc.WMSCapabilities_v1_1_1_WMSC");
goog.require("ol.parser.ogc.WMSCapabilities_v1_3_0");
ol.ENABLE_WMSCAPS_1_1_0 = true;
ol.ENABLE_WMSCAPS_1_1_1 = true;
ol.ENABLE_WMSCAPS_1_3_0 = true;
ol.ENABLE_WMSCAPS_1_1_1_WMSC = true;
ol.parser.ogc.WMSCapabilities = function(opt_options) {
  opt_options = opt_options || {};
  opt_options["defaultVersion"] = "1.1.1";
  this.parsers = {};
  if(ol.ENABLE_WMSCAPS_1_1_0) {
    this.parsers["v1_1_0"] = ol.parser.ogc.WMSCapabilities_v1_1_0
  }
  if(ol.ENABLE_WMSCAPS_1_1_1) {
    this.parsers["v1_1_1"] = ol.parser.ogc.WMSCapabilities_v1_1_1
  }
  if(ol.ENABLE_WMSCAPS_1_1_1_WMSC) {
    this.parsers["v1_1_1_WMSC"] = ol.parser.ogc.WMSCapabilities_v1_1_1_WMSC
  }
  if(ol.ENABLE_WMSCAPS_1_3_0) {
    this.parsers["v1_3_0"] = ol.parser.ogc.WMSCapabilities_v1_3_0
  }
  goog.base(this, opt_options)
};
goog.inherits(ol.parser.ogc.WMSCapabilities, ol.parser.ogc.Versioned);
goog.provide("ol.parser.ogc.WMTSCapabilities_v1_0_0");
goog.require("goog.dom.xml");
goog.require("ol.Coordinate");
goog.require("ol.parser.XML");
goog.require("ol.parser.ogc.OWSCommon_v1_1_0");
goog.require("ol.projection");
ol.parser.ogc.WMTSCapabilities_v1_0_0 = function() {
  this.defaultNamespaceURI = "http://www.opengis.net/wtms/1.0";
  this.errorProperty = "serviceIdentification";
  this.readers = {"http://www.opengis.net/wmts/1.0":{"Capabilities":function(node, obj) {
    this.readChildNodes(node, obj)
  }, "Contents":function(node, obj) {
    obj["contents"] = {};
    obj["contents"]["layers"] = [];
    obj["contents"]["tileMatrixSets"] = {};
    this.readChildNodes(node, obj["contents"])
  }, "Layer":function(node, obj) {
    var layer = {"styles":[], "formats":[], "dimensions":[], "tileMatrixSetLinks":[]};
    layer["layers"] = [];
    this.readChildNodes(node, layer);
    obj["layers"].push(layer)
  }, "Style":function(node, obj) {
    var style = {};
    style["isDefault"] = node.getAttribute("isDefault") === "true";
    this.readChildNodes(node, style);
    obj["styles"].push(style)
  }, "Format":function(node, obj) {
    obj["formats"].push(this.getChildValue(node))
  }, "TileMatrixSetLink":function(node, obj) {
    var tileMatrixSetLink = {};
    this.readChildNodes(node, tileMatrixSetLink);
    obj["tileMatrixSetLinks"].push(tileMatrixSetLink)
  }, "TileMatrixSet":function(node, obj) {
    if(obj["layers"]) {
      var tileMatrixSet = {"matrixIds":[]};
      this.readChildNodes(node, tileMatrixSet);
      obj["tileMatrixSets"][tileMatrixSet["identifier"]] = tileMatrixSet
    }else {
      obj["tileMatrixSet"] = this.getChildValue(node)
    }
  }, "TileMatrix":function(node, obj) {
    var tileMatrix = {"supportedCRS":obj.supportedCRS};
    this.readChildNodes(node, tileMatrix);
    obj["matrixIds"].push(tileMatrix)
  }, "ScaleDenominator":function(node, obj) {
    obj["scaleDenominator"] = parseFloat(this.getChildValue(node))
  }, "TopLeftCorner":function(node, obj) {
    var topLeftCorner = this.getChildValue(node);
    var coords = topLeftCorner.split(" ");
    var axisOrientation = ol.projection.getFromCode(obj["supportedCRS"]).getAxisOrientation();
    obj["topLeftCorner"] = ol.Coordinate.fromProjectedArray([parseFloat(coords[0]), parseFloat(coords[1])], axisOrientation)
  }, "TileWidth":function(node, obj) {
    obj["tileWidth"] = parseInt(this.getChildValue(node), 10)
  }, "TileHeight":function(node, obj) {
    obj["tileHeight"] = parseInt(this.getChildValue(node), 10)
  }, "MatrixWidth":function(node, obj) {
    obj["matrixWidth"] = parseInt(this.getChildValue(node), 10)
  }, "MatrixHeight":function(node, obj) {
    obj["matrixHeight"] = parseInt(this.getChildValue(node), 10)
  }, "ResourceURL":function(node, obj) {
    var resourceType = node.getAttribute("resourceType");
    var format = node.getAttribute("format");
    var template = node.getAttribute("template");
    if(!obj["resourceUrls"]) {
      obj["resourceUrls"] = {}
    }
    if(!obj["resourceUrls"][resourceType]) {
      obj["resourceUrls"][resourceType] = {}
    }
    if(!obj["resourceUrls"][resourceType][format]) {
      obj["resourceUrls"][resourceType][format] = []
    }
    obj["resourceUrls"][resourceType][format].push(template)
  }, "WSDL":function(node, obj) {
    obj["wsdl"] = {};
    obj["wsdl"]["href"] = this.getAttributeNS(node, "http://www.w3.org/1999/xlink", "href")
  }, "ServiceMetadataURL":function(node, obj) {
    obj["serviceMetadataUrl"] = {};
    obj["serviceMetadataUrl"]["href"] = this.getAttributeNS(node, "http://www.w3.org/1999/xlink", "href")
  }, "LegendURL":function(node, obj) {
    obj["legend"] = {};
    obj["legend"]["href"] = this.getAttributeNS(node, "http://www.w3.org/1999/xlink", "href");
    obj["legend"]["format"] = node.getAttribute("format")
  }, "Dimension":function(node, obj) {
    var dimension = {"values":[]};
    this.readChildNodes(node, dimension);
    obj["dimensions"].push(dimension)
  }, "Default":function(node, obj) {
    obj["default"] = this.getChildValue(node)
  }, "Value":function(node, obj) {
    obj["values"].push(this.getChildValue(node))
  }}};
  var ows = new ol.parser.ogc.OWSCommon_v1_1_0;
  this.readers["http://www.opengis.net/ows/1.1"] = ows.readers["http://www.opengis.net/ows/1.1"];
  goog.base(this)
};
goog.inherits(ol.parser.ogc.WMTSCapabilities_v1_0_0, ol.parser.XML);
ol.parser.ogc.WMTSCapabilities_v1_0_0.prototype.read = function(data) {
  if(typeof data == "string") {
    data = goog.dom.xml.loadXml(data)
  }
  if(data && data.nodeType == 9) {
    data = data.documentElement
  }
  var obj = {};
  this.readNode(data, obj);
  return obj
};
goog.provide("ol.parser.ogc.WMTSCapabilities");
goog.require("ol.parser.ogc.Versioned");
goog.require("ol.parser.ogc.WMTSCapabilities_v1_0_0");
ol.parser.ogc.WMTSCapabilities = function(opt_options) {
  opt_options = opt_options || {};
  opt_options["defaultVersion"] = "1.0.0";
  this.parsers = {};
  this.parsers["v1_0_0"] = ol.parser.ogc.WMTSCapabilities_v1_0_0;
  goog.base(this, opt_options)
};
goog.inherits(ol.parser.ogc.WMTSCapabilities, ol.parser.ogc.Versioned);
/*
 Portions of this code are from MochiKit, received by
 The Closure Authors under the MIT license. All other code is Copyright
 2005-2009 The Closure Authors. All Rights Reserved.
*/
goog.provide("goog.async.Deferred");
goog.provide("goog.async.Deferred.AlreadyCalledError");
goog.provide("goog.async.Deferred.CancelledError");
goog.require("goog.array");
goog.require("goog.asserts");
goog.require("goog.debug.Error");
goog.async.Deferred = function(opt_canceller, opt_defaultScope) {
  this.chain_ = [];
  this.canceller_ = opt_canceller;
  this.defaultScope_ = opt_defaultScope || null
};
goog.async.Deferred.prototype.fired_ = false;
goog.async.Deferred.prototype.hadError_ = false;
goog.async.Deferred.prototype.result_;
goog.async.Deferred.prototype.paused_ = 0;
goog.async.Deferred.prototype.silentlyCancelled_ = false;
goog.async.Deferred.prototype.chained_ = false;
goog.async.Deferred.prototype.unhandledExceptionTimeoutId_;
goog.async.Deferred.prototype.parent_;
goog.async.Deferred.prototype.branches_ = 0;
goog.async.Deferred.prototype.cancel = function(opt_deepCancel) {
  if(!this.hasFired()) {
    if(this.parent_) {
      var parent = this.parent_;
      delete this.parent_;
      if(opt_deepCancel) {
        parent.cancel(opt_deepCancel)
      }else {
        parent.branchCancel_()
      }
    }
    if(this.canceller_) {
      this.canceller_.call(this.defaultScope_, this)
    }else {
      this.silentlyCancelled_ = true
    }
    if(!this.hasFired()) {
      this.errback(new goog.async.Deferred.CancelledError(this))
    }
  }else {
    if(this.result_ instanceof goog.async.Deferred) {
      this.result_.cancel()
    }
  }
};
goog.async.Deferred.prototype.branchCancel_ = function() {
  this.branches_--;
  if(this.branches_ <= 0) {
    this.cancel()
  }
};
goog.async.Deferred.prototype.pause_ = function() {
  this.paused_++
};
goog.async.Deferred.prototype.unpause_ = function() {
  this.paused_--;
  if(this.paused_ == 0 && this.hasFired()) {
    this.fire_()
  }
};
goog.async.Deferred.prototype.continue_ = function(isSuccess, res) {
  this.resback_(isSuccess, res);
  this.unpause_()
};
goog.async.Deferred.prototype.resback_ = function(isSuccess, res) {
  this.fired_ = true;
  this.result_ = res;
  this.hadError_ = !isSuccess;
  this.fire_()
};
goog.async.Deferred.prototype.check_ = function() {
  if(this.hasFired()) {
    if(!this.silentlyCancelled_) {
      throw new goog.async.Deferred.AlreadyCalledError(this);
    }
    this.silentlyCancelled_ = false
  }
};
goog.async.Deferred.prototype.callback = function(opt_result) {
  this.check_();
  this.assertNotDeferred_(opt_result);
  this.resback_(true, opt_result)
};
goog.async.Deferred.prototype.errback = function(opt_result) {
  this.check_();
  this.assertNotDeferred_(opt_result);
  this.resback_(false, opt_result)
};
goog.async.Deferred.prototype.assertNotDeferred_ = function(obj) {
  goog.asserts.assert(!(obj instanceof goog.async.Deferred), "Deferred instances can only be chained if they are the result of a " + "callback")
};
goog.async.Deferred.prototype.addCallback = function(cb, opt_scope) {
  return this.addCallbacks(cb, null, opt_scope)
};
goog.async.Deferred.prototype.addErrback = function(eb, opt_scope) {
  return this.addCallbacks(null, eb, opt_scope)
};
goog.async.Deferred.prototype.addCallbacks = function(cb, eb, opt_scope) {
  goog.asserts.assert(!this.chained_, "Chained Deferreds can not be re-used");
  this.chain_.push([cb, eb, opt_scope]);
  if(this.hasFired()) {
    this.fire_()
  }
  return this
};
goog.async.Deferred.prototype.chainDeferred = function(otherDeferred) {
  this.addCallbacks(otherDeferred.callback, otherDeferred.errback, otherDeferred);
  return this
};
goog.async.Deferred.prototype.awaitDeferred = function(otherDeferred) {
  return this.addCallback(goog.bind(otherDeferred.branch, otherDeferred))
};
goog.async.Deferred.prototype.branch = function(opt_propagateCancel) {
  var d = new goog.async.Deferred;
  this.chainDeferred(d);
  if(opt_propagateCancel) {
    d.parent_ = this;
    this.branches_++
  }
  return d
};
goog.async.Deferred.prototype.addBoth = function(f, opt_scope) {
  return this.addCallbacks(f, f, opt_scope)
};
goog.async.Deferred.prototype.hasFired = function() {
  return this.fired_
};
goog.async.Deferred.prototype.isError = function(res) {
  return res instanceof Error
};
goog.async.Deferred.prototype.hasErrback_ = function() {
  return goog.array.some(this.chain_, function(chainRow) {
    return goog.isFunction(chainRow[1])
  })
};
goog.async.Deferred.prototype.fire_ = function() {
  if(this.unhandledExceptionTimeoutId_ && this.hasFired() && this.hasErrback_()) {
    goog.global.clearTimeout(this.unhandledExceptionTimeoutId_);
    delete this.unhandledExceptionTimeoutId_
  }
  if(this.parent_) {
    this.parent_.branches_--;
    delete this.parent_
  }
  var res = this.result_;
  var unhandledException = false;
  var isChained = false;
  while(this.chain_.length && this.paused_ == 0) {
    var chainEntry = this.chain_.shift();
    var callback = chainEntry[0];
    var errback = chainEntry[1];
    var scope = chainEntry[2];
    var f = this.hadError_ ? errback : callback;
    if(f) {
      try {
        var ret = f.call(scope || this.defaultScope_, res);
        if(goog.isDef(ret)) {
          this.hadError_ = this.hadError_ && (ret == res || this.isError(ret));
          this.result_ = res = ret
        }
        if(res instanceof goog.async.Deferred) {
          isChained = true;
          this.pause_()
        }
      }catch(ex) {
        res = ex;
        this.hadError_ = true;
        if(!this.hasErrback_()) {
          unhandledException = true
        }
      }
    }
  }
  this.result_ = res;
  if(isChained && this.paused_) {
    res.addCallbacks(goog.bind(this.continue_, this, true), goog.bind(this.continue_, this, false));
    res.chained_ = true
  }
  if(unhandledException) {
    this.unhandledExceptionTimeoutId_ = goog.global.setTimeout(function() {
      throw res;
    }, 0)
  }
};
goog.async.Deferred.succeed = function(res) {
  var d = new goog.async.Deferred;
  d.callback(res);
  return d
};
goog.async.Deferred.fail = function(res) {
  var d = new goog.async.Deferred;
  d.errback(res);
  return d
};
goog.async.Deferred.cancelled = function() {
  var d = new goog.async.Deferred;
  d.cancel();
  return d
};
goog.async.Deferred.when = function(value, callback, opt_scope) {
  if(value instanceof goog.async.Deferred) {
    return value.branch(true).addCallback(callback, opt_scope)
  }else {
    return goog.async.Deferred.succeed(value).addCallback(callback, opt_scope)
  }
};
goog.async.Deferred.AlreadyCalledError = function(deferred) {
  goog.debug.Error.call(this);
  this.deferred = deferred
};
goog.inherits(goog.async.Deferred.AlreadyCalledError, goog.debug.Error);
goog.async.Deferred.AlreadyCalledError.prototype.message = "Deferred has already fired";
goog.async.Deferred.AlreadyCalledError.prototype.name = "AlreadyCalledError";
goog.async.Deferred.CancelledError = function(deferred) {
  goog.debug.Error.call(this);
  this.deferred = deferred
};
goog.inherits(goog.async.Deferred.CancelledError, goog.debug.Error);
goog.async.Deferred.CancelledError.prototype.message = "Deferred was cancelled";
goog.async.Deferred.CancelledError.prototype.name = "CancelledError";
goog.provide("goog.net.jsloader");
goog.provide("goog.net.jsloader.Error");
goog.require("goog.array");
goog.require("goog.async.Deferred");
goog.require("goog.debug.Error");
goog.require("goog.dom");
goog.require("goog.userAgent");
goog.net.jsloader.GLOBAL_VERIFY_OBJS_ = "closure_verification";
goog.net.jsloader.DEFAULT_TIMEOUT = 5E3;
goog.net.jsloader.Options;
goog.net.jsloader.scriptsToLoad_ = [];
goog.net.jsloader.loadMany = function(uris, opt_options) {
  if(!uris.length) {
    return
  }
  var isAnotherModuleLoading = goog.net.jsloader.scriptsToLoad_.length;
  goog.array.extend(goog.net.jsloader.scriptsToLoad_, uris);
  if(isAnotherModuleLoading) {
    return
  }
  uris = goog.net.jsloader.scriptsToLoad_;
  var popAndLoadNextScript = function() {
    var uri = uris.shift();
    var deferred = goog.net.jsloader.load(uri, opt_options);
    if(uris.length) {
      deferred.addBoth(popAndLoadNextScript)
    }
  };
  popAndLoadNextScript()
};
goog.net.jsloader.load = function(uri, opt_options) {
  var options = opt_options || {};
  var doc = options.document || document;
  var script = goog.dom.createElement(goog.dom.TagName.SCRIPT);
  var request = {script_:script, timeout_:undefined};
  var deferred = new goog.async.Deferred(goog.net.jsloader.cancel_, request);
  var timeout = null;
  var timeoutDuration = goog.isDefAndNotNull(options.timeout) ? options.timeout : goog.net.jsloader.DEFAULT_TIMEOUT;
  if(timeoutDuration > 0) {
    timeout = window.setTimeout(function() {
      goog.net.jsloader.cleanup_(script, true);
      deferred.errback(new goog.net.jsloader.Error(goog.net.jsloader.ErrorCode.TIMEOUT, "Timeout reached for loading script " + uri))
    }, timeoutDuration);
    request.timeout_ = timeout
  }
  script.onload = script.onreadystatechange = function() {
    if(!script.readyState || script.readyState == "loaded" || script.readyState == "complete") {
      var removeScriptNode = options.cleanupWhenDone || false;
      goog.net.jsloader.cleanup_(script, removeScriptNode, timeout);
      deferred.callback(null)
    }
  };
  script.onerror = function() {
    goog.net.jsloader.cleanup_(script, true, timeout);
    deferred.errback(new goog.net.jsloader.Error(goog.net.jsloader.ErrorCode.LOAD_ERROR, "Error while loading script " + uri))
  };
  goog.dom.setProperties(script, {"type":"text/javascript", "charset":"UTF-8", "src":uri});
  var scriptParent = goog.net.jsloader.getScriptParentElement_(doc);
  scriptParent.appendChild(script);
  return deferred
};
goog.net.jsloader.loadAndVerify = function(uri, verificationObjName, options) {
  if(!goog.global[goog.net.jsloader.GLOBAL_VERIFY_OBJS_]) {
    goog.global[goog.net.jsloader.GLOBAL_VERIFY_OBJS_] = {}
  }
  var verifyObjs = goog.global[goog.net.jsloader.GLOBAL_VERIFY_OBJS_];
  if(goog.isDef(verifyObjs[verificationObjName])) {
    return goog.async.Deferred.fail(new goog.net.jsloader.Error(goog.net.jsloader.ErrorCode.VERIFY_OBJECT_ALREADY_EXISTS, "Verification object " + verificationObjName + " already defined."))
  }
  var sendDeferred = goog.net.jsloader.load(uri, options);
  var deferred = new goog.async.Deferred(sendDeferred.cancel);
  sendDeferred.addCallback(function() {
    var result = verifyObjs[verificationObjName];
    if(goog.isDef(result)) {
      deferred.callback(result);
      delete verifyObjs[verificationObjName]
    }else {
      deferred.errback(new goog.net.jsloader.Error(goog.net.jsloader.ErrorCode.VERIFY_ERROR, "Script " + uri + " loaded, but verification object " + verificationObjName + " was not defined."))
    }
  });
  sendDeferred.addErrback(function(error) {
    if(goog.isDef(verifyObjs[verificationObjName])) {
      delete verifyObjs[verificationObjName]
    }
    deferred.errback(error)
  });
  return deferred
};
goog.net.jsloader.getScriptParentElement_ = function(doc) {
  var headElements = doc.getElementsByTagName(goog.dom.TagName.HEAD);
  if(!headElements || goog.array.isEmpty(headElements)) {
    return doc.documentElement
  }else {
    return headElements[0]
  }
};
goog.net.jsloader.cancel_ = function() {
  var request = this;
  if(request && request.script_) {
    var scriptNode = request.script_;
    if(scriptNode && scriptNode.tagName == "SCRIPT") {
      goog.net.jsloader.cleanup_(scriptNode, true, request.timeout_)
    }
  }
};
goog.net.jsloader.cleanup_ = function(scriptNode, removeScriptNode, opt_timeout) {
  if(goog.isDefAndNotNull(opt_timeout)) {
    goog.global.clearTimeout(opt_timeout)
  }
  scriptNode.onload = goog.nullFunction;
  scriptNode.onerror = goog.nullFunction;
  scriptNode.onreadystatechange = goog.nullFunction;
  if(removeScriptNode) {
    window.setTimeout(function() {
      goog.dom.removeNode(scriptNode)
    }, 0)
  }
};
goog.net.jsloader.ErrorCode = {LOAD_ERROR:0, TIMEOUT:1, VERIFY_ERROR:2, VERIFY_OBJECT_ALREADY_EXISTS:3};
goog.net.jsloader.Error = function(code, opt_message) {
  var msg = "Jsloader error (code #" + code + ")";
  if(opt_message) {
    msg += ": " + opt_message
  }
  goog.base(this, msg);
  this.code = code
};
goog.inherits(goog.net.jsloader.Error, goog.debug.Error);
goog.provide("goog.net.Jsonp");
goog.require("goog.Uri");
goog.require("goog.dom");
goog.require("goog.net.jsloader");
goog.net.Jsonp = function(uri, opt_callbackParamName) {
  this.uri_ = new goog.Uri(uri);
  this.callbackParamName_ = opt_callbackParamName ? opt_callbackParamName : "callback";
  this.timeout_ = 5E3
};
goog.net.Jsonp.CALLBACKS = "_callbacks_";
goog.net.Jsonp.scriptCounter_ = 0;
goog.net.Jsonp.prototype.setRequestTimeout = function(timeout) {
  this.timeout_ = timeout
};
goog.net.Jsonp.prototype.getRequestTimeout = function() {
  return this.timeout_
};
goog.net.Jsonp.prototype.send = function(opt_payload, opt_replyCallback, opt_errorCallback, opt_callbackParamValue) {
  var payload = opt_payload || null;
  var id = opt_callbackParamValue || "_" + (goog.net.Jsonp.scriptCounter_++).toString(36) + goog.now().toString(36);
  if(!goog.global[goog.net.Jsonp.CALLBACKS]) {
    goog.global[goog.net.Jsonp.CALLBACKS] = {}
  }
  var uri = this.uri_.clone();
  if(payload) {
    goog.net.Jsonp.addPayloadToUri_(payload, uri)
  }
  if(opt_replyCallback) {
    var reply = goog.net.Jsonp.newReplyHandler_(id, opt_replyCallback);
    goog.global[goog.net.Jsonp.CALLBACKS][id] = reply;
    uri.setParameterValues(this.callbackParamName_, goog.net.Jsonp.CALLBACKS + "." + id)
  }
  var deferred = goog.net.jsloader.load(uri.toString(), {timeout:this.timeout_, cleanupWhenDone:true});
  var error = goog.net.Jsonp.newErrorHandler_(id, payload, opt_errorCallback);
  deferred.addErrback(error);
  return{id_:id, deferred_:deferred}
};
goog.net.Jsonp.prototype.cancel = function(request) {
  if(request) {
    if(request.deferred_) {
      request.deferred_.cancel()
    }
    if(request.id_) {
      goog.net.Jsonp.cleanup_(request.id_, false)
    }
  }
};
goog.net.Jsonp.newErrorHandler_ = function(id, payload, opt_errorCallback) {
  return function() {
    goog.net.Jsonp.cleanup_(id, false);
    if(opt_errorCallback) {
      opt_errorCallback(payload)
    }
  }
};
goog.net.Jsonp.newReplyHandler_ = function(id, replyCallback) {
  return function(var_args) {
    goog.net.Jsonp.cleanup_(id, true);
    replyCallback.apply(undefined, arguments)
  }
};
goog.net.Jsonp.cleanup_ = function(id, deleteReplyHandler) {
  if(goog.global[goog.net.Jsonp.CALLBACKS][id]) {
    if(deleteReplyHandler) {
      delete goog.global[goog.net.Jsonp.CALLBACKS][id]
    }else {
      goog.global[goog.net.Jsonp.CALLBACKS][id] = goog.nullFunction
    }
  }
};
goog.net.Jsonp.addPayloadToUri_ = function(payload, uri) {
  for(var name in payload) {
    if(!payload.hasOwnProperty || payload.hasOwnProperty(name)) {
      uri.setParameterValues(name, payload[name])
    }
  }
  return uri
};
goog.provide("ol.source.ImageTileSource");
goog.provide("ol.source.ImageTileSourceOptions");
goog.require("ol.Attribution");
goog.require("ol.Extent");
goog.require("ol.ImageTile");
goog.require("ol.Projection");
goog.require("ol.Tile");
goog.require("ol.TileCache");
goog.require("ol.TileUrlFunction");
goog.require("ol.TileUrlFunctionType");
goog.require("ol.source.TileSource");
goog.require("ol.tilegrid.TileGrid");
ol.source.ImageTileSourceOptions;
ol.source.ImageTileSource = function(options) {
  goog.base(this, {attributions:options.attributions, extent:options.extent, opaque:options.opaque, projection:options.projection, tileGrid:options.tileGrid});
  this.tileUrlFunction = goog.isDef(options.tileUrlFunction) ? options.tileUrlFunction : ol.TileUrlFunction.nullTileUrlFunction;
  this.crossOrigin_ = goog.isDef(options.crossOrigin) ? options.crossOrigin : "anonymous";
  this.tileCache_ = new ol.TileCache
};
goog.inherits(ol.source.ImageTileSource, ol.source.TileSource);
ol.source.ImageTileSource.prototype.canExpireCache = function() {
  return this.tileCache_.canExpireCache()
};
ol.source.ImageTileSource.prototype.expireCache = function(usedTiles) {
  this.tileCache_.expireCache(usedTiles)
};
ol.source.ImageTileSource.prototype.getTile = function(tileCoord, tileGrid, projection) {
  var key = tileCoord.toString();
  if(this.tileCache_.containsKey(key)) {
    return this.tileCache_.get(key)
  }else {
    goog.asserts.assert(tileGrid);
    goog.asserts.assert(projection);
    var tileUrl = this.tileUrlFunction(tileCoord, tileGrid, projection);
    var tile;
    if(goog.isDef(tileUrl)) {
      tile = new ol.ImageTile(tileCoord, tileUrl, this.crossOrigin_);
      this.tileCache_.set(key, tile)
    }else {
      tile = null
    }
    return tile
  }
};
ol.source.ImageTileSource.prototype.useTile = function(tileCoord) {
  var key = tileCoord.toString();
  if(this.tileCache_.containsKey(key)) {
    this.tileCache_.get(key)
  }
};
goog.provide("ol.tilegrid.XYZ");
goog.require("ol.Coordinate");
goog.require("ol.Size");
goog.require("ol.TileRange");
goog.require("ol.projection");
goog.require("ol.projection.EPSG3857");
goog.require("ol.tilegrid.TileGrid");
ol.tilegrid.XYZ = function(xyzOptions) {
  var resolutions = new Array(xyzOptions.maxZoom + 1);
  var z;
  var size = 2 * ol.projection.EPSG3857.HALF_SIZE / ol.DEFAULT_TILE_SIZE;
  for(z = 0;z <= xyzOptions.maxZoom;++z) {
    resolutions[z] = size / Math.pow(2, z)
  }
  goog.base(this, {origin:new ol.Coordinate(-ol.projection.EPSG3857.HALF_SIZE, ol.projection.EPSG3857.HALF_SIZE), resolutions:resolutions, tileSize:new ol.Size(ol.DEFAULT_TILE_SIZE, ol.DEFAULT_TILE_SIZE)})
};
goog.inherits(ol.tilegrid.XYZ, ol.tilegrid.TileGrid);
ol.tilegrid.XYZ.prototype.forEachTileCoordParentTileRange = function(tileCoord, callback, opt_obj) {
  var x = tileCoord.x;
  var y = tileCoord.y;
  var z = tileCoord.z;
  var tileRange;
  while(true) {
    z -= 1;
    if(z < 0) {
      break
    }
    x >>= 1;
    y >>= 1;
    tileRange = new ol.TileRange(x, y, x, y);
    if(callback.call(opt_obj, z, tileRange)) {
      break
    }
  }
};
goog.provide("ol.source.BingMaps");
goog.require("goog.Uri");
goog.require("goog.array");
goog.require("goog.net.Jsonp");
goog.require("ol.Attribution");
goog.require("ol.Extent");
goog.require("ol.Size");
goog.require("ol.TileCoord");
goog.require("ol.TileRange");
goog.require("ol.TileUrlFunction");
goog.require("ol.projection");
goog.require("ol.source.ImageTileSource");
goog.require("ol.tilegrid.XYZ");
ol.source.BingMaps = function(bingMapsOptions) {
  goog.base(this, {opaque:true, projection:ol.projection.getFromCode("EPSG:3857")});
  this.culture_ = goog.isDef(bingMapsOptions.culture) ? bingMapsOptions.culture : "en-us";
  this.ready_ = false;
  var uri = new goog.Uri("//dev.virtualearth.net/REST/v1/Imagery/Metadata/" + bingMapsOptions.style);
  var jsonp = new goog.net.Jsonp(uri, "jsonp");
  jsonp.send({"include":"ImageryProviders", "key":bingMapsOptions.key}, goog.bind(this.handleImageryMetadataResponse, this))
};
goog.inherits(ol.source.BingMaps, ol.source.ImageTileSource);
ol.source.BingMaps.prototype.handleImageryMetadataResponse = function(response) {
  goog.asserts.assert(response.authenticationResultCode == "ValidCredentials");
  goog.asserts.assert(response.statusCode == 200);
  goog.asserts.assert(response.statusDescription == "OK");
  var brandLogoUri = response.brandLogoUri;
  var copyright = response.copyright;
  goog.asserts.assert(response.resourceSets.length == 1);
  var resourceSet = response.resourceSets[0];
  goog.asserts.assert(resourceSet.resources.length == 1);
  var resource = resourceSet.resources[0];
  var zoomMin = resource.zoomMin;
  var zoomMax = resource.zoomMax;
  var tileSize = new ol.Size(resource.imageWidth, resource.imageHeight);
  var tileGrid = new ol.tilegrid.XYZ({maxZoom:zoomMax, tileSize:tileSize});
  this.tileGrid = tileGrid;
  this.tileUrlFunction = ol.TileUrlFunction.withTileCoordTransform(function(tileCoord) {
    if(tileCoord.z < zoomMin || zoomMax < tileCoord.z) {
      return null
    }
    var n = 1 << tileCoord.z;
    var y = -tileCoord.y - 1;
    if(y < 0 || n <= y) {
      return null
    }else {
      var x = goog.math.modulo(tileCoord.x, n);
      return new ol.TileCoord(tileCoord.z, x, y)
    }
  }, ol.TileUrlFunction.createFromTileUrlFunctions(goog.array.map(resource.imageUrlSubdomains, function(subdomain) {
    var imageUrl = resource.imageUrl.replace("{subdomain}", subdomain).replace("{culture}", this.culture_);
    return function(tileCoord) {
      if(goog.isNull(tileCoord)) {
        return undefined
      }else {
        return imageUrl.replace("{quadkey}", tileCoord.quadKey())
      }
    }
  })));
  var transform = ol.projection.getTransform(ol.projection.getFromCode("EPSG:4326"), this.getProjection());
  var attributions = goog.array.map(resource.imageryProviders, function(imageryProvider) {
    var html = imageryProvider.attribution;
    var tileRanges = {};
    goog.array.forEach(imageryProvider.coverageAreas, function(coverageArea) {
      var minZ = coverageArea.zoomMin;
      var maxZ = coverageArea.zoomMax;
      var bbox = coverageArea.bbox;
      var epsg4326Extent = new ol.Extent(bbox[1], bbox[0], bbox[3], bbox[2]);
      var extent = epsg4326Extent.transform(transform);
      var tileRange, z, zKey;
      for(z = minZ;z <= maxZ;++z) {
        zKey = z.toString();
        tileRange = tileGrid.getTileRangeForExtentAndZ(extent, z);
        if(zKey in tileRanges) {
          tileRanges[zKey].push(tileRange)
        }else {
          tileRanges[zKey] = [tileRange]
        }
      }
    });
    return new ol.Attribution(html, tileRanges)
  });
  this.setAttributions(attributions);
  this.ready_ = true;
  this.dispatchLoadEvent()
};
ol.source.BingMaps.prototype.isReady = function() {
  return this.ready_
};
goog.provide("ol.source.DebugTileSource");
goog.require("ol.Size");
goog.require("ol.Tile");
goog.require("ol.TileCache");
goog.require("ol.TileCoord");
goog.require("ol.TileState");
goog.require("ol.source.TileSource");
goog.require("ol.tilegrid.TileGrid");
ol.DebugTile_ = function(tileCoord, tileGrid) {
  goog.base(this, tileCoord);
  this.state = ol.TileState.LOADED;
  this.tileCoord_ = tileCoord;
  this.tileSize_ = tileGrid.getTileSize(tileCoord.z);
  this.canvasByContext_ = {}
};
goog.inherits(ol.DebugTile_, ol.Tile);
ol.DebugTile_.prototype.getImage = function(opt_context) {
  var key = goog.isDef(opt_context) ? goog.getUid(opt_context) : -1;
  if(key in this.canvasByContext_) {
    return this.canvasByContext_[key]
  }else {
    var tileSize = this.tileSize_;
    var canvas = goog.dom.createElement(goog.dom.TagName.CANVAS);
    canvas.width = tileSize.width;
    canvas.height = tileSize.height;
    var context = canvas.getContext("2d");
    context.strokeStyle = "black";
    context.strokeRect(0.5, 0.5, tileSize.width + 0.5, tileSize.height + 0.5);
    context.fillStyle = "black";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.font = "24px sans-serif";
    context.fillText(this.tileCoord_.toString(), tileSize.width / 2, tileSize.height / 2);
    this.canvasByContext_[key] = canvas;
    return canvas
  }
};
ol.source.DebugTileSource = function(options) {
  goog.base(this, {extent:options.extent, opaque:false, projection:options.projection, tileGrid:options.tileGrid});
  this.tileCache_ = new ol.TileCache
};
goog.inherits(ol.source.DebugTileSource, ol.source.TileSource);
ol.source.DebugTileSource.prototype.canExpireCache = function() {
  return this.tileCache_.canExpireCache()
};
ol.source.DebugTileSource.prototype.expireCache = function(usedTiles) {
  this.tileCache_.expireCache(usedTiles)
};
ol.source.DebugTileSource.prototype.getTile = function(tileCoord) {
  var key = tileCoord.toString();
  if(this.tileCache_.containsKey(key)) {
    return this.tileCache_.get(key)
  }else {
    var tile = new ol.DebugTile_(tileCoord, this.tileGrid);
    this.tileCache_.set(key, tile);
    return tile
  }
};
goog.provide("ol.source.XYZ");
goog.provide("ol.source.XYZOptions");
goog.require("goog.math");
goog.require("ol.Attribution");
goog.require("ol.Extent");
goog.require("ol.Projection");
goog.require("ol.TileCoord");
goog.require("ol.TileUrlFunction");
goog.require("ol.TileUrlFunctionType");
goog.require("ol.projection");
goog.require("ol.source.ImageTileSource");
goog.require("ol.tilegrid.XYZ");
ol.source.XYZOptions;
ol.source.XYZ = function(xyzOptions) {
  var projection = xyzOptions.projection || ol.projection.getFromCode("EPSG:3857");
  var tileUrlFunction = ol.TileUrlFunction.nullTileUrlFunction;
  if(goog.isDef(xyzOptions.tileUrlFunction)) {
    tileUrlFunction = xyzOptions.tileUrlFunction
  }else {
    if(goog.isDef(xyzOptions.urls)) {
      tileUrlFunction = ol.TileUrlFunction.createFromTemplates(xyzOptions.urls)
    }else {
      if(goog.isDef(xyzOptions.url)) {
        tileUrlFunction = ol.TileUrlFunction.createFromTemplate(xyzOptions.url)
      }
    }
  }
  var tileGrid = new ol.tilegrid.XYZ({maxZoom:xyzOptions.maxZoom});
  var extent = xyzOptions.extent;
  if(goog.isDefAndNotNull(extent)) {
    tileUrlFunction = ol.TileUrlFunction.withTileCoordTransform(function(tileCoord) {
      if(xyzOptions.maxZoom < tileCoord.z) {
        return null
      }
      var n = 1 << tileCoord.z;
      var y = -tileCoord.y - 1;
      if(y < 0 || n <= y) {
        return null
      }
      var x = goog.math.modulo(tileCoord.x, n);
      var tileExtent = tileGrid.getTileCoordExtent(new ol.TileCoord(tileCoord.z, x, tileCoord.y));
      if(!tileExtent.intersects(extent)) {
        return null
      }
      return new ol.TileCoord(tileCoord.z, x, y)
    }, tileUrlFunction)
  }else {
    tileUrlFunction = ol.TileUrlFunction.withTileCoordTransform(function(tileCoord) {
      if(xyzOptions.maxZoom < tileCoord.z) {
        return null
      }
      var n = 1 << tileCoord.z;
      var y = -tileCoord.y - 1;
      if(y < 0 || n <= y) {
        return null
      }else {
        var x = goog.math.modulo(tileCoord.x, n);
        return new ol.TileCoord(tileCoord.z, x, y)
      }
    }, tileUrlFunction)
  }
  goog.base(this, {attributions:xyzOptions.attributions, crossOrigin:xyzOptions.crossOrigin, extent:xyzOptions.extent, projection:projection, tileGrid:tileGrid, tileUrlFunction:tileUrlFunction})
};
goog.inherits(ol.source.XYZ, ol.source.ImageTileSource);
goog.provide("ol.source.MapQuestOSM");
goog.provide("ol.source.MapQuestOpenAerial");
goog.require("ol.Attribution");
goog.require("ol.source.XYZ");
ol.source.MapQuestOSM = function() {
  var attributions = [new ol.Attribution("Tiles Courtesy of " + '<a href="http://www.mapquest.com/" target="_blank">MapQuest</a> ' + '<img src="http://developer.mapquest.com/content/osm/mq_logo.png">'), new ol.Attribution("Data &copy; " + '<a href="http://www.openstreetmap.org">OpenStreetMap</a> ' + "contributors, " + '<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC BY-SA</a>')];
  goog.base(this, {attributions:attributions, opaque:true, maxZoom:28, url:"http://otile{1-4}.mqcdn.com/tiles/1.0.0/osm/{z}/{x}/{y}.jpg"})
};
goog.inherits(ol.source.MapQuestOSM, ol.source.XYZ);
ol.source.MapQuestOpenAerial = function() {
  var attributions = [new ol.Attribution("Tiles Courtesy of " + '<a href="http://www.mapquest.com/" target="_blank">MapQuest</a> ' + '<img src="http://developer.mapquest.com/content/osm/mq_logo.png">'), new ol.Attribution("Portions Courtesy NASA/JPL-Caltech and " + "U.S. Depart. of Agriculture, Farm Service Agency")];
  goog.base(this, {attributions:attributions, maxZoom:18, opaque:true, url:"http://oatile{1-4}.mqcdn.com/tiles/1.0.0/sat/{z}/{x}/{y}.jpg"})
};
goog.inherits(ol.source.MapQuestOpenAerial, ol.source.XYZ);
goog.provide("ol.source.OpenStreetMap");
goog.require("ol.Attribution");
goog.require("ol.source.XYZ");
ol.source.OpenStreetMap = function() {
  var attribution = new ol.Attribution('&copy; <a href="http://www.openstreetmap.org">OpenStreetMap</a> ' + "contributors, " + '<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC BY-SA</a>');
  goog.base(this, {attributions:[attribution], opaque:true, maxZoom:18, url:"http://{a-c}.tile.openstreetmap.org/{z}/{x}/{y}.png"})
};
goog.inherits(ol.source.OpenStreetMap, ol.source.XYZ);
goog.provide("ol.source.SingleImageWMS");
goog.require("ol.Extent");
goog.require("ol.Image");
goog.require("ol.ImageUrlFunction");
goog.require("ol.Size");
goog.require("ol.source.ImageSource");
ol.source.SingleImageWMS = function(options) {
  var imageUrlFunction = goog.isDef(options.url) ? ol.ImageUrlFunction.createWMSParams(options.url, options.params) : ol.ImageUrlFunction.nullImageUrlFunction;
  goog.base(this, {attributions:options.attributions, crossOrigin:options.crossOrigin, extent:options.extent, projection:options.projection, resolutions:options.resolutions, imageUrlFunction:imageUrlFunction});
  this.image_ = null;
  this.ratio_ = 1.5
};
goog.inherits(ol.source.SingleImageWMS, ol.source.ImageSource);
ol.source.SingleImageWMS.prototype.getImage = function(extent, resolution, projection) {
  resolution = this.findNearestResolution(resolution);
  var image = this.image_;
  if(!goog.isNull(image) && image.getResolution() == resolution && image.getExtent().containsExtent(extent)) {
    return image
  }
  extent = new ol.Extent(extent.minX, extent.minY, extent.maxX, extent.maxY);
  extent.scaleFromCenter(this.ratio_);
  var width = extent.getWidth() / resolution;
  var height = extent.getHeight() / resolution;
  var size = new ol.Size(width, height);
  this.image_ = this.createImage(extent, resolution, size, projection);
  return this.image_
};
goog.provide("ol.source.Stamen");
goog.require("ol.Attribution");
goog.require("ol.source.XYZ");
ol.source.StamenLayerConfig = {"terrain":{extension:"jpg", opaque:true}, "terrain-background":{extension:"jpg", opaque:true}, "terrain-labels":{extension:"png", opaque:false}, "terrain-lines":{extension:"png", opaque:false}, "toner-background":{extension:"png", opaque:true}, "toner":{extension:"png", opaque:true}, "toner-hybrid":{extension:"png", opaque:false}, "toner-labels":{extension:"png", opaque:false}, "toner-lines":{extension:"png", opaque:false}, "toner-lite":{extension:"png", opaque:true}, 
"watercolor":{extension:"jpg", opaque:true}};
ol.source.StamenProviderConfig = {"terrain":{minZoom:4, maxZoom:18}, "toner":{minZoom:0, maxZoom:20}, "watercolor":{minZoom:3, maxZoom:16}};
ol.source.Stamen = function(options) {
  var attribution = new ol.Attribution('Map tiles by <a href="http://stamen.com">Stamen Design</a>, ' + "under " + '<a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a>. ' + 'Data by <a href="http://openstreetmap.org">OpenStreetMap</a>, ' + "under " + '<a href="http://creativecommons.org/licenses/by-sa/3.0">CC BY SA</a>.');
  var i = options.layer.indexOf("-");
  var provider = i == -1 ? options.layer : options.layer.slice(0, i);
  goog.asserts.assert(provider in ol.source.StamenProviderConfig);
  var providerConfig = ol.source.StamenProviderConfig[provider];
  goog.asserts.assert(options.layer in ol.source.StamenLayerConfig);
  var layerConfig = ol.source.StamenLayerConfig[options.layer];
  var url = goog.isDef(options.url) ? options.url : "http://{a-d}.tile.stamen.com/" + options.layer + "/{z}/{x}/{y}." + layerConfig.extension;
  goog.base(this, {attributions:[attribution], maxZoom:providerConfig.maxZoom, opaque:layerConfig.opaque, url:url})
};
goog.inherits(ol.source.Stamen, ol.source.XYZ);
goog.provide("ol.source.StaticImage");
goog.require("ol.Image");
goog.require("ol.ImageUrlFunctionType");
goog.require("ol.source.ImageSource");
ol.source.StaticImage = function(options) {
  var imageFunction = ol.source.StaticImage.createImageFunction(options.url);
  var imageExtent = options.imageExtent;
  var imageSize = options.imageSize;
  var imageResolution = imageExtent.getHeight() / imageSize.height;
  var projection = goog.isDef(options.projection) ? options.projection : null;
  goog.base(this, {attributions:options.attributions, crossOrigin:options.crossOrigin, extent:options.extent, projection:options.projection, imageUrlFunction:imageFunction, resolutions:[imageResolution]});
  this.image_ = this.createImage(imageExtent, imageResolution, imageSize, projection)
};
goog.inherits(ol.source.StaticImage, ol.source.ImageSource);
ol.source.StaticImage.prototype.getImage = function(extent, resolution, projection) {
  if(extent.intersects(this.image_.getExtent())) {
    return this.image_
  }
  return null
};
ol.source.StaticImage.createImageFunction = function(url) {
  return function(extent, size, projection) {
    return url
  }
};
goog.provide("ol.source.TileJSON");
goog.provide("ol.tilejson");
goog.require("goog.asserts");
goog.require("goog.net.jsloader");
goog.require("ol.Attribution");
goog.require("ol.Extent");
goog.require("ol.TileCoord");
goog.require("ol.TileRange");
goog.require("ol.TileUrlFunction");
goog.require("ol.projection");
goog.require("ol.source.ImageTileSource");
goog.require("ol.tilegrid.XYZ");
ol.source.TileJSONOptions;
ol.tilejson.grids_ = [];
var grid = function(tileJSON) {
  ol.tilejson.grids_.push(tileJSON)
};
goog.exportSymbol("grid", grid);
ol.source.TileJSON = function(tileJsonOptions) {
  goog.base(this, {projection:ol.projection.getFromCode("EPSG:3857")});
  this.ready_ = false;
  this.deferred_ = goog.net.jsloader.load(tileJsonOptions.uri, {cleanupWhenDone:true});
  this.deferred_.addCallback(this.handleTileJSONResponse, this)
};
goog.inherits(ol.source.TileJSON, ol.source.ImageTileSource);
ol.source.TileJSON.prototype.handleTileJSONResponse = function() {
  var tileJSON = ol.tilejson.grids_.pop();
  var epsg4326Projection = ol.projection.getFromCode("EPSG:4326");
  var epsg4326Extent, extent;
  if(goog.isDef(tileJSON.bounds)) {
    var bounds = tileJSON.bounds;
    epsg4326Extent = new ol.Extent(bounds[0], bounds[1], bounds[2], bounds[3]);
    extent = epsg4326Extent.transform(ol.projection.getTransform(epsg4326Projection, this.getProjection()));
    this.setExtent(extent)
  }else {
    epsg4326Extent = null;
    extent = null
  }
  var scheme = goog.isDef(tileJSON.scheme) || "xyz";
  if(goog.isDef(tileJSON.scheme)) {
    goog.asserts.assert(tileJSON.scheme == "xyz")
  }
  var minZoom = tileJSON.minzoom || 0;
  goog.asserts.assert(minZoom === 0);
  var maxZoom = tileJSON.maxzoom || 22;
  var tileGrid = new ol.tilegrid.XYZ({maxZoom:maxZoom});
  this.tileGrid = tileGrid;
  this.tileUrlFunction = ol.TileUrlFunction.withTileCoordTransform(function(tileCoord) {
    if(tileCoord.z < minZoom || maxZoom < tileCoord.z) {
      return null
    }
    var n = 1 << tileCoord.z;
    var y = -tileCoord.y - 1;
    if(y < 0 || n <= y) {
      return null
    }
    var x = goog.math.modulo(tileCoord.x, n);
    if(!goog.isNull(extent)) {
      var tileExtent = tileGrid.getTileCoordExtent(new ol.TileCoord(tileCoord.z, x, tileCoord.y));
      if(!tileExtent.intersects(extent)) {
        return null
      }
    }
    return new ol.TileCoord(tileCoord.z, x, y)
  }, ol.TileUrlFunction.createFromTemplates(tileJSON.tiles));
  if(goog.isDef(tileJSON.attribution)) {
    var attributionExtent = goog.isNull(extent) ? epsg4326Projection.getExtent() : extent;
    var tileRanges = {};
    var z, zKey;
    for(z = minZoom;z <= maxZoom;++z) {
      zKey = z.toString();
      tileRanges[zKey] = [tileGrid.getTileRangeForExtentAndZ(attributionExtent, z)]
    }
    this.setAttributions([new ol.Attribution(tileJSON.attribution, tileRanges)])
  }
  this.ready_ = true;
  this.dispatchLoadEvent()
};
ol.source.TileJSON.prototype.isReady = function() {
  return this.ready_
};
goog.provide("ol.source.TiledWMS");
goog.require("goog.array");
goog.require("ol.Extent");
goog.require("ol.TileCoord");
goog.require("ol.TileUrlFunction");
goog.require("ol.source.ImageTileSource");
ol.source.TiledWMS = function(tiledWMSOptions) {
  var tileGrid;
  if(goog.isDef(tiledWMSOptions.tileGrid)) {
    tileGrid = tiledWMSOptions.tileGrid
  }
  var tileUrlFunction;
  if(tiledWMSOptions.urls) {
    var tileUrlFunctions = goog.array.map(tiledWMSOptions.urls, function(url) {
      return ol.TileUrlFunction.createWMSParams(url, tiledWMSOptions.params)
    });
    tileUrlFunction = ol.TileUrlFunction.createFromTileUrlFunctions(tileUrlFunctions)
  }else {
    if(tiledWMSOptions.url) {
      tileUrlFunction = ol.TileUrlFunction.createWMSParams(tiledWMSOptions.url, tiledWMSOptions.params)
    }else {
      tileUrlFunction = ol.TileUrlFunction.nullTileUrlFunction
    }
  }
  var transparent = goog.isDef(tiledWMSOptions.params["TRANSPARENT"]) ? tiledWMSOptions.params["TRANSPARENT"] : true;
  var extent = tiledWMSOptions.extent;
  var tileCoordTransform = function(tileCoord, tileGrid, projection) {
    if(tileGrid.getResolutions().length <= tileCoord.z) {
      return null
    }
    var x = tileCoord.x;
    var tileExtent = tileGrid.getTileCoordExtent(tileCoord);
    var projectionExtent = projection.getExtent();
    extent = goog.isDef(extent) ? extent : projectionExtent;
    if(extent.minX === projectionExtent.minX && extent.maxX === projectionExtent.maxX) {
      var numCols = Math.ceil((extent.maxX - extent.minX) / (tileExtent.maxX - tileExtent.minX));
      x = goog.math.modulo(x, numCols);
      tileExtent = tileGrid.getTileCoordExtent(new ol.TileCoord(tileCoord.z, x, tileCoord.y))
    }
    if(!tileExtent.intersects(extent)) {
      return null
    }
    return new ol.TileCoord(tileCoord.z, x, tileCoord.y)
  };
  goog.base(this, {attributions:tiledWMSOptions.attributions, crossOrigin:tiledWMSOptions.crossOrigin, extent:extent, tileGrid:tiledWMSOptions.tileGrid, opaque:!transparent, projection:tiledWMSOptions.projection, tileUrlFunction:ol.TileUrlFunction.withTileCoordTransform(tileCoordTransform, tileUrlFunction)})
};
goog.inherits(ol.source.TiledWMS, ol.source.ImageTileSource);
goog.provide("ol.sphere.WGS84");
goog.require("ol.Sphere");
ol.sphere.WGS84 = new ol.Sphere(6378137);
goog.require("ol");
goog.require("ol.AnchoredElement");
goog.require("ol.AnchoredElementPositioning");
goog.require("ol.AnchoredElementProperty");
goog.require("ol.Attribution");
goog.require("ol.BrowserFeature");
goog.require("ol.Collection");
goog.require("ol.CollectionEvent");
goog.require("ol.CollectionEventType");
goog.require("ol.Color");
goog.require("ol.Constraints");
goog.require("ol.Coordinate");
goog.require("ol.CoordinateFormatType");
goog.require("ol.Ellipsoid");
goog.require("ol.Extent");
goog.require("ol.FrameState");
goog.require("ol.Geolocation");
goog.require("ol.GeolocationProperty");
goog.require("ol.IView");
goog.require("ol.IView2D");
goog.require("ol.IView3D");
goog.require("ol.Image");
goog.require("ol.ImageState");
goog.require("ol.ImageTile");
goog.require("ol.ImageUrlFunction");
goog.require("ol.ImageUrlFunctionType");
goog.require("ol.Kinetic");
goog.require("ol.Map");
goog.require("ol.MapBrowserEvent");
goog.require("ol.MapBrowserEvent.EventType");
goog.require("ol.MapBrowserEventHandler");
goog.require("ol.MapEvent");
goog.require("ol.MapEventType");
goog.require("ol.MapProperty");
goog.require("ol.Object");
goog.require("ol.ObjectEventType");
goog.require("ol.Pixel");
goog.require("ol.PixelBounds");
goog.require("ol.PostRenderFunction");
goog.require("ol.PreRenderFunction");
goog.require("ol.Projection");
goog.require("ol.ProjectionUnits");
goog.require("ol.Rectangle");
goog.require("ol.RendererHint");
goog.require("ol.RendererHints");
goog.require("ol.ResolutionConstraint");
goog.require("ol.ResolutionConstraintType");
goog.require("ol.RotationConstraint");
goog.require("ol.RotationConstraintType");
goog.require("ol.Size");
goog.require("ol.Sphere");
goog.require("ol.Tile");
goog.require("ol.TileCache");
goog.require("ol.TileCoord");
goog.require("ol.TilePriorityFunction");
goog.require("ol.TileQueue");
goog.require("ol.TileRange");
goog.require("ol.TileState");
goog.require("ol.TileUrlFunction");
goog.require("ol.TileUrlFunctionType");
goog.require("ol.TransformFunction");
goog.require("ol.View");
goog.require("ol.View2D");
goog.require("ol.View2DProperty");
goog.require("ol.View2DState");
goog.require("ol.ViewHint");
goog.require("ol.animation");
goog.require("ol.array");
goog.require("ol.canvas");
goog.require("ol.control.Attribution");
goog.require("ol.control.Control");
goog.require("ol.control.ControlOptions");
goog.require("ol.control.DragBox");
goog.require("ol.control.MousePosition");
goog.require("ol.control.ScaleLine");
goog.require("ol.control.ScaleLineUnits");
goog.require("ol.control.Zoom");
goog.require("ol.dom");
goog.require("ol.dom.BrowserFeature");
goog.require("ol.easing");
goog.require("ol.ellipsoid.WGS84");
goog.require("ol.interaction.ConditionType");
goog.require("ol.interaction.DblClickZoom");
goog.require("ol.interaction.Drag");
goog.require("ol.interaction.DragPan");
goog.require("ol.interaction.DragRotate");
goog.require("ol.interaction.DragRotateAndZoom");
goog.require("ol.interaction.DragZoom");
goog.require("ol.interaction.Interaction");
goog.require("ol.interaction.Keyboard");
goog.require("ol.interaction.KeyboardPan");
goog.require("ol.interaction.KeyboardZoom");
goog.require("ol.interaction.MouseWheelZoom");
goog.require("ol.interaction.Touch");
goog.require("ol.interaction.TouchPan");
goog.require("ol.interaction.TouchRotate");
goog.require("ol.interaction.TouchZoom");
goog.require("ol.interaction.condition");
goog.require("ol.layer.ImageLayer");
goog.require("ol.layer.Layer");
goog.require("ol.layer.LayerProperty");
goog.require("ol.layer.LayerState");
goog.require("ol.layer.TileLayer");
goog.require("ol.math");
goog.require("ol.parser.XML");
goog.require("ol.parser.ogc.ExceptionReport");
goog.require("ol.parser.ogc.OWSCommon_v1");
goog.require("ol.parser.ogc.OWSCommon_v1_1_0");
goog.require("ol.parser.ogc.Versioned");
goog.require("ol.parser.ogc.WMSCapabilities");
goog.require("ol.parser.ogc.WMSCapabilities_v1");
goog.require("ol.parser.ogc.WMSCapabilities_v1_1");
goog.require("ol.parser.ogc.WMSCapabilities_v1_1_0");
goog.require("ol.parser.ogc.WMSCapabilities_v1_1_1");
goog.require("ol.parser.ogc.WMSCapabilities_v1_1_1_WMSC");
goog.require("ol.parser.ogc.WMSCapabilities_v1_3_0");
goog.require("ol.parser.ogc.WMTSCapabilities");
goog.require("ol.parser.ogc.WMTSCapabilities_v1_0_0");
goog.require("ol.projection");
goog.require("ol.projection.EPSG3857");
goog.require("ol.projection.EPSG4326");
goog.require("ol.projection.addCommonProjections");
goog.require("ol.renderer.Layer");
goog.require("ol.renderer.Map");
goog.require("ol.renderer.canvas.ImageLayer");
goog.require("ol.renderer.canvas.Layer");
goog.require("ol.renderer.canvas.Map");
goog.require("ol.renderer.canvas.SUPPORTED");
goog.require("ol.renderer.canvas.TileLayer");
goog.require("ol.renderer.dom.ImageLayer");
goog.require("ol.renderer.dom.Layer");
goog.require("ol.renderer.dom.Map");
goog.require("ol.renderer.dom.SUPPORTED");
goog.require("ol.renderer.dom.TileLayer");
goog.require("ol.renderer.webgl.FragmentShader");
goog.require("ol.renderer.webgl.ImageLayer");
goog.require("ol.renderer.webgl.Layer");
goog.require("ol.renderer.webgl.Map");
goog.require("ol.renderer.webgl.SUPPORTED");
goog.require("ol.renderer.webgl.TileLayer");
goog.require("ol.renderer.webgl.VertexShader");
goog.require("ol.renderer.webgl.map.shader");
goog.require("ol.renderer.webgl.tilelayerrenderer");
goog.require("ol.renderer.webgl.tilelayerrenderer.shader.Fragment");
goog.require("ol.renderer.webgl.tilelayerrenderer.shader.Vertex");
goog.require("ol.source.BingMaps");
goog.require("ol.source.DebugTileSource");
goog.require("ol.source.ImageSource");
goog.require("ol.source.ImageTileSource");
goog.require("ol.source.ImageTileSourceOptions");
goog.require("ol.source.MapQuestOSM");
goog.require("ol.source.MapQuestOpenAerial");
goog.require("ol.source.OpenStreetMap");
goog.require("ol.source.SingleImageWMS");
goog.require("ol.source.Source");
goog.require("ol.source.Stamen");
goog.require("ol.source.StaticImage");
goog.require("ol.source.TileJSON");
goog.require("ol.source.TileSource");
goog.require("ol.source.TileSourceOptions");
goog.require("ol.source.TiledWMS");
goog.require("ol.source.XYZ");
goog.require("ol.source.XYZOptions");
goog.require("ol.source.wms");
goog.require("ol.sphere.NORMAL");
goog.require("ol.sphere.WGS84");
goog.require("ol.structs.LRUCache");
goog.require("ol.tilegrid.TileGrid");
goog.require("ol.tilegrid.XYZ");
goog.require("ol.tilejson");
goog.require("ol.vec.Mat4");
goog.require("ol.webgl");
goog.require("ol.webgl.WebGLContextEventType");
goog.provide("ol.AnchoredElementOptionsType");
goog.provide("ol.MapOptionsType");
goog.provide("ol.View2DOptionsType");
goog.provide("ol.animation.BounceOptionsType");
goog.provide("ol.animation.PanOptionsType");
goog.provide("ol.animation.RotateOptionsType");
goog.provide("ol.animation.ZoomOptionsType");
goog.provide("ol.control.AttributionOptionsType");
goog.provide("ol.control.MousePositionOptionsType");
goog.provide("ol.control.ScaleLineOptionsType");
goog.provide("ol.control.ZoomOptionsType");
goog.provide("ol.layer.LayerOptionsType");
goog.provide("ol.source.BingMapsOptionsType");
goog.provide("ol.source.DebugTileSourceOptionsType");
goog.provide("ol.source.SingleImageWMSOptionsType");
goog.provide("ol.source.StamenOptionsType");
goog.provide("ol.source.StaticImageOptionsType");
goog.provide("ol.source.TiledWMSOptionsType");
goog.provide("ol.tilegrid.TileGridOptionsType");
goog.provide("ol.tilegrid.XYZOptionsType");
ol.AnchoredElementOptions;
ol.MapOptions;
ol.View2DOptions;
ol.animation.BounceOptions;
ol.animation.PanOptions;
ol.animation.RotateOptions;
ol.animation.ZoomOptions;
ol.control.AttributionOptions;
ol.control.MousePositionOptions;
ol.control.ScaleLineOptions;
ol.control.ZoomOptions;
ol.layer.LayerOptions;
ol.source.BingMapsOptions;
ol.source.DebugTileSourceOptions;
ol.source.SingleImageWMSOptions;
ol.source.StamenOptions;
ol.source.StaticImageOptions;
ol.source.TiledWMSOptions;
ol.tilegrid.TileGridOptions;
ol.tilegrid.XYZOptions;

