import Link from 'next/link';
import Soon from '../../../components/Soon';

export default function Home() {
  return (
    <>
      <Soon
        title="Good evening."
        intro="Your next events, news from the club and the Back Room, all in one place."
        next="Home pulls together upcoming events, announcements and forum activity once those are built."
      />
      <div className="page" style={{ paddingTop: 0 }}>
        <Link href="/gallery" className="btn btn-primary">
          Open the gallery →
        </Link>
      </div>
    </>
  );
}
