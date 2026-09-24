import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import Avatar from '@mui/material/Avatar';
import AvatarGroup from '@mui/material/AvatarGroup';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import Button from '@mui/material/Button';
import { initials, membersFromPresence, safePicture } from './model.mjs';

const SurplusButton = React.forwardRef(function SurplusButton(props, ref) {
  const { ownerState, ...rest } = props;
  return <Avatar {...rest} ref={ref} component="button" type="button" />;
});

// MUI reverses the DOM order; keep its row-reverse layout and explicitly layer
// the first visual member above the later members (including the surplus).
function Viewers({ members, status }) {
  const [selected, setSelected] = useState(null);
  const [profile, setProfile] = useState(null);
  const [profileStatus, setProfileStatus] = useState('');
  const person = members.find(member => member.id === selected);
  useEffect(() => {
    let cancelled = false;
    setProfile(null);
    if (!selected || selected === 'overflow') return;
    setProfileStatus('loading');
    Promise.resolve().then(() => client.rpc('feedback_user_profile', { target_id: selected }))
      .then(({ data, error }) => {
        if (cancelled) return;
        setProfile(!error ? data?.[0] || null : null);
        setProfileStatus(!error && data?.[0] ? 'ready' : 'unavailable');
      }).catch(() => { if (!cancelled) setProfileStatus('unavailable'); });
    return () => { cancelled = true; };
  }, [selected]);
  const en = document.documentElement.lang === 'en';
  const label = en ? 'Viewing this dashboard' : 'Đang xem dashboard này';
  return <div className="dashboard-viewers" aria-label={label}>
    <span className="dashboard-viewers-label" role="status">{status === 'connected'
      ? `${members.length} ${en ? 'viewing' : 'đang xem'}`
      : status === 'connecting' ? (en ? 'Connecting…' : 'Đang kết nối…')
      : (en ? 'Viewers unavailable' : 'Chưa kết nối người xem')}</span>
    {status === 'connected' && members.length > 0 && <AvatarGroup max={5} total={members.length} spacing={8}
      slots={{ surplus: SurplusButton }}
      aria-label={label} renderSurplus={n => `+${n}`}
      slotProps={{ surplus: {
        title: members.slice(4).map(p => p.name || 'Thành viên').join(', '),
        'aria-label': `${Math.max(0, members.length - 4)} ${en ? 'more viewers' : 'người xem khác'}`,
        component: 'button', type: 'button', onClick: () => setSelected('overflow'),
        'aria-haspopup': 'dialog', sx: { zIndex: 0, cursor: 'pointer' }
      } }}
      sx={{ isolation: 'isolate', overflow: 'visible', flexShrink: 0,
        '& .MuiAvatar-root': {
          width: 30, height: 30, fontSize: 11, fontWeight: 600, boxSizing: 'border-box',
          border: '2px solid var(--white)', bgcolor: 'var(--accent-light)', color: 'var(--accent-text)',
          marginLeft: '0 !important', marginRight: '0 !important', marginInlineStart: '-8px !important'
        },
        '& .MuiAvatar-root:last-child': { marginInlineStart: '0 !important' }
      }}>
      {members.map((person, index) => <Avatar key={person.id} alt={person.name || 'Thành viên'}
        title={person.name || 'Thành viên'} aria-label={person.name || 'Thành viên'}
        component="button" type="button" aria-haspopup="dialog" onClick={() => setSelected(person.id)}
        src={safePicture(person.picture)} slotProps={{ img: { referrerPolicy: 'no-referrer' } }}
        sx={{ zIndex: members.length - index, cursor: 'pointer' }}>{initials(person.name)}</Avatar>)}
    </AvatarGroup>}
    <Dialog open={!!selected && status === 'connected'} onClose={() => setSelected(null)}
      fullWidth maxWidth="xs" aria-labelledby="viewer-info-title"
      slotProps={{ paper: { sx: { bgcolor: 'var(--white)', color: 'var(--gray-900)', borderRadius: 3 } } }}>
      <DialogTitle id="viewer-info-title" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
        {selected === 'overflow' ? (en ? 'More viewers' : 'Người xem khác') : (en ? 'Viewer information' : 'Thông tin người xem')}
        <Button onClick={() => setSelected(null)} sx={{ color: 'var(--accent-text)' }}>{en ? 'Close' : 'Đóng'}</Button>
      </DialogTitle>
      <DialogContent>
        {selected === 'overflow' ? <div style={{ display: 'grid', gap: 8 }}>
          {members.slice(4).map(member => <Button key={member.id} onClick={() => setSelected(member.id)} aria-label={member.name || (en ? 'Member' : 'Thành viên')}
            sx={{ justifyContent: 'flex-start', gap: 2, textTransform: 'none', color: 'var(--gray-900)' }}>
            <Avatar src={safePicture(member.picture)} alt="" slotProps={{ img: { referrerPolicy: 'no-referrer' } }}>{initials(member.name)}</Avatar>
            {member.name || (en ? 'Member' : 'Thành viên')}
          </Button>)}
          {members.length <= 4 && <p>{en ? 'No more hidden viewers.' : 'Không còn người xem bị ẩn.'}</p>}
        </div> : person ? <div style={{ display: 'grid', gap: 12, overflowWrap: 'anywhere' }}>
          <Avatar src={safePicture(profile?.avatar_url || person.picture)} alt={person.name}
            slotProps={{ img: { referrerPolicy: 'no-referrer' } }}
            sx={{ width: 64, height: 64, bgcolor: 'var(--accent-light)', color: 'var(--accent-text)' }}>{initials(person.name)}</Avatar>
          <strong>{profile?.nickname || profile?.display_name || person.name}</strong>
          {profile?.role && <div>{en ? 'Role' : 'Vai trò'}: {profile.role}</div>}
          {profile?.team && <div>Team: {profile.team}</div>}
          <div style={{ color: 'var(--gray-600)', fontSize: 13 }}>
            {label}: {room === 'home' ? (en ? 'Home' : 'Trang chủ') : document.getElementById('tool-title')?.textContent || room}
          </div>
          <div role="status" style={{ color: 'var(--gray-600)', fontSize: 13 }}>
            {profileStatus === 'loading' ? (en ? 'Loading profile…' : 'Đang tải hồ sơ…') : profileStatus === 'unavailable' ? (en ? 'Additional profile information unavailable.' : 'Chưa có thông tin hồ sơ bổ sung.') : ''}
          </div>
        </div> : <p>{en ? 'This person has left the dashboard.' : 'Người này đã rời dashboard.'}</p>}
      </DialogContent>
    </Dialog>
  </div>;
}

let root, host, channel, client, identity, room, version = 0, connected = false;
let members = [], status = 'connecting';
function render() { root?.render(<Viewers members={members} status={status} />); }
function payload() {
  return { id: identity.id, name: identity.name, picture: safePicture(identity.picture) || '', updated_at: new Date().toISOString() };
}
function stop() {
  version++;
  const old = channel;
  channel = null; room = null; connected = false; members = [];
  root?.render(null);
  if (old) client.removeChannel(old).catch(() => {});
}
window.TQAPresence = {
  show(sb, user, key, target) {
    if (!user?.id || !target) return;
    identity = user;
    if (host !== target) {
      root?.unmount(); host = target; root = createRoot(target);
    }
    if (channel && room === key) { render(); return; }
    stop(); client = sb; room = key; status = 'connecting'; render();
    const generation = version;
    const active = () => generation === version;
    channel = sb.channel(`dashboard-viewers:${key}`, { config: { presence: { key: user.id } } });
    const current = channel;
    current.on('presence', { event: 'sync' }, () => {
      if (!active() || !connected) return;
      members = membersFromPresence(current.presenceState()); render();
    }).subscribe(async state => {
      if (!active()) return;
      if (state === 'SUBSCRIBED') {
        try {
          const result = await current.track(payload());
          if (!active()) return;
          connected = result === 'ok';
          status = connected ? 'connected' : 'error';
          members = connected ? membersFromPresence(current.presenceState()) : [];
        } catch { if (!active()) return; connected = false; status = 'error'; members = []; }
        render();
      } else if (['CHANNEL_ERROR', 'TIMED_OUT', 'CLOSED'].includes(state)) {
        connected = false; status = 'error'; members = []; render();
      }
    });
  },
  update(user) {
    identity = user;
    if (channel && connected) channel.track(payload()).catch(() => {});
    render();
  },
  stop
};
window.addEventListener('pagehide', stop);
window.addEventListener('pageshow', event => { if (event.persisted) window.routeFromHash?.(); });
new MutationObserver(render).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
