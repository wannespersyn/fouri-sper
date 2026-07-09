import { LoginForm } from "@/app/login/login-form";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background p-5.5">
      <div className="w-full max-w-sm rounded-2xl border border-card-border bg-card p-7">
        <div className="mb-6 flex flex-col items-center gap-2.75 text-center">
          <div className="flex size-9.5 items-center justify-center rounded-[11px] bg-accent font-head text-xl font-extrabold text-white">
            F
          </div>
          <div>
            <div className="font-head text-lg font-extrabold tracking-tight">Fouri SPER</div>
            <div className="text-[11px] font-semibold text-[#8a8172]">kampplanner</div>
          </div>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
