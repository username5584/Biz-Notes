import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import Constants from 'expo-constants';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  GoogleDriveSyncContext,
  useGoogleDriveSyncCore,
} from './GoogleDriveSyncShared';

export { useGoogleDriveSync, type SyncStatus } from './GoogleDriveSyncShared';

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_DISC: AuthSession.DiscoveryDocument = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
};

function getNativeClientId(): string {
  return (
    process.env.EXPO_PUBLIC_GOOGLE_NATIVE_CLIENT_ID ||
    process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID ||
    ''
  );
}

function useGoogleAuthBridgeNative(onToken: (token: string) => void): {
  promptAsync: () => void;
  signingIn: boolean;
} {
  const clientId = getNativeClientId() || 'placeholder';
  const isExpoGo = Constants.appOwnership === 'expo';
  const [signingIn, setSigningIn] = useState(false);
  const activeRef = useRef(false);

  
  
  
  
  const redirectUri = AuthSession.makeRedirectUri(
    isExpoGo ? {} : { scheme: 'bizness-notes' },
  );

  const useImplicit = isExpoGo;

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId,
      scopes: ['https://www.googleapis.com/auth/drive.file', 'https://www.googleapis.com/auth/userinfo.email'],
      redirectUri,
      ...(useImplicit
        ? { responseType: AuthSession.ResponseType.Token, usePKCE: false }
        : { usePKCE: true }),
    },
    GOOGLE_DISC,
  );

  useEffect(() => {
    if (!response) return;
    activeRef.current = false;
    setSigningIn(false);

    if (response.type === 'error') {
      return;
    }

    if (response.type !== 'success') return;

    
    if (useImplicit) {
      const token = response.params?.access_token ?? response.authentication?.accessToken;
      if (token) onToken(token);
      return;
    }

    
    if (!request) return;
    const code = response.params?.code;
    if (!code) return;
    AuthSession.exchangeCodeAsync(
      {
        clientId,
        code,
        redirectUri,
        extraParams: request.codeVerifier ? { code_verifier: request.codeVerifier } : undefined,
      },
      GOOGLE_DISC,
    )
      .then(result => { if (result.accessToken) onToken(result.accessToken); })
      .catch(() => {
        
      });
  }, [response, request, clientId, redirectUri, onToken, useImplicit]);

  return {
    signingIn,
    promptAsync: useCallback(() => {
      if (!getNativeClientId()) return;
      if (activeRef.current) return;
      activeRef.current = true;
      setSigningIn(true);
      promptAsync();
    }, [promptAsync]),
  };
}

function InnerProvider({ children }: { children: React.ReactNode }) {
  const core = useGoogleDriveSyncCore();
  const { promptAsync, signingIn } = useGoogleAuthBridgeNative(core.handleToken);

  const contextValue = useMemo(() => ({
    userEmail: core.userEmail,
    signIn: promptAsync,
    signingIn,
    signOut: core.signOut,
    sync: core.sync,
    status: core.status,
    statusMessage: core.statusMessage,
    lastSyncTime: core.lastSyncTime,
  }), [core, promptAsync, signingIn]);

  return (
    <GoogleDriveSyncContext.Provider value={contextValue}>
      {children}
    </GoogleDriveSyncContext.Provider>
  );
}

export function GoogleDriveSyncProvider({ children }: { children: React.ReactNode }) {
  return <InnerProvider>{children}</InnerProvider>;
}
