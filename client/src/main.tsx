import React from 'react';
import ReactDOM from 'react-dom/client';
import { Auth0Provider } from '@auth0/auth0-react';
import { TRPCProvider } from '@/providers/TRPCProvider';
import App from './App';
import './index.css';

const domain = import.meta.env.VITE_AUTH0_DOMAIN;
const clientId = import.meta.env.VITE_AUTH0_CLIENT_ID;
const audience = import.meta.env.VITE_AUTH0_AUDIENCE;
const redirectUri = window.location.origin;

console.log('🔐 Auth0 Configuration:', {
  domain,
  clientId: clientId ? '✓ Loaded' : '✗ Missing',
  audience: audience || 'Not configured',
  redirectUri
});

// 處理 Auth0 回調
const onRedirectCallback = (appState: any) => {
  console.log('🔄 Auth0 redirect callback:', appState);
  window.history.replaceState(
    {},
    document.title,
    appState?.returnTo || window.location.pathname
  );
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Auth0Provider
      domain={domain}
      clientId={clientId}
      authorizationParams={{
        redirect_uri: redirectUri,
        audience: audience,
        scope: 'openid profile email',
      }}
      onRedirectCallback={onRedirectCallback}
      cacheLocation="localstorage"
      useRefreshTokens={false}
    >
      <TRPCProvider>
        <App />
      </TRPCProvider>
    </Auth0Provider>
  </React.StrictMode>
);
