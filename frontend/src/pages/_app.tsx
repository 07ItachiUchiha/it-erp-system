import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import { AuthProvider } from '../contexts/AuthContext';
import { CurrencyProvider } from '../contexts/CurrencyContext';
import AuthGuard from '../components/auth/AuthGuard';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <CurrencyProvider>
        <AuthGuard>
          <Component {...pageProps} />
        </AuthGuard>
      </CurrencyProvider>
    </AuthProvider>
  );
}
