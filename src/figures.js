/* Animated exercise figures: original SVG illustrations.
   Views: side ("s", default), front ("f"), rear ("r").
   Arms can be posed by hand target (IK) or by joint angles (FK). Joint angles make true arcs and keep elbows fixed. */
const FIG = (function () {
  const G = 262;                                   // floor line
  const L = {th: 52, sh: 52, to: 60, nk: 10, hd: 15, ua: 34, fa: 33, ft: 18};
  const C = {shirt: "#c4553a", skin: "#e9bb9a", skinF: "#f1d0b9", pants: "#3b3849", pantsF: "#7b788c",
             shoe: "#2b2420", hair: "#2b2420", prop: "#4b4650", mat: "#e6d9cf", floor: "#e9dfd6", bg: "#f7f1ec",
             band: "#2f9e6b", bandR: "#d9433a", wood: "#d9b684", woodD: "#b8925b"};
  const rad = d => d * Math.PI / 180;
  const lerp = (a, b, u) => a + (b - a) * u;
  const f1 = n => Math.round(n * 10) / 10;
  const ease = x => x * x * (3 - 2 * x);

  // two-bone inverse kinematics
  function ik(a, b, l1, l2, bend) {
    let dx = b[0] - a[0], dy = b[1] - a[1], r = Math.hypot(dx, dy);
    if (r < 0.001) { dx = 0; dy = 1; r = 1; }
    const ux = dx / r, uy = dy / r;
    const d = Math.min(Math.max(r, Math.abs(l1 - l2) + 0.5), l1 + l2 - 0.5);
    const x = (d * d + l1 * l1 - l2 * l2) / (2 * d), h = Math.sqrt(Math.max(0, l1 * l1 - x * x));
    const nx = uy * bend, ny = -ux * bend;
    return {j: [a[0] + ux * x + nx * h, a[1] + uy * x + ny * h], e: [a[0] + ux * d, a[1] + uy * d]};
  }
  // forward kinematics from absolute segment angles
  const dS = t => [Math.sin(rad(t)), Math.cos(rad(t))];     // side view: 0 down, 90 forward, 180 up, 270 back
  const dL = t => [-Math.sin(rad(t)), Math.cos(rad(t))];    // front/rear, left arm: 0 down, 90 out to the side
  const dR = dS;                                            // front/rear, right arm
  function fk(sh, angs, dir, s, fs) {          // fs: optional forearm scale (forearm pointing toward the viewer)
    const u = dir(angs[0]), f = dir(angs[1]), k = fs == null ? 1 : fs;
    const j = [sh[0] + u[0] * L.ua * s, sh[1] + u[1] * L.ua * s];
    return {j, e: [j[0] + f[0] * L.fa * s * k, j[1] + f[1] * L.fa * s * k]};
  }
  // front/rear arm swinging forward around the body (a chest fly): only the sideways part shrinks,
  // k = cos(yaw) goes from 1 (out to the side) through 0 (pointing at the viewer) to negative (crossing in front)
  function fkYaw(sh, angs, dir, k) {
    const u = dir(angs[0]), f = dir(angs[1]);
    const j = [sh[0] + u[0] * L.ua * k, sh[1] + u[1] * L.ua];
    return {j, e: [j[0] + f[0] * L.fa * k, j[1] + f[1] * L.fa]};
  }
  // legs posed by joint angles: [thigh, shin], same angle convention as the arms
  function fkLeg(hp, angs, dir) {
    const u = dir(angs[0]), f = dir(angs[1]);
    const j = [hp[0] + u[0] * L.th, hp[1] + u[1] * L.th];
    return {j, e: [j[0] + f[0] * L.sh, j[1] + f[1] * L.sh]};
  }

  // svg helpers
  const ln = (p, q, w, c) => `<line x1="${f1(p[0])}" y1="${f1(p[1])}" x2="${f1(q[0])}" y2="${f1(q[1])}" stroke="${c}" stroke-width="${w}" stroke-linecap="round"/>`;
  const pl = (pts, w, c) => `<polyline points="${pts.map(p => f1(p[0]) + "," + f1(p[1])).join(" ")}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
  const ci = (p, r, c) => `<circle cx="${f1(p[0])}" cy="${f1(p[1])}" r="${r}" fill="${c}"/>`;
  const mid = (a, b, k) => [a[0] + (b[0] - a[0]) * (k == null ? 0.5 : k), a[1] + (b[1] - a[1]) * (k == null ? 0.5 : k)];
  const angOf = (j, e) => Math.atan2(e[1] - j[1], e[0] - j[0]) * 180 / Math.PI;

  // props
  const db = (p, ang, sc) => `<g transform="translate(${f1(p[0])} ${f1(p[1])}) rotate(${f1(ang)}) scale(${sc || 1.15})"><rect x="-9" y="-2.5" width="18" height="5" rx="2" fill="${C.prop}"/><rect x="-14" y="-9" width="7" height="18" rx="2.5" fill="${C.prop}"/><rect x="7" y="-9" width="7" height="18" rx="2.5" fill="${C.prop}"/></g>`;
  const dbEnd = p => `<circle cx="${f1(p[0])}" cy="${f1(p[1])}" r="9" fill="${C.prop}"/><circle cx="${f1(p[0])}" cy="${f1(p[1])}" r="3.5" fill="#8d8793"/>`;
  const mat = () => `<rect x="30" y="${G}" width="340" height="11" rx="5" fill="${C.mat}"/>`;
  const bench = (x, y, w) => `<rect x="${x}" y="${y}" width="${w}" height="10" rx="3" fill="${C.wood}"/><rect x="${x + 7}" y="${y + 10}" width="8" height="${G - y - 10}" fill="${C.woodD}"/><rect x="${x + w - 15}" y="${y + 10}" width="8" height="${G - y - 10}" fill="${C.woodD}"/>`;
  const ring = (a, b, k, col) => {
    const p = mid(a, b, k), dx = b[0] - a[0], dy = b[1] - a[1], r = Math.hypot(dx, dy) || 1, nx = -dy / r, ny = dx / r;
    return ln([p[0] + nx * 11, p[1] + ny * 11], [p[0] - nx * 11, p[1] - ny * 11], 5, col);
  };
  // straight body line from the ankles at angle phi (degrees above horizontal)
  const plank = (ax, ay, phi) => {
    const p = rad(phi);
    return {hip: [ax + 103 * Math.cos(p), ay - 103 * Math.sin(p)], t: 90 - phi, f: [ax, ay], f2: [ax - 6, ay], fa: 55, fa2: 55};
  };
  // straight line from the knees (shins flat on the floor) at angle phi
  const kneePlank = (kx, ky, phi) => {
    const p = rad(phi);
    return {hip: [kx + 52 * Math.cos(p), ky - 52 * Math.sin(p)], t: 90 - phi, f: [kx - 52, ky], f2: [kx - 58, ky], fa: 172, fa2: 172};
  };
  // lateral band walk stance: left and right ankle x
  const lw = (a, b) => { const cx = (a + b) / 2; return {c: [cx, 172], fl: [a, 254], fr: [b, 254], hl: [cx - 34, 154], hr: [cx + 34, 154]}; };

  // ---------- pose handling ----------
  function normSide(P) {
    const o = Object.assign({h: 0, fa: 27, fa2: 27, lb: 1, ab: -1, as: 1}, P);
    if (!o.f2 && o.f) o.f2 = [o.f[0] - 8, o.f[1]];
    if (o.hd && !o.hd2) o.hd2 = [o.hd[0] - 3, o.hd[1]];
    if (o.arm && !o.arm2) o.arm2 = o.arm;
    return o;
  }
  // kL/kR: [thigh, shin] length scale for a leg pointing partly toward the viewer (front view)
  const normFront = P => Object.assign({ts: 1, bl: -1, br: 1, al: -1, ar: 1, as: 1, fo: 12, sx: 0, hx: 0, hy: 0, kL: [1, 1], kR: [1, 1]}, P);
  function mix(a, b, u) {
    if (typeof a === "number") return lerp(a, b, u);
    if (Array.isArray(a)) return a.map((v, i) => mix(v, b[i], u));
    return a;
  }
  function mixPose(A, B, u) { const o = {}; for (const k in A) o[k] = (k in B) ? mix(A[k], B[k], u) : A[k]; return o; }
  function poseOf(ex, st) {
    const nm = (ex.v === "f" || ex.v === "r") ? normFront : normSide;
    if (ex.seq) {
      const n = ex.seq.length, A = nm(ex.seq[st.i]), B = nm(ex.seq[(st.i + 1) % n]), o = mixPose(A, B, st.s);
      ["fl", "fr", "f", "f2"].forEach(k => {                 // lift whichever foot is stepping
        if (A[k] && B[k] && Math.abs(A[k][0] - B[k][0]) > 2) o[k] = [o[k][0], o[k][1] - 7 * Math.sin(Math.PI * st.s)];
      });
      return o;
    }
    const o = mixPose(nm(ex.a), nm(ex.b), st.u);
    if (ex.walk) {
      const lift = 11 * Math.sin(Math.PI * st.u);
      if (st.dir > 0) o.f2 = [o.f2[0], o.f2[1] - lift]; else o.f = [o.f[0], o.f[1] - lift];
    }
    return o;
  }

  // ---------- side view ----------
  function solveSide(P) {
    const hip = P.hip, th = rad(P.t), d = [Math.sin(th), -Math.cos(th)], nf = [Math.cos(th), Math.sin(th)];
    const sh = [hip[0] + d[0] * L.to, hip[1] + d[1] * L.to];
    const ht = rad(P.t + P.h), hdv = [Math.sin(ht), -Math.cos(ht)], hnf = [Math.cos(ht), Math.sin(ht)];
    const head = [sh[0] + hdv[0] * (L.nk + L.hd), sh[1] + hdv[1] * (L.nk + L.hd)];
    const legN = P.leg ? fkLeg(hip, P.leg, dS) : ik(hip, P.f, L.th, L.sh, P.lb);
    const legF = P.leg2 ? fkLeg(hip, P.leg2, dS) : ik(hip, P.f2, L.th, L.sh, P.lb);
    const as = P.hab != null ? Math.max(0.03, Math.cos(rad(P.hab))) : P.as;   // arm swinging toward the viewer looks shorter
    const armN = P.arm ? fk(sh, P.arm, dS, as, P.fs) : ik(sh, P.hd, L.ua * as, L.fa * as, P.ab);
    const armF = P.arm2 ? fk(sh, P.arm2, dS, as, P.fs) : ik(sh, P.hd2, L.ua * as, L.fa * as, P.ab);
    return {hip, sh, head, d, nf, hnf, legN, legF, armN, armF, P};
  }
  function anchorsSide(S) {
    const al = (f, off) => [S.hip[0] + S.d[0] * L.to * f + S.nf[0] * off, S.hip[1] + S.d[1] * L.to * f + S.nf[1] * off];
    return {
      back: [[...al(0.68, -6), 22]], chest: [[...al(0.78, 7), 18]], core: [[...al(0.3, 8), 18]],
      glute: [[...al(0, -8), 19]], thigh: [[...mid(S.hip, S.legN.j, 0.55), 20]], thighF: [[...mid(S.hip, S.legF.j, 0.55), 20]],
      arm: [[...mid(S.sh, S.armN.j, 0.5), 15]], lat: [[...al(0.6, 0), 24]], delt: [[S.sh[0], S.sh[1], 15]],
      calf: [[...mid(S.legN.j, S.legN.e, 0.4), 14]]
    };
  }
  function drawSide(ex, P) {
    const S = solveSide(P);
    const toe = (e, a) => [e[0] + L.ft * Math.cos(rad(a)), e[1] + L.ft * Math.sin(rad(a))];
    let o = "";
    if (ex.pb) o += ex.pb(S);
    o += pl([S.hip, S.legF.j, S.legF.e], 15, C.pantsF) + ln(S.legF.e, toe(S.legF.e, P.fa2), 9, "#5d5660");
    o += pl([S.sh, S.armF.j, S.armF.e], 10, C.skinF) + ci(S.armF.e, 5, C.skinF);
    o += ln(S.hip, S.sh, 30, C.shirt);
    o += pl([S.hip, S.legN.j, S.legN.e], 16, C.pants) + ln(S.legN.e, toe(S.legN.e, P.fa), 10, C.shoe);
    o += ci(S.hip, 13.5, C.pants);
    const nearArm = pl([S.sh, S.armN.j, S.armN.e], 11, C.skin) + ci(S.armN.e, 5.5, C.skin);
    const head = ln(S.sh, S.head, 10, C.skin) +
      ci([S.head[0] - S.hnf[0] * 2.5, S.head[1] - S.hnf[1] * 2.5], 15.5, C.hair) +
      ci([S.head[0] + S.hnf[0] * 2.5, S.head[1] + S.hnf[1] * 2.5], 13, C.skin);
    o += P.armFront ? head + nearArm : nearArm + head;     // arms overhead pass in front of the head
    if (ex.pf) o += ex.pf(S);
    return {svg: o, anchors: anchorsSide(S)};
  }

  // ---------- front and rear views ----------
  function solveFront(P) {
    const c = P.c, s = P.ts, sc = [c[0] + P.sx, c[1] - L.to * s];
    const SW = 22, HW = 12;
    const hl = [c[0] - HW, c[1]], hr = [c[0] + HW, c[1]], sl = [sc[0] - SW, sc[1]], sr = [sc[0] + SW, sc[1]];
    const head = [sc[0] + P.hx, sc[1] - (L.nk + L.hd) * (0.55 + 0.45 * s) + P.hy];
    const lL = P.lgL ? fkLeg(hl, P.lgL, dL) : ik(hl, P.fl, L.th * P.kL[0], L.sh * P.kL[1], P.bl);
    const lR = ik(hr, P.fr, L.th * P.kR[0], L.sh * P.kR[1], P.br);
    const as = P.hab != null ? Math.max(0.03, Math.sin(rad(P.hab))) : P.as;
    const yk = P.yaw != null ? Math.cos(rad(P.yaw)) : null;
    const aL = P.armL ? (yk != null ? fkYaw(sl, P.armL, dL, yk) : fk(sl, P.armL, dL, as)) : ik(sl, P.hl, L.ua * as, L.fa * as, P.al);
    const aR = P.armR ? (yk != null ? fkYaw(sr, P.armR, dR, yk) : fk(sr, P.armR, dR, as, P.fsR)) : ik(sr, P.hr, L.ua * as, L.fa * as, P.ar);
    return {c, sc, hl, hr, sl, sr, head, lL, lR, aL, aR, P};
  }
  function anchorsFront(S) {
    return {
      delt: [[S.sl[0], S.sl[1], 15], [S.sr[0], S.sr[1], 15]],
      arm: [[...mid(S.sl, S.aL.j), 14], [...mid(S.sr, S.aR.j), 14]],
      thigh: [[...mid(S.hl, S.lL.j, 0.55), 19], [...mid(S.hr, S.lR.j, 0.55), 19]],
      hipj: [[S.hl[0] - 4, S.hl[1], 17], [S.hr[0] + 4, S.hr[1], 17]],
      upperback: [[S.sc[0], S.sc[1] + 13, 27]],
      chest: [[S.sc[0] - 11, S.sc[1] + 15, 15], [S.sc[0] + 11, S.sc[1] + 15, 15]],
      innerL: [[mid(S.hl, S.lL.j, 0.5)[0] + 8, mid(S.hl, S.lL.j, 0.5)[1], 15]],
      oblique: [[...mid(S.sr, S.hr, 0.55), 17]]
    };
  }
  function drawFR(ex, P, rear) {
    const S = solveFront(P);
    let o = "";
    const bg = ex.pb ? ex.pb(S) : "";
    if (P.rot == null) o += bg;
    if (P.lfront){   // left leg crosses in front of the right
      o += pl([S.hr, S.lR.j, S.lR.e], 16, C.pants) + ln(S.lR.e, [S.lR.e[0] + P.fo, S.lR.e[1] + 7], 10, C.shoe);
      o += pl([S.hl, S.lL.j, S.lL.e], 16, C.pants) + ln(S.lL.e, [S.lL.e[0] - P.fo, S.lL.e[1] + 7], 10, C.shoe);
    } else {
      o += pl([S.hl, S.lL.j, S.lL.e], 16, C.pants) + pl([S.hr, S.lR.j, S.lR.e], 16, C.pants);
      o += ln(S.lL.e, [S.lL.e[0] - P.fo, S.lL.e[1] + 7], 10, C.shoe) + ln(S.lR.e, [S.lR.e[0] + P.fo, S.lR.e[1] + 7], 10, C.shoe);
    }
    o += `<polygon points="${f1(S.hl[0] - 4)},${f1(S.c[1] - 6)} ${f1(S.hr[0] + 4)},${f1(S.c[1] - 6)} ${f1(S.hr[0] + 4)},${f1(S.c[1] + 16)} ${f1(S.hl[0] - 4)},${f1(S.c[1] + 16)}" fill="${C.pants}" stroke="${C.pants}" stroke-width="6" stroke-linejoin="round"/>`;
    const arms = pl([S.sl, S.aL.j, S.aL.e], 11, C.skin) + pl([S.sr, S.aR.j, S.aR.e], 11, C.skin) + ci(S.aL.e, 5.5, C.skin) + ci(S.aR.e, 5.5, C.skin);
    const head = rear
      ? ln(S.sc, S.head, 10, C.skin) + ci(S.head, 15.5, C.hair)                     // back of the head
      : ln(S.sc, S.head, 10, C.skin) + ci([S.head[0], S.head[1] - 2], 15.5, C.hair) + ci([S.head[0], S.head[1] + 1.5], 13, C.skin);
    const torso = `<polygon points="${f1(S.sl[0])},${f1(S.sl[1])} ${f1(S.sr[0])},${f1(S.sr[1])} ${f1(S.hr[0] + 2)},${f1(S.c[1])} ${f1(S.hl[0] - 2)},${f1(S.c[1])}" fill="${C.shirt}" stroke="${C.shirt}" stroke-width="12" stroke-linejoin="round"/>`;
    if (P.headBehind) o += head;
    if (P.armsBehind) { if (ex.pm) o += ex.pm(S); o += arms; }
    o += torso;
    if (!P.armsBehind) { if (ex.pm) o += ex.pm(S); o += arms; }
    if (!P.headBehind) o += head;
    if (ex.pf) o += ex.pf(S);
    let an = anchorsFront(S);
    if (P.rot != null){
      const [px, py] = P.piv, ca = Math.cos(rad(P.rot)), sa = Math.sin(rad(P.rot));
      const rp = a => [px + (a[0] - px) * ca - (a[1] - py) * sa, py + (a[0] - px) * sa + (a[1] - py) * ca, a[2]];
      o = bg + `<g transform="rotate(${f1(P.rot)} ${px} ${py})">${o}</g>`;
      for (const k in an) an[k] = an[k].map(rp);
    }
    return {svg: o, anchors: an};
  }

  // ---------- exercises ----------
  // a = start pose, b = finish pose (or seq = list of poses). ge = when the muscles work hardest (0 start, 1 finish, .5 always).
  // tm = seconds [to finish, hold finish, back to start, hold start]; tl = on-screen cue for each of those phases.
  const ANIM = {
    "Goblet squat": {
      a: {hip: [192, 152], t: 4, h: -4, f: [200, 254], hd: [214, 102]},
      b: {hip: [160, 196], t: 32, h: -22, f: [200, 254], hd: [205, 152]},
      pf: S => db(S.armN.e, 90), glow: ["thigh", "glute"], ge: 0.5,
      tm: [2.4, 0.3, 1.2, 0.6], tl: ["Lower slowly (2–3 sec)", "", "Drive up through your heels", ""]
    },
    "Staggered-stance one-arm row": {
      a: {hip: [180, 160], t: 62, h: -10, f: [156, 254], f2: [214, 254], hd: [236, 198], hd2: [205, 192]},
      b: {hip: [180, 160], t: 62, h: -10, f: [156, 254], f2: [214, 254], hd: [222, 160], hd2: [205, 192]},
      pf: S => db(S.armN.e, 0), glow: ["lat", "arm"], ge: 1,
      tm: [1.0, 0.6, 2.0, 0.4], tl: ["Pull elbow toward your hip", "Squeeze", "Lower slowly", ""]
    },
    "Knee push-up": {
      a: {...kneePlank(130, 254, 33), hd: [234, 258], h: 4},
      b: {...kneePlank(130, 254, 7.2), hd: [234, 258], h: 4},
      pb: () => mat(), glow: ["chest", "arm"], ge: 1,
      tm: [2.2, 0.3, 1.1, 0.5], tl: ["Lower slowly, knees to head straight", "", "Push the floor away", ""]
    },
    "Band lat pulldown": {
      a: {hip: [265, 202], t: -12, h: -6, f: [213, 254], f2: [207, 254], fa: 172, fa2: 172, hd: [289.7, 88.8], ab: -1, armFront: true},
      b: {hip: [265, 202], t: -12, h: -6, f: [213, 254], f2: [207, 254], fa: 172, fa2: 172, hd: [268, 150], ab: -1, armFront: true},
      pb: () => mat() + `<rect x="332" y="14" width="14" height="${G - 14}" fill="${C.wood}"/><rect x="326" y="18" width="10" height="12" rx="2" fill="${C.prop}"/>`,
      pf: S => ln(S.armF.e, [331, 24], 4, C.band) + ln(S.armN.e, [331, 24], 4, C.band),
      glow: ["lat", "back"], ge: 1,
      tm: [1.0, 0.6, 2.0, 0.4], tl: ["Pull elbows down to your sides", "Squeeze shoulder blades down", "Let your arms rise slowly", ""]
    },
    "Dumbbell Romanian deadlift": {
      a: {hip: [198, 153], t: 3, h: -3, f: [203, 254], hd: [210, 160]},
      b: {hip: [164, 162], t: 72, h: -10, f: [203, 254], hd: [205, 212]},
      pf: S => db(S.armN.e, 0), glow: ["glute", "thigh"], ge: 0.5,
      tm: [2.4, 0.3, 1.3, 0.5], tl: ["Push hips back slowly", "", "Squeeze glutes to stand", ""]
    },
    "Overhead triceps extension": {
      a: {hip: [198, 153], t: 0, f: [203, 254], arm: [170, 172], armFront: true},
      b: {hip: [198, 153], t: 0, f: [203, 254], arm: [170, 335], armFront: true},
      pf: S => db([S.armN.e[0], S.armN.e[1] + 14], 90), glow: ["arm"], ge: 0.5,
      tm: [2.2, 0.3, 1.1, 0.5], tl: ["Lower behind your head slowly", "", "Straighten, elbows stay still", ""]
    },
    "Plank": {
      a: {...plank(70, 246, 11.2), hd: [266, 252], h: 6},
      b: {...plank(70, 246, 10.2), hd: [266, 252], h: 6},
      pb: () => mat(), glow: ["core"], ge: 0.5,
      tm: [2.5, 0, 2.5, 0], tl: ["Hold, keep breathing", "Hold, keep breathing", "Hold, keep breathing", "Hold, keep breathing"]
    },
    "Reverse lunge": {
      a: {hip: [212, 153], t: 3, f: [215, 254], f2: [208, 254], hd: [216, 158]},
      b: {hip: [178, 200], t: 4, f: [215, 254], f2: [122, 238], fa2: 60, hd: [182, 205]},
      pf: S => db(S.armN.e, 0), glow: ["glute", "thigh"], ge: 0.5,
      tm: [2.0, 0.3, 1.2, 0.6], tl: ["Step back and lower", "", "Push through your front heel", ""]
    },
    "Bent-over two-arm dumbbell row": {
      a: {hip: [165, 157], t: 60, h: -10, f: [188, 254], f2: [180, 254], hd: [216, 192]},
      b: {hip: [165, 157], t: 60, h: -10, f: [188, 254], f2: [180, 254], hd: [205, 155]},
      pf: S => db(S.armF.e, 0, 1.05) + db(S.armN.e, 0), glow: ["lat"], ge: 1,
      tm: [1.0, 0.6, 2.0, 0.4], tl: ["Pull elbows back", "Squeeze", "Lower slowly", ""]
    },
    "Glute bridge with band": {
      a: {hip: [262, 248], t: -90, h: 0, f: [300, 254], hd: [258, 254], ab: 1},
      b: {hip: [256.8, 223.6], t: -114, h: 24, f: [300, 254], hd: [258, 254], ab: 1},
      pb: () => mat(), pf: S => ring(S.hip, S.legN.j, 0.9, C.band), glow: ["glute"], ge: 1,
      tm: [1.1, 1.0, 2.0, 0.4], tl: ["Lift hips", "Squeeze 1 sec, no arching", "Lower slowly", ""]
    },
    "Close-grip floor press": {
      a: {hip: [262, 248], t: -90, h: 0, f: [290, 254], arm: [175, 178]},
      b: {hip: [262, 248], t: -90, h: 0, f: [290, 254], arm: [80, 180]},
      pb: () => mat(), pf: S => db(S.armN.e, 0), glow: ["arm", "chest"], ge: 1,
      tm: [2.2, 0.3, 1.1, 0.5], tl: ["Lower slowly, elbows tucked", "", "Press up", ""]
    },
    "Dead bug": {
      a: {hip: [262, 248], t: -90, h: 0, f: [314, 196], f2: [306, 196], fa: -75, fa2: -75, hd: [202, 181], hd2: [199, 181], ab: 1},
      b: {hip: [262, 248], t: -90, h: 0, f: [366, 238], f2: [306, 196], fa: -75, fa2: -75, hd: [202, 181], hd2: [136, 238], ab: 1},
      pb: () => mat(), glow: ["core"], ge: 0.5,
      tm: [2.2, 0.4, 2.0, 0.6], tl: ["Reach out slowly, back flat", "", "Return", ""]
    },
    "Dumbbell pullover": {
      a: {hip: [262, 248], t: -90, h: 0, f: [290, 254], arm: [180, 188]},
      b: {hip: [262, 248], t: -90, h: 0, f: [290, 254], arm: [262, 270]},
      pb: () => mat(),
      pf: S => { const e = S.armN.e, a = rad(angOf(S.armN.j, e)); return db([e[0] + Math.cos(a) * 9, e[1] + Math.sin(a) * 9], a * 180 / Math.PI); },
      glow: ["lat", "chest"], ge: 0.5,
      tm: [2.4, 0.3, 1.4, 0.4], tl: ["Lower behind your head slowly", "", "Pull back over your chest", ""]
    },
    "Close-grip push-up": {
      a: {...plank(75, 246, 18.9), hd: [230, 258], h: 4},
      b: {...plank(75, 246, 6), hd: [230, 258], h: 4},
      pb: () => mat(), glow: ["arm", "chest"], ge: 1,
      tm: [2.2, 0.3, 1.1, 0.5], tl: ["Lower slowly, elbows tucked", "", "Push up", ""]
    },
    "Farmer's march": {
      seq: [
        {hip: [200, 152], t: 0, f: [206, 254], f2: [198, 254], hd: [203, 160], hd2: [197, 160]},
        {hip: [200, 152], t: 0, f: [220, 222], f2: [198, 254], hd: [203, 160], hd2: [197, 160]},
        {hip: [200, 152], t: 0, f: [206, 254], f2: [198, 254], hd: [203, 160], hd2: [197, 160]},
        {hip: [200, 152], t: 0, f: [206, 254], f2: [212, 222], hd: [203, 160], hd2: [197, 160]}
      ], segT: 0.5, segH: 0.1,
      pf: S => db(S.armF.e, 0, 1.05) + db(S.armN.e, 0), glow: ["lat", "core"],
      tl: ["March in place, stand tall", "March in place, stand tall", "March in place, stand tall", "March in place, stand tall"]
    },

    // ---- Lower B (4-day plan) ----
    "Split squat": {
      a: {hip: [172, 165], t: 3, f: [224, 254], f2: [116, 249], fa2: 46, arm: [0, 0], arm2: [0, 0]},
      b: {hip: [172, 199], t: 3, f: [224, 254], f2: [116, 249], fa2: 46, arm: [0, 0], arm2: [0, 0]},
      pf: S => db(S.armN.e, 0), glow: ["thigh", "glute"], ge: 0.5,
      tm: [2.0, 0.3, 1.2, 0.6], tl: ["Lower straight down", "", "Push through your front heel", ""]
    },
    "Single-leg Romanian deadlift": {
      // near leg = lifted leg (joint angles keep it straight), far leg = standing leg; dumbbell in the near hand = opposite the standing leg
      a: {hip: [198, 153], t: 3, h: -3, leg: [-8, -35], fa: 20, f2: [203, 254], fa2: 27, arm: [0, 0], arm2: [0, 0]},
      b: {hip: [190, 153], t: 80, h: -4, leg: [-80, -80], fa: 90, f2: [203, 254], fa2: 27, arm: [0, 0], arm2: [0, 0]},
      pf: S => db(S.armN.e, 0), glow: ["glute", "thighF"], ge: 0.5,
      tm: [2.4, 0.3, 1.4, 0.5], tl: ["Hinge forward, back leg floats up", "", "Squeeze your glute to stand", ""]
    },
    "Single-leg glute bridge": {
      a: {hip: [262, 248], t: -90, h: 0, f: [300, 254], leg2: [149.3, 149.3], fa2: -150, hd: [258, 254], ab: 1},
      b: {hip: [256.8, 223.6], t: -114, h: 24, f: [300, 254], leg2: [114.3, 114.3], fa2: -115, hd: [258, 254], ab: 1},
      pb: () => mat(), glow: ["glute"], ge: 1,
      tm: [1.1, 1.0, 2.0, 0.4], tl: ["Drive through your heel, hips up", "Squeeze 1 sec, hips level", "Lower slowly", ""]
    },
    "Bird dog": {
      a: {hip: [170, 200], t: 80.4, h: 4, f: [118, 254], fa: 172, f2: [112, 254], fa2: 172, arm: [0, 0], arm2: [0, 0], armFront: true},
      b: {hip: [170, 200], t: 80.4, h: 4, f: [118, 254], fa: 172, f2: [68, 217.3], fa2: 95, arm: [97, 97], arm2: [0, 0], armFront: true},
      pb: () => mat(), glow: ["back", "glute", "core"], ge: 1,
      tm: [1.6, 2.5, 1.6, 0.6], tl: ["Reach arm forward, opposite leg back", "Hold 2–3 sec, hips level", "Return slowly", ""]
    },
    "Dumbbell thruster": {
      seq: [
        {hip: [197, 151], t: 3, h: -3, f: [200, 254], arm: [40, 185], armFront: true},
        {hip: [164, 196], t: 26, h: -16, f: [200, 254], arm: [55, 195], armFront: true},
        {hip: [197, 151], t: 2, h: 0, f: [200, 254], arm: [180, 180], armFront: true}
      ], segT: 1.3, segH: 0.15,
      pf: S => db(S.armF.e, 0, 1.05) + db(S.armN.e, 0), glow: ["thigh", "glute", "delt", "arm"],
      tl: ["Squat down, weights at shoulders", "Drive up and press overhead", "Lower the weights to your shoulders"]
    },
    "Side plank": {
      // seen from the front: support forearm points toward the viewer (short), top arm to the ceiling
      v: "f",
      a: {c: [110, 150], fl: [104, 254], fr: [116, 254], fo: 8, armL: [104.1, 104.1], armR: [75.9, 165.9], fsR: 0.25, rot: 75.9, piv: [110, 237.8]},
      b: {c: [110, 150], fl: [104, 254], fr: [116, 254], fo: 8, armL: [104.6, 104.6], armR: [75.4, 165.4], fsR: 0.25, rot: 75.4, piv: [110, 237.8]},
      pb: () => mat(), glow: ["oblique"], ge: 0.5,
      tm: [2.5, 0, 2.5, 0], tl: ["Hold: hips up, body straight", "Hold: hips up, body straight", "Hold: hips up, body straight", "Hold: hips up, body straight"]
    },
    "Band hip adduction": {
      v: "f",
      a: {c: [204, 150], lgL: [23, 23], fr: [214, 254], hl: [186, 146], hr: [222, 146], al: -1, ar: 1, lfront: true},
      b: {c: [204, 150], lgL: [-14, -14], fr: [214, 254], hl: [186, 146], hr: [222, 146], al: -1, ar: 1, lfront: true},
      pb: () => `<rect x="38" y="14" width="16" height="${G - 14}" fill="${C.wood}"/><rect x="50" y="240" width="10" height="12" rx="2" fill="${C.prop}"/>`,
      pf: S => ln([56, 246], S.lL.e, 4, C.band), glow: ["innerL"], ge: 1,
      tm: [1.0, 0.6, 1.8, 0.4], tl: ["Sweep your leg in", "Squeeze your inner thigh", "Let it out slowly", ""]
    },

    // ---- rear view (so the upper-back muscles are visible) with a small side-view inset ----
    "Band pull-apart": {
      v: "r",
      a: {c: [200, 150], fl: [184, 254], fr: [216, 254], armL: [92, 92], armR: [92, 92], hab: 10, armsBehind: true},
      b: {c: [200, 150], fl: [184, 254], fr: [216, 254], armL: [92, 92], armR: [92, 92], hab: 90, armsBehind: true},
      pm: S => ln(S.aL.e, S.aR.e, 4, C.band), glow: ["upperback", "delt"], ge: 1,
      inset: {a: {hip: [198, 153], t: 0, f: [203, 254], arm: [90, 90], hab: 10},
              b: {hip: [198, 153], t: 0, f: [203, 254], arm: [90, 90], hab: 90}},
      tm: [1.0, 0.8, 1.8, 0.4], tl: ["Pull apart, arms straight", "Squeeze shoulder blades", "Return slowly", ""]
    },
    "Reverse fly": {
      v: "r",
      a: {c: [200, 150], ts: 0.3, fl: [184, 254], fr: [216, 254], armL: [0, -10], armR: [0, -10], headBehind: true, hy: 12},
      b: {c: [200, 150], ts: 0.3, fl: [184, 254], fr: [216, 254], armL: [88, 78], armR: [88, 78], headBehind: true, hy: 12},
      pf: S => dbEnd(S.aL.e) + dbEnd(S.aR.e), glow: ["upperback", "delt"], ge: 1,
      inset: {a: {hip: [165, 155], t: 70, h: -10, f: [188, 254], arm: [0, 0], hab: 0},
              b: {hip: [165, 155], t: 70, h: -10, f: [188, 254], arm: [0, 0], hab: 88},
              pf: S => db(S.armN.e, 0)},
      insetAt: [262, 24],
      tm: [1.1, 0.8, 2.0, 0.4], tl: ["Raise out to the sides", "Squeeze", "Lower slowly", ""]
    },

    // ---- front view ----
    "Dumbbell overhead press": {
      v: "f",
      a: {c: [200, 150], fl: [184, 254], fr: [216, 254], hl: [166, 86], hr: [234, 86], al: 1, ar: -1},
      b: {c: [200, 150], fl: [184, 254], fr: [216, 254], hl: [174, 24], hr: [226, 24], al: 1, ar: -1},
      pf: S => db(S.aL.e, 0, 1) + db(S.aR.e, 0, 1), glow: ["delt", "arm"], ge: 1,
      tm: [1.2, 0.4, 2.0, 0.4], tl: ["Press up", "", "Lower slowly", ""]
    },
    "Sumo goblet squat": {
      v: "f",
      a: {c: [200, 158], fl: [150, 254], fr: [250, 254], hl: [197, 162], hr: [203, 162], fo: 16, al: 1, ar: -1},
      b: {c: [200, 206], fl: [150, 254], fr: [250, 254], hl: [197, 210], hr: [203, 210], fo: 16, al: 1, ar: -1},
      pf: S => db([(S.aL.e[0] + S.aR.e[0]) / 2, S.aL.e[1] + 9], 90), glow: ["thigh", "hipj"], ge: 0.5,
      tm: [2.4, 0.3, 1.2, 0.6], tl: ["Lower slowly, knees out", "", "Stand up and squeeze", ""]
    },
    "Lateral band walk": {
      v: "f",
      seq: [lw(150, 196), lw(150, 242), lw(196, 242), lw(150, 242)], segT: 0.8, segH: 0.25,
      pf: S => ln(S.lL.j, S.lR.j, 5, C.bandR), glow: ["hipj"],
      tl: ["Step out", "Other foot follows, band stays tight", "Step out", "Other foot follows, band stays tight"]
    },

    // ---- special day: chest & back focus ----
    "Dumbbell floor press": {
      // palms face the feet and the elbows sit 45–60° out, so the upper arm points partly toward you (as/fs foreshorten it)
      a: {hip: [262, 248], t: -90, h: 0, f: [290, 254], arm: [177, 180], as: 1, fs: 1},
      b: {hip: [262, 248], t: -90, h: 0, f: [290, 254], arm: [70, 180], as: 0.6, fs: 1.667},
      pb: () => mat(), pf: S => dbEnd(S.armN.e), glow: ["chest", "arm"], ge: 1,
      tm: [2.2, 0.3, 1.1, 0.5], tl: ["Lower slowly, elbows at 45°", "", "Press up, squeeze your chest", ""]
    },
    "Band chest fly": {
      // front view, back to the door; yaw swings the arms from out to the sides to in front of the chest
      v: "f",
      a: {c: [200, 150], fl: [184, 254], fr: [216, 254], armL: [75, 75], armR: [75, 75], yaw: -6},
      b: {c: [200, 150], fl: [184, 254], fr: [216, 254], armL: [75, 75], armR: [75, 75], yaw: 104},
      pb: S => `<rect x="146" y="16" width="108" height="${G - 16}" rx="3" fill="#f1e6da" stroke="#e0cdb8" stroke-width="3"/>` +
        ln(S.aL.e, [200, 104], 4, C.band) + ln(S.aR.e, [200, 104], 4, C.band),
      glow: ["chest"], ge: 1,
      inset: {a: {hip: [204, 153], t: 4, f: [224, 254], f2: [184, 254], arm: [85, 85], hab: 88},
              b: {hip: [204, 153], t: 4, f: [224, 254], f2: [184, 254], arm: [85, 85], hab: 4},
              pb: () => `<rect x="40" y="14" width="14" height="${G - 14}" fill="${C.wood}"/><rect x="50" y="98" width="10" height="12" rx="2" fill="${C.prop}"/>`,
              pf: S => ln([57, 104], S.armN.e, 4, C.band)},
      tm: [1.4, 0.8, 2.0, 0.4], tl: ["Hands together, like hugging a tree", "Squeeze your chest", "Open slowly to a stretch", ""]
    },

    // ---- special day: bone builder ----
    "Jump and land": {
      seq: [
        {hip: [198, 152], t: 2, h: -2, f: [203, 254], f2: [197, 254], arm: [6, 2], armFront: true},
        {hip: [183, 181], t: 28, h: -18, f: [203, 254], f2: [197, 254], arm: [-45, -38], armFront: true},
        {hip: [200, 128], t: 2, h: 0, f: [206, 232], f2: [200, 232], fa: 62, fa2: 62, arm: [150, 160], armFront: true},
        {hip: [199, 151], t: 5, h: -3, f: [204, 254], f2: [198, 254], arm: [105, 112], armFront: true},
        {hip: [185, 176], t: 24, h: -14, f: [203, 254], f2: [197, 254], arm: [72, 80], armFront: true}
      ],
      segT: [0.45, 0.2, 0.18, 0.2, 0.6], segH: [0.05, 0.04, 0, 0.9, 0.7],
      glow: ["thigh", "glute", "calf"],
      tl: ["Dip, then jump straight up", "Dip, then jump straight up", "Land softly and hold it", "Land softly and hold it", "Stand tall and pause"]
    },
    "Floor back extension": {
      // lying face down with the head to the right; the chest lifts while the legs stay down
      a: {hip: [150, 247], t: 90, h: 0, leg: [274, 274], leg2: [274, 274], fa: 175, fa2: 175, arm: [272, 272]},
      b: {hip: [150, 247], t: 72, h: 4, leg: [274, 274], leg2: [274, 274], fa: 175, fa2: 175, arm: [283, 283]},
      pb: () => mat(), glow: ["back", "glute"], ge: 1,
      tm: [1.3, 2.0, 1.6, 0.8], tl: ["Lift your chest, shoulder blades back", "Hold 2–3 sec, eyes on the floor", "Lower slowly", ""]
    },
    "Lateral lunge": {
      // front view, wide stance, sitting into one hip then the other; kL/kR shorten the thigh that points toward you
      v: "f",
      seq: [
        {c: [200, 165], fl: [136, 254], fr: [264, 254], fo: 13, hl: [197, 131], hr: [203, 131], al: -1, ar: 1},
        {c: [232, 200], ts: 0.84, fl: [136, 254], fr: [264, 254], fo: 13, kR: [0.55, 0.95], hl: [229, 176], hr: [235, 176], al: -1, ar: 1},
        {c: [200, 165], fl: [136, 254], fr: [264, 254], fo: 13, hl: [197, 131], hr: [203, 131], al: -1, ar: 1},
        {c: [168, 200], ts: 0.84, fl: [136, 254], fr: [264, 254], fo: 13, kL: [0.55, 0.95], hl: [165, 176], hr: [171, 176], al: -1, ar: 1}
      ],
      segT: [1.4, 0.9, 1.4, 0.9], segH: [0.25, 0.5, 0.25, 0.5],
      pf: S => db([(S.aL.e[0] + S.aR.e[0]) / 2, (S.aL.e[1] + S.aR.e[1]) / 2 + 9], 90),
      glow: ["thigh", "hipj"],
      tl: ["Sit back into one hip, other leg straight", "Push through your heel to the middle", "Now the other side", "Push through your heel to the middle"]
    }
  };

  // ---------- timeline ----------
  function stateAt(ex, sec) {
    const tl = ex.tl || ["", "", "", ""];
    if (ex.seq) {
      // segT/segH: one number for every step, or a list with a time per step (move, then hold)
      const n = ex.seq.length, at = (v, k) => Array.isArray(v) ? v[k] : v;
      let total = 0;
      for (let k = 0; k < n; k++) total += at(ex.segT, k) + at(ex.segH, k);
      let t = sec % total, i = 0;
      while (i < n - 1 && t >= at(ex.segT, i) + at(ex.segH, i)) { t -= at(ex.segT, i) + at(ex.segH, i); i++; }
      const s = t / at(ex.segT, i);
      return {seq: true, i, s: s >= 1 ? 1 : ease(s), label: tl[i] || ""};
    }
    const [t1, h1, t2, h2] = ex.tm || [1.3, 0.4, 1.3, 0.4];
    let t = sec % (t1 + h1 + t2 + h2);
    if (t < t1) return {u: ease(t / t1), dir: 1, label: tl[0]};
    t -= t1; if (t < h1) return {u: 1, dir: 1, label: tl[1]};
    t -= h1; if (t < t2) return {u: 1 - ease(t / t2), dir: -1, label: tl[2]};
    return {u: 0, dir: -1, label: tl[3]};
  }

  // ---------- rendering ----------
  function compose(key, st) {
    const ex = ANIM[key];
    const P = poseOf(ex, st);
    const r = (ex.v === "f" || ex.v === "r") ? drawFR(ex, P, ex.v === "r") : drawSide(ex, P);
    const u = st.seq ? 0.5 : st.u;
    const eff = (ex.seq || ex.ge == null || ex.ge === 0.5) ? 0.5 : (ex.ge === 1 ? u : 1 - u);
    const op = f1(0.2 + 0.6 * eff);
    let g = "";
    (ex.glow || []).forEach(n => (r.anchors[n] || []).forEach(a => {
      g += `<circle cx="${f1(a[0])}" cy="${f1(a[1])}" r="${a[2]}" fill="url(#gl)" opacity="${op}"/>`;
    }));
    let inset = "";
    if (ex.inset) {
      const ri = drawSide(ex.inset, poseOf(ex.inset, st));
      const at = ex.insetAt || [262, 168];
      inset = `<text x="${at[0] + 2}" y="${at[1] - 5}" font-size="11" font-weight="600" fill="#7a6f68" font-family="-apple-system,Segoe UI,Roboto,sans-serif">Side view</text>` +
        `<g transform="translate(${at[0]} ${at[1]}) scale(0.28)"><rect width="400" height="290" rx="30" fill="#fff" stroke="#e2d6cc" stroke-width="6"/>` +
        `<line x1="10" x2="390" y1="${G}" y2="${G}" stroke="#d3c5ba" stroke-width="5"/>${ri.svg}</g>`;
    }
    const label = st.label ? `<text x="30" y="30" font-size="14" font-weight="700" fill="#7a6f68" font-family="-apple-system,Segoe UI,Roboto,sans-serif">${st.label}</text>` : "";
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="20 8 360 272" role="img"><defs><radialGradient id="gl"><stop offset="0" stop-color="#ff3b2f" stop-opacity=".9"/><stop offset="55%" stop-color="#ff5a3c" stop-opacity=".4"/><stop offset="100%" stop-color="#ff5a3c" stop-opacity="0"/></radialGradient></defs>` +
      `<rect width="400" height="290" fill="${C.bg}"/><rect y="${G}" width="400" height="28" fill="${C.floor}"/><line x1="0" x2="400" y1="${G}" y2="${G}" stroke="#d3c5ba" stroke-width="2"/>` +
      r.svg + g + inset + label + `</svg>`;
  }
  // render at a movement fraction u (0 = start pose, 1 = finish pose); used for testing
  function render(key, u, dir) {
    const ex = ANIM[key];
    if (!ex) return "";
    if (ex.seq) { const n = ex.seq.length, x = Math.min(u, 0.9999) * n, i = Math.floor(x); return compose(key, {seq: true, i, s: x - i, label: ""}); }
    return compose(key, {u, dir: dir == null ? 1 : dir, label: ""});
  }
  const renderAt = (key, sec) => compose(key, stateAt(ANIM[key], sec));

  function mount(el, key) {
    let raf = 0, playing = true, elapsed = 0, last = null;
    function frame(ts) {
      if (last !== null && playing) elapsed += (ts - last) / 1000;
      last = ts;
      el.innerHTML = renderAt(key, elapsed);
      raf = requestAnimationFrame(frame);
    }
    el.innerHTML = renderAt(key, 0);
    raf = requestAnimationFrame(frame);
    return {
      toggle() { playing = !playing; return playing; },
      isPlaying() { return playing; },
      destroy() { cancelAnimationFrame(raf); }
    };
  }

  return {render, renderAt, mount, keys: Object.keys(ANIM), ANIM};
})();
