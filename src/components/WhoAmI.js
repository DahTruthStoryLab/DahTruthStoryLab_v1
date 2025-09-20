import React from 'react';
import { Auth } from 'aws-amplify';

export default function WhoAmI() {
  const [info, setInfo] = React.useState({ loading: true });

  React.useEffect(() => {
    (async () => {
      try {
        const [user, session] = await Promise.all([
          Auth.currentAuthenticatedUser({ bypassCache: true }),
          Auth.currentSession(),
        ]);
        setInfo({
          loading: false,
          username: user?.username,
          attributes: user?.attributes,
          tokensPresent: !!session,
        });
      } catch (e) {
        setInfo({ loading: false, error: e?.message || String(e) });
      }
    })();
  }, []);

  if (info.loading) return <div className="p-6 text-white">Checking…</div>;

  return (
    <pre className="p-6 text-xs text-white bg-slate-900 overflow-auto">
      {JSON.stringify(info, null, 2)}
    </pre>
  );
}
