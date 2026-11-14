import { useEffect, useState } from 'react';
import { Compare } from './ui/Compare';
import { Icon } from './ui/Icon';
import { Landing } from './ui/Landing';
import { PhoneApp } from './ui/PhoneApp';
import { useDirectory } from './ui/data';
import { goHome } from './ui/nav';

// Routes (all on one static page, so links keep working on any host):
//   /            landing page for judges (anchors like #map scroll within it)
//   #app         the phone app, first demo customer
//   #c=CUSTID    the phone app for one customer (also ?c=CUSTID)
//   #compare     three customers side by side (also ?compare or ?compare=ID,ID,ID)
type Route = { view: 'landing'; anchor: string } | { view: 'app'; cid: string } | { view: 'compare' };
function parse(): Route {
  const q = new URLSearchParams(location.search); const h = location.hash;
  if (h.startsWith('#c=')) return { view: 'app', cid: h.slice(3) };
  if (h === '#app') return { view: 'app', cid: q.get('c') ?? '' };
  if (h === '#compare') return { view: 'compare' };
  if (h.length <= 1 || h === '#top') {
    if (q.has('compare')) return { view: 'compare' };
    if (q.get('c')) return { view: 'app', cid: q.get('c')! };
  }
  return { view: 'landing', anchor: h.slice(1) };
}
export default function App() {
  const [route, setRoute] = useState<Route>(parse);
  const dir = useDirectory();
  useEffect(() => {
    const on = () => setRoute(parse());
    window.addEventListener('hashchange', on); window.addEventListener('popstate', on);
    return () => { window.removeEventListener('hashchange', on); window.removeEventListener('popstate', on); };
  }, []);
  useEffect(() => {
    document.body.classList.toggle('in-app', route.view === 'app');
    if (route.view !== 'landing') window.scrollTo(0, 0);
  }, [route.view]);

  if (route.view === 'compare') return dir.demo.length ? <Compare personas={dir.demo} /> : null;
  if (route.view === 'app') {
    const cid = route.cid || dir.demo[0]?.id || '';
    return (
      <div className="stage">
        <PhoneApp cid={cid} name={dir.nameOf(cid)} people={dir.demo} onPick={(id) => { location.hash = '#c=' + id; }} />
        <div className="demo-bar">
          <a className="app-back" href="#top" onClick={(e) => { e.preventDefault(); goHome(); }}><Icon name="ArrowLeft" size={16} /> About Kori</a>
          <a className="app-back" href="#compare"><Icon name="Columns3" size={16} /> Side by side</a>
        </div>
      </div>
    );
  }
  return <Landing dir={dir} anchor={route.anchor} />;
}
