/*! Universal RSVP Reader v1.0.0 | MIT | inclut markdown-it (MIT) */
// \0rolldown/runtime.js
var e = Object.defineProperty, t = (t, n) => {
	let r = {};
	for (var i in t) e(r, i, {
		get: t[i],
		enumerable: !0
	});
	return n || e(r, Symbol.toStringTag, { value: "Module" }), r;
}, n = class {
	listeners = /* @__PURE__ */ new Map();
	on(e, t) {
		let n = this.listeners.get(e);
		return n || (n = /* @__PURE__ */ new Set(), this.listeners.set(e, n)), n.add(t), () => this.off(e, t);
	}
	off(e, t) {
		let n = this.listeners.get(e);
		n && (n.delete(t), n.size === 0 && this.listeners.delete(e));
	}
	emit(e, t, n) {
		let r = this.listeners.get(e);
		if (r) for (let e of [...r]) try {
			e(t);
		} catch (e) {
			n ? n(e) : queueMicrotask(() => {
				throw e;
			});
		}
	}
	listenerCount(e) {
		if (e !== void 0) return this.listeners.get(e)?.size ?? 0;
		let t = 0;
		for (let e of this.listeners.values()) t += e.size;
		return t;
	}
	clear() {
		this.listeners.clear();
	}
};
// src/core/freeze.ts
function r(e) {
	if (e && typeof e == "object" && !Object.isFrozen(e)) {
		Object.freeze(e);
		for (let t of Reflect.ownKeys(e)) r(e[t]);
	}
	return e;
}
// src/core/settings.ts
var i = Object.freeze({
	min: 150,
	max: 900,
	step: 25,
	default: 250
}), a = Object.freeze({
	min: 24,
	max: 96,
	step: 2,
	default: 48
}), o = Object.freeze({
	min: 5,
	max: 600,
	step: 5,
	default: 60
}), s = r({
	comma: {
		min: 1,
		max: 4,
		step: .05,
		default: 1.5
	},
	clause: {
		min: 1,
		max: 5,
		step: .05,
		default: 1.75
	},
	sentence: {
		min: 1,
		max: 6,
		step: .05,
		default: 2.25
	},
	paragraph: {
		min: 1,
		max: 8,
		step: .05,
		default: 3
	},
	longWordThreshold: {
		min: 4,
		max: 20,
		step: 1,
		default: 8
	},
	longWordStep: {
		min: 0,
		max: .25,
		step: .01,
		default: .05
	},
	longWordMaxExtra: {
		min: 0,
		max: 2,
		step: .05,
		default: .5
	}
}), c = r({
	light: Object.freeze({
		comma: 1.2,
		clause: 1.4,
		sentence: 1.6,
		paragraph: 2,
		longWordThreshold: 10,
		longWordStep: .03,
		longWordMaxExtra: .3
	}),
	normal: Object.freeze({
		comma: 1.5,
		clause: 1.75,
		sentence: 2.25,
		paragraph: 3,
		longWordThreshold: 8,
		longWordStep: .05,
		longWordMaxExtra: .5
	}),
	strong: Object.freeze({
		comma: 1.8,
		clause: 2.2,
		sentence: 2.8,
		paragraph: 4,
		longWordThreshold: 7,
		longWordStep: .08,
		longWordMaxExtra: .8
	})
}), l = r({
	comfort: Object.freeze({
		speed: 200,
		timingLevel: "strong"
	}),
	standard: Object.freeze({
		speed: 250,
		timingLevel: "normal"
	}),
	fast: Object.freeze({
		speed: 400,
		timingLevel: "light"
	})
}), u = Object.freeze([
	"sans",
	"serif",
	"mono",
	"readable"
]), d = Object.freeze([
	"auto",
	"light",
	"dark"
]), f = Object.freeze([
	"comfort",
	"standard",
	"fast",
	"custom"
]), p = Object.freeze([
	"light",
	"normal",
	"strong"
]), m = "#d32f2f", h = Object.freeze({
	enabled: !1,
	startSpeed: 250,
	targetSpeed: 400,
	duration: o.default,
	curve: "linear"
}), g = Object.freeze({
	orpColor: m,
	fontSize: a.default,
	fontFamily: "sans",
	showGuides: !0,
	theme: "auto"
});
function _(e) {
	return typeof e == "number" && Number.isFinite(e) ? e : void 0;
}
function v(e, t) {
	let n = _(e);
	if (n === void 0) return t.default;
	let r = Math.min(t.max, Math.max(t.min, n));
	return t.step && (r = t.min + Math.round((r - t.min) / t.step) * t.step, r = Math.min(t.max, r), r = Number(r.toFixed(4))), r;
}
function y(e) {
	return v(e, i);
}
function b(e, t = m) {
	if (typeof e != "string") return t;
	let n = e.trim().toLowerCase();
	if (/^#[0-9a-f]{6}$/.test(n)) return n;
	let r = /^#([0-9a-f])([0-9a-f])([0-9a-f])$/.exec(n);
	return r ? `#${r[1]}${r[1]}${r[2]}${r[2]}${r[3]}${r[3]}` : t;
}
function x(e, t, n) {
	return typeof e == "string" && t.includes(e) ? e : n;
}
function S(e) {
	return typeof e == "object" && !!e && !Array.isArray(e);
}
function C(e, t = c.normal) {
	let n = S(e) ? e : {}, r = {};
	for (let e of Object.keys(s)) {
		let i = s[e];
		r[e] = v(e in n ? n[e] : t[e], {
			...i,
			default: t[e]
		});
	}
	return r;
}
function ee(e, t = h) {
	let n = S(e) ? e : {}, r = v(n.startSpeed ?? t.startSpeed, {
		...i,
		default: t.startSpeed
	}), a = Math.max(r, v(n.targetSpeed ?? t.targetSpeed, {
		...i,
		default: t.targetSpeed
	}));
	return {
		enabled: typeof n.enabled == "boolean" ? n.enabled : t.enabled,
		startSpeed: r,
		targetSpeed: a,
		duration: v(n.duration ?? t.duration, {
			...o,
			default: t.duration
		}),
		curve: x(n.curve, ["linear", "ease-in-out"], t.curve)
	};
}
function te(e, t = g) {
	let n = S(e) ? e : {};
	return {
		orpColor: b(n.orpColor, t.orpColor),
		fontSize: v(n.fontSize ?? t.fontSize, {
			...a,
			default: t.fontSize
		}),
		fontFamily: x(n.fontFamily, u, t.fontFamily),
		showGuides: typeof n.showGuides == "boolean" ? n.showGuides : t.showGuides,
		theme: x(n.theme, d, t.theme)
	};
}
function ne(e) {
	for (let t of p) {
		let n = c[t];
		if (Object.keys(n).every((t) => n[t] === e[t])) return t;
	}
	return "custom";
}
function re(e, t = g, n = h) {
	let r = l[e];
	return {
		profile: e,
		speed: r.speed,
		timingLevel: r.timingLevel,
		timing: { ...c[r.timingLevel] },
		acceleration: {
			...n,
			enabled: !1
		},
		appearance: { ...t }
	};
}
function w() {
	return re("standard");
}
function ie(e, t) {
	let n = l[t];
	return e.timingLevel === n.timingLevel && !e.acceleration.enabled;
}
function ae(e) {
	let t = S(e) ? e : {}, n = x(t.profile, f, "standard"), r = n === "custom" ? w() : re(n), a = x(t.timingLevel, [...p, "custom"], r.timingLevel), o = a === "custom" ? r.timing : c[a], s = C(t.timing, o), l = {
		profile: n,
		speed: v(t.speed ?? r.speed, {
			...i,
			default: r.speed
		}),
		timingLevel: ne(s),
		timing: s,
		acceleration: ee(t.acceleration),
		appearance: te(t.appearance)
	};
	return l.profile !== "custom" && !ie(l, l.profile) && (l.profile = "custom"), l;
}
function T(e, t) {
	return JSON.stringify(e) === JSON.stringify(t);
}
function oe(e, t) {
	let n = se(e), r = S(t) ? t : {};
	if (r.profile !== void 0) {
		let t = x(r.profile, f, e.profile);
		t === "custom" ? n.profile = "custom" : n = re(t, n.appearance, n.acceleration);
	}
	let i = !1;
	if (r.timingLevel !== void 0) {
		let e = { ...c[x(r.timingLevel, p, "normal")] };
		T(e, n.timing) || (i = !0), n.timing = e;
	}
	if (r.timing !== void 0) {
		let e = C({
			...n.timing,
			...r.timing
		}, n.timing);
		T(e, n.timing) || (i = !0), n.timing = e;
	}
	if (n.timingLevel = ne(n.timing), r.acceleration !== void 0) {
		let e = ee({
			...n.acceleration,
			...r.acceleration
		}, n.acceleration);
		T(e, n.acceleration) || (i = !0), n.acceleration = e;
	}
	i && n.profile !== "custom" && (n.profile = "custom"), r.speed !== void 0 && (n.speed = y(r.speed)), r.appearance !== void 0 && (n.appearance = te({
		...n.appearance,
		...r.appearance
	}, n.appearance));
	let a = [];
	return n.profile !== e.profile && a.push("profile"), n.speed !== e.speed && a.push("speed"), T(n.timing, e.timing) || a.push("timing"), T(n.acceleration, e.acceleration) || a.push("acceleration"), T(n.appearance, e.appearance) || a.push("appearance"), {
		settings: n,
		changed: a
	};
}
function se(e) {
	return {
		profile: e.profile,
		speed: e.speed,
		timingLevel: e.timingLevel,
		timing: { ...e.timing },
		acceleration: { ...e.acceleration },
		appearance: { ...e.appearance }
	};
}
// src/core/acceleration.ts
function ce(e, t) {
	let n = Math.min(1, Math.max(0, t / (e.duration * 1e3)));
	return e.curve === "ease-in-out" ? n * n * (3 - 2 * n) : n;
}
function le(e, t) {
	let n = e.startSpeed + (e.targetSpeed - e.startSpeed) * ce(e, t);
	return Math.min(i.max, Math.max(i.min, Math.round(n)));
}
// src/core/timing.ts
function ue(e) {
	return 6e4 / e;
}
function de(e, t) {
	let n = 1;
	return e.punctuation === "comma" ? n = t.comma : e.punctuation === "clause" && (n = t.clause), (e.endsSentence || e.punctuation === "sentence") && (n = Math.max(n, t.sentence)), e.endsBlock && (n = Math.max(n, t.paragraph)), n;
}
function fe(e, t) {
	return e <= t.longWordThreshold ? 1 : 1 + Math.min(t.longWordMaxExtra, (e - t.longWordThreshold) * t.longWordStep);
}
function pe(e, t) {
	return de(e, t) * fe(e.letterCount, t);
}
function me(e, t, n) {
	return ue(t) * pe(e, n);
}
// src/core/engine.ts
var he = { now: () => typeof performance < "u" && typeof performance.now == "function" ? performance.now() : Date.now() }, ge = {
	set: (e, t) => setTimeout(e, t),
	clear: (e) => clearTimeout(e)
}, _e = class {
	clock;
	timer;
	maxLagMs;
	events = new n();
	doc = null;
	status = "idle";
	index = -1;
	config;
	manualSpeed;
	handle = null;
	wordShownAt = 0;
	deadline = 0;
	rampActive = !1;
	rampElapsed = 0;
	rampSegmentStart = 0;
	destroyed = !1;
	constructor(e = {}) {
		let t = w();
		this.clock = e.clock ?? he, this.timer = e.timer ?? ge, this.maxLagMs = e.maxLagMs ?? 250, this.config = {
			speed: y(e.speed ?? t.speed),
			timing: { ...e.timing ?? t.timing },
			acceleration: { ...e.acceleration ?? t.acceleration }
		}, this.manualSpeed = this.config.speed;
	}
	on(e, t) {
		return this.events.on(e, t);
	}
	load(e, t = 0) {
		this.destroyed || (this.stopTimer(), this.doc = e, this.manualSpeed = this.config.speed, this.resetRamp(), e.words.length === 0 ? (this.index = -1, this.setStatus("idle")) : (this.index = this.clampIndex(Number.isFinite(t) ? Math.trunc(t) : 0), this.setStatus("ready"), this.doc === e && !this.destroyed && this.emitPosition()));
	}
	unload() {
		this.stopTimer(), this.doc = null, this.index = -1, this.setStatus("idle");
	}
	getDocument() {
		return this.doc;
	}
	currentWord() {
		return this.doc?.words[this.index] ?? null;
	}
	play() {
		if (!this.doc || this.status === "idle" || this.status === "playing") return;
		let e = this.status === "complete";
		e && (this.index = 0, this.resetRamp()), this.startPlaying(), e && this.doc && !this.destroyed && this.emitPosition();
	}
	resume() {
		(this.status === "paused" || this.status === "ready") && this.startPlaying();
	}
	pause(e = "api") {
		this.status === "playing" && (this.accumulateRamp(), this.stopTimer(), this.setStatus("paused", e));
	}
	toggle(e = "api") {
		this.status === "playing" ? this.pause(e) : this.play();
	}
	seek(e) {
		if (!this.doc || this.status === "idle" || !Number.isFinite(e)) return;
		let t = this.clampIndex(Math.trunc(e));
		this.status === "playing" ? (this.stopTimer(), this.index = t, this.showCurrent(this.clock.now()), this.emitPosition()) : (this.index = t, (this.status === "ready" || this.status === "complete") && this.setStatus("paused"), this.emitPosition());
	}
	nextWord() {
		this.seek(this.index + 1);
	}
	previousWord() {
		this.seek(this.index - 1);
	}
	nextSentence() {
		let e = this.doc, t = this.currentWord();
		if (!e || !t) return;
		let n = e.sentences[t.sentenceIndex + 1];
		this.seek(n ? n.wordStart : e.words.length - 1);
	}
	previousSentence() {
		let e = this.doc, t = this.currentWord();
		if (!e || !t) return;
		let n = e.sentences[t.sentenceIndex];
		this.index > n.wordStart ? this.seek(n.wordStart) : this.seek(e.sentences[t.sentenceIndex - 1]?.wordStart ?? 0);
	}
	setSpeed(e) {
		let t = y(e);
		return this.accumulateRamp(), this.rampActive = !1, this.manualSpeed = t, this.config.speed = t, this.reschedule(), this.events.emit("speed", {
			speed: t,
			source: "manual"
		}), t;
	}
	configure(e) {
		let t = !1;
		e.timing && (this.config.timing = { ...e.timing }), e.acceleration && (t = JSON.stringify(e.acceleration) !== JSON.stringify(this.config.acceleration), this.config.acceleration = { ...e.acceleration }), e.speed !== void 0 && (this.config.speed = y(e.speed), this.rampActive || (this.manualSpeed = this.config.speed)), t && (this.manualSpeed = this.config.speed, this.resetRamp()), this.reschedule(), this.events.emit("speed", {
			speed: this.getSpeed(),
			source: "settings"
		});
	}
	getConfig() {
		return {
			speed: this.config.speed,
			timing: { ...this.config.timing },
			acceleration: { ...this.config.acceleration }
		};
	}
	getSpeed() {
		return this.rampActive ? le(this.config.acceleration, this.rampElapsedNow()) : this.manualSpeed;
	}
	getSnapshot() {
		let e = this.doc?.words.length ?? 0, t = this.currentWord();
		return {
			status: this.status,
			index: this.index,
			total: e,
			progress: e === 0 ? 0 : this.status === "complete" ? 1 : Math.max(0, this.index) / e,
			sentenceIndex: t?.sentenceIndex ?? -1,
			blockIndex: t?.blockIndex ?? -1,
			speed: this.getSpeed(),
			accelerating: this.rampActive
		};
	}
	currentWordDuration() {
		let e = this.currentWord();
		return e ? me(e, this.getSpeed(), this.config.timing) : 0;
	}
	destroy() {
		this.destroyed || (this.stopTimer(), this.doc = null, this.index = -1, this.status = "idle", this.destroyed = !0, this.events.clear());
	}
	get isDestroyed() {
		return this.destroyed;
	}
	get pendingTimers() {
		return this.handle === null ? 0 : 1;
	}
	currentStatus() {
		return this.status;
	}
	clampIndex(e) {
		let t = this.doc?.words.length ?? 0;
		return Math.min(Math.max(0, e), Math.max(0, t - 1));
	}
	setStatus(e, t) {
		if (e === this.status) return;
		let n = this.status;
		this.status = e, this.events.emit("status", t ? {
			status: e,
			previous: n,
			reason: t
		} : {
			status: e,
			previous: n
		});
	}
	emitPosition() {
		this.events.emit("position", this.getSnapshot());
	}
	startPlaying() {
		let e = this.clock.now(), t = this.status;
		this.rampSegmentStart = e, this.status = "playing", this.showCurrent(e), t !== "playing" && this.events.emit("status", {
			status: "playing",
			previous: t
		});
	}
	showCurrent(e) {
		this.wordShownAt = e, this.deadline = e + this.currentWordDuration(), this.arm();
	}
	arm() {
		if (this.stopTimer(), this.destroyed || this.status !== "playing" || !this.doc) return;
		let e = Math.max(0, this.deadline - this.clock.now());
		this.handle = this.timer.set(() => this.tick(), e);
	}
	tick() {
		if (this.handle = null, this.status !== "playing" || !this.doc) return;
		let e = this.clock.now(), t = e - this.deadline;
		if (this.index >= this.doc.words.length - 1) {
			if (this.accumulateRamp(), this.setStatus("complete"), this.currentStatus() !== "complete" || !this.doc) return;
			let e = this.getSnapshot();
			this.events.emit("position", e), this.currentStatus() === "complete" && this.doc && this.events.emit("complete", e);
			return;
		}
		let n = this.deadline;
		t > this.maxLagMs && (this.rampSegmentStart += t, n = e), this.index++;
		let r = this.updateRampCompletion();
		this.showCurrent(n), this.emitPosition(), r && !this.destroyed && this.events.emit("speed", {
			speed: this.manualSpeed,
			source: "acceleration"
		});
	}
	reschedule() {
		this.status === "playing" && (this.deadline = this.wordShownAt + this.currentWordDuration(), this.arm());
	}
	stopTimer() {
		this.handle !== null && (this.timer.clear(this.handle), this.handle = null);
	}
	resetRamp() {
		this.rampActive = this.config.acceleration.enabled, this.rampElapsed = 0, this.rampSegmentStart = this.clock.now(), this.rampActive && (this.manualSpeed = this.config.acceleration.startSpeed);
	}
	rampElapsedNow() {
		return this.rampElapsed + (this.status === "playing" ? this.clock.now() - this.rampSegmentStart : 0);
	}
	accumulateRamp() {
		if (this.status === "playing") {
			let e = this.clock.now();
			this.rampElapsed += e - this.rampSegmentStart, this.rampSegmentStart = e;
		}
	}
	updateRampCompletion() {
		return this.rampActive && this.rampElapsedNow() >= this.config.acceleration.duration * 1e3 ? (this.rampActive = !1, this.manualSpeed = this.config.acceleration.targetSpeed, !0) : !1;
	}
}, ve = /* @__PURE__ */ new Set([
	"STORAGE",
	"LISTENER",
	"ABORTED"
]), E = class extends Error {
	code;
	fatal;
	constructor(e, t, n = {}) {
		super(t, n.cause === void 0 ? void 0 : { cause: n.cause }), this.name = "ReaderError", this.code = e, this.fatal = n.fatal ?? !ve.has(e);
	}
};
function ye(e) {
	return e instanceof E;
}
// src/core/normalize.ts
var be = /[\u{0}-\u{8}\u{B}\u{E}-\u{1F}\u{7F}-\u{9F}\u{AD}\u{200B}\u{200E}\u{200F}\u{2060}\u{FEFF}]/gu, xe = /[\t\n\f\r \u{1680}\u{2000}-\u{2006}\u{2008}-\u{200A}\u{2028}\u{2029}\u{205F}\u{3000}]+/gu, Se = / ?([\u{A0}\u{202F}\u{2007}])[ \u{A0}\u{202F}\u{2007}]*/gu;
function Ce(e) {
	return e.normalize("NFC").replace(be, "").replace(xe, " ").replace(Se, "$1").replace(/^\s+|\s+$/gu, "");
}
// src/core/segmentation.ts
function we() {
	let e = globalThis.Intl;
	return typeof e?.Segmenter == "function" ? e.Segmenter : void 0;
}
var Te = /\p{RI}\p{RI}|(?:\r\n)|(?:[^\p{M}\u{200D}\u{FE00}-\u{FE0F}](?:[\p{M}\u{FE00}-\u{FE0F}]|\p{Emoji_Modifier})*(?:\u{200D}[^\p{M}\u{200D}](?:[\p{M}\u{FE00}-\u{FE0F}]|\p{Emoji_Modifier})*)*)|[\s\S]/gu, Ee = /[\p{L}\p{M}\p{N}_]+(?:['’.,\-‐][\p{L}\p{M}\p{N}_]+)*|\s+|\p{RI}\p{RI}|[^\p{M}](?:\p{M}|\u{FE0F}|\u{200D}[^\s])*|[\s\S]/gu, De = /[\p{L}\p{N}]/u;
function Oe() {
	return {
		kind: "fallback",
		graphemes(e) {
			return e.match(Te) ?? [];
		},
		words(e) {
			let t = [];
			for (let n of e.matchAll(Ee)) t.push({
				segment: n[0],
				index: n.index,
				isWordLike: De.test(n[0])
			});
			return t;
		}
	};
}
function ke(e) {
	let t = we();
	if (!t) return;
	let n, r;
	try {
		n = new t(e, { granularity: "grapheme" }), r = new t(e, { granularity: "word" });
	} catch {
		return;
	}
	return {
		kind: "intl",
		graphemes(e) {
			return Array.from(n.segment(e), (e) => e.segment);
		},
		words(e) {
			return Array.from(r.segment(e), (e) => ({
				segment: e.segment,
				index: e.index,
				isWordLike: e.isWordLike === !0
			}));
		}
	};
}
var Ae = /* @__PURE__ */ new Map();
function je(e = "fr", t) {
	let n = `${e}|${t ?? "auto"}`, r = Ae.get(n);
	return r || (r = t === "fallback" ? Oe() : ke(e) ?? Oe(), Ae.set(n, r)), r;
}
// src/core/document.ts
var Me = 16, Ne = /[\p{L}\p{N}]/u, Pe = /\p{L}/u, Fe = /\p{P}/u, Ie = /^[\p{Ps}\p{Pi}«‹„‚¿¡"'\s]+$/u, Le = /[.!?…‼⁇⁈⁉。！？]/u, Re = /[;:—–;:]/u, ze = /[,،、，]/u, Be = /^[\u{A0}\u{202F}\u{2007}\u{2009}]$/u, Ve = /^\p{N}+$/u, He = /^\p{N}{3}$/u, Ue = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Thai}\p{Script=Lao}\p{Script=Khmer}\p{Script=Myanmar}]/u, We = /* @__PURE__ */ new Set(/* @__PURE__ */ "M.MM.Mme.Mmes.Mlle.Mlles.Me.Mgr.Dr.Pr.St.Ste.Mr.Mrs.Ms.Prof.Sr.Jr.Inc.Ltd.Corp.Co.Gen.Gov.Jan.Feb.Mar.Apr.Jun.Jul.Aug.Sep.Oct.Nov.Dec.Fig.Vol.No.Ch.Dept.Av.Bd".split(".")), Ge = /* @__PURE__ */ new Set(/* @__PURE__ */ "cf,etc,ex,p,pp,env,av,apr,éd,vol,chap,fig,tél,coll,ibid,op,cit,vs,resp,réf,e.g,i.e,approx,dept,j.-c,a.m,p.m,ph.d,u.s,u.k,al,éds,n.b,c.-à-d,p.ex".split(",")), Ke = /* @__PURE__ */ new Set(["etc", "al"]);
function qe(e) {
	return Math.ceil(e / Math.ceil(e / Me));
}
function Je(e, t, n) {
	let r = Math.ceil(e.letters / t), i = Math.ceil(e.letters / r), a = [], o = "", s = 0, c = e.offset;
	for (let t of n.graphemes(e.text)) {
		let n = Ne.test(t);
		n && s === i && (a.push({
			kind: e.kind,
			text: o,
			offset: c,
			letters: s
		}), c += o.length, o = "", s = 0), o += t, n && s++;
	}
	return o && a.push({
		kind: e.kind,
		text: o,
		offset: c,
		letters: s
	}), a;
}
function Ye(e, t, n) {
	let r = e.reduce((e, t) => e + t.letters, 0);
	if (r <= t) return [{
		drafts: e,
		continues: !1
	}];
	let i = qe(r), a = e.flatMap((e) => e.letters > i ? Je(e, i, n) : [e]), o = [], s = [], c = 0;
	for (let e of a) e.letters > 0 && c > 0 && c + e.letters > i && (o.push({
		drafts: s,
		continues: !0
	}), s = [], c = 0), s.push(e), c += e.letters;
	return o.push({
		drafts: s,
		continues: !1
	}), o;
}
function Xe(e, t) {
	return {
		kind: e.kind,
		text: e.text,
		offset: e.start,
		letters: t
	};
}
function Ze(e, t) {
	return /^\s+$/u.test(e) ? "space" : t || Ne.test(e) ? Pe.test(e) ? "word" : "number" : Fe.test(e) ? "punct" : "symbol";
}
function Qe(e) {
	return e.kind === "word" || e.kind === "number";
}
function $e(e, t, n) {
	let r = [], i = -1;
	for (let a = t; a < n; a++) e[a].kind === "space" ? (i >= 0 && r.push({
		tokenStart: i,
		tokenEnd: a
	}), i = -1) : i < 0 && (i = a);
	i >= 0 && r.push({
		tokenStart: i,
		tokenEnd: n
	});
	let a = [];
	for (let t of r) {
		let n = a[a.length - 1];
		if (n && n.tokenEnd === t.tokenStart - 1) {
			let r = e[n.tokenEnd], i = e[n.tokenEnd - 1], a = e[t.tokenStart];
			if (Be.test(r.text) && Ve.test(i.text) && He.test(a.text)) {
				n.tokenEnd = t.tokenEnd;
				continue;
			}
		}
		a.push({ ...t });
	}
	let o = [];
	for (let t of a) {
		let n = 0, r = !1;
		for (let i = t.tokenStart; i < t.tokenEnd; i++) {
			let t = e[i];
			Qe(t) && n++, Ue.test(t.text) && (r = !0);
		}
		if (n > 1 && r) for (let e = t.tokenStart; e < t.tokenEnd; e++) o.push({
			tokenStart: e,
			tokenEnd: e + 1
		});
		else o.push(t);
	}
	let s = (t) => {
		for (let n = t.tokenStart; n < t.tokenEnd; n++) if (Qe(e[n])) return !0;
		return !1;
	}, c = Array(o.length + 1).fill(!1);
	for (let e = o.length - 1; e >= 0; e--) c[e] = c[e + 1] || s(o[e]);
	let l = [], u = null;
	for (let t = 0; t < o.length; t++) {
		let n = o[t];
		if (s(n)) {
			u &&= (n.tokenStart = u.tokenStart, null), l.push(n);
			continue;
		}
		let r = e.slice(n.tokenStart, n.tokenEnd).map((e) => e.text).join(""), i = l[l.length - 1], a = c[t + 1];
		u ? u.tokenEnd = n.tokenEnd : Ie.test(r) && a || !i && a ? u = { ...n } : i ? i.tokenEnd = n.tokenEnd : l.push(n);
	}
	if (u) {
		let e = l[l.length - 1];
		e ? e.tokenEnd = u.tokenEnd : l.push(u);
	}
	return l;
}
function et(e, t) {
	let n = -1;
	for (let r = t.tokenStart; r < t.tokenEnd; r++) Qe(e[r]) && (n = r);
	let r = n < 0 ? t.tokenStart : n + 1, i = "";
	for (let n = r; n < t.tokenEnd; n++) i += e[n].text;
	let a = "none";
	return Le.test(i) ? a = "sentence" : Re.test(i) ? a = "clause" : ze.test(i) && (a = "comma"), {
		punctuation: a,
		trailing: i
	};
}
function tt(e) {
	let t = e.replace(/^[\p{Ps}\p{Pi}«"'\s]+/u, "").replace(/[\p{Pe}\p{Pf}»"'\s]+$/u, "");
	return !t.endsWith(".") || t.endsWith("..") ? null : t.slice(0, -1);
}
function nt(e) {
	let t = /[\p{L}\p{N}]/u.exec(e);
	return !!t && /\p{Ll}/u.test(t[0]);
}
function rt(e) {
	let t = /[\p{L}\p{N}]/u.exec(e);
	return !!t && /\p{Lu}/u.test(t[0]);
}
function it(e) {
	let t = tt(e);
	if (t === null || t.length === 0) return "no";
	let n = t.toLowerCase();
	return Ke.has(n) ? "terminal" : We.has(t) || Ge.has(n) || /^\p{Lu}$/u.test(t) || /^(?:\p{L}[.-]+)+\p{L}$/u.test(t) ? "yes" : "no";
}
function at(e, t = {}) {
	let n = t.locale ?? "fr", r = Math.max(12, Math.floor(t.maxWordLength ?? 25)), i = je(n, t.segmentation), a = [], o = [], s = [], c = [], l = "";
	for (let t of e) {
		let e = Ce(t.text);
		if (e.length === 0) continue;
		l.length > 0 && (l += "\n\n");
		let n = l.length;
		l += e;
		let u = a.length, d = [], f = [];
		for (let t of i.words(e)) {
			let e = Ze(t.segment, t.isWordLike), n = 0;
			if (e === "word" || e === "number") for (let e of i.graphemes(t.segment)) Ne.test(e) && n++;
			d.push({
				index: d.length,
				kind: e,
				text: t.segment,
				start: t.index,
				end: t.index + t.segment.length,
				blockIndex: u
			}), f.push(n);
		}
		let p = s.length, m = [], h = (e) => {
			s.push({
				index: s.length,
				kind: e.kind,
				text: e.text,
				start: n + e.offset,
				end: n + e.offset + e.text.length,
				blockIndex: u
			});
		}, g = 0;
		for (let e of $e(d, 0, d.length)) {
			for (; g < e.tokenStart; g++) h(Xe(d[g], f[g]));
			let t = [];
			for (let n = e.tokenStart; n < e.tokenEnd; n++) t.push(Xe(d[n], f[n]));
			g = e.tokenEnd;
			for (let e of Ye(t, r, i)) {
				let t = s.length;
				e.drafts.forEach(h), m.push(e.continues ? {
					tokenStart: t,
					tokenEnd: s.length,
					continues: !0
				} : {
					tokenStart: t,
					tokenEnd: s.length
				});
			}
		}
		for (; g < d.length; g++) h(Xe(d[g], f[g]));
		let _ = c.length;
		for (let e of m) {
			let t = s[e.tokenStart].start, n = s[e.tokenEnd - 1].end, r = l.slice(t, n), a = e.continues ? "none" : et(s, e).punctuation, o = 0;
			for (let e of i.graphemes(r)) Ne.test(e) && o++;
			let d = c.length;
			for (let t = e.tokenStart; t < e.tokenEnd; t++) s[t].kind !== "space" && (s[t].wordIndex = d);
			c.push({
				index: d,
				text: r,
				start: t,
				end: n,
				blockIndex: u,
				sentenceIndex: -1,
				tokenStart: e.tokenStart,
				tokenEnd: e.tokenEnd,
				letterCount: o,
				punctuation: a,
				endsSentence: !1,
				endsBlock: !1,
				continues: e.continues === !0
			});
		}
		let v = c.length;
		if (v === _) {
			l = l.slice(0, n > 0 ? n - 2 : 0), s.length = p;
			continue;
		}
		let y = o.length, b = _;
		for (let e = _; e < v; e++) {
			let t = c[e], n = e + 1 < v ? c[e + 1] : void 0, r = !1;
			if (!n) r = !0, t.endsBlock = !0;
			else if (t.punctuation === "sentence") {
				let e = /[.]['"’”»)\]\s]*$/u.test(t.text) && !/[!?…]/u.test(t.text) ? it(t.text) : "no";
				e === "yes" || e === "terminal" && !rt(n.text) ? t.punctuation = "none" : nt(n.text) ? t.punctuation = "comma" : r = !0;
			}
			if (r) {
				t.endsSentence = !0;
				let n = o.length;
				o.push({
					index: n,
					blockIndex: u,
					start: c[b].start,
					end: t.end,
					wordStart: b,
					wordEnd: e + 1
				});
				for (let t = b; t <= e; t++) c[t].sentenceIndex = n;
				b = e + 1;
			}
		}
		a.push({
			index: u,
			kind: t.kind,
			...t.kind === "heading" ? { level: Math.min(6, Math.max(1, t.level ?? 2)) } : {},
			start: n,
			end: l.length,
			sentenceStart: y,
			sentenceEnd: o.length,
			wordStart: _,
			wordEnd: v
		});
	}
	return {
		text: l,
		locale: n,
		blocks: a,
		sentences: o,
		tokens: s,
		words: c,
		segmentation: i.kind
	};
}
// src/parsers/dom.ts
var ot = /* @__PURE__ */ new Set(/* @__PURE__ */ "script.style.noscript.template.iframe.frame.object.embed.applet.canvas.svg.math.audio.video.picture.img.map.button.input.select.textarea.option.optgroup.datalist.output.progress.meter.label.nav.dialog.menu.head.title.meta.link.base.slot.urr-reader".split(".")), st = /* @__PURE__ */ new Set([
	"button",
	"navigation",
	"menu",
	"menubar",
	"toolbar",
	"dialog",
	"alertdialog",
	"search",
	"tablist",
	"tab",
	"searchbox",
	"textbox",
	"combobox",
	"listbox",
	"slider",
	"spinbutton",
	"switch",
	"checkbox",
	"radio"
]), ct = /* @__PURE__ */ new Set(/* @__PURE__ */ "address.article.aside.blockquote.dd.details.div.dl.dt.fieldset.figcaption.figure.footer.form.h1.h2.h3.h4.h5.h6.header.hgroup.hr.li.main.ol.p.pre.section.summary.table.thead.tbody.tfoot.tr.caption.ul.body.center".split(".")), lt = /* @__PURE__ */ new Set(["td", "th"]), ut = 1, dt = 3, ft = 4;
function pt(e, t) {
	let n = /^h([1-6])$/.exec(e);
	return n ? {
		kind: "heading",
		level: Number(n[1])
	} : e === "li" || e === "dd" || e === "dt" ? { kind: "list-item" } : e === "blockquote" ? { kind: "quote" } : e === "pre" ? { kind: "code" } : e === "tr" ? { kind: "table-row" } : t.kind === "quote" || t.kind === "list-item" || t.kind === "code" ? t : { kind: "paragraph" };
}
function mt(e, t) {
	if (e.hasAttribute("hidden") || e.hasAttribute("inert") || e.hasAttribute("data-rsvp-ignore") || e.getAttribute("aria-hidden") === "true") return !0;
	let n = e.getAttribute("role");
	if (n && st.has(n.trim().toLowerCase())) return !0;
	if (t.exclude) try {
		if (e.matches(t.exclude)) return !0;
	} catch {}
	if (t.checkVisibility) {
		let t = e.ownerDocument?.defaultView;
		if (t && e.isConnected) {
			let n = t.getComputedStyle(e);
			if (n.display === "none" || n.visibility === "hidden") return !0;
		}
	}
	return !1;
}
function ht(e, t = {}) {
	let n = [], r = null, i = () => {
		r && /\S/u.test(r.text) && n.push(r.ctx.kind === "heading" ? {
			kind: "heading",
			level: r.ctx.level ?? 2,
			text: r.text
		} : {
			kind: r.ctx.kind,
			text: r.text
		}), r = null;
	}, a = (e, t) => {
		r ||= {
			ctx: e,
			text: ""
		}, r.text += t;
	}, o = [{
		node: e,
		ctx: { kind: "paragraph" }
	}];
	for (; o.length > 0;) {
		let n = o.pop(), { node: r, ctx: s } = n;
		if (n.exit) {
			n.cell && a(s, " "), n.block && i();
			continue;
		}
		if (r.nodeType === dt || r.nodeType === ft) {
			a(s, r.nodeValue ?? "");
			continue;
		}
		if (r.nodeType !== ut && r !== e) continue;
		let c = s, l = !1, u = !1;
		if (r.nodeType === ut) {
			let n = r, o = n.localName.toLowerCase();
			if (ot.has(o) || r !== e && mt(n, t)) continue;
			if (o === "br" || o === "wbr") {
				o === "br" && a(s, " ");
				continue;
			}
			l = ct.has(o), u = lt.has(o), l && (i(), c = pt(o, s)), u && a(s, " ");
		}
		let d = r.childNodes;
		o.push({
			node: r,
			ctx: s,
			exit: !0,
			block: l,
			cell: u
		});
		for (let e = d.length - 1; e >= 0; e--) o.push({
			node: d[e],
			ctx: c
		});
	}
	return i(), n;
}
// src/parsers/html.ts
function gt(e, t = {}) {
	let n = globalThis.DOMParser;
	if (typeof n != "function") throw new E("ENVIRONMENT", "DOMParser est requis pour analyser du HTML.");
	let r;
	try {
		r = new n().parseFromString(e, "text/html");
	} catch (e) {
		throw new E("ENVIRONMENT", "Analyse HTML refusée par le navigateur (politique Trusted Types ?).", { cause: e });
	}
	return ht(r.body ?? r.documentElement, {
		...t,
		checkVisibility: !1
	});
}
var _t = /<(script|style|template|noscript|iframe|object|svg|math|textarea|select|button|title)\b[^>]*>[\s\S]*?<\/\1\s*>/giu, vt = /<\/?(?:br|p|div|li|ul|ol|h[1-6]|tr|td|th|table|blockquote|pre|section|article|header|footer|dd|dt|hr)\b[^>]*>/giu, yt = {
	amp: "&",
	lt: "<",
	gt: ">",
	quot: "\"",
	apos: "'",
	nbsp: "\xA0"
};
function bt(e) {
	return e.replace(/<!--[\s\S]*?-->/gu, "").replace(_t, " ").replace(vt, " ").replace(/<[^>]*>/gu, "").replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/giu, (e, t) => {
		if (t[0] === "#") {
			let n = t[1] === "x" || t[1] === "X" ? parseInt(t.slice(2), 16) : parseInt(t.slice(1), 10);
			return Number.isFinite(n) && n > 0 && n <= 1114111 ? String.fromCodePoint(n) : e;
		}
		return yt[t.toLowerCase()] ?? e;
	});
}
function xt(e) {
	try {
		return gt(e).map((e) => e.text).join(" ");
	} catch {
		return bt(e);
	}
}
// node_modules/mdurl/lib/decode.mjs
var St = {};
function Ct(e) {
	let t = St[e];
	if (t) return t;
	t = St[e] = [];
	for (let e = 0; e < 128; e++) {
		let n = String.fromCharCode(e);
		t.push(n);
	}
	for (let n = 0; n < e.length; n++) {
		let r = e.charCodeAt(n);
		t[r] = "%" + ("0" + r.toString(16).toUpperCase()).slice(-2);
	}
	return t;
}
function D(e, t) {
	typeof t != "string" && (t = D.defaultChars);
	let n = Ct(t);
	return e.replace(/(%[a-f0-9]{2})+/gi, function(e) {
		let t = "";
		for (let r = 0, i = e.length; r < i; r += 3) {
			let a = parseInt(e.slice(r + 1, r + 3), 16);
			if (a < 128) t += n[a];
			else {
				if ((a & 224) == 192 && r + 3 < i) {
					let n = parseInt(e.slice(r + 4, r + 6), 16);
					if ((n & 192) == 128) {
						let e = a << 6 & 1984 | n & 63;
						t += e < 128 ? "��" : String.fromCharCode(e), r += 3;
						continue;
					}
				}
				if ((a & 240) == 224 && r + 6 < i) {
					let n = parseInt(e.slice(r + 4, r + 6), 16), i = parseInt(e.slice(r + 7, r + 9), 16);
					if ((n & 192) == 128 && (i & 192) == 128) {
						let e = a << 12 & 61440 | n << 6 & 4032 | i & 63;
						t += e < 2048 || e >= 55296 && e <= 57343 ? "���" : String.fromCharCode(e), r += 6;
						continue;
					}
				}
				if ((a & 248) == 240 && r + 9 < i) {
					let n = parseInt(e.slice(r + 4, r + 6), 16), i = parseInt(e.slice(r + 7, r + 9), 16), o = parseInt(e.slice(r + 10, r + 12), 16);
					if ((n & 192) == 128 && (i & 192) == 128 && (o & 192) == 128) {
						let e = a << 18 & 1835008 | n << 12 & 258048 | i << 6 & 4032 | o & 63;
						e < 65536 || e > 1114111 ? t += "����" : (e -= 65536, t += String.fromCharCode(55296 + (e >> 10), 56320 + (e & 1023))), r += 9;
						continue;
					}
				}
				t += "�";
			}
		}
		return t;
	});
}
D.defaultChars = ";/?:@&=+$,#", D.componentChars = "";
// node_modules/mdurl/lib/encode.mjs
var wt = {};
function Tt(e) {
	let t = wt[e];
	if (t) return t;
	t = wt[e] = [];
	for (let e = 0; e < 128; e++) {
		let n = String.fromCharCode(e);
		/^[0-9a-z]$/i.test(n) ? t.push(n) : t.push("%" + ("0" + e.toString(16).toUpperCase()).slice(-2));
	}
	for (let n = 0; n < e.length; n++) t[e.charCodeAt(n)] = e[n];
	return t;
}
function O(e, t, n) {
	typeof t != "string" && (n = t, t = O.defaultChars), n === void 0 && (n = !0);
	let r = Tt(t), i = "";
	for (let t = 0, a = e.length; t < a; t++) {
		let o = e.charCodeAt(t);
		if (n && o === 37 && t + 2 < a && /^[0-9a-f]{2}$/i.test(e.slice(t + 1, t + 3))) i += e.slice(t, t + 3), t += 2;
		else if (o < 128) i += r[o];
		else if (o >= 55296 && o <= 57343) {
			if (o >= 55296 && o <= 56319 && t + 1 < a) {
				let n = e.charCodeAt(t + 1);
				if (n >= 56320 && n <= 57343) {
					i += encodeURIComponent(e[t] + e[t + 1]), t++;
					continue;
				}
			}
			i += "%EF%BF%BD";
		} else i += encodeURIComponent(e[t]);
	}
	return i;
}
O.defaultChars = ";/?:@&=+$,-_.!~*'()#", O.componentChars = "-_.!~*'()";
// node_modules/mdurl/lib/format.mjs
function Et(e) {
	let t = "";
	return t += e.protocol || "", t += e.slashes ? "//" : "", t += e.auth ? e.auth + "@" : "", e.hostname && e.hostname.indexOf(":") !== -1 ? t += "[" + e.hostname + "]" : t += e.hostname || "", t += e.port ? ":" + e.port : "", t += e.pathname || "", t += e.search || "", t += e.hash || "", t;
}
// node_modules/mdurl/lib/parse.mjs
function Dt() {
	this.protocol = null, this.slashes = null, this.auth = null, this.port = null, this.hostname = null, this.hash = null, this.search = null, this.pathname = null;
}
var Ot = /^([a-z0-9.+-]+:)/i, kt = /:[0-9]*$/, At = /^(\/\/?(?!\/)[^\?\s]*)(\?[^\s]*)?$/, jt = [
	"%",
	"/",
	"?",
	";",
	"#",
	"'",
	"{",
	"}",
	"|",
	"\\",
	"^",
	"`",
	"<",
	">",
	"\"",
	"`",
	" ",
	"\r",
	"\n",
	"	"
], Mt = [
	"/",
	"?",
	"#"
], Nt = 255, Pt = /^[+a-z0-9A-Z_-]{0,63}$/, Ft = /^([+a-z0-9A-Z_-]{0,63})(.*)$/, It = {
	javascript: !0,
	"javascript:": !0
}, Lt = {
	http: !0,
	https: !0,
	ftp: !0,
	gopher: !0,
	file: !0,
	"http:": !0,
	"https:": !0,
	"ftp:": !0,
	"gopher:": !0,
	"file:": !0
};
function Rt(e, t) {
	if (e && e instanceof Dt) return e;
	let n = new Dt();
	return n.parse(e, t), n;
}
Dt.prototype.parse = function(e, t) {
	let n, r, i, a = e;
	if (a = a.trim(), !t && e.split("#").length === 1) {
		let e = At.exec(a);
		if (e) return this.pathname = e[1], e[2] && (this.search = e[2]), this;
	}
	let o = Ot.exec(a);
	if (o && (o = o[0], n = o.toLowerCase(), this.protocol = o, a = a.substr(o.length)), (t || o || a.match(/^\/\/[^@\/]+@[^@\/]+/)) && (i = a.substr(0, 2) === "//", i && !(o && It[o]) && (a = a.substr(2), this.slashes = !0)), !It[o] && (i || o && !Lt[o])) {
		let e = -1;
		for (let t = 0; t < Mt.length; t++) r = a.indexOf(Mt[t]), r !== -1 && (e === -1 || r < e) && (e = r);
		let t, n;
		n = e === -1 ? a.lastIndexOf("@") : a.lastIndexOf("@", e), n !== -1 && (t = a.slice(0, n), a = a.slice(n + 1), this.auth = t), e = -1;
		for (let t = 0; t < jt.length; t++) r = a.indexOf(jt[t]), r !== -1 && (e === -1 || r < e) && (e = r);
		e === -1 && (e = a.length), a[e - 1] === ":" && e--;
		let i = a.slice(0, e);
		a = a.slice(e), this.parseHost(i), this.hostname = this.hostname || "";
		let o = this.hostname[0] === "[" && this.hostname[this.hostname.length - 1] === "]";
		if (!o) {
			let e = this.hostname.split(/\./);
			for (let t = 0, n = e.length; t < n; t++) {
				let n = e[t];
				if (n && !n.match(Pt)) {
					let r = "";
					for (let e = 0, t = n.length; e < t; e++) n.charCodeAt(e) > 127 ? r += "x" : r += n[e];
					if (!r.match(Pt)) {
						let r = e.slice(0, t), i = e.slice(t + 1), o = n.match(Ft);
						o && (r.push(o[1]), i.unshift(o[2])), i.length && (a = i.join(".") + a), this.hostname = r.join(".");
						break;
					}
				}
			}
		}
		this.hostname.length > Nt && (this.hostname = ""), o && (this.hostname = this.hostname.substr(1, this.hostname.length - 2));
	}
	let s = a.indexOf("#");
	s !== -1 && (this.hash = a.substr(s), a = a.slice(0, s));
	let c = a.indexOf("?");
	return c !== -1 && (this.search = a.substr(c), a = a.slice(0, c)), a && (this.pathname = a), Lt[n] && this.hostname && !this.pathname && (this.pathname = ""), this;
}, Dt.prototype.parseHost = function(e) {
	let t = kt.exec(e);
	t && (t = t[0], t !== ":" && (this.port = t.substr(1)), e = e.substr(0, e.length - t.length)), e && (this.hostname = e);
};
// node_modules/mdurl/index.mjs
var zt = /* @__PURE__ */ t({
	decode: () => D,
	encode: () => O,
	format: () => Et,
	parse: () => Rt
}), Bt = /* @__PURE__ */ t({
	Any: () => Vt,
	Cc: () => Ht,
	Cf: () => Ut,
	P: () => Wt,
	S: () => Gt,
	Z: () => Kt
}), Vt = /[\0-\uD7FF\uE000-\uFFFF]|[\uD800-\uDBFF][\uDC00-\uDFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]/, Ht = /[\0-\x1F\x7F-\x9F]/, Ut = /[\xAD\u0600-\u0605\u061C\u06DD\u070F\u0890\u0891\u08E2\u180E\u200B-\u200F\u202A-\u202E\u2060-\u2064\u2066-\u206F\uFEFF\uFFF9-\uFFFB]|\uD804[\uDCBD\uDCCD]|\uD80D[\uDC30-\uDC3F]|\uD82F[\uDCA0-\uDCA3]|\uD834[\uDD73-\uDD7A]|\uDB40[\uDC01\uDC20-\uDC7F]/, Wt = /[!-#%-\*,-\/:;\?@\[-\]_\{\}\xA1\xA7\xAB\xB6\xB7\xBB\xBF\u037E\u0387\u055A-\u055F\u0589\u058A\u05BE\u05C0\u05C3\u05C6\u05F3\u05F4\u0609\u060A\u060C\u060D\u061B\u061D-\u061F\u066A-\u066D\u06D4\u0700-\u070D\u07F7-\u07F9\u0830-\u083E\u085E\u0964\u0965\u0970\u09FD\u0A76\u0AF0\u0C77\u0C84\u0DF4\u0E4F\u0E5A\u0E5B\u0F04-\u0F12\u0F14\u0F3A-\u0F3D\u0F85\u0FD0-\u0FD4\u0FD9\u0FDA\u104A-\u104F\u10FB\u1360-\u1368\u1400\u166E\u169B\u169C\u16EB-\u16ED\u1735\u1736\u17D4-\u17D6\u17D8-\u17DA\u1800-\u180A\u1944\u1945\u1A1E\u1A1F\u1AA0-\u1AA6\u1AA8-\u1AAD\u1B4E\u1B4F\u1B5A-\u1B60\u1B7D-\u1B7F\u1BFC-\u1BFF\u1C3B-\u1C3F\u1C7E\u1C7F\u1CC0-\u1CC7\u1CD3\u2010-\u2027\u2030-\u2043\u2045-\u2051\u2053-\u205E\u207D\u207E\u208D\u208E\u2308-\u230B\u2329\u232A\u2768-\u2775\u27C5\u27C6\u27E6-\u27EF\u2983-\u2998\u29D8-\u29DB\u29FC\u29FD\u2CF9-\u2CFC\u2CFE\u2CFF\u2D70\u2E00-\u2E2E\u2E30-\u2E4F\u2E52-\u2E5D\u3001-\u3003\u3008-\u3011\u3014-\u301F\u3030\u303D\u30A0\u30FB\uA4FE\uA4FF\uA60D-\uA60F\uA673\uA67E\uA6F2-\uA6F7\uA874-\uA877\uA8CE\uA8CF\uA8F8-\uA8FA\uA8FC\uA92E\uA92F\uA95F\uA9C1-\uA9CD\uA9DE\uA9DF\uAA5C-\uAA5F\uAADE\uAADF\uAAF0\uAAF1\uABEB\uFD3E\uFD3F\uFE10-\uFE19\uFE30-\uFE52\uFE54-\uFE61\uFE63\uFE68\uFE6A\uFE6B\uFF01-\uFF03\uFF05-\uFF0A\uFF0C-\uFF0F\uFF1A\uFF1B\uFF1F\uFF20\uFF3B-\uFF3D\uFF3F\uFF5B\uFF5D\uFF5F-\uFF65]|\uD800[\uDD00-\uDD02\uDF9F\uDFD0]|\uD801\uDD6F|\uD802[\uDC57\uDD1F\uDD3F\uDE50-\uDE58\uDE7F\uDEF0-\uDEF6\uDF39-\uDF3F\uDF99-\uDF9C]|\uD803[\uDD6E\uDEAD\uDED0\uDF55-\uDF59\uDF86-\uDF89]|\uD804[\uDC47-\uDC4D\uDCBB\uDCBC\uDCBE-\uDCC1\uDD40-\uDD43\uDD74\uDD75\uDDC5-\uDDC8\uDDCD\uDDDB\uDDDD-\uDDDF\uDE38-\uDE3D\uDEA9\uDFD4\uDFD5\uDFD7\uDFD8]|\uD805[\uDC4B-\uDC4F\uDC5A\uDC5B\uDC5D\uDCC6\uDDC1-\uDDD7\uDE41-\uDE43\uDE60-\uDE6C\uDEB9\uDF3C-\uDF3E]|\uD806[\uDC3B\uDD44-\uDD46\uDDE2\uDE3F-\uDE46\uDE9A-\uDE9C\uDE9E-\uDEA2\uDF00-\uDF09\uDFE1]|\uD807[\uDC41-\uDC45\uDC70\uDC71\uDEF7\uDEF8\uDF43-\uDF4F\uDFFF]|\uD809[\uDC70-\uDC74]|\uD80B[\uDFF1\uDFF2]|\uD81A[\uDE6E\uDE6F\uDEF5\uDF37-\uDF3B\uDF44]|\uD81B[\uDD6D-\uDD6F\uDE97-\uDE9A\uDFE2]|\uD82F\uDC9F|\uD836[\uDE87-\uDE8B]|\uD839\uDDFF|\uD83A[\uDD5E\uDD5F]/, Gt = /[\$\+<->\^`\|~\xA2-\xA6\xA8\xA9\xAC\xAE-\xB1\xB4\xB8\xD7\xF7\u02C2-\u02C5\u02D2-\u02DF\u02E5-\u02EB\u02ED\u02EF-\u02FF\u0375\u0384\u0385\u03F6\u0482\u058D-\u058F\u0606-\u0608\u060B\u060E\u060F\u06DE\u06E9\u06FD\u06FE\u07F6\u07FE\u07FF\u0888\u09F2\u09F3\u09FA\u09FB\u0AF1\u0B70\u0BF3-\u0BFA\u0C7F\u0D4F\u0D79\u0E3F\u0F01-\u0F03\u0F13\u0F15-\u0F17\u0F1A-\u0F1F\u0F34\u0F36\u0F38\u0FBE-\u0FC5\u0FC7-\u0FCC\u0FCE\u0FCF\u0FD5-\u0FD8\u109E\u109F\u1390-\u1399\u166D\u17DB\u1940\u19DE-\u19FF\u1B61-\u1B6A\u1B74-\u1B7C\u1FBD\u1FBF-\u1FC1\u1FCD-\u1FCF\u1FDD-\u1FDF\u1FED-\u1FEF\u1FFD\u1FFE\u2044\u2052\u207A-\u207C\u208A-\u208C\u20A0-\u20C1\u2100\u2101\u2103-\u2106\u2108\u2109\u2114\u2116-\u2118\u211E-\u2123\u2125\u2127\u2129\u212E\u213A\u213B\u2140-\u2144\u214A-\u214D\u214F\u218A\u218B\u2190-\u2307\u230C-\u2328\u232B-\u2429\u2440-\u244A\u249C-\u24E9\u2500-\u2767\u2794-\u27C4\u27C7-\u27E5\u27F0-\u2982\u2999-\u29D7\u29DC-\u29FB\u29FE-\u2B73\u2B76-\u2BFF\u2CE5-\u2CEA\u2E50\u2E51\u2E80-\u2E99\u2E9B-\u2EF3\u2F00-\u2FD5\u2FF0-\u2FFF\u3004\u3012\u3013\u3020\u3036\u3037\u303E\u303F\u309B\u309C\u3190\u3191\u3196-\u319F\u31C0-\u31E5\u31EF\u3200-\u321E\u322A-\u3247\u3250\u3260-\u327F\u328A-\u32B0\u32C0-\u33FF\u4DC0-\u4DFF\uA490-\uA4C6\uA700-\uA716\uA720\uA721\uA789\uA78A\uA828-\uA82B\uA836-\uA839\uAA77-\uAA79\uAB5B\uAB6A\uAB6B\uFB29\uFBB2-\uFBD2\uFD40-\uFD4F\uFD90\uFD91\uFDC8-\uFDCF\uFDFC-\uFDFF\uFE62\uFE64-\uFE66\uFE69\uFF04\uFF0B\uFF1C-\uFF1E\uFF3E\uFF40\uFF5C\uFF5E\uFFE0-\uFFE6\uFFE8-\uFFEE\uFFFC\uFFFD]|\uD800[\uDD37-\uDD3F\uDD79-\uDD89\uDD8C-\uDD8E\uDD90-\uDD9C\uDDA0\uDDD0-\uDDFC]|\uD802[\uDC77\uDC78\uDEC8]|\uD803[\uDD8E\uDD8F\uDED1-\uDED8]|\uD805\uDF3F|\uD807[\uDFD5-\uDFF1]|\uD81A[\uDF3C-\uDF3F\uDF45]|\uD82F\uDC9C|\uD833[\uDC00-\uDCEF\uDCFA-\uDCFC\uDD00-\uDEB3\uDEBA-\uDED0\uDEE0-\uDEF0\uDF50-\uDFC3]|\uD834[\uDC00-\uDCF5\uDD00-\uDD26\uDD29-\uDD64\uDD6A-\uDD6C\uDD83\uDD84\uDD8C-\uDDA9\uDDAE-\uDDEA\uDE00-\uDE41\uDE45\uDF00-\uDF56]|\uD835[\uDEC1\uDEDB\uDEFB\uDF15\uDF35\uDF4F\uDF6F\uDF89\uDFA9\uDFC3]|\uD836[\uDC00-\uDDFF\uDE37-\uDE3A\uDE6D-\uDE74\uDE76-\uDE83\uDE85\uDE86]|\uD838[\uDD4F\uDEFF]|\uD83B[\uDCAC\uDCB0\uDD2E\uDEF0\uDEF1]|\uD83C[\uDC00-\uDC2B\uDC30-\uDC93\uDCA0-\uDCAE\uDCB1-\uDCBF\uDCC1-\uDCCF\uDCD1-\uDCF5\uDD0D-\uDDAD\uDDE6-\uDE02\uDE10-\uDE3B\uDE40-\uDE48\uDE50\uDE51\uDE60-\uDE65\uDF00-\uDFFF]|\uD83D[\uDC00-\uDED8\uDEDC-\uDEEC\uDEF0-\uDEFC\uDF00-\uDFD9\uDFE0-\uDFEB\uDFF0]|\uD83E[\uDC00-\uDC0B\uDC10-\uDC47\uDC50-\uDC59\uDC60-\uDC87\uDC90-\uDCAD\uDCB0-\uDCBB\uDCC0\uDCC1\uDCD0-\uDCD8\uDD00-\uDE57\uDE60-\uDE6D\uDE70-\uDE7C\uDE80-\uDE8A\uDE8E-\uDEC6\uDEC8\uDECD-\uDEDC\uDEDF-\uDEEA\uDEEF-\uDEF8\uDF00-\uDF92\uDF94-\uDFEF\uDFFA]/, Kt = /[ \xA0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000]/, qt = [
	8364,
	0,
	8218,
	402,
	8222,
	8230,
	8224,
	8225,
	710,
	8240,
	352,
	8249,
	338,
	0,
	381,
	0,
	0,
	8216,
	8217,
	8220,
	8221,
	8226,
	8211,
	8212,
	732,
	8482,
	353,
	8250,
	339,
	0,
	382,
	376
];
function Jt(e) {
	return e === 0 || e >= 55296 && e <= 57343 || e > 1114111;
}
function Yt(e) {
	return Jt(e) ? 65533 : e >= 128 && e <= 159 && qt[e - 128] || e;
}
function Xt(e) {
	return e - 1 >>> 0 < 127 || e - 160 >>> 0 < 55136 ? String.fromCharCode(e) : String.fromCodePoint(Yt(e));
}
// node_modules/entities/dist/internal/decode-shared.js
var k = /* #__PURE__ */ (() => {
	let e = /* @__PURE__ */ new Uint8Array(127), t = 0;
	for (let n = 33; n <= 126; n++) n !== 34 && n !== 36 && n !== 92 && (e[n] = t++);
	return e;
})();
function Zt(e, t, n, r, i, a) {
	let o = e.length, s = a * 90, c = 0, l = () => {
		let t = k[e.charCodeAt(c++)];
		return t < a ? t : t * 91 - s + k[e.charCodeAt(c++)];
	}, u = n - r, d = n + i, f = new Int32Array(d);
	f.fill(-1, r, a), f.fill(-1, a + u, d);
	let p = new Int32Array(d), m = new Int32Array(d);
	function h(t, n) {
		let r = 0, i = n, a = n + t;
		for (; i < a;) {
			let t = k[e.charCodeAt(c++)];
			if (t < 89) r += t, f[i++] = r;
			else if (t === 89) {
				let t = k[e.charCodeAt(c++)] + 2;
				for (; t--;) f[i++] = ++r;
			} else {
				let t = k[e.charCodeAt(c++)];
				r += 89 + (t < 90 ? t * 91 + k[e.charCodeAt(c++)] : k[e.charCodeAt(c++)] * 8281 + k[e.charCodeAt(c++)] * 91 + k[e.charCodeAt(c++)]), f[i++] = r;
			}
		}
	}
	h(r, 0), h(u, a);
	let g = new Int32Array(i * 2), _ = 0, v = 0;
	function y(e, t) {
		for (let n = 0; n < e; n++) {
			let e = t + n, r = l(), i = l();
			g[v * 2] = r, g[v * 2 + 1] = i, v += 1, p[e] = _;
			let a = (f[r] < 0 ? m[r] : 1) + (f[i] < 0 ? m[i] : 1);
			m[e] = a, _ += a;
		}
	}
	y(i - a + r, a + u), y(a - r, r);
	let b = new Uint16Array(_), x = 0;
	for (let e = 0; e < v; e++) for (let t = 0; t < 2; t++) {
		let n = g[e * 2 + t], r = f[n];
		if (r < 0) {
			let e = p[n], t = e + m[n];
			for (; e < t;) b[x++] = b[e++];
		} else b[x++] = r;
	}
	let S = new Uint16Array(t), C = 0;
	for (; c < o;) {
		let t = k[e.charCodeAt(c++)];
		t >= a && (t = t * 91 - s + k[e.charCodeAt(c++)]);
		let n = f[t];
		if (n < 0) {
			let e = p[t], n = e + m[t];
			for (; e < n;) S[C++] = b[e++];
		} else S[C++] = n;
	}
	return S;
}
// node_modules/entities/dist/generated/decode-data-html.js
var Qt = /* #__PURE__ */ Zt("!}.&u%}'&}*'~!6*)%&,~!J~!J~%L~y<~!R,~~%Lu~~#GD~~#|)1#%}^%}2%+#.##%##%}&%##%'#%##&%#%#'%#&#%#&#'#%%#&#%##%#)%''%&%#%#'%#%%#%%}%%%#%#&(23#%%#&-%0%('1#(##%#'##+%'*.:1}#%#6-+(%'%%#%%%}#L'2351&('%}&/N'(0(/*-%(%%}#'+&T%7.2}#&%&#%#36/5##%&%%#&#%%#))2%%##%&&'0~!#*+&'%1~!%).'3q?&%'1~!.##%6(~!+%%%(Gw'rT~!E#<nA%#jZ~!H%(~!42##~!*31&~!G%U~#)5~#`3~!J~!Z~%]~%Y~%C~!q~!u~#kz~%#~!6'~!D~!U~!?~#T~!c%~!G#'~%7|~!G~!J~!G&~#pb~(Df}#%}*&}#%##%##%##&#-}&'#'&%#.++}%mI,#,@&(}*%}*'%&##&#%##%}&0}#.},U},%}+%}&%}#%##&}B%(}(%}+%)})%##%#&}&%##%&}<%}>%#%&}*%}(%}9%}/%})%}*%}*%}?&}&%}3%}&*#%})%#%#)}#&#-#+*%E%%'%'#%}#*V##&##I}#&&##%&%#&&Qf%%))w/0+&%#(#.%-''''++++7}>%4'',##1,#%#&%##&#'##&#*#9)%&%}#*}%,#+P(%A&%#'&##wSD',9E00#y#@}(+}&%&>~!#~!X}#*}(&&}(&}(,%}%&#+&}#&}I%#%}%)#(},'%#*}4%%#%}(''}#/##(##),%-##%%)#&}(.}&%#&}%%}*&#%},&&}&%}#%*'#%})%}D&}&%}-&}6&#&}-,%}#%})-(~+`~,=?~I9'9%~!,#%})%})%}@%}?%}(~!?~#<~#pP~#BG~#=1#%K+~#?#~%;)~#A~#mF1~#A'~'X%'~#lR~#N~'N~#r~#m#-~#i'?%#'%~#B%##%,%#~#_%#0%~#]732~,w~2+#:&#%&'0%&>%}#>##F+)#%&&#(+_}4&}-%}(&}@&}O7Fdf0@+/v4}&WU##&/0#&'('B#%}.%}'+#%}#%%&#&%#%##+#&#)#6#'#.},%}c%},%#%##%&#&%#&~#>'*-.%##%##%}#%%}%'~#)D1}#%*&~#_%%'(~#S2%'.}#~#=##*'*-%}&'%'##&&~'E%.#&~#M4}%%##&'%#~#O1##%&#'+~#<B%##%%'%+~#;#@%}#&%#&&%#(~#H1}'%'##&&~#?A}&'~#D#%32}'&&&&~#[}'(#%}'~#;C})&}%%#%~#=&%,3}%'(#%%~#^'#&&)#%'~#Y%-~#d-%'~#^%%&#&&&}#~#b~2t*&'~&(~&@~0%~e~3}%*''0})&}+~!9##-}#%-hD*)1fC#%/&/fB#40~!+#)*4~!+~!K'&:~!/*7~!.#~!H~!L':~%x&~!H#~!*~%1~!I#~!+A~#p'~!F~~#-#~,,(~.Z~!V~%;'B'mq-W~!N~%I%#&&#&}#%},%%}'%}+X#%}#&}(%}'%}<%}#%}%%'}'%}:~![)9@~%>~#UA%-%##&~!C%~!-.9:~!1~!-^2/:a~!y,D*J#-5)/4~%23,~#G~!L1~!0X3`~!2+~!!0-~&E~!W~!o,>Y&]~%cZx_&~#O*9#A#'#+I'%#)~!0B*-5A+-((F&*M#)(-7-5+'-3a5Vi~!Y~!?+[)%3),ERHm~!+:D,VG.+)?fB%%*(%)'(#&80%1'8`K8?`+'Z#&O&'H5#*9)A%%5&3))0%39+.*7#()&&*=4@**L)<'_&*+..;(#*+)./&0#3)%')-8(4ixD(&.}%,('aI:,)%,k2231T)I'#/-W7,/'Q#.'Y24+h')37</31&83##&0#),H(?'&?/1##%#&&#%''-%&&&#(&''&#.-'%#%%(,')*'&#&#'##%(%(#%('#&##%%%%('%#%#%%#%#&%##h>w+v<ayvyvcg.uuhKr}g/v|g>u9i[~>g5uI~=RvdwEg;v/g;uk!!TTSx]@RT!U!#!@VBRUU!'UTe-d0c`e&gSdicedFcrdTaqb.kYcAohdYd@a3e+d}dMdtd.aJ#bqcK`dle/e.e'dwdPdodddjbEb}ogd^ofdpduc6j?l%d{drdqc)d7bacOdQ%T#Y)X.sR[yH>6Vyv3[xwLu>vo'!*.[yBacahoj>6Rew3[xqdZa#!a&#^(X-[yG>6Vyu3[xvg3sEr|g.u/Ri9db0T#^(Xa)!-[y;>6Vylg4wKs{JwNZt3@3r=c4Z([xlg;wKt!cpq's@v7A'*a(a+!-a#[y<3Dt?3Dt'>6Vym3[xmg9rxsNJwLZt4~?r?db1T#`-!(Xa,!0[yS>6Vz%NuQs.g4wKtnJwNZtS@3r>c4Z([y%g;wKtrdga8!a(!#&T*Y-Xa#!a0<or[yc3Dtq>6Vz43[y3JwNZtf@3s!Ju}!%Dti:pm3c_%X#tjB5pkd6q!r]u?voC'*-a.a2!0a&a+[yI3DtI3Ds~3DtH>6Vyw3[xx;:s#~<5pKJwNZtE@3r~d`a)!a2T#a.(!+U.X1[yT3Dt`3Dtv>6Vz&3[y&g9rxwzcxstPu.<rAJwLZtT~?r@dZa%!a.&^*Za(/Reu[ya>6Vz23[y1g3sEr}wkg{NuQRg{ci(U#5@b`~,cg#U(2WnH5wugcRh7dX#T(Y,a'Ta!!a,[yZ<]mj>6Vz,3[y+Pv#5ReZKu+=,%!H}7ABwkaS?Rh:BcW(X#<]mrj:ubv/ARekdg%!(!a.*Ta(Y.X1!#sP>Rl*Dt6[y>>6Vyo3Wf*jOvuumvuRgRJuq*!:9<B@bX~3jVv&v@s@5Re[d/rQt{uAvo&a&a*)a2!,0Wf!3Dt0=Bs'>6Re}3[xy~<5s%JwJZt1~Gs)c;&!#2sJkNuXvzq7rxu,Re8dka4!a8(aEZ+a@Y.X1Xa)[yd=Bs(3DtP>6Vz53[y4cX#X&Re:avRe9~<5s&JwJZtQ~Gs*i^rzvdRg+Jv{%!2sbB@bX}kdga,!Za?&^*T1/!a'Dt+[y6>6Vyf3Wf%g/u;s4hGu6?Rh-JvZ,!c%#&RoX54Rivj7uyvf8RgTKvZB%*!2sGh<vu5Rgq<=C::9bb~#dZ#T&Ta6Y.X*Dt>[y93Wf)coZ(T,6VyifluvRgC@95@B@bX~/hFu34cC#T,k/unq8w8Q5RkUklwQuzunq8w8Q5Rk8d/rJu?v8w9)-&!a0a;a&aIWejg3sEr/h1s<DtDJvyZqY5aws3Jvy!&Wei~Hr1:au5@Bag>23E~5c:Z&bX};kKv?w&unuVu5Rjc;>bs)#~@:Rh.=ay<a]C;b`}Vd6s/t{uAvoaxa()!a,a7%-a#a2Dt,[yF2Wo[>6Vyt3[xuNuPRi&NuPwpi#RoWh?vf8Ri%Jv]!%Ri:KvxD!.'2WeAjZu`q9rxu,Re7woeAg-unLq(qA_/*2Wg_g3u5q^9:4E}/jTrxrzv=Wkkd~0UX#^^Xa-a1a5T&a=U1a'*aEa]!a*aPaA-adok[y54Rn>;:p3~Dp5g9rpsFNvZqjg3uJp4~<5p0Pw;5qlJwNZt*@3p1Pw:5p/Ou!5p2JvG'!6Vye=<qnJvh_[xhg3v,Rh3kOwOw-sDuev/Re^dha[a%!%!a+#Ta7)-5TaCaO!aka!a)sf[yb2>Rl!9ARiq5E}Qg=ucRkBE|oJrJ_@Wk~@Wk{JrJ_@Wk|@WkyJrJ_@Wk}@WkzJvO_[y2g-vMRmiKuYC!)&>Ri;>Ri<@3RkNc](X#@9Rk=g5vuRmhKvDB!+'=]meg3u4Rmgd)#Y'Vz3CARmfd`a+!%T'!+#Ta1Ta6TaM-sTDt9[yA9sYd'%Y#s[[xpj:ueunaXRgEjRq,v-vuqdd2'`#6Rev<32@5>:2<E}5xIo9a*X#Y(;5RePJvD_g>vyRgNj8w)v8<wggs:RgXiZt|vjx,hSq3ah!-(~@:Ro/Ou!5RhWj^v(pyw8unRhUdx-UY#^Ua.a3a70!)%UX1TaDa)'omRiRRhE[y:3Dsz=Br,>6Vyj3[xkg6ruwjcqsrPw;5r*Ku]D'Zt-@3r(~?r.i[vwv]dU1a--U#`a4(g/vsRhPOu!5RhLj:rmu9Wo!~@:wdh@g/vsRiTjXuvvNr}:RhBj^v(pyw8unRn]dz1UYa'a+^Y(!aETZalaRY.Ta?a4[yDJw1!#qLsW>6Vyrfzq-pLflpwRe|Js>%!Dt@3Dt&Jvy_[xs~HrnjMuwpsw'RecKu+D#'!t<~Grl~?rjg5u-x,gwp{ah!-(~@:Rg~Ou!5Rh'jXuvvNr}:Rh#cW#X/c;&!#2sLi[v7u7RgpJv)(!iLrxu,Re6j7v@s@5Se[e7d`aW!Za(a`T.a#!a3!&aDa-!9)Dt_=6s+3[x~~DR|h~DS6avhGun5RkZj3w)v-]mkKunB!&*]kb97R|i<ARk<c:Z(6Vy}Juh'!wziMRoS:F|vkLuauJv5vtvQRh1d='T+Y#VyO~DR|jcF#T'7R|g97R|kJv3'!ay<Rj,Jvh&!:ReXcsa6*a+#a#_aIRf9aLRf?c,Z&Rf5Rf7c.Z&Rf;Rf>cQ#%T'p-Rf8Rf=ct#%'(*!,p,Rf4p+Rf6Rf:Rf<d~'Ua%U*^UYa(!a,-!#a4YaTalaEX0a8a<Weo3Dt/3Dsx=Br93Wen~Dr;~<5p<JwNZt2@3p=Pw:5p;Ou!5r3c7&!#:p>3Ds}KvGB)_6Vyk2sM=<r7x'eovA(!hFu1ARf}cV#X&@r5j6rvwQa^Rf3c=Za'wkghJv__g;unRggA53B9=b^}%j6uduo5Jq;!(hIv%2Re`Ou4ARe_e%a#^^^Xa&!a*a2!&a6YaP!*ad!#a:aE/5Rn?[y@>6Vyp;:pE~DrY~<5pBJwNZt8@3pCh=rt3rWPw:5pAJup_[xoNuPpF9c!#'45pD5ARn)d8#X'X*3@rU72s]h>v<<sSjJpqvewOJq/(!hNw'5ReBk0s2u3w/w'5ReE5@Jq.!a+JQ!&WeU23d(#Y&RjG5]jBk!u7w&u0udARjEe#+^^^Ub#!a2/a`Z(agT1!a-a;|@TaG!aS[yV=Re~fow'RguNuPRe?bz#'>RoUWeL>:Cbb|?JwPZtVg6ruRmzJvD'!6Vz(g/vmRh~Jvy_[y(g9voRgyx*cy(#2>Ri2B9b]~9kIw9u7rluJu3Rg]dI#a%UY'@=p%CAx.gQZ&RhwwygtRm{x5g_Z'+ABqR9Woa=Bp&dV#^*Xa'!&@o{g4v]Rk;Jv{!%Rk[wkkiA5RkiwwfUB=x,fUuqC&*!>RfTg8v0RfV~ARfSd;rJsAuAv9wR'ae+/aO!a@aza/a#[yQ@Wg!2Wemg3sEr0JvB_g>uvReWg2v+Re=KupB_+[y!2AbY~-~Hr2AJwD!(h<~El>h<~El?Kun@+_:9b`}Kg-v/Ri3g;vtwyk_9]k_d=&T#*U.6qh@Ab`|K9:H|CJv[!&3Dtex'fDwC%!Rf[9WlMd[(^X,!a%Z06Vz!@WgBg=v~Rgvg,QRe@awd,#Y+jTv|Q~EfWj]uNr|~FRfXdy#Y&^Ua%!aO.!(a)Ua;=!a@aKap!a-,a!Ta]a[rSa]p?[y82sK=Bq~;:p:~<5p8Pw:5p7d'#Y'Wf(;RnRi[u4w&RgJJvG'!6Vyh=<r#ijuuv/sIKuYD'ZtG@3p9~Gr&d2#`(g<vtRgFj`u5w&rqpxRf2CJuY!+:wfnTOu!5Rg}jNs1ucv&RfwJvA!&3@q|BDcC#T,k/unq8w8Q5RkTklwQuzunq8w8Q5Rk9dga#!a'!a=#a0!:+Tb*b@aO.a4!aba8aFJv^}?!VyR~Dr<g;u%Rn.~<5p[x'e`wNZtR@3p]Pw:5pZhNvjBp.woe_g5u-r4JwF!%DtO3:ooc7&!#:p^3DtpLuGw(!+%)Dtk6Vz#2sd=<r8d'#Y([y#<x3gJt`w@!)%}MRiowzikRij=]ilxAf3,U(#B2Rf#g0v-Rm[ck{`U#]giKv3>)!&6Ri154s,KuGB_%@r68r:dJ|t`#X(9<E|u2@H|rx3gJu?w'!+'1Nu7Reg4=H~+9<wxgY95Rm]xLggZ-`(X}U2:Ri4h<uOawRmsJv__5@bb{jbV~3dka#a'a]!,#a+U=a>b6a3b%!/aKa/)!arwve^VyJ;:pR~DpTg3uJpS~<5pOPw;5qmPw:5pNOu!5pQJvG'!6Vyx=<qoJvA!{~Jup!%@qk7Rn/KvyD!}''[xz;>wkh'?Rh,x8gyt`w5D!&),(SgyccRgztJ@3pPB5p#d'(Y#<]mmifubw&RgoJvE&!82s^JvF&!8Rf,ADb]~;x=h'rNu]vK!,%'*0RnORh)4Rh*AqQg-vaRnNg;wHwkh'ba~4cE#Ta*x3gctyw@'!+%RnFRnD<4Rn@hFvK5RnCxWg[#`&a0Ua()`1Rm75Rg[c]%X#qi8Rg^NvdRj>BwzgZauwji7Rm6A4wgg]d1#&(*,.0a#Rm;Rm<Rm=Rm>Rm?Rm@RmARmBe%#^^^Xaea?aC/b+(,!a+a#!a/!>a&Ta<aKbD!2wphBRnk[yPw}hE|.=Br-3Dtm>6Vy~g6urRf.x,hPrNav!%'RnqRo%Ro#Nu;q[Pw;5r+JwNZtM@3r)d'#Y'Weh;xChL#`&RnmRnoKu}>%(!Rne~Bs-;2wjcussJv+'!aYSO}6@B<5?ba~8LrNvj!.%*ROwungw~ng~:9;Ri^>wtnig;wHRnixDh@|(UZ.x1h@|)!#:2<H|*xHn]#-UX'3Ro)z=iT}6ARns=Bwsn_wpnaRncw]aR(#UXa&Ua*a/=]iPd'#Y&Ro'WnXf{QRm2hNvj]nZd`'T~&1`{|`#9b]{}c:'!#Wl{>@=be}]?cl{{U#:5Abb}Jds#^YaF!a*b4a#a3aPa>&Tb!bH!*a_!Eau?/a&RjY<]gj>6Vz*;:pe~DrZg,QRj1JwNZtX@wihspcJvZ&!VyX9WmOJu|!|N2WmHJvh&!]ht~Bpbcn&T(!#RmQ<s7Nu;padH#X'`+WmJ@>RmKCARhnKup=!)&Wf+:RhqNuPpf9c!#'45pd5AwghpARn(Ls@w!%,)!RmP@Wfe<E|IJva!&WmNg8vsRmLd`*.`#Y'Xa!axRn*]hrA8Rhug5s@rXg8u!RmMd8#X'X*3@rV72smdI*#UY&RmICARho~GsgxVgd)Ta'U-Y&Xa!T#RnEWnA@Wffg1uDRi0hFvK5RnBxGnG&#`%owp)@wsf+bX}Ze-*1!a*^^^Ua|!#a.aq&Ya2!a>.a6!a:aO`aJDtL[y`@Wg#>6Vz12@wzoYRoZNuPRi!NuPRhzg=ucRi,@=b`{Yg=ucRi-ACJvB!&Sh[ebSh]ebi`wUuFRm4Jw2_[y0JvB!.<Ju(!&SoG}6Shd}6<Ju(!&SoH}6She}6Kur@._g5vHRieJvx!{L2G{Kx6gd'T#?Rh82Wi5cZ#X(g1w)Rm5dW-Y(Ta#!a)!#aYa=wnfE=su2>>bU{0j9udv:<svj8uQv-7RgHdE%#^'sq9sp=>Bb_{TJv`!&g/r|snj6v(us5d,#Y(56H}[978H}]Jw5!&g1rushJvB!+j;v{u5?zDhd}6}bj;v{u5?zDhe}6}ce*#`(^^^a[aea!=!a6a*aoXb1a.!aAbL!b>,b'aL!aV@Wf|2Wlg3[y/JwNZt^@3piPw:5pgJunZou3@rsJva&!Vy_g<v~Rm#JvG'!6Vz0=<r{Ju{%!:pj@WfsiXuJu3Rm:JvZ&!WfA~Bph@c4Z&Dtwax5rubx(#:awRk1@d,#Y&RfjRfid1#,Y(@Wfp2Wlrg5s@ryKu[@!,'=]ig9wlk?Rk>g5u-rqJvy'!@9RkQcH(T#=>Ri~@<wkj(Wj(KuZB*!&<7rw@9RkRcH(T#=>Ri}@<wkj)Wj)dg(Ta2Xa9X#`-!a*CARhg@@=I}d9x;c~#X%so=<sj>2@@=aybb}XjWv0Q~EfEj3vLv;<d,#Y(56H}`978H}_dgaPaFa'a/!#a3Y0a_a;a|!1(a7-[yE3[xt;:pJNvZrrg3uJrvJwNZt=@3pIh=rt3rxPw:5pGOu!5rpJvG'!6Vys=<rz@c4Z&Dt(ax5rtJvZ!&~BpH@wsfNg-vaRlNci*U#=<wei<F}a5@Jq.!a*JQ!%@qZ23d(#Y&RjH5]jCk!u7w&u0udARjFd/prq=tyvpaEa(a:.!a1aZ(@@=I}:9wpd%=<sX55w_h}@@=I{t=ay<aU@@=I}T=ay<2@@=I})?C9:9au@9Cb]}DP~=x-fAZ(2Wl1=ay<aU@@=I}>5@d##Y+jTv|vV~EfFj]uNpn~FRfGdgaK!Z2&!a8a-Tb({E!acTbM*!a(DtY[yYd'%Y#sl[y*hHvh>Re5x2c{Z}.j4uCvcawRiMd+#X+_x&d!},<5RkX;2Hzw@x,gavfB-!{CcF&T#Roe;RodwWbBg5urRgaKvHC*_6Vz+<4opieuew&Rmq@d]&Y)X,T#X0Rh}<BqP=4qS9:ReMg/ujReNJw0!/<Jui%!bd{kawwnemRelAxUa?a3#*.&UX(Ya+a/RhvRnQ<o}9Wmtd-#Y&RgSRmw9;Rmxay=Rmyg-vaRmuxEhSrNu,v-voC!%(aR.a(a7+1Ro1>Ro5CE{A9b]{@;5x#eO{:g;urRi+KrNA!%(Ro3>Ro79;Ri_Ku@>{;&!x%gX|{KunA_+g5QRj/g3u5Rj#g>uERj%wio/xRhS&!,!#^1U}wba{8>>@=be}qC@:D5ba{7Ku+A&!}x?ba}t>>@=be}se(aA^^^Uat!b0#{pa+awUazbGa#aLb9bgaWac'a5TbS=Br!d1#`%scp_Jvl!#rT>Re0JvX&!VyN=H{Fcm#U&:pY=ReaJv2&!]h0=]nUJvG'!6Vy|=<r%JrM_=]h2@Wlud'#)U'Wf'b]{i=]h/Jvh!&~BpWg=v]RnMx+ny#'Nu;pVwjnu=]nwxJnx,T#`&Reqwjnt=]nvieu9vrRjLLuYwP(#+!th@wih5pX~Gr'g5v/Rh4KunA'!-CARnP@wwiN:Rm_9x'cvw>!|l=<saKvAA!0&3@q}>w^e1bp#&Re2Re3BDx7gH#T|f5H|eKuZ>!%(:qNAH{]Jv6!+3B2B9=b^{X<5<B92:E{ZLvhwA(a;a%!igQuyRmad+#Y}m@3Rh5d8#X'X*:AqUAHzmaxwbh<aXRnVcF}RT#Nw&cj#U(BWnug/vsRntdka)(a3+.Zb7aYYan1!bVa@Xa}[y^@b[{G=H{+hFu73Rj&Pv#5ReQcK%T#sig1v{Rj'Ku+D#'!t]~Grm~?rkKuMB!01d5#`'Vy.ta3Dtu~Hroc8#'{^45s85AwZbP&!#Rn!wghxWn#KvEA!)&2RlA2RlBx:h|#(T,=]j09Wobz>x]z/@awRoTd+#Y(az]hFhCrm4d,#Y+jTv|Q~EfMj]uNr|~FRfOdCa!Xa9_X#@<plJvf!%b`{(9;Rgwc;.!#2x7cw#T|UDb]|T5Ju={(!=@E{&Jv)&!Ab`{'awJvf!~*>>@=be{#KuY>!+&4Ezyi[ugv&RjIdea+T)#UXa&T-T&a!Rh9auRmW=]kLg5vuRn+g3u4Rn-Ow6ARn,hHus5xNk?#UX(U~)/g8v0RkD~AwkkF?Ri.OuNBwkkA?Ri/d|a2`a*^UYa.!aBTZaTa'Xa;!(!2!-a#b2[yC>6Vyq3[xr2Wi?g1rusVh%s?DtF~<5rbJs;%!DtBfswKtCj[uvuSsEu3RgVx3o:u+wN'*Zt;@3rd~Grh~?rfg8w)Lq)qE&-a%!>bI|`jWv0vV~EfCjTv|vV~Ef@j]uNpn~FRfBcK#T']gWNu7x,k7q4ai(0!hHv8<RhmkMu9vrsBuev/RhlCJvB!,g<v{wchh~@:Rhji[vrv{wchi~@:RhkdS&a5UY#Ta!RgPwwiI5BwciI~@:Rh`x'iJvj'!5]iJPu8Bwch]~@:Rhach)U#h3rp]gLh@t|Ax,hTq3ah!-(~@:Ro0Ou!5RhXj^v(pyw8unRhVd|)`,^UYas!a?/a2Z'a^Ta{Tb7Ta(a#!a,Wf&9sZ3DtAadamov=Bqt3[xig8vsRm~>waiL2b`{QJv*_Ouv2qgj<v]v2BqfdR'X*X#Y-@3qr~Gqv~?p6hHv-]glPup5Lq+q?_%*b_{qF{n9b^{rOu4ARhpKvCD!+&~Bqp:5Dbb}nwoiKl&unuTuBv]v+ueunaXRf0=Jvh!0nKufu8v1w&w7q%w&uHrz:Rgnj5w,uxDJq/(!hNw'5ReCk0s2u3w/w'5ReFd>Za&!*UaA=<wkgsRnSJv^!%Refifw3vyRgOKu_B'!,<]gkiiu:w&Rh<=C@a^<B57@2F{[<B5@aW:=3away9A5aW=<B=C@a^<B57@2F{Ie-#`(^^^bCara.b8aza6!/bZ,!adTbnTbOb+aFaS!aAT9@Wf~2Wli3Dtl2@d,#Y&RfnRfmJwJZtN~GqyJva&!VyMg<v~Rm%iXuJu3Rm9Jv[_=]ih9wlkDRkCd1#`(@Wg>2Wls3cH#T(@<Rj*=>Ri|b~'#23s9h<~El.d'#Y&Dtxi^rzvdRl#d*#U%(o|B2s`hJwSaxRmDKv4B&!1:Rmdd5#`'Vx}to~Hq{x'f1v3(!BA5ba|bJv_&!Wfug1v]ReIdO+U/Y#&G}-8wze=Rh{g1v]ReHg/uQRf/by#)ibQwERl/cH#T(@<Rj+=>Ri{cNu+vlax-!(#a0qa9<Rii2;;bU{H;x<i=&X#Rk`<4wwi=C9H~8xAI(Y#<azRi@45wXI<B9;5bb~7dL(X#Xa(+!aL6Vy{g5QqOau:5au2@ay547EzbxOcU(UX-T#Ta#:Cbb|A?wjh/b_|SOw6ARgtihr}u7Rhy<d1#T)X1@@=I|~=ay<2@@=aybb}Sj3vLv;<d,#Y(56H}A978H}@dGpvs@uAu`vcw9*!aFa+ai%(b!aXa8.a?a[ozWey=sU2@G}Nch&U#Rf_WexKu+D#'!t:~Gr`~?r^j]uNr|~FRg*j^psurwJt|RmcKv)@&!)7Rkv~Br[@wxfO:Rl3co#U'6Rezj_q#vIuavjRltwzeyh@vr5JqD0!>aY?C9:9au@9Cb]}9cl#U*5;5<H||jbuus1ucv&Rfvg1v~d/pppzqFr^a--a~!aMat1(hFv;Wiz@@=Izoj5uuv-7Rix~Cw`fk2WlVcZ#X,k)u3vWs@u2]ktg;wEx'fBq(_2Wg/jTv|vV~EfoJv]!15x'hzqG!(P~EfU~CRl_j6v(us5x4i-#T(2WmZ?C2F|d>Kq<aj1!*jTqIsBv=Wl`~Cw`fi2WlWj`v0u*~>RlR=c>Z,k#u3vWs@u2]kr<c1Z+jTqIsBv=Wla~Cw`fm2WlXdmb3!a{(arZa`bkTa%TbQTa-a9+c'!aM!/[yL=Bqug.w'RifhFvyDRj.g>vgwyk^9]k^Jv3_@WfbAARkhJw2_[x|JvB_wkoIRoKwkoJRoLd'(Y#<]gm=<9<H|yd'%_X#skDtb3awwqkgNulRkgdB#^',9:p'hJwSaxRmEBwVb8@4=H|qLu+w50&!)@3qs~?pU>Awwn;;Rn=c:Z'ARn<=<qwKvC@!/&~BqqJv6!&]eVb^z^xRge'/a%+^`#Sge}6<4Rn3=]n0Pw2>Rn8Jw0!&>Rn:>Rn6cY#a7+!a&=<wkaNw~h3z_c5Z{=wjh#=]nLKv^D!&)Vyz=bW|swYb<WetcG#T(2wxa@qVx@gD#Y&b^|V5JwG&!5bb|pg/w&RgD@x=kHs=uAvn!a%%/'+RmSRh694Ro`g-vaRmRhHv-]mlxCcS#`&ba~.5cD#Ta)P~=d,#Y(56H{>978H{Dd_#{2^Y%_+qbbb{6g3sERhsbU{?dfa.,`a(Xa<!aiX#(55RiG54RiHcI#T'WiU3RiVNvdwtfcRlKNvdd,#Y&RlHRlExQgf.1*^T'X#Sgf}6Wn4=]hfPrk>Rn7Jw0!&>Rn5>Rn9Lunw?&a2!,5<oq@@wqfdRlJj5Q~=d,#Y(~ARfcOuN]fdDKw;ay(}i!547E}j?cI#T(@5bV}iCbV}hdv(^^Tb?a40,b##Tbo!a*bR!a<b|a/!aKai!aU[yK=]o^g:v>ReGJwPZtK<7Rh+h<~El,Pv#5ReR@awwxjCg,ulRjDJv6&!]j!z?aQeeg>w=Sh<eeJw;!&axEzOg,Qosc!#*:wkeJ]eJ>x'h-u(!%Ro.w~h.zPdNZ(X,Ya![x{;9ReY;wkgxRiF:x?ap#Y&RmUg<s2Rkod]+UY0TZ'!a&A9sw<=bczLNvuw{gqzNhJwSaxRmCKuLay!#&s_Rf-55b^{uJvZa!!c%#(55Ri654wmiu5RiuawLu,vp!+}^%b_}Y9;wkgxba}o>A9:=b^}zKuh=a''!3awRk3c*'!#aHRk6c+Z&Rk5Rk4Jv)&!awRjSawd9*`#0?C2@EzMj8u<uJ5RmbjQrquJu3x,k>uq@_+=ayb^|W~ARkEOuN]k@7dhzV^X/X&a-#zRzSb`zXcJzTT#2WkVKvDBzW!%FzY9;5bbzWjQrquJu3Jw3%!b`zU=ayb^zQd:#X(T-a!6Vyywxh}=b]{Jg=u1RiAdGp~qHtzv!w(wA+a+a;<!aJaYai'anasb(=azRmV:Cbb{MLq2vb!%')RjuRjrRjtRjqx3jnqCw3!%')Rk(Rk+Rk&Rk)Lq2vb!%')Rj{RjxRjzRjwLq2vb!%')RjsRjpRjfRjex3jcqCw3!%')Rk'Rk*RjkRjl9<CbbzfOu4ARhxLq2vb!%')RjyRjvRjhRjgx=joq*uKvb!%')+-Rk.Rk%Rj~Rk-Rk#Rj}x=jdq*uKvb!%')+-Rk,Rk!Rj|RjmRjjRjidAq&qKs@uAv8Aa.'*-a@a&0!aM@a5[y73Dsy3Ds|3Dt):wxgI2sHJwJZt.~Gqxwsf0ikrzt}Rl0Jvy_[xj~HqzKv_A|D!&WfP8axRoVcf,U#k(v]v+ueunaXRf1Ju}'!g8u#Ri=jQw!sCunLprq>!,')~<5qeGzq9F{W=c##%s5au:5aU3CBE|;d4#X(D!a&6Vygx(b;#(=]ed?C2F{N<capoq2r[a&!aPa9,'Pw;5s:@@=I|,55w_h|@@=IzcP~=x'fCqB_2Wl2>aU@@=I|1OuNBc1Z+jTqIsBv=Wlc~Cw`fl2WlZ~AcTa%!Z+jTqIsBv=Wlb~Cw`fh2WlYk+uNqJsBv=WlSg,u3dca3#UXaMYa)TaB-=cM|7T#<bI}l5@B932:aV2G{BOuNBJq:|M!5Ezt=<B=C@a^<B57@2F{v>cB{/T#=ay<bI{3Jv6!a.6BKq0ah&+!5E}HP~Ef{978BaU@@=Iza<7d#.Y#978BaU@@=IzH~AJq0!(@@=IzG978BaU@@=IzFe,aU*Y&^^^bvJb,b:bFad!a,c2Ta>aL.bo6!a#CbTa'T#Re{2Wlh2@G{yg6t~Ro_NvdRfticuRQRllJv3&!x&c|zs@Jw3!%RflwpfkRlpKuL;%(!Re<@G|C2GzdhIvuBwgjAg-u0RjAKQB%!(GzZ@G|5NuuRl7d='T+Y#Vy[g<v~Rm!==G|>JvA!)@wma=]m1ifuaw&RmnLs@vT'!|/+[y,g:v>ReTJw1!#qX=x!eC{bLu+wT&)ZtZauq_~Graci&U#F|89:r_Lupvq!.)&2RlG8RfaC=x!eF{_h?rpWlmd&'!#X|&]k::xJey#`'T|+<E|&2@H|%dE#(^,g;u.RiEg6vjRiC9xCkA{O|zY#g=ucRmXKs0@!&*@G|m@awRknJuh!,3d(}gY}eJvj!%Rm):Jw3!%Rm+Rm-Ls0w(&!a(a#@b[|6cZ#X'7RkxWgAOu4ARn'dH'U#Y*Vz-Wm'CARm}d]*#a%^a*T'aK!a<9bV{PC=p*Jw4!&SgxcbB5r]idw(wBRmF7xFkt#&`(Rm/Rm8E|!JuY_9:Rl5=wrgr2:bbxd@xXfB(a*#T+!.X0X1Ta/a'T&RlDRfL>RlyARl9b[z[>RfZ:RlL:RfRwlg/ARl;9;RlxKv,A/!%7s69<74=BA5ba{-8Bde#`a<XaKYa1,a'P~=wxfB2bZ}}?C972@@=I}r8@55B9;5bb}G978B2@@=aybb}3j3vLv;<Jw3&!>Rfk=ayb^}4~Ad1#`*@@=aybb{w2@>==<bbz]dx+UY#^UaF!a9!bB'Ya1.!ajXa#%olRhD[y=3Dt#Ov5BrHKuMB%!(Rf^Wep~HrJwkiQjKr|~FRg)Ku+D#'!t5~GrF~?rDdV)UY,Z/_7RkuG{<~BrBg,rlsO:235B@bX}|d?a1!#`(6Vyn5@d##Y+jTv|vV~EfIj]uNpn~FRfH7Lq2vb1!a9-978BaU@@=Iz9978BbU}#~AJq0!(@@=Iz8978BaU@@=Iz7~AJQ|}!978BbU}!JvkaK!AdUa21-U#`a+(g/vsRn~Ou!5RPj:rmu9WhOjXuvvNr}:RhAj^v(pyw8unRn[kPr}p|u7vwv]RiSBd;pppzq@qHQa?(b.!a.a`@.|xa(hFv;Wiyj5uuv-7Riw~Cw`fg2WlU978BbU|wOuNBJqG!(P~EfD~CRlQcZ#X,k)u3vWs@u2]ksg;wEx'f@q1_2Wg.j]uNpn~FRfqJv]!15x'h{qG!(@@=IzK~CRl^j6v(us5x4i,#T(2WmY?C2F{1>Kq<aj1!*jTqIsBv=Wld~Cw`fj2Wl[j`v0u*~>RlT=c>Z,k#u3vWs@u2]kq<c1Z+jTqIsBv=Wle~Cw`fn2Wl]dn1#c(a(b^a2!b/bAT(bj!aDa7bu,a_a{c0!2T0g:v>ReD2@G{42@G{5~DpM~<5rc=Bx6i>{RT#RnI@zCx]y]z:2Jv[!zr5Awyk]9]k]dD(Y+X#6Vz.g=wKtgwhaCwgmTWj2Lu,w%_+/[y-B;b^xeg3u3Rj-2@bX{*KrJ<!+'@Wg(g?QRlC@Jv`!%b[zIwsfII}8JQ_@w|kW|=Jv(%!AqcOuNBJvEzh!bYzjLs@wP#(0!oy@>RkdJwMZtc3Dtd@BcG#T'9bWxg2@2Fznd*#Y+;2x'c}w<zizixNgwa#Z'U+!/!a'!a+w~g~z6wcn{Rn}wcnzRn|5Rh%=]nJg5vuRmvNvdRlvcprJu}w*az*a#!%.a.'Bot9qT]kj@Wg'ay2Gzv@Jv`!%b[zEwsfHI}1;ck#Ux`<Cbbx_Lu+w!a&0*!wko*wwo,So,}6Juqxf!E}PigQuyRm`d3(`#8>Rn%:A5B;bZ~%KvhCa!a2!x>k7#Uxb@b{#xaRk7Jw0!)>wwhlShl}6>wwhmShm}6CJvB!.x'hhvj{!!5Bwkhhbaz}x'hivjz~!5Bwkhibaz|xEhTrNu,v-vpD!a%&/)a3a.,%Ro2t[CE{)@3re9b]{%wjo09:rgc:Z&Ro6=<riifuaw&RmoKrNA!%(Ro4>Ro89;Ri`dSaL'UYzxZb)7Rka3xRhT&!,!#^1U}vbaz{>>@=be}yC@:D5bazzKu+A&!}{?ba}y>>@=be}wxBh[t`u~vJvr!%a!a()a,a0a4RoC=]o;Ju(!%RoGRhdwjh`=]oAg>w#Ro?g5vuRo=NvdRl|Ku]C.!&;RoEJvB!%RoORoMBx'h[v+_?w~h`}~5?w~hd~!xKh]oiptu-utv.vp!#%&a30a@a'a+(a/aOp(o~p!RoDJu(!%RoHRhewjha=]oBNvdRl}g>w#Ro@g5vuRo>c[#X']o<CauRoRAd-#Y':RkpauRoQKu]C.!&;RoFJvB!%RoNRoPBx'h]v+_?w~ha}t5?w~he}ue!/UbhYacXaW^Tc&a;b:a-c/#b&aja1(!cL+!bKbt!bmcRc9aIc?8[yW3Dtt94Rg`Jv}!&SiRMzBhEebShEMNuPRe>x7gL#TzuwjirRipc<Z&>on;>z=h-MSh.Mwqczx'a7vj&!>Re4@=ResJt__NuPRi*NuPRi)j]uNr|~FRfzKrJ>_+@Wfy@Wf]2WocKrJ<!+'@Wg%g/QRl@@Jv`!&awRl<wsfFIzgLu(w*!.*&ShBMwvhIRhI9;RhNx1hK'!#Sn]Mx1hK~0!#:2<H~7cNu+w7D*'1ZtW>Rn1~?rOc:Z&Rn2=<rQ<7wjh&=BSnLMc]#X(6Vz)w[b=a!U#9wzgMc3#&(RgMRitRis<x,gKt`ax!&+SioM=BSilMc3#&(RgKRinRimKurB,!&SiQMzBhDebShDM6BJQ!(P~Efx978B2@@=I}WLrJw!!,a*&@G}O@9wkibRid@@x'fKwC!&SlDMSfLMjUv~Q~EfKKv3@a+!(hFv-]mpx/hYZ(C5RiWz<o/MwkhY?So/M@x,gbvfB*&!SgEM:SoeeehFu3:Rgbda(,^TZa)X/7Sg[eb:2RgI~BrMC@wgkc:wwkcRerx3h(uUvK!&*,SnOM4Sh*MArRg;wHRh(x=h;rJvPwI!a4',a'0@Wg&=BSh/Mg>w=Rh=g3w*wwgGRgGcW(X#;Sg}M2Gzk@Jv`!&awRl=wsfGIz`dKZ*T'Y-:RhR7RhQg5u-p`j6v(us5d,#Y+~Awkia?RicOuNBwkibba}Ld6p~tyu_vbAa'a+!a/'a3aEa8a!>Sh,ebJv{!&Sh@ebSaReb9;SgwebNuPRi(NvdRl)NuPRi'hHu^<Rm^Jvv_@Wl(g;u1Si/ebKu'B&!*Sh?eb@Wl'z@aPeb95Si.ebcpputyvjB)!,&a+0a%ShAMWeK@G}C@WfJ9;RhMwvhH9w{ia}ix,hJvRA1(!zAn[MRhHx1hJ~*!#hFv(BSn[MBJQ!(@@=I~'978B2@@=I}2db.Ua<'X}+T#a0XaG2G}E;wkg|wuh!Rh!x,hZu,@)!&So0MVy)C5RiXACJvB!&5RiY5RiZg8w)cG}*T#2@bU}=KsA>(!a.3wkhZba~(x,h^u(A!&(SoCMRhb5Bz=h[eb?w~hb~6x,h_u(A!&(SoDMRhc5Bz=h]eb?w~hc~6e)aA1T#T,^^^c-bMb&blcPaP(a/!0!bA=b5c@a(!bfbrc#2afwmhARnjwchORnp2Wlf3DtsNvdRl-2@wpa<]m0bx(#:awRk2@Jw3!%RfhwpfgRlnKQB%!(G{V@G|'NuuRl6d='T+Y#VyUg<v~Rl~==G|<Jv+'!aYShC}6@B<5?ba~8@Jw3'!g2QRljhLrpWlOd+#Y'g.w'rIg>w*wgj@g-u0Rj@Lu+wT&)ZtUauq]~GrGci&U#F|39:rELrNvj!.%*RhCwunfw~nf~:9;Ri]>wtnhg;wHRnhx3hDs@v~!/+'@Wfr@9RkSNu&Rlo=@<5GzoKs0@_+@Wl+@awRkmJuh!-3d(}pY#qWJvj!%Rm(:Jw3!%Rm,Rm*de&!1U-U#`)Re;@G|.@9Ri82@wjfvRlq=@<5GzpLvOvr!).&2RlF8Rf`C=x!eE{.Jw3_g2QRlkhLrpWlPde(!#U{s,UXa*Ta'[y'g:v>ReS;x0PZ&RnlRnn~HrKJw1}f!=x!eB|2w]aP(#Xa&a*Ta.Ua2a7=]iOd'#Y&Ro&WnWg;u.RiDg6vjRiBNvdRlzhNvj]nYJuW_2Wm3x)kFze{9d])!a.!,Y01!#&aC!a3RndC=ox~BrC@2b^{pg,rlse7x'ksuq!%Rm.E{xidw(wBRmGx9o+)X#wwo-So-}69:Rl4@xSf@a#XZ'X)X,Ta(/ARl8b[xc>RfY:RlI:RfQwlg.ARl:9;Rlwdn'#^XafaQa1X1TaHTa)@b[{zcZ#X'7RkwWg@Ou4ARn&x)kG#{,g7u/RkGdH'U#Y*Vz'Wm&CARm|bx#(A]gUbUzJj9Q~=d,#Y(56H}l978H{U7d,0#U*2>ABb_xZ978BbU{e~AJQ{g!978BbU{hxMh?ad{oUYZ.x1h?{l!#:2<H{mx3n[t{vl!,&a%3Ro(z=iS}6ARnr=Bwsn^wvn`Rnbd`*T}B0!#^X'BG{c9b]{a>>@=be}F?JvS!&BG{d7BG}(Bde#`a1X,Ya@!a'P~=wxf@2bZ}I56B2@@=aybb}08@55B9;5bb}<j3vLv;<Jw3&!>Rfg=ayb^}&OuNBKuLA!)a!P~=x#fD{f2@>==<bbzl?C972@@=Ix^d6rSu,v7w*C(0a)a6#B+a%!sQ[y?3Dt%3[xn~<5rLOu!5p@Ku+D#'!t7~GrP~?rNKvlaya7'!h+v-5qMg=t|cd,U#5AAaa5Abb{S@52B5@a[@52B5Gx[iXueu;d<#`a(!/549C;ag>23ExY5@Dah89b^~689Jv)!~2b[~1Lv'w(%*!a#bX|aPrmawRe]keu7uhv-q6rxu,q`xTo]/a5aU!bNaDXbi!b-!ao!b<bwA!#5@B932:aV2G|:d-)Y#hJrL>RhG<7@C5<H|_=Cau:5aj5@B932:bJ|ng>vIbs)#?C2F|9jPv0w.vISh-MKvUaz(.!9ABbb|[5;5<H|Eg>unwfh;9:4E|YjQsBt|vjx'hYq3!(?C2F|J:2<BaY?C2F|GOu!5x,g|p{ah!-(?C2F|c9:4E|OjXuvvNr}:Rh&i[w*t|cd+U#jJvsu)vsSn~Mkfrmu9p}u7vwv]So!McW#Xa!ax5@A5aY:5;5<H|>kJv~vYrquJu3x4ib#T)2@SmZM?C2F|Bj:rmu9@xPhI(a*a#U#`a3-5Abb|L~@:RhK9:4E|0@52B5G|#C::aY?C2F|-:2<BaY?C2F|.5Jvk!a)javYrquJu3x4ia#T)2@SmYM?C2F|HAxPhH(!a#U#`a*-5Abb|4~@:RhJ9:4E|R@52B5G|F:2<BaY?C2F|Sc^#Xa2j=Qq5CJvB!-g<v{z;hhM?C2F|Zi[vrv{z;hiM?C2F|XKsA>!a)-g<v{z;h[eb?C2F|]i[vrv{z;h]eb?C2F|^iZu.vix,hZq3ah!.(?C2F|QOu!5ShXM:2<BaY?C2F|P", 13494, 2713, 49, 25, 61), A;
(function(e) {
	e[e.VALUE_LENGTH = 49152] = "VALUE_LENGTH", e[e.FLAG13 = 8192] = "FLAG13", e[e.BRANCH_LENGTH = 8064] = "BRANCH_LENGTH", e[e.JUMP_TABLE = 127] = "JUMP_TABLE", e[e.VALUE_MASK = 8191] = "VALUE_MASK";
})(A ||= {});
// node_modules/entities/dist/decode.js
var j;
(function(e) {
	e[e.AMP = 38] = "AMP", e[e.NUM = 35] = "NUM", e[e.SEMI = 59] = "SEMI", e[e.EQUALS = 61] = "EQUALS", e[e.ZERO = 48] = "ZERO", e[e.NINE = 57] = "NINE", e[e.LOWER_A = 97] = "LOWER_A", e[e.LOWER_X = 120] = "LOWER_X";
})(j ||= {});
var $t = 32, en = 21, tn = 2097151, nn = 2047, rn = 0;
function an(e) {
	let t = e >>> en;
	return t === nn ? rn : t;
}
function on(e) {
	return e - j.ZERO >>> 0 <= 9;
}
function sn(e) {
	return (e | $t) - j.LOWER_A >>> 0 <= 5;
}
function cn(e) {
	return (e | $t) - j.LOWER_A >>> 0 <= 25;
}
function ln(e) {
	return e === j.EQUALS || cn(e) || on(e);
}
var un;
(function(e) {
	e[e.EntityStart = 0] = "EntityStart", e[e.NumericStart = 1] = "NumericStart", e[e.NumericDecimal = 2] = "NumericDecimal", e[e.NumericHex = 3] = "NumericHex", e[e.NamedEntity = 4] = "NamedEntity";
})(un ||= {});
var dn;
(function(e) {
	e[e.Legacy = 0] = "Legacy", e[e.Strict = 1] = "Strict", e[e.Attribute = 2] = "Attribute";
})(dn ||= {});
function fn(e, t, n, r) {
	let i = (t & A.BRANCH_LENGTH) >> 7, a = t & A.JUMP_TABLE;
	if (a) {
		if (i === 0) return r === a ? n : -1;
		let t = r - a;
		if (t >>> 0 >= i) return -1;
		let o = e[n + t];
		return o === 0 ? -1 : n + i + o - 1 & 65535;
	}
	if (i === 0) return -1;
	let o = i + 1 >> 1, s = n + o + i;
	for (let t = 0; t < i; t++) {
		let i = e[n + (t >> 1)] >> ((t & 1) << 3) & 255;
		if (i === r) return s + e[n + o + t] & 65535;
		if (i > r) return -1;
	}
	return -1;
}
function pn(e, t, n) {
	return n === 1 ? String.fromCharCode(e[t] & A.VALUE_MASK) : n === 2 ? String.fromCharCode(e[t + 1]) : String.fromCharCode(e[t + 1], e[t + 2]);
}
function mn(e, t, n) {
	let r = t + 1, i = 0, a = r;
	if (r < n && (e.charCodeAt(r) | $t) === j.LOWER_X) for (r += 1, a = r; r < n;) {
		let t = e.charCodeAt(r);
		if (on(t)) i = i * 16 + (t - j.ZERO);
		else if (sn(t)) i = i * 16 + ((t | $t) - j.LOWER_A + 10);
		else break;
		r += 1;
	}
	else for (; r < n;) {
		let t = e.charCodeAt(r) - j.ZERO;
		if (t >>> 0 > 9) break;
		i = i * 10 + t, r += 1;
	}
	if (r === a) return 0;
	r < n && e.charCodeAt(r) === j.SEMI && (r += 1), i > 1114111 && (i = 1114112);
	let o = r - t;
	return o >= nn && (rn = o, o = nn), o << en | i;
}
function hn(e, t, n) {
	let r = Qt, i = e.indexOf("&");
	if (i < 0) return e;
	let a = e.length, o = 0, s = "", c = r[0], l = c & A.JUMP_TABLE, u = (c & A.BRANCH_LENGTH) >> 7;
	do {
		let c = i + 1, d = e.charCodeAt(c), f, p;
		if (d === j.NUM) {
			let n = mn(e, c, a);
			f = an(n), t && f > 0 && e.charCodeAt(c + f - 1) !== j.SEMI && (f = 0), p = f === 0 ? "" : Xt(n & tn);
		} else if (cn(d)) {
			f = 0, p = "";
			let n = d - l, i;
			if (n >>> 0 < u) {
				let e = r[1 + n];
				i = e === 0 ? -1 : u + e & 65535;
			} else i = -1;
			let o = 0, s = 0, m = i < 0 ? 0 : r[i], h = c + 1;
			trie: for (; h < a;) {
				for (; (m & (A.VALUE_LENGTH | A.FLAG13)) === 0 && (m & A.JUMP_TABLE) !== 0;) {
					let t = m & A.JUMP_TABLE, n = (m & A.BRANCH_LENGTH) >> 7;
					if (n === 0) {
						if (e.charCodeAt(h) !== t) break trie;
						i += 1;
					} else {
						let a = e.charCodeAt(h) - t;
						if (a >>> 0 >= n) break trie;
						let o = r[i + 1 + a];
						if (o === 0) break trie;
						i = i + n + o & 65535;
					}
					if (m = r[i], h += 1, h >= a) break trie;
				}
				if ((m & (A.VALUE_LENGTH | A.FLAG13)) === A.FLAG13) {
					let t = (m & A.BRANCH_LENGTH) >> 7;
					if (e.charCodeAt(h) !== (m & A.JUMP_TABLE)) break;
					h += 1;
					let n = t - 1, a = i + 1, o = 0;
					for (; o + 1 < n; o += 2) {
						let t = r[a];
						if (e.charCodeAt(h) !== (t & 255) || (h += 1, e.charCodeAt(h) !== (t >> 8 & 255))) break trie;
						h += 1, a += 1;
					}
					if (o < n) {
						if (e.charCodeAt(h) !== (r[a] & 255)) break;
						h += 1;
					}
					i += 1 + (t >> 1), m = r[i];
					continue;
				}
				let n = m >>> 14, l = e.charCodeAt(h);
				if (n !== 0) {
					if (l === j.SEMI) {
						f = h - c + 1, p = n === 1 ? String.fromCharCode(m & A.VALUE_MASK) : pn(r, i, n);
						break;
					}
					if (!t && (m & A.FLAG13) === 0 && (f = h - c, o = i, s = n), n === 1) break;
				}
				let u = fn(r, m, i + (n || 1), l);
				if (u < 0) break;
				i = u, m = r[i], h += 1;
			}
			if (p === "") {
				let e = m >>> 14;
				e !== 0 && !t && (m & A.FLAG13) === 0 && (f = h - c, o = i, s = e), f > 0 && (p = pn(r, o, s));
			}
		} else f = 0, p = "";
		f === 0 || n && d !== j.NUM && e.charCodeAt(c + f - 1) !== j.SEMI && c + f < a && ln(e.charCodeAt(c + f)) ? i = c : (o < i && (s += e.slice(o, i)), s += p, i = o = c + f), e.charCodeAt(i) !== j.AMP && (i = e.indexOf("&", i));
	} while (i >= 0);
	return s + e.slice(o);
}
function gn(e) {
	return hn(e, !0, !1);
}
// node_modules/linkify-it/build/index.mjs
var _n = class {
	src_Any = Vt.source;
	src_Cc = Ht.source;
	src_Z = Kt.source;
	src_P = Wt.source;
	src_ZPCc = [
		this.src_Z,
		this.src_P,
		this.src_Cc
	].join("|");
	src_ZCc = [this.src_Z, this.src_Cc].join("|");
	cache = {};
	opts = {
		maxLength: 1e4,
		urlAuth: !1,
		schema_names: []
	};
	constructor(e = {}) {
		this.opts = {
			...this.opts,
			...e
		};
	}
	set(e = {}) {
		return this.opts = {
			...this.opts,
			...e
		}, this.cache = {}, this;
	}
	escapeRE(e) {
		return e.replace(/[.?*+^$[\]\\(){}|-]/g, "\\$&");
	}
	nestedPairRE(e, t, n = 4) {
		let r = this.escapeRE(e), i = this.escapeRE(t), a = `(?:(?!${this.src_ZCc}|${r}|${i}).)`, o = `${r}${a}{0,1000}${i}`;
		for (let e = 2; e <= n; e++) o = `${r}(?:${a}|${o}){0,1000}${i}`;
		return o;
	}
	get_text_separators() {
		return this.cache.text_separators ??= /[><\uff5c]/;
	}
	get_pseudo_letter() {
		return this.cache.src_pseudo_letter ??= RegExp(`(?:(?!${this.get_text_separators().source}|${this.src_ZPCc})${this.src_Any})`);
	}
	get_ipv4_addr() {
		return this.cache.src_ip4 ??= /* @__PURE__ */ RegExp("(?:(?:25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9][0-9]|[0-9])[.]){3}(?:25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9][0-9]|[0-9])");
	}
	get_ipv6_addr() {
		let e = "[0-9A-Fa-f]{1,4}", t = `(?:(?:${e}:${e})|${this.get_ipv4_addr().source})`;
		return this.cache.src_ip6_addr ??= RegExp(`(?:(?:${e}:){6}${t}|::(?:${e}:){5}${t}|(?:${e})?::(?:${e}:){4}${t}|(?:(?:${e}:){0,1}${e})?::(?:${e}:){3}${t}|(?:(?:${e}:){0,2}${e})?::(?:${e}:){2}${t}|(?:(?:${e}:){0,3}${e})?::${e}:${t}|(?:(?:${e}:){0,4}${e})?::${t}|(?:(?:${e}:){0,5}${e})?::${e}|(?:(?:${e}:){0,6}${e})?::)`);
	}
	get_ipv6_url_host() {
		return this.cache.src_ip6_host ??= RegExp(`\\[${this.get_ipv6_addr().source}\\]`);
	}
	get_ipv6_mail_host() {
		return this.cache.src_ipv6_mail_host ??= RegExp(`\\[IPv6:${this.get_ipv6_addr().source}\\]`);
	}
	get_auth() {
		return this.cache.src_auth ??= RegExp(`(?:(?:(?!${this.src_ZCc}|[@/\\[\\]()]).){1,50}@)?`);
	}
	get_port() {
		return this.cache.src_port ??= /* @__PURE__ */ RegExp("(?::(?:6(?:[0-4]\\d{3}|5(?:[0-4]\\d{2}|5(?:[0-2]\\d|3[0-5])))|[1-5]?\\d{1,4}))?");
	}
	get_host_terminator() {
		return this.cache.src_host_terminator ??= RegExp(`(?=$|${this.get_text_separators().source}|${this.src_ZPCc})(?!${this.opts["---"] ? "-(?!--)|" : "-|"}_|:\\d|\\.-|\\.(?!$|${this.src_ZPCc}))`);
	}
	get_path_terminator() {
		return this.cache.src_path_terminator ??= RegExp(`${this.src_ZPCc}|${this.get_text_separators().source}`);
	}
	get_path() {
		return this.cache.src_path ??= RegExp(`(?:[/?#](?:${this.nestedPairRE("[", "]")}|${this.nestedPairRE("(", ")")}|${this.nestedPairRE("{", "}")}|\\"(?:(?!${this.src_ZCc}|["]).){1,100}\\"|\\'(?:(?!${this.src_ZCc}|[']).){1,100}\\'|\\'(?=${this.get_pseudo_letter().source}|[-])|\\.{2,20}[:]?[a-zA-Z0-9%/&]|\\.(?!${this.src_ZCc}|[.]|$)|` + (this.opts["---"] ? "\\-(?!--(?:[^-]|$))(?:-{0,19})|" : "\\-{1,20}|") + `,(?!${this.src_ZCc}|$)|;(?!${this.src_ZCc}|$)|\\!{1,20}(?!${this.src_ZCc}|[!]|$)|\\?(?!${this.src_ZCc}|[?]|$)|` + this.get_path_extra().source + `[\\\\/:%@#&=_~*]|(?!${this.get_path_terminator().source}).){1,${this.opts.maxLength}}|\\/)?`);
	}
	get_mail_name() {
		return this.cache.src_mail_name ??= /* @__PURE__ */ RegExp("[-!#$%&'*+/=?^_`{|}~a-zA-Z0-9](?:[-!#$%&'*+/=?^_`{|}~a-zA-Z0-9]|[.](?=[-!#$%&'*+/=?^_`{|}~a-zA-Z0-9])){0,63}");
	}
	get_xn() {
		return this.cache.src_xn ??= /* @__PURE__ */ RegExp("xn--[a-z0-9\\-]{1,59}");
	}
	get_tld() {
		if (this.cache.tld) return this.cache.tld;
		let e = [...new Set(this.opts.tlds || [])].sort().reverse().join("|");
		return this.cache.tld = RegExp(`${e || "$#none#$"}|${this.get_xn().source}`), this.cache.tld;
	}
	get_domain_root() {
		return this.cache.src_domain_root ??= RegExp("(?:" + this.get_xn().source + `|${this.get_pseudo_letter().source}{1,63})`);
	}
	get_domain() {
		return this.cache.src_domain ??= RegExp("(?:" + this.get_xn().source + `|(?:${this.get_pseudo_letter().source})|(?:${this.get_pseudo_letter().source}(?:-|${this.get_pseudo_letter().source}){0,61}${this.get_pseudo_letter().source}))`);
	}
	get_url_host_port() {
		return this.cache.url_host_port ??= RegExp("(?:" + this.get_ipv6_url_host().source + `|(?:(?:(?:${this.get_domain().source})\\.){0,10}${this.get_domain().source}))` + this.get_port().source + this.get_host_terminator().source);
	}
	get_fuzzy_url_host_port() {
		return this.cache.fuzzy_url_host_port ??= RegExp("(?:" + (this.opts.fuzzyIP ? this.get_ipv4_addr().source + "|" : "") + `(?:(?:(?:${this.get_domain().source})\\.){1,10}(?:${this.get_tld().source})))` + this.get_host_terminator().source);
	}
	get_mail_host() {
		return this.cache.src_mail_host ??= RegExp("(?:" + this.get_ipv6_mail_host().source + `|(?:(?:(?:${this.get_domain().source})\\.){0,4}${this.get_domain().source}))` + this.get_host_terminator().source);
	}
	get_fuzzy_mail_host() {
		return this.cache.src_fuzzy_mail_host ??= RegExp("(?:" + this.get_ipv6_mail_host().source + `|(?:(?:(?:${this.get_domain().source})[.]){1,4}${this.get_domain_root().source}))` + this.get_host_terminator().source);
	}
	get_path_extra() {
		return this.cache.src_path_extra ??= /* @__PURE__ */ RegExp("");
	}
	get_fuzzy_mail_host_search() {
		return this.cache.mail_fuzzy_host_search ??= RegExp(`@${this.get_fuzzy_mail_host().source}`, "ig");
	}
	get_fuzzy_link_search() {
		return this.cache.link_fuzzy_search ??= RegExp(`(^|(?![.:/\\-_@])(?:[$+<=>^\`|\uff5c]|${this.src_ZPCc}))(?:(?![$+<=>^\`|\uff5c])${this.get_fuzzy_url_host_port().source}${this.get_path().source})`, "ig");
	}
	get_http_validator() {
		return this.cache.http_validator ??= RegExp("\\/\\/" + (this.opts.urlAuth ? this.get_auth().source : "") + this.get_url_host_port().source + this.get_path().source, "iy");
	}
	get_relative_proto_validator() {
		return this.cache.relative_proto_validator ??= RegExp((this.opts.urlAuth ? this.get_auth().source : "") + `(?:localhost|${this.get_ipv6_url_host().source}|(?:(?:${this.get_domain().source})[.]){1,10}${this.get_domain_root().source})` + this.get_port().source + this.get_host_terminator().source + this.get_path().source, "iy");
	}
	get_mail_name_validator() {
		return this.cache.mail_name_validator ??= RegExp(`(?:^|${this.get_text_separators().source}|"|\\(|${this.src_ZCc})(${this.get_mail_name().source})$`);
	}
	get_mailto_validator() {
		return this.cache.mailto_validator ??= RegExp(`${this.get_mail_name().source}@${this.get_mail_host().source}`, "iy");
	}
	get_schema_names() {
		return this.cache.schema_names ??= new RegExp((this.opts.schema_names || []).map((e) => this.escapeRE(e)).join("|"));
	}
	get_schema_search() {
		return this.cache.schema_search ??= RegExp(`(^|(?!_)(?:[><\uff5c]|${this.src_ZPCc}))(${this.get_schema_names().source})`, "ig");
	}
	get_schema_at_start() {
		return this.cache.schema_at_start ??= RegExp(`^${this.get_schema_search().source}`, "i");
	}
}, vn = {
	validate: (e, t, n) => {
		let r = n.re.get_http_validator();
		r.lastIndex = t;
		let i = r.exec(e);
		return i ? i[0].length : 0;
	},
	normalize: (e, t) => t.normalize(e)
}, yn = {
	"http:": vn,
	"https:": vn,
	"ftp:": vn,
	"//": {
		validate: function(e, t, n) {
			let r = n.re.get_relative_proto_validator();
			r.lastIndex = t;
			let i = r.exec(e);
			return i ? t >= 3 && e[t - 3] === ":" || t >= 3 && e[t - 3] === "/" ? 0 : i[0].length : 0;
		},
		normalize: (e, t) => t.normalize(e)
	},
	"mailto:": {
		validate: function(e, t, n) {
			let r = n.re.get_mailto_validator();
			r.lastIndex = t;
			let i = r.exec(e);
			return i ? i[0].length : 0;
		},
		normalize: (e, t) => t.normalize(e)
	}
}, bn = "a:cdefgilmnoqrstuwxz|b:abdefghijmnorstvwyz|c:acdfghiklmnoruvwxyz|d:ejkmoz|e:cegrstu|f:ijkmor|g:abdefghilmnpqrstuwy|h:kmnrtu|i:delmnoqrst|j:emop|k:eghimnprwyz|l:abcikrstuvy|m:acdeghklmnopqrstuvwxyz|n:acefgilopruz|o:m|p:aefghklmnrstwy|q:a|r:eosuw|s:abcdeghijklmnortuvxyz|t:cdfghjklmnortvwz|u:agksyz|v:aceginu|w:fs|y:et|z:amw", xn = "biz|com|edu|gov|net|org|pro|web|xxx|aero|asia|coop|info|museum|name|shop|рф";
function Sn() {
	let e = xn.split("|");
	return bn.split("|").forEach((t) => {
		let n = t.indexOf(":"), r = t.slice(0, n);
		for (let i of t.slice(n + 1)) e.push(r + i);
	}), e;
}
var Cn = {
	fuzzyLink: !1,
	fuzzyEmail: !0,
	fuzzyIP: !1,
	"---": !1,
	tlds: Sn(),
	urlAuth: !1,
	maxLength: 1e4
}, wn = class {
	schema;
	index;
	lastIndex;
	raw;
	text;
	url;
	constructor(e, t, n, r) {
		let i = e.slice(n, r);
		this.schema = t.toLowerCase(), this.index = n, this.lastIndex = r, this.raw = i, this.text = i, this.url = i;
	}
}, Tn = class {
	__opts__;
	__schemas__;
	re;
	constructor(e = {}) {
		let { rebuilder: t, ...n } = e;
		this.__opts__ = {
			...Cn,
			...n
		}, this.__schemas__ = { ...yn }, this.re = t || new _n(), this.re.set({
			...this.__opts__,
			schema_names: Object.keys(this.__schemas__)
		});
	}
	add(e, t = null) {
		if (!t) delete this.__schemas__[e];
		else {
			let n = {
				normalize: (e, t) => t.normalize(e),
				...t
			};
			this.__schemas__[e] = n;
		}
		return this.re.set({
			...this.__opts__,
			schema_names: Object.keys(this.__schemas__)
		}), this;
	}
	set(e = {}) {
		return this.__opts__ = {
			...this.__opts__,
			...e
		}, this.re.set({
			...this.__opts__,
			schema_names: Object.keys(this.__schemas__)
		}), this;
	}
	test(e) {
		if (!e.length) return !1;
		let t, n;
		for (n = this.re.get_schema_search(), n.lastIndex = 0; (t = n.exec(e)) !== null;) if (this.testSchemaAt(e, t[2], n.lastIndex)) return !0;
		if (this.__opts__.fuzzyLink && this.__schemas__["http:"] && (n = this.re.get_fuzzy_link_search(), n.lastIndex = 0, n.exec(e) !== null)) return !0;
		if (this.__opts__.fuzzyEmail && this.__schemas__["mailto:"] && e.indexOf("@") >= 0) {
			let n = this.re.get_fuzzy_mail_host_search(), r = this.re.get_mail_name_validator();
			for (n.lastIndex = 0; (t = n.exec(e)) !== null;) {
				let n = e.slice(Math.max(0, t.index - 65), t.index);
				if (r.test(n)) return !0;
			}
		}
		return !1;
	}
	testSchemaAt(e, t, n) {
		return this.__schemas__[t.toLowerCase()] ? this.__schemas__[t.toLowerCase()].validate(e.slice(0, n + this.__opts__.maxLength), n, this) : 0;
	}
	match(e) {
		let t = [], n = this.re.get_schema_search(), r, i, a, o, s, c, l = !1, u = !1, d = !1, f = 0;
		if (!e.length) return null;
		for (n.lastIndex = 0, this.__opts__.fuzzyLink && this.__schemas__["http:"] && (r = this.re.get_fuzzy_link_search(), r.lastIndex = 0), this.__opts__.fuzzyEmail && this.__schemas__["mailto:"] && (i = this.re.get_fuzzy_mail_host_search(), i.lastIndex = 0, a = this.re.get_mail_name_validator());;) {
			let p = Math.max(f - 1, 0);
			if (i && a && !d && (!s || s.index < f)) for (i.lastIndex < p && (i.lastIndex = p);;) {
				let t = i.exec(e);
				if (!t) {
					d = !0, s = void 0;
					break;
				}
				let n = a.exec(e.slice(Math.max(0, t.index - 65), t.index));
				if (n) {
					if (s = {
						schema: "mailto:",
						index: t.index - n[1].length,
						lastIndex: t.index + t[0].length
					}, s.index >= f) break;
					i.lastIndex < p && (i.lastIndex = p);
				}
			}
			if (r && !u && (!o || o.index < f)) for (r.lastIndex < p && (r.lastIndex = p);;) {
				let t = r.exec(e);
				if (!t) {
					u = !0, o = void 0;
					break;
				}
				if (o = {
					schema: "",
					index: t.index + t[1].length,
					lastIndex: t.index + t[0].length
				}, o.index >= f) break;
				r.lastIndex < p && (r.lastIndex = p);
			}
			let m = s;
			(!m || o && (o.index < m.index || o.index === m.index && o.lastIndex > m.lastIndex)) && (m = o);
			let h;
			if (!l) for (;;) {
				if (!c) {
					n.lastIndex < p && (n.lastIndex = p);
					let t = n.exec(e);
					if (!t) {
						l = !0;
						break;
					}
					c = {
						schema: t[2],
						index: t.index + t[1].length,
						lastIndex: t.index + t[0].length
					};
				}
				if (c.index < f) {
					c = void 0;
					continue;
				}
				if (m && c.index > m.index) break;
				let t = c;
				c = void 0;
				let r = this.testSchemaAt(e, t.schema, t.lastIndex);
				if (r) {
					h = {
						schema: t.schema,
						index: t.index,
						lastIndex: t.lastIndex + r
					};
					break;
				}
			}
			let g = h;
			if ((!g || s && (s.index < g.index || s.index === g.index && s.lastIndex > g.lastIndex)) && (g = s), (!g || o && (o.index < g.index || o.index === g.index && o.lastIndex > g.lastIndex)) && (g = o), !g) break;
			g === s ? s = void 0 : g === o && (o = void 0);
			let _ = new wn(e, g.schema, g.index, g.lastIndex);
			_.schema ? this.__schemas__[_.schema].normalize(_, this) : this.normalize(_), t.push(_), f = g.lastIndex;
		}
		return t.length ? t : null;
	}
	matchAtStart(e) {
		if (!e.length) return null;
		let t = this.re.get_schema_at_start().exec(e);
		if (!t) return null;
		let n = this.testSchemaAt(e, t[2], t[0].length);
		if (!n) return null;
		let r = new wn(e, t[2], t.index + t[1].length, t.index + t[0].length + n);
		return this.__schemas__[r.schema].normalize(r, this), r;
	}
	tlds(e, t = !1) {
		return e = Array.isArray(e) ? e : [e], t ? this.__opts__.tlds = this.__opts__.tlds.concat(e) : this.__opts__.tlds = e, this.re.set({
			...this.__opts__,
			schema_names: Object.keys(this.__schemas__)
		}), this;
	}
	normalize(e) {
		e.schema || (e.url = `http://${e.url}`), e.schema === "mailto:" && !/^mailto:/i.test(e.url) && (e.url = `mailto:${e.url}`);
	}
}, M = 2147483647, N = 36, En = 1, Dn = 26, On = 38, kn = 700, An = 72, jn = 128, Mn = "-", Nn = /^xn--/, Pn = /[^\0-\x7F]/, Fn = /[\x2E\u3002\uFF0E\uFF61]/g, In = {
	overflow: "Overflow: input needs wider integers to process",
	"not-basic": "Illegal input >= 0x80 (not a basic code point)",
	"invalid-input": "Invalid input"
}, Ln = 35, P = Math.floor, Rn = String.fromCharCode;
function F(e) {
	throw RangeError(In[e]);
}
function zn(e, t) {
	let n = [], r = e.length;
	for (; r--;) n[r] = t(e[r]);
	return n;
}
function Bn(e, t) {
	let n = e.split("@"), r = "";
	n.length > 1 && (r = n[0] + "@", e = n[1]), e = e.replace(Fn, ".");
	let i = zn(e.split("."), t).join(".");
	return r + i;
}
function Vn(e) {
	let t = [], n = 0, r = e.length;
	for (; n < r;) {
		let i = e.charCodeAt(n++);
		if (i >= 55296 && i <= 56319 && n < r) {
			let r = e.charCodeAt(n++);
			(r & 64512) == 56320 ? t.push(((i & 1023) << 10) + (r & 1023) + 65536) : (t.push(i), n--);
		} else t.push(i);
	}
	return t;
}
var Hn = (e) => String.fromCodePoint(...e), Un = function(e) {
	return e >= 48 && e < 58 ? 26 + (e - 48) : e >= 65 && e < 91 ? e - 65 : e >= 97 && e < 123 ? e - 97 : N;
}, Wn = function(e, t) {
	return e + 22 + 75 * (e < 26) - ((t != 0) << 5);
}, Gn = function(e, t, n) {
	let r = 0;
	for (e = n ? P(e / kn) : e >> 1, e += P(e / t); e > 455; r += N) e = P(e / Ln);
	return P(r + 36 * e / (e + On));
}, Kn = function(e) {
	let t = [], n = e.length, r = 0, i = jn, a = An, o = e.lastIndexOf(Mn);
	o < 0 && (o = 0);
	for (let n = 0; n < o; ++n) e.charCodeAt(n) >= 128 && F("not-basic"), t.push(e.charCodeAt(n));
	for (let s = o > 0 ? o + 1 : 0; s < n;) {
		let o = r;
		for (let t = 1, i = N;; i += N) {
			s >= n && F("invalid-input");
			let o = Un(e.charCodeAt(s++));
			o >= N && F("invalid-input"), o > P((M - r) / t) && F("overflow"), r += o * t;
			let c = i <= a ? En : i >= a + Dn ? Dn : i - a;
			if (o < c) break;
			let l = N - c;
			t > P(M / l) && F("overflow"), t *= l;
		}
		let c = t.length + 1;
		a = Gn(r - o, c, o == 0), P(r / c) > M - i && F("overflow"), i += P(r / c), r %= c, t.splice(r++, 0, i);
	}
	return String.fromCodePoint(...t);
}, qn = function(e) {
	let t = [];
	e = Vn(e);
	let n = e.length, r = jn, i = 0, a = An;
	for (let n of e) n < 128 && t.push(Rn(n));
	let o = t.length, s = o;
	for (o && t.push(Mn); s < n;) {
		let n = M;
		for (let t of e) t >= r && t < n && (n = t);
		let c = s + 1;
		n - r > P((M - i) / c) && F("overflow"), i += (n - r) * c, r = n;
		for (let n of e) if (n < r && ++i > M && F("overflow"), n === r) {
			let e = i;
			for (let n = N;; n += N) {
				let r = n <= a ? En : n >= a + Dn ? Dn : n - a;
				if (e < r) break;
				let i = e - r, o = N - r;
				t.push(Rn(Wn(r + i % o, 0))), e = P(i / o);
			}
			t.push(Rn(Wn(e, 0))), a = Gn(i, c, s === o), i = 0, ++s;
		}
		++i, ++r;
	}
	return t.join("");
}, Jn = {
	version: "2.3.1",
	ucs2: {
		decode: Vn,
		encode: Hn
	},
	decode: Kn,
	encode: qn,
	toASCII: function(e) {
		return Bn(e, function(e) {
			return Pn.test(e) ? "xn--" + qn(e) : e;
		});
	},
	toUnicode: function(e) {
		return Bn(e, function(e) {
			return Nn.test(e) ? Kn(e.slice(4).toLowerCase()) : e;
		});
	}
}, Yn = Object.defineProperty, Xn = (e, t) => {
	let n = {};
	for (var r in e) Yn(n, r, {
		get: e[r],
		enumerable: !0
	});
	return t || Yn(n, Symbol.toStringTag, { value: "Module" }), n;
}, Zn = /* @__PURE__ */ Xn({
	arrayReplaceAt: () => $n,
	asciiTrim: () => hr,
	callable: () => Qn,
	escapeHtml: () => R,
	escapeRE: () => dr,
	fromCodePoint: () => I,
	isMdAsciiPunct: () => H,
	isPunctChar: () => fr,
	isPunctCharCode: () => V,
	isSpace: () => z,
	isValidEntityCode: () => er,
	isWhiteSpace: () => B,
	lib: () => gr,
	normalizeReference: () => pr,
	unescapeAll: () => L,
	unescapeMd: () => ar
});
function Qn(e) {
	let t = function(...n) {
		return Reflect.construct(e, n, new.target && new.target !== t ? new.target : e);
	};
	return Object.defineProperty(t, "name", { value: e.name }), Object.setPrototypeOf(t, e), t.prototype = e.prototype, t;
}
function $n(e, t, n) {
	return [].concat(e.slice(0, t), n, e.slice(t + 1));
}
function er(e) {
	return !(e >= 55296 && e <= 57343 || e >= 64976 && e <= 65007 || (e & 65535) == 65535 || (e & 65535) == 65534 || e >= 0 && e <= 8 || e === 11 || e >= 14 && e <= 31 || e >= 127 && e <= 159 || e > 1114111);
}
function I(e) {
	if (e > 65535) {
		e -= 65536;
		let t = 55296 + (e >> 10), n = 56320 + (e & 1023);
		return String.fromCharCode(t, n);
	}
	return String.fromCharCode(e);
}
var tr = /\\([!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~])/g, nr = RegExp(`${tr.source}|&([a-z#][a-z0-9]{1,31});`, "gi"), rr = /^#((?:x[a-f0-9]{1,8}|[0-9]{1,8}))$/i;
function ir(e, t) {
	if (t.charCodeAt(0) === 35 && rr.test(t)) {
		let n = t[1].toLowerCase() === "x" ? parseInt(t.slice(2), 16) : parseInt(t.slice(1), 10);
		return er(n) ? I(n) : e;
	}
	let n = gn(e);
	return n === e ? e : n;
}
function ar(e) {
	return e.indexOf("\\") < 0 ? e : e.replace(tr, "$1");
}
function L(e) {
	return e.indexOf("\\") < 0 && e.indexOf("&") < 0 ? e : e.replace(nr, function(e, t, n) {
		return t || ir(e, n);
	});
}
var or = /[&<>"]/, sr = /[&<>"]/g, cr = {
	"&": "&amp;",
	"<": "&lt;",
	">": "&gt;",
	"\"": "&quot;"
};
function lr(e) {
	return cr[e];
}
function R(e) {
	return or.test(e) ? e.replace(sr, lr) : e;
}
var ur = /[.?*+^$[\]\\(){}|-]/g;
function dr(e) {
	return e.replace(ur, "\\$&");
}
function z(e) {
	switch (e) {
		case 9:
		case 32: return !0;
	}
	return !1;
}
function B(e) {
	if (e >= 8192 && e <= 8202) return !0;
	switch (e) {
		case 9:
		case 10:
		case 11:
		case 12:
		case 13:
		case 32:
		case 160:
		case 5760:
		case 8239:
		case 8287:
		case 12288: return !0;
	}
	return !1;
}
function fr(e) {
	return Wt.test(e) || Gt.test(e);
}
function V(e) {
	return fr(I(e));
}
function H(e) {
	switch (e) {
		case 33:
		case 34:
		case 35:
		case 36:
		case 37:
		case 38:
		case 39:
		case 40:
		case 41:
		case 42:
		case 43:
		case 44:
		case 45:
		case 46:
		case 47:
		case 58:
		case 59:
		case 60:
		case 61:
		case 62:
		case 63:
		case 64:
		case 91:
		case 92:
		case 93:
		case 94:
		case 95:
		case 96:
		case 123:
		case 124:
		case 125:
		case 126: return !0;
		default: return !1;
	}
}
function pr(e) {
	return e = e.trim().replace(/\s+/g, " "), e.toLowerCase().toUpperCase();
}
function mr(e) {
	return e === 32 || e === 9 || e === 10 || e === 13;
}
function hr(e) {
	let t = 0;
	for (; t < e.length && mr(e.charCodeAt(t)); t++);
	let n = e.length - 1;
	for (; n >= t && mr(e.charCodeAt(n)); n--);
	return e.slice(t, n + 1);
}
var gr = {
	mdurl: zt,
	ucmicro: Bt
};
function _r(e, t, n) {
	let r, i, a, o, s = e.posMax, c = e.pos;
	for (e.pos = t + 1, r = 1; e.pos < s;) {
		if (a = e.src.charCodeAt(e.pos), a === 93 && (r--, r === 0)) {
			i = !0;
			break;
		}
		if (o = e.pos, e.md.inline.skipToken(e), a === 91) {
			if (o === e.pos - 1) r++;
			else if (n) return e.pos = c, -1;
		}
	}
	let l = -1;
	return i && (l = e.pos), e.pos = c, l;
}
function vr(e, t, n) {
	let r, i = t, a = {
		ok: !1,
		pos: 0,
		str: ""
	};
	if (e.charCodeAt(i) === 60) {
		for (i++; i < n;) {
			if (r = e.charCodeAt(i), r === 10 || r === 60) return a;
			if (r === 62) return a.pos = i + 1, a.str = L(e.slice(t + 1, i)), a.ok = !0, a;
			r === 92 && i + 1 < n ? i += 2 : i++;
		}
		return a;
	}
	let o = 0;
	for (; i < n && (r = e.charCodeAt(i), !(r === 32 || r < 32 || r === 127));) if (r === 92 && i + 1 < n) {
		if (e.charCodeAt(i + 1) === 32) {
			i++;
			continue;
		}
		i += 2;
	} else {
		if (r === 40 && (o++, o > 32)) return a;
		if (r === 41) {
			if (o === 0) break;
			o--;
		}
		i++;
	}
	return t === i || o !== 0 || (a.str = L(e.slice(t, i)), a.pos = i, a.ok = !0), a;
}
function yr(e, t, n, r) {
	let i, a = t, o = {
		ok: !1,
		can_continue: !1,
		pos: 0,
		str: "",
		marker: 0
	};
	if (r) o.str = r.str, o.marker = r.marker;
	else {
		if (a >= n) return o;
		let r = e.charCodeAt(a);
		if (r !== 34 && r !== 39 && r !== 40) return o;
		t++, a++, r === 40 && (r = 41), o.marker = r;
	}
	for (; a < n;) {
		if (i = e.charCodeAt(a), i === o.marker) return o.pos = a + 1, o.str += L(e.slice(t, a)), o.ok = !0, o;
		if (i === 40 && o.marker === 41) return o;
		i === 92 && a + 1 < n && a++, a++;
	}
	return o.can_continue = !0, o.str += L(e.slice(t, a)), o;
}
var br = /* @__PURE__ */ Xn({
	parseLinkDestination: () => vr,
	parseLinkLabel: () => _r,
	parseLinkTitle: () => yr
});
function U(e) {
	"@babel/helpers - typeof";
	return U = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(e) {
		return typeof e;
	} : function(e) {
		return e && typeof Symbol == "function" && e.constructor === Symbol && e !== Symbol.prototype ? "symbol" : typeof e;
	}, U(e);
}
function xr(e, t) {
	if (U(e) != "object" || !e) return e;
	var n = e[Symbol.toPrimitive];
	if (n !== void 0) {
		var r = n.call(e, t || "default");
		if (U(r) != "object") return r;
		throw TypeError("@@toPrimitive must return a primitive value.");
	}
	return (t === "string" ? String : Number)(e);
}
function Sr(e) {
	var t = xr(e, "string");
	return U(t) == "symbol" ? t : t + "";
}
function W(e, t, n) {
	return (t = Sr(t)) in e ? Object.defineProperty(e, t, {
		value: n,
		enumerable: !0,
		configurable: !0,
		writable: !0
	}) : e[t] = n, e;
}
var G = class {
	constructor(e, t, n) {
		W(this, "map", null), W(this, "level", 0), W(this, "children", null), W(this, "content", ""), W(this, "markup", ""), W(this, "info", ""), W(this, "block", !1), W(this, "hidden", !1), this.type = e, this.tag = t, this.attrs = null, this.nesting = n, this.meta = null;
	}
	attrIndex(e) {
		if (!this.attrs) return -1;
		let t = this.attrs;
		for (let n = 0, r = t.length; n < r; n++) if (t[n][0] === e) return n;
		return -1;
	}
	attrPush(e) {
		this.attrs ? this.attrs.push(e) : this.attrs = [e];
	}
	attrSet(e, t) {
		let n = this.attrIndex(e), r = [e, t];
		n < 0 ? this.attrPush(r) : this.attrs[n] = r;
	}
	attrGet(e) {
		let t = this.attrIndex(e), n = null;
		return t >= 0 && (n = this.attrs[t][1]), n;
	}
	attrJoin(e, t) {
		let n = this.attrIndex(e);
		n < 0 ? this.attrPush([e, t]) : this.attrs[n][1] = `${this.attrs[n][1]} ${t}`;
	}
}, K = class {
	constructor() {
		W(this, "__rules__", []), W(this, "__cache__", null);
	}
	__find__(e) {
		for (let t = 0; t < this.__rules__.length; t++) if (this.__rules__[t].name === e) return t;
		return -1;
	}
	__compile__() {
		let e = /* @__PURE__ */ new Set();
		this.__rules__.forEach((t) => {
			t.enabled && t.alt.forEach((t) => {
				t && e.add(t);
			});
		}), this.__cache__ = Object.create(null), this.__cache__[""] = [], this.__rules__.forEach((e) => {
			e.enabled && this.__cache__[""].push(e.fn);
		}), e.forEach((e) => {
			this.__cache__[e] = [], this.__rules__.forEach((t) => {
				t.enabled && t.alt.indexOf(e) >= 0 && this.__cache__[e].push(t.fn);
			});
		});
	}
	at(e, t, n = {}) {
		let r = this.__find__(e);
		if (r === -1) throw Error(`Parser rule not found: ${e}`);
		this.__rules__[r].fn = t, this.__rules__[r].alt = n.alt || [], this.__cache__ = null;
	}
	before(e, t, n, r = {}) {
		let i = this.__find__(e);
		if (i === -1) throw Error(`Parser rule not found: ${e}`);
		this.__rules__.splice(i, 0, {
			name: t,
			enabled: !0,
			fn: n,
			alt: r.alt || []
		}), this.__cache__ = null;
	}
	after(e, t, n, r = {}) {
		let i = this.__find__(e);
		if (i === -1) throw Error(`Parser rule not found: ${e}`);
		this.__rules__.splice(i + 1, 0, {
			name: t,
			enabled: !0,
			fn: n,
			alt: r.alt || []
		}), this.__cache__ = null;
	}
	push(e, t, n = {}) {
		this.__rules__.push({
			name: e,
			enabled: !0,
			fn: t,
			alt: n.alt || []
		}), this.__cache__ = null;
	}
	enable(e, t = !1) {
		Array.isArray(e) || (e = [e]);
		let n = [];
		return e.forEach((e) => {
			let r = this.__find__(e);
			if (r < 0) {
				if (t) return;
				throw Error(`Rules manager: invalid rule name ${e}`);
			}
			this.__rules__[r].enabled = !0, n.push(e);
		}), this.__cache__ = null, n;
	}
	enableOnly(e, t = !1) {
		Array.isArray(e) || (e = [e]), this.__rules__.forEach((e) => {
			e.enabled = !1;
		}), this.enable(e, t);
	}
	disable(e, t = !1) {
		Array.isArray(e) || (e = [e]);
		let n = [];
		return e.forEach((e) => {
			let r = this.__find__(e);
			if (r < 0) {
				if (t) return;
				throw Error(`Rules manager: invalid rule name ${e}`);
			}
			this.__rules__[r].enabled = !1, n.push(e);
		}), this.__cache__ = null, n;
	}
	getRules(e) {
		return this.__cache__ || this.__compile__(), this.__cache__[e] || [];
	}
}, q = {};
q.code_inline = function(e, t, n, r, i) {
	let a = e[t];
	return `<code${i.renderAttrs(a)}>${R(a.content)}</code>`;
}, q.code_block = function(e, t, n, r, i) {
	let a = e[t];
	return `<pre${i.renderAttrs(a)}><code>${R(e[t].content)}</code></pre>\n`;
}, q.fence = function(e, t, n, r, i) {
	let a = e[t], o = a.info ? L(a.info).trim() : "", s = "", c = "";
	if (o) {
		let e = o.split(/(\s+)/g);
		s = e[0], c = e.slice(2).join("");
	}
	let l;
	if (l = n.highlight && n.highlight(a.content, s, c) || R(a.content), l.indexOf("<pre") === 0) return l + "\n";
	if (o) {
		let e = a.attrIndex("class"), t = a.attrs ? a.attrs.slice() : [];
		e < 0 ? t.push(["class", `${n.langPrefix}${s}`]) : (t[e] = [t[e][0], t[e][1]], t[e][1] += ` ${n.langPrefix}${s}`);
		let r = { attrs: t };
		return `<pre><code${i.renderAttrs(r)}>${l}</code></pre>\n`;
	}
	return `<pre><code${i.renderAttrs(a)}>${l}</code></pre>\n`;
}, q.image = function(e, t, n, r, i) {
	let a = e[t];
	return a.attrs[a.attrIndex("alt")][1] = i.renderInlineAsText(a.children, n, r), i.renderToken(e, t, n);
}, q.hardbreak = function(e, t, n) {
	return n.xhtmlOut ? "<br />\n" : "<br>\n";
}, q.softbreak = function(e, t, n) {
	return n.breaks ? n.xhtmlOut ? "<br />\n" : "<br>\n" : "\n";
}, q.text = function(e, t) {
	return R(e[t].content);
}, q.html_block = function(e, t) {
	return e[t].content;
}, q.html_inline = function(e, t) {
	return e[t].content;
};
var Cr = class {
	constructor() {
		W(this, "rules", Object.assign({}, q));
	}
	renderAttrs(e) {
		let t, n, r;
		if (!e.attrs) return "";
		for (r = "", t = 0, n = e.attrs.length; t < n; t++) r += ` ${R(e.attrs[t][0])}="${R(String(e.attrs[t][1]))}"`;
		return r;
	}
	renderToken(e, t, n) {
		let r = e[t], i = "";
		if (r.hidden) return "";
		let a = t - 1;
		for (; a >= 0 && e[a].hidden && e[a].nesting === 0;) a--;
		r.block && r.nesting !== -1 && a >= 0 && e[a].hidden && e[a].nesting === -1 && (i += "\n"), i += (r.nesting === -1 ? "</" : "<") + r.tag, i += this.renderAttrs(r), r.nesting === 0 && n.xhtmlOut && (i += " /");
		let o = !1;
		if (r.block && (o = !0, r.nesting === 1)) {
			let n = t + 1;
			for (; n < e.length && e[n].hidden && e[n].nesting === 0;) n++;
			if (n < e.length) {
				let t = e[n];
				(t.type === "inline" || t.hidden || t.nesting === -1 && t.tag === r.tag) && (o = !1);
			}
		}
		return i += o ? ">\n" : ">", i;
	}
	renderInline(e, t, n) {
		let r = "", i = this.rules;
		for (let a = 0, o = e.length; a < o; a++) {
			let o = e[a].type;
			i[o] === void 0 ? r += this.renderToken(e, a, t) : r += i[o](e, a, t, n, this);
		}
		return r;
	}
	renderInlineAsText(e, t, n) {
		let r = "";
		for (let i = 0, a = e.length; i < a; i++) switch (e[i].type) {
			case "text":
			case "code_inline":
				r += e[i].content;
				break;
			case "image":
				r += this.renderInlineAsText(e[i].children, t, n);
				break;
			case "html_inline":
			case "html_block":
				r += e[i].content;
				break;
			case "softbreak":
			case "hardbreak": r += "\n";
		}
		return r;
	}
	render(e, t, n) {
		let r = "", i = this.rules;
		for (let a = 0, o = e.length; a < o; a++) {
			let o = e[a].type;
			o === "inline" ? r += this.renderInline(e[a].children, t, n) : i[o] === void 0 ? r += this.renderToken(e, a, t) : r += i[o](e, a, t, n, this);
		}
		return r;
	}
}, wr = class {
	constructor(e, t, n) {
		W(this, "tokens", []), W(this, "inlineMode", !1), W(this, "Token", G), this.src = e, this.env = n, this.md = t;
	}
}, Tr = /\r\n?/g, Er = /\0/g;
function Dr(e) {
	let t;
	t = e.src.replace(Tr, "\n"), t = t.replace(Er, "�"), e.src = t;
}
function Or(e) {
	let t;
	e.inlineMode ? (t = new e.Token("inline", "", 0), t.content = e.src, t.map = [0, 1], t.children = [], e.tokens.push(t)) : e.md.block.parse(e.src, e.md, e.env, e.tokens);
}
function kr(e) {
	let t = e.tokens, n = 0;
	for (let e = 0; e < t.length; e++) t[e].type !== "reference_definition" && (e !== n && (t[n] = t[e]), n++);
	t.length !== n && (t.length = n);
}
function Ar(e) {
	let t = e.tokens;
	for (let n = 0, r = t.length; n < r; n++) {
		let r = t[n];
		r.type === "inline" && e.md.inline.parse(r.content, e.md, e.env, r.children);
	}
}
function jr(e) {
	return /^<a[>\s]/i.test(e);
}
function Mr(e) {
	return /^<\/a\s*>/i.test(e);
}
function Nr(e) {
	let t = e.tokens;
	if (e.md.options.linkify) for (let n = 0, r = t.length; n < r; n++) {
		if (t[n].type !== "inline" || !e.md.linkify.test(t[n].content)) continue;
		let r = t[n].children, i = [], a = 0;
		for (let t = r.length - 1; t >= 0; t--) {
			let n = r[t];
			if (n.type === "link_close") for (t--; r[t].level !== n.level && r[t].type !== "link_open";) t--;
			else if (n.type === "html_inline" && (jr(n.content) && a > 0 && a--, Mr(n.content) && a++), !(a > 0) && n.type === "text" && e.md.linkify.test(n.content)) {
				let a = n.content, o = e.md.linkify.match(a), s = [], c = n.level, l = 0;
				o.length > 0 && o[0].index === 0 && t > 0 && r[t - 1].type === "text_special" && (o = o.slice(1));
				for (let t = 0; t < o.length; t++) {
					let n = o[t].url, r = e.md.normalizeLink(n);
					if (!e.md.validateLink(r)) continue;
					let i = o[t].text;
					i = o[t].schema ? o[t].schema === "mailto:" && !/^mailto:/i.test(i) ? e.md.normalizeLinkText(`mailto:${i}`).replace(/^mailto:/, "") : e.md.normalizeLinkText(i) : e.md.normalizeLinkText(`http://${i}`).replace(/^http:\/\//, "");
					let u = o[t].index;
					if (u > l) {
						let t = new e.Token("text", "", 0);
						t.content = a.slice(l, u), t.level = c, s.push(t);
					}
					let d = new e.Token("link_open", "a", 1);
					d.attrs = [["href", r]], d.level = c++, d.markup = "linkify", d.info = "auto", s.push(d);
					let f = new e.Token("text", "", 0);
					f.content = i, f.level = c, s.push(f);
					let p = new e.Token("link_close", "a", -1);
					p.level = --c, p.markup = "linkify", p.info = "auto", s.push(p), l = o[t].lastIndex;
				}
				if (l < a.length) {
					let t = new e.Token("text", "", 0);
					t.content = a.slice(l), t.level = c, s.push(t);
				}
				i.push({
					index: t,
					nodes: s
				});
			}
		}
		if (i.length > 0) {
			let e = r.length;
			for (let t of i) e += t.nodes.length - 1;
			let a = Array(e), o = 0, s = 0;
			i.reverse();
			for (let e = 0; e < r.length; e++) {
				let t = i[o];
				if (t?.index === e) {
					for (let e of t.nodes) a[s++] = e;
					o++;
				} else a[s++] = r[e];
			}
			t[n].children = a;
		}
	}
}
var Pr = /\+-|\.\.|\?\?\?\?|!!!!|,,|--/, Fr = /\((c|tm|r)\)/i, Ir = /\((c|tm|r)\)/gi, Lr = {
	c: "©",
	r: "®",
	tm: "™"
};
function Rr(e, t) {
	return Lr[t.toLowerCase()];
}
function zr(e) {
	let t = 0;
	for (let n = e.length - 1; n >= 0; n--) {
		let r = e[n];
		r.type === "text" && !t && (r.content = r.content.replace(Ir, Rr)), r.type === "link_open" && r.info === "auto" && t--, r.type === "link_close" && r.info === "auto" && t++;
	}
}
function Br(e) {
	let t = 0;
	for (let n = e.length - 1; n >= 0; n--) {
		let r = e[n];
		r.type === "text" && !t && Pr.test(r.content) && (r.content = r.content.replace(/\+-/g, "±").replace(/\.{2,}/g, "…").replace(/([?!])…/g, "$1..").replace(/([?!]){4,}/g, "$1$1$1").replace(/,{2,}/g, ",").replace(/(^|[^-])---(?=[^-]|$)/gm, "$1—").replace(/(^|\s)--(?=\s|$)/gm, "$1–").replace(/(^|[^-\s])--(?=[^-\s]|$)/gm, "$1–")), r.type === "link_open" && r.info === "auto" && t--, r.type === "link_close" && r.info === "auto" && t++;
	}
}
function Vr(e) {
	let t;
	if (e.md.options.typographer) for (t = e.tokens.length - 1; t >= 0; t--) e.tokens[t].type === "inline" && (Fr.test(e.tokens[t].content) && zr(e.tokens[t].children), Pr.test(e.tokens[t].content) && Br(e.tokens[t].children));
}
var Hr = /['"]/, Ur = /['"]/g, Wr = "’", Gr = 1e3;
function Kr(e, t, n) {
	for (; e.length > n;) {
		let n = e.pop();
		n.isSingleQuote ? t.single = n.prevSameQuoteIdx : t.double = n.prevSameQuoteIdx;
	}
}
function qr(e, t, n, r) {
	e[t] || (e[t] = []), e[t].push({
		pos: n,
		ch: r
	});
}
function Jr(e, t) {
	let n = "", r = 0;
	t.sort((e, t) => e.pos - t.pos);
	for (let i = 0; i < t.length; i++) {
		let a = t[i];
		n += e.slice(r, a.pos) + a.ch, r = a.pos + 1;
	}
	return n + e.slice(r);
}
function Yr(e, t) {
	let n, r = [], i = {
		single: -1,
		double: -1
	}, a = {};
	for (let o = 0; o < e.length; o++) {
		let s = e[o], c = e[o].level;
		for (n = r.length - 1; n >= 0 && !(r[n].level <= c); n--);
		if (Kr(r, i, n + 1), s.type !== "text") continue;
		let l = s.content, u = 0, d = l.length;
		OUTER: for (; u < d;) {
			Ur.lastIndex = u;
			let s = Ur.exec(l);
			if (!s) break;
			let f = !0, p = !0;
			u = s.index + 1;
			let m = s[0] === "'", h = 32;
			if (s.index - 1 >= 0) h = l.charCodeAt(s.index - 1);
			else for (n = o - 1; n >= 0 && e[n].type !== "softbreak" && e[n].type !== "hardbreak"; n--) if (e[n].content) {
				h = e[n].content.charCodeAt(e[n].content.length - 1);
				break;
			}
			let g = 32;
			if (u < d) g = l.charCodeAt(u);
			else for (n = o + 1; n < e.length && e[n].type !== "softbreak" && e[n].type !== "hardbreak"; n++) if (e[n].content) {
				g = e[n].content.charCodeAt(0);
				break;
			}
			let _ = H(h) || V(h), v = H(g) || V(g), y = B(h), b = B(g);
			if (b ? f = !1 : v && (y || _ || (f = !1)), y ? p = !1 : _ && (b || v || (p = !1)), g === 34 && s[0] === "\"" && h >= 48 && h <= 57 && (p = f = !1), f && p && (f = _, p = v), !f && !p) m && qr(a, o, s.index, Wr);
			else {
				if (p && (n = m ? i.single : i.double, n >= 0 && r[n].level === c)) {
					let e = r[n], c, l;
					m ? (c = t.md.options.quotes[2], l = t.md.options.quotes[3]) : (c = t.md.options.quotes[0], l = t.md.options.quotes[1]), qr(a, o, s.index, l), qr(a, e.tokenIdx, e.contentPos, c), Kr(r, i, n);
					continue OUTER;
				}
				if (f) {
					if (r.length >= Gr) return;
					r.push({
						tokenIdx: o,
						contentPos: s.index,
						isSingleQuote: m,
						level: c,
						prevSameQuoteIdx: m ? i.single : i.double
					}), m ? i.single = r.length - 1 : i.double = r.length - 1;
				} else p && m && qr(a, o, s.index, Wr);
			}
		}
	}
	Object.keys(a).forEach(function(t) {
		let n = Number(t);
		e[n].content = Jr(e[n].content, a[t]);
	});
}
function Xr(e) {
	if (e.md.options.typographer) for (let t = e.tokens.length - 1; t >= 0; t--) e.tokens[t].type === "inline" && Hr.test(e.tokens[t].content) && Yr(e.tokens[t].children, e);
}
function Zr(e) {
	let t, n, r = e.length;
	for (t = 0; t < r; t++) e[t].type === "text_special" && (e[t].type = "text");
	for (t = n = 0; t < r; t++) e[t].type === "text" && t + 1 < r && e[t + 1].type === "text" ? e[t + 1].content = e[t].content + e[t + 1].content : (t !== n && (e[n] = e[t]), n++);
	t !== n && (e.length = n);
}
function Qr(e) {
	let t, n, r = e.tokens, i = r.length;
	for (let e = 0; e < i; e++) {
		if (r[e].type !== "inline") continue;
		let i = r[e].children, a = i.length;
		for (t = 0; t < a; t++) i[t].type === "text_special" && (i[t].type = "text"), i[t].children && Zr(i[t].children);
		for (t = n = 0; t < a; t++) i[t].type === "text" && t + 1 < a && i[t + 1].type === "text" ? i[t + 1].content = i[t].content + i[t + 1].content : (t !== n && (i[n] = i[t]), n++);
		t !== n && (i.length = n);
	}
}
var $r = [
	["normalize", Dr],
	["block", Or],
	["strip_references", kr],
	["inline", Ar],
	["linkify", Nr],
	["replacements", Vr],
	["smartquotes", Xr],
	["text_join", Qr]
], ei = class {
	constructor() {
		W(this, "ruler", new K()), W(this, "State", wr);
		for (let e = 0; e < $r.length; e++) this.ruler.push($r[e][0], $r[e][1]);
	}
	process(e) {
		let t = this.ruler.getRules("");
		for (let n = 0, r = t.length; n < r; n++) t[n](e);
	}
}, ti = class {
	constructor(e, t, n, r) {
		W(this, "bMarks", []), W(this, "eMarks", []), W(this, "tShift", []), W(this, "sCount", []), W(this, "bsCount", []), W(this, "blkIndent", 0), W(this, "line", 0), W(this, "lineMax", 0), W(this, "tight", !1), W(this, "listIndent", -1), W(this, "parentType", "root"), W(this, "level", 0), W(this, "Token", G), this.src = e, this.md = t, this.env = n, this.tokens = r;
		let i = this.src;
		for (let e = 0, t = 0, n = 0, r = 0, a = i.length, o = !1; t < a; t++) {
			let s = i.charCodeAt(t);
			if (!o) {
				if (z(s)) {
					n++, s === 9 ? r += 4 - r % 4 : r++;
					continue;
				}
				o = !0;
			}
			(s === 10 || t === a - 1) && (s !== 10 && t++, this.bMarks.push(e), this.eMarks.push(t), this.tShift.push(n), this.sCount.push(r), this.bsCount.push(0), o = !1, n = 0, r = 0, e = t + 1);
		}
		this.bMarks.push(i.length), this.eMarks.push(i.length), this.tShift.push(0), this.sCount.push(0), this.bsCount.push(0), this.lineMax = this.bMarks.length - 1;
	}
	push(e, t, n) {
		let r = new G(e, t, n);
		return r.block = !0, n < 0 && this.level--, r.level = this.level, n > 0 && this.level++, this.tokens.push(r), r;
	}
	isEmpty(e) {
		return this.bMarks[e] + this.tShift[e] >= this.eMarks[e];
	}
	skipEmptyLines(e) {
		for (let t = this.lineMax; e < t && !(this.bMarks[e] + this.tShift[e] < this.eMarks[e]); e++);
		return e;
	}
	skipSpaces(e) {
		for (let t = this.src.length; e < t && z(this.src.charCodeAt(e)); e++);
		return e;
	}
	skipSpacesBack(e, t) {
		if (e <= t) return e;
		for (; e > t;) if (!z(this.src.charCodeAt(--e))) return e + 1;
		return e;
	}
	skipChars(e, t) {
		for (let n = this.src.length; e < n && this.src.charCodeAt(e) === t; e++);
		return e;
	}
	skipCharsBack(e, t, n) {
		if (e <= n) return e;
		for (; e > n;) if (t !== this.src.charCodeAt(--e)) return e + 1;
		return e;
	}
	getLines(e, t, n, r) {
		if (e >= t) return "";
		let i = Array(t - e);
		for (let a = 0, o = e; o < t; o++, a++) {
			let e = 0, s = this.bMarks[o], c = s, l;
			for (l = o + 1 < t || r ? this.eMarks[o] + 1 : this.eMarks[o]; c < l && e < n;) {
				let t = this.src.charCodeAt(c);
				if (z(t)) t === 9 ? e += 4 - (e + this.bsCount[o]) % 4 : e++;
				else if (c - s < this.tShift[o]) e++;
				else break;
				c++;
			}
			e > n ? i[a] = Array(e - n + 1).join(" ") + this.src.slice(c, l) : i[a] = this.src.slice(c, l);
		}
		return i.join("");
	}
}, ni = 65536;
function ri(e, t) {
	let n = e.bMarks[t] + e.tShift[t], r = e.eMarks[t];
	return e.src.slice(n, r);
}
function ii(e) {
	let t = [], n = e.length, r = 0, i = e.charCodeAt(r), a = !1, o = 0, s = "";
	for (; r < n;) i === 124 && (a ? (s += e.substring(o, r - 1), o = r) : (t.push(s + e.substring(o, r)), s = "", o = r + 1)), a = i === 92, r++, i = e.charCodeAt(r);
	return t.push(s + e.substring(o)), t;
}
function ai(e, t, n, r) {
	if (t + 2 > n) return !1;
	let i = t + 1;
	if (e.sCount[i] < e.blkIndent || e.sCount[i] - e.blkIndent >= 4) return !1;
	let a = e.bMarks[i] + e.tShift[i];
	if (a >= e.eMarks[i]) return !1;
	let o = e.src.charCodeAt(a++);
	if (o !== 124 && o !== 45 && o !== 58 || a >= e.eMarks[i]) return !1;
	let s = e.src.charCodeAt(a++);
	if (s !== 124 && s !== 45 && s !== 58 && !z(s) || o === 45 && z(s)) return !1;
	for (; a < e.eMarks[i];) {
		let t = e.src.charCodeAt(a);
		if (t !== 124 && t !== 45 && t !== 58 && !z(t)) return !1;
		a++;
	}
	let c = ri(e, t + 1), l = c.split("|"), u = [];
	for (let e = 0; e < l.length; e++) {
		let t = l[e].trim();
		if (!t) {
			if (e === 0 || e === l.length - 1) continue;
			return !1;
		}
		if (!/^:?-+:?$/.test(t)) return !1;
		t.charCodeAt(t.length - 1) === 58 ? u.push(t.charCodeAt(0) === 58 ? "center" : "right") : t.charCodeAt(0) === 58 ? u.push("left") : u.push("");
	}
	if (c = ri(e, t).trim(), c.indexOf("|") === -1 || e.sCount[t] - e.blkIndent >= 4) return !1;
	l = ii(c), l.length && l[0] === "" && l.shift(), l.length && l[l.length - 1] === "" && l.pop();
	let d = l.length;
	if (d === 0 || d !== u.length) return !1;
	if (r) return !0;
	let f = e.parentType;
	e.parentType = "table";
	let p = e.md.block.ruler.getRules("blockquote"), m = e.push("table_open", "table", 1), h = [t, 0];
	m.map = h;
	let g = e.push("thead_open", "thead", 1);
	g.map = [t, t + 1];
	let _ = e.push("tr_open", "tr", 1);
	_.map = [t, t + 1];
	for (let t = 0; t < l.length; t++) {
		let n = e.push("th_open", "th", 1);
		u[t] && (n.attrs = [["style", `text-align:${u[t]}`]]);
		let r = e.push("inline", "", 0);
		r.content = l[t].trim(), r.children = [], e.push("th_close", "th", -1);
	}
	e.push("tr_close", "tr", -1), e.push("thead_close", "thead", -1);
	let v, y = 0;
	for (i = t + 2; i < n && !(e.sCount[i] < e.blkIndent); i++) {
		let r = !1;
		for (let t = 0, a = p.length; t < a; t++) if (p[t](e, i, n, !0)) {
			r = !0;
			break;
		}
		if (r || (c = ri(e, i).trim(), !c) || e.sCount[i] - e.blkIndent >= 4 || (l = ii(c), l.length && l[0] === "" && l.shift(), l.length && l[l.length - 1] === "" && l.pop(), y += d - l.length, y > ni)) break;
		if (i === t + 2) {
			let n = e.push("tbody_open", "tbody", 1);
			n.map = v = [t + 2, 0];
		}
		let a = e.push("tr_open", "tr", 1);
		a.map = [i, i + 1];
		for (let t = 0; t < d; t++) {
			let n = e.push("td_open", "td", 1);
			u[t] && (n.attrs = [["style", `text-align:${u[t]}`]]);
			let r = e.push("inline", "", 0);
			r.content = l[t] ? l[t].trim() : "", r.children = [], e.push("td_close", "td", -1);
		}
		e.push("tr_close", "tr", -1);
	}
	return v && (e.push("tbody_close", "tbody", -1), v[1] = i), e.push("table_close", "table", -1), h[1] = i, e.parentType = f, e.line = i, !0;
}
function oi(e, t, n) {
	if (e.sCount[t] - e.blkIndent < 4) return !1;
	let r = t + 1, i = r;
	for (; r < n;) if (e.isEmpty(r)) r++;
	else if (e.sCount[r] - e.blkIndent >= 4) r++, i = r;
	else break;
	e.line = i;
	let a = e.push("code_block", "code", 0);
	return a.content = e.getLines(t, i, 4 + e.blkIndent, !1) + "\n", a.map = [t, e.line], !0;
}
function si(e, t, n, r) {
	let i = e.bMarks[t] + e.tShift[t], a = e.eMarks[t];
	if (e.sCount[t] - e.blkIndent >= 4 || i + 3 > a) return !1;
	let o = e.src.charCodeAt(i);
	if (o !== 126 && o !== 96) return !1;
	let s = i;
	i = e.skipChars(i, o);
	let c = i - s;
	if (c < 3) return !1;
	let l = e.src.slice(s, i), u = e.src.slice(i, a);
	if (o === 96 && u.indexOf(String.fromCharCode(o)) >= 0) return !1;
	if (r) return !0;
	let d = t, f = !1;
	for (; d++, !(d >= n || (i = s = e.bMarks[d] + e.tShift[d], a = e.eMarks[d], i < a && e.sCount[d] < e.blkIndent));) if (e.src.charCodeAt(i) === o && !(e.sCount[d] - e.blkIndent >= 4) && (i = e.skipChars(i, o), !(i - s < c) && (i = e.skipSpaces(i), !(i < a)))) {
		f = !0;
		break;
	}
	c = e.sCount[t], e.line = d + +!!f;
	let p = e.push("fence", "code", 0);
	return p.info = u, p.content = e.getLines(t + 1, d, c, !0), p.markup = l, p.map = [t, e.line], !0;
}
function ci(e, t, n, r) {
	let i = e.bMarks[t] + e.tShift[t], a = e.eMarks[t], o = e.lineMax;
	if (e.sCount[t] - e.blkIndent >= 4 || e.src.charCodeAt(i) !== 62) return !1;
	if (r) return !0;
	let s = [], c = [], l = [], u = [], d = e.md.block.ruler.getRules("blockquote"), f = e.parentType;
	e.parentType = "blockquote";
	let p = !1, m;
	for (m = t; m < n; m++) {
		let t = e.sCount[m] < e.blkIndent;
		if (i = e.bMarks[m] + e.tShift[m], a = e.eMarks[m], i >= a) break;
		if (e.src.charCodeAt(i++) === 62 && !t) {
			let t = e.sCount[m] + 1, n, r;
			e.src.charCodeAt(i) === 32 ? (i++, t++, r = !1, n = !0) : e.src.charCodeAt(i) === 9 ? (n = !0, (e.bsCount[m] + t) % 4 == 3 ? (i++, t++, r = !1) : r = !0) : n = !1;
			let o = t;
			for (s.push(e.bMarks[m]), e.bMarks[m] = i; i < a;) {
				let t = e.src.charCodeAt(i);
				if (z(t)) t === 9 ? o += 4 - (o + e.bsCount[m] + +!!r) % 4 : o++;
				else break;
				i++;
			}
			p = i >= a, c.push(e.bsCount[m]), e.bsCount[m] = e.sCount[m] + 1 + +!!n, l.push(e.sCount[m]), e.sCount[m] = o - t, u.push(e.tShift[m]), e.tShift[m] = i - e.bMarks[m];
			continue;
		}
		if (p) break;
		let r = !1;
		for (let t = 0, i = d.length; t < i; t++) if (d[t](e, m, n, !0)) {
			r = !0;
			break;
		}
		if (r) {
			e.lineMax = m, e.blkIndent !== 0 && (s.push(e.bMarks[m]), c.push(e.bsCount[m]), u.push(e.tShift[m]), l.push(e.sCount[m]), e.sCount[m] -= e.blkIndent);
			break;
		}
		s.push(e.bMarks[m]), c.push(e.bsCount[m]), u.push(e.tShift[m]), l.push(e.sCount[m]), e.sCount[m] = -1;
	}
	let h = e.blkIndent;
	e.blkIndent = 0;
	let g = e.push("blockquote_open", "blockquote", 1);
	g.markup = ">";
	let _ = [t, 0];
	g.map = _, e.md.block.tokenize(e, t, m);
	let v = e.push("blockquote_close", "blockquote", -1);
	v.markup = ">", e.lineMax = o, e.parentType = f, _[1] = e.line;
	for (let n = 0; n < u.length; n++) e.bMarks[n + t] = s[n], e.tShift[n + t] = u[n], e.sCount[n + t] = l[n], e.bsCount[n + t] = c[n];
	return e.blkIndent = h, !0;
}
function li(e, t, n, r) {
	let i = e.eMarks[t];
	if (e.sCount[t] - e.blkIndent >= 4) return !1;
	let a = e.bMarks[t] + e.tShift[t], o = e.src.charCodeAt(a++);
	if (o !== 42 && o !== 45 && o !== 95) return !1;
	let s = 1;
	for (; a < i;) {
		let t = e.src.charCodeAt(a++);
		if (t !== o && !z(t)) return !1;
		t === o && s++;
	}
	if (s < 3) return !1;
	if (r) return !0;
	e.line = t + 1;
	let c = e.push("hr", "hr", 0);
	return c.map = [t, e.line], c.markup = Array(s + 1).join(String.fromCharCode(o)), !0;
}
function ui(e, t) {
	let n = e.eMarks[t], r = e.bMarks[t] + e.tShift[t], i = e.src.charCodeAt(r++);
	return i !== 42 && i !== 45 && i !== 43 || r < n && !z(e.src.charCodeAt(r)) ? -1 : r;
}
function di(e, t) {
	let n = e.bMarks[t] + e.tShift[t], r = e.eMarks[t], i = n;
	if (i + 1 >= r) return -1;
	let a = e.src.charCodeAt(i++);
	if (a < 48 || a > 57) return -1;
	for (;;) {
		if (i >= r) return -1;
		if (a = e.src.charCodeAt(i++), a >= 48 && a <= 57) {
			if (i - n >= 10) return -1;
		} else {
			if (a === 41 || a === 46) break;
			return -1;
		}
	}
	return i < r && (a = e.src.charCodeAt(i), !z(a)) ? -1 : i;
}
function fi(e, t) {
	let n = e.level + 2;
	for (let r = t + 2, i = e.tokens.length - 2; r < i; r++) e.tokens[r].level === n && e.tokens[r].type === "paragraph_open" && (e.tokens[r + 2].hidden = !0, e.tokens[r].hidden = !0, r += 2);
}
function pi(e, t, n, r) {
	let i, a, o, s, c = t, l = !0;
	if (e.sCount[c] - e.blkIndent >= 4 || e.listIndent >= 0 && e.sCount[c] - e.listIndent >= 4 && e.sCount[c] < e.blkIndent) return !1;
	let u = !1;
	r && e.parentType === "paragraph" && e.sCount[c] >= e.blkIndent && (u = !0);
	let d, f, p;
	if ((p = di(e, c)) >= 0) {
		if (d = !0, o = e.bMarks[c] + e.tShift[c], f = Number(e.src.slice(o, p - 1)), u && f !== 1) return !1;
	} else if ((p = ui(e, c)) >= 0) d = !1;
	else return !1;
	if (u && e.skipSpaces(p) >= e.eMarks[c]) return !1;
	if (r) return !0;
	let m = e.src.charCodeAt(p - 1), h = e.tokens.length;
	d ? (s = e.push("ordered_list_open", "ol", 1), f !== 1 && (s.attrs = [["start", f]])) : s = e.push("bullet_list_open", "ul", 1);
	let g = [c, 0];
	s.map = g, s.markup = String.fromCharCode(m);
	let _ = !1, v = e.md.block.ruler.getRules("list"), y = e.parentType;
	for (e.parentType = "list"; c < n;) {
		a = p, i = e.eMarks[c];
		let t = e.sCount[c] + p - (e.bMarks[c] + e.tShift[c]), r = t;
		for (; a < i;) {
			let t = e.src.charCodeAt(a);
			if (t === 9) r += 4 - (r + e.bsCount[c]) % 4;
			else if (t === 32) r++;
			else break;
			a++;
		}
		let u = a, f;
		f = u >= i ? 1 : r - t, f > 4 && (f = 1);
		let h = t + f;
		s = e.push("list_item_open", "li", 1), s.markup = String.fromCharCode(m);
		let g = [c, 0];
		s.map = g, d && (s.info = e.src.slice(o, p - 1));
		let y = e.tight, b = e.tShift[c], x = e.sCount[c], S = e.listIndent;
		if (e.listIndent = e.blkIndent, e.blkIndent = h, e.tight = !0, e.tShift[c] = u - e.bMarks[c], e.sCount[c] = r, u >= i && e.isEmpty(c + 1) ? e.line = Math.min(e.line + 2, n) : e.md.block.tokenize(e, c, n), (!e.tight || _) && (l = !1), _ = e.line - c > 1 && e.isEmpty(e.line - 1), e.blkIndent = e.listIndent, e.listIndent = S, e.tShift[c] = b, e.sCount[c] = x, e.tight = y, s = e.push("list_item_close", "li", -1), s.markup = String.fromCharCode(m), c = e.line, g[1] = c, c >= n || e.sCount[c] < e.blkIndent || e.sCount[c] - e.blkIndent >= 4) break;
		let C = !1;
		for (let t = 0, r = v.length; t < r; t++) if (v[t](e, c, n, !0)) {
			C = !0;
			break;
		}
		if (C) break;
		if (d) {
			if (p = di(e, c), p < 0) break;
			o = e.bMarks[c] + e.tShift[c];
		} else if (p = ui(e, c), p < 0) break;
		if (m !== e.src.charCodeAt(p - 1)) break;
	}
	return s = d ? e.push("ordered_list_close", "ol", -1) : e.push("bullet_list_close", "ul", -1), s.markup = String.fromCharCode(m), g[1] = c, e.line = c, e.parentType = y, l && fi(e, h), !0;
}
var mi = 999;
function hi(e) {
	let t = e.length;
	for (let n = 0; n < e.length - 1; n++) {
		let r = e.charCodeAt(n);
		if (r < 55296 || r > 56319) continue;
		let i = e.charCodeAt(n + 1);
		i >= 56320 && i <= 57343 && (t--, n++);
	}
	return t;
}
function J(e, t) {
	return Math.min(e.eMarks[t] + 1, e.src.length);
}
function gi(e, t) {
	let n = e.lineMax;
	if (t >= n || e.isEmpty(t)) return -1;
	let r = !1;
	if (e.sCount[t] - e.blkIndent > 3 && (r = !0), e.sCount[t] < 0 && (r = !0), !r) {
		let r = e.md.block.ruler.getRules("reference"), i = e.parentType;
		e.parentType = "reference";
		let a = !1;
		for (let i = 0, o = r.length; i < o; i++) if (r[i](e, t, n, !0)) {
			a = !0;
			break;
		}
		if (e.parentType = i, a) return -1;
	}
	return e.bMarks[t] + e.tShift[t];
}
function _i(e, t, n, r) {
	let i = e.src, a = e.bMarks[t] + e.tShift[t], o = t + 1;
	if (e.sCount[t] - e.blkIndent >= 4 || i.charCodeAt(a) !== 91) return !1;
	let s = J(e, t), c = "", l = -1, u = ++a;
	for (; a < s;) {
		if (c.length + a - u > mi * 2) return !1;
		let t = i.charCodeAt(a);
		if (t === 91) return !1;
		if (t === 93) {
			l = a;
			break;
		}
		if (t === 92 && (t = i.charCodeAt(++a)), t === 10 && a < s) {
			let t = gi(e, o);
			if (t < 0) return !1;
			c += i.slice(u, s), a = u = t, s = J(e, o++);
		} else a++;
	}
	if (l < 0 || i.charCodeAt(l + 1) !== 58 || (c += i.slice(u, l), c.length > mi && hi(c) > mi)) return !1;
	for (a = l + 2; a < s;) {
		let t = i.charCodeAt(a);
		if (t === 10) {
			let t = gi(e, o);
			if (t < 0) break;
			a = t, s = J(e, o++);
		} else if (z(t)) a++;
		else break;
	}
	let d = e.md.helpers.parseLinkDestination(i, a, s);
	if (!d.ok) return !1;
	let f = e.md.normalizeLink(d.str);
	if (!e.md.validateLink(f)) return !1;
	a = d.pos;
	let p = a, m = s, h = o;
	for (; a < s;) {
		let t = i.charCodeAt(a);
		if (t === 10) {
			let t = gi(e, o);
			if (t < 0) break;
			a = t, s = J(e, o++);
		} else if (z(t)) a++;
		else break;
	}
	let g = a, _ = e.md.helpers.parseLinkTitle(i, a, s);
	for (; _.can_continue;) {
		let t = gi(e, o);
		if (t < 0) break;
		a = t, s = J(e, o++), _ = e.md.helpers.parseLinkTitle(i, a, s, _);
	}
	let v;
	for (g !== p && _.ok ? (v = _.str, a = _.pos) : (v = "", a = p, s = m, o = h); a < s && z(i.charCodeAt(a));) a++;
	if (a < s && i.charCodeAt(a) !== 10 && v) for (v = "", a = p, s = m, o = h; a < s && z(i.charCodeAt(a));) a++;
	if (a < s && i.charCodeAt(a) !== 10) return !1;
	let y = pr(c);
	if (!y) return !1;
	/* istanbul ignore if */
	if (r) return !0;
	e.env.references === void 0 && (e.env.references = {}), e.env.references[y] === void 0 && (e.env.references[y] = {
		title: v,
		href: f
	});
	let b = e.push("reference_definition", "", 0);
	b.map = [t, o], b.hidden = !0;
	let x = Object.create(null);
	return x.label = y, b.meta = x, e.line = o, !0;
}
var vi = /* @__PURE__ */ "address.article.aside.base.basefont.blockquote.body.caption.center.col.colgroup.dd.details.dialog.dir.div.dl.dt.fieldset.figcaption.figure.footer.form.frame.frameset.h1.h2.h3.h4.h5.h6.head.header.hr.html.iframe.legend.li.link.main.menu.menuitem.nav.noframes.ol.optgroup.option.p.param.search.section.summary.table.tbody.td.tfoot.th.thead.title.tr.track.ul".split("."), yi = "<[A-Za-z][A-Za-z0-9\\-]*(?:\\s+[a-zA-Z_:][a-zA-Z0-9:._-]*(?:\\s*=\\s*(?:[^\"'=<>`\\x00-\\x20]+|'[^']*'|\"[^\"]*\"))?)*\\s*\\/?>", bi = "<\\/[A-Za-z][A-Za-z0-9\\-]*\\s*>";
RegExp(`^(?:${yi}|${bi}|<!---?>|<!--(?:[^-]|-[^-]|--[^>])*-->|<[?][\\s\\S]*?[?]>|<![A-Za-z][^>]*>|<!\\[CDATA\\[[\\s\\S]*?\\]\\]>)`);
var xi = RegExp(`^(?:${yi}|${bi})`), Y = [
	[
		/^<(script|pre|style|textarea)(?=(\s|>|$))/i,
		/<\/(script|pre|style|textarea)>/i,
		!0
	],
	[
		/^<!--/,
		/-->/,
		!0
	],
	[
		/^<\?/,
		/\?>/,
		!0
	],
	[
		/^<![A-Za-z]/,
		/>/,
		!0
	],
	[
		/^<!\[CDATA\[/,
		/\]\]>/,
		!0
	],
	[
		RegExp(`^</?(${vi.join("|")})(?=(\\s|/?>|$))`, "i"),
		/^$/,
		!0
	],
	[
		RegExp(`${xi.source}\\s*$`),
		/^$/,
		!1
	]
];
function Si(e, t, n, r) {
	let i = e.bMarks[t] + e.tShift[t], a = e.eMarks[t];
	if (e.sCount[t] - e.blkIndent >= 4 || !e.md.options.html || e.src.charCodeAt(i) !== 60) return !1;
	let o = e.src.slice(i, a), s = 0;
	for (; s < Y.length && !Y[s][0].test(o); s++);
	if (s === Y.length) return !1;
	if (r) return Y[s][2];
	let c = t + 1, l = Y[s][1].test("");
	if (!Y[s][1].test(o)) {
		for (; c < n && !(e.sCount[c] < e.blkIndent && (l || !e.isEmpty(c))); c++) if (i = e.bMarks[c] + e.tShift[c], a = e.eMarks[c], o = e.src.slice(i, a), Y[s][1].test(o)) {
			o.length !== 0 && c++;
			break;
		}
	}
	e.line = c;
	let u = e.push("html_block", "", 0);
	return u.map = [t, c], u.content = e.getLines(t, c, e.blkIndent, !0), !0;
}
function Ci(e, t, n, r) {
	let i = e.bMarks[t] + e.tShift[t], a = e.eMarks[t];
	if (e.sCount[t] - e.blkIndent >= 4) return !1;
	let o = e.src.charCodeAt(i);
	if (o !== 35 || i >= a) return !1;
	let s = 1;
	for (o = e.src.charCodeAt(++i); o === 35 && i < a && s <= 6;) s++, o = e.src.charCodeAt(++i);
	if (s > 6 || i < a && !z(o)) return !1;
	if (r) return !0;
	a = e.skipSpacesBack(a, i);
	let c = e.skipCharsBack(a, 35, i);
	c > i && z(e.src.charCodeAt(c - 1)) && (a = c), e.line = t + 1;
	let l = e.push("heading_open", `h${s}`, 1);
	l.markup = "########".slice(0, s), l.map = [t, e.line];
	let u = e.push("inline", "", 0);
	u.content = hr(e.src.slice(i, a)), u.map = [t, e.line], u.children = [];
	let d = e.push("heading_close", `h${s}`, -1);
	return d.markup = "########".slice(0, s), !0;
}
function wi(e, t, n) {
	let r = e.md.block.ruler.getRules("paragraph");
	if (e.sCount[t] - e.blkIndent >= 4) return !1;
	let i = e.parentType;
	e.parentType = "paragraph";
	let a = 0, o, s = t + 1;
	for (; s < n && !e.isEmpty(s); s++) {
		if (e.sCount[s] - e.blkIndent > 3) continue;
		if (e.sCount[s] >= e.blkIndent) {
			let t = e.bMarks[s] + e.tShift[s], n = e.eMarks[s];
			if (t < n && (o = e.src.charCodeAt(t), (o === 45 || o === 61) && (t = e.skipChars(t, o), t = e.skipSpaces(t), t >= n))) {
				a = o === 61 ? 1 : 2;
				break;
			}
		}
		if (e.sCount[s] < 0) continue;
		let t = !1;
		for (let i = 0, a = r.length; i < a; i++) if (r[i](e, s, n, !0)) {
			t = !0;
			break;
		}
		if (t) break;
	}
	if (!a) return e.parentType = i, !1;
	let c = hr(e.getLines(t, s, e.blkIndent, !1));
	e.line = s + 1;
	let l = e.push("heading_open", `h${a}`, 1);
	l.markup = String.fromCharCode(o), l.map = [t, e.line];
	let u = e.push("inline", "", 0);
	u.content = c, u.map = [t, e.line - 1], u.children = [];
	let d = e.push("heading_close", `h${a}`, -1);
	return d.markup = String.fromCharCode(o), e.parentType = i, !0;
}
function Ti(e, t, n) {
	let r = e.md.block.ruler.getRules("paragraph"), i = e.parentType, a = t + 1;
	for (e.parentType = "paragraph"; a < n && !e.isEmpty(a); a++) {
		if (e.sCount[a] - e.blkIndent > 3 || e.sCount[a] < 0) continue;
		let t = !1;
		for (let i = 0, o = r.length; i < o; i++) if (r[i](e, a, n, !0)) {
			t = !0;
			break;
		}
		if (t) break;
	}
	let o = hr(e.getLines(t, a, e.blkIndent, !1));
	e.line = a;
	let s = e.push("paragraph_open", "p", 1);
	s.map = [t, e.line];
	let c = e.push("inline", "", 0);
	return c.content = o, c.map = [t, e.line], c.children = [], e.push("paragraph_close", "p", -1), e.parentType = i, !0;
}
var Ei = [
	[
		"table",
		ai,
		["paragraph", "reference"]
	],
	["code", oi],
	[
		"fence",
		si,
		[
			"paragraph",
			"reference",
			"blockquote",
			"list"
		]
	],
	[
		"blockquote",
		ci,
		[
			"paragraph",
			"reference",
			"blockquote",
			"list"
		]
	],
	[
		"hr",
		li,
		[
			"paragraph",
			"reference",
			"blockquote",
			"list"
		]
	],
	[
		"list",
		pi,
		[
			"paragraph",
			"reference",
			"blockquote"
		]
	],
	["reference", _i],
	[
		"html_block",
		Si,
		[
			"paragraph",
			"reference",
			"blockquote"
		]
	],
	[
		"heading",
		Ci,
		[
			"paragraph",
			"reference",
			"blockquote"
		]
	],
	["lheading", wi],
	["paragraph", Ti]
], Di = class {
	constructor() {
		W(this, "ruler", new K()), W(this, "State", ti);
		for (let e = 0; e < Ei.length; e++) this.ruler.push(Ei[e][0], Ei[e][1], { alt: (Ei[e][2] || []).slice() });
	}
	tokenize(e, t, n) {
		let r = this.ruler.getRules(""), i = r.length, a = e.md.options.maxNesting, o = t, s = !1;
		for (; o < n && (e.line = o = e.skipEmptyLines(o), !(o >= n || e.sCount[o] < e.blkIndent));) {
			if (e.level >= a) {
				e.line = n;
				break;
			}
			let t = e.line, c = !1;
			for (let a = 0; a < i; a++) if (c = r[a](e, o, n, !1), c) {
				if (t >= e.line) throw Error("block rule didn't increment state.line");
				break;
			}
			if (!c) throw Error("none of the block rules matched");
			e.tight = !s, e.isEmpty(e.line - 1) && (s = !0), o = e.line, o < n && e.isEmpty(o) && (s = !0, o++, e.line = o);
		}
	}
	parse(e, t, n, r) {
		if (!e) return;
		let i = new this.State(e, t, n, r);
		this.tokenize(i, i.line, i.lineMax);
	}
}, Oi = class {
	constructor(e, t, n, r) {
		W(this, "pos", 0), W(this, "level", 0), W(this, "pending", ""), W(this, "pendingLevel", 0), W(this, "cache", {}), W(this, "backticks", {}), W(this, "backticksScanned", !1), W(this, "skipHtmlSpecial", !1), W(this, "linkLevel", 0), W(this, "delimiters", []), W(this, "_prev_delimiters", []), W(this, "Token", G), this.src = e, this.env = n, this.md = t, this.tokens = r, this.tokens_meta = Array(r.length), this.posMax = this.src.length;
	}
	pushPending() {
		let e = new G("text", "", 0);
		return e.content = this.pending, e.level = this.pendingLevel, this.tokens.push(e), this.pending = "", e;
	}
	push(e, t, n) {
		this.pending && this.pushPending();
		let r = new G(e, t, n), i;
		return n < 0 && (this.level--, this.delimiters = this._prev_delimiters.pop()), r.level = this.level, n > 0 && (this.level++, this._prev_delimiters.push(this.delimiters), this.delimiters = [], i = { delimiters: this.delimiters }), this.pendingLevel = this.level, this.tokens.push(r), this.tokens_meta.push(i), r;
	}
	scanDelims(e, t) {
		let n = this.posMax, r = this.src.charCodeAt(e), i;
		if (e === 0) i = 32;
		else if (e === 1) i = this.src.charCodeAt(0), (i & 63488) == 55296 && (i = 65533);
		else if (i = this.src.charCodeAt(e - 1), (i & 64512) == 56320) {
			let t = this.src.charCodeAt(e - 2);
			i = (t & 64512) == 55296 ? 65536 + (t - 55296 << 10) + (i - 56320) : 65533;
		} else (i & 64512) == 55296 && (i = 65533);
		let a = e;
		for (; a < n && this.src.charCodeAt(a) === r;) a++;
		let o = a - e, s = a < n ? this.src.charCodeAt(a) : 32;
		if ((s & 64512) == 55296) {
			let e = this.src.charCodeAt(a + 1);
			s = (e & 64512) == 56320 ? 65536 + (s - 55296 << 10) + (e - 56320) : 65533;
		} else (s & 64512) == 56320 && (s = 65533);
		let c = H(i) || V(i), l = H(s) || V(s), u = B(i), d = B(s), f = !d && (!l || u || c), p = !u && (!c || d || l);
		return {
			can_open: f && (t || !p || c),
			can_close: p && (t || !f || l),
			length: o
		};
	}
};
function ki(e) {
	switch (e) {
		case 10:
		case 33:
		case 35:
		case 36:
		case 37:
		case 38:
		case 42:
		case 43:
		case 45:
		case 58:
		case 60:
		case 61:
		case 62:
		case 64:
		case 91:
		case 92:
		case 93:
		case 94:
		case 95:
		case 96:
		case 123:
		case 125:
		case 126: return !0;
		default: return !1;
	}
}
function Ai(e, t) {
	let n = e.pos;
	for (; n < e.posMax && !ki(e.src.charCodeAt(n));) n++;
	return n !== e.pos && (t || (e.pending += e.src.slice(e.pos, n)), e.pos = n, !0);
}
function ji(e) {
	return e >= 65 && e <= 90 || e >= 97 && e <= 122;
}
function Mi(e) {
	return e >= 65 && e <= 90 || e >= 97 && e <= 122 || e >= 48 && e <= 57 || e === 43 || e === 45 || e === 46;
}
function Ni(e, t) {
	if (!e.md.options.linkify || e.linkLevel > 0) return !1;
	let n = e.pos, r = e.posMax;
	if (n + 3 > r || e.src.charCodeAt(n) !== 58 || e.src.charCodeAt(n + 1) !== 47 || e.src.charCodeAt(n + 2) !== 47) return !1;
	let i = n - Math.min(10, e.pending.length, n), a = n;
	for (; a > i && Mi(e.src.charCodeAt(a - 1));) a--;
	if (a === n || !ji(e.src.charCodeAt(a))) return !1;
	let o = n - a, s = e.md.linkify.matchAtStart(e.src.slice(a));
	if (!s) return !1;
	let c = s.url;
	if (c.length <= o) return !1;
	let l = c.length;
	for (; l > 0 && c.charCodeAt(l - 1) === 42;) l--;
	l !== c.length && (c = c.slice(0, l));
	let u = e.md.normalizeLink(c);
	if (!e.md.validateLink(u)) return !1;
	if (!t) {
		e.pending = e.pending.slice(0, -o);
		let t = e.push("link_open", "a", 1);
		t.attrs = [["href", u]], t.markup = "linkify", t.info = "auto";
		let n = e.push("text", "", 0);
		n.content = e.md.normalizeLinkText(c);
		let r = e.push("link_close", "a", -1);
		r.markup = "linkify", r.info = "auto";
	}
	return e.pos += c.length - o, !0;
}
function Pi(e, t) {
	let n = e.pos;
	if (e.src.charCodeAt(n) !== 10) return !1;
	let r = e.pending.length - 1, i = e.posMax;
	if (!t) {
		if (r >= 0 && e.pending.charCodeAt(r) === 32) {
			if (r >= 1 && e.pending.charCodeAt(r - 1) === 32) {
				let t = r - 1;
				for (; t >= 1 && e.pending.charCodeAt(t - 1) === 32;) t--;
				e.pending = e.pending.slice(0, t), e.push("hardbreak", "br", 0);
			} else e.pending = e.pending.slice(0, -1), e.push("softbreak", "br", 0);
		} else e.push("softbreak", "br", 0);
	}
	for (n++; n < i && z(e.src.charCodeAt(n));) n++;
	return e.pos = n, !0;
}
var Fi = [];
for (let e = 0; e < 256; e++) Fi.push(0);
"\\!\"#$%&'()*+,./:;<=>?@[]^_`{|}~-".split("").forEach(function(e) {
	Fi[e.charCodeAt(0)] = 1;
});
function Ii(e, t) {
	let n = e.pos, r = e.posMax;
	if (e.src.charCodeAt(n) !== 92 || (n++, n >= r)) return !1;
	let i = e.src.charCodeAt(n);
	if (i === 10) {
		for (t || e.push("hardbreak", "br", 0), n++; n < r && (i = e.src.charCodeAt(n), z(i));) n++;
		return e.pos = n, !0;
	}
	if (i === 32) {
		if (!t) {
			let t = e.push("text_special", "", 0);
			t.content = "\\", t.markup = "\\", t.info = "escape";
		}
		return e.pos = n, !0;
	}
	let a = e.src[n];
	if (i >= 55296 && i <= 56319 && n + 1 < r) {
		let t = e.src.charCodeAt(n + 1);
		t >= 56320 && t <= 57343 && (a += e.src[n + 1], n++);
	}
	let o = "\\" + a;
	if (!t) {
		let t = e.push("text_special", "", 0);
		t.content = i < 256 && Fi[i] !== 0 ? a : o, t.markup = o, t.info = "escape";
	}
	return e.pos = n + 1, !0;
}
function Li(e) {
	let t = {}, n = 0;
	for (; (n = e.indexOf("`", n)) !== -1;) {
		let r = n;
		for (; e.charCodeAt(++n) === 96;);
		t[n - r] = r;
	}
	return t;
}
function Ri(e, t) {
	let n = e.pos;
	if (e.src.charCodeAt(n) !== 96) return !1;
	let r = e.posMax, i = n + 1;
	for (; i < r && e.src.charCodeAt(i) === 96;) i++;
	let a = e.src.slice(n, i), o = a.length;
	if (e.backticksScanned ||= (e.backticks = Li(e.src), !0), (e.backticks[o] ?? -1) >= i) {
		let n = i, s;
		for (; (s = e.src.indexOf("`", n)) !== -1 && s < r;) {
			for (n = s + 1; e.src.charCodeAt(n) === 96;) n++;
			if (n > r) break;
			if (n - s === o) {
				if (!t) {
					let t = e.push("code_inline", "code", 0);
					t.markup = a;
					let n = e.src.slice(i, s).replace(/\n/g, " ");
					n.startsWith(" ") && n.endsWith(" ") && /[^ ]/.test(n) && (n = n.slice(1, -1)), t.content = n;
				}
				return e.pos = n, !0;
			}
		}
	}
	return t || (e.pending += a), e.pos = i, !0;
}
function zi(e, t) {
	let n = e.pos, r = e.src.charCodeAt(n);
	if (t || r !== 126) return !1;
	let i = e.scanDelims(e.pos, !0), a = i.length, o = String.fromCharCode(r);
	if (a < 2) return !1;
	let s;
	a % 2 && (s = e.push("text", "", 0), s.content = o, a--);
	for (let t = 0; t < a; t += 2) s = e.push("text", "", 0), s.content = o + o, e.delimiters.push({
		marker: r,
		length: 0,
		token: e.tokens.length - 1,
		end: -1,
		open: i.can_open,
		close: i.can_close
	});
	return e.pos += i.length, !0;
}
function Bi(e, t) {
	let n, r = [], i = t.length;
	for (let a = 0; a < i; a++) {
		let i = t[a];
		if (i.marker !== 126 || i.end === -1) continue;
		let o = t[i.end];
		n = e.tokens[i.token], n.type = "s_open", n.tag = "s", n.nesting = 1, n.markup = "~~", n.content = "", n = e.tokens[o.token], n.type = "s_close", n.tag = "s", n.nesting = -1, n.markup = "~~", n.content = "", e.tokens[o.token - 1].type === "text" && e.tokens[o.token - 1].content === "~" && r.push(o.token - 1);
	}
	for (; r.length;) {
		let t = r.pop(), i = t + 1;
		for (; i < e.tokens.length && e.tokens[i].type === "s_close";) i++;
		i--, t !== i && (n = e.tokens[i], e.tokens[i] = e.tokens[t], e.tokens[t] = n);
	}
}
function Vi(e) {
	let t = e.tokens_meta, n = e.tokens_meta.length;
	Bi(e, e.delimiters);
	for (let r = 0; r < n; r++) {
		let n = t[r]?.delimiters;
		n && Bi(e, n);
	}
}
var Hi = {
	tokenize: zi,
	postProcess: Vi
};
function Ui(e, t) {
	let n = e.pos, r = e.src.charCodeAt(n);
	if (t || r !== 95 && r !== 42) return !1;
	let i = e.scanDelims(e.pos, r === 42);
	for (let t = 0; t < i.length; t++) {
		let t = e.push("text", "", 0);
		t.content = String.fromCharCode(r), e.delimiters.push({
			marker: r,
			length: i.length,
			token: e.tokens.length - 1,
			end: -1,
			open: i.can_open,
			close: i.can_close
		});
	}
	return e.pos += i.length, !0;
}
function Wi(e, t) {
	let n = t.length;
	for (let r = n - 1; r >= 0; r--) {
		let n = t[r];
		if (n.marker !== 95 && n.marker !== 42 || n.end === -1) continue;
		let i = t[n.end], a = r > 0 && t[r - 1].end === n.end + 1 && t[r - 1].marker === n.marker && t[r - 1].token === n.token - 1 && t[n.end + 1].token === i.token + 1, o = String.fromCharCode(n.marker), s = e.tokens[n.token];
		s.type = a ? "strong_open" : "em_open", s.tag = a ? "strong" : "em", s.nesting = 1, s.markup = a ? o + o : o, s.content = "";
		let c = e.tokens[i.token];
		c.type = a ? "strong_close" : "em_close", c.tag = a ? "strong" : "em", c.nesting = -1, c.markup = a ? o + o : o, c.content = "", a && (e.tokens[t[r - 1].token].content = "", e.tokens[t[n.end + 1].token].content = "", r--);
	}
}
function Gi(e) {
	let t = e.tokens_meta, n = e.tokens_meta.length;
	Wi(e, e.delimiters);
	for (let r = 0; r < n; r++) {
		let n = t[r]?.delimiters;
		n && Wi(e, n);
	}
}
var Ki = {
	tokenize: Ui,
	postProcess: Gi
};
function qi(e, t) {
	let n, r, i, a, o = "", s = "", c = e.pos, l = !0;
	if (e.src.charCodeAt(e.pos) !== 91) return !1;
	let u = e.pos, d = e.posMax, f = e.pos + 1, p = e.md.helpers.parseLinkLabel(e, e.pos, !0);
	if (p < 0) return !1;
	let m = p + 1;
	if (m < d && e.src.charCodeAt(m) === 40) {
		for (l = !1, m++; m < d && (n = e.src.charCodeAt(m), z(n) || n === 10); m++);
		if (m >= d) return !1;
		if (c = m, i = e.md.helpers.parseLinkDestination(e.src, m, e.posMax), i.ok) {
			for (o = e.md.normalizeLink(i.str), e.md.validateLink(o) ? m = i.pos : o = "", c = m; m < d && (n = e.src.charCodeAt(m), z(n) || n === 10); m++);
			if (i = e.md.helpers.parseLinkTitle(e.src, m, e.posMax), m < d && c !== m && i.ok) for (s = i.str, m = i.pos; m < d && (n = e.src.charCodeAt(m), z(n) || n === 10); m++);
		}
		(m >= d || e.src.charCodeAt(m) !== 41) && (l = !0), m++;
	}
	if (l) {
		if (e.env.references === void 0) return !1;
		if (m < d && e.src.charCodeAt(m) === 91 ? (c = m + 1, m = e.md.helpers.parseLinkLabel(e, m), m >= 0 ? r = e.src.slice(c, m++) : m = p + 1) : m = p + 1, r ||= e.src.slice(f, p), r = pr(r), a = e.env.references[r], !a) return e.pos = u, !1;
		o = a.href, s = a.title;
	}
	if (!t) {
		e.pos = f, e.posMax = p;
		let t = e.push("link_open", "a", 1), n = [["href", o]];
		if (t.attrs = n, s && n.push(["title", s]), r) {
			let e = Object.create(null);
			e.label = r, t.meta = e;
		}
		e.linkLevel++, e.md.inline.tokenize(e), e.linkLevel--, e.push("link_close", "a", -1);
	}
	return e.pos = m, e.posMax = d, !0;
}
function Ji(e, t) {
	let n, r, i, a, o, s, c, l, u = "", d = e.pos, f = e.posMax;
	if (e.src.charCodeAt(e.pos) !== 33 || e.src.charCodeAt(e.pos + 1) !== 91) return !1;
	let p = e.pos + 2, m = e.md.helpers.parseLinkLabel(e, e.pos + 1, !1);
	if (m < 0) return !1;
	if (a = m + 1, a < f && e.src.charCodeAt(a) === 40) {
		for (a++; a < f && (n = e.src.charCodeAt(a), z(n) || n === 10); a++);
		if (a >= f) return !1;
		for (l = a, s = e.md.helpers.parseLinkDestination(e.src, a, e.posMax), s.ok && (u = e.md.normalizeLink(s.str), e.md.validateLink(u) ? a = s.pos : u = ""), l = a; a < f && (n = e.src.charCodeAt(a), z(n) || n === 10); a++);
		if (s = e.md.helpers.parseLinkTitle(e.src, a, e.posMax), a < f && l !== a && s.ok) for (c = s.str, a = s.pos; a < f && (n = e.src.charCodeAt(a), z(n) || n === 10); a++);
		else c = "";
		if (a >= f || e.src.charCodeAt(a) !== 41) return e.pos = d, !1;
		a++;
	} else {
		if (e.env.references === void 0) return !1;
		if (a < f && e.src.charCodeAt(a) === 91 ? (l = a + 1, a = e.md.helpers.parseLinkLabel(e, a), a >= 0 ? i = e.src.slice(l, a++) : a = m + 1) : a = m + 1, i ||= e.src.slice(p, m), i = pr(i), o = e.env.references[i], !o) return e.pos = d, !1;
		u = o.href, c = o.title;
	}
	if (!t) {
		r = e.src.slice(p, m);
		let t = [];
		e.md.inline.parse(r, e.md, e.env, t);
		let n = e.push("image", "img", 0), a = [["src", u], ["alt", ""]];
		if (n.attrs = a, n.children = t, n.content = r, c && a.push(["title", c]), i) {
			let e = Object.create(null);
			e.label = i, n.meta = e;
		}
	}
	return e.pos = a, e.posMax = f, !0;
}
var Yi = /^([a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*)$/, Xi = /^([a-zA-Z][a-zA-Z0-9+.-]{1,31}):([^<>\x00-\x20]*)$/;
function Zi(e, t) {
	let n = e.pos;
	if (e.src.charCodeAt(n) !== 60) return !1;
	let r = e.pos, i = e.posMax;
	for (;;) {
		if (++n >= i) return !1;
		let t = e.src.charCodeAt(n);
		if (t === 60) return !1;
		if (t === 62) break;
	}
	let a = e.src.slice(r + 1, n);
	if (Xi.test(a)) {
		let n = e.md.normalizeLink(a);
		if (!e.md.validateLink(n)) return !1;
		if (!t) {
			let t = e.push("link_open", "a", 1);
			t.attrs = [["href", n]], t.markup = "autolink", t.info = "auto";
			let r = e.push("text", "", 0);
			r.content = e.md.normalizeLinkText(a);
			let i = e.push("link_close", "a", -1);
			i.markup = "autolink", i.info = "auto";
		}
		return e.pos += a.length + 2, !0;
	}
	if (Yi.test(a)) {
		let n = e.md.normalizeLink(`mailto:${a}`);
		if (!e.md.validateLink(n)) return !1;
		if (!t) {
			let t = e.push("link_open", "a", 1);
			t.attrs = [["href", n]], t.markup = "autolink", t.info = "auto";
			let r = e.push("text", "", 0);
			r.content = e.md.normalizeLinkText(a);
			let i = e.push("link_close", "a", -1);
			i.markup = "autolink", i.info = "auto";
		}
		return e.pos += a.length + 2, !0;
	}
	return !1;
}
function Qi(e) {
	return /^<a[>\s]/i.test(e);
}
function $i(e) {
	return /^<\/a\s*>/i.test(e);
}
function ea(e) {
	let t = e | 32;
	return t >= 97 && t <= 122;
}
function ta(e, t) {
	let n = e.src, r, i;
	if (n.startsWith("<!--", t)) {
		if (n.startsWith(">", t + 4)) return t + 5;
		if (n.startsWith("->", t + 4)) return t + 6;
		r = t + 4, i = "-->";
	} else if (n.startsWith("<![CDATA[", t)) r = t + 9, i = "]]>";
	else if (n.charCodeAt(t + 1) === 63) r = t + 2, i = "?>";
	else if (ea(n.charCodeAt(t + 2))) r = t + 3, i = ">";
	else return -1;
	if (e.skipHtmlSpecial) return -1;
	let a = n.indexOf(i, r);
	return a < 0 ? (e.skipHtmlSpecial = !0, -1) : a + i.length;
}
function na(e, t) {
	if (!e.md.options.html) return !1;
	let n = e.posMax, r = e.pos;
	if (e.src.charCodeAt(r) !== 60 || r + 2 >= n) return !1;
	let i, a = e.src.charCodeAt(r + 1);
	if (a === 33 || a === 63) i = ta(e, r);
	else if (a === 47 || ea(a)) {
		let t = e.src.slice(r).match(xi);
		i = t ? r + t[0].length : -1;
	} else return !1;
	if (i < 0) return !1;
	if (!t) {
		let t = e.push("html_inline", "", 0);
		t.content = e.src.slice(r, i), Qi(t.content) && e.linkLevel++, $i(t.content) && e.linkLevel--;
	}
	return e.pos = i, !0;
}
var ra = /^&#((?:x[a-f0-9]{1,6}|[0-9]{1,7}));/i, ia = /^&([a-z][a-z0-9]{1,31});/i;
function aa(e, t) {
	let n = e.pos, r = e.posMax;
	if (e.src.charCodeAt(n) !== 38 || n + 1 >= r) return !1;
	if (e.src.charCodeAt(n + 1) === 35) {
		let r = e.src.slice(n).match(ra);
		if (r) {
			if (!t) {
				let t = r[1][0].toLowerCase() === "x" ? parseInt(r[1].slice(1), 16) : parseInt(r[1], 10), n = e.push("text_special", "", 0);
				n.content = er(t) ? I(t) : I(65533), n.markup = r[0], n.info = "entity";
			}
			return e.pos += r[0].length, !0;
		}
	} else {
		let r = e.src.slice(n).match(ia);
		if (r) {
			let n = gn(r[0]);
			if (n !== r[0]) {
				if (!t) {
					let t = e.push("text_special", "", 0);
					t.content = n, t.markup = r[0], t.info = "entity";
				}
				return e.pos += r[0].length, !0;
			}
		}
	}
	return !1;
}
function oa(e) {
	let t = {}, n = e.length;
	if (!n) return;
	let r = 0, i = -2, a = [];
	for (let o = 0; o < n; o++) {
		let n = e[o];
		if (a.push(0), (e[r].marker !== n.marker || i !== n.token - 1) && (r = o), i = n.token, n.length = n.length || 0, !n.close) continue;
		t.hasOwnProperty(n.marker) || (t[n.marker] = [
			-1,
			-1,
			-1,
			-1,
			-1,
			-1
		]);
		let s = t[n.marker][(n.open ? 3 : 0) + n.length % 3], c = r - a[r] - 1, l = c;
		for (; c > s; c -= a[c] + 1) {
			let t = e[c];
			if (t.marker === n.marker && t.open && t.end < 0) {
				let r = !1;
				if ((t.close || n.open) && (t.length + n.length) % 3 == 0 && (t.length % 3 != 0 || n.length % 3 != 0) && (r = !0), !r) {
					let r = c > 0 && !e[c - 1].open ? a[c - 1] + 1 : 0;
					a[o] = o - c + r, a[c] = r, n.open = !1, t.end = o, t.close = !1, l = -1, i = -2;
					break;
				}
			}
		}
		l !== -1 && (t[n.marker][(n.open ? 3 : 0) + (n.length || 0) % 3] = l);
	}
}
function sa(e) {
	let t = e.tokens_meta, n = e.tokens_meta.length;
	oa(e.delimiters);
	for (let e = 0; e < n; e++) {
		let n = t[e]?.delimiters;
		n && oa(n);
	}
}
function ca(e) {
	let t, n, r = 0, i = e.tokens, a = e.tokens.length;
	for (t = n = 0; t < a; t++) i[t].nesting < 0 && r--, i[t].level = r, i[t].nesting > 0 && r++, i[t].type === "text" && t + 1 < a && i[t + 1].type === "text" ? i[t + 1].content = i[t].content + i[t + 1].content : (t !== n && (i[n] = i[t]), n++);
	t !== n && (i.length = n);
}
var la = [
	["text", Ai],
	["linkify", Ni],
	["newline", Pi],
	["escape", Ii],
	["backticks", Ri],
	["strikethrough", Hi.tokenize],
	["emphasis", Ki.tokenize],
	["link", qi],
	["image", Ji],
	["autolink", Zi],
	["html_inline", na],
	["entity", aa]
], ua = [
	["balance_pairs", sa],
	["strikethrough", Hi.postProcess],
	["emphasis", Ki.postProcess],
	["fragments_join", ca]
], da = class {
	constructor() {
		W(this, "ruler", new K()), W(this, "ruler2", new K()), W(this, "State", Oi);
		for (let e = 0; e < la.length; e++) this.ruler.push(la[e][0], la[e][1]);
		for (let e = 0; e < ua.length; e++) this.ruler2.push(ua[e][0], ua[e][1]);
	}
	skipToken(e) {
		let t = e.pos, n = this.ruler.getRules(""), r = n.length, i = e.md.options.maxNesting, a = e.cache;
		if (a[t] !== void 0) {
			e.pos = a[t];
			return;
		}
		let o = !1;
		if (e.level < i) {
			for (let i = 0; i < r; i++) if (e.level++, o = n[i](e, !0), e.level--, o) {
				if (t >= e.pos) throw Error("inline rule didn't increment state.pos");
				break;
			}
		} else e.pos = e.posMax;
		o || e.pos++, a[t] = e.pos;
	}
	tokenize(e) {
		let t = this.ruler.getRules(""), n = t.length, r = e.posMax, i = e.md.options.maxNesting;
		for (; e.pos < r;) {
			let a = e.pos, o = !1;
			if (e.level < i) {
				for (let r = 0; r < n; r++) if (o = t[r](e, !1), o) {
					if (a >= e.pos) throw Error("inline rule didn't increment state.pos");
					break;
				}
			}
			if (o) {
				if (e.pos >= r) break;
			} else e.pending += e.src[e.pos++];
		}
		e.pending && e.pushPending();
	}
	parse(e, t, n, r) {
		let i = new this.State(e, t, n, r);
		this.tokenize(i);
		let a = this.ruler2.getRules(""), o = a.length;
		for (let e = 0; e < o; e++) a[e](i);
	}
}, fa = {
	default: {
		options: {
			html: !1,
			xhtmlOut: !1,
			breaks: !1,
			langPrefix: "language-",
			linkify: !1,
			typographer: !1,
			quotes: "“”‘’",
			highlight: null,
			maxNesting: 100
		},
		components: {
			core: {},
			block: {},
			inline: {}
		}
	},
	zero: {
		options: {
			html: !1,
			xhtmlOut: !1,
			breaks: !1,
			langPrefix: "language-",
			linkify: !1,
			typographer: !1,
			quotes: "“”‘’",
			highlight: null,
			maxNesting: 20
		},
		components: {
			core: { rules: [
				"normalize",
				"block",
				"strip_references",
				"inline",
				"text_join"
			] },
			block: { rules: ["paragraph"] },
			inline: {
				rules: ["text"],
				rules2: ["balance_pairs", "fragments_join"]
			}
		}
	},
	commonmark: {
		options: {
			html: !0,
			xhtmlOut: !0,
			breaks: !1,
			langPrefix: "language-",
			linkify: !1,
			typographer: !1,
			quotes: "“”‘’",
			highlight: null,
			maxNesting: 20
		},
		components: {
			core: { rules: [
				"normalize",
				"block",
				"strip_references",
				"inline",
				"text_join"
			] },
			block: { rules: [
				"blockquote",
				"code",
				"fence",
				"heading",
				"hr",
				"html_block",
				"lheading",
				"list",
				"reference",
				"paragraph"
			] },
			inline: {
				rules: [
					"autolink",
					"backticks",
					"emphasis",
					"entity",
					"escape",
					"html_inline",
					"image",
					"link",
					"newline",
					"text"
				],
				rules2: [
					"balance_pairs",
					"emphasis",
					"fragments_join"
				]
			}
		}
	}
}, pa = /^(vbscript|javascript|file|data):/, ma = /^data:image\/(gif|png|jpeg|webp);/, ha = [
	"http:",
	"https:",
	"mailto:"
], X = class {
	validateLink(e) {
		let t = e.trim().toLowerCase();
		return !pa.test(t) || ma.test(t);
	}
	normalizeLink(e) {
		let t = Rt(e, !0);
		if (t.hostname && (!t.protocol || ha.indexOf(t.protocol) >= 0)) try {
			t.hostname = Jn.toASCII(t.hostname);
		} catch {}
		return t.auth &&= O(t.auth), t.hostname &&= O(t.hostname), t.pathname &&= O(t.pathname), t.search &&= O(t.search), t.hash &&= O(t.hash), Et(t);
	}
	normalizeLinkText(e) {
		let t = Rt(e, !0);
		if (t.hostname && (!t.protocol || ha.indexOf(t.protocol) >= 0)) try {
			t.hostname = Jn.toUnicode(t.hostname);
		} catch {}
		return D(Et(t), D.defaultChars + "%");
	}
	constructor(...e) {
		W(this, "inline", new da()), W(this, "block", new Di()), W(this, "core", new ei()), W(this, "renderer", new Cr()), W(this, "linkify", new Tn()), W(this, "utils", Zn), W(this, "helpers", Object.assign({}, br));
		let [t, n] = e;
		typeof t == "string" ? (this.configure(t), n && this.set(n)) : (this.configure("default"), this.set(t || {}));
	}
	set(e) {
		return Object.assign(this.options, e), this;
	}
	configure(e) {
		let t;
		if (typeof e == "string") {
			let n = e;
			if (t = fa[n], !t) throw Error(`Wrong 'markdown-it' preset "${n}", check name`);
		} else t = e;
		if (!t) throw Error("Wrong `markdown-it` preset, can't be empty");
		t.options && (this.options = { ...t.options });
		let n = t.components;
		if (n) {
			[
				"core",
				"block",
				"inline"
			].forEach((e) => {
				let t = n[e]?.rules;
				t && this[e].ruler.enableOnly(t);
			});
			let e = n.inline?.rules2;
			e && this.inline.ruler2.enableOnly(e);
		}
		return this;
	}
	enable(e, t = !1) {
		let n = [];
		Array.isArray(e) || (e = [e]), [
			"core",
			"block",
			"inline"
		].forEach((t) => {
			n = n.concat(this[t].ruler.enable(e, !0));
		}), n = n.concat(this.inline.ruler2.enable(e, !0));
		let r = e.filter((e) => n.indexOf(e) < 0);
		if (r.length && !t) throw Error(`MarkdownIt. Failed to enable unknown rule(s): ${r}`);
		return this;
	}
	disable(e, t = !1) {
		let n = [];
		Array.isArray(e) || (e = [e]), [
			"core",
			"block",
			"inline"
		].forEach((t) => {
			n = n.concat(this[t].ruler.disable(e, !0));
		}), n = n.concat(this.inline.ruler2.disable(e, !0));
		let r = e.filter((e) => n.indexOf(e) < 0);
		if (r.length && !t) throw Error(`MarkdownIt. Failed to disable unknown rule(s): ${r}`);
		return this;
	}
	use(e, ...t) {
		return e.apply(e, [this, ...t]), this;
	}
	parse(e, t) {
		if (typeof e != "string") throw Error("Input data should be a String");
		let n = new this.core.State(e, this, t);
		return this.core.process(n), n.tokens;
	}
	render(e, t = {}) {
		return this.renderer.render(this.parse(e, t), this.options, t);
	}
	parseInline(e, t) {
		let n = new this.core.State(e, this, t);
		return n.inlineMode = !0, this.core.process(n), n.tokens;
	}
	renderInline(e, t = {}) {
		return this.renderer.render(this.parseInline(e, t), this.options, t);
	}
};
W(X, "Token", G), W(X, "Ruler", K), W(X, "Renderer", Cr), W(X, "ParserCore", ei), W(X, "StateCore", wr), W(X, "ParserBlock", Di), W(X, "StateBlock", ti), W(X, "ParserInline", da), W(X, "StateInline", Oi);
var ga = Qn(X), _a = (e) => e.replace(/&/gu, "&amp;").replace(/</gu, "&lt;").replace(/>/gu, "&gt;"), va = null;
function ya() {
	return va ??= ga({
		html: !0,
		linkify: !1,
		typographer: !1
	}), va;
}
function ba(e) {
	let t = "", n = "", r = !1;
	for (let i of e ?? []) switch (i.type) {
		case "text":
		case "code_inline":
			t += i.content, n += _a(i.content);
			break;
		case "softbreak":
		case "hardbreak":
			t += " ", n += " ";
			break;
		case "html_inline": r = !0, n += i.content;
	}
	return r ? xt(n) : t;
}
function xa() {
	return typeof globalThis.DOMParser == "function";
}
function Sa(e) {
	let t = ya().parse(e, {}), n = [], r = [], i = 0, a = null;
	for (let e of t) switch (e.type) {
		case "heading_open":
			i = Number(e.tag.slice(1)) || 2;
			break;
		case "heading_close":
			i = 0;
			break;
		case "blockquote_open":
			r.push("quote");
			break;
		case "list_item_open":
			r.push("list-item");
			break;
		case "blockquote_close":
		case "list_item_close":
			r.pop();
			break;
		case "tr_open":
			a = [];
			break;
		case "tr_close":
			a && n.push({
				kind: "table-row",
				text: a.join(" ")
			}), a = null;
			break;
		case "fence":
		case "code_block":
			n.push({
				kind: "code",
				text: e.content
			});
			break;
		case "html_block":
			if (xa()) try {
				n.push(...gt(e.content));
				break;
			} catch {}
			n.push({
				kind: "paragraph",
				text: bt(e.content)
			});
			break;
		case "inline": {
			let t = ba(e.children);
			a ? a.push(t) : i ? n.push({
				kind: "heading",
				level: i,
				text: t
			}) : n.push({
				kind: r[r.length - 1] ?? "paragraph",
				text: t
			});
			break;
		}
	}
	return n.filter((e) => /\S/u.test(e.text));
}
// src/parsers/text.ts
function Ca(e) {
	return e.replace(/\r\n?/g, "\n").split(/\n[^\S\n]*\n\s*/u).filter((e) => /\S/u.test(e)).map((e) => ({
		kind: "paragraph",
		text: e
	}));
}
// src/parsers/index.ts
function wa(e) {
	return typeof e == "object" && !!e && e.nodeType === 1 && typeof e.localName == "string";
}
function Ta(e, t) {
	if (typeof e != "string") throw new E("INVALID_SOURCE", `La source doit fournir « ${t} » sous forme de chaîne.`);
	return e;
}
function Ea(e, t = {}) {
	if (typeof e != "object" || !e) throw new E("INVALID_SOURCE", "Source absente ou invalide.");
	let n = t.exclude;
	switch (e.type) {
		case "text": return Ca(Ta(e.text, "text"));
		case "html": return gt(Ta(e.html, "html"), n ? { exclude: n } : {});
		case "markdown": return Sa(Ta(e.markdown, "markdown"));
		case "dom": {
			let t = e.element;
			if (!wa(t)) throw new E("INVALID_SOURCE", "La source « dom » doit fournir un élément HTML.");
			return ht(t, {
				checkVisibility: !0,
				...n ? { exclude: n } : {}
			});
		}
		default: throw new E("INVALID_SOURCE", `Type de source inconnu : ${String(e.type)}.`);
	}
}
function Da(e) {
	if (e.type === "dom" && wa(e.element)) return (e.element.closest?.("[lang]"))?.getAttribute("lang")?.trim() || void 0;
}
function Oa(e, t = {}) {
	let n;
	try {
		n = Ea(e, t);
	} catch (e) {
		throw e instanceof E ? e : new E("PARSE_ERROR", "Impossible d’extraire le contenu.", { cause: e });
	}
	let r = t.locale ?? Da(e) ?? "fr", i = at(n, {
		locale: r,
		...t.segmentation ? { segmentation: t.segmentation } : {}
	});
	if (i.words.length === 0) throw new E("EMPTY_CONTENT", "La source ne contient aucun texte lisible.");
	return i;
}
// src/ui/labels.ts
var ka = r({
	dialogTitle: "Lecture rapide",
	close: "Fermer le lecteur",
	play: "Lecture",
	playbackControls: "Commandes de lecture",
	pause: "Pause",
	previousWord: "Mot précédent",
	nextWord: "Mot suivant",
	previousSentence: "Phrase précédente",
	nextSentence: "Phrase suivante",
	slower: "Ralentir de 25 mots par minute",
	faster: "Accélérer de 25 mots par minute",
	speedUnit: "mots/min",
	speedLabel: "Vitesse",
	accelerating: "accélération",
	progressLabel: "Position de lecture",
	wordPosition: (e, t) => `Mot ${e} sur ${t}`,
	remaining: (e) => e < 1 ? "moins d’1 min" : `≈ ${e} min`,
	rsvpRegion: "Affichage mot par mot",
	rsvpDescription: "Les mots défilent un par un. Le texte intégral reste consultable dans la zone « Texte intégral ».",
	fullText: "Texte intégral",
	resumeFollow: "Reprendre le suivi",
	settings: "Réglages",
	closeSettings: "Fermer les réglages",
	statusPlaying: "Lecture en cours",
	statusPaused: (e, t) => `En pause, mot ${e} sur ${t}`,
	statusComplete: "Lecture terminée",
	profile: "Profil",
	profiles: {
		comfort: "Confort",
		standard: "Standard",
		fast: "Rapide",
		custom: "Personnalisé"
	},
	pauses: "Pauses adaptatives",
	timingLevels: {
		light: "Faibles",
		normal: "Normales",
		strong: "Fortes",
		custom: "Personnalisées"
	},
	detailedTiming: "Réglages détaillés",
	timingFields: {
		comma: "Virgule (×)",
		clause: "Point-virgule, deux-points (×)",
		sentence: "Fin de phrase (×)",
		paragraph: "Fin de paragraphe (×)",
		longWordThreshold: "Mot long à partir de (lettres)",
		longWordStep: "Supplément par lettre (%)",
		longWordMaxExtra: "Supplément maximal (%)"
	},
	acceleration: "Accélération progressive",
	accelerationEnabled: "Activer l’accélération",
	accelerationStart: "Vitesse de départ (mots/min)",
	accelerationTarget: "Vitesse cible (mots/min)",
	accelerationDuration: "Durée de montée (s)",
	accelerationCurve: "Progression",
	curves: {
		linear: "Linéaire",
		"ease-in-out": "Douce"
	},
	appearance: "Apparence",
	orpColor: "Couleur de la lettre de fixation",
	orpColorCustom: "Couleur personnalisée",
	contrastAdjusted: "Couleur ajustée automatiquement pour rester lisible sur ce fond.",
	fontSize: "Taille du texte",
	fontFamily: "Police",
	fonts: {
		sans: "Sans empattement",
		serif: "Avec empattement",
		mono: "Chasse fixe",
		readable: "Haute lisibilité"
	},
	showGuides: "Afficher les repères de fixation",
	theme: "Thème",
	themes: {
		auto: "Système",
		light: "Clair",
		dark: "Sombre"
	},
	reset: "Rétablir les réglages par défaut",
	shortcuts: "Raccourcis clavier",
	shortcutList: [
		["Espace", "Lecture / pause"],
		["← / →", "Mot précédent / suivant"],
		["Maj + ← / →", "Phrase précédente / suivante"],
		["↑ / ↓", "Vitesse ± 25"],
		["Début / Fin", "Premier / dernier mot"],
		["Échap", "Fermer"]
	],
	colors: {
		"#d32f2f": "Rouge",
		"#e65100": "Orange",
		"#2e7d32": "Vert",
		"#1565c0": "Bleu",
		"#6a1b9a": "Violet"
	}
}), Aa = r({
	...ka,
	dialogTitle: "Speed reading",
	close: "Close reader",
	play: "Play",
	playbackControls: "Playback controls",
	pause: "Pause",
	previousWord: "Previous word",
	nextWord: "Next word",
	previousSentence: "Previous sentence",
	nextSentence: "Next sentence",
	slower: "Slow down by 25 words per minute",
	faster: "Speed up by 25 words per minute",
	speedUnit: "wpm",
	speedLabel: "Speed",
	accelerating: "ramping up",
	progressLabel: "Reading position",
	wordPosition: (e, t) => `Word ${e} of ${t}`,
	remaining: (e) => e < 1 ? "under 1 min" : `≈ ${e} min`,
	rsvpRegion: "Word-by-word display",
	rsvpDescription: "Words are shown one at a time. The full text remains available in the “Full text” area.",
	fullText: "Full text",
	resumeFollow: "Resume following",
	settings: "Settings",
	closeSettings: "Close settings",
	statusPlaying: "Playing",
	statusPaused: (e, t) => `Paused, word ${e} of ${t}`,
	statusComplete: "Finished",
	profile: "Profile",
	profiles: {
		comfort: "Comfort",
		standard: "Standard",
		fast: "Fast",
		custom: "Custom"
	},
	pauses: "Adaptive pauses",
	timingLevels: {
		light: "Light",
		normal: "Normal",
		strong: "Strong",
		custom: "Custom"
	},
	detailedTiming: "Detailed settings",
	timingFields: {
		comma: "Comma (×)",
		clause: "Semicolon, colon (×)",
		sentence: "End of sentence (×)",
		paragraph: "End of paragraph (×)",
		longWordThreshold: "Long word from (letters)",
		longWordStep: "Extra per letter (%)",
		longWordMaxExtra: "Maximum extra (%)"
	},
	acceleration: "Progressive acceleration",
	accelerationEnabled: "Enable acceleration",
	accelerationStart: "Start speed (wpm)",
	accelerationTarget: "Target speed (wpm)",
	accelerationDuration: "Ramp duration (s)",
	accelerationCurve: "Curve",
	curves: {
		linear: "Linear",
		"ease-in-out": "Smooth"
	},
	appearance: "Appearance",
	orpColor: "Fixation letter colour",
	orpColorCustom: "Custom colour",
	contrastAdjusted: "Colour automatically adjusted to stay readable on this background.",
	fontSize: "Text size",
	fontFamily: "Font",
	fonts: {
		sans: "Sans serif",
		serif: "Serif",
		mono: "Monospace",
		readable: "High legibility"
	},
	showGuides: "Show fixation guides",
	theme: "Theme",
	themes: {
		auto: "System",
		light: "Light",
		dark: "Dark"
	},
	reset: "Restore default settings",
	shortcuts: "Keyboard shortcuts",
	shortcutList: [
		["Space", "Play / pause"],
		["← / →", "Previous / next word"],
		["Shift + ← / →", "Previous / next sentence"],
		["↑ / ↓", "Speed ± 25"],
		["Home / End", "First / last word"],
		["Esc", "Close"]
	],
	colors: {
		"#d32f2f": "Red",
		"#e65100": "Orange",
		"#2e7d32": "Green",
		"#1565c0": "Blue",
		"#6a1b9a": "Purple"
	}
});
function ja(e = "fr", t = {}) {
	return {
		...e === "en" ? Aa : ka,
		...t
	};
}
// src/core/color.ts
function Ma(e) {
	let t = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(e);
	return t ? [
		parseInt(t[1], 16),
		parseInt(t[2], 16),
		parseInt(t[3], 16)
	] : [
		0,
		0,
		0
	];
}
function Na([e, t, n]) {
	return `#${[
		e,
		t,
		n
	].map((e) => Math.round(Math.min(255, Math.max(0, e))).toString(16).padStart(2, "0")).join("")}`;
}
function Pa(e) {
	let [t, n, r] = Ma(e).map((e) => {
		let t = e / 255;
		return t <= .03928 ? t / 12.92 : ((t + .055) / 1.055) ** 2.4;
	});
	return .2126 * t + .7152 * n + .0722 * r;
}
function Fa(e, t) {
	let n = Pa(e), r = Pa(t);
	return (Math.max(n, r) + .05) / (Math.min(n, r) + .05);
}
function Ia(e, t, n = 3) {
	if (Fa(e, t) >= n) return e;
	let r = Pa(t) > .5 ? [
		0,
		0,
		0
	] : [
		255,
		255,
		255
	], i = Ma(e);
	for (let e = .05; e <= 1.0001; e += .05) {
		let a = Na(i.map((t, n) => t + (r[n] - t) * e));
		if (Fa(a, t) >= n) return a;
	}
	return Na(r);
}
// src/core/orp.ts
var La = /[\p{L}\p{N}]/u;
function Ra(e) {
	return e <= 1 ? 0 : e <= 5 ? 1 : e <= 9 ? 2 : e <= 13 ? 3 : 4;
}
function za(e) {
	let t = -1, n = -1;
	return e.forEach((e, r) => {
		La.test(e) && (t < 0 && (t = r), n = r);
	}), t < 0 ? Math.max(0, Math.floor((e.length - 1) / 2)) : t + Ra(n - t + 1);
}
function Ba(e, t = je()) {
	let n = t.graphemes(e);
	if (n.length === 0) return {
		before: "",
		pivot: "",
		after: "",
		index: 0,
		length: 0
	};
	let r = za(n);
	return {
		before: n.slice(0, r).join(""),
		pivot: n[r] ?? "",
		after: n.slice(r + 1).join(""),
		index: r,
		length: n.length
	};
}
// src/ui/dom.ts
function Z(e, t = {}, ...n) {
	let r = document.createElement(e);
	for (let [e, n] of Object.entries(t)) n !== void 0 && n !== !1 && r.setAttribute(e, n === !0 ? "" : String(n));
	for (let e of n) e != null && e !== !1 && r.append(typeof e == "string" ? document.createTextNode(e) : e);
	return r;
}
var Va = "http://www.w3.org/2000/svg", Ha = {
	play: "M8 5v14l11-7z",
	pause: "M6 5h4v14H6zM14 5h4v14h-4z",
	prevWord: "M15.4 7.4 14 6l-6 6 6 6 1.4-1.4L10.8 12z",
	nextWord: "M8.6 16.6 10 18l6-6-6-6-1.4 1.4 4.6 4.6z",
	prevSentence: "M6 6h2v12H6zm3.5 6 8.5 6V6z",
	nextSentence: "M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z",
	close: "M19 6.4 17.6 5 12 10.6 6.4 5 5 6.4 10.6 12 5 17.6 6.4 19 12 13.4 17.6 19 19 17.6 13.4 12z",
	settings: "M3 17v2h6v-2H3zM3 5v2h10V5H3zm10 16v-2h8v-2h-8v-2h-2v6h2zM7 9v2H3v2h4v2h2V9H7zm14 4v-2H11v2h10zm-6-4h2V7h4V5h-4V3h-2v6z",
	minus: "M5 11h14v2H5z",
	plus: "M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6z",
	follow: "M12 8l-6 6 1.4 1.4L12 10.8l4.6 4.6L18 14z"
};
function Q(e) {
	let t = document.createElementNS(Va, "svg");
	t.setAttribute("viewBox", "0 0 24 24"), t.setAttribute("aria-hidden", "true"), t.setAttribute("focusable", "false");
	let n = document.createElementNS(Va, "path");
	return n.setAttribute("d", Ha[e]), n.setAttribute("fill", "currentColor"), t.append(n), t;
}
function Ua(e, t) {
	let n = e.querySelector("svg"), r = Q(t);
	n ? n.replaceWith(r) : e.prepend(r);
}
// src/ui/fulltext-view.ts
var Wa = /* @__PURE__ */ new Set([
	"ArrowUp",
	"ArrowDown",
	"PageUp",
	"PageDown",
	"Home",
	"End",
	" "
]), Ga = class {
	callbacks;
	element;
	words = [];
	sentences = [];
	currentWord = -1;
	currentSentence = -1;
	following = !0;
	reducedMotion = !1;
	constructor(e, t, n) {
		this.callbacks = e, this.element = Z("div", {
			class: "fulltext",
			role: "region",
			"aria-label": n,
			tabindex: 0,
			part: "fulltext"
		});
		let r = this.element;
		r.addEventListener("click", (e) => {
			let t = e.target?.closest?.("[data-w]");
			if (!t || !r.contains(t)) return;
			let n = Number(t.dataset.w);
			Number.isInteger(n) && (this.setFollowing(!0), this.callbacks.onWordActivate(n));
		}, { signal: t });
		let i = () => this.setFollowing(!1);
		r.addEventListener("wheel", i, {
			passive: !0,
			signal: t
		}), r.addEventListener("touchmove", i, {
			passive: !0,
			signal: t
		}), r.addEventListener("keydown", (e) => {
			e.target === r && Wa.has(e.key) && i();
		}, { signal: t }), r.addEventListener("pointerdown", (e) => {
			e.target === r && e.offsetX > r.clientWidth && i();
		}, { signal: t });
	}
	setReducedMotion(e) {
		this.reducedMotion = e;
	}
	get isFollowing() {
		return this.following;
	}
	setFollowing(e) {
		e !== this.following && (this.following = e, this.callbacks.onFollowChange(e), e && this.scrollToCurrent(!0));
	}
	render(e) {
		let t = this.element;
		t.replaceChildren(), this.words = Array(e.words.length), this.sentences = Array(e.sentences.length), this.currentWord = -1, this.currentSentence = -1;
		let n = null;
		for (let r of e.blocks) {
			let i = this.renderBlock(e, r);
			r.kind === "list-item" ? (n || (n = Z("ul"), t.append(n)), n.append(Z("li", {}, i))) : (n = null, t.append(this.wrapBlock(r, i)));
		}
		t.scrollTop = 0;
	}
	wrapBlock(e, t) {
		switch (e.kind) {
			case "heading": return Z(`h${Math.min(6, (e.level ?? 2) + 2)}`, {}, t);
			case "quote": return Z("blockquote", {}, Z("p", {}, t));
			case "code": return Z("pre", {}, t);
			default: return Z("p", {}, t);
		}
	}
	renderBlock(e, t) {
		let n = document.createDocumentFragment(), r = t.start;
		for (let i = t.sentenceStart; i < t.sentenceEnd; i++) {
			let t = e.sentences[i];
			t.start > r && n.append(e.text.slice(r, t.start));
			let a = Z("span", {
				class: "s",
				"data-s": i
			}), o = t.start;
			for (let n = t.wordStart; n < t.wordEnd; n++) {
				let t = e.words[n];
				t.start > o && a.append(e.text.slice(o, t.start));
				let r = Z("span", {
					class: "w",
					"data-w": n
				}, t.text);
				this.words[n] = r, a.append(r), o = t.end;
			}
			t.end > o && a.append(e.text.slice(o, t.end)), this.sentences[i] = a, n.append(a), r = t.end;
		}
		return t.end > r && n.append(e.text.slice(r, t.end)), n;
	}
	highlight(e, t) {
		if (e !== this.currentWord) {
			let t = this.words[this.currentWord];
			t && (t.classList.remove("cur"), t.removeAttribute("aria-current"));
			let n = this.words[e];
			n && (n.classList.add("cur"), n.setAttribute("aria-current", "true")), this.currentWord = e;
		}
		t !== this.currentSentence && (this.sentences[this.currentSentence]?.classList.remove("active"), this.sentences[t]?.classList.add("active"), this.currentSentence = t), this.following && this.scrollToCurrent(!1);
	}
	scrollToCurrent(e) {
		let t = this.words[this.currentWord], n = this.element;
		if (!t || n.clientHeight === 0) return;
		let r = n.scrollTop, i = n.clientHeight, a = t.getBoundingClientRect(), o = a.top - n.getBoundingClientRect().top, s = o + r;
		if (!e && o >= i * .15 && o + a.height <= i * .7) return;
		let c = Math.max(0, s - i * .25);
		Math.abs(c - r) < 1 || n.scrollTo({
			top: c,
			behavior: this.reducedMotion || e ? "auto" : "smooth"
		});
	}
	wordElement(e) {
		return this.words[e];
	}
};
// src/ui/orp-layout.ts
function Ka(e) {
	let t = e.padding ?? 8, n = e.minScale ?? .4, r = e.beforeWidth + e.pivotWidth / 2, i = e.afterWidth + e.pivotWidth / 2, a = Math.max(1, e.axisX - t), o = Math.max(1, e.stageWidth - e.axisX - t), s = 1;
	return r > a && (s = Math.min(s, a / r)), i > o && (s = Math.min(s, o / i)), s = Math.max(n, s), {
		offsetX: e.axisX - r * s,
		scale: s
	};
}
var qa = .38, Ja = [
	"#d32f2f",
	"#e65100",
	"#2e7d32",
	"#1565c0",
	"#6a1b9a"
], Ya = /* @__PURE__ */ new Set(["longWordStep", "longWordMaxExtra"]), Xa = 0, Za = class {
	labels;
	callbacks;
	element;
	closeButton;
	id = `urr-settings-${++Xa}`;
	inputs = /* @__PURE__ */ new Map();
	contrastHint;
	fontSizeOutput;
	constructor(e, t, n) {
		this.labels = e, this.callbacks = t;
		let r = e, c = `${this.id}-title`;
		this.closeButton = Z("button", {
			type: "button",
			class: "icon",
			"aria-label": r.closeSettings,
			title: r.closeSettings
		}, Q("close")), this.closeButton.addEventListener("click", () => t.onClose(), { signal: n }), this.contrastHint = Z("p", {
			class: "hint",
			hidden: !0,
			id: `${this.id}-contrast`
		}, r.contrastAdjusted), this.fontSizeOutput = Z("output", {});
		let l = Z("form", { novalidate: !0 }, this.radioGroup("profile", r.profile, f.map((e) => [e, r.profiles[e]])), this.radioGroup("timingLevel", r.pauses, [...p.map((e) => [e, r.timingLevels[e]])]), Z("p", {
			class: "hint",
			"data-hint": "timing-custom",
			hidden: !0
		}, `${r.pauses} : ${r.timingLevels.custom}`), Z("details", {}, Z("summary", {}, r.detailedTiming), ...Object.keys(s).map((e) => {
			let t = s[e], n = Ya.has(e);
			return this.numberField(`timing.${e}`, r.timingFields[e], n ? t.min * 100 : t.min, n ? t.max * 100 : t.max, n ? (t.step ?? .01) * 100 : t.step ?? 1);
		})), Z("fieldset", {}, Z("legend", {}, r.acceleration), this.checkbox("acceleration.enabled", r.accelerationEnabled), this.numberField("acceleration.startSpeed", r.accelerationStart, i.min, i.max, i.step), this.numberField("acceleration.targetSpeed", r.accelerationTarget, i.min, i.max, i.step), this.numberField("acceleration.duration", r.accelerationDuration, o.min, o.max, o.step ?? 5), this.select("acceleration.curve", r.accelerationCurve, [["linear", r.curves.linear], ["ease-in-out", r.curves["ease-in-out"]]])), Z("fieldset", {}, Z("legend", {}, r.appearance), this.colorGroup(), this.contrastHint, this.rangeField("appearance.fontSize", r.fontSize, a.min, a.max, a.step ?? 2), this.select("appearance.fontFamily", r.fontFamily, u.map((e) => [e, r.fonts[e]])), this.checkbox("appearance.showGuides", r.showGuides), this.select("appearance.theme", r.theme, d.map((e) => [e, r.themes[e]]))), Z("button", {
			type: "button",
			class: "reset",
			"data-action": "reset"
		}, r.reset), Z("details", { class: "shortcuts" }, Z("summary", {}, r.shortcuts), Z("dl", {}, ...r.shortcutList.flatMap(([e, t]) => [Z("dt", {}, Z("kbd", {}, e)), Z("dd", {}, t)]))));
		l.addEventListener("submit", (e) => e.preventDefault(), { signal: n }), l.addEventListener("change", (e) => this.handleChange(e.target), { signal: n }), l.addEventListener("input", (e) => {
			let t = e.target;
			(t.name === "appearance.fontSize" || t.name === "appearance.orpColorCustom") && this.handleChange(t);
		}, { signal: n }), l.querySelector("[data-action=\"reset\"]").addEventListener("click", () => t.onReset(), { signal: n }), this.element = Z("section", {
			class: "panel",
			id: this.id,
			role: "region",
			"aria-labelledby": c,
			hidden: !0,
			part: "settings"
		}, Z("div", { class: "panel-head" }, Z("h3", { id: c }, r.settings), this.closeButton), l);
	}
	get panelId() {
		return this.id;
	}
	fieldId(e) {
		return `${this.id}-${e.replace(/\W/g, "-")}`;
	}
	register(e, t) {
		return this.inputs.set(e, t), t;
	}
	radioGroup(e, t, n) {
		return Z("fieldset", {}, Z("legend", {}, t), Z("div", { class: "choices" }, ...n.map(([t, n]) => {
			let r = Z("input", {
				type: "radio",
				name: e,
				value: t
			});
			return this.register(`${e}=${t}`, r), Z("label", { class: "choice" }, r, Z("span", {}, n));
		})));
	}
	colorGroup() {
		let e = this.labels, t = this.register("appearance.orpColorCustom", Z("input", {
			type: "color",
			name: "appearance.orpColorCustom",
			id: this.fieldId("orp-custom")
		}));
		return Z("fieldset", {}, Z("legend", {}, e.orpColor), Z("div", { class: "choices" }, ...Ja.map((t) => {
			let n = Z("input", {
				type: "radio",
				name: "appearance.orpColor",
				value: t,
				"aria-label": e.colors[t] ?? t
			});
			this.register(`appearance.orpColor=${t}`, n);
			let r = Z("i", {});
			return r.style.background = t, Z("label", {
				class: "choice swatch",
				title: e.colors[t] ?? t
			}, n, Z("span", {}, r));
		})), Z("div", { class: "field" }, Z("label", { for: t.id }, e.orpColorCustom), t));
	}
	numberField(e, t, n, r, i) {
		let a = this.fieldId(e), o = this.register(e, Z("input", {
			type: "number",
			name: e,
			id: a,
			min: n,
			max: r,
			step: i,
			inputmode: "decimal"
		}));
		return Z("div", { class: "field" }, Z("label", { for: a }, t), o);
	}
	rangeField(e, t, n, r, i) {
		let a = this.fieldId(e), o = this.register(e, Z("input", {
			type: "range",
			name: e,
			id: a,
			min: n,
			max: r,
			step: i
		}));
		return this.fontSizeOutput.htmlFor.add(a), Z("div", { class: "field" }, Z("label", { for: a }, t), o, this.fontSizeOutput);
	}
	checkbox(e, t) {
		return Z("label", { class: "check" }, this.register(e, Z("input", {
			type: "checkbox",
			name: e
		})), t);
	}
	select(e, t, n) {
		let r = this.fieldId(e), i = this.register(e, Z("select", {
			name: e,
			id: r
		}, ...n.map(([e, t]) => Z("option", { value: e }, t))));
		return Z("div", { class: "field" }, Z("label", { for: r }, t), i);
	}
	handleChange(e) {
		let t = e.name;
		if (!t) return;
		let n = e.value, r = Number(n), [i, a] = t.split(".");
		if (e instanceof HTMLInputElement && e.type === "number" && (n === "" || !Number.isFinite(r))) return;
		let o = null;
		if (t === "profile") o = { profile: n };
		else if (t === "timingLevel") o = { timingLevel: n };
		else if (i === "timing" && a) {
			let e = a;
			o = { timing: { [e]: Ya.has(e) ? r / 100 : r } };
		} else if (i === "acceleration" && a) {
			let t = a === "enabled" ? e.checked : a === "curve" ? n : r;
			o = { acceleration: { [a]: t } };
		} else i === "appearance" && a && (o = a === "orpColorCustom" ? { appearance: { orpColor: n } } : a === "showGuides" ? { appearance: { showGuides: e.checked } } : a === "fontSize" ? { appearance: { fontSize: r } } : { appearance: { [a]: n } });
		o && this.callbacks.onChange(o);
	}
	update(e, t) {
		let n = (e, t) => {
			let n = this.inputs.get(e);
			n instanceof HTMLInputElement && (n.checked = t);
		}, r = this.element.getRootNode().activeElement, i = (e, t) => {
			let n = this.inputs.get(e);
			n && (n !== r || n.type !== "number") && (n.value = String(t));
		};
		for (let t of f) n(`profile=${t}`, e.profile === t);
		for (let t of p) n(`timingLevel=${t}`, e.timingLevel === t);
		let a = this.element.querySelector("[data-hint=\"timing-custom\"]");
		a && (a.hidden = e.timingLevel !== "custom");
		for (let t of Object.keys(e.timing)) {
			let n = e.timing[t];
			i(`timing.${t}`, Ya.has(t) ? Number((n * 100).toFixed(2)) : n);
		}
		n("acceleration.enabled", e.acceleration.enabled), i("acceleration.startSpeed", e.acceleration.startSpeed), i("acceleration.targetSpeed", e.acceleration.targetSpeed), i("acceleration.duration", e.acceleration.duration), i("acceleration.curve", e.acceleration.curve);
		for (let t of Ja) n(`appearance.orpColor=${t}`, e.appearance.orpColor === t);
		i("appearance.orpColorCustom", e.appearance.orpColor), i("appearance.fontSize", e.appearance.fontSize), this.fontSizeOutput.value = `${e.appearance.fontSize} px`, i("appearance.fontFamily", e.appearance.fontFamily), n("appearance.showGuides", e.appearance.showGuides), i("appearance.theme", e.appearance.theme), this.contrastHint.hidden = !t;
	}
	firstFocusable() {
		return this.element.querySelector("input:checked") ?? this.closeButton;
	}
}, Qa = {
	sans: "system-ui, -apple-system, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, \"Noto Sans\", \"DejaVu Sans\", sans-serif",
	serif: "Georgia, Cambria, \"Times New Roman\", Times, \"DejaVu Serif\", serif",
	mono: "ui-monospace, \"SF Mono\", Menlo, Consolas, \"Liberation Mono\", \"DejaVu Sans Mono\", monospace",
	readable: "Verdana, \"Atkinson Hyperlegible\", Tahoma, \"DejaVu Sans\", sans-serif"
}, $a = {
	light: "#ffffff",
	dark: "#161616"
}, eo = `
:host {
  all: initial;
  display: contents;
}
*, *::before, *::after { box-sizing: border-box; }
[hidden] { display: none !important; }

.root {
  --bg: ${$a.light};
  --surface: #f4f4f2;
  --text: #1c1c1c;
  --muted: #595959;
  --border: #c9c9c9;
  --focus: #1a5fb4;
  --accent: #1a5fb4;
  --accent-text: #ffffff;
  --cur-bg: #ffe46b;
  --cur-text: #1c1c1c;
  --sentence-bg: #e8f0fb;
  --backdrop: rgb(0 0 0 / 0.55);
  --orp: #d32f2f;
  --rsvp-size: 48px;
  --rsvp-font: ${Qa.sans};
  --ui-font: ${Qa.sans};
  --axis: 38%;
  color-scheme: light;
}
.root[data-theme="dark"] {
  --bg: ${$a.dark};
  --surface: #232323;
  --text: #ededed;
  --muted: #b0b0b0;
  --border: #4a4a4a;
  --focus: #8ab4f8;
  --accent: #8ab4f8;
  --accent-text: #0b1a33;
  --cur-bg: #6b5600;
  --cur-text: #ffffff;
  --sentence-bg: #1d2a3a;
  --backdrop: rgb(0 0 0 / 0.7);
  color-scheme: dark;
}

dialog {
  position: fixed;
  inset: 0;
  margin: auto;
  padding: 0;
  border: 1px solid var(--border);
  border-radius: 12px;
  width: min(980px, calc(100vw - 32px));
  height: min(780px, calc(100dvh - 32px));
  max-width: none;
  max-height: none;
  background: var(--bg);
  color: var(--text);
  font-family: var(--ui-font);
  font-size: 16px;
  line-height: 1.5;
  overflow: hidden;
  overscroll-behavior: contain;
  box-shadow: 0 20px 60px rgb(0 0 0 / 0.35);
}
dialog:not([open]) { display: none; }
dialog::backdrop { background: var(--backdrop); }

.layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  height: 100%;
}
.main {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
}

header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 8px 8px 20px;
  border-bottom: 1px solid var(--border);
}
header h2 {
  flex: 1;
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

button, select, input { font: inherit; color: inherit; }
button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-width: 44px;
  min-height: 44px;
  padding: 0 10px;
  border: 1px solid transparent;
  border-radius: 8px;
  background: transparent;
  cursor: pointer;
}
button:hover { background: var(--surface); }
button svg { width: 24px; height: 24px; flex: none; }
:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; }
.primary {
  background: var(--accent);
  color: var(--accent-text);
  min-width: 56px;
  min-height: 56px;
  border-radius: 50%;
}
.primary:hover { background: var(--accent); filter: brightness(1.08); }
.primary svg { width: 30px; height: 30px; }

/* ───── Zone RSVP ───── */
.stage {
  position: relative;
  flex: 0 0 auto;
  height: clamp(140px, 30vh, 240px);
  overflow: hidden;
  background: var(--bg);
  user-select: none;
}
.guide {
  position: absolute;
  left: var(--axis);
  width: 2px;
  height: 18%;
  margin-left: -1px;
  background: var(--muted);
  opacity: 0.6;
}
.guide.top { top: 12%; }
.guide.bottom { bottom: 12%; }
.guide-line {
  position: absolute;
  left: 8px;
  right: 8px;
  height: 1px;
  background: var(--border);
}
.guide-line.top { top: 30%; }
.guide-line.bottom { bottom: 30%; }
.root[data-guides="false"] .guide, .root[data-guides="false"] .guide-line { display: none; }
.word {
  position: absolute;
  top: 50%;
  left: 0;
  transform: translateY(-50%);
  white-space: pre;
  font-family: var(--rsvp-font);
  font-size: var(--rsvp-size);
  line-height: 1.2;
  color: var(--text);
}
.word .pivot { color: var(--orp); font-weight: 700; }
.stage-status {
  position: absolute;
  bottom: 6px;
  left: 0;
  right: 0;
  text-align: center;
  font-size: 0.875rem;
  color: var(--muted);
}

/* ───── Progression et commandes ───── */
.progress {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 4px 20px;
  font-size: 0.875rem;
  color: var(--muted);
  font-variant-numeric: tabular-nums;
}
.progress input[type="range"] { flex: 1; min-width: 0; accent-color: var(--accent); height: 24px; }
.controls {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 4px 12px;
  padding: 4px 12px 10px;
  border-bottom: 1px solid var(--border);
}
.transport, .speed { display: flex; align-items: center; gap: 4px; }
.speed output {
  min-width: 9.5ch;
  text-align: center;
  font-variant-numeric: tabular-nums;
}
.speed .ramp { display: block; font-size: 0.75rem; color: var(--muted); }

/* ───── Texte intégral ───── */
.fulltext-wrap { position: relative; flex: 1 1 auto; min-height: 0; }
.fulltext {
  height: 100%;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 12px 24px 40px;
  background: var(--surface);
  font-size: 1.0625rem;
  line-height: 1.7;
}
.fulltext h3, .fulltext h4, .fulltext h5, .fulltext h6 { margin: 1em 0 0.4em; line-height: 1.3; }
.fulltext p, .fulltext pre, .fulltext blockquote, .fulltext ul { margin: 0 0 0.8em; }
.fulltext blockquote { padding-left: 1em; border-left: 3px solid var(--border); }
.fulltext pre { white-space: pre-wrap; font-family: ${Qa.mono}; font-size: 0.9375rem; }
.fulltext .w { cursor: pointer; border-radius: 3px; }
.fulltext .w:hover { text-decoration: underline; }
.fulltext .s.active { background: var(--sentence-bg); border-radius: 3px; }
.fulltext .w.cur { background: var(--cur-bg); color: var(--cur-text); outline: 1px solid var(--cur-text); outline-offset: 0; }
.resume-follow {
  position: absolute;
  right: 16px;
  bottom: 12px;
  background: var(--accent);
  color: var(--accent-text);
  box-shadow: 0 4px 12px rgb(0 0 0 / 0.25);
}
.resume-follow:hover { background: var(--accent); filter: brightness(1.08); }
.resume-follow[hidden] { display: none; }

/* ───── Réglages ───── */
.panel {
  width: 360px;
  border-left: 1px solid var(--border);
  background: var(--bg);
  overflow-y: auto;
  overscroll-behavior: contain;
}
.panel[hidden] { display: none; }
.panel-head {
  position: sticky;
  top: 0;
  z-index: 1;
  display: flex;
  align-items: center;
  padding: 8px 8px 8px 20px;
  background: var(--bg);
  border-bottom: 1px solid var(--border);
}
.panel-head h3 { flex: 1; margin: 0; font-size: 1rem; }
.panel form { padding: 8px 20px 24px; }
fieldset { margin: 12px 0; padding: 0; border: 0; }
legend { padding: 0; margin-bottom: 6px; font-weight: 600; }
.choices { display: flex; flex-wrap: wrap; gap: 6px; }
.choice { position: relative; }
.choice input { position: absolute; opacity: 0; width: 1px; height: 1px; }
.choice span {
  display: inline-flex;
  align-items: center;
  min-height: 40px;
  padding: 0 12px;
  border: 1px solid var(--border);
  border-radius: 20px;
  cursor: pointer;
}
.choice input:checked + span { background: var(--accent); color: var(--accent-text); border-color: var(--accent); }
.choice input:focus-visible + span { outline: 3px solid var(--focus); outline-offset: 2px; }
.swatch span { width: 40px; padding: 0; justify-content: center; }
.swatch i { display: block; width: 22px; height: 22px; border-radius: 50%; }
.field { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin: 8px 0; }
.field label { flex: 1; }
.field input[type="number"] { width: 6.5em; min-height: 36px; padding: 0 6px; border: 1px solid var(--border); border-radius: 6px; background: var(--bg); }
.field select { min-height: 36px; border: 1px solid var(--border); border-radius: 6px; background: var(--bg); padding: 0 6px; }
.field input[type="range"] { flex: 1; accent-color: var(--accent); }
.field input[type="color"] { width: 44px; height: 36px; padding: 0; border: 1px solid var(--border); border-radius: 6px; background: none; }
.check { display: flex; align-items: center; gap: 10px; min-height: 40px; }
.check input { width: 20px; height: 20px; accent-color: var(--accent); }
details { margin: 8px 0; }
summary { cursor: pointer; padding: 8px 0; }
.hint { margin: 4px 0; font-size: 0.875rem; color: var(--muted); }
.hint[hidden] { display: none; }
.reset { width: 100%; margin-top: 12px; border-color: var(--border); }
.shortcuts { font-size: 0.875rem; }
.shortcuts dl { display: grid; grid-template-columns: auto 1fr; gap: 4px 12px; margin: 0; }
.shortcuts dt { font-weight: 600; }
.shortcuts dd { margin: 0; color: var(--muted); }
kbd { font-family: inherit; }

.sr-only {
  position: absolute !important;
  width: 1px; height: 1px;
  padding: 0; margin: -1px;
  overflow: hidden; clip: rect(0 0 0 0);
  white-space: nowrap; border: 0;
}

/* ───── Mobile : plein écran, disposition verticale ───── */
@media (max-width: 640px), (max-height: 480px) and (pointer: coarse) {
  dialog {
    width: 100vw;
    height: 100dvh;
    border: 0;
    border-radius: 0;
  }
  .layout { grid-template-columns: minmax(0, 1fr); position: relative; }
  header { padding-left: 12px; }
  .stage { height: clamp(120px, 26dvh, 200px); }
  .progress { padding: 4px 12px; }
  .controls { gap: 2px 8px; padding: 2px 4px 8px; }
  .fulltext { padding: 10px 16px 64px; }
  .panel {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    top: calc(clamp(120px, 26dvh, 200px) + 61px);
    width: auto;
    border-left: 0;
    border-top: 1px solid var(--border);
    border-radius: 12px 12px 0 0;
    box-shadow: 0 -10px 30px rgb(0 0 0 / 0.3);
    z-index: 2;
  }
}

@media (prefers-reduced-motion: reduce) {
  * { transition: none !important; animation: none !important; scroll-behavior: auto !important; }
}
@media (forced-colors: active) {
  .word .pivot { color: Highlight; }
  .fulltext .w.cur { outline: 2px solid Highlight; }
}
`, to = 16, no = "button, input, select, textarea, summary, a[href], [contenteditable=\"\"], [contenteditable=\"true\"]", ro = "input, select, textarea, [contenteditable=\"\"], [contenteditable=\"true\"]";
function io(e) {
	return e.composedPath()[0] ?? null;
}
var ao = null;
function oo() {
	if (ao) return ao;
	class e extends HTMLElement {
		host_ = null;
		built = !1;
		buildAbort = null;
		openAbort = null;
		unsubscribers = [];
		resizeObserver = null;
		isOpen_ = !1;
		root;
		dialog;
		titleEl;
		stage;
		wordEl;
		beforeEl;
		pivotEl;
		afterEl;
		stageStatus;
		live;
		range;
		positionText;
		remainingText;
		playButton;
		speedOutput;
		speedValue;
		rampText;
		settingsButton;
		resumeFollowButton;
		fullText;
		panel;
		segmenter = je();
		lastWordIndex = -2;
		lastStatus = null;
		theme = "light";
		settings = null;
		constructor() {
			super(), this.attachShadow({ mode: "open" });
		}
		attach(e) {
			this.host_ = e, this.built || this.build();
		}
		get isOpen() {
			return this.isOpen_;
		}
		get host() {
			if (!this.host_) throw Error("ReaderElement non relié à un contrôleur.");
			return this.host_;
		}
		build() {
			let e = this.shadowRoot, t = this.host.labels;
			this.buildAbort = new AbortController();
			let n = this.buildAbort.signal;
			if ("adoptedStyleSheets" in e && typeof CSSStyleSheet == "function" && "replaceSync" in CSSStyleSheet.prototype) {
				let t = new CSSStyleSheet();
				t.replaceSync(eo), e.adoptedStyleSheets = [t];
			} else e.append(Z("style", {}, eo));
			let r = "urr-title", i = "urr-desc", a = (e, t, n = {}) => Z("button", {
				type: "button",
				"aria-label": t,
				title: t,
				...n
			}, Q(e));
			this.titleEl = Z("h2", { id: r }, t.dialogTitle), this.settingsButton = Z("button", {
				type: "button",
				"aria-expanded": "false",
				title: t.settings
			}, Q("settings"), Z("span", { class: "label" }, t.settings));
			let o = a("close", t.close, { "data-action": "close" });
			this.beforeEl = Z("span", { class: "before" }), this.pivotEl = Z("span", { class: "pivot" }), this.afterEl = Z("span", { class: "after" }), this.wordEl = Z("div", {
				class: "word",
				"aria-hidden": "true",
				part: "word"
			}, this.beforeEl, this.pivotEl, this.afterEl), this.stageStatus = Z("div", {
				class: "stage-status",
				"aria-hidden": "true"
			}), this.stage = Z("div", {
				class: "stage",
				role: "region",
				"aria-label": t.rsvpRegion,
				"aria-describedby": i,
				part: "stage"
			}, Z("p", {
				class: "sr-only",
				id: i
			}, t.rsvpDescription), Z("div", { class: "guide-line top" }), Z("div", { class: "guide top" }), this.wordEl, Z("div", { class: "guide bottom" }), Z("div", { class: "guide-line bottom" }), this.stageStatus), this.live = Z("div", {
				class: "sr-only",
				"aria-live": "polite",
				"aria-atomic": "true"
			}), this.range = Z("input", {
				type: "range",
				min: 0,
				max: 0,
				step: 1,
				value: 0,
				"aria-label": t.progressLabel,
				part: "progress"
			}), this.positionText = Z("span", { "aria-hidden": "true" }), this.remainingText = Z("span", { "aria-hidden": "true" }), this.playButton = Z("button", {
				type: "button",
				class: "primary",
				"aria-label": t.play,
				title: t.play,
				"data-action": "toggle"
			}, Q("play")), this.speedValue = Z("span", {}), this.rampText = Z("span", {
				class: "ramp",
				hidden: !0
			}, t.accelerating), this.speedOutput = Z("output", { "aria-label": t.speedLabel }, this.speedValue, this.rampText), this.resumeFollowButton = Z("button", {
				type: "button",
				class: "resume-follow",
				hidden: !0
			}, Q("follow"), t.resumeFollow), this.fullText = new Ga({
				onWordActivate: (e) => {
					this.host.activateWord(e), this.playButton.focus({ preventScroll: !0 });
				},
				onFollowChange: (e) => {
					this.resumeFollowButton.hidden = e;
				}
			}, n, t.fullText), this.panel = new Za(t, {
				onChange: (e) => this.host.updateSettings(e),
				onReset: () => this.host.resetSettings(),
				onClose: () => this.toggleSettings(!1)
			}, n), this.settingsButton.setAttribute("aria-controls", this.panel.panelId);
			let s = Z("div", { class: "main" }, Z("header", {}, this.titleEl, this.settingsButton, o), this.stage, Z("div", { class: "progress" }, this.positionText, this.range, this.remainingText), Z("div", { class: "controls" }, Z("div", {
				class: "transport",
				role: "group",
				"aria-label": t.playbackControls
			}, a("prevSentence", t.previousSentence, { "data-action": "prev-sentence" }), a("prevWord", t.previousWord, { "data-action": "prev-word" }), this.playButton, a("nextWord", t.nextWord, { "data-action": "next-word" }), a("nextSentence", t.nextSentence, { "data-action": "next-sentence" })), Z("div", {
				class: "speed",
				role: "group",
				"aria-label": t.speedLabel
			}, a("minus", t.slower, { "data-action": "slower" }), this.speedOutput, a("plus", t.faster, { "data-action": "faster" }))), Z("div", { class: "fulltext-wrap" }, this.fullText.element, this.resumeFollowButton), this.live);
			this.dialog = Z("dialog", {
				"aria-labelledby": r,
				part: "dialog"
			}, Z("div", { class: "layout" }, s, this.panel.element)), this.root = Z("div", {
				class: "root",
				"data-theme": "light"
			}, this.dialog), e.append(this.root), this.dialog.addEventListener("click", (e) => this.onClick(e), { signal: n }), this.dialog.addEventListener("keydown", (e) => this.onKeyDown(e), { signal: n }), this.dialog.addEventListener("cancel", (e) => {
				e.preventDefault(), this.host.requestClose();
			}, { signal: n }), this.range.addEventListener("input", () => this.host.engine.seek(Number(this.range.value)), { signal: n }), this.settingsButton.addEventListener("click", () => this.toggleSettings(), { signal: n }), this.resumeFollowButton.addEventListener("click", () => this.fullText.setFollowing(!0), { signal: n }), this.built = !0;
		}
		open(e, t) {
			let n = this.host;
			this.closeView(), this.openAbort = new AbortController();
			let r = this.openAbort.signal;
			this.titleEl.textContent = t, this.segmenter = je(e.locale), this.fullText.render(e), this.fullText.setFollowing(!0), this.resumeFollowButton.hidden = !0, this.range.max = String(Math.max(0, e.words.length - 1)), this.lastWordIndex = -2, this.lastStatus = null, this.toggleSettings(!1, !1);
			let i = n.engine;
			this.unsubscribers.push(i.on("position", (e) => this.renderSnapshot(e)), i.on("status", () => this.renderSnapshot(i.getSnapshot())), i.on("speed", () => this.renderSpeed(i.getSnapshot()))), (typeof matchMedia == "function" ? matchMedia("(prefers-color-scheme: dark)") : null)?.addEventListener("change", () => this.applySettings(this.host.getSettings()), { signal: r });
			let a = typeof matchMedia == "function" ? matchMedia("(prefers-reduced-motion: reduce)") : null;
			this.fullText.setReducedMotion(!!a?.matches), a?.addEventListener("change", () => this.fullText.setReducedMotion(a.matches), { signal: r });
			let o = (e) => {
				let t = io(e);
				t && this.shadowRoot.contains(t) && t.closest?.(".fulltext, .panel, input") || e.preventDefault();
			};
			this.ownerDocument.addEventListener("wheel", o, {
				passive: !1,
				capture: !0,
				signal: r
			}), this.ownerDocument.addEventListener("touchmove", o, {
				passive: !1,
				capture: !0,
				signal: r
			}), typeof ResizeObserver == "function" && (this.resizeObserver = new ResizeObserver(() => this.align()), this.resizeObserver.observe(this.stage)), this.applySettings(n.getSettings()), this.dialog.open || this.dialog.showModal(), this.isOpen_ = !0, this.renderSnapshot(i.getSnapshot()), this.fullText.scrollToCurrent(!0), this.playButton.focus({ preventScroll: !0 });
		}
		close() {
			this.closeView(), this.dialog?.open && this.dialog.close();
		}
		closeView() {
			this.isOpen_ = !1;
			for (let e of this.unsubscribers.splice(0)) e();
			this.openAbort?.abort(), this.openAbort = null, this.resizeObserver?.disconnect(), this.resizeObserver = null;
		}
		teardown() {
			this.close(), this.buildAbort?.abort(), this.buildAbort = null, this.host_ = null;
		}
		disconnectedCallback() {
			if (this.isOpen_) {
				let e = this.host_;
				this.closeView(), e?.onDisconnected();
			}
		}
		applySettings(e) {
			if (!this.built) return;
			this.settings = e;
			let t = e.appearance, n = t.theme === "dark" || t.theme === "auto" && typeof matchMedia == "function" && matchMedia("(prefers-color-scheme: dark)").matches;
			this.theme = n ? "dark" : "light";
			let r = Ia(t.orpColor, $a[this.theme], 3);
			this.root.dataset.theme = this.theme, this.root.dataset.guides = String(t.showGuides), this.root.style.setProperty("--orp", r), this.root.style.setProperty("--rsvp-size", `${t.fontSize}px`), this.root.style.setProperty("--rsvp-font", Qa[t.fontFamily]), this.root.style.setProperty("--axis", `${qa * 100}%`), this.panel.update(e, r !== t.orpColor), this.isOpen_ && (this.renderSpeed(this.host.engine.getSnapshot()), this.align());
		}
		toggleSettings(e, t = !0) {
			let n = e ?? this.panel.element.hidden;
			this.panel.element.hidden = !n, this.settingsButton.setAttribute("aria-expanded", String(n)), t && (n ? this.panel.firstFocusable() : this.settingsButton).focus({ preventScroll: !0 }), this.align();
		}
		renderSnapshot(e) {
			let t = this.host.labels, n = this.host.engine;
			if (e.index !== this.lastWordIndex) {
				this.lastWordIndex = e.index;
				let r = n.currentWord(), i = Ba(r?.text ?? "", this.segmenter);
				this.beforeEl.textContent = i.before, this.pivotEl.textContent = i.pivot, this.afterEl.textContent = r?.continues && !/[-‐/_.]$/u.test(r.text) ? `${i.after}‐` : i.after, this.align(), this.fullText.highlight(e.index, e.sentenceIndex), this.range.value = String(Math.max(0, e.index));
				let a = t.wordPosition(e.index + 1, e.total);
				this.range.setAttribute("aria-valuetext", a), this.positionText.textContent = `${e.index + 1} / ${e.total}`;
			}
			if (this.renderRemaining(e), e.status !== this.lastStatus) {
				let n = this.lastStatus;
				this.lastStatus = e.status;
				let r = e.status === "playing";
				Ua(this.playButton, r ? "pause" : "play");
				let i = r ? t.pause : t.play;
				this.playButton.setAttribute("aria-label", i), this.playButton.title = i, this.stageStatus.textContent = e.status === "complete" ? t.statusComplete : "", n !== null && (this.live.textContent = e.status === "playing" ? t.statusPlaying : e.status === "complete" ? t.statusComplete : e.status === "paused" ? t.statusPaused(e.index + 1, e.total) : ""), this.root.dataset.status = e.status;
			}
			this.renderSpeed(e);
		}
		renderRemaining(e) {
			let t = Math.max(0, e.total - e.index - 1), n = Math.round(t / e.speed);
			this.remainingText.textContent = this.host.labels.remaining(n);
		}
		renderSpeed(e) {
			let t = `${e.speed} ${this.host.labels.speedUnit}`;
			this.speedValue.textContent !== t && (this.speedValue.textContent = t), this.rampText.hidden = !e.accelerating;
		}
		align() {
			if (!this.isOpen_ || !this.settings) return;
			let e = this.stage.clientWidth;
			if (e === 0) return;
			let t = this.settings.appearance.fontSize;
			this.wordEl.style.fontSize = `${t}px`;
			let n = this.beforeEl.getBoundingClientRect().width, r = this.pivotEl.getBoundingClientRect().width, i = this.afterEl.getBoundingClientRect().width, { offsetX: a, scale: o } = Ka({
				stageWidth: e,
				axisX: e * qa,
				beforeWidth: n,
				pivotWidth: r,
				afterWidth: i,
				padding: 12,
				minScale: Math.min(1, to / t)
			});
			o < 1 && (this.wordEl.style.fontSize = `${t * o}px`), this.wordEl.style.transform = `translate(${a}px, -50%)`;
		}
		onClick(e) {
			let t = e.target.closest?.("[data-action]");
			if (!t || !this.dialog.contains(t)) return;
			let n = this.host.engine;
			switch (t.dataset.action) {
				case "close":
					this.host.requestClose();
					break;
				case "toggle":
					n.toggle("user");
					break;
				case "prev-word":
					n.previousWord();
					break;
				case "next-word":
					n.nextWord();
					break;
				case "prev-sentence":
					n.previousSentence();
					break;
				case "next-sentence":
					n.nextSentence();
					break;
				case "slower":
					this.host.setSpeed(n.getSpeed() - i.step);
					break;
				case "faster": this.host.setSpeed(n.getSpeed() + i.step);
			}
		}
		onKeyDown(e) {
			if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey || e.isComposing) return;
			let t = io(e), n = !!t?.closest?.(ro), r = !!t?.closest?.(no), a = !!t?.closest?.(".fulltext"), o = !!t?.closest?.(".panel"), s = this.host.engine, c = (t) => {
				e.preventDefault(), t();
			};
			switch (e.key) {
				case "Escape":
					c(() => {
						this.panel.element.hidden ? this.host.requestClose() : this.toggleSettings(!1);
					});
					return;
				case " ":
				case "Spacebar":
					!r && !a && c(() => s.toggle("user"));
					return;
				case "k":
				case "K":
					n || c(() => s.toggle("user"));
					return;
				case "ArrowLeft":
					!n && !o && c(() => e.shiftKey ? s.previousSentence() : s.previousWord());
					return;
				case "ArrowRight":
					!n && !o && c(() => e.shiftKey ? s.nextSentence() : s.nextWord());
					return;
				case "ArrowUp":
					n || a || o || c(() => this.host.setSpeed(s.getSpeed() + i.step));
					return;
				case "ArrowDown":
					n || a || o || c(() => this.host.setSpeed(s.getSpeed() - i.step));
					return;
				case "+":
				case "=":
					n || c(() => this.host.setSpeed(s.getSpeed() + i.step));
					return;
				case "-":
				case "_":
					n || c(() => this.host.setSpeed(s.getSpeed() - i.step));
					return;
				case "PageUp":
				case "PageDown":
					!a && !o && e.preventDefault();
					return;
				case "Home":
					n || a || o || c(() => s.seek(0));
					return;
				case "End":
					n || a || o || c(() => s.seek(2 ** 53 - 1));
					return;
				default: return;
			}
		}
		get parts() {
			return {
				dialog: this.dialog,
				stage: this.stage,
				word: this.wordEl,
				pivot: this.pivotEl,
				fullText: this.fullText,
				panel: this.panel
			};
		}
	}
	return ao = e, e;
}
var so = "urr-reader";
function co(e = so) {
	let t = globalThis.customElements;
	if (!t) throw Error("customElements indisponible");
	return t.get(e) || t.define(e, class extends oo() {}), e;
}
// src/api/preferences.ts
var lo = 1, uo = "urr:prefs:v1";
function fo(e) {
	return {
		version: 1,
		settings: se(e)
	};
}
function po(e) {
	let t = e;
	if (typeof t == "string") try {
		t = JSON.parse(t);
	} catch {
		return null;
	}
	if (typeof t != "object" || !t) return null;
	let { version: n, settings: r } = t;
	return n === 1 ? ae(r) : null;
}
function mo(e) {
	if (e) return e;
	try {
		return globalThis.localStorage ?? null;
	} catch {
		return null;
	}
}
function ho(e, t) {
	let n = e.getItem(t);
	return n === null ? null : po(n);
}
function go(e, t, n) {
	e.setItem(t, JSON.stringify(fo(n)));
}
// src/api/reader.ts
var $ = null, _o = [
	"profile",
	"speed",
	"timing",
	"acceleration",
	"appearance"
];
function vo(e) {
	return e.index < 0 ? null : {
		index: e.index,
		total: e.total,
		progress: e.progress,
		sentenceIndex: e.sentenceIndex,
		blockIndex: e.blockIndex,
		speed: e.speed
	};
}
function yo(e, t, n) {
	return e instanceof E ? e : new E(t, n, { cause: e });
}
function bo(e) {
	let t = e.activeElement;
	for (; t?.shadowRoot?.activeElement;) t = t.shadowRoot.activeElement;
	return t instanceof HTMLElement && t !== e.body ? t : null;
}
var xo = class {
	engine;
	labels;
	events = new n();
	options;
	settings;
	storage = null;
	storageKey;
	element = null;
	phase = "closed";
	announced = !1;
	opSeq = 0;
	destroyed = !1;
	title = null;
	restoreTarget = null;
	savedScroll = null;
	visibilityHandler = null;
	viewHost;
	constructor(e = {}) {
		this.options = e, this.labels = ja(e.uiLocale ?? "fr", e.labels), this.storageKey = e.persistence?.storageKey ?? "urr:prefs:v1";
		let t = w();
		e.settings && (t = oe(t, e.settings).settings);
		let n = null;
		if (e.preferences !== void 0 && (n = po(e.preferences)), e.persistence?.enabled && (this.storage = mo(e.persistence.storage), !n && this.storage)) try {
			n = ho(this.storage, this.storageKey);
		} catch (e) {
			this.reportStorageError(e);
		}
		this.settings = n ?? t, this.engine = new _e({
			speed: this.settings.speed,
			timing: this.settings.timing,
			acceleration: this.settings.acceleration,
			...e.clock ? { clock: e.clock } : {},
			...e.timer ? { timer: e.timer } : {}
		}), this.viewHost = {
			engine: this.engine,
			labels: this.labels,
			getSettings: () => this.getSettings(),
			updateSettings: (e) => void this.patch(e, "user"),
			resetSettings: () => void this.replace(w(), "user"),
			setSpeed: (e) => void this.applySpeed(e, "user"),
			activateWord: (e) => {
				this.engine.seek(e), this.options.resumeOnWordClick ? this.engine.play() : this.engine.pause("user");
			},
			requestClose: () => this.closeWith("user"),
			onDisconnected: () => this.closeWith("detached")
		}, this.engine.on("status", ({ status: e, previous: t, reason: n }) => {
			let r = this.getPosition();
			r && (e === "playing" ? this.emit("play", r) : e === "paused" && t === "playing" ? this.emit("pause", {
				...r,
				reason: n ?? "api"
			}) : e === "complete" && this.emit("complete", r));
		}), this.engine.on("position", (e) => {
			let t = vo(e);
			t && this.emit("progress", t);
		});
	}
	on(e, t) {
		return this.destroyed ? () => {} : this.events.on(e, t);
	}
	off(e, t) {
		this.events.off(e, t);
	}
	once(e, t) {
		let n = this.on(e, (e) => {
			n(), t(e);
		});
		return n;
	}
	emit(e, t) {
		this.events.emit(e, t, (t) => {
			e !== "error" && this.emit("error", { error: new E("LISTENER", `Erreur dans un abonné à « ${e} ».`, { cause: t }) });
		});
	}
	async open(e, t = {}) {
		if (this.destroyed) throw this.fail(new E("DESTROYED", "Ce lecteur a été détruit."));
		let n = this.checkEnvironment(), r;
		try {
			let n = t.contentLocale ?? this.options.contentLocale, i = t.exclude ?? this.options.exclude;
			r = Oa(e, {
				...n ? { locale: n } : {},
				...i ? { exclude: i } : {}
			});
		} catch (e) {
			throw this.fail(yo(e, "PARSE_ERROR", "Impossible d’extraire le contenu."));
		}
		let i = ++this.opSeq, a = () => i !== this.opSeq || this.destroyed, o = $;
		if ($ = this, o && o !== this && o.closeWith("superseded"), a() || $ !== this || this.phase === "open" && (this.engine.pause("api"), a())) throw this.aborted();
		if (this.phase === "closed") {
			this.restoreTarget = this.options.restoreFocus === !1 ? null : bo(n);
			let e = n.defaultView;
			this.savedScroll = e ? {
				x: e.scrollX,
				y: e.scrollY
			} : null;
		}
		this.phase = "opening";
		let s = r.blocks.find((e) => e.kind === "heading"), c = t.title ?? (s ? r.text.slice(s.start, s.end) : this.labels.dialogTitle);
		this.title = c;
		let l;
		try {
			l = this.ensureElement(n);
			let e = this.options.container?.isConnected ? this.options.container : n.body;
			l.parentNode !== e && e.append(l);
		} catch (e) {
			throw this.closeWith("error"), this.fail(yo(e, "ENVIRONMENT", "Impossible de créer le composant du lecteur."));
		}
		if (this.engine.load(r, t.startAt ?? 0), a()) throw this.aborted();
		try {
			l.open(r, c);
		} catch (e) {
			throw this.closeWith("error"), this.fail(yo(e, "ENVIRONMENT", "Impossible d’afficher le dialogue du lecteur."));
		}
		this.phase = "open", this.announced = !0, this.listenVisibility(n), this.emit("open", {
			title: c,
			wordCount: r.words.length,
			sentenceCount: r.sentences.length,
			sourceType: e.type
		}), (t.autoPlay ?? this.options.autoPlay) && !a() && this.phase === "open" && this.engine.play();
	}
	close() {
		this.closeWith("api");
	}
	closeWith(e) {
		if (this.phase === "closed") return;
		this.opSeq++;
		let t = this.engine.getSnapshot().status === "playing", n = this.getPosition(), r = this.announced;
		this.phase = "closed", this.announced = !1, this.engine.unload(), this.visibilityHandler &&= (this.element?.ownerDocument.removeEventListener("visibilitychange", this.visibilityHandler), null);
		let i = this.element;
		if (i && (i.close(), i.remove()), $ === this && ($ = null), this.restoreHost(), this.title = null, !r) return;
		let a = this.opSeq;
		t && n && this.emit("pause", {
			...n,
			reason: "close"
		}), a === this.opSeq && this.emit("close", {
			reason: e,
			position: n
		});
	}
	destroy() {
		this.destroyed || (this.destroyed = !0, this.closeWith("destroy"), this.engine.destroy(), this.element?.teardown(), this.element = null, this.events.clear());
	}
	aborted() {
		return this.fail(new E("ABORTED", "Ouverture interrompue par un appel plus récent (open, close ou destroy)."));
	}
	restoreHost() {
		let e = this.restoreTarget;
		this.restoreTarget = null;
		let t = this.savedScroll;
		if (this.savedScroll = null, e?.isConnected) try {
			e.focus({ preventScroll: !0 });
		} catch {}
		let n = this.element?.ownerDocument.defaultView ?? (typeof window < "u" ? window : null);
		t && n && (n.scrollX !== t.x || n.scrollY !== t.y) && n.scrollTo(t.x, t.y);
	}
	checkEnvironment() {
		let e = globalThis.document;
		if (!(e && globalThis.customElements !== void 0 && typeof globalThis.HTMLDialogElement?.prototype.showModal == "function")) throw this.fail(new E("ENVIRONMENT", "Le lecteur nécessite un navigateur prenant en charge les Web Components et <dialog>."));
		return e;
	}
	ensureElement(e) {
		if (this.element) return this.element;
		let t = co(this.options.tagName ?? "urr-reader"), n = e.createElement(t);
		if (typeof n.attach != "function") throw new E("ENVIRONMENT", `L'élément <${t}> est déjà défini par un autre script.`);
		return n.attach(this.viewHost), this.element = n, n;
	}
	listenVisibility(e) {
		this.visibilityHandler || this.options.pauseWhenHidden === !1 || (this.visibilityHandler = () => {
			e.visibilityState === "hidden" && this.engine.pause("hidden");
		}, e.addEventListener("visibilitychange", this.visibilityHandler));
	}
	fail(e) {
		return this.emit("error", { error: e }), e;
	}
	play() {
		this.phase === "open" && this.engine.play();
	}
	pause() {
		this.engine.pause("api");
	}
	resume() {
		this.phase === "open" && this.engine.resume();
	}
	toggle() {
		this.phase === "open" && this.engine.toggle("api");
	}
	seek(e) {
		this.engine.seek(e);
	}
	nextWord() {
		this.engine.nextWord();
	}
	previousWord() {
		this.engine.previousWord();
	}
	nextSentence() {
		this.engine.nextSentence();
	}
	previousSentence() {
		this.engine.previousSentence();
	}
	setSpeed(e) {
		return this.applySpeed(e, "api");
	}
	applySpeed(e, t) {
		if (this.destroyed) return this.settings.speed;
		let n = y(e);
		return this.engine.setSpeed(n), this.commit(oe(this.settings, { speed: n }), t, !1), n;
	}
	getSettings() {
		return se(this.settings);
	}
	updateSettings(e) {
		return this.patch(e, "api");
	}
	resetSettings() {
		return this.replace(w(), "api");
	}
	getPreferences() {
		return fo(this.settings);
	}
	setPreferences(e) {
		let t = po(e);
		return t ? (this.replace(t, "preferences"), !0) : !1;
	}
	patch(e, t) {
		return this.destroyed ? this.getSettings() : this.commit(oe(this.settings, e), t, !0);
	}
	replace(e, t) {
		if (this.destroyed) return this.getSettings();
		let n = ae(e), r = _o.filter((e) => JSON.stringify(n[e]) !== JSON.stringify(this.settings[e]));
		return this.commit({
			settings: n,
			changed: r
		}, t, !0);
	}
	commit(e, t, n) {
		let { settings: r, changed: i } = e;
		if (i.length === 0) return this.getSettings();
		this.settings = r;
		let a = i.includes("acceleration"), o = n && i.includes("speed"), s = a && r.acceleration.enabled;
		return (i.includes("timing") || a) && this.engine.configure({
			timing: r.timing,
			acceleration: r.acceleration,
			...o && s ? { speed: r.speed } : {}
		}), o && !s && this.engine.setSpeed(r.speed), this.element?.applySettings(r), this.persist(), this.emit("settings-change", {
			settings: this.getSettings(),
			changed: i,
			source: t
		}), this.getSettings();
	}
	persist() {
		if (this.options.persistence?.enabled && this.storage) try {
			go(this.storage, this.storageKey, this.settings);
		} catch (e) {
			this.reportStorageError(e);
		}
	}
	reportStorageError(e) {
		this.emit("error", { error: new E("STORAGE", "Préférences : stockage indisponible.", {
			cause: e,
			fatal: !1
		}) });
	}
	getState() {
		let e = this.engine.getSnapshot();
		return {
			status: this.destroyed ? "destroyed" : this.phase !== "open" || e.status === "idle" ? "closed" : e.status,
			engineStatus: e.status,
			isOpen: this.phase === "open",
			position: vo(e),
			speed: e.speed,
			accelerating: e.accelerating,
			title: this.title
		};
	}
	getPosition() {
		return vo(this.engine.getSnapshot());
	}
	getDocument() {
		return this.engine.getDocument();
	}
	get isOpen() {
		return this.phase === "open";
	}
	get isDestroyed() {
		return this.destroyed;
	}
};
function So(e = {}) {
	return new xo(e);
}
// src/index.ts
var Co = "1.0.0";
export { o as ACCELERATION_DURATION, m as DEFAULT_ORP_COLOR, uo as DEFAULT_STORAGE_KEY, so as DEFAULT_TAG_NAME, a as FONT_SIZE, Aa as LABELS_EN, ka as LABELS_FR, lo as PREFERENCES_VERSION, l as PROFILES, E as ReaderError, i as SPEED, s as TIMING_BOUNDS, c as TIMING_PRESETS, Co as VERSION, So as createReader, co as defineReaderElement, ye as isReaderError, po as parsePreferences, Oa as parseSource, Ba as splitOrp, me as wordDuration };

//# sourceMappingURL=universal-rsvp-reader.js.map