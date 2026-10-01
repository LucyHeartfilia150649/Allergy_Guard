// ===== หน้า login =====

function doLogin() {
  if (!rcOk('lCap')) { show('lCapErr'); return; }
  hide('lCapErr');
  loadU(); const e = v('lEm'), p = v('lPw');
  const u = users.find(x => x.email === e && x.pass === p);
  if (!u) { show('lErr'); rcReset('lCap'); return; }
  hide('lErr'); enterApp(u);
}
