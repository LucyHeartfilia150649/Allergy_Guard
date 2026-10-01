// ===== หน้า prevent =====
function buildPrevTbl() { setH('prevTbl', PTASKS.map((t, i) => `<tr><td><span class="tag ${t.tg}">${t.freq}</span></td><td>${t.task}</td><td>${t.res}</td><td><div class="pchk ${pChk['pv_' + i] ? 'done' : ''}" onclick="tpChk('pv_${i}',this)" style="margin:0 auto">${pChk['pv_' + i] ? '✓' : ''}</div></td></tr>`).join('')); }

if (requireLogin('prev')) buildPrevTbl();
