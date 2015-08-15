!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var t;t="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof self?self:this,t.tusk=e()}}(function(){return function e(t,n,r){function i(s,l){if(!n[s]){if(!t[s]){var a="function"==typeof require&&require;if(!l&&a)return a(s,!0);if(o)return o(s,!0);var u=new Error("Cannot find module '"+s+"'");throw u.code="MODULE_NOT_FOUND",u}var h=n[s]={exports:{}};t[s][0].call(h.exports,function(e){var n=t[s][1][e];return i(n?n:e)},h,h.exports,e,t,n,r)}return n[s].exports}for(var o="function"==typeof require&&require,s=0;s<r.length;s++)i(r[s]);return i}({1:[function(e,t,n){t.exports={NODE:"__node__",NAMESPACES:{HTML:"http://www.w3.org/1999/xhtml",MATH_ML:"http://www.w3.org/1998/Math/MathML",SVG:"http://www.w3.org/2000/svg"},SELF_CLOSING:["area","base","br","col","command","embed","hr","img","input","keygen","link","meta","param","source","track","wbr"],EVENTS:["animationend","animationiteration","animationstart","beforeunload","blur","canplay","canplaythrough","change","click","contextmenu","copy","cut","dblclick","drag","dragend","dragenter","dragexit","dragleave","dragover","dragstart","drop","durationchange","emptied","ended","focus","fullscreenchange","input","keydown","keypress","keyup","mousedown","mouseenter","mouseleave","mousemove","mouseout","mouseover","mouseup","paste","pause","play","playing","progress","ratechange","reset","scroll","seeked","seeking","select","stalled","submit","suspend","timeupdate","touchcancel","touchend","touchmove","touchstart","transitionend","visibilitychange","volumechange","waiting","wheel"]}},{}],2:[function(e,t,n){var r,i,o,s;s=e("./constants"),i=s.NODE,r=s.EVENTS,o=function(e){var t,n,r,o,s,l;if(s=e.target,l=e.type,l=l.toLowerCase(),e.bubbles)for(e.stopPropagation=function(){return e.cancelBubble=!0},Object.defineProperty(e,"currentTarget",{value:s,writable:!0});s&&(e.currentTarget=s,r=s[i],s=s.parentNode,null!=r&&"function"==typeof(n=r.events)[l]&&n[l](e),!e.cancelBubble););else null!=(o=s[i])&&"function"==typeof(t=o.events)[l]&&t[l](e)},t.exports={dispatch:function(e,t,n){var r;null==n&&(n=!1),r=document.createEvent("Event"),r.initEvent(e,n,!1),Object.defineProperties(r,{target:{value:t},srcElement:{value:t}}),o(r)},init:function(){var e,t,n;if(!document.__tusk){for(e=0,t=r.length;t>e;e++)n=r[e],document.addEventListener(n,o,!0);document.__tusk=!0}}}},{"./constants":1}],3:[function(e,t,n){var r,i,o,s,l,a,u,h,c;i=e("./virtual/node"),r=e("./constants").NODE,u=e("./util"),l=u.flattenInto,a=u.getDiff,s=e("./delegator"),h=void 0,o=function(e,t){var n,r,s,l;if(e)switch(e.constructor){case Array:for(l=[],r=0,s=e.length;s>r;r++)n=e[r],l.push(o(n,t));return l;case i:return e.owner=t,e;default:return e}},c=function(e,t){var n,r;for(r=Math.max(arguments.length-2,0),n=new Array(r);r--;)n[r]=arguments[r+2];switch(n=l(n,[]),typeof e){case"string":return new i(e,t,n);case"function":return o(e(t,n,h),e);default:throw new TypeError("Tusk: Invalid virtual node type.")}},c.createElement=c,c.render=function(e,t){var n,i,o,l,u,h;if("undefined"==typeof window)throw new Error("Tusk: Cannot render on the server (use toString).");if(!(e instanceof window.Node))throw new Error("Tusk: Container must be a DOM element.");if(!(null!=t?t.isTusk:void 0))throw new Error("Tusk: Can only render a virtual node.");(null!=(l=e[r])?l.update(t):void 0)||(o=e.outerHTML,i=t.toString(),i===o?t.mount(e):(e.parentNode.replaceChild(t.create(),e),null!=o&&(u=a(o,i),h=u[0],n=u[1],console.warn("Tusk: Could not bootstrap document, existing html and virtual html do not match.\n\nServer:\n"+h+"\n\nClient:\n"+n))),s.init())},c["with"]=function(e,t){var n;return h=e,n="function"==typeof t?t():void 0,h=void 0,n},t.exports=c},{"./constants":1,"./delegator":2,"./util":4,"./virtual/node":5}],4:[function(e,t,n){var r;t.exports={escapeHTML:function(e){return String(e).replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/'/g,"&#39;").replace(/</g,"&lt;").replace(/>/g,"&gt;")},flattenInto:r=function(e,t){var n,i,o;for(i=0,o=e.length;o>i;i++)n=e[i],n instanceof Array?r(n,t):t.push(n);return t},getDiff:function(e,t){var n,r,i,o,s,l;for(i=o=0,s=e.length;s>o&&(n=e[i],n===t[i]);i=++o);return l=Math.max(0,i-20),r=l+80,[e.slice(l,Math.min(r,e.length)),t.slice(l,Math.min(r,t.length))]},setAttrs:function(e,t,n){var r,i;if(t!==n){for(r in n)i=n[r],null!=i&&i!==t[r]&&e.setAttribute(r,i);for(r in t)!r in n&&e.removeAttribute(r)}},setChildren:function(e,t,n){var r,i,o;if(t!==n){for(i in n){if(r=n[i],i in t){if((o=t[i]).update(r),o.index===r.index)continue}else r.create();e.insertBefore(r._elem,e.childNodes[r.index])}for(i in t)r=t[i],i in n||r.remove()}}}},{}],5:[function(e,t,n){var r,i,o,s,l,a,u,h,c,d,f,p,m=[].indexOf||function(e){for(var t=0,n=this.length;n>t;t++)if(t in this&&this[t]===e)return t;return-1};c=e("../constants"),s=c.SELF_CLOSING,i=c.NODE,r=c.NAMESPACES,d=e("../util"),u=d.escapeHTML,f=d.setAttrs,p=d.setChildren,a=e("../delegator").dispatch,l=e("./text"),h=function(e,t,n,r){var i,o,s,a;if(null==e&&(e=" "),e.constructor===Array)for(o=s=0,a=e.length;a>s;o=++s)i=e[o],h(i,t,n,r+o);else e.isTusk||(e=new l(e)),e.index=r,null==e.namespaceURI&&(e.namespaceURI=t),n[e.key||r]=e;return n},o=function(e,t,n){var i,o,l;if(this.type=e,this.namespaceURI="svg"===this.type?r.SVG:"math"===this.type?r.MATH_ML:void 0,this.attrs={},this.events={},this.children={},null!=t){this.key=t.key,delete t.key,this.innerHTML=t.innerHTML,delete t.innerHTML;for(i in t)l=t[i],"on"!==i.slice(0,2)?this.attrs[i]=l:this.events[i.slice(2).toLowerCase()]=l}null!=this.innerHTML||(o=this.type,m.call(s,o)>=0)||h(n,this.namespaceURI,this.children,0)},o.prototype.isTusk=!0,o.prototype.mount=function(e){var t,n,r,o;if(this._elem=(n=e.childNodes,e),e[i]=this,null==this.innerHTML){o=this.children;for(r in o)t=o[r],t.mount(n[t.index||r])}a("mount",e)},o.prototype.create=function(){var e,t,n,o;return n=null!=this._elem?this._elem:this._elem=document.createElementNS(this.namespaceURI||r.HTML,this.type),o=n[i],n[i]=this,o?(e=o.attrs,t=o.children):e=t={},f(n,e,this.attrs),null!=this.innerHTML?n.innerHTML=this.innerHTML:p(n,t,this.children),a("mount",n),n},o.prototype.update=function(e){var t;if(this===e)return this;if(this.type!==e.type)this._elem.parentNode.insertBefore(e.create(),this._elem),this.remove();else{if(t=this.owner!==e.owner,t&&a("dismount",this._elem),this._elem[i]=e,e._elem=this._elem,f(this._elem,this.attrs,e.attrs),null!=e.innerHTML)this.innerHTML!==e.innerHTML&&(this._elem.innerHTML=e.innerHTML);else{if(null!=this.innerHTML)for(;this._elem.firstChild;)this._elem.removeChild(this._elem.firstChild);p(this._elem,this.children,e.children)}t&&a("mount",this._elem)}return e},o.prototype.remove=function(){var e,t,n;a("dismount",this._elem),n=this.children;for(t in n)e=n[t],e.remove();return this._elem.parentNode.removeChild(this._elem)},o.prototype.toString=function(){var e,t,n,r,i,o,l,a;e=n="",i=this.attrs;for(r in i)a=i[r],e+=" "+r+'="'+u(a)+'"';if(null!=this.innerHTML)n=this.innerHTML;else{o=this.children;for(r in o)t=o[r],n+=t}return l=this.type,m.call(s,l)>=0?"<"+(this.type+e)+">":"<"+(this.type+e)+">"+n+"</"+this.type+">"},t.exports=o},{"../constants":1,"../delegator":2,"../util":4,"./text":6}],6:[function(e,t,n){var r,i;i=e("../util").escapeHTML,r=function(e){this.value=String(e)},r.prototype.isTusk=!0,r.prototype.mount=function(e){var t;this._elem=(t=e.nodeValue,e),this.value!==t&&e.splitText(t.indexOf(this.value)+this.value.length)},r.prototype.create=function(){return null==this._elem&&(this._elem=document.createTextNode(this.value)),this._elem.nodeValue!==this.value&&(this._elem.nodeValue=this.value),this._elem},r.prototype.update=function(e){return this===e?this:(e.constructor===r?(e._elem=this._elem,this.value!==e.value&&(this._elem.nodeValue=e.value)):this._elem.parentNode.replaceChild(e.create(),this._elem),e)},r.prototype.remove=function(){return this._elem.parentNode.removeChild(this._elem)},r.prototype.toString=function(){return i(this.value)},t.exports=r},{"../util":4}]},{},[3])(3)});