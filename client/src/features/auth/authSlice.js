import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const initialState = {
  user: null, // { _id, firstName, lastName, email, role, ... }
  profile: null, // PatientProfile or DoctorProfile, depending on role
  accessToken: null,
  isAuthenticated: false,
  initialized: false,
};

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