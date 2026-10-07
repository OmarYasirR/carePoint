import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const initialState = {
  user: null, // { _id, firstName, lastName, email, role, ... }
  profile: null, // PatientProfile or DoctorProfile, depending on role
  accessToken: null,
  isAuthenticated: false,
  // Flips true once the app has finished attempting a silent login on
  // load (see bootstrapAuth below). Routing waits for this so a page
  // reload or a brand-new tab doesn't flash the login screen while
  // the refresh cookie is still being checked.
  initialized: false,
};

/**
 * Persistent login: the server sets an httpOnly refresh cookie (valid
 * 7 days — see REFRESH_COOKIE_OPTIONS in authController.js) on every
 * login. The access token itself only lives in memory/sessionStorage
 * and is gone the moment the tab closes, so on every fresh app load
 * we silently try to trade that refresh cookie for a new access token
 * before deciding whether to show the login screen. This is what
 * keeps someone logged in across closing the tab or the whole browser.
 *
 * Deliberately uses raw `axios` calls rather than the shared `api`
 * instance (see services/api.js): that instance's response
 * interceptor force-redirects to /login on a failed refresh, which is
 * correct when an existing session expires mid-use, but wrong here —
 * a 401 on this very first check just means "no one's logged in yet,"
 * the normal state for any first-time visitor, and shouldn't trigger
 * a redirect loop. Using raw axios also sidesteps a circular import
 * (api.js imports the store, so authSlice.js can't cleanly import
 * api.js back).
 */
export const bootstrapAuth = createAsyncThunk(
  'auth/bootstrap',
  async (_, { dispatch, rejectWithValue }) => {
    try {
      const { data } = await axios.post('/api/auth/refresh', {}, { withCredentials: true });
      dispatch(setAccessToken(data.accessToken));
      const { data: meData } = await axios.get('/api/auth/me', {
        headers: { Authorization: `Bearer ${data.accessToken}` },
      });
      return { user: meData.user, profile: meData.profile };
    } catch (err) {
      return rejectWithValue(null);
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials(state, action) {
      const { user, profile, accessToken } = action.payload;
      state.user = user;
      state.profile = profile ?? state.profile;
      state.accessToken = accessToken;
      state.isAuthenticated = true;
      sessionStorage.setItem('accessToken', accessToken);
    },
    setAccessToken(state, action) {
      state.accessToken = action.payload;
      sessionStorage.setItem('accessToken', action.payload);
    },
    logout(state) {
      state.user = null;
      state.profile = null;
      state.accessToken = null;
      state.isAuthenticated = false;
      sessionStorage.removeItem('accessToken');
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(bootstrapAuth.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.profile = action.payload.profile;
        state.isAuthenticated = true;
        state.initialized = true;
      })
      .addCase(bootstrapAuth.rejected, (state) => {
        state.user = null;
        state.profile = null;
        state.accessToken = null;
        state.isAuthenticated = false;
        state.initialized = true;
        sessionStorage.removeItem('accessToken');
      });
  },
});

export const { setCredentials, setAccessToken, logout } = authSlice.actions;
export default authSlice.reducer;