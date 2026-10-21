import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authApi } from '../api';
import Button from '../components/Button';
import Field from '../components/Field';
import ErrorBanner from '../components/ErrorBanner';
import { useAuthStore } from '../store/authStore';

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const setSession = useAuthStore((state) => state.setSession);
  const { register, handleSubmit } = useForm({
    defaultValues: { email: '', password: '' }
  });

  const mutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      setSession(data);
      navigate('/');
    }
  });

  return (
    <div className="mx-auto flex min-h-screen max-w-md items-center px-4 py-10">
      <div className="panel w-full rounded-2xl p-6">
        <div className="mb-6">
          <div className="text-2xl font-semibold text-slate-950">NexusFlow AI</div>
          <div className="mt-1 text-sm text-slate-600">Sign in to your document workspace.</div>
        </div>
        {searchParams.get('registered') === '1' ? (
          <div className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            Account created. Sign in with your new account.
          </div>
        ) : null}
        <ErrorBanner message={mutation.error?.response?.data?.message} />
        <form
          className="mt-4 space-y-4"
          onSubmit={handleSubmit((values) => mutation.mutate(values))}
        >
          <Field label="Email" type="email" {...register('email', { required: true })} />
          <Field label="Password" type="password" {...register('password', { required: true })} />
          <Button className="w-full" type="submit" disabled={mutation.isPending}>
            Login
          </Button>
        </form>
        <div className="mt-4 text-sm text-slate-600">
          New here? <Link className="font-medium text-teal-700" to="/register">Create an account</Link>
        </div>
      </div>
    </div>
  );
}
