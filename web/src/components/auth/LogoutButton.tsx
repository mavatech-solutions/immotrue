import { useAuth } from '../../hooks/useAuth';

export default function LogoutButton() {
  const { logout } = useAuth();

  return (
    <button
      type="button"
      onClick={() => logout()}
      className="font-body text-sm text-text-secondary transition-colors duration-200 hover:text-text-primary"
    >
      Abmelden
    </button>
  );
}
