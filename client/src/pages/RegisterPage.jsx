import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../api';
import Button from '../components/Button';
import Field from '../components/Field';
import ErrorBanner from '../components/ErrorBanner';
import { useAuthStore } from '../store/authStore';

export default function RegisterPage() {
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);
  const { register, handleSubmit } = useForm();

  const mutation = useMutation({
    mutationFn: authApi.register,
    onSuccess: () => {
      logout();
      navigate('/login?registered=1');
    }
  });

  return (
    <div className="mx-auto flex min-h-screen max-w-md items-center px-4 py-10">
      <div className="panel w-full rounded-2xl p-6">
        <div className="mb-6">
          <div className="text-2xl font-semibold text-slate-950">Create account</div>
          <div className="mt-1 text-sm text-slate-600">Set up a workspace account.</div>
        </div>
        <ErrorBanner message={mutation.error?.response?.data?.message} />
        <form className="mt-4 space-y-4" onSubmit={handleSubmit((values) => mutation.mutate(values))}>
          <Field label="Name" {...register('name', { required: true })} />
          <Field label="Email" type="email" {...register('email', { required: true })} />
          <Field label="Password" type="password" {...register('password', { required: true, minLength: 6 })} />
          <Button className="w-full" type="submit" disabled={mutation.isPending}>
            Register
          </Button>
        </form>
        <div className="mt-4 text-sm text-slate-600">
          Already have an account? <Link className="font-medium text-teal-700" to="/login">Login</Link>
        </div>
      </div>
    </div>
  );
}
