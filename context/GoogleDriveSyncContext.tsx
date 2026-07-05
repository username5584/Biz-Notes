
/// <reference types="react-dom" />

import * as WebBrowser from 'expo-web-browser';
import React, { useCallback, useEffect, useRef, useState } from 'react';

import {
  GoogleDriveSyncContext,
  useGoogleDriveSyncCore,
} from './GoogleDriveSyncShared';

export { useGoogleDriveSync, type SyncStatus } from './GoogleDriveSyncShared';

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const SCOPES = 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.email';

function useGoogleAuthBridge(onToken: (token: string) => void): {
  promptAsync: () => void;
  signingIn: boolean;
  redirectUri: string;
} {
  const clientId = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID ?? '';
  const [signingIn, setSigningIn] = useState(false);
  const activeRef = useRef(false);
  const popupRef = useRef<Window | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  
  const redirectUri =
    typeof window !== 'undefined' ? window.location.origin : '';

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const promptAsync = useCallback(() => {
    if (!clientId || activeRef.current) return;

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'token',
      scope: SCOPES,
      include_granted_scopes: 'true',
    });

    const authUrl = `${GOOGLE_AUTH_URL}?${params.toString()}`;

    const width = 500;
    const height = 600;
    const left = Math.max(0, (window.screen.width - width) / 2);
    const top = Math.max(0, (window.screen.height - height) / 2);
    const popup = window.open(
      authUrl,
      'google_oauth',
      `width=${width},height=${height},left=${left},top=${top},scrollbars=yes`,
    );

    if (!popup) {
      return;
    }

    activeRef.current = true;
    setSigningIn(true);
    popupRef.current = popup;

    intervalRef.current = setInterval(() => {
      const win = popupRef.current;
      if (!win || win.closed) {
        clearInterval(intervalRef.current!);
        intervalRef.current = null;
        activeRef.current = false;
        setSigningIn(false);
        return;
      }
      try {
        const hash = win.location.hash;
        if (!hash) return;
        const hashParams = new URLSearchParams(hash.slice(1));
        const token = hashParams.get('access_token');
        if (token) {
          clearInterval(intervalRef.current!);
          intervalRef.current = null;
          win.close();
          activeRef.current = false;
          setSigningIn(false);
          onToken(token);
        }
      } catch {
        
      }
    }, 300);
  }, [clientId, redirectUri, onToken]);

  return { promptAsync, signingIn, redirectUri };
}

function InnerProvider({ children }: { children: React.ReactNode }) {
  const { handleToken, ...rest } = useGoogleDriveSyncCore();
  const { promptAsync, signingIn, redirectUri } = useGoogleAuthBridge(handleToken);

  return (
    <GoogleDriveSyncContext.Provider
      value={{ ...rest, signIn: promptAsync, signingIn, redirectUri }}
    >
      {children}
    </GoogleDriveSyncContext.Provider>
  );
}

export function GoogleDriveSyncProvider({ children }: { children: React.ReactNode }) {
  return <InnerProvider>{children}</InnerProvider>;
}
