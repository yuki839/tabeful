import { login } from "./actions";

export default function LoginPage() {
  return (
    <form>
      <button formAction={login}>Sign up</button>
    </form>
  );
}
