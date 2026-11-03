import ReportForm from '../../components/ReportForm';
import NewThreadForm from '../../components/NewThreadForm';

const img = (n: number) => `/images/welcome.jpg?${n}`;

export default function Preview() {
  return (
    <div className="app-frame">
      <header className="topbar">
        <img src="/images/logo.png" alt="AFTR." />
        <div className="topbar-right">
          <a className="bell"><svg viewBox="0 0 24 24" width="20" height="20"><path d="M12 3a6 6 0 0 0-6 6v3.6L4.4 16h15.2L18 12.6V9a6 6 0 0 0-6-6Z" fill="none" stroke="currentColor" strokeWidth="1.7"/><path d="M9.5 19a2.5 2.5 0 0 0 5 0" fill="none" stroke="currentColor" strokeWidth="1.7"/></svg><span className="bell-dot">3</span></a>
          <a className="tier-pill">Inner Circle <span className="initials">EN</span></a>
        </div>
      </header>
      <main className="page" id="thread">
        <a className="back">← # general</a>
        <div className="renewal"><strong>Your membership ends in 12 days</strong><span>It runs until 15 November. To renew, email <a className="inline-link">team@aftr.community</a> or message the team.</span></div>
        <nav className="room-links"><a className="room-link">Members</a><a className="room-link">Messages<span className="count-dot">2</span></a><a className="room-link">Your profile</a></nav>
        <article className="post post-main">
          <h1 className="display post-title">Happily Ever AFTR. outfits?</h1>
          <div className="post-by"><a className="author-link">Enam</a> · 2h · edited</div>
          <p className="post-body">Show me what you&apos;re wearing on Saturday 👑</p>
          <div className="photo-grid photo-grid-post count-2"><button className="photo-tile" style={{ backgroundImage: `url(${img(1)})` }} /><button className="photo-tile" style={{ backgroundImage: `url(${img(2)})` }} /></div>
          <div className="poll"><div className="label">Poll · 7 votes</div>
            <div className="poll-results">
              <div className="poll-bar mine"><span className="poll-fill" style={{ width: '57%' }} /><span className="poll-text">Princess · your vote</span><span className="poll-pct">57%</span></div>
              <div className="poll-bar"><span className="poll-fill" style={{ width: '29%' }} /><span className="poll-text">Villain</span><span className="poll-pct">29%</span></div>
              <div className="poll-bar"><span className="poll-fill" style={{ width: '14%' }} /><span className="poll-text">Fairy godmother</span><span className="poll-pct">14%</span></div>
              <button className="link-btn">Change my vote</button>
            </div>
          </div>
          <div className="post-foot">
            <div className="reactions"><button className="react-btn on"><span>♥</span><span>4</span></button><button className="react-btn"><span>👍</span><span>2</span></button></div>
            <details className="post-menu" open><summary>•••</summary><div className="menu-sheet"><a className="menu-item">Report</a><button className="menu-item">Mute Enam</button><button className="menu-item">Block Enam</button><button className="menu-item menu-admin">Remove (admin)</button></div></details>
          </div>
        </article>
        <div className="label" style={{ margin: '22px 0 10px' }}>3 replies</div>
        <div className="reply-list"><div className="reply-group">
          <article className="post"><div className="post-by"><a className="author-link">Sharon</a> · 1h</div><p className="post-body">Villain era, obviously.</p>
            <div className="post-foot"><div className="reactions"><button className="react-btn"><span>♥</span></button><button className="react-btn"><span>👍</span><span>1</span></button></div><details className="reply-inline"><summary>Reply</summary></details><details className="post-menu"><summary>•••</summary></details></div></article>
          <div className="reply-children"><article className="post post-nested"><div className="post-by"><a className="author-link">Princess</a><span className="team-badge">Team</span> · 40m</div><p className="post-body">Love this for you</p>
            <div className="post-foot"><div className="reactions"><button className="react-btn"><span>♥</span></button><button className="react-btn"><span>👍</span></button></div><details className="reply-inline" open><summary>Reply</summary><form className="form reply-form"><label className="field"><span className="label">Reply to Princess</span><textarea rows={2} placeholder="Write a reply…" /></label><button className="wbtn wbtn-fill">Reply</button></form></details><details className="post-menu"><summary>•••</summary></details></div></article></div>
        </div></div>
      </main>
      <main className="page" id="report"><h1 className="display">Report this reply</h1><p className="muted intro">From Sharon</p><blockquote className="report-quote">Villain era, obviously.</blockquote><ReportForm target={{ reply_id: '1' }} query="" /></main>
      <main className="page" id="members">
        <h1 className="display">Members</h1>
        <div className="chips"><a className="chip on">All (14)</a><a className="chip">Team (6)</a><a className="chip">The Inner Circle (5)</a><a className="chip">The Club (3)</a></div>
        <div className="member-grid">{['Enam', 'Sharon', 'Kawiah', 'Charles', 'Princess', 'Didi'].map((n, i) => (
          <a key={n} className="member-tile"><span className="member-photo" style={i % 2 ? undefined : { backgroundImage: `url(${img(i)})` }}>{i % 2 ? n[0] : ''}</span><span className="member-tile-name">{n}</span><span className="member-tile-tier">{i > 2 ? <span className="team-badge" style={{ marginLeft: 0 }}>Team</span> : 'Club'}</span></a>))}</div>
        <div className="profile-head" style={{ marginTop: 30 }}><span className="profile-avatar" style={{ backgroundImage: `url(${img(9)})` }} /><div><h1 className="display profile-name">Kawiah</h1><div className="profile-tags"><span className="team-badge" style={{ marginLeft: 0 }}>Team</span><span className="muted">Door</span></div><div className="muted">Member since October 2026</div></div></div>
        <p className="profile-bio">Accra-based. Here for the dance floor and the brunch recs.</p>
        <div className="photo-grid photo-grid-profile count-3"><button className="photo-tile" style={{ backgroundImage: `url(${img(1)})` }} /><button className="photo-tile" style={{ backgroundImage: `url(${img(2)})` }} /><button className="photo-tile" style={{ backgroundImage: `url(${img(3)})` }} /></div>
        <div className="stack-actions"><button className="wbtn wbtn-fill">Message Kawiah</button><div className="row-actions"><button className="tool-btn">Mute</button><button className="tool-btn">Block</button><a className="tool-btn tool-link">Report</a></div></div>
      </main>
      <main className="page chat-page" id="chat">
        <h1 className="display" style={{ fontSize: 30 }}>Kawiah</h1>
        <div className="chat-list">
          <div className="bubble-row"><div className="bubble"><p>Are you on the door Saturday?</p><span className="bubble-meta">2h · <a className="bubble-report">Report</a></span></div></div>
          <div className="bubble-row mine"><div className="bubble mine"><p>Yes! From 9pm. Come say hi 💗</p><span className="bubble-meta">1h · seen</span></div></div>
        </div>
        <form className="chat-form"><label className="field" style={{ flex: 1 }}><textarea rows={2} placeholder="Message Kawiah" /></label><button className="wbtn wbtn-fill chat-send">Send</button></form>
        <div className="note-list">
          <div className="note-row unread"><span className="note-line"><strong>Sharon</strong> replied to your post <em>Happily Ever AFTR. outfits?</em></span><span className="note-excerpt">Villain era, obviously.</span><span className="thread-time">1h</span></div>
          <div className="note-row"><span className="note-line"><strong>Your report</strong>: we removed it</span><span className="note-excerpt">Thanks for your report. We reviewed it and removed it for breaking the Safer Spaces Policy.</span><span className="thread-time">2d</span></div>
        </div>
      </main>
      <main className="page" id="new"><NewThreadForm defaultChannel="general" userId="x" /></main>
    </div>
  );
}
