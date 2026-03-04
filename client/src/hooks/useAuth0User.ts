import { useAuth0 } from "@auth0/auth0-react";
import { useCallback } from "react";

export function useAuth0User() {
  const {
    isAuthenticated,
    isLoading,
    user,
    loginWithRedirect,
    logout: auth0Logout,
    getAccessTokenSilently,
    error,
  } = useAuth0();

  const login = useCallback(
    (returnTo?: string) =>
      loginWithRedirect({
        appState: { returnTo: returnTo ?? window.location.pathname },
      }),
    [loginWithRedirect]
  );

  const logout = useCallback(
    () =>
      auth0Logout({
        logoutParams: { returnTo: window.location.origin },
      }),
    [auth0Logout]
  );

  const getToken = useCallback(async () => {
    try {
      return await getAccessTokenSilently();
    } catch {
      return null;
    }
  }, [getAccessTokenSilently]);

  return {
    isAuthenticated,
    loading: isLoading,
    user,
    error: error ?? null,
    login,
    logout,
    getToken,
  };
}
