/// <reference no-default-lib="true"/>
/// <reference path="../types/base/index.d.ts" />
/// <reference path="../types/lib/index.d.ts" />
type _EventTargetEx = typeof EventTarget;
interface EventTargetEx extends _EventTargetEx {
  vimiumRemoveHooks: (this: void) => void;
}
declare var browser: unknown;
var VimiumInjector: VimiumInjector | undefined | null;
(function(injectorBuilder: (scriptSrc: string) => VimiumInjector["reload"]) {
  let runtime = (typeof browser !== "undefined" && browser &&
    !((browser as typeof chrome | Element) instanceof Element) ? browser as typeof chrome : chrome).runtime;
  const curEl = document.currentScript as HTMLScriptElement, scriptSrc = curEl.src, i = scriptSrc.indexOf("://") + 3,
  extHost = scriptSrc.substring(i, scriptSrc.indexOf("/", i)), onIdle = window.requestIdleCallback;
  let tick = 1;
function handler(this: void, res: ExternalMsgs[kFgReq.inject]["res"] | undefined | false): void {
  type LastError = chrome.runtime.LastError;
  let str: string | undefined, noBackend: boolean, err = runtime.lastError as void | LastError;
  if (!res) {
    const msg: string | void = err && err.message,
    host = runtime.id || location.host || location.protocol;
    noBackend = !!(msg && msg.lastIndexOf("not exist") >= 0 && runtime.id);
    if (res === false) { // disabled
      str = ": not in the white list.";
    } else if (!noBackend && err) {
      str = msg ? `:\n\t${msg}` : ": no backend found.";
    } else if (tick > 3) {
      str = msg ? `:\n\t${msg}` : `: retried but failed (${res}).`;
      noBackend = false;
    } else {
      setTimeout(call, 200 * tick);
      tick++;
      noBackend = true;
    }
    if (!noBackend) {
      console.log("%cVimium C%c: %cfail%c to inject into %c%s%c %s"
        , "color:red", "color:auto", "color:red", "color:auto", "color:#0c85e9"
        , host, "color:auto", str ? str : ` (${tick} retries).`);
    }
  }
  if (VimiumInjector && typeof VimiumInjector.destroy === "function") {
    VimiumInjector.destroy(true);
  }

  VimiumInjector = {
    id: extHost,
    alive: 0,
    version: res ? res.version : "",
    reload: injectorBuilder(scriptSrc),
    checkIfEnabled: null as never,
    getCommandCount: null as never,
    destroy: null
  };
  const docEl = document.documentElement;
  if (!res || !docEl) {
    return err as void;
  }
  const inserAfter = document.contains(curEl) ? curEl : (document.head || docEl).lastChild as Node
    , insertBefore = inserAfter.nextSibling
    , parentElement = inserAfter.parentElement as Element;
  let scripts: HTMLScriptElement[] = [];
  for (const i of res.scripts) {
    const scriptElement = document.createElement("script");
    scriptElement.async = false;
    scriptElement.src = i;
    parentElement.insertBefore(scriptElement, insertBefore);
    scripts.push(scriptElement);
  }
  scripts.length > 0 && (scripts[scripts.length - 1].onload = function(): void {
    this.onload = null as never;
    for (let i = scripts.length; 0 <= --i; ) { scripts[i].remove(); }
  });
}
function call() {
  runtime.sendMessage(extHost, <ExternalMsgs[kFgReq.inject]["req"]> { handler: kFgReq.inject }, handler);
}
function start() {
  removeEventListener("load", start);
  onIdle && !(onIdle instanceof Element) ? onIdle(function() {
    onIdle(function() { setTimeout(call, 0); }, {timeout: 67});
  }, {timeout: 330}) : setTimeout(call, 67);
}
if (document.readyState === "complete") {
  start();
} else {
  addEventListener("load", start);
}
})(function(scriptSrc): VimiumInjector["reload"] {
  return function(async): void {
    function inject(): void {
      if (VimiumInjector && typeof VimiumInjector.destroy === "function") {
        VimiumInjector.destroy(true);
      }
      const docEl = document.documentElement as HTMLHtmlElement | null;
      if (!docEl) { return; }
      const script = document.createElement('script');
      script.type = "text/javascript";
      script.src = scriptSrc;
      (document.head || document.body || docEl).appendChild(script);
    }
    async === true ? setTimeout(inject, 200) : inject();
  };
});

(!document.currentScript || ((document.currentScript as HTMLScriptElement).getAttribute("data-vimium-hooks") || "").toLowerCase() != "false") &&
(function(): void {
type ListenerEx = EventTarget["addEventListener"] & { vimiumHooked?: boolean; }

const obj = EventTarget as EventTargetEx, cls = obj.prototype, _listen = cls.addEventListener as ListenerEx;
if (_listen.vimiumHooked === true) { return; }

const HA = HTMLAnchorElement, E = Element;

const newListen: ListenerEx = cls.addEventListener =
function addEventListener(this: EventTarget, type: string, listener: EventListenerOrEventListenerObject) {
  if (type === "click" && !(this instanceof HA) && listener && this instanceof E) {
    (this as Element).vimiumHasOnclick = true;
  }
  const args = arguments, len = args.length;
  return len === 2 ? _listen.call(this, type, listener) : len === 3 ? _listen.call(this, type, listener, args[2])
    : _listen.apply(this, args);
},
funcCls = Function.prototype, funcToString = funcCls.toString,
newToString = funcCls.toString = function toString(this: Function): string {
  return funcToString.apply(this === newListen ? _listen : this === newToString ? funcToString : this, arguments);
};
newListen.vimiumHooked = true;
obj.vimiumRemoveHooks = function() {
  delete obj.vimiumRemoveHooks;
  cls.addEventListener === newListen && (cls.addEventListener = _listen);
  funcCls.toString === newToString && (funcCls.toString = funcToString);
};
newListen.prototype = newToString.prototype = void 0;
})();
