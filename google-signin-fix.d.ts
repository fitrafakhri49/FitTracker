// // google-signin-fix.d.ts
// declare module '@react-native-google-signin/google-signin' {
//     export interface User {
//       id: string;
//       name: string | null;
//       email: string;
//       photo: string | null;
//       familyName: string | null;
//       givenName: string | null;
//     }
  
//     export interface SignInResponse {
//       user: User;
//       idToken?: string;
//       serverAuthCode?: string | null;
//     }
  
//     export interface ConfigureParams {
//       webClientId?: string;
//       offlineAccess?: boolean;
//       forceCodeForRefreshToken?: boolean;
//       scopes?: string[];
//     }
  
//     export const GoogleSignin: {
//       configure(params?: ConfigureParams): void;
//       hasPlayServices(params?: { showPlayServicesUpdateDialog: boolean }): Promise<boolean>;
//       signIn(): Promise<SignInResponse>;
//       signOut(): Promise<void>;
//       isSignedIn(): Promise<boolean>;
//       getCurrentUser(): Promise<SignInResponse | null>;
//       getTokens(): Promise<{ idToken: string; accessToken: string }>;
//     };
  
//     export const statusCodes: {
//       SIGN_IN_CANCELLED: string;
//       IN_PROGRESS: string;
//       PLAY_SERVICES_NOT_AVAILABLE: string;
//       SIGN_IN_REQUIRED: string;
//     };
//   }