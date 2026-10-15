import { useState } from 'react';
import Dialog from '../../components/Dialog';
import { useAuth } from './AuthProvider';
import { useToast } from '../../components/Toast';

const friendly = (message = '') => {
  if (/invalid login/i.test(message)) return 'E-mail ou senha incorretos.';
  if (/already registered/i.test(message)) return 'Este e-mail já tem conta. Tente entrar.';
  if (/password/i.test(message)) return 'A senha precisa ter pelo menos 6 caracteres.';
  return message || 'Algo deu errado. Tente de novo.';
};

export default function AuthDialog({ onClose, reason }) {
  const { signIn, signUp } = useAuth();
  const toast = useToast();
  const [mode, setMode] = useState('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      if (mode === 'signin') {
        await signIn(email, password);
        onClose();
      } else {
        const { needsConfirmation } = await signUp(email, password, name.trim());
        if (needsConfirmation) {
          toast.success('Conta criada! Confirme o e-mail que enviamos para entrar.');
          setMode('signin');
        } else {
          onClose();
        }
      }
    } catch (err) {
      setError(friendly(err.message));
    } finally {
      setBusy(false);
    }
  };

  const signup = mode === 'signup';
  return (
    <Dialog label={signup ? 'Criar conta' : 'Entrar'} onClose={onClose}>
      <h2 className="font-display text-2xl font-bold">{signup ? 'Criar conta' : 'Entrar'}</h2>
      <p className="mt-1 text-sm text-muted">
        {reason ?? 'Salve seus favoritos e publique fotos em qualquer dispositivo.'}
      </p>

      <form onSubmit={submit} className="mt-5 space-y-4">
        {signup && (
          <div>
            <label htmlFor="au-name" className="label">Nome</label>
            <input id="au-name" className="field" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
          </div>
        )}
        <div>
          <label htmlFor="au-email" className="label">E-mail</label>
          <input id="au-email" type="email" required className="field" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
        </div>
        <div>
          <label htmlFor="au-pass" className="label">Senha</label>
          <input
            id="au-pass"
            type="password"
            required
            minLength={6}
            className="field"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={signup ? 'new-password' : 'current-password'}
          />
        </div>

        {error && <p role="alert" className="text-sm font-medium text-brand">{error}</p>}

        <button type="submit" disabled={busy} className="btn btn-primary w-full py-3">
          {busy ? 'Aguarde…' : signup ? 'Criar conta' : 'Entrar'}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-muted">
        {signup ? 'Já tem conta?' : 'Ainda não tem conta?'}{' '}
        <button
          type="button"
          onClick={() => {
            setMode(signup ? 'signin' : 'signup');
            setError('');
          }}
          className="font-medium text-ink underline underline-offset-2"
        >
          {signup ? 'Entrar' : 'Criar conta'}
        </button>
      </p>
    </Dialog>
  );
}
